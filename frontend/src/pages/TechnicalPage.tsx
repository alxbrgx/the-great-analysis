import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getTechnicalIndicators, getMonteCarlo, getMlPrediction, getArimaGarch } from '../utils/api'
import { Info } from 'lucide-react'
import { useState } from 'react'
import Plot from 'react-plotly.js'
import InfoTooltip from '../components/ui/InfoTooltip'
import { EXPLANATIONS } from '../data/explanations'

export default function TechnicalPage() {
  const { ticker } = useParams<{ ticker: string }>()
  const [period, setPeriod] = useState('1y')

  const { data: indicators, isLoading: loadInd } = useQuery({
    queryKey: ['indicators', ticker, period],
    queryFn: () => getTechnicalIndicators(ticker!, period),
    enabled: !!ticker,
  })

  const { data: mc, isLoading: loadMc } = useQuery({
    queryKey: ['monte-carlo', ticker],
    queryFn: () => getMonteCarlo(ticker!),
    enabled: !!ticker,
  })

  const { data: ml, isLoading: loadMl } = useQuery({
    queryKey: ['ml', ticker],
    queryFn: () => getMlPrediction(ticker!),
    enabled: !!ticker,
  })

  const { data: arima, isLoading: loadArima } = useQuery({
    queryKey: ['arima', ticker],
    queryFn: () => getArimaGarch(ticker!),
    enabled: !!ticker,
  })

  const plotLayout = (title: string) => ({
    title: { text: title, font: { color: '#d1d5db', size: 14 } },
    paper_bgcolor: '#1a1a1a',
    plot_bgcolor: '#111111',
    font: { color: '#9ca3af', size: 11 },
    xaxis: { gridcolor: '#2a2a2a', linecolor: '#2a2a2a' },
    yaxis: { gridcolor: '#2a2a2a', linecolor: '#2a2a2a' },
    margin: { t: 40, r: 20, b: 40, l: 60 },
    showlegend: true,
    legend: { bgcolor: '#1a1a1a', bordercolor: '#2a2a2a', font: { color: '#9ca3af' } },
  })

  return (
    <div className="space-y-6">
      <div className="card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Technical Analysis — {ticker}</h1>
          <p className="text-sm text-muted mt-1">Predictive models · Statistical indicators · ML classifiers</p>
        </div>
        <select
          value={period}
          onChange={e => setPeriod(e.target.value)}
          className="bg-surface border border-border rounded px-3 py-1.5 text-sm text-gray-300 outline-none"
        >
          {['3mo', '6mo', '1y', '2y', '5y'].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Price + RSI */}
      {indicators && (
        <>
          <ChartCard
            title="Price Chart + Bollinger Bands"
            methodology="Bollinger Bands: 20-day SMA ± 2 standard deviations. Price touching the upper band signals potential overbought conditions; lower band signals oversold. Band width measures volatility — squeeze precedes breakout."
          >
            <Plot
              data={[
                { type: 'candlestick', x: indicators.dates,
                  open: indicators.ohlcv.open, high: indicators.ohlcv.high,
                  low: indicators.ohlcv.low, close: indicators.ohlcv.close,
                  name: ticker,
                  increasing: { line: { color: '#10b981' } },
                  decreasing: { line: { color: '#ef4444' } },
                },
                { type: 'scatter', x: indicators.dates, y: indicators.bollinger.upper, name: 'BB Upper', line: { color: '#6366f1', width: 1, dash: 'dot' } },
                { type: 'scatter', x: indicators.dates, y: indicators.bollinger.middle, name: 'BB Middle (SMA20)', line: { color: '#8b5cf6', width: 1 } },
                { type: 'scatter', x: indicators.dates, y: indicators.bollinger.lower, name: 'BB Lower', line: { color: '#6366f1', width: 1, dash: 'dot' } },
              ]}
              layout={{ ...plotLayout(`${ticker} — Price & Bollinger Bands`), height: 400 } as any}
              style={{ width: '100%' }}
              config={{ responsive: true, displayModeBar: false }}
            />
          </ChartCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartCard title="RSI (14)" methodology="Relative Strength Index measures momentum on a 0-100 scale. Above 70: overbought (potential reversal down). Below 30: oversold (potential reversal up). Best used to confirm trend signals, not in isolation.">
              <Plot
                data={[
                  { type: 'scatter', x: indicators.dates, y: indicators.rsi, name: 'RSI', line: { color: '#f59e0b' } },
                  { type: 'scatter', x: indicators.dates, y: Array(indicators.dates.length).fill(70), name: 'Overbought', line: { color: '#ef4444', dash: 'dash', width: 1 } },
                  { type: 'scatter', x: indicators.dates, y: Array(indicators.dates.length).fill(30), name: 'Oversold', line: { color: '#10b981', dash: 'dash', width: 1 } },
                ]}
                layout={{ ...plotLayout('RSI (14-day)'), height: 260, yaxis: { range: [0, 100], gridcolor: '#2a2a2a', linecolor: '#2a2a2a' } } as any}
                style={{ width: '100%' }}
                config={{ responsive: true, displayModeBar: false }}
              />
            </ChartCard>

            <ChartCard title="MACD (12, 26, 9)" methodology="MACD = EMA(12) - EMA(26). Signal = EMA(9) of MACD. Histogram = MACD - Signal. Crossover above signal line: bullish. Below: bearish. Divergence with price is a leading indicator.">
              <Plot
                data={[
                  { type: 'scatter', x: indicators.dates, y: indicators.macd.macd, name: 'MACD', line: { color: '#3b82f6' } },
                  { type: 'scatter', x: indicators.dates, y: indicators.macd.signal, name: 'Signal', line: { color: '#f97316' } },
                  { type: 'bar', x: indicators.dates, y: indicators.macd.histogram, name: 'Histogram',
                    marker: { color: indicators.macd.histogram.map((v: number) => v >= 0 ? '#10b981' : '#ef4444') } },
                ]}
                layout={{ ...plotLayout('MACD (12,26,9)'), height: 260 } as any}
                style={{ width: '100%' }}
                config={{ responsive: true, displayModeBar: false }}
              />
            </ChartCard>
          </div>
        </>
      )}

      {/* Monte Carlo */}
      {mc && (
        <ChartCard title="Monte Carlo Simulation" methodology={mc.methodology}>
          <div className="grid grid-cols-5 gap-3 mb-4">
            {Object.entries(mc.percentiles).map(([k, v]: [string, any]) => (
              <div key={k} className="bg-surface rounded p-3 text-center">
                <p className="text-xs text-muted uppercase">{k}</p>
                <p className="text-sm font-mono text-gray-200 mt-1">${(v as number).toFixed(0)}</p>
              </div>
            ))}
          </div>
          <Plot
            data={mc.sampled_paths.slice(0, 50).map((path: number[], i: number) => ({
              type: 'scatter', y: path,
              line: { color: `rgba(16, 185, 129, ${i < 5 ? 0.6 : 0.08})`, width: i < 5 ? 1.5 : 1 },
              showlegend: false,
            }))}
            layout={{ ...plotLayout(`Monte Carlo — ${mc.n_simulations} paths, ${mc.horizon_days} trading days`), height: 350 } as any}
            style={{ width: '100%' }}
            config={{ responsive: true, displayModeBar: false }}
          />
        </ChartCard>
      )}

      {/* ARIMA/GARCH */}
      {arima && !('error' in arima) && (
        <ChartCard title="ARIMA + GARCH Volatility Model" methodology={arima.methodology}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric label="Model" value={arima.model} />
            <Metric label="Current Price" value={`$${arima.current_price?.toFixed(2)}`} />
            <Metric label="Historical Vol (Ann.)" value={`${(arima.historical_vol_annualized * 100)?.toFixed(1)}%`} tooltip={EXPLANATIONS.garch} />
            <Metric label="30d Avg Vol Forecast" value={
              arima.garch_vol_forecast_30d
                ? `${(arima.garch_vol_forecast_30d.reduce((a: number, b: number) => a + b, 0) / arima.garch_vol_forecast_30d.length * 100).toFixed(2)}%`
                : '—'
            } tooltip={EXPLANATIONS.garch} />
          </div>
        </ChartCard>
      )}

      {/* ML Prediction */}
      {ml && !('error' in ml) && (
        <ChartCard title="ML Directional Classifier (LightGBM)" methodology={ml.methodology}>
          <div className="flex items-center gap-6 mb-4">
            <div>
              <p className="text-sm text-muted">Signal</p>
              <p className={`text-2xl font-bold font-mono mt-1 ${ml.signal === 'BUY' ? 'text-emerald-400' : ml.signal === 'SELL' ? 'text-red-400' : 'text-yellow-400'}`}>
                {ml.signal}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <div>
                <p className="text-sm text-muted flex items-center gap-1">P(Up) confidence <InfoTooltip {...EXPLANATIONS.lightgbm} size="sm" /></p>
                <p className="text-2xl font-mono text-gray-200 mt-1">{(ml.probability_up * 100).toFixed(1)}%</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted flex items-center gap-1">CV Accuracy <InfoTooltip {...EXPLANATIONS.cv_accuracy} size="sm" /></p>
              <p className="text-2xl font-mono text-gray-200 mt-1">{(ml.cv_accuracy_mean * 100).toFixed(1)}%</p>
            </div>
          </div>
          {ml.feature_importance && (
            <div className="space-y-2">
              <p className="text-xs text-muted uppercase tracking-wider flex items-center gap-1">
                Feature Importance <InfoTooltip {...EXPLANATIONS.feature_importance} size="sm" />
              </p>
              {Object.entries(ml.feature_importance)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([feat, imp]: [string, any]) => (
                <div key={feat} className="flex items-center gap-3">
                  <span className="text-xs text-muted w-20">{feat}</span>
                  <div className="flex-1 bg-surface rounded-full h-1.5">
                    <div
                      className="bg-accent rounded-full h-1.5"
                      style={{ width: `${(imp / Math.max(...Object.values(ml.feature_importance) as number[])) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-400 w-8">{imp}</span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      )}
    </div>
  )
}

function ChartCard({ title, methodology, children }: { title: string; methodology: string; children: React.ReactNode }) {
  const [showInfo, setShowInfo] = useState(false)
  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-200">{title}</h2>
        <button onClick={() => setShowInfo(v => !v)} className="text-muted hover:text-gray-300 transition-colors">
          <Info size={16} />
        </button>
      </div>
      {showInfo && (
        <div className="bg-surface border border-border rounded p-3 text-xs text-gray-400 leading-relaxed">
          {methodology}
        </div>
      )}
      {children}
    </div>
  )
}

function Metric({ label, value, tooltip }: { label: string; value: string; tooltip?: { title: string; formula?: string; description: string; interpretation?: string } }) {
  return (
    <div className="bg-surface rounded p-3">
      <p className="text-xs text-muted flex items-center">
        {label}
        {tooltip && <InfoTooltip {...tooltip} size="sm" />}
      </p>
      <p className="text-sm font-mono text-gray-200 mt-1">{value}</p>
    </div>
  )
}
