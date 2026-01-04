import React, { useState, useRef } from "react";
import { apiFetch } from "../../api";

export default function ChurnPredictionPlaybooks() {
  const [input, setInput] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [playbooks, setPlaybooks] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [error, setError] = useState("");
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [feedback, setFeedback] = useState("");
  const fileInputRef = useRef();

  // Fetch predictions
  const fetchPredictions = async () => {
    try {
      const res = await apiFetch("/api/churn-prediction-playbooks/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setPredictions(data.predictions || []);
    } catch (err) {
      setError(err.message);
    }
  };
  // Fetch playbooks
  const fetchPlaybooks = async () => {
    try {
      const res = await apiFetch("/api/churn-prediction-playbooks/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setPlaybooks(data.playbooks || []);
    } catch (err) {
      setError(err.message);
    }
  };
  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const res = await apiFetch("/api/churn-prediction-playbooks/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
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
      setInput(evt.target.result);
      setImported(file.name);
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ predictions, playbooks, analytics }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await apiFetch("/api/churn-prediction-playbooks/feedback", {
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
    <div style={{ maxWidth: 900, margin: "40px auto", background: "#fff", borderRadius: 18, boxShadow: "0 2px 24px #0002", padding: 36, fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Churn Prediction Playbooks</h2>
      <div style={{ color: "#0ea5e9", fontWeight: 600, marginBottom: 18 }}>
        <span role="img" aria-label="churn">🔮</span> Predict churn and build retention playbooks.
      </div>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={4}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc", marginBottom: 18 }}
        placeholder="Paste customer data or notes here..."
        aria-label="Customer data input"
      />
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={fetchPredictions} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Predict Churn</button>
        <button onClick={fetchPlaybooks} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Build Playbooks</button>
        <button onClick={fetchAnalytics} style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Analytics</button>
      </div>
      <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Predictions</div>
          <ul style={{ paddingLeft: 18 }}>
            {predictions.map((p, idx) => (
              <li key={p.id || idx} style={{ marginBottom: 8, background: "#f1f5f9", borderRadius: 8, padding: 8 }}>{p.name}</li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Playbooks</div>
          <ul style={{ paddingLeft: 18 }}>
            {playbooks.map((pb, idx) => (
              <li key={pb.id || idx} style={{ marginBottom: 8, background: "#e0f2fe", borderRadius: 8, padding: 8 }}>{pb.name}</li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Analytics</div>
          <ul style={{ paddingLeft: 18 }}>
            {analytics.map((a, idx) => (
              <li key={a.id || idx} style={{ marginBottom: 8, background: "#f1f5f9", borderRadius: 8, padding: 8 }}>{a.name}</li>
            ))}
          </ul>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import data" />
        <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
        {exported && <a href={exported} download="churn-prediction-playbooks.json" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
      </div>
      {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: "#f8fafc", borderRadius: 12, padding: 20 }} aria-label="Send feedback">
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={2}
          style={{ width: "100%", fontSize: 15, padding: 10, borderRadius: 8, border: "1px solid #ccc", marginBottom: 12, background: "#fff", color: "#23263a" }}
          placeholder="Share your feedback or suggestions..."
          aria-label="Feedback input"
        />
        <button type="submit" style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Send Feedback</button>
      </form>
    </div>
  );
}
