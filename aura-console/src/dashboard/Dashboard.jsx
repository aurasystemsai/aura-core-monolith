

import React, { useState, useEffect, Suspense, lazy } from "react";
const DashboardCharts = lazy(() => import('./DashboardCharts'));
const ShopInfoPanel = lazy(() => import('../components/ShopInfoPanel'));

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

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        // Example: Replace with your actual endpoints and logic
        // Fetch product count
        const projectId = localStorage.getItem('auraProjectId');
        let products = null, seoIssues = null, automations = null, credits = null, lastRun = null, systemHealth = null;

        // Products count (replace endpoint as needed)
        if (projectId) {
          const prodRes = await fetch(`${API_BASE}/projects/${projectId}/drafts`);
          if (prodRes.ok) {
            const prodData = await prodRes.json();
            products = Array.isArray(prodData) ? prodData.length : (prodData.items ? prodData.items.length : null);
          }

          // SEO Issues (fix queue open issues)
          const fixRes = await fetch(`${API_BASE}/projects/${projectId}/fix-queue`);
          if (fixRes.ok) {
            const fixData = await fixRes.json();
            seoIssues = fixData.counts && fixData.counts.open ? fixData.counts.open : 0;
          }

          // Automations (placeholder, set to 5 or fetch real value if available)
          automations = 5;

          // Credits (placeholder, set to 120 or fetch real value if available)
          credits = 120;

          // Last run (placeholder, set to now or fetch real value if available)
          lastRun = new Date().toISOString();

          // System health (placeholder, set to 'Good' or fetch real value if available)
          systemHealth = 'Good';
        }

        setStats({ products, seoIssues, automations, credits, lastRun, systemHealth });
      } catch (e) {
        setStats({ products: '-', seoIssues: '-', automations: '-', credits: '-', lastRun: '-', systemHealth: '-' });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const handleRunAutomation = () => {
    setRunning(true);
    setTimeout(() => setRunning(false), 1500);
  };

  // Placeholder shop data (replace with real shop info as needed)
  const shop = {
    name: localStorage.getItem('auraProjectName') || 'Demo Store',
    domain: localStorage.getItem('auraProjectDomain') || 'demo.myshopify.com',
    plan: 'Shopify Plus',
    status: 'Active',
    logoUrl: '/shopify-logo.svg',
    integrations: ['Shopify', 'Klaviyo', 'Zapier'],
  };

  if (loading) {
    return <Spinner />;
  }
  if (stats.products === '-' && stats.seoIssues === '-') {
    return <div style={{ color: '#ff4d4f', textAlign: 'center', fontWeight: 700, fontSize: 18, margin: '48px 0' }}>Error loading dashboard data. Please try again.</div>;
  }
  return (
    <div className="aura-dashboard-shell">
      {/* Hero/overview section - visually impactful */}
      <div className="dashboard-hero" style={{
        position: 'relative',
        borderRadius: '24px',
        padding: '56px 48px 40px 48px',
        marginBottom: 40,
        boxShadow: '0 12px 48px rgba(0,0,0,0.13)',
        display: 'flex',
        alignItems: 'center',
        gap: 48,
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        overflow: 'hidden',
        background: '#232b3b',
      }}>
        {/* Removed animated background circles for clean look */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',flex:1,minWidth:260,zIndex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:18,marginBottom:12}}>
            <img src="/logo-aura.png" alt="AURA Logo" style={{height:64,width:64,objectFit:'contain',borderRadius:16,boxShadow:'0 2px 24px rgba(0,0,0,0.13)'}} />
            <span style={{fontWeight:900,fontSize:32,color:'#f3f4f6',letterSpacing:'-0.02em'}}>AURA Systems</span>
          </div>
          <div style={{fontSize: 24, color: '#f3f4f6', marginBottom: 18, fontWeight: 700}}>
            Your Store at a Glance
          </div>
          <div style={{fontSize: 16, color: '#9ca3c7', marginBottom: 24, maxWidth: 480}}>
            Key Metrics
            <br />
            <span style={{color:'#f3f4f6'}}>Automate and Optimize</span>
          </div>
          <div style={{display: 'flex', gap: 16, flexWrap: 'wrap'}}>
            <button className="quick-link-btn" onClick={() => setActiveSection && setActiveSection('products')} title="View all products">Products</button>
            <button className="quick-link-btn" onClick={() => setActiveSection && setActiveSection('content-health')} title="View content health">Content Health</button>
            <button className="quick-link-btn" onClick={() => setActiveSection && setActiveSection('fix-queue')} title="View fix queue">Fix Queue</button>
            <button className="quick-link-btn" onClick={() => setActiveSection && setActiveSection('tools')} title="View all tools">Tools</button>
            <button className="quick-link-btn" onClick={handleRunAutomation} disabled={running} title="Run all automations">
              {running ? 'Running automations...' : 'Run All Automations'}
            </button>
          </div>
        </div>
        <div style={{minWidth: 260, maxWidth: 340, zIndex:1}}>
          <Suspense fallback={<Spinner />}>
            <ShopInfoPanel shop={shop} />
          </Suspense>
        </div>
      </div>
      {/* Metrics row */}
      <div className="aura-dashboard-stats" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 24,
        marginBottom: 40,
        width: '100%',
      }}>
        {[
          { label: 'Products', value: loading ? '…' : stats.products },
          { label: 'SEO Issues', value: loading ? '…' : stats.seoIssues },
          { label: 'Automations', value: loading ? '…' : stats.automations },
          { label: 'Credits', value: loading ? '…' : stats.credits },
          { label: 'Last Run', value: loading ? '…' : (stats.lastRun ? new Date(stats.lastRun).toLocaleString() : '-') },
          { label: 'System Health', value: loading ? '…' : stats.systemHealth },
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
    </div>
  );
};

export default Dashboard;
