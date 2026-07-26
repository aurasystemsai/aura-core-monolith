import React, { useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/ads-anomaly-guard";

const S = {
  root: { background:'#09090b', minHeight:'100vh', color:'#fafafa', fontFamily:"'Inter',system-ui,sans-serif", padding:'28px 32px' },
  card: { background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:24, marginBottom:20 },
  mini: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:16 },
  cardTitle: { fontSize:14, fontWeight:700, color:'#fafafa', marginBottom:16, marginTop:0 },
  row: { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' },
  input: { flex:1, minWidth:180, background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:14, padding:'11px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif" },
  select: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'11px 14px', outline:'none', cursor:'pointer' },
  textarea: { width:'100%', background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'12px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif", resize:'vertical', boxSizing:'border-box' },
  btn: (bg) => ({ background:bg||'#ef4444', color:'#fff', border:'none', borderRadius:10, padding:'11px 22px', fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }),
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
  metaVal: (c) => ({ fontSize:22, fontWeight:700, color:c||'#ef4444' }),
  metaLbl: { fontSize:11, color:'#71717a', marginTop:2 },
  sT: { fontSize:12, fontWeight:700, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, marginTop:16 },
  groupNav: { display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' },
  gBtn: (a, c) => ({ background:a?c+'22':'#18181b', color:a?c:'#71717a', border:`1px solid ${a?c+'44':'#27272a'}`, borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:a?700:500, cursor:'pointer' }),
  tabStrip: { display:'flex', gap:4, marginBottom:20, flexWrap:'wrap', borderBottom:'1px solid #27272a', paddingBottom:8 },
  tBtn: (a, c) => ({ background:'none', color:a?c:'#71717a', border:'none', borderBottom:a?`2px solid ${c}`:'2px solid transparent', padding:'8px 14px', fontSize:13, fontWeight:a?700:500, cursor:'pointer', marginBottom:-9 }),
  bar: { height:6, background:'#27272a', borderRadius:3, overflow:'hidden', marginTop:4 },
  fill: (pct, c) => ({ height:'100%', width:Math.min(pct||0,100)+'%', background:c||'#ef4444', borderRadius:3 }),
  pre: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, padding:16, fontSize:12, color:'#a1a1aa', fontFamily:'monospace', whiteSpace:'pre-wrap', maxHeight:280, overflow:'auto', marginBottom:12 },
};

const GROUPS = [
  {
    "id": "live",
    "label": "Live Monitor",
    "color": "#ef4444",
    "tabs": [
      {
        "id": "live-dash",
        "label": "Live Dashboard"
      },
      {
        "id": "spend-vel",
        "label": "Spend Velocity"
      },
      {
        "id": "roas-watch",
        "label": "ROAS Watch"
      },
      {
        "id": "conv-watch",
        "label": "Conv. Watch"
      },
      {
        "id": "cpc-watch",
        "label": "CPC Watch"
      },
      {
        "id": "live-alerts",
        "label": "Live Alerts"
      }
    ]
  },
  {
    "id": "anomalies",
    "label": "Anomalies",
    "color": "#f97316",
    "tabs": [
      {
        "id": "anom-all",
        "label": "All Anomalies"
      },
      {
        "id": "budget-anom",
        "label": "Budget"
      },
      {
        "id": "perf-anom",
        "label": "Performance"
      },
      {
        "id": "conv-anom",
        "label": "Conversions"
      },
      {
        "id": "click-fraud",
        "label": "Click Fraud"
      },
      {
        "id": "anom-hist",
        "label": "History"
      }
    ]
  },
  {
    "id": "rules",
    "label": "Rules",
    "color": "#ef4444",
    "tabs": [
      {
        "id": "rule-list",
        "label": "Rules"
      },
      {
        "id": "create-rule",
        "label": "Create Rule"
      },
      {
        "id": "auto-pause",
        "label": "Auto-Pause"
      },
      {
        "id": "auto-scale",
        "label": "Auto-Scale"
      },
      {
        "id": "rule-log",
        "label": "Rule Log"
      },
      {
        "id": "rule-ai",
        "label": "AI Rules"
      }
    ]
  },
  {
    "id": "protection",
    "label": "Protection",
    "color": "#f97316",
    "tabs": [
      {
        "id": "fraud-detect",
        "label": "Fraud Detection"
      },
      {
        "id": "ip-block",
        "label": "IP Blocking"
      },
      {
        "id": "placement-excl",
        "label": "Excl. Placements"
      },
      {
        "id": "quality-shield",
        "label": "Quality Shield"
      },
      {
        "id": "budget-lock",
        "label": "Budget Locks"
      },
      {
        "id": "protect-audit",
        "label": "Audit Trail"
      }
    ]
  },
  {
    "id": "cannibalize",
    "label": "Cannibalization",
    "color": "#ef4444",
    "tabs": [
      {
        "id": "paid-organic",
        "label": "Paid vs Organic"
      },
      {
        "id": "brand-cannibal",
        "label": "Brand Cannibal."
      },
      {
        "id": "channel-overlap-a",
        "label": "Channel Overlap"
      },
      {
        "id": "incrementality-a",
        "label": "Incrementality"
      },
      {
        "id": "cannibal-ai",
        "label": "AI Analysis"
      },
      {
        "id": "cannibal-fix",
        "label": "Fixes"
      }
    ]
  },
  {
    "id": "alerts",
    "label": "Alerts",
    "color": "#f97316",
    "tabs": [
      {
        "id": "alert-config",
        "label": "Config"
      },
      {
        "id": "alert-history",
        "label": "History"
      },
      {
        "id": "slack-int",
        "label": "Slack"
      },
      {
        "id": "email-int",
        "label": "Email"
      },
      {
        "id": "webhook-int",
        "label": "Webhook"
      },
      {
        "id": "escalation",
        "label": "Escalation"
      }
    ]
  },
  {
    "id": "aag-adv",
    "label": "Advanced",
    "color": "#ef4444",
    "tabs": [
      {
        "id": "burn-rate",
        "label": "Burn Rate"
      },
      {
        "id": "pacing",
        "label": "Pacing"
      },
      {
        "id": "aag-int",
        "label": "Integrations"
      },
      {
        "id": "aag-api",
        "label": "API"
      },
      {
        "id": "aag-settings",
        "label": "Settings"
      },
      {
        "id": "aag-world",
        "label": "World-Class"
      }
    ]
  }
];

export default function AdsAnomalyGuard() {
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
      case 'live-dash': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Live Ads Monitoring Dashboard</div>
            <div style={S.row}>
              <button style={S.btn('#ef4444')} onClick={()=>fetch_('live-dash',API+'/live/dashboard')} disabled={loading['live-dash']}>{loading['live-dash']?'Loading...':'Load Live Status'}</button>
              <button style={S.btn('#f97316')} onClick={()=>fetch_('anom-all',API+'/anomalies/all')}>Check Anomalies</button>
              <button style={S.btn('#10b981')} onClick={()=>toast_('All systems monitoring...')}>Status OK</button>
            </div>
            {err['live-dash'] && <div style={S.err}>{err['live-dash']}</div>}
            {loading['live-dash'] ? <div style={S.loading}>Connecting to live data feed...</div> : d ? (
              <>
                <div style={S.metaRow}>
                  {[['Today Spend','\$'+d.spend?.today?.toLocaleString(),'#fafafa'],['Budget','\$'+d.spend?.budget?.toLocaleString(),'#71717a'],['Pacing',d.spend?.pacing+'%',d.spend?.onTrack?'#10b981':'#ef4444'],['ROAS',d.roas?.current+'x',d.roas?.current>=d.roas?.target?'#10b981':'#ef4444'],['Anomalies',d.anomalies?.active,'#f97316'],['Conversions',d.conversions?.today,'#4285f4']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
                <div style={S.sT}>Recent Events</div>
                {d.recentEvents?.map((e,i)=>(
                  <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid #1f1f22',alignItems:'flex-start'}}>
                    <span style={{color:'#71717a',fontSize:11,minWidth:40}}>{e.time}</span>
                    <span style={S.badge(e.type==='alert'?'#ef4444':e.type==='warning'?'#f59e0b':'#71717a')}>{e.type}</span>
                    <span style={{fontSize:13,color:'#e4e4e7',lineHeight:1.4}}>{e.message}</span>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Load live monitoring to see real-time ads status.</div>}
          </div>
        </div>
      );
      case 'anom-all': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Anomaly Detection Center</div>
            <button style={S.btn('#f97316')} onClick={()=>fetch_('anom-all',API+'/anomalies/all')} disabled={loading['anom-all']}>{loading['anom-all']?'Scanning...':'Scan for Anomalies'}</button>
            {err['anom-all'] && <div style={S.err}>{err['anom-all']}</div>}
            {loading['anom-all'] ? <div style={S.loading}>Scanning all campaigns...</div> : d?.anomalies?.length ? (
              <div style={{marginTop:16}}>
                {d.anomalies.map((a,i)=>(
                  <div key={i} style={{...S.mini,marginBottom:10,borderColor:a.severity==='critical'?'#ef444444':a.severity==='warning'?'#f59e0b44':'#27272a'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                      <div style={{display:'flex',gap:6,alignItems:'center'}}>
                        <span style={S.badge(a.severity==='critical'?'#ef4444':a.severity==='warning'?'#f59e0b':'#71717a')}>{a.severity}</span>
                        <span style={{fontWeight:700,color:'#fafafa'}}>{a.type}</span>
                      </div>
                      <span style={S.badge(a.status==='active'?'#ef4444':a.status==='monitoring'?'#f59e0b':'#10b981')}>{a.status}</span>
                    </div>
                    <div style={{fontSize:13,color:'#a1a1aa',marginBottom:4}}>{a.campaign} -- {a.metric}: <span style={{color:'#ef4444',fontWeight:700}}>{a.value}</span> (threshold: {a.threshold})</div>
                    <div style={{fontSize:12,color:'#71717a'}}>{a.action}</div>
                  </div>
                ))}
              </div>
            ) : <div style={S.empty}>Scan campaigns to detect performance anomalies.</div>}
          </div>
        </div>
      );
      case 'click-fraud': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Click Fraud Detection</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Abnormal click patterns, IP clustering, and bounce rate correlation to detect invalid traffic before it wastes budget.</p>
            <button style={S.btn('#ef4444')} onClick={()=>fetch_('click-fraud',API+'/anomalies/click-fraud')} disabled={loading['click-fraud']}>{loading['click-fraud']?'Analyzing...':'Analyze Click Quality'}</button>
            {err['click-fraud'] && <div style={S.err}>{err['click-fraud']}</div>}
            {loading['click-fraud'] ? <div style={S.loading}>Analyzing click patterns...</div> : d?.analysis ? (
              <>
                <div style={S.metaRow}>
                  {[['Invalid Click Rate',d.analysis.invalidClickRate+'%',d.analysis.invalidClickRate>3?'#ef4444':'#10b981'],['Est. Wasted','\$'+d.analysis.estimatedWaste,'#f97316'],['IPs Clustered',d.analysis.ipsClustered,'#f59e0b']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
                <div style={S.sT}>Suspicious IP Clusters</div>
                {d.analysis.suspiciousClusters?.map((c,i)=>(
                  <div key={i} style={{...S.mini,marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontFamily:'monospace',fontSize:12,color:'#ef4444'}}>{c.ip}</span>
                      <span style={S.badge('#ef4444')}>{c.clicks} clicks</span>
                    </div>
                    <div style={{fontSize:12,color:'#71717a'}}>{c.pattern} -- Bounce: {(c.bounce*100).toFixed(0)}% -- Avg time: {c.timeOnSite}</div>
                    <button style={{...S.btn('#ef4444'),padding:'4px 10px',fontSize:11,marginTop:6}} onClick={()=>toast_('IP blocked!')}>Block IP</button>
                  </div>
                ))}
                <div style={S.sT}>Recommendations</div>
                {d.analysis.recommendations?.map((r,i)=>(
                  <div key={i} style={{display:'flex',gap:8,padding:'8px 0',borderBottom:'1px solid #1f1f22'}}>
                    <span style={{...S.badge('#f97316'),flexShrink:0}}>{i+1}</span>
                    <span style={{fontSize:13,color:'#e4e4e7'}}>{r}</span>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Analyze click quality to detect and block invalid traffic.</div>}
          </div>
        </div>
      );
      case 'aag-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'🚨',t:'ROAS Cliff Detection',d:'Detect when ROAS crosses below break-even automatically -- auto-pause campaigns before you lose more money than the campaign is worth.'},
                {icon:'🤖',t:'Click Fraud Detection',d:'IP clustering, bounce rate correlation, and click pattern analysis to detect invalid traffic before it wastes significant budget.'},
                {icon:'💸',t:'Budget Burn Rate Forecasting',d:'Predict end-of-month spend at current pace with bull/base/bear scenarios -- never accidentally overspend your media budget.'},
                {icon:'📡',t:'Real-Time Spend Velocity',d:'Alert when spend rate deviates from hourly/daily budget pace -- catch runaway spend within minutes, not hours.'},
                {icon:'⚡',t:'Automated Guard Rules',d:'Define conditions that auto-pause campaigns (e.g. ROAS < 1.5 for 2 hours). Rules execute 24/7 without manual monitoring.'},
                {icon:'🔀',t:'Cross-Channel Cannibalization',d:'Detect when paid search cannibalizes organic, or when paid social cannibalizes paid search -- optimize total portfolio ROAS.'},
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
            <h1 style={{fontSize:24,fontWeight:800,color:'#fafafa',margin:'0 0 4px',letterSpacing:'-0.02em'}}>Ads Anomaly Guard</h1>
            <p style={{color:'#71717a',fontSize:13,margin:'4px 0 0'}}>Budget protection -- ROAS cliff detection, click fraud analysis, real-time spend velocity, auto-pause rules & cannibalization detection</p>
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
