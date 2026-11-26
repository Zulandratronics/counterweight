"""Counterweight — Local-first epistemic rigor & anti-sycophancy audit engine."""

from .engine import (
    AuditReport,
    AxisScores,
    Finding,
    LoopDiagnostics,
    audit_text,
    build_counterweight_prompt,
    build_external_anchor_prompt,
    format_markdown_report,
)

__version__ = "1.1.0"

__all__ = [
    "AuditReport",
    "AxisScores",
    "Finding",
    "LoopDiagnostics",
    "__version__",
    "audit_text",
    "build_counterweight_prompt",
    "build_external_anchor_prompt",
    "format_markdown_report",
]
