import React, { useEffect } from "react";

export default function Toast({ message, type = 'info', onClose, duration = 5000 }) {
  if (!message) return null;
  let bg = 'var(--toast-bg)', color = 'var(--toast-text)', border = 'transparent';
  if (type === 'error') { bg = 'var(--toast-error-bg)'; color = 'var(--toast-error-text)'; border = '#f87171'; }
  if (type === 'success') { bg = '#052e16'; color = '#4ade80'; border = '#16a34a'; }

  useEffect(() => {
    if (!message || !onClose || !duration) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      background: bg, color, padding: '14px 20px', borderRadius: 12,
      fontWeight: 700, fontSize: 15, boxShadow: '0 4px 20px #0009',
      minWidth: 240, maxWidth: 420, display: 'flex', alignItems: 'center', gap: 12,
      border: `1.5px solid ${border}`
    }}>
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', color, border: 'none', fontWeight: 700, fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 0, flexShrink: 0 }} aria-label="Close"></button>
      )}
    </div>
  );
}
