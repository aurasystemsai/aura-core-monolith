import React, { useState, useRef } from "react";
import { apiFetch } from "../../api";

export default function EntityTopicExplorer() {
  const [input, setInput] = useState("");
  const [entities, setEntities] = useState([]);
  const [topics, setTopics] = useState([]);
  const [analysis, setAnalysis] = useState([]);
  const [error, setError] = useState("");
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [feedback, setFeedback] = useState("");
  const fileInputRef = useRef();

  // Fetch entities
  const fetchEntities = async () => {
    try {
      const res = await apiFetch("/api/entity-topic-explorer/entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setEntities(data.entities || []);
    } catch (err) {
      setError(err.message);
    }
  };
  // Fetch topics
  const fetchTopics = async () => {
    try {
      const res = await apiFetch("/api/entity-topic-explorer/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setTopics(data.topics || []);
    } catch (err) {
      setError(err.message);
    }
  };
  // Fetch analysis
  const fetchAnalysis = async () => {
    try {
      const res = await apiFetch("/api/entity-topic-explorer/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setAnalysis(data.analysis || []);
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
    const blob = new Blob([JSON.stringify({ entities, topics, analysis }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await apiFetch("/api/entity-topic-explorer/feedback", {
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
    <div style={{ background: "#18181b", borderRadius: 18, boxShadow: "0 2px 24px #0008", padding: 36, fontFamily: 'Inter, sans-serif', color: '#f0f0f0' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Entity/Topic Explorer</h2>
      <div style={{ color: "#0ea5e9", fontWeight: 600, marginBottom: 18 }}>
        <span role="img" aria-label="entity">🧠</span> Semantic SEO: discover entities and topics for your content.
      </div>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={4}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc", marginBottom: 18 }}
        placeholder="Paste your content or keywords here..."
        aria-label="Content input"
      />
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={fetchEntities} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Extract Entities</button>
        <button onClick={fetchTopics} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Cluster Topics</button>
        <button onClick={fetchAnalysis} style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Semantic Analysis</button>
      </div>
      <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Entities</div>
          <ul style={{ paddingLeft: 18 }}>
            {entities.map((e, idx) => (
              <li key={e.id || idx} style={{ marginBottom: 8, background: "#232336", borderRadius: 8, padding: 8, color: '#f0f0f0' }}>{e.name}</li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Topics</div>
          <ul style={{ paddingLeft: 18 }}>
            {topics.map((t, idx) => (
              <li key={t.id || idx} style={{ marginBottom: 8, background: "#18181b", borderRadius: 8, padding: 8, color: '#7fffd4' }}>{t.name}</li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Semantic Analysis</div>
          <ul style={{ paddingLeft: 18 }}>
            {analysis.map((a, idx) => (
              <li key={a.id || idx} style={{ marginBottom: 8, background: "#232336", borderRadius: 8, padding: 8, color: '#f0f0f0' }}>{a.name}</li>
            ))}
          </ul>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import content" />
        <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
        {exported && <a href={exported} download="entity-topic-analysis.json" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
      </div>
      {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      <div style={{ display: "flex", gap: 12, marginTop: 20, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ background: "#1e2235", borderRadius: 10, padding: "12px 20px", border: "1px solid #2f3a50" }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Entities</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#6366f1", marginTop: 2 }}>{entities.length}</div>
        </div>
        <div style={{ background: "#1e2235", borderRadius: 10, padding: "12px 20px", border: "1px solid #2f3a50" }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Topics</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#0ea5e9", marginTop: 2 }}>{topics.length}</div>
        </div>
        <div style={{ background: "#1e2235", borderRadius: 10, padding: "12px 20px", border: "1px solid #2f3a50" }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Analysis</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#7fffd4", marginTop: 2 }}>{analysis.length}</div>
        </div>
      </div>
      <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", paddingBottom: 8 }}>Questions? <a href="mailto:support@aura-core.ai" style={{ color: "#0ea5e9", textDecoration: "underline" }}>Contact Support</a></div>
    </div>
  );
}

