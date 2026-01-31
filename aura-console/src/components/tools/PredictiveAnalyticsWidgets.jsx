import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../../api";

const CACHE_KEY = "paw:last-run";
const TELEMETRY_KEY = "paw:telemetry";
const SHARE_KEY = "paw:share-token";
const SAVED_SCENARIOS_KEY = "paw:saved-scenarios";
const METRIC_PRESETS = ["churn", "ltv", "demand", "revenue"];
const ROUTING_SEVERITIES = ["high", "medium", "low"];
const DEFAULT_ROUTING = {
  high: { email: [], slack: [], webhook: [] },
  medium: { email: [], slack: [], webhook: [] },
  low: { email: [], slack: [], webhook: [] },
};

const GLOSSARY = {
  churn: "% of customers who stop buying over a period.",
  ltv: "Lifetime value: projected net revenue per customer.",
  demand: "Forecasted orders/units expected in the selected window.",
  revenue: "Gross revenue forecast across the selected window.",
};

const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/i;

const parseEmails = (value = "") => {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .split(/[,;\n]+/)
        .map((e) => e.trim())
        .filter(Boolean)
    )
  );
};

const normalizeMetrics = (chips = [], custom = "") => {
  const customList = custom
    ? custom
        .split(/[,;\n]+/)
        .map((m) => m.trim().toLowerCase())
        .filter(Boolean)
    : [];
  return Array.from(new Set([...chips, ...customList]));
};

const recordTelemetry = (event, payload = {}) => {
  try {
    const existing = JSON.parse(localStorage.getItem(TELEMETRY_KEY) || "[]");
    const next = [...existing, { event, at: new Date().toISOString(), payload }].slice(-25);
    localStorage.setItem(TELEMETRY_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn("Telemetry store failed", err);
  }
};

const Sparkline = ({ series, metric, reduceMotion }) => {
  const width = 160;
  const height = 60;
  if (!series || series.length === 0) return null;
  const values = series.map((p) => Number(p.predicted));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / Math.max(series.length - 1, 1);
  const points = series.map((p, idx) => {
    const x = idx * stepX;
    const y = height - ((p.predicted - min) / range) * height;
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} aria-label={`${metric} forecast sparkline`} className={reduceMotion ? "paw-reduced-motion" : ""}>
      <polyline
        fill="none"
        stroke="#22d3ee"
        strokeWidth="3"
        points={points.join(" ")}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

const SkeletonCard = () => (
  <div className="paw-card paw-skeleton">
    <div className="paw-skeleton-bar" style={{ width: "40%" }} />
    <div className="paw-skeleton-bar" style={{ width: "70%", height: 26 }} />
    <div className="paw-skeleton-bar" style={{ width: "55%" }} />
    <div className="paw-skeleton-bar" style={{ width: "85%" }} />
  </div>
);

export default function PredictiveAnalyticsWidgets() {
  const [form, setForm] = useState({
    frequency: "weekly",
    alertEmails: "",
    alertThreshold: 10,
    customMetrics: "",
  });
  const [metricChips, setMetricChips] = useState(["churn", "ltv", "demand"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [inlineError, setInlineError] = useState(null);
  const [testAlert, setTestAlert] = useState(null);
  const [routing, setRouting] = useState(DEFAULT_ROUTING);
  const [timeframe, setTimeframe] = useState("14d");
  const [granularity, setGranularity] = useState("daily");
  const [scenario, setScenario] = useState({ demandDelta: 0, budgetDelta: 0 });
  const [cohort, setCohort] = useState("all");
  const [benchmarkPeerSet, setBenchmarkPeerSet] = useState("dtc_midmarket");
  const [snapshotToken, setSnapshotToken] = useState("");
  const [health, setHealth] = useState({ lastLatency: null, successes: 0, failures: 0 });
  const [compact, setCompact] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [errorSummary, setErrorSummary] = useState("");
  const [telemetryEvents, setTelemetryEvents] = useState([]);
  const [runHistory, setRunHistory] = useState([]);
  const [runStats, setRunStats] = useState({ avg: 0, peak: 0, count: 0 });
  const [anomalySeverity, setAnomalySeverity] = useState("all");
  const [cloudTelemetryCount, setCloudTelemetryCount] = useState(0);
  const [cloudTelemetryTotal, setCloudTelemetryTotal] = useState(0);
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [scenarioSaveName, setScenarioSaveName] = useState("");
  const [scenarioSaveTag, setScenarioSaveTag] = useState("");
  const alertEmailRef = useRef(null);
  const formRef = useRef(null);

  // Load cached run for offline-friendly UX
  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (cached?.data) {
        setData(cached.data);
        setLastUpdated(cached.at || null);
        if (cached.form) {
          setForm((prev) => ({ ...prev, ...cached.form }));
          if (Array.isArray(cached.metricChips)) setMetricChips(cached.metricChips);
          if (cached.routing) setRouting(cached.routing);
          if (cached.timeframe) setTimeframe(cached.timeframe);
          if (cached.granularity) setGranularity(cached.granularity);
          if (cached.scenario) setScenario(cached.scenario);
          if (cached.cohort) setCohort(cached.cohort);
          if (cached.benchmarkPeerSet) setBenchmarkPeerSet(cached.benchmarkPeerSet);
        }
      }
    } catch (err) {
      console.warn("Failed to load cached predictive analytics run", err);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_SCENARIOS_KEY) || "[]");
      if (Array.isArray(saved)) setSavedScenarios(saved);
    } catch (err) {
      console.warn("Failed to load saved scenarios", err);
    }
  }, []);

  useEffect(() => {
    loadTelemetry();
    recomputeHealth();
    syncCloudTelemetry();
  }, []);

  // Stale-while-revalidate: attempt background refresh when cache exists
  useEffect(() => {
    if (data) {
      runTool({ swr: true, silent: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [/* run once when data loaded */ data]);

  const selectedMetrics = useMemo(
    () => normalizeMetrics(metricChips, form.customMetrics || ""),
    [metricChips, form.customMetrics]
  );

  const anomalies = data?.result?.anomalies || data?.anomalies || [];
  const filteredAnomalies = useMemo(
    () => anomalies.filter((a) => (anomalySeverity === "all" ? true : (a.severity || "low") === anomalySeverity)),
    [anomalySeverity, anomalies]
  );
  const forecasts = data?.result?.forecasts || data?.forecasts || {};
  const actuals = data?.result?.actuals || data?.actuals || {};
  const alertPreview = data?.result?.alertPreview || data?.alertPreview;
  const recommended = data?.result?.recommendedActions || data?.recommendedActions || [];
  const widgets = data?.result?.widgets || data?.widgets || [];
  const playbooks = data?.result?.playbooks || data?.playbooks || [];
  const cohortMeta = data?.result?.cohort || data?.cohort;
  const cohortBreakdown = data?.result?.cohortBreakdown || data?.cohortBreakdown || [];
  const cohortTrends = data?.result?.cohortTrends || data?.cohortTrends || [];
  const benchmarks = data?.result?.benchmarks || data?.benchmarks || [];
  const deliveryPreview = data?.result?.deliveryPreview || data?.deliveryPreview;

  const telemetryStats = useMemo(() => {
    const events = telemetryEvents || [];
    const last = events[events.length - 1];
    const scenarioSaves = events.filter((e) => e.event === "paw:scenario:save").length;
    const scenarioPresets = events.filter((e) => e.event === "paw:scenario:preset").length;
    const scenarioTunes = events.filter((e) => e.event === "paw:scenario:tune").length;
    const metricToggles = events.filter((e) => e.event === "paw:metric:toggle").length;
    return {
      total: events.length,
      scenarioSaves,
      scenarioPresets,
      scenarioTunes,
      metricToggles,
      lastEvent: last?.at || null,
    };
  }, [telemetryEvents]);

  const telemetryTrend = useMemo(() => {
    const events = (telemetryEvents || []).slice(-12);
    if (!events.length) return null;
    const width = 120;
    const height = 32;
    const counts = events.map((e) => (e.event === "paw:run:success" ? 2 : e.event === "paw:run:failure" ? 0 : 1));
    const max = Math.max(...counts, 1);
    const stepX = width / Math.max(counts.length - 1, 1);
    const points = counts.map((c, idx) => {
      const x = idx * stepX;
      const y = height - (c / max) * height;
      return `${x},${y}`;
    });
    return { width, height, points: points.join(" "), sample: events };
  }, [telemetryEvents]);

  const storeCache = (payload, formState) => {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ data: payload, at: new Date().toISOString(), form: formState, metricChips, routing, timeframe, granularity, scenario, cohort, benchmarkPeerSet })
      );
    } catch (err) {
      console.warn("Failed to cache predictive analytics run", err);
    }
  };

  const validate = () => {
    const emails = parseEmails(form.alertEmails);
    const invalid = emails.filter((e) => !emailRegex.test(e));
    if (invalid.length) {
      setInlineError(`Invalid email(s): ${invalid.join(", ")}`);
      setErrorSummary("Please fix the highlighted errors below.");
      if (alertEmailRef.current) alertEmailRef.current.focus();
      return false;
    }
    if (!selectedMetrics.length) {
      setInlineError("Select at least one metric.");
      setErrorSummary("Select at least one metric to proceed.");
      if (formRef.current) formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      return false;
    }
    setInlineError(null);
    setErrorSummary("");
    return true;
  };

  const recomputeHealth = () => {
    try {
      const events = JSON.parse(localStorage.getItem(TELEMETRY_KEY) || "[]");
      const successes = events.filter((e) => e.event === "paw:run:success");
      const failures = events.filter((e) => e.event === "paw:run:failure");
      const lastLatency = successes.length ? successes[successes.length - 1].payload?.latencyMs ?? null : null;
      setHealth({ lastLatency, successes: successes.length, failures: failures.length });
    } catch (err) {
      console.warn("Telemetry parse failed", err);
    }
  };

  const successRate = useMemo(() => {
    const total = health.successes + health.failures;
    if (!total) return null;
    return Math.round((health.successes / total) * 100);
  }, [health]);

  const loadTelemetry = () => {
    try {
      const events = JSON.parse(localStorage.getItem(TELEMETRY_KEY) || "[]");
      const trimmed = events.slice(-50);
      setTelemetryEvents(trimmed);
      const runs = trimmed
        .filter((evt) => evt.event === "paw:run:success")
        .map((evt) => ({
          at: evt.at,
          latencyMs: evt.payload?.latencyMs || 0,
          metrics: evt.payload?.metrics || 0,
        }))
        .slice(-20);
      setRunHistory(runs);
      const latencies = runs.map((r) => r.latencyMs || 0);
      const avg = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
      const peak = latencies.length ? Math.max(...latencies) : 0;
      setRunStats({ avg, peak, count: runs.length });
    } catch (err) {
      console.warn("Telemetry parse failed", err);
    }
  };

  const pushRemoteTelemetry = async (event, payload = {}) => {
    try {
      await apiFetch("/api/paw-telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, payload }),
      });
    } catch (_err) {
      // best-effort; ignore
    }
  };

  const trackInteraction = (event, payload = {}) => {
    recordTelemetry(event, payload);
    pushRemoteTelemetry(event, payload);
  };

  const syncCloudTelemetry = async () => {
    try {
      const res = await apiFetch("/api/paw-telemetry");
      const json = await res.json();
      if (json.ok) {
        const remoteEvents = json.events || [];
        setCloudTelemetryCount(remoteEvents.length);
        setCloudTelemetryTotal(json.total || remoteEvents.length);
        // Merge local + remote for display (favor recency)
        const merged = [...telemetryEvents, ...remoteEvents]
          .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
          .slice(-50);
        setTelemetryEvents(merged);
      }
    } catch (err) {
      console.warn("Cloud telemetry sync failed", err);
    }
  };

  const clearCloudTelemetry = async () => {
    try {
      await apiFetch("/api/paw-telemetry", { method: "DELETE" });
      setCloudTelemetryCount(0);
      setCloudTelemetryTotal(0);
      setTelemetryEvents([]);
    } catch (err) {
      console.warn("Cloud telemetry clear failed", err);
    }
  };

  const exportTelemetry = () => {
    if (!telemetryEvents.length) return;
    const blob = new Blob([JSON.stringify(telemetryEvents, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "paw-telemetry.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearTelemetry = () => {
    localStorage.removeItem(TELEMETRY_KEY);
    setTelemetryEvents([]);
    setRunHistory([]);
    setRunStats({ avg: 0, peak: 0, count: 0 });
    setHealth({ lastLatency: null, successes: 0, failures: 0 });
  };

  const runTool = async (overrides = {}) => {
    if (loading) return; // debounce rapid submissions
    if (!validate()) return;
    setLoading(true);
    setError("");
    setTestAlert(null);
    const payload = {
      metrics: selectedMetrics,
      frequency: form.frequency,
      alertEmails: form.alertEmails,
      alertThreshold: form.alertThreshold,
      scenarioDemandDelta: scenario.demandDelta,
      scenarioBudgetDelta: scenario.budgetDelta,
      alertRouting: routing,
      timeframe,
      granularity,
      cohort,
      benchmarkPeerSet,
      ...overrides,
    };

    const start = performance.now();
    try {
      const res = await apiFetch("/api/run/predictive-analytics-widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to run tool");
      const result = json.result || json;
      setData(result);
      setLastUpdated(new Date().toISOString());
      if (overrides.sendTestAlert) setTestAlert(result?.testAlert || null);
      storeCache(result, form);
      recordTelemetry("paw:run:success", { latencyMs: performance.now() - start, metrics: selectedMetrics.length, testAlert: !!overrides.sendTestAlert });
      recomputeHealth();
      loadTelemetry();
      pushRemoteTelemetry("paw:run:success", { latencyMs: performance.now() - start, metrics: selectedMetrics.length, testAlert: !!overrides.sendTestAlert });
    } catch (err) {
      setError(err.message || "Unable to run predictive analytics widgets");
      recordTelemetry("paw:run:failure", { message: err.message });
      recomputeHealth();
      loadTelemetry();
      pushRemoteTelemetry("paw:run:failure", { message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runTool();
  };

  const handleTestAlert = () => runTool({ sendTestAlert: true });

  const handleRoutingChange = (severity, channel, value) => {
    setRouting((prev) => ({
      ...prev,
      [severity]: { ...prev[severity], [channel]: value },
    }));
  };

  const handleChipToggle = (metric) => {
    setMetricChips((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    );
    trackInteraction("paw:metric:toggle", { metric });
  };

  const handleCopyActions = async () => {
    const text = recommended.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setInlineError(null);
    } catch (err) {
      setInlineError("Could not copy actions to clipboard.");
    }
  };

  const widgetCards = widgets.map((widget) => (
    <div
      key={widget.metric}
      className="paw-card"
      aria-label={`${widget.metric} widget`}
      title={`Metric: ${widget.metric.toUpperCase()}\nCurrent: ${widget.current}\nΔ vs last week: ${(widget.liftVsLastWeek || 0) * 100}%`}
    >
      <div className="paw-card__title">{widget.metric.toUpperCase()}</div>
      <div className="paw-card__value">
        {widget.metric === "churn"
          ? `${(widget.current * 100).toFixed(1)}%`
          : widget.metric === "ltv"
            ? `$${widget.current.toFixed(2)}`
            : widget.current}
      </div>
      <div className="paw-card__meta">
        {widget.direction === "up" ? "↗" : widget.direction === "down" ? "↘" : "→"} {Math.round((widget.liftVsLastWeek || 0) * 1000) / 10}% vs last week
      </div>
      <div className="paw-card__note">{widget.insight}</div>
    </div>
  ));

  const sparklineRows = Object.entries(forecasts).map(([metric, series]) => (
    <div key={metric} className="paw-forecast-card">
      <div className="paw-card__title">{metric.toUpperCase()}</div>
      <Sparkline metric={metric} series={series.slice(0, 14)} reduceMotion={reduceMotion} />
      {actuals[metric] && actuals[metric].length > 0 && (
        <div className="paw-actuals">
          <div className="paw-hint">Actuals (last {actuals[metric].length}d)</div>
          <div className="paw-actuals-row">
            {actuals[metric].slice(-7).map((point) => (
              <div key={`${metric}-act-${point.date}`} className="paw-forecast-point paw-actual-point">
                <div className="paw-forecast-date">{point.date.slice(5)}</div>
                <div className="paw-forecast-value">{metric === "churn" ? `${(point.actual * 100).toFixed(1)}%` : point.actual}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="paw-forecast-row">
        {series.slice(0, 7).map((point) => (
          <div
            key={`${metric}-${point.date}`}
            className="paw-forecast-point"
            title={`${metric.toUpperCase()} on ${point.date}: ${point.predicted} (CI ${point.lower}-${point.upper})`}
          >
            <div className="paw-forecast-date">{point.date.slice(5)}</div>
            <div className="paw-forecast-value">{metric === "churn" ? `${(point.predicted * 100).toFixed(1)}%` : point.predicted}</div>
            <div className="paw-forecast-range">{point.lower} - {point.upper}</div>
          </div>
        ))}
      </div>
    </div>
  ));

  const emailList = parseEmails(form.alertEmails);
  const invalidEmails = emailList.filter((e) => !emailRegex.test(e));

  const shareSnapshot = async () => {
    const token = crypto.randomUUID();
    try {
      const payload = JSON.stringify({ data, at: new Date().toISOString(), metrics: selectedMetrics });
      localStorage.setItem(`${SHARE_KEY}:${token}`, payload);
      await navigator.clipboard.writeText(`Snapshot saved. Token: ${token}`);
      setInlineError(null);
    } catch (err) {
      setInlineError("Could not create snapshot token.");
    }
  };

  const restoreSnapshot = () => {
    if (!snapshotToken) return;
    try {
      const raw = localStorage.getItem(`${SHARE_KEY}:${snapshotToken.trim()}`);
      if (!raw) {
        setInlineError("Snapshot token not found.");
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed?.data) {
        setData(parsed.data);
        setLastUpdated(parsed.at || new Date().toISOString());
        setInlineError(null);
      }
    } catch (err) {
      setInlineError("Failed to restore snapshot.");
    }
  };

  const exportCsv = (rows, headers, filename) => {
    if (!rows || !rows.length) return;
    const csv = [headers.join(",")].concat(
      rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportWidgets = () => {
    exportCsv(widgets, ["metric", "current", "direction", "liftVsLastWeek", "insight"], "widgets.csv");
  };

  const exportForecasts = () => {
    const rows = Object.entries(forecasts).flatMap(([metric, series]) =>
      series.map((p) => ({ metric, date: p.date, predicted: p.predicted, lower: p.lower, upper: p.upper }))
    );
    exportCsv(rows, ["metric", "date", "predicted", "lower", "upper"], "forecasts.csv");
  };

  const copyRawJson = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setInlineError(null);
    } catch (err) {
      setInlineError("Could not copy JSON.");
    }
  };

  const downloadJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "predictive-analytics.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJsonFromRows = (rows, filename) => {
    if (!rows || !rows.length) return;
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyScenarioSummary = async () => {
    const summary = {
      timeframe,
      granularity,
      cohort,
      scenario,
      metrics: selectedMetrics,
      benchmarkPeerSet,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
      setInlineError(null);
    } catch (err) {
      setInlineError("Could not copy scenario summary.");
    }
  };

  const copyResultsSummary = async () => {
    if (!data) return;
    const summary = {
      metrics: selectedMetrics.length,
      anomalies: filteredAnomalies.length,
      recommendations: recommended.length,
      timeframe,
      granularity,
      cohort,
      benchmarkPeerSet,
      health: {
        successRate,
        lastLatency: health.lastLatency,
      },
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
      setInlineError(null);
    } catch (err) {
      setInlineError("Could not copy results summary.");
    }
  };

  const scenarioPresets = {
    base: { demandDelta: 0, budgetDelta: 0 },
    stress: { demandDelta: -20, budgetDelta: -10 },
    upside: { demandDelta: 15, budgetDelta: 10 },
    promo_push: { demandDelta: 10, budgetDelta: 5 },
    holiday_spike: { demandDelta: 25, budgetDelta: 15 },
  };

  const applyScenarioPreset = (presetKey) => {
    const preset = scenarioPresets[presetKey];
    if (!preset) return;
    setScenario(preset);
    trackInteraction("paw:scenario:preset", { preset: presetKey });
  };

  const persistSavedScenarios = (next) => {
    setSavedScenarios(next);
    try {
      localStorage.setItem(SAVED_SCENARIOS_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn("Failed to persist scenarios", err);
    }
  };

  const saveCurrentScenario = () => {
    const name = (scenarioSaveName || "").trim() || `Scenario ${savedScenarios.length + 1}`;
    const tag = (scenarioSaveTag || "").trim();
    const entry = {
      name,
      demandDelta: scenario.demandDelta,
      budgetDelta: scenario.budgetDelta,
      tag: tag || null,
      savedAt: new Date().toISOString(),
    };
    const filtered = savedScenarios.filter((s) => s.name !== name);
    const next = [...filtered, entry];
    persistSavedScenarios(next);
    setScenarioSaveName("");
    setScenarioSaveTag("");
    trackInteraction("paw:scenario:save", entry);
  };

  const applySavedScenario = (entry) => {
    if (!entry) return;
    setScenario({ demandDelta: entry.demandDelta, budgetDelta: entry.budgetDelta });
    setScenarioSaveName(entry.name || "");
    setScenarioSaveTag(entry.tag || "");
    trackInteraction("paw:scenario:load", { name: entry.name });
  };

  const deleteSavedScenario = (name) => {
    const next = savedScenarios.filter((s) => s.name !== name);
    persistSavedScenarios(next);
    trackInteraction("paw:scenario:delete", { name });
  };

  const resetFormDefaults = () => {
    setForm({ frequency: "weekly", alertEmails: "", alertThreshold: 10, customMetrics: "" });
    setMetricChips(["churn", "ltv", "demand"]);
    setRouting({ ...DEFAULT_ROUTING, high: { ...DEFAULT_ROUTING.high }, medium: { ...DEFAULT_ROUTING.medium }, low: { ...DEFAULT_ROUTING.low } });
    setTimeframe("14d");
    setGranularity("daily");
    setScenario({ demandDelta: 0, budgetDelta: 0 });
    setCohort("all");
    setBenchmarkPeerSet("dtc_midmarket");
    setSnapshotToken("");
    setInlineError(null);
    setErrorSummary("");
  };

  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    setData(null);
    setLastUpdated(null);
    setInlineError(null);
    setError("");
  };

  const copyHealthSnapshot = async () => {
    const snapshot = {
      successRate,
      successes: health.successes,
      failures: health.failures,
      lastLatencyMs: health.lastLatency ? Math.round(health.lastLatency) : null,
      runsTracked: runHistory.length,
      avgLatencyMs: Math.round(runStats.avg || 0),
      peakLatencyMs: Math.round(runStats.peak || 0),
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
      setInlineError(null);
    } catch (err) {
      setInlineError("Could not copy health snapshot.");
    }
  };

  const formatTime = (value) => (value ? new Date(value).toLocaleTimeString() : "—");

  return (
    <div className={`paw-wrapper ${compact ? "paw-compact" : ""}`}>
      <div className="paw-header">
        <div>
          <h2>Predictive Analytics Widgets</h2>
          <p className="paw-subtitle">Churn, LTV, demand forecasts, and anomaly alerts.</p>
          <div className="paw-hint" aria-live="polite">In-house only: alerts and test sends are simulated; no external Slack/webhook delivery.</div>
        </div>
        <div className="paw-pill">Beta</div>
      </div>

      <div className="paw-meta-row">
        <div className="paw-hint">Health: {health.successes} ok / {health.failures} fail · Last latency: {health.lastLatency ? `${Math.round(health.lastLatency)}ms` : "—"}</div>
        <button className="paw-button paw-button--ghost" type="button" onClick={recomputeHealth}>
          Refresh health
        </button>
        <div className="paw-hint">Telemetry events: {telemetryEvents.length} · Cloud: {cloudTelemetryCount}/{cloudTelemetryTotal || cloudTelemetryCount}</div>
        <button className="paw-button paw-button--ghost" type="button" onClick={syncCloudTelemetry}>
          Sync telemetry
        </button>
        <button className="paw-button paw-button--ghost" type="button" onClick={clearCloudTelemetry}>
          Clear cloud telemetry
        </button>
        <div className="paw-hint">Success rate: {successRate !== null ? `${successRate}%` : "—"}</div>
        <label className="paw-toggle">
          <input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} />
          <span>Compact mode</span>
        </label>
        <label className="paw-toggle">
          <input type="checkbox" checked={reduceMotion} onChange={(e) => setReduceMotion(e.target.checked)} />
          <span>Reduced motion</span>
        </label>
        <button className="paw-button paw-button--ghost" type="button" onClick={clearCache}>
          Clear cache
        </button>
        <button className="paw-button paw-button--ghost" type="button" onClick={resetFormDefaults}>
          Reset form
        </button>
        <button className="paw-button paw-button--ghost" type="button" onClick={copyHealthSnapshot}>
          Copy health snapshot
        </button>
      </div>

      <div className="paw-meta-row" aria-label="Telemetry snapshot">
        <div className="paw-hint">Telemetry events: {telemetryStats.total}</div>
        <div className="paw-hint">Scenario saves: {telemetryStats.scenarioSaves} · presets: {telemetryStats.scenarioPresets} · tunes: {telemetryStats.scenarioTunes}</div>
        <div className="paw-hint">Metric toggles: {telemetryStats.metricToggles}</div>
        <div className="paw-hint">Last event: {telemetryStats.lastEvent ? new Date(telemetryStats.lastEvent).toLocaleTimeString() : "—"}</div>
        <button className="paw-button paw-button--ghost" type="button" onClick={exportTelemetry} disabled={!telemetryEvents.length}>
          Export telemetry
        </button>
        <button className="paw-button paw-button--ghost" type="button" onClick={clearTelemetry} disabled={!telemetryEvents.length}>
          Clear telemetry
        </button>
        {telemetryTrend && (
          <div className="paw-spark" aria-label="Telemetry trend" title="Recent events (green=success, grey=other, red=fail)">
            <svg width={telemetryTrend.width} height={telemetryTrend.height} role="img" aria-hidden="true">
              <polyline
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2"
                points={telemetryTrend.points}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
            <div className="paw-hint">Trend: success↑ / other • / failure ↓</div>
          </div>
        )}
      </div>

      <form className="paw-form" ref={formRef} onSubmit={handleSubmit} aria-live="polite">
        {errorSummary && <div className="paw-error" role="alert">{errorSummary}</div>}

        <div className="paw-field">
          <label htmlFor="timeframe">Timeframe</label>
          <select
            id="timeframe"
            value={timeframe}
            onChange={(e) => {
              setTimeframe(e.target.value);
              trackInteraction("paw:timeframe", { value: e.target.value });
            }}
          >
            <option value="7d">7d</option>
            <option value="14d">14d</option>
            <option value="30d">30d</option>
            <option value="60d">60d</option>
            <option value="90d">90d</option>
          </select>
        </div>

        <div className="paw-field">
          <label htmlFor="granularity">Granularity</label>
          <select
            id="granularity"
            value={granularity}
            onChange={(e) => {
              setGranularity(e.target.value);
              trackInteraction("paw:granularity", { value: e.target.value });
            }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="paw-field">
          <label htmlFor="peer-set">Benchmark peer set</label>
          <select
            id="peer-set"
            value={benchmarkPeerSet}
            onChange={(e) => {
              setBenchmarkPeerSet(e.target.value);
              trackInteraction("paw:benchmark:set", { value: e.target.value });
            }}
          >
            <option value="dtc_midmarket">DTC mid-market</option>
            <option value="dtc_enterprise">DTC enterprise</option>
            <option value="retail_hybrid">Retail / hybrid</option>
          </select>
          <div className="paw-hint">Adjusts benchmark cards to the selected peer group.</div>
        </div>

        <div className="paw-field">
          <label htmlFor="cohort">Cohort</label>
          <select
            id="cohort"
            value={cohort}
            onChange={(e) => {
              setCohort(e.target.value);
              trackInteraction("paw:cohort", { value: e.target.value });
            }}
          >
            <option value="all">All customers</option>
            <option value="new">New</option>
            <option value="returning">Returning</option>
            <option value="sms_engaged">SMS engaged</option>
          </select>
          {cohortMeta && <div className="paw-hint">{cohortMeta.label} · Lift: {(cohortMeta.lift * 100).toFixed(1)}% · n={cohortMeta.sampleSize}</div>}
        </div>

        <div className="paw-field">
          <label>Metric presets</label>
          <div className="paw-chips">
            {METRIC_PRESETS.map((metric) => (
              <button
                key={metric}
                type="button"
                className={`paw-chip-btn ${metricChips.includes(metric) ? "paw-chip-btn--active" : ""}`}
                onClick={() => handleChipToggle(metric)}
                title={GLOSSARY[metric] || ""}
              >
                {metric.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="paw-field">
          <label htmlFor="customMetrics">Custom metrics (optional)</label>
          <input
            id="customMetrics"
            name="customMetrics"
            placeholder="Enter additional metrics (comma or newline separated)"
            value={form.customMetrics}
            onChange={(e) => setForm((prev) => ({ ...prev, customMetrics: e.target.value }))}
          />
          <div className="paw-hint">Selected: {selectedMetrics.join(", ") || "none"}</div>
        </div>

        <div className="paw-field">
          <label htmlFor="frequency">Refresh frequency</label>
          <select id="frequency" name="frequency" value={form.frequency} onChange={(e) => setForm((prev) => ({ ...prev, frequency: e.target.value }))}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="paw-field">
          <label htmlFor="alertThreshold">Alert threshold (% change)</label>
          <input
            id="alertThreshold"
            name="alertThreshold"
            type="number"
            min="0"
            max="100"
            value={form.alertThreshold}
            onChange={(e) => setForm((prev) => ({ ...prev, alertThreshold: e.target.value }))}
          />
          <div className="paw-hint">Only anomalies with ≥ threshold absolute change are shown.</div>
        </div>

        <div className="paw-field">
          <label htmlFor="alertEmails">Alert emails (comma-separated)</label>
          <input
            id="alertEmails"
            name="alertEmails"
            placeholder="ops@example.com, cmo@example.com"
            value={form.alertEmails}
            onChange={(e) => setForm((prev) => ({ ...prev, alertEmails: e.target.value }))}
            aria-invalid={invalidEmails.length > 0}
            ref={alertEmailRef}
          />
          <div className="paw-hint">Alerts are simulated in-app; no external sends are triggered.</div>
          {invalidEmails.length > 0 && (
            <div className="paw-error" role="alert">Invalid email(s): {invalidEmails.join(", ")}</div>
          )}
        </div>

        <div className="paw-form-actions">
          <button type="submit" className="paw-button" disabled={loading}>
            {loading ? "Running…" : "Run predictions"}
          </button>
          <button type="button" className="paw-button paw-button--ghost" onClick={handleTestAlert} disabled={loading || invalidEmails.length > 0}>
            {loading ? "Sending…" : "Send test alert"}
          </button>
          <button type="button" className="paw-button paw-button--ghost" onClick={shareSnapshot} disabled={!data}>
            Copy snapshot token
          </button>
          <div className="paw-inline-input">
            <input
              placeholder="Paste snapshot token"
              value={snapshotToken}
              onChange={(e) => setSnapshotToken(e.target.value)}
            />
            <button type="button" className="paw-button paw-button--ghost" onClick={restoreSnapshot} disabled={!snapshotToken}>
              Restore snapshot
            </button>
          </div>
        </div>

        <div className="paw-section paw-inline">
          <div className="paw-section__title">Alert routing</div>
          <div className="paw-hint">Routing is for preview only; messages stay in-app for validation.</div>
          <div className="paw-routing-grid">
            {ROUTING_SEVERITIES.map((sev) => (
              <div key={sev} className="paw-routing-card">
                <div className="paw-card__title">{sev.toUpperCase()}</div>
                <input
                  placeholder="Email recipients (comma)"
                  value={(routing[sev]?.email || []).join(", ")}
                  onChange={(e) => handleRoutingChange(sev, "email", parseEmails(e.target.value))}
                />
                <input
                  placeholder="Slack channels (comma)"
                  value={(routing[sev]?.slack || []).join(", ")}
                  onChange={(e) => handleRoutingChange(sev, "slack", parseEmails(e.target.value))}
                />
                <input
                  placeholder="Webhook URLs (comma)"
                  value={(routing[sev]?.webhook || []).join(", ")}
                  onChange={(e) => handleRoutingChange(sev, "webhook", parseEmails(e.target.value))}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="paw-section paw-inline">
          <div className="paw-section__title">Scenarios</div>
          <div className="paw-scenarios">
            <label>
              Demand change (%):
              <input
                type="range"
                min="-40"
                max="40"
                step="5"
                value={scenario.demandDelta}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setScenario((p) => ({ ...p, demandDelta: next }));
                  trackInteraction("paw:scenario:tune", { field: "demand", value: next });
                }}
              />
              <span className="paw-hint">{scenario.demandDelta}%</span>
            </label>
            <label>
              Budget change (%):
              <input
                type="range"
                min="-40"
                max="40"
                step="5"
                value={scenario.budgetDelta}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setScenario((p) => ({ ...p, budgetDelta: next }));
                  trackInteraction("paw:scenario:tune", { field: "budget", value: next });
                }}
              />
              <span className="paw-hint">{scenario.budgetDelta}%</span>
            </label>
          </div>
          <div className="paw-chips" aria-label="Scenario presets">
            <button type="button" className="paw-chip-btn" onClick={() => applyScenarioPreset("base")}>Base</button>
            <button type="button" className="paw-chip-btn" onClick={() => applyScenarioPreset("stress")}>Stress</button>
            <button type="button" className="paw-chip-btn" onClick={() => applyScenarioPreset("upside")}>Upside</button>
            <button type="button" className="paw-chip-btn" onClick={() => applyScenarioPreset("promo_push")}>Promo push</button>
            <button type="button" className="paw-chip-btn" onClick={() => applyScenarioPreset("holiday_spike")}>Holiday spike</button>
          </div>
          <div className="paw-actions-row">
            <button className="paw-button paw-button--ghost" type="button" onClick={copyScenarioSummary}>
              Copy scenario summary
            </button>
          </div>
          <div className="paw-section paw-inline" aria-label="Saved scenarios">
            <div className="paw-hint">Telemetry: {telemetryStats.total} events · last: {formatTime(telemetryStats.lastEvent)}</div>
            <div className="paw-inline-input">
              <input
                placeholder="Save current scenario as..."
                value={scenarioSaveName}
                onChange={(e) => setScenarioSaveName(e.target.value)}
              />
              <input
                placeholder="Tag (optional)"
                value={scenarioSaveTag}
                onChange={(e) => setScenarioSaveTag(e.target.value)}
              />
              <button className="paw-button paw-button--ghost" type="button" onClick={saveCurrentScenario}>
                Save scenario
              </button>
            </div>
            {savedScenarios.length > 0 ? (
              <div className="paw-chips" aria-label="Saved scenario list">
                {[...savedScenarios]
                  .sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0))
                  .map((s) => (
                    <div key={s.name} className="paw-chip-btn paw-chip-btn--inline">
                      <button type="button" className="paw-chip-btn" onClick={() => applySavedScenario(s)}>
                        {s.name} ({s.demandDelta}%, {s.budgetDelta}%) {s.tag ? `· ${s.tag}` : ""}
                      </button>
                      <button
                        type="button"
                        className="paw-chip-btn paw-chip-btn--danger"
                        onClick={() => deleteSavedScenario(s.name)}
                        aria-label={`Delete scenario ${s.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="paw-hint">Save scenarios to replay tuning quickly.</div>
            )}
          </div>
        </div>
      </form>

      {inlineError && <div className="paw-error" role="alert">{inlineError}</div>}
      {error && <div className="paw-error" role="alert">{error}</div>}

      {!data && !loading && (
        <div className="paw-empty" aria-live="polite">No predictions yet. Run the tool to populate widgets.</div>
      )}

      {loading && (
        <div className="paw-grid" aria-live="polite" aria-busy="true">
          {Array.from({ length: 3 }).map((_, idx) => <SkeletonCard key={idx} />)}
        </div>
      )}

      {data && (
        <div className="paw-results" aria-live="polite">
          <div className="paw-meta-row">
            <div className="paw-hint">Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : "just now"}</div>
            <div className="paw-hint">Showing {selectedMetrics.length} metrics</div>
          </div>

          <div className="paw-badges-row" aria-label="Summary stats">
            <div className="paw-badge">Metrics: {selectedMetrics.length}</div>
            <div className="paw-badge">Anomalies: {filteredAnomalies.length}</div>
            <div className="paw-badge">Recommendations: {recommended.length}</div>
            <div className="paw-badge">Cohort: {cohort}</div>
            <div className="paw-badge">Window: {timeframe} · {granularity}</div>
            <button className="paw-button paw-button--ghost" type="button" onClick={copyResultsSummary}>
              Copy summary
            </button>
          </div>

          <div className="paw-grid">{widgets.length ? widgetCards : <div className="paw-empty">No widgets returned.</div>}</div>

          {benchmarks.length > 0 && (
            <div className="paw-section">
              <div className="paw-section__title">Benchmarks vs peers</div>
              <div className="paw-actions-row">
                <button className="paw-button paw-button--ghost" type="button" onClick={() => exportCsv(benchmarks, ["metric", "you", "benchmark", "note"], "benchmarks.csv")}>
                  Export benchmarks CSV
                </button>
                <button className="paw-button paw-button--ghost" type="button" onClick={() => downloadJsonFromRows(benchmarks, "benchmarks.json")}>
                  Download benchmarks JSON
                </button>
              </div>
              <div className="paw-grid">
                {benchmarks.map((b) => {
                  const delta = b.benchmark ? ((b.you - b.benchmark) / b.benchmark) * 100 : 0;
                  const formattedYou = b.metric === "churn" ? `${(b.you * 100).toFixed(1)}%` : b.metric === "ltv" ? `$${b.you.toFixed(2)}` : b.you;
                  const formattedBenchmark = b.metric === "churn" ? `${(b.benchmark * 100).toFixed(1)}%` : b.metric === "ltv" ? `$${Number(b.benchmark).toFixed(2)}` : b.benchmark;
                  return (
                    <div key={b.metric} className="paw-card" title={b.note}>
                      <div className="paw-card__title">{b.metric.toUpperCase()}</div>
                      <div className="paw-card__value">You: {formattedYou}</div>
                      <div className="paw-card__meta">Benchmark: {formattedBenchmark}</div>
                      <div className="paw-card__note">Δ vs peers: {delta >= 0 ? "+" : ""}{delta.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="paw-section">
            <div className="paw-section__title">Forecast windows</div>
            {sparklineRows.length ? (
              <div className="paw-forecast-grid">{sparklineRows}</div>
            ) : (
              <div className="paw-empty">No forecast data available.</div>
            )}
          </div>

          {runHistory.length > 0 && (
            <div className="paw-section">
              <div className="paw-section__title">Run history (local)</div>
              <div className="paw-run-history">
                <div className="paw-run-bars">
                  {runHistory.map((r, idx) => {
                    const height = Math.max(8, Math.min(110, (r.latencyMs || 0) / 4));
                    return (
                      <div
                        key={idx}
                        className="paw-run-bar"
                        style={{ height }}
                        title={`Latency: ${Math.round(r.latencyMs)}ms\nMetrics: ${r.metrics}\n${new Date(r.at).toLocaleString()}`}
                      />
                    );
                  })}
                </div>
                <div className="paw-run-legend">Last {runHistory.length} successful runs · Avg {Math.round(runStats.avg)}ms · Peak {Math.round(runStats.peak)}ms</div>
                <div className="paw-actions-row">
                  <button className="paw-button paw-button--ghost" type="button" onClick={exportTelemetry}>
                    Export telemetry JSON
                  </button>
                  <button className="paw-button paw-button--ghost" type="button" onClick={clearTelemetry}>
                    Clear telemetry
                  </button>
                </div>
              </div>
            </div>
          )}

          {cohortBreakdown.length > 0 && (
            <div className="paw-section">
              <div className="paw-section__title">Cohort breakdown</div>
              <div className="paw-actions-row">
                <button className="paw-button paw-button--ghost" type="button" onClick={() => exportCsv(cohortBreakdown, ["name", "lift", "conversion", "size"], "cohort-breakdown.csv")}>
                  Export cohort CSV
                </button>
                <button className="paw-button paw-button--ghost" type="button" onClick={() => downloadJsonFromRows(cohortBreakdown, "cohort-breakdown.json")}>
                  Download cohort JSON
                </button>
              </div>
              <div className="paw-table-wrapper">
                <table className="paw-table">
                  <thead>
                    <tr>
                      <th>Cohort</th>
                      <th>Lift vs baseline</th>
                      <th>Conversion</th>
                      <th>Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohortBreakdown.map((c) => (
                      <tr key={c.name}>
                        <td>{c.name}</td>
                        <td>{(c.lift * 100).toFixed(1)}%</td>
                        <td>{(c.conversion * 100).toFixed(1)}%</td>
                        <td>{c.size.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {cohortTrends.length > 0 && (
            <div className="paw-section">
              <div className="paw-section__title">Cohort trend snapshots</div>
              <div className="paw-cohort-trends">
                {cohortTrends.map((ct) => {
                  const values = ct.series.map((p) => p.conversion);
                  const min = Math.min(...values);
                  const max = Math.max(...values);
                  return (
                    <div key={ct.name} className="paw-card">
                      <div className="paw-card__title">{ct.name}</div>
                      <Sparkline
                        metric={"conversion"}
                        series={ct.series.map((p) => ({ predicted: p.conversion }))}
                        reduceMotion={reduceMotion}
                      />
                      <div className="paw-card__meta">Range: {min.toFixed(1)}% - {max.toFixed(1)}%</div>
                      <div className="paw-card__note">Last: {ct.series[ct.series.length - 1].conversion.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {anomalies.length > 0 && (
            <div className="paw-section">
              <div className="paw-section__title">Anomaly alerts</div>
              <div className="paw-chips" role="group" aria-label="Filter anomalies by severity">
                {["all", "high", "medium", "low"].map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    className={`paw-chip-btn ${anomalySeverity === sev ? "paw-chip-btn--active" : ""}`}
                    onClick={() => setAnomalySeverity(sev)}
                  >
                    {sev.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="paw-hint">Showing {filteredAnomalies.length} of {anomalies.length} anomalies</div>
              <ul className="paw-list">
                {filteredAnomalies.map((anom, idx) => (
                  <li key={`${anom.metric}-${idx}`} className={`paw-chip paw-chip--${anom.severity || "low"}`} title={`Δ ${Math.round((anom.deltaPercent || 0) * 100)}%`}>
                    <strong>{anom.metric.toUpperCase()}</strong>: {anom.message} ({Math.round((anom.deltaPercent || 0) * 100)}% change)
                  </li>
                ))}
              </ul>
              <div className="paw-actions-row">
                <button
                  className="paw-button paw-button--ghost"
                  type="button"
                  onClick={() => exportCsv(filteredAnomalies, ["metric", "severity", "deltaPercent", "message"], "anomalies.csv")}
                >
                  Export anomalies CSV
                </button>
                <button
                  className="paw-button paw-button--ghost"
                  type="button"
                  onClick={() => downloadJsonFromRows(filteredAnomalies, "anomalies.json")}
                >
                  Download anomalies JSON
                </button>
              </div>
            </div>
          )}

          {recommended.length > 0 && (
            <div className="paw-section">
              <div className="paw-section__title">Recommended actions</div>
              <div className="paw-actions-row">
                <button className="paw-button paw-button--ghost" type="button" onClick={handleCopyActions}>
                  Copy all
                </button>
                <button className="paw-button paw-button--ghost" type="button" onClick={exportWidgets}>
                  Export widgets CSV
                </button>
                <button className="paw-button paw-button--ghost" type="button" onClick={exportForecasts}>
                  Export forecasts CSV
                </button>
                <button className="paw-button paw-button--ghost" type="button" onClick={copyRawJson}>
                  Copy JSON
                </button>
                <button className="paw-button paw-button--ghost" type="button" onClick={downloadJson}>
                  Download JSON
                </button>
              </div>
              <ul className="paw-bullets">
                {recommended.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {playbooks.length > 0 && (
            <div className="paw-section">
              <div className="paw-section__title">Playbooks</div>
              <div className="paw-playbooks">
                {playbooks.map((pb, idx) => (
                  <div key={idx} className="paw-playbook-card">
                    <div className="paw-card__title">{pb.title}</div>
                    <div className="paw-card__note">{pb.action}</div>
                    <a className="paw-link" href={pb.link} target="_blank" rel="noreferrer">Open</a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {alertPreview && (
            <div className="paw-section paw-alert-preview">
              <div className="paw-section__title">Alert preview ({alertPreview.cadence})</div>
              <div className="paw-alert-body">
                <div><strong>Subject:</strong> {alertPreview.subject}</div>
                <div><strong>Recipients:</strong> {(alertPreview.recipients || []).join(", ") || "—"}</div>
                <div className="paw-alert-preview-text">{alertPreview.bodyPreview}</div>
                <div className="paw-hint">Routing: High → email {routing.high.email.join(", ") || "—"}, Slack {routing.high.slack.join(", ") || "—"}</div>
              </div>
            </div>
          )}

          {deliveryResults.length > 0 && (
            <div className="paw-section paw-alert-preview">
              <div className="paw-section__title">Delivery attempts</div>
              <ul className="paw-bullets">
                {deliveryResults.map((dr, idx) => (
                  <li key={idx}>
                    {dr.channel ? `${dr.channel}: ` : "webhook: "}{dr.url || dr.recipients?.join(", ") || dr.destinations?.join(", ") || "n/a"} — {dr.status}
                    {dr.message ? ` (${dr.message})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {deliveryPreview && (
            <div className="paw-section paw-alert-preview">
              <div className="paw-section__title">Delivery simulation</div>
              <div className="paw-alert-body">
                <div className="paw-hint">{deliveryPreview.summary}</div>
                <ul className="paw-list">
                  {deliveryPreview.attempts.map((att, idx) => (
                    <li key={`${att.channel}-${idx}`} className="paw-chip" title={`Severity: ${att.severity}`}>
                      {att.channel.toUpperCase()} → {att.destination} ({att.status})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {testAlert && (
            <div className="paw-section paw-alert-preview" role="status" aria-live="polite">
              <div className="paw-section__title">Test alert simulated</div>
              <div className="paw-alert-body">
                <div><strong>Recipients:</strong> {(testAlert.recipients || []).join(", ") || "—"}</div>
                <div className="paw-alert-preview-text">{testAlert.note}</div>
              </div>
            </div>
          )}

          {telemetryEvents.length > 0 && (
            <div className="paw-section">
              <div className="paw-section__title">Telemetry</div>
              <div className="paw-hint">Last {telemetryEvents.length} events (stored locally)</div>
              <ul className="paw-bullets">
                {telemetryEvents
                  .slice(-6)
                  .reverse()
                  .map((evt, idx) => (
                    <li key={idx}>
                      <strong>{evt.event}</strong> at {new Date(evt.at).toLocaleTimeString()} — {evt.payload?.message || `${evt.payload?.latencyMs ? `${Math.round(evt.payload.latencyMs)}ms` : ""}`}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
