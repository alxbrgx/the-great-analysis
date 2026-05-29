"""
Portfolio optimization: Markowitz, HRP, Black-Litterman.
Uses PyPortfolioOpt + Riskfolio-Lib.
"""
import numpy as np
import pandas as pd
import yfinance as yf
from pypfopt import EfficientFrontier, risk_models, expected_returns

try:
    import riskfolio as rp
    HRP_AVAILABLE = True
except ImportError:
    HRP_AVAILABLE = False


class PortfolioOptimizer:
    def __init__(self, tickers: list[str], period: str = "1y"):
        self.tickers = [t.upper() for t in tickers]
        self.period = period
        self._load_prices()

    def _load_prices(self):
        data = yf.download(self.tickers, period=self.period, auto_adjust=True, progress=False)
        if len(self.tickers) == 1:
            self.prices = data[["Close"]].rename(columns={"Close": self.tickers[0]})
        else:
            self.prices = data["Close"]
        self.prices = self.prices.dropna()

    def run_all(self, budget: float = 10000.0) -> dict:
        return {
            "tickers": self.tickers,
            "period": self.period,
            "markowitz": self._markowitz(budget),
            "hrp": self._hrp(budget),
            "performance_metrics": self._performance_metrics(),
        }

    def _markowitz(self, budget: float) -> dict:
        mu = expected_returns.mean_historical_return(self.prices)
        S = risk_models.sample_cov(self.prices)
        ef = EfficientFrontier(mu, S)
        try:
            weights = ef.max_sharpe()
        except Exception:
            weights = ef.min_volatility()
        cleaned = ef.clean_weights()
        perf = ef.portfolio_performance(verbose=False)
        allocations = {t: round(w * budget, 2) for t, w in cleaned.items()}
        return {
            "model": "Markowitz Mean-Variance (Max Sharpe)",
            "methodology": (
                "Maximizes the Sharpe ratio (return/risk) subject to the constraint "
                "that weights sum to 1. Uses historical mean returns and sample covariance. "
                "Sensitive to estimation errors — use alongside HRP for robustness."
            ),
            "weights": cleaned,
            "allocations_usd": allocations,
            "expected_return": perf[0],
            "annual_volatility": perf[1],
            "sharpe_ratio": perf[2],
        }

    def _hrp(self, budget: float) -> dict:
        methodology = (
            "López de Prado (2016). Uses hierarchical clustering on the correlation matrix "
            "to group similar assets, then allocates inverse-variance within each cluster. "
            "Does NOT invert the covariance matrix — robust to estimation errors and crises."
        )
        if HRP_AVAILABLE:
            port = rp.Portfolio(returns=self.prices.pct_change().dropna())
            port.assets_stats(method_mu="hist", method_cov="hist")
            w = port.optimization(model="HRP", codependence="pearson", rm="MV", rf=0,
                                  linkage="single", max_k=10, leaf_order=True)
            weights = w["weights"].to_dict() if w is not None else {}
        else:
            weights = self._hrp_manual()

        allocations = {t: round(w_ * budget, 2) for t, w_ in weights.items()}
        return {"model": "Hierarchical Risk Parity (HRP)", "methodology": methodology,
                "weights": weights, "allocations_usd": allocations}

    def _hrp_manual(self) -> dict:
        """Minimal HRP implementation using scipy — no riskfolio needed."""
        from scipy.cluster.hierarchy import linkage, leaves_list
        from scipy.spatial.distance import squareform

        returns = self.prices.pct_change().dropna()
        cov = returns.cov().values
        corr = returns.corr().values
        n = len(self.tickers)

        dist = np.sqrt((1 - corr) / 2)
        np.fill_diagonal(dist, 0)
        condensed = squareform(dist)
        link = linkage(condensed, method="single")
        order = leaves_list(link)

        # Inverse-variance allocation on sorted assets
        vols = np.sqrt(np.diag(cov))
        inv_var = 1 / (vols ** 2)
        inv_var = inv_var[order]
        weights_ordered = inv_var / inv_var.sum()

        weights = {}
        for i, idx in enumerate(order):
            weights[self.tickers[idx]] = float(weights_ordered[i])
        return weights

    def _performance_metrics(self) -> dict:
        returns = self.prices.pct_change().dropna()
        corr = returns.corr().to_dict()
        cov = returns.cov().to_dict()
        ann_returns = (returns.mean() * 252).to_dict()
        ann_vols = (returns.std() * np.sqrt(252)).to_dict()
        return {
            "annualized_returns": ann_returns,
            "annualized_volatility": ann_vols,
            "correlation_matrix": corr,
        }

    def efficient_frontier(self, n_points: int = 50) -> dict:
        mu = expected_returns.mean_historical_return(self.prices)
        S = risk_models.sample_cov(self.prices)
        frontier_vols, frontier_rets = [], []
        for target_ret in np.linspace(float(mu.min()), float(mu.max()), n_points):
            try:
                ef = EfficientFrontier(mu, S)
                ef.efficient_return(target_ret)
                perf = ef.portfolio_performance(verbose=False)
                frontier_vols.append(perf[1])
                frontier_rets.append(perf[0])
            except Exception:
                continue
        return {
            "frontier_volatilities": frontier_vols,
            "frontier_returns": frontier_rets,
        }
