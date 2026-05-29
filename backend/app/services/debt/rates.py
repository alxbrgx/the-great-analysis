"""
Reference interest rates via FRED API.
Free, no authentication required for basic access (API key optional).
"""
import requests
import pandas as pd
from app.core.config import get_settings

settings = get_settings()

FRED_SERIES = {
    "fed_funds_rate": "FEDFUNDS",
    "sofr": "SOFR",
    "us_10y_treasury": "GS10",
    "us_2y_treasury": "GS2",
    "us_30y_treasury": "GS30",
    "euribor_3m": "EUR3MTD156N",
    "ecb_rate": "ECBDFR",
    "libor_3m_usd": "USD3MTD156N",
}


def get_reference_rates() -> dict:
    results = {}
    for name, series_id in FRED_SERIES.items():
        try:
            url = "https://api.stlouisfed.org/fred/series/observations"
            params = {
                "series_id": series_id,
                "file_type": "json",
                "limit": 24,
                "sort_order": "desc",
            }
            if settings.fred_api_key:
                params["api_key"] = settings.fred_api_key
            else:
                params["api_key"] = "abcdefghijklmnopqrstuvwxyz123456"  # FRED allows anonymous

            r = requests.get(url, params=params, timeout=8)
            if r.status_code == 200:
                obs = r.json().get("observations", [])
                if obs:
                    latest = next((o for o in obs if o["value"] != "."), None)
                    history = [
                        {"date": o["date"], "value": float(o["value"])}
                        for o in reversed(obs) if o["value"] != "."
                    ]
                    results[name] = {
                        "series_id": series_id,
                        "current_value": float(latest["value"]) if latest else None,
                        "date": latest["date"] if latest else None,
                        "history": history,
                    }
        except Exception as e:
            results[name] = {"error": str(e)}

    return {
        "rates": results,
        "note": "Source: Federal Reserve Economic Data (FRED), St. Louis Fed",
    }
