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
    <div className="credits-card">
      <h2 className="credits-title">Credits <span className="credits-guide" title="Credits are used to run automations and AI-powered features. You can always buy more if you run low.">🛈</span></h2>
      <div className="aura-credits-balance">
        <span className="aura-credits-label">Current Credits <span className="credits-guide" title="This is how many credits you have left to use for automations and AI tools.">🛈</span></span>
        <span className="aura-credits-value">{credits}</span>
      </div>
      <div className="aura-credits-usage">
        <span className="aura-credits-label">Used This Month <span className="credits-guide" title="How many credits you’ve spent this month. Each automation or AI action uses a small number of credits.">🛈</span></span>
        <span className="aura-credits-value aura-credits-used">{used}</span>
      </div>
      <div className="aura-credits-progress">
        <div className="aura-credits-bar-bg">
          <div className="aura-credits-bar" style={{ width: `${Math.min(100, (used / (credits + used)) * 100)}%` }} />
        </div>
        <span className="aura-credits-bar-label">Total Credits: {used + credits} <span className="credits-guide" title="Total credits is your current plus used. You can always top up.">🛈</span></span>
      </div>
      <button className="credits-btn" onClick={handleBuyCredits} disabled={loading} title="Buy more credits to keep using all features. You’ll never be charged automatically.">
        {loading ? 'Processing...' : 'Buy 100 Credits'}
      </button>
      {error && <div className="aura-credits-error">{error}</div>}
      <div className="aura-credits-note">You can buy more credits at any time. <span className="credits-guide" title="Credits are only used when you run automations or AI tools. You’ll always see your balance here.">🛈</span> Credits are used for automation and AI-powered features.</div>
    </div>
  );
};

export default Credits;
