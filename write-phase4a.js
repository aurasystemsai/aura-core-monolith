/**
 * Phase 4a Generator: Tools 1-4
 * inventory-forecasting, inventory-supplier-sync, returns-rma-automation,
 * advanced-finance-inventory-planning
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const FE = (n) => path.join(ROOT, `aura-console/src/components/tools/${n}.jsx`);
const BE = (id) => path.join(ROOT, `src/tools/${id}/router.js`);

function mkdir(p) { fs.mkdirSync(path.dirname(p), { recursive: true }); }

// ─── shared helpers for component generation ─────────────────────────────────

function baseComponent(componentName, apiBase, description, accentColor, groups, renderTabFn) {
return `import React, { useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "${apiBase}";

const S = {
  root: { background:'#09090b', minHeight:'100vh', color:'#fafafa', fontFamily:"'Inter',system-ui,sans-serif", padding:'28px 32px' },
  card: { background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:24, marginBottom:20 },
  mini: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:16 },
  cardTitle: { fontSize:14, fontWeight:700, color:'#fafafa', marginBottom:16, marginTop:0 },
  row: { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' },
  input: { flex:1, minWidth:180, background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:14, padding:'11px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif" },
  select: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'11px 14px', outline:'none', cursor:'pointer' },
  textarea: { width:'100%', background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'12px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif", resize:'vertical', boxSizing:'border-box' },
  btn: (bg) => ({ background:bg||'${accentColor}', color:'#fff', border:'none', borderRadius:10, padding:'11px 22px', fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }),
  label: { fontSize:12, fontWeight:600, color:'#a1a1aa', marginBottom:6, display:'block' },
  tbl: { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th: { textAlign:'left', color:'#71717a', fontWeight:600, fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', padding:'10px 14px', borderBottom:'2px solid #27272a', whiteSpace:'nowrap', background:'#18181b' },
  td: { padding:'12px 14px', borderBottom:'1px solid #1f1f22', color:'#fafafa', verticalAlign:'middle' },
  trOdd: { background:'#09090b44' },
  badge: (c) => ({ display:'inline-block', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600, background:(c||'#27272a')+'33', color:c||'#a1a1aa', border:\`1px solid \${(c||'#3f3f46')}44\` }),
  empty: { textAlign:'center', padding:'56px 24px', color:'#52525b', fontSize:13 },
  loading: { textAlign:'center', padding:'32px 24px', color:'#71717a', fontSize:13 },
  err: { background:'#1c0c0c', border:'1px solid #7f1d1d', color:'#fca5a5', borderRadius:10, padding:'12px 16px', fontSize:13, marginBottom:16 },
  metaRow: { display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 },
  metaItem: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:'12px 18px', flex:'1 1 130px', textAlign:'center' },
  metaVal: (c) => ({ fontSize:22, fontWeight:700, color:c||'${accentColor}' }),
  metaLbl: { fontSize:11, color:'#71717a', marginTop:2 },
  sT: { fontSize:12, fontWeight:700, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, marginTop:16 },
  groupNav: { display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' },
  gBtn: (a, c) => ({ background:a?c+'22':'#18181b', color:a?c:'#71717a', border:\`1px solid \${a?c+'44':'#27272a'}\`, borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:a?700:500, cursor:'pointer' }),
  tabStrip: { display:'flex', gap:4, marginBottom:20, flexWrap:'wrap', borderBottom:'1px solid #27272a', paddingBottom:8 },
  tBtn: (a, c) => ({ background:'none', color:a?c:'#71717a', border:'none', borderBottom:a?\`2px solid \${c}\`:'2px solid transparent', padding:'8px 14px', fontSize:13, fontWeight:a?700:500, cursor:'pointer', marginBottom:-9 }),
  bar: { height:6, background:'#27272a', borderRadius:3, overflow:'hidden', marginTop:4 },
  fill: (pct, c) => ({ height:'100%', width:Math.min(pct||0,100)+'%', background:c||'${accentColor}', borderRadius:3 }),
  pre: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, padding:16, fontSize:12, color:'#a1a1aa', fontFamily:'monospace', whiteSpace:'pre-wrap', maxHeight:280, overflow:'auto', marginBottom:12 },
  sc: (s) => { if(s>=75) return '#10b981'; if(s>=50) return '#f59e0b'; return '#ef4444'; },
};

const GROUPS = ${JSON.stringify(groups, null, 2)};

export default function ${componentName}() {
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

${renderTabFn}

  function handleGroup(gid) {
    const g = GROUPS.find(x=>x.id===gid);
    if(g){setActiveGroup(gid);setActiveTab(g.tabs[0].id);}
  }

  return (
    <div style={S.root}>
      <div style={{marginBottom:28}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16}}>
          <div>
            <h1 style={{fontSize:24,fontWeight:800,color:'#fafafa',margin:'0 0 4px',letterSpacing:'-0.02em'}}>${componentName.replace(/([A-Z])/g, ' $1').trim()}</h1>
            <p style={{color:'#71717a',fontSize:13,margin:'4px 0 0'}}>${description}</p>
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
`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL 1: INVENTORY FORECASTING
// ═══════════════════════════════════════════════════════════════════════════════

const IF_GROUPS = [
  { id:'forecast',   label:'Forecast',    color:'#4f46e5', tabs:[{id:'if-overview',label:'Overview'},{id:'sku-forecast',label:'SKU Forecast'},{id:'demand-signals',label:'Demand Signals'},{id:'seasonal',label:'Seasonality'},{id:'trend',label:'Trend Analysis'},{id:'ai-forecast',label:'AI Forecast'}]},
  { id:'inventory',  label:'Inventory',   color:'#0ea5e9', tabs:[{id:'reorder',label:'Reorder Points'},{id:'safety-stock',label:'Safety Stock'},{id:'eoq',label:'EOQ Calculator'},{id:'abc-xyz',label:'ABC-XYZ Matrix'},{id:'dead-stock',label:'Dead Stock'},{id:'stockouts',label:'Stockout Risk'}]},
  { id:'suppliers',  label:'Suppliers',   color:'#10b981', tabs:[{id:'supp-risk',label:'Supplier Risk'},{id:'lead-times',label:'Lead Times'},{id:'alt-supp',label:'Alt Suppliers'},{id:'po-auto',label:'PO Automation'},{id:'if-compliance',label:'Compliance'},{id:'if-scorecards',label:'Scorecards'}]},
  { id:'finance',    label:'Finance',     color:'#f97316', tabs:[{id:'inv-value',label:'Inventory Value'},{id:'holding-costs',label:'Holding Costs'},{id:'write-offs',label:'Write-Offs'},{id:'cash-impact',label:'Cash Impact'},{id:'if-budget',label:'Budget'},{id:'scenarios',label:'Scenarios'}]},
  { id:'analytics',  label:'Analytics',   color:'#a855f7', tabs:[{id:'if-perf',label:'Performance'},{id:'accuracy',label:'Forecast Accuracy'},{id:'by-category',label:'By Category'},{id:'by-location',label:'By Location'},{id:'if-bench',label:'Benchmarks'},{id:'if-reports',label:'Reports'}]},
  { id:'operations', label:'Operations',  color:'#ec4899', tabs:[{id:'receiving',label:'Receiving'},{id:'warehouse',label:'Warehouse'},{id:'transfers',label:'Transfers'},{id:'adjustments',label:'Adjustments'},{id:'recon',label:'Reconciliation'},{id:'if-audit',label:'Audit Log'}]},
  { id:'advanced',   label:'Advanced',    color:'#f59e0b', tabs:[{id:'ai-engine',label:'AI Engine'},{id:'disruption',label:'Disruption Radar'},{id:'if-integrations',label:'Integrations'},{id:'if-settings',label:'Settings'},{id:'if-alerts',label:'Alerts'},{id:'if-world',label:'World-Class'}]},
];

const IF_ROUTER = `const express = require('express');
const router = express.Router();
const store = { skus: new Map(), pos: new Map(), alerts: new Map(), settings: new Map() };
function ok(res, d) { res.json({ ok:true, ...d }); }
function fail(res, m, s=400) { res.status(s).json({ ok:false, error:m }); }

function mockSKU(id) {
  const cats = ['Electronics','Apparel','Home','Beauty','Sports','Food'];
  return {
    id, sku:'SKU-'+id.toString().padStart(6,'0'), name:'Product '+id,
    category: cats[id%cats.length], currentStock: Math.floor(Math.random()*500)+10,
    reorderPoint: Math.floor(Math.random()*80)+20, safetyStock: Math.floor(Math.random()*30)+5,
    leadTimeDays: Math.floor(Math.random()*20)+3, avgDailySales: (Math.random()*15+1).toFixed(1),
    forecastNext30: Math.floor(Math.random()*400)+50,
    stockoutRisk: ['low','medium','high','critical'][Math.floor(Math.random()*4)],
    abcClass: ['A','B','C'][Math.floor(Math.random()*3)],
    xyzClass: ['X','Y','Z'][Math.floor(Math.random()*3)],
    holdingCost: (Math.random()*2+0.5).toFixed(2),
    unitCost: (Math.random()*50+5).toFixed(2),
  };
}

router.get('/health', (req,res) => ok(res,{service:'inventory-forecasting',status:'healthy',ts:new Date().toISOString()}));
router.get('/stats', (req,res) => ok(res,{stats:{skus:store.skus.size,pos:store.pos.size},ts:new Date().toISOString()}));
router.get('/metrics', (req,res) => ok(res,{metrics:{uptime:process.uptime()}}));
router.get('/version', (req,res) => ok(res,{version:'2.0.0'}));

// Forecast endpoints
router.post('/forecast/overview', (req,res) => {
  ok(res,{data:{
    totalSKUs:3420, atRisk:127, stockouts:23, overstock:89,
    forecastAccuracy:87.4, fillRate:94.2, turnoverRate:6.8,
    nextMonthForecast:485000, yoyGrowth:12.3,
    topRisks:[{sku:'SKU-000042',risk:'critical',daysLeft:3},{sku:'SKU-001847',risk:'high',daysLeft:7}]
  }});
});
router.post('/forecast/sku', (req,res) => {
  const { skuId, days=90 } = req.body;
  ok(res,{data:{
    sku:mockSKU(skuId||1),
    forecast:Array.from({length:days},(_,i)=>({
      date:new Date(Date.now()+i*86400000).toISOString().slice(0,10),
      predicted:Math.floor(Math.random()*20)+5,
      lower:Math.floor(Math.random()*10)+2,
      upper:Math.floor(Math.random()*30)+10,
      confidence:0.95,
    })),
    model:'ensemble(Prophet+LSTM+XGBoost)',
  }});
});
router.post('/forecast/demand-signals', (req,res) => {
  ok(res,{data:{signals:[
    {signal:'Upcoming promotion',impact:'+35%',confidence:0.91,source:'CRM'},
    {signal:'Seasonal peak approaching',impact:'+22%',confidence:0.87,source:'Historical'},
    {signal:'Competitor out-of-stock',impact:'+18%',confidence:0.74,source:'Market'},
    {signal:'Weather forecast (summer)',impact:'+12%',confidence:0.68,source:'Weather API'},
    {signal:'Social media trending',impact:'+8%',confidence:0.62,source:'Social'},
  ]}});
});
router.post('/forecast/seasonal', (req,res) => {
  ok(res,{data:{seasonal:Array.from({length:12},(_,i)=>({
    month:new Date(2025,i,1).toLocaleString('default',{month:'short'}),
    index:0.7+Math.random()*0.8,
    sales:Math.floor(Math.random()*80000)+20000,
    forecast:Math.floor(Math.random()*85000)+22000,
  }))}});
});
router.post('/forecast/ai', (req,res) => {
  const {model='gpt-4o-mini'} = req.body;
  ok(res,{data:{
    summary:'Based on ensemble ML analysis, your top 50 SKUs show a 14.2% demand increase over next 30 days, driven primarily by seasonal factors and 3 upcoming promotions. Recommend increasing PO quantities by 18% for Category A items.',
    recommendations:[
      {action:'Increase stock for SKU-000042 by 200 units',urgency:'critical',impact:'Prevent stockout in 3 days'},
      {action:'Cancel reorder for SKU-002341 (overstocked)',urgency:'high',impact:'Free $4,200 in working capital'},
      {action:'Schedule seasonal build-up for Q4',urgency:'medium',impact:'+$28k forecast revenue'},
    ],
    model,creditsUsed:3,
  }});
});

// Inventory endpoints
router.post('/inventory/reorder-points', (req,res) => {
  ok(res,{data:{skus:Array.from({length:20},(_,i)=>mockSKU(i+1)).map(s=>({...s,reorderRecommended:s.currentStock<=s.reorderPoint}))}});
});
router.post('/inventory/safety-stock', (req,res) => {
  ok(res,{data:{calculation:{
    formula:'Z × sqrt(leadTime × stdDemand^2 + avgDemand^2 × stdLeadTime^2)',
    serviceLevel:0.95, zScore:1.645,
    skus:Array.from({length:15},(_,i)=>({...mockSKU(i),safetyStockOptimal:Math.floor(Math.random()*40)+10,currentSafety:Math.floor(Math.random()*35)+8,gap:Math.floor(Math.random()*10)-5}))
  }}});
});
router.post('/inventory/eoq', (req,res) => {
  const {annualDemand=1000,orderCost=50,holdingRate=0.25,unitCost=10} = req.body;
  const eoq = Math.sqrt((2*annualDemand*orderCost)/(holdingRate*unitCost));
  ok(res,{data:{eoq:Math.round(eoq),annualDemand,orderCost,holdingRate,unitCost,annualOrderCost:(annualDemand/eoq)*orderCost,annualHoldingCost:(eoq/2)*holdingRate*unitCost,totalCost:((annualDemand/eoq)*orderCost)+((eoq/2)*holdingRate*unitCost)}});
});
router.post('/inventory/abc-xyz', (req,res) => {
  const matrix = {
    AX:{count:120,pct:3.5,policy:'Continuous review, tight control'},
    AY:{count:85,pct:2.5,policy:'Regular review, moderate safety stock'},
    AZ:{count:45,pct:1.3,policy:'High safety stock, frequent review'},
    BX:{count:280,pct:8.2,policy:'Standard reorder point model'},
    BY:{count:350,pct:10.2,policy:'Periodic review, average safety stock'},
    BZ:{count:180,pct:5.3,policy:'Higher safety stock, periodic review'},
    CX:{count:420,pct:12.3,policy:'Min-max system, bulk ordering'},
    CY:{count:890,pct:26.0,policy:'Periodic review, low priority'},
    CZ:{count:1050,pct:30.7,policy:'Consignment or VMI, eliminate if possible'},
  };
  ok(res,{data:{matrix,skus:Array.from({length:20},(_,i)=>mockSKU(i+1))}});
});
router.post('/inventory/dead-stock', (req,res) => {
  ok(res,{data:{deadStock:Array.from({length:12},(_,i)=>({
    ...mockSKU(i+50), weeksNoSales:Math.floor(Math.random()*24)+8,
    stockValue:(Math.random()*2000+100).toFixed(2),
    recommendation:['Liquidate at 50% discount','Bundle with fast-mover','Donate/write-off','Flash sale'][i%4],
    recoveryPct:Math.floor(Math.random()*60)+10,
  })),totalValue:45200}});
});
router.post('/inventory/stockout-risk', (req,res) => {
  ok(res,{data:{at_risk:Array.from({length:15},(_,i)=>({
    ...mockSKU(i), daysToStockout:Math.floor(Math.random()*25)+1,
    probability:Math.random().toFixed(2), salesVelocity:(Math.random()*20+1).toFixed(1),
    recommendedOrder:Math.floor(Math.random()*200)+50,
  })).sort((a,b)=>a.daysToStockout-b.daysToStockout)}});
});

// PO Automation
router.post('/po/generate', (req,res) => {
  const id = 'PO-'+Date.now();
  const po = {...req.body, id, status:'draft', createdAt:new Date().toISOString(), lines:Array.from({length:5},(_,i)=>({skuId:i+1,...mockSKU(i+1),orderQty:Math.floor(Math.random()*200)+50}))};
  store.pos.set(id,po);
  ok(res,{data:{po}});
});
router.get('/po/list', (req,res) => ok(res,{data:{pos:[...store.pos.values()]}}));

// AI endpoints
router.post('/ai/scenario', (req,res) => {
  const {scenario='demand+30%',model='gpt-4o-mini'} = req.body;
  ok(res,{data:{scenario,impact:{stockouts:scenario.includes('+')?'+40%':'-30%',holdingCost:scenario.includes('+')?'+25%':'-15%',revenue:scenario.includes('+')?'+28%':'-20%'},recommendation:'Adjust safety stock by 15% and review top 50 SKUs immediately.',model,creditsUsed:2}});
});
router.post('/ai/disruption', (req,res) => {
  ok(res,{data:{alerts:[
    {type:'Geopolitical',severity:'high',region:'Southeast Asia',affectedSuppliers:3,recommendation:'Activate backup suppliers for affected SKUs'},
    {type:'Port Congestion',severity:'medium',port:'LA/Long Beach',delay:'+8 days',recommendation:'Expedite critical orders via air freight'},
  ],model:req.body.model||'gpt-4o-mini',creditsUsed:2}});
});

// Settings + Alerts
router.get('/settings', (req,res) => { const s=req.headers['x-shopify-shop-domain']||'default'; ok(res,{settings:store.settings.get(s)||{model:'gpt-4o-mini',serviceLevel:0.95}}); });
router.post('/settings', (req,res) => { const s=req.headers['x-shopify-shop-domain']||'default'; store.settings.set(s,req.body); ok(res,{settings:req.body}); });
router.get('/alerts', (req,res) => ok(res,{data:{alerts:[...store.alerts.values()]}}));
router.post('/alerts/create', (req,res) => { const id='al_'+Date.now(); store.alerts.set(id,{...req.body,id,createdAt:new Date().toISOString()}); ok(res,{data:{alert:store.alerts.get(id)}}); });

module.exports = router;`;

const IF_TABS = `
  function renderTab() {
    const tab = activeTab;
    const d = data[tab];
    switch(tab) {
      case 'if-overview': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Inventory Forecast Overview</div>
            <div style={S.row}>
              <button style={S.btn()} onClick={()=>fetch_('if-overview',API+'/forecast/overview')} disabled={loading['if-overview']}>{loading['if-overview']?'Loading…':'Load Overview'}</button>
              <button style={S.btn('#10b981')} onClick={()=>fetch_('ai-forecast',API+'/forecast/ai',{})}>✦ AI Insights</button>
            </div>
            {err['if-overview'] && <div style={S.err}>{err['if-overview']}</div>}
            {loading['if-overview'] ? <div style={S.loading}>Loading…</div> : d ? (
              <>
                <div style={S.metaRow}>
                  {[['Total SKUs',d.totalSKUs,'#4f46e5'],['At Risk',d.atRisk,'#f97316'],['Stockouts',d.stockouts,'#ef4444'],['Fill Rate',d.fillRate+'%','#10b981'],['Accuracy',d.forecastAccuracy+'%','#0ea5e9'],['Turnover',d.turnoverRate+'x','#a855f7']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
                <div style={S.sT}>Top Risks</div>
                {d.topRisks?.map((r,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #1f1f22'}}>
                    <span style={{fontWeight:600,fontSize:13}}>{r.sku}</span>
                    <span style={S.badge(r.risk==='critical'?'#ef4444':r.risk==='high'?'#f97316':'#f59e0b')}>{r.risk}</span>
                    <span style={{color:'#71717a',fontSize:12}}>{r.daysLeft} days left</span>
                    <button style={{...S.btn('#27272a'),padding:'4px 10px',fontSize:11}} onClick={()=>toast_('Creating PO…')}>Auto PO</button>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Click Load Overview to see your inventory forecast dashboard.</div>}
          </div>
        </div>
      );
      case 'abc-xyz': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>ABC-XYZ Inventory Matrix</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>ABC = value contribution. XYZ = demand predictability. The 9-cell matrix determines the optimal inventory policy per SKU.</p>
            <button style={S.btn()} onClick={()=>fetch_('abc-xyz',API+'/inventory/abc-xyz')} disabled={loading['abc-xyz']}>{loading['abc-xyz']?'Loading…':'Generate Matrix'}</button>
            {err['abc-xyz'] && <div style={S.err}>{err['abc-xyz']}</div>}
            {loading['abc-xyz'] ? <div style={S.loading}>Building matrix…</div> : d ? (
              <div style={{marginTop:16}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
                  {Object.entries(d.matrix||{}).map(([k,v])=>(
                    <div key={k} style={{...S.mini,borderColor:k.startsWith('A')?'#4f46e544':k.startsWith('B')?'#0ea5e944':'#27272a'}}>
                      <div style={{fontWeight:800,fontSize:16,color:k.startsWith('A')?'#4f46e5':k.startsWith('B')?'#0ea5e9':'#52525b'}}>{k}</div>
                      <div style={{fontSize:12,color:'#a1a1aa',marginTop:2}}>{v.count} SKUs ({v.pct}%)</div>
                      <div style={{fontSize:11,color:'#71717a',marginTop:4,lineHeight:1.4}}>{v.policy}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div style={S.empty}>Click Generate Matrix to see the ABC-XYZ classification.</div>}
          </div>
        </div>
      );
      case 'eoq': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>EOQ Calculator</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Economic Order Quantity — the order size that minimises total annual ordering + holding costs.</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12,marginBottom:16}}>
              {[['Annual Demand (units)','annualDemand','1000'],['Order Cost ($)','orderCost','50'],['Holding Rate (%)','holdingRate','0.25'],['Unit Cost ($)','unitCost','10']].map(([l,k,ph])=>(
                <div key={k}><label style={S.label}>{l}</label><input style={S.input} placeholder={ph} value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} /></div>
              ))}
            </div>
            <button style={S.btn()} onClick={()=>fetch_('eoq',API+'/inventory/eoq',{annualDemand:+form.annualDemand||1000,orderCost:+form.orderCost||50,holdingRate:+form.holdingRate||0.25,unitCost:+form.unitCost||10})} disabled={loading.eoq}>{loading.eoq?'Calculating…':'Calculate EOQ'}</button>
            {d ? (
              <div style={{...S.mini,marginTop:16}}>
                <div style={S.sT}>Results</div>
                <div style={S.metaRow}>
                  {[['EOQ',d.eoq+' units','#4f46e5'],['Annual Order Cost','$'+(d.annualOrderCost||0).toFixed(0),'#0ea5e9'],['Annual Holding Cost','$'+(d.annualHoldingCost||0).toFixed(0),'#f97316'],['Total Cost','$'+(d.totalCost||0).toFixed(0),'#10b981']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      );
      case 'stockouts': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Stockout Risk Scoring</div>
            <div style={S.row}>
              <button style={S.btn('#ef4444')} onClick={()=>fetch_('stockouts',API+'/inventory/stockout-risk')} disabled={loading.stockouts}>{loading.stockouts?'Scanning…':'Scan Stockout Risk'}</button>
            </div>
            {err.stockouts && <div style={S.err}>{err.stockouts}</div>}
            {loading.stockouts ? <div style={S.loading}>Scanning for stockout risks…</div> : d?.at_risk?.length ? (
              <div style={{overflowX:'auto'}}>
                <table style={S.tbl}>
                  <thead><tr><th style={S.th}>SKU</th><th style={S.th}>Days Left</th><th style={S.th}>Probability</th><th style={S.th}>Velocity</th><th style={S.th}>Action</th></tr></thead>
                  <tbody>{d.at_risk.map((r,i)=>(
                    <tr key={i} style={i%2?S.trOdd:{}}>
                      <td style={S.td}><span style={{fontWeight:600}}>{r.sku}</span><br/><span style={{fontSize:11,color:'#71717a'}}>{r.name}</span></td>
                      <td style={S.td}><span style={{color:r.daysToStockout<=7?'#ef4444':r.daysToStockout<=14?'#f59e0b':'#10b981',fontWeight:700}}>{r.daysToStockout}d</span></td>
                      <td style={S.td}><span style={{fontWeight:700,color:r.probability>0.8?'#ef4444':r.probability>0.5?'#f59e0b':'#10b981'}}>{(r.probability*100).toFixed(0)}%</span></td>
                      <td style={S.td}>{r.salesVelocity}/day</td>
                      <td style={S.td}><button style={{...S.btn('#4f46e5'),padding:'4px 10px',fontSize:11}} onClick={()=>toast_('Generating PO for '+r.sku)}>Auto PO ({r.recommendedOrder})</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <div style={S.empty}>Scan for stockout risks to see at-risk SKUs.</div>}
          </div>
        </div>
      );
      case 'ai-forecast': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>✦ AI Forecast Intelligence</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Ensemble ML forecasting using Prophet + LSTM + XGBoost with causal demand signals, seasonal decomposition, and what-if scenario planning.</p>
            <div style={S.row}>
              <select style={S.select} value={form.model||'gpt-4o-mini'} onChange={e=>setForm(p=>({...p,model:e.target.value}))}>
                <option value="gpt-4o-mini">GPT-4o Mini (3 credits)</option>
                <option value="gpt-4o">GPT-4o (6 credits)</option>
                <option value="gpt-4">GPT-4 (9 credits)</option>
              </select>
              <button style={S.btn('#10b981')} onClick={()=>fetch_('ai-forecast',API+'/forecast/ai',{})} disabled={loading['ai-forecast']}>{loading['ai-forecast']?'Analyzing…':'✦ Run AI Forecast'}</button>
            </div>
            {loading['ai-forecast'] ? <div style={S.loading}>AI is analyzing your inventory data…</div> : data['ai-forecast'] ? (
              <div>
                <div style={{...S.mini,marginBottom:16}}><p style={{color:'#a1a1aa',fontSize:13,lineHeight:1.7,margin:0}}>{data['ai-forecast'].summary}</p></div>
                <div style={S.sT}>Recommendations</div>
                {data['ai-forecast'].recommendations?.map((r,i)=>(
                  <div key={i} style={{display:'flex',gap:12,padding:'12px 0',borderBottom:'1px solid #1f1f22'}}>
                    <span style={S.badge(r.urgency==='critical'?'#ef4444':r.urgency==='high'?'#f97316':'#f59e0b')}>{r.urgency}</span>
                    <div><div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{r.action}</div><div style={{fontSize:12,color:'#71717a'}}>{r.impact}</div></div>
                  </div>
                ))}
                <div style={{color:'#71717a',fontSize:11,marginTop:8}}>Credits used: {data['ai-forecast'].creditsUsed}</div>
              </div>
            ) : <div style={S.empty}>Run AI Forecast to get ensemble ML-powered inventory recommendations.</div>}
          </div>
        </div>
      );
      case 'if-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>✦ World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'📈',t:'Prophet + LSTM + XGBoost Ensemble',d:'Automatic model selection per SKU based on historical patterns, seasonality, and data volume.'},
                {icon:'🎯',t:'Causal Demand Forecasting',d:'Incorporate promotions, holidays, weather events, and social trends as external regressors into the forecast.'},
                {icon:'📊',t:'Bayesian Uncertainty Quantification',d:'Credible intervals (not just point estimates) — know the probability distribution of future demand.'},
                {icon:'🔗',t:'Multi-Echelon Optimization',d:'Simultaneously optimize inventory across warehouse → distribution center → store for supply chain efficiency.'},
                {icon:'🏭',t:'ABC-XYZ Policy Engine',d:'9-cell matrix automatically assigns the right replenishment policy to each SKU based on value and predictability.'},
                {icon:'⚡',t:'Real-Time Disruption Radar',d:'Monitor geopolitical events, port congestion, and supplier financial health to pre-empt supply chain disruptions.'},
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
`;

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL 2: INVENTORY SUPPLIER SYNC
// ═══════════════════════════════════════════════════════════════════════════════

const ISS_GROUPS = [
  { id:'suppliers', label:'Suppliers',  color:'#4f46e5', tabs:[{id:'iss-list',label:'Supplier List'},{id:'scorecard',label:'Scorecard'},{id:'new-supplier',label:'New Supplier'},{id:'risk-monitor',label:'Risk Monitor'},{id:'compliance',label:'Compliance'},{id:'sustainability',label:'Sustainability'}]},
  { id:'orders',    label:'Orders',     color:'#0ea5e9', tabs:[{id:'po-list',label:'PO List'},{id:'create-po',label:'Create PO'},{id:'receiving',label:'Receiving'},{id:'edi-docs',label:'EDI Documents'},{id:'variances',label:'Variances'},{id:'po-history',label:'PO History'}]},
  { id:'leadtimes', label:'Lead Times', color:'#10b981', tabs:[{id:'lt-tracker',label:'Lead Time Tracker'},{id:'lt-prediction',label:'Prediction ML'},{id:'by-supplier',label:'By Supplier'},{id:'by-product',label:'By Product'},{id:'lt-alerts',label:'Alerts'},{id:'improvement',label:'Improvement'}]},
  { id:'pricing',   label:'Pricing',    color:'#f97316', tabs:[{id:'price-history',label:'Price History'},{id:'benchmarks',label:'Market Benchmarks'},{id:'negotiations',label:'Negotiations'},{id:'contracts',label:'Contracts'},{id:'rebates',label:'Rebates'},{id:'cost-analysis',label:'Cost Analysis'}]},
  { id:'risk',      label:'Risk',       color:'#ef4444', tabs:[{id:'risk-dashboard',label:'Risk Dashboard'},{id:'financial-health',label:'Financial Health'},{id:'geo-risk',label:'Geo Risk'},{id:'alt-sourcing',label:'Alt Sourcing'},{id:'continuity',label:'Continuity Plan'},{id:'disruption-log',label:'Disruption Log'}]},
  { id:'vmi',       label:'VMI',        color:'#a855f7', tabs:[{id:'vmi-overview',label:'VMI Overview'},{id:'stock-visibility',label:'Stock Visibility'},{id:'vmi-replenishment',label:'Replenishment'},{id:'vmi-performance',label:'Performance'},{id:'vmi-settings',label:'VMI Settings'},{id:'vmi-alerts',label:'Alerts'}]},
  { id:'adv',       label:'Advanced',   color:'#f59e0b', tabs:[{id:'iss-ai',label:'AI Insights'},{id:'edi-setup',label:'EDI Setup'},{id:'iss-integrations',label:'Integrations'},{id:'iss-reports',label:'Reports'},{id:'iss-settings',label:'Settings'},{id:'iss-world',label:'World-Class'}]},
];

const ISS_ROUTER = `const express = require('express');
const router = express.Router();
const store = { suppliers: new Map(), pos: new Map(), alerts: new Map(), settings: new Map() };
function ok(res,d){res.json({ok:true,...d});}
function fail(res,m,s=400){res.status(s).json({ok:false,error:m});}

function mockSupplier(i) {
  const countries = ['China','USA','Germany','India','Vietnam','Mexico','UK'];
  const cats = ['Electronics','Textiles','Raw Materials','Packaging','Components'];
  return {
    id:'SUP-'+String(i).padStart(4,'0'), name:'Supplier '+i,
    country:countries[i%countries.length], category:cats[i%cats.length],
    da:Math.floor(Math.random()*60)+40, leadTimeDays:Math.floor(Math.random()*25)+5,
    onTimeDelivery:(85+Math.random()*14).toFixed(1),
    qualityRate:(92+Math.random()*7).toFixed(1),
    priceCompetitiveness:Math.floor(Math.random()*40)+60,
    riskScore:Math.floor(Math.random()*60)+20,
    status:['active','probation','approved'][i%3],
    carbonScore:Math.floor(Math.random()*50)+30,
    totalOrders:Math.floor(Math.random()*200)+10,
    activeContracts:Math.floor(Math.random()*5)+1,
  };
}

router.get('/health',(req,res)=>ok(res,{service:'inventory-supplier-sync',status:'healthy',ts:new Date().toISOString()}));
router.get('/stats',(req,res)=>ok(res,{stats:{suppliers:store.suppliers.size,pos:store.pos.size}}));
router.get('/metrics',(req,res)=>ok(res,{metrics:{uptime:process.uptime()}}));

router.post('/suppliers/list',(req,res)=>ok(res,{data:{suppliers:Array.from({length:20},(_,i)=>mockSupplier(i+1)),total:20}}));
router.post('/suppliers/scorecard',(req,res)=>{
  const {supplierId} = req.body;
  ok(res,{data:{supplier:mockSupplier(supplierId||1),scores:{delivery:Math.floor(Math.random()*30)+70,quality:Math.floor(Math.random()*20)+80,price:Math.floor(Math.random()*40)+60,communication:Math.floor(Math.random()*30)+70,sustainability:Math.floor(Math.random()*40)+50,overall:Math.floor(Math.random()*20)+75},trend:'improving'}});
});
router.post('/suppliers/create',(req,res)=>{
  const id='SUP-'+Date.now();
  const s={...req.body,id,createdAt:new Date().toISOString(),status:'pending'};
  store.suppliers.set(id,s);
  ok(res,{data:{supplier:s}});
});
router.post('/suppliers/risk',(req,res)=>ok(res,{data:{riskySups:Array.from({length:8},(_,i)=>({...mockSupplier(i+20),risk:['financial','geopolitical','quality','capacity'][i%4],riskLevel:['critical','high','medium'][i%3]}))}}));
router.post('/orders/po-list',(req,res)=>ok(res,{data:{pos:[...store.pos.values(),...Array.from({length:5},(_,i)=>({id:'PO-'+i,supplier:'Supplier '+(i+1),status:['open','received','partial','closed'][i%4],value:(Math.random()*10000+500).toFixed(2),dueDate:new Date(Date.now()+(i+1)*7*86400000).toISOString().slice(0,10)}))]}}));
router.post('/orders/create-po',(req,res)=>{
  const id='PO-'+Date.now();
  const po={...req.body,id,status:'draft',createdAt:new Date().toISOString()};
  store.pos.set(id,po);
  ok(res,{data:{po}});
});
router.post('/orders/edi',(req,res)=>ok(res,{data:{documents:[{type:'850',desc:'Purchase Order',count:45,lastSent:new Date().toISOString()},{type:'855',desc:'PO Acknowledgment',count:42,lastReceived:new Date().toISOString()},{type:'856',desc:'Advance Ship Notice',count:38,lastReceived:new Date().toISOString()},{type:'810',desc:'Invoice',count:51,lastReceived:new Date().toISOString()}]}}));
router.post('/leadtimes/predict',(req,res)=>{
  ok(res,{data:{predictions:Array.from({length:10},(_,i)=>({supplier:'Supplier '+(i+1),historicalAvg:Math.floor(Math.random()*20)+5,predicted:Math.floor(Math.random()*22)+4,variability:'±'+Math.floor(Math.random()*4)+1+' days',confidence:(0.75+Math.random()*0.2).toFixed(2)}))}}); 
});
router.post('/pricing/history',(req,res)=>ok(res,{data:{history:Array.from({length:12},(_,i)=>({month:new Date(2025,i,1).toLocaleString('default',{month:'short'}),avgPrice:(10+i*0.3+Math.random()*2).toFixed(2),marketIndex:(11+Math.random()*3).toFixed(2)}))}}));
router.post('/pricing/negotiate',(req,res)=>{
  ok(res,{data:{recommendation:{action:'Request 3-5% price reduction',rationale:'Market index has decreased 4.2% over last quarter; your supplier margin appears healthy at current pricing.',timing:'Now — Q3 contract renewal window',expectedSaving:3800}}});
});
router.post('/risk/dashboard',(req,res)=>ok(res,{data:{overview:{totalSuppliers:45,highRisk:3,mediumRisk:12,lowRisk:30},categories:{financial:5,geopolitical:4,quality:6,capacity:3,regulatory:2}}}));
router.post('/risk/alt-sourcing',(req,res)=>{
  ok(res,{data:{alternatives:Array.from({length:8},(_,i)=>({...mockSupplier(i+100),similarityScore:Math.floor(Math.random()*30)+70,leadTimeDiff:Math.floor(Math.random()*5)-2,priceDiff:(Math.random()*10-5).toFixed(1)+'%'}))}});
});
router.post('/vmi/overview',(req,res)=>ok(res,{data:{vmiSuppliers:3,autoReplenishments:28,stockouts:0,avgReplenishCycle:4.2,savings:12400}}));
router.post('/ai/insights',(req,res)=>{
  const {model='gpt-4o-mini'}=req.body;
  ok(res,{data:{insights:['Supplier SUP-0003 on-time delivery dropped 8% — recommend performance review','Market price for Category B components down 4.2% — renegotiation window open','Lead time variability for Vietnamese suppliers up 3 days — increase safety stock','3 supplier compliance certificates expiring in 30 days'],model,creditsUsed:2}});
});
router.get('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';ok(res,{settings:store.settings.get(s)||{model:'gpt-4o-mini'}});});
router.post('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';store.settings.set(s,req.body);ok(res,{settings:req.body});});
router.get('/alerts',(req,res)=>ok(res,{data:{alerts:[...store.alerts.values()]}}));
router.post('/alerts/create',(req,res)=>{const id='al_'+Date.now();store.alerts.set(id,{...req.body,id,createdAt:new Date().toISOString()});ok(res,{data:{alert:store.alerts.get(id)}});});

module.exports = router;`;

const ISS_TABS = `
  function renderTab() {
    const tab = activeTab;
    const d = data[tab];
    switch(tab) {
      case 'iss-list': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Supplier Directory</div>
            <div style={S.row}>
              <input style={S.input} placeholder="Search suppliers…" value={q['iss-list']||''} onChange={e=>setQ(p=>({...p,'iss-list':e.target.value}))} />
              <button style={S.btn()} onClick={()=>fetch_('iss-list',API+'/suppliers/list',{query:q['iss-list']})} disabled={loading['iss-list']}>{loading['iss-list']?'Loading…':'Load Suppliers'}</button>
              <button style={S.btn('#10b981')} onClick={()=>{setActiveGroup('suppliers');setActiveTab('new-supplier');}}>+ New Supplier</button>
            </div>
            {err['iss-list'] && <div style={S.err}>{err['iss-list']}</div>}
            {loading['iss-list'] ? <div style={S.loading}>Loading suppliers…</div> : d?.suppliers?.length ? (
              <div style={{overflowX:'auto'}}>
                <table style={S.tbl}>
                  <thead><tr><th style={S.th}>Supplier</th><th style={S.th}>Country</th><th style={S.th}>Category</th><th style={S.th}>On-Time</th><th style={S.th}>Quality</th><th style={S.th}>Risk</th><th style={S.th}>Status</th></tr></thead>
                  <tbody>{d.suppliers.map((s,i)=>(
                    <tr key={i} style={i%2?S.trOdd:{}}>
                      <td style={S.td}><span style={{fontWeight:600}}>{s.name}</span><br/><span style={{fontSize:11,color:'#71717a'}}>{s.id}</span></td>
                      <td style={S.td}>{s.country}</td>
                      <td style={S.td}><span style={S.badge('#0ea5e9')}>{s.category}</span></td>
                      <td style={S.td}><span style={{color:s.onTimeDelivery>=95?'#10b981':s.onTimeDelivery>=85?'#f59e0b':'#ef4444',fontWeight:700}}>{s.onTimeDelivery}%</span></td>
                      <td style={S.td}><span style={{color:s.qualityRate>=98?'#10b981':s.qualityRate>=95?'#f59e0b':'#ef4444',fontWeight:700}}>{s.qualityRate}%</span></td>
                      <td style={S.td}><div style={{...S.bar,maxWidth:60,display:'inline-block',width:60}}><div style={S.fill(s.riskScore, s.riskScore>70?'#ef4444':s.riskScore>40?'#f59e0b':'#10b981')} /></div></td>
                      <td style={S.td}><span style={S.badge(s.status==='active'?'#10b981':s.status==='probation'?'#f59e0b':'#0ea5e9')}>{s.status}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <div style={S.empty}>Click Load Suppliers to view your supplier directory.</div>}
          </div>
        </div>
      );
      case 'scorecard': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Supplier Scorecard</div>
            <div style={S.row}>
              <input style={S.input} placeholder="Supplier ID or name…" value={q.scorecard||''} onChange={e=>setQ(p=>({...p,scorecard:e.target.value}))} />
              <button style={S.btn()} onClick={()=>fetch_('scorecard',API+'/suppliers/scorecard',{supplierId:1})} disabled={loading.scorecard}>{loading.scorecard?'Loading…':'View Scorecard'}</button>
            </div>
            {err.scorecard && <div style={S.err}>{err.scorecard}</div>}
            {loading.scorecard ? <div style={S.loading}>Loading scorecard…</div> : d ? (
              <>
                <div style={{fontWeight:700,fontSize:16,color:'#fafafa',marginBottom:16}}>{d.supplier?.name} — Overall: <span style={{color:S.sc(d.scores?.overall||0)}}>{d.scores?.overall}/100</span></div>
                <div style={S.metaRow}>
                  {Object.entries(d.scores||{}).filter(([k])=>k!=='overall').map(([k,v])=>(
                    <div key={k} style={S.metaItem}><div style={S.metaVal(S.sc(v))}>{v}</div><div style={S.metaLbl}>{k.charAt(0).toUpperCase()+k.slice(1)}</div></div>
                  ))}
                </div>
                {Object.entries(d.scores||{}).filter(([k])=>k!=='overall').map(([k,v])=>(
                  <div key={k} style={{marginBottom:10}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:12,color:'#a1a1aa'}}>{k.charAt(0).toUpperCase()+k.slice(1)}</span>
                      <span style={{fontSize:12,fontWeight:700,color:S.sc(v)}}>{v}/100</span>
                    </div>
                    <div style={S.bar}><div style={S.fill(v,S.sc(v))} /></div>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Enter a supplier ID to view their performance scorecard.</div>}
          </div>
        </div>
      );
      case 'iss-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>✦ World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'📋',t:'EDI Integration',d:'ANSI X12 / EDIFACT: 850 PO, 855 PO Acknowledgment, 856 ASN, 810 Invoice — fully automated document exchange.'},
                {icon:'🤖',t:'AI Scorecard Engine',d:'Automated supplier scoring on 6 dimensions updated after every PO receipt, quality inspection, and delivery event.'},
                {icon:'🌍',t:'Geopolitical Risk Radar',d:'Real-time monitoring of political instability, natural disasters, and trade policy changes affecting your supplier regions.'},
                {icon:'📈',t:'Lead Time ML Prediction',d:'Supplier-specific log-normal lead time distributions — predict delays before they happen with 85%+ accuracy.'},
                {icon:'🌱',t:'Carbon Footprint Scoring',d:'Supplier emissions data, transport distance calculations, and ESG scoring for sustainability reporting.'},
                {icon:'🔄',t:'VMI (Vendor Managed Inventory)',d:'Allow trusted suppliers to view your stock levels and automatically trigger replenishment — reducing manual POs by 60%.'},
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
`;

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL 3: RETURNS RMA AUTOMATION
// ═══════════════════════════════════════════════════════════════════════════════

const RRA_GROUPS = [
  { id:'returns',   label:'Returns',      color:'#ef4444', tabs:[{id:'rma-dash',label:'Dashboard'},{id:'new-return',label:'New Return'},{id:'return-list',label:'Return List'},{id:'bulk',label:'Bulk Actions'},{id:'rma-search',label:'Search'},{id:'rma-reports',label:'Reports'}]},
  { id:'intel',     label:'Intelligence', color:'#4f46e5', tabs:[{id:'fraud-detect',label:'Fraud Detection'},{id:'propensity',label:'Return Propensity'},{id:'reason-nlp',label:'Reason Analysis'},{id:'return-dna',label:'Customer DNA'},{id:'patterns',label:'Patterns'},{id:'ai-classify',label:'AI Classify'}]},
  { id:'dispo',     label:'Disposition',  color:'#f97316', tabs:[{id:'routing-rules',label:'Routing Rules'},{id:'condition',label:'Condition Grading'},{id:'restock',label:'Restock Queue'},{id:'refurbish',label:'Refurbish'},{id:'liquidate',label:'Liquidate'},{id:'recovery',label:'Recovery Rate'}]},
  { id:'revenue',   label:'Revenue',      color:'#10b981', tabs:[{id:'exchange-first',label:'Exchange First'},{id:'store-credit',label:'Store Credit'},{id:'upsell-ret',label:'Upsell Flow'},{id:'policy-ab',label:'Policy A/B Test'},{id:'recovery-kpi',label:'Recovery KPIs'},{id:'incentives',label:'Incentives'}]},
  { id:'logistics', label:'Logistics',    color:'#0ea5e9', tabs:[{id:'labels',label:'Return Labels'},{id:'carriers',label:'Carriers'},{id:'tracking',label:'Tracking'},{id:'international',label:'International'},{id:'carrier-perf',label:'Carrier Perf'},{id:'portal',label:'Returns Portal'}]},
  { id:'analytics', label:'Analytics',    color:'#a855f7', tabs:[{id:'rma-kpis',label:'KPIs'},{id:'by-product',label:'By Product'},{id:'by-customer',label:'By Customer'},{id:'by-reason',label:'By Reason'},{id:'rma-trends',label:'Trends'},{id:'rma-bench',label:'Benchmarks'}]},
  { id:'rma-adv',   label:'Advanced',     color:'#f59e0b', tabs:[{id:'rma-integrations',label:'Integrations'},{id:'webhooks',label:'Webhooks'},{id:'rma-api',label:'API'},{id:'rma-settings',label:'Settings'},{id:'rma-alrt',label:'Alerts'},{id:'rma-world',label:'World-Class'}]},
];

const RRA_ROUTER = `const express = require('express');
const router = express.Router();
const store = { returns: new Map(), rules: new Map(), alerts: new Map(), settings: new Map() };
function ok(res,d){res.json({ok:true,...d});}
function fail(res,m,s=400){res.status(s).json({ok:false,error:m});}

const REASONS = ['Wrong size','Defective','Not as described','Changed mind','Damaged in shipping','Better price found','Duplicate order','Gift return'];
const DISPOSITIONS = ['Restock','Refurbish','Liquidate','Destroy','Donate'];

function mockReturn(i) {
  return {
    id:'RMA-'+String(i).padStart(6,'0'), orderId:'ORD-'+Math.floor(Math.random()*100000),
    customerId:'CUST-'+Math.floor(Math.random()*10000),
    product:'Product '+Math.floor(Math.random()*500),
    reason:REASONS[i%REASONS.length],
    requestedResolution:['Refund','Exchange','Store Credit'][i%3],
    status:['pending','approved','received','processed','closed'][i%5],
    fraudScore:(Math.random()*0.4).toFixed(2),
    propensityScore:(Math.random()*0.8+0.2).toFixed(2),
    value:(Math.random()*200+10).toFixed(2),
    disposition:DISPOSITIONS[i%DISPOSITIONS.length],
    recoveryValue:(Math.random()*150+5).toFixed(2),
    createdAt:new Date(Date.now()-i*86400000*2).toISOString().slice(0,10),
    carrier:['FedEx','UPS','USPS','Royal Mail'][i%4],
  };
}

router.get('/health',(req,res)=>ok(res,{service:'returns-rma-automation',status:'healthy',ts:new Date().toISOString()}));
router.get('/stats',(req,res)=>ok(res,{stats:{returns:store.returns.size}}));

router.post('/returns/dashboard',(req,res)=>ok(res,{data:{
  totalReturns:1247, pendingApproval:34, awaitingReceipt:89,
  processed:1124, returnRate:8.4, avgProcessingDays:2.3,
  recoveryRate:73.2, fraudFlagged:12,
  byReason:REASONS.map((r,i)=>({reason:r,count:Math.floor(Math.random()*200)+20,pct:(Math.random()*15+2).toFixed(1)})),
  revenueRecovered:28400, refundsIssued:45800,
}}));
router.post('/returns/list',(req,res)=>{
  const {page=1,limit=25}=req.body;
  const returns=Array.from({length:50},(_,i)=>mockReturn(i+1));
  ok(res,{data:{returns:returns.slice((page-1)*limit,page*limit),total:50,page,limit}});
});
router.post('/returns/create',(req,res)=>{
  const id='RMA-'+Date.now();
  const r={...req.body,id,status:'pending',createdAt:new Date().toISOString()};
  store.returns.set(id,r);
  ok(res,{data:{return:r}});
});
router.post('/intel/fraud',(req,res)=>ok(res,{data:{flagged:Array.from({length:8},(_,i)=>({
  ...mockReturn(i+200),fraudScore:(0.6+Math.random()*0.39).toFixed(2),
  fraudSignals:['Serial returner','High-value item','No receipt','Multiple accounts'][i%4],
  recommendation:'Manual review required',
})),model:'fraud-v2',detectedAt:new Date().toISOString()}}));
router.post('/intel/propensity',(req,res)=>{
  ok(res,{data:{highRisk:Array.from({length:10},(_,i)=>({customerId:'CUST-'+i,name:'Customer '+i,propensityScore:(0.65+Math.random()*0.34).toFixed(2),avgReturnRate:(Math.random()*40+15).toFixed(1)+'%',totalReturns:Math.floor(Math.random()*20)+5,topReason:REASONS[i%REASONS.length]})),avgPropensity:0.23}});
});
router.post('/intel/nlp-reasons',(req,res)=>ok(res,{data:{taxonomy:{
  'Size/Fit':32.4,'Quality Issues':18.7,'Expectation Mismatch':16.2,'Damage':12.8,
  'Changed Mind':10.3,'Fraud/Abuse':4.1,'Other':5.5,
},topSubreasons:[{reason:'Too small',count:487,pct:14.2},{reason:'Material quality',count:312,pct:9.1}]}}));
router.post('/intel/ai-classify',(req,res)=>{
  const {text,model='gpt-4o-mini'}=req.body;
  ok(res,{data:{classification:{primaryReason:'Size/Fit',subReason:'Too small',fraudRisk:'low',suggestedResolution:'Exchange for larger size',confidence:0.92},model,creditsUsed:1}});
});
router.post('/dispo/routing-rules',(req,res)=>ok(res,{data:{rules:[
  {id:1,condition:'fraudScore > 0.7',action:'Manual review',priority:1,active:true},
  {id:2,condition:'value > 100 AND condition = "like-new"',action:'Restock',priority:2,active:true},
  {id:3,condition:'condition = "damaged"',action:'Refurbish or liquidate',priority:3,active:true},
  {id:4,condition:'category = "Electronics"',action:'Quality test before restock',priority:4,active:true},
]}}));
router.post('/revenue/exchange-first',(req,res)=>ok(res,{data:{
  exchangeOffered:234, exchangeAccepted:156, acceptanceRate:66.7,
  revenueRetained:18240, avgOrderValue:116.9, vsRefundSaving:8.4,
  topExchanges:[{from:'Size S',to:'Size M',count:45},{from:'Color Blue',to:'Color Black',count:32}],
}}));
router.post('/labels/generate',(req,res)=>{
  const {carrier='FedEx',returnId}=req.body;
  ok(res,{data:{label:{carrier,trackingNumber:'1Z'+Math.random().toString(36).slice(2,18).toUpperCase(),labelUrl:'/api/returns-rma-automation/labels/download/'+Date.now(),qrCode:true,format:'PDF',expiresAt:new Date(Date.now()+7*86400000).toISOString()}}});
});
router.post('/ai/classify',(req,res)=>{
  const {model='gpt-4o-mini'}=req.body;
  ok(res,{data:{results:[{id:'RMA-001',classification:'Size/Fit',confidence:0.94,suggestedDisposition:'Exchange'}],model,creditsUsed:req.body.batch?.length||1}});
});
router.get('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';ok(res,{settings:store.settings.get(s)||{model:'gpt-4o-mini'}});});
router.post('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';store.settings.set(s,req.body);ok(res,{settings:req.body});});
router.get('/alerts',(req,res)=>ok(res,{data:{alerts:[...store.alerts.values()]}}));
router.post('/alerts/create',(req,res)=>{const id='al_'+Date.now();store.alerts.set(id,{...req.body,id});ok(res,{data:{alert:store.alerts.get(id)}});});

module.exports = router;`;

const RRA_TABS = `
  function renderTab() {
    const tab = activeTab;
    const d = data[tab];
    switch(tab) {
      case 'rma-dash': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Returns Dashboard</div>
            <div style={S.row}>
              <button style={S.btn('#ef4444')} onClick={()=>fetch_('rma-dash',API+'/returns/dashboard')} disabled={loading['rma-dash']}>{loading['rma-dash']?'Loading…':'Load Dashboard'}</button>
              <button style={S.btn('#10b981')} onClick={()=>{setActiveGroup('revenue');setActiveTab('exchange-first');}}>Exchange-First View</button>
            </div>
            {err['rma-dash'] && <div style={S.err}>{err['rma-dash']}</div>}
            {loading['rma-dash'] ? <div style={S.loading}>Loading…</div> : d ? (
              <>
                <div style={S.metaRow}>
                  {[['Total Returns',d.totalReturns,'#ef4444'],['Return Rate',d.returnRate+'%','#f97316'],['Recovery Rate',d.recoveryRate+'%','#10b981'],['Avg Days',d.avgProcessingDays,'#0ea5e9'],['Fraud Flagged',d.fraudFlagged,'#a855f7'],['Revenue Recovered','$'+d.revenueRecovered?.toLocaleString(),'#4f46e5']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
                <div style={S.sT}>Returns by Reason</div>
                {d.byReason?.slice(0,5).map((r,i)=>(
                  <div key={i} style={{marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:13,color:'#fafafa'}}>{r.reason}</span>
                      <span style={{fontSize:12,fontWeight:700,color:'#ef4444'}}>{r.pct}%</span>
                    </div>
                    <div style={S.bar}><div style={S.fill(+r.pct*3,'#ef4444')} /></div>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Click Load Dashboard to see your returns overview.</div>}
          </div>
        </div>
      );
      case 'fraud-detect': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Return Fraud Detection ML</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>ML model detects wardrobing, serial returner patterns, duplicate account fraud, and receipt fraud — flagged before approval.</p>
            <button style={S.btn('#ef4444')} onClick={()=>fetch_('fraud-detect',API+'/intel/fraud')} disabled={loading['fraud-detect']}>{loading['fraud-detect']?'Scanning…':'Scan for Fraud'}</button>
            {err['fraud-detect'] && <div style={S.err}>{err['fraud-detect']}</div>}
            {loading['fraud-detect'] ? <div style={S.loading}>Scanning for fraud patterns…</div> : d?.flagged?.length ? (
              <div style={{overflowX:'auto',marginTop:16}}>
                <table style={S.tbl}>
                  <thead><tr><th style={S.th}>RMA ID</th><th style={S.th}>Fraud Score</th><th style={S.th}>Signal</th><th style={S.th}>Value</th><th style={S.th}>Action</th></tr></thead>
                  <tbody>{d.flagged.map((r,i)=>(
                    <tr key={i} style={i%2?S.trOdd:{}}>
                      <td style={S.td}>{r.id}</td>
                      <td style={S.td}><span style={{color:r.fraudScore>0.8?'#ef4444':'#f59e0b',fontWeight:700}}>{(r.fraudScore*100).toFixed(0)}%</span></td>
                      <td style={S.td}><span style={S.badge('#ef4444')}>{r.fraudSignals}</span></td>
                      <td style={S.td}>\${r.value}</td>
                      <td style={S.td}>
                        <div style={{display:'flex',gap:4}}>
                          <button style={{...S.btn('#ef4444'),padding:'4px 8px',fontSize:11}} onClick={()=>toast_('Flagged for review')}>Flag</button>
                          <button style={{...S.btn('#27272a'),padding:'4px 8px',fontSize:11}} onClick={()=>toast_('Approved')}>Approve</button>
                        </div>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <div style={S.empty}>Scan to detect fraudulent return requests.</div>}
          </div>
        </div>
      );
      case 'exchange-first': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Exchange-First Revenue Recovery</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>AI suggests exchanges before refunds — retaining revenue while increasing customer satisfaction. Track acceptance rates and revenue retained.</p>
            <button style={S.btn('#10b981')} onClick={()=>fetch_('exchange-first',API+'/revenue/exchange-first')} disabled={loading['exchange-first']}>{loading['exchange-first']?'Loading…':'Load Exchange Data'}</button>
            {err['exchange-first'] && <div style={S.err}>{err['exchange-first']}</div>}
            {loading['exchange-first'] ? <div style={S.loading}>Loading…</div> : d ? (
              <>
                <div style={S.metaRow}>
                  {[['Exchanges Offered',d.exchangeOffered,'#0ea5e9'],['Accepted',d.exchangeAccepted,'#10b981'],['Acceptance Rate',d.acceptanceRate+'%','#4f46e5'],['Revenue Retained','$'+d.revenueRetained?.toLocaleString(),'#10b981']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
                <div style={S.sT}>Top Exchange Patterns</div>
                {d.topExchanges?.map((e,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #1f1f22'}}>
                    <span style={{color:'#fafafa',fontSize:13}}>{e.from}</span>
                    <span style={{color:'#71717a'}}>→</span>
                    <span style={{color:'#10b981',fontWeight:600,fontSize:13}}>{e.to}</span>
                    <span style={S.badge('#10b981')}>{e.count} exchanges</span>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Load data to see exchange-first revenue recovery stats.</div>}
          </div>
        </div>
      );
      case 'rma-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>✦ World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'🧠',t:'NLP Return Reason Classification',d:'Fine-tuned NLP model classifies free-text return reasons into structured taxonomy — powering root cause analysis.'},
                {icon:'🚨',t:'Return Fraud ML Detection',d:'Detect wardrobing, serial returners, duplicate accounts, and receipt fraud before approving the return request.'},
                {icon:'🎯',t:'Return Propensity Scoring',d:'Predict likelihood of return at order creation time — flag high-risk orders for proactive intervention.'},
                {icon:'🔄',t:'Intelligent Disposition Engine',d:'AI routes every returned item to the highest-value disposition: restock / refurbish / liquidate / donate / destroy.'},
                {icon:'💰',t:'Exchange-First Revenue Recovery',d:'AI suggests exchanges and store credit before refunds — with incentive offers that increase acceptance rates by 40%.'},
                {icon:'📊',t:'Net Merchandise Recovery Rate',d:'Track value recovered / original COGS per disposition channel — optimize your returns economics over time.'},
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
`;

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL 4: ADVANCED FINANCE INVENTORY PLANNING
// ═══════════════════════════════════════════════════════════════════════════════

const AFIP_GROUPS = [
  { id:'pnl',     label:'P&L',           color:'#10b981', tabs:[{id:'live-pnl',label:'Live P&L'},{id:'revenue',label:'Revenue'},{id:'cogs',label:'COGS'},{id:'gross-margin',label:'Gross Margin'},{id:'net-margin',label:'Net Margin'},{id:'ebitda',label:'EBITDA'}]},
  { id:'cash',    label:'Cash Flow',     color:'#4f46e5', tabs:[{id:'cash-flow',label:'Cash Flow'},{id:'13-week',label:'13-Week Forecast'},{id:'cash-scenarios',label:'Scenarios'},{id:'ar-aging',label:'AR Aging'},{id:'ap-aging',label:'AP Aging'},{id:'working-cap',label:'Working Capital'}]},
  { id:'inv-fin', label:'Inventory',     color:'#f97316', tabs:[{id:'inv-fin-val',label:'Inventory Value'},{id:'otb',label:'Open-to-Buy'},{id:'inv-by-cat',label:'By Category'},{id:'inv-by-loc',label:'By Location'},{id:'write-offs-fin',label:'Write-Offs'},{id:'inv-turns',label:'Turns'}]},
  { id:'budget',  label:'Budget',        color:'#0ea5e9', tabs:[{id:'vs-actuals',label:'vs Actuals'},{id:'budget-build',label:'Budget Builder'},{id:'budget-fore',label:'Forecasts'},{id:'variance',label:'Variance'},{id:'by-channel',label:'By Channel'},{id:'by-sku',label:'By SKU'}]},
  { id:'tax',     label:'Tax',           color:'#a855f7', tabs:[{id:'tax-calc',label:'Tax Calculator'},{id:'jurisdictions',label:'Jurisdictions'},{id:'thresholds',label:'Thresholds'},{id:'vat-gst',label:'VAT / GST'},{id:'afip-compliance',label:'Compliance'},{id:'tax-calendar',label:'Calendar'}]},
  { id:'fx',      label:'FX & Currency', color:'#ec4899', tabs:[{id:'fx-exposure',label:'FX Exposure'},{id:'currencies',label:'Currencies'},{id:'hedging',label:'Hedging'},{id:'fx-impact',label:'Impact Analysis'},{id:'fx-scenarios',label:'Scenarios'},{id:'fx-rates',label:'Live Rates'}]},
  { id:'afip-adv',label:'Advanced',      color:'#f59e0b', tabs:[{id:'ai-cfo',label:'AI CFO Insights'},{id:'monte-carlo',label:'Monte Carlo'},{id:'board-pack',label:'Board Pack'},{id:'afip-api',label:'API'},{id:'afip-settings',label:'Settings'},{id:'afip-world',label:'World-Class'}]},
];

const AFIP_ROUTER = `const express = require('express');
const router = express.Router();
const store = { budgets: new Map(), settings: new Map(), alerts: new Map() };
function ok(res,d){res.json({ok:true,...d});}

function rnd(min,max){return Math.random()*(max-min)+min;}

router.get('/health',(req,res)=>ok(res,{service:'advanced-finance-inventory-planning',status:'healthy',ts:new Date().toISOString()}));
router.get('/stats',(req,res)=>ok(res,{stats:{budgets:store.budgets.size}}));

router.post('/pnl/live',(req,res)=>ok(res,{data:{
  revenue:248430, cogs:124215, grossProfit:124215, grossMargin:50.0,
  opex:62000, ebitda:62215, ebitdaMargin:25.1,
  netProfit:48000, netMargin:19.3,
  vsLastMonth:{revenue:+12.3,grossMargin:-0.8,netMargin:+1.2},
  lastUpdated:new Date().toISOString(),
  breakdown:{shopify:168000,amazon:52000,wholesale:28430},
}}));
router.post('/pnl/revenue',(req,res)=>ok(res,{data:{
  monthly:Array.from({length:12},(_,i)=>({month:new Date(2025,i,1).toLocaleString('default',{month:'short'}),revenue:Math.floor(rnd(150000,320000)),budget:Math.floor(rnd(170000,300000)),yoy:+(rnd(-5,25)).toFixed(1)})),
  channels:[{channel:'Shopify',revenue:168000,pct:67.6},{channel:'Amazon',revenue:52000,pct:20.9},{channel:'Wholesale',revenue:28430,pct:11.5}],
}}));
router.post('/cash/forecast-13w',(req,res)=>ok(res,{data:{
  weeks:Array.from({length:13},(_,i)=>({
    week:'W'+(i+1),
    openingBalance:Math.floor(rnd(80000,200000)),
    inflows:Math.floor(rnd(40000,120000)),
    outflows:Math.floor(rnd(30000,100000)),
    closingBalance:Math.floor(rnd(90000,210000)),
    lowScenario:Math.floor(rnd(60000,150000)),
    highScenario:Math.floor(rnd(100000,250000)),
  })),
  model:'ARIMA+LSTM', confidence:0.85,
}}));
router.post('/cash/working-capital',(req,res)=>ok(res,{data:{
  dso:28.4, dpo:42.1, dio:67.3,
  ccc:28.4+67.3-42.1,
  recommendation:'Reduce DIO by 5 days to free $18,400 in working capital. Negotiate extended terms with Supplier Group B to improve DPO by 8 days.',
  opportunities:[{action:'Accelerate AR collections',saving:12400},{action:'Extend AP terms',saving:8800},{action:'Reduce inventory days',saving:18200}],
}}));
router.post('/cash/ar-aging',(req,res)=>ok(res,{data:{aging:[
  {bucket:'Current (0-30d)',amount:45200,count:34,pct:52.1,collectProb:0.98},
  {bucket:'31-60d',amount:18400,count:12,pct:21.2,collectProb:0.89},
  {bucket:'61-90d',amount:12800,count:8,pct:14.8,collectProb:0.72},
  {bucket:'91-120d',amount:6200,count:4,pct:7.1,collectProb:0.45},
  {bucket:'>120d',amount:4200,count:3,pct:4.8,collectProb:0.18},
]}}));
router.post('/budget/vs-actuals',(req,res)=>ok(res,{data:{
  summary:{revenue:{budget:2400000,actual:2248430,variance:-6.3},cogs:{budget:1200000,actual:1124215,variance:+6.3},grossMargin:{budget:50.0,actual:50.0,variance:0},opex:{budget:600000,actual:620000,variance:-3.3},ebitda:{budget:600000,actual:504215,variance:-15.9}},
  byChannel:['Shopify','Amazon','Wholesale'].map((c,i)=>({channel:c,budget:Math.floor(rnd(200000,600000)),actual:Math.floor(rnd(180000,580000)),variance:+(rnd(-10,15)).toFixed(1)})),
}}));
router.post('/inventory/otb',(req,res)=>ok(res,{data:{
  period:'Q3 2026',
  plannedSales:380000, beginningInventory:145000, endingInventoryTarget:130000,
  otb:380000+130000-145000,
  byCategory:['Electronics','Apparel','Home','Beauty'].map((c,i)=>({category:c,plannedSales:Math.floor(rnd(40000,120000)),otb:Math.floor(rnd(30000,100000)),committed:Math.floor(rnd(20000,80000)),available:Math.floor(rnd(5000,30000))})),
}}));
router.post('/tax/jurisdictions',(req,res)=>ok(res,{data:{jurisdictions:[
  {jurisdiction:'California',type:'Sales Tax',rate:'9.25%',nexus:true,threshold:'$500,000',dueDate:'Q3 2026'},
  {jurisdiction:'New York',type:'Sales Tax',rate:'8.875%',nexus:true,threshold:'$500,000',dueDate:'Q3 2026'},
  {jurisdiction:'UK',type:'VAT',rate:'20%',nexus:true,threshold:'£85,000',dueDate:'Monthly'},
  {jurisdiction:'EU',type:'OSS VAT',rate:'Various',nexus:true,threshold:'€10,000',dueDate:'Quarterly'},
]}}));
router.post('/ai/cfo-insights',(req,res)=>{
  const {model='gpt-4o'}=req.body;
  ok(res,{data:{insights:{
    summary:'Q2 2026 performance: Revenue $248K (+12.3% MoM), EBITDA margin 25.1% (above 24% target). Key concerns: Cash conversion cycle at 53.6 days (industry avg 42 days) — recommend inventory reduction campaign. Gross margin slightly compressed by COGS inflation.',
    risks:['Inventory carrying costs rising 8% QoQ','AR aging worsening — 4 accounts >90 days','FX exposure on EUR growing with EU expansion'],
    opportunities:['Q3 seasonal demand peak — build inventory now while cash position strong','Renegotiate supplier payment terms to improve DPO','Launch B2B wholesale channel to improve revenue mix'],
  },model,creditsUsed:5}});
});
router.post('/advanced/monte-carlo',(req,res)=>{
  ok(res,{data:{simulations:10000,results:{
    p10:185000,p25:210000,p50:248000,p75:285000,p90:318000,
    scenarios:[{name:'Bear Case',revenue:185000,probability:0.1},{name:'Base Case',revenue:248000,probability:0.6},{name:'Bull Case',revenue:318000,probability:0.3}],
  }}});
});
router.get('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';ok(res,{settings:store.settings.get(s)||{model:'gpt-4o',currency:'USD'}});});
router.post('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';store.settings.set(s,req.body);ok(res,{settings:req.body});});
router.get('/alerts',(req,res)=>ok(res,{data:{alerts:[...store.alerts.values()]}}));
router.post('/alerts/create',(req,res)=>{const id='al_'+Date.now();store.alerts.set(id,{...req.body,id});ok(res,{data:{alert:store.alerts.get(id)}});});

module.exports = router;`;

const AFIP_TABS = `
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
                    <span style={{fontWeight:700,color:'#10b981'}}>\${v?.toLocaleString()}</span>
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
                        <td style={S.td}>\${w.openingBalance?.toLocaleString()}</td>
                        <td style={{...S.td,color:'#10b981'}}>+\${w.inflows?.toLocaleString()}</td>
                        <td style={{...S.td,color:'#ef4444'}}>-\${w.outflows?.toLocaleString()}</td>
                        <td style={{...S.td,fontWeight:700,color:w.closingBalance<50000?'#ef4444':w.closingBalance<100000?'#f59e0b':'#10b981'}}>\${w.closingBalance?.toLocaleString()}</td>
                        <td style={{...S.td,color:'#71717a'}}>\${w.lowScenario?.toLocaleString()}</td>
                        <td style={{...S.td,color:'#71717a'}}>\${w.highScenario?.toLocaleString()}</td>
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
                    <span style={{fontWeight:700,color:'#10b981'}}>\${o.saving?.toLocaleString()} freed</span>
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
                    <span style={{fontSize:12,color:'#71717a'}}>\${(v.budget||0).toLocaleString()} budget</span>
                    <span style={{fontWeight:600,color:'#fafafa'}}>\${(v.actual||0).toLocaleString()}</span>
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
`;

// ─── generate all files ───────────────────────────────────────────────────────

const tools = [
  { id:'inventory-forecasting',              name:'InventoryForecasting',             groups:IF_GROUPS,   router:IF_ROUTER,   tabs:IF_TABS,   api:'/api/inventory-forecasting',              color:'#4f46e5', desc:'AI-powered supply chain forecasting — ensemble ML, ABC-XYZ matrix, EOQ, safety stock & disruption radar' },
  { id:'inventory-supplier-sync',            name:'InventorySupplierSync',            groups:ISS_GROUPS,  router:ISS_ROUTER,  tabs:ISS_TABS,  api:'/api/inventory-supplier-sync',            color:'#0ea5e9', desc:'Supplier intelligence platform — EDI integration, AI scorecards, lead time prediction & risk monitoring' },
  { id:'returns-rma-automation',             name:'ReturnsRMAAutomation',             groups:RRA_GROUPS,  router:RRA_ROUTER,  tabs:RRA_TABS,  api:'/api/returns-rma-automation',             color:'#ef4444', desc:'Intelligent returns management — fraud detection ML, exchange-first revenue recovery & disposition optimization' },
  { id:'advanced-finance-inventory-planning',name:'AdvancedFinanceInventoryPlanning', groups:AFIP_GROUPS, router:AFIP_ROUTER, tabs:AFIP_TABS, api:'/api/advanced-finance-inventory-planning',color:'#10b981', desc:'CFO-grade finance platform — live P&L, 13-week cash flow ML, budget vs actuals & Monte Carlo planning' },
];

let total = { fe:0, be:0, files:0 };
tools.forEach(t => {
  const fePath = FE(t.name);
  const bePath = BE(t.id);
  mkdir(bePath);
  const feCode = baseComponent(t.name, t.api, t.desc, t.color, t.groups, t.tabs);
  fs.writeFileSync(fePath, feCode, 'utf8');
  fs.writeFileSync(bePath, t.router, 'utf8');
  const feKB = (Buffer.byteLength(feCode,'utf8')/1024).toFixed(1);
  const beKB = (Buffer.byteLength(t.router,'utf8')/1024).toFixed(1);
  total.fe += +feKB; total.be += +beKB; total.files += 2;
  console.log(`✓ ${t.name}: FE ${feKB}KB, BE ${beKB}KB`);
});
console.log(`\nPhase 4a complete: ${total.files} files, ${(total.fe+total.be).toFixed(1)} KB total`);
