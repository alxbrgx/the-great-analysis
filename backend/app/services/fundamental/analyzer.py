"""
Fundamental Analysis — 12 steps methodology.
Based on "Les 12 travaux de l'analyste financier".
Each step returns: title, key_questions, data, analysis, conclusion, score.
"""
import numpy as np
import pandas as pd
import yfinance as yf
from app.utils.data_fetcher import get_ticker_info, get_financial_statements, get_key_ratios_yf
from app.services.fundamental.sector_thresholds import get_thresholds

RATINGS = ["Strong Sell", "Sell", "Hold", "Buy", "Strong Buy"]


def _safe(val, default=None):
    if val is None:
        return default
    try:
        if isinstance(val, float) and (np.isnan(val) or np.isinf(val)):
            return default
        return val
    except Exception:
        return default


def _fmt_pct(val):
    v = _safe(val)
    return f"{v:.1%}" if v is not None else "N/A"


def _fmt_x(val):
    v = _safe(val)
    return f"{v:.2f}x" if v is not None else "N/A"


def _fmt_bn(val):
    v = _safe(val)
    if v is None:
        return "N/A"
    return f"${v/1e9:.1f}B" if abs(v) >= 1e9 else f"${v/1e6:.0f}M"


class FundamentalAnalyzer:
    def __init__(self, ticker: str):
        self.ticker = ticker
        self._info = None
        self._statements = None
        self._ratios = None
        self._yf_ticker = None

    def _load_data(self):
        if self._info is None:
            self._info = get_ticker_info(self.ticker)
        if self._ratios is None:
            self._ratios = get_key_ratios_yf(self.ticker)
        if self._statements is None:
            self._statements = get_financial_statements(self.ticker)
        if self._yf_ticker is None:
            self._yf_ticker = yf.Ticker(self.ticker)
        if not hasattr(self, '_thresholds'):
            self._thresholds = get_thresholds(self._info.get("sector", ""))

    def _get_income_series(self, key: str) -> dict:
        df = self._statements.get("income_annual", pd.DataFrame())
        if df is None or df.empty or key not in df.index:
            return {}
        return {str(c.year): _safe(float(v)) for c, v in df.loc[key].items() if _safe(v) is not None}

    def _get_balance_series(self, key: str) -> dict:
        df = self._statements.get("balance_annual", pd.DataFrame())
        if df is None or df.empty or key not in df.index:
            return {}
        return {str(c.year): _safe(float(v)) for c, v in df.loc[key].items() if _safe(v) is not None}

    def _get_cf_series(self, key: str) -> dict:
        df = self._statements.get("cashflow_annual", pd.DataFrame())
        if df is None or df.empty or key not in df.index:
            return {}
        return {str(c.year): _safe(float(v)) for c, v in df.loc[key].items() if _safe(v) is not None}

    def _latest(self, series: dict):
        if not series:
            return None
        return series[max(series.keys())]

    async def run_step(self, step: int) -> dict:
        self._load_data()
        steps = {
            1: self._step1_business_overview,
            2: self._step2_market_sector,
            3: self._step3_competitive_position,
            4: self._step4_management_governance,
            5: self._step5_business_model,
            6: self._step6_income_statement,
            7: self._step7_cash_flows,
            8: self._step8_balance_sheet,
            9: self._step9_earnings_estimates,
            10: self._step10_valuation,
            11: self._step11_stock_reputation,
            12: self._step12_rerating_momentum,
        }
        return steps[step]()

    async def run_full_analysis(self) -> dict:
        self._load_data()
        steps_results = {}
        scores = []
        for i in range(1, 13):
            result = await self.run_step(i)
            steps_results[f"step_{i}"] = result
            scores.append(result.get("score", 0))

        avg_score = sum(scores) / len(scores) if scores else 0
        rating_idx = min(4, max(0, round((avg_score + 1) * 2)))
        rating = RATINGS[rating_idx]

        return {
            "ticker": self.ticker,
            "steps": steps_results,
            "final_score": round(avg_score, 3),
            "rating": rating,
            "recommendation_summary": self._build_summary(rating, steps_results),
        }

    async def get_recommendation(self) -> dict:
        result = await self.run_full_analysis()
        return {
            "ticker": result["ticker"],
            "rating": result["rating"],
            "summary": result["recommendation_summary"],
            "score": result["final_score"],
        }

    # ── Step 1: Business Overview ─────────────────────────────────────────────

    def _step1_business_overview(self) -> dict:
        info = self._info
        mktcap = _safe(info.get("market_cap"))

        if mktcap:
            if mktcap > 200e9:
                company_type = "Large Cap (Blue Chip) — >$200B market cap"
            elif mktcap > 10e9:
                company_type = "Large Cap — $10B–$200B market cap"
            elif mktcap > 2e9:
                company_type = "Mid Cap — $2B–$10B market cap"
            else:
                company_type = "Small Cap — <$2B market cap"
        else:
            company_type = "N/A"

        revenue_growth = _safe(self._ratios.get("revenue_growth"))
        if revenue_growth and revenue_growth > 0.15:
            biz_type = "Growth company (high revenue growth >15%)"
        elif revenue_growth and revenue_growth < 0.02:
            dte = _safe(self._ratios.get("debt_to_equity"))
            biz_type = "Value / Yield company (mature, low growth)" if dte and dte < 100 else "Potential restructuring candidate"
        else:
            sector = info.get("sector", "")
            cyclicals = ["Energy", "Materials", "Industrials", "Consumer Discretionary"]
            defensives = ["Consumer Staples", "Healthcare", "Utilities"]
            if sector in cyclicals:
                biz_type = "Cyclical company — correlated to economic cycle"
            elif sector in defensives:
                biz_type = "Defensive company — stable demand regardless of cycle"
            else:
                biz_type = "Balanced company"

        return {
            "step": 1,
            "title": "Understanding the Company's Business",
            "key_questions": [
                "What products and services does the company offer?",
                "In which industry does it operate?",
                "What value does it create?",
                "Who are its customers and suppliers?",
                "How are sales distributed (industry, geography)?",
            ],
            "data": {
                "name": info.get("name"),
                "ticker": self.ticker,
                "sector": info.get("sector"),
                "industry": info.get("industry"),
                "country": info.get("country"),
                "employees": _safe(info.get("employees")),
                "market_cap": _fmt_bn(mktcap),
                "company_type": company_type,
                "business_type_assessment": biz_type,
                "description": (info.get("description") or "")[:400],
                "website": info.get("website"),
            },
            "conclusion": (
                f"{info.get('name')} ({self.ticker}) operates in the {info.get('sector')} sector "
                f"({info.get('industry')}), headquartered in {info.get('country')}. "
                f"Classified as: {company_type}. Business profile: {biz_type}."
            ),
            "score": 0,
        }

    # ── Step 2: Market & Sector Dynamics ─────────────────────────────────────

    def _step2_market_sector(self) -> dict:
        sector = self._info.get("sector", "")
        industry = self._info.get("industry", "")
        beta = _safe(self._ratios.get("beta"))

        sector_growth_proxy = _safe(self._ratios.get("revenue_growth"))
        score = 0.3 if sector_growth_proxy and sector_growth_proxy > 0.05 else -0.2

        return {
            "step": 2,
            "title": "Market Trends & Sector Dynamics",
            "key_questions": [
                "What is the size and growth rate of the market?",
                "Is the market global, regional or local?",
                "What is the competitive structure of the industry?",
                "What is the company's negotiating power with clients and suppliers?",
                "Porter's Five Forces: rivalry, buyer power, supplier power, new entrants, substitutes",
            ],
            "data": {
                "sector": sector,
                "industry": industry,
                "beta_vs_market": _safe(beta),
                "revenue_growth_proxy": _fmt_pct(sector_growth_proxy),
                "porter_framework": {
                    "note": "Qualitative assessment — requires sector research reports for full analysis",
                    "market_sensitivity": (
                        "High market sensitivity (cyclical)" if beta and beta > 1.3
                        else "Low market sensitivity (defensive)" if beta and beta < 0.7
                        else "Moderate market sensitivity"
                    ),
                },
            },
            "conclusion": (
                f"The {sector} sector ({industry}) shows revenue growth of "
                f"{_fmt_pct(sector_growth_proxy)} YoY. "
                f"Beta of {_safe(beta, 'N/A')} indicates "
                f"{'high' if beta and beta > 1.3 else 'low' if beta and beta < 0.7 else 'moderate'} "
                f"correlation to market cycles. "
                f"Full Porter analysis requires sector-specific research reports."
            ),
            "score": score,
        }

    # ── Step 3: Competitive Position ─────────────────────────────────────────

    def _step3_competitive_position(self) -> dict:
        mktcap = _safe(self._info.get("market_cap"))
        revenue_growth = _safe(self._ratios.get("revenue_growth"))
        op_margin = _safe(self._ratios.get("operating_margin"))
        roe = _safe(self._ratios.get("roe"))
        short_ratio = _safe(self._ratios.get("short_ratio"))

        revenue_series = self._get_income_series("Total Revenue")

        th = self._thresholds
        score = 0
        if revenue_growth and revenue_growth > th["growth_high"]:
            score += 0.3
        if op_margin and op_margin > th["op_margin_strong"]:
            score += 0.3
        if short_ratio and short_ratio > 10:
            score -= 0.3

        bcg_position = "N/A"
        if revenue_growth and op_margin:
            if revenue_growth > th["growth_high"] and op_margin > th["op_margin_ok"]:
                bcg_position = "Star — high growth, strong profitability"
            elif revenue_growth < th["growth_moderate"] and op_margin > th["op_margin_ok"]:
                bcg_position = "Cash Cow — mature market, strong profitability"
            elif revenue_growth > th["growth_high"] and op_margin < th["op_margin_ok"]:
                bcg_position = "Question Mark — high growth, low profitability"
            else:
                bcg_position = "Dog — low growth, low profitability"

        return {
            "step": 3,
            "title": "Competitive Positioning",
            "key_questions": [
                "What is the company's market share?",
                "What is the revenue growth rate vs. competitors?",
                "What is the profitability (ROCE, ROE) vs. sector average?",
                "BCG Matrix position?",
                "What are the company's key strengths and weaknesses (SWOT)?",
            ],
            "data": {
                "market_cap": _fmt_bn(mktcap),
                "revenue_growth_yoy": _fmt_pct(revenue_growth),
                "operating_margin": _fmt_pct(op_margin),
                "roe": _fmt_pct(roe),
                "short_ratio_days": _safe(short_ratio),
                "bcg_matrix_position": bcg_position,
                "revenue_history": revenue_series,
            },
            "conclusion": (
                f"BCG Matrix position: {bcg_position}. "
                f"Revenue growth: {_fmt_pct(revenue_growth)}, "
                f"Operating margin: {_fmt_pct(op_margin)}, "
                f"ROE: {_fmt_pct(roe)}. "
                f"Short ratio: {_safe(short_ratio, 'N/A')} days — "
                f"{'elevated short interest signals caution' if short_ratio and short_ratio > 10 else 'short interest is normal'}."
            ),
            "score": round(score, 2),
        }

    # ── Step 4: Management & Governance ──────────────────────────────────────

    def _step4_management_governance(self) -> dict:
        payout = _safe(self._ratios.get("payout_ratio"))
        div_yield = _safe(self._ratios.get("dividend_yield"))
        beta = _safe(self._ratios.get("beta"))

        score = 0
        if payout and 0.2 < payout < 0.6:
            score += 0.25
        if div_yield and div_yield > 0.01:
            score += 0.1

        return {
            "step": 4,
            "title": "Management Motivation, Vision & Strategy",
            "key_questions": [
                "Who is the reference shareholder (founder, family, institutional, state)?",
                "What are the shareholders' objectives (long-term value, dividends, control)?",
                "Is the board independent from management?",
                "How is management incentivized (stock options, performance shares)?",
                "Is management transparent and aligned with shareholder interests?",
            ],
            "data": {
                "dividend_yield": _fmt_pct(div_yield),
                "payout_ratio": _fmt_pct(payout),
                "payout_assessment": (
                    "Balanced — returns value while retaining capital for growth" if payout and 0.2 < payout < 0.6
                    else "High payout — limited reinvestment capacity" if payout and payout > 0.7
                    else "Low payout — prioritizing growth over income" if payout and payout < 0.15
                    else "No dividend"
                ),
                "note": "Detailed governance analysis requires proxy statements (DEF 14A for US companies)",
            },
            "conclusion": (
                f"Dividend yield: {_fmt_pct(div_yield)}, Payout ratio: {_fmt_pct(payout)}. "
                f"{'Management returns capital while retaining growth capacity.' if payout and 0.2 < payout < 0.6 else ''} "
                f"Full governance assessment requires reading proxy statements and ownership disclosures."
            ),
            "score": round(score, 2),
        }

    # ── Step 5: Business Model & Profitability Levers ────────────────────────

    def _step5_business_model(self) -> dict:
        gross_margin = _safe(self._ratios.get("gross_margin"))
        op_margin = _safe(self._ratios.get("operating_margin"))
        net_margin = _safe(self._ratios.get("profit_margin"))
        revenue_growth = _safe(self._ratios.get("revenue_growth"))
        earnings_growth = _safe(self._ratios.get("earnings_growth"))

        op_lev = None
        if revenue_growth and earnings_growth and revenue_growth != 0:
            op_lev = earnings_growth / revenue_growth

        th = self._thresholds
        score = 0
        if gross_margin and gross_margin > th["gross_margin_strong"]:
            score += 0.4
        elif gross_margin and gross_margin > th["gross_margin_ok"]:
            score += 0.2
        if op_lev and op_lev > 2:
            score += 0.2

        return {
            "step": 5,
            "title": "Business Model & Profitability Levers",
            "key_questions": [
                "What are the key drivers of revenue growth?",
                "What are the main profitability levers?",
                "What is the operating leverage (sensitivity of EBIT to revenue change)?",
                "Philip Fisher's 15 points: does management pursue long-term product development?",
                "Scissors effect: are costs growing faster or slower than revenues?",
            ],
            "data": {
                "gross_margin": _fmt_pct(gross_margin),
                "operating_margin": _fmt_pct(op_margin),
                "net_margin": _fmt_pct(net_margin),
                "revenue_growth_yoy": _fmt_pct(revenue_growth),
                "earnings_growth_yoy": _fmt_pct(earnings_growth),
                "operating_leverage": round(op_lev, 2) if op_lev else "N/A",
                "scissors_effect": (
                    "Favorable — earnings grow faster than revenue (expanding margins)"
                    if op_lev and op_lev > 1.2
                    else "Unfavorable — costs growing faster than revenues (margin compression)"
                    if op_lev and op_lev < 0.8
                    else "Neutral"
                ),
            },
            "conclusion": (
                f"Gross margin: {_fmt_pct(gross_margin)} (sector benchmark: strong >{_fmt_pct(th['gross_margin_strong'])}, ok >{_fmt_pct(th['gross_margin_ok'])}). "
                f"Operating margin: {_fmt_pct(op_margin)}. "
                f"Operating leverage: {round(op_lev, 2) if op_lev else 'N/A'}x — "
                f"{'margins are expanding (favorable scissors effect)' if op_lev and op_lev > 1.2 else 'margin pressure detected' if op_lev and op_lev < 0.8 else 'stable margin dynamics'}. "
                f"Gross margin indicates "
                f"{'strong pricing power for this sector' if gross_margin and gross_margin > th['gross_margin_strong'] else 'adequate margin for sector' if gross_margin and gross_margin > th['gross_margin_ok'] else 'thin margins relative to sector peers'}."
            ),
            "score": round(score, 2),
        }

    # ── Step 6: Income Statement Analysis ────────────────────────────────────

    def _step6_income_statement(self) -> dict:
        revenue = self._get_income_series("Total Revenue")
        ebitda = self._get_income_series("EBITDA")
        ebit = self._get_income_series("EBIT")
        net_income = self._get_income_series("Net Income")
        interest_exp = self._get_income_series("Interest Expense")

        gross_margin = _safe(self._ratios.get("gross_margin"))
        op_margin = _safe(self._ratios.get("operating_margin"))
        net_margin = _safe(self._ratios.get("profit_margin"))

        ebitda_margin = None
        latest_rev = self._latest(revenue)
        latest_ebitda = self._latest(ebitda)
        if latest_rev and latest_ebitda and latest_rev != 0:
            ebitda_margin = latest_ebitda / latest_rev

        th = self._thresholds
        score = 0
        if op_margin and op_margin > th["op_margin_strong"]:
            score += 0.4
        elif op_margin and op_margin > th["op_margin_ok"]:
            score += 0.2
        elif op_margin and op_margin < 0:
            score -= 0.4

        return {
            "step": 6,
            "title": "Income Statement Analysis",
            "key_questions": [
                "Revenue trend over 10 years: organic growth vs. M&A?",
                "Gross margin, EBITDA margin, EBIT margin, net margin trends?",
                "Are there significant exceptional/non-recurring items to restate?",
                "NOPAT (Net Operating Profit After Tax): true operational profitability?",
                "EPS trend and quality of earnings?",
            ],
            "data": {
                "revenue_history": revenue,
                "ebitda_history": ebitda,
                "net_income_history": net_income,
                "margins": {
                    "gross_margin": _fmt_pct(gross_margin),
                    "ebitda_margin": _fmt_pct(ebitda_margin),
                    "operating_margin": _fmt_pct(op_margin),
                    "net_margin": _fmt_pct(net_margin),
                },
                "latest_revenue": _fmt_bn(latest_rev),
                "latest_ebitda": _fmt_bn(latest_ebitda),
            },
            "conclusion": (
                f"Revenue: {_fmt_bn(latest_rev)}. EBITDA: {_fmt_bn(latest_ebitda)} "
                f"(margin: {_fmt_pct(ebitda_margin)}). "
                f"Operating margin: {_fmt_pct(op_margin)} (sector benchmark: strong >{_fmt_pct(th['op_margin_strong'])}, ok >{_fmt_pct(th['op_margin_ok'])}) — "
                f"{'excellent operational efficiency for this sector' if op_margin and op_margin > th['op_margin_strong'] else 'satisfactory profitability for sector' if op_margin and op_margin > th['op_margin_ok'] else 'below-average profitability — investigate exceptional items'}. "
                f"Net margin: {_fmt_pct(net_margin)}."
            ),
            "score": round(score, 2),
        }

    # ── Step 7: Cash Flow Analysis ───────────────────────────────────────────

    def _step7_cash_flows(self) -> dict:
        op_cf = self._get_cf_series("Operating Cash Flow")
        capex = self._get_cf_series("Capital Expenditure")
        div_paid = self._get_cf_series("Payment Of Dividends")

        fcf = {}
        for yr in op_cf:
            if yr in capex:
                fcf[yr] = _safe(op_cf[yr], 0) + _safe(capex[yr], 0)

        latest_fcf = self._latest(fcf)
        latest_op_cf = self._latest(op_cf)
        latest_capex = self._latest(capex)

        div = _safe(self._ratios.get("dividend_yield"))
        payout = _safe(self._ratios.get("payout_ratio"))

        capex_intensity = None
        latest_rev = self._latest(self._get_income_series("Total Revenue"))
        if latest_capex and latest_rev and latest_rev != 0:
            capex_intensity = abs(latest_capex) / latest_rev

        score = 0
        if latest_fcf and latest_fcf > 0:
            score += 0.4
        if capex_intensity and capex_intensity < 0.05:
            score += 0.15
        elif capex_intensity and capex_intensity > 0.15:
            score -= 0.1

        return {
            "step": 7,
            "title": "Cash Flow Analysis",
            "key_questions": [
                "Free Cash Flow = Operating CF - CAPEX: is FCF consistently positive?",
                "Working capital (BFR) management: is WCR increasing/decreasing?",
                "CAPEX intensity: growth capex vs. maintenance capex?",
                "Dividend policy: are dividends covered by FCF?",
                "FCF conversion rate: FCF / Net Income (ideally >80%)?",
            ],
            "data": {
                "operating_cf_history": op_cf,
                "capex_history": capex,
                "fcf_history": fcf,
                "latest_fcf": _fmt_bn(latest_fcf),
                "latest_operating_cf": _fmt_bn(latest_op_cf),
                "latest_capex": _fmt_bn(latest_capex),
                "capex_intensity": _fmt_pct(capex_intensity),
                "dividend_yield": _fmt_pct(div),
                "payout_ratio": _fmt_pct(payout),
            },
            "conclusion": (
                f"FCF: {_fmt_bn(latest_fcf)} — "
                f"{'positive FCF generation, company self-finances growth' if latest_fcf and latest_fcf > 0 else 'negative FCF — requires external financing'}. "
                f"CAPEX intensity: {_fmt_pct(capex_intensity)} of revenue "
                f"({'asset-light model' if capex_intensity and capex_intensity < 0.05 else 'capital-intensive model' if capex_intensity and capex_intensity > 0.15 else 'moderate capital intensity'}). "
                f"Dividend covered by FCF: "
                f"{'yes' if latest_fcf and latest_fcf > 0 and payout and payout < 0.8 else 'at risk' if payout and payout > 0.9 else 'no dividend'}."
            ),
            "score": round(score, 2),
        }

    # ── Step 8: Balance Sheet Analysis ───────────────────────────────────────

    def _step8_balance_sheet(self) -> dict:
        total_assets = self._get_balance_series("Total Assets")
        total_debt = self._get_balance_series("Total Debt")
        equity = self._get_balance_series("Stockholders Equity")
        cash = self._get_balance_series("Cash And Cash Equivalents")

        dte = _safe(self._ratios.get("debt_to_equity"))
        current_ratio = _safe(self._ratios.get("current_ratio"))
        quick_ratio = _safe(self._ratios.get("quick_ratio"))
        roe = _safe(self._ratios.get("roe"))
        roa = _safe(self._ratios.get("roa"))

        latest_debt = self._latest(total_debt)
        latest_ebitda = self._latest(self._get_income_series("EBITDA"))
        latest_cash = self._latest(cash)

        net_debt_ebitda = None
        if latest_debt and latest_ebitda and latest_ebitda != 0 and latest_cash:
            net_debt = latest_debt - latest_cash
            net_debt_ebitda = net_debt / latest_ebitda

        th = self._thresholds
        score = 0
        if net_debt_ebitda is not None:
            if net_debt_ebitda < th["nd_ebitda_safe"]:
                score += 0.5
            elif net_debt_ebitda < th["nd_ebitda_moderate"]:
                score += 0.2
            elif net_debt_ebitda > th["nd_ebitda_elevated"]:
                score -= 0.4
        if current_ratio and current_ratio > th["current_ratio_ok"] * 1.25:
            score += 0.2
        elif current_ratio and current_ratio < th["current_ratio_ok"]:
            score -= 0.2

        return {
            "step": 8,
            "title": "Balance Sheet Analysis",
            "key_questions": [
                "Net Debt / EBITDA: leverage level? (<2x strong, 2-4x moderate, >4x elevated)",
                "Current ratio and quick ratio: short-term liquidity?",
                "ROCE (Return on Capital Employed): above WACC?",
                "ROE (Return on Equity): quality of equity returns?",
                "Credit rating: investment grade or high yield?",
            ],
            "data": {
                "net_debt_ebitda": round(net_debt_ebitda, 2) if net_debt_ebitda is not None else "N/A",
                "debt_to_equity_pct": _safe(dte),
                "current_ratio": _safe(current_ratio),
                "quick_ratio": _safe(quick_ratio),
                "roe": _fmt_pct(roe),
                "roa": _fmt_pct(roa),
                "total_debt_latest": _fmt_bn(latest_debt),
                "cash_latest": _fmt_bn(latest_cash),
                "leverage_assessment": (
                    f"Strong balance sheet (<{th['nd_ebitda_safe']}x Net Debt/EBITDA for {th['label']} sector)"
                    if net_debt_ebitda is not None and net_debt_ebitda < th["nd_ebitda_safe"]
                    else f"Moderate leverage ({th['nd_ebitda_safe']}–{th['nd_ebitda_moderate']}x, sector normal range)"
                    if net_debt_ebitda is not None and net_debt_ebitda < th["nd_ebitda_moderate"]
                    else f"Elevated leverage ({th['nd_ebitda_moderate']}–{th['nd_ebitda_elevated']}x) — monitor carefully"
                    if net_debt_ebitda is not None and net_debt_ebitda < th["nd_ebitda_elevated"]
                    else f"High leverage (>{th['nd_ebitda_elevated']}x) — distress risk for {th['label']} sector"
                ),
                "sector_leverage_benchmarks": {
                    "safe": f"<{th['nd_ebitda_safe']}x",
                    "moderate": f"{th['nd_ebitda_safe']}–{th['nd_ebitda_moderate']}x",
                    "elevated": f"{th['nd_ebitda_moderate']}–{th['nd_ebitda_elevated']}x",
                    "high": f">{th['nd_ebitda_elevated']}x",
                },
            },
            "conclusion": (
                f"Net Debt/EBITDA: {round(net_debt_ebitda, 2) if net_debt_ebitda is not None else 'N/A'}x "
                f"(sector safe threshold: <{th['nd_ebitda_safe']}x for {th['label']}) — "
                f"{'strong balance sheet for sector' if net_debt_ebitda is not None and net_debt_ebitda < th['nd_ebitda_safe'] else 'moderate leverage' if net_debt_ebitda is not None and net_debt_ebitda < th['nd_ebitda_moderate'] else 'elevated leverage, credit risk present'}. "
                f"Current ratio: {_safe(current_ratio, 'N/A')} "
                f"(sector minimum: {th['current_ratio_ok']}x — "
                f"{'adequate liquidity' if current_ratio and current_ratio >= th['current_ratio_ok'] else 'liquidity concern'}). "
                f"ROE: {_fmt_pct(roe)}, ROA: {_fmt_pct(roa)}."
            ),
            "score": round(score, 2),
        }

    # ── Step 9: Earnings Estimates ────────────────────────────────────────────

    def _step9_earnings_estimates(self) -> dict:
        analyst_target = _safe(self._ratios.get("analyst_target"))
        current_price = _safe(self._info.get("current_price"))
        forward_pe = _safe(self._ratios.get("forward_pe"))
        trailing_pe = _safe(self._ratios.get("pe_ratio"))
        earnings_growth = _safe(self._ratios.get("earnings_growth"))
        revenue_growth = _safe(self._ratios.get("revenue_growth"))

        upside = None
        if analyst_target and current_price and current_price > 0:
            upside = (analyst_target - current_price) / current_price

        peg = None
        if trailing_pe and earnings_growth and earnings_growth > 0:
            peg = trailing_pe / (earnings_growth * 100)

        score = 0
        if upside and upside > 0.15:
            score += 0.4
        elif upside and upside < -0.10:
            score -= 0.3
        if peg and peg < 1.5:
            score += 0.2
        elif peg and peg > 3:
            score -= 0.2

        return {
            "step": 9,
            "title": "Earnings Estimates",
            "key_questions": [
                "What is the analyst consensus for next 12-month EPS and revenue?",
                "What is the implied upside/downside to consensus price target?",
                "PEG ratio (P/E / growth): is the company fairly valued relative to growth?",
                "Are estimates being revised upward (positive momentum) or downward?",
                "What are the key assumptions behind the consensus model?",
            ],
            "data": {
                "current_price": current_price,
                "analyst_target_price": analyst_target,
                "implied_upside": _fmt_pct(upside),
                "trailing_pe": _safe(trailing_pe),
                "forward_pe": _safe(forward_pe),
                "earnings_growth_yoy": _fmt_pct(earnings_growth),
                "revenue_growth_yoy": _fmt_pct(revenue_growth),
                "peg_ratio": round(peg, 2) if peg else "N/A",
                "peg_assessment": (
                    "Undervalued relative to growth (PEG <1.5)" if peg and peg < 1.5
                    else "Fairly valued (PEG 1.5-2.5)" if peg and peg < 2.5
                    else "Expensive relative to growth (PEG >2.5)"
                ),
            },
            "conclusion": (
                f"Analyst consensus target: ${analyst_target:.2f} vs current ${current_price:.2f} "
                f"({'upside' if upside and upside > 0 else 'downside'}: {_fmt_pct(abs(upside) if upside else 0)}). "
                f"Forward P/E: {_safe(forward_pe, 'N/A')}x, PEG: {round(peg, 2) if peg else 'N/A'}. "
                f"Earnings growth: {_fmt_pct(earnings_growth)}."
            ) if analyst_target and current_price else "Analyst consensus data unavailable.",
            "score": round(score, 2),
        }

    # ── Step 10: Valuation ────────────────────────────────────────────────────

    def _step10_valuation(self) -> dict:
        pe = _safe(self._ratios.get("pe_ratio"))
        forward_pe = _safe(self._ratios.get("forward_pe"))
        pb = _safe(self._ratios.get("pb_ratio"))
        ps = _safe(self._ratios.get("ps_ratio"))
        ev_ebitda = _safe(self._ratios.get("ev_ebitda"))
        ev_revenue = _safe(self._ratios.get("ev_revenue"))
        div_yield = _safe(self._ratios.get("dividend_yield"))

        th = self._thresholds
        score = 0
        if pe:
            if pe < th["pe_cheap"]:
                score += 0.5
            elif pe < th["pe_fair"]:
                score += 0.2
            elif pe > th["pe_expensive"]:
                score -= 0.3
        if ev_ebitda:
            if ev_ebitda < th["ev_ebitda_cheap"]:
                score += 0.3
            elif ev_ebitda > th["ev_ebitda_expensive"]:
                score -= 0.2

        return {
            "step": 10,
            "title": "Company Valuation",
            "key_questions": [
                "P/E ratio: how does it compare to sector average and historical?",
                "EV/EBITDA: enterprise value multiple vs. comparable companies?",
                "P/B ratio: premium or discount to book value?",
                "DCF intrinsic value: implied growth rate at current price?",
                "Comparable multiples (analogical approach): peers' valuation?",
            ],
            "data": {
                "pe_ratio": _safe(pe),
                "forward_pe": _safe(forward_pe),
                "pb_ratio": _safe(pb),
                "ps_ratio": _safe(ps),
                "ev_ebitda": _safe(ev_ebitda),
                "ev_revenue": _safe(ev_revenue),
                "dividend_yield": _fmt_pct(div_yield),
                "valuation_summary": {
                    "pe_assessment": (
                        f"Cheap (<{th['pe_cheap']}x for {th['label']})" if pe and pe < th["pe_cheap"]
                        else f"Fair ({th['pe_cheap']}–{th['pe_fair']}x)" if pe and pe < th["pe_fair"]
                        else f"Rich ({th['pe_fair']}–{th['pe_expensive']}x)" if pe and pe < th["pe_expensive"]
                        else f"Very expensive (>{th['pe_expensive']}x for {th['label']})" if pe
                        else "N/A"
                    ),
                    "ev_ebitda_assessment": (
                        f"Cheap (<{th['ev_ebitda_cheap']}x for {th['label']})" if ev_ebitda and ev_ebitda < th["ev_ebitda_cheap"]
                        else f"Fair ({th['ev_ebitda_cheap']}–{th['ev_ebitda_fair']}x)" if ev_ebitda and ev_ebitda < th["ev_ebitda_fair"]
                        else f"Rich ({th['ev_ebitda_fair']}–{th['ev_ebitda_expensive']}x)" if ev_ebitda and ev_ebitda < th["ev_ebitda_expensive"]
                        else f"Very expensive (>{th['ev_ebitda_expensive']}x for {th['label']})" if ev_ebitda
                        else "N/A"
                    ),
                    "sector_pe_benchmarks": {
                        "cheap": f"<{th['pe_cheap']}x",
                        "fair": f"{th['pe_cheap']}–{th['pe_fair']}x",
                        "expensive": f">{th['pe_expensive']}x",
                    },
                    "sector_ev_ebitda_benchmarks": {
                        "cheap": f"<{th['ev_ebitda_cheap']}x",
                        "fair": f"{th['ev_ebitda_cheap']}–{th['ev_ebitda_fair']}x",
                        "expensive": f">{th['ev_ebitda_expensive']}x",
                    },
                },
            },
            "conclusion": (
                f"P/E: {_safe(pe, 'N/A')}x (sector cheap <{th['pe_cheap']}x, expensive >{th['pe_expensive']}x for {th['label']}) — "
                f"{'cheap for sector' if pe and pe < th['pe_cheap'] else 'fair' if pe and pe < th['pe_fair'] else 'expensive for sector'}. "
                f"EV/EBITDA: {_fmt_x(ev_ebitda)} (sector cheap <{th['ev_ebitda_cheap']}x). "
                f"P/B: {_safe(pb, 'N/A')}x, P/S: {_safe(ps, 'N/A')}x. "
                f"{'Valuation is attractive relative to sector fundamentals.' if score > 0.4 else 'Valuation is demanding — growth must materialize to justify current price.' if score < 0 else 'Valuation appears fair for the sector.'}"
            ),
            "score": round(score, 2),
        }

    # ── Step 11: Stock Reputation ─────────────────────────────────────────────

    def _step11_stock_reputation(self) -> dict:
        beta = _safe(self._ratios.get("beta"))
        short_ratio = _safe(self._ratios.get("short_ratio"))
        analyst_rec = _safe(self._ratios.get("analyst_recommendation"))
        analyst_target = _safe(self._ratios.get("analyst_target"))
        current_price = _safe(self._info.get("current_price"))
        high_52w = _safe(self._ratios.get("52w_high"))
        low_52w = _safe(self._ratios.get("52w_low"))

        pct_from_high = None
        pct_from_low = None
        if current_price and high_52w and low_52w:
            pct_from_high = (current_price - high_52w) / high_52w
            pct_from_low = (current_price - low_52w) / low_52w

        score = 0
        if analyst_rec and analyst_rec < 2.5:
            score += 0.4
        elif analyst_rec and analyst_rec > 3.5:
            score -= 0.3
        if short_ratio and short_ratio > 10:
            score -= 0.2

        return {
            "step": 11,
            "title": "Stock Reputation (Réputation Boursière)",
            "key_questions": [
                "What is the analyst consensus rating (1=Strong Buy, 5=Strong Sell)?",
                "Short interest: is the market betting against this stock?",
                "52-week high/low: where is the stock relative to its range?",
                "Beta: how volatile is the stock vs. the market?",
                "Institutional ownership: who holds this stock?",
            ],
            "data": {
                "analyst_consensus_score": analyst_rec,
                "analyst_consensus_label": (
                    "Strong Buy" if analyst_rec and analyst_rec < 1.5
                    else "Buy" if analyst_rec and analyst_rec < 2.5
                    else "Hold" if analyst_rec and analyst_rec < 3.5
                    else "Sell" if analyst_rec and analyst_rec < 4.5
                    else "Strong Sell" if analyst_rec
                    else "N/A"
                ),
                "analyst_price_target": analyst_target,
                "current_price": current_price,
                "52w_high": high_52w,
                "52w_low": low_52w,
                "pct_from_52w_high": _fmt_pct(pct_from_high),
                "pct_from_52w_low": _fmt_pct(pct_from_low),
                "beta": beta,
                "short_ratio_days": short_ratio,
            },
            "conclusion": (
                f"Analyst consensus: {analyst_rec:.1f}/5 "
                f"({'Buy signal' if analyst_rec and analyst_rec < 2.5 else 'Sell signal' if analyst_rec and analyst_rec > 3.5 else 'Hold'}). "
                f"Current price {_fmt_pct(pct_from_high)} from 52W high / {_fmt_pct(pct_from_low)} from 52W low. "
                f"Short ratio: {short_ratio or 'N/A'} days "
                f"({'elevated — significant bearish positioning' if short_ratio and short_ratio > 10 else 'normal'}). "
                f"Beta: {beta or 'N/A'}."
            ) if analyst_rec else "Analyst data unavailable.",
            "score": round(score, 2),
        }

    # ── Step 12: Re-rating Levers & Momentum ─────────────────────────────────

    def _step12_rerating_momentum(self) -> dict:
        revenue_growth = _safe(self._ratios.get("revenue_growth"))
        earnings_growth = _safe(self._ratios.get("earnings_growth"))
        analyst_target = _safe(self._ratios.get("analyst_target"))
        current_price = _safe(self._info.get("current_price"))
        forward_pe = _safe(self._ratios.get("forward_pe"))
        trailing_pe = _safe(self._ratios.get("pe_ratio"))

        pe_compression = None
        if forward_pe and trailing_pe:
            pe_compression = (forward_pe - trailing_pe) / trailing_pe

        upside = None
        if analyst_target and current_price and current_price > 0:
            upside = (analyst_target - current_price) / current_price

        catalysts = []
        if revenue_growth and revenue_growth > 0.10:
            catalysts.append("Strong organic revenue growth above 10%")
        if earnings_growth and earnings_growth > revenue_growth if (earnings_growth and revenue_growth) else False:
            catalysts.append("Earnings growing faster than revenue — positive operating leverage")
        if upside and upside > 0.20:
            catalysts.append(f"Significant analyst upside target ({_fmt_pct(upside)})")
        if pe_compression and pe_compression < -0.1:
            catalysts.append("P/E de-rating expected — forward earnings expansion")

        risks = []
        if revenue_growth and revenue_growth < 0:
            risks.append("Revenue contraction — top-line headwinds")
        if upside and upside < -0.10:
            risks.append("Downside to analyst consensus price target")
        if pe_compression and pe_compression > 0.10:
            risks.append("P/E expansion baked in — execution risk")

        score = 0
        if len(catalysts) >= 2:
            score += 0.4
        elif len(catalysts) == 1:
            score += 0.2
        if len(risks) >= 2:
            score -= 0.3
        elif len(risks) == 1:
            score -= 0.1

        return {
            "step": 12,
            "title": "Re-rating Levers & Momentum",
            "key_questions": [
                "What are the main catalysts that could trigger a re-rating (higher valuation multiple)?",
                "Earnings revision momentum: are estimates moving up or down?",
                "Is there M&A potential (acquiree or acquiror)?",
                "ESG re-rating: any upcoming sustainability catalysts?",
                "What is the main risk that could derail the thesis?",
            ],
            "data": {
                "identified_catalysts": catalysts,
                "identified_risks": risks,
                "pe_compression_decompression": _fmt_pct(pe_compression),
                "implied_upside_to_target": _fmt_pct(upside),
                "earnings_growth": _fmt_pct(earnings_growth),
                "revenue_growth": _fmt_pct(revenue_growth),
            },
            "conclusion": (
                f"Identified {len(catalysts)} re-rating catalyst(s) and {len(risks)} risk(s). "
                f"{'Key catalysts: ' + '; '.join(catalysts[:2]) + '.' if catalysts else 'No strong re-rating catalysts identified.'} "
                f"{'Key risks: ' + '; '.join(risks[:2]) + '.' if risks else ''} "
                f"Momentum score: {'positive' if score > 0 else 'negative' if score < 0 else 'neutral'}."
            ),
            "score": round(score, 2),
        }

    # ── Summary ───────────────────────────────────────────────────────────────

    def _build_summary(self, rating: str, steps: dict) -> str:
        name = self._info.get("name", self.ticker)
        sector = self._info.get("sector", "")
        revenue_growth = _safe(self._ratios.get("revenue_growth"))
        op_margin = _safe(self._ratios.get("operating_margin"))
        pe = _safe(self._ratios.get("pe_ratio"))
        ev_ebitda = _safe(self._ratios.get("ev_ebitda"))
        analyst_rec = _safe(self._ratios.get("analyst_recommendation"))
        current_price = _safe(self._info.get("current_price"))
        analyst_target = _safe(self._ratios.get("analyst_target"))

        parts = [f"{name} ({self.ticker}) is a {sector} company."]
        if revenue_growth:
            parts.append(f"Revenue grew {_fmt_pct(revenue_growth)} YoY.")
        if op_margin:
            parts.append(f"Operating margin: {_fmt_pct(op_margin)}.")
        if pe:
            parts.append(f"Trades at {pe:.1f}x trailing earnings")
            if ev_ebitda:
                parts[-1] += f" and {ev_ebitda:.1f}x EV/EBITDA."
        if analyst_target and current_price:
            upside = (analyst_target - current_price) / current_price
            parts.append(
                f"Analyst consensus implies {_fmt_pct(abs(upside))} "
                f"{'upside' if upside > 0 else 'downside'} to ${analyst_target:.2f}."
            )
        parts.append(f"12-step composite assessment: {rating}.")
        return " ".join(parts)
