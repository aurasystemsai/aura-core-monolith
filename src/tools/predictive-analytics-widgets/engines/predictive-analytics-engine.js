'use strict';
const WIDGETS = [
  {id:'w1',name:'Revenue Forecast',type:'forecast',category:'revenue',value:184200,forecastValue:212000,trend:'+15.1%',confidence:0.87,dataPoints:[128400,134200,142800,148200,156400,162800,168400,176200,184200],labels:['Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul'],updatedAt:'2026-07-26T06:00:00Z'},
  {id:'w2',name:'Customer LTV Distribution',type:'distribution',category:'customers',buckets:[{label:'£0-50',count:4820},{label:'£51-150',count:8420},{label:'£151-300',count:6240},{label:'£301-500',count:3840},{label:'£500+',count:2840}],updatedAt:'2026-07-26T06:00:00Z'},
  {id:'w3',name:'Churn Probability Heatmap',type:'heatmap',category:'retention',cells:[{segment:'New (0-30d)',low:0.38,medium:0.32,high:0.30},{segment:'Active (31-90d)',low:0.62,medium:0.24,high:0.14},{segment:'At-Risk (91-180d)',low:0.18,medium:0.42,high:0.40},{segment:'Lapsed (180d+)',low:0.08,medium:0.18,high:0.74}],updatedAt:'2026-07-26T06:00:00Z'},
  {id:'w4',name:'Product Affinity Map',type:'affinity',category:'products',pairs:[{product1:'Eco Hoodie',product2:'Organic Tee',affinityScore:0.72,coPurchaseRate:0.42},{product1:'Eco Hoodie',product2:'Recycled Jogger',affinityScore:0.64,coPurchaseRate:0.38},{product1:'Organic Tee',product2:'Canvas Tote',affinityScore:0.58,coPurchaseRate:0.34}],updatedAt:'2026-07-26T06:00:00Z'},
  {id:'w5',name:'Acquisition Channel ROI',type:'bar',category:'marketing',bars:[{channel:'Email',roi:8.2,spend:2400,revenue:19680},{channel:'Google',roi:5.8,spend:4800,revenue:27840},{channel:'Meta',roi:4.2,spend:6400,revenue:26880},{channel:'TikTok',roi:3.8,spend:2800,revenue:10640},{channel:'Organic',roi:null,spend:0,revenue:48400}],updatedAt:'2026-07-26T06:00:00Z'},
];
const WIDGET_CATALOG = [
  {id:'revenue-forecast',name:'Revenue Forecast',category:'revenue',description:'ML-powered 90-day revenue projection with confidence bands'},
  {id:'ltv-distribution',name:'Customer LTV Distribution',category:'customers',description:'Histogram of customer lifetime values by bucket'},
  {id:'churn-heatmap',name:'Churn Probability Heatmap',category:'retention',description:'Churn risk by segment and recency cohort'},
  {id:'product-affinity',name:'Product Affinity Map',category:'products',description:'Which products are frequently bought together'},
  {id:'channel-roi',name:'Channel ROI Comparison',category:'marketing',description:'Revenue and ROI by acquisition/marketing channel'},
  {id:'cohort-retention',name:'Cohort Retention Grid',category:'retention',description:'Monthly cohort retention rates D7/D30/D90'},
  {id:'rfm-scatter',name:'RFM Scatter Plot',category:'customers',description:'Recency vs Frequency vs Monetary value bubble chart'},
  {id:'inventory-velocity',name:'Inventory Velocity',category:'operations',description:'Product sell-through rates with restock predictions'},
];
class PredictiveAnalyticsEngine {
  getWidgets(opts = {}) { let w = WIDGETS; if (opts.category) w = w.filter(x => x.category === opts.category); return w; }
  getWidget(id) { return WIDGETS.find(w => w.id === id) || null; }
  getWidgetCatalog() { return WIDGET_CATALOG; }
  getDashboardStats() {
    return { totalWidgets: WIDGETS.length, catalogWidgets: WIDGET_CATALOG.length, categories: [...new Set(WIDGET_CATALOG.map(w => w.category))].length, revenueforecast: 212000, forecastConfidence: 0.87, lastModelRunAt: '2026-07-26T06:00:00Z' };
  }
  runForecast(metric, horizon = 90) {
    return { metric, horizon, forecast: Array.from({ length: Math.ceil(horizon / 30) }, (_, i) => ({ month: i + 1, value: Math.round(180000 * (1 + (i + 1) * 0.08)), lower: Math.round(180000 * (1 + (i + 1) * 0.04)), upper: Math.round(180000 * (1 + (i + 1) * 0.12)) })), confidence: 0.84, model: 'prophet', generatedAt: new Date().toISOString() };
  }
}
module.exports = new PredictiveAnalyticsEngine();
module.exports.PredictiveAnalyticsEngine = PredictiveAnalyticsEngine;
