const express = require('express');
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

module.exports = router;