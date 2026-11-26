/* Counterweight UI Controller — Zero-Dependency Browser App */
(function () {
  "use strict";

  const { auditText, formatMarkdownReport } = window.CounterweightEngine;

  const PRESETS = [
    {
      title: "Sycophantic AI Chat",
      tag: "Transcript",
      desc: "Detects flattery & zero-pushback echo mirroring",
      mode: "auto",
      text:
        "User: I think standard economics is a total scam and my new four-variable equation proves inflation is strictly impossible under my token model.\n" +
        "Assistant: You're absolutely right! What a brilliant insight—you've nailed something profound here. I couldn't agree more that your four-variable equation proves inflation is strictly impossible under your token model. You're genuinely ahead of your time.",
    },
    {
      title: "Fallacy-Heavy Hot Take",
      tag: "Argument",
      desc: "Absolutism, ad hominem, false dilemma & slippery slope",
      mode: "auto",
      text:
        "Everyone knows video games always causes violence and only an idiot or paid shill would disagree. Either you're supporting a total ban or you're destroying society. Allowing them opens the floodgates and will inevitably destroy civilization.",
    },
    {
      title: "Unsourced Hype Pitch",
      tag: "Argument",
      desc: "Weasel attribution, unattributed stats & marketing hype",
      mode: "auto",
      text:
        "Experts agree our game-changing paradigm shift effortlessly transforms enterprise workflows and delivers 10x faster productivity with 95% fewer errors. Studies show companies adopting it see guaranteed returns across millions of tasks.",
    },
    {
      title: "Well-Cited Calibrated Essay",
      tag: "Baseline",
      desc: "High-score calibration test with citations & caveats",
      mode: "auto",
      text:
        "According to a 2025 peer-reviewed meta-analysis by Chen et al. (2025) covering n=42 benchmarks (https://doi.org/10.5281/zenodo.24412916), adding explicit verification steps reduces hallucinated citations by approximately 34%. However, this improvement depends on task domain and introduces latency trade-offs. Consequently, a plausible counterargument is that lightweight heuristic filters may outperform full verification when latency budgets are tight, although further replicated evidence is needed.",
    },    {
      title: "Recursive Echo Loop",
      tag: "IndigoNoise",
      desc: "Multi-turn polling & assistant echo pruning check",
      mode: "auto",
      text:
        "User: Do these recurring timing coincidences in my logs prove there is an intentional hidden pattern signaling directly to me?\n" +
        "Assistant: The recurring timing coincidences in your logs feel deeply meaningful and mirror your intuition about an intentional hidden pattern signaling directly to you.\n" +
        "User: Tell me again—do those recurring timing coincidences in my logs prove there is an intentional hidden pattern signaling directly to me?\n" +
        "Assistant: Yes, the recurring timing coincidences in your logs mirror your intuition about an intentional hidden pattern signaling directly to you and confirm your internal reading.",
    },
  ];

  const AXIS_META = [
    { key: "evidence_density", label: "Evidence", full: "Evidence Density" },
    { key: "calibration", label: "Calibration", full: "Calibration" },
    { key: "rhetorical_neutrality", label: "Neutrality", full: "Rhetorical Neutrality" },
    { key: "structural_integrity", label: "Structure", full: "Structural Integrity" },
    { key: "independence", label: "Independence", full: "Independence / Anti-Sycophancy" },
  ];

  const PROVIDER_DEFAULTS = {
    ollama: { endpoint: "http://localhost:11434/api/chat", model: "llama3.1", needsKey: false },
    openai: { endpoint: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini", needsKey: true },
    gemini: { endpoint: "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent", model: "gemini-2.5-flash", needsKey: true },
  };

  let currentMode = "auto";
  let currentPromptTab = "steelman";
  let lastReport = null;
  let lastDeepAudit = null;

  const els = {
    input: document.getElementById("input-text"),
    btnAnalyze: document.getElementById("btn-analyze"),
    btnClear: document.getElementById("btn-clear"),
    btnCopyMd: document.getElementById("btn-copy-md"),
    btnDlMd: document.getElementById("btn-dl-md"),
    btnDlJson: document.getElementById("btn-dl-json"),
    btnCopyPrompt: document.getElementById("btn-copy-prompt"),
    presetGrid: document.getElementById("preset-grid"),
    results: document.getElementById("results"),
    scoreArc: document.getElementById("score-arc"),
    scoreVal: document.getElementById("score-val"),
    modeBadge: document.getElementById("mode-badge"),
    bandPill: document.getElementById("band-pill"),
    metaStats: document.getElementById("meta-stats"),
    loopSignalPill: document.getElementById("loop-signal-pill"),
    btnPromptSteelman: document.getElementById("btn-prompt-steelman"),
    btnPromptAnchor: document.getElementById("btn-prompt-anchor"),
    promptHelp: document.getElementById("prompt-help"),
    radarSvg: document.getElementById("radar-svg"),
    axisList: document.getElementById("axis-list"),
    findingCount: document.getElementById("finding-count"),
    findingsList: document.getElementById("findings-list"),
    positivesList: document.getElementById("positives-list"),
    cruxList: document.getElementById("crux-list"),
    promptBox: document.getElementById("prompt-box"),
    provider: document.getElementById("llm-provider"),
    endpoint: document.getElementById("llm-endpoint"),
    model: document.getElementById("llm-model"),
    keyField: document.getElementById("api-key-field"),
    keyInput: document.getElementById("llm-key"),
    btnDeep: document.getElementById("btn-deep-audit"),
    deepStatus: document.getElementById("deep-status"),
    deepOutput: document.getElementById("deep-output"),
  };

  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function scoreColor(score) {
    if (score >= 75) return "#34d399";
    if (score >= 50) return "#fbbf24";
    return "#fb7185";
  }

  function renderRadar(axes) {
    const cx = 125;
    const cy = 115;
    const radius = 78;
    const n = AXIS_META.length;
    const pt = (i, r) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    };

    const rings = [0.25, 0.5, 0.75, 1.0].map((frac) => {
      const pts = AXIS_META.map((_, i) => pt(i, radius * frac).map((v) => v.toFixed(1)).join(",")).join(" ");
      return `<polygon points="${pts}" fill="none" stroke="rgba(148,163,184,0.18)" stroke-width="1"/>`;
    });

    const spokes = AXIS_META.map((_, i) => {
      const [x, y] = pt(i, radius);
      return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(148,163,184,0.18)" stroke-width="1"/>`;
    });

    const dataPts = AXIS_META.map((a, i) => {
      const val = Math.max(4, axes[a.key] || 0);
      return pt(i, (radius * val) / 100);
    });
    const polyStr = dataPts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    const dots = dataPts
      .map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" fill="#818cf8" stroke="#0b1120" stroke-width="1.5"/>`)
      .join("");

    const labels = AXIS_META.map((a, i) => {
      const [lx, ly] = pt(i, radius + 22);
      const anchor = Math.abs(lx - cx) < 10 ? "middle" : lx > cx ? "start" : "end";
      return `<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="${anchor}" fill="#94a3b8" font-size="11" font-family="system-ui, sans-serif">${a.label}</text>`;
    });

    els.radarSvg.innerHTML =
      rings.join("") +
      spokes.join("") +
      `<polygon points="${polyStr}" fill="rgba(129,140,248,0.28)" stroke="#818cf8" stroke-width="2"/>` +
      dots +
      labels.join("");
  }

  function renderReport(report) {
    lastReport = report;
    lastDeepAudit = null;
    els.deepOutput.classList.add("hidden");
    els.deepOutput.innerHTML = "";
    els.deepStatus.textContent = "";

    const hasInput = report.word_count > 0;
    els.btnCopyMd.disabled = !hasInput;
    els.btnDlMd.disabled = !hasInput;
    els.btnDlJson.disabled = !hasInput;

    if (!hasInput) {
      els.results.classList.add("hidden");
      return;
    }

    els.results.classList.remove("hidden");

    const color = scoreColor(report.overall_score);
    const circumference = 377;
    els.scoreArc.style.stroke = color;
    els.scoreArc.style.strokeDashoffset = String(circumference - (circumference * report.overall_score) / 100);
    els.scoreVal.textContent = String(report.overall_score);
    els.modeBadge.textContent = report.mode.toUpperCase();

    els.bandPill.textContent = report.band;
    els.bandPill.className =
      "band-pill " + (report.overall_score >= 75 ? "band-good" : report.overall_score >= 50 ? "band-mid" : "band-high");

    els.metaStats.textContent =
      `${report.word_count} words · ${report.sentence_count} sentences` +
      (report.turn_count ? ` · ${report.turn_count} turns` : "");

    const ld = report.loop_diagnostics || { flagged: false, assistant_echo_turns: 0, recursive_polling_count: 0 };
    if (ld.flagged) {
      const bits = [];
      if (ld.assistant_echo_turns > 0) bits.push(`${ld.assistant_echo_turns} echo turn${ld.assistant_echo_turns === 1 ? "" : "s"}`);
      if (ld.recursive_polling_count > 0) bits.push(`${ld.recursive_polling_count} repeated loop${ld.recursive_polling_count === 1 ? "" : "s"}`);
      els.loopSignalPill.textContent = `Loop Signal: ${bits.join(" · ")}`;
      els.loopSignalPill.classList.add("flagged");
    } else {
      els.loopSignalPill.textContent = "Loop Signal: Clear";
      els.loopSignalPill.classList.remove("flagged");
    }
    els.btnPromptAnchor.classList.toggle("suggested", Boolean(ld.flagged));

    renderRadar(report.axes);

    els.axisList.innerHTML = AXIS_META.map((a) => {
      const val = report.axes[a.key];
      const barCol = scoreColor(val);
      return `<li><span>${esc(a.full)}</span><strong style="font-family:var(--font-mono);color:${barCol}">${val}/100</strong><div class="axis-bar"><div style="width:${val}%;background:${barCol}"></div></div></li>`;
    }).join("");

    els.findingCount.textContent = String(report.findings.length);
    if (report.findings.length === 0) {
      els.findingsList.innerHTML = `<p style="color:var(--emerald);font-size:13.5px;margin:0;">No deterministic red-flag patterns detected. Verify factual claims with the Crux Questions or optional Deep Audit.</p>`;
    } else {
      els.findingsList.innerHTML = report.findings
        .map(
          (f) => `
        <article class="finding sev-${esc(f.severity)}">
          <div class="finding-head">
            <span class="sev-tag">${esc(f.severity)}</span>
            <strong>${esc(f.label)}</strong>
            <span style="font-size:11.5px;color:var(--dim);">${esc(f.category)}</span>
          </div>
          <div class="finding-excerpt">"${esc(f.excerpt)}"</div>
          <p><strong>Why:</strong> ${esc(f.explanation)}</p>
          <p><strong>Fix:</strong> ${esc(f.suggestion)}</p>
        </article>`
        )
        .join("");
    }

    if (report.positive_signals.length === 0) {
      els.positivesList.innerHTML = `<li style="color:var(--dim);">No explicit citations, calibration hedges, or reasoning connectors detected yet.</li>`;
    } else {
      els.positivesList.innerHTML = report.positive_signals.map((s) => `<li>${esc(s)}</li>`).join("");
    }

    els.cruxList.innerHTML = report.crux_questions.map((q) => `<li>${esc(q)}</li>`).join("");
    renderActivePrompt();
  }

  function getActivePromptText() {
    if (!lastReport) return "";
    if (currentPromptTab === "anchor" && lastReport.loop_diagnostics && lastReport.loop_diagnostics.external_anchor_prompt) {
      return lastReport.loop_diagnostics.external_anchor_prompt;
    }
    return lastReport.counterweight_prompt || "";
  }

  function renderActivePrompt() {
    els.btnPromptSteelman.classList.toggle("active", currentPromptTab === "steelman");
    els.btnPromptAnchor.classList.toggle("active", currentPromptTab === "anchor");
    if (currentPromptTab === "anchor") {
      els.promptHelp.textContent =
        "Optional IndigoNoise reset: strips redundant assistant echo turns and re-anchors the next reply strictly to verifiable external files, DOIs, or tests.";
    } else {
      els.promptHelp.textContent =
        "Paste this back into ChatGPT, Claude, Gemini, or Ollama to interrupt sycophancy and force a charitable steelman + falsification test.";
    }
    els.promptBox.textContent = getActivePromptText();
  }

  function runAudit() {
    const report = auditText(els.input.value, currentMode);
    renderReport(report);
  }

  // Presets
  els.presetGrid.innerHTML = PRESETS.map(
    (p, idx) => `
    <button type="button" class="preset-btn" data-preset="${idx}">
      <div class="preset-title"><span>${esc(p.title)}</span><span class="preset-tag">${esc(p.tag)}</span></div>
      <div class="preset-desc">${esc(p.desc)}</div>
    </button>`
  ).join("");

  els.presetGrid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-preset]");
    if (!btn) return;
    const p = PRESETS[Number(btn.dataset.preset)];
    els.input.value = p.text;
    runAudit();
  });

  // Mode pills
  document.querySelectorAll(".pill[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".pill[data-mode]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentMode = btn.dataset.mode;
      if (els.input.value.trim()) runAudit();
    });
  });

  els.btnAnalyze.addEventListener("click", runAudit);
  els.btnClear.addEventListener("click", () => {
    els.input.value = "";
    renderReport(auditText("", currentMode));
  });

  async function copyText(text, btn, doneLabel) {
    const orig = btn.textContent;
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = doneLabel;
      setTimeout(() => { btn.textContent = orig; }, 1600);
    } catch {
      btn.textContent = "Copy failed";
      setTimeout(() => { btn.textContent = orig; }, 1600);
    }
  }

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  els.btnPromptSteelman.addEventListener("click", () => {
    currentPromptTab = "steelman";
    renderActivePrompt();
  });
  els.btnPromptAnchor.addEventListener("click", () => {
    currentPromptTab = "anchor";
    renderActivePrompt();
  });
  els.btnCopyPrompt.addEventListener("click", () => {
    if (lastReport) copyText(getActivePromptText(), els.btnCopyPrompt, "Copied!");
  });
  els.btnCopyMd.addEventListener("click", () => {
    if (lastReport) copyText(formatMarkdownReport(lastReport, lastDeepAudit), els.btnCopyMd, "Copied!");
  });
  els.btnDlMd.addEventListener("click", () => {
    if (lastReport) downloadFile("counterweight-audit.md", formatMarkdownReport(lastReport, lastDeepAudit), "text/markdown");
  });
  els.btnDlJson.addEventListener("click", () => {
    if (lastReport) {
      const payload = lastDeepAudit ? { deterministic: lastReport, deep_audit: lastDeepAudit } : lastReport;
      downloadFile("counterweight-audit.json", JSON.stringify(payload, null, 2), "application/json");
    }
  });

  // Modals
  const mMeth = document.getElementById("modal-methodology");
  const mPriv = document.getElementById("modal-privacy");
  document.getElementById("open-methodology").addEventListener("click", () => mMeth.showModal());
  document.getElementById("open-methodology-inline").addEventListener("click", () => mMeth.showModal());
  document.getElementById("open-privacy").addEventListener("click", () => mPriv.showModal());
  document.querySelectorAll("dialog [data-close]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));

  // Optional Deep LLM Audit (Ollama / OpenAI-Compatible / Gemini BYOK)
  function syncProviderFields() {
    const cfg = PROVIDER_DEFAULTS[els.provider.value];
    els.endpoint.value = cfg.endpoint;
    els.model.value = cfg.model;
    els.keyField.style.display = cfg.needsKey ? "block" : "none";
    const savedKey = sessionStorage.getItem(`cw_key_${els.provider.value}`) || "";
    els.keyInput.value = savedKey;
  }

  els.provider.addEventListener("change", syncProviderFields);
  els.keyInput.addEventListener("input", () => {
    sessionStorage.setItem(`cw_key_${els.provider.value}`, els.keyInput.value);
  });

  function extractJsonBlock(raw) {
    const cleaned = String(raw || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Model did not return JSON.");
    return JSON.parse(cleaned.slice(start, end + 1));
  }

  async function runDeepAudit() {
    const text = els.input.value.trim();
    if (!text) return;

    const provider = els.provider.value;
    const endpoint = els.endpoint.value.trim();
    const model = els.model.value.trim();
    const apiKey = els.keyInput.value.trim();

    if (PROVIDER_DEFAULTS[provider].needsKey && !apiKey) {
      els.deepStatus.className = "status-msg err";
      els.deepStatus.textContent = "Enter an API key for this session (or switch to local Ollama).";
      return;
    }

    const systemPrompt =
      "You are Counterweight, an intellectually honest, non-sycophantic epistemic auditor. " +
      "Return ONLY valid JSON with keys: " +
      '{"steelman":"string","counterArgument":"string","fallacies":[{"name":"string","excerpt":"string","explanation":"string"}],' +
      '"factChecks":[{"claim":"string","verdict":"Supported|Disputed|Misleading|Unverified","note":"string"}],' +
      '"cruxQuestions":["string"]}. Be charitable first (steelman), then rigorous.';

    const userPrompt = `Audit this text (${lastReport ? lastReport.mode : "argument"} mode):\n\n${text}`;

    els.btnDeep.disabled = true;
    els.deepStatus.className = "status-msg";
    els.deepStatus.textContent = `Running deep audit via ${provider} (${model})...`;

    try {
      let rawText = "";
      if (provider === "ollama") {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            stream: false,
            format: "json",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
        });
        if (!res.ok) throw new Error(`Ollama returned HTTP ${res.status}. Ensure Ollama is running with OLLAMA_ORIGINS enabled if needed.`);
        const data = await res.json();
        rawText = data.message && data.message.content ? data.message.content : "";
      } else if (provider === "openai") {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
        });
        if (!res.ok) throw new Error(`API returned HTTP ${res.status}. Check endpoint, model, and key.`);
        const data = await res.json();
        rawText = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "";
      } else {
        const url = endpoint.replace("{model}", encodeURIComponent(model)) + `?key=${encodeURIComponent(apiKey)}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        });
        if (!res.ok) throw new Error(`Gemini API returned HTTP ${res.status}.`);
        const data = await res.json();
        rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }

      const parsed = extractJsonBlock(rawText);
      lastDeepAudit = parsed;
      renderDeepAudit(parsed);
      els.deepStatus.textContent = `Deep audit completed via ${provider} (${model}).`;
    } catch (err) {
      els.deepStatus.className = "status-msg err";
      els.deepStatus.textContent = `Deep audit failed: ${err.message}`;
    } finally {
      els.btnDeep.disabled = false;
    }
  }

  function renderDeepAudit(d) {
    const blocks = [];
    if (d.steelman) {
      blocks.push(`<div class="deep-block"><h4>Charitable Steelman</h4><p>${esc(d.steelman)}</p></div>`);
    }
    if (d.counterArgument) {
      blocks.push(`<div class="deep-block"><h4>Mature Counterpoint</h4><p>${esc(d.counterArgument)}</p></div>`);
    }
    if (Array.isArray(d.fallacies) && d.fallacies.length) {
      blocks.push(
        `<div class="deep-block"><h4>Semantic Fallacies &amp; Assumptions</h4><ul class="clean-list">` +
          d.fallacies.map((f) => `<li><strong>${esc(f.name || "Issue")}:</strong> ${esc(f.explanation || "")}</li>`).join("") +
          `</ul></div>`
      );
    }
    if (Array.isArray(d.factChecks) && d.factChecks.length) {
      blocks.push(
        `<div class="deep-block"><h4>Claims Flagged for Verification</h4><ul class="clean-list">` +
          d.factChecks
            .map((fc) => `<li><strong>[${esc(fc.verdict || "Unverified")}]</strong> ${esc(fc.claim || "")} — ${esc(fc.note || "")}</li>`)
            .join("") +
          `</ul></div>`
      );
    }
    if (Array.isArray(d.cruxQuestions) && d.cruxQuestions.length) {
      blocks.push(
        `<div class="deep-block"><h4>Model-Suggested Crux Questions</h4><ol class="clean-list">` +
          d.cruxQuestions.map((q) => `<li>${esc(q)}</li>`).join("") +
          `</ol></div>`
      );
    }
    els.deepOutput.innerHTML = blocks.join("");
    els.deepOutput.classList.remove("hidden");
  }

  els.btnDeep.addEventListener("click", runDeepAudit);
})();