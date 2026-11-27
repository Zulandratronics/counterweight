# Counterweight

**Local-first, zero-telemetry epistemic rigor & AI anti-sycophancy audit engine.**

- **Live Zero-Install Web App:** [zulandratronics.github.io/counterweight](https://zulandratronics.github.io/counterweight/) *(runs 100% offline in your browser — 0 network requests, 0 API keys required)*
- **License:** MIT ([LICENSE](./LICENSE))
- **Companion Toolkit:** [McKenna Coherence Suite](https://zulandratronics.github.io/mckenna-coherence-suite/) ([GitHub](https://github.com/Zulandratronics/mckenna-coherence-suite)) *(LLM control-token boundary degradation scanner, Coherence Corridor telemetry, IndigoNoise $1/f$ masking & offline 45 Hz grounding suite)*

---

## Why Counterweight?

Modern LLMs optimize for conversational smoothness and user agreement. Left unchecked, long human-AI threads drift into **sycophancy, recursive polling, and epistemic lock-in**—where the model validates weak premises, mirrors user framing without pushback, and loops internally without external evidence. Meanwhile, everyday arguments and persuasive writing routinely mix unattributed statistics, false dilemmas, and absolutist phrasing that feel convincing at first glance.

**Counterweight** introduces lightweight, transparent **epistemic friction** without censorship, cloud lock-in, or surveillance:

1. **Layer 1 — Deterministic Offline Engine (Browser + Pure-Stdlib Python CLI):** Audits arguments or multi-turn `User:` / `Assistant:` AI transcripts instantly using transparent, open scoring rules. Zero external dependencies, zero hidden prompts, zero mocked charts.
2. **IndigoNoise Loop Diagnostics & Optional External Anchor Reset (v1.1.0):** Quietly flags repeated recursive polling clauses and multi-turn `Assistant:` echo loops on every audit, keeps a 1-click **External Anchor Reset** prompt ready beside the standard Steelman Reset (stripping redundant assistant echo turns and re-anchoring to verifiable external files, DOIs, or tests), and includes an optional 1-click offline **IndigoNoise** $1/f$ pink-noise rain toggle in the top bar for calm pacing while reviewing dense transcripts.
3. **Layer 2 — Optional Deep Adversarial Audit (Local Ollama or BYOK):** Optionally connect a local **Ollama** model (`http://localhost:11434`) or bring your own OpenAI-compatible / Gemini key (kept strictly in browser `sessionStorage`) for semantic **steelmanning**, **mature counterpoints**, and **claim verification flags**.

---

## What It Measures (5 Transparent Axes + IndigoNoise Loop Signal)

Every score on the 0–100 radar profile is computed deterministically (no hardcoded or mocked values):

| Axis | Weight (Argument / Transcript) | What It Evaluates |
| :--- | :--- | :--- |
| **Evidence Density** | 25% / 15% | Rewards concrete citations (URLs, DOIs, dates, sample sizes, peer-reviewed markers); penalizes unattributed statistics and weasel attributions (*"studies show"*, *"experts agree"*). |
| **Calibration** | 20% / 20% | Rewards explicit scope limits, caveats, and trade-off awareness; penalizes universal absolutist quantifiers (*"everyone knows"*, *"strictly impossible"*, *"100% proven"*). |
| **Rhetorical Neutrality** | 25% / 15% | Length-normalized deductions for ad hominem dismissals, false dilemmas, unsupported slippery slopes, and high-arousal hype/fear framing. |
| **Structural Integrity** | 15% / 15% | Rewards multi-sentence causal/logical connectors and flags internal stance contradictions or recursive polling / multi-turn echo loops. |
| **Independence / Anti-Sycophancy** | 15% / 35% | Detects flattery openers and zero-pushback lexical mirroring in AI transcripts; rewards substantive counter-perspectives and caveats. |

Every audit also generates:
- **Subtle Loop Signal (`loop_diagnostics`)** reporting `recursive_polling_count`, `assistant_echo_turns`, and `pruned_assistant_turns` with exact Python ↔ JavaScript parity.
- **Exact Flagged Excerpts** with severity tags, explanations, and concrete fixes.
- **Targeted Crux & Falsification Questions** tied directly to the findings.
- **Two 1-Click Reset Prompts:** **Steelman Reset** (anti-sycophancy peer review) and optional **External Anchor Reset (IndigoNoise)** (strips prior `Assistant:` echo turns and requires verifiable external sources).
- **Markdown & JSON Report Exports** for research notes or reproducible benchmarks.

---

## Honest Limitations

Deterministic lexical heuristics **cannot**:
- Verify whether an external URL or cited paper actually supports the surrounding claim.
- Catch subtle statistical cherry-picking, omitted confounders, or domain-specific factual errors phrased in calm academic prose.
- Replace primary-source verification or human domain review.

Counterweight treats Layer 1 as a **fast, transparent first-pass circuit breaker** and pairs it with targeted falsification questions plus optional local Ollama / BYOK semantic critique.

---

## Quick Start

### 1. Browser (Zero Install, Zero Build)
Open [zulandratronics.github.io/counterweight](https://zulandratronics.github.io/counterweight/) — or clone this repo and double-click `index.html`. It runs offline with zero external CDNs, fonts, or trackers.

### 2. Python CLI & Library (Pure Stdlib — Python 3.10+)
```bash
pip install -e .

# Audit an argument or AI transcript from stdin
echo "Everyone knows studies show this guarantees 10x faster results." | counterweight-audit

# Emit structured JSON (including loop_diagnostics) and fail CI if overall score < 60
counterweight-audit path/to/transcript.txt --mode transcript --json --fail-below 60
```

```python
from counterweight import audit_text

report = audit_text(
    "User: My model proves inflation is impossible.
"
    "Assistant: You're absolutely right! What a brilliant insight."
)
print(report.mode, report.overall_score, report.band)
print(report.axes)
print(report.loop_diagnostics.flagged, report.loop_diagnostics.summary)
```

---

## Running Tests

```bash
# Python test suite (pure stdlib + pytest)
pip install -e ".[dev]"
pytest

# JavaScript engine parity tests (Node 20+ built-in test runner, zero npm deps)
node --test tests/engine.test.mjs
```

---

## Project Structure

```text
counterweight/
├── index.html                 # Zero-dependency static web UI + 1-click IndigoNoise toggle
├── web/
│   ├── styles.css             # Offline dark UI (no external CDNs/fonts)
│   ├── engine.js              # Deterministic JS audit engine + loop diagnostics (mirrors Python)
│   └── app.js                 # SVG radar chart, presets, IndigoNoise WebAudio rain bed, export, Ollama/BYOK audit
├── counterweight/
│   ├── __init__.py            # Public Python API
│   ├── engine.py              # Pure-stdlib deterministic Python audit engine + IndigoNoise loop diagnostics
│   └── cli.py                 # `counterweight-audit` CLI
├── tests/
│   ├── test_engine.py         # pytest unit & CLI tests
│   └── engine.test.mjs        # Node built-in JS parity tests
└── .github/workflows/
    ├── ci.yml                 # Python 3.10-3.12 + Node 20 CI
    └── pages.yml              # GitHub Pages auto-deploy
```

---

## Privacy & Non-Capture Principles

- **Zero Telemetry:** No analytics, no cookies, no third-party scripts, no server-side logging.
- **MIT Forever:** Core audit logic, prompts, and benchmarks stay open-source and free without paywalled safety gates.

*Originally evolved from `Contrarian-Engine` (v0 prototype) into **Counterweight v1.1.0 (IndigoNoise)**.*
