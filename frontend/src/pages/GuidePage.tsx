import { useState, useEffect, useRef } from 'react'
import { BookOpen, TrendingUp, PieChart, BarChart2, ChevronRight, Database } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface Section {
  id: string
  label: string
  icon?: React.ElementType
  color?: string
}

// ── Section registry ──────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  { id: 'scoring',       label: 'Scoring System',          icon: BookOpen,   color: 'text-gray-400' },
  { id: 'fundamental',   label: 'Fundamental Analysis',    icon: BookOpen,   color: 'text-blue-400' },
  { id: 'step1',         label: '  Step 1 — Business Overview' },
  { id: 'step2',         label: '  Step 2 — Market & Sector' },
  { id: 'step3',         label: '  Step 3 — Competitive Position' },
  { id: 'step4',         label: '  Step 4 — Management' },
  { id: 'step5',         label: '  Step 5 — Business Model' },
  { id: 'step6',         label: '  Step 6 — Income Statement' },
  { id: 'step7',         label: '  Step 7 — Cash Flows' },
  { id: 'step8',         label: '  Step 8 — Balance Sheet' },
  { id: 'step9',         label: '  Step 9 — Earnings Estimates' },
  { id: 'step10',        label: '  Step 10 — Valuation' },
  { id: 'step11',        label: '  Step 11 — Stock Reputation' },
  { id: 'step12',        label: '  Step 12 — Re-rating Levers' },
  { id: 'sector',        label: '  Sector Thresholds' },
  { id: 'portfolio',     label: 'Portfolio Analysis',      icon: PieChart,   color: 'text-violet-400' },
  { id: 'debt',          label: 'Debt Analysis',           icon: BarChart2,  color: 'text-amber-400' },
  { id: 'technical',     label: 'Technical Analysis',      icon: TrendingUp, color: 'text-emerald-400' },
  { id: 'datasources',   label: 'Data Sources',            icon: Database,   color: 'text-gray-400' },
]

// ── Helper components ─────────────────────────────────────────────────────────

function H2({ id, children, color = 'text-gray-100' }: { id: string; children: React.ReactNode; color?: string }) {
  return (
    <h2 id={id} className={`text-xl font-semibold ${color} mb-4 mt-12 first:mt-0 scroll-mt-20 flex items-center gap-2`}>
      <ChevronRight size={16} className="text-accent/60 shrink-0" />
      {children}
    </h2>
  )
}

function H3({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="text-sm font-semibold text-gray-200 mt-8 mb-3 scroll-mt-20 border-l-2 border-accent/30 pl-3">
      {children}
    </h3>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted/80 leading-relaxed mb-3">{children}</p>
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-xs bg-surface border border-border rounded-lg px-4 py-3 my-3 text-accent/90 overflow-x-auto whitespace-pre">
      {children}
    </div>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-border">
            {headers.map(h => (
              <th key={h} className="text-left px-3 py-2 font-mono text-muted/60 font-normal">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/40 hover:bg-surface/40 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-gray-300">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Callout({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-accent/20 bg-accent/5 rounded-lg px-4 py-3 my-4">
      <span className="text-xs font-mono text-accent/80 uppercase tracking-wider">{label}</span>
      <div className="mt-1 text-sm text-muted/80 leading-relaxed">{children}</div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GuidePage() {
  const [activeId, setActiveId] = useState('scoring')
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    )
    const ids = SECTIONS.map(s => s.id)
    ids.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex gap-8 min-h-[calc(100vh-3rem)]">

      {/* Sticky sidebar */}
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-20 space-y-0.5">
          <p className="text-[10px] font-mono text-muted/40 uppercase tracking-widest mb-3 px-2">Methodology Guide</p>
          {SECTIONS.map(s => {
            const isActive = activeId === s.id
            const isSubItem = s.label.startsWith('  ')
            return (
              <button
                key={s.id}
                onClick={() => {
                  document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                  isSubItem ? 'pl-4' : 'font-medium'
                } ${
                  isActive
                    ? 'text-accent bg-accent/8'
                    : 'text-muted/60 hover:text-gray-300 hover:bg-surface/60'
                }`}
              >
                {s.label.trim()}
              </button>
            )
          })}
        </div>
      </aside>

      {/* Content */}
      <div ref={contentRef} className="flex-1 max-w-3xl pb-24">

        {/* Hero */}
        <div className="mb-10">
          <div className="text-xs font-mono text-accent/70 border border-accent/20 inline-block px-3 py-1 rounded-full mb-3 tracking-wider">
            Reference Manual
          </div>
          <h1 className="text-3xl font-light text-gray-100 mb-3">Methodology Guide</h1>
          <p className="text-sm text-muted/70 leading-relaxed max-w-xl">
            Complete documentation of every model, formula, ratio, and scoring rule used across
            The Great Analysis platform. This guide explains not just what each metric is, but
            why it matters and how it affects the final assessment.
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SCORING SYSTEM */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <H2 id="scoring">Scoring System</H2>

        <P>
          Every step of the fundamental analysis produces a numeric <strong className="text-gray-200">score</strong> between
          −1 and +1. These scores are averaged across the 12 steps to produce a composite score, which
          is then mapped to a rating label.
        </P>

        <H3 id="score-formula">Score → Rating Conversion</H3>
        <Formula>
{`avg_score  = mean(step_scores)          # range: −1.0 to +1.0

rating_idx = round((avg_score + 1) × 2)  # maps [−1, +1] → [0, 4]
rating_idx = clamp(rating_idx, 0, 4)

RATINGS = ["Strong Sell", "Sell", "Hold", "Buy", "Strong Buy"]
rating  = RATINGS[rating_idx]`}
        </Formula>

        <Table
          headers={['avg_score range', 'rating_idx', 'Rating']}
          rows={[
            ['< −0.75', '0', 'Strong Sell'],
            ['−0.75 to −0.25', '1', 'Sell'],
            ['−0.25 to +0.25', '2', 'Hold'],
            ['+0.25 to +0.75', '3', 'Buy'],
            ['> +0.75', '4', 'Strong Buy'],
          ]}
        />

        <H3 id="score-individual">Individual Step Scores</H3>
        <P>
          Each step applies a rule-based scoring logic. Points are awarded or deducted depending on
          whether key metrics exceed or fall short of <strong className="text-gray-200">sector-specific thresholds</strong>.
          For example, a gross margin of 45% scores positively for an Energy company (threshold: 25%)
          but scores negatively for a SaaS company (threshold: 65%).
        </P>
        <Callout label="Why sector thresholds?">
          Generic benchmarks systematically mis-score companies outside the median sector profile.
          A P/E of 40× is reckless for a utility but reasonable for high-growth software.
          Net Debt/EBITDA of 5× is distress territory for an E&P company but routine for a regulated REIT.
          Thresholds are calibrated per GICS sector so scores reflect true relative performance.
        </Callout>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* FUNDAMENTAL */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <H2 id="fundamental" color="text-blue-400">Fundamental Analysis — 12 Steps</H2>
        <P>
          Based on the methodology "Les 12 travaux de l'analyste financier". The analysis
          progresses from qualitative understanding (business, sector, competition) through quantitative
          financial analysis (P&L, cash flows, balance sheet) to final valuation and conviction rating.
          All data is fetched live from yfinance and FMP on demand.
        </P>

        {/* Step 1 */}
        <H3 id="step1">Step 1 — Understanding the Business</H3>
        <P>
          The first step is purely descriptive: what does the company actually do? This step populates
          sector, industry, geography, headcount, market cap, and a qualitative business type label.
        </P>
        <P>
          <strong className="text-gray-200">Business type classification</strong> is determined from revenue
          growth and sector:
        </P>
        <Table
          headers={['Condition', 'Label']}
          rows={[
            ['Revenue growth > 15%', 'Growth company'],
            ['Revenue growth < 2% + low debt', 'Value / Yield company'],
            ['Revenue growth < 2% + high debt', 'Potential restructuring candidate'],
            ['Sector ∈ {Energy, Materials, Industrials, Consumer Disc.}', 'Cyclical company'],
            ['Sector ∈ {Consumer Staples, Healthcare, Utilities}', 'Defensive company'],
            ['Other', 'Balanced company'],
          ]}
        />
        <P>
          This step has a fixed score of 0 — it is purely informational and does not influence the
          final rating.
        </P>

        {/* Step 2 */}
        <H3 id="step2">Step 2 — Market & Sector Dynamics</H3>
        <P>
          Examines the macro backdrop: market size, growth rate, competitive intensity, Porter's Five
          Forces, and market sensitivity (beta).
        </P>
        <Formula>
{`score = +0.30  if revenue_growth > 5%
       = −0.20  otherwise`}
        </Formula>
        <P>
          Beta is used as a market sensitivity proxy. A beta above 1.3 indicates a cyclical/high-risk
          profile; below 0.7 suggests a defensive profile. Full Porter analysis requires sector research
          reports beyond what public APIs provide.
        </P>

        {/* Step 3 */}
        <H3 id="step3">Step 3 — Competitive Positioning</H3>
        <P>
          Assesses the company's relative strength: revenue growth vs. sector peers, operating margin,
          ROE, short interest, and BCG Matrix placement.
        </P>
        <Formula>
{`score += +0.30  if revenue_growth > sector.growth_high
score += +0.30  if op_margin    > sector.op_margin_strong
score -= −0.30  if short_ratio  > 10 days`}
        </Formula>
        <P>
          <strong className="text-gray-200">BCG Matrix position</strong> is determined by comparing
          revenue growth and operating margin against sector-calibrated thresholds:
        </P>
        <Table
          headers={['Revenue growth', 'Op. margin', 'BCG label']}
          rows={[
            ['> growth_high', '> op_margin_ok', 'Star'],
            ['< growth_moderate', '> op_margin_ok', 'Cash Cow'],
            ['> growth_high', '< op_margin_ok', 'Question Mark'],
            ['Other', 'Other', 'Dog'],
          ]}
        />

        {/* Step 4 */}
        <H3 id="step4">Step 4 — Management, Vision & Strategy</H3>
        <P>
          Governance quality is difficult to quantify from public APIs. This step uses payout ratio and
          dividend yield as proxies for management's capital allocation discipline.
        </P>
        <Formula>
{`score += +0.25  if 20% < payout_ratio < 60%   (balanced allocation)
score += +0.10  if dividend_yield > 1%`}
        </Formula>
        <P>
          A payout ratio between 20–60% indicates management returns capital while retaining enough for
          reinvestment — the hallmark of disciplined capital allocation. A ratio above 70% may signal
          over-distribution at the expense of growth.
        </P>
        <Callout label="Limitation">
          Full governance assessment (board independence, insider ownership, compensation structure,
          related-party transactions) requires reading proxy statements (DEF 14A for US companies).
          This step is intentionally conservative in its scoring range.
        </Callout>

        {/* Step 5 */}
        <H3 id="step5">Step 5 — Business Model & Profitability Levers</H3>
        <P>
          Deep-dives into margin structure and operating leverage — the "scissors effect" between
          revenue and cost growth.
        </P>
        <Formula>
{`operating_leverage = earnings_growth / revenue_growth

score += +0.40  if gross_margin > sector.gross_margin_strong
score += +0.20  if gross_margin > sector.gross_margin_ok
score += +0.20  if operating_leverage > 2×`}
        </Formula>
        <P>
          <strong className="text-gray-200">Operating leverage</strong> above 1 means earnings are growing
          faster than revenue — margins are expanding. Below 1 means costs are rising faster than
          revenue — margin compression is occurring.
        </P>
        <Table
          headers={['Operating leverage', 'Interpretation']}
          rows={[
            ['> 1.2×', 'Favorable scissors effect — margins expanding'],
            ['0.8× – 1.2×', 'Stable dynamics'],
            ['< 0.8×', 'Unfavorable — cost growth outpacing revenue'],
          ]}
        />

        {/* Step 6 */}
        <H3 id="step6">Step 6 — Income Statement Analysis</H3>
        <P>
          10-year trend analysis of revenue, EBITDA, and net income. Identifies structural growth,
          M&A effects, and exceptional items.
        </P>
        <Formula>
{`ebitda_margin = EBITDA / Revenue

score += +0.40  if op_margin > sector.op_margin_strong
score += +0.20  if op_margin > sector.op_margin_ok
score -= −0.40  if op_margin < 0`}
        </Formula>
        <P>
          The time series of revenue, EBITDA, and net income is displayed as bar charts for visual
          trend identification. The EBITDA margin is computed from annual financial statements.
        </P>

        {/* Step 7 */}
        <H3 id="step7">Step 7 — Cash Flow Analysis</H3>
        <P>
          Free Cash Flow is the clearest measure of a company's ability to self-finance. Accrual
          earnings can be manipulated; cash cannot.
        </P>
        <Formula>
{`FCF = Operating Cash Flow + Capital Expenditure
       (CapEx is negative in financial statements, so this is subtraction)

capex_intensity = |CapEx| / Revenue

score += +0.40  if FCF > 0
score += +0.15  if capex_intensity < 5%    (asset-light)
score -= −0.10  if capex_intensity > 15%   (capital-intensive)`}
        </Formula>
        <Table
          headers={['CapEx intensity', 'Profile']}
          rows={[
            ['< 5%', 'Asset-light model (software, services, asset managers)'],
            ['5% – 15%', 'Moderate capital intensity'],
            ['> 15%', 'Capital-intensive (utilities, telecom, heavy industry)'],
          ]}
        />

        {/* Step 8 */}
        <H3 id="step8">Step 8 — Balance Sheet Analysis</H3>
        <P>
          The balance sheet reveals leverage, liquidity, and return quality. Thresholds are sector-specific
          because capital structures differ dramatically between a bank, a REIT, and a software company.
        </P>
        <Formula>
{`Net Debt = Total Debt − Cash & Equivalents
Net Debt / EBITDA = Net Debt / EBITDA

score += +0.50  if ND/EBITDA < sector.nd_ebitda_safe
score += +0.20  if ND/EBITDA < sector.nd_ebitda_moderate
score -= −0.40  if ND/EBITDA > sector.nd_ebitda_elevated

score += +0.20  if current_ratio > sector.current_ratio_ok × 1.25
score -= −0.20  if current_ratio < sector.current_ratio_ok`}
        </Formula>
        <Table
          headers={['Metric', 'Formula', 'What it measures']}
          rows={[
            ['Net Debt/EBITDA', '(Debt − Cash) / EBITDA', 'Years of earnings to repay debt'],
            ['Current ratio', 'Current Assets / Current Liabilities', 'Short-term liquidity buffer'],
            ['Quick ratio', '(Cash + Receivables) / Current Liabilities', 'Liquid-only coverage'],
            ['ROE', 'Net Income / Shareholders Equity', 'Quality of equity returns'],
            ['ROA', 'Net Income / Total Assets', 'Asset utilization efficiency'],
          ]}
        />

        {/* Step 9 */}
        <H3 id="step9">Step 9 — Earnings Estimates</H3>
        <P>
          Uses analyst consensus data to assess the forward earnings picture and market expectations.
        </P>
        <Formula>
{`upside = (analyst_target − current_price) / current_price

PEG = trailing_P/E / (earnings_growth × 100)

score += +0.40  if upside > +15%
score -= −0.30  if upside < −10%
score += +0.20  if PEG < 1.5
score -= −0.20  if PEG > 3.0`}
        </Formula>
        <P>
          The <strong className="text-gray-200">PEG ratio</strong> (Price/Earnings to Growth) adjusts
          the P/E by the expected earnings growth rate. A PEG below 1.5 suggests the company is cheap
          relative to its growth trajectory.
        </P>
        <Table
          headers={['PEG', 'Assessment']}
          rows={[
            ['< 1.5', 'Undervalued relative to growth'],
            ['1.5 – 2.5', 'Fairly valued'],
            ['> 2.5', 'Expensive relative to growth'],
          ]}
        />

        {/* Step 10 */}
        <H3 id="step10">Step 10 — Valuation</H3>
        <P>
          Multi-method valuation using relative multiples. Thresholds are sector-calibrated — cheap
          Technology trades at 20×P/E while cheap Energy may trade at 8×P/E.
        </P>
        <Formula>
{`score += +0.50  if P/E < sector.pe_cheap
score += +0.20  if P/E < sector.pe_fair
score -= −0.30  if P/E > sector.pe_expensive

score += +0.30  if EV/EBITDA < sector.ev_ebitda_cheap
score -= −0.20  if EV/EBITDA > sector.ev_ebitda_expensive`}
        </Formula>
        <Table
          headers={['Multiple', 'What it values', 'Best used for']}
          rows={[
            ['P/E', 'Earnings power', 'Profitable companies, sector comparison'],
            ['Forward P/E', 'Next-12-month expected earnings', 'Growth companies'],
            ['EV/EBITDA', 'Operating earnings, capital-structure-neutral', 'Cross-sector M&A comps'],
            ['P/B', 'Net asset value', 'Banks, insurers, capital-heavy industries'],
            ['P/S', 'Revenue multiple', 'Unprofitable growth companies'],
            ['EV/Revenue', 'Revenue × enterprise value', 'Pre-profit SaaS / biotech'],
          ]}
        />

        {/* Step 11 */}
        <H3 id="step11">Step 11 — Stock Reputation</H3>
        <P>
          Market perception metrics: analyst consensus, short interest, and 52-week price positioning.
        </P>
        <Formula>
{`Analyst consensus: 1.0 = Strong Buy → 5.0 = Strong Sell

score += +0.40  if analyst_rec < 2.5   (consensus Buy)
score -= −0.30  if analyst_rec > 3.5   (consensus Sell)
score -= −0.20  if short_ratio > 10 days`}
        </Formula>
        <P>
          <strong className="text-gray-200">Short ratio</strong> (days-to-cover) measures bearish
          positioning. Above 10 days signals significant short-seller conviction against the stock.
          52-week high/low positioning contextualizes current price momentum.
        </P>

        {/* Step 12 */}
        <H3 id="step12">Step 12 — Re-rating Levers & Momentum</H3>
        <P>
          Forward-looking: what could cause the market to re-rate the stock higher (or lower)?
          Catalysts and risks are identified from quantitative signals.
        </P>
        <Formula>
{`Catalysts identified if:
  revenue_growth > 10%
  earnings_growth > revenue_growth
  analyst upside > 20%
  forward_P/E < trailing_P/E × 0.9   (P/E de-rating)

score += +0.40  if ≥ 2 catalysts
score += +0.20  if 1 catalyst
score -= −0.30  if ≥ 2 risks
score -= −0.10  if 1 risk`}
        </Formula>

        {/* Sector thresholds */}
        <H3 id="sector">Sector-Specific Thresholds</H3>
        <P>
          Each GICS sector has its own scoring benchmarks. The table below shows the key thresholds
          used across steps 3, 5, 6, 8, and 10.
        </P>
        <Table
          headers={['Sector', 'Gross margin strong', 'OP margin strong', 'ND/EBITDA safe', 'P/E cheap', 'EV/EBITDA cheap']}
          rows={[
            ['Technology',              '65%', '20%', '1.5×', '20×', '12×'],
            ['Communication Services',  '55%', '18%', '2.0×', '16×', '10×'],
            ['Healthcare',              '65%', '18%', '1.5×', '18×', '12×'],
            ['Financials',              '40%', '25%', '3.0×', '8×',  '6×'],
            ['Consumer Discretionary',  '45%', '12%', '1.5×', '14×', '8×'],
            ['Consumer Staples',        '40%', '15%', '2.0×', '16×', '10×'],
            ['Energy',                  '25%', '15%', '1.0×', '8×',  '4×'],
            ['Industrials',             '35%', '15%', '1.5×', '14×', '8×'],
            ['Utilities',               '30%', '20%', '3.0×', '12×', '8×'],
            ['Materials',               '30%', '15%', '1.5×', '10×', '5×'],
            ['Real Estate',             '55%', '30%', '4.0×', '12×', '12×'],
            ['Default (unknown)',        '40%', '15%', '2.0×', '15×', '10×'],
          ]}
        />

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PORTFOLIO */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <H2 id="portfolio" color="text-violet-400">Portfolio Analysis</H2>

        <P>
          The portfolio optimizer implements two institutional-grade allocation frameworks:
          Markowitz Mean-Variance Optimization and Hierarchical Risk Parity (HRP).
        </P>

        <H3 id="markowitz">Markowitz Max Sharpe</H3>
        <P>
          Finds the portfolio weights that maximize the Sharpe ratio — the risk-adjusted return.
          Requires an estimate of expected returns and a covariance matrix of asset returns.
        </P>
        <Formula>
{`Sharpe ratio = (Portfolio return − Risk-free rate) / Portfolio volatility

Maximize: w* = argmax [ (μᵀw − Rₓ) / √(wᵀΣw) ]

Subject to:
  Σwᵢ = 1    (weights sum to 1)
  wᵢ ≥ 0     (no short selling)
  wᵢ ≤ 0.40  (max 40% per asset, concentration limit)`}
        </Formula>
        <P>
          Expected returns (μ) are estimated from historical mean returns over a 3-year window.
          The covariance matrix (Σ) is computed from daily returns and annualized (×252 trading days).
          The optimization uses <strong className="text-gray-200">PyPortfolioOpt</strong>'s Sequential
          Least Squares solver.
        </P>

        <H3 id="hrp">Hierarchical Risk Parity (HRP)</H3>
        <P>
          Developed by Marcos López de Prado. Unlike Markowitz, HRP does not require an invertible
          covariance matrix and is more robust to estimation error. It clusters assets by correlation
          structure and allocates risk inversely to cluster volatility.
        </P>
        <Formula>
{`1. Build correlation matrix from historical returns
2. Compute distance matrix: d(i,j) = √(0.5 × (1 − ρᵢⱼ))
3. Hierarchical clustering (single-linkage)
4. Quasi-diagonalize the covariance matrix (reorder by cluster)
5. Recursive bisection: allocate weight proportional to inverse variance
   within each cluster, then between clusters`}
        </Formula>
        <P>
          HRP tends to produce more diversified portfolios than Markowitz, particularly when assets
          are highly correlated or when the return estimates are unreliable (which is almost always).
        </P>

        <H3 id="efficient-frontier">Efficient Frontier</H3>
        <P>
          The efficient frontier plots all risk-return combinations achievable through different
          portfolio weights. Each point on the frontier represents the minimum-variance portfolio
          for a given level of expected return. Points below the frontier are dominated (same risk,
          lower return).
        </P>
        <Formula>
{`For target return μ_target:
  min wᵀΣw  subject to μᵀw = μ_target, Σwᵢ = 1, wᵢ ≥ 0

Scanned across 50 return levels → 50 frontier points
Plotted as (volatility, return) with Sharpe color-map`}
        </Formula>

        <H3 id="risk-metrics">Portfolio Risk Metrics</H3>
        <Table
          headers={['Metric', 'Formula', 'Interpretation']}
          rows={[
            ['Ann. return', 'mean(daily_ret) × 252', 'Expected return over 1 year'],
            ['Ann. volatility', 'std(daily_ret) × √252', 'Standard deviation of annual returns'],
            ['Sharpe ratio', '(Ann. return − 0%) / Ann. vol', 'Return per unit of risk (0% risk-free assumed)'],
            ['Max drawdown', 'max(peak − trough) / peak', 'Worst peak-to-trough loss in history'],
            ['VaR 95%', '5th percentile of daily returns × √252', 'Annual loss not exceeded in 95% of scenarios'],
          ]}
        />

        <H3 id="portfolio-suggestions">Portfolio Suggestions</H3>
        <P>
          When an anchor ticker is selected, the platform proposes complementary assets based on
          sector diversification logic: assets from different GICS sectors, a bond proxy (TLT),
          a commodity (GLD), and broad market exposure (SPY). The goal is to illustrate how the
          anchor fits into a diversified portfolio rather than to provide investment advice.
        </P>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* DEBT */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <H2 id="debt" color="text-amber-400">Debt Analysis</H2>

        <P>
          The debt module performs a credit analyst's assessment: leverage, coverage, liquidity,
          stress testing, and recovery analysis under distress scenarios.
        </P>

        <H3 id="leverage-ratios">Leverage Ratios</H3>
        <Table
          headers={['Ratio', 'Formula', 'Safe threshold (general)']}
          rows={[
            ['Net Debt / EBITDA', '(Total Debt − Cash) / EBITDA', '< 2× (sector-dependent)'],
            ['Gearing', 'Net Debt / (Net Debt + Equity)', '< 40%'],
            ['Debt / Equity', 'Total Debt / Shareholders Equity', '< 100%'],
          ]}
        />

        <H3 id="coverage-ratios">Coverage Ratios</H3>
        <Table
          headers={['Ratio', 'Formula', 'Healthy threshold']}
          rows={[
            ['Interest Coverage (ICR)', 'EBIT / Interest Expense', '> 3× (3× is often the IG floor)'],
            ['DSCR', '(EBITDA − CapEx) / (Interest + Principal)', '> 1.2×'],
            ['FCF / Net Debt', 'Free Cash Flow / Net Debt', '> 10% (debt paid in <10 years)'],
          ]}
        />

        <H3 id="stress-test">Stress Test</H3>
        <P>
          Three scenarios are modeled to assess credit resilience:
        </P>
        <Table
          headers={['Scenario', 'Revenue shock', 'Rate shock', 'Description']}
          rows={[
            ['Base', '0%', '+0 bps', 'Current conditions maintained'],
            ['Adverse', '−10%', '+100 bps', 'Mild recession + rate pressure'],
            ['Severe', '−20%', '+200 bps', 'Deep recession + credit tightening'],
          ]}
        />
        <Formula>
{`Stressed EBITDA = EBITDA × (1 + revenue_shock) × EBITDA_margin
Stressed Interest = current_interest × (1 + rate_shock / base_rate)
Stressed ICR = Stressed EBITDA / Stressed Interest`}
        </Formula>

        <H3 id="recovery">Recovery & LGD Analysis</H3>
        <P>
          Models the expected recovery for debt holders in a default scenario. Based on
          seniority-adjusted asset coverage.
        </P>
        <Formula>
{`Asset coverage ratio = Total Assets / Total Debt

Recovery rate (by seniority):
  Senior Secured:   60–80% (high asset coverage)
  Senior Unsecured: 40–60%
  Subordinated:     15–35%
  Equity:           residual (often 0 in distress)

LGD (Loss Given Default) = 1 − Recovery Rate`}
        </Formula>

        <H3 id="reference-rates">Reference Rates</H3>
        <P>
          Live interest rate data is fetched from the <strong className="text-gray-200">FRED API</strong>
          (Federal Reserve Economic Data). Rates include:
        </P>
        <Table
          headers={['Rate', 'Series ID', 'Description']}
          rows={[
            ['SOFR', 'SOFR', 'Secured Overnight Financing Rate — USD benchmark'],
            ['Fed Funds', 'FEDFUNDS', 'Federal Reserve target rate'],
            ['2Y Treasury', 'DGS2', 'US 2-year government bond yield'],
            ['10Y Treasury', 'DGS10', 'US 10-year government bond yield'],
            ['EURIBOR 3M', 'EUR3MTD156N', 'Euro interbank offered rate'],
          ]}
        />
        <P>
          The 2Y/10Y yield spread is monitored for inversion — a historically reliable recession
          indicator (negative spread = inverted curve = yield curve inversion).
        </P>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TECHNICAL */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <H2 id="technical" color="text-emerald-400">Technical Analysis</H2>

        <H3 id="macd">MACD</H3>
        <P>
          Moving Average Convergence Divergence. Measures momentum by comparing two exponential
          moving averages.
        </P>
        <Formula>
{`MACD line   = EMA(12) − EMA(26)
Signal line = EMA(9) of MACD line
Histogram   = MACD − Signal

Bullish signal: MACD crosses above Signal
Bearish signal: MACD crosses below Signal`}
        </Formula>

        <H3 id="rsi">RSI</H3>
        <P>
          Relative Strength Index. Oscillator measuring speed and magnitude of price changes.
          Range: 0–100.
        </P>
        <Formula>
{`RS  = avg_gain(14) / avg_loss(14)
RSI = 100 − (100 / (1 + RS))

RSI > 70  →  Overbought (potential reversal or pullback)
RSI < 30  →  Oversold   (potential bounce or accumulation)
RSI = 50  →  Neutral momentum`}
        </Formula>

        <H3 id="bollinger">Bollinger Bands</H3>
        <P>
          Volatility envelope around a moving average. Price touching the outer bands signals
          potential mean-reversion.
        </P>
        <Formula>
{`Middle band = SMA(20)
Upper band  = SMA(20) + 2 × σ(20)
Lower band  = SMA(20) − 2 × σ(20)

Band squeeze (σ contracting) → breakout imminent
Price > Upper band           → potential overbought
Price < Lower band           → potential oversold`}
        </Formula>

        <H3 id="arima">ARIMA</H3>
        <P>
          AutoRegressive Integrated Moving Average. Models log-returns as a linear function of
          past returns and past errors.
        </P>
        <Formula>
{`ARIMA(p, d, q):
  p = autoregressive order (past observations)
  d = differencing order (to achieve stationarity)
  q = moving average order (past errors)

Model fit on 2 years of daily log-returns.
Forecast: next 30 trading days with 95% confidence interval.`}
        </Formula>

        <H3 id="garch">GARCH</H3>
        <P>
          Generalized AutoRegressive Conditional Heteroskedasticity. Models time-varying
          volatility — the "volatility of volatility" observed in financial markets.
        </P>
        <Formula>
{`GARCH(1,1):
σ²_t = ω + α × ε²_(t-1) + β × σ²_(t-1)

ω = long-run variance
α = ARCH term (reaction to recent shock)
β = GARCH term (persistence of volatility)

Forecast: 30-day conditional volatility path.`}
        </Formula>

        <H3 id="monte-carlo">Monte Carlo Simulation</H3>
        <P>
          1,000 price paths are simulated using Geometric Brownian Motion, parameterized by
          the GARCH-estimated drift and volatility.
        </P>
        <Formula>
{`S_t = S_0 × exp[(μ − σ²/2) × Δt + σ × √Δt × Z]

Z ~ N(0,1)   (standard normal random shock)
μ = daily drift (from ARIMA mean)
σ = daily volatility (from GARCH forecast)
Δt = 1/252 trading day

1,000 paths simulated over 60 trading days.
Output: P10, P50, P90 percentile bands + all paths.`}
        </Formula>

        <H3 id="lgbm">LightGBM Classifier</H3>
        <P>
          A gradient boosting classifier trained on technical features to predict directional
          price movement (up/down) over the next 5 trading days.
        </P>
        <Formula>
{`Features:
  RSI(14), MACD, Signal, Histogram
  Returns: 1d, 5d, 20d
  Volatility: rolling 20-day
  Distance from SMA20, SMA50
  Volume ratio (current / 20d avg)

Target: 1 if return(t+5) > 0, else 0

Train: 70% of available history
Test:  30% (walk-forward, no lookahead bias)
Output: probability of positive 5-day return`}
        </Formula>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* DATA SOURCES */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <H2 id="datasources">Data Sources & Limitations</H2>

        <Table
          headers={['Source', 'Data provided', 'Limitations']}
          rows={[
            ['yfinance', 'Prices, fundamentals, ratios, news, analyst data', 'Unofficial API — can break; real-time data may lag 15 min'],
            ['FMP (free)', 'Financial statements, ratios, DCF', '250 requests/day on free tier'],
            ['SEC EDGAR', 'Official 10-K/10-Q filings', 'US companies only; parsing required'],
            ['FRED', 'Macro rates (SOFR, Treasuries, EURIBOR)', 'End-of-day updates only'],
            ['Alpha Vantage', 'Technical indicator backup', '25 requests/day on free tier'],
          ]}
        />

        <Callout label="Important disclaimer">
          All data is fetched from public APIs for informational purposes only. This platform
          does not provide investment advice. Financial data may be delayed, incomplete, or
          inaccurate. Models are based on historical data and cannot predict future performance.
          Always verify data against official company filings before making any investment decision.
        </Callout>

        <H3 id="data-quality">Data Quality Notes</H3>
        <P>
          Financial statements from yfinance may differ from official 10-K filings due to
          rounding, restatements, or restated line items. EBITDA in particular is often
          estimated as EBIT + D&A rather than reported directly. When FMP data is available,
          it is preferred for statement-level analysis.
        </P>
        <P>
          Sector classification follows GICS (Global Industry Classification Standard) as
          reported by yfinance. Some companies may be misclassified or placed in broad sectors
          that don't fully reflect their business model (e.g., Amazon classified as Consumer
          Discretionary despite significant cloud revenue).
        </P>

      </div>
    </div>
  )
}
