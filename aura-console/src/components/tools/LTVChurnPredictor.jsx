﻿import React, { useState, useRef } from "react";
import { apiFetch } from "../../api";

export default function LTVChurnPredictor() {
  const [input, setInput] = useState("");
  const [ltv, setLtv] = useState([]);
  const [churn, setChurn] = useState([]);
  const [error, setError] = useState("");
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [feedback, setFeedback] = useState("");
  const fileInputRef = useRef();

  // Fetch LTV
  const fetchLtv = async () => {
    try {
      const res = await apiFetch("/api/ltv-churn-predictor/ltv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setLtv(data.ltv || []);
    } catch (err) {
      setError(err.message);
    }
  };
  // Fetch churn
  const fetchChurn = async () => {
    try {
      const res = await apiFetch("/api/ltv-churn-predictor/churn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setChurn(data.churn || []);
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
    const blob = new Blob([JSON.stringify({ ltv, churn }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() =>URL.revokeObjectURL(url), 10000);
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await apiFetch("/api/ltv-churn-predictor/feedback", {
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
    <div style={{ background: "#0a0b0f", color: "#f3f4f6", borderRadius: 18, boxShadow: "0 2px 24px #0002", padding: 36, fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>LTV/Churn Predictor</h2>
      <div style={{ color: "#0ea5e9", fontWeight: 600, marginBottom: 18 }}>
        <span role="img" aria-label="ltv"></span>Predict lifetime value and churn risk.
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
        <button onClick={fetchLtv} style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Predict LTV</button>
        <button onClick={fetchChurn} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Predict Churn</button>
      </div>
      <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>LTV</div>
          <ul style={{ paddingLeft: 18 }}>
            {ltv.map((l, idx) => (
              <li key={l.id || idx} style={{ marginBottom: 8, background: "#3a4560", borderRadius: 8, padding: 8, color: '#f6f7fb' }}>{l.name}</li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Churn</div>
          <ul style={{ paddingLeft: 18 }}>
            {churn.map((c, idx) => (
              <li key={c.id || idx} style={{ marginBottom: 8, background: "#1f2433", borderRadius: 8, padding: 8, color: '#4f46e5' }}>{c.name}</li>
            ))}
          </ul>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#0a0b0f", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import data" />
        <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
        {exported && <a href={exported} download="ltv-churn-predictor.json" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
      </div>
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      <div style={{ marginTop: 24, fontSize: 13, color: "#64748b", textAlign: "center" }}>Questions? <a href="mailto:support@aura-core.ai" style={{ color: "#0ea5e9", textDecoration: "underline" }}>Contact Support</a></div>
    </div>
  );
}


