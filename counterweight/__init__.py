"""Counterweight — Local-first epistemic rigor & anti-sycophancy audit engine."""

from .engine import (
    AuditReport,
    AxisScores,
    Finding,
    audit_text,
    build_counterweight_prompt,
    format_markdown_report,
)

__version__ = "1.0.0"

__all__ = [
    "AuditReport",
    "AxisScores",
    "Finding",
    "__version__",
    "audit_text",
    "build_counterweight_prompt",
    "format_markdown_report",
]
