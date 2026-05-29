export interface Explanation {
  title: string
  formula?: string
  description: string
  interpretation?: string
}

export const EXPLANATIONS: Record<string, Explanation> = {

  // ── Fundamental: Valuation ────────────────────────────────────────────────

  pe_ratio: {
    title: 'P/E Ratio (Price-to-Earnings)',
    formula: 'P/E = Market Price per Share / Earnings per Share (EPS)',
    description: 'Measures how much investors pay for each dollar of earnings. A high P/E suggests high growth expectations; a low P/E may indicate undervaluation or slow growth.',
    interpretation: '< 15x: cheap. 15–25x: fair for stable companies. 25–40x: growth premium. > 40x: very expensive, requires high growth to justify.',
  },
  forward_pe: {
    title: 'Forward P/E',
    formula: 'Forward P/E = Current Price / Next 12-Month Consensus EPS',
    description: 'Same as trailing P/E but uses analyst consensus estimates for future earnings. More relevant than trailing P/E for growing companies.',
    interpretation: 'If Forward P/E < Trailing P/E, earnings are expected to grow (de-rating). If Forward P/E > Trailing P/E, earnings are expected to decline.',
  },
  pb_ratio: {
    title: 'P/B Ratio (Price-to-Book)',
    formula: 'P/B = Market Cap / Book Value of Equity',
    description: 'Compares market value to the accounting value of assets minus liabilities. High P/B indicates the market prices in intangible value (brand, IP, growth) beyond physical assets.',
    interpretation: '< 1x: trading below book value (distress or value opportunity). 1–3x: typical. > 5x: growth/quality premium.',
  },
  ps_ratio: {
    title: 'P/S Ratio (Price-to-Sales)',
    formula: 'P/S = Market Cap / Annual Revenue',
    description: 'Useful for companies with no earnings yet. Compares market valuation to top-line revenue.',
    interpretation: '< 1x: very cheap. 1–3x: reasonable. > 10x: growth premium typical of high-margin SaaS or tech companies.',
  },
  ev_ebitda: {
    title: 'EV/EBITDA',
    formula: 'EV/EBITDA = Enterprise Value / EBITDA',
    description: 'Enterprise Value (market cap + net debt) divided by EBITDA. Capital-structure-neutral valuation multiple — unlike P/E, it is not affected by leverage or tax rate. The most commonly used multiple in M&A.',
    interpretation: '< 8x: cheap. 8–15x: fair. 15–25x: growth premium. > 25x: expensive.',
  },
  ev_revenue: {
    title: 'EV/Revenue',
    formula: 'EV/Revenue = Enterprise Value / Annual Revenue',
    description: 'Useful when EBITDA is negative. Compares total enterprise value to top-line revenue.',
    interpretation: 'Sector-dependent. High-margin software: 5–15x. Low-margin industrials: 0.5–2x.',
  },
  peg_ratio: {
    title: 'PEG Ratio (Price/Earnings-to-Growth)',
    formula: 'PEG = P/E Ratio / Annual EPS Growth Rate (%)',
    description: 'Adjusts the P/E for growth. Popularized by Peter Lynch. A P/E of 30x for a company growing 30% yields a PEG of 1.0 — considered fairly valued.',
    interpretation: '< 1.0: potentially undervalued vs. growth. 1.0–2.0: fairly valued. > 2.0: expensive relative to growth.',
  },

  // ── Fundamental: Margins ─────────────────────────────────────────────────

  gross_margin: {
    title: 'Gross Margin',
    formula: 'Gross Margin = (Revenue - Cost of Goods Sold) / Revenue',
    description: 'Measures the profitability of the core product or service, before operating expenses. A high gross margin is the foundation of a strong business — it funds R&D, marketing, and operations.',
    interpretation: '> 60%: exceptional (software, pharma). 30–60%: strong. 15–30%: moderate. < 15%: thin — typical of retail or commodity businesses.',
  },
  operating_margin: {
    title: 'Operating Margin (EBIT Margin)',
    formula: 'Operating Margin = EBIT / Revenue',
    description: 'Measures profitability after all operating costs (salaries, R&D, marketing, D&A) but before interest and taxes. The key indicator of operational efficiency.',
    interpretation: '> 20%: excellent. 10–20%: good. 5–10%: adequate. < 5%: weak. Negative: operating losses.',
  },
  ebitda_margin: {
    title: 'EBITDA Margin',
    formula: 'EBITDA Margin = EBITDA / Revenue',
    description: 'Operating margin before Depreciation & Amortization. Used to compare companies across different capital structures and accounting policies. The standard M&A metric.',
    interpretation: '> 30%: high quality. 15–30%: solid. < 15%: below average for most sectors.',
  },
  net_margin: {
    title: 'Net Profit Margin',
    formula: 'Net Margin = Net Income / Revenue',
    description: 'Bottom-line profitability: what remains after all costs, interest, and taxes. Influenced by leverage (interest) and tax optimization.',
    interpretation: 'Highly sector-dependent. Compare to historical trend and sector peers rather than absolute benchmarks.',
  },

  // ── Fundamental: Returns ──────────────────────────────────────────────────

  roe: {
    title: 'ROE (Return on Equity)',
    formula: 'ROE = Net Income / Average Shareholders\' Equity',
    description: 'Measures how efficiently management generates profit from shareholders\' capital. High ROE can reflect genuine competitive advantage — or simply high financial leverage.',
    interpretation: '> 20%: excellent. 12–20%: solid. < 8%: weak. Always cross-check with D/E ratio: high leverage inflates ROE artificially.',
  },
  roa: {
    title: 'ROA (Return on Assets)',
    formula: 'ROA = Net Income / Average Total Assets',
    description: 'Measures how efficiently a company uses its assets to generate profit. Less sensitive to leverage than ROE.',
    interpretation: '> 10%: asset-light, high-quality business. 5–10%: solid. < 3%: asset-heavy or low-profitability model.',
  },

  // ── Fundamental: Balance Sheet ────────────────────────────────────────────

  debt_to_equity: {
    title: 'Debt-to-Equity Ratio',
    formula: 'D/E = Total Debt / Shareholders\' Equity',
    description: 'Measures financial leverage: how much of the company is funded by debt vs. equity. High leverage amplifies both returns and risk.',
    interpretation: 'Expressed as %. < 50%: conservative. 50–150%: moderate. > 200%: highly leveraged — monitor ICR and FCF carefully.',
  },
  current_ratio: {
    title: 'Current Ratio',
    formula: 'Current Ratio = Current Assets / Current Liabilities',
    description: 'Measures short-term liquidity: can the company pay its obligations due within 12 months?',
    interpretation: '> 2x: strong liquidity buffer. 1–2x: adequate. < 1x: potential liquidity risk.',
  },
  quick_ratio: {
    title: 'Quick Ratio (Acid Test)',
    formula: 'Quick Ratio = (Cash + Short-term Investments + Receivables) / Current Liabilities',
    description: 'Stricter liquidity measure than Current Ratio — excludes inventory, which may not be quickly converted to cash.',
    interpretation: '> 1x: can meet short-term obligations without selling inventory. < 0.5x: potential liquidity concern.',
  },

  // ── Fundamental: Growth ───────────────────────────────────────────────────

  revenue_growth: {
    title: 'Revenue Growth (YoY)',
    formula: 'Revenue Growth = (Revenue_t - Revenue_{t-1}) / Revenue_{t-1}',
    description: 'Year-over-year change in total revenue. The primary measure of a company\'s top-line momentum. Distinguish organic growth (internal) from inorganic (acquisitions).',
    interpretation: '> 15%: high-growth company. 5–15%: healthy growth. 0–5%: mature/stable. Negative: declining business — investigate cause.',
  },
  earnings_growth: {
    title: 'Earnings Growth (YoY)',
    formula: 'Earnings Growth = (EPS_t - EPS_{t-1}) / |EPS_{t-1}|',
    description: 'Year-over-year change in earnings per share. Should ideally exceed revenue growth (positive operating leverage). Key driver of stock price re-rating.',
    interpretation: 'Earnings growing faster than revenue = margin expansion (favorable scissors effect). Slower = margin compression.',
  },

  // ── Fundamental: Misc ─────────────────────────────────────────────────────

  beta: {
    title: 'Beta (Market Sensitivity)',
    formula: 'β = Cov(Stock Returns, Market Returns) / Var(Market Returns)',
    description: 'Measures a stock\'s price sensitivity relative to the overall market. A beta of 1.5 means the stock historically moves 1.5x the market.',
    interpretation: '< 0.7: defensive (utilities, staples). 0.7–1.3: market-like. > 1.3: cyclical/volatile. > 2: very high volatility.',
  },
  dividend_yield: {
    title: 'Dividend Yield',
    formula: 'Dividend Yield = Annual Dividend per Share / Stock Price',
    description: 'The income return from holding a stock. High yield companies return significant cash to shareholders rather than reinvesting for growth.',
    interpretation: '0%: growth company (reinvests all capital). 1–3%: moderate. > 5%: high yield — verify sustainability with payout ratio and FCF.',
  },
  payout_ratio: {
    title: 'Payout Ratio',
    formula: 'Payout Ratio = Dividends Paid / Net Income',
    description: 'Percentage of net income returned to shareholders as dividends. A very high payout ratio may be unsustainable if earnings decline.',
    interpretation: '0–30%: growth-oriented. 30–60%: balanced. 60–80%: income-oriented. > 80%: potentially unsustainable — compare to FCF.',
  },
  short_ratio: {
    title: 'Short Ratio (Days to Cover)',
    formula: 'Short Ratio = Shares Sold Short / Average Daily Volume',
    description: 'The number of trading days needed to cover all short positions given average daily volume. High short interest reflects bearish market sentiment.',
    interpretation: '< 3 days: low short interest — market confident. 3–10 days: moderate. > 10 days: elevated bearish sentiment — risk of short squeeze or fundamental concern.',
  },
  analyst_recommendation: {
    title: 'Analyst Consensus (Mean)',
    formula: 'Scale: 1 = Strong Buy · 2 = Buy · 3 = Hold · 4 = Sell · 5 = Strong Sell',
    description: 'Average recommendation from all sell-side analysts covering the stock. Aggregated from brokers\' 12-month forward-looking ratings.',
    interpretation: '< 2.0: Strong Buy consensus. 2.0–2.5: Buy. 2.5–3.5: Hold. > 3.5: Sell. Note: analysts tend to be optimistic — Hold often means mild caution.',
  },
  operating_leverage: {
    title: 'Operating Leverage',
    formula: 'Operating Leverage = % Change in EBIT / % Change in Revenue',
    description: 'Measures how sensitive operating profit is to changes in revenue. High fixed-cost businesses have high operating leverage: a 10% revenue increase may yield a 30% EBIT increase.',
    interpretation: '> 2x: high fixed costs, strong leverage (good in growth, risky in downturns). 1–2x: moderate. < 1x: variable cost structure, resilient.',
  },

  // ── Technical: Indicators ────────────────────────────────────────────────

  rsi: {
    title: 'RSI — Relative Strength Index (14)',
    formula: 'RSI = 100 - 100 / (1 + RS) · RS = Avg Gain (14d) / Avg Loss (14d)',
    description: 'Momentum oscillator measuring the speed and magnitude of recent price changes. Developed by J. Welles Wilder. Ranges from 0 to 100.',
    interpretation: '> 70: overbought — potential reversal or consolidation. < 30: oversold — potential bounce. 30–70: neutral momentum. Best used as a confirmation signal, not in isolation.',
  },
  macd: {
    title: 'MACD — Moving Average Convergence Divergence (12, 26, 9)',
    formula: 'MACD Line = EMA(12) - EMA(26) · Signal = EMA(9) of MACD · Histogram = MACD - Signal',
    description: 'Trend-following momentum indicator. The MACD line crossing above the signal line is a bullish signal; crossing below is bearish. The histogram visualizes the spread.',
    interpretation: 'Bullish crossover (MACD > Signal): buying momentum. Bearish crossover: selling pressure. Divergence from price is a leading indicator of trend reversal.',
  },
  bollinger: {
    title: 'Bollinger Bands (20, ±2σ)',
    formula: 'Middle = SMA(20) · Upper = SMA(20) + 2σ · Lower = SMA(20) - 2σ',
    description: 'Volatility bands plotted at ±2 standard deviations from a 20-day moving average. Developed by John Bollinger. When bands narrow (squeeze), a large price move is imminent.',
    interpretation: 'Price touching upper band: overbought in trend context. Lower band: oversold. Band squeeze followed by expansion = breakout signal. ~95% of price action stays within the bands.',
  },
  atr: {
    title: 'ATR — Average True Range (14)',
    formula: 'True Range = max(High-Low, |High-PrevClose|, |Low-PrevClose|) · ATR = EMA(True Range, 14)',
    description: 'Measures market volatility — the average range of price movement per day over 14 days. Does not indicate direction, only magnitude.',
    interpretation: 'High ATR: volatile market — wider stop-losses needed. Low ATR: quiet market. ATR expansion often precedes trend continuation or reversal.',
  },
  obv: {
    title: 'OBV — On-Balance Volume',
    formula: 'OBV_t = OBV_{t-1} + Volume if Price Up, - Volume if Price Down',
    description: 'Cumulative volume indicator that adds volume on up-days and subtracts on down-days. Measures buying and selling pressure. Price is driven by volume.',
    interpretation: 'Rising OBV with rising price: trend confirmation. Rising OBV with flat/falling price: bullish divergence (accumulation). Falling OBV with rising price: bearish divergence (distribution).',
  },
  sma: {
    title: 'SMA — Simple Moving Average',
    formula: 'SMA(n) = (P_1 + P_2 + ... + P_n) / n',
    description: 'The average closing price over n days. Smooths price fluctuations to reveal the underlying trend. Commonly used: 20-day (short), 50-day (medium), 200-day (long).',
    interpretation: 'Price above SMA200: long-term uptrend. Golden Cross (SMA50 > SMA200): bullish. Death Cross (SMA50 < SMA200): bearish.',
  },

  // ── Technical: Models ─────────────────────────────────────────────────────

  arima: {
    title: 'ARIMA(1,0,1) — AutoRegressive Integrated Moving Average',
    formula: 'r_t = φ·r_{t-1} + θ·ε_{t-1} + ε_t',
    description: 'Statistical model for time series forecasting. Models the conditional mean of log-returns using past returns (AR) and past errors (MA). "Integrated" accounts for non-stationarity.',
    interpretation: 'ARIMA forecasts the expected return direction. Accuracy is limited (~55–60%) due to market noise. Used as a baseline — combined with GARCH for full uncertainty quantification.',
  },
  garch: {
    title: 'GARCH(1,1) — Generalized AutoRegressive Conditional Heteroskedasticity',
    formula: 'σ²_t = ω + α·ε²_{t-1} + β·σ²_{t-1}',
    description: 'Models time-varying volatility (volatility clustering). Financial markets exhibit periods of high and low volatility — GARCH captures this dynamic. Applied to ARIMA residuals.',
    interpretation: '30-day volatility forecast shows expected risk. High σ forecast = uncertain market environment. Used for risk management, option pricing, and VaR calculation.',
  },
  monte_carlo: {
    title: 'Monte Carlo Simulation (Geometric Brownian Motion)',
    formula: 'S_t = S_0 · exp((μ - σ²/2)·t + σ·√t·Z), Z ~ N(0,1)',
    description: 'Simulates thousands of random price paths using historical drift (μ) and volatility (σ). Based on the Black-Scholes GBM assumption. Each path is an equally probable future scenario.',
    interpretation: 'P5: worst 5% of scenarios. P50: median outcome. P95: best 5%. The spread between P5 and P95 reflects total uncertainty. Assumes constant μ and σ — underestimates tail risk.',
  },
  lightgbm: {
    title: 'LightGBM Directional Classifier',
    formula: 'Signal threshold: P(Up) > 65% = BUY · P(Up) < 35% = SELL · else NEUTRAL',
    description: 'Gradient-boosted decision tree trained on technical features (RSI, MACD, Bollinger width, momentum, realized volatility). Evaluated with TimeSeriesSplit to prevent data leakage.',
    interpretation: 'Only trade on high-confidence signals (>65% or <35%). Between 35–65%: market is too noisy to predict. CV Accuracy shows out-of-sample performance across 5 time windows.',
  },
  cv_accuracy: {
    title: 'Cross-Validation Accuracy (TimeSeriesSplit)',
    formula: 'Accuracy = Correct Predictions / Total Predictions · Average of 5 folds',
    description: 'Measures the ML model\'s directional prediction accuracy on held-out data. Uses TimeSeriesSplit — training on past data, testing on future data — to prevent look-ahead bias.',
    interpretation: '> 60%: useful signal. 50–55%: marginal. ~50%: random (no predictive power). Note: 50% baseline in financial markets. Do NOT use raw accuracy — always check Sharpe ratio on backtest.',
  },
  feature_importance: {
    title: 'Feature Importance (LightGBM)',
    formula: 'Split-based: number of times feature is used to split across all trees',
    description: 'Shows which technical features the ML model relies on most for predictions. Helps understand what market signals are currently most predictive.',
    interpretation: 'High importance ≠ causation. Features dominating the model may reflect the current market regime (trending, mean-reverting, volatile). Importance can shift as regimes change.',
  },

  // ── Portfolio ─────────────────────────────────────────────────────────────

  sharpe_ratio: {
    title: 'Sharpe Ratio',
    formula: 'Sharpe = (Portfolio Return - Risk-Free Rate) / Portfolio Volatility',
    description: 'The most widely used risk-adjusted return metric. Measures how much excess return you earn per unit of risk taken. Developed by William Sharpe (Nobel Prize 1990).',
    interpretation: '< 0: portfolio loses vs. risk-free. 0–1: sub-optimal. 1–2: good. > 2: excellent. > 3: exceptional (or overfitted).',
  },
  annual_volatility: {
    title: 'Annualized Volatility (Portfolio)',
    formula: 'σ_annual = σ_daily × √252',
    description: 'Standard deviation of daily returns, annualized by multiplying by √252 (trading days). Measures the dispersion of portfolio returns — the primary measure of portfolio risk.',
    interpretation: 'S&P 500 historical: ~15%. < 10%: very low risk. 10–20%: moderate. > 30%: high risk.',
  },
  expected_return: {
    title: 'Expected Annual Return',
    formula: 'E[R]_annual = E[R]_daily × 252',
    description: 'Annualized expected return estimated from historical mean daily returns. Note: past returns are not a guarantee of future performance.',
    interpretation: 'Always assess alongside volatility. A 20% return with 40% volatility is worse risk-adjusted than 10% return with 8% volatility.',
  },
  hrp_weights: {
    title: 'HRP — Hierarchical Risk Parity Weights',
    formula: 'w_i ∝ 1/σ²_i · (within cluster) · Hierarchical allocation across clusters',
    description: 'López de Prado (2016). Uses hierarchical clustering to group assets by correlation, then allocates inverse-variance within each cluster. Avoids inverting the covariance matrix — more robust.',
    interpretation: 'HRP naturally diversifies without concentration. More stable than Markowitz in out-of-sample periods. Better crisis resilience. Weights are more balanced across assets.',
  },
  markowitz_weights: {
    title: 'Markowitz Mean-Variance (Max Sharpe) Weights',
    formula: 'max w\'μ / √(w\'Σw) · subject to: Σw = 1, w ≥ 0',
    description: 'Modern Portfolio Theory (Markowitz, 1952). Finds the portfolio on the efficient frontier that maximizes the Sharpe ratio. Highly sensitive to return and covariance estimates.',
    interpretation: 'Often produces concentrated portfolios (1–3 assets) due to estimation errors. Use alongside HRP for comparison. Sensitive to look-ahead bias in historical returns.',
  },
  efficient_frontier: {
    title: 'Efficient Frontier (Markowitz)',
    formula: 'Set of portfolios maximizing E[R] for each level of σ (or minimizing σ for each E[R])',
    description: 'The curve of all optimal portfolios — no other combination of assets offers a higher return for the same risk. Portfolios below the curve are suboptimal (inefficient).',
    interpretation: 'Left tip = Minimum Variance Portfolio. Top-right = Maximum Return (concentrated). Tangent point with Capital Market Line = Maximum Sharpe (optimal risk-adjusted).',
  },
  ann_return_asset: {
    title: 'Annualized Return (Asset)',
    formula: 'R_annual = mean(daily returns) × 252',
    description: 'Historical annualized return of an individual asset over the selected period.',
    interpretation: 'Compare to the portfolio\'s blended return to understand each asset\'s contribution. Negative: the asset has lost value over the period.',
  },
  ann_vol_asset: {
    title: 'Annualized Volatility (Asset)',
    formula: 'σ_annual = std(daily returns) × √252',
    description: 'Historical annualized standard deviation of an individual asset\'s daily returns.',
    interpretation: 'Higher volatility = higher risk. Combining assets with low cross-correlation reduces portfolio volatility even if individual volatilities are high.',
  },

  // ── Debt ─────────────────────────────────────────────────────────────────

  net_debt_ebitda: {
    title: 'Net Debt / EBITDA',
    formula: 'Net Debt / EBITDA = (Total Debt - Cash) / EBITDA',
    description: 'The most important credit metric. Measures how many years of operating earnings are needed to repay net debt. The standard leverage metric used by rating agencies and lenders.',
    interpretation: '< 1x: very strong, essentially unleveraged. 1–2x: conservative. 2–4x: moderate — typical for investment grade. 4–6x: elevated, high yield territory. > 6x: distressed.',
  },
  icr: {
    title: 'Interest Coverage Ratio (ICR)',
    formula: 'ICR = EBIT (or EBITDA) / Net Interest Expense',
    description: 'Measures how many times the company can pay its interest charges from operating profit. The primary metric for assessing debt service capacity.',
    interpretation: '> 5x: very comfortable. 3–5x: adequate. 1.5–3x: watch carefully. < 1.5x: alarm — company struggles to cover interest. < 1x: insolvent on interest payments.',
  },
  dscr: {
    title: 'DSCR — Debt Service Coverage Ratio',
    formula: 'DSCR = Operating Cash Flow / (Interest Payments + Principal Repayments)',
    description: 'Measures whether the company generates enough cash to cover ALL debt obligations — both interest AND principal repayment. Stricter than ICR as it includes amortization.',
    interpretation: '> 1.5x: comfortable. 1.2–1.5x: minimum acceptable for most lenders. 1.0–1.2x: tight — leaves no buffer. < 1.0x: cannot fully service debt from operations.',
  },
  fcf: {
    title: 'Free Cash Flow (FCF)',
    formula: 'FCF = Operating Cash Flow - Capital Expenditures (CAPEX)',
    description: 'The real cash generated by the business after maintaining and growing its asset base. Unlike accounting profits, FCF cannot be easily manipulated. The ultimate measure of financial health.',
    interpretation: 'Positive FCF: company is self-financing — can repay debt, pay dividends, buy back shares. Negative FCF: requires external financing. Sustained negative FCF is a red flag.',
  },
  gearing: {
    title: 'Gearing (Debt / Equity)',
    formula: 'Gearing = Net Debt / Shareholders\' Equity',
    description: 'Measures the proportion of debt relative to equity in the capital structure. Unlike D/E ratio (which uses total debt), gearing uses net debt.',
    interpretation: '< 25%: conservative. 25–75%: typical for investment grade. > 100%: highly geared — equity fully funded by debt. > 200%: potential solvency concern.',
  },
  recovery_rate: {
    title: 'Recovery Rate (in Default)',
    formula: 'Recovery Rate = Tangible Asset Value / Total Debt · Tangible Assets = Total Assets - Goodwill - Intangibles',
    description: 'Estimates what percentage of principal creditors would recover if the company defaulted and was liquidated. Intangibles (goodwill, brand) are excluded as they typically lose value in distress.',
    interpretation: '> 80%: senior secured creditors well-protected. 50–80%: moderate recovery. 30–50%: significant loss expected for unsecured. < 30%: high Loss Given Default (LGD).',
  },
  lgd: {
    title: 'LGD — Loss Given Default',
    formula: 'LGD = 1 - Recovery Rate',
    description: 'The percentage of the loan or bond that would be lost if the borrower defaults. One of the three key inputs to credit risk models (alongside Probability of Default and Exposure at Default).',
    interpretation: 'LGD of 0%: full recovery expected. LGD of 100%: total loss. Senior secured debt: LGD typically 20–40%. Subordinated/unsecured: LGD 50–80%.',
  },
  stress_icr: {
    title: 'ICR Under Stress',
    formula: 'Stressed ICR = (Base EBITDA × (1 + EBITDA shock)) / Interest Expense',
    description: 'The Interest Coverage Ratio recalculated under each stress scenario. Tests whether the company can still service its debt after a significant deterioration in operating performance.',
    interpretation: 'Minimum acceptable stressed ICR: 1.5x. If stressed ICR falls below 1.5x even in the "mild" scenario, the credit is fragile. Below 1.0x = cannot pay interest from operations.',
  },

  // ── Reference Rates ───────────────────────────────────────────────────────

  fed_funds_rate: {
    title: 'Federal Funds Rate',
    formula: 'Set by the FOMC (Federal Open Market Committee) — target range',
    description: 'The interest rate at which US banks lend overnight reserves to each other. The base rate of the entire US financial system. All other rates are priced as a spread above it.',
    interpretation: 'Rate cuts: stimulative — equities up, bonds up. Rate hikes: restrictive — equities down, refinancing costs rise. Highly leveraged companies are most sensitive.',
  },
  sofr: {
    title: 'SOFR — Secured Overnight Financing Rate',
    formula: 'Published daily by the NY Fed based on actual overnight repo transactions',
    description: 'The replacement for LIBOR in the US market. Used as the floating rate benchmark for most new corporate loans, mortgages, and derivatives in the US.',
    interpretation: 'Tracks Fed Funds rate closely. If a company has floating-rate debt linked to SOFR, each 100bps increase in SOFR raises annual interest costs by 1% × debt outstanding.',
  },
  euribor_3m: {
    title: 'EURIBOR 3M — Euro Interbank Offered Rate (3 months)',
    formula: 'Average rate at which Eurozone banks lend to each other for 3 months',
    description: 'The benchmark floating rate for euro-denominated loans and bonds. European equivalent of LIBOR/SOFR. Used for most European corporate loans and CLOs.',
    interpretation: 'Key for European companies with floating-rate debt. A European company with €1B of EURIBOR-linked debt and EURIBOR at 3% pays €30M/year in floating interest.',
  },
  ecb_rate: {
    title: 'ECB Deposit Facility Rate',
    formula: 'Set by ECB Governing Council — rate paid on overnight deposits at the ECB',
    description: 'The key policy rate of the European Central Bank. Effectively the floor of euro money market rates. EURIBOR tracks this rate with a small positive spread.',
    interpretation: 'ECB rate cuts: positive for European bond prices and leveraged companies. Rate hikes: increases refinancing costs for all EUR-denominated debt.',
  },
  us_10y: {
    title: 'US 10-Year Treasury Yield',
    formula: 'Yield implied by market price of 10-year US Government bond',
    description: 'The global risk-free rate benchmark. All corporate bonds are priced as a spread (credit spread) above this rate. Drives mortgage rates, equity discount rates (WACC), and valuation.',
    interpretation: 'Rising yields: negative for growth stocks (higher discount rate compresses multiples) and bond prices. Falling yields: positive for equities and bonds. Spread between 2Y and 10Y = yield curve.',
  },
  us_10y_treasury: {
    title: 'US 10-Year Treasury Yield',
    formula: 'Yield implied by market price of 10-year US Government bond',
    description: 'The global risk-free rate benchmark. All corporate bonds are priced as a spread (credit spread) above this rate. Drives mortgage rates, equity discount rates (WACC), and valuation.',
    interpretation: 'Rising yields: negative for growth stocks (higher discount rate compresses multiples) and bond prices. Falling yields: positive for equities and bonds. Spread between 2Y and 10Y = yield curve.',
  },
  us_2y_treasury: {
    title: 'US 2-Year Treasury Yield',
    formula: 'Yield implied by market price of 2-year US Government bond',
    description: 'A short-term rate closely linked to Fed policy expectations. When the 2Y yield rises above the 10Y yield, the yield curve inverts — historically a recession indicator.',
    interpretation: 'Yield curve inversion (2Y > 10Y): has preceded every US recession in the last 50 years. Spread between 2Y and 10Y = "term premium" — market compensation for holding longer-duration bonds.',
  },
  us_30y_treasury: {
    title: 'US 30-Year Treasury Yield',
    formula: 'Yield implied by market price of 30-year US Government bond',
    description: 'The long-end of the US yield curve. Heavily influences long-term mortgage rates and the discount rate for long-duration assets (infrastructure, real estate, utilities).',
    interpretation: 'Rising 30Y yield: negative for rate-sensitive sectors (REITs, utilities, infrastructure). Rising long-end with stable short-end = curve steepening (growth expectations rising).',
  },
  libor_3m_usd: {
    title: 'USD LIBOR 3M (Legacy Rate)',
    formula: 'Average of interbank lending rates submitted by major banks — now largely discontinued',
    description: 'LIBOR was the benchmark for floating-rate loans and derivatives. It was discontinued in 2023 and replaced by SOFR. Older loan contracts may still reference it during transition.',
    interpretation: 'Shown for historical reference. New contracts use SOFR. If still active in a loan agreement, it creates basis risk relative to SOFR-priced instruments.',
  },
}
