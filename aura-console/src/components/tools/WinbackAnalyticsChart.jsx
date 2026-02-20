// aura-console/src/components/tools/WinbackAnalyticsChart.jsx
// Advanced analytics chart for Abandoned Checkout Winback
import React from 'react';
import { Line } from 'react-chartjs-2';

export default function WinbackAnalyticsChart({ data }) {
  if (!data || !data.length) return <div>No analytics data yet.</div>;
  const chartData = {
    labels: data.map(e => e.timestamp || e.date || ''),
    datasets: [
      {
        label: 'Recovered Revenue',
        data: data.map(e => e.recoveredRevenue || 0),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.1)',
        tension: 0.3,
      },
      {
        label: 'Emails Sent',
        data: data.map(e => e.emailsSent || 0),
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(99,102,241,0.1)',
        tension: 0.3,
      },
      {
        label: 'Conversions',
        data: data.map(e => e.conversions || 0),
        borderColor: '#f59e42',
        backgroundColor: 'rgba(245,158,66,0.1)',
        tension: 0.3,
      },
    ],
  };
  return (
    <div style={{ background: 'var(--background-secondary)', borderRadius: 12, padding: 18, marginBottom: 24 }}>
      <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
    </div>
  );
}
