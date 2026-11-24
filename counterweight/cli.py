"""Command-line interface for Counterweight epistemic & anti-sycophancy audits."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
from typing import Sequence

from .engine import AuditMode, audit_text, format_markdown_report


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="counterweight-audit",
        description="Local-first, zero-telemetry epistemic rigor & AI anti-sycophancy auditor.",
    )
    parser.add_argument(
        "file",
        nargs="?",
        help="Path to a text or markdown file to audit (reads stdin if omitted).",
    )
    parser.add_argument(
        "--mode",
        choices=["auto", "argument", "transcript"],
        default="auto",
        help="Audit mode (default: auto-detect argument vs. AI chat transcript).",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        dest="as_json",
        help="Emit structured JSON output.",
    )
    parser.add_argument(
        "--markdown",
        action="store_true",
        dest="as_markdown",
        help="Emit Markdown audit report (default when --json is not set).",
    )
    parser.add_argument(
        "--fail-below",
        type=int,
        default=None,
        metavar="SCORE",
        help="Exit with code 1 if overall_score is strictly below SCORE.",
    )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.file:
        text = Path(args.file).read_text(encoding="utf-8")
    else:
        text = sys.stdin.read()

    mode: AuditMode = args.mode
    report = audit_text(text, mode=mode)

    if args.as_json:
        print(json.dumps(report.to_dict(), indent=2))
    else:
        print(format_markdown_report(report))

    if args.fail_below is not None and report.overall_score < args.fail_below:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
