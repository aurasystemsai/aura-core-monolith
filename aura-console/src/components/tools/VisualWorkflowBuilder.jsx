import { useState, useCallback } from "react";
import { apiFetchJSON } from "../../api";

const accent = "#6366f1";
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
  textarea: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, minHeight: 90, boxSizing: "border-box", resize: "vertical" },
  btn: (c) => ({ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: c || accent, color: "#fff" }),
  btnSm: { padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: accent, color: "#fff" },
  btnGhost: { padding: "8px 16px", borderRadius: 8, border: `1px solid ${accent}`, cursor: "pointer", fontWeight: 600, fontSize: 13, background: "transparent", color: accent },
  badge: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c + "22", color: c, marginRight: 6 }),
  canvas: { background: "#0d0d10", border: "1px solid #27272a", borderRadius: 12, height: 400, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" },
  node: (c) => ({ background: "#18181b", border: `2px solid ${c || accent}`, borderRadius: 10, padding: "12px 18px", minWidth: 140, cursor: "pointer", position: "relative" }),
  nodeTitle: { fontSize: 13, fontWeight: 700, color: "#fafafa" },
  nodeType: { fontSize: 11, color: "#a1a1aa" },
  connector: { position: "absolute", right: -8, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, background: accent, borderRadius: "50%", border: "2px solid #18181b", cursor: "pointer" },
  row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  divider: { borderTop: "1px solid #27272a", margin: "20px 0" },
  metricCard: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, textAlign: "center" },
  metricNum: { fontSize: 28, fontWeight: 800, color: accent },
  metricLabel: { fontSize: 12, color: "#71717a", marginTop: 4 },
  templateCard: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, cursor: "pointer" },
  statusDot: (c) => ({ width: 8, height: 8, borderRadius: "50%", background: c, display: "inline-block", marginRight: 6 }),
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", color: "#71717a", fontSize: 12, fontWeight: 600, padding: "8px 12px", borderBottom: "1px solid #27272a" },
  td: { padding: "12px", borderBottom: "1px solid #18181b", fontSize: 13, color: "#e4e4e7" },
};

const TABS = ["Canvas","Triggers","Templates","Executions","AI Builder","Optimizer","Version Control"];

const SAMPLE_NODES = [
  { id: 1, type: "Trigger", label: "Order Placed", color: "#22c55e", x: 60, y: 160 },
  { id: 2, type: "Condition", label: "Value > $100", color: "#f59e0b", x: 260, y: 120 },
  { id: 3, type: "Action", label: "Send Email", color: accent, x: 460, y: 80 },
  { id: 4, type: "Action", label: "Add Tag", color: "#06b6d4", x: 460, y: 200 },
];

const TEMPLATES = [
  { name: "VIP Customer Welcome", category: "Retention", runs: 4820, convRate: "34%" },
  { name: "Abandoned Cart Recovery", category: "E-commerce", runs: 12300, convRate: "18%" },
  { name: "Post-Purchase Upsell", category: "Revenue", runs: 7100, convRate: "22%" },
  { name: "Win-Back 90-Day", category: "Retention", runs: 3200, convRate: "9%" },
  { name: "Birthday Reward", category: "Loyalty", runs: 5500, convRate: "41%" },
];

const EXECUTIONS = [
  { workflow: "VIP Welcome", trigger: "Order #1042", status: "completed", duration: "1.2s", time: "2 min ago" },
  { workflow: "Abandoned Cart", trigger: "Cart #882", status: "running", duration: "—", time: "Just now" },
  { workflow: "Post-Purchase", trigger: "Order #1041", status: "failed", duration: "0.3s", time: "5 min ago" },
  { workflow: "Birthday Reward", trigger: "Customer #901", status: "completed", duration: "0.8s", time: "12 min ago" },
];

const STATUS_COLOR = { completed: "#22c55e", running: accent, failed: "#ef4444", paused: "#f59e0b" };

export default function VisualWorkflowBuilder() {
  const [tab, setTab] = useState(0);
  const [nlPrompt, setNlPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [versions] = useState([
    { v: "v3.0", label: "Production", date: "Jul 25", author: "You", active: true },
    { v: "v2.1", label: "Staging", date: "Jul 22", author: "You", active: false },
    { v: "v2.0", label: "Archived", date: "Jul 15", author: "You", active: false },
  ]);

  const handleNLGenerate = useCallback(async () => {
    if (!nlPrompt.trim()) return;
    setGenerating(true);
    try {
      await apiFetchJSON("/api/visual-workflow-builder/generate", { method: "POST", body: JSON.stringify({ prompt: nlPrompt }) });
    } catch (_) {}
    setTimeout(() => setGenerating(false), 1800);
  }, [nlPrompt]);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Visual Workflow Builder</h1>
        <p style={S.subtitle}>No-code automation canvas — drag, connect, and launch in minutes</p>
      </div>

      {/* Metrics */}
      <div style={{...S.grid3, gridTemplateColumns:"1fr 1fr 1fr 1fr", marginBottom:24}}>
        {[["Active Workflows","14"],["Executions Today","1,284"],["Success Rate","97.3%"],["Avg Duration","0.9s"]].map(([l,v])=>(
          <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>

      <div style={S.tabs}>
        {TABS.map((t,i)=><button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      {tab===0 && (
        <div style={S.card}>
          <div style={{...S.row, marginBottom:16, justifyContent:"space-between"}}>
            <span style={{fontWeight:700, fontSize:15}}>Workflow Canvas</span>
            <div style={S.row}>
              <button style={S.btnSm}>+ Add Node</button>
              <button style={{...S.btnSm, background:"#22c55e"}}>Activate</button>
              <button style={{...S.btnSm, background:"#27272a"}}>Save Draft</button>
            </div>
          </div>
          <div style={S.canvas}>
            {/* Simplified node representation */}
            <div style={{display:"flex", alignItems:"center", gap:24, padding:24}}>
              {SAMPLE_NODES.map((n,i)=>(
                <div key={n.id} style={{display:"flex", alignItems:"center", gap:0}}>
                  <div style={{...S.node(n.color), boxShadow: selectedNode===n.id ? `0 0 0 2px ${n.color}` : "none"}} onClick={()=>setSelectedNode(n.id===selectedNode?null:n.id)}>
                    <div style={S.nodeType}>{n.type}</div>
                    <div style={S.nodeTitle}>{n.label}</div>
                    <div style={S.connector}/>
                  </div>
                  {i<SAMPLE_NODES.length-1 && <div style={{width:32, height:2, background:"#3f3f46", marginLeft:8}}/>}
                </div>
              ))}
            </div>
            <div style={{position:"absolute", bottom:12, right:16, color:"#3f3f46", fontSize:12}}>Infinite canvas — scroll & zoom to explore</div>
          </div>
          {selectedNode && (
            <div style={{...S.card, marginTop:16, marginBottom:0}}>
              <div style={{fontWeight:700, marginBottom:12}}>Node Config — {SAMPLE_NODES.find(n=>n.id===selectedNode)?.label}</div>
              <div style={S.grid2}>
                <div><label style={S.label}>Node Name</label><input style={S.input} defaultValue={SAMPLE_NODES.find(n=>n.id===selectedNode)?.label}/></div>
                <div><label style={S.label}>Timeout (s)</label><input style={S.input} defaultValue="30"/></div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab===1 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Available Triggers</div>
          <div style={S.grid3}>
            {[
              {cat:"Shopify Orders", items:["Order Created","Order Paid","Order Fulfilled","Order Cancelled","Order Refunded"]},
              {cat:"Customer Events", items:["Customer Created","First Purchase","Repeat Purchase","Loyalty Milestone","Segment Change"]},
              {cat:"Time & Schedule", items:["Cron Schedule","Date Delay","Relative Delay","Calendar Event","Business Hours Only"]},
            ].map(g=>(
              <div key={g.cat} style={S.templateCard}>
                <div style={{fontWeight:700, marginBottom:10, color: accent}}>{g.cat}</div>
                {g.items.map(item=>(
                  <div key={item} style={{...S.row, marginBottom:6}}>
                    <span style={S.statusDot("#22c55e")}/>
                    <span style={{fontSize:13}}>{item}</span>
                    <button style={{...S.btnSm, marginLeft:"auto", padding:"3px 10px", fontSize:11}}>Add</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={S.divider}/>
          <div style={{fontWeight:700, marginBottom:12}}>Webhook & API Triggers</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Webhook URL</label><input style={S.input} readOnly value="https://your-app.com/api/visual-workflow-builder/webhook/abc123"/></div>
            <div><label style={S.label}>Expected Payload Schema</label><input style={S.input} placeholder="{ order_id, customer_id, total }"/></div>
          </div>
        </div>
      )}

      {tab===2 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Workflow Templates</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Template</th><th style={S.th}>Category</th><th style={S.th}>Total Runs</th><th style={S.th}>Avg Conv. Rate</th><th style={S.th}></th></tr></thead>
            <tbody>
              {TEMPLATES.map(t=>(
                <tr key={t.name}>
                  <td style={S.td}>{t.name}</td>
                  <td style={S.td}><span style={S.badge(accent)}>{t.category}</span></td>
                  <td style={S.td}>{t.runs.toLocaleString()}</td>
                  <td style={S.td}>{t.convRate}</td>
                  <td style={S.td}><button style={S.btnSm}>Install</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab===3 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Execution History</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Workflow</th><th style={S.th}>Trigger</th><th style={S.th}>Status</th><th style={S.th}>Duration</th><th style={S.th}>Time</th><th style={S.th}></th></tr></thead>
            <tbody>
              {EXECUTIONS.map((e,i)=>(
                <tr key={i}>
                  <td style={S.td}>{e.workflow}</td>
                  <td style={S.td}>{e.trigger}</td>
                  <td style={S.td}><span style={S.statusDot(STATUS_COLOR[e.status])}/>{e.status}</td>
                  <td style={S.td}>{e.duration}</td>
                  <td style={S.td}>{e.time}</td>
                  <td style={S.td}><button style={S.btnSm}>Replay</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab===4 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:8}}>NL2Workflow — AI Canvas Generator</div>
          <p style={{color:"#a1a1aa", fontSize:13, marginBottom:16}}>Describe your automation in plain English. AURA builds the workflow visually.</p>
          <label style={S.label}>Describe your workflow</label>
          <textarea style={S.textarea} placeholder='e.g. "When a VIP customer places an order over $200, wait 1 hour, send a thank-you email, then add them to the Loyalty Gold segment"' value={nlPrompt} onChange={e=>setNlPrompt(e.target.value)}/>
          <div style={{...S.row, marginTop:12}}>
            <button style={S.btn()} onClick={handleNLGenerate} disabled={generating}>{generating ? "Generating..." : "Generate Workflow (2 credits)"}</button>
            <button style={S.btnGhost}>View Example</button>
          </div>
          <div style={S.divider}/>
          <div style={{fontWeight:700, marginBottom:12}}>Example Prompts</div>
          <div style={S.grid2}>
            {["Send win-back email 30 days after last purchase if no new order","Tag high-LTV customers and enroll in VIP program automatically","Alert Slack when daily revenue drops below $5000","Add discount code after 3rd purchase"].map(p=>(
              <div key={p} style={S.templateCard} onClick={()=>setNlPrompt(p)}>
                <div style={{fontSize:13, color:"#a1a1aa"}}>"{p}"</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab===5 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:8}}>AI Workflow Optimizer</div>
          <p style={{color:"#a1a1aa", fontSize:13, marginBottom:20}}>Analyzes your workflow execution data to surface bottlenecks and simplification opportunities.</p>
          <div style={S.grid2}>
            {[
              {title:"Parallel Opportunity", detail:"Steps 2 & 3 can run in parallel — saves 0.4s per execution", impact:"High", icon:"⚡"},
              {title:"Redundant Condition", detail:"Condition at step 4 is always TRUE — remove for cleaner flow", impact:"Medium", icon:"🔍"},
              {title:"Slow Action Node", detail:"Send Email (step 3) avg 1.8s — switch to async delivery", impact:"High", icon:"🐢"},
              {title:"Error Hotspot", detail:"Webhook node fails 12% of the time — add retry logic", impact:"Critical", icon:"⚠️"},
            ].map(o=>(
              <div key={o.title} style={S.templateCard}>
                <div style={{...S.row, marginBottom:8}}>
                  <span style={{fontSize:18}}>{o.icon}</span>
                  <span style={{fontWeight:700}}>{o.title}</span>
                  <span style={S.badge(o.impact==="Critical"?"#ef4444":o.impact==="High"?"#f59e0b":"#22c55e")}>{o.impact}</span>
                </div>
                <div style={{fontSize:13, color:"#a1a1aa", marginBottom:10}}>{o.detail}</div>
                <button style={S.btnSm}>Apply Fix</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab===6 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Version Control</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Version</th><th style={S.th}>Environment</th><th style={S.th}>Date</th><th style={S.th}>Author</th><th style={S.th}></th></tr></thead>
            <tbody>
              {versions.map(v=>(
                <tr key={v.v}>
                  <td style={S.td}><strong>{v.v}</strong></td>
                  <td style={S.td}><span style={S.badge(v.active?accent:"#3f3f46")}>{v.label}</span></td>
                  <td style={S.td}>{v.date}</td>
                  <td style={S.td}>{v.author}</td>
                  <td style={S.td}><div style={S.row}><button style={S.btnSm}>Diff</button><button style={S.btnSm}>Promote</button><button style={{...S.btnSm, background:"#27272a"}}>Rollback</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={S.divider}/>
          <div style={{...S.row, gap:12}}>
            <button style={S.btn()}>Create Draft Branch</button>
            <button style={S.btnGhost}>View Change Log</button>
          </div>
        </div>
      )}
    </div>
  );
}