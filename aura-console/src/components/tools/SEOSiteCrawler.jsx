import React, { useState, useRef, useEffect } from "react";
import { apiFetch } from "../../api";

export default function SEOSiteCrawler() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [feedback, setFeedback] = useState("");
  const fileInputRef = useRef();

  // Fetch history
  const fetchHistory = async () => {
    try {
      const res = await apiFetch("/api/seo-site-crawler/history");
      const data = await res.json();
      if (data.ok) setHistory(data.history || []);
    } catch {}
  };
  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const res = await apiFetch("/api/seo-site-crawler/analytics");
      const data = await res.json();
      if (data.ok) setAnalytics(data.analytics || []);
    } catch {}
  };

  // AI Crawl
  const handleCrawl = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    try {
      const res = await apiFetch("/api/seo-site-crawler/ai/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: input })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResponse(data.crawlReport || "No report generated");
      // Save to history
      await apiFetch("/api/seo-site-crawler/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: input, report: data.crawlReport })
      });
      fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Import/Export
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async evt => {
      try {
        const res = await apiFetch("/api/seo-site-crawler/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: JSON.parse(evt.target.result) })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Unknown error");
        setImported(file.name);
        fetchHistory();
      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await apiFetch("/api/seo-site-crawler/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setFeedback("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchAnalytics();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", background: "#fff", borderRadius: 18, boxShadow: "0 2px 24px #0002", padding: 36, fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 8 }}>SEO Site Crawler</h2>
      <div style={{ marginBottom: 10, color: "#0ea5e9", fontWeight: 600 }}>
        <span role="img" aria-label="spider">🕷️</span> Crawl, analyze, and export site SEO data with AI and analytics.
      </div>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={4}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc", marginBottom: 18 }}
        placeholder="Type your site or prompt here..."
        aria-label="Site input"
      />
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={handleCrawl} disabled={loading || !input} style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{loading ? "Crawling..." : "AI Crawl"}</button>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import history" />
        <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
        {exported && <a href={exported} download="seo-crawler-history.json" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
      </div>
      {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
      {response && (
        <div style={{ background: "#f1f5f9", borderRadius: 10, padding: 16, marginBottom: 12, color: "#23263a" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>AI Crawl Report:</div>
          <div>{response}</div>
        </div>
      )}
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      <div style={{ marginTop: 24, background: "#f3f4f6", borderRadius: 12, padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>History</div>
        <ul style={{ paddingLeft: 18 }}>
          {history.map(h => (
            <li key={h.id} style={{ marginBottom: 10 }}>
              <div><b>ID:</b> {h.id}</div>
              <div><b>Site:</b> {h.site}</div>
              <div><b>Report:</b> {h.report || JSON.stringify(h)}</div>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: 24, background: "#f3f4f6", borderRadius: 12, padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Analytics</div>
        <div style={{ fontSize: 15, color: "#23263a" }}>
          {analytics.length ? (
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "none", padding: 0, margin: 0 }}>{JSON.stringify(analytics, null, 2)}</pre>
          ) : (
            <span>No analytics yet. Generate or import history to see results.</span>
          )}
        </div>
      </div>
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
    </div>
  );
}
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Get Started</button>
    </div>
  );

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
        <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0 }}>SEO Site Crawler</h2>
        <button onClick={() => setDarkMode(d => !d)} aria-label="Toggle dark mode" style={{ background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>{darkMode ? "Light" : "Dark"} Mode</button>
      </div>
      <div style={{ marginBottom: 10, color: darkMode ? "#a3e635" : "#0ea5e9", fontWeight: 600 }}>
        <span role="img" aria-label="spider">🕷️</span> Crawl your site for technical SEO issues and export results.
      </div>
      <button onClick={() => setShowOnboarding(true)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
      {showOnboarding && onboardingContent}
      <input
        value={url}
        onChange={e => setUrl(e.target.value)}
        type="text"
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 18, background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
        placeholder="Enter site URL to crawl..."
        aria-label="Site URL input"
      />
      <button onClick={handleCrawl} disabled={loading || !url} style={{ background: "#a3e635", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer", marginBottom: 18 }}>{loading ? "Crawling..." : "Start Crawl"}</button>
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      {crawlResult && (
        <div style={{ background: darkMode ? "#23263a" : "#f1f5f9", borderRadius: 10, padding: 16, marginBottom: 12, color: darkMode ? "#a3e635" : "#23263a" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Crawl Result:</div>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{JSON.stringify(crawlResult, null, 2)}</pre>
        </div>
      )}
      {history.length > 0 && (
        <div style={{ marginTop: 24, background: darkMode ? "#334155" : "#f3f4f6", borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Crawl History</div>
          <ul style={{ paddingLeft: 18 }}>
            {history.map((h, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                <div><b>URL:</b> {h.url}</div>
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
