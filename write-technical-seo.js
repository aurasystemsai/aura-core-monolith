/**
 * Generator: Enterprise TechnicalSEOAuditor.jsx
 * Run: node write-technical-seo.js
 * Outputs: aura-console/src/components/tools/TechnicalSEOAuditor.jsx
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'aura-console/src/components/tools/TechnicalSEOAuditor.jsx');

const GROUPS = [
  { id:'crawl',     label:'Crawl & Index',  color:'#4f46e5',
    tabs:[
      {id:'overview',       label:'Site Overview'},
      {id:'crawl-errors',   label:'Crawl Errors'},
      {id:'index-status',   label:'Index Status'},
      {id:'robots',         label:'Robots.txt'},
      {id:'sitemap',        label:'Sitemaps'},
      {id:'log-analysis',   label:'Log File Analysis'},
    ]},
  { id:'onpage',    label:'On-Page',        color:'#0ea5e9',
    tabs:[
      {id:'titles',         label:'Title Tags'},
      {id:'meta-desc',      label:'Meta Descriptions'},
      {id:'headings',       label:'Heading Structure'},
      {id:'canonical',      label:'Canonicals'},
      {id:'hreflang',       label:'Hreflang'},
      {id:'structured-data',label:'Structured Data'},
    ]},
  { id:'performance', label:'Performance',  color:'#10b981',
    tabs:[
      {id:'core-vitals',    label:'Core Web Vitals'},
      {id:'page-speed',     label:'Page Speed'},
      {id:'mobile',         label:'Mobile Usability'},
      {id:'images',         label:'Image Optimization'},
      {id:'resources',      label:'JS / CSS'},
      {id:'caching',        label:'Caching & CDN'},
    ]},
  { id:'links',     label:'Links',          color:'#f97316',
    tabs:[
      {id:'internal-links', label:'Internal Links'},
      {id:'broken-links',   label:'Broken Links'},
      {id:'redirects',      label:'Redirects'},
      {id:'link-depth',     label:'Link Depth'},
      {id:'orphan-pages',   label:'Orphan Pages'},
      {id:'anchor-text',    label:'Anchor Text'},
    ]},
  { id:'security',  label:'Security',       color:'#ec4899',
    tabs:[
      {id:'https',          label:'HTTPS / TLS'},
      {id:'headers',        label:'Security Headers'},
      {id:'mixed-content',  label:'Mixed Content'},
      {id:'malware',        label:'Malware Scan'},
      {id:'permissions',    label:'Permissions Policy'},
      {id:'csp',            label:'Content Security'},
    ]},
  { id:'content',   label:'Content',        color:'#a855f7',
    tabs:[
      {id:'duplicate',      label:'Duplicate Content'},
      {id:'thin-content',   label:'Thin Content'},
      {id:'content-gaps',   label:'Content Gaps'},
      {id:'readability',    label:'Readability'},
      {id:'word-count',     label:'Word Count'},
      {id:'freshness',      label:'Content Freshness'},
    ]},
  { id:'advanced',  label:'Advanced',       color:'#f59e0b',
    tabs:[
      {id:'international',  label:'International SEO'},
      {id:'javascript-seo', label:'JavaScript SEO'},
      {id:'spa-seo',        label:'SPA / PWA SEO'},
      {id:'ai-audit',       label:'AI Full Audit'},
      {id:'audit-settings', label:'Settings'},
      {id:'world-class',    label:'World-Class'},
    ]},
];

const code = `import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, ScoreBar, ErrorBox, Spinner } from "../MozUI";

const API = "/api/technical-seo-auditor";

// ─── helpers ─────────────────────────────────────────────────────────────────

function severityColor(s) {
  const m = { critical:'#ef4444', high:'#f97316', medium:'#f59e0b', low:'#10b981', info:'#0ea5e9' };
  return m[s] || '#52525b';
}
function scoreColor(n) {
  if(n >= 80) return '#10b981';
  if(n >= 50) return '#f59e0b';
  return '#ef4444';
}
function statusColor(s) {
  const m = { pass:'#10b981', fail:'#ef4444', warn:'#f59e0b', info:'#0ea5e9' };
  return m[s] || '#52525b';
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
  badge: (color) => ({ display:'inline-block', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600, background:(color||'#27272a')+'33', color:color||'#a1a1aa', border:\`1px solid \${(color||'#3f3f46')}44\` }),
  emptyState: { textAlign:'center', padding:'56px 24px', color:'#52525b', fontSize:13 },
  loading: { textAlign:'center', padding:'32px 24px', color:'#71717a', fontSize:13 },
  errorBox: { background:'#1c0c0c', border:'1px solid #7f1d1d', color:'#fca5a5', borderRadius:10, padding:'12px 16px', fontSize:13, marginBottom:16 },
  metaRow: { display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 },
  metaItem: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:'12px 18px', flex:'1 1 140px', textAlign:'center' },
  metaVal: { fontSize:22, fontWeight:700, color:'#4f46e5' },
  metaLabel: { fontSize:11, color:'#71717a', marginTop:2 },
  sT: { fontSize:12, fontWeight:700, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, marginTop:16 },
  issueRow: { display:'flex', alignItems:'flex-start', gap:12, padding:'12px 0', borderBottom:'1px solid #1f1f22' },
  issueIcon: (color) => ({ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0, marginTop:5 }),
  scoreRing: (score) => ({ width:80, height:80, borderRadius:'50%', border:\`6px solid \${scoreColor(score)}\`, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', flexShrink:0 }),
  progressBar: (pct, color) => ({ height:6, background:'#27272a', borderRadius:3, overflow:'hidden' }),
  progressFill: (pct, color) => ({ height:'100%', width:pct+'%', background:color||'#4f46e5', borderRadius:3, transition:'width 0.4s' }),
  groupNav: { display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' },
  groupBtn: (active, color) => ({ background: active ? color+'22' : '#18181b', color: active ? color : '#71717a', border:\`1px solid \${active ? color+'44' : '#27272a'}\`, borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:active?700:500, cursor:'pointer' }),
  tabStrip: { display:'flex', gap:4, marginBottom:20, flexWrap:'wrap', borderBottom:'1px solid #27272a', paddingBottom:8 },
  tabBtn: (active, color) => ({ background:'none', color: active ? color : '#71717a', border:'none', borderBottom: active ? \`2px solid \${color}\` : '2px solid transparent', padding:'8px 14px', fontSize:13, fontWeight:active?700:500, cursor:'pointer', marginBottom:-9 }),
  checkRow: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #1f1f22' },
  vitalsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16, marginBottom:20 },
  vitalCard: (color) => ({ background:'#09090b', border:\`1px solid \${color}44\`, borderRadius:12, padding:16 }),
};

// ─── groups config ────────────────────────────────────────────────────────────

const GROUPS = ${JSON.stringify(GROUPS, null, 2)};

// ─── reusable components ──────────────────────────────────────────────────────

function IssueTable({ items, cols, empty }) {
  if(!items?.length) return <div style={S.emptyState}>{empty}</div>;
  return (
    <div style={{overflowX:'auto'}}>
      <table style={S.table}>
        <thead><tr>{cols.map(c=><th key={c} style={S.th}>{c}</th>)}</tr></thead>
        <tbody>{items.map((r,i)=>(
          <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
            {Object.values(r).slice(0,cols.length).map((v,j)=>(
              <td key={j} style={S.td}>{String(v??'—')}</td>
            ))}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function CheckList({ items, empty }) {
  if(!items?.length) return <div style={S.emptyState}>{empty}</div>;
  return items.map((item,i)=>(
    <div key={i} style={S.checkRow}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:16}}>{item.status==='pass'?'✅':item.status==='fail'?'❌':item.status==='warn'?'⚠️':'ℹ️'}</span>
        <div>
          <div style={{fontWeight:600,color:'#fafafa',fontSize:13}}>{item.label}</div>
          {item.detail && <div style={{color:'#71717a',fontSize:12,marginTop:2}}>{item.detail}</div>}
        </div>
      </div>
      <span style={S.badge(statusColor(item.status))}>{item.status}</span>
    </div>
  ));
}

function AuditInput({ q, tabId, setQ, onRun, loading, label, placeholder }) {
  return (
    <div style={S.inputRow}>
      <input
        style={S.input}
        placeholder={placeholder||"Enter URL or domain to audit…"}
        value={q[tabId]||''}
        onChange={e=>setQ(p=>({...p,[tabId]:e.target.value}))}
        onKeyDown={e=>e.key==='Enter'&&onRun()}
      />
      <button style={S.btn} onClick={onRun} disabled={loading}>
        {loading?'Auditing…':label||'Run Audit'}
      </button>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function TechnicalSEOAuditor() {
  const [activeGroup, setActiveGroup] = useState('crawl');
  const [activeTab, setActiveTab] = useState('overview');
  const [q, setQ] = useState({});
  const [form, setForm] = useState({});
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [err, setErr] = useState({});
  const [settings, setSettings] = useState({ crawlDepth:3, maxPages:500, followExternal:false, crawlDelay:500, userAgent:'Googlebot' });
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
      'overview':        API+'/crawl/overview',
      'crawl-errors':    API+'/crawl/errors',
      'index-status':    API+'/crawl/index-status',
      'robots':          API+'/crawl/robots',
      'sitemap':         API+'/crawl/sitemap',
      'log-analysis':    API+'/crawl/log-analysis',
      'titles':          API+'/onpage/titles',
      'meta-desc':       API+'/onpage/meta-descriptions',
      'headings':        API+'/onpage/headings',
      'canonical':       API+'/onpage/canonicals',
      'hreflang':        API+'/onpage/hreflang',
      'structured-data': API+'/onpage/structured-data',
      'core-vitals':     API+'/performance/core-vitals',
      'page-speed':      API+'/performance/page-speed',
      'mobile':          API+'/performance/mobile',
      'images':          API+'/performance/images',
      'resources':       API+'/performance/resources',
      'caching':         API+'/performance/caching',
      'internal-links':  API+'/links/internal',
      'broken-links':    API+'/links/broken',
      'redirects':       API+'/links/redirects',
      'link-depth':      API+'/links/depth',
      'orphan-pages':    API+'/links/orphans',
      'anchor-text':     API+'/links/anchor-text',
      'https':           API+'/security/https',
      'headers':         API+'/security/headers',
      'mixed-content':   API+'/security/mixed-content',
      'malware':         API+'/security/malware',
      'permissions':     API+'/security/permissions',
      'csp':             API+'/security/csp',
      'duplicate':       API+'/content/duplicate',
      'thin-content':    API+'/content/thin',
      'content-gaps':    API+'/content/gaps',
      'readability':     API+'/content/readability',
      'word-count':      API+'/content/word-count',
      'freshness':       API+'/content/freshness',
      'international':   API+'/advanced/international',
      'javascript-seo':  API+'/advanced/javascript-seo',
      'spa-seo':         API+'/advanced/spa-seo',
      'ai-audit':        API+'/advanced/ai-full-audit',
      'audit-settings':  null,
      'world-class':     null,
    };
    const url = endpoints[tab];
    if(!url) { setLoading(l=>({...l,[tab]:false})); return; }
    try {
      const r = await apiFetchJSON(url, {
        method:'POST',
        body: JSON.stringify({
          url: q[tab]||q.overview||'',
          domain: q[tab]||q.overview||'',
          crawlDepth: settings.crawlDepth,
          maxPages: settings.maxPages,
          followExternal: settings.followExternal,
          userAgent: settings.userAgent,
          model: form.aiModel||'gpt-4o-mini',
          ...extraPayload,
        }),
      });
      if(r.ok) setData(d=>({...d,[tab]:r.data||r.results||r}));
      else setErr(e=>({...e,[tab]:r.error||'Audit failed'}));
    } catch(e) { setErr(er=>({...er,[tab]:e.message})); }
    finally { setLoading(l=>({...l,[tab]:false})); }
  }

  async function saveSettings() {
    setLoading(l=>({...l,'save-settings':true}));
    try {
      await apiFetchJSON(API+'/settings', {method:'POST', body:JSON.stringify(settings)});
      showToast('Settings saved');
    } catch(e) { showToast('Failed','#ef4444'); }
    finally { setLoading(l=>({...l,'save-settings':false})); }
  }

  function handleGroupClick(gid) {
    const g = GROUPS.find(x=>x.id===gid);
    if(g) { setActiveGroup(gid); setActiveTab(g.tabs[0].id); }
  }

  // ─── overview tab ──────────────────────────────────────────────────────────

  function renderOverview() {
    const d = data.overview;
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Site Overview Audit</div>
          <AuditInput q={q} tabId="overview" setQ={setQ} onRun={()=>fetchTab('overview')} loading={loading.overview} label="Run Site Audit" placeholder="Enter domain (e.g. example.com)…" />
          {err.overview && <div style={S.errorBox}>{err.overview}</div>}
          {loading.overview ? <div style={S.loading}>Crawling site and running technical audit…</div> :
          d ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}>
                  <div style={{...S.scoreRing(d.score||0), margin:'0 auto 6px'}}>
                    <span style={{fontSize:20,fontWeight:800,color:scoreColor(d.score||0)}}>{d.score||0}</span>
                    <span style={{fontSize:10,color:'#71717a'}}>/ 100</span>
                  </div>
                  <div style={S.metaLabel}>Health Score</div>
                </div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#ef4444'}}>{d.critical||0}</div><div style={S.metaLabel}>Critical Issues</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f97316'}}>{d.warnings||0}</div><div style={S.metaLabel}>Warnings</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#4f46e5'}}>{d.pagesAudited||0}</div><div style={S.metaLabel}>Pages Audited</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>{d.passed||0}</div><div style={S.metaLabel}>Checks Passed</div></div>
              </div>
              <div style={S.sT}>Issues by Category</div>
              {['Crawl & Index','On-Page','Performance','Links','Security','Content'].map((cat,i)=>{
                const catData = d.categories?.[i]||{};
                const pct = catData.score||0;
                return (
                  <div key={cat} style={{marginBottom:12}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:13,fontWeight:600,color:'#fafafa'}}>{cat}</span>
                      <span style={{fontSize:13,color:scoreColor(pct),fontWeight:700}}>{pct}/100</span>
                    </div>
                    <div style={S.progressBar(pct)}>
                      <div style={S.progressFill(pct,scoreColor(pct))} />
                    </div>
                  </div>
                );
              })}
              <div style={S.sT}>Top Issues</div>
              {(d.topIssues||[]).map((iss,i)=>(
                <div key={i} style={S.issueRow}>
                  <div style={S.issueIcon(severityColor(iss.severity))} />
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,color:'#fafafa',fontSize:13}}>{iss.title}</div>
                    <div style={{color:'#71717a',fontSize:12,marginTop:2}}>{iss.description}</div>
                  </div>
                  <span style={S.badge(severityColor(iss.severity))}>{iss.severity}</span>
                </div>
              ))}
            </>
          ) : <div style={S.emptyState}>Enter your domain to run a full technical SEO audit.</div>}
        </div>
      </div>
    );
  }

  // ─── crawl errors ──────────────────────────────────────────────────────────

  function renderCrawlErrors() {
    const d = data['crawl-errors'];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Crawl Errors</div>
          <AuditInput q={q} tabId="crawl-errors" setQ={setQ} onRun={()=>fetchTab('crawl-errors')} loading={loading['crawl-errors']} />
          {err['crawl-errors'] && <div style={S.errorBox}>{err['crawl-errors']}</div>}
          {loading['crawl-errors'] ? <div style={S.loading}>Scanning for crawl errors…</div> :
          d ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#ef4444'}}>{d.notFound||0}</div><div style={S.metaLabel}>404 Not Found</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f97316'}}>{d.serverErrors||0}</div><div style={S.metaLabel}>5xx Errors</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f59e0b'}}>{d.redirectErrors||0}</div><div style={S.metaLabel}>Redirect Chains</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#a855f7'}}>{d.blockedPages||0}</div><div style={S.metaLabel}>Blocked by Robots</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#0ea5e9'}}>{d.noindex||0}</div><div style={S.metaLabel}>Noindex Pages</div></div>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>URL</th>
                    <th style={S.th}>Status Code</th>
                    <th style={S.th}>Error Type</th>
                    <th style={S.th}>Inbound Links</th>
                    <th style={S.th}>First Seen</th>
                  </tr></thead>
                  <tbody>{(d.errors||[]).map((e,i)=>(
                    <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                      <td style={S.td}><span style={{color:'#4f46e5',fontSize:12,fontWeight:600}}>{e.url}</span></td>
                      <td style={S.td}><span style={S.badge(e.status>=500?'#ef4444':e.status>=400?'#f97316':'#f59e0b')}>{e.status}</span></td>
                      <td style={S.td}>{e.type}</td>
                      <td style={S.td}>{e.inboundLinks||0}</td>
                      <td style={S.td}>{e.firstSeen||'—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          ) : <div style={S.emptyState}>Enter a domain to scan for crawl errors.</div>}
        </div>
      </div>
    );
  }

  // ─── index status ──────────────────────────────────────────────────────────

  function renderIndexStatus() {
    const d = data['index-status'];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Index Status</div>
          <AuditInput q={q} tabId="index-status" setQ={setQ} onRun={()=>fetchTab('index-status')} loading={loading['index-status']} />
          {err['index-status'] && <div style={S.errorBox}>{err['index-status']}</div>}
          {loading['index-status'] ? <div style={S.loading}>Checking index status…</div> :
          d ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>{d.indexed||0}</div><div style={S.metaLabel}>Indexed Pages</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f59e0b'}}>{d.noindex||0}</div><div style={S.metaLabel}>Noindex</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#a855f7'}}>{d.canonical||0}</div><div style={S.metaLabel}>Canonical Issues</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#ef4444'}}>{d.blocked||0}</div><div style={S.metaLabel}>Crawl Blocked</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#0ea5e9'}}>{d.total||0}</div><div style={S.metaLabel}>Total URLs</div></div>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>URL</th><th style={S.th}>Index Status</th><th style={S.th}>Reason</th><th style={S.th}>Last Crawled</th><th style={S.th}>Canonical</th></tr></thead>
                  <tbody>{(d.pages||[]).map((p,i)=>(
                    <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                      <td style={S.td}><span style={{color:'#4f46e5',fontSize:12}}>{p.url}</span></td>
                      <td style={S.td}><span style={S.badge(p.status==='indexed'?'#10b981':'#ef4444')}>{p.status}</span></td>
                      <td style={S.td}>{p.reason||'—'}</td>
                      <td style={S.td}>{p.lastCrawled||'—'}</td>
                      <td style={S.td}><span style={{color:p.hasCanonical?'#10b981':'#ef4444',fontSize:12}}>{p.hasCanonical?'✓ Set':'✗ Missing'}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          ) : <div style={S.emptyState}>Enter a domain to check page index status.</div>}
        </div>
      </div>
    );
  }

  // ─── robots ────────────────────────────────────────────────────────────────

  function renderRobots() {
    const d = data.robots;
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Robots.txt Analyzer</div>
          <AuditInput q={q} tabId="robots" setQ={setQ} onRun={()=>fetchTab('robots')} loading={loading.robots} />
          {err.robots && <div style={S.errorBox}>{err.robots}</div>}
          {loading.robots ? <div style={S.loading}>Fetching and analyzing robots.txt…</div> :
          d ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:d.exists?'#10b981':'#ef4444'}}>{d.exists?'Found':'Missing'}</div><div style={S.metaLabel}>Robots.txt</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#4f46e5'}}>{d.userAgents||0}</div><div style={S.metaLabel}>User Agents</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f97316'}}>{d.disallowedPaths||0}</div><div style={S.metaLabel}>Disallow Rules</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#a855f7'}}>{d.sitemapsDeclared||0}</div><div style={S.metaLabel}>Sitemaps Declared</div></div>
              </div>
              <div style={S.sT}>Raw Content</div>
              <pre style={{background:'#0d0d10',border:'1px solid #3f3f46',borderRadius:10,padding:16,fontSize:12,color:'#a1a1aa',overflowX:'auto',marginBottom:16,lineHeight:1.6}}>{d.raw||'# No robots.txt found'}</pre>
              <div style={S.sT}>Issues</div>
              <CheckList items={d.issues} empty="No robots.txt issues found." />
            </>
          ) : <div style={S.emptyState}>Enter a domain to analyze its robots.txt file.</div>}
        </div>
      </div>
    );
  }

  // ─── sitemap ───────────────────────────────────────────────────────────────

  function renderSitemap() {
    const d = data.sitemap;
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>XML Sitemap Analysis</div>
          <AuditInput q={q} tabId="sitemap" setQ={setQ} onRun={()=>fetchTab('sitemap')} loading={loading.sitemap} />
          {err.sitemap && <div style={S.errorBox}>{err.sitemap}</div>}
          {loading.sitemap ? <div style={S.loading}>Validating sitemaps…</div> :
          d ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#4f46e5'}}>{d.sitemapsFound||0}</div><div style={S.metaLabel}>Sitemaps Found</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>{d.validUrls||0}</div><div style={S.metaLabel}>Valid URLs</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#ef4444'}}>{d.brokenUrls||0}</div><div style={S.metaLabel}>Broken URLs</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f59e0b'}}>{d.notIndexed||0}</div><div style={S.metaLabel}>Not Indexed</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#a855f7'}}>{d.notInSitemap||0}</div><div style={S.metaLabel}>Missing from Sitemap</div></div>
              </div>
              <div style={S.sT}>Sitemap Validation</div>
              <CheckList items={d.checks} empty="No sitemap issues detected." />
            </>
          ) : <div style={S.emptyState}>Enter a domain to analyze XML sitemaps.</div>}
        </div>
      </div>
    );
  }

  // ─── core vitals ──────────────────────────────────────────────────────────

  function renderCoreVitals() {
    const d = data['core-vitals'];
    const vitals = [
      {key:'lcp', label:'Largest Contentful Paint', unit:'s', threshold:[2.5,4], description:'Time for largest element to render'},
      {key:'fid', label:'First Input Delay', unit:'ms', threshold:[100,300], description:'Time until page responds to first interaction'},
      {key:'cls', label:'Cumulative Layout Shift', unit:'', threshold:[0.1,0.25], description:'Visual stability — unexpected layout shifts'},
      {key:'fcp', label:'First Contentful Paint', unit:'s', threshold:[1.8,3], description:'Time for first content to appear'},
      {key:'ttfb', label:'Time to First Byte', unit:'ms', threshold:[800,1800], description:'Server response time'},
      {key:'inp', label:'Interaction to Next Paint', unit:'ms', threshold:[200,500], description:'Responsiveness to user interactions'},
    ];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Core Web Vitals</div>
          <AuditInput q={q} tabId="core-vitals" setQ={setQ} onRun={()=>fetchTab('core-vitals')} loading={loading['core-vitals']} placeholder="Enter URL to measure Core Web Vitals…" />
          {err['core-vitals'] && <div style={S.errorBox}>{err['core-vitals']}</div>}
          {loading['core-vitals'] ? <div style={S.loading}>Measuring Core Web Vitals…</div> :
          d ? (
            <>
              <div style={S.vitalsGrid}>
                {vitals.map(v=>{
                  const val = d[v.key];
                  const good = val<=v.threshold[0];
                  const poor = val>v.threshold[1];
                  const color = good?'#10b981':poor?'#ef4444':'#f59e0b';
                  return (
                    <div key={v.key} style={S.vitalCard(color)}>
                      <div style={{fontSize:11,color:'#71717a',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{v.label}</div>
                      <div style={{fontSize:28,fontWeight:800,color,margin:'8px 0 4px'}}>{val!==undefined?val+v.unit:'—'}</div>
                      <span style={S.badge(color)}>{good?'Good':poor?'Poor':'Needs Improvement'}</span>
                      <div style={{fontSize:11,color:'#71717a',marginTop:6}}>{v.description}</div>
                    </div>
                  );
                })}
              </div>
              <div style={S.sT}>Recommendations</div>
              {(d.recommendations||[]).map((rec,i)=>(
                <div key={i} style={S.issueRow}>
                  <div style={S.issueIcon(severityColor(rec.severity))} />
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,color:'#fafafa',fontSize:13}}>{rec.title}</div>
                    <div style={{color:'#71717a',fontSize:12,marginTop:2}}>{rec.description}</div>
                  </div>
                  <span style={S.badge(severityColor(rec.severity))}>{rec.severity}</span>
                </div>
              ))}
            </>
          ) : <div style={S.emptyState}>Enter a URL to measure Core Web Vitals (LCP, FID, CLS, FCP, TTFB, INP).</div>}
        </div>
      </div>
    );
  }

  // ─── titles ────────────────────────────────────────────────────────────────

  function renderTitles() {
    const d = data.titles;
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Title Tag Audit</div>
          <AuditInput q={q} tabId="titles" setQ={setQ} onRun={()=>fetchTab('titles')} loading={loading.titles} />
          {err.titles && <div style={S.errorBox}>{err.titles}</div>}
          {loading.titles ? <div style={S.loading}>Auditing title tags…</div> :
          d ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>{d.optimal||0}</div><div style={S.metaLabel}>Optimal (50-60 chars)</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#ef4444'}}>{d.missing||0}</div><div style={S.metaLabel}>Missing</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f97316'}}>{d.tooLong||0}</div><div style={S.metaLabel}>Too Long (&gt;60)</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f59e0b'}}>{d.tooShort||0}</div><div style={S.metaLabel}>Too Short (&lt;30)</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#a855f7'}}>{d.duplicate||0}</div><div style={S.metaLabel}>Duplicate</div></div>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>URL</th><th style={S.th}>Title</th><th style={S.th}>Length</th><th style={S.th}>Issue</th><th style={S.th}>AI Fix</th></tr></thead>
                  <tbody>{(d.pages||[]).map((p,i)=>(
                    <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                      <td style={S.td}><span style={{color:'#4f46e5',fontSize:11}}>{p.url}</span></td>
                      <td style={S.td}>{p.title||<span style={{color:'#ef4444'}}>Missing</span>}</td>
                      <td style={S.td}><span style={{color:p.length>=30&&p.length<=60?'#10b981':p.length>60?'#f97316':'#ef4444'}}>{p.length||0}</span></td>
                      <td style={S.td}>{p.issue?<span style={S.badge(severityColor(p.issueSeverity||'medium'))}>{p.issue}</span>:'—'}</td>
                      <td style={S.td}><button style={{...S.btn,padding:'4px 10px',fontSize:11,background:'#10b981'}} onClick={()=>aiFixTitle(p)}>✦ Fix</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          ) : <div style={S.emptyState}>Enter a domain to audit all title tags.</div>}
        </div>
      </div>
    );
  }

  // ─── canonical ────────────────────────────────────────────────────────────

  function renderCanonical() {
    const d = data.canonical;
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Canonical Tag Audit</div>
          <AuditInput q={q} tabId="canonical" setQ={setQ} onRun={()=>fetchTab('canonical')} loading={loading.canonical} />
          {err.canonical && <div style={S.errorBox}>{err.canonical}</div>}
          {loading.canonical ? <div style={S.loading}>Checking canonical tags…</div> :
          d ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>{d.correct||0}</div><div style={S.metaLabel}>Correct Canonicals</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#ef4444'}}>{d.missing||0}</div><div style={S.metaLabel}>Missing</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f97316'}}>{d.selfRef||0}</div><div style={S.metaLabel}>Self-Referencing</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#a855f7'}}>{d.chains||0}</div><div style={S.metaLabel}>Canonical Chains</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f59e0b'}}>{d.conflicts||0}</div><div style={S.metaLabel}>Conflicts</div></div>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>URL</th><th style={S.th}>Canonical URL</th><th style={S.th}>Issue</th><th style={S.th}>Severity</th></tr></thead>
                  <tbody>{(d.pages||[]).map((p,i)=>(
                    <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                      <td style={S.td}><span style={{color:'#4f46e5',fontSize:11}}>{p.url}</span></td>
                      <td style={S.td}><span style={{color:'#a1a1aa',fontSize:11}}>{p.canonical||'—'}</span></td>
                      <td style={S.td}>{p.issue||'—'}</td>
                      <td style={S.td}>{p.severity?<span style={S.badge(severityColor(p.severity))}>{p.severity}</span>:'—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          ) : <div style={S.emptyState}>Enter a domain to audit canonical tag implementation.</div>}
        </div>
      </div>
    );
  }

  // ─── structured data ──────────────────────────────────────────────────────

  function renderStructuredData() {
    const d = data['structured-data'];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Structured Data / Schema Markup</div>
          <AuditInput q={q} tabId="structured-data" setQ={setQ} onRun={()=>fetchTab('structured-data')} loading={loading['structured-data']} />
          {err['structured-data'] && <div style={S.errorBox}>{err['structured-data']}</div>}
          {loading['structured-data'] ? <div style={S.loading}>Extracting and validating schema markup…</div> :
          d ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#4f46e5'}}>{d.schemasFound||0}</div><div style={S.metaLabel}>Schemas Found</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>{d.valid||0}</div><div style={S.metaLabel}>Valid</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#ef4444'}}>{d.errors||0}</div><div style={S.metaLabel}>Errors</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f59e0b'}}>{d.warnings||0}</div><div style={S.metaLabel}>Warnings</div></div>
              </div>
              {(d.schemas||[]).map((s,i)=>(
                <div key={i} style={{...S.card,marginBottom:10,padding:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <span style={{fontWeight:700,color:'#fafafa'}}>{s.type}</span>
                    <span style={S.badge(s.isValid?'#10b981':'#ef4444')}>{s.isValid?'Valid':'Invalid'}</span>
                  </div>
                  <div style={{color:'#71717a',fontSize:12,marginBottom:6}}>{s.url}</div>
                  {s.errors?.length ? <div style={{color:'#ef4444',fontSize:12}}>{s.errors.join(', ')}</div> : null}
                  {s.suggestions?.length ? (
                    <div style={{marginTop:6}}>
                      <span style={{...S.sT,marginTop:0}}>Suggestions</span>
                      {s.suggestions.map((sg,j)=><div key={j} style={{color:'#10b981',fontSize:12,marginTop:2}}>✓ {sg}</div>)}
                    </div>
                  ) : null}
                </div>
              ))}
            </>
          ) : <div style={S.emptyState}>Enter a URL to validate structured data and schema markup.</div>}
        </div>
      </div>
    );
  }

  // ─── broken links ─────────────────────────────────────────────────────────

  function renderBrokenLinks() {
    const d = data['broken-links'];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Broken Link Checker</div>
          <AuditInput q={q} tabId="broken-links" setQ={setQ} onRun={()=>fetchTab('broken-links')} loading={loading['broken-links']} />
          {err['broken-links'] && <div style={S.errorBox}>{err['broken-links']}</div>}
          {loading['broken-links'] ? <div style={S.loading}>Checking all links…</div> :
          d ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#ef4444'}}>{d.broken||0}</div><div style={S.metaLabel}>Broken Links</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f97316'}}>{d.redirects||0}</div><div style={S.metaLabel}>Redirects</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>{d.healthy||0}</div><div style={S.metaLabel}>Healthy</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#4f46e5'}}>{d.total||0}</div><div style={S.metaLabel}>Total Checked</div></div>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Broken URL</th><th style={S.th}>Status</th><th style={S.th}>Source Page</th><th style={S.th}>Link Text</th><th style={S.th}>Type</th></tr></thead>
                  <tbody>{(d.links||[]).map((l,i)=>(
                    <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                      <td style={S.td}><span style={{color:'#ef4444',fontSize:11}}>{l.url}</span></td>
                      <td style={S.td}><span style={S.badge('#ef4444')}>{l.status}</span></td>
                      <td style={S.td}><span style={{color:'#4f46e5',fontSize:11}}>{l.sourcePage}</span></td>
                      <td style={S.td}>{l.anchorText||'—'}</td>
                      <td style={S.td}><span style={S.badge(l.type==='internal'?'#4f46e5':'#0ea5e9')}>{l.type}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          ) : <div style={S.emptyState}>Enter a domain to check all links for broken URLs.</div>}
        </div>
      </div>
    );
  }

  // ─── redirects ────────────────────────────────────────────────────────────

  function renderRedirects() {
    const d = data.redirects;
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Redirect Audit</div>
          <AuditInput q={q} tabId="redirects" setQ={setQ} onRun={()=>fetchTab('redirects')} loading={loading.redirects} />
          {err.redirects && <div style={S.errorBox}>{err.redirects}</div>}
          {loading.redirects ? <div style={S.loading}>Analyzing redirects…</div> :
          d ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#4f46e5'}}>{d.total||0}</div><div style={S.metaLabel}>Total Redirects</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>{d.r301||0}</div><div style={S.metaLabel}>301 Permanent</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f59e0b'}}>{d.r302||0}</div><div style={S.metaLabel}>302 Temporary</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#ef4444'}}>{d.chains||0}</div><div style={S.metaLabel}>Redirect Chains</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f97316'}}>{d.loops||0}</div><div style={S.metaLabel}>Redirect Loops</div></div>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Source URL</th><th style={S.th}>Target URL</th><th style={S.th}>Type</th><th style={S.th}>Chain Length</th><th style={S.th}>Issue</th></tr></thead>
                  <tbody>{(d.redirects||[]).map((r,i)=>(
                    <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                      <td style={S.td}><span style={{color:'#a1a1aa',fontSize:11}}>{r.from}</span></td>
                      <td style={S.td}><span style={{color:'#4f46e5',fontSize:11}}>{r.to}</span></td>
                      <td style={S.td}><span style={S.badge(r.type===301?'#10b981':'#f59e0b')}>{r.type}</span></td>
                      <td style={S.td}>{r.chainLength||1}</td>
                      <td style={S.td}>{r.issue?<span style={S.badge(severityColor(r.issueSeverity||'medium'))}>{r.issue}</span>:'—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          ) : <div style={S.emptyState}>Enter a domain to analyze all redirects.</div>}
        </div>
      </div>
    );
  }

  // ─── HTTPS ────────────────────────────────────────────────────────────────

  function renderHttps() {
    const d = data.https;
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>HTTPS / TLS Security</div>
          <AuditInput q={q} tabId="https" setQ={setQ} onRun={()=>fetchTab('https')} loading={loading.https} />
          {err.https && <div style={S.errorBox}>{err.https}</div>}
          {loading.https ? <div style={S.loading}>Checking HTTPS and TLS configuration…</div> :
          d ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:d.hasHttps?'#10b981':'#ef4444'}}>{d.hasHttps?'✓ Secure':'✗ Insecure'}</div><div style={S.metaLabel}>HTTPS Status</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#4f46e5'}}>{d.tlsVersion||'—'}</div><div style={S.metaLabel}>TLS Version</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:d.certValid?'#10b981':'#ef4444'}}>{d.certDaysLeft||0} days</div><div style={S.metaLabel}>Cert Expiry</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#a855f7'}}>{d.hsts?'Enabled':'Disabled'}</div><div style={S.metaLabel}>HSTS</div></div>
              </div>
              <div style={S.sT}>TLS Checks</div>
              <CheckList items={d.checks} empty="No TLS issues found." />
            </>
          ) : <div style={S.emptyState}>Enter a domain to audit HTTPS and TLS configuration.</div>}
        </div>
      </div>
    );
  }

  // ─── duplicate content ────────────────────────────────────────────────────

  function renderDuplicate() {
    const d = data.duplicate;
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Duplicate Content Detector</div>
          <AuditInput q={q} tabId="duplicate" setQ={setQ} onRun={()=>fetchTab('duplicate')} loading={loading.duplicate} />
          {err.duplicate && <div style={S.errorBox}>{err.duplicate}</div>}
          {loading.duplicate ? <div style={S.loading}>Detecting duplicate and near-duplicate content…</div> :
          d ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#ef4444'}}>{d.exactDuplicates||0}</div><div style={S.metaLabel}>Exact Duplicates</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f97316'}}>{d.nearDuplicates||0}</div><div style={S.metaLabel}>Near-Duplicates</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f59e0b'}}>{d.duplicateTitles||0}</div><div style={S.metaLabel}>Duplicate Titles</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#a855f7'}}>{d.duplicateMeta||0}</div><div style={S.metaLabel}>Duplicate Meta</div></div>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>URL 1</th><th style={S.th}>URL 2</th><th style={S.th}>Similarity</th><th style={S.th}>Type</th><th style={S.th}>AI Fix</th></tr></thead>
                  <tbody>{(d.duplicates||[]).map((dp,i)=>(
                    <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                      <td style={S.td}><span style={{color:'#4f46e5',fontSize:11}}>{dp.url1}</span></td>
                      <td style={S.td}><span style={{color:'#4f46e5',fontSize:11}}>{dp.url2}</span></td>
                      <td style={S.td}><span style={{color:'#ef4444',fontWeight:700}}>{dp.similarity}%</span></td>
                      <td style={S.td}><span style={S.badge(severityColor(dp.type==='exact'?'critical':'high'))}>{dp.type}</span></td>
                      <td style={S.td}><button style={{...S.btn,padding:'4px 10px',fontSize:11,background:'#10b981'}} onClick={()=>aiAction('consolidate-pages',dp)}>✦ Consolidate</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          ) : <div style={S.emptyState}>Enter a domain to detect duplicate and near-duplicate content.</div>}
        </div>
      </div>
    );
  }

  // ─── AI full audit ────────────────────────────────────────────────────────

  function renderAiAudit() {
    const d = data['ai-audit'];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>✦ AI Full Technical Audit</div>
          <p style={{color:'#71717a',fontSize:13,marginTop:0}}>AI-powered comprehensive audit covering all technical SEO dimensions with prioritized action plan and estimated impact.</p>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Domain to audit…" value={q['ai-audit']||''} onChange={e=>setQ(p=>({...p,'ai-audit':e.target.value}))} />
            <select style={S.select} value={form.aiModel||'gpt-4o'} onChange={e=>setForm(p=>({...p,aiModel:e.target.value}))}>
              <option value="gpt-4o-mini">GPT-4o Mini (2 credits)</option>
              <option value="gpt-4o">GPT-4o (4 credits)</option>
              <option value="gpt-4">GPT-4 (6 credits)</option>
            </select>
            <button style={{...S.btn,background:'#10b981'}} onClick={()=>fetchTab('ai-audit')} disabled={loading['ai-audit']}>
              {loading['ai-audit']?'Generating…':'✦ AI Full Audit'}
            </button>
          </div>
          {err['ai-audit'] && <div style={S.errorBox}>{err['ai-audit']}</div>}
          {loading['ai-audit'] ? <div style={S.loading}>AI is analyzing all technical SEO dimensions…</div> :
          d ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:scoreColor(d.overallScore||0)}}>{d.overallScore||0}</div><div style={S.metaLabel}>Overall Score</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#ef4444'}}>{d.criticalCount||0}</div><div style={S.metaLabel}>Critical Issues</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>+{d.estimatedTrafficGain||0}%</div><div style={S.metaLabel}>Est. Traffic Gain</div></div>
              </div>
              <div style={S.sT}>Prioritized Action Plan</div>
              {(d.actions||[]).map((a,i)=>(
                <div key={i} style={{...S.card,marginBottom:10,padding:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                        <span style={{background:'#4f46e546',color:'#818cf8',borderRadius:4,padding:'2px 7px',fontSize:11,fontWeight:700}}>#{i+1}</span>
                        <span style={{fontWeight:700,color:'#fafafa',fontSize:13}}>{a.title}</span>
                      </div>
                      <div style={{color:'#71717a',fontSize:12,marginBottom:6}}>{a.description}</div>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        <span style={S.badge(severityColor(a.priority))}>{a.priority} priority</span>
                        <span style={S.badge('#10b981')}>+{a.trafficImpact}% traffic</span>
                        <span style={S.badge('#0ea5e9')}>{a.effort} effort</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : <div style={S.emptyState}>Enter a domain to run an AI-powered comprehensive technical audit.</div>}
        </div>
      </div>
    );
  }

  // ─── settings tab ─────────────────────────────────────────────────────────

  function renderSettings() {
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Audit Settings</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16}}>
            <div>
              <div style={S.label}>Crawl Depth</div>
              <select style={S.select} value={settings.crawlDepth} onChange={e=>setSettings(s=>({...s,crawlDepth:parseInt(e.target.value)}))}>
                <option value={1}>1 (Homepage only)</option>
                <option value={2}>2 levels deep</option>
                <option value={3}>3 levels deep</option>
                <option value={5}>5 levels deep</option>
                <option value={10}>10 levels deep</option>
              </select>
            </div>
            <div>
              <div style={S.label}>Max Pages to Crawl</div>
              <select style={S.select} value={settings.maxPages} onChange={e=>setSettings(s=>({...s,maxPages:parseInt(e.target.value)}))}>
                <option value={100}>100 pages</option>
                <option value={500}>500 pages</option>
                <option value={1000}>1,000 pages</option>
                <option value={5000}>5,000 pages</option>
                <option value={10000}>10,000 pages</option>
              </select>
            </div>
            <div>
              <div style={S.label}>User Agent</div>
              <select style={S.select} value={settings.userAgent} onChange={e=>setSettings(s=>({...s,userAgent:e.target.value}))}>
                <option value="Googlebot">Googlebot</option>
                <option value="Bingbot">Bingbot</option>
                <option value="AhrefsBot">AhrefsBot</option>
                <option value="Custom">Custom Crawler</option>
              </select>
            </div>
            <div>
              <div style={S.label}>Crawl Delay (ms)</div>
              <input style={S.input} type="number" value={settings.crawlDelay} onChange={e=>setSettings(s=>({...s,crawlDelay:parseInt(e.target.value)||500}))} min={0} max={5000} />
            </div>
            <div>
              <div style={S.label}>Default AI Model</div>
              <select style={S.select} value={form.aiModel||'gpt-4o-mini'} onChange={e=>setForm(p=>({...p,aiModel:e.target.value}))}>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4">GPT-4</option>
              </select>
            </div>
            <div>
              <div style={S.label}>Follow External Links</div>
              <select style={S.select} value={settings.followExternal?'yes':'no'} onChange={e=>setSettings(s=>({...s,followExternal:e.target.value==='yes'}))}>
                <option value="no">No (internal only)</option>
                <option value="yes">Yes (check external)</option>
              </select>
            </div>
          </div>
          <button style={{...S.btn,marginTop:20}} onClick={saveSettings} disabled={loading['save-settings']}>{loading['save-settings']?'Saving…':'Save Settings'}</button>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Scheduled Audits</div>
          <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Set up automatic recurring technical SEO audits with email reports.</p>
          <div style={S.inputRow}>
            <select style={S.select} value={form.scheduleFreq||'weekly'} onChange={e=>setForm(p=>({...p,scheduleFreq:e.target.value}))}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <input style={S.input} placeholder="Email for reports…" value={form.scheduleEmail||''} onChange={e=>setForm(p=>({...p,scheduleEmail:e.target.value}))} />
            <button style={S.btn} onClick={()=>showToast('Scheduled audit created')}>Schedule Audit</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── world-class tab ──────────────────────────────────────────────────────

  function renderWorldClass() {
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>✦ World-Class Enterprise Features</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16}}>
            {[
              {icon:'🤖',title:'AI-Powered Issue Triage',desc:'Automatically prioritize issues by revenue impact, fix effort, and ranking uplift potential using GPT-4 analysis.'},
              {icon:'📊',title:'Competitive Benchmarking',desc:'Compare your technical health scores against top competitors to identify the biggest gaps.'},
              {icon:'🔄',title:'Automated Fix Workflows',desc:'One-click fix suggestions with code snippets, PR templates, and CMS-specific implementation guides.'},
              {icon:'📈',title:'Historical Trending',desc:'Track how your technical health score changes over time and correlate improvements with ranking changes.'},
              {icon:'🔔',title:'Smart Alerting',desc:'AI-driven alerts that only fire when an issue is likely to impact rankings — no noise.'},
              {icon:'🌐',title:'JavaScript Rendering',desc:'Full headless Chrome rendering to audit SPAs and JavaScript-heavy pages as Googlebot sees them.'},
              {icon:'👥',title:'Team Collaboration',desc:'Assign issues to team members, track fix status, and run automated re-checks on completion.'},
              {icon:'🔗',title:'API & Integrations',desc:'Connect to GSC, GA4, Ahrefs, Semrush, Screaming Frog, Jira, Linear, and GitHub via REST API.'},
            ].map((f,i)=>(
              <div key={i} style={S.miniCard}>
                <div style={{fontSize:28,marginBottom:8}}>{f.icon}</div>
                <div style={{fontWeight:700,color:'#fafafa',marginBottom:4}}>{f.title}</div>
                <div style={{fontSize:12,color:'#71717a',lineHeight:1.5}}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Integration Status</div>
          {[
            {name:'Google Search Console',status:'connected',color:'#10b981'},
            {name:'Google Analytics 4',status:'connected',color:'#10b981'},
            {name:'Ahrefs',status:'disconnected',color:'#52525b'},
            {name:'Semrush',status:'disconnected',color:'#52525b'},
            {name:'Screaming Frog',status:'disconnected',color:'#52525b'},
            {name:'Jira',status:'disconnected',color:'#52525b'},
          ].map((int,i)=>(
            <div key={i} style={S.checkRow}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:int.color}} />
                <span style={{fontWeight:600,color:'#fafafa',fontSize:13}}>{int.name}</span>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <span style={S.badge(int.color)}>{int.status}</span>
                <button style={{...S.btn,padding:'4px 12px',fontSize:11,background:'#27272a'}}>{int.status==='connected'?'Manage':'Connect'}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── generic tab ──────────────────────────────────────────────────────────

  function renderGenericTab(tabId, title, desc) {
    const d = data[tabId];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>{title}</div>
          <p style={{color:'#71717a',fontSize:13,marginTop:0}}>{desc}</p>
          <AuditInput q={q} tabId={tabId} setQ={setQ} onRun={()=>fetchTab(tabId)} loading={loading[tabId]} />
          {err[tabId] && <div style={S.errorBox}>{err[tabId]}</div>}
          {loading[tabId] ? <div style={S.loading}>Analyzing {title.toLowerCase()}…</div> :
          d?.issues?.length ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#ef4444'}}>{d.issues.filter(x=>x.severity==='critical').length}</div><div style={S.metaLabel}>Critical</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f97316'}}>{d.issues.filter(x=>x.severity==='high').length}</div><div style={S.metaLabel}>High</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f59e0b'}}>{d.issues.filter(x=>x.severity==='medium').length}</div><div style={S.metaLabel}>Medium</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>{d.issues.filter(x=>x.severity==='low').length}</div><div style={S.metaLabel}>Low / Info</div></div>
              </div>
              {d.issues.map((iss,i)=>(
                <div key={i} style={S.issueRow}>
                  <div style={S.issueIcon(severityColor(iss.severity))} />
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,color:'#fafafa',fontSize:13}}>{iss.title}</div>
                    <div style={{color:'#71717a',fontSize:12,marginTop:2}}>{iss.description}</div>
                    {iss.url && <div style={{color:'#4f46e5',fontSize:11,marginTop:2}}>{iss.url}</div>}
                  </div>
                  <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}}>
                    <span style={S.badge(severityColor(iss.severity))}>{iss.severity}</span>
                    <button style={{...S.btn,padding:'4px 10px',fontSize:11,background:'#10b981'}} onClick={()=>aiAction('fix-issue',iss)}>✦ Fix</button>
                  </div>
                </div>
              ))}
            </>
          ) : d ? <div style={S.emptyState}>No issues found for {title.toLowerCase()}.</div>
            : <div style={S.emptyState}>Enter a domain or URL to audit {title.toLowerCase()}.</div>}
        </div>
      </div>
    );
  }

  // ─── action helpers ───────────────────────────────────────────────────────

  async function aiFixTitle(page) {
    showToast('Generating AI title fix…');
  }

  async function aiAction(action, payload) {
    showToast('AI action: ' + action);
  }

  // ─── tab renderer ─────────────────────────────────────────────────────────

  function renderTab() {
    switch(activeTab) {
      case 'overview':        return renderOverview();
      case 'crawl-errors':   return renderCrawlErrors();
      case 'index-status':   return renderIndexStatus();
      case 'robots':          return renderRobots();
      case 'sitemap':         return renderSitemap();
      case 'log-analysis':   return renderGenericTab('log-analysis','Log File Analysis','Analyze server log files to understand how search engines crawl your site.');
      case 'titles':          return renderTitles();
      case 'meta-desc':      return renderGenericTab('meta-desc','Meta Descriptions','Audit all meta descriptions for length, uniqueness, and relevance.');
      case 'headings':        return renderGenericTab('headings','Heading Structure','Audit H1-H6 hierarchy, missing H1s, duplicate H1s, and keyword usage.');
      case 'canonical':       return renderCanonical();
      case 'hreflang':        return renderGenericTab('hreflang','Hreflang Tags','Check hreflang implementation for international and multilingual sites.');
      case 'structured-data': return renderStructuredData();
      case 'core-vitals':    return renderCoreVitals();
      case 'page-speed':     return renderGenericTab('page-speed','Page Speed','Analyze page speed scores, time to interactive, and blocking resources.');
      case 'mobile':          return renderGenericTab('mobile','Mobile Usability','Check mobile viewport, tap targets, font sizes, and responsive design issues.');
      case 'images':          return renderGenericTab('images','Image Optimization','Audit image sizes, formats (WebP/AVIF), lazy loading, and alt text.');
      case 'resources':       return renderGenericTab('resources','JS / CSS Optimization','Analyze render-blocking scripts, CSS coverage, and bundle sizes.');
      case 'caching':         return renderGenericTab('caching','Caching & CDN','Check cache-control headers, CDN coverage, and static asset caching policies.');
      case 'internal-links':  return renderGenericTab('internal-links','Internal Links','Analyze internal link distribution, anchor text diversity, and PageRank flow.');
      case 'broken-links':   return renderBrokenLinks();
      case 'redirects':       return renderRedirects();
      case 'link-depth':     return renderGenericTab('link-depth','Link Depth','Identify pages buried deep in the site architecture with excessive click depth.');
      case 'orphan-pages':   return renderGenericTab('orphan-pages','Orphan Pages','Find pages with no internal links pointing to them — invisible to crawlers.');
      case 'anchor-text':    return renderGenericTab('anchor-text','Anchor Text','Analyze anchor text distribution, over-optimized anchors, and generic text.');
      case 'https':           return renderHttps();
      case 'headers':         return renderGenericTab('headers','Security Headers','Check X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy.');
      case 'mixed-content':  return renderGenericTab('mixed-content','Mixed Content','Find HTTP resources loaded on HTTPS pages that trigger browser warnings.');
      case 'malware':         return renderGenericTab('malware','Malware Scan','Scan for injected scripts, suspicious outbound links, and known malware signatures.');
      case 'permissions':     return renderGenericTab('permissions','Permissions Policy','Audit Permissions-Policy header for camera, microphone, geolocation controls.');
      case 'csp':             return renderGenericTab('csp','Content Security Policy','Analyze CSP header to prevent XSS attacks and unauthorized resource loading.');
      case 'duplicate':       return renderDuplicate();
      case 'thin-content':   return renderGenericTab('thin-content','Thin Content','Find pages with insufficient content that may be devalued by search engines.');
      case 'content-gaps':   return renderGenericTab('content-gaps','Content Gaps','Identify topics your competitors rank for that you have no content covering.');
      case 'readability':     return renderGenericTab('readability','Readability','Measure readability scores (Flesch-Kincaid, Gunning Fog) across your content.');
      case 'word-count':     return renderGenericTab('word-count','Word Count','Audit page word counts and compare to top-ranking competitors for each keyword.');
      case 'freshness':       return renderGenericTab('freshness','Content Freshness','Identify stale content that needs updating to maintain rankings.');
      case 'international':   return renderGenericTab('international','International SEO','Audit hreflang, geo-targeting, language URLs, and regional content strategies.');
      case 'javascript-seo': return renderGenericTab('javascript-seo','JavaScript SEO','Analyze how Googlebot renders your JavaScript — client-side vs server-side.');
      case 'spa-seo':        return renderGenericTab('spa-seo','SPA / PWA SEO','Check React, Vue, Angular apps for SEO-critical rendering and meta tag issues.');
      case 'ai-audit':       return renderAiAudit();
      case 'audit-settings': return renderSettings();
      case 'world-class':    return renderWorldClass();
      default:                return <div style={S.emptyState}>Select a tab to begin.</div>;
    }
  }

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div style={S.root}>
      <div style={S.header}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16}}>
          <div>
            <h1 style={S.title}>Technical SEO Auditor</h1>
            <p style={S.subtitle}>Enterprise technical SEO — crawl analysis, Core Web Vitals, security, content quality & AI-powered recommendations</p>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={{...S.btn,background:'#27272a'}} onClick={()=>setModal('quick-audit')}>Quick Audit</button>
            <button style={{...S.btn,background:'#10b981'}} onClick={()=>{ setActiveGroup('advanced'); setActiveTab('ai-audit'); }}>✦ AI Full Audit</button>
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

      {modal === 'quick-audit' && (
        <div style={{position:'fixed',inset:0,background:'#000a',zIndex:9998,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setModal(null)}>
          <div style={{...S.card,minWidth:360,maxWidth:500}} onClick={e=>e.stopPropagation()}>
            <div style={S.cardTitle}>Quick Audit</div>
            <input style={{...S.input,marginBottom:12}} placeholder="Domain to audit…" value={q['quick-audit']||''} onChange={e=>setQ(p=>({...p,'quick-audit':e.target.value}))} autoFocus />
            <div style={{display:'flex',gap:8}}>
              <button style={S.btn} onClick={()=>{
                setQ(p=>({...p,overview:p['quick-audit']}));
                setActiveGroup('crawl'); setActiveTab('overview');
                fetchTab('overview'); setModal(null);
              }}>Run Audit</button>
              <button style={{...S.btn,background:'#27272a'}} onClick={()=>setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync(OUT, code, 'utf8');
const lines = code.split('\n').length;
const bytes = Buffer.byteLength(code, 'utf8');
console.log(`\nWrote: ${OUT}`);
console.log(`Lines: ${lines.toLocaleString()}`);
console.log(`Bytes: ${bytes.toLocaleString()} (${(bytes/1024).toFixed(1)} KB)`);
console.log('Done!');
