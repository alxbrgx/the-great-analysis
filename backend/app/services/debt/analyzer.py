"""
Debt analysis: ratios, stress testing, recovery analysis.
"""
import pandas as pd
import yfinance as yf
from app.utils.data_fetcher import get_financial_statements, get_key_ratios_yf


class DebtAnalyzer:
    def __init__(self, ticker: str):
        self.ticker = ticker
        self._info = yf.Ticker(ticker).info
        self._statements = get_financial_statements(ticker)
        self._ratios = get_key_ratios_yf(ticker)

    def compute_ratios(self) -> dict:
        inc = self._statements.get("income_annual", pd.DataFrame())
        bal = self._statements.get("balance_annual", pd.DataFrame())
        cf = self._statements.get("cashflow_annual", pd.DataFrame())

        def safe_get(df, key):
            if df is not None and not df.empty and key in df.index:
                vals = df.loc[key]
                return {str(col.date()): float(v) for col, v in vals.items() if pd.notna(v)}
            return {}

        ebitda = safe_get(inc, "EBITDA")
        total_debt = safe_get(bal, "Total Debt")
        cash = safe_get(bal, "Cash And Cash Equivalents")
        interest_expense = safe_get(inc, "Interest Expense")
        operating_cf = safe_get(cf, "Operating Cash Flow")
        capex = safe_get(cf, "Capital Expenditure")

        # Net Debt / EBITDA
        net_debt_ebitda = {}
        for k in ebitda:
            if k in total_debt and k in cash and ebitda[k]:
                nd = total_debt.get(k, 0) - cash.get(k, 0)
                net_debt_ebitda[k] = nd / ebitda[k]

        # Interest Coverage Ratio (EBITDA / Interest Expense)
        icr = {}
        for k in ebitda:
            if k in interest_expense and interest_expense[k]:
                icr[k] = abs(ebitda[k] / interest_expense[k])

        # FCF (Operating CF - CAPEX)
        fcf = {}
        for k in operating_cf:
            if k in capex:
                fcf[k] = operating_cf[k] + capex.get(k, 0)  # capex is negative in yf

        # DSCR approximation
        dscr = {}
        for k in operating_cf:
            if k in interest_expense and interest_expense.get(k):
                dscr[k] = operating_cf[k] / abs(interest_expense[k])

        return {
            "ticker": self.ticker,
            "ratios": {
                "debt_to_equity": self._ratios.get("debt_to_equity"),
                "current_ratio": self._ratios.get("current_ratio"),
                "quick_ratio": self._ratios.get("quick_ratio"),
            },
            "time_series": {
                "net_debt_ebitda": net_debt_ebitda,
                "interest_coverage_ratio": icr,
                "free_cash_flow": fcf,
                "dscr": dscr,
                "total_debt": total_debt,
                "cash": cash,
                "ebitda": ebitda,
            },
            "interpretation": {
                "net_debt_ebitda": "< 2x: strong | 2-4x: moderate | > 4x: elevated | > 6x: distressed",
                "icr": "< 1.5x: alarm | 1.5-3x: caution | > 3x: comfortable",
                "dscr": "< 1x: cannot service debt | 1-1.2x: tight | > 1.2x: adequate",
            },
        }

    def stress_test(self) -> dict:
        ratios = self.compute_ratios()
        ts = ratios.get("time_series", {})
        ebitda_series = ts.get("ebitda", {})
        if not ebitda_series:
            return {"error": "Insufficient data for stress test"}

        latest_date = max(ebitda_series.keys())
        base_ebitda = ebitda_series[latest_date]
        base_icr = list(ts.get("interest_coverage_ratio", {}).values())[-1] if ts.get("interest_coverage_ratio") else None
        base_dscr = list(ts.get("dscr", {}).values())[-1] if ts.get("dscr") else None

        scenarios = {
            "base": {"revenue_shock": 0, "ebitda_shock": 0},
            "mild_stress": {"revenue_shock": -0.10, "ebitda_shock": -0.15},
            "severe_stress": {"revenue_shock": -0.20, "ebitda_shock": -0.30},
            "extreme_stress": {"revenue_shock": -0.35, "ebitda_shock": -0.50},
        }

        results = {}
        for name, s in scenarios.items():
            stressed_ebitda = base_ebitda * (1 + s["ebitda_shock"])
            results[name] = {
                "ebitda_stressed": stressed_ebitda,
                "icr_stressed": (stressed_ebitda / (base_ebitda / base_icr)) if base_icr else None,
                "revenue_drop": f"{s['revenue_shock']:.0%}",
                "ebitda_drop": f"{s['ebitda_shock']:.0%}",
            }

        return {
            "ticker": self.ticker,
            "methodology": (
                "Stress scenarios simulate deteriorating operating performance. "
                "Mild: moderate recession. Severe: significant downturn (-20% revenue). "
                "Extreme: deep crisis or sector disruption (-35% revenue). "
                "ICR below 1.5x in stressed scenarios signals high refinancing risk."
            ),
            "scenarios": results,
        }

    def recovery_analysis(self) -> dict:
        bal = self._statements.get("balance_annual", pd.DataFrame())

        def safe_latest(df, key):
            if df is not None and not df.empty and key in df.index:
                v = df.loc[key].dropna()
                return float(v.iloc[0]) if not v.empty else None
            return None

        total_assets = safe_latest(bal, "Total Assets")
        total_debt = safe_latest(bal, "Total Debt")
        goodwill = safe_latest(bal, "Goodwill")
        intangibles = safe_latest(bal, "Other Intangible Assets")

        tangible_assets = total_assets
        if tangible_assets and goodwill:
            tangible_assets -= goodwill
        if tangible_assets and intangibles:
            tangible_assets -= intangibles

        recovery_rate = None
        if tangible_assets and total_debt and total_debt > 0:
            recovery_rate = min(1.0, tangible_assets / total_debt)

        lgd = (1 - recovery_rate) if recovery_rate is not None else None

        return {
            "ticker": self.ticker,
            "methodology": (
                "Recovery analysis estimates how much creditors would recover in a default scenario. "
                "Tangible Asset Value = Total Assets - Goodwill - Intangibles (intangibles lose value in distress). "
                "Recovery Rate = Tangible Assets / Total Debt. LGD (Loss Given Default) = 1 - Recovery Rate."
            ),
            "total_assets": total_assets,
            "goodwill": goodwill,
            "tangible_asset_value": tangible_assets,
            "total_debt": total_debt,
            "estimated_recovery_rate": recovery_rate,
            "loss_given_default": lgd,
            "interpretation": (
                "Recovery Rate > 80%: senior secured creditors well-protected. "
                "50-80%: moderate recovery expected. "
                "< 50%: significant loss risk for unsecured creditors."
            ),
        }
