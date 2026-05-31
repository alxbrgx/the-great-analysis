from fastapi import APIRouter, Query, HTTPException
from app.utils.data_fetcher import search_tickers, get_ticker_info
import yfinance as yf
import time
import requests
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from urllib.parse import quote_plus

router = APIRouter()


def _google_news(query: str, limit: int = 12) -> list[dict]:
    """Search Google News RSS by free-text query (a company name).

    Unlike yfinance, this is a keyword search rather than a ticker lookup, so it
    returns results for listed *and* unlisted companies. No API key required.
    Returns headline + source + date + link (no thumbnails or summaries).
    """
    if not query:
        return []
    url = (
        "https://news.google.com/rss/search?q="
        + quote_plus(query)
        + "&hl=en-US&gl=US&ceid=US:en"
    )
    try:
        resp = requests.get(url, timeout=6, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        root = ET.fromstring(resp.content)
    except Exception:
        return []

    articles = []
    for item in root.findall(".//item")[:limit]:
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        if not title or not link:
            continue
        source_el = item.find("source")
        publisher = (source_el.text or "").strip() if source_el is not None else ""
        # Google appends " - {source}" to titles; strip it for a clean headline.
        if publisher and title.endswith(f" - {publisher}"):
            title = title[: -(len(publisher) + 3)].strip()
        try:
            published_at = parsedate_to_datetime(item.findtext("pubDate") or "").isoformat()
        except Exception:
            published_at = ""
        articles.append({
            "title": title,
            "publisher": publisher,
            "link": link,
            "published_at": published_at,
            "summary": "",
            "thumbnail": "",
            "source_feed": "google",
        })
    return articles


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
    """Recent news for a ticker: yfinance (rich, but often empty) merged with a
    Google News search on the company name (fills the gaps, works for any name)."""
    ticker = ticker.upper()
    articles = []
    name = ""

    # 1) yfinance — has thumbnails + summaries, but is ticker-based and frequently empty.
    try:
        t = yf.Ticker(ticker)
        info = t.info or {}
        name = info.get("longName") or info.get("shortName") or ""
        raw = t.news or []
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
                    "source_feed": "yfinance",
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
                    "source_feed": "yfinance",
                })
    except Exception:
        pass  # never let yfinance break the endpoint — Google News still runs below

    # 2) Google News RSS by company name — fills gaps and works for unlisted names too.
    query = name or ticker
    seen = {(a.get("title") or "").strip().lower() for a in articles}
    for g in _google_news(query, limit=limit):
        key = g["title"].strip().lower()
        if key in seen:
            continue
        seen.add(key)
        articles.append(g)

    return {"ticker": ticker, "articles": articles[:limit], "query": query}
