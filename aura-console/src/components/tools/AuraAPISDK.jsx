import React, { useState, useRef } from "react";
import { apiFetch } from "../../api";

export default function AuraAPISDK() {
  const [endpoint, setEndpoint] = useState("");
  const [method, setMethod] = useState("GET");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState(null);
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState("");
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [feedback, setFeedback] = useState("");
  const fileInputRef = useRef();

  // Fetch docs
  const fetchDocs = async () => {
    try {
      const res = await apiFetch("/api/aura-api-sdk/docs");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setDocs(data.docs || []);
    } catch (err) {
      setError(err.message);
    }
  };

  // Test endpoint
  const testEndpoint = async () => {
    setError("");
    setResponse(null);
    try {
      const res = await apiFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method !== "GET" ? body : undefined
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Import/Export
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      setEndpoint("");
      setMethod("GET");
      setBody(evt.target.result);
      setImported(file.name);
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ endpoint, method, body, response }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await apiFetch("/api/aura-api-sdk/feedback", {
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
    <div className="tool-main-flex" style={{ fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Aura API SDK</h2>
      <div style={{ color: "#0ea5e9", fontWeight: 600, marginBottom: 18 }}>
        <span role="img" aria-label="api">🔗</span> Explore and test Aura API endpoints.
      </div>
      <div style={{ marginBottom: 18 }}>
        <button onClick={fetchDocs} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Load Docs</button>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <input
          value={endpoint}
          onChange={e => setEndpoint(e.target.value)}
          style={{ flex: 2, fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc" }}
          placeholder="API endpoint (e.g. /api/products)"
          aria-label="API endpoint input"
        />
        <select value={method} onChange={e => setMethod(e.target.value)} style={{ flex: 1, fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc" }} aria-label="HTTP method">
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
        <button onClick={testEndpoint} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Test</button>
      </div>
      {method !== "GET" && (
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={4}
          style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc", marginBottom: 18 }}
          placeholder="Request body (JSON)"
          aria-label="Request body input"
        />
      )}
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import API request" />
        <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
        {exported && <a href={exported} download="aura-api-sdk.json" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
      </div>
      {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      {response && (
        <div style={{ background: "#232336", borderRadius: 10, padding: 18, marginBottom: 18, color: "#f0f0f0" }}>
          <b>Response:</b>
          <pre style={{ fontSize: 15 }}>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
      {docs.length > 0 && (
        <div style={{ background: "#232336", borderRadius: 12, padding: 20, marginBottom: 18, color: "#f0f0f0" }}>
          <b>API Docs:</b>
          <ul style={{ paddingLeft: 18 }}>
            {docs.map((doc, idx) => (
              <li key={doc.id || idx} style={{ marginBottom: 8 }}>{doc.title}</li>
            ))}
          </ul>
        </div>
      )}
      <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: "#232336", borderRadius: 12, padding: 20 }} aria-label="Send feedback">
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={2}
          style={{ width: "100%", fontSize: 15, padding: 10, borderRadius: 8, border: "1px solid #6366f1", marginBottom: 12, background: "#18181b", color: "#f0f0f0" }}
          placeholder="Share your feedback or suggestions..."
          aria-label="Feedback input"
        />
        <button type="submit" style={{ background: "#7fffd4", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Send Feedback</button>
      </form>
    </div>
  );
}

