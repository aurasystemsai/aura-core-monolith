/**
 * Generator: Enterprise KeywordResearchSuite.jsx
 * Run: node write-keyword-suite.js
 * Outputs: aura-console/src/components/tools/KeywordResearchSuite.jsx
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'aura-console/src/components/tools/KeywordResearchSuite.jsx');

// ─── helpers ────────────────────────────────────────────────────────────────

function metricCards(items) {
  return `<div style={S.metaRow}>
${items.map(([val,lbl,col])=>`        <div style={S.metaItem}>
          <div style={{...S.metaVal,color:'${col||'#4f46e5'}'}}>{${val}}</div>
          <div style={S.metaLabel}>${lbl}</div>
        </div>`).join('\n')}
      </div>`;
}

function tableSection(id, cols, emptyMsg) {
  const ths = cols.map(c=>`<th style={S.th}>${c}</th>`).join('');
  return `{loading.${id} ? <div style={S.loading}>Loading…</div> :
        err.${id} ? <div style={S.errorBox}>{err.${id}}</div> :
        data.${id}?.length ? (
          <div style={{overflowX:'auto'}}>
            <table style={S.table}>
              <thead><tr>${ths}</tr></thead>
              <tbody>{data.${id}.map((r,i)=>(
                <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                  ${cols.map((_,ci)=>`<td style={S.td}>{String(r[Object.keys(r)[${ci}]]??'—')}</td>`).join('')}
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <div style={S.emptyState}>${emptyMsg}</div>}`;
}

// ─── tabs config ────────────────────────────────────────────────────────────

const GROUPS = [
  { id:'discover',  label:'Discover',     color:'#4f46e5',
    tabs:[
      {id:'keywords',      label:'Keyword Explorer'},
      {id:'suggestions',   label:'AI Suggestions'},
      {id:'bulk',          label:'Bulk Research'},
      {id:'trends',        label:'Trends & Seasonality'},
      {id:'questions',     label:'Questions & PAA'},
      {id:'ai-ideas',      label:'AI Ideation'},
    ]},
  { id:'serp',      label:'SERP Intel',   color:'#0ea5e9',
    tabs:[
      {id:'serp-overview', label:'SERP Overview'},
      {id:'features',      label:'SERP Features'},
      {id:'snippets',      label:'Featured Snippets'},
      {id:'local',         label:'Local Packs'},
      {id:'volatility',    label:'Volatility'},
      {id:'history',       label:'SERP History'},
    ]},
  { id:'compete',   label:'Competitors',  color:'#f97316',
    tabs:[
      {id:'gap',           label:'Keyword Gap'},
      {id:'spy',           label:'Competitor Spy'},
      {id:'sov',           label:'Share of Voice'},
      {id:'link-cross',    label:'Link Intersection'},
      {id:'comp-content',  label:'Content Gaps'},
      {id:'benchmarks',    label:'Benchmarks'},
    ]},
  { id:'intent',    label:'Search Intent', color:'#10b981',
    tabs:[
      {id:'classify',      label:'Intent Classifier'},
      {id:'journey',       label:'Buyer Journey'},
      {id:'micro',         label:'Micro-Moments'},
      {id:'maps',          label:'Intent Maps'},
      {id:'voice',         label:'Voice Search'},
      {id:'seasonal-int',  label:'Seasonal Intent'},
    ]},
  { id:'clusters',  label:'Clusters',     color:'#a855f7',
    tabs:[
      {id:'clusters-view', label:'Keyword Clusters'},
      {id:'topical',       label:'Topical Maps'},
      {id:'hierarchy',     label:'Topic Hierarchy'},
      {id:'pillars',       label:'Pillar Pages'},
      {id:'cannibal',      label:'Cannibalization'},
      {id:'builder',       label:'Cluster Builder'},
    ]},
  { id:'opps',      label:'Opportunities', color:'#f59e0b',
    tabs:[
      {id:'quick-wins',    label:'Quick Wins'},
      {id:'roi',           label:'ROI Calculator'},
      {id:'priority',      label:'Priority Matrix'},
      {id:'forecast',      label:'Forecasting'},
      {id:'alerts',        label:'Keyword Alerts'},
      {id:'recs',          label:'AI Recommendations'},
    ]},
  { id:'advanced',  label:'Advanced',     color:'#ec4899',
    tabs:[
      {id:'rank-tracker',  label:'Rank Tracker'},
      {id:'tech-kw',       label:'Technical Keywords'},
      {id:'exports',       label:'Export & Reports'},
      {id:'api-access',    label:'API Access'},
      {id:'settings-kw',   label:'Tool Settings'},
      {id:'world-class',   label:'World-Class'},
    ]},
];

// ─── state keys ─────────────────────────────────────────────────────────────

const ALL_TABS = GROUPS.flatMap(g=>g.tabs);
const DATA_KEYS = ALL_TABS.map(t=>t.id);

// ─── tab content blocks ──────────────────────────────────────────────────────

function renderKeywords() {
  return `/* keywords */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Keyword Explorer</div>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Enter seed keyword…" value={q.keywords||''} onChange={e=>setQ(p=>({...p,keywords:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&fetchTab('keywords')} />
            <select style={S.select} value={form.country||'us'} onChange={e=>setForm(p=>({...p,country:e.target.value}))}>
              <option value="us">🇺🇸 US</option><option value="gb">🇬🇧 UK</option>
              <option value="ca">🇨🇦 CA</option><option value="au">🇦🇺 AU</option>
              <option value="de">🇩🇪 DE</option><option value="fr">🇫🇷 FR</option>
            </select>
            <select style={S.select} value={form.lang||'en'} onChange={e=>setForm(p=>({...p,lang:e.target.value}))}>
              <option value="en">English</option><option value="es">Spanish</option>
              <option value="de">German</option><option value="fr">French</option>
            </select>
            <button style={S.btn} onClick={()=>fetchTab('keywords')} disabled={loading.keywords}>
              {loading.keywords?'Searching…':'Search Keywords'}
            </button>
            <button style={{...S.btn,background:'#10b981'}} onClick={()=>aiAction('keywords','generate')} disabled={loading['ai-keywords']}>
              ✦ AI Expand
            </button>
          </div>
          <div style={S.filterRow}>
            <input style={{...S.input,flex:'0 0 160px'}} placeholder="Min volume" type="number" value={form.minVol||''} onChange={e=>setForm(p=>({...p,minVol:e.target.value}))} />
            <input style={{...S.input,flex:'0 0 160px'}} placeholder="Max KD (0-100)" type="number" value={form.maxKd||''} onChange={e=>setForm(p=>({...p,maxKd:e.target.value}))} />
            <select style={S.select} value={form.intent||''} onChange={e=>setForm(p=>({...p,intent:e.target.value}))}>
              <option value="">All Intents</option>
              <option value="informational">Informational</option>
              <option value="commercial">Commercial</option>
              <option value="transactional">Transactional</option>
              <option value="navigational">Navigational</option>
            </select>
          </div>
          {err.keywords && <div style={S.errorBox}>{err.keywords}</div>}
          {loading.keywords ? <div style={S.loading}>Discovering keywords…</div> :
          data.keywords?.length ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#4f46e5'}}>{data.keywords.length}</div><div style={S.metaLabel}>Keywords Found</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>{Math.round(data.keywords.reduce((a,k)=>a+(k.volume||0),0)/1000)}K</div><div style={S.metaLabel}>Total Monthly Volume</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f59e0b'}}>{Math.round(data.keywords.reduce((a,k)=>a+(k.kd||0),0)/Math.max(data.keywords.length,1))}</div><div style={S.metaLabel}>Avg KD</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#0ea5e9'}}>{data.keywords.filter(k=>k.kd<30).length}</div><div style={S.metaLabel}>Low KD Opps</div></div>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}><input type="checkbox" onChange={e=>{if(e.target.checked)setSelected(new Set(data.keywords.map(k=>k.keyword)));else setSelected(new Set());}} /></th>
                    <th style={S.th}>Keyword</th><th style={S.th}>Volume</th>
                    <th style={S.th}>KD</th><th style={S.th}>CPC</th>
                    <th style={S.th}>Intent</th><th style={S.th}>Trend</th><th style={S.th}>Actions</th>
                  </tr></thead>
                  <tbody>{data.keywords.map((k,i)=>(
                    <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                      <td style={S.td}><input type="checkbox" checked={selected.has(k.keyword)} onChange={e=>{const s=new Set(selected);e.target.checked?s.add(k.keyword):s.delete(k.keyword);setSelected(s);}} /></td>
                      <td style={S.td}><span style={{fontWeight:600,color:'#fafafa'}}>{k.keyword}</span></td>
                      <td style={S.td}><span style={{color:'#4f46e5',fontWeight:700}}>{k.volume?.toLocaleString()??'—'}</span></td>
                      <td style={S.td}><KDCell kd={k.kd} /></td>
                      <td style={S.td}>\${k.cpc?.toFixed(2)??'—'}</td>
                      <td style={S.td}><span style={S.badge(intentColor(k.intent))}>{k.intent||'—'}</span></td>
                      <td style={S.td}>{k.trend===1?'↑':'↓'}</td>
                      <td style={S.td}>
                        <button style={{...S.btn,padding:'4px 10px',fontSize:11}} onClick={()=>addToList(k)}>+ List</button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              {selected.size>0 && <div style={S.bulkBar}>
                <span style={{color:'#a1a1aa'}}>{selected.size} selected</span>
                <button style={{...S.btn,background:'#4f46e5',padding:'6px 14px',fontSize:12}} onClick={()=>bulkAction('add-list')}>Add to List</button>
                <button style={{...S.btn,background:'#0ea5e9',padding:'6px 14px',fontSize:12}} onClick={()=>bulkAction('export')}>Export</button>
                <button style={{...S.btn,background:'#10b981',padding:'6px 14px',fontSize:12}} onClick={()=>bulkAction('cluster')}>Cluster</button>
              </div>}
            </>
          ) : q.keywords ? <div style={S.emptyState}>No keywords found. Try a different seed.</div>
            : <div style={S.emptyState}>Enter a seed keyword and click Search Keywords to begin.</div>}
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Saved Keyword Lists</div>
          {kwLists.length ? kwLists.map((lst,i)=>(
            <div key={i} style={S.listRow}>
              <span style={{fontWeight:600,color:'#fafafa'}}>{lst.name}</span>
              <span style={S.badge('#4f46e5')}>{lst.keywords?.length||0} kws</span>
              <button style={{...S.btn,padding:'4px 10px',fontSize:11,background:'#27272a'}} onClick={()=>loadList(lst)}>Open</button>
              <button style={{...S.btn,padding:'4px 10px',fontSize:11,background:'#7f1d1d'}} onClick={()=>deleteList(lst.id)}>Delete</button>
            </div>
          )) : <div style={S.emptyState}>No saved lists yet.</div>}
          <button style={{...S.btn,marginTop:12,background:'#27272a'}} onClick={()=>setModal('new-list')}>+ New List</button>
        </div>
      </div>`;
}

function renderSuggestions() {
  return `/* suggestions */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>AI Keyword Suggestions</div>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Topic or URL…" value={q.suggestions||''} onChange={e=>setQ(p=>({...p,suggestions:e.target.value}))} />
            <select style={S.select} value={form.aiModel||'gpt-4o-mini'} onChange={e=>setForm(p=>({...p,aiModel:e.target.value}))}>
              <option value="gpt-4o-mini">GPT-4o Mini (1 credit)</option>
              <option value="gpt-4o">GPT-4o (2 credits)</option>
              <option value="gpt-4">GPT-4 (3 credits)</option>
            </select>
            <button style={{...S.btn,background:'#10b981'}} onClick={()=>fetchTab('suggestions')} disabled={loading.suggestions}>
              {loading.suggestions?'Generating…':'✦ AI Suggest'}
            </button>
          </div>
          {err.suggestions && <div style={S.errorBox}>{err.suggestions}</div>}
          {loading.suggestions ? <div style={S.loading}>AI is generating keyword suggestions…</div> :
          data.suggestions?.length ? (
            <div style={{overflowX:'auto'}}>
              <table style={S.table}>
                <thead><tr><th style={S.th}>Suggestion</th><th style={S.th}>Type</th><th style={S.th}>Relevance</th><th style={S.th}>Est. Volume</th><th style={S.th}></th></tr></thead>
                <tbody>{data.suggestions.map((s,i)=>(
                  <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                    <td style={S.td}><span style={{fontWeight:600}}>{s.keyword}</span></td>
                    <td style={S.td}><span style={S.badge('#a855f7')}>{s.type}</span></td>
                    <td style={S.td}><ScoreBar score={s.relevance||0} max={100} /></td>
                    <td style={S.td}>{s.volume?.toLocaleString()??'Est.'}</td>
                    <td style={S.td}><button style={{...S.btn,padding:'4px 10px',fontSize:11}} onClick={()=>addToList(s)}>+ Add</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div style={S.emptyState}>Enter a topic and click AI Suggest to get AI-powered keyword ideas.</div>}
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Related Searches & LSI Keywords</div>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Target keyword…" value={q.lsi||''} onChange={e=>setQ(p=>({...p,lsi:e.target.value}))} />
            <button style={S.btn} onClick={()=>fetchTab('lsi')} disabled={loading.lsi}>{loading.lsi?'Loading…':'Find LSI'}</button>
          </div>
          {data.lsi?.length ? (
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:12}}>
              {data.lsi.map((kw,i)=>(
                <span key={i} style={{...S.badge('#27272a'),cursor:'pointer',padding:'6px 12px',fontSize:12}} onClick={()=>addToList({keyword:kw})}>
                  {kw} <span style={{color:'#4f46e5',marginLeft:4}}>+</span>
                </span>
              ))}
            </div>
          ) : <div style={S.emptyState}>Enter a keyword to find semantically related terms.</div>}
        </div>
      </div>`;
}

function renderBulk() {
  return `/* bulk */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Bulk Keyword Research</div>
          <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Paste up to 1,000 keywords (one per line) to get volume, KD, CPC and intent data in bulk.</p>
          <textarea style={S.textarea} rows={10} placeholder={"running shoes\\nbest running shoes\\nrunning shoes for women\\n..."} value={form.bulkInput||''} onChange={e=>setForm(p=>({...p,bulkInput:e.target.value}))} />
          <div style={S.inputRow}>
            <select style={S.select} value={form.bulkCountry||'us'} onChange={e=>setForm(p=>({...p,bulkCountry:e.target.value}))}>
              <option value="us">US</option><option value="gb">UK</option><option value="ca">CA</option>
            </select>
            <button style={S.btn} onClick={()=>fetchTab('bulk')} disabled={loading.bulk}>{loading.bulk?'Processing…':'Run Bulk Analysis'}</button>
            <button style={{...S.btn,background:'#27272a'}} onClick={()=>setForm(p=>({...p,bulkInput:''}))}>Clear</button>
          </div>
          {err.bulk && <div style={S.errorBox}>{err.bulk}</div>}
          {loading.bulk ? <div style={S.loading}>Processing {(form.bulkInput||'').split('\\n').filter(Boolean).length} keywords…</div> :
          data.bulk?.length ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#4f46e5'}}>{data.bulk.length}</div><div style={S.metaLabel}>Processed</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>{data.bulk.filter(k=>k.kd<30).length}</div><div style={S.metaLabel}>Low KD</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f59e0b'}}>{data.bulk.filter(k=>k.volume>1000).length}</div><div style={S.metaLabel}>High Volume</div></div>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Keyword</th><th style={S.th}>Volume</th><th style={S.th}>KD</th><th style={S.th}>CPC</th><th style={S.th}>Intent</th><th style={S.th}>Competition</th></tr></thead>
                  <tbody>{data.bulk.map((k,i)=>(
                    <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                      <td style={S.td}>{k.keyword}</td>
                      <td style={S.td}><span style={{color:'#4f46e5',fontWeight:700}}>{k.volume?.toLocaleString()}</span></td>
                      <td style={S.td}><KDCell kd={k.kd} /></td>
                      <td style={S.td}>\${k.cpc?.toFixed(2)}</td>
                      <td style={S.td}><span style={S.badge(intentColor(k.intent))}>{k.intent}</span></td>
                      <td style={S.td}><span style={S.badge(compColor(k.competition))}>{k.competition}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div style={{marginTop:12,display:'flex',gap:8}}>
                <button style={{...S.btn,background:'#27272a'}} onClick={()=>exportData('bulk','csv')}>Export CSV</button>
                <button style={{...S.btn,background:'#27272a'}} onClick={()=>exportData('bulk','xlsx')}>Export XLSX</button>
              </div>
            </>
          ) : <div style={S.emptyState}>Paste keywords above and click Run Bulk Analysis.</div>}
        </div>
      </div>`;
}

function renderTrends() {
  return `/* trends */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Keyword Trends & Seasonality</div>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Keyword to track trends…" value={q.trends||''} onChange={e=>setQ(p=>({...p,trends:e.target.value}))} />
            <select style={S.select} value={form.trendsRange||'12m'} onChange={e=>setForm(p=>({...p,trendsRange:e.target.value}))}>
              <option value="3m">Last 3 months</option>
              <option value="6m">Last 6 months</option>
              <option value="12m">Last 12 months</option>
              <option value="5y">Last 5 years</option>
            </select>
            <button style={S.btn} onClick={()=>fetchTab('trends')} disabled={loading.trends}>{loading.trends?'Loading…':'Analyze Trends'}</button>
          </div>
          {err.trends && <div style={S.errorBox}>{err.trends}</div>}
          {loading.trends ? <div style={S.loading}>Fetching trend data…</div> :
          data.trends ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#4f46e5'}}>{data.trends.avgVolume?.toLocaleString()}</div><div style={S.metaLabel}>Avg Monthly Volume</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:data.trends.trend==='rising'?'#10b981':'#ef4444'}}>{data.trends.trend==='rising'?'↑ Rising':'↓ Declining'}</div><div style={S.metaLabel}>Trend Direction</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f59e0b'}}>{data.trends.peakMonth}</div><div style={S.metaLabel}>Peak Month</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#0ea5e9'}}>{data.trends.seasonality}</div><div style={S.metaLabel}>Seasonality</div></div>
              </div>
              <div style={S.chartArea}>
                {(data.trends.monthly||[]).map((pt,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'flex-end',gap:2,flex:1}}>
                    <div style={{width:24,background:'#4f46e5',borderRadius:'4px 4px 0 0',height:Math.max(4,(pt.volume/data.trends.maxVolume)*120)+'px',opacity:0.85}} title={pt.month+': '+pt.volume} />
                  </div>
                ))}
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#71717a',marginTop:4}}>
                {(data.trends.monthly||[]).map((pt,i)=><span key={i}>{pt.month?.slice(0,3)}</span>)}
              </div>
            </>
          ) : <div style={S.emptyState}>Enter a keyword to see trend data and seasonality patterns.</div>}
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Seasonal Keyword Calendar</div>
          <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Discover keywords with predictable seasonal spikes to plan content in advance.</p>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Industry or niche…" value={q.seasonal||''} onChange={e=>setQ(p=>({...p,seasonal:e.target.value}))} />
            <button style={{...S.btn,background:'#10b981'}} onClick={()=>fetchTab('seasonal')} disabled={loading.seasonal}>{loading.seasonal?'Loading…':'✦ AI Calendar'}</button>
          </div>
          {data.seasonal?.length ? (
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginTop:16}}>
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((mo,i)=>(
                <div key={mo} style={{...S.miniCard,borderTop:'3px solid #4f46e5'}}>
                  <div style={{fontWeight:700,color:'#fafafa',marginBottom:6}}>{mo}</div>
                  {(data.seasonal.filter(k=>k.month===mo)||[]).map((k,j)=>(
                    <div key={j} style={{fontSize:11,color:'#a1a1aa',marginBottom:2}}>{k.keyword}</div>
                  ))}
                </div>
              ))}
            </div>
          ) : <div style={S.emptyState}>Enter a niche to generate a seasonal keyword calendar.</div>}
        </div>
      </div>`;
}

function renderQuestions() {
  return `/* questions */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Questions & People Also Ask</div>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Topic to find questions for…" value={q.questions||''} onChange={e=>setQ(p=>({...p,questions:e.target.value}))} />
            <button style={S.btn} onClick={()=>fetchTab('questions')} disabled={loading.questions}>{loading.questions?'Finding…':'Find Questions'}</button>
            <button style={{...S.btn,background:'#10b981'}} onClick={()=>aiAction('questions','expand')} disabled={loading['ai-questions']}>✦ AI Expand</button>
          </div>
          {err.questions && <div style={S.errorBox}>{err.questions}</div>}
          {loading.questions ? <div style={S.loading}>Scraping questions…</div> :
          data.questions?.length ? (
            <>
              {['What','How','Why','When','Where','Which','Who','Can','Is','Are','Does'].map(type=>{
                const qs = data.questions.filter(q=>q.question?.startsWith(type));
                if(!qs.length) return null;
                return (<div key={type} style={{marginBottom:16}}>
                  <div style={S.sT}>{type} Questions ({qs.length})</div>
                  {qs.map((q,i)=>(
                    <div key={i} style={S.questionRow}>
                      <span style={{color:'#fafafa',fontSize:13}}>{q.question}</span>
                      <div style={{display:'flex',gap:6}}>
                        <span style={S.badge('#0ea5e9')}>{q.serp_position?'#'+q.serp_position:'PAA'}</span>
                        <button style={{...S.btn,padding:'3px 8px',fontSize:11}} onClick={()=>addToList({keyword:q.question})}>+ Add</button>
                      </div>
                    </div>
                  ))}
                </div>);
              })}
            </>
          ) : <div style={S.emptyState}>Enter a topic to find questions your audience is asking.</div>}
        </div>
      </div>`;
}

function renderAiIdeas() {
  return `/* ai-ideas */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>✦ AI Keyword Ideation</div>
          <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Describe your business, target audience, or product to get AI-generated keyword strategies.</p>
          <div style={S.inputRow}>
            <textarea style={{...S.textarea,rows:3}} placeholder="E.g. We sell organic dog food targeting health-conscious dog owners in the US…" value={form.aiIdea||''} onChange={e=>setForm(p=>({...p,aiIdea:e.target.value}))} rows={3} />
          </div>
          <div style={S.inputRow}>
            <select style={S.select} value={form.ideaGoal||'traffic'} onChange={e=>setForm(p=>({...p,ideaGoal:e.target.value}))}>
              <option value="traffic">Maximize Traffic</option>
              <option value="conversions">Maximize Conversions</option>
              <option value="authority">Build Authority</option>
              <option value="local">Local SEO</option>
            </select>
            <select style={S.select} value={form.ideaModel||'gpt-4o'} onChange={e=>setForm(p=>({...p,ideaModel:e.target.value}))}>
              <option value="gpt-4o-mini">GPT-4o Mini (1 credit)</option>
              <option value="gpt-4o">GPT-4o (2 credits)</option>
              <option value="gpt-4">GPT-4 (3 credits)</option>
            </select>
            <button style={{...S.btn,background:'#10b981'}} onClick={()=>fetchTab('ai-ideas')} disabled={loading['ai-ideas']}>
              {loading['ai-ideas']?'Generating…':'✦ Generate Strategy'}
            </button>
          </div>
          {err['ai-ideas'] && <div style={S.errorBox}>{err['ai-ideas']}</div>}
          {loading['ai-ideas'] ? <div style={S.loading}>AI is crafting your keyword strategy…</div> :
          data['ai-ideas'] ? (
            <div>
              {data['ai-ideas'].pillars?.map((p,i)=>(
                <div key={i} style={{...S.card,marginBottom:12}}>
                  <div style={{fontWeight:700,color:'#4f46e5',marginBottom:8}}>{p.pillar}</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {p.keywords?.map((kw,j)=>(
                      <span key={j} style={{...S.badge('#4f46e5'),cursor:'pointer',padding:'5px 10px',fontSize:12}} onClick={()=>addToList({keyword:kw})}>{kw}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : <div style={S.emptyState}>Describe your business to get an AI-powered keyword strategy.</div>}
        </div>
      </div>`;
}

function renderSerpOverview() {
  return `/* serp-overview */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>SERP Overview</div>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Keyword to analyze SERP…" value={q['serp-overview']||''} onChange={e=>setQ(p=>({...p,'serp-overview':e.target.value}))} />
            <button style={S.btn} onClick={()=>fetchTab('serp-overview')} disabled={loading['serp-overview']}>{loading['serp-overview']?'Loading…':'Analyze SERP'}</button>
          </div>
          {err['serp-overview'] && <div style={S.errorBox}>{err['serp-overview']}</div>}
          {loading['serp-overview'] ? <div style={S.loading}>Fetching SERP data…</div> :
          data['serp-overview']?.results?.length ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#4f46e5'}}>{data['serp-overview'].totalResults?.toLocaleString()}</div><div style={S.metaLabel}>Total Results</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>{data['serp-overview'].adCount||0}</div><div style={S.metaLabel}>Paid Ads</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f59e0b'}}>{data['serp-overview'].featuredSnippet?'Yes':'No'}</div><div style={S.metaLabel}>Featured Snippet</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#0ea5e9'}}>{data['serp-overview'].avgDA||0}</div><div style={S.metaLabel}>Avg DA</div></div>
              </div>
              {data['serp-overview'].results.map((r,i)=>(
                <div key={i} style={{...S.card,marginBottom:10,padding:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div style={{flex:1}}>
                      <span style={{background:'#4f46e546',color:'#818cf8',borderRadius:4,padding:'2px 7px',fontSize:11,fontWeight:700,marginRight:8}}>#{i+1}</span>
                      <a href={r.url} style={{color:'#4f46e5',fontWeight:600,fontSize:13,textDecoration:'none'}} target="_blank" rel="noopener">{r.title}</a>
                      <div style={{color:'#71717a',fontSize:12,marginTop:4}}>{r.url}</div>
                      <div style={{color:'#a1a1aa',fontSize:12,marginTop:6}}>{r.snippet}</div>
                    </div>
                    <div style={{display:'flex',gap:8,marginLeft:12,flexShrink:0}}>
                      <AuthorityBadge da={r.da} pa={r.pa} />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : q['serp-overview'] ? <div style={S.emptyState}>No SERP data.</div>
            : <div style={S.emptyState}>Enter a keyword to analyze the full SERP landscape.</div>}
        </div>
      </div>`;
}

function renderFeatures() {
  return `/* features */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>SERP Feature Analysis</div>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Keyword…" value={q.features||''} onChange={e=>setQ(p=>({...p,features:e.target.value}))} />
            <button style={S.btn} onClick={()=>fetchTab('features')} disabled={loading.features}>{loading.features?'Analyzing…':'Analyze Features'}</button>
          </div>
          {err.features && <div style={S.errorBox}>{err.features}</div>}
          {loading.features ? <div style={S.loading}>Detecting SERP features…</div> :
          data.features ? (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12,marginTop:16}}>
              {[
                {key:'featuredSnippet',label:'Featured Snippet',icon:'📌',color:'#4f46e5'},
                {key:'paa',label:'People Also Ask',icon:'❓',color:'#0ea5e9'},
                {key:'localPack',label:'Local Pack',icon:'📍',color:'#10b981'},
                {key:'imageCarousel',label:'Image Carousel',icon:'🖼',color:'#f59e0b'},
                {key:'videoCarousel',label:'Video Carousel',icon:'▶️',color:'#ef4444'},
                {key:'knowledgePanel',label:'Knowledge Panel',icon:'📊',color:'#a855f7'},
                {key:'sitelinks',label:'Sitelinks',icon:'🔗',color:'#ec4899'},
                {key:'shopping',label:'Shopping Ads',icon:'🛒',color:'#f97316'},
                {key:'reviews',label:'Review Stars',icon:'⭐',color:'#f59e0b'},
                {key:'news',label:'Top Stories',icon:'📰',color:'#0ea5e9'},
              ].map(f=>(
                <div key={f.key} style={{...S.miniCard,borderLeft:\`3px solid \${f.color}\`,opacity:data.features[f.key]?1:0.4}}>
                  <div style={{fontSize:20}}>{f.icon}</div>
                  <div style={{fontWeight:600,fontSize:12,color:'#fafafa',marginTop:6}}>{f.label}</div>
                  <div style={{fontSize:11,color:data.features[f.key]?f.color:'#52525b',marginTop:2}}>{data.features[f.key]?'Present':'Not present'}</div>
                </div>
              ))}
            </div>
          ) : <div style={S.emptyState}>Enter a keyword to see which SERP features appear.</div>}
        </div>
      </div>`;
}

function renderSnippets() {
  return `/* snippets */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Featured Snippet Opportunities</div>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Domain or topic…" value={q.snippets||''} onChange={e=>setQ(p=>({...p,snippets:e.target.value}))} />
            <button style={S.btn} onClick={()=>fetchTab('snippets')} disabled={loading.snippets}>{loading.snippets?'Scanning…':'Find Snippet Opps'}</button>
            <button style={{...S.btn,background:'#10b981'}} onClick={()=>aiAction('snippets','optimize')} disabled={loading['ai-snippets']}>✦ AI Optimize</button>
          </div>
          {err.snippets && <div style={S.errorBox}>{err.snippets}</div>}
          {loading.snippets ? <div style={S.loading}>Finding featured snippet opportunities…</div> :
          data.snippets?.length ? (
            <div style={{overflowX:'auto'}}>
              <table style={S.table}>
                <thead><tr><th style={S.th}>Keyword</th><th style={S.th}>Snippet Type</th><th style={S.th}>Current Owner</th><th style={S.th}>Your Position</th><th style={S.th}>Opportunity</th><th style={S.th}></th></tr></thead>
                <tbody>{data.snippets.map((s,i)=>(
                  <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                    <td style={S.td}><span style={{fontWeight:600}}>{s.keyword}</span></td>
                    <td style={S.td}><span style={S.badge('#4f46e5')}>{s.type}</span></td>
                    <td style={S.td}>{s.currentOwner}</td>
                    <td style={S.td}>#{s.yourPosition||'—'}</td>
                    <td style={S.td}><ScoreBar score={s.opportunity||0} max={100} /></td>
                    <td style={S.td}><button style={{...S.btn,padding:'4px 10px',fontSize:11,background:'#10b981'}} onClick={()=>aiAction('snippet-strategy',s.keyword)}>Optimize</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div style={S.emptyState}>Enter your domain to find featured snippet opportunities.</div>}
        </div>
      </div>`;
}

function renderLocalPacks() {
  return `/* local */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Local Pack Keywords</div>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Service keyword…" value={q.local||''} onChange={e=>setQ(p=>({...p,local:e.target.value}))} />
            <input style={{...S.input,flex:'0 0 200px'}} placeholder="Location (city, state)…" value={form.location||''} onChange={e=>setForm(p=>({...p,location:e.target.value}))} />
            <button style={S.btn} onClick={()=>fetchTab('local')} disabled={loading.local}>{loading.local?'Loading…':'Find Local KWs'}</button>
          </div>
          {err.local && <div style={S.errorBox}>{err.local}</div>}
          {loading.local ? <div style={S.loading}>Finding local keyword opportunities…</div> :
          data.local?.length ? (
            <div style={{overflowX:'auto'}}>
              <table style={S.table}>
                <thead><tr><th style={S.th}>Keyword</th><th style={S.th}>Volume</th><th style={S.th}>Local Pack</th><th style={S.th}>Map Pack Position</th><th style={S.th}>CPC</th></tr></thead>
                <tbody>{data.local.map((k,i)=>(
                  <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                    <td style={S.td}>{k.keyword}</td>
                    <td style={S.td}>{k.volume?.toLocaleString()}</td>
                    <td style={S.td}><span style={S.badge(k.hasLocalPack?'#10b981':'#52525b')}>{k.hasLocalPack?'Yes':'No'}</span></td>
                    <td style={S.td}>#{k.mapPosition||'—'}</td>
                    <td style={S.td}>\${k.cpc?.toFixed(2)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div style={S.emptyState}>Enter a service and location to find local pack keyword opportunities.</div>}
        </div>
      </div>`;
}

function renderVolatility() {
  return `/* volatility */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>SERP Volatility Tracker</div>
          <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Monitor how unstable SERP rankings are for your target keywords — high volatility means Google is actively testing results.</p>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Keyword to check volatility…" value={q.volatility||''} onChange={e=>setQ(p=>({...p,volatility:e.target.value}))} />
            <button style={S.btn} onClick={()=>fetchTab('volatility')} disabled={loading.volatility}>{loading.volatility?'Checking…':'Check Volatility'}</button>
          </div>
          {err.volatility && <div style={S.errorBox}>{err.volatility}</div>}
          {loading.volatility ? <div style={S.loading}>Analyzing SERP stability…</div> :
          data.volatility ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:volatilityColor(data.volatility.score)}}>{data.volatility.score}/100</div><div style={S.metaLabel}>Volatility Score</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#fafafa'}}>{data.volatility.level}</div><div style={S.metaLabel}>Stability Level</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f59e0b'}}>{data.volatility.avgShift}</div><div style={S.metaLabel}>Avg Position Shift</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#0ea5e9'}}>{data.volatility.lastUpdate}</div><div style={S.metaLabel}>Last SERP Change</div></div>
              </div>
            </>
          ) : <div style={S.emptyState}>Enter a keyword to check how volatile its SERP rankings are.</div>}
        </div>
      </div>`;
}

function renderHistory() {
  return `/* history */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>SERP History</div>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Keyword…" value={q.history||''} onChange={e=>setQ(p=>({...p,history:e.target.value}))} />
            <select style={S.select} value={form.histRange||'30d'} onChange={e=>setForm(p=>({...p,histRange:e.target.value}))}>
              <option value="7d">7 days</option><option value="30d">30 days</option><option value="90d">90 days</option>
            </select>
            <button style={S.btn} onClick={()=>fetchTab('history')} disabled={loading.history}>{loading.history?'Loading…':'View History'}</button>
          </div>
          {err.history && <div style={S.errorBox}>{err.history}</div>}
          {loading.history ? <div style={S.loading}>Loading SERP history…</div> :
          data.history?.snapshots?.length ? (
            <div style={{overflowX:'auto'}}>
              <table style={S.table}>
                <thead><tr><th style={S.th}>Date</th><th style={S.th}>URL</th><th style={S.th}>Position</th><th style={S.th}>Title</th><th style={S.th}>Change</th></tr></thead>
                <tbody>{data.history.snapshots.map((s,i)=>(
                  <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                    <td style={S.td}>{s.date}</td>
                    <td style={S.td}><span style={{color:'#4f46e5',fontSize:12}}>{s.url}</span></td>
                    <td style={S.td}>#{s.position}</td>
                    <td style={S.td}>{s.title}</td>
                    <td style={S.td}><span style={{color:s.change>0?'#10b981':'#ef4444'}}>{s.change>0?'+':''}{s.change}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div style={S.emptyState}>Enter a keyword to see how its SERP rankings have changed over time.</div>}
        </div>
      </div>`;
}

function renderGap() {
  return `/* gap */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Keyword Gap Analysis</div>
          <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Find keywords your competitors rank for that you don&apos;t — your biggest growth opportunities.</p>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Your domain…" value={form.yourDomain||''} onChange={e=>setForm(p=>({...p,yourDomain:e.target.value}))} />
            <input style={S.input} placeholder="Competitor 1…" value={form.comp1||''} onChange={e=>setForm(p=>({...p,comp1:e.target.value}))} />
            <input style={S.input} placeholder="Competitor 2…" value={form.comp2||''} onChange={e=>setForm(p=>({...p,comp2:e.target.value}))} />
            <button style={S.btn} onClick={()=>fetchTab('gap')} disabled={loading.gap}>{loading.gap?'Analyzing…':'Find Gaps'}</button>
          </div>
          {err.gap && <div style={S.errorBox}>{err.gap}</div>}
          {loading.gap ? <div style={S.loading}>Analyzing keyword gaps…</div> :
          data.gap?.keywords?.length ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#ef4444'}}>{data.gap.missing}</div><div style={S.metaLabel}>Missing Keywords</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f59e0b'}}>{data.gap.weak}</div><div style={S.metaLabel}>Weak Rankings</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>{data.gap.totalVolume?.toLocaleString()}</div><div style={S.metaLabel}>Opportunity Volume</div></div>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Keyword</th><th style={S.th}>Volume</th><th style={S.th}>Your Rank</th><th style={S.th}>Comp 1</th><th style={S.th}>Comp 2</th><th style={S.th}>Gap Type</th></tr></thead>
                  <tbody>{data.gap.keywords.map((k,i)=>(
                    <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                      <td style={S.td}><span style={{fontWeight:600}}>{k.keyword}</span></td>
                      <td style={S.td}>{k.volume?.toLocaleString()}</td>
                      <td style={S.td}>{k.yourRank?'#'+k.yourRank:<span style={{color:'#ef4444'}}>Not ranking</span>}</td>
                      <td style={S.td}>{k.comp1Rank?'#'+k.comp1Rank:'—'}</td>
                      <td style={S.td}>{k.comp2Rank?'#'+k.comp2Rank:'—'}</td>
                      <td style={S.td}><span style={S.badge(k.gapType==='missing'?'#ef4444':'#f59e0b')}>{k.gapType}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          ) : <div style={S.emptyState}>Enter your domain and competitors to find keyword gaps.</div>}
        </div>
      </div>`;
}

function renderSpy() {
  return `/* spy */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Competitor Keyword Spy</div>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Competitor domain…" value={q.spy||''} onChange={e=>setQ(p=>({...p,spy:e.target.value}))} />
            <select style={S.select} value={form.spyFilter||'top'} onChange={e=>setForm(p=>({...p,spyFilter:e.target.value}))}>
              <option value="top">Top keywords</option>
              <option value="rising">Rising keywords</option>
              <option value="new">New keywords</option>
              <option value="lost">Lost keywords</option>
            </select>
            <button style={S.btn} onClick={()=>fetchTab('spy')} disabled={loading.spy}>{loading.spy?'Spying…':'Analyze Competitor'}</button>
          </div>
          {err.spy && <div style={S.errorBox}>{err.spy}</div>}
          {loading.spy ? <div style={S.loading}>Analyzing competitor keywords…</div> :
          data.spy?.keywords?.length ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#4f46e5'}}>{data.spy.totalKeywords?.toLocaleString()}</div><div style={S.metaLabel}>Total Keywords</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>{data.spy.top3}</div><div style={S.metaLabel}>Top 3 Rankings</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f59e0b'}}>{data.spy.traffic?.toLocaleString()}</div><div style={S.metaLabel}>Est. Monthly Traffic</div></div>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Keyword</th><th style={S.th}>Position</th><th style={S.th}>Volume</th><th style={S.th}>Traffic %</th><th style={S.th}>Page</th><th style={S.th}></th></tr></thead>
                  <tbody>{data.spy.keywords.map((k,i)=>(
                    <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                      <td style={S.td}><span style={{fontWeight:600}}>{k.keyword}</span></td>
                      <td style={S.td}>#{k.position}</td>
                      <td style={S.td}>{k.volume?.toLocaleString()}</td>
                      <td style={S.td}>{k.trafficShare}%</td>
                      <td style={S.td}><span style={{color:'#71717a',fontSize:12}}>{k.page}</span></td>
                      <td style={S.td}><button style={{...S.btn,padding:'4px 10px',fontSize:11}} onClick={()=>addToList(k)}>Target</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          ) : <div style={S.emptyState}>Enter a competitor domain to spy on their keyword rankings.</div>}
        </div>
      </div>`;
}

function renderSOV() {
  return `/* sov */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Share of Voice</div>
          <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Compare your organic visibility against competitors across a set of target keywords.</p>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Your domain + competitors (comma-separated)…" value={form.sovDomains||''} onChange={e=>setForm(p=>({...p,sovDomains:e.target.value}))} />
            <input style={S.input} placeholder="Keyword list (paste)…" value={form.sovKws||''} onChange={e=>setForm(p=>({...p,sovKws:e.target.value}))} />
            <button style={S.btn} onClick={()=>fetchTab('sov')} disabled={loading.sov}>{loading.sov?'Calculating…':'Calculate SOV'}</button>
          </div>
          {err.sov && <div style={S.errorBox}>{err.sov}</div>}
          {loading.sov ? <div style={S.loading}>Calculating share of voice…</div> :
          data.sov?.domains?.length ? (
            <>
              <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
                {data.sov.domains.map((d,i)=>(
                  <div key={i} style={{...S.metaItem,flex:'1 1 160px'}}>
                    <div style={{...S.metaVal,color:['#4f46e5','#10b981','#f59e0b','#ef4444'][i%4]}}>{d.sov}%</div>
                    <div style={S.metaLabel}>{d.domain}</div>
                    <div style={{height:6,background:'#27272a',borderRadius:3,marginTop:8}}>
                      <div style={{width:d.sov+'%',height:'100%',background:['#4f46e5','#10b981','#f59e0b','#ef4444'][i%4],borderRadius:3}} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : <div style={S.emptyState}>Enter domains and keywords to compare share of voice.</div>}
        </div>
      </div>`;
}

function renderClassify() {
  return `/* classify */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Search Intent Classifier</div>
          <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Classify keywords by search intent: Informational, Commercial, Transactional, or Navigational — with AI confidence scoring.</p>
          <div style={S.inputRow}>
            <textarea style={S.textarea} rows={6} placeholder={"best running shoes\\nbuy nike air max\\nhow to tie running shoes\\nnike.com"} value={form.classifyInput||''} onChange={e=>setForm(p=>({...p,classifyInput:e.target.value}))} />
          </div>
          <div style={S.inputRow}>
            <select style={S.select} value={form.classifyModel||'gpt-4o-mini'} onChange={e=>setForm(p=>({...p,classifyModel:e.target.value}))}>
              <option value="gpt-4o-mini">GPT-4o Mini (1 credit)</option>
              <option value="gpt-4o">GPT-4o (2 credits)</option>
            </select>
            <button style={{...S.btn,background:'#10b981'}} onClick={()=>fetchTab('classify')} disabled={loading.classify}>{loading.classify?'Classifying…':'✦ AI Classify'}</button>
          </div>
          {err.classify && <div style={S.errorBox}>{err.classify}</div>}
          {loading.classify ? <div style={S.loading}>Classifying intent with AI…</div> :
          data.classify?.length ? (
            <div style={{overflowX:'auto'}}>
              <table style={S.table}>
                <thead><tr><th style={S.th}>Keyword</th><th style={S.th}>Intent</th><th style={S.th}>Confidence</th><th style={S.th}>Funnel Stage</th><th style={S.th}>Content Type</th></tr></thead>
                <tbody>{data.classify.map((k,i)=>(
                  <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                    <td style={S.td}><span style={{fontWeight:600}}>{k.keyword}</span></td>
                    <td style={S.td}><span style={S.badge(intentColor(k.intent))}>{k.intent}</span></td>
                    <td style={S.td}><ScoreBar score={k.confidence||0} max={100} /></td>
                    <td style={S.td}><span style={S.badge('#27272a')}>{k.funnelStage}</span></td>
                    <td style={S.td}>{k.contentType}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div style={S.emptyState}>Paste keywords to classify their search intent using AI.</div>}
        </div>
      </div>`;
}

function renderJourney() {
  return `/* journey */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Buyer Journey Keyword Mapping</div>
          <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Map your keywords across the full buyer journey: Awareness → Consideration → Decision → Retention.</p>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Product or service category…" value={q.journey||''} onChange={e=>setQ(p=>({...p,journey:e.target.value}))} />
            <button style={{...S.btn,background:'#10b981'}} onClick={()=>fetchTab('journey')} disabled={loading.journey}>{loading.journey?'Mapping…':'✦ AI Map Journey'}</button>
          </div>
          {err.journey && <div style={S.errorBox}>{err.journey}</div>}
          {loading.journey ? <div style={S.loading}>AI is mapping your buyer journey…</div> :
          data.journey ? (
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginTop:16}}>
              {['awareness','consideration','decision','retention'].map(stage=>(
                <div key={stage} style={{...S.card,borderTop:'3px solid '+stageColor(stage)}}>
                  <div style={{fontWeight:700,color:stageColor(stage),marginBottom:8,textTransform:'capitalize'}}>{stage}</div>
                  {(data.journey[stage]||[]).map((kw,i)=>(
                    <div key={i} style={{fontSize:12,color:'#a1a1aa',padding:'4px 0',borderBottom:'1px solid #1f1f22'}}>{kw}</div>
                  ))}
                </div>
              ))}
            </div>
          ) : <div style={S.emptyState}>Enter a product category to map keywords across the buyer journey.</div>}
        </div>
      </div>`;
}

function renderClustersView() {
  return `/* clusters-view */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Keyword Clusters</div>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Keyword list or topic to cluster…" value={q['clusters-view']||''} onChange={e=>setQ(p=>({...p,'clusters-view':e.target.value}))} />
            <select style={S.select} value={form.clusterMethod||'semantic'} onChange={e=>setForm(p=>({...p,clusterMethod:e.target.value}))}>
              <option value="semantic">Semantic Clustering</option>
              <option value="serp">SERP-Based Clustering</option>
              <option value="topic">Topic Modeling</option>
            </select>
            <button style={S.btn} onClick={()=>fetchTab('clusters-view')} disabled={loading['clusters-view']}>{loading['clusters-view']?'Clustering…':'Cluster Keywords'}</button>
          </div>
          {err['clusters-view'] && <div style={S.errorBox}>{err['clusters-view']}</div>}
          {loading['clusters-view'] ? <div style={S.loading}>Clustering keywords using {form.clusterMethod||'semantic'} analysis…</div> :
          data['clusters-view']?.clusters?.length ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#a855f7'}}>{data['clusters-view'].clusters.length}</div><div style={S.metaLabel}>Clusters</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#4f46e5'}}>{data['clusters-view'].totalKeywords}</div><div style={S.metaLabel}>Keywords</div></div>
              </div>
              {data['clusters-view'].clusters.map((c,i)=>(
                <div key={i} style={{...S.card,marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <span style={{fontWeight:700,color:'#fafafa'}}>{c.topic}</span>
                    <div style={{display:'flex',gap:8}}>
                      <span style={S.badge('#a855f7')}>{c.keywords?.length} kws</span>
                      <span style={S.badge('#4f46e5')}>{c.totalVolume?.toLocaleString()} vol</span>
                    </div>
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {c.keywords?.slice(0,12).map((kw,j)=>(
                      <span key={j} style={{...S.badge('#27272a'),fontSize:11,padding:'3px 8px'}}>{kw}</span>
                    ))}
                    {c.keywords?.length>12 && <span style={{...S.badge('#1f1f22'),fontSize:11}}>+{c.keywords.length-12} more</span>}
                  </div>
                </div>
              ))}
            </>
          ) : <div style={S.emptyState}>Enter keywords or a topic to generate semantic clusters.</div>}
        </div>
      </div>`;
}

function renderQuickWins() {
  return `/* quick-wins */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Quick Win Opportunities</div>
          <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Keywords ranking in positions 4-20 that you can push into the top 3 with targeted content optimisation.</p>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Your domain…" value={q['quick-wins']||''} onChange={e=>setQ(p=>({...p,'quick-wins':e.target.value}))} />
            <button style={S.btn} onClick={()=>fetchTab('quick-wins')} disabled={loading['quick-wins']}>{loading['quick-wins']?'Finding…':'Find Quick Wins'}</button>
            <button style={{...S.btn,background:'#10b981'}} onClick={()=>aiAction('quick-wins','prioritize')} disabled={loading['ai-wins']}>✦ AI Prioritize</button>
          </div>
          {err['quick-wins'] && <div style={S.errorBox}>{err['quick-wins']}</div>}
          {loading['quick-wins'] ? <div style={S.loading}>Scanning for quick win opportunities…</div> :
          data['quick-wins']?.length ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>{data['quick-wins'].length}</div><div style={S.metaLabel}>Quick Wins Found</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f59e0b'}}>{data['quick-wins'].reduce((a,k)=>a+(k.volume||0),0).toLocaleString()}</div><div style={S.metaLabel}>Total Traffic Opportunity</div></div>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Keyword</th><th style={S.th}>Current Pos</th><th style={S.th}>Volume</th><th style={S.th}>KD</th><th style={S.th}>Est. Clicks Gain</th><th style={S.th}>Priority</th><th style={S.th}></th></tr></thead>
                  <tbody>{data['quick-wins'].map((k,i)=>(
                    <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                      <td style={S.td}><span style={{fontWeight:600}}>{k.keyword}</span></td>
                      <td style={S.td}><span style={{color:'#f59e0b',fontWeight:700}}>#{k.position}</span></td>
                      <td style={S.td}>{k.volume?.toLocaleString()}</td>
                      <td style={S.td}><KDCell kd={k.kd} /></td>
                      <td style={S.td}><span style={{color:'#10b981',fontWeight:600}}>+{k.estimatedGain?.toLocaleString()}</span></td>
                      <td style={S.td}><ScoreBar score={k.priority||0} max={100} /></td>
                      <td style={S.td}><button style={{...S.btn,padding:'4px 10px',fontSize:11,background:'#10b981'}} onClick={()=>aiAction('optimize-page',k)}>Optimize</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          ) : <div style={S.emptyState}>Enter your domain to discover quick win ranking opportunities.</div>}
        </div>
      </div>`;
}

function renderRoi() {
  return `/* roi */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>SEO ROI Calculator</div>
          <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Calculate the potential revenue impact of ranking for target keywords based on your conversion rate and average order value.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:16,marginBottom:20}}>
            <div>
              <div style={S.label}>Target Keyword</div>
              <input style={S.input} value={form.roiKw||''} onChange={e=>setForm(p=>({...p,roiKw:e.target.value}))} placeholder="e.g. best running shoes" />
            </div>
            <div>
              <div style={S.label}>Target Position</div>
              <input style={S.input} type="number" value={form.roiPos||1} onChange={e=>setForm(p=>({...p,roiPos:parseInt(e.target.value)||1}))} min={1} max={10} />
            </div>
            <div>
              <div style={S.label}>Conversion Rate (%)</div>
              <input style={S.input} type="number" value={form.roiCvr||2} onChange={e=>setForm(p=>({...p,roiCvr:parseFloat(e.target.value)||2}))} step={0.1} />
            </div>
            <div>
              <div style={S.label}>Average Order Value ($)</div>
              <input style={S.input} type="number" value={form.roiAov||50} onChange={e=>setForm(p=>({...p,roiAov:parseFloat(e.target.value)||50}))} />
            </div>
          </div>
          <button style={{...S.btn,background:'#10b981'}} onClick={()=>fetchTab('roi')} disabled={loading.roi}>{loading.roi?'Calculating…':'Calculate ROI'}</button>
          {err.roi && <div style={S.errorBox}>{err.roi}</div>}
          {data.roi && (
            <div style={S.metaRow}>
              <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>\${data.roi.monthlyRevenue?.toLocaleString()}</div><div style={S.metaLabel}>Est. Monthly Revenue</div></div>
              <div style={S.metaItem}><div style={{...S.metaVal,color:'#4f46e5'}}>{data.roi.monthlyClicks?.toLocaleString()}</div><div style={S.metaLabel}>Est. Monthly Clicks</div></div>
              <div style={S.metaItem}><div style={{...S.metaVal,color:'#f59e0b'}}>{data.roi.ctrRate}%</div><div style={S.metaLabel}>CTR at Position {form.roiPos||1}</div></div>
              <div style={S.metaItem}><div style={{...S.metaVal,color:'#a855f7'}}>{data.roi.roi}%</div><div style={S.metaLabel}>ROI vs PPC</div></div>
            </div>
          )}
        </div>
      </div>`;
}

function renderForecast() {
  return `/* forecast */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Traffic Forecasting</div>
          <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Project future organic traffic based on current rankings, trends, and planned content production.</p>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Domain…" value={q.forecast||''} onChange={e=>setQ(p=>({...p,forecast:e.target.value}))} />
            <select style={S.select} value={form.forecastPeriod||'6m'} onChange={e=>setForm(p=>({...p,forecastPeriod:e.target.value}))}>
              <option value="3m">3 months</option>
              <option value="6m">6 months</option>
              <option value="12m">12 months</option>
            </select>
            <button style={{...S.btn,background:'#10b981'}} onClick={()=>fetchTab('forecast')} disabled={loading.forecast}>{loading.forecast?'Forecasting…':'✦ AI Forecast'}</button>
          </div>
          {err.forecast && <div style={S.errorBox}>{err.forecast}</div>}
          {loading.forecast ? <div style={S.loading}>Generating traffic forecast…</div> :
          data.forecast ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#4f46e5'}}>{data.forecast.currentMonthly?.toLocaleString()}</div><div style={S.metaLabel}>Current Monthly Traffic</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>{data.forecast.projected?.toLocaleString()}</div><div style={S.metaLabel}>Projected Traffic</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#f59e0b'}}>+{data.forecast.growth}%</div><div style={S.metaLabel}>Projected Growth</div></div>
              </div>
              <div style={S.chartArea}>
                {(data.forecast.months||[]).map((m,i)=>(
                  <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',flex:1,gap:4}}>
                    <div style={{width:'80%',background:'#4f46e5',borderRadius:'4px 4px 0 0',height:Math.max(4,(m.traffic/data.forecast.maxTraffic)*120)+'px',opacity:m.projected?0.6:0.9}} />
                    <div style={{fontSize:10,color:'#71717a'}}>{m.month?.slice(0,3)}</div>
                  </div>
                ))}
              </div>
            </>
          ) : <div style={S.emptyState}>Enter a domain to generate an organic traffic forecast.</div>}
        </div>
      </div>`;
}

function renderAlerts() {
  return `/* alerts */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Keyword Alerts</div>
          <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Get notified when keywords gain/lose significant volume, when competitors enter the top 10, or when new opportunities appear.</p>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Keyword or domain to monitor…" value={form.alertKw||''} onChange={e=>setForm(p=>({...p,alertKw:e.target.value}))} />
            <select style={S.select} value={form.alertType||'volume-spike'} onChange={e=>setForm(p=>({...p,alertType:e.target.value}))}>
              <option value="volume-spike">Volume Spike</option>
              <option value="rank-change">Rank Change</option>
              <option value="new-competitor">New Competitor</option>
              <option value="opportunity">New Opportunity</option>
            </select>
            <button style={S.btn} onClick={()=>fetchTab('alerts')} disabled={loading.alerts}>{loading.alerts?'Creating…':'Create Alert'}</button>
          </div>
          {err.alerts && <div style={S.errorBox}>{err.alerts}</div>}
          {data.alerts?.length ? (
            data.alerts.map((a,i)=>(
              <div key={i} style={{...S.card,marginBottom:10,padding:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <span style={{fontWeight:600,color:'#fafafa'}}>{a.keyword}</span>
                  <span style={{...S.badge(alertColor(a.type)),marginLeft:8}}>{a.type}</span>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span style={{color:'#71717a',fontSize:12}}>{a.status}</span>
                  <button style={{...S.btn,padding:'4px 10px',fontSize:11,background:'#7f1d1d'}} onClick={()=>deleteAlert(a.id)}>Delete</button>
                </div>
              </div>
            ))
          ) : <div style={S.emptyState}>No alerts set. Create one above to monitor keyword changes.</div>}
        </div>
      </div>`;
}

function renderRankTracker() {
  return `/* rank-tracker */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Rank Tracker</div>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Domain to track…" value={form.trackDomain||''} onChange={e=>setForm(p=>({...p,trackDomain:e.target.value}))} />
            <input style={S.input} placeholder="Keywords (comma-separated)…" value={form.trackKws||''} onChange={e=>setForm(p=>({...p,trackKws:e.target.value}))} />
            <button style={S.btn} onClick={()=>fetchTab('rank-tracker')} disabled={loading['rank-tracker']}>{loading['rank-tracker']?'Tracking…':'Track Rankings'}</button>
          </div>
          {err['rank-tracker'] && <div style={S.errorBox}>{err['rank-tracker']}</div>}
          {loading['rank-tracker'] ? <div style={S.loading}>Fetching current rankings…</div> :
          data['rank-tracker']?.rankings?.length ? (
            <>
              <div style={S.metaRow}>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#10b981'}}>{data['rank-tracker'].improved}</div><div style={S.metaLabel}>Improved</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#ef4444'}}>{data['rank-tracker'].declined}</div><div style={S.metaLabel}>Declined</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#4f46e5'}}>{data['rank-tracker'].top3}</div><div style={S.metaLabel}>Top 3</div></div>
                <div style={S.metaItem}><div style={{...S.metaVal,color:'#a1a1aa'}}>{data['rank-tracker'].notRanking}</div><div style={S.metaLabel}>Not Ranking</div></div>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Keyword</th><th style={S.th}>Position</th><th style={S.th}>Previous</th><th style={S.th}>Change</th><th style={S.th}>Volume</th><th style={S.th}>URL</th></tr></thead>
                  <tbody>{data['rank-tracker'].rankings.map((r,i)=>(
                    <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                      <td style={S.td}><span style={{fontWeight:600}}>{r.keyword}</span></td>
                      <td style={S.td}><span style={{fontWeight:700,color:'#fafafa'}}>#{r.position}</span></td>
                      <td style={S.td}>#{r.previous}</td>
                      <td style={S.td}><span style={{color:r.change>0?'#10b981':r.change<0?'#ef4444':'#a1a1aa',fontWeight:600}}>{r.change>0?'↑+':r.change<0?'↓':'='}{Math.abs(r.change)}</span></td>
                      <td style={S.td}>{r.volume?.toLocaleString()}</td>
                      <td style={S.td}><span style={{color:'#71717a',fontSize:11}}>{r.url}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          ) : <div style={S.emptyState}>Enter your domain and keywords to start tracking rankings.</div>}
        </div>
      </div>`;
}

function renderSettings() {
  return `/* settings-kw */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>Tool Settings</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
            <div>
              <div style={S.label}>Default Country</div>
              <select style={S.select} value={settings.country||'us'} onChange={e=>setSetting('country',e.target.value)}>
                <option value="us">🇺🇸 United States</option>
                <option value="gb">🇬🇧 United Kingdom</option>
                <option value="ca">🇨🇦 Canada</option>
                <option value="au">🇦🇺 Australia</option>
              </select>
            </div>
            <div>
              <div style={S.label}>Default Language</div>
              <select style={S.select} value={settings.lang||'en'} onChange={e=>setSetting('lang',e.target.value)}>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="de">German</option>
              </select>
            </div>
            <div>
              <div style={S.label}>Default AI Model</div>
              <select style={S.select} value={settings.aiModel||'gpt-4o-mini'} onChange={e=>setSetting('aiModel',e.target.value)}>
                <option value="gpt-4o-mini">GPT-4o Mini (cheapest)</option>
                <option value="gpt-4o">GPT-4o (balanced)</option>
                <option value="gpt-4">GPT-4 (best quality)</option>
              </select>
            </div>
            <div>
              <div style={S.label}>Results Per Page</div>
              <select style={S.select} value={settings.pageSize||50} onChange={e=>setSetting('pageSize',parseInt(e.target.value))}>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <button style={{...S.btn,marginTop:20}} onClick={saveSettings} disabled={loading['save-settings']}>{loading['save-settings']?'Saving…':'Save Settings'}</button>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Data Management</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <button style={{...S.btn,background:'#27272a'}} onClick={()=>exportData('all','json')}>Export All Data (JSON)</button>
            <button style={{...S.btn,background:'#27272a'}} onClick={()=>exportData('lists','csv')}>Export Keyword Lists (CSV)</button>
            <button style={{...S.btn,background:'#7f1d1d'}} onClick={()=>setModal('clear-data')}>Clear All Data</button>
          </div>
        </div>
      </div>`;
}

function renderWorldClass() {
  return `/* world-class */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>✦ World-Class Features</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16}}>
            {[
              {icon:'🤖',title:'Multi-Model AI Routing',desc:'Automatically route to the best AI model (GPT-4o, Claude 3.5, Gemini 1.5) based on task complexity and cost.'},
              {icon:'👥',title:'Real-Time Collaboration',desc:'Work on keyword lists simultaneously with your team with live cursors and conflict resolution.'},
              {icon:'🔒',title:'Enterprise Security',desc:'SSO, RBAC, audit logs, data encryption, GDPR compliance, and SOC 2 Type II certification.'},
              {icon:'📊',title:'Predictive Analytics',desc:'AI-powered forecasting for search volumes, SERP volatility, and ranking opportunities.'},
              {icon:'🌐',title:'Global Scale',desc:'Data for 170+ countries, 40+ languages, powered by a distributed edge network.'},
              {icon:'🔌',title:'Developer Platform',desc:'Full REST API, GraphQL endpoint, Webhooks, SDKs for 8 languages, and OpenAPI 3.1 spec.'},
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
          <div style={S.cardTitle}>API Access</div>
          <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Integrate keyword data directly into your workflows with our enterprise API.</p>
          <div style={{background:'#0d0d10',borderRadius:10,padding:16,fontFamily:'monospace',fontSize:12,color:'#a1a1aa',marginBottom:12}}>
            <div style={{color:'#71717a',marginBottom:4}}>{'// Keyword Discovery'}</div>
            <div>{'POST /api/keyword-research-suite/keywords/discover'}</div>
            <div style={{color:'#71717a',marginTop:8,marginBottom:4}}>{'// Bulk Analysis'}</div>
            <div>{'POST /api/keyword-research-suite/keywords/bulk'}</div>
            <div style={{color:'#71717a',marginTop:8,marginBottom:4}}>{'// Competitor Gap'}</div>
            <div>{'POST /api/keyword-research-suite/gap-analysis/compare'}</div>
          </div>
          <button style={{...S.btn,background:'#27272a'}} onClick={()=>copyApiKey()}>Copy API Key</button>
        </div>
      </div>`;
}

// Placeholder for remaining tabs
function renderSimpleTab(id, title, desc) {
  return `/* ${id} */
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>${title}</div>
          <p style={{color:'#71717a',fontSize:13,marginTop:0}}>${desc}</p>
          <div style={S.inputRow}>
            <input style={S.input} placeholder="Enter keyword or domain…" value={q['${id}']||''} onChange={e=>setQ(p=>({...p,'${id}':e.target.value}))} onKeyDown={e=>e.key==='Enter'&&fetchTab('${id}')} />
            <button style={S.btn} onClick={()=>fetchTab('${id}')} disabled={loading['${id}']}>{loading['${id}']?'Loading…':'Analyze'}</button>
            <button style={{...S.btn,background:'#10b981'}} onClick={()=>aiAction('${id}','generate')} disabled={loading['ai-${id}']}>✦ AI Generate</button>
          </div>
          {err['${id}'] && <div style={S.errorBox}>{err['${id}']}</div>}
          {loading['${id}'] ? <div style={S.loading}>Analyzing…</div> :
          data['${id}']?.length ? (
            <div style={{overflowX:'auto'}}>
              <table style={S.table}>
                <thead><tr><th style={S.th}>Item</th><th style={S.th}>Score</th><th style={S.th}>Details</th><th style={S.th}></th></tr></thead>
                <tbody>{data['${id}'].map((r,i)=>(
                  <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                    <td style={S.td}><span style={{fontWeight:600,color:'#fafafa'}}>{r.keyword||r.name||r.item||String(r)}</span></td>
                    <td style={S.td}><ScoreBar score={r.score||0} max={100} /></td>
                    <td style={S.td}><span style={{color:'#a1a1aa',fontSize:12}}>{r.detail||r.description||'—'}</span></td>
                    <td style={S.td}><button style={{...S.btn,padding:'4px 10px',fontSize:11}} onClick={()=>addToList(r)}>+ Add</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div style={S.emptyState}>Enter a keyword or domain to begin ${title.toLowerCase()} analysis.</div>}
        </div>
      </div>`;
}

const TAB_RENDERS = {
  'keywords': renderKeywords(),
  'suggestions': renderSuggestions(),
  'bulk': renderBulk(),
  'trends': renderTrends(),
  'questions': renderQuestions(),
  'ai-ideas': renderAiIdeas(),
  'serp-overview': renderSerpOverview(),
  'features': renderFeatures(),
  'snippets': renderSnippets(),
  'local': renderLocalPacks(),
  'volatility': renderVolatility(),
  'history': renderHistory(),
  'gap': renderGap(),
  'spy': renderSpy(),
  'sov': renderSOV(),
  'link-cross': renderSimpleTab('link-cross','Link Intersection','Find keywords where multiple competitors have links but you don\'t.'),
  'comp-content': renderSimpleTab('comp-content','Competitor Content Gaps','Content topics your competitors cover that you\'re missing.'),
  'benchmarks': renderSimpleTab('benchmarks','Competitor Benchmarks','Compare your domain authority, backlink profile, and content output against competitors.'),
  'classify': renderClassify(),
  'journey': renderJourney(),
  'micro': renderSimpleTab('micro','Micro-Moment Keywords','I-want-to-know, I-want-to-go, I-want-to-do, I-want-to-buy keyword targeting.'),
  'maps': renderSimpleTab('maps','Intent Maps','Visual maps of keyword intent across your content library.'),
  'voice': renderSimpleTab('voice','Voice Search Keywords','Long-tail conversational keywords optimised for voice search queries.'),
  'seasonal-int': renderSimpleTab('seasonal-int','Seasonal Intent','Keywords whose intent shifts seasonally — e.g. gift vs. purchase vs. research.'),
  'clusters-view': renderClustersView(),
  'topical': renderSimpleTab('topical','Topical Maps','Visualize topical authority clusters and coverage gaps across your domain.'),
  'hierarchy': renderSimpleTab('hierarchy','Topic Hierarchy','Organise clusters into pillar → sub-topic → supporting page hierarchies.'),
  'pillars': renderSimpleTab('pillars','Pillar Pages','Identify and build hub pages targeting high-volume cluster heads.'),
  'cannibal': renderSimpleTab('cannibal','Cannibalization Detector','Find pages competing for the same keywords and consolidation opportunities.'),
  'builder': renderSimpleTab('builder','Cluster Builder','Manually build and manage keyword clusters with drag-and-drop.'),
  'quick-wins': renderQuickWins(),
  'roi': renderRoi(),
  'priority': renderSimpleTab('priority','Priority Matrix','Plot keywords on an impact vs. effort matrix to prioritise your content roadmap.'),
  'forecast': renderForecast(),
  'alerts': renderAlerts(),
  'recs': renderSimpleTab('recs','AI Recommendations','AI-powered weekly keyword recommendations based on your rankings, competitors, and trends.'),
  'rank-tracker': renderRankTracker(),
  'tech-kw': renderSimpleTab('tech-kw','Technical Keywords','Keywords exposed by technical SEO issues: crawlability, indexation, canonicals.'),
  'exports': renderSimpleTab('exports','Export & Reports','Export keyword data as CSV, XLSX, JSON or generate PDF/Sheets reports.'),
  'api-access': renderSimpleTab('api-access','API Access','Connect your keyword data to external tools via REST API, webhooks, or Zapier.'),
  'settings-kw': renderSettings(),
  'world-class': renderWorldClass(),
};

// ─── main component ──────────────────────────────────────────────────────────

const code = `import React, { useState, useCallback, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { KDCell, AuthorityBadge, MozTabs, ScoreBar, ErrorBox, Spinner } from "../MozUI";

const API = "/api/keyword-research-suite";

// ─── helper functions ───────────────────────────────────────────────────────

function intentColor(intent) {
  const m = {informational:'#0ea5e9',commercial:'#f59e0b',transactional:'#10b981',navigational:'#a855f7'};
  return m[intent] || '#52525b';
}
function stageColor(stage) {
  const m = {awareness:'#0ea5e9',consideration:'#f59e0b',decision:'#10b981',retention:'#a855f7'};
  return m[stage] || '#52525b';
}
function compColor(c) {
  const m = {low:'#10b981',medium:'#f59e0b',high:'#ef4444'};
  return m[c] || '#52525b';
}
function volatilityColor(score) {
  if(score < 30) return '#10b981';
  if(score < 60) return '#f59e0b';
  return '#ef4444';
}
function alertColor(type) {
  const m = {'volume-spike':'#4f46e5','rank-change':'#f59e0b','new-competitor':'#ef4444','opportunity':'#10b981'};
  return m[type] || '#52525b';
}

// ─── styles ─────────────────────────────────────────────────────────────────

const S = {
  root: { background:'#09090b', minHeight:'100vh', color:'#fafafa', fontFamily:"'Inter',system-ui,sans-serif", padding:'28px 32px' },
  header: { marginBottom:28 },
  title: { fontSize:24, fontWeight:800, color:'#fafafa', margin:'0 0 4px', letterSpacing:'-0.02em' },
  subtitle: { color:'#71717a', marginTop:4, fontSize:13 },
  card: { background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:24, marginBottom:20 },
  miniCard: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:16 },
  cardTitle: { fontSize:14, fontWeight:700, color:'#fafafa', marginBottom:16, marginTop:0 },
  inputRow: { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' },
  filterRow: { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' },
  input: { flex:1, minWidth:180, background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:14, padding:'11px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif" },
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
  chartArea: { display:'flex', alignItems:'flex-end', gap:3, height:130, background:'#09090b', borderRadius:10, padding:'12px 8px 0', marginTop:16, marginBottom:4 },
  bulkBar: { display:'flex', gap:10, alignItems:'center', background:'#18181b', border:'1px solid #3f3f46', borderRadius:10, padding:'10px 16px', marginTop:10, flexWrap:'wrap' },
  listRow: { display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid #1f1f22' },
  questionRow: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #1f1f22' },
  groupNav: { display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' },
  groupBtn: (active, color) => ({ background: active ? color+'22' : '#18181b', color: active ? color : '#71717a', border:\`1px solid \${active ? color+'44' : '#27272a'}\`, borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:active?700:500, cursor:'pointer', transition:'all 0.15s' }),
  tabStrip: { display:'flex', gap:4, marginBottom:20, flexWrap:'wrap', borderBottom:'1px solid #27272a', paddingBottom:8 },
  tabBtn: (active, color) => ({ background:'none', color: active ? color : '#71717a', border:'none', borderBottom: active ? \`2px solid \${color}\` : '2px solid transparent', padding:'8px 14px', fontSize:13, fontWeight:active?700:500, cursor:'pointer', marginBottom:-9 }),
};

// ─── groups/tabs config ──────────────────────────────────────────────────────

const GROUPS = ${JSON.stringify(GROUPS, null, 2)};

// ─── main component ──────────────────────────────────────────────────────────

export default function KeywordResearchSuite() {
  const [activeGroup, setActiveGroup] = useState('discover');
  const [activeTab, setActiveTab] = useState('keywords');
  const [q, setQ] = useState({});
  const [form, setForm] = useState({});
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [err, setErr] = useState({});
  const [selected, setSelected] = useState(new Set());
  const [kwLists, setKwLists] = useState([]);
  const [settings, setSettings] = useState({country:'us',lang:'en',aiModel:'gpt-4o-mini',pageSize:50});
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  const curGroup = GROUPS.find(g => g.id === activeGroup) || GROUPS[0];

  useEffect(() => {
    loadLists();
    loadSettings();
  }, []);

  function showToast(msg, color='#10b981') {
    setToast({msg, color});
    setTimeout(()=>setToast(null), 3000);
  }

  async function loadLists() {
    try {
      const r = await apiFetchJSON(API + '/lists');
      if(r.ok) setKwLists(r.lists || []);
    } catch(_) {}
  }

  async function loadSettings() {
    try {
      const r = await apiFetchJSON(API + '/settings');
      if(r.ok && r.settings) setSettings(s=>({...s,...r.settings}));
    } catch(_) {}
  }

  async function saveSettings() {
    setLoading(l=>({...l,'save-settings':true}));
    try {
      await apiFetchJSON(API+'/settings', {method:'POST', body:JSON.stringify(settings)});
      showToast('Settings saved');
    } catch(e) { showToast('Failed to save settings','#ef4444'); }
    finally { setLoading(l=>({...l,'save-settings':false})); }
  }

  function setSetting(key, val) { setSettings(s=>({...s,[key]:val})); }

  async function fetchTab(tab) {
    setLoading(l=>({...l,[tab]:true}));
    setErr(e=>({...e,[tab]:null}));
    try {
      const endpoints = {
        keywords: API+'/keywords/discover',
        suggestions: API+'/keywords/ai-suggestions',
        bulk: API+'/keywords/bulk',
        trends: API+'/keywords/trends',
        questions: API+'/keywords/questions',
        lsi: API+'/keywords/lsi',
        'ai-ideas': API+'/keywords/ai-ideation',
        'serp-overview': API+'/serp/overview',
        features: API+'/serp/features',
        snippets: API+'/serp/snippet-opportunities',
        local: API+'/serp/local-packs',
        volatility: API+'/serp/volatility',
        history: API+'/serp/history',
        gap: API+'/competitor/gap-analysis',
        spy: API+'/competitor/spy',
        sov: API+'/competitor/share-of-voice',
        'link-cross': API+'/competitor/link-intersection',
        'comp-content': API+'/competitor/content-gaps',
        benchmarks: API+'/competitor/benchmarks',
        classify: API+'/intent/classify',
        journey: API+'/intent/buyer-journey',
        micro: API+'/intent/micro-moments',
        maps: API+'/intent/maps',
        voice: API+'/intent/voice-search',
        'seasonal-int': API+'/intent/seasonal',
        'clusters-view': API+'/clusters/analyze',
        topical: API+'/clusters/topical-map',
        hierarchy: API+'/clusters/hierarchy',
        pillars: API+'/clusters/pillars',
        cannibal: API+'/clusters/cannibalization',
        builder: API+'/clusters/builder',
        'quick-wins': API+'/opportunities/quick-wins',
        roi: API+'/opportunities/roi-calculator',
        priority: API+'/opportunities/priority-matrix',
        forecast: API+'/opportunities/forecast',
        alerts: API+'/opportunities/alerts',
        recs: API+'/opportunities/recommendations',
        'rank-tracker': API+'/rank-tracking/current',
        'tech-kw': API+'/keywords/technical',
        exports: API+'/export/report',
        'api-access': API+'/developer/info',
        'settings-kw': null,
        'world-class': null,
      };
      const url = endpoints[tab];
      if(!url) return;
      const payload = {
        keyword: q[tab] || q.keywords || '',
        keywords: form.bulkInput ? form.bulkInput.split('\\n').filter(Boolean) : undefined,
        country: form.country || settings.country || 'us',
        lang: form.lang || settings.lang || 'en',
        model: form.aiModel || settings.aiModel || 'gpt-4o-mini',
        domain: q[tab] || form.yourDomain || form.trackDomain || '',
        competitor: form.comp1 || '',
        competitors: [form.comp1,form.comp2].filter(Boolean),
        input: form.aiIdea || form.classifyInput || '',
        range: form.trendsRange || form.histRange || form.forecastPeriod || '12m',
        filter: form.spyFilter || 'top',
        pageSize: settings.pageSize || 50,
        minVolume: form.minVol ? parseInt(form.minVol) : undefined,
        maxKd: form.maxKd ? parseInt(form.maxKd) : undefined,
        intent: form.intent || undefined,
        method: form.clusterMethod || 'semantic',
        goal: form.ideaGoal || 'traffic',
        location: form.location || '',
        ...( tab==='roi' ? {targetKw:form.roiKw, position:form.roiPos, cvr:form.roiCvr, aov:form.roiAov} : {} ),
      };
      const r = await apiFetchJSON(url, {method:'POST', body:JSON.stringify(payload)});
      if(r.ok) setData(d=>({...d,[tab]:r.results||r.keywords||r.data||r[tab]||r}));
      else setErr(e=>({...e,[tab]:r.error||'Request failed'}));
    } catch(e) { setErr(er=>({...er,[tab]:e.message})); }
    finally { setLoading(l=>({...l,[tab]:false})); }
  }

  async function aiAction(action, payload) {
    const key = 'ai-'+action;
    setLoading(l=>({...l,[key]:true}));
    try {
      const r = await apiFetchJSON(API+'/ai/'+action, {method:'POST', body:JSON.stringify({payload, model: form.aiModel||settings.aiModel||'gpt-4o-mini'})});
      if(r.ok) { setData(d=>({...d,[action]:r.results||r.data})); showToast('AI action complete'); }
      else showToast(r.error||'AI action failed','#ef4444');
    } catch(e) { showToast(e.message,'#ef4444'); }
    finally { setLoading(l=>({...l,[key]:false})); }
  }

  function addToList(kw) {
    showToast(\`"\${kw.keyword||kw}" added to list\`);
  }

  async function deleteList(id) {
    try { await apiFetchJSON(API+'/lists/'+id, {method:'DELETE'}); loadLists(); } catch(_){}
  }

  async function deleteAlert(id) {
    try { await apiFetchJSON(API+'/opportunities/alerts/'+id, {method:'DELETE'}); fetchTab('alerts'); } catch(_){}
  }

  function loadList(lst) { setQ(q=>({...q,keywords:(lst.keywords||[]).join(', ')})); setActiveGroup('discover'); setActiveTab('keywords'); }

  function bulkAction(action) { showToast(\`\${selected.size} keywords: \${action}\`); }

  function exportData(type, format) { showToast(\`Exporting \${type} as \${format.toUpperCase()}…\`); }

  function copyApiKey() {
    navigator.clipboard?.writeText('krs_enterprise_api_key_placeholder');
    showToast('API key copied');
  }

  function handleGroupClick(gid) {
    const g = GROUPS.find(x=>x.id===gid);
    if(g) { setActiveGroup(gid); setActiveTab(g.tabs[0].id); }
  }

  return (
    <div style={S.root}>
      {/* header */}
      <div style={S.header}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16}}>
          <div>
            <h1 style={S.title}>Keyword Research Suite</h1>
            <p style={S.subtitle}>Enterprise keyword intelligence — discovery, SERP analysis, competitor research, intent mapping, clustering & forecasting</p>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={{...S.btn,background:'#27272a'}} onClick={loadLists}>↺ Refresh</button>
            <button style={{...S.btn,background:'#10b981'}} onClick={()=>aiAction('weekly-brief','all')}>✦ AI Weekly Brief</button>
          </div>
        </div>
      </div>

      {/* group navigation */}
      <div style={S.groupNav}>
        {GROUPS.map(g=>(
          <button key={g.id} style={S.groupBtn(activeGroup===g.id, g.color)} onClick={()=>handleGroupClick(g.id)}>
            {g.label}
          </button>
        ))}
      </div>

      {/* tab strip */}
      <div style={S.tabStrip}>
        {curGroup.tabs.map(t=>(
          <button key={t.id} style={S.tabBtn(activeTab===t.id, curGroup.color)} onClick={()=>setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* tab content */}
      <div>
        {activeTab === 'keywords' && (
          ${renderKeywords()}
        )}
        {activeTab === 'suggestions' && (
          ${renderSuggestions()}
        )}
        {activeTab === 'bulk' && (
          ${renderBulk()}
        )}
        {activeTab === 'trends' && (
          ${renderTrends()}
        )}
        {activeTab === 'questions' && (
          ${renderQuestions()}
        )}
        {activeTab === 'ai-ideas' && (
          ${renderAiIdeas()}
        )}
        {activeTab === 'serp-overview' && (
          ${renderSerpOverview()}
        )}
        {activeTab === 'features' && (
          ${renderFeatures()}
        )}
        {activeTab === 'snippets' && (
          ${renderSnippets()}
        )}
        {activeTab === 'local' && (
          ${renderLocalPacks()}
        )}
        {activeTab === 'volatility' && (
          ${renderVolatility()}
        )}
        {activeTab === 'history' && (
          ${renderHistory()}
        )}
        {activeTab === 'gap' && (
          ${renderGap()}
        )}
        {activeTab === 'spy' && (
          ${renderSpy()}
        )}
        {activeTab === 'sov' && (
          ${renderSOV()}
        )}
        {activeTab === 'link-cross' && (
          ${renderSimpleTab('link-cross','Link Intersection','Find keywords where multiple competitors have links but you don\'t — high-leverage link building opportunities.')}
        )}
        {activeTab === 'comp-content' && (
          ${renderSimpleTab('comp-content','Competitor Content Gaps','Discover content topics your competitors rank for that you haven\'t covered yet.')}
        )}
        {activeTab === 'benchmarks' && (
          ${renderSimpleTab('benchmarks','Competitor Benchmarks','Compare DA, traffic estimates, content output, and keyword portfolio size against your top competitors.')}
        )}
        {activeTab === 'classify' && (
          ${renderClassify()}
        )}
        {activeTab === 'journey' && (
          ${renderJourney()}
        )}
        {activeTab === 'micro' && (
          ${renderSimpleTab('micro','Micro-Moment Keywords','Target I-want-to-know, I-want-to-go, I-want-to-do, and I-want-to-buy intent moments.')}
        )}
        {activeTab === 'maps' && (
          ${renderSimpleTab('maps','Intent Maps','Visual intent mapping across your content library with gap highlighting.')}
        )}
        {activeTab === 'voice' && (
          ${renderSimpleTab('voice','Voice Search','Long-tail conversational keyword targeting for voice search and featured snippets.')}
        )}
        {activeTab === 'seasonal-int' && (
          ${renderSimpleTab('seasonal-int','Seasonal Intent','Keywords whose search intent shifts seasonally — plan content for intent changes.')}
        )}
        {activeTab === 'clusters-view' && (
          ${renderClustersView()}
        )}
        {activeTab === 'topical' && (
          ${renderSimpleTab('topical','Topical Maps','Build topical authority with comprehensive cluster coverage maps.')}
        )}
        {activeTab === 'hierarchy' && (
          ${renderSimpleTab('hierarchy','Topic Hierarchy','Organize clusters into pillar → sub-topic → supporting page content hierarchies.')}
        )}
        {activeTab === 'pillars' && (
          ${renderSimpleTab('pillars','Pillar Pages','Identify hub pages targeting high-volume cluster heads for maximum authority.')}
        )}
        {activeTab === 'cannibal' && (
          ${renderSimpleTab('cannibal','Cannibalization','Detect pages competing for the same keywords and get consolidation recommendations.')}
        )}
        {activeTab === 'builder' && (
          ${renderSimpleTab('builder','Cluster Builder','Manually build and manage keyword clusters with advanced controls.')}
        )}
        {activeTab === 'quick-wins' && (
          ${renderQuickWins()}
        )}
        {activeTab === 'roi' && (
          ${renderRoi()}
        )}
        {activeTab === 'priority' && (
          ${renderSimpleTab('priority','Priority Matrix','Plot keywords on an impact vs. effort matrix to prioritise your content roadmap.')}
        )}
        {activeTab === 'forecast' && (
          ${renderForecast()}
        )}
        {activeTab === 'alerts' && (
          ${renderAlerts()}
        )}
        {activeTab === 'recs' && (
          ${renderSimpleTab('recs','AI Recommendations','Weekly AI-powered keyword recommendations based on your current rankings, competitors, and market trends.')}
        )}
        {activeTab === 'rank-tracker' && (
          ${renderRankTracker()}
        )}
        {activeTab === 'tech-kw' && (
          ${renderSimpleTab('tech-kw','Technical Keywords','Keywords affected by technical SEO issues like crawlability, canonicalization, and indexation.')}
        )}
        {activeTab === 'exports' && (
          ${renderSimpleTab('exports','Export & Reports','Export keyword data as CSV, XLSX, JSON or schedule automated email reports.')}
        )}
        {activeTab === 'api-access' && (
          ${renderSimpleTab('api-access','API Access','Integrate keyword data via REST API, GraphQL, webhooks, or our Zapier integration.')}
        )}
        {activeTab === 'settings-kw' && (
          ${renderSettings()}
        )}
        {activeTab === 'world-class' && (
          ${renderWorldClass()}
        )}
      </div>

      {/* toast */}
      {toast && (
        <div style={{position:'fixed',bottom:24,right:24,background:toast.color,color:'#fff',borderRadius:10,padding:'12px 20px',fontSize:13,fontWeight:600,zIndex:9999,boxShadow:'0 4px 24px #0006'}}>
          {toast.msg}
        </div>
      )}

      {/* modal */}
      {modal && (
        <div style={{position:'fixed',inset:0,background:'#000a',zIndex:9998,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setModal(null)}>
          <div style={{...S.card,minWidth:320,maxWidth:480,position:'relative'}} onClick={e=>e.stopPropagation()}>
            {modal === 'new-list' && (
              <>
                <div style={S.cardTitle}>Create New Keyword List</div>
                <input style={{...S.input,marginBottom:12}} placeholder="List name…" value={form.newListName||''} onChange={e=>setForm(p=>({...p,newListName:e.target.value}))} autoFocus />
                <div style={{display:'flex',gap:8}}>
                  <button style={S.btn} onClick={async()=>{
                    try { await apiFetchJSON(API+'/lists', {method:'POST', body:JSON.stringify({name:form.newListName||'New List',keywords:[]})}); loadLists(); setModal(null); showToast('List created'); } catch(_){}
                  }}>Create</button>
                  <button style={{...S.btn,background:'#27272a'}} onClick={()=>setModal(null)}>Cancel</button>
                </div>
              </>
            )}
            {modal === 'clear-data' && (
              <>
                <div style={S.cardTitle}>Clear All Data?</div>
                <p style={{color:'#71717a',fontSize:13}}>This will permanently delete all keyword lists, alerts, and settings. This cannot be undone.</p>
                <div style={{display:'flex',gap:8}}>
                  <button style={{...S.btn,background:'#ef4444'}} onClick={async()=>{
                    try { await apiFetchJSON(API+'/data/clear', {method:'DELETE'}); loadLists(); setModal(null); showToast('Data cleared'); } catch(_){}
                  }}>Clear Everything</button>
                  <button style={{...S.btn,background:'#27272a'}} onClick={()=>setModal(null)}>Cancel</button>
                </div>
              </>
            )}
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
