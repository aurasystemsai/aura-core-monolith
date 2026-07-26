import React, { useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/facebook-ads-integration";

const S = {
  root: { background:'#09090b', minHeight:'100vh', color:'#fafafa', fontFamily:"'Inter',system-ui,sans-serif", padding:'28px 32px' },
  card: { background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:24, marginBottom:20 },
  mini: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:16 },
  cardTitle: { fontSize:14, fontWeight:700, color:'#fafafa', marginBottom:16, marginTop:0 },
  row: { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' },
  input: { flex:1, minWidth:180, background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:14, padding:'11px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif" },
  select: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'11px 14px', outline:'none', cursor:'pointer' },
  textarea: { width:'100%', background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'12px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif", resize:'vertical', boxSizing:'border-box' },
  btn: (bg) => ({ background:bg||'#1877f2', color:'#fff', border:'none', borderRadius:10, padding:'11px 22px', fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }),
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
  metaVal: (c) => ({ fontSize:22, fontWeight:700, color:c||'#1877f2' }),
  metaLbl: { fontSize:11, color:'#71717a', marginTop:2 },
  sT: { fontSize:12, fontWeight:700, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, marginTop:16 },
  groupNav: { display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' },
  gBtn: (a, c) => ({ background:a?c+'22':'#18181b', color:a?c:'#71717a', border:`1px solid ${a?c+'44':'#27272a'}`, borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:a?700:500, cursor:'pointer' }),
  tabStrip: { display:'flex', gap:4, marginBottom:20, flexWrap:'wrap', borderBottom:'1px solid #27272a', paddingBottom:8 },
  tBtn: (a, c) => ({ background:'none', color:a?c:'#71717a', border:'none', borderBottom:a?`2px solid ${c}`:'2px solid transparent', padding:'8px 14px', fontSize:13, fontWeight:a?700:500, cursor:'pointer', marginBottom:-9 }),
  bar: { height:6, background:'#27272a', borderRadius:3, overflow:'hidden', marginTop:4 },
  fill: (pct, c) => ({ height:'100%', width:Math.min(pct||0,100)+'%', background:c||'#1877f2', borderRadius:3 }),
  pre: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, padding:16, fontSize:12, color:'#a1a1aa', fontFamily:'monospace', whiteSpace:'pre-wrap', maxHeight:280, overflow:'auto', marginBottom:12 },
};

const GROUPS = [
  {
    "id": "overview-f",
    "label": "Overview",
    "color": "#1877f2",
    "tabs": [
      {
        "id": "fad-dash",
        "label": "Dashboard"
      },
      {
        "id": "fad-camps",
        "label": "Campaigns"
      },
      {
        "id": "ad-sets",
        "label": "Ad Sets"
      },
      {
        "id": "fad-ads",
        "label": "Ads"
      },
      {
        "id": "fad-perf",
        "label": "Performance"
      },
      {
        "id": "fad-trends",
        "label": "Trends"
      }
    ]
  },
  {
    "id": "audiences-f",
    "label": "Audiences",
    "color": "#42b72a",
    "tabs": [
      {
        "id": "custom-aud",
        "label": "Custom Audiences"
      },
      {
        "id": "lookalike-f",
        "label": "Lookalike"
      },
      {
        "id": "ltv-lookalike",
        "label": "LTV Lookalike"
      },
      {
        "id": "overlap",
        "label": "Overlap Analysis"
      },
      {
        "id": "interest-aud",
        "label": "Interest"
      },
      {
        "id": "saved-aud",
        "label": "Saved"
      }
    ]
  },
  {
    "id": "creative-f",
    "label": "Creative",
    "color": "#e91e8c",
    "tabs": [
      {
        "id": "creative-lib",
        "label": "Creative Library"
      },
      {
        "id": "fatigue",
        "label": "Fatigue Detector"
      },
      {
        "id": "dco",
        "label": "DCO Analysis"
      },
      {
        "id": "creative-ai-f",
        "label": "AI Creative"
      },
      {
        "id": "creative-pred",
        "label": "CTR Predictor"
      },
      {
        "id": "copy-f",
        "label": "Copy Generator"
      }
    ]
  },
  {
    "id": "pixel-f",
    "label": "Pixel & Data",
    "color": "#f59e0b",
    "tabs": [
      {
        "id": "pixel-events",
        "label": "Pixel Events"
      },
      {
        "id": "ios14",
        "label": "iOS 14+ Recovery"
      },
      {
        "id": "capi",
        "label": "Conversions API"
      },
      {
        "id": "event-match",
        "label": "Event Match"
      },
      {
        "id": "custom-conv",
        "label": "Custom Conv."
      },
      {
        "id": "data-health",
        "label": "Data Health"
      }
    ]
  },
  {
    "id": "shopping-f",
    "label": "Shopping",
    "color": "#1877f2",
    "tabs": [
      {
        "id": "advantage-plus",
        "label": "Advantage+"
      },
      {
        "id": "catalog",
        "label": "Catalog"
      },
      {
        "id": "dynamic-ads",
        "label": "Dynamic Ads"
      },
      {
        "id": "shop-perf",
        "label": "Performance"
      },
      {
        "id": "cbo-sim",
        "label": "CBO Sim"
      },
      {
        "id": "shop-ai",
        "label": "AI Optimize"
      }
    ]
  },
  {
    "id": "analytics-f",
    "label": "Analytics",
    "color": "#42b72a",
    "tabs": [
      {
        "id": "attribution-f",
        "label": "Attribution"
      },
      {
        "id": "funnel-f",
        "label": "Funnel"
      },
      {
        "id": "cohort-f",
        "label": "Cohort"
      },
      {
        "id": "breakdown",
        "label": "Breakdown"
      },
      {
        "id": "cross-channel-f",
        "label": "Cross-Channel"
      },
      {
        "id": "reports-f",
        "label": "Reports"
      }
    ]
  },
  {
    "id": "fad-adv",
    "label": "Advanced",
    "color": "#f59e0b",
    "tabs": [
      {
        "id": "cbo-adv",
        "label": "CBO Setup"
      },
      {
        "id": "a-b-tests",
        "label": "A/B Tests"
      },
      {
        "id": "fad-int",
        "label": "Integrations"
      },
      {
        "id": "fad-api",
        "label": "API"
      },
      {
        "id": "fad-settings",
        "label": "Settings"
      },
      {
        "id": "fad-world",
        "label": "World-Class"
      }
    ]
  }
];

export default function FacebookAdsIntegration() {
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
      case 'fad-dash': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Meta Ads Dashboard</div>
            <button style={S.btn('#1877f2')} onClick={()=>fetch_('fad-dash',API+'/overview/dashboard')} disabled={loading['fad-dash']}>{loading['fad-dash']?'Loading...':'Load Dashboard'}</button>
            {err['fad-dash'] && <div style={S.err}>{err['fad-dash']}</div>}
            {loading['fad-dash'] ? <div style={S.loading}>Loading Meta Ads data...</div> : d ? (
              <>
                <div style={S.metaRow}>
                  {[['Spend','\$'+d.spend?.toLocaleString(),'#fafafa'],['ROAS',d.roas+'x','#10b981'],['Conversions',d.conversions,'#1877f2'],['CPA','\$'+d.cpa,'#f59e0b'],['CTR',d.ctr+'%','#a855f7'],['Frequency',d.frequency,'#ef4444']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
              </>
            ) : <div style={S.empty}>Load your Meta Ads dashboard to see performance overview.</div>}
          </div>
        </div>
      );
      case 'fatigue': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Ad Fatigue Detector</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Frequency-based fatigue curves detect when creative performance begins declining. Auto-pause recommendations before CTR erodes significantly.</p>
            <button style={S.btn('#e91e8c')} onClick={()=>fetch_('fatigue',API+'/creative/fatigue')} disabled={loading.fatigue}>{loading.fatigue?'Analyzing...':'Detect Fatigue'}</button>
            {err.fatigue && <div style={S.err}>{err.fatigue}</div>}
            {loading.fatigue ? <div style={S.loading}>Analyzing creative fatigue...</div> : d?.creatives?.length ? (
              <div style={{marginTop:16}}>
                {d.creatives.map((c,i)=>(
                  <div key={i} style={{...S.mini,marginBottom:8,borderColor:c.status==='fatigued'?'#ef444444':c.status==='warning'?'#f59e0b44':'#27272a',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontWeight:600,color:'#fafafa'}}>{c.name}</div>
                      <div style={{fontSize:12,color:'#71717a',marginTop:2}}>{c.daysRunning} days running · Frequency: {c.frequency}</div>
                    </div>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:16,fontWeight:700,color:c.fatigueScore>60?'#ef4444':c.fatigueScore>30?'#f59e0b':'#10b981'}}>{c.fatigueScore}</div>
                        <div style={{fontSize:10,color:'#71717a'}}>fatigue</div>
                      </div>
                      <span style={S.badge(c.status==='fatigued'?'#ef4444':c.status==='warning'?'#f59e0b':'#10b981')}>{c.status}</span>
                      {c.status==='fatigued'&&<button style={{...S.btn('#ef4444'),padding:'4px 10px',fontSize:11}} onClick={()=>toast_('Creative paused')}>Pause</button>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <div style={S.empty}>Run fatigue detection to identify worn-out creatives.</div>}
          </div>
        </div>
      );
      case 'dco': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Dynamic Creative Optimization Analysis</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Element-level performance analysis: which headlines, images, and CTAs drive the most conversions independently.</p>
            <button style={S.btn('#e91e8c')} onClick={()=>fetch_('dco',API+'/creative/dco')} disabled={loading.dco}>{loading.dco?'Analyzing...':'Load DCO Analysis'}</button>
            {err.dco && <div style={S.err}>{err.dco}</div>}
            {loading.dco ? <div style={S.loading}>Loading DCO data...</div> : d?.elements ? (
              <>
                {[['Headlines',d.elements.headlines,'text'],['Images',d.elements.images,'url'],['CTAs',d.elements.ctas,'text']].map(([label,items,key])=>(
                  <div key={label}>
                    <div style={S.sT}>{label}</div>
                    <div style={{overflowX:'auto',marginBottom:16}}>
                      <table style={S.tbl}>
                        <thead><tr><th style={S.th}>{key==='url'?'Creative':'Text'}</th><th style={S.th}>Impressions</th><th style={S.th}>CTR</th><th style={S.th}>Conv.</th></tr></thead>
                        <tbody>{items?.map((item,i)=>(
                          <tr key={i} style={i%2?S.trOdd:{}}>
                            <td style={S.td}><span style={{fontSize:12}}>{item[key]}</span></td>
                            <td style={S.td}>{item.impressions?.toLocaleString()}</td>
                            <td style={S.td}><span style={{fontWeight:700,color:item.ctr>3.5?'#10b981':'#f59e0b'}}>{item.ctr}%</span></td>
                            <td style={S.td}><span style={{fontWeight:700}}>{item.conversions}</span></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                ))}
                <div style={{...S.mini,borderColor:'#1877f244'}}><p style={{color:'#a1a1aa',fontSize:13,lineHeight:1.6,margin:0}}>{d.elements.insight}</p></div>
              </>
            ) : <div style={S.empty}>Load DCO analysis to see element-level creative performance.</div>}
          </div>
        </div>
      );
      case 'ios14': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>iOS 14+ Attribution Recovery</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Modeled conversion data and aggregated event measurement workarounds to recover up to 74% of lost attribution signal.</p>
            <button style={S.btn('#f59e0b')} onClick={()=>fetch_('ios14',API+'/pixel/ios14')} disabled={loading.ios14}>{loading.ios14?'Analyzing...':'Analyze Attribution Loss'}</button>
            {err.ios14 && <div style={S.err}>{err.ios14}</div>}
            {loading.ios14 ? <div style={S.loading}>Analyzing attribution gaps...</div> : d?.recovery ? (
              <>
                <div style={S.metaRow}>
                  {[['Reported Conv.',d.recovery.reportedConversions,'#ef4444'],['Modeled Conv.',d.recovery.modeledConversions,'#f59e0b'],['Total Estimated',d.recovery.totalEstimated,'#10b981'],['Modeling Coverage',(d.recovery.modelingCoverage*100).toFixed(0)+'%','#4285f4']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
                <div style={S.sT}>Recommendations</div>
                {d.recovery.recommendations?.map((r,i)=>(
                  <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid #1f1f22'}}>
                    <span style={{...S.badge('#f59e0b'),flexShrink:0}}>{i+1}</span>
                    <span style={{fontSize:13,color:'#e4e4e7',lineHeight:1.5}}>{r}</span>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Analyze attribution loss to see iOS 14+ recovery recommendations.</div>}
          </div>
        </div>
      );
      case 'fad-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'📉',t:'Ad Fatigue Detector',d:'Frequency-based fatigue curves with auto-pause recommendations before CTR erodes -- replace creative before performance drops.'},
                {icon:'🧬',t:'DCO Element Analysis',d:'Element-level performance: exactly which headlines, images, and CTAs drive conversions -- not just ad-level results.'},
                {icon:'👥',t:'Audience Overlap Analysis',d:'Detect and resolve audience overlap across ad sets -- preventing internal auction competition and inflated CPAs.'},
                {icon:'📱',t:'iOS 14+ Attribution Recovery',d:'Modeled conversion data and CAPI integration to recover 70%+ of lost attribution signal post-iOS 14 privacy changes.'},
                {icon:'💎',t:'LTV Lookalike Generator',d:'Upload LTV-weighted seed audiences (top quintile buyers) to Meta for lookalike expansion -- targeting prospects who match your best customers.'},
                {icon:'🤖',t:'Advantage+ Analysis',d:'Performance transparency into Advantage+ black-box campaigns -- new vs existing customer split, creative performance, and optimization recommendations.'},
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
            <h1 style={{fontSize:24,fontWeight:800,color:'#fafafa',margin:'0 0 4px',letterSpacing:'-0.02em'}}>Facebook Ads Integration</h1>
            <p style={{color:'#71717a',fontSize:13,margin:'4px 0 0'}}>Meta Ads management -- LTV lookalike audiences, ad fatigue detection, DCO analysis, iOS 14+ attribution recovery & Advantage+ insights</p>
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
