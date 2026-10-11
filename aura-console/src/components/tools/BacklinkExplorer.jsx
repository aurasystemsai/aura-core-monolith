import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { AuthorityBadge, ScoreBar, MozTabs, ErrorBox, Spinner } from "../MozUI";

const API = "/api/backlink-explorer";

// ─── helpers ─────────────────────────────────────────────────────────────────

function spamColor(score) {
  if(score <= 10) return '#10b981';
  if(score <= 30) return '#f59e0b';
  if(score <= 60) return '#f97316';
  return '#ef4444';
}
function spamLabel(score) {
  if(score <= 10) return 'Healthy';
  if(score <= 30) return 'Suspicious';
  if(score <= 60) return 'Toxic';
  return 'Dangerous';
}
function typeColor(type) {
  const m = { dofollow:'#10b981', nofollow:'#71717a', ugc:'#0ea5e9', sponsored:'#f59e0b' };
  return m[type] || '#52525b';
}

// ─── styles ──────────────────────────────────────────────────────────────────

const S = {
  root: { background:'#09090b', minHeight:'100vh', color:'#fafafa', fontFamily:"'Inter',system-ui,sans-serif", padding:'28px 32px' },
  header: { marginBottom:28 },
  title: { fontSize:24, fontWeight:800, color:'#fafafa', margin:'0 0 4px', letterSpacing:'-0.02em' },
  subtitle: { color:'#71717a', marginTop:4, fontSize:13 },
  card: { background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:24, marginBottom:20 },
  miniCard: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:16 },
  cardTitle: { fontSize:14, fontWeight:700, color:'#fafafa', marginBottom:16, marginTop:0 },
  inputRow: { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' },
  input: { flex:1, minWidth:200, background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:14, padding:'11px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif" },
  select: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'11px 14px', outline:'none', cursor:'pointer' },
  textarea: { width:'100%', background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'12px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif", resize:'vertical', boxSizing:'border-box' },
  btn: { background:'#4f46e5', color:'#fff', border:'none', borderRadius:10, padding:'11px 22px', fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' },
  label: { fontSize:12, fontWeight:600, color:'#a1a1aa', marginBottom:6 },
  table: { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th: { textAlign:'left', color:'#71717a', fontWeight:600, fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', padding:'10px 14px', borderBottom:'2px solid #27272a', whiteSpace:'nowrap', background:'#18181b' },
  td: { padding:'12px 14px', borderBottom:'1px solid #1f1f22', color:'#fafafa', verticalAlign:'middle' },
  trEven: { background:'transparent' },
  trOdd: { background:'#09090b44' },
  badge: (color) => ({ display:'inline-block', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600, background:(color||'#27272a')+'33', color:color||'#a1a1aa', border:`1px solid ${(color||'#3f3f46')}44` }),
  emptyState: { textAlign:'center', padding:'56px 24px', color:'#52525b', fontSize:13 },
  loading: { textAlign:'center', padding:'32px 24px', color:'#71717a', fontSize:13 },
  errorBox: { background:'#1c0c0c', border:'1px solid #7f1d1d', color:'#fca5a5', borderRadius:10, padding:'12px 16px', fontSize:13, marginBottom:16 },
  metaRow: { display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 },
  metaItem: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:'12px 18px', flex:'1 1 140px', textAlign:'center' },
  metaVal: { fontSize:22, fontWeight:700, color:'#4f46e5' },
  metaLabel: { fontSize:11, color:'#71717a', marginTop:2 },
  sT: { fontSize:12, fontWeight:700, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, marginTop:16 },
  groupNav: { display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' },
  groupBtn: (active, color) => ({ background: active ? color+'22' : '#18181b', color: active ? color : '#71717a', border:`1px solid ${active ? color+'44' : '#27272a'}`, borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:active?700:500, cursor:'pointer' }),
  tabStrip: { display:'flex', gap:4, marginBottom:20, flexWrap:'wrap', borderBottom:'1px solid #27272a', paddingBottom:8 },
  tabBtn: (active, color) => ({ background:'none', color: active ? color : '#71717a', border:'none', borderBottom: active ? `2px solid ${color}` : '2px solid transparent', padding:'8px 14px', fontSize:13, fontWeight:active?700:500, cursor:'pointer', marginBottom:-9 }),
  progressBar: { height:6, background:'#27272a', borderRadius:3, overflow:'hidden', marginTop:4 },
  progressFill: (pct, color) => ({ height:'100%', width:Math.min(pct,100)+'%', background:color||'#4f46e5', borderRadius:3 }),
};

// ─── groups config ────────────────────────────────────────────────────────────

const GROUPS = [
  {
    "id": "overview",
    "label": "Overview",
    "color": "#4f46e5",
    "tabs": [
      {
        "id": "dashboard",
        "label": "Dashboard"
      },
      {
        "id": "new-lost",
        "label": "New & Lost"
      },
      {
        "id": "history",
        "label": "Link History"
      },
      {
        "id": "top-pages",
        "label": "Top Linked Pages"
      },
      {
        "id": "by-type",
        "label": "Link Types"
      },
      {
        "id": "by-country",
        "label": "By Country"
      }
    ]
  },
  {
    "id": "domains",
    "label": "Referring Domains",
    "color": "#0ea5e9",
    "tabs": [
      {
        "id": "all-domains",
        "label": "All Domains"
      },
      {
        "id": "new-domains",
        "label": "New Domains"
      },
      {
        "id": "lost-domains",
        "label": "Lost Domains"
      },
      {
        "id": "da-dist",
        "label": "Authority Distribution"
      },
      {
        "id": "top-domains",
        "label": "Top Domains"
      },
      {
        "id": "spam-dist",
        "label": "Spam Distribution"
      }
    ]
  },
  {
    "id": "anchors",
    "label": "Anchor Text",
    "color": "#10b981",
    "tabs": [
      {
        "id": "anchor-overview",
        "label": "Anchor Overview"
      },
      {
        "id": "distribution",
        "label": "Distribution"
      },
      {
        "id": "risky-anchors",
        "label": "Risky Anchors"
      },
      {
        "id": "anchor-recs",
        "label": "Recommendations"
      },
      {
        "id": "keyword-anchors",
        "label": "Keyword Anchors"
      },
      {
        "id": "branded-anchors",
        "label": "Branded Anchors"
      }
    ]
  },
  {
    "id": "compete",
    "label": "Competitors",
    "color": "#f97316",
    "tabs": [
      {
        "id": "gap-analysis",
        "label": "Gap Analysis"
      },
      {
        "id": "compare",
        "label": "Compare Domains"
      },
      {
        "id": "link-intersect",
        "label": "Link Intersection"
      },
      {
        "id": "comp-pages",
        "label": "Competitor Pages"
      },
      {
        "id": "comp-new",
        "label": "Competitor New Links"
      },
      {
        "id": "benchmarks",
        "label": "Benchmarks"
      }
    ]
  },
  {
    "id": "prospecting",
    "label": "Link Building",
    "color": "#a855f7",
    "tabs": [
      {
        "id": "prospects",
        "label": "Find Prospects"
      },
      {
        "id": "resource-pages",
        "label": "Resource Pages"
      },
      {
        "id": "broken-link",
        "label": "Broken Link Opps"
      },
      {
        "id": "mentions",
        "label": "Unlinked Mentions"
      },
      {
        "id": "guest-posts",
        "label": "Guest Post Sites"
      },
      {
        "id": "score-prospects",
        "label": "Score Prospects"
      }
    ]
  },
  {
    "id": "outreach",
    "label": "Outreach",
    "color": "#ec4899",
    "tabs": [
      {
        "id": "campaigns",
        "label": "Campaigns"
      },
      {
        "id": "new-campaign",
        "label": "New Campaign"
      },
      {
        "id": "email-gen",
        "label": "AI Email Generator"
      },
      {
        "id": "outreach-stats",
        "label": "Outreach Stats"
      },
      {
        "id": "templates",
        "label": "Email Templates"
      },
      {
        "id": "sequences",
        "label": "Sequences"
      }
    ]
  },
  {
    "id": "advanced",
    "label": "Advanced",
    "color": "#f59e0b",
    "tabs": [
      {
        "id": "disavow",
        "label": "Disavow Builder"
      },
      {
        "id": "ai-strategy",
        "label": "AI Link Strategy"
      },
      {
        "id": "alerts-tab",
        "label": "Alerts"
      },
      {
        "id": "exports",
        "label": "Export Data"
      },
      {
        "id": "bl-settings",
        "label": "Settings"
      },
      {
        "id": "world-class",
        "label": "World-Class"
      }
    ]
  }
];

// ─── main component ───────────────────────────────────────────────────────────

export default function BacklinkExplorer() {
  const [activeGroup, setActiveGroup] = useState('overview');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [q, setQ] = useState({});
  const [form, setForm] = useState({ aiModel:'gpt-4o-mini', emailType:'link-request' });
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [err, setErr] = useState({});
  const [settings, setSettings] = useState({ defaultModel:'gpt-4o-mini', alertsEnabled:true });
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);

  const curGroup = GROUPS.find(g=>g.id===activeGroup)||GROUPS[0];

  function showToast(msg, color='#10b981') {
    setToast({msg,color});
    setTimeout(()=>setToast(null),3000);
  }

  async function fetchTab(tab, extraPayload={}) {
    setLoading(l=>({...l,[tab]:true}));
    setErr(e=>({...e,[tab]:null}));
    const endpoints = {
      'dashboard':       API+'/backlinks/overview',
      'new-lost':        API+'/backlinks/new',
      'history':         API+'/backlinks/history',
      'top-pages':       API+'/backlinks/top-pages',
      'by-type':         API+'/backlinks/by-type',
      'by-country':      API+'/backlinks/by-country',
      'all-domains':     API+'/domains/referring',
      'new-domains':     API+'/domains/new',
      'lost-domains':    API+'/domains/lost',
      'da-dist':         API+'/domains/authority-distribution',
      'top-domains':     API+'/domains/top',
      'spam-dist':       API+'/domains/spam-distribution',
      'anchor-overview': API+'/anchors/overview',
      'distribution':    API+'/anchors/distribution',
      'risky-anchors':   API+'/anchors/risky',
      'anchor-recs':     API+'/anchors/recommendations',
      'keyword-anchors': API+'/anchors/overview',
      'branded-anchors': API+'/anchors/overview',
      'gap-analysis':    API+'/competitor/gap',
      'compare':         API+'/competitor/compare',
      'link-intersect':  API+'/competitor/link-intersection',
      'comp-pages':      API+'/competitor/top-pages',
      'comp-new':        API+'/competitor/new-backlinks',
      'benchmarks':      API+'/competitor/benchmarks',
      'prospects':       API+'/prospects/find',
      'resource-pages':  API+'/prospects/resource-pages',
      'broken-link':     API+'/prospects/broken-links',
      'mentions':        API+'/prospects/unlinked-mentions',
      'guest-posts':     API+'/prospects/guest-posts',
      'score-prospects': API+'/prospects/score',
      'campaigns':       API+'/outreach/campaigns',
      'outreach-stats':  API+'/outreach/stats',
      'disavow':         API+'/disavow/analyze',
      'ai-strategy':     API+'/ai/link-strategy',
      'alerts-tab':      API+'/alerts',
      'bl-settings':     null,
      'world-class':     null,
      'new-campaign':    null,
      'email-gen':       null,
      'templates':       null,
      'sequences':       null,
    };
    const url = endpoints[tab];
    if(!url) { setLoading(l=>({...l,[tab]:false})); return; }
    try {
      const payload = {
        domain: q[tab]||q.dashboard||'',
        keyword: q[tab]||'',
        competitor: q[tab]||form.comp1||'',
        competitors: [form.comp1,form.comp2,form.comp3].filter(Boolean),
        brand: form.brand||'',
        type: form.linkType||'',
        period: form.period||'30d',
        model: form.aiModel||'gpt-4o-mini',
        page: 1, limit: 50,
        ...extraPayload,
      };
      const r = await apiFetchJSON(url, { method:'POST', body:JSON.stringify(payload) });
      if(r.ok) setData(d=>({...d,[tab]:r.data||r.results||r}));
      else setErr(e=>({...e,[tab]:r.error||'Request failed'}));
    } catch(e) { setErr(er=>({...er,[tab]:e.message})); }
    finally { setLoading(l=>({...l,[tab]:false})); }
  }

  async function generateEmail() {
    setLoading(l=>({...l,'email-gen':true}));
    try {
      const r = await apiFetchJSON(API+'/outreach/generate-email', {
        method:'POST',
        body:JSON.stringify({ prospect:q['email-gen']||'', type:form.emailType||'link-request', model:form.aiModel||'gpt-4o-mini' }),
      });
      if(r.ok) setData(d=>({...d,'email-gen':r.data}));
      else showToast(r.error,'#ef4444');
    } catch(e) { showToast(e.message,'#ef4444'); }
    finally { setLoading(l=>({...l,'email-gen':false})); }
  }

  async function createCampaign() {
    try {
      const r = await apiFetchJSON(API+'/outreach/campaigns/create', {
        method:'POST',
        body:JSON.stringify({ name:form.campaignName||'New Campaign', domain:form.campaignDomain||'', targetType:form.campaignType||'link-request' }),
      });
      if(r.ok) { showToast('Campaign created'); fetchTab('campaigns'); setModal(null); }
      else showToast(r.error,'#ef4444');
    } catch(e) { showToast(e.message,'#ef4444'); }
  }

  async function createAlert() {
    try {
      const r = await apiFetchJSON(API+'/alerts/create', {
        method:'POST',
        body:JSON.stringify({ domain:form.alertDomain||'', type:form.alertType||'new-link', threshold:form.alertThreshold||10 }),
      });
      if(r.ok) { showToast('Alert created'); fetchTab('alerts-tab'); }
      else showToast(r.error,'#ef4444');
    } catch(e) { showToast(e.message,'#ef4444'); }
  }

  async function generateDisavow() {
    try {
      const r = await apiFetchJSON(API+'/disavow/generate', { method:'POST', body:JSON.stringify({ items:form.disavowItems||[] }) });
      if(r.ok) setData(d=>({...d,'disavow-file':r.data}));
    } catch(e) { showToast(e.message,'#ef4444'); }
  }

  function handleGroupClick(gid) {
    const g = GROUPS.find(x=>x.id===gid);
    if(g) { setActiveGroup(gid); setActiveTab(g.tabs[0].id); }
  }

  // ─── tab renderers ────────────────────────────────────────────────────────

  function renderDashboard() {
    const d = data.dashboard;
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Backlink Profile Overview</div>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Enter domain (e.g. example.com)…" value={q.dashboard||''} onChange={e=>setQ(p=>({...p,dashboard:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&fetchTab('dashboard')} />
            <button style={S.btn} onClick={()=>fetchTab('dashboard')} disabled={loading.dashboard}>{loading.dashboard?'Analyzing…':'Analyze Backlinks'}</button>
            <button style={{...S.btn,background:'#10b981'}} onClick={()=>{fetchTab('ai-strategy');setActiveGroup('advanced');setActiveTab('ai-strategy');}}>✦ AI Strategy</button>
          </div>
          {err.dashboard && <div style={S.errorBox}>{err.dashboard}</div>}
          {loading.dashboard ? <div style={S.loading}>Analyzing backlink profile…</div> :
          d ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={S.metaVal}>{d.totalBacklinks?.toLocaleString()}</div><div style={S.metaLabel}>Total Backlinks</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#0ea5e9'}}>{d.referringDomains?.toLocaleString()}</div><div style={S.metaLabel}>Referring Domains</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>{d.dofollow?.toLocaleString()}</div><div style={S.metaLabel}>Dofollow Links</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f59e0b'}}>{d.newLast30?.toLocaleString()}</div><div style={S.metaLabel}>New (30d)</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#ef4444'}}>{d.lostLast30?.toLocaleString()}</div><div style={S.metaLabel}>Lost (30d)</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#a855f7'}}>{d.domainRating}</div><div style={S.metaLabel}>Domain Rating</div></div>
              </div>
              {d.recentBacklinks?.length ? (
                <>
                  <div style={S.sT}>Recent Backlinks</div>
                  <div style={{overflowX:'auto'}}>
                    <table style={S.table}>
                      <thead><tr><th style={S.th}>Source URL</th><th style={S.th}>DA</th><th style={S.th}>Type</th><th style={S.th}>Anchor</th><th style={S.th}>First Seen</th><th style={S.th}>Status</th></tr></thead>
                      <tbody>{d.recentBacklinks.map((b,i)=>(
                        <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                          <td style={S.td}><a href={b.url} target="_blank" rel="noopener noreferrer" style={{color:'#4f46e5',fontSize:11}}>{b.url}</a></td>
                          <td style={S.td}><AuthorityBadge da={b.da} /></td>
                          <td style={S.td}><span style={S.badge(typeColor(b.type))}>{b.type}</span></td>
                          <td style={S.td}><span style={{color:'#a1a1aa',fontSize:12}}>{b.anchorText||'—'}</span></td>
                          <td style={S.td}>{b.firstSeen}</td>
                          <td style={S.td}><span style={S.badge(b.status==='new'?'#10b981':b.status==='lost'?'#ef4444':'#27272a')}>{b.status}</span></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </>
          ) : <div style={S.emptyState}>Enter a domain to analyze its complete backlink profile.</div>}
        </div>
      </div>
    );
  }

  function renderAllDomains() {
    const d = data['all-domains'];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>All Referring Domains</div>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Domain…" value={q['all-domains']||''} onChange={e=>setQ(p=>({...p,'all-domains':e.target.value}))} onKeyDown={e=>e.key==='Enter'&&fetchTab('all-domains')} />
            <select style={S.select} value={form.domainSort||'da'} onChange={e=>setForm(p=>({...p,domainSort:e.target.value}))}>
              <option value="da">Sort: Domain Authority</option>
              <option value="links">Sort: Backlinks</option>
              <option value="spam">Sort: Spam Score</option>
              <option value="first">Sort: First Seen</option>
            </select>
            <button style={S.btn} onClick={()=>fetchTab('all-domains')} disabled={loading['all-domains']}>{loading['all-domains']?'Loading…':'Get Domains'}</button>
          </div>
          {err['all-domains'] && <div style={S.errorBox}>{err['all-domains']}</div>}
          {loading['all-domains'] ? <div style={S.loading}>Loading referring domains…</div> :
          d?.domains?.length ? (
            <div style={{overflowX:'auto'}}>
              <table style={S.table}>
                <thead><tr><th style={S.th}>Domain</th><th style={S.th}>DA</th><th style={S.th}>Backlinks</th><th style={S.th}>Dofollow</th><th style={S.th}>Country</th><th style={S.th}>Spam</th><th style={S.th}>First Seen</th></tr></thead>
                <tbody>{d.domains.map((dom,i)=>(
                  <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                    <td style={S.td}><span style={{fontWeight:600,color:'#fafafa'}}>{dom.domain}</span></td>
                    <td style={S.td}><AuthorityBadge da={dom.da} /></td>
                    <td style={S.td}>{dom.backlinks}</td>
                    <td style={S.td}>{dom.dofollow}</td>
                    <td style={S.td}>{dom.country}</td>
                    <td style={S.td}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <span style={S.badge(spamColor(dom.spam))}>{dom.spam}</span>
                        <span style={{fontSize:10,color:'#71717a'}}>{spamLabel(dom.spam)}</span>
                      </div>
                    </td>
                    <td style={S.td}>{dom.firstSeen}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div style={S.emptyState}>Enter a domain to load its referring domains.</div>}
        </div>
      </div>
    );
  }

  function renderAnchorOverview() {
    const d = data['anchor-overview'];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Anchor Text Profile</div>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Domain…" value={q['anchor-overview']||''} onChange={e=>setQ(p=>({...p,'anchor-overview':e.target.value}))} onKeyDown={e=>e.key==='Enter'&&fetchTab('anchor-overview')} />
            <button style={S.btn} onClick={()=>fetchTab('anchor-overview')} disabled={loading['anchor-overview']}>{loading['anchor-overview']?'Analyzing…':'Analyze Anchors'}</button>
          </div>
          {err['anchor-overview'] && <div style={S.errorBox}>{err['anchor-overview']}</div>}
          {loading['anchor-overview'] ? <div style={S.loading}>Analyzing anchor text profile…</div> :
          d?.anchors?.length ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:d.overOptimized?'#ef4444':'#10b981'}}>{d.naturalScore}/100</div><div style={S.metaLabel}>Natural Score</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>{d.brandedPct}%</div><div style={S.metaLabel}>Branded Anchors</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:d.overOptimized?'#ef4444':'#f59e0b'}}>{d.overOptimized?'Risk Detected':'Normal'}</div><div style={S.metaLabel}>Over-Optimization</div></div>
              </div>
              {d.anchors.map((a,i)=>(
                <div key={i} style={{marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:13,color:'#fafafa'}}>{a.text} <span style={{color:'#71717a',fontSize:11}}>({a.count} links)</span></span>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      <span style={{fontSize:13,fontWeight:700,color:'#4f46e5'}}>{a.pct}%</span>
                      <span style={S.badge(a.risk==='high'?'#ef4444':a.risk==='medium'?'#f59e0b':'#10b981')}>{a.type}</span>
                    </div>
                  </div>
                  <div style={S.progressBar}>
                    <div style={S.progressFill(a.pct, a.risk==='high'?'#ef4444':a.risk==='medium'?'#f59e0b':'#4f46e5')} />
                  </div>
                </div>
              ))}
            </>
          ) : <div style={S.emptyState}>Enter a domain to analyze its anchor text distribution.</div>}
        </div>
      </div>
    );
  }

  function renderGapAnalysis() {
    const d = data['gap-analysis'];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Backlink Gap Analysis</div>
          <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Find domains linking to your competitors but not to you.</p>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Your domain…" value={q['gap-analysis']||''} onChange={e=>setQ(p=>({...p,'gap-analysis':e.target.value}))} />
            <input style={S.input} placeholder="Competitor 1…" value={form.comp1||''} onChange={e=>setForm(p=>({...p,comp1:e.target.value}))} />
            <input style={S.input} placeholder="Competitor 2…" value={form.comp2||''} onChange={e=>setForm(p=>({...p,comp2:e.target.value}))} />
            <button style={S.btn} onClick={()=>fetchTab('gap-analysis')} disabled={loading['gap-analysis']}>{loading['gap-analysis']?'Analyzing…':'Find Gap'}</button>
          </div>
          {err['gap-analysis'] && <div style={S.errorBox}>{err['gap-analysis']}</div>}
          {loading['gap-analysis'] ? <div style={S.loading}>Comparing backlink profiles…</div> :
          d?.opportunities?.length ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#ef4444'}}>{d.uniqueToCompetitors?.toLocaleString()}</div><div style={S.metaLabel}>Gaps Found</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>{d.uniqueToYou?.toLocaleString()}</div><div style={S.metaLabel}>Your Advantages</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#4f46e5'}}>{d.shared?.toLocaleString()}</div><div style={S.metaLabel}>Shared Domains</div></div>
              </div>
              <div style={S.sT}>Link Gap Opportunities</div>
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Domain</th><th style={S.th}>DA</th><th style={S.th}>Competitors Linked</th><th style={S.th}>Your Links</th><th style={S.th}>Opportunity</th></tr></thead>
                  <tbody>{d.opportunities.map((opp,i)=>(
                    <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                      <td style={S.td}><span style={{fontWeight:600}}>{opp.domain}</span></td>
                      <td style={S.td}><AuthorityBadge da={opp.da} /></td>
                      <td style={S.td}><span style={{color:'#10b981',fontWeight:700}}>{opp.competitorCount}</span></td>
                      <td style={S.td}><span style={{color:opp.yourBacklinks>0?'#10b981':'#ef4444'}}>{opp.yourBacklinks||'None'}</span></td>
                      <td style={S.td}><button style={{...S.btn,padding:'4px 10px',fontSize:11,background:'#a855f7'}} onClick={()=>showToast('Adding to prospects…')}>+ Prospect</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          ) : <div style={S.emptyState}>Enter your domain and competitors to find backlink gaps.</div>}
        </div>
      </div>
    );
  }

  function renderProspects() {
    const d = data.prospects;
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Find Link Prospects</div>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Target keyword or niche…" value={q.prospects||''} onChange={e=>setQ(p=>({...p,prospects:e.target.value}))} />
            <select style={S.select} value={form.prospectType||''} onChange={e=>setForm(p=>({...p,prospectType:e.target.value}))}>
              <option value="">All Types</option>
              <option value="guest-post">Guest Post</option>
              <option value="resource">Resource Page</option>
              <option value="broken-link">Broken Link</option>
              <option value="unlinked-mention">Unlinked Mention</option>
            </select>
            <button style={S.btn} onClick={()=>fetchTab('prospects')} disabled={loading.prospects}>{loading.prospects?'Finding…':'Find Prospects'}</button>
            <button style={{...S.btn,background:'#10b981'}} onClick={()=>fetchTab('score-prospects',{urls:(d?.prospects||[]).slice(0,20).map(p=>p.url)})} disabled={loading['score-prospects']}>✦ AI Score</button>
          </div>
          {err.prospects && <div style={S.errorBox}>{err.prospects}</div>}
          {loading.prospects ? <div style={S.loading}>Finding link building prospects…</div> :
          d?.prospects?.length ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#a855f7'}}>{d.total?.toLocaleString()}</div><div style={S.metaLabel}>Total Prospects</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#4f46e5'}}>{d.prospects.filter(p=>p.da>=50).length}</div><div style={S.metaLabel}>DA 50+</div></div>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>URL</th><th style={S.th}>DA</th><th style={S.th}>Traffic</th><th style={S.th}>Type</th><th style={S.th}>Relevance</th><th style={S.th}></th></tr></thead>
                  <tbody>{d.prospects.map((p,i)=>(
                    <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                      <td style={S.td}><a href={p.url} target="_blank" rel="noopener noreferrer" style={{color:'#4f46e5',fontSize:11}}>{p.url}</a></td>
                      <td style={S.td}><AuthorityBadge da={p.da} /></td>
                      <td style={S.td}>{p.traffic?.toLocaleString()}</td>
                      <td style={S.td}><span style={S.badge('#a855f7')}>{p.type}</span></td>
                      <td style={S.td}><ScoreBar score={p.relevance||0} max={100} /></td>
                      <td style={S.td}>
                        <div style={{display:'flex',gap:4}}>
                          <button style={{...S.btn,padding:'4px 10px',fontSize:11,background:'#27272a'}} onClick={()=>{setQ(qp=>({...qp,'email-gen':p.url}));setActiveGroup('outreach');setActiveTab('email-gen');}}>Outreach</button>
                          <button style={{...S.btn,padding:'4px 10px',fontSize:11,background:'#a855f7'}} onClick={()=>showToast('Added to campaign')}>+ Add</button>
                        </div>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          ) : <div style={S.emptyState}>Enter a keyword or niche to find link building prospects.</div>}
        </div>
      </div>
    );
  }

  function renderEmailGen() {
    const d = data['email-gen'];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>✦ AI Outreach Email Generator</div>
          <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Generate personalized link building outreach emails using AI. Each email is customized based on the prospect&apos;s site.</p>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Prospect URL or domain…" value={q['email-gen']||''} onChange={e=>setQ(p=>({...p,'email-gen':e.target.value}))} />
            <select style={S.select} value={form.emailType||'link-request'} onChange={e=>setForm(p=>({...p,emailType:e.target.value}))}>
              <option value="link-request">Link Request</option>
              <option value="broken-link">Broken Link</option>
              <option value="guest-post">Guest Post Pitch</option>
              <option value="unlinked-mention">Unlinked Mention</option>
            </select>
            <select style={S.select} value={form.aiModel||'gpt-4o-mini'} onChange={e=>setForm(p=>({...p,aiModel:e.target.value}))}>
              <option value="gpt-4o-mini">GPT-4o Mini (1 credit)</option>
              <option value="gpt-4o">GPT-4o (2 credits)</option>
              <option value="gpt-4">GPT-4 (3 credits)</option>
            </select>
            <button style={{...S.btn,background:'#ec4899'}} onClick={generateEmail} disabled={loading['email-gen']}>{loading['email-gen']?'Generating…':'✦ Generate Email'}</button>
          </div>
          {err['email-gen'] && <div style={S.errorBox}>{err['email-gen']}</div>}
          {loading['email-gen'] ? <div style={S.loading}>Generating personalized outreach email…</div> :
          d?.email ? (
            <div>
              <pre style={{background:'#0d0d10',border:'1px solid #3f3f46',borderRadius:10,padding:16,fontSize:13,color:'#e4e4e7',whiteSpace:'pre-wrap',fontFamily:'monospace',lineHeight:1.7,marginBottom:12}}>{d.email}</pre>
              <div style={{display:'flex',gap:8}}>
                <button style={{...S.btn,background:'#27272a'}} onClick={()=>{navigator.clipboard?.writeText(d.email);showToast('Copied to clipboard');}}>Copy Email</button>
                <button style={{...S.btn,background:'#ec4899'}} onClick={generateEmail}>✦ Regenerate</button>
                <button style={{...S.btn,background:'#a855f7'}} onClick={()=>showToast('Added to sequence')}>Add to Sequence</button>
              </div>
              <div style={{color:'#71717a',fontSize:11,marginTop:8}}>Model: {d.model} · Credits used: {d.creditsUsed}</div>
            </div>
          ) : <div style={S.emptyState}>Enter a prospect URL and click Generate Email to create a personalized outreach message.</div>}
        </div>
      </div>
    );
  }

  function renderCampaigns() {
    const d = data.campaigns;
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Outreach Campaigns</div>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
            <button style={{...S.btn,background:'#ec4899'}} onClick={()=>setModal('new-campaign')}>+ New Campaign</button>
          </div>
          <button style={{...S.btn,background:'#27272a',marginBottom:16}} onClick={()=>fetchTab('campaigns')} disabled={loading.campaigns}>{loading.campaigns?'Loading…':'Refresh'}</button>
          {loading.campaigns ? <div style={S.loading}>Loading campaigns…</div> :
          d?.campaigns?.length ? (
            d.campaigns.map((c,i)=>(
              <div key={i} style={{...S.card,marginBottom:10,padding:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:700,color:'#fafafa',marginBottom:4}}>{c.name}</div>
                  <div style={{display:'flex',gap:8}}>
                    <span style={S.badge(c.status==='active'?'#10b981':'#52525b')}>{c.status}</span>
                    <span style={{color:'#71717a',fontSize:12}}>Sent: {c.sent||0} · Replied: {c.replied||0}</span>
                  </div>
                </div>
                <button style={{...S.btn,padding:'6px 14px',fontSize:12,background:'#27272a'}} onClick={()=>showToast('Opening campaign…')}>View</button>
              </div>
            ))
          ) : <div style={S.emptyState}>No campaigns yet. Create one to start building links.</div>}
        </div>
      </div>
    );
  }

  function renderDisavow() {
    const d = data.disavow;
    const fileData = data['disavow-file'];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Disavow Builder</div>
          <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Identify and disavow toxic backlinks that may be harming your rankings.</p>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Domain to analyze for toxic links…" value={q.disavow||''} onChange={e=>setQ(p=>({...p,disavow:e.target.value}))} />
            <button style={S.btn} onClick={()=>fetchTab('disavow')} disabled={loading.disavow}>{loading.disavow?'Scanning…':'Scan for Toxic Links'}</button>
          </div>
          {err.disavow && <div style={S.errorBox}>{err.disavow}</div>}
          {loading.disavow ? <div style={S.loading}>Scanning for toxic links…</div> :
          d ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#ef4444'}}>{d.toxic?.length||0}</div><div style={S.metaLabel}>Toxic Links</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f59e0b'}}>{d.suspicious||0}</div><div style={S.metaLabel}>Suspicious</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>{d.healthy||0}</div><div style={S.metaLabel}>Healthy</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#4f46e5'}}>{d.totalAnalyzed||0}</div><div style={S.metaLabel}>Total Analyzed</div></div>
              </div>
              {d.toxic?.length ? (
                <>
                  <div style={{overflowX:'auto',marginBottom:12}}>
                    <table style={S.table}>
                      <thead><tr><th style={S.th}>Domain</th><th style={S.th}>Spam Score</th><th style={S.th}>Reason</th><th style={S.th}>Action</th></tr></thead>
                      <tbody>{d.toxic.map((b,i)=>(
                        <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                          <td style={S.td}><span style={{color:'#ef4444',fontSize:12}}>{b.sourceDomain}</span></td>
                          <td style={S.td}><span style={S.badge(spamColor(b.spam))}>{b.spam}</span></td>
                          <td style={S.td}>{b.reason}</td>
                          <td style={S.td}><span style={S.badge('#ef4444')}>{b.recommendation}</span></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <button style={{...S.btn,background:'#ef4444'}} onClick={generateDisavow}>Generate Disavow File</button>
                </>
              ) : null}
              {fileData?.content ? (
                <div style={{marginTop:16}}>
                  <div style={S.sT}>Disavow File Preview</div>
                  <pre style={{background:'#0d0d10',border:'1px solid #3f3f46',borderRadius:10,padding:16,fontSize:12,color:'#a1a1aa',fontFamily:'monospace',whiteSpace:'pre-wrap',maxHeight:300,overflow:'auto'}}>{fileData.content}</pre>
                  <div style={{display:'flex',gap:8,marginTop:8}}>
                    <button style={{...S.btn,background:'#27272a'}} onClick={()=>{navigator.clipboard?.writeText(fileData.content);showToast('Copied');}}>Copy</button>
                    <button style={{...S.btn,background:'#ef4444'}} onClick={()=>showToast('Ready for GSC submission')}>Submit to GSC</button>
                  </div>
                </div>
              ) : null}
            </>
          ) : <div style={S.emptyState}>Enter a domain to scan for toxic and spammy backlinks.</div>}
        </div>
      </div>
    );
  }

  function renderAiStrategy() {
    const d = data['ai-strategy'];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>✦ AI Link Building Strategy</div>
          <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Get an AI-generated comprehensive link building strategy tailored to your domain, competitors, and niche.</p>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Your domain…" value={q['ai-strategy']||''} onChange={e=>setQ(p=>({...p,'ai-strategy':e.target.value}))} />
            <select style={S.select} value={form.aiModel||'gpt-4o'} onChange={e=>setForm(p=>({...p,aiModel:e.target.value}))}>
              <option value="gpt-4o-mini">GPT-4o Mini (2 credits)</option>
              <option value="gpt-4o">GPT-4o (4 credits)</option>
              <option value="gpt-4">GPT-4 (6 credits)</option>
            </select>
            <button style={{...S.btn,background:'#10b981'}} onClick={()=>fetchTab('ai-strategy')} disabled={loading['ai-strategy']}>{loading['ai-strategy']?'Generating…':'✦ Generate Strategy'}</button>
          </div>
          {err['ai-strategy'] && <div style={S.errorBox}>{err['ai-strategy']}</div>}
          {loading['ai-strategy'] ? <div style={S.loading}>AI is building your link strategy…</div> :
          d?.strategy ? (
            <div>
              <div style={{...S.card,background:'#09090b',marginBottom:16}}>
                <div style={{fontWeight:700,color:'#fafafa',marginBottom:8}}>Strategy Summary</div>
                <p style={{color:'#a1a1aa',fontSize:13,lineHeight:1.7,margin:0}}>{d.strategy.summary}</p>
              </div>
              <div style={S.sT}>Key Pillars</div>
              {d.strategy.pillars?.map((p,i)=>(
                <div key={i} style={S.issueRowStyle}>
                  <span style={{background:'#4f46e546',color:'#818cf8',borderRadius:4,padding:'2px 7px',fontSize:11,fontWeight:700,flexShrink:0}}>#{i+1}</span>
                  <span style={{color:'#fafafa',fontSize:13}}>{p}</span>
                </div>
              ))}
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>{d.strategy.monthlyGoal}</div><div style={S.metaLabel}>Monthly Link Goal</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#4f46e5'}}>{d.strategy.estimatedTimeMonths}m</div><div style={S.metaLabel}>Est. Timeline</div></div>
              </div>
            </div>
          ) : <div style={S.emptyState}>Enter your domain to get an AI-powered link building strategy.</div>}
        </div>
      </div>
    );
  }

  function renderWorldClass() {
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>✦ World-Class Enterprise Features</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16}}>
            {[
              {icon:'🔗',title:'Real-Time Link Monitoring',desc:'Monitor your backlink profile 24/7 with instant alerts for new toxic links, lost high-value links, and competitor wins.'},
              {icon:'🤖',title:'AI Link Qualification',desc:'Automatically score and qualify every prospect using multi-model AI trained on millions of successful link placements.'},
              {icon:'📊',title:'Predictive Link Analytics',desc:'Forecast the ranking impact of acquiring links from specific domains using our ML ranking models.'},
              {icon:'🌐',title:'Global Crawl Network',desc:'Distributed crawl infrastructure covering 99.9% of the web with daily freshness for top 10M domains.'},
              {icon:'📧',title:'Automated Outreach Sequences',desc:'Multi-touch outreach sequences with A/B testing, CRM sync, and smart follow-up timing.'},
              {icon:'🛡️',title:'Penguin-Safe Analysis',desc:'Enterprise-grade penalty risk analysis aligned with Google Quality Guidelines.'},
            ].map((f,i)=>(
              <div key={i} style={S.miniCard}>
                <div style={{fontSize:28,marginBottom:8}}>{f.icon}</div>
                <div style={{fontWeight:700,color:'#fafafa',marginBottom:4}}>{f.title}</div>
                <div style={{fontSize:12,color:'#71717a',lineHeight:1.5}}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderGenericTab(tabId, title, desc) {
    const d = data[tabId];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>{title}</div>
          <p style={{color:'#71717a',fontSize:13,marginTop:0}}>{desc}</p>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Enter domain or URL…" value={q[tabId]||''} onChange={e=>setQ(p=>({...p,[tabId]:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&fetchTab(tabId)} />
            <button style={S.btn} onClick={()=>fetchTab(tabId)} disabled={loading[tabId]}>{loading[tabId]?'Loading…':'Analyze'}</button>
            <button style={{...S.btn,background:'#10b981'}} onClick={()=>showToast('AI analyzing…')}>✦ AI Insights</button>
          </div>
          {err[tabId] && <div style={S.errorBox}>{err[tabId]}</div>}
          {loading[tabId] ? <div style={S.loading}>Loading {title.toLowerCase()}…</div> :
          d ? (
            <div style={{overflowX:'auto'}}>
              <table style={S.table}>
                <thead><tr><th style={S.th}>Item</th><th style={S.th}>Authority</th><th style={S.th}>Details</th><th style={S.th}>Status</th></tr></thead>
                <tbody>{(Array.isArray(d)?d:d.domains||d.pages||d.backlinks||d.items||[]).map((r,i)=>(
                  <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                    <td style={S.td}><span style={{fontWeight:600,color:'#fafafa',fontSize:12}}>{r.domain||r.url||r.item||String(r)}</span></td>
                    <td style={S.td}>{r.da?<AuthorityBadge da={r.da} />:'—'}</td>
                    <td style={S.td}><span style={{color:'#71717a',fontSize:12}}>{r.detail||r.description||r.type||r.firstSeen||'—'}</span></td>
                    <td style={S.td}>{r.status?<span style={S.badge(r.status==='active'?'#10b981':'#52525b')}>{r.status}</span>:'—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div style={S.emptyState}>Enter a domain to analyze {title.toLowerCase()}.</div>}
        </div>
      </div>
    );
  }

  // ─── tab renderer ─────────────────────────────────────────────────────────

  const issueRowStyle = { display:'flex', alignItems:'flex-start', gap:10, padding:'10px 0', borderBottom:'1px solid #1f1f22' };

  function renderTab() {
    switch(activeTab) {
      case 'dashboard':     return renderDashboard();
      case 'new-lost':      return renderGenericTab('new-lost','New & Lost Links','Track links gained and lost in the last 30/60/90 days.');
      case 'history':       return renderGenericTab('history','Link History','Full historical timeline of your backlink profile growth.');
      case 'top-pages':     return renderGenericTab('top-pages','Top Linked Pages','Your pages with the most backlinks and referring domains.');
      case 'by-type':       return renderGenericTab('by-type','Links by Type','Break down backlinks by dofollow, nofollow, UGC, and sponsored.');
      case 'by-country':    return renderGenericTab('by-country','Links by Country','Geographic distribution of your referring domains.');
      case 'all-domains':   return renderAllDomains();
      case 'new-domains':   return renderGenericTab('new-domains','New Referring Domains','Domains that linked to you for the first time this period.');
      case 'lost-domains':  return renderGenericTab('lost-domains','Lost Referring Domains','Domains that previously linked to you but no longer do.');
      case 'da-dist':       return renderGenericTab('da-dist','Authority Distribution','Distribution of referring domain authority scores.');
      case 'top-domains':   return renderGenericTab('top-domains','Top Domains','Highest-authority domains linking to you.');
      case 'spam-dist':     return renderGenericTab('spam-dist','Spam Distribution','Distribution of spam scores across your referring domains.');
      case 'anchor-overview': return renderAnchorOverview();
      case 'distribution':  return renderGenericTab('distribution','Anchor Distribution','Visual breakdown of anchor text types and percentages.');
      case 'risky-anchors': return renderGenericTab('risky-anchors','Risky Anchors','Over-optimized anchor text that could trigger Google penalties.');
      case 'anchor-recs':   return renderGenericTab('anchor-recs','Anchor Recommendations','AI recommendations to improve your anchor text profile.');
      case 'keyword-anchors': return renderGenericTab('keyword-anchors','Keyword Anchors','Anchors containing target keywords — diversity and risk analysis.');
      case 'branded-anchors': return renderGenericTab('branded-anchors','Branded Anchors','Brand-name anchors as a percentage of your profile.');
      case 'gap-analysis':  return renderGapAnalysis();
      case 'compare':       return renderGenericTab('compare','Compare Domains','Side-by-side comparison of backlink metrics across multiple domains.');
      case 'link-intersect': return renderGenericTab('link-intersect','Link Intersection','Domains linking to all your competitors but not to you.');
      case 'comp-pages':    return renderGenericTab('comp-pages','Competitor Top Pages','Most-linked pages on competitor sites.');
      case 'comp-new':      return renderGenericTab('comp-new','Competitor New Links','Links your competitors acquired recently.');
      case 'benchmarks':    return renderGenericTab('benchmarks','Benchmarks','Compare your backlink KPIs against industry benchmarks.');
      case 'prospects':     return renderProspects();
      case 'resource-pages': return renderGenericTab('resource-pages','Resource Pages','Resource and links pages in your niche that accept submissions.');
      case 'broken-link':   return renderGenericTab('broken-link','Broken Link Opportunities','Pages with broken outbound links you can replace with your content.');
      case 'mentions':      return renderGenericTab('mentions','Unlinked Mentions','Sites that mention your brand without linking — easy link wins.');
      case 'guest-posts':   return renderGenericTab('guest-posts','Guest Post Sites','High-DA sites in your niche accepting guest contributions.');
      case 'score-prospects': return renderGenericTab('score-prospects','Score Prospects','AI scoring of your prospect list by link value and obtainability.');
      case 'campaigns':     return renderCampaigns();
      case 'new-campaign':  return renderGenericTab('new-campaign','New Campaign','Create a structured outreach campaign for a link building initiative.');
      case 'email-gen':     return renderEmailGen();
      case 'outreach-stats': return renderGenericTab('outreach-stats','Outreach Stats','Track email open rates, reply rates, and link acquisition success.');
      case 'templates':     return renderGenericTab('templates','Email Templates','Library of proven outreach email templates by link type.');
      case 'sequences':     return renderGenericTab('sequences','Outreach Sequences','Multi-step follow-up sequences for automated link building outreach.');
      case 'disavow':       return renderDisavow();
      case 'ai-strategy':   return renderAiStrategy();
      case 'alerts-tab':    return renderGenericTab('alerts-tab','Link Alerts','Get notified about new links, lost links, and competitor activity.');
      case 'exports':       return renderGenericTab('exports','Export Data','Export your backlink data in CSV, XLSX, or JSON format.');
      case 'bl-settings':   return renderSettings();
      case 'world-class':   return renderWorldClass();
      default:              return <div style={S.emptyState}>Select a tab to begin.</div>;
    }
  }

  function renderSettings() {
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Tool Settings</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16}}>
            <div>
              <div style={S.label}>Default AI Model</div>
              <select style={S.select} value={settings.defaultModel||'gpt-4o-mini'} onChange={e=>setSettings(s=>({...s,defaultModel:e.target.value}))}>
                <option value="gpt-4o-mini">GPT-4o Mini (cheapest)</option>
                <option value="gpt-4o">GPT-4o (balanced)</option>
                <option value="gpt-4">GPT-4 (best quality)</option>
              </select>
            </div>
            <div>
              <div style={S.label}>Backlink Alerts</div>
              <select style={S.select} value={settings.alertsEnabled?'yes':'no'} onChange={e=>setSettings(s=>({...s,alertsEnabled:e.target.value==='yes'}))}>
                <option value="yes">Enabled</option>
                <option value="no">Disabled</option>
              </select>
            </div>
          </div>
          <button style={{...S.btn,marginTop:20}} onClick={async()=>{
            try { await apiFetchJSON(API+'/settings',{method:'POST',body:JSON.stringify(settings)}); showToast('Settings saved'); } catch(e) { showToast('Failed','#ef4444'); }
          }}>Save Settings</button>
        </div>
      </div>
    );
  }

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div style={S.root}>
      <div style={S.header}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16}}>
          <div>
            <h1 style={S.title}>Backlink Explorer</h1>
            <p style={S.subtitle}>Enterprise link intelligence — analysis, prospecting, AI outreach, competitive gap & disavow management</p>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={{...S.btn,background:'#27272a'}} onClick={()=>fetchTab('dashboard')}>↺ Refresh</button>
            <button style={{...S.btn,background:'#10b981'}} onClick={()=>{setActiveGroup('advanced');setActiveTab('ai-strategy');}}>✦ AI Strategy</button>
          </div>
        </div>
      </div>

      <div style={S.groupNav}>
        {GROUPS.map(g=>(
          <button key={g.id} style={S.groupBtn(activeGroup===g.id, g.color)} onClick={()=>handleGroupClick(g.id)}>
            {g.label}
          </button>
        ))}
      </div>

      <div style={S.tabStrip}>
        {curGroup.tabs.map(t=>(
          <button key={t.id} style={S.tabBtn(activeTab===t.id, curGroup.color)} onClick={()=>setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {renderTab()}

      {toast && (
        <div style={{position:'fixed',bottom:24,right:24,background:toast.color,color:'#fff',borderRadius:10,padding:'12px 20px',fontSize:13,fontWeight:600,zIndex:9999,boxShadow:'0 4px 24px #0006'}}>
          {toast.msg}
        </div>
      )}

      {modal === 'new-campaign' && (
        <div style={{position:'fixed',inset:0,background:'#000a',zIndex:9998,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setModal(null)}>
          <div style={{...S.card,minWidth:360,maxWidth:480}} onClick={e=>e.stopPropagation()}>
            <div style={S.cardTitle}>New Outreach Campaign</div>
            <div style={{marginBottom:12}}>
              <div style={S.label}>Campaign Name</div>
              <input style={S.input} placeholder="e.g. Q3 Guest Post Push" value={form.campaignName||''} onChange={e=>setForm(p=>({...p,campaignName:e.target.value}))} autoFocus />
            </div>
            <div style={{marginBottom:12}}>
              <div style={S.label}>Target Domain</div>
              <input style={S.input} placeholder="yoursite.com" value={form.campaignDomain||''} onChange={e=>setForm(p=>({...p,campaignDomain:e.target.value}))} />
            </div>
            <div style={{marginBottom:16}}>
              <div style={S.label}>Campaign Type</div>
              <select style={S.select} value={form.campaignType||'link-request'} onChange={e=>setForm(p=>({...p,campaignType:e.target.value}))}>
                <option value="link-request">Link Request</option>
                <option value="guest-post">Guest Post</option>
                <option value="broken-link">Broken Link</option>
                <option value="unlinked-mention">Unlinked Mention</option>
              </select>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button style={{...S.btn,background:'#ec4899'}} onClick={createCampaign}>Create Campaign</button>
              <button style={{...S.btn,background:'#27272a'}} onClick={()=>setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
