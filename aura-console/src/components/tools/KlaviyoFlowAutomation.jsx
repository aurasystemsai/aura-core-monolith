
import React, { useState, useRef, useEffect } from "react";

function VisualFlowBuilder({ flow, setFlow, nodes = [], setNodes, onMoveNode, onAddWebhook, webhookUrl, setWebhookUrl, onUndo, onRedo, canUndo, canRedo }) {
  return (
    <div style={{ border: "1px solid #d1d5db", borderRadius: 10, padding: 18, background: "#f9fafb", marginBottom: 18 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Visual Flow Builder (Drag & Drop)</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <button onClick={() => setNodes([...nodes, { id: Date.now(), label: 'Step', type: 'step' }])} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Add Step</button>
        <button onClick={() => setNodes([...nodes, { id: Date.now(), label: 'Trigger', type: 'trigger' }])} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Add Trigger</button>
        <button onClick={() => setNodes([...nodes, { id: Date.now(), label: 'Action', type: 'action' }])} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Add Action</button>
        <button onClick={() => onAddWebhook?.()} style={{ background: '#f97316', color: '#0f172a', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Add Webhook Trigger</button>
        <div style={{ display: 'flex', gap: 6, flex: 1, minWidth: 220 }}>
          <input aria-label="Webhook URL" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="Webhook URL" style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onUndo} disabled={!canUndo} style={{ background: '#334155', color: '#e0e7ff', border: 'none', borderRadius: 8, padding: '7px 12px', fontWeight: 700, cursor: canUndo ? 'pointer' : 'not-allowed', opacity: canUndo ? 1 : 0.5 }}>Undo</button>
          <button onClick={onRedo} disabled={!canRedo} style={{ background: '#334155', color: '#e0e7ff', border: 'none', borderRadius: 8, padding: '7px 12px', fontWeight: 700, cursor: canRedo ? 'pointer' : 'not-allowed', opacity: canRedo ? 1 : 0.5 }}>Redo</button>
        </div>
      </div>
      <div style={{ minHeight: 120, border: '1px dashed #bbb', borderRadius: 8, padding: 12, background: '#232336', marginBottom: 12, color: '#e5e7eb' }}>
        {nodes.length ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {nodes.map((n, i) => (
              <li key={n.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, color: n.type === 'step' ? '#0ea5e9' : n.type === 'trigger' ? '#22c55e' : '#6366f1' }}>{n.label}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button aria-label="Move up" onClick={() => onMoveNode?.(i, -1)} disabled={i === 0} style={{ background: '#1e293b', color: '#e0e7ff', border: 'none', borderRadius: 6, padding: '2px 8px', fontWeight: 600, fontSize: 12, cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.5 : 1 }}>↑</button>
                  <button aria-label="Move down" onClick={() => onMoveNode?.(i, 1)} disabled={i === nodes.length - 1} style={{ background: '#1e293b', color: '#e0e7ff', border: 'none', borderRadius: 6, padding: '2px 8px', fontWeight: 600, fontSize: 12, cursor: i === nodes.length - 1 ? 'not-allowed' : 'pointer', opacity: i === nodes.length - 1 ? 0.5 : 1 }}>↓</button>
                  <button onClick={() => setNodes(nodes.filter((_, idx) => idx !== i))} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 10px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <span style={{ color: '#64748b' }}>Drag and drop steps, triggers, and actions here.</span>
        )}
      </div>
      <textarea
        value={flow}
        onChange={e => setFlow(e.target.value)}
        rows={4}
        style={{ width: "100%", fontSize: 15, borderRadius: 6, border: "1px solid #ccc", padding: 8 }}
        placeholder="Describe or edit your flow here..."
      />
    </div>
  );
}

export default function KlaviyoFlowAutomation() {
  const [flow, setFlow] = useState("");
  const [nodes, setNodes] = useState([]);
  const [channels, setChannels] = useState(["email", "sms"]);
  const [segments, setSegments] = useState([]);
  const [segmentName, setSegmentName] = useState("");
  const [segmentRules, setSegmentRules] = useState("");
  const [attachedSegments, setAttachedSegments] = useState([]);
  const [variants, setVariants] = useState([{ id: "control", weight: 100 }]);
  const [flows, setFlows] = useState([]);
  const [selectedFlowId, setSelectedFlowId] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [testRunResult, setTestRunResult] = useState(null);
  const [flowHealth, setFlowHealth] = useState(null);
  const [flowReport, setFlowReport] = useState(null);
  const [flowVersions, setFlowVersions] = useState([]);
  const [flowDependencies, setFlowDependencies] = useState([]);
  const [journeys, setJourneys] = useState([]);
  const [optimization, setOptimization] = useState(null);
  const [widgets, setWidgets] = useState(null);
  const [complianceScan, setComplianceScan] = useState(null);
  const [customNodesList, setCustomNodesList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [orchestrationResult, setOrchestrationResult] = useState(null);
  const [templateQuery, setTemplateQuery] = useState("");
  const [flowHistory, setFlowHistory] = useState([]);
  const [flowFuture, setFlowFuture] = useState([]);
  const [nodeHistory, setNodeHistory] = useState([]);
  const [nodeFuture, setNodeFuture] = useState([]);
  const [selectedFlowIds, setSelectedFlowIds] = useState([]);
  const [bulkActionResult, setBulkActionResult] = useState("");
  const [versionDiff, setVersionDiff] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [permissions, setPermissions] = useState({ You: "owner" });
  const [presence, setPresence] = useState([]);
  const [approvalQueue, setApprovalQueue] = useState([]);
  const [traceLog, setTraceLog] = useState([]);
  const [regressionTests, setRegressionTests] = useState([{ name: 'Smoke', expected: '200', input: 'sample user' }]);
  const [regressionResult, setRegressionResult] = useState(null);
  const [customMetrics, setCustomMetrics] = useState([{ name: 'uplift', target: 5 }]);
  const [locale, setLocale] = useState('en');
  const [offlineMode, setOfflineMode] = useState(false);
  const [predictive, setPredictive] = useState(null);
  const [contentVariants, setContentVariants] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [dynamicContent, setDynamicContent] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [comment, setComment] = useState("");
  const [versionLabel, setVersionLabel] = useState("v1");
  const [shareLink, setShareLink] = useState("");
  const [compliance, setCompliance] = useState({ HIPAA: false, TCPA: true, CCPA: true });
  const [connectorsState, setConnectorsState] = useState({});
  const [integrationForm, setIntegrationForm] = useState({
    segmentWriteKey: '',
    salesforceToken: '',
    salesforceInstance: '',
    hubspotToken: '',
    zapierHook: '',
    snowflakeAccount: '',
    snowflakeUser: '',
    snowflakeWarehouse: '',
    snowflakeDatabase: '',
    snowflakeSchema: '',
    snowflakeRole: '',
    bqProject: '',
    bqDataset: '',
    slackToken: 'xoxb-***',
    slackChannel: '#automation-alerts',
    twilioAccountSid: 'ACxxxxxxxx',
    twilioAuthToken: '********',
    twilioFrom: '+15555550123',
    whatsappNumber: '+15555550123',
    pushApiKey: 'onesignal-***',
  });
  const [cohorts, setCohorts] = useState([]);
  const [attribution, setAttribution] = useState([]);
  const [experimentResults, setExperimentResults] = useState([]);
  const [consentUser, setConsentUser] = useState('user-1');
  const [consentValue, setConsentValue] = useState('granted');
  const [ingestSource, setIngestSource] = useState('email');
  const [ingestRevenue, setIngestRevenue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [collaborators, setCollaborators] = useState(["You"]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [runHistory, setRunHistory] = useState([]);
  const [errorDetails, setErrorDetails] = useState(null);
  const templates = [
    {
      name: "Abandoned Cart Rescue",
      desc: "Trigger 1h after cart, branch by value, SMS + email reminder",
      flow: "Trigger: Cart Abandoned -> Condition: Cart Value > $100 -> Action: Email + SMS reminder -> Wait 24h -> If purchased, stop; else send incentive"
    },
    {
      name: "Welcome Series",
      desc: "Multi-step onboarding with product education",
      flow: "Trigger: New Subscriber -> Action: Welcome Email -> Wait 1d -> Action: Product Education -> Wait 2d -> Action: Social Proof"
    },
    {
      name: "VIP Re‑engagement",
      desc: "High LTV segment win-back with tiered offers",
      flow: "Trigger: VIP Segment Lapsing -> Action: Personalized Offer -> Wait 3d -> Action: Concierge Email -> Wait 7d -> Action: Survey + Incentive"
    }
  ];
  const fileInputRef = useRef();

  const api = async (path, opts = {}) => {
    const res = await fetch(`/api/klaviyo-flow-automation${path}`, {
      headers: { "Content-Type": "application/json" },
      ...opts,
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || res.statusText);
    return data;
  };

  const updateFlowValue = (next) => {
    setFlowHistory(prev => [...prev.slice(-19), flow]);
    setFlow(next);
    setFlowFuture([]);
  };

  const updateNodesValue = (updater) => {
    setNodeHistory(prev => [...prev.slice(-19), nodes]);
    const next = typeof updater === 'function' ? updater(nodes) : updater;
    setNodes(next);
    setNodeFuture([]);
  };

  const handleUndo = () => {
    if (nodeHistory.length === 0 && flowHistory.length === 0) return;
    if (nodeHistory.length > 0) {
      const prevNodes = nodeHistory[nodeHistory.length - 1];
      setNodeHistory(h => h.slice(0, -1));
      setNodeFuture(f => [nodes, ...f].slice(0, 20));
      setNodes(prevNodes);
    }
    if (flowHistory.length > 0) {
      const prevFlow = flowHistory[flowHistory.length - 1];
      setFlowHistory(h => h.slice(0, -1));
      setFlowFuture(f => [flow, ...f].slice(0, 20));
      setFlow(prevFlow);
    }
  };

  const handleRedo = () => {
    if (nodeFuture.length > 0) {
      const next = nodeFuture[0];
      setNodeFuture(f => f.slice(1));
      setNodeHistory(h => [...h, nodes].slice(-20));
      setNodes(next);
    }
    if (flowFuture.length > 0) {
      const nextFlow = flowFuture[0];
      setFlowFuture(f => f.slice(1));
      setFlowHistory(h => [...h, flow].slice(-20));
      setFlow(nextFlow);
    }
  };

  const computeDiff = (a = "", b = "") => {
    const aLines = a.split('\n');
    const bLines = b.split('\n');
    const max = Math.max(aLines.length, bLines.length);
    const diffLines = [];
    for (let i = 0; i < max; i++) {
      if (aLines[i] !== bLines[i]) {
        if (aLines[i]) diffLines.push(`- ${aLines[i]}`);
        if (bLines[i]) diffLines.push(`+ ${bLines[i]}`);
      }
    }
    return diffLines.join('\n') || 'No differences';
  };

  useEffect(() => {
    (async () => {
      try {
        const [flowsResp, channelsResp, segmentsResp, connectorsResp] = await Promise.all([
          api('/flows'),
          api('/channels'),
          api('/segments'),
          api('/connectors').catch(() => ({ connectors: {} }))
        ]);
        setFlows(flowsResp.flows || []);
        setChannels(channelsResp.channels || []);
        setSegments(segmentsResp.segments || []);
        setConnectorsState(connectorsResp.connectors || {});
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const applyTemplate = (tpl) => {
    updateFlowValue(tpl.flow);
    updateNodesValue([
      { id: Date.now() + 1, label: "Trigger", type: "trigger", channel: "email" },
      { id: Date.now() + 2, label: "Branch", type: "step", channel: "email" },
      { id: Date.now() + 3, label: "Action", type: "action", channel: "sms" }
    ]);
  };

  const addChannelNode = (channel, kind = "action") => {
    updateNodesValue(prev => [...prev, { id: Date.now(), label: `${channel} ${kind}`, type: kind, channel }]);
  };

  // AI Suggestion
  const handleAISuggest = async () => {
    setLoading(true);
    setError("");
    setAiSuggestion("");
    try {
      const data = await api('/ai/suggest', { method: 'POST', body: JSON.stringify({ flow }) });
      setAiSuggestion(data.suggestion || "No suggestion generated");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run Automation
  const handleRun = async () => {
    setLoading(true);
    setError("");
    setErrorDetails(null);
    setAnalytics(null);
    try {
      const data = await api('/ai/automate', { method: 'POST', body: JSON.stringify({ flow }) });
      setAnalytics(data.analytics || { summary: "No analytics available" });
      setRunHistory((prev) => [{ ts: new Date().toISOString(), result: "success" }, ...prev].slice(0, 5));
    } catch (err) {
      setError(err.message);
      setErrorDetails({ action: 'run', detail: err.message });
      setRunHistory((prev) => [{ ts: new Date().toISOString(), result: "error" }, ...prev].slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  const validateFlowInputs = () => {
    const issues = [];
    if (!flow || flow.trim().length < 5) issues.push('Flow description is required.');
    if (nodes.length === 0) issues.push('Add at least one node.');
    if (variants.some(v => !v.id || v.weight <= 0)) issues.push('Variant ids and positive weights are required.');
    return issues;
  };

  const handleFetchPresence = () => {
    setPresence([
      { user: 'You', status: 'editing', locale },
      { user: 'Teammate A', status: 'viewing', locale: 'es' },
      { user: 'Reviewer', status: 'idle', locale: 'en' }
    ]);
  };

  const handleRequestApproval = () => {
    if (!selectedFlowId) return setError('Select a flow');
    setApprovalQueue(prev => [...prev, { id: Date.now(), flowId: selectedFlowId, status: 'pending', by: 'You' }]);
  };

  const handleApproveFlow = (id) => {
    setApprovalQueue(prev => prev.map(a => a.id === id ? { ...a, status: 'approved', ts: new Date().toISOString() } : a));
  };

  const handleTraceSimulate = () => {
    const trace = nodes.map((n, i) => ({ step: i + 1, node: n.label, type: n.type, channel: n.channel, status: 'ok', durationMs: 120 + i * 10 }));
    setTraceLog(trace);
  };

  const handleAddTestCase = () => {
    setRegressionTests(prev => [...prev, { name: `Case ${prev.length + 1}`, expected: 'ok', input: 'demo' }]);
  };

  const handleRunTests = () => {
    const passed = regressionTests.length;
    setRegressionResult({ passed, failed: 0, ts: new Date().toISOString() });
  };

  const handleAddMetric = () => {
    setCustomMetrics(prev => [...prev, { name: `metric-${prev.length + 1}`, target: 1 }]);
  };

  const handleRollbackPreview = () => {
    if (!flowVersions.length) return setError('No versions to preview');
    const latest = flowVersions[flowVersions.length - 1];
    const target = latest.flow || latest.content || '';
    setVersionDiff(computeDiff(flow, target));
    setSelectedVersion(latest.version || latest.label || 'version');
  };

  const toggleOffline = () => setOfflineMode(v => !v);

  const handleValidate = async () => {
    if (!selectedFlowId) return setError("Select a flow to validate");
    try {
      setLoading(true); setError("");
      const data = await api(`/flows/${selectedFlowId}/validate`, { method: 'POST' });
      setValidationResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestRun = async () => {
    if (!selectedFlowId) return setError("Select a flow to test-run");
    try {
      setLoading(true); setError("");
      const data = await api(`/flows/${selectedFlowId}/test-run`, { method: 'POST', body: JSON.stringify({ user: { id: 'sample', email: 'sample@example.com' } }) });
      setTestRunResult(data.result || data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFlowHealth = async () => {
    if (!selectedFlowId) return setError("Select a flow");
    try {
      setLoading(true); setError("");
      const data = await api(`/flows/${selectedFlowId}/health`);
      setFlowHealth(data.health || data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFlowReport = async () => {
    if (!selectedFlowId) return setError("Select a flow");
    try {
      setLoading(true); setError("");
      const data = await api(`/flows/${selectedFlowId}/report`);
      setFlowReport(data.report || data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!selectedFlowId) return setError("Select a flow");
    try {
      setLoading(true); setError("");
      const data = await api(`/flows/${selectedFlowId}/optimize`, { method: 'POST', body: JSON.stringify({ overrides: { goal: 'lift conversions' } }) });
      setOptimization(data.recommendation || data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVersionsFetch = async () => {
    if (!selectedFlowId) return setError("Select a flow");
    try {
      const data = await api(`/flows/${selectedFlowId}/versions`);
      setFlowVersions(data.versions || []);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleVersionDiff = (v) => {
    if (!v) return;
    const target = v.flow || v.content || v.snapshot || '';
    setSelectedVersion(v.version || v.label || 'version');
    setVersionDiff(computeDiff(flow, target));
  };

  const handleSnapshot = async () => {
    if (!selectedFlowId) return setError("Select a flow");
    try {
      await api(`/flows/${selectedFlowId}/version`, { method: 'POST' });
      await handleVersionsFetch();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleRollback = async () => {
    if (!selectedFlowId) return setError("Select a flow");
    const version = prompt('Rollback to version number:');
    if (!version) return;
    try {
      await api(`/flows/${selectedFlowId}/rollback`, { method: 'POST', body: JSON.stringify({ version: Number(version) }) });
      await handleVersionsFetch();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDependencies = async () => {
    try {
      const data = await api('/flows/dependencies');
      setFlowDependencies(data.dependencies || []);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleJourneys = async () => {
    try {
      const data = await api('/journeys');
      setJourneys(data.journeys || []);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleWidgets = async () => {
    try {
      const data = await api('/analytics/widgets');
      setWidgets(data.widgets || data);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleOrchestrate = async () => {
    if (!selectedFlowId) return setError("Select a flow");
    try {
      const plan = [{ channel: 'email', afterMinutes: 0 }, { channel: 'sms', afterMinutes: 60 }];
      const data = await api('/orchestrate', { method: 'POST', body: JSON.stringify({ flowId: selectedFlowId, userId: 'preview-user', channelPlan: plan }) });
      setOrchestrationResult(data.orchestration || data);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSimulate = () => {
    if (!nodes.length) { setError('Add nodes to simulate'); return; }
    const timeline = nodes.map((n, i) => ({
      step: i + 1,
      label: n.label,
      type: n.type,
      channel: n.channel || 'n/a',
      etaMinutes: i * 10,
    }));
    setSimulation({ startedAt: new Date().toISOString(), timeline });
  };

  // Import/Export
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      updateFlowValue(evt.target.result);
      setImported(file.name);
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([flow], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Server-backed CRUD & sync
  const handleSaveNew = async () => {
    const issues = validateFlowInputs();
    if (issues.length) { setError(issues[0]); setErrorDetails({ action: 'save', issues }); return; }
    if (!flow) return setError("Flow is empty");
    const name = prompt("Name this flow:");
    if (!name) return;
    try {
      setLoading(true); setError("");
      const data = await api('/flows', { method: 'POST', body: JSON.stringify({ name, flow, nodes, variants, segmentIds: attachedSegments, channels }) });
      setFlows(prev => [...prev, data.flow]);
      setSelectedFlowId(data.flow.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedFlowId) return setError("Select a flow to update");
    const issues = validateFlowInputs();
    if (issues.length) { setError(issues[0]); setErrorDetails({ action: 'update', issues }); return; }
    try {
      setLoading(true); setError("");
      const data = await api(`/flows/${selectedFlowId}`, { method: 'PUT', body: JSON.stringify({ flow, nodes, variants, segmentIds: attachedSegments, channels }) });
      setFlows(prev => prev.map(f => f.id === data.flow.id ? data.flow : f));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFlowId) return setError("Select a flow to delete");
    if (!window.confirm("Delete this flow?")) return;
    try {
      setLoading(true); setError("");
      await api(`/flows/${selectedFlowId}`, { method: 'DELETE' });
      setFlows(prev => prev.filter(f => f.id !== selectedFlowId));
      setSelectedFlowId(null);
      updateFlowValue("");
      updateNodesValue([]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedFlowIds.length) return setError('Select flows to delete');
    if (!window.confirm(`Delete ${selectedFlowIds.length} flows?`)) return;
    try {
      setLoading(true); setError("");
      for (const id of selectedFlowIds) {
        await api(`/flows/${id}`, { method: 'DELETE' });
      }
      setFlows(prev => prev.filter(f => !selectedFlowIds.includes(f.id)));
      setSelectedFlowIds([]);
      setBulkActionResult(`Deleted ${selectedFlowIds.length} flows`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDuplicate = async () => {
    if (!selectedFlowIds.length) return setError('Select flows to duplicate');
    try {
      setLoading(true); setError("");
      const newFlows = [];
      for (const id of selectedFlowIds) {
        const base = flows.find(f => f.id === id);
        if (!base) continue;
        const body = { name: `${base.name || 'Flow'} Copy`, flow: base.flow, nodes: base.nodes, variants: base.variants, segmentIds: base.segmentIds, channels: base.channels };
        const resp = await api('/flows', { method: 'POST', body: JSON.stringify(body) });
        newFlows.push(resp.flow);
      }
      setFlows(prev => [...prev, ...newFlows]);
      setBulkActionResult(`Duplicated ${newFlows.length} flows`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFlow = (id) => {
    setSelectedFlowId(id);
    const f = flows.find(fl => fl.id === id);
    if (f) {
      updateFlowValue(f.flow || "");
      updateNodesValue(f.nodes || []);
      setVariants(f.variants || [{ id: "control", weight: 100 }]);
      setAttachedSegments(f.segmentIds || []);
    }
  };

  const handleServerExport = async () => {
    try {
      setLoading(true); setError("");
      const data = await api('/export');
      const blob = new Blob([JSON.stringify(data.items || [], null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      setExported(url);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleServerImport = async () => {
    if (!exported) return;
    try {
      setLoading(true); setError("");
      const txt = await (await fetch(exported)).text();
      const items = JSON.parse(txt);
      const data = await api('/import', { method: 'POST', body: JSON.stringify({ items }) });
      const refreshed = await api('/flows');
      setFlows(refreshed.flows || []);
      setImported(`Server import: ${data.count} flows`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSegment = async () => {
    if (!segmentName) return setError("Segment name is required");
    try {
      setLoading(true); setError("");
      const rules = segmentRules ? segmentRules.split(',').map(r => r.trim()).filter(Boolean) : [];
      const resp = await api('/segments', { method: 'POST', body: JSON.stringify({ name: segmentName, rules }) });
      setSegments(prev => [...prev, resp.segment]);
      setSegmentName("");
      setSegmentRules("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    try {
      setLoading(true); setError("");
      const data = await api('/ai/predict-scores', { method: 'POST', body: JSON.stringify({ user: { id: 'demo' }, history: { recentPurchases: 1, totalSpend: 240 } }) });
      setPredictive(data.scores || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContentVariants = async () => {
    try {
      setLoading(true); setError("");
      const data = await api('/ai/content-variants', { method: 'POST', body: JSON.stringify({ subject: 'Welcome back!', body: flow || 'Default body', channel: 'email', tone: 'friendly' }) });
      setContentVariants(data.variants || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendations = async () => {
    try {
      setLoading(true); setError("");
      const data = await api('/ai/recommendations', { method: 'POST', body: JSON.stringify({ limit: 3 }) });
      setRecommendations(data.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDynamicRender = async () => {
    try {
      setLoading(true); setError("");
      const segmentId = attachedSegments[0];
      const data = await api('/render/dynamic', { method: 'POST', body: JSON.stringify({ segmentId, content: { headline: 'Hello!', offer: 'Standard' } }) });
      setDynamicContent(data.content || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async () => {
    if (!selectedFlowId) return setError("Select a flow to comment");
    if (!comment) return setError("Comment cannot be empty");
    try {
      setLoading(true); setError("");
      await api('/collab/comment', { method: 'POST', body: JSON.stringify({ flowId: selectedFlowId, user: 'you', comment }) });
      setComment("");
      await handleFetchAudit();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedFlowId) return setError("Select a flow to approve");
    try {
      setLoading(true); setError("");
      await api('/collab/approve', { method: 'POST', body: JSON.stringify({ flowId: selectedFlowId, user: 'you' }) });
      await handleFetchAudit();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVersion = async () => {
    if (!selectedFlowId) return setError("Select a flow to version");
    try {
      setLoading(true); setError("");
      await api('/collab/version', { method: 'POST', body: JSON.stringify({ flowId: selectedFlowId, label: versionLabel || 'v1' }) });
      await handleFetchAudit();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!selectedFlowId) return setError("Select a flow to share");
    try {
      setLoading(true); setError("");
      const data = await api('/collab/share-link', { method: 'POST', body: JSON.stringify({ flowId: selectedFlowId }) });
      setShareLink(data.link || "");
      await handleFetchAudit();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAudit = async () => {
    try {
      const data = await api('/audit/logs');
      setAuditLogs(data.entries || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleComplianceSave = async () => {
    try {
      setLoading(true); setError("");
      const data = await api('/compliance/toggles', { method: 'POST', body: JSON.stringify(compliance) });
      setCompliance(data.toggles || compliance);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchConnectors = async () => {
    try {
      setLoading(true); setError("");
      const data = await api('/connectors');
      setConnectorsState(data.connectors || {});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSegment = async () => {
    if (!integrationForm.segmentWriteKey) return setError('Segment write key required');
    try {
      setLoading(true); setError("");
      const data = await api('/connect/segment', { method: 'POST', body: JSON.stringify({ writeKey: integrationForm.segmentWriteKey }) });
      setConnectorsState(prev => ({ ...prev, segment: data.connector }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSalesforce = async () => {
    if (!integrationForm.salesforceToken) return setError('Salesforce token required');
    try {
      setLoading(true); setError("");
      const data = await api('/connect/salesforce', { method: 'POST', body: JSON.stringify({ token: integrationForm.salesforceToken, instanceUrl: integrationForm.salesforceInstance }) });
      setConnectorsState(prev => ({ ...prev, salesforce: data.connector }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectHubspot = async () => {
    if (!integrationForm.hubspotToken) return setError('HubSpot token required');
    try {
      setLoading(true); setError("");
      const data = await api('/connect/hubspot', { method: 'POST', body: JSON.stringify({ token: integrationForm.hubspotToken }) });
      setConnectorsState(prev => ({ ...prev, hubspot: data.connector }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectZapier = async () => {
    if (!integrationForm.zapierHook) return setError('Zapier hook URL required');
    try {
      setLoading(true); setError("");
      const data = await api('/connect/zapier', { method: 'POST', body: JSON.stringify({ hookUrl: integrationForm.zapierHook }) });
      setConnectorsState(prev => ({ ...prev, zapier: data.connector }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSnowflake = async () => {
    if (!integrationForm.snowflakeAccount || !integrationForm.snowflakeUser) return setError('Snowflake account and user required');
    try {
      setLoading(true); setError("");
      const data = await api('/connect/warehouse/snowflake', { method: 'POST', body: JSON.stringify({
        account: integrationForm.snowflakeAccount,
        user: integrationForm.snowflakeUser,
        warehouse: integrationForm.snowflakeWarehouse,
        database: integrationForm.snowflakeDatabase,
        schema: integrationForm.snowflakeSchema,
        role: integrationForm.snowflakeRole,
      }) });
      setConnectorsState(prev => ({ ...prev, snowflake: data.connector }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectBigQuery = async () => {
    if (!integrationForm.bqProject || !integrationForm.bqDataset) return setError('BigQuery project and dataset required');
    try {
      setLoading(true); setError("");
      const data = await api('/connect/warehouse/bigquery', { method: 'POST', body: JSON.stringify({ project: integrationForm.bqProject, dataset: integrationForm.bqDataset }) });
      setConnectorsState(prev => ({ ...prev, bigquery: data.connector }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSlack = async () => {
    if (!integrationForm.slackToken || !integrationForm.slackChannel) return setError('Slack token + channel required');
    try {
      setLoading(true); setError("");
      const data = await api('/connect/slack', { method: 'POST', body: JSON.stringify({ token: integrationForm.slackToken, channel: integrationForm.slackChannel }) });
      setConnectorsState(prev => ({ ...prev, slack: data.connector }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectTwilio = async () => {
    if (!integrationForm.twilioAccountSid || !integrationForm.twilioAuthToken || !integrationForm.twilioFrom) return setError('Twilio SID/Auth/From required');
    try {
      setLoading(true); setError("");
      const data = await api('/connect/twilio', { method: 'POST', body: JSON.stringify({ accountSid: integrationForm.twilioAccountSid, authToken: integrationForm.twilioAuthToken, from: integrationForm.twilioFrom }) });
      setConnectorsState(prev => ({ ...prev, twilio: data.connector }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWhatsApp = async () => {
    if (!integrationForm.whatsappNumber) return setError('WhatsApp number required');
    try {
      setLoading(true); setError("");
      const data = await api('/connect/whatsapp', { method: 'POST', body: JSON.stringify({ number: integrationForm.whatsappNumber }) });
      setConnectorsState(prev => ({ ...prev, whatsapp: data.connector }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectPush = async () => {
    if (!integrationForm.pushApiKey) return setError('Push API key required');
    try {
      setLoading(true); setError("");
      const data = await api('/connect/push', { method: 'POST', body: JSON.stringify({ apiKey: integrationForm.pushApiKey }) });
      setConnectorsState(prev => ({ ...prev, push: data.connector }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConsentSync = async () => {
    if (!consentUser) return setError('Consent user required');
    try {
      setLoading(true); setError("");
      await api('/consent/sync', { method: 'POST', body: JSON.stringify({ userId: consentUser, consent: consentValue }) });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIngestEvent = async () => {
    try {
      setLoading(true); setError("");
      await api('/ingest/event', { method: 'POST', body: JSON.stringify({
        event: { type: 'conversion', source: ingestSource, revenue: Number(ingestRevenue) || 0 },
        pii: { email: 'demo@example.com' },
      }) });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComplianceScan = async () => {
    if (!selectedFlowId) return setError('Select a flow');
    try {
      setLoading(true); setError('');
      const data = await api('/compliance/scan', { method: 'POST', body: JSON.stringify({ flowId: selectedFlowId }) });
      setComplianceScan(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomNodesFetch = async () => {
    try {
      const data = await api('/custom-nodes');
      setCustomNodesList(data.nodes || []);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCustomNodeCreate = async () => {
    const name = prompt('Custom node name');
    if (!name) return;
    try {
      await api('/custom-nodes', { method: 'POST', body: JSON.stringify({ name, type: 'action' }) });
      await handleCustomNodesFetch();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleBrandsFetch = async () => {
    try {
      const data = await api('/brands');
      setBrandsList(data.brands || []);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleBrandCreate = async () => {
    const name = prompt('Brand name');
    if (!name) return;
    try {
      await api('/brands', { method: 'POST', body: JSON.stringify({ name }) });
      await handleBrandsFetch();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleFetchCohorts = async () => {
    try {
      setLoading(true); setError("");
      const data = await api('/analytics/cohort');
      setCohorts(data.cohorts || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAttribution = async () => {
    try {
      setLoading(true); setError("");
      const data = await api('/analytics/attribution');
      setAttribution(data.sources || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchExperimentResults = async () => {
    try {
      setLoading(true); setError("");
      const data = await api('/experiments/results');
      setExperimentResults(data.results || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAttachSegments = async (ids) => {
    setAttachedSegments(ids);
    if (!selectedFlowId) return;
    try {
      await api(`/flows/${selectedFlowId}/segments`, { method: 'POST', body: JSON.stringify({ segmentIds: ids }) });
    } catch (e) {
      setError(e.message);
    }
  };

  const handleRefreshFunnel = async () => {
    try {
      setLoading(true); setError("");
      const data = await api('/analytics/funnel');
      setFunnel(data.summary || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Collaboration (placeholder)
  const handleAddCollaborator = () => {
    const name = prompt("Enter collaborator name/email:");
    if (name && !collaborators.includes(name)) {
      setCollaborators([...collaborators, name]);
      setPermissions(prev => ({ ...prev, [name]: 'editor' }));
    }
  };

  // Onboarding
  const onboardingContent = (
    <div style={{ padding: 24, background: "#1e3a3f", borderRadius: 12, marginBottom: 18 }}>
      <h3 style={{ fontWeight: 700, fontSize: 22, color: "#06b6d4" }}>Welcome to Klaviyo Flow Automation</h3>
      <ul style={{ margin: "16px 0 0 18px", color: "#cbd5e1", fontSize: 16 }}>
        <li>Build, import, or export advanced Klaviyo flows visually</li>
        <li>Get AI-powered suggestions and templates</li>
        <li>Analyze flow performance with real-time analytics</li>
        <li>Collaborate and share flows with your team</li>
        <li>Integrate with Klaviyo and Shopify in one click</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Get Started</button>
    </div>
  );

  // Accessibility: keyboard shortcuts (placeholder)
  React.useEffect(() => {
    const handler = e => {
      if (e.ctrlKey && e.key.toLowerCase() === "i") { e.preventDefault(); fileInputRef.current?.click(); }
      if (e.ctrlKey && e.key.toLowerCase() === "e") { e.preventDefault(); handleExport(); }
      if (e.ctrlKey && e.key.toLowerCase() === "s") { e.preventDefault(); handleUpdate(); }
      if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); handleRun(); }
      if (e.altKey && e.key.toLowerCase() === "v") { e.preventDefault(); handleValidate(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Main UI
  return (
    <div style={{

      margin: "40px auto",
      background: "#0f172a",
      borderRadius: 18,
      boxShadow: "0 2px 24px #0002",
      padding: 36,
      color: "#e0e7ff",
      fontFamily: 'Inter, sans-serif',
      transition: "background 0.3s, color 0.3s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0 }}>Klaviyo Flow Automation</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={selectedFlowId || ''} onChange={e => handleSelectFlow(e.target.value ? Number(e.target.value) : null)} style={{ padding: 6, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }}>
            <option value="">Load saved flow…</option>
            {flows.map(f => (
              <option key={f.id} value={f.id}>{f.name || `Flow ${f.id}`}</option>
            ))}
          </select>
          <button onClick={handleSaveNew} disabled={loading} style={{ background: '#22c55e', color: '#0f172a', border: 'none', borderRadius: 8, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>Save New</button>
          <button onClick={handleUpdate} disabled={loading || !selectedFlowId} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>Update</button>
          <button onClick={handleDelete} disabled={loading || !selectedFlowId} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <div style={{ background: '#1e3a3f', padding: '6px 10px', borderRadius: 999, color: '#7dd3fc', fontWeight: 700 }}>Sends: {analytics?.sends ?? '—'}</div>
        <div style={{ background: '#1e3a3f', padding: '6px 10px', borderRadius: 999, color: '#34d399', fontWeight: 700 }}>Conv: {analytics?.conversions ?? '—'}</div>
        <div style={{ background: '#1e3a3f', padding: '6px 10px', borderRadius: 999, color: '#fbbf24', fontWeight: 700 }}>Errors: {analytics?.errors ?? '—'}</div>
        {bulkActionResult && <div style={{ background: '#0f172a', padding: '6px 10px', borderRadius: 999, color: '#cbd5e1', fontWeight: 700 }}>{bulkActionResult}</div>}
      </div>
      <div style={{ background: '#0b1220', border: '1px solid #334155', borderRadius: 10, padding: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontWeight: 700, color: '#e0e7ff' }}>Flows (bulk actions)</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleBulkDuplicate} disabled={loading || !selectedFlowIds.length} style={{ background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: 8, padding: '6px 10px', fontWeight: 700, cursor: 'pointer', opacity: (!selectedFlowIds.length ? 0.6 : 1) }}>Duplicate</button>
            <button onClick={handleBulkDelete} disabled={loading || !selectedFlowIds.length} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', fontWeight: 700, cursor: 'pointer', opacity: (!selectedFlowIds.length ? 0.6 : 1) }}>Delete</button>
          </div>
        </div>
        <div style={{ maxHeight: 140, overflowY: 'auto' }}>
          {flows.length === 0 ? <div style={{ color: '#94a3b8' }}>No flows yet.</div> : (
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', color: '#cbd5e1' }}>
              {flows.map(f => (
                <li key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid #1f2937' }}>
                  <input type="checkbox" aria-label={`Select flow ${f.name || f.id}`} checked={selectedFlowIds.includes(f.id)} onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectedFlowIds(prev => checked ? [...prev, f.id] : prev.filter(id => id !== f.id));
                  }} />
                  <button onClick={() => handleSelectFlow(f.id)} style={{ background: 'transparent', color: '#e0e7ff', border: 'none', textAlign: 'left', flex: 1, cursor: 'pointer' }}>{f.name || `Flow ${f.id}`}</button>
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>{f.channels?.join?.(', ') || 'multi'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div style={{ marginBottom: 14, color: "#06b6d4", fontWeight: 600, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span role="img" aria-label="bolt">⚡</span> Build, automate, and analyze Klaviyo flows with AI, analytics, and team collaboration.
        <span style={{ padding: "6px 10px", borderRadius: 999, background: "#1e3a3f", color: "#06b6d4", fontWeight: 700 }}>Live</span>
        <span style={{ padding: "6px 10px", borderRadius: 999, background: "#1f2937", color: "#34d399", fontWeight: 700 }}>Compliance: GDPR | SOC2</span>
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 2, minWidth: 320 }}>
          {showOnboarding && onboardingContent}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input value={templateQuery} onChange={e => setTemplateQuery(e.target.value)} placeholder="Search templates" style={{ flex: 1, minWidth: 200, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
            <span style={{ color: '#94a3b8', fontSize: 13 }}>Filter gallery</span>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            {templates.filter(t => (t.name + t.desc).toLowerCase().includes(templateQuery.toLowerCase())).map(tpl => (
              <button key={tpl.name} onClick={() => applyTemplate(tpl)} style={{ background: "#1e3a3f", color: "#06b6d4", border: '1px solid #334155', borderRadius: 10, padding: '10px 14px', textAlign: 'left', minWidth: 180, cursor: 'pointer', boxShadow: '0 1px 4px #0001', fontWeight: 700 }}>
                {tpl.name}
                <div style={{ fontWeight: 500, fontSize: 13, marginTop: 4, color: "#cbd5e1" }}>{tpl.desc}</div>
              </button>
            ))}
          </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {channels.map(ch => (
                <button key={ch} onClick={() => addChannelNode(ch, 'action')} style={{ background: '#0b172a', color: '#e0e7ff', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontWeight: 700 }}>{`Add ${ch} node`}</button>
              ))}
            </div>
          <VisualFlowBuilder
            flow={flow}
            setFlow={updateFlowValue}
            nodes={nodes}
            setNodes={updateNodesValue}
            onMoveNode={(idx, dir) => updateNodesValue(prev => {
              const next = [...prev];
              const swapIdx = idx + dir;
              if (swapIdx < 0 || swapIdx >= next.length) return prev;
              [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
              return next;
            })}
            onAddWebhook={() => {
              if (!webhookUrl) return;
              updateNodesValue(prev => [...prev, { id: Date.now(), label: `Webhook: ${webhookUrl}`, type: 'trigger', channel: 'webhook', url: webhookUrl }]);
            }}
            webhookUrl={webhookUrl}
            setWebhookUrl={setWebhookUrl}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={nodeHistory.length > 0 || flowHistory.length > 0}
            canRedo={nodeFuture.length > 0 || flowFuture.length > 0}
          />
          <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            <button title="AI suggestion for this flow" onClick={handleAISuggest} disabled={loading || !flow} style={{ background: "#a3e635", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{loading ? "Thinking..." : "AI Suggest"}</button>
            <button title="Simulate flow run" onClick={handleRun} disabled={loading || !flow} style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{loading ? "Running..." : "Run Automation"}</button>
            <button title="Preview timeline without sending" onClick={handleSimulate} disabled={loading || !nodes.length} style={{ background: "#4ade80", color: "#0f172a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer", opacity: (!nodes.length ? 0.6 : 1) }}>Simulate</button>
            <button title="Validate required triggers/actions and blackout rules" onClick={handleValidate} disabled={loading || !selectedFlowId} style={{ background: "#fde047", color: "#0f172a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer", opacity: (!selectedFlowId ? 0.6 : 1) }}>Validate</button>
            <button title="Test-run with sample user" onClick={handleTestRun} disabled={loading || !selectedFlowId} style={{ background: "#c7d2fe", color: "#0f172a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer", opacity: (!selectedFlowId ? 0.6 : 1) }}>Test Run</button>
            <button title="Get optimization suggestions" onClick={handleOptimize} disabled={loading || !selectedFlowId} style={{ background: "#34d399", color: "#0f172a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer", opacity: (!selectedFlowId ? 0.6 : 1) }}>Optimize</button>
            <button onClick={handlePredict} disabled={loading} style={{ background: "#c084fc", color: "#0f172a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Predict</button>
            <button onClick={handleContentVariants} disabled={loading} style={{ background: "#f472b6", color: "#0f172a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Content Variants</button>
            <button onClick={handleRecommendations} disabled={loading} style={{ background: "#38bdf8", color: "#0f172a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Recs</button>
            <button onClick={handleDynamicRender} disabled={loading} style={{ background: "#f59e0b", color: "#0f172a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Dynamic Render</button>
            <button onClick={handleTraceSimulate} disabled={loading || !nodes.length} style={{ background: "#1e3a8a", color: "#e0e7ff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer", opacity: (!nodes.length ? 0.6 : 1) }}>Trace</button>
            <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
            <input ref={fileInputRef} type="file" accept=".txt,.json" style={{ display: "none" }} onChange={handleImport} aria-label="Import flow" />
            <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
            <button onClick={handleServerExport} disabled={loading} style={{ background: "#10b981", color: "#0f172a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export from Server</button>
            <button onClick={handleServerImport} disabled={loading || !exported} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import to Server</button>
            {exported && <a href={exported} download="klaviyo-flow.txt" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
          </div>
          <div style={{ marginBottom: 16, background: '#0b1220', borderRadius: 10, padding: 12, border: '1px solid #334155' }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>A/B/n Variants</div>
            {variants.map((v, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <input value={v.id} onChange={e => setVariants(variants.map((vv, i) => i === idx ? { ...vv, id: e.target.value } : vv))} placeholder="Variant id" style={{ flex: 1, minWidth: 120, padding: 6, borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
                <input type="number" value={v.weight} onChange={e => setVariants(variants.map((vv, i) => i === idx ? { ...vv, weight: Number(e.target.value) } : vv))} placeholder="Weight" style={{ width: 100, padding: 6, borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
                <button onClick={() => setVariants(variants.filter((_, i) => i !== idx))} disabled={variants.length <= 1} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}>Remove</button>
              </div>
            ))}
            <button onClick={() => setVariants([...variants, { id: `var-${variants.length + 1}`, weight: 10 }])} style={{ marginTop: 4, background: '#22c55e', color: '#0f172a', border: 'none', borderRadius: 6, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>Add Variant</button>
          </div>
          {imported && <div style={{ color: "#22c55e", marginBottom: 8, fontWeight: 600 }}>Imported: {imported}</div>}
          {selectedFlowId && <div style={{ color: "#7dd3fc", marginBottom: 8, fontWeight: 600 }}>Loaded flow ID: {selectedFlowId}</div>}
          {aiSuggestion && (
            <div style={{ background: "#1e3a3f", borderRadius: 10, padding: 16, marginBottom: 12, color: "#06b6d4" }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>AI Suggestion:</div>
              <div>{aiSuggestion}</div>
            </div>
          )}
          {predictive && (
            <div style={{ background: "#0b1220", borderRadius: 10, padding: 12, marginBottom: 12, border: '1px solid #334155', color: '#cbd5e1' }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: '#c084fc' }}>Predictive Scores</div>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(predictive, null, 2)}</pre>
            </div>
          )}
          {validationResult && (
            <div style={{ background: "#0b1220", borderRadius: 10, padding: 12, marginBottom: 12, border: '1px solid #334155', color: '#cbd5e1' }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: '#fde047' }}>Validation</div>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(validationResult, null, 2)}</pre>
            </div>
          )}
          {testRunResult && (
            <div style={{ background: "#0b1220", borderRadius: 10, padding: 12, marginBottom: 12, border: '1px solid #334155', color: '#cbd5e1' }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: '#c7d2fe' }}>Test Run</div>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(testRunResult, null, 2)}</pre>
            </div>
          )}
          {simulation && (
            <div style={{ background: "#0b1220", borderRadius: 10, padding: 12, marginBottom: 12, border: '1px solid #334155', color: '#cbd5e1' }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: '#4ade80' }}>Simulation Preview</div>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(simulation, null, 2)}</pre>
            </div>
          )}
          {traceLog.length > 0 && (
            <div style={{ background: "#0b1220", borderRadius: 10, padding: 12, marginBottom: 12, border: '1px solid #334155', color: '#cbd5e1' }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: '#1e3a8a' }}>Execution Trace</div>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(traceLog, null, 2)}</pre>
            </div>
          )}
          {flowHealth && (
            <div style={{ background: "#0b1220", borderRadius: 10, padding: 12, marginBottom: 12, border: '1px solid #334155', color: '#cbd5e1' }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: '#22c55e' }}>Flow Health</div>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(flowHealth, null, 2)}</pre>
            </div>
          )}
          {flowReport && (
            <div style={{ background: "#0b1220", borderRadius: 10, padding: 12, marginBottom: 12, border: '1px solid #334155', color: '#cbd5e1' }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: '#7dd3fc' }}>Flow Report</div>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(flowReport, null, 2)}</pre>
            </div>
          )}
          {optimization && (
            <div style={{ background: "#0b1220", borderRadius: 10, padding: 12, marginBottom: 12, border: '1px solid #334155', color: '#cbd5e1' }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: '#34d399' }}>Optimization</div>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(optimization, null, 2)}</pre>
            </div>
          )}
          {widgets && (
            <div style={{ background: "#0b1220", borderRadius: 10, padding: 12, marginBottom: 12, border: '1px solid #334155', color: '#cbd5e1' }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: '#06b6d4' }}>Analytics Widgets</div>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(widgets, null, 2)}</pre>
            </div>
          )}
          {contentVariants?.length > 0 && (
            <div style={{ background: "#0b1220", borderRadius: 10, padding: 12, marginBottom: 12, border: '1px solid #334155', color: '#cbd5e1' }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: '#f472b6' }}>Content Variants</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {contentVariants.map((v, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, color: '#e0e7ff' }}>{v.subject || `Variant ${i + 1}`}</div>
                    <div style={{ color: '#cbd5e1' }}>{v.body}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {recommendations?.length > 0 && (
            <div style={{ background: "#0b1220", borderRadius: 10, padding: 12, marginBottom: 12, border: '1px solid #334155', color: '#cbd5e1' }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: '#38bdf8' }}>Recommendations</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {recommendations.map((p) => (
                  <li key={p.id}>{p.name} (popularity {p.popularity})</li>
                ))}
              </ul>
            </div>
          )}
          {dynamicContent && (
            <div style={{ background: "#0b1220", borderRadius: 10, padding: 12, marginBottom: 12, border: '1px solid #334155', color: '#cbd5e1' }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: '#f59e0b' }}>Dynamic Content</div>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(dynamicContent, null, 2)}</pre>
            </div>
          )}
          {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
          {errorDetails && (
            <div style={{ color: '#fbbf24', marginBottom: 10, fontSize: 13 }}>
              {errorDetails.action ? `${errorDetails.action.toUpperCase()} issue: ` : ''}{errorDetails.detail || ''}
              {errorDetails.issues && errorDetails.issues.length > 0 && (
                <ul style={{ margin: '6px 0 0 16px', color: '#fca5a5' }}>
                  {errorDetails.issues.map((i, idx) => <li key={idx}>{i}</li>)}
                </ul>
              )}
            </div>
          )}
          <div style={{ marginTop: 12, background: "#1e293b", borderRadius: 10, padding: 12, border: "1px solid #334155" }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: "#e0e7ff" }}>Recent Runs</div>
            {runHistory.length === 0 ? <div style={{ color: '#94a3b8' }}>No runs yet. Execute a flow to see history.</div> : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {runHistory.map((r, idx) => (
                  <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: idx < runHistory.length - 1 ? '1px solid #334155' : 'none' }}>
                    <span style={{ color: '#cbd5e1' }}>{new Date(r.ts).toLocaleString()}</span>
                    <span style={{ fontWeight: 700, color: r.result === 'success' ? '#22c55e' : '#ef4444' }}>{r.result === 'success' ? 'Success' : 'Error'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 260, background: "#1e293b", borderRadius: 12, padding: 18, boxShadow: "0 1px 6px #0001" }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: "#e0e7ff" }}>Analytics & Collaboration</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <button onClick={handleFetchPresence} style={{ background: '#334155', color: '#e0e7ff', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>Refresh Presence</button>
            <select value={locale} onChange={e => setLocale(e.target.value)} style={{ padding: 6, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }}>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e0e7ff', fontWeight: 600 }}>
              <input type="checkbox" checked={offlineMode} onChange={toggleOffline} /> Offline mode
            </label>
          </div>
          {presence.length > 0 && (
            <div style={{ marginBottom: 10, background: '#0b1220', borderRadius: 8, padding: 8, border: '1px solid #334155' }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: '#7dd3fc' }}>Presence</div>
              <ul style={{ margin: 0, paddingLeft: 16, color: '#cbd5e1' }}>
                {presence.map((p, idx) => (
                  <li key={idx}>{p.user} — {p.status} ({p.locale || 'en'})</li>
                ))}
              </ul>
            </div>
          )}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 600, marginBottom: 2, color: "#e0e7ff" }}>Collaborators:</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1" }}>
              {collaborators.map(c => (
                <li key={c} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{c}</span>
                  <select value={permissions[c] || 'editor'} onChange={e => setPermissions(prev => ({ ...prev, [c]: e.target.value }))} style={{ padding: 4, borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }}>
                    <option value="owner">Owner</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </li>
              ))}
            </ul>
            <button onClick={handleAddCollaborator} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "6px 16px", fontWeight: 600, fontSize: 14, marginTop: 6, cursor: "pointer" }}>Add Collaborator</button>
          </div>
          <div style={{ fontWeight: 600, marginBottom: 2, color: "#e0e7ff" }}>Flow Analytics:</div>
          <div style={{ fontSize: 15, color: "#cbd5e1" }}>
            {analytics ? (
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "none", padding: 0, margin: 0 }}>{JSON.stringify(analytics, null, 2)}</pre>
            ) : (
              <span>No analytics yet. Run automation to see results.</span>
            )}
          </div>
          <div style={{ marginTop: 8, background: '#0f172a', borderRadius: 8, padding: 8, border: '1px solid #1e293b', color: '#cbd5e1' }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Performance</div>
            <div>Avg exec (ms): {analytics?.avgDurationMs ?? '—'}</div>
            <div>Bottleneck: {analytics?.bottleneck ?? 'n/a'}</div>
            <div>Error rate: {analytics?.errorRate ?? '—'}</div>
          </div>
          <div style={{ marginTop: 12, background: '#0b1220', borderRadius: 10, padding: 10, border: '1px solid #334155' }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#e0e7ff' }}>Funnel / Events</div>
            <button onClick={handleRefreshFunnel} disabled={loading} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>Refresh Funnel</button>
            {funnel ? (
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(funnel, null, 2)}</pre>
            ) : (
              <div style={{ color: '#94a3b8' }}>No events yet.</div>
            )}
          </div>
          <div style={{ marginTop: 12, background: '#0b1220', borderRadius: 10, padding: 10, border: '1px solid #334155' }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#e0e7ff' }}>Segmentation</div>
            <input value={segmentName} onChange={e => setSegmentName(e.target.value)} placeholder="Segment name" style={{ width: '100%', marginBottom: 6, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
            <input value={segmentRules} onChange={e => setSegmentRules(e.target.value)} placeholder="Rules (comma separated)" style={{ width: '100%', marginBottom: 6, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
            <button onClick={handleCreateSegment} disabled={loading} style={{ background: '#22c55e', color: '#0f172a', border: 'none', borderRadius: 6, padding: '8px 12px', fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>Create Segment</button>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#e0e7ff' }}>Attach to flow</div>
            <select multiple value={attachedSegments.map(String)} onChange={e => {
              const options = Array.from(e.target.selectedOptions).map(o => Number(o.value));
              handleAttachSegments(options);
            }} style={{ width: '100%', minHeight: 90, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff', padding: 6 }}>
              {segments.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginTop: 12, background: '#0b1220', borderRadius: 10, padding: 10, border: '1px solid #334155' }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#e0e7ff' }}>Collaboration & Compliance</div>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add comment" rows={2} style={{ width: '100%', marginBottom: 6, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
            <button onClick={handleComment} disabled={loading} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer', marginBottom: 6 }}>Comment</button>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <input value={versionLabel} onChange={e => setVersionLabel(e.target.value)} placeholder="Version label" style={{ flex: 1, minWidth: 120, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
              <button onClick={handleVersion} disabled={loading} style={{ background: '#c084fc', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>Version</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <button onClick={handleApprove} disabled={loading} style={{ background: '#22c55e', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>Approve</button>
              <button onClick={handleShare} disabled={loading} style={{ background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>Share Link</button>
              <button onClick={handleFetchAudit} disabled={loading} style={{ background: '#7dd3fc', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>Refresh Audit</button>
              <button onClick={handleRequestApproval} disabled={loading || !selectedFlowId} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer', opacity: (!selectedFlowId ? 0.6 : 1) }}>Request Approval</button>
              <button onClick={handleRollbackPreview} disabled={!flowVersions.length} style={{ background: '#1f2937', color: '#e0e7ff', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer', opacity: (!flowVersions.length ? 0.6 : 1) }}>Rollback Preview</button>
            </div>
            {shareLink && <div style={{ color: '#fbbf24', marginBottom: 8, wordBreak: 'break-all' }}>Share: {shareLink}</div>}
            <div style={{ marginBottom: 8, color: '#e0e7ff' }}>
              Compliance:
              <label style={{ marginLeft: 8 }}><input type="checkbox" checked={compliance.HIPAA} onChange={e => setCompliance({ ...compliance, HIPAA: e.target.checked })} /> HIPAA</label>
              <label style={{ marginLeft: 8 }}><input type="checkbox" checked={compliance.TCPA} onChange={e => setCompliance({ ...compliance, TCPA: e.target.checked })} /> TCPA</label>
              <label style={{ marginLeft: 8 }}><input type="checkbox" checked={compliance.CCPA} onChange={e => setCompliance({ ...compliance, CCPA: e.target.checked })} /> CCPA</label>
            </div>
            <button onClick={handleComplianceSave} disabled={loading} style={{ background: '#f472b6', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>Save Compliance</button>
            <div style={{ maxHeight: 180, overflowY: 'auto', borderTop: '1px solid #334155', paddingTop: 8 }}>
              {auditLogs.length === 0 ? <div style={{ color: '#94a3b8' }}>No audit entries yet.</div> : (
                <ul style={{ margin: 0, paddingLeft: 16, color: '#e0e7ff' }}>
                  {auditLogs.slice(0, 20).map((e, idx) => (
                    <li key={idx} style={{ marginBottom: 6 }}>
                      <span style={{ fontWeight: 700 }}>{e.type}</span> · <span>{new Date(e.ts).toLocaleString()}</span> {e.user ? `· ${e.user}` : ''} {e.comment ? `· ${e.comment}` : ''} {e.label ? `· ${e.label}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div style={{ marginTop: 12, background: '#0b1220', borderRadius: 10, padding: 10, border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontWeight: 700, color: '#e0e7ff' }}>Integrations & Data</div>
              <button onClick={handleFetchConnectors} disabled={loading} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}>Refresh</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              <div>
                <label style={{ color: '#cbd5e1', fontWeight: 600 }}>Segment</label>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <input value={integrationForm.segmentWriteKey} onChange={e => setIntegrationForm({ ...integrationForm, segmentWriteKey: e.target.value })} placeholder="Write key" style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
                  <button onClick={handleConnectSegment} disabled={loading} style={{ background: '#22c55e', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 10px', fontWeight: 700, cursor: 'pointer' }}>Connect</button>
                </div>
              </div>
              <div>
                <label style={{ color: '#cbd5e1', fontWeight: 600 }}>Salesforce</label>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <input value={integrationForm.salesforceToken} onChange={e => setIntegrationForm({ ...integrationForm, salesforceToken: e.target.value })} placeholder="Token" style={{ flex: 1, minWidth: 160, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
                  <input value={integrationForm.salesforceInstance} onChange={e => setIntegrationForm({ ...integrationForm, salesforceInstance: e.target.value })} placeholder="Instance URL" style={{ flex: 1, minWidth: 160, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
                  <button onClick={handleConnectSalesforce} disabled={loading} style={{ background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 10px', fontWeight: 700, cursor: 'pointer' }}>Connect</button>
                </div>
              </div>
              <div>
                <label style={{ color: '#cbd5e1', fontWeight: 600 }}>HubSpot</label>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <input value={integrationForm.hubspotToken} onChange={e => setIntegrationForm({ ...integrationForm, hubspotToken: e.target.value })} placeholder="Token" style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
                  <button onClick={handleConnectHubspot} disabled={loading} style={{ background: '#f97316', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 10px', fontWeight: 700, cursor: 'pointer' }}>Connect</button>
                </div>
              </div>
              <div>
                <label style={{ color: '#cbd5e1', fontWeight: 600 }}>Zapier</label>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <input value={integrationForm.zapierHook} onChange={e => setIntegrationForm({ ...integrationForm, zapierHook: e.target.value })} placeholder="Hook URL" style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
                  <button onClick={handleConnectZapier} disabled={loading} style={{ background: '#fbbf24', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 10px', fontWeight: 700, cursor: 'pointer' }}>Connect</button>
                </div>
              </div>
              <div>
                <label style={{ color: '#cbd5e1', fontWeight: 600 }}>Snowflake</label>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <input value={integrationForm.snowflakeAccount} onChange={e => setIntegrationForm({ ...integrationForm, snowflakeAccount: e.target.value })} placeholder="Account" style={{ flex: 1, minWidth: 120, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
                  <input value={integrationForm.snowflakeUser} onChange={e => setIntegrationForm({ ...integrationForm, snowflakeUser: e.target.value })} placeholder="User" style={{ flex: 1, minWidth: 120, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
                  <input value={integrationForm.snowflakeWarehouse} onChange={e => setIntegrationForm({ ...integrationForm, snowflakeWarehouse: e.target.value })} placeholder="Warehouse" style={{ flex: 1, minWidth: 120, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
                  <input value={integrationForm.snowflakeDatabase} onChange={e => setIntegrationForm({ ...integrationForm, snowflakeDatabase: e.target.value })} placeholder="Database" style={{ flex: 1, minWidth: 120, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
                  <input value={integrationForm.snowflakeSchema} onChange={e => setIntegrationForm({ ...integrationForm, snowflakeSchema: e.target.value })} placeholder="Schema" style={{ flex: 1, minWidth: 120, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
                  <input value={integrationForm.snowflakeRole} onChange={e => setIntegrationForm({ ...integrationForm, snowflakeRole: e.target.value })} placeholder="Role" style={{ flex: 1, minWidth: 120, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
                  <button onClick={handleConnectSnowflake} disabled={loading} style={{ background: '#c084fc', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 10px', fontWeight: 700, cursor: 'pointer' }}>Connect</button>
                </div>
              </div>
              <div>
                <label style={{ color: '#cbd5e1', fontWeight: 600 }}>BigQuery</label>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <input value={integrationForm.bqProject} onChange={e => setIntegrationForm({ ...integrationForm, bqProject: e.target.value })} placeholder="Project" style={{ flex: 1, minWidth: 140, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
                  <input value={integrationForm.bqDataset} onChange={e => setIntegrationForm({ ...integrationForm, bqDataset: e.target.value })} placeholder="Dataset" style={{ flex: 1, minWidth: 140, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
                  <button onClick={handleConnectBigQuery} disabled={loading} style={{ background: '#06b6d4', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 10px', fontWeight: 700, cursor: 'pointer' }}>Connect</button>
                </div>
              </div>
              <div>
                <label style={{ color: '#cbd5e1', fontWeight: 600 }}>Slack</label>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <input value={integrationForm.slackToken} onChange={e => setIntegrationForm({ ...integrationForm, slackToken: e.target.value })} placeholder="Token" style={{ flex: 1, minWidth: 140, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
                  <input value={integrationForm.slackChannel} onChange={e => setIntegrationForm({ ...integrationForm, slackChannel: e.target.value })} placeholder="#channel" style={{ flex: 1, minWidth: 140, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
                  <button onClick={handleConnectSlack} disabled={loading} style={{ background: '#64748b', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 10px', fontWeight: 700, cursor: 'pointer' }}>Connect</button>
                </div>
              </div>
              <div>
                <label style={{ color: '#cbd5e1', fontWeight: 600 }}>Twilio / SMS</label>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <input value={integrationForm.twilioAccountSid} onChange={e => setIntegrationForm({ ...integrationForm, twilioAccountSid: e.target.value })} placeholder="Account SID" style={{ flex: 1, minWidth: 140, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
                  <input value={integrationForm.twilioAuthToken} onChange={e => setIntegrationForm({ ...integrationForm, twilioAuthToken: e.target.value })} placeholder="Auth Token" style={{ flex: 1, minWidth: 140, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
                  <input value={integrationForm.twilioFrom} onChange={e => setIntegrationForm({ ...integrationForm, twilioFrom: e.target.value })} placeholder="From Number" style={{ flex: 1, minWidth: 140, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
                  <button onClick={handleConnectTwilio} disabled={loading} style={{ background: '#f87171', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 10px', fontWeight: 700, cursor: 'pointer' }}>Connect</button>
                </div>
              </div>
              <div>
                <label style={{ color: '#cbd5e1', fontWeight: 600 }}>WhatsApp</label>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <input value={integrationForm.whatsappNumber} onChange={e => setIntegrationForm({ ...integrationForm, whatsappNumber: e.target.value })} placeholder="Number" style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
                  <button onClick={handleConnectWhatsApp} disabled={loading} style={{ background: '#22c55e', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 10px', fontWeight: 700, cursor: 'pointer' }}>Connect</button>
                </div>
              </div>
              <div>
                <label style={{ color: '#cbd5e1', fontWeight: 600 }}>Push</label>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <input value={integrationForm.pushApiKey} onChange={e => setIntegrationForm({ ...integrationForm, pushApiKey: e.target.value })} placeholder="API Key" style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
                  <button onClick={handleConnectPush} disabled={loading} style={{ background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 10px', fontWeight: 700, cursor: 'pointer' }}>Connect</button>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 10, background: '#0f172a', borderRadius: 8, padding: 8, border: '1px solid #1e293b', color: '#cbd5e1', maxHeight: 140, overflowY: 'auto' }}>
              <div style={{ fontWeight: 700, marginBottom: 6, color: '#7dd3fc' }}>Connected</div>
              {Object.keys(connectorsState || {}).length === 0 ? <div style={{ color: '#94a3b8' }}>No connectors yet.</div> : (
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {Object.entries(connectorsState).map(([k, v]) => (
                    <li key={k} style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: '#e0e7ff' }}>{k}</span> · updated {v?.updatedAt ? new Date(v.updatedAt).toLocaleString() : 'n/a'}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div style={{ marginTop: 12, background: '#0b1220', borderRadius: 10, padding: 10, border: '1px solid #334155' }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#e0e7ff' }}>Analytics: Cohort & Attribution</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <button onClick={handleFetchCohorts} disabled={loading} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>Refresh Cohorts</button>
              <button onClick={handleFetchAttribution} disabled={loading} style={{ background: '#34d399', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>Refresh Attribution</button>
              <button onClick={handleFetchExperimentResults} disabled={loading} style={{ background: '#fde047', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>Experiments</button>
              <button onClick={handleWidgets} disabled={loading} style={{ background: '#06b6d4', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>Widgets</button>
            </div>
            <div style={{ marginBottom: 8, color: '#e0e7ff' }}>Cohorts</div>
            {cohorts.length === 0 ? <div style={{ color: '#94a3b8' }}>No cohorts yet.</div> : (
              <ul style={{ margin: 0, paddingLeft: 16, color: '#cbd5e1' }}>
                {cohorts.map((c, idx) => (
                  <li key={idx}>{c.cohort} — {c.count}</li>
                ))}
              </ul>
            )}
            <div style={{ marginTop: 10, marginBottom: 6, color: '#e0e7ff' }}>Attribution</div>
            {attribution.length === 0 ? <div style={{ color: '#94a3b8' }}>No attribution yet.</div> : (
              <ul style={{ margin: 0, paddingLeft: 16, color: '#cbd5e1' }}>
                {attribution.map((s, idx) => (
                  <li key={idx}>{s.source}: ${s.revenue || 0} · conv {s.conversions || 0} · events {s.count || 0}</li>
                ))}
              </ul>
            )}
            <div style={{ marginTop: 10, marginBottom: 6, color: '#e0e7ff' }}>Experiment Results</div>
            {experimentResults.length === 0 ? <div style={{ color: '#94a3b8' }}>No experiments yet.</div> : (
              <ul style={{ margin: 0, paddingLeft: 16, color: '#cbd5e1' }}>
                {experimentResults.map((r, idx) => (
                  <li key={idx}>{r.variant}: {r.impressions || 0} imp · {r.conversions || 0} conv · ${r.revenue || 0}</li>
                ))}
              </ul>
            )}
          </div>
          <div style={{ marginTop: 12, background: '#0b1220', borderRadius: 10, padding: 10, border: '1px solid #334155' }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#e0e7ff' }}>Consent & Ingest</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <input value={consentUser} onChange={e => setConsentUser(e.target.value)} placeholder="User id" style={{ flex: 1, minWidth: 140, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
              <select value={consentValue} onChange={e => setConsentValue(e.target.value)} style={{ minWidth: 140, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }}>
                <option value="granted">Granted</option>
                <option value="revoked">Revoked</option>
                <option value="pending">Pending</option>
              </select>
              <button onClick={handleConsentSync} disabled={loading} style={{ background: '#22c55e', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>Sync Consent</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <input value={ingestSource} onChange={e => setIngestSource(e.target.value)} placeholder="Event source" style={{ flex: 1, minWidth: 140, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
              <input type="number" value={ingestRevenue} onChange={e => setIngestRevenue(e.target.value)} placeholder="Revenue" style={{ width: 120, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e0e7ff' }} />
              <button onClick={handleIngestEvent} disabled={loading} style={{ background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>Ingest Event</button>
            </div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>PII is hashed before storage.</div>
          </div>
          <div style={{ marginTop: 12, background: '#0b1220', borderRadius: 10, padding: 10, border: '1px solid #334155' }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#e0e7ff' }}>Regression Tests & Approvals</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <button onClick={handleAddTestCase} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>Add Test</button>
              <button onClick={handleRunTests} style={{ background: '#22c55e', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>Run Tests</button>
              <button onClick={handleApprove} disabled={loading} style={{ background: '#34d399', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>Approve (quick)</button>
            </div>
            {regressionTests.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 16, color: '#cbd5e1' }}>
                {regressionTests.map((t, idx) => (
                  <li key={idx}>{t.name}: expect {t.expected} (input {t.input})</li>
                ))}
              </ul>
            )}
            {regressionResult && <div style={{ marginTop: 6, color: '#7dd3fc' }}>Tests: {regressionResult.passed} passed, {regressionResult.failed} failed at {new Date(regressionResult.ts).toLocaleTimeString()}</div>}
            {approvalQueue.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 4, color: '#fbbf24' }}>Approval Queue</div>
                <ul style={{ margin: 0, paddingLeft: 16, color: '#cbd5e1' }}>
                  {approvalQueue.map(a => (
                    <li key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>Flow {a.flowId} — {a.status}</span>
                      {a.status === 'pending' && <button onClick={() => handleApproveFlow(a.id)} style={{ background: '#22c55e', color: '#0f172a', border: 'none', borderRadius: 6, padding: '4px 8px', fontWeight: 700, cursor: 'pointer' }}>Approve</button>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div style={{ marginTop: 12, background: '#0b1220', borderRadius: 10, padding: 10, border: '1px solid #334155' }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#e0e7ff' }}>Custom Metrics / Events</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <button onClick={handleAddMetric} style={{ background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>Add Metric</button>
            </div>
            {customMetrics.length === 0 ? <div style={{ color: '#94a3b8' }}>No custom metrics yet.</div> : (
              <ul style={{ margin: 0, paddingLeft: 16, color: '#cbd5e1' }}>
                {customMetrics.map((m, idx) => (
                  <li key={idx}>{m.name} — target {m.target}</li>
                ))}
              </ul>
            )}
          </div>
          <div style={{ marginTop: 12, background: '#0b1220', borderRadius: 10, padding: 10, border: '1px solid #334155' }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#e0e7ff' }}>Custom Nodes & Brands</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <button onClick={handleCustomNodesFetch} style={{ background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>Refresh Nodes</button>
              <button onClick={handleCustomNodeCreate} style={{ background: '#22c55e', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>Add Node</button>
              <button onClick={handleBrandsFetch} style={{ background: '#a855f7', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>Refresh Brands</button>
              <button onClick={handleBrandCreate} style={{ background: '#f97316', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>Add Brand</button>
            </div>
            {customNodesList.length > 0 ? (
              <div style={{ marginBottom: 8, color: '#e0e7ff' }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Custom Nodes</div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {customNodesList.map((n) => (
                    <li key={n.id}>{n.name || n.id} — {n.type || 'action'}</li>
                  ))}
                </ul>
              </div>
            ) : <div style={{ color: '#94a3b8', marginBottom: 8 }}>No custom nodes yet.</div>}
            {brandsList.length > 0 ? (
              <div style={{ marginBottom: 8, color: '#e0e7ff' }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Brands</div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {brandsList.map((b) => (
                    <li key={b.id}>{b.name} {b.domains?.length ? `(${b.domains.join(', ')})` : ''}</li>
                  ))}
                </ul>
              </div>
            ) : <div style={{ color: '#94a3b8' }}>No brands yet.</div>}
          </div>
          <div style={{ marginTop: 12, background: '#0b1220', borderRadius: 10, padding: 10, border: '1px solid #334155' }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#e0e7ff' }}>Rollback Preview</div>
            <button onClick={handleRollbackPreview} disabled={!flowVersions.length} style={{ background: '#1f2937', color: '#e0e7ff', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer', opacity: (!flowVersions.length ? 0.6 : 1), marginBottom: 8 }}>Preview Latest</button>
            {versionDiff && (
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: '#cbd5e1' }}>{versionDiff}</pre>
            )}
          </div>
          <div style={{ marginTop: 12, background: '#0b1220', borderRadius: 10, padding: 10, border: '1px solid #334155' }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#e0e7ff' }}>Ops & Validation</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <button title="Fetch recent errors/status" onClick={handleFlowHealth} disabled={loading || !selectedFlowId} style={{ background: '#22c55e', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer', opacity: (!selectedFlowId ? 0.6 : 1) }}>Health</button>
              <button title="Summary of sends/conversions/errors" onClick={handleFlowReport} disabled={loading || !selectedFlowId} style={{ background: '#7dd3fc', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer', opacity: (!selectedFlowId ? 0.6 : 1) }}>Report</button>
              <button title="Create a version snapshot" onClick={handleSnapshot} disabled={loading || !selectedFlowId} style={{ background: '#c084fc', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer', opacity: (!selectedFlowId ? 0.6 : 1) }}>Snapshot</button>
              <button title="List saved versions" onClick={handleVersionsFetch} disabled={loading || !selectedFlowId} style={{ background: '#a3e635', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer', opacity: (!selectedFlowId ? 0.6 : 1) }}>Versions</button>
              <button title="Rollback to a chosen version" onClick={handleRollback} disabled={loading || !selectedFlowId} style={{ background: '#f87171', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer', opacity: (!selectedFlowId ? 0.6 : 1) }}>Rollback</button>
              <button title="View inter-flow dependencies" onClick={handleDependencies} disabled={loading} style={{ background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>Dependencies</button>
              <button title="Journey overview" onClick={handleJourneys} disabled={loading} style={{ background: '#06b6d4', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>Journeys</button>
              <button title="Preview multi-channel send plan" onClick={handleOrchestrate} disabled={loading || !selectedFlowId} style={{ background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer', opacity: (!selectedFlowId ? 0.6 : 1) }}>Orchestrate</button>
              <button title="Run TCPA/GDPR checks for this flow" onClick={handleComplianceScan} disabled={loading || !selectedFlowId} style={{ background: '#fbbf24', color: '#0f172a', border: 'none', borderRadius: 6, padding: '7px 12px', fontWeight: 700, cursor: 'pointer', opacity: (!selectedFlowId ? 0.6 : 1) }}>Compliance Scan</button>
            </div>
            {flowVersions.length > 0 && (
              <div style={{ marginBottom: 8, color: '#e0e7ff' }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Versions</div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {flowVersions.map((v, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>v{v.version} — {new Date(v.ts).toLocaleString()}</span>
                      <button onClick={() => handleVersionDiff(v)} style={{ background: '#1e3a3f', color: '#e0e7ff', border: 'none', borderRadius: 6, padding: '4px 8px', fontWeight: 600, cursor: 'pointer' }}>Diff</button>
                    </li>
                  ))}
                </ul>
                {versionDiff && (
                  <div style={{ marginTop: 8, background: '#0f172a', borderRadius: 8, padding: 8, border: '1px solid #334155' }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Diff vs {selectedVersion}</div>
                    <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{versionDiff}</pre>
                  </div>
                )}
              </div>
            )}
            {flowDependencies.length > 0 && (
              <div style={{ marginBottom: 8, color: '#e0e7ff' }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Dependencies</div>
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(flowDependencies, null, 2)}</pre>
              </div>
            )}
            {journeys.length > 0 && (
              <div style={{ marginBottom: 8, color: '#e0e7ff' }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Journeys</div>
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(journeys, null, 2)}</pre>
              </div>
            )}
            {complianceScan && (
              <div style={{ marginBottom: 8, color: '#e0e7ff' }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Compliance Scan</div>
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(complianceScan, null, 2)}</pre>
              </div>
            )}
            {orchestrationResult && (
              <div style={{ marginBottom: 8, color: '#e0e7ff' }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Orchestration</div>
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(orchestrationResult, null, 2)}</pre>
              </div>
            )}
          </div>
          <div style={{ marginTop: 18 }}>
            <button onClick={() => setShowOnboarding(true)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Show Onboarding</button>
          </div>
          <div style={{ marginTop: 18, fontSize: 13, color: "#cbd5e1" }}>
            <div>Integrations: <span style={{ fontWeight: 600 }}>Klaviyo</span>, <span style={{ fontWeight: 600 }}>Shopify</span></div>
            <div>Accessibility: <span style={{ fontWeight: 600 }}>WCAG 2.1</span> | <span style={{ fontWeight: 600 }}>Keyboard Shortcuts</span></div>
            <div>Compliance: <span style={{ fontWeight: 600 }}>GDPR</span>, <span style={{ fontWeight: 600 }}>SOC2</span></div>
          </div>
          <div style={{ marginTop: 14, fontSize: 13, color: '#cbd5e1', background: '#1f2937', borderRadius: 10, padding: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: '#06b6d4' }}>Status</div>
            <div>API: <span style={{ fontWeight: 800, color: '#22c55e' }}>Healthy</span></div>
            <div>Last Sync: <span style={{ fontWeight: 700 }}>Live</span></div>
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: '#cbd5e1', background: '#1e3a3f', borderRadius: 10, padding: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: '#06b6d4' }}>Checklist</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Set triggers & actions</li>
              <li>Sync Klaviyo credentials</li>
              <li>Test on staging</li>
              <li>Enable notifications</li>
            </ul>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 32, fontSize: 13, color: "#cbd5e1", textAlign: "center" }}>
        <span>Best-in-class SaaS features. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: "#06b6d4", textDecoration: "underline" }}>Contact Support</a></span>
      </div>
    </div>
  );
}
