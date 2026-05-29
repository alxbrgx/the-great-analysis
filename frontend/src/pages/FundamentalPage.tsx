import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useWatchlistStore } from '../store/useWatchlistStore'
import { useQuery } from '@tanstack/react-query'
import { getFundamentalFull, getTickerOverview } from '../utils/api'
import { Clock, ChevronRight, TrendingUp, TrendingDown, Minus, Download, FileText, Newspaper, BarChart3, BookOpen, SlidersHorizontal } from 'lucide-react'
import Plot from 'react-plotly.js'
import InfoTooltip from '../components/ui/InfoTooltip'
import { EXPLANATIONS } from '../data/explanations'
import { generateOnePager, generateMemo, generateEarningsSummary, generateIRSummary } from '../utils/pdfReports'
import NewsFeed from '../components/ui/NewsFeed'
import DataFreshness from '../components/ui/DataFreshness'
import ErrorState from '../components/ui/ErrorState'
import { SkeletonCard, SkeletonText, Skeleton } from '../components/ui/Skeleton'

interface RatingStyle { text: string; bg: string; border: string }
const RATING_STYLE: Record<string, RatingStyle> = {
  'Strong Buy':  { text: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-700/50' },
  'Buy':         { text: 'text-green-400',   bg: 'bg-green-900/20',   border: 'border-green-700/50' },
  'Hold':        { text: 'text-yellow-400',  bg: 'bg-yellow-900/20',  border: 'border-yellow-700/50' },
  'Sell':        { text: 'text-orange-400',  bg: 'bg-orange-900/20',  border: 'border-orange-700/50' },
  'Strong Sell': { text: 'text-red-400',     bg: 'bg-red-900/20',     border: 'border-red-700/50' },
}

const RATINGS = ['Strong Sell', 'Sell', 'Hold', 'Buy', 'Strong Buy']

const STEP_LABELS = [
  'Business Overview', 'Market & Sector', 'Competitive Position', 'Management & Governance',
  'Business Model', 'Income Statement', 'Cash Flows', 'Balance Sheet',
  'Earnings Estimates', 'Valuation', 'Stock Reputation', 'Re-rating Catalysts',
]

const DARK_LAYOUT_BASE = {
  paper_bgcolor: '#1a1a1a', plot_bgcolor: '#111111',
  font: { color: '#9ca3af', size: 10, family: 'JetBrains Mono, monospace' },
  xaxis: { gridcolor: '#222222', linecolor: '#2a2a2a', tickfont: { size: 10 } },
  yaxis: { gridcolor: '#222222', linecolor: '#2a2a2a', tickfont: { size: 10 } },
  margin: { t: 20, r: 16, b: 40, l: 56 },
}

function scoreColor(score: number) {
  if (score > 0.2) return 'text-emerald-400'
  if (score < -0.2) return 'text-red-400'
  return 'text-muted'
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.abs(score) * 100)
  const positive = score >= 0
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-surface rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${positive ? 'bg-emerald-500' : 'bg-red-500'}`}
          style={{ width: `${pct}%`, marginLeft: positive ? '50%' : `${50 - pct}%` }}
        />
      </div>
      <span className={`text-xs font-mono ${scoreColor(score)}`}>
        {score > 0 ? '+' : ''}{score.toFixed(2)}
      </span>
    </div>
  )
}

function HistoryBarChart({ series, label, color = '#10b981' }: { series: Record<string, number | null>; label: string; color?: string }) {
  const entries = Object.entries(series)
    .filter(([, v]) => v != null)
    .sort(([a], [b]) => a.localeCompare(b))
  if (entries.length < 2) return null
  const years = entries.map(([y]) => y)
  const values = entries.map(([, v]) => {
    const n = v as number
    return Math.abs(n) >= 1e9 ? +(n / 1e9).toFixed(2) : +(n / 1e6).toFixed(0)
  })
  const unit = Math.abs(entries[0][1] as number) >= 1e9 ? 'B' : 'M'
  return (
    <Plot
      data={[{ type: 'bar', x: years, y: values, marker: { color: values.map(v => v >= 0 ? color : '#ef4444'), opacity: 0.85 }, name: label }]}
      layout={{ ...DARK_LAYOUT_BASE, height: 180, yaxis: { ...DARK_LAYOUT_BASE.yaxis, title: { text: `$${unit}`, font: { color: '#6b7280', size: 10 } }, tickprefix: '$' }, showlegend: false } as any}
      style={{ width: '100%' }}
      config={{ responsive: true, displayModeBar: false }}
    />
  )
}

function DataRow({ label, value, tooltip }: { label: string; value: any; tooltip?: string }) {
  const display = value == null || value === '' ? '—' : String(value).length > 80 ? String(value).slice(0, 80) + '…' : String(value)
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-border/30 last:border-0">
      <span className="text-xs text-muted flex items-center gap-1 shrink-0">
        {label.replace(/_/g, ' ')}
        {tooltip && EXPLANATIONS[tooltip] && <InfoTooltip {...EXPLANATIONS[tooltip]} size="sm" />}
      </span>
      <span className="text-xs font-mono text-gray-300 text-right">{display}</span>
    </div>
  )
}

function StepDetail({ step }: { step: any }) {
  if (!step) return null
  const data = step.data || {}
  const HISTORY_KEYS = ['revenue_history', 'ebitda_history', 'net_income_history', 'operating_cf_history', 'fcf_history', 'capex_history']
  const historyEntries = Object.entries(data).filter(([k]) => HISTORY_KEYS.includes(k)) as [string, Record<string, number>][]
  const flatEntries = Object.entries(data).filter(([k, v]) => !HISTORY_KEYS.includes(k) && typeof v !== 'object') as [string, any][]
  const nestedEntries = Object.entries(data).filter(([k, v]) => !HISTORY_KEYS.includes(k) && typeof v === 'object' && v !== null) as [string, Record<string, any>][]
  const CHART_COLORS: Record<string, string> = {
    revenue_history: '#10b981', ebitda_history: '#60a5fa', net_income_history: '#a78bfa',
    operating_cf_history: '#34d399', fcf_history: '#f59e0b', capex_history: '#f87171',
  }
  return (
    <div className="space-y-5">
      {step.key_questions?.length > 0 && (
        <div className="bg-surface/50 border border-border/40 rounded-lg p-4 space-y-2">
          <p className="text-xs text-muted/70 uppercase tracking-wider font-mono mb-3">Key Questions</p>
          {step.key_questions.map((q: string, i: number) => (
            <div key={i} className="flex gap-2.5">
              <span className="text-xs font-mono text-accent/50 shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
              <p className="text-xs text-gray-400 leading-relaxed">{q}</p>
            </div>
          ))}
        </div>
      )}
      {historyEntries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {historyEntries.map(([key, series]) => (
            Object.keys(series).length >= 2 && (
              <div key={key} className="bg-surface border border-border rounded-lg p-4">
                <p className="text-xs text-muted mb-2">{key.replace(/_history$/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                <HistoryBarChart series={series} label={key} color={CHART_COLORS[key] || '#10b981'} />
              </div>
            )
          ))}
        </div>
      )}
      {flatEntries.length > 0 && (
        <div className="card space-y-0 py-3 px-4">
          <p className="text-xs text-muted/70 uppercase tracking-wider font-mono mb-2">Data</p>
          {flatEntries.map(([k, v]) => <DataRow key={k} label={k} value={v} tooltip={k} />)}
        </div>
      )}
      {nestedEntries.map(([key, obj]) => (
        <div key={key} className="card space-y-0 py-3 px-4">
          <p className="text-xs text-muted/70 uppercase tracking-wider font-mono mb-2">
            {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </p>
          {Object.entries(obj).map(([k, v]) => typeof v !== 'object' && <DataRow key={k} label={k} value={v} tooltip={k} />)}
        </div>
      ))}
      <div className="rounded-lg border border-border bg-card px-4 py-4 space-y-1">
        <p className="text-xs text-muted/70 uppercase tracking-wider font-mono mb-2">Conclusion</p>
        <p className="text-sm text-gray-300 leading-relaxed">{step.conclusion}</p>
        {step.score !== undefined && step.score !== 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
            <span className="text-xs text-muted">Step contribution:</span>
            <ScoreBar score={step.score} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Score Dashboard ───────────────────────────────────────────────────────────

function ScoreDashboard({ steps, activeStep, onSelect, weights, weightedScore, weightedRating }: {
  steps: any; activeStep: number; onSelect: (s: number) => void
  weights: number[]; weightedScore: number; weightedRating: string
}) {
  const ratingStyle = RATING_STYLE[weightedRating]
  return (
    <div className="card py-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted/70 uppercase tracking-wider font-mono">12-Step Score Overview</p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted">Weighted:</span>
          <span className={`text-xs font-mono font-semibold ${ratingStyle?.text || 'text-gray-300'}`}>
            {weightedScore > 0 ? '+' : ''}{weightedScore.toFixed(2)} · {weightedRating}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1
          const stepData = steps[`step_${stepNum}`]
          const score = stepData?.score ?? 0
          const w = weights[i]
          const isActive = activeStep === stepNum
          const bar = Math.min(100, Math.abs(score) * 100)
          return (
            <button
              key={stepNum}
              onClick={() => onSelect(stepNum)}
              title={`${label}\nScore: ${score > 0 ? '+' : ''}${score.toFixed(2)}\nWeight: ${w.toFixed(1)}×`}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all ${
                isActive ? 'border-accent/50 bg-accent/5' : 'border-border/40 hover:border-border hover:bg-surface/50'
              }`}
            >
              <span className={`text-[10px] font-mono ${isActive ? 'text-accent' : 'text-muted/50'}`}>
                {String(stepNum).padStart(2, '0')}
              </span>
              {/* Score bar */}
              <div className="w-full h-6 relative flex items-center">
                <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${score > 0.1 ? 'bg-emerald-500' : score < -0.1 ? 'bg-red-500' : 'bg-muted/30'}`}
                    style={{ width: `${bar}%`, marginLeft: score >= 0 ? `${50}%` : `${50 - bar}%` }}
                  />
                </div>
              </div>
              <span className={`text-[9px] font-mono ${score > 0.1 ? 'text-emerald-400' : score < -0.1 ? 'text-red-400' : 'text-muted/40'}`}>
                {score > 0 ? '+' : ''}{score.toFixed(2)}
              </span>
              {w !== 1 && (
                <span className="text-[8px] font-mono text-accent/60">{w.toFixed(1)}×</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Weight Sliders ─────────────────────────────────────────────────────────────

function WeightPanel({ weights, onChange, onReset }: {
  weights: number[]; onChange: (i: number, v: number) => void; onReset: () => void
}) {
  return (
    <div className="card py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted/70 uppercase tracking-wider font-mono">Custom Step Weights</p>
          <p className="text-xs text-muted/50 mt-1">Adjust how much each step influences the final rating. Default = 1× for all.</p>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-muted hover:text-gray-300 border border-border px-3 py-1.5 rounded-lg transition-colors"
        >
          Reset
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-muted/50 w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
            <span className="text-xs text-muted/70 w-36 shrink-0 truncate">{label}</span>
            <input
              type="range"
              min="0"
              max="3"
              step="0.5"
              value={weights[i]}
              onChange={e => onChange(i, parseFloat(e.target.value))}
              className="flex-1 accent-accent h-1 cursor-pointer"
            />
            <span className={`text-xs font-mono w-8 text-right shrink-0 ${weights[i] !== 1 ? 'text-accent' : 'text-muted/50'}`}>
              {weights[i].toFixed(1)}×
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function FundamentalSkeleton() {
  return (
    <div className="space-y-5">
      <SkeletonCard />
      <div className="card flex items-center gap-3 py-6">
        <Clock size={16} className="animate-spin shrink-0 text-accent" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-2.5 w-80" />
        </div>
      </div>
      <div className="card">
        <Skeleton className="h-2.5 w-40 mb-4" />
        <div className="grid grid-cols-12 gap-1.5">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      </div>
      <div className="flex gap-4">
        <div className="w-56 shrink-0 space-y-1">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-9 rounded-lg" />)}
        </div>
        <div className="flex-1 space-y-4">
          <SkeletonCard />
          <SkeletonText lines={5} />
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FundamentalPage() {
  const { ticker } = useParams<{ ticker: string }>()
  const [activeStep, setActiveStep] = useState(1)
  const [showWeights, setShowWeights] = useState(false)
  const [weights, setWeights] = useState<number[]>(Array(12).fill(1))
  const [watchToast, setWatchToast] = useState<string | null>(null)

  // Watchlist
  const publicItems = useWatchlistStore(s => s.publicItems)
  const addPublic = useWatchlistStore(s => s.addPublic)
  const removePublic = useWatchlistStore(s => s.removePublic)
  const updatePublicSnapshot = useWatchlistStore(s => s.updatePublicSnapshot)
  const inWatchlist = (publicItems ?? []).find(i => i.ticker === ticker?.toUpperCase())

  const { data: overview } = useQuery({
    queryKey: ['overview', ticker],
    queryFn: () => getTickerOverview(ticker!),
    enabled: !!ticker,
  })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['fundamental', ticker],
    queryFn: () => getFundamentalFull(ticker!),
    enabled: !!ticker,
  })

  const ratingStyle: RatingStyle | undefined = data ? RATING_STYLE[data.rating] : undefined

  // Weighted score & rating
  const { weightedScore, weightedRating } = useMemo(() => {
    if (!data) return { weightedScore: 0, weightedRating: 'Hold' }
    const scores = STEP_LABELS.map((_, i) => data.steps?.[`step_${i + 1}`]?.score ?? 0)
    const totalWeight = weights.reduce((a, b) => a + b, 0)
    const ws = totalWeight > 0
      ? scores.reduce((acc, s, i) => acc + s * weights[i], 0) / totalWeight
      : data.final_score
    const idx = Math.min(4, Math.max(0, Math.round((ws + 1) * 2)))
    return { weightedScore: ws, weightedRating: RATINGS[idx] }
  }, [data, weights])

  const weightedStyle = RATING_STYLE[weightedRating]

  const PDF_REPORTS = [
    { label: 'One-Pager', icon: FileText, fn: () => generateOnePager(ticker!, overview, data) },
    { label: 'Memo', icon: BookOpen, fn: () => generateMemo(ticker!, overview, data) },
    { label: 'Earnings', icon: BarChart3, fn: () => generateEarningsSummary(ticker!, overview, data) },
    { label: 'IR Report', icon: Newspaper, fn: () => generateIRSummary(ticker!, overview, data) },
  ]

  // Auto-refresh snapshot if in watchlist
  // IMPORTANT: deps must be PRIMITIVES only — never `inWatchlist` (object ref)
  // because setting the snapshot mutates publicItems → new find() ref → infinite loop.
  const watchedId = inWatchlist?.id ?? null
  const overviewPrice = overview?.current_price ?? null
  const overviewSector = overview?.sector ?? null
  const overviewMarketCap = overview?.market_cap ?? null
  useEffect(() => {
    if (!ticker || !watchedId) return
    if (overviewPrice == null && overviewSector == null) return
    updatePublicSnapshot(ticker, {
      fetchedAt: Date.now(),
      price: overviewPrice,
      marketCap: overviewMarketCap,
      sector: overviewSector,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, watchedId, overviewPrice, overviewMarketCap, overviewSector])

  const handleToggleWatch = () => {
    if (!ticker) return
    if (inWatchlist) {
      removePublic(inWatchlist.id)
      setWatchToast('Removed from watchlist')
    } else {
      addPublic(ticker)
      setWatchToast('Added to watchlist')
      if (overview) {
        updatePublicSnapshot(ticker, {
          fetchedAt: Date.now(),
          price: overview.current_price ?? null,
          marketCap: overview.market_cap ?? null,
          sector: overview.sector ?? null,
        })
      }
    }
    setTimeout(() => setWatchToast(null), 2000)
  }

  const currentStep = data?.steps?.[`step_${activeStep}`]
  const isWeighted = weights.some(w => w !== 1)

  return (
    <div className="space-y-5">

      {/* Toast */}
      {watchToast && (
        <div className="fixed top-16 right-6 z-50 bg-violet-900/90 border border-violet-600/50 text-violet-100 text-xs px-3 py-2 rounded-md shadow-lg">
          {watchToast}
        </div>
      )}

      {/* Company header */}
      {overview && (
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-gray-100">{overview.name}</h1>
                <button
                  onClick={handleToggleWatch}
                  className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border transition ${
                    inWatchlist
                      ? 'text-violet-300 border-violet-700/50 bg-violet-950/30 hover:bg-violet-950/50'
                      : 'text-muted/60 border-border hover:text-violet-300 hover:border-violet-700/50'
                  }`}
                  title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                >
                  {inWatchlist ? <BookmarkCheck size={11} /> : <Bookmark size={11} />}
                  {inWatchlist ? 'In watchlist' : 'Watch'}
                </button>
              </div>
              <p className="text-muted text-xs mt-1 font-mono">
                {ticker} · {overview.sector} · {overview.industry} · {overview.country}
              </p>
              {overview.description && (
                <p className="text-xs text-muted/70 leading-relaxed mt-3 max-w-2xl line-clamp-3">
                  {overview.description}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <p className="text-3xl font-mono text-accent font-light">
                {overview.current_price ? `$${overview.current_price.toLocaleString()}` : '—'}
              </p>
              <p className="text-xs text-muted font-mono">
                Mkt Cap: {overview.market_cap ? `$${(overview.market_cap / 1e9).toFixed(1)}B` : '—'}
              </p>
              <DataFreshness fetchedAt={data?.fetched_at} className="mt-1" />
            </div>
          </div>
        </div>
      )}

      {isLoading && <FundamentalSkeleton />}

      {error && (
        <ErrorState
          title="Fundamental analysis failed"
          ticker={ticker}
          message={(error as any)?.message}
          onRetry={() => refetch()}
        />
      )}

      {data && (
        <>
          {/* Final recommendation */}
          <div className={`card border-2 ${weightedStyle?.border || ratingStyle?.border || 'border-border'} ${weightedStyle?.bg || ratingStyle?.bg || ''}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs text-muted/70 uppercase tracking-wider font-mono mb-2">
                  {isWeighted ? 'Weighted Recommendation' : 'Final Recommendation'}
                </p>
                <p className="text-sm text-gray-300 leading-relaxed max-w-2xl">{data.recommendation_summary}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`text-2xl font-bold font-mono ${weightedStyle?.text || ratingStyle?.text || 'text-gray-200'}`}>
                  {isWeighted ? weightedRating : data.rating}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted font-mono">Score</span>
                  <span className={`text-sm font-mono font-semibold ${weightedStyle?.text || ratingStyle?.text || 'text-accent'}`}>
                    {(isWeighted ? weightedScore : data.final_score) > 0 ? '+' : ''}
                    {(isWeighted ? weightedScore : data.final_score).toFixed(3)}
                  </span>
                </div>
                {isWeighted && (
                  <span className="text-[10px] font-mono text-muted/40">
                    base: {data.rating} ({data.final_score > 0 ? '+' : ''}{data.final_score?.toFixed(3)})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Toolbar: PDF + Weight toggle */}
          <div className="card py-3 px-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 shrink-0">
                <Download size={13} className="text-muted" />
                <span className="text-xs text-muted">Download:</span>
              </div>
              {PDF_REPORTS.map(r => (
                <button key={r.label} onClick={r.fn}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-gray-300 hover:border-accent/40 hover:text-accent transition-all">
                  <r.icon size={11} />
                  {r.label}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setShowWeights(s => !s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs transition-all ${
                    showWeights || isWeighted
                      ? 'bg-accent/10 border-accent/30 text-accent'
                      : 'bg-surface border-border text-muted hover:text-gray-300 hover:border-border/80'
                  }`}
                >
                  <SlidersHorizontal size={11} />
                  Weights{isWeighted ? ' (active)' : ''}
                </button>
              </div>
            </div>
          </div>

          {/* Weight sliders panel */}
          {showWeights && (
            <WeightPanel
              weights={weights}
              onChange={(i, v) => setWeights(w => { const n = [...w]; n[i] = v; return n })}
              onReset={() => setWeights(Array(12).fill(1))}
            />
          )}

          {/* Score Dashboard */}
          <ScoreDashboard
            steps={data.steps}
            activeStep={activeStep}
            onSelect={setActiveStep}
            weights={weights}
            weightedScore={weightedScore}
            weightedRating={weightedRating}
          />

          {/* Main content: step nav + detail */}
          <div className="flex gap-4 items-start">
            {/* Step sidebar */}
            <div className="w-56 shrink-0 hidden md:flex flex-col gap-1">
              {STEP_LABELS.map((label, i) => {
                const stepNum = i + 1
                const stepData = data.steps[`step_${stepNum}`]
                const score = stepData?.score ?? 0
                const isActive = activeStep === stepNum
                return (
                  <button
                    key={stepNum}
                    onClick={() => setActiveStep(stepNum)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
                      isActive
                        ? 'bg-accent/8 border border-accent/20 text-gray-100'
                        : 'hover:bg-surface border border-transparent text-muted hover:text-gray-300'
                    }`}
                  >
                    <span className={`text-xs font-mono shrink-0 ${isActive ? 'text-accent' : 'text-muted/50'}`}>
                      {String(stepNum).padStart(2, '0')}
                    </span>
                    <span className="text-xs flex-1 truncate">{label}</span>
                    <span className="shrink-0">
                      {score > 0.2 ? <TrendingUp size={11} className="text-emerald-400" /> :
                       score < -0.2 ? <TrendingDown size={11} className="text-red-400" /> :
                       <Minus size={11} className="text-muted/30" />}
                    </span>
                    {isActive && <ChevronRight size={11} className="text-accent shrink-0" />}
                  </button>
                )
              })}
            </div>

            {/* Step detail */}
            <div className="flex-1 min-w-0">
              <div className="md:hidden mb-4">
                <select value={activeStep} onChange={e => setActiveStep(Number(e.target.value))}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-accent/60">
                  {STEP_LABELS.map((label, i) => (
                    <option key={i + 1} value={i + 1}>Step {i + 1} — {label}</option>
                  ))}
                </select>
              </div>

              {currentStep && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs font-mono text-muted/60">Step {activeStep} / 12</span>
                      <h2 className="text-base font-medium text-gray-100 mt-0.5">{currentStep.title}</h2>
                    </div>
                    {currentStep.score !== undefined && <ScoreBar score={currentStep.score} />}
                  </div>
                  <StepDetail step={currentStep} />
                  <div className="flex justify-between pt-4">
                    <button onClick={() => setActiveStep(s => Math.max(1, s - 1))} disabled={activeStep === 1}
                      className="px-4 py-2 text-xs border border-border rounded-lg text-muted hover:border-border/80 hover:text-gray-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                      ← Previous
                    </button>
                    <button onClick={() => setActiveStep(s => Math.min(12, s + 1))} disabled={activeStep === 12}
                      className="px-4 py-2 text-xs border border-border rounded-lg text-muted hover:border-border/80 hover:text-gray-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <NewsFeed ticker={ticker!} />
        </>
      )}
    </div>
  )
}
