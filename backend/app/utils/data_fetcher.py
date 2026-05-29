"""
Central data fetching layer.
All external API calls go through here so switching providers requires changing only this file.
"""
import yfinance as yf
import requests
import pandas as pd
from functools import lru_cache
from app.core.config import get_settings

settings = get_settings()


def get_ticker_info(ticker: str) -> dict:
    """Basic company info and current price via yfinance."""
    t = yf.Ticker(ticker)
    info = t.info
    return {
        "ticker": ticker.upper(),
        "name": info.get("longName", ""),
        "sector": info.get("sector", ""),
        "industry": info.get("industry", ""),
        "country": info.get("country", ""),
        "currency": info.get("currency", "USD"),
        "exchange": info.get("exchange", ""),
        "market_cap": info.get("marketCap"),
        "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
        "description": info.get("longBusinessSummary", ""),
        "website": info.get("website", ""),
        "employees": info.get("fullTimeEmployees"),
    }


def get_price_history(ticker: str, period: str = "2y", interval: str = "1d") -> pd.DataFrame:
    """OHLCV price history."""
    t = yf.Ticker(ticker)
    df = t.history(period=period, interval=interval)
    return df


def get_financial_statements(ticker: str) -> dict:
    """Income statement, balance sheet, cash flow (annual + quarterly)."""
    t = yf.Ticker(ticker)
    return {
        "income_annual": t.financials,
        "income_quarterly": t.quarterly_financials,
        "balance_annual": t.balance_sheet,
        "balance_quarterly": t.quarterly_balance_sheet,
        "cashflow_annual": t.cashflow,
        "cashflow_quarterly": t.quarterly_cashflow,
    }


def get_key_ratios_yf(ticker: str) -> dict:
    """Key financial ratios from yfinance info."""
    t = yf.Ticker(ticker)
    info = t.info
    return {
        "pe_ratio": info.get("trailingPE"),
        "forward_pe": info.get("forwardPE"),
        "pb_ratio": info.get("priceToBook"),
        "ps_ratio": info.get("priceToSalesTrailing12Months"),
        "ev_ebitda": info.get("enterpriseToEbitda"),
        "ev_revenue": info.get("enterpriseToRevenue"),
        "debt_to_equity": info.get("debtToEquity"),
        "current_ratio": info.get("currentRatio"),
        "quick_ratio": info.get("quickRatio"),
        "roe": info.get("returnOnEquity"),
        "roa": info.get("returnOnAssets"),
        "gross_margin": info.get("grossMargins"),
        "operating_margin": info.get("operatingMargins"),
        "profit_margin": info.get("profitMargins"),
        "revenue_growth": info.get("revenueGrowth"),
        "earnings_growth": info.get("earningsGrowth"),
        "dividend_yield": info.get("dividendYield"),
        "payout_ratio": info.get("payoutRatio"),
        "beta": info.get("beta"),
        "52w_high": info.get("fiftyTwoWeekHigh"),
        "52w_low": info.get("fiftyTwoWeekLow"),
        "short_ratio": info.get("shortRatio"),
        "analyst_target": info.get("targetMeanPrice"),
        "analyst_recommendation": info.get("recommendationMean"),
    }


def get_fmp_data(endpoint: str, params: dict = None) -> dict:
    """Generic FMP API call."""
    if not settings.fmp_api_key:
        return {}
    base = "https://financialmodelingprep.com/api/v3"
    p = {"apikey": settings.fmp_api_key, **(params or {})}
    r = requests.get(f"{base}/{endpoint}", params=p, timeout=10)
    r.raise_for_status()
    return r.json()


def get_fred_series(series_id: str, limit: int = 100) -> pd.DataFrame:
    """Fetch a FRED time series (rates, macro data)."""
    if not settings.fred_api_key:
        return pd.DataFrame()
    url = "https://api.stlouisfed.org/fred/series/observations"
    params = {
        "series_id": series_id,
        "api_key": settings.fred_api_key,
        "file_type": "json",
        "limit": limit,
        "sort_order": "desc",
    }
    r = requests.get(url, params=params, timeout=10)
    r.raise_for_status()
    data = r.json().get("observations", [])
    df = pd.DataFrame(data)[["date", "value"]]
    df["value"] = pd.to_numeric(df["value"], errors="coerce")
    df["date"] = pd.to_datetime(df["date"])
    return df.set_index("date").sort_index()


def search_tickers(query: str, limit: int = 10) -> list[dict]:
    """Search equity tickers by name or symbol via yfinance.
    Restricted to EQUITY only — excludes futures, FX, crypto, ETFs, indices.

    Falls back to direct ticker lookup if yf.Search returns 0 (it sometimes
    rate-limits or returns empty for short symbol queries like "AAPL").
    """
    import yfinance as yf

    def _safe_search(q: str) -> list[dict]:
        try:
            results = yf.Search(q, max_results=limit * 3)
            quotes = results.quotes if hasattr(results, 'quotes') else []
        except Exception:
            quotes = []
        return [
            {
                "symbol": qq.get("symbol", ""),
                "name": qq.get("longname") or qq.get("shortname", ""),
                "exchange": qq.get("exchange", ""),
                "type": qq.get("quoteType", ""),
            }
            for qq in quotes
            if qq.get("quoteType", "").upper() == "EQUITY"
        ]

    equity_only = _safe_search(query)

    # Fallback 1: if yf.Search returns nothing and the query looks like a symbol,
    # try to validate it directly as a ticker.
    if not equity_only and query and len(query) <= 8 and query.replace('.', '').replace('-', '').isalpha():
        try:
            t = yf.Ticker(query.upper())
            info = t.info or {}
            qt = (info.get("quoteType") or "").upper()
            if qt == "EQUITY" and info.get("symbol"):
                equity_only = [{
                    "symbol": info.get("symbol", query.upper()),
                    "name": info.get("longName") or info.get("shortName", query.upper()),
                    "exchange": info.get("exchange", ""),
                    "type": "EQUITY",
                }]
        except Exception:
            pass

    return equity_only[:limit]
