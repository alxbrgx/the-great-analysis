import { useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDebtRatios, getStressTest, getRecoveryAnalysis, getReferenceRates } from '../utils/api'
import { AlertTriangle, CheckCircle, MinusCircle, TrendingDown, Activity, Shield, Banknote, Bookmark, BookmarkCheck } from 'lucide-react'
import Plot from 'react-plotly.js'
import InfoTooltip from '../components/ui/InfoTooltip'
import NewsFeed from '../components/ui/NewsFeed'
import { EXPLANATIONS } from '../data/explanations'
import { useWatchlistStore } from '../store/useWatchlistStore'

const DARK_LAYOUT = {
  paper_bgcolor: '#161616',
  plot_bgcolor: '#111111',
  font: { color: '#9ca3af', size: 10, family: 'JetBrains Mono, monospace' },
  xaxis: { gridcolor: '#222222', linecolor: '#2a2a2a', tickfont: { size: 9 } },
  yaxis: { gridcolor: '#222222', linecolor: '#2a2a2a', tickfont: { size: 9 } },
  margin: { t: 20, r: 16, b: 40, l: 60 },
}

const RATE_META: Record<string, { label: string; category: string }> = {
  fed_funds_rate: { label: 'Fed Funds', category: 'US Policy' },
  sofr:           { label: 'SOFR',       category: 'US Policy' },
  us_2y_treasury: { label: 'US 2Y',      category: 'US Rates' },
  us_10y_treasury:{ label: 'US 10Y',     category: 'US Rates' },
  us_30y_treasury:{ label: 'US 30Y',     category: 'US Rates' },
  euribor_3m:     { label: 'EURIBOR 3M', category: 'EUR Rates' },
  ecb_rate:       { label: 'ECB Deposit',category: 'EUR Policy' },
  libor_3m_usd:   { label: 'LIBOR 3M',  category: 'Interbank' },
}

// S&P credit rating scale for context
const CREDIT_SCALE = [
  { label: 'AAA–AA–', range: [0, 1.0],  color: '#10b981', desc: 'Minimal leverage' },
  { label: 'A+–A–',   range: [1.0, 2.0], color: '#34d399', desc: 'Low leverage' },
  { label: 'BBB+–BBB–',range: [2.0, 3.5],color: '#f59e0b', desc: 'Moderate leverage — BBB range' },
  { label: 'BB+–BB–', range: [3.5, 5.0], color: '#fb923c', desc: 'Elevated — high-yield territory' },
  { label: 'B+–CCC',  range: [5.0, 99],  color: '#ef4444', desc: 'Distressed leverage' },
]

function getCreditContext(nd_ebitda: number | null | string) {
  if (nd_ebitda == null || nd_ebitda === 'N/A' || typeof nd_ebitda !== 'number') return null
  return CREDIT_SCALE.find(c => nd_ebitda >= c.range[0] && nd_ebitda < c.range[1]) || CREDIT_SCALE[CREDIT_SCALE.length - 1]
}

function MetricCard({ label, value, unit = '', tooltip, highlight }: {
  label: string; value: any; unit?: string; tooltip?: string; highlight?: 'good' | 'warn' | 'danger' | 'neutral'
}) {
  const colorMap = { good: 'text-emerald-400', warn: 'text-yellow-400', danger: 'text-red-400', neutral: 'text-gray-200' }
  const display = value == null ? '—' : typeof value === 'number'
    ? Math.abs(value) > 1e8 ? `$${(value / 1e9).toFixed(1)}B` : value.toFixed(2)
    : String(value)

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <p className="text-xs text-muted flex items-center gap-1 mb-2">
        {label.replace(/_/g, ' ')}
        {tooltip && EXPLANATIONS[tooltip] && <InfoTooltip {...EXPLANATIONS[tooltip]} size="sm" />}
      </p>
      <p className={`text-xl font-mono font-light ${highlight ? colorMap[highlight] : 'text-gray-200'}`}>
        {display}{unit}
      </p>
    </div>
  )
}

function ReferenceRateCard({ label, val, category }: { label: string; val: any; category: string }) {
  const catColor: Record<string, string> = {
    'US Policy': 'text-blue-400/60',
    'US Rates': 'text-blue-400/40',
    'EUR Policy': 'text-violet-400/60',
    'EUR Rates': 'text-violet-400/40',
    'Interbank': 'text-amber-400/40',
  }
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <p className={`text-[9px] font-mono uppercase tracking-wider mb-0.5 ${catColor[category] || 'text-muted/40'}`}>{category}</p>
      <p className="text-xs text-muted mb-2">{label}</p>
      <p className="text-2xl font-mono font-light text-accent">
        {val?.current_value != null ? `${val.current_value.toFixed(2)}%` : '—'}
      </p>
      {val?.date && <p className="text-xs text-muted/40 font-mono mt-1">{val.date}</p>}
    </div>
  )
}

export default function DebtPage() {
  const { ticker } = useParams<{ ticker: string }>()

  const { data: ratios, isLoading: ratiosLoading } = useQuery({
    queryKey: ['debt-ratios', ticker],
    queryFn: () => getDebtRatios(ticker!),
    enabled: !!ticker,
  })
  const { data: stress } = useQuery({
    queryKey: ['stress', ticker],
    queryFn: () => getStressTest(ticker!),
    enabled: !!ticker,
  })
  const { data: recovery } = useQuery({
    queryKey: ['recovery', ticker],
    queryFn: () => getRecoveryAnalysis(ticker!),
    enabled: !!ticker,
  })
  const { data: rates } = useQuery({
    queryKey: ['rates'],
    queryFn: getReferenceRates,
    staleTime: 3600_000,
  })

  // Backend returns net_debt_ebitda + ICR in time_series, not ratios — derive latest
  const latestFromSeries = (series: Record<string, number> | undefined | null): number | null => {
    if (!series || typeof series !== 'object') return null
    const dates = Object.keys(series).sort().reverse()
    for (const d of dates) {
      const v = series[d]
      if (typeof v === 'number' && !isNaN(v)) return v
    }
    return null
  }
  const ndEbitda: number | null =
    (typeof ratios?.ratios?.net_debt_ebitda === 'number' ? ratios.ratios.net_debt_ebitda : null) ??
    latestFromSeries((ratios as any)?.time_series?.net_debt_ebitda)
  const icrLatest: number | null =
    (typeof (ratios as any)?.ratios?.interest_coverage_ratio === 'number' ? (ratios as any).ratios.interest_coverage_ratio : null) ??
    latestFromSeries((ratios as any)?.time_series?.interest_coverage_ratio)
  const creditCtx = getCreditContext(ndEbitda)

  // ── Watchlist integration ─────────────────────────────────────────────
  const publicItems = useWatchlistStore(s => s.publicItems)
  const addPublic = useWatchlistStore(s => s.addPublic)
  const removePublic = useWatchlistStore(s => s.removePublic)
  const updatePublicSnapshot = useWatchlistStore(s => s.updatePublicSnapshot)
  const [saveToast, setSaveToast] = useState<string | null>(null)

  const inWatchlist = useMemo(
    () => (publicItems ?? []).find(i => i.ticker === ticker?.toUpperCase()),
    [publicItems, ticker]
  )

  // Auto-refresh snapshot — use only PRIMITIVE deps to avoid infinite loop.
  // Calling updatePublicSnapshot mutates publicItems → new inWatchlist ref.
  // If we put `inWatchlist` (object) in deps, the effect re-fires on its own write → ∞ loop.
  const watchedId = inWatchlist?.id ?? null
  const ndForDep = typeof ndEbitda === 'number' ? ndEbitda : null
  const icrForDep = typeof icrLatest === 'number' ? icrLatest : null
  const sectorForDep = (ratios as any)?.sector ?? null
  useEffect(() => {
    if (!ticker || !watchedId) return
    if (ndForDep == null && icrForDep == null && sectorForDep == null) return
    updatePublicSnapshot(ticker, {
      fetchedAt: Date.now(),
      netDebtEbitda: ndForDep,
      icr: icrForDep,
      sector: sectorForDep,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, watchedId, ndForDep, icrForDep, sectorForDep])

  const handleToggleWatch = () => {
    if (!ticker) return
    if (inWatchlist) {
      removePublic(inWatchlist.id)
      setSaveToast('Removed from watchlist')
    } else {
      addPublic(ticker)
      setSaveToast('Added to watchlist')
      // Immediately push current snapshot so the watchlist card isn't empty
      if (ratios) {
        updatePublicSnapshot(ticker, {
          fetchedAt: Date.now(),
          netDebtEbitda: typeof ndEbitda === 'number' ? ndEbitda : null,
          icr: typeof ratios?.ratios?.interest_coverage_ratio === 'number'
            ? ratios.ratios.interest_coverage_ratio
            : null,
          sector: ratios?.sector ?? null,
        })
      }
    }
    setTimeout(() => setSaveToast(null), 2000)
  }

  // Build time-series chart data
  const buildSeriesChart = (seriesObj: Record<string, Record<string, number>>, keys: string[], colors: string[]) => {
    return keys.map((key, i) => {
      const series = seriesObj?.[key] || {}
      const entries = Object.entries(series).sort(([a], [b]) => a.localeCompare(b))
      return {
        type: 'bar' as const,
        name: key.replace(/_/g, ' '),
        x: entries.map(([d]) => d.slice(0, 10)),
        y: entries.map(([, v]) => Math.abs(v) > 1e8 ? +(v / 1e9).toFixed(2) : +v.toFixed(2)),
        marker: { color: colors[i] },
      }
    })
  }

  return (
    <div className="space-y-5">

      {/* Save toast */}
      {saveToast && (
        <div className="fixed top-16 right-6 z-50 bg-violet-900/90 border border-violet-600/50 text-violet-100 text-xs px-3 py-2 rounded-md shadow-lg">
          <div className="flex items-center gap-2">
            <BookmarkCheck size={12} />
            {saveToast}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-100">Debt & Credit Analysis</h1>
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
          <p className="text-sm text-muted mt-1">
            <span className="font-mono text-accent">{ticker}</span> · Credit ratios · Stress testing · Recovery analysis · FRED reference rates
          </p>
        </div>
        {/* Credit rating context */}
        {creditCtx && (
          <div className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3">
            <div>
              <p className="text-xs text-muted mb-0.5">Net Debt / EBITDA</p>
              <p className="text-2xl font-mono font-light" style={{ color: creditCtx.color }}>
                {typeof ndEbitda === 'number' ? `${ndEbitda.toFixed(1)}x` : '—'}
              </p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <p className="text-xs text-muted mb-0.5">Implied Rating Range</p>
              <p className="text-sm font-mono font-semibold" style={{ color: creditCtx.color }}>{creditCtx.label}</p>
              <p className="text-xs text-muted/60">{creditCtx.desc}</p>
            </div>
          </div>
        )}
      </div>

      {/* Reference Rates — grouped by category */}
      {rates && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Banknote size={14} className="text-muted" />
            <h2 className="text-sm font-medium text-gray-200">Reference Interest Rates</h2>
            <span className="text-xs text-muted/40 ml-1">Source: FRED · Federal Reserve Economic Data</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8 gap-2">
            {Object.entries(RATE_META).map(([key, meta]) => {
              const val = rates.rates?.[key]
              if (!val || val.error) return null
              return <ReferenceRateCard key={key} label={meta.label} val={val} category={meta.category} />
            })}
          </div>
          {/* Yield curve context */}
          {rates.rates?.us_2y_treasury && rates.rates?.us_10y_treasury &&
           !rates.rates.us_2y_treasury.error && !rates.rates.us_10y_treasury.error && (
            <div className="flex items-center gap-3 bg-surface border border-border rounded-lg px-4 py-2.5">
              <Activity size={13} className="text-muted" />
              <span className="text-xs text-muted">2Y/10Y Spread:</span>
              <span className={`text-xs font-mono font-semibold ${
                (rates.rates.us_10y_treasury.current_value - rates.rates.us_2y_treasury.current_value) < 0
                  ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {((rates.rates.us_10y_treasury.current_value - rates.rates.us_2y_treasury.current_value)).toFixed(2)} bps
              </span>
              <span className="text-xs text-muted/50">
                {(rates.rates.us_10y_treasury.current_value - rates.rates.us_2y_treasury.current_value) < 0
                  ? '— inverted (recession signal)'
                  : '— normal curve'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Key Credit Ratios */}
      {ratios && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Shield size={14} className="text-muted" />
            <h2 className="text-sm font-medium text-gray-200">Key Credit Ratios</h2>
          </div>

          {ratios.ratios && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {Object.entries(ratios.ratios).map(([k, v]: [string, any]) => {
                if (v == null) return null
                let highlight: 'good' | 'warn' | 'danger' | 'neutral' = 'neutral'
                if (k === 'net_debt_ebitda' && typeof v === 'number') {
                  highlight = v < 2 ? 'good' : v < 4 ? 'warn' : 'danger'
                } else if (k === 'interest_coverage_ratio' && typeof v === 'number') {
                  highlight = v > 4 ? 'good' : v > 2 ? 'warn' : 'danger'
                } else if (k === 'current_ratio' && typeof v === 'number') {
                  highlight = v > 1.5 ? 'good' : v > 1 ? 'warn' : 'danger'
                } else if (k === 'quick_ratio' && typeof v === 'number') {
                  highlight = v > 1 ? 'good' : 'danger'
                }
                return <MetricCard key={k} label={k} value={v} tooltip={k} highlight={highlight} />
              })}
            </div>
          )}

          {/* S&P Rating scale reference */}
          <div className="card py-3 px-4">
            <p className="text-xs text-muted/60 mb-3 font-mono uppercase tracking-wider">Net Debt/EBITDA · Implied Rating Context</p>
            <div className="flex gap-1 items-center">
              {CREDIT_SCALE.map((band, i) => {
                const isActive = creditCtx?.label === band.label
                return (
                  <div key={i} className={`flex-1 rounded-lg px-2 py-2 border transition-all ${
                    isActive ? 'border-current opacity-100' : 'border-border opacity-40'
                  }`} style={{ borderColor: isActive ? band.color : undefined }}>
                    <p className="text-xs font-mono font-semibold" style={{ color: band.color }}>{band.label}</p>
                    <p className="text-[9px] text-muted/60 mt-0.5">{band.range[1] < 99 ? `<${band.range[1]}x` : `>${band.range[0]}x`}</p>
                    <p className="text-[9px] text-muted/50 mt-0.5 hidden xl:block">{band.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Time-series charts */}
          {ratios.time_series && (() => {
            const ts = ratios.time_series
            const hasNDEBITDA = ts.net_debt_ebitda && Object.keys(ts.net_debt_ebitda).length > 1
            const hasICR = ts.interest_coverage_ratio && Object.keys(ts.interest_coverage_ratio).length > 1
            const hasFCF = ts.free_cash_flow && Object.keys(ts.free_cash_flow).length > 1

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {hasNDEBITDA && (() => {
                  const entries = Object.entries(ts.net_debt_ebitda).sort(([a], [b]) => a.localeCompare(b))
                  return (
                    <div className="card">
                      <p className="text-xs text-muted mb-3">Net Debt / EBITDA (×)</p>
                      <Plot
                        data={[{
                          type: 'bar',
                          x: entries.map(([d]) => d.slice(0, 10)),
                          y: entries.map(([, v]: [string, any]) => +Number(v).toFixed(2)),
                          marker: { color: entries.map(([, v]: [string, any]) =>
                            v < 2 ? '#10b981' : v < 4 ? '#f59e0b' : '#ef4444'
                          )},
                        }]}
                        layout={{ ...DARK_LAYOUT, height: 180, showlegend: false,
                          yaxis: { ...DARK_LAYOUT.yaxis, title: { text: '×', font: { color: '#6b7280', size: 9 } } },
                        } as any}
                        style={{ width: '100%' }}
                        config={{ responsive: true, displayModeBar: false }}
                      />
                    </div>
                  )
                })()}

                {hasICR && (() => {
                  const entries = Object.entries(ts.interest_coverage_ratio).sort(([a], [b]) => a.localeCompare(b))
                  return (
                    <div className="card">
                      <p className="text-xs text-muted mb-3">Interest Coverage Ratio (×)</p>
                      <Plot
                        data={[{
                          type: 'scatter',
                          x: entries.map(([d]) => d.slice(0, 10)),
                          y: entries.map(([, v]: [string, any]) => +Number(v).toFixed(2)),
                          mode: 'lines+markers',
                          line: { color: '#60a5fa', width: 2 },
                          marker: { size: 5, color: '#60a5fa' },
                        }]}
                        layout={{ ...DARK_LAYOUT, height: 180, showlegend: false,
                          shapes: [{ type: 'line', x0: 0, x1: 1, xref: 'paper', y0: 3, y1: 3,
                            line: { color: '#f59e0b', width: 1, dash: 'dot' } }],
                          yaxis: { ...DARK_LAYOUT.yaxis, title: { text: '×', font: { color: '#6b7280', size: 9 } } },
                        } as any}
                        style={{ width: '100%' }}
                        config={{ responsive: true, displayModeBar: false }}
                      />
                    </div>
                  )
                })()}

                {hasFCF && (() => {
                  const entries = Object.entries(ts.free_cash_flow).sort(([a], [b]) => a.localeCompare(b))
                  return (
                    <div className="card">
                      <p className="text-xs text-muted mb-3">Free Cash Flow ($B)</p>
                      <Plot
                        data={[{
                          type: 'bar',
                          x: entries.map(([d]) => d.slice(0, 10)),
                          y: entries.map(([, v]: [string, any]) => +(Number(v) / 1e9).toFixed(2)),
                          marker: { color: entries.map(([, v]: [string, any]) =>
                            Number(v) >= 0 ? 'rgba(16,185,129,0.7)' : 'rgba(239,68,68,0.7)'
                          )},
                        }]}
                        layout={{ ...DARK_LAYOUT, height: 180, showlegend: false,
                          yaxis: { ...DARK_LAYOUT.yaxis, title: { text: '$B', font: { color: '#6b7280', size: 9 } } },
                        } as any}
                        style={{ width: '100%' }}
                        config={{ responsive: true, displayModeBar: false }}
                      />
                    </div>
                  )
                })()}
              </div>
            )
          })()}
        </div>
      )}

      {/* Stress Test */}
      {stress && !stress.error && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <TrendingDown size={14} className="text-muted" />
            <h2 className="text-sm font-medium text-gray-200">Stress Test — 3 Scenarios</h2>
          </div>
          <p className="text-xs text-gray-400 bg-surface border border-border rounded-lg p-3 leading-relaxed">
            {stress.methodology}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {Object.entries(stress.scenarios || {}).map(([name, s]: [string, any]) => {
              const icr = s.icr_stressed
              const status = icr == null ? 'neutral' : icr > 3 ? 'good' : icr > 1.5 ? 'warn' : 'danger'
              const borderMap = { good: 'border-emerald-800/60', warn: 'border-yellow-800/60', danger: 'border-red-800/60', neutral: 'border-border' }
              const bgMap = { good: 'bg-emerald-900/10', warn: 'bg-yellow-900/10', danger: 'bg-red-900/10', neutral: '' }
              return (
                <div key={name} className={`rounded-xl border ${borderMap[status]} ${bgMap[status]} p-4 space-y-3`}>
                  <div className="flex items-center gap-2">
                    {status === 'good' && <CheckCircle size={13} className="text-emerald-400" />}
                    {status === 'warn' && <MinusCircle size={13} className="text-yellow-400" />}
                    {status === 'danger' && <AlertTriangle size={13} className="text-red-400" />}
                    <p className="text-xs font-medium text-gray-200 capitalize">{name.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      ['Revenue shock', s.revenue_drop],
                      ['EBITDA drop', s.ebitda_drop],
                    ].map(([label, val]) => (
                      <div key={String(label)} className="flex justify-between text-xs">
                        <span className="text-muted">{label}</span>
                        <span className="font-mono text-gray-300">{val}</span>
                      </div>
                    ))}
                    {icr != null && (
                      <div className="flex justify-between text-xs pt-2 border-t border-border/40">
                        <span className="text-muted flex items-center gap-1">
                          ICR (stressed) <InfoTooltip {...EXPLANATIONS.stress_icr} size="sm" />
                        </span>
                        <span className={`font-mono font-semibold ${
                          status === 'good' ? 'text-emerald-400' :
                          status === 'warn' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {icr.toFixed(2)}×
                        </span>
                      </div>
                    )}
                    <div className={`mt-1 text-xs text-center py-1 rounded font-mono font-medium ${
                      status === 'good' ? 'text-emerald-400 bg-emerald-900/20' :
                      status === 'warn' ? 'text-yellow-400 bg-yellow-900/20' :
                      'text-red-400 bg-red-900/20'
                    }`}>
                      {status === 'good' ? 'Resilient' : status === 'warn' ? 'Monitor' : 'At Risk'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recovery Analysis */}
      {recovery && !recovery.error && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-muted" />
            <h2 className="text-sm font-medium text-gray-200">Recovery Analysis — Loss Given Default</h2>
          </div>
          <p className="text-xs text-gray-400 bg-surface border border-border rounded-lg p-3 leading-relaxed">
            {recovery.methodology}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {[
              { label: 'Total Assets', value: recovery.total_assets },
              { label: 'Goodwill', value: recovery.goodwill },
              { label: 'Tangible Assets', value: recovery.tangible_asset_value },
              { label: 'Total Debt', value: recovery.total_debt },
            ].map(({ label, value }) =>
              value != null ? (
                <div key={label} className="bg-surface border border-border rounded-xl p-4">
                  <p className="text-xs text-muted mb-1">{label}</p>
                  <p className="text-lg font-mono text-gray-200">
                    {value > 1e8 ? `$${(value / 1e9).toFixed(1)}B` : `$${(value / 1e6).toFixed(0)}M`}
                  </p>
                </div>
              ) : null
            )}
            {recovery.estimated_recovery_rate != null && (
              <div className={`rounded-xl border p-4 ${
                recovery.estimated_recovery_rate > 0.8 ? 'bg-emerald-900/15 border-emerald-800/60' :
                recovery.estimated_recovery_rate > 0.5 ? 'bg-yellow-900/15 border-yellow-800/60' :
                'bg-red-900/15 border-red-800/60'
              }`}>
                <p className="text-xs text-muted flex items-center gap-1 mb-1">
                  Recovery Rate <InfoTooltip {...EXPLANATIONS.recovery_rate} size="sm" />
                </p>
                <p className={`text-2xl font-mono font-light ${
                  recovery.estimated_recovery_rate > 0.8 ? 'text-emerald-400' :
                  recovery.estimated_recovery_rate > 0.5 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {(recovery.estimated_recovery_rate * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted/60 font-mono mt-1">
                  LGD: {((recovery.loss_given_default || 0) * 100).toFixed(0)}%
                </p>
              </div>
            )}
          </div>
          {recovery.interpretation && (
            <p className="text-xs text-muted/70 leading-relaxed">{recovery.interpretation}</p>
          )}
        </div>
      )}

      {/* News */}
      <NewsFeed ticker={ticker!} />
    </div>
  )
}
