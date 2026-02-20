import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const options = {
  responsive: true,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: { color: '#e5e7eb' },
    },
  },
  scales: {
    x: { 
      ticks: { color: '#94a3b8' },
      grid: { color: '#1e1e1e' },
    },
    y: { 
      ticks: { color: '#94a3b8' },
      grid: { color: '#1e1e1e' },
    },
  },
};

export default function DashboardCharts() {
  const [chartData, setChartData] = useState(null);
  
  useEffect(() => {
    async function fetchAnalytics() {
      try {
        // Generate last 7 days data (mock trend until real API available)
        const today = new Date();
        const labels = [];
        const revenueData = [];
        const ordersData = [];
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
          
          // Generate some realistic-looking trend data
          // In production, this would come from Shopify Analytics API
          const dayRevenue = Math.floor(Math.random() * 2000) + 500;
          const dayOrders = Math.floor(Math.random() * 20) + 5;
          
          revenueData.push(dayRevenue);
          ordersData.push(dayOrders);
        }
        
        setChartData({
          labels,
          datasets: [
            {
              label: 'Revenue ($)',
              data: revenueData,
              fill: false,
              borderColor: '#7fffd4',
              backgroundColor: '#7fffd4',
              tension: 0.4,
              yAxisID: 'y',
            },
            {
              label: 'Orders',
              data: ordersData,
              fill: false,
              borderColor: '#fbbf24',
              backgroundColor: '#fbbf24',
              tension: 0.4,
              yAxisID: 'y1',
            },
          ],
        });
      } catch (err) {
        console.error('Failed to generate chart data:', err);
        setChartData(null);
      }
    }
    fetchAnalytics();
  }, []);

  const multiAxisOptions = {
    ...options,
    scales: {
      ...options.scales,
      y: {
        ...options.scales.y,
        type: 'linear',
        display: true,
        position: 'left',
      },
      y1: {
        ...options.scales.y,
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div style={{ position: 'relative', minHeight: 300 }}>
      {chartData ? (
        <Line data={chartData} options={multiAxisOptions} />
      ) : (
        <div style={{ 
          textAlign: 'center', 
          color: '#94a3b8', 
          padding: '60px 0',
          fontSize: 14,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          Loading chart data...
        </div>
      )}
    </div>
  );
}
