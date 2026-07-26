"use strict";
const TEMPLATES = [
  { id:"tpl001", name:"Abandoned Cart Recovery (3-Touch)", category:"revenue", rating:4.8, installs:2840, complexity:"easy", estimatedTime:"5 min", tags:["email","sms","recovery"], description:"Recover carts with email at 1hr, SMS at 3hr, final email at 24hr", triggerType:"shopify:checkout.abandoned", nodeCount:8, conversionRate:0.09 },
  { id:"tpl002", name:"VIP Customer Tag & Reward", category:"loyalty", rating:4.6, installs:1920, complexity:"easy", estimatedTime:"3 min", tags:["vip","loyalty","tagging"], description:"Tag customers as VIP at £500 lifetime spend + VIP welcome email with exclusive discount", triggerType:"shopify:order.created", nodeCount:5, conversionRate:null },
  { id:"tpl003", name:"Post-Purchase Review Request", category:"ugc", rating:4.9, installs:3840, complexity:"easy", estimatedTime:"2 min", tags:["reviews","email"], description:"Request reviews 7 days after fulfilment with conditional branch for sentiment", triggerType:"shopify:fulfillment.created", nodeCount:7, conversionRate:0.22 },
  { id:"tpl004", name:"Win-Back Campaign (60-Day Lapsed)", category:"retention", rating:4.4, installs:1280, complexity:"medium", estimatedTime:"10 min", tags:["retention","churn","discount"], description:"60-day lapsed win-back: 10% off -> 15% off -> free shipping escalation", triggerType:"cron:daily", nodeCount:12, conversionRate:0.06 },
  { id:"tpl005", name:"Low Stock Supplier Alert", category:"operations", rating:4.7, installs:1640, complexity:"easy", estimatedTime:"4 min", tags:["inventory","slack","operations"], description:"Alert ops team via Slack + email when inventory drops below threshold", triggerType:"inventory:low_stock", nodeCount:4, conversionRate:null },
  { id:"tpl006", name:"Welcome Series (New Customer)", category:"onboarding", rating:4.8, installs:4280, complexity:"easy", estimatedTime:"5 min", tags:["welcome","email","brand"], description:"5-email welcome series over 14 days with brand story, bestsellers, social proof, first purchase offer", triggerType:"shopify:customer.created", nodeCount:12, conversionRate:0.14 },
  { id:"tpl007", name:"Fraud Detection & Review Queue", category:"operations", rating:4.3, installs:840, complexity:"medium", estimatedTime:"8 min", tags:["fraud","risk","operations"], description:"Flag high-risk orders for manual review based on new customer + high value + mismatched billing/shipping", triggerType:"shopify:order.created", nodeCount:9, conversionRate:null },
  { id:"tpl008", name:"Birthday Reward Automation", category:"loyalty", rating:4.5, installs:1480, complexity:"medium", estimatedTime:"12 min", tags:["birthday","loyalty","discount"], description:"Personalised birthday email with discount code, triggered 7 days before birthday", triggerType:"cron:daily", nodeCount:6, conversionRate:0.18 },
];
const CATEGORIES = [
  { id:"revenue", label:"Revenue Recovery", count:2 },
  { id:"loyalty", label:"Loyalty & VIP", count:2 },
  { id:"ugc", label:"Reviews & UGC", count:1 },
  { id:"retention", label:"Retention", count:1 },
  { id:"operations", label:"Operations", count:2 },
  { id:"onboarding", label:"Onboarding", count:1 },
];
class AutomationTemplatesEngine {
  getTemplates(opts={}) {
    let t=TEMPLATES;
    if(opts.category) t=t.filter(x=>x.category===opts.category);
    if(opts.complexity) t=t.filter(x=>x.complexity===opts.complexity);
    if(opts.search) t=t.filter(x=>x.name.toLowerCase().includes(opts.search.toLowerCase())||x.tags.some(tg=>tg.includes(opts.search.toLowerCase())));
    return t.sort((a,b)=>b.installs-a.installs);
  }
  getTemplate(id) { return TEMPLATES.find(t=>t.id===id)||null; }
  getCategories() { return CATEGORIES; }
  installTemplate(templateId, customizations={}) {
    const t=this.getTemplate(templateId); if(!t) return {error:"Template not found"};
    return {templateId,workflowId:"wf_"+Date.now(),name:customizations.name||t.name,status:"draft",installedAt:new Date().toISOString(),nextStep:"Review in Visual Workflow Builder and activate when ready"};
  }
  previewTemplate(id) { const t=this.getTemplate(id); if(!t) return {error:"not found"}; return {...t,sampleNodes:Array.from({length:Math.min(t.nodeCount,5)},(_,i)=>({id:"n"+(i+1),type:["trigger","email","delay","condition","email"][i]||"action",label:"Step "+(i+1)}))}; }
  getStats() {
    return {totalTemplates:TEMPLATES.length,totalInstalls:TEMPLATES.reduce((s,t)=>s+t.installs,0),avgRating:parseFloat((TEMPLATES.reduce((s,t)=>s+t.rating,0)/TEMPLATES.length).toFixed(1)),categories:CATEGORIES.length};
  }
}
module.exports = new AutomationTemplatesEngine();
module.exports.AutomationTemplatesEngine = AutomationTemplatesEngine;
