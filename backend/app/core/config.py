from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_env: str = "development"
    secret_key: str = "dev-secret-key"

    # Comma-separated list of allowed frontend origins in production
    # (e.g. "https://the-great-analysis.vercel.app"). Localhost is always allowed.
    allowed_origins: str = ""

    database_url: str = "sqlite+aiosqlite:///./tga_dev.db"
    redis_url: str = ""

    fmp_api_key: str = ""
    alpha_vantage_key: str = ""
    fred_api_key: str = ""
    polygon_api_key: str = ""

    # Cache TTL in seconds
    cache_ttl_price: int = 60        # 1 minute for live prices
    cache_ttl_fundamentals: int = 3600 * 6  # 6 hours for financial statements
    cache_ttl_rates: int = 3600      # 1 hour for reference rates

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
