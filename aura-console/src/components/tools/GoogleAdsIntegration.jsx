import React, { useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/google-ads-integration";

const S = {
  root: { background:'#09090b', minHeight:'100vh', color:'#fafafa', fontFamily:"'Inter',system-ui,sans-serif", padding:'28px 32px' },
  card: { background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:24, marginBottom:20 },
  mini: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:16 },
  cardTitle: { fontSize:14, fontWeight:700, color:'#fafafa', marginBottom:16, marginTop:0 },
  row: { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' },
  input: { flex:1, minWidth:180, background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:14, padding:'11px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif" },
  select: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'11px 14px', outline:'none', cursor:'pointer' },
  textarea: { width:'100%', background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'12px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif", resize:'vertical', boxSizing:'border-box' },
  btn: (bg) => ({ background:bg||'#4285f4', color:'#fff', border:'none', borderRadius:10, padding:'11px 22px', fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }),
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
  metaVal: (c) => ({ fontSize:22, fontWeight:700, color:c||'#4285f4' }),
  metaLbl: { fontSize:11, color:'#71717a', marginTop:2 },
  sT: { fontSize:12, fontWeight:700, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, marginTop:16 },
  groupNav: { display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' },
  gBtn: (a, c) => ({ background:a?c+'22':'#18181b', color:a?c:'#71717a', border:`1px solid ${a?c+'44':'#27272a'}`, borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:a?700:500, cursor:'pointer' }),
  tabStrip: { display:'flex', gap:4, marginBottom:20, flexWrap:'wrap', borderBottom:'1px solid #27272a', paddingBottom:8 },
  tBtn: (a, c) => ({ background:'none', color:a?c:'#71717a', border:'none', borderBottom:a?`2px solid ${c}`:'2px solid transparent', padding:'8px 14px', fontSize:13, fontWeight:a?700:500, cursor:'pointer', marginBottom:-9 }),
  bar: { height:6, background:'#27272a', borderRadius:3, overflow:'hidden', marginTop:4 },
  fill: (pct, c) => ({ height:'100%', width:Math.min(pct||0,100)+'%', background:c||'#4285f4', borderRadius:3 }),
  pre: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, padding:16, fontSize:12, color:'#a1a1aa', fontFamily:'monospace', whiteSpace:'pre-wrap', maxHeight:280, overflow:'auto', marginBottom:12 },
};

const GROUPS = [
  {
    "id": "campaigns",
    "label": "Campaigns",
    "color": "#4285f4",
    "tabs": [
      {
        "id": "camp-list",
        "label": "Campaigns"
      },
      {
        "id": "ad-groups",
        "label": "Ad Groups"
      },
      {
        "id": "ads",
        "label": "Ads"
      },
      {
        "id": "extensions",
        "label": "Extensions"
      },
      {
        "id": "camp-perf",
        "label": "Performance"
      },
      {
        "id": "camp-ai",
        "label": "AI Optimize"
      }
    ]
  },
  {
    "id": "keywords",
    "label": "Keywords",
    "color": "#34a853",
    "tabs": [
      {
        "id": "kw-list",
        "label": "Keywords"
      },
      {
        "id": "search-terms",
        "label": "Search Terms"
      },
      {
        "id": "negatives",
        "label": "Negatives"
      },
      {
        "id": "kw-mining",
        "label": "AI Mining"
      },
      {
        "id": "cannibalize",
        "label": "Cannibalization"
      },
      {
        "id": "quality-score",
        "label": "Quality Score"
      }
    ]
  },
  {
    "id": "bidding",
    "label": "Bidding",
    "color": "#fbbc05",
    "tabs": [
      {
        "id": "bid-strategy",
        "label": "Strategies"
      },
      {
        "id": "bid-sim",
        "label": "Simulator"
      },
      {
        "id": "roas-targets",
        "label": "ROAS Targets"
      },
      {
        "id": "markowitz",
        "label": "Markowitz Alloc"
      },
      {
        "id": "ltv-bids",
        "label": "LTV Bidding"
      },
      {
        "id": "schedule",
        "label": "Ad Schedule"
      }
    ]
  },
  {
    "id": "audiences",
    "label": "Audiences",
    "color": "#ea4335",
    "tabs": [
      {
        "id": "audience-list",
        "label": "Audiences"
      },
      {
        "id": "lookalike",
        "label": "Lookalike"
      },
      {
        "id": "remarketing",
        "label": "Remarketing"
      },
      {
        "id": "customer-match",
        "label": "Customer Match"
      },
      {
        "id": "in-market",
        "label": "In-Market"
      },
      {
        "id": "audience-perf",
        "label": "Performance"
      }
    ]
  },
  {
    "id": "creative",
    "label": "Creative",
    "color": "#4285f4",
    "tabs": [
      {
        "id": "rsa-builder",
        "label": "RSA Builder"
      },
      {
        "id": "rsa-perf",
        "label": "RSA Performance"
      },
      {
        "id": "asset-groups",
        "label": "Asset Groups"
      },
      {
        "id": "ad-preview",
        "label": "Ad Preview"
      },
      {
        "id": "copy-gen",
        "label": "AI Copy Gen"
      },
      {
        "id": "creative-ai",
        "label": "AI Insights"
      }
    ]
  },
  {
    "id": "intelligence",
    "label": "Intelligence",
    "color": "#34a853",
    "tabs": [
      {
        "id": "auction-insights",
        "label": "Auction Insights"
      },
      {
        "id": "competitor-kw",
        "label": "Competitor KW"
      },
      {
        "id": "incrementality",
        "label": "Incrementality"
      },
      {
        "id": "search-impression",
        "label": "Impression Share"
      },
      {
        "id": "wasted-spend",
        "label": "Wasted Spend"
      },
      {
        "id": "opportunities",
        "label": "Opportunities"
      }
    ]
  },
  {
    "id": "gai-adv",
    "label": "Advanced",
    "color": "#fbbc05",
    "tabs": [
      {
        "id": "budget-alloc",
        "label": "Budget Alloc"
      },
      {
        "id": "conversion-setup",
        "label": "Conversions"
      },
      {
        "id": "gai-integrations",
        "label": "Integrations"
      },
      {
        "id": "gai-reports",
        "label": "Reports"
      },
      {
        "id": "gai-settings",
        "label": "Settings"
      },
      {
        "id": "gai-world",
        "label": "World-Class"
      }
    ]
  }
];

export default function GoogleAdsIntegration() {
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
      case 'camp-list': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Campaign Overview</div>
            <div style={S.row}>
              <button style={S.btn('#4285f4')} onClick={()=>fetch_('camp-list',API+'/campaigns/list')} disabled={loading['camp-list']}>{loading['camp-list']?'Loading...':'Load Campaigns'}</button>
              <button style={S.btn('#34a853')} onClick={()=>fetch_('wasted-spend',API+'/intelligence/wasted-spend')}>Find Wasted Spend</button>
              <button style={S.btn('#10b981')} onClick={()=>toast_('AI optimization running...')}>AI Optimize</button>
            </div>
            {err['camp-list'] && <div style={S.err}>{err['camp-list']}</div>}
            {loading['camp-list'] ? <div style={S.loading}>Loading campaigns...</div> : d?.campaigns?.length ? (
              <div style={{overflowX:'auto'}}>
                <table style={S.tbl}>
                  <thead><tr><th style={S.th}>Campaign</th><th style={S.th}>Type</th><th style={S.th}>Spend</th><th style={S.th}>ROAS</th><th style={S.th}>Conv.</th><th style={S.th}>CPC</th><th style={S.th}>CTR</th><th style={S.th}>Status</th></tr></thead>
                  <tbody>{d.campaigns.map((c,i)=>(
                    <tr key={i} style={i%2?S.trOdd:{}}>
                      <td style={S.td}><span style={{fontWeight:600,fontSize:13}}>{c.name}</span></td>
                      <td style={S.td}><span style={{color:'#71717a',fontSize:11}}>{c.type}</span></td>
                      <td style={S.td}><span style={{fontWeight:700}}>${c.spend}</span></td>
                      <td style={S.td}><span style={{fontWeight:700,color:c.roas>=3?'#10b981':c.roas>=2?'#f59e0b':'#ef4444'}}>{c.roas}x</span></td>
                      <td style={S.td}>{c.conversions}</td>
                      <td style={S.td}>${c.cpc}</td>
                      <td style={S.td}>{c.ctr}%</td>
                      <td style={S.td}><span style={S.badge(c.status==='enabled'?'#10b981':'#f59e0b')}>{c.status}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <div style={S.empty}>Load campaigns to see your Google Ads performance.</div>}
          </div>
        </div>
      );
      case 'kw-mining': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>AI Search Term Mining</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>NLP clustering of search terms finds new keyword opportunities and negative keyword candidates — reducing wasted spend while expanding reach.</p>
            <div style={S.row}>
              <input style={S.input} placeholder="Seed keywords or product category..." value={q['kw-mining']||''} onChange={e=>setQ(p=>({...p,'kw-mining':e.target.value}))} />
              <select style={S.select} value={form.model||'gpt-4o-mini'} onChange={e=>setForm(p=>({...p,model:e.target.value}))}>
                <option value="gpt-4o-mini">Mini (2 credits)</option>
                <option value="gpt-4o">GPT-4o (4 credits)</option>
              </select>
              <button style={S.btn('#34a853')} onClick={()=>fetch_('kw-mining',API+'/keywords/ai-mining',{query:q['kw-mining']})} disabled={loading['kw-mining']}>{loading['kw-mining']?'Mining...':'Mine Keywords'}</button>
            </div>
            {err['kw-mining'] && <div style={S.err}>{err['kw-mining']}</div>}
            {loading['kw-mining'] ? <div style={S.loading}>AI clustering search terms...</div> : d?.clusters?.length ? (
              <>
                {d.clusters.map((cl,i)=>(
                  <div key={i} style={{...S.mini,marginBottom:12}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                      <span style={{fontWeight:700,color:'#fafafa'}}>{cl.theme}</span>
                      <div style={{display:'flex',gap:6}}>
                        <span style={S.badge('#4285f4')}>{cl.volume?.toLocaleString()} vol</span>
                        <span style={S.badge(cl.opportunity==='high'||cl.opportunity==='very high'?'#10b981':'#f59e0b')}>{cl.opportunity} opp</span>
                        <span style={S.badge('#a855f7')}>{cl.intent}</span>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
                      {cl.keywords?.map((kw,j)=><span key={j} style={{...S.badge('#3f3f46'),fontSize:11,padding:'3px 7px'}}>{kw}</span>)}
                    </div>
                    <div style={{fontSize:12,color:'#10b981',fontStyle:'italic'}}>{cl.action}</div>
                  </div>
                ))}
                {d.negativesSuggested?.length > 0 && (
                  <div style={{...S.mini,borderColor:'#ef444433'}}>
                    <div style={{fontWeight:700,color:'#ef4444',marginBottom:8}}>Suggested Negatives</div>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                      {d.negativesSuggested.map((n,i)=><span key={i} style={{...S.badge('#ef4444'),fontSize:11}}>{n}</span>)}
                    </div>
                  </div>
                )}
              </>
            ) : <div style={S.empty}>Enter seed keywords to discover new opportunities via AI mining.</div>}
          </div>
        </div>
      );
      case 'markowitz': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Markowitz Budget Allocation</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Mean-variance optimization across campaigns maximizes portfolio ROAS at a given risk tolerance -- same methodology as Modern Portfolio Theory in finance.</p>
            <div style={S.row}>
              <input style={S.input} placeholder="Total monthly budget..." value={q.markowitz||''} onChange={e=>setQ(p=>({...p,markowitz:e.target.value}))} />
              <button style={S.btn('#fbbc05')} onClick={()=>fetch_('markowitz',API+'/bidding/markowitz',{budget:q.markowitz})} disabled={loading.markowitz}>{loading.markowitz?'Optimizing...':'Run Markowitz'}</button>
            </div>
            {err.markowitz && <div style={S.err}>{err.markowitz}</div>}
            {loading.markowitz ? <div style={S.loading}>Running portfolio optimization...</div> : d?.allocation ? (
              <>
                <div style={{...S.mini,marginBottom:16,borderColor:'#fbbc0544'}}>
                  <div style={{fontSize:12,color:'#fbbc05',fontWeight:700,marginBottom:4}}>Method: {d.allocation.method}</div>
                  <div style={{color:'#10b981',fontWeight:700}}>Projected ROAS lift: {d.allocation.projectedRoasLift}</div>
                </div>
                <div style={{overflowX:'auto'}}>
                  <table style={S.tbl}>
                    <thead><tr><th style={S.th}>Campaign</th><th style={S.th}>Current</th><th style={S.th}>Recommended</th><th style={S.th}>ROAS</th><th style={S.th}>Risk</th><th style={S.th}>Allocation</th></tr></thead>
                    <tbody>{d.allocation.campaigns?.map((c,i)=>(
                      <tr key={i} style={i%2?S.trOdd:{}}>
                        <td style={S.td}><span style={{fontWeight:600}}>{c.name}</span></td>
                        <td style={S.td}>${c.currentBudget}</td>
                        <td style={S.td}><span style={{fontWeight:700,color:c.recommendedBudget>c.currentBudget?'#10b981':'#f59e0b'}}>${c.recommendedBudget}</span></td>
                        <td style={S.td}><span style={{fontWeight:700,color:c.roas>=4?'#10b981':c.roas>=2.5?'#f59e0b':'#ef4444'}}>{c.roas}x</span></td>
                        <td style={S.td}><span style={{color:c.risk>0.4?'#ef4444':c.risk>0.25?'#f59e0b':'#10b981'}}>{(c.risk*100).toFixed(0)}%</span></td>
                        <td style={S.td}><div style={S.bar}><div style={S.fill(c.allocation,'#fbbc05')} /></div><span style={{fontSize:11,color:'#71717a'}}>{c.allocation}%</span></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </>
            ) : <div style={S.empty}>Enter your total budget and run Markowitz allocation to optimize spend.</div>}
          </div>
        </div>
      );
      case 'auction-insights': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Auction Insights</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Competitive intelligence: impression share, overlap rate, and outranking share vs your named competitors.</p>
            <button style={S.btn('#34a853')} onClick={()=>fetch_('auction-insights',API+'/intelligence/auction-insights')} disabled={loading['auction-insights']}>{loading['auction-insights']?'Loading...':'Load Auction Insights'}</button>
            {err['auction-insights'] && <div style={S.err}>{err['auction-insights']}</div>}
            {loading['auction-insights'] ? <div style={S.loading}>Loading competitive data...</div> : d?.competitors?.length ? (
              <div style={{overflowX:'auto',marginTop:16}}>
                <table style={S.tbl}>
                  <thead><tr><th style={S.th}>Competitor</th><th style={S.th}>Impr. Share</th><th style={S.th}>Overlap Rate</th><th style={S.th}>Outranked</th><th style={S.th}>Pos. Above</th><th style={S.th}>Top IS</th></tr></thead>
                  <tbody>{d.competitors.map((c,i)=>(
                    <tr key={i} style={i%2?S.trOdd:{}}>
                      <td style={S.td}><span style={{fontWeight:700,color:c.name==='You'?'#4285f4':'#fafafa'}}>{c.name}</span></td>
                      <td style={S.td}><span style={{fontWeight:c.name==='You'?700:400,color:c.name==='You'?'#10b981':'#fafafa'}}>{c.impressionShare}%</span></td>
                      <td style={S.td}>{c.overlapRate!=null?c.overlapRate+'%':'--'}</td>
                      <td style={S.td}>{c.outrankedShare!=null?c.outrankedShare+'%':'--'}</td>
                      <td style={S.td}>{c.posAbove!=null?c.posAbove+'%':'--'}</td>
                      <td style={S.td}><span style={{fontWeight:700}}>{c.topImprShare}%</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <div style={S.empty}>Load auction insights to see your competitive position.</div>}
          </div>
        </div>
      );
      case 'rsa-builder': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Responsive Search Ad Builder</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>AI generates 15 headlines and 4 descriptions with predicted CTR. Pin key assets for brand consistency.</p>
            <div style={S.row}>
              <input style={S.input} placeholder="Keywords or product..." value={q['rsa-builder']||''} onChange={e=>setQ(p=>({...p,'rsa-builder':e.target.value}))} />
              <button style={S.btn('#4285f4')} onClick={()=>fetch_('rsa-builder',API+'/creative/rsa-builder',{keywords:q['rsa-builder']})} disabled={loading['rsa-builder']}>{loading['rsa-builder']?'Generating...':'Generate RSA'}</button>
            </div>
            {err['rsa-builder'] && <div style={S.err}>{err['rsa-builder']}</div>}
            {loading['rsa-builder'] ? <div style={S.loading}>AI writing your RSA...</div> : d?.rsa ? (
              <>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
                  <span style={S.badge('#10b981')}>Ad Strength: {d.rsa.score}</span>
                  <span style={{fontSize:12,color:'#71717a'}}>Credits used: {d.rsa.creditsUsed}</span>
                </div>
                <div style={S.sT}>Headlines (15)</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:16}}>
                  {d.rsa.headlines?.map((h,i)=>(
                    <span key={i} style={{background:'#18181b',border:'1px solid #27272a',borderRadius:6,padding:'4px 10px',fontSize:12,color:'#fafafa'}}>{h}</span>
                  ))}
                </div>
                <div style={S.sT}>Descriptions (4)</div>
                {d.rsa.descriptions?.map((desc,i)=>(
                  <div key={i} style={{...S.mini,marginBottom:8,fontSize:12,color:'#a1a1aa',lineHeight:1.6}}>{desc}</div>
                ))}
              </>
            ) : <div style={S.empty}>Enter keywords to generate your Responsive Search Ad.</div>}
          </div>
        </div>
      );
      case 'gai-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'📊',t:'Markowitz Budget Allocation',d:'Mean-variance portfolio optimization across campaigns -- maximize ROAS at your target risk level using Modern Portfolio Theory.'},
                {icon:'🔍',t:'AI Search Term Mining',d:'NLP clustering of search terms discovers new keyword themes and negative keyword candidates -- reducing waste while expanding reach.'},
                {icon:'🏆',t:'Quality Score Optimizer',d:'Specific recommendations per keyword to improve Ad Relevance, Expected CTR, and Landing Page Experience scores.'},
                {icon:'🎯',t:'Incrementality Testing',d:'Ghost ad holdout test design for true incremental measurement -- know exactly what revenue disappears without paid search.'},
                {icon:'🔬',t:'Auction Insights AI',d:'Competitive impression share, overlap rate, and outranking analysis vs named competitors with actionable bid recommendations.'},
                {icon:'✍️',t:'RSA Copy Generator',d:'AI writes 15 headlines + 4 descriptions per RSA with predicted CTR scores and ad strength ratings.'},
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
            <h1 style={{fontSize:24,fontWeight:800,color:'#fafafa',margin:'0 0 4px',letterSpacing:'-0.02em'}}>Google Ads Integration</h1>
            <p style={{color:'#71717a',fontSize:13,margin:'4px 0 0'}}>Google Ads intelligence -- Markowitz budget allocation, AI search term mining, RSA builder, auction insights & incrementality testing</p>
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
