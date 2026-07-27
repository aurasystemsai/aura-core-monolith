'use strict';
const REPORTS = [
  {id:'r1',name:'Monthly Revenue Report',type:'scheduled',status:'ready',schedule:'0 8 1 * *',lastRun:'2026-07-01T08:00:00Z',nextRun:'2026-08-01T08:00:00Z',recipients:['ceo@brand.com','finance@brand.com'],format:'pdf',rows:2840,owner:'admin@brand.com'},
  {id:'r2',name:'Weekly Marketing Dashboard',type:'scheduled',status:'ready',schedule:'0 8 * * MON',lastRun:'2026-07-21T08:00:00Z',nextRun:'2026-07-28T08:00:00Z',recipients:['marketing@brand.com'],format:'email',rows:1240,owner:'marketing@brand.com'},
  {id:'r3',name:'Ad-Hoc Customer Segment Export',type:'adhoc',status:'ready',lastRun:'2026-07-25T14:00:00Z',nextRun:null,recipients:['crm@brand.com'],format:'csv',rows:8420,owner:'crm@brand.com'},
  {id:'r4',name:'Q3 Board Pack',type:'adhoc',status:'building',lastRun:null,nextRun:null,recipients:['board@brand.com'],format:'pdf',rows:null,owner:'admin@brand.com'},
];
const QUERIES = [
  {id:'q1',name:'Top Customers by LTV',sql:'SELECT customer_id, email, SUM(order_total) as ltv FROM orders GROUP BY customer_id ORDER BY ltv DESC LIMIT 100',lastRun:'2026-07-26T09:00:00Z',rowsReturned:100,executionMs:284},
  {id:'q2',name:'Products Out of Stock',sql:'SELECT sku, title, inventory_quantity FROM products WHERE inventory_quantity = 0',lastRun:'2026-07-26T08:00:00Z',rowsReturned:3,executionMs:48},
  {id:'q3',name:'Abandoned Cart Value',sql:'SELECT COUNT(*) as carts, SUM(cart_total) as total_value FROM carts WHERE status = "abandoned" AND created_at > NOW() - INTERVAL 24 HOUR',lastRun:'2026-07-26T06:00:00Z',rowsReturned:1,executionMs:92},
];
const METRICS_CATALOG = [
  {metric:'total_revenue',label:'Total Revenue',category:'revenue',format:'currency'},
  {metric:'order_count',label:'Order Count',category:'orders',format:'number'},
  {metric:'avg_order_value',label:'Average Order Value',category:'orders',format:'currency'},
  {metric:'customer_count',label:'Total Customers',category:'customers',format:'number'},
  {metric:'new_customers',label:'New Customers',category:'customers',format:'number'},
  {metric:'repeat_purchase_rate',label:'Repeat Purchase Rate',category:'customers',format:'percent'},
  {metric:'cart_abandonment_rate',label:'Cart Abandonment Rate',category:'conversion',format:'percent'},
  {metric:'conversion_rate',label:'Conversion Rate',category:'conversion',format:'percent'},
];
class SelfServiceAnalyticsEngine {
  getReports(opts = {}) { let r = REPORTS; if (opts.type) r = r.filter(x => x.type === opts.type); return r; }
  getReport(id) { return REPORTS.find(r => r.id === id) || null; }
  getQueries() { return QUERIES; }
  getMetricsCatalog() { return METRICS_CATALOG; }
  getDashboardStats() {
    return { totalReports: REPORTS.length, scheduledReports: REPORTS.filter(r => r.type === 'scheduled').length, savedQueries: QUERIES.length, metricsAvailable: METRICS_CATALOG.length, reportsReady: REPORTS.filter(r => r.status === 'ready').length, lastReportAt: REPORTS.filter(r => r.lastRun).sort((a, b) => new Date(b.lastRun) - new Date(a.lastRun))[0]?.lastRun };
  }
  runQuery(sql) {
    return { sql, status: 'success', rowsReturned: Math.floor(Math.random() * 1000) + 1, executionMs: Math.floor(Math.random() * 500) + 50, preview: [{ id: 1, example_column: 'sample_value', metric: 42840 }], executedAt: new Date().toISOString() };
  }
  exportReport(reportId, format) {
    const r = this.getReport(reportId);
    if (!r) return { error: 'Report not found' };
    return { reportId, format: format || r.format, status: 'queued', downloadUrl: '/api/self-service-analytics/download/' + reportId, expiresAt: new Date(Date.now() + 3600000).toISOString(), queuedAt: new Date().toISOString() };
  }
}
module.exports = new SelfServiceAnalyticsEngine();
module.exports.SelfServiceAnalyticsEngine = SelfServiceAnalyticsEngine;
