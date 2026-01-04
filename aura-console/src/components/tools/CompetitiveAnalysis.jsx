import React, { useState } from "react";

export default function CompetitiveAnalysis() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/competitive-analysis/analyze", {
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
    <div style={{ padding: 24, background: darkMode ? "#23263a" : "#f1f5f9", borderRadius: 12, marginBottom: 18 }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Competitive Analysis</h3>
      <ul style={{ margin: "16px 0 0 18px", color: darkMode ? "#a3e635" : "#334155", fontSize: 16 }}>
        <li>Domain vs. domain, keyword gap, backlink gap, content gap</li>
        <li>Export, share, and review analysis history</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Get Started</button>
    </div>
  );

  // Flagship enhancements
  const [competitors, setCompetitors] = useState([]);
  const [features, setFeatures] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [feedback, setFeedback] = useState("");
  const fileInputRef = React.useRef();

  // Fetch competitors
  const fetchCompetitors = async () => {
    try {
      const res = await fetch("/api/competitive-analysis/competitors");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setCompetitors(data.competitors || []);
    } catch (err) {
      setError(err.message);
    }
  };
  // Fetch features
  const fetchFeatures = async () => {
    try {
      const res = await fetch("/api/competitive-analysis/features");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setFeatures(data.features || []);
    } catch (err) {
      setError(err.message);
    }
  };
  // Fetch comparison
  const fetchComparison = async () => {
    try {
      const res = await fetch("/api/competitive-analysis/comparison");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setComparison(data.comparison || []);
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
      setCompetitors(JSON.parse(evt.target.result));
      setImported(file.name);
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ competitors, features, comparison }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await fetch("/api/competitive-analysis/feedback", {
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
    <div style={{
      maxWidth: 900,
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
        <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0 }}>Competitive Analysis</h2>
        <button onClick={() => setDarkMode(d => !d)} aria-label="Toggle dark mode" style={{ background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>{darkMode ? "Light" : "Dark"} Mode</button>
      </div>
      {showOnboarding && onboardingContent}
      <div style={{ marginBottom: 18 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc", marginBottom: 12 }}
          placeholder="Enter competitor domains, keywords, or features..."
          aria-label="Competitor input"
        />
        <button onClick={handleAnalyze} disabled={loading} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Analyze</button>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={fetchCompetitors} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Load Competitors</button>
        <button onClick={fetchFeatures} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginLeft: 12 }}>Load Features</button>
        <button onClick={fetchComparison} style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginLeft: 12 }}>Compare</button>
      </div>
      <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Competitors</div>
          <ul style={{ paddingLeft: 18 }}>
            {competitors.map((c, idx) => (
              <li key={c.id || idx} style={{ marginBottom: 8, background: "#f1f5f9", borderRadius: 8, padding: 8 }}>{c.name}</li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Features</div>
          <ul style={{ paddingLeft: 18 }}>
            {features.map((f, idx) => (
              <li key={f.id || idx} style={{ marginBottom: 8, background: "#e0f2fe", borderRadius: 8, padding: 8 }}>{f.name}</li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Comparison</div>
          <ul style={{ paddingLeft: 18 }}>
            {comparison.map((cmp, idx) => (
              <li key={cmp.id || idx} style={{ marginBottom: 8, background: "#f1f5f9", borderRadius: 8, padding: 8 }}>{cmp.result}</li>
            ))}
          </ul>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import competitors" />
        <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
        {exported && <a href={exported} download="competitive-analysis.json" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
      </div>
      {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: "#f8fafc", borderRadius: 12, padding: 20 }} aria-label="Send feedback">
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={2}
          style={{ width: "100%", fontSize: 15, padding: 10, borderRadius: 8, border: "1px solid #ccc", marginBottom: 12, background: "#fff", color: "#23263a" }}
          placeholder="Share your feedback or suggestions..."
          aria-label="Feedback input"
        />
        <button type="submit" style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Send Feedback</button>
      </form>
      {/* ...existing code... */}
      {result && (
        <div style={{ marginTop: 24, background: darkMode ? "#23263a" : "#f1f5f9", borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 20 }}>Analysis Result</h3>
          <pre style={{ fontSize: 15, color: darkMode ? "#a3e635" : "#23263a" }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      {history.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 18 }}>History</h3>
          <ul style={{ paddingLeft: 18 }}>
            {history.map((h, idx) => (
              <li key={idx} style={{ marginBottom: 8, background: darkMode ? "#23263a" : "#f1f5f9", borderRadius: 8, padding: 8 }}>
                <b>Query:</b> {h.query} <br />
                <b>Result:</b> {JSON.stringify(h.result)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
      <div style={{ marginBottom: 10, color: darkMode ? "#a3e635" : "#0ea5e9", fontWeight: 600 }}>
        <span role="img" aria-label="competitive">⚔️</span> Analyze domains, keywords, backlinks, and content gaps.
      </div>
      <button onClick={() => setShowOnboarding(true)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
      {showOnboarding && onboardingContent}
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        type="text"
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 18, background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
        placeholder="Enter domains, keywords, or content to compare..."
        aria-label="Competitive analysis input"
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
