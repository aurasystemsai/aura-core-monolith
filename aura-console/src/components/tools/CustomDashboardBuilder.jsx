import React, { useState, useRef } from "react";
import { apiFetch } from "../../api";

export default function CustomDashboardBuilder() {
  const [widgets, setWidgets] = useState([]);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [dashboard, setDashboard] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [error, setError] = useState("");
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [feedback, setFeedback] = useState("");
  const fileInputRef = useRef();

  // Fetch widget library
  const fetchWidgets = async () => {
    try {
      const res = await apiFetch("/api/custom-dashboard-builder/widgets");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setWidgets(data.widgets || []);
    } catch (err) {
      setError(err.message);
    }
  };
  // Fetch data sources
  const fetchDataSources = async () => {
    try {
      const res = await apiFetch("/api/custom-dashboard-builder/data-sources");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setDataSources(data.dataSources || []);
    } catch (err) {
      setError(err.message);
    }
  };

  // Add widget to dashboard
  const handleAddWidget = () => {
    if (!selectedWidget) return;
    setDashboard([...dashboard, { ...selectedWidget, id: Date.now() }]);
  };

  // Import/Export dashboard
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      setDashboard(JSON.parse(evt.target.result));
      setImported(file.name);
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(dashboard, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await apiFetch("/api/custom-dashboard-builder/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setFeedback("");
    } catch (err) {
      setError(err.message);
    }
  };

  // Drag-and-drop (simplified)
  const handleDragStart = (idx) => {
    setSelectedWidget(widgets[idx]);
  };

  return (
    <div style={{ background: "#18181b", borderRadius: 18, boxShadow: "0 2px 24px #0008", padding: 36, fontFamily: 'Inter, sans-serif', color: '#e5e7eb' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Custom Dashboard Builder</h2>
      <div style={{ color: "#0ea5e9", fontWeight: 600, marginBottom: 18 }}>
        <span role="img" aria-label="dashboard">📊</span> Build custom dashboards for your reporting needs.
      </div>
      <div style={{ marginBottom: 18 }}>
        <button onClick={fetchWidgets} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Load Widget Library</button>
        <button onClick={fetchDataSources} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginLeft: 12 }}>Load Data Sources</button>
      </div>
      <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Widgets</div>
          <ul style={{ paddingLeft: 18 }}>
            {widgets.map((w, idx) => (
              <li key={w.id || idx} draggable onDragStart={() => handleDragStart(idx)} style={{ marginBottom: 8, background: "#232336", borderRadius: 8, padding: 8, cursor: "grab", color: '#e5e7eb' }}>{w.name}</li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 2 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Dashboard</div>
          <ul style={{ paddingLeft: 18 }}>
            {dashboard.map((w, idx) => (
              <li key={w.id} style={{ marginBottom: 8, background: "#18181b", borderRadius: 8, padding: 8, color: '#7fffd4' }}>{w.name}</li>
            ))}
          </ul>
          <button onClick={handleAddWidget} style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginTop: 8 }}>Add Widget</button>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Data Sources</div>
          <ul style={{ paddingLeft: 18 }}>
            {dataSources.map((ds, idx) => (
              <li key={ds.id || idx} style={{ marginBottom: 8, background: "#232336", borderRadius: 8, padding: 8, color: '#e5e7eb' }}>{ds.name}</li>
            ))}
          </ul>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import dashboard" />
        <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
        {exported && <a href={exported} download="dashboard.json" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
      </div>
      {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: "#232336", borderRadius: 12, padding: 20 }} aria-label="Send feedback">
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={2}
          style={{ width: "100%", fontSize: 15, padding: 10, borderRadius: 8, border: "1px solid #6366f1", marginBottom: 12, background: "#18181b", color: "#e5e7eb" }}
          placeholder="Share your feedback or suggestions..."
          aria-label="Feedback input"
        />
        <button type="submit" style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Send Feedback</button>
      </form>
    </div>
  );
}
