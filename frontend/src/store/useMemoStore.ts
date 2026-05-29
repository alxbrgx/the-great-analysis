import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MemoStatus = 'draft' | 'in_review' | 'final'
export type MemoRecommendation = 'undecided' | 'approve' | 'approve_with_conditions' | 'decline'

export interface CreditMemoSections {
  executiveSummary: string
  investmentThesis: string         // 3-5 bullets
  businessDescription: string
  industryAnalysis: string
  financialHighlights: string      // commentary on numbers
  capitalStructure: string
  creditMetricsCommentary: string
  covenantsCommentary: string
  stressTestCommentary: string
  risksAndMitigants: string        // structured: risk → mitigant
  sponsorAndManagement: string
  recommendationRationale: string
  proposedPricing: string
  conditionsPrecedent: string
}

export interface CreditMemo {
  id: string
  dealId: string                   // links to PrivateDealItem (or 'public:TICKER')
  title: string                    // e.g. "Project Phoenix — IC Memo"
  version: number                  // 1, 2, 3...
  status: MemoStatus
  recommendation: MemoRecommendation
  createdAt: number
  updatedAt: number
  sections: CreditMemoSections
  authorName?: string              // analyst name for cover page
}

// ─── Default empty sections ───────────────────────────────────────────────────

export const EMPTY_SECTIONS: CreditMemoSections = {
  executiveSummary: '',
  investmentThesis: '',
  businessDescription: '',
  industryAnalysis: '',
  financialHighlights: '',
  capitalStructure: '',
  creditMetricsCommentary: '',
  covenantsCommentary: '',
  stressTestCommentary: '',
  risksAndMitigants: '',
  sponsorAndManagement: '',
  recommendationRationale: '',
  proposedPricing: '',
  conditionsPrecedent: '',
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface MemoStore {
  memos: CreditMemo[]

  createMemo: (dealId: string, title: string, version?: number) => string
  updateMemo: (id: string, patch: Partial<Omit<CreditMemo, 'id'>>) => void
  updateSection: (id: string, key: keyof CreditMemoSections, content: string) => void
  setStatus: (id: string, status: MemoStatus) => void
  setRecommendation: (id: string, recommendation: MemoRecommendation) => void
  duplicateAsNewVersion: (id: string) => string
  deleteMemo: (id: string) => void

  getMemoById: (id: string) => CreditMemo | undefined
  getMemosByDealId: (dealId: string) => CreditMemo[]
}

const genId = () =>
  `memo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export const useMemoStore = create<MemoStore>()(
  persist(
    (set, get) => ({
      memos: [],

      createMemo: (dealId, title, version = 1) => {
        const id = genId()
        const now = Date.now()
        set(state => ({
          memos: [
            {
              id, dealId, title, version,
              status: 'draft',
              recommendation: 'undecided',
              createdAt: now,
              updatedAt: now,
              sections: { ...EMPTY_SECTIONS },
            },
            ...state.memos,
          ],
        }))
        return id
      },

      updateMemo: (id, patch) =>
        set(state => ({
          memos: state.memos.map(m =>
            m.id === id ? { ...m, ...patch, updatedAt: Date.now() } : m
          ),
        })),

      updateSection: (id, key, content) =>
        set(state => ({
          memos: state.memos.map(m =>
            m.id === id
              ? {
                  ...m,
                  sections: { ...m.sections, [key]: content },
                  updatedAt: Date.now(),
                }
              : m
          ),
        })),

      setStatus: (id, status) =>
        set(state => ({
          memos: state.memos.map(m =>
            m.id === id ? { ...m, status, updatedAt: Date.now() } : m
          ),
        })),

      setRecommendation: (id, recommendation) =>
        set(state => ({
          memos: state.memos.map(m =>
            m.id === id ? { ...m, recommendation, updatedAt: Date.now() } : m
          ),
        })),

      duplicateAsNewVersion: (id) => {
        const original = get().memos.find(m => m.id === id)
        if (!original) return ''
        const newId = genId()
        const now = Date.now()
        const sameDealMemos = get().memos.filter(m => m.dealId === original.dealId)
        const maxVersion = Math.max(...sameDealMemos.map(m => m.version))
        set(state => ({
          memos: [
            {
              ...original,
              id: newId,
              version: maxVersion + 1,
              status: 'draft',
              createdAt: now,
              updatedAt: now,
              title: original.title.replace(/v\d+$/, `v${maxVersion + 1}`) ||
                     `${original.title} v${maxVersion + 1}`,
            },
            ...state.memos,
          ],
        }))
        return newId
      },

      deleteMemo: (id) =>
        set(state => ({ memos: state.memos.filter(m => m.id !== id) })),

      getMemoById: (id) => get().memos.find(m => m.id === id),
      getMemosByDealId: (dealId) =>
        get().memos.filter(m => m.dealId === dealId)
                   .sort((a, b) => b.updatedAt - a.updatedAt),
    }),
    {
      name: 'tga-memos',
      version: 2,
      migrate: (persistedState: any, _v) => {
        if (!persistedState || typeof persistedState !== 'object') return { memos: [] }
        return {
          ...persistedState,
          memos: Array.isArray(persistedState.memos) ? persistedState.memos : [],
        }
      },
      onRehydrateStorage: () => (state) => {
        if (state && !Array.isArray(state.memos)) state.memos = []
      },
    }
  )
)
