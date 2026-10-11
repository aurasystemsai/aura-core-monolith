'use strict';
const COMPETITORS = [
  {id:'c1',name:'EcoThreads',domain:'ecothreads.co.uk',status:'tracked',monthlyTraffic:284000,domainAuthority:42,topKeywords:['eco fashion','sustainable hoodie','organic cotton'],avgPrice:48.00,lastScanned:'2026-07-26T06:00:00Z'},
  {id:'c2',name:'GreenWear',domain:'greenwear.com',status:'tracked',monthlyTraffic:184000,domainAuthority:38,topKeywords:['sustainable fashion','eco clothing'],avgPrice:52.00,lastScanned:'2026-07-26T06:00:00Z'},
  {id:'c3',name:'NatureFit',domain:'naturefit.co.uk',status:'tracked',monthlyTraffic:92000,domainAuthority:31,topKeywords:['ethical fashion','organic hoodie'],avgPrice:44.00,lastScanned:'2026-07-25T06:00:00Z'},
  {id:'c4',name:'PureThread',domain:'purethread.com',status:'not_tracked',monthlyTraffic:48000,domainAuthority:28,topKeywords:['pure cotton','natural fashion'],avgPrice:39.00,lastScanned:null},
];
const KEYWORD_GAPS = [
  {keyword:'recycled polyester jacket',myRank:null,topCompetitor:'EcoThreads',competitorRank:2,volume:4820,difficulty:0.44,opportunity:'high'},
  {keyword:'sustainable gift sets',myRank:null,topCompetitor:'GreenWear',competitorRank:3,volume:2840,difficulty:0.38,opportunity:'high'},
  {keyword:'eco friendly activewear',myRank:8,topCompetitor:'NatureFit',competitorRank:1,volume:8420,difficulty:0.58,opportunity:'medium'},
];
class CompetitiveEngine {
  getCompetitors(opts = {}) { let c = COMPETITORS; if (opts.status) c = c.filter(x => x.status === opts.status); return c; }
  getCompetitor(id) { return COMPETITORS.find(c => c.id === id) || null; }
  getKeywordGaps() { return KEYWORD_GAPS; }
  getDashboardStats() {
    const tracked = COMPETITORS.filter(c => c.status === 'tracked');
    return { totalCompetitors: COMPETITORS.length, trackedCompetitors: tracked.length, keywordGapOpportunities: KEYWORD_GAPS.filter(k => k.opportunity === 'high').length, avgCompetitorTraffic: Math.round(tracked.reduce((s, c) => s + c.monthlyTraffic, 0) / tracked.length), avgCompetitorDa: Math.round(tracked.reduce((s, c) => s + c.domainAuthority, 0) / tracked.length) };
  }
  analyzePricing() {
    const prices = COMPETITORS.filter(c => c.avgPrice).map(c => ({ name: c.name, avgPrice: c.avgPrice }));
    const avg = prices.reduce((s, c) => s + c.avgPrice, 0) / prices.length;
    return { myPrice: 48.00, competitorAvg: parseFloat(avg.toFixed(2)), positioning: 48.00 < avg ? 'below market average' : 'above market average', competitors: prices };
  }
}
module.exports = new CompetitiveEngine();
module.exports.CompetitiveEngine = CompetitiveEngine;
