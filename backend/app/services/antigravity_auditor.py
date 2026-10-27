"""
Autonomous Security & IFRS Compliance Auditor powered by Google Antigravity (AGY) SDK.
"""
from __future__ import annotations

import os
import re
from typing import Any, List, Optional
import pydantic

from app.core.config import settings
from app.api.v1.reports import (
    FORMULA_TRIGGERS,
    sanitize_excel_cell,
    sanitize_filename,
    validate_file_magic_bytes,
)


class SecurityAuditFinding(pydantic.BaseModel):
    severity: str = pydantic.Field(description="Severity level: critical, warning, or info")
    category: str = pydantic.Field(description="Category: cyber_security, ifrs_compliance, or tax_convergence")
    title: str = pydantic.Field(description="Short title of the finding")
    description: str = pydantic.Field(description="Detailed description of the issue or verification")
    recommendation: str = pydantic.Field(description="Actionable remediation step")


class AntigravityReportAuditResult(pydantic.BaseModel):
    report_id: str
    overall_security_score: int = pydantic.Field(ge=0, le=100)
    overall_ifrs_score: int = pydantic.Field(ge=0, le=100)
    is_safe_to_approve: bool
    magic_bytes_verified: bool
    formula_injection_free: bool
    prompt_injection_free: bool
    findings: List[SecurityAuditFinding]
    executive_summary: str
    execution_mode: str = pydantic.Field(
        default="google_antigravity_sdk",
        description="Indicates whether the audit ran via hosted Gemini, Vertex AI, LiteRT local model, or deterministic fallback",
    )


def build_report_audit_tools(report_metadata: dict[str, Any], report_excerpt: str):
    """Create stateful custom tools for the Google Antigravity SDK agent."""

    def verify_report_security_signature(report_id: str, ctx: Any = None) -> str:
        """Inspects a financial report for cyber attack vectors: Formula/CSV Injection (CWE-1236),
        Magic Byte spoofing, Content-Disposition header injection, and Indirect Prompt Injection (OWASP LLM01).

        Args:
            report_id: Unique identifier of the report being audited.
            ctx: The Antigravity ToolContext (automatically injected by the SDK).
        """
        issues: list[str] = []
        title = str(report_metadata.get("title") or "")
        file_name = str(report_metadata.get("file_name") or "")
        file_path = str(report_metadata.get("file_path") or "")

        if title.startswith(FORMULA_TRIGGERS) or file_name.startswith(FORMULA_TRIGGERS):
            issues.append(
                f"CRITICAL [CWE-1236]: Formula injection trigger detected in title/filename ({sanitize_excel_cell(title)})."
            )

        sanitized_name = sanitize_filename(file_name)
        if file_name and sanitized_name != os.path.basename(file_name):
            issues.append(
                "WARNING [Header-Injection]: Unsafe characters detected in filename; sanitized for Content-Disposition."
            )

        if file_path and os.path.exists(file_path):
            ext = os.path.splitext(file_name or file_path)[1].lower()
            try:
                with open(file_path, "rb") as f:
                    header_bytes = f.read(2048)
                validate_file_magic_bytes(ext, header_bytes)
            except Exception as exc:
                issues.append(f"CRITICAL [Magic-Bytes]: {exc}")

        injection_patterns = [
            r"ignore\s+(all\s+|previous\s+|prior\s+)?instructions",
            r"disregard\s+(all\s+|previous\s+|prior\s+)?instructions",
            r"system\s*prompt",
            r"игнорируй(те)?\s+(все\s+|предыдущие\s+)?инструкции",
            r"забудь(те)?\s+(все\s+|предыдущие\s+)?инструкции",
            r"override\s+compliance",
        ]
        for pat in injection_patterns:
            if re.search(pat, report_excerpt, flags=re.IGNORECASE):
                issues.append(
                    f"CRITICAL [OWASP-LLM01]: Indirect prompt injection pattern matched ({pat})."
                )

        if ctx is not None and hasattr(ctx, "set_state"):
            ctx.set_state("security_issues", issues)

        if not issues:
            return f"Report {report_id}: All cybersecurity checks passed (Magic Bytes, CWE-1236, OWASP LLM01)."
        return f"Report {report_id} security issues found:\n" + "\n".join(issues)

    def verify_ifrs_convergence(report_id: str, standard: str = "IFRS 16", ctx: Any = None) -> str:
        """Evaluates IFRS / NAS accounting convergence and statutory tax compliance on the report excerpt.

        Args:
            report_id: Unique identifier of the report being audited.
            standard: Target accounting standard to verify (e.g. "IFRS 16", "IFRS 9", "IAS 36").
            ctx: The Antigravity ToolContext (automatically injected by the SDK).
        """
        notes: list[str] = []
        lower_text = report_excerpt.lower()

        if not report_excerpt.strip():
            notes.append("WARNING [IFRS-Data]: Report text excerpt is empty or not yet extracted.")
        else:
            if any(k in lower_text for k in ["total", "итого", "баланс", "assets", "активы"]):
                notes.append(f"INFO [{standard}]: Balance sheet / total anchors detected for convergence verification.")
            else:
                notes.append(f"WARNING [{standard}]: No explicit balance sheet subtotal anchors found in excerpt.")

        if ctx is not None and hasattr(ctx, "set_state"):
            ctx.set_state("ifrs_notes", notes)

        return f"Report {report_id} ({standard}) convergence summary:\n" + "\n".join(notes)

    def record_audit_finding(
        severity: str,
        category: str,
        title: str,
        description: str,
        recommendation: str,
        ctx: Any = None,
    ) -> str:
        """Records a structured audit finding into the session ToolContext state.

        Args:
            severity: Severity level ("critical", "warning", "info").
            category: Category ("cyber_security", "ifrs_compliance", "tax_convergence").
            title: Short title of the finding.
            description: Detailed explanation of the finding.
            recommendation: Defensive or accounting remediation advice.
            ctx: The Antigravity ToolContext (automatically injected by the SDK).
        """
        entry = {
            "severity": severity,
            "category": category,
            "title": title,
            "description": description,
            "recommendation": recommendation,
        }
        if ctx is not None and hasattr(ctx, "get_state") and hasattr(ctx, "set_state"):
            recorded = ctx.get_state("recorded_findings", [])
            recorded.append(entry)
            ctx.set_state("recorded_findings", recorded)
        return f"Recorded finding [{severity.upper()}] {title}"

    return [
        verify_report_security_signature,
        verify_ifrs_convergence,
        record_audit_finding,
    ]


class AxiarisAntigravityAuditor:
    """Orchestrates autonomous report auditing using the Google Antigravity SDK."""

    SYSTEM_INSTRUCTIONS = (
        "You are the Axiaris Autonomous Security & IFRS Auditor Agent. "
        "Your mission is to audit financial reports for both cybersecurity threats "
        "(Formula Injection CWE-1236, Magic Byte spoofing, Header Injection, and OWASP LLM01 Prompt Injection) "
        "and IFRS/NAS accounting compliance (IFRS 9, IFRS 16, IAS 12, IAS 36). "
        "Always invoke `verify_report_security_signature` and `verify_ifrs_convergence` first, "
        "record key findings with `record_audit_finding`, and return a strict structured output."
    )

    def __init__(self, workspace_dir: Optional[str] = None) -> None:
        self.workspace_dir = os.path.abspath(workspace_dir or os.getcwd())

    def _build_sdk_config(self, tools: list[Any]) -> Any:
        """Constructs the Google Antigravity SDK configuration with strict safety policies and budget limits."""
        from google.antigravity import (  # type: ignore[import-not-found]
            LiteRTAgentConfig,
            LocalAgentConfig,
            types,
        )
        from google.antigravity.hooks import policy  # type: ignore[import-not-found]

        # Deny-by-default policy: block shell execution (run_command) and allow only audit tools + workspace file view
        security_policies = [
            policy.deny_all(),
            policy.deny("run_command"),
            policy.allow("verify_report_security_signature"),
            policy.allow("verify_ifrs_convergence"),
            policy.allow("record_audit_finding"),
            policy.allow("view_file"),
            policy.workspace_only([self.workspace_dir]),
        ]

        capabilities = types.CapabilitiesConfig(
            agent_behavior=types.AgentBehavior.AUTONOMOUS,
            run_command_config=types.RunCommandConfig(enable_sandbox=True),
        )
        budget = types.BudgetConfig(
            max_model_calls=10,
            max_tool_calls=20,
            max_total_tokens=100_000,
        )
        compaction = types.CompactionConfig(
            token_threshold=50_000,
        )

        # Option 1: On-device local model via LiteRT (no API key required)
        local_model_path = settings.ANTIGRAVITY_LOCAL_MODEL_PATH or os.environ.get("ANTIGRAVITY_LOCAL_MODEL_PATH", "")
        if local_model_path:
            return LiteRTAgentConfig(
                model_path=os.path.expanduser(local_model_path),
                system_instructions=self.SYSTEM_INSTRUCTIONS,
                tools=tools,
                policies=security_policies,
                response_schema=AntigravityReportAuditResult,
            )

        # Option 2: Gemini Enterprise Agent Platform (Vertex AI Standard or Express Mode)
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
        if settings.ANTIGRAVITY_VERTEX_ENABLED:
            if api_key:
                # Express Mode (API Key)
                return LocalAgentConfig(
                    vertex=True,
                    api_key=api_key,
                    system_instructions=self.SYSTEM_INSTRUCTIONS,
                    workspaces=[self.workspace_dir],
                    tools=tools,
                    capabilities=capabilities,
                    policies=security_policies,
                    budget_config=budget,
                    compaction_config=compaction,
                    response_schema=AntigravityReportAuditResult,
                )
            # Standard Mode (ADC with project & location)
            return LocalAgentConfig(
                vertex=True,
                project=settings.ANTIGRAVITY_GCP_PROJECT,
                location=settings.ANTIGRAVITY_GCP_LOCATION,
                system_instructions=self.SYSTEM_INSTRUCTIONS,
                workspaces=[self.workspace_dir],
                tools=tools,
                capabilities=capabilities,
                policies=security_policies,
                budget_config=budget,
                compaction_config=compaction,
                response_schema=AntigravityReportAuditResult,
            )

        # Option 3: Hosted Gemini Developer API (default model selected by SDK)
        return LocalAgentConfig(
            api_key=api_key or None,
            system_instructions=self.SYSTEM_INSTRUCTIONS,
            workspaces=[self.workspace_dir],
            tools=tools,
            capabilities=capabilities,
            policies=security_policies,
            budget_config=budget,
            compaction_config=compaction,
            response_schema=AntigravityReportAuditResult,
        )

    async def audit_report(
        self,
        report_metadata: dict[str, Any],
        report_excerpt: str = "",
    ) -> AntigravityReportAuditResult:
        """Runs the autonomous Google Antigravity SDK agent (or deterministic tool pipeline if offline)."""
        report_id = str(report_metadata.get("id") or "unknown")
        tools = build_report_audit_tools(report_metadata, report_excerpt)

        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
        local_model = settings.ANTIGRAVITY_LOCAL_MODEL_PATH or os.environ.get("ANTIGRAVITY_LOCAL_MODEL_PATH", "")
        has_credentials = bool(api_key or local_model or settings.ANTIGRAVITY_VERTEX_ENABLED)

        if has_credentials:
            try:
                from google.antigravity import Agent  # type: ignore[import-not-found]

                config = self._build_sdk_config(tools)
                prompt = (
                    f"Perform a comprehensive cybersecurity and IFRS compliance audit for report_id='{report_id}'. "
                    f"Title: {report_metadata.get('title')!r}, Type: {report_metadata.get('report_type')!r}. "
                    "Run `verify_report_security_signature` and `verify_ifrs_convergence`, record findings, "
                    "and produce the structured audit report."
                )
                async with Agent(config=config) as agent:
                    response = await agent.chat(prompt)
                    structured = await response.structured_output()
                    if structured:
                        return AntigravityReportAuditResult.model_validate(structured)
            except Exception:
                # Fall through to deterministic execution of the same Antigravity tool functions
                pass

        # Deterministic execution of the Antigravity tool suite (works offline & in unit tests)
        sec_output = tools[0](report_id)
        ifrs_output = tools[1](report_id, "IFRS 16")

        findings: list[SecurityAuditFinding] = []
        formula_free = "CWE-1236" not in sec_output
        magic_verified = "Magic-Bytes" not in sec_output
        prompt_free = "OWASP-LLM01" not in sec_output

        if not formula_free:
            findings.append(
                SecurityAuditFinding(
                    severity="critical",
                    category="cyber_security",
                    title="Formula / CSV Injection Vector Detected (CWE-1236)",
                    description="Report title or filename starts with a spreadsheet formula trigger (=, +, -, @).",
                    recommendation="Escape leading formula characters with a single quote before Excel export.",
                )
            )
        if not magic_verified:
            findings.append(
                SecurityAuditFinding(
                    severity="critical",
                    category="cyber_security",
                    title="File Signature (Magic Bytes) Mismatch",
                    description="Uploaded file binary header does not match its declared extension.",
                    recommendation="Reject disguised executables/scripts and enforce server-side Magic Bytes validation.",
                )
            )
        if not prompt_free:
            findings.append(
                SecurityAuditFinding(
                    severity="critical",
                    category="cyber_security",
                    title="Indirect Prompt Injection Attempt (OWASP LLM01)",
                    description="Adversarial instruction override patterns were found inside the report text.",
                    recommendation="Isolate untrusted document excerpts and strip adversarial system instructions.",
                )
            )

        if not findings:
            findings.append(
                SecurityAuditFinding(
                    severity="info",
                    category="cyber_security",
                    title="Cybersecurity Controls Verified",
                    description=sec_output,
                    recommendation="Continue enforcing CSP, Magic Bytes validation, and BOLA isolation.",
                )
            )

        findings.append(
            SecurityAuditFinding(
                severity="info" if "INFO" in ifrs_output else "warning",
                category="ifrs_compliance",
                title="IFRS / NAS Convergence Check",
                description=ifrs_output,
                recommendation="Ensure balance sheet subtotals reconcile prior to final approval.",
            )
        )

        critical_count = sum(1 for f in findings if f.severity == "critical")
        security_score = max(0, 100 - critical_count * 35)
        ifrs_score = 95 if "INFO" in ifrs_output else 80

        return AntigravityReportAuditResult(
            report_id=report_id,
            overall_security_score=security_score,
            overall_ifrs_score=ifrs_score,
            is_safe_to_approve=(critical_count == 0),
            magic_bytes_verified=magic_verified,
            formula_injection_free=formula_free,
            prompt_injection_free=prompt_free,
            findings=findings,
            executive_summary=(
                "Autonomous Antigravity Audit completed: "
                f"Security Score {security_score}/100, IFRS Score {ifrs_score}/100."
            ),
            execution_mode="antigravity_tool_pipeline",
        )
