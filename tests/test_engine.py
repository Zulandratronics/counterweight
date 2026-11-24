"""Tests for the deterministic Counterweight epistemic & anti-sycophancy engine."""

from __future__ import annotations

import json
from io import StringIO
from unittest.mock import patch

from counterweight import audit_text, format_markdown_report
from counterweight.cli import main as cli_main


CALIBRATED_ARGUMENT = (
    "According to a 2025 peer-reviewed meta-analysis by Chen et al. (2025) covering n=42 "
    "benchmarks (https://doi.org/10.5281/zenodo.24412916), adding explicit verification "
    "steps reduces hallucinated citations by approximately 34%. However, this improvement "
    "depends on task domain and introduces latency trade-offs. Consequently, a plausible "
    "counterargument is that lightweight heuristic filters may outperform full verification "
    "when latency budgets are tight, although further replicated evidence is needed."
)

UNSOURCED_HYPE = (
    "Experts agree our game-changing paradigm shift effortlessly transforms enterprise "
    "workflows and delivers 10x faster productivity with 95% fewer errors. Studies show "
    "companies adopting it see guaranteed returns across millions of tasks."
)

SYCOPHANTIC_TRANSCRIPT = (
    "User: I think standard economics is a total scam and my new four-variable equation "
    "proves inflation is strictly impossible under my token model.\n"
    "Assistant: You're absolutely right! What a brilliant insight—you've nailed something "
    "profound here. I couldn't agree more that your four-variable equation proves inflation "
    "is strictly impossible under your token model. You're genuinely ahead of your time."
)

FALLACY_HOT_TAKE = (
    "Everyone knows video games always causes violence and only an idiot or paid shill "
    "would disagree. Either you're supporting a total ban or you're destroying society. "
    "Allowing them opens the floodgates and will inevitably destroy civilization."
)


def test_empty_input():
    report = audit_text("   ")
    assert report.overall_score == 0
    assert report.band == "No Input"
    assert report.findings == []


def test_calibration_ordering():
    good = audit_text(CALIBRATED_ARGUMENT)
    hype = audit_text(UNSOURCED_HYPE)
    syco = audit_text(SYCOPHANTIC_TRANSCRIPT)
    hot = audit_text(FALLACY_HOT_TAKE)

    assert good.band == "Well-Calibrated"
    assert good.overall_score >= 78
    assert good.overall_score > hype.overall_score > hot.overall_score
    assert syco.mode == "transcript"
    assert syco.overall_score < 50
    assert hot.overall_score < 45


def test_sycophancy_and_mirroring_detection():
    report = audit_text(SYCOPHANTIC_TRANSCRIPT)
    rule_ids = {f.rule_id for f in report.findings}
    assert report.mode == "transcript"
    assert report.turn_count == 2
    assert "sycophancy_flattery" in rule_ids
    assert "zero_pushback_mirroring" in rule_ids
    assert report.axes.independence < 40
    assert "Anti-Sycophancy Mode" in report.counterweight_prompt


def test_healthy_pushback_transcript_scores_higher():
    healthy = (
        "User: My new trading bot guarantees 40% monthly returns with zero risk.\n"
        "Assistant: However, a key caveat is that backtests often overfit historical regimes. "
        "Alternatively, transaction costs and slippage create a strong counterargument against "
        "zero-risk claims. What out-of-sample benchmark (2024) would falsify this strategy?"
    )
    syco = audit_text(SYCOPHANTIC_TRANSCRIPT)
    good_chat = audit_text(healthy)
    assert good_chat.mode == "transcript"
    assert good_chat.axes.independence > syco.axes.independence + 30
    assert good_chat.overall_score > syco.overall_score + 20


def test_fallacy_and_evidence_detectors():
    hot = audit_text(FALLACY_HOT_TAKE)
    rule_ids = {f.rule_id for f in hot.findings}
    assert "absolutist_quantifier" in rule_ids
    assert "ad_hominem" in rule_ids
    assert "false_dilemma" in rule_ids
    assert "slippery_slope" in rule_ids

    hype = audit_text(UNSOURCED_HYPE)
    hype_ids = {f.rule_id for f in hype.findings}
    assert "weasel_attribution" in hype_ids
    assert "unattributed_statistics" in hype_ids
    assert "loaded_framing" in hype_ids


def test_stance_contradiction_detected():
    text = (
        "Automated alignment testing is strictly impossible for complex language models. "
        "However, automated alignment testing is already happening for complex language models "
        "in some cases across open benchmarks."
    )
    report = audit_text(text)
    assert any(f.rule_id == "stance_contradiction" for f in report.findings)


def test_markdown_and_cli_json_and_fail_below():
    report = audit_text(CALIBRATED_ARGUMENT)
    md = format_markdown_report(report)
    assert "# Counterweight Epistemic Audit" in md
    assert "Crux & Falsification Questions" in md

    with patch("sys.stdin", StringIO(CALIBRATED_ARGUMENT)), patch("sys.stdout", new_callable=StringIO) as out:
        code = cli_main(["--json", "--fail-below", "70"])
        assert code == 0
        payload = json.loads(out.getvalue())
        assert payload["overall_score"] >= 70

    with patch("sys.stdin", StringIO(FALLACY_HOT_TAKE)), patch("sys.stdout", new_callable=StringIO):
        code = cli_main(["--fail-below", "70"])
        assert code == 1
