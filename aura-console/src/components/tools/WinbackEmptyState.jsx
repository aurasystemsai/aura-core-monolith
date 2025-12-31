import React from "react";

export default function WinbackEmptyState({ title, description, action, onAction }) {
  return (
    <div style={{
      background: '#f8fafc',
      border: '1.5px dashed #7fffd4',
      borderRadius: 16,
      padding: 48,
      textAlign: 'center',
      color: '#23263a',
      margin: '32px 0',
    }}>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>{title}</div>
      <div style={{ fontSize: 16, color: '#555', marginBottom: 24 }}>{description}</div>
      {action && (
        <button
          onClick={onAction}
          style={{
            background: '#7fffd4',
            color: '#23263a',
            border: 'none',
            borderRadius: 8,
            padding: '12px 32px',
            fontWeight: 700,
            fontSize: 17,
            cursor: 'pointer',
            boxShadow: '0 2px 12px #22d3ee55',
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}
