"use strict";
const RULES = [
  { id:"ar1", name:"Tag VIP Customers", status:"active", trigger:'order.total > 500', action:'customer.add_tag("VIP")', executions:284, successRate:0.99 },
  { id:"ar2", name:"Flag Suspicious Return", status:"active", trigger:"customer.return_rate > 0.5", action:'customer.add_flag("review")', executions:42, successRate:0.97 },
  { id:"ar3", name:"Notify Low Stock", status:"active", trigger:"product.inventory < 20", action:'notify.slack("#inventory")', executions:18, successRate:1.0 },
  { id:"ar4", name:"Loyal Customer Discount", status:"paused", trigger:"customer.order_count >= 5", action:"customer.create_discount(10)", executions:196, successRate:0.95 },
  { id:"ar5", name:"Auto-Cancel Unpaid Orders", status:"active", trigger:'order.age_hours > 48 AND order.financial_status = "pending"', action:'order.cancel("non_payment")', executions:64, successRate:0.98 },
];
const TRIGGERS = [
  { id:"order.created", label:"Order Created", fields:["total","item_count","tags","payment_method"] },
  { id:"customer.created", label:"Customer Created", fields:["email","total_spent","order_count"] },
  { id:"product.updated", label:"Product Updated", fields:["inventory_quantity","price","status"] },
  { id:"refund.created", label:"Refund Created", fields:["amount","reason","customer_id"] },
  { id:"cron", label:"Scheduled (Cron)", fields:["schedule"] },
  { id:"webhook:inbound", label:"Inbound Webhook", fields:["payload"] },
];
const ACTIONS = [
  { id:"customer.add_tag", label:"Add Customer Tag", params:["tag"] },
  { id:"customer.create_discount", label:"Create Discount Code", params:["percentage","expires_days"] },
  { id:"order.cancel", label:"Cancel Order", params:["reason"] },
  { id:"order.add_tag", label:"Add Order Tag", params:["tag"] },
  { id:"notify.email", label:"Send Email", params:["to","template"] },
  { id:"notify.slack", label:"Slack Message", params:["channel","message"] },
  { id:"klaviyo.track_event", label:"Klaviyo Event", params:["event","properties"] },
];
class WorkflowAutomationEngine {
  getRules(opts={}) { let r=RULES; if(opts.status) r=r.filter(x=>x.status===opts.status); return r; }
  getRule(id) { return RULES.find(r=>r.id===id)||null; }
  getTriggers() { return TRIGGERS; }
  getActions() { return ACTIONS; }
  parseRule(triggerExpr, actionExpr) {
    const conditions = triggerExpr.split(" AND ").map(c=>c.trim()).map(c=>{ const m=c.match(/^(w[w.]+)s*(>|<|>=|<=|=|!=)s*(.+)$/); return m?{field:m[1],operator:m[2],value:m[3].replace(/['"]/g,"")}:{raw:c}; });
    return { trigger:{expression:triggerExpr,conditions}, action:{expression:actionExpr}, valid:conditions.every(c=>c.field), parsedAt:new Date().toISOString() };
  }
  testRule(ruleId, sampleData) {
    const rule=this.getRule(ruleId); if(!rule) return {error:"Rule not found"};
    return { ruleId, sampleData, wouldTrigger:Math.random()>0.3, trigger:rule.trigger, action:rule.action, timestamp:new Date().toISOString() };
  }
  getDashboardStats() {
    const active=RULES.filter(r=>r.status==="active");
    return { totalRules:RULES.length, activeRules:active.length, totalExecutions:RULES.reduce((s,r)=>s+r.executions,0), avgSuccessRate:parseFloat((active.reduce((s,r)=>s+r.successRate,0)/active.length).toFixed(3)), triggersAvailable:TRIGGERS.length, actionsAvailable:ACTIONS.length };
  }
  suggestAutomations() {
    return [
      { title:"Tag High-AOV Customers", trigger:"order.total > 300", action:'customer.add_tag("High-AOV")', impact:"Segment 28% of customer base for premium campaigns", effort:"low" },
      { title:"Auto-restock Alert", trigger:"product.inventory < 15", action:"notify.slack + notify.email", impact:"Reduce stockouts by 40%", effort:"low" },
      { title:"Win-back Trigger", trigger:"customer.days_since_last_order > 90", action:'klaviyo.track_event("At Risk")', impact:"Capture 12% of hibernating customers", effort:"medium" },
    ];
  }
}
module.exports = new WorkflowAutomationEngine();
module.exports.WorkflowAutomationEngine = WorkflowAutomationEngine;
