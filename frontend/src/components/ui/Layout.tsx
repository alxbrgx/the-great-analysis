import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Suspense } from 'react'
import { useTickerStore } from '../../store/useTickerStore'
import { useWatchlistStore } from '../../store/useWatchlistStore'
import {
  Building2, Briefcase, Bookmark, Home,
} from 'lucide-react'
import TickerSearch from './TickerSearch'

// ─── Top-level sections (primary nav) ────────────────────────────────────────

interface SectionDef {
  id: 'public' | 'private' | 'sponsors' | 'watchlist'
  label: string
  icon: React.ElementType
  paths: string[]            // all paths that activate this section
  defaultPath: (ticker?: string) => string
  color: string              // accent color used in subnav
}

const SECTIONS: SectionDef[] = [
  {
    id: 'public', label: 'Public Markets', icon: Building2,
    paths: ['/public', '/fundamental', '/technical', '/debt', '/portfolio', '/compare'],
    defaultPath: t => t ? `/fundamental/${t}` : '/public',
    color: 'text-blue-400',
  },
  {
    id: 'private', label: 'Private Credit', icon: Briefcase,
    paths: ['/private', '/covenants', '/memo'],
    defaultPath: () => '/private',
    color: 'text-amber-400',
  },
  {
    id: 'sponsors', label: 'Sponsors', icon: Building2,
    paths: ['/sponsors'],
    defaultPath: () => '/sponsors',
    color: 'text-violet-400',
  },
  {
    id: 'watchlist', label: 'Watchlist', icon: Bookmark,
    paths: ['/watchlist'],
    defaultPath: () => '/watchlist',
    color: 'text-violet-300',
  },
]

// ─── Public Markets sub-nav ──────────────────────────────────────────────────

interface SubNavItem {
  label: string
  toBuilder: (ticker: string) => string
  matchPath: string
  needsTicker?: boolean
  color?: string
}

const PUBLIC_SUBNAV: SubNavItem[] = [
  { label: 'Fundamental', toBuilder: t => `/fundamental/${t}`, matchPath: 'fundamental', needsTicker: true, color: 'text-blue-400' },
  { label: 'Technical',   toBuilder: t => `/technical/${t}`,   matchPath: 'technical',   needsTicker: true, color: 'text-emerald-400' },
  { label: 'Debt',        toBuilder: t => `/debt/${t}`,        matchPath: 'debt',        needsTicker: true, color: 'text-amber-400' },
  { label: 'Portfolio',   toBuilder: () => '/portfolio',       matchPath: 'portfolio',                      color: 'text-violet-400' },
  { label: 'Compare',     toBuilder: () => '/compare',         matchPath: 'compare',                        color: 'text-sky-400' },
]

// ─── Layout component ────────────────────────────────────────────────────────

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const ticker = useTickerStore(s => s.ticker)
  const setTicker = useTickerStore(s => s.setTicker)
  const watchlistTotal = useWatchlistStore(
    s => (s.publicItems?.length ?? 0) + (s.privateDeals?.length ?? 0)
  )

  // Determine active top section
  const activeSection: SectionDef = (() => {
    const seg = '/' + location.pathname.split('/')[1]
    return SECTIONS.find(s => s.paths.includes(seg)) || SECTIONS[0]
  })()

  // Whether to render the public-markets subnav
  const showPublicSubnav = activeSection.id === 'public'
  const currentPathSegment = location.pathname.split('/')[1]

  const handleTickerSwitch = (symbol: string) => {
    if (!symbol) return
    setTicker(symbol)
    // Stay in the same view if applicable
    const segment = location.pathname.split('/')[1]
    const tickerViews = ['fundamental', 'technical', 'debt']
    if (tickerViews.includes(segment)) {
      navigate(`/${segment}/${symbol}`)
    } else {
      navigate(`/fundamental/${symbol}`)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── PRIMARY HEADER ─────────────────────────────────────────────────── */}
      <header className="border-b border-border bg-surface/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-5 py-2 flex items-center gap-4">
          {/* Brand */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-200 hover:text-white transition shrink-0"
            title="Home"
          >
            <Home size={14} />
            <span className="text-xs font-mono tracking-widest uppercase font-bold">TGA</span>
          </button>

          <span className="w-px h-4 bg-border shrink-0" />

          {/* Global ticker search */}
          <div className="w-56 shrink-0">
            <TickerSearch
              compact
              initialValue={ticker || ''}
              onSelect={handleTickerSwitch}
              placeholder="Search ticker..."
            />
          </div>

          {/* Primary nav (sections) */}
          <nav className="flex items-center gap-0.5 ml-auto">
            {SECTIONS.map(section => {
              const isActive = section.id === activeSection.id
              return (
                <button
                  key={section.id}
                  onClick={() => navigate(section.defaultPath(ticker))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium transition ${
                    isActive
                      ? `bg-card ${section.color} shadow-sm`
                      : 'text-muted hover:text-slate-200 hover:bg-surface'
                  }`}
                >
                  <section.icon size={12} />
                  <span>{section.label}</span>
                  {section.id === 'watchlist' && watchlistTotal > 0 && (
                    <span className={`ml-0.5 px-1.5 py-0 rounded text-[9px] font-mono ${
                      isActive ? 'bg-violet-700/60 text-violet-100' : 'bg-violet-900/40 text-violet-300'
                    }`}>
                      {watchlistTotal}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* ── SECONDARY SUBNAV (only for Public Markets context) ─────────── */}
        {showPublicSubnav && (
          <div className="px-5 py-1.5 border-t border-border bg-background/40 flex items-center gap-0.5 overflow-x-auto">
            <span className="text-[10px] font-mono text-muted uppercase tracking-wider mr-3 shrink-0">
              {ticker ? <>Viewing <span className="text-slate-200 font-bold">{ticker}</span></> : 'Pick a ticker →'}
            </span>
            {PUBLIC_SUBNAV.map(item => {
              const isActive = currentPathSegment === item.matchPath
              const disabled = item.needsTicker && !ticker
              const to = item.toBuilder(ticker || '')
              return (
                <button
                  key={item.matchPath}
                  onClick={() => !disabled && navigate(to)}
                  disabled={disabled}
                  className={`text-[11px] px-2.5 py-1 rounded transition ${
                    isActive
                      ? `bg-card ${item.color || 'text-slate-100'} shadow-sm`
                      : disabled
                        ? 'text-muted/40 cursor-not-allowed'
                        : 'text-muted hover:text-slate-200 hover:bg-surface'
                  }`}
                  title={disabled ? 'Pick a ticker first' : item.label}
                >
                  {item.label}
                </button>
              )
            })}
            <NavLink
              to="/guide"
              className={({ isActive }) =>
                `text-[11px] px-2.5 py-1 rounded transition ml-auto ${
                  isActive
                    ? 'bg-card text-slate-100 shadow-sm'
                    : 'text-muted hover:text-slate-200 hover:bg-surface'
                }`
              }
            >
              Guide
            </NavLink>
          </div>
        )}
      </header>

      {/* ── PAGE CONTENT ──────────────────────────────────────────────────── */}
      <main className="flex-1 px-6 py-6 max-w-screen-2xl mx-auto w-full">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-32 text-muted text-xs font-mono tracking-wider">
              <span className="animate-spin inline-block w-4 h-4 border-2 border-current/30 border-t-current rounded-full mr-2" />
              Loading…
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
