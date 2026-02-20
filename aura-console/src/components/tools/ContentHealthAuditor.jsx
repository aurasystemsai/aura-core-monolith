
import React, { useState, useRef, useEffect } from "react";
import { apiFetch } from "../../api";

export default function ContentHealthAuditor() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [feedback, setFeedback] = useState("");
  const fileInputRef = useRef();

  // Fetch history
  const fetchHistory = async () => {
    try {
      const res = await apiFetch("/api/content-health-auditor/history");
      const data = await res.json();
      if (data.ok) setHistory(data.history || []);
    } catch {}
  };
  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const res = await apiFetch("/api/content-health-auditor/analytics");
      const data = await res.json();
      if (data.ok) setAnalytics(data.analytics || []);
    } catch {}
  };

  // AI Audit
  const handleRun = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    try {
      const res = await apiFetch("/api/content-health-auditor/ai/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResponse(data.report || "No report");
      // Save to history
      await apiFetch("/api/content-health-auditor/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input, report: data.report })
      });
      fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Import/Export
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async evt => {
      try {
        const res = await apiFetch("/api/content-health-auditor/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: JSON.parse(evt.target.result) })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Unknown error");
        setImported(file.name);
        fetchHistory();
      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await apiFetch("/api/content-health-auditor/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setFeedback("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchAnalytics();
  }, []);

  return (
    <div>
      <div style={{ background: "#18181b", borderRadius: 18, boxShadow: "0 2px 24px #0008", padding: 36, fontFamily: 'Inter, sans-serif', color: '#f0f0f0' }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 8 }}>Content Health Auditor</h2>
        <div style={{ marginBottom: 10, color: "#0ea5e9", fontWeight: 600 }}>
          <span role="img" aria-label="health">🩺</span> Audit, manage, and analyze content health with AI and analytics.
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={4}
          style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc", marginBottom: 18 }}
          placeholder="Enter content to audit (live only)"
          aria-label="Content input"
        />
        <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
          <button onClick={handleRun} disabled={loading || !input} style={{ background: "#7fffd4", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{loading ? "Auditing..." : "AI Audit"}</button>
          <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import history" />
          <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
          {exported && <a href={exported} download="content-health-history.json" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
        </div>
        {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
        {response && (
          <div style={{ background: "#1e1e1e", borderRadius: 10, padding: 16, marginBottom: 12, border: "1px solid #1e1e1e" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: "#7fffd4", fontSize: 14 }}>AI Audit Report</span>
              <button onClick={() => navigator.clipboard?.writeText(response)} style={{ background: "transparent", border: "1px solid #333333", borderRadius: 6, padding: "4px 12px", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>Copy</button>
            </div>
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: 14, color: "#e2e8f0" }}>{response}</div>
          </div>
        )}
        {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
        <div style={{ marginTop: 24, background: "#f3f4f6", borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>History</div>
          <ul style={{ paddingLeft: 18 }}>
            {history.map(h => (
              <div key={h.id} style={{ background: "#0a0a0a", borderRadius: 8, padding: "12px 16px", border: "1px solid #1e1e1e", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: "#e2e8f0" }}>{h.content ? h.content.slice(0, 60) + "…" : `Run #${h.id}`}</span>
                  <span style={{ color: "#64748b" }}>{h.createdAt ? new Date(h.createdAt).toLocaleString() : ""}</span>
                </div>
                {h.report && <div style={{ fontSize: 13, color: "#94a3b8" }}>{typeof h.report === "string" ? h.report.slice(0, 200) + (h.report.length > 200 ? "…" : "") : ""}</div>}
              </div>
            ))}
          </ul>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
          <div style={{ background: "#1e1e1e", borderRadius: 10, padding: "12px 20px", border: "1px solid #1e1e1e" }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Total Audits</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#7fffd4", marginTop: 2 }}>{history.length}</div>
          </div>
          <div style={{ background: "#1e1e1e", borderRadius: 10, padding: "12px 20px", border: "1px solid #1e1e1e" }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Events</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#7fffd4", marginTop: 2 }}>{analytics.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}



