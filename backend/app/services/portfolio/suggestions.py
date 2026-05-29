"""
Asset suggestion engine — recommends complementary equity tickers.
All suggestions are pure equities so the optimizer always has full financial data.
"""
import yfinance as yf

SECTOR_PEERS: dict[str, list[str]] = {
    "Technology":             ["MSFT", "GOOGL", "META", "NVDA", "AAPL", "ADBE", "CRM", "INTC"],
    "Healthcare":             ["JNJ", "UNH", "PFE", "ABBV", "MRK", "TMO", "ABT", "BMY"],
    "Financials":             ["JPM", "BAC", "WFC", "GS", "MS", "BLK", "AXP", "C"],
    "Consumer Discretionary": ["AMZN", "TSLA", "HD", "MCD", "NKE", "SBUX", "LOW", "TJX"],
    "Energy":                 ["XOM", "CVX", "COP", "SLB", "EOG", "MPC", "PSX", "VLO"],
    "Industrials":            ["CAT", "HON", "UPS", "BA", "GE", "MMM", "LMT", "RTX"],
    "Consumer Staples":       ["PG", "KO", "PEP", "WMT", "COST", "PM", "MO", "CL"],
    "Real Estate":            ["AMT", "PLD", "CCI", "EQIX", "PSA", "O", "DLR", "SBAC"],
    "Utilities":              ["NEE", "DUK", "SO", "D", "EXC", "SRE", "AEP", "XEL"],
    "Materials":              ["LIN", "APD", "SHW", "ECL", "NEM", "FCX", "NUE", "VMC"],
    "Communication Services": ["GOOGL", "META", "NFLX", "DIS", "CMCSA", "T", "VZ", "TMUS"],
}

# Equity-only diversifiers: one per sector, chosen for low correlation to growth equities.
# All are large-cap stocks with reliable financial data — no ETFs, no bonds, no commodities.
EQUITY_DIVERSIFIERS: dict[str, str] = {
    "Consumer Staples":  "PG",   # defensive, low-beta
    "Healthcare":        "JNJ",  # defensive healthcare
    "Utilities":         "NEE",  # regulated utility
    "Energy":            "XOM",  # commodity-linked
    "Financials":        "JPM",  # rate-sensitive
    "Materials":         "LIN",  # global industrial materials
    "Industrials":       "CAT",  # cyclical industrial
    "Real Estate":       "AMT",  # REIT (equity, not bond)
}


def _diversifiers_for_sector(anchor_sector: str, n: int = 4) -> list[str]:
    """Pick equity diversifiers from sectors different from the anchor's sector."""
    return [
        sym for sector, sym in EQUITY_DIVERSIFIERS.items()
        if sector != anchor_sector
    ][:n]


def suggest_portfolio_assets(ticker: str, n: int = 8) -> dict:
    t = yf.Ticker(ticker)
    info = t.info
    sector = info.get("sector", "")
    name = info.get("longName", ticker)

    peers = [s for s in SECTOR_PEERS.get(sector, []) if s != ticker][:4]
    diversifiers = _diversifiers_for_sector(sector, n=4)

    suggestions = []
    for sym in peers + diversifiers:
        try:
            sym_info = yf.Ticker(sym).info
            sym_sector = sym_info.get("sector", "")
            suggestions.append({
                "ticker": sym,
                "name": sym_info.get("longName", sym),
                "sector": sym_sector,
                "rationale": (
                    f"Sector peer ({sector})" if sym in peers
                    else f"Cross-sector diversifier ({sym_sector})"
                ),
            })
        except Exception:
            continue

    return {
        "anchor_ticker": ticker,
        "anchor_name": name,
        "anchor_sector": sector,
        "suggestions": suggestions,
    }
