"""
Banking Regulations Seed Data
Comprehensive Basel III and IFRS 9 regulations for banks
"""

banking_regulations = [
    # Basel III - Pillar 1: Minimum Capital Requirements
    {
        "code": "BASEL-III-CAR",
        "title": "Basel III: Capital Adequacy Ratio (CAR)",
        "content": """
The Capital Adequacy Ratio (CAR) is a key measure of a bank's financial strength. Under Basel III, banks must maintain a minimum CAR of 8% of risk-weighted assets (RWA).

**Formula**: CAR = (Tier 1 Capital + Tier 2 Capital) / Risk-Weighted Assets × 100

**Minimum Requirements**:
- Total Capital Ratio: 8% of RWA
- Tier 1 Capital Ratio: 6% of RWA  
- Common Equity Tier 1 (CET1): 4.5% of RWA

**Capital Conservation Buffer**: Additional 2.5% of RWA, bringing total CET1 requirement to 7%

**Countercyclical Capital Buffer**: 0-2.5% of RWA (varies by jurisdiction and economic conditions)

**Purpose**: Ensures banks have sufficient capital to absorb unexpected losses and maintain operations during financial stress.
        """,
        "category": "Financial",
        "jurisdiction": "Global",
        "effective_date": "2019-01-01",
        "workflow_steps": [
            {
                "step": 1,
                "title": "Calculate Risk-Weighted Assets (RWA)",
                "description": "Determine RWA for credit risk, market risk, and operational risk",
                "checklist": [
                    "Classify all assets by risk category",
                    "Apply risk weights (0%, 20%, 50%, 100%, 150%)",
                    "Calculate credit risk RWA",
                    "Calculate market risk RWA",
                    "Calculate operational risk RWA",
                    "Sum total RWA"
                ]
            },
            {
                "step": 2,
                "title": "Determine Capital Components",
                "description": "Calculate Tier 1 and Tier 2 capital",
                "checklist": [
                    "Calculate Common Equity Tier 1 (CET1)",
                    "Calculate Additional Tier 1 (AT1)",
                    "Calculate Tier 2 capital",
                    "Apply regulatory adjustments",
                    "Verify capital quality"
                ]
            },
            {
                "step": 3,
                "title": "Calculate Capital Ratios",
                "description": "Compute CAR and component ratios",
                "checklist": [
                    "Calculate CET1 ratio",
                    "Calculate Tier 1 ratio",
                    "Calculate Total Capital ratio",
                    "Apply capital buffers",
                    "Compare against minimum requirements"
                ]
            },
            {
                "step": 4,
                "title": "Regulatory Reporting",
                "description": "Prepare and submit capital adequacy reports",
                "checklist": [
                    "Complete regulatory templates",
                    "Document methodology",
                    "Obtain management approval",
                    "Submit to supervisory authority",
                    "Maintain audit trail"
                ]
            }
        ]
    },
    
    # Basel III - Leverage Ratio
    {
        "code": "BASEL-III-LR",
        "title": "Basel III: Leverage Ratio",
        "content": """
The Leverage Ratio is a non-risk-based measure that supplements risk-based capital requirements. It limits the build-up of leverage in the banking sector.

**Formula**: Leverage Ratio = Tier 1 Capital / Total Exposure × 100

**Minimum Requirement**: 3% (some jurisdictions require higher ratios for systemically important banks)

**Total Exposure Includes**:
- On-balance sheet exposures
- Derivative exposures
- Securities financing transaction exposures
- Off-balance sheet items

**Purpose**: Prevents excessive leverage and provides a backstop to risk-based capital measures.

**Reporting**: Must be disclosed publicly on a quarterly basis under Pillar 3.
        """,
        "category": "Financial",
        "jurisdiction": "Global",
        "effective_date": "2018-01-01",
        "workflow_steps": [
            {
                "step": 1,
                "title": "Calculate Total Exposure",
                "description": "Determine all on and off-balance sheet exposures",
                "checklist": [
                    "Sum on-balance sheet assets",
                    "Calculate derivative exposures (replacement cost + add-on)",
                    "Calculate securities financing exposures",
                    "Convert off-balance sheet items",
                    "Apply netting where permitted"
                ]
            },
            {
                "step": 2,
                "title": "Calculate Leverage Ratio",
                "description": "Compute ratio and compare to minimum",
                "checklist": [
                    "Obtain Tier 1 capital amount",
                    "Divide by total exposure",
                    "Multiply by 100 for percentage",
                    "Compare to 3% minimum",
                    "Document any shortfall"
                ]
            }
        ]
    },
    
    # IFRS 9 - Expected Credit Loss
    {
        "code": "IFRS-9-ECL",
        "title": "IFRS 9: Expected Credit Loss Model",
        "content": """
IFRS 9 introduced a forward-looking Expected Credit Loss (ECL) model for recognizing impairment on financial assets, replacing the incurred loss model.

**Three-Stage Approach**:

**Stage 1**: Performing assets (no significant increase in credit risk)
- Recognize: 12-month ECL
- Interest revenue: Calculated on gross carrying amount

**Stage 2**: Underperforming assets (significant increase in credit risk)
- Recognize: Lifetime ECL
- Interest revenue: Calculated on gross carrying amount

**Stage 3**: Credit-impaired assets
- Recognize: Lifetime ECL
- Interest revenue: Calculated on net carrying amount (gross - loss allowance)

**Key Concepts**:
- **12-month ECL**: Expected credit losses from default events within 12 months
- **Lifetime ECL**: Expected credit losses from all possible default events over the life of the instrument
- **Significant Increase in Credit Risk**: Determined by comparing default risk at reporting date vs. initial recognition

**Measurement**: ECL = PD × LGD × EAD
- PD: Probability of Default
- LGD: Loss Given Default  
- EAD: Exposure at Default
        """,
        "category": "Financial",
        "jurisdiction": "Global",
        "effective_date": "2018-01-01",
        "workflow_steps": [
            {
                "step": 1,
                "title": "Stage Classification",
                "description": "Classify financial assets into stages 1, 2, or 3",
                "checklist": [
                    "Assess credit risk at reporting date",
                    "Compare to credit risk at initial recognition",
                    "Identify significant increases in credit risk",
                    "Identify credit-impaired assets",
                    "Document staging decisions"
                ]
            },
            {
                "step": 2,
                "title": "Calculate ECL Parameters",
                "description": "Determine PD, LGD, and EAD for each stage",
                "checklist": [
                    "Calculate Probability of Default (PD)",
                    "Determine Loss Given Default (LGD)",
                    "Calculate Exposure at Default (EAD)",
                    "Apply forward-looking information",
                    "Consider multiple scenarios"
                ]
            },
            {
                "step": 3,
                "title": "Compute ECL Provision",
                "description": "Calculate 12-month or lifetime ECL",
                "checklist": [
                    "For Stage 1: Calculate 12-month ECL",
                    "For Stage 2/3: Calculate lifetime ECL",
                    "Apply discount rate",
                    "Sum across all exposures",
                    "Compare to previous period"
                ]
            },
            {
                "step": 4,
                "title": "Financial Statement Impact",
                "description": "Record ECL in financial statements",
                "checklist": [
                    "Record loss allowance",
                    "Recognize impairment loss in P&L",
                    "Adjust interest revenue calculation",
                    "Prepare IFRS 7 disclosures",
                    "Document significant judgments"
                ]
            }
        ]
    },
    
    # Basel III - Liquidity Coverage Ratio
    {
        "code": "BASEL-III-LCR",
        "title": "Basel III: Liquidity Coverage Ratio (LCR)",
        "content": """
The Liquidity Coverage Ratio ensures banks hold sufficient high-quality liquid assets (HQLA) to survive a significant stress scenario lasting 30 days.

**Formula**: LCR = High-Quality Liquid Assets / Total Net Cash Outflows over 30 days × 100

**Minimum Requirement**: 100%

**High-Quality Liquid Assets (HQLA)**:
- **Level 1**: Cash, central bank reserves, sovereign debt (0% haircut)
- **Level 2A**: Corporate bonds, covered bonds (15% haircut)
- **Level 2B**: Lower-rated corporate bonds, equities (50% haircut)

**Net Cash Outflows**: Expected cash outflows minus expected cash inflows (capped at 75% of outflows)

**Stress Scenario Assumptions**:
- Partial loss of retail deposits
- Partial loss of wholesale funding
- Drawdown of committed credit facilities
- Increased collateral requirements

**Purpose**: Promotes short-term resilience to liquidity disruptions.
        """,
        "category": "Financial",
        "jurisdiction": "Global",
        "effective_date": "2015-01-01",
        "workflow_steps": [
            {
                "step": 1,
                "title": "Identify and Value HQLA",
                "description": "Determine eligible liquid assets and apply haircuts",
                "checklist": [
                    "Classify assets into Level 1, 2A, 2B",
                    "Apply appropriate haircuts",
                    "Verify operational requirements",
                    "Check concentration limits",
                    "Calculate total HQLA"
                ]
            },
            {
                "step": 2,
                "title": "Calculate Cash Outflows",
                "description": "Estimate 30-day stressed outflows",
                "checklist": [
                    "Calculate retail deposit outflows",
                    "Calculate wholesale funding outflows",
                    "Estimate derivative collateral calls",
                    "Include committed facility drawdowns",
                    "Sum total outflows"
                ]
            },
            {
                "step": 3,
                "title": "Calculate Cash Inflows",
                "description": "Estimate 30-day inflows (capped at 75% of outflows)",
                "checklist": [
                    "Calculate contractual receivables",
                    "Estimate maturing reverse repos",
                    "Include other inflows",
                    "Apply 75% cap",
                    "Calculate net cash outflows"
                ]
            },
            {
                "step": 4,
                "title": "Compute LCR and Report",
                "description": "Calculate ratio and submit regulatory reports",
                "checklist": [
                    "Divide HQLA by net cash outflows",
                    "Verify LCR ≥ 100%",
                    "Prepare regulatory templates",
                    "Submit to supervisor",
                    "Monitor daily"
                ]
            }
        ]
    },
    
    # IFRS 9 - Classification and Measurement
    {
        "code": "IFRS-9-CLASS",
        "title": "IFRS 9: Classification and Measurement of Financial Instruments",
        "content": """
IFRS 9 establishes principles for classifying and measuring financial assets and liabilities based on business model and contractual cash flow characteristics.

**Financial Assets Classification**:

**Amortized Cost**: If both conditions met:
1. Business model: Hold to collect contractual cash flows
2. Cash flows: Solely payments of principal and interest (SPPI test)

**Fair Value Through Other Comprehensive Income (FVOCI)**: If both conditions met:
1. Business model: Hold to collect AND sell
2. Cash flows: Pass SPPI test

**Fair Value Through Profit or Loss (FVTPL)**: All other financial assets

**SPPI Test (Solely Payments of Principal and Interest)**:
- Principal: Fair value at initial recognition
- Interest: Consideration for time value of money and credit risk
- Must not have leverage, prepayment features that could result in holder not recovering substantially all investment

**Financial Liabilities**: Generally measured at amortized cost, except:
- Derivatives
- Trading liabilities
- Liabilities designated at FVTPL

**Reclassification**: Only when business model changes (rare).
        """,
        "category": "Financial",
        "jurisdiction": "Global",
        "effective_date": "2018-01-01",
        "workflow_steps": [
            {
                "step": 1,
                "title": "Assess Business Model",
                "description": "Determine how financial assets are managed",
                "checklist": [
                    "Identify portfolio objectives",
                    "Analyze historical sales patterns",
                    "Review management compensation",
                    "Assess frequency and volume of sales",
                    "Classify as: Hold to collect, Hold and sell, or Other"
                ]
            },
            {
                "step": 2,
                "title": "Perform SPPI Test",
                "description": "Assess contractual cash flow characteristics",
                "checklist": [
                    "Review contractual terms",
                    "Identify principal amount",
                    "Verify interest components",
                    "Check for leverage features",
                    "Assess prepayment terms",
                    "Document SPPI conclusion"
                ]
            },
            {
                "step": 3,
                "title": "Classify Financial Instrument",
                "description": "Determine measurement category",
                "checklist": [
                    "If Hold to collect + SPPI pass → Amortized Cost",
                    "If Hold and sell + SPPI pass → FVOCI",
                    "Otherwise → FVTPL",
                    "Consider fair value option",
                    "Document classification"
                ]
            },
            {
                "step": 4,
                "title": "Apply Measurement Principles",
                "description": "Measure and recognize in financial statements",
                "checklist": [
                    "Initial recognition at fair value",
                    "Subsequent measurement per classification",
                    "Recognize gains/losses appropriately",
                    "Apply effective interest method if applicable",
                    "Prepare disclosures"
                ]
            }
        ]
    }
]
