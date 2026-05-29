import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublicWatchItem {
  id: string                  // unique id (uuid)
  ticker: string              // e.g. "AAPL", "TSLA"
  addedAt: number             // epoch ms
  notes?: string              // free-text notes
  alertThresholds?: {         // optional credit alerts
    ndEbitdaMax?: number      // alert if Net Debt/EBITDA > X
    icrMin?: number           // alert if ICR < X
    priceDropPct?: number     // alert if price drops >X% since added
  }
  // cached snapshot fields (refreshed on load)
  lastSnapshot?: {
    fetchedAt: number
    price?: number | null
    marketCap?: number | null
    netDebtEbitda?: number | null
    icr?: number | null
    sector?: string | null
  }
}

export interface PrivateDealItem {
  id: string                  // unique id
  companyName: string
  industry: string
  fiscalYear: number
  currency: string
  savedAt: number             // epoch ms
  // Snapshot of the form input
  formSnapshot: Record<string, any>
  // Snapshot of the analysis result
  resultSnapshot: {
    ratios: {
      nd_ebitda: number | null
      icr: number | null
      dscr: number | null
      fcf: number
      ebitda_margin: number | null
      cash_conversion: number | null
    }
    assessment: {
      verdict: string
      total_score: number
      max_score: number
      implied_rating: { sp: string; moodys: string; fitch: string }
    }
    covenantsStatus: 'OK' | 'WARNING' | 'BREACH' | null
  }
  notes?: string
  tags?: string[]              // e.g. ['LBO', 'Tech', 'Bridgepoint']
}

interface WatchlistStore {
  // Public tickers watchlist
  publicItems: PublicWatchItem[]
  addPublic: (ticker: string, notes?: string) => string
  removePublic: (id: string) => void
  updatePublic: (id: string, patch: Partial<PublicWatchItem>) => void
  updatePublicSnapshot: (ticker: string, snapshot: PublicWatchItem['lastSnapshot']) => void

  // Private deals
  privateDeals: PrivateDealItem[]
  savePrivateDeal: (deal: Omit<PrivateDealItem, 'id' | 'savedAt'>) => string
  removePrivateDeal: (id: string) => void
  updatePrivateDeal: (id: string, patch: Partial<PrivateDealItem>) => void
  getPrivateDealById: (id: string) => PrivateDealItem | undefined

  // Bulk
  clearAll: () => void
}

const genId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export const useWatchlistStore = create<WatchlistStore>()(
  persist(
    (set, get) => ({
      publicItems: [],
      addPublic: (ticker, notes) => {
        const t = ticker.trim().toUpperCase()
        if (!t) return ''
        // dedupe by ticker
        const existing = get().publicItems.find(item => item.ticker === t)
        if (existing) return existing.id
        const id = genId()
        set(state => ({
          publicItems: [
            { id, ticker: t, addedAt: Date.now(), notes },
            ...state.publicItems,
          ],
        }))
        return id
      },
      removePublic: (id) =>
        set(state => ({ publicItems: state.publicItems.filter(i => i.id !== id) })),
      updatePublic: (id, patch) =>
        set(state => ({
          publicItems: state.publicItems.map(i => i.id === id ? { ...i, ...patch } : i),
        })),
      updatePublicSnapshot: (ticker, snapshot) =>
        set(state => ({
          publicItems: state.publicItems.map(i =>
            i.ticker === ticker.toUpperCase() ? { ...i, lastSnapshot: snapshot } : i
          ),
        })),

      privateDeals: [],
      savePrivateDeal: (deal) => {
        const id = genId()
        set(state => ({
          privateDeals: [
            { id, savedAt: Date.now(), ...deal },
            ...state.privateDeals,
          ],
        }))
        return id
      },
      removePrivateDeal: (id) =>
        set(state => ({ privateDeals: state.privateDeals.filter(d => d.id !== id) })),
      updatePrivateDeal: (id, patch) =>
        set(state => ({
          privateDeals: state.privateDeals.map(d => d.id === id ? { ...d, ...patch } : d),
        })),
      getPrivateDealById: (id) => get().privateDeals.find(d => d.id === id),

      clearAll: () => set({ publicItems: [], privateDeals: [] }),
    }),
    {
      name: 'tga-watchlist',
      version: 2,
      // Rescue any persisted state where arrays might be missing/corrupted
      migrate: (persistedState: any, _version) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return { publicItems: [], privateDeals: [] }
        }
        return {
          ...persistedState,
          publicItems: Array.isArray(persistedState.publicItems) ? persistedState.publicItems : [],
          privateDeals: Array.isArray(persistedState.privateDeals) ? persistedState.privateDeals : [],
        }
      },
      // Last-resort: ensure arrays after rehydration too
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!Array.isArray(state.publicItems)) state.publicItems = []
          if (!Array.isArray(state.privateDeals)) state.privateDeals = []
        }
      },
    }
  )
)
