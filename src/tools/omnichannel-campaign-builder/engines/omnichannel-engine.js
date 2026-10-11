'use strict';
const CAMPAIGNS = [
  {id:'oc1',name:'Summer 2026 Brand Moment',status:'active',channels:['email','sms','meta','google','tiktok','push'],startDate:'2026-07-01',endDate:'2026-07-31',budget:8400,spend:6240,revenue:52000,roas:8.33,impressions:284000,clicks:18400,conversions:1840,segmentId:'seg4',createdAt:'2026-06-28T10:00:00Z'},
  {id:'oc2',name:'Win-Back Lapsed Q2',status:'completed',channels:['email','sms'],startDate:'2026-06-01',endDate:'2026-06-30',budget:2400,spend:2400,revenue:18420,roas:7.68,impressions:48000,clicks:4820,conversions:420,segmentId:'seg5',createdAt:'2026-05-28T10:00:00Z'},
  {id:'oc3',name:'Black Friday 2026 Build-Up',status:'draft',channels:['email','sms','meta','google','tiktok'],startDate:'2026-10-01',endDate:'2026-12-01',budget:24000,spend:0,revenue:0,roas:null,impressions:0,clicks:0,conversions:0,segmentId:null,createdAt:'2026-07-25T14:00:00Z'},
];
const CHANNEL_CATALOG = [
  {id:'email',name:'Email',icon:'mail',avgRoas:8.2,avgOpenRate:0.38,costPer:'send',setupRequired:false},
  {id:'sms',name:'SMS',icon:'message',avgRoas:6.4,avgOpenRate:0.82,costPer:'send',setupRequired:false},
  {id:'meta',name:'Meta (FB/IG)',icon:'meta',avgRoas:4.2,avgCpc:0.84,costPer:'click',setupRequired:true},
  {id:'google',name:'Google Ads',icon:'google',avgRoas:5.8,avgCpc:0.92,costPer:'click',setupRequired:true},
  {id:'tiktok',name:'TikTok Ads',icon:'tiktok',avgRoas:3.8,avgCpc:0.48,costPer:'click',setupRequired:true},
  {id:'push',name:'Push Notifications',icon:'bell',avgRoas:5.2,avgOpenRate:0.30,costPer:'send',setupRequired:false},
  {id:'whatsapp',name:'WhatsApp',icon:'whatsapp',avgRoas:7.4,avgOpenRate:0.92,costPer:'send',setupRequired:true},
];
const JOURNEY_STEPS = [
  {day:0,channel:'email',action:'Launch announcement email to segment',subject:'Something big is coming...',note:'Teaser — no offer yet'},
  {day:0,channel:'meta',action:'Launch awareness campaign',audience:'Lookalike 1% + interest targeting'},
  {day:1,channel:'push',action:'Push notification: campaign live',title:'Your exclusive offer is here'},
  {day:2,channel:'sms',action:'SMS to non-email-openers',body:'Hi {{name}}, did you see our latest offer?'},
  {day:4,channel:'email',action:'Follow-up email to non-converters',subject:'Last chance — offer ends soon'},
  {day:6,channel:'sms',action:'Final SMS reminder',body:'Final hours! {{offer}} ends at midnight.'},
];
class OmnichannelCampaignEngine {
  getCampaigns(opts = {}) { let c = CAMPAIGNS; if (opts.status) c = c.filter(x => x.status === opts.status); return c; }
  getCampaign(id) { return CAMPAIGNS.find(c => c.id === id) || null; }
  getChannelCatalog() { return CHANNEL_CATALOG; }
  getJourneyTemplate() { return JOURNEY_STEPS; }
  getDashboardStats() {
    const active = CAMPAIGNS.filter(c => c.status === 'active');
    const completed = CAMPAIGNS.filter(c => c.status === 'completed');
    const all = [...active, ...completed];
    return {
      totalCampaigns: CAMPAIGNS.length,
      activeCampaigns: active.length,
      totalSpend: all.reduce((s, c) => s + c.spend, 0),
      totalRevenue: all.reduce((s, c) => s + c.revenue, 0),
      avgRoas: parseFloat((all.filter(c => c.roas).reduce((s, c) => s + c.roas, 0) / all.filter(c => c.roas).length).toFixed(2)),
      channelsAvailable: CHANNEL_CATALOG.length,
      totalConversions: all.reduce((s, c) => s + c.conversions, 0),
    };
  }
  generateBrief(name, channels, segmentId, budget) {
    const channelDetails = channels.map(ch => CHANNEL_CATALOG.find(c => c.id === ch)).filter(Boolean);
    const estimatedRevenue = Math.round(budget * 6.5);
    return { name, channels: channelDetails, segmentId, budget, estimatedRevenue, estimatedRoas: 6.5, journeySteps: JOURNEY_STEPS.filter(s => channels.includes(s.channel)), generatedAt: new Date().toISOString() };
  }
}
module.exports = new OmnichannelCampaignEngine();
module.exports.OmnichannelCampaignEngine = OmnichannelCampaignEngine;
