'use strict';
const NEWSLETTERS = [
  {id:'nl1',subject:'Our July Bestsellers + Exclusive Members Offer',status:'sent',sentAt:'2026-07-21T09:00:00Z',recipients:28420,opened:11368,openRate:0.40,clicked:2842,clickRate:0.10,unsubscribed:28,revenue:8420},
  {id:'nl2',subject:'The Eco Edit: Summer Picks Curated By Our Team',status:'sent',sentAt:'2026-07-14T09:00:00Z',recipients:27980,opened:9793,openRate:0.35,clicked:2518,clickRate:0.09,unsubscribed:14,revenue:6840},
  {id:'nl3',subject:'Behind the Brand: How We Made Our Summer Collection',status:'scheduled',scheduledFor:'2026-07-28T09:00:00Z',recipients:28500,opened:0,openRate:0,clicked:0,clickRate:0,unsubscribed:0,revenue:0},
  {id:'nl4',subject:'Flash Sale Starts Tomorrow',status:'draft',sentAt:null,recipients:0,opened:0,openRate:0,clicked:0,clickRate:0,unsubscribed:0,revenue:0},
];
const SUBSCRIBERS = { total: 28500, active: 27840, unsubscribed: 660, growthMoM: 0.042, avgEngagementScore: 0.62 };
const SEGMENTS = [
  {id:'seg1',name:'High Engagers',criteria:'open_rate > 0.5',count:8420},
  {id:'seg2',name:'Purchasers Only',criteria:'orders_count > 0',count:18420},
  {id:'seg3',name:'New Subscribers (< 30 days)',criteria:'subscribed_days < 30',count:2840},
  {id:'seg4',name:'Inactive (> 60 days no open)',criteria:'last_open_days > 60',count:4820},
];
class NewsletterEngine {
  getNewsletters(opts = {}) { let n = NEWSLETTERS; if (opts.status) n = n.filter(x => x.status === opts.status); return n; }
  getNewsletter(id) { return NEWSLETTERS.find(n => n.id === id) || null; }
  getSubscriberStats() { return SUBSCRIBERS; }
  getSegments() { return SEGMENTS; }
  getDashboardStats() {
    const sent = NEWSLETTERS.filter(n => n.status === 'sent');
    return { totalNewsletters: NEWSLETTERS.length, sentNewsletters: sent.length, scheduledNewsletters: NEWSLETTERS.filter(n => n.status === 'scheduled').length, totalSubscribers: SUBSCRIBERS.total, avgOpenRate: parseFloat((sent.reduce((s, n) => s + n.openRate, 0) / sent.length).toFixed(3)), avgClickRate: parseFloat((sent.reduce((s, n) => s + n.clickRate, 0) / sent.length).toFixed(3)), totalRevenue: sent.reduce((s, n) => s + n.revenue, 0), subscriberGrowthMoM: SUBSCRIBERS.growthMoM };
  }
  generateSubjectLines(topic, count = 5) {
    const lines = ['5 things you didn\'t know about ' + topic, 'The ' + topic + ' edit you\'ve been waiting for', 'Our team\'s favourite ' + topic + ' picks', 'Why everyone is talking about ' + topic, 'Your ' + topic + ' guide, curated for you'];
    return { topic, suggestions: lines.slice(0, count), tip: 'Subject lines under 50 characters perform 12% better on mobile', generatedAt: new Date().toISOString() };
  }
}
module.exports = new NewsletterEngine();
module.exports.NewsletterEngine = NewsletterEngine;
