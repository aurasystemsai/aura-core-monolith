
import React from "react";

export default function WinbackEmptyState({ title, description, action, onAction, icon, darkMode: propDarkMode }) {
  const darkMode = propDarkMode ?? false;
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={title}
      style={{
        background: darkMode ? '#18181b' : '#f8fafc',
        border: '1.5px dashed #818cf8',
        borderRadius: 16,
        padding: 48,
        textAlign: 'center',
        color: darkMode ? '#a3e635' : '#09090b',
        margin: '32px 0',
        outline: 'none',
        boxShadow: darkMode ? '0 2px 24px #22d3ee33' : '0 2px 16px #0001',
        transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
        
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      {icon && <div style={{ fontSize: 48, marginBottom: 18, color: darkMode ? '#a3e635' : '#0ea5e9', transition: 'color 0.2s' }}>{icon}</div>}
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>{title}</div>
      <div style={{ fontSize: 16, color: darkMode ? '#e0e7ff' : '#555', marginBottom: 24 }}>{description}</div>
      {action && (
        <button
          onClick={onAction}
          style={{
            background: '#818cf8',
            color: '#09090b',
            border: 'none',
            borderRadius: 8,
            padding: '12px 32px',
            fontWeight: 700,
            fontSize: 17,
            cursor: 'pointer',
            boxShadow: '0 2px 12px #22d3ee55',
            outline: 'none',
            transition: 'background 0.2s, color 0.2s',
          }}
          aria-label={action}
        >
          {action}
        </button>
      )}
    </div>
  );
}
