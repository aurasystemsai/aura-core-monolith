'use strict';
const OPS_ALERTS = [
  {id:'oa1',type:'inventory',severity:'critical',title:'Eco Hoodie Navy M — 7 units left',action:'Create PO: order 200 units from supplier',dueBy:'2026-07-28T00:00:00Z',status:'open',assignedTo:'ops@brand.com'},
  {id:'oa2',type:'fulfilment',severity:'high',title:'48 orders pending dispatch > 24hrs',action:'Contact warehouse — SLA at risk',dueBy:'2026-07-26T17:00:00Z',status:'in_progress',assignedTo:'warehouse@brand.com'},
  {id:'oa3',type:'returns',severity:'medium',title:'Return rate spike: +8pp this week',action:'Investigate product sizing issue — Recycled Jogger',dueBy:'2026-07-30T00:00:00Z',status:'open',assignedTo:'ops@brand.com'},
  {id:'oa4',type:'supplier',severity:'low',title:'Supplier payment due: EcoFabrics — £28,400',action:'Approve and schedule payment',dueBy:'2026-07-31T00:00:00Z',status:'open',assignedTo:'finance@brand.com'},
];
const DAILY_BRIEFING = { generatedAt: '2026-07-26T06:00:00Z', period: 'today', summary: 'Your store is performing 28% above last week. 4 operational alerts require attention.', highlights: [{label:'Revenue today',value:'£4,820',trend:'+28%'},{label:'Orders to dispatch',value:'48',trend:'+12 vs yesterday'},{label:'Support tickets',value:'4 open',trend:'-2 vs yesterday'},{label:'Inventory alerts',value:'3 critical',trend:'new'}], topActions: ['Approve EcoFabrics PO £28,400','Dispatch 48 pending orders','Restock Eco Hoodie Navy M'] };
const WORKFLOWS = [
  {id:'w1',name:'Daily Ops Briefing',schedule:'0 6 * * *',status:'active',lastRun:'2026-07-26T06:00:00Z'},
  {id:'w2',name:'Low Stock Auto-PO',schedule:'0 8 * * *',status:'active',lastRun:'2026-07-26T08:00:00Z'},
  {id:'w3',name:'SLA Breach Alert',schedule:'*/30 * * * *',status:'active',lastRun:'2026-07-26T09:30:00Z'},
  {id:'w4',name:'Weekly Ops Summary Email',schedule:'0 8 * * MON',status:'active',lastRun:'2026-07-21T08:00:00Z'},
];
const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
class AuraOpsEngine {
  getAlerts(opts = {}) {
    let a = OPS_ALERTS;
    if (opts.severity) a = a.filter(x => x.severity === opts.severity);
    if (opts.type) a = a.filter(x => x.type === opts.type);
    if (opts.status) a = a.filter(x => x.status === opts.status);
    return a.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  }
  getDailyBriefing() { return DAILY_BRIEFING; }
  getWorkflows() { return WORKFLOWS; }
  getDashboardStats() { return { totalAlerts: OPS_ALERTS.length, criticalAlerts: OPS_ALERTS.filter(a => a.severity === 'critical').length, openAlerts: OPS_ALERTS.filter(a => a.status === 'open').length, activeWorkflows: WORKFLOWS.filter(w => w.status === 'active').length, opsScore: 84, lastBriefingAt: DAILY_BRIEFING.generatedAt }; }
  resolveAlert(alertId, resolution) {
    const a = OPS_ALERTS.find(x => x.id === alertId);
    if (!a) return { error: 'Alert not found' };
    return { alertId, status: 'resolved', resolution, resolvedAt: new Date().toISOString() };
  }
}
module.exports = new AuraOpsEngine();
module.exports.AuraOpsEngine = AuraOpsEngine;
