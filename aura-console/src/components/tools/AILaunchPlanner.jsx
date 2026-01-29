import React, { useEffect, useMemo, useRef, useState } from "react";
import BackButton from "./BackButton";

const THEMES = {
  dark: {
    bg: "#0b1220",
    card: "#0f172a",
    border: "#1f2937",
    text: "#e5e7eb",
    muted: "#9ca3af",
    accent: "#38bdf8",
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
  },
  light: {
    bg: "#f8fafc",
    card: "#ffffff",
    border: "#dbeafe",
    text: "#0f172a",
    muted: "#475569",
    accent: "#2563eb",
    success: "#16a34a",
    warning: "#ea580c",
    danger: "#dc2626",
  },
  audit: {
    bg: "#0c1a1c",
    card: "#0f2529",
    border: "#17424a",
    text: "#d8f3ff",
    muted: "#7fb1be",
    accent: "#38bdf8",
    success: "#22c55e",
    warning: "#fbbf24",
    danger: "#f87171",
  },
};

const QUICK_PROMPTS = [
  "Create a product launch plan for Q2",
  "Generate a risk register for launch",
  "Draft go-to-market checklist for beta",
  "Channel plan for paid + lifecycle",
  "Contingency plan for rollout freeze",
];

const DEFAULT_PHASES = [
  { name: "Discovery", owner: "PM", start: "2026-02-01", end: "2026-02-07", status: "Done" },
  { name: "Build", owner: "Eng", start: "2026-02-08", end: "2026-02-21", status: "In Progress" },
  { name: "Beta", owner: "CX", start: "2026-02-22", end: "2026-03-01", status: "Planned" },
  { name: "GA", owner: "Marketing", start: "2026-03-05", end: "2026-03-07", status: "Planned" },
];

const DEFAULT_CHECKS = [
  { id: "legal", label: "Legal review completed", done: false },
  { id: "perf", label: "Performance test signed off", done: false },
  { id: "docs", label: "Docs & help center updated", done: true },
  { id: "support", label: "Support playbooks ready", done: false },
];

const DEFAULT_RISKS = [
  { id: 1, title: "Traffic spike overloads service", level: "high", owner: "SRE" },
  { id: 2, title: "Messaging misalignment", level: "medium", owner: "Marketing" },
  { id: 3, title: "Late dependency from partner", level: "high", owner: "Alliances" },
];

const DEFAULT_CHANNELS = [
  { id: "email", name: "Email", enabled: true },
  { id: "inapp", name: "In-app", enabled: true },
  { id: "ads", name: "Paid Ads", enabled: false },
  { id: "social", name: "Social", enabled: true },
];

const DEFAULT_TASKS = [
  { id: 1, title: "Finalize launch narrative", status: "In Progress" },
  { id: 2, title: "Create FAQ doc", status: "Open" },
  { id: 3, title: "Set up status page banner", status: "Blocked" },
];

export default function AILaunchPlanner() {
  const [theme, setTheme] = useState("dark");
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [phases, setPhases] = useState(DEFAULT_PHASES);
  const [checks, setChecks] = useState(DEFAULT_CHECKS);
  const [risks, setRisks] = useState(DEFAULT_RISKS);
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  const [budget, setBudget] = useState(45000);
  const [owner, setOwner] = useState("PMM");
  const [reviewer, setReviewer] = useState("Legal");
  const [status, setStatus] = useState("In Review");
  const [shareUrl, setShareUrl] = useState("");
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [metrics, setMetrics] = useState({ signups: 1200, ctr: 4.2, cvr: 2.1 });
  const [guardrails, setGuardrails] = useState({ pii: true, rollback: true, comms: true, statuspage: true });
  const [dependencies, setDependencies] = useState([
    { name: "Billing toggle", status: "Ready" },
    { name: "New pricing page", status: "In Progress" },
    { name: "Email templates", status: "Blocked" },
  ]);
  const [incidentPlan, setIncidentPlan] = useState("Rollback within 15m, status page, comms to customers in 30m.");
  const [launchDay, setLaunchDay] = useState("2026-03-07");
  const [approvals, setApprovals] = useState([
    { id: "legal", role: "Legal", status: "Pending" },
    { id: "security", role: "Security", status: "Approved" },
    { id: "marketing", role: "Marketing", status: "Pending" },
  ]);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Beta cohort confirmed", ts: Date.now() - 600000 },
    { id: 2, title: "Risk updated: partner dependency", ts: Date.now() - 3600000 },
  ]);
  const [notes, setNotes] = useState("");
  const [checklistOwner, setChecklistOwner] = useState("Ops");
  const [goNoGo, setGoNoGo] = useState("Go, pending legal");
  const fileInputRef = useRef();

  const palette = useMemo(() => THEMES[theme] || THEMES.dark, [theme]);

  useEffect(() => {
    try {
      const url = window.location.href.split("#")[0];
      setShareUrl(`${url}?tool=ai-launch-planner`);
    } catch (_) {}
  }, []);

  const handleRun = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    try {
      const res = await fetch("/api/ai-launch-planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, launchDay, channels, guardrails }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      const reply = data.reply || "No response";
      setResponse(reply);
      setHistory((prev) => [{ input, reply }, ...prev].slice(0, 15));
    } catch (err) {
      setError(err.message || "Unable to run");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const importedHistory = JSON.parse(evt.target.result);
        if (!Array.isArray(importedHistory)) throw new Error("Invalid history");
        setHistory(importedHistory.slice(0, 25));
        setImported(file.name);
      } catch (_) {
        setError("Invalid file format");
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 12000);
  };

  const handleFeedback = async () => {
    if (!feedback.trim()) return;
    setError("");
    try {
      await fetch("/api/ai-launch-planner/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
      setFeedback("");
    } catch (_) {
      setError("Failed to send feedback");
    }
  };

  const toggleCheck = (id) => setChecks((c) => c.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  const toggleChannel = (id) => setChannels((c) => c.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)));
  const toggleGuardrail = (k) => setGuardrails((g) => ({ ...g, [k]: !g[k] }));

  const saveVersion = () => {
    const version = {
      id: Date.now(),
      name: `v${versions.length + 1}`,
      ts: Date.now(),
      phases,
      checks,
      risks,
      channels,
      budget,
      owner,
      reviewer,
      status,
    };
    setVersions((v) => [version, ...v].slice(0, 12));
    setSelectedVersion(version.id);
  };

  const applyVersion = (id) => {
    const v = versions.find((x) => x.id === id);
    if (!v) return;
    setPhases(v.phases);
    setChecks(v.checks);
    setRisks(v.risks);
    setChannels(v.channels);
    setBudget(v.budget);
    setOwner(v.owner);
    setReviewer(v.reviewer);
    setStatus(v.status);
    setSelectedVersion(v.id);
  };

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (_) {
      setError("Clipboard unavailable");
    }
  };

  const paletteCard = {
    background: palette.card,
    border: `1px solid ${palette.border}`,
    borderRadius: 12,
    padding: 12,
  };

  return (
    <div style={{ background: palette.bg, borderRadius: 12, padding: 16, color: palette.text }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontWeight: 900, fontSize: 28, margin: 0 }}>AI Launch Planner</h2>
          <div style={{ color: palette.muted, fontSize: 14 }}>Plan, stage, and ship launches with guardrails and approvals.</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700 }}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="audit">Audit</option>
          </select>
          <button onClick={saveVersion} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${palette.accent}`, background: palette.accent, color: "#0f172a", fontWeight: 800, cursor: "pointer" }}>Save Version</button>
          <button onClick={copyShare} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700, cursor: "pointer" }}>Copy Share</button>
        </div>
      </div>

      <BackButton />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        <span style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700 }}>Status: {status}</span>
        <span style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700 }}>Budget ${budget.toLocaleString()}</span>
        <span style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700 }}>Launch day {launchDay}</span>
        <span style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700 }}>Owner {owner}</span>
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {showOnboarding && (
          <div style={{ ...paletteCard, boxShadow: "0 12px 32px rgba(0,0,0,0.22)" }}>
            <h3 style={{ fontWeight: 800, fontSize: 20, margin: 0 }}>Welcome to AI Launch Planner</h3>
            <ul style={{ margin: "12px 0 0 18px", color: palette.text }}>
              <li>Generate launch plans, risks, and checklists with AI.</li>
              <li>Guardrails: rollback, comms, consent, and status pages.</li>
              <li>Collaboration: approvals, versions, share links.</li>
              <li>Channels, budget, dependencies, and metrics in one view.</li>
            </ul>
            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <button onClick={() => setShowOnboarding(false)} style={{ background: palette.accent, color: "#0f172a", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 800, cursor: "pointer" }}>Start</button>
              <button onClick={() => setChecks(DEFAULT_CHECKS)} style={{ background: "transparent", color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer" }}>Reset checks</button>
            </div>
          </div>
        )}

        <div style={{ ...paletteCard }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800 }}>AI Workspace</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {QUICK_PROMPTS.map((p) => (
                <button key={p} onClick={() => setInput(p)} style={{ border: `1px solid ${palette.border}`, background: "transparent", color: palette.text, borderRadius: 10, padding: "6px 10px", cursor: "pointer", fontWeight: 700 }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
              style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 10, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }}
              placeholder="Describe your launch or ask a question..."
              aria-label="AILaunchPlanner input"
            />
            <button
              onClick={handleRun}
              disabled={loading || !input}
              style={{ background: palette.accent, color: "#0f172a", border: `1px solid ${palette.accent}`, borderRadius: 10, padding: "12px 18px", fontWeight: 800, cursor: loading || !input ? "not-allowed" : "pointer" }}
            >
              {loading ? "Running..." : "Run Tool"}
            </button>
            {error && <div style={{ color: palette.danger }}>{error}</div>}
          </div>
          {response && (
            <div style={{ marginTop: 16, ...paletteCard }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>AI Response</div>
              <div style={{ whiteSpace: "pre-wrap" }}>{response}</div>
            </div>
          )}
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Phases</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
            {phases.map((p) => (
              <div key={p.name} style={{ ...paletteCard, border: `2px solid ${p.status === "In Progress" ? palette.accent : palette.border}` }}>
                <div style={{ fontWeight: 800 }}>{p.name}</div>
                <div style={{ color: palette.muted, fontSize: 12 }}>Owner: {p.owner}</div>
                <div style={{ color: palette.muted, fontSize: 12 }}>{p.start} → {p.end}</div>
                <div style={{ color: p.status === "Planned" ? palette.muted : palette.success, fontWeight: 700 }}>{p.status}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Go / No-Go checklist</div>
          <div style={{ display: "grid", gap: 8 }}>
            {checks.map((c) => (
              <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={c.done} onChange={() => toggleCheck(c.id)} />
                <span>{c.label}</span>
              </label>
            ))}
            <div style={{ color: palette.muted, fontSize: 12 }}>Owner: {checklistOwner}. Decision: {goNoGo}</div>
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontWeight: 800 }}>Channels</div>
            <div style={{ color: palette.muted, fontSize: 12 }}>Toggle active channels</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
            {channels.map((c) => (
              <div key={c.id} style={{ ...paletteCard, border: `1px solid ${c.enabled ? palette.accent : palette.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 800 }}>{c.name}</div>
                  <input type="checkbox" checked={c.enabled} onChange={() => toggleChannel(c.id)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontWeight: 800 }}>Guardrails</div>
            <div style={{ color: palette.muted, fontSize: 12 }}>Rollback + comms</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
            {Object.entries(guardrails).map(([k, v]) => (
              <label key={k} style={{ ...paletteCard, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={v} onChange={() => toggleGuardrail(k)} />
                <span>{k}</span>
              </label>
            ))}
          </div>
          <div style={{ color: palette.muted, fontSize: 12, marginTop: 6 }}>Incident plan: {incidentPlan}</div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Risks</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
            {risks.map((r) => (
              <div key={r.id} style={{ ...paletteCard, border: `1px solid ${r.level === "high" ? palette.danger : palette.border}` }}>
                <div style={{ fontWeight: 800 }}>{r.title}</div>
                <div style={{ color: palette.muted, fontSize: 12 }}>Owner: {r.owner}</div>
                <div style={{ color: r.level === "high" ? palette.danger : r.level === "medium" ? palette.warning : palette.text, fontWeight: 700 }}>{r.level.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Dependencies</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
            {dependencies.map((d) => (
              <div key={d.name} style={{ ...paletteCard }}>
                <div style={{ fontWeight: 800 }}>{d.name}</div>
                <div style={{ color: palette.muted, fontSize: 12 }}>{d.status}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Tasks</div>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {DEFAULT_TASKS.map((t) => (
              <div key={t.id} style={{ ...paletteCard }}>
                <div style={{ fontWeight: 800 }}>{t.title}</div>
                <div style={{ color: t.status === "Blocked" ? palette.danger : palette.text, fontWeight: 700 }}>{t.status}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Budget & metrics</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
            <label style={{ color: palette.muted, display: "grid", gap: 4 }}>
              Budget ($)
              <input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} style={{ padding: 10, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} />
            </label>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 800 }}>Signups</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{metrics.signups}</div>
              <div style={{ color: palette.muted, fontSize: 12 }}>Goal trending</div>
            </div>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 800 }}>CTR</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{metrics.ctr}%</div>
              <div style={{ color: palette.muted, fontSize: 12 }}>Top channel: Email</div>
            </div>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 800 }}>CVR</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{metrics.cvr}%</div>
              <div style={{ color: palette.muted, fontSize: 12 }}>Beta cohort</div>
            </div>
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Approvals</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
            {approvals.map((a) => (
              <div key={a.id} style={{ ...paletteCard }}>
                <div style={{ fontWeight: 800 }}>{a.role}</div>
                <div style={{ color: a.status === "Pending" ? palette.warning : palette.success, fontWeight: 700 }}>{a.status}</div>
              </div>
            ))}
          </div>
          <div style={{ color: palette.muted, fontSize: 12, marginTop: 6 }}>Owner: {owner} · Reviewer: {reviewer} · Share: {shareUrl}</div>
        </div>

        {versions.length > 0 && (
          <div style={{ ...paletteCard }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Versions</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => applyVersion(v.id)}
                  style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${selectedVersion === v.id ? palette.accent : palette.border}`, background: selectedVersion === v.id ? palette.card : "transparent", color: palette.text, fontWeight: 700, cursor: "pointer" }}
                >
                  {v.name} · {new Date(v.ts).toLocaleTimeString()}
                </button>
              ))}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div style={{ ...paletteCard }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Insights History</div>
            <div style={{ display: "grid", gap: 8 }}>
              {history.map((h, i) => (
                <div key={`${h.input}-${i}`} style={{ ...paletteCard }}>
                  <div style={{ fontWeight: 700 }}>{h.input?.slice(0, 80)}{h.input?.length > 80 ? "..." : ""}</div>
                  <div style={{ color: palette.muted, fontSize: 12 }}>{h.reply?.slice(0, 140)}{h.reply?.length > 140 ? "..." : ""}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Import / Export</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input type="file" accept="application/json" ref={fileInputRef} style={{ display: "none" }} onChange={handleImport} />
            <button onClick={() => fileInputRef.current?.click()} style={{ background: palette.card, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer" }}>Import History</button>
            <button onClick={handleExport} style={{ background: palette.card, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer" }}>Export History</button>
          </div>
          <div style={{ color: palette.muted, fontSize: 12, marginTop: 6 }}>
            {imported ? `Imported: ${imported}` : "No import yet."}
            {exported && (
              <>
                {" "}
                <a href={exported} download="ai-launch-planner-history.json" style={{ color: palette.accent }}>Download export</a>
              </>
            )}
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleFeedback(); }} style={{ ...paletteCard }} aria-label="Send feedback">
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Feedback</div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text, marginBottom: 8 }}
            placeholder="Share your feedback or suggestions..."
            aria-label="Feedback"
          />
          <button type="submit" style={{ background: palette.accent, color: "#0f172a", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 800, cursor: "pointer" }}>Send Feedback</button>
          {error && <div style={{ color: palette.danger, marginTop: 8 }}>{error}</div>}
        </form>

        <div style={{ ...paletteCard, textAlign: "center", fontSize: 12, color: palette.muted }}>
          Accessibility: WCAG 2.1 AA. Keyboard navigation, color contrast, status pages, and rollback plans enforced. Press ? for shortcuts.
        </div>
      </div>
    </div>
  );
}
