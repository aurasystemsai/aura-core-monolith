'use strict';
const SUBSCRIPTIONS = [
  {id:'sub1',customerId:'C-001',customerEmail:'jane@example.com',planName:'Monthly Box',status:'active',price:29.99,billingCycle:'monthly',nextBillingDate:'2026-08-15',startDate:'2026-01-15',totalRevenue:209.93,pauseCount:0},
  {id:'sub2',customerId:'C-002',customerEmail:'marcus@example.com',planName:'Quarterly Box',status:'active',price:79.99,billingCycle:'quarterly',nextBillingDate:'2026-10-01',startDate:'2025-10-01',totalRevenue:319.96,pauseCount:1},
  {id:'sub3',customerId:'C-003',customerEmail:'sarah@example.com',planName:'Monthly Box',status:'paused',price:29.99,billingCycle:'monthly',nextBillingDate:null,startDate:'2026-03-20',pauseDate:'2026-07-01',pauseCount:1},
  {id:'sub4',customerId:'C-004',customerEmail:'priya@example.com',planName:'Annual Box',status:'active',price:249.99,billingCycle:'annual',nextBillingDate:'2027-01-10',startDate:'2026-01-10',totalRevenue:249.99,pauseCount:0},
  {id:'sub5',customerId:'C-005',customerEmail:'oliver@example.com',planName:'Monthly Box',status:'cancelled',price:29.99,billingCycle:'monthly',nextBillingDate:null,cancelDate:'2026-06-15',cancelReason:'Too expensive',totalRevenue:179.94,pauseCount:0},
];
const PLANS = [
  {id:'p1',name:'Monthly Box',price:29.99,cycle:'monthly',activeSubscribers:284,mrr:8513.16},
  {id:'p2',name:'Quarterly Box',price:79.99,cycle:'quarterly',activeSubscribers:184,mrr:4919.38},
  {id:'p3',name:'Annual Box',price:249.99,cycle:'annual',activeSubscribers:92,mrr:1916.58},
];
class SubscriptionEngine {
  getSubscriptions(opts = {}) { let s = SUBSCRIPTIONS; if (opts.status) s = s.filter(x => x.status === opts.status); return s; }
  getSubscription(id) { return SUBSCRIPTIONS.find(s => s.id === id) || null; }
  getPlans() { return PLANS; }
  getChurnReasons() {
    return [{reason:'Too expensive',count:42,pct:0.34},{reason:'Do not need product',count:28,pct:0.23},{reason:'Poor quality',count:18,pct:0.14},{reason:'Moving abroad',count:12,pct:0.10},{reason:'Other',count:24,pct:0.19}];
  }
  getDashboardStats() {
    const active = SUBSCRIPTIONS.filter(s => s.status === 'active');
    const mrr = PLANS.reduce((s, p) => s + p.mrr, 0);
    return {
      totalSubscriptions: SUBSCRIPTIONS.length,
      activeSubscriptions: active.length,
      pausedSubscriptions: SUBSCRIPTIONS.filter(s => s.status === 'paused').length,
      cancelledSubscriptions: SUBSCRIPTIONS.filter(s => s.status === 'cancelled').length,
      totalMrr: parseFloat(mrr.toFixed(2)),
      totalArr: parseFloat((mrr * 12).toFixed(2)),
      avgLtv: parseFloat((active.reduce((s, x) => s + x.totalRevenue, 0) / active.length).toFixed(2)),
      churnRate: 0.042,
    };
  }
  pauseSubscription(id, reason) { const s = this.getSubscription(id); if (!s) return { error: 'Subscription not found' }; return { subscriptionId: id, status: 'paused', pausedAt: new Date().toISOString(), reason }; }
  cancelSubscription(id, reason) { const s = this.getSubscription(id); if (!s) return { error: 'Subscription not found' }; return { subscriptionId: id, status: 'cancelled', cancelledAt: new Date().toISOString(), reason }; }
  resumeSubscription(id) { const s = this.getSubscription(id); if (!s) return { error: 'Subscription not found' }; return { subscriptionId: id, status: 'active', resumedAt: new Date().toISOString() }; }
}
module.exports = new SubscriptionEngine();
module.exports.SubscriptionEngine = SubscriptionEngine;
