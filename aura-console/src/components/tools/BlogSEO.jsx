import React, { useState } from "react";
export default function BlogSEO() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleRun = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    try {
      const res = await fetch("/api/blog-seo/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResponse(data.reply || "No response");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ maxWidth: 600, margin: "40px auto", background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px #0001", padding: 32 }}>
      <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 12 }}>Blog SEO</h2>
      <p style={{ color: "#444", marginBottom: 18 }}>
        Enter a blog post or SEO question below. The AI will analyze and provide SEO recommendations.
      </p>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={5}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc", marginBottom: 18 }}
        placeholder="Type your blog post or SEO question here..."
      />
      <button
        onClick={handleRun}
        disabled={loading || !input}
        style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "12px 32px", fontWeight: 700, fontSize: 17, cursor: "pointer", boxShadow: "0 2px 12px #22d3ee55" }}
      >
        {loading ? "Running..." : "Run Tool"}
      </button>
      {error && <div style={{ color: "#c00", marginTop: 18 }}>{error}</div>}
      {response && (
        <div style={{ marginTop: 32, background: "#f8fafc", borderRadius: 12, padding: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>AI Response:</div>
          <div style={{ fontSize: 16, color: "#23263a" }}>{response}</div>
        </div>
      )}
    </div>
  );
}
