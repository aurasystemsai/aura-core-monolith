

import React, { useState, useRef, useEffect } from "react";
import { apiFetch } from "../api";

export default function AiAltTextEngine() {
  const [form, setForm] = useState({
    imageUrl: "",
    productTitle: "",
    productDescription: "",
    keywords: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState([]);
  const [batchResults, setBatchResults] = useState([]);
  const [feedback, setFeedback] = useState("");
  const fileInputRef = useRef();

  // Analytics
  const fetchAnalytics = async () => {
    try {
      const res = await apiFetch("/api/ai-alt-text-engine/analytics");
      const data = await res.json();
      if (data.ok) setAnalytics(data.analytics || []);
    } catch {}
  };

  // Batch Upload
  const handleBatchUpload = async e => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);
    setError("");
    setBatchResults([]);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append("images", f));
      const res = await apiFetch("/api/ai-alt-text-engine/batch", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setBatchResults(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await apiFetch("/api/ai-alt-text-engine/feedback", {
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
    fetchAnalytics();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await apiFetch("/api/run/ai-alt-text-engine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResult(data.result || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-ai-alt-text" style={{ maxWidth: 900, margin: "40px auto", background: "#0a0a0a", color: "#f3f4f6", borderRadius: 18, boxShadow: "0 2px 24px #0002", padding: 36, fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 8 }}>AI Alt-Text Engine</h2>
      <div style={{ marginBottom: 10, color: "#0ea5e9", fontWeight: 600 }}>
        <span role="img" aria-label="sparkles">✨</span> Generate alt text for images with AI, batch upload, and analytics.
      </div>
      <form onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
        <div>
          <label>Image URL*</label>
          <input name="imageUrl" value={form.imageUrl} onChange={handleChange} required style={{ width: "100%" }} />
        </div>
        <div>
          <label>Product Title</label>
          <input name="productTitle" value={form.productTitle} onChange={handleChange} style={{ width: "100%" }} />
        </div>
        <div>
          <label>Product Description</label>
          <textarea name="productDescription" value={form.productDescription} onChange={handleChange} style={{ width: "100%" }} />
        </div>
        <div>
          <label>Keywords</label>
          <input name="keywords" value={form.keywords} onChange={handleChange} style={{ width: "100%" }} />
        </div>
        <button type="submit" disabled={loading} style={{ background: "#7fffd4", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer", marginTop: 12 }}>{loading ? "Generating..." : "AI Generate"}</button>
      </form>
      <div style={{ display: "flex", gap: 12, margin: "18px 0" }}>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Batch Upload</button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleBatchUpload} aria-label="Batch upload images" />
      </div>
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      {result && (
        <div style={{ background: "#222222", borderRadius: 10, padding: 16, marginBottom: 12, color: "#f0f0f0" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>AI Alt Text:</div>
          <div>{typeof result === "string" ? result : JSON.stringify(result)}</div>
        </div>
      )}
      {batchResults.length > 0 && (
        <div style={{ background: "#f3f4f6", borderRadius: 12, padding: 18, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Batch Results</div>
          <ul style={{ paddingLeft: 18 }}>
            {batchResults.map((r, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                <div><b>File:</b> {r.fileName}</div>
                <div><b>Alt Text:</b> {r.altText}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ marginTop: 24, background: "#f3f4f6", borderRadius: 12, padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Analytics</div>
        <div style={{ fontSize: 15, color: "#0a0a0a" }}>
          {analytics.length ? (
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "none", color: "#f3f4f6", padding: 0, margin: 0 }}>{JSON.stringify(analytics, null, 2)}</pre>
          ) : (
            <span>No analytics yet. Generate or upload images to see results.</span>
          )}
        </div>
      </div>
      <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: "#222222", borderRadius: 12, padding: 20 }} aria-label="Send feedback">
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={2}
          style={{ width: "100%", fontSize: 15, padding: 10, borderRadius: 8, border: "1px solid #555", marginBottom: 12, background: "#0a0a0a", color: "#f3f4f6" }}
          placeholder="Share your feedback or suggestions..."
          aria-label="Feedback input"
        />
        <button type="submit" style={{ background: "#7fffd4", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Send Feedback</button>
      </form>
    </div>
  );
}


