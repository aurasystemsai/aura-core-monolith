
import toolsMeta from '../toolMeta';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'auth', label: 'Auth', icon: '🔑' },
  { key: 'onboarding', label: 'Onboarding', icon: '🚀' },
  { key: 'credits', label: 'Credits', icon: '💳' },
  { key: 'orchestration', label: 'Orchestration', icon: '🤖' },
  { key: 'products', label: 'Products', icon: '📦' },
  { key: 'content-health', label: 'Content Health', icon: '🩺' },
  { key: 'fix-queue', label: 'Fix Queue', icon: '🛠️' },
  { key: 'content-ingest', label: 'Content Ingest', icon: '📥' },
  { key: 'draft-library', label: 'Draft Library', icon: '📝' },
  { key: 'system-health', label: 'System Health', icon: '⚙️' },
];

export default function Sidebar({ current, onSelect }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand" style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
        <img src="/logo-aura.png" alt="AURA Logo" style={{height:38,width:38,objectFit:'contain',borderRadius:10,boxShadow:'0 2px 12px #22d3ee55'}} />
      </div>
      <ul className="sidebar-nav">
        {navItems.map(item => (
          <li
            key={item.key}
            className={current === item.key ? 'active' : ''}
            onClick={() => onSelect(item.key)}
            tabIndex={0}
            aria-label={item.label}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </li>
        ))}
      </ul>
      <div className="sidebar-section-label">Tools</div>
      <ul className="sidebar-nav sidebar-tools">
        {toolsMeta.map(tool => (
          <li
            key={tool.id}
            className={current === tool.id ? 'active' : ''}
            onClick={() => onSelect(tool.id)}
            tabIndex={0}
            aria-label={tool.name}
          >
            <span className="sidebar-icon">🛠️</span>
            <span className="sidebar-label">{tool.name}</span>
          </li>
        ))}
      </ul>
      <div className="sidebar-profile" style={{
        marginTop: 'auto',
        padding: '32px 0 24px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        opacity: 0.96,
      }}>
        <img
          src="/avatar-default.png"
          alt="User Avatar"
          style={{ width: 48, height: 48, borderRadius: '50%', boxShadow: '0 2px 12px #22d3ee55', marginBottom: 6 }}
        />
        <div style={{ fontWeight: 700, color: '#7fffd4', fontSize: 15, letterSpacing: '0.01em', textShadow: '0 1px 4px #0004' }}>
          User Name
        </div>
        <div style={{ fontSize: 13, color: '#cbd5f5', opacity: 0.7 }}>user@email.com</div>
      </div>
    </nav>
  );
}
import React from "react";
