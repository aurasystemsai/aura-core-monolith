import React, { useState, useEffect, Suspense, lazy } from "react";
import { apiFetch } from "../api";
import { sendCopilotMessage } from "../core/advancedAiClient";
import IntegrationHealthPanel from "../components/IntegrationHealthPanel";
const DashboardCharts = lazy(() => import('./DashboardCharts'));

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
      <div style={{
        width: 38,
        height: 38,
        border: '4px solid #7fffd4',
        borderTop: '4px solid #0a0a0a',
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
  });
  const [loading, setLoading] = useState(true);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotReply, setCopilotReply] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [shop, setShop] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const projectId = localStorage.getItem('auraProjectId');
        let products = null, seoIssues = null;
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
        setStats({ products, seoIssues });
      } catch (e) {
        setStats({ products: '—', seoIssues: '—' });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    async function fetchShop() {
      try {
        const res = await apiFetch('/api/session');
        if (res.ok) {
          const data = await res.json();
          if (data && data.projectDetails) {
            setShop(data.projectDetails);
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

  if (loading) {
    return <div><Spinner /></div>;
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

  const copilotUserId = shop.id || shop.domain || "dashboard-user";

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

  return (
    <div className="aura-dashboard-shell">
      {/* Hero section */}
      <div className="dashboard-hero" style={{
        borderRadius: '20px',
        padding: '40px 32px',
        marginBottom: 32,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        background: 'linear-gradient(120deg, #111111 70%, #111111 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <img src="/logo-aura.png" alt="AURA Logo" style={{ height: 56, width: 56, objectFit: 'contain', borderRadius: 12 }} />
          <div>
            <div style={{ fontWeight: 900, fontSize: 28, color: '#fff', letterSpacing: '-0.02em' }}>AURA Dashboard</div>
            <div style={{ fontSize: 16, color: '#b3c2e0', fontWeight: 500 }}>{shop.name || 'My Store'}</div>
          </div>
        </div>

        <div style={{
          background: '#1f2436',
          borderRadius: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          padding: '24px',
          border: '1px solid #1e1e1e',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ color: '#9ca3c7', fontSize: 13, marginBottom: 4 }}>Store</div>
              <div style={{ color: '#e8f2ff', fontWeight: 700, fontSize: 18 }}>{shop.domain || '—'}</div>
            </div>
            <span style={{ background: '#22d37f', color: '#fff', fontWeight: 700, fontSize: 13, borderRadius: 8, padding: '4px 12px' }}>Active</span>
          </div>

          <div style={{
            background: '#0f1324',
            borderRadius: 12,
            padding: '16px',
            border: '1px solid #1e1e1e',
          }}>
            <div style={{ fontWeight: 700, color: '#7fffd4', marginBottom: 12, fontSize: 15 }}>Ask AI Copilot</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                placeholder="Ask Aura Copilot about next best actions"
                onKeyPress={(e) => e.key === 'Enter' && handleCopilotAsk()}
                style={{
                  flex: 1,
                  borderRadius: 10,
                  padding: '10px 12px',
                  border: '1px solid #1e1e1e',
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

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button 
              onClick={() => setActiveSection && setActiveSection('products')} 
              style={{
                flex: 1,
                background: '#7fffd4',
                color: '#0f1324',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Products
            </button>
            <button 
              onClick={() => setActiveSection && setActiveSection('tools')} 
              style={{
                flex: 1,
                background: '#1e1e1e',
                color: '#e8f2ff',
                border: '1px solid #3a4565',
                borderRadius: 8,
                fontWeight: 700,
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Tools
            </button>
          </div>
        </div>
      </div>

      {/* Integration health */}
      <IntegrationHealthPanel />

      {/* Key metrics */}
      <div className="aura-dashboard-stats" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 20,
        marginBottom: 32,
        marginTop: 32,
      }}>
        {[ 
          { label: 'Products', value: loading ? '...' : (stats.products !== null ? stats.products : '—') },
          { label: 'SEO Issues', value: loading ? '...' : (stats.seoIssues !== null ? stats.seoIssues : '—') },
        ].map((stat) => (
          <div
            key={stat.label}
            className="aura-dashboard-stat"
            style={{
              background: '#111111',
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <span style={{fontSize: '14px', color: '#9ca3c7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</span>
            <b style={{fontSize: '32px', fontWeight: 900, color: '#e8f2ff'}}>{stat.value}</b>
          </div>
        ))}
      </div>

      {/* Charts */}
      <Suspense fallback={<Spinner />}>
        <DashboardCharts />
      </Suspense>
    </div>
  );
};

export default Dashboard;

