import React, { useState } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  // Placeholder stats
  const [stats] = useState({
    products: 128,
    seoIssues: 37,
    automations: 5,
    credits: 120,
    lastRun: '2025-12-25T18:30:00Z',
    systemHealth: 'Good',
  });
  const [running, setRunning] = useState(false);

  const handleRunAutomation = () => {
    setRunning(true);
    setTimeout(() => setRunning(false), 1500);
  };

  return (
    <div className="aura-dashboard-shell">
      <h2 className="aura-dashboard-title">Dashboard Overview</h2>
      <div className="aura-dashboard-stats">
        <div className="aura-dashboard-stat"><span>Products:</span> <b>{stats.products}</b></div>
        <div className="aura-dashboard-stat"><span>SEO Issues:</span> <b>{stats.seoIssues}</b></div>
        <div className="aura-dashboard-stat"><span>Automations:</span> <b>{stats.automations}</b></div>
        <div className="aura-dashboard-stat"><span>Credits:</span> <b>{stats.credits}</b></div>
        <div className="aura-dashboard-stat"><span>Last Run:</span> <b>{new Date(stats.lastRun).toLocaleString()}</b></div>
        <div className="aura-dashboard-stat"><span>System Health:</span> <b className={stats.systemHealth === 'Good' ? 'aura-health-good' : 'aura-health-bad'}>{stats.systemHealth}</b></div>
      </div>
      <div className="aura-dashboard-actions">
        <button className="aura-dashboard-btn" onClick={handleRunAutomation} disabled={running}>
          {running ? 'Running Automations…' : 'Run All Automations'}
        </button>
      </div>
      <div className="aura-dashboard-note">Automations help keep your products optimized and your store healthy. System health is monitored in real time.</div>
    </div>
  );
};

export default Dashboard;
