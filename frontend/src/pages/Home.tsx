import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, BarChart2, PieChart, BookOpen, ChevronUp, ChevronDown, Briefcase, ArrowLeft } from 'lucide-react'
import { getMarketOverview } from '../utils/api'
import { useTickerStore } from '../store/useTickerStore'
import TickerSearch from '../components/ui/TickerSearch'

const MODULES = [
  {
    icon: BookOpen,
    title: 'Fundamental Analysis',
    subtitle: '12-step methodology',
    description: 'Business overview, sector dynamics, competitive positioning, management quality, P&L, cash flows, balance sheet, valuation, and final investment rating.',
    path: '/fundamental',
    color: 'text-blue-400',
    bg: 'bg-blue-950/20',
    border: 'border-blue-900/40',
    features: ['12-step methodology', 'DCF & multiples', 'Porter, BCG, SWOT', 'Buy / Sell rating'],
  },
  {
    icon: TrendingUp,
    title: 'Technical Analysis',
    subtitle: 'Predictive models',
    description: 'Statistical indicators, ML classifiers, and advanced time-series models with methodology panels on every chart.',
    path: '/technical',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/20',
    border: 'border-emerald-900/40',
    features: ['ARIMA + GARCH', 'Monte Carlo (1000 paths)', 'LightGBM classifier', 'MACD · RSI · Bollinger'],
  },
  {
    icon: PieChart,
    title: 'Portfolio Analysis',
    subtitle: 'Optimization engine',
    description: 'Build, optimize, and stress-test a multi-asset portfolio using institutional-grade frameworks.',
    path: '/portfolio',
    color: 'text-violet-400',
    bg: 'bg-violet-950/20',
    border: 'border-violet-900/40',
    features: ['Markowitz Max Sharpe', 'HRP — López de Prado', 'Efficient frontier', 'Asset suggestions'],
  },
  {
    icon: BarChart2,
    title: 'Debt Analysis',
    subtitle: 'Credit deep-dive',
    description: 'Full credit analysis with stress testing and recovery analysis. Live reference rates from the Fed.',
    path: '/debt',
    color: 'text-amber-400',
    bg: 'bg-amber-950/20',
    border: 'border-amber-900/40',
    features: ['Net Debt / EBITDA · ICR · DSCR', 'Stress test (3 scenarios)', 'Recovery / LGD analysis', 'SOFR · EURIBOR · Treasuries'],
  },
]

const CAT_COLORS: Record<string, string> = {
  Equities: 'text-blue-400/60',
  Volatility: 'text-orange-400/60',
  Rates: 'text-yellow-400/60',
  Commodities: 'text-amber-400/60',
  FX: 'text-violet-400/60',
  Crypto: 'text-cyan-400/60',
}

export default function Home() {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)
  const navigate = useNavigate()
  const setTicker = useTickerStore(s => s.setTicker)

  const { data: market } = useQuery({
    queryKey: ['market-overview'],
    queryFn: getMarketOverview,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  const handleSelect = (symbol: string) => {
    setTicker(symbol)
    setSelectedTicker(symbol)
  }

  const handleNavigate = (path: string) => {
    if (!selectedTicker) return
    setTicker(selectedTicker)
    if (path === '/portfolio') navigate('/portfolio')
    else navigate(`${path}/${selectedTicker}`)
  }

  const featuredStocks = market?.featured ?? []
  const indices = market?.indices ?? {}
  const tickerBarOrder: string[] = market?.ticker_bar_order ?? []

  return (
    <div className="flex flex-col -mx-6 -my-6">

      {/* Market ticker bar */}
      <div className="border-b border-border bg-surface overflow-x-auto">
        <div className="flex items-stretch min-w-max">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-4 border-r border-border/60 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-muted/40 tracking-wider">LIVE</span>
          </div>

          {/* Category groups */}
          {(() => {
            const order = tickerBarOrder.length > 0 ? tickerBarOrder : Object.keys(indices)
            let lastCat = ''
            return order.map((name, idx) => {
              const d = indices[name]
              if (!d?.price) return null
              const pos = d.change_pct != null && d.change_pct >= 0
              const cat = d.category || ''
              const showDivider = cat !== lastCat && idx > 0
              if (cat) lastCat = cat

              return (
                <div key={name} className="flex items-stretch">
                  {showDivider && <div className="w-px bg-border/40 mx-1 my-1.5" />}
                  <div className="flex items-center gap-2 px-3 py-2 hover:bg-surface/60 transition-colors group cursor-default">
                    <div className="flex flex-col items-start">
                      <span className={`text-[9px] font-mono uppercase tracking-wider leading-none mb-0.5 ${CAT_COLORS[cat] || 'text-muted/40'}`}>
                        {cat}
                      </span>
                      <span className="text-xs text-muted/80 leading-none whitespace-nowrap">{name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-mono text-gray-100 leading-none mb-0.5">
                        {d.price_fmt || d.price?.toLocaleString() || '—'}
                      </span>
                      {d.change_pct != null && (
                        <span className={`text-[10px] font-mono flex items-center gap-0.5 leading-none ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
                          {pos ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                          {Math.abs(d.change_pct).toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          })()}

          <div className="px-4 flex items-center shrink-0 border-l border-border/40">
            <span className="text-[9px] font-mono text-muted/25 tracking-wider">60s refresh</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center px-4 py-12">

        {/* Title */}
        <div className="max-w-3xl w-full text-center pt-16 pb-12 space-y-5">
          <div className="inline-block text-xs font-mono text-accent/80 border border-accent/20 px-3 py-1 rounded-full mb-2 tracking-wider">
            Institutional-grade · Free · Open
          </div>
          <h1 className="text-6xl font-light tracking-tight text-gray-100 leading-tight">
            The Great<br />
            <span className="text-accent">Analysis</span>
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-lg mx-auto">
            One platform for the complete financial analysis of any publicly traded company —
            fundamental, technical, portfolio, and debt.
          </p>
        </div>

        {/* Search */}
        <TickerSearch
          onSelect={handleSelect}
          className="w-full max-w-xl"
          autoFocus
        />

        {/* Selected ticker → module buttons */}
        {selectedTicker && (
          <div className="mt-5 w-full max-w-xl animate-fadeIn">
            <p className="text-xs text-muted/70 text-center mb-3">
              Analyse <span className="text-accent font-mono font-semibold">{selectedTicker}</span> with:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {MODULES.map(m => (
                <button
                  key={m.path}
                  onClick={() => handleNavigate(m.path)}
                  className={`flex flex-col items-center gap-1.5 px-3 py-3 ${m.bg} border ${m.border} rounded-lg hover:brightness-125 transition-all duration-150`}
                >
                  <m.icon size={15} className={m.color} />
                  <span className={`text-xs font-medium ${m.color}`}>{m.title.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Featured stocks */}
        <div className="mt-12 w-full max-w-3xl">
          <p className="text-xs text-muted/50 mb-4 text-center tracking-widest uppercase font-mono">Featured</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {featuredStocks.length > 0
              ? featuredStocks.map((s: any) => {
                  const pos = s.change_pct != null && s.change_pct >= 0
                  return (
                    <button
                      key={s.ticker}
                      onClick={() => handleSelect(s.ticker)}
                      className="bg-surface border border-border hover:border-accent/30 rounded-lg px-3 py-3 text-left transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs text-accent font-semibold">{s.ticker}</span>
                        {s.change_pct != null && (
                          <span className={`text-xs font-mono ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
                            {pos ? '+' : ''}{s.change_pct.toFixed(2)}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted/70 truncate">{s.name?.split(' ').slice(0, 3).join(' ')}</p>
                      {s.price && (
                        <p className="text-sm font-mono text-gray-200 mt-1.5">${s.price.toLocaleString()}</p>
                      )}
                    </button>
                  )
                })
              : ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'JPM', 'TSLA', 'AMZN', 'META'].map(t => (
                  <button key={t} onClick={() => handleSelect(t)}
                    className="bg-surface border border-border hover:border-accent/30 rounded-lg px-3 py-3 text-left transition-all">
                    <span className="font-mono text-xs text-accent font-semibold">{t}</span>
                    <div className="h-2.5 w-12 bg-border/40 rounded mt-2 animate-pulse" />
                    <div className="h-4 w-16 bg-border/25 rounded mt-1.5 animate-pulse" />
                  </button>
                ))
            }
          </div>
        </div>

        {/* Module cards */}
        <div className="mt-20 w-full max-w-4xl">
          <p className="text-xs text-muted/50 mb-6 text-center tracking-widest uppercase font-mono">What's inside</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MODULES.map(m => (
              <div key={m.path} className={`${m.bg} border ${m.border} rounded-xl p-5 space-y-3`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-black/20 border ${m.border}`}>
                    <m.icon size={16} className={m.color} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-100 text-sm">{m.title}</h3>
                    <p className={`text-xs ${m.color} mt-0.5 opacity-80`}>{m.subtitle}</p>
                  </div>
                </div>
                <p className="text-xs text-muted/80 leading-relaxed">{m.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {m.features.map(f => (
                    <span key={f} className={`text-xs px-2 py-0.5 rounded border ${m.border} ${m.color} opacity-70`}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-20 w-full max-w-3xl text-center">
          <p className="text-xs text-muted/50 mb-10 tracking-widest uppercase font-mono">How it works</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Search', desc: 'Type any ticker or company name. The platform fetches live data from public sources.' },
              { step: '02', title: 'Analyse', desc: 'Run the 12-step fundamental analysis, predictive technical models, or optimize a portfolio.' },
              { step: '03', title: 'Decide', desc: 'Get a final rating, price targets, stress scenarios, and re-rating catalysts in one view.' },
            ].map(s => (
              <div key={s.step} className="space-y-2">
                <span className="text-4xl font-light text-accent/20 font-mono">{s.step}</span>
                <h4 className="text-sm font-medium text-gray-300">{s.title}</h4>
                <p className="text-xs text-muted/70 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-2">
        <span className="text-xs font-mono text-muted/50 tracking-widest uppercase">The Great Analysis</span>
        <p className="text-xs text-muted/50 text-center">
          Data: yfinance · FMP · SEC EDGAR · FRED · For informational purposes only.
        </p>
        <span className="text-xs text-muted/40 font-mono">v0.1</span>
      </footer>
    </div>
  )
}
