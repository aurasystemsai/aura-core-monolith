import React, { useState, useEffect } from 'react';
import './CustomerDataPlatform.css';

function FeedbackModal({ open, onClose, onSubmit }) {
  const [text, setText] = React.useState('');
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#0a0a0a', borderRadius: 14, padding: 28, minWidth: 340, boxShadow: '0 8px 32px #000a' }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12, color: '#f3f4f6' }}>Send Feedback</div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={4} style={{ width: '100%', background: '#1e1e1e', color: '#f3f4f6', border: '1px solid #333333', borderRadius: 8, padding: 10, fontSize: 14, boxSizing: 'border-box' }} placeholder='Share your feedback...' />
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button onClick={() => { onSubmit(text); setText(''); }} disabled={!text} style={{ background: '#7fffd4', color: '#0a0a0a', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 700, cursor: 'pointer' }}>Submit</button>
          <button onClick={onClose} style={{ background: '#333333', color: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// Main CDP Component

export default function CustomerDataPlatform() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [analytics, setAnalytics] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [notification, setNotification] = useState("");
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [complianceInfo, setComplianceInfo] = useState(null);
  const [rbacStatus, setRbacStatus] = useState(null);
  const [pluginStatus, setPluginStatus] = useState(null);

  const handleQuery = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/customer-data-platform/query", {
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

  const onboardingContent = (
    <div style={{ padding: 24, background: darkMode ? "#0a0a0a" : "#f1f5f9", borderRadius: 12, marginBottom: 18 }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Customer Data Platform</h3>
      <ul style={{ margin: "16px 0 0 18px", color: darkMode ? "#a3e635" : "#333333", fontSize: 16 }}>
        <li>Unified customer profiles and segmentation</li>
        <li>Query, export, and analyze customer data</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#0a0a0a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Get Started</button>
    </div>
  );

  // Flagship: fetch analytics
  const fetchAnalytics = async () => {
    setShowAnalytics(true);
    try {
      const res = await fetch("/api/customer-data-platform/analytics");
      const data = await res.json();
      setAnalytics(data.analytics || []);
    } catch {
      setAnalytics([]);
    }
  };

  // Flagship: import/export
  const handleImport = async e => {
    setImporting(true);
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    await fetch("/api/customer-data-platform/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: text
    });
    setImporting(false);
    setNotification("Import complete");
  };
  const handleExport = async () => {
    setExporting(true);
    const res = await fetch("/api/customer-data-platform/export");
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customer-data.json";
    a.click();
    setExporting(false);
    setNotification("Export complete");
  };

  // Flagship: feedback
  const handleFeedbackSubmit = async feedback => {
    await fetch("/api/customer-data-platform/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback })
    });
    setShowFeedback(false);
    setNotification("Feedback sent. Thank you!");
  };

  // Flagship: accessibility toggle
  const toggleAccessibility = () => setAccessibilityMode(m => !m);

  // Flagship: compliance info
  const fetchCompliance = async () => {
    const res = await fetch("/api/customer-data-platform/compliance");
    const data = await res.json();
    setComplianceInfo(data.compliance);
  };

  // Flagship: RBAC check
  const checkRBAC = async () => {
    const res = await fetch("/api/customer-data-platform/rbac/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: "me", action: "view" })
    });
    const data = await res.json();
    setRbacStatus(data.allowed ? "Access granted" : "Access denied");
  };

  // Flagship: plugin system
  const runPlugin = async () => {
    const res = await fetch("/api/customer-data-platform/plugin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // ...existing code...
    });
    setPluginStatus("Plugin executed");
  };

  return (
    <div style={{
      
      margin: "40px auto",
      background: darkMode ? "#18181b" : accessibilityMode ? "#e0f7fa" : "#fff",
      borderRadius: 18,
      boxShadow: "0 2px 24px #0002",
      padding: 36,
      color: darkMode ? "#a3e635" : accessibilityMode ? "#0a0a0a" : "#0a0a0a",
      fontFamily: 'Inter, sans-serif',
      transition: "background 0.3s, color 0.3s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0 }}>Customer Data Platform</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setDarkMode(d => !d)} aria-label="Toggle dark mode" style={{ background: "#0a0a0a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>{darkMode ? "Light" : "Dark"} Mode</button>
          <button onClick={toggleAccessibility} aria-label="Toggle accessibility mode" style={{ background: accessibilityMode ? "#a3e635" : "#e0e7ff", color: accessibilityMode ? "#0a0a0a" : "#6366f1", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Accessibility</button>
          <button onClick={() => setShowHelp(true)} aria-label="Help" style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>?</button>
        </div>
      </div>
      <div style={{ marginBottom: 10, color: darkMode ? "#a3e635" : "#0ea5e9", fontWeight: 600 }}>
        <span role="img" aria-label="customer">👥</span> Query and analyze unified customer data.
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button onClick={() => setShowOnboarding(true)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
        <button onClick={fetchAnalytics} style={{ background: "#eab308", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>📊 Analytics</button>
        <label style={{ background: "#a3e635", color: "#0a0a0a", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
          ⬆ Import
          <input type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} disabled={importing} />
        </label>
        <button onClick={handleExport} style={{ background: "#a3e635", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }} disabled={exporting}>⬇ Export</button>
        <button onClick={() => setShowFeedback(true)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>💬 Feedback</button>
        <button onClick={checkRBAC} style={{ background: "#e0e7ff", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>RBAC</button>
        <button onClick={fetchCompliance} style={{ background: "#e0e7ff", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Compliance</button>
        <button onClick={runPlugin} style={{ background: "#e0e7ff", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>⚙ Plugin</button>
      </div>
      {notification && <div style={{ color: "#22c55e", marginBottom: 10 }}>{notification}</div>}
      {showHelp && (
        <div style={{ background: darkMode ? "#0a0a0a" : "#f1f5f9", borderRadius: 12, padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontWeight: 700, fontSize: 22 }}>Help & Documentation</h3>
          <ul style={{ margin: "16px 0 0 18px", color: darkMode ? "#a3e635" : "#333333", fontSize: 16 }}>
            <li>How to use customer data platform features</li>
            <li>Best practices for segmentation and analysis</li>
            <li>Accessibility and compliance information</li>
            <li>Integrating plugins and webhooks</li>
            <li>Contact support for advanced help</li>
          </ul>
          <button onClick={() => setShowHelp(false)} style={{ marginTop: 18, background: "#0a0a0a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Close Help</button>
        </div>
      )}
      {showFeedback && <FeedbackModal open={showFeedback} onClose={() => setShowFeedback(false)} onSubmit={handleFeedbackSubmit} />}
      {showAnalytics && (
        <div style={{ background: darkMode ? "#0a0a0a" : "#f1f5f9", borderRadius: 12, padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontWeight: 700, fontSize: 22 }}>Analytics Dashboard</h3>
          <ul style={{ margin: "16px 0 0 18px", color: darkMode ? "#a3e635" : "#333333", fontSize: 16 }}>
            {analytics.map((a, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                <div><b>Event:</b> {a.event}</div>
                <div><b>Timestamp:</b> {a.timestamp}</div>
              </li>
            ))}
          </ul>
          <button onClick={() => setShowAnalytics(false)} style={{ marginTop: 18, background: "#0a0a0a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Close Analytics</button>
        </div>
      )}
      {complianceInfo && (
        <div style={{ background: darkMode ? "#0a0a0a" : "#f1f5f9", borderRadius: 12, padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontWeight: 700, fontSize: 22 }}>Compliance Information</h3>
          <pre style={{ fontSize: 15 }}>{JSON.stringify(complianceInfo, null, 2)}</pre>
          <button onClick={() => setComplianceInfo(null)} style={{ marginTop: 18, background: "#0a0a0a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Close</button>
        </div>
      )}
      {rbacStatus && (
        <div style={{ background: darkMode ? "#0a0a0a" : "#f1f5f9", borderRadius: 12, padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontWeight: 700, fontSize: 22 }}>RBAC Status</h3>
          <div style={{ fontSize: 15 }}>{rbacStatus}</div>
          <button onClick={() => setRbacStatus(null)} style={{ marginTop: 18, background: "#0a0a0a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Close</button>
        </div>
      )}
      {pluginStatus && (
        <div style={{ background: darkMode ? "#0a0a0a" : "#f1f5f9", borderRadius: 12, padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontWeight: 700, fontSize: 22 }}>Plugin Status</h3>
          <div style={{ fontSize: 15 }}>{pluginStatus}</div>
          <button onClick={() => setPluginStatus(null)} style={{ marginTop: 18, background: "#0a0a0a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Close</button>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ flex: 1, marginRight: 12 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            type="text"
            style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 18, background: darkMode ? "#0a0a0a" : "#fff", color: darkMode ? "#a3e635" : "#0a0a0a" }}
            placeholder="Describe your customer data query..."
            aria-label="Customer data query input"
          />
        </div>
        <button onClick={handleQuery} disabled={loading || !query} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer", marginBottom: 18 }}>{loading ? "Querying..." : "Query Data"}</button>
      </div>
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      {result && (
        <div style={{ background: darkMode ? "#0a0a0a" : "#f1f5f9", borderRadius: 10, padding: 16, marginBottom: 12, color: darkMode ? "#a3e635" : "#0a0a0a" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Query Result:</div>
          <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 14, lineHeight: 1.7 }}>{typeof result === 'string' ? result : JSON.stringify(result, null, 2)}</div>
        </div>
      )}
      {history.length > 0 && (
        <div style={{ marginTop: 24, background: darkMode ? "#333333" : "#f3f4f6", borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Query History</div>
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
      <div style={{ marginTop: 32, fontSize: 13, color: darkMode ? "#a3e635" : "#64748b", textAlign: "center" }}>
        <span>Best-in-class SaaS features. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: darkMode ? "#a3e635" : "#0ea5e9", textDecoration: "underline" }}>Contact Support</a></span>
      </div>
    </div>
  );
}


