"use strict";
const RULE_TREES = [
  { id:"rt1", name:"Customer Tier Assignment", status:"active", rootOp:"AND", conditions:[{field:"total_spent",op:">",value:1000},{field:"order_count",op:">=",value:3}], action:'assign_tier("Gold")', evaluations:8420, matchRate:0.18 },
  { id:"rt2", name:"Free Shipping Eligibility", status:"active", rootOp:"OR", conditions:[{field:"order_total",op:">",value:75},{field:"customer.tier",op:"=",value:"Gold"}], action:"apply_free_shipping()", evaluations:14200, matchRate:0.62 },
  { id:"rt3", name:"Fraud Risk Flag", status:"active", rootOp:"AND", conditions:[{field:"order_total",op:">",value:500},{field:"customer.order_count",op:"<=",value:1},{field:"billing.country",op:"!=",value:"shipping.country"}], action:"flag_for_review()", evaluations:3840, matchRate:0.04 },
  { id:"rt4", name:"Restock Campaign Trigger", status:"paused", rootOp:"AND", conditions:[{field:"inventory_level",op:"<",value:20},{field:"product.category",op:"=",value:"bestseller"}], action:"trigger_restock_campaign()", evaluations:1240, matchRate:0.11 },
];
const FIELDS = [
  { field:"customer.total_spent", label:"Total Spent (£)", operators:[">","<",">=","<=","="], valueType:"number" },
  { field:"customer.order_count", label:"Order Count", operators:[">","<",">=","<=","="], valueType:"number" },
  { field:"customer.days_since_last_order", label:"Days Since Last Order", operators:[">","<",">=","<="], valueType:"number" },
  { field:"customer.tags", label:"Customer Tags", operators:["contains","not_contains"], valueType:"string" },
  { field:"order.total", label:"Order Total (£)", operators:[">","<",">=","<="], valueType:"number" },
  { field:"product.inventory", label:"Inventory Level", operators:[">","<","<="], valueType:"number" },
  { field:"customer.country", label:"Country", operators:["=","!=","in","not_in"], valueType:"string" },
];
class ConditionalLogicEngine {
  getRuleTrees(opts={}) { let r=RULE_TREES; if(opts.status) r=r.filter(x=>x.status===opts.status); return r; }
  getRuleTree(id) { return RULE_TREES.find(r=>r.id===id)||null; }
  getConditionFields() { return FIELDS; }
  evaluateTree(treeId, contextData) {
    const tree=this.getRuleTree(treeId); if(!tree) return {error:"Rule tree not found"};
    const results=tree.conditions.map(c=>{
      const key=c.field.replace(/^(customer|order|product)./, "");
      const val=contextData[key]; if(val===undefined) return {condition:c,result:false,reason:"field not in context"};
      const result=c.op===">"?val>c.value:c.op==="<"?val<c.value:c.op===">="?val>=c.value:c.op==="<="?val<=c.value:c.op==="!="?val!==c.value:val===c.value;
      return {condition:c,result,contextValue:val};
    });
    const matched=tree.rootOp==="AND"?results.every(r=>r.result):results.some(r=>r.result);
    return {treeId,matched,rootOp:tree.rootOp,conditionResults:results,actionWouldRun:matched?tree.action:null};
  }
  previewSegment(conditions, rootOp="AND") {
    const est=Math.round(8420*(rootOp==="AND"?0.12:0.58));
    return {conditions,rootOp,estimatedMatchCount:est,estimatedMatchRate:parseFloat((est/8420).toFixed(3))};
  }
  getDashboardStats() {
    const active=RULE_TREES.filter(r=>r.status==="active");
    return {totalRuleTrees:RULE_TREES.length,activeRuleTrees:active.length,totalEvaluations:RULE_TREES.reduce((s,r)=>s+r.evaluations,0),avgMatchRate:parseFloat((active.reduce((s,r)=>s+r.matchRate,0)/active.length).toFixed(3)),fieldsAvailable:FIELDS.length};
  }
}
module.exports = new ConditionalLogicEngine();
module.exports.ConditionalLogicEngine = ConditionalLogicEngine;
