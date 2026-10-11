import { useState } from 'react';

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


const SUPPLIERS = [
  { id: 's1', name: 'EcoFabrics Ltd', country: 'Portugal', overallScore: 91, status: 'preferred', onTimeRate: 0.94, qualityRate: 0.98, sustainability: 0.91, riskScore: 0.12, annualSpend: 142000, leadTimeDays: 14 },
  { id: 's2', name: 'GlobalTextile Co', country: 'Bangladesh', overallScore: 74, status: 'active', onTimeRate: 0.78, qualityRate: 0.91, sustainability: 0.52, riskScore: 0.38, annualSpend: 89000, leadTimeDays: 28 },
  { id: 's3', name: 'OrganicSource GmbH', country: 'Germany', overallScore: 95, status: 'preferred', onTimeRate: 0.97, qualityRate: 0.99, sustainability: 0.97, riskScore: 0.06, annualSpend: 38000, leadTimeDays: 10 },
  { id: 's4', name: 'FastMake Inc', country: 'China', overallScore: 62, status: 'watch', onTimeRate: 0.71, qualityRate: 0.87, sustainability: 0.41, riskScore: 0.51, annualSpend: 61000, leadTimeDays: 35 },
];
const TABS = ['Supplier Overview','Scorecards','Lead Time Prediction','Disruption Alerts','Carbon Footprint','Benchmarks'];
const statusColor = s => s==='preferred'?'#22c55e':s==='active'?'#3b82f6':'#ef4444';

export default function InventorySupplierSync() {
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState(SUPPLIERS[0]);

  return (
    <div style={S.page}>
      <h1 style={S.title}>Supplier Intelligence</h1>
      <p style={S.subtitle}>Supplier scorecards, lead time prediction, risk monitoring, and carbon footprint analysis</p>
      <div style={S.grid4}>
        {[['Total Suppliers','4'],['Preferred','2'],['Watch List','1'],['Active Alerts','2']].map(([l,v])=>(
          <div key={l} style={S.metric}><div style={S.metricNum(ACC)}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>
      <div style={{...S.tabBar,marginTop:20}}>{TABS.map((t,i)=><button key={t} style={S.tab(tab===i,ACC)} onClick={()=>setTab(i)}>{t}</button>)}</div>

      {tab === 0 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Supplier Network</div>
          {SUPPLIERS.map(s=>(
            <div key={s.id} style={{...S.cardSm,cursor:'pointer',borderColor:s.id===selected.id?ACC:'#27272a'}} onClick={()=>setSelected(s)}>
              <div style={S.row}>
                <span style={{fontWeight:700,flex:1}}>{s.name}</span>
                <span style={{fontSize:12,color:'#a1a1aa'}}>{s.country}</span>
                <span style={S.badge(statusColor(s.status))}>{s.status}</span>
                <div style={{background:'#27272a',borderRadius:4,height:8,width:120,overflow:'hidden'}}><div style={{background:s.overallScore>=85?'#22c55e':s.overallScore>=70?ACC:'#ef4444',height:8,borderRadius:4,width:s.overallScore+'%'}} /></div>
                <span style={{fontWeight:700,color:s.overallScore>=85?'#22c55e':s.overallScore>=70?ACC:'#ef4444',minWidth:30}}>{s.overallScore}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 1 && (
        <div style={S.card}>
          <div style={{...S.row,marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:15}}>Scorecard — {selected.name}</div>
            <select style={{...S.select,width:'auto'}} onChange={e=>setSelected(SUPPLIERS.find(s=>s.id===e.target.value))}>
              {SUPPLIERS.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={S.grid3}>
            {[['Overall Score',selected.overallScore+'/100'],['On-Time Rate',(selected.onTimeRate*100).toFixed(0)+'%'],['Quality Rate',(selected.qualityRate*100).toFixed(0)+'%'],['Sustainability',(selected.sustainability*100).toFixed(0)+'/100'],['Risk Score',selected.riskScore.toFixed(2)],['Annual Spend','£'+selected.annualSpend.toLocaleString()]].map(([l,v])=>(
              <div key={l} style={S.metric}><div style={S.metricNum(ACC)}>{v}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
          <div style={S.divider} />
          <div style={{color:'#a1a1aa',fontSize:13}}>Recommendation: <strong style={{color:selected.overallScore>=85?'#22c55e':selected.overallScore>=70?ACC:'#ef4444'}}>{selected.overallScore>=85?'Increase allocation':selected.overallScore>=70?'Maintain allocation':'Reduce allocation / find alternative'}</strong></div>
        </div>
      )}

      {tab === 2 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Lead Time Prediction (Log-Normal Model)</div>
          {SUPPLIERS.map(s=>(<div key={s.id} style={{...S.cardSm,marginBottom:10}}>
            <div style={{fontWeight:600,marginBottom:8}}>{s.name} · {s.country}</div>
            <div style={S.grid4}>
              {[['P10',Math.max(5,s.leadTimeDays-6)+'d'],['P50',s.leadTimeDays+'d'],['P90',s.leadTimeDays+8+'d'],['P99',s.leadTimeDays+14+'d']].map(([l,v])=>(
                <div key={l}><div style={S.label}>{l}</div><div style={{fontWeight:700,color:ACC}}>{v}</div></div>
              ))}
            </div>
          </div>))}
        </div>
      )}

      {tab === 3 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Supply Chain Disruption Alerts</div>
          {[{severity:'high',supplier:'FastMake Inc',msg:'Credit rating downgraded — review payment terms',orders:1,date:'2026-07-22'},{severity:'medium',supplier:'GlobalTextile Co',msg:'Port congestion at Chittagong — expect 5-7 day delays',orders:3,date:'2026-07-20'}].map((a,i)=>(
            <div key={i} style={{...S.cardSm,borderColor:a.severity==='high'?'#ef4444':'#f59e0b'}}>
              <div style={S.row}>
                <span style={S.badge(a.severity==='high'?'#ef4444':'#f59e0b')}>{a.severity.toUpperCase()}</span>
                <strong>{a.supplier}</strong>
                <span style={{flex:1,color:'#a1a1aa',fontSize:13}}>{a.msg}</span>
                <span style={{fontSize:12,color:'#71717a'}}>{a.orders} orders affected · {a.date}</span>
                <button style={S.btnSm('#ef4444')}>Action</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 4 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Supplier Carbon Footprint</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Supplier</th><th style={S.th}>Country</th><th style={S.th}>Sustainability</th><th style={S.th}>CO₂/kg</th><th style={S.th}>Annual Tonnes</th></tr></thead>
            <tbody>{SUPPLIERS.map(s=>{const co2=s.country==='Germany'?2.1:s.country==='Portugal'?3.4:s.country==='Bangladesh'?8.2:9.6;return(
              <tr key={s.id}><td style={S.td}><strong>{s.name}</strong></td><td style={S.td}>{s.country}</td><td style={S.td}><span style={{color:s.sustainability>=0.8?'#22c55e':s.sustainability>=0.6?ACC:'#ef4444',fontWeight:700}}>{(s.sustainability*100).toFixed(0)}%</span></td><td style={S.td}>{co2}</td><td style={S.td}>{(s.annualSpend/180*0.8/1000*10/10).toFixed(1)}</td></tr>
            )})}
            </tbody>
          </table>
        </div>
      )}

      {tab === 5 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Performance Benchmarks vs Industry</div>
          {[['On-Time Rate',Math.round(SUPPLIERS.reduce((s,sup)=>s+sup.onTimeRate,0)/SUPPLIERS.length*100)+'%','88%'],['Quality Rate',Math.round(SUPPLIERS.reduce((s,sup)=>s+sup.qualityRate,0)/SUPPLIERS.length*100)+'%','94%'],['Avg Lead Time',Math.round(SUPPLIERS.reduce((s,sup)=>s+sup.leadTimeDays,0)/SUPPLIERS.length)+'d','21d']].map(([metric,you,ind])=>(
            <div key={metric} style={{...S.row,padding:'12px 0',borderBottom:'1px solid #27272a'}}>
              <span style={{flex:1,fontWeight:600}}>{metric}</span>
              <span style={{color:ACC,fontWeight:700}}>You: {you}</span>
              <span style={{color:'#71717a',fontSize:13}}>Industry: {ind}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
