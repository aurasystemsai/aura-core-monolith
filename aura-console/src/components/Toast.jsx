import React from "react";

export default function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;
  let bg = '#23263a', color = '#fff';
  if (type === 'error') { bg = '#ff4d4f'; color = '#fff'; }
  if (type === 'success') { bg = '#7fffd4'; color = '#23263a'; }
  return (
    <div style={{
      position: 'fixed', bottom: 32, left: 32, zIndex: 9999,
      background: bg, color, padding: '16px 32px', borderRadius: 12,
      fontWeight: 700, fontSize: 16, boxShadow: '0 2px 12px #0008', minWidth: 220, maxWidth: 420
    }}>
      {message}
      {onClose && (
        <button onClick={onClose} style={{ marginLeft: 18, background: 'none', color, border: 'none', fontWeight: 700, fontSize: 18, cursor: 'pointer' }} aria-label="Close">✕</button>
      )}
    </div>
  );
}
