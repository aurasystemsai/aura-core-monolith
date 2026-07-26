'use strict';
const CAMPAIGNS = [
  {id:'sms1',name:'Flash Sale SMS',channel:'sms',status:'sent',sentAt:'2026-07-25T10:00:00Z',recipients:8420,delivered:8284,opened:6840,clicked:1840,optOuts:12,revenue:18420},
  {id:'wa1',name:'Order Confirmation WA',channel:'whatsapp',status:'active',sentAt:'2026-07-26T09:00:00Z',recipients:2840,delivered:2820,opened:2480,clicked:840,optOuts:2,revenue:4820},
  {id:'sms2',name:'Win-Back 20% Off',channel:'sms',status:'draft',sentAt:null,recipients:0,delivered:0,opened:0,clicked:0,optOuts:0,revenue:0},
  {id:'wa2',name:'Abandoned Cart WA',channel:'whatsapp',status:'active',sentAt:'2026-07-26T08:00:00Z',recipients:1240,delivered:1228,opened:980,clicked:420,optOuts:4,revenue:8420},
];
const TEMPLATES = [
  {id:'t1',name:'Order Shipped',channel:'sms',body:'Hi {{name}}, your order #{{order_id}} has shipped! Track: {{tracking_url}}',approved:true,category:'transactional'},
  {id:'t2',name:'Flash Sale Alert',channel:'sms',body:'SALE: {{discount}}% OFF for 24hrs! Use code {{code}} at checkout: {{url}}',approved:true,category:'marketing'},
  {id:'t3',name:'Order Confirmation',channel:'whatsapp',body:'Hi {{name}}! Your order for {{item_count}} item(s) totalling {{total}} is confirmed.',approved:true,category:'transactional'},
  {id:'t4',name:'Abandoned Cart',channel:'whatsapp',body:'Hi {{name}}, you left {{item_name}} in your cart! Complete: {{cart_url}}',approved:true,category:'marketing'},
];
class SmsWhatsappEngine {
  getCampaigns(opts = {}) { let c = CAMPAIGNS; if (opts.channel) c = c.filter(x => x.channel === opts.channel); return c; }
  getTemplates(opts = {}) { let t = TEMPLATES; if (opts.channel) t = t.filter(x => x.channel === opts.channel); return t; }
  getTemplate(id) { return TEMPLATES.find(t => t.id === id) || null; }
  previewMessage(templateId, sampleData = {}) {
    const t = this.getTemplate(templateId);
    if (!t) return { error: 'Template not found' };
    const preview = t.body.replace(/\{\{(\w+)\}\}/g, (_, k) => sampleData[k] || `[${k}]`);
    return { templateId, channel: t.channel, preview, charCount: preview.length, smsSegments: Math.ceil(preview.length / 160) };
  }
  getDashboardStats() {
    const sent = CAMPAIGNS.filter(c => c.status === 'sent' || c.status === 'active');
    return {
      totalCampaigns: CAMPAIGNS.length,
      smsCampaigns: CAMPAIGNS.filter(c => c.channel === 'sms').length,
      whatsappCampaigns: CAMPAIGNS.filter(c => c.channel === 'whatsapp').length,
      totalRecipients: sent.reduce((s, c) => s + c.recipients, 0),
      avgDeliveryRate: 0.986,
      avgOpenRate: 0.82,
      totalRevenue: sent.reduce((s, c) => s + c.revenue, 0),
      templatesAvailable: TEMPLATES.length,
    };
  }
}
module.exports = new SmsWhatsappEngine();
module.exports.SmsWhatsappEngine = SmsWhatsappEngine;
