from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.portfolio.optimizer import PortfolioOptimizer
import numpy as np
import yfinance as yf

router = APIRouter()


class PortfolioRequest(BaseModel):
    tickers: list[str]
    budget: float = 10000.0
    period: str = "1y"


@router.post("/optimize")
async def optimize(req: PortfolioRequest):
    """Run Markowitz, HRP, and Black-Litterman on the given portfolio."""
    try:
        opt = PortfolioOptimizer(req.tickers, period=req.period)
        return opt.run_all(budget=req.budget)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/efficient-frontier")
async def efficient_frontier(req: PortfolioRequest):
    """Generate the efficient frontier curve."""
    try:
        opt = PortfolioOptimizer(req.tickers, period=req.period)
        return opt.efficient_frontier()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cumulative-returns")
async def cumulative_returns(req: PortfolioRequest):
    """Return cumulative returns per ticker + equal-weight portfolio vs. S&P 500 benchmark."""
    try:
        tickers_with_spy = list(set(req.tickers + ["SPY"]))
        data = yf.download(tickers_with_spy, period=req.period, auto_adjust=True, progress=False)
        if len(tickers_with_spy) == 1:
            prices = data[["Close"]].rename(columns={"Close": tickers_with_spy[0]})
        else:
            prices = data["Close"]
        prices = prices.dropna()

        returns = prices.pct_change().dropna()
        cum = (1 + returns).cumprod()

        # Equal-weight portfolio
        ticker_cols = [t for t in req.tickers if t in cum.columns]
        if ticker_cols:
            equal_weight = cum[ticker_cols].mean(axis=1)
        else:
            equal_weight = cum.iloc[:, 0]

        dates = [d.strftime("%Y-%m-%d") for d in cum.index]
        result = {
            "dates": dates,
            "tickers": {},
            "equal_weight_portfolio": equal_weight.tolist(),
            "spy_benchmark": cum["SPY"].tolist() if "SPY" in cum.columns else [],
        }
        for t in req.tickers:
            if t in cum.columns:
                result["tickers"][t] = cum[t].tolist()

        # Risk metrics per ticker
        risk = {}
        for t in req.tickers:
            if t in returns.columns:
                r = returns[t]
                ann_ret = float(r.mean() * 252)
                ann_vol = float(r.std() * np.sqrt(252))
                sharpe = ann_ret / ann_vol if ann_vol > 0 else 0
                cumr = (1 + r).cumprod()
                roll_max = cumr.cummax()
                drawdown = (cumr - roll_max) / roll_max
                max_dd = float(drawdown.min())
                var_95 = float(np.percentile(r, 5))
                risk[t] = {
                    "ann_return": ann_ret,
                    "ann_volatility": ann_vol,
                    "sharpe": round(sharpe, 2),
                    "max_drawdown": max_dd,
                    "var_95": var_95,
                }
        result["risk_metrics"] = risk

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/suggest/{ticker}")
async def suggest_assets(ticker: str):
    """Suggest complementary assets to build a portfolio around the given ticker."""
    try:
        from app.services.portfolio.suggestions import suggest_portfolio_assets
        return suggest_portfolio_assets(ticker.upper())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
