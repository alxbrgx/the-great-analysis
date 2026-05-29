import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getFundamentalFull, getTickerOverview } from '../utils/api'
import { useTickerStore } from '../store/useTickerStore'
import { useWatchlistStore } from '../store/useWatchlistStore'
import TickerSearch from '../components/ui/TickerSearch'
import { TrendingUp, TrendingDown, Minus, ArrowLeftRight, Bookmark } from 'lucide-react'
import { SkeletonCard, Skeleton } from '../components/ui/Skeleton'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Metric {
  label: string
  key: string       // dot-path into data
  format?: 'pct' | 'x' | 'number' | 'string' | 'bn'
  higherIsBetter?: boolean  // undefined = neutral (no winner highlight)
}

// ── Metric definitions ────────────────────────────────────────────────────────

const SECTIONS: { title: string; metrics: Metric[] }[] = [
  {
    title: 'Price & Size',
    metrics: [
      { label: 'Price', key: 'overview.current_price', format: 'number' },
      { label: 'Market Cap', key: 'overview.market_cap', format: 'bn' },
      { label: 'Sector', key: 'overview.sector', format: 'string' },
    ],
  },
  {
    title: 'Profitability',
    metrics: [
      { label: 'Gross Margin', key: 'steps.step_5.data.gross_margin', format: 'pct', higherIsBetter: true },
      { label: 'Operating Margin', key: 'steps.step_6.data.margins.operating_margin', format: 'string', higherIsBetter: true },
      { label: 'Net Margin', key: 'steps.step_5.data.net_margin', format: 'pct', higherIsBetter: true },
      { label: 'ROE', key: 'steps.step_8.data.roe', format: 'string', higherIsBetter: true },
      { label: 'ROA', key: 'steps.step_8.data.roa', format: 'string', higherIsBetter: true },
    ],
  },
  {
    title: 'Growth',
    metrics: [
      { label: 'Revenue Growth', key: 'steps.step_3.data.revenue_growth_yoy', format: 'string', higherIsBetter: true },
      { label: 'Earnings Growth', key: 'steps.step_5.data.earnings_growth_yoy', format: 'string', higherIsBetter: true },
    ],
  },
  {
    title: 'Balance Sheet',
    metrics: [
      { label: 'Net Debt / EBITDA', key: 'steps.step_8.data.net_debt_ebitda', format: 'x', higherIsBetter: false },
      { label: 'Current Ratio', key: 'steps.step_8.data.current_ratio', format: 'number', higherIsBetter: true },
      { label: 'Leverage Assessment', key: 'steps.step_8.data.leverage_assessment', format: 'string' },
    ],
  },
  {
    title: 'Valuation',
    metrics: [
      { label: 'P/E', key: 'steps.step_10.data.pe_ratio', format: 'x', higherIsBetter: false },
      { label: 'Forward P/E', key: 'steps.step_10.data.forward_pe', format: 'x', higherIsBetter: false },
      { label: 'EV/EBITDA', key: 'steps.step_10.data.ev_ebitda', format: 'x', higherIsBetter: false },
      { label: 'P/B', key: 'steps.step_10.data.pb_ratio', format: 'x', higherIsBetter: false },
      { label: 'P/E Assessment', key: 'steps.step_10.data.valuation_summary.pe_assessment', format: 'string' },
    ],
  },
  {
    title: 'Analyst View',
    metrics: [
      { label: 'Analyst Target', key: 'steps.step_9.data.analyst_target_price', format: 'number', higherIsBetter: true },
      { label: 'Implied Upside', key: 'steps.step_9.data.implied_upside', format: 'string', higherIsBetter: true },
      { label: 'PEG Ratio', key: 'steps.step_9.data.peg_ratio', format: 'x', higherIsBetter: false },
      { label: 'Consensus', key: 'steps.step_11.data.analyst_consensus_label', format: 'string' },
    ],
  },
  {
    title: 'Composite Score',
    metrics: [
      { label: 'Final Score', key: 'final_score', format: 'number', higherIsBetter: true },
      { label: 'Rating', key: 'rating', format: 'string' },
    ],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function deepGet(obj: any, path: string): any {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

function formatValue(v: any, fmt?: string): string {
  if (v == null || v === '' || v === 'N/A') return '—'
  if (fmt === 'pct') {
    const n = typeof v === 'string' ? parseFloat(v) : v
    return isNaN(n) ? String(v) : `${(n * 100).toFixed(1)}%`
  }
  if (fmt === 'x') {
    const n = typeof v === 'string' ? parseFloat(v) : v
    return isNaN(n) ? String(v) : `${n.toFixed(2)}×`
  }
  if (fmt === 'bn') {
    const n = typeof v === 'number' ? v : parseFloat(v)
    if (isNaN(n)) return String(v)
    return n >= 1e12 ? `$${(n / 1e12).toFixed(2)}T` : n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : `$${(n / 1e6).toFixed(0)}M`
  }
  if (fmt === 'number') {
    const n = typeof v === 'number' ? v : parseFloat(v)
    return isNaN(n) ? String(v) : n.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }
  return String(v)
}

function numericValue(v: any, fmt?: string): number | null {
  if (v == null || v === 'N/A' || v === '—') return null
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace('%', '').replace('×', '').replace('$', '').replace(/,/g, ''))
  return isNaN(n) ? null : n
}

// ── Rating colors ─────────────────────────────────────────────────────────────

const RATING_COLOR: Record<string, string> = {
  'Strong Buy': 'text-emerald-400', 'Buy': 'text-green-400', 'Hold': 'text-yellow-400',
  'Sell': 'text-orange-400', 'Strong Sell': 'text-red-400',
}

// ── Score step mini bar ───────────────────────────────────────────────────────

function ScoreGrid({ steps }: { steps: any }) {
  if (!steps) return null
  return (
    <div className="grid grid-cols-12 gap-1 mt-3">
      {Array.from({ length: 12 }).map((_, i) => {
        const s = steps[`step_${i + 1}`]?.score ?? 0
        return (
          <div key={i} title={`Step ${i + 1}: ${s > 0 ? '+' : ''}${s.toFixed(2)}`}
            className={`h-1.5 rounded-full ${s > 0.1 ? 'bg-emerald-500' : s < -0.1 ? 'bg-red-500' : 'bg-muted/25'}`} />
        )
      })}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ComparePage() {
  const globalTicker = useTickerStore(s => s.ticker)
  const watchedTickers = useWatchlistStore(s => s.publicItems)
  const [tickerA, setTickerA] = useState(globalTicker || '')
  const [tickerB, setTickerB] = useState('')

  const readyA = tickerA.length >= 1
  const readyB = tickerB.length >= 1

  const { data: overviewA, isLoading: loadOA } = useQuery({
    queryKey: ['overview', tickerA], queryFn: () => import('../utils/api').then(m => m.getTickerOverview(tickerA)),
    enabled: readyA,
  })
  const { data: overviewB, isLoading: loadOB } = useQuery({
    queryKey: ['overview', tickerB], queryFn: () => import('../utils/api').then(m => m.getTickerOverview(tickerB)),
    enabled: readyB,
  })
  const { data: fundA, isLoading: loadFA } = useQuery({
    queryKey: ['fundamental', tickerA], queryFn: () => getFundamentalFull(tickerA),
    enabled: readyA,
  })
  const { data: fundB, isLoading: loadFB } = useQuery({
    queryKey: ['fundamental', tickerB], queryFn: () => getFundamentalFull(tickerB),
    enabled: readyB,
  })

  const dataA = fundA ? { ...fundA, overview: overviewA } : overviewA ? { overview: overviewA } : null
  const dataB = fundB ? { ...fundB, overview: overviewB } : overviewB ? { overview: overviewB } : null

  const loadingA = loadOA || loadFA
  const loadingB = loadOB || loadFB
  const hasResults = (dataA || dataB) && (readyA || readyB)

  const swap = () => { setTickerA(tickerB); setTickerB(tickerA) }

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="card">
        <h1 className="text-xl font-semibold text-gray-100">Compare</h1>
        <p className="text-sm text-muted mt-1">Side-by-side fundamental comparison of two tickers</p>
      </div>

      {/* Quick pick from watchlist */}
      {watchedTickers.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <Bookmark size={12} className="text-violet-400 shrink-0" />
          <span className="text-muted shrink-0">Quick pick:</span>
          {watchedTickers.slice(0, 8).map(item => (
            <div key={item.id} className="flex items-center gap-0.5">
              <button
                onClick={() => setTickerA(item.ticker)}
                className="text-[10px] font-mono text-blue-400 hover:bg-blue-950/30 border border-blue-900/40 px-1.5 py-0.5 rounded-l transition"
                title={`Set as Ticker A: ${item.ticker}`}
              >
                A·{item.ticker}
              </button>
              <button
                onClick={() => setTickerB(item.ticker)}
                className="text-[10px] font-mono text-emerald-400 hover:bg-emerald-950/30 border border-emerald-900/40 px-1.5 py-0.5 rounded-r border-l-0 transition"
                title={`Set as Ticker B: ${item.ticker}`}
              >
                B
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Ticker selectors */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
        <div className="space-y-2">
          <p className="text-xs text-muted font-mono uppercase tracking-wider">Ticker A</p>
          <TickerSearch
            initialValue={tickerA}
            onSelect={s => setTickerA(s)}
            placeholder="e.g. AAPL"
          />
          {tickerA && (
            <div className="flex items-center gap-2 pt-1">
              <div className="w-3 h-3 rounded-full bg-blue-400 shrink-0" />
              <span className="text-xs font-mono text-blue-400">{tickerA}</span>
              {overviewA && <span className="text-xs text-muted truncate">{overviewA.name}</span>}
            </div>
          )}
        </div>

        <button onClick={swap} title="Swap A and B"
          className="mt-6 p-2 rounded-lg border border-border text-muted hover:border-accent/40 hover:text-accent transition-all">
          <ArrowLeftRight size={16} />
        </button>

        <div className="space-y-2">
          <p className="text-xs text-muted font-mono uppercase tracking-wider">Ticker B</p>
          <TickerSearch
            initialValue={tickerB}
            onSelect={s => setTickerB(s)}
            placeholder="e.g. MSFT"
          />
          {tickerB && (
            <div className="flex items-center gap-2 pt-1">
              <div className="w-3 h-3 rounded-full bg-violet-400 shrink-0" />
              <span className="text-xs font-mono text-violet-400">{tickerB}</span>
              {overviewB && <span className="text-xs text-muted truncate">{overviewB.name}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Loading states */}
      {(loadingA || loadingB) && (
        <div className="grid grid-cols-2 gap-4">
          {loadingA && <SkeletonCard />}
          {loadingB && <SkeletonCard />}
        </div>
      )}

      {/* Summary headers */}
      {hasResults && (
        <div className="grid grid-cols-[200px_1fr_1fr] gap-4">
          <div />
          {/* A header */}
          <div className={`card border-2 ${tickerA ? 'border-blue-800/40' : 'border-border'}`}>
            {dataA ? (
              <>
                <p className="text-lg font-mono font-semibold text-blue-400">{tickerA}</p>
                <p className="text-xs text-muted mt-0.5">{overviewA?.name}</p>
                <p className="text-xs text-muted/60 mt-0.5 font-mono">{overviewA?.sector}</p>
                {fundA && (
                  <>
                    <p className={`text-sm font-bold font-mono mt-2 ${RATING_COLOR[fundA.rating] || 'text-gray-300'}`}>
                      {fundA.rating}
                    </p>
                    <ScoreGrid steps={fundA.steps} />
                  </>
                )}
              </>
            ) : (
              <p className="text-xs text-muted/50">Select ticker A</p>
            )}
          </div>
          {/* B header */}
          <div className={`card border-2 ${tickerB ? 'border-violet-800/40' : 'border-border'}`}>
            {dataB ? (
              <>
                <p className="text-lg font-mono font-semibold text-violet-400">{tickerB}</p>
                <p className="text-xs text-muted mt-0.5">{overviewB?.name}</p>
                <p className="text-xs text-muted/60 mt-0.5 font-mono">{overviewB?.sector}</p>
                {fundB && (
                  <>
                    <p className={`text-sm font-bold font-mono mt-2 ${RATING_COLOR[fundB.rating] || 'text-gray-300'}`}>
                      {fundB.rating}
                    </p>
                    <ScoreGrid steps={fundB.steps} />
                  </>
                )}
              </>
            ) : (
              <p className="text-xs text-muted/50">Select ticker B</p>
            )}
          </div>
        </div>
      )}

      {/* Metrics table */}
      {hasResults && SECTIONS.map(section => (
        <div key={section.title} className="card space-y-0 py-3 px-4">
          <p className="text-xs text-muted/60 uppercase tracking-widest font-mono mb-3">{section.title}</p>
          {section.metrics.map(metric => {
            const rawA = deepGet(dataA, metric.key)
            const rawB = deepGet(dataB, metric.key)
            const fmtA = formatValue(rawA, metric.format)
            const fmtB = formatValue(rawB, metric.format)
            const nA = numericValue(rawA, metric.format)
            const nB = numericValue(rawB, metric.format)

            let winA = false, winB = false
            if (metric.higherIsBetter !== undefined && nA != null && nB != null && nA !== nB) {
              winA = metric.higherIsBetter ? nA > nB : nA < nB
              winB = !winA
            }

            return (
              <div key={metric.label} className="grid grid-cols-[200px_1fr_1fr] items-center py-2 border-b border-border/25 last:border-0 gap-4">
                <span className="text-xs text-muted/70 leading-tight">{metric.label}</span>
                {/* A value */}
                <div className={`flex items-center gap-1.5 ${winA ? 'text-emerald-400' : fmtA === '—' ? 'text-muted/40' : 'text-gray-300'}`}>
                  {winA && <TrendingUp size={11} className="shrink-0" />}
                  {winB && fmtA !== '—' && <TrendingDown size={11} className="text-red-400/60 shrink-0" />}
                  {!winA && !winB && fmtA !== '—' && nA != null && nB != null && <Minus size={11} className="text-muted/30 shrink-0" />}
                  <span className="text-xs font-mono">{fmtA}</span>
                </div>
                {/* B value */}
                <div className={`flex items-center gap-1.5 ${winB ? 'text-emerald-400' : fmtB === '—' ? 'text-muted/40' : 'text-gray-300'}`}>
                  {winB && <TrendingUp size={11} className="shrink-0" />}
                  {winA && fmtB !== '—' && <TrendingDown size={11} className="text-red-400/60 shrink-0" />}
                  {!winA && !winB && fmtB !== '—' && nA != null && nB != null && <Minus size={11} className="text-muted/30 shrink-0" />}
                  <span className="text-xs font-mono">{fmtB}</span>
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {/* Empty state */}
      {!hasResults && !loadingA && !loadingB && (
        <div className="card text-center py-16">
          <p className="text-muted/60 text-sm">Enter two tickers above to compare them side by side.</p>
          <p className="text-muted/40 text-xs mt-2">The full 12-step fundamental analysis will run for each ticker.</p>
        </div>
      )}
    </div>
  )
}
