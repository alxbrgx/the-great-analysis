import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, FileText, Save, Printer, AlertCircle, CheckCircle2,
  XCircle, Clock, Edit3, Layers, Briefcase, BarChart2, Shield,
  TrendingDown, Users, Award, DollarSign, ListChecks,
  Eye, EyeOff, Copy, Trash2, ChevronDown, ChevronRight,
} from 'lucide-react'
import { useWatchlistStore, PrivateDealItem } from '../store/useWatchlistStore'
import { useMemoStore, CreditMemoSections, MemoStatus, MemoRecommendation, EMPTY_SECTIONS } from '../store/useMemoStore'
import { MEMO_TEMPLATES, MemoTemplateId } from '../data/memoTemplates'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtNum = (n: number | null | undefined, decimals = 1) =>
  n == null || isNaN(n) ? '—' : n.toFixed(decimals)
const fmtX = (n: number | null | undefined) =>
  n == null || isNaN(n) ? '—' : `${n.toFixed(2)}x`
const fmtPct = (n: number | null | undefined) =>
  n == null || isNaN(n) ? '—' : `${(n * 100).toFixed(1)}%`
const fmtMoney = (n: number | null | undefined, currency = 'EUR') =>
  n == null || isNaN(n) ? '—' : `${currency === 'USD' ? '$' : currency === 'EUR' ? '€' : ''}${n.toFixed(0)}M`

const formatDate = (ms: number) => {
  const d = new Date(ms)
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

const timeSince = (ms: number) => {
  const diff = Date.now() - ms
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return formatDate(ms)
}

// ─── Section configuration ───────────────────────────────────────────────────

interface SectionConfig {
  key: keyof CreditMemoSections
  title: string
  description: string
  icon: React.ElementType
  placeholder: string
  rows?: number
}

const SECTIONS: SectionConfig[] = [
  {
    key: 'executiveSummary',
    title: '1. Executive Summary',
    description: 'High-level overview of the transaction and recommendation',
    icon: FileText,
    rows: 6,
    placeholder: `Project [Name] is a [transaction type] for [Company] in the [Industry] sector. The Sponsor [Sponsor] is acquiring the business at [X.Xx EBITDA] for an Enterprise Value of [€XXM].

We recommend [APPROVE / DECLINE] participation in the Senior Secured TLB at [E+XXX bps] for a commitment of [€XXM]. Key drivers: [resilient business model / strong FCF generation / experienced sponsor / acceptable leverage].`,
  },
  {
    key: 'investmentThesis',
    title: '2. Investment Thesis',
    description: '3-5 bullets justifying the credit case',
    icon: Award,
    rows: 8,
    placeholder: `• Defensive business model: [recurring revenue %, contracted backlog, customer stickiness]
• Strong cash conversion: [EBITDA → FCF conversion ratio, working capital dynamics]
• Experienced sponsor: [track record in sector, prior LBO performance]
• Conservative capital structure: [leverage at close, equity contribution %, headroom on covenants]
• Clear deleveraging path: [FCF generation supports XXM annual amortization, target leverage Y in 24 months]`,
  },
  {
    key: 'businessDescription',
    title: '3. Business Description',
    description: 'Company, products, customers, geographic footprint',
    icon: Briefcase,
    rows: 8,
    placeholder: `[Company] is a [leader / Top-N player] in [niche/segment] with [revenue €XXM, X countries, X employees].

Business Model:
• Revenue mix: [% recurring / transactional / project-based]
• Customer concentration: top 10 = X% of revenue
• Geographic split: [Europe XX%, NA XX%, APAC XX%]
• Key products/services: [list]
• Competitive position: [#1 in segment X, ~XX% market share]`,
  },
  {
    key: 'industryAnalysis',
    title: '4. Industry & Market',
    description: 'Sector dynamics, cyclicality, competitive landscape',
    icon: BarChart2,
    rows: 6,
    placeholder: `Sector: [Industry] — global market size €XXBn, growing at X% CAGR.

Market Dynamics:
• Demand drivers: [structural growth factors]
• Cyclicality: [low / moderate / high] — historically [resilient / sensitive] to recessions
• Competitive intensity: [fragmented / consolidating / oligopoly]
• Regulatory environment: [stable / evolving / favorable / adverse]
• Key competitors: [list with relative size]`,
  },
  {
    key: 'financialHighlights',
    title: '5. Financial Highlights',
    description: 'Commentary on historical financials and projections',
    icon: TrendingDown,
    rows: 7,
    placeholder: `Revenue: grown from €XXM to €XXM (XX% CAGR over last 3 years), driven by [organic growth / acquisitions / pricing].

EBITDA: €XXM, margin XX% (vs sector median XX%) — quality of EBITDA: add-backs represent X% of reported EBITDA, mostly [restructuring / synergies / SBC].

Cash conversion: FCF/EBITDA = XX% (peer range: XX-XX%). Working capital: [stable / improving / consuming cash]. CAPEX intensity: X% of revenue (maintenance + growth).

Profitability: trend [improving / stable / declining], driven by [pricing power / cost discipline / mix].`,
  },
  {
    key: 'capitalStructure',
    title: '6. Capital Structure & Sources/Uses',
    description: 'Pre/post deal cap structure, pricing, maturities',
    icon: Layers,
    rows: 8,
    placeholder: `Sources & Uses:
Sources:
• Senior Secured TLB: €XXM (X.Xx EBITDA), pricing E+XXX bps, 7yr bullet
• Senior Secured RCF: €XXM (undrawn at close)
• Sponsor Equity: €XXM (XX% of Total Capitalization)
Total Sources: €XXM

Uses:
• Equity Purchase Price: €XXM
• Refinancing existing debt: €XXM
• Transaction fees & expenses: €XXM

Pro-Forma Leverage: Total Net Debt / EBITDA = X.Xx
Pro-Forma Senior Leverage: X.Xx`,
  },
  {
    key: 'creditMetricsCommentary',
    title: '7. Credit Metrics Commentary',
    description: 'Interpretation of ratios, trend, vs sector',
    icon: BarChart2,
    rows: 6,
    placeholder: `Leverage of X.Xx is [in line with / above / below] sector median (X.Xx for similar single-B credits).

ICR of X.Xx provides [adequate / tight] coverage; sensitivity: a 200bp rate increase would compress ICR to X.Xx (still > minimum covenant of X.Xx).

DSCR of X.Xx implies [comfortable / serré] capacity to service amortization plus interest.

FCF generation of €XXM/year supports [X turns of deleveraging in 24 months / debt service with thin headroom].

Cash conversion of XX% reflects [capital-light model / capex-heavy industry]. Working capital is [seasonal / structural negative / structural positive].`,
  },
  {
    key: 'covenantsCommentary',
    title: '8. Covenants & Documentation',
    description: 'Financial covenants, headroom, key documentation flags',
    icon: Shield,
    rows: 7,
    placeholder: `Financial Covenants (Maintenance):
• Net Leverage ≤ X.Xx (vs current X.Xx → headroom XX%)
• Interest Coverage ≥ X.Xx (vs current X.Xx → headroom XX%)
• Springing on RCF utilization > 40%

Documentation Flags:
• [Cov-lite / Cov-loose / Maintenance]
• MFN protection: [yes / no / sunset]
• Permitted baskets: [tight / standard / loose]
• J.Crew protections: [yes / no]
• Equity cure: max X cures, capped at XX% EBITDA
• Asset sale sweep: XX% of net proceeds
• Excess cash flow sweep: XX% if leverage > X.Xx`,
  },
  {
    key: 'stressTestCommentary',
    title: '9. Stress Test & Downside Analysis',
    description: 'Resilience to adverse scenarios',
    icon: AlertCircle,
    rows: 6,
    placeholder: `Base Case: Net Leverage remains < X.Xx, ICR > X.Xx throughout the 5-year hold period.

Mild Recession (-15% EBITDA): leverage rises to X.Xx, ICR drops to X.Xx — still within covenants but limited headroom.

Severe Recession (-25% EBITDA + 100bp rate increase): leverage X.Xx, ICR X.Xx — covenants breached unless [equity cure / amendment].

Recovery Analysis (severe stress):
• Senior Secured Recovery: XX-XX% (collateral coverage X.Xx)
• Estimated LGD: XX%
• Implied recovery rate above [sector average / our threshold]`,
  },
  {
    key: 'risksAndMitigants',
    title: '10. Risk Factors & Mitigants',
    description: 'Key risks with corresponding mitigants',
    icon: AlertCircle,
    rows: 10,
    placeholder: `RISK 1 — [Customer concentration]: Top 5 customers = XX% of revenue
  → MITIGANT: Long-term contracts (avg X years remaining), diversification initiative underway

RISK 2 — [Cyclical exposure]: Sector sensitive to industrial activity
  → MITIGANT: Variable cost structure (XX% of total), demonstrated resilience in 2020 (-X% EBITDA only)

RISK 3 — [Refinancing risk]: Bullet maturity in 7 years
  → MITIGANT: FCF allows for substantial deleveraging pre-maturity, strong capital markets access

RISK 4 — [Regulatory]: Pending [legislation / litigation]
  → MITIGANT: [Insurance coverage / provisions / management plan]

RISK 5 — [ESG]: [Climate transition / governance]
  → MITIGANT: [Initiatives / disclosures / improvement trajectory]`,
  },
  {
    key: 'sponsorAndManagement',
    title: '11. Sponsor & Management',
    description: 'Track record, alignment, equity contribution',
    icon: Users,
    rows: 6,
    placeholder: `Sponsor: [Name] — [AUM €XBn, fund vintage, sector focus]
• Track record: [N prior LBOs in sector, average IRR XX%, no defaults / X defaults]
• Equity contribution: €XXM (XX% of total capitalization) — [in line with / above market]
• Hold period target: X years
• Alignment: management rollover XX%

Management Team:
• CEO: [Name] — XX years in industry, prior roles at [...]
• CFO: [Name] — XX years, prior IPO/M&A experience
• Equity package: management has XX% MIP, vesting over X years on exit milestones
• Retention: contracts in place, change-of-control clauses standard`,
  },
  {
    key: 'recommendationRationale',
    title: '12. Recommendation Rationale',
    description: 'Final analyst view supporting the recommendation',
    icon: CheckCircle2,
    rows: 6,
    placeholder: `We recommend [APPROVE / APPROVE WITH CONDITIONS / DECLINE] participation in the Senior Secured TLB.

Key supporting factors:
• [Resilient business model with X% recurring revenue]
• [Strong FCF generation supporting deleveraging]
• [Conservative capital structure with XX% equity]
• [Experienced sponsor with proven sector expertise]
• [Acceptable headroom on covenants]

Concerns / Conditions:
• [Customer concentration to monitor — quarterly reporting on top 10]
• [Sector cyclicality — quarterly EBITDA and leverage covenant compliance]
• [Specific reps & warranties on [items]]`,
  },
  {
    key: 'proposedPricing',
    title: '13. Proposed Pricing',
    description: 'Spread, OID, fees',
    icon: DollarSign,
    rows: 5,
    placeholder: `Senior Secured TLB Pricing:
• Spread: E+[XXX] bps
• Floor: [0.00% / 0.50%]
• OID: 99.[XX] (= [X.X] bps p.a. yield uplift)
• Upfront fee: [XX] bps
• Maturity: 7 years bullet
• All-in yield: [X.XX]% at issue

Fees:
• Commitment fee on RCF: [XX] bps p.a. on undrawn
• Agency fee: €[XX]K p.a.

Comparable transactions: [benchmark to recent deals same rating / sector]`,
  },
  {
    key: 'conditionsPrecedent',
    title: '14. Conditions Precedent',
    description: 'Conditions to be met before funding',
    icon: ListChecks,
    rows: 6,
    placeholder: `Conditions Precedent to Funding:
• Execution of Credit Agreement, Intercreditor Agreement, Security Documents
• Receipt of legal opinions (English, [local], tax)
• Lender DD complete (legal, financial, commercial, ESG)
• Equity contribution confirmed in escrow
• No Material Adverse Change since [date]
• Solvency certificate from CFO
• KYC/AML clearance for sponsor and key principals
• Regulatory approvals: [antitrust / sector-specific clearances]
• Insurance certificates in place
• Audit comfort letter from [Big 4]
• [Specific conditions: e.g. completion of synergy plan, key contract renewals]`,
  },
]

// ─── Computed snapshot from deal ─────────────────────────────────────────────

function buildAutoSummary(deal: PrivateDealItem): {
  title: string
  rows: { label: string; value: string }[]
} {
  const f = deal.formSnapshot as any
  const r = deal.resultSnapshot
  const cur = deal.currency

  return {
    title: `${deal.companyName} — ${deal.industry} — FY${deal.fiscalYear}`,
    rows: [
      { label: 'Revenue', value: fmtMoney(f.revenue, cur) },
      { label: 'EBITDA', value: fmtMoney(f.ebitda, cur) },
      { label: 'EBITDA Margin', value: r.ratios.ebitda_margin != null ? fmtPct(r.ratios.ebitda_margin) : '—' },
      { label: 'FCF', value: fmtMoney(r.ratios.fcf, cur) },
      { label: 'Cash Conversion', value: r.ratios.cash_conversion != null ? fmtPct(r.ratios.cash_conversion) : '—' },
      { label: 'Total Debt', value: fmtMoney(f.total_debt, cur) },
      { label: 'Net Debt / EBITDA', value: fmtX(r.ratios.nd_ebitda) },
      { label: 'Interest Coverage (ICR)', value: fmtX(r.ratios.icr) },
      { label: 'DSCR', value: fmtX(r.ratios.dscr) },
      { label: 'Verdict', value: r.assessment.verdict },
      { label: 'S&P Implied', value: r.assessment.implied_rating.sp },
      { label: 'Moody\'s Implied', value: r.assessment.implied_rating.moodys },
      { label: 'Score', value: `${r.assessment.total_score} / ${r.assessment.max_score}` },
      { label: 'Covenants', value: r.covenantsStatus || 'N/A' },
    ],
  }
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_META: Record<MemoStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'text-slate-300 border-gray-700 bg-gray-900/30', icon: Edit3 },
  in_review: { label: 'In Review', color: 'text-amber-300 border-amber-700/50 bg-amber-950/30', icon: Clock },
  final: { label: 'Final', color: 'text-emerald-300 border-emerald-700/50 bg-emerald-950/30', icon: CheckCircle2 },
}

const RECO_META: Record<MemoRecommendation, { label: string; color: string; icon: React.ElementType }> = {
  undecided: { label: 'Undecided', color: 'text-gray-400 border-gray-700 bg-gray-900/30', icon: AlertCircle },
  approve: { label: 'Approve', color: 'text-emerald-300 border-emerald-700/50 bg-emerald-950/30', icon: CheckCircle2 },
  approve_with_conditions: { label: 'Approve w/ Conditions', color: 'text-amber-300 border-amber-700/50 bg-amber-950/30', icon: AlertCircle },
  decline: { label: 'Decline', color: 'text-rose-300 border-rose-700/50 bg-rose-950/30', icon: XCircle },
}

// ─── Section editor component ────────────────────────────────────────────────

function SectionBlock({
  section, value, onChange,
}: {
  section: SectionConfig
  value: string
  onChange: (v: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const charCount = value.length

  return (
    <section className="border border-border bg-card rounded-md overflow-hidden mb-3 print:break-inside-avoid print:mb-4 print:border-gray-300">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface transition print:cursor-default"
      >
        <div className="flex items-center gap-2.5 text-left">
          <section.icon size={14} className="text-amber-400 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100">{section.title}</h3>
            <p className="text-[10px] text-muted">{section.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono ${charCount > 50 ? 'text-emerald-400/80' : 'text-muted/60'}`}>
            {charCount} chars
          </span>
          <span className="print:hidden">
            {collapsed ? <ChevronRight size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
          </span>
        </div>
      </button>
      {!collapsed && (
        <div className="px-4 pb-4 print:px-0 print:pb-2">
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={section.rows || 5}
            placeholder={section.placeholder}
            className="w-full bg-background/50 border border-border/60 rounded-md px-3 py-2 text-xs text-slate-200 placeholder:text-muted/40 focus:outline-none focus:border-amber-700 font-mono leading-relaxed resize-y print:border-0 print:bg-transparent print:text-black print:font-sans print:text-sm print:p-0 print:resize-none"
          />
        </div>
      )}
    </section>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function MemoPage() {
  const navigate = useNavigate()
  const { memoId: routeMemoId } = useParams<{ memoId: string }>()
  const [searchParams] = useSearchParams()

  const memos = useMemoStore(s => s.memos)
  const createMemo = useMemoStore(s => s.createMemo)
  const updateMemo = useMemoStore(s => s.updateMemo)
  const updateSection = useMemoStore(s => s.updateSection)
  const setStatus = useMemoStore(s => s.setStatus)
  const setRecommendation = useMemoStore(s => s.setRecommendation)
  const duplicateAsNewVersion = useMemoStore(s => s.duplicateAsNewVersion)
  const deleteMemo = useMemoStore(s => s.deleteMemo)

  const [showTemplatePicker, setShowTemplatePicker] = useState(false)

  const getDeal = useWatchlistStore(s => s.getPrivateDealById)

  const [memoId, setMemoId] = useState<string | null>(routeMemoId ?? null)
  const [previewMode, setPreviewMode] = useState(false)
  const printAreaRef = useRef<HTMLDivElement>(null)

  // If no memoId in route but a dealId in query → create new memo + show template picker
  useEffect(() => {
    if (memoId) return
    const dealId = searchParams.get('dealId')
    if (!dealId) return
    const deal = getDeal(dealId)
    const title = deal
      ? `${deal.companyName} — IC Memo`
      : 'Untitled Memo'
    const newId = createMemo(dealId, title, 1)
    setMemoId(newId)
    setShowTemplatePicker(true)
    navigate(`/memo/${newId}`, { replace: true })
  }, [memoId, searchParams, getDeal, createMemo, navigate])

  const applyTemplate = (templateId: MemoTemplateId) => {
    if (!memoId) return
    const tpl = MEMO_TEMPLATES.find(t => t.id === templateId)
    if (!tpl) return
    const merged: CreditMemoSections = { ...EMPTY_SECTIONS, ...tpl.sections }
    updateMemo(memoId, { sections: merged })
    setShowTemplatePicker(false)
  }

  const memo = useMemo(
    () => memoId ? memos.find(m => m.id === memoId) : undefined,
    [memos, memoId]
  )
  const deal = useMemo(
    () => memo ? getDeal(memo.dealId) : undefined,
    [memo, getDeal]
  )

  const autoSummary = useMemo(
    () => deal ? buildAutoSummary(deal) : null,
    [deal]
  )

  const completionPct = useMemo(() => {
    if (!memo) return 0
    const total = SECTIONS.length
    const filled = SECTIONS.filter(s => (memo.sections[s.key] || '').trim().length >= 30).length
    return Math.round((filled / total) * 100)
  }, [memo])

  if (!memo) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-6 py-20">
        <FileText size={32} className="text-muted mb-3" />
        <h1 className="text-lg font-semibold text-slate-100 mb-2">Memo Not Found</h1>
        <p className="text-xs text-muted mb-4 max-w-md">
          The memo you are looking for does not exist. Create one from a saved deal in your Watchlist.
        </p>
        <button
          onClick={() => navigate('/watchlist')}
          className="text-xs text-violet-300 border border-violet-700/50 hover:bg-violet-950/30 px-3 py-1.5 rounded transition"
        >
          Open Watchlist
        </button>
      </div>
    )
  }

  const statusMeta = STATUS_META[memo.status]
  const recoMeta = RECO_META[memo.recommendation]

  return (
    <div>
      {/* Print stylesheet */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-page { background: white !important; color: black !important; padding: 1.5cm; }
          .print-page * { color: black !important; }
          .print-page h1, .print-page h2, .print-page h3 { page-break-after: avoid; }
          .print-page section { page-break-inside: avoid; }
          .print-page textarea { white-space: pre-wrap; word-wrap: break-word; }
        }
      `}</style>

      {/* Page toolbar (hidden when printing) — replaces global header for memo editing */}
      <div className="no-print flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileText size={14} className="text-amber-400 shrink-0" />
          <input
            type="text"
            value={memo.title}
            onChange={e => updateMemo(memo.id, { title: e.target.value })}
            className="bg-transparent border-none text-sm font-semibold text-slate-100 focus:outline-none focus:bg-surface focus:ring-1 focus:ring-amber-600 px-2 py-1 rounded min-w-0 flex-1"
          />
          <span className="text-[10px] font-mono text-muted shrink-0">
            v{memo.version}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Completion + saved indicator (status group) */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-card border border-border rounded text-[10px] text-muted">
            <div className="w-12 h-1 bg-border rounded overflow-hidden hidden sm:block">
              <div
                className="h-full bg-amber-500 transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span className="font-mono text-slate-300">{completionPct}%</span>
            <span className="hidden md:inline text-muted/60">·</span>
            <span className="font-mono hidden md:inline">{timeSince(memo.updatedAt)}</span>
          </div>

          {/* Status */}
          <select
            value={memo.status}
            onChange={e => setStatus(memo.id, e.target.value as MemoStatus)}
            className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded border font-semibold cursor-pointer ${statusMeta.color}`}
          >
            <option value="draft">Draft</option>
            <option value="in_review">In Review</option>
            <option value="final">Final</option>
          </select>

          {/* Recommendation */}
          <select
            value={memo.recommendation}
            onChange={e => setRecommendation(memo.id, e.target.value as MemoRecommendation)}
            className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded border font-semibold cursor-pointer ${recoMeta.color}`}
          >
            <option value="undecided">Undecided</option>
            <option value="approve">Approve</option>
            <option value="approve_with_conditions">Approve w/ Conditions</option>
            <option value="decline">Decline</option>
          </select>

          {/* Actions group */}
          <div className="flex items-center gap-0 bg-card border border-border rounded overflow-hidden">
            <button
              onClick={() => setPreviewMode(p => !p)}
              className="text-[10px] font-mono text-muted hover:text-slate-100 hover:bg-surface px-2 py-1 transition flex items-center gap-1 border-r border-border"
              title={previewMode ? 'Edit mode' : 'Preview mode'}
            >
              {previewMode ? <EyeOff size={11} /> : <Eye size={11} />}
              {previewMode ? 'Edit' : 'Preview'}
            </button>

            <button
              onClick={() => setShowTemplatePicker(true)}
              className="text-[10px] font-mono text-muted hover:text-emerald-300 hover:bg-surface px-2 py-1 transition flex items-center gap-1 border-r border-border"
              title="Apply a template"
            >
              <Layers size={11} /> Template
            </button>

            <button
              onClick={() => window.print()}
              className="text-[10px] font-mono text-muted hover:text-amber-300 hover:bg-surface px-2 py-1 transition flex items-center gap-1 border-r border-border"
              title="Export PDF (browser print)"
            >
              <Printer size={11} /> PDF
            </button>

            <button
              onClick={() => {
                const newId = duplicateAsNewVersion(memo.id)
                if (newId) {
                  setMemoId(newId)
                  navigate(`/memo/${newId}`, { replace: true })
                }
              }}
              className="text-[10px] font-mono text-muted hover:text-violet-300 hover:bg-surface px-2 py-1 transition flex items-center gap-1 border-r border-border"
              title="Save as new version"
            >
              <Copy size={11} /> v{memo.version + 1}
            </button>

            <button
              onClick={() => {
                if (confirm('Delete this memo permanently?')) {
                  deleteMemo(memo.id)
                  navigate('/watchlist')
                }
              }}
              className="text-[10px] text-muted hover:text-rose-400 hover:bg-surface px-2 py-1.5 transition"
              title="Delete memo"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Print content area */}
      <div ref={printAreaRef} className="print-page max-w-4xl mx-auto py-4">
        {/* Cover page (printed only) */}
        <div className="hidden print:block mb-8 pb-6 border-b border-gray-300">
          <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">Investment Committee Memo</div>
          <h1 className="text-3xl font-light text-black mb-2">{memo.title}</h1>
          <div className="text-sm text-gray-600 mb-4">
            {deal && `${deal.companyName} · ${deal.industry} · FY${deal.fiscalYear}`}
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs mt-6">
            <div>
              <div className="text-gray-500 uppercase tracking-wider mb-1">Recommendation</div>
              <div className="text-base font-semibold">{RECO_META[memo.recommendation].label}</div>
            </div>
            <div>
              <div className="text-gray-500 uppercase tracking-wider mb-1">Status</div>
              <div className="text-base font-semibold">{STATUS_META[memo.status].label} · v{memo.version}</div>
            </div>
            <div>
              <div className="text-gray-500 uppercase tracking-wider mb-1">Created</div>
              <div className="text-sm">{formatDate(memo.createdAt)}</div>
            </div>
            <div>
              <div className="text-gray-500 uppercase tracking-wider mb-1">Last Updated</div>
              <div className="text-sm">{formatDate(memo.updatedAt)}</div>
            </div>
          </div>
        </div>

        {/* Auto summary panel */}
        {autoSummary && (
          <div className="mb-6 bg-amber-950/15 border border-amber-800/40 rounded-md p-4 print:border-gray-300 print:bg-gray-50 print:break-inside-avoid">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-800/30 print:border-gray-300">
              <Briefcase size={13} className="text-amber-400 print:text-black" />
              <h2 className="text-[11px] font-semibold text-amber-300 uppercase tracking-widest print:text-black">
                Deal Snapshot
              </h2>
              <span className="text-[10px] text-muted font-normal normal-case tracking-normal print:text-gray-500">— {autoSummary.title}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2.5 text-[11px]">
              {autoSummary.rows.map(row => (
                <div key={row.label}>
                  <div className="text-muted text-[9px] uppercase tracking-wider print:text-gray-500 mb-0.5">{row.label}</div>
                  <div className="font-mono text-slate-100 print:text-black">{row.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sections */}
        {previewMode ? (
          <div className="space-y-5">
            {SECTIONS.map(section => {
              const content = memo.sections[section.key]
              if (!content?.trim()) return null
              return (
                <div key={section.key} className="print:break-inside-avoid">
                  <div className="flex items-center gap-2 mb-2">
                    <section.icon size={13} className="text-amber-400 print:text-black" />
                    <h3 className="text-sm font-semibold text-slate-100 print:text-black">{section.title}</h3>
                  </div>
                  <div className="text-xs text-slate-300 print:text-black whitespace-pre-wrap leading-relaxed pl-5 border-l-2 border-border/60 ml-1">
                    {content}
                  </div>
                </div>
              )
            })}
            {!SECTIONS.some(s => memo.sections[s.key]?.trim()) && (
              <div className="text-center py-12 text-muted text-xs">
                No content yet. Switch to Edit mode to start drafting.
              </div>
            )}
          </div>
        ) : (
          <div>
            {SECTIONS.map(section => (
              <SectionBlock
                key={section.key}
                section={section}
                value={memo.sections[section.key]}
                onChange={v => updateSection(memo.id, section.key, v)}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-border text-[10px] text-muted text-center print:text-gray-500">
          Generated by The Great Analysis · Credit Memo · {memo.id} · {timeSince(memo.updatedAt)}
        </div>
      </div>

      {/* Template picker modal */}
      {showTemplatePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 no-print">
          <div className="bg-card border border-border-strong rounded-md w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-soft">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-amber-400" />
                <h2 className="text-sm font-semibold text-slate-100">Choose a Template</h2>
              </div>
              <button
                onClick={() => setShowTemplatePicker(false)}
                className="text-muted hover:text-slate-200"
              >
                <XCircle size={16} />
              </button>
            </div>

            <div className="px-5 py-4 overflow-y-auto">
              <p className="text-[11px] text-muted mb-4">
                Templates pre-fill qualitative sections with starter content tailored to the deal type.
                You can switch templates at any time (existing content will be replaced).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MEMO_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => applyTemplate(tpl.id)}
                    className="text-left p-3 border border-border/60 hover:border-amber-700/50 hover:bg-amber-950/20 rounded-lg transition group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={13} className="text-amber-400" />
                      <h3 className="text-xs font-semibold text-slate-100 group-hover:text-amber-300">
                        {tpl.label}
                      </h3>
                    </div>
                    <p className="text-[10px] text-muted leading-relaxed">{tpl.description}</p>
                    {Object.keys(tpl.sections).length > 0 && (
                      <p className="text-[9px] text-emerald-400/70 mt-1.5 font-mono">
                        {Object.keys(tpl.sections).length} sections pre-filled
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
