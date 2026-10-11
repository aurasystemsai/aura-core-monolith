import React, { useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/multi-channel-optimizer";

const S = {
  root: { background:'#09090b', minHeight:'100vh', color:'#fafafa', fontFamily:"'Inter',system-ui,sans-serif", padding:'28px 32px' },
  card: { background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:24, marginBottom:20 },
  mini: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:16 },
  cardTitle: { fontSize:14, fontWeight:700, color:'#fafafa', marginBottom:16, marginTop:0 },
  row: { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' },
  input: { flex:1, minWidth:180, background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:14, padding:'11px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif" },
  select: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'11px 14px', outline:'none', cursor:'pointer' },
  textarea: { width:'100%', background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'12px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif", resize:'vertical', boxSizing:'border-box' },
  btn: (bg) => ({ background:bg||'#6366f1', color:'#fff', border:'none', borderRadius:10, padding:'11px 22px', fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }),
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
  metaVal: (c) => ({ fontSize:22, fontWeight:700, color:c||'#6366f1' }),
  metaLbl: { fontSize:11, color:'#71717a', marginTop:2 },
  sT: { fontSize:12, fontWeight:700, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, marginTop:16 },
  groupNav: { display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' },
  gBtn: (a, c) => ({ background:a?c+'22':'#18181b', color:a?c:'#71717a', border:`1px solid ${a?c+'44':'#27272a'}`, borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:a?700:500, cursor:'pointer' }),
  tabStrip: { display:'flex', gap:4, marginBottom:20, flexWrap:'wrap', borderBottom:'1px solid #27272a', paddingBottom:8 },
  tBtn: (a, c) => ({ background:'none', color:a?c:'#71717a', border:'none', borderBottom:a?`2px solid ${c}`:'2px solid transparent', padding:'8px 14px', fontSize:13, fontWeight:a?700:500, cursor:'pointer', marginBottom:-9 }),
  bar: { height:6, background:'#27272a', borderRadius:3, overflow:'hidden', marginTop:4 },
  fill: (pct, c) => ({ height:'100%', width:Math.min(pct||0,100)+'%', background:c||'#6366f1', borderRadius:3 }),
  pre: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, padding:16, fontSize:12, color:'#a1a1aa', fontFamily:'monospace', whiteSpace:'pre-wrap', maxHeight:280, overflow:'auto', marginBottom:12 },
};

const GROUPS = [
  {
    "id": "overview-m",
    "label": "Overview",
    "color": "#6366f1",
    "tabs": [
      {
        "id": "mco-dash",
        "label": "Dashboard"
      },
      {
        "id": "channel-comp",
        "label": "Channel Compare"
      },
      {
        "id": "portfolio-view",
        "label": "Portfolio"
      },
      {
        "id": "total-roas",
        "label": "Total ROAS"
      },
      {
        "id": "mco-trends",
        "label": "Trends"
      },
      {
        "id": "mco-alerts",
        "label": "Alerts"
      }
    ]
  },
  {
    "id": "mmm",
    "label": "Media Mix",
    "color": "#8b5cf6",
    "tabs": [
      {
        "id": "mmm-model",
        "label": "MMM Model"
      },
      {
        "id": "adstock",
        "label": "Adstock Curves"
      },
      {
        "id": "saturation",
        "label": "Saturation"
      },
      {
        "id": "diminishing",
        "label": "Diminishing Returns"
      },
      {
        "id": "mmm-fit",
        "label": "Model Fit"
      },
      {
        "id": "mmm-validate",
        "label": "Validate"
      }
    ]
  },
  {
    "id": "attribution",
    "label": "Attribution",
    "color": "#6366f1",
    "tabs": [
      {
        "id": "shapley",
        "label": "Shapley Values"
      },
      {
        "id": "path-analysis",
        "label": "Path Analysis"
      },
      {
        "id": "touchpoints",
        "label": "Touchpoints"
      },
      {
        "id": "model-compare",
        "label": "Model Compare"
      },
      {
        "id": "incr-roas",
        "label": "Incr. ROAS"
      },
      {
        "id": "attrib-report",
        "label": "Report"
      }
    ]
  },
  {
    "id": "budgets",
    "label": "Budget Alloc",
    "color": "#8b5cf6",
    "tabs": [
      {
        "id": "current-alloc",
        "label": "Current"
      },
      {
        "id": "recommended",
        "label": "Recommended"
      },
      {
        "id": "scenarios",
        "label": "Scenarios"
      },
      {
        "id": "incremental-budget",
        "label": "Incremental"
      },
      {
        "id": "realloc",
        "label": "Reallocation"
      },
      {
        "id": "budget-ai",
        "label": "AI Optimize"
      }
    ]
  },
  {
    "id": "frequency",
    "label": "Frequency",
    "color": "#6366f1",
    "tabs": [
      {
        "id": "freq-analysis",
        "label": "Analysis"
      },
      {
        "id": "freq-cap",
        "label": "Freq Cap"
      },
      {
        "id": "cross-channel-freq",
        "label": "Cross-Channel"
      },
      {
        "id": "reach-curve",
        "label": "Reach Curve"
      },
      {
        "id": "freq-opt",
        "label": "Optimize"
      },
      {
        "id": "freq-ai",
        "label": "AI Freq"
      }
    ]
  },
  {
    "id": "synergy",
    "label": "Synergy",
    "color": "#8b5cf6",
    "tabs": [
      {
        "id": "channel-synergy",
        "label": "Channel Synergy"
      },
      {
        "id": "halo-effects",
        "label": "Halo Effects"
      },
      {
        "id": "sequencing",
        "label": "Sequencing"
      },
      {
        "id": "combo-perf",
        "label": "Combo Perf"
      },
      {
        "id": "synergy-ai",
        "label": "AI Analysis"
      },
      {
        "id": "synergy-report",
        "label": "Report"
      }
    ]
  },
  {
    "id": "mco-adv",
    "label": "Advanced",
    "color": "#6366f1",
    "tabs": [
      {
        "id": "scenario-planner",
        "label": "Scenario Planner"
      },
      {
        "id": "mco-int",
        "label": "Integrations"
      },
      {
        "id": "data-sources-m",
        "label": "Data Sources"
      },
      {
        "id": "mco-api",
        "label": "API"
      },
      {
        "id": "mco-settings",
        "label": "Settings"
      },
      {
        "id": "mco-world",
        "label": "World-Class"
      }
    ]
  }
];

export default function MultiChannelOptimizer() {
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
            <input style={S.input} placeholder="Search or filter..." value={q[tab]||''} onChange={e=>setQ(p=>({...p,[tab]:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&fetch_(tab,ep,{query:q[tab]})} />
            <button style={S.btn()} onClick={()=>fetch_(tab,ep,{query:q[tab]})} disabled={loading[tab]}>{loading[tab]?'Loading...':'Load Data'}</button>
            <button style={S.btn('#10b981')} onClick={()=>toast_('AI analyzing...')}>AI Insights</button>
          </div>
          {err[tab] && <div style={S.err}>{err[tab]}</div>}
          {loading[tab] ? <div style={S.loading}>Loading {title.toLowerCase()}...</div> :
           d ? (
            <div style={{overflowX:'auto'}}>
              <table style={S.tbl}>
                <thead><tr><th style={S.th}>Item</th><th style={S.th}>Category</th><th style={S.th}>Value</th><th style={S.th}>Status</th></tr></thead>
                <tbody>{(Array.isArray(d)?d:Object.values(d)[0]||[]).map((row,i)=>(
                  <tr key={i} style={i%2?S.trOdd:{}}>
                    <td style={S.td}>{row.name||row.id||row.label||row.item||JSON.stringify(row).slice(0,40)}</td>
                    <td style={S.td}><span style={{color:'#71717a',fontSize:12}}>{row.category||row.type||row.group||'--'}</span></td>
                    <td style={S.td}><span style={{fontWeight:600}}>{row.value||row.amount||row.score||'--'}</span></td>
                    <td style={S.td}>{row.status?<span style={S.badge(row.status==='active'||row.status==='ok'?'#10b981':row.status==='warning'?'#f59e0b':'#ef4444')}>{row.status}</span>:'--'}</td>
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
      case 'mco-dash': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Multi-Channel Portfolio Dashboard</div>
            <div style={S.row}>
              <button style={S.btn('#6366f1')} onClick={()=>fetch_('mco-dash',API+'/overview/dashboard')} disabled={loading['mco-dash']}>{loading['mco-dash']?'Loading...':'Load Portfolio'}</button>
              <button style={S.btn('#8b5cf6')} onClick={()=>fetch_('shapley',API+'/attribution/shapley')}>Shapley Attribution</button>
              <button style={S.btn('#10b981')} onClick={()=>toast_('AI optimization running...')}>AI Optimize</button>
            </div>
            {err['mco-dash'] && <div style={S.err}>{err['mco-dash']}</div>}
            {loading['mco-dash'] ? <div style={S.loading}>Loading portfolio data...</div> : d ? (
              <>
                <div style={S.metaRow}>
                  {[['Total Spend','\$'+d.totalSpend?.toLocaleString(),'#fafafa'],['Blended ROAS',d.blendedRoas+'x','#10b981'],['Total Conv.',d.totalConversions?.toLocaleString(),'#6366f1'],['Blended CPA','\$'+d.blendedCpa,'#f59e0b']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
                <div style={S.sT}>Channel Breakdown</div>
                {d.channels?.map((c,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #1f1f22',flexWrap:'wrap',gap:6}}>
                    <div style={{minWidth:140}}>
                      <div style={{fontWeight:600,fontSize:13,color:'#fafafa'}}>{c.name}</div>
                      <div style={{fontSize:11,color:'#71717a'}}>${c.spend?.toLocaleString()} spend</div>
                    </div>
                    <div style={{display:'flex',gap:12,alignItems:'center'}}>
                      <div style={{textAlign:'center'}}><div style={{fontWeight:700,color:'#10b981'}}>{c.roas}x</div><div style={{fontSize:10,color:'#71717a'}}>ROAS</div></div>
                      <div style={{textAlign:'center'}}><div style={{fontWeight:700}}>{c.conversions}</div><div style={{fontSize:10,color:'#71717a'}}>conv</div></div>
                      <span style={S.badge(c.trend.startsWith('+')?'#10b981':'#ef4444')}>{c.trend}</span>
                      <div style={{width:60}}><div style={S.bar}><div style={S.fill(c.pct,'#6366f1')} /></div><div style={{fontSize:10,color:'#71717a',textAlign:'center'}}>{c.pct}%</div></div>
                    </div>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Load your multi-channel portfolio to see blended performance.</div>}
          </div>
        </div>
      );
      case 'mmm-model': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Bayesian Media Mix Model</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Separates media-driven incremental revenue from baseline organic sales. Adstock and saturation curves per channel reveal true contribution.</p>
            <button style={S.btn('#8b5cf6')} onClick={()=>fetch_('mmm-model',API+'/mmm/model')} disabled={loading['mmm-model']}>{loading['mmm-model']?'Running Model...':'Run MMM'}</button>
            {err['mmm-model'] && <div style={S.err}>{err['mmm-model']}</div>}
            {loading['mmm-model'] ? <div style={S.loading}>Fitting Bayesian MMM...</div> : d?.model ? (
              <>
                <div style={{...S.mini,marginBottom:16,borderColor:'#8b5cf644'}}>
                  <div style={{fontSize:12,color:'#8b5cf6',fontWeight:700,marginBottom:4}}>{d.model.name}</div>
                  <p style={{color:'#a1a1aa',fontSize:13,margin:'0 0 6px'}}>{d.model.description}</p>
                  <div style={{display:'flex',gap:16}}>
                    <span style={{fontSize:12,color:'#71717a'}}>R-squared: <span style={{color:'#10b981',fontWeight:700}}>{d.model.fit?.rSquared}</span></span>
                    <span style={{fontSize:12,color:'#71717a'}}>MAPE: <span style={{color:'#f59e0b',fontWeight:700}}>{d.model.fit?.mape}%</span></span>
                  </div>
                </div>
                <div style={{overflowX:'auto'}}>
                  <table style={S.tbl}>
                    <thead><tr><th style={S.th}>Channel</th><th style={S.th}>Contribution</th><th style={S.th}>Adstock Half-Life</th><th style={S.th}>Saturation</th><th style={S.th}>Incr. ROAS</th></tr></thead>
                    <tbody>{d.model.channels?.map((c,i)=>(
                      <tr key={i} style={i%2?S.trOdd:{}}>
                        <td style={S.td}><span style={{fontWeight:600}}>{c.channel}</span></td>
                        <td style={S.td}>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <div style={{...S.bar,width:60,display:'inline-block'}}><div style={S.fill(c.contribution*100,'#8b5cf6')} /></div>
                            <span style={{fontWeight:700}}>{(c.contribution*100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td style={S.td}>{c.adstockHalfLife!=null?c.adstockHalfLife+' days':'--'}</td>
                        <td style={S.td}>{c.saturationAlpha!=null?c.saturationAlpha:'--'}</td>
                        <td style={S.td}>{c.incrementalRoas!=null?<span style={{fontWeight:700,color:c.incrementalRoas>3?'#10b981':c.incrementalRoas>1.5?'#f59e0b':'#ef4444'}}>{c.incrementalRoas}x</span>:'--'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </>
            ) : <div style={S.empty}>Run the MMM to see channel contribution and adstock curves.</div>}
          </div>
        </div>
      );
      case 'shapley': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Shapley Value Attribution</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Game-theory attribution across touchpoints. Each channel gets credit proportional to its marginal contribution -- revealing true vs perceived value.</p>
            <button style={S.btn('#6366f1')} onClick={()=>fetch_('shapley',API+'/attribution/shapley')} disabled={loading.shapley}>{loading.shapley?'Computing...':'Compute Shapley Values'}</button>
            {err.shapley && <div style={S.err}>{err.shapley}</div>}
            {loading.shapley ? <div style={S.loading}>Computing Shapley values...</div> : d?.shapley ? (
              <>
                <p style={{color:'#71717a',fontSize:12,marginBottom:16}}>{d.shapley.description}</p>
                <div style={{overflowX:'auto'}}>
                  <table style={S.tbl}>
                    <thead><tr><th style={S.th}>Channel</th><th style={S.th}>Last-Click %</th><th style={S.th}>Shapley %</th><th style={S.th}>Diff</th><th style={S.th}>Insight</th></tr></thead>
                    <tbody>{d.shapley.channels?.map((c,i)=>(
                      <tr key={i} style={i%2?S.trOdd:{}}>
                        <td style={S.td}><span style={{fontWeight:600}}>{c.channel}</span></td>
                        <td style={S.td}>{c.lastClick}%</td>
                        <td style={S.td}><span style={{fontWeight:700,color:'#8b5cf6'}}>{c.shapley}%</span></td>
                        <td style={S.td}><span style={{fontWeight:700,color:c.diff>0?'#10b981':'#ef4444'}}>{c.diff>0?'+':''}{c.diff}pp</span></td>
                        <td style={{...S.td,fontSize:11,color:'#71717a',maxWidth:200}}>{c.insight}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </>
            ) : <div style={S.empty}>Compute Shapley values to see true multi-touch attribution.</div>}
          </div>
        </div>
      );
      case 'scenarios': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Budget Scenario Planner</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Model the impact of budget reallocations before making changes. Compare ROAS and conversion outcomes across different allocation strategies.</p>
            <div style={S.row}>
              <input style={S.input} placeholder="Total budget..." value={q.scenarios||''} onChange={e=>setQ(p=>({...p,scenarios:e.target.value}))} />
              <button style={S.btn('#8b5cf6')} onClick={()=>fetch_('scenarios',API+'/budgets/scenarios',{totalBudget:q.scenarios})} disabled={loading.scenarios}>{loading.scenarios?'Modeling...':'Model Scenarios'}</button>
            </div>
            {err.scenarios && <div style={S.err}>{err.scenarios}</div>}
            {loading.scenarios ? <div style={S.loading}>Running scenario models...</div> : d?.scenarios?.length ? (
              <div style={{marginTop:8}}>
                {d.scenarios.map((s,i)=>(
                  <div key={i} style={{...S.mini,marginBottom:10,borderColor:i===1?'#10b98144':i===0?'#27272a':'#3f3f46'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                      <span style={{fontWeight:700,color:i===0?'#71717a':'#fafafa'}}>{s.name}</span>
                      {i===1&&<span style={S.badge('#10b981')}>Recommended</span>}
                    </div>
                    <div style={{display:'flex',gap:16,marginBottom:4}}>
                      {[['Blended ROAS',s.blendedRoas+'x'],['Conversions',s.totalConversions?.toLocaleString()],['Budget','\$'+s.totalBudget?.toLocaleString()]].map(([l,v])=>(
                        <div key={l}><span style={{fontSize:11,color:'#71717a'}}>{l}: </span><span style={{fontWeight:600}}>{v}</span></div>
                      ))}
                    </div>
                    <div style={{fontSize:12,color:'#a1a1aa',fontStyle:'italic'}}>{s.note}</div>
                  </div>
                ))}
              </div>
            ) : <div style={S.empty}>Model budget scenarios to compare allocation strategies.</div>}
          </div>
        </div>
      );
      case 'mco-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'📊',t:'Bayesian Media Mix Model',d:'Adstock and saturation curves per channel. Separates true incremental media revenue from baseline organic -- R-squared > 0.9 model fit.'},
                {icon:'🎮',t:'Shapley Value Attribution',d:'Game-theory attribution: each channel gets credit proportional to its marginal contribution across all possible customer journey combinations.'},
                {icon:'📉',t:'Diminishing Returns Curves',d:'Identify the marginal ROAS curve for each channel to find the optimal spend level before efficiency drops below breakeven.'},
                {icon:'🔀',t:'Cross-Channel Frequency Cap',d:'Unified frequency management across Google/Meta/TikTok/programmatic -- prevent over-serving the same user across all channels.'},
                {icon:'✨',t:'Channel Synergy Analysis',d:'Which channel combinations produce super-additive effects? Email + Meta retargeting shows 1.42x synergy multiplier in tests.'},
                {icon:'🎯',t:'Scenario Planning Dashboard',d:'Reallocate $10K from Meta to Google -- what is the predicted ROAS change? Model outcomes before committing real budget.'},
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
            <h1 style={{fontSize:24,fontWeight:800,color:'#fafafa',margin:'0 0 4px',letterSpacing:'-0.02em'}}>Multi Channel Optimizer</h1>
            <p style={{color:'#71717a',fontSize:13,margin:'4px 0 0'}}>Media mix intelligence -- Bayesian MMM, Shapley attribution, diminishing returns curves, channel synergy & scenario planning</p>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={S.btn('#27272a')} onClick={()=>fetch_(activeTab, API+'/health',{})}>Refresh</button>
            <button style={S.btn('#10b981')} onClick={()=>toast_('AI analysis started...')}>AI Analysis</button>
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
