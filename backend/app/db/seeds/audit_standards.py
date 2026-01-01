"""
Audit Standards Seed Data
International Standards on Auditing (ISA) for audit firms
"""

audit_standards = [
    # ISA 200 - Overall Objectives
    {
        "code": "ISA-200",
        "title": "ISA 200: Overall Objectives of the Independent Auditor",
        "content": """
ISA 200 establishes the overall objectives and responsibilities of the independent auditor when conducting an audit of financial statements in accordance with ISAs.

**Primary Objectives**:
1. Obtain reasonable assurance that financial statements are free from material misstatement
2. Express an opinion on whether financial statements are prepared in accordance with applicable financial reporting framework
3. Report on financial statements and communicate as required by ISAs

**Reasonable Assurance**: High, but not absolute, level of assurance expressed positively in the auditor's report

**Key Principles**:
- **Professional Skepticism**: Questioning mind and critical assessment of audit evidence
- **Professional Judgment**: Application of training, knowledge, and experience
- **Sufficient Appropriate Audit Evidence**: Quantity and quality of evidence to support opinion

**Limitations of an Audit**:
- Inherent limitations of internal control
- Use of testing and sampling
- Persuasive rather than conclusive nature of evidence
- Subjectivity in financial reporting

**Auditor's Responsibilities**:
- Plan and perform audit with professional skepticism
- Exercise professional judgment
- Obtain sufficient appropriate audit evidence
- Comply with relevant ethical requirements
- Maintain professional skepticism throughout
        """,
        "category": "Financial",
        "jurisdiction": "Global",
        "effective_date": "2009-12-15",
        "workflow_steps": [
            {
                "step": 1,
                "title": "Understand Audit Objectives",
                "description": "Establish clear understanding of audit scope and objectives",
                "checklist": [
                    "Review engagement letter",
                    "Identify applicable financial reporting framework",
                    "Determine materiality levels",
                    "Understand client's business and industry",
                    "Assess audit risk"
                ]
            },
            {
                "step": 2,
                "title": "Apply Professional Skepticism",
                "description": "Maintain questioning mind throughout audit",
                "checklist": [
                    "Question management representations",
                    "Critically assess audit evidence",
                    "Be alert to contradictory evidence",
                    "Consider reliability of information",
                    "Document skeptical considerations"
                ]
            },
            {
                "step": 3,
                "title": "Obtain Sufficient Appropriate Evidence",
                "description": "Gather evidence to support audit opinion",
                "checklist": [
                    "Design appropriate audit procedures",
                    "Perform tests of controls",
                    "Execute substantive procedures",
                    "Evaluate sufficiency of evidence",
                    "Assess appropriateness of evidence"
                ]
            }
        ]
    },
    
    # ISA 300 - Planning
    {
        "code": "ISA-300",
        "title": "ISA 300: Planning an Audit of Financial Statements",
        "content": """
ISA 300 requires the auditor to plan the audit so that it will be performed effectively, establishing an overall audit strategy and developing an audit plan.

**Overall Audit Strategy**: Sets scope, timing, and direction of audit, including:
- Characteristics of engagement (reporting framework, industry-specific requirements)
- Reporting objectives and communication requirements
- Significant factors affecting audit direction
- Results of preliminary engagement activities
- Nature, timing, and extent of resources needed

**Audit Plan**: More detailed than strategy, includes:
- Nature, timing, and extent of risk assessment procedures
- Nature, timing, and extent of further audit procedures
- Other audit procedures to comply with ISAs

**Planning Activities**:
1. Perform preliminary engagement activities
2. Establish overall audit strategy
3. Develop audit plan
4. Update and revise throughout audit

**Benefits of Planning**:
- Helps auditor devote appropriate attention to important areas
- Identifies and resolves potential problems timely
- Properly organizes and manages engagement
- Assists in selection of engagement team members
- Facilitates direction and supervision
- Facilitates review of work

**Documentation**: Overall audit strategy and audit plan must be documented.
        """,
        "category": "Financial",
        "jurisdiction": "Global",
        "effective_date": "2009-12-15",
        "workflow_steps": [
            {
                "step": 1,
                "title": "Preliminary Engagement Activities",
                "description": "Perform initial client acceptance and planning procedures",
                "checklist": [
                    "Perform client acceptance/continuance procedures",
                    "Evaluate compliance with ethical requirements",
                    "Establish understanding of terms of engagement",
                    "Review prior year audit files",
                    "Identify changes in client circumstances"
                ]
            },
            {
                "step": 2,
                "title": "Establish Overall Audit Strategy",
                "description": "Define scope, timing, and direction of audit",
                "checklist": [
                    "Determine characteristics of engagement",
                    "Ascertain reporting objectives",
                    "Consider factors affecting audit direction",
                    "Consider preliminary engagement activities",
                    "Determine nature, timing, extent of resources",
                    "Document overall strategy"
                ]
            },
            {
                "step": 3,
                "title": "Develop Detailed Audit Plan",
                "description": "Create specific audit procedures and timeline",
                "checklist": [
                    "Plan risk assessment procedures",
                    "Plan further audit procedures",
                    "Plan other required procedures",
                    "Assign tasks to team members",
                    "Establish timeline and milestones",
                    "Document audit plan"
                ]
            },
            {
                "step": 4,
                "title": "Update Planning Throughout Audit",
                "description": "Revise strategy and plan as needed",
                "checklist": [
                    "Monitor progress against plan",
                    "Identify significant changes",
                    "Revise strategy if necessary",
                    "Update audit plan",
                    "Communicate changes to team",
                    "Document revisions"
                ]
            }
        ]
    },
    
    # ISA 315 - Risk Assessment
    {
        "code": "ISA-315",
        "title": "ISA 315: Identifying and Assessing Risks of Material Misstatement",
        "content": """
ISA 315 requires the auditor to identify and assess risks of material misstatement at the financial statement and assertion levels through understanding the entity and its environment.

**Risk Assessment Procedures**:
1. Inquiries of management and others
2. Analytical procedures
3. Observation and inspection

**Understanding the Entity**:
- Industry, regulatory, and external factors
- Nature of entity (operations, ownership, governance, investments, structure, financing)
- Accounting policies and financial reporting
- Objectives and strategies and related business risks
- Measurement and review of financial performance

**Understanding Internal Control**:
- Control environment
- Entity's risk assessment process
- Information system and communication
- Control activities
- Monitoring of controls

**Identifying and Assessing Risks**:
- Identify risks through understanding entity and environment
- Relate risks to what can go wrong at assertion level
- Consider likelihood and magnitude
- Determine which risks require special audit consideration (significant risks)

**Documentation Requirements**:
- Discussion among engagement team
- Key elements of understanding
- Identified and assessed risks
- Risks requiring special audit consideration
        """,
        "category": "Financial",
        "jurisdiction": "Global",
        "effective_date": "2019-12-15",
        "workflow_steps": [
            {
                "step": 1,
                "title": "Understand the Entity and Environment",
                "description": "Gain comprehensive understanding of client business",
                "checklist": [
                    "Research industry and regulatory factors",
                    "Understand business operations and structure",
                    "Review accounting policies",
                    "Identify business objectives and strategies",
                    "Understand performance measurement systems",
                    "Document understanding"
                ]
            },
            {
                "step": 2,
                "title": "Understand Internal Control",
                "description": "Assess design and implementation of controls",
                "checklist": [
                    "Evaluate control environment",
                    "Understand risk assessment process",
                    "Map information systems",
                    "Identify control activities",
                    "Assess monitoring of controls",
                    "Document control understanding"
                ]
            },
            {
                "step": 3,
                "title": "Identify Risks of Material Misstatement",
                "description": "Determine where financial statements could be misstated",
                "checklist": [
                    "Analyze business risks",
                    "Consider fraud risks",
                    "Identify risks at assertion level",
                    "Evaluate control deficiencies",
                    "Consider unusual transactions",
                    "Document identified risks"
                ]
            },
            {
                "step": 4,
                "title": "Assess Risks and Determine Response",
                "description": "Evaluate significance of risks and plan response",
                "checklist": [
                    "Assess likelihood of misstatement",
                    "Evaluate potential magnitude",
                    "Identify significant risks",
                    "Determine nature of response",
                    "Plan further audit procedures",
                    "Document risk assessment"
                ]
            }
        ]
    },
    
    # ISA 330 - Responses to Assessed Risks
    {
        "code": "ISA-330",
        "title": "ISA 330: The Auditor's Responses to Assessed Risks",
        "content": """
ISA 330 establishes requirements regarding the auditor's responsibility to design and implement responses to risks of material misstatement identified in accordance with ISA 315.

**Overall Responses**: May include:
- Emphasizing professional skepticism
- Assigning more experienced staff
- Providing more supervision
- Incorporating unpredictability in audit procedures
- Making general changes to nature, timing, or extent of procedures

**Further Audit Procedures**:
1. **Tests of Controls**: When required or when auditor chooses to rely on controls
2. **Substantive Procedures**: Required for all material classes of transactions, account balances, and disclosures

**Types of Substantive Procedures**:
- Tests of details
- Substantive analytical procedures

**Considerations for Designing Procedures**:
- Nature: Type of audit procedure
- Timing: When performed
- Extent: Quantity (sample size, observations)

**Significant Risks**: Require special audit consideration:
- Test operating effectiveness of controls if relying on them
- Perform substantive procedures specifically responsive to risk
- Procedures must be performed as close to period end as practical

**Adequacy of Presentation and Disclosure**: Evaluate whether overall presentation, structure, and content comply with applicable framework.
        """,
        "category": "Financial",
        "jurisdiction": "Global",
        "effective_date": "2019-12-15",
        "workflow_steps": [
            {
                "step": 1,
                "title": "Design Overall Responses",
                "description": "Establish general audit approach based on assessed risks",
                "checklist": [
                    "Emphasize professional skepticism",
                    "Assign appropriate staff",
                    "Determine supervision needs",
                    "Incorporate unpredictability",
                    "Document overall response"
                ]
            },
            {
                "step": 2,
                "title": "Design Tests of Controls",
                "description": "Plan procedures to test control effectiveness",
                "checklist": [
                    "Identify controls to test",
                    "Determine nature of tests",
                    "Establish timing of tests",
                    "Determine extent of testing",
                    "Document test design"
                ]
            },
            {
                "step": 3,
                "title": "Design Substantive Procedures",
                "description": "Plan procedures to detect material misstatements",
                "checklist": [
                    "Design tests of details",
                    "Plan substantive analytical procedures",
                    "Determine nature, timing, extent",
                    "Address significant risks",
                    "Document substantive procedures"
                ]
            },
            {
                "step": 4,
                "title": "Perform and Evaluate Procedures",
                "description": "Execute planned procedures and assess results",
                "checklist": [
                    "Perform tests of controls",
                    "Execute substantive procedures",
                    "Evaluate sufficiency of evidence",
                    "Assess need for additional procedures",
                    "Document results and conclusions"
                ]
            }
        ]
    },
    
    # ISA 500 - Audit Evidence
    {
        "code": "ISA-500",
        "title": "ISA 500: Audit Evidence",
        "content": """
ISA 500 establishes requirements regarding the auditor's responsibility to design and perform audit procedures to obtain sufficient appropriate audit evidence.

**Sufficient Appropriate Audit Evidence**: Measure of quantity (sufficiency) and quality (appropriateness)

**Appropriateness**: Measure of quality - relevance and reliability
- Relevance: Pertains to assertion being tested
- Reliability: Depends on source and nature

**Reliability Hierarchy** (generally):
1. External evidence more reliable than internal
2. Internal evidence more reliable when controls are effective
3. Auditor-obtained evidence more reliable than management-provided
4. Documentary evidence more reliable than oral
5. Original documents more reliable than copies

**Sources of Audit Evidence**:
- Inspection of records or documents
- Inspection of tangible assets
- Observation
- Inquiry
- Confirmation
- Recalculation
- Reperformance
- Analytical procedures

**Management's Specialist**: When using work of specialist employed by entity, auditor must:
- Evaluate competence, capabilities, and objectivity
- Understand work performed
- Evaluate appropriateness as audit evidence

**Inconsistency or Doubt**: When evidence is inconsistent or auditor has doubts about reliability:
- Modify or add procedures
- Consider effect on other aspects of audit
        """,
        "category": "Financial",
        "jurisdiction": "Global",
        "effective_date": "2009-12-15",
        "workflow_steps": [
            {
                "step": 1,
                "title": "Design Evidence-Gathering Procedures",
                "description": "Plan procedures to obtain sufficient appropriate evidence",
                "checklist": [
                    "Identify assertions to test",
                    "Select appropriate procedures",
                    "Consider reliability of sources",
                    "Determine sample sizes",
                    "Document procedure design"
                ]
            },
            {
                "step": 2,
                "title": "Perform Audit Procedures",
                "description": "Execute planned evidence-gathering activities",
                "checklist": [
                    "Inspect documents and records",
                    "Observe processes and controls",
                    "Make inquiries of management",
                    "Obtain external confirmations",
                    "Perform recalculations",
                    "Execute analytical procedures"
                ]
            },
            {
                "step": 3,
                "title": "Evaluate Evidence Quality",
                "description": "Assess appropriateness and reliability of evidence",
                "checklist": [
                    "Assess relevance to assertions",
                    "Evaluate reliability of source",
                    "Consider consistency with other evidence",
                    "Identify any contradictions",
                    "Document quality assessment"
                ]
            },
            {
                "step": 4,
                "title": "Determine Sufficiency",
                "description": "Assess whether enough evidence has been obtained",
                "checklist": [
                    "Evaluate quantity of evidence",
                    "Consider assessed risks",
                    "Assess need for additional procedures",
                    "Document sufficiency conclusion",
                    "Obtain more evidence if needed"
                ]
            }
        ]
    },
    
    # ISA 700 - Forming Opinion and Reporting
    {
        "code": "ISA-700",
        "title": "ISA 700: Forming an Opinion and Reporting on Financial Statements",
        "content": """
ISA 700 establishes requirements regarding forming an opinion on financial statements and the form and content of the auditor's report.

**Forming an Opinion**:
Auditor must evaluate whether:
1. Financial statements are prepared in accordance with applicable framework
2. Financial statements achieve fair presentation
3. Sufficient appropriate audit evidence has been obtained
4. Uncorrected misstatements are material
5. Financial statements adequately disclose significant accounting policies
6. Accounting estimates are reasonable
7. Information is relevant, reliable, comparable, and understandable

**Auditor's Report Elements**:
1. **Title**: Clearly indicating independent auditor
2. **Addressee**: As required by engagement circumstances
3. **Auditor's Opinion**: Section with heading "Opinion"
4. **Basis for Opinion**: Reference to ISAs, independence, responsibilities
5. **Going Concern**: If applicable
6. **Key Audit Matters**: For listed entities
7. **Other Information**: If applicable
8. **Responsibilities**: Management and auditor responsibilities
9. **Signature**: Name of firm and auditor
10. **Date**: Not earlier than date evidence obtained
11. **Address**: Location of auditor's office

**Types of Opinions**:
- **Unmodified**: Financial statements are fairly presented
- **Modified**: Qualified, adverse, or disclaimer (see ISA 705)

**Emphasis of Matter**: Draws attention to matter presented in financial statements
**Other Matter**: Draws attention to matter not presented in financial statements
        """,
        "category": "Financial",
        "jurisdiction": "Global",
        "effective_date": "2016-12-15",
        "workflow_steps": [
            {
                "step": 1,
                "title": "Evaluate Financial Statements",
                "description": "Assess overall presentation and compliance",
                "checklist": [
                    "Review compliance with framework",
                    "Assess fair presentation",
                    "Evaluate accounting policies",
                    "Review accounting estimates",
                    "Check disclosure adequacy",
                    "Consider uncorrected misstatements"
                ]
            },
            {
                "step": 2,
                "title": "Form Audit Opinion",
                "description": "Determine type of opinion to issue",
                "checklist": [
                    "Assess sufficiency of evidence",
                    "Evaluate materiality of misstatements",
                    "Consider pervasiveness of issues",
                    "Determine opinion type",
                    "Document opinion basis"
                ]
            },
            {
                "step": 3,
                "title": "Draft Auditor's Report",
                "description": "Prepare report in accordance with ISA 700",
                "checklist": [
                    "Include all required elements",
                    "Write clear opinion paragraph",
                    "Describe basis for opinion",
                    "Include key audit matters (if applicable)",
                    "Describe responsibilities",
                    "Review for completeness"
                ]
            },
            {
                "step": 4,
                "title": "Finalize and Issue Report",
                "description": "Complete quality review and issue report",
                "checklist": [
                    "Perform engagement quality review",
                    "Obtain management representations",
                    "Ensure all procedures complete",
                    "Date and sign report",
                    "Issue to appropriate parties"
                ]
            }
        ]
    }
]
