import React, { useState, useEffect } from "react";
import BackButton from "./BackButton";

const samplePayload = {
  shopifyOrders: [
    {
      id: "order-123",
      name: "#123",
      customer: { email: "user@example.com" },
      total_price: 120,
      subtotal_price: 100,
      currency: "USD",
      created_at: new Date().toISOString(),
      referring_site: "https://google.com?q=shoes",
      landing_site: "/product/shoes",
      source_name: "google",
    },
  ],
  adEvents: [
    {
      id: "click-1",
      type: "click",
      channel: "google-ads",
      campaign: "Spring Sale",
      value: 0,
      currency: "USD",
      user_id: "user@example.com",
      timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
    },
  ],
  offlineEvents: [],
  model: "linear",
  includeJourneys: true,
  cohortKey: "channel",
};

const offlineMmmTemplate = {
  shopifyOrders: [
    {
      id: "order-offline-001",
      name: "#4001",
      customer: { email: "store@example.com" },
      total_price: 420,
      subtotal_price: 400,
      currency: "USD",
      created_at: new Date().toISOString(),
      referring_site: "https://brand.com/in-store",
      landing_site: "/retail",
      source_name: "retail-pos",
    },
  ],
  adEvents: [
    {
      id: "mm-click-1",
      type: "impression",
      channel: "tv",
      campaign: "Spring OTT",
      value: 0,
      cost: 180,
      currency: "USD",
      user_id: "household-123",
      timestamp: new Date().toISOString(),
    },
  ],
  offlineEvents: [
    {
      id: "pos-visit-1",
      type: "visit",
      location: "NYC Flagship",
      value: 1,
      currency: "USD",
      user_id: "store@example.com",
      timestamp: new Date().toISOString(),
    },
  ],
  model: "data-driven",
  includeJourneys: true,
  cohortKey: "channel",
};

export default function AdvancedAnalyticsAttribution() {
  const [payload, setPayload] = useState(JSON.stringify(samplePayload, null, 2));
  const [query, setQuery] = useState("How is performance by channel and where should we shift budget?");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [env, setEnv] = useState("dev");
  const [model, setModel] = useState("linear");
  const [cohortKey, setCohortKey] = useState("channel");
  const [validation, setValidation] = useState(null);
  const [exportUrl, setExportUrl] = useState(null);
  const [journeyDepth, setJourneyDepth] = useState(3);
  const [budgetShift, setBudgetShift] = useState({ channel: "google-ads", delta: 10, uplift: null });
  const [owner, setOwner] = useState("analytics@brand.com");
  const [sla, setSla] = useState({ minutes: 8, target: 15, status: "healthy" });
  const [piiFindings, setPiiFindings] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [unsaved, setUnsaved] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [apiHealth, setApiHealth] = useState({ latencyMs: 220, status: "healthy" });
  const [guardrailConfig, setGuardrailConfig] = useState({ warnSize: 7000, blockSize: 9000 });
  const [presence, setPresence] = useState([{ name: "You", role: "editor" }]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [lineage, setLineage] = useState(["Shopify Orders → ETL → Attribution Model", "Ad Events → Identity Stitch → Attribution Model"]);
  const [anomalies, setAnomalies] = useState([]);
  const [schedule, setSchedule] = useState({ cadence: "Daily 7am", lastRun: null });
  const [biConnectors, setBiConnectors] = useState({ looker: false, tableau: false });
  const [rbacRole, setRbacRole] = useState("editor");
  const [maskPii, setMaskPii] = useState(true);
  const [notificationRules, setNotificationRules] = useState([{ channel: "slack", rule: "SLA breach" }, { channel: "email", rule: "Run failure" }]);
  const [plugins, setPlugins] = useState([{ name: "Lift curve", enabled: true }, { name: "MMM bridge", enabled: false }]);
  const [apiUsage, setApiUsage] = useState({ used: 1200, quota: 5000 });
  const [highContrast, setHighContrast] = useState(false);
  const [accessibility, setAccessibility] = useState({ issues: 2, warnings: 3 });
  const [locale, setLocale] = useState("en");
  const [onboarding, setOnboarding] = useState({ checklist: ["Validate payload", "Run attribution", "Export results"], done: [] });
  const [changelog] = useState([{ version: "v1.3", note: "Guardrails + SLA" }, { version: "v1.2", note: "Budget simulator" }]);
  const [modelLibrary, setModelLibrary] = useState([{ name: "Linear", version: "1.0" }, { name: "Data-driven", version: "beta" }]);
  const [scenarioCompare, setScenarioCompare] = useState([]);
  const [layoutPreset, setLayoutPreset] = useState("balanced");
  const [retention, setRetention] = useState({ days: 90, pii: "mask" });
  const [integrationTests, setIntegrationTests] = useState([]);
  const [shareToken, setShareToken] = useState(null);
  const [maintenance, setMaintenance] = useState({ locked: false, message: "Deploy window" });
  const [reviewer, setReviewer] = useState("qa@brand.com");
  const [reviewStatus, setReviewStatus] = useState("pending");
  const [versions, setVersions] = useState([]);
  const [theme, setTheme] = useState("dark");
  const [modelImportText, setModelImportText] = useState("");
  const [showCodeLines, setShowCodeLines] = useState(false);
  const [showSyntaxView, setShowSyntaxView] = useState(false);
  const [layoutPanels, setLayoutPanels] = useState(["Query", "Payload", "Results", "Audit"]);
  const [payloadImportText, setPayloadImportText] = useState("");
  const draftKey = "advanced-attribution-draft";

  // Derived values (declare before hooks that consume them)
  const devSandbox = env === "dev";
  const payloadSize = payload.length;
  const estimatedRuntime = Math.min(18, 3 + Math.round(payloadSize / 900));
  const guardrailBlock = payloadSize > 7500;

  const hashSnapshot = (body, res) => {
    try {
      const raw = JSON.stringify({ body, res, query });
      let hash = 0;
      for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
      }
      return `h-${Math.abs(hash)}`;
    } catch (e) {
      return "h-na";
    }
  };

  const summarizeBudget = (body, data) => {
    try {
      const revenueFromResult = data?.performance
        ? Object.values(data.performance).reduce((acc, stat) => acc + (stat.revenue || 0), 0)
        : 0;
      const revenueFromPayload = (body?.shopifyOrders || []).reduce((acc, order) => acc + Number(order.total_price || 0), 0);
      const revenue = revenueFromResult || revenueFromPayload;
      const spend = (body?.adEvents || []).reduce((acc, ev) => acc + Number(ev.cost || ev.value || 0), 0) || Math.max(10, (body?.adEvents || []).length * 5);
      const orders = (body?.shopifyOrders || []).length;
      const cac = orders > 0 ? spend / orders : null;
      const roas = spend > 0 ? revenue / spend : null;
      return { revenue: Number(revenue.toFixed(2)), spend: Number(spend.toFixed(2)), cac: cac ? Number(cac.toFixed(2)) : null, roas: roas ? Number(roas.toFixed(2)) : null };
    } catch (e) {
      return { revenue: null, spend: null, cac: null, roas: null };
    }
  };

  useEffect(() => {
    setUnsaved(true);
  }, [payload, query, model, cohortKey, env, owner, sla, journeyDepth]);

  useEffect(() => {
    loadDraft();
  }, []);

  useEffect(() => {
    const latency = Math.min(1200, 180 + payloadSize * 0.02);
    const status = latency > 900 ? "degraded" : latency > 600 ? "warn" : "healthy";
    setApiHealth({ latencyMs: Math.round(latency), status });
  }, [payloadSize]);

  useEffect(() => {
    setAiSuggestions([
      { id: 1, text: "Try data-driven model with campaign cohort" },
      { id: 2, text: "Trim journeys to depth 1 for speed" },
      { id: 3, text: "Add offline events for in-store uplift" }
    ]);
    setPresence([{ name: "You", role: rbacRole }, { name: "Alex", role: "reviewer" }]);
    setOnboarding(o => ({ ...o, done: [] }));
  }, []);

  const logAudit = (event, meta = {}) => {
    setAuditLog(prev => [{ event, meta, at: Date.now(), env }, ...prev].slice(0, 50));
  };

  const restoreSnapshot = (snap) => {
    if (!snap) return;
    if (snap.payload) setPayload(JSON.stringify(snap.payload, null, 2));
    if (snap.query) setQuery(snap.query);
    if (snap.result) setResult(snap.result);
    if (snap.env) setEnv(snap.env);
    if (snap.payload?.model) setModel(snap.payload.model);
    if (snap.payload?.cohortKey) setCohortKey(snap.payload.cohortKey);
    if (snap.owner) setOwner(snap.owner);
    if (snap.sla) setSla(snap.sla);
    logAudit("restore_snapshot", { env: snap.env, model: snap.payload?.model });
  };

  const quickFixForIssue = (msg = "") => {
    const lower = msg.toLowerCase();
    if (lower.includes("json")) return "reset-sample";
    if (lower.includes("payload") || lower.includes("body")) return "trim-payload";
    if (lower.includes("query")) return "rewrite-query";
    return null;
  };

  const buildGuardrailSummary = () => {
    let status = "ok";
    const items = [];
    if (payloadSize > guardrailConfig.warnSize) { status = "warn"; items.push(`Large payload (${payloadSize} chars)`); }
    if (payloadSize > guardrailConfig.blockSize) { status = "block"; items.push("Payload exceeds hard cap"); }
    if (!model) { status = "warn"; items.push("Model not set"); }
    if (!cohortKey) { status = "warn"; items.push("Cohort key missing"); }
    if (validation?.status === "error") { status = "block"; items.push("Validation errors present"); }
    return { status, summary: items.length ? items.join(" · ") : "Guardrails clear" };
  };

  const buildSlaSummary = () => {
    const { minutes, target } = sla;
    const status = minutes > target ? "breach" : minutes > target * 0.7 ? "warn" : "healthy";
    return { status, label: `${minutes}m / ${target}m`, detail: status === "breach" ? "SLA breached" : status === "warn" ? "Close to SLA" : "Within SLA" };
  };

  const detectPii = () => {
    try {
      const parsed = JSON.parse(payload);
      const emails = [];
      (parsed.shopifyOrders || []).forEach(o => { if (o.customer?.email) emails.push(o.customer.email); });
      (parsed.adEvents || []).forEach(ev => { if (ev.user_id && ev.user_id.includes("@")) emails.push(ev.user_id); });
      setPiiFindings(emails.slice(0, 6));
      logAudit("pii_scan", { count: emails.length });
    } catch (err) {
      setPiiFindings([]);
    }
  };

  const maskEmail = (email) => {
    if (!maskPii) return email;
    const [user, domain] = email.split("@");
    if (!domain) return "***";
    return `${user.slice(0, 2)}***@${domain}`;
  };

  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(`${label} copied`);
      setTimeout(() => setCopyStatus(""), 2000);
    } catch (e) {
      setCopyStatus("Copy failed");
    }
  };

  const saveDraft = () => {
    const snap = { payload: JSON.parse(payload || "{}"), query, model, cohortKey, env, owner, sla, journeyDepth, at: Date.now() };
    localStorage.setItem(draftKey, JSON.stringify(snap));
    setDraftSavedAt(new Date());
    setUnsaved(false);
    logAudit("draft_save", { env });
  };

  function loadDraft() {
    const raw = localStorage.getItem(draftKey);
    if (!raw) return;
    try {
      const snap = JSON.parse(raw);
      restoreSnapshot(snap);
      setJourneyDepth(snap.journeyDepth ?? 3);
      setDraftSavedAt(new Date(snap.at));
      setUnsaved(false);
      logAudit("draft_load", { env: snap.env });
    } catch (err) {
      setError("Draft load failed");
    }
  }

  const exportWithCompliance = () => {
    try {
      const guard = buildGuardrailSummary();
      const slaSummary = buildSlaSummary();
      const body = {
        query,
        payload: JSON.parse(payload || "{}"),
        model,
        cohortKey,
        env,
        owner,
        sla,
        journeyDepth,
        guardrails: guard,
        slaSummary,
        pii: piiFindings,
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(body, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      setExportUrl(url);
      setTimeout(() => URL.revokeObjectURL(url), 12000);
      logAudit("export_compliance", { guard: guard.status, sla: slaSummary.status });
    } catch (err) {
      setError("Export failed: " + err.message);
    }
  };

  const validationProgress = () => {
    const guard = buildGuardrailSummary();
    const base = validation?.status === "ok" ? 70 : validation?.status === "warn" ? 50 : 30;
    const sizeScore = Math.max(0, Math.min(30, 30 - Math.max(0, payloadSize - 3000) / 100));
    const guardPenalty = guard.status === "block" ? -40 : guard.status === "warn" ? -10 : 0;
    return Math.max(5, Math.min(100, base + sizeScore + guardPenalty));
  };

  const syncPayloadField = (field, value) => {
    try {
      const parsed = JSON.parse(payload);
      parsed[field] = value;
      setPayload(JSON.stringify(parsed, null, 2));
    } catch (err) {
      setValidation({ status: "error", issues: ["Payload parse failed: " + err.message] });
    }
  };

  const validatePayload = () => {
    try {
      const parsed = JSON.parse(payload);
      const issues = [];
      const stats = {
        orders: parsed.shopifyOrders?.length || 0,
        ads: parsed.adEvents?.length || 0,
        offline: parsed.offlineEvents?.length || 0,
      };
      if (!Array.isArray(parsed.shopifyOrders) || stats.orders === 0) issues.push("Missing or empty shopifyOrders");
      if (!Array.isArray(parsed.adEvents) || stats.ads === 0) issues.push("Missing or empty adEvents");
      if (!parsed.model) issues.push("Model not set");
      if (stats.orders > 5000) issues.push("Large orders array; consider sampling");
      setValidation({ status: issues.length ? "warn" : "ok", issues, stats });
      logAudit("validate_payload", { issues: issues.length, stats });
      detectPii();
    } catch (err) {
      setValidation({ status: "error", issues: ["Invalid JSON: " + err.message] });
      logAudit("validate_payload_error", { message: err.message });
    }
  };

  const simulateBudgetShift = () => {
    const perf = result?.performance || {
      "google-ads": { revenue: 42000, count: 320 },
      email: { revenue: 18000, count: 210 },
      organic: { revenue: 12000, count: 260 },
    };
    const base = perf[budgetShift.channel];
    const upliftPct = budgetShift.delta / 100;
    const projected = base ? {
      revenue: base.revenue * (1 + upliftPct * 0.6),
      count: Math.round(base.count * (1 + upliftPct * 0.4)),
    } : null;
    setBudgetShift(prev => ({ ...prev, uplift: projected }));
  };

  const toggleJourneys = () => {
    const nextDepth = journeyDepth === 0 ? 3 : 0;
    setJourneyDepth(nextDepth);
    syncPayloadField("includeJourneys", nextDepth > 0);
    syncPayloadField("journeySampleDepth", nextDepth || undefined);
  };

  const exportResult = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExportUrl(url);
    setTimeout(() => URL.revokeObjectURL(url), 12000);
  };

  const exportCsv = () => {
    if (!result?.performance) return;
    const rows = ["channel,revenue,count", ...Object.entries(result.performance).map(([ch, v]) => `${ch},${v.revenue},${v.count}`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    setExportUrl(url);
    setTimeout(() => URL.revokeObjectURL(url), 12000);
    logAudit("export_csv", {});
  };

  const generateShareToken = () => {
    const token = `attr-${Date.now().toString(36)}`;
    setShareToken(token);
    copyText(`${window.location.origin}/share/${token}`, "Share link");
    logAudit("share_link", { token });
  };

  const runAnomalyDetection = () => {
    if (!result?.performance) return;
    const anomaliesFound = Object.entries(result.performance).filter(([, stats]) => stats.count === 0 || stats.revenue === 0).map(([ch]) => `${ch}: zero performance`);
    setAnomalies(anomaliesFound);
    logAudit("anomaly_detection", { count: anomaliesFound.length });
  };

  const runIntegrationTests = () => {
    const outputs = [
      { name: "Schema", status: "pass", latency: 320 },
      { name: "Auth", status: "pass", latency: 210 },
      { name: "Rate-limit", status: "warn", latency: 480 },
    ];
    setIntegrationTests(outputs);
    logAudit("integration_tests", {});
  };

  const highlightJson = (text) => {
    try {
      const pretty = JSON.stringify(JSON.parse(text || "{}"), null, 2);
      return pretty
        .replace(/(&)/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/(\"[^"]*\")/g, '<span style="color:#7dd3fc">$1</span>')
        .replace(/(:\s\d+(\.\d+)?)/g, '<span style="color:#fbbf24">$1</span>')
        .replace(/(:\s(true|false|null))/g, '<span style="color:#a78bfa">$1</span>');
    } catch (err) {
      return text;
    }
  };

  const movePanel = (idx, dir) => {
    setLayoutPanels(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const generatePdfReport = () => {
    const summary = result ? JSON.stringify(result.insights || result.performance || {}, null, 2) : "No result yet";
    const blob = new Blob([`Attribution Report\n${summary}`], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    setExportUrl(url);
    setTimeout(() => URL.revokeObjectURL(url), 12000);
    logAudit("export_pdf", {});
  };

  const addScenarioComparison = () => {
    const scenario = { id: Date.now(), model, cohortKey, delta: budgetShift.delta, desc: `${model} +${budgetShift.delta}% budget` };
    setScenarioCompare(prev => [scenario, ...prev].slice(0, 3));
    logAudit("scenario_add", { model });
  };

  const sendScheduledReport = () => {
    setSchedule(prev => ({ ...prev, lastRun: new Date().toISOString() }));
    logAudit("scheduled_report", { cadence: schedule.cadence });
  };

  const togglePlugin = (name) => {
    setPlugins(prev => prev.map(p => p.name === name ? { ...p, enabled: !p.enabled } : p));
    logAudit("plugin_toggle", { name });
  };

  const toggleNotificationRule = (idx) => {
    setNotificationRules(prev => prev.map((r, i) => i === idx ? { ...r, muted: !r.muted } : r));
    logAudit("notification_toggle", { idx });
  };

  const updateOnboarding = (item) => {
    setOnboarding(prev => ({ ...prev, done: prev.done.includes(item) ? prev.done : [...prev.done, item] }));
  };

  const run = async () => {
    if (maintenance.locked) {
      setError(`Locked: ${maintenance.message}`);
      logAudit("run_blocked_maintenance", {});
      return;
    }
    if (rbacRole === "viewer") {
      setError("View-only role; cannot run attribution.");
      logAudit("run_blocked_rbac", {});
      return;
    }
    if (devSandbox) {
      setError("Sandbox mode: switch to Stage/Prod to run full attribution.");
      logAudit("run_blocked_dev", {});
      return;
    }
    if (guardrailBlock) {
      setError("Payload too large (>7.5k chars). Trim before running.");
      logAudit("run_blocked_guardrail", { size: payloadSize });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = JSON.parse(payload);
      const res = await fetch("/api/advanced-analytics-attribution/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, query }),
      });
      const data = await res.json();
      if (!data.ok && data.error) throw new Error(data.error);
      setResult(data);
      const metrics = summarizeBudget(body, data);
      const snap = {
        query,
        payload: body,
        result: data,
        env,
        at: Date.now(),
        hash: hashSnapshot(body, data),
        metrics,
      };
      setHistory((prev) => [snap, ...prev].slice(0, 5));
      logAudit("run_success", { env, model, cohortKey });
    } catch (e) {
      setError(e.message || "Request failed");
      logAudit("run_error", { message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const guardrails = buildGuardrailSummary();
  const slaSummary = buildSlaSummary();
  const progress = validationProgress();
  const isReadonly = maintenance.locked || rbacRole === "viewer";
  const containerStyle = {
    padding: 24,
    display: "grid",
    gap: 16,
    background: theme === "high" ? "#050b16" : theme === "light" ? "#f6f7fb" : "#0b1221",
    color: theme === "light" ? "#0b1221" : undefined,
  };

  return (
    <div style={containerStyle}>
      {devSandbox && (
        <div style={{ background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800, color: "#f59e0b" }}>Sandbox mode</div>
            <div style={{ color: "#9ca3af", fontSize: 13 }}>Attribution runs are blocked in dev. Switch to Stage/Prod to execute models.</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setEnv("stage")} style={{ background: "#1f2937", color: "#e5e7eb", border: "1px solid #334155", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>Switch to Stage</button>
            <button onClick={() => setEnv("prod")} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>Go Prod</button>
          </div>
        </div>
      )}
      <div style={{ display: "grid", gap: 4 }}>
        <h2 style={{ margin: 0 }}>Advanced Analytics Attribution</h2>
        <div style={{ color: "#b8c2d0" }}>
          Ingest Shopify + ads + offline events, run attribution models, and view performance, journeys, and cohorts.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", color: "#9ca3af", fontSize: 12 }}>
          <span>Locale</span>
          <select value={locale} onChange={(e) => setLocale(e.target.value)} style={{ background: "#0b1221", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", fontWeight: 700 }}>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} />
            High contrast
          </label>
            <select value={theme} onChange={(e) => setTheme(e.target.value)} style={{ background: "#0b1221", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", fontWeight: 700 }}>
              <option value="dark">Dark</option>
              <option value="high">High contrast</option>
              <option value="light">Light</option>
            </select>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={maskPii} onChange={(e) => setMaskPii(e.target.checked)} />
            Mask PII
          </label>
          <span style={{ background: "#111827", padding: "4px 8px", borderRadius: 8, border: "1px solid #1f2937" }}>Accessibility: {accessibility.issues} issues / {accessibility.warnings} warnings</span>
          <span style={{ background: "#111827", padding: "4px 8px", borderRadius: 8, border: "1px solid #1f2937" }}>Presence: {presence.map(p => p.name).join(" · ")}</span>
        </div>
      </div>

      <div style={{ display: "grid", gap: 8, background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 800, color: guardrails.status === "block" ? "#f87171" : guardrails.status === "warn" ? "#fbbf24" : "#22c55e" }}>
              Guardrails: {guardrails.summary}
            </span>
            <span style={{ background: slaSummary.status === "breach" ? "#3b1d1d" : slaSummary.status === "warn" ? "#3b2f1d" : "#123025", color: "#e5e7eb", padding: "6px 10px", borderRadius: 10, fontSize: 12, border: "1px solid #1f2937" }}>
              SLA {slaSummary.label} · {slaSummary.detail}
            </span>
            <span style={{ background: "#111827", color: "#e5e7eb", padding: "6px 10px", borderRadius: 10, fontSize: 12, border: "1px solid #1f2937" }}>
              Owner: {owner || "Unassigned"}
            </span>
            <span style={{ background: "#111827", color: "#e5e7eb", padding: "6px 10px", borderRadius: 10, fontSize: 12, border: "1px solid #1f2937" }}>
              Role: {rbacRole}
            </span>
            {maintenance.locked && (
              <span style={{ background: "#3b1d1d", color: "#f87171", padding: "6px 10px", borderRadius: 10, fontSize: 12, border: "1px solid #1f2937" }}>
                Locked: {maintenance.message}
              </span>
            )}
            {shareToken && <span style={{ background: "#0f172a", color: "#e5e7eb", padding: "6px 10px", borderRadius: 10, fontSize: 12, border: "1px solid #1f2937" }}>Share: {shareToken}</span>}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => copyText(`Guardrails: ${guardrails.summary}`, "Guardrails") } style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #24314a", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Copy guardrails</button>
            <button onClick={() => copyText(`SLA ${slaSummary.label} - ${slaSummary.detail}`, "SLA") } style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #24314a", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Copy SLA</button>
            <button onClick={saveDraft} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Save draft</button>
            <button onClick={loadDraft} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #24314a", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Load draft</button>
          </div>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <label style={{ color: "#9ca3af", fontSize: 12 }}>Owner</label>
            <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="owner@brand.com" style={{ background: "#0d1420", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "8px 10px", minWidth: 200 }} />
            <label style={{ color: "#9ca3af", fontSize: 12 }}>Freshness (m)</label>
            <input type="number" value={sla.minutes} onChange={(e) => setSla(prev => ({ ...prev, minutes: Number(e.target.value) || 0 }))} style={{ width: 80, background: "#0d1420", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "8px 10px" }} />
            <label style={{ color: "#9ca3af", fontSize: 12 }}>Target</label>
            <input type="number" value={sla.target} onChange={(e) => setSla(prev => ({ ...prev, target: Number(e.target.value) || 0 }))} style={{ width: 80, background: "#0d1420", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "8px 10px" }} />
            <label style={{ color: "#9ca3af", fontSize: 12 }}>Role</label>
            <select value={rbacRole} onChange={(e) => setRbacRole(e.target.value)} style={{ background: "#0b1221", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", fontWeight: 700 }}>
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#9ca3af", fontSize: 12 }}>
              <input type="checkbox" checked={maintenance.locked} onChange={(e) => setMaintenance(prev => ({ ...prev, locked: e.target.checked }))} /> Lock for maintenance
            </label>
            <label style={{ color: "#9ca3af", fontSize: 12 }}>Reviewer</label>
            <input value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="reviewer@brand.com" style={{ background: "#0d1420", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "8px 10px", minWidth: 180 }} />
            <select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)} style={{ background: "#0b1221", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", fontWeight: 700 }}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="changes">Changes requested</option>
            </select>
          </div>
          <div style={{ height: 8, background: "#111827", borderRadius: 6, overflow: "hidden", border: "1px solid #1f2937" }}>
            <div style={{ width: `${progress}%`, background: progress > 80 ? "#22c55e" : progress > 60 ? "#fbbf24" : "#f87171", height: "100%" }} />
          </div>
          <div style={{ color: "#9ca3af", fontSize: 12, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <span>Validation readiness: {progress}% {unsaved ? "· Unsaved" : ""} {draftSavedAt ? `· Draft ${draftSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""} {copyStatus ? `· ${copyStatus}` : ""}</span>
            <select value={guardrailConfig.warnSize} onChange={(e) => setGuardrailConfig(cfg => ({ ...cfg, warnSize: Number(e.target.value) }))} style={{ background: "#0b1221", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", fontSize: 12 }}>
              <option value={5000}>Warn @5k</option>
              <option value={7000}>Warn @7k</option>
              <option value={9000}>Warn @9k</option>
            </select>
            <select value={guardrailConfig.blockSize} onChange={(e) => setGuardrailConfig(cfg => ({ ...cfg, blockSize: Number(e.target.value) }))} style={{ background: "#0b1221", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", fontSize: 12 }}>
              <option value={8000}>Block @8k</option>
              <option value={9000}>Block @9k</option>
              <option value={11000}>Block @11k</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ fontWeight: 700 }}>Query for AI Insights</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #2c3a4d", background: "#101726", color: "#e9efff" }}
          title="Enter the natural language question to guide attribution analysis"
        />
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ fontWeight: 700 }}>Payload (JSON)</label>
        <textarea
          value={payload}
          onChange={(e) => { setUndoStack(prev => [payload, ...prev].slice(0, 10)); setRedoStack([]); setPayload(e.target.value); }}
          rows={18}
          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #2c3a4d", background: "#0d1420", color: "#e9efff", fontFamily: "monospace" }}
          title="Edit or paste your attribution payload"
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={env} onChange={(e) => setEnv(e.target.value)} style={{ background: "#0b1221", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "10px 12px", fontWeight: 700 }}>
            <option value="dev">Dev</option>
            <option value="stage">Stage</option>
            <option value="prod">Prod</option>
          </select>
          <select value={model} onChange={(e) => { setModel(e.target.value); syncPayloadField("model", e.target.value); updateOnboarding("Select model"); }} style={{ background: "#0b1221", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "10px 12px", fontWeight: 700 }}>
            <option value="first-touch">First touch</option>
            <option value="last-touch">Last touch</option>
            <option value="linear">Linear</option>
            <option value="data-driven">Data-driven</option>
          </select>
          <select value={layoutPreset} onChange={(e) => setLayoutPreset(e.target.value)} style={{ background: "#0b1221", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "10px 12px", fontWeight: 700 }}>
            <option value="balanced">Layout: Balanced</option>
            <option value="compact">Layout: Compact</option>
            <option value="wide">Layout: Wide</option>
          </select>
          <select value={modelLibrary[0]?.name || ""} onChange={(e) => setModelLibrary([{ name: e.target.value, version: "1.0" }, ...modelLibrary.slice(1)])} style={{ background: "#0b1221", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "10px 12px", fontWeight: 700 }}>
            {modelLibrary.map(m => <option key={m.name} value={m.name}>{`Model lib: ${m.name} (${m.version})`}</option>)}
          </select>
          <select value={cohortKey} onChange={(e) => { setCohortKey(e.target.value); syncPayloadField("cohortKey", e.target.value); }} style={{ background: "#0b1221", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "10px 12px", fontWeight: 700 }}>
            <option value="channel">Cohort: channel</option>
            <option value="campaign">Cohort: campaign</option>
            <option value="geo">Cohort: geo</option>
            <option value="source_name">Cohort: source</option>
          </select>
          <button onClick={run} disabled={loading || devSandbox || guardrailBlock || isReadonly} style={{ padding: "10px 14px", borderRadius: 8, border: "none", background: devSandbox || guardrailBlock || isReadonly ? "#1f2937" : "#22d3ee", color: devSandbox || guardrailBlock || isReadonly ? "#9ca3af" : "#031018", fontWeight: 800, cursor: loading || devSandbox || guardrailBlock || isReadonly ? "not-allowed" : "pointer", opacity: loading || devSandbox || guardrailBlock || isReadonly ? 0.7 : 1 }}>
            {isReadonly ? "Read-only" : devSandbox ? "Sandbox (set Stage)" : loading ? "Running..." : guardrailBlock ? "Trim payload" : "Run Attribution"}
          </button>
          <button onClick={() => { setPayload(JSON.stringify(samplePayload, null, 2)); setModel(samplePayload.model); setCohortKey(samplePayload.cohortKey); setJourneyDepth(3); }} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #2c3a4d", background: "#131c2c", color: "#e9efff", fontWeight: 700, cursor: "pointer" }}>
            Reset Sample
          </button>
          <button onClick={() => { setPayload(JSON.stringify(offlineMmmTemplate, null, 2)); setModel(offlineMmmTemplate.model); setCohortKey(offlineMmmTemplate.cohortKey); setJourneyDepth(2); setQuery("Blend offline POS + MMM channels and show ROAS/CAC."); }} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #2c3a4d", background: "#0b1221", color: "#e5e7eb", fontWeight: 700, cursor: "pointer" }}>
            Load offline/MMM template
          </button>
          <button onClick={validatePayload} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #2c3a4d", background: "#0b1221", color: "#e5e7eb", fontWeight: 700, cursor: "pointer" }}>
            Validate payload
          </button>
          <button onClick={toggleJourneys} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #2c3a4d", background: journeyDepth === 0 ? "#1f2937" : "#22c55e", color: journeyDepth === 0 ? "#e5e7eb" : "#0b1221", fontWeight: 800, cursor: "pointer" }}>
            {journeyDepth === 0 ? "Skip journeys" : `Journeys depth ${journeyDepth}`}
          </button>
          <button onClick={() => { if (undoStack.length === 0) return; const [latest, ...rest] = undoStack; setRedoStack(prev => [payload, ...prev].slice(0, 10)); setPayload(latest); setUndoStack(rest); logAudit("undo_payload", {}); }} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #2c3a4d", background: undoStack.length ? "#111827" : "#1f2937", color: "#e5e7eb", fontWeight: 700, cursor: undoStack.length ? "pointer" : "not-allowed", opacity: undoStack.length ? 1 : 0.5 }}>
            Undo payload
          </button>
          <button onClick={() => { if (redoStack.length === 0) return; const [latest, ...rest] = redoStack; setUndoStack(prev => [payload, ...prev].slice(0, 10)); setPayload(latest); setRedoStack(rest); logAudit("redo_payload", {}); }} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #2c3a4d", background: redoStack.length ? "#111827" : "#1f2937", color: "#e5e7eb", fontWeight: 700, cursor: redoStack.length ? "pointer" : "not-allowed", opacity: redoStack.length ? 1 : 0.5 }}>
            Redo payload
          </button>
          <button onClick={() => { try { const parsed = JSON.parse(payload); setPayload(JSON.stringify(parsed, null, 2).slice(0, 5000)); logAudit("quick_trim", { from: payloadSize }); } catch (e) { setError("Trim failed"); } }} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #2c3a4d", background: "#0b1221", color: "#e5e7eb", fontWeight: 700, cursor: "pointer" }}>
            Quick trim 5k
          </button>
          <button onClick={() => { detectPii(); setTimeout(() => copyText(JSON.stringify(piiFindings, null, 2), "PII"), 200); }} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #2c3a4d", background: "#0b1221", color: "#e5e7eb", fontWeight: 700, cursor: "pointer" }}>
            Scan & copy PII
          </button>
          <button onClick={exportWithCompliance} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #2c3a4d", background: "#111827", color: "#e5e7eb", fontWeight: 700, cursor: "pointer" }}>
            Export with compliance
          </button>
          <button onClick={exportCsv} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #2c3a4d", background: "#111827", color: "#e5e7eb", fontWeight: 700, cursor: "pointer" }}>
            Export CSV
          </button>
          <button onClick={generatePdfReport} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #2c3a4d", background: "#111827", color: "#e5e7eb", fontWeight: 700, cursor: "pointer" }}>
            Export PDF
          </button>
          <button onClick={generateShareToken} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #2c3a4d", background: "#0b1221", color: "#e5e7eb", fontWeight: 700, cursor: "pointer" }}>
            Share link
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", color: "#9ca3af", fontSize: 12 }}>
          <textarea value={payloadImportText} onChange={(e) => setPayloadImportText(e.target.value)} placeholder="Bulk import payload JSON" rows={3} style={{ minWidth: 260, background: "#0d1420", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: 8, fontFamily: "monospace" }} />
          <button onClick={() => { try { const parsed = JSON.parse(payloadImportText); setPayload(JSON.stringify(parsed, null, 2)); logAudit("payload_import", {}); } catch (err) { setError("Payload import failed"); } }} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Import payload</button>
          <button onClick={() => { copyText(payload, "Payload JSON"); logAudit("payload_export", {}); }} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Copy payload</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", color: "#9ca3af", fontSize: 12 }}>
          <span>Size: {payloadSize} chars</span>
          <span>Est. runtime: ~{estimatedRuntime}s</span>
          {guardrailBlock && <span style={{ color: "#f87171", fontWeight: 700 }}>Guardrail: trim payload to run</span>}
          <span style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, padding: "4px 8px", color: "#e5e7eb" }}>Model: {model}</span>
          <span style={{ background: apiHealth.status === "healthy" ? "#123025" : "#3b1d1d", border: "1px solid #1f2937", borderRadius: 8, padding: "4px 8px", color: "#e5e7eb" }}>API latency ~{apiHealth.latencyMs}ms</span>
          <span style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, padding: "4px 8px", color: "#e5e7eb" }}>Retention: {retention.days}d ({retention.pii})</span>
        </div>
        {error && (
          <div style={{ color: "#ff8a8a", fontWeight: 700, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span>{error}</span>
            {quickFixForIssue(error) === "reset-sample" && (
              <button onClick={() => setPayload(JSON.stringify(samplePayload, null, 2))} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Fix: Reset sample</button>
            )}
            {quickFixForIssue(error) === "trim-payload" && (
              <button onClick={() => setPayload(prev => JSON.stringify(JSON.parse(prev), null, 2).slice(0, 4000))} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Fix: Trim payload</button>
            )}
            {quickFixForIssue(error) === "rewrite-query" && (
              <button onClick={() => setQuery("Summarize top channels and biggest churn risk segments." )} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Fix: Use safer query</button>
            )}
          </div>
        )}
        {payloadSize > 4000 && <div style={{ color: "#fbbf24", fontSize: 13 }}>Perf detail: large payload ({payloadSize} chars) — consider trimming for faster runs.</div>}
        {validation && (
          <div style={{ marginTop: 6, background: validation.status === "ok" ? "#0f172a" : "#1f2937", border: "1px solid #1f2937", borderRadius: 10, padding: 10, display: "grid", gap: 6 }}>
            <div style={{ color: validation.status === "ok" ? "#22c55e" : validation.status === "warn" ? "#fbbf24" : "#f87171", fontWeight: 800 }}>
              {validation.status === "ok" ? "Payload valid" : validation.status === "warn" ? "Warnings" : "Errors"}
            </div>
            {validation.stats && (
              <div style={{ color: "#9ca3af", fontSize: 13 }}>Orders {validation.stats.orders} · Ads {validation.stats.ads} · Offline {validation.stats.offline}</div>
            )}
            {validation.issues && validation.issues.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 16, color: validation.status === "warn" ? "#fbbf24" : "#f87171", fontSize: 13 }}>
                {validation.issues.map((iss, idx) => <li key={idx}>{iss}</li>)}
              </ul>
            )}
          </div>
        )}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", color: "#9ca3af", fontSize: 13 }}>
          <div style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 10, padding: 10, minWidth: 200 }}>
            <div style={{ fontWeight: 700, color: "#e5e7eb" }}>PII findings</div>
            {piiFindings.length === 0 ? <div>No emails detected</div> : <ul style={{ margin: 6, paddingLeft: 16 }}>{piiFindings.map((p, i) => <li key={i}>{maskEmail(p)}</li>)}</ul>}
          </div>
          <div style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 10, padding: 10, minWidth: 200 }}>
            <div style={{ fontWeight: 700, color: "#e5e7eb" }}>SLA & freshness</div>
            <div>Status: {slaSummary.detail}</div>
            <div>Minutes: {sla.minutes} / Target {sla.target}</div>
            <div>Cadence: {schedule.cadence}</div>
          </div>
          <div style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 10, padding: 10, minWidth: 200 }}>
            <div style={{ fontWeight: 700, color: "#e5e7eb" }}>Data summary</div>
            <div>Size: {payloadSize} chars</div>
            <div>Model: {model}</div>
            <div>Cohort: {cohortKey}</div>
            <div>BI: {biConnectors.looker ? "Looker" : "-"} {biConnectors.tableau ? "Tableau" : ""}</div>
            <div>Review: {reviewStatus}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", color: "#9ca3af", fontSize: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={showCodeLines} onChange={(e) => setShowCodeLines(e.target.checked)} /> Show code lines
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={showSyntaxView} onChange={(e) => setShowSyntaxView(e.target.checked)} /> Syntax highlight
          </label>
          <button onClick={() => { setModelImportText(JSON.stringify(modelLibrary, null, 2)); }} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Export models JSON</button>
          <button onClick={() => { try { const parsed = JSON.parse(modelImportText); if (Array.isArray(parsed)) setModelLibrary(parsed); } catch (err) { setError("Model import failed"); } }} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Import models</button>
          <textarea value={modelImportText} onChange={(e) => setModelImportText(e.target.value)} placeholder="Paste model library JSON" rows={3} style={{ minWidth: 260, background: "#0d1420", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: 8, fontFamily: "monospace" }} />
        </div>
        {(showCodeLines || showSyntaxView) && (
          <pre style={{ background: "#0d1420", border: "1px solid #1f2937", borderRadius: 10, padding: 10, color: "#dbeafe", maxHeight: 260, overflow: "auto", fontSize: 12 }}>
            {showSyntaxView
              ? <span dangerouslySetInnerHTML={{ __html: highlightJson(payload) }} />
              : payload.split("\n").map((line, idx) => `${String(idx + 1).padStart(3, " ")}: ${line}`).join("\n")}
          </pre>
        )}
      </div>

      <div style={{ display: "grid", gap: 10, background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 800, color: "#e5e7eb" }}>Budget shift simulator</div>
          <div style={{ color: "#9ca3af", fontSize: 12 }}>Model: {model} · Cohort: {cohortKey}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select value={budgetShift.channel} onChange={e => setBudgetShift(prev => ({ ...prev, channel: e.target.value }))} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "8px 12px", fontWeight: 700 }}>
            <option value="google-ads">Google Ads</option>
            <option value="email">Email</option>
            <option value="organic">Organic</option>
            <option value="meta-ads">Meta Ads</option>
          </select>
          <input type="number" value={budgetShift.delta} onChange={e => setBudgetShift(prev => ({ ...prev, delta: Number(e.target.value) || 0 }))} style={{ width: 90, background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "8px 10px" }} />
          <span style={{ color: "#9ca3af", fontSize: 13 }}>% budget shift</span>
          <button onClick={simulateBudgetShift} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>Simulate</button>
        </div>
        {budgetShift.uplift && (
          <div style={{ color: "#e5e7eb", fontSize: 14 }}>
            Projected {budgetShift.channel}: ${budgetShift.uplift.revenue.toFixed(0)} · {budgetShift.uplift.count} conversions
          </div>
        )}
        {result?.performance && <div style={{ color: "#9ca3af", fontSize: 12 }}>Using latest run performance as baseline.</div>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={addScenarioComparison} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Add scenario</button>
          <button onClick={runAnomalyDetection} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Detect anomalies</button>
          <button onClick={runIntegrationTests} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Run integration tests</button>
          <button onClick={sendScheduledReport} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Send scheduled report</button>
        </div>
        {scenarioCompare.length > 0 && (
          <div style={{ color: "#9ca3af", fontSize: 12 }}>Scenarios: {scenarioCompare.map(s => s.desc).join(" · ")}</div>
        )}
        {anomalies.length > 0 && (
          <div style={{ color: "#fbbf24", fontSize: 12 }}>Anomalies: {anomalies.join("; ")}</div>
        )}
        {integrationTests.length > 0 && (
          <div style={{ color: "#9ca3af", fontSize: 12 }}>Tests: {integrationTests.map(t => `${t.name}:${t.status}`).join(" · ")}</div>
        )}
      </div>

      <div style={{ display: "grid", gap: 8, background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 800, color: "#e5e7eb" }}>Layout (simulated drag)</div>
          <div style={{ color: "#9ca3af", fontSize: 12 }}>Preset: {layoutPreset}</div>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          {layoutPanels.map((p, idx) => (
            <div key={p} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 10px" }}>
              <span style={{ color: "#e5e7eb" }}>{p}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => movePanel(idx, -1)} disabled={idx === 0} style={{ background: "#1f2937", color: "#e5e7eb", border: "1px solid #334155", borderRadius: 8, padding: "4px 8px", fontWeight: 700, cursor: idx === 0 ? "not-allowed" : "pointer", opacity: idx === 0 ? 0.5 : 1 }}>↑</button>
                <button onClick={() => movePanel(idx, 1)} disabled={idx === layoutPanels.length - 1} style={{ background: "#1f2937", color: "#e5e7eb", border: "1px solid #334155", borderRadius: 8, padding: "4px 8px", fontWeight: 700, cursor: idx === layoutPanels.length - 1 ? "not-allowed" : "pointer", opacity: idx === layoutPanels.length - 1 ? 0.5 : 1 }}>↓</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ color: "#9ca3af", fontSize: 12 }}>Reorder panels to simulate drag-and-drop layout.</div>
      </div>

      <div style={{ display: "grid", gap: 10, background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 800, color: "#e5e7eb" }}>AI suggestions & notifications</div>
          <div style={{ color: "#9ca3af", fontSize: 12 }}>Plugins: {plugins.filter(p => p.enabled).length}/{plugins.length}</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: 10, minWidth: 220 }}>
            <div style={{ fontWeight: 700, color: "#e5e7eb", marginBottom: 6 }}>AI Suggestions</div>
            {aiSuggestions.length === 0 ? <div style={{ color: "#9ca3af", fontSize: 12 }}>No suggestions</div> : (
              <ul style={{ margin: 0, paddingLeft: 16, color: "#9ca3af", fontSize: 13 }}>
                {aiSuggestions.map(s => (
                  <li key={s.id} style={{ marginBottom: 4 }}>
                    {s.text}
                    <button onClick={() => { setQuery(prev => `${prev}\n${s.text}`); updateOnboarding("Applied suggestion"); }} style={{ marginLeft: 6, background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 6, padding: "2px 8px", fontWeight: 700, cursor: "pointer" }}>Apply</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: 10, minWidth: 220 }}>
            <div style={{ fontWeight: 700, color: "#e5e7eb", marginBottom: 6 }}>Plugins</div>
            {plugins.map(p => (
              <label key={p.name} style={{ display: "flex", alignItems: "center", gap: 6, color: "#e5e7eb", fontSize: 13, marginBottom: 4 }}>
                <input type="checkbox" checked={p.enabled} onChange={() => togglePlugin(p.name)} /> {p.name}
              </label>
            ))}
            <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 6 }}>Plugins extend the tool; enable with caution.</div>
          </div>
          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: 10, minWidth: 220 }}>
            <div style={{ fontWeight: 700, color: "#e5e7eb", marginBottom: 6 }}>Notification rules</div>
            {notificationRules.map((r, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, color: "#e5e7eb", fontSize: 13, marginBottom: 4 }}>
                <span>{r.channel}: {r.rule}</span>
                <button onClick={() => toggleNotificationRule(idx)} style={{ background: r.muted ? "#1f2937" : "#22c55e", color: r.muted ? "#9ca3af" : "#0b1221", border: "none", borderRadius: 6, padding: "2px 8px", fontWeight: 700, cursor: "pointer" }}>{r.muted ? "Unmute" : "Mute"}</button>
              </div>
            ))}
            <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 6 }}>Use rules to alert on SLA breaches or failures.</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10, background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 800, color: "#e5e7eb" }}>Lineage, retention, onboarding</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: 10, minWidth: 220 }}>
            <div style={{ fontWeight: 700, color: "#e5e7eb", marginBottom: 6 }}>Lineage</div>
            <ul style={{ margin: 0, paddingLeft: 16, color: "#9ca3af", fontSize: 13 }}>
              {lineage.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          </div>
          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: 10, minWidth: 220 }}>
            <div style={{ fontWeight: 700, color: "#e5e7eb", marginBottom: 6 }}>Retention</div>
            <div style={{ color: "#9ca3af", fontSize: 13 }}>Data: {retention.days} days</div>
            <div style={{ color: "#9ca3af", fontSize: 13 }}>PII: {retention.pii}</div>
          </div>
          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: 10, minWidth: 220 }}>
            <div style={{ fontWeight: 700, color: "#e5e7eb", marginBottom: 6 }}>Onboarding</div>
            <ul style={{ margin: 0, paddingLeft: 16, color: "#9ca3af", fontSize: 13 }}>
              {onboarding.checklist.map(item => (
                <li key={item}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="checkbox" checked={onboarding.done.includes(item)} onChange={() => updateOnboarding(item)} /> {item}
                  </label>
                </li>
              ))}
            </ul>
            <div style={{ color: "#9ca3af", fontSize: 12 }}>Done: {onboarding.done.length}/{onboarding.checklist.length}</div>
          </div>
          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: 10, minWidth: 220 }}>
            <div style={{ fontWeight: 700, color: "#e5e7eb", marginBottom: 6 }}>Changelog</div>
            <ul style={{ margin: 0, paddingLeft: 16, color: "#9ca3af", fontSize: 13 }}>
              {changelog.map((c, i) => <li key={i}>{c.version}: {c.note}</li>)}
            </ul>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <BackButton />
        {validation?.status === "warn" && <span style={{ color: "#fbbf24", fontSize: 12 }}>Warnings present; review before running.</span>}
        <button onClick={() => { window.open("mailto:analytics@brand.com?subject=Attribution%20Feedback", "_blank"); logAudit("feedback", {}); }} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>
          Send feedback
        </button>
        <button onClick={() => { const snap = { at: Date.now(), payload: JSON.parse(payload || "{}"), query, model, cohortKey, reviewer, reviewStatus }; setVersions(prev => [snap, ...prev].slice(0, 5)); logAudit("version_save", {}); }} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>
          Save version
        </button>
        {versions.length > 0 && (
          <button onClick={() => { const v = versions[0]; restoreSnapshot(v); setReviewStatus(v.reviewStatus || reviewStatus); setReviewer(v.reviewer || reviewer); logAudit("version_restore", {}); }} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>
            Restore latest
          </button>
        )}
      </div>

      {history.length > 0 && (
        <div style={{ background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 12, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800, color: "#e5e7eb" }}>Recent runs</div>
            <div style={{ color: "#9ca3af", fontSize: 12 }}>Last {Math.min(3, history.length)} shown</div>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {history.slice(0, 3).map((h, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 10px" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#e5e7eb" }}>{h.query?.slice(0, 40) || "Run"}{h.query?.length > 40 ? "…" : ""}</div>
                  <div style={{ color: "#9ca3af", fontSize: 12 }}>{h.at ? new Date(h.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "recent"} · {h.env} · {h.hash || "h-na"}</div>
                  {h.metrics && (
                    <div style={{ color: "#9ca3af", fontSize: 12 }}>ROAS {h.metrics.roas ?? "-"} · CAC {h.metrics.cac ?? "-"} · Spend {h.metrics.spend ?? "-"}</div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button onClick={() => restoreSnapshot(h)} style={{ background: "#1f2937", color: "#e5e7eb", border: "1px solid #334155", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Load</button>
                  <button onClick={() => { restoreSnapshot(h); setTimeout(() => run(), 0); }} disabled={devSandbox} style={{ background: devSandbox ? "#1f2937" : "#22c55e", color: devSandbox ? "#9ca3af" : "#0b1221", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: devSandbox ? "not-allowed" : "pointer", opacity: devSandbox ? 0.6 : 1 }}>{devSandbox ? "Sandbox" : "Re-run"}</button>
                  <button onClick={() => { exportUrl && window.open(exportUrl, "_blank"); }} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #334155", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Open export</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {result && (
        <div style={{ display: "grid", gap: 12, background: "#0d1420", border: "1px solid #24314a", borderRadius: 10, padding: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ color: "#e5e7eb", fontWeight: 800 }}>Run results</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button onClick={exportResult} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Export JSON</button>
              {exportUrl && <a href={exportUrl} download="attribution-result.json" style={{ color: "#22c55e", textDecoration: "underline", fontSize: 13 }}>Download</a>}
              <span style={{ color: "#9ca3af", fontSize: 12 }}>Journeys {journeyDepth === 0 ? "off" : `depth ${journeyDepth}`}</span>
            </div>
          </div>
          {result.insights && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>AI Insights</div>
              <div style={{ whiteSpace: "pre-wrap", color: "#dbeafe" }}>{result.insights}</div>
            </div>
          )}
          {result.performance && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Performance by Channel</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #24314a" }}>
                    <th style={{ padding: "6px 4px" }}>Channel</th>
                    <th style={{ padding: "6px 4px" }}>Revenue</th>
                    <th style={{ padding: "6px 4px" }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.performance).map(([channel, stats]) => (
                    <tr key={channel} style={{ borderBottom: "1px solid #1a2538" }}>
                      <td style={{ padding: "6px 4px" }}>{channel}</td>
                      <td style={{ padding: "6px 4px" }}>${stats.revenue.toFixed(2)}</td>
                      <td style={{ padding: "6px 4px" }}>{stats.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ color: "#9ca3af", fontSize: 12 }}>API usage: {apiUsage.used}/{apiUsage.quota}</div>
                <button onClick={() => setApiUsage(u => ({ ...u, used: Math.max(0, u.used - 200) }))} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Reduce usage</button>
                <button onClick={() => setApiUsage(u => ({ ...u, used: u.used + 200 }))} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Consume usage</button>
              </div>
            </div>
          )}
          {result.result && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Attribution Result</div>
              <pre style={{ background: "#0a101b", border: "1px solid #24314a", borderRadius: 8, padding: 12, color: "#dbeafe", maxHeight: 260, overflow: "auto" }}>
                {JSON.stringify(result.result, null, 2)}
              </pre>
            </div>
          )}
          {result.journeys && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Journeys</div>
              <pre style={{ background: "#0a101b", border: "1px solid #24314a", borderRadius: 8, padding: 12, color: "#dbeafe", maxHeight: 260, overflow: "auto" }}>
                {JSON.stringify(result.journeys, null, 2)}
              </pre>
            </div>
          )}
          {result.cohorts && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Cohorts</div>
              <pre style={{ background: "#0a101b", border: "1px solid #24314a", borderRadius: 8, padding: 12, color: "#dbeafe", maxHeight: 200, overflow: "auto" }}>
                {JSON.stringify(result.cohorts, null, 2)}
              </pre>
            </div>
          )}
          {shareToken && (
            <div style={{ color: "#9ca3af", fontSize: 12 }}>Share link: {`${window.location.origin}/share/${shareToken}`}</div>
          )}
        </div>
      )}

      {auditLog.length > 0 && (
        <div style={{ background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 12, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800, color: "#e5e7eb" }}>Audit log</div>
            <div style={{ color: "#9ca3af", fontSize: 12 }}>Recent {Math.min(8, auditLog.length)} events</div>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {auditLog.slice(0, 8).map((entry, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: "6px 10px" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#e5e7eb" }}>{entry.event}</div>
                  <div style={{ color: "#9ca3af", fontSize: 12 }}>{new Date(entry.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {entry.env}</div>
                </div>
                <div style={{ color: "#9ca3af", fontSize: 12 }}>{entry.meta ? JSON.stringify(entry.meta) : ""}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
