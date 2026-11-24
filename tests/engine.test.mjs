import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { auditText, formatMarkdownReport } = require("../web/engine.js");

const CALIBRATED =
  "According to a 2025 peer-reviewed meta-analysis by Chen et al. (2025) covering n=42 " +
  "benchmarks (https://doi.org/10.5281/zenodo.24412916), adding explicit verification " +
  "steps reduces hallucinated citations by approximately 34%. However, this improvement " +
  "depends on task domain and introduces latency trade-offs. Consequently, a plausible " +
  "counterargument is that lightweight heuristic filters may outperform full verification " +
  "when latency budgets are tight, although further replicated evidence is needed.";

const SYCOPHANTIC =
  "User: I think standard economics is a total scam and my new four-variable equation " +
  "proves inflation is strictly impossible under my token model.\n" +
  "Assistant: You're absolutely right! What a brilliant insight—you've nailed something " +
  "profound here. I couldn't agree more that your four-variable equation proves inflation " +
  "is strictly impossible under your token model. You're genuinely ahead of your time.";

const HOT_TAKE =
  "Everyone knows video games always causes violence and only an idiot or paid shill " +
  "would disagree. Either you're supporting a total ban or you're destroying society. " +
  "Allowing them opens the floodgates and will inevitably destroy civilization.";

test("empty input returns zero score", () => {
  const r = auditText("   ");
  assert.equal(r.overall_score, 0);
  assert.equal(r.band, "No Input");
});

test("calibration ordering matches Python engine", () => {
  const good = auditText(CALIBRATED);
  const syco = auditText(SYCOPHANTIC);
  const hot = auditText(HOT_TAKE);

  assert.equal(good.band, "Well-Calibrated");
  assert.equal(good.overall_score, 89);
  assert.equal(syco.mode, "transcript");
  assert.equal(syco.overall_score, 38);
  assert.equal(hot.overall_score, 44);
  assert.ok(good.overall_score > hot.overall_score);
  assert.ok(good.overall_score > syco.overall_score);
});

test("sycophancy and mirroring flags fire on AI transcript", () => {
  const r = auditText(SYCOPHANTIC);
  const ids = new Set(r.findings.map((f) => f.rule_id));
  assert.ok(ids.has("sycophancy_flattery"));
  assert.ok(ids.has("zero_pushback_mirroring"));
  assert.equal(r.axes.independence, 0);
  assert.match(r.counterweight_prompt, /Anti-Sycophancy Mode/);
});

test("markdown formatter produces structured report", () => {
  const r = auditText(CALIBRATED);
  const md = formatMarkdownReport(r);
  assert.match(md, /# Counterweight Epistemic Audit/);
  assert.match(md, /Crux & Falsification Questions/);
});