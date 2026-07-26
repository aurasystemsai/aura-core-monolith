import { useState } from "react";
import { apiFetchJSON } from "../../api";

const accent = "#06b6d4";
const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "Inter,sans-serif", padding: "32px" },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 700, color: "#fafafa", margin: 0 },
  subtitle: { color: "#a1a1aa", fontSize: 14, marginTop: 6 },
  tabs: { display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid #27272a", paddingBottom: 0 },
  tab: (a) => ({ padding: "10px 18px", cursor: "pointer", border: "none", background: "none", color: a ? "#fafafa" : "#71717a", fontWeight: a ? 600 : 400, fontSize: 14, borderBottom: a ? `2px solid ${accent}` : "2px solid transparent", marginBottom: -1 }),
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 24, marginBottom: 20 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
  label: { display: "block", color: "#a1a1aa", fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, boxSizing: "border-box" },
  select: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, boxSizing: "border-box" },
  btn: (c) => ({ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: c || accent, color: "#fff" }),
  btnSm: { padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: accent, color: "#fff" },
  btnGhost: { padding: "8px 16px", borderRadius: 8, border: `1px solid ${accent}`, cursor: "pointer", fontWeight: 600, fontSize: 13, background: "transparent", color: accent },
  badge: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c + "22", color: c }),
  row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  divider: { borderTop: "1px solid #27272a", margin: "20px 0" },
  metricCard: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, textAlign: "center" },
  metricNum: { fontSize: 28, fontWeight: 800, color: accent },
  metricLabel: { fontSize: 12, color: "#71717a", marginTop: 4 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", color: "#71717a", fontSize: 12, fontWeight: 600, padding: "8px 12px", borderBottom: "1px solid #27272a" },
  td: { padding: "12px", borderBottom: "1px solid #18181b", fontSize: 13, color: "#e4e4e7" },
  dagNode: { background: "#18181b", border: `1px solid ${accent}`, borderRadius: 8, padding: "10px 16px", minWidth: 120, textAlign: "center" },
  dagArrow: { color: "#3f3f46", fontSize: 20, margin: "0 8px" },
  workerBar: { background: "#27272a", borderRadius: 4, height: 8, flex: 1 },
  workerFill: (pct) => ({ background: accent, height: 8, borderRadius: 4, width: `${pct}%` }),
};

const TABS = ["DAG Overview","Task Queue","SLA Monitor","Dependency Map","Analytics","Cross-Tool","Settings"];

const DAGS = [
  { name: "Daily Revenue Report", tasks: 6, status: "running", sla: "5 min", actual: "3.2 min" },
  { name: "Customer Sync", tasks: 4, status: "completed", sla: "2 min", actual: "1.1 min" },
  { name: "Weekly Email Campaign", tasks: 9, status: "queued", sla: "10 min", actual: "—" },
  { name: "Inventory Rebalance", tasks: 5, status: "failed", sla: "3 min", actual: "4.8 min" },
];

const STATUS_COLOR = { running: accent, completed: "#22c55e", queued: "#f59e0b", failed: "#ef4444" };

export default function WorkflowOrchestrator() {
  const [tab, setTab] = useState(0);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Workflow Orchestrator</h1>
        <p style={S.subtitle}>DAG-based enterprise orchestration — Airflow-style distributed execution</p>
      </div>

      <div style={{...S.grid3, gridTemplateColumns:"1fr 1fr 1fr 1fr", marginBottom:24}}>
        {[["Active DAGs","12"],["Tasks Running","47"],["Worker Pool","8/10"],["SLA Breaches","1"]].map(([l,v])=>(
          <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>

      <div style={S.tabs}>
        {TABS.map((t,i)=><button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      {tab===0 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:20}}>DAG Executions</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>DAG Name</th><th style={S.th}>Tasks</th><th style={S.th}>Status</th><th style={S.th}>SLA</th><th style={S.th}>Actual</th><th style={S.th}></th></tr></thead>
            <tbody>
              {DAGS.map(d=>(
                <tr key={d.name}>
                  <td style={S.td}><strong>{d.name}</strong></td>
                  <td style={S.td}>{d.tasks}</td>
                  <td style={S.td}><span style={S.badge(STATUS_COLOR[d.status])}>{d.status}</span></td>
                  <td style={S.td}>{d.sla}</td>
                  <td style={{...S.td, color: d.status==="failed"?"#ef4444":"inherit"}}>{d.actual}</td>
                  <td style={S.td}><div style={S.row}><button style={S.btnSm}>Inspect</button><button style={{...S.btnSm, background:"#27272a"}}>Re-run</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={S.divider}/>
          <div style={{fontWeight:700, marginBottom:16}}>DAG Visualizer — Daily Revenue Report</div>
          <div style={{...S.row, padding:16, background:"#0d0d10", borderRadius:10, overflowX:"auto"}}>
            {["Extract Orders","Calc Revenue","Segment Split","Email Render","Send Report","Archive"].map((node,i,arr)=>(
              <div key={node} style={S.row}>
                <div style={{...S.dagNode, borderColor: i<2?"#22c55e":i===2?accent:"#3f3f46", color: i<2?"#22c55e":i===2?accent:"#a1a1aa"}}>
                  <div style={{fontSize:11, fontWeight:700}}>{node}</div>
                </div>
                {i<arr.length-1 && <span style={S.dagArrow}>→</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab===1 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Distributed Task Queue</div>
          <div style={S.grid2}>
            {[
              {worker:"Worker-01", tasks:12, utilization:80, region:"US-East"},
              {worker:"Worker-02", tasks:8, utilization:53, region:"US-East"},
              {worker:"Worker-03", tasks:15, utilization:100, region:"EU-West"},
              {worker:"Worker-04", tasks:12, utilization:80, region:"APAC"},
            ].map(w=>(
              <div key={w.worker} style={{background:"#09090b", border:"1px solid #27272a", borderRadius:10, padding:16}}>
                <div style={S.row}>
                  <span style={{fontWeight:700}}>{w.worker}</span>
                  <span style={S.badge("#3f3f46")}>{w.region}</span>
                  <span style={{marginLeft:"auto", fontSize:12, color:"#a1a1aa"}}>{w.tasks} tasks</span>
                </div>
                <div style={{...S.row, marginTop:10, gap:8}}>
                  <div style={S.workerBar}><div style={S.workerFill(w.utilization)}/></div>
                  <span style={{fontSize:12, color: w.utilization===100?"#ef4444":accent}}>{w.utilization}%</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{...S.row, marginTop:16}}>
            <button style={S.btn()}>+ Spawn Worker</button>
            <button style={S.btnGhost}>Auto-Scale Config</button>
          </div>
        </div>
      )}

      {tab===2 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>SLA Monitoring</div>
          {[
            {dag:"Inventory Rebalance", sla:"3 min", actual:"4.8 min", breach:true, alert:"Sent to Slack"},
            {dag:"Weekly Email Campaign", sla:"10 min", actual:"8.2 min (projected)", breach:false, alert:"On track"},
            {dag:"Daily Revenue Report", sla:"5 min", actual:"3.2 min", breach:false, alert:"Healthy"},
          ].map(s=>(
            <div key={s.dag} style={{...S.card, marginBottom:12, borderColor: s.breach?"#ef4444":"#27272a"}}>
              <div style={S.row}>
                <span style={{fontWeight:700}}>{s.dag}</span>
                <span style={S.badge(s.breach?"#ef4444":"#22c55e")}>{s.breach?"SLA BREACH":"On Track"}</span>
              </div>
              <div style={{fontSize:13, color:"#a1a1aa", marginTop:8}}>SLA: {s.sla} | Actual: {s.actual} | {s.alert}</div>
            </div>
          ))}
          <div style={S.divider}/>
          <div style={{fontWeight:700, marginBottom:12}}>SLA Alert Config</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Alert Channel</label><select style={S.select}><option>Slack</option><option>Email</option><option>PagerDuty</option><option>Webhook</option></select></div>
            <div><label style={S.label}>Warn at % of SLA</label><input style={S.input} defaultValue="80"/></div>
          </div>
          <button style={{...S.btn(), marginTop:12}}>Save Alert Config</button>
        </div>
      )}

      {tab===3 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Dependency Map</div>
          <p style={{color:"#a1a1aa", fontSize:13, marginBottom:16}}>Declare inter-workflow dependencies. Workflow B runs only after Workflow A succeeds.</p>
          <div style={{background:"#0d0d10", borderRadius:10, padding:24}}>
            {[
              {from:"Customer Sync", to:"Segmentation Update", edge:"triggers"},
              {from:"Segmentation Update", to:"Email Campaign", edge:"triggers"},
              {from:"Order Processor", to:"Inventory Rebalance", edge:"triggers"},
              {from:"Email Campaign", to:"Analytics Rollup", edge:"triggers"},
            ].map((d,i)=>(
              <div key={i} style={{...S.row, marginBottom:12, fontSize:13}}>
                <div style={{...S.dagNode, minWidth:140}}>{d.from}</div>
                <div style={{color:"#3f3f46", fontSize:12}}>— {d.edge} →</div>
                <div style={{...S.dagNode, minWidth:140, borderColor:"#22c55e", color:"#22c55e"}}>{d.to}</div>
              </div>
            ))}
          </div>
          <div style={{...S.row, marginTop:16}}>
            <button style={S.btn()}>+ Add Dependency</button>
            <button style={S.btnGhost}>Export DAG YAML</button>
          </div>
        </div>
      )}

      {tab===4 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Orchestrator Analytics</div>
          <div style={S.grid3}>
            {[
              {label:"P50 Execution", value:"0.8s"},
              {label:"P95 Execution", value:"4.2s"},
              {label:"P99 Execution", value:"12.1s"},
              {label:"Task Success Rate", value:"99.2%"},
              {label:"Avg Queue Depth", value:"34"},
              {label:"Worker Efficiency", value:"78%"},
            ].map(m=>(
              <div key={m.label} style={S.metricCard}>
                <div style={S.metricNum}>{m.value}</div>
                <div style={S.metricLabel}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab===5 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Cross-Tool Orchestration</div>
          <p style={{color:"#a1a1aa", fontSize:13, marginBottom:16}}>Trigger actions in any AURA tool from any workflow step.</p>
          <div style={S.grid2}>
            {[
              {from:"Workflow Orchestrator", to:"SEO Tool", action:"Run site audit after content publish"},
              {from:"Workflow Orchestrator", to:"Email Tool", action:"Send campaign on segment update"},
              {from:"Workflow Orchestrator", to:"Analytics", action:"Refresh dashboards on data sync"},
              {from:"Workflow Orchestrator", to:"Ads Tool", action:"Adjust budgets on revenue event"},
            ].map(x=>(
              <div key={x.to} style={{background:"#09090b", border:"1px solid #27272a", borderRadius:10, padding:16}}>
                <div style={{fontWeight:700, marginBottom:6, color:accent}}>{x.from} → {x.to}</div>
                <div style={{fontSize:13, color:"#a1a1aa"}}>{x.action}</div>
                <button style={{...S.btnSm, marginTop:10}}>Configure</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab===6 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Orchestrator Settings</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Default Retry Count</label><input style={S.input} defaultValue="3"/></div>
            <div><label style={S.label}>Retry Backoff (ms)</label><input style={S.input} defaultValue="1000"/></div>
            <div><label style={S.label}>Max Concurrent DAGs</label><input style={S.input} defaultValue="20"/></div>
            <div><label style={S.label}>Execution Timeout (s)</label><input style={S.input} defaultValue="300"/></div>
            <div><label style={S.label}>Dead Letter Queue</label><select style={S.select}><option>Enabled</option><option>Disabled</option></select></div>
            <div><label style={S.label}>Execution Region</label><select style={S.select}><option>US-East</option><option>EU-West</option><option>APAC</option><option>Multi-Region</option></select></div>
          </div>
          <button style={{...S.btn(), marginTop:16}}>Save Settings</button>
        </div>
      )}
    </div>
  );
}