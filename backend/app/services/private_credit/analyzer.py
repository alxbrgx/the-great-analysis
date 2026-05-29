"""
Private credit / leveraged loan analysis engine.
No ticker required — all inputs are manual (from CIM / financial model).
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Optional


# ── Input schema ──────────────────────────────────────────────────────────────

@dataclass
class PrivateCreditInput:
    # Company
    company_name: str
    industry: str
    fiscal_year: int
    currency: str = "USD"

    # P&L
    revenue: float = 0.0
    ebitda: float = 0.0
    ebit: float = 0.0
    interest_expense: float = 0.0
    tax_rate: float = 0.25

    # Cash flow
    cfo: float = 0.0
    capex: float = 0.0

    # Balance sheet
    cash: float = 0.0
    total_debt: float = 0.0
    senior_secured_debt: float = 0.0
    subordinated_debt: float = 0.0
    revolving_credit_facility: float = 0.0
    rcf_drawn: float = 0.0

    # Deal structure (optional)
    enterprise_value: float = 0.0
    equity_contribution: float = 0.0
    purchase_price: float = 0.0

    # Covenants (0 = no covenant)
    covenant_net_leverage_max: float = 0.0
    covenant_interest_coverage_min: float = 0.0
    covenant_capex_max: float = 0.0

    # Debt details (for waterfall)
    tranche_a_amount: float = 0.0
    tranche_a_rate: float = 0.0
    tranche_b_amount: float = 0.0
    tranche_b_rate: float = 0.0
    tranche_b_amort_years: float = 7.0
    tranche_a_amort_years: float = 5.0


# ── Implied rating table ───────────────────────────────────────────────────────

_RATING_TABLE = [
    (2.0,  "BB+", "Ba1", "BB+"),
    (2.5,  "BB",  "Ba2", "BB"),
    (3.0,  "BB-", "Ba3", "BB-"),
    (3.5,  "B+",  "B1",  "B+"),
    (4.0,  "B",   "B2",  "B"),
    (4.5,  "B-",  "B3",  "B-"),
    (5.5,  "CCC+","Caa1","CCC+"),
    (6.5,  "CCC", "Caa2","CCC"),
    (9999, "CCC-","Caa3","CCC-"),
]


def _implied_rating(nd_ebitda: float) -> dict:
    for threshold, sp, moodys, fitch in _RATING_TABLE:
        if nd_ebitda <= threshold:
            return {"sp": sp, "moodys": moodys, "fitch": fitch}
    return {"sp": "D", "moodys": "Ca", "fitch": "D"}


# ── Core ratios ────────────────────────────────────────────────────────────────

def _safe_div(a: float, b: float, default: Optional[float] = None) -> Optional[float]:
    if b == 0:
        return default
    return round(a / b, 2)


def _credit_ratios(inp: PrivateCreditInput) -> dict:
    net_debt = inp.total_debt - inp.cash
    senior_net_debt = inp.senior_secured_debt - inp.cash
    fcf = inp.cfo - inp.capex
    ebitda_minus_capex = inp.ebitda - inp.capex
    ebitda_margin = _safe_div(inp.ebitda, inp.revenue)
    net_margin = _safe_div(inp.ebit * (1 - inp.tax_rate), inp.revenue)
    cash_conversion = _safe_div(fcf, inp.ebitda)
    ev_ebitda = _safe_div(inp.enterprise_value, inp.ebitda)
    equity_pct = _safe_div(inp.equity_contribution, inp.enterprise_value)

    nd_ebitda = _safe_div(net_debt, inp.ebitda)
    senior_leverage = _safe_div(senior_net_debt, inp.ebitda)
    total_leverage = _safe_div(inp.total_debt, inp.ebitda)
    icr = _safe_div(inp.ebitda, inp.interest_expense)
    dscr = _safe_div(ebitda_minus_capex, inp.interest_expense)
    fcf_yield = _safe_div(fcf, inp.enterprise_value) if inp.enterprise_value else None

    return {
        "net_debt": round(net_debt, 1),
        "senior_net_debt": round(senior_net_debt, 1),
        "fcf": round(fcf, 1),
        "ebitda_minus_capex": round(ebitda_minus_capex, 1),
        "ebitda_margin": ebitda_margin,
        "net_margin": net_margin,
        "cash_conversion": cash_conversion,
        "ev_ebitda": ev_ebitda,
        "equity_pct": equity_pct,
        # Leverage
        "nd_ebitda": nd_ebitda,
        "senior_leverage": senior_leverage,
        "total_leverage": total_leverage,
        # Coverage
        "icr": icr,
        "dscr": dscr,
        "fcf_yield": fcf_yield,
    }


# ── Covenant headroom ─────────────────────────────────────────────────────────

def _covenant_headroom(inp: PrivateCreditInput, ratios: dict) -> list[dict]:
    items = []

    if inp.covenant_net_leverage_max > 0 and ratios["nd_ebitda"] is not None:
        headroom = inp.covenant_net_leverage_max - ratios["nd_ebitda"]
        headroom_pct = _safe_div(headroom, inp.covenant_net_leverage_max)
        items.append({
            "name": "Net Leverage",
            "covenant": f"≤ {inp.covenant_net_leverage_max:.1f}x",
            "actual": f"{ratios['nd_ebitda']:.2f}x",
            "headroom_turns": round(headroom, 2),
            "headroom_pct": headroom_pct,
            "status": "ok" if headroom > 0.5 else ("warning" if headroom > 0 else "breach"),
        })

    if inp.covenant_interest_coverage_min > 0 and ratios["icr"] is not None:
        headroom = ratios["icr"] - inp.covenant_interest_coverage_min
        headroom_pct = _safe_div(headroom, inp.covenant_interest_coverage_min)
        items.append({
            "name": "Interest Coverage",
            "covenant": f"≥ {inp.covenant_interest_coverage_min:.1f}x",
            "actual": f"{ratios['icr']:.2f}x",
            "headroom_turns": round(headroom, 2),
            "headroom_pct": headroom_pct,
            "status": "ok" if headroom > 0.5 else ("warning" if headroom > 0 else "breach"),
        })

    if inp.covenant_capex_max > 0:
        headroom = inp.covenant_capex_max - inp.capex
        items.append({
            "name": "Capex",
            "covenant": f"≤ {inp.covenant_capex_max:.1f}",
            "actual": f"{inp.capex:.1f}",
            "headroom_turns": round(headroom, 1),
            "headroom_pct": _safe_div(headroom, inp.covenant_capex_max),
            "status": "ok" if headroom > 0 else "breach",
        })

    return items


# ── Stress test ────────────────────────────────────────────────────────────────

def _stress_test(inp: PrivateCreditInput, base_ratios: dict) -> list[dict]:
    scenarios = [
        ("Base", 0.0, 0.0),
        ("Downside  (Rev -10%, Margin -200bps)", -0.10, -0.02),
        ("Severe  (Rev -20%, Margin -400bps)", -0.20, -0.04),
    ]
    results = []
    base_margin = inp.ebitda / inp.revenue if inp.revenue else 0

    for label, rev_shock, margin_shock in scenarios:
        stressed_revenue = inp.revenue * (1 + rev_shock)
        stressed_margin = base_margin + margin_shock
        stressed_ebitda = stressed_revenue * stressed_margin
        stressed_fcf = stressed_ebitda * (inp.cfo / inp.ebitda if inp.ebitda else 0) - inp.capex
        stressed_nd_ebitda = _safe_div(base_ratios["net_debt"], stressed_ebitda)
        stressed_icr = _safe_div(stressed_ebitda, inp.interest_expense)
        results.append({
            "scenario": label,
            "revenue": round(stressed_revenue, 1),
            "ebitda": round(stressed_ebitda, 1),
            "ebitda_margin": round(stressed_margin * 100, 1),
            "fcf": round(stressed_fcf, 1),
            "nd_ebitda": stressed_nd_ebitda,
            "icr": stressed_icr,
        })

    return results


# ── Debt waterfall ─────────────────────────────────────────────────────────────

def _debt_waterfall(inp: PrivateCreditInput) -> list[dict]:
    items = []
    if inp.tranche_a_amount > 0:
        items.append({
            "label": "Term Loan A",
            "amount": inp.tranche_a_amount,
            "rate": inp.tranche_a_rate,
            "annual_interest": round(inp.tranche_a_amount * inp.tranche_a_rate, 1),
            "maturity_years": inp.tranche_a_amort_years,
            "type": "senior_secured",
        })
    if inp.tranche_b_amount > 0:
        items.append({
            "label": "Term Loan B",
            "amount": inp.tranche_b_amount,
            "rate": inp.tranche_b_rate,
            "annual_interest": round(inp.tranche_b_amount * inp.tranche_b_rate, 1),
            "maturity_years": inp.tranche_b_amort_years,
            "type": "senior_secured",
        })
    if inp.revolving_credit_facility > 0:
        items.append({
            "label": "RCF",
            "amount": inp.revolving_credit_facility,
            "drawn": inp.rcf_drawn,
            "rate": None,
            "type": "revolving",
        })
    if inp.subordinated_debt > 0:
        items.append({
            "label": "Subordinated / PIK",
            "amount": inp.subordinated_debt,
            "rate": None,
            "type": "subordinated",
        })
    return items


# ── Credit assessment ─────────────────────────────────────────────────────────

def _credit_assessment(ratios: dict, stress: list[dict]) -> dict:
    nd = ratios.get("nd_ebitda") or 0
    icr = ratios.get("icr") or 0
    dscr = ratios.get("dscr") or 0
    cash_conv = ratios.get("cash_conversion") or 0

    # Score each dimension 1–5 (5 = best)
    scores = {}

    if nd < 2:       scores["leverage"] = 5
    elif nd < 3:     scores["leverage"] = 4
    elif nd < 4:     scores["leverage"] = 3
    elif nd < 5:     scores["leverage"] = 2
    else:            scores["leverage"] = 1

    if icr > 5:      scores["coverage"] = 5
    elif icr > 3.5:  scores["coverage"] = 4
    elif icr > 2.5:  scores["coverage"] = 3
    elif icr > 1.5:  scores["coverage"] = 2
    else:            scores["coverage"] = 1

    if dscr > 2:     scores["dscr"] = 5
    elif dscr > 1.5: scores["dscr"] = 4
    elif dscr > 1.2: scores["dscr"] = 3
    elif dscr > 1.0: scores["dscr"] = 2
    else:            scores["dscr"] = 1

    if cash_conv > 0.7:   scores["cash_conv"] = 5
    elif cash_conv > 0.5: scores["cash_conv"] = 4
    elif cash_conv > 0.3: scores["cash_conv"] = 3
    elif cash_conv > 0:   scores["cash_conv"] = 2
    else:                 scores["cash_conv"] = 1

    total = sum(scores.values())
    max_score = len(scores) * 5

    if total >= max_score * 0.8:       verdict = "Strong Credit"
    elif total >= max_score * 0.65:    verdict = "Adequate Credit"
    elif total >= max_score * 0.5:     verdict = "Marginal Credit"
    elif total >= max_score * 0.35:    verdict = "Weak Credit"
    else:                              verdict = "Distressed"

    # Severe stress ND/EBITDA
    severe = next((s for s in stress if "Severe" in s["scenario"]), None)
    severe_nd = severe["nd_ebitda"] if severe else None

    return {
        "scores": scores,
        "total_score": total,
        "max_score": max_score,
        "verdict": verdict,
        "implied_rating": _implied_rating(nd),
        "severe_stress_nd_ebitda": severe_nd,
    }


# ── Main entry point ──────────────────────────────────────────────────────────

def analyze_private_credit(inp: PrivateCreditInput) -> dict:
    ratios = _credit_ratios(inp)
    covenants = _covenant_headroom(inp, ratios)
    stress = _stress_test(inp, ratios)
    waterfall = _debt_waterfall(inp)
    assessment = _credit_assessment(ratios, stress)

    return {
        "company": {
            "name": inp.company_name,
            "industry": inp.industry,
            "fiscal_year": inp.fiscal_year,
            "currency": inp.currency,
        },
        "income": {
            "revenue": inp.revenue,
            "ebitda": inp.ebitda,
            "ebit": inp.ebit,
            "interest_expense": inp.interest_expense,
            "capex": inp.capex,
            "cfo": inp.cfo,
        },
        "balance_sheet": {
            "cash": inp.cash,
            "total_debt": inp.total_debt,
            "senior_secured_debt": inp.senior_secured_debt,
            "subordinated_debt": inp.subordinated_debt,
            "net_debt": ratios["net_debt"],
        },
        "ratios": ratios,
        "covenants": covenants,
        "stress_test": stress,
        "debt_waterfall": waterfall,
        "assessment": assessment,
    }
