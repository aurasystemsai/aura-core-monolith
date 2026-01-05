

import React, { useState, useRef } from "react";

export default function AdvancedAnalyticsAttribution() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const chartRef = useRef();
  const fileInputRef = useRef();

  // Analyze handler
  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/advanced-analytics-attribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResult(data.result);
      setHistory(prev => [{ query, result: data.result }, ...prev].slice(0, 10));
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
    return (
      <div className="tools-panel" style={{ maxWidth: 1100, margin: "40px auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0, color: "var(--text)" }}>Advanced Analytics Attribution</h2>
          <button onClick={() => setDarkMode(d => !d)} aria-label="Toggle dark mode" style={{ background: "var(--card)", color: "var(--text)", border: "none", borderRadius: "var(--radius-md)", padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>{darkMode ? "Light" : "Dark"} Mode</button>
        </div>
        <div style={{ marginBottom: 10, color: "var(--accent)", fontWeight: 600 }}>
          <span role="img" aria-label="chart">📊</span> Analyze attribution and performance across all channels.
        </div>
        <button onClick={() => setShowOnboarding(v => !v)} style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
        {showOnboarding && onboardingContent}

        {/* Query Input */}
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          type="text"
          style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: "var(--radius-md)", border: "1px solid var(--border)", marginBottom: 18, background: "var(--bg-alt)", color: "var(--text)" }}
          placeholder="Describe your analytics or attribution question..."
          aria-label="Analytics query input"
        />
        <button onClick={handleAnalyze} disabled={loading || !query} style={{ background: "var(--accent)", color: "#23263a", border: "none", borderRadius: "var(--radius-md)", padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer", marginBottom: 18 }}>{loading ? "Analyzing..." : "Analyze"}</button>
        {error && <div style={{ color: "var(--error)", marginBottom: 10 }}>{error}</div>}

        {/* Result Visualization */}
        {result && (
          <div style={{ background: "var(--card)", borderRadius: "var(--radius-md)", padding: 16, marginBottom: 12, color: "var(--text)" }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Analysis Result:</div>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}

        {/* Import/Export */}
        <div style={{ marginBottom: 24 }}>
          <input type="file" accept="application/json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
          <button onClick={() => fileInputRef.current.click()} style={{ background: 'var(--accent)', color: '#23263a', border: 'none', borderRadius: 'var(--radius-md)', padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginRight: 12 }}>Import History</button>
          <button onClick={handleExport} style={{ background: 'var(--accent)', color: '#23263a', border: 'none', borderRadius: 'var(--radius-md)', padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Export History</button>
          {imported && <span style={{ marginLeft: 12, color: 'var(--accent)' }}>Imported: {imported}</span>}
          {exported && <a href={exported} download="analytics-history.json" style={{ marginLeft: 12, color: 'var(--accent)', textDecoration: 'underline' }}>Download Export</a>}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={{ marginTop: 24, background: "var(--bg-alt)", borderRadius: "var(--radius-md)", padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Analysis History</div>
            <ul style={{ paddingLeft: 18 }}>
              {history.map((h, i) => (
                <li key={i} style={{ marginBottom: 10 }}>
                  <div><b>Query:</b> {h.query}</div>
                  <div><b>Result:</b> {JSON.stringify(h.result).slice(0, 120)}{JSON.stringify(h.result).length > 120 ? "..." : ""}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Feedback */}
        <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: 'var(--card)', borderRadius: 'var(--radius-md)', padding: 20 }} aria-label="Send feedback">
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            rows={3}
            style={{ width: '100%', fontSize: 16, padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 12, background: 'var(--bg-alt)', color: 'var(--text)' }}
            placeholder="Share your feedback or suggestions..."
            aria-label="Feedback"
          />
          <button type="submit" style={{ background: 'var(--accent)', color: '#23263a', border: 'none', borderRadius: 'var(--radius-md)', padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Send Feedback</button>
          {error && <div style={{ color: 'var(--error)', marginTop: 8 }}>{error}</div>}
        </form>

        {/* Accessibility & Compliance */}
        <div style={{ marginTop: 32, fontSize: 13, color: 'var(--muted)', textAlign: "center" }}>
          <span>Best-in-class SaaS features. Accessibility: WCAG 2.1, keyboard navigation, color contrast. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: 'var(--accent)', textDecoration: "underline" }}>Contact Support</a></span>
        </div>
      </div>
    );
        <button onClick={handleExport} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Export History</button>
        {imported && <span style={{ marginLeft: 12, color: '#6366f1' }}>Imported: {imported}</span>}
        {exported && <a href={exported} download="analytics-history.json" style={{ marginLeft: 12, color: '#22c55e', textDecoration: 'underline' }}>Download Export</a>}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginTop: 24, background: darkMode ? "#334155" : "#f3f4f6", borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Analysis History</div>
          <ul style={{ paddingLeft: 18 }}>
            {history.map((h, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                <div><b>Query:</b> {h.query}</div>
                <div><b>Result:</b> {JSON.stringify(h.result).slice(0, 120)}{JSON.stringify(h.result).length > 120 ? "..." : ""}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback */}
      <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: '#f8fafc', borderRadius: 12, padding: 20 }} aria-label="Send feedback">
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={3}
          style={{ width: '100%', fontSize: 16, padding: 12, borderRadius: 8, border: '1px solid #ccc', marginBottom: 12 }}
          placeholder="Share your feedback or suggestions..."
          aria-label="Feedback"
        />
        <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Send Feedback</button>
        {error && <div style={{ color: '#ef4444', marginTop: 8 }}>{error}</div>}
      </form>

      {/* Accessibility & Compliance */}
      <div style={{ marginTop: 32, fontSize: 13, color: darkMode ? "#a3e635" : "#64748b", textAlign: "center" }}>
        <span>Best-in-class SaaS features. Accessibility: WCAG 2.1, keyboard navigation, color contrast. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: darkMode ? "#a3e635" : "#0ea5e9", textDecoration: "underline" }}>Contact Support</a></span>
      </div>
    </div>
  );
}
