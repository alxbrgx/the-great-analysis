import time
from fastapi import APIRouter, HTTPException
from app.services.debt.analyzer import DebtAnalyzer
from app.utils.cache import cache_get, cache_set

router = APIRouter()

_TTL = 600   # 10 min for debt analysis
_TTL_RATES = 1800  # 30 min for reference rates (FRED updates daily)


@router.get("/{ticker}/ratios")
async def debt_ratios(ticker: str):
    key = f"debt:ratios:{ticker.upper()}"
    cached = cache_get(key)
    if cached:
        return cached
    try:
        analyzer = DebtAnalyzer(ticker.upper())
        result = analyzer.compute_ratios()
        if isinstance(result, dict):
            result["fetched_at"] = int(time.time())
        cache_set(key, result, _TTL)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticker}/stress-test")
async def stress_test(ticker: str):
    key = f"debt:stress:{ticker.upper()}"
    cached = cache_get(key)
    if cached:
        return cached
    try:
        analyzer = DebtAnalyzer(ticker.upper())
        result = analyzer.stress_test()
        if isinstance(result, dict):
            result["fetched_at"] = int(time.time())
        cache_set(key, result, _TTL)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticker}/recovery-analysis")
async def recovery_analysis(ticker: str):
    key = f"debt:recovery:{ticker.upper()}"
    cached = cache_get(key)
    if cached:
        return cached
    try:
        analyzer = DebtAnalyzer(ticker.upper())
        result = analyzer.recovery_analysis()
        if isinstance(result, dict):
            result["fetched_at"] = int(time.time())
        cache_set(key, result, _TTL)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rates/reference")
async def reference_rates():
    key = "debt:rates:reference"
    cached = cache_get(key)
    if cached:
        return cached
    try:
        from app.services.debt.rates import get_reference_rates
        result = get_reference_rates()
        if isinstance(result, dict):
            result["fetched_at"] = int(time.time())
        cache_set(key, result, _TTL_RATES)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
