'use strict';
const INSIGHTS = [
  {id:'i1',type:'anomaly',severity:'high',title:'Revenue spike detected',detail:'Revenue on 2026-07-24 was £28,420 — 142% above your 30-day average of £11,740. Driven by viral TikTok post.',metric:'revenue',change:'+142%',detectedAt:'2026-07-25T06:00:00Z',actionable:true,action:'Restock Eco Hoodie Navy (12 units remaining)'},
  {id:'i2',type:'trend',severity:'medium',title:'Email open rate declining',detail:'Your email open rate has dropped from 42% to 35% over the last 4 weeks.',metric:'email_open_rate',change:'-7pp',detectedAt:'2026-07-26T06:00:00Z',actionable:true,action:'A/B test new subject line formats'},
  {id:'i3',type:'opportunity',severity:'medium',title:'Win-back segment growing',detail:'284 customers have not purchased in 60+ days. Their LTV average is £248.',metric:'lapsed_customers',change:'+12%',detectedAt:'2026-07-26T06:00:00Z',actionable:true,action:'Launch win-back campaign'},
  {id:'i4',type:'risk',severity:'high',title:'3 SKUs at stockout risk',detail:'Eco Hoodie (Navy M), Organic Tee (White S), Recycled Jogger (Grey L) will stock out within 7 days.',metric:'inventory',change:'-',detectedAt:'2026-07-26T06:00:00Z',actionable:true,action:'Trigger restock purchase orders'},
  {id:'i5',type:'anomaly',severity:'low',title:'Cart abandonment rate improved',detail:'Cart abandonment rate dropped from 72% to 68% following the checkout UX update.',metric:'cart_abandonment',change:'-4pp',detectedAt:'2026-07-26T06:00:00Z',actionable:false,action:null},
];
const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };
class AutoInsightsEngine {
  getInsights(opts = {}) {
    let i = INSIGHTS;
    if (opts.type) i = i.filter(x => x.type === opts.type);
    if (opts.severity) i = i.filter(x => x.severity === opts.severity);
    if (opts.actionable === 'true') i = i.filter(x => x.actionable);
    return i.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  }
  getInsight(id) { return INSIGHTS.find(i => i.id === id) || null; }
  getDashboardStats() {
    return { totalInsights: INSIGHTS.length, highSeverity: INSIGHTS.filter(i => i.severity === 'high').length, actionableInsights: INSIGHTS.filter(i => i.actionable).length, anomalies: INSIGHTS.filter(i => i.type === 'anomaly').length, opportunities: INSIGHTS.filter(i => i.type === 'opportunity').length, risks: INSIGHTS.filter(i => i.type === 'risk').length, lastGeneratedAt: '2026-07-26T06:00:00Z' };
  }
  generateInsight(metric, data) {
    return { metric, insight: 'Based on your ' + metric + ' data, I\'ve identified a significant pattern that warrants attention.', confidence: 0.84, generatedAt: new Date().toISOString() };
  }
}
module.exports = new AutoInsightsEngine();
module.exports.AutoInsightsEngine = AutoInsightsEngine;
