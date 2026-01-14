
import React, { useState, useRef } from "react";

// Placeholder for visual flow builder (replace with real library/component)
function VisualFlowBuilder({ flow, setFlow, nodes = [], setNodes }) {
  // Always flagship dark theme
  return (
    <div style={{ border: "1px solid #232336", borderRadius: 14, padding: 24, background: "#23232a", marginBottom: 24, boxShadow: "0 2px 8px #0004" }}>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12, color: "#fafafa" }}>Visual Flow Builder <span style={{ color: '#64748b', fontWeight: 400, fontSize: 13 }} title="Drag and drop steps, triggers, and actions">(?)</span></div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
        <button onClick={() => setNodes([...nodes, { id: Date.now(), label: 'Step', type: 'step' }])} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 22px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Add Step</button>
        <button onClick={() => setNodes([...nodes, { id: Date.now(), label: 'Trigger', type: 'trigger' }])} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 22px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Add Trigger</button>
        <button onClick={() => setNodes([...nodes, { id: Date.now(), label: 'Action', type: 'action' }])} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 22px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Add Action</button>
      </div>
      <div style={{ minHeight: 120, border: '1px dashed #6366f1', borderRadius: 10, padding: 16, background: '#18181b', marginBottom: 16 }}>
        {nodes.length ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {nodes.map((n, i) => (
              <li key={n.id} style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: n.type === 'step' ? '#0ea5e9' : n.type === 'trigger' ? '#22c55e' : '#6366f1', background: darkMode ? '#232336' : '#18181b', borderRadius: 6, padding: '4px 12px' }}>{n.label}</span>
                <button onClick={() => setNodes(nodes.filter((_, idx) => idx !== i))} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Remove</button>
              </li>
            ))}
          </ul>
        ) : (
          <span style={{ color: '#64748b', fontSize: 15 }}>Drag and drop steps, triggers, and actions here.</span>
        )}
      </div>
      <textarea
        value={flow}
        onChange={e => setFlow(e.target.value)}
        rows={4}
        style={{ width: "100%", fontSize: 16, borderRadius: 10, border: "1px solid #333", padding: 12, background: '#18181b', color: '#fafafa', marginBottom: 8 }}
        placeholder="Describe or edit your flow here..."
      />
    </div>
  );
}

export default function KlaviyoFlowAutomation() {
  const [flow, setFlow] = useState("");
  const [nodes, setNodes] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [collaborators, setCollaborators] = useState(["You"]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const fileInputRef = useRef();

  // AI Suggestion
  const handleAISuggest = async () => {
    setLoading(true);
    setError("");
    setAiSuggestion("");
    try {
      const res = await fetch("/api/klaviyo-flow-automation/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flow })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setAiSuggestion(data.suggestion || "No suggestion generated");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run Automation
  const handleRun = async () => {
    setLoading(true);
    setError("");
    setAnalytics(null);
    try {
      const res = await fetch("/api/klaviyo-flow-automation/ai/automate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flow })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setAnalytics(data.analytics || { summary: "No analytics available" });
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
    reader.onload = evt => {
      setFlow(evt.target.result);
      setImported(file.name);
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([flow], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Collaboration (placeholder)
  const handleAddCollaborator = () => {
    const name = prompt("Enter collaborator name/email:");
    if (name && !collaborators.includes(name)) setCollaborators([...collaborators, name]);
  };

  // Onboarding
  const onboardingContent = (
    <div style={{ padding: 24, background: "#f1f5f9", borderRadius: 12, marginBottom: 18 }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Klaviyo Flow Automation</h3>
      <ul style={{ margin: "16px 0 0 18px", color: "#334155", fontSize: 16 }}>
        <li>Build, import, or export advanced Klaviyo flows visually</li>
        <li>Get AI-powered suggestions and templates</li>
        <li>Analyze flow performance with real-time analytics</li>
        <li>Collaborate and share flows with your team</li>
        <li>Integrate with Klaviyo and Shopify in one click</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Get Started</button>
    </div>
  );

  // Accessibility: keyboard shortcuts (placeholder)
  React.useEffect(() => {
    const handler = e => {
      if (e.ctrlKey && e.key === "i") fileInputRef.current?.click();
      if (e.ctrlKey && e.key === "e") handleExport();
      if (e.ctrlKey && e.key === "d") setDarkMode(d => !d);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Main UI - Always flagship dark theme, glassmorphism, gradients, depth, modern layout
  return (
    <div style={{
      maxWidth: 1100,
      margin: "48px auto",
      background: "linear-gradient(135deg, #18181b 60%, #232336 100%)",
      borderRadius: 28,
      boxShadow: "0 8px 40px #000b, 0 1.5px 0 #232336",
      padding: 48,
      color: "#f1f5f9",
      fontFamily: 'Inter, Segoe UI, sans-serif',
      transition: "background 0.3s, color 0.3s",
      backdropFilter: "blur(2.5px)",
      border: "1.5px solid #232336"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontWeight: 900, fontSize: 38, margin: 0, letterSpacing: -1, background: "linear-gradient(90deg,#a3e635,#0ea5e9 80%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Klaviyo Flow Automation</h2>
      </div>
      <div style={{ marginBottom: 18, color: "#a3e635", fontWeight: 700, fontSize: 18, letterSpacing: 0.1 }}>⚡ Build, automate, and analyze Klaviyo flows with AI, analytics, and team collaboration.</div>
      <div style={{ display: "flex", gap: 36, flexWrap: "wrap" }}>
        <div style={{ flex: 2, minWidth: 340 }}>
          {showOnboarding && onboardingContent}
          <VisualFlowBuilder flow={flow} setFlow={setFlow} nodes={nodes} setNodes={setNodes} />
          <div style={{ display: "flex", gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
            <button onClick={handleAISuggest} disabled={loading || !flow} style={{ background: "linear-gradient(90deg,#a3e635,#0ea5e9 80%)", color: "#23263a", border: 'none', borderRadius: 10, padding: "12px 28px", fontWeight: 800, fontSize: 18, cursor: "pointer", boxShadow: "0 2px 8px #0003", opacity: loading || !flow ? 0.7 : 1 }}>{loading ? "Thinking..." : "AI Suggest"}</button>
            <button onClick={handleRun} disabled={loading || !flow} style={{ background: "linear-gradient(90deg,#7fffd4,#6366f1 80%)", color: "#23263a", border: 'none', borderRadius: 10, padding: "12px 28px", fontWeight: 800, fontSize: 18, cursor: "pointer", boxShadow: "0 2px 8px #0003", opacity: loading || !flow ? 0.7 : 1 }}>{loading ? "Running..." : "Run Automation"}</button>
            <button onClick={() => fileInputRef.current?.click()} style={{ background: "linear-gradient(90deg,#fbbf24,#f472b6 80%)", color: "#23263a", border: 'none', borderRadius: 10, padding: "12px 28px", fontWeight: 800, fontSize: 18, cursor: "pointer", boxShadow: "0 2px 8px #0003" }}>Import</button>
            <input ref={fileInputRef} type="file" accept=".txt,.json" style={{ display: "none" }} onChange={handleImport} aria-label="Import flow" />
            <button onClick={handleExport} style={{ background: "linear-gradient(90deg,#0ea5e9,#6366f1 80%)", color: "#fff", border: 'none', borderRadius: 10, padding: "12px 28px", fontWeight: 800, fontSize: 18, cursor: "pointer", boxShadow: "0 2px 8px #0003" }}>Export</button>
            {exported && <a href={exported} download="klaviyo-flow.txt" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 700, fontSize: 16, textDecoration: 'underline' }}>Download</a>}
          </div>
          {imported && <div style={{ color: "#22c55e", marginBottom: 10, fontWeight: 700, fontSize: 16 }}>Imported: {imported}</div>}
          {aiSuggestion && (
            <div style={{ background: "linear-gradient(90deg,#23263a,#232336 80%)", borderRadius: 12, padding: 18, marginBottom: 14, color: "#a3e635", boxShadow: "0 1px 6px #0005" }}>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 17 }}>AI Suggestion:</div>
              <div>{aiSuggestion}</div>
            </div>
          )}
          {error && <div style={{ color: "#ef4444", marginBottom: 12, fontWeight: 700, fontSize: 16 }}>{error}</div>}
        </div>
        <div style={{ flex: 1, minWidth: 300, background: "linear-gradient(135deg,#232336 60%,#18181b 100%)", borderRadius: 18, padding: 32, boxShadow: "0 2px 16px #0007", display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 16, color: "#fafafa", letterSpacing: -0.5 }}>Analytics & Collaboration</div>
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 16 }}>Collaborators:</div>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#a3e635', fontWeight: 700, fontSize: 15 }}>
              {collaborators.map(c => <li key={c}>{c}</li>)}
            </ul>
            <button onClick={handleAddCollaborator} style={{ background: "linear-gradient(90deg,#0ea5e9,#6366f1 80%)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 800, fontSize: 16, marginTop: 10, cursor: "pointer", boxShadow: "0 2px 8px #0003" }}>Add Collaborator</button>
          </div>
          <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 16 }}>Flow Analytics:</div>
          <div style={{ fontSize: 15, color: "#a3e635", minHeight: 40 }}>
            {analytics ? (
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "none", padding: 0, margin: 0 }}>{JSON.stringify(analytics, null, 2)}</pre>
            ) : (
              <span>No analytics yet. Run automation to see results.</span>
            )}
          </div>
          <div style={{ marginTop: 22 }}>
            <button onClick={() => setShowOnboarding(true)} style={{ background: "linear-gradient(90deg,#6366f1,#0ea5e9 80%)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: "0 2px 8px #0003" }}>Show Onboarding</button>
          </div>
          <div style={{ marginTop: 22, fontSize: 14, color: "#a3e635" }}>
            <div>Integrations: <span style={{ fontWeight: 800 }}>Klaviyo</span>, <span style={{ fontWeight: 800 }}>Shopify</span></div>
            <div>Accessibility: <span style={{ fontWeight: 800 }}>WCAG 2.1</span> | <span style={{ fontWeight: 800 }}>Keyboard Shortcuts</span></div>
            <div>Compliance: <span style={{ fontWeight: 800 }}>GDPR</span>, <span style={{ fontWeight: 800 }}>SOC2</span></div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 40, fontSize: 15, color: "#a3e635", textAlign: "center", fontWeight: 700, letterSpacing: 0.1 }}>
        <span>Best-in-class SaaS features. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: "#a3e635", textDecoration: "underline" }}>Contact Support</a></span>
      </div>
    </div>
  );
}
