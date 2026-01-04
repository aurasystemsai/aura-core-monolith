import React, { useState } from "react";

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

  useEffect(() => {
    // Simulate fetch
    setLoading(true);
    setTimeout(() => {
      setAlerts(defaultAlerts);
      setLoading(false);
    }, 500);
  }, []);

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
    const recipientsArr = form.recipients.split(",").map(r => r.trim()).filter(Boolean);
    if (editing) {
      setAlerts(alerts.map(a => a.id === editing.id ? { ...form, id: editing.id, recipients: recipientsArr } : a));
      notification.success({ message: "Alert updated" });
    } else {
      setAlerts([...alerts, { ...form, id: Date.now(), recipients: recipientsArr }]);
      notification.success({ message: "Alert created" });
    }
    setModalOpen(false);
    setEditing(null);
    setForm({ name: "", type: "threshold", recipients: "", active: true });
  };

  const handleDelete = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
    notification.info({ message: "Alert deleted" });
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      notification.success({ message: "Alerts exported as CSV" });
      setExporting(false);
    }, 800);
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
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <Card
        title={<span><BellOutlined /> Reporting Alerts</span>}
        extra={<>
          <Tooltip title="Export Alerts"><Button icon={<DownloadOutlined />} loading={exporting} onClick={handleExport} /></Tooltip>
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
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane tab={<span><InfoCircleOutlined /> Onboarding</span>} key="onboarding">
            <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
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
            <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
              <h3>Feedback & Suggestions</h3>
              <Input.TextArea rows={4} placeholder="Share your feedback or feature requests..." style={{ marginBottom: 12 }} />
              <Button type="primary">Submit Feedback</Button>
            </div>
          </Tabs.TabPane>
        </Tabs>
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
      </Modal>
    </div>
  );
}
// The following code is commented out because only one component and export default is allowed per file.
// If you need this functionality, move it to a separate file or merge with the above component.
/*
  const handleReport = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/reporting-alerts/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResult(data.result);
      setHistory(prev => [{ query, result: data.result }, ...prev].slice(0, 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onboardingContent = (
    <div style={{ padding: 24, background: darkMode ? "#23263a" : "#f1f5f9", borderRadius: 12, marginBottom: 18 }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Reporting & Alerts</h3>
      <ul style={{ margin: "16px 0 0 18px", color: darkMode ? "#a3e635" : "#334155", fontSize: 16 }}>
        <li>Schedule reports, detect anomalies, and receive change alerts</li>
        <li>Export, share, and review report history</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Get Started</button>
    </div>
  );

  return (
    <div style={{
      maxWidth: 900,
      margin: "40px auto",
      background: darkMode ? "#18181b" : "#fff",
      borderRadius: 18,
      boxShadow: "0 2px 24px #0002",
      padding: 36,
      color: darkMode ? "#a3e635" : "#23263a",
      fontFamily: 'Inter, sans-serif',
      transition: "background 0.3s, color 0.3s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0 }}>Reporting & Alerts</h2>
        <button onClick={() => setDarkMode(d => !d)} aria-label="Toggle dark mode" style={{ background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>{darkMode ? "Light" : "Dark"} Mode</button>
      </div>
      <div style={{ marginBottom: 10, color: darkMode ? "#a3e635" : "#0ea5e9", fontWeight: 600 }}>
        <span role="img" aria-label="report">📊</span> Schedule reports, detect anomalies, and get alerts.
      </div>
      <button onClick={() => setShowOnboarding(true)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
      {showOnboarding && onboardingContent}
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        type="text"
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 18, background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
        placeholder="Describe the report or alert you want to schedule..."
        aria-label="Reporting input"
      />
      <button onClick={handleReport} disabled={loading || !query} style={{ background: "#a3e635", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer", marginBottom: 18 }}>{loading ? "Reporting..." : "Schedule Report"}</button>
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      {result && (
        <div style={{ background: darkMode ? "#23263a" : "#f1f5f9", borderRadius: 10, padding: 16, marginBottom: 12, color: darkMode ? "#a3e635" : "#23263a" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Report Result:</div>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      {history.length > 0 && (
        <div style={{ marginTop: 24, background: darkMode ? "#334155" : "#f3f4f6", borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Report History</div>
          <ul style={{ paddingLeft: 18 }}>
            {history.map((h, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                <div><b>Query:</b> {h.query}</div>
                <div><b>Result:</b> {JSON.stringify(h.result).slice(0, 120)}{JSON.stringify(h.result).length > 120 ? "..." : ""}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ marginTop: 32, fontSize: 13, color: darkMode ? "#a3e635" : "#64748b", textAlign: "center" }}>
        <span>Best-in-class SaaS features. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: darkMode ? "#a3e635" : "#0ea5e9", textDecoration: "underline" }}>Contact Support</a></span>
      </div>
    </div>
  );
}
*/
