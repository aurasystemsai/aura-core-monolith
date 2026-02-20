﻿import React, { useState, useRef } from "react";

export default function AISupportAssistant() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const fileInputRef = useRef();

  // Run handler
  const handleRun = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    try {
      const res = await fetch("/api/ai-support-assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResponse(data.reply || "No response");
      setHistory(prev => [{ input, reply: data.reply || "No response" }, ...prev].slice(0, 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Import/export handlers
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const importedHistory = JSON.parse(evt.target.result);
        setHistory(importedHistory);
        setImported(file.name);
      } catch (err) {
        setError("Invalid file format");
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

  // Feedback handler
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await fetch("/api/ai-support-assistant/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setFeedback("");
    } catch (err) {
      setError("Failed to send feedback");
    }
  };

  // Onboarding content
  const onboardingContent = (
    <div style={{ padding: 24, background: '#3f3f46', borderRadius: 12, marginBottom: 18, color: '#fafafa' }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to AI Support Assistant</h3>
      <ul style={{ margin: '16px 0 0 18px', color: '#52525b', fontSize: 16 }}>
        <li>Enter a support question or task to get AI-powered solutions</li>
        <li>Review analytics, export results, and view history</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: '#09090b', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Get Started</button>
    </div>
  );

  // Main UI
  return (
    <div style={{ background: "#18181b", borderRadius: 16, boxShadow: "0 2px 16px #0008", padding: 32, color: '#fafafa' }}>
      <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 12 }}>AI Support Assistant</h2>
      <button onClick={() => setShowOnboarding(v => !v)} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
      {showOnboarding && onboardingContent}
      <p style={{ color: "#444", marginBottom: 18 }}>
        Enter a support question or task below. The AI will generate a suggested solution or workflow.
      </p>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={5}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc", marginBottom: 18 }}
        placeholder="Type your support task here..."
        aria-label="AISupportAssistant input"
      />
      <button
        onClick={handleRun}
        disabled={loading || !input}
        style={{ background: "#818cf8", color: "#09090b", border: "none", borderRadius: 8, padding: "12px 32px", fontWeight: 700, fontSize: 17, cursor: "pointer", boxShadow: "0 2px 12px #22d3ee55" }}
      >
        {loading ? "Running..." : "Run Tool"}
      </button>
      {error && <div style={{ color: "#c00", marginTop: 18 }}>{error}</div>}
      {response && (
        <div style={{ marginTop: 32, background: "#3f3f46", borderRadius: 12, padding: 24, color: '#fafafa' }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>AI Response:</div>
          <div style={{ fontSize: 16, color: "#09090b" }}>{response}</div>
        </div>
      )}

      {/* Import/Export */}
      <div style={{ marginTop: 24, marginBottom: 24 }}>
        <input type="file" accept="application/json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
        <button onClick={() => fileInputRef.current.click()} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginRight: 12 }}>Import History</button>
        <button onClick={handleExport} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Export History</button>
        {imported && <span style={{ marginLeft: 12, color: '#6366f1' }}>Imported: {imported}</span>}
        {exported && <a href={exported} download="ai-support-assistant-history.json" style={{ marginLeft: 12, color: '#22c55e', textDecoration: 'underline' }}>Download Export</a>}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginTop: 24, background: "#f3f4f6", borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Insights History</div>
          <ul style={{ paddingLeft: 18 }}>
            {history.map((h, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                <div><b>Input:</b> {h.input?.slice(0, 60)}{h.input?.length > 60 ? "..." : ""}</div>
                <div><b>Reply:</b> {h.reply?.slice(0, 120)}{h.reply?.length > 120 ? "..." : ""}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Accessibility & Compliance */}
      <div style={{ marginTop: 32, fontSize: 13, color: '#64748b', textAlign: 'center' }}>
        <span>Best-in-class SaaS features. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>Contact Support</a></span>
      </div>
    </div>
  );
}


