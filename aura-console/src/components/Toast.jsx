import React from "react";

export default function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;
  let bg = 'var(--toast-bg)', color = 'var(--toast-text)';
  if (type === 'error') { bg = 'var(--toast-error-bg)'; color = 'var(--toast-error-text)'; }
  if (type === 'success') { bg = 'var(--toast-success-bg)'; color = 'var(--toast-success-text)'; }
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
