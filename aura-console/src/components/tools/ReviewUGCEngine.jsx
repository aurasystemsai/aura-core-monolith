﻿import React, { useState, useRef, useEffect } from "react";
import { apiFetch } from "../../api";

export default function ReviewUGCEngine() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [feedback, setFeedback] = useState("");
  const fileInputRef = useRef();

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      const res = await apiFetch("/api/review-ugc-engine/reviews");
      const data = await res.json();
      if (data.ok) setReviews(data.reviews || []);
    } catch {}
  };
  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const res = await apiFetch("/api/review-ugc-engine/analytics");
      const data = await res.json();
      if (data.ok) setAnalytics(data.analytics || []);
    } catch {}
  };

  // AI Generate
  const handleRun = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    try {
      const res = await apiFetch("/api/review-ugc-engine/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResponse(data.reply || "No response");
      // Save review
      await apiFetch("/api/review-ugc-engine/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, content: data.reply })
      });
      fetchReviews();
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
        const res = await apiFetch("/api/review-ugc-engine/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: JSON.parse(evt.target.result) })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Unknown error");
        setImported(file.name);
        fetchReviews();
      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(reviews, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() =>URL.revokeObjectURL(url), 10000);
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await apiFetch("/api/review-ugc-engine/feedback", {
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
    fetchReviews();
    fetchAnalytics();
  }, []);

  return (
    <div style={{ background: "#141414", color: "#f3f4f6", borderRadius: 18, boxShadow: "0 2px 24px #0002", padding: 36, fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 8 }}>Review UGC Engine</h2>
      <div style={{ marginBottom: 10, color: "#0ea5e9", fontWeight: 600 }}>
        <span role="img" aria-label="sparkles"></span>Generate, import, and analyze reviews and UGC with AI and analytics.
      </div>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={4}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc", marginBottom: 18 }}
        placeholder="Type your review prompt here..."
        aria-label="Review prompt input"
      />
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={handleRun} disabled={loading || !input} style={{ background: "#7fffd4", color: "#141414", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{loading ? "Generating..." : "AI Generate"}</button>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#141414", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import reviews" />
        <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
        {exported && <a href={exported} download="reviews.json" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
      </div>
      {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
      {response && (
        <div style={{ background: "#2e2e2e", borderRadius: 10, padding: 16, marginBottom: 12, border: "1px solid #2e2e2e" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontWeight: 700, color: "#7fffd4", fontSize: 14 }}>AI Review</span>
            <button onClick={() => navigator.clipboard?.writeText(response)} style={{ background: "transparent", border: "1px solid #4a4a4a", borderRadius: 6, padding: "4px 12px", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>Copy</button>
          </div>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: 14, color: "#e2e8f0" }}>{response}</div>
        </div>
      )}
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      <div style={{ marginTop: 24, background: "#282828", borderRadius: 12, padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10, color: "#e2e8f0" }}>Review History</div>
        {reviews.map(r => (
          <div key={r.id} style={{ background: "#141414", borderRadius: 8, padding: "12px 16px", border: "1px solid #2e2e2e", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, color: "#e2e8f0" }}>{r.prompt ? r.prompt.slice(0, 60) + "…" : `Review #${r.id}`}</span>
              <span style={{ color: "#64748b" }}>{r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</span>
            </div>
            {r.content && <div style={{ fontSize: 13, color: "#94a3b8" }}>{typeof r.content === "string" ? r.content.slice(0, 200) + (r.content.length > 200 ? "…" : "") : ""}</div>}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
        <div style={{ background: "#2e2e2e", borderRadius: 10, padding: "12px 20px", border: "1px solid #2e2e2e" }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Total Reviews</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#7fffd4", marginTop: 2 }}>{reviews.length}</div>
        </div>
        <div style={{ background: "#2e2e2e", borderRadius: 10, padding: "12px 20px", border: "1px solid #2e2e2e" }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Events</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#7fffd4", marginTop: 2 }}>{analytics.length}</div>
        </div>
      </div>
    </div>
  );
}




