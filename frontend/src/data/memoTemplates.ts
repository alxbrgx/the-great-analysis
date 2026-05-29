// Pre-built memo templates per deal strategy.
// Each template provides starter content for the qualitative sections,
// tailored to the typical structure of that deal type.

import type { CreditMemoSections } from '../store/useMemoStore'

export type MemoTemplateId =
  | 'blank'
  | 'lbo_buyout'
  | 'dividend_recap'
  | 'refinancing'
  | 'add_on_acquisition'
  | 'amend_extend'

export interface MemoTemplate {
  id: MemoTemplateId
  label: string
  description: string
  emoji: string  // simple visual marker (not user-facing emoji per design rules — used as icon hint)
  sections: Partial<CreditMemoSections>
}

export const MEMO_TEMPLATES: MemoTemplate[] = [
  {
    id: 'blank',
    label: 'Blank',
    description: 'Empty memo with no pre-filled content',
    emoji: 'FileText',
    sections: {},
  },

  {
    id: 'lbo_buyout',
    label: 'LBO Buyout',
    description: 'Sponsor-led acquisition financed with senior debt + equity',
    emoji: 'Briefcase',
    sections: {
      executiveSummary: `Project [Name] is a primary LBO of [Company], a [leader/Top-N player] in [sector]. Sponsor [PE Fund] is acquiring 100% from [seller] at [X.Xx EBITDA] = €[XXX]M EV.

Financing: €[XXX]M Senior Secured TLB (X.Xx leverage), €[XX]M RCF, €[XXX]M Sponsor Equity (XX% of capitalization).

Recommendation: [APPROVE / DECLINE] participation in the TLB at E+[XXX]bps for €[XX]M.`,

      investmentThesis: `• Defensive sector with structural growth (CAGR XX%) and [recurring revenue / contracted backlog]
• Strong cash conversion (FCF/EBITDA XX%) supporting accelerated deleveraging
• Sponsor track record: [N prior LBOs in sector, average exit multiple X.Xx, no defaults]
• Conservative entry leverage at X.Xx (vs sector LBO median X.Xx), XX% equity contribution
• Clear deleveraging path: target X.Xx leverage in 24 months via FCF + scheduled amortization
• Multiple expansion potential at exit through [margin expansion / multiple re-rating / bolt-ons]`,

      capitalStructure: `Sources & Uses:
SOURCES:
• Senior Secured TLB:           €[XXX]M  ·  [X.X]x EBITDA  ·  E+[XXX]bps  ·  7yr bullet
• Senior Secured RCF (undrawn): €[XX]M   ·  E+[XXX]bps  ·  6yr  ·  Springing covenant > 40% drawn
• Sponsor Equity:               €[XXX]M  ·  XX% of capitalization
• Management Rollover:          €[XX]M
TOTAL SOURCES:                  €[XXX]M

USES:
• Equity Purchase Price:        €[XXX]M
• Refinancing existing debt:    €[XX]M
• Transaction & financing fees: €[XX]M
TOTAL USES:                     €[XXX]M

Pro-Forma Capital Structure:
• Net Debt / EBITDA:    X.Xx
• Senior Net Leverage:  X.Xx
• Total Net Leverage:   X.Xx
• Equity %:             XX%`,

      sponsorAndManagement: `SPONSOR: [Fund Name] — Fund [N] vintage [YYYY], €[X]Bn AUM, [Generalist / Sector-focused on X]
• Track record in sector: [N deals, average IRR XX%, MOIC X.Xx]
• Recent comparable exits: [Deal 1 — X.Xx MOIC, Deal 2 — X.Xx MOIC]
• Average hold period: [X] years
• Defaults / restructurings in portfolio: [N out of M]

MANAGEMENT TEAM:
• CEO [Name]: [X] years in sector, prior at [Company]. Joining/staying post-deal.
• CFO [Name]: [X] years finance, prior IPO/M&A experience at [Company]
• Equity package (MIP): XX% of equity, vesting on [revenue / EBITDA / IRR] thresholds
• Management rollover: €[X]M (XX% of expected proceeds)
• Retention: standard 3-year contracts, change-of-control protection`,

      recommendationRationale: `We RECOMMEND [APPROVE] participation in the Senior Secured TLB.

Supporting factors:
• Resilient business with [demonstrated recession resilience: -X% EBITDA in 2020 vs -XX% sector]
• Quality EBITDA: ~XX% recurring revenue, top 10 customers stable, no significant add-backs
• Strong sponsor with proven sector expertise and conservative deal structure
• Adequate covenant headroom (XX% on Net Leverage) and FCF supports rapid deleveraging
• Recovery analysis: senior secured at X.Xx collateral coverage, est. recovery XX%

Conditions to monitor:
• Quarterly EBITDA and leverage covenant compliance
• Customer concentration metrics (top 10 reporting)
• Capex discipline vs business plan`,
    },
  },

  {
    id: 'dividend_recap',
    label: 'Dividend Recapitalization',
    description: 'Re-leveraging an existing portfolio company to return capital to sponsor',
    emoji: 'Wallet',
    sections: {
      executiveSummary: `Project [Name] is a dividend recap of [Company], a portfolio company of [Sponsor] since [YYYY] (X years held).

Transaction: incremental €[XXX]M Senior Secured TLB to fund a €[XXX]M dividend distribution to the sponsor + €[XX]M refinancing of existing debt.

Pro-forma leverage: X.Xx (vs current X.Xx). Recommendation: [APPROVE / DECLINE] commitment of €[XX]M at E+[XXX]bps.`,

      investmentThesis: `• Mature, stable cash flows after [X] years of sponsor ownership — operational improvements completed
• Demonstrated EBITDA growth: from €[XX]M (entry) to €[XX]M (current), CAGR XX%
• Sponsor has proven ability to manage business through cycle ([2020 outcome])
• Strong cash conversion (XX%) and conservative pre-deal leverage (X.Xx) provide cushion
• Refinancing extends maturity profile (no walls in next 3 years)
• Sponsor maintains XX% equity stake post-recap (vs XX% pre-recap) — alignment preserved`,

      financialHighlights: `Track record under sponsor ownership:
• Revenue: €[XX]M → €[XX]M (CAGR XX%)
• EBITDA: €[XX]M → €[XX]M (margin XX% → XX%)
• FCF: €[XX]M → €[XX]M (cash conversion stable at XX%)
• Net Debt / EBITDA: X.Xx (entry) → X.Xx (pre-recap) → X.Xx (post-recap)

Dividend recap mechanics:
• Cumulative cash returned to sponsor pre-recap: €[XX]M (dividends + management fees)
• Recap dividend: €[XXX]M = X.Xx of original equity check
• Total cash-on-cash to sponsor: X.Xx within [N] years (vs target X.Xx by exit)`,

      risksAndMitigants: `RISK 1 — RE-LEVERAGING: Pro-forma leverage X.Xx is meaningfully higher than current X.Xx
  → MITIGANT: FCF still supports X.Xx of deleveraging in 24 months; entry leverage was X.Xx so company has operated at higher levels

RISK 2 — DIMINISHED SKIN-IN-THE-GAME: Sponsor extracts €[XXX]M, reducing economic exposure
  → MITIGANT: Sponsor retains XX% equity, MIP for management aligned with continued performance

RISK 3 — REFINANCING RISK: Bullet maturity in 7 years, business may face cyclical pressures
  → MITIGANT: FCF allows deleveraging to X.Xx pre-maturity; demonstrated capital markets access

RISK 4 — OPERATIONAL FATIGUE: Mature LBO, easy gains already extracted
  → MITIGANT: Identified initiatives [pricing / digital / international] expected to deliver €[XX]M EBITDA over 24 months`,

      recommendationRationale: `We RECOMMEND [APPROVE / APPROVE WITH CONDITIONS] participation in the upsized TLB.

Key considerations:
• Dividend recaps are higher risk than primary LBOs (re-leveraging mature credit)
• However, this credit has demonstrated stability and the sponsor is not exiting
• Pricing of E+[XXX]bps offers [adequate / attractive] risk-adjusted return
• Documentation should include: tightened restricted payments basket post-recap, MFN protection, asset sale sweep

Conditions:
• Pro-forma leverage at close not to exceed X.Xx
• No further dividends until leverage < X.Xx (12-month lock-up)
• Sponsor confirms no exit process within 18 months`,
    },
  },

  {
    id: 'refinancing',
    label: 'Refinancing',
    description: 'Replace existing debt with new facilities (extension, repricing, or restructuring)',
    emoji: 'RotateCw',
    sections: {
      executiveSummary: `Project [Name] is a refinancing of [Company]'s existing €[XXX]M Senior Secured debt maturing [DATE].

New financing: €[XXX]M Senior Secured TLB (X.Xx leverage, in line with existing), 7yr bullet, pricing E+[XXX]bps (vs E+[XXX]bps current).

Use of proceeds: 100% refinance of existing TLB. No incremental leverage.

Recommendation: [APPROVE / DECLINE] commitment of €[XX]M.`,

      investmentThesis: `• Maturity extension addresses upcoming wall (€[XXX]M due [DATE])
• [Pricing improvement of XX bps reflects credit improvement / market conditions]
• Documentation [substantively unchanged / improved with stricter baskets]
• Existing lender experience: company has performed [in line / above] business plan
• Net Leverage stable at X.Xx (no incremental debt)
• Cash flow generation remains strong at €[XX]M FCF / year`,

      financialHighlights: `Performance since original financing ([YYYY]):
• Revenue: €[XX]M → €[XX]M (CAGR XX%)
• EBITDA: €[XX]M → €[XX]M (margin XX% → XX%)
• Net Debt / EBITDA: X.Xx (origination) → X.Xx (current)
• ICR: X.Xx (origination) → X.Xx (current)
• Number of covenant waivers/amendments since origination: [N]
• All scheduled amortization paid on time: [Yes/No]`,

      capitalStructure: `Pre vs Post Refinancing:
                            BEFORE              AFTER
• Senior Secured TLB:    €[XXX]M @ E+[X]bps   €[XXX]M @ E+[X]bps
• RCF:                   €[XX]M  @ E+[X]bps   €[XX]M  @ E+[X]bps
• Maturity:              [DATE]                [DATE +5yr]
• Net Leverage:          X.Xx                  X.Xx (unchanged)
• ICR:                   X.Xx                  X.Xx (improved by spread reduction)

Sources / Uses:
• New TLB:               €[XXX]M
• Repay existing TLB:    €[XXX]M
• Fees & expenses:       €[X]M  (paid from cash on hand)`,

      recommendationRationale: `We RECOMMEND [APPROVE] participation in the refinanced TLB.

Supporting factors:
• Credit has performed well since original financing — no material covenant pressure
• Maturity extension de-risks the credit profile
• Pricing aligned with current market conditions for similar risk profile
• Existing relationship gives us strong understanding of business and management

Considerations:
• If refinancing is opportunistic (very early), watch for "amend and extend creep" reducing covenant protection
• Verify documentation has not become materially more sponsor-friendly`,
    },
  },

  {
    id: 'add_on_acquisition',
    label: 'Add-on Acquisition',
    description: 'Bolt-on acquisition by an existing portfolio company',
    emoji: 'Plus',
    sections: {
      executiveSummary: `Project [Name] is an add-on acquisition by [Portfolio Company] (existing borrower) of [Target] for €[XX]M, financed via €[XX]M incremental TLB and €[XX]M cash on hand.

Pro-forma leverage post-deal: X.Xx (vs current X.Xx pre-acquisition, X.Xx including run-rate synergies of €[X]M).

Recommendation: [APPROVE / DECLINE] commitment of €[XX]M of the incremental TLB at E+[XXX]bps (same terms as existing).`,

      investmentThesis: `• Strategic fit: [geographic expansion / product extension / customer overlap with cross-sell potential]
• Accretive multiple: target acquired at X.Xx EBITDA vs platform's implied X.Xx — multiple arbitrage
• Synergies: €[X]M run-rate (cost: €[X]M from [shared overhead / procurement / IT]) achievable in [12-18] months
• Track record: this is the [Nth] add-on for the platform; previous add-ons delivered XX% of projected synergies
• Pro-forma leverage X.Xx remains within covenant headroom (covenant: X.Xx max)`,

      financialHighlights: `Standalone Target:
• Revenue: €[XX]M (CAGR XX%)
• EBITDA: €[XX]M (margin XX%)
• Net debt: €[XX]M

Pro-Forma Combined (incl. synergies):
• Revenue: €[XXX]M
• EBITDA: €[XXX]M (margin XX%)
• EBITDA growth: +XX% vs standalone platform
• FCF: €[XX]M
• Pro-forma leverage: X.Xx (current X.Xx → X.Xx pre-synergies → X.Xx with synergies)`,

      risksAndMitigants: `RISK 1 — INTEGRATION: First add-on this size, complex integration
  → MITIGANT: Integration plan reviewed, dedicated team assigned, milestones tracked monthly

RISK 2 — SYNERGY DELIVERY: €[X]M run-rate is [XX]% of target EBITDA
  → MITIGANT: Detailed bottom-up synergy plan, [XX]% from quick-win procurement, [XX]% from headcount actions in months 1-6

RISK 3 — INCREMENTAL LEVERAGE: Pro-forma X.Xx vs current X.Xx
  → MITIGANT: Within covenant headroom; FCF restores leverage to X.Xx within 18 months

RISK 4 — CULTURAL / KEY PERSONNEL: Risk of departures from acquired entity
  → MITIGANT: Retention packages for top [N] managers, earnout for founder over 24 months`,

      recommendationRationale: `We RECOMMEND [APPROVE] the incremental TLB to finance the acquisition.

Rationale:
• Strategic logic is sound and synergies appear realistic given platform's track record
• Pro-forma leverage remains acceptable and within covenant headroom
• Pricing alignment with existing TLB ensures consistent treatment of lenders
• Multiple arbitrage creates value for all stakeholders

Conditions:
• Synergy tracking: quarterly reporting on synergy delivery (cumulative actual vs plan)
• No further acquisitions until pro-forma leverage < X.Xx
• Integration committee reporting to lenders for first 12 months`,
    },
  },

  {
    id: 'amend_extend',
    label: 'Amend & Extend',
    description: 'Modify terms of an existing credit facility (typically extend maturity)',
    emoji: 'Edit3',
    sections: {
      executiveSummary: `Project [Name] is an amendment and extension request from [Company] on its existing €[XXX]M Senior Secured TLB.

Proposed changes:
• Maturity extension: +[N] years (from [DATE] to [DATE])
• Pricing increase: E+[XXX]bps → E+[XXX]bps (+[XX]bps consent fee)
• Covenant changes: [list]
• Documentation: [list of basket adjustments]

Recommendation: [APPROVE / DECLINE] consent from our position of €[XX]M.`,

      investmentThesis: `• Address upcoming maturity wall in benign refinancing window
• Consent fee of [XX]bps + spread increase compensates for extension risk
• Borrower has performed [in line / above] business plan since origination
• Net leverage [improved / stable] at X.Xx (vs X.Xx at origination)
• Covenant adjustments are [reasonable given performance / concerning]
• Alternative is forcing refinance which may be at higher cost or fail`,

      covenantsCommentary: `Existing Covenants:
• Net Leverage ≤ X.Xx — current X.Xx, headroom XX%
• ICR ≥ X.Xx — current X.Xx, headroom XX%
• Springing on RCF utilization > 40%

Proposed Amendments:
• Net Leverage ≤ X.Xx (loosened by X.Xx) — current headroom would become XX%
• ICR ≥ X.Xx (unchanged / loosened)
• Restricted Payments basket: increased from €[XX]M to €[XX]M
• Permitted Investments basket: [unchanged / loosened]
• Asset Sale sweep: [unchanged / reduced from XX% to XX%]
• Excess Cash Flow sweep: [unchanged]

ASSESSMENT: amendments [strengthen / maintain / weaken] lender protection.`,

      recommendationRationale: `We RECOMMEND [APPROVE / APPROVE WITH MODIFICATIONS / DECLINE] the amend & extend request.

If APPROVE:
• Consent fee + spread increase adequately compensates for extension
• Borrower performance supports the amendment
• Documentation changes are within market norms
• Refusing would trigger refinance which is more disruptive

If DECLINE / MODIFY:
• Documentation loosening is excessive given current credit metrics
• Counter-proposal: [tighter Net Leverage / no basket increase / additional consent fee of XXbps]
• Maturity extension acceptable but pricing/terms must reflect risk

Process:
• Vote due [DATE], requires [50%/66%/100%] of TLB lenders by amount
• Our position: €[XX]M of total €[XXX]M (XX% of pool)`,
    },
  },
]
