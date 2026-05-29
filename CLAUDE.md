# The Great Analysis — Project Memory

## Project Overview
A comprehensive financial analysis web platform combining fundamental analysis, technical analysis, portfolio optimization, and debt analysis for publicly traded companies.

## Target Users
1. **Phase 1 (current)**: Individual investors / students — public tickers, free data sources
2. **Phase 2 (future)**: Financial institutions — private company data, internal Excel uploads, email integration, analyst workflows (~200-300 companies per analyst scope)

## Tech Stack
- **Backend**: Python 3.11+ / FastAPI / Uvicorn
- **Frontend**: React 18 / TypeScript / Tailwind CSS / Vite
- **Database**: PostgreSQL (persistent) + Redis (cache layer)
- **Charts**: Plotly.js + Recharts
- **Data sources (free tier)**: yfinance, FMP free, SEC EDGAR, FRED API

## Project Structure
```
the-great-analysis/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # FastAPI routers (one per analysis module)
│   │   ├── core/                # Config, database, security
│   │   ├── services/
│   │   │   ├── fundamental/     # 12-step fundamental analysis
│   │   │   ├── technical/       # ARIMA, GARCH, MACD, RSI, Monte Carlo, ML models
│   │   │   ├── portfolio/       # Markowitz, HRP, Black-Litterman, RL
│   │   │   └── debt/            # Debt ratios, stress testing, recovery analysis
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic schemas (request/response)
│   │   └── utils/               # Data fetchers, formatters, cache helpers
│   └── tests/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ui/              # Reusable dark-theme UI primitives
│       │   ├── charts/          # Shared chart wrappers
│       │   ├── fundamental/     # 12-step analysis components
│       │   ├── technical/       # Technical analysis + ML charts
│       │   ├── portfolio/       # Portfolio builder components
│       │   └── debt/            # Debt analysis components
│       ├── pages/               # Route-level pages (Home, Fundamental, Technical, Portfolio, Debt)
│       ├── hooks/               # Custom React hooks (useTicker, useAnalysis, etc.)
│       ├── store/               # Zustand global state (selected ticker, portfolio)
│       ├── utils/               # API client, formatters
│       └── types/               # TypeScript interfaces
├── data/
│   ├── cache/                   # Local JSON cache for development
│   └── exports/                 # Generated reports
└── docs/                        # Architecture decisions, API docs
```

## The 5 Main Pages
1. **Home** (`/`) — Search bar, project description, asset suggestions
2. **Fundamental** (`/fundamental/:ticker`) — 12-step analysis with final recommendation
3. **Technical** (`/technical/:ticker`) — Predictive charts, ML models, historical metrics
4. **Portfolio** (`/portfolio`) — Portfolio builder with Markowitz, HRP, Black-Litterman
5. **Debt** (`/debt/:ticker`) — Complete debt analysis, stress testing, rate benchmarks

## Fundamental Analysis — 12 Steps (from user methodology)
Steps to be confirmed from the uploaded methodology document.
Each step produces: raw data + analysis + conclusion card + impact on final recommendation.
Final output: short paragraph + rating (Strong Sell / Sell / Hold / Buy / Strong Buy).

## Technical Analysis Modules (priority order)
1. Price history + OHLCV display
2. MACD, RSI, Bollinger Bands (standard indicators)
3. ARIMA + GARCH (volatility modeling)
4. Monte Carlo simulation (price distribution)
5. ML models: XGBoost/LightGBM (directional prediction)
6. LSTM / Temporal Fusion Transformer (time series deep learning)
7. Pairs Trading analysis
8. Ensemble model (stacking)

## Portfolio Analysis Modules
1. Markowitz Mean-Variance Optimization
2. Hierarchical Risk Parity (HRP) — López de Prado
3. Black-Litterman model
4. Hidden Markov Models (regime detection)
5. Deep Reinforcement Learning (policy optimization)
6. Multi-Factor Models

## Debt Analysis Modules
- Net Debt / EBITDA, Gearing, Interest Coverage, DSCR, FCF
- Liquidity analysis (cash + RCF)
- Stress testing (revenue -20%, rate shock)
- Recovery analysis (Loss Given Default)
- Reference rates: SOFR, EURIBOR, Fed Funds (via FRED API)
- Rating agency context (S&P, Moody's, Fitch methodology)

## Design Guidelines
- Theme: Dark / Black (#0a0a0a background, #1a1a1a cards, #10b981 accent green)
- Language: English only
- No emojis, no fantasy names — sober and professional
- Each chart has an info panel explaining the methodology
- Responsive design (desktop priority)

## Data Sources & Cost
| Source | Use | Cost |
|--------|-----|------|
| yfinance | Price history, basic fundamentals | Free |
| FMP (financialmodelingprep.com) | 10-K/10-Q data, ratios, DCF | Free (250 req/day) / $15/mo |
| SEC EDGAR | Official filings, raw financial data | Free |
| FRED | Reference rates (SOFR, Fed Funds, EURIBOR) | Free |
| Alpha Vantage | Technical indicators backup | Free (25 req/day) |
| Polygon.io | Real-time data (future paid tier) | $29/mo |
| OpenAI / Anthropic | AI-powered analysis summaries (future) | Per token |

## Development Philosophy
- Build free-first: get everything working with free APIs
- Design for replaceability: data fetchers are isolated in utils/
- Cache aggressively: save API responses in Redis / local JSON during dev
- Scalable from day 1: FastAPI async, PostgreSQL ready for multi-user

## Current Status (last updated: 2026-04-29)
- [x] Project structure created
- [x] Backend setup (FastAPI + dependencies) — venv at backend/venv/
- [x] Frontend setup (React + Vite + Tailwind)
- [x] Home page — live market ticker bar, featured stocks, module cards, keyboard search
- [x] Ticker search with suggestions
- [x] Data fetching layer (yfinance + FMP)
- [x] Fundamental analysis (12 steps) — full methodology from "Les 12 travaux de l'analyste financier"
- [x] Technical analysis charts — ARIMA+GARCH, Monte Carlo (1000 paths), LightGBM, RSI, MACD, Bollinger
- [x] Portfolio optimizer — Markowitz Max Sharpe + HRP (scipy fallback), Efficient Frontier
- [x] Debt analysis — Net Debt/EBITDA, ICR, DSCR, FCF, Stress test, Recovery/LGD, FRED rates
- [x] InfoTooltip component — hover tooltips with formula + description + interpretation
- [x] EXPLANATIONS dictionary — ~40 entries covering all metrics across all 4 pages
- [x] Tooltips wired into all 4 analysis pages (Fundamental, Technical, Portfolio, Debt)
- [x] Market overview endpoint — parallel fetch of 8 indices + 8 featured stocks (FRED key in backend/.env)

## Key Files
- `backend/.env` — FRED_API_KEY (do not commit)
- `backend/app/services/fundamental/analyzer.py` — 12-step analysis engine
- `backend/app/services/technical/models.py` — ARIMA, GARCH, Monte Carlo, LightGBM
- `backend/app/services/portfolio/optimizer.py` — Markowitz + HRP (HRP_AVAILABLE flag)
- `backend/app/services/debt/analyzer.py` — credit ratios + stress test + recovery
- `backend/app/api/routes/market.py` — /api/v1/market/overview (ThreadPoolExecutor)
- `frontend/src/components/ui/InfoTooltip.tsx` — reusable hover tooltip, viewport-aware
- `frontend/src/data/explanations.ts` — central EXPLANATIONS dictionary (~40 metrics)
- `frontend/src/pages/` — Home, FundamentalPage, TechnicalPage, PortfolioPage, DebtPage

## Next Steps (backlog)
- Export PDF report feature
- Correlation heatmap in Portfolio
- FMP API key for richer 10-K/10-Q data
- riskfolio-lib proper install for full HRP
- Black-Litterman model

## Session Notes
- User works in VS Code + Claude Code
- Step-by-step guidance needed (not fully autonomous)
- Goal: commercializable B2B product for financial institutions
- FRED API key: in backend/.env (real key, not placeholder)
- riskfolio-lib not installed — HRP uses scipy fallback (_hrp_manual)
