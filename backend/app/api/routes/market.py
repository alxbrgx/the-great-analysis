from fastapi import APIRouter, HTTPException
import yfinance as yf
import asyncio
from concurrent.futures import ThreadPoolExecutor

router = APIRouter()

# Grouped indices with category metadata
INDICES = {
    # Equities
    "S&P 500":    {"sym": "^GSPC",     "cat": "Equities"},
    "NASDAQ":     {"sym": "^IXIC",     "cat": "Equities"},
    "Dow Jones":  {"sym": "^DJI",      "cat": "Equities"},
    "FTSE 100":   {"sym": "^FTSE",     "cat": "Equities"},
    "DAX":        {"sym": "^GDAXI",    "cat": "Equities"},
    "Nikkei 225": {"sym": "^N225",     "cat": "Equities"},
    # Volatility & Rates
    "VIX":        {"sym": "^VIX",      "cat": "Volatility"},
    "10Y UST":    {"sym": "^TNX",      "cat": "Rates"},
    "2Y UST":     {"sym": "^IRX",      "cat": "Rates"},
    # Commodities
    "Gold":       {"sym": "GC=F",      "cat": "Commodities"},
    "Oil (WTI)":  {"sym": "CL=F",      "cat": "Commodities"},
    "Silver":     {"sym": "SI=F",      "cat": "Commodities"},
    # FX
    "EUR/USD":    {"sym": "EURUSD=X",  "cat": "FX"},
    "GBP/USD":    {"sym": "GBPUSD=X",  "cat": "FX"},
    "USD/JPY":    {"sym": "JPY=X",     "cat": "FX"},
    # Crypto
    "Bitcoin":    {"sym": "BTC-USD",   "cat": "Crypto"},
    "Ethereum":   {"sym": "ETH-USD",   "cat": "Crypto"},
}

FEATURED = ["AAPL", "MSFT", "NVDA", "GOOGL", "JPM", "TSLA", "AMZN", "META"]

# Display order for the ticker bar
TICKER_BAR_ORDER = [
    "S&P 500", "NASDAQ", "Dow Jones", "FTSE 100", "DAX", "Nikkei 225",
    "VIX", "10Y UST", "2Y UST",
    "Gold", "Oil (WTI)", "Silver",
    "EUR/USD", "GBP/USD", "USD/JPY",
    "Bitcoin", "Ethereum",
]


def _fetch_quote(name: str, sym: str, cat: str) -> dict:
    try:
        t = yf.Ticker(sym)
        info = t.info
        price = info.get("regularMarketPrice") or info.get("currentPrice")
        prev = info.get("regularMarketPreviousClose")
        change_pct = ((price - prev) / prev * 100) if price and prev and prev != 0 else None
        change_abs = (price - prev) if price and prev else None

        # Format price based on category
        if price is None:
            price_fmt = "—"
        elif cat == "Rates":
            price_fmt = f"{price:.2f}%"
        elif cat == "FX":
            price_fmt = f"{price:.4f}"
        elif cat == "Crypto":
            price_fmt = f"${price:,.0f}" if price > 1000 else f"${price:,.2f}"
        elif price > 10000:
            price_fmt = f"{price:,.0f}"
        elif price > 100:
            price_fmt = f"{price:,.2f}"
        else:
            price_fmt = f"{price:.2f}"

        return {
            "name": name,
            "category": cat,
            "price": round(price, 4) if price else None,
            "price_fmt": price_fmt,
            "change_pct": round(change_pct, 2) if change_pct is not None else None,
            "change_abs": round(change_abs, 2) if change_abs is not None else None,
            "prev_close": round(prev, 4) if prev else None,
        }
    except Exception:
        return {"name": name, "category": cat, "price": None, "price_fmt": "—",
                "change_pct": None, "change_abs": None, "prev_close": None}


def _fetch_stock(ticker: str) -> dict:
    try:
        t = yf.Ticker(ticker)
        info = t.info
        price = info.get("regularMarketPrice") or info.get("currentPrice")
        prev = info.get("regularMarketPreviousClose")
        change = ((price - prev) / prev) if price and prev and prev != 0 else None
        return {
            "ticker": ticker,
            "name": info.get("longName") or info.get("shortName", ticker),
            "sector": info.get("sector", ""),
            "price": round(price, 2) if price else None,
            "change_pct": round(change * 100, 2) if change is not None else None,
            "market_cap": info.get("marketCap"),
        }
    except Exception:
        return {"ticker": ticker, "name": ticker, "price": None, "change_pct": None}


@router.get("/overview")
async def market_overview():
    """Live market indices + featured tickers for the home page."""
    try:
        with ThreadPoolExecutor(max_workers=20) as executor:
            index_futures = {
                name: executor.submit(_fetch_quote, name, meta["sym"], meta["cat"])
                for name, meta in INDICES.items()
            }
            stock_futures = [executor.submit(_fetch_stock, t) for t in FEATURED]

            indices = {name: fut.result() for name, fut in index_futures.items()}
            stocks = [fut.result() for fut in stock_futures]

        return {
            "indices": indices,
            "featured": stocks,
            "ticker_bar_order": TICKER_BAR_ORDER,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
