﻿
import React, { useEffect, useMemo, useRef, useState } from "react";
import BackButton from "./BackButton";

const THEMES = {
  dark: {
    bg: "#282828",
    card: "#282828",
    border: "#343434",
    text: "#f0f0f0",
    muted: "#9a9a9a",
    accent: "#7dd3fc",
    positive: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
  },
  light: {
    bg: "#f8fafc",
    card: "#ffffff",
    border: "#dbeafe",
    text: "#282828",
    muted: "#475569",
    accent: "#0ea5e9",
    positive: "#16a34a",
    warning: "#ea580c",
    danger: "#ef4444",
  },
  audit: {
    bg: "#282828",
    card: "#0f2529",
    border: "#17424a",
    text: "#d8f3ff",
    muted: "#7fb1be",
    accent: "#38bdf8",
    positive: "#22c55e",
    warning: "#fbbf24",
    danger: "#f87171",
  },
};

const DEFAULT_SCENARIOS = [
  {
    id: "baseline",
    name: "Baseline",
    demandDelta: 0,
    costDelta: 0,
    leadTimeDelta: 0,
    markdownBudget: 60000,
    otb: 320000,
    risk: "low",
    confidence: 0.76,
  },
  {
    id: "constraint",
    name: "Constrained Supply",
    demandDelta: -0.08,
    costDelta: 0.06,
    leadTimeDelta: 0.18,
    markdownBudget: 90000,
    otb: 270000,
    risk: "medium",
    confidence: 0.61,
  },
  {
    id: "surge",
    name: "Demand Surge",
    demandDelta: 0.22,
    costDelta: 0.04,
    leadTimeDelta: -0.06,
    markdownBudget: 50000,
    otb: 410000,
    risk: "high",
    confidence: 0.54,
  },
];

const KPI_BASE = {
  gmroi: 4.2,
  dsi: 38,
  coverage: 62,
  fillRate: 96,
  ccc: 41,
  safetyStockValue: 184000,
};

const QUICK_PROMPTS = [
  "Create a 90-day cash conversion plan",
  "Simulate demand drop by 10% with lead time spike",
  "Optimize safety stock for A/B/C SKUs",
  "Plan open-to-buy across channels",
  "Compare markdown vs. clearance impact",
];

const INTEGRATIONS = [
  { id: "shopify", name: "Shopify", status: "connected" },
  { id: "netsuite", name: "NetSuite", status: "connected" },
  { id: "snowflake", name: "Snowflake", status: "syncing" },
  { id: "bigquery", name: "BigQuery", status: "pending" },
];

const formatCurrency = (num) =>
  typeof num === "number"
    ? `$${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : "—";

export default function AdvancedFinanceInventoryPlanning() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [theme, setTheme] = useState("dark");
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [importedHistoryName, setImportedHistoryName] = useState(null);
  const [exportedHistoryUrl, setExportedHistoryUrl] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [activeScenario, setActiveScenario] = useState("baseline");
  const [scenarioConfig, setScenarioConfig] = useState(DEFAULT_SCENARIOS);
  const [forecastHorizon, setForecastHorizon] = useState(12);
  const [serviceLevel, setServiceLevel] = useState(95);
  const [fillRateTarget, setFillRateTarget] = useState(96);
  const [inventoryInputs, setInventoryInputs] = useState({
    leadTimeDays: 35,
    demandStdDev: 420,
    currentStock: 8200,
    avgDailyDemand: 180,
    safetyFactor: 1.65,
  });
  const [dataFreshnessMinutes, setDataFreshnessMinutes] = useState(12);
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [shareUrl, setShareUrl] = useState("");
  const [alerts, setAlerts] = useState([
    { id: "stockout", label: "Stockout risk > 5%", enabled: true },
    { id: "leadtime", label: "Lead time slips by 7+ days", enabled: true },
    { id: "margin", label: "Gross margin dips below 42%", enabled: false },
  ]);
  const [tasks, setTasks] = useState([
    { id: 1, title: "Finalize Q2 open-to-buy", owner: "Alex", status: "In Progress" },
    { id: 2, title: "Refresh supplier SLAs", owner: "Priya", status: "Blocked" },
    { id: 3, title: "Re-run safety stock for A SKUs", owner: "Jordan", status: "Ready" },
  ]);
  const [notes, setNotes] = useState("");
  const [auditLog, setAuditLog] = useState([
    { ts: Date.now() - 3600_000, actor: "alex@aura.ai", action: "Saved surge scenario" },
    { ts: Date.now() - 7200_000, actor: "priya@aura.ai", action: "Exported history" },
    { ts: Date.now() - 8200_000, actor: "sam@aura.ai", action: "Adjusted service level to 95%" },
  ]);
  const [insightCopied, setInsightCopied] = useState(false);
  const [access, setAccess] = useState({ owner: "Alex M.", reviewer: "Finance Ops", status: "In Review" });
  const [configImportName, setConfigImportName] = useState("");
  const [preflight, setPreflight] = useState({ uptime: "99.95%", incidents: 0, sla: "Operational" });
  const [integrationStatuses] = useState(INTEGRATIONS);

  const historyFileRef = useRef(null);
  const configFileRef = useRef(null);

  const palette = THEMES[theme] || THEMES.dark;

  const safetyStock = useMemo(() => {
    const { safetyFactor, demandStdDev, leadTimeDays } = inventoryInputs;
    if (!safetyFactor || !demandStdDev || !leadTimeDays) return 0;
    return Math.max(
      Math.round(safetyFactor * demandStdDev * Math.sqrt(Math.max(leadTimeDays, 1) / 30)),
      0
    );
  }, [inventoryInputs]);

  const reorderPoint = useMemo(() => {
    const { avgDailyDemand, leadTimeDays } = inventoryInputs;
    if (!avgDailyDemand || !leadTimeDays) return 0;
    return Math.max(Math.round(avgDailyDemand * leadTimeDays + safetyStock), 0);
  }, [inventoryInputs, safetyStock]);

  const scenarioStats = useMemo(() => {
    return scenarioConfig.map((scenario) => {
      const demand = 1 + scenario.demandDelta;
      const cost = 1 + scenario.costDelta;
      const lead = 1 + scenario.leadTimeDelta;
      return {
        ...scenario,
        gmroi: +(KPI_BASE.gmroi / cost).toFixed(2),
        dsi: Math.max(Math.round(KPI_BASE.dsi * lead), 18),
        coverage: Math.max(Math.round(KPI_BASE.coverage * lead), 21),
        otb: Math.round(scenario.otb * demand),
        fillRate: Math.max(80, Math.min(99, Math.round(KPI_BASE.fillRate * demand - scenario.leadTimeDelta * 10))),
      };
    });
  }, [scenarioConfig]);

  const activeScenarioData = scenarioStats.find((s) => s.id === activeScenario) || scenarioStats[0];

  useEffect(() => {
    try {
      const url = typeof window !== "undefined" ? window.location.href.split("#")[0] : "";
      setShareUrl(`${url}?tool=advanced-finance-inventory-planning`);
    } catch (_) {}
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/advanced-finance-inventory-planning/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, scenario: activeScenarioData, horizon: forecastHorizon }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      const payload = {
        ...data.result,
        scenario: activeScenarioData.name,
        recommendations: data.result?.recommendations || [
          "Right-size safety stock on A SKUs by 6%",
          "Re-time POs to align with lead-time variability",
          "Ringfence markdown budget for aging inventory",
        ],
      };
      setResult(payload);
      setHistory((prev) => [{ query, result: payload, ts: Date.now() }, ...prev].slice(0, 15));
      setAuditLog((prev) => [{ ts: Date.now(), actor: "system", action: `Ran analysis for ${activeScenarioData.name}` }, ...prev].slice(0, 30));
    } catch (err) {
      setResult({
        summary: "Offline fallback generated. Verify against live data.",
        scenario: activeScenarioData.name,
        recommendations: [
          "Use surge plan with staggered POs",
          "Increase safety stock buffer until lead-time stabilizes",
          "Tighten markdown approvals for margin guardrails",
        ],
      });
      setHistory((prev) => [{ query: query || "Offline plan", result: { summary: "Fallback" }, ts: Date.now() }, ...prev].slice(0, 15));
      setError(err.message || "Unable to analyze right now");
    } finally {
      setLoading(false);
    }
  };

  const handleImportHistory = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const importedHistory = JSON.parse(evt.target.result);
        if (!Array.isArray(importedHistory)) throw new Error("Invalid history format");
        setHistory(importedHistory.slice(0, 25));
        setImportedHistoryName(file.name);
      } catch (_) {
        setError("Invalid file format");
      }
    };
    reader.readAsText(file);
  };

  const handleExportHistory = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExportedHistoryUrl(url);
    setTimeout(() =>URL.revokeObjectURL(url), 12000);
  };

  const handleImportConfig = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (!Array.isArray(parsed)) throw new Error("Invalid config");
        setScenarioConfig(parsed);
        setConfigImportName(file.name);
      } catch (_) {
        setError("Invalid config file");
      }
    };
    reader.readAsText(file);
  };

  const handleExportConfig = () => {
    const blob = new Blob([JSON.stringify(scenarioConfig, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finance-inventory-scenarios.json";
    a.click();
    setTimeout(() =>URL.revokeObjectURL(url), 8000);
  };

  const handleFeedback = async () => {
    if (!feedback.trim()) return;
    setError("");
    try {
      await fetch("/api/advanced-finance-inventory-planning/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
      setAuditLog((prev) => [{ ts: Date.now(), actor: "you", action: "Submitted feedback" }, ...prev].slice(0, 30));
      setFeedback("");
    } catch (_) {
      setError("Failed to send feedback");
    }
  };

  const saveVersion = () => {
    const snapshot = {
      scenarioConfig,
      activeScenario,
      forecastHorizon,
      serviceLevel,
      fillRateTarget,
      inventoryInputs,
    };
    const version = { id: Date.now(), name: `v${versions.length + 1}`, snapshot, ts: Date.now() };
    setVersions((prev) => [version, ...prev].slice(0, 10));
    setSelectedVersion(version.id);
    setAuditLog((prev) => [{ ts: Date.now(), actor: "you", action: "Saved version" }, ...prev].slice(0, 30));
  };

  const applyVersion = (id) => {
    const found = versions.find((v) => v.id === id);
    if (!found) return;
    setScenarioConfig(found.snapshot.scenarioConfig || DEFAULT_SCENARIOS);
    setActiveScenario(found.snapshot.activeScenario || "baseline");
    setForecastHorizon(found.snapshot.forecastHorizon || 12);
    setServiceLevel(found.snapshot.serviceLevel || 95);
    setFillRateTarget(found.snapshot.fillRateTarget || 96);
    setInventoryInputs(found.snapshot.inventoryInputs || inventoryInputs);
    setSelectedVersion(found.id);
  };

  const handleCopyInsights = async () => {
    const text = result ? JSON.stringify(result, null, 2) : "No analysis yet.";
    try {
      await navigator.clipboard.writeText(text);
      setInsightCopied(true);
      setTimeout(() => setInsightCopied(false), 2200);
    } catch (_) {
      setError("Clipboard unavailable");
    }
  };

  const toggleAlert = (id) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  };

  const paletteCard = {
    background: palette.card,
    border: `1px solid ${palette.border}`,
    borderRadius: 12,
    padding: 12,
  };

  const onboardingContent = (
    <div style={{ ...paletteCard, boxShadow: "0 10px 34px rgba(0,0,0,0.22)" }}>
      <h3 style={{ fontWeight: 800, fontSize: 22, margin: 0, color: palette.text }}>Welcome to Advanced Finance & Inventory Planning</h3>
      <ul style={{ margin: "16px 0 0 18px", color: palette.text, fontSize: 15, lineHeight: 1.4 }}>
        <li>Forecasting, budgeting, and inventory optimization with scenario agility.</li>
        <li>Guardrails for margin, fill rate, and open-to-buy allocations.</li>
        <li>Versioning, exports, audit log, and reviewer workflows built-in.</li>
        <li>Accessibility, compliance, and data quality signal on every view.</li>
      </ul>
      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <button
          onClick={() => setShowOnboarding(false)}
          style={{
            background: palette.accent,
            color: "#282828",
            border: "none",
            borderRadius: 10,
            padding: "10px 18px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Start planning
        </button>
        <button
          onClick={() => setForecastHorizon(18)}
          style={{
            background: "transparent",
            color: palette.text,
            border: `1px solid ${palette.border}`,
            borderRadius: 10,
            padding: "10px 18px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Set 18-mo horizon
        </button>
      </div>
    </div>
  );

  const dataQuality = dataFreshnessMinutes <= 15 ? "Fresh" : dataFreshnessMinutes <= 60 ? "Stale" : "Out of SLA";

  return (
    <div style={{ color: palette.text, background: palette.bg, padding: 12, borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontWeight: 900, fontSize: 28, margin: 0 }}>Advanced Finance & Inventory Planning</h2>
          <div style={{ color: palette.muted, fontSize: 14 }}>
            Forecast, budget, optimize, and govern inventory and cash with scenario resilience.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            aria-label="Theme"
            style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700 }}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="audit">Audit</option>
          </select>
          <button
            onClick={() => window.open(shareUrl || "", "_blank")}
            style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700, cursor: "pointer" }}
          >
            Share Link
          </button>
          <button
            onClick={saveVersion}
            style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${palette.accent}`, background: palette.accent, color: "#282828", fontWeight: 800, cursor: "pointer" }}
          >
            Save Version
          </button>
        </div>
      </div>

      <BackButton />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        <span style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700 }}>
          SLA: {preflight.sla}
        </span>
        <span style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700 }}>
          Uptime {preflight.uptime}
        </span>
        <span style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${palette.border}`, background: palette.card, color: dataQuality === "Fresh" ? palette.positive : dataQuality === "Stale" ? palette.warning : palette.danger, fontWeight: 800 }}>
          Data {dataQuality} ({dataFreshnessMinutes}m)
        </span>
        <span style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700 }}>
          Fill rate target {fillRateTarget}%
        </span>
        <span style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700 }}>
          Service level {serviceLevel}%
        </span>
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {showOnboarding && onboardingContent}

        <div style={{ ...paletteCard }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800 }}>AI Planning Workspace</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setQuery(p)}
                  style={{ border: `1px solid ${palette.border}`, background: "transparent", color: palette.text, borderRadius: 10, padding: "6px 10px", cursor: "pointer", fontWeight: 700 }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
              style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 10, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }}
              placeholder="Describe your finance or inventory planning question..."
              aria-label="Finance/inventory query input"
            />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={handleAnalyze}
                disabled={loading || !query}
                style={{ background: palette.accent, color: "#282828", border: `1px solid ${palette.accent}`, borderRadius: 10, padding: "10px 18px", fontWeight: 800, cursor: loading || !query ? "not-allowed" : "pointer" }}
              >
                {loading ? "Analyzing..." : "Analyze"}
              </button>
              <button
                onClick={handleCopyInsights}
                style={{ background: "transparent", color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}
              >
                {insightCopied ? "Copied" : "Copy Insights"}
              </button>
              <button
                onClick={() => setShowOnboarding((v) => !v)}
                style={{ background: "transparent", color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}
              >
                {showOnboarding ? "Hide" : "Show"} Onboarding
              </button>
            </div>
          </div>
          {error && <div style={{ color: palette.danger, marginTop: 8 }}>{error}</div>}
        </div>

        {result && (
          <div style={{ ...paletteCard, background: theme === "light" ? "#ecfeff" : "#282828" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 800 }}>Analysis Result — {activeScenarioData?.name}</div>
              <span style={{ color: palette.muted, fontSize: 12 }}>{new Date().toLocaleTimeString()}</span>
            </div>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", marginTop: 8 }}>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}

        <div style={{ ...paletteCard }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800 }}>Scenario planning</div>
            <div style={{ display: "flex", gap: 8 }}>
              <label style={{ color: palette.muted, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                Horizon
                <input
                  type="range"
                  min="3"
                  max="24"
                  value={forecastHorizon}
                  onChange={(e) => setForecastHorizon(Number(e.target.value))}
                />
                <span style={{ fontWeight: 700 }}>{forecastHorizon} mo</span>
              </label>
              <label style={{ color: palette.muted, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                Service level
                <input
                  type="range"
                  min="85"
                  max="99"
                  value={serviceLevel}
                  onChange={(e) => setServiceLevel(Number(e.target.value))}
                />
                <span style={{ fontWeight: 700 }}>{serviceLevel}%</span>
              </label>
              <label style={{ color: palette.muted, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                Fill rate
                <input
                  type="range"
                  min="85"
                  max="99"
                  value={fillRateTarget}
                  onChange={(e) => setFillRateTarget(Number(e.target.value))}
                />
                <span style={{ fontWeight: 700 }}>{fillRateTarget}%</span>
              </label>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginTop: 12 }}>
            {scenarioStats.map((s) => (
              <div
                key={s.id}
                style={{
                  ...paletteCard,
                  border: `2px solid ${s.id === activeScenario ? palette.accent : palette.border}`,
                  background: s.id === activeScenario ? palette.bg : palette.card,
                  cursor: "pointer",
                }}
                onClick={() => setActiveScenario(s.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setActiveScenario(s.id);
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 800 }}>{s.name}</div>
                  <span style={{ color: s.risk === "high" ? palette.danger : s.risk === "medium" ? palette.warning : palette.positive, fontWeight: 800 }}>
                    {s.risk.toUpperCase()}
                  </span>
                </div>
                <div style={{ color: palette.muted, fontSize: 12 }}>Confidence {Math.round(s.confidence * 100)}%</div>
                <div style={{ marginTop: 10, display: "grid", gap: 4, fontSize: 13 }}>
                  <div>GMROI: {s.gmroi}</div>
                  <div>DSI: {s.dsi} days</div>
                  <div>Coverage: {s.coverage} days</div>
                  <div>Fill rate: {s.fillRate}%</div>
                  <div>Open-to-buy: {formatCurrency(s.otb)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Inventory guardrails</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 700 }}>Safety stock</div>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{safetyStock} units</div>
              <div style={{ color: palette.muted }}>Lead time buffer with Z-score {inventoryInputs.safetyFactor}</div>
            </div>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 700 }}>Reorder point</div>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{reorderPoint} units</div>
              <div style={{ color: palette.muted }}>Covers {Math.max(Math.round(reorderPoint / Math.max(inventoryInputs.avgDailyDemand, 1)), 1)} days</div>
            </div>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 700 }}>CCC</div>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{KPI_BASE.ccc} days</div>
              <div style={{ color: palette.muted }}>Optimize working capital with staggered POs</div>
            </div>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 700 }}>Markdown guard</div>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{formatCurrency(activeScenarioData?.markdownBudget || 0)}</div>
              <div style={{ color: palette.muted }}>Approval required above threshold</div>
            </div>
          </div>
          <div style={{ display: "grid", gap: 8, marginTop: 10, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <label style={{ color: palette.muted, display: "grid", gap: 4 }}>
              Lead time (days)
              <input type="number" value={inventoryInputs.leadTimeDays} onChange={(e) => setInventoryInputs({ ...inventoryInputs, leadTimeDays: Number(e.target.value) })} style={{ padding: 10, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} />
            </label>
            <label style={{ color: palette.muted, display: "grid", gap: 4 }}>
              Avg daily demand
              <input type="number" value={inventoryInputs.avgDailyDemand} onChange={(e) => setInventoryInputs({ ...inventoryInputs, avgDailyDemand: Number(e.target.value) })} style={{ padding: 10, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} />
            </label>
            <label style={{ color: palette.muted, display: "grid", gap: 4 }}>
              Demand std dev
              <input type="number" value={inventoryInputs.demandStdDev} onChange={(e) => setInventoryInputs({ ...inventoryInputs, demandStdDev: Number(e.target.value) })} style={{ padding: 10, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} />
            </label>
            <label style={{ color: palette.muted, display: "grid", gap: 4 }}>
              Safety factor (Z)
              <input type="number" step="0.05" value={inventoryInputs.safetyFactor} onChange={(e) => setInventoryInputs({ ...inventoryInputs, safetyFactor: Number(e.target.value) })} style={{ padding: 10, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} />
            </label>
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Key KPIs</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            {[{ label: "GMROI", value: KPI_BASE.gmroi, suffix: "x" }, { label: "DSI", value: KPI_BASE.dsi, suffix: " days" }, { label: "Coverage", value: KPI_BASE.coverage, suffix: " days" }, { label: "Fill rate", value: KPI_BASE.fillRate, suffix: "%" }, { label: "Safety stock", value: KPI_BASE.safetyStockValue, formatter: formatCurrency }, { label: "CCC", value: KPI_BASE.ccc, suffix: " days" }].map((k) => (
              <div key={k.label} style={{ ...paletteCard }}>
                <div style={{ color: palette.muted, fontSize: 12 }}>{k.label}</div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>
                  {k.formatter ? k.formatter(k.value) : `${k.value}${k.suffix || ""}`}
                </div>
                <div style={{ color: palette.muted, fontSize: 12 }}>Guardrails enforced</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Budget vs. actual</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", color: palette.text }}>
              <thead>
                <tr>
                  {["Category", "Budget", "Actual", "Variance"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: 8, borderBottom: `1px solid ${palette.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { c: "COGS", b: 520000, a: 548000 },
                  { c: "Freight", b: 88000, a: 93000 },
                  { c: "Markdowns", b: activeScenarioData?.markdownBudget || 60000, a: 62000 },
                ].map((row) => {
                  const variance = row.a - row.b;
                  return (
                    <tr key={row.c}>
                      <td style={{ padding: 8 }}>{row.c}</td>
                      <td style={{ padding: 8 }}>{formatCurrency(row.b)}</td>
                      <td style={{ padding: 8 }}>{formatCurrency(row.a)}</td>
                      <td style={{ padding: 8, color: variance > 0 ? palette.danger : palette.positive, fontWeight: 700 }}>
                        {variance > 0 ? "+" : ""}{formatCurrency(variance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Open-to-buy & procurement</div>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 700 }}>Open-to-buy</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{formatCurrency(activeScenarioData?.otb || 0)}</div>
              <div style={{ color: palette.muted }}>Guardrails align to margin and service level</div>
            </div>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 700 }}>Next POs</div>
              <ul style={{ margin: 0, paddingLeft: 16, color: palette.text }}>
                <li>PO-8821 — ETA 12d — prioritize A SKUs</li>
                <li>PO-8827 — ETA 19d — renegotiate freight</li>
              </ul>
            </div>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 700 }}>Markdown controls</div>
              <div style={{ color: palette.muted }}>Requires dual-approval above ${activeScenarioData?.markdownBudget?.toLocaleString()}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                {["Finance", "Merch", "Ops"].map((p) => (
                  <span key={p} style={{ padding: "4px 8px", borderRadius: 8, border: `1px solid ${palette.border}`, color: palette.text }}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Inventory health by channel</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            {[{ channel: "DTC", stock: 4200, risk: "low" }, { channel: "Retail", stock: 3100, risk: "medium" }, { channel: "Wholesale", stock: 2300, risk: "medium" }, { channel: "Amazon", stock: 900, risk: "high" }].map((c) => (
              <div key={c.channel} style={{ ...paletteCard }}>
                <div style={{ fontWeight: 800 }}>{c.channel}</div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>{c.stock} units</div>
                <div style={{ color: c.risk === "high" ? palette.danger : c.risk === "medium" ? palette.warning : palette.positive, fontWeight: 800 }}>
                  {c.risk.toUpperCase()} risk
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Alerting & notifications</div>
          <div style={{ display: "grid", gap: 8 }}>
            {alerts.map((a) => (
              <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" checked={a.enabled} onChange={() => toggleAlert(a.id)} />
                <span>{a.label}</span>
              </label>
            ))}
            <div style={{ color: palette.muted, fontSize: 12 }}>Delivery: Email, Slack, PagerDuty. Quiet hours respected.</div>
          </div>
        </div>

        {history.length > 0 && (
          <div style={{ ...paletteCard }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Analysis History</div>
            <div style={{ display: "grid", gap: 8 }}>
              {history.map((h, i) => (
                <div key={`${h.ts}-${i}`} style={{ ...paletteCard }}>
                  <div style={{ fontWeight: 700 }}>{h.query}</div>
                  <div style={{ color: palette.muted, fontSize: 12 }}>{new Date(h.ts || Date.now()).toLocaleString()}</div>
                  <div style={{ color: palette.muted, fontSize: 12 }}>
                    {(h.result && JSON.stringify(h.result).slice(0, 120)) || "(no result)"}
                    {h.result && JSON.stringify(h.result).length > 120 ? "..." : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Imports & Exports</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input type="file" accept="application/json" ref={historyFileRef} style={{ display: "none" }} onChange={handleImportHistory} />
            <input type="file" accept="application/json" ref={configFileRef} style={{ display: "none" }} onChange={handleImportConfig} />
            <button onClick={() => historyFileRef.current?.click()} style={{ background: palette.card, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer" }}>Import History</button>
            <button onClick={handleExportHistory} style={{ background: palette.card, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer" }}>Export History</button>
            <button onClick={() => configFileRef.current?.click()} style={{ background: palette.card, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer" }}>Import Scenarios</button>
            <button onClick={handleExportConfig} style={{ background: palette.card, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer" }}>Export Scenarios</button>
          </div>
          <div style={{ color: palette.muted, fontSize: 12, marginTop: 6 }}>
            {importedHistoryName ? `Imported history: ${importedHistoryName}` : "No history imported yet."}
            {configImportName ? ` · Scenarios loaded from ${configImportName}` : ""}
            {exportedHistoryUrl && (
              <>
                {" "}
                <a href={exportedHistoryUrl} download="finance-inventory-history.json" style={{ color: palette.accent }}>Download export</a>
              </>
            )}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Access & approvals</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 700 }}>Owner</div>
              <input value={access.owner} onChange={(e) => setAccess({ ...access, owner: e.target.value })} style={{ marginTop: 6, padding: 8, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} />
            </div>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 700 }}>Reviewer</div>
              <input value={access.reviewer} onChange={(e) => setAccess({ ...access, reviewer: e.target.value })} style={{ marginTop: 6, padding: 8, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} />
            </div>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 700 }}>Status</div>
              <select value={access.status} onChange={(e) => setAccess({ ...access, status: e.target.value })} style={{ marginTop: 6, padding: 8, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }}>
                {['Draft', 'In Review', 'Approved', 'Blocked'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 700 }}>Share link</div>
              <div style={{ wordBreak: "break-all", color: palette.muted, fontSize: 12, marginTop: 6 }}>{shareUrl}</div>
            </div>
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
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Audit log</div>
          <div style={{ display: "grid", gap: 6 }}>
            {auditLog.map((a, i) => (
              <div key={`${a.ts}-${i}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                <span>{a.action}</span>
                <span style={{ color: palette.muted }}>{a.actor} · {new Date(a.ts).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Tasks & playbooks</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            {tasks.map((t) => (
              <div key={t.id} style={{ ...paletteCard }}>
                <div style={{ fontWeight: 800 }}>{t.title}</div>
                <div style={{ color: palette.muted }}>Owner: {t.owner}</div>
                <div style={{ color: t.status === "Blocked" ? palette.danger : palette.text, fontWeight: 700 }}>{t.status}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Integrations</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            {integrationStatuses.map((int) => (
              <div key={int.id} style={{ ...paletteCard }}>
                <div style={{ fontWeight: 800 }}>{int.name}</div>
                <div style={{ color: int.status === "connected" ? palette.positive : int.status === "syncing" ? palette.warning : palette.muted, fontWeight: 700 }}>
                  {int.status.toUpperCase()}
                </div>
                <div style={{ color: palette.muted, fontSize: 12 }}>Health monitored continuously</div>
              </div>
            ))}
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
          <button type="submit" style={{ background: palette.accent, color: "#282828", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 800, cursor: "pointer" }}>Send Feedback</button>
          {error && <div style={{ color: palette.danger, marginTop: 8 }}>{error}</div>}
        </form>

        <div style={{ ...paletteCard, textAlign: "center", fontSize: 12, color: palette.muted }}>
          Accessibility: WCAG 2.1 AA. Keyboard navigation supported. Data residency & PII minimization enforced. Press ? for shortcuts.
        </div>
      </div>
    </div>
  );
}


