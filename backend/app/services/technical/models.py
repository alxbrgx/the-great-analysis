"""
Predictive models: ARIMA+GARCH, Monte Carlo, XGBoost/LightGBM classifier.
"""
import numpy as np
import pandas as pd
from app.utils.data_fetcher import get_price_history


class PredictiveModels:
    def __init__(self, ticker: str, period: str = "2y"):
        self.ticker = ticker
        df = get_price_history(ticker, period=period)
        self.close = df["Close"].dropna()
        self.returns = self.close.pct_change().dropna()

    def run_arima_garch(self) -> dict:
        from statsmodels.tsa.arima.model import ARIMA
        from arch import arch_model

        log_returns = np.log(1 + self.returns) * 100

        # ARIMA(1,0,1) on log returns
        arima = ARIMA(log_returns, order=(1, 0, 1)).fit()
        arima_forecast = arima.forecast(steps=30)

        # GARCH(1,1) on residuals
        garch = arch_model(arima.resid, vol="Garch", p=1, q=1).fit(disp="off")
        garch_forecast = garch.forecast(horizon=30)
        vol_forecast = np.sqrt(garch_forecast.variance.values[-1])

        return {
            "ticker": self.ticker,
            "model": "ARIMA(1,0,1) + GARCH(1,1)",
            "methodology": (
                "ARIMA models the conditional mean of log-returns. "
                "GARCH models the time-varying volatility of the residuals. "
                "Together they capture both direction and uncertainty."
            ),
            "arima_forecast_30d": arima_forecast.tolist(),
            "garch_vol_forecast_30d": vol_forecast.tolist(),
            "current_price": float(self.close.iloc[-1]),
            "historical_vol_annualized": float(self.returns.std() * np.sqrt(252)),
        }

    def run_monte_carlo(self, n_simulations: int = 1000, horizon: int = 252) -> dict:
        mu = self.returns.mean()
        sigma = self.returns.std()
        S0 = float(self.close.iloc[-1])

        np.random.seed(42)
        daily_returns = np.random.normal(mu, sigma, (horizon, n_simulations))
        price_paths = S0 * np.exp(np.cumsum(daily_returns, axis=0))

        final_prices = price_paths[-1]
        percentiles = {
            "p5": float(np.percentile(final_prices, 5)),
            "p25": float(np.percentile(final_prices, 25)),
            "p50": float(np.percentile(final_prices, 50)),
            "p75": float(np.percentile(final_prices, 75)),
            "p95": float(np.percentile(final_prices, 95)),
        }

        # Sample 100 paths for charting
        sampled = price_paths[:, :100].tolist()

        return {
            "ticker": self.ticker,
            "model": "Geometric Brownian Motion Monte Carlo",
            "methodology": (
                f"Simulates {n_simulations} price paths over {horizon} trading days "
                "using GBM with μ and σ estimated from historical returns. "
                "Assumes log-normal price distribution and constant drift/volatility."
            ),
            "current_price": S0,
            "horizon_days": horizon,
            "n_simulations": n_simulations,
            "percentiles": percentiles,
            "sampled_paths": sampled,
        }

    def run_ml_classifier(self) -> dict:
        import lightgbm as lgb
        from sklearn.model_selection import TimeSeriesSplit
        from sklearn.metrics import classification_report
        import warnings
        warnings.filterwarnings("ignore")

        df = pd.DataFrame({"close": self.close, "returns": self.returns})

        # Feature engineering
        df["rsi"] = self._compute_rsi(df["close"])
        df["macd"] = df["close"].ewm(12).mean() - df["close"].ewm(26).mean()
        df["bb_width"] = (
            df["close"].rolling(20).std() * 4 / df["close"].rolling(20).mean()
        )
        df["vol_20"] = df["returns"].rolling(20).std()
        df["mom_5"] = df["close"].pct_change(5)
        df["mom_20"] = df["close"].pct_change(20)

        # Label: 1 if next day return > 0
        df["target"] = (df["returns"].shift(-1) > 0).astype(int)
        df = df.dropna()

        X = df[["rsi", "macd", "bb_width", "vol_20", "mom_5", "mom_20"]]
        y = df["target"]

        if len(X) < 100:
            return {"error": "Not enough data for ML model (need 100+ days)"}

        tscv = TimeSeriesSplit(n_splits=5)
        model = lgb.LGBMClassifier(n_estimators=100, random_state=42, verbose=-1)

        scores = []
        for train_idx, test_idx in tscv.split(X):
            X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
            y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
            model.fit(X_train, y_train)
            scores.append(model.score(X_test, y_test))

        # Train on full data for final prediction
        model.fit(X, y)
        last_features = X.iloc[[-1]]
        prob_up = float(model.predict_proba(last_features)[0][1])

        signal = "BUY" if prob_up > 0.65 else "SELL" if prob_up < 0.35 else "NEUTRAL"

        return {
            "ticker": self.ticker,
            "model": "LightGBM Directional Classifier",
            "methodology": (
                "LightGBM trained on RSI, MACD, Bollinger Band width, realized volatility, "
                "and momentum features. Evaluated with TimeSeriesSplit to prevent data leakage. "
                "Signal only generated when probability confidence exceeds 65% threshold."
            ),
            "probability_up": prob_up,
            "signal": signal,
            "cv_accuracy_mean": float(np.mean(scores)),
            "cv_accuracy_std": float(np.std(scores)),
            "feature_importance": dict(zip(X.columns, model.feature_importances_.tolist())),
        }

    def _compute_rsi(self, series: pd.Series, window: int = 14) -> pd.Series:
        delta = series.diff()
        gain = delta.clip(lower=0).rolling(window).mean()
        loss = (-delta.clip(upper=0)).rolling(window).mean()
        rs = gain / loss
        return 100 - 100 / (1 + rs)
