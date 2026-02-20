// aura-console/src/components/tools/WinbackAnomalyBanner.jsx
// Banner for anomaly detection in analytics
import React from 'react';

export default function WinbackAnomalyBanner({ analytics }) {
  if (!analytics || !analytics.length) return null;
  // Simple anomaly: spike in conversions or drop in revenue
  const last = analytics[0];
  const prev = analytics[1];
  if (!last || !prev) return null;
  let anomaly = null;
  if (last.conversions > prev.conversions * 2) anomaly = 'Spike in conversions detected!';
  if (last.recoveredRevenue < prev.recoveredRevenue * 0.5) anomaly = 'Significant drop in recovered revenue!';
  if (!anomaly) return null;
  return (
    <div style={{ background: '#fef3c7', color: '#b45309', borderRadius: 8, padding: 12, marginBottom: 18, fontWeight: 600 }}>
      ️ {anomaly}
    </div>
  );
}
