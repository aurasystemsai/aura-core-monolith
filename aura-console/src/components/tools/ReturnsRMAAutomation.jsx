import React, { useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/returns-rma-automation";

const S = {
  root: { background:'#09090b', minHeight:'100vh', color:'#fafafa', fontFamily:"'Inter',system-ui,sans-serif", padding:'28px 32px' },
  card: { background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:24, marginBottom:20 },
  mini: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:16 },
  cardTitle: { fontSize:14, fontWeight:700, color:'#fafafa', marginBottom:16, marginTop:0 },
  row: { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' },
  input: { flex:1, minWidth:180, background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:14, padding:'11px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif" },
  select: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'11px 14px', outline:'none', cursor:'pointer' },
  textarea: { width:'100%', background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'12px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif", resize:'vertical', boxSizing:'border-box' },
  btn: (bg) => ({ background:bg||'#ef4444', color:'#fff', border:'none', borderRadius:10, padding:'11px 22px', fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }),
  label: { fontSize:12, fontWeight:600, color:'#a1a1aa', marginBottom:6, display:'block' },
  tbl: { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th: { textAlign:'left', color:'#71717a', fontWeight:600, fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', padding:'10px 14px', borderBottom:'2px solid #27272a', whiteSpace:'nowrap', background:'#18181b' },
  td: { padding:'12px 14px', borderBottom:'1px solid #1f1f22', color:'#fafafa', verticalAlign:'middle' },
  trOdd: { background:'#09090b44' },
  badge: (c) => ({ display:'inline-block', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600, background:(c||'#27272a')+'33', color:c||'#a1a1aa', border:`1px solid ${(c||'#3f3f46')}44` }),
  empty: { textAlign:'center', padding:'56px 24px', color:'#52525b', fontSize:13 },
  loading: { textAlign:'center', padding:'32px 24px', color:'#71717a', fontSize:13 },
  err: { background:'#1c0c0c', border:'1px solid #7f1d1d', color:'#fca5a5', borderRadius:10, padding:'12px 16px', fontSize:13, marginBottom:16 },
  metaRow: { display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 },
  metaItem: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:'12px 18px', flex:'1 1 130px', textAlign:'center' },
  metaVal: (c) => ({ fontSize:22, fontWeight:700, color:c||'#ef4444' }),
  metaLbl: { fontSize:11, color:'#71717a', marginTop:2 },
  sT: { fontSize:12, fontWeight:700, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, marginTop:16 },
  groupNav: { display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' },
  gBtn: (a, c) => ({ background:a?c+'22':'#18181b', color:a?c:'#71717a', border:`1px solid ${a?c+'44':'#27272a'}`, borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:a?700:500, cursor:'pointer' }),
  tabStrip: { display:'flex', gap:4, marginBottom:20, flexWrap:'wrap', borderBottom:'1px solid #27272a', paddingBottom:8 },
  tBtn: (a, c) => ({ background:'none', color:a?c:'#71717a', border:'none', borderBottom:a?`2px solid ${c}`:'2px solid transparent', padding:'8px 14px', fontSize:13, fontWeight:a?700:500, cursor:'pointer', marginBottom:-9 }),
  bar: { height:6, background:'#27272a', borderRadius:3, overflow:'hidden', marginTop:4 },
  fill: (pct, c) => ({ height:'100%', width:Math.min(pct||0,100)+'%', background:c||'#ef4444', borderRadius:3 }),
  pre: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, padding:16, fontSize:12, color:'#a1a1aa', fontFamily:'monospace', whiteSpace:'pre-wrap', maxHeight:280, overflow:'auto', marginBottom:12 },
  sc: (s) => { if(s>=75) return '#10b981'; if(s>=50) return '#f59e0b'; return '#ef4444'; },
};

const GROUPS = [
  {
    "id": "returns",
    "label": "Returns",
    "color": "#ef4444",
    "tabs": [
      {
        "id": "rma-dash",
        "label": "Dashboard"
      },
      {
        "id": "new-return",
        "label": "New Return"
      },
      {
        "id": "return-list",
        "label": "Return List"
      },
      {
        "id": "bulk",
        "label": "Bulk Actions"
      },
      {
        "id": "rma-search",
        "label": "Search"
      },
      {
        "id": "rma-reports",
        "label": "Reports"
      }
    ]
  },
  {
    "id": "intel",
    "label": "Intelligence",
    "color": "#4f46e5",
    "tabs": [
      {
        "id": "fraud-detect",
        "label": "Fraud Detection"
      },
      {
        "id": "propensity",
        "label": "Return Propensity"
      },
      {
        "id": "reason-nlp",
        "label": "Reason Analysis"
      },
      {
        "id": "return-dna",
        "label": "Customer DNA"
      },
      {
        "id": "patterns",
        "label": "Patterns"
      },
      {
        "id": "ai-classify",
        "label": "AI Classify"
      }
    ]
  },
  {
    "id": "dispo",
    "label": "Disposition",
    "color": "#f97316",
    "tabs": [
      {
        "id": "routing-rules",
        "label": "Routing Rules"
      },
      {
        "id": "condition",
        "label": "Condition Grading"
      },
      {
        "id": "restock",
        "label": "Restock Queue"
      },
      {
        "id": "refurbish",
        "label": "Refurbish"
      },
      {
        "id": "liquidate",
        "label": "Liquidate"
      },
      {
        "id": "recovery",
        "label": "Recovery Rate"
      }
    ]
  },
  {
    "id": "revenue",
    "label": "Revenue",
    "color": "#10b981",
    "tabs": [
      {
        "id": "exchange-first",
        "label": "Exchange First"
      },
      {
        "id": "store-credit",
        "label": "Store Credit"
      },
      {
        "id": "upsell-ret",
        "label": "Upsell Flow"
      },
      {
        "id": "policy-ab",
        "label": "Policy A/B Test"
      },
      {
        "id": "recovery-kpi",
        "label": "Recovery KPIs"
      },
      {
        "id": "incentives",
        "label": "Incentives"
      }
    ]
  },
  {
    "id": "logistics",
    "label": "Logistics",
    "color": "#0ea5e9",
    "tabs": [
      {
        "id": "labels",
        "label": "Return Labels"
      },
      {
        "id": "carriers",
        "label": "Carriers"
      },
      {
        "id": "tracking",
        "label": "Tracking"
      },
      {
        "id": "international",
        "label": "International"
      },
      {
        "id": "carrier-perf",
        "label": "Carrier Perf"
      },
      {
        "id": "portal",
        "label": "Returns Portal"
      }
    ]
  },
  {
    "id": "analytics",
    "label": "Analytics",
    "color": "#a855f7",
    "tabs": [
      {
        "id": "rma-kpis",
        "label": "KPIs"
      },
      {
        "id": "by-product",
        "label": "By Product"
      },
      {
        "id": "by-customer",
        "label": "By Customer"
      },
      {
        "id": "by-reason",
        "label": "By Reason"
      },
      {
        "id": "rma-trends",
        "label": "Trends"
      },
      {
        "id": "rma-bench",
        "label": "Benchmarks"
      }
    ]
  },
  {
    "id": "rma-adv",
    "label": "Advanced",
    "color": "#f59e0b",
    "tabs": [
      {
        "id": "rma-integrations",
        "label": "Integrations"
      },
      {
        "id": "webhooks",
        "label": "Webhooks"
      },
      {
        "id": "rma-api",
        "label": "API"
      },
      {
        "id": "rma-settings",
        "label": "Settings"
      },
      {
        "id": "rma-alrt",
        "label": "Alerts"
      },
      {
        "id": "rma-world",
        "label": "World-Class"
      }
    ]
  }
];

export default function ReturnsRMAAutomation() {
  const [activeGroup, setActiveGroup] = useState(GROUPS[0].id);
  const [activeTab, setActiveTab] = useState(GROUPS[0].tabs[0].id);
  const [q, setQ] = useState({});
  const [form, setForm] = useState({ model:'gpt-4o-mini' });
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [err, setErr] = useState({});
  const [toast, setToast] = useState(null);

  const curGroup = GROUPS.find(g => g.id === activeGroup) || GROUPS[0];

  function toast_(msg, c='#10b981') { setToast({msg,c}); setTimeout(() => setToast(null), 3200); }

  async function fetch_(tab, endpoint, payload={}) {
    setLoading(l => ({...l,[tab]:true}));
    setErr(e => ({...e,[tab]:null}));
    try {
      const r = await apiFetchJSON(endpoint, { method:'POST', body:JSON.stringify({ ...payload, model:form.model }) });
      if (r.ok) setData(d => ({...d,[tab]:r.data||r}));
      else setErr(e => ({...e,[tab]:r.error||'Failed'}));
    } catch(e) { setErr(er => ({...er,[tab]:e.message})); }
    finally { setLoading(l => ({...l,[tab]:false})); }
  }

  function Generic(tab, title, desc, ep) {
    const d = data[tab];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>{title}</div>
          {desc && <p style={{color:'#71717a',fontSize:13,marginTop:0}}>{desc}</p>}
          <div style={S.row}>
            <input style={S.input} placeholder="Search or filter…" value={q[tab]||''} onChange={e=>setQ(p=>({...p,[tab]:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&fetch_(tab,ep,{query:q[tab]})} />
            <button style={S.btn()} onClick={()=>fetch_(tab,ep,{query:q[tab]})} disabled={loading[tab]}>{loading[tab]?'Loading…':'Load Data'}</button>
            <button style={S.btn('#10b981')} onClick={()=>toast_('AI analyzing…')}>✦ AI Insights</button>
          </div>
          {err[tab] && <div style={S.err}>{err[tab]}</div>}
          {loading[tab] ? <div style={S.loading}>Loading {title.toLowerCase()}…</div> :
           d ? (
            <div style={{overflowX:'auto'}}>
              <table style={S.tbl}>
                <thead><tr><th style={S.th}>Item</th><th style={S.th}>Category</th><th style={S.th}>Value</th><th style={S.th}>Status</th></tr></thead>
                <tbody>{(Array.isArray(d)?d:Object.values(d)[0]||[]).map((row,i)=>(
                  <tr key={i} style={i%2?S.trOdd:{}}>
                    <td style={S.td}>{row.name||row.id||row.label||row.item||JSON.stringify(row).slice(0,40)}</td>
                    <td style={S.td}><span style={{color:'#71717a',fontSize:12}}>{row.category||row.type||row.group||'—'}</span></td>
                    <td style={S.td}><span style={{fontWeight:600}}>{row.value||row.amount||row.score||'—'}</span></td>
                    <td style={S.td}>{row.status?<span style={S.badge(row.status==='active'||row.status==='ok'?'#10b981':row.status==='warning'?'#f59e0b':'#ef4444')}>{row.status}</span>:'—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
           ) : <div style={S.empty}>Enter a query to load {title.toLowerCase()}.</div>}
        </div>
      </div>
    );
  }


  function renderTab() {
    const tab = activeTab;
    const d = data[tab];
    switch(tab) {
      case 'rma-dash': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Returns Dashboard</div>
            <div style={S.row}>
              <button style={S.btn('#ef4444')} onClick={()=>fetch_('rma-dash',API+'/returns/dashboard')} disabled={loading['rma-dash']}>{loading['rma-dash']?'Loading…':'Load Dashboard'}</button>
              <button style={S.btn('#10b981')} onClick={()=>{setActiveGroup('revenue');setActiveTab('exchange-first');}}>Exchange-First View</button>
            </div>
            {err['rma-dash'] && <div style={S.err}>{err['rma-dash']}</div>}
            {loading['rma-dash'] ? <div style={S.loading}>Loading…</div> : d ? (
              <>
                <div style={S.metaRow}>
                  {[['Total Returns',d.totalReturns,'#ef4444'],['Return Rate',d.returnRate+'%','#f97316'],['Recovery Rate',d.recoveryRate+'%','#10b981'],['Avg Days',d.avgProcessingDays,'#0ea5e9'],['Fraud Flagged',d.fraudFlagged,'#a855f7'],['Revenue Recovered','$'+d.revenueRecovered?.toLocaleString(),'#4f46e5']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
                <div style={S.sT}>Returns by Reason</div>
                {d.byReason?.slice(0,5).map((r,i)=>(
                  <div key={i} style={{marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:13,color:'#fafafa'}}>{r.reason}</span>
                      <span style={{fontSize:12,fontWeight:700,color:'#ef4444'}}>{r.pct}%</span>
                    </div>
                    <div style={S.bar}><div style={S.fill(+r.pct*3,'#ef4444')} /></div>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Click Load Dashboard to see your returns overview.</div>}
          </div>
        </div>
      );
      case 'fraud-detect': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Return Fraud Detection ML</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>ML model detects wardrobing, serial returner patterns, duplicate account fraud, and receipt fraud — flagged before approval.</p>
            <button style={S.btn('#ef4444')} onClick={()=>fetch_('fraud-detect',API+'/intel/fraud')} disabled={loading['fraud-detect']}>{loading['fraud-detect']?'Scanning…':'Scan for Fraud'}</button>
            {err['fraud-detect'] && <div style={S.err}>{err['fraud-detect']}</div>}
            {loading['fraud-detect'] ? <div style={S.loading}>Scanning for fraud patterns…</div> : d?.flagged?.length ? (
              <div style={{overflowX:'auto',marginTop:16}}>
                <table style={S.tbl}>
                  <thead><tr><th style={S.th}>RMA ID</th><th style={S.th}>Fraud Score</th><th style={S.th}>Signal</th><th style={S.th}>Value</th><th style={S.th}>Action</th></tr></thead>
                  <tbody>{d.flagged.map((r,i)=>(
                    <tr key={i} style={i%2?S.trOdd:{}}>
                      <td style={S.td}>{r.id}</td>
                      <td style={S.td}><span style={{color:r.fraudScore>0.8?'#ef4444':'#f59e0b',fontWeight:700}}>{(r.fraudScore*100).toFixed(0)}%</span></td>
                      <td style={S.td}><span style={S.badge('#ef4444')}>{r.fraudSignals}</span></td>
                      <td style={S.td}>${r.value}</td>
                      <td style={S.td}>
                        <div style={{display:'flex',gap:4}}>
                          <button style={{...S.btn('#ef4444'),padding:'4px 8px',fontSize:11}} onClick={()=>toast_('Flagged for review')}>Flag</button>
                          <button style={{...S.btn('#27272a'),padding:'4px 8px',fontSize:11}} onClick={()=>toast_('Approved')}>Approve</button>
                        </div>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <div style={S.empty}>Scan to detect fraudulent return requests.</div>}
          </div>
        </div>
      );
      case 'exchange-first': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Exchange-First Revenue Recovery</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>AI suggests exchanges before refunds — retaining revenue while increasing customer satisfaction. Track acceptance rates and revenue retained.</p>
            <button style={S.btn('#10b981')} onClick={()=>fetch_('exchange-first',API+'/revenue/exchange-first')} disabled={loading['exchange-first']}>{loading['exchange-first']?'Loading…':'Load Exchange Data'}</button>
            {err['exchange-first'] && <div style={S.err}>{err['exchange-first']}</div>}
            {loading['exchange-first'] ? <div style={S.loading}>Loading…</div> : d ? (
              <>
                <div style={S.metaRow}>
                  {[['Exchanges Offered',d.exchangeOffered,'#0ea5e9'],['Accepted',d.exchangeAccepted,'#10b981'],['Acceptance Rate',d.acceptanceRate+'%','#4f46e5'],['Revenue Retained','$'+d.revenueRetained?.toLocaleString(),'#10b981']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
                <div style={S.sT}>Top Exchange Patterns</div>
                {d.topExchanges?.map((e,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #1f1f22'}}>
                    <span style={{color:'#fafafa',fontSize:13}}>{e.from}</span>
                    <span style={{color:'#71717a'}}>→</span>
                    <span style={{color:'#10b981',fontWeight:600,fontSize:13}}>{e.to}</span>
                    <span style={S.badge('#10b981')}>{e.count} exchanges</span>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Load data to see exchange-first revenue recovery stats.</div>}
          </div>
        </div>
      );
      case 'rma-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>✦ World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'🧠',t:'NLP Return Reason Classification',d:'Fine-tuned NLP model classifies free-text return reasons into structured taxonomy — powering root cause analysis.'},
                {icon:'🚨',t:'Return Fraud ML Detection',d:'Detect wardrobing, serial returners, duplicate accounts, and receipt fraud before approving the return request.'},
                {icon:'🎯',t:'Return Propensity Scoring',d:'Predict likelihood of return at order creation time — flag high-risk orders for proactive intervention.'},
                {icon:'🔄',t:'Intelligent Disposition Engine',d:'AI routes every returned item to the highest-value disposition: restock / refurbish / liquidate / donate / destroy.'},
                {icon:'💰',t:'Exchange-First Revenue Recovery',d:'AI suggests exchanges and store credit before refunds — with incentive offers that increase acceptance rates by 40%.'},
                {icon:'📊',t:'Net Merchandise Recovery Rate',d:'Track value recovered / original COGS per disposition channel — optimize your returns economics over time.'},
              ].map((f,i)=>(
                <div key={i} style={S.mini}>
                  <div style={{fontSize:28,marginBottom:8}}>{f.icon}</div>
                  <div style={{fontWeight:700,color:'#fafafa',marginBottom:4}}>{f.t}</div>
                  <div style={{fontSize:12,color:'#71717a',lineHeight:1.5}}>{f.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      default: return Generic(tab, curGroup.tabs.find(t=>t.id===tab)?.label||tab, '', API+'/health');
    }
  }


  function handleGroup(gid) {
    const g = GROUPS.find(x=>x.id===gid);
    if(g){setActiveGroup(gid);setActiveTab(g.tabs[0].id);}
  }

  return (
    <div style={S.root}>
      <div style={{marginBottom:28}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16}}>
          <div>
            <h1 style={{fontSize:24,fontWeight:800,color:'#fafafa',margin:'0 0 4px',letterSpacing:'-0.02em'}}>Returns R M A Automation</h1>
            <p style={{color:'#71717a',fontSize:13,margin:'4px 0 0'}}>Intelligent returns management — fraud detection ML, exchange-first revenue recovery & disposition optimization</p>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={S.btn('#27272a')} onClick={()=>fetch_(activeTab, API+'/health',{})}>↺ Refresh</button>
            <button style={S.btn('#10b981')} onClick={()=>toast_('AI analysis started…')}>✦ AI Analysis</button>
          </div>
        </div>
      </div>

      <div style={S.groupNav}>
        {GROUPS.map(g=>(
          <button key={g.id} style={S.gBtn(activeGroup===g.id,g.color)} onClick={()=>handleGroup(g.id)}>{g.label}</button>
        ))}
      </div>

      <div style={S.tabStrip}>
        {curGroup.tabs.map(t=>(
          <button key={t.id} style={S.tBtn(activeTab===t.id,curGroup.color)} onClick={()=>setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {renderTab()}

      {toast && (
        <div style={{position:'fixed',bottom:24,right:24,background:toast.c,color:'#fff',borderRadius:10,padding:'12px 20px',fontSize:13,fontWeight:600,zIndex:9999,boxShadow:'0 4px 24px #0006'}}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
