

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
      <ShopInfoPanel shop={shop} />
      <h2 className="aura-dashboard-title">Dashboard Overview</h2>
      <div className="aura-dashboard-stats">
        <div className="aura-dashboard-stat"><span>Products:</span> <b>{loading ? '…' : stats.products}</b></div>
        <div className="aura-dashboard-stat"><span>SEO Issues:</span> <b>{loading ? '…' : stats.seoIssues}</b></div>
        <div className="aura-dashboard-stat"><span>Automations:</span> <b>{loading ? '…' : stats.automations}</b></div>
        <div className="aura-dashboard-stat"><span>Credits:</span> <b>{loading ? '…' : stats.credits}</b></div>
        <div className="aura-dashboard-stat"><span>Last Run:</span> <b>{loading ? '…' : (stats.lastRun ? new Date(stats.lastRun).toLocaleString() : '-')}</b></div>
        <div className="aura-dashboard-stat"><span>System Health:</span> <b className={stats.systemHealth === 'Good' ? 'aura-health-good' : 'aura-health-bad'}>{loading ? '…' : stats.systemHealth}</b></div>
      </div>
      <DashboardCharts />
      <div className="dashboard-quick-links">
        <button className="quick-link-btn" onClick={() => setActiveSection && setActiveSection('tools')}>
          🛠️ Tools
        </button>
        <button className="quick-link-btn" onClick={() => setActiveSection && setActiveSection('products')}>
          📦 Products
        </button>
        <button className="quick-link-btn" onClick={() => setActiveSection && setActiveSection('content-health')}>
          🩺 Content Health
        </button>
        <button className="quick-link-btn" onClick={() => setActiveSection && setActiveSection('fix-queue')}>
          🛠️ Fix Queue
        </button>
        <button className="quick-link-btn" onClick={handleRunAutomation} disabled={running}>
          {running ? 'Running Automations…' : 'Run All Automations'}
        </button>
      </div>
      <div className="aura-dashboard-note">Automations help keep your products optimized and your store healthy. System health is monitored in real time.</div>
    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect } from "react";
import React, { useState, useEffect } from "react";
