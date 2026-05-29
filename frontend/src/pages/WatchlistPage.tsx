import { useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import {
  Bookmark, BarChart2, Briefcase, Trash2, ExternalLink,
  AlertTriangle, CheckCircle2, XCircle, Plus, Search,
  TrendingUp, Tag, Calendar, FileText, Edit3, Clock, Shield, Loader2,
} from 'lucide-react'
import { useWatchlistStore, PublicWatchItem, PrivateDealItem } from '../store/useWatchlistStore'
import { useTickerStore } from '../store/useTickerStore'
import { useMemoStore } from '../store/useMemoStore'
import { Card, Stat, Badge, EmptyState, Button, SectionHeader } from '../components/ui/primitives'
import TickerSearch from '../components/ui/TickerSearch'

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (ms: number) => {
  const d = new Date(ms)
  const today = new Date()
  const diffDays = Math.floor((today.getTime() - ms) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "today"
  if (diffDays === 1) return "yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' })
}

const fmtNum = (n: number | null | undefined, decimals = 1) =>
  n == null || isNaN(n) ? '—' : n.toFixed(decimals)

const fmtX = (n: number | null | undefined) =>
  n == null || isNaN(n) ? '—' : `${n.toFixed(2)}x`

// Verdict color mapping
const verdictColor = (verdict: string) => {
  const v = verdict.toLowerCase()
  if (v.includes('strong') || v.includes('investment')) return 'text-emerald-400 border-emerald-900/40 bg-emerald-950/20'
  if (v.includes('aggressive') || v.includes('cautious') || v.includes('high-yield')) return 'text-amber-400 border-amber-900/40 bg-amber-950/20'
  if (v.includes('distressed') || v.includes('avoid')) return 'text-rose-400 border-rose-900/40 bg-rose-950/20'
  return 'text-gray-400 border-gray-800 bg-surface/40'
}

const covenantStatusBadge = (status: string | null | undefined) => {
  if (status === 'OK') return { icon: CheckCircle2, color: 'text-emerald-400', label: 'OK' }
  if (status === 'WARNING') return { icon: AlertTriangle, color: 'text-amber-400', label: 'WARN' }
  if (status === 'BREACH') return { icon: XCircle, color: 'text-rose-400', label: 'BREACH' }
  return null
}

// ── Public ticker card ────────────────────────────────────────────────────────

function PublicCard({ item, onRemove, onOpen }: {
  item: PublicWatchItem
  onRemove: () => void
  onOpen: (path: string) => void
}) {
  return (
    <Card padding="md" className="group relative hover:border-blue-700/60">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={13} className="text-blue-400" />
            <h3 className="text-sm font-mono font-semibold text-slate-100 tracking-wider">{item.ticker}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted">
            <span>added {formatDate(item.addedAt)}</span>
            {item.lastSnapshot?.sector && (
              <>
                <span>·</span>
                <span>{item.lastSnapshot.sector}</span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 text-muted hover:text-rose-400 transition p-1"
          title="Remove from watchlist"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {item.lastSnapshot && (
        <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-border">
          <Stat label="Price" value={fmtNum(item.lastSnapshot.price, 2)} />
          <Stat label="ND/EBITDA" value={fmtX(item.lastSnapshot.netDebtEbitda)} />
          <Stat label="ICR" value={fmtX(item.lastSnapshot.icr)} />
        </div>
      )}

      {item.notes && (
        <p className="text-[11px] text-muted italic mb-3 line-clamp-2">"{item.notes}"</p>
      )}

      <div className="flex gap-1.5">
        <button
          onClick={() => onOpen(`/fundamental/${item.ticker}`)}
          className="flex-1 text-[10px] text-blue-400 hover:bg-blue-950/30 px-2 py-1 rounded border border-blue-900/40 transition"
        >
          Fundamental
        </button>
        <button
          onClick={() => onOpen(`/debt/${item.ticker}`)}
          className="flex-1 text-[10px] text-amber-400 hover:bg-amber-950/30 px-2 py-1 rounded border border-amber-900/40 transition"
        >
          Debt
        </button>
        <button
          onClick={() => onOpen(`/technical/${item.ticker}`)}
          className="flex-1 text-[10px] text-emerald-400 hover:bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/40 transition"
        >
          Technical
        </button>
      </div>
    </Card>
  )
}

// ── Private deal card ────────────────────────────────────────────────────────

function PrivateDealCard({ deal, onRemove, onOpen, onGenerateMemo, onOpenCovenants, memoCount }: {
  deal: PrivateDealItem
  onRemove: () => void
  onOpen: () => void
  onGenerateMemo: () => void
  onOpenCovenants: () => void
  memoCount: number
}) {
  const r = deal.resultSnapshot
  const covBadge = covenantStatusBadge(r.covenantsStatus)
  const verdictClass = verdictColor(r.assessment.verdict)
  const scorePct = (r.assessment.total_score / r.assessment.max_score) * 100

  // Map verdict to badge color
  const verdict = r.assessment.verdict.toLowerCase()
  const verdictBadgeColor: 'emerald' | 'amber' | 'rose' | 'slate' =
    verdict.includes('strong') || verdict.includes('investment') ? 'emerald' :
    verdict.includes('aggressive') || verdict.includes('cautious') || verdict.includes('marginal') ? 'amber' :
    verdict.includes('distressed') || verdict.includes('avoid') ? 'rose' :
    'slate'

  // Covenant status color
  const covColor = r.covenantsStatus === 'OK' ? 'emerald' :
                   r.covenantsStatus === 'WARNING' ? 'amber' :
                   r.covenantsStatus === 'BREACH' ? 'rose' : null

  return (
    <Card padding="md" className="group relative hover:border-amber-700/60">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase size={13} className="text-amber-400 shrink-0" />
            <h3 className="text-sm font-semibold text-slate-100 truncate">{deal.companyName}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted">
            <span>{deal.industry}</span>
            <span>·</span>
            <span>FY{deal.fiscalYear}</span>
            <span>·</span>
            <span>saved {formatDate(deal.savedAt)}</span>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 text-muted hover:text-rose-400 transition p-1 shrink-0"
          title="Remove deal"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Verdict + rating */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        <Badge color={verdictBadgeColor} variant="subtle">
          {r.assessment.verdict}
        </Badge>
        <Badge color="slate" variant="outline">
          S&P {r.assessment.implied_rating.sp}
        </Badge>
        {covColor && (
          <Badge color={covColor} variant="subtle" icon={covColor === 'emerald' ? CheckCircle2 : covColor === 'amber' ? AlertTriangle : XCircle}>
            Cov {r.covenantsStatus}
          </Badge>
        )}
      </div>

      {/* Key ratios */}
      <div className="grid grid-cols-4 gap-2 mb-3 pb-3 border-b border-border">
        <Stat label="ND/EBITDA" value={fmtX(r.ratios.nd_ebitda)} />
        <Stat label="ICR"       value={fmtX(r.ratios.icr)} />
        <Stat label="DSCR"      value={fmtX(r.ratios.dscr)} />
        <Stat label="FCF"       value={fmtNum(r.ratios.fcf, 0)} />
      </div>

      {/* Score */}
      <div className="text-[10px] text-muted mb-3">
        Score: <span className="text-slate-200 font-mono">{r.assessment.total_score}/{r.assessment.max_score}</span>
        <span className="ml-1 opacity-60">({scorePct.toFixed(0)}%)</span>
      </div>

      {deal.tags && deal.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-3">
          {deal.tags.map(tag => (
            <Badge key={tag} color="slate" variant="outline">{tag}</Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5">
        <button
          onClick={onOpen}
          className="text-[11px] text-amber-400 hover:bg-amber-950/30 px-2 py-1.5 rounded border border-amber-900/40 transition flex items-center justify-center gap-1"
          title="Open deal analysis"
        >
          <ExternalLink size={11} />
          Open
        </button>
        <button
          onClick={onOpenCovenants}
          className="text-[11px] text-rose-300 hover:bg-rose-950/30 px-2 py-1.5 rounded border border-rose-700/40 transition flex items-center justify-center gap-1"
          title="Stress test covenants"
        >
          <Shield size={11} />
          Stress
        </button>
        <button
          onClick={onGenerateMemo}
          className="text-[11px] text-violet-300 hover:bg-violet-950/30 px-2 py-1.5 rounded border border-violet-700/40 transition flex items-center justify-center gap-1"
          title={memoCount > 0 ? `${memoCount} memo(s) for this deal` : 'Generate IC memo'}
        >
          <FileText size={11} />
          {memoCount > 0 ? `Memo (${memoCount})` : 'Memo'}
        </button>
      </div>
    </Card>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function WatchlistPage() {
  const navigate = useNavigate()
  const setTicker = useTickerStore(s => s.setTicker)
  const publicItems = useWatchlistStore(s => s.publicItems)
  const privateDeals = useWatchlistStore(s => s.privateDeals)
  const removePublic = useWatchlistStore(s => s.removePublic)
  const removePrivateDeal = useWatchlistStore(s => s.removePrivateDeal)
  const addPublic = useWatchlistStore(s => s.addPublic)
  const memos = useMemoStore(s => s.memos)
  const deleteMemo = useMemoStore(s => s.deleteMemo)

  const [filter, setFilter] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'public' | 'private'>('all')
  const [newTicker, setNewTicker] = useState('')

  const filteredPublic = useMemo(() => {
    if (!filter) return publicItems
    const f = filter.toLowerCase()
    return publicItems.filter(i =>
      i.ticker.toLowerCase().includes(f) || i.notes?.toLowerCase().includes(f)
    )
  }, [publicItems, filter])

  const filteredPrivate = useMemo(() => {
    if (!filter) return privateDeals
    const f = filter.toLowerCase()
    return privateDeals.filter(d =>
      d.companyName.toLowerCase().includes(f) ||
      d.industry.toLowerCase().includes(f) ||
      d.tags?.some(t => t.toLowerCase().includes(f)) ||
      d.notes?.toLowerCase().includes(f)
    )
  }, [privateDeals, filter])

  // Stats
  const stats = useMemo(() => {
    const breachCount = privateDeals.filter(d => d.resultSnapshot.covenantsStatus === 'BREACH').length
    const warningCount = privateDeals.filter(d => d.resultSnapshot.covenantsStatus === 'WARNING').length
    return {
      total: publicItems.length + privateDeals.length,
      public: publicItems.length,
      private: privateDeals.length,
      breachCount,
      warningCount,
    }
  }, [publicItems, privateDeals])

  const [addToast, setAddToast] = useState<string | null>(null)
  const handleAddBySearch = (symbol: string) => {
    const t = symbol.trim().toUpperCase()
    if (!t) return
    const wasAlready = publicItems.some(i => i.ticker === t)
    addPublic(t)
    setNewTicker('')
    setAddToast(wasAlready ? `${t} already in watchlist` : `${t} added`)
    setTimeout(() => setAddToast(null), 2500)
  }
  const handleAddTicker = (e: React.FormEvent) => {
    e.preventDefault()
    handleAddBySearch(newTicker)
  }

  const handleOpenPublic = (path: string) => {
    const ticker = path.split('/')[2]
    if (ticker) setTicker(ticker)
    navigate(path)
  }

  const handleOpenDeal = (deal: PrivateDealItem) => {
    // Pass dealId as URL param so PrivateCreditPage can rehydrate
    navigate(`/private?dealId=${deal.id}`)
  }

  const memoCountByDeal = useMemo(() => {
    const map = new Map<string, number>()
    memos.forEach(m => map.set(m.dealId, (map.get(m.dealId) || 0) + 1))
    return map
  }, [memos])

  const handleGenerateMemo = (deal: PrivateDealItem) => {
    const existing = memos.filter(m => m.dealId === deal.id)
    if (existing.length > 0) {
      // Open the most recent one
      const latest = existing.sort((a, b) => b.updatedAt - a.updatedAt)[0]
      navigate(`/memo/${latest.id}`)
    } else {
      // Create new
      navigate(`/memo/new?dealId=${deal.id}`)
    }
  }

  const showPublic = activeTab === 'all' || activeTab === 'public'
  const showPrivate = activeTab === 'all' || activeTab === 'private'

  return (
    <div>
      {/* Toast */}
      {addToast && (
        <div className="fixed top-16 right-6 z-50 bg-violet-900/90 border border-violet-600/50 text-violet-100 text-xs px-3 py-2 rounded-md shadow-soft">
          {addToast}
        </div>
      )}

      {/* Page heading + stats */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Bookmark size={16} className="text-violet-400" />
          <h1 className="text-sm font-semibold text-slate-100">Watchlist</h1>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <div className="text-muted">
            Total: <span className="font-mono text-slate-200">{stats.total}</span>
          </div>
          <div className="text-muted">
            Public: <span className="font-mono text-blue-400">{stats.public}</span>
          </div>
          <div className="text-muted">
            Private: <span className="font-mono text-amber-400">{stats.private}</span>
          </div>
          {stats.breachCount > 0 && (
            <div className="text-rose-400 font-medium flex items-center gap-1">
              <XCircle size={11} /> {stats.breachCount} breach
            </div>
          )}
          {stats.warningCount > 0 && (
            <div className="text-amber-400 font-medium flex items-center gap-1">
              <AlertTriangle size={11} /> {stats.warningCount} warn
            </div>
          )}
        </div>
      </div>

      <div>
        {/* Add ticker — autocomplete via TickerSearch */}
        <Card padding="md" className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Plus size={13} className="text-blue-400" />
            <h2 className="text-[11px] font-semibold text-slate-300 uppercase tracking-widest">Add a public ticker</h2>
            <span className="text-[10px] text-muted">— search by symbol or company name, then click a result</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
            <TickerSearch
              compact
              placeholder="Search ticker (AAPL, Tesla, MC.PA…)"
              onSelect={handleAddBySearch}
              initialValue=""
            />
            <form onSubmit={handleAddTicker} className="flex items-center gap-1">
              <input
                type="text"
                value={newTicker}
                onChange={e => setNewTicker(e.target.value.toUpperCase())}
                placeholder="Or type any symbol"
                className="w-44 bg-card border border-border rounded-md px-2.5 py-1.5 text-xs font-mono text-slate-100 placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              />
              <button
                type="submit"
                disabled={!newTicker.trim()}
                className="text-[11px] text-blue-400 hover:bg-blue-950/30 disabled:opacity-30 disabled:cursor-not-allowed px-2.5 py-1.5 rounded border border-blue-700/50 transition flex items-center gap-1"
              >
                <Plus size={11} /> Add
              </button>
            </form>
          </div>
        </Card>

        {/* Filter + tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
          <div className="relative flex-1 max-w-md">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filter saved items by ticker, company, industry, tag..."
              className="w-full bg-card border border-border rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-violet-600 focus:border-violet-600"
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0.5 bg-card border border-border rounded-md p-0.5">
            {(['all', 'public', 'private'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-[11px] uppercase tracking-wider rounded transition ${
                  activeTab === tab
                    ? 'bg-surface text-slate-100 shadow-sm'
                    : 'text-muted hover:text-slate-200 hover:bg-surface/60'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {stats.total === 0 && (
          <EmptyState
            icon={Bookmark}
            title="No saved analyses yet"
            description="Add a public ticker above, or save a private credit deal from the Private Credit page."
            action={
              <>
                <Button variant="secondary" size="sm" icon={BarChart2} onClick={() => navigate('/public')}>
                  Browse public
                </Button>
                <Button variant="secondary" size="sm" icon={Briefcase} onClick={() => navigate('/private')}>
                  Add private deal
                </Button>
              </>
            }
          />
        )}

        {/* Public tickers section */}
        {showPublic && filteredPublic.length > 0 && (
          <section className="mb-8">
            <SectionHeader
              icon={BarChart2}
              iconColor="text-blue-400"
              title={`Public Tickers (${filteredPublic.length})`}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPublic.map(item => (
                <PublicCard
                  key={item.id}
                  item={item}
                  onRemove={() => removePublic(item.id)}
                  onOpen={handleOpenPublic}
                />
              ))}
            </div>
          </section>
        )}

        {/* Private deals section */}
        {showPrivate && filteredPrivate.length > 0 && (
          <section className="mb-8">
            <SectionHeader
              icon={Briefcase}
              iconColor="text-amber-400"
              title={`Private Deals (${filteredPrivate.length})`}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPrivate.map(deal => (
                <PrivateDealCard
                  key={deal.id}
                  deal={deal}
                  onRemove={() => removePrivateDeal(deal.id)}
                  onOpen={() => handleOpenDeal(deal)}
                  onGenerateMemo={() => handleGenerateMemo(deal)}
                  onOpenCovenants={() => navigate(`/covenants/${deal.id}`)}
                  memoCount={memoCountByDeal.get(deal.id) || 0}
                />
              ))}
            </div>
          </section>
        )}

        {/* Credit Memos section */}
        {memos.length > 0 && (
          <section className="mt-10 pt-6 border-t border-border">
            <SectionHeader
              icon={FileText}
              iconColor="text-violet-400"
              title={`Credit Memos (${memos.length})`}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {memos.map(memo => {
                const deal = privateDeals.find(d => d.id === memo.dealId)
                const recoColor: 'emerald' | 'amber' | 'rose' | 'slate' =
                  memo.recommendation === 'approve' ? 'emerald' :
                  memo.recommendation === 'approve_with_conditions' ? 'amber' :
                  memo.recommendation === 'decline' ? 'rose' : 'slate'
                const statusColor: 'emerald' | 'amber' | 'slate' =
                  memo.status === 'final' ? 'emerald' :
                  memo.status === 'in_review' ? 'amber' : 'slate'
                const StatusIcon =
                  memo.status === 'final' ? CheckCircle2 :
                  memo.status === 'in_review' ? Clock : Edit3
                return (
                  <Card key={memo.id} padding="md" className="group relative hover:border-violet-700/60">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText size={13} className="text-violet-400 shrink-0" />
                          <h3 className="text-sm font-semibold text-slate-100 truncate">{memo.title}</h3>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted">
                          <span className="font-mono">v{memo.version}</span>
                          {deal && (
                            <>
                              <span>·</span>
                              <span className="truncate">{deal.companyName}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('Delete this memo?')) deleteMemo(memo.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 text-muted hover:text-rose-400 transition p-1 shrink-0"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                      <Badge color={statusColor} variant="subtle" icon={StatusIcon}>
                        {memo.status.replace('_', ' ')}
                      </Badge>
                      <Badge color={recoColor} variant="subtle">
                        {memo.recommendation.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <div className="text-[10px] text-muted mb-3">
                      Edited {formatDate(memo.updatedAt)}
                    </div>

                    <button
                      onClick={() => navigate(`/memo/${memo.id}`)}
                      className="w-full text-[11px] text-violet-300 hover:bg-violet-950/30 px-2 py-1.5 rounded border border-violet-700/40 transition flex items-center justify-center gap-1"
                    >
                      <ExternalLink size={11} />
                      Open Memo
                    </button>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {/* No results from filter */}
        {filter && stats.total > 0 && filteredPublic.length === 0 && filteredPrivate.length === 0 && (
          <div className="text-center py-12 text-muted text-xs">
            No matches for "{filter}"
          </div>
        )}
      </div>
    </div>
  )
}
