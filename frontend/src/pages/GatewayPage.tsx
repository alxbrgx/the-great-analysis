import { useNavigate } from 'react-router-dom'
import { useMemo, useRef } from 'react'
import {
  BarChart2, BookOpen, TrendingUp, PieChart, Building2, FileText,
  Shield, GitCompare, Briefcase, Bookmark, Users, Compass,
  ArrowRight, Activity,
} from 'lucide-react'
import { useWatchlistStore } from '../store/useWatchlistStore'
import { useMemoStore } from '../store/useMemoStore'
import { useTickerStore } from '../store/useTickerStore'
import TickerSearch from '../components/ui/TickerSearch'
import { Card, Button, Badge, SectionHeader } from '../components/ui/primitives'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const timeSince = (ms: number) => {
  const diff = Date.now() - ms
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const days = Math.floor(hr / 24)
  if (days < 30) return `${days}d ago`
  return new Date(ms).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

// ─── Credit feature card (primary modules) ──────────────────────────────────────

function FeatureCard({
  icon: Icon, label, description, tag, onClick,
}: {
  icon: React.ElementType
  label: string
  description: string
  tag?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="text-left group bg-card border border-border hover:border-amber-700/50 hover:bg-surface rounded-lg p-4 transition flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-md bg-amber-950/30 border border-amber-800/30">
          <Icon size={16} className="text-amber-400" />
        </div>
        {tag && <Badge color="amber" variant="outline">{tag}</Badge>}
      </div>
      <div className="text-sm font-semibold text-slate-100">{label}</div>
      <div className="text-[11px] text-muted leading-snug">{description}</div>
    </button>
  )
}

// ─── Public tool tile (secondary modules) ───────────────────────────────────────

function ToolTile({
  icon: Icon, label, description, iconColor, onClick,
}: {
  icon: React.ElementType
  label: string
  description: string
  iconColor: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="text-left group bg-card border border-border hover:border-slate-500 hover:bg-surface rounded-lg p-3 transition"
    >
      <Icon size={14} className={`${iconColor} mb-1.5`} />
      <div className="text-xs font-semibold text-slate-100 mb-0.5">{label}</div>
      <div className="text-[10px] text-muted leading-snug">{description}</div>
    </button>
  )
}

// ─── Activity row ─────────────────────────────────────────────────────────────

function ActivityRow({
  icon: Icon, color, title, subtitle, time, onClick, kind,
}: {
  icon: React.ElementType
  color: string
  title: string
  subtitle: string
  time: string
  kind: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-surface rounded-md transition group text-left"
    >
      <div className={`p-1.5 rounded ${color === 'text-blue-400' ? 'bg-blue-950/30' :
        color === 'text-amber-400' ? 'bg-amber-950/30' : 'bg-violet-950/30'}`}>
        <Icon size={12} className={color} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-slate-100 truncate group-hover:text-white">{title}</div>
        <div className="text-[10px] text-muted truncate">{subtitle}</div>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span className="text-[9px] uppercase tracking-wider text-muted/60">{kind}</span>
        <span className="text-[10px] text-muted font-mono">{time}</span>
      </div>
    </button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GatewayPage() {
  const navigate = useNavigate()
  const setTicker = useTickerStore(s => s.setTicker)
  const publicItems = useWatchlistStore(s => s.publicItems)
  const privateDeals = useWatchlistStore(s => s.privateDeals)
  const memos = useMemoStore(s => s.memos)

  const watchlistTotal = publicItems.length + privateDeals.length
  const totalActivity = watchlistTotal + memos.length

  // Discreet access to the (hidden) interview-prep quiz: triple-click the logo.
  const brandClicks = useRef<number[]>([])
  const handleBrandClick = () => {
    const now = Date.now()
    brandClicks.current = [...brandClicks.current.filter(t => now - t < 700), now]
    if (brandClicks.current.length >= 3) {
      brandClicks.current = []
      navigate('/quiz')
    }
  }

  // Recent activity feed (only shown to a returning user who has saved work)
  const recentActivity = useMemo(() => {
    type ActivityItem = {
      key: string
      kind: 'PUBLIC' | 'PRIVATE' | 'MEMO'
      title: string
      subtitle: string
      time: number
      onClick: () => void
    }
    const items: ActivityItem[] = []
    publicItems.forEach(i => items.push({
      key: `pub-${i.id}`, kind: 'PUBLIC', title: i.ticker,
      subtitle: i.lastSnapshot?.sector || 'Public ticker',
      time: i.lastSnapshot?.fetchedAt || i.addedAt,
      onClick: () => { setTicker(i.ticker); navigate(`/fundamental/${i.ticker}`) },
    }))
    privateDeals.forEach(d => items.push({
      key: `priv-${d.id}`, kind: 'PRIVATE', title: d.companyName,
      subtitle: `${d.industry} · ${d.resultSnapshot.assessment.implied_rating.sp} · ND/EBITDA ${d.resultSnapshot.ratios.nd_ebitda?.toFixed(2)}x`,
      time: d.savedAt,
      onClick: () => navigate(`/private?dealId=${d.id}`),
    }))
    memos.forEach(m => items.push({
      key: `memo-${m.id}`, kind: 'MEMO', title: m.title,
      subtitle: `v${m.version} · ${m.status.replace('_', ' ')} · ${m.recommendation.replace(/_/g, ' ')}`,
      time: m.updatedAt,
      onClick: () => navigate(`/memo/${m.id}`),
    }))
    return items.sort((a, b) => b.time - a.time).slice(0, 8)
  }, [publicItems, privateDeals, memos, navigate, setTicker])

  const handleSearch = (symbol: string) => {
    if (!symbol) return
    setTicker(symbol)
    navigate(`/fundamental/${symbol}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar — minimal */}
      <header className="border-b border-border bg-surface/60 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBrandClick}
              className="text-xs font-mono tracking-widest uppercase font-semibold text-slate-200 select-none"
              aria-label="The Great Analysis"
            >
              TGA
            </button>
            <span className="w-px h-3 bg-border" />
            <span className="text-[11px] text-muted font-mono">The Great Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/watchlist')}
              className="flex items-center gap-1.5 text-[11px] font-mono text-muted hover:text-violet-300 border border-border hover:border-violet-700/50 rounded px-2.5 py-1 transition"
            >
              <Bookmark size={11} />
              Watchlist
              {watchlistTotal > 0 && (
                <span className="ml-0.5 px-1 py-0 bg-violet-900/50 text-violet-200 rounded text-[9px]">
                  {watchlistTotal}
                </span>
              )}
            </button>
            <span className="text-[10px] text-muted/40 font-mono ml-1">v0.4</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <section className="mb-12 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
              Personal project
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50 leading-tight mb-3">
            Company &amp; credit analysis
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed mb-2 max-w-2xl">
            A web platform to analyse companies and credit: leverage, coverage and cash-flow metrics,
            covenant stress tests and credit memos — for both private deals and listed issuers.
          </p>
          <p className="text-xs text-muted mb-6">
            Designed and built by Alexandre Bourgeois — Finance, NEOMA Business School.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              icon={Briefcase}
              iconRight={ArrowRight}
              onClick={() => navigate('/private?demo=1')}
            >
              Open the Private Credit workbench
            </Button>
            <Button variant="secondary" size="lg" icon={Building2} onClick={() => navigate('/public')}>
              Public-market tools
            </Button>
          </div>
          <p className="text-[10px] text-muted/70 mt-2">
            The workbench opens with a worked example — no input required.
          </p>
        </section>

        {/* ── PRIVATE CREDIT (primary) ───────────────────────────────────── */}
        <section className="mb-12">
          <SectionHeader
            icon={Briefcase}
            iconColor="text-amber-400"
            title="Private Credit"
            subtitle="leveraged loans & private debt — no ticker required"
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <FeatureCard
              icon={Briefcase}
              label="Credit Workbench"
              description="Ratios, leverage, stress test, implied rating & verdict — from manual input or Excel."
              tag="Start here"
              onClick={() => navigate('/private?demo=1')}
            />
            <FeatureCard
              icon={Shield}
              label="Stress Tracker"
              description="Move revenue, margin and rates with sliders to find covenant breaking points."
              onClick={() => privateDeals.length > 0 ? navigate(`/covenants/${privateDeals[0].id}`) : navigate('/private?demo=1')}
            />
            <FeatureCard
              icon={FileText}
              label="Credit Memos"
              description="Generate IC-grade memos with strengths, risks and financials — export to PDF."
              onClick={() => memos.length > 0 ? navigate(`/memo/${memos[0].id}`) : navigate('/private?demo=1')}
            />
            <FeatureCard
              icon={Users}
              label="Sponsors"
              description="Private-equity sponsor database with sector EV multiples for benchmarking."
              onClick={() => navigate('/sponsors')}
            />
          </div>
        </section>

        {/* ── PUBLIC MARKETS (secondary) ─────────────────────────────────── */}
        <section className="mb-12">
          <SectionHeader
            icon={Building2}
            iconColor="text-blue-400"
            title="Public Markets"
            subtitle="listed companies · live data — equity & quant toolkit"
            action={
              <div className="w-56 hidden sm:block">
                <TickerSearch compact onSelect={handleSearch} placeholder="Search a ticker…" />
              </div>
            }
          />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            <ToolTile icon={BookOpen}   iconColor="text-blue-400"    label="Fundamental" description="12-step analysis · DCF · ratios"        onClick={() => navigate('/public')} />
            <ToolTile icon={TrendingUp} iconColor="text-emerald-400" label="Technical"   description="ARIMA · GARCH · Monte Carlo · ML"      onClick={() => navigate('/public')} />
            <ToolTile icon={BarChart2}  iconColor="text-amber-400"   label="Debt"        description="ND/EBITDA · ICR · DSCR · stress test" onClick={() => navigate('/public')} />
            <ToolTile icon={PieChart}   iconColor="text-violet-400"  label="Portfolio"   description="Markowitz · HRP · efficient frontier" onClick={() => navigate('/portfolio')} />
            <ToolTile icon={GitCompare} iconColor="text-sky-400"     label="Compare"     description="Side-by-side fundamentals"            onClick={() => navigate('/compare')} />
            <ToolTile icon={Compass}    iconColor="text-slate-300"   label="Guide"       description="Methodology behind every model"       onClick={() => navigate('/guide')} />
          </div>
        </section>

        {/* ── RECENT ACTIVITY (returning user only) ──────────────────────── */}
        {totalActivity > 0 && (
          <section className="mb-12">
            <SectionHeader
              icon={Activity}
              iconColor="text-emerald-400"
              title="Recent activity"
              subtitle={`${totalActivity} items`}
              action={
                <button
                  onClick={() => navigate('/watchlist')}
                  className="text-[10px] text-muted hover:text-violet-300 flex items-center gap-1"
                >
                  Open Watchlist <ArrowRight size={10} />
                </button>
              }
            />
            <Card padding="sm">
              <div className="divide-y divide-border">
                {recentActivity.map(item => (
                  <ActivityRow
                    key={item.key}
                    icon={item.kind === 'PUBLIC' ? BarChart2 : item.kind === 'PRIVATE' ? Briefcase : FileText}
                    color={item.kind === 'PUBLIC' ? 'text-blue-400' : item.kind === 'PRIVATE' ? 'text-amber-400' : 'text-violet-300'}
                    title={item.title}
                    subtitle={item.subtitle}
                    time={timeSince(item.time)}
                    kind={item.kind}
                    onClick={item.onClick}
                  />
                ))}
              </div>
            </Card>
          </section>
        )}

        {/* Disclaimer */}
        <footer className="border-t border-border pt-4 mt-12">
          <p className="text-[10px] text-muted/50 text-center font-mono">
            For informational and educational purposes only. Not investment advice.
          </p>
        </footer>
      </main>
    </div>
  )
}
