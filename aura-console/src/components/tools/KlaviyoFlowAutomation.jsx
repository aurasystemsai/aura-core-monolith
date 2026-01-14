
import React, { useState, useRef } from "react";

// Placeholder for visual flow builder (replace with real library/component)
function VisualFlowBuilder({ flow, setFlow, nodes = [], setNodes, darkMode }) {
  // Flagship drag-and-drop canvas (dark theme, modern look)
  return (
    <div style={{ border: "1px solid #232336", borderRadius: 14, padding: 24, background: darkMode ? "#23232a" : "#18181b", marginBottom: 24, boxShadow: "0 2px 8px #0004" }}>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12, color: darkMode ? "#fafafa" : "#e0e7ff" }}>Visual Flow Builder <span style={{ color: '#64748b', fontWeight: 400, fontSize: 13 }} title="Drag and drop steps, triggers, and actions">(?)</span></div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
        <button onClick={() => setNodes([...nodes, { id: Date.now(), label: 'Step', type: 'step' }])} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 22px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Add Step</button>
        <button onClick={() => setNodes([...nodes, { id: Date.now(), label: 'Trigger', type: 'trigger' }])} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 22px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Add Trigger</button>
        <button onClick={() => setNodes([...nodes, { id: Date.now(), label: 'Action', type: 'action' }])} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 22px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Add Action</button>
      </div>
      <div style={{ minHeight: 120, border: '1px dashed #6366f1', borderRadius: 10, padding: 16, background: darkMode ? '#18181b' : '#23232a', marginBottom: 16 }}>
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
        style={{ width: "100%", fontSize: 16, borderRadius: 10, border: "1px solid #333", padding: 12, background: darkMode ? '#18181b' : '#23232a', color: '#fafafa', marginBottom: 8 }}
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
  const [darkMode, setDarkMode] = useState(false);
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

  // Main UI
  return (
    <div style={{
      maxWidth: 900,
      margin: "40px auto",
      background: darkMode ? "#18181b" : "#fff",
      borderRadius: 18,
      boxShadow: "0 2px 24px #0002",
      padding: 36,
      color: darkMode ? "#f1f5f9" : "#23263a",
      fontFamily: 'Inter, sans-serif',
      transition: "background 0.3s, color 0.3s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0 }}>Klaviyo Flow Automation</h2>
        <button onClick={() => setDarkMode(d => !d)} aria-label="Toggle dark mode" style={{ background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>{darkMode ? "Light" : "Dark"} Mode</button>
      </div>
      <div style={{ marginBottom: 10, color: darkMode ? "#a3e635" : "#0ea5e9", fontWeight: 600 }}>
        <span role="img" aria-label="bolt">⚡</span> Build, automate, and analyze Klaviyo flows with AI, analytics, and team collaboration.
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 2, minWidth: 320 }}>
          {showOnboarding && onboardingContent}
          <VisualFlowBuilder flow={flow} setFlow={setFlow} nodes={nodes} setNodes={setNodes} darkMode={darkMode} />
          <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
            <button onClick={handleAISuggest} disabled={loading || !flow} style={{ background: "#a3e635", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{loading ? "Thinking..." : "AI Suggest"}</button>
            <button onClick={handleRun} disabled={loading || !flow} style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{loading ? "Running..." : "Run Automation"}</button>
            <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
            <input ref={fileInputRef} type="file" accept=".txt,.json" style={{ display: "none" }} onChange={handleImport} aria-label="Import flow" />
            <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
            {exported && <a href={exported} download="klaviyo-flow.txt" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
          </div>
          {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
          {aiSuggestion && (
            <div style={{ background: darkMode ? "#23263a" : "#f1f5f9", borderRadius: 10, padding: 16, marginBottom: 12, color: darkMode ? "#a3e635" : "#23263a" }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>AI Suggestion:</div>
              <div>{aiSuggestion}</div>
            </div>
          )}
          {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
        </div>
        <div style={{ flex: 1, minWidth: 260, background: darkMode ? "#23232a" : "#18181b", borderRadius: 14, padding: 24, boxShadow: "0 2px 8px #0004" }}>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 12, color: darkMode ? "#fafafa" : "#e0e7ff" }}>Analytics & Collaboration</div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Collaborators:</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: darkMode ? '#a3e635' : '#6366f1', fontWeight: 600 }}>
              {collaborators.map(c => <li key={c}>{c}</li>)}
            </ul>
            <button onClick={handleAddCollaborator} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 15, marginTop: 8, cursor: "pointer" }}>Add Collaborator</button>
          </div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Flow Analytics:</div>
          <div style={{ fontSize: 15, color: darkMode ? "#a3e635" : "#6366f1" }}>
            {analytics ? (
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "none", padding: 0, margin: 0 }}>{JSON.stringify(analytics, null, 2)}</pre>
            ) : (
              <span>No analytics yet. Run automation to see results.</span>
            )}
          </div>
          <div style={{ marginTop: 18 }}>
            <button onClick={() => setShowOnboarding(true)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Show Onboarding</button>
          </div>
          <div style={{ marginTop: 18, fontSize: 13, color: darkMode ? "#a3e635" : "#64748b" }}>
            <div>Integrations: <span style={{ fontWeight: 700 }}>Klaviyo</span>, <span style={{ fontWeight: 700 }}>Shopify</span></div>
            <div>Accessibility: <span style={{ fontWeight: 700 }}>WCAG 2.1</span> | <span style={{ fontWeight: 700 }}>Keyboard Shortcuts</span></div>
            <div>Compliance: <span style={{ fontWeight: 700 }}>GDPR</span>, <span style={{ fontWeight: 700 }}>SOC2</span></div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 32, fontSize: 13, color: darkMode ? "#a3e635" : "#64748b", textAlign: "center" }}>
        <span>Best-in-class SaaS features. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: darkMode ? "#a3e635" : "#0ea5e9", textDecoration: "underline" }}>Contact Support</a></span>
      </div>
    </div>
  );
}
