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
    <div
      className="dashboard-charts-card"
      style={{
        background: 'linear-gradient(120deg, #23263a 60%, #23284a 100%)',
        borderRadius: 20,
        padding: 32,
        marginTop: 40,
        boxShadow: '0 8px 32px #0005',
        position: 'relative',
        overflow: 'hidden',
        animation: 'fadeInUp 0.7s cubic-bezier(.23,1.01,.32,1) both',
      }}
    >
      {/* Animated accent circle */}
      <div style={{
        position: 'absolute',
        top: '-60px',
        right: '-60px',
        width: '140px',
        height: '140px',
        background: 'radial-gradient(circle, #7fffd4 0%, #23263a 80%)',
        opacity: 0.10,
        borderRadius: '50%',
        zIndex: 0,
        pointerEvents: 'none',
        animation: 'pulse 5s infinite',
      }} />
      <h3 style={{ color: '#7fffd4', marginBottom: 18, fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em', textShadow: '0 2px 12px #0006', zIndex: 1, position: 'relative' }}>
        SEO Issues Trend (Sample)
      </h3>
      <div style={{zIndex:1,position:'relative'}}>
        <Line data={sampleData} options={options} />
      </div>
    </div>
  );
}
