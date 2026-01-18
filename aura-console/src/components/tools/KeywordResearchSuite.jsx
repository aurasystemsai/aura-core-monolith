import React, { useState } from "react";
import { FiDownload, FiUpload, FiBarChart2, FiBell, FiSettings, FiHelpCircle } from "react-icons/fi";

function FeedbackModal({ open, onClose, onSubmit }) {
  const [feedback, setFeedback] = useState("");
  if (!open) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "#0008", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 32, minWidth: 340 }}>
        <h3 style={{ marginBottom: 12 }}>Send Feedback</h3>
        <textarea value={feedback} onChange={e => setFeedback(e.target.value)} style={{ width: "100%", minHeight: 80, borderRadius: 8, border: "1px solid #ccc", marginBottom: 18 }} placeholder="Your feedback..." />
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => onSubmit(feedback)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, cursor: "pointer" }}>Submit</button>
          <button onClick={onClose} style={{ background: "#e5e7eb", color: "#23263a", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function KeywordResearchSuite() {
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

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/keyword-research-suite/analyze", {
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

  // Flagship: fetch analytics
  const fetchAnalytics = async () => {
    setShowAnalytics(true);
    try {
      const res = await fetch("/api/keyword-research-suite/analytics");
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
    await fetch("/api/keyword-research-suite/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: text
    });
    setImporting(false);
    setNotification("Import complete");
  };
  const handleExport = async () => {
    setExporting(true);
    const res = await fetch("/api/keyword-research-suite/export");
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "keywords.json";
    a.click();
    setExporting(false);
    setNotification("Export complete");
  };

  // Flagship: feedback
  const handleFeedbackSubmit = async feedback => {
    await fetch("/api/keyword-research-suite/notify", {
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
    const res = await fetch("/api/keyword-research-suite/compliance");
    const data = await res.json();
    setComplianceInfo(data.compliance);
  };

  // Flagship: RBAC check
  const checkRBAC = async () => {
    const res = await fetch("/api/keyword-research-suite/rbac/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: "me", action: "view" })
    });
    const data = await res.json();
    setRbacStatus(data.allowed ? "Access granted" : "Access denied");
  };

  // Flagship: plugin system
  const runPlugin = async () => {
    const res = await fetch("/api/keyword-research-suite/plugin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plugin: "sample" })
    });
    setPluginStatus("Plugin executed");
  };

  const onboardingContent = (
    <div style={{ padding: 24, background: darkMode ? "#23263a" : "#f1f5f9", borderRadius: 12, marginBottom: 18 }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Keyword Research Suite</h3>
      <ul style={{ margin: "16px 0 0 18px", color: darkMode ? "#a3e635" : "#334155", fontSize: 16 }}>
        <li>Keyword volume, difficulty, trends, and gap analysis</li>
        <li>Competitor keyword research and suggestions</li>
        <li>Export, share, and review analysis history</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Get Started</button>
    </div>
  );

  return (
    <div style={{
      
      margin: "40px auto",
      background: darkMode ? "#18181b" : accessibilityMode ? "#e0f7fa" : "#fff",
      borderRadius: 18,
      boxShadow: "0 2px 24px #0002",
      padding: 36,
      color: darkMode ? "#a3e635" : accessibilityMode ? "#23263a" : "#23263a",
      fontFamily: 'Inter, sans-serif',
      transition: "background 0.3s, color 0.3s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0 }}>Keyword Research Suite</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setDarkMode(d => !d)} aria-label="Toggle dark mode" style={{ background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>{darkMode ? "Light" : "Dark"} Mode</button>
          <button onClick={toggleAccessibility} aria-label="Toggle accessibility mode" style={{ background: accessibilityMode ? "#a3e635" : "#e0e7ff", color: accessibilityMode ? "#23263a" : "#6366f1", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Accessibility</button>
          <button onClick={() => setShowHelp(true)} aria-label="Help" style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}><FiHelpCircle /></button>
        </div>
      </div>
      <div style={{ marginBottom: 10, color: darkMode ? "#a3e635" : "#0ea5e9", fontWeight: 600 }}>
        <span role="img" aria-label="keyword">🔑</span> Research keywords, gaps, and competitors.
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button onClick={() => setShowOnboarding(true)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
        <button onClick={fetchAnalytics} style={{ background: "#eab308", color: "#23263a", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}><FiBarChart2 /> Analytics</button>
        <label style={{ background: "#a3e635", color: "#23263a", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
          <FiUpload /> Import
          <input type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} disabled={importing} />
        </label>
        <button onClick={handleExport} style={{ background: "#a3e635", color: "#23263a", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }} disabled={exporting}><FiDownload /> Export</button>
        <button onClick={() => setShowFeedback(true)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}><FiBell /> Feedback</button>
        <button onClick={checkRBAC} style={{ background: "#e0e7ff", color: "#23263a", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>RBAC</button>
        <button onClick={fetchCompliance} style={{ background: "#e0e7ff", color: "#23263a", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Compliance</button>
        <button onClick={runPlugin} style={{ background: "#e0e7ff", color: "#23263a", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}><FiSettings /> Plugin</button>
      </div>
      {notification && <div style={{ color: "#22c55e", marginBottom: 10 }}>{notification}</div>}
      {showHelp && (
        <div style={{ background: darkMode ? "#23263a" : "#f1f5f9", borderRadius: 12, padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontWeight: 700, fontSize: 22 }}>Help & Documentation</h3>
          <ul style={{ margin: "16px 0 0 18px", color: darkMode ? "#a3e635" : "#334155", fontSize: 16 }}>
            <li>How to use keyword research features</li>
            <li>Best practices for keyword analysis</li>
            <li>Accessibility and compliance information</li>
            <li>Integrating plugins and webhooks</li>
            <li>Contact support for advanced help</li>
          </ul>
          <button onClick={() => setShowHelp(false)} style={{ marginTop: 18, background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Close Help</button>
        </div>
      )}
      {showFeedback && <FeedbackModal open={showFeedback} onClose={() => setShowFeedback(false)} onSubmit={handleFeedbackSubmit} />}
      {showAnalytics && (
        <div style={{ background: darkMode ? "#23263a" : "#f1f5f9", borderRadius: 12, padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontWeight: 700, fontSize: 22 }}>Analytics Dashboard</h3>
          <ul style={{ margin: "16px 0 0 18px", color: darkMode ? "#a3e635" : "#334155", fontSize: 16 }}>
            {analytics.map((a, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                <div><b>Event:</b> {a.event}</div>
                <div><b>Timestamp:</b> {a.timestamp}</div>
              </li>
            ))}
          </ul>
          <button onClick={() => setShowAnalytics(false)} style={{ marginTop: 18, background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Close Analytics</button>
        </div>
      )}
      {complianceInfo && (
        <div style={{ background: darkMode ? "#23263a" : "#f1f5f9", borderRadius: 12, padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontWeight: 700, fontSize: 22 }}>Compliance Information</h3>
          <pre style={{ fontSize: 15 }}>{JSON.stringify(complianceInfo, null, 2)}</pre>
          <button onClick={() => setComplianceInfo(null)} style={{ marginTop: 18, background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Close</button>
        </div>
      )}
      {rbacStatus && (
        <div style={{ background: darkMode ? "#23263a" : "#f1f5f9", borderRadius: 12, padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontWeight: 700, fontSize: 22 }}>RBAC Status</h3>
          <div style={{ fontSize: 15 }}>{rbacStatus}</div>
          <button onClick={() => setRbacStatus(null)} style={{ marginTop: 18, background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Close</button>
        </div>
      )}
      {pluginStatus && (
        <div style={{ background: darkMode ? "#23263a" : "#f1f5f9", borderRadius: 12, padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontWeight: 700, fontSize: 22 }}>Plugin Status</h3>
          <div style={{ fontSize: 15 }}>{pluginStatus}</div>
          <button onClick={() => setPluginStatus(null)} style={{ marginTop: 18, background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Close</button>
        </div>
      )}
      {showOnboarding && onboardingContent}
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        type="text"
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 18, background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
        placeholder="Enter keyword, topic, or competitor domain..."
        aria-label="Keyword research input"
      />
      <button onClick={handleAnalyze} disabled={loading || !query} style={{ background: "#a3e635", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer", marginBottom: 18 }}>{loading ? "Analyzing..." : "Analyze"}</button>
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      {result && (
        <div style={{ background: darkMode ? "#23263a" : "#f1f5f9", borderRadius: 10, padding: 16, marginBottom: 12, color: darkMode ? "#a3e635" : "#23263a" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Analysis Result:</div>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
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
      <div style={{ marginTop: 32, fontSize: 13, color: darkMode ? "#a3e635" : "#64748b", textAlign: "center" }}>
        <span>Best-in-class SaaS features. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: darkMode ? "#a3e635" : "#0ea5e9", textDecoration: "underline" }}>Contact Support</a></span>
      </div>
    </div>
  );
}
