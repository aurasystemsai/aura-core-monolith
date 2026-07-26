import { useState } from 'react';
import { apiFetchJSON } from '../../api';

const ACC = '#10b981';

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


const SKUS = [
  { sku: 'SKU-001', name: 'Classic White Tee', abcClass: 'A', xyzClass: 'X', stockLevel: 210, reorderPoint: 145, eoq: 280, safetyStock: 32, stockoutRisk7d: 0.08, stockoutRisk30d: 0.31, forecastAccuracy: 0.89, reorderNeeded: false, avgDailySales: 14.2 },
  { sku: 'SKU-002', name: 'Organic Cotton Hoodie', abcClass: 'A', xyzClass: 'Y', stockLevel: 95, reorderPoint: 140, eoq: 190, safetyStock: 55, stockoutRisk7d: 0.34, stockoutRisk30d: 0.72, forecastAccuracy: 0.81, reorderNeeded: true, avgDailySales: 8.7 },
  { sku: 'SKU-003', name: 'Slim Fit Jeans', abcClass: 'B', xyzClass: 'X', stockLevel: 320, reorderPoint: 110, eoq: 145, safetyStock: 28, stockoutRisk7d: 0.02, stockoutRisk30d: 0.05, forecastAccuracy: 0.93, reorderNeeded: false, avgDailySales: 5.4 },
  { sku: 'SKU-004', name: 'Linen Summer Dress', abcClass: 'A', xyzClass: 'Z', stockLevel: 180, reorderPoint: 380, eoq: 240, safetyStock: 148, stockoutRisk7d: 0.61, stockoutRisk30d: 0.89, forecastAccuracy: 0.71, reorderNeeded: true, avgDailySales: 11.3 },
  { sku: 'SKU-005', name: 'Canvas Tote Bag', abcClass: 'C', xyzClass: 'X', stockLevel: 440, reorderPoint: 25, eoq: 80, safetyStock: 12, stockoutRisk7d: 0.01, stockoutRisk30d: 0.02, forecastAccuracy: 0.96, reorderNeeded: false, avgDailySales: 2.1 },
];
const TABS = ['Overview','SKU Forecast','Safety Stock & EOQ','ABC-XYZ Matrix','Stockout Risks','What-If Scenarios'];
const riskColor = r => r > 0.5 ? '#ef4444' : r > 0.25 ? '#f59e0b' : '#22c55e';

export default function InventoryForecasting() {
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState(SKUS[1]);
  const [demandMult, setDemandMult] = useState(1.3);
  const [ltMult, setLtMult] = useState(1.5);

  return (
    <div style={S.page}>
      <h1 style={S.title}>Inventory Forecasting</h1>
      <p style={S.subtitle}>AI-powered demand forecasting, safety stock optimisation, ABC-XYZ matrix, and stockout risk scoring</p>
      <div style={S.grid4}>
        {[['SKUs Tracked','5'],['Reorder Needed','2'],['Critical Stockouts','1'],['Avg Accuracy','86%']].map(([l,v])=>(
          <div key={l} style={S.metric}><div style={S.metricNum()}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>
      <div style={{...S.tabBar, marginTop:20}}>{TABS.map((t,i)=><button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}</div>

      {tab === 0 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>SKU Overview</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>SKU</th><th style={S.th}>Name</th><th style={S.th}>Stock</th><th style={S.th}>Coverage</th><th style={S.th}>30d Risk</th><th style={S.th}>ABC-XYZ</th><th style={S.th}>Accuracy</th><th style={S.th}></th></tr></thead>
            <tbody>{SKUS.map(s=>(
              <tr key={s.sku}>
                <td style={S.td}><code style={{fontSize:11,color:'#a1a1aa'}}>{s.sku}</code></td>
                <td style={S.td}><strong>{s.name}</strong></td>
                <td style={S.td}><span style={{color:s.reorderNeeded?'#ef4444':'#22c55e',fontWeight:700}}>{s.stockLevel}</span></td>
                <td style={S.td}>{Math.floor(s.stockLevel/s.avgDailySales)}d</td>
                <td style={S.td}><span style={{color:riskColor(s.stockoutRisk30d),fontWeight:700}}>{(s.stockoutRisk30d*100).toFixed(0)}%</span></td>
                <td style={S.td}><span style={S.badge(s.abcClass==='A'?'#8b5cf6':s.abcClass==='B'?ACC:'#71717a')}>{s.abcClass+s.xyzClass}</span></td>
                <td style={S.td}>{(s.forecastAccuracy*100).toFixed(0)}%</td>
                <td style={S.td}>{s.reorderNeeded&&<button style={S.btnSm()}>Gen PO</button>}</td>
              </tr>
            ))}</tbody>
          </table>
          <button style={{...S.btn(),marginTop:16}}>Bulk Generate POs (2 credits)</button>
        </div>
      )}

      {tab === 1 && (
        <div style={S.card}>
          <div style={{...S.row,marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:15}}>Demand Forecast — {selected.name}</div>
            <select style={{...S.select,width:'auto'}} onChange={e=>setSelected(SKUS.find(s=>s.sku===e.target.value))}>
              {SKUS.map(s=><option key={s.sku} value={s.sku}>{s.name}</option>)}
            </select>
          </div>
          <div style={S.grid3}>
            {[['Avg Daily Sales',selected.avgDailySales,'units/day'],['Forecast Accuracy',(selected.forecastAccuracy*100).toFixed(0)+'%','model'],['EOQ',selected.eoq,'units']].map(([l,v,u])=>(
              <div key={l} style={S.metric}><div style={S.metricNum()}>{v}</div><div style={S.metricLabel}>{l} · {u}</div></div>
            ))}
          </div>
          <div style={S.divider} />
          <div style={{fontWeight:600,marginBottom:10,fontSize:13}}>8-Week Forecast (Prophet + XGBoost Ensemble, 95% CI)</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Period</th><th style={S.th}>Actual</th><th style={S.th}>Forecast</th><th style={S.th}>Lower</th><th style={S.th}>Upper</th></tr></thead>
            <tbody>{[{p:'Wk 1',a:98,f:102,l:88,u:116},{p:'Wk 2',a:111,f:108,l:94,u:122},{p:'Wk 3',a:89,f:95,l:81,u:109},{p:'Wk 4',a:124,f:118,l:104,u:132},{p:'Wk 5',a:null,f:131,l:115,u:147},{p:'Wk 6',a:null,f:128,l:112,u:144},{p:'Wk 7',a:null,f:136,l:118,u:154},{p:'Wk 8',a:null,f:142,l:124,u:160}].map((r,i)=>(
              <tr key={i}><td style={S.td}>{r.p}</td><td style={S.td}>{r.a??<em style={{color:'#71717a'}}>projected</em>}</td><td style={{...S.td,fontWeight:700,color:ACC}}>{r.f}</td><td style={{...S.td,color:'#71717a'}}>{r.l}</td><td style={{...S.td,color:'#71717a'}}>{r.u}</td></tr>
            ))}</tbody>
          </table>
          <button style={{...S.btn(),marginTop:16}}>Run AI Forecast (2 credits)</button>
        </div>
      )}

      {tab === 2 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Safety Stock & EOQ Calculator</div>
          {SKUS.map(s=>(
            <div key={s.sku} style={S.cardSm}>
              <div style={{...S.row,marginBottom:8}}><strong>{s.name}</strong><span style={S.badge()}>{s.abcClass+s.xyzClass}</span></div>
              <div style={S.grid4}>
                {[['Safety Stock',s.safetyStock+' units'],['Reorder Point',s.reorderPoint+' units'],['EOQ',s.eoq+' units'],['Current Stock',s.stockLevel+' units']].map(([l,v])=>(
                  <div key={l}><div style={S.label}>{l}</div><div style={{fontWeight:700,color:ACC}}>{v}</div></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 3 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>ABC-XYZ Inventory Policy Matrix</div>
          <div style={{display:'grid',gridTemplateColumns:'auto 1fr 1fr 1fr',gap:2}}>
            {['','X (Stable)','Y (Variable)','Z (Volatile)','A (High Value)','Tight control, frequent ordering','Regular review, safety buffer','High safety stock, dual sourcing','B (Medium Value)','Standard reorder','Moderate buffer','Safety stock + supplier risk','C (Low Value)','Min order + JIT','Low stock OK','Consignment/dropship'].map((cell,i)=>(
              <div key={i} style={{background:i===0||i===4||i===8||i===12?'#27272a':i<4?'#1f1f23':'#18181b',padding:'10px 14px',borderRadius:4,fontSize:i<4?12:13,color:i<4?'#a1a1aa':'#e4e4e7',fontWeight:i<4?700:400}}>
                {cell}
                {i>4&&i!==0&&[5,6,7,9,10,11,13,14,15].includes(i)&&(()=>{const skuMap={5:'AX',6:'AY',7:'AZ',9:'BX',10:'BY',11:'BZ',13:'CX',14:'CY',15:'CZ'};const cls=skuMap[i];const skusInCell=SKUS.filter(s=>s.abcClass+s.xyzClass===cls);return skusInCell.map(s=><div key={s.sku} style={{...S.badge(ACC),marginTop:6,display:'block'}}>{s.name}</div>);})()}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Stockout Risk Dashboard</div>
          {SKUS.filter(s=>s.stockoutRisk7d>0.1||s.stockoutRisk30d>0.3).map(s=>(
            <div key={s.sku} style={{...S.cardSm,borderColor:s.stockoutRisk7d>0.5?'#ef4444':'#27272a'}}>
              <div style={S.row}>
                <strong style={{flex:1}}>{s.name}</strong>
                <span style={S.badge(riskColor(s.stockoutRisk7d))}>7d: {(s.stockoutRisk7d*100).toFixed(0)}%</span>
                <span style={S.badge(riskColor(s.stockoutRisk30d))}>30d: {(s.stockoutRisk30d*100).toFixed(0)}%</span>
                <span style={{color:'#a1a1aa',fontSize:12}}>Stock: {s.stockLevel} / ROP: {s.reorderPoint}</span>
                <button style={S.btnSm()}>Create PO</button>
              </div>
              <div style={{marginTop:8,background:'#27272a',borderRadius:4,height:6}}>
                <div style={{background:riskColor(s.stockoutRisk30d),height:6,borderRadius:4,width:Math.min(100,s.stockLevel/s.reorderPoint*100)+'%'}} />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 5 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>What-If Scenario Planner</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Demand Multiplier</label><input type="range" min="0.5" max="2" step="0.1" value={demandMult} onChange={e=>setDemandMult(parseFloat(e.target.value))} style={{width:'100%'}} /><div style={{textAlign:'center',fontWeight:700,color:ACC,fontSize:18}}>×{demandMult}</div></div>
            <div><label style={S.label}>Lead Time Multiplier</label><input type="range" min="0.5" max="3" step="0.1" value={ltMult} onChange={e=>setLtMult(parseFloat(e.target.value))} style={{width:'100%'}} /><div style={{textAlign:'center',fontWeight:700,color:ACC,fontSize:18}}>×{ltMult}</div></div>
          </div>
          <div style={S.divider} />
          <table style={S.table}>
            <thead><tr><th style={S.th}>SKU</th><th style={S.th}>New Daily Sales</th><th style={S.th}>New Safety Stock</th><th style={S.th}>Stockout Risk Change</th></tr></thead>
            <tbody>{SKUS.map(s=>{const newSales=(s.avgDailySales*demandMult).toFixed(1);const newSS=Math.round(s.safetyStock*demandMult*ltMult);const riskChange=((s.stockoutRisk30d*demandMult*ltMult)-s.stockoutRisk30d).toFixed(2);return(
              <tr key={s.sku}><td style={S.td}>{s.name}</td><td style={S.td}>{newSales}/day</td><td style={S.td}>{newSS} units</td><td style={S.td}><span style={{color:riskChange>0?'#ef4444':'#22c55e',fontWeight:700}}>{riskChange>0?'+':''}{riskChange}</span></td></tr>
            )})}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
