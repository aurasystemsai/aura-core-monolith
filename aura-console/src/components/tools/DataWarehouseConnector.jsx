﻿import React, { useState, useRef } from "react";
import { apiFetch } from "../../api";

export default function DataWarehouseConnector() {
  const [dataSources, setDataSources] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [error, setError] = useState("");
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [feedback, setFeedback] = useState("");
  const fileInputRef = useRef();

  // Fetch data sources
  const fetchDataSources = async () => {
    try {
      const res = await apiFetch("/api/data-warehouse-connector/data-sources");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setDataSources(data.dataSources || []);
    } catch (err) {
      setError(err.message);
    }
  };
  // Fetch dashboards
  const fetchDashboards = async () => {
    try {
      const res = await apiFetch("/api/data-warehouse-connector/dashboards");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setDashboards(data.dashboards || []);
    } catch (err) {
      setError(err.message);
    }
  };
  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const res = await apiFetch("/api/data-warehouse-connector/analytics");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setAnalytics(data.analytics || []);
    } catch (err) {
      setError(err.message);
    }
  };

  // Import/Export
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      setDataSources(JSON.parse(evt.target.result));
      setImported(file.name);
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(dataSources, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() =>URL.revokeObjectURL(url), 10000);
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await apiFetch("/api/data-warehouse-connector/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setFeedback("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ background: "#1a1c25", borderRadius: 18, boxShadow: "0 2px 24px #0008", padding: 36, fontFamily: 'Inter, sans-serif', color: '#f9fafb' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Data Warehouse/BI Connector</h2>
      <div style={{ color: "#0ea5e9", fontWeight: 600, marginBottom: 18 }}>
        <span role="img" aria-label="warehouse"></span>Integrate with BigQuery, Snowflake, Looker, and more.
      </div>
      <div style={{ marginBottom: 18 }}>
        <button onClick={fetchDataSources} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Load Data Sources</button>
        <button onClick={fetchDashboards} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginLeft: 12 }}>Load Dashboards</button>
        <button onClick={fetchAnalytics} style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginLeft: 12 }}>Load Analytics</button>
      </div>
      <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Data Sources</div>
          <ul style={{ paddingLeft: 18 }}>
            {dataSources.map((ds, idx) => (
              <li key={ds.id || idx} style={{ marginBottom: 8, background: "#353848", borderRadius: 8, padding: 8, color: '#f9fafb' }}>{ds.name}</li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Dashboards</div>
          <ul style={{ paddingLeft: 18 }}>
            {dashboards.map((db, idx) => (
              <li key={db.id || idx} style={{ marginBottom: 8, background: "#1a1c25", borderRadius: 8, padding: 8, color: '#6366f1' }}>{db.name}</li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Analytics</div>
          <ul style={{ paddingLeft: 18 }}>
            {analytics.map((a, idx) => (
              <li key={a.id || idx} style={{ marginBottom: 8, background: "#353848", borderRadius: 8, padding: 8, color: '#f9fafb' }}>{a.name}</li>
            ))}
          </ul>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#0d0d11", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import data sources" />
        <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
        {exported && <a href={exported} download="data-sources.json" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
      </div>
      {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      <div style={{ marginTop: 20, fontSize: 13, color: "#64748b", textAlign: "center" }}>Questions? <a href="mailto:support@aura-core.ai" style={{ color: "#0ea5e9", textDecoration: "underline" }}>Contact Support</a></div>
    </div>
  );
}


