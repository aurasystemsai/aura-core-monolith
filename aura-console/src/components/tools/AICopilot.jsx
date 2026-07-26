import { useState, useRef, useEffect } from "react";
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
  textarea: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, minHeight: 80, boxSizing: "border-box", resize: "vertical" },
  btn: (c) => ({ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: c || accent, color: "#fff" }),
  btnSm: { padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: accent, color: "#fff" },
  btnGhost: { padding: "8px 16px", borderRadius: 8, border: `1px solid ${accent}`, cursor: "pointer", fontWeight: 600, fontSize: 13, background: "transparent", color: accent },
  badge: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c + "22", color: c }),
  row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  divider: { borderTop: "1px solid #27272a", margin: "20px 0" },
  metricCard: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, textAlign: "center" },
  metricNum: { fontSize: 28, fontWeight: 800, color: accent },
  metricLabel: { fontSize: 12, color: "#71717a", marginTop: 4 },
  chatArea: { background: "#0d0d10", border: "1px solid #27272a", borderRadius: 12, padding: 20, height: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 },
  userMsg: { alignSelf: "flex-end", background: accent, color: "#fff", borderRadius: "12px 12px 2px 12px", padding: "10px 16px", maxWidth: "70%", fontSize: 14 },
  auraMsg: { alignSelf: "flex-start", background: "#18181b", border: "1px solid #27272a", borderRadius: "12px 12px 12px 2px", padding: "10px 16px", maxWidth: "80%", fontSize: 14, color: "#e4e4e7" },
  chatInput: { display: "flex", gap: 10, marginTop: 12 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", color: "#71717a", fontSize: 12, fontWeight: 600, padding: "8px 12px", borderBottom: "1px solid #27272a" },
  td: { padding: "12px", borderBottom: "1px solid #18181b", fontSize: 13, color: "#e4e4e7" },
};

const TABS = ["Copilot Chat","Autonomous Tasks","Memory & Context","Action Log","Skill Library","Agent Config","Insights"];

const SAMPLE_TASKS = [
  { name: "Restock Alert Triage", status: "running", progress: 72, desc: "Analysing inventory levels across 847 products" },
  { name: "Email Campaign Optimization", status: "queued", progress: 0, desc: "Scheduled for 3pm — A/B test subject lines" },
  { name: "Churn Risk Sweep", status: "completed", progress: 100, desc: "Flagged 34 at-risk customers, drafted win-back emails" },
];

const SKILLS = [
  { name: "Revenue Analysis", desc: "Daily P&L summary, anomaly detection, trend forecasting" },
  { name: "SEO Patrol", desc: "Monitor rankings, surface drops, auto-draft fix recommendations" },
  { name: "Customer Health Monitor", desc: "Track churn signals, LTV changes, segment shifts" },
  { name: "Ad Budget Guardian", desc: "Pause underperformers, reallocate budget automatically" },
  { name: "Inventory Sentinel", desc: "Low-stock alerts, reorder suggestions, supplier contacts" },
  { name: "Content Scheduler", desc: "Queue & publish content across channels on schedule" },
];

const INITIAL_MESSAGES = [
  { role: "aura", text: "Hi! I'm AURA Copilot — your autonomous merchant agent. I can monitor your store 24/7, take actions on your behalf, and surface insights before you ask. What would you like me to do today?" },
];

export default function AICopilot() {
  const [tab, setTab] = useState(0);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(m => [...m, { role: "user", text: userMsg }]);
    setInput("");
    setSending(true);
    try {
      const r = await apiFetchJSON("/api/ai-copilot/chat", { method: "POST", body: JSON.stringify({ message: userMsg }) });
      setMessages(m => [...m, { role: "aura", text: r.reply || "Got it — I'll get right on that." }]);
    } catch (_) {
      setMessages(m => [...m, { role: "aura", text: "Understood. I've queued that task and will report back shortly." }]);
    }
    setSending(false);
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>AI Copilot</h1>
        <p style={S.subtitle}>Autonomous merchant agent — monitors, acts, and optimises your store 24/7</p>
      </div>

      <div style={{...S.grid3, gridTemplateColumns:"1fr 1fr 1fr 1fr", marginBottom:24}}>
        {[["Tasks Completed","1,284"],["Issues Resolved","47"],["Revenue Saved","$12,400"],["Hours Saved","320"]].map(([l,v])=>(
          <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>

      <div style={S.tabs}>
        {TABS.map((t,i)=><button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      {tab===0 && (
        <div style={S.card}>
          <div ref={chatRef} style={S.chatArea}>
            {messages.map((m,i)=>(
              <div key={i} style={m.role==="user" ? S.userMsg : S.auraMsg}>{m.text}</div>
            ))}
            {sending && <div style={S.auraMsg}><em style={{color:"#71717a"}}>Thinking...</em></div>}
          </div>
          <div style={S.chatInput}>
            <input style={{...S.input, flex:1}} placeholder='Ask AURA anything — "What drove the revenue dip yesterday?" or "Run a churn sweep"' value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}/>
            <button style={S.btn()} onClick={send} disabled={sending}>Send (2 credits)</button>
          </div>
          <div style={{...S.row, marginTop:10, gap:8, flexWrap:"wrap"}}>
            {["Summarise today's performance","What products need restocking?","Find my top at-risk customers","Optimise my ad spend"].map(s=>(
              <button key={s} style={{...S.btnGhost, fontSize:12, padding:"5px 12px"}} onClick={()=>setInput(s)}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {tab===1 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Autonomous Tasks</div>
          {SAMPLE_TASKS.map(t=>(
            <div key={t.name} style={{background:"#09090b", border:"1px solid #27272a", borderRadius:10, padding:16, marginBottom:12}}>
              <div style={S.row}>
                <span style={{fontWeight:700}}>{t.name}</span>
                <span style={S.badge(t.status==="completed"?"#22c55e":t.status==="running"?accent:"#f59e0b")}>{t.status}</span>
                <span style={{marginLeft:"auto", fontSize:12, color:"#71717a"}}>{t.progress}%</span>
              </div>
              <div style={{fontSize:13, color:"#a1a1aa", marginTop:6}}>{t.desc}</div>
              <div style={{background:"#27272a", borderRadius:4, height:6, marginTop:10}}>
                <div style={{background: t.status==="completed"?"#22c55e":accent, height:6, borderRadius:4, width:`${t.progress}%`}}/>
              </div>
            </div>
          ))}
          <div style={S.divider}/>
          <div style={{fontWeight:700, marginBottom:12}}>Schedule a New Task</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Task Description</label><input style={S.input} placeholder='e.g. "Every Monday: generate weekly report"'/></div>
            <div><label style={S.label}>Frequency</label><select style={{...S.input}}><option>Once</option><option>Daily</option><option>Weekly</option><option>On Trigger</option></select></div>
          </div>
          <button style={{...S.btn(), marginTop:12}}>Schedule Task (1 credit)</button>
        </div>
      )}

      {tab===2 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Copilot Memory & Context</div>
          <p style={{color:"#a1a1aa", fontSize:13, marginBottom:16}}>AURA remembers your preferences, business context, and past decisions to give better answers over time.</p>
          <div style={S.grid2}>
            {[
              {key:"Business Type", val:"DTC Shopify Store — Apparel"},
              {key:"Primary Goal", val:"Grow repeat purchase rate"},
              {key:"Top Products", val:"Hoodies, T-Shirts, Accessories"},
              {key:"Preferred Tone", val:"Friendly but data-driven"},
              {key:"Alert Threshold", val:"Revenue drop > 15% triggers alert"},
              {key:"Suppress Notifications", val:"Weekends before 9am"},
            ].map(m=>(
              <div key={m.key} style={{background:"#09090b", border:"1px solid #27272a", borderRadius:8, padding:14}}>
                <div style={{fontSize:12, color:"#71717a", marginBottom:4}}>{m.key}</div>
                <div style={{fontWeight:600}}>{m.val}</div>
              </div>
            ))}
          </div>
          <div style={S.divider}/>
          <div style={{fontWeight:700, marginBottom:12}}>Add Context</div>
          <textarea style={S.textarea} placeholder="Tell AURA something important about your business..."/>
          <button style={{...S.btn(), marginTop:8}}>Save Context</button>
        </div>
      )}

      {tab===3 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Action Log</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Time</th><th style={S.th}>Action</th><th style={S.th}>Tool</th><th style={S.th}>Outcome</th><th style={S.th}></th></tr></thead>
            <tbody>
              {[
                {t:"07/26 14:30","action":"Paused underperforming ad","tool":"Google Ads","outcome":"Saved $240/day"},
                {t:"07/26 12:15","action":"Sent win-back email to 34 customers","tool":"Email","outcome":"Queued"},
                {t:"07/26 09:00","action":"Generated weekly performance summary","tool":"Analytics","outcome":"Delivered to Slack"},
                {t:"07/25 18:00","action":"Restocked alert sent to supplier","tool":"Inventory","outcome":"Acknowledged"},
              ].map((r,i)=>(
                <tr key={i}>
                  <td style={S.td}>{r.t}</td>
                  <td style={S.td}>{r.action}</td>
                  <td style={S.td}><span style={S.badge(accent)}>{r.tool}</span></td>
                  <td style={S.td}>{r.outcome}</td>
                  <td style={S.td}><button style={S.btnSm}>Undo</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab===4 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Skill Library</div>
          <div style={S.grid2}>
            {SKILLS.map(sk=>(
              <div key={sk.name} style={{background:"#09090b", border:"1px solid #27272a", borderRadius:10, padding:16}}>
                <div style={{fontWeight:700, marginBottom:6}}>{sk.name}</div>
                <div style={{fontSize:13, color:"#a1a1aa", marginBottom:10}}>{sk.desc}</div>
                <div style={S.row}>
                  <button style={S.btnSm}>Enable</button>
                  <button style={{...S.btnSm, background:"#27272a"}}>Configure</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab===5 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Agent Configuration</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Autonomy Level</label><select style={S.input}><option>Suggest Only (manual approve)</option><option>Act on Low-Risk Tasks</option><option>Full Autonomy (review log)</option></select></div>
            <div><label style={S.label}>Default Model</label><select style={S.input}><option>gpt-4o-mini (1x credits)</option><option>gpt-4o (2x credits)</option><option>gpt-4 (3x credits)</option></select></div>
            <div><label style={S.label}>Daily Credit Budget</label><input style={S.input} defaultValue="50"/></div>
            <div><label style={S.label}>Notify Me Via</label><select style={S.input}><option>Slack</option><option>Email</option><option>Both</option></select></div>
            <div><label style={S.label}>Action Cooldown (min)</label><input style={S.input} defaultValue="15"/></div>
            <div><label style={S.label}>Working Hours</label><input style={S.input} defaultValue="Mon-Fri 8am-6pm"/></div>
          </div>
          <button style={{...S.btn(), marginTop:16}}>Save Config</button>
        </div>
      )}

      {tab===6 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>AI-Generated Insights</div>
          {[
            {type:"Revenue Opportunity", text:"Customers who bought Hoodies also buy Beanies within 14 days 68% of the time. Create a bundle offer.", impact:"~$4,200/mo", urgency:"high"},
            {type:"Risk Alert", text:"Email open rates dropped 12% this week. Consider refreshing subject line templates.", impact:"Deliverability risk", urgency:"medium"},
            {type:"SEO Win", text:"3 product pages rank on page 2 for high-volume keywords — one optimisation push could bring them to page 1.", impact:"~1,200 extra visits/mo", urgency:"low"},
          ].map((ins,i)=>(
            <div key={i} style={{...S.card, marginBottom:12, borderColor: ins.urgency==="high"?"#ef4444":ins.urgency==="medium"?"#f59e0b":"#27272a"}}>
              <div style={S.row}>
                <span style={S.badge(ins.urgency==="high"?"#ef4444":ins.urgency==="medium"?"#f59e0b":accent)}>{ins.type}</span>
                <span style={{marginLeft:"auto", fontSize:12, color:"#22c55e", fontWeight:700}}>{ins.impact}</span>
              </div>
              <div style={{fontSize:14, marginTop:8}}>{ins.text}</div>
              <div style={{...S.row, marginTop:10}}>
                <button style={S.btnSm}>Take Action</button>
                <button style={{...S.btnSm, background:"#27272a"}}>Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}