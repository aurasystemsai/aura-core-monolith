import { useState } from 'react';
import { apiFetchJSON } from '../../api';

const API = '/api/daily-cfo-pack';
const ACC = '#f59e0b';

const S = {
  page: { background: '#09090b', minHeight: '100vh', color: '#fafafa', fontFamily: 'Inter,sans-serif', padding: '32px' },
  title: { fontSize: 26, fontWeight: 700, margin: 0 },
  subtitle: { color: '#a1a1aa', fontSize: 14, marginTop: 6, marginBottom: 24 },
  card: { background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 24, marginBottom: 20 },
  cardSm: { background: '#09090b', border: '1px solid #27272a', borderRadius: 10, padding: 14, marginBottom: 10 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },
  grid4: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 },
  label: { display: 'block', color: '#a1a1aa', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 },
  input: { width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 8, padding: '10px 12px', color: '#fafafa', fontSize: 14, boxSizing: 'border-box' },
  select: { width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 8, padding: '10px 12px', color: '#fafafa', fontSize: 14, boxSizing: 'border-box' },
  btn: (c) => ({ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, background: c || ACC, color: '#fff' }),
  btnSm: (c) => ({ padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12, background: c || ACC, color: '#fff' }),
  badge: (c) => ({ display: 'inline-block', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: (c||ACC)+'22', color: c||ACC }),
  row: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  metric: { background: '#09090b', border: '1px solid #27272a', borderRadius: 10, padding: 16, textAlign: 'center' },
  metricNum: (c) => ({ fontSize: 26, fontWeight: 800, color: c || ACC }),
  metricLabel: { fontSize: 12, color: '#71717a', marginTop: 4 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', color: '#71717a', fontSize: 12, fontWeight: 600, padding: '8px 10px', borderBottom: '1px solid #27272a' },
  td: { padding: '9px 10px', borderBottom: '1px solid #18181b', fontSize: 13, color: '#e4e4e7' },
  divider: { borderTop: '1px solid #27272a', margin: '20px 0' },
  tab: (a, c) => ({ padding: '9px 14px', cursor: 'pointer', border: 'none', background: a ? (c||ACC)+'22' : 'transparent', color: a ? (c||ACC) : '#71717a', fontWeight: a ? 700 : 400, fontSize: 12, borderRadius: 6, whiteSpace: 'nowrap' }),
  tabBar: { display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' },
};


const TABS = ['AI Briefing','Live KPI Dashboard','Revenue Ticker','NLP Query','Board Pack','Benchmarks'];
const KPIS = [
  { metric: 'Revenue', value: '£18,420', target: '£17,000', status: 'above', trend: '+8.4%', color: '#22c55e' },
  { metric: 'Orders', value: '41', target: '38', status: 'above', trend: '+7.9%', color: '#22c55e' },
  { metric: 'AOV', value: '£449', target: '£440', status: 'above', trend: '+2.0%', color: '#22c55e' },
  { metric: 'Gross Margin', value: '62.1%', target: '60.0%', status: 'above', trend: '+2.1pp', color: '#22c55e' },
  { metric: 'Return Rate', value: '11.4%', target: '12.0%', status: 'above', trend: '-0.6pp', color: '#22c55e' },
  { metric: 'CAC', value: '£41.20', target: '£38.00', status: 'below', trend: '+8.4%', color: '#ef4444' },
  { metric: 'Conversion Rate', value: '3.8%', target: '4.0%', status: 'below', trend: '-0.2pp', color: '#ef4444' },
];

export default function DailyCfoPack() {
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const [boardPack, setBoardPack] = useState(null);
  const [boardLoading, setBoardLoading] = useState(false);

  const askQuery = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const data = await apiFetchJSON(`${API}/query`, { method: 'POST', body: JSON.stringify({ question: query }) });
      setAnswer(data.answer || data.result || JSON.stringify(data));
    } catch (e) {
      setAnswer('Error: ' + e.message);
    }
    setLoading(false);
  };

  const generateBoardPack = async () => {
    setBoardLoading(true);
    try {
      const data = await apiFetchJSON(`${API}/board-pack`, { method: 'POST', body: JSON.stringify({ period: 'monthly' }) });
      setBoardPack(data.pack || data);
    } catch (e) {
      setBoardPack({ error: e.message });
    }
    setBoardLoading(false);
  };

  return (
    <div style={S.page}>
      <h1 style={S.title}>Daily CFO Pack</h1>
      <p style={S.subtitle}>AI morning briefing, live KPI dashboard, NLP query interface, board pack generator, and competitive benchmarks</p>
      <div style={S.grid4}>
        {[['Today Revenue','£18,420'],['vs Target','+8.4%'],['KPIs On Target','5/7'],['Active Alerts','2']].map(([l,v])=>(
          <div key={l} style={S.metric}><div style={S.metricNum(ACC)}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>
      <div style={{...S.tabBar,marginTop:20}}>{TABS.map((t,i)=><button key={t} style={S.tab(tab===i,ACC)} onClick={()=>setTab(i)}>{t}</button>)}</div>

      {tab === 0 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>AI Morning Briefing — {new Date().toLocaleDateString('en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
          <div style={{color:'#a1a1aa',fontSize:13,marginBottom:16}}>Generated by GPT-4o · Updated 07:00</div>
          <div style={{...S.cardSm,borderColor:'#22c55e',marginBottom:12}}><div style={{fontWeight:700,color:'#22c55e',marginBottom:6}}>Headline</div><div>Strong revenue day (+8.4% vs target), driven by Email campaign "Eco Essentials". CAC pressure warrants attention — Google CPC up 14% week-over-week.</div></div>
          <div style={S.grid2}>
            <div>
              <div style={{fontWeight:700,color:'#22c55e',marginBottom:8}}>Top Performers</div>
              {['Organic Cotton Hoodie (+34% DoD)','Sustainable Summer Collection','Email "Eco Essentials" (12.4% CTR)'].map((item,i)=><div key={i} style={{padding:'6px 0',borderBottom:'1px solid #27272a',fontSize:13}}>✓ {item}</div>)}
            </div>
            <div>
              <div style={{fontWeight:700,color:'#ef4444',marginBottom:8}}>Risks to Monitor</div>
              {['CAC £41.20 vs £38 target (Google CPC +14%)','Linen Summer Dress — 89% stockout risk in 30d','FastMake supplier credit downgrade'].map((item,i)=><div key={i} style={{padding:'6px 0',borderBottom:'1px solid #27272a',fontSize:13,color:'#a1a1aa'}}>⚠ {item}</div>)}
            </div>
          </div>
          <div style={{...S.cardSm,marginTop:16,borderColor:'#8b5cf6'}}>
            <div style={{fontWeight:700,color:'#8b5cf6',marginBottom:6}}>Key Decision Required Today</div>
            <div style={{fontSize:13}}>Do we deploy £18,000 OTB toward Linen Dresses ahead of summer peak, or hold cash given CAC pressure?</div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Live KPI Dashboard</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Metric</th><th style={S.th}>Today</th><th style={S.th}>Target</th><th style={S.th}>Status</th><th style={S.th}>Trend</th></tr></thead>
            <tbody>{KPIS.map(k=>(
              <tr key={k.metric}><td style={{...S.td,fontWeight:600}}>{k.metric}</td><td style={{...S.td,fontWeight:700,color:k.color}}>{k.value}</td><td style={S.td}>{k.target}</td><td style={S.td}><span style={S.badge(k.color)}>{k.status}</span></td><td style={{...S.td,color:k.color,fontWeight:700}}>{k.trend}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 2 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:20}}>Live Revenue Ticker</div>
          <div style={{textAlign:'center',marginBottom:24}}>
            <div style={{fontSize:52,fontWeight:800,color:ACC}}>£{(18420+Math.floor(Math.random()*800)).toLocaleString()}</div>
            <div style={{color:'#71717a',fontSize:14,marginTop:4}}>Today's revenue · updates live</div>
          </div>
          <div style={S.grid3}>
            {[['Today Orders','41'],['Current Hour','£'+Math.floor(Math.random()*1200+400)],['Last Order','3 min ago']].map(([l,v])=>(
              <div key={l} style={S.metric}><div style={S.metricNum(ACC)}>{v}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:8}}>NLP Query Interface</div>
          <p style={{color:'#a1a1aa',fontSize:13,marginBottom:16}}>Ask any question about your business in plain English.</p>
          <div style={S.row}>
            <input style={{...S.input,flex:1}} placeholder={'"What drove the CAC increase this week?"'} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&askQuery()} />
            <button style={S.btn(ACC)} onClick={askQuery} disabled={loading}>{loading?'Thinking...':'Ask AI (1 credit)'}</button>
          </div>
          {answer&&<div style={{background:'#0d0d10',border:'1px solid #27272a',borderRadius:8,padding:16,marginTop:16,fontSize:14,lineHeight:1.6}}>{answer}</div>}
          <div style={{marginTop:16}}>
            <div style={S.label}>Try asking:</div>
            {['"What drove the 15% revenue decline last Tuesday?"','"Which products have the highest return rate?"','"How does our CAC compare to last quarter?"'].map((ex,i)=>(
              <div key={i} style={{fontSize:13,color:ACC,cursor:'pointer',padding:'4px 0'}} onClick={()=>setQuery(ex.replace(/"/g,''))}>{ex}</div>
            ))}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:8}}>Board Pack Generator</div>
          <p style={{color:'#a1a1aa',fontSize:13,marginBottom:20}}>One-click AI-generated board presentation with charts, narrative, and YTD vs prior year analysis.</p>
          <button style={S.btn(ACC)} onClick={generateBoardPack} disabled={boardLoading}>{boardLoading ? 'Generating…' : 'AI Generate Board Pack (5 credits)'}</button>
          {boardPack && !boardPack.error && <div style={{...S.cardSm,marginTop:16,borderColor:ACC}}><div style={{fontWeight:700,color:ACC,marginBottom:8}}>Board Pack Ready</div><div style={{fontSize:13,color:'#a1a1aa'}}>{boardPack.summary || boardPack.sections?.join(' · ') || 'Pack generated successfully.'}</div></div>}
          {boardPack?.error && <div style={{color:'#ef4444',fontSize:13,marginTop:12}}>{boardPack.error}</div>}
          <div style={{...S.cardSm,marginTop:20}}>
            <div style={S.label}>Last Generated Pack</div>
            <div style={{fontWeight:700,marginBottom:8}}>Board Pack — {new Date().toLocaleDateString()}</div>
            <div style={{color:'#a1a1aa',fontSize:13,marginBottom:12}}>Sections: Executive Summary · Financial Performance · Key Risks · Opportunities · Decision Required</div>
            <div style={S.row}><button style={S.btnSm(ACC)}>Download PDF</button><button style={S.btnSm()}>Copy Link</button></div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Competitive Financial Benchmarks</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Metric</th><th style={S.th}>You</th><th style={S.th}>Industry Median</th><th style={S.th}>Percentile</th></tr></thead>
            <tbody>{[['Gross Margin','62.1%','52%',78],['Return Rate','11.4%','18%',82],['AOV','£449','£280',91],['CAC','£41','£38',44],['LTV:CAC','3.8x','3.0x',68]].map(([m,y,ind,pct])=>(
              <tr key={m}><td style={{...S.td,fontWeight:600}}>{m}</td><td style={{...S.td,fontWeight:700,color:pct>=70?'#22c55e':pct>=50?ACC:'#ef4444'}}>{y}</td><td style={S.td}>{ind}</td><td style={S.td}><span style={S.badge(pct>=70?'#22c55e':pct>=50?ACC:'#ef4444')}>{pct}th percentile</span></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
