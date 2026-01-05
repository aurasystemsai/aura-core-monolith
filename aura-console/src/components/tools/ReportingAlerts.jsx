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
