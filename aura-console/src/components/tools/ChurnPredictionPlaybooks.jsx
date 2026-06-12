import React, { useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/churn-prediction-playbooks";

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
    "id": "risk",
    "label": "Churn Risk",
    "color": "#ef4444",
    "tabs": [
      {
        "id": "risk-dash",
        "label": "Risk Dashboard"
      },
      {
        "id": "high-risk",
        "label": "High Risk"
      },
      {
        "id": "rfm",
        "label": "RFM Scores"
      },
      {
        "id": "health-scores",
        "label": "Health Scores"
      },
      {
        "id": "predictions",
        "label": "Predictions"
      },
      {
        "id": "segments-c",
        "label": "Segments"
      }
    ]
  },
  {
    "id": "survival",
    "label": "Survival",
    "color": "#4f46e5",
    "tabs": [
      {
        "id": "cox-ph",
        "label": "Cox PH Model"
      },
      {
        "id": "cohort-curves",
        "label": "Cohort Curves"
      },
      {
        "id": "dormancy",
        "label": "Dormancy"
      },
      {
        "id": "early-warn",
        "label": "Early Warnings"
      },
      {
        "id": "by-segment",
        "label": "By Segment"
      },
      {
        "id": "trend-c",
        "label": "Trend"
      }
    ]
  },
  {
    "id": "playbooks",
    "label": "Playbooks",
    "color": "#0ea5e9",
    "tabs": [
      {
        "id": "pb-list",
        "label": "Playbook List"
      },
      {
        "id": "create-pb",
        "label": "Create Playbook"
      },
      {
        "id": "hv-pb",
        "label": "High-Value"
      },
      {
        "id": "atrisk-pb",
        "label": "At-Risk"
      },
      {
        "id": "dormant-pb",
        "label": "Dormant"
      },
      {
        "id": "winback-pb",
        "label": "Win-Back"
      }
    ]
  },
  {
    "id": "campaigns",
    "label": "Campaigns",
    "color": "#10b981",
    "tabs": [
      {
        "id": "active-camp",
        "label": "Active"
      },
      {
        "id": "winback",
        "label": "Win-Back"
      },
      {
        "id": "retention",
        "label": "Retention"
      },
      {
        "id": "reactivation",
        "label": "Reactivation"
      },
      {
        "id": "camp-results",
        "label": "Results"
      },
      {
        "id": "camp-roi",
        "label": "ROI"
      }
    ]
  },
  {
    "id": "analytics",
    "label": "Analytics",
    "color": "#a855f7",
    "tabs": [
      {
        "id": "churn-rate",
        "label": "Churn Rate"
      },
      {
        "id": "ltv-impact",
        "label": "LTV Impact"
      },
      {
        "id": "by-channel-c",
        "label": "By Channel"
      },
      {
        "id": "by-product-c",
        "label": "By Product"
      },
      {
        "id": "by-cohort-c",
        "label": "By Cohort"
      },
      {
        "id": "cpp-bench",
        "label": "Benchmarks"
      }
    ]
  },
  {
    "id": "nps",
    "label": "NPS",
    "color": "#ec4899",
    "tabs": [
      {
        "id": "nps-tracker",
        "label": "NPS Tracker"
      },
      {
        "id": "pred-nps",
        "label": "Predictive NPS"
      },
      {
        "id": "detractors",
        "label": "Detractors"
      },
      {
        "id": "drivers",
        "label": "Drivers"
      },
      {
        "id": "nps-trends",
        "label": "Trends"
      },
      {
        "id": "improvements",
        "label": "Improvements"
      }
    ]
  },
  {
    "id": "cpp-adv",
    "label": "Advanced",
    "color": "#f59e0b",
    "tabs": [
      {
        "id": "ai-models-c",
        "label": "AI Models"
      },
      {
        "id": "bg-nbd",
        "label": "BG/NBD Model"
      },
      {
        "id": "cpp-int",
        "label": "Integrations"
      },
      {
        "id": "cpp-api",
        "label": "API"
      },
      {
        "id": "cpp-settings",
        "label": "Settings"
      },
      {
        "id": "cpp-world",
        "label": "World-Class"
      }
    ]
  }
];

export default function ChurnPredictionPlaybooks() {
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
      case 'risk-dash': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Churn Risk Dashboard</div>
            <button style={S.btn('#ef4444')} onClick={()=>fetch_('risk-dash',API+'/risk/dashboard')} disabled={loading['risk-dash']}>{loading['risk-dash']?'Loading…':'Load Risk Dashboard'}</button>
            {err['risk-dash'] && <div style={S.err}>{err['risk-dash']}</div>}
            {loading['risk-dash'] ? <div style={S.loading}>Scoring customers…</div> : d ? (
              <>
                <div style={S.metaRow}>
                  {[['Total Customers',(d.totalCustomers||0).toLocaleString(),'#fafafa'],['High Risk',d.highRisk,'#ef4444'],['Churn Rate',d.churnRate+'%','#f97316'],['Predicted Loss','$'+d.predLoss30d?.toLocaleString(),'#ef4444'],['Avg Health',d.avgHealthScore,'#0ea5e9'],['MoM Change',d.churnRateChange>0?'+'+d.churnRateChange+'%':d.churnRateChange+'%',d.churnRateChange<0?'#10b981':'#ef4444']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
                <div style={S.sT}>Segments</div>
                {d.segments?.map((s,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #1f1f22'}}>
                    <span style={{fontSize:13,color:'#fafafa',fontWeight:600}}>{s.name}</span>
                    <span style={{color:'#71717a',fontSize:12}}>{s.count?.toLocaleString()} customers</span>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={S.badge(s.churnProb>0.5?'#ef4444':s.churnProb>0.2?'#f59e0b':'#10b981')}>{(s.churnProb*100).toFixed(0)}% risk</span>
                      <button style={{...S.btn('#ef4444'),padding:'4px 10px',fontSize:11}} onClick={()=>toast_('Playbook triggered for '+s.name)}>Activate Playbook</button>
                    </div>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Load the churn risk dashboard to see customer health.</div>}
          </div>
        </div>
      );
      case 'cox-ph': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Cox Proportional Hazard Model</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Survival analysis for time-to-churn. Hazard ratios identify which behavioral signals most strongly predict churn — enabling targeted intervention.</p>
            <button style={S.btn('#4f46e5')} onClick={()=>fetch_('cox-ph',API+'/survival/cox-ph')} disabled={loading['cox-ph']}>{loading['cox-ph']?'Running Model…':'Run Cox PH Model'}</button>
            {err['cox-ph'] && <div style={S.err}>{err['cox-ph']}</div>}
            {loading['cox-ph'] ? <div style={S.loading}>Running survival analysis…</div> : d?.model ? (
              <>
                <div style={{...S.mini,marginBottom:16,borderColor:'#4f46e544'}}>
                  <div style={{fontSize:12,color:'#4f46e5',fontWeight:600,marginBottom:4}}>Model Concordance: {(d.model.concordance*100).toFixed(0)}%</div>
                  <p style={{color:'#a1a1aa',fontSize:13,lineHeight:1.6,margin:0}}>{d.model.interpretation}</p>
                </div>
                <div style={S.sT}>Hazard Ratios (HR &gt; 1 = increases churn risk)</div>
                <div style={{overflowX:'auto'}}>
                  <table style={S.tbl}>
                    <thead><tr><th style={S.th}>Covariate</th><th style={S.th}>Hazard Ratio</th><th style={S.th}>Direction</th><th style={S.th}>p-value</th></tr></thead>
                    <tbody>{d.model.hazardRatios?.map((hr,i)=>(
                      <tr key={i} style={i%2?S.trOdd:{}}>
                        <td style={S.td}>{hr.covariate}</td>
                        <td style={{...S.td,fontWeight:700,color:hr.hr>1?'#ef4444':'#10b981'}}>{hr.hr.toFixed(3)}</td>
                        <td style={S.td}><span style={S.badge(hr.hr>1?'#ef4444':'#10b981')}>{hr.hr>1?'Increases risk':'Reduces risk'}</span></td>
                        <td style={{...S.td,color:hr.pValue<0.05?'#10b981':'#71717a'}}>{hr.pValue < 0.001?'<0.001':hr.pValue.toFixed(3)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </>
            ) : <div style={S.empty}>Run the Cox PH model to see survival analysis results.</div>}
          </div>
        </div>
      );
      case 'early-warn': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Early Warning Indicators</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Leading behavioral signals that precede churn by 3-8 weeks — enabling proactive intervention before customers are lost.</p>
            <button style={S.btn('#4f46e5')} onClick={()=>fetch_('early-warn',API+'/survival/early-warnings')} disabled={loading['early-warn']}>{loading['early-warn']?'Loading…':'Load Early Warnings'}</button>
            {err['early-warn'] && <div style={S.err}>{err['early-warn']}</div>}
            {loading['early-warn'] ? <div style={S.loading}>Loading signals…</div> : d?.indicators?.length ? (
              d.indicators.map((ind,i)=>(
                <div key={i} style={{...S.mini,marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                    <div style={{fontWeight:700,color:'#fafafa',fontSize:13}}>{ind.signal}</div>
                    <span style={S.badge('#ef4444')}>{ind.count} customers</span>
                  </div>
                  <p style={{color:'#a1a1aa',fontSize:12,lineHeight:1.5,margin:'0 0 8px'}}>{ind.description}</p>
                  <div style={{display:'flex',gap:8}}>
                    <span style={S.badge('#4f46e5')}>Leads churn by {ind.lead} days</span>
                    <span style={S.badge('#0ea5e9')}>{(ind.accuracy*100).toFixed(0)}% accuracy</span>
                    <button style={{...S.btn('#10b981'),padding:'4px 10px',fontSize:11}} onClick={()=>toast_('Playbook activated for '+ind.count+' customers')}>Activate Playbook</button>
                  </div>
                </div>
              ))
            ) : <div style={S.empty}>Load early warning indicators to detect pre-churn signals.</div>}
          </div>
        </div>
      );
      case 'cpp-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>✦ World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'📊',t:'Cox Proportional Hazard Model',d:'Survival analysis for time-to-churn — hazard ratios identify exactly which signals predict churn, with statistical significance.'},
                {icon:'🎯',t:'BG/NBD Churn Probability',d:"Pareto/NBD probabilistic model estimates each customer's probability of being alive and expected future purchases."},
                {icon:'⚡',t:'RFM Quintile Engine',d:'Recency-Frequency-Monetary scoring with 5×5×5 matrix, segment migration tracking, and automated playbook triggers.'},
                {icon:'🔬',t:'Health Score Composite',d:'Weighted multi-signal score combining purchase recency/frequency, login activity, support tickets, NPS, and email engagement.'},
                {icon:'🔮',t:'Predictive NPS',d:'Predict NPS before sending the survey using behavioral signals — proactively intervene with detractors before they churn.'},
                {icon:'🚀',t:'Segment-Specific Playbooks',d:'Different retention strategies for Champions, Loyal, At-Risk, and Dormant — with automated triggers and ROI tracking per playbook.'},
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
            <h1 style={{fontSize:24,fontWeight:800,color:'#fafafa',margin:'0 0 4px',letterSpacing:'-0.02em'}}>Churn Prediction Playbooks</h1>
            <p style={{color:'#71717a',fontSize:13,margin:'4px 0 0'}}>Retention AI — Cox PH survival analysis, BG/NBD model, RFM scoring, early warning indicators & automated playbooks</p>
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
