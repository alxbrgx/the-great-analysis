import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Shared Styling ────────────────────────────────────────────────────────────

const COLORS = {
  black:      [10,  10,  10]  as [number, number, number],
  dark:       [22,  22,  22]  as [number, number, number],
  gray900:    [30,  30,  30]  as [number, number, number],
  gray700:    [55,  65,  81]  as [number, number, number],
  gray500:    [107, 114, 128] as [number, number, number],
  gray300:    [209, 213, 219] as [number, number, number],
  white:      [255, 255, 255] as [number, number, number],
  accent:     [16,  185, 129] as [number, number, number],
  accentDim:  [5,   150, 105] as [number, number, number],
  green:      [52,  211, 153] as [number, number, number],
  red:        [239, 68,  68]  as [number, number, number],
  yellow:     [245, 158, 11]  as [number, number, number],
  blue:       [96,  165, 250] as [number, number, number],
}

const RATING_COLORS: Record<string, [number, number, number]> = {
  'Strong Buy':  COLORS.green,
  'Buy':         COLORS.accent,
  'Hold':        COLORS.yellow,
  'Sell':        [251, 146, 60],
  'Strong Sell': COLORS.red,
}

function darkDoc(orientation: 'p' | 'l' = 'p') {
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' })
  // Background
  doc.setFillColor(...COLORS.black)
  doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, 'F')
  return doc
}

function header(doc: jsPDF, title: string, ticker: string, subtitle: string, date: string) {
  const W = doc.internal.pageSize.width
  // Top accent bar
  doc.setFillColor(...COLORS.accent)
  doc.rect(0, 0, W, 1.2, 'F')
  // TGA label
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...COLORS.accent)
  doc.text('THE GREAT ANALYSIS', 14, 10)
  // Date
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...COLORS.gray500)
  doc.text(date, W - 14, 10, { align: 'right' })
  // Ticker + title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...COLORS.white)
  doc.text(ticker, 14, 22)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...COLORS.gray300)
  doc.text(title, 14, 30)
  // Subtitle
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.gray500)
  doc.text(subtitle, 14, 36)
  // Separator line
  doc.setDrawColor(...COLORS.gray700)
  doc.setLineWidth(0.3)
  doc.line(14, 40, W - 14, 40)
  return 46 // next Y position
}

function footer(doc: jsPDF) {
  const W = doc.internal.pageSize.width
  const H = doc.internal.pageSize.height
  doc.setFillColor(...COLORS.gray900)
  doc.rect(0, H - 10, W, 10, 'F')
  doc.setFontSize(6.5)
  doc.setTextColor(...COLORS.gray500)
  doc.text('For informational purposes only — not financial advice. Data: yfinance · FMP · SEC EDGAR · FRED', 14, H - 4.5)
  doc.text('The Great Analysis — tga.finance', W - 14, H - 4.5, { align: 'right' })
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.accent)
  doc.text(text.toUpperCase(), 14, y)
  doc.setDrawColor(...COLORS.accentDim)
  doc.setLineWidth(0.2)
  doc.line(14, y + 1.5, 55, y + 1.5)
  return y + 6
}

function ratingBadge(doc: jsPDF, rating: string, x: number, y: number) {
  const color = RATING_COLORS[rating] || COLORS.gray300
  doc.setFillColor(...color)
  doc.roundedRect(x, y - 4.5, 26, 6, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...COLORS.black)
  doc.text(rating.toUpperCase(), x + 13, y - 0.5, { align: 'center' })
}

// ── One-Pager ─────────────────────────────────────────────────────────────────

export function generateOnePager(ticker: string, overview: any, data: any): void {
  const doc = darkDoc()
  const W = doc.internal.pageSize.width
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  let y = header(doc, overview?.name || ticker, ticker, `${overview?.sector || ''} · ${overview?.industry || ''}`, date)

  // Rating badge top-right
  if (data?.rating) ratingBadge(doc, data.rating, W - 44, 28)

  // Score
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...COLORS.gray500)
  doc.text(`Composite score: ${data?.final_score?.toFixed(2) ?? '—'} / 1.00`, W - 14, 36, { align: 'right' })

  // Key financials
  y = sectionTitle(doc, 'Key Financials', y)
  const ratios: [string, string][] = [
    ['Market Cap', overview?.market_cap ? `$${(overview.market_cap / 1e9).toFixed(1)}B` : '—'],
    ['Current Price', overview?.current_price ? `$${overview.current_price.toLocaleString()}` : '—'],
    ['Sector', overview?.sector || '—'],
    ['Country', overview?.country || '—'],
  ]
  const step6 = data?.steps?.step_6?.data || {}
  const step8 = data?.steps?.step_8?.data || {}
  const step10 = data?.steps?.step_10?.data || {}
  const moreRatios: [string, string][] = [
    ['Revenue', step6.latest_revenue || '—'],
    ['EBITDA', step6.latest_ebitda || '—'],
    ['Gross Margin', step6.margins?.gross_margin || '—'],
    ['EBITDA Margin', step6.margins?.ebitda_margin || '—'],
    ['Operating Margin', step6.margins?.operating_margin || '—'],
    ['Net Margin', step6.margins?.net_margin || '—'],
    ['Net Debt/EBITDA', step8.net_debt_ebitda != null ? `${step8.net_debt_ebitda}x` : '—'],
    ['Current Ratio', step8.current_ratio != null ? String(step8.current_ratio) : '—'],
    ['ROE', step8.roe || '—'],
    ['P/E (trailing)', step10.trailing_pe != null ? `${Number(step10.trailing_pe).toFixed(1)}x` : '—'],
    ['Forward P/E', step10.forward_pe != null ? `${Number(step10.forward_pe).toFixed(1)}x` : '—'],
    ['EV/EBITDA', step10.ev_ebitda != null ? `${Number(step10.ev_ebitda).toFixed(1)}x` : '—'],
  ]
  const allRatios = [...ratios, ...moreRatios]
  // 2-column layout
  const col1 = allRatios.filter((_, i) => i % 2 === 0)
  const col2 = allRatios.filter((_, i) => i % 2 === 1)
  const colW = (W - 28) / 2
  let yr = y
  col1.forEach(([k, v], i) => {
    const rowY = yr + i * 6.5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...COLORS.gray500)
    doc.text(k, 14, rowY)
    doc.setTextColor(...COLORS.gray300)
    doc.setFont('helvetica', 'bold')
    doc.text(v, 14 + colW * 0.5, rowY, { align: 'right' })
  })
  col2.forEach(([k, v], i) => {
    const rowY = yr + i * 6.5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...COLORS.gray500)
    doc.text(k, 14 + colW + 4, rowY)
    doc.setTextColor(...COLORS.gray300)
    doc.setFont('helvetica', 'bold')
    doc.text(v, 14 + colW * 2 + 4 * 0.5, rowY, { align: 'right' })
  })
  y = yr + col1.length * 6.5 + 6

  // Step scores table
  y = sectionTitle(doc, '12-Step Scores', y)
  const scoreRows = Object.entries(data?.steps || {}).map(([, s]: [string, any]) => [
    `${s.step}. ${s.title}`,
    s.score > 0 ? `+${s.score?.toFixed(2)}` : s.score?.toFixed(2) ?? '—',
  ])
  autoTable(doc, {
    startY: y,
    head: [['Step', 'Score']],
    body: scoreRows,
    theme: 'plain',
    styles: { fontSize: 7, textColor: COLORS.gray300, fillColor: COLORS.dark, cellPadding: 1.5 },
    headStyles: { fillColor: COLORS.gray900, textColor: COLORS.gray500, fontSize: 6.5 },
    columnStyles: { 0: { cellWidth: 110 }, 1: { cellWidth: 20, halign: 'right' } },
    margin: { left: 14, right: 14 },
    alternateRowStyles: { fillColor: [18, 18, 18] },
  })
  y = (doc as any).lastAutoTable.finalY + 8

  // Summary
  if (data?.recommendation_summary) {
    y = sectionTitle(doc, 'Investment Summary', y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...COLORS.gray300)
    const lines = doc.splitTextToSize(data.recommendation_summary, W - 28) as string[]
    doc.text(lines, 14, y)
    y += lines.length * 4.5 + 4
  }

  // Company description
  if (overview?.description) {
    y = sectionTitle(doc, 'Business Overview', y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.gray500)
    const lines = doc.splitTextToSize(overview.description.slice(0, 600), W - 28) as string[]
    doc.text(lines, 14, y)
  }

  footer(doc)
  doc.save(`TGA_${ticker}_OnePager_${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ── Investment Memo ───────────────────────────────────────────────────────────

export function generateMemo(ticker: string, overview: any, data: any): void {
  const doc = darkDoc()
  const W = doc.internal.pageSize.width
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  let y = header(doc, 'Investment Memo', ticker, `${overview?.name || ''} · ${overview?.sector || ''}`, date)

  if (data?.rating) ratingBadge(doc, data.rating, W - 44, 28)

  // Memo header block
  const memoHeader: [string, string][] = [
    ['TO:', 'Investment Committee'],
    ['FROM:', 'The Great Analysis'],
    ['DATE:', date],
    ['SUBJECT:', `Investment Memo — ${overview?.name || ticker} (${ticker})`],
    ['RECOMMENDATION:', data?.rating?.toUpperCase() || '—'],
  ]
  autoTable(doc, {
    startY: y,
    body: memoHeader,
    theme: 'plain',
    styles: { fontSize: 8, textColor: COLORS.gray300, fillColor: COLORS.dark, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 38, textColor: COLORS.gray500, fontStyle: 'bold', fontSize: 7 },
      1: { cellWidth: 130 },
    },
    margin: { left: 14, right: 14 },
  })
  y = (doc as any).lastAutoTable.finalY + 8

  // Executive summary
  if (data?.recommendation_summary) {
    y = sectionTitle(doc, 'Executive Summary', y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.gray300)
    const lines = doc.splitTextToSize(data.recommendation_summary, W - 28) as string[]
    doc.text(lines, 14, y)
    y += lines.length * 4.5 + 8
  }

  // Key steps as bullet points
  y = sectionTitle(doc, 'Analysis Highlights', y)
  const steps = Object.values(data?.steps || {}).slice(0, 12) as any[]
  steps.forEach((s: any) => {
    if (!s.conclusion) return
    const scoreStr = s.score > 0 ? `[+${s.score.toFixed(2)}]` : s.score < 0 ? `[${s.score.toFixed(2)}]` : '[0.00]'
    const color = s.score > 0.2 ? COLORS.green : s.score < -0.2 ? COLORS.red : COLORS.gray500
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...COLORS.gray300)
    doc.text(`${s.step}. ${s.title}`, 14, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...color)
    doc.text(scoreStr, W - 14, y, { align: 'right' })
    y += 4.5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.gray500)
    const lines = doc.splitTextToSize(s.conclusion?.slice(0, 200) || '', W - 24) as string[]
    doc.text(lines, 18, y)
    y += lines.length * 3.8 + 3
    if (y > 270) {
      doc.addPage()
      doc.setFillColor(...COLORS.black)
      doc.rect(0, 0, W, doc.internal.pageSize.height, 'F')
      y = 16
    }
  })

  footer(doc)
  doc.save(`TGA_${ticker}_Memo_${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ── Quarterly Earnings Summary ────────────────────────────────────────────────

export function generateEarningsSummary(ticker: string, overview: any, data: any): void {
  const doc = darkDoc()
  const W = doc.internal.pageSize.width
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  let y = header(doc, 'Earnings Summary', ticker, overview?.name || '', date)

  if (data?.rating) ratingBadge(doc, data.rating, W - 44, 28)

  const step6 = data?.steps?.step_6?.data || {}
  const step7 = data?.steps?.step_7?.data || {}
  const step9 = data?.steps?.step_9?.data || {}

  // Revenue & EBITDA history table
  const revHistory = step6.revenue_history || {}
  const ebitdaHistory = step6.ebitda_history || {}
  const years = Object.keys(revHistory).sort()

  if (years.length > 0) {
    y = sectionTitle(doc, 'Revenue & EBITDA History ($B)', y)
    autoTable(doc, {
      startY: y,
      head: [['Year', 'Revenue', 'EBITDA', 'EBITDA Margin', 'Net Income']],
      body: years.map(yr => {
        const rev = revHistory[yr]
        const ebitda = ebitdaHistory[yr]
        const ni = (step6.net_income_history || {})[yr]
        const margin = rev && ebitda ? `${((ebitda / rev) * 100).toFixed(1)}%` : '—'
        return [
          yr,
          rev ? `$${(rev / 1e9).toFixed(1)}B` : '—',
          ebitda ? `$${(ebitda / 1e9).toFixed(1)}B` : '—',
          margin,
          ni ? `$${(ni / 1e9).toFixed(1)}B` : '—',
        ]
      }),
      theme: 'plain',
      styles: { fontSize: 7.5, textColor: COLORS.gray300, fillColor: COLORS.dark, cellPadding: 2, halign: 'right' },
      headStyles: { fillColor: COLORS.gray900, textColor: COLORS.gray500, fontSize: 7, halign: 'right' },
      columnStyles: { 0: { halign: 'left' } },
      margin: { left: 14, right: 14 },
      alternateRowStyles: { fillColor: [18, 18, 18] },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // Margin summary
  y = sectionTitle(doc, 'Current Margins', y)
  const margins = step6.margins || {}
  const marginRows = Object.entries(margins).map(([k, v]) => [k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), String(v)])
  autoTable(doc, {
    startY: y,
    body: marginRows,
    theme: 'plain',
    styles: { fontSize: 7.5, textColor: COLORS.gray300, fillColor: COLORS.dark, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 60, textColor: COLORS.gray500 }, 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  })
  y = (doc as any).lastAutoTable.finalY + 8

  // Cash flows
  y = sectionTitle(doc, 'Free Cash Flow', y)
  const fcfHistory = step7.fcf_history || {}
  const fcfYears = Object.keys(fcfHistory).sort()
  if (fcfYears.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Year', 'Operating CF', 'CAPEX', 'FCF']],
      body: fcfYears.map(yr => {
        const ocf = (step7.operating_cf_history || {})[yr]
        const capex = (step7.capex_history || {})[yr]
        const fcf = fcfHistory[yr]
        const fmt = (v: number | undefined) => v != null ? `$${(v / 1e9).toFixed(1)}B` : '—'
        return [yr, fmt(ocf), fmt(capex), fmt(fcf)]
      }),
      theme: 'plain',
      styles: { fontSize: 7.5, textColor: COLORS.gray300, fillColor: COLORS.dark, cellPadding: 2, halign: 'right' },
      headStyles: { fillColor: COLORS.gray900, textColor: COLORS.gray500, fontSize: 7, halign: 'right' },
      columnStyles: { 0: { halign: 'left' } },
      margin: { left: 14, right: 14 },
      alternateRowStyles: { fillColor: [18, 18, 18] },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // Estimates & valuation
  y = sectionTitle(doc, 'Estimates & Consensus', y)
  const estRows: [string, string][] = [
    ['Current Price', step9.current_price ? `$${Number(step9.current_price).toFixed(2)}` : '—'],
    ['Analyst Target', step9.analyst_target_price ? `$${Number(step9.analyst_target_price).toFixed(2)}` : '—'],
    ['Implied Upside', step9.implied_upside || '—'],
    ['Trailing P/E', step9.trailing_pe != null ? `${Number(step9.trailing_pe).toFixed(1)}x` : '—'],
    ['Forward P/E', step9.forward_pe != null ? `${Number(step9.forward_pe).toFixed(1)}x` : '—'],
    ['PEG Ratio', step9.peg_ratio != null ? String(step9.peg_ratio) : '—'],
    ['EPS Growth YoY', step9.earnings_growth_yoy || '—'],
    ['Revenue Growth YoY', step9.revenue_growth_yoy || '—'],
  ]
  autoTable(doc, {
    startY: y,
    body: estRows,
    theme: 'plain',
    styles: { fontSize: 7.5, textColor: COLORS.gray300, fillColor: COLORS.dark, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 60, textColor: COLORS.gray500 }, 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
    alternateRowStyles: { fillColor: [18, 18, 18] },
  })

  footer(doc)
  doc.save(`TGA_${ticker}_Earnings_${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ── Investor Relations Summary ────────────────────────────────────────────────

export function generateIRSummary(ticker: string, overview: any, data: any): void {
  const doc = darkDoc()
  const W = doc.internal.pageSize.width
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  let y = header(doc, 'Investor Relations Summary', ticker, overview?.name || '', date)

  if (data?.rating) ratingBadge(doc, data.rating, W - 44, 28)

  // Company profile
  y = sectionTitle(doc, 'Company Profile', y)
  if (overview?.description) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...COLORS.gray300)
    const lines = doc.splitTextToSize(overview.description.slice(0, 800), W - 28) as string[]
    doc.text(lines, 14, y)
    y += lines.length * 4 + 8
  }

  // Full 12-step table
  y = sectionTitle(doc, '12-Step Fundamental Analysis', y)
  autoTable(doc, {
    startY: y,
    head: [['#', 'Step', 'Score', 'Conclusion']],
    body: Object.values(data?.steps || {}).map((s: any) => [
      String(s.step),
      s.title,
      s.score > 0 ? `+${s.score?.toFixed(2)}` : s.score?.toFixed(2) ?? '—',
      s.conclusion?.slice(0, 180) || '—',
    ]),
    theme: 'plain',
    styles: { fontSize: 6.5, textColor: COLORS.gray300, fillColor: COLORS.dark, cellPadding: 1.8 },
    headStyles: { fillColor: COLORS.gray900, textColor: COLORS.gray500, fontSize: 6.5 },
    columnStyles: {
      0: { cellWidth: 6 },
      1: { cellWidth: 36 },
      2: { cellWidth: 12, halign: 'right' },
      3: { cellWidth: 110 },
    },
    margin: { left: 14, right: 14 },
    alternateRowStyles: { fillColor: [18, 18, 18] },
  })
  y = (doc as any).lastAutoTable.finalY + 10

  // Final summary
  y = sectionTitle(doc, 'Investment Recommendation', y)
  if (data?.rating) ratingBadge(doc, data.rating, 14, y + 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...COLORS.gray300)
  if (data?.recommendation_summary) {
    const lines = doc.splitTextToSize(data.recommendation_summary, W - 28) as string[]
    doc.text(lines, 14, y + 10)
  }

  footer(doc)
  doc.save(`TGA_${ticker}_IR_${new Date().toISOString().slice(0, 10)}.pdf`)
}
