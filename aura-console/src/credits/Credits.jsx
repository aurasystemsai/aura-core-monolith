import React, { useState } from 'react';
import './Credits.css';

const Credits = () => {
  // Placeholder state for credits and usage
  const [credits, setCredits] = useState(120);
  const [used, setUsed] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBuyCredits = () => {
    setLoading(true);
    setError('');
    // Simulate purchase
    setTimeout(() => {
      setCredits(c => c + 100);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="aura-credits-shell">
      <h2 className="aura-credits-title">Credits & Usage</h2>
      <div className="aura-credits-balance">
        <span className="aura-credits-label">Current Credits:</span>
        <span className="aura-credits-value">{credits}</span>
      </div>
      <div className="aura-credits-usage">
        <span className="aura-credits-label">Used this month:</span>
        <span className="aura-credits-value aura-credits-used">{used}</span>
      </div>
      <div className="aura-credits-progress">
        <div className="aura-credits-bar-bg">
          <div className="aura-credits-bar" style={{ width: `${Math.min(100, (used / (credits + used)) * 100)}%` }} />
        </div>
        <span className="aura-credits-bar-label">{used + credits} total</span>
      </div>
      <button className="aura-credits-btn" onClick={handleBuyCredits} disabled={loading}>
        {loading ? 'Processing…' : 'Buy 100 More Credits'}
      </button>
      {error && <div className="aura-credits-error">{error}</div>}
      <div className="aura-credits-note">Credits are used for AI-powered SEO, content, and automation. Usage resets monthly.</div>
    </div>
  );
};

export default Credits;
