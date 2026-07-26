import { useState } from 'react';

const ACC = '#ef4444';

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


const TABS = ['Returns Overview','Reason Analysis','Fraud Detection','Propensity Score','Disposition Engine','Exchange-First'];
const REASONS = [
  { category: 'size', label: 'Wrong size / fit', count: 284, pct: 0.34, fraudRisk: 0.04 },
  { category: 'quality', label: 'Quality not as expected', count: 142, pct: 0.17, fraudRisk: 0.08 },
  { category: 'expectation', label: 'Not as described', count: 117, pct: 0.14, fraudRisk: 0.06 },
  { category: 'changed-mind', label: 'Changed my mind', count: 98, pct: 0.12, fraudRisk: 0.18 },
  { category: 'damage', label: 'Damaged / defective', count: 76, pct: 0.09, fraudRisk: 0.02 },
  { category: 'fraud', label: 'Suspected fraud', count: 41, pct: 0.05, fraudRisk: 0.94 },
];

export default function ReturnsRmaAutomation() {
  const [tab, setTab] = useState(0);
  const [custId, setCustId] = useState('');
  const [propResult, setPropResult] = useState(null);

  const scoreCustomer = () => {
    if (!custId) return;
    const score = Math.min(0.95, 0.128 + (custId.length % 5) * 0.08);
    setPropResult({ score, risk: score > 0.4 ? 'high' : score > 0.25 ? 'medium' : 'low' });
  };

  return (
    <div style={S.page}>
      <h1 style={S.title}>Returns & RMA Automation</h1>
      <p style={S.subtitle}>AI-powered return classification, fraud detection, propensity scoring, and exchange-first revenue recovery</p>
      <div style={S.grid4}>
        {[['Return Rate','12.8%'],['NMRR','71%'],['Exchange Rate','34%'],['Fraud Flagged','3']].map(([l,v])=>(
          <div key={l} style={S.metric}><div style={S.metricNum(ACC)}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>
      <div style={{...S.tabBar,marginTop:20}}>{TABS.map((t,i)=><button key={t} style={S.tab(tab===i,ACC)} onClick={()=>setTab(i)}>{t}</button>)}</div>

      {tab === 0 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Returns KPI Dashboard</div>
          <div style={S.grid3}>
            {[['Return Rate','12.8%','-0.4% MoM','#22c55e'],['Revenue Lost','£26,890','this month','#ef4444'],['Avg Processing','3.2 days','-0.8d MoM','#22c55e'],['NMRR','71%','+3% MoM','#22c55e'],['Exchange Rate','34%','+5% MoM','#22c55e'],['Fraud Rate','4.9%','+1.2% (watch)','#f59e0b']].map(([l,v,s,c])=>(
              <div key={l} style={S.metric}><div style={S.metricNum(c)}>{v}</div><div style={{fontSize:12,color:c,marginTop:2}}>{s}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Return Reason AI Classification</div>
          {REASONS.map(r=>(
            <div key={r.category} style={{...S.row,padding:'10px 0',borderBottom:'1px solid #27272a'}}>
              <span style={{flex:1,fontWeight:600}}>{r.label}</span>
              <span style={{color:'#a1a1aa',fontSize:13,minWidth:50}}>{r.count} returns</span>
              <div style={{width:140,background:'#27272a',borderRadius:4,height:8}}><div style={{background:ACC,height:8,borderRadius:4,width:(r.pct*100)+'%'}} /></div>
              <span style={{minWidth:40,fontSize:13,fontWeight:700}}>{(r.pct*100).toFixed(0)}%</span>
              <span style={S.badge(r.fraudRisk>0.5?'#ef4444':r.fraudRisk>0.1?'#f59e0b':'#22c55e')}>Fraud risk: {(r.fraudRisk*100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}

      {tab === 2 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Return Fraud Detection</div>
          {[{name:'Customer A',returnRate:0.78,score:0.89,flag:'serial-returner'},{name:'Customer B',returnRate:0.60,score:0.71,flag:'wardrobing'},{name:'Customer C',returnRate:0.50,score:0.63,flag:'high-value-pattern'}].map((c,i)=>(
            <div key={i} style={{...S.cardSm,borderColor:'#ef4444'}}>
              <div style={S.row}>
                <strong style={{flex:1}}>{c.name}</strong>
                <span style={S.badge('#f59e0b')}>{c.flag}</span>
                <span style={{fontSize:12,color:'#a1a1aa'}}>Return rate: {(c.returnRate*100).toFixed(0)}%</span>
                <span style={{fontWeight:700,color:'#ef4444'}}>Fraud score: {c.score}</span>
                <button style={S.btnSm('#ef4444')}>Flag</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 3 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Return Propensity Scorer</div>
          <p style={{color:'#a1a1aa',fontSize:13,marginBottom:16}}>Score the probability a customer will return an order at checkout time.</p>
          <div style={S.grid2}>
            <div><label style={S.label}>Customer ID</label><input style={S.input} placeholder="e.g. C-8841" value={custId} onChange={e=>setCustId(e.target.value)} /></div>
            <div><label style={S.label}>&nbsp;</label><button style={{...S.btn(ACC),width:'100%'}} onClick={scoreCustomer}>Score Customer (1 credit)</button></div>
          </div>
          {propResult&&<div style={{...S.cardSm,marginTop:16,borderColor:propResult.score>0.4?'#ef4444':'#27272a'}}>
            <div style={S.row}><span style={{fontWeight:700}}>Propensity Score:</span><span style={{fontSize:22,fontWeight:800,color:propResult.score>0.4?'#ef4444':'#22c55e'}}>{(propResult.score*100).toFixed(1)}%</span><span style={S.badge(propResult.score>0.4?'#ef4444':'#22c55e')}>{propResult.risk} risk</span></div>
            <div style={{color:'#a1a1aa',fontSize:13,marginTop:8}}>{propResult.score>0.4?'Recommendation: Show size guide, customer photos, and extended returns policy at checkout.':'Low return risk — standard checkout flow.'}</div>
          </div>}
        </div>
      )}

      {tab === 4 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Return Disposition Engine</div>
          {[{condition:'Like New',action:'restock',pct:0.52,recovery:0.92},{condition:'Minor Defects',action:'refurbish',pct:0.21,recovery:0.68},{condition:'Significant Damage',action:'liquidate',pct:0.14,recovery:0.24},{condition:'Unsaleable',action:'donate',pct:0.08,recovery:0},{condition:'Hazardous',action:'destroy',pct:0.05,recovery:0}].map((d,i)=>(
            <div key={i} style={{...S.row,padding:'10px 0',borderBottom:'1px solid #27272a'}}>
              <span style={{flex:1,fontWeight:600}}>{d.condition}</span>
              <span style={S.badge(d.action==='restock'?'#22c55e':d.action==='refurbish'?'#3b82f6':d.action==='liquidate'?'#f59e0b':'#71717a')}>{d.action}</span>
              <span style={{color:'#a1a1aa',fontSize:13}}>{(d.pct*100).toFixed(0)}% of returns</span>
              <span style={{fontWeight:700,color:d.recovery>0.5?'#22c55e':'#f59e0b'}}>Recovery: {(d.recovery*100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}

      {tab === 5 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Exchange-First Revenue Recovery</div>
          <div style={S.grid2}>
            {[{reason:'Wrong size',incentive:'Free exchange + 10% off next order',prob:0.62,saved:42},{reason:'Not as expected',incentive:'Free return + £10 credit if keep alternative',prob:0.38,saved:28},{reason:'Changed mind',incentive:'110% store credit vs refund',prob:0.29,saved:21},{reason:'Quality issue',incentive:'Priority exchange + upgrade',prob:0.44,saved:36}].map((e,i)=>(
              <div key={i} style={S.cardSm}>
                <div style={S.row}><strong>{e.reason}</strong><span style={S.badge('#22c55e')}>{(e.prob*100).toFixed(0)}% conversion</span></div>
                <div style={{fontSize:13,color:'#a1a1aa',margin:'8px 0'}}>{e.incentive}</div>
                <div style={{color:'#22c55e',fontWeight:700,fontSize:13}}>Avg £{e.saved} saved per return</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
