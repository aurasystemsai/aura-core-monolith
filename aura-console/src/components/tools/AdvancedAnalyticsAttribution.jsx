import React, { useState } from "react";

const samplePayload = {
  shopifyOrders: [
    {
      id: "order-123",
      name: "#123",
      customer: { email: "user@example.com" },
      total_price: 120,
      subtotal_price: 100,
      currency: "USD",
      created_at: new Date().toISOString(),
      referring_site: "https://google.com?q=shoes",
      landing_site: "/product/shoes",
      source_name: "google",
    },
  ],
  adEvents: [
    {
      id: "click-1",
      type: "click",
      channel: "google-ads",
      campaign: "Spring Sale",
      value: 0,
      currency: "USD",
      user_id: "user@example.com",
      timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
    },
  ],
  offlineEvents: [],
  model: "linear",
  includeJourneys: true,
  cohortKey: "channel",
};

export default function AdvancedAnalyticsAttribution() {
  const [payload, setPayload] = useState(JSON.stringify(samplePayload, null, 2));
  const [query, setQuery] = useState("How is performance by channel and where should we shift budget?");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const body = JSON.parse(payload);
      const res = await fetch("/api/advanced-analytics-attribution/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, query }),
      });
      const data = await res.json();
      if (!data.ok && data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <h2 style={{ margin: 0 }}>Advanced Analytics Attribution</h2>
        <div style={{ color: "#b8c2d0" }}>
          Ingest Shopify + ads + offline events, run attribution models, and view performance, journeys, and cohorts.
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ fontWeight: 700 }}>Query for AI Insights</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #2c3a4d", background: "#101726", color: "#e9efff" }}
        />
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ fontWeight: 700 }}>Payload (JSON)</label>
        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          rows={18}
          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #2c3a4d", background: "#0d1420", color: "#e9efff", fontFamily: "monospace" }}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={run} disabled={loading} style={{ padding: "10px 14px", borderRadius: 8, border: "none", background: "#22d3ee", color: "#031018", fontWeight: 800, cursor: "pointer" }}>
            {loading ? "Running..." : "Run Attribution"}
          </button>
          <button onClick={() => setPayload(JSON.stringify(samplePayload, null, 2))} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #2c3a4d", background: "#131c2c", color: "#e9efff", fontWeight: 700, cursor: "pointer" }}>
            Reset Sample
          </button>
        </div>
        {error && <div style={{ color: "#ff8a8a", fontWeight: 700 }}>{error}</div>}
      </div>

      {result && (
        <div style={{ display: "grid", gap: 12, background: "#0d1420", border: "1px solid #24314a", borderRadius: 10, padding: 16 }}>
          {result.insights && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>AI Insights</div>
              <div style={{ whiteSpace: "pre-wrap", color: "#dbeafe" }}>{result.insights}</div>
            </div>
          )}
          {result.performance && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Performance by Channel</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #24314a" }}>
                    <th style={{ padding: "6px 4px" }}>Channel</th>
                    <th style={{ padding: "6px 4px" }}>Revenue</th>
                    <th style={{ padding: "6px 4px" }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.performance).map(([channel, stats]) => (
                    <tr key={channel} style={{ borderBottom: "1px solid #1a2538" }}>
                      <td style={{ padding: "6px 4px" }}>{channel}</td>
                      <td style={{ padding: "6px 4px" }}>${stats.revenue.toFixed(2)}</td>
                      <td style={{ padding: "6px 4px" }}>{stats.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {result.result && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Attribution Result</div>
              <pre style={{ background: "#0a101b", border: "1px solid #24314a", borderRadius: 8, padding: 12, color: "#dbeafe", maxHeight: 260, overflow: "auto" }}>
                {JSON.stringify(result.result, null, 2)}
              </pre>
            </div>
          )}
          {result.journeys && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Journeys</div>
              <pre style={{ background: "#0a101b", border: "1px solid #24314a", borderRadius: 8, padding: 12, color: "#dbeafe", maxHeight: 260, overflow: "auto" }}>
                {JSON.stringify(result.journeys, null, 2)}
              </pre>
            </div>
          )}
          {result.cohorts && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Cohorts</div>
              <pre style={{ background: "#0a101b", border: "1px solid #24314a", borderRadius: 8, padding: 12, color: "#dbeafe", maxHeight: 200, overflow: "auto" }}>
                {JSON.stringify(result.cohorts, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
