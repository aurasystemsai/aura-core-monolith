'use strict';
const DASHBOARDS = [
  {id:'db1',name:'Revenue Overview',owner:'admin@brand.com',isPublic:false,widgets:['revenue-chart','orders-count','aov','conversion-rate','top-products'],layout:'2x2',createdAt:'2026-06-01T10:00:00Z'},
  {id:'db2',name:'Marketing Performance',owner:'marketing@brand.com',isPublic:true,widgets:['ad-spend','roas','email-open-rate','social-followers','traffic-sources'],layout:'3x2',createdAt:'2026-06-15T09:00:00Z'},
  {id:'db3',name:'Operations Daily',owner:'ops@brand.com',isPublic:false,widgets:['inventory-levels','pending-orders','returns-rate','support-tickets'],layout:'2x3',createdAt:'2026-07-01T08:00:00Z'},
];
const WIDGET_CATALOG = [
  {id:'revenue-chart',name:'Revenue Over Time',category:'revenue',chartType:'line',description:'Daily/weekly/monthly revenue trend'},
  {id:'orders-count',name:'Orders Count',category:'revenue',chartType:'metric',description:'Total orders in selected period'},
  {id:'aov',name:'Average Order Value',category:'revenue',chartType:'metric',description:'Mean order value with trend'},
  {id:'conversion-rate',name:'Conversion Rate',category:'marketing',chartType:'gauge',description:'Store CVR with benchmark'},
  {id:'top-products',name:'Top Products',category:'products',chartType:'table',description:'Best selling products by revenue'},
  {id:'ad-spend',name:'Ad Spend',category:'marketing',chartType:'metric',description:'Total ad spend across channels'},
  {id:'roas',name:'ROAS',category:'marketing',chartType:'metric',description:'Return on ad spend by channel'},
  {id:'email-open-rate',name:'Email Open Rate',category:'marketing',chartType:'metric',description:'Average email open rate'},
  {id:'inventory-levels',name:'Inventory Levels',category:'operations',chartType:'table',description:'Low stock alerts'},
  {id:'pending-orders',name:'Pending Orders',category:'operations',chartType:'metric',description:'Orders awaiting fulfilment'},
  {id:'returns-rate',name:'Returns Rate',category:'operations',chartType:'metric',description:'Return rate with period comparison'},
  {id:'support-tickets',name:'Support Tickets',category:'support',chartType:'metric',description:'Open support conversations'},
];
class DashboardBuilderEngine {
  getDashboards(opts = {}) { let d = DASHBOARDS; if (opts.owner) d = d.filter(x => x.owner === opts.owner); return d; }
  getDashboard(id) { return DASHBOARDS.find(d => d.id === id) || null; }
  getWidgetCatalog(opts = {}) { let w = WIDGET_CATALOG; if (opts.category) w = w.filter(x => x.category === opts.category); return w; }
  getDashboardStats() { return { totalDashboards: DASHBOARDS.length, publicDashboards: DASHBOARDS.filter(d => d.isPublic).length, widgetsAvailable: WIDGET_CATALOG.length, widgetCategories: [...new Set(WIDGET_CATALOG.map(w => w.category))].length }; }
  getWidgetData(widgetId) {
    const meta = WIDGET_CATALOG.find(w => w.id === widgetId);
    if (!meta) return { error: 'Widget not found' };
    return { ...meta, value: 42840, trend: '+12%', period: 'last 30 days', updatedAt: new Date().toISOString() };
  }
}
module.exports = new DashboardBuilderEngine();
module.exports.DashboardBuilderEngine = DashboardBuilderEngine;
