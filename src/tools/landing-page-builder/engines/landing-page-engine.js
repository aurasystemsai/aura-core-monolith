'use strict';
const PAGES = [
  {id:'lp1',name:'Summer Sale 2026',slug:'summer-sale-2026',status:'published',visitors:8420,conversions:842,conversionRate:0.10,revenue:42100,template:'sale',publishedAt:'2026-07-01T08:00:00Z'},
  {id:'lp2',name:'Eco Hoodie Launch',slug:'eco-hoodie',status:'published',visitors:4820,conversions:384,conversionRate:0.08,revenue:23040,template:'product',publishedAt:'2026-07-10T09:00:00Z'},
  {id:'lp3',name:'Newsletter Signup',slug:'newsletter',status:'published',visitors:12840,conversions:2840,conversionRate:0.22,revenue:0,template:'lead-gen',publishedAt:'2026-06-01T10:00:00Z'},
  {id:'lp4',name:'Black Friday Teaser',slug:'black-friday-2026',status:'draft',visitors:0,conversions:0,conversionRate:0,revenue:0,template:'countdown',publishedAt:null},
];
const TEMPLATES = [
  {id:'t1',name:'Flash Sale',category:'sale',description:'Countdown timer, urgency copy, single CTA'},
  {id:'t2',name:'Product Launch',category:'product',description:'Hero image, feature highlights, social proof'},
  {id:'t3',name:'Lead Generation',category:'lead-gen',description:'Email capture with lead magnet offer'},
  {id:'t4',name:'Countdown Landing',category:'countdown',description:'Pre-launch hype with countdown timer'},
  {id:'t5',name:'Lookbook',category:'editorial',description:'Visual-first editorial story with shop CTAs'},
];
const BLOCKS = ['hero','headline','countdown','video','product-grid','testimonials','email-signup','faq','cta-button','image-text','social-proof','trust-badges'];
class LandingPageEngine {
  getPages(opts = {}) { let p = PAGES; if (opts.status) p = p.filter(x => x.status === opts.status); return p; }
  getPage(id) { return PAGES.find(p => p.id === id) || null; }
  getTemplates() { return TEMPLATES; }
  getBlocks() { return BLOCKS; }
  getDashboardStats() {
    const pub = PAGES.filter(p => p.status === 'published');
    return { totalPages: PAGES.length, publishedPages: pub.length, draftPages: PAGES.filter(p => p.status === 'draft').length, totalVisitors: pub.reduce((s, p) => s + p.visitors, 0), totalConversions: pub.reduce((s, p) => s + p.conversions, 0), avgConversionRate: parseFloat((pub.reduce((s, p) => s + p.conversionRate, 0) / pub.length).toFixed(3)), totalRevenue: pub.reduce((s, p) => s + p.revenue, 0), templatesAvailable: TEMPLATES.length };
  }
  generateCopy(templateId, productName, keywords = []) {
    return { templateId, productName, headline: 'Discover ' + productName + ' — ' + (keywords[0] || 'Limited Time'), subheadline: 'Join 10,000+ customers who love our ' + productName, cta: 'Shop Now', urgencyCopy: 'Only available while stocks last', socialProof: '4.8/5 from 2,840 customers', generatedAt: new Date().toISOString() };
  }
}
module.exports = new LandingPageEngine();
module.exports.LandingPageEngine = LandingPageEngine;
