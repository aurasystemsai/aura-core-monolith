import { useState } from "react";
import { apiFetchJSON } from "../../api";

const accent = "#f97316";
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

const TABS = ["Dashboard","Affiliates","Commission Rules","Payouts","Creative Assets","Fraud Detection","Recruitment"];

const AFFILIATES = [
  { name: "Sarah Chen", tier: "Gold", clicks: 2840, conv: 184, revenue: "$9,200", commission: "$920", status: "active" },
  { name: "Mike Torres", tier: "Silver", clicks: 1420, conv: 88, revenue: "$4,400", commission: "$440", status: "active" },
  { name: "Emma Wilson", tier: "Bronze", clicks: 840, conv: 31, revenue: "$1,550", commission: "$155", status: "active" },
  { name: "James Park", tier: "Gold", clicks: 3100, conv: 210, revenue: "$10,500", commission: "$1,050", status: "suspended" },
];

const TIER_COLOR = { Gold: "#f59e0b", Silver: "#a1a1aa", Bronze: "#f97316" };

export default function AffiliatePartnerManagement() {
  const [tab, setTab] = useState(0);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Affiliate & Partner Management</h1>
        <p style={S.subtitle}>Full-stack affiliate program — recruit, track, pay, and grow your partner network</p>
      </div>

      <div style={{...S.grid3, gridTemplateColumns:"1fr 1fr 1fr 1fr", marginBottom:24}}>
        {[["Active Affiliates","284"],["This Month Revenue","$84,200"],["Total Commissions","$8,420"],["Avg Conv. Rate","6.4%"]].map(([l,v])=>(
          <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>

      <div style={S.tabs}>
        {TABS.map((t,i)=><button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      {tab===0 && (
        <div>
          <div style={{...S.grid3, marginBottom:20}}>
            {[{label:"Clicks Today",val:"12,840"},{label:"Conversions Today",val:"824"},{label:"Revenue Today",val:"$41,200"}].map(m=>(
              <div key={m.label} style={S.metricCard}><div style={S.metricNum}>{m.val}</div><div style={S.metricLabel}>{m.label}</div></div>
            ))}
          </div>
          <div style={S.card}>
            <div style={{fontWeight:700, marginBottom:16}}>Top Performers This Month</div>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Affiliate</th><th style={S.th}>Tier</th><th style={S.th}>Clicks</th><th style={S.th}>Conversions</th><th style={S.th}>Revenue</th><th style={S.th}>Commission</th></tr></thead>
              <tbody>
                {AFFILIATES.slice(0,3).map(a=>(
                  <tr key={a.name}>
                    <td style={S.td}><strong>{a.name}</strong></td>
                    <td style={S.td}><span style={S.badge(TIER_COLOR[a.tier])}>{a.tier}</span></td>
                    <td style={S.td}>{a.clicks.toLocaleString()}</td>
                    <td style={S.td}>{a.conv}</td>
                    <td style={S.td}>{a.revenue}</td>
                    <td style={S.td}>{a.commission}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab===1 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>All Affiliates</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Affiliate</th><th style={S.th}>Tier</th><th style={S.th}>Clicks</th><th style={S.th}>Revenue</th><th style={S.th}>Commission</th><th style={S.th}>Status</th><th style={S.th}></th></tr></thead>
            <tbody>
              {AFFILIATES.map(a=>(
                <tr key={a.name}>
                  <td style={S.td}><strong>{a.name}</strong></td>
                  <td style={S.td}><span style={S.badge(TIER_COLOR[a.tier])}>{a.tier}</span></td>
                  <td style={S.td}>{a.clicks.toLocaleString()}</td>
                  <td style={S.td}>{a.revenue}</td>
                  <td style={S.td}>{a.commission}</td>
                  <td style={S.td}><span style={S.badge(a.status==="active"?"#22c55e":"#ef4444")}>{a.status}</span></td>
                  <td style={S.td}><div style={S.row}><button style={S.btnSm}>View</button><button style={{...S.btnSm, background:"#27272a"}}>Message</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button style={{...S.btn(), marginTop:16}}>Invite Affiliate</button>
        </div>
      )}

      {tab===2 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Commission Structure</div>
          <div style={S.grid3}>
            {[{tier:"Bronze",rate:"10%",min:"0",max:"$500/mo"},{tier:"Silver",rate:"12%",min:"$500",max:"$2,000/mo"},{tier:"Gold",rate:"15%",min:"$2,000",max:"Unlimited"}].map(t=>(
              <div key={t.tier} style={{...S.metricCard, borderColor: TIER_COLOR[t.tier]+"44"}}>
                <div style={{...S.metricNum, color: TIER_COLOR[t.tier]}}>{t.tier}</div>
                <div style={{fontSize:24, fontWeight:800, marginTop:8}}>{t.rate}</div>
                <div style={{fontSize:12, color:"#71717a", marginTop:4}}>Monthly earnings: {t.max}</div>
              </div>
            ))}
          </div>
          <div style={S.divider}/>
          <div style={{fontWeight:700, marginBottom:12}}>Custom Commission Rules</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Product / Collection</label><select style={S.select}><option>All Products</option><option>New Arrivals</option><option>Sale Items</option><option>Bundles</option></select></div>
            <div><label style={S.label}>Commission Rate</label><input style={S.input} defaultValue="10%"/></div>
            <div><label style={S.label}>Cookie Duration (days)</label><input style={S.input} defaultValue="30"/></div>
            <div><label style={S.label}>Attribution Model</label><select style={S.select}><option>Last Click</option><option>First Click</option><option>Linear</option><option>Time Decay</option></select></div>
          </div>
          <button style={{...S.btn(), marginTop:12}}>Save Rules</button>
        </div>
      )}

      {tab===3 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Payout Management</div>
          <div style={S.grid3}>
            {[["Pending Payouts","$18,400"],["Paid This Month","$62,800"],["Next Payout Date","Aug 1"]].map(([l,v])=>(
              <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
          <div style={S.divider}/>
          <div style={{fontWeight:700, marginBottom:12}}>Pending Payouts</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Affiliate</th><th style={S.th}>Amount</th><th style={S.th}>Method</th><th style={S.th}></th></tr></thead>
            <tbody>
              {[{name:"Sarah Chen",amount:"$920",method:"PayPal"},{name:"Mike Torres",amount:"$440",method:"Bank Transfer"},{name:"Emma Wilson",amount:"$155",method:"PayPal"}].map(p=>(
                <tr key={p.name}><td style={S.td}>{p.name}</td><td style={S.td}><strong>{p.amount}</strong></td><td style={S.td}>{p.method}</td><td style={S.td}><button style={S.btnSm}>Pay Now</button></td></tr>
              ))}
            </tbody>
          </table>
          <button style={{...S.btn(), marginTop:16}}>Process All Payouts</button>
        </div>
      )}

      {tab===4 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Creative Asset Library</div>
          <div style={S.grid3}>
            {[
              {name:"Banner 728x90", type:"Banner", downloads:840},
              {name:"Square 1080x1080", type:"Social", downloads:1240},
              {name:"Story 1080x1920", type:"Social", downloads:620},
              {name:"Text Links", type:"Link", downloads:2100},
              {name:"Product Catalog", type:"Feed", downloads:380},
              {name:"Email Templates", type:"Email", downloads:560},
            ].map(a=>(
              <div key={a.name} style={{background:"#09090b", border:"1px solid #27272a", borderRadius:10, padding:16}}>
                <div style={{fontWeight:700, marginBottom:4}}>{a.name}</div>
                <div style={{fontSize:12, color:"#71717a", marginBottom:8}}>{a.type} | {a.downloads} downloads</div>
                <button style={S.btnSm}>Download</button>
              </div>
            ))}
          </div>
          <button style={{...S.btn(), marginTop:16}}>Upload New Asset</button>
        </div>
      )}

      {tab===5 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Fraud Detection</div>
          <div style={S.grid2}>
            {[
              {flag:"Self-Referral Detected", affiliate:"James Park", detail:"14 orders from same IP as affiliate account", severity:"high"},
              {flag:"Click Anomaly", affiliate:"Unknown", detail:"2,840 clicks in 10 minutes from single IP — bot suspected", severity:"high"},
            ].map((f,i)=>(
              <div key={i} style={{...S.card, marginBottom:0, borderColor:"#ef4444"}}>
                <div style={S.row}>
                  <span style={S.badge("#ef4444")}>{f.flag}</span>
                  <span style={{fontWeight:700}}>{f.affiliate}</span>
                </div>
                <div style={{fontSize:13, color:"#a1a1aa", marginTop:8}}>{f.detail}</div>
                <div style={{...S.row, marginTop:10}}>
                  <button style={{...S.btnSm, background:"#ef4444"}}>Suspend</button>
                  <button style={{...S.btnSm, background:"#27272a"}}>Dismiss</button>
                </div>
              </div>
            ))}
          </div>
          <div style={S.divider}/>
          <div style={{fontWeight:700, marginBottom:12}}>Fraud Rules</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Max Clicks / Hour</label><input style={S.input} defaultValue="500"/></div>
            <div><label style={S.label}>Block Self-Referral</label><select style={S.select}><option>Yes (Recommended)</option><option>No</option></select></div>
            <div><label style={S.label}>VPN/Proxy Block</label><select style={S.select}><option>Flag Only</option><option>Block</option></select></div>
            <div><label style={S.label}>Duplicate Order Window</label><input style={S.input} defaultValue="24 hours"/></div>
          </div>
          <button style={{...S.btn(), marginTop:12}}>Save Rules</button>
        </div>
      )}

      {tab===6 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Affiliate Recruitment</div>
          <p style={{color:"#a1a1aa", fontSize:13, marginBottom:16}}>Find and invite high-quality affiliates in your niche.</p>
          <div style={S.grid2}>
            <div><label style={S.label}>Niche / Category</label><input style={S.input} placeholder="e.g. Fashion, Fitness, Beauty"/></div>
            <div><label style={S.label}>Min Audience Size</label><input style={S.input} placeholder="10,000 followers"/></div>
          </div>
          <button style={{...S.btn(), marginTop:12}}>Find Affiliates (3 credits)</button>
          <div style={S.divider}/>
          <div style={{fontWeight:700, marginBottom:12}}>Public Application Page</div>
          <div style={{background:"#09090b", borderRadius:8, padding:16, fontFamily:"monospace", fontSize:12, color:"#22c55e"}}>
            https://your-store.com/affiliates/apply
          </div>
          <div style={{...S.row, marginTop:12}}>
            <button style={S.btnSm}>Customize Page</button>
            <button style={S.btnGhost}>Copy Link</button>
          </div>
        </div>
      )}
    </div>
  );
}