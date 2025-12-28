import React, { useState } from "react";

const ONBOARDING_STEPS = [
  { key: "connect-store", label: "Connect your store" },
  { key: "run-automation", label: "Run your first automation" },
  { key: "explore-docs", label: "Explore the documentation" },
  { key: "check-fix-queue", label: "Check the Fix Queue" },
  { key: "invite-team", label: "Invite your team (optional)" },
];

export default function OnboardingChecklist({ onComplete }) {
  const [completed, setCompleted] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("auraOnboardingChecklist") || "{}") || {};
    } catch {
      return {};
    }
  });
  const allDone = ONBOARDING_STEPS.every(step => completed[step.key]);

  const handleCheck = key => {
    const next = { ...completed, [key]: !completed[key] };
    setCompleted(next);
    localStorage.setItem("auraOnboardingChecklist", JSON.stringify(next));
    if (Object.values(next).every(Boolean) && onComplete) onComplete();
  };

  if (allDone) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 32, right: 32, zIndex: 9999, background: '#23263a', color: '#fff', borderRadius: 14, boxShadow: '0 4px 24px #0008', padding: '24px 32px', minWidth: 260, maxWidth: 340, fontSize: 16, fontWeight: 500, letterSpacing: '0.01em', animation: 'fadeIn 0.4s', border: '1.5px solid #7fffd4',
    }}>
      <div style={{fontWeight:700, fontSize:18, color:'#7fffd4', marginBottom:10}}>Getting Started</div>
      <ul style={{listStyle:'none', padding:0, margin:0, marginBottom:10}}>
        {ONBOARDING_STEPS.map(step => (
          <li key={step.key} style={{marginBottom:8, display:'flex', alignItems:'center', gap:8}}>
            <input type="checkbox" checked={!!completed[step.key]} onChange={() => handleCheck(step.key)} style={{accentColor:'#7fffd4', width:18, height:18}} aria-label={step.label} />
            <span style={{textDecoration: completed[step.key] ? 'line-through' : 'none', opacity: completed[step.key] ? 0.6 : 1}}>{step.label}</span>
          </li>
        ))}
      </ul>
      <button onClick={() => { setCompleted({}); localStorage.removeItem("auraOnboardingChecklist"); }} style={{background:'none', color:'#7fffd4', border:'none', fontSize:14, cursor:'pointer', marginTop:2}}>Reset</button>
      <button onClick={() => { setCompleted({}); localStorage.setItem("auraOnboardingChecklist", JSON.stringify(ONBOARDING_STEPS.reduce((a,s)=>({...a,[s.key]:true}),{}))); if(onComplete)onComplete(); }} style={{background:'none', color:'#7fffd4', border:'none', fontSize:14, cursor:'pointer', marginLeft:12}}>Dismiss</button>
    </div>
  );
}
