import React, { useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/ltv-churn-predictor";

const S = {
  root: { background:'#09090b', minHeight:'100vh', color:'#fafafa', fontFamily:"'Inter',system-ui,sans-serif", padding:'28px 32px' },
  card: { background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:24, marginBottom:20 },
  mini: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:16 },
  cardTitle: { fontSize:14, fontWeight:700, color:'#fafafa', marginBottom:16, marginTop:0 },
  row: { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' },
  input: { flex:1, minWidth:180, background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:14, padding:'11px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif" },
  select: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'11px 14px', outline:'none', cursor:'pointer' },
  textarea: { width:'100%', background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'12px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif", resize:'vertical', boxSizing:'border-box' },
  btn: (bg) => ({ background:bg||'#10b981', color:'#fff', border:'none', borderRadius:10, padding:'11px 22px', fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }),
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
  metaVal: (c) => ({ fontSize:22, fontWeight:700, color:c||'#10b981' }),
  metaLbl: { fontSize:11, color:'#71717a', marginTop:2 },
  sT: { fontSize:12, fontWeight:700, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, marginTop:16 },
  groupNav: { display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' },
  gBtn: (a, c) => ({ background:a?c+'22':'#18181b', color:a?c:'#71717a', border:`1px solid ${a?c+'44':'#27272a'}`, borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:a?700:500, cursor:'pointer' }),
  tabStrip: { display:'flex', gap:4, marginBottom:20, flexWrap:'wrap', borderBottom:'1px solid #27272a', paddingBottom:8 },
  tBtn: (a, c) => ({ background:'none', color:a?c:'#71717a', border:'none', borderBottom:a?`2px solid ${c}`:'2px solid transparent', padding:'8px 14px', fontSize:13, fontWeight:a?700:500, cursor:'pointer', marginBottom:-9 }),
  bar: { height:6, background:'#27272a', borderRadius:3, overflow:'hidden', marginTop:4 },
  fill: (pct, c) => ({ height:'100%', width:Math.min(pct||0,100)+'%', background:c||'#10b981', borderRadius:3 }),
  pre: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, padding:16, fontSize:12, color:'#a1a1aa', fontFamily:'monospace', whiteSpace:'pre-wrap', maxHeight:280, overflow:'auto', marginBottom:12 },
  sc: (s) => { if(s>=75) return '#10b981'; if(s>=50) return '#f59e0b'; return '#ef4444'; },
};

const GROUPS = [
  {
    "id": "ltv-ov",
    "label": "LTV Overview",
    "color": "#4f46e5",
    "tabs": [
      {
        "id": "ltv-dash",
        "label": "LTV Dashboard"
      },
      {
        "id": "by-segment-l",
        "label": "By Segment"
      },
      {
        "id": "by-channel-l",
        "label": "By Channel"
      },
      {
        "id": "by-product-l",
        "label": "By Product"
      },
      {
        "id": "by-cohort-l",
        "label": "By Cohort"
      },
      {
        "id": "ltv-trends",
        "label": "Trends"
      }
    ]
  },
  {
    "id": "models",
    "label": "Models",
    "color": "#0ea5e9",
    "tabs": [
      {
        "id": "pareto-nbd",
        "label": "Pareto/NBD"
      },
      {
        "id": "gamma-gamma",
        "label": "Gamma-Gamma"
      },
      {
        "id": "clv-segs",
        "label": "CLV Segments"
      },
      {
        "id": "accuracy",
        "label": "Model Accuracy"
      },
      {
        "id": "training",
        "label": "Training"
      },
      {
        "id": "predictions",
        "label": "Predictions"
      }
    ]
  },
  {
    "id": "segments-l",
    "label": "Segments",
    "color": "#10b981",
    "tabs": [
      {
        "id": "quintiles",
        "label": "LTV Quintiles"
      },
      {
        "id": "champions-l",
        "label": "Champions"
      },
      {
        "id": "growth",
        "label": "Growth"
      },
      {
        "id": "at-risk-l",
        "label": "At-Risk"
      },
      {
        "id": "lost",
        "label": "Lost"
      },
      {
        "id": "ltv-champs",
        "label": "Top Customers"
      }
    ]
  },
  {
    "id": "attrib",
    "label": "Attribution",
    "color": "#f97316",
    "tabs": [
      {
        "id": "channel-ltv",
        "label": "Channel LTV"
      },
      {
        "id": "first-touch",
        "label": "First Touch"
      },
      {
        "id": "product-ltv",
        "label": "Product LTV"
      },
      {
        "id": "camp-ltv",
        "label": "Campaign LTV"
      },
      {
        "id": "ltv-compare",
        "label": "Compare"
      },
      {
        "id": "bidding",
        "label": "Value Bidding"
      }
    ]
  },
  {
    "id": "scenarios",
    "label": "Scenarios",
    "color": "#a855f7",
    "tabs": [
      {
        "id": "scenario-builder",
        "label": "Scenario Builder"
      },
      {
        "id": "impact",
        "label": "Impact Analysis"
      },
      {
        "id": "retention-sim",
        "label": "Retention Sim"
      },
      {
        "id": "upsell-sim",
        "label": "Upsell Sim"
      },
      {
        "id": "ltv-reports",
        "label": "Reports"
      },
      {
        "id": "ltv-fore",
        "label": "Forecast"
      }
    ]
  },
  {
    "id": "acq",
    "label": "Acquisition",
    "color": "#ec4899",
    "tabs": [
      {
        "id": "cac-payback",
        "label": "CAC Payback"
      },
      {
        "id": "bidding-exp",
        "label": "Bidding Export"
      },
      {
        "id": "lookalike",
        "label": "Lookalike Seeds"
      },
      {
        "id": "value-bid",
        "label": "Value Bidding"
      },
      {
        "id": "acq-targets",
        "label": "Targets"
      },
      {
        "id": "acq-roi",
        "label": "ROI"
      }
    ]
  },
  {
    "id": "ltv-adv",
    "label": "Advanced",
    "color": "#f59e0b",
    "tabs": [
      {
        "id": "cross-sell-l",
        "label": "Cross-Sell LTV"
      },
      {
        "id": "ltv-int",
        "label": "Integrations"
      },
      {
        "id": "ltv-api",
        "label": "API"
      },
      {
        "id": "ltv-exports",
        "label": "Exports"
      },
      {
        "id": "ltv-settings",
        "label": "Settings"
      },
      {
        "id": "ltv-world",
        "label": "World-Class"
      }
    ]
  }
];

export default function LTVChurnPredictor() {
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
      case 'ltv-dash': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Customer Lifetime Value Dashboard</div>
            <button style={S.btn('#4f46e5')} onClick={()=>fetch_('ltv-dash',API+'/ltv/dashboard')} disabled={loading['ltv-dash']}>{loading['ltv-dash']?'Loading…':'Load LTV Dashboard'}</button>
            {err['ltv-dash'] && <div style={S.err}>{err['ltv-dash']}</div>}
            {loading['ltv-dash'] ? <div style={S.loading}>Loading LTV data…</div> : d ? (
              <>
                <div style={S.metaRow}>
                  {[['Avg LTV','$'+d.avgLtv,'#4f46e5'],['Top 10% LTV','$'+d.topDecileLtv,'#10b981'],['Total Value','$'+d.totalCustomerValue?.toLocaleString(),'#0ea5e9'],['LTV Growth','+'+d.ltvGrowth+'%','#10b981'],['Repeat Rate',d.repeatRate+'%','#a855f7'],['Avg Orders',d.avgOrders,'#f97316']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
                <div style={S.sT}>LTV Distribution</div>
                {d.distribution?.map((r,i)=>(
                  <div key={i} style={{marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:12,color:'#fafafa'}}>{r.range}</span>
                      <span style={{fontSize:12,color:'#71717a'}}>{r.count?.toLocaleString()} customers ({r.pct}%)</span>
                    </div>
                    <div style={S.bar}><div style={S.fill(r.pct*2,'#4f46e5')} /></div>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Load the LTV dashboard to see customer lifetime value analysis.</div>}
          </div>
        </div>
      );
      case 'pareto-nbd': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Pareto/NBD + BG/NBD LTV Model</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Probabilistic model for non-contractual settings (ecommerce). Estimates each customer&apos;s probability of being alive and expected future transactions.</p>
            <button style={S.btn('#0ea5e9')} onClick={()=>fetch_('pareto-nbd',API+'/models/pareto-nbd')} disabled={loading['pareto-nbd']}>{loading['pareto-nbd']?'Running Model…':'Run Pareto/NBD'}</button>
            {err['pareto-nbd'] && <div style={S.err}>{err['pareto-nbd']}</div>}
            {loading['pareto-nbd'] ? <div style={S.loading}>Fitting probabilistic model…</div> : d?.model ? (
              <>
                <div style={{...S.mini,marginBottom:16,borderColor:'#0ea5e944'}}>
                  <div style={{fontSize:12,color:'#0ea5e9',fontWeight:600,marginBottom:4}}>{d.model.name}</div>
                  <p style={{color:'#a1a1aa',fontSize:13,margin:'0 0 8px'}}>{d.model.description}</p>
                  <div style={{display:'flex',gap:16}}>
                    {Object.entries(d.model.performance||{}).map(([k,v])=>(
                      <div key={k}><span style={{color:'#71717a',fontSize:11}}>{k.toUpperCase()}: </span><span style={{color:'#0ea5e9',fontWeight:700}}>{v}</span></div>
                    ))}
                  </div>
                </div>
                <div style={S.sT}>Individual Predictions (Sample)</div>
                <div style={{overflowX:'auto'}}>
                  <table style={S.tbl}>
                    <thead><tr><th style={S.th}>Customer</th><th style={S.th}>P(Alive)</th><th style={S.th}>Expected Purchases (90d)</th><th style={S.th}>Predicted LTV</th></tr></thead>
                    <tbody>{d.model.predictions?.map((p,i)=>(
                      <tr key={i} style={i%2?S.trOdd:{}}>
                        <td style={S.td}>{p.customerId}</td>
                        <td style={S.td}><span style={{fontWeight:700,color:p.pAlive>0.7?'#10b981':p.pAlive>0.4?'#f59e0b':'#ef4444'}}>{(p.pAlive*100).toFixed(0)}%</span></td>
                        <td style={S.td}>{p.expectedPurchases90d}</td>
                        <td style={S.td}><span style={{fontWeight:700,color:'#4f46e5'}}>${p.predictedLtv}</span></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </>
            ) : <div style={S.empty}>Run the Pareto/NBD model to predict individual customer LTV.</div>}
          </div>
        </div>
      );
      case 'quintiles': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>LTV Quintile Segmentation</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Cluster customers by predicted LTV quintile — allocate retention resources proportionally to customer value and churn risk.</p>
            <button style={S.btn('#10b981')} onClick={()=>fetch_('quintiles',API+'/segments/quintiles')} disabled={loading.quintiles}>{loading.quintiles?'Loading…':'Load Quintiles'}</button>
            {err.quintiles && <div style={S.err}>{err.quintiles}</div>}
            {loading.quintiles ? <div style={S.loading}>Loading quintiles…</div> : d?.quintiles?.length ? (
              d.quintiles.map((q,i)=>(
                <div key={i} style={{...S.mini,marginBottom:10,borderColor:i===0?'#10b98144':i===1?'#4f46e544':'#27272a'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <div>
                      <span style={{fontWeight:800,fontSize:16,color:i<2?'#10b981':'#fafafa'}}>Q{q.quintile}</span>
                      <span style={{color:'#71717a',fontSize:13,marginLeft:8}}>{q.label}</span>
                    </div>
                    <span style={S.badge('#4f46e5')}>{q.revenueShare}% of revenue</span>
                  </div>
                  <div style={{display:'flex',gap:12,marginBottom:6}}>
                    {[['Avg LTV','$'+q.avgLtv],['Customers',q.customers?.toLocaleString()],['Revenue','$'+q.revenue?.toLocaleString()]].map(([l,v])=>(
                      <div key={l}><span style={{fontSize:11,color:'#71717a'}}>{l}: </span><span style={{fontWeight:600,fontSize:13}}>{v}</span></div>
                    ))}
                  </div>
                  <div style={{fontSize:12,color:'#a1a1aa',fontStyle:'italic'}}>{q.action}</div>
                </div>
              ))
            ) : <div style={S.empty}>Load quintiles to see LTV-based customer segments.</div>}
          </div>
        </div>
      );
      case 'channel-ltv': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>LTV by Acquisition Channel</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Which acquisition channels produce the highest-LTV customers? Use LTV:CAC ratio to optimize channel mix and value-based bidding.</p>
            <button style={S.btn('#f97316')} onClick={()=>fetch_('channel-ltv',API+'/attribution/channel-ltv')} disabled={loading['channel-ltv']}>{loading['channel-ltv']?'Loading…':'Load Channel LTV'}</button>
            {err['channel-ltv'] && <div style={S.err}>{err['channel-ltv']}</div>}
            {loading['channel-ltv'] ? <div style={S.loading}>Loading channel attribution…</div> : d?.channels?.length ? (
              <div style={{overflowX:'auto'}}>
                <table style={S.tbl}>
                  <thead><tr><th style={S.th}>Channel</th><th style={S.th}>Avg LTV</th><th style={S.th}>LTV Multiple</th><th style={S.th}>CAC</th><th style={S.th}>LTV:CAC</th><th style={S.th}>Payback</th></tr></thead>
                  <tbody>{d.channels.map((c,i)=>(
                    <tr key={i} style={i%2?S.trOdd:{}}>
                      <td style={S.td}><span style={{fontWeight:600}}>{c.channel}</span></td>
                      <td style={S.td}><span style={{fontWeight:700,color:'#4f46e5'}}>${c.avgLtv}</span></td>
                      <td style={S.td}><span style={{fontWeight:700,color:c.ltvMultiple>1?'#10b981':'#ef4444'}}>{c.ltvMultiple}×</span></td>
                      <td style={S.td}>{c.cac===0?<span style={S.badge('#10b981')}>Free</span>:<span>${c.cac}</span>}</td>
                      <td style={S.td}>{c.returnOnCAC?<span style={{fontWeight:700,color:c.returnOnCAC>10?'#10b981':c.returnOnCAC>5?'#f59e0b':'#ef4444'}}>{c.returnOnCAC}×</span>:'—'}</td>
                      <td style={S.td}>{c.paybackDays===0?<span style={S.badge('#10b981')}>Instant</span>:<span style={{color:'#71717a'}}>{c.paybackDays}d</span>}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <div style={S.empty}>Load channel LTV to see which channels produce your best customers.</div>}
          </div>
        </div>
      );
      case 'ltv-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>✦ World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'📐',t:'Pareto/NBD + Gamma-Gamma Model',d:'Industry-standard probabilistic LTV model: Pareto/NBD for purchase probability × Gamma-Gamma for spend — predicting individual customer value.'},
                {icon:'🏆',t:'LTV Quintile Segmentation',d:'Cluster customers into 5 value tiers. Top 20% typically generate 60-70% of revenue — focus retention resources where they matter most.'},
                {icon:'📡',t:'Value-Based Bidding Export',d:'Export LTV quintile scores to Google Customer Match and Meta Custom Audiences for value-based bidding — bid higher on high-LTV prospects.'},
                {icon:'🔭',t:'LTV Attribution by Channel',d:'Which acquisition channels produce the highest-LTV customers? Break LTV:CAC ratio by source to optimize marketing mix.'},
                {icon:'🎮',t:'LTV Scenario Modeling',d:'Model LTV impact of retention improvements, upsell programs, and product changes — "If 30-day repeat rate improves 10%, what is the LTV impact?"'},
                {icon:'🤝',t:'Cross-Sell LTV Predictor',d:'Which next product recommendation maximizes expected LTV per customer? AI-powered next-best-product recommendations with LTV uplift estimates.'},
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
            <h1 style={{fontSize:24,fontWeight:800,color:'#fafafa',margin:'0 0 4px',letterSpacing:'-0.02em'}}>L T V Churn Predictor</h1>
            <p style={{color:'#71717a',fontSize:13,margin:'4px 0 0'}}>Customer value ML — Pareto/NBD + Gamma-Gamma LTV model, quintile segmentation, channel attribution & value-based bidding export</p>
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
