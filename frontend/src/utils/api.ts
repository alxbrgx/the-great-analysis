import axios from 'axios'

// In prod, point at the deployed backend via VITE_API_BASE_URL.
// In dev (var unset), use the relative path so the Vite proxy forwards /api → localhost:8000.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 60_000,
})

export const searchTickers = (q: string) =>
  api.get<{ results: TickerResult[] }>('/search', { params: { q } }).then(r => r.data)

export const getTickerOverview = (ticker: string) =>
  api.get<TickerOverview>(`/ticker/${ticker}/overview`).then(r => r.data)

export const getFundamentalFull = (ticker: string) =>
  api.get(`/fundamental/${ticker}/full`).then(r => r.data)

export const getFundamentalStep = (ticker: string, step: number) =>
  api.get(`/fundamental/${ticker}/step/${step}`).then(r => r.data)

export const getTechnicalIndicators = (ticker: string, period = '1y') =>
  api.get(`/technical/${ticker}/indicators`, { params: { period } }).then(r => r.data)

export const getArimaGarch = (ticker: string) =>
  api.get(`/technical/${ticker}/arima-garch`).then(r => r.data)

export const getMonteCarlo = (ticker: string, simulations = 1000) =>
  api.get(`/technical/${ticker}/monte-carlo`, { params: { simulations } }).then(r => r.data)

export const getMlPrediction = (ticker: string) =>
  api.get(`/technical/${ticker}/ml-prediction`).then(r => r.data)

export const getPriceHistory = (ticker: string, period = '2y') =>
  api.get(`/technical/${ticker}/history`, { params: { period } }).then(r => r.data)

export const optimizePortfolio = (tickers: string[], budget: number, period = '1y') =>
  api.post('/portfolio/optimize', { tickers, budget, period }).then(r => r.data)

export const getEfficientFrontier = (tickers: string[], period = '1y') =>
  api.post('/portfolio/efficient-frontier', { tickers, period }).then(r => r.data)

export const getCumulativeReturns = (tickers: string[], period = '1y') =>
  api.post('/portfolio/cumulative-returns', { tickers, period }).then(r => r.data)

export const suggestAssets = (ticker: string) =>
  api.get(`/portfolio/suggest/${ticker}`).then(r => r.data)

export const getCompanyNews = (ticker: string) =>
  api.get(`/ticker/${ticker}/news`).then(r => r.data)

export const getDebtRatios = (ticker: string) =>
  api.get(`/debt/${ticker}/ratios`).then(r => r.data)

export const getStressTest = (ticker: string) =>
  api.get(`/debt/${ticker}/stress-test`).then(r => r.data)

export const getRecoveryAnalysis = (ticker: string) =>
  api.get(`/debt/${ticker}/recovery-analysis`).then(r => r.data)

export const getReferenceRates = () =>
  api.get('/debt/rates/reference').then(r => r.data)

export const getMarketOverview = () =>
  api.get('/market/overview').then(r => r.data)

export const analyzePrivateCredit = (payload: Record<string, unknown>) =>
  api.post('/private-credit/analyze', payload).then(r => r.data)

// Types
export interface TickerResult {
  symbol: string
  name: string
  exchange: string
  type: string
}

export interface TickerOverview {
  ticker: string
  name: string
  sector: string
  industry: string
  country: string
  currency: string
  market_cap: number
  current_price: number
  description: string
}
