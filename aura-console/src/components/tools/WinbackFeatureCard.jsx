
import React, { useState } from "react";

export default function WinbackFeatureCard({ title, description, icon, children, actions = [], darkMode: propDarkMode }) {
  const [hover, setHover] = useState(false);
  // Force dark mode for all cards
  const darkMode = true;
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{
        background: '#23232a',
        borderRadius: 16,
        boxShadow: hover ? '0 4px 24px #22d3ee33' : '0 2px 16px #0001',
        padding: 24,
        margin: '18px 0',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 18,
        minHeight: 80,
        position: 'relative',
        outline: hover ? '2px solid #7fffd4' : 'none',
        transition: 'box-shadow 0.2s, outline 0.2s, background 0.2s',
        cursor: hover ? 'pointer' : 'default',
        color: '#fafafa',
        flexWrap: 'wrap',
      }}
    >
      {/* Icon removed for clean look */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: '#fafafa', marginBottom: 4 }}>{title}</div>
        <div style={{ color: '#d1d5db', fontSize: 15, marginBottom: 6 }}>{description}</div>
        {children}
        {actions.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {actions.map((a, i) => (
              <button
                key={a.label + i}
                onClick={a.onClick}
                style={{
                  background: a.color || (darkMode ? '#0a0a0a' : '#7fffd4'),
                  color: darkMode ? '#a3e635' : '#0a0a0a',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 18px',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  boxShadow: '0 1px 6px #0001',
                  outline: 'none',
                }}
                aria-label={a.label}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
