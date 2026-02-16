/**
 * Revenue Dashboard - Admin view of all revenue streams
 * 
 * Displays comprehensive revenue analytics across:
 * - MRR/ARR metrics
 * - Revenue by stream (13 sources)
 * - Growth trends
 * - Customer metrics
 * - Projections
 */

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import './RevenueDashboard.css';

const COLORS = {
  subscriptions: '#0088FE',
  usage: '#00C49F',
  marketplace: '#FFBB28',
  whiteLabelAgency: '#FF8042',
  dataProducts: '#8884d8',
  fintech: '#82ca9d',
  verticals: '#ffc658',
  enterprise: '#ff7c7c',
  paymentProcessing: '#8dd1e1',
  services: '#d084d0',
  dataFeeds: '#a4de6c',
  acquisitions: '#ffa07a',
  insurance: '#d0ed57',
};

export default function RevenueDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [viewMode, setViewMode] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/revenue/dashboard?period=${selectedPeriod}`);
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch revenue dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className="revenue-dashboard-loading">
        <div className="spinner"></div>
        <p>Loading revenue data...</p>
      </div>
    );
  }

  const { summary, breakdown, growth, customer, projections, cohorts } = dashboardData;

  return (
    <div className="revenue-dashboard">
      <header className="revenue-dashboard-header">
        <h1>Revenue Dashboard</h1>
        <div className="header-controls">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-selector"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
            <option value="year">Last 12 Months</option>
          </select>
          
          <div className="view-mode-toggle">
            <button
              className={viewMode === 'overview' ? 'active' : ''}
              onClick={() => setViewMode('overview')}
            >
              Overview
            </button>
            <button
              className={viewMode === 'streams' ? 'active' : ''}
              onClick={() => setViewMode('streams')}
            >
              By Stream
            </button>
            <button
              className={viewMode === 'customers' ? 'active' : ''}
              onClick={() => setViewMode('customers')}
            >
              Customers
            </button>
            <button
              className={viewMode === 'projections' ? 'active' : ''}
              onClick={() => setViewMode('projections')}
            >
              Projections
            </button>
          </div>
        </div>
      </header>

      {viewMode === 'overview' && (
        <OverviewTab summary={summary} growth={growth} breakdown={breakdown} />
      )}
      
      {viewMode === 'streams' && (
        <StreamsTab breakdown={breakdown} />
      )}
      
      {viewMode === 'customers' && (
        <CustomersTab customer={customer} cohorts={cohorts} />
      )}
      
      {viewMode === 'projections' && (
        <ProjectionsTab projections={projections} summary={summary} />
      )}
    </div>
  );
}

function OverviewTab({ summary, growth, breakdown }) {
  const summaryCards = [
    {
      title: 'MRR',
      value: `$${(summary.mrr / 1000).toFixed(1)}K`,
      change: `+${summary.mrr_growth_mom_percent.toFixed(1)}%`,
      positive: summary.mrr_growth_mom_percent > 0,
      subtitle: 'Monthly Recurring Revenue',
    },
    {
      title: 'ARR',
      value: `$${(summary.arr / 1000000).toFixed(2)}M`,
      change: `+${summary.arr_growth_yoy_percent.toFixed(1)}%`,
      positive: summary.arr_growth_yoy_percent > 0,
      subtitle: 'Annual Recurring Revenue',
    },
    {
      title: 'Customers',
      value: summary.paying_customers.toLocaleString(),
      change: `+${growth.customer_growth_mom}`,
      positive: growth.customer_growth_mom > 0,
      subtitle: `${summary.total_customers.toLocaleString()} total`,
    },
    {
      title: 'ARPU',
      value: `$${summary.arpu.toFixed(0)}`,
      change: `${summary.churn_rate.toFixed(1)}% churn`,
      positive: summary.churn_rate < 5,
      subtitle: 'Average Revenue Per User',
    },
    {
      title: 'NRR',
      value: `${summary.net_revenue_retention.toFixed(0)}%`,
      change: growth.expansion_rate > 0 ? 'Expanding' : 'Contracting',
      positive: summary.net_revenue_retention > 100,
      subtitle: 'Net Revenue Retention',
    },
    {
      title: 'Cash Collected',
      value: `$${(summary.cash_collected / 1000).toFixed(1)}K`,
      change: `$${(summary.outstanding_ar / 1000).toFixed(1)}K AR`,
      positive: summary.outstanding_ar < summary.cash_collected,
      subtitle: 'This Period',
    },
  ];

  const revenueByStream = Object.entries(breakdown).map(([stream, data]) => ({
    name: formatStreamName(stream),
    value: data.revenue,
    percentage: ((data.revenue / summary.mrr) * 100).toFixed(1),
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="overview-tab">
      <div className="summary-cards">
        {summaryCards.map((card, index) => (
          <div key={index} className="summary-card">
            <div className="card-header">
              <h3>{card.title}</h3>
              <span className={`change ${card.positive ? 'positive' : 'negative'}`}>
                {card.change}
              </span>
            </div>
            <div className="card-value">{card.value}</div>
            <div className="card-subtitle">{card.subtitle}</div>
          </div>
        ))}
      </div>

      <div className="charts-row">
        <div className="chart-container">
          <h2>Revenue by Stream</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={revenueByStream}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
              >
                {revenueByStream.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h2>MRR Growth Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={growth.mrr_trend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Area
                type="monotone"
                dataKey="mrr"
                stroke="#0088FE"
                fill="#0088FE"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="growth-metrics">
        <h2>Growth Metrics</h2>
        <div className="metrics-grid">
          <MetricCard
            title="MRR Growth (MoM)"
            value={`${growth.mrr_growth_mom.toFixed(1)}%`}
            subtitle="Month over Month"
            positive={growth.mrr_growth_mom > 0}
          />
          <MetricCard
            title="MRR Growth (3M)"
            value={`${growth.mrr_growth_3m.toFixed(1)}%`}
            subtitle="Last 3 Months"
            positive={growth.mrr_growth_3m > 0}
          />
          <MetricCard
            title="Expansion Rate"
            value={`${growth.expansion_rate.toFixed(1)}%`}
            subtitle={`$${growth.expansion_mrr.toLocaleString()} MRR`}
            positive={growth.expansion_rate > 0}
          />
          <MetricCard
            title="Churn Rate"
            value={`${growth.revenue_churn_rate.toFixed(1)}%`}
            subtitle={`${growth.logo_churn_rate.toFixed(1)}% logo churn`}
            positive={growth.revenue_churn_rate < 5}
          />
        </div>
      </div>
    </div>
  );
}

function StreamsTab({ breakdown }) {
  const streams = Object.entries(breakdown).map(([key, data]) => ({
    key,
    name: formatStreamName(key),
    ...data,
  })).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="streams-tab">
      <h2>Revenue by Stream</h2>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={streams}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="revenue" fill="#0088FE" name="MRR" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="streams-table">
        <table>
          <thead>
            <tr>
              <th>Revenue Stream</th>
              <th>MRR</th>
              <th>ARR</th>
              <th>Customers</th>
              <th>ARPU</th>
              <th>% of Total</th>
            </tr>
          </thead>
          <tbody>
            {streams.map((stream) => {
              const totalMRR = streams.reduce((sum, s) => sum + s.revenue, 0);
              const percentage = ((stream.revenue / totalMRR) * 100).toFixed(1);
              const arr = stream.revenue * 12;
              const arpu = stream.customers > 0 ? stream.revenue / stream.customers : 0;

              return (
                <tr key={stream.key}>
                  <td>
                    <div className="stream-name">
                      <span
                        className="stream-color"
                        style={{ backgroundColor: COLORS[stream.key] || '#ccc' }}
                      ></span>
                      {stream.name}
                    </div>
                  </td>
                  <td className="amount">${stream.revenue.toLocaleString()}</td>
                  <td className="amount">${arr.toLocaleString()}</td>
                  <td>{stream.customers.toLocaleString()}</td>
                  <td className="amount">${arpu.toFixed(0)}</td>
                  <td>{percentage}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CustomersTab({ customer, cohorts }) {
  const customerSegments = [
    { name: 'SMB (<$1M)', count: customer.by_segment.smb, percentage: 60 },
    { name: 'Mid-Market ($1M-$50M)', count: customer.by_segment.mid_market, percentage: 30 },
    { name: 'Enterprise (>$50M)', count: customer.by_segment.enterprise, percentage: 10 },
  ];

  return (
    <div className="customers-tab">
      <div className="customer-metrics">
        <h2>Customer Metrics</h2>
        <div className="metrics-grid">
          <MetricCard
            title="LTV / CAC"
            value={customer.ltv_cac_ratio.toFixed(1)}
            subtitle={`Target: >3.0`}
            positive={customer.ltv_cac_ratio > 3}
          />
          <MetricCard
            title="Payback Period"
            value={`${customer.payback_period_months} mo`}
            subtitle="Target: <12 months"
            positive={customer.payback_period_months < 12}
          />
          <MetricCard
            title="Engagement"
            value={`${customer.engagement.dau.toLocaleString()} DAU`}
            subtitle={`${customer.engagement.mau.toLocaleString()} MAU`}
            positive={true}
          />
          <MetricCard
            title="Avg Customer LTV"
            value={`$${customer.avg_ltv.toLocaleString()}`}
            subtitle={`$${customer.avg_cac.toLocaleString()} CAC`}
            positive={customer.avg_ltv > customer.avg_cac * 3}
          />
        </div>
      </div>

      <div className="chart-container">
        <h2>Customers by Segment</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={customerSegments}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#0088FE" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="cohort-analysis">
        <h2>Cohort Retention Analysis</h2>
        <table className="cohort-table">
          <thead>
            <tr>
              <th>Cohort</th>
              <th>Customers</th>
              <th>Month 1</th>
              <th>Month 2</th>
              <th>Month 3</th>
              <th>Month 6</th>
              <th>Month 12</th>
            </tr>
          </thead>
          <tbody>
            {cohorts.map((cohort) => (
              <tr key={cohort.cohort}>
                <td>{cohort.cohort}</td>
                <td>{cohort.customers}</td>
                <td className={getRetentionClass(cohort.retention_1m)}>
                  {(cohort.retention_1m * 100).toFixed(0)}%
                </td>
                <td className={getRetentionClass(cohort.retention_2m)}>
                  {(cohort.retention_2m * 100).toFixed(0)}%
                </td>
                <td className={getRetentionClass(cohort.retention_3m)}>
                  {(cohort.retention_3m * 100).toFixed(0)}%
                </td>
                <td className={getRetentionClass(cohort.retention_6m)}>
                  {cohort.retention_6m ? `${(cohort.retention_6m * 100).toFixed(0)}%` : '-'}
                </td>
                <td className={getRetentionClass(cohort.retention_12m)}>
                  {cohort.retention_12m ? `${(cohort.retention_12m * 100).toFixed(0)}%` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProjectionsTab({ projections, summary }) {
  const projectionData = projections.monthly.map((monthData) => ({
    month: monthData.month,
    projected_mrr: monthData.projected_mrr,
    current_mrr: summary.mrr,
  }));

  return (
    <div className="projections-tab">
      <h2>Revenue Projections</h2>
      
      <div className="projection-summary">
        <div className="projection-card">
          <h3>Current MRR</h3>
          <div className="value">${summary.mrr.toLocaleString()}</div>
        </div>
        <div className="projection-card">
          <h3>Projected Year-End MRR</h3>
          <div className="value">${projections.year_end_mrr.toLocaleString()}</div>
          <div className="subtitle">
            +${(projections.year_end_mrr - summary.mrr).toLocaleString()} growth
          </div>
        </div>
        <div className="projection-card">
          <h3>Projected Year-End ARR</h3>
          <div className="value">${projections.year_end_arr.toLocaleString()}</div>
          <div className="subtitle">
            {((projections.year_end_arr / summary.arr - 1) * 100).toFixed(0)}% YoY growth
          </div>
        </div>
      </div>

      <div className="chart-container">
        <h3>12-Month MRR Projection</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={projectionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="current_mrr"
              stroke="#999"
              strokeDasharray="5 5"
              name="Current MRR"
            />
            <Line
              type="monotone"
              dataKey="projected_mrr"
              stroke="#0088FE"
              strokeWidth={2}
              name="Projected MRR"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="projection-assumptions">
        <h3>Projection Assumptions</h3>
        <ul>
          <li>Based on {selectedPeriod} historical growth rate</li>
          <li>Assumes {summary.churn_rate.toFixed(1)}% monthly churn rate</li>
          <li>Includes expansion revenue from upgrades</li>
          <li>Does not include one-time events or acquisitions</li>
        </ul>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, positive }) {
  return (
    <div className={`metric-card ${positive ? 'positive' : 'negative'}`}>
      <h4>{title}</h4>
      <div className="value">{value}</div>
      <div className="subtitle">{subtitle}</div>
    </div>
  );
}

function formatStreamName(key) {
  const names = {
    subscriptions: 'Core SaaS',
    usage: 'Usage-Based',
    marketplace: 'Marketplace',
    whiteLabelAgency: 'White-Label',
    dataProducts: 'Data Products',
    fintech: 'Fintech',
    verticals: 'Vertical Templates',
    enterprise: 'Multi-Tenant',
    paymentProcessing: 'Payment Processing',
    services: 'Services',
    dataFeeds: 'Data Feeds',
    acquisitions: 'Acquisitions',
    insurance: 'Insurance',
  };
  return names[key] || key;
}

function getRetentionClass(retention) {
  if (!retention) return '';
  if (retention >= 0.8) return 'retention-excellent';
  if (retention >= 0.6) return 'retention-good';
  if (retention >= 0.4) return 'retention-fair';
  return 'retention-poor';
}
