import React from "react";

export default function ABTestingSuite() {
  // Flagship UI state
  const [showOnboarding, setShowOnboarding] = React.useState(true);
  const [testName, setTestName] = React.useState("");
  const [variants, setVariants] = React.useState([{ name: "A", content: "" }, { name: "B", content: "" }]);
  const [results, setResults] = React.useState([]);
  const [analytics, setAnalytics] = React.useState([]);
  const [imported, setImported] = React.useState(null);
  const [exported, setExported] = React.useState(null);
  const [feedback, setFeedback] = React.useState("");
  const [error, setError] = React.useState("");
  const fileInputRef = React.useRef();

  // Onboarding content
  const onboardingContent = (
    <div style={{ padding: 24, background: 'var(--background-secondary)', borderRadius: 12, marginBottom: 18 }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to A/B Testing Suite</h3>
      <ul style={{ margin: '16px 0 0 18px', color: '#334155', fontSize: 16 }}>
        <li>Create, import, and manage A/B tests with AI</li>
        <li>Edit variants, analyze results, and optimize</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Get Started</button>
    </div>
  );

  // Import/export
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const data = JSON.parse(evt.target.result);
      setTestName(data.testName || "");
      setVariants(data.variants || [{ name: "A", content: "" }, { name: "B", content: "" }]);
      setImported(file.name);
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ testName, variants }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await fetch("/api/ab-testing-suite/feedback", {
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
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>A/B Testing Suite</h2>
      <button onClick={() => setShowOnboarding(v => !v)} style={{ background: 'var(--button-secondary-bg)', color: 'var(--button-secondary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
      {showOnboarding && onboardingContent}
      {/* Test Creation */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Test Creation</div>
        <input value={testName} onChange={e => setTestName(e.target.value)} placeholder="Test name" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: 220, marginRight: 12 }} aria-label="Test name" />
        <div style={{ display: 'flex', gap: 18, marginBottom: 18 }}>
          {variants.map((v, i) => (
            <div key={i} style={{ flex: 1 }}>
              <input value={v.name} onChange={e => setVariants(variants.map((vv, idx) => idx === i ? { ...vv, name: e.target.value } : vv))} placeholder={`Variant ${String.fromCharCode(65 + i)}`} style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: 120, marginBottom: 8 }} aria-label={`Variant ${String.fromCharCode(65 + i)}`} />
              <textarea value={v.content} onChange={e => setVariants(variants.map((vv, idx) => idx === i ? { ...vv, content: e.target.value } : vv))} rows={2} style={{ width: '100%', fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', marginBottom: 8 }} placeholder="Variant content" aria-label="Variant content" />
            </div>
          ))}
          <button onClick={() => setVariants([...variants, { name: `Variant ${String.fromCharCode(65 + variants.length)}`, content: "" }])} style={{ background: 'var(--button-tertiary-bg)', color: 'var(--button-tertiary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', height: 40 }}>Add Variant</button>
        </div>
      </div>
      {/* Import/Export */}
      <div style={{ marginBottom: 24 }}>
        <input type="file" accept="application/json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
        <button onClick={() => fileInputRef.current.click()} style={{ background: 'var(--button-tertiary-bg)', color: 'var(--button-tertiary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginRight: 12 }}>Import Test</button>
        <button onClick={handleExport} style={{ background: 'var(--button-success-bg)', color: 'var(--button-success-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Export Test</button>
        {imported && <span style={{ marginLeft: 12, color: '#6366f1' }}>Imported: {imported}</span>}
        {exported && <a href={exported} download="abtest.json" style={{ marginLeft: 12, color: '#22c55e', textDecoration: 'underline' }}>Download Export</a>}
      </div>
      {/* Analytics Dashboard */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Analytics</div>
        <div style={{ fontSize: 15, color: 'var(--text-primary)' }}>
          {analytics.length ? (
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(analytics, null, 2)}</pre>
          ) : (
            <span>No analytics yet. Run a test to see results.</span>
          )}
        </div>
      </div>
      {/* Feedback */}
      <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: 'var(--background-secondary)', borderRadius: 12, padding: 20 }} aria-label="Send feedback">
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={3}
          style={{ width: '100%', fontSize: 16, padding: 12, borderRadius: 8, border: '1px solid var(--border-color)', marginBottom: 12 }}
          placeholder="Share your feedback or suggestions..."
          aria-label="Feedback"
        />
        <button type="submit" style={{ background: 'var(--button-secondary-bg)', color: 'var(--button-secondary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Send Feedback</button>
        {error && <div style={{ color: '#ef4444', marginTop: 8 }}>{error}</div>}
      </form>
      {/* Accessibility & Compliance */}
      <div style={{ marginTop: 32, fontSize: 13, color: '#64748b', textAlign: 'center' }}>
        <span>Best-in-class SaaS features. Accessibility: WCAG 2.1, keyboard navigation, color contrast. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>Contact Support</a></span>
      </div>
    </div>
  );
}
