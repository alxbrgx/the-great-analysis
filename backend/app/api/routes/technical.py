import time
from fastapi import APIRouter, HTTPException, Query
from app.services.technical.indicators import TechnicalIndicators
from app.services.technical.models import PredictiveModels
from app.utils.cache import cache_get, cache_set

router = APIRouter()

# ML / ARIMA / GARCH are very slow — cache 15 min
# Indicators and history — 5 min
_TTL_HEAVY = 900
_TTL_LIGHT = 300


def _wrap(result: dict | list) -> dict:
    if isinstance(result, dict):
        result["fetched_at"] = int(time.time())
        return result
    return {"data": result, "fetched_at": int(time.time())}


@router.get("/{ticker}/indicators")
async def indicators(ticker: str, period: str = Query("1y")):
    key = f"technical:indicators:{ticker.upper()}:{period}"
    cached = cache_get(key)
    if cached:
        return cached
    try:
        ti = TechnicalIndicators(ticker.upper(), period=period)
        result = _wrap(ti.compute_all())
        cache_set(key, result, _TTL_LIGHT)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticker}/arima-garch")
async def arima_garch(ticker: str):
    key = f"technical:arima:{ticker.upper()}"
    cached = cache_get(key)
    if cached:
        return cached
    try:
        models = PredictiveModels(ticker.upper())
        result = _wrap(models.run_arima_garch())
        cache_set(key, result, _TTL_HEAVY)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticker}/monte-carlo")
async def monte_carlo(ticker: str, simulations: int = Query(1000, le=10000), horizon: int = Query(252)):
    key = f"technical:mc:{ticker.upper()}:{simulations}:{horizon}"
    cached = cache_get(key)
    if cached:
        return cached
    try:
        models = PredictiveModels(ticker.upper())
        result = _wrap(models.run_monte_carlo(n_simulations=simulations, horizon=horizon))
        cache_set(key, result, _TTL_HEAVY)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticker}/ml-prediction")
async def ml_prediction(ticker: str):
    key = f"technical:ml:{ticker.upper()}"
    cached = cache_get(key)
    if cached:
        return cached
    try:
        models = PredictiveModels(ticker.upper())
        result = _wrap(models.run_ml_classifier())
        cache_set(key, result, _TTL_HEAVY)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticker}/history")
async def price_history(ticker: str, period: str = Query("2y"), interval: str = Query("1d")):
    key = f"technical:history:{ticker.upper()}:{period}:{interval}"
    cached = cache_get(key)
    if cached:
        return cached
    try:
        from app.utils.data_fetcher import get_price_history
        df = get_price_history(ticker.upper(), period=period, interval=interval)
        result = {
            "ticker": ticker.upper(),
            "data": df.reset_index().to_dict(orient="records"),
            "fetched_at": int(time.time()),
        }
        cache_set(key, result, _TTL_LIGHT)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
