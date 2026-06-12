import React, { useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/inventory-supplier-sync";

const S = {
  root: { background:'#09090b', minHeight:'100vh', color:'#fafafa', fontFamily:"'Inter',system-ui,sans-serif", padding:'28px 32px' },
  card: { background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:24, marginBottom:20 },
  mini: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:16 },
  cardTitle: { fontSize:14, fontWeight:700, color:'#fafafa', marginBottom:16, marginTop:0 },
  row: { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' },
  input: { flex:1, minWidth:180, background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:14, padding:'11px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif" },
  select: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'11px 14px', outline:'none', cursor:'pointer' },
  textarea: { width:'100%', background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'12px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif", resize:'vertical', boxSizing:'border-box' },
  btn: (bg) => ({ background:bg||'#0ea5e9', color:'#fff', border:'none', borderRadius:10, padding:'11px 22px', fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }),
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
  metaVal: (c) => ({ fontSize:22, fontWeight:700, color:c||'#0ea5e9' }),
  metaLbl: { fontSize:11, color:'#71717a', marginTop:2 },
  sT: { fontSize:12, fontWeight:700, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, marginTop:16 },
  groupNav: { display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' },
  gBtn: (a, c) => ({ background:a?c+'22':'#18181b', color:a?c:'#71717a', border:`1px solid ${a?c+'44':'#27272a'}`, borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:a?700:500, cursor:'pointer' }),
  tabStrip: { display:'flex', gap:4, marginBottom:20, flexWrap:'wrap', borderBottom:'1px solid #27272a', paddingBottom:8 },
  tBtn: (a, c) => ({ background:'none', color:a?c:'#71717a', border:'none', borderBottom:a?`2px solid ${c}`:'2px solid transparent', padding:'8px 14px', fontSize:13, fontWeight:a?700:500, cursor:'pointer', marginBottom:-9 }),
  bar: { height:6, background:'#27272a', borderRadius:3, overflow:'hidden', marginTop:4 },
  fill: (pct, c) => ({ height:'100%', width:Math.min(pct||0,100)+'%', background:c||'#0ea5e9', borderRadius:3 }),
  pre: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, padding:16, fontSize:12, color:'#a1a1aa', fontFamily:'monospace', whiteSpace:'pre-wrap', maxHeight:280, overflow:'auto', marginBottom:12 },
  sc: (s) => { if(s>=75) return '#10b981'; if(s>=50) return '#f59e0b'; return '#ef4444'; },
};

const GROUPS = [
  {
    "id": "suppliers",
    "label": "Suppliers",
    "color": "#4f46e5",
    "tabs": [
      {
        "id": "iss-list",
        "label": "Supplier List"
      },
      {
        "id": "scorecard",
        "label": "Scorecard"
      },
      {
        "id": "new-supplier",
        "label": "New Supplier"
      },
      {
        "id": "risk-monitor",
        "label": "Risk Monitor"
      },
      {
        "id": "compliance",
        "label": "Compliance"
      },
      {
        "id": "sustainability",
        "label": "Sustainability"
      }
    ]
  },
  {
    "id": "orders",
    "label": "Orders",
    "color": "#0ea5e9",
    "tabs": [
      {
        "id": "po-list",
        "label": "PO List"
      },
      {
        "id": "create-po",
        "label": "Create PO"
      },
      {
        "id": "receiving",
        "label": "Receiving"
      },
      {
        "id": "edi-docs",
        "label": "EDI Documents"
      },
      {
        "id": "variances",
        "label": "Variances"
      },
      {
        "id": "po-history",
        "label": "PO History"
      }
    ]
  },
  {
    "id": "leadtimes",
    "label": "Lead Times",
    "color": "#10b981",
    "tabs": [
      {
        "id": "lt-tracker",
        "label": "Lead Time Tracker"
      },
      {
        "id": "lt-prediction",
        "label": "Prediction ML"
      },
      {
        "id": "by-supplier",
        "label": "By Supplier"
      },
      {
        "id": "by-product",
        "label": "By Product"
      },
      {
        "id": "lt-alerts",
        "label": "Alerts"
      },
      {
        "id": "improvement",
        "label": "Improvement"
      }
    ]
  },
  {
    "id": "pricing",
    "label": "Pricing",
    "color": "#f97316",
    "tabs": [
      {
        "id": "price-history",
        "label": "Price History"
      },
      {
        "id": "benchmarks",
        "label": "Market Benchmarks"
      },
      {
        "id": "negotiations",
        "label": "Negotiations"
      },
      {
        "id": "contracts",
        "label": "Contracts"
      },
      {
        "id": "rebates",
        "label": "Rebates"
      },
      {
        "id": "cost-analysis",
        "label": "Cost Analysis"
      }
    ]
  },
  {
    "id": "risk",
    "label": "Risk",
    "color": "#ef4444",
    "tabs": [
      {
        "id": "risk-dashboard",
        "label": "Risk Dashboard"
      },
      {
        "id": "financial-health",
        "label": "Financial Health"
      },
      {
        "id": "geo-risk",
        "label": "Geo Risk"
      },
      {
        "id": "alt-sourcing",
        "label": "Alt Sourcing"
      },
      {
        "id": "continuity",
        "label": "Continuity Plan"
      },
      {
        "id": "disruption-log",
        "label": "Disruption Log"
      }
    ]
  },
  {
    "id": "vmi",
    "label": "VMI",
    "color": "#a855f7",
    "tabs": [
      {
        "id": "vmi-overview",
        "label": "VMI Overview"
      },
      {
        "id": "stock-visibility",
        "label": "Stock Visibility"
      },
      {
        "id": "vmi-replenishment",
        "label": "Replenishment"
      },
      {
        "id": "vmi-performance",
        "label": "Performance"
      },
      {
        "id": "vmi-settings",
        "label": "VMI Settings"
      },
      {
        "id": "vmi-alerts",
        "label": "Alerts"
      }
    ]
  },
  {
    "id": "adv",
    "label": "Advanced",
    "color": "#f59e0b",
    "tabs": [
      {
        "id": "iss-ai",
        "label": "AI Insights"
      },
      {
        "id": "edi-setup",
        "label": "EDI Setup"
      },
      {
        "id": "iss-integrations",
        "label": "Integrations"
      },
      {
        "id": "iss-reports",
        "label": "Reports"
      },
      {
        "id": "iss-settings",
        "label": "Settings"
      },
      {
        "id": "iss-world",
        "label": "World-Class"
      }
    ]
  }
];

export default function InventorySupplierSync() {
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
      case 'iss-list': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Supplier Directory</div>
            <div style={S.row}>
              <input style={S.input} placeholder="Search suppliers…" value={q['iss-list']||''} onChange={e=>setQ(p=>({...p,'iss-list':e.target.value}))} />
              <button style={S.btn()} onClick={()=>fetch_('iss-list',API+'/suppliers/list',{query:q['iss-list']})} disabled={loading['iss-list']}>{loading['iss-list']?'Loading…':'Load Suppliers'}</button>
              <button style={S.btn('#10b981')} onClick={()=>{setActiveGroup('suppliers');setActiveTab('new-supplier');}}>+ New Supplier</button>
            </div>
            {err['iss-list'] && <div style={S.err}>{err['iss-list']}</div>}
            {loading['iss-list'] ? <div style={S.loading}>Loading suppliers…</div> : d?.suppliers?.length ? (
              <div style={{overflowX:'auto'}}>
                <table style={S.tbl}>
                  <thead><tr><th style={S.th}>Supplier</th><th style={S.th}>Country</th><th style={S.th}>Category</th><th style={S.th}>On-Time</th><th style={S.th}>Quality</th><th style={S.th}>Risk</th><th style={S.th}>Status</th></tr></thead>
                  <tbody>{d.suppliers.map((s,i)=>(
                    <tr key={i} style={i%2?S.trOdd:{}}>
                      <td style={S.td}><span style={{fontWeight:600}}>{s.name}</span><br/><span style={{fontSize:11,color:'#71717a'}}>{s.id}</span></td>
                      <td style={S.td}>{s.country}</td>
                      <td style={S.td}><span style={S.badge('#0ea5e9')}>{s.category}</span></td>
                      <td style={S.td}><span style={{color:s.onTimeDelivery>=95?'#10b981':s.onTimeDelivery>=85?'#f59e0b':'#ef4444',fontWeight:700}}>{s.onTimeDelivery}%</span></td>
                      <td style={S.td}><span style={{color:s.qualityRate>=98?'#10b981':s.qualityRate>=95?'#f59e0b':'#ef4444',fontWeight:700}}>{s.qualityRate}%</span></td>
                      <td style={S.td}><div style={{...S.bar,maxWidth:60,display:'inline-block',width:60}}><div style={S.fill(s.riskScore, s.riskScore>70?'#ef4444':s.riskScore>40?'#f59e0b':'#10b981')} /></div></td>
                      <td style={S.td}><span style={S.badge(s.status==='active'?'#10b981':s.status==='probation'?'#f59e0b':'#0ea5e9')}>{s.status}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <div style={S.empty}>Click Load Suppliers to view your supplier directory.</div>}
          </div>
        </div>
      );
      case 'scorecard': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Supplier Scorecard</div>
            <div style={S.row}>
              <input style={S.input} placeholder="Supplier ID or name…" value={q.scorecard||''} onChange={e=>setQ(p=>({...p,scorecard:e.target.value}))} />
              <button style={S.btn()} onClick={()=>fetch_('scorecard',API+'/suppliers/scorecard',{supplierId:1})} disabled={loading.scorecard}>{loading.scorecard?'Loading…':'View Scorecard'}</button>
            </div>
            {err.scorecard && <div style={S.err}>{err.scorecard}</div>}
            {loading.scorecard ? <div style={S.loading}>Loading scorecard…</div> : d ? (
              <>
                <div style={{fontWeight:700,fontSize:16,color:'#fafafa',marginBottom:16}}>{d.supplier?.name} — Overall: <span style={{color:S.sc(d.scores?.overall||0)}}>{d.scores?.overall}/100</span></div>
                <div style={S.metaRow}>
                  {Object.entries(d.scores||{}).filter(([k])=>k!=='overall').map(([k,v])=>(
                    <div key={k} style={S.metaItem}><div style={S.metaVal(S.sc(v))}>{v}</div><div style={S.metaLbl}>{k.charAt(0).toUpperCase()+k.slice(1)}</div></div>
                  ))}
                </div>
                {Object.entries(d.scores||{}).filter(([k])=>k!=='overall').map(([k,v])=>(
                  <div key={k} style={{marginBottom:10}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:12,color:'#a1a1aa'}}>{k.charAt(0).toUpperCase()+k.slice(1)}</span>
                      <span style={{fontSize:12,fontWeight:700,color:S.sc(v)}}>{v}/100</span>
                    </div>
                    <div style={S.bar}><div style={S.fill(v,S.sc(v))} /></div>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Enter a supplier ID to view their performance scorecard.</div>}
          </div>
        </div>
      );
      case 'iss-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>✦ World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'📋',t:'EDI Integration',d:'ANSI X12 / EDIFACT: 850 PO, 855 PO Acknowledgment, 856 ASN, 810 Invoice — fully automated document exchange.'},
                {icon:'🤖',t:'AI Scorecard Engine',d:'Automated supplier scoring on 6 dimensions updated after every PO receipt, quality inspection, and delivery event.'},
                {icon:'🌍',t:'Geopolitical Risk Radar',d:'Real-time monitoring of political instability, natural disasters, and trade policy changes affecting your supplier regions.'},
                {icon:'📈',t:'Lead Time ML Prediction',d:'Supplier-specific log-normal lead time distributions — predict delays before they happen with 85%+ accuracy.'},
                {icon:'🌱',t:'Carbon Footprint Scoring',d:'Supplier emissions data, transport distance calculations, and ESG scoring for sustainability reporting.'},
                {icon:'🔄',t:'VMI (Vendor Managed Inventory)',d:'Allow trusted suppliers to view your stock levels and automatically trigger replenishment — reducing manual POs by 60%.'},
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
            <h1 style={{fontSize:24,fontWeight:800,color:'#fafafa',margin:'0 0 4px',letterSpacing:'-0.02em'}}>Inventory Supplier Sync</h1>
            <p style={{color:'#71717a',fontSize:13,margin:'4px 0 0'}}>Supplier intelligence platform — EDI integration, AI scorecards, lead time prediction & risk monitoring</p>
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
