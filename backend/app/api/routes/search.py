from fastapi import APIRouter, Query, HTTPException
from app.utils.data_fetcher import search_tickers, get_ticker_info
import yfinance as yf
import time

router = APIRouter()


@router.get("/search")
async def search(q: str = Query(..., min_length=1)):
    """Search tickers for the home page search bar."""
    try:
        results = search_tickers(q, limit=10)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ticker/{ticker}/overview")
async def ticker_overview(ticker: str):
    """Company overview — used on every analysis page header."""
    try:
        info = get_ticker_info(ticker.upper())
        return info
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Ticker {ticker} not found: {e}")


@router.get("/ticker/{ticker}/news")
async def ticker_news(ticker: str, limit: int = 12):
    """Recent news articles for a ticker via yfinance."""
    try:
        t = yf.Ticker(ticker.upper())
        raw = t.news or []
        articles = []
        for item in raw[:limit]:
            content = item.get("content", {})
            # yfinance >=0.2.x wraps news in a 'content' dict
            if content:
                thumbnail = ""
                thumbs = content.get("thumbnail", {})
                if thumbs and isinstance(thumbs, dict):
                    resolutions = thumbs.get("resolutions", [])
                    if resolutions:
                        thumbnail = resolutions[0].get("url", "")
                articles.append({
                    "title": content.get("title", ""),
                    "publisher": content.get("provider", {}).get("displayName", ""),
                    "link": content.get("canonicalUrl", {}).get("url", ""),
                    "published_at": content.get("pubDate", ""),
                    "summary": content.get("summary", ""),
                    "thumbnail": thumbnail,
                })
            else:
                # Older yfinance format
                ts = item.get("providerPublishTime", 0)
                articles.append({
                    "title": item.get("title", ""),
                    "publisher": item.get("publisher", ""),
                    "link": item.get("link", ""),
                    "published_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(ts)) if ts else "",
                    "summary": "",
                    "thumbnail": (item.get("thumbnail", {}).get("resolutions", [{}])[0].get("url", "")
                                  if item.get("thumbnail") else ""),
                })
        return {"ticker": ticker.upper(), "articles": articles}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
