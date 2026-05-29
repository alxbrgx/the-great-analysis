// Pre-built deal examples for the Private Credit Workbench.
// Each example loads realistic financials based on a typical PE-backed company in that profile.
// Inspired by public LBO transactions but with rounded synthetic numbers.

export interface DealExample {
  id: string
  label: string                      // e.g. "Acme Group — Mid-cap Services LBO"
  shortName: string                  // e.g. "Acme Group"
  description: string                // 1-line context
  expectedVerdict: string            // hint: "Adequate Credit", "Aggressive — Caution", etc.
  tags: string[]                     // e.g. ['Services', 'LBO', 'Mid-cap']
  data: Record<string, any>          // form fields
}

export const DEAL_EXAMPLES: DealExample[] = [
  {
    id: 'mid_services_balanced',
    label: 'Mid-cap Services — Balanced LBO',
    shortName: 'Acme Group',
    description: 'Classic European mid-market services LBO, conservative leverage, defensive sector',
    expectedVerdict: 'Adequate Credit',
    tags: ['Services', 'LBO', 'Mid-cap', 'Defensive'],
    data: {
      company_name: 'Acme Group', industry: 'Business Services', fiscal_year: 2024, currency: 'EUR',
      revenue: 450, ebitda: 112.5, ebit: 85, interest_expense: 28, tax_rate: 0.25,
      cfo: 95, capex: 22.5,
      cash: 35, total_debt: 495, senior_secured_debt: 450, subordinated_debt: 45,
      revolving_credit_facility: 75, rcf_drawn: 0,
      enterprise_value: 900, equity_contribution: 405, purchase_price: 900,
      covenant_net_leverage_max: 5.5, covenant_interest_coverage_min: 2.0, covenant_capex_max: 0,
      tranche_a_amount: 200, tranche_a_rate: 0.065, tranche_a_amort_years: 5,
      tranche_b_amount: 250, tranche_b_rate: 0.075, tranche_b_amort_years: 7,
    },
  },
  {
    id: 'saas_premium',
    label: 'SaaS Buyout — Premium Multiple',
    shortName: 'Northwind Software',
    description: 'High-growth SaaS, premium 18x multiple, strong recurring revenue, light capex',
    expectedVerdict: 'Adequate Credit',
    tags: ['SaaS', 'Tech', 'High-multiple', 'Recurring'],
    data: {
      company_name: 'Northwind Software', industry: 'Software & SaaS', fiscal_year: 2024, currency: 'USD',
      revenue: 320, ebitda: 88, ebit: 70, interest_expense: 35, tax_rate: 0.22,
      cfo: 75, capex: 8,
      cash: 50, total_debt: 580, senior_secured_debt: 480, subordinated_debt: 100,
      revolving_credit_facility: 60, rcf_drawn: 0,
      enterprise_value: 1600, equity_contribution: 1070, purchase_price: 1600,
      covenant_net_leverage_max: 7.0, covenant_interest_coverage_min: 1.75, covenant_capex_max: 0,
      tranche_a_amount: 180, tranche_a_rate: 0.07, tranche_a_amort_years: 5,
      tranche_b_amount: 300, tranche_b_rate: 0.08, tranche_b_amort_years: 7,
    },
  },
  {
    id: 'industrial_cyclical',
    label: 'Industrial Manufacturing — Cyclical',
    shortName: 'Alpha Industries',
    description: 'Capex-intensive industrial player, cyclical exposure, moderate leverage',
    expectedVerdict: 'Adequate Credit',
    tags: ['Industrial', 'Cyclical', 'Capex-heavy'],
    data: {
      company_name: 'Alpha Industries', industry: 'Industrial Manufacturing', fiscal_year: 2024, currency: 'EUR',
      revenue: 850, ebitda: 130, ebit: 85, interest_expense: 32, tax_rate: 0.27,
      cfo: 105, capex: 65,
      cash: 60, total_debt: 540, senior_secured_debt: 480, subordinated_debt: 60,
      revolving_credit_facility: 100, rcf_drawn: 25,
      enterprise_value: 1100, equity_contribution: 620, purchase_price: 1100,
      covenant_net_leverage_max: 5.0, covenant_interest_coverage_min: 2.5, covenant_capex_max: 80,
      tranche_a_amount: 200, tranche_a_rate: 0.06, tranche_a_amort_years: 5,
      tranche_b_amount: 280, tranche_b_rate: 0.0725, tranche_b_amort_years: 7,
    },
  },
  {
    id: 'healthcare_premium',
    label: 'Healthcare Services — Resilient',
    shortName: 'MediCare Plus',
    description: 'Diversified healthcare services group, resilient cash flows, premium multiple',
    expectedVerdict: 'Strong Credit',
    tags: ['Healthcare', 'Resilient', 'Recession-proof'],
    data: {
      company_name: 'MediCare Plus', industry: 'Healthcare Services', fiscal_year: 2024, currency: 'EUR',
      revenue: 620, ebitda: 142, ebit: 110, interest_expense: 26, tax_rate: 0.28,
      cfo: 125, capex: 30,
      cash: 80, total_debt: 510, senior_secured_debt: 460, subordinated_debt: 50,
      revolving_credit_facility: 80, rcf_drawn: 0,
      enterprise_value: 1700, equity_contribution: 1270, purchase_price: 1700,
      covenant_net_leverage_max: 5.0, covenant_interest_coverage_min: 2.5, covenant_capex_max: 0,
      tranche_a_amount: 200, tranche_a_rate: 0.0575, tranche_a_amort_years: 5,
      tranche_b_amount: 260, tranche_b_rate: 0.0675, tranche_b_amort_years: 7,
    },
  },
  {
    id: 'consumer_aggressive',
    label: 'Consumer Goods — Aggressive Leverage',
    shortName: 'Brand Co',
    description: 'Consumer brand with high leverage and PIK note — sponsor-friendly LBO',
    expectedVerdict: 'Aggressive — Caution',
    tags: ['Consumer', 'High Leverage', 'PIK'],
    data: {
      company_name: 'Brand Co', industry: 'Consumer Goods', fiscal_year: 2024, currency: 'EUR',
      revenue: 540, ebitda: 95, ebit: 65, interest_expense: 48, tax_rate: 0.27,
      cfo: 60, capex: 18,
      cash: 25, total_debt: 670, senior_secured_debt: 500, subordinated_debt: 170,
      revolving_credit_facility: 60, rcf_drawn: 15,
      enterprise_value: 1200, equity_contribution: 555, purchase_price: 1200,
      covenant_net_leverage_max: 7.5, covenant_interest_coverage_min: 1.5, covenant_capex_max: 0,
      tranche_a_amount: 150, tranche_a_rate: 0.075, tranche_a_amort_years: 5,
      tranche_b_amount: 350, tranche_b_rate: 0.085, tranche_b_amort_years: 7,
    },
  },
  {
    id: 'distressed',
    label: 'Distressed — Covenant Breach',
    shortName: 'StressedCo',
    description: 'Already-stressed credit, covenant pressure, refinancing wall — what to flag',
    expectedVerdict: 'Distressed — Avoid / Restructure',
    tags: ['Distressed', 'Covenant Breach', 'Restructuring'],
    data: {
      company_name: 'StressedCo', industry: 'Retail', fiscal_year: 2024, currency: 'EUR',
      revenue: 380, ebitda: 32, ebit: 12, interest_expense: 38, tax_rate: 0.27,
      cfo: 18, capex: 22,
      cash: 8, total_debt: 380, senior_secured_debt: 260, subordinated_debt: 120,
      revolving_credit_facility: 40, rcf_drawn: 38,
      enterprise_value: 420, equity_contribution: 48, purchase_price: 420,
      covenant_net_leverage_max: 6.0, covenant_interest_coverage_min: 2.0, covenant_capex_max: 0,
      tranche_a_amount: 100, tranche_a_rate: 0.085, tranche_a_amort_years: 3,
      tranche_b_amount: 160, tranche_b_rate: 0.10, tranche_b_amort_years: 5,
    },
  },
  {
    id: 'infra_stable',
    label: 'Infrastructure — Stable Yield',
    shortName: 'CityNet Infra',
    description: 'Regulated infrastructure, predictable cash flows, supports high leverage with low spreads',
    expectedVerdict: 'Strong Credit',
    tags: ['Infrastructure', 'Stable', 'High Leverage OK'],
    data: {
      company_name: 'CityNet Infra', industry: 'Utilities', fiscal_year: 2024, currency: 'EUR',
      revenue: 280, ebitda: 175, ebit: 110, interest_expense: 40, tax_rate: 0.25,
      cfo: 145, capex: 55,
      cash: 70, total_debt: 1100, senior_secured_debt: 950, subordinated_debt: 150,
      revolving_credit_facility: 100, rcf_drawn: 10,
      enterprise_value: 2400, equity_contribution: 1370, purchase_price: 2400,
      covenant_net_leverage_max: 7.0, covenant_interest_coverage_min: 2.5, covenant_capex_max: 70,
      tranche_a_amount: 400, tranche_a_rate: 0.045, tranche_a_amort_years: 8,
      tranche_b_amount: 550, tranche_b_rate: 0.055, tranche_b_amort_years: 10,
    },
  },
  {
    id: 'add_on',
    label: 'Add-on Acquisition — Pro-forma',
    shortName: 'Tech Platform Co',
    description: 'Mid-size SaaS platform doing a strategic bolt-on, modest incremental leverage',
    expectedVerdict: 'Adequate Credit',
    tags: ['Add-on', 'SaaS', 'Pro-forma synergies'],
    data: {
      company_name: 'Tech Platform Co (PF)', industry: 'Information Technology', fiscal_year: 2024, currency: 'USD',
      revenue: 480, ebitda: 125, ebit: 100, interest_expense: 32, tax_rate: 0.22,
      cfo: 105, capex: 12,
      cash: 45, total_debt: 620, senior_secured_debt: 540, subordinated_debt: 80,
      revolving_credit_facility: 70, rcf_drawn: 0,
      enterprise_value: 1500, equity_contribution: 925, purchase_price: 1500,
      covenant_net_leverage_max: 6.0, covenant_interest_coverage_min: 2.0, covenant_capex_max: 0,
      tranche_a_amount: 220, tranche_a_rate: 0.065, tranche_a_amort_years: 5,
      tranche_b_amount: 320, tranche_b_rate: 0.075, tranche_b_amort_years: 7,
    },
  },
]

export function getExampleById(id: string): DealExample | undefined {
  return DEAL_EXAMPLES.find(e => e.id === id)
}
