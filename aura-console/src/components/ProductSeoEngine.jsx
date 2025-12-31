
import React, { useState } from "react";

export default function ProductSeoEngine() {
  const [form, setForm] = useState({
    productTitle: "",
    productDescription: "",
    brand: "",
    tone: "",
    useCases: "",
    prompt: "",
    language: ""
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
      const res = await fetch("/api/run/product-seo", {
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
    <div className="tool-product-seo">
      <h2>Product SEO Engine</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
        <div>
          <label>Product Title*</label>
          <input name="productTitle" value={form.productTitle} onChange={handleChange} required style={{ width: "100%" }} />
        </div>
        <div>
          <label>Product Description*</label>
          <textarea name="productDescription" value={form.productDescription} onChange={handleChange} required style={{ width: "100%" }} />
        </div>
        <div>
          <label>Brand</label>
          <input name="brand" value={form.brand} onChange={handleChange} style={{ width: "100%" }} />
        </div>
        <div>
          <label>Tone</label>
          <input name="tone" value={form.tone} onChange={handleChange} style={{ width: "100%" }} />
        </div>
        <div>
          <label>Use Cases</label>
          <input name="useCases" value={form.useCases} onChange={handleChange} style={{ width: "100%" }} />
        </div>
        <div>
          <label>Prompt (optional)</label>
          <input name="prompt" value={form.prompt} onChange={handleChange} style={{ width: "100%" }} />
        </div>
        <div>
          <label>Language (optional)</label>
          <input name="language" value={form.language} onChange={handleChange} style={{ width: "100%" }} />
        </div>
        <button type="submit" disabled={loading} style={{ marginTop: 12 }}>
          {loading ? "Generating..." : "Generate SEO Content"}
        </button>
      </form>
      {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 24 }}>
          <h3>SEO Suggestions</h3>
          <pre style={{ background: "#222", color: "#7fffd4", padding: 12, borderRadius: 6, overflowX: "auto" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
