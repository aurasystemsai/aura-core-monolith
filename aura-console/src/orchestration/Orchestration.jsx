import React, { useState } from 'react';
import './Orchestration.css';

const initialWorkflows = [
  { id: 1, name: 'SEO Fix Queue', status: 'active' },
  { id: 2, name: 'Content Health Audit', status: 'paused' },
  { id: 3, name: 'Product Sync', status: 'active' },
];

const Orchestration = () => {
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [loading, setLoading] = useState(false);

  const toggleWorkflow = id => {
    setLoading(true);
    setTimeout(() => {
      setWorkflows(ws => ws.map(w => w.id === id ? { ...w, status: w.status === 'active' ? 'paused' : 'active' } : w));
      setLoading(false);
    }, 900);
  };

  return (
    <div className="aura-orchestration-shell">
      <h2 className="aura-orchestration-title">Workflow Orchestration</h2>
      <div className="aura-orchestration-list">
        {workflows.map(w => (
          <div key={w.id} className="aura-orchestration-item">
            <span className="aura-orchestration-name">{w.name}</span>
            <span className={w.status === 'active' ? 'aura-orchestration-status aura-status-active' : 'aura-orchestration-status aura-status-paused'}>
              {w.status === 'active' ? 'Active' : 'Paused'}
            </span>
            <button className="aura-orchestration-btn" onClick={() => toggleWorkflow(w.id)} disabled={loading}>
              {loading ? 'Updating…' : w.status === 'active' ? 'Pause' : 'Activate'}
            </button>
          </div>
        ))}
      </div>
      <div className="aura-orchestration-note">Manage automated workflows and triggers to keep your store optimized and healthy.</div>
    </div>
  );
};

export default Orchestration;
