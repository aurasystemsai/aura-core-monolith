'use strict';
const AFFILIATES = [
  {id:'aff1',name:'StyleWithSarah',email:'sarah@stylebook.io',status:'active',tier:'gold',commissionRate:0.12,clicks:28420,conversions:1840,revenue:92000,commission:11040,joinedAt:'2026-01-15T00:00:00Z'},
  {id:'aff2',name:'EcoFashionBlog',email:'hello@ecofashion.co.uk',status:'active',tier:'silver',commissionRate:0.10,clicks:18420,conversions:920,revenue:46000,commission:4600,joinedAt:'2026-02-20T00:00:00Z'},
  {id:'aff3',name:'LuxeLifestyleTV',email:'partner@luxetv.com',status:'active',tier:'platinum',commissionRate:0.15,clicks:84200,conversions:8420,revenue:421000,commission:63150,joinedAt:'2025-11-01T00:00:00Z'},
  {id:'aff4',name:'TrendSetterMag',email:'ads@trendsetter.com',status:'inactive',tier:'silver',commissionRate:0.10,clicks:4820,conversions:142,revenue:7100,commission:710,joinedAt:'2026-04-10T00:00:00Z'},
];
const TIERS = [
  {tier:'bronze',minRevenue:0,commissionRate:0.08,perks:['Custom link','Monthly reports']},
  {tier:'silver',minRevenue:5000,commissionRate:0.10,perks:['Custom link','Weekly reports','Early access']},
  {tier:'gold',minRevenue:20000,commissionRate:0.12,perks:['Custom link','Real-time dashboard','Product samples']},
  {tier:'platinum',minRevenue:100000,commissionRate:0.15,perks:['Custom link','Real-time dashboard','Product samples','Dedicated manager']},
];
const PAYOUTS = [
  {id:'pay1',affiliateId:'aff3',amount:21050,status:'paid',period:'2026-06',paidAt:'2026-07-05T00:00:00Z'},
  {id:'pay2',affiliateId:'aff1',amount:3680,status:'paid',period:'2026-06',paidAt:'2026-07-05T00:00:00Z'},
  {id:'pay3',affiliateId:'aff3',amount:42100,status:'pending',period:'2026-07',paidAt:null},
];
class AffiliateEngine {
  getAffiliates(opts = {}) { let a = AFFILIATES; if (opts.status) a = a.filter(x => x.status === opts.status); if (opts.tier) a = a.filter(x => x.tier === opts.tier); return a; }
  getAffiliate(id) { return AFFILIATES.find(a => a.id === id) || null; }
  getTiers() { return TIERS; }
  getPayouts(affiliateId) { return affiliateId ? PAYOUTS.filter(p => p.affiliateId === affiliateId) : PAYOUTS; }
  getDashboardStats() {
    const active = AFFILIATES.filter(a => a.status === 'active');
    return { totalAffiliates: AFFILIATES.length, activeAffiliates: active.length, totalClicks: active.reduce((s, a) => s + a.clicks, 0), totalConversions: active.reduce((s, a) => s + a.conversions, 0), totalRevenue: active.reduce((s, a) => s + a.revenue, 0), totalCommissionsPaid: PAYOUTS.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0), pendingPayouts: PAYOUTS.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0) };
  }
  generateAffiliateLink(affiliateId, campaignSlug) {
    const a = this.getAffiliate(affiliateId);
    if (!a) return { error: 'Affiliate not found' };
    return { affiliateId, link: 'https://brand.com/' + campaignSlug + '?ref=' + affiliateId, shortLink: 'https://go.brand.com/' + affiliateId.slice(-4), trackingCode: affiliateId, generatedAt: new Date().toISOString() };
  }
}
module.exports = new AffiliateEngine();
module.exports.AffiliateEngine = AffiliateEngine;
