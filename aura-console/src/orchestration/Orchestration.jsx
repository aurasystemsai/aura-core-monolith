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
      <h2 className="aura-orchestration-title" title="Automate and manage your store's key processes">Workflow Orchestration
        <span style={{
          display: 'inline-block',
          marginLeft: 8,
          fontSize: 18,
          color: '#6366f1',
          cursor: 'help',
        }}
        title="This panel lets you automate, pause, or resume key workflows that keep your store running smoothly. Hover each item for details.">
          
        </span>
      </h2>
      <div className="aura-orchestration-list">
        {workflows.map(w => (
          <div key={w.id} className="aura-orchestration-item" title={`Workflow: ${w.name}. Status: ${w.status === 'active' ? 'Active (running)' : 'Paused (not running)'}. Click the button to ${w.status === 'active' ? 'pause' : 'activate'} this workflow.`}>
            <span className="aura-orchestration-name" title="The name of the automated workflow.">{w.name}</span>
            <span
              className={w.status === 'active' ? 'aura-orchestration-status aura-status-active' : 'aura-orchestration-status aura-status-paused'}
              title={w.status === 'active' ? 'This workflow is currently running and automating tasks.' : 'This workflow is paused and not running.'}
            >
              {w.status === 'active' ? 'Active' : 'Paused'}
            </span>
            <button
              className="aura-orchestration-btn"
              onClick={() => toggleWorkflow(w.id)}
              disabled={loading}
              title={w.status === 'active' ? 'Pause this workflow. It will stop automating tasks until re-activated.' : 'Activate this workflow to start automating tasks.'}
            >
              {loading ? 'Updating…' : w.status === 'active' ? 'Pause' : 'Activate'}
            </button>
          </div>
        ))}
      </div>
      <div className="aura-orchestration-note" title="Workflows are automated processes that help keep your store optimized. You can pause or activate them at any time.">
        <strong>Tip:</strong>Workflows are automated processes (like SEO fixes or product syncs) that run in the background. Use the buttons to pause or activate each one. Hover any label or button for a quick explanation.
      </div>
    </div>
  );
};

export default Orchestration;
