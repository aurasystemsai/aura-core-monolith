  // ...existing code...
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
  import React, { useState, useRef, useEffect } from "react";
  import WinbackAnalyticsChart from "./WinbackAnalyticsChart";
  import WinbackOnboardingWizard from "./WinbackOnboardingWizard";
  import WinbackAnomalyBanner from "./WinbackAnomalyBanner";
  import WinbackFeatureCard from "./WinbackFeatureCard";

  export default function AdvancedAnalyticsAttribution() {
    // State for onboarding, dashboard, AI Copilot, analytics, etc.
    const [showOnboarding, setShowOnboarding] = useState(true);
    const [onboardingComplete, setOnboardingComplete] = useState(false);
    const [dashboardWidgets, setDashboardWidgets] = useState([
      { id: "journey", type: "JourneyMap" },
      { id: "funnel", type: "FunnelViz" },
      { id: "attribution", type: "AttributionPlayground" },
      { id: "anomaly", type: "AnomalyBanner" },
      { id: "chart", type: "AnalyticsChart" },
    ]);
    const [analytics, setAnalytics] = useState([]);
    const [activityLog, setActivityLog] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [aiQuery, setAiQuery] = useState("");
    const [aiResponse, setAiResponse] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [error, setError] = useState("");
    const [imported, setImported] = useState(null);
    const [exported, setExported] = useState(null);
    const fileInputRef = useRef();

    // Simulate onboarding wizard
    const onboardingContent = (
      <WinbackOnboardingWizard onComplete={() => { setOnboardingComplete(true); setShowOnboarding(false); }} />
    );

    // Simulate AI Copilot
    const handleAICopilot = async () => {
      setAiLoading(true); setAiResponse("");
      setTimeout(() => {
        setAiResponse("[AI Copilot] Here’s a smart, actionable insight based on your query: '" + aiQuery + "'.");
        setAiLoading(false);
      }, 1200);
    };

    // Import/export handlers (history, analytics, etc.)
    const handleImport = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const importedAnalytics = JSON.parse(evt.target.result);
          setAnalytics(importedAnalytics);
          setImported(file.name);
        } catch (err) {
          setError("Invalid file format");
        }
      };
      reader.readAsText(file);
    };
    const handleExport = () => {
      const blob = new Blob([JSON.stringify(analytics)], { type: "application/json" });
      setExported(URL.createObjectURL(blob));
    };
    const handleFeedback = () => {
      setFeedback("");
      // Could POST feedback to backend here
    };

    // Drag-and-drop dashboard widget rearrange (placeholder)
    const moveWidget = (from, to) => {
      const updated = [...dashboardWidgets];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      setDashboardWidgets(updated);
    };

    // Main UI
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h2 style={{ fontWeight: 800, fontSize: 36, margin: 0, color: "var(--text-primary)" }}>Advanced Analytics Attribution</h2>
          <button onClick={() => setShowOnboarding(v => !v)} className="aura-btn" style={{ marginLeft: 18 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
        </div>
        <div style={{ marginBottom: 18, color: "var(--text-accent)", fontWeight: 600, fontSize: 18 }}>
          <span role="img" aria-label="chart">📊</span> Unified, AI-powered attribution and journey analytics for Shopify and beyond.
        </div>
        {showOnboarding && !onboardingComplete && onboardingContent}

        {/* AI Copilot */}
        <div style={{ background: 'var(--background-secondary)', borderRadius: 12, padding: 18, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#6366f1' }}>AI Copilot</span>
          <input
            value={aiQuery}
            onChange={e => setAiQuery(e.target.value)}
            type="text"
            className="aura-input"
            style={{ flex: 1, marginRight: 12 }}
            placeholder="Ask anything about your analytics..."
            aria-label="AI Copilot query input"
          />
          <button onClick={handleAICopilot} disabled={aiLoading || !aiQuery} className="aura-btn">{aiLoading ? "Thinking..." : "Ask AI"}</button>
          {aiResponse && <span style={{ marginLeft: 18, color: '#22c55e', fontWeight: 600 }}>{aiResponse}</span>}
        </div>

        {/* Drag-and-drop Dashboard */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
          {dashboardWidgets.map((w, i) => (
            <div key={w.id} style={{ flex: '1 1 350px', minWidth: 350, maxWidth: 500, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                {i > 0 && <button onClick={() => moveWidget(i, i - 1)} aria-label="Move widget left" style={{ background: '#e0e7ff', border: 'none', borderRadius: 6, padding: 4, cursor: 'pointer' }}>←</button>}
                {i < dashboardWidgets.length - 1 && <button onClick={() => moveWidget(i, i + 1)} aria-label="Move widget right" style={{ background: '#e0e7ff', border: 'none', borderRadius: 6, padding: 4, cursor: 'pointer' }}>→</button>}
              </div>
              {w.type === "JourneyMap" && (
                <WinbackFeatureCard title="Customer Journey Map" description="Visualize every touchpoint and conversion path." icon="🗺️">
                  <div style={{ height: 180, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>[Journey Map Visualization]</div>
                </WinbackFeatureCard>
              )}
              {w.type === "FunnelViz" && (
                <WinbackFeatureCard title="Funnel Analysis" description="See where users drop off and optimize conversion." icon="🔻">
                  <div style={{ height: 180, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>[Funnel Visualization]</div>
                </WinbackFeatureCard>
              )}
              {w.type === "AttributionPlayground" && (
                <WinbackFeatureCard title="Attribution Model Playground" description="Compare and simulate different attribution models." icon="⚖️">
                  <div style={{ height: 180, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>[Attribution Model Comparison]</div>
                </WinbackFeatureCard>
              )}
              {w.type === "AnomalyBanner" && (
                <WinbackAnomalyBanner analytics={analytics} />
              )}
              {w.type === "AnalyticsChart" && (
                <WinbackAnalyticsChart data={analytics} />
              )}
            </div>
          ))}
        </div>

        {/* Import/Export */}
        <div style={{ marginBottom: 24 }}>
          <input type="file" accept="application/json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
          <button onClick={() => fileInputRef.current.click()} className="aura-btn" style={{ marginRight: 12 }}>Import Analytics</button>
          <button onClick={handleExport} className="aura-btn">Export Analytics</button>
          {imported && <span style={{ marginLeft: 12, color: '#6366f1' }}>Imported: {imported}</span>}
          {exported && <a href={exported} download="analytics.json" style={{ marginLeft: 12, color: '#22c55e', textDecoration: 'underline' }}>Download Export</a>}
        </div>

        {/* Activity Log & Notifications */}
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 32 }}>
          <div style={{ flex: 1, minWidth: 320 }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Activity Log</div>
            <div style={{ fontSize: 15, color: 'var(--text-primary)' }}>
              {activityLog.length ? (
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(activityLog, null, 2)}</pre>
              ) : (
                <span>No activity yet. Actions will appear here.</span>
              )}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 320 }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Notification Center</div>
            <div style={{ fontSize: 15, color: 'var(--text-primary)' }}>
              {notifications.length ? (
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(notifications, null, 2)}</pre>
              ) : (
                <span>No notifications yet.</span>
              )}
            </div>
          </div>
        </div>

        {/* Feedback */}
        <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: 'var(--background-secondary)', borderRadius: 12, padding: 20 }} aria-label="Send feedback" autoComplete="off">
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            rows={3}
            style={{ width: '100%', fontSize: 16, padding: 12, borderRadius: 8, border: '1px solid var(--border-color)', marginBottom: 12 }}
            placeholder="Share your feedback or suggestions..."
            aria-label="Feedback"
            required
          />
          <button type="submit" style={{ background: 'var(--button-secondary-bg)', color: 'var(--button-secondary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }} aria-label="Send feedback" title="Send feedback">Send Feedback</button>
          {error && <div style={{ color: '#ef4444', marginTop: 8 }} aria-live="assertive">{error}</div>}
        </form>

        {/* Accessibility & Compliance */}
        <div style={{ marginTop: 32, fontSize: 13, color: '#64748b', textAlign: 'center' }}>
          <span>Best-in-class SaaS features. Accessibility: WCAG 2.1, keyboard navigation, color contrast.<br />
            Feedback? <a href="mailto:support@aura-core.ai" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>Contact Support</a></span>
        </div>
      </div>
    );
  }
