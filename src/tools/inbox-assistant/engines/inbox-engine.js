'use strict';
const CONVERSATIONS = [
  {id:'cv1',customerEmail:'jane@example.com',customerName:'Jane Smith',subject:'Where is my order #12840?',status:'open',priority:'high',sentiment:'frustrated',aiSuggestedResponse:true,orderId:'#12840',createdAt:'2026-07-26T08:00:00Z',lastMessage:'2026-07-26T09:40:00Z'},
  {id:'cv2',customerEmail:'marcus@example.com',customerName:'Marcus T.',subject:'Can I return my hoodie?',status:'open',priority:'medium',sentiment:'neutral',aiSuggestedResponse:true,orderId:'#11240',createdAt:'2026-07-26T07:00:00Z',lastMessage:'2026-07-26T09:20:00Z'},
  {id:'cv3',customerEmail:'sarah@example.com',customerName:'Sarah K.',subject:'Love the new collection!',status:'closed',priority:'low',sentiment:'positive',aiSuggestedResponse:false,orderId:null,createdAt:'2026-07-25T14:00:00Z',lastMessage:'2026-07-25T15:00:00Z'},
  {id:'cv4',customerEmail:'oliver@example.com',customerName:'Oliver P.',subject:'Discount code not working',status:'open',priority:'high',sentiment:'frustrated',aiSuggestedResponse:true,orderId:null,createdAt:'2026-07-26T09:00:00Z',lastMessage:'2026-07-26T09:00:00Z'},
];
const CANNED_RESPONSES = [
  {id:'cr1',name:'Order Tracking',trigger:'where is my order',body:'Hi {{name}}, your order {{order_id}} was dispatched and should arrive by {{eta}}. Track it here: {{tracking_url}}'},
  {id:'cr2',name:'Return Policy',trigger:'return refund',body:'Hi {{name}}, we offer free returns within 30 days. Use our returns portal at returns.brand.com with your order number.'},
  {id:'cr3',name:'Discount Code Issue',trigger:'discount code',body:'Hi {{name}}, sorry to hear that! Check the code is entered correctly at checkout. If it persists, reply and I\'ll apply the discount manually.'},
];
class InboxEngine {
  getConversations(opts = {}) {
    let c = CONVERSATIONS;
    if (opts.status) c = c.filter(x => x.status === opts.status);
    if (opts.priority) c = c.filter(x => x.priority === opts.priority);
    if (opts.sentiment) c = c.filter(x => x.sentiment === opts.sentiment);
    return c;
  }
  getConversation(id) { return CONVERSATIONS.find(c => c.id === id) || null; }
  getCannedResponses() { return CANNED_RESPONSES; }
  getDashboardStats() {
    const open = CONVERSATIONS.filter(c => c.status === 'open');
    return { totalConversations: CONVERSATIONS.length, openConversations: open.length, highPriority: open.filter(c => c.priority === 'high').length, aiSuggestionsReady: open.filter(c => c.aiSuggestedResponse).length, avgResponseTimeHours: 2.4, positiveSentiment: CONVERSATIONS.filter(c => c.sentiment === 'positive').length, frustrated: open.filter(c => c.sentiment === 'frustrated').length };
  }
  suggestReply(conversationId) {
    const c = this.getConversation(conversationId);
    if (!c) return { error: 'Conversation not found' };
    const cr = CANNED_RESPONSES.find(r => c.subject.toLowerCase().includes(r.trigger.split(' ')[0]));
    return { conversationId, suggestedReply: cr ? cr.body.replace('{{name}}', c.customerName) : 'Thank you for reaching out, ' + c.customerName + '. I will look into this and get back to you within 2 hours.', cannedResponseUsed: cr ? cr.id : null, sentiment: c.sentiment, confidence: cr ? 0.92 : 0.74, generatedAt: new Date().toISOString() };
  }
  classifyIntent(message) {
    const m = message.toLowerCase();
    const intent = m.includes('return') || m.includes('refund') ? 'return_request' : m.includes('order') || m.includes('where') ? 'order_status' : m.includes('discount') || m.includes('code') ? 'promo_issue' : m.includes('size') || m.includes('fit') ? 'product_question' : 'general_enquiry';
    return { message, intent, confidence: 0.88, suggestedPriority: (intent === 'return_request' || intent === 'order_status') ? 'high' : 'medium' };
  }
}
module.exports = new InboxEngine();
module.exports.InboxEngine = InboxEngine;
