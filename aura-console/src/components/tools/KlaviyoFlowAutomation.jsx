
import React, { useState, useRef, useEffect } from "react";

function VisualFlowBuilder({ flow, setFlow, nodes = [], setNodes }) {
  return (
    <div style={{ border: "1px solid #d1d5db", borderRadius: 10, padding: 18, background: "#f9fafb", marginBottom: 18 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Visual Flow Builder (Drag & Drop)</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <button onClick={() => setNodes([...nodes, { id: Date.now(), label: 'Step', type: 'step' }])} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Add Step</button>
        <button onClick={() => setNodes([...nodes, { id: Date.now(), label: 'Trigger', type: 'trigger' }])} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Add Trigger</button>
        <button onClick={() => setNodes([...nodes, { id: Date.now(), label: 'Action', type: 'action' }])} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Add Action</button>
      </div>
      <div style={{ minHeight: 120, border: '1px dashed #bbb', borderRadius: 8, padding: 12, background: '#fff', marginBottom: 12 }}>
        {nodes.length ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {nodes.map((n, i) => (
              <li key={n.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, color: n.type === 'step' ? '#0ea5e9' : n.type === 'trigger' ? '#22c55e' : '#6366f1' }}>{n.label}</span>
                <button onClick={() => setNodes(nodes.filter((_, idx) => idx !== i))} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 10px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Remove</button>
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
    setFlow(tpl.flow);
    setNodes([
      { id: Date.now() + 1, label: "Trigger", type: "trigger", channel: "email" },
      { id: Date.now() + 2, label: "Branch", type: "step", channel: "email" },
      { id: Date.now() + 3, label: "Action", type: "action", channel: "sms" }
    ]);
  };

  const addChannelNode = (channel, kind = "action") => {
    setNodes(prev => [...prev, { id: Date.now(), label: `${channel} ${kind}`, type: kind, channel }]);
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
    setAnalytics(null);
    try {
      const data = await api('/ai/automate', { method: 'POST', body: JSON.stringify({ flow }) });
      setAnalytics(data.analytics || { summary: "No analytics available" });
      setRunHistory((prev) => [{ ts: new Date().toISOString(), result: "success" }, ...prev].slice(0, 5));
    } catch (err) {
      setError(err.message);
      setRunHistory((prev) => [{ ts: new Date().toISOString(), result: "error" }, ...prev].slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  // Import/Export
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      setFlow(evt.target.result);
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
      setFlow("");
      setNodes([]);
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
      setFlow(f.flow || "");
      setNodes(f.nodes || []);
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
    if (name && !collaborators.includes(name)) setCollaborators([...collaborators, name]);
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
      if (e.ctrlKey && e.key === "i") fileInputRef.current?.click();
      if (e.ctrlKey && e.key === "e") handleExport();
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
      <div style={{ marginBottom: 14, color: "#06b6d4", fontWeight: 600, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span role="img" aria-label="bolt">⚡</span> Build, automate, and analyze Klaviyo flows with AI, analytics, and team collaboration.
        <span style={{ padding: "6px 10px", borderRadius: 999, background: "#1e3a3f", color: "#06b6d4", fontWeight: 700 }}>Live</span>
        <span style={{ padding: "6px 10px", borderRadius: 999, background: "#1f2937", color: "#34d399", fontWeight: 700 }}>Compliance: GDPR | SOC2</span>
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 2, minWidth: 320 }}>
          {showOnboarding && onboardingContent}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            {templates.map(tpl => (
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
          <VisualFlowBuilder flow={flow} setFlow={setFlow} nodes={nodes} setNodes={setNodes} />
          <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            <button onClick={handleAISuggest} disabled={loading || !flow} style={{ background: "#a3e635", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{loading ? "Thinking..." : "AI Suggest"}</button>
            <button onClick={handleRun} disabled={loading || !flow} style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{loading ? "Running..." : "Run Automation"}</button>
            <button onClick={handlePredict} disabled={loading} style={{ background: "#c084fc", color: "#0f172a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Predict</button>
            <button onClick={handleContentVariants} disabled={loading} style={{ background: "#f472b6", color: "#0f172a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Content Variants</button>
            <button onClick={handleRecommendations} disabled={loading} style={{ background: "#38bdf8", color: "#0f172a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Recs</button>
            <button onClick={handleDynamicRender} disabled={loading} style={{ background: "#f59e0b", color: "#0f172a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Dynamic Render</button>
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
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 600, marginBottom: 2, color: "#e0e7ff" }}>Collaborators:</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1" }}>
              {collaborators.map(c => <li key={c}>{c}</li>)}
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
