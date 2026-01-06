import React from "react";

export default function ToolPlaceholder({ name }) {
  return (
    <div style={{ background: 'var(--background-secondary)', color: 'var(--text-primary)', borderRadius: 16, padding: 32, maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
      <h2 style={{ marginBottom: 24 }}>{name}</h2>
      <div style={{ color: '#9ca3c7' }}>This tool UI will be built soon.</div>
    </div>
  );
}
