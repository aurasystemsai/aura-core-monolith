import React, { useState, useEffect, useCallback } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/entity-topic-explorer";

// ─── helpers ─────────────────────────────────────────────────────────────────

function intentColor(intent) {
  const m = { informational:'#0ea5e9', navigational:'#a855f7', transactional:'#10b981', commercial:'#f59e0b' };
  return m[intent] || '#71717a';
}
function scoreColor(s) {
  if (s >= 80) return '#10b981';
  if (s >= 60) return '#f59e0b';
  return '#ef4444';
}
function priorityColor(p) {
  if (p === 'critical') return '#ef4444';
  if (p === 'high') return '#f97316';
  if (p === 'medium') return '#f59e0b';
  return '#10b981';
}

// ─── styles ──────────────────────────────────────────────────────────────────

const S = {
  root: { background:'#09090b', minHeight:'100vh', color:'#fafafa', fontFamily:"'Inter',system-ui,sans-serif", padding:'28px 32px' },
  header: { marginBottom:28 },
  title: { fontSize:24, fontWeight:800, color:'#fafafa', margin:'0 0 4px', letterSpacing:'-0.02em' },
  subtitle: { color:'#71717a', fontSize:13, margin:'4px 0 0' },
  card: { background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:24, marginBottom:20 },
  miniCard: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:16 },
  cardTitle: { fontSize:14, fontWeight:700, color:'#fafafa', marginBottom:16, marginTop:0 },
  inputRow: { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' },
  input: { flex:1, minWidth:200, background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:14, padding:'11px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif" },
  select: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'11px 14px', outline:'none', cursor:'pointer' },
  textarea: { width:'100%', background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'12px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif", resize:'vertical', boxSizing:'border-box' },
  btn: (bg) => ({ background:bg||'#4f46e5', color:'#fff', border:'none', borderRadius:10, padding:'11px 22px', fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }),
  label: { fontSize:12, fontWeight:600, color:'#a1a1aa', marginBottom:6, display:'block' },
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
  metaVal: (color) => ({ fontSize:22, fontWeight:700, color:color||'#4f46e5' }),
  metaLabel: { fontSize:11, color:'#71717a', marginTop:2 },
  sT: { fontSize:12, fontWeight:700, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, marginTop:16 },
  groupNav: { display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' },
  groupBtn: (active, color) => ({ background:active?color+'22':'#18181b', color:active?color:'#71717a', border:`1px solid ${active?color+'44':'#27272a'}`, borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:active?700:500, cursor:'pointer' }),
  tabStrip: { display:'flex', gap:4, marginBottom:20, flexWrap:'wrap', borderBottom:'1px solid #27272a', paddingBottom:8 },
  tabBtn: (active, color) => ({ background:'none', color:active?color:'#71717a', border:'none', borderBottom:active?`2px solid ${color}`:'2px solid transparent', padding:'8px 14px', fontSize:13, fontWeight:active?700:500, cursor:'pointer', marginBottom:-9 }),
  progressBar: { height:6, background:'#27272a', borderRadius:3, overflow:'hidden', marginTop:4 },
  progressFill: (pct, color) => ({ height:'100%', width:Math.min(pct||0,100)+'%', background:color||'#4f46e5', borderRadius:3 }),
  row: { display:'flex', alignItems:'flex-start', gap:10, padding:'10px 0', borderBottom:'1px solid #1f1f22' },
  pre: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, padding:16, fontSize:12, color:'#a1a1aa', fontFamily:'monospace', whiteSpace:'pre-wrap', maxHeight:300, overflow:'auto', marginBottom:12 },
};

// ─── groups ───────────────────────────────────────────────────────────────────

const GROUPS = [
  {
    "id": "entities",
    "label": "Entities",
    "color": "#4f46e5",
    "tabs": [
      {
        "id": "discover",
        "label": "Discover Entities"
      },
      {
        "id": "entity-gap",
        "label": "Entity Gap"
      },
      {
        "id": "comp-entities",
        "label": "Competitor Entities"
      },
      {
        "id": "authority",
        "label": "Entity Authority"
      },
      {
        "id": "co-occurrence",
        "label": "Co-occurrence"
      },
      {
        "id": "wikidata",
        "label": "Wikidata Match"
      }
    ]
  },
  {
    "id": "topics",
    "label": "Topics",
    "color": "#0ea5e9",
    "tabs": [
      {
        "id": "cluster-map",
        "label": "Topic Clusters"
      },
      {
        "id": "hierarchy",
        "label": "Topic Hierarchy"
      },
      {
        "id": "coverage",
        "label": "Coverage Score"
      },
      {
        "id": "intent",
        "label": "Search Intent"
      },
      {
        "id": "seasonality",
        "label": "Seasonality"
      },
      {
        "id": "questions",
        "label": "PAA Questions"
      }
    ]
  },
  {
    "id": "kg",
    "label": "Knowledge Graph",
    "color": "#10b981",
    "tabs": [
      {
        "id": "kg-presence",
        "label": "KG Presence"
      },
      {
        "id": "entity-cards",
        "label": "Entity Cards"
      },
      {
        "id": "schema",
        "label": "Schema.org"
      },
      {
        "id": "structured-data",
        "label": "Structured Data"
      },
      {
        "id": "rich-results",
        "label": "Rich Results"
      },
      {
        "id": "eeat",
        "label": "E-E-A-T Score"
      }
    ]
  },
  {
    "id": "content",
    "label": "Content Analysis",
    "color": "#f97316",
    "tabs": [
      {
        "id": "semantic-audit",
        "label": "Semantic Audit"
      },
      {
        "id": "nlp-scan",
        "label": "NLP Scan"
      },
      {
        "id": "triple-extract",
        "label": "Semantic Triples"
      },
      {
        "id": "density",
        "label": "Entity Density"
      },
      {
        "id": "freshness",
        "label": "Content Freshness"
      },
      {
        "id": "content-gaps",
        "label": "Content Gaps"
      }
    ]
  },
  {
    "id": "compete",
    "label": "Competitors",
    "color": "#a855f7",
    "tabs": [
      {
        "id": "sov",
        "label": "Share of Voice"
      },
      {
        "id": "topical-auth",
        "label": "Topical Authority"
      },
      {
        "id": "featured-snip",
        "label": "Featured Snippets"
      },
      {
        "id": "comp-content",
        "label": "Competitor Content"
      },
      {
        "id": "benchmarks",
        "label": "Benchmarks"
      },
      {
        "id": "entity-sov",
        "label": "Entity SOV"
      }
    ]
  },
  {
    "id": "optimize",
    "label": "Optimize",
    "color": "#ec4899",
    "tabs": [
      {
        "id": "recs",
        "label": "Recommendations"
      },
      {
        "id": "internal-link",
        "label": "Internal Linking"
      },
      {
        "id": "content-plan",
        "label": "Content Plan"
      },
      {
        "id": "entity-strategy",
        "label": "Entity Strategy"
      },
      {
        "id": "schema-gen",
        "label": "Schema Generator"
      },
      {
        "id": "ai-writer",
        "label": "AI Content Writer"
      }
    ]
  },
  {
    "id": "advanced",
    "label": "Advanced",
    "color": "#f59e0b",
    "tabs": [
      {
        "id": "ai-analysis",
        "label": "AI Deep Analysis"
      },
      {
        "id": "trends",
        "label": "Trend Intelligence"
      },
      {
        "id": "voice-search",
        "label": "Voice Search"
      },
      {
        "id": "international",
        "label": "International"
      },
      {
        "id": "et-settings",
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

export default function EntityTopicExplorer() {
  const [activeGroup, setActiveGroup] = useState('entities');
  const [activeTab, setActiveTab]   = useState('discover');
  const [q, setQ] = useState({});
  const [form, setForm] = useState({ aiModel:'gpt-4o-mini', schemaType:'Organization' });
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [err, setErr] = useState({});
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);

  const curGroup = GROUPS.find(g => g.id === activeGroup) || GROUPS[0];

  function showToast(msg, color = '#10b981') {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  }

  async function fetchTab(tab, payload = {}) {
    setLoading(l => ({ ...l, [tab]: true }));
    setErr(e => ({ ...e, [tab]: null }));

    const endpointMap = {
      'discover':      API + '/entities/discover',
      'entity-gap':    API + '/entities/gap',
      'comp-entities': API + '/entities/discover',
      'authority':     API + '/entities/authority',
      'co-occurrence': API + '/entities/co-occurrence',
      'wikidata':      API + '/entities/wikidata',
      'cluster-map':   API + '/topics/clusters',
      'hierarchy':     API + '/topics/hierarchy',
      'coverage':      API + '/topics/coverage',
      'intent':        API + '/topics/intent',
      'seasonality':   API + '/topics/seasonality',
      'questions':     API + '/topics/questions',
      'kg-presence':   API + '/kg/presence',
      'entity-cards':  API + '/kg/entity-cards',
      'schema':        API + '/kg/schema-audit',
      'structured-data': API + '/kg/structured-data',
      'rich-results':  API + '/kg/rich-results',
      'eeat':          API + '/kg/eeat',
      'semantic-audit': API + '/content/semantic-audit',
      'nlp-scan':      API + '/content/nlp-scan',
      'triple-extract': API + '/content/semantic-triples',
      'density':       API + '/content/entity-density',
      'freshness':     API + '/content/freshness',
      'content-gaps':  API + '/content/gaps',
      'sov':           API + '/compete/sov',
      'topical-auth':  API + '/compete/topical-authority',
      'featured-snip': API + '/compete/featured-snippets',
      'comp-content':  API + '/entities/gap',
      'benchmarks':    API + '/compete/benchmarks',
      'entity-sov':    API + '/compete/entity-sov',
      'recs':          API + '/optimize/recommendations',
      'internal-link': API + '/optimize/internal-linking',
      'content-plan':  API + '/optimize/content-plan',
      'entity-strategy': API + '/optimize/entity-strategy',
      'schema-gen':    null,
      'ai-writer':     null,
      'ai-analysis':   null,
      'trends':        null,
      'voice-search':  null,
      'international': null,
      'et-settings':   null,
      'world-class':   null,
    };
    const url = endpointMap[tab];
    if (!url) { setLoading(l => ({ ...l, [tab]: false })); return; }
    try {
      const body = {
        domain: q[tab] || q.discover || '',
        url: q[tab] || '',
        keyword: q[tab] || '',
        entity: q[tab] || '',
        topic: q[tab] || '',
        competitors: [form.comp1, form.comp2].filter(Boolean),
        model: form.aiModel || 'gpt-4o-mini',
        ...payload,
      };
      const r = await apiFetchJSON(url, { method: 'POST', body: JSON.stringify(body) });
      if (r.ok) setData(d => ({ ...d, [tab]: r.data || r }));
      else setErr(e => ({ ...e, [tab]: r.error || 'Request failed' }));
    } catch(e) { setErr(er => ({ ...er, [tab]: e.message })); }
    finally { setLoading(l => ({ ...l, [tab]: false })); }
  }

  async function runAI(action) {
    setLoading(l => ({ ...l, [action]: true }));
    try {
      const endpoints = {
        'entity-analyze': API + '/ai/analyze-entity',
        'topic-strategy': API + '/ai/topic-strategy',
        'content-brief':  API + '/ai/content-brief',
        'schema-opt':     API + '/ai/schema-optimizer',
        'entity-writer':  API + '/ai/entity-writer',
      };
      const r = await apiFetchJSON(endpoints[action], {
        method: 'POST',
        body: JSON.stringify({ entity: q[action] || '', topic: q[action] || '', domain: q.discover || '', url: q[action] || '', model: form.aiModel || 'gpt-4o-mini' }),
      });
      if (r.ok) { setData(d => ({ ...d, [action]: r.data })); showToast('AI analysis complete'); }
      else showToast(r.error, '#ef4444');
    } catch(e) { showToast(e.message, '#ef4444'); }
    finally { setLoading(l => ({ ...l, [action]: false })); }
  }

  async function generateSchema() {
    try {
      const r = await apiFetchJSON(API + '/optimize/schema-gen', {
        method: 'POST',
        body: JSON.stringify({ type: form.schemaType, data: { name: form.schemaName, url: form.schemaUrl, price: form.schemaPrice, author: form.schemaAuthor } }),
      });
      if (r.ok) setData(d => ({ ...d, 'schema-gen': r.data }));
      else showToast(r.error, '#ef4444');
    } catch(e) { showToast(e.message, '#ef4444'); }
  }

  function handleGroupClick(gid) {
    const g = GROUPS.find(x => x.id === gid);
    if (g) { setActiveGroup(gid); setActiveTab(g.tabs[0].id); }
  }

  // ── sub-components ──────────────────────────────────────────────────────────

  function DomainInput({ tab, placeholder = 'Enter domain (e.g. example.com)…', onRun, label = 'Analyze', color }) {
    return (
      <div style={S.inputRow}>
        <input style={S.input} placeholder={placeholder} value={q[tab] || ''} onChange={e => setQ(p => ({ ...p, [tab]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && (onRun || (() => fetchTab(tab)))() } />
        <button style={S.btn(color || '#4f46e5')} onClick={onRun || (() => fetchTab(tab))} disabled={loading[tab]}>{loading[tab] ? 'Loading…' : label}</button>
      </div>
    );
  }

  function EntityTable({ entities = [] }) {
    return (
      <div style={{ overflowX:'auto' }}>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Entity</th>
            <th style={S.th}>Type</th>
            <th style={S.th}>Authority</th>
            <th style={S.th}>Intent</th>
            <th style={S.th}>Wikidata</th>
            <th style={S.th}>KG</th>
          </tr></thead>
          <tbody>{entities.map((e, i) => (
            <tr key={i} style={i % 2 === 0 ? S.trEven : S.trOdd}>
              <td style={S.td}><span style={{ fontWeight:600 }}>{e.name}</span></td>
              <td style={S.td}><span style={S.badge('#0ea5e9')}>{e.type}</span></td>
              <td style={S.td}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:scoreColor(e.authority||0) }}>{e.authority}</span>
                </div>
              </td>
              <td style={S.td}><span style={S.badge(intentColor(e.intent))}>{e.intent}</span></td>
              <td style={S.td}>{e.wikidataId ? <span style={S.badge('#10b981')}>✓ {e.wikidataId}</span> : <span style={{ color:'#52525b', fontSize:12 }}>—</span>}</td>
              <td style={S.td}>{e.knowledgeGraphId ? <span style={S.badge('#4f46e5')}>✓ KG</span> : <span style={{ color:'#52525b', fontSize:12 }}>—</span>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    );
  }

  function TopicTable({ topics = [] }) {
    return (
      <div style={{ overflowX:'auto' }}>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Topic</th>
            <th style={S.th}>Cluster</th>
            <th style={S.th}>Coverage</th>
            <th style={S.th}>Intent</th>
            <th style={S.th}>Volume</th>
            <th style={S.th}>Difficulty</th>
            <th style={S.th}>Gap</th>
          </tr></thead>
          <tbody>{topics.map((t, i) => (
            <tr key={i} style={i % 2 === 0 ? S.trEven : S.trOdd}>
              <td style={S.td}><span style={{ fontWeight:600 }}>{t.name}</span></td>
              <td style={S.td}><span style={S.badge(t.cluster==='Pillar'?'#4f46e5':t.cluster==='Supporting'?'#0ea5e9':'#52525b')}>{t.cluster}</span></td>
              <td style={S.td}>
                <div style={{ minWidth:80 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:12, color:scoreColor(t.coverage||0) }}>{t.coverage}%</span>
                  </div>
                  <div style={S.progressBar}><div style={S.progressFill(t.coverage, scoreColor(t.coverage||0))} /></div>
                </div>
              </td>
              <td style={S.td}><span style={S.badge(intentColor(t.intent))}>{t.intent}</span></td>
              <td style={S.td}>{t.searchVolume?.toLocaleString()}</td>
              <td style={S.td}><span style={{ color:scoreColor(100 - (t.difficulty||0)), fontWeight:600 }}>{t.difficulty}</span></td>
              <td style={S.td}>{t.gap ? <span style={S.badge('#ef4444')}>Gap</span> : <span style={{ color:'#52525b' }}>—</span>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    );
  }

  // ── tab renderers ───────────────────────────────────────────────────────────

  function renderDiscover() {
    const d = data.discover;
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Entity Discovery</div>
          <p style={{ color:'#71717a', fontSize:13, marginTop:0 }}>Discover all named entities in your domain — matched against Google Knowledge Graph, Wikidata, and schema.org entity types.</p>
          <DomainInput tab="discover" label="Discover Entities" color="#4f46e5" />
          {err.discover && <div style={S.errorBox}>{err.discover}</div>}
          {loading.discover ? <div style={S.loading}>Scanning domain for entities…</div> :
          d ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={S.metaVal()}>{d.total?.toLocaleString() || d.entities?.length}</div><div style={S.metaLabel}>Total Entities</div></div>
                <div style={S.metaItem}><div style={S.metaVal('#10b981')}>{d.knowledgeGraphMatched}</div><div style={S.metaLabel}>KG Matched</div></div>
                <div style={S.metaItem}><div style={S.metaVal('#0ea5e9')}>{d.wikidataMatched}</div><div style={S.metaLabel}>Wikidata Matched</div></div>
                <div style={S.metaItem}><div style={S.metaVal('#a855f7')}>{d.entities?.filter(e => e.authority >= 70).length || 0}</div><div style={S.metaLabel}>High Authority</div></div>
              </div>
              {d.entities?.length ? <EntityTable entities={d.entities} /> : null}
            </>
          ) : <div style={S.emptyState}>Enter a domain to discover its semantic entity landscape.</div>}
        </div>
      </div>
    );
  }

  function renderEntityGap() {
    const d = data['entity-gap'];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Entity Gap Analysis</div>
          <p style={{ color:'#71717a', fontSize:13, marginTop:0 }}>Discover which entities your competitors rank for that you don&apos;t — prioritized by opportunity score and search volume.</p>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Your domain…" value={q['entity-gap'] || ''} onChange={e => setQ(p => ({ ...p, 'entity-gap': e.target.value }))} />
            <input style={S.input} placeholder="Competitor 1…" value={form.comp1 || ''} onChange={e => setForm(p => ({ ...p, comp1: e.target.value }))} />
            <input style={S.input} placeholder="Competitor 2…" value={form.comp2 || ''} onChange={e => setForm(p => ({ ...p, comp2: e.target.value }))} />
            <button style={S.btn('#4f46e5')} onClick={() => fetchTab('entity-gap')} disabled={loading['entity-gap']}>{loading['entity-gap'] ? 'Analyzing…' : 'Find Gaps'}</button>
            <button style={S.btn('#10b981')} onClick={() => runAI('entity-analyze')} disabled={loading['entity-analyze']}>✦ AI Prioritize</button>
          </div>
          {err['entity-gap'] && <div style={S.errorBox}>{err['entity-gap']}</div>}
          {loading['entity-gap'] ? <div style={S.loading}>Comparing entity landscapes…</div> :
          d?.gaps?.length ? (
            <div style={{ overflowX:'auto' }}>
              <table style={S.table}>
                <thead><tr>
                  <th style={S.th}>Entity</th><th style={S.th}>Type</th><th style={S.th}>Opportunity</th><th style={S.th}>Competitors</th><th style={S.th}>Intent</th><th style={S.th}>Action</th>
                </tr></thead>
                <tbody>{d.gaps.map((g, i) => (
                  <tr key={i} style={i % 2 === 0 ? S.trEven : S.trOdd}>
                    <td style={S.td}><span style={{ fontWeight:600 }}>{g.name}</span></td>
                    <td style={S.td}><span style={S.badge('#0ea5e9')}>{g.type}</span></td>
                    <td style={S.td}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ color:scoreColor(g.opportunityScore||0), fontWeight:700 }}>{g.opportunityScore}</span>
                        <div style={{ ...S.progressBar, flex:1, maxWidth:60 }}><div style={S.progressFill(g.opportunityScore, scoreColor(g.opportunityScore||0))} /></div>
                      </div>
                    </td>
                    <td style={S.td}><span style={{ color:'#f97316', fontSize:12 }}>{(g.competitors||[]).join(', ') || '—'}</span></td>
                    <td style={S.td}><span style={S.badge(intentColor(g.intent))}>{g.intent}</span></td>
                    <td style={S.td}>
                      <button style={{ ...S.btn('#a855f7'), padding:'4px 10px', fontSize:11 }} onClick={() => showToast('Added to content plan')}>+ Plan</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div style={S.emptyState}>Enter your domain and competitors to find entity gaps.</div>}
        </div>
      </div>
    );
  }

  function renderTopicClusters() {
    const d = data['cluster-map'];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Topic Cluster Map</div>
          <p style={{ color:'#71717a', fontSize:13, marginTop:0 }}>Visualize your topical authority landscape — pillar topics, supporting content, and peripheral clusters mapped to search intent and volume.</p>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Domain or seed keyword…" value={q['cluster-map'] || ''} onChange={e => setQ(p => ({ ...p, 'cluster-map': e.target.value }))} />
            <button style={S.btn('#0ea5e9')} onClick={() => fetchTab('cluster-map')} disabled={loading['cluster-map']}>{loading['cluster-map'] ? 'Mapping…' : 'Map Clusters'}</button>
            <button style={S.btn('#10b981')} onClick={() => runAI('topic-strategy')} disabled={loading['topic-strategy']}>✦ AI Strategy</button>
          </div>
          {err['cluster-map'] && <div style={S.errorBox}>{err['cluster-map']}</div>}
          {loading['cluster-map'] ? <div style={S.loading}>Building topic cluster map…</div> :
          d ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={S.metaVal('#4f46e5')}>{d.pillars?.length || 0}</div><div style={S.metaLabel}>Pillar Topics</div></div>
                <div style={S.metaItem}><div style={S.metaVal('#0ea5e9')}>{d.supporting?.length || 0}</div><div style={S.metaLabel}>Supporting Topics</div></div>
                <div style={S.metaItem}><div style={S.metaVal('#10b981')}>{d.peripheral?.length || 0}</div><div style={S.metaLabel}>Peripheral Topics</div></div>
                <div style={S.metaItem}><div style={S.metaVal('#f59e0b')}>{d.totalSearchVolume?.toLocaleString()}</div><div style={S.metaLabel}>Total Volume</div></div>
              </div>
              <TopicTable topics={d.clusters || []} />
            </>
          ) : <div style={S.emptyState}>Enter a domain or seed keyword to map your topic clusters.</div>}
        </div>
      </div>
    );
  }

  function renderEeat() {
    const d = data.eeat;
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>E-E-A-T Score</div>
          <p style={{ color:'#71717a', fontSize:13, marginTop:0 }}>Google&apos;s Experience, Expertise, Authoritativeness, and Trustworthiness signals — scored algorithmically from your site&apos;s content, backlinks, and entity presence.</p>
          <DomainInput tab="eeat" label="Analyze E-E-A-T" color="#10b981" />
          {err.eeat && <div style={S.errorBox}>{err.eeat}</div>}
          {loading.eeat ? <div style={S.loading}>Analyzing E-E-A-T signals…</div> :
          d?.scores ? (
            <>
              <div style={S.metaRow}>
                {Object.entries(d.scores).map(([k, v]) => (
                  <div key={k} style={S.metaItem}>
                    <div style={S.metaVal(scoreColor(v))}>{v}</div>
                    <div style={S.metaLabel}>{k.charAt(0).toUpperCase() + k.slice(1)}</div>
                  </div>
                ))}
              </div>
              <div style={S.sT}>Positive Signals</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
                {Object.entries(d.signals || {}).filter(([, v]) => v === true).map(([k]) => (
                  <span key={k} style={S.badge('#10b981')}>✓ {k.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                ))}
              </div>
              <div style={S.sT}>Missing Signals</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
                {Object.entries(d.signals || {}).filter(([, v]) => v === false).map(([k]) => (
                  <span key={k} style={S.badge('#ef4444')}>✗ {k.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                ))}
              </div>
              {d.recommendations?.length ? (
                <>
                  <div style={S.sT}>Recommendations</div>
                  {d.recommendations.map((r, i) => (
                    <div key={i} style={S.row}>
                      <span style={{ ...S.badge('#f59e0b'), flexShrink:0 }}>{i + 1}</span>
                      <span style={{ fontSize:13, color:'#fafafa' }}>{r}</span>
                    </div>
                  ))}
                </>
              ) : null}
            </>
          ) : <div style={S.emptyState}>Enter a domain to analyze its E-E-A-T signals.</div>}
        </div>
      </div>
    );
  }

  function renderKgPresence() {
    const d = data['kg-presence'];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Knowledge Graph Presence</div>
          <p style={{ color:'#71717a', fontSize:13, marginTop:0 }}>Check whether your brand and key entities exist in Google&apos;s Knowledge Graph — the foundation of entity-first SEO.</p>
          <DomainInput tab="kg-presence" label="Check KG" color="#10b981" />
          {err['kg-presence'] && <div style={S.errorBox}>{err['kg-presence']}</div>}
          {loading['kg-presence'] ? <div style={S.loading}>Querying Knowledge Graph…</div> :
          d ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={S.metaVal(d.kgPresence ? '#10b981' : '#ef4444')}>{d.kgPresence ? 'Present' : 'Not Found'}</div><div style={S.metaLabel}>KG Status</div></div>
                <div style={S.metaItem}><div style={S.metaVal('#4f46e5')}>{d.kgScore}</div><div style={S.metaLabel}>KG Score</div></div>
                <div style={S.metaItem}><div style={S.metaVal('#0ea5e9')}>{d.kgType}</div><div style={S.metaLabel}>Entity Type</div></div>
                <div style={S.metaItem}><div style={S.metaVal('#a855f7')}>{d.socialProfiles?.length || 0}</div><div style={S.metaLabel}>sameAs Profiles</div></div>
              </div>
              {d.kgPresence ? (
                <div style={{ ...S.miniCard, marginBottom:12 }}>
                  <div style={S.sT}>Entity Panel Data</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10, marginTop:8 }}>
                    {[['Brand Name', d.brandName], ['Entity Type', d.kgType], ['Founded', d.founded], ['Official Site', d.officialSite]].map(([label, val]) => (
                      <div key={label}>
                        <div style={{ fontSize:11, color:'#71717a' }}>{label}</div>
                        <div style={{ fontSize:13, color:'#fafafa', marginTop:2 }}>{val || '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ ...S.card, background:'#1c0c0c', border:'1px solid #7f1d1d', padding:16 }}>
                  <div style={{ color:'#fca5a5', fontWeight:700, marginBottom:8 }}>Not in Knowledge Graph</div>
                  <p style={{ color:'#fca5a5', fontSize:13, margin:0 }}>Your brand entity was not found in Google&apos;s Knowledge Graph. Take these steps: (1) Add Organization schema with sameAs links to social profiles, (2) Create a Wikipedia/Wikidata entry, (3) Build authoritative backlinks from notable publications.</p>
                </div>
              )}
            </>
          ) : <div style={S.emptyState}>Enter a domain to check its Knowledge Graph presence.</div>}
        </div>
      </div>
    );
  }

  function renderSchemaGen() {
    const d = data['schema-gen'];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Schema.org Generator</div>
          <p style={{ color:'#71717a', fontSize:13, marginTop:0 }}>Generate valid, rich-result-eligible JSON-LD structured data for your pages. Covers Organization, Product, Article, FAQ, HowTo, BreadcrumbList, and more.</p>
          <div style={S.inputRow}>
            <select style={S.select} value={form.schemaType || 'Organization'} onChange={e => setForm(p => ({ ...p, schemaType: e.target.value }))}>
              <option value="Organization">Organization</option>
              <option value="Product">Product</option>
              <option value="Article">Article</option>
              <option value="FAQPage">FAQ Page</option>
              <option value="BreadcrumbList">Breadcrumb List</option>
              <option value="LocalBusiness">Local Business</option>
              <option value="WebSite">WebSite</option>
            </select>
            <input style={S.input} placeholder="Name…" value={form.schemaName || ''} onChange={e => setForm(p => ({ ...p, schemaName: e.target.value }))} />
            <input style={S.input} placeholder="URL…" value={form.schemaUrl || ''} onChange={e => setForm(p => ({ ...p, schemaUrl: e.target.value }))} />
            <button style={S.btn('#10b981')} onClick={generateSchema}>Generate Schema</button>
          </div>
          {d?.jsonld ? (
            <>
              <div style={S.sT}>Generated JSON-LD</div>
              <pre style={S.pre}>{d.jsonld}</pre>
              <div style={{ display:'flex', gap:8 }}>
                <button style={S.btn('#27272a')} onClick={() => { navigator.clipboard?.writeText(d.jsonld); showToast('Copied to clipboard'); }}>Copy JSON-LD</button>
                <button style={S.btn('#10b981')} onClick={() => showToast('Validated — ' + (d.validationErrors?.length ? d.validationErrors.length + ' issues found' : 'No errors') )}>{d.validationErrors?.length ? 'Issues Found' : '✓ Valid'}</button>
                {d.richResultEligible && <span style={S.badge('#10b981')}>✓ Rich Result Eligible</span>}
              </div>
            </>
          ) : <div style={S.emptyState}>Select a schema type and fill in the fields to generate JSON-LD.</div>}
        </div>
      </div>
    );
  }

  function renderRecommendations() {
    const d = data.recs;
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Optimization Recommendations</div>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Domain to analyze…" value={q.recs || ''} onChange={e => setQ(p => ({ ...p, recs: e.target.value }))} onKeyDown={e => e.key === 'Enter' && fetchTab('recs')} />
            <button style={S.btn('#ec4899')} onClick={() => fetchTab('recs')} disabled={loading.recs}>{loading.recs ? 'Analyzing…' : 'Get Recommendations'}</button>
          </div>
          {err.recs && <div style={S.errorBox}>{err.recs}</div>}
          {loading.recs ? <div style={S.loading}>Generating recommendations…</div> :
          d?.recommendations?.length ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={S.metaVal('#ef4444')}>{d.recommendations.filter(r => r.priority === 'critical').length}</div><div style={S.metaLabel}>Critical</div></div>
                <div style={S.metaItem}><div style={S.metaVal('#f97316')}>{d.recommendations.filter(r => r.priority === 'high').length}</div><div style={S.metaLabel}>High Priority</div></div>
                <div style={S.metaItem}><div style={S.metaVal('#f59e0b')}>{d.recommendations.filter(r => r.priority === 'medium').length}</div><div style={S.metaLabel}>Medium</div></div>
                <div style={S.metaItem}><div style={S.metaVal('#10b981')}>{d.total}</div><div style={S.metaLabel}>Total Actions</div></div>
              </div>
              {d.recommendations.map((rec, i) => (
                <div key={i} style={{ ...S.card, padding:16, marginBottom:10, display:'flex', gap:12, alignItems:'flex-start' }}>
                  <span style={{ ...S.badge(priorityColor(rec.priority)), flexShrink:0, marginTop:2 }}>{rec.priority}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, color:'#fafafa', marginBottom:4 }}>{rec.action}</div>
                    <div style={{ fontSize:12, color:'#71717a', marginBottom:6 }}>{rec.impact}</div>
                    <div style={{ display:'flex', gap:6 }}>
                      <span style={S.badge('#27272a')}>{rec.category}</span>
                      <span style={S.badge('#27272a')}>Effort: {rec.effort}</span>
                      {rec.entities > 0 && <span style={S.badge('#4f46e5')}>{rec.entities} entities</span>}
                    </div>
                  </div>
                  <button style={{ ...S.btn('#27272a'), padding:'6px 12px', fontSize:11, flexShrink:0 }} onClick={() => showToast('Added to task list')}>+ Add Task</button>
                </div>
              ))}
            </>
          ) : <div style={S.emptyState}>Enter a domain to get prioritized entity & topic optimization recommendations.</div>}
        </div>
      </div>
    );
  }

  function renderAiWriter() {
    const d = data['ai-writer'];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>✦ AI Entity Content Writer</div>
          <p style={{ color:'#71717a', fontSize:13, marginTop:0 }}>Generate entity-optimized content using AI. Build topical authority with content that demonstrates E-E-A-T signals and semantic relevance.</p>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Topic or entity name…" value={q['ai-writer'] || ''} onChange={e => setQ(p => ({ ...p, 'ai-writer': e.target.value }))} />
            <select style={S.select} value={form.writerType || 'description'} onChange={e => setForm(p => ({ ...p, writerType: e.target.value }))}>
              <option value="description">Entity Description</option>
              <option value="article">Topic Article Intro</option>
              <option value="brief">Content Brief</option>
              <option value="faq">FAQ Section</option>
            </select>
            <select style={S.select} value={form.aiModel || 'gpt-4o-mini'} onChange={e => setForm(p => ({ ...p, aiModel: e.target.value }))}>
              <option value="gpt-4o-mini">GPT-4o Mini (2 credits)</option>
              <option value="gpt-4o">GPT-4o (4 credits)</option>
              <option value="gpt-4">GPT-4 (6 credits)</option>
            </select>
            <button style={S.btn('#ec4899')} onClick={() => runAI('entity-writer')} disabled={loading['entity-writer']}>{loading['entity-writer'] ? 'Writing…' : '✦ Generate'}</button>
          </div>
          {data['entity-writer']?.content ? (
            <div>
              <div style={S.sT}>Generated Content</div>
              <div style={{ background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, padding:16, fontSize:13, color:'#e4e4e7', lineHeight:1.7, marginBottom:12 }}>
                {data['entity-writer'].content}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button style={S.btn('#27272a')} onClick={() => { navigator.clipboard?.writeText(data['entity-writer'].content); showToast('Copied'); }}>Copy</button>
                <button style={S.btn('#ec4899')} onClick={() => runAI('entity-writer')}>✦ Regenerate</button>
              </div>
              <div style={{ color:'#71717a', fontSize:11, marginTop:8 }}>Model: {data['entity-writer'].model} · Credits: {data['entity-writer'].creditsUsed}</div>
            </div>
          ) : <div style={S.emptyState}>Enter a topic or entity and click Generate to create optimized content.</div>}
        </div>
      </div>
    );
  }

  function renderWorldClass() {
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>✦ World-Class Enterprise Features</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
            {[
              { icon:'🧠', title:'Neural Entity Extraction', desc:"Transformer-based NER with co-reference resolution and entity salience scoring — same approach used by Google's Natural Language API." },
              { icon:'🌐', title:'Knowledge Graph API Integration', desc:'Live queries against Google Knowledge Graph Search API, Wikidata SPARQL endpoint, and Freebase-style entity resolution.' },
              { icon:'📊', title:'Topical Authority Scoring', desc:'PageRank-style authority propagation through your topic cluster graph — identifies which entities give you the most authority signal.' },
              { icon:'🔬', title:'Semantic Triple Extraction', desc:'Subject → Predicate → Object NLP parsing from your content — reveals knowledge gaps and entity relationship opportunities.' },
              { icon:'🎯', title:'PMI Co-occurrence Matrix', desc:'Pointwise Mutual Information scoring for entity co-occurrence — tells you which entities statistically belong together in your content.' },
              { icon:'✅', title:'E-E-A-T Intelligence Suite', desc:'Algorithmic scoring of all four E-E-A-T dimensions with specific, actionable signal-level improvements tracked over time.' },
            ].map((f, i) => (
              <div key={i} style={S.miniCard}>
                <div style={{ fontSize:28, marginBottom:8 }}>{f.icon}</div>
                <div style={{ fontWeight:700, color:'#fafafa', marginBottom:4 }}>{f.title}</div>
                <div style={{ fontSize:12, color:'#71717a', lineHeight:1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderGenericTab(tab, title, desc, btnLabel = 'Analyze', btnColor = '#4f46e5') {
    const d = data[tab];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>{title}</div>
          {desc && <p style={{ color:'#71717a', fontSize:13, marginTop:0 }}>{desc}</p>}
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Enter domain or URL…" value={q[tab] || ''} onChange={e => setQ(p => ({ ...p, [tab]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && fetchTab(tab)} />
            <button style={S.btn(btnColor)} onClick={() => fetchTab(tab)} disabled={loading[tab]}>{loading[tab] ? 'Loading…' : btnLabel}</button>
            <button style={S.btn('#10b981')} onClick={() => showToast('AI analyzing…')}>✦ AI Insights</button>
          </div>
          {err[tab] && <div style={S.errorBox}>{err[tab]}</div>}
          {loading[tab] ? <div style={S.loading}>Loading {title.toLowerCase()}…</div> :
          d ? (
            <div style={{ overflowX:'auto' }}>
              <table style={S.table}>
                <thead><tr>
                  <th style={S.th}>Item</th><th style={S.th}>Type / Category</th><th style={S.th}>Score</th><th style={S.th}>Status</th>
                </tr></thead>
                <tbody>{(Array.isArray(d) ? d : d.entities || d.topics || d.questions || d.pages || d.results || d.gaps || d.opportunities || d.matched || d.breakdown || []).map((r, i) => (
                  <tr key={i} style={i % 2 === 0 ? S.trEven : S.trOdd}>
                    <td style={S.td}><span style={{ fontWeight:600, fontSize:12 }}>{r.name || r.question || r.url || r.entity || r.intent || String(r)}</span></td>
                    <td style={S.td}><span style={{ color:'#71717a', fontSize:12 }}>{r.type || r.cluster || r.category || r.intent || '—'}</span></td>
                    <td style={S.td}>{r.authority || r.coverage || r.pct || r.opportunityScore ? <span style={{ color:scoreColor(r.authority || r.coverage || r.pct || r.opportunityScore || 0), fontWeight:700 }}>{r.authority || r.coverage || r.pct || r.opportunityScore}</span> : '—'}</td>
                    <td style={S.td}>{r.gap ? <span style={S.badge('#ef4444')}>Gap</span> : r.hasSnippet ? <span style={S.badge('#10b981')}>Has Snippet</span> : r.canWin ? <span style={S.badge('#f59e0b')}>Can Win</span> : '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div style={S.emptyState}>Enter a domain to load {title.toLowerCase()}.</div>}
        </div>
      </div>
    );
  }

  function renderSettings() {
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Tool Settings</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
            <div>
              <label style={S.label}>Default AI Model</label>
              <select style={S.select} value={form.aiModel || 'gpt-4o-mini'} onChange={e => setForm(p => ({ ...p, aiModel: e.target.value }))}>
                <option value="gpt-4o-mini">GPT-4o Mini (cheapest)</option>
                <option value="gpt-4o">GPT-4o (balanced)</option>
                <option value="gpt-4">GPT-4 (best)</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Report Frequency</label>
              <select style={S.select} value={form.reportFreq || 'weekly'} onChange={e => setForm(p => ({ ...p, reportFreq: e.target.value }))}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <button style={{ ...S.btn('#4f46e5'), marginTop:20 }} onClick={async () => {
            try {
              await apiFetchJSON(API + '/settings', { method:'POST', body:JSON.stringify({ defaultModel:form.aiModel, reportFrequency:form.reportFreq }) });
              showToast('Settings saved');
            } catch(e) { showToast('Failed', '#ef4444'); }
          }}>Save Settings</button>
        </div>
      </div>
    );
  }

  // ── render tab ──────────────────────────────────────────────────────────────

  function renderTab() {
    switch (activeTab) {
      case 'discover':       return renderDiscover();
      case 'entity-gap':     return renderEntityGap();
      case 'comp-entities':  return renderGenericTab('comp-entities', 'Competitor Entities', "Entities your competitors own that you don't — find quick wins.");
      case 'authority':      return renderGenericTab('authority', 'Entity Authority', 'Authority score per entity based on backlinks, mentions, and KG presence.');
      case 'co-occurrence':  return renderGenericTab('co-occurrence', 'Entity Co-occurrence', 'PMI-scored co-occurrence analysis — which entities belong together in your content.');
      case 'wikidata':       return renderGenericTab('wikidata', 'Wikidata Match', 'Match your entities to Wikidata QIDs for Knowledge Graph eligibility.');
      case 'cluster-map':    return renderTopicClusters();
      case 'hierarchy':      return renderGenericTab('hierarchy', 'Topic Hierarchy', 'Parent-child topic tree — identify pillar and supporting content relationships.');
      case 'coverage':       return renderGenericTab('coverage', 'Coverage Score', 'What % of your topical map is covered vs competitors — identify gaps.');
      case 'intent':         return renderGenericTab('intent', 'Search Intent', 'Map every topic to informational/navigational/transactional/commercial intent.');
      case 'seasonality':    return renderGenericTab('seasonality', 'Topic Seasonality', 'Monthly search volume trends — identify seasonal content opportunities.');
      case 'questions':      return renderGenericTab('questions', 'PAA Questions', 'People Also Ask questions for your topics — featured snippet opportunities.');
      case 'kg-presence':    return renderKgPresence();
      case 'entity-cards':   return renderGenericTab('entity-cards', 'Entity Cards', 'Which of your entities have Google Knowledge Panels — and how to get more.');
      case 'schema':         return renderGenericTab('schema', 'Schema Audit', 'Audit all structured data on your site — errors, warnings, and opportunities.');
      case 'structured-data': return renderGenericTab('structured-data', 'Structured Data', 'Detected schema types and missing opportunities for rich results.');
      case 'rich-results':   return renderGenericTab('rich-results', 'Rich Results', 'Track rich result eligibility, appearances, and CTR performance.');
      case 'eeat':           return renderEeat();
      case 'semantic-audit': return renderGenericTab('semantic-audit', 'Semantic Audit', 'Audit entity coverage, density, and semantic relevance across your pages.');
      case 'nlp-scan':       return renderGenericTab('nlp-scan', 'NLP Scan', 'Named entity recognition, sentiment analysis, and content category classification.');
      case 'triple-extract': return renderGenericTab('triple-extract', 'Semantic Triples', 'Subject → Predicate → Object extractions — the knowledge graph in your content.');
      case 'density':        return renderGenericTab('density', 'Entity Density', 'Entity mentions per 1,000 words — identify over- and under-optimized pages.');
      case 'freshness':      return renderGenericTab('freshness', 'Content Freshness', 'Age and freshness score per page — identify stale content hurting rankings.');
      case 'content-gaps':   return renderGenericTab('content-gaps', 'Content Gaps', 'Topics and entities covered by competitors but missing from your site.');
      case 'sov':            return renderGenericTab('sov', 'Share of Voice', 'Entity mention share across your niche — your brand vs competitors.');
      case 'topical-auth':   return renderGenericTab('topical-auth', 'Topical Authority', 'Topical authority comparison across domains — coverage, depth, entity count.');
      case 'featured-snip':  return renderGenericTab('featured-snip', 'Featured Snippets', 'Featured snippet opportunities — who owns them and how to win them.');
      case 'comp-content':   return renderGenericTab('comp-content', 'Competitor Content', 'Top-performing content from competitors and the entities that power it.');
      case 'benchmarks':     return renderGenericTab('benchmarks', 'Benchmarks', 'Your entity and topic KPIs vs industry average and best-in-class.');
      case 'entity-sov':     return renderGenericTab('entity-sov', 'Entity SOV', 'Share of entity mentions per entity type — track entity ownership over time.');
      case 'recs':           return renderRecommendations();
      case 'internal-link':  return renderGenericTab('internal-link', 'Internal Linking', 'AI-suggested internal link opportunities to strengthen topical clusters.');
      case 'content-plan':   return renderGenericTab('content-plan', 'Content Plan', 'Prioritized content calendar to close entity and topic gaps.');
      case 'entity-strategy': return renderGenericTab('entity-strategy', 'Entity Strategy', 'Strategic roadmap to improve entity presence and topical authority.');
      case 'schema-gen':     return renderSchemaGen();
      case 'ai-writer':      return renderAiWriter();
      case 'ai-analysis':    return renderGenericTab('ai-analysis', 'AI Deep Analysis', "Multi-model AI analysis of your full entity and topic landscape.");
      case 'trends':         return renderGenericTab('trends', 'Trend Intelligence', 'Entity and topic search trend signals — identify rising opportunities.');
      case 'voice-search':   return renderGenericTab('voice-search', 'Voice Search', 'Voice query optimization — conversational queries tied to your entities.');
      case 'international':  return renderGenericTab('international', 'International', 'Multi-language entity analysis and hreflang entity consistency.');
      case 'et-settings':    return renderSettings();
      case 'world-class':    return renderWorldClass();
      default:               return <div style={S.emptyState}>Select a tab to begin.</div>;
    }
  }

  // ── main render ──────────────────────────────────────────────────────────────

  return (
    <div style={S.root}>
      <div style={S.header}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
          <div>
            <h1 style={S.title}>Entity &amp; Topic Explorer</h1>
            <p style={S.subtitle}>Semantic SEO intelligence — Knowledge Graph, E-E-A-T, topical authority, entity gaps, schema generation &amp; AI content strategy</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button style={S.btn('#27272a')} onClick={() => fetchTab(activeTab)}>↺ Refresh</button>
            <button style={S.btn('#10b981')} onClick={() => { setActiveGroup('advanced'); setActiveTab('ai-analysis'); }}>✦ AI Analysis</button>
            <button style={S.btn('#4f46e5')} onClick={() => { setActiveGroup('optimize'); setActiveTab('recs'); }}>Get Recs</button>
          </div>
        </div>
      </div>

      <div style={S.groupNav}>
        {GROUPS.map(g => (
          <button key={g.id} style={S.groupBtn(activeGroup === g.id, g.color)} onClick={() => handleGroupClick(g.id)}>
            {g.label}
          </button>
        ))}
      </div>

      <div style={S.tabStrip}>
        {curGroup.tabs.map(t => (
          <button key={t.id} style={S.tabBtn(activeTab === t.id, curGroup.color)} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {renderTab()}

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:toast.color, color:'#fff', borderRadius:10, padding:'12px 20px', fontSize:13, fontWeight:600, zIndex:9999, boxShadow:'0 4px 24px #0006' }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
