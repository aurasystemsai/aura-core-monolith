
import React, { useState, useEffect, lazy, Suspense } from "react";
import ReportExportBar from "./ReportExportBar";
const DashboardCharts = lazy(() => import('../dashboard/DashboardCharts'));

function useFinanceData() {
  const [finance, setFinance] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchFinance() {
      setLoading(true);
      try {
        const res = await fetch('/api/run/finance-autopilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ period: 'last_30_days', currency: 'GBP' })
        });
        const data = await res.json();
        setFinance(data.result?.output || null);
      } catch (e) {
        setFinance(null);
      } finally {
        setLoading(false);
      }
    }
    fetchFinance();
  }, []);
  return { finance, loading };
}

function useInsightsData() {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchInsights() {
      setLoading(true);
      try {
        const res = await fetch('/api/run/auto-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metricSource: 'shopify_analytics', period: 'last_7_days' })
        });
        const data = await res.json();
        setInsight(data.result?.output || null);
      } catch (e) {
        setInsight(null);
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, []);
  return { insight, loading };
}


function Reports() {
  // Old stats (products, SEO, etc.)
  const [stats, setStats] = useState({
    products: null,
    seoIssues: null,
    automations: null,
    traffic: null,
    lastRun: null,
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const projectId = localStorage.getItem('auraProjectId');
        let products = null, seoIssues = null, automations = null, traffic = null, lastRun = null;
        if (projectId) {
          const prodRes = await fetch(`https://aura-core-monolith.onrender.com/projects/${projectId}/drafts`);
          if (prodRes.ok) {
            const prodData = await prodRes.json();
            products = Array.isArray(prodData) ? prodData.length : (prodData.items ? prodData.items.length : null);
          }
          const fixRes = await fetch(`https://aura-core-monolith.onrender.com/projects/${projectId}/fix-queue`);
          if (fixRes.ok) {
            const fixData = await fixRes.json();
            seoIssues = fixData.counts && fixData.counts.open ? fixData.counts.open : 0;
          }
          automations = 5;
          traffic = 1200;
          lastRun = new Date().toISOString();
        }
        setStats({ products, seoIssues, automations, traffic, lastRun });
      } catch (e) {
        setStats({ products: '-', seoIssues: '-', automations: '-', traffic: '-', lastRun: '-' });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Finance and insights
  const { finance, loading: loadingFinance } = useFinanceData();
  const { insight, loading: loadingInsight } = useInsightsData();

  // Export handlers (CSV, PDF, Email)
  const handleExportCSV = () => {
    // Gather all report data
    const rows = [
      ['Metric', 'Value'],
      ['Products', stats.products],
      ['SEO Issues', stats.seoIssues],
      ['Automations', stats.automations],
      ['Traffic', stats.traffic],
      ['Last Run', stats.lastRun],
    ];
    if (finance) {
      rows.push(['Revenue', finance.revenue]);
      rows.push(['Gross Profit', finance.grossProfit]);
      rows.push(['Operating Profit', finance.operatingProfit]);
      rows.push(['Margin (%)', finance.operatingMarginPercent]);
    }
    if (insight) {
      rows.push(['Insight Metric', insight.metric]);
      rows.push(['Insight', insight.insight]);
    }
    const csv = rows.map(r => r.map(x => '"' + String(x ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aura-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleExportPDF = () => {
    // TODO: Implement real PDF export
    alert('PDF export coming soon!');
  };
  const handleScheduleEmail = () => {
    // TODO: Implement real email scheduling
    alert('Email scheduling coming soon!');
  };

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: 32, marginBottom: 18 }}>Reports & Insights</h2>
      <div style={{ color: 'var(--text-primary)', fontSize: 18, marginBottom: 12 }}>
        Actionable insights and downloadable reports for your store's performance.
      </div>
      <ReportExportBar onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} onScheduleEmail={handleScheduleEmail} />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 24,
        marginBottom: 40,
        width: '100%',
      }}>
        {[{ label: 'Products', value: loading ? '…' : stats.products },
          { label: 'SEO Issues', value: loading ? '…' : stats.seoIssues },
          { label: 'Automations', value: loading ? '…' : stats.automations },
          { label: 'Traffic', value: loading ? '…' : stats.traffic },
          { label: 'Last Run', value: loading ? '…' : (stats.lastRun ? new Date(stats.lastRun).toLocaleString() : '-') },
        ].map((stat, idx) => (
          <div key={stat.label} style={{
            background: 'var(--background-secondary)',
            borderRadius: '18px',
            boxShadow: '0 6px 28px rgba(0,0,0,0.10)',
            padding: '32px 22px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.18s, box-shadow 0.18s, background 0.18s',
            cursor: 'pointer',
            animation: `fadeInUp 0.7s cubic-bezier(.23,1.01,.32,1) both`,
          }}>
            <span style={{fontSize: '1.13em', color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '0.01em', marginBottom: 8 }}>{stat.label}</span>
            <b style={{fontSize: '1.7em', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.01em'}}>{stat.value}</b>
          </div>
        ))}
      </div>

      {/* Finance snapshot */}
      <div style={{
        background: 'var(--background-secondary)',
        borderRadius: 16,
        padding: 24,
        marginBottom: 32,
        color: 'var(--text-primary)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
        maxWidth: 540,
        marginLeft: 'auto',
        marginRight: 'auto',
        fontSize: 17,
      }}>
        <b style={{ color: 'var(--text-primary)', fontSize: 20 }}>Finance Snapshot</b><br />
        {loadingFinance ? 'Loading…' : finance ? (
          <>
            Revenue: £{finance.revenue?.toLocaleString() || '-'}<br />
            Gross Profit: £{finance.grossProfit?.toLocaleString() || '-'}<br />
            Operating Profit: £{finance.operatingProfit?.toLocaleString() || '-'}<br />
            Margin: {finance.operatingMarginPercent != null ? finance.operatingMarginPercent + '%' : '-'}<br />
          </>
        ) : 'No data.'}
      </div>

      {/* Insights summary */}
      <div style={{
        background: 'var(--background-secondary)',
        borderRadius: 16,
        padding: 24,
        marginBottom: 32,
        color: 'var(--text-primary)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
        maxWidth: 540,
        marginLeft: 'auto',
        marginRight: 'auto',
        fontSize: 17,
      }}>
        <b style={{ color: 'var(--text-primary)', fontSize: 20 }}>Insights</b><br />
        {loadingInsight ? 'Loading…' : insight ? (
          <>
            <b>{insight.metric?.toUpperCase() || ''}:</b> {insight.insight || '-'}
          </>
        ) : 'No data.'}
      </div>

      <Suspense fallback={<div style={{color:'#6366f1'}}>Loading charts…</div>}>
        <DashboardCharts />
      </Suspense>
      <div style={{
        marginTop: 36,
        background: 'var(--background-tertiary)',
        color: 'var(--text-primary)',
        borderRadius: 12,
        padding: '18px 32px',
        fontWeight: 700,
        fontSize: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
        textAlign: 'center',
        letterSpacing: '0.01em',
        maxWidth: 540,
        marginLeft: 'auto',
        marginRight: 'auto',
        animation: 'fadeIn 1.1s cubic-bezier(.23,1.01,.32,1) both',
      }}>
        Note: Data updates every 24 hours. Export and scheduling features coming soon.
      </div>
    </div>
  );
}

export default Reports;