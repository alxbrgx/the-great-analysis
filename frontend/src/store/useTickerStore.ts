import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TickerStore {
  ticker: string
  setTicker: (ticker: string) => void
  portfolioTickers: string[]
  setPortfolioTickers: (tickers: string[]) => void
  portfolioBudget: number
  setPortfolioBudget: (budget: number) => void
}

export const useTickerStore = create<TickerStore>()(
  persist(
    (set) => ({
      ticker: '',
      setTicker: (ticker) => set({ ticker }),
      portfolioTickers: [],
      setPortfolioTickers: (portfolioTickers) => set({ portfolioTickers }),
      portfolioBudget: 10000,
      setPortfolioBudget: (portfolioBudget) => set({ portfolioBudget }),
    }),
    {
      name: 'tga-portfolio',
      partialize: (state) => ({
        portfolioTickers: state.portfolioTickers,
        portfolioBudget: state.portfolioBudget,
      }),
    }
  )
)
