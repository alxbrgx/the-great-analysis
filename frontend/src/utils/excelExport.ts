import * as XLSX from 'xlsx'

interface OptimizationResult {
  weights: Record<string, number>
  expected_return?: number
  volatility?: number
  sharpe?: number
  method?: string
}

interface RiskMetrics {
  [ticker: string]: {
    ann_return?: number
    ann_volatility?: number
    sharpe?: number
    max_drawdown?: number
    var_95?: number
  }
}

interface FrontierPoint {
  volatility: number
  return: number
  sharpe: number
}

export function exportPortfolioToExcel(params: {
  tickers: string[]
  budget: number
  markowitz?: OptimizationResult
  hrp?: OptimizationResult
  riskMetrics?: RiskMetrics
  frontier?: FrontierPoint[]
  history?: { dates: string[]; tickers: Record<string, number[]>; spy_benchmark?: number[] }
}) {
  const { tickers, budget, markowitz, hrp, riskMetrics, frontier, history } = params
  const wb = XLSX.utils.book_new()

  // ── Sheet 1: Portfolio Summary ─────────────────────────────────────────────
  const summaryData: any[][] = [
    ['The Great Analysis — Portfolio Export'],
    ['Generated', new Date().toLocaleString()],
    ['Tickers', tickers.join(', ')],
    ['Budget', `$${budget.toLocaleString()}`],
    [],
    ['METHOD', 'Expected Return', 'Volatility', 'Sharpe Ratio'],
  ]

  if (markowitz) {
    summaryData.push([
      'Markowitz Max Sharpe',
      markowitz.expected_return != null ? `${(markowitz.expected_return * 100).toFixed(2)}%` : '—',
      markowitz.volatility != null ? `${(markowitz.volatility * 100).toFixed(2)}%` : '—',
      markowitz.sharpe != null ? markowitz.sharpe.toFixed(3) : '—',
    ])
  }
  if (hrp) {
    summaryData.push([
      'Hierarchical Risk Parity',
      hrp.expected_return != null ? `${(hrp.expected_return * 100).toFixed(2)}%` : '—',
      hrp.volatility != null ? `${(hrp.volatility * 100).toFixed(2)}%` : '—',
      hrp.sharpe != null ? hrp.sharpe.toFixed(3) : '—',
    ])
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  // ── Sheet 2: Weights ───────────────────────────────────────────────────────
  const weightsData: any[][] = [['Ticker', 'Markowitz Weight', 'Markowitz Allocation ($)', 'HRP Weight', 'HRP Allocation ($)']]
  tickers.forEach(t => {
    const mw = markowitz?.weights?.[t] ?? null
    const hw = hrp?.weights?.[t] ?? null
    weightsData.push([
      t,
      mw != null ? `${(mw * 100).toFixed(2)}%` : '—',
      mw != null ? `$${(mw * budget).toFixed(2)}` : '—',
      hw != null ? `${(hw * 100).toFixed(2)}%` : '—',
      hw != null ? `$${(hw * budget).toFixed(2)}` : '—',
    ])
  })
  const wsWeights = XLSX.utils.aoa_to_sheet(weightsData)
  wsWeights['!cols'] = [{ wch: 10 }, { wch: 20 }, { wch: 24 }, { wch: 16 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, wsWeights, 'Weights')

  // ── Sheet 3: Risk Metrics ─────────────────────────────────────────────────
  if (riskMetrics) {
    const riskData: any[][] = [['Ticker', 'Ann. Return', 'Ann. Volatility', 'Sharpe Ratio', 'Max Drawdown', 'VaR 95%']]
    Object.entries(riskMetrics).forEach(([t, m]) => {
      riskData.push([
        t,
        m.ann_return != null ? `${(m.ann_return * 100).toFixed(2)}%` : '—',
        m.ann_volatility != null ? `${(m.ann_volatility * 100).toFixed(2)}%` : '—',
        m.sharpe != null ? m.sharpe.toFixed(3) : '—',
        m.max_drawdown != null ? `${(m.max_drawdown * 100).toFixed(2)}%` : '—',
        m.var_95 != null ? `${(m.var_95 * 100).toFixed(2)}%` : '—',
      ])
    })
    const wsRisk = XLSX.utils.aoa_to_sheet(riskData)
    wsRisk['!cols'] = Array(6).fill({ wch: 18 })
    XLSX.utils.book_append_sheet(wb, wsRisk, 'Risk Metrics')
  }

  // ── Sheet 4: Efficient Frontier ────────────────────────────────────────────
  if (frontier?.length) {
    const frontierData: any[][] = [['Volatility', 'Expected Return', 'Sharpe Ratio']]
    frontier.forEach(p => {
      frontierData.push([
        `${(p.volatility * 100).toFixed(3)}%`,
        `${(p.return * 100).toFixed(3)}%`,
        p.sharpe.toFixed(4),
      ])
    })
    const wsFrontier = XLSX.utils.aoa_to_sheet(frontierData)
    wsFrontier['!cols'] = Array(3).fill({ wch: 20 })
    XLSX.utils.book_append_sheet(wb, wsFrontier, 'Efficient Frontier')
  }

  // ── Sheet 5: Historical Returns ────────────────────────────────────────────
  if (history?.dates?.length) {
    const headers = ['Date', ...Object.keys(history.tickers)]
    if (history.spy_benchmark) headers.push('SPY Benchmark')
    const histData: any[][] = [headers]
    history.dates.forEach((date, i) => {
      const row: any[] = [date]
      Object.values(history.tickers).forEach(series => {
        const v = series[i]
        row.push(v != null ? `${((v - 1) * 100).toFixed(3)}%` : '—')
      })
      if (history.spy_benchmark) {
        const v = history.spy_benchmark[i]
        row.push(v != null ? `${((v - 1) * 100).toFixed(3)}%` : '—')
      }
      histData.push(row)
    })
    const wsHistory = XLSX.utils.aoa_to_sheet(histData)
    wsHistory['!cols'] = Array(headers.length).fill({ wch: 14 })
    XLSX.utils.book_append_sheet(wb, wsHistory, 'Historical Returns')
  }

  // ── Write file ────────────────────────────────────────────────────────────
  const date = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `TGA_Portfolio_${tickers.join('-')}_${date}.xlsx`)
}
