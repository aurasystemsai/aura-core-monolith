import React, { useState } from "react";
import { Card, Button, Table, Input, Tabs, Progress, notification } from "antd";
import { BarChartOutlined, InfoCircleOutlined, ShareAltOutlined, QuestionCircleOutlined, DownloadOutlined } from "@ant-design/icons";

export default function CustomerJourneyMapping() {
  const [input, setInput] = useState("");
  const [journeys, setJourneys] = useState([]);
  const [analytics, setAnalytics] = useState({ stages: 0, avgDuration: 0, dropoff: 0 });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("map");
  const [feedback, setFeedback] = useState("");
  const [exporting, setExporting] = useState(false);

  const handleMap = () => {
    setLoading(true);
    setTimeout(() => {
      const fakeJourney = { stages: ["Awareness", "Consideration", "Purchase", "Loyalty"], avgDuration: 12, dropoff: 18 };
      setJourneys([fakeJourney, ...journeys].slice(0, 10));
      setAnalytics({ stages: 4, avgDuration: 12, dropoff: 18 });
      setLoading(false);
    }, 900);
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      notification.success({ message: "Journeys exported as CSV" });
      setExporting(false);
    }, 800);
  };

  const columns = [
    { title: "Stages", dataIndex: "stages", key: "stages", render: arr => arr.join(" → ") },
    { title: "Avg Duration (days)", dataIndex: "avgDuration", key: "avgDuration" },
    { title: "Dropoff (%)", dataIndex: "dropoff", key: "dropoff" },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<span><BarChartOutlined />Customer Journey Mapping</span>}
        extra={<Button icon={<DownloadOutlined />} loading={exporting} onClick={handleExport} />}>
        <Tabs activeKey={tab} onChange={setTab}>
          <Tabs.TabPane tab={<span><BarChartOutlined />Map</span>} key="map">
            <Input.TextArea
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={3}
              style={{ marginBottom: 12 }}
              placeholder="Describe or paste customer journey data..."
            />
            <Button type="primary" onClick={handleMap} loading={loading} disabled={!input} style={{ marginBottom: 18 }}>Map Journey</Button>
            {journeys.length > 0 && (
              <Table
                columns={columns}
                dataSource={journeys}
                rowKey={(r, i) => i}
                pagination={false}
                style={{ marginBottom: 16 }}
              />
            )}
            <div style={{ marginTop: 16, display: "flex", gap: 24 }}>
              <div>
                <b>Stages:</b> <span>{analytics.stages}</span>
                <Progress percent={Math.round((analytics.stages / 10) * 100)} size="small" status="active" />
              </div>
              <div>
                <b>Avg Duration (days):</b> <span>{analytics.avgDuration}</span>
              </div>
              <div>
                <b>Dropoff (%):</b> <span>{analytics.dropoff}</span>
                <Progress percent={analytics.dropoff} size="small" status="exception" />
              </div>
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane tab={<span><InfoCircleOutlined />Onboarding</span>} key="onboarding">
            <div style={{ padding: 24 }}>
              <h3>How to Use Customer Journey Mapping</h3>
              <ol>
                <li>Describe or paste customer journey data.</li>
                <li>Map the journey to visualize stages and dropoff.</li>
                <li>Review analytics and export results for reporting.</li>
              </ol>
              <Button icon={<QuestionCircleOutlined />} style={{ marginTop: 16 }}>View Documentation</Button>
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane tab={<span><ShareAltOutlined />Feedback</span>} key="feedback">
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
