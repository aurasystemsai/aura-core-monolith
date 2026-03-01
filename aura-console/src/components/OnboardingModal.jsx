import React from "react";

export default function OnboardingModal({ open, onClose }) {
 if (!open) return null;
 return (
 <div style={{
 position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
 background: 'rgba(20,24,40,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
 <div style={{ background: 'var(--background-secondary)', color: 'var(--text-primary)', padding: 36, borderRadius: 18, minWidth: 320, maxWidth: 420, boxShadow: '0 8px 32px #0008'}}>
 <h2 style={{ marginTop: 0 }}>Welcome to Aura!</h2>
 <p>Get started by setting up your first project and exploring the tools in the sidebar.</p>
 <button onClick={onClose} style={{ marginTop: 24, background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer'}}>Continue</button>
 </div>
 </div>
 );
}
