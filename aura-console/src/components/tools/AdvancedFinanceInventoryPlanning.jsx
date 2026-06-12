import React, { useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/advanced-finance-inventory-planning";

const S = {
  root: { background:'#09090b', minHeight:'100vh', color:'#fafafa', fontFamily:"'Inter',system-ui,sans-serif", padding:'28px 32px' },
  card: { background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:24, marginBottom:20 },
  mini: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:16 },
  cardTitle: { fontSize:14, fontWeight:700, color:'#fafafa', marginBottom:16, marginTop:0 },
  row: { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' },
  input: { flex:1, minWidth:180, background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:14, padding:'11px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif" },
  select: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'11px 14px', outline:'none', cursor:'pointer' },
  textarea: { width:'100%', background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'12px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif", resize:'vertical', boxSizing:'border-box' },
  btn: (bg) => ({ background:bg||'#10b981', color:'#fff', border:'none', borderRadius:10, padding:'11px 22px', fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }),
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
  metaVal: (c) => ({ fontSize:22, fontWeight:700, color:c||'#10b981' }),
  metaLbl: { fontSize:11, color:'#71717a', marginTop:2 },
  sT: { fontSize:12, fontWeight:700, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, marginTop:16 },
  groupNav: { display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' },
  gBtn: (a, c) => ({ background:a?c+'22':'#18181b', color:a?c:'#71717a', border:`1px solid ${a?c+'44':'#27272a'}`, borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:a?700:500, cursor:'pointer' }),
  tabStrip: { display:'flex', gap:4, marginBottom:20, flexWrap:'wrap', borderBottom:'1px solid #27272a', paddingBottom:8 },
  tBtn: (a, c) => ({ background:'none', color:a?c:'#71717a', border:'none', borderBottom:a?`2px solid ${c}`:'2px solid transparent', padding:'8px 14px', fontSize:13, fontWeight:a?700:500, cursor:'pointer', marginBottom:-9 }),
  bar: { height:6, background:'#27272a', borderRadius:3, overflow:'hidden', marginTop:4 },
  fill: (pct, c) => ({ height:'100%', width:Math.min(pct||0,100)+'%', background:c||'#10b981', borderRadius:3 }),
  pre: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, padding:16, fontSize:12, color:'#a1a1aa', fontFamily:'monospace', whiteSpace:'pre-wrap', maxHeight:280, overflow:'auto', marginBottom:12 },
  sc: (s) => { if(s>=75) return '#10b981'; if(s>=50) return '#f59e0b'; return '#ef4444'; },
};

const GROUPS = [
  {
    "id": "pnl",
    "label": "P&L",
    "color": "#10b981",
    "tabs": [
      {
        "id": "live-pnl",
        "label": "Live P&L"
      },
      {
        "id": "revenue",
        "label": "Revenue"
      },
      {
        "id": "cogs",
        "label": "COGS"
      },
      {
        "id": "gross-margin",
        "label": "Gross Margin"
      },
      {
        "id": "net-margin",
        "label": "Net Margin"
      },
      {
        "id": "ebitda",
        "label": "EBITDA"
      }
    ]
  },
  {
    "id": "cash",
    "label": "Cash Flow",
    "color": "#4f46e5",
    "tabs": [
      {
        "id": "cash-flow",
        "label": "Cash Flow"
      },
      {
        "id": "13-week",
        "label": "13-Week Forecast"
      },
      {
        "id": "cash-scenarios",
        "label": "Scenarios"
      },
      {
        "id": "ar-aging",
        "label": "AR Aging"
      },
      {
        "id": "ap-aging",
        "label": "AP Aging"
      },
      {
        "id": "working-cap",
        "label": "Working Capital"
      }
    ]
  },
  {
    "id": "inv-fin",
    "label": "Inventory",
    "color": "#f97316",
    "tabs": [
      {
        "id": "inv-fin-val",
        "label": "Inventory Value"
      },
      {
        "id": "otb",
        "label": "Open-to-Buy"
      },
      {
        "id": "inv-by-cat",
        "label": "By Category"
      },
      {
        "id": "inv-by-loc",
        "label": "By Location"
      },
      {
        "id": "write-offs-fin",
        "label": "Write-Offs"
      },
      {
        "id": "inv-turns",
        "label": "Turns"
      }
    ]
  },
  {
    "id": "budget",
    "label": "Budget",
    "color": "#0ea5e9",
    "tabs": [
      {
        "id": "vs-actuals",
        "label": "vs Actuals"
      },
      {
        "id": "budget-build",
        "label": "Budget Builder"
      },
      {
        "id": "budget-fore",
        "label": "Forecasts"
      },
      {
        "id": "variance",
        "label": "Variance"
      },
      {
        "id": "by-channel",
        "label": "By Channel"
      },
      {
        "id": "by-sku",
        "label": "By SKU"
      }
    ]
  },
  {
    "id": "tax",
    "label": "Tax",
    "color": "#a855f7",
    "tabs": [
      {
        "id": "tax-calc",
        "label": "Tax Calculator"
      },
      {
        "id": "jurisdictions",
        "label": "Jurisdictions"
      },
      {
        "id": "thresholds",
        "label": "Thresholds"
      },
      {
        "id": "vat-gst",
        "label": "VAT / GST"
      },
      {
        "id": "afip-compliance",
        "label": "Compliance"
      },
      {
        "id": "tax-calendar",
        "label": "Calendar"
      }
    ]
  },
  {
    "id": "fx",
    "label": "FX & Currency",
    "color": "#ec4899",
    "tabs": [
      {
        "id": "fx-exposure",
        "label": "FX Exposure"
      },
      {
        "id": "currencies",
        "label": "Currencies"
      },
      {
        "id": "hedging",
        "label": "Hedging"
      },
      {
        "id": "fx-impact",
        "label": "Impact Analysis"
      },
      {
        "id": "fx-scenarios",
        "label": "Scenarios"
      },
      {
        "id": "fx-rates",
        "label": "Live Rates"
      }
    ]
  },
  {
    "id": "afip-adv",
    "label": "Advanced",
    "color": "#f59e0b",
    "tabs": [
      {
        "id": "ai-cfo",
        "label": "AI CFO Insights"
      },
      {
        "id": "monte-carlo",
        "label": "Monte Carlo"
      },
      {
        "id": "board-pack",
        "label": "Board Pack"
      },
      {
        "id": "afip-api",
        "label": "API"
      },
      {
        "id": "afip-settings",
        "label": "Settings"
      },
      {
        "id": "afip-world",
        "label": "World-Class"
      }
    ]
  }
];

export default function AdvancedFinanceInventoryPlanning() {
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
            <input style={S.input} placeholder="Search or filter…" value={q[tab]||''} onChange={e=>setQ(p=>({...p,[tab]:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&fetch_(tab,ep,{query:q[tab]})} />
            <button style={S.btn()} onClick={()=>fetch_(tab,ep,{query:q[tab]})} disabled={loading[tab]}>{loading[tab]?'Loading…':'Load Data'}</button>
            <button style={S.btn('#10b981')} onClick={()=>toast_('AI analyzing…')}>✦ AI Insights</button>
          </div>
          {err[tab] && <div style={S.err}>{err[tab]}</div>}
          {loading[tab] ? <div style={S.loading}>Loading {title.toLowerCase()}…</div> :
           d ? (
            <div style={{overflowX:'auto'}}>
              <table style={S.tbl}>
                <thead><tr><th style={S.th}>Item</th><th style={S.th}>Category</th><th style={S.th}>Value</th><th style={S.th}>Status</th></tr></thead>
                <tbody>{(Array.isArray(d)?d:Object.values(d)[0]||[]).map((row,i)=>(
                  <tr key={i} style={i%2?S.trOdd:{}}>
                    <td style={S.td}>{row.name||row.id||row.label||row.item||JSON.stringify(row).slice(0,40)}</td>
                    <td style={S.td}><span style={{color:'#71717a',fontSize:12}}>{row.category||row.type||row.group||'—'}</span></td>
                    <td style={S.td}><span style={{fontWeight:600}}>{row.value||row.amount||row.score||'—'}</span></td>
                    <td style={S.td}>{row.status?<span style={S.badge(row.status==='active'||row.status==='ok'?'#10b981':row.status==='warning'?'#f59e0b':'#ef4444')}>{row.status}</span>:'—'}</td>
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
      case 'live-pnl': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Live P&amp;L Dashboard</div>
            <div style={S.row}>
              <button style={S.btn('#10b981')} onClick={()=>fetch_('live-pnl',API+'/pnl/live')} disabled={loading['live-pnl']}>{loading['live-pnl']?'Loading…':'Refresh P&L'}</button>
              <button style={S.btn('#4f46e5')} onClick={()=>fetch_('ai-cfo',API+'/ai/cfo-insights',{})}>✦ AI CFO Insights</button>
            </div>
            {err['live-pnl'] && <div style={S.err}>{err['live-pnl']}</div>}
            {loading['live-pnl'] ? <div style={S.loading}>Loading P&L…</div> : d ? (
              <>
                <div style={{...S.mini,marginBottom:16,background:'#09090b'}}>
                  <div style={{fontSize:11,color:'#71717a',marginBottom:4}}>Last updated: {new Date(d.lastUpdated||Date.now()).toLocaleTimeString()}</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                    {[['Revenue','$'+d.revenue?.toLocaleString(),d.vsLastMonth?.revenue],['Gross Margin',d.grossMargin+'%',d.vsLastMonth?.grossMargin],['Net Margin',d.netMargin+'%',d.vsLastMonth?.netMargin]].map(([l,v,vs])=>(
                      <div key={l} style={{textAlign:'center'}}>
                        <div style={{fontSize:22,fontWeight:800,color:'#10b981'}}>{v}</div>
                        <div style={{fontSize:11,color:'#71717a'}}>{l}</div>
                        {vs!=null && <div style={{fontSize:11,color:vs>0?'#10b981':'#ef4444'}}>{vs>0?'+':''}{vs}% MoM</div>}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={S.metaRow}>
                  {[['Revenue','$'+d.revenue?.toLocaleString(),'#10b981'],['COGS','$'+d.cogs?.toLocaleString(),'#f97316'],['Gross Profit','$'+d.grossProfit?.toLocaleString(),'#4f46e5'],['EBITDA','$'+d.ebitda?.toLocaleString(),'#0ea5e9'],['EBITDA %',d.ebitdaMargin+'%','#10b981'],['Net Profit','$'+d.netProfit?.toLocaleString(),'#10b981']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
                <div style={S.sT}>By Channel</div>
                {Object.entries(d.breakdown||{}).map(([c,v])=>(
                  <div key={c} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #1f1f22'}}>
                    <span style={{fontSize:13,color:'#fafafa'}}>{c}</span>
                    <span style={{fontWeight:700,color:'#10b981'}}>${v?.toLocaleString()}</span>
                    <div style={{...S.bar,width:100,display:'inline-block'}}><div style={S.fill((v/d.revenue)*100,'#10b981')} /></div>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Click Refresh P&L to load your live financial data.</div>}
          </div>
        </div>
      );
      case '13-week': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>13-Week Rolling Cash Flow Forecast</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>ARIMA + LSTM ensemble cash flow model with bull/base/bear scenarios. Updated daily from Shopify payouts, AP/AR, and inventory data.</p>
            <button style={S.btn('#4f46e5')} onClick={()=>fetch_('13-week',API+'/cash/forecast-13w')} disabled={loading['13-week']}>{loading['13-week']?'Loading…':'Load Forecast'}</button>
            {err['13-week'] && <div style={S.err}>{err['13-week']}</div>}
            {loading['13-week'] ? <div style={S.loading}>Running cash flow model…</div> : d?.weeks?.length ? (
              <>
                <div style={S.sT}>Weekly Cash Forecast (Model: {d.model}, {(d.confidence*100).toFixed(0)}% confidence)</div>
                <div style={{overflowX:'auto'}}>
                  <table style={S.tbl}>
                    <thead><tr><th style={S.th}>Week</th><th style={S.th}>Opening</th><th style={S.th}>Inflows</th><th style={S.th}>Outflows</th><th style={S.th}>Closing</th><th style={S.th}>Bear</th><th style={S.th}>Bull</th></tr></thead>
                    <tbody>{d.weeks.map((w,i)=>(
                      <tr key={i} style={i%2?S.trOdd:{}}>
                        <td style={S.td}><span style={{fontWeight:600}}>{w.week}</span></td>
                        <td style={S.td}>${w.openingBalance?.toLocaleString()}</td>
                        <td style={{...S.td,color:'#10b981'}}>+${w.inflows?.toLocaleString()}</td>
                        <td style={{...S.td,color:'#ef4444'}}>-${w.outflows?.toLocaleString()}</td>
                        <td style={{...S.td,fontWeight:700,color:w.closingBalance<50000?'#ef4444':w.closingBalance<100000?'#f59e0b':'#10b981'}}>${w.closingBalance?.toLocaleString()}</td>
                        <td style={{...S.td,color:'#71717a'}}>${w.lowScenario?.toLocaleString()}</td>
                        <td style={{...S.td,color:'#71717a'}}>${w.highScenario?.toLocaleString()}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </>
            ) : <div style={S.empty}>Load the 13-week forecast to see cash flow projections.</div>}
          </div>
        </div>
      );
      case 'working-cap': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Working Capital Optimization</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Cash Conversion Cycle = DSO + DIO - DPO. Reducing CCC by 5 days typically frees 5-10% of annual revenue in working capital.</p>
            <button style={S.btn('#4f46e5')} onClick={()=>fetch_('working-cap',API+'/cash/working-capital')} disabled={loading['working-cap']}>{loading['working-cap']?'Analyzing…':'Analyze Working Capital'}</button>
            {err['working-cap'] && <div style={S.err}>{err['working-cap']}</div>}
            {loading['working-cap'] ? <div style={S.loading}>Calculating CCC…</div> : d ? (
              <>
                <div style={S.metaRow}>
                  {[['DSO',d.dso+' days','#f59e0b'],['DIO',d.dio+' days','#f97316'],['DPO',d.dpo+' days','#10b981'],['CCC',d.ccc?.toFixed(1)+' days',d.ccc>50?'#ef4444':'#10b981']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
                <div style={{...S.mini,marginBottom:16}}><p style={{color:'#a1a1aa',fontSize:13,lineHeight:1.7,margin:0}}>{d.recommendation}</p></div>
                <div style={S.sT}>Optimization Opportunities</div>
                {d.opportunities?.map((o,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #1f1f22'}}>
                    <span style={{fontSize:13,color:'#fafafa'}}>{o.action}</span>
                    <span style={{fontWeight:700,color:'#10b981'}}>${o.saving?.toLocaleString()} freed</span>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Analyze working capital to find cash optimization opportunities.</div>}
          </div>
        </div>
      );
      case 'vs-actuals': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Budget vs Actuals</div>
            <button style={S.btn('#0ea5e9')} onClick={()=>fetch_('vs-actuals',API+'/budget/vs-actuals')} disabled={loading['vs-actuals']}>{loading['vs-actuals']?'Loading…':'Load Budget vs Actuals'}</button>
            {err['vs-actuals'] && <div style={S.err}>{err['vs-actuals']}</div>}
            {loading['vs-actuals'] ? <div style={S.loading}>Loading…</div> : d ? (
              <>
                <div style={S.sT}>Summary</div>
                {Object.entries(d.summary||{}).map(([k,v])=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #1f1f22'}}>
                    <span style={{fontSize:13,color:'#fafafa',textTransform:'capitalize'}}>{k.replace(/([A-Z])/g,' $1')}</span>
                    <span style={{fontSize:12,color:'#71717a'}}>${(v.budget||0).toLocaleString()} budget</span>
                    <span style={{fontWeight:600,color:'#fafafa'}}>${(v.actual||0).toLocaleString()}</span>
                    <span style={{fontWeight:700,color:v.variance>0?'#10b981':'#ef4444'}}>{v.variance>0?'+':''}{v.variance}%</span>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Load Budget vs Actuals to see variance analysis.</div>}
          </div>
        </div>
      );
      case 'ai-cfo': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>✦ AI CFO Insights</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>AI-powered financial intelligence — multi-model analysis of your P&L, cash flow, inventory, and budget. Generates board-ready narrative commentary.</p>
            <div style={S.row}>
              <select style={S.select} value={form.model||'gpt-4o'} onChange={e=>setForm(p=>({...p,model:e.target.value}))}>
                <option value="gpt-4o-mini">GPT-4o Mini (2 credits)</option>
                <option value="gpt-4o">GPT-4o (4 credits)</option>
                <option value="gpt-4">GPT-4 (6 credits)</option>
              </select>
              <button style={S.btn('#4f46e5')} onClick={()=>fetch_('ai-cfo',API+'/ai/cfo-insights',{})} disabled={loading['ai-cfo']}>{loading['ai-cfo']?'Analyzing…':'✦ Generate CFO Insights'}</button>
            </div>
            {err['ai-cfo'] && <div style={S.err}>{err['ai-cfo']}</div>}
            {loading['ai-cfo'] ? <div style={S.loading}>AI CFO analyzing financial data…</div> : data['ai-cfo']?.insights ? (
              <div>
                <div style={{...S.mini,marginBottom:16}}><p style={{color:'#a1a1aa',fontSize:13,lineHeight:1.7,margin:0}}>{data['ai-cfo'].insights.summary}</p></div>
                {[['Risks','#ef4444',data['ai-cfo'].insights.risks],['Opportunities','#10b981',data['ai-cfo'].insights.opportunities]].map(([label,color,items])=>(
                  <div key={label}>
                    <div style={S.sT}>{label}</div>
                    {items?.map((item,i)=>(
                      <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid #1f1f22'}}>
                        <span style={S.badge(color)}>•</span>
                        <span style={{fontSize:13,color:'#fafafa'}}>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
                <div style={{color:'#71717a',fontSize:11,marginTop:8}}>Credits: {data['ai-cfo'].creditsUsed}</div>
              </div>
            ) : <div style={S.empty}>Click Generate CFO Insights for AI-powered financial analysis.</div>}
          </div>
        </div>
      );
      case 'afip-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>✦ World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'📈',t:'ARIMA + LSTM Cash Flow Forecasting',d:'Ensemble model producing 13-week rolling cash flow forecast with bull/base/bear scenarios, updated daily from transaction data.'},
                {icon:'🔄',t:'Cash Conversion Cycle Optimizer',d:'DSO × DIO × DPO analysis with automated recommendations to free working capital locked in inventory and receivables.'},
                {icon:'🎲',t:'Monte Carlo Scenario Engine',d:'10,000-simulation revenue and cost modelling with percentile outputs (P10/P25/P50/P75/P90) for risk-aware planning.'},
                {icon:'📊',t:'Open-to-Buy Planning',d:'Retail OTB planning: planned sales + target EOH - BOH = open-to-buy budget by category, week, and buyer.'},
                {icon:'🌍',t:'Multi-Jurisdiction Tax Engine',d:'VAT/GST/sales tax calculation with nexus threshold monitoring across US states, EU, UK, Canada, and Australia.'},
                {icon:'💱',t:'FX Risk Dashboard',d:'Foreign currency exposure analysis with impact modeling, hedging timing recommendations, and multi-currency margin tracking.'},
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
            <h1 style={{fontSize:24,fontWeight:800,color:'#fafafa',margin:'0 0 4px',letterSpacing:'-0.02em'}}>Advanced Finance Inventory Planning</h1>
            <p style={{color:'#71717a',fontSize:13,margin:'4px 0 0'}}>CFO-grade finance platform — live P&L, 13-week cash flow ML, budget vs actuals & Monte Carlo planning</p>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={S.btn('#27272a')} onClick={()=>fetch_(activeTab, API+'/health',{})}>↺ Refresh</button>
            <button style={S.btn('#10b981')} onClick={()=>toast_('AI analysis started…')}>✦ AI Analysis</button>
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
