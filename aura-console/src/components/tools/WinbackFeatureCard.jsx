import React from "react";

export default function WinbackFeatureCard({ title, description, icon, children }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 2px 16px #0001',
      padding: 24,
      margin: '18px 0',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 18,
      minHeight: 80,
      position: 'relative',
    }}>
      {icon && <div style={{ fontSize: 32, marginRight: 12 }}>{icon}</div>}
      <div>
        <div style={{ fontWeight: 700, fontSize: 20, color: '#23263a', marginBottom: 4 }}>{title}</div>
        <div style={{ color: '#444', fontSize: 15, marginBottom: 6 }}>{description}</div>
        {children}
      </div>
    </div>
  );
}
