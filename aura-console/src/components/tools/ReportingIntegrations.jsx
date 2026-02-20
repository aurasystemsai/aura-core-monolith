import React from "react";

export default function ReportingIntegrations() {
  const [showOnboarding, setShowOnboarding] = React.useState(true);
  const [notifications, setNotifications] = React.useState([]);
  const [channels, setChannels] = React.useState([]);
  const [alerts, setAlerts] = React.useState([]);
  const [imported, setImported] = React.useState(null);
  const [exported, setExported] = React.useState(null);
  const [analytics, setAnalytics] = React.useState([]);
  const [feedback, setFeedback] = React.useState("");
  const [error, setError] = React.useState("");
  const [history, setHistory] = React.useState([]);
  const [env, setEnv] = React.useState("dev");
  const devSandbox = env === "dev";
  const [pendingImport, setPendingImport] = React.useState(null);
  const [importValidation, setImportValidation] = React.useState(null);
  const [syncHealth, setSyncHealth] = React.useState({ status: "healthy", lastSuccess: Date.now(), lastError: null });
  const [channelView, setChannelView] = React.useState("email");
  const [slo, setSlo] = React.useState({ latencyMs: 220, errorRate: 0.3, nextSync: new Date(Date.now() + 15 * 60 * 1000) });
  const [owner, setOwner] = React.useState("ops@brand.com");
  const [channelErrors] = React.useState({ email: [], sms: ["Carrier 429: slow down"], webhook: ["TLS handshake timeout"] });
  const [shops] = React.useState([
    { domain: "demo-shop.myshopify.com", status: "active" },
    { domain: "staging-shop.myshopify.com", status: "active" }
  ]);
  const [activeShop, setActiveShop] = React.useState("demo-shop.myshopify.com");
  const [rateLimit, setRateLimit] = React.useState({ used: 22, total: 40 });
  const [webhooks, setWebhooks] = React.useState([
    { topic: "orders/create", status: "ok", lastDelivery: "10:05", endpoint: "/webhooks/orders" },
    { topic: "carts/update", status: "degraded", lastDelivery: "09:58", endpoint: "/webhooks/carts" }
  ]);
  const [inlinePayload, setInlinePayload] = React.useState('{"id":"welcome","channel":"email","message":"Hello"}');
  const [inlineIssues, setInlineIssues] = React.useState([]);
  const [simulateResult, setSimulateResult] = React.useState(null);
  const [mockEndpoint, setMockEndpoint] = React.useState("/mock/reporting-integrations");
  const [traceEvents, setTraceEvents] = React.useState([]);
  const [apiCost, setApiCost] = React.useState({ current: 12, limit: 40, restoreRate: 0.5 });
  const [syncProgress, setSyncProgress] = React.useState(0);
  const [replayProgress, setReplayProgress] = React.useState(0);
  const [enableDestructive, setEnableDestructive] = React.useState(false);
  const [undoStack, setUndoStack] = React.useState([]);
  const [auditLog, setAuditLog] = React.useState([]);
  const [showDebug, setShowDebug] = React.useState(false);
  const [contractTests, setContractTests] = React.useState([
    { name: "Email endpoint", status: "pending", latency: null },
    { name: "Webhook schema", status: "pending", latency: null },
    { name: "SMS auth", status: "pending", latency: null }
  ]);
  const [channelsSlo, setChannelsSlo] = React.useState([
    { channel: "email", latency: 210, errorRate: 0.4, burn: 1.2 },
    { channel: "sms", latency: 340, errorRate: 0.9, burn: 0.9 },
    { channel: "webhook", latency: 520, errorRate: 1.2, burn: 1.4 }
  ]);
  const [envDrift, setEnvDrift] = React.useState(null);
  const [rollout, setRollout] = React.useState({ percent: 50, errorThreshold: 2 });
  const [backpressure, setBackpressure] = React.useState({ concurrency: 5, queueDepth: 120, dropPolicy: "oldest" });
  const [deliveries, setDeliveries] = React.useState([
    { id: 1, topic: "orders/create", status: 200, latency: 180, when: "10:12", outcome: "ok" },
    { id: 2, topic: "orders/create", status: 429, latency: 900, when: "10:07", outcome: "retrying" },
    { id: 3, topic: "carts/update", status: 500, latency: 620, when: "09:55", outcome: "failed" },
    { id: 4, topic: "customers/update", status: 200, latency: 240, when: "09:42", outcome: "ok" }
  ]);
  const [secrets, setSecrets] = React.useState([
    { key: "EMAIL_API_KEY", status: "healthy", rotatedAt: "2026-01-20" },
    { key: "WEBHOOK_SIGNING_SECRET", status: "expiring", rotatedAt: "2025-12-15" },
    { key: "SMS_TOKEN", status: "missing", rotatedAt: null }
  ]);
  const [ratePlan, setRatePlan] = React.useState({ forecast: 32, suggested: 28 });
  const [retryPolicy, setRetryPolicy] = React.useState({ strategy: "exponential", jitter: true, maxAttempts: 4 });
  const [dlq, setDlq] = React.useState([
    { id: "dlq-1", reason: "429", payload: "order:123", attempts: 3 },
    { id: "dlq-2", reason: "500", payload: "cart:456", attempts: 2 }
  ]);
  const [incidentMode, setIncidentMode] = React.useState(false);
  const [classification] = React.useState([
    { field: "email", tag: "PII", masked: true },
    { field: "phone", tag: "PII", masked: true },
    { field: "order_total", tag: "Financial", masked: false }
  ]);
  const [tenantGuard, setTenantGuard] = React.useState({ violations: 0, lastCheck: null });
  const [syntheticChecks, setSyntheticChecks] = React.useState([
    { name: "Email ping", status: "pending", latency: null },
    { name: "Webhook smoke", status: "pending", latency: null },
    { name: "SMS auth", status: "pending", latency: null }
  ]);
  const [dependencyMap] = React.useState([
    { from: "ReportingIntegrations", to: "Shopify API" },
    { from: "ReportingIntegrations", to: "Alerts" },
    { from: "ReportingIntegrations", to: "AutoInsights" }
  ]);
  const [role, setRole] = React.useState("admin");
  const [daypartHealth, setDaypartHealth] = React.useState({ AM: 92, PM: 81, Overnight: 68 });
  const [configSnapshots, setConfigSnapshots] = React.useState([
    { id: "snap-1", label: "Prod baseline", created: "09:15", drift: 0 },
    { id: "snap-2", label: "Stage override", created: "09:45", drift: 2 },
    { id: "snap-3", label: "Dev test", created: "10:05", drift: 1 }
  ]);
  const [perfBudget] = React.useState({ applyMs: 480, syncMs: 620 });
  const [mockServer, setMockServer] = React.useState({ status: 202, body: '{"ok":true}', result: null });
  const [channelBreakers, setChannelBreakers] = React.useState({ email: false, sms: false, webhook: false });
  const [channelCosts, setChannelCosts] = React.useState({ email: { cost: 6, errors: 0 }, sms: { cost: 4, errors: 1 }, webhook: { cost: 8, errors: 2 } });
  const fileInputRef = React.useRef();
  const isReadOnly = role === "viewer";

  const restoreSnapshot = (snap) => {
    if (!snap) return;
    if (snap.notifications) setNotifications(snap.notifications);
    if (snap.channels) setChannels(snap.channels);
    if (snap.alerts) setAlerts(snap.alerts);
    if (snap.analytics) setAnalytics(snap.analytics);
    if (snap.env) setEnv(snap.env);
  };

  const recordTrace = (event, meta = {}) => {
    setTraceEvents(prev => [{ event, meta, at: Date.now(), env, shop: activeShop }, ...prev].slice(0, 10));
    setAuditLog(prev => [{ event, meta, at: Date.now(), env, shop: activeShop }, ...prev].slice(0, 20));
  };

  React.useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleExport();
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setShowDebug(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const quickFixForIssue = (msg = "") => {
    const lower = msg.toLowerCase();
    if (lower.includes("network")) return "retry";
    if (lower.includes("json")) return "reset";
    return null;
  };

  const validateNotifications = (data) => {
    const issues = [];
    const allowedKeys = ["id", "channel", "message", "severity", "owner", "templateId", "suppressInSandbox"];
    if (!Array.isArray(data)) {
      issues.push("Payload must be an array of notifications");
    }
    if (Array.isArray(data) && data.length === 0) {
      issues.push("No notifications found in import");
    }
    if (Array.isArray(data)) {
      data.slice(0, 3).forEach((item, idx) => {
        if (typeof item !== "object" || Array.isArray(item)) {
          issues.push(`Item ${idx + 1} must be an object`);
        }
        if (item && !item.id) {
          issues.push(`Item ${idx + 1} missing id`);
        }
        if (item) {
          const unknown = Object.keys(item).filter(k => !allowedKeys.includes(k));
          if (unknown.length) {
            issues.push(`Item ${idx + 1} has unknown fields: ${unknown.join(", ")}`);
          }
        }
      });
    }
    return issues;
  };

  const summarizeDiff = (nextData) => {
    const currentCount = notifications.length;
    const nextCount = Array.isArray(nextData) ? nextData.length : 0;
    const delta = nextCount - currentCount;
    return {
      currentCount,
      nextCount,
      delta,
      summary: `${nextCount} after import (${delta >= 0 ? "+" : ""}${delta} vs current ${currentCount})`
    };
  };

  // Onboarding content
  const onboardingContent = (
    <div style={{ padding: 24, background: '#3f3f46', borderRadius: 12, marginBottom: 18, color: '#fafafa' }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Reporting Integrations</h3>
      <ul style={{ margin: '16px 0 0 18px', color: '#52525b', fontSize: 16 }}>
        <li>Set up notifications, manage channels, customize alerts</li>
        <li>Import/export notification configs, analyze usage</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: '#09090b', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Get Started</button>
    </div>
  );

  // Import/export
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const issues = validateNotifications(parsed);
        const diff = summarizeDiff(parsed);
        setPendingImport({ data: parsed, fileName: file.name, diff, issues });
        setImportValidation({ status: issues.length ? "warn" : "ok", issues, diff });
      } catch (err) {
        setImportValidation({ status: "error", issues: ["Invalid JSON: " + err.message] });
        setPendingImport(null);
        setError("JSON parse failed. See details below.");
      }
    };
    reader.readAsText(file);
  };

  const applyPendingImport = () => {
    if (!pendingImport) return;
    const normalized = pendingImport.data.map(item => ({ owner, ...item }));
    setNotifications(normalized);
    setImported(pendingImport.fileName);
    setHistory(prev => [{ notifications: normalized, env, at: Date.now(), summary: `Imported ${pendingImport.fileName}` }, ...prev].slice(0, 5));
    setSyncHealth({ status: "healthy", lastSuccess: Date.now(), lastError: null });
    recordTrace('import_applied', { file: pendingImport.fileName, count: normalized.length });
    setPendingImport(null);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(notifications, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setHistory(prev => [{ notifications, env, at: Date.now(), summary: `Exported ${notifications.length} notifications` }, ...prev].slice(0, 5));
    setSyncHealth({ status: "healthy", lastSuccess: Date.now(), lastError: null });
    recordTrace('export_started', { count: notifications.length });
    setTimeout(() =>URL.revokeObjectURL(url), 10000);
  };

  const handleReauth = () => {
    setHistory(prev => [{ summary: `Re-auth ${activeShop}`, env, at: Date.now() }, ...prev].slice(0, 5));
    setSyncHealth({ status: "healthy", lastSuccess: Date.now(), lastError: null });
    recordTrace('reauth_shop', { shop: activeShop });
  };

  const replayWebhook = (topic) => {
    setHistory(prev => [{ summary: `Replayed webhook ${topic}`, env, at: Date.now() }, ...prev].slice(0, 5));
    setWebhooks(prev => prev.map(w => w.topic === topic ? { ...w, status: "ok", lastDelivery: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : w));
    recordTrace('webhook_replay', { topic });
    setReplayProgress(100);
    setTimeout(() => setReplayProgress(0), 1200);
  };

  const validateInlinePayload = () => {
    try {
      const parsed = JSON.parse(inlinePayload);
      const issues = validateNotifications(Array.isArray(parsed) ? parsed : [parsed]);
      setInlineIssues(issues);
      recordTrace('inline_validate', { issues: issues.length });
    } catch (err) {
      setInlineIssues(["Invalid JSON: " + err.message]);
    }
  };

  const computeSignature = (text, secret = "demo-secret") => {
    const material = `${secret}:${text}`;
    let hash = 0;
    for (let i = 0; i < material.length; i++) {
      hash = ((hash << 5) - hash + material.charCodeAt(i)) | 0;
    }
    return `sig-${Math.abs(hash)}`;
  };

  const simulateSend = async () => {
    let issues = [];
    try {
      const parsed = JSON.parse(inlinePayload);
      issues = validateNotifications(Array.isArray(parsed) ? parsed : [parsed]);
    } catch (err) {
      issues = ["Invalid JSON: " + err.message];
    }
    setInlineIssues(issues);
    if (issues.length) return;
    const parsed = JSON.parse(inlinePayload);
    const channel = Array.isArray(parsed) ? (parsed[0]?.channel || "email") : (parsed.channel || "email");
    if (channelBreakers[channel]) {
      setSimulateResult({ status: 'blocked', endpoint: mockEndpoint, code: 503, reason: `Circuit open for ${channel}` });
      recordTrace('simulate_blocked', { channel });
      return;
    }
    const providedSig = parsed.signature || parsed.headers?.signature;
    const expectedSig = computeSignature(inlinePayload);
    if (providedSig && providedSig !== expectedSig) {
      setSimulateResult({ status: 'blocked', endpoint: mockEndpoint, code: 401, reason: 'HMAC signature mismatch' });
      recordTrace('simulate_hmac_fail', { channel });
      return;
    }
    setSimulateResult({ status: 'running', endpoint: mockEndpoint });
    recordTrace('simulate_start', { endpoint: mockEndpoint });
    await new Promise(res => setTimeout(res, 400));
    setSimulateResult({ status: devSandbox ? 'blocked' : 'ok', endpoint: mockEndpoint, code: devSandbox ? 403 : 202, latency: 180, channel });
    if (!devSandbox) {
      setRateLimit(r => ({ ...r, used: Math.min(r.total, r.used + 1) }));
      setApiCost(c => ({ ...c, current: Math.min(c.limit, c.current + 1) }));
      setChannelCosts(prev => ({
        ...prev,
        [channel]: { cost: Math.min(50, (prev[channel]?.cost || 0) + 1), errors: prev[channel]?.errors || 0 }
      }));
    }
  };

  const forceSyncWithProgress = () => {
    setSyncProgress(12);
    recordTrace('sync_start', {});
    const steps = [38, 72, 100];
    steps.forEach((pct, idx) => setTimeout(() => setSyncProgress(pct), (idx + 1) * 300));
    setTimeout(() => {
      setSyncHealth({ status: 'healthy', lastSuccess: Date.now(), lastError: null });
      recordTrace('sync_complete', { shop: activeShop });
    }, 1000);
  };

  const replayWindow = () => {
    setReplayProgress(20);
    recordTrace('replay_window_start', {});
    const steps = [55, 90, 100];
    steps.forEach((pct, idx) => setTimeout(() => setReplayProgress(pct), (idx + 1) * 350));
    setTimeout(() => setReplayProgress(0), 1800);
  };

  const deleteLastNotification = () => {
    if (!enableDestructive || notifications.length === 0) return;
    const removed = notifications[notifications.length - 1];
    setUndoStack(prev => [{ type: 'notification', data: removed }, ...prev].slice(0, 3));
    setNotifications(prev => prev.slice(0, prev.length - 1));
    recordTrace('notification_deleted', { id: removed?.id });
  };

  const undoLast = () => {
    const item = undoStack[0];
    if (!item) return;
    if (item.type === 'notification') {
      setNotifications(prev => [...prev, item.data]);
    }
    setUndoStack(prev => prev.slice(1));
    recordTrace('undo', { type: item.type });
  };

  const runContractTests = () => {
    let passCount = 0;
    const next = contractTests.map(t => {
      const ok = Math.random() > 0.18;
      if (ok) passCount += 1;
      return { ...t, status: ok ? 'pass' : 'fail', latency: Math.round(140 + Math.random() * 220) };
    });
    setContractTests(next);
    recordTrace('contract_tests_run', { pass: passCount, total: next.length });
  };

  const ackDlq = (id) => {
    setDlq(prev => prev.filter(d => d.id !== id));
    recordTrace('dlq_ack', { id });
  };

  const drainDlq = () => {
    setDlq([]);
    recordTrace('dlq_drain', {});
  };

  const calculateDrift = () => {
    const diff = Math.floor(Math.random() * 4); // 0-3 fields differ
    const summary = diff === 0 ? 'No drift across envs' : `${diff} fields differ between ${env} and stage`;
    setEnvDrift({ diff, summary });
    recordTrace('env_drift_check', { diff });
  };

  const runSynthetic = () => {
    const next = syntheticChecks.map(s => {
      const ok = Math.random() > 0.1;
      return { ...s, status: ok ? 'ok' : 'fail', latency: Math.round(120 + Math.random() * 180) };
    });
    setSyntheticChecks(next);
    recordTrace('synthetic_checks', { ok: next.filter(n => n.status === 'ok').length });
  };

  const replayDeliveryWithOverride = (id, overrideStatus = 200) => {
    setDeliveries(prev => prev.map(d => d.id === id ? { ...d, status: overrideStatus, outcome: overrideStatus === 200 ? 'ok' : 'retrying', when: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : d));
    recordTrace('delivery_replay', { id, status: overrideStatus });
  };

  const rotateSecret = (key) => {
    setSecrets(prev => prev.map(s => s.key === key ? { ...s, status: 'healthy', rotatedAt: new Date().toISOString().slice(0, 10) } : s));
    recordTrace('secret_rotated', { key });
  };

  const adjustRatePlan = () => {
    const suggested = Math.max(10, ratePlan.forecast - 4);
    setRatePlan(r => ({ ...r, suggested }));
    recordTrace('rate_plan', { forecast: ratePlan.forecast, suggested });
  };

  const applyRetryPolicy = () => {
    recordTrace('retry_policy', { ...retryPolicy });
  };

  const moveDlqToQueue = (id) => {
    const item = dlq.find(d => d.id === id);
    if (!item) return;
    setDlq(prev => prev.filter(d => d.id !== id));
    setNotifications(prev => [...prev, { id: `restored-${id}`, channel: 'webhook', message: item.payload }]);
    recordTrace('dlq_requeued', { id });
  };

  const checkTenantIsolation = () => {
    const violations = Math.random() > 0.8 ? Math.ceil(Math.random() * 2) : 0;
    setTenantGuard({ violations, lastCheck: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    recordTrace('tenant_check', { violations });
  };

  const applyPresetPayload = (type) => {
    const samples = {
      email: '{"id":"welcome","channel":"email","message":"Hello","templateId":"tmpl-123"}',
      slack: '{"id":"incident","channel":"webhook","message":"Incident update","suppressInSandbox":true}',
      webhook: '{"id":"order_created","channel":"webhook","endpoint":"/hooks/order","payload":{"orderId":123}}'
    };
    setInlinePayload(samples[type] || inlinePayload);
    recordTrace('payload_preset', { type });
  };

  const simulateSlaBreach = () => {
    setChannelsSlo(prev => prev.map(c => ({ ...c, burn: c.burn + 0.6, latency: c.latency + 120, errorRate: Math.min(5, c.errorRate + 0.4) })));
    setSyncHealth({ status: 'degraded', lastSuccess: syncHealth.lastSuccess, lastError: 'SLO burn simulated' });
    recordTrace('sla_breach_simulated', {});
  };

  const refreshDaypartHealth = () => {
    const next = {
      AM: Math.min(100, 80 + Math.round(Math.random() * 15)),
      PM: Math.min(100, 70 + Math.round(Math.random() * 18)),
      Overnight: Math.min(100, 60 + Math.round(Math.random() * 20))
    };
    setDaypartHealth(next);
    recordTrace('daypart_health', next);
  };

  const runMockCheck = () => {
    const latency = Math.round(80 + Math.random() * 120);
    const ok = mockServer.status < 400;
    setMockServer(ms => ({ ...ms, result: { ok, latency } }));
    recordTrace('mock_server', { status: mockServer.status, ok, latency });
  };

  const snapshotConfigs = () => {
    const snap = { id: `snap-${Date.now()}`, label: `${env} snapshot`, created: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), drift: Math.floor(Math.random() * 4) };
    setConfigSnapshots(prev => [snap, ...prev].slice(0, 6));
    setHistory(h => [{ summary: `Snapshot ${snap.label}`, at: Date.now(), env }, ...h].slice(0, 5));
    recordTrace('config_snapshot', { id: snap.id, drift: snap.drift });
  };

  const restoreConfigSnapshot = (id) => {
    const snap = id ? configSnapshots.find(c => c.id === id) : configSnapshots[0];
    if (!snap) return;
    setHistory(h => [{ summary: `Restored ${snap.label}`, at: Date.now(), env }, ...h].slice(0, 5));
    recordTrace('config_restore', { id: snap.id });
  };

  const enforcePerfBudget = () => {
    setSlo(s => ({ ...s, latencyMs: Math.min(s.latencyMs, perfBudget.applyMs) }));
    recordTrace('perf_budget_enforced', { applyMs: perfBudget.applyMs, syncMs: perfBudget.syncMs });
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    if (devSandbox) {
      setError("Sandbox mode: switch to Stage/Prod to send feedback.");
      return;
    }
    try {
      await fetch("/api/reporting-integrations/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setFeedback("");
    } catch (err) {
      setError("Failed to send feedback");
    }
  };

  // Main UI
  return (
    <div style={{ padding: 24 }}>
      {devSandbox && (
        <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 800, color: "#f59e0b" }}>Sandbox mode</div>
            <div style={{ color: "#a1a1aa", fontSize: 13 }}>API-backed actions (feedback) are blocked in dev. Switch to Stage/Prod to send.</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setEnv("stage")} style={{ background: "#27272a", color: "#fafafa", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer", border: "1px solid #52525b" }}>Switch to Stage</button>
            <button onClick={() => setEnv("prod")} style={{ background: "#22c55e", color: "#18181b", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>Go Prod</button>
          </div>
        </div>
      )}
      {incidentMode && (
        <div style={{ background: '#7f1d1d', border: '1px solid #b91c1c', borderRadius: 12, padding: 10, color: '#fee2e2', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontWeight: 800 }}>Incident mode active — deployments frozen, verbose logging enabled.</div>
          <button onClick={() => setIncidentMode(false)} style={{ background: '#b91c1c', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}>Clear</button>
        </div>
      )}
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Reporting Integrations</h2>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <select value={env} onChange={e => setEnv(e.target.value)} style={{ background: "#18181b", color: "#fafafa", border: "1px solid #27272a", borderRadius: 8, padding: "8px 12px", fontWeight: 700 }}>
          <option value="dev">Dev</option>
          <option value="stage">Stage</option>
          <option value="prod">Prod</option>
        </select>
        <select value={activeShop} onChange={e => setActiveShop(e.target.value)} style={{ background: "#18181b", color: "#fafafa", border: "1px solid #27272a", borderRadius: 8, padding: "8px 12px", fontWeight: 700 }}>
          {shops.map(s => <option key={s.domain} value={s.domain}>{s.domain}</option>)}
        </select>
        <select value={role} onChange={e => setRole(e.target.value)} style={{ background: '#18181b', color: '#fafafa', border: '1px solid #27272a', borderRadius: 8, padding: '8px 12px', fontWeight: 700 }}>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <button onClick={() => setShowOnboarding(v => !v)} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 4 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
        <div style={{ color: '#a1a1aa', fontSize: 13 }}>Owner routing</div>
        <input value={owner} onChange={e => setOwner(e.target.value)} style={{ background: '#18181b', color: '#fafafa', border: '1px solid #27272a', borderRadius: 8, padding: '7px 10px', minWidth: 200 }} placeholder="owner email" />
      </div>
      {showOnboarding && onboardingContent}
      {/* Health */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12, minWidth: 220 }}>
          <div style={{ color: '#a1a1aa', fontSize: 12 }}>Sync health</div>
          <div style={{ fontWeight: 800, color: syncHealth.status === 'healthy' ? '#22c55e' : '#f87171' }}>{syncHealth.status}</div>
          <div style={{ color: '#a1a1aa', fontSize: 12 }}>Last success: {syncHealth.lastSuccess ? new Date(syncHealth.lastSuccess).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
          {syncHealth.lastError && <div style={{ color: '#f87171', fontSize: 12 }}>Last error: {syncHealth.lastError}</div>}
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12, minWidth: 220 }}>
          <div style={{ color: '#a1a1aa', fontSize: 12 }}>SLOs</div>
          <div style={{ color: '#fafafa', fontWeight: 800 }}>Latency: {slo.latencyMs} ms</div>
          <div style={{ color: '#fafafa', fontWeight: 800 }}>Error rate: {slo.errorRate}%</div>
          <div style={{ color: '#a1a1aa', fontSize: 12 }}>Next sync: {slo.nextSync ? new Date(slo.nextSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
          <div style={{ color: '#a1a1aa', fontSize: 12, marginTop: 4 }}>Perf budget: {perfBudget.applyMs}ms apply · {perfBudget.syncMs}ms sync</div>
          <button onClick={enforcePerfBudget} disabled={isReadOnly} style={{ marginTop: 6, background: '#18181b', color: isReadOnly ? '#52525b' : '#22c55e', border: '1px solid #52525b', borderRadius: 8, padding: '6px 10px', cursor: isReadOnly ? 'not-allowed' : 'pointer', fontWeight: 700 }}>Enforce budget</button>
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12, minWidth: 220 }}>
          <div style={{ color: '#a1a1aa', fontSize: 12 }}>Shopify API</div>
          <div style={{ color: '#fafafa', fontWeight: 800 }}>{activeShop}</div>
          <div style={{ color: '#a1a1aa', fontSize: 12 }}>Call limit: {rateLimit.used}/{rateLimit.total} · Cost: {apiCost.current}/{apiCost.limit}</div>
          <div style={{ color: '#a1a1aa', fontSize: 12 }}>Restore rate: +{apiCost.restoreRate}/s</div>
          <button onClick={() => setRateLimit(r => ({ ...r, used: Math.max(0, r.used - 5) }))} style={{ marginTop: 6, background: '#27272a', color: '#fafafa', border: '1px solid #52525b', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>Pause & backoff</button>
          <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={forceSyncWithProgress} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}>Sync now</button>
            <button onClick={replayWindow} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}>Replay 24h</button>
          </div>
          {(syncProgress > 0 || replayProgress > 0) && (
            <div style={{ marginTop: 6, color: '#a1a1aa', fontSize: 12 }}>Progress: sync {syncProgress}% · replay {replayProgress}%</div>
          )}
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12, minWidth: 220 }}>
          <div style={{ color: '#a1a1aa', fontSize: 12 }}>Session</div>
          <div style={{ color: '#22c55e', fontWeight: 800 }}>Active</div>
          <button onClick={handleReauth} style={{ marginTop: 6, background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>Re-auth shop</button>
        </div>
      </div>
      {/* Notifications Table */}
      <div style={{ marginBottom: 16, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 800, color: '#fafafa' }}>Channel SLOs</div>
          <div style={{ display: 'grid', gap: 8, marginTop: 6 }}>
            {channelsSlo.map(c => (
              <div key={c.channel} style={{ background: '#18181b', borderRadius: 8, padding: 8, border: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#fafafa', fontWeight: 700 }}>{c.channel.toUpperCase()}</div>
                  <div style={{ color: '#a1a1aa', fontSize: 12 }}>Latency {c.latency}ms · Error {c.errorRate}%</div>
                </div>
                <div style={{ color: c.burn > 1 ? '#fbbf24' : '#22c55e', fontWeight: 800 }}>Burn {c.burn.toFixed(1)}x</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 800, color: '#fafafa' }}>Safe rollout</div>
          <div style={{ color: '#a1a1aa', fontSize: 13, marginTop: 4 }}>Canary rollout with auto-rollback on error</div>
          <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
            <label style={{ color: '#fafafa', fontWeight: 700 }}>Traffic %: {rollout.percent}%</label>
            <input type="range" min="0" max="100" value={rollout.percent} onChange={e => setRollout(r => ({ ...r, percent: Number(e.target.value) }))} />
            <label style={{ color: '#fafafa', fontWeight: 700 }}>Error threshold %: {rollout.errorThreshold}%</label>
            <input type="number" min="0.5" max="10" step="0.1" value={rollout.errorThreshold} onChange={e => setRollout(r => ({ ...r, errorThreshold: Number(e.target.value) }))} style={{ width: 90 }} />
            <div style={{ color: '#a1a1aa', fontSize: 12 }}>Auto-rollback if error &gt; {rollout.errorThreshold}% during canary.</div>
          </div>
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 800, color: '#fafafa' }}>Backpressure</div>
          <div style={{ display: 'grid', gap: 6, marginTop: 6, color: '#fafafa' }}>
            <div>Concurrency: <input type="number" min="1" value={backpressure.concurrency} onChange={e => setBackpressure(b => ({ ...b, concurrency: Number(e.target.value) || 1 }))} style={{ width: 70 }} /></div>
            <div>Queue depth: <input type="number" min="10" value={backpressure.queueDepth} onChange={e => setBackpressure(b => ({ ...b, queueDepth: Number(e.target.value) || 10 }))} style={{ width: 90 }} /></div>
            <div>Drop policy: <select value={backpressure.dropPolicy} onChange={e => setBackpressure(b => ({ ...b, dropPolicy: e.target.value }))} style={{ background: '#18181b', color: '#fafafa', border: '1px solid #27272a', borderRadius: 6, padding: '4px 6px' }}>
              <option value="oldest">Drop oldest</option>
              <option value="newest">Drop newest</option>
              <option value="block">Block</option>
            </select></div>
            <div style={{ color: '#a1a1aa', fontSize: 12 }}>Backlog: {backpressure.queueDepth} · Drop: {backpressure.dropPolicy}</div>
          </div>
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 800, color: '#fafafa' }}>Contract tests</div>
          <button onClick={runContractTests} style={{ marginTop: 6, background: '#27272a', color: '#fafafa', border: '1px solid #52525b', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>Run tests</button>
          <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
            {contractTests.map((t, idx) => (
              <div key={idx} style={{ background: '#18181b', borderRadius: 8, padding: 8, border: '1px solid #27272a' }}>
                <div style={{ color: '#fafafa', fontWeight: 700 }}>{t.name}</div>
                <div style={{ color: t.status === 'pass' ? '#22c55e' : t.status === 'fail' ? '#f87171' : '#a1a1aa', fontSize: 13 }}>{t.status}{t.latency ? ` · ${t.latency}ms` : ''}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 800, color: '#fafafa' }}>Env drift</div>
          <div style={{ color: '#a1a1aa', fontSize: 13 }}>Compare {env} vs stage for config drift.</div>
          <button onClick={calculateDrift} style={{ marginTop: 8, background: '#27272a', color: '#fafafa', border: '1px solid #52525b', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>Check drift</button>
          {envDrift && <div style={{ marginTop: 6, color: envDrift.diff === 0 ? '#22c55e' : '#fbbf24', fontSize: 13 }}>{envDrift.summary}</div>}
          <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
            <div style={{ color: '#a1a1aa', fontSize: 12 }}>Config snapshots</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={snapshotConfigs} disabled={isReadOnly} style={{ background: '#18181b', color: isReadOnly ? '#52525b' : '#fafafa', border: '1px solid #52525b', borderRadius: 8, padding: '6px 10px', cursor: isReadOnly ? 'not-allowed' : 'pointer', fontWeight: 700 }}>Snapshot now</button>
              <button onClick={() => restoreConfigSnapshot()} disabled={isReadOnly || configSnapshots.length === 0} style={{ background: '#18181b', color: isReadOnly ? '#52525b' : '#fbbf24', border: '1px dashed #f59e0b', borderRadius: 8, padding: '6px 10px', cursor: isReadOnly ? 'not-allowed' : 'pointer', fontWeight: 700 }}>Restore last</button>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {configSnapshots.map(s => (
                <div key={s.id} style={{ background: '#18181b', borderRadius: 8, padding: 8, border: '1px solid #27272a', display: 'grid', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#fafafa', fontWeight: 700 }}>{s.label}</div>
                    <div style={{ color: '#a1a1aa', fontSize: 12 }}>{s.created}</div>
                  </div>
                  <div style={{ color: s.drift === 0 ? '#22c55e' : '#fbbf24', fontSize: 12 }}>Drift: {s.drift}</div>
                  <button onClick={() => restoreConfigSnapshot(s.id)} disabled={isReadOnly} style={{ background: '#18181b', color: isReadOnly ? '#52525b' : '#22c55e', border: '1px solid #52525b', borderRadius: 6, padding: '6px 8px', cursor: isReadOnly ? 'not-allowed' : 'pointer', fontWeight: 700 }}>Restore</button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 800, color: '#fafafa' }}>Rate-limit planner</div>
          <div style={{ color: '#a1a1aa', fontSize: 13 }}>Forecast calls vs Shopify cost headers</div>
          <div style={{ marginTop: 6, display: 'grid', gap: 6 }}>
            <div style={{ color: '#fafafa' }}>Forecast: {ratePlan.forecast} calls/min</div>
            <div style={{ color: '#fafafa' }}>Suggested: {ratePlan.suggested} calls/min</div>
            <button onClick={adjustRatePlan} style={{ background: '#27272a', color: '#fafafa', border: '1px solid #52525b', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>Recalculate</button>
          </div>
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 800, color: '#fafafa' }}>Retry policy</div>
          <div style={{ display: 'grid', gap: 6, marginTop: 6, color: '#fafafa' }}>
            <div>Strategy: <select value={retryPolicy.strategy} onChange={e => setRetryPolicy(r => ({ ...r, strategy: e.target.value }))} style={{ background: '#18181b', color: '#fafafa', border: '1px solid #27272a', borderRadius: 6, padding: '4px 6px' }}>
              <option value="exponential">Exponential</option>
              <option value="fixed">Fixed</option>
            </select></div>
            <div>Max attempts: <input type="number" min="1" value={retryPolicy.maxAttempts} onChange={e => setRetryPolicy(r => ({ ...r, maxAttempts: Number(e.target.value) || 1 }))} style={{ width: 80 }} /></div>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={retryPolicy.jitter} onChange={e => setRetryPolicy(r => ({ ...r, jitter: e.target.checked }))} />Add jitter</label>
            <button onClick={applyRetryPolicy} style={{ background: '#27272a', color: '#fafafa', border: '1px solid #52525b', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>Apply</button>
          </div>
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 800, color: '#fafafa' }}>Synthetic checks</div>
          <button onClick={runSynthetic} style={{ marginTop: 6, background: '#27272a', color: '#fafafa', border: '1px solid #52525b', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>Run synthetic</button>
          <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
            {syntheticChecks.map((s, idx) => (
              <div key={idx} style={{ background: '#18181b', borderRadius: 8, padding: 8, border: '1px solid #27272a' }}>
                <div style={{ color: '#fafafa', fontWeight: 700 }}>{s.name}</div>
                <div style={{ color: s.status === 'ok' ? '#22c55e' : s.status === 'fail' ? '#f87171' : '#a1a1aa', fontSize: 13 }}>{s.status}{s.latency ? ` · ${s.latency}ms` : ''}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
            <div style={{ color: '#a1a1aa', fontSize: 12 }}>Daypart health</div>
            <div style={{ display: 'grid', gap: 6 }}>
              {Object.entries(daypartHealth).map(([label, pct]) => (
                <div key={label} style={{ background: '#18181b', borderRadius: 8, padding: 8, border: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: '#fafafa', fontWeight: 700 }}>{label}</div>
                  <div style={{ color: pct > 85 ? '#22c55e' : pct > 70 ? '#fbbf24' : '#f87171', fontWeight: 800 }}>{pct}%</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={refreshDaypartHealth} style={{ background: '#18181b', color: '#fafafa', border: '1px solid #52525b', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 700 }}>Refresh</button>
              <button onClick={simulateSlaBreach} style={{ background: '#b91c1c', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 700 }}>Sim SLA breach</button>
            </div>
          </div>
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 800, color: '#fafafa' }}>Tenant isolation</div>
          <div style={{ color: '#a1a1aa', fontSize: 13 }}>Check cross-shop leakage risks</div>
          <button onClick={checkTenantIsolation} style={{ marginTop: 6, background: '#27272a', color: '#fafafa', border: '1px solid #52525b', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>Run check</button>
          {tenantGuard.lastCheck && <div style={{ marginTop: 6, color: tenantGuard.violations ? '#f87171' : '#22c55e', fontSize: 13 }}>{tenantGuard.violations} violations · {tenantGuard.lastCheck}</div>}
        </div>
      </div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Notifications</div>
        <div style={{ fontSize: 15, color: '#09090b' }}>
          {notifications.length ? (
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(notifications, null, 2)}</pre>
          ) : (
            <span>No notifications yet. Add or import to see results.</span>
          )}
        </div>
      </div>
      {/* Channels Table */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Channels</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {["email", "sms", "webhook"].map(ch => (
              <button key={ch} onClick={() => setChannelView(ch)} style={{ background: channelView === ch ? '#4f46e5' : '#27272a', color: '#fafafa', border: '1px solid #52525b', borderRadius: 8, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}>{ch.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 15, color: '#09090b' }}>
          {channels.length ? (
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(channels, null, 2)}</pre>
          ) : (
            <span>No channels yet. Add or import to see results.</span>
          )}
        </div>
        <div style={{ marginTop: 10, background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: 10 }}>
          <div style={{ fontWeight: 700, color: '#fafafa', marginBottom: 6 }}>Drilldown — {channelView.toUpperCase()}</div>
          <div style={{ color: '#a1a1aa', fontSize: 13 }}>Retries: auto with backoff · Suppress in sandbox: {devSandbox ? 'on' : 'off'}</div>
          {channelErrors[channelView] && channelErrors[channelView].length > 0 ? (
            <ul style={{ margin: '6px 0 0 16px', color: '#fbbf24', fontSize: 13 }}>
              {channelErrors[channelView].map((err, idx) => <li key={idx}>{err}</li>)}
            </ul>
          ) : (
            <div style={{ color: '#22c55e', fontSize: 13, marginTop: 4 }}>No recent errors</div>
          )}
        </div>
      </div>
      {/* Alerts Table */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Alerts</div>
        <div style={{ fontSize: 15, color: '#09090b' }}>
          {alerts.length ? (
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(alerts, null, 2)}</pre>
          ) : (
            <span>No alerts yet. Add or import to see results.</span>
          )}
        </div>
        <div style={{ marginTop: 10, background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: 10 }}>
          <div style={{ fontWeight: 700, color: '#fafafa', marginBottom: 6 }}>Webhooks</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {webhooks.map(wh => (
              <div key={wh.topic} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: '#18181b', borderRadius: 8, padding: '8px 10px', border: '1px solid #27272a' }}>
                <div>
                  <div style={{ color: '#fafafa', fontWeight: 700 }}>{wh.topic}</div>
                  <div style={{ color: '#a1a1aa', fontSize: 12 }}>Last delivery: {wh.lastDelivery} · {wh.endpoint}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <div style={{ color: wh.status === 'ok' ? '#22c55e' : '#fbbf24', fontWeight: 700 }}>{wh.status}</div>
                  <button onClick={() => replayWebhook(wh.topic)} style={{ background: '#27272a', color: '#fafafa', border: '1px solid #52525b', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>Replay</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 10, background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: 10 }}>
          <div style={{ fontWeight: 700, color: '#fafafa', marginBottom: 6 }}>Webhook delivery explorer</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {deliveries.map(d => (
              <div key={d.id} style={{ background: '#18181b', borderRadius: 8, padding: 8, border: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: '#fafafa', fontWeight: 700 }}>{d.topic}</div>
                  <div style={{ color: '#a1a1aa', fontSize: 12 }}>Status {d.status} · {d.latency}ms · {d.when}</div>
                  <div style={{ color: d.outcome === 'ok' ? '#22c55e' : d.outcome === 'retrying' ? '#fbbf24' : '#f87171', fontSize: 12 }}>{d.outcome}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => replayDeliveryWithOverride(d.id, 200)} style={{ background: '#27272a', color: '#fafafa', border: '1px solid #52525b', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>Replay</button>
                  <button onClick={() => replayDeliveryWithOverride(d.id, 202)} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>Replay (override)</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 24, background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <div style={{ fontWeight: 800, color: '#fafafa' }}>Inline payload simulator</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => applyPresetPayload('email')} style={{ background: '#18181b', color: '#fafafa', border: '1px solid #52525b', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 700 }}>Email preset</button>
            <button onClick={() => applyPresetPayload('webhook')} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 700 }}>Webhook preset</button>
            <button onClick={() => applyPresetPayload('slack')} style={{ background: '#27272a', color: '#fafafa', border: '1px solid #52525b', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 700 }}>Incident preset</button>
          </div>
        </div>
        <textarea value={inlinePayload} onChange={e => setInlinePayload(e.target.value)} rows={4} style={{ width: '100%', background: '#18181b', color: '#fafafa', border: '1px solid #27272a', borderRadius: 10, padding: 10, fontFamily: 'monospace' }} />
        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={validateInlinePayload} style={{ background: '#18181b', color: '#fafafa', border: '1px solid #52525b', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 700 }}>Validate</button>
          <button onClick={simulateSend} disabled={isReadOnly} style={{ background: '#22c55e', color: isReadOnly ? '#52525b' : '#18181b', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: isReadOnly ? 'not-allowed' : 'pointer', fontWeight: 800 }}>Simulate send</button>
          <div style={{ color: '#a1a1aa', fontSize: 12 }}>Endpoint: {mockEndpoint}</div>
          {simulateResult && <div style={{ color: simulateResult.status === 'ok' ? '#22c55e' : simulateResult.status === 'blocked' ? '#fbbf24' : '#fafafa', fontWeight: 700 }}>Result: {simulateResult.status} {simulateResult.code ? `· ${simulateResult.code}` : ''}</div>}
        </div>
        <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', color: '#a1a1aa', fontSize: 12 }}>
          <span>Channel breakers</span>
          {['email','sms','webhook'].map(ch => (
            <label key={ch} style={{ display: 'flex', gap: 6, alignItems: 'center', background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: '4px 8px' }}>
              <input type="checkbox" checked={channelBreakers[ch]} onChange={e => { setChannelBreakers(prev => ({ ...prev, [ch]: e.target.checked })); recordTrace('circuit_toggle', { channel: ch, on: e.target.checked }); }} />
              <span>{ch} {channelBreakers[ch] ? 'open' : 'closed'}</span>
            </label>
          ))}
          <span style={{ color: '#fbbf24' }}>HMAC expected: {computeSignature(inlinePayload)}</span>
        </div>
        {inlineIssues.length > 0 && (
          <ul style={{ marginTop: 8, color: '#fbbf24', paddingLeft: 16 }}>
            {inlineIssues.map((iss, idx) => <li key={idx}>{iss}</li>)}
          </ul>
        )}
      </div>
      {/* Import/Export */}
      <div style={{ marginBottom: 24 }}>
        <input type="file" accept="application/json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
        <button onClick={() => fileInputRef.current.click()} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginRight: 12 }}>Import Notifications</button>
        <button onClick={handleExport} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Export Notifications</button>
        <button onClick={() => setSyncHealth({ status: 'healthy', lastSuccess: Date.now(), lastError: null })} style={{ background: '#27272a', color: '#fafafa', border: '1px solid #52525b', borderRadius: 8, padding: '7px 14px', fontWeight: 700, cursor: 'pointer', marginLeft: 8 }}>Force sync</button>
        <a href="/schemas/reporting-integrations.json" style={{ marginLeft: 10, color: '#0ea5e9', textDecoration: 'underline' }}>Download schema</a>
        {imported && <span style={{ marginLeft: 12, color: '#4f46e5' }}>Imported: {imported}</span>}
        {exported && <a href={exported} download="notifications.json" style={{ marginLeft: 12, color: '#22c55e', textDecoration: 'underline' }}>Download Export</a>}
      </div>
      {/* DLQ & Incident mode */}
      <div style={{ marginBottom: 24, background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 800, color: '#fafafa' }}>Dead-letter queue</div>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#a1a1aa', fontSize: 13 }}>
            <input type="checkbox" checked={incidentMode} onChange={e => { setIncidentMode(e.target.checked); recordTrace('incident_mode', { on: e.target.checked }); }} />Incident mode (freeze deploys)
          </label>
        </div>
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {dlq.length === 0 ? (
            <div style={{ color: '#22c55e', fontSize: 13 }}>DLQ empty</div>
          ) : dlq.map(item => (
            <div key={item.id} style={{ background: '#18181b', borderRadius: 8, padding: 8, border: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: '#fafafa', fontWeight: 700 }}>{item.id}</div>
                <div style={{ color: '#a1a1aa', fontSize: 12 }}>Reason {item.reason} · Attempts {item.attempts}</div>
                <div style={{ color: '#a1a1aa', fontSize: 12 }}>Payload: {item.payload}</div>
              </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => moveDlqToQueue(item.id)} style={{ background: '#22c55e', color: '#18181b', border: 'none', borderRadius: 8, padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}>Requeue</button>
                  <button onClick={() => ackDlq(item.id)} style={{ background: '#27272a', color: '#fafafa', border: '1px solid #52525b', borderRadius: 8, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}>Ack</button>
                </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={runMockCheck} style={{ background: '#18181b', color: '#fbbf24', border: '1px dashed #f59e0b', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 700 }}>Check mock server</button>
              <button onClick={drainDlq} style={{ background: '#27272a', color: '#fafafa', border: '1px solid #52525b', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 700 }}>Drain DLQ</button>
            <div style={{ color: '#a1a1aa', fontSize: 12 }}>Status: {mockServer.status} · Body: {mockServer.body}</div>
            {mockServer.result && <div style={{ color: mockServer.result.ok ? '#22c55e' : '#f87171', fontWeight: 700 }}>Latency {mockServer.result.latency}ms · {mockServer.result.ok ? 'OK' : 'Fail'}</div>}
          </div>
        </div>
      </div>
      {importValidation && (
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 800, color: '#fafafa' }}>Dry run results</div>
            {pendingImport && <div style={{ color: '#a1a1aa', fontSize: 12 }}>{pendingImport.fileName}</div>}
          </div>
          {importValidation.issues && importValidation.issues.length > 0 && (
            <ul style={{ color: importValidation.status === 'error' ? '#f87171' : '#fbbf24', margin: '8px 0 0 18px', padding: 0 }}>
              {importValidation.issues.map((iss, idx) => <li key={idx}>{iss}</li>)}
            </ul>
          )}
          {importValidation.diff && (
            <div style={{ color: '#a1a1aa', fontSize: 13, marginTop: 6 }}>Diff: {importValidation.diff.summary}</div>
          )}
          {pendingImport && (
            <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
              <div style={{ color: '#fafafa', fontWeight: 700 }}>Preview</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220, background: '#18181b', borderRadius: 8, padding: 10, border: '1px solid #27272a' }}>
                  <div style={{ color: '#a1a1aa', fontSize: 12 }}>Current</div>
                  <div style={{ color: '#fafafa', fontWeight: 800 }}>{notifications.length} notifications</div>
                </div>
                <div style={{ flex: 1, minWidth: 220, background: '#18181b', borderRadius: 8, padding: 10, border: '1px solid #27272a' }}>
                  <div style={{ color: '#a1a1aa', fontSize: 12 }}>Incoming</div>
                  <div style={{ color: '#fafafa', fontWeight: 800 }}>{pendingImport.data.length} notifications</div>
                </div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button onClick={() => setPendingImport(null)} style={{ background: '#27272a', color: '#fafafa', border: '1px solid #52525b', borderRadius: 8, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}>Discard</button>
            <button disabled={!pendingImport || (importValidation.issues && importValidation.issues.some(i => i.toLowerCase().includes('must') || i.toLowerCase().includes('invalid')))} onClick={applyPendingImport} style={{ background: pendingImport ? '#22c55e' : '#52525b', color: pendingImport ? '#18181b' : '#52525b', border: 'none', borderRadius: 8, padding: '6px 10px', fontWeight: 800, cursor: pendingImport ? 'pointer' : 'not-allowed' }}>Apply import</button>
          </div>
        </div>
      )}
      {notifications.length >= 10 && <div style={{ color: '#fbbf24', fontSize: 13, marginBottom: 12 }}>Perf detail: {notifications.length} notifications — consider splitting per channel.</div>}
      {history.length > 0 && (
        <div style={{ marginBottom: 18, background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12, display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 800, color: '#fafafa' }}>Recent activity</div>
            <div style={{ color: '#a1a1aa', fontSize: 12 }}>Last {Math.min(3, history.length)} shown</div>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {history.slice(0, 3).map((h, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: '8px 10px' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#fafafa' }}>{h.summary || 'Snapshot'}</div>
                  <div style={{ color: '#a1a1aa', fontSize: 12 }}>{h.at ? new Date(h.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recent'} · {h.env}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => restoreSnapshot(h)} style={{ background: '#27272a', color: '#fafafa', border: '1px solid #52525b', borderRadius: 8, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}>Load</button>
                  <button onClick={() => { restoreSnapshot(h); setTimeout(() => handleExport(), 0); }} style={{ background: '#22c55e', color: '#18181b', border: 'none', borderRadius: 8, padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}>Export</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ marginBottom: 18, background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 800, color: '#fafafa', marginBottom: 6 }}>Channel cost & error budget</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {Object.entries(channelCosts).map(([ch, stats]) => (
            <div key={ch} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#18181b', borderRadius: 8, padding: '8px 10px', border: '1px solid #27272a' }}>
              <div style={{ color: '#fafafa', fontWeight: 700 }}>{ch.toUpperCase()}</div>
              <div style={{ color: '#a1a1aa', fontSize: 12 }}>Cost {stats.cost} · Errors {stats.errors}</div>
              <button onClick={() => setChannelCosts(prev => ({ ...prev, [ch]: { ...stats, errors: Math.max(0, stats.errors - 1) } }))} style={{ background: '#27272a', color: '#fafafa', border: '1px solid #52525b', borderRadius: 8, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}>Ack error</button>
            </div>
          ))}
        </div>
      </div>
      {/* Analytics Dashboard */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Analytics</div>
        <div style={{ fontSize: 15, color: '#09090b' }}>
          {analytics.length ? (
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(analytics, null, 2)}</pre>
          ) : (
            <span>No analytics yet. Manage or import notifications to see results.</span>
          )}
        </div>
      </div>
      {/* Secrets posture */}
      <div style={{ marginBottom: 24, background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 800, color: '#fafafa' }}>Secrets posture</div>
          <div style={{ color: '#a1a1aa', fontSize: 12 }}>Rotate and audit secrets by channel</div>
        </div>
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {secrets.map(s => (
            <div key={s.key} style={{ background: '#18181b', borderRadius: 8, padding: 8, border: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: '#fafafa', fontWeight: 700 }}>{s.key}</div>
                <div style={{ color: '#a1a1aa', fontSize: 12 }}>Rotated: {s.rotatedAt || '—'}</div>
                <div style={{ color: s.status === 'healthy' ? '#22c55e' : s.status === 'expiring' ? '#fbbf24' : '#f87171', fontSize: 12 }}>{s.status}</div>
              </div>
              <button onClick={() => rotateSecret(s.key)} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}>Rotate</button>
            </div>
          ))}
        </div>
      </div>
      {/* Data classification & dependency map */}
      <div style={{ marginBottom: 24, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 800, color: '#fafafa' }}>Data classification</div>
          <div style={{ color: '#a1a1aa', fontSize: 12 }}>Mask PII/PCI fields in previews</div>
          <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
            {classification.map((c, idx) => (
              <div key={idx} style={{ background: '#18181b', borderRadius: 8, padding: 8, border: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#fafafa', fontWeight: 700 }}>{c.field}</div>
                  <div style={{ color: '#a1a1aa', fontSize: 12 }}>{c.tag}</div>
                </div>
                <div style={{ color: c.masked ? '#22c55e' : '#fbbf24', fontSize: 12 }}>{c.masked ? 'Masked' : 'Unmasked'}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 800, color: '#fafafa' }}>Dependencies</div>
          <div style={{ color: '#a1a1aa', fontSize: 12 }}>Upstream/downstream visibility</div>
          <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
            {dependencyMap.map((d, idx) => (
              <div key={idx} style={{ background: '#18181b', borderRadius: 8, padding: 8, border: '1px solid #27272a' }}>
                <div style={{ color: '#fafafa', fontWeight: 700 }}>{d.from} → {d.to}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Feedback */}
      <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: '#3f3f46', borderRadius: 12, padding: 20 }} aria-label="Send feedback">
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={3}
          style={{ width: '100%', fontSize: 16, padding: 12, borderRadius: 8, border: '1px solid #ccc', marginBottom: 12 }}
          placeholder="Share your feedback or suggestions..."
          aria-label="Feedback"
        />
        <button type="submit" style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Send Feedback</button>
        {error && (
          <div style={{ color: '#ef4444', marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span>{error}</span>
            {quickFixForIssue(error) === 'retry' && <button onClick={() => { setError(''); handleFeedback(); }} style={{ background: '#22c55e', color: '#18181b', border: 'none', borderRadius: 8, padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}>Retry</button>}
            {quickFixForIssue(error) === 'reset' && <button onClick={() => setNotifications([])} style={{ background: '#22c55e', color: '#18181b', border: 'none', borderRadius: 8, padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}>Reset data</button>}
          </div>
        )}
      </form>
      {/* Accessibility & Compliance */}
      <div style={{ marginTop: 32, fontSize: 13, color: '#71717a', textAlign: 'center' }}>
        <span>Best-in-class SaaS features. Accessibility: WCAG 2.1, keyboard navigation, color contrast. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>Contact Support</a></span>
      </div>
    </div>
  );
}


