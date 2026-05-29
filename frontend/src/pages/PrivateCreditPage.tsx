import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  BarChart2, Shield, FileText, Briefcase,
  ChevronRight, AlertTriangle, CheckCircle2, XCircle, Info,
  TrendingDown, TrendingUp, Activity, Layers, RefreshCw,
  Bookmark, BookmarkCheck, Upload, X,
} from 'lucide-react'
import { useWatchlistStore } from '../store/useWatchlistStore'
import { analyzePrivateCredit } from '../utils/api'
import ExcelImportModal, { type PeriodicRow } from '../components/ui/ExcelImportModal'
import { getSectorBenchmarks, SPONSORS } from '../data/sponsors'
import { DEAL_EXAMPLES } from '../data/dealExamples'

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormData {
  company_name: string
  industry: string
  fiscal_year: number
  currency: string
  revenue: number
  ebitda: number
  ebit: number
  interest_expense: number
  tax_rate: number
  cfo: number
  capex: number
  cash: number
  total_debt: number
  senior_secured_debt: number
  subordinated_debt: number
  revolving_credit_facility: number
  rcf_drawn: number
  enterprise_value: number
  equity_contribution: number
  purchase_price: number
  covenant_net_leverage_max: number
  covenant_interest_coverage_min: number
  covenant_capex_max: number
  tranche_a_amount: number
  tranche_a_rate: number
  tranche_a_amort_years: number
  tranche_b_amount: number
  tranche_b_rate: number
  tranche_b_amort_years: number
  da: number  // D&A — client-side only, used to derive ebit if ebit=0
}

interface AnalysisResult {
  company: { name: string; industry: string; fiscal_year: number; currency: string }
  income: { revenue: number; ebitda: number; ebit: number; interest_expense: number; capex: number; cfo: number }
  balance_sheet: { cash: number; total_debt: number; senior_secured_debt: number; net_debt: number }
  ratios: {
    nd_ebitda: number | null
    senior_leverage: number | null
    total_leverage: number | null
    icr: number | null
    dscr: number | null
    fcf_yield: number | null
    ebitda_margin: number | null
    cash_conversion: number | null
    fcf: number
    net_debt: number
    ev_ebitda: number | null
    equity_pct: number | null
  }
  covenants: { name: string; covenant: string; actual: string; headroom_turns: number; headroom_pct: number; status: string }[]
  stress_test: { scenario: string; revenue: number; ebitda: number; ebitda_margin: number; fcf: number; nd_ebitda: number | null; icr: number | null }[]
  debt_waterfall: { label: string; amount: number; rate?: number | null; annual_interest?: number; maturity_years?: number; drawn?: number; type: string }[]
  assessment: {
    scores: Record<string, number>
    total_score: number
    max_score: number
    verdict: string
    implied_rating: { sp: string; moodys: string; fitch: string }
    severe_stress_nd_ebitda: number | null
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  'Aerospace & Defense', 'Automotive', 'Business Services', 'Chemicals',
  'Construction & Engineering', 'Consumer Goods', 'Distribution',
  'Education', 'Energy (Oil & Gas)', 'Food & Beverage', 'Healthcare',
  'Healthcare Services', 'Hospitality & Leisure', 'Industrial Manufacturing',
  'Information Technology', 'Logistics & Transport', 'Media & Entertainment',
  'Pharmaceuticals', 'Real Estate', 'Retail', 'Software & SaaS',
  'Specialty Finance', 'Telecom', 'Utilities', 'Waste & Environment',
]

const EMPTY_FORM: FormData = {
  company_name: '', industry: '', fiscal_year: new Date().getFullYear() - 1, currency: 'USD',
  revenue: 0, ebitda: 0, ebit: 0, interest_expense: 0, tax_rate: 0.25,
  cfo: 0, capex: 0,
  cash: 0, total_debt: 0, senior_secured_debt: 0, subordinated_debt: 0,
  revolving_credit_facility: 0, rcf_drawn: 0,
  enterprise_value: 0, equity_contribution: 0, purchase_price: 0,
  covenant_net_leverage_max: 0, covenant_interest_coverage_min: 0, covenant_capex_max: 0,
  tranche_a_amount: 0, tranche_a_rate: 0, tranche_a_amort_years: 5,
  tranche_b_amount: 0, tranche_b_rate: 0, tranche_b_amort_years: 7,
  da: 0,
}

// ── Utility helpers ───────────────────────────────────────────────────────────

function fmt(v: number | null | undefined, decimals = 2): string {
  if (v == null) return '—'
  return v.toFixed(decimals)
}
function fmtX(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${v.toFixed(2)}x`
}
function fmtPct(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${(v * 100).toFixed(1)}%`
}
function fmtM(v: number | null | undefined, currency = 'USD'): string {
  if (v == null) return '—'
  const sym = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'
  if (Math.abs(v) >= 1000) return `${sym}${(v / 1000).toFixed(1)}B`
  return `${sym}${v.toFixed(1)}M`
}

function leverageColor(nd: number | null): string {
  if (nd == null) return 'text-muted'
  if (nd < 3) return 'text-emerald-400'
  if (nd < 4.5) return 'text-amber-400'
  return 'text-red-400'
}

function coverageColor(icr: number | null): string {
  if (icr == null) return 'text-muted'
  if (icr > 3.5) return 'text-emerald-400'
  if (icr > 2) return 'text-amber-400'
  return 'text-red-400'
}

function statusIcon(status: string) {
  if (status === 'ok') return <CheckCircle2 size={14} className="text-emerald-400" />
  if (status === 'warning') return <AlertTriangle size={14} className="text-amber-400" />
  return <XCircle size={14} className="text-red-400" />
}

function verdictColor(v: string): string {
  if (v === 'Strong Credit') return 'text-emerald-400'
  if (v === 'Adequate Credit') return 'text-blue-400'
  if (v === 'Marginal Credit') return 'text-amber-400'
  if (v === 'Weak Credit') return 'text-orange-400'
  return 'text-red-400'
}

// ── Form components ───────────────────────────────────────────────────────────

function Section({
  title, icon: Icon, children, anchor, defaultOpen = true, hint,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  anchor?: string
  defaultOpen?: boolean
  hint?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div id={anchor} className="scroll-mt-32">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 py-2 px-1 hover:bg-surface/40 rounded transition group"
      >
        <div className="flex items-center gap-2">
          <Icon size={13} className="text-amber-400" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-200 group-hover:text-white">
            {title}
          </span>
          {hint && (
            <span className="text-[10px] text-muted normal-case tracking-normal">— {hint}</span>
          )}
        </div>
        <ChevronRight size={11} className={`text-muted transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 pb-2">
          {children}
        </div>
      )}
    </div>
  )
}

interface FieldProps {
  label: string
  name: keyof FormData
  value: number | string
  onChange: (name: keyof FormData, value: string) => void
  type?: 'number' | 'text'
  suffix?: string
  hint?: string
  span?: boolean
  min?: number
  step?: number
  select?: string[]
}

function Field({ label, name, value, onChange, type = 'number', suffix, hint, span, min, step = 1, select }: FieldProps) {
  const baseInputClass = "w-full text-xs text-slate-100 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-600 focus:border-amber-600 border border-border transition-colors hover:border-slate-500"
  return (
    <div className={span ? 'col-span-2 md:col-span-3' : ''}>
      <label className="block text-[10px] font-medium text-muted mb-1 uppercase tracking-wider">{label}</label>
      {select ? (
        <select
          value={value}
          onChange={e => onChange(name, e.target.value)}
          className={baseInputClass}
        >
          <option value="">Select…</option>
          {select.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <div className="relative">
          <input
            type={type}
            value={value}
            min={min}
            step={step}
            onChange={e => onChange(name, e.target.value)}
            className={`${baseInputClass} ${suffix ? 'pr-9 font-mono' : ''}`}
            placeholder="0"
          />
          {suffix && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted font-mono pointer-events-none">{suffix}</span>
          )}
        </div>
      )}
      {hint && <p className="text-[9px] text-muted/60 mt-1 font-mono">{hint}</p>}
    </div>
  )
}

// ── Result panels ─────────────────────────────────────────────────────────────

function RatioCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-md p-3.5">
      <p className="text-[10px] font-medium text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-light tracking-tight font-mono ${color || 'text-slate-100'}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted font-mono mt-0.5">{sub}</p>}
    </div>
  )
}

function WaterfallBar({ items, currency }: { items: AnalysisResult['debt_waterfall']; currency: string }) {
  const total = items.reduce((s, i) => s + (i.type === 'revolving' ? (i.drawn ?? 0) : i.amount), 0)
  const colors: Record<string, string> = {
    senior_secured: 'bg-blue-600',
    revolving: 'bg-blue-400',
    subordinated: 'bg-amber-500',
  }
  if (total === 0) return null
  return (
    <div className="space-y-2">
      <div className="flex h-8 rounded-lg overflow-hidden">
        {items.map((item, i) => {
          const amt = item.type === 'revolving' ? (item.drawn ?? 0) : item.amount
          const pct = (amt / total) * 100
          return (
            <div
              key={i}
              style={{ width: `${pct}%` }}
              className={`${colors[item.type] || 'bg-gray-600'} flex items-center justify-center`}
              title={`${item.label}: ${fmtM(amt, currency)}`}
            />
          )
        })}
      </div>
      <div className="flex flex-wrap gap-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-sm ${colors[item.type] || 'bg-gray-600'}`} />
            <span className="text-[10px] text-muted/60 font-mono">
              {item.label} {fmtM(item.type === 'revolving' ? (item.drawn ?? 0) : item.amount, currency)}
              {item.rate ? ` @ ${(item.rate * 100).toFixed(2)}%` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StressTable({ rows, currency }: { rows: AnalysisResult['stress_test']; currency: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-4 text-muted/50 font-mono text-[10px] uppercase">Scenario</th>
            <th className="text-right py-2 px-3 text-muted/50 font-mono text-[10px] uppercase">Revenue</th>
            <th className="text-right py-2 px-3 text-muted/50 font-mono text-[10px] uppercase">EBITDA</th>
            <th className="text-right py-2 px-3 text-muted/50 font-mono text-[10px] uppercase">Margin</th>
            <th className="text-right py-2 px-3 text-muted/50 font-mono text-[10px] uppercase">FCF</th>
            <th className="text-right py-2 px-3 text-muted/50 font-mono text-[10px] uppercase">ND/EBITDA</th>
            <th className="text-right py-2 pl-3 text-muted/50 font-mono text-[10px] uppercase">ICR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={`border-b border-border/20 ${i === 0 ? 'bg-surface/30' : ''}`}>
              <td className="py-2.5 pr-4 text-slate-300">{r.scenario}</td>
              <td className="py-2.5 px-3 text-right text-slate-300">{fmtM(r.revenue, currency)}</td>
              <td className="py-2.5 px-3 text-right text-slate-300">{fmtM(r.ebitda, currency)}</td>
              <td className="py-2.5 px-3 text-right text-slate-300">{fmt(r.ebitda_margin, 1)}%</td>
              <td className={`py-2.5 px-3 text-right ${r.fcf < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{fmtM(r.fcf, currency)}</td>
              <td className={`py-2.5 px-3 text-right ${leverageColor(r.nd_ebitda)}`}>{fmtX(r.nd_ebitda)}</td>
              <td className={`py-2.5 pl-3 text-right ${coverageColor(r.icr)}`}>{fmtX(r.icr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CovenantRow({ cov }: { cov: AnalysisResult['covenants'][0] }) {
  const barPct = Math.min(Math.max((1 - (cov.headroom_pct || 0)) * 100, 0), 100)
  const barColor = cov.status === 'ok' ? 'bg-emerald-600' : cov.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusIcon(cov.status)}
          <span className="text-xs text-slate-300">{cov.name}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-muted/50">{cov.covenant}</span>
          <span className="text-slate-200">{cov.actual}</span>
          <span className={cov.status === 'breach' ? 'text-red-400' : 'text-muted/50'}>
            {cov.headroom_turns > 0 ? '+' : ''}{fmt(cov.headroom_turns)}x headroom
          </span>
        </div>
      </div>
      <div className="h-1 bg-surface rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${barPct}%` }} />
      </div>
    </div>
  )
}

function ScoreBar({ label, score, max = 5 }: { label: string; score: number; max?: number }) {
  const colors = ['', 'bg-red-600', 'bg-orange-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500']
  const labels: Record<string, string> = {
    leverage: 'Leverage', coverage: 'Int. Coverage', dscr: 'DSCR', cash_conv: 'Cash Conversion',
  }
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-mono text-muted/50 w-28 shrink-0">{labels[label] || label}</span>
      <div className="flex gap-0.5 flex-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-sm ${i < score ? colors[score] : 'bg-surface'}`}
          />
        ))}
      </div>
      <span className="text-[10px] font-mono text-muted/40 w-6 text-right">{score}/{max}</span>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PrivateCreditPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'ratios' | 'leverage' | 'stress' | 'covenants' | 'memo' | 'monitoring'>('ratios')
  const [savedDealId, setSavedDealId] = useState<string | null>(null)
  const [saveToast, setSaveToast] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importedPeriodic, setImportedPeriodic] = useState<PeriodicRow[] | null>(null)
  const [importedExtraMetrics, setImportedExtraMetrics] = useState<Record<string, number> | null>(null)
  const [dealTermSheet, setDealTermSheet] = useState<{ name: string; size: number } | null>(null)
  const [covenantFile, setCovenantFile] = useState<{ name: string; size: number } | null>(null)
  const dealTermSheetRef = useRef<HTMLInputElement>(null)
  const covenantFileRef = useRef<HTMLInputElement>(null)

  // Watchlist store
  const savePrivateDeal = useWatchlistStore(s => s.savePrivateDeal)
  const updatePrivateDeal = useWatchlistStore(s => s.updatePrivateDeal)
  const getPrivateDealById = useWatchlistStore(s => s.getPrivateDealById)

  // Rehydrate from URL ?dealId=...
  useEffect(() => {
    const dealId = searchParams.get('dealId')
    if (!dealId) {
      // No URL param → make sure we don't keep a stale savedDealId from a previous deal
      // (only if no result yet — preserve UX if user is mid-edit)
      if (!result) setSavedDealId(null)
      return
    }
    const deal = getPrivateDealById(dealId)
    if (!deal) {
      // Deal was deleted — clean URL and reset state, show toast
      setSavedDealId(null)
      setSaveToast('That saved deal was deleted')
      setTimeout(() => setSaveToast(null), 3000)
      // Drop the URL param without full reload
      navigate('/private', { replace: true })
      return
    }
    // Rehydrate form
    setForm(prev => ({ ...prev, ...(deal.formSnapshot as Partial<FormData>) }))
    setSavedDealId(dealId)
    // Auto-run analysis to refresh result view
    setTimeout(() => {
      void runAnalysisFromForm({ ...EMPTY_FORM, ...(deal.formSnapshot as Partial<FormData>) } as FormData)
    }, 50)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Sector benchmarks from sponsor database (fuzzy match)
  const sectorBenchmark = useMemo(() => {
    if (!form.industry) return null
    const benchmarks = getSectorBenchmarks()
    const industryLower = form.industry.toLowerCase()
    // First try exact match, then partial
    const matches = Object.entries(benchmarks).filter(([sector]) => {
      const s = sector.toLowerCase()
      return s === industryLower || s.includes(industryLower) || industryLower.includes(s)
    })
    if (matches.length === 0) return null
    // Aggregate matched sectors
    const allDeals = matches.flatMap(([, b]) => b.recentDeals)
    const multiples = allDeals.map(d => d.evMultiple).filter((x): x is number => x != null)
    multiples.sort((a, b) => a - b)
    const median = multiples.length === 0 ? null : multiples.length % 2 === 1
      ? multiples[Math.floor(multiples.length / 2)]
      : (multiples[multiples.length / 2 - 1] + multiples[multiples.length / 2]) / 2
    const activeSponsors = SPONSORS.filter(sp =>
      sp.recentDeals.some(d => allDeals.includes(d))
    ).slice(0, 5)
    return {
      sectors: matches.map(([s]) => s),
      median,
      dealCount: allDeals.length,
      recentDeals: allDeals.sort((a, b) => b.year - a.year).slice(0, 4),
      activeSponsors,
    }
  }, [form.industry])

  // Compute global covenant status from the result
  const covenantsOverallStatus = useMemo<'OK' | 'WARNING' | 'BREACH' | null>(() => {
    if (!result?.covenants || result.covenants.length === 0) return null
    const statuses = result.covenants.map(c => (c.status || '').toUpperCase())
    if (statuses.some(s => s.includes('BREACH') || s.includes('VIOLAT'))) return 'BREACH'
    if (statuses.some(s => s.includes('WARN') || s.includes('TIGHT') || s.includes('CAUTION'))) return 'WARNING'
    return 'OK'
  }, [result])

  const handleSaveToWatchlist = () => {
    if (!result) return
    const payload = {
      companyName: result.company.name,
      industry: result.company.industry,
      fiscalYear: result.company.fiscal_year,
      currency: result.company.currency,
      formSnapshot: { ...form },
      resultSnapshot: {
        ratios: {
          nd_ebitda: result.ratios.nd_ebitda,
          icr: result.ratios.icr,
          dscr: result.ratios.dscr,
          fcf: result.ratios.fcf,
          ebitda_margin: result.ratios.ebitda_margin,
          cash_conversion: result.ratios.cash_conversion,
        },
        assessment: {
          verdict: result.assessment.verdict,
          total_score: result.assessment.total_score,
          max_score: result.assessment.max_score,
          implied_rating: result.assessment.implied_rating,
        },
        covenantsStatus: covenantsOverallStatus,
      },
    }
    // Verify the deal still exists in the store before updating
    const stillExists = savedDealId ? !!getPrivateDealById(savedDealId) : false
    if (savedDealId && stillExists) {
      updatePrivateDeal(savedDealId, { ...payload, savedAt: Date.now() })
      setSaveToast('Deal updated in watchlist')
    } else {
      const id = savePrivateDeal(payload)
      setSavedDealId(id)
      setSaveToast('Deal saved to watchlist')
    }
    setTimeout(() => setSaveToast(null), 2500)
  }

  const handleChange = (name: keyof FormData, raw: string) => {
    setForm(prev => ({
      ...prev,
      [name]: typeof EMPTY_FORM[name] === 'number' ? (parseFloat(raw) || 0) : raw,
    }))
  }

  const [exampleMenuOpen, setExampleMenuOpen] = useState(false)

  const loadExample = (exampleId?: string) => {
    const example = exampleId
      ? DEAL_EXAMPLES.find(e => e.id === exampleId)
      : DEAL_EXAMPLES[0]
    if (!example) return
    const newForm = { ...EMPTY_FORM, ...(example.data as Partial<FormData>) } as FormData
    setForm(newForm)
    setResult(null)
    setError(null)
    setSavedDealId(null)
    setExampleMenuOpen(false)
    setSaveToast(`Loaded: ${example.label} — running analysis…`)
    setTimeout(() => setSaveToast(null), 2500)
    // Auto-run analysis so user immediately sees the results
    setTimeout(() => { void runAnalysisFromForm(newForm) }, 100)
  }

  // Recruiter 1-click demo: arriving via /private?demo=1 auto-loads the showcase deal
  const demoLoadedRef = useRef(false)
  useEffect(() => {
    if (demoLoadedRef.current) return
    if (searchParams.get('demo') && !searchParams.get('dealId')) {
      demoLoadedRef.current = true
      loadExample()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleReset = () => {
    setForm(EMPTY_FORM)
    setResult(null)
    setError(null)
    setSavedDealId(null)
    setImportedPeriodic(null)
    setImportedExtraMetrics(null)
    setDealTermSheet(null)
    setCovenantFile(null)
  }

  const runAnalysisFromForm = async (formToSubmit: FormData) => {
    setLoading(true)
    setError(null)
    try {
      // Strip client-only `da` field; derive ebit if not explicitly set
      const { da, ...apiPayload } = formToSubmit
      const effectiveEbit = apiPayload.ebit > 0
        ? apiPayload.ebit
        : (da > 0 && apiPayload.ebitda > 0 ? apiPayload.ebitda - da : 0)
      const data: AnalysisResult = await analyzePrivateCredit({ ...apiPayload, ebit: effectiveEbit })
      setResult(data)
      setActiveTab('ratios')
      setTimeout(() => {
        document.getElementById('results-anchor')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (e: any) {
      setError(e.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => runAnalysisFromForm(form)

  const currency = form.currency || 'USD'

  const impliedEV = useMemo(() => {
    if (result?.ratios.nd_ebitda && result.ratios.nd_ebitda > 0 && form.ebitda > 0) {
      return `EV/EBITDA: ${fmtX(result.ratios.ev_ebitda)}`
    }
    return null
  }, [result, form.ebitda])

  return (
    <div>

      {/* Page toolbar — slim, page-specific actions only */}
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Briefcase size={14} className="text-amber-400" />
          <h1 className="text-sm font-semibold text-slate-100">Private Credit Workbench</h1>
          <span className="text-[10px] text-muted ml-1">— manual input · CIM analysis · no ticker required</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Examples picker */}
          <div className="relative">
            <button
              onClick={() => setExampleMenuOpen(o => !o)}
              className="text-[11px] font-mono text-muted hover:text-amber-300 hover:bg-surface border border-border hover:border-border-strong px-2.5 py-1 rounded transition flex items-center gap-1"
              title="Load a pre-built deal example"
            >
              <FileText size={11} />
              Examples
              <ChevronRight size={9} className={`transition-transform ${exampleMenuOpen ? 'rotate-90' : ''}`} />
            </button>
            {exampleMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setExampleMenuOpen(false)} />
                <div className="absolute right-0 mt-1 z-50 w-[420px] max-h-[70vh] overflow-y-auto bg-card border border-border-strong rounded-lg shadow-soft">
                  <div className="px-3 py-2 border-b border-border text-[10px] text-muted uppercase tracking-wider">
                    {DEAL_EXAMPLES.length} pre-built examples — click to load
                  </div>
                  {DEAL_EXAMPLES.map(ex => (
                    <button
                      key={ex.id}
                      onClick={() => loadExample(ex.id)}
                      className="w-full text-left px-3 py-2.5 hover:bg-surface border-b border-border last:border-b-0 transition group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="text-xs font-semibold text-slate-100 group-hover:text-amber-300">
                          {ex.label}
                        </div>
                        <span className="text-[9px] font-mono text-muted shrink-0">
                          {ex.expectedVerdict}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted leading-snug mb-1.5">{ex.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {ex.tags.map(tag => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-surface-2 border border-border rounded text-muted">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setImportOpen(true)}
            className="text-[11px] font-mono text-muted hover:text-emerald-300 hover:bg-surface border border-border hover:border-border-strong px-2.5 py-1 rounded flex items-center gap-1 transition"
            title="Import from Excel/CSV"
          >
            <Upload size={11} /> Import
          </button>

          {result && (
            <button
              onClick={handleSaveToWatchlist}
              className={`flex items-center gap-1.5 text-[11px] font-mono transition border px-2.5 py-1 rounded ${
                savedDealId
                  ? 'text-violet-300 border-violet-700/50 bg-violet-950/30 hover:bg-violet-950/50'
                  : 'text-muted hover:text-violet-300 border-border hover:border-violet-700/50'
              }`}
              title={savedDealId ? 'Update saved deal' : 'Save to watchlist'}
            >
              {savedDealId ? <BookmarkCheck size={11} /> : <Bookmark size={11} />}
              {savedDealId ? 'Saved' : 'Save'}
            </button>
          )}
          {savedDealId && (
            <>
              <button
                onClick={() => navigate(`/covenants/${savedDealId}`)}
                className="flex items-center gap-1.5 text-[11px] font-mono text-rose-300 border border-rose-700/50 hover:bg-rose-950/30 px-2.5 py-1 rounded transition"
                title="Stress test covenants"
              >
                <Shield size={11} /> Stress
              </button>
              <button
                onClick={() => navigate(`/memo/new?dealId=${savedDealId}`)}
                className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300 border border-amber-700/50 hover:bg-amber-950/30 px-2.5 py-1 rounded transition"
                title="Generate IC Credit Memo"
              >
                <FileText size={11} /> Memo
              </button>
            </>
          )}

          <button
            onClick={handleReset}
            className="text-[11px] font-mono text-muted hover:text-rose-300 border border-border hover:border-rose-700/50 px-2 py-1 rounded transition"
            title="Reset form"
          >
            <RefreshCw size={11} />
          </button>
        </div>
      </div>

      {/* Save toast */}
      {saveToast && (
        <div className="fixed top-16 right-6 z-50 bg-violet-900/90 border border-violet-600/50 text-violet-100 text-xs px-3 py-2 rounded-md shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <BookmarkCheck size={12} />
            {saveToast}
          </div>
        </div>
      )}

      {/* Sticky action bar — always-visible Run button */}
      <div className="sticky top-[44px] z-30 bg-background/96 backdrop-blur-sm border-b border-border -mx-6 px-6 py-2.5 mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-[11px] text-muted">
          <span className="font-mono uppercase tracking-wider">
            {form.company_name || <span className="text-muted/40">(no company)</span>}
          </span>
          {form.industry && (
            <>
              <span className="text-muted/40">·</span>
              <span>{form.industry}</span>
            </>
          )}
          {result && (
            <>
              <span className="text-muted/40">·</span>
              <span className="text-emerald-400">
                ND/EBITDA {result.ratios.nd_ebitda?.toFixed(2)}x · {result.assessment.implied_rating.sp}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {error && (
            <span className="text-[11px] text-rose-400 font-mono mr-1" title={error}>
              <AlertTriangle size={11} className="inline mr-1" />
              {error.length > 50 ? error.slice(0, 50) + '…' : error}
            </span>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading || !form.company_name || !form.industry}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-medium rounded-md transition-colors"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block w-3 h-3 border border-white/30 border-t-white rounded-full" />
                Analyzing…
              </>
            ) : (
              <>
                Run Credit Analysis <ChevronRight size={12} />
              </>
            )}
          </button>
        </div>
      </div>

      <div>

        {/* Two-column layout: mini-nav on left, content on right */}
        <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-6">
          {/* Mini-nav (anchors to sections) */}
          <aside className="hidden lg:block">
            <div className="sticky top-32 space-y-1">
              <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Sections</p>
              {[
                { anchor: 'sec-company', label: 'Company', required: true },
                { anchor: 'sec-pnl', label: 'P&L', required: true },
                { anchor: 'sec-cash', label: 'Cash Flow', required: true },
                { anchor: 'sec-bs', label: 'Balance Sheet', required: true },
                { anchor: 'sec-deal', label: 'Deal Structure', required: false },
                { anchor: 'sec-tranches', label: 'Tranches', required: false },
                { anchor: 'sec-cov', label: 'Covenants', required: false },
              ].map(item => (
                <a
                  key={item.anchor}
                  href={`#${item.anchor}`}
                  className="flex items-center justify-between gap-2 text-[11px] px-2 py-1 rounded text-muted hover:text-amber-300 hover:bg-amber-950/20 transition"
                >
                  <span>{item.label}</span>
                  {item.required && <span className="text-[8px] text-amber-500/60 font-mono">REQ</span>}
                </a>
              ))}
              {result && (
                <a
                  href="#results-anchor"
                  className="flex items-center gap-1.5 text-[11px] px-2 py-1 mt-3 rounded text-emerald-400 hover:bg-emerald-950/20 border border-emerald-700/40 transition"
                >
                  <CheckCircle2 size={10} /> Results ↓
                </a>
              )}
            </div>
          </aside>

          {/* Content column */}
          <div className="space-y-6 min-w-0">

            {/* Intro */}
            <div className="space-y-2">
              <h1 className="text-2xl font-light text-slate-100 tracking-tight">Credit Analysis — No Ticker Required</h1>
              <p className="text-sm text-muted/50 max-w-2xl">
                Enter financial data from a CIM, investor presentation, or financial model.
                Instantly compute leverage, coverage, covenant headroom, and stress scenarios for any PE-backed company.
              </p>
            </div>

            {/* Input form */}
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-8">

          {/* Company */}
          <Section title="Company" icon={Briefcase} anchor="sec-company" defaultOpen hint="required">
            <Field label="Company Name" name="company_name" value={form.company_name} onChange={handleChange} type="text" span />
            <Field label="Industry" name="industry" value={form.industry} onChange={handleChange} type="text" select={INDUSTRIES} />
            <Field label="Fiscal Year" name="fiscal_year" value={form.fiscal_year} onChange={handleChange} min={2000} step={1} />
            <Field label="Currency" name="currency" value={form.currency} onChange={handleChange} type="text" select={['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD']} />
          </Section>

          {/* Sector benchmark widget */}
          {sectorBenchmark && (
            <div className="bg-violet-950/10 border border-violet-900/30 rounded-lg p-3 -mt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <BarChart2 size={11} className="text-violet-400" />
                    <span className="text-[10px] font-semibold text-violet-300 uppercase tracking-wider">
                      Sector Benchmark — {sectorBenchmark.sectors.join(' / ')}
                    </span>
                  </div>
                  {sectorBenchmark.median != null && (
                    <p className="text-[11px] text-slate-300">
                      Median EV/EBITDA: <span className="font-mono font-semibold text-violet-300">{sectorBenchmark.median.toFixed(1)}x</span>
                      <span className="text-muted ml-1.5">
                        across {sectorBenchmark.dealCount} recent PE deal{sectorBenchmark.dealCount > 1 ? 's' : ''}
                      </span>
                    </p>
                  )}
                  {sectorBenchmark.recentDeals.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {sectorBenchmark.recentDeals.map(d => (
                        <span key={d.company} className="text-[9px] font-mono px-1.5 py-0.5 bg-background/40 border border-border rounded text-muted">
                          {d.company} · {d.year}{d.evMultiple ? ` · ${d.evMultiple.toFixed(1)}x` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                  {sectorBenchmark.activeSponsors.length > 0 && (
                    <div className="text-[10px] text-muted mt-1.5">
                      Active sponsors:{' '}
                      {sectorBenchmark.activeSponsors.map(sp => sp.shortName || sp.name).join(' · ')}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => navigate('/sponsors')}
                  className="text-[10px] text-violet-300 hover:bg-violet-950/30 border border-violet-700/40 px-2 py-1 rounded transition shrink-0"
                >
                  Browse all
                </button>
              </div>
            </div>
          )}

          {/* P&L */}
          <Section title="Income Statement (in millions)" icon={BarChart2} anchor="sec-pnl" defaultOpen hint="required">
            <Field label="Revenue (LTM)" name="revenue" value={form.revenue} onChange={handleChange} suffix="M" hint="Last twelve months" />
            <Field label="EBITDA (LTM)" name="ebitda" value={form.ebitda} onChange={handleChange} suffix="M" hint="Adjusted EBITDA preferred" />
            <Field label="D&A" name="da" value={form.da} onChange={handleChange} suffix="M" hint="Auto-derives EBIT if EBIT=0" />
            <Field label="EBIT" name="ebit" value={form.ebit} onChange={handleChange} suffix="M" hint="Leave 0 if D&A provided above" />
            <Field label="Interest Expense (LTM)" name="interest_expense" value={form.interest_expense} onChange={handleChange} suffix="M" hint="Cash interest, net of income" />
            <Field label="Tax Rate" name="tax_rate" value={form.tax_rate} onChange={handleChange} suffix="%" hint="e.g. 0.25 for 25%" step={0.01} />
            {form.ebitda > 0 && form.da > 0 && form.ebit === 0 && (
              <div className="col-span-2 md:col-span-3 text-[10px] font-mono text-blue-300/60 bg-blue-950/10 border border-blue-700/20 rounded px-2.5 py-1.5">
                Implied EBIT = EBITDA − D&A = <span className="text-blue-300">{fmtM(form.ebitda - form.da, currency)}</span>
                <span className="text-muted/40 ml-2">— will be used in analysis</span>
              </div>
            )}
          </Section>

          {/* Cash flow */}
          <Section title="Cash Flow (in millions)" icon={Activity} anchor="sec-cash" defaultOpen hint="required">
            <Field label="Cash from Operations" name="cfo" value={form.cfo} onChange={handleChange} suffix="M" />
            <Field label="Capex" name="capex" value={form.capex} onChange={handleChange} suffix="M" hint="Maintenance + growth" />
          </Section>

          {/* Balance sheet */}
          <Section title="Balance Sheet (in millions)" icon={Layers} anchor="sec-bs" defaultOpen hint="required">
            <Field label="Cash & Equivalents" name="cash" value={form.cash} onChange={handleChange} suffix="M" />
            <Field label="Total Gross Debt" name="total_debt" value={form.total_debt} onChange={handleChange} suffix="M" />
            <Field label="Senior Secured Debt" name="senior_secured_debt" value={form.senior_secured_debt} onChange={handleChange} suffix="M" />
            <Field label="Subordinated / PIK" name="subordinated_debt" value={form.subordinated_debt} onChange={handleChange} suffix="M" />
            <Field label="RCF Commitment" name="revolving_credit_facility" value={form.revolving_credit_facility} onChange={handleChange} suffix="M" />
            <Field label="RCF Drawn" name="rcf_drawn" value={form.rcf_drawn} onChange={handleChange} suffix="M" />
          </Section>

          {/* Inline BS metrics */}
          {form.total_debt > 0 && (
            <div className="bg-blue-950/10 border border-blue-900/30 rounded-lg px-4 py-2.5 -mt-4 flex flex-wrap gap-5 text-[11px] font-mono">
              <span className="text-[9px] font-mono text-blue-300/40 uppercase tracking-wider self-center">Live BS</span>
              <div>
                <span className="text-muted/40">Net Debt </span>
                <span className="text-slate-300">{fmtM(form.total_debt - form.cash, currency)}</span>
              </div>
              {form.ebitda > 0 && (
                <>
                  <div>
                    <span className="text-muted/40">Gross Lev. </span>
                    <span className={leverageColor(form.total_debt / form.ebitda)}>{fmtX(form.total_debt / form.ebitda)}</span>
                  </div>
                  <div>
                    <span className="text-muted/40">Net Lev. </span>
                    <span className={leverageColor((form.total_debt - form.cash) / form.ebitda)}>{fmtX((form.total_debt - form.cash) / form.ebitda)}</span>
                  </div>
                  {form.interest_expense > 0 && (
                    <div>
                      <span className="text-muted/40">ICR </span>
                      <span className={coverageColor(form.ebitda / form.interest_expense)}>{fmtX(form.ebitda / form.interest_expense)}</span>
                    </div>
                  )}
                  {form.capex > 0 && form.interest_expense > 0 && (
                    <div>
                      <span className="text-muted/40">DSCR </span>
                      <span className={coverageColor((form.ebitda - form.capex) / form.interest_expense)}>{fmtX((form.ebitda - form.capex) / form.interest_expense)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Deal structure */}
          <Section title="Deal Structure" icon={FileText} anchor="sec-deal" defaultOpen={false} hint="optional — from term sheet / IM">
            <Field label="Enterprise Value" name="enterprise_value" value={form.enterprise_value} onChange={handleChange} suffix="M" hint="Total EV at close" />
            <Field label="Purchase Price (equity + debt)" name="purchase_price" value={form.purchase_price} onChange={handleChange} suffix="M" hint="Sources = equity + gross debt" />
            <Field label="Equity Contribution" name="equity_contribution" value={form.equity_contribution} onChange={handleChange} suffix="M" hint="Sponsor equity check at close" />
            {form.enterprise_value > 0 && form.equity_contribution > 0 && (
              <div className="col-span-2 md:col-span-3 text-[10px] font-mono text-muted/50 bg-background/30 border border-border/30 rounded px-2.5 py-1.5 flex gap-4">
                <span>Equity % <span className="text-slate-300">{((form.equity_contribution / form.enterprise_value) * 100).toFixed(1)}%</span></span>
                <span>Debt % <span className="text-slate-300">{(((form.enterprise_value - form.equity_contribution) / form.enterprise_value) * 100).toFixed(1)}%</span></span>
                {form.ebitda > 0 && <span>EV/EBITDA <span className="text-slate-300">{fmtX(form.enterprise_value / form.ebitda)}</span></span>}
              </div>
            )}
            {/* Term sheet attachment */}
            <div className="col-span-2 md:col-span-3 flex items-center gap-3 border-t border-border/20 pt-3 mt-1">
              <span className="text-[9px] font-mono text-muted/40 uppercase tracking-wider w-24 shrink-0">Term Sheet / IM</span>
              <button type="button" onClick={() => dealTermSheetRef.current?.click()}
                className="flex items-center gap-1.5 text-[11px] font-mono text-muted hover:text-amber-300 border border-border hover:border-amber-700/50 px-2.5 py-1 rounded transition">
                <Upload size={10} /> {dealTermSheet ? 'Replace' : 'Attach document'}
              </button>
              {dealTermSheet && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300/70">
                  <FileText size={11} />
                  <span className="truncate max-w-xs">{dealTermSheet.name}</span>
                  <span className="text-muted/30 text-[9px]">({(dealTermSheet.size / 1024).toFixed(0)} KB)</span>
                  <button type="button" onClick={() => setDealTermSheet(null)} className="text-muted/30 hover:text-rose-400"><X size={10} /></button>
                </div>
              )}
              <span className="text-[9px] text-muted/25 ml-auto">PDF, Word, Excel — stored locally</span>
              <input ref={dealTermSheetRef} type="file" accept=".pdf,.docx,.xlsx,.xlsm" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) setDealTermSheet({ name: f.name, size: f.size }); e.target.value = '' }} />
            </div>
          </Section>

          {/* Debt tranches */}
          <Section title="Debt Tranches" icon={BarChart2} anchor="sec-tranches" defaultOpen={false} hint="optional — from commitment letter">
            {/* TL A */}
            <div className="col-span-2 md:col-span-3">
              <p className="text-[9px] font-mono text-muted/40 uppercase tracking-wider">Term Loan A — amortizing · bank market · typically 5–6Y</p>
            </div>
            <Field label="TL A — Amount" name="tranche_a_amount" value={form.tranche_a_amount} onChange={handleChange} suffix="M" />
            <Field label="TL A — All-in Rate" name="tranche_a_rate" value={form.tranche_a_rate} onChange={handleChange} suffix="%" hint="SOFR/EURIBOR + spread, e.g. 0.085" step={0.001} />
            <Field label="TL A — Maturity (yr)" name="tranche_a_amort_years" value={form.tranche_a_amort_years} onChange={handleChange} step={0.5} hint="Avg. life" />
            {/* TL B */}
            <div className="col-span-2 md:col-span-3 border-t border-border/20 pt-2">
              <p className="text-[9px] font-mono text-muted/40 uppercase tracking-wider">Term Loan B — bullet · institutional market · typically 7Y</p>
            </div>
            <Field label="TL B — Amount" name="tranche_b_amount" value={form.tranche_b_amount} onChange={handleChange} suffix="M" />
            <Field label="TL B — All-in Rate" name="tranche_b_rate" value={form.tranche_b_rate} onChange={handleChange} suffix="%" hint="SOFR/EURIBOR + spread, e.g. 0.095" step={0.001} />
            <Field label="TL B — Maturity (yr)" name="tranche_b_amort_years" value={form.tranche_b_amort_years} onChange={handleChange} step={0.5} />
            {/* Summary */}
            {(form.tranche_a_amount > 0 || form.tranche_b_amount > 0) && (
              <div className="col-span-2 md:col-span-3 text-[10px] font-mono text-muted/50 bg-background/30 border border-border/30 rounded px-2.5 py-1.5 flex flex-wrap gap-4">
                <span>Total tranches <span className="text-slate-300">{fmtM(form.tranche_a_amount + form.tranche_b_amount, currency)}</span></span>
                {form.ebitda > 0 && <span>Tranche lev. <span className={leverageColor((form.tranche_a_amount + form.tranche_b_amount) / form.ebitda)}>{fmtX((form.tranche_a_amount + form.tranche_b_amount) / form.ebitda)}</span></span>}
                {(form.tranche_a_amount + form.tranche_b_amount) > 0 && (form.tranche_a_rate > 0 || form.tranche_b_rate > 0) && (
                  <span>Blended rate <span className="text-slate-300">
                    {((form.tranche_a_amount * form.tranche_a_rate + form.tranche_b_amount * form.tranche_b_rate) / (form.tranche_a_amount + form.tranche_b_amount) * 100).toFixed(2)}%
                  </span></span>
                )}
              </div>
            )}
          </Section>

          {/* Covenants */}
          <Section title="Financial Covenants" icon={Shield} anchor="sec-cov" defaultOpen={false} hint="leave 0 if maintenance-free">
            <div className="col-span-2 md:col-span-3">
              <p className="text-[9px] font-mono text-muted/40 leading-relaxed">
                Maintenance covenants (tested quarterly) — typical in European leveraged finance. TLBs are often covenant-lite (springing only). Enter thresholds from the credit agreement.
              </p>
            </div>
            <Field label="Max Net Leverage" name="covenant_net_leverage_max" value={form.covenant_net_leverage_max} onChange={handleChange} suffix="x" hint="e.g. 5.50x — tested vs ND/EBITDA" step={0.25} />
            <Field label="Min Interest Coverage" name="covenant_interest_coverage_min" value={form.covenant_interest_coverage_min} onChange={handleChange} suffix="x" hint="EBITDA / Cash Interest" step={0.25} />
            <Field label="Max Capex" name="covenant_capex_max" value={form.covenant_capex_max} onChange={handleChange} suffix="M" hint="Annual maintenance cap" />
            {/* Credit agreement attachment */}
            <div className="col-span-2 md:col-span-3 flex items-center gap-3 border-t border-border/20 pt-3 mt-1">
              <span className="text-[9px] font-mono text-muted/40 uppercase tracking-wider w-24 shrink-0">Credit Agreement</span>
              <button type="button" onClick={() => covenantFileRef.current?.click()}
                className="flex items-center gap-1.5 text-[11px] font-mono text-muted hover:text-rose-300 border border-border hover:border-rose-700/50 px-2.5 py-1 rounded transition">
                <Upload size={10} /> {covenantFile ? 'Replace' : 'Attach CA / covenant schedule'}
              </button>
              {covenantFile && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-rose-300/70">
                  <Shield size={11} />
                  <span className="truncate max-w-xs">{covenantFile.name}</span>
                  <span className="text-muted/30 text-[9px]">({(covenantFile.size / 1024).toFixed(0)} KB)</span>
                  <button type="button" onClick={() => setCovenantFile(null)} className="text-muted/30 hover:text-rose-400"><X size={10} /></button>
                </div>
              )}
              <span className="text-[9px] text-muted/25 ml-auto">PDF, Word — stored locally</span>
              <input ref={covenantFileRef} type="file" accept=".pdf,.docx" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) setCovenantFile({ name: f.name, size: f.size }); e.target.value = '' }} />
            </div>
          </Section>

          {/* Inline submit (visible at end of form for users who scrolled) */}
          <div className="flex items-center gap-4 pt-2 border-t border-border mt-4">
            <button
              onClick={handleSubmit}
              disabled={loading || !form.company_name || !form.industry}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {loading ? (
                <><span className="animate-spin inline-block w-3 h-3 border border-white/30 border-t-white rounded-full" /> Analyzing…</>
              ) : (
                <>Run Credit Analysis <ChevronRight size={14} /></>
              )}
            </button>
            <span className="text-[10px] text-muted/50">
              Tip: the Run button is also pinned at the top, always one click away
            </span>
            {error && (
              <p className="text-xs text-red-400 font-mono ml-auto">{error}</p>
            )}
          </div>
        </div>

        {/* Monitoring dashboard (visible as soon as Reporting data is imported) */}
        {importedPeriodic && importedPeriodic.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 size={13} className="text-blue-400" />
                <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-widest">Credit Monitoring History</span>
                <span className="text-[10px] text-muted/40 font-mono">{importedPeriodic.length} periods · most recent first</span>
              </div>
              {importedExtraMetrics && (
                <div className="flex gap-3 text-[10px] font-mono text-muted/50">
                  {importedExtraMetrics.gross_total_leverage != null && <span>Gross Lev <span className="text-slate-300">{importedExtraMetrics.gross_total_leverage.toFixed(2)}x</span></span>}
                  {importedExtraMetrics.net_total_leverage != null && <span>Net Lev <span className="text-slate-300">{importedExtraMetrics.net_total_leverage.toFixed(2)}x</span></span>}
                  {importedExtraMetrics.gross_1st_lien_leverage != null && <span>1L Lev <span className="text-slate-300">{importedExtraMetrics.gross_1st_lien_leverage.toFixed(2)}x</span></span>}
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-muted/40 font-medium text-[10px] uppercase">Date</th>
                    <th className="text-right py-2 px-3 text-muted/40 font-medium text-[10px] uppercase">LTM Rev</th>
                    <th className="text-right py-2 px-3 text-muted/40 font-medium text-[10px] uppercase">LTM EBITDA</th>
                    <th className="text-right py-2 px-3 text-muted/40 font-medium text-[10px] uppercase">Gross Lev.</th>
                    <th className="text-right py-2 px-3 text-muted/40 font-medium text-[10px] uppercase">Net Lev.</th>
                    <th className="text-right py-2 px-3 text-muted/40 font-medium text-[10px] uppercase">LTM FCF</th>
                    <th className="text-right py-2 pl-3 text-muted/40 font-medium text-[10px] uppercase">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {importedPeriodic.map((row, i) => {
                    const prev = importedPeriodic[i + 1]
                    const fmtN = (v: number | null) => v == null ? '—' : v >= 1000 ? `${(v/1000).toFixed(1)}B` : `${v.toFixed(0)}M`
                    const levColor = (v: number | null) => v == null ? 'text-muted/40' : v > 6 ? 'text-red-400' : v > 5 ? 'text-amber-400' : 'text-emerald-400'
                    const perfColor = (p: string | null) => {
                      if (!p) return 'text-muted/30'
                      const l = p.toLowerCase()
                      return l.includes('exceed') ? 'text-emerald-400' : (l.includes('watch') || l.includes('under')) ? 'text-amber-400' : l.includes('breach') ? 'text-red-400' : 'text-slate-300'
                    }
                    return (
                      <tr key={i} className={`border-b border-border/20 ${i === 0 ? 'bg-blue-950/10' : ''}`}>
                        <td className="py-2 pr-4 text-slate-300">{row.date?.slice(0, 10) ?? '—'}</td>
                        <td className="py-2 px-3 text-right text-muted/50">{fmtN(row.ltm_rev)}</td>
                        <td className="py-2 px-3 text-right">
                          <span className="text-slate-300">{fmtN(row.ltm_ebitda)}</span>
                          {prev?.ltm_ebitda != null && row.ltm_ebitda != null && (
                            row.ltm_ebitda > prev.ltm_ebitda
                              ? <TrendingUp size={10} className="inline ml-1 text-emerald-400" />
                              : row.ltm_ebitda < prev.ltm_ebitda
                              ? <TrendingDown size={10} className="inline ml-1 text-red-400" />
                              : null
                          )}
                        </td>
                        <td className={`py-2 px-3 text-right ${levColor(row.gross_total_leverage)}`}>{row.gross_total_leverage != null ? `${row.gross_total_leverage.toFixed(2)}x` : '—'}</td>
                        <td className={`py-2 px-3 text-right ${levColor(row.net_total_leverage)}`}>{row.net_total_leverage != null ? `${row.net_total_leverage.toFixed(2)}x` : '—'}</td>
                        <td className="py-2 px-3 text-right text-muted/50">{fmtN(row.ltm_fcf)}</td>
                        <td className={`py-2 pl-3 text-right ${perfColor(row.performance)}`}>{row.performance ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div id="results-anchor" className="space-y-6">

            {/* Assessment header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-surface border border-border rounded-2xl">
              <div>
                <p className="text-xs font-mono text-muted/40 uppercase tracking-widest mb-1">{result.company.industry} · FY{result.company.fiscal_year}</p>
                <h2 className="text-2xl font-light text-slate-100">{result.company.name}</h2>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-[10px] font-mono text-muted/40 uppercase">Verdict</p>
                  <p className={`text-lg font-medium ${verdictColor(result.assessment.verdict)}`}>{result.assessment.verdict}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-mono text-muted/40 uppercase">S&P Implied</p>
                  <p className="text-lg font-medium text-slate-200">{result.assessment.implied_rating.sp}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-mono text-muted/40 uppercase">Moody's</p>
                  <p className="text-lg font-medium text-slate-200">{result.assessment.implied_rating.moodys}</p>
                </div>
                {impliedEV && (
                  <div className="text-center">
                    <p className="text-[10px] font-mono text-muted/40 uppercase">Valuation</p>
                    <p className="text-sm font-mono text-slate-300">{impliedEV}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border overflow-x-auto">
              {([
                ['ratios', 'Ratios'],
                ['leverage', 'Leverage & Debt'],
                ['stress', 'Stress Test'],
                ['covenants', 'Covenants'],
                ['memo', 'Credit Memo'],
                ...(importedPeriodic && importedPeriodic.length > 0 ? [['monitoring', 'Monitoring']] : []),
              ] as [string, string][]).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                  className={`px-4 py-2 text-xs font-mono whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? 'text-amber-400 border-b-2 border-amber-400 -mb-px'
                      : 'text-muted/50 hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab: Credit Ratios */}
            {activeTab === 'ratios' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <RatioCard
                    label="Net Leverage"
                    value={fmtX(result.ratios.nd_ebitda)}
                    sub={`Net Debt: ${fmtM(result.ratios.net_debt, currency)}`}
                    color={leverageColor(result.ratios.nd_ebitda)}
                  />
                  <RatioCard
                    label="Senior Leverage"
                    value={fmtX(result.ratios.senior_leverage)}
                    sub="Senior Net Debt / EBITDA"
                    color={leverageColor(result.ratios.senior_leverage)}
                  />
                  <RatioCard
                    label="Interest Coverage"
                    value={fmtX(result.ratios.icr)}
                    sub="EBITDA / Interest Exp."
                    color={coverageColor(result.ratios.icr)}
                  />
                  <RatioCard
                    label="DSCR"
                    value={fmtX(result.ratios.dscr)}
                    sub="(EBITDA – Capex) / Interest"
                    color={coverageColor(result.ratios.dscr)}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <RatioCard label="EBITDA Margin" value={fmtPct(result.ratios.ebitda_margin)} sub={`EBITDA: ${fmtM(result.income.ebitda, currency)}`} />
                  <RatioCard label="Free Cash Flow" value={fmtM(result.ratios.fcf, currency)} sub="CFO – Capex" color={result.ratios.fcf < 0 ? 'text-red-400' : 'text-emerald-400'} />
                  <RatioCard label="Cash Conversion" value={fmtPct(result.ratios.cash_conversion)} sub="FCF / EBITDA" />
                  {result.ratios.fcf_yield != null && (
                    <RatioCard label="FCF Yield" value={fmtPct(result.ratios.fcf_yield)} sub="FCF / Enterprise Value" />
                  )}
                </div>

                {/* Score bars */}
                <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted/40 mb-4">Credit Score Breakdown</p>
                  {Object.entries(result.assessment.scores).map(([key, score]) => (
                    <ScoreBar key={key} label={key} score={score} />
                  ))}
                  <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                    <span className="text-xs text-muted/50 font-mono">Total</span>
                    <span className="text-xs font-mono text-slate-300">{result.assessment.total_score} / {result.assessment.max_score}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Leverage / Debt Structure */}
            {activeTab === 'leverage' && (
              <div className="space-y-6">
                <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted/40">Debt Waterfall</p>
                  {result.debt_waterfall.length > 0 ? (
                    <WaterfallBar items={result.debt_waterfall} currency={currency} />
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted/40">
                      <Info size={12} />
                      Fill in the debt tranche fields to see the waterfall
                    </div>
                  )}
                </div>

                {result.debt_waterfall.length > 0 && (
                  <div className="bg-surface border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-black/20">
                          <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase text-muted/50">Tranche</th>
                          <th className="text-right px-4 py-2.5 font-mono text-[10px] uppercase text-muted/50">Amount</th>
                          <th className="text-right px-4 py-2.5 font-mono text-[10px] uppercase text-muted/50">Rate</th>
                          <th className="text-right px-4 py-2.5 font-mono text-[10px] uppercase text-muted/50">Annual Int.</th>
                          <th className="text-right px-4 py-2.5 font-mono text-[10px] uppercase text-muted/50">Maturity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.debt_waterfall.map((item, i) => (
                          <tr key={i} className="border-b border-border/20">
                            <td className="px-4 py-2.5 text-slate-300">{item.label}</td>
                            <td className="px-4 py-2.5 text-right text-slate-300">{fmtM(item.amount, currency)}</td>
                            <td className="px-4 py-2.5 text-right text-slate-300">{item.rate != null ? `${(item.rate * 100).toFixed(2)}%` : '—'}</td>
                            <td className="px-4 py-2.5 text-right text-slate-300">{item.annual_interest != null ? fmtM(item.annual_interest, currency) : '—'}</td>
                            <td className="px-4 py-2.5 text-right text-slate-300">{item.maturity_years != null ? `${item.maturity_years}Y` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Key balance sheet */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <RatioCard label="Total Debt" value={fmtM(result.balance_sheet.total_debt, currency)} />
                  <RatioCard label="Net Debt" value={fmtM(result.balance_sheet.net_debt, currency)} />
                  <RatioCard label="Cash" value={fmtM(result.balance_sheet.cash, currency)} />
                  <RatioCard label="Total Leverage" value={fmtX(result.ratios.total_leverage)} sub="Total Debt / EBITDA" color={leverageColor(result.ratios.total_leverage)} />
                </div>
              </div>
            )}

            {/* Tab: Stress Test */}
            {activeTab === 'stress' && (
              <div className="space-y-4">
                <div className="bg-surface border border-border rounded-xl p-5">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted/40 mb-4">Sensitivity Analysis</p>
                  <StressTable rows={result.stress_test} currency={currency} />
                </div>
                {result.assessment.severe_stress_nd_ebitda != null && (
                  <div className={`flex items-start gap-3 p-4 rounded-xl border ${
                    result.assessment.severe_stress_nd_ebitda > 7
                      ? 'border-red-900/40 bg-red-950/10'
                      : result.assessment.severe_stress_nd_ebitda > 5.5
                      ? 'border-amber-900/40 bg-amber-950/10'
                      : 'border-emerald-900/40 bg-emerald-950/10'
                  }`}>
                    <TrendingDown size={14} className={
                      result.assessment.severe_stress_nd_ebitda > 7 ? 'text-red-400 mt-0.5'
                      : result.assessment.severe_stress_nd_ebitda > 5.5 ? 'text-amber-400 mt-0.5'
                      : 'text-emerald-400 mt-0.5'
                    } />
                    <div>
                      <p className="text-xs font-medium text-slate-200">Severe Stress — ND/EBITDA: {fmtX(result.assessment.severe_stress_nd_ebitda)}</p>
                      <p className="text-[11px] text-muted/50 mt-0.5">
                        {result.assessment.severe_stress_nd_ebitda > 7
                          ? 'Leverage is unsustainable in a severe downside — refinancing risk is high.'
                          : result.assessment.severe_stress_nd_ebitda > 5.5
                          ? 'Leverage rises materially under stress — limited headroom above typical covenant levels.'
                          : 'Credit structure demonstrates resilience even in a severe stress scenario.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Covenants */}
            {activeTab === 'covenants' && (
              <div className="space-y-4">
                {result.covenants.length === 0 ? (
                  <div className="flex items-center gap-3 p-5 bg-surface border border-border rounded-xl text-xs text-muted/50">
                    <Info size={14} />
                    No covenants entered. Fill in the covenant fields above to see headroom analysis.
                  </div>
                ) : (
                  <div className="bg-surface border border-border rounded-xl p-5 space-y-5">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted/40">Covenant Headroom</p>
                    {result.covenants.map((cov, i) => (
                      <CovenantRow key={i} cov={cov} />
                    ))}
                  </div>
                )}

                {/* Covenant legend */}
                <div className="flex items-center gap-6 text-[10px] font-mono text-muted/40">
                  <div className="flex items-center gap-1.5"><CheckCircle2 size={11} className="text-emerald-400" /> &gt; 0.5x headroom</div>
                  <div className="flex items-center gap-1.5"><AlertTriangle size={11} className="text-amber-400" /> &lt; 0.5x headroom</div>
                  <div className="flex items-center gap-1.5"><XCircle size={11} className="text-red-400" /> Breach</div>
                </div>
              </div>
            )}

            {/* Tab: Credit Memo */}
            {activeTab === 'memo' && (
              <div className="bg-surface border border-border rounded-2xl p-6 space-y-6 font-mono text-xs leading-relaxed">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <p className="text-[10px] text-muted/40 uppercase tracking-widest">Credit Memorandum</p>
                    <p className="text-base font-light text-slate-100 mt-0.5">{result.company.name}</p>
                  </div>
                  <div className="text-right text-[10px] text-muted/30">
                    <p>{result.company.industry}</p>
                    <p>FY{result.company.fiscal_year} · {result.company.currency}</p>
                    <p>Generated {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-widest text-amber-400/60">Executive Summary</p>
                  <p className="text-muted/70">
                    {result.company.name} is a {result.company.industry.toLowerCase()} company with LTM revenue of{' '}
                    {fmtM(result.income.revenue, currency)} and EBITDA of {fmtM(result.income.ebitda, currency)}{' '}
                    ({fmtPct(result.ratios.ebitda_margin)} margin). Net leverage stands at {fmtX(result.ratios.nd_ebitda)},{' '}
                    with interest coverage of {fmtX(result.ratios.icr)} and FCF generation of {fmtM(result.ratios.fcf, currency)}.
                    Based on current metrics, the credit is assessed as <span className={verdictColor(result.assessment.verdict)}>{result.assessment.verdict}</span>{' '}
                    with an implied rating of {result.assessment.implied_rating.sp} (S&P) / {result.assessment.implied_rating.moodys} (Moody's).
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { title: 'Key Strengths', items: [
                      result.ratios.icr != null && result.ratios.icr > 3 && `Strong interest coverage (${fmtX(result.ratios.icr)})`,
                      result.ratios.ebitda_margin != null && result.ratios.ebitda_margin > 0.2 && `High EBITDA margin (${fmtPct(result.ratios.ebitda_margin)})`,
                      result.ratios.fcf > 0 && `Positive free cash flow (${fmtM(result.ratios.fcf, currency)})`,
                      result.ratios.nd_ebitda != null && result.ratios.nd_ebitda < 3.5 && `Conservative leverage (${fmtX(result.ratios.nd_ebitda)})`,
                      result.ratios.cash_conversion != null && result.ratios.cash_conversion > 0.6 && `High cash conversion (${fmtPct(result.ratios.cash_conversion)})`,
                    ].filter(Boolean) },
                    { title: 'Key Risks', items: [
                      result.ratios.nd_ebitda != null && result.ratios.nd_ebitda > 5 && `High leverage (${fmtX(result.ratios.nd_ebitda)})`,
                      result.ratios.icr != null && result.ratios.icr < 2.5 && `Thin interest coverage (${fmtX(result.ratios.icr)})`,
                      result.ratios.fcf < 0 && `Negative FCF (${fmtM(result.ratios.fcf, currency)})`,
                      result.ratios.ebitda_margin != null && result.ratios.ebitda_margin < 0.1 && `Low margin (${fmtPct(result.ratios.ebitda_margin)})`,
                    ].filter(Boolean) },
                    { title: 'Covenant Position', items: [
                      result.covenants.length === 0 ? ['No covenants modelled'] :
                      result.covenants.map(c => `${c.name}: ${c.actual} vs ${c.covenant} (${c.headroom_turns > 0 ? '+' : ''}${fmt(c.headroom_turns)}x)`),
                    ].flat().filter(Boolean) },
                  ].map(col => (
                    <div key={col.title} className="space-y-2">
                      <p className="text-[9px] uppercase tracking-widest text-muted/40">{col.title}</p>
                      {(col.items as (string | false)[]).filter(Boolean).length === 0 ? (
                        <p className="text-muted/30">None identified</p>
                      ) : (
                        <ul className="space-y-1">
                          {(col.items as (string | false)[]).filter(Boolean).map((item, i) => (
                            <li key={i} className="text-muted/60 before:content-['—'] before:mr-1.5 before:text-muted/30">{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-muted/40 mb-2">Financial Summary</p>
                    <table className="w-full">
                      <tbody className="text-[11px]">
                        {[
                          ['Revenue', fmtM(result.income.revenue, currency)],
                          ['EBITDA', fmtM(result.income.ebitda, currency)],
                          ['EBITDA Margin', fmtPct(result.ratios.ebitda_margin)],
                          ['Capex', fmtM(result.income.capex, currency)],
                          ['Free Cash Flow', fmtM(result.ratios.fcf, currency)],
                          ['Cash', fmtM(result.balance_sheet.cash, currency)],
                          ['Net Debt', fmtM(result.balance_sheet.net_debt, currency)],
                        ].map(([label, value]) => (
                          <tr key={label} className="border-b border-border/20">
                            <td className="py-1.5 text-muted/50">{label}</td>
                            <td className="py-1.5 text-right text-slate-300">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-muted/40 mb-2">Credit Ratios</p>
                    <table className="w-full">
                      <tbody className="text-[11px]">
                        {[
                          ['Net Leverage', fmtX(result.ratios.nd_ebitda)],
                          ['Senior Leverage', fmtX(result.ratios.senior_leverage)],
                          ['Total Leverage', fmtX(result.ratios.total_leverage)],
                          ['Interest Coverage', fmtX(result.ratios.icr)],
                          ['DSCR', fmtX(result.ratios.dscr)],
                          ['Cash Conversion', fmtPct(result.ratios.cash_conversion)],
                          ['EV/EBITDA', fmtX(result.ratios.ev_ebitda)],
                        ].map(([label, value]) => (
                          <tr key={label} className="border-b border-border/20">
                            <td className="py-1.5 text-muted/50">{label}</td>
                            <td className="py-1.5 text-right text-slate-300">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/30 text-[9px] text-muted/20">
                  For informational purposes only. Based on manually entered data — not investment advice.
                  Generated by The Great Analysis — Private Credit Workbench.
                </div>
              </div>
            )}

            {/* Tab: Monitoring (from imported Reporting sheet) */}
            {activeTab === 'monitoring' && importedPeriodic && (
              <div className="space-y-4">
                {importedExtraMetrics && Object.keys(importedExtraMetrics).length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {importedExtraMetrics.gross_1st_lien_leverage != null && (
                      <RatioCard label="Gross 1st Lien" value={`${importedExtraMetrics.gross_1st_lien_leverage.toFixed(2)}x`} sub="As reported" color={leverageColor(importedExtraMetrics.gross_1st_lien_leverage)} />
                    )}
                    {importedExtraMetrics.gross_total_leverage != null && (
                      <RatioCard label="Gross Total Lev." value={`${importedExtraMetrics.gross_total_leverage.toFixed(2)}x`} sub="Total Debt / LTM EBITDA" color={leverageColor(importedExtraMetrics.gross_total_leverage)} />
                    )}
                    {importedExtraMetrics.net_total_leverage != null && (
                      <RatioCard label="Net Total Lev." value={`${importedExtraMetrics.net_total_leverage.toFixed(2)}x`} sub="Net Debt / LTM EBITDA" color={leverageColor(importedExtraMetrics.net_total_leverage)} />
                    )}
                    {importedExtraMetrics.last_fy_ebitda != null && (
                      <RatioCard label="Last FY EBITDA" value={fmtM(importedExtraMetrics.last_fy_ebitda, currency)} sub="Prior full fiscal year" />
                    )}
                  </div>
                )}
                <div className="bg-surface border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted/40">Periodic Reporting History</p>
                    <span className="text-[10px] font-mono text-muted/30">{importedPeriodic.length} periods</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="border-b border-border bg-black/10">
                          <th className="text-left px-4 py-2 text-muted/40 font-medium text-[10px] uppercase">Date</th>
                          <th className="text-right px-3 py-2 text-muted/40 font-medium text-[10px] uppercase">LTM Rev.</th>
                          <th className="text-right px-3 py-2 text-muted/40 font-medium text-[10px] uppercase">LTM EBITDA</th>
                          <th className="text-right px-3 py-2 text-muted/40 font-medium text-[10px] uppercase">Gross Lev.</th>
                          <th className="text-right px-3 py-2 text-muted/40 font-medium text-[10px] uppercase">Net Lev.</th>
                          <th className="text-right px-3 py-2 text-muted/40 font-medium text-[10px] uppercase">LTM FCF</th>
                          <th className="text-right px-4 py-2 text-muted/40 font-medium text-[10px] uppercase">Performance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importedPeriodic.map((row, i) => {
                          const prev = importedPeriodic[i + 1]
                          const fmtN = (v: number | null) => v == null ? '—' : v >= 1000 ? `${(v/1000).toFixed(1)}B` : `${v.toFixed(0)}M`
                          const levCl = (v: number | null) => v == null ? 'text-muted/30' : v > 6 ? 'text-red-400' : v > 5 ? 'text-amber-400' : v > 4 ? 'text-yellow-400' : 'text-emerald-400'
                          const perfCl = (p: string | null) => {
                            if (!p) return 'text-muted/30'
                            const l = p.toLowerCase()
                            return l.includes('exceed') ? 'text-emerald-400' : (l.includes('watch') || l.includes('under')) ? 'text-amber-400' : l.includes('breach') ? 'text-red-400' : 'text-slate-300'
                          }
                          return (
                            <tr key={i} className={`border-b border-border/20 ${i === 0 ? 'bg-emerald-950/10' : 'hover:bg-surface/30'}`}>
                              <td className="px-4 py-2 text-slate-300">{row.date?.slice(0, 10) ?? '—'}</td>
                              <td className="px-3 py-2 text-right text-muted/50">{fmtN(row.ltm_rev)}</td>
                              <td className="px-3 py-2 text-right">
                                <span className="text-slate-300">{fmtN(row.ltm_ebitda)}</span>
                                {prev?.ltm_ebitda != null && row.ltm_ebitda != null && (
                                  row.ltm_ebitda > prev.ltm_ebitda
                                    ? <TrendingUp size={10} className="inline ml-1 text-emerald-400" />
                                    : row.ltm_ebitda < prev.ltm_ebitda
                                    ? <TrendingDown size={10} className="inline ml-1 text-red-400" />
                                    : null
                                )}
                              </td>
                              <td className={`px-3 py-2 text-right ${levCl(row.gross_total_leverage)}`}>
                                {row.gross_total_leverage != null ? `${row.gross_total_leverage.toFixed(2)}x` : '—'}
                              </td>
                              <td className={`px-3 py-2 text-right ${levCl(row.net_total_leverage)}`}>
                                {row.net_total_leverage != null ? `${row.net_total_leverage.toFixed(2)}x` : '—'}
                                {prev?.net_total_leverage != null && row.net_total_leverage != null && (
                                  row.net_total_leverage < prev.net_total_leverage
                                    ? <TrendingDown size={10} className="inline ml-1 text-emerald-400" />
                                    : row.net_total_leverage > prev.net_total_leverage
                                    ? <TrendingUp size={10} className="inline ml-1 text-red-400" />
                                    : null
                                )}
                              </td>
                              <td className="px-3 py-2 text-right text-muted/50">{fmtN(row.ltm_fcf)}</td>
                              <td className={`px-4 py-2 text-right ${perfCl(row.performance)}`}>{row.performance ?? '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
          </div> {/* /content column */}
        </div> {/* /grid */}
      </div> {/* /max-w wrapper */}

      {/* Excel/CSV Import modal */}
      <ExcelImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={(data, extras) => {
          setForm(prev => ({ ...prev, ...data }))
          if (extras?.periodicRows && extras.periodicRows.length > 0) setImportedPeriodic(extras.periodicRows)
          if (extras?.extraMetrics && Object.keys(extras.extraMetrics).length > 0) setImportedExtraMetrics(extras.extraMetrics)
          const fieldCount = Object.keys(data).length
          const periodCount = extras?.periodicRows?.length ?? 0
          setSaveToast(`Imported ${fieldCount} fields${periodCount > 0 ? ` + ${periodCount} monitoring periods` : ''}`)
          setTimeout(() => setSaveToast(null), 3000)
        }}
      />
    </div>
  )
}
