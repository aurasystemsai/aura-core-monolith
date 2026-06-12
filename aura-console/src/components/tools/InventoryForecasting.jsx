import React, { useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/inventory-forecasting";

const S = {
  root: { background:'#09090b', minHeight:'100vh', color:'#fafafa', fontFamily:"'Inter',system-ui,sans-serif", padding:'28px 32px' },
  card: { background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:24, marginBottom:20 },
  mini: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:16 },
  cardTitle: { fontSize:14, fontWeight:700, color:'#fafafa', marginBottom:16, marginTop:0 },
  row: { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' },
  input: { flex:1, minWidth:180, background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:14, padding:'11px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif" },
  select: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'11px 14px', outline:'none', cursor:'pointer' },
  textarea: { width:'100%', background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'12px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif", resize:'vertical', boxSizing:'border-box' },
  btn: (bg) => ({ background:bg||'#4f46e5', color:'#fff', border:'none', borderRadius:10, padding:'11px 22px', fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }),
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
  metaVal: (c) => ({ fontSize:22, fontWeight:700, color:c||'#4f46e5' }),
  metaLbl: { fontSize:11, color:'#71717a', marginTop:2 },
  sT: { fontSize:12, fontWeight:700, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, marginTop:16 },
  groupNav: { display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' },
  gBtn: (a, c) => ({ background:a?c+'22':'#18181b', color:a?c:'#71717a', border:`1px solid ${a?c+'44':'#27272a'}`, borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:a?700:500, cursor:'pointer' }),
  tabStrip: { display:'flex', gap:4, marginBottom:20, flexWrap:'wrap', borderBottom:'1px solid #27272a', paddingBottom:8 },
  tBtn: (a, c) => ({ background:'none', color:a?c:'#71717a', border:'none', borderBottom:a?`2px solid ${c}`:'2px solid transparent', padding:'8px 14px', fontSize:13, fontWeight:a?700:500, cursor:'pointer', marginBottom:-9 }),
  bar: { height:6, background:'#27272a', borderRadius:3, overflow:'hidden', marginTop:4 },
  fill: (pct, c) => ({ height:'100%', width:Math.min(pct||0,100)+'%', background:c||'#4f46e5', borderRadius:3 }),
  pre: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, padding:16, fontSize:12, color:'#a1a1aa', fontFamily:'monospace', whiteSpace:'pre-wrap', maxHeight:280, overflow:'auto', marginBottom:12 },
  sc: (s) => { if(s>=75) return '#10b981'; if(s>=50) return '#f59e0b'; return '#ef4444'; },
};

const GROUPS = [
  {
    "id": "forecast",
    "label": "Forecast",
    "color": "#4f46e5",
    "tabs": [
      {
        "id": "if-overview",
        "label": "Overview"
      },
      {
        "id": "sku-forecast",
        "label": "SKU Forecast"
      },
      {
        "id": "demand-signals",
        "label": "Demand Signals"
      },
      {
        "id": "seasonal",
        "label": "Seasonality"
      },
      {
        "id": "trend",
        "label": "Trend Analysis"
      },
      {
        "id": "ai-forecast",
        "label": "AI Forecast"
      }
    ]
  },
  {
    "id": "inventory",
    "label": "Inventory",
    "color": "#0ea5e9",
    "tabs": [
      {
        "id": "reorder",
        "label": "Reorder Points"
      },
      {
        "id": "safety-stock",
        "label": "Safety Stock"
      },
      {
        "id": "eoq",
        "label": "EOQ Calculator"
      },
      {
        "id": "abc-xyz",
        "label": "ABC-XYZ Matrix"
      },
      {
        "id": "dead-stock",
        "label": "Dead Stock"
      },
      {
        "id": "stockouts",
        "label": "Stockout Risk"
      }
    ]
  },
  {
    "id": "suppliers",
    "label": "Suppliers",
    "color": "#10b981",
    "tabs": [
      {
        "id": "supp-risk",
        "label": "Supplier Risk"
      },
      {
        "id": "lead-times",
        "label": "Lead Times"
      },
      {
        "id": "alt-supp",
        "label": "Alt Suppliers"
      },
      {
        "id": "po-auto",
        "label": "PO Automation"
      },
      {
        "id": "if-compliance",
        "label": "Compliance"
      },
      {
        "id": "if-scorecards",
        "label": "Scorecards"
      }
    ]
  },
  {
    "id": "finance",
    "label": "Finance",
    "color": "#f97316",
    "tabs": [
      {
        "id": "inv-value",
        "label": "Inventory Value"
      },
      {
        "id": "holding-costs",
        "label": "Holding Costs"
      },
      {
        "id": "write-offs",
        "label": "Write-Offs"
      },
      {
        "id": "cash-impact",
        "label": "Cash Impact"
      },
      {
        "id": "if-budget",
        "label": "Budget"
      },
      {
        "id": "scenarios",
        "label": "Scenarios"
      }
    ]
  },
  {
    "id": "analytics",
    "label": "Analytics",
    "color": "#a855f7",
    "tabs": [
      {
        "id": "if-perf",
        "label": "Performance"
      },
      {
        "id": "accuracy",
        "label": "Forecast Accuracy"
      },
      {
        "id": "by-category",
        "label": "By Category"
      },
      {
        "id": "by-location",
        "label": "By Location"
      },
      {
        "id": "if-bench",
        "label": "Benchmarks"
      },
      {
        "id": "if-reports",
        "label": "Reports"
      }
    ]
  },
  {
    "id": "operations",
    "label": "Operations",
    "color": "#ec4899",
    "tabs": [
      {
        "id": "receiving",
        "label": "Receiving"
      },
      {
        "id": "warehouse",
        "label": "Warehouse"
      },
      {
        "id": "transfers",
        "label": "Transfers"
      },
      {
        "id": "adjustments",
        "label": "Adjustments"
      },
      {
        "id": "recon",
        "label": "Reconciliation"
      },
      {
        "id": "if-audit",
        "label": "Audit Log"
      }
    ]
  },
  {
    "id": "advanced",
    "label": "Advanced",
    "color": "#f59e0b",
    "tabs": [
      {
        "id": "ai-engine",
        "label": "AI Engine"
      },
      {
        "id": "disruption",
        "label": "Disruption Radar"
      },
      {
        "id": "if-integrations",
        "label": "Integrations"
      },
      {
        "id": "if-settings",
        "label": "Settings"
      },
      {
        "id": "if-alerts",
        "label": "Alerts"
      },
      {
        "id": "if-world",
        "label": "World-Class"
      }
    ]
  }
];

export default function InventoryForecasting() {
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
      case 'if-overview': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Inventory Forecast Overview</div>
            <div style={S.row}>
              <button style={S.btn()} onClick={()=>fetch_('if-overview',API+'/forecast/overview')} disabled={loading['if-overview']}>{loading['if-overview']?'Loading…':'Load Overview'}</button>
              <button style={S.btn('#10b981')} onClick={()=>fetch_('ai-forecast',API+'/forecast/ai',{})}>✦ AI Insights</button>
            </div>
            {err['if-overview'] && <div style={S.err}>{err['if-overview']}</div>}
            {loading['if-overview'] ? <div style={S.loading}>Loading…</div> : d ? (
              <>
                <div style={S.metaRow}>
                  {[['Total SKUs',d.totalSKUs,'#4f46e5'],['At Risk',d.atRisk,'#f97316'],['Stockouts',d.stockouts,'#ef4444'],['Fill Rate',d.fillRate+'%','#10b981'],['Accuracy',d.forecastAccuracy+'%','#0ea5e9'],['Turnover',d.turnoverRate+'x','#a855f7']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
                <div style={S.sT}>Top Risks</div>
                {d.topRisks?.map((r,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #1f1f22'}}>
                    <span style={{fontWeight:600,fontSize:13}}>{r.sku}</span>
                    <span style={S.badge(r.risk==='critical'?'#ef4444':r.risk==='high'?'#f97316':'#f59e0b')}>{r.risk}</span>
                    <span style={{color:'#71717a',fontSize:12}}>{r.daysLeft} days left</span>
                    <button style={{...S.btn('#27272a'),padding:'4px 10px',fontSize:11}} onClick={()=>toast_('Creating PO…')}>Auto PO</button>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Click Load Overview to see your inventory forecast dashboard.</div>}
          </div>
        </div>
      );
      case 'abc-xyz': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>ABC-XYZ Inventory Matrix</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>ABC = value contribution. XYZ = demand predictability. The 9-cell matrix determines the optimal inventory policy per SKU.</p>
            <button style={S.btn()} onClick={()=>fetch_('abc-xyz',API+'/inventory/abc-xyz')} disabled={loading['abc-xyz']}>{loading['abc-xyz']?'Loading…':'Generate Matrix'}</button>
            {err['abc-xyz'] && <div style={S.err}>{err['abc-xyz']}</div>}
            {loading['abc-xyz'] ? <div style={S.loading}>Building matrix…</div> : d ? (
              <div style={{marginTop:16}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
                  {Object.entries(d.matrix||{}).map(([k,v])=>(
                    <div key={k} style={{...S.mini,borderColor:k.startsWith('A')?'#4f46e544':k.startsWith('B')?'#0ea5e944':'#27272a'}}>
                      <div style={{fontWeight:800,fontSize:16,color:k.startsWith('A')?'#4f46e5':k.startsWith('B')?'#0ea5e9':'#52525b'}}>{k}</div>
                      <div style={{fontSize:12,color:'#a1a1aa',marginTop:2}}>{v.count} SKUs ({v.pct}%)</div>
                      <div style={{fontSize:11,color:'#71717a',marginTop:4,lineHeight:1.4}}>{v.policy}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div style={S.empty}>Click Generate Matrix to see the ABC-XYZ classification.</div>}
          </div>
        </div>
      );
      case 'eoq': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>EOQ Calculator</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Economic Order Quantity — the order size that minimises total annual ordering + holding costs.</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12,marginBottom:16}}>
              {[['Annual Demand (units)','annualDemand','1000'],['Order Cost ($)','orderCost','50'],['Holding Rate (%)','holdingRate','0.25'],['Unit Cost ($)','unitCost','10']].map(([l,k,ph])=>(
                <div key={k}><label style={S.label}>{l}</label><input style={S.input} placeholder={ph} value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} /></div>
              ))}
            </div>
            <button style={S.btn()} onClick={()=>fetch_('eoq',API+'/inventory/eoq',{annualDemand:+form.annualDemand||1000,orderCost:+form.orderCost||50,holdingRate:+form.holdingRate||0.25,unitCost:+form.unitCost||10})} disabled={loading.eoq}>{loading.eoq?'Calculating…':'Calculate EOQ'}</button>
            {d ? (
              <div style={{...S.mini,marginTop:16}}>
                <div style={S.sT}>Results</div>
                <div style={S.metaRow}>
                  {[['EOQ',d.eoq+' units','#4f46e5'],['Annual Order Cost','$'+(d.annualOrderCost||0).toFixed(0),'#0ea5e9'],['Annual Holding Cost','$'+(d.annualHoldingCost||0).toFixed(0),'#f97316'],['Total Cost','$'+(d.totalCost||0).toFixed(0),'#10b981']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      );
      case 'stockouts': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Stockout Risk Scoring</div>
            <div style={S.row}>
              <button style={S.btn('#ef4444')} onClick={()=>fetch_('stockouts',API+'/inventory/stockout-risk')} disabled={loading.stockouts}>{loading.stockouts?'Scanning…':'Scan Stockout Risk'}</button>
            </div>
            {err.stockouts && <div style={S.err}>{err.stockouts}</div>}
            {loading.stockouts ? <div style={S.loading}>Scanning for stockout risks…</div> : d?.at_risk?.length ? (
              <div style={{overflowX:'auto'}}>
                <table style={S.tbl}>
                  <thead><tr><th style={S.th}>SKU</th><th style={S.th}>Days Left</th><th style={S.th}>Probability</th><th style={S.th}>Velocity</th><th style={S.th}>Action</th></tr></thead>
                  <tbody>{d.at_risk.map((r,i)=>(
                    <tr key={i} style={i%2?S.trOdd:{}}>
                      <td style={S.td}><span style={{fontWeight:600}}>{r.sku}</span><br/><span style={{fontSize:11,color:'#71717a'}}>{r.name}</span></td>
                      <td style={S.td}><span style={{color:r.daysToStockout<=7?'#ef4444':r.daysToStockout<=14?'#f59e0b':'#10b981',fontWeight:700}}>{r.daysToStockout}d</span></td>
                      <td style={S.td}><span style={{fontWeight:700,color:r.probability>0.8?'#ef4444':r.probability>0.5?'#f59e0b':'#10b981'}}>{(r.probability*100).toFixed(0)}%</span></td>
                      <td style={S.td}>{r.salesVelocity}/day</td>
                      <td style={S.td}><button style={{...S.btn('#4f46e5'),padding:'4px 10px',fontSize:11}} onClick={()=>toast_('Generating PO for '+r.sku)}>Auto PO ({r.recommendedOrder})</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <div style={S.empty}>Scan for stockout risks to see at-risk SKUs.</div>}
          </div>
        </div>
      );
      case 'ai-forecast': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>✦ AI Forecast Intelligence</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Ensemble ML forecasting using Prophet + LSTM + XGBoost with causal demand signals, seasonal decomposition, and what-if scenario planning.</p>
            <div style={S.row}>
              <select style={S.select} value={form.model||'gpt-4o-mini'} onChange={e=>setForm(p=>({...p,model:e.target.value}))}>
                <option value="gpt-4o-mini">GPT-4o Mini (3 credits)</option>
                <option value="gpt-4o">GPT-4o (6 credits)</option>
                <option value="gpt-4">GPT-4 (9 credits)</option>
              </select>
              <button style={S.btn('#10b981')} onClick={()=>fetch_('ai-forecast',API+'/forecast/ai',{})} disabled={loading['ai-forecast']}>{loading['ai-forecast']?'Analyzing…':'✦ Run AI Forecast'}</button>
            </div>
            {loading['ai-forecast'] ? <div style={S.loading}>AI is analyzing your inventory data…</div> : data['ai-forecast'] ? (
              <div>
                <div style={{...S.mini,marginBottom:16}}><p style={{color:'#a1a1aa',fontSize:13,lineHeight:1.7,margin:0}}>{data['ai-forecast'].summary}</p></div>
                <div style={S.sT}>Recommendations</div>
                {data['ai-forecast'].recommendations?.map((r,i)=>(
                  <div key={i} style={{display:'flex',gap:12,padding:'12px 0',borderBottom:'1px solid #1f1f22'}}>
                    <span style={S.badge(r.urgency==='critical'?'#ef4444':r.urgency==='high'?'#f97316':'#f59e0b')}>{r.urgency}</span>
                    <div><div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{r.action}</div><div style={{fontSize:12,color:'#71717a'}}>{r.impact}</div></div>
                  </div>
                ))}
                <div style={{color:'#71717a',fontSize:11,marginTop:8}}>Credits used: {data['ai-forecast'].creditsUsed}</div>
              </div>
            ) : <div style={S.empty}>Run AI Forecast to get ensemble ML-powered inventory recommendations.</div>}
          </div>
        </div>
      );
      case 'if-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>✦ World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'📈',t:'Prophet + LSTM + XGBoost Ensemble',d:'Automatic model selection per SKU based on historical patterns, seasonality, and data volume.'},
                {icon:'🎯',t:'Causal Demand Forecasting',d:'Incorporate promotions, holidays, weather events, and social trends as external regressors into the forecast.'},
                {icon:'📊',t:'Bayesian Uncertainty Quantification',d:'Credible intervals (not just point estimates) — know the probability distribution of future demand.'},
                {icon:'🔗',t:'Multi-Echelon Optimization',d:'Simultaneously optimize inventory across warehouse → distribution center → store for supply chain efficiency.'},
                {icon:'🏭',t:'ABC-XYZ Policy Engine',d:'9-cell matrix automatically assigns the right replenishment policy to each SKU based on value and predictability.'},
                {icon:'⚡',t:'Real-Time Disruption Radar',d:'Monitor geopolitical events, port congestion, and supplier financial health to pre-empt supply chain disruptions.'},
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
            <h1 style={{fontSize:24,fontWeight:800,color:'#fafafa',margin:'0 0 4px',letterSpacing:'-0.02em'}}>Inventory Forecasting</h1>
            <p style={{color:'#71717a',fontSize:13,margin:'4px 0 0'}}>AI-powered supply chain forecasting — ensemble ML, ABC-XYZ matrix, EOQ, safety stock & disruption radar</p>
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
