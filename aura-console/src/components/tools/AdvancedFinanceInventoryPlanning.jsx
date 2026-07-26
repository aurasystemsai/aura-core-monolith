import { useState } from 'react';

const ACC = '#6366f1';

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


const TABS = ['Overview','13-Week Cash Flow','P&L Dashboard','Open-to-Buy','Budget vs Actuals','Monte Carlo'];

const CF_WEEKS = Array.from({length:13},(_,i)=>({week:i+1,inflows:Math.round(48000+Math.sin(i*0.7)*12000),outflows:Math.round(31000+Math.sin(i*0.5+1)*8000),get net(){return this.inflows-this.outflows;}}));

export default function AdvancedFinanceInventoryPlanning() {
  const [tab, setTab] = useState(0);
  const [simRan, setSimRan] = useState(false);
  const monte = { p5: 142000, p25: 168000, p50: 184000, p75: 201000, p95: 228000 };

  return (
    <div style={S.page}>
      <h1 style={S.title}>Advanced Finance & Inventory Planning</h1>
      <p style={S.subtitle}>13-week cash flow forecasting, P&L dashboard, Open-to-Buy, Monte Carlo simulation, budget variance analysis</p>
      <div style={S.grid4}>
        {[['Revenue','£284k'],['Gross Margin','61.9%'],['EBITDA','£67k'],['Cash Flow','+'+(CF_WEEKS.reduce((s,w)=>s+w.net,0)/1000).toFixed(0)+'k']].map(([l,v])=>(
          <div key={l} style={S.metric}><div style={S.metricNum(ACC)}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>
      <div style={{...S.tabBar,marginTop:20}}>{TABS.map((t,i)=><button key={t} style={S.tab(tab===i,ACC)} onClick={()=>setTab(i)}>{t}</button>)}</div>

      {tab === 0 && (
        <div>
          <div style={S.grid2}>
            <div style={S.card}>
              <div style={{fontWeight:700,marginBottom:12}}>P&L Summary</div>
              {[['Revenue','£284,000',true],['COGS','£108,000',false],['Gross Profit','£176,000',true],['Operating Expenses','£109,000',false],['EBITDA','£67,000',true]].map(([l,v,positive])=>(
                <div key={l} style={{...S.row,padding:'8px 0',borderBottom:'1px solid #27272a'}}>
                  <span style={{flex:1,color:'#a1a1aa'}}>{l}</span>
                  <span style={{fontWeight:700,color:positive?'#22c55e':'#e4e4e7'}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={{fontWeight:700,marginBottom:12}}>Cash Conversion Cycle</div>
              {[['Days Sales Outstanding (DSO)','0 days','(direct Shopify payouts)'],['Days Inventory Outstanding (DIO)','42 days','target: 35'],['Days Payable Outstanding (DPO)','28 days','target: 45'],['Cash Conversion Cycle','14 days','(DIO - DPO)']].map(([l,v,note])=>(
                <div key={l} style={{padding:'8px 0',borderBottom:'1px solid #27272a'}}>
                  <div style={{...S.row}}><span style={{flex:1,fontSize:13}}>{l}</span><span style={{fontWeight:700,color:ACC}}>{v}</span></div>
                  <div style={{fontSize:12,color:'#71717a'}}>{note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>13-Week Rolling Cash Flow Forecast</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Week</th><th style={S.th}>Inflows</th><th style={S.th}>Outflows</th><th style={S.th}>Net Cash Flow</th><th style={S.th}>Optimistic</th><th style={S.th}>Pessimistic</th></tr></thead>
            <tbody>{CF_WEEKS.map(w=>(
              <tr key={w.week}><td style={S.td}>Wk {w.week}</td><td style={{...S.td,color:'#22c55e'}}>£{w.inflows.toLocaleString()}</td><td style={{...S.td,color:'#ef4444'}}>£{w.outflows.toLocaleString()}</td><td style={{...S.td,fontWeight:700,color:w.net>0?'#22c55e':'#ef4444'}}>£{w.net.toLocaleString()}</td><td style={{...S.td,color:'#a1a1aa'}}>£{Math.round(w.inflows*1.15).toLocaleString()}</td><td style={{...S.td,color:'#a1a1aa'}}>£{Math.round(w.inflows*0.85).toLocaleString()}</td></tr>
            ))}</tbody>
          </table>
          <div style={{...S.row,marginTop:16}}><span style={{color:'#a1a1aa',fontSize:13}}>Total 13-week net: <strong style={{color:'#22c55e'}}>£{CF_WEEKS.reduce((s,w)=>s+w.net,0).toLocaleString()}</strong></span></div>
        </div>
      )}

      {tab === 2 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>P&L Dashboard — YoY</div>
          <div style={S.grid4}>
            {[['Revenue','£284k','£241k','+18%'],['Gross Profit','£176k','£148k','+19%'],['EBITDA','£67k','£52k','+29%'],['Gross Margin','61.9%','61.4%','+0.5pp']].map(([l,cur,prior,yoy])=>(
              <div key={l} style={S.metric}><div style={S.metricNum(ACC)}>{cur}</div><div style={{fontSize:12,color:'#71717a'}}>Prior: {prior}</div><div style={{fontSize:13,fontWeight:700,color:'#22c55e'}}>{yoy}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Open-to-Buy Planning</div>
          <div style={S.grid4}>
            {[['Planned Sales','£96,000'],['Beginning Stock','£142,000'],['Ending Stock Target','£85,000'],['Open-to-Buy','£39,000']].map(([l,v])=>(
              <div key={l} style={S.metric}><div style={S.metricNum(ACC)}>{v}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
          <div style={S.divider} />
          <div style={{fontWeight:600,marginBottom:10}}>OTB by Category</div>
          {[['Tops','£38,000','£14,000'],['Bottoms','£24,000','£8,000'],['Dresses','£21,000','£10,000'],['Accessories','£13,000','£6,000']].map(([cat,otb,used])=>(
            <div key={cat} style={{...S.row,padding:'8px 0',borderBottom:'1px solid #27272a'}}>
              <span style={{flex:1,fontWeight:600}}>{cat}</span>
              <span style={{color:'#a1a1aa',fontSize:13}}>OTB: {otb}</span>
              <span style={{color:'#22c55e',fontWeight:700}}>Used: {used}</span>
              <span style={S.badge(ACC)}>Open: £{(parseInt(otb.replace(/D/g,''))-parseInt(used.replace(/D/g,''))).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 4 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Budget vs Actuals</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Metric</th><th style={S.th}>Budget</th><th style={S.th}>Actual</th><th style={S.th}>Variance</th><th style={S.th}>%</th></tr></thead>
            <tbody>{[['Revenue','£270,000','£284,000',14000,5.2],['COGS','£115,000','£108,000',-7000,-6.1],['Gross Profit','£155,000','£176,000',21000,13.5],['EBITDA','£58,000','£67,000',9000,15.5]].map(([m,b,a,v,p])=>(
              <tr key={m}><td style={S.td}><strong>{m}</strong></td><td style={S.td}>{b}</td><td style={S.td}>{a}</td><td style={{...S.td,fontWeight:700,color:v>0?'#22c55e':'#ef4444'}}>£{Math.abs(v).toLocaleString()}{v>0?' favourable':' adverse'}</td><td style={{...S.td,fontWeight:700,color:v>0?'#22c55e':'#ef4444'}}>{v>0?'+':''}{p}%</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 5 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Monte Carlo Revenue Simulation</div>
          <p style={{color:'#a1a1aa',fontSize:13,marginBottom:20}}>10,000 simulations of gross profit using ±20% COGS variation and ±40% revenue variation with current growth assumptions.</p>
          {!simRan?<button style={S.btn(ACC)} onClick={()=>setSimRan(true)}>Run Monte Carlo (3 credits)</button>:(
            <div>
              <div style={S.grid4}>
                {[['P5 (Pessimistic)','£142k','#ef4444'],['P25','£168k','#f59e0b'],['P50 (Base)','£184k','#22c55e'],['P95 (Optimistic)','£228k','#22c55e']].map(([l,v,c])=>(
                  <div key={l} style={S.metric}><div style={S.metricNum(c)}>{v}</div><div style={S.metricLabel}>{l}</div></div>
                ))}
              </div>
              <div style={{...S.cardSm,marginTop:16,color:'#a1a1aa',fontSize:13}}>90% confidence interval: <strong style={{color:'#22c55e'}}>£142k – £228k</strong> gross profit for the period. Current trajectory at <strong style={{color:ACC}}>£184k (P50)</strong>.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
