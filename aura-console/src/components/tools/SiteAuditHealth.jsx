import React, { useState, useRef, useEffect } from "react";
import BackButton from "./BackButton";
import { apiFetch } from "../../api";

export default function SiteAuditHealth() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const fileInputRef = useRef();

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
            }
      
        // Import/Export
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async evt => {
      try {
        const res = await apiFetch("/api/site-audit-health/import", {
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
    setTimeout(() =>URL.revokeObjectURL(url), 10000);
  };

  const handleFeedback = async () => {
    if (!feedback) return;
    try {
      await apiFetch("/api/site-audit-health/feedback", {
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
    <div style={{ background: "#09090b", color: "#f4f4f5", borderRadius: 18, boxShadow: "0 2px 24px #0002", padding: 36, fontFamily: "Inter, sans-serif" }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 6 }}>Site Audit & Health</h2>
      <p style={{ color: "#a1a1aa", marginBottom: 20, fontSize: 14 }}>Enter a site URL to run a comprehensive AI-powered health and SEO audit.</p>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        type="text"
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #52525b", marginBottom: 16, background: "#27272a", color: "#f4f4f5", boxSizing: "border-box" }}
        placeholder="https://yoursite.com"
        aria-label="Site URL"
        onKeyDown={e => e.key === "Enter" && !loading && input && handleAudit()}
      />
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={handleAudit} disabled={loading || !input} style={{ background: "#4f46e5", color: "#09090b", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 15, cursor: loading || !input ? "not-allowed" : "pointer", opacity: loading || !input ? 0.6 : 1 }}>
          {loading ? "Auditing…" : "Run Audit"}
        </button>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#52525b", color: "#f4f4f5", border: "1px solid #52525b", borderRadius: 8, padding: "10px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />
        <button onClick={handleExport} disabled={!history.length} style={{ background: "#52525b", color: "#f4f4f5", border: "1px solid #52525b", borderRadius: 8, padding: "10px 18px", fontWeight: 600, fontSize: 14, cursor: history.length ? "pointer" : "not-allowed", opacity: history.length ? 1 : 0.5 }}>Export JSON</button>
        {exported && <a href={exported} download="site-audit-history.json" style={{ alignSelf: "center", color: "#4f46e5", fontWeight: 600, fontSize: 13 }}>Download</a>}
      </div>
      {imported && <div style={{ color: "#22c55e", marginBottom: 10, fontSize: 13 }}>Imported: {imported}</div>}
      {error && <div style={{ color: "#ef4444", marginBottom: 12, padding: "10px 14px", background: "#2d1515", borderRadius: 8, fontSize: 14 }}> {error}</div>}
      {response && (
        <div style={{ background: "#27272a", borderRadius: 12, padding: 20, marginBottom: 20, border: "1px solid #27272a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontWeight: 700, color: "#4f46e5", fontSize: 15 }}>Audit Report</span>
            <button onClick={() => navigator.clipboard?.writeText(response)} style={{ background: "transparent", border: "1px solid #52525b", borderRadius: 6, padding: "4px 12px", color: "#a1a1aa", fontSize: 12, cursor: "pointer" }}>Copy</button>
          </div>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: 14, color: "#e4e4e7" }}>{response}</div>
        </div>
      )}
      {/* Stat Cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[{ label: "Total Audits", value: history.length }, { label: "Events Tracked", value: analytics.length }].map(s => (
          <div key={s.label} style={{ background: "#27272a", borderRadius: 10, padding: "14px 22px", border: "1px solid #27272a", minWidth: 130 }}>
            <div style={{ fontSize: 11, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#4f46e5", marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>
      {/* History */}
      <div style={{ background: "#18181b", borderRadius: 12, padding: 18, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: "#4f46e5" }}>Audit History</div>
        {history.length === 0 ? (
          <div style={{ color: "#52525b", fontSize: 14, textAlign: "center", padding: "24px 0" }}>No audits yet. Enter a URL above to get started.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {history.map((h, i) => (
              <div key={h.id || i} style={{ background: "#09090b", borderRadius: 8, padding: "12px 16px", border: "1px solid #27272a" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ fontWeight: 700, color: "#e4e4e7" }}>{h.site}</span>
                  <span style={{ color: "#71717a" }}>{h.createdAt ? new Date(h.createdAt).toLocaleString() : `#${i+1}`}</span>
                </div>
                {h.report && <div style={{ marginTop: 6, fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>{typeof h.report === "string" ? h.report.slice(0, 200) + (h.report.length > 200 ? "…" : "") : ""}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


