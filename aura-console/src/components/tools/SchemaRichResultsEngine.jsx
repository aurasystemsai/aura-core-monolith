import React, { useState, useRef, useEffect } from "react";
import { apiFetch, apiFetchJSON } from "../../api";

export default function SchemaRichResultsEngine() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [applyType, setApplyType] = useState("article");
  const [applyEntityId, setApplyEntityId] = useState("");
  const [applyBlogId, setApplyBlogId] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyResult, setApplyResult] = useState(null);
  const fileInputRef = useRef();

  const applySchemaToShopify = async () => {
    if (!response || !applyEntityId) return;
    setApplyLoading(true);
    setApplyResult(null);
    try {
      const res = await apiFetchJSON("/api/schema-rich-results-engine/shopify/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: applyType,
          entityId: applyEntityId,
          blogId: applyBlogId || undefined,
          schema: `<script type="application/ld+json">${response}</script>`,
        }),
      });
      setApplyResult(res.ok ? { ok: true, message: res.message } : { ok: false, message: res.error });
    } catch (e) {
      setApplyResult({ ok: false, message: e.message });
    } finally {
      setApplyLoading(false);
    }
  };

  // Fetch history
  const fetchHistory = async () => {
    try {
      const res = await apiFetchJSON("/api/schema-rich-results-engine/history");
      const data = res;
      if (data.ok) setHistory(data.history || []);
    } catch {}
  };
  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const res = await apiFetchJSON("/api/schema-rich-results-engine/analytics");
      const data = res;
      if (data.ok) setAnalytics(data.analytics || []);
    } catch {}
  };

  // AI Generate
  const handleRun = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    try {
      const res = await apiFetchJSON("/api/schema-rich-results-engine/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema: input })
      });
      const data = res;
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResponse(data.schemaReport || "No report generated");
      // Save to history
      await apiFetch("/api/schema-rich-results-engine/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema: input, report: data.schemaReport })
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
        const res = await apiFetchJSON("/api/schema-rich-results-engine/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: JSON.parse(evt.target.result) })
        });
        const data = res;
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

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await apiFetch("/api/schema-rich-results-engine/feedback", {
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
    <div style={{ background: "#09090b", color: "#f4f4f5", borderRadius: 18, boxShadow: "0 2px 24px #0002", padding: 36, fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 8 }}>Schema Rich Results Engine</h2>
      <div style={{ marginBottom: 10, color: "#0ea5e9", fontWeight: 600 }}>
        <span role="img" aria-label="sparkles"></span>Generate, manage, and analyze schema rich results with AI and analytics.
      </div>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={4}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc", marginBottom: 18 }}
        placeholder="Type your schema or prompt here..."
        aria-label="Schema input"
      />
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={handleRun} disabled={loading || !input} style={{ background: "#4f46e5", color: "#09090b", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{loading ? "Generating..." : "AI Generate"}</button>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#09090b", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import history" />
        <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
        {exported && <a href={exported} download="schema-rich-results-history.json" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
      </div>
      {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
      {response && (
        <div style={{ background: "#27272a", borderRadius: 10, padding: 16, marginBottom: 12, border: "1px solid #27272a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontWeight: 700, color: "#4f46e5", fontSize: 14 }}>AI Schema Report</span>
            <button onClick={() => navigator.clipboard?.writeText(response)} style={{ background: "transparent", border: "1px solid #52525b", borderRadius: 6, padding: "4px 12px", color: "#a1a1aa", fontSize: 12, cursor: "pointer" }}>Copy</button>
          </div>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: 14, color: "#e4e4e7" }}>{response}</div>
          {/* Apply schema to Shopify */}
          <div style={{ marginTop: 14, padding: "12px 14px", background: "#18181b", borderRadius: 10, border: "1px solid #3f3f46" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>🚀 Inject Schema into Shopify</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <select value={applyType} onChange={e => setApplyType(e.target.value)} style={{ background: "#27272a", color: "#fafafa", border: "1px solid #3f3f46", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}>
                <option value="article">Blog Article</option>
                <option value="product">Product</option>
              </select>
              <input value={applyEntityId} onChange={e => setApplyEntityId(e.target.value)} placeholder={applyType === 'article' ? 'Article ID' : 'Product ID'} style={{ background: "#27272a", color: "#fafafa", border: "1px solid #3f3f46", borderRadius: 8, padding: "6px 10px", fontSize: 13, width: 140 }} />
              {applyType === "article" && (
                <input value={applyBlogId} onChange={e => setApplyBlogId(e.target.value)} placeholder="Blog ID" style={{ background: "#27272a", color: "#fafafa", border: "1px solid #3f3f46", borderRadius: 8, padding: "6px 10px", fontSize: 13, width: 120 }} />
              )}
              <button
                onClick={applySchemaToShopify}
                disabled={applyLoading || !applyEntityId}
                style={{ background: applyResult?.ok ? "#22c55e" : "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 700, fontSize: 13, cursor: applyLoading || !applyEntityId ? "not-allowed" : "pointer", opacity: applyLoading || !applyEntityId ? 0.6 : 1 }}
              >
                {applyLoading ? "⌛ Injecting…" : applyResult?.ok ? "✅ Injected!" : "🚀 Apply to Shopify"}
              </button>
            </div>
            {applyResult && !applyResult.ok && <div style={{ fontSize: 12, color: "#f87171", marginTop: 6 }}>{applyResult.message}</div>}
            {applyResult?.ok && <div style={{ fontSize: 12, color: "#86efac", marginTop: 6 }}>{applyResult.message}</div>}
          </div>
        </div>
      )}
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      <div style={{ marginTop: 24, background: "#f4f4f5", borderRadius: 12, padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>History</div>
        <ul style={{ paddingLeft: 18 }}>
        {history.map(h => (
          <div key={h.id} style={{ background: "#09090b", borderRadius: 8, padding: "12px 16px", border: "1px solid #27272a", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, color: "#e4e4e7" }}>{h.schema ? h.schema.slice(0, 60) + "…" : `Schema #${h.id}`}</span>
              <span style={{ color: "#71717a" }}>{h.createdAt ? new Date(h.createdAt).toLocaleString() : ""}</span>
            </div>
            {h.report && <div style={{ fontSize: 13, color: "#a1a1aa" }}>{typeof h.report === "string" ? h.report.slice(0, 200) + (h.report.length > 200 ? "…" : "") : ""}</div>}
          </div>
        ))}
        </ul>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
        <div style={{ background: "#27272a", borderRadius: 10, padding: "12px 20px", border: "1px solid #27272a" }}>
          <div style={{ fontSize: 11, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Schemas Generated</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#4f46e5", marginTop: 2 }}>{history.length}</div>
        </div>
        <div style={{ background: "#27272a", borderRadius: 10, padding: "12px 20px", border: "1px solid #27272a" }}>
          <div style={{ fontSize: 11, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Events</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#4f46e5", marginTop: 2 }}>{analytics.length}</div>
        </div>
      </div>
    </div>
  );
}



