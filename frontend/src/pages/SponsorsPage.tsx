import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Users, Search, MapPin, TrendingUp, Briefcase,
  Calendar, ExternalLink, Tag, BarChart3, ChevronRight,
  Globe, Award, AlertTriangle,
} from 'lucide-react'
import { SPONSORS, Sponsor, SponsorTier, getSectorBenchmarks } from '../data/sponsors'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtBn = (n: number) => `€${n.toFixed(n < 10 ? 1 : 0)}Bn`
const fmtMoney = (n: number) => n >= 1000 ? `€${(n / 1000).toFixed(1)}Bn` : `€${n}M`

const tierColor: Record<SponsorTier, string> = {
  Mega: 'bg-violet-950/30 text-violet-300 border-violet-700/50',
  Large: 'bg-blue-950/30 text-blue-300 border-blue-700/50',
  'Mid-cap': 'bg-emerald-950/30 text-emerald-300 border-emerald-700/50',
  'Lower-mid': 'bg-amber-950/30 text-amber-300 border-amber-700/50',
}

const statusColor = {
  active: 'text-emerald-400',
  exited: 'text-blue-400',
  'partial-exit': 'text-cyan-400',
  distressed: 'text-amber-400',
  default: 'text-rose-400',
}

// ─── Sector benchmarks panel ──────────────────────────────────────────────────

function SectorBenchmarks({ onSectorClick }: { onSectorClick: (sector: string) => void }) {
  const benchmarks = useMemo(() => getSectorBenchmarks(), [])
  const sorted = useMemo(
    () => Object.entries(benchmarks)
      .filter(([, b]) => b.medianEvMultiple != null)
      .sort(([, a], [, b]) => (b.medianEvMultiple ?? 0) - (a.medianEvMultiple ?? 0))
      .slice(0, 12),
    [benchmarks]
  )

  return (
    <div className="bg-card border border-border rounded-md p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={14} className="text-amber-400" />
        <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
          EV/EBITDA Multiples by Sector
        </h3>
        <span className="text-[10px] text-muted ml-auto">From {Object.values(benchmarks).reduce((acc, b) => acc + b.dealCount, 0)} recent deals</span>
      </div>
      <div className="space-y-1">
        {sorted.map(([sector, b]) => (
          <button
            key={sector}
            onClick={() => onSectorClick(sector)}
            className="w-full flex items-center justify-between p-2 hover:bg-surface/80 rounded transition group"
          >
            <span className="text-[11px] text-slate-300 group-hover:text-amber-300 text-left">{sector}</span>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-muted">{b.dealCount} deal{b.dealCount > 1 ? 's' : ''}</span>
              <span className="font-mono font-medium text-amber-300">{b.medianEvMultiple?.toFixed(1)}x</span>
            </div>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted/60 mt-3 italic">
        Source: curated deals from major PE sponsors. Approximation only — actual multiples vary by deal quality, growth, and timing.
      </p>
    </div>
  )
}

// ─── Sponsor card ─────────────────────────────────────────────────────────────

function SponsorCard({ sponsor, onClick }: { sponsor: Sponsor; onClick: () => void }) {
  const recent = sponsor.recentDeals.slice(0, 3)
  return (
    <button
      onClick={onClick}
      className="text-left bg-card border border-border rounded-md p-4 hover:border-violet-700/50 hover:bg-surface transition group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-100 group-hover:text-violet-300 truncate">
            {sponsor.shortName || sponsor.name}
          </h3>
          <div className="flex items-center gap-2 text-[10px] text-muted mt-0.5">
            <MapPin size={9} />
            <span>{sponsor.hq}</span>
            <span>·</span>
            <span>{sponsor.region}</span>
            <span>·</span>
            <span>Est. {sponsor.fundedYear}</span>
          </div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${tierColor[sponsor.tier]}`}>
          {sponsor.tier}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px] my-3 pb-3 border-b border-border">
        <div>
          <div className="text-[9px] text-muted uppercase tracking-wider">AUM</div>
          <div className="font-mono text-slate-200">{fmtBn(sponsor.aum)}</div>
        </div>
        <div>
          <div className="text-[9px] text-muted uppercase tracking-wider">Latest Fund</div>
          <div className="font-mono text-slate-200">{sponsor.latestFund ? `€${sponsor.latestFund.size}Bn` : '—'}</div>
        </div>
        <div>
          <div className="text-[9px] text-muted uppercase tracking-wider">IRR (avg)</div>
          <div className="font-mono text-emerald-300">{sponsor.trackRecord.avgIRR ? `${sponsor.trackRecord.avgIRR}%` : '—'}</div>
        </div>
      </div>

      <div className="text-[10px] text-muted mb-2 line-clamp-2">{sponsor.description}</div>

      {recent.length > 0 && (
        <div className="text-[10px]">
          <div className="text-muted mb-1">Recent deals:</div>
          <div className="flex flex-wrap gap-1">
            {recent.map(d => (
              <span key={d.company} className={`px-1.5 py-0.5 bg-background/40 border border-border rounded font-mono ${statusColor[d.status]}`}>
                {d.company} {d.year}
              </span>
            ))}
          </div>
        </div>
      )}
    </button>
  )
}

// ─── Sponsor detail panel ────────────────────────────────────────────────────

function SponsorDetail({ sponsor, onClose }: { sponsor: Sponsor; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border-strong rounded-md w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-soft">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-100">{sponsor.name}</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${tierColor[sponsor.tier]}`}>
                {sponsor.tier}
              </span>
            </div>
            <p className="text-[11px] text-muted mt-1">
              <MapPin size={9} className="inline mr-1" />
              {sponsor.hq} · {sponsor.region} · Est. {sponsor.fundedYear}
              {sponsor.website && <> · <a href={`https://${sponsor.website}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{sponsor.website}</a></>}
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-slate-200 text-xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-5">
          {/* Description */}
          <p className="text-xs text-slate-300 leading-relaxed">{sponsor.description}</p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="AUM" value={fmtBn(sponsor.aum)} />
            <Stat label="Latest Fund" value={sponsor.latestFund ? `€${sponsor.latestFund.size}Bn (${sponsor.latestFund.vintage})` : '—'} />
            <Stat label="Avg IRR" value={sponsor.trackRecord.avgIRR ? `${sponsor.trackRecord.avgIRR}%` : '—'} highlight="good" />
            <Stat label="Avg MOIC" value={sponsor.trackRecord.avgMOIC ? `${sponsor.trackRecord.avgMOIC}x` : '—'} highlight="good" />
            <Stat label="Defaults" value={`${sponsor.trackRecord.knownDefaults ?? 0}`} highlight={sponsor.trackRecord.knownDefaults && sponsor.trackRecord.knownDefaults > 2 ? 'danger' : 'neutral'} />
            <Stat label="Strategy" value={sponsor.strategy.length.toString() + ' lines'} />
          </div>

          {/* Sectors */}
          <div>
            <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-2">Sector Focus</h3>
            <div className="flex flex-wrap gap-1.5">
              {sponsor.sectors.map(s => (
                <span key={s} className="text-[10px] px-2 py-1 rounded border border-border bg-background/30 text-slate-300">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Strategies */}
          <div>
            <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-2">Strategies</h3>
            <div className="flex flex-wrap gap-1.5">
              {sponsor.strategy.map(s => (
                <span key={s} className="text-[10px] px-2 py-1 rounded border border-amber-900/30 bg-amber-950/10 text-amber-300">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Recent deals */}
          <div>
            <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-2">
              Recent Deals ({sponsor.recentDeals.length})
            </h3>
            <div className="space-y-1.5">
              {sponsor.recentDeals.map(deal => (
                <div key={deal.company} className="flex items-start justify-between gap-3 p-2.5 bg-background/40 border border-border rounded">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-200">{deal.company}</span>
                      <span className={`text-[9px] uppercase tracking-wider font-medium ${statusColor[deal.status]}`}>
                        {deal.status.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted mt-0.5">
                      {deal.year} · {deal.sector}
                      {deal.notes && <> · <em>{deal.notes}</em></>}
                    </div>
                  </div>
                  <div className="text-right text-[11px] shrink-0 font-mono">
                    {deal.ev && <div className="text-slate-200">{fmtMoney(deal.ev)}</div>}
                    {deal.evMultiple && <div className="text-amber-300">{deal.evMultiple.toFixed(1)}x EBITDA</div>}
                    {deal.leverage && <div className="text-violet-300">{deal.leverage.toFixed(1)}x Lev</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notable exits */}
          {sponsor.notableExits && sponsor.notableExits.length > 0 && (
            <div>
              <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Award size={11} className="text-emerald-400" />
                Notable Exits
              </h3>
              <ul className="text-[11px] text-slate-300 space-y-1">
                {sponsor.notableExits.map(exit => (
                  <li key={exit} className="flex items-center gap-2">
                    <span className="text-emerald-400">·</span> {exit}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, highlight = 'neutral' }: { label: string; value: string; highlight?: 'good' | 'neutral' | 'danger' }) {
  const color = highlight === 'good' ? 'text-emerald-300' : highlight === 'danger' ? 'text-rose-400' : 'text-slate-100'
  return (
    <div>
      <div className="text-[9px] text-muted uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-mono ${color}`}>{value}</div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const ALL_SECTORS = Array.from(new Set(SPONSORS.flatMap(s => s.sectors))).sort()
const ALL_REGIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All regions' },
  { value: 'Europe', label: 'Europe' },
  { value: 'France', label: 'France' },
  { value: 'UK', label: 'UK' },
  { value: 'Nordic', label: 'Nordic' },
  { value: 'US', label: 'US' },
  { value: 'Global', label: 'Global' },
]
const ALL_TIERS: SponsorTier[] = ['Mega', 'Large', 'Mid-cap', 'Lower-mid']

export default function SponsorsPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('')
  const [region, setRegion] = useState<string>('all')
  const [sector, setSector] = useState<string>('all')
  const [tier, setTier] = useState<string>('all')
  const [selected, setSelected] = useState<Sponsor | null>(null)

  const filtered = useMemo(() => {
    return SPONSORS.filter(s => {
      if (filter) {
        const f = filter.toLowerCase()
        const matchesText =
          s.name.toLowerCase().includes(f) ||
          s.shortName?.toLowerCase().includes(f) ||
          s.hq.toLowerCase().includes(f) ||
          s.recentDeals.some(d => d.company.toLowerCase().includes(f))
        if (!matchesText) return false
      }
      if (region !== 'all' && s.region !== region) return false
      if (tier !== 'all' && s.tier !== tier) return false
      if (sector !== 'all' && !s.sectors.some(x => x === sector)) return false
      return true
    })
  }, [filter, region, sector, tier])

  return (
    <div>
      {/* Page heading */}
      <div className="flex items-center gap-2 mb-4">
        <Users size={14} className="text-violet-400" />
        <h1 className="text-sm font-semibold text-slate-100">PE Sponsors & Comparable Transactions</h1>
        <span className="text-[11px] text-muted ml-1">— {SPONSORS.length} sponsors · sector multiples</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT: Filters & benchmarks */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Filters */}
          <div className="bg-card border border-border rounded-md p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Search size={13} className="text-violet-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Filters</h3>
            </div>

            <div>
              <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">Search</label>
              <input
                type="text"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Sponsor name, deal company, HQ..."
                className="w-full bg-background/50 border border-border/60 rounded px-2 py-1.5 text-xs text-slate-200 placeholder:text-muted/50 focus:outline-none focus:border-violet-700"
              />
            </div>

            <div>
              <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">Region</label>
              <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="w-full bg-background/50 border border-border/60 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-700"
              >
                {ALL_REGIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">Sector Focus</label>
              <select
                value={sector}
                onChange={e => setSector(e.target.value)}
                className="w-full bg-background/50 border border-border/60 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-700"
              >
                <option value="all">All sectors</option>
                {ALL_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">Tier</label>
              <div className="flex gap-1">
                <button
                  onClick={() => setTier('all')}
                  className={`text-[10px] px-2 py-1 rounded border transition ${tier === 'all' ? 'bg-violet-950/30 text-violet-300 border-violet-700/50' : 'border-border text-muted hover:text-slate-300'}`}
                >
                  All
                </button>
                {ALL_TIERS.map(t => (
                  <button
                    key={t}
                    onClick={() => setTier(t)}
                    className={`text-[10px] px-2 py-1 rounded border transition ${tier === t ? tierColor[t] : 'border-border text-muted hover:text-slate-300'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[10px] text-muted pt-2 border-t border-border">
              {filtered.length} of {SPONSORS.length} sponsors
            </div>
          </div>

          {/* Sector benchmarks */}
          <SectorBenchmarks onSectorClick={s => setSector(s)} />
        </aside>

        {/* RIGHT: Sponsor grid */}
        <div className="lg:col-span-8">
          {filtered.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border/60 rounded-lg">
              <Users size={32} className="text-muted mx-auto mb-3" />
              <h2 className="text-sm font-medium text-slate-200 mb-1">No matching sponsors</h2>
              <p className="text-xs text-muted">Try relaxing your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map(s => (
                <SponsorCard key={s.id} sponsor={s} onClick={() => setSelected(s)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selected && <SponsorDetail sponsor={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
