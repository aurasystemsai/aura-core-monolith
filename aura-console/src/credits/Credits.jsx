﻿import React, { useState } from 'react';
import './Credits.css';

const Credits = () => {
  // Live state for credits and usage
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
      <h2 className="credits-title">Credits <span className="credits-guide" title="Credits are used to run automations and AI-powered features. You can always buy more if you run low."></span></h2>
      <div className="aura-credits-balance">
        <span className="aura-credits-label">Current Credits <span className="credits-guide" title="This is how many credits you have left to use for automations and AI tools."></span></span>
        <span className="aura-credits-value">{credits}</span>
      </div>
      <div className="aura-credits-usage">
        <span className="aura-credits-label">Used This Month <span className="credits-guide" title="How many credits you’ve spent this month. Each automation or AI action uses a small number of credits."></span></span>
        <span className="aura-credits-value aura-credits-used">{used}</span>
      </div>
      <div className="aura-credits-progress">
        <div className="aura-credits-bar-bg">
          <div className="aura-credits-bar" style={{ width: `${Math.min(100, (used / (credits + used)) * 100)}%` }} />
        </div>
        <span className="aura-credits-bar-label">Total Credits: {used + credits} <span className="credits-guide" title="Total credits is your current plus used. You can always top up."></span></span>
      </div>
      <button className="credits-btn" onClick={handleBuyCredits} disabled={loading} title="Buy more credits to keep using all features. You’ll never be charged automatically.">
        {loading ? 'Processing...' : 'Buy 100 Credits'}
      </button>
      {error && <div className="aura-credits-error">{error}</div>}

      <div className="aura-credits-pricing" style={{margin:'28px 0 12px',padding:'18px 18px 12px',background:'#252638',borderRadius:14}}>
        <div style={{fontWeight:700,fontSize:17,marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
          Credit Pricing & Usage
          <span className="credits-guide" title="How much credits cost and what you can do with them"></span>
        </div>
        <div style={{fontSize:15,marginBottom:10}}>
          <b>Credit Bundles:</b><br/>
          <ul style={{margin:'8px 0 0 18px',padding:0,fontSize:15}}>
            <li><b>100 credits</b> = <b>$10 USD</b></li>
            <li><b>250 credits</b> = <b>$22 USD</b> <span style={{color:'#6366f1'}}>(save 12%)</span></li>
            <li><b>500 credits</b> = <b>$40 USD</b> <span style={{color:'#6366f1'}}>(save 20%)</span></li>
            <li><b>1000 credits</b> = <b>$75 USD</b> <span style={{color:'#6366f1'}}>(save 25%)</span></li>
          </ul>
          <span style={{color:'#6366f1'}}>No pay-as-you-go. Try the free tier or upgrade for more power.</span>
        </div>

        <div style={{background:'#252638',borderRadius:10,padding:'22px 22px 18px',margin:'22px 0 0',fontSize:15,boxShadow:'0 4px 32px #0004'}}>
          <div style={{fontWeight:700,fontSize:16,marginBottom:8,color:'#6366f1'}}>Need more credits or advanced features?</div>
          <div style={{fontSize:14,margin:'0 0 18px',color:'#fff'}}>Explore all plans and features below. No pay-as-you-go—just a free tier to try, and simple subscriptions when you’re ready for more.</div>
          <b>Plans & Features</b>
          <table style={{width:'100%',fontSize:15,background:'none',borderCollapse:'collapse',margin:'12px 0 10px'}}>
            <thead>
              <tr style={{color:'#6366f1',textAlign:'left'}}>
                <th style={{padding:'4px 8px'}}>Plan</th>
                <th style={{padding:'4px 8px'}}>Price/mo</th>
                <th style={{padding:'4px 8px'}}>Credits/mo</th>
                <th style={{padding:'4px 8px'}}>Best for</th>
                <th style={{padding:'4px 8px'}}>Key Features</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{background:'rgba(127,255,212,0.05)',opacity:0.8}}>
                <td style={{padding:'4px 8px'}}><b>Basic (Free)</b></td>
                <td style={{padding:'4px 8px'}}>Free</td>
                <td style={{padding:'4px 8px'}}>100</td>
                <td style={{padding:'4px 8px'}}>Evaluation & onboarding</td>
                <td style={{padding:'4px 8px'}}>Limited tools & features<br/><span style={{fontSize:13,opacity:0.8}}>No automation, basic support. Not a public plan.</span></td>
              </tr>
              <tr style={{background:'rgba(127,255,212,0.08)'}}>
                <td style={{padding:'4px 8px'}}><b>Starter</b></td>
                <td style={{padding:'4px 8px'}}>£29</td>
                <td style={{padding:'4px 8px'}}>1,000</td>
                <td style={{padding:'4px 8px'}}>Solo founders & lean teams</td>
                <td style={{padding:'4px 8px'}}>Run up to 2 core systems, shared queue, email/SEO tasks, email support</td>
              </tr>
              <tr style={{background:'rgba(127,255,212,0.18)',border:'2px solid #6366f1'}}>
                <td style={{padding:'4px 8px',fontWeight:900}}><b>Pro <span style={{background:'#6366f1',color:'#0d0d11',borderRadius:6,padding:'2px 8px',fontSize:13,marginLeft:4}}>Popular</span></b></td>
                <td style={{padding:'4px 8px',fontWeight:900}}>£99</td>
                <td style={{padding:'4px 8px',fontWeight:900}}>5,000</td>
                <td style={{padding:'4px 8px'}}>Growing brands</td>
                <td style={{padding:'4px 8px'}}>SEO + email + CX systems in parallel, ~250 tasks/week, priority async support, change log</td>
              </tr>
              <tr style={{background:'rgba(127,255,212,0.08)'}}>
                <td style={{padding:'4px 8px'}}><b>Scale</b></td>
                <td style={{padding:'4px 8px'}}>£199</td>
                <td style={{padding:'4px 8px'}}>15,000</td>
                <td style={{padding:'4px 8px'}}>Multi-channel/region ops</td>
                <td style={{padding:'4px 8px'}}>All core + advanced modules, Slack support, quarterly reviews, shared reporting</td>
              </tr>
              <tr style={{background:'rgba(127,255,212,0.08)'}}>
                <td style={{padding:'4px 8px'}}><b>Agency/Enterprise</b></td>
                <td style={{padding:'4px 8px'}}>£399+</td>
                <td style={{padding:'4px 8px'}}>35,000+</td>
                <td style={{padding:'4px 8px'}}>Multi-store, multi-region, agency</td>
                <td style={{padding:'4px 8px'}}>Multi-brand/region, white-label, dedicated infra/support, custom SLOs</td>
              </tr>
            </tbody>
          </table>
          <div style={{fontSize:13,opacity:0.8,margin:'-10px 0 10px 0'}}>* All paid plans include access to the AURA systems library, shared docs, async onboarding, secure API connections, and no per-seat fees. Free plan is for onboarding only.</div>
          <div style={{fontSize:13,opacity:0.8,margin:'0 0 10px 0'}}>Want to try everything? <b>New users get a free 3-day Pro trial</b>—no credit card required. After the trial, you’ll continue on the Basic (Free) plan unless you upgrade.</div>
          <div style={{fontSize:15,margin:'18px 0 10px',background:'#252638',borderRadius:10,padding:'14px 16px',color:'#fff',boxShadow:'0 2px 12px #22d3ee33'}}>
            <b style={{color:'#6366f1'}}>What our customers say:</b><br/>
            <span style={{fontStyle:'italic',color:'#fff'}}>“We replaced three tools and boosted efficiency immediately. It felt like hiring an ops team overnight.”</span><br/>
            <span style={{fontSize:13,opacity:0.85}}>— Elena Rodriguez, Product Manager</span>
          </div>
          <div style={{fontSize:14,margin:'10px 0 8px'}}>
            <a href="https://aurasystemsai.com/pricing" target="_blank" rel="noopener" style={{color:'#6366f1',textDecoration:'underline',fontWeight:700}}>See all plans & features</a>
            <span style={{marginLeft:8,color:'#fff',fontSize:13,opacity:0.8}}>(No commitment, just info)</span>
          </div>
          <div style={{fontSize:14,margin:'10px 0 8px'}}>
            <b>What can you automate?</b><br/>
            <span style={{color:'#6366f1'}}>Search & SEO:</span>Product SEO Engine, Schema, Blog Engine, Alt-text Labeller<br/>
            <span style={{color:'#6366f1'}}>Email & Retention:</span>Automation Builder, Abandoned Checkout AI, Review Flows<br/>
            <span style={{color:'#6366f1'}}>Support & CX:</span>Inbox Reply Assistant, AI Support Agent, Returns Automation<br/>
            <span style={{color:'#6366f1'}}>Ops & Reporting:</span>Feed Hygiene Monitor, Rank Tracker, Daily CFO Pack
          </div>
          <div style={{fontSize:14,margin:'10px 0 8px'}}>
            <b>Why upgrade?</b>Unlock unlimited or high-volume usage, get priority support and advanced analytics, access all automation systems and integrations, and scale your business with zero manual work.
          </div>
          <div style={{fontSize:13,opacity:0.85}}>
            <b>Need more?</b>Top up credits from £9 / 1,000 or <a href="https://aurasystemsai.com/get-started" style={{color:'#6366f1',textDecoration:'underline'}}>contact us</a> for custom plans.<br/>
            <span style={{color:'#6366f1'}}>Ready to upgrade?</span> <a href="https://aurasystemsai.com/get-started" style={{color:'#6366f1',textDecoration:'underline'}}>Get started here</a>.
          </div>
        </div>
        <table style={{width:'100%',fontSize:14,background:'none',borderCollapse:'collapse',marginBottom:8}}>
          <thead>
            <tr style={{color:'#6366f1',textAlign:'left'}}>
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
          <b>Tip:</b>You can always see how many credits an action will use before confirming.<br/>
          <span style={{color:'#6366f1'}}>No hidden fees. No subscriptions. Credits never expire.</span>
        </div>
      </div>

      <div className="aura-credits-note">You can buy more credits at any time. <span className="credits-guide" title="Credits are only used when you run automations or AI tools. You’ll always see your balance here."></span>Credits are used for automation and AI-powered features.</div>
    </div>
  );
};

export default Credits;


