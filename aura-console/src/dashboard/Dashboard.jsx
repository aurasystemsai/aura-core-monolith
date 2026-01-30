

import React, { useState, useEffect, Suspense, lazy } from "react";
import { apiFetch } from "../api";
import { sendCopilotMessage, submitIdea, topIdeas } from "../core/advancedAiClient";
import IntegrationHealthPanel from "../components/IntegrationHealthPanel";
import NotificationsPanel from "../components/NotificationsPanel";
import AnalyticsPanel from "../components/AnalyticsPanel";
const DashboardCharts = lazy(() => import('./DashboardCharts'));
const ShopInfoPanel = lazy(() => import('../components/ShopInfoPanel'));
const UserManagement = lazy(() => import('../components/UserManagement'));

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
      <div style={{
        width: 38,
        height: 38,
        border: '4px solid #7fffd4',
        borderTop: '4px solid #23263a',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>
    </div>
  );
}
const API_BASE = 'https://aura-core-monolith.onrender.com';

const Dashboard = ({ setActiveSection }) => {
  const [stats, setStats] = useState({
    products: null,
    seoIssues: null,
    automations: null,
    credits: null,
    lastRun: null,
    systemHealth: null,
  });
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotReply, setCopilotReply] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [newIdea, setNewIdea] = useState("");

  useEffect(() => {
    let intervalId;
    async function fetchStats() {
      setLoading(true);
      try {
        const projectId = localStorage.getItem('auraProjectId');
        let products = null, seoIssues = null, automations = null, credits = null, lastRun = null, systemHealth = null;
        if (projectId) {
          const prodRes = await fetch(`${API_BASE}/projects/${projectId}/drafts`);
          if (prodRes.ok) {
            const prodData = await prodRes.json();
            products = Array.isArray(prodData) ? prodData.length : (prodData.items ? prodData.items.length : null);
          }
          const fixRes = await fetch(`${API_BASE}/projects/${projectId}/fix-queue`);
          if (fixRes.ok) {
            const fixData = await fixRes.json();
            seoIssues = fixData.counts && fixData.counts.open ? fixData.counts.open : 0;
          }
        }
        automations = 'N/A';
        credits = 'N/A';
        lastRun = 'N/A';
        systemHealth = 'N/A';
        setStats({ products, seoIssues, automations, credits, lastRun, systemHealth });
      } catch (e) {
        setStats({ products: '-', seoIssues: '-', automations: '-', credits: '-', lastRun: '-', systemHealth: '-' });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
    intervalId = setInterval(fetchStats, 60000); // refresh every minute
    return () => clearInterval(intervalId);
  }, []);

  const [automationLogs, setAutomationLogs] = useState([]);
  const handleRunAutomation = async () => {
    setRunning(true);
    try {
      const res = await apiFetch('/api/automation/run', { method: 'POST' });
      const data = await res.json();
      setAutomationLogs((logs) => [
        { time: new Date().toLocaleString(), status: data.ok ? 'Success' : 'Error', message: data.message || (data.ok ? 'Automations triggered.' : 'Failed to run automations.') },
        ...logs
      ].slice(0, 10));
    } catch (e) {
      setAutomationLogs((logs) => [
        { time: new Date().toLocaleString(), status: 'Error', message: 'Network or server error.' },
        ...logs
      ].slice(0, 10));
    }
    setRunning(false);
  };

  useEffect(() => {
    async function hydrateIdeas() {
      try {
        const res = await topIdeas(5);
        setIdeas(res.ideas || []);
      } catch (err) {
        console.error("[dashboard] top ideas error", err);
      }
    }
    hydrateIdeas();
  }, []);


  // Live shop/project data only
  const [shop, setShop] = useState(null);
  useEffect(() => {
    async function fetchShop() {
      try {
        const res = await apiFetch('/api/session');
        if (res.ok) {
          const data = await res.json();
          if (data && data.projectDetails) {
            setShop({
              ...data.projectDetails,
              logoUrl: '/shopify-logo.svg',
              integrations: data.shop?.integrations || [],
            });
          } else {
            setShop(null);
          }
        }
      } catch {
        setShop(null);
      }
    }
    fetchShop();
  }, []);

  // Onboarding checklist must be live (remove static example)
  // const onboardingSteps = [...];
  // const completedSteps = ...;
  // const onboardingPercent = ...;

  if (loading) {
    return <div><Spinner /></div>;
  }
  if (stats.products === '-' && stats.seoIssues === '-') {
    return <div><div style={{ color: '#ff4d4f', textAlign: 'center', fontWeight: 700, fontSize: 18, margin: '48px 0' }}>Error loading dashboard data. Please try again.</div></div>;
  }
  if (!shop) {
    return (
      <div className="aura-dashboard-shell">
        <div style={{ color: '#ff4d4f', textAlign: 'center', fontWeight: 700, fontSize: 18, margin: '48px 0' }}>
          Error: No shop data available. Please check your backend or session.
        </div>
      </div>
    );
  }

  const copilotUserId = shop.id || shop.projectId || shop.domain || "dashboard-user";

  const handleCopilotAsk = async () => {
    if (!copilotInput.trim()) return;
    setCopilotLoading(true);
    try {
      const res = await sendCopilotMessage(copilotUserId, copilotInput.trim());
      setCopilotReply(res.reply || "");
      setCopilotInput("");
    } catch (err) {
      setCopilotReply(err.message || "Failed to fetch copilot reply");
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleIdeaSubmit = async () => {
    if (!newIdea.trim()) return;
    try {
      const res = await submitIdea(newIdea.trim());
      setNewIdea("");
      setIdeas((prev) => [{ ...res.idea, votes: 0 }, ...prev].slice(0, 5));
    } catch (err) {
      console.error("[dashboard] submit idea error", err);
    }
  };

  return (
    <div className="aura-dashboard-shell">
      {/* Hero/overview section - visually impactful */}
      <div className="dashboard-hero" style={{
        position: 'relative',
        borderRadius: '28px',
        padding: '56px 48px 40px 48px',
        marginBottom: 44,
        boxShadow: '0 16px 48px #0007',
        background: 'linear-gradient(120deg, #232b3b 70%, #1a1d2e 100%)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: 340,
      }}>
        {/* Subtle background accent */}
        <div style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 220,
          height: 220,
          background: 'radial-gradient(circle, #7fffd4 0%, #232b3b 80%)',
          opacity: 0.08,
          borderRadius: '50%',
          zIndex: 0,
          pointerEvents: 'none',
        }} />
        {/* Title and subtitle */}
        <div style={{ zIndex: 1, textAlign: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 8 }}>
            <img src="/logo-aura.png" alt="AURA Logo" style={{ height: 72, width: 72, objectFit: 'contain', borderRadius: 18, boxShadow: '0 2px 24px #22d3ee33' }} />
            <span style={{ fontWeight: 900, fontSize: 38, color: '#fff', letterSpacing: '-0.02em', textShadow: '0 2px 12px #0008' }}>AURA Systems</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#7fffd4', marginBottom: 6, letterSpacing: '-0.01em', textShadow: '0 2px 12px #0006' }}>Your Store at a Glance</div>
          <div style={{ fontSize: 18, color: '#b3c2e0', fontWeight: 500, marginBottom: 0 }}>Key Metrics & Automations</div>
        </div>
        {/* Project card */}
        <div style={{
          background: 'linear-gradient(120deg, #23263a 60%, #23284a 100%)',
          borderRadius: 22,
          boxShadow: '0 4px 24px #0004',
          padding: '32px 36px',
          minWidth: 340,
          maxWidth: 420,
          margin: '0 auto 18px auto',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <div style={{ fontWeight: 900, fontSize: 26, color: '#7fffd4', marginBottom: 6, textAlign: 'center' }}>{shop.name || 'My Project'}</div>
          <div style={{ color: '#b3c2e0', fontSize: 16, marginBottom: 8, textAlign: 'center' }}>{shop.domain || shop.url || '—'}</div>
          <div style={{ color: '#b3c2e0', fontSize: 15, marginBottom: 18, textAlign: 'center' }}>Platform: <b style={{ color: '#7fffd4' }}>Shopify</b></div>
          <div style={{
            background: '#1f2436',
            borderRadius: 14,
            padding: '14px 16px',
            width: '100%',
            border: '1px solid #2f3650',
            boxShadow: '0 6px 18px #0004',
            marginBottom: 12,
          }}>
            <div style={{ fontWeight: 800, color: '#7fffd4', marginBottom: 8, fontSize: 15 }}>Copilot quick ask</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                placeholder="Ask Aura Copilot about next best actions"
                style={{
                  flex: 1,
                  borderRadius: 10,
                  padding: '10px 12px',
                  border: '1px solid #2f3650',
                  background: '#0f1324',
                  color: '#e8f2ff',
                  fontSize: 14,
                }}
              />
              <button
                onClick={handleCopilotAsk}
                disabled={copilotLoading}
                style={{
                  background: copilotLoading ? '#3a3f55' : '#7fffd4',
                  color: '#0f1324',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 800,
                  padding: '10px 14px',
                  cursor: copilotLoading ? 'wait' : 'pointer',
                  minWidth: 92,
                }}
              >
                {copilotLoading ? 'Thinking…' : 'Ask'}
              </button>
            </div>
            {copilotReply && (
              <div style={{ marginTop: 10, color: '#dce8ff', fontSize: 14, lineHeight: 1.5 }}>
                {copilotReply}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ background: '#7fffd4', color: '#23263a', fontWeight: 900, fontSize: 17, borderRadius: 12, padding: '4px 18px', letterSpacing: '0.01em', boxShadow: '0 2px 8px #22d3ee33' }}>Shopify</span>
            <span style={{ background: '#22d37f', color: '#fff', fontWeight: 800, fontSize: 15, borderRadius: 10, padding: '4px 14px', marginLeft: 6, boxShadow: '0 2px 8px #22d37f33' }}>Active</span>
          </div>
          <div style={{ color: '#b3c2e0', fontSize: 14, marginBottom: 2 }}>Created: <span style={{ color: '#fff', fontWeight: 700 }}>{shop.createdAt || '—'}</span></div>
          <div style={{ color: '#b3c2e0', fontSize: 14 }}>Updated: <span style={{ color: '#fff', fontWeight: 700 }}>{shop.updatedAt || '—'}</span></div>
        </div>
        {/* Quick links */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10, zIndex: 1 }}>
          <button className="quick-link-btn" onClick={() => setActiveSection && setActiveSection('products')} title="View all products">Products</button>
          <button className="quick-link-btn" onClick={() => setActiveSection && setActiveSection('content-health')} title="View content health">Content Health</button>
          <button className="quick-link-btn" onClick={() => setActiveSection && setActiveSection('fix-queue')} title="View fix queue">Fix Queue</button>
          <button className="quick-link-btn" onClick={() => setActiveSection && setActiveSection('tools')} title="View all tools">Tools</button>
          <button className="quick-link-btn" onClick={handleRunAutomation} disabled={running} title="Run all automations">{running ? 'Running automations...' : 'Run All Automations'}</button>
        </div>
      </div>
      {/* Integration health panel */}
      <IntegrationHealthPanel />
      {/* Notifications panel */}
      <NotificationsPanel />
      {/* Analytics panel */}
      <AnalyticsPanel />
      {/* Metrics row */}
      {/* Automation logs panel */}
      <div className="automation-logs-panel" style={{
        background: '#232b3b',
        borderRadius: 12,
        padding: '18px 32px',
        marginBottom: 32,
        boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
        maxWidth: 540,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        <div style={{fontWeight:700,fontSize:16,color:'#7fffd4',marginBottom:8}}>Automation Logs</div>
        {automationLogs.length === 0 ? (
          <div style={{color:'#9ca3c7'}}>No recent automation runs.</div>
        ) : (
          <ul style={{listStyle:'none',padding:0,margin:0}}>
            {automationLogs.map((log, idx) => (
              <li key={idx} style={{marginBottom:6,color:log.status==='Error'?'#ff4d4f':'#7fffd4'}}>
                <b>[{log.time}]</b> {log.status}: {log.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="aura-card" style={{ padding: 20, borderRadius: 18, background: '#0f1324', border: '1px solid #1f2436', boxShadow: '0 12px 32px #0006', marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#e8f2ff' }}>HITL ideas</div>
          <div style={{ color: '#7fffd4', fontWeight: 700, fontSize: 13 }}>Crowd-sourced improvements</div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <input
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            placeholder="Propose a workflow or automation idea"
            style={{
              flex: 1,
              borderRadius: 10,
              padding: '10px 12px',
              border: '1px solid #2f3650',
              background: '#0f1324',
              color: '#e8f2ff',
              fontSize: 14,
            }}
          />
          <button
            onClick={handleIdeaSubmit}
            style={{
              background: '#7fffd4',
              color: '#0f1324',
              border: 'none',
              borderRadius: 10,
              fontWeight: 800,
              padding: '10px 14px',
              cursor: 'pointer',
              minWidth: 92,
            }}
          >Submit</button>
        </div>
        {ideas.length === 0 ? (
          <div style={{ color: '#9fb1d6', fontSize: 14 }}>No ideas yet. Be the first to suggest one.</div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {ideas.map((idea) => (
              <div key={idea.id} style={{
                background: '#11162a',
                border: '1px solid #1f2436',
                borderRadius: 12,
                padding: '10px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ color: '#e8f2ff', fontSize: 14, marginRight: 8 }}>{idea.text}</div>
                <div style={{ color: '#7fffd4', fontWeight: 800, fontSize: 13 }}>▲ {idea.votes ?? 0}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="aura-dashboard-stats" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 24,
        marginBottom: 40,
        width: '100%',
      }}>
        {[ 
          { label: 'Products', value: loading ? '' : stats.products },
          { label: 'SEO Issues', value: loading ? '' : stats.seoIssues },
          { label: 'Automations', value: loading ? '' : stats.automations },
          { label: 'Credits', value: loading ? '' : stats.credits },
          { label: 'Last Run', value: loading ? '' : (stats.lastRun ? new Date(stats.lastRun).toLocaleString() : '') },
          { label: 'System Health', value: loading ? '' : stats.systemHealth },
        ].map((stat, idx) => (
          <div
            key={stat.label}
            className="aura-dashboard-stat metric-card crisp-metric-card"
            tabIndex={0}
            aria-label={stat.label + ': ' + stat.value}
            style={{
              background: '#232b3b',
              borderRadius: '18px',
              boxShadow: '0 6px 28px rgba(0,0,0,0.10)',
              padding: '32px 22px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.18s, box-shadow 0.18s, background 0.18s',
              cursor: 'pointer',
              animation: `fadeInUp 0.7s cubic-bezier(.23,1.01,.32,1) both`,
            }}
          >
            <span style={{fontSize: '1.13em', color: '#f3f4f6', fontWeight: 800, letterSpacing: '0.01em', marginBottom: 8 }}>{stat.label}</span>
            <b style={{fontSize: '1.7em', fontWeight: 900, color: '#f3f4f6', letterSpacing: '0.01em'}}>{stat.value}</b>
          </div>
        ))}
      </div>
      {/* Charts and trends */}
      <Suspense fallback={<Spinner />}>
        <DashboardCharts />
      </Suspense>
      <div className="aura-dashboard-note" style={{
        marginTop: 36,
        background: '#181f2a',
        color: '#f3f4f6',
        borderRadius: 12,
        padding: '18px 32px',
        fontWeight: 700,
        fontSize: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
        textAlign: 'center',
        letterSpacing: '0.01em',
        maxWidth: 540,
        marginLeft: 'auto',
        marginRight: 'auto',
        animation: 'fadeIn 1.1s cubic-bezier(.23,1.01,.32,1) both',
      }}>
        Note: Data updates every 24 hours.
      </div>

      {/* User management panel (admin only) */}
      <Suspense fallback={<Spinner />}>
        <UserManagement />
      </Suspense>
    </div>
  );
};

export default Dashboard;
