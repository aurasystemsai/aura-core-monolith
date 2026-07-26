import { useState } from "react";
import { apiFetchJSON } from "../../api";

const accent = "#22c55e";
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
  btn: (c) => ({ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: c || accent, color: "#fff" }),
  btnSm: { padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: accent, color: "#fff" },
  btnGhost: { padding: "8px 16px", borderRadius: 8, border: `1px solid ${accent}`, cursor: "pointer", fontWeight: 600, fontSize: 13, background: "transparent", color: accent },
  badge: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c + "22", color: c }),
  row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  divider: { borderTop: "1px solid #27272a", margin: "20px 0" },
  metricCard: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, textAlign: "center" },
  metricNum: { fontSize: 28, fontWeight: 800, color: accent },
  metricLabel: { fontSize: 12, color: "#71717a", marginTop: 4 },
  scoreCircle: { width: 120, height: 120, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", margin: "0 auto 16px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", color: "#71717a", fontSize: 12, fontWeight: 600, padding: "8px 12px", borderBottom: "1px solid #27272a" },
  td: { padding: "12px", borderBottom: "1px solid #18181b", fontSize: 13, color: "#e4e4e7" },
  checkRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #27272a" },
};

const TABS = ["Reputation Score","DNS Health","Blacklist Monitor","Inbox Testing","List Hygiene","Warm-Up Planner","Spam Analyzer"];

const DNS_CHECKS = [
  { record: "SPF", status: "pass", detail: "v=spf1 include:_spf.google.com ~all" },
  { record: "DKIM", status: "pass", detail: "2048-bit key configured" },
  { record: "DMARC", status: "warning", detail: "p=none — upgrade to p=quarantine" },
  { record: "BIMI", status: "fail", detail: "No BIMI record found" },
  { record: "MTA-STS", status: "pass", detail: "Policy: enforce, max_age: 604800" },
];

const STATUS_COLOR = { pass: "#22c55e", warning: "#f59e0b", fail: "#ef4444" };

export default function EmailDeliverability() {
  const [tab, setTab] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [domain, setDomain] = useState("mystore.com");

  const scan = async () => {
    setScanning(true);
    try { await apiFetchJSON("/api/email-deliverability/scan", { method: "POST", body: JSON.stringify({ domain }) }); } catch (_) {}
    setTimeout(() => setScanning(false), 2000);
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Email Deliverability Intelligence</h1>
        <p style={S.subtitle}>Domain reputation, DNS health, blacklist monitoring, and inbox placement testing</p>
      </div>

      <div style={{...S.grid3, gridTemplateColumns:"1fr 1fr 1fr 1fr", marginBottom:24}}>
        {[["Sender Score","94/100"],["Inbox Rate","97.2%"],["Blacklists","0/92"],["Bounce Rate","0.8%"]].map(([l,v])=>(
          <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>

      <div style={S.tabs}>
        {TABS.map((t,i)=><button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      {tab===0 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:20}}>Domain Reputation Overview</div>
          <div style={S.grid3}>
            {[
              {label:"Sender Score", val:94, max:100, color:"#22c55e"},
              {label:"Google Postmaster", val:88, max:100, color:accent},
              {label:"Microsoft SNDS", val:91, max:100, color:"#06b6d4"},
            ].map(m=>(
              <div key={m.label} style={S.metricCard}>
                <div style={{...S.scoreCircle, border:`4px solid ${m.color}`}}>
                  <div style={{fontSize:28, fontWeight:800, color:m.color}}>{m.val}</div>
                  <div style={{fontSize:10, color:"#71717a"}}>/{m.max}</div>
                </div>
                <div style={{fontWeight:700}}>{m.label}</div>
              </div>
            ))}
          </div>
          <div style={S.divider}/>
          <div style={{fontWeight:700, marginBottom:12}}>Scan Domain</div>
          <div style={S.row}>
            <input style={{...S.input, flex:1}} value={domain} onChange={e=>setDomain(e.target.value)} placeholder="yourdomain.com"/>
            <button style={S.btn()} onClick={scan} disabled={scanning}>{scanning?"Scanning...":"Run Full Scan (2 credits)"}</button>
          </div>
        </div>
      )}

      {tab===1 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>DNS Authentication Health</div>
          {DNS_CHECKS.map(d=>(
            <div key={d.record} style={S.checkRow}>
              <span style={{...S.badge(STATUS_COLOR[d.status]), minWidth:60, textAlign:"center"}}>{d.record}</span>
              <span style={{...S.badge(STATUS_COLOR[d.status])}}>{d.status.toUpperCase()}</span>
              <span style={{fontSize:13, color:"#a1a1aa", fontFamily:"monospace", flex:1}}>{d.detail}</span>
              {d.status !== "pass" && <button style={S.btnSm}>Fix</button>}
            </div>
          ))}
          <div style={S.divider}/>
          <div style={{fontWeight:700, marginBottom:12}}>AI-Generated Fix Recommendations</div>
          <div style={{background:"#09090b", borderRadius:8, padding:16, fontSize:13, color:"#a1a1aa"}}>
            Your DMARC policy is set to <span style={{color:"#f59e0b"}}>p=none</span> (monitoring only). Upgrade to <span style={{color:"#22c55e"}}>p=quarantine</span> to protect your domain from spoofing and improve deliverability with strict receivers like Microsoft 365.
          </div>
          <button style={{...S.btn(), marginTop:12}}>Apply Fix Automatically</button>
        </div>
      )}

      {tab===2 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Blacklist Monitor — 92 Lists</div>
          <div style={{...S.row, marginBottom:16}}>
            <span style={S.badge("#22c55e")}>0 Listings Found</span>
            <span style={{color:"#a1a1aa", fontSize:13}}>Last checked: 2 hours ago</span>
            <button style={{...S.btnSm, marginLeft:"auto"}}>Refresh Now</button>
          </div>
          <div style={S.grid3}>
            {["Spamhaus SBL","Spamhaus ZEN","SORBS DUHL","Barracuda","SpamCop","MXToolbox"].map(bl=>(
              <div key={bl} style={{...S.checkRow, borderBottom:"none", background:"#09090b", borderRadius:8, padding:12, marginBottom:8}}>
                <span style={S.badge("#22c55e")}>CLEAN</span>
                <span style={{fontSize:13}}>{bl}</span>
              </div>
            ))}
          </div>
          <div style={S.divider}/>
          <div style={{color:"#a1a1aa", fontSize:13}}>Monitoring 86 additional lists. All clean. Alerts enabled — you will be notified within 15 minutes of any new listing.</div>
        </div>
      )}

      {tab===3 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Inbox Placement Test</div>
          <p style={{color:"#a1a1aa", fontSize:13, marginBottom:16}}>Send a test email to seed addresses and see exactly which inbox folder it lands in across 30+ providers.</p>
          <div style={S.grid2}>
            {[
              {provider:"Gmail", placement:"Inbox", rate:"98%", color:"#22c55e"},
              {provider:"Outlook / M365", placement:"Inbox", rate:"94%", color:"#22c55e"},
              {provider:"Yahoo Mail", placement:"Inbox", rate:"97%", color:"#22c55e"},
              {provider:"Apple Mail", placement:"Inbox", rate:"99%", color:"#22c55e"},
              {provider:"AOL", placement:"Inbox", rate:"92%", color:"#22c55e"},
              {provider:"iCloud", placement:"Junk", rate:"12%", color:"#ef4444"},
            ].map(p=>(
              <div key={p.provider} style={{background:"#09090b", border:"1px solid #27272a", borderRadius:8, padding:12}}>
                <div style={S.row}>
                  <span style={{fontWeight:700}}>{p.provider}</span>
                  <span style={S.badge(p.color)}>{p.placement}</span>
                  <span style={{marginLeft:"auto", fontWeight:700, color:p.color}}>{p.rate}</span>
                </div>
              </div>
            ))}
          </div>
          <button style={{...S.btn(), marginTop:16}}>Run New Inbox Test (3 credits)</button>
        </div>
      )}

      {tab===4 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>List Hygiene & Validation</div>
          <div style={S.grid3}>
            {[["Total Subscribers","84,200"],["Valid Addresses","81,140 (96.4%)"],["Risky / Disposable","1,840"],["Role Addresses","820"],["Hard Bounces","400"]].slice(0,3).map(([l,v])=>(
              <div key={l} style={S.metricCard}><div style={S.metricNum}>{v.split(" ")[0]}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
          <div style={S.divider}/>
          <div style={{fontWeight:700, marginBottom:12}}>Recommended Actions</div>
          {[
            {action:"Remove 400 hard bounces", impact:"Reduces bounce rate to 0.3%", severity:"high"},
            {action:"Suppress 1,840 risky addresses for next send", impact:"Protects sender score", severity:"medium"},
            {action:"Re-engage 2,100 subscribers inactive 180+ days", impact:"Or remove to improve engagement rate", severity:"low"},
          ].map((a,i)=>(
            <div key={i} style={{...S.checkRow}}>
              <span style={S.badge(a.severity==="high"?"#ef4444":a.severity==="medium"?"#f59e0b":"#71717a")}>{a.severity}</span>
              <span style={{flex:1, fontSize:13}}>{a.action}</span>
              <span style={{fontSize:12, color:"#22c55e"}}>{a.impact}</span>
              <button style={S.btnSm}>Apply</button>
            </div>
          ))}
        </div>
      )}

      {tab===5 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>IP Warm-Up Planner</div>
          <p style={{color:"#a1a1aa", fontSize:13, marginBottom:16}}>Gradually increase sending volume on a new IP to build a positive sending reputation.</p>
          <div style={S.grid2}>
            <div><label style={S.label}>New IP Address</label><input style={S.input} placeholder="203.0.113.42"/></div>
            <div><label style={S.label}>Target Daily Volume</label><input style={S.input} placeholder="50000"/></div>
          </div>
          <div style={S.divider}/>
          <div style={{fontWeight:700, marginBottom:12}}>Warm-Up Schedule (30-day plan)</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Week</th><th style={S.th}>Daily Volume</th><th style={S.th}>Segment</th><th style={S.th}>Status</th></tr></thead>
            <tbody>
              {[["Week 1","200","Most engaged only","Completed"],["Week 2","1,000","High engagement","Completed"],["Week 3","5,000","Active 30d","In Progress"],["Week 4","15,000","Active 90d","Upcoming"],["Week 5+","50,000","Full list","Upcoming"]].map((r,i)=>(
                <tr key={i}><td style={S.td}>{r[0]}</td><td style={S.td}>{r[1]}</td><td style={S.td}>{r[2]}</td><td style={S.td}><span style={S.badge(r[3]==="Completed"?"#22c55e":r[3]==="In Progress"?accent:"#3f3f46")}>{r[3]}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab===6 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Spam Score Analyzer</div>
          <p style={{color:"#a1a1aa", fontSize:13, marginBottom:16}}>Paste your email HTML to get a spam score and actionable fix list before sending.</p>
          <textarea style={{...S.input, minHeight:160, fontFamily:"monospace", fontSize:12}} placeholder="Paste email HTML here..."/>
          <button style={{...S.btn(), marginTop:12}}>Analyze Email (1 credit)</button>
          <div style={S.divider}/>
          <div style={{fontWeight:700, marginBottom:12}}>Common Spam Triggers to Avoid</div>
          <div style={S.grid2}>
            {["ALL CAPS subject lines","Excessive exclamation marks!!!","Image-only emails (no text)","Spammy words: FREE, GUARANTEE, ACT NOW","Broken HTML / missing alt text","Link to URL shorteners"].map(t=>(
              <div key={t} style={{...S.checkRow, padding:"8px 0", borderColor:"#27272a22"}}>
                <span style={{color:"#ef4444"}}>✗</span>
                <span style={{fontSize:13}}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}