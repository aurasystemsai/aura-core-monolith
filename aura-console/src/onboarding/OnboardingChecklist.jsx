import React, { useState } from "react";

const ONBOARDING_STEPS = [
  { key: "run-automation", label: "Run your first automation",
    help: "Try any tool from the sidebar to see it in action." },
  { key: "explore-docs", label: "Explore the documentation",
    help: <a href="https://aurasystemsai.com/docs" target="_blank" rel="noopener" style={{color:'#818cf8',textDecoration:'underline'}}>Open docs ↗</a> },
  { key: "check-fix-queue", label: "Check the Fix Queue",
    help: "Go to the Fix Queue panel to resolve any issues found by automations." },
  { key: "invite-team", label: "Invite your team (optional)",
    help: "Share your dashboard link or add users in Settings." },
];

export default function OnboardingChecklist({ onComplete, forceShow, onClose }) {
  const [completed, setCompleted] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("auraOnboardingChecklist") || "{}") || {};
    } catch {
      return {};
    }
  });
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("auraOnboardingChecklistDismissed") === "1");
  const allDone = ONBOARDING_STEPS.every(step => completed[step.key]);

  const handleCheck = key => {
    const next = { ...completed, [key]: !completed[key] };
    setCompleted(next);
    localStorage.setItem("auraOnboardingChecklist", JSON.stringify(next));
    if (Object.values(next).every(Boolean) && onComplete) onComplete();
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("auraOnboardingChecklistDismissed", "1");
  };
  const handleReset = () => {
    setCompleted({});
    setDismissed(false);
    localStorage.removeItem("auraOnboardingChecklist");
    localStorage.removeItem("auraOnboardingChecklistDismissed");
  };

  if (!forceShow && (allDone || dismissed)) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 32, right: 32, zIndex: 9999, background: '#09090b', color: '#fff', borderRadius: 14, boxShadow: '0 4px 24px #0008', padding: '24px 32px', minWidth: 260, maxWidth: 360, fontSize: 16, fontWeight: 500, letterSpacing: '0.01em', animation: 'fadeIn 0.4s', border: '1.5px solid #818cf8',
    }}>
      <div style={{fontWeight:700, fontSize:18, color:'#818cf8', marginBottom:10}}>Getting Started</div>
      <ul style={{listStyle:'none', padding:0, margin:0, marginBottom:10}}>
        {ONBOARDING_STEPS.map(step => (
          <li key={step.key} style={{marginBottom:10, display:'flex', flexDirection:'column', alignItems:'flex-start', gap:2}}>
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
              <input type="checkbox" checked={!!completed[step.key]} onChange={() => handleCheck(step.key)} style={{accentColor:'#818cf8', width:18, height:18}} aria-label={step.label} />
              <span style={{textDecoration: completed[step.key] ? 'line-through' : 'none', opacity: completed[step.key] ? 0.6 : 1}}>{step.label}</span>
            </label>
            <span style={{fontSize:13,opacity:0.8,marginLeft:26}}>{step.help}</span>
          </li>
        ))}
      </ul>
      <button onClick={handleReset} style={{background:'none', color:'#818cf8', border:'none', fontSize:14, cursor:'pointer', marginTop:2}}>Reset</button>
      <button onClick={() => { handleDismiss(); if (onClose) onClose(); }} style={{background:'none', color:'#818cf8', border:'none', fontSize:14, cursor:'pointer', marginLeft:12}}>Dismiss</button>
      {forceShow && <button onClick={onClose} style={{background:'none', color:'#818cf8', border:'none', fontSize:14, cursor:'pointer', marginLeft:12}}>Close</button>}
    </div>
  );
}
