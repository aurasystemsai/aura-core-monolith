import { useState } from 'react';

const ACC = '#ec4899';

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


const TABS = ['Churn Dashboard','RFM Segmentation','Cohort Retention','Early Warnings','Playbooks','Reactivation ROI'];
const SEGMENTS = [
  { segment: 'Champions', r:5, f:5, m:5, count: 284, revPct: 0.42, churnRisk: 0.04, action: 'Reward and upsell' },
  { segment: 'Loyal', r:4, f:4, m:4, count: 418, revPct: 0.28, churnRisk: 0.09, action: 'Upsell premium' },
  { segment: 'At Risk', r:2, f:3, m:3, count: 312, revPct: 0.14, churnRisk: 0.44, action: 'Win-back campaign' },
  { segment: 'Cant Lose', r:1, f:5, m:5, count: 98, revPct: 0.09, churnRisk: 0.68, action: 'Personal outreach' },
  { segment: 'Hibernating', r:2, f:2, m:2, count: 521, revPct: 0.04, churnRisk: 0.71, action: 'Reactivation series' },
  { segment: 'Lost', r:1, f:1, m:1, count: 841, revPct: 0.03, churnRisk: 0.91, action: 'Final win-back' },
];
const churnColor = r => r > 0.6 ? '#ef4444' : r > 0.35 ? '#f59e0b' : '#22c55e';

export default function ChurnPredictionPlaybooks() {
  const [tab, setTab] = useState(0);
  const [rfmInput, setRfmInput] = useState('');
  const [churnResult, setChurnResult] = useState(null);

  const calcChurn = () => {
    const score = parseInt(rfmInput) || 9;
    const prob = Math.min(0.95, Math.max(0.02, (15 - score) / 15 * 0.8));
    setChurnResult({ score, prob, risk: prob > 0.6 ? 'critical' : prob > 0.35 ? 'high' : prob > 0.15 ? 'medium' : 'low' });
  };

  return (
    <div style={S.page}>
      <h1 style={S.title}>Churn Prediction & Playbooks</h1>
      <p style={S.subtitle}>RFM scoring, BG/NBD churn model, cohort retention curves, early warning indicators, and retention playbooks</p>
      <div style={S.grid4}>
        {[['High Risk Customers','410'],['Revenue at Risk','23%'],['Avg 6m Retention','21%'],['Early Warnings','2 active']].map(([l,v])=>(
          <div key={l} style={S.metric}><div style={S.metricNum(ACC)}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>
      <div style={{...S.tabBar,marginTop:20}}>{TABS.map((t,i)=><button key={t} style={S.tab(tab===i,ACC)} onClick={()=>setTab(i)}>{t}</button>)}</div>

      {tab === 0 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Churn Risk Overview</div>
          {SEGMENTS.map(s=>(
            <div key={s.segment} style={{...S.row,padding:'10px 0',borderBottom:'1px solid #27272a'}}>
              <span style={{minWidth:120,fontWeight:600}}>{s.segment}</span>
              <span style={{color:'#71717a',fontSize:13}}>{s.count} customers</span>
              <span style={{color:'#a1a1aa',fontSize:13}}>{(s.revPct*100).toFixed(0)}% revenue</span>
              <div style={{flex:1,background:'#27272a',borderRadius:4,height:8,margin:'0 8px'}}><div style={{background:churnColor(s.churnRisk),height:8,borderRadius:4,width:(s.churnRisk*100)+'%'}} /></div>
              <span style={{color:churnColor(s.churnRisk),fontWeight:700,minWidth:60}}>{(s.churnRisk*100).toFixed(0)}% risk</span>
              <button style={S.btnSm(ACC)}>Playbook</button>
            </div>
          ))}
        </div>
      )}

      {tab === 1 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>RFM Quintile Scoring</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Segment</th><th style={S.th}>R</th><th style={S.th}>F</th><th style={S.th}>M</th><th style={S.th}>Count</th><th style={S.th}>Churn Risk</th><th style={S.th}>Recommended Action</th></tr></thead>
            <tbody>{SEGMENTS.map(s=>(
              <tr key={s.segment}>
                <td style={{...S.td,fontWeight:700}}>{s.segment}</td>
                <td style={S.td}>{s.r}</td><td style={S.td}>{s.f}</td><td style={S.td}>{s.m}</td>
                <td style={S.td}>{s.count}</td>
                <td style={S.td}><span style={{color:churnColor(s.churnRisk),fontWeight:700}}>{(s.churnRisk*100).toFixed(0)}%</span></td>
                <td style={{...S.td,color:'#a1a1aa',fontSize:12}}>{s.action}</td>
              </tr>
            ))}</tbody>
          </table>
          <div style={{marginTop:16}}>
            <div style={S.label}>BG/NBD Churn Probability Calculator</div>
            <div style={S.row}>
              <input style={{...S.input,flex:1}} placeholder="RFM score (3-15)" value={rfmInput} onChange={e=>setRfmInput(e.target.value)} type="number" min="3" max="15" />
              <button style={S.btn(ACC)} onClick={calcChurn}>Calculate Churn Probability</button>
            </div>
            {churnResult&&<div style={{...S.cardSm,marginTop:12,borderColor:churnColor(churnResult.prob)}}>
              <div style={S.row}><span style={{fontWeight:700}}>RFM Score {churnResult.score}:</span><span style={{fontSize:20,fontWeight:800,color:churnColor(churnResult.prob)}}>{(churnResult.prob*100).toFixed(1)}% churn probability</span><span style={S.badge(churnColor(churnResult.prob))}>{churnResult.risk}</span></div>
            </div>}
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Cohort Retention Curves</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Cohort</th><th style={S.th}>M+0</th><th style={S.th}>M+1</th><th style={S.th}>M+2</th><th style={S.th}>M+3</th><th style={S.th}>M+4</th><th style={S.th}>M+5</th><th style={S.th}>M+6</th></tr></thead>
            <tbody>{[{c:'Jan 2025',d:[100,42,31,26,23,21,19]},{c:'Feb 2025',d:[100,45,33,28,25,23,21]},{c:'Mar 2025',d:[100,48,36,30,27,24,null]},{c:'Apr 2025',d:[100,51,38,32,29,null,null]},{c:'May 2025',d:[100,53,40,34,null,null,null]},{c:'Jun 2025',d:[100,56,42,null,null,null,null]}].map(row=>(
              <tr key={row.c}><td style={S.td}><strong>{row.c}</strong></td>{row.d.map((v,i)=>(<td key={i} style={{...S.td,color:v===null?'#27272a':v>=50?'#22c55e':v>=30?ACC:ACC,fontWeight:v===100?800:400}}>{v!==null?v+'%':'—'}</td>))}</tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 3 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Early Warning Indicators</div>
          {[{signal:'Email open rate declining',change:'-28% MoM',affected:842,lead:45,sev:'high'},{signal:'Support tickets spike',change:'+41% WoW',affected:184,lead:21,sev:'high'},{signal:'Add-to-cart no purchase',change:'+18% MoM',affected:2840,lead:14,sev:'medium'},{signal:'Session duration drop',change:'-22% WoW',affected:1240,lead:30,sev:'medium'}].map((w,i)=>(
            <div key={i} style={{...S.cardSm,borderColor:w.sev==='high'?'#ef4444':'#27272a'}}>
              <div style={S.row}>
                <span style={S.badge(w.sev==='high'?'#ef4444':'#f59e0b')}>{w.sev.toUpperCase()}</span>
                <strong style={{flex:1}}>{w.signal}</strong>
                <span style={{color:'#ef4444',fontWeight:700}}>{w.change}</span>
                <span style={{color:'#a1a1aa',fontSize:12}}>{w.affected.toLocaleString()} customers · leads churn by {w.lead}d</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 4 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Segment Playbooks</div>
          {[{segment:'At Risk',churnRisk:'44%',steps:[{day:0,action:'Email: "We miss you" + 15% off',channel:'Email',conv:0.12},{day:3,action:'SMS: Limited time offer expiring',channel:'SMS',conv:0.08},{day:7,action:'Loyalty points bonus',channel:'Email',conv:0.06},{day:14,action:'Final: Free shipping',channel:'Email+SMS',conv:0.04}],revenue:28400},{segment:'Cant Lose',churnRisk:'68%',steps:[{day:0,action:'Personal founder email — no sales',channel:'Email',conv:0.22},{day:2,action:'Exclusive VIP event invitation',channel:'Email',conv:0.14},{day:7,action:'20% lifetime discount offer',channel:'Email+Phone',conv:0.10}],revenue:18900}].map((p,i)=>(
            <div key={i} style={{...S.card,background:'#09090b',marginBottom:16}}>
              <div style={{...S.row,marginBottom:12}}><strong style={{fontSize:15}}>{p.segment} Playbook</strong><span style={S.badge(ACC)}>Churn risk: {p.churnRisk}</span><span style={{marginLeft:'auto',color:'#22c55e',fontWeight:700}}>Est. £{p.revenue.toLocaleString()} recovered</span></div>
              {p.steps.map((step,j)=>(
                <div key={j} style={{...S.row,padding:'8px 0',borderBottom:'1px solid #27272a'}}>
                  <span style={{...S.badge(ACC),minWidth:50}}>Day {step.day}</span>
                  <span style={{flex:1,fontSize:13}}>{step.action}</span>
                  <span style={{fontSize:12,color:'#71717a'}}>{step.channel}</span>
                  <span style={{color:'#22c55e',fontWeight:700}}>{(step.conv*100).toFixed(0)}% conv.</span>
                </div>
              ))}
              <button style={{...S.btn(ACC),marginTop:12}}>Activate Playbook</button>
            </div>
          ))}
        </div>
      )}

      {tab === 5 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Reactivation ROI Calculator</div>
          <div style={S.grid3}>
            {[['Segment','At Risk'],['Campaign Cost','£2,000'],['Revenue per Customer','£180'],['Expected Conversions','28'],['Revenue Recovered','£5,040'],['ROI','152%']].map(([l,v])=>(
              <div key={l} style={S.metric}><div style={S.metricNum(ACC)}>{v}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
          <button style={{...S.btn(ACC),marginTop:20}}>Model Custom Scenario</button>
        </div>
      )}
    </div>
  );
}
