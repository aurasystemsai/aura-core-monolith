"use strict";
const REQUESTS = [
  { id:"apr001", title:"Email Campaign: Summer Sale Launch", type:"campaign", status:"pending", priority:"high", requestedBy:"alice@brand.com", currentApprover:"manager@brand.com", createdAt:"2026-07-26T08:00:00Z", dueBy:"2026-07-27T12:00:00Z", steps:[{step:1,approver:"manager@brand.com",status:"pending"},{step:2,approver:"cmo@brand.com",status:"waiting"}] },
  { id:"apr002", title:"Discount Code: 20% Flash Sale", type:"discount", status:"approved", priority:"medium", requestedBy:"bob@brand.com", currentApprover:null, value:20, createdAt:"2026-07-25T14:00:00Z", dueBy:"2026-07-26T09:00:00Z", steps:[{step:1,approver:"manager@brand.com",status:"approved",signedAt:"2026-07-25T15:40:00Z"}] },
  { id:"apr003", title:"Supplier PO: EcoFabrics £28,400", type:"purchase_order", status:"pending", priority:"urgent", requestedBy:"charlie@brand.com", currentApprover:"cfo@brand.com", value:28400, createdAt:"2026-07-26T09:00:00Z", dueBy:"2026-07-26T17:00:00Z", steps:[{step:1,approver:"manager@brand.com",status:"approved",signedAt:"2026-07-26T09:45:00Z"},{step:2,approver:"cfo@brand.com",status:"pending"}] },
  { id:"apr004", title:"Blog Post: Summer Sustainable Fashion Guide", type:"content", status:"changes_requested", priority:"low", requestedBy:"alice@brand.com", currentApprover:"editor@brand.com", createdAt:"2026-07-24T10:00:00Z", dueBy:"2026-07-29T10:00:00Z", steps:[{step:1,approver:"editor@brand.com",status:"changes_requested",comment:"Needs stronger CTA in conclusion"}] },
  { id:"apr005", title:"Price Change: Hoodie +£10", type:"pricing", status:"rejected", priority:"medium", requestedBy:"bob@brand.com", currentApprover:null, value:10, createdAt:"2026-07-23T11:00:00Z", dueBy:"2026-07-25T11:00:00Z", steps:[{step:1,approver:"manager@brand.com",status:"rejected",comment:"Customer research needed first"}] },
];
const CHAINS = [
  { id:"ac1", name:"Marketing Campaign", steps:[{role:"Marketing Manager",timeoutHours:24},{role:"CMO",timeoutHours:48}], escalation:"Director of Marketing" },
  { id:"ac2", name:"Purchase Order < £10k", steps:[{role:"Line Manager",timeoutHours:8}], escalation:"Department Head" },
  { id:"ac3", name:"Purchase Order > £10k", steps:[{role:"Line Manager",timeoutHours:8},{role:"CFO",timeoutHours:24}], escalation:"CEO" },
  { id:"ac4", name:"Pricing Change", steps:[{role:"Brand Manager",timeoutHours:12},{role:"Head of Commerce",timeoutHours:24}], escalation:"CEO" },
  { id:"ac5", name:"Content Publication", steps:[{role:"Editor",timeoutHours:48}], escalation:"Content Director" },
];
const AUDIT = [
  { id:"al1", requestId:"apr003", action:"approved", actor:"manager@brand.com", timestamp:"2026-07-26T09:45:00Z", signature:"sha256:abc123def456" },
  { id:"al2", requestId:"apr002", action:"approved", actor:"manager@brand.com", timestamp:"2026-07-25T15:40:00Z", signature:"sha256:def456ghi789" },
  { id:"al3", requestId:"apr005", action:"rejected", actor:"manager@brand.com", timestamp:"2026-07-24T14:20:00Z", signature:"sha256:ghi789jkl012", comment:"Customer research needed first" },
];
class CollaborationApprovalEngine {
  getRequests(opts={}) {
    let r=REQUESTS; if(opts.status) r=r.filter(x=>x.status===opts.status); if(opts.priority) r=r.filter(x=>x.priority===opts.priority);
    return r.map(x=>({...x,isOverdue:x.status==="pending"&&new Date(x.dueBy)<new Date(),hoursUntilDue:Math.max(0,Math.round((new Date(x.dueBy)-Date.now())/3600000))}));
  }
  getRequest(id) { return REQUESTS.find(r=>r.id===id)||null; }
  getChains() { return CHAINS; }
  getAuditLog(requestId) { return requestId?AUDIT.filter(l=>l.requestId===requestId):AUDIT; }
  approveRequest(requestId,approver,comment) {
    const r=this.getRequest(requestId); if(!r) return {error:"Request not found"};
    const sig="sha256:"+Math.random().toString(36).substr(2,16);
    return {requestId,action:"approved",approver,comment,signature:sig,timestamp:new Date().toISOString(),nextStep:r.steps.length>1?"Awaiting next approver":"Fully approved"};
  }
  rejectRequest(requestId,approver,reason) {
    const r=this.getRequest(requestId); if(!r) return {error:"Request not found"};
    return {requestId,action:"rejected",approver,reason,signature:"sha256:"+Math.random().toString(36).substr(2,16),timestamp:new Date().toISOString()};
  }
  delegateApproval(requestId,from,to,reason) { return {requestId,delegatedFrom:from,delegatedTo:to,reason,delegatedAt:new Date().toISOString()}; }
  getDashboardStats() {
    const pending=REQUESTS.filter(r=>r.status==="pending");
    return {totalRequests:REQUESTS.length,pendingApprovals:pending.length,overdueApprovals:pending.filter(r=>new Date(r.dueBy)<new Date()).length,approvedTotal:REQUESTS.filter(r=>r.status==="approved").length,rejectedTotal:REQUESTS.filter(r=>r.status==="rejected").length,urgentPending:pending.filter(r=>r.priority==="urgent"||r.priority==="high").length};
  }
}
module.exports = new CollaborationApprovalEngine();
module.exports.CollaborationApprovalEngine = CollaborationApprovalEngine;
