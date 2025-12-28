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

      <div className="aura-credits-pricing" style={{margin:'28px 0 12px',padding:'18px 18px 12px',background:'#232b3b',borderRadius:14}}>
        <div style={{fontWeight:700,fontSize:17,marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
          Credit Pricing & Usage
          <span className="credits-guide" title="How much credits cost and what you can do with them">🛈</span>
        </div>
        <div style={{fontSize:15,marginBottom:10}}>
          <b>100 credits = $10 USD</b> (one-time, no auto-renew).<br/>
          <span style={{color:'#7fffd4'}}>You only pay for what you use.</span>
        </div>
        <table style={{width:'100%',fontSize:14,background:'none',borderCollapse:'collapse',marginBottom:8}}>
          <thead>
            <tr style={{color:'#7fffd4',textAlign:'left'}}>
              <th style={{padding:'4px 8px'}}>Feature/Action</th>
              <th style={{padding:'4px 8px'}}>Credits Used</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={{padding:'4px 8px'}}>SEO Analysis (per product/page)</td><td style={{padding:'4px 8px'}}>1</td></tr>
            <tr><td style={{padding:'4px 8px'}}>AI Blog Draft (per draft)</td><td style={{padding:'4px 8px'}}>3</td></tr>
            <tr><td style={{padding:'4px 8px'}}>Image Alt-Text (per image)</td><td style={{padding:'4px 8px'}}>0.5</td></tr>
            <tr><td style={{padding:'4px 8px'}}>Internal Link Suggestion</td><td style={{padding:'4px 8px'}}>1</td></tr>
            <tr><td style={{padding:'4px 8px'}}>Other AI/automation</td><td style={{padding:'4px 8px'}}>Varies (see tool)</td></tr>
          </tbody>
        </table>
        <div style={{fontSize:13,opacity:0.85}}>
          <b>Tip:</b> You can always see how many credits an action will use before confirming.<br/>
          <span style={{color:'#7fffd4'}}>No hidden fees. No subscriptions. Credits never expire.</span>
        </div>
      </div>

      <div className="aura-credits-note">You can buy more credits at any time. <span className="credits-guide" title="Credits are only used when you run automations or AI tools. You’ll always see your balance here.">🛈</span> Credits are used for automation and AI-powered features.</div>
    </div>
  );
};

export default Credits;
