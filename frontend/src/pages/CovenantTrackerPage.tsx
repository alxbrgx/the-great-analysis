import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Shield, AlertTriangle, CheckCircle2, XCircle,
  TrendingDown, RotateCcw, Save, FileText, Activity,
  Sliders, Info, Briefcase,
} from 'lucide-react'
import { useWatchlistStore } from '../store/useWatchlistStore'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtX = (n: number | null | undefined) =>
  n == null || isNaN(n) ? '—' : `${n.toFixed(2)}x`
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`
const fmtMoney = (n: number, currency = 'EUR') =>
  `${currency === 'USD' ? '$' : currency === 'EUR' ? '€' : ''}${n.toFixed(0)}M`

// ─── Slider component ────────────────────────────────────────────────────────

function StressSlider({
  label, value, onChange, min, max, step, suffix, icon: Icon, color,
  hint,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  suffix: string
  icon: React.ElementType
  color: string
  hint?: string
}) {
  return (
    <div className="bg-card border border-border rounded-md p-3">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Icon size={12} className={color} />
          <span className="text-[11px] font-medium text-slate-200">{label}</span>
        </div>
        <span className={`text-sm font-mono font-bold ${color}`}>
          {value > 0 ? '+' : ''}{value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-amber-500"
      />
      <div className="flex items-center justify-between text-[9px] text-muted mt-1.5 font-mono">
        <span>{min}{suffix}</span>
        <span className="text-muted/60">0{suffix}</span>
        <span>+{max}{suffix}</span>
      </div>
      {hint && <p className="text-[10px] text-muted mt-2 leading-snug">{hint}</p>}
    </div>
  )
}

// ─── Covenant gauge ───────────────────────────────────────────────────────────

function CovenantGauge({
  name, currentValue, threshold, type, headroomPct, status,
}: {
  name: string
  currentValue: number
  threshold: number
  type: 'max' | 'min'
  headroomPct: number
  status: 'OK' | 'WARNING' | 'BREACH'
}) {
  const containerClass = {
    OK:      'border-emerald-700/40 bg-emerald-950/20',
    WARNING: 'border-amber-700/40 bg-amber-950/20',
    BREACH:  'border-rose-700/40 bg-rose-950/20',
  }[status]
  const statusIconClass = {
    OK: 'text-emerald-400',
    WARNING: 'text-amber-400',
    BREACH: 'text-rose-400',
  }[status]
  const StatusIcon = status === 'OK' ? CheckCircle2 : status === 'WARNING' ? AlertTriangle : XCircle
  const barColor = {
    OK: 'bg-emerald-500',
    WARNING: 'bg-amber-500',
    BREACH: 'bg-rose-500',
  }[status]

  // Bar fill: 0% = breached, 100% = comfortable headroom
  const fillPct = Math.max(0, Math.min(100, headroomPct))

  return (
    <div className={`p-3.5 rounded-md border ${containerClass}`}>
      <div className="flex items-start justify-between mb-2.5">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{name}</h3>
          <p className="text-[10px] text-muted mt-0.5">
            Covenant: {type === 'max' ? '≤' : '≥'} {fmtX(threshold)}
          </p>
        </div>
        <div className={`flex items-center gap-1 ${statusIconClass}`}>
          <StatusIcon size={13} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{status}</span>
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-xl font-mono font-light text-slate-100">{fmtX(currentValue)}</span>
        <span className="text-[10px] text-muted">vs {fmtX(threshold)}</span>
      </div>

      {/* Headroom bar */}
      <div>
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-muted">Headroom</span>
          <span className="font-mono font-medium">
            {headroomPct.toFixed(0)}%
            {status === 'BREACH' && <span className="ml-1">({Math.abs(headroomPct).toFixed(0)}% over)</span>}
          </span>
        </div>
        <div className="w-full h-2 bg-background/50 rounded overflow-hidden">
          <div
            className={`h-full transition-all ${barColor}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Saved scenario type ─────────────────────────────────────────────────────

interface Scenario {
  id: string
  name: string
  ebitdaShockPct: number
  rateShiftBp: number
  capexShockPct: number
  bfrShockDays: number
  savedAt: number
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function CovenantTrackerPage() {
  const navigate = useNavigate()
  const { dealId } = useParams<{ dealId: string }>()
  const getDeal = useWatchlistStore(s => s.getPrivateDealById)

  const deal = dealId ? getDeal(dealId) : undefined

  // Stress parameters
  const [ebitdaShock, setEbitdaShock] = useState(0)         // % change
  const [rateShift, setRateShift] = useState(0)             // bp shift
  const [capexShock, setCapexShock] = useState(0)           // % change
  const [bfrShock, setBfrShock] = useState(0)               // additional days

  // Saved scenarios
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [scenarioName, setScenarioName] = useState('')

  // Load scenarios from localStorage
  useEffect(() => {
    if (!dealId) return
    const stored = localStorage.getItem(`tga-scenarios-${dealId}`)
    if (stored) {
      try { setScenarios(JSON.parse(stored)) } catch {}
    }
  }, [dealId])

  const saveScenarios = (next: Scenario[]) => {
    setScenarios(next)
    if (dealId) localStorage.setItem(`tga-scenarios-${dealId}`, JSON.stringify(next))
  }

  // ── Stress computations ────────────────────────────────────────────────
  const stressed = useMemo(() => {
    if (!deal) return null
    const f = deal.formSnapshot as any
    const baseEbitda = f.ebitda || 0
    const baseInterest = f.interest_expense || 0
    const baseCapex = f.capex || 0
    const baseRevenue = f.revenue || 0
    const baseCash = f.cash || 0
    const baseDebt = f.total_debt || 0

    // Apply shocks
    const stressedEbitda = baseEbitda * (1 + ebitdaShock / 100)
    const stressedCapex = baseCapex * (1 + capexShock / 100)
    // Approximate interest impact: assume 70% of debt is variable rate, +rateShift bp
    const variableDebtPortion = 0.7
    const additionalInterest = baseDebt * variableDebtPortion * (rateShift / 10000)
    const stressedInterest = baseInterest + additionalInterest
    // BFR shock: bfrShock additional days of revenue absorbed → reduces cash
    const bfrCashImpact = (baseRevenue / 365) * bfrShock
    const stressedCash = baseCash - bfrCashImpact

    const netDebt = Math.max(0, baseDebt - stressedCash)

    // Derived ratios
    const ndEbitda = stressedEbitda > 0 ? netDebt / stressedEbitda : null
    const icr = stressedInterest > 0 ? stressedEbitda / stressedInterest : null
    // FCCR approximation: (EBITDA - capex) / interest (simplified, ignores principal scheduled)
    const fccr = stressedInterest > 0 ? (stressedEbitda - stressedCapex) / stressedInterest : null
    // FCF = EBITDA - capex - interest - tax
    const taxRate = f.tax_rate || 0.25
    const stressedTax = Math.max(0, (stressedEbitda - stressedInterest)) * taxRate
    const stressedFcf = stressedEbitda - stressedCapex - stressedInterest - stressedTax

    return {
      ebitda: stressedEbitda, ebitdaDelta: stressedEbitda - baseEbitda,
      interest: stressedInterest, interestDelta: stressedInterest - baseInterest,
      capex: stressedCapex,
      cash: stressedCash,
      netDebt,
      ndEbitda,
      icr,
      fccr,
      fcf: stressedFcf,
    }
  }, [deal, ebitdaShock, rateShift, capexShock, bfrShock])

  // ── Covenants evaluation ───────────────────────────────────────────────
  const covenants = useMemo(() => {
    if (!deal || !stressed) return []
    const f = deal.formSnapshot as any
    const items: Array<{
      name: string; currentValue: number; threshold: number;
      type: 'max' | 'min'; headroomPct: number; status: 'OK' | 'WARNING' | 'BREACH'
    }> = []

    // Net Leverage covenant
    if (f.covenant_net_leverage_max && f.covenant_net_leverage_max > 0 && stressed.ndEbitda != null) {
      const t = f.covenant_net_leverage_max
      const v = stressed.ndEbitda
      const headroom = ((t - v) / t) * 100  // % under threshold
      const status: 'OK' | 'WARNING' | 'BREACH' =
        v > t ? 'BREACH' : headroom < 15 ? 'WARNING' : 'OK'
      items.push({
        name: 'Net Leverage', currentValue: v, threshold: t, type: 'max', headroomPct: headroom, status,
      })
    }

    // ICR covenant
    if (f.covenant_interest_coverage_min && f.covenant_interest_coverage_min > 0 && stressed.icr != null) {
      const t = f.covenant_interest_coverage_min
      const v = stressed.icr
      const headroom = ((v - t) / t) * 100  // % over threshold
      const status: 'OK' | 'WARNING' | 'BREACH' =
        v < t ? 'BREACH' : headroom < 25 ? 'WARNING' : 'OK'
      items.push({
        name: 'Interest Coverage Ratio', currentValue: v, threshold: t, type: 'min', headroomPct: headroom, status,
      })
    }

    // FCCR-like (if capex covenant set, derive)
    if (f.covenant_capex_max && f.covenant_capex_max > 0) {
      const t = f.covenant_capex_max
      const v = stressed.capex
      const headroom = ((t - v) / t) * 100
      const status: 'OK' | 'WARNING' | 'BREACH' =
        v > t ? 'BREACH' : headroom < 15 ? 'WARNING' : 'OK'
      items.push({
        name: 'Max Capex (€M)', currentValue: v, threshold: t, type: 'max', headroomPct: headroom, status,
      })
    }

    return items
  }, [deal, stressed])

  // ── Find breakpoints (when does each covenant break?) ──────────────────
  const breakpoints = useMemo(() => {
    if (!deal) return null
    const f = deal.formSnapshot as any
    const baseEbitda = f.ebitda || 0
    const baseDebt = f.total_debt || 0
    const baseCash = f.cash || 0
    const baseInterest = f.interest_expense || 0
    const netDebtBase = Math.max(0, baseDebt - baseCash)

    const result: { covenant: string; ebitdaDropPctToBreak: number | null }[] = []

    // Net Leverage breakpoint: at what EBITDA do we hit covenant max?
    if (f.covenant_net_leverage_max && f.covenant_net_leverage_max > 0 && baseEbitda > 0) {
      const tol = f.covenant_net_leverage_max
      const breakEbitda = netDebtBase / tol
      const dropPct = baseEbitda > 0 ? ((breakEbitda - baseEbitda) / baseEbitda) * 100 : null
      result.push({ covenant: 'Net Leverage', ebitdaDropPctToBreak: dropPct })
    }

    // ICR breakpoint
    if (f.covenant_interest_coverage_min && f.covenant_interest_coverage_min > 0 && baseInterest > 0) {
      const tol = f.covenant_interest_coverage_min
      const breakEbitda = tol * baseInterest
      const dropPct = baseEbitda > 0 ? ((breakEbitda - baseEbitda) / baseEbitda) * 100 : null
      result.push({ covenant: 'ICR', ebitdaDropPctToBreak: dropPct })
    }

    return result
  }, [deal])

  const handleReset = () => {
    setEbitdaShock(0); setRateShift(0); setCapexShock(0); setBfrShock(0)
  }

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) return
    const newScenario: Scenario = {
      id: `s-${Date.now().toString(36)}`,
      name: scenarioName.trim(),
      ebitdaShockPct: ebitdaShock, rateShiftBp: rateShift,
      capexShockPct: capexShock, bfrShockDays: bfrShock,
      savedAt: Date.now(),
    }
    saveScenarios([newScenario, ...scenarios])
    setScenarioName('')
  }

  const handleLoadScenario = (s: Scenario) => {
    setEbitdaShock(s.ebitdaShockPct); setRateShift(s.rateShiftBp)
    setCapexShock(s.capexShockPct); setBfrShock(s.bfrShockDays)
  }

  const handleDeleteScenario = (id: string) => {
    saveScenarios(scenarios.filter(s => s.id !== id))
  }

  // Pre-built scenarios
  const presetScenarios = [
    { name: 'Mild recession',     ebitda: -15, rate:  100, capex:   0, bfr: 10 },
    { name: 'Severe recession',   ebitda: -30, rate:  200, capex: -10, bfr: 20 },
    { name: 'Rate shock',         ebitda:   0, rate:  300, capex:   0, bfr:  0 },
    { name: 'Stagflation',        ebitda: -10, rate:  250, capex:  10, bfr: 15 },
    { name: 'Best case',          ebitda: +10, rate: -100, capex:   0, bfr: -5 },
  ]

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-6 py-20">
        <Shield size={32} className="text-muted mb-3" />
        <h1 className="text-lg font-semibold text-slate-100 mb-2">Deal not found</h1>
        <p className="text-xs text-muted mb-4 max-w-md">
          Select a saved deal from your watchlist to run covenant stress tests.
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

  const f = deal.formSnapshot as any
  const cur = deal.currency
  const overallStatus =
    covenants.some(c => c.status === 'BREACH') ? 'BREACH' :
    covenants.some(c => c.status === 'WARNING') ? 'WARNING' : 'OK'

  return (
    <div>
      {/* Page toolbar */}
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Shield size={14} className="text-rose-400" />
          <h1 className="text-sm font-semibold text-slate-100 truncate">
            Covenant Stress Tracker
          </h1>
          <span className="text-[11px] text-muted">— {deal.companyName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(`/private?dealId=${deal.id}`)}
            className="text-[11px] font-mono text-muted hover:text-amber-300 border border-border hover:border-amber-700/50 px-2.5 py-1 rounded transition flex items-center gap-1"
          >
            <Briefcase size={11} /> Deal
          </button>
          <button
            onClick={() => navigate(`/memo/new?dealId=${deal.id}`)}
            className="text-[11px] font-mono text-muted hover:text-violet-300 border border-border hover:border-violet-700/50 px-2.5 py-1 rounded transition flex items-center gap-1"
          >
            <FileText size={11} /> Memo
          </button>
          <button
            onClick={handleReset}
            className="text-[11px] font-mono text-muted hover:text-rose-300 border border-border hover:border-rose-700/50 px-2.5 py-1 rounded transition flex items-center gap-1"
          >
            <RotateCcw size={11} /> Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT: Stress controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-card border border-border rounded-md p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sliders size={13} className="text-amber-400" />
              <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Stress Inputs
              </h2>
            </div>
            <div className="space-y-3">
              <StressSlider
                label="EBITDA Shock"
                value={ebitdaShock}
                onChange={setEbitdaShock}
                min={-50} max={20} step={1} suffix="%"
                icon={TrendingDown} color="text-rose-400"
                hint="Simulate revenue/margin contraction"
              />
              <StressSlider
                label="Rate Shift"
                value={rateShift}
                onChange={setRateShift}
                min={-200} max={500} step={25} suffix="bp"
                icon={Activity} color="text-amber-400"
                hint="Applied to ~70% of debt assumed variable"
              />
              <StressSlider
                label="CAPEX Shock"
                value={capexShock}
                onChange={setCapexShock}
                min={-30} max={50} step={5} suffix="%"
                icon={Activity} color="text-blue-400"
                hint="Forced reinvestment / cuts"
              />
              <StressSlider
                label="BFR Pressure"
                value={bfrShock}
                onChange={setBfrShock}
                min={-15} max={45} step={1} suffix="d"
                icon={Activity} color="text-violet-400"
                hint="Additional days of revenue tied up in WC"
              />
            </div>
          </div>

          {/* Preset scenarios */}
          <div className="bg-card border border-border rounded-md p-4">
            <h3 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">Presets</h3>
            <div className="flex flex-wrap gap-1.5">
              {presetScenarios.map(p => (
                <button
                  key={p.name}
                  onClick={() => {
                    setEbitdaShock(p.ebitda); setRateShift(p.rate)
                    setCapexShock(p.capex); setBfrShock(p.bfr)
                  }}
                  className="text-[10px] text-muted hover:text-amber-300 border border-border/60 hover:border-amber-700/50 px-2 py-1 rounded transition"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Save scenario */}
          <div className="bg-card border border-border rounded-md p-4">
            <h3 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Saved Scenarios ({scenarios.length})
            </h3>
            <div className="flex gap-1.5 mb-3">
              <input
                type="text"
                value={scenarioName}
                onChange={e => setScenarioName(e.target.value)}
                placeholder="Name this scenario..."
                className="flex-1 bg-background/50 border border-border/60 rounded px-2 py-1 text-[11px] text-slate-200 placeholder:text-muted/50 focus:outline-none focus:border-amber-700"
              />
              <button
                onClick={handleSaveScenario}
                disabled={!scenarioName.trim()}
                className="text-[10px] text-amber-300 border border-amber-700/50 hover:bg-amber-950/30 disabled:opacity-30 px-2 py-1 rounded transition flex items-center gap-1"
              >
                <Save size={10} /> Save
              </button>
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {scenarios.length === 0 ? (
                <p className="text-[10px] text-muted/60 italic">No saved scenarios yet</p>
              ) : (
                scenarios.map(s => (
                  <div key={s.id} className="flex items-center justify-between gap-2 px-2 py-1.5 bg-background/30 rounded text-[11px] group">
                    <button
                      onClick={() => handleLoadScenario(s)}
                      className="text-left flex-1 min-w-0"
                    >
                      <div className="text-slate-200 truncate">{s.name}</div>
                      <div className="text-[9px] text-muted font-mono">
                        EBITDA {s.ebitdaShockPct > 0 ? '+' : ''}{s.ebitdaShockPct}% · Rate {s.rateShiftBp > 0 ? '+' : ''}{s.rateShiftBp}bp
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteScenario(s.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted hover:text-rose-400 transition"
                    >
                      <XCircle size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Results */}
        <div className="lg:col-span-8 space-y-4">
          {/* Overall status banner */}
          <div className={`p-4 rounded-md border ${
            overallStatus === 'BREACH' ? 'border-rose-700/50 bg-rose-950/15' :
            overallStatus === 'WARNING' ? 'border-amber-700/50 bg-amber-950/15' :
            'border-emerald-700/50 bg-emerald-950/15'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {overallStatus === 'BREACH' ? <XCircle size={16} className="text-rose-400" /> :
                    overallStatus === 'WARNING' ? <AlertTriangle size={16} className="text-amber-400" /> :
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  }
                  <h2 className="text-sm font-semibold text-slate-100">
                    {overallStatus === 'BREACH' && 'Covenant Breach Triggered'}
                    {overallStatus === 'WARNING' && 'Tight Headroom — Monitor Closely'}
                    {overallStatus === 'OK' && 'All Covenants Within Comfortable Headroom'}
                  </h2>
                </div>
                <p className="text-[11px] text-muted mt-1">
                  Under current stress: EBITDA {ebitdaShock > 0 ? '+' : ''}{ebitdaShock}%, Rate {rateShift > 0 ? '+' : ''}{rateShift}bp,
                  CAPEX {capexShock > 0 ? '+' : ''}{capexShock}%, BFR {bfrShock > 0 ? '+' : ''}{bfrShock}d
                </p>
              </div>
              {covenants.length === 0 && (
                <div className="text-right text-[10px] text-muted">
                  <Info size={11} className="inline mr-1" />
                  No covenants set on this deal
                </div>
              )}
            </div>
          </div>

          {/* Covenant gauges */}
          {covenants.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {covenants.map(c => (
                <CovenantGauge key={c.name} {...c} />
              ))}
            </div>
          )}

          {/* Stressed financials */}
          {stressed && (
            <div className="bg-card border border-border rounded-md p-4">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Activity size={13} className="text-amber-400" />
                Stressed Financials
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <Stat label="EBITDA" value={fmtMoney(stressed.ebitda, cur)} delta={stressed.ebitdaDelta} cur={cur} />
                <Stat label="Interest" value={fmtMoney(stressed.interest, cur)} delta={stressed.interestDelta} cur={cur} negativeIsGood />
                <Stat label="CAPEX" value={fmtMoney(stressed.capex, cur)} />
                <Stat label="FCF" value={fmtMoney(stressed.fcf, cur)} highlight={stressed.fcf < 0 ? 'danger' : 'neutral'} />
                <Stat label="Cash" value={fmtMoney(stressed.cash, cur)} highlight={stressed.cash < 0 ? 'danger' : 'neutral'} />
                <Stat label="Net Debt" value={fmtMoney(stressed.netDebt, cur)} />
                <Stat label="ND/EBITDA" value={fmtX(stressed.ndEbitda)} highlight={stressed.ndEbitda && stressed.ndEbitda > 6 ? 'danger' : 'neutral'} />
                <Stat label="ICR" value={fmtX(stressed.icr)} highlight={stressed.icr && stressed.icr < 2 ? 'danger' : 'neutral'} />
              </div>
            </div>
          )}

          {/* Breakpoint analysis */}
          {breakpoints && breakpoints.length > 0 && (
            <div className="bg-card border border-border rounded-md p-4">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                <TrendingDown size={13} className="text-rose-400" />
                Breaking Point Analysis
              </h3>
              <p className="text-[11px] text-muted mb-3">
                EBITDA drop required to breach each covenant (other inputs at base case):
              </p>
              <div className="space-y-2">
                {breakpoints.map(b => (
                  <div key={b.covenant} className="flex items-center justify-between p-2 bg-background/30 rounded">
                    <span className="text-xs text-slate-200">{b.covenant}</span>
                    <div className="text-right">
                      {b.ebitdaDropPctToBreak == null ? (
                        <span className="text-[11px] text-muted">N/A</span>
                      ) : b.ebitdaDropPctToBreak >= 0 ? (
                        <span className="text-[11px] text-rose-400 font-mono font-medium">
                          Already breached at base case
                        </span>
                      ) : (
                        <span className={`text-[11px] font-mono font-medium ${
                          b.ebitdaDropPctToBreak > -10 ? 'text-rose-400' :
                          b.ebitdaDropPctToBreak > -25 ? 'text-amber-400' :
                          'text-emerald-400'
                        }`}>
                          EBITDA must drop {b.ebitdaDropPctToBreak.toFixed(1)}%
                          <span className="text-muted ml-1.5">
                            (to {fmtMoney(f.ebitda * (1 + b.ebitdaDropPctToBreak / 100), cur)})
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Base case reference */}
          <div className="bg-background/40 border border-border rounded-lg p-3">
            <p className="text-[10px] text-muted mb-2 uppercase tracking-wider font-semibold">Base case reference</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div><span className="text-muted">EBITDA: </span><span className="font-mono text-slate-300">{fmtMoney(f.ebitda || 0, cur)}</span></div>
              <div><span className="text-muted">ND/EBITDA: </span><span className="font-mono text-slate-300">{fmtX(deal.resultSnapshot.ratios.nd_ebitda)}</span></div>
              <div><span className="text-muted">ICR: </span><span className="font-mono text-slate-300">{fmtX(deal.resultSnapshot.ratios.icr)}</span></div>
              <div><span className="text-muted">DSCR: </span><span className="font-mono text-slate-300">{fmtX(deal.resultSnapshot.ratios.dscr)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Stat helper ─────────────────────────────────────────────────────────────

function Stat({
  label, value, delta, cur = 'EUR', highlight, negativeIsGood,
}: {
  label: string; value: string;
  delta?: number;
  cur?: string;
  highlight?: 'danger' | 'neutral'
  negativeIsGood?: boolean
}) {
  const valueColor = highlight === 'danger' ? 'text-rose-400' : 'text-slate-100'
  return (
    <div>
      <div className="text-[9px] text-muted uppercase tracking-wider">{label}</div>
      <div className={`font-mono ${valueColor}`}>{value}</div>
      {delta != null && delta !== 0 && (
        <div className={`text-[9px] font-mono ${
          (delta > 0) === negativeIsGood ? 'text-rose-400' : 'text-emerald-400'
        }`}>
          {delta > 0 ? '+' : ''}{fmtMoney(delta, cur)}
        </div>
      )}
    </div>
  )
}
