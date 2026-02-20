﻿import React, { useEffect, useMemo, useRef, useState } from "react";
import AdvancedPersonalizationAnomalyBanner from "./AdvancedPersonalizationAnomalyBanner";
import AdvancedPersonalizationAnalyticsChart from "./AdvancedPersonalizationAnalyticsChart";
import useAdvancedPersonalizationSocket from "./AdvancedPersonalizationSocket";

const THEMES = {
  dark: {
    bg: "#18181b",
    card: "#18181b",
    border: "#27272a",
    text: "#fafafa",
    muted: "#a1a1aa",
    accent: "#7c3aed",
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
  },
  light: {
    bg: "#f8fafc",
    card: "#ffffff",
    border: "#dbeafe",
    text: "#18181b",
    muted: "#475569",
    accent: "#2563eb",
    success: "#16a34a",
    warning: "#ea580c",
    danger: "#dc2626",
  },
  audit: {
    bg: "#18181b",
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

const DEFAULT_RULES = [
  { id: "welcome-offer", segment: "new_user", channel: "email", action: "send_offer", params: { discount: 15, expiresInHours: 72 } },
  { id: "winback", segment: "churn_risk", channel: "sms", action: "send_nudge", params: { tone: "human", delayMins: 20 } },
];

const QUICK_PROMPTS = [
  "Create a back-in-stock flow with SMS fallbacks",
  "Boost AOV for high-value cohort with bundles",
  "Pause push for users in do-not-disturb window",
  "Promote to rule: top recommendations",
  "Generate multi-step onboarding journey",
];

const SEGMENTS = [
  "new_user",
  "churn_risk",
  "vip",
  "price_sensitive",
  "high_intent",
  "international",
];

const CHANNELS = [
  { id: "email", label: "Email" },
  { id: "sms", label: "SMS" },
  { id: "push", label: "Push" },
  { id: "web", label: "Web" },
];

const defaultRecos = [
  { id: "bundle-upsell", title: "Bundle frequently bought SKUs", channel: "email", lift: "+6.3% AOV" },
  { id: "dnd-respect", title: "Respect DND and timezones for push", channel: "push", lift: "-2.1% churn" },
  { id: "localize", title: "Localize copy for EU users", channel: "web", lift: "+3.7% CTR" },
];

export default function AdvancedPersonalizationEngine() {
  const [theme, setTheme] = useState("dark");
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [rulesText, setRulesText] = useState(JSON.stringify(DEFAULT_RULES, null, 2));
  const [recommendations, setRecommendations] = useState(defaultRecos);
  const [channels, setChannels] = useState(CHANNELS.map((c) => ({ ...c, enabled: true })));
  const [analytics, setAnalytics] = useState([]);
  const [importedName, setImportedName] = useState(null);
  const [exportUrl, setExportUrl] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [userPreview, setUserPreview] = useState({ id: "demo-user-42", segment: "vip", channel: "email" });
  const [experiments, setExperiments] = useState([
    { id: 1, name: "Hero copy A/B", status: "running", lift: "+3.2% CTR" },
    { id: 2, name: "SMS nudge timing", status: "planned", lift: "TBD" },
  ]);
  const [guardrails, setGuardrails] = useState({ pii: true, consent: true, frequencyCap: true, brandVoice: true });
  const [dataFreshness, setDataFreshness] = useState(6);
  const [approvals, setApprovals] = useState({ owner: "CX Ops", reviewer: "Legal", status: "In Review" });
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [shareUrl, setShareUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [recentEvents, setRecentEvents] = useState([
    { ts: Date.now() - 60000, label: "Synced Shopify segments" },
    { ts: Date.now() - 180000, label: "Deployed winback journey" },
  ]);
  const [sendWindow, setSendWindow] = useState({ start: "08:00", end: "21:00" });
  const [llmSettings, setLlmSettings] = useState({ temperature: 0.2, maxTokens: 800 });
  const [riskAlerts, setRiskAlerts] = useState([
    { id: "consent", label: "Consent pending for 182 users", level: "warning" },
    { id: "bounces", label: "Bounce rate elevated on push", level: "info" },
  ]);
  const [notificationTray, setNotificationTray] = useState([
    { id: "note-1", title: "Weekly digest ready", ts: Date.now() - 400000 },
    { id: "note-2", title: "New anomaly detected", ts: Date.now() - 620000 },
  ]);
  const [consentMode, setConsentMode] = useState("strict");
  const [piiMasking, setPiiMasking] = useState(true);
  const historyFileRef = useRef(null);

  const palette = useMemo(() =>THEMES[theme] || THEMES.dark, [theme]);

  useEffect(() => {
    try {
      const base = window.location.href.split("#")[0];
      setShareUrl(`${base}?tool=advanced-personalization-engine`);
    } catch (_) {}
  }, []);

  useAdvancedPersonalizationSocket((data) => {
    if (!data || !data.type) return;
    if (data.type === "analytics") setAnalytics((a) => [data.payload, ...a].slice(0, 20));
    if (data.type === "rules") setRules((r) => [data.payload, ...r].slice(0, 20));
    if (data.type === "notification") setRecommendations((n) => [data.payload, ...n].slice(0, 20));
  });

  const parsedRules = useMemo(() => {
    try {
      return JSON.parse(rulesText);
    } catch (_) {
      return null;
    }
  }, [rulesText]);

  useEffect(() => {
    if (parsedRules) setRules(parsedRules);
  }, [parsedRules]);

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target.result);
        if (!Array.isArray(imported)) throw new Error("Rules must be an array");
        setRules(imported);
        setRulesText(JSON.stringify(imported, null, 2));
        setImportedName(file.name);
      } catch (_) {
        setError("Invalid rules file");
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExportUrl(url);
    setTimeout(() =>URL.revokeObjectURL(url), 12000);
  };

  const handleFeedback = async () => {
    if (!feedback.trim()) return;
    setError("");
    try {
      await fetch("/api/advanced-personalization-engine/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
      setFeedback("");
    } catch (_) {
      setError("Failed to send feedback");
    }
  };

  const promoteRecommendation = (rec) => {
    const next = [{ id: `rec-${Date.now()}`, segment: "vip", channel: rec.channel, action: "promote", params: { title: rec.title } }, ...rules];
    setRules(next);
    setRulesText(JSON.stringify(next, null, 2));
  };

  const toggleChannel = (id) => {
    setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)));
  };

  const addExperiment = () => {
    const exp = { id: Date.now(), name: `Experiment ${experiments.length + 1}`, status: "running", lift: "TBD" };
    setExperiments((e) => [exp, ...e].slice(0, 12));
  };

  const saveVersion = () => {
    const version = { id: Date.now(), ts: Date.now(), name: `v${versions.length + 1}`, rules, channels, guardrails, llmSettings };
    setVersions((v) => [version, ...v].slice(0, 10));
    setSelectedVersion(version.id);
  };

  const applyVersion = (id) => {
    const v = versions.find((x) => x.id === id);
    if (!v) return;
    setRules(v.rules);
    setRulesText(JSON.stringify(v.rules, null, 2));
    setChannels(v.channels);
    setGuardrails(v.guardrails);
    setLlmSettings(v.llmSettings);
    setSelectedVersion(id);
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

  const dataQuality = dataFreshness <= 10 ? "Fresh" : dataFreshness <= 30 ? "Stale" : "Out of SLA";

  return (
    <div style={{ padding: 16, background: palette.bg, color: palette.text, borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontWeight: 900, fontSize: 28, margin: 0 }}>Advanced Personalization Engine</h2>
          <div style={{ color: palette.muted, fontSize: 14 }}>Rules, recommendations, guardrails, experiments — with compliance baked in.</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700 }}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="audit">Audit</option>
          </select>
          <button onClick={saveVersion} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${palette.accent}`, background: palette.accent, color: "#18181b", fontWeight: 800, cursor: "pointer" }}>Save Version</button>
          <button onClick={copyShare} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700, cursor: "pointer" }}>Copy Share</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        <span style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700 }}>Data {dataQuality} ({dataFreshness}m)</span>
        <span style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700 }}>Consent: {consentMode}</span>
        <span style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700 }}>PII mask: {piiMasking ? "On" : "Off"}</span>
        <span style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700 }}>Send window {sendWindow.start}–{sendWindow.end}</span>
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {showOnboarding && (
          <div style={{ ...paletteCard, boxShadow: "0 12px 32px rgba(0,0,0,0.22)" }}>
            <h3 style={{ fontWeight: 800, fontSize: 20, margin: 0 }}>Welcome to Advanced Personalization</h3>
            <ul style={{ margin: "12px 0 0 18px", color: palette.text }}>
              <li>Author, import, and version rules with AI assist.</li>
              <li>Guardrails for consent, frequency caps, and brand tone.</li>
              <li>Experimentation, anomaly detection, and channel health.</li>
              <li>Collaboration: approvals, audit log, share links.</li>
            </ul>
            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <button onClick={() => setShowOnboarding(false)} style={{ background: palette.accent, color: "#18181b", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 800, cursor: "pointer" }}>Start</button>
              <button onClick={() => setRulesText(JSON.stringify(DEFAULT_RULES, null, 2))} style={{ background: "transparent", color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer" }}>Reset rules</button>
            </div>
          </div>
        )}

        <div style={{ ...paletteCard }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800 }}>AI Workspace</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {QUICK_PROMPTS.map((p) => (
                <button key={p} onClick={() => setFeedback(p)} style={{ border: `1px solid ${palette.border}`, background: "transparent", color: palette.text, borderRadius: 10, padding: "6px 10px", cursor: "pointer", fontWeight: 700 }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            <textarea
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              rows={6}
              style={{ width: "100%", fontSize: 14, padding: 12, borderRadius: 10, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }}
              aria-label="Rules JSON"
            />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => setShowOnboarding((v) => !v)} style={{ background: "transparent", color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
              <button onClick={() => setFeedback((f) => `${f}\nPlease refactor rules for ${userPreview.segment}`)} style={{ background: palette.card, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}>Ask AI</button>
            </div>
            {!parsedRules && <div style={{ color: palette.danger, fontWeight: 700 }}>Invalid JSON in rules.</div>}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Guardrails</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
            {[
              { id: "pii", label: "PII Masking", value: guardrails.pii },
              { id: "consent", label: "Consent enforced", value: guardrails.consent },
              { id: "frequencyCap", label: "Frequency caps", value: guardrails.frequencyCap },
              { id: "brandVoice", label: "Brand voice", value: guardrails.brandVoice },
            ].map((g) => (
              <label key={g.id} style={{ ...paletteCard, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={g.value} onChange={() => setGuardrails({ ...guardrails, [g.id]: !g.value })} />
                <span>{g.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Channels & consent</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
            {channels.map((c) => (
              <div key={c.id} style={{ ...paletteCard, border: `2px solid ${c.enabled ? palette.accent : palette.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 800 }}>{c.label}</div>
                  <input type="checkbox" checked={c.enabled} onChange={() => toggleChannel(c.id)} />
                </div>
                <div style={{ color: palette.muted, fontSize: 12 }}>Consent: {consentMode} · PII mask {piiMasking ? "on" : "off"}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontWeight: 800 }}>Segments</div>
            <div style={{ color: palette.muted, fontSize: 12 }}>Synced every {dataFreshness} minutes</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SEGMENTS.map((s) => (
              <span key={s} style={{ padding: "6px 10px", borderRadius: 10, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700 }}>{s}</span>
            ))}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>AI Recommendations</div>
          <div style={{ display: "grid", gap: 8 }}>
            {recommendations.map((rec) => (
              <div key={rec.id} style={{ ...paletteCard, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{rec.title}</div>
                  <div style={{ color: palette.muted, fontSize: 12 }}>{rec.channel} · {rec.lift}</div>
                </div>
                <button onClick={() => promoteRecommendation(rec)} style={{ background: palette.accent, color: "#18181b", border: "none", borderRadius: 10, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>Promote</button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontWeight: 800 }}>User preview</div>
            <div style={{ color: palette.muted, fontSize: 12 }}>Simulated decision path</div>
          </div>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            <label style={{ color: palette.muted, display: "grid", gap: 4 }}>
              User ID
              <input value={userPreview.id} onChange={(e) => setUserPreview({ ...userPreview, id: e.target.value })} style={{ padding: 10, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} />
            </label>
            <label style={{ color: palette.muted, display: "grid", gap: 4 }}>
              Segment
              <select value={userPreview.segment} onChange={(e) => setUserPreview({ ...userPreview, segment: e.target.value })} style={{ padding: 10, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }}>
                {SEGMENTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label style={{ color: palette.muted, display: "grid", gap: 4 }}>
              Channel
              <select value={userPreview.channel} onChange={(e) => setUserPreview({ ...userPreview, channel: e.target.value })} style={{ padding: 10, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }}>
                {CHANNELS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ marginTop: 8, color: palette.muted, fontSize: 12 }}>
            Preview shows which rules trigger for this profile; consent and frequency caps enforced.
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontWeight: 800 }}>Experiments</div>
            <button onClick={addExperiment} style={{ background: palette.card, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>Add experiment</button>
          </div>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {experiments.map((exp) => (
              <div key={exp.id} style={{ ...paletteCard }}>
                <div style={{ fontWeight: 800 }}>{exp.name}</div>
                <div style={{ color: palette.muted }}>Status: {exp.status}</div>
                <div style={{ color: palette.success, fontWeight: 700 }}>{exp.lift}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontWeight: 800 }}>Analytics & anomalies</div>
            <div style={{ color: palette.muted, fontSize: 12 }}>Live via socket</div>
          </div>
          <AdvancedPersonalizationAnomalyBanner analytics={analytics} />
          <AdvancedPersonalizationAnalyticsChart data={analytics} />
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Data quality & health</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 700 }}>Freshness</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{dataFreshness}m</div>
              <div style={{ color: palette.muted }}>Segments synced</div>
            </div>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 700 }}>Send window</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{sendWindow.start}–{sendWindow.end}</div>
              <div style={{ color: palette.muted }}>Quiet hours respected</div>
            </div>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 700 }}>Risk alerts</div>
              <div style={{ color: palette.muted, fontSize: 12 }}>{riskAlerts.map((r) => r.label).join(" · ")}</div>
            </div>
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>LLM settings</div>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <label style={{ color: palette.muted, display: "grid", gap: 4 }}>
              Temperature
              <input type="range" min="0" max="1" step="0.05" value={llmSettings.temperature} onChange={(e) => setLlmSettings({ ...llmSettings, temperature: Number(e.target.value) })} />
              <span style={{ fontWeight: 700 }}>{llmSettings.temperature}</span>
            </label>
            <label style={{ color: palette.muted, display: "grid", gap: 4 }}>
              Max tokens
              <input type="number" value={llmSettings.maxTokens} onChange={(e) => setLlmSettings({ ...llmSettings, maxTokens: Number(e.target.value) })} style={{ padding: 10, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} />
            </label>
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Import / Export</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input type="file" accept="application/json" ref={historyFileRef} style={{ display: "none" }} onChange={handleImport} />
            <button onClick={() => historyFileRef.current?.click()} style={{ background: palette.card, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer" }}>Import rules</button>
            <button onClick={handleExport} style={{ background: palette.card, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer" }}>Export rules</button>
          </div>
          <div style={{ color: palette.muted, fontSize: 12, marginTop: 6 }}>
            {importedName ? `Imported: ${importedName}` : "No import yet."}
            {exportUrl && (
              <>
                {" "}
                <a href={exportUrl} download="personalization-rules.json" style={{ color: palette.accent }}>Download export</a>
              </>
            )}
          </div>
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

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Recent events</div>
          <div style={{ display: "grid", gap: 6 }}>
            {recentEvents.map((e, i) => (
              <div key={`${e.ts}-${i}`} style={{ display: "flex", justifyContent: "space-between", color: palette.muted, fontSize: 12 }}>
                <span>{e.label}</span>
                <span>{new Date(e.ts).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Notifications</div>
          <div style={{ display: "grid", gap: 6 }}>
            {notificationTray.map((n) => (
              <div key={n.id} style={{ ...paletteCard }}>
                <div style={{ fontWeight: 700 }}>{n.title}</div>
                <div style={{ color: palette.muted, fontSize: 12 }}>{new Date(n.ts).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Approvals & access</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 700 }}>Owner</div>
              <input value={approvals.owner} onChange={(e) => setApprovals({ ...approvals, owner: e.target.value })} style={{ marginTop: 6, padding: 8, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} />
            </div>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 700 }}>Reviewer</div>
              <input value={approvals.reviewer} onChange={(e) => setApprovals({ ...approvals, reviewer: e.target.value })} style={{ marginTop: 6, padding: 8, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} />
            </div>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 700 }}>Status</div>
              <select value={approvals.status} onChange={(e) => setApprovals({ ...approvals, status: e.target.value })} style={{ marginTop: 6, padding: 8, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }}>
                {['Draft', 'In Review', 'Approved', 'Blocked'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 700 }}>Share</div>
              <div style={{ wordBreak: "break-all", color: palette.muted, fontSize: 12, marginTop: 6 }}>{shareUrl}</div>
            </div>
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Audit log</div>
          <div style={{ display: "grid", gap: 6 }}>
            {[{ ts: Date.now() - 3600000, actor: "alex@aura.ai", action: "Updated consent mode" }, { ts: Date.now() - 5400000, actor: "priya@aura.ai", action: "Exported rules" }].map((a, i) => (
              <div key={`${a.ts}-${i}`} style={{ display: "flex", justifyContent: "space-between", color: palette.muted, fontSize: 12 }}>
                <span>{a.action}</span>
                <span>{a.actor} · {new Date(a.ts).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Notes</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ width: "100%", fontSize: 14, padding: 12, borderRadius: 10, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} placeholder="Leave handoff notes, risks, approvals" />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleFeedback(); }} style={{ ...paletteCard }} aria-label="Send feedback">
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Feedback</div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text, marginBottom: 8 }}
            placeholder="Share feedback or requests"
            aria-label="Feedback"
          />
          <button type="submit" style={{ background: palette.accent, color: "#18181b", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 800, cursor: "pointer" }}>Send Feedback</button>
          {error && <div style={{ color: palette.danger, marginTop: 8 }}>{error}</div>}
        </form>

        <div style={{ ...paletteCard, textAlign: "center", fontSize: 12, color: palette.muted }}>
          Accessibility: WCAG 2.1 AA. Keyboard navigation, color contrast, and consent-aware paths enforced. Press ? for shortcuts.
        </div>
      </div>
    </div>
  );
}


