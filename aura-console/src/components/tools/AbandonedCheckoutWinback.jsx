import { exportCampaignPDF } from './WinbackExportPDF';
import { apiFetch } from '../../api';
import WinbackAnomalyBanner from './WinbackAnomalyBanner';
import React, { useState, useEffect } from 'react';
import useWinbackSocket from './AbandonedCheckoutWinbackSocket';
import ToolScaffold from './ToolScaffold';
import WinbackHelpDocs from './WinbackHelpDocs';
import WinbackFeatureCard from './WinbackFeatureCard';
import WinbackOnboardingWizard from './WinbackOnboardingWizard';
import WinbackAnalyticsChart from './WinbackAnalyticsChart';

// Placeholder for the full-featured Abandoned Checkout Winback UI
export default function AbandonedCheckoutWinback() {
  // Flagship UI state
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [step, setStep] = useState(0);
  const [campaign, setCampaign] = useState({ name: '', channel: 'email', segment: '', schedule: '', template: '', variant: '', status: 'draft' });
  const [templates, setTemplates] = useState([]);
  const [variants, setVariants] = useState([]);
  const [segments, setSegments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState(""); // For feedback and general errors
  const [topLevelError, setTopLevelError] = useState(""); // For API/network errors
  const [loading, setLoading] = useState(false);
  const fileInputRef = React.useRef();

  // Real-time WebSocket updates
  useWinbackSocket(data => {
    if (!data || !data.type) return;
    if (data.type === 'analytics') setAnalytics(a => [data.payload, ...a]);
    if (data.type === 'activity') setActivityLog(l => [data.payload, ...l]);
    if (data.type === 'notification') setNotifications(n => [data.payload, ...n]);
  });

  // Example: fetch analytics on mount and show error if fails
  useEffect(() => {
    (async () => {
      try {
        const resp = await apiFetch('/api/analytics');
        if (!resp.ok) {
          const msg = `API error: ${resp.status} ${resp.statusText}`;
          setTopLevelError(msg);
          return;
        }
        const data = await resp.json();
        setAnalytics(data.analytics || []);
      } catch (err) {
        setTopLevelError(err.message || 'Network error');
      }
    })();
  }, []);
  // Enhanced onboarding wizard
  const onboardingContent = (
    <WinbackOnboardingWizard onComplete={() => { setOnboardingComplete(true); setShowOnboarding(false); }} />
  );

  // AI-powered content/segmentation
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const handleAIGenerate = async () => {
    setAiLoading(true); setAiError("");
    try {
      const resp = await apiFetch("/api/abandoned-checkout-winback/ai/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: "Jane Doe",
          cartItems: [{ title: "T-shirt" }, { title: "Sneakers" }],
          brand: "AuraCore",
          tone: "friendly",
          channel: campaign.channel,
          language: "English"
        })
      });
      const data = await resp.json();
      if (data.ok) setCampaign(c => ({ ...c, template: data.content }));
      else setAiError(data.error || "AI error");
    } catch (err) { setAiError("AI error"); }
    setAiLoading(false);
  };
  // Import/export
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      setCampaign(JSON.parse(evt.target.result));
      setImported(file.name);
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(campaign, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await apiFetch("/api/abandoned-checkout-winback/feedback", {
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
    <ToolScaffold toolId="abandoned-checkout-winback">
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
        {topLevelError && (
          <div style={{ color: '#fff', background: '#ef4444', padding: 16, borderRadius: 8, marginBottom: 18, fontWeight: 600, fontSize: 16 }}>
            {topLevelError}
          </div>
        )}
        <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Abandoned Checkout Winback</h2>
        <button
          onClick={() => setShowOnboarding(v => !v)}
          style={{ background: 'var(--button-secondary-bg)', color: 'var(--button-secondary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 16 }}
          aria-pressed={showOnboarding}
          aria-label={showOnboarding ? 'Hide onboarding wizard' : 'Show onboarding wizard'}
          title={showOnboarding ? 'Hide onboarding wizard' : 'Show onboarding wizard'}
        >
          {showOnboarding ? "Hide" : "Show"} Onboarding
        </button>
        {showOnboarding && !onboardingComplete && onboardingContent}
        {/* Campaign Builder Stepper */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Campaign Builder</div>
          {/* ...stepper UI for campaign creation... */}
          <div style={{ display: 'flex', gap: 18, marginBottom: 18 }}>
            <input value={campaign.name} onChange={e => setCampaign({ ...campaign, name: e.target.value })} placeholder="Campaign name" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: 220 }} aria-label="Campaign name" title="Enter a name for your campaign" />
            <select value={campaign.channel} onChange={e => setCampaign({ ...campaign, channel: e.target.value })} style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: 140 }} aria-label="Channel" title="Select the channel for this campaign">
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="push">Push</option>
            </select>
            <input value={campaign.segment} onChange={e => setCampaign({ ...campaign, segment: e.target.value })} placeholder="Segment" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: 180 }} aria-label="Segment" title="Target customer segment (e.g. VIP, new, high-value)" />
            <input value={campaign.schedule} onChange={e => setCampaign({ ...campaign, schedule: e.target.value })} placeholder="Schedule" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: 180 }} aria-label="Schedule" title="Schedule for sending (e.g. 1h, 24h after abandon)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <textarea value={campaign.template} onChange={e => setCampaign({ ...campaign, template: e.target.value })} rows={3} style={{ width: '100%', fontSize: 16, padding: 12, borderRadius: 8, border: '1px solid var(--border-color)' }} placeholder="Email/SMS template" aria-label="Template" title="Edit the message template for this campaign" />
            <button type="button" onClick={handleAIGenerate} disabled={aiLoading} style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }} aria-busy={aiLoading} aria-label="Generate template with AI" title="Generate a personalized message using AI">{aiLoading ? 'Generating...' : 'AI Generate'}</button>
          </div>
          {aiError && <div style={{ color: '#ef4444', marginBottom: 8 }}>{aiError}</div>}
          <input value={campaign.variant} onChange={e => setCampaign({ ...campaign, variant: e.target.value })} placeholder="Variant (A/B)" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: 180, marginBottom: 18 }} aria-label="Variant" title="A/B test variant label (e.g. A, B)" />
          <select value={campaign.status} onChange={e => setCampaign({ ...campaign, status: e.target.value })} style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: 140, marginBottom: 18 }} aria-label="Status" title="Set campaign status">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>
        {/* Import/Export */}
        <div style={{ marginBottom: 24 }}>
          <input type="file" accept="application/json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
          <button onClick={() => fileInputRef.current.click()} style={{ background: 'var(--button-tertiary-bg)', color: 'var(--button-tertiary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginRight: 12 }} aria-label="Import campaign from JSON" title="Import campaign from a JSON file">Import Campaign</button>
          <button onClick={handleExport} style={{ background: 'var(--button-success-bg)', color: 'var(--button-success-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginRight: 12 }} aria-label="Export campaign as JSON" title="Export campaign as a JSON file">Export Campaign (JSON)</button>
          <button onClick={() => exportCampaignPDF(campaign)} style={{ background: 'var(--button-secondary-bg)', color: 'var(--button-secondary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }} aria-label="Export campaign as PDF" title="Export campaign as a PDF file">Export as PDF</button>
          {imported && <span style={{ marginLeft: 12, color: '#6366f1' }} aria-live="polite">Imported: {imported}</span>}
          {exported && <a href={exported} download="campaign.json" style={{ marginLeft: 12, color: '#22c55e', textDecoration: 'underline' }} aria-label="Download exported campaign JSON" title="Download exported campaign JSON">Download Export</a>}
        </div>
        {/* Analytics Dashboard */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Analytics</div>
          <WinbackAnomalyBanner analytics={analytics} />
          <WinbackAnalyticsChart data={analytics} />
        </div>
        {/* Activity Log */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Activity Log</div>
          <div style={{ fontSize: 15, color: 'var(--text-primary)' }}>
            {activityLog.length ? (
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(activityLog, null, 2)}</pre>
            ) : (
              <span>No activity yet. Actions will appear here.</span>
            )}
          </div>
        </div>
        {/* Notification Center */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Notification Center</div>
          <div style={{ fontSize: 15, color: 'var(--text-primary)' }}>
            {notifications.length ? (
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(notifications, null, 2)}</pre>
            ) : (
              <span>No notifications yet.</span>
            )}
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
            title="Share your feedback or suggestions"
            required
          />
          <button type="submit" style={{ background: 'var(--button-secondary-bg)', color: 'var(--button-secondary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }} aria-label="Send feedback" title="Send feedback">Send Feedback</button>
          {error && <div style={{ color: '#ef4444', marginTop: 8 }} aria-live="assertive">{error}</div>}
        </form>
        {/* Accessibility & Compliance */}
        <div style={{ marginTop: 32, fontSize: 13, color: '#64748b', textAlign: 'center' }}>
          <span>Best-in-class SaaS features. Accessibility: WCAG 2.1, keyboard navigation, color contrast.<br />
            <button onClick={async () => {
              await apiFetch('/api/abandoned-checkout-winback/compliance/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: 'demo-user' }) });
              alert('Data export request submitted.');
            }} style={{ margin: '0 8px', background: 'var(--button-tertiary-bg)', color: 'var(--button-tertiary-text)', border: 'none', borderRadius: 8, padding: '4px 12px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Request Data Export</button>
            <button onClick={async () => {
              await apiFetch('/api/abandoned-checkout-winback/compliance/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: 'demo-user' }) });
              alert('Data deletion request submitted.');
            }} style={{ margin: '0 8px', background: 'var(--button-tertiary-bg)', color: 'var(--button-tertiary-text)', border: 'none', borderRadius: 8, padding: '4px 12px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Request Data Deletion</button>
            Feedback? <a href="mailto:support@aura-core.ai" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>Contact Support</a></span>
        </div>
      </div>
    </ToolScaffold>
  );
}
