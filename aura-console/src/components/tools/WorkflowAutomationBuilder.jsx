import { useState } from "react";
import { apiFetchJSON } from "../../api";

const accent = "#8b5cf6";
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
  textarea: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, minHeight: 90, boxSizing: "border-box", resize: "vertical" },
  btn: (c) => ({ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: c || accent, color: "#fff" }),
  btnSm: { padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: accent, color: "#fff" },
  btnGhost: { padding: "8px 16px", borderRadius: 8, border: `1px solid ${accent}`, cursor: "pointer", fontWeight: 600, fontSize: 13, background: "transparent", color: accent },
  badge: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c + "22", color: c }),
  row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  divider: { borderTop: "1px solid #27272a", margin: "20px 0" },
  metricCard: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, textAlign: "center" },
  metricNum: { fontSize: 28, fontWeight: 800, color: accent },
  metricLabel: { fontSize: 12, color: "#71717a", marginTop: 4 },
  ruleRow: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "12px 16px", marginBottom: 10 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", color: "#71717a", fontSize: 12, fontWeight: 600, padding: "8px 12px", borderBottom: "1px solid #27272a" },
  td: { padding: "12px", borderBottom: "1px solid #18181b", fontSize: 13, color: "#e4e4e7" },
  decisionCell: { padding: "8px", border: "1px solid #27272a", fontSize: 12, minWidth: 100, color: "#e4e4e7" },
};

const TABS = ["Rule Builder","Decision Table","Queue Monitor","Batch Engine","SAGA Patterns","A/B Test Nodes","Audit Log"];

const RULES = [
  { name: "VIP Tagging", trigger: "order.total > 500", action: "Add tag: VIP", priority: 1, status: "active", runs: 1240 },
  { name: "Fraud Flag", trigger: "risk_level = HIGH", action: "Hold + notify", priority: 0, status: "active", runs: 88 },
  { name: "Upsell Nudge", trigger: "cart.total > 75 AND no_discount", action: "Send upsell email", priority: 2, status: "paused", runs: 3420 },
];

const STATUS_COLOR = { active: "#22c55e", paused: "#f59e0b", failed: "#ef4444" };

export default function WorkflowAutomationBuilder() {
  const [tab, setTab] = useState(0);
  const [ruleName, setRuleName] = useState("");
  const [trigger, setTrigger] = useState("order.total");
  const [operator, setOperator] = useState(">");
  const [value, setValue] = useState("100");
  const [action, setAction] = useState("send_email");
  const [saving, setSaving] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const saveRule = async () => {
    setSaving(true);
    try {
      await apiFetchJSON("/api/workflow-automation-builder/rules", { method: "POST", body: JSON.stringify({ ruleName, trigger, operator, value, action }) });
    } catch (_) {}
    setTimeout(() => setSaving(false), 1200);
  };

  const suggestAutomations = async () => {
    setAiLoading(true);
    try {
      const data = await apiFetchJSON("/api/workflow-automation-builder/automations/suggest", { method: "POST", body: JSON.stringify({ context: "ecommerce", existingRules: RULES.map(r => r.name) }) });
      setAiSuggestions(data.suggestions || data);
    } catch (e) {
      setAiSuggestions({ error: e.message });
    }
    setAiLoading(false);
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Workflow Automation Builder</h1>
        <p style={S.subtitle}>Rule engine with declarative DSL, decision tables, and SAGA patterns</p>
      </div>

      <div style={{...S.grid2, gridTemplateColumns:"1fr 1fr 1fr 1fr", marginBottom:24}}>
        {[["Active Rules","23"],["Rules Fired Today","8,412"],["Avg Latency","18ms"],["Error Rate","0.04%"]].map(([l,v])=>(
          <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>

      <div style={S.tabs}>
        {TABS.map((t,i)=><button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      {tab===0 && (
        <div>
          <div style={S.card}>
            <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Create Rule</div>
            <div style={S.grid3}>
              <div><label style={S.label}>Rule Name</label><input style={S.input} placeholder="e.g. VIP Tagging" value={ruleName} onChange={e=>setRuleName(e.target.value)}/></div>
              <div><label style={S.label}>Trigger Field</label><select style={S.select} value={trigger} onChange={e=>setTrigger(e.target.value)}><option value="order.total">order.total</option><option value="customer.ltv">customer.ltv</option><option value="cart.items">cart.items</option><option value="risk_level">risk_level</option></select></div>
              <div><label style={S.label}>Operator</label><select style={S.select} value={operator} onChange={e=>setOperator(e.target.value)}><option>{">"}</option><option>{"<"}</option><option>=</option><option>{"!="}</option><option>contains</option></select></div>
            </div>
            <div style={{...S.grid2, marginTop:12}}>
              <div><label style={S.label}>Value</label><input style={S.input} value={value} onChange={e=>setValue(e.target.value)}/></div>
              <div><label style={S.label}>Action</label><select style={S.select} value={action} onChange={e=>setAction(e.target.value)}><option value="send_email">Send Email</option><option value="add_tag">Add Tag</option><option value="webhook">Fire Webhook</option><option value="notify_slack">Notify Slack</option><option value="hold_order">Hold Order</option></select></div>
            </div>
            <div style={{...S.row, marginTop:16}}>
              <button style={S.btn()} onClick={saveRule} disabled={saving}>{saving?"Saving...":"Save Rule"}</button>
              <button style={S.btnGhost} onClick={suggestAutomations} disabled={aiLoading}>{aiLoading ? "Generating…" : "✨ AI Suggest Automations (2 credits)"}</button>
            </div>
            {aiSuggestions && !aiSuggestions.error && Array.isArray(aiSuggestions) && (
              <div style={{marginTop:16}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:10,color:'#8b5cf6'}}>AI Suggestions</div>
                {aiSuggestions.map((s,i) => <div key={i} style={{padding:'8px 10px',background:'#09090b',borderRadius:8,marginBottom:6,fontSize:13}}><strong>{s.name || s.rule}</strong> — {s.description || s.action}</div>)}
              </div>
            )}
            {aiSuggestions?.error && <div style={{color:'#ef4444',fontSize:13,marginTop:10}}>{aiSuggestions.error}</div>}
          </div>
          <div style={S.card}>
            <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Active Rules</div>
            {RULES.map(r=>(
              <div key={r.name} style={S.ruleRow}>
                <div style={S.row}>
                  <span style={{fontWeight:700}}>{r.name}</span>
                  <span style={S.badge(STATUS_COLOR[r.status])}>{r.status}</span>
                  <span style={{...S.badge("#6366f1"), marginLeft:"auto"}}>P{r.priority}</span>
                  <span style={{fontSize:12, color:"#71717a"}}>{r.runs.toLocaleString()} runs</span>
                  <button style={S.btnSm}>Edit</button>
                  <button style={{...S.btnSm, background:"#27272a"}}>Pause</button>
                </div>
                <div style={{fontSize:12, color:"#a1a1aa", marginTop:6}}>IF {r.trigger} → {r.action}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab===1 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Decision Table Editor</div>
          <p style={{color:"#a1a1aa", fontSize:13, marginBottom:16}}>Spreadsheet-style condition matrix. Each row is a rule; columns are conditions and outcomes.</p>
          <div style={{overflowX:"auto"}}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={{...S.th, background:"#12121a"}}>Order Total</th>
                  <th style={{...S.th, background:"#12121a"}}>Customer Segment</th>
                  <th style={{...S.th, background:"#12121a"}}>Has Discount</th>
                  <th style={{...S.th, background:"#12121a", color: accent}}>Action</th>
                  <th style={{...S.th, background:"#12121a", color: accent}}>Priority</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["> $500","VIP","Any","Send VIP reward","1"],
                  ["> $100","Any","No","Send upsell email","2"],
                  ["> $50","New","Any","Send welcome series","3"],
                  ["Any","Churned","Any","Win-back flow","2"],
                ].map((row,i)=>(
                  <tr key={i}>
                    {row.map((cell,j)=>(
                      <td key={j} style={{...S.td, padding:0}}>
                        <input style={{...S.input, border:"none", borderRadius:0, background:"transparent"}} defaultValue={cell}/>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{...S.row, marginTop:16}}>
            <button style={S.btn()}>Save Table</button>
            <button style={S.btnGhost}>+ Add Row</button>
            <button style={S.btnGhost}>Import CSV</button>
          </div>
        </div>
      )}

      {tab===2 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Priority Queue Monitor</div>
          <div style={S.grid3}>
            {[
              {label:"Critical Queue", count:2, color:"#ef4444"},
              {label:"High Priority", count:14, color:"#f59e0b"},
              {label:"Standard Queue", count:287, color:accent},
            ].map(q=>(
              <div key={q.label} style={{...S.metricCard, borderColor: q.color+"44"}}>
                <div style={{...S.metricNum, color: q.color}}>{q.count}</div>
                <div style={S.metricLabel}>{q.label}</div>
              </div>
            ))}
          </div>
          <div style={S.divider}/>
          <div style={{fontWeight:700, marginBottom:12}}>Rate Limiting Config</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Max Executions / Minute</label><input style={S.input} defaultValue="1000"/></div>
            <div><label style={S.label}>Burst Limit</label><input style={S.input} defaultValue="200"/></div>
            <div><label style={S.label}>Per-Tenant Limit</label><input style={S.input} defaultValue="100"/></div>
            <div><label style={S.label}>Backpressure Strategy</label><select style={S.select}><option>Queue & Retry</option><option>Drop & Alert</option><option>Throttle</option></select></div>
          </div>
          <button style={{...S.btn(), marginTop:12}}>Save Config</button>
        </div>
      )}

      {tab===3 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:8}}>Batch Aggregation Engine</div>
          <p style={{color:"#a1a1aa", fontSize:13, marginBottom:16}}>Collect N events then trigger once — e.g. bundle 100 orders into one Slack message.</p>
          <div style={S.grid2}>
            <div><label style={S.label}>Batch Trigger Event</label><select style={S.select}><option>Order Created</option><option>Customer Signed Up</option><option>Review Submitted</option></select></div>
            <div><label style={S.label}>Batch Size</label><input style={S.input} defaultValue="100"/></div>
            <div><label style={S.label}>Max Wait Window</label><input style={S.input} defaultValue="15 minutes"/></div>
            <div><label style={S.label}>Batch Action</label><select style={S.select}><option>Slack Summary</option><option>Email Report</option><option>Webhook POST</option></select></div>
          </div>
          <div style={S.divider}/>
          <div style={{fontWeight:700, marginBottom:12}}>Active Batches</div>
          {[{event:"Order Created", collected:67, target:100, remaining:"8 min"},{event:"Review Submitted", collected:12, target:50, remaining:"22 min"}].map(b=>(
            <div key={b.event} style={S.ruleRow}>
              <div style={S.row}>
                <span style={{fontWeight:700}}>{b.event}</span>
                <span style={{fontSize:12, color:"#a1a1aa"}}>{b.collected}/{b.target} collected</span>
                <span style={{fontSize:12, color:"#71717a", marginLeft:"auto"}}>Fires in ~{b.remaining}</span>
              </div>
              <div style={{background:"#27272a", borderRadius:4, height:6, marginTop:10}}>
                <div style={{background:accent, height:6, borderRadius:4, width: `${(b.collected/b.target)*100}%`}}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab===4 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:8}}>SAGA Pattern — Compensation Workflows</div>
          <p style={{color:"#a1a1aa", fontSize:13, marginBottom:16}}>Define rollback steps for each action. If step N fails, compensating transactions undo steps N-1, N-2, ...</p>
          <div style={S.grid2}>
            {[
              {step:1, forward:"Charge payment", compensate:"Refund payment", status:"done"},
              {step:2, forward:"Reserve inventory", compensate:"Release inventory", status:"done"},
              {step:3, forward:"Notify warehouse", compensate:"Cancel pick request", status:"failed"},
              {step:4, forward:"Send confirmation", compensate:"Send cancellation", status:"pending"},
            ].map(s=>(
              <div key={s.step} style={{...S.ruleRow, borderColor: s.status==="failed"?"#ef4444":s.status==="done"?"#22c55e22":"#27272a"}}>
                <div style={S.row}>
                  <span style={{fontWeight:700}}>Step {s.step}</span>
                  <span style={S.badge(s.status==="failed"?"#ef4444":s.status==="done"?"#22c55e":"#71717a")}>{s.status}</span>
                </div>
                <div style={{fontSize:12, marginTop:6}}><span style={{color:"#22c55e"}}>Forward:</span> {s.forward}</div>
                <div style={{fontSize:12, marginTop:4}}><span style={{color:"#ef4444"}}>Compensate:</span> {s.compensate}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab===5 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:8}}>A/B Test Node Config</div>
          <p style={{color:"#a1a1aa", fontSize:13, marginBottom:16}}>Split workflow execution for multi-armed bandit optimization of automation paths.</p>
          <div style={S.grid2}>
            <div><label style={S.label}>Test Name</label><input style={S.input} placeholder="Email vs. SMS win-back"/></div>
            <div><label style={S.label}>Traffic Split</label><select style={S.select}><option>50/50</option><option>70/30</option><option>80/20</option><option>Custom</option></select></div>
            <div><label style={S.label}>Variant A Action</label><select style={S.select}><option>Send Email</option><option>Send SMS</option><option>Push Notification</option></select></div>
            <div><label style={S.label}>Variant B Action</label><select style={S.select}><option>Send SMS</option><option>Send Email</option><option>Push Notification</option></select></div>
            <div><label style={S.label}>Success Metric</label><select style={S.select}><option>Conversion Rate</option><option>Revenue per User</option><option>Click Rate</option><option>Unsubscribe Rate</option></select></div>
            <div><label style={S.label}>Auto-Promote Winner After</label><select style={S.select}><option>1,000 users</option><option>5,000 users</option><option>Statistical significance</option></select></div>
          </div>
          <button style={{...S.btn(), marginTop:16}}>Launch A/B Test</button>
        </div>
      )}

      {tab===6 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Immutable Audit Log</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Time</th><th style={S.th}>Event</th><th style={S.th}>Rule</th><th style={S.th}>User</th><th style={S.th}>Before</th><th style={S.th}>After</th></tr></thead>
            <tbody>
              {[
                {t:"07/26 14:22","event":"Rule Updated","rule":"VIP Tagging","user":"You","before":"$200","after":"$500"},
                {t:"07/26 13:10","event":"Rule Created","rule":"Fraud Flag","user":"You","before":"—","after":"risk=HIGH"},
                {t:"07/26 11:55","event":"Rule Paused","rule":"Upsell Nudge","user":"You","before":"active","after":"paused"},
              ].map((r,i)=>(
                <tr key={i}>
                  <td style={S.td}>{r.t}</td>
                  <td style={S.td}>{r.event}</td>
                  <td style={S.td}>{r.rule}</td>
                  <td style={S.td}>{r.user}</td>
                  <td style={S.td}><span style={{color:"#ef4444", fontFamily:"monospace"}}>{r.before}</span></td>
                  <td style={S.td}><span style={{color:"#22c55e", fontFamily:"monospace"}}>{r.after}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}