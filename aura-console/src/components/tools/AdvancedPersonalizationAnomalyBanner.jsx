// aura-console/src/components/tools/AdvancedPersonalizationAnomalyBanner.jsx
// Banner for anomaly detection in analytics
import React from 'react';

export default function AdvancedPersonalizationAnomalyBanner({ analytics }) {
  if (!analytics || !analytics.length) return null;
  const last = analytics[0];
  const prev = analytics[1];
  if (!last || !prev) return null;
  let anomaly = null;
  if (last.conversions > prev.conversions * 2) anomaly = 'Spike in conversions detected!';
  if (last.revenue < prev.revenue * 0.5) anomaly = 'Significant drop in revenue impact!';
  if (!anomaly) return null;
  return (
    <div style={{ background: '#fef3c7', color: '#b45309', borderRadius: 8, padding: 12, marginBottom: 18, fontWeight: 600 }}>
      ️ {anomaly}
    </div>
  );
}
