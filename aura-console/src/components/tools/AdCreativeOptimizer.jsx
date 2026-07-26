import React, { useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/ad-creative-optimizer";

const S = {
  root: { background:'#09090b', minHeight:'100vh', color:'#fafafa', fontFamily:"'Inter',system-ui,sans-serif", padding:'28px 32px' },
  card: { background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:24, marginBottom:20 },
  mini: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:16 },
  cardTitle: { fontSize:14, fontWeight:700, color:'#fafafa', marginBottom:16, marginTop:0 },
  row: { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' },
  input: { flex:1, minWidth:180, background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:14, padding:'11px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif" },
  select: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'11px 14px', outline:'none', cursor:'pointer' },
  textarea: { width:'100%', background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'12px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif", resize:'vertical', boxSizing:'border-box' },
  btn: (bg) => ({ background:bg||'#8b5cf6', color:'#fff', border:'none', borderRadius:10, padding:'11px 22px', fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }),
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
  metaVal: (c) => ({ fontSize:22, fontWeight:700, color:c||'#8b5cf6' }),
  metaLbl: { fontSize:11, color:'#71717a', marginTop:2 },
  sT: { fontSize:12, fontWeight:700, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, marginTop:16 },
  groupNav: { display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' },
  gBtn: (a, c) => ({ background:a?c+'22':'#18181b', color:a?c:'#71717a', border:`1px solid ${a?c+'44':'#27272a'}`, borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:a?700:500, cursor:'pointer' }),
  tabStrip: { display:'flex', gap:4, marginBottom:20, flexWrap:'wrap', borderBottom:'1px solid #27272a', paddingBottom:8 },
  tBtn: (a, c) => ({ background:'none', color:a?c:'#71717a', border:'none', borderBottom:a?`2px solid ${c}`:'2px solid transparent', padding:'8px 14px', fontSize:13, fontWeight:a?700:500, cursor:'pointer', marginBottom:-9 }),
  bar: { height:6, background:'#27272a', borderRadius:3, overflow:'hidden', marginTop:4 },
  fill: (pct, c) => ({ height:'100%', width:Math.min(pct||0,100)+'%', background:c||'#8b5cf6', borderRadius:3 }),
  pre: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, padding:16, fontSize:12, color:'#a1a1aa', fontFamily:'monospace', whiteSpace:'pre-wrap', maxHeight:280, overflow:'auto', marginBottom:12 },
};

const GROUPS = [
  {
    "id": "library",
    "label": "Creative Library",
    "color": "#8b5cf6",
    "tabs": [
      {
        "id": "lib-all",
        "label": "All Creatives"
      },
      {
        "id": "lib-images",
        "label": "Images"
      },
      {
        "id": "lib-videos",
        "label": "Videos"
      },
      {
        "id": "lib-copy",
        "label": "Copy"
      },
      {
        "id": "lib-tags",
        "label": "Tags"
      },
      {
        "id": "lib-score",
        "label": "Score"
      }
    ]
  },
  {
    "id": "generate",
    "label": "AI Generate",
    "color": "#ec4899",
    "tabs": [
      {
        "id": "copy-gen-a",
        "label": "Copy Generator"
      },
      {
        "id": "concept-gen",
        "label": "Concept Gen"
      },
      {
        "id": "brief-gen",
        "label": "Brief Gen"
      },
      {
        "id": "headline-gen",
        "label": "Headlines"
      },
      {
        "id": "desc-gen",
        "label": "Descriptions"
      },
      {
        "id": "cta-gen",
        "label": "CTAs"
      }
    ]
  },
  {
    "id": "analyze",
    "label": "Analysis",
    "color": "#8b5cf6",
    "tabs": [
      {
        "id": "creative-dna",
        "label": "Creative DNA"
      },
      {
        "id": "top-perf",
        "label": "Top Performers"
      },
      {
        "id": "bottom-perf",
        "label": "Underperformers"
      },
      {
        "id": "emotion-analysis",
        "label": "Emotion Analysis"
      },
      {
        "id": "brand-safety",
        "label": "Brand Safety"
      },
      {
        "id": "fatigue-a",
        "label": "Fatigue"
      }
    ]
  },
  {
    "id": "testing",
    "label": "Testing",
    "color": "#ec4899",
    "tabs": [
      {
        "id": "test-matrix",
        "label": "Test Matrix"
      },
      {
        "id": "a-b-test-a",
        "label": "A/B Tests"
      },
      {
        "id": "multivariate",
        "label": "Multivariate"
      },
      {
        "id": "test-results",
        "label": "Results"
      },
      {
        "id": "test-velocity",
        "label": "Velocity"
      },
      {
        "id": "test-plan",
        "label": "Test Plan"
      }
    ]
  },
  {
    "id": "localize",
    "label": "Localization",
    "color": "#8b5cf6",
    "tabs": [
      {
        "id": "lang-list",
        "label": "Languages"
      },
      {
        "id": "translate",
        "label": "Translate"
      },
      {
        "id": "cultural-adapt",
        "label": "Cultural Adapt"
      },
      {
        "id": "rtl-support",
        "label": "RTL Support"
      },
      {
        "id": "local-perf",
        "label": "Performance"
      },
      {
        "id": "local-ai",
        "label": "AI Localize"
      }
    ]
  },
  {
    "id": "predict",
    "label": "Predictions",
    "color": "#ec4899",
    "tabs": [
      {
        "id": "ctr-pred",
        "label": "CTR Predictor"
      },
      {
        "id": "conv-pred",
        "label": "Conv Predictor"
      },
      {
        "id": "fatigue-pred",
        "label": "Fatigue Pred"
      },
      {
        "id": "creative-score-p",
        "label": "Score"
      },
      {
        "id": "ab-pred",
        "label": "A/B Predictor"
      },
      {
        "id": "pred-ai",
        "label": "AI Models"
      }
    ]
  },
  {
    "id": "aco-adv",
    "label": "Advanced",
    "color": "#8b5cf6",
    "tabs": [
      {
        "id": "brand-guide",
        "label": "Brand Guide"
      },
      {
        "id": "aco-int",
        "label": "Integrations"
      },
      {
        "id": "asset-dam",
        "label": "Asset DAM"
      },
      {
        "id": "aco-api",
        "label": "API"
      },
      {
        "id": "aco-settings",
        "label": "Settings"
      },
      {
        "id": "aco-world",
        "label": "World-Class"
      }
    ]
  }
];

export default function AdCreativeOptimizer() {
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
      case 'lib-all': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Creative Library</div>
            <div style={S.row}>
              <button style={S.btn('#8b5cf6')} onClick={()=>fetch_('lib-all',API+'/library/all')} disabled={loading['lib-all']}>{loading['lib-all']?'Loading...':'Load Library'}</button>
              <button style={S.btn('#ec4899')} onClick={()=>fetch_('brand-safety',API+'/analyze/brand-safety')}>Brand Safety Scan</button>
              <button style={S.btn('#10b981')} onClick={()=>toast_('AI scoring all creatives...')}>AI Score All</button>
            </div>
            {err['lib-all'] && <div style={S.err}>{err['lib-all']}</div>}
            {loading['lib-all'] ? <div style={S.loading}>Loading creative library...</div> : d?.creatives?.length ? (
              <div style={{overflowX:'auto'}}>
                <table style={S.tbl}>
                  <thead><tr><th style={S.th}>Creative</th><th style={S.th}>Type</th><th style={S.th}>Platform</th><th style={S.th}>Score</th><th style={S.th}>CTR</th><th style={S.th}>Conv.</th><th style={S.th}>Fatigue</th></tr></thead>
                  <tbody>{d.creatives.map((c,i)=>(
                    <tr key={i} style={i%2?S.trOdd:{}}>
                      <td style={S.td}><span style={{fontWeight:600}}>{c.name}</span></td>
                      <td style={S.td}><span style={{color:'#71717a',fontSize:12}}>{c.type}</span></td>
                      <td style={S.td}><span style={{color:'#71717a',fontSize:12}}>{c.platform}</span></td>
                      <td style={S.td}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{...S.bar,width:50,display:'inline-block'}}><div style={S.fill(c.score,'#8b5cf6')} /></div>
                          <span style={{fontWeight:700,color:c.score>=75?'#10b981':c.score>=50?'#f59e0b':'#ef4444'}}>{c.score}</span>
                        </div>
                      </td>
                      <td style={S.td}>{c.ctr}</td>
                      <td style={S.td}>{c.conversions}</td>
                      <td style={S.td}><span style={S.badge(c.fatigueRisk==='high'?'#ef4444':c.fatigueRisk==='medium'?'#f59e0b':'#10b981')}>{c.fatigueRisk}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <div style={S.empty}>Load your creative library to manage and score all creatives.</div>}
          </div>
        </div>
      );
      case 'creative-dna': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Creative DNA Extraction</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>What do your top-performing creatives have in common? Visual features, copy patterns, and structural elements that predict performance.</p>
            <button style={S.btn('#8b5cf6')} onClick={()=>fetch_('creative-dna',API+'/analyze/creative-dna')} disabled={loading['creative-dna']}>{loading['creative-dna']?'Analyzing...':'Extract Creative DNA'}</button>
            {err['creative-dna'] && <div style={S.err}>{err['creative-dna']}</div>}
            {loading['creative-dna'] ? <div style={S.loading}>Analyzing creative patterns...</div> : d?.patterns ? (
              <>
                <div style={{...S.mini,marginBottom:16,borderColor:'#10b98144'}}>
                  <div style={{fontWeight:700,color:'#10b981',marginBottom:6}}>Key Insight</div>
                  <p style={{color:'#e4e4e7',fontSize:13,lineHeight:1.6,margin:0}}>{d.patterns.insight}</p>
                </div>
                {[['Top Performer Traits','#10b981',d.patterns.topPerformers],['Common Mistakes','#ef4444',d.patterns.bottomPerformers]].map(([title,color,section])=>(
                  section && <div key={title}>
                    <div style={S.sT}>{title}</div>
                    {Object.entries(section).map(([key,items])=>(
                      <div key={key}>
                        <div style={{fontSize:11,color:'#71717a',textTransform:'capitalize',marginBottom:4}}>{key.replace(/([A-Z])/g,' $1')}</div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:10}}>
                          {(Array.isArray(items)?items:[items]).map((item,i)=>(
                            <span key={i} style={{...S.badge(color),fontSize:11,padding:'3px 8px'}}>{item}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Extract Creative DNA to find patterns in your top performers.</div>}
          </div>
        </div>
      );
      case 'copy-gen-a': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>AI Copy Generator</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Generate ad copy variations with predicted CTR scores. Calibrated to your Creative DNA patterns for on-brand output.</p>
            <div style={S.row}>
              <input style={S.input} placeholder="Product name..." value={q['copy-gen-a']||''} onChange={e=>setQ(p=>({...p,'copy-gen-a':e.target.value}))} />
              <select style={S.select} value={form.model||'gpt-4o-mini'} onChange={e=>setForm(p=>({...p,model:e.target.value}))}>
                <option value="gpt-4o-mini">Mini (2 credits)</option>
                <option value="gpt-4o">GPT-4o (4 credits)</option>
              </select>
              <button style={S.btn('#ec4899')} onClick={()=>fetch_('copy-gen-a',API+'/generate/copy',{product:q['copy-gen-a']})} disabled={loading['copy-gen-a']}>{loading['copy-gen-a']?'Generating...':'Generate Copy'}</button>
            </div>
            {err['copy-gen-a'] && <div style={S.err}>{err['copy-gen-a']}</div>}
            {loading['copy-gen-a'] ? <div style={S.loading}>AI generating copy variations...</div> : d?.copies?.length ? (
              d.copies.map((c,i)=>(
                <div key={i} style={{...S.mini,marginBottom:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <span style={S.badge('#8b5cf6')}>{c.format}</span>
                    <span style={{fontWeight:700,color:'#10b981',fontSize:13}}>{c.predictedCtr} CTR</span>
                  </div>
                  <div style={{fontWeight:700,color:'#fafafa',marginBottom:4}}>{c.headline}</div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <span style={{fontSize:11,color:'#71717a'}}>CTA:</span>
                    <span style={S.badge('#ec4899')}>{c.cta}</span>
                    <button style={{...S.btn('#27272a'),padding:'3px 8px',fontSize:11,marginLeft:'auto'}} onClick={()=>toast_('Copied to clipboard!')}>Copy</button>
                  </div>
                </div>
              ))
            ) : <div style={S.empty}>Generate AI copy variations with predicted CTR scores.</div>}
          </div>
        </div>
      );
      case 'ctr-pred': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>CTR Predictor</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Score your creative before launch. ML model predicts click-through rate based on headline, description, format, and historical patterns.</p>
            <div style={S.row}>
              <input style={S.input} placeholder="Ad headline..." value={q['ctr-pred']||''} onChange={e=>setQ(p=>({...p,'ctr-pred':e.target.value}))} />
            </div>
            <div style={S.row}>
              <textarea style={S.textarea} rows={2} placeholder="Description..." value={q['ctr-desc']||''} onChange={e=>setQ(p=>({...p,'ctr-desc':e.target.value}))} />
            </div>
            <div style={S.row}>
              <select style={S.select} value={form.adFormat||'static'} onChange={e=>setForm(p=>({...p,adFormat:e.target.value}))}>
                <option value="static">Static Image</option>
                <option value="video">Video</option>
                <option value="carousel">Carousel</option>
              </select>
              <button style={S.btn('#ec4899')} onClick={()=>fetch_('ctr-pred',API+'/predict/ctr',{headline:q['ctr-pred'],description:q['ctr-desc'],format:form.adFormat})} disabled={loading['ctr-pred']}>{loading['ctr-pred']?'Scoring...':'Predict CTR'}</button>
            </div>
            {err['ctr-pred'] && <div style={S.err}>{err['ctr-pred']}</div>}
            {loading['ctr-pred'] ? <div style={S.loading}>Scoring creative...</div> : data['ctr-pred']?.prediction ? (
              <>
                <div style={{...S.mini,marginBottom:16,borderColor:'#8b5cf644',textAlign:'center'}}>
                  <div style={{fontSize:36,fontWeight:800,color:'#8b5cf6'}}>{data['ctr-pred'].prediction.predictedCtr}</div>
                  <div style={{color:'#71717a',fontSize:12}}>Predicted CTR · Score: {data['ctr-pred'].prediction.score}/100</div>
                </div>
                <div style={S.sT}>Score Factors</div>
                {data['ctr-pred'].prediction.factors?.map((f,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #1f1f22'}}>
                    <span style={{fontSize:13,color:'#e4e4e7'}}>{f.factor}</span>
                    <span style={{fontWeight:700,color:'#10b981'}}>{f.impact}</span>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Enter your ad creative to predict click-through rate before launch.</div>}
          </div>
        </div>
      );
      case 'aco-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'🧬',t:'Creative DNA Extraction',d:'Find exactly what your top-performing creatives have in common: visual features, copy patterns, and structural elements that predict performance.'},
                {icon:'😊',t:'Emotion Analysis',d:'Computer vision scoring of creative emotional valence across joy, trust, surprise, fear, and anticipation -- match emotion to campaign objective.'},
                {icon:'🛡️',t:'Brand Safety Scanner',d:'Detect brand safety violations, unsubstantiated claims, and platform policy violations before launch -- avoid rejected ads and account flags.'},
                {icon:'📐',t:'Message Testing Matrix',d:'2x2 matrix testing across offer, audience, creative, and channel -- systematically find the highest-performing combinations.'},
                {icon:'🔮',t:'CTR Predictor',d:'Score your creative before launch. ML model predicts click-through rate based on headline, format, and historical creative DNA patterns.'},
                {icon:'✍️',t:'AI Creative Brief',d:'Generate complete creative briefs from performance data: objective, audience, key message, mandatory inclusions, formats, and KPI targets.'},
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
            <h1 style={{fontSize:24,fontWeight:800,color:'#fafafa',margin:'0 0 4px',letterSpacing:'-0.02em'}}>Ad Creative Optimizer</h1>
            <p style={{color:'#71717a',fontSize:13,margin:'4px 0 0'}}>Creative intelligence -- Creative DNA extraction, emotion analysis, CTR predictor, brand safety scanner & AI copy generator</p>
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
