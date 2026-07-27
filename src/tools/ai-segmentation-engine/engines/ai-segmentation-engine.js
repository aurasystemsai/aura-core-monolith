'use strict';
const SEGMENTS = [
  {id:'seg1',name:'High-Value VIPs',description:'Customers with LTV > £500, purchased 3+ times',size:2840,avgLtv:820,avgOrderValue:148,churnRisk:0.08,status:'active',lastUpdated:'2026-07-26T06:00:00Z',tags:['vip','high-ltv','low-churn']},
  {id:'seg2',name:'At-Risk Churners',description:'Active customers with no purchase in 60+ days, historically high frequency',size:1840,avgLtv:280,avgOrderValue:92,churnRisk:0.72,status:'active',lastUpdated:'2026-07-26T06:00:00Z',tags:['churn-risk','re-engagement']},
  {id:'seg3',name:'New Acquistions (30d)',description:'First purchase within last 30 days',size:4820,avgLtv:48,avgOrderValue:68,churnRisk:0.42,status:'active',lastUpdated:'2026-07-26T06:00:00Z',tags:['new','onboarding']},
  {id:'seg4',name:'Eco Enthusiasts',description:'Purchased eco/sustainable products, engaged with sustainability content',size:8420,avgLtv:320,avgOrderValue:84,churnRisk:0.18,status:'active',lastUpdated:'2026-07-26T06:00:00Z',tags:['eco','values-based']},
  {id:'seg5',name:'Lapsed (90d+)',description:'No purchase in 90+ days, previously 2+ purchases',size:3840,avgLtv:220,avgOrderValue:78,churnRisk:0.88,status:'active',lastUpdated:'2026-07-26T06:00:00Z',tags:['lapsed','win-back']},
];
const SEGMENT_ATTRIBUTES = [
  {attribute:'purchase_count',label:'Purchase Count',type:'number',operators:['gt','lt','eq','gte','lte']},
  {attribute:'ltv',label:'Lifetime Value (£)',type:'number',operators:['gt','lt','gte','lte']},
  {attribute:'last_purchase_days',label:'Days Since Last Purchase',type:'number',operators:['gt','lt','gte','lte']},
  {attribute:'avg_order_value',label:'Average Order Value (£)',type:'number',operators:['gt','lt','gte','lte']},
  {attribute:'email_open_rate',label:'Email Open Rate',type:'number',operators:['gt','lt','gte','lte']},
  {attribute:'product_category',label:'Product Category Purchased',type:'enum',options:['hoodies','tees','joggers','accessories'],operators:['in','not_in']},
  {attribute:'acquisition_source',label:'Acquisition Source',type:'enum',options:['organic','paid_meta','paid_google','email','referral'],operators:['in','not_in']},
  {attribute:'location_country',label:'Country',type:'enum',options:['GB','US','DE','FR','AU'],operators:['in','not_in']},
];
class AiSegmentationEngine {
  getSegments(opts = {}) {
    let s = SEGMENTS;
    if (opts.tag) s = s.filter(x => x.tags.includes(opts.tag));
    return s;
  }
  getSegment(id) { return SEGMENTS.find(s => s.id === id) || null; }
  getAttributes() { return SEGMENT_ATTRIBUTES; }
  getDashboardStats() {
    return {
      totalSegments: SEGMENTS.length,
      totalCustomersSegmented: SEGMENTS.reduce((s, x) => s + x.size, 0),
      highChurnSegments: SEGMENTS.filter(s => s.churnRisk > 0.6).length,
      avgSegmentSize: Math.round(SEGMENTS.reduce((s, x) => s + x.size, 0) / SEGMENTS.length),
      attributesAvailable: SEGMENT_ATTRIBUTES.length,
      lastRefreshedAt: '2026-07-26T06:00:00Z',
    };
  }
  buildSegment(name, rules) {
    const estimatedSize = Math.round(28400 * (0.05 + Math.random() * 0.3));
    return { name, rules, estimatedSize, previewCustomers: estimatedSize, builtAt: new Date().toISOString() };
  }
  getSegmentInsights(segmentId) {
    const seg = this.getSegment(segmentId);
    if (!seg) return { error: 'Segment not found' };
    return { segmentId, topProducts: ['Eco Hoodie Navy', 'Organic Tee White', 'Recycled Jogger Grey'], topChannel: 'email', bestSendDay: 'Tuesday', avgSessionsPerMonth: 4.2, recommendedAction: seg.churnRisk > 0.6 ? 'Launch win-back campaign with 15% discount' : 'Upsell premium tier products' };
  }
}
module.exports = new AiSegmentationEngine();
module.exports.AiSegmentationEngine = AiSegmentationEngine;
