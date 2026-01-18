import React, { useState } from "react";
import { Card, Button, Table, Input, Tabs, Progress, notification } from "antd";
import { BarChartOutlined, InfoCircleOutlined, ShareAltOutlined, QuestionCircleOutlined, DownloadOutlined } from "@ant-design/icons";

export default function DataEnrichmentSuite() {
  const [input, setInput] = useState("");
  const [enriched, setEnriched] = useState([]);
  const [analytics, setAnalytics] = useState({ records: 0, fields: 0 });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("enrich");
  const [feedback, setFeedback] = useState("");
  const [exporting, setExporting] = useState(false);

  const handleEnrich = () => {
    setLoading(true);
    setTimeout(() => {
      const fakeEnriched = [
        { name: "John Doe", email: "john@example.com", company: "Acme Corp" },
        { name: "Jane Smith", email: "jane@example.com", company: "Beta Inc" }
      ];
      setEnriched(fakeEnriched);
      setAnalytics({ records: 2, fields: 3 });
      setLoading(false);
    }, 900);
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      notification.success({ message: "Enriched data exported as CSV" });
      setExporting(false);
    }, 800);
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Company", dataIndex: "company", key: "company" },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<span><BarChartOutlined /> Data Enrichment Suite</span>}
        extra={<Button icon={<DownloadOutlined />} loading={exporting} onClick={handleExport} />}>
        <Tabs activeKey={tab} onChange={setTab}>
          <Tabs.TabPane tab={<span><BarChartOutlined /> Enrich</span>} key="enrich">
            <Input.TextArea
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={3}
              style={{ marginBottom: 12 }}
              placeholder="Paste or describe data to enrich..."
            />
            <Button type="primary" onClick={handleEnrich} loading={loading} disabled={!input} style={{ marginBottom: 18 }}>Enrich Data</Button>
            {enriched.length > 0 && (
              <Table
                columns={columns}
                dataSource={enriched}
                rowKey={(r, i) => i}
                pagination={false}
                style={{ marginBottom: 16 }}
              />
            )}
            <div style={{ marginTop: 16, display: "flex", gap: 24 }}>
              <div>
                <b>Records:</b> <span>{analytics.records}</span>
                <Progress percent={Math.round((analytics.records / 10) * 100)} size="small" status="active" />
              </div>
              <div>
                <b>Fields:</b> <span>{analytics.fields}</span>
              </div>
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane tab={<span><InfoCircleOutlined /> Onboarding</span>} key="onboarding">
            <div style={{ padding: 24 }}>
              <h3>How to Use Data Enrichment Suite</h3>
              <ol>
                <li>Paste or describe data to enrich.</li>
                <li>Enrich data to add fields and context.</li>
                <li>Review analytics and export results for reporting.</li>
              </ol>
              <Button icon={<QuestionCircleOutlined />} style={{ marginTop: 16 }}>View Documentation</Button>
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane tab={<span><ShareAltOutlined /> Feedback</span>} key="feedback">
            <div style={{ padding: 24 }}>
              <h3>Feedback & Suggestions</h3>
              <Input.TextArea rows={4} value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Share your feedback or feature requests..." style={{ marginBottom: 12 }} />
              <Button type="primary">Submit Feedback</Button>
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
}
