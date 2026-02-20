import React, { useState } from "react";

const CHANGELOG = [
  {
    date: "2025-12-28",
    title: "Onboarding checklist, pricing sync, and more!",
    items: [
      "Added onboarding checklist for new users (now removed for simplicity)",
      "Credits panel now matches website pricing and features",
      "UI/UX polish and bug fixes",
      "Sidebar and dashboard navigation improvements",
      "Accessibility and dark theme enhancements"
    ]
  },
  {
    date: "2025-12-15",
    title: "Major SaaS UI overhaul",
    items: [
      "Unified dark theme across all panels",
      "Beginner-friendly guides and tooltips everywhere",
      "Upsell and pricing improvements in Credits panel"
    ]
  }
];

export default function ChangelogModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
      background: 'rgba(10,16,32,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.3s',
    }} role="dialog" aria-modal="true" aria-label="What’s New">
      <div style={{
        background: 'var(--background-secondary)', borderRadius: 18, boxShadow: '0 8px 40px #0008', padding: '38px 32px 28px', minWidth: 340, maxWidth: 420,
        display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1.5px solid #818cf8',
        animation: 'popIn 0.18s', color: 'var(--text-primary)',
      }}>
        <h2 style={{color:'#818cf8',fontWeight:900,marginBottom:10,fontSize:26,letterSpacing:'-0.01em'}}>What’s New</h2>
        <div style={{width:'100%',maxHeight:320,overflowY:'auto'}}>
          {CHANGELOG.map(entry => (
            <div key={entry.date} style={{marginBottom:22}}>
              <div style={{fontWeight:700,fontSize:16,color:'#818cf8',marginBottom:2}}>{entry.title}</div>
              <div style={{fontSize:13,opacity:0.7,marginBottom:4}}>{entry.date}</div>
              <ul style={{margin:0,paddingLeft:18,fontSize:15}}>
                {entry.items.map((item,i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{marginTop:18,background:'var(--button-primary-bg)',color:'var(--button-primary-text)',fontWeight:700,fontSize:16,padding:'10px 32px',borderRadius:8,border:'none',boxShadow:'0 2px 12px #22d3ee55',cursor:'pointer'}}>Close</button>
      </div>
    </div>
  );
}
