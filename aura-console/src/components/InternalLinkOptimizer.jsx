
import React, { useState } from "react";

export default function InternalLinkOptimizer() {
  const [form, setForm] = useState({
    pageUrl: "",
    pageType: "product",
    context: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");

  React.useEffect(() => {
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken || ""));
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
      const res = await fetch("/api/run/internal-link-optimizer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "csrf-token": csrfToken
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
    <div className="tool-internal-link-optimizer">
      <h2>Internal Link Optimiser</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
        <div>
          <label>Page URL*</label>
          <input name="pageUrl" value={form.pageUrl} onChange={handleChange} required style={{ width: "100%" }} />
        </div>
        <div>
          <label>Page Type</label>
          <select name="pageType" value={form.pageType} onChange={handleChange} style={{ width: "100%" }}>
            <option value="product">Product</option>
            <option value="blog">Blog</option>
            <option value="landing">Landing</option>
            <option value="category">Category</option>
            <option value="docs">Docs</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label>Context (optional)</label>
          <textarea name="context" value={form.context} onChange={handleChange} style={{ width: "100%" }} />
        </div>
        <button type="submit" disabled={loading} style={{ marginTop: 12 }}>
          {loading ? "Generating..." : "Suggest Internal Links"}
        </button>
      </form>
      {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 24 }}>
          <h3>Suggested Internal Links</h3>
          <pre style={{ background: "var(--background-tertiary)", color: "var(--text-accent)", padding: 12, borderRadius: 6, overflowX: "auto" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
