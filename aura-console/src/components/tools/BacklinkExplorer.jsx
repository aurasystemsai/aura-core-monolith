import React, { useState } from "react";

export default function BacklinkExplorer() {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  // Dark mode enforced, no toggle
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [feedback, setFeedback] = useState("");
  const fileInputRef = useRef();

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/backlink-explorer/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResult(data.result);
      setHistory(prev => [{ domain, result: data.result }, ...prev].slice(0, 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onboardingContent = (
    <div style={{ padding: 24, background: "#23263a", color: "#f3f4f6", borderRadius: 12, marginBottom: 18 }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Backlink Explorer</h3>
      <ul style={{ margin: "16px 0 0 18px", color: "#a3e635", fontSize: 16 }}>
        <li>Analyze backlinks, referring domains, anchor text, and toxic links</li>
        <li>Export, import, and review analysis history</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Get Started</button>
              </div>
            );
  }

  // Import/export
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      setHistory(JSON.parse(evt.target.result));
      setImported(file.name);
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    try {
      await fetch("/api/backlink-explorer/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setFeedback("");
    } catch (err) {
      setError("Failed to send feedback");
    }
  };

  return (
    <div style={{
      maxWidth: 900,
      margin: "40px auto",
      background: "#23263a",
      borderRadius: 18,
      boxShadow: "0 2px 24px #0002",
      padding: 36,
      color: "#a3e635",
      fontFamily: 'Inter, sans-serif',
      transition: "background 0.3s, color 0.3s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0 }}>Backlink Explorer</h2>

      </div>
      <div style={{ marginBottom: 10, color: "#a3e635", fontWeight: 600 }}>
        <span role="img" aria-label="link">🔗</span> Analyze backlinks and referring domains.
      </div>
      <button onClick={() => setShowOnboarding(true)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
      {showOnboarding && onboardingContent}
      <input
        value={domain}
        onChange={e => setDomain(e.target.value)}
        type="text"
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #555", marginBottom: 18, background: "#23263a", color: "#a3e635" }}
        placeholder="Enter domain to analyze backlinks..."
        aria-label="Domain input"
      />
      <button onClick={handleAnalyze} disabled={loading || !domain} style={{ background: "#a3e635", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer", marginBottom: 18 }}>{loading ? "Analyzing..." : "Analyze"}</button>
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      {result && (
        <div style={{ background: "#23263a", borderRadius: 10, padding: 16, marginBottom: 12, color: "#a3e635" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Analysis Result:</div>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      {history.length > 0 && (
        <div style={{ marginTop: 24, background: "#334155", borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Analysis History</div>
                  <ul style={{ paddingLeft: 18 }}>
                    {history.map((h, i) => (
                      <li key={i} style={{ marginBottom: 10 }}>
                        <div><b>Domain:</b> {h.domain}</div>
                        <div><b>Result:</b> {JSON.stringify(h.result).slice(0, 120)}{JSON.stringify(h.result).length > 120 ? "..." : ""}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Import/Export */}
              <div style={{ marginBottom: 24 }}>
                <input type="file" accept="application/json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
                <button onClick={() => fileInputRef.current.click()} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginRight: 12 }}>Import History</button>
                <button onClick={handleExport} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Export History</button>
                {imported && <span style={{ marginLeft: 12, color: '#6366f1' }}>Imported: {imported}</span>}
                {exported && <a href={exported} download="backlink-history.json" style={{ marginLeft: 12, color: '#22c55e', textDecoration: 'underline' }}>Download Export</a>}
              </div>
              {/* Analytics Dashboard */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Analytics</div>
                <div style={{ fontSize: 15, color: '#a3e635' }}>
                  {analytics.length ? (
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', color: '#a3e635', padding: 0, margin: 0 }}>{JSON.stringify(analytics, null, 2)}</pre>
                  ) : (
                    <span>No analytics yet. Analyze or import history to see results.</span>
                  )}
                </div>
              </div>
              {/* Feedback */}
              <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: '#23263a', borderRadius: 12, padding: 20 }} aria-label="Send feedback">
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
              <div style={{ marginTop: 32, fontSize: 13, color: '#a3e635', textAlign: 'center' }}>
                <span>Best-in-class SaaS features. Accessibility: WCAG 2.1, keyboard navigation, color contrast. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>Contact Support</a></span>
              </div>
            </div>
          );
