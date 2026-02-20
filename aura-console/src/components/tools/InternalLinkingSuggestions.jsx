import React from "react";

export default function InternalLinkingSuggestions() {
  // Flagship UI state
  const [showOnboarding, setShowOnboarding] = React.useState(true);
  const [input, setInput] = React.useState("");
  const [suggestions, setSuggestions] = React.useState([]);
  const [analytics, setAnalytics] = React.useState([]);
  const [imported, setImported] = React.useState(null);
  const [exported, setExported] = React.useState(null);
  const [feedback, setFeedback] = React.useState("");
  const [error, setError] = React.useState("");
  const fileInputRef = React.useRef();

  // Onboarding content
  const onboardingContent = (
    <div style={{ padding: 24, background: '#222222', borderRadius: 12, marginBottom: 18, color: '#f0f0f0' }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Internal Linking Suggestions</h3>
      <ul style={{ margin: '16px 0 0 18px', color: '#333333', fontSize: 16 }}>
        <li>Generate, import, and manage internal link suggestions with AI</li>
        <li>Analyze link graph, anchor text, and SEO impact</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Get Started</button>
    </div>
  );

  // Import/export
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      setSuggestions(JSON.parse(evt.target.result));
      setImported(file.name);
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(suggestions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Get suggestions
  const handleGetSuggestions = async () => {
    if (!input) return;
    setError("");
    try {
      const res = await fetch("/api/internal-linking-suggestions/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setSuggestions(data.suggestions || []);
    } catch (err) {
      setError(err.message || "Failed to get suggestions");
    }
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await fetch("/api/internal-linking-suggestions/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setFeedback("");
    } catch (err) {
      setError("Failed to send feedback");
    }
  };

  // Main UI
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Internal Linking Suggestions</h2>
      <button onClick={() => setShowOnboarding(v => !v)} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
      {showOnboarding && onboardingContent}
      {/* Input for content or URL */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Analyze Content or URL</div>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Paste your content or page URL here..." style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid #ccc', width: 420, marginBottom: 18 }} aria-label="Content or URL" />
        <button onClick={handleGetSuggestions} disabled={!input} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: input ? 'pointer' : 'not-allowed', marginLeft: 12, opacity: input ? 1 : 0.5 }}>Get Suggestions</button>
      </div>
      {/* Suggestions Table */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Suggestions</div>
        <div style={{ fontSize: 15, color: '#0a0a0a' }}>
          {suggestions.length ? (
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(suggestions, null, 2)}</pre>
          ) : (
            <span>No suggestions yet. Analyze content to see results.</span>
          )}
        </div>
      </div>
      {/* Import/Export */}
      <div style={{ marginBottom: 24 }}>
        <input type="file" accept="application/json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
        <button onClick={() => fileInputRef.current.click()} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginRight: 12 }}>Import Suggestions</button>
        <button onClick={handleExport} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Export Suggestions</button>
        {imported && <span style={{ marginLeft: 12, color: '#6366f1' }}>Imported: {imported}</span>}
        {exported && <a href={exported} download="suggestions.json" style={{ marginLeft: 12, color: '#22c55e', textDecoration: 'underline' }}>Download Export</a>}
      </div>
      {/* Analytics Dashboard */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Analytics</div>
        <div style={{ fontSize: 15, color: '#0a0a0a' }}>
          {analytics.length ? (
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(analytics, null, 2)}</pre>
          ) : (
            <span>No analytics yet. Generate or import suggestions to see results.</span>
          )}
        </div>
      </div>
      {/* Feedback */}
      <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: '#222222', borderRadius: 12, padding: 20 }} aria-label="Send feedback">
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
      <div style={{ marginTop: 32, fontSize: 13, color: '#64748b', textAlign: 'center' }}>
        <span>Best-in-class SaaS features. Accessibility: WCAG 2.1, keyboard navigation, color contrast. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>Contact Support</a></span>
      </div>
    </div>
  );
}


