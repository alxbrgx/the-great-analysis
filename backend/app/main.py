from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.api.routes import fundamental, technical, portfolio, debt, search, market, private_credit

settings = get_settings()

app = FastAPI(
    title="The Great Analysis API",
    description="Comprehensive financial analysis platform",
    version="0.1.0",
)

# Explicit production origins (the deployed frontend), comma-separated in ALLOWED_ORIGINS
_prod_origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_prod_origins,
    # Allow any localhost / 127.0.0.1 port during dev (Vite picks 5173, 5174, 5175... depending on availability)
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|\[::1\]):\d+$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router, prefix="/api/v1", tags=["search"])
app.include_router(fundamental.router, prefix="/api/v1/fundamental", tags=["fundamental"])
app.include_router(technical.router, prefix="/api/v1/technical", tags=["technical"])
app.include_router(portfolio.router, prefix="/api/v1/portfolio", tags=["portfolio"])
app.include_router(debt.router, prefix="/api/v1/debt", tags=["debt"])
app.include_router(market.router, prefix="/api/v1/market", tags=["market"])
app.include_router(private_credit.router, prefix="/api/v1/private-credit", tags=["private-credit"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
