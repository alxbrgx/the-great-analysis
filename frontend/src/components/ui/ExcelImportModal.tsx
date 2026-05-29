import { useState, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import {
  Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle,
  Download, TrendingUp, TrendingDown,
} from 'lucide-react'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface PeriodicRow {
  date: string | null
  ltm_ebitda: number | null
  ltm_rev: number | null
  gross_total_leverage: number | null
  net_total_leverage: number | null
  gross_1st_lien: number | null
  ltm_fcf: number | null
  performance: string | null
}

export interface ImportExtras {
  periodicRows?: PeriodicRow[]
  extraMetrics?: Record<string, number>
}

// ─── Normalized string helpers ────────────────────────────────────────────────

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Returns 0-100 score of how well `label` matches any of the `keywords`.
 * Scoring:
 *   100 — exact normalized match
 *    90 — label contains entire keyword
 *    80 — keyword contains entire label
 *    60 — all keyword words present in label words
 *    30 — >50% keyword words present
 *     0 — no match
 */
function score(label: string, keywords: string[]): number {
  const ln = norm(label)
  let best = 0
  for (const kw of keywords) {
    const kn = norm(kw)
    if (ln === kn) return 100
    if (ln.includes(kn)) { best = Math.max(best, 90); continue }
    if (kn.includes(ln)) { best = Math.max(best, 80); continue }
    const lWords = new Set(ln.split(' '))
    const kWords = kn.split(' ').filter(Boolean)
    if (kWords.length === 0) continue
    const hits = kWords.filter(w => lWords.has(w)).length
    if (hits === kWords.length) { best = Math.max(best, 60); continue }
    if (hits / kWords.length > 0.5) { best = Math.max(best, 30); continue }
  }
  return best
}

// ─── Field definitions ────────────────────────────────────────────────────────

interface FieldDef {
  key: string
  keywords: string[]
  type: 'number' | 'string'
  group: string
  // When value is negative and that seems wrong (e.g. cash stored negative), take abs
  absValue?: boolean
}

const FIELDS: FieldDef[] = [
  // Company
  { key: 'company_name', type: 'string', group: 'Company',
    keywords: ['company', 'company name', 'borrower', 'issuer', 'name', 'emetteur', 'emprunteur'] },
  { key: 'industry', type: 'string', group: 'Company',
    keywords: ['industry', 'sector', 'secteur', 'industrie'] },
  { key: 'fiscal_year', type: 'number', group: 'Company',
    keywords: ['fiscal year', 'fy', 'year', 'annee', 'exercice'] },
  { key: 'currency', type: 'string', group: 'Company',
    keywords: ['currency', 'ccy', 'devise'] },

  // P&L — revenue
  { key: 'revenue', type: 'number', group: 'Income',
    keywords: [
      'ltm rev', 'ltm revenue', 'ltm revenues', 'ltm net sales', 'ltm sales',
      'total revenues', 'total revenue', 'net revenues', 'net revenue',
      'revenue', 'revenues', 'sales', 'net sales', 'turnover',
      'chiffre affaires', 'ca ltm', 'cifre d affaires',
    ] },
  // P&L — EBITDA
  { key: 'ebitda', type: 'number', group: 'Income',
    keywords: [
      'ltm ebitda', 'ebitda ltm', 'adjusted ebitda', 'adj ebitda', 'ebitda adjusted',
      'ebitda adj', 'ebitda lfl', 'ebitda reported',
      'ebitda', 'ebidta', 'ebitda lfy',
    ] },
  // P&L — D&A
  { key: 'da', type: 'number', group: 'Income',
    keywords: [
      'd&a', 'da', 'depreciation amortization', 'depreciation and amortization',
      'depreciation & amortization', 'amortissement', 'dotations amort',
    ] },
  // P&L — EBIT
  { key: 'ebit', type: 'number', group: 'Income',
    keywords: [
      'ebit', 'operating income', 'operating profit', 'resultat operationnel',
      'ebit ltm', 'ltm ebit',
    ] },
  // P&L — interest
  { key: 'interest_expense', type: 'number', group: 'Income',
    keywords: [
      'interest exp', 'interest expense', 'interest cost', 'net interest',
      'cash interest', 'interest paid', 'charges financieres', 'charges financières',
      'cout de la dette', 'cout dette', 'ltm interest',
    ] },
  // P&L — tax rate
  { key: 'tax_rate', type: 'number', group: 'Income',
    keywords: ['tax rate', 'effective tax rate', 'etr', 'taux impot', 'taux d impot'] },

  // Cash flow
  { key: 'cfo', type: 'number', group: 'Cash Flow',
    keywords: [
      'cfo', 'cash from operations', 'operating cash flow', 'cash flow operations',
      'cash flow from operations', 'flux tresorerie operationnel', 'flux de treso',
    ] },
  { key: 'capex', type: 'number', group: 'Cash Flow',
    keywords: [
      'capex', 'capital expenditure', 'capital expenditures', 'investments',
      'investissements', 'capex ltm', 'ltm capex',
    ] },

  // Balance sheet
  { key: 'cash', type: 'number', group: 'Balance Sheet', absValue: true,
    keywords: [
      'cash', 'cash on b s', 'cash on bs', 'cash on balance sheet',
      'cash and equivalents', 'tresorerie', 'cash equivalents',
      'cash and cash equivalents', 'liquidites',
    ] },
  { key: 'total_debt', type: 'number', group: 'Balance Sheet',
    keywords: [
      'total gross debt', 'gross debt', 'total debt', 'financial debt',
      'dette financiere brute', 'dette totale', 'total financial debt',
      'dette brute', 'borrowings',
    ] },
  { key: 'senior_secured_debt', type: 'number', group: 'Balance Sheet',
    keywords: [
      'senior secured', 'first lien', '1st lien', 'term loan b', 'tlb',
      'senior secured debt', 'first lien debt',
    ] },
  { key: 'subordinated_debt', type: 'number', group: 'Balance Sheet',
    keywords: [
      'subordinated', 'sub debt', 'pik', 'mezzanine', 'second lien',
      'junior debt', 'dette subordonnee',
    ] },
  { key: 'revolving_credit_facility', type: 'number', group: 'Balance Sheet',
    keywords: [
      'revolver availability', 'rcf', 'revolver', 'revolving credit',
      'revolving facility', 'credit revolving', 'ligne revolving',
      'revolving credit facility',
    ] },
  { key: 'rcf_drawn', type: 'number', group: 'Balance Sheet',
    keywords: ['rcf drawn', 'revolver drawn', 'rcf utilized', 'revolving drawn'] },

  // Deal
  { key: 'enterprise_value', type: 'number', group: 'Deal',
    keywords: ['enterprise value', 'ev', 'valeur entreprise', 'total ev'] },
  { key: 'purchase_price', type: 'number', group: 'Deal',
    keywords: ['purchase price', 'transaction price', 'acquisition price', 'prix acquisition'] },
  { key: 'equity_contribution', type: 'number', group: 'Deal',
    keywords: ['equity contribution', 'sponsor equity', 'equity check', 'equity invest', 'fonds propres'] },

  // Tranches
  { key: 'tranche_a_amount', type: 'number', group: 'Tranches',
    keywords: ['tranche a', 'tla', 'term loan a', 'term loan a amount'] },
  { key: 'tranche_a_rate', type: 'number', group: 'Tranches',
    keywords: ['tla rate', 'tranche a rate', 'term loan a rate'] },
  { key: 'tranche_b_amount', type: 'number', group: 'Tranches',
    keywords: ['tranche b', 'tlb', 'term loan b amount'] },
  { key: 'tranche_b_rate', type: 'number', group: 'Tranches',
    keywords: ['tlb rate', 'tranche b rate', 'term loan b rate'] },

  // Covenants
  { key: 'covenant_net_leverage_max', type: 'number', group: 'Covenants',
    keywords: ['max leverage', 'leverage covenant', 'net leverage covenant', 'max net leverage', 'covenant leverage'] },
  { key: 'covenant_interest_coverage_min', type: 'number', group: 'Covenants',
    keywords: ['min icr', 'interest coverage covenant', 'min interest coverage', 'icr covenant', 'covenant icr'] },
  { key: 'covenant_capex_max', type: 'number', group: 'Covenants',
    keywords: ['max capex', 'capex covenant', 'covenant capex'] },
]

// Extra metrics (displayed, not imported into form)
const EXTRA_METRIC_DEFS: { key: string; keywords: string[] }[] = [
  { key: 'gross_1st_lien_leverage', keywords: ['gross 1st lien', '1st lien leverage', 'first lien leverage', 'senior leverage', 'leverage 1l'] },
  { key: 'gross_total_leverage', keywords: ['gross total leverage', 'gross leverage', 'total leverage gross', 'leverage brut total'] },
  { key: 'net_total_leverage', keywords: ['net total leverage', 'net leverage', 'leverage net', 'leverage net total', 'nd ebitda'] },
  { key: 'last_fy_ebitda', keywords: ['last full yr ebitda', 'last fy ebitda', 'full year ebitda', 'fy ebitda', 'ebitda last fy', 'ebitda fy'] },
  { key: 'last_fy_rev', keywords: ['last full yr rev', 'last fy rev', 'last full year revenue', 'full year revenue', 'fy revenue', 'fy rev'] },
]

// Periodic row extra columns
const PERIODIC_DEFS = {
  ltm_ebitda: FIELDS.find(f => f.key === 'ebitda')!.keywords,
  ltm_rev:    FIELDS.find(f => f.key === 'revenue')!.keywords,
  gross_total_leverage: EXTRA_METRIC_DEFS.find(e => e.key === 'gross_total_leverage')!.keywords,
  net_total_leverage:   EXTRA_METRIC_DEFS.find(e => e.key === 'net_total_leverage')!.keywords,
  gross_1st_lien:       EXTRA_METRIC_DEFS.find(e => e.key === 'gross_1st_lien_leverage')!.keywords,
  ltm_fcf: ['ltm fcf', 'free cash flow', 'fcf', 'ltm free cash flow', 'fcf ltm', 'flux tresorerie libre'],
  performance: ['performance', 'performance vs expectation', 'performance v expectation', 'performance vs', 'watchlist', 'watch list', 'statut'],
  date: ['date', 'period', 'reporting date', 'date of data', 'periode', 'date rapport'],
}

// ─── Sheet parsing strategies ─────────────────────────────────────────────────

/**
 * Strategy A — Tabular: header row + data rows.
 * Detects any row with ≥3 string cells where ≥2 cells score >50 against known fields.
 * Returns null if no valid table found.
 */
function tryTabularParse(rows: any[][]): {
  matches: Record<string, any>
  periodicRows: PeriodicRow[]
  extraMetrics: Record<string, number>
} | null {
  // Find the best candidate header row (first 12 rows)
  let bestHeaderRow = -1
  let bestHeaderScore = 0

  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const row = rows[i]
    if (!Array.isArray(row)) continue
    const strCells = row.filter(c => c != null && typeof c === 'string' && c.trim().length > 1)
    if (strCells.length < 3) continue

    // Score: how many cells match any known field or extra metric
    const allKeywords = [
      ...FIELDS.flatMap(f => f.keywords),
      ...EXTRA_METRIC_DEFS.flatMap(e => e.keywords),
      ...Object.values(PERIODIC_DEFS).flat(),
    ]
    const matchCount = strCells.filter(c =>
      allKeywords.some(kw => score(String(c), [kw]) >= 50)
    ).length

    const s = matchCount / strCells.length
    if (s > bestHeaderScore && matchCount >= 2) {
      bestHeaderScore = s
      bestHeaderRow = i
    }
  }

  if (bestHeaderRow < 0) return null

  const headers = rows[bestHeaderRow].map((c: any) => (c != null ? String(c).trim() : ''))

  // Map each column to the best-matching field
  const colToField = new Map<number, string>() // col index → field key
  const colToExtra = new Map<number, string>()  // col index → extra metric key
  const colToPerField = new Map<number, string>() // col index → periodic def key
  let dateCol = -1

  headers.forEach((h, ci) => {
    if (!h) return
    // Date column
    if (score(h, PERIODIC_DEFS.date) >= 50) { dateCol = ci; return }

    // Field
    let bestScore = 0, bestKey = ''
    for (const fd of FIELDS) {
      const s2 = score(h, fd.keywords)
      if (s2 > bestScore) { bestScore = s2; bestKey = fd.key }
    }
    if (bestScore >= 55 && bestKey) { colToField.set(ci, bestKey); return }

    // Extra metric
    let bestExtraScore = 0, bestExtraKey = ''
    for (const ed of EXTRA_METRIC_DEFS) {
      const s2 = score(h, ed.keywords)
      if (s2 > bestExtraScore) { bestExtraScore = s2; bestExtraKey = ed.key }
    }
    if (bestExtraScore >= 55 && bestExtraKey) { colToExtra.set(ci, bestExtraKey); return }

    // Periodic-only fields
    for (const [pk, kws] of Object.entries(PERIODIC_DEFS)) {
      if (pk === 'date') continue
      if (score(h, kws) >= 55) { colToPerField.set(ci, pk); break }
    }
  })

  // Need at least 2 matched columns to consider it a valid table
  if (colToField.size + colToExtra.size < 2) return null

  // Parse data rows
  const dataRows = rows
    .slice(bestHeaderRow + 1)
    .filter(row => Array.isArray(row) && row.some(c => c != null && c !== ''))

  if (dataRows.length === 0) return null

  const parseDate = (v: any): Date | null => {
    if (v instanceof Date) return v
    if (typeof v === 'number' && v > 10000) return new Date(Date.UTC(1899, 11, 30) + v * 86400000)
    if (typeof v === 'string') { const d = new Date(v); return isNaN(d.getTime()) ? null : d }
    return null
  }

  // Sort by date desc if date column found
  const sortedRows = dateCol >= 0
    ? [...dataRows].sort((a, b) => {
        const da = parseDate(a[dateCol])
        const db = parseDate(b[dateCol])
        return da && db ? db.getTime() - da.getTime() : 0
      })
    : dataRows

  const latest = sortedRows[0]

  const getNum = (ci: number, row: any[] = latest): number | null => {
    if (ci < 0 || ci >= row.length) return null
    const v = row[ci]
    if (v == null) return null
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.-]/g, ''))
    return isNaN(n) ? null : n
  }

  const getStr = (ci: number, row: any[] = latest): string | null => {
    if (ci < 0 || ci >= row.length) return null
    const v = row[ci]
    return v != null ? String(v).trim() : null
  }

  // Build matches from latest row
  const matches: Record<string, any> = {}
  for (const [ci, key] of colToField.entries()) {
    const fd = FIELDS.find(f => f.key === key)!
    if (fd.type === 'string') {
      const s2 = getStr(ci)
      if (s2) matches[key] = s2
    } else {
      let n = getNum(ci)
      if (n != null) {
        if (fd.absValue) n = Math.abs(n)
        matches[key] = n
      }
    }
  }

  // Derive CFO from FCF + capex if not directly found
  if (!matches.cfo) {
    const fcfCi = [...colToPerField.entries()].find(([, k]) => k === 'ltm_fcf')?.[0]
    if (fcfCi != null && matches.capex != null) {
      const fcf = getNum(fcfCi)
      if (fcf != null) matches.cfo = Math.abs(fcf) + matches.capex
    }
  }

  // Derive fiscal year from date
  if (!matches.fiscal_year && dateCol >= 0) {
    const d = parseDate(latest[dateCol])
    if (d) matches.fiscal_year = d.getFullYear()
  }

  // Extra metrics from latest row
  const extraMetrics: Record<string, number> = {}
  for (const [ci, key] of colToExtra.entries()) {
    const n = getNum(ci)
    if (n != null) extraMetrics[key] = n
  }

  // Periodic rows (up to 20 most recent)
  const periodicRows: PeriodicRow[] = sortedRows.slice(0, 20).map(row => {
    const d = dateCol >= 0 ? parseDate(row[dateCol]) : null
    const getPerNum = (perKey: string): number | null => {
      // First try field column
      for (const [ci, k] of colToField.entries()) {
        if (k === (perKey === 'ltm_ebitda' ? 'ebitda' : perKey === 'ltm_rev' ? 'revenue' : '')) {
          return getNum(ci, row)
        }
      }
      // Then try periodic-specific column
      for (const [ci, k] of colToPerField.entries()) { if (k === perKey) return getNum(ci, row) }
      // Then try extra
      for (const [ci, k] of colToExtra.entries()) {
        if ((perKey === 'gross_total_leverage' && k === 'gross_total_leverage') ||
            (perKey === 'net_total_leverage' && k === 'net_total_leverage') ||
            (perKey === 'gross_1st_lien' && k === 'gross_1st_lien_leverage')) {
          return getNum(ci, row)
        }
      }
      return null
    }
    const getPerStr = (perKey: string): string | null => {
      for (const [ci, k] of colToPerField.entries()) {
        if (k === perKey) return getStr(ci, row)
      }
      return null
    }
    return {
      date: d ? d.toISOString().slice(0, 10) : null,
      ltm_ebitda: getPerNum('ltm_ebitda') ?? (colToField.has([...colToField.entries()].find(([, k]) => k === 'ebitda')?.[0] ?? -1) ? getNum([...colToField.entries()].find(([, k]) => k === 'ebitda')?.[0] ?? -1, row) : null),
      ltm_rev:    getPerNum('ltm_rev'),
      gross_total_leverage: getPerNum('gross_total_leverage'),
      net_total_leverage:   getPerNum('net_total_leverage'),
      gross_1st_lien:       getPerNum('gross_1st_lien'),
      ltm_fcf:              getPerNum('ltm_fcf'),
      performance:          getPerStr('performance'),
    }
  }).filter(r => r.date != null)

  return { matches, periodicRows, extraMetrics }
}

// ─── Simplified periodic row builder (cleaner version) ───────────────────────

function buildPeriodicRows(
  sortedRows: any[][],
  colToField: Map<number, string>,
  colToExtra: Map<number, string>,
  colToPerField: Map<number, string>,
  dateCol: number,
  getNum: (ci: number, row: any[]) => number | null,
  getStr: (ci: number, row: any[]) => string | null,
  parseDate: (v: any) => Date | null,
): PeriodicRow[] {
  const ebitdaCi = [...colToField.entries()].find(([, k]) => k === 'ebitda')?.[0] ?? -1
  const revCi    = [...colToField.entries()].find(([, k]) => k === 'revenue')?.[0] ?? -1

  const findPer = (row: any[], perKey: string): number | null => {
    for (const [ci, k] of colToPerField.entries()) { if (k === perKey) return getNum(ci, row) }
    for (const [ci, k] of colToExtra.entries()) {
      if ((perKey === 'gross_total_leverage' && k === 'gross_total_leverage') ||
          (perKey === 'net_total_leverage'   && k === 'net_total_leverage') ||
          (perKey === 'gross_1st_lien'       && k === 'gross_1st_lien_leverage')) {
        return getNum(ci, row)
      }
    }
    return null
  }

  return sortedRows.slice(0, 20).map(row => {
    const d = dateCol >= 0 ? parseDate(row[dateCol]) : null
    const perfCi = [...colToPerField.entries()].find(([, k]) => k === 'performance')?.[0] ?? -1
    return {
      date:  d ? d.toISOString().slice(0, 10) : null,
      ltm_ebitda: ebitdaCi >= 0 ? getNum(ebitdaCi, row) : null,
      ltm_rev:    revCi    >= 0 ? getNum(revCi,    row) : null,
      gross_total_leverage: findPer(row, 'gross_total_leverage'),
      net_total_leverage:   findPer(row, 'net_total_leverage'),
      gross_1st_lien:       findPer(row, 'gross_1st_lien'),
      ltm_fcf:              findPer(row, 'ltm_fcf'),
      performance: perfCi >= 0 ? getStr(perfCi, row) : null,
    }
  }).filter(r => r.date != null)
}

/**
 * Strategy B — Time-series: first col(s) = row labels, right columns = periods.
 * Looks for rows with years / "LTM" in headers, then extracts from the LTM (or latest) column.
 */
function tryTimeSeriesParse(rows: any[][]): Record<string, number> {
  // Find header row containing year numbers or "LTM"
  let ltmCol = -1
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i]
    if (!Array.isArray(row)) continue
    for (let j = 0; j < row.length; j++) {
      const v = row[j]
      if (v == null) continue
      const s = String(v).trim()
      if (s.toUpperCase() === 'LTM' || s.toUpperCase() === 'LTM ADJ' || s.toUpperCase() === 'LTM EBITDA') {
        ltmCol = j
        break
      }
    }
    if (ltmCol >= 0) break
  }
  if (ltmCol < 0) return {}

  const result: Record<string, number> = {}
  const SCORE_THRESHOLD = 55

  for (const row of rows) {
    if (!Array.isArray(row) || ltmCol >= row.length) continue
    const val = row[ltmCol]
    if (val == null || typeof val !== 'number') continue

    // Find label in first 3 cols
    for (let j = 0; j < Math.min(3, row.length); j++) {
      if (row[j] == null || typeof row[j] !== 'string') continue
      const label = String(row[j]).trim()
      if (!label) continue

      for (const fd of FIELDS) {
        if (fd.type !== 'number') continue
        if (score(label, fd.keywords) >= SCORE_THRESHOLD && !(fd.key in result)) {
          result[fd.key] = fd.absValue ? Math.abs(val) : val
        }
      }
      break
    }
  }

  return result
}

/**
 * Strategy C — KV scan: any row with (string label, numeric value) pairs.
 * Classic row-by-row format.
 */
function tryKVScan(rows: any[][]): { matches: Record<string, any>; unmatched: { label: string; value: any }[] } {
  const matches: Record<string, any> = {}
  const unmatched: { label: string; value: any }[] = []
  const SCORE_THRESHOLD = 60

  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 2) continue
    const labelCell = row.find(c => c != null && typeof c === 'string' && String(c).trim().length > 1)
    if (!labelCell) continue
    const idx = row.indexOf(labelCell)
    const candidates = row.slice(idx + 1).filter(c => c != null)
    if (!candidates.length) continue
    const value = candidates.find(c => typeof c === 'number') ?? candidates[0]
    const label = String(labelCell).trim()

    let bestScore = 0, bestField: FieldDef | null = null
    for (const fd of FIELDS) {
      const s2 = score(label, fd.keywords)
      if (s2 > bestScore) { bestScore = s2; bestField = fd }
    }

    if (bestField && bestScore >= SCORE_THRESHOLD && !(bestField.key in matches)) {
      if (bestField.type === 'number') {
        const n = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, ''))
        if (!isNaN(n)) matches[bestField.key] = bestField.absValue ? Math.abs(n) : n
      } else {
        matches[bestField.key] = String(value).trim()
      }
    } else if (!bestField || bestScore < SCORE_THRESHOLD) {
      unmatched.push({ label, value })
    }
  }

  return { matches, unmatched }
}

// ─── Master workbook parser ───────────────────────────────────────────────────

interface ParseResult {
  matches: Record<string, any>
  unmatched: { label: string; value: any }[]
  sheetCount: number
  periodicRows?: PeriodicRow[]
  extraMetrics?: Record<string, number>
  detectedReporting: boolean
}

function parseWorkbook(wb: XLSX.WorkBook): ParseResult {
  const allMatches: Record<string, any> = {}
  const allUnmatched: { label: string; value: any }[] = []
  let periodicRows: PeriodicRow[] | undefined
  let extraMetrics: Record<string, number> | undefined
  let detectedReporting = false

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: null })

    // 1. Try tabular (monitoring/reporting style)
    const tabResult = tryTabularParse(rows)
    if (tabResult && Object.keys(tabResult.matches).length >= 3) {
      for (const [k, v] of Object.entries(tabResult.matches)) {
        if (!(k in allMatches)) allMatches[k] = v
      }
      if (tabResult.periodicRows.length > 0 && !periodicRows) {
        periodicRows = tabResult.periodicRows
        detectedReporting = true
      }
      if (Object.keys(tabResult.extraMetrics).length > 0 && !extraMetrics) {
        extraMetrics = tabResult.extraMetrics
      }
      continue
    }

    // 2. Try time-series (Financials-style: row labels + LTM column)
    const tsResult = tryTimeSeriesParse(rows)
    for (const [k, v] of Object.entries(tsResult)) {
      if (!(k in allMatches)) allMatches[k] = v
    }

    // 3. KV scan as fallback
    const { matches: kvMatches, unmatched } = tryKVScan(rows)
    for (const [k, v] of Object.entries(kvMatches)) {
      if (!(k in allMatches)) allMatches[k] = v
    }
    allUnmatched.push(...unmatched)
  }

  // Post-processing: derive CFO from FCF if absent
  if (!allMatches.cfo && allMatches.capex != null) {
    // nothing — FCF derivation handled inside tabular parser
  }

  return {
    matches: allMatches,
    unmatched: allUnmatched.slice(0, 50),
    sheetCount: wb.SheetNames.length,
    periodicRows,
    extraMetrics,
    detectedReporting,
  }
}

// ─── CSV template download ────────────────────────────────────────────────────

function generateTemplate(): string {
  const rows: string[] = ['Label,Value,Notes']
  const grouped: Record<string, FieldDef[]> = {}
  FIELDS.forEach(f => {
    if (!grouped[f.group]) grouped[f.group] = []
    grouped[f.group].push(f)
  })
  Object.entries(grouped).forEach(([group, items]) => {
    rows.push(`# ${group},,`)
    items.forEach(item => {
      const label = item.keywords[0].replace(/\b\w/g, c => c.toUpperCase())
      rows.push(`${label},${item.type === 'number' ? '0' : ''},`)
    })
    rows.push(',,')
  })
  return rows.join('\n')
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmtX = (v: number | null | undefined) => v == null ? '—' : `${v.toFixed(2)}x`
const fmtM = (v: number | null | undefined) => {
  if (v == null) return '—'
  return Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}B` : `${v.toFixed(0)}M`
}
const levColor = (v: number | null) =>
  v == null ? 'text-muted/30' : v > 6 ? 'text-red-400' : v > 5 ? 'text-amber-400' : v > 4 ? 'text-yellow-400' : 'text-emerald-400'
const perfColor = (p: string | null): string => {
  if (!p) return 'text-muted/30'
  const l = p.toLowerCase()
  return l.includes('exceed') ? 'text-emerald-400'
    : (l.includes('watch') || l.includes('under') || l.includes('concern')) ? 'text-amber-400'
    : l.includes('breach') || l.includes('default') ? 'text-red-400'
    : 'text-slate-300'
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export interface ExcelImportModalProps {
  open: boolean
  onClose: () => void
  onImport: (data: Record<string, any>, extras?: ImportExtras) => void
}

export default function ExcelImportModal({ open, onClose, onImport }: ExcelImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parsed, setParsed] = useState<(ParseResult & { fileName: string }) | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [showHistory, setShowHistory] = useState(true)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array', cellDates: true })
      const result = parseWorkbook(wb)
      setParsed({ ...result, fileName: file.name })
      setShowHistory(result.detectedReporting)
    } catch (e: any) {
      setError(e.message || 'Failed to parse file')
    }
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleApply = () => {
    if (!parsed) return
    onImport(parsed.matches, { periodicRows: parsed.periodicRows, extraMetrics: parsed.extraMetrics })
    setParsed(null)
    onClose()
  }

  const handleTemplate = () => {
    const blob = new Blob([generateTemplate()], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), { href: url, download: 'tga-credit-template.csv' }).click()
    URL.revokeObjectURL(url)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border-strong rounded-md w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-soft">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-100">Import from Excel / CSV</h2>
            {parsed?.detectedReporting && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-950/40 border border-emerald-700/40 text-emerald-300 rounded">
                Periodic monitoring table detected
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-muted hover:text-slate-200"><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {!parsed && (
            <div>
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-md p-10 text-center cursor-pointer transition ${
                  dragOver ? 'border-emerald-500 bg-emerald-950/30' : 'border-border-strong hover:border-emerald-700/50 hover:bg-emerald-950/10'
                }`}
              >
                <Upload size={28} className="text-emerald-400 mx-auto mb-3" />
                <p className="text-sm text-slate-100 mb-1 font-medium">Drop your Excel file here or click to browse</p>
                <p className="text-[11px] text-muted">.xlsx · .xlsm · .xls · .csv — any layout, any language</p>
              </div>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xlsm,.xls,.csv" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />

              <div className="mt-4 p-3 bg-background/50 border border-border rounded-md space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle size={12} className="text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-[11px] text-slate-300 space-y-1">
                    <p><strong className="text-slate-100">Three parsing strategies, applied in order:</strong></p>
                    <p className="text-muted/70">① <span className="text-emerald-300">Tabular</span> — sheet with a header row + data rows (monitoring / reporting format). Extracts the most recent row + full history. Works with any column labels EN/FR.</p>
                    <p className="text-muted/70">② <span className="text-slate-300">Time-series</span> — sheet with row labels and a column labelled "LTM" (or variant). Extracts LTM values for each metric.</p>
                    <p className="text-muted/70">③ <span className="text-muted/60">KV scan</span> — any file with (label, value) pairs row by row. Fallback for custom formats.</p>
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); handleTemplate() }}
                  className="text-[11px] text-emerald-300 hover:bg-emerald-950/30 border border-emerald-700/40 px-2 py-1 rounded transition flex items-center gap-1.5 mt-1">
                  <Download size={11} /> Download CSV template
                </button>
              </div>

              {error && (
                <div className="mt-3 p-2 bg-rose-950/30 border border-rose-700/50 rounded text-[11px] text-rose-300">{error}</div>
              )}
            </div>
          )}

          {parsed && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-slate-200 font-medium">{parsed.fileName}</span>
                <span className="text-muted">— {parsed.sheetCount} sheet(s) · {Object.keys(parsed.matches).length} fields</span>
              </div>

              {/* Matched fields */}
              <div className="border border-emerald-700/40 bg-emerald-950/10 rounded-lg p-3">
                <h3 className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider mb-2">
                  Fields mapped to form ({Object.keys(parsed.matches).length})
                </h3>
                {Object.keys(parsed.matches).length === 0 ? (
                  <p className="text-[11px] text-muted italic">No fields matched — try the CSV template.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] max-h-44 overflow-y-auto">
                    {Object.entries(parsed.matches).filter(([k]) => k !== 'da').map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-2">
                        <span className="text-muted/60 truncate">{k}</span>
                        <span className="font-mono text-slate-200">{typeof v === 'number' ? v.toLocaleString() : String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Extra metrics */}
              {parsed.extraMetrics && Object.keys(parsed.extraMetrics).length > 0 && (
                <div className="border border-blue-700/30 bg-blue-950/10 rounded-lg p-3">
                  <h3 className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider mb-2">
                    Reported leverage metrics (reference only)
                  </h3>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-mono">
                    {parsed.extraMetrics.gross_1st_lien_leverage != null && (
                      <span className="text-muted/50">Gross 1L <span className="text-slate-200">{fmtX(parsed.extraMetrics.gross_1st_lien_leverage)}</span></span>
                    )}
                    {parsed.extraMetrics.gross_total_leverage != null && (
                      <span className="text-muted/50">Gross Total <span className={levColor(parsed.extraMetrics.gross_total_leverage)}>{fmtX(parsed.extraMetrics.gross_total_leverage)}</span></span>
                    )}
                    {parsed.extraMetrics.net_total_leverage != null && (
                      <span className="text-muted/50">Net Total <span className={levColor(parsed.extraMetrics.net_total_leverage)}>{fmtX(parsed.extraMetrics.net_total_leverage)}</span></span>
                    )}
                    {parsed.extraMetrics.last_fy_ebitda != null && (
                      <span className="text-muted/50">Last FY EBITDA <span className="text-slate-200">{fmtM(parsed.extraMetrics.last_fy_ebitda)}</span></span>
                    )}
                  </div>
                </div>
              )}

              {/* Monitoring history */}
              {parsed.periodicRows && parsed.periodicRows.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-muted/50 uppercase tracking-wider hover:bg-surface/40 transition"
                    onClick={() => setShowHistory(h => !h)}
                  >
                    <span>Monitoring history — {parsed.periodicRows!.length} periods</span>
                    <span className="text-[10px] normal-case tracking-normal">{showHistory ? 'collapse' : 'expand'}</span>
                  </button>
                  {showHistory && (
                    <div className="overflow-x-auto max-h-52 overflow-y-auto">
                      <table className="w-full text-[10px] font-mono">
                        <thead className="bg-black/30 border-b border-border sticky top-0">
                          <tr>
                            {['Date', 'LTM Rev', 'LTM EBITDA', 'Gross Lev.', 'Net Lev.', 'LTM FCF', 'Performance'].map(h => (
                              <th key={h} className={`py-1.5 text-muted/50 font-medium ${h === 'Date' ? 'text-left px-3' : 'text-right px-2'}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {parsed.periodicRows!.map((row, i) => {
                            const prev = parsed.periodicRows![i + 1]
                            return (
                              <tr key={i} className={`border-b border-border/20 ${i === 0 ? 'bg-emerald-950/10' : ''}`}>
                                <td className="px-3 py-1.5 text-slate-300">{row.date?.slice(0, 10) ?? '—'}</td>
                                <td className="px-2 py-1.5 text-right text-muted/50">{fmtM(row.ltm_rev)}</td>
                                <td className="px-2 py-1.5 text-right">
                                  <span className="text-slate-300">{fmtM(row.ltm_ebitda)}</span>
                                  {prev?.ltm_ebitda != null && row.ltm_ebitda != null && (
                                    row.ltm_ebitda > prev.ltm_ebitda
                                      ? <TrendingUp size={9} className="inline ml-1 text-emerald-400" />
                                      : row.ltm_ebitda < prev.ltm_ebitda
                                      ? <TrendingDown size={9} className="inline ml-1 text-red-400" />
                                      : null
                                  )}
                                </td>
                                <td className={`px-2 py-1.5 text-right ${levColor(row.gross_total_leverage)}`}>
                                  {row.gross_total_leverage != null ? `${row.gross_total_leverage.toFixed(2)}x` : '—'}
                                </td>
                                <td className={`px-2 py-1.5 text-right ${levColor(row.net_total_leverage)}`}>
                                  {row.net_total_leverage != null ? `${row.net_total_leverage.toFixed(2)}x` : '—'}
                                  {prev?.net_total_leverage != null && row.net_total_leverage != null && (
                                    row.net_total_leverage < prev.net_total_leverage
                                      ? <TrendingDown size={9} className="inline ml-1 text-emerald-400" />
                                      : row.net_total_leverage > prev.net_total_leverage
                                      ? <TrendingUp size={9} className="inline ml-1 text-red-400" />
                                      : null
                                  )}
                                </td>
                                <td className="px-2 py-1.5 text-right text-muted/50">{fmtM(row.ltm_fcf)}</td>
                                <td className={`px-3 py-1.5 text-right ${perfColor(row.performance)}`}>{row.performance ?? '—'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Unmatched */}
              {parsed.unmatched.length > 0 && (
                <details className="border border-border rounded-lg p-3">
                  <summary className="text-[11px] text-muted/40 cursor-pointer">
                    Unmatched rows ({parsed.unmatched.length})
                  </summary>
                  <div className="mt-2 max-h-36 overflow-y-auto text-[10px] font-mono text-muted/50 space-y-0.5">
                    {parsed.unmatched.map((u, i) => (
                      <div key={i} className="truncate"><span className="text-gray-400">{u.label}</span>: {String(u.value)}</div>
                    ))}
                  </div>
                </details>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setParsed(null)}
                  className="text-[11px] text-muted hover:text-slate-200 border border-border px-3 py-1.5 rounded transition">
                  Choose different file
                </button>
                <button onClick={handleApply} disabled={Object.keys(parsed.matches).length === 0}
                  className="ml-auto text-[11px] text-emerald-300 border border-emerald-700/50 hover:bg-emerald-950/30 disabled:opacity-30 px-4 py-1.5 rounded transition flex items-center gap-1.5">
                  <CheckCircle2 size={11} />
                  Apply {Object.keys(parsed.matches).length} fields to form
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
