"""
Technical indicators computed from OHLCV data.
All computed locally — no paid API needed.
"""
import pandas as pd
import numpy as np
from app.utils.data_fetcher import get_price_history


def _clean(series) -> list:
    """Convert a pandas Series or list to JSON-safe list, replacing NaN/Inf with None."""
    return [None if (v is None or v != v or (isinstance(v, float) and np.isinf(v))) else float(v)
            for v in series]


class TechnicalIndicators:
    def __init__(self, ticker: str, period: str = "1y"):
        self.ticker = ticker
        self.df = get_price_history(ticker, period=period)

    def compute_all(self) -> dict:
        df = self.df.copy()
        close = df["Close"]
        high = df["High"]
        low = df["Low"]
        volume = df["Volume"]

        result = {
            "ticker": self.ticker,
            "dates": [str(d.date()) for d in df.index],
            "ohlcv": {
                "open": _clean(df["Open"]),
                "high": _clean(high),
                "low": _clean(low),
                "close": _clean(close),
                "volume": _clean(volume),
            },
        }

        # RSI (14)
        delta = close.diff()
        gain = delta.clip(lower=0).rolling(14).mean()
        loss = (-delta.clip(upper=0)).rolling(14).mean()
        rs = gain / loss
        result["rsi"] = _clean(100 - 100 / (1 + rs))

        # MACD (12, 26, 9)
        ema12 = close.ewm(span=12, adjust=False).mean()
        ema26 = close.ewm(span=26, adjust=False).mean()
        macd_line = ema12 - ema26
        signal_line = macd_line.ewm(span=9, adjust=False).mean()
        result["macd"] = {
            "macd": _clean(macd_line),
            "signal": _clean(signal_line),
            "histogram": _clean(macd_line - signal_line),
        }

        # Bollinger Bands (20, 2σ)
        sma20 = close.rolling(20).mean()
        std20 = close.rolling(20).std()
        result["bollinger"] = {
            "upper": _clean(sma20 + 2 * std20),
            "middle": _clean(sma20),
            "lower": _clean(sma20 - 2 * std20),
        }

        # ATR (14)
        tr = pd.concat([
            high - low,
            (high - close.shift()).abs(),
            (low - close.shift()).abs(),
        ], axis=1).max(axis=1)
        result["atr"] = _clean(tr.rolling(14).mean())

        # OBV
        obv = (np.sign(close.diff()) * volume).fillna(0).cumsum()
        result["obv"] = _clean(obv)

        # Moving averages
        result["sma"] = {
            "sma20": _clean(close.rolling(20).mean()),
            "sma50": _clean(close.rolling(50).mean()),
            "sma200": _clean(close.rolling(200).mean()),
        }
        result["ema"] = {
            "ema12": _clean(ema12),
            "ema26": _clean(ema26),
        }

        return result
