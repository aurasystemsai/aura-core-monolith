import React from "react";

export default function AutomationTemplates() {
  // Flagship UI state
  const [showOnboarding, setShowOnboarding] = React.useState(true);
  const [templates, setTemplates] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [analytics, setAnalytics] = React.useState([]);
  const [imported, setImported] = React.useState(null);
  const [exported, setExported] = React.useState(null);
  const [feedback, setFeedback] = React.useState("");
  const [error, setError] = React.useState("");
  const fileInputRef = React.useRef();

  // Onboarding content
  const onboardingContent = (
    <div style={{ padding: 24, background: '#232336', borderRadius: 12, marginBottom: 18, color: '#e5e7eb' }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Automation Templates</h3>
      <ul style={{ margin: '16px 0 0 18px', color: '#334155', fontSize: 16 }}>
        <li>Browse, import, and install workflow templates</li>
        <li>Customize, analyze, and export automations</li>
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
      setTemplates(JSON.parse(evt.target.result));
      setImported(file.name);
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(templates, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await fetch("/api/automation-templates/feedback", {
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
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Automation Templates</h2>
      <button onClick={() => setShowOnboarding(v => !v)} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
      {showOnboarding && onboardingContent}
      {/* Template Gallery */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Template Gallery</div>
        <div style={{ display: 'flex', gap: 18, marginBottom: 18 }}>
          {templates.length ? templates.map((tpl, i) => (
            <div key={i} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 18, minWidth: 220, background: selected === i ? '#e0e7ff' : '#fff', cursor: 'pointer' }} onClick={() => setSelected(i)} aria-label={`Template ${tpl.name}`}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{tpl.name}</div>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>{tpl.description}</div>
              <button style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Install</button>
            </div>
          )) : <span>No templates yet. Import or create new ones.</span>}
        </div>
      </div>
      {/* Import/Export */}
      <div style={{ marginBottom: 24 }}>
        <input type="file" accept="application/json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
        <button onClick={() => fileInputRef.current.click()} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginRight: 12 }}>Import Templates</button>
        <button onClick={handleExport} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Export Templates</button>
        {imported && <span style={{ marginLeft: 12, color: '#6366f1' }}>Imported: {imported}</span>}
        {exported && <a href={exported} download="templates.json" style={{ marginLeft: 12, color: '#22c55e', textDecoration: 'underline' }}>Download Export</a>}
      </div>
      {/* Analytics Dashboard */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ background: "#1e2235", borderRadius: 10, padding: "12px 20px", border: "1px solid #2f3a50" }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Templates Used</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#7fffd4", marginTop: 2 }}>{analytics.length}</div>
        </div>
      </div>
      {/* Accessibility & Compliance */}
      <div style={{ marginTop: 32, fontSize: 13, color: '#64748b', textAlign: 'center' }}>
        <span>Best-in-class SaaS features. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>Contact Support</a></span>
      </div>
    </div>
  );
}
