import React, { useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/tiktok-ads-integration";

const S = {
  root: { background:'#09090b', minHeight:'100vh', color:'#fafafa', fontFamily:"'Inter',system-ui,sans-serif", padding:'28px 32px' },
  card: { background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:24, marginBottom:20 },
  mini: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:16 },
  cardTitle: { fontSize:14, fontWeight:700, color:'#fafafa', marginBottom:16, marginTop:0 },
  row: { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' },
  input: { flex:1, minWidth:180, background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:14, padding:'11px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif" },
  select: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'11px 14px', outline:'none', cursor:'pointer' },
  textarea: { width:'100%', background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'12px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif", resize:'vertical', boxSizing:'border-box' },
  btn: (bg) => ({ background:bg||'#fe2c55', color:'#fff', border:'none', borderRadius:10, padding:'11px 22px', fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }),
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
  metaVal: (c) => ({ fontSize:22, fontWeight:700, color:c||'#fe2c55' }),
  metaLbl: { fontSize:11, color:'#71717a', marginTop:2 },
  sT: { fontSize:12, fontWeight:700, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, marginTop:16 },
  groupNav: { display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' },
  gBtn: (a, c) => ({ background:a?c+'22':'#18181b', color:a?c:'#71717a', border:`1px solid ${a?c+'44':'#27272a'}`, borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:a?700:500, cursor:'pointer' }),
  tabStrip: { display:'flex', gap:4, marginBottom:20, flexWrap:'wrap', borderBottom:'1px solid #27272a', paddingBottom:8 },
  tBtn: (a, c) => ({ background:'none', color:a?c:'#71717a', border:'none', borderBottom:a?`2px solid ${c}`:'2px solid transparent', padding:'8px 14px', fontSize:13, fontWeight:a?700:500, cursor:'pointer', marginBottom:-9 }),
  bar: { height:6, background:'#27272a', borderRadius:3, overflow:'hidden', marginTop:4 },
  fill: (pct, c) => ({ height:'100%', width:Math.min(pct||0,100)+'%', background:c||'#fe2c55', borderRadius:3 }),
  pre: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, padding:16, fontSize:12, color:'#a1a1aa', fontFamily:'monospace', whiteSpace:'pre-wrap', maxHeight:280, overflow:'auto', marginBottom:12 },
};

const GROUPS = [
  {
    "id": "campaigns-t",
    "label": "Campaigns",
    "color": "#fe2c55",
    "tabs": [
      {
        "id": "tik-camps",
        "label": "Campaigns"
      },
      {
        "id": "tik-adgroups",
        "label": "Ad Groups"
      },
      {
        "id": "tik-ads",
        "label": "Ads"
      },
      {
        "id": "tik-perf",
        "label": "Performance"
      },
      {
        "id": "tik-budget",
        "label": "Budget"
      },
      {
        "id": "tik-ai",
        "label": "AI Optimize"
      }
    ]
  },
  {
    "id": "creative-t",
    "label": "Creative",
    "color": "#25f4ee",
    "tabs": [
      {
        "id": "spark-ads",
        "label": "Spark Ads"
      },
      {
        "id": "hook-analyzer",
        "label": "Hook Analyzer"
      },
      {
        "id": "video-perf",
        "label": "Video Performance"
      },
      {
        "id": "thumb-opt",
        "label": "Thumbnail"
      },
      {
        "id": "creative-gen-t",
        "label": "AI Creative"
      },
      {
        "id": "ugc",
        "label": "UGC Creators"
      }
    ]
  },
  {
    "id": "audiences-t",
    "label": "Audiences",
    "color": "#fe2c55",
    "tabs": [
      {
        "id": "tik-custom",
        "label": "Custom"
      },
      {
        "id": "tik-look",
        "label": "Lookalike"
      },
      {
        "id": "tik-interest",
        "label": "Interest"
      },
      {
        "id": "genz-intel",
        "label": "Gen Z Intel"
      },
      {
        "id": "tik-retarget",
        "label": "Retargeting"
      },
      {
        "id": "tik-aud-perf",
        "label": "Performance"
      }
    ]
  },
  {
    "id": "tiktokseo",
    "label": "TikTok SEO",
    "color": "#25f4ee",
    "tabs": [
      {
        "id": "caption-opt",
        "label": "Caption Opt"
      },
      {
        "id": "hashtag",
        "label": "Hashtags"
      },
      {
        "id": "trending-audio",
        "label": "Trending Audio"
      },
      {
        "id": "tik-keywords",
        "label": "Keywords"
      },
      {
        "id": "organic-perf",
        "label": "Organic Perf"
      },
      {
        "id": "tik-seo-ai",
        "label": "AI SEO"
      }
    ]
  },
  {
    "id": "shop-t",
    "label": "TikTok Shop",
    "color": "#fe2c55",
    "tabs": [
      {
        "id": "shop-attrib",
        "label": "Attribution"
      },
      {
        "id": "shop-products",
        "label": "Products"
      },
      {
        "id": "shop-creators",
        "label": "Creator Collab"
      },
      {
        "id": "shop-perf",
        "label": "Shop Perf"
      },
      {
        "id": "shop-content",
        "label": "Content"
      },
      {
        "id": "shop-ai",
        "label": "AI Insights"
      }
    ]
  },
  {
    "id": "analytics-t",
    "label": "Analytics",
    "color": "#25f4ee",
    "tabs": [
      {
        "id": "tik-attrib",
        "label": "Attribution"
      },
      {
        "id": "vta",
        "label": "View-Through"
      },
      {
        "id": "tik-funnel",
        "label": "Funnel"
      },
      {
        "id": "tik-cohort",
        "label": "Cohort"
      },
      {
        "id": "tik-bench",
        "label": "Benchmarks"
      },
      {
        "id": "tik-reports",
        "label": "Reports"
      }
    ]
  },
  {
    "id": "tik-adv",
    "label": "Advanced",
    "color": "#fe2c55",
    "tabs": [
      {
        "id": "pixel-t",
        "label": "Pixel Setup"
      },
      {
        "id": "capi-t",
        "label": "Events API"
      },
      {
        "id": "tik-int",
        "label": "Integrations"
      },
      {
        "id": "tik-api",
        "label": "API"
      },
      {
        "id": "tik-settings",
        "label": "Settings"
      },
      {
        "id": "tik-world",
        "label": "World-Class"
      }
    ]
  }
];

export default function TikTokAdsIntegration() {
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
      case 'spark-ads': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Spark Ad Amplification Engine</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Identify top-performing organic posts by engagement rate and hook score. Turn your best organic content into high-performing paid Spark Ads.</p>
            <button style={S.btn('#fe2c55')} onClick={()=>fetch_('spark-ads',API+'/creative/spark-ads')} disabled={loading['spark-ads']}>{loading['spark-ads']?'Analyzing...':'Find Spark Candidates'}</button>
            {err['spark-ads'] && <div style={S.err}>{err['spark-ads']}</div>}
            {loading['spark-ads'] ? <div style={S.loading}>Analyzing organic posts...</div> : d?.candidates?.length ? (
              <div style={{marginTop:16}}>
                {d.candidates.map((c,i)=>(
                  <div key={i} style={{...S.mini,marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
                    <div>
                      <div style={{fontWeight:600,color:'#fafafa',fontSize:13}}>{c.id}</div>
                      <div style={{fontSize:12,color:'#71717a',marginTop:2}}>{c.views?.toLocaleString()} views · {c.likes?.toLocaleString()} likes · {c.engagementRate} engagement</div>
                    </div>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:16,fontWeight:700,color:c.sparkScore>80?'#25f4ee':c.sparkScore>60?'#f59e0b':'#ef4444'}}>{c.sparkScore}</div>
                        <div style={{fontSize:10,color:'#71717a'}}>spark score</div>
                      </div>
                      {i<3&&<button style={{...S.btn('#fe2c55'),padding:'4px 12px',fontSize:11}} onClick={()=>toast_('Promoted as Spark Ad!')}>Promote</button>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <div style={S.empty}>Find Spark Ad candidates from your organic content library.</div>}
          </div>
        </div>
      );
      case 'hook-analyzer': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Creative Hook Analyzer</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Analyze the first 3 seconds of your videos for drop-off rate and hook effectiveness. The hook determines whether viewers watch or scroll.</p>
            <button style={S.btn('#25f4ee')} onClick={()=>fetch_('hook-analyzer',API+'/creative/hook-analyzer')} disabled={loading['hook-analyzer']}>{loading['hook-analyzer']?'Analyzing...':'Analyze Hooks'}</button>
            {err['hook-analyzer'] && <div style={S.err}>{err['hook-analyzer']}</div>}
            {loading['hook-analyzer'] ? <div style={S.loading}>Analyzing video hooks...</div> : d?.videos?.length ? (
              <div style={{marginTop:16}}>
                {d.videos.map((v,i)=>(
                  <div key={i} style={{...S.mini,marginBottom:10}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                      <div>
                        <span style={{fontWeight:700,color:'#fafafa'}}>{v.title}</span>
                        <span style={{...S.badge('#25f4ee'),marginLeft:8,fontSize:10}}>{v.hookType}</span>
                      </div>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:18,fontWeight:700,color:v.hookScore>75?'#25f4ee':v.hookScore>50?'#f59e0b':'#ef4444'}}>{v.hookScore}</div>
                        <div style={{fontSize:10,color:'#71717a'}}>hook score</div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:16,marginBottom:6}}>
                      <div><span style={{fontSize:11,color:'#71717a'}}>Avg watch time: </span><span style={{fontWeight:600}}>{v.avgWatchTime}</span></div>
                      <div><span style={{fontSize:11,color:'#71717a'}}>Completion: </span><span style={{fontWeight:600}}>{v.completionRate}</span></div>
                      <div><span style={{fontSize:11,color:'#71717a'}}>Drop at: </span><span style={{fontWeight:600,color:'#ef4444'}}>{v.dropOffSecond}s</span></div>
                    </div>
                    <div style={{fontSize:12,color:'#a1a1aa',fontStyle:'italic'}}>{v.recommendation}</div>
                  </div>
                ))}
              </div>
            ) : <div style={S.empty}>Analyze your video hooks to improve 3-second retention rate.</div>}
          </div>
        </div>
      );
      case 'genz-intel': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Gen Z Persona Intelligence</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Audience interest overlap with Gen Z trends, sub-cultures, and niches -- enabling authentic content strategy that resonates.</p>
            <button style={S.btn('#fe2c55')} onClick={()=>fetch_('genz-intel',API+'/audiences/genz-intel')} disabled={loading['genz-intel']}>{loading['genz-intel']?'Loading...':'Load Gen Z Intel'}</button>
            {err['genz-intel'] && <div style={S.err}>{err['genz-intel']}</div>}
            {loading['genz-intel'] ? <div style={S.loading}>Analyzing Gen Z trends...</div> : d?.insights ? (
              <>
                <div style={S.sT}>Top Interest Clusters</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
                  {d.insights.topInterests?.map((i,j)=><span key={j} style={{...S.badge('#fe2c55'),fontSize:12,padding:'4px 10px'}}>{i}</span>)}
                </div>
                <div style={S.sT}>Content Preferences</div>
                <div style={{...S.mini,marginBottom:16}}>
                  {Object.entries(d.insights.contentPreferences||{}).map(([k,v])=>(
                    <div key={k} style={{display:'flex',gap:10,padding:'6px 0',borderBottom:'1px solid #1f1f22'}}>
                      <span style={{fontSize:12,color:'#71717a',minWidth:120,textTransform:'capitalize'}}>{k.replace(/([A-Z])/g,' $1')}:</span>
                      <span style={{fontSize:12,color:'#fafafa'}}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={S.sT}>Trend Overlap Opportunities</div>
                {d.insights.trendsOverlap?.map((t,i)=>(
                  <div key={i} style={{...S.mini,marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                    <div>
                      <div style={{fontWeight:700,color:'#25f4ee',fontSize:13}}>#{t.trend}</div>
                      <div style={{fontSize:12,color:'#a1a1aa',marginTop:2}}>{t.brandFit}</div>
                    </div>
                    <span style={S.badge('#fe2c55')}>{t.overlap}% overlap</span>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Load Gen Z intelligence to find authentic content angles.</div>}
          </div>
        </div>
      );
      case 'tik-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'✨',t:'Spark Ad Amplification',d:'Identify top organic posts by engagement rate and hook score -- turn your best organic content into paid Spark Ads with one click.'},
                {icon:'🪝',t:'Creative Hook Analyzer',d:'Analyze first 3 seconds of each video for drop-off rate and hook effectiveness. Hook score predicts scroll-stop probability.'},
                {icon:'🎵',t:'Trending Audio Alignment',d:'Match ad audio to currently trending sounds for organic-feeling creative -- trending audio can increase engagement by 18-22%.'},
                {icon:'🧬',t:'Gen Z Persona Intelligence',d:'Audience interest overlap with Gen Z trends and sub-cultures -- enabling authentic content strategy that resonates with the algorithm.'},
                {icon:'🛍️',t:'TikTok Shop Attribution',d:'Full attribution for TikTok Shop sales -- which content, creators, and campaigns drive product discovery and purchase.'},
                {icon:'🔍',t:'TikTok SEO Engine',d:'Caption keyword optimization and hashtag strategy for organic discoverability -- rank in TikTok search for high-intent queries.'},
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
            <h1 style={{fontSize:24,fontWeight:800,color:'#fafafa',margin:'0 0 4px',letterSpacing:'-0.02em'}}>Tik Tok Ads Integration</h1>
            <p style={{color:'#71717a',fontSize:13,margin:'4px 0 0'}}>TikTok Ads platform -- Spark Ad amplification, hook analyzer, Gen Z persona intelligence, trending audio & TikTok Shop attribution</p>
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
