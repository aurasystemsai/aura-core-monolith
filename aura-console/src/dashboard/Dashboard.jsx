

import DashboardCharts from './DashboardCharts';
import ShopInfoPanel from '../components/ShopInfoPanel';
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

  return (
    <div className="aura-dashboard-shell">
      {/* Hero/overview section - visually impactful */}
      <div className="dashboard-hero" style={{
        position: 'relative',
        borderRadius: '24px',
        padding: '56px 48px 40px 48px',
        marginBottom: 40,
        boxShadow: '0 12px 48px #0005',
        display: 'flex',
        alignItems: 'center',
        gap: 48,
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        overflow: 'hidden',
        background: 'linear-gradient(120deg, #23263a 60%, #7fffd4 100%)',
      }}>
        {/* Animated background circles */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          left: '-80px',
          width: '220px',
          height: '220px',
          background: 'radial-gradient(circle, #7fffd4 0%, #23263a 80%)',
          opacity: 0.18,
          borderRadius: '50%',
          zIndex: 0,
          animation: 'pulse 4s infinite',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-60px',
          right: '-60px',
          width: '160px',
          height: '160px',
          background: 'radial-gradient(circle, #22d3ee 0%, #23263a 80%)',
          opacity: 0.14,
          borderRadius: '50%',
          zIndex: 0,
          animation: 'pulse 5s infinite',
        }} />
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',flex:1,minWidth:260,zIndex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:18,marginBottom:12}}>
            <img src="/logo-aura.png" alt="AURA Logo" style={{height:64,width:64,objectFit:'contain',borderRadius:16,boxShadow:'0 2px 24px #7fffd455'}} />
            <span style={{fontWeight:900,fontSize:32,color:'#7fffd4',letterSpacing:'-0.02em',textShadow:'0 2px 16px #0006'}}>AURA Systems</span>
          </div>
          <div style={{fontSize: 24, color: '#fff', marginBottom: 18, fontWeight: 700, textShadow:'0 2px 12px #23263a'}}>
            Build Automated Systems That Run Your Business For You
          </div>
          <div style={{fontSize: 16, color: '#cbd5f5', marginBottom: 24, maxWidth: 480}}>
            AI-powered workflows that eliminate manual work and scale your revenue automatically. <br />
            <span style={{color:'#7fffd4'}}>World-class automation for e-commerce.</span>
          </div>
          <div style={{display: 'flex', gap: 16, flexWrap: 'wrap'}}>
            <button className="quick-link-btn" onClick={() => setActiveSection && setActiveSection('products')}>📦 Products</button>
            <button className="quick-link-btn" onClick={() => setActiveSection && setActiveSection('content-health')}>🩺 Content Health</button>
            <button className="quick-link-btn" onClick={() => setActiveSection && setActiveSection('fix-queue')}>🛠️ Fix Queue</button>
            <button className="quick-link-btn" onClick={() => setActiveSection && setActiveSection('tools')}>⚡ Tools</button>
            <button className="quick-link-btn" onClick={handleRunAutomation} disabled={running}>
              {running ? 'Running Automations…' : 'Run All Automations'}
            </button>
          </div>
        </div>
        <div style={{minWidth: 260, maxWidth: 340, zIndex:1}}>
          <ShopInfoPanel shop={shop} />
        </div>
      </div>
      {/* Metrics row */}
      <div className="aura-dashboard-stats" style={{display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 32}}>
        <div className="aura-dashboard-stat"><span>Products</span><b>{loading ? '…' : stats.products}</b></div>
        <div className="aura-dashboard-stat"><span>SEO Issues</span><b>{loading ? '…' : stats.seoIssues}</b></div>
        <div className="aura-dashboard-stat"><span>Automations</span><b>{loading ? '…' : stats.automations}</b></div>
        <div className="aura-dashboard-stat"><span>Credits</span><b>{loading ? '…' : stats.credits}</b></div>
        <div className="aura-dashboard-stat"><span>Last Run</span><b>{loading ? '…' : (stats.lastRun ? new Date(stats.lastRun).toLocaleString() : '-')}</b></div>
        <div className="aura-dashboard-stat"><span>System Health</span><b className={stats.systemHealth === 'Good' ? 'aura-health-good' : 'aura-health-bad'}>{loading ? '…' : stats.systemHealth}</b></div>
      </div>
      {/* Charts and trends */}
      <DashboardCharts />
      <div className="aura-dashboard-note" style={{marginTop: 32}}>Automations help keep your products optimized and your store healthy. System health is monitored in real time.</div>
    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect } from "react";
