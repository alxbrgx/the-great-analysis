import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { optimizePortfolio, getEfficientFrontier, getCumulativeReturns, suggestAssets } from '../utils/api'
import { useTickerStore } from '../store/useTickerStore'
import { X, TrendingUp, Shield, Activity, Sparkles, Plus, Download, RotateCcw } from 'lucide-react'
import Plot from 'react-plotly.js'
import InfoTooltip from '../components/ui/InfoTooltip'
import TickerSearch from '../components/ui/TickerSearch'
import { EXPLANATIONS } from '../data/explanations'
import { exportPortfolioToExcel } from '../utils/excelExport'

const PERIODS = ['6mo', '1y', '3y', '5y']

const DARK_LAYOUT = {
  paper_bgcolor: '#1a1a1a',
  plot_bgcolor: '#111111',
  font: { color: '#9ca3af', size: 11, family: 'JetBrains Mono, monospace' },
  xaxis: { gridcolor: '#2a2a2a', linecolor: '#2a2a2a', zerolinecolor: '#2a2a2a' },
  yaxis: { gridcolor: '#2a2a2a', linecolor: '#2a2a2a', zerolinecolor: '#2a2a2a' },
  margin: { t: 40, r: 20, b: 50, l: 60 },
  legend: { bgcolor: 'rgba(0,0,0,0)', bordercolor: '#2a2a2a' },
}

const CHART_COLORS = ['#10b981', '#60a5fa', '#f59e0b', '#a78bfa', '#f87171', '#34d399', '#fb923c', '#c084fc']

function MetricTile({ label, value, sub, color = 'text-gray-200' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-3">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className={`text-lg font-mono font-medium ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted/60 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function PortfolioPage() {
  const anchorTicker = useTickerStore(s => s.ticker)
  const savedTickers = useTickerStore(s => s.portfolioTickers)
  const savedBudget = useTickerStore(s => s.portfolioBudget)
  const setSavedTickers = useTickerStore(s => s.setPortfolioTickers)
  const setSavedBudget = useTickerStore(s => s.setPortfolioBudget)

  const [tickers, setTickers] = useState<string[]>(
    savedTickers.length > 0 ? savedTickers : (anchorTicker ? [anchorTicker] : [])
  )
  const [budget, setBudget] = useState(savedBudget || 10000)
  const [period, setPeriod] = useState('1y')
  const [showRestoreBanner, setShowRestoreBanner] = useState(savedTickers.length > 0)

  // Auto-save to store whenever tickers/budget change
  useEffect(() => {
    if (tickers.length > 0) setSavedTickers(tickers)
  }, [tickers, setSavedTickers])

  useEffect(() => {
    setSavedBudget(budget)
  }, [budget, setSavedBudget])
  const [activeTab, setActiveTab] = useState<'weights' | 'performance' | 'risk' | 'frontier'>('weights')

  const { mutate: runOptimize, data: result, isPending: isOptPending } = useMutation({
    mutationFn: () => optimizePortfolio(tickers, budget, period),
  })

  const { mutate: runFrontier, data: frontier } = useMutation({
    mutationFn: () => getEfficientFrontier(tickers, period),
  })

  const { mutate: runHistory, data: history } = useMutation({
    mutationFn: () => getCumulativeReturns(tickers, period),
  })

  const { data: suggestions } = useQuery({
    queryKey: ['suggestions', anchorTicker],
    queryFn: () => suggestAssets(anchorTicker!),
    enabled: !!anchorTicker,
    staleTime: 3600_000,
  })

  const handleOptimize = () => {
    runOptimize()
    runFrontier()
    runHistory()
  }

  const addTicker = (symbol: string) => {
    const t = symbol.trim().toUpperCase()
    if (t && !tickers.includes(t)) setTickers(prev => [...prev, t])
  }

  const removeTicker = (t: string) => setTickers(prev => prev.filter(x => x !== t))

  const tabs = [
    { id: 'weights', label: 'Allocation', icon: PieChartIcon },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'risk', label: 'Risk', icon: Shield },
    { id: 'frontier', label: 'Frontier', icon: Activity },
  ] as const

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="card">
        <h1 className="text-xl font-semibold text-gray-100">Portfolio Analysis</h1>
        <p className="text-sm text-muted mt-1">Build and optimize a multi-asset portfolio — Markowitz Max Sharpe · Hierarchical Risk Parity</p>
      </div>

      {/* Restore banner */}
      {showRestoreBanner && savedTickers.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-accent/5 border border-accent/20 rounded-xl">
          <RotateCcw size={13} className="text-accent shrink-0" />
          <p className="text-xs text-gray-300 flex-1">
            Restored your last portfolio:{' '}
            <span className="font-mono text-accent">{savedTickers.join(', ')}</span>
          </p>
          <button onClick={() => setShowRestoreBanner(false)} className="text-muted/50 hover:text-gray-300 text-xs">✕</button>
        </div>
      )}

      {/* Suggestions — shown when anchor ticker is set */}
      {suggestions && suggestions.suggestions?.length > 0 && (
        <div className="card space-y-4 border-accent/10">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-accent" />
            <h2 className="text-sm font-medium text-gray-200">
              Suggested portfolio around <span className="text-accent font-mono">{suggestions.anchor_ticker}</span>
            </h2>
            <span className="text-xs text-muted ml-1">— {suggestions.anchor_sector}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {suggestions.suggestions.map((s: any) => {
              const already = tickers.includes(s.ticker)
              return (
                <button
                  key={s.ticker}
                  onClick={() => !already && addTicker(s.ticker)}
                  disabled={already}
                  className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all ${
                    already
                      ? 'border-accent/30 bg-accent/5 opacity-60 cursor-default'
                      : 'border-border hover:border-accent/40 hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-xs text-accent font-semibold">{s.ticker}</span>
                    {!already && <Plus size={11} className="text-muted" />}
                    {already && <span className="text-xs text-accent/60">✓</span>}
                  </div>
                  <span className="text-xs text-gray-300 truncate w-full">{s.name?.split(' ').slice(0, 3).join(' ')}</span>
                  <span className="text-xs text-muted/60 leading-tight">{s.rationale}</span>
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted/40">Click a card to add it to your portfolio. Suggestions: 4 sector peers + 4 diversifiers.</p>
        </div>
      )}

      {/* Builder */}
      <div className="card space-y-5">
        <h2 className="text-sm font-medium text-gray-200">Portfolio Builder</h2>

        {/* Ticker chips */}
        {tickers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tickers.map((t, i) => (
              <span key={t} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm font-mono"
                style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>
                {t}
                <button onClick={() => removeTicker(t)} className="text-muted hover:text-red-400 transition-colors ml-0.5">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search */}
        <div>
          <p className="text-xs text-muted mb-2">Add a ticker to your portfolio</p>
          <TickerSearch
            onSelect={addTicker}
            placeholder="Search and add a ticker — e.g. MSFT, Tesla, BNP Paribas..."
            className="max-w-xl"
          />
        </div>

        {/* Settings row */}
        <div className="flex flex-wrap gap-4 items-end pt-1">
          <div>
            <label className="text-xs text-muted block mb-1.5">Portfolio Budget ($)</label>
            <input
              type="number"
              value={budget}
              onChange={e => setBudget(Number(e.target.value))}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-gray-200 outline-none w-36 focus:border-accent/60 transition-colors font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1.5">Historical Period</label>
            <div className="flex gap-1">
              {PERIODS.map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-all font-mono ${period === p ? 'bg-accent/10 border-accent/40 text-accent' : 'border-border text-muted hover:border-border/80'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleOptimize}
            disabled={tickers.length < 2 || isOptPending}
            className="px-5 py-2 bg-accent text-black text-sm font-medium rounded-lg hover:bg-accent-dim transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isOptPending ? 'Optimizing...' : 'Optimize Portfolio'}
          </button>
          {result && (
            <button
              onClick={() => exportPortfolioToExcel({
                tickers,
                budget,
                markowitz: result.markowitz ? { weights: result.markowitz.weights, expected_return: result.markowitz.expected_return, volatility: result.markowitz.annual_volatility, sharpe: result.markowitz.sharpe_ratio } : undefined,
                hrp: result.hrp ? { weights: result.hrp.weights, expected_return: result.hrp.expected_return, volatility: result.hrp.annual_volatility, sharpe: result.hrp.sharpe_ratio } : undefined,
                riskMetrics: history?.risk_metrics,
                frontier: frontier?.frontier,
                history: history ? { dates: history.dates, tickers: history.tickers, spy_benchmark: history.spy_benchmark } : undefined,
              })}
              className="flex items-center gap-1.5 px-4 py-2 bg-surface border border-border rounded-lg text-xs text-gray-300 hover:border-accent/40 hover:text-accent transition-all"
            >
              <Download size={12} />
              Export Excel
            </button>
          )}
        </div>

        {tickers.length < 2 && (
          <p className="text-xs text-muted/60">Add at least 2 assets to run the optimization.</p>
        )}
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Summary tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricTile
              label="Markowitz Exp. Return"
              value={result.markowitz?.expected_return != null ? `${(result.markowitz.expected_return * 100).toFixed(1)}%` : '—'}
              color="text-emerald-400"
            />
            <MetricTile
              label="Markowitz Sharpe"
              value={result.markowitz?.sharpe_ratio != null ? result.markowitz.sharpe_ratio.toFixed(2) : '—'}
              sub="Risk-adjusted return"
              color="text-accent"
            />
            <MetricTile
              label="Markowitz Volatility"
              value={result.markowitz?.annual_volatility != null ? `${(result.markowitz.annual_volatility * 100).toFixed(1)}%` : '—'}
              color="text-gray-200"
            />
            <MetricTile
              label="Assets"
              value={`${tickers.length}`}
              sub={`Period: ${period}`}
              color="text-gray-200"
            />
          </div>

          {/* Tab navigation */}
          <div className="flex gap-1 border-b border-border pb-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all -mb-px ${
                  activeTab === tab.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-gray-300'
                }`}
              >
                <tab.icon size={13} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Allocation */}
          {activeTab === 'weights' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OptimizationCard title="Markowitz — Max Sharpe" model={result.markowitz} budget={budget} colors={CHART_COLORS} />
              <OptimizationCard title="HRP — López de Prado" model={result.hrp} budget={budget} colors={CHART_COLORS} />

              {/* Allocation pie charts */}
              {result.markowitz?.weights && (
                <div className="card">
                  <h3 className="text-sm font-medium text-gray-200 mb-4">Markowitz — Allocation Pie</h3>
                  <Plot
                    data={[{
                      type: 'pie',
                      labels: Object.keys(result.markowitz.weights).filter(k => (result.markowitz.weights[k] as number) > 0.001),
                      values: Object.values(result.markowitz.weights).filter((v: any) => v > 0.001) as number[],
                      hole: 0.45,
                      textinfo: 'label+percent',
                      textfont: { size: 11, color: '#d1d5db' },
                      marker: { colors: CHART_COLORS },
                    } as any]}
                    layout={{
                      ...DARK_LAYOUT,
                      height: 280,
                      showlegend: false,
                      margin: { t: 10, r: 10, b: 10, l: 10 },
                    } as any}
                    style={{ width: '100%' }}
                    config={{ responsive: true, displayModeBar: false }}
                  />
                </div>
              )}

              {result.hrp?.weights && (
                <div className="card">
                  <h3 className="text-sm font-medium text-gray-200 mb-4">HRP — Allocation Pie</h3>
                  <Plot
                    data={[{
                      type: 'pie',
                      labels: Object.keys(result.hrp.weights).filter(k => (result.hrp.weights[k] as number) > 0.001),
                      values: Object.values(result.hrp.weights).filter((v: any) => v > 0.001) as number[],
                      hole: 0.45,
                      textinfo: 'label+percent',
                      textfont: { size: 11, color: '#d1d5db' },
                      marker: { colors: CHART_COLORS },
                    } as any]}
                    layout={{
                      ...DARK_LAYOUT,
                      height: 280,
                      showlegend: false,
                      margin: { t: 10, r: 10, b: 10, l: 10 },
                    } as any}
                    style={{ width: '100%' }}
                    config={{ responsive: true, displayModeBar: false }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Tab: Performance */}
          {activeTab === 'performance' && history && (
            <div className="space-y-4">
              {/* Cumulative returns */}
              <div className="card">
                <h3 className="text-sm font-medium text-gray-200 mb-1">Cumulative Returns</h3>
                <p className="text-xs text-muted mb-4">Equal-weight portfolio vs. individual assets vs. S&P 500 (SPY)</p>
                <Plot
                  data={[
                    // Individual tickers
                    ...tickers
                      .filter(t => history.tickers[t])
                      .map((t, i) => ({
                        type: 'scatter' as const,
                        x: history.dates as string[],
                        y: history.tickers[t].map((v: number) => +((v - 1) * 100).toFixed(2)) as number[],
                        mode: 'lines' as const,
                        name: t,
                        line: { color: CHART_COLORS[i % CHART_COLORS.length], width: 1.5 },
                        opacity: 0.7,
                      })),
                    // Equal-weight portfolio
                    {
                      type: 'scatter' as const,
                      x: history.dates as string[],
                      y: history.equal_weight_portfolio.map((v: number) => +((v - 1) * 100).toFixed(2)) as number[],
                      mode: 'lines' as const,
                      name: 'Equal-Weight Portfolio',
                      line: { color: '#ffffff', width: 2.5, dash: 'dot' as const },
                    },
                    // SPY benchmark
                    ...(history.spy_benchmark?.length > 0 ? [{
                      type: 'scatter' as const,
                      x: history.dates as string[],
                      y: history.spy_benchmark.map((v: number) => +((v - 1) * 100).toFixed(2)) as number[],
                      mode: 'lines' as const,
                      name: 'S&P 500 (SPY)',
                      line: { color: '#6b7280', width: 1.5, dash: 'dashdot' as const },
                    }] : []),
                  ]}
                  layout={{
                    ...DARK_LAYOUT,
                    height: 380,
                    xaxis: { ...DARK_LAYOUT.xaxis, title: { text: '', font: { color: '#6b7280' } } },
                    yaxis: { ...DARK_LAYOUT.yaxis, title: { text: 'Cumulative Return (%)', font: { color: '#6b7280', size: 11 } }, ticksuffix: '%' },
                    hovermode: 'x unified',
                    legend: { orientation: 'h', y: -0.15, bgcolor: 'rgba(0,0,0,0)' },
                  } as any}
                  style={{ width: '100%' }}
                  config={{ responsive: true, displayModeBar: false }}
                />
              </div>

              {/* Asset annualized returns bar */}
              {result.performance_metrics && (
                <div className="card">
                  <h3 className="text-sm font-medium text-gray-200 mb-4">Annualized Return vs. Volatility</h3>
                  <Plot
                    data={[
                      {
                        type: 'bar',
                        name: 'Ann. Return',
                        x: Object.keys(result.performance_metrics.annualized_returns),
                        y: Object.values(result.performance_metrics.annualized_returns).map((v: any) => (v * 100).toFixed(2)),
                        marker: {
                          color: Object.values(result.performance_metrics.annualized_returns).map((v: any) =>
                            v >= 0 ? 'rgba(16,185,129,0.7)' : 'rgba(239,68,68,0.7)'
                          ),
                        },
                      },
                      {
                        type: 'bar',
                        name: 'Ann. Volatility',
                        x: Object.keys(result.performance_metrics.annualized_volatility),
                        y: Object.values(result.performance_metrics.annualized_volatility).map((v: any) => (v * 100).toFixed(2)),
                        marker: { color: 'rgba(96,165,250,0.5)' },
                      },
                    ]}
                    layout={{
                      ...DARK_LAYOUT,
                      height: 300,
                      barmode: 'group',
                      yaxis: { ...DARK_LAYOUT.yaxis, ticksuffix: '%' },
                    } as any}
                    style={{ width: '100%' }}
                    config={{ responsive: true, displayModeBar: false }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Tab: Risk */}
          {activeTab === 'risk' && (
            <div className="space-y-4">
              {/* Risk table */}
              {history?.risk_metrics && (
                <div className="card">
                  <h3 className="text-sm font-medium text-gray-200 mb-4">
                    Risk Metrics per Asset
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs text-muted">
                          <th className="text-left py-2.5 pr-4">Ticker</th>
                          <th className="text-right py-2.5 px-3">
                            <span className="inline-flex items-center gap-1">Ann. Return <InfoTooltip {...EXPLANATIONS.ann_return_asset} size="sm" /></span>
                          </th>
                          <th className="text-right py-2.5 px-3">
                            <span className="inline-flex items-center gap-1">Volatility <InfoTooltip {...EXPLANATIONS.ann_vol_asset} size="sm" /></span>
                          </th>
                          <th className="text-right py-2.5 px-3">Sharpe</th>
                          <th className="text-right py-2.5 px-3">Max Drawdown</th>
                          <th className="text-right py-2.5 pl-3">VaR (95%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(history.risk_metrics).map(([t, m]: [string, any]) => (
                          <tr key={t} className="border-b border-border/40 hover:bg-surface/50 transition-colors">
                            <td className="py-2.5 pr-4 font-mono text-accent text-xs font-semibold">{t}</td>
                            <td className={`py-2.5 px-3 text-right font-mono text-xs ${m.ann_return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {(m.ann_return * 100).toFixed(1)}%
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-xs text-gray-300">
                              {(m.ann_volatility * 100).toFixed(1)}%
                            </td>
                            <td className={`py-2.5 px-3 text-right font-mono text-xs ${m.sharpe >= 1 ? 'text-emerald-400' : m.sharpe >= 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {m.sharpe.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-xs text-red-400">
                              {(m.max_drawdown * 100).toFixed(1)}%
                            </td>
                            <td className="py-2.5 pl-3 text-right font-mono text-xs text-orange-400">
                              {(m.var_95 * 100).toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 flex gap-4 text-xs text-muted/60">
                    <span><span className="text-yellow-400">VaR 95%</span> — worst daily loss expected 5% of the time</span>
                    <span><span className="text-red-400">Max Drawdown</span> — peak-to-trough loss over the period</span>
                  </div>
                </div>
              )}

              {/* Correlation heatmap */}
              {result.performance_metrics?.correlation_matrix && (() => {
                const corr = result.performance_metrics.correlation_matrix
                const labels = Object.keys(corr)
                const z = labels.map(row => labels.map(col => corr[row]?.[col] ?? 0))
                return (
                  <div className="card">
                    <h3 className="text-sm font-medium text-gray-200 mb-1">
                      Correlation Matrix <InfoTooltip {...EXPLANATIONS.efficient_frontier} size="sm" />
                    </h3>
                    <p className="text-xs text-muted mb-4">Pairwise return correlations. Lower correlation = better diversification.</p>
                    <Plot
                      data={[{
                        type: 'heatmap',
                        z,
                        x: labels,
                        y: labels,
                        colorscale: [
                          [0, '#ef4444'],
                          [0.5, '#1a1a1a'],
                          [1, '#10b981'],
                        ],
                        zmin: -1,
                        zmax: 1,
                        text: z.map(row => row.map(v => v.toFixed(2))),
                        texttemplate: '%{text}',
                        showscale: true,
                        colorbar: { tickfont: { color: '#6b7280', size: 10 } },
                      } as any]}
                      layout={{
                        ...DARK_LAYOUT,
                        height: Math.max(280, labels.length * 55 + 60),
                        margin: { t: 10, r: 80, b: 60, l: 60 },
                        xaxis: { tickfont: { color: '#d1d5db', size: 11 } },
                        yaxis: { tickfont: { color: '#d1d5db', size: 11 } },
                      } as any}
                      style={{ width: '100%' }}
                      config={{ responsive: true, displayModeBar: false }}
                    />
                  </div>
                )
              })()}
            </div>
          )}

          {/* Tab: Efficient Frontier */}
          {activeTab === 'frontier' && frontier && frontier.frontier_volatilities?.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-medium text-gray-200 mb-1 flex items-center gap-1.5">
                Efficient Frontier <InfoTooltip {...EXPLANATIONS.efficient_frontier} size="sm" />
              </h3>
              <p className="text-xs text-muted mb-4">
                Each point is a portfolio with a unique risk/return tradeoff. The curve's left tip is minimum variance; the top-right is maximum return.
              </p>
              <Plot
                data={[
                  {
                    type: 'scatter',
                    x: frontier.frontier_volatilities.map((v: number) => +(v * 100).toFixed(3)),
                    y: frontier.frontier_returns.map((r: number) => +(r * 100).toFixed(3)),
                    mode: 'lines+markers',
                    line: { color: '#10b981', width: 2 },
                    marker: { size: 4, color: '#10b981' },
                    name: 'Efficient Frontier',
                  },
                  // Plot Markowitz point
                  ...(result.markowitz ? [{
                    type: 'scatter' as const,
                    x: [+(result.markowitz.annual_volatility * 100).toFixed(3)],
                    y: [+(result.markowitz.expected_return * 100).toFixed(3)],
                    mode: 'markers' as const,
                    marker: { size: 10, color: '#ffffff', symbol: 'star' },
                    name: 'Max Sharpe',
                  }] : []),
                ]}
                layout={{
                  ...DARK_LAYOUT,
                  height: 380,
                  xaxis: { ...DARK_LAYOUT.xaxis, title: { text: 'Volatility (%)', font: { color: '#6b7280', size: 11 } }, ticksuffix: '%' },
                  yaxis: { ...DARK_LAYOUT.yaxis, title: { text: 'Expected Return (%)', font: { color: '#6b7280', size: 11 } }, ticksuffix: '%' },
                } as any}
                style={{ width: '100%' }}
                config={{ responsive: true, displayModeBar: false }}
              />
            </div>
          )}

          {activeTab === 'frontier' && (!frontier || !frontier.frontier_volatilities?.length) && (
            <div className="card text-muted text-sm text-center py-8">
              Frontier data not yet computed. Click "Optimize Portfolio" to generate.
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PieChartIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  )
}

function OptimizationCard({ title, model, budget, colors }: { title: string; model: any; budget: number; colors: string[] }) {
  if (!model) return null
  const weights = model.weights || {}
  const allocs = model.allocations_usd || {}
  const sorted = Object.entries(weights)
    .filter(([, w]) => (w as number) > 0.001)
    .sort(([, a], [, b]) => (b as number) - (a as number))

  return (
    <div className="card space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-200">{title}</h3>
        <p className="text-xs text-muted mt-0.5">{model.model}</p>
      </div>

      <div className="flex gap-4">
        {model.expected_return != null && (
          <div>
            <p className="text-xs text-muted flex items-center gap-1 mb-0.5">Exp. Return <InfoTooltip {...EXPLANATIONS.expected_return} size="sm" /></p>
            <p className="text-sm font-mono text-emerald-400">{(model.expected_return * 100).toFixed(1)}%</p>
          </div>
        )}
        {model.annual_volatility != null && (
          <div>
            <p className="text-xs text-muted flex items-center gap-1 mb-0.5">Volatility <InfoTooltip {...EXPLANATIONS.annual_volatility} size="sm" /></p>
            <p className="text-sm font-mono text-gray-200">{(model.annual_volatility * 100).toFixed(1)}%</p>
          </div>
        )}
        {model.sharpe_ratio != null && (
          <div>
            <p className="text-xs text-muted flex items-center gap-1 mb-0.5">Sharpe <InfoTooltip {...EXPLANATIONS.sharpe_ratio} size="sm" /></p>
            <p className="text-sm font-mono text-accent">{model.sharpe_ratio?.toFixed(2)}</p>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 bg-surface border border-border rounded-lg p-3 leading-relaxed">
        {model.methodology}
      </p>

      <div className="space-y-2.5">
        {sorted.map(([ticker, weight], i) => (
          <div key={ticker} className="flex items-center gap-3">
            <span className="text-xs font-mono w-14 shrink-0" style={{ color: colors[i % colors.length] }}>{ticker}</span>
            <div className="flex-1 bg-surface rounded-full h-1.5">
              <div
                className="rounded-full h-1.5 transition-all"
                style={{ width: `${(weight as number) * 100}%`, backgroundColor: colors[i % colors.length] }}
              />
            </div>
            <span className="text-xs font-mono text-gray-300 w-12 text-right">{((weight as number) * 100).toFixed(1)}%</span>
            <span className="text-xs font-mono text-muted w-18 text-right">${allocs[ticker]?.toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
