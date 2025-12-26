
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
      <div className="sidebar-brand">AURA Console</div>
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
    </nav>
  );
}
import React from "react";
