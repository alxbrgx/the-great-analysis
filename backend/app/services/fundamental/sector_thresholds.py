"""
Sector-specific scoring thresholds for the 12-step fundamental analysis.

Why sector-specific?
  A 30% gross margin is excellent for a food retailer but mediocre for a SaaS company.
  A P/E of 40x is reckless for a utility but reasonable for a high-growth tech name.
  Generic thresholds systematically mis-score companies outside the median sector profile.

Structure:
  Each sector entry has thresholds for the metrics that vary most by sector.
  A "default" entry covers unknown / unlisted sectors.

Threshold keys used in analyzer steps:
  gross_margin_strong / gross_margin_ok
  op_margin_strong / op_margin_ok
  growth_high / growth_moderate
  nd_ebitda_safe / nd_ebitda_moderate / nd_ebitda_elevated
  pe_cheap / pe_fair / pe_expensive
  ev_ebitda_cheap / ev_ebitda_fair / ev_ebitda_expensive
  current_ratio_ok
  fcf_yield_good

"""

SECTOR_THRESHOLDS: dict[str, dict] = {

    # ── Technology (software, semis, hardware, internet) ──────────────────────
    "Technology": {
        "gross_margin_strong":   0.65,   # SaaS typically 70%+, hardware 45%+
        "gross_margin_ok":       0.45,
        "op_margin_strong":      0.20,
        "op_margin_ok":          0.10,
        "growth_high":           0.15,
        "growth_moderate":       0.06,
        "nd_ebitda_safe":        1.5,    # Tech can carry modest debt given strong FCF
        "nd_ebitda_moderate":    3.0,
        "nd_ebitda_elevated":    5.0,
        "pe_cheap":              20.0,   # Cheap tech is still 20x
        "pe_fair":               35.0,
        "pe_expensive":          55.0,
        "ev_ebitda_cheap":       12.0,
        "ev_ebitda_fair":        22.0,
        "ev_ebitda_expensive":   35.0,
        "current_ratio_ok":      1.2,
        "label": "Technology",
    },

    # ── Communication Services (media, telecom, streaming, social) ────────────
    "Communication Services": {
        "gross_margin_strong":   0.55,
        "gross_margin_ok":       0.35,
        "op_margin_strong":      0.18,
        "op_margin_ok":          0.08,
        "growth_high":           0.12,
        "growth_moderate":       0.04,
        "nd_ebitda_safe":        2.0,
        "nd_ebitda_moderate":    3.5,
        "nd_ebitda_elevated":    5.5,
        "pe_cheap":              16.0,
        "pe_fair":               28.0,
        "pe_expensive":          45.0,
        "ev_ebitda_cheap":       10.0,
        "ev_ebitda_fair":        18.0,
        "ev_ebitda_expensive":   28.0,
        "current_ratio_ok":      1.0,
        "label": "Communication Services",
    },

    # ── Healthcare (pharma, biotech, medtech, services) ───────────────────────
    "Healthcare": {
        "gross_margin_strong":   0.65,   # Pharma 80%+, devices 60%+, services 35%+
        "gross_margin_ok":       0.40,
        "op_margin_strong":      0.18,
        "op_margin_ok":          0.08,
        "growth_high":           0.12,
        "growth_moderate":       0.05,
        "nd_ebitda_safe":        1.5,
        "nd_ebitda_moderate":    3.0,
        "nd_ebitda_elevated":    5.0,
        "pe_cheap":              18.0,
        "pe_fair":               30.0,
        "pe_expensive":          50.0,
        "ev_ebitda_cheap":       12.0,
        "ev_ebitda_fair":        20.0,
        "ev_ebitda_expensive":   35.0,
        "current_ratio_ok":      1.5,
        "label": "Healthcare",
    },

    # ── Financials (banks, insurance, asset managers) ─────────────────────────
    # Note: gross_margin not meaningful for banks; operating_margin used differently
    "Financials": {
        "gross_margin_strong":   0.40,   # Net interest margin proxy
        "gross_margin_ok":       0.20,
        "op_margin_strong":      0.25,
        "op_margin_ok":          0.12,
        "growth_high":           0.10,
        "growth_moderate":       0.03,
        "nd_ebitda_safe":        3.0,    # Banks structurally leveraged — different metric
        "nd_ebitda_moderate":    6.0,
        "nd_ebitda_elevated":    10.0,
        "pe_cheap":              8.0,
        "pe_fair":               13.0,
        "pe_expensive":          20.0,
        "ev_ebitda_cheap":       6.0,
        "ev_ebitda_fair":        11.0,
        "ev_ebitda_expensive":   18.0,
        "current_ratio_ok":      1.0,
        "label": "Financials",
    },

    # ── Consumer Discretionary (retail, autos, luxury, restaurants) ───────────
    "Consumer Discretionary": {
        "gross_margin_strong":   0.45,   # Luxury 70%+, fast food 30%+, auto 15%+
        "gross_margin_ok":       0.25,
        "op_margin_strong":      0.12,
        "op_margin_ok":          0.06,
        "growth_high":           0.10,
        "growth_moderate":       0.04,
        "nd_ebitda_safe":        1.5,
        "nd_ebitda_moderate":    3.0,
        "nd_ebitda_elevated":    5.0,
        "pe_cheap":              14.0,
        "pe_fair":               22.0,
        "pe_expensive":          35.0,
        "ev_ebitda_cheap":       8.0,
        "ev_ebitda_fair":        14.0,
        "ev_ebitda_expensive":   22.0,
        "current_ratio_ok":      1.2,
        "label": "Consumer Discretionary",
    },

    # ── Consumer Staples (food, beverages, household, tobacco) ────────────────
    "Consumer Staples": {
        "gross_margin_strong":   0.40,
        "gross_margin_ok":       0.25,
        "op_margin_strong":      0.15,
        "op_margin_ok":          0.08,
        "growth_high":           0.06,   # Staples grow slowly — 6% is strong
        "growth_moderate":       0.02,
        "nd_ebitda_safe":        2.0,
        "nd_ebitda_moderate":    3.5,
        "nd_ebitda_elevated":    5.5,
        "pe_cheap":              16.0,
        "pe_fair":               22.0,
        "pe_expensive":          30.0,
        "ev_ebitda_cheap":       10.0,
        "ev_ebitda_fair":        15.0,
        "ev_ebitda_expensive":   22.0,
        "current_ratio_ok":      1.0,
        "label": "Consumer Staples",
    },

    # ── Energy (oil majors, E&P, services, pipelines) ─────────────────────────
    "Energy": {
        "gross_margin_strong":   0.25,   # Integrated majors ~25%, services ~15%
        "gross_margin_ok":       0.12,
        "op_margin_strong":      0.15,
        "op_margin_ok":          0.06,
        "growth_high":           0.08,   # Cyclical — 8% is good
        "growth_moderate":       0.02,
        "nd_ebitda_safe":        1.0,
        "nd_ebitda_moderate":    2.0,
        "nd_ebitda_elevated":    3.5,    # Energy hates debt (commodity risk)
        "pe_cheap":              8.0,
        "pe_fair":               12.0,
        "pe_expensive":          20.0,
        "ev_ebitda_cheap":       4.0,
        "ev_ebitda_fair":        7.0,
        "ev_ebitda_expensive":   12.0,
        "current_ratio_ok":      1.0,
        "label": "Energy",
    },

    # ── Industrials (aerospace, defense, machinery, logistics, construction) ──
    "Industrials": {
        "gross_margin_strong":   0.35,
        "gross_margin_ok":       0.20,
        "op_margin_strong":      0.15,
        "op_margin_ok":          0.08,
        "growth_high":           0.08,
        "growth_moderate":       0.03,
        "nd_ebitda_safe":        1.5,
        "nd_ebitda_moderate":    3.0,
        "nd_ebitda_elevated":    5.0,
        "pe_cheap":              14.0,
        "pe_fair":               20.0,
        "pe_expensive":          30.0,
        "ev_ebitda_cheap":       8.0,
        "ev_ebitda_fair":        12.0,
        "ev_ebitda_expensive":   18.0,
        "current_ratio_ok":      1.2,
        "label": "Industrials",
    },

    # ── Utilities (electric, gas, water, renewable) ───────────────────────────
    "Utilities": {
        "gross_margin_strong":   0.30,
        "gross_margin_ok":       0.15,
        "op_margin_strong":      0.20,
        "op_margin_ok":          0.10,
        "growth_high":           0.04,   # Regulated — 4% is excellent
        "growth_moderate":       0.01,
        "nd_ebitda_safe":        3.0,    # Utilities are structurally levered
        "nd_ebitda_moderate":    5.0,
        "nd_ebitda_elevated":    7.0,
        "pe_cheap":              12.0,
        "pe_fair":               18.0,
        "pe_expensive":          25.0,
        "ev_ebitda_cheap":       8.0,
        "ev_ebitda_fair":        12.0,
        "ev_ebitda_expensive":   18.0,
        "current_ratio_ok":      0.8,
        "label": "Utilities",
    },

    # ── Materials (chemicals, mining, metals, paper, packaging) ──────────────
    "Materials": {
        "gross_margin_strong":   0.30,
        "gross_margin_ok":       0.15,
        "op_margin_strong":      0.15,
        "op_margin_ok":          0.07,
        "growth_high":           0.08,
        "growth_moderate":       0.02,
        "nd_ebitda_safe":        1.5,
        "nd_ebitda_moderate":    2.5,
        "nd_ebitda_elevated":    4.0,
        "pe_cheap":              10.0,
        "pe_fair":               16.0,
        "pe_expensive":          24.0,
        "ev_ebitda_cheap":       5.0,
        "ev_ebitda_fair":        9.0,
        "ev_ebitda_expensive":   14.0,
        "current_ratio_ok":      1.2,
        "label": "Materials",
    },

    # ── Real Estate (REITs — use FFO, not net income) ─────────────────────────
    "Real Estate": {
        "gross_margin_strong":   0.55,
        "gross_margin_ok":       0.35,
        "op_margin_strong":      0.30,
        "op_margin_ok":          0.15,
        "growth_high":           0.06,
        "growth_moderate":       0.02,
        "nd_ebitda_safe":        4.0,    # REITs use leverage structurally
        "nd_ebitda_moderate":    6.0,
        "nd_ebitda_elevated":    9.0,
        "pe_cheap":              12.0,
        "pe_fair":               22.0,
        "pe_expensive":          35.0,
        "ev_ebitda_cheap":       12.0,
        "ev_ebitda_fair":        20.0,
        "ev_ebitda_expensive":   30.0,
        "current_ratio_ok":      0.8,
        "label": "Real Estate",
    },
}

# Fallback for unknown / unlisted sectors
_DEFAULT: dict = {
    "gross_margin_strong":   0.40,
    "gross_margin_ok":       0.25,
    "op_margin_strong":      0.15,
    "op_margin_ok":          0.08,
    "growth_high":           0.10,
    "growth_moderate":       0.04,
    "nd_ebitda_safe":        2.0,
    "nd_ebitda_moderate":    3.5,
    "nd_ebitda_elevated":    5.5,
    "pe_cheap":              15.0,
    "pe_fair":               25.0,
    "pe_expensive":          40.0,
    "ev_ebitda_cheap":       10.0,
    "ev_ebitda_fair":        16.0,
    "ev_ebitda_expensive":   25.0,
    "current_ratio_ok":      1.2,
    "label": "General",
}


def get_thresholds(sector: str) -> dict:
    """Return sector-specific thresholds, falling back to generic defaults."""
    return SECTOR_THRESHOLDS.get(sector, _DEFAULT)
