import React from "react";
import './Sidebar.css';

const navItems = [
  { key: 'products', label: 'Products', icon: '📦' },
  { key: 'content-health', label: 'Content Health', icon: '🩺' },
  { key: 'fix-queue', label: 'Fix Queue', icon: '🛠️' },
  { key: 'content-ingest', label: 'Content Ingest', icon: '📥' },
  { key: 'draft-library', label: 'Draft Library', icon: '📝' },
  { key: 'system-health', label: 'System Health', icon: '⚙️' },
];

export default function Sidebar({ active, onSelect }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">AURA Console</div>
      <ul className="sidebar-nav">
        {navItems.map(item => (
          <li
            key={item.key}
            className={active === item.key ? 'active' : ''}
            onClick={() => onSelect(item.key)}
            tabIndex={0}
            aria-label={item.label}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </li>
        ))}
      </ul>
    </nav>
  );
}
