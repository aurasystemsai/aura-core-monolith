'use strict';
const SUGGESTED_PROMPTS = [
  {id:'p1',category:'revenue',prompt:'What are my top 5 revenue opportunities this week?',icon:'money'},
  {id:'p2',category:'marketing',prompt:'Write me a campaign brief for a summer flash sale',icon:'megaphone'},
  {id:'p3',category:'seo',prompt:'Give me 10 long-tail keywords for my eco hoodie product page',icon:'search'},
  {id:'p4',category:'analytics',prompt:'Summarise my store performance for the last 30 days',icon:'chart'},
  {id:'p5',category:'operations',prompt:'Which SKUs are at risk of stockout in the next 2 weeks?',icon:'warehouse'},
  {id:'p6',category:'customers',prompt:'Who are my top 20% customers and how should I retain them?',icon:'people'},
];
const CONVERSATION_HISTORY = [
  {id:'msg1',role:'user',content:'What are my top revenue opportunities this week?',timestamp:'2026-07-26T09:00:00Z'},
  {id:'msg2',role:'assistant',content:'Based on your store data, your top 3 opportunities are: 1. Abandoned Cart Recovery — 284 carts worth £14,200. 2. VIP Upsell — 42 customers due for re-engagement. 3. Restock Campaign for Eco Hoodie Navy.',timestamp:'2026-07-26T09:00:02Z',tokensUsed:284,model:'gpt-4o'},
];
class AiCopilotEngine {
  getSuggestedPrompts(opts = {}) { let p = SUGGESTED_PROMPTS; if (opts.category) p = p.filter(x => x.category === opts.category); return p; }
  getConversationHistory(limit = 20) { return CONVERSATION_HISTORY.slice(-limit); }
  chat(message, shopContext = {}) {
    const responses = {
      revenue: 'Based on your store data, your abandoned cart rate is 26% higher than last month, representing approximately £14,200 in recoverable revenue. I\'d recommend activating an abandoned cart recovery sequence immediately.',
      seo: 'For your eco hoodie product page, I recommend targeting: "recycled cotton hoodie UK", "sustainable mens hoodie", "ethical hoodie brand". These have high intent and lower competition.',
      campaign: 'Here\'s a campaign brief: Target all customers who have not purchased in 60 days. Offer: 20% off with code SUMMER20. Channels: Email (Day 0), SMS (Day 0 +3hrs), Push (Day 1).',
    };
    const key = Object.keys(responses).find(k => message.toLowerCase().includes(k));
    return { message, response: responses[key] || 'I\'ve analysed your store data. Your overall conversion rate is 3.2%, above the industry average of 2.8%. Your top performing channel is email with a 40% open rate.', model: 'gpt-4o', tokensUsed: 284, creditsUsed: 2, timestamp: new Date().toISOString() };
  }
  getDashboardStats() { return { conversationsToday: 12, promptsUsed: 48, avgResponseMs: 840, topCategory: 'revenue', creditsUsedToday: 96, suggestedPromptsAvailable: SUGGESTED_PROMPTS.length }; }
}
module.exports = new AiCopilotEngine();
module.exports.AiCopilotEngine = AiCopilotEngine;
