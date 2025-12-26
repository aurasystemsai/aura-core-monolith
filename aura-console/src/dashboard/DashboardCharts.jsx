import React from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const sampleData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'SEO Issues',
      data: [40, 37, 35, 32, 30, 28, 27],
      fill: false,
      borderColor: '#7fffd4',
      tension: 0.1,
    },
  ],
};

const options = {
  responsive: true,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: { color: '#fff' },
    },
  },
  scales: {
    x: { ticks: { color: '#fff' } },
    y: { ticks: { color: '#fff' } },
  },
};

export default function DashboardCharts() {
  return (
    <div style={{ background: '#23284a', borderRadius: 12, padding: 24, marginTop: 32 }}>
      <h3 style={{ color: '#7fffd4', marginBottom: 16 }}>SEO Issues Trend (Sample)</h3>
      <Line data={sampleData} options={options} />
    </div>
  );
}
