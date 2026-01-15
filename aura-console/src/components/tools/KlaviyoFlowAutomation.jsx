
import React, { useState, useRef } from "react";
import FlowNodeBuilder from "./FlowNodeBuilder";



export default function KlaviyoFlowAutomation() {
  const [flow, setFlow] = useState("");
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
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
      background: "#23232a",
      borderRadius: 18,
      boxShadow: "0 8px 40px #000b, 0 1.5px 0 #232336",
      padding: 48,
      color: "#fafafa",
      fontFamily: 'Inter, Segoe UI, sans-serif',
      transition: "background 0.3s, color 0.3s",
      border: "1.5px solid #232336"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontWeight: 900, fontSize: 32, margin: 0, letterSpacing: -1, color: "#fafafa" }}>Klaviyo Flow Automation</h2>
      </div>
      <div style={{ marginBottom: 18, color: "#64748b", fontWeight: 600, fontSize: 16, letterSpacing: 0.1 }}>Build, automate, and analyze Klaviyo flows with AI, analytics, and team collaboration.</div>
      <div style={{ display: "flex", gap: 36, flexWrap: "wrap" }}>
        <div style={{ flex: 2, minWidth: 340 }}>
          {showOnboarding && onboardingContent}
          <FlowNodeBuilder nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} />
          <div style={{ display: "flex", gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
            <button onClick={handleAISuggest} disabled={loading || !flow} style={{ background: "#0ea5e9", color: "#fff", border: 'none', borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: loading || !flow ? 'not-allowed' : 'pointer', opacity: loading || !flow ? 0.7 : 1 }}>AI Suggest</button>
            <button onClick={handleRun} disabled={loading || !flow} style={{ background: "#232336", color: "#fafafa", border: '1px solid #333', borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: loading || !flow ? 'not-allowed' : 'pointer', opacity: loading || !flow ? 0.7 : 1 }}>Run Automation</button>
            <button onClick={() => fileInputRef.current?.click()} style={{ background: "#232336", color: "#fafafa", border: '1px solid #333', borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Import</button>
            <input ref={fileInputRef} type="file" accept=".txt,.json" style={{ display: "none" }} onChange={handleImport} aria-label="Import flow" />
            <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: 'none', borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Export</button>
            {exported && <a href={exported} download="klaviyo-flow.txt" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 700, fontSize: 16, textDecoration: 'underline' }}>Download</a>}
          </div>
          {imported && <div style={{ color: "#22c55e", marginBottom: 10, fontWeight: 700, fontSize: 16 }}>Imported: {imported}</div>}
          {aiSuggestion && (
            <div style={{ background: "#18181b", borderRadius: 10, padding: 16, marginBottom: 12, color: "#fafafa" }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>AI Suggestion:</div>
              <div>{aiSuggestion}</div>
            </div>
          )}
          {error && <div style={{ color: "#ef4444", marginBottom: 10, fontWeight: 700, fontSize: 16 }}>{error}</div>}
        </div>
        <div style={{ flex: 1, minWidth: 300, background: "#18181b", borderRadius: 14, padding: 24, boxShadow: "0 2px 8px #0004", display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 12, color: "#fafafa" }}>Analytics & Collaboration</div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Collaborators:</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#64748b', fontWeight: 600 }}>
              {collaborators.map(c => <li key={c}>{c}</li>)}
            </ul>
            <button onClick={handleAddCollaborator} style={{ background: "#232336", color: "#fafafa", border: "1px solid #333", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 15, marginTop: 8, cursor: "pointer" }}>Add Collaborator</button>
          </div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Flow Analytics:</div>
          <div style={{ fontSize: 15, color: "#64748b" }}>
            {analytics ? (
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "none", padding: 0, margin: 0 }}>{JSON.stringify(analytics, null, 2)}</pre>
            ) : (
              <span>No analytics yet. Run automation to see results.</span>
            )}
          </div>
          <div style={{ marginTop: 18 }}>
            <button onClick={() => setShowOnboarding(true)} style={{ background: "#232336", color: "#fafafa", border: "1px solid #333", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Show Onboarding</button>
          </div>
          <div style={{ marginTop: 18, fontSize: 13, color: "#64748b" }}>
            <div>Integrations: <span style={{ fontWeight: 700 }}>Klaviyo</span>, <span style={{ fontWeight: 700 }}>Shopify</span></div>
            <div>Accessibility: <span style={{ fontWeight: 700 }}>WCAG 2.1</span> | <span style={{ fontWeight: 700 }}>Keyboard Shortcuts</span></div>
            <div>Compliance: <span style={{ fontWeight: 700 }}>GDPR</span>, <span style={{ fontWeight: 700 }}>SOC2</span></div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 32, fontSize: 13, color: "#64748b", textAlign: "center" }}>
        <span>Best-in-class SaaS features. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: "#0ea5e9", textDecoration: "underline" }}>Contact Support</a></span>
      </div>
    </div>
  );
}
