"""
Private credit analysis API — no ticker required.
All inputs are manual (CIM / financial model data).
"""
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional

from app.services.private_credit.analyzer import PrivateCreditInput, analyze_private_credit

router = APIRouter()


class PrivateCreditRequest(BaseModel):
    # Company
    company_name: str = Field(..., description="Company name")
    industry: str = Field(..., description="Industry / sector")
    fiscal_year: int = Field(..., description="Fiscal year of the data")
    currency: str = Field("USD", description="Reporting currency")

    # P&L
    revenue: float = Field(0.0, ge=0)
    ebitda: float = Field(0.0)
    ebit: float = Field(0.0)
    interest_expense: float = Field(0.0, ge=0)
    tax_rate: float = Field(0.25, ge=0, le=1)

    # Cash flow
    cfo: float = Field(0.0, description="Cash from operations")
    capex: float = Field(0.0, ge=0)

    # Balance sheet
    cash: float = Field(0.0, ge=0)
    total_debt: float = Field(0.0, ge=0)
    senior_secured_debt: float = Field(0.0, ge=0)
    subordinated_debt: float = Field(0.0, ge=0)
    revolving_credit_facility: float = Field(0.0, ge=0)
    rcf_drawn: float = Field(0.0, ge=0)

    # Deal structure
    enterprise_value: float = Field(0.0, ge=0)
    equity_contribution: float = Field(0.0, ge=0)
    purchase_price: float = Field(0.0, ge=0)

    # Covenants
    covenant_net_leverage_max: float = Field(0.0, ge=0)
    covenant_interest_coverage_min: float = Field(0.0, ge=0)
    covenant_capex_max: float = Field(0.0, ge=0)

    # Debt tranches
    tranche_a_amount: float = Field(0.0, ge=0)
    tranche_a_rate: float = Field(0.0, ge=0)
    tranche_a_amort_years: float = Field(5.0, ge=1)
    tranche_b_amount: float = Field(0.0, ge=0)
    tranche_b_rate: float = Field(0.0, ge=0)
    tranche_b_amort_years: float = Field(7.0, ge=1)


@router.post("/analyze")
async def analyze(req: PrivateCreditRequest):
    inp = PrivateCreditInput(**req.model_dump())
    return analyze_private_credit(inp)
