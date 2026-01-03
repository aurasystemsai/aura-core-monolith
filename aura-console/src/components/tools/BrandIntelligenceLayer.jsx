
import React, { useState, useRef } from "react";

export default function BrandIntelligenceLayer() {
  const [input, setInput] = useState("");
  const [bulkUpload, setBulkUpload] = useState(null);
  const [response, setResponse] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [collaborators, setCollaborators] = useState("");
  const [notification, setNotification] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const fileInputRef = useRef();

  const handleRun = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    setAnalytics(null);
    setNotification("");
    try {
      let body, headers;
      if (bulkUpload) {
        body = new FormData();
        body.append("file", bulkUpload);
        if (input) body.append("prompt", input);
        headers = {};
      } else {
        body = JSON.stringify({ prompt: input });
        headers = { "Content-Type": "application/json" };
      }
      const res = await fetch("/api/brand-intelligence-layer/ai/analyze", {
        method: "POST",
        headers,
        body
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResponse(data.reply || "No response");
      setAnalytics(data.analytics || null);
      setNotification("Analysis complete.");
      setHistory(prev => [{
        prompt: input,
        bulkUpload: bulkUpload ? bulkUpload.name : null,
        reply: data.reply || "No response",
        analytics: data.analytics || null
      }, ...prev].slice(0, 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!response) return;
    const blob = new Blob([response], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "brand-intelligence.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFeedback = async () => {
    if (!feedback) return;
    setNotification("Sending feedback...");
    try {
      await fetch("/api/brand-intelligence-layer/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setNotification("Feedback sent. Thank you!");
      setFeedback("");
    } catch {
      setNotification("Failed to send feedback");
    }
  };

  const onboardingContent = (
    <div style={{ padding: 24, background: darkMode ? "#23263a" : "#f1f5f9", borderRadius: 12, marginBottom: 18 }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Brand Intelligence Layer</h3>
      <ul style={{ margin: "16px 0 0 18px", color: darkMode ? "#a3e635" : "#334155", fontSize: 16 }}>
        <li>Enter a brand question or upload a CSV/Excel file for bulk analysis</li>
        <li>Get AI-powered brand analytics, sentiment, and benchmarking</li>
        <li>Export results and review insights history</li>
        <li>Collaborate and share with your team</li>
        <li>Integrate with social, Shopify, and analytics APIs</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Get Started</button>
    </div>
  );

  return (
    <div style={{
      maxWidth: 800,
      margin: "40px auto",
      background: darkMode ? "#18181b" : "#fff",
      borderRadius: 18,
      boxShadow: "0 2px 24px #0002",
      padding: 36,
      color: darkMode ? "#a3e635" : "#23263a",
      fontFamily: 'Inter, sans-serif',
      transition: "background 0.3s, color 0.3s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0 }}>Brand Intelligence Layer</h2>
        <button onClick={() => setDarkMode(d => !d)} aria-label="Toggle dark mode" style={{ background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>{darkMode ? "Light" : "Dark"} Mode</button>
      </div>
      <div style={{ marginBottom: 10, color: darkMode ? "#a3e635" : "#0ea5e9", fontWeight: 600 }}>
        <span role="img" aria-label="brand">🏷️</span> AI-powered brand analytics, bulk upload, insights, and collaboration.
      </div>
      <button onClick={() => setShowOnboarding(true)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
      {showOnboarding && onboardingContent}
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={4}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 18, background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
        placeholder="Type your brand question or data here..."
        aria-label="Brand input"
      />
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 600, marginRight: 12 }}>Bulk Upload:</label>
        <input ref={fileInputRef} type="file" accept=".csv,.xlsx" onChange={e => setBulkUpload(e.target.files[0])} style={{ marginLeft: 8 }} aria-label="Bulk upload" />
        <label style={{ fontWeight: 600, marginLeft: 18 }}>Collaborators:</label>
        <input type="text" value={collaborators} onChange={e => setCollaborators(e.target.value)} placeholder="Emails, comma separated" style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc" }} />
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={handleRun} disabled={loading || (!input && !bulkUpload)} style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "12px 32px", fontWeight: 700, fontSize: 17, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 2px 12px #22d3ee55" }}>{loading ? "Running..." : "Run Tool"}</button>
        <button onClick={handleExport} disabled={!response} style={{ background: "#e0e7ff", color: "#23263a", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: response ? "pointer" : "not-allowed" }}>Export</button>
      </div>
      {notification && <div style={{ color: "#0af", marginTop: 12, fontWeight: 600 }}>{notification}</div>}
      {error && <div style={{ color: "#c00", marginTop: 18 }}>{error}</div>}
      {analytics && (
        <div style={{ marginTop: 24, background: darkMode ? "#334155" : "#f3f4f6", borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Analytics</div>
          <div style={{ fontSize: 16 }}>{JSON.stringify(analytics)}</div>
        </div>
      )}
      {response && (
        <div style={{ marginTop: 32, background: darkMode ? "#23263a" : "#f8fafc", borderRadius: 12, padding: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>AI Response:</div>
          <div style={{ fontSize: 16, color: darkMode ? "#a3e635" : "#23263a" }}>{response}</div>
        </div>
      )}
      {history.length > 0 && (
        <div style={{ marginTop: 32, background: darkMode ? "#23263a" : "#f8fafc", borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Insights History</div>
          <ul style={{ paddingLeft: 18 }}>
            {history.map((h, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                <div><b>Prompt:</b> {h.prompt?.slice(0, 60)}{h.prompt?.length > 60 ? "..." : ""}</div>
                <div><b>Bulk Upload:</b> {h.bulkUpload || "-"}</div>
                <div><b>Reply:</b> {h.reply?.slice(0, 60)}{h.reply?.length > 60 ? "..." : ""}</div>
                <div><b>Analytics:</b> {h.analytics ? JSON.stringify(h.analytics) : "-"}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <form
        onSubmit={e => { e.preventDefault(); handleFeedback(); }}
        style={{ marginTop: 32, background: darkMode ? "#23263a" : "#f8fafc", borderRadius: 12, padding: 20 }}
        aria-label="Send feedback"
      >
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={2}
          style={{ width: "100%", fontSize: 15, padding: 10, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 12, background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
          placeholder="Share your feedback or suggestions..."
          aria-label="Feedback input"
        />
        <button
          type="submit"
          style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
        >
          Send Feedback
        </button>
      </form>
      <div style={{ marginTop: 32, fontSize: 13, color: darkMode ? "#a3e635" : "#64748b", textAlign: "center" }}>
        <span>Integrations: <b>Social</b>, <b>Shopify</b>, <b>Analytics APIs</b> | Accessible, secure, and best-in-class SaaS features.</span>
      </div>
    </div>
  );
}
