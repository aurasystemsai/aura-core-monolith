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
          // Templates state for flagship management
          const [templatesList, setTemplatesList] = useState([
            { id: 1, name: 'Welcome Email', channel: 'email', content: 'Welcome to Aura!', created: '2026-01-01', selected: false },
            { id: 2, name: 'Cart Reminder SMS', channel: 'sms', content: 'You left something in your cart!', created: '2026-01-05', selected: false },
          ]);
          const [showTemplateModal, setShowTemplateModal] = useState(false);
          const [editingTemplate, setEditingTemplate] = useState(null);

          // Open modal for new or edit
          const openTemplateModal = (template = null) => {
            setEditingTemplate(template);
            setShowTemplateModal(true);
          };
          const closeTemplateModal = () => {
            setEditingTemplate(null);
            setShowTemplateModal(false);
          };

          // Save template (add or update)
          const saveTemplate = (t) => {
            if (t.id) {
              setTemplatesList(list => list.map(x => x.id === t.id ? { ...t, selected: false } : x));
            } else {
              setTemplatesList(list => [...list, { ...t, id: Date.now(), selected: false }]);
            }
            closeTemplateModal();
          };

          // Bulk select
          const toggleSelectTemplate = (id) => {
            setTemplatesList(list => list.map(x => x.id === id ? { ...x, selected: !x.selected } : x));
          };
          const selectAllTemplates = (checked) => {
            setTemplatesList(list => list.map(x => ({ ...x, selected: checked })));
          };
          // Bulk delete
          const deleteSelectedTemplates = () => {
            setTemplatesList(list => list.filter(x => !x.selected));
          };
        // Segments state for advanced segmentation
        const [segmentsList, setSegmentsList] = useState([
          { id: 1, name: 'VIP Customers', rule: 'Spent > $500', created: '2026-01-01', selected: false },
          { id: 2, name: 'New Signups', rule: 'Joined < 30d', created: '2026-01-10', selected: false },
        ]);
        const [showSegmentModal, setShowSegmentModal] = useState(false);
        const [editingSegment, setEditingSegment] = useState(null);

        // Open modal for new or edit
        const openSegmentModal = (segment = null) => {
          setEditingSegment(segment);
          setShowSegmentModal(true);
        };
        const closeSegmentModal = () => {
          setEditingSegment(null);
          setShowSegmentModal(false);
        };

        // Save segment (add or update)
        const saveSegment = (s) => {
          if (s.id) {
            setSegmentsList(list => list.map(x => x.id === s.id ? { ...s, selected: false } : x));
          } else {
            setSegmentsList(list => [...list, { ...s, id: Date.now(), selected: false }]);
          }
          closeSegmentModal();
        };

        // Bulk select
        const toggleSelectSegment = (id) => {
          setSegmentsList(list => list.map(x => x.id === id ? { ...x, selected: !x.selected } : x));
        };
        const selectAllSegments = (checked) => {
          setSegmentsList(list => list.map(x => ({ ...x, selected: checked })));
        };
        // Bulk delete
        const deleteSelectedSegments = () => {
          setSegmentsList(list => list.filter(x => !x.selected));
        };
      // Campaigns state for flagship management
      const [campaigns, setCampaigns] = useState([
        { id: 1, name: 'VIP Winback', channel: 'email', status: 'active', created: '2026-01-01', segment: 'VIP', schedule: '24h', variant: 'A', selected: false },
        { id: 2, name: 'Cart Recovery', channel: 'sms', status: 'draft', created: '2026-01-05', segment: 'All', schedule: '1h', variant: 'B', selected: false },
      ]);
      const [showCampaignModal, setShowCampaignModal] = useState(false);
      const [editingCampaign, setEditingCampaign] = useState(null);

      // Open modal for new or edit
      const openCampaignModal = (campaign = null) => {
        setEditingCampaign(campaign);
        setShowCampaignModal(true);
      };
      const closeCampaignModal = () => {
        setEditingCampaign(null);
        setShowCampaignModal(false);
      };

      // Save campaign (add or update)
      const saveCampaign = (c) => {
        if (c.id) {
          setCampaigns(list => list.map(x => x.id === c.id ? { ...c, selected: false } : x));
        } else {
          setCampaigns(list => [...list, { ...c, id: Date.now(), selected: false }]);
        }
        closeCampaignModal();
      };

      // Bulk select
      const toggleSelectCampaign = (id) => {
        setCampaigns(list => list.map(x => x.id === id ? { ...x, selected: !x.selected } : x));
      };
      const selectAllCampaigns = (checked) => {
        setCampaigns(list => list.map(x => ({ ...x, selected: checked })));
      };
      // Bulk delete
      const deleteSelectedCampaigns = () => {
        setCampaigns(list => list.filter(x => !x.selected));
      };
    // Navigation state for flagship SaaS sections
    const [activeSection, setActiveSection] = useState('campaigns');
    const sections = [
      { key: 'campaigns', label: 'Campaigns' },
      { key: 'segments', label: 'Segments' },
      { key: 'templates', label: 'Templates' },
      { key: 'abTesting', label: 'A/B Testing' },
      { key: 'analytics', label: 'Analytics' },
      { key: 'automation', label: 'Automation' },
      { key: 'integrations', label: 'Integrations' },
      { key: 'notifications', label: 'Notifications' },
      { key: 'activityLog', label: 'Activity Log' },
      { key: 'compliance', label: 'Compliance' },
      { key: 'settings', label: 'Settings' },
      { key: 'help', label: 'Help & Docs' },
    ];
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
  // WebSocket support removed: no real-time updates

  // Example: fetch analytics on mount and show error if fails
  useEffect(() => {
    (async () => {
      try {
        const resp = await apiFetch('/api/abandoned-checkout-winback/analytics');
        if (!resp.ok) {
          const msg = `API error: ${resp.status} ${resp.statusText}`;
          setTopLevelError(msg);
          return;
        }
        const data = await resp.json();
        setAnalytics(data.events || []);
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
    <>
      <div style={{ display: 'flex', maxWidth: 1400, margin: '0 auto', padding: 24, background: 'var(--background-primary)', borderRadius: 16, boxShadow: '0 2px 16px 0 #0001' }}>
        {/* Sidebar Navigation */}
        <nav style={{ width: 220, marginRight: 32, display: 'flex', flexDirection: 'column', gap: 8 }} aria-label="Main navigation">
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              style={{
                background: activeSection === s.key ? 'var(--button-primary-bg)' : 'var(--button-tertiary-bg)',
                color: activeSection === s.key ? 'var(--button-primary-text)' : 'var(--button-tertiary-text)',
                border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, fontSize: 16, cursor: 'pointer', textAlign: 'left', outline: activeSection === s.key ? '2px solid #6366f1' : 'none'
              }}
              aria-current={activeSection === s.key ? 'page' : undefined}
            >
              {s.label}
            </button>
          ))}
        </nav>
        {/* Main Content Area */}
        <div style={{ flex: 1 }}>
          {topLevelError && (
            <div style={{ color: '#fff', background: '#ef4444', padding: 16, borderRadius: 8, marginBottom: 18, fontWeight: 600, fontSize: 16 }} role="alert">
              {topLevelError}
            </div>
          )}
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0, letterSpacing: '-1px' }}>Abandoned Checkout Winback</h2>
            <button
              onClick={() => setShowOnboarding(v => !v)}
              style={{ background: 'var(--button-secondary-bg)', color: 'var(--button-secondary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginLeft: 16 }}
              aria-pressed={showOnboarding}
              aria-label={showOnboarding ? 'Hide onboarding wizard' : 'Show onboarding wizard'}
              title={showOnboarding ? 'Hide onboarding wizard' : 'Show onboarding wizard'}
            >
              {showOnboarding ? "Hide" : "Show"} Onboarding
            </button>
          </header>
          {/* Flagship SaaS Feature Shells */}
          {activeSection === 'campaigns' && (
            <section aria-label="Campaigns">
              <WinbackFeatureCard title="Campaign Management" description="Create, edit, schedule, and manage winback campaigns. Bulk actions, calendar, and automation included." icon="📦" />
              <div>
                {/* Campaigns Table & Bulk Actions */}
                <div style={{ marginTop: 24, marginBottom: 32 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 20 }}>Your Campaigns</div>
                    <button onClick={() => openCampaignModal()} style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>+ New Campaign</button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--background-secondary)', borderRadius: 10, overflow: 'hidden', fontSize: 15 }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6' }}>
                        <th><input type="checkbox" checked={campaigns.every(c => c.selected)} onChange={e => selectAllCampaigns(e.target.checked)} aria-label="Select all campaigns" /></th>
                        <th>Name</th>
                        <th>Channel</th>
                        <th>Status</th>
                        <th>Segment</th>
                        <th>Schedule</th>
                        <th>Variant</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.length === 0 ? (
                        <tr><td colSpan={9} style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>No campaigns yet.</td></tr>
                      ) : campaigns.map(c => (
                        <tr key={c.id} style={{ background: c.selected ? '#e0e7ff' : undefined }}>
                          <td><input type="checkbox" checked={!!c.selected} onChange={() => toggleSelectCampaign(c.id)} aria-label={`Select campaign ${c.name}`} /></td>
                          <td>{c.name}</td>
                          <td>{c.channel}</td>
                          <td>{c.status}</td>
                          <td>{c.segment}</td>
                          <td>{c.schedule}</td>
                          <td>{c.variant}</td>
                          <td>{c.created}</td>
                          <td>
                            <button onClick={() => openCampaignModal(c)} style={{ background: 'var(--button-secondary-bg)', color: 'var(--button-secondary-text)', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginRight: 6 }}>Edit</button>
                            <button onClick={() => setCampaigns(list => list.filter(x => x.id !== c.id))} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Bulk Actions */}
                  <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                    <button onClick={deleteSelectedCampaigns} disabled={!campaigns.some(c => c.selected)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Delete Selected</button>
                  </div>
                </div>
                {/* Campaign Modal (Add/Edit) */}
                {showCampaignModal && (
                  <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="dialog" aria-modal="true">
                    <div style={{ background: '#fff', borderRadius: 14, padding: 32, minWidth: 400, maxWidth: 480, boxShadow: '0 8px 40px #0008', position: 'relative' }}>
                      <h3 style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>{editingCampaign ? 'Edit Campaign' : 'New Campaign'}</h3>
                      <form onSubmit={e => { e.preventDefault(); saveCampaign(editingCampaign ? editingCampaign : campaign); }}>
                        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-campaign-name">Name</label>
                        <input id="modal-campaign-name" value={editingCampaign ? editingCampaign.name : campaign.name} onChange={e => setEditingCampaign(editingCampaign ? { ...editingCampaign, name: e.target.value } : { ...campaign, name: e.target.value })} placeholder="Campaign name" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 12 }} required />
                        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-campaign-channel">Channel</label>
                        <select id="modal-campaign-channel" value={editingCampaign ? editingCampaign.channel : campaign.channel} onChange={e => setEditingCampaign(editingCampaign ? { ...editingCampaign, channel: e.target.value } : { ...campaign, channel: e.target.value })} style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 12 }} required>
                          <option value="email">Email</option>
                          <option value="sms">SMS</option>
                          <option value="push">Push</option>
                        </select>
                        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-campaign-segment">Segment</label>
                        <input id="modal-campaign-segment" value={editingCampaign ? editingCampaign.segment : campaign.segment} onChange={e => setEditingCampaign(editingCampaign ? { ...editingCampaign, segment: e.target.value } : { ...campaign, segment: e.target.value })} placeholder="Segment" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 12 }} required />
                        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-campaign-schedule">Schedule</label>
                        <input id="modal-campaign-schedule" value={editingCampaign ? editingCampaign.schedule : campaign.schedule} onChange={e => setEditingCampaign(editingCampaign ? { ...editingCampaign, schedule: e.target.value } : { ...campaign, schedule: e.target.value })} placeholder="Schedule" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 12 }} required />
                        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-campaign-variant">Variant</label>
                        <input id="modal-campaign-variant" value={editingCampaign ? editingCampaign.variant : campaign.variant} onChange={e => setEditingCampaign(editingCampaign ? { ...editingCampaign, variant: e.target.value } : { ...campaign, variant: e.target.value })} placeholder="Variant (A/B)" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 12 }} required />
                        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-campaign-status">Status</label>
                        <select id="modal-campaign-status" value={editingCampaign ? editingCampaign.status : campaign.status} onChange={e => setEditingCampaign(editingCampaign ? { ...editingCampaign, status: e.target.value } : { ...campaign, status: e.target.value })} style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 18 }} required>
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                        </select>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                          <button type="button" onClick={closeCampaignModal} style={{ background: 'var(--button-tertiary-bg)', color: 'var(--button-tertiary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
                          <button type="submit" style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>{editingCampaign ? 'Save Changes' : 'Create Campaign'}</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
          {activeSection === 'segments' && (
            <section aria-label="Segments">
              <WinbackFeatureCard title="Advanced Segmentation" description="Create, manage, and apply dynamic customer segments. Saved segments, rule builder, and filters." icon="👥" />
              <div>
                {/* Segments Table & Bulk Actions */}
                <div style={{ marginTop: 24, marginBottom: 32 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 20 }}>Your Segments</div>
                    <button onClick={() => openSegmentModal()} style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>+ New Segment</button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--background-secondary)', borderRadius: 10, overflow: 'hidden', fontSize: 15 }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6' }}>
                        <th><input type="checkbox" checked={segmentsList.every(s => s.selected)} onChange={e => selectAllSegments(e.target.checked)} aria-label="Select all segments" /></th>
                        <th>Name</th>
                        <th>Rule</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {segmentsList.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>No segments yet.</td></tr>
                      ) : segmentsList.map(s => (
                        <tr key={s.id} style={{ background: s.selected ? '#e0e7ff' : undefined }}>
                          <td><input type="checkbox" checked={!!s.selected} onChange={() => toggleSelectSegment(s.id)} aria-label={`Select segment ${s.name}`} /></td>
                          <td>{s.name}</td>
                          <td>{s.rule}</td>
                          <td>{s.created}</td>
                          <td>
                            <button onClick={() => openSegmentModal(s)} style={{ background: 'var(--button-secondary-bg)', color: 'var(--button-secondary-text)', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginRight: 6 }}>Edit</button>
                            <button onClick={() => setSegmentsList(list => list.filter(x => x.id !== s.id))} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Bulk Actions */}
                  <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                    <button onClick={deleteSelectedSegments} disabled={!segmentsList.some(s => s.selected)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Delete Selected</button>
                  </div>
                </div>
                {/* Segment Modal (Add/Edit) */}
                {showSegmentModal && (
                  <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="dialog" aria-modal="true">
                    <div style={{ background: '#fff', borderRadius: 14, padding: 32, minWidth: 400, maxWidth: 480, boxShadow: '0 8px 40px #0008', position: 'relative' }}>
                      <h3 style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>{editingSegment ? 'Edit Segment' : 'New Segment'}</h3>
                      <form onSubmit={e => { e.preventDefault(); saveSegment(editingSegment ? editingSegment : { name: '', rule: '', created: new Date().toISOString().slice(0, 10) }); }}>
                        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-segment-name">Name</label>
                        <input id="modal-segment-name" value={editingSegment ? editingSegment.name : ''} onChange={e => setEditingSegment(editingSegment ? { ...editingSegment, name: e.target.value } : { name: e.target.value, rule: '', created: new Date().toISOString().slice(0, 10) })} placeholder="Segment name" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 12 }} required />
                        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-segment-rule">Rule</label>
                        <input id="modal-segment-rule" value={editingSegment ? editingSegment.rule : ''} onChange={e => setEditingSegment(editingSegment ? { ...editingSegment, rule: e.target.value } : { name: '', rule: e.target.value, created: new Date().toISOString().slice(0, 10) })} placeholder="Rule (e.g. Spent > $500)" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 12 }} required />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                          <button type="button" onClick={closeSegmentModal} style={{ background: 'var(--button-tertiary-bg)', color: 'var(--button-tertiary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
                          <button type="submit" style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>{editingSegment ? 'Save Changes' : 'Create Segment'}</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
          {activeSection === 'templates' && (
            <section aria-label="Templates">
              <WinbackFeatureCard title="Templates" description="Manage and create message templates for campaigns." icon="📝" />
              <div>
                {/* Templates Table & Bulk Actions */}
                <div style={{ marginTop: 24, marginBottom: 32 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 20 }}>Your Templates</div>
                    <button onClick={() => openTemplateModal()} style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>+ New Template</button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--background-secondary)', borderRadius: 10, overflow: 'hidden', fontSize: 15 }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6' }}>
                        <th><input type="checkbox" checked={templatesList.every(t => t.selected)} onChange={e => selectAllTemplates(e.target.checked)} aria-label="Select all templates" /></th>
                        <th>Name</th>
                        <th>Channel</th>
                        <th>Content</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {templatesList.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>No templates yet.</td></tr>
                      ) : templatesList.map(t => (
                        <tr key={t.id} style={{ background: t.selected ? '#e0e7ff' : undefined }}>
                          <td><input type="checkbox" checked={!!t.selected} onChange={() => toggleSelectTemplate(t.id)} aria-label={`Select template ${t.name}`} /></td>
                          <td>{t.name}</td>
                          <td>{t.channel}</td>
                          <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.content}</td>
                          <td>{t.created}</td>
                          <td>
                            <button onClick={() => openTemplateModal(t)} style={{ background: 'var(--button-secondary-bg)', color: 'var(--button-secondary-text)', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginRight: 6 }}>Edit</button>
                            <button onClick={() => setTemplatesList(list => list.filter(x => x.id !== t.id))} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Bulk Actions */}
                  <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                    <button onClick={deleteSelectedTemplates} disabled={!templatesList.some(t => t.selected)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Delete Selected</button>
                  </div>
                </div>
                {/* Template Modal (Add/Edit) */}
                {showTemplateModal && (
                  <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="dialog" aria-modal="true">
                    <div style={{ background: '#fff', borderRadius: 14, padding: 32, minWidth: 400, maxWidth: 480, boxShadow: '0 8px 40px #0008', position: 'relative' }}>
                      <h3 style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>{editingTemplate ? 'Edit Template' : 'New Template'}</h3>
                      <form onSubmit={e => { e.preventDefault(); saveTemplate(editingTemplate ? editingTemplate : { name: '', channel: 'email', content: '', created: new Date().toISOString().slice(0, 10) }); }}>
                        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-template-name">Name</label>
                        <input id="modal-template-name" value={editingTemplate ? editingTemplate.name : ''} onChange={e => setEditingTemplate(editingTemplate ? { ...editingTemplate, name: e.target.value } : { name: e.target.value, channel: 'email', content: '', created: new Date().toISOString().slice(0, 10) })} placeholder="Template name" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 12 }} required />
                        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-template-channel">Channel</label>
                        <select id="modal-template-channel" value={editingTemplate ? editingTemplate.channel : 'email'} onChange={e => setEditingTemplate(editingTemplate ? { ...editingTemplate, channel: e.target.value } : { name: '', channel: e.target.value, content: '', created: new Date().toISOString().slice(0, 10) })} style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 12 }} required>
                          <option value="email">Email</option>
                          <option value="sms">SMS</option>
                          <option value="push">Push</option>
                        </select>
                        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-template-content">Content</label>
                        <textarea id="modal-template-content" value={editingTemplate ? editingTemplate.content : ''} onChange={e => setEditingTemplate(editingTemplate ? { ...editingTemplate, content: e.target.value } : { name: '', channel: 'email', content: e.target.value, created: new Date().toISOString().slice(0, 10) })} placeholder="Template content" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 12, minHeight: 80 }} required />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                          <button type="button" onClick={closeTemplateModal} style={{ background: 'var(--button-tertiary-bg)', color: 'var(--button-tertiary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
                          <button type="submit" style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>{editingTemplate ? 'Save Changes' : 'Create Template'}</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
          {activeSection === 'abTesting' && (
            <section aria-label="A/B Testing">
              <WinbackFeatureCard title="A/B Testing" description="Run experiments to optimize winback strategies." icon="🧪" />
              {/* ...ab testing code... */}
            </section>
          )}
          {activeSection === 'analytics' && (
            <section aria-label="Analytics">
              <WinbackFeatureCard title="Analytics" description="View performance metrics and insights for your campaigns." icon="📊" />
              {/* ...analytics code... */}
            </section>
          )}
          {activeSection === 'automation' && (
            <section aria-label="Automation">
              <WinbackFeatureCard title="Automation" description="Automate winback workflows and triggers." icon="🤖" />
              {/* ...automation code... */}
            </section>
          )}
          {activeSection === 'integrations' && (
            <section aria-label="Integrations">
              <WinbackFeatureCard title="Integrations" description="Connect third-party services for enhanced winback capabilities." icon="🔗" />
              {/* ...integrations code... */}
            </section>
          )}
          {activeSection === 'notifications' && (
            <section aria-label="Notifications">
              <WinbackFeatureCard title="Notifications" description="Manage notification preferences and delivery channels." icon="🔔" />
              {/* ...notifications code... */}
            </section>
          )}
          {activeSection === 'activityLog' && (
            <section aria-label="Activity Log">
              <WinbackFeatureCard title="Activity Log" description="Timeline of all actions, sends, edits, and results. Export, search, and filter options." icon="📜" />
              {/* ...activity log code... */}
            </section>
          )}
          {activeSection === 'compliance' && (
            <section aria-label="Compliance">
              <WinbackFeatureCard title="Compliance Center" description="GDPR/CCPA tools, opt-out, audit logs, data export/delete, and deliverability best practices." icon="🛡️" />
              {/* ...compliance code... */}
            </section>
          )}
          {activeSection === 'settings' && (
            <section aria-label="Settings">
              <WinbackFeatureCard title="Settings" description="Configure tool preferences, notification options, and advanced settings. Personalize your winback experience." icon="⚙️" />
              {/* ...settings code... */}
            </section>
          )}
          {activeSection === 'help' && (
            <section aria-label="Help & Docs">
              <WinbackFeatureCard title="Help & Documentation" description="Browse FAQs, onboarding guides, and get support. Everything you need to master winback automation." icon="❓" />
              <div style={{ margin: '32px 0', background: '#f9fafb', borderRadius: 14, boxShadow: '0 2px 8px #0001', padding: 32 }}>
                <h3 style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>Documentation & Guides</h3>
                <WinbackHelpDocs />
                <div style={{ marginTop: 32 }}>
                  <h4 style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Frequently Asked Questions</h4>
                  <ul style={{ fontSize: 15, color: '#334155', paddingLeft: 24 }}>
                    <li><b>How do I create a winback campaign?</b> Use the Campaigns section to create, schedule, and manage campaigns. Click '+ New Campaign' to get started.</li>
                    <li><b>Can I automate cart recovery?</b> Yes! Use the Automation section to set up triggers and actions for cart recovery workflows.</li>
                    <li><b>How do I connect integrations?</b> Go to Integrations and click '+ Connect Integration' to link third-party services like Shopify or Klaviyo.</li>
                    <li><b>Where can I find analytics?</b> The Analytics section provides charts, summary cards, and event logs for all winback activity.</li>
                    <li><b>How do I get support?</b> Click 'Contact Support' below or email support@aura-core.ai for help.</li>
                  </ul>
                </div>
                <div style={{ marginTop: 32, textAlign: 'center' }}>
                  <a href="mailto:support@aura-core.ai" style={{ color: '#0ea5e9', textDecoration: 'underline', fontWeight: 700, fontSize: 16 }}>Contact Support</a>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
