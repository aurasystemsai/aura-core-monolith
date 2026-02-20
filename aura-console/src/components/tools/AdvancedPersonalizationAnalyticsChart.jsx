// aura-console/src/components/tools/AdvancedPersonalizationAnalyticsChart.jsx
// Advanced analytics chart for Advanced Personalization Engine
import React from 'react';
import { Line } from 'react-chartjs-2';
import BackButton from './BackButton';

export default function AdvancedPersonalizationAnalyticsChart({ data }) {
  if (!data || !data.length) return <div>No analytics data yet.</div>;
  const chartData = {
    labels: data.map(e => e.timestamp || e.date || ''),
    datasets: [
      {
        label: 'Personalizations Served',
        data: data.map(e => e.personalizations || 0),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.1)',
        tension: 0.3,
      },
      {
        label: 'Conversions',
        data: data.map(e => e.conversions || 0),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.1)',
        tension: 0.3,
      },
      {
        label: 'Revenue Impact',
        data: data.map(e => e.revenue || 0),
        borderColor: '#f59e42',
        backgroundColor: 'rgba(245,158,66,0.1)',
        tension: 0.3,
      },
    ],
  };
  return (
    <div style={{ background: '#18181b', borderRadius: 12, padding: 18, marginBottom: 24, color: '#f0f0f0' }}>
      <BackButton />
      <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
    </div>
  );
}

