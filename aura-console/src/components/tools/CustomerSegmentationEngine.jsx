import React, { useState } from "react";
import { Card, Button, Table, Input, Tabs, Progress, notification } from "antd";
import { BarChartOutlined, InfoCircleOutlined, ShareAltOutlined, QuestionCircleOutlined, DownloadOutlined } from "@ant-design/icons";

export default function CustomerSegmentationEngine() {
  const [input, setInput] = useState("");
  const [segments, setSegments] = useState([]);
  const [analytics, setAnalytics] = useState({ segments: 0, avgValue: 0 });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("segment");
  const [feedback, setFeedback] = useState("");
  const [exporting, setExporting] = useState(false);

  const handleSegment = () => {
    setLoading(true);
    setTimeout(() => {
      const fakeSegments = [
        { name: "VIP Customers", value: 12000 },
        { name: "New Customers", value: 3400 },
        { name: "Churn Risk", value: 800 }
      ];
      setSegments(fakeSegments);
      setAnalytics({ segments: 3, avgValue: 5466 });
      setLoading(false);
    }, 900);
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      notification.success({ message: "Segments exported as CSV" });
      setExporting(false);
    }, 800);
  };

  const columns = [
    { title: "Segment", dataIndex: "name", key: "name" },
    { title: "Value", dataIndex: "value", key: "value" },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <Card
        title={<span><BarChartOutlined /> Customer Segmentation Engine</span>}
        extra={<Button icon={<DownloadOutlined />} loading={exporting} onClick={handleExport} />}>
        <Tabs activeKey={tab} onChange={setTab}>
          <Tabs.TabPane tab={<span><BarChartOutlined /> Segment</span>} key="segment">
            <Input.TextArea
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={3}
              style={{ marginBottom: 12 }}
              placeholder="Describe or paste customer data..."
            />
            <Button type="primary" onClick={handleSegment} loading={loading} disabled={!input} style={{ marginBottom: 18 }}>Segment</Button>
            {segments.length > 0 && (
              <Table
                columns={columns}
                dataSource={segments}
                rowKey={(r, i) => i}
                pagination={false}
                style={{ marginBottom: 16 }}
              />
            )}
            <div style={{ marginTop: 16, display: "flex", gap: 24 }}>
              <div>
                <b>Segments:</b> <span>{analytics.segments}</span>
                <Progress percent={Math.round((analytics.segments / 10) * 100)} size="small" status="active" />
              </div>
              <div>
                <b>Avg Value ($):</b> <span>{analytics.avgValue}</span>
              </div>
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane tab={<span><InfoCircleOutlined /> Onboarding</span>} key="onboarding">
            <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
              <h3>How to Use Customer Segmentation Engine</h3>
              <ol>
                <li>Describe or paste customer data.</li>
                <li>Segment customers to identify key groups.</li>
                <li>Review analytics and export results for reporting.</li>
              </ol>
              <Button icon={<QuestionCircleOutlined />} style={{ marginTop: 16 }}>View Documentation</Button>
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane tab={<span><ShareAltOutlined /> Feedback</span>} key="feedback">
            <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
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
