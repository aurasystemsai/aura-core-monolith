import React, { useEffect, useState } from "react";
import "./AnalyticsPanel.css";

const ENDPOINTS = [
  { id: "revenue", label: "Revenue", api: "/api/analytics/revenue" },
  { id: "orders", label: "Orders", api: "/api/analytics/orders" },
  { id: "customers", label: "Customers", api: "/api/analytics/customers" },
  { id: "conversion", label: "Conversion Rate", api: "/api/analytics/conversion" },
  { id: "traffic", label: "Traffic", api: "/api/analytics/traffic" },
];

function AnalyticsPanel() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchAll() {
      setLoading(true);
      const results = {};
      await Promise.all(
        ENDPOINTS.map(async (ep) => {
          try {
            const res = await fetch(ep.api, { credentials: "include" });
            const d = await res.json();
            results[ep.id] = d.value || 0;
          } catch {
            results[ep.id] = null;
          }
        })
      );
      if (isMounted) setData(results);
      setLoading(false);
    }
    fetchAll();
    const interval = setInterval(fetchAll, 60000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  return (
    <section className="analytics-panel-card" style={{ marginTop: 10 }}>
      <div className="card-header">
        <h2 className="card-title" title="Key analytics metrics">Analytics & Reporting
          <span style={{ display: 'inline-block', marginLeft: 8, fontSize: 18, color: '#7fffd4', cursor: 'help' }} title="This panel shows revenue, orders, customers, conversion, and traffic.">ⓘ</span>
        </h2>
        <p className="card-subtitle">
          Key business metrics at a glance.
        </p>
      </div>
      <div className="analytics-metrics-grid">
        {ENDPOINTS.map((ep) => (
          <div key={ep.id} className="analytics-metric-card">
            <span className="analytics-metric-label">{ep.label}</span>
            <span className="analytics-metric-value">
              {loading ? '…' : data[ep.id] !== null ? data[ep.id] : 'N/A'}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default AnalyticsPanel;
