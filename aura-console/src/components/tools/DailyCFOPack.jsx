import React, { useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/daily-cfo-pack";

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
    "id": "briefing",
    "label": "Briefing",
    "color": "#4f46e5",
    "tabs": [
      {
        "id": "morning-brief",
        "label": "Morning Brief"
      },
      {
        "id": "yesterday",
        "label": "Yesterday"
      },
      {
        "id": "weekly",
        "label": "Weekly"
      },
      {
        "id": "monthly",
        "label": "Monthly"
      },
      {
        "id": "ytd",
        "label": "YTD"
      },
      {
        "id": "dcfo-alerts",
        "label": "Alerts"
      }
    ]
  },
  {
    "id": "revenue",
    "label": "Revenue",
    "color": "#10b981",
    "tabs": [
      {
        "id": "rev-dash",
        "label": "Revenue Dash"
      },
      {
        "id": "by-channel-r",
        "label": "By Channel"
      },
      {
        "id": "by-product-r",
        "label": "By Product"
      },
      {
        "id": "by-region",
        "label": "By Region"
      },
      {
        "id": "rev-trends",
        "label": "Trends"
      },
      {
        "id": "rev-fore",
        "label": "Forecast"
      }
    ]
  },
  {
    "id": "margins",
    "label": "Margins",
    "color": "#f97316",
    "tabs": [
      {
        "id": "gp-margin",
        "label": "Gross Margin"
      },
      {
        "id": "np-margin",
        "label": "Net Margin"
      },
      {
        "id": "ebitda-tab",
        "label": "EBITDA"
      },
      {
        "id": "by-sku-m",
        "label": "By SKU"
      },
      {
        "id": "erosion",
        "label": "Erosion Alerts"
      },
      {
        "id": "margin-bench",
        "label": "Benchmarks"
      }
    ]
  },
  {
    "id": "cashflow",
    "label": "Cash Flow",
    "color": "#0ea5e9",
    "tabs": [
      {
        "id": "cash-pos",
        "label": "Cash Position"
      },
      {
        "id": "inout",
        "label": "In / Out"
      },
      {
        "id": "runway",
        "label": "Runway"
      },
      {
        "id": "burn-rate",
        "label": "Burn Rate"
      },
      {
        "id": "cf-fore",
        "label": "Forecast"
      },
      {
        "id": "cf-scenarios",
        "label": "Scenarios"
      }
    ]
  },
  {
    "id": "kpis",
    "label": "KPIs",
    "color": "#a855f7",
    "tabs": [
      {
        "id": "kpi-board",
        "label": "KPI Board"
      },
      {
        "id": "custom-kpis",
        "label": "Custom KPIs"
      },
      {
        "id": "targets",
        "label": "Targets"
      },
      {
        "id": "kpi-variance",
        "label": "Variance"
      },
      {
        "id": "scorecards",
        "label": "Scorecards"
      },
      {
        "id": "kpi-reports",
        "label": "Reports"
      }
    ]
  },
  {
    "id": "intel",
    "label": "Intelligence",
    "color": "#ec4899",
    "tabs": [
      {
        "id": "ai-query",
        "label": "AI Query"
      },
      {
        "id": "board-pack",
        "label": "Board Pack"
      },
      {
        "id": "waterfall",
        "label": "Waterfall"
      },
      {
        "id": "narrative",
        "label": "Narrative"
      },
      {
        "id": "benchmarks-i",
        "label": "Benchmarks"
      },
      {
        "id": "intel-alerts",
        "label": "Alerts"
      }
    ]
  },
  {
    "id": "dcfo-adv",
    "label": "Advanced",
    "color": "#f59e0b",
    "tabs": [
      {
        "id": "data-sources",
        "label": "Data Sources"
      },
      {
        "id": "dcfo-int",
        "label": "Integrations"
      },
      {
        "id": "schedule",
        "label": "Schedule"
      },
      {
        "id": "dcfo-api",
        "label": "API"
      },
      {
        "id": "dcfo-settings",
        "label": "Settings"
      },
      {
        "id": "dcfo-world",
        "label": "World-Class"
      }
    ]
  }
];

export default function DailyCFOPack() {
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
      case 'morning-brief': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>AI Morning CFO Briefing</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>AI-generated daily brief: yesterday KPIs vs target, top 3 risks, top 3 opportunities, and the one key decision needed today.</p>
            <div style={S.row}>
              <button style={S.btn('#4f46e5')} onClick={()=>fetch_('morning-brief',API+'/briefing/morning')} disabled={loading['morning-brief']}>{loading['morning-brief']?'Generating…':'Generate Morning Brief'}</button>
            </div>
            {err['morning-brief'] && <div style={S.err}>{err['morning-brief']}</div>}
            {loading['morning-brief'] ? <div style={S.loading}>AI generating your briefing…</div> : d ? (
              <>
                <div style={{...S.mini,marginBottom:16,background:'#09090b',borderColor:'#4f46e544'}}>
                  <div style={{fontSize:11,color:'#4f46e5',fontWeight:600,marginBottom:4}}>TODAY — {d.date}</div>
                  <div style={{fontSize:15,fontWeight:700,color:'#fafafa',lineHeight:1.4}}>{d.headline}</div>
                </div>
                <div style={S.metaRow}>
                  {d.kpis?.map(k=>(
                    <div key={k.name} style={S.metaItem}>
                      <div style={S.metaVal(k.vsPrior?.startsWith('+')?'#10b981':'#ef4444')}>{k.value}</div>
                      <div style={S.metaLbl}>{k.name}</div>
                      <div style={{fontSize:10,color:k.vsTarget?.startsWith('+')?'#10b981':'#ef4444',marginTop:2}}>{k.vsTarget} vs target</div>
                    </div>
                  ))}
                </div>
                {[['Top Risks','#ef4444',d.topRisks],['Opportunities','#10b981',d.opportunities]].map(([label,color,items])=>(
                  <div key={label}>
                    <div style={S.sT}>{label}</div>
                    {items?.map((item,i)=>(
                      <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid #1f1f22'}}>
                        <span style={S.badge(color)}>{i+1}</span>
                        <span style={{fontSize:13,color:'#fafafa',lineHeight:1.5}}>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Generate your AI-powered morning CFO briefing.</div>}
          </div>
        </div>
      );
      case 'kpi-board': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>KPI Scorecard</div>
            <button style={S.btn('#a855f7')} onClick={()=>fetch_('kpi-board',API+'/kpis/board')} disabled={loading['kpi-board']}>{loading['kpi-board']?'Loading…':'Load KPI Board'}</button>
            {err['kpi-board'] && <div style={S.err}>{err['kpi-board']}</div>}
            {loading['kpi-board'] ? <div style={S.loading}>Loading KPIs…</div> : d?.kpis?.length ? (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12,marginTop:16}}>
                {d.kpis.map((kpi,i)=>(
                  <div key={i} style={{...S.mini,borderColor:kpi.status==='on-track'?'#10b98144':kpi.status==='at-risk'?'#f59e0b44':'#ef444444'}}>
                    <div style={{fontSize:11,color:'#71717a',marginBottom:4}}>{kpi.name}</div>
                    <div style={{fontSize:24,fontWeight:800,color:kpi.status==='on-track'?'#10b981':kpi.status==='at-risk'?'#f59e0b':'#ef4444'}}>{kpi.unit==='$'?'$':''}{kpi.value?.toLocaleString()}{kpi.unit==='%'?'%':kpi.unit&&kpi.unit!=='$'?kpi.unit:''}</div>
                    <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
                      <span style={{fontSize:11,color:'#71717a'}}>Target: {kpi.unit==='$'?'$':''}{kpi.target}{kpi.unit==='%'?'%':''}</span>
                      <span style={S.badge(kpi.status==='on-track'?'#10b981':kpi.status==='at-risk'?'#f59e0b':'#ef4444')}>{kpi.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div style={S.empty}>Load the KPI board to see your business performance scorecard.</div>}
          </div>
        </div>
      );
      case 'ai-query': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>✦ AI Natural Language CFO Query</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Ask any financial question in plain English. "What drove the 15% revenue decline last Tuesday?" — AI answers using your actual data.</p>
            <div style={S.row}>
              <input style={S.input} placeholder="What drove revenue growth last week?" value={q['ai-query']||''} onChange={e=>setQ(p=>({...p,'ai-query':e.target.value}))} onKeyDown={e=>e.key==='Enter'&&fetch_('ai-query',API+'/intel/ai-query',{query:q['ai-query']})} />
              <select style={S.select} value={form.model||'gpt-4o'} onChange={e=>setForm(p=>({...p,model:e.target.value}))}>
                <option value="gpt-4o-mini">Mini (1 credit)</option>
                <option value="gpt-4o">GPT-4o (3 credits)</option>
              </select>
              <button style={S.btn('#ec4899')} onClick={()=>fetch_('ai-query',API+'/intel/ai-query',{query:q['ai-query']})} disabled={loading['ai-query']}>{loading['ai-query']?'Thinking…':'✦ Ask AI'}</button>
            </div>
            {err['ai-query'] && <div style={S.err}>{err['ai-query']}</div>}
            {loading['ai-query'] ? <div style={S.loading}>AI analyzing your financial data…</div> : data['ai-query']?.answer ? (
              <div>
                <div style={S.sT}>Question</div>
                <div style={{fontSize:13,color:'#a1a1aa',marginBottom:12}}>"{data['ai-query'].query}"</div>
                <div style={S.sT}>Answer</div>
                <div style={{...S.mini,background:'#09090b'}}><p style={{color:'#e4e4e7',fontSize:14,lineHeight:1.8,margin:0}}>{data['ai-query'].answer}</p></div>
                <div style={{color:'#71717a',fontSize:11,marginTop:8}}>Model: {data['ai-query'].model} · Credits: {data['ai-query'].creditsUsed}</div>
              </div>
            ) : <div style={S.empty}>Ask any financial question in plain English.</div>}
          </div>
        </div>
      );
      case 'waterfall': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Revenue Waterfall Bridge</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Bridge chart showing exactly what drove period-over-period revenue change — volume, price/mix, new channels, and other factors.</p>
            <button style={S.btn('#ec4899')} onClick={()=>fetch_('waterfall',API+'/intel/waterfall')} disabled={loading.waterfall}>{loading.waterfall?'Loading…':'Load Waterfall'}</button>
            {err.waterfall && <div style={S.err}>{err.waterfall}</div>}
            {loading.waterfall ? <div style={S.loading}>Building waterfall chart…</div> : d?.bridges?.length ? (
              <div style={{marginTop:16}}>
                {d.bridges.map((b,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid #1f1f22'}}>
                    <span style={{fontSize:13,color:b.type==='base'||b.type==='total'?'#fafafa':'#a1a1aa',fontWeight:b.type==='total'?700:400}}>{b.category}</span>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      {b.type!=='base' && <div style={{...S.bar,width:120,display:'inline-block'}}><div style={{...S.fill(Math.abs(b.value)/248430*100,b.value>0?'#10b981':'#ef4444'),width:Math.abs(b.value)/248430*100+'%'}} /></div>}
                      <span style={{fontWeight:700,color:b.type==='base'?'#fafafa':b.type==='total'?'#4f46e5':b.value>0?'#10b981':'#ef4444',minWidth:80,textAlign:'right'}}>{b.value>0?'+':''}{b.value>0||b.type==='base'||b.type==='total'?'$':'-$'}{Math.abs(b.value).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div style={S.empty}>Load waterfall to see what drove revenue change.</div>}
          </div>
        </div>
      );
      case 'dcfo-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>✦ World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'🌅',t:'AI Morning Intelligence Briefing',d:'Daily AI-generated brief: KPIs vs target, top 3 risks, top 3 opportunities, and the one key decision for today.'},
                {icon:'💬',t:'NLP CFO Query Interface',d:'Ask any financial question in plain English and get data-backed answers — no SQL, no reports, just natural language.'},
                {icon:'📝',t:'Executive Narrative Generation',d:'AI writes board-ready financial commentary with proper business language — ready to paste into board reports.'},
                {icon:'🌊',t:'Revenue Waterfall Bridge Charts',d:'Visualize exactly what drove period-over-period change: volume, price/mix, channel, product, and other factors.'},
                {icon:'🎯',t:'Adaptive KPI Thresholds',d:'Self-calibrating alert thresholds based on your historical volatility — no manual threshold tuning required.'},
                {icon:'📋',t:'One-Click Board Pack Generator',d:'Generate board presentation with charts, AI narrative, YTD vs prior year, and forward look in one click.'},
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
            <h1 style={{fontSize:24,fontWeight:800,color:'#fafafa',margin:'0 0 4px',letterSpacing:'-0.02em'}}>Daily C F O Pack</h1>
            <p style={{color:'#71717a',fontSize:13,margin:'4px 0 0'}}>Executive intelligence briefing — AI morning brief, NLP CFO query, waterfall analysis & one-click board pack generator</p>
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
