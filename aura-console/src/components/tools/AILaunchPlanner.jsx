import React, { useState, useRef } from "react";

export default function AILaunchPlanner() {
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
      const res = await fetch("/api/ai-launch-planner/generate", {
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
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Feedback handler
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await fetch("/api/ai-launch-planner/feedback", {
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
    <div style={{ padding: 24, background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)', marginBottom: 18, color: 'var(--text)' }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to AI Launch Planner</h3>
      <ul style={{ margin: '16px 0 0 18px', color: 'var(--muted)', fontSize: 16 }}>
        <li>Enter your launch details or questions to get AI-powered launch plans</li>
        <li>Review analytics, export results, and view history</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: 'var(--accent)', color: '#23263a', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Get Started</button>
    </div>
  );

  // Main UI
  return (
    <div style={{ maxWidth: 800, margin: "40px auto", background: "var(--card)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-soft)", border: "1px solid var(--border)", padding: 32 }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 12, color: "var(--text)" }}>AI Launch Planner</h2>
      <button onClick={() => setShowOnboarding(v => !v)} style={{ background: 'var(--accent)', color: '#23263a', border: 'none', borderRadius: 'var(--radius-md)', padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
      {showOnboarding && onboardingContent}
      <p style={{ color: "var(--muted)", marginBottom: 18 }}>
        Enter your launch details or questions below. The AI will generate a launch plan or checklist.
      </p>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={5}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 'var(--radius-md)', border: "1px solid var(--border)", marginBottom: 18, background: 'var(--bg-alt)', color: 'var(--text)' }}
        placeholder="Describe your launch or ask a question..."
        aria-label="AILaunchPlanner input"
      />
      <button
        onClick={handleRun}
        disabled={loading || !input}
        style={{ background: "var(--accent)", color: "#23263a", border: "none", borderRadius: 'var(--radius-md)', padding: "12px 32px", fontWeight: 700, fontSize: 17, cursor: "pointer", boxShadow: "var(--shadow-soft)" }}
      >
        {loading ? "Running..." : "Run Tool"}
      </button>
      {error && <div style={{ color: "var(--error)", marginTop: 18 }}>{error}</div>}
      {response && (
        <div style={{ marginTop: 32, background: "var(--bg-alt)", borderRadius: 'var(--radius-md)', padding: 24, color: 'var(--text)' }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>AI Response:</div>
          <div style={{ fontSize: 16 }}>{response}</div>
        </div>
      )}

      {/* Import/Export */}
      <div style={{ marginTop: 24, marginBottom: 24 }}>
        <input type="file" accept="application/json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
        <button onClick={() => fileInputRef.current.click()} style={{ background: 'var(--accent)', color: '#23263a', border: 'none', borderRadius: 'var(--radius-md)', padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginRight: 12 }}>Import History</button>
        <button onClick={handleExport} style={{ background: 'var(--accent)', color: '#23263a', border: 'none', borderRadius: 'var(--radius-md)', padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Export History</button>
        {imported && <span style={{ marginLeft: 12, color: 'var(--accent)' }}>Imported: {imported}</span>}
        {exported && <a href={exported} download="ai-launch-planner-history.json" style={{ marginLeft: 12, color: 'var(--accent)', textDecoration: 'underline' }}>Download Export</a>}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginTop: 24, background: "var(--bg-alt)", borderRadius: 'var(--radius-md)', padding: 18 }}>
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

      {/* Feedback */}
      <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)', padding: 20 }} aria-label="Send feedback">
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={3}
          style={{ width: '100%', fontSize: 16, padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 12, background: 'var(--card)', color: 'var(--text)' }}
          placeholder="Share your feedback or suggestions..."
          aria-label="Feedback"
        />
        <button type="submit" style={{ background: 'var(--accent)', color: '#23263a', border: 'none', borderRadius: 'var(--radius-md)', padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Send Feedback</button>
        {error && <div style={{ color: 'var(--error)', marginTop: 8 }}>{error}</div>}
      </form>

      {/* Accessibility & Compliance */}
      <div style={{ marginTop: 32, fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
        <span>Best-in-class SaaS features. Accessibility: WCAG 2.1, keyboard navigation, color contrast. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Contact Support</a></span>
      </div>
    </div>
  );
}
