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
};

const TABS = ["MRR Dashboard","Subscribers","Plans & Pricing","Churn Reduction","Dunning Manager","Analytics","Box Builder"];

export default function SubscriptionManagement() {
  const [tab, setTab] = useState(0);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Subscription Management</h1>
        <p style={S.subtitle}>Recurring revenue platform — manage subscriptions, reduce churn, and optimise MRR</p>
      </div>

      <div style={{...S.grid3, gridTemplateColumns:"1fr 1fr 1fr 1fr", marginBottom:24}}>
        {[["MRR","$84,200"],["Active Subs","2,840"],["Churn Rate","2.1%"],["LTV/Subscriber","$840"]].map(([l,v])=>(
          <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>

      <div style={S.tabs}>
        {TABS.map((t,i)=><button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      {tab===0 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:20}}>MRR Overview</div>
          <div style={{...S.grid3, gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr"}}>
            {[["New MRR","$8,400"],["Expansion MRR","$2,100"],["Contraction MRR","-$840"],["Churned MRR","-$1,260"],["Net New MRR","$8,400"]].map(([l,v])=>(
              <div key={l} style={{...S.metricCard, borderColor: v.startsWith("-")?"#ef444444":"#27272a"}}>
                <div style={{...S.metricNum, fontSize:20, color: v.startsWith("-")?"#ef4444":accent}}>{v}</div>
                <div style={S.metricLabel}>{l}</div>
              </div>
            ))}
          </div>
          <div style={S.divider}/>
          <div style={S.grid2}>
            <div style={{...S.metricCard}}>
              <div style={S.metricNum}>$840</div>
              <div style={S.metricLabel}>Average Revenue Per User (ARPU)</div>
            </div>
            <div style={{...S.metricCard}}>
              <div style={S.metricNum}>47.6mo</div>
              <div style={S.metricLabel}>Average Subscription Duration</div>
            </div>
          </div>
        </div>
      )}

      {tab===1 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Active Subscribers</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Customer</th><th style={S.th}>Plan</th><th style={S.th}>Since</th><th style={S.th}>Next Billing</th><th style={S.th}>MRR</th><th style={S.th}></th></tr></thead>
            <tbody>
              {[
                {name:"Alice Johnson",plan:"Pro Monthly",since:"Jan 2025",next:"Aug 1",mrr:"$49"},
                {name:"Bob Chen",plan:"Enterprise Annual",since:"Mar 2024",next:"Mar 2026",mrr:"$199"},
                {name:"Carol Smith",plan:"Starter Monthly",since:"Jun 2025",next:"Aug 1",mrr:"$19"},
                {name:"David Kim",plan:"Pro Annual",since:"Oct 2024",next:"Oct 2025",mrr:"$39"},
              ].map(s=>(
                <tr key={s.name}>
                  <td style={S.td}><strong>{s.name}</strong></td>
                  <td style={S.td}><span style={S.badge(accent)}>{s.plan}</span></td>
                  <td style={S.td}>{s.since}</td>
                  <td style={S.td}>{s.next}</td>
                  <td style={S.td}>{s.mrr}</td>
                  <td style={S.td}><button style={S.btnSm}>Manage</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab===2 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Plans & Pricing</div>
          <div style={S.grid3}>
            {[{name:"Starter",price:"$19/mo",features:["5 products","Email support","Basic analytics"],subs:840},{name:"Pro",price:"$49/mo",features:["Unlimited products","Priority support","Advanced analytics","AI features"],subs:1620},{name:"Enterprise",price:"$199/mo",features:["Everything in Pro","Custom integrations","Dedicated CSM","SLA guarantee"],subs:380}].map(p=>(
              <div key={p.name} style={{background:"#09090b", border:"1px solid #27272a", borderRadius:12, padding:20}}>
                <div style={{fontWeight:700, fontSize:16, marginBottom:4}}>{p.name}</div>
                <div style={{fontSize:22, fontWeight:800, color:accent, marginBottom:12}}>{p.price}</div>
                {p.features.map(f=><div key={f} style={{fontSize:13, color:"#a1a1aa", marginBottom:4}}>✓ {f}</div>)}
                <div style={S.divider}/>
                <div style={{fontSize:12, color:"#71717a"}}>{p.subs} subscribers</div>
                <button style={{...S.btn(), marginTop:12, width:"100%"}}>Edit Plan</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab===3 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Churn Reduction Playbooks</div>
          <div style={S.grid2}>
            {[
              {play:"Pause Instead of Cancel", detail:"Offer 1-month pause to hesitant cancellers — saves 34% of at-risk subs", saved:"$2,100/mo"},
              {play:"Downgrade Offer", detail:"Offer Starter plan at 50% off vs full cancellation", saved:"$1,440/mo"},
              {play:"Exit Survey + Incentive", detail:"Capture cancel reason + offer 20% off if they stay", saved:"$840/mo"},
              {play:"Churn Prediction Alert", detail:"Flag subscribers with declining usage 30 days before likely cancel", saved:"$4,200/mo (projected)"},
            ].map(p=>(
              <div key={p.play} style={{background:"#09090b", border:"1px solid #27272a", borderRadius:10, padding:16}}>
                <div style={{fontWeight:700, marginBottom:6}}>{p.play}</div>
                <div style={{fontSize:13, color:"#a1a1aa", marginBottom:8}}>{p.detail}</div>
                <div style={{fontSize:13, color:"#22c55e", fontWeight:600, marginBottom:10}}>{p.saved}</div>
                <button style={S.btnSm}>Enable</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab===4 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Dunning Manager — Failed Payment Recovery</div>
          <div style={S.grid3}>
            {[["Failed This Month","142"],["Recovered","98 (69%)"],["Revenue Recovered","$4,802"]].map(([l,v])=>(
              <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
          <div style={S.divider}/>
          <div style={{fontWeight:700, marginBottom:12}}>Dunning Sequence</div>
          {[
            {day:"Day 1",action:"Auto-retry payment","channel":"System"},
            {day:"Day 3",action:"Email: Payment failed — please update card","channel":"Email"},
            {day:"Day 7",action:"Email: Final notice — account will pause in 3 days","channel":"Email"},
            {day:"Day 10",action:"SMS: Urgent — update payment to keep subscription","channel":"SMS"},
            {day:"Day 14",action:"Subscription paused — cancellation flow triggered","channel":"System"},
          ].map((d,i)=>(
            <div key={i} style={{display:"flex", gap:12, alignItems:"flex-start", marginBottom:12}}>
              <span style={{...S.badge(accent), minWidth:60, textAlign:"center"}}>{d.day}</span>
              <span style={{fontSize:13, flex:1}}>{d.action}</span>
              <span style={S.badge("#3f3f46")}>{d.channel}</span>
            </div>
          ))}
          <button style={{...S.btn(), marginTop:8}}>Edit Sequence</button>
        </div>
      )}

      {tab===5 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Subscription Analytics</div>
          <div style={{...S.grid3, gridTemplateColumns:"1fr 1fr 1fr 1fr"}}>
            {[["Net Revenue Retention","108%"],["Gross Revenue Retention","97.9%"],["Quick Ratio","4.2"],["CAC Payback","3.2mo"]].map(([l,v])=>(
              <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
          <div style={S.divider}/>
          <div style={{fontWeight:700, marginBottom:12}}>Cohort Retention</div>
          <div style={{overflowX:"auto"}}>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Cohort</th><th style={S.th}>M0</th><th style={S.th}>M1</th><th style={S.th}>M3</th><th style={S.th}>M6</th><th style={S.th}>M12</th></tr></thead>
              <tbody>
                {[["Jan 2025","100%","91%","84%","78%","72%"],["Feb 2025","100%","93%","87%","81%","—"],["Mar 2025","100%","90%","83%","—","—"]].map((r,i)=>(
                  <tr key={i}>{r.map((c,j)=><td key={j} style={{...S.td, color: j===0?"#fafafa": c==="100%"?"#22c55e": parseFloat(c)>80?"#22c55e": parseFloat(c)>70?"#f59e0b":"#ef4444"}}>{c}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab===6 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Subscription Box Builder</div>
          <p style={{color:"#a1a1aa", fontSize:13, marginBottom:16}}>Create curated subscription boxes with configurable product slots, frequency, and customisation options.</p>
          <div style={S.grid2}>
            <div><label style={S.label}>Box Name</label><input style={S.input} placeholder="Monthly Essentials Box"/></div>
            <div><label style={S.label}>Billing Frequency</label><select style={S.select}><option>Monthly</option><option>Every 6 weeks</option><option>Quarterly</option><option>Annual</option></select></div>
            <div><label style={S.label}>Box Price</label><input style={S.input} placeholder="$49.99"/></div>
            <div><label style={S.label}>Product Slots</label><input style={S.input} defaultValue="5"/></div>
            <div><label style={S.label}>Allow Customisation</label><select style={S.select}><option>Yes — customer picks products</option><option>No — curated only</option></select></div>
            <div><label style={S.label}>Shipping Included</label><select style={S.select}><option>Yes</option><option>No — charge separately</option></select></div>
          </div>
          <button style={{...S.btn(), marginTop:16}}>Create Box</button>
        </div>
      )}
    </div>
  );
}