const express = require('express');
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

module.exports = router;