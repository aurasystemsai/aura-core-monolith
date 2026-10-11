"use strict";
const PIPELINES = [
  { id:"pl1", name:"Daily Data Sync", status:"running", schedule:"0 6 * * *", tasks:12, completedTasks:8, failedTasks:0, avgDurationMin:14.2, slaMin:20 },
  { id:"pl2", name:"Weekly Revenue Report", status:"success", schedule:"0 8 * * MON", tasks:8, completedTasks:8, failedTasks:0, avgDurationMin:6.8, slaMin:15 },
  { id:"pl3", name:"Order Processing Pipeline", status:"success", schedule:"continuous", tasks:5, completedTasks:5, failedTasks:0, avgDurationMin:0.8, slaMin:2 },
  { id:"pl4", name:"ML Model Retrain", status:"failed", schedule:"0 2 * * SUN", tasks:6, completedTasks:3, failedTasks:1, avgDurationMin:48.0, slaMin:60 },
];
const TASKS = [
  { id:"t1", pipelineId:"pl1", name:"Extract Shopify Orders", type:"extract", status:"success", durationMs:2400, dependencies:[] },
  { id:"t2", pipelineId:"pl1", name:"Transform Order Data", type:"transform", status:"success", durationMs:1840, dependencies:["t1"] },
  { id:"t3", pipelineId:"pl1", name:"Load to Data Warehouse", type:"load", status:"running", durationMs:null, dependencies:["t2"] },
  { id:"t4", pipelineId:"pl1", name:"Update Revenue Metrics", type:"compute", status:"pending", durationMs:null, dependencies:["t3"] },
];
const RETRY_POLICIES = [
  { id:"rp1", name:"Aggressive", maxRetries:5, backoffMs:1000, multiplier:2, maxBackoffMs:30000 },
  { id:"rp2", name:"Conservative", maxRetries:3, backoffMs:5000, multiplier:3, maxBackoffMs:120000 },
  { id:"rp3", name:"Once", maxRetries:1, backoffMs:10000, multiplier:1, maxBackoffMs:10000 },
  { id:"rp4", name:"No Retry", maxRetries:0, backoffMs:0, multiplier:1, maxBackoffMs:0 },
];
class WorkflowOrchestratorEngine {
  getPipelines(opts={}) {
    let pipes=PIPELINES; if(opts.status) pipes=pipes.filter(p=>p.status===opts.status);
    return pipes.map(p=>({...p,progressPct:Math.round(p.completedTasks/p.tasks*100),slaBreached:p.avgDurationMin>p.slaMin}));
  }
  getPipeline(id) { return PIPELINES.find(p=>p.id===id)||null; }
  getTasks(pipelineId) { return TASKS.filter(t=>t.pipelineId===pipelineId); }
  getRetryPolicies() { return RETRY_POLICIES; }
  topologicalSort(tasks) {
    const result=[], visited=new Set();
    const visit=(t)=>{ if(visited.has(t.id)) return; visited.add(t.id); (t.dependencies||[]).forEach(d=>{ const dep=tasks.find(x=>x.id===d); if(dep) visit(dep); }); result.push(t); };
    tasks.forEach(t=>visit(t)); return result;
  }
  getStats() {
    return { totalPipelines:PIPELINES.length, runningPipelines:PIPELINES.filter(p=>p.status==="running").length, failedPipelines:PIPELINES.filter(p=>p.status==="failed").length, slaBreaches:PIPELINES.filter(p=>p.avgDurationMin>p.slaMin).length, totalTasks:TASKS.length };
  }
  retryPipeline(id) { const p=this.getPipeline(id); if(!p) return {error:"Pipeline not found"}; return {pipelineId:id,status:"queued",queuedAt:new Date().toISOString()}; }
}
module.exports = new WorkflowOrchestratorEngine();
module.exports.WorkflowOrchestratorEngine = WorkflowOrchestratorEngine;
