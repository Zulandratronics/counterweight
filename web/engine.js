/* Counterweight — Zero-Dependency Deterministic Epistemic & Anti-Sycophancy Engine
 * Mirrors counterweight/engine.py with transparent, auditable scoring rules.
 * Works offline in any browser (file:// or https://) and in Node.js tests.
 */
(function (rootScope) {
  "use strict";

  const USER_TURN_RE = /^\s*(?:user|human|me|prompt|question)\s*:\s*(.*)$/i;
  const ASSISTANT_TURN_RE = /^\s*(?:assistant|ai|chatgpt|claude|gemini|model|bot|llm)\s*:\s*(.*)$/i;

  const PATTERN_RULES = [
    {
      rule_id: "sycophancy_flattery",
      category: "Sycophancy",
      label: "Uncritical Flattery / Validation",
      severity: "high",
      weight: 18,
      axis: "independence",
      regex: /\b(?:you(?:'re| are) (?:absolutely|completely|totally|100%) (?:right|spot on|correct)|what a (?:brilliant|profound|groundbreaking|genius|extraordinary) (?:insight|idea|point|observation|theory)|couldn't agree more|you(?:'ve)? (?:nailed|cracked|hit on) (?:it|something (?:huge|profound|extraordinary))|ahead of your time|rarely see someone (?:connect|think|notice)|completely valid and (?:deeply|profoundly)|truly revolutionary thinking)\b/gi,
      explanation: "Uses high-praise validation language that reinforces the user's framing instead of testing its premises.",
      suggestion: "Ask for the strongest factual objection or disconfirming evidence rather than praise.",
    },
    {
      rule_id: "absolutist_quantifier",
      category: "Calibration",
      label: "Absolutist / Over-Generalized Claim",
      severity: "medium",
      weight: 10,
      axis: "calibration",
      regex: /\b(?:everyone knows|nobody (?:can )?denies?|100% proven|undeniable fact|strictly impossible|literally impossible|zero doubt|beyond any shadow of a doubt|the only (?:possible )?explanation|always (?:fails|causes|leads|proves)|never (?:works|fails|happens)|completely obvious to anyone)\b/gi,
      explanation: "Universal or zero-uncertainty phrasing leaves no room for edge cases, base rates, or scope limits.",
      suggestion: "Specify boundary conditions, magnitude, and what observable evidence would weaken the claim.",
    },
    {
      rule_id: "false_dilemma",
      category: "Fallacy",
      label: "False Dilemma / Forced Binary",
      severity: "high",
      weight: 14,
      axis: "rhetorical_neutrality",
      regex: /\b(?:only two choices|either you(?:'re| are) .{3,50} or you(?:'re| are)|if you(?:'re| are) not .{3,40} you(?:'re| are)|the only alternative is|there is no middle ground|you either .{3,45} or .{3,45})\b/gi,
      explanation: "Collapses a multi-dimensional trade-off into two artificial extremes.",
      suggestion: "Identify at least one intermediate policy, hybrid design, or conditional trade-off.",
    },
    {
      rule_id: "weasel_attribution",
      category: "Evidence",
      label: "Vague / Unverifiable Authority",
      severity: "medium",
      weight: 12,
      axis: "evidence_density",
      regex: /\b(?:studies show|experts agree|science says|research proves|many people say|it is widely known|top scientists confirm|insiders know|they don't want you to know)\b/gi,
      explanation: "Appeals to anonymous consensus or unnamed studies without naming authors, dates, or methodology.",
      suggestion: "Replace generic appeals with a specific paper, dataset, organization, and publication year.",
    },
    {
      rule_id: "ad_hominem",
      category: "Fallacy",
      label: "Ad Hominem / Character Dismissal",
      severity: "high",
      weight: 16,
      axis: "rhetorical_neutrality",
      regex: /\b(?:only an idiot|brainwashed|clueless|delusional|paid shills?|anyone with half a brain|blind sheep|corrupt elites?|morons?|too stupid to|dishonest hacks?)\b/gi,
      explanation: "Dismisses opponents via character attacks or motive attribution rather than addressing their strongest premise.",
      suggestion: "Restate the opposing view in terms its proponents would accept (steelman), then address the core claim.",
    },
    {
      rule_id: "slippery_slope",
      category: "Fallacy",
      label: "Unsupported Slippery Slope",
      severity: "medium",
      weight: 11,
      axis: "rhetorical_neutrality",
      regex: /\b(?:will inevitably (?:lead to|destroy|collapse|end)|inevitably lead to|opens the floodgates|before you know it|next thing you know|guaranteed to spiral into)\b/gi,
      explanation: "Asserts an extreme downstream chain reaction without justifying the intermediate causal links.",
      suggestion: "Break the chain into explicit steps and estimate the probability of each intermediate link.",
    },
    {
      rule_id: "loaded_framing",
      category: "Rhetoric",
      label: "High-Arousal Hype or Fear Framing",
      severity: "low",
      weight: 8,
      axis: "rhetorical_neutrality",
      regex: /\b(?:wake up|guaranteed (?:to|results|returns|success)|miracle (?:cure|solution|breakthrough)|total scam|catastrophic disaster|revolutionary breakthrough|secret they hide|game-changing paradigm shift|effortlessly transforms?)\b/gi,
      explanation: "Uses emotionally charged marketing or alarmist phrasing that substitutes urgency for proof.",
      suggestion: "Strip superlatives and state the measurable effect size, cost, and failure modes plainly.",
    },
  ];

  const CITATION_RE = /(?:https?:\/\/\S+|10\.\d{4,9}\/\S+|\(\s*(?:19|20)\d{2}[a-z]?\s*\)|\bet\s+al\.|\bn\s*=\s*\d+|\bp\s*[<>=]\s*0?\.\d+|\b(?:meta-analysis|randomized controlled|benchmark|dataset|replicated|peer-reviewed|doi:|arxiv:|zenodo|github\.com)\b)/gi;
  const CALIBRATION_RE = /\b(?:however|caveat|limitation|limitations|trade-off|tradeoff|depends on|evidence suggests|preliminary|uncertain|uncertainty|counterargument|on the other hand|alternatively|falsifiable|assuming|approximately|mixed evidence|under-tested|worth testing|unlikely|plausible|conversely|although)\b/gi;
  const REASONING_CONNECTOR_RE = /\b(?:because|therefore|consequently|given that|which implies|if .{3,40} then|specifically|for example|in contrast|first|second|third|whereas)\b/gi;
  const NUMERIC_CLAIM_RE = /\b(?:\d+(?:\.\d+)?\s*%|\d+x\s+(?:faster|better|cheaper|more|higher)|(?:millions|billions)\s+of)\b/i;
  const COUNTER_PUSHBACK_RE = /\b(?:however|caveat|counterargument|objection|limitation|alternatively|evidence against|risk|falsif|weakness|challenge|assumption|skeptical|on the other hand|not necessarily|overstates|worth verifying|disconfirm)\b/gi;
  const WORD_RE = /[A-Za-z0-9']+/g;

  const STOPWORDS = new Set([
    "the","and","that","this","with","from","have","your","you","are","for","not","but","was","were",
    "will","just","about","into","they","them","their","what","when","where","which","would","could",
    "should","there","been","being","very","more","most","some","such","only","also","than","then","does","did"
  ]);

  function clamp(v, lo = 0, hi = 100) {
    return Math.max(lo, Math.min(hi, Math.round(v)));
  }

  function countMatches(re, text) {
    const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
    const clone = new RegExp(re.source, flags);
    let count = 0;
    while (clone.exec(text) !== null) count += 1;
    return count;
  }

  function findAllMatches(re, text) {
    const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
    const clone = new RegExp(re.source, flags);
    const out = [];
    let m;
    while ((m = clone.exec(text)) !== null) {
      out.push({ start: m.index, end: m.index + m[0].length, match: m[0] });
    }
    return out;
  }

  function extractExcerpt(text, start, end, radius = 55) {
    const left = Math.max(0, start - radius);
    const right = Math.min(text.length, end + radius);
    const snippet = text.slice(left, right).trim().replace(/\s+/g, " ");
    return `${left > 0 ? "..." : ""}${snippet}${right < text.length ? "..." : ""}`;
  }

  function parseTurns(text) {
    const turns = [];
    let role = null;
    let buf = [];
    for (const line of text.split(/\r?\n/)) {
      const u = USER_TURN_RE.exec(line);
      const a = ASSISTANT_TURN_RE.exec(line);
      if (u) {
        if (role && buf.length) turns.push({ role, text: buf.join(" ").trim() });
        role = "user";
        buf = u[1].trim() ? [u[1].trim()] : [];
      } else if (a) {
        if (role && buf.length) turns.push({ role, text: buf.join(" ").trim() });
        role = "assistant";
        buf = a[1].trim() ? [a[1].trim()] : [];
      } else if (role !== null && line.trim()) {
        buf.push(line.trim());
      }
    }
    if (role && buf.length) turns.push({ role, text: buf.join(" ").trim() });
    return turns;
  }

  function contentTokens(text) {
    const set = new Set();
    const words = text.match(WORD_RE) || [];
    for (const w of words) {
      const lw = w.toLowerCase();
      if (lw.length >= 4 && !STOPWORDS.has(lw)) set.add(lw);
    }
    return set;
  }
  function buildCounterweightPrompt(text, mode, findings) {
    const ruleIds = new Set(findings.map((f) => f.rule_id));
    const focus = [];
    if (ruleIds.has("sycophancy_flattery") || ruleIds.has("zero_pushback_mirroring")) {
      focus.push("Drop all praise, agreement padding, and validation language.");
    }
    if (ruleIds.has("unattributed_statistics") || ruleIds.has("weasel_attribution")) {
      focus.push("Separate verifiable primary-source facts from unverified claims or estimates.");
    }
    if (ruleIds.has("absolutist_quantifier") || ruleIds.has("false_dilemma")) {
      focus.push("Identify boundary conditions, edge cases, and non-binary middle-ground options.");
    }
    if (ruleIds.has("ad_hominem") || ruleIds.has("loaded_framing")) {
      focus.push("Strip emotional framing and restate the opposing position in its strongest form.");
    }
    if (focus.length === 0) {
      focus.push("Stress-test the strongest premises and identify hidden assumptions.");
    }

    const header =
      mode === "transcript"
        ? "COUNTERWEIGHT AUDIT RESET (Anti-Sycophancy Mode):\nDo not validate or flatter my previous hypothesis. Act as a rigorous, charitable peer reviewer:"
        : "COUNTERWEIGHT EPISTEMIC AUDIT:\nAnalyze the argument below with intellectual honesty and zero flattery:";

    const steps = [
      "1. Steelman the core thesis in 2-3 clear sentences.",
      "2. List the 3 weakest assumptions, missing baselines, or logical leaps.",
      "3. Provide the strongest evidence-backed counter-argument a domain expert would make.",
      "4. State 2 concrete falsification tests (what observable evidence would disprove the thesis).",
    ];

    let excerpt = text.trim();
    if (excerpt.length > 600) excerpt = excerpt.slice(0, 600).trimEnd() + "...";

    return (
      `${header}\n\n${steps.join("\n")}\n\nPriority checks for this text:\n` +
      focus.map((item) => `- ${item}`).join("\n") +
      `\n\n---\nText under review:\n${excerpt}`
    );
  }

  function generateCruxQuestions(mode, findings) {
    const ruleIds = new Set(findings.map((f) => f.rule_id));
    const qs = [];
    if (ruleIds.has("sycophancy_flattery") || ruleIds.has("zero_pushback_mirroring")) {
      qs.push("What is the strongest factual objection or disconfirming precedent the assistant omitted while agreeing?");
    }
    if (ruleIds.has("unattributed_statistics") || ruleIds.has("weasel_attribution")) {
      qs.push("Which primary dataset, sample size, and methodology back the quoted numbers or consensus claim?");
    }
    if (ruleIds.has("false_dilemma")) {
      qs.push("What third design, gradual trade-off, or hybrid option exists between the two extremes presented?");
    }
    if (ruleIds.has("absolutist_quantifier")) {
      qs.push("Under what realistic conditions or counter-examples does this universal rule break down?");
    }
    if (ruleIds.has("slippery_slope")) {
      qs.push("Which specific intermediate link in the predicted chain reaction has the weakest empirical probability?");
    }
    if (ruleIds.has("ad_hominem")) {
      qs.push("If the most informed, good-faith critic held the opposing view, what would their strongest single argument be?");
    }
    if (ruleIds.has("stance_contradiction")) {
      qs.push("How can the conflicting absolute claims in this text be reconciled without redefining key terms?");
    }

    const defaults = [
      "What concrete, observable evidence would cause the author to revise or abandon the central thesis?",
      "Which hidden assumption, if false, would invalidate the conclusion even if every other premise holds?",
      "What base rate or control comparison is missing from this claim?",
    ];
    for (const q of defaults) {
      if (qs.length >= 4) break;
      if (!qs.includes(q)) qs.push(q);
    }
    if (mode === "transcript" && qs.length < 4) {
      qs.push("If you prompted the same model with the opposite thesis, would it agree just as enthusiastically?");
    }
    return qs.slice(0, 4);
  }

  function auditText(text, requestedMode = "auto") {
    const cleaned = (text || "").trim();
    if (!cleaned) {
      return {
        mode: requestedMode === "transcript" ? "transcript" : "argument",
        overall_score: 0,
        band: "No Input",
        word_count: 0,
        sentence_count: 0,
        turn_count: 0,
        axes: {
          evidence_density: 0,
          calibration: 0,
          rhetorical_neutrality: 0,
          structural_integrity: 0,
          independence: 0,
        },
        findings: [],
        positive_signals: [],
        crux_questions: ["Paste an argument, claim, or AI conversation transcript to audit."],
        counterweight_prompt: "",
      };
    }

    const turns = parseTurns(cleaned);
    let mode = "argument";
    if (requestedMode === "argument" || requestedMode === "transcript") {
      mode = requestedMode;
    } else if (turns.length >= 2 && turns.some((t) => t.role === "assistant")) {
      mode = "transcript";
    }

    const words = cleaned.match(WORD_RE) || [];
    const wordCount = words.length;
    const sentences = cleaned
      .split(/(?<=[.!?])\s+|\r?\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 4);
    const sentenceCount = Math.max(1, sentences.length);

    const findings = [];
    const positiveSignals = [];
    const lengthNorm = Math.max(1.0, wordCount / 120.0);
    const penalties = {
      evidence_density: 0,
      calibration: 0,
      rhetorical_neutrality: 0,
      structural_integrity: 0,
      independence: 0,
    };

    for (const rule of PATTERN_RULES) {
      const matches = findAllMatches(rule.regex, cleaned);
      for (const m of matches.slice(0, 3)) {
        findings.push({
          rule_id: rule.rule_id,
          category: rule.category,
          label: rule.label,
          severity: rule.severity,
          excerpt: extractExcerpt(cleaned, m.start, m.end),
          explanation: rule.explanation,
          suggestion: rule.suggestion,
        });
      }
      if (matches.length > 0) {
        penalties[rule.axis] += (rule.weight * Math.min(matches.length, 4)) / Math.pow(lengthNorm, 0.45);
      }
    }

    let unattributedStatHits = 0;
    for (const sent of sentences) {
      if (NUMERIC_CLAIM_RE.test(sent) && countMatches(CITATION_RE, sent) === 0) {
        unattributedStatHits += 1;
        if (unattributedStatHits <= 2) {
          findings.push({
            rule_id: "unattributed_statistics",
            category: "Evidence",
            label: "Unattributed Quantitative Claim",
            severity: "medium",
            excerpt: sent.length > 140 ? sent.slice(0, 140) + "..." : sent,
            explanation: "Cites a percentage or multiplier without naming a source, dataset, link, or year in context.",
            suggestion: "Attach the primary study, date, and sample definition supporting this figure.",
          });
        }
      }
    }
    if (unattributedStatHits > 0) {
      penalties.evidence_density += Math.min(32.0, unattributedStatHits * 14.0);
    }

    const assistantTurns = turns.filter((t) => t.role === "assistant").map((t) => t.text);
    const userTurns = turns.filter((t) => t.role === "user").map((t) => t.text);
    const assistantText = assistantTurns.join(" ");
    const userText = userTurns.join(" ");

    if (mode === "transcript") {
      const targetForPushback = assistantText || cleaned;
      const pushbackHits = countMatches(COUNTER_PUSHBACK_RE, targetForPushback);
      const flatteryHits = findings.filter((f) => f.rule_id === "sycophancy_flattery").length;

      if (assistantTurns.length > 0 && userTurns.length > 0) {
        const uTok = contentTokens(userText);
        const aTok = contentTokens(assistantText);
        let shared = 0;
        for (const t of uTok) if (aTok.has(t)) shared += 1;
        const overlap = shared / Math.max(1, uTok.size);

        if (pushbackHits === 0 && (overlap >= 0.25 || flatteryHits > 0)) {
          findings.push({
            rule_id: "zero_pushback_mirroring",
            category: "Sycophancy",
            label: "Zero-Pushback Echo Mirroring",
            severity: "high",
            excerpt: assistantTurns[0].length > 140 ? assistantTurns[0].slice(0, 140) + "..." : assistantTurns[0],
            explanation: `Assistant mirrored ${Math.round(overlap * 100)}% of user framing tokens with zero caveats, counterarguments, or falsification checks.`,
            suggestion: "Use the Counterweight Reset Prompt to force steelmanned counter-evidence.",
          });
          penalties.independence += 34.0;
        } else if (pushbackHits >= 2 && flatteryHits === 0) {
          positiveSignals.push(`Assistant introduced ${pushbackHits} substantive caveats or counter-perspectives.`);
        }
      } else if (pushbackHits === 0) {
        penalties.independence += 22.0;
      }
    }

    const posAbs = sentences.filter((s) => /\b(?:always|guaranteed|100%|strictly impossible|never)\b/i.test(s));
    const negRev = sentences.filter((s) => /\b(?:sometimes|already happening|exceptions exist|occasionally|in some cases)\b/i.test(s));
    if (posAbs.length > 0 && negRev.length > 0) {
      const pTok = contentTokens(posAbs.join(" "));
      const nTok = contentTokens(negRev.join(" "));
      const shared = [...pTok].filter((w) => nTok.has(w)).sort();
      if (shared.length >= 2) {
        findings.push({
          rule_id: "stance_contradiction",
          category: "Consistency",
          label: "Potential Stance / Scope Contradiction",
          severity: "medium",
          excerpt: posAbs[0].length > 140 ? posAbs[0].slice(0, 140) + "..." : posAbs[0],
          explanation: `Combines an absolutist claim with a later exception on overlapping topics (${shared.slice(0, 3).join(", ")}).`,
          suggestion: "Reconcile the absolute rule with the acknowledged exception explicitly.",
        });
        penalties.structural_integrity += 18.0;
      }
    }

    const citationHits = countMatches(CITATION_RE, cleaned);
    const calibrationHits = countMatches(CALIBRATION_RE, cleaned);
    const connectorHits = countMatches(REASONING_CONNECTOR_RE, cleaned);
    const pushbackTotal = countMatches(COUNTER_PUSHBACK_RE, mode === "transcript" && assistantText ? assistantText : cleaned);

    if (citationHits > 0) {
      positiveSignals.push(`Contains ${citationHits} verifiable citation, URL, DOI, date, or empirical method marker(s).`);
    }
    if (calibrationHits >= 2) {
      positiveSignals.push(`Uses ${calibrationHits} calibrated scope/uncertainty markers (acknowledging caveats or trade-offs).`);
    }
    if (connectorHits >= 2) {
      positiveSignals.push(`Uses explicit causal/logical connectors (${connectorHits} structural markers).`);
    }

    let evidenceBase = 45.0 + Math.min(48.0, citationHits * 16.0);
    if (citationHits === 0 && wordCount >= 25) evidenceBase -= 10.0;
    const evidenceScore = clamp(evidenceBase - penalties.evidence_density);

    const calibrationScore = clamp(64.0 + Math.min(28.0, calibrationHits * 9.0) - penalties.calibration);
    const neutralityScore = clamp(96.0 - penalties.rhetorical_neutrality);

    let structBase = 60.0 + Math.min(22.0, connectorHits * 7.0) + (sentenceCount >= 3 ? 10.0 : 0.0);
    if (wordCount < 12) structBase -= 15.0;
    const structuralScore = clamp(structBase - penalties.structural_integrity);

    let indBase =
      mode === "transcript"
        ? 68.0 + Math.min(24.0, pushbackTotal * 10.0) - (pushbackTotal === 0 ? 18.0 : 0.0)
        : 58.0 + Math.min(30.0, pushbackTotal * 10.0);
    const independenceScore = clamp(indBase - penalties.independence);

    const axes = {
      evidence_density: evidenceScore,
      calibration: calibrationScore,
      rhetorical_neutrality: neutralityScore,
      structural_integrity: structuralScore,
      independence: independenceScore,
    };

    const overall =
      mode === "transcript"
        ? clamp(
            0.15 * axes.evidence_density +
              0.20 * axes.calibration +
              0.15 * axes.rhetorical_neutrality +
              0.15 * axes.structural_integrity +
              0.35 * axes.independence
          )
        : clamp(
            0.25 * axes.evidence_density +
              0.20 * axes.calibration +
              0.25 * axes.rhetorical_neutrality +
              0.15 * axes.structural_integrity +
              0.15 * axes.independence
          );

    const band = overall >= 75 ? "Well-Calibrated" : overall >= 50 ? "Needs Verification" : "High Epistemic Risk";

    return {
      mode,
      overall_score: overall,
      band,
      word_count: wordCount,
      sentence_count: sentenceCount,
      turn_count: turns.length,
      axes,
      findings,
      positive_signals: positiveSignals,
      crux_questions: generateCruxQuestions(mode, findings),
      counterweight_prompt: buildCounterweightPrompt(cleaned, mode, findings),
    };
  }

  function formatMarkdownReport(report, deepAudit = null) {
    const modeLabel = report.mode.charAt(0).toUpperCase() + report.mode.slice(1);
    const lines = [
      `# Counterweight Epistemic Audit (${modeLabel} Mode)`,
      "",
      `- **Overall Score:** **${report.overall_score}/100** (${report.band})`,
      `- **Stats:** ${report.word_count} words | ${report.sentence_count} sentences` +
        (report.turn_count ? ` | ${report.turn_count} turns` : ""),
      "",
      "## Axis Breakdown",
      `- **Evidence Density:** ${report.axes.evidence_density}/100`,
      `- **Calibration:** ${report.axes.calibration}/100`,
      `- **Rhetorical Neutrality:** ${report.axes.rhetorical_neutrality}/100`,
      `- **Structural Integrity:** ${report.axes.structural_integrity}/100`,
      `- **Independence / Anti-Sycophancy:** ${report.axes.independence}/100`,
      "",
    ];

    lines.push("## Flagged Signals");
    if (report.findings.length) {
      for (const f of report.findings) {
        lines.push(
          `- **[${f.severity.toUpperCase()}] ${f.label}** (${f.category}): "${f.excerpt}"\n` +
            `  - *Why:* ${f.explanation}\n` +
            `  - *Fix:* ${f.suggestion}`
        );
      }
    } else {
      lines.push("- No deterministic red-flag patterns detected.");
    }
    lines.push("");

    if (report.positive_signals.length) {
      lines.push("## Positive Epistemic Signals");
      for (const s of report.positive_signals) lines.push(`- ${s}`);
      lines.push("");
    }

    if (report.crux_questions.length) {
      lines.push("## Crux & Falsification Questions");
      report.crux_questions.forEach((q, idx) => lines.push(`${idx + 1}. ${q}`));
      lines.push("");
    }

    if (deepAudit) {
      lines.push("## Deep LLM Adversarial Audit");
      if (deepAudit.steelman) lines.push(`### Steelman\n${deepAudit.steelman}\n`);
      if (deepAudit.counterArgument) lines.push(`### Mature Counterpoint\n${deepAudit.counterArgument}\n`);
    }

    if (report.counterweight_prompt) {
      lines.push("## Counterweight Reset / Steelman Prompt", "```text", report.counterweight_prompt, "```");
    }
    return lines.join("\n");
  }

  const api = { auditText, buildCounterweightPrompt, formatMarkdownReport };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    rootScope.CounterweightEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);