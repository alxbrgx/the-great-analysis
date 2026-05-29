import time
from fastapi import APIRouter, HTTPException
from app.services.fundamental.analyzer import FundamentalAnalyzer
from app.utils.cache import cache_get, cache_set

router = APIRouter()

# TTL: full analysis is expensive — cache for 10 minutes
_TTL = 600


@router.get("/{ticker}/full")
async def full_analysis(ticker: str):
    """Run all 12 steps of the fundamental analysis."""
    key = f"fundamental:full:{ticker.upper()}"
    cached = cache_get(key)
    if cached:
        return cached
    try:
        analyzer = FundamentalAnalyzer(ticker.upper())
        result = await analyzer.run_full_analysis()
        result["fetched_at"] = int(time.time())
        cache_set(key, result, _TTL)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticker}/step/{step_number}")
async def single_step(ticker: str, step_number: int):
    """Run a single step of the fundamental analysis (1-12)."""
    if step_number < 1 or step_number > 12:
        raise HTTPException(status_code=400, detail="Step must be between 1 and 12")
    key = f"fundamental:step:{ticker.upper()}:{step_number}"
    cached = cache_get(key)
    if cached:
        return cached
    try:
        analyzer = FundamentalAnalyzer(ticker.upper())
        result = await analyzer.run_step(step_number)
        result["fetched_at"] = int(time.time())
        cache_set(key, result, _TTL)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticker}/recommendation")
async def recommendation(ticker: str):
    """Final recommendation paragraph and rating."""
    key = f"fundamental:rec:{ticker.upper()}"
    cached = cache_get(key)
    if cached:
        return cached
    try:
        analyzer = FundamentalAnalyzer(ticker.upper())
        result = await analyzer.get_recommendation()
        result["fetched_at"] = int(time.time())
        cache_set(key, result, _TTL)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
