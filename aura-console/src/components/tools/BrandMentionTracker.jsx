import React, { useState, useRef } from "react";
import { apiFetch, apiFetchJSON } from "../../api";

export default function BrandMentionTracker() {
  const [input, setInput] = useState("");
  const [mentions, setMentions] = useState([]);
  const [sentiment, setSentiment] = useState([]);
  const [error, setError] = useState("");
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [feedback, setFeedback] = useState("");
  const fileInputRef = useRef();

  // Fetch mentions
  const fetchMentions = async () => {
    try {
      const res = await apiFetchJSON("/api/brand-mention-tracker/mentions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setMentions(data.mentions || []);
    } catch (err) {
      setError(err.message);
    }
  };
  // Fetch sentiment
  const fetchSentiment = async () => {
    try {
      const res = await apiFetchJSON("/api/brand-mention-tracker/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setSentiment(data.sentiment || []);
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
    const blob = new Blob([JSON.stringify({ mentions, sentiment }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() =>URL.revokeObjectURL(url), 10000);
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await apiFetch("/api/brand-mention-tracker/feedback", {
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
    <div style={{ background: "#18181b", borderRadius: 18, boxShadow: "0 2px 24px #0008", padding: 36, fontFamily: 'Inter, sans-serif', color: '#fafafa' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Brand Mention Tracker</h2>
      <div style={{ color: "#0ea5e9", fontWeight: 600, marginBottom: 18 }}>
        <span role="img" aria-label="brand"></span>Track brand mentions and sentiment across the web.
      </div>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={4}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc", marginBottom: 18 }}
        placeholder="Enter brand name or keywords..."
        aria-label="Brand input"
      />
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={fetchMentions} style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Track Mentions</button>
        <button onClick={fetchSentiment} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Analyze Sentiment</button>
      </div>
      <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Mentions</div>
          <ul style={{ paddingLeft: 18 }}>
            {mentions.map((m, idx) => (
              <li key={m.id || idx} style={{ marginBottom: 8, background: "#3f3f46", borderRadius: 8, padding: 8, color: '#fafafa' }}>{m.name}</li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Sentiment</div>
          <ul style={{ paddingLeft: 18 }}>
            {sentiment.map((s, idx) => (
              <li key={s.id || idx} style={{ marginBottom: 8, background: "#18181b", borderRadius: 8, padding: 8, color: '#4f46e5' }}>{s.name}</li>
            ))}
          </ul>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#09090b", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import mentions" />
        <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
        {exported && <a href={exported} download="brand-mention-tracker.json" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
      </div>
      {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: "#3f3f46", borderRadius: 12, padding: 20 }} aria-label="Send feedback">
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={2}
          style={{ width: "100%", fontSize: 15, padding: 10, borderRadius: 8, border: "1px solid #4f46e5", marginBottom: 12, background: "#18181b", color: "#fafafa" }}
          placeholder="Share your feedback or suggestions..."
          aria-label="Feedback input"
        />
        <button type="submit" style={{ background: "#4f46e5", color: "#09090b", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Send Feedback</button>
      </form>
    </div>
  );
}


