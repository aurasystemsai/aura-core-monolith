'use strict';
const AB_TESTS = [
  {id:'ab1',name:'Checkout Button Color',status:'running',control:{label:'Blue Button',visitors:4820,conversions:482,rate:0.10},variant:{label:'Green Button',visitors:4840,conversions:581,rate:0.12},confidence:0.91,winner:null,startedAt:'2026-07-15T00:00:00Z'},
  {id:'ab2',name:'Product Page Hero Layout',status:'winner',control:{label:'Image Left',visitors:8420,conversions:758,rate:0.09},variant:{label:'Image Right',visitors:8400,conversions:924,rate:0.11},confidence:0.97,winner:'variant',startedAt:'2026-07-01T00:00:00Z',endedAt:'2026-07-20T00:00:00Z'},
  {id:'ab3',name:'Free Shipping Threshold Copy',status:'draft',control:{label:'Free shipping over £75'},variant:{label:'Only £X away from free shipping!'},confidence:null,winner:null,startedAt:null},
];
const HEATMAPS = [
  {page:'/products/eco-hoodie',clicks:28420,scrollDepthAvg:0.68,ragePct:0.024,sessions:2840,hotspots:[{element:'Add to Cart',clicks:8420},{element:'Product Images',clicks:12840}]},
  {page:'/cart',clicks:18420,scrollDepthAvg:0.84,ragePct:0.048,sessions:4820,hotspots:[{element:'Checkout Button',clicks:12840},{element:'Coupon Code',clicks:1840}]},
];
const FUNNEL = [
  {step:'Product View',visitors:184200,dropoffRate:0},
  {step:'Add to Cart',visitors:48420,dropoffRate:0.737},
  {step:'Checkout Start',visitors:28420,dropoffRate:0.413},
  {step:'Shipping Details',visitors:22840,dropoffRate:0.196},
  {step:'Payment',visitors:19820,dropoffRate:0.132},
  {step:'Purchase',visitors:18420,dropoffRate:0.071},
];
class CroEngine {
  getAbTests(opts = {}) { let t = AB_TESTS; if (opts.status) t = t.filter(x => x.status === opts.status); return t; }
  getAbTest(id) { return AB_TESTS.find(t => t.id === id) || null; }
  getHeatmaps() { return HEATMAPS; }
  getFunnel() { return FUNNEL; }
  getInsights() {
    return [
      { priority: 'high', page: '/cart', insight: '41% of users drop off when shipping cost is revealed', recommendation: 'Show free shipping threshold on product pages', estimatedLift: '+8% conversion' },
      { priority: 'high', page: '/checkout', insight: '13% abandon at payment — low trust signals', recommendation: 'Add security badges near checkout CTA', estimatedLift: '+4% conversion' },
    ];
  }
  getDashboardStats() {
    const overallCvr = FUNNEL[FUNNEL.length - 1].visitors / FUNNEL[0].visitors;
    return { totalAbTests: AB_TESTS.length, runningTests: AB_TESTS.filter(t => t.status === 'running').length, winnersDeclared: AB_TESTS.filter(t => t.winner).length, overallConversionRate: parseFloat(overallCvr.toFixed(4)), biggestDropoff: 'Add to Cart to Checkout (41%)', heatmapPages: HEATMAPS.length };
  }
}
module.exports = new CroEngine();
module.exports.CroEngine = CroEngine;
