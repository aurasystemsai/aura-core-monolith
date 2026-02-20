﻿
import React from "react";
import { apiFetch } from "../../api";
import BackButton from "./BackButton";

export default function WebhookApiTriggers() {
  // Flagship UI state
  const [showOnboarding, setShowOnboarding] = React.useState(true);
  const [webhookInput, setWebhookInput] = React.useState("");
  const [apiInput, setApiInput] = React.useState("");
  const [webhooks, setWebhooks] = React.useState([]);
  const [apis, setApis] = React.useState([]);
  const [analytics, setAnalytics] = React.useState([]);
  const [imported, setImported] = React.useState(null);
  const [exported, setExported] = React.useState(null);
  const [feedback, setFeedback] = React.useState("");
  const [error, setError] = React.useState("");
  const [env, setEnv] = React.useState("dev");
  const [versionTag, setVersionTag] = React.useState("v1");
  const [approvalRequired, setApprovalRequired] = React.useState(true);
  const [approverEmail, setApproverEmail] = React.useState("");
  const [reviewerEmail, setReviewerEmail] = React.useState("");
  const [rateLimit, setRateLimit] = React.useState(60);
  const [concurrencyLimit, setConcurrencyLimit] = React.useState(5);
  const [circuitBreakerEnabled, setCircuitBreakerEnabled] = React.useState(true);
  const [guardrailPreset, setGuardrailPreset] = React.useState("standard");
  const [enabled, setEnabled] = React.useState(true);
  const [canaryPercent, setCanaryPercent] = React.useState(0);
  const [shadowMode, setShadowMode] = React.useState(false);
  const [performanceBudgetMs, setPerformanceBudgetMs] = React.useState(0);
  const [ipAllow, setIpAllow] = React.useState("");
  const [ipDeny, setIpDeny] = React.useState("");
  const [signaturePreview, setSignaturePreview] = React.useState(null);
  const [schemaJson, setSchemaJson] = React.useState("{\n  \"type\": \"object\",\n  \"properties\": {\n    \"event\": {\"type\": \"string\"}\n  },\n  \"required\": [\"event\"]\n}");
  const [testPayload, setTestPayload] = React.useState("{\n  \"event\": \"order_created\",\n  \"payload\": {\"id\": 123}\n}");
  const [recentPayloads, setRecentPayloads] = React.useState([]);
  const [simulation, setSimulation] = React.useState(null);
  const [validationIssues, setValidationIssues] = React.useState([]);
  const [schemaWarnings, setSchemaWarnings] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(false);
  const [analyticsSummary, setAnalyticsSummary] = React.useState({});
  const [selectedWebhookId, setSelectedWebhookId] = React.useState(null);
  const [selectedWebhookRevision, setSelectedWebhookRevision] = React.useState(null);
  const [selectedApiId, setSelectedApiId] = React.useState(null);
  const [selectedApiRevision, setSelectedApiRevision] = React.useState(null);
  const [preflightIssues, setPreflightIssues] = React.useState([]);
  const [preflightTrace, setPreflightTrace] = React.useState([]);
  const [preflightStatus, setPreflightStatus] = React.useState(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(window.localStorage.getItem("suite:status:webhook-api-triggers")) || null;
    } catch {
      return null;
    }
  });
  const [showPreflightPopover, setShowPreflightPopover] = React.useState(false);
  const [lastRunSnapshot, setLastRunSnapshot] = React.useState(null);
  const applyQuickFix = (kind) => {
    if (kind === "approver") {
      setApprovalRequired(true);
      setApproverEmail(prev => prev || "ops@shopify-brand.com");
    }
    if (kind === "prod-note") {
      setEnv("prod");
      setGuardrailPreset("strict");
      setRateLimit(prev => prev > 0 ? prev : 60);
      setConcurrencyLimit(prev => prev > 0 ? prev : 5);
      setPerformanceBudgetMs(prev => prev > 0 ? prev : 500);
      setCanaryPercent(prev => prev > 0 ? prev : 10);
      setShadowMode(true);
    }
    if (kind === "trigger-action") {
      setSchemaJson(prev => {
        try {
          JSON.parse(prev || "{}");
          return prev;
        } catch {
          return '{\n  "type": "object",\n  "properties": { "event": { "type": "string" }, "id": { "type": "number" } },\n  "required": ["event"]\n}';
        }
      });
      setTestPayload('{\n  "event": "order_created",\n  "payload": { "id": 123, "source": "shopify" }\n}');
      setRateLimit(prev => prev > 0 ? prev : 60);
      setConcurrencyLimit(prev => prev > 0 ? prev : 5);
    }
    if (kind === "dedupe-labels") {
      const allowEntries = Array.from(new Set(ipAllow.split(',').map(s => s.trim()).filter(Boolean)));
      const newAllow = allowEntries.join(', ');
      setIpAllow(newAllow);
      setIpDeny(prev => {
        const allowSet = new Set(allowEntries);
        const unique = Array.from(new Set(prev.split(',').map(s => s.trim()).filter(Boolean))).filter(ip => !allowSet.has(ip));
        return unique.join(', ');
      });
    }
  };
  const clearPreflightStatus = () => {
    setPreflightStatus(null);
    setPreflightIssues([]);
    setPreflightTrace([]);
    try { window.localStorage.removeItem("suite:status:webhook-api-triggers"); } catch (_) {}
  };

  const downloadPreflightReport = () => {
    const payload = { status: preflightStatus, issues: preflightIssues, trace: preflightTrace, generatedAt: Date.now() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "webhook-api-preflight.json";
    a.click();
    setTimeout(() =>URL.revokeObjectURL(url), 2000);
  };

  const attachPreflightForReviewer = () => {
    const payload = {
      reviewer: reviewerEmail || "reviewer@shopify-brand.com",
      status: preflightStatus,
      issues: preflightIssues,
      trace: preflightTrace,
      generatedAt: Date.now()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "webhook-api-preflight-review.json";
    a.click();
    setTimeout(() =>URL.revokeObjectURL(url), 2000);
  };
  const [lastDeleted, setLastDeleted] = React.useState(null);
  const [trash, setTrash] = React.useState({ webhooks: [], apis: [] });
  const [history, setHistory] = React.useState([]);
  const [comments, setComments] = React.useState([]);
  const [newComment, setNewComment] = React.useState("");
  const fileInputRef = React.useRef();

  React.useEffect(() => {
    loadData();
    loadAnalytics();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const resp = await apiFetch("/api/webhook-api-triggers/configs");
      const data = await resp.json();
      if (data.ok) {
        const webhooksRaw = data.webhooks || [];
        const apisRaw = data.apis || [];
        const overlapWarnings = new Set();
        // Very simple overlap: same env+version pair duplicates
        const keyCount = {};
        [...webhooksRaw, ...apisRaw].forEach(item => {
          const key = `${item.env || 'dev'}|${item.version || item.versionTag || 'v1'}`;
          keyCount[key] = (keyCount[key] || 0) + 1;
        });
        Object.entries(keyCount).forEach(([k, count]) => { if (count > 1) overlapWarnings.add(k); });
        const markOverlap = (items) => items.map(i => {
          const key = `${i.env || 'dev'}|${i.version || i.versionTag || 'v1'}`;
          const extraWarning = overlapWarnings.has(key) ? ["Potential overlap: multiple triggers share env/version"] : [];
          return { ...i, warnings: [...(i.warnings || []), ...extraWarning] };
        });
        setWebhooks(markOverlap(webhooksRaw));
        setApis(markOverlap(apisRaw));
      }
      const trashResp = await apiFetch("/api/webhook-api-triggers/trash");
      const trashData = await trashResp.json();
      if (trashData.ok) setTrash({ webhooks: trashData.webhooks || [], apis: trashData.apis || [] });
    } catch (err) {
      setError("Failed to load configs");
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalytics() {
    setAnalyticsLoading(true);
    try {
      const resp = await apiFetch("/api/webhook-api-triggers/analytics");
      const data = await resp.json();
      if (data.ok) setAnalytics(data.analytics || []);
      const summaryResp = await apiFetch("/api/webhook-api-triggers/analytics/summary");
      const summaryData = await summaryResp.json();
      if (summaryData.ok) setAnalyticsSummary(summaryData.summary || {});
    } catch (_err) {
      /* ignore */
    } finally {
      setAnalyticsLoading(false);
    }
  }

  // Onboarding content
  const onboardingContent = (
    <div style={{ padding: 24, background: '#1f2433', borderRadius: 12, marginBottom: 18, color: '#f6f7fb', border: '1px solid #283044' }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Webhook & API Triggers</h3>
      <ul style={{ margin: '16px 0 0 18px', color: '#e9ebf5', fontSize: 16 }}>
        <li>Set up webhook listeners and API integrations</li>
        <li>Trigger automations, import/export configs, and analyze events</li>
        <li>Guardrails: rate limits, concurrency, and circuit breakers</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Get Started</button>
    </div>
  );

  // Import/export
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async evt => {
      try {
        const items = JSON.parse(evt.target.result);
        const resp = await apiFetch("/api/webhook-api-triggers/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: Array.isArray(items) ? items : [] })
        });
        const data = await resp.json();
        if (!data.ok) throw new Error(data.error || "Import failed");
        setImported(file.name);
        await loadData();
      } catch (err) {
        setError("Import failed: " + err.message);
      }
    };
    reader.readAsText(file);
  };
  const handleExport = async () => {
    try {
      const resp = await apiFetch("/api/webhook-api-triggers/export");
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || "Export failed");
      const blob = new Blob([JSON.stringify({ webhooks: data.webhooks || data.items || [], apis: data.apis || [] }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      setExported(url);
      setTimeout(() =>URL.revokeObjectURL(url), 10000);
    } catch (err) {
      setError(err.message);
    }
  };

  const validate = () => {
    const issues = [];
    if (approvalRequired && !approverEmail) issues.push("Approver email required");
    if (!rateLimit || rateLimit <= 0) issues.push("Rate limit must be > 0");
    if (!concurrencyLimit || concurrencyLimit <= 0) issues.push("Concurrency limit must be > 0");
    try {
      const parsed = JSON.parse(schemaJson || "{}");
      const warnings = [];
      if (parsed.type === "object" && parsed.properties) {
        Object.entries(parsed.properties).forEach(([k, v]) => { if (v && v.type === "any") warnings.push(`Field ${k} is 'any'`); });
      }
      setSchemaWarnings(warnings);
    } catch {
      issues.push("Schema JSON invalid");
    }
    const allowList = ipAllow.split(',').map(s => s.trim()).filter(Boolean);
    const denyList = ipDeny.split(',').map(s => s.trim()).filter(Boolean);
    const overlap = allowList.filter(x => denyList.includes(x));
    if (overlap.length) issues.push("IP allow/deny lists overlap");
    if (canaryPercent < 0 || canaryPercent > 100) issues.push("Canary percent must be between 0 and 100");
    if (performanceBudgetMs && performanceBudgetMs < 0) issues.push("Performance budget must be positive");
    setValidationIssues(issues);
    return issues;
  };

  const runPreflight = () => {
    const issues = [];
    const trace = [];
    const record = (status, detail) => trace.push({ status, detail });

    record("pass", `Env ${env.toUpperCase()} · Version ${versionTag || "v1"}`);

    if (approvalRequired) {
      if (!approverEmail) {
        issues.push("Approver email required");
        record("fail", "Approver email missing while approval is required.");
      } else if (!approverEmail.includes("@")) {
        issues.push("Approver email looks invalid");
        record("warn", "Approver email missing '@'.");
      } else {
        record("pass", "Approver email provided.");
      }
    } else {
      record("pass", "Approval not required for this config.");
    }

    if (!rateLimit || rateLimit <= 0) {
      issues.push("Rate limit must be > 0");
      record("fail", "Rate limit not set or invalid.");
    } else {
      record("pass", `Rate limit ${rateLimit} req/min.`);
    }

    if (!concurrencyLimit || concurrencyLimit <= 0) {
      issues.push("Concurrency limit must be > 0");
      record("fail", "Concurrency limit not set or invalid.");
    } else {
      record("pass", `Concurrency limit ${concurrencyLimit}.`);
    }

    if (performanceBudgetMs && performanceBudgetMs < 0) {
      issues.push("Performance budget must be positive");
      record("fail", "Performance budget is negative.");
    } else if (performanceBudgetMs) {
      record("pass", `Performance budget ${performanceBudgetMs}ms.`);
    }

    if (canaryPercent < 0 || canaryPercent > 100) {
      issues.push("Canary percent must be between 0 and 100");
      record("fail", "Canary percent outside 0-100 range.");
    } else {
      record("pass", `Canary ${canaryPercent}%`);
    }

    const allowList = ipAllow.split(',').map(s => s.trim()).filter(Boolean);
    const denyList = ipDeny.split(',').map(s => s.trim()).filter(Boolean);
    const overlap = allowList.filter(x => denyList.includes(x));
    if (overlap.length) {
      issues.push("IP allow/deny lists overlap");
      record("fail", `IP overlap: ${overlap.join(', ')}`);
    } else if (allowList.length || denyList.length) {
      record("pass", "IP lists validated (no overlap).");
    }

    try {
      const parsed = JSON.parse(schemaJson || "{}");
      if (!parsed.type || !parsed.properties) {
        record("warn", "Schema missing type/properties.");
      } else {
        record("pass", "Schema JSON parsed.");
      }
    } catch (err) {
      issues.push("Schema JSON invalid");
      record("fail", "Schema JSON failed to parse.");
    }

    try {
      const payload = JSON.parse(testPayload || "{}");
      if (!payload.event) {
        record("warn", "Test payload missing event field.");
      } else {
        record("pass", "Test payload parsed with event.");
      }
    } catch (err) {
      record("fail", "Test payload JSON invalid.");
      issues.push("Test payload JSON invalid");
    }

    if (!webhooks.length && !apis.length) {
      record("warn", "No webhooks or APIs configured yet.");
    } else {
      record("pass", `${webhooks.length} webhook(s), ${apis.length} API(s) configured.`);
    }

    if (shadowMode && canaryPercent === 0) {
      record("warn", "Shadow mode enabled without canary traffic.");
    }

    setPreflightIssues(issues);
    setPreflightTrace(trace);
    const status = { ok: issues.length === 0, ts: Date.now(), issues: issues.length };
    setPreflightStatus(status);
    try { window.localStorage.setItem("suite:status:webhook-api-triggers", JSON.stringify(status)); } catch (_) {}
    setLastRunSnapshot({
      env,
      versionTag,
      approvalRequired,
      approverEmail,
      rateLimit,
      concurrencyLimit,
      circuitBreakerEnabled,
      guardrailPreset,
      enabled,
      canaryPercent,
      shadowMode,
      performanceBudgetMs,
      ipAllow,
      ipDeny,
      schemaJson,
      testPayload,
      webhooks,
      apis,
      ts: Date.now()
    });
    return issues;
  };

  const runDryRun = () => {
    setEnv("dev");
    runPreflight();
  };

  const rollbackToLastRun = () => {
    if (!lastRunSnapshot) return;
    setEnv(lastRunSnapshot.env || "dev");
    setVersionTag(lastRunSnapshot.versionTag || "v1");
    setApprovalRequired(!!lastRunSnapshot.approvalRequired);
    setApproverEmail(lastRunSnapshot.approverEmail || "");
    setRateLimit(lastRunSnapshot.rateLimit ?? rateLimit);
    setConcurrencyLimit(lastRunSnapshot.concurrencyLimit ?? concurrencyLimit);
    setCircuitBreakerEnabled(lastRunSnapshot.circuitBreakerEnabled ?? true);
    setGuardrailPreset(lastRunSnapshot.guardrailPreset || guardrailPreset);
    setEnabled(lastRunSnapshot.enabled ?? enabled);
    setCanaryPercent(lastRunSnapshot.canaryPercent ?? 0);
    setShadowMode(!!lastRunSnapshot.shadowMode);
    setPerformanceBudgetMs(lastRunSnapshot.performanceBudgetMs || 0);
    setIpAllow(lastRunSnapshot.ipAllow || "");
    setIpDeny(lastRunSnapshot.ipDeny || "");
    setSchemaJson(lastRunSnapshot.schemaJson || schemaJson);
    setTestPayload(lastRunSnapshot.testPayload || testPayload);
  };

  React.useEffect(() => {
    if (env === "prod" || guardrailPreset === "strict") {
      runPreflight();
    }
  }, [env, guardrailPreset, approvalRequired, performanceBudgetMs, canaryPercent]);

  const handleAddWebhook = async () => {
    const issues = validate();
    const nextIssues = [...issues];
    if (!webhookInput) nextIssues.push("Webhook URL is required");
    if (nextIssues.length) { setValidationIssues(nextIssues); setError("Fix validation issues before adding webhook"); return; }
    setSaving(true);
    setError("");
    const payload = {
      url: webhookInput,
      env,
      versionTag,
      approvalRequired,
      approverEmail: approvalRequired ? approverEmail : null,
      guardrails: { rateLimit, concurrencyLimit, circuitBreakerEnabled },
      contract: schemaJson,
      enabled,
      canaryPercent,
      shadowMode,
      performanceBudgetMs: performanceBudgetMs || null,
      ipAllow: ipAllow.split(',').map(s => s.trim()).filter(Boolean),
      ipDeny: ipDeny.split(',').map(s => s.trim()).filter(Boolean)
    };
    try {
      const resp = await apiFetch("/api/webhook-api-triggers/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || "Add failed");
      setWebhooks(prev => [...prev, data.webhook]);
      setWebhookInput("");
      await loadAnalytics();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddApi = async () => {
    const issues = validate();
    const nextIssues = [...issues];
    if (!apiInput) nextIssues.push("API endpoint is required");
    if (nextIssues.length) { setValidationIssues(nextIssues); setError("Fix validation issues before adding API"); return; }
    setSaving(true);
    setError("");
    const payload = {
      endpoint: apiInput,
      env,
      versionTag,
      approvalRequired,
      approverEmail: approvalRequired ? approverEmail : null,
      guardrails: { rateLimit, concurrencyLimit, circuitBreakerEnabled },
      contract: schemaJson,
      enabled,
      canaryPercent,
      shadowMode,
      performanceBudgetMs: performanceBudgetMs || null,
      ipAllow: ipAllow.split(',').map(s => s.trim()).filter(Boolean),
      ipDeny: ipDeny.split(',').map(s => s.trim()).filter(Boolean)
    };
    try {
      const resp = await apiFetch("/api/webhook-api-triggers/apis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || "Add failed");
      setApis(prev => [...prev, data.api]);
      setApiInput("");
      await loadAnalytics();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset) => {
    setGuardrailPreset(preset);
    if (preset === "conservative") {
      setRateLimit(30);
      setConcurrencyLimit(2);
      setCircuitBreakerEnabled(true);
    } else if (preset === "standard") {
      setRateLimit(60);
      setConcurrencyLimit(5);
      setCircuitBreakerEnabled(true);
    } else if (preset === "aggressive") {
      setRateLimit(200);
      setConcurrencyLimit(10);
      setCircuitBreakerEnabled(true);
    }
  };

  const handleApplyPresetAll = async () => {
    const preset = guardrailPreset;
    applyPreset(preset);
    const payloadFromPreset = () => {
      if (preset === "conservative") return { rateLimit: 30, concurrencyLimit: 2, circuitBreakerEnabled: true };
      if (preset === "aggressive") return { rateLimit: 200, concurrencyLimit: 10, circuitBreakerEnabled: true };
      return { rateLimit: 60, concurrencyLimit: 5, circuitBreakerEnabled: true };
    };
    const guardrails = payloadFromPreset();
    try {
      await Promise.all([
        ...webhooks.map(w => apiFetch(`/api/webhook-api-triggers/webhooks/${w.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guardrails })
        })),
        ...apis.map(a => apiFetch(`/api/webhook-api-triggers/apis/${a.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guardrails })
        })),
      ]);
      await loadData();
      await loadAnalytics();
    } catch (err) {
      setError("Bulk preset apply failed: " + err.message);
    }
  };

  const handleSelectWebhook = (entry) => {
    setSelectedWebhookId(entry.id);
    setSelectedWebhookRevision(entry.revision || null);
    setWebhookInput(entry.url || "");
    setEnv(entry.env || "dev");
    setVersionTag(entry.version || entry.versionTag || "v1");
    setApprovalRequired(!!entry.approvalRequired);
    setApproverEmail(entry.approverEmail || "");
    setRateLimit(entry.guardrails?.rateLimit ?? rateLimit);
    setConcurrencyLimit(entry.guardrails?.concurrencyLimit ?? concurrencyLimit);
    setCircuitBreakerEnabled(entry.guardrails?.circuitBreakerEnabled ?? true);
    setSchemaJson(entry.contract || schemaJson);
    setEnabled(entry.enabled !== false);
    setCanaryPercent(entry.canaryPercent || 0);
    setShadowMode(!!entry.shadowMode);
    setPerformanceBudgetMs(entry.performanceBudgetMs || 0);
    setIpAllow((entry.ipAllow || []).join(', '));
    setIpDeny((entry.ipDeny || []).join(', '));
    setValidationIssues([]);
    loadHistoryAndComments("webhook", entry.id);
  };

  const handleUpdateWebhook = async () => {
    if (!selectedWebhookId) return setError("Select a webhook to update");
    const issues = validate();
    const nextIssues = [...issues];
    if (!webhookInput) nextIssues.push("Webhook URL is required");
    if (nextIssues.length) { setValidationIssues(nextIssues); setError("Fix validation issues before updating webhook"); return; }
    setSaving(true);
    setError("");
    const payload = {
      url: webhookInput,
      env,
      versionTag,
      approvalRequired,
      approverEmail: approvalRequired ? approverEmail : null,
      guardrails: { rateLimit, concurrencyLimit, circuitBreakerEnabled },
      contract: schemaJson,
      enabled,
      canaryPercent,
      shadowMode,
      performanceBudgetMs: performanceBudgetMs || null,
      ipAllow: ipAllow.split(',').map(s => s.trim()).filter(Boolean),
      ipDeny: ipDeny.split(',').map(s => s.trim()).filter(Boolean)
    };
    try {
      const resp = await apiFetch(`/api/webhook-api-triggers/webhooks/${selectedWebhookId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(selectedWebhookRevision ? { "if-match-revision": String(selectedWebhookRevision) } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || "Update failed");
      setSelectedWebhookRevision(data.webhook?.revision || selectedWebhookRevision);
      await loadData();
      await loadAnalytics();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWebhook = async (id) => {
    if (!id) return;
    const confirmed = window.confirm("Delete this webhook? It will move to trash.");
    if (!confirmed) return;
    setSaving(true);
    setError("");
    try {
      const toDelete = webhooks.find(w => w.id === id) || null;
      const resp = await apiFetch(`/api/webhook-api-triggers/webhooks/${id}`, { method: "DELETE" });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || "Delete failed");
      if (selectedWebhookId === id) {
        setSelectedWebhookId(null);
        setSelectedWebhookRevision(null);
      }
      if (toDelete) setLastDeleted({ kind: "webhook", entry: toDelete });
      await loadData();
      await loadAnalytics();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectApi = (entry) => {
    setSelectedApiId(entry.id);
    setSelectedApiRevision(entry.revision || null);
    setApiInput(entry.endpoint || "");
    setEnv(entry.env || "dev");
    setVersionTag(entry.version || entry.versionTag || "v1");
    setApprovalRequired(!!entry.approvalRequired);
    setApproverEmail(entry.approverEmail || "");
    setRateLimit(entry.guardrails?.rateLimit ?? rateLimit);
    setConcurrencyLimit(entry.guardrails?.concurrencyLimit ?? concurrencyLimit);
    setCircuitBreakerEnabled(entry.guardrails?.circuitBreakerEnabled ?? true);
    setSchemaJson(entry.contract || schemaJson);
    setEnabled(entry.enabled !== false);
    setCanaryPercent(entry.canaryPercent || 0);
    setShadowMode(!!entry.shadowMode);
    setPerformanceBudgetMs(entry.performanceBudgetMs || 0);
    setIpAllow((entry.ipAllow || []).join(', '));
    setIpDeny((entry.ipDeny || []).join(', '));
    setValidationIssues([]);
    loadHistoryAndComments("api", entry.id);
  };

  const handleUpdateApi = async () => {
    if (!selectedApiId) return setError("Select an API trigger to update");
    const issues = validate();
    const nextIssues = [...issues];
    if (!apiInput) nextIssues.push("API endpoint is required");
    if (nextIssues.length) { setValidationIssues(nextIssues); setError("Fix validation issues before updating API"); return; }
    setSaving(true);
    setError("");
    const payload = {
      endpoint: apiInput,
      env,
      versionTag,
      approvalRequired,
      approverEmail: approvalRequired ? approverEmail : null,
      guardrails: { rateLimit, concurrencyLimit, circuitBreakerEnabled },
      contract: schemaJson,
      enabled,
      canaryPercent,
      shadowMode,
      performanceBudgetMs: performanceBudgetMs || null,
      ipAllow: ipAllow.split(',').map(s => s.trim()).filter(Boolean),
      ipDeny: ipDeny.split(',').map(s => s.trim()).filter(Boolean)
    };
    try {
      const resp = await apiFetch(`/api/webhook-api-triggers/apis/${selectedApiId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(selectedApiRevision ? { "if-match-revision": String(selectedApiRevision) } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || "Update failed");
      setSelectedApiRevision(data.api?.revision || selectedApiRevision);
      await loadData();
      await loadAnalytics();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteApi = async (id) => {
    if (!id) return;
    const toDelete = apis.find(a => a.id === id) || null;
    const confirmed = window.confirm("Delete this API trigger? It will move to trash.");
    if (!confirmed) return;
    setSaving(true);
    setError("");
    try {
      const resp = await apiFetch(`/api/webhook-api-triggers/apis/${id}`, { method: "DELETE" });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || "Delete failed");
      if (selectedApiId === id) {
        setSelectedApiId(null);
        setSelectedApiRevision(null);
      }
      if (toDelete) setLastDeleted({ kind: "api", entry: toDelete });
      await loadData();
      await loadAnalytics();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUndoDelete = async () => {
    if (!lastDeleted) return;
    const { kind, entry } = lastDeleted;
    setSaving(true);
    setError("");
    try {
      if (kind === "webhook") {
        const resp = await apiFetch(`/api/webhook-api-triggers/webhooks/${entry.id}/restore`, { method: "POST" });
        const data = await resp.json();
        if (!data.ok) throw new Error(data.error || "Undo failed");
      } else if (kind === "api") {
        const resp = await apiFetch(`/api/webhook-api-triggers/apis/${entry.id}/restore`, { method: "POST" });
        const data = await resp.json();
        if (!data.ok) throw new Error(data.error || "Undo failed");
      }
      setLastDeleted(null);
      await loadData();
      await loadAnalytics();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRotateSecret = async (kind, id) => {
    if (!id) return;
    try {
      const resp = await apiFetch(`/api/webhook-api-triggers/${kind === 'webhook' ? 'webhooks' : 'apis'}/${id}/rotate-secret`, { method: "POST" });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || "Rotate failed");
      setSignaturePreview({ kind, ...data.signature });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const loadHistoryAndComments = async (kind, id) => {
    try {
      const [hResp, cResp] = await Promise.all([
        apiFetch(`/api/webhook-api-triggers/${kind === 'webhook' ? 'webhooks' : 'apis'}/${id}/history`),
        apiFetch(`/api/webhook-api-triggers/${kind === 'webhook' ? 'webhooks' : 'apis'}/${id}/comments`),
      ]);
      const hData = await hResp.json();
      const cData = await cResp.json();
      if (hData.ok) setHistory(hData.history || []);
      if (cData.ok) setComments(cData.comments || []);
    } catch (_err) {
      /* ignore */
    }
  };

  const handleSimulate = async () => {
    try {
      const payload = JSON.parse(testPayload || "{}");
      const resp = await apiFetch("/api/webhook-api-triggers/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload, contract: schemaJson })
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || "Simulation failed");
      setSimulation(data.simulation);
      setRecentPayloads(prev => {
        const next = [testPayload, ...prev.filter(p => p !== testPayload)].slice(0, 5);
        return next;
      });
      setError("");
    } catch (err) {
      setError("Simulation failed: " + err.message);
      setSimulation(null);
    }
  };

  const handleFormatJson = (which) => {
    try {
      if (which === 'schema') {
        const formatted = JSON.stringify(JSON.parse(schemaJson || "{}"), null, 2);
        setSchemaJson(formatted);
      } else if (which === 'payload') {
        const formatted = JSON.stringify(JSON.parse(testPayload || "{}"), null, 2);
        setTestPayload(formatted);
      }
      setError("");
    } catch (err) {
      setError("Format failed: " + err.message);
    }
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await fetch("/api/webhook-api-triggers/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setFeedback("");
    } catch (err) {
      setError("Failed to send feedback");
    }
  };

  const handleAddComment = async () => {
    if (!newComment) return;
    const kind = selectedWebhookId ? 'webhook' : (selectedApiId ? 'api' : null);
    const id = selectedWebhookId || selectedApiId;
    if (!kind || !id) return setError("Select a webhook or API to comment on");
    try {
      const resp = await apiFetch(`/api/webhook-api-triggers/${kind === 'webhook' ? 'webhooks' : 'apis'}/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: newComment })
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || "Comment failed");
      setNewComment("");
      await loadHistoryAndComments(kind, id);
    } catch (err) {
      setError(err.message);
    }
  };

  // Main UI
  return (
    <div style={{ padding: 24, background: '#0a0b0f', color: '#f6f7fb', borderRadius: 16, border: '1px solid #283044', boxShadow: '0 12px 48px #0007' }}>
      <BackButton />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18, color: '#a5f3fc' }}>Webhook & API Triggers</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={env} onChange={e => setEnv(e.target.value)} style={{ background: '#1f2433', color: '#f6f7fb', border: '1px solid #283044', borderRadius: 10, padding: '8px 12px', fontWeight: 700 }}>
            <option value="dev">Dev</option><option value="stage">Stage</option><option value="prod">Prod</option>
          </select>
          <input value={versionTag} onChange={e => setVersionTag(e.target.value)} placeholder="Version tag" style={{ background: '#1f2433', color: '#f6f7fb', border: '1px solid #283044', borderRadius: 10, padding: '8px 12px', minWidth: 120 }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1f2433', border: '1px solid #283044', borderRadius: 10, padding: '6px 10px', fontWeight: 700 }}>
            <input type="checkbox" checked={approvalRequired} onChange={e => setApprovalRequired(e.target.checked)} />Approvals
          </label>
          <input value={approverEmail} onChange={e => setApproverEmail(e.target.value)} placeholder="Approver email" style={{ background: '#1f2433', color: '#f6f7fb', border: '1px solid #283044', borderRadius: 10, padding: '8px 12px', minWidth: 180 }} />
        </div>
      </div>

      <button onClick={() => setShowOnboarding(v => !v)} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
      {showOnboarding && onboardingContent}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#1f2433', borderRadius: 12, padding: 14, border: '1px solid #283044' }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: '#f6f7fb' }}>Webhook Config</div>
          <input value={webhookInput} onChange={e => setWebhookInput(e.target.value)} placeholder="Webhook URL" style={{ width: '100%', fontSize: 15, padding: 10, borderRadius: 10, border: '1px solid #283044', background: '#1f2433', color: '#f6f7fb', marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={handleAddWebhook} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Saving…' : 'Add Webhook'}</button>
            <button onClick={handleUpdateWebhook} style={{ background: '#f59e0b', color: '#1f2433', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: 'pointer' }}>Update Selected</button>
            {selectedWebhookId && <span style={{ color: '#e9ebf5', fontSize: 13 }}>Editing ID {selectedWebhookId.slice(0, 8)}… · rev {selectedWebhookRevision ?? '—'}</span>}
          </div>
        </div>
        <div style={{ background: '#1f2433', borderRadius: 12, padding: 14, border: '1px solid #283044' }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: '#f6f7fb' }}>API Trigger</div>
          <input value={apiInput} onChange={e => setApiInput(e.target.value)} placeholder="API endpoint" style={{ width: '100%', fontSize: 15, padding: 10, borderRadius: 10, border: '1px solid #283044', background: '#1f2433', color: '#f6f7fb', marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={handleAddApi} style={{ background: '#22c55e', color: '#1f2433', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: 'pointer' }}>{saving ? 'Saving…' : 'Add API'}</button>
            <button onClick={handleUpdateApi} style={{ background: '#4f46e5', color: '#f6f7fb', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: 'pointer' }}>Update Selected</button>
            {selectedApiId && <span style={{ color: '#e9ebf5', fontSize: 13 }}>Editing ID {selectedApiId.slice(0, 8)}… · rev {selectedApiRevision ?? '—'}</span>}
          </div>
        </div>
        <div style={{ background: '#1f2433', borderRadius: 12, padding: 14, border: '1px solid #283044' }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: '#f6f7fb' }}>Guardrails</div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#e9ebf5', fontSize: 14, marginBottom: 6 }}>
            Preset
            <select value={guardrailPreset} onChange={e => applyPreset(e.target.value)} style={{ background: '#1f2433', color: '#f6f7fb', border: '1px solid #283044', borderRadius: 10, padding: 8 }}>
              <option value="conservative">Conservative</option>
              <option value="standard">Standard</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#e9ebf5', fontSize: 14 }}>
            Rate limit (req/min)
            <input type="number" value={rateLimit} onChange={e => setRateLimit(Number(e.target.value))} style={{ background: '#1f2433', color: '#f6f7fb', border: '1px solid #283044', borderRadius: 10, padding: 8 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#e9ebf5', fontSize: 14, marginTop: 8 }}>
            Concurrency limit
            <input type="number" value={concurrencyLimit} onChange={e => setConcurrencyLimit(Number(e.target.value))} style={{ background: '#1f2433', color: '#f6f7fb', border: '1px solid #283044', borderRadius: 10, padding: 8 }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, color: '#e9ebf5' }}>
            <input type="checkbox" checked={circuitBreakerEnabled} onChange={e => setCircuitBreakerEnabled(e.target.checked)} />Circuit breaker enabled
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, color: '#e9ebf5' }}>
            <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />Enabled
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#e9ebf5', fontSize: 14, marginTop: 8 }}>
            Canary rollout (% of traffic)
            <input type="number" value={canaryPercent} onChange={e => setCanaryPercent(Number(e.target.value))} min={0} max={100} style={{ background: '#1f2433', color: '#f6f7fb', border: '1px solid #283044', borderRadius: 10, padding: 8 }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, color: '#e9ebf5' }}>
            <input type="checkbox" checked={shadowMode} onChange={e => setShadowMode(e.target.checked)} />Shadow mode (observe only)
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#e9ebf5', fontSize: 14, marginTop: 8 }}>
            Performance budget (ms)
            <input type="number" value={performanceBudgetMs} onChange={e => setPerformanceBudgetMs(Number(e.target.value))} placeholder="e.g., 500" style={{ background: '#1f2433', color: '#f6f7fb', border: '1px solid #283044', borderRadius: 10, padding: 8 }} />
          </label>
          <button onClick={handleApplyPresetAll} style={{ marginTop: 10, background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>Apply preset to all</button>
        </div>
        <div style={{ background: '#1f2433', borderRadius: 12, padding: 14, border: '1px solid #283044' }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: '#f6f7fb' }}>Access & Security</div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#e9ebf5', fontSize: 14 }}>
            IP allow list (comma-separated)
            <textarea value={ipAllow} onChange={e => setIpAllow(e.target.value)} rows={2} style={{ background: '#1f2433', color: '#f6f7fb', border: '1px solid #283044', borderRadius: 10, padding: 8 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#e9ebf5', fontSize: 14, marginTop: 8 }}>
            IP deny list (comma-separated)
            <textarea value={ipDeny} onChange={e => setIpDeny(e.target.value)} rows={2} style={{ background: '#1f2433', color: '#f6f7fb', border: '1px solid #283044', borderRadius: 10, padding: 8 }} />
          </label>
          { (selectedWebhookId || selectedApiId) && (
            <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => handleRotateSecret(selectedWebhookId ? 'webhook' : 'api', selectedWebhookId || selectedApiId)} style={{ background: '#14b8a6', color: '#1f2433', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: 'pointer' }}>Rotate Secret</button>
              {signaturePreview && <span style={{ color: '#e9ebf5', fontSize: 13 }}>New secret ({signaturePreview.method}): {signaturePreview.secret}</span>}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
        <div style={{ background: '#1f2433', border: '1px solid #283044', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, color: '#f6f7fb', marginBottom: 6 }}>Data Contract</div>
          <textarea value={schemaJson} onChange={e => setSchemaJson(e.target.value)} rows={6} style={{ width: '100%', background: '#1f2433', color: '#f6f7fb', border: '1px solid #283044', borderRadius: 10, padding: 10 }} />
          <button onClick={() => handleFormatJson('schema')} style={{ marginTop: 8, background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>Format JSON</button>
        </div>
        <div style={{ background: '#1f2433', border: '1px solid #283044', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, color: '#f6f7fb', marginBottom: 6 }}>Simulation</div>
          <textarea value={testPayload} onChange={e => setTestPayload(e.target.value)} rows={5} style={{ width: '100%', background: '#1f2433', color: '#f6f7fb', border: '1px solid #283044', borderRadius: 10, padding: 10 }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            <button onClick={handleSimulate} style={{ background: '#22c55e', color: '#1f2433', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: 'pointer' }}>Run Simulation</button>
            <button onClick={() => handleFormatJson('payload')} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>Format JSON</button>
            {recentPayloads.map((p, idx) => (
              <button key={idx} onClick={() => setTestPayload(p)} style={{ background: '#283044', color: '#e9ebf5', border: '1px solid #4b5780', borderRadius: 10, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>Load recent #{idx + 1}</button>
            ))}
          </div>
          {simulation && (
            <div style={{ marginTop: 6, color: '#a5f3fc' }}>
              <div>Env: {simulation.env} · Version: {simulation.version}</div>
              <div>Planned actions: {simulation.actions.join(', ')}</div>
              {simulation.warnings?.length ? <div style={{ color: '#fbbf24' }}>Warnings: {simulation.warnings.join(', ')}</div> : null}
            </div>
          )}
        </div>
        <div style={{ background: '#1f2433', border: '1px solid #283044', borderRadius: 12, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ fontWeight: 700, color: '#f6f7fb' }}>Validation & Preflight</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {preflightStatus && (
                <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, border: '1px solid #283044', background: preflightStatus.ok ? '#1f2433' : '#283044', color: preflightStatus.ok ? '#22c55e' : preflightStatus.issues ? '#fcd34d' : '#f87171', fontWeight: 800, fontSize: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: preflightStatus.ok ? '#22c55e' : preflightStatus.issues ? '#f59e0b' : '#ef4444' }} />
                  <span>{preflightStatus.ok ? 'Preflight pass' : preflightStatus.issues ? `${preflightStatus.issues} issues` : 'Preflight failed'}</span>
                  {preflightStatus.ts ? <span style={{ color: '#b8bed2', fontWeight: 600 }}>· {new Date(preflightStatus.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> : null}
                  <button onClick={() => setShowPreflightPopover(v => !v)} style={{ background: 'transparent', border: 'none', color: '#f6f7fb', cursor: 'pointer', fontWeight: 800 }}>Trace</button>
                  <button onClick={clearPreflightStatus} style={{ marginLeft: 2, background: 'transparent', border: 'none', color: '#b8bed2', cursor: 'pointer', fontWeight: 800 }}>Clear</button>
                  <button onClick={downloadPreflightReport} style={{ background: 'transparent', border: 'none', color: '#67e8f9', cursor: 'pointer', fontWeight: 800 }}>Save</button>
                  {showPreflightPopover && (
                    <div style={{ position: 'absolute', top: '110%', right: 0, minWidth: 220, background: '#1f2433', border: '1px solid #283044', borderRadius: 10, padding: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', zIndex: 10 }}>
                      <div style={{ fontWeight: 800, color: '#fcd34d', marginBottom: 6 }}>Preflight issues</div>
                      <div style={{ color: '#b8bed2', fontSize: 12, marginBottom: 6 }}>Why this matters: keeps webhook/API rollouts safe for Shopify traffic.</div>
                      {preflightIssues.length === 0 ? <div style={{ color: '#22c55e' }}>Clear</div> : (
                        <ul style={{ margin: 0, paddingLeft: 16, color: '#f6f7fb', maxHeight: 160, overflow: 'auto' }}>
                          {preflightIssues.slice(0, 6).map((p, i) => <li key={i}>{p}</li>)}
                          {preflightIssues.length > 6 && <li style={{ color: '#b8bed2' }}>…{preflightIssues.length - 6} more</li>}
                        </ul>
                      )}
                      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => applyQuickFix('approver')} style={{ background: '#0ea5e9', color: '#1f2433', border: 'none', borderRadius: 8, padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}>Add approver</button>
                        <button onClick={() => applyQuickFix('prod-note')} style={{ background: '#f59e0b', color: '#1f2433', border: 'none', borderRadius: 8, padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}>Hardening defaults</button>
                        <button onClick={() => applyQuickFix('trigger-action')} style={{ background: '#22c55e', color: '#1f2433', border: 'none', borderRadius: 8, padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}>Schema + payload</button>
                        <button onClick={() => applyQuickFix('dedupe-labels')} style={{ background: '#4f46e5', color: '#f6f7fb', border: 'none', borderRadius: 8, padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}>Clean IPs</button>
                      </div>
                      {preflightTrace.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ color: '#67e8f9', fontWeight: 700 }}>Trace</div>
                          <ul style={{ margin: 0, paddingLeft: 16, color: '#f6f7fb', maxHeight: 140, overflow: 'auto' }}>
                            {preflightTrace.slice(0, 5).map((t, i) => (
                              <li key={i}>{t.label}: {t.issues?.join('; ')}</li>
                            ))}
                            {preflightTrace.length > 5 && <li style={{ color: '#b8bed2' }}>…{preflightTrace.length - 5} more</li>}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </span>
              )}
              <button onClick={runPreflight} style={{ background: '#283044', color: '#fcd34d', border: '1px solid #4b5780', borderRadius: 10, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}>Run Preflight</button>
              <button onClick={runDryRun} style={{ background: '#22c55e', color: '#1f2433', border: 'none', borderRadius: 10, padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}>Dry-run (dev)</button>
              <button onClick={rollbackToLastRun} disabled={!lastRunSnapshot} style={{ background: '#1f2433', color: '#f6f7fb', border: '1px solid #283044', borderRadius: 10, padding: '6px 10px', fontWeight: 800, cursor: lastRunSnapshot ? 'pointer' : 'not-allowed', opacity: lastRunSnapshot ? 1 : 0.5 }}>Rollback to last run</button>
            </div>
          </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <input value={reviewerEmail} onChange={e => setReviewerEmail(e.target.value)} placeholder="Reviewer email" style={{ background: '#1f2433', color: '#f6f7fb', border: '1px solid #283044', borderRadius: 10, padding: '6px 10px', minWidth: 200 }} />
              <button onClick={attachPreflightForReviewer} style={{ background: '#8b5cf6', color: '#1f2433', border: 'none', borderRadius: 10, padding: '8px 12px', fontWeight: 800, cursor: 'pointer' }}>Attach preflight</button>
              <span style={{ background: '#1f2433', border: '1px solid #283044', borderRadius: 999, padding: '6px 10px', color: (!enabled) ? '#f97316' : '#22c55e', fontWeight: 700 }}>Disabled: {!enabled ? 'Yes' : 'No'}</span>
              <span style={{ background: '#1f2433', border: '1px solid #283044', borderRadius: 999, padding: '6px 10px', color: (rateLimit > 150 || concurrencyLimit > 8 || (performanceBudgetMs && performanceBudgetMs > 800)) ? '#f97316' : '#22c55e', fontWeight: 700 }}>Perf guardrail: {(rateLimit > 150 || concurrencyLimit > 8 || (performanceBudgetMs && performanceBudgetMs > 800)) ? 'tighten' : 'OK'}</span>
            </div>
          {validationIssues.length === 0 ? <div style={{ color: '#22c55e' }}>No blocking issues.</div> : (
            <ul style={{ margin: 0, paddingLeft: 18, color: '#fca5a5' }}>{validationIssues.map((v, i) => <li key={i}>{v}</li>)}</ul>
          )}
          {schemaWarnings.length ? (
            <div style={{ marginTop: 8, color: '#fbbf24' }}>Schema warnings: {schemaWarnings.join(', ')}</div>
          ) : null}
          {preflightIssues.length > 0 && (
            <div style={{ marginTop: 10, background: '#1f2433', border: '1px solid #283044', borderRadius: 10, padding: 10 }}>
              <div style={{ color: '#fcd34d', fontWeight: 800 }}>Preflight Issues</div>
              <ul style={{ margin: 6, paddingLeft: 18, color: '#f6f7fb' }}>
                {preflightIssues.map((issue, idx) => <li key={idx}>{issue}</li>)}
              </ul>
            </div>
          )}
          {preflightTrace.length > 0 && (
            <div style={{ marginTop: 10, background: '#1f2433', border: '1px solid #283044', borderRadius: 10, padding: 10 }}>
              <div style={{ color: '#a5f3fc', fontWeight: 800 }}>Preflight Trace</div>
              <ul style={{ margin: 6, paddingLeft: 12, color: '#f6f7fb', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {preflightTrace.map((item, idx) => {
                  const color = item.status === 'pass' ? '#22c55e' : item.status === 'warn' ? '#f59e0b' : '#f87171';
                  const symbol = item.status === 'pass' ? '' : item.status === 'warn' ? '!' : '';
                  return (
                    <li key={idx} style={{ listStyle: 'none', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', background: color }}>{symbol}</span>
                      <span>{item.detail}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <input type="file" accept="application/json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
        <button onClick={() => fileInputRef.current.click()} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginRight: 12 }}>Import Webhooks</button>
        <button onClick={handleExport} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Export Webhooks</button>
        {imported && <span style={{ marginLeft: 12, color: '#4f46e5' }}>Imported: {imported}</span>}
        {exported && <a href={exported} download="webhooks.json" style={{ marginLeft: 12, color: '#22c55e', textDecoration: 'underline' }}>Download Export</a>}
      </div>

      <div style={{ marginBottom: 20, background: '#1f2433', border: '1px solid #283044', borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#f6f7fb' }}>Webhooks</div>
        <div style={{ fontSize: 15, color: '#e9ebf5' }}>
          {loading ? <span>Loading…</span> : webhooks.length ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {webhooks.map(w => (
                <div key={w.id} style={{ padding: 12, borderRadius: 10, border: '1px solid #283044', background: '#1f2433' }}>
                  <div style={{ fontWeight: 700, color: '#f6f7fb' }}>{w.url || 'Webhook'} <span style={{ color: '#b8bed2', fontWeight: 500 }}>· {w.env}/{w.version} · {w.status} · rev {w.revision}</span></div>
                  <div style={{ color: '#e9ebf5', fontSize: 14 }}>Enabled: {w.enabled === false ? 'No' : 'Yes'} · Guardrails: rate {w.guardrails?.rateLimit ?? '—'} req/min, concurrency {w.guardrails?.concurrencyLimit ?? '—'}, circuit breaker {w.guardrails?.circuitBreakerEnabled ? 'on' : 'off'}</div>
                  <div style={{ color: '#b8bed2', fontSize: 13 }}>Canary: {w.canaryPercent ?? 0}% · Shadow: {w.shadowMode ? 'on' : 'off'} · Perf budget: {w.performanceBudgetMs || '—'}ms</div>
                  <div style={{ color: '#b8bed2', fontSize: 13 }}>IP allow: {(w.ipAllow || []).join(', ') || '—'} · IP deny: {(w.ipDeny || []).join(', ') || '—'}</div>
                  <div style={{ color: '#b8bed2', fontSize: 13 }}>Last success: {w.lastSuccessAt || '—'} · Last failure: {w.lastFailureAt || '—'}</div>
                  {w.warnings?.length ? (
                    <div style={{ color: '#fbbf24', fontSize: 14 }}>
                      <span style={{ background: '#f59e0b22', border: '1px solid #f59e0b55', borderRadius: 8, padding: '2px 8px', marginRight: 6 }}>At risk</span>
                      Warnings: {w.warnings.join(', ')}
                    </div>
                  ) : null}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => handleSelectWebhook(w)} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleRotateSecret('webhook', w.id)} style={{ background: '#14b8a6', color: '#1f2433', border: 'none', borderRadius: 10, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>Rotate Secret</button>
                    <button onClick={() => apiFetch(`/api/webhook-api-triggers/webhooks/${w.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !(w.enabled === false) }) }).then(loadData)} style={{ background: '#283044', color: '#e9ebf5', border: '1px solid #4b5780', borderRadius: 10, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>{w.enabled === false ? 'Enable' : 'Disable'}</button>
                    <button onClick={() => handleDeleteWebhook(w.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span>No webhooks yet. Add or import to see results.</span>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 20, background: '#1f2433', border: '1px solid #283044', borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#f6f7fb' }}>APIs</div>
        <div style={{ fontSize: 15, color: '#e9ebf5' }}>
          {loading ? <span>Loading…</span> : apis.length ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {apis.map(a => (
                <div key={a.id} style={{ padding: 12, borderRadius: 10, border: '1px solid #283044', background: '#1f2433' }}>
                  <div style={{ fontWeight: 700, color: '#f6f7fb' }}>{a.endpoint || 'API'} <span style={{ color: '#b8bed2', fontWeight: 500 }}>· {a.env}/{a.version} · {a.status} · rev {a.revision}</span></div>
                  <div style={{ color: '#e9ebf5', fontSize: 14 }}>Enabled: {a.enabled === false ? 'No' : 'Yes'} · Guardrails: rate {a.guardrails?.rateLimit ?? '—'} req/min, concurrency {a.guardrails?.concurrencyLimit ?? '—'}, circuit breaker {a.guardrails?.circuitBreakerEnabled ? 'on' : 'off'}</div>
                  <div style={{ color: '#b8bed2', fontSize: 13 }}>Canary: {a.canaryPercent ?? 0}% · Shadow: {a.shadowMode ? 'on' : 'off'} · Perf budget: {a.performanceBudgetMs || '—'}ms</div>
                  <div style={{ color: '#b8bed2', fontSize: 13 }}>IP allow: {(a.ipAllow || []).join(', ') || '—'} · IP deny: {(a.ipDeny || []).join(', ') || '—'}</div>
                  <div style={{ color: '#b8bed2', fontSize: 13 }}>Last success: {a.lastSuccessAt || '—'} · Last failure: {a.lastFailureAt || '—'}</div>
                  {a.warnings?.length ? (
                    <div style={{ color: '#fbbf24', fontSize: 14 }}>
                      <span style={{ background: '#f59e0b22', border: '1px solid #f59e0b55', borderRadius: 8, padding: '2px 8px', marginRight: 6 }}>At risk</span>
                      Warnings: {a.warnings.join(', ')}
                    </div>
                  ) : null}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => handleSelectApi(a)} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleRotateSecret('api', a.id)} style={{ background: '#14b8a6', color: '#1f2433', border: 'none', borderRadius: 10, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>Rotate Secret</button>
                    <button onClick={() => apiFetch(`/api/webhook-api-triggers/apis/${a.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !(a.enabled === false) }) }).then(loadData)} style={{ background: '#283044', color: '#e9ebf5', border: '1px solid #4b5780', borderRadius: 10, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>{a.enabled === false ? 'Enable' : 'Disable'}</button>
                    <button onClick={() => handleDeleteApi(a.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span>No APIs yet. Add or import to see results.</span>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 24, background: '#1f2433', border: '1px solid #283044', borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#f6f7fb' }}>Analytics</div>
        <div style={{ fontSize: 15, color: '#e9ebf5' }}>
          {analyticsLoading ? <span>Loading analytics…</span> : analytics.length ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 10 }}>
                {Object.entries(analyticsSummary).map(([k, v]) => (
                  <div key={k} style={{ background: '#1f2433', border: '1px solid #283044', borderRadius: 10, padding: 8 }}>
                    <div style={{ color: '#a5f3fc', fontWeight: 700 }}>{k}</div>
                    <div style={{ color: '#f6f7fb', fontSize: 22 }}>{v}</div>
                  </div>
                ))}
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(analytics, null, 2)}</pre>
            </>
          ) : (
            <span>No analytics yet. Add or import configs to see results.</span>
          )}
        </div>
      </div>

      {(selectedWebhookId || selectedApiId) && (
        <div style={{ marginBottom: 20, background: '#1f2433', border: '1px solid #283044', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#f6f7fb' }}>Revision history & comments</div>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <div>
              <div style={{ color: '#e9ebf5', marginBottom: 6, fontWeight: 600 }}>History</div>
              {history.length ? (
                <ul style={{ margin: 0, paddingLeft: 16, color: '#e9ebf5' }}>
                  {history.slice().reverse().slice(0, 8).map((h, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>
                      rev {h.revision}: {h.changes || 'update'} · {new Date(h.ts).toLocaleString()}
                    </li>
                  ))}
                </ul>
              ) : <div style={{ color: '#b8bed2' }}>No history yet.</div>}
            </div>
            <div>
              <div style={{ color: '#e9ebf5', marginBottom: 6, fontWeight: 600 }}>Comments</div>
              {comments.length ? (
                <ul style={{ margin: 0, paddingLeft: 16, color: '#e9ebf5' }}>
                  {comments.slice().reverse().slice(0, 8).map(c => (
                    <li key={c.id} style={{ marginBottom: 4 }}>
                      {c.comment} · {new Date(c.ts).toLocaleString()}
                    </li>
                  ))}
                </ul>
              ) : <div style={{ color: '#b8bed2' }}>No comments yet.</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add comment" style={{ flex: 1, minWidth: 200, background: '#1f2433', color: '#f6f7fb', border: '1px solid #283044', borderRadius: 10, padding: '8px 12px' }} />
                <button onClick={handleAddComment} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>Comment</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20, background: '#1f2433', border: '1px solid #283044', borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#f6f7fb' }}>Trash</div>
        <div style={{ display: 'grid', gap: 10 }}>
          {(trash.webhooks?.length ? trash.webhooks : []).map(t => (
            <div key={t.id} style={{ border: '1px dashed #4b5780', borderRadius: 10, padding: 10, color: '#e9ebf5' }}>
              <div>{t.url || 'Webhook'} · rev {t.revision} · deleted {t.deletedAt}</div>
              <button onClick={() => apiFetch(`/api/webhook-api-triggers/webhooks/${t.id}/restore`, { method: 'POST' }).then(loadData)} style={{ marginTop: 6, background: '#22c55e', color: '#1f2433', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>Restore</button>
            </div>
          ))}
          {(trash.apis?.length ? trash.apis : []).map(t => (
            <div key={t.id} style={{ border: '1px dashed #4b5780', borderRadius: 10, padding: 10, color: '#e9ebf5' }}>
              <div>{t.endpoint || 'API'} · rev {t.revision} · deleted {t.deletedAt}</div>
              <button onClick={() => apiFetch(`/api/webhook-api-triggers/apis/${t.id}/restore`, { method: 'POST' }).then(loadData)} style={{ marginTop: 6, background: '#22c55e', color: '#1f2433', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>Restore</button>
            </div>
          ))}
          {!trash.webhooks?.length && !trash.apis?.length && <div style={{ color: '#b8bed2' }}>Trash is empty.</div>}
        </div>
      </div>

      {lastDeleted && (
        <div style={{ marginBottom: 16, background: '#1f2433', border: '1px solid #283044', borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ color: '#fbbf24', fontWeight: 700 }}>Deleted a {lastDeleted.kind}. Undo?</div>
          <button onClick={handleUndoDelete} style={{ background: '#22c55e', color: '#1f2433', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: 'pointer' }}>Undo Delete</button>
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); validate(); handleFeedback(); }} style={{ marginTop: 12, background: '#1f2433', borderRadius: 12, padding: 20, border: '1px solid #283044' }} aria-label="Send feedback">
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: '#f6f7fb' }}>Feedback</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={3}
          style={{ width: '100%', fontSize: 16, padding: 12, borderRadius: 10, border: '1px solid #283044', marginBottom: 12, background: '#1f2433', color: '#f6f7fb' }}
          placeholder="Share your feedback or suggestions..."
          aria-label="Feedback"
        />
        <button type="submit" style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, padding: '7px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Send Feedback</button>
        {error && <div style={{ color: '#ef4444', marginTop: 8 }}>{error}</div>}
      </form>
      <div style={{ marginTop: 16, fontSize: 13, color: '#b8bed2', textAlign: 'center' }}>
        <span>Accessibility: WCAG 2.1, keyboard navigation, color contrast. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>Contact Support</a></span>
      </div>
    </div>
  );
}


