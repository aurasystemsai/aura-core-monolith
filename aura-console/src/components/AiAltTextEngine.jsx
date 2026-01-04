

import React, { useState } from "react";
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
    <div className="tool-ai-alt-text">
      <h2>AI Alt-Text Engine</h2>
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
          <label>Keywords (comma separated)</label>
          <input name="keywords" value={form.keywords} onChange={handleChange} style={{ width: "100%" }} />
        </div>
        <button type="submit" disabled={loading} style={{ marginTop: 12 }}>
          {loading ? "Generating..." : "Generate Alt Text"}
        </button>
      </form>
      {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 24 }}>
          <h3>Generated Alt Text</h3>
          <pre style={{ background: "#222", color: "#7fffd4", padding: 12, borderRadius: 6, overflowX: "auto" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
