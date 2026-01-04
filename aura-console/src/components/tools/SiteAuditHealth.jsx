import React, { useState } from "react";

export default function SiteAuditHealth() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  import React, { useState, useRef, useEffect } from "react";
  import { apiFetch } from "../../api";
    setError("");
  export default function SiteAuditHealth() {
    const [input, setInput] = useState("");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [history, setHistory] = useState([]);
    const [analytics, setAnalytics] = useState([]);
    const [feedback, setFeedback] = useState("");
    const fileInputRef = useRef();
    }
    // Fetch history
    const fetchHistory = async () => {
      try {
        const res = await apiFetch("/api/site-audit-health/history");
        const data = await res.json();
        if (data.ok) setHistory(data.history || []);
      } catch {}
    };
    // Fetch analytics
    const fetchAnalytics = async () => {
      try {
        const res = await apiFetch("/api/site-audit-health/analytics");
        const data = await res.json();
        if (data.ok) setAnalytics(data.analytics || []);
      } catch {}
    };
    </div>
    // AI Audit
    const handleAudit = async () => {
      setLoading(true);
      setError("");
      setResponse("");
      try {
        const res = await apiFetch("/api/site-audit-health/ai/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ site: input })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Unknown error");
        setResponse(data.auditReport || "No report generated");
        // Save to history
        await apiFetch("/api/site-audit-health/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ site: input, report: data.auditReport })
        });
        fetchHistory();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    </div>
    return (
      <div style={{ maxWidth: 900, margin: "40px auto", background: "#fff", borderRadius: 18, boxShadow: "0 2px 24px #0002", padding: 36, fontFamily: 'Inter, sans-serif' }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 8 }}>Site Audit Health</h2>
        <div style={{ marginBottom: 10, color: "#0ea5e9", fontWeight: 600 }}>
          <span role="img" aria-label="health">🩺</span> Audit, manage, and analyze site health with AI and analytics.
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={4}
          style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc", marginBottom: 18 }}
          placeholder="Type your site or prompt here..."
          aria-label="Site input"
        />
        <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
          <button onClick={handleAudit} disabled={loading || !input} style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{loading ? "Auditing..." : "AI Audit"}</button>
          <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import history" />
          <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
          {exported && <a href={exported} download="site-audit-health-history.json" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
        </div>
        {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
        {response && (
          <div style={{ background: "#f1f5f9", borderRadius: 10, padding: 16, marginBottom: 12, color: "#23263a" }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>AI Audit Report:</div>
            <div>{response}</div>
          </div>
        )}
        {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
        <div style={{ marginTop: 24, background: "#f3f4f6", borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>History</div>
          <ul style={{ paddingLeft: 18 }}>
            {history.map(h => (
              <li key={h.id} style={{ marginBottom: 10 }}>
                <div><b>ID:</b> {h.id}</div>
                <div><b>Site:</b> {h.site}</div>
                <div><b>Report:</b> {h.report || JSON.stringify(h)}</div>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ marginTop: 24, background: "#f3f4f6", borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Analytics</div>
          <div style={{ fontSize: 15, color: "#23263a" }}>
            {analytics.length ? (
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "none", padding: 0, margin: 0 }}>{JSON.stringify(analytics, null, 2)}</pre>
            ) : (
              <span>No analytics yet. Generate or import history to see results.</span>
            )}
          </div>
        </div>
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
  );
}
