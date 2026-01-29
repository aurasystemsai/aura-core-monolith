import React, { useState, useEffect } from "react";
import { Card, Button, Table, Modal, Input, Select, Switch, Tooltip, notification, Tabs, Progress, Tag } from "antd";
import { DownloadOutlined, PlusOutlined, BellOutlined, BarChartOutlined, InfoCircleOutlined, ReloadOutlined, QuestionCircleOutlined, ShareAltOutlined, SettingOutlined } from "@ant-design/icons";

const alertTypes = [
  { label: "Threshold", value: "threshold" },
  { label: "Anomaly", value: "anomaly" },
  { label: "Scheduled", value: "scheduled" },
];

const defaultAlerts = [
  { id: 1, name: "Revenue Drop", type: "anomaly", active: true, lastTriggered: "2026-01-03", recipients: ["ops@brand.com"] },
  { id: 2, name: "Weekly Report", type: "scheduled", active: true, lastTriggered: "2026-01-01", recipients: ["ceo@brand.com"] },
];

export default function ReportingAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", type: "threshold", recipients: "", active: true });
  const [analytics, setAnalytics] = useState({ triggered: 12, resolved: 10, avgResponse: 2.1 });
  const [onboarding, setOnboarding] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [tab, setTab] = useState("alerts");
  const [history, setHistory] = useState([]);
  const [env, setEnv] = useState("dev");
  const devSandbox = env === "dev";
  const [syncHealth, setSyncHealth] = useState({ status: "healthy", lastSuccess: Date.now(), lastError: null });
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [simResult, setSimResult] = useState(null);
  const [confirmProd, setConfirmProd] = useState(false);
  const [routingPreset, setRoutingPreset] = useState("high-sms-slack");
  const [cooldownMinutes, setCooldownMinutes] = useState(10);
  const [dedupeMinutes, setDedupeMinutes] = useState(5);
  const [snoozedUntil, setSnoozedUntil] = useState(null);
  const [shop, setShop] = useState("demo-shop.myshopify.com");
  const [quietHours, setQuietHours] = useState({ start: "22:00", end: "06:00", tz: "UTC" });
  const [maintenance, setMaintenance] = useState({ window: "Sun 02:00-03:00", active: false });
  const [escalationPolicy, setEscalationPolicy] = useState([
    { channel: "email", after: 0 },
    { channel: "slack", after: 10 },
    { channel: "sms", after: 20 }
  ]);
  const [traceEvents, setTraceEvents] = useState([]);
  const [showDebug, setShowDebug] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [destructiveEnabled, setDestructiveEnabled] = useState(false);
  const [auditLog, setAuditLog] = useState([]);

  useEffect(() => {
    // Simulate fetch
    setLoading(true);
    setTimeout(() => {
      setAlerts(defaultAlerts);
      setLoading(false);
      setHistory([{ summary: "Loaded defaults", at: Date.now(), env }]);
    }, 500);
  }, []);

  const recordTrace = (event, meta = {}) => {
    setTraceEvents(prev => [{ event, meta, at: Date.now(), env, shop }, ...prev].slice(0, 12));
    setAuditLog(prev => [{ event, meta, at: Date.now(), env, shop }, ...prev].slice(0, 24));
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        openModal();
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setShowDebug(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const quickFixForIssue = (msg = "") => {
    const lower = msg.toLowerCase();
    if (lower.includes("recipient")) return "sanitize";
    if (lower.includes("network")) return "retry";
    return null;
  };

  const openModal = (alert = null) => {
    setEditing(alert);
    setForm(alert ? { ...alert, recipients: alert.recipients.join(", ") } : { name: "", type: "threshold", recipients: "", active: true });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.recipients) {
      notification.error({ message: "Name and recipients required" });
      return;
    }
    if (env === 'prod' && !confirmProd) {
      notification.warning({ message: "Confirm prod change", description: "Toggle confirm to edit in Prod." });
      return;
    }
    const recipientsArr = form.recipients.split(",").map(r => r.trim()).filter(Boolean);
    const invalidRecipients = recipientsArr.filter(r => !r.includes("@"));
    if (invalidRecipients.length) {
      notification.error({ message: "Invalid recipient email(s)", description: invalidRecipients.join(", ") });
      setFeedbackError("Recipients must be valid emails");
      return;
    }
    if (editing) {
      setAlerts(alerts.map(a => a.id === editing.id ? { ...form, id: editing.id, recipients: recipientsArr } : a));
      notification.success({ message: "Alert updated" });
      setHistory(h => [{ summary: `Updated alert: ${form.name}`, at: Date.now(), env }, ...h].slice(0, 6));
      recordTrace('alert_updated', { id: editing.id, name: form.name });
    } else {
      setAlerts([...alerts, { ...form, id: Date.now(), recipients: recipientsArr }]);
      notification.success({ message: "Alert created" });
      setHistory(h => [{ summary: `Created alert: ${form.name}`, at: Date.now(), env }, ...h].slice(0, 6));
      recordTrace('alert_created', { name: form.name });
    }
    setSyncHealth({ status: "healthy", lastSuccess: Date.now(), lastError: null });
    setModalOpen(false);
    setEditing(null);
    setForm({ name: "", type: "threshold", recipients: "", active: true });
  };

  const handleDelete = (id) => {
    if (!destructiveEnabled) {
      notification.warning({ message: "Destructive disabled", description: "Toggle destructive actions to delete." });
      return;
    }
    const removed = alerts.find(a => a.id === id);
    setUndoStack(prev => [{ type: 'alert', data: removed }, ...prev].slice(0, 3));
    setAlerts(alerts.filter(a => a.id !== id));
    notification.info({ message: "Alert deleted" });
    setHistory(h => [{ summary: `Deleted alert ${id}`, at: Date.now(), env }, ...h].slice(0, 6));
    recordTrace('alert_deleted', { id });
  };

  const handleExport = () => {
    if (devSandbox) {
      notification.warning({ message: "Sandbox mode", description: "Export disabled in Dev. Switch to Stage/Prod." });
      return;
    }
    setExporting(true);
    setTimeout(() => {
      notification.success({ message: "Alerts exported as CSV" });
      setExporting(false);
      setHistory(h => [{ summary: "Exported alerts", at: Date.now(), env }, ...h].slice(0, 6));
      setSyncHealth({ status: "healthy", lastSuccess: Date.now(), lastError: null });
      recordTrace('export_alerts', { count: alerts.length });
    }, 800);
  };

  const simulateAlert = () => {
    setSimResult({ fired: Math.random() > 0.4, severity: form.type === 'anomaly' ? 'high' : 'medium', sample: form.name || 'Unnamed alert' });
    setHistory(h => [{ summary: `Simulated alert: ${form.name || 'Untitled'}`, at: Date.now(), env }, ...h].slice(0, 6));
    recordTrace('simulate_alert', { name: form.name });
  };

  const applyPreset = (value) => {
    setRoutingPreset(value);
    setHistory(h => [{ summary: `Routing preset: ${value}`, at: Date.now(), env }, ...h].slice(0, 6));
    recordTrace('routing_preset', { preset: value });
  };

  const handleFeedback = async () => {
    if (!feedbackText) return;
    setFeedbackError("");
    if (devSandbox) {
      setFeedbackError("Sandbox mode: switch to Stage/Prod to submit feedback.");
      return;
    }
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      notification.success({ message: "Feedback sent" });
      setFeedbackText("");
      setHistory(h => [{ summary: "Feedback submitted", at: Date.now(), env }, ...h].slice(0, 6));
      recordTrace('feedback_sent', {});
    } catch (err) {
      setFeedbackError("Network error while sending feedback");
    }
  };

  const undoLast = () => {
    const item = undoStack[0];
    if (!item) return;
    if (item.type === 'alert') {
      setAlerts(prev => [...prev, item.data]);
      recordTrace('undo_alert', { id: item.data?.id });
    }
    setUndoStack(prev => prev.slice(1));
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name", render: (t, r) => <b>{t}</b> },
    { title: "Type", dataIndex: "type", key: "type", render: t => <Tag color={t === "anomaly" ? "red" : t === "scheduled" ? "blue" : "gold"}>{t}</Tag> },
    { title: "Active", dataIndex: "active", key: "active", render: t => <Switch checked={t} disabled /> },
    { title: "Recipients", dataIndex: "recipients", key: "recipients", render: arr => arr.join(", ") },
    { title: "Last Triggered", dataIndex: "lastTriggered", key: "lastTriggered" },
    {
      title: "Actions", key: "actions", render: (_, r) => (
        <>
          <Tooltip title="Edit"><Button icon={<SettingOutlined />} size="small" onClick={() => openModal(r)} /></Tooltip>
          <Tooltip title="Delete"><Button danger size="small" style={{ marginLeft: 8 }} onClick={() => handleDelete(r.id)}>Delete</Button></Tooltip>
        </>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      {devSandbox && (
        <Card style={{ marginBottom: 12, background: "#0b1221", borderColor: "#1f2937" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 800, color: '#f59e0b' }}>Sandbox mode</div>
              <div style={{ color: '#9ca3af' }}>Exports and feedback are blocked. Switch env to Stage/Prod.</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => setEnv('stage')}>Stage</Button>
              <Button type="primary" onClick={() => setEnv('prod')}>Prod</Button>
            </div>
          </div>
        </Card>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <Select value={env} onChange={setEnv} options={[{ value: 'dev', label: 'Dev' }, { value: 'stage', label: 'Stage' }, { value: 'prod', label: 'Prod' }]} style={{ width: 140 }} />
        <Select value={shop} onChange={setShop} options={[{ value: 'demo-shop.myshopify.com', label: 'demo-shop.myshopify.com' }, { value: 'staging-shop.myshopify.com', label: 'staging-shop.myshopify.com' }]} style={{ width: 220 }} />
        <Card style={{ flex: 1, minWidth: 260, marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700 }}>Sync health</div>
              <div style={{ color: '#6b7280', fontSize: 12 }}>Last success {syncHealth.lastSuccess ? new Date(syncHealth.lastSuccess).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
            </div>
            <Tag color={syncHealth.status === 'healthy' ? 'green' : 'red'}>{syncHealth.status}</Tag>
          </div>
          {syncHealth.lastError && <div style={{ color: '#ef4444', marginTop: 6 }}>{syncHealth.lastError}</div>}
        </Card>
        <Card style={{ minWidth: 220, marginBottom: 0 }}>
          <div style={{ fontWeight: 700 }}>Safety</div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>Protect deletes and allow undo</div>
          <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Switch checked={destructiveEnabled} onChange={setDestructiveEnabled} checkedChildren="Destructive on" unCheckedChildren="Locked" />
            <Button size="small" disabled={!undoStack.length} onClick={undoLast}>Undo</Button>
          </div>
        </Card>
      </div>
      <Card
        title={<span><BellOutlined /> Reporting Alerts</span>}
        extra={<>
          <Tooltip title="Export Alerts"><Button icon={<DownloadOutlined />} loading={exporting} onClick={handleExport} /></Tooltip>
          <Tooltip title="Export audit log"><Button icon={<DownloadOutlined />} style={{ marginLeft: 8 }} onClick={() => {
            const blob = new Blob([JSON.stringify(auditLog, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'alerts-audit.json';
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 8000);
            recordTrace('audit_export', { count: auditLog.length });
          }} />
          </Tooltip>
          <Tooltip title="Add Alert"><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()} style={{ marginLeft: 8 }}>Add</Button></Tooltip>
        </>}
        style={{ marginBottom: 24 }}
      >
        <Tabs activeKey={tab} onChange={setTab}>
          <Tabs.TabPane tab={<span><BarChartOutlined /> Alerts</span>} key="alerts">
            <Table
              columns={columns}
              dataSource={alerts}
              rowKey="id"
              loading={loading}
              pagination={false}
              style={{ marginBottom: 16 }}
              scroll={{ y: 320 }}
              sticky
              locale={{ emptyText: devSandbox ? "Sandbox: create or import alerts" : "No alerts yet" }}
            />
            <div style={{ marginTop: 16, display: "flex", gap: 24 }}>
              <div>
                <b>Triggered:</b> <span>{analytics.triggered}</span>
                <Progress percent={Math.round((analytics.triggered / 20) * 100)} size="small" status="active" />
              </div>
              <div>
                <b>Resolved:</b> <span>{analytics.resolved}</span>
                <Progress percent={Math.round((analytics.resolved / 20) * 100)} size="small" status="success" />
              </div>
              <div>
                <b>Avg Response (hrs):</b> <span>{analytics.avgResponse}</span>
              </div>
              <div>
                <b>Recommendation:</b> <span>Suggested threshold: 95th percentile</span>
              </div>
            </div>
            <div style={{ marginTop: 12, background: '#0b1221', padding: 10, borderRadius: 8, border: '1px solid #1f2937' }}>
              <div style={{ fontWeight: 700, color: '#e5e7eb' }}>Severity routing</div>
              <Select size="small" value={routingPreset} onChange={applyPreset} style={{ width: 240, marginTop: 6 }}
                options={[
                  { value: 'high-sms-slack', label: 'High: SMS + Slack + Email' },
                  { value: 'medium-slack-email', label: 'Medium: Slack + Email' },
                  { value: 'low-email', label: 'Low: Email only' }
                ]}
              />
              <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap', color: '#e5e7eb', fontSize: 13 }}>
                <div>Cooldown (min): <input type="number" min="1" value={cooldownMinutes} onChange={e => setCooldownMinutes(Number(e.target.value) || 1)} style={{ width: 70 }} /></div>
                <div>Dedupe window (min): <input type="number" min="1" value={dedupeMinutes} onChange={e => setDedupeMinutes(Number(e.target.value) || 1)} style={{ width: 70 }} /></div>
                <Button size="small" onClick={() => setSnoozedUntil(new Date(Date.now() + 60 * 60 * 1000))}>Snooze 1h</Button>
                {snoozedUntil && <span style={{ color: '#fbbf24' }}>Snoozed until {snoozedUntil.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap', color: '#e5e7eb', fontSize: 13 }}>
                <div>Quiet hours: <input value={quietHours.start} onChange={e => setQuietHours(q => ({ ...q, start: e.target.value }))} style={{ width: 70 }} /> - <input value={quietHours.end} onChange={e => setQuietHours(q => ({ ...q, end: e.target.value }))} style={{ width: 70 }} /> {quietHours.tz}</div>
                <div>Maintenance: <Switch size="small" checked={maintenance.active} onChange={v => setMaintenance(m => ({ ...m, active: v }))} /> {maintenance.window}</div>
              </div>
            </div>
            <div style={{ marginTop: 12, background: '#f8fafc', padding: 10, borderRadius: 8 }}>
              <div style={{ fontWeight: 600 }}>Escalation policy</div>
              <div style={{ color: '#475569', fontSize: 13 }}>Severity high → Email → Slack → SMS fallback</div>
              <div style={{ marginTop: 6, display: 'grid', gap: 6 }}>
                {escalationPolicy.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#111827', fontWeight: 600 }}>{step.channel}</span>
                    <span style={{ color: '#475569', fontSize: 12 }}>after {step.after} min</span>
                  </div>
                ))}
              </div>
              <Button size="small" icon={<ReloadOutlined />} style={{ marginTop: 6 }} onClick={() => { notification.info({ message: 'Escalation simulated' }); recordTrace('escalation_simulated', { policy: escalationPolicy.length }); }}>Test escalation</Button>
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane tab={<span><InfoCircleOutlined /> Onboarding</span>} key="onboarding">
            <div style={{ padding: 24 }}>
              <h3>How to Use Reporting Alerts</h3>
              <ol>
                <li>Click <b>Add</b> to create a new alert.</li>
                <li>Choose alert type: threshold, anomaly, or scheduled.</li>
                <li>Set recipients and activate the alert.</li>
                <li>Alerts will trigger based on your configuration and notify recipients.</li>
                <li>Export alerts for backup or sharing.</li>
              </ol>
              <Button icon={<QuestionCircleOutlined />} style={{ marginTop: 16 }}>View Documentation</Button>
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane tab={<span><ShareAltOutlined /> Feedback</span>} key="feedback">
            <div style={{ padding: 24 }}>
              <h3>Feedback & Suggestions</h3>
              <Input.TextArea rows={4} value={feedbackText} onChange={e => setFeedbackText(e.target.value)} placeholder="Share your feedback or feature requests..." style={{ marginBottom: 12 }} />
              <Button type="primary" onClick={handleFeedback}>Submit Feedback</Button>
              {feedbackError && (
                <div style={{ marginTop: 8, color: '#ef4444', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span>{feedbackError}</span>
                  {quickFixForIssue(feedbackError) === 'retry' && <Button size="small" onClick={() => { setFeedbackError(''); handleFeedback(); }}>Retry</Button>}
                  {quickFixForIssue(feedbackError) === 'sanitize' && <Button size="small" onClick={() => setFeedbackText(feedbackText.replace(/\s+/g, '').split(',').filter(Boolean).map(r => r.includes('@') ? r : `${r}@example.com`).join(', '))}>Fix emails</Button>}
                </div>
              )}
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {history.length > 0 && (
        <Card title="Recent activity" style={{ marginBottom: 16 }}>
          {history.slice(0, 5).map((h, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: idx === history.slice(0,5).length -1 ? 'none' : '1px solid #f3f4f6' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{h.summary}</div>
                <div style={{ color: '#6b7280', fontSize: 12 }}>{new Date(h.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {h.env}</div>
              </div>
              <Button size="small" icon={<ReloadOutlined />} onClick={() => notification.info({ message: 'Replayed', description: h.summary })}>Replay</Button>
            </div>
          ))}
        </Card>
      )}

      <Card title="Debug panel" style={{ marginBottom: 16 }} extra={<Button size="small" onClick={() => setShowDebug(v => !v)}>{showDebug ? 'Hide' : 'Show'}</Button>}>
        {showDebug ? (
          traceEvents.length === 0 ? <div style={{ color: '#6b7280' }}>Interact to capture traces. Ctrl+D toggles.</div> : (
            <div style={{ display: 'grid', gap: 8 }}>
              {traceEvents.map((t, idx) => (
                <div key={idx} style={{ padding: 8, border: '1px solid #f3f4f6', borderRadius: 8 }}>
                  <div style={{ fontWeight: 700 }}>{t.event}</div>
                  <div style={{ color: '#6b7280', fontSize: 12 }}>{new Date(t.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {t.env} · {t.shop}</div>
                  <div style={{ color: '#6b7280', fontSize: 12, wordBreak: 'break-word' }}>{JSON.stringify(t.meta)}</div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div style={{ color: '#6b7280' }}>Tracing captures saves, deletes, exports, simulations.</div>
        )}
      </Card>

      <Modal
        title={editing ? "Edit Alert" : "Add Alert"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editing ? "Save" : "Create"}
      >
        <Input
          placeholder="Alert Name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          style={{ marginBottom: 12 }}
        />
        <Select
          value={form.type}
          onChange={v => setForm(f => ({ ...f, type: v }))}
          options={alertTypes}
          style={{ width: "100%", marginBottom: 12 }}
        />
        <Input
          placeholder="Recipients (comma separated)"
          value={form.recipients}
          onChange={e => setForm(f => ({ ...f, recipients: e.target.value }))}
          style={{ marginBottom: 12 }}
        />
        <div style={{ marginBottom: 12 }}>
          <Switch
            checked={form.active}
            onChange={v => setForm(f => ({ ...f, active: v }))}
            checkedChildren="Active"
            unCheckedChildren="Inactive"
          />
        </div>
        <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button icon={<ReloadOutlined />} onClick={simulateAlert}>Simulate alert</Button>
          <Button icon={<QuestionCircleOutlined />} onClick={() => notification.info({ message: 'Runbook opened', description: 'Attach remediation steps here.' })}>Open runbook</Button>
          <Switch checked={confirmProd} onChange={setConfirmProd} checkedChildren="Prod confirmed" unCheckedChildren="Prod locked" />
        </div>
        {simResult && (
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <div><b>Simulation</b>: {simResult.sample}</div>
            <div>Fired: {simResult.fired ? 'Yes' : 'No'} · Severity: {simResult.severity}</div>
          </div>
        )}
      </Modal>
    </div>
  );
}
