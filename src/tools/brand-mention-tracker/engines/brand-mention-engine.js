'use strict';
const MENTIONS = [
  {id:'m1',brand:'YourBrand',source:'twitter',url:'https://twitter.com/user1/status/12345',text:'Just received my eco hoodie from @YourBrand and the quality is incredible! Sustainable AND stylish.',sentiment:'positive',sentimentScore:0.92,reach:4820,author:'@StyleSarah',authorFollowers:18400,detectedAt:'2026-07-26T14:00:00Z',topic:'product-quality'},
  {id:'m2',brand:'YourBrand',source:'reddit',url:'https://reddit.com/r/sustainability/12346',text:'Has anyone tried YourBrand? Looking for eco-friendly hoodie recommendations.',sentiment:'neutral',sentimentScore:0.50,reach:2840,author:'u/GreenFashionFan',authorFollowers:null,detectedAt:'2026-07-26T12:00:00Z',topic:'recommendation'},
  {id:'m3',brand:'YourBrand',source:'instagram',url:'https://instagram.com/p/12347',text:'Unboxing my new @YourBrand order -- packaging is 100% plastic free! 10/10',sentiment:'positive',sentimentScore:0.96,reach:12400,author:'@EcoLifeDaily',authorFollowers:84000,detectedAt:'2026-07-26T10:00:00Z',topic:'packaging'},
  {id:'m4',brand:'YourBrand',source:'trustpilot',url:'https://trustpilot.com/review/12348',text:'Delivery took 8 days — much longer than expected. Product itself is great but communication was poor.',sentiment:'negative',sentimentScore:0.22,reach:480,author:'Marcus T.',authorFollowers:null,detectedAt:'2026-07-25T18:00:00Z',topic:'delivery'},
  {id:'m5',brand:'YourBrand',source:'youtube',url:'https://youtube.com/watch?v=12349',text:'Full review: YourBrand eco hoodies — are they worth it? (Spoiler: YES)',sentiment:'positive',sentimentScore:0.88,reach:28400,author:'LuxeLifestyleTV',authorFollowers:284000,detectedAt:'2026-07-25T09:00:00Z',topic:'review'},
];
const ALERTS = [
  {id:'a1',type:'high_reach',severity:'high',message:'Influencer with 284K followers mentioned YourBrand',mentionId:'m5',createdAt:'2026-07-25T09:05:00Z',actioned:false},
  {id:'a2',type:'negative',severity:'medium',message:'Negative Trustpilot review detected',mentionId:'m4',createdAt:'2026-07-25T18:05:00Z',actioned:false},
];
const SENTIMENT_TREND = [
  {date:'2026-07-20',positive:28,neutral:8,negative:4,total:40},
  {date:'2026-07-21',positive:32,neutral:6,negative:2,total:40},
  {date:'2026-07-22',positive:24,neutral:10,negative:6,total:40},
  {date:'2026-07-23',positive:36,neutral:8,negative:2,total:46},
  {date:'2026-07-24',positive:42,neutral:12,negative:4,total:58},
  {date:'2026-07-25',positive:38,neutral:10,negative:8,total:56},
  {date:'2026-07-26',positive:44,neutral:14,negative:6,total:64},
];
const SOURCES = ['twitter','instagram','reddit','youtube','trustpilot','google','news'];
class BrandMentionEngine {
  getMentions(opts = {}) {
    let m = MENTIONS;
    if (opts.source) m = m.filter(x => x.source === opts.source);
    if (opts.sentiment) m = m.filter(x => x.sentiment === opts.sentiment);
    if (opts.topic) m = m.filter(x => x.topic === opts.topic);
    return m.sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt));
  }
  getMention(id) { return MENTIONS.find(m => m.id === id) || null; }
  getAlerts() { return ALERTS; }
  getSentimentTrend() { return SENTIMENT_TREND; }
  getSources() { return SOURCES; }
  getDashboardStats() {
    const pos = MENTIONS.filter(m => m.sentiment === 'positive');
    const neg = MENTIONS.filter(m => m.sentiment === 'negative');
    return {
      totalMentions: MENTIONS.length,
      positiveMentions: pos.length,
      negativeMentions: neg.length,
      neutralMentions: MENTIONS.filter(m => m.sentiment === 'neutral').length,
      sentimentScore: parseFloat((MENTIONS.reduce((s, m) => s + m.sentimentScore, 0) / MENTIONS.length).toFixed(2)),
      totalReach: MENTIONS.reduce((s, m) => s + m.reach, 0),
      openAlerts: ALERTS.filter(a => !a.actioned).length,
      sourcesMonitored: SOURCES.length,
    };
  }
}
module.exports = new BrandMentionEngine();
module.exports.BrandMentionEngine = BrandMentionEngine;
