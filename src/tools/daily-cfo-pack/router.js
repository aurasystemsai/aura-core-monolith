const express = require('express');
const router = express.Router();
const store = { kpis: new Map(), settings: new Map() };
function ok(res,d){res.json({ok:true,...d});}
function rnd(a,b){return Math.random()*(b-a)+a;}

router.get('/health',(req,res)=>ok(res,{service:'daily-cfo-pack',status:'healthy',ts:new Date().toISOString()}));
router.get('/stats',(req,res)=>ok(res,{stats:{kpis:store.kpis.size}}));

router.post('/briefing/morning',(req,res)=>{
  ok(res,{data:{
    date:new Date().toISOString().slice(0,10),
    headline:'Revenue up 8.3% vs plan. Margin compression detected — COGS up 2.1%.',
    kpis:[{name:'Revenue',value:'$18,420',vsTarget:'+3.2%',vsPrior:'+8.3%'},{name:'Orders',value:'142',vsTarget:'+1.4%',vsPrior:'+12.1%'},{name:'AOV',value:'$129.7',vsTarget:'+1.8%',vsPrior:'-3.4%'},{name:'Gross Margin',value:'49.8%',vsTarget:'-0.2pp',vsPrior:'-1.1pp'}],
    topRisks:['Gross margin compression from COGS inflation — investigate SKU-level impact','3 AR invoices >60 days overdue ($8,400)','Shopify payout variance of $240 unreconciled'],
    opportunities:['Q3 seasonal demand starting — build inventory on top 20 SKUs now','Meta ads ROAS improving — consider 20% budget increase','New B2B inquiry from wholesaler — $40K potential order'],
    aiGenerated:true,
  }});
});
router.post('/briefing/yesterday',(req,res)=>ok(res,{data:{
  date:new Date(Date.now()-86400000).toISOString().slice(0,10),
  metrics:[
    {metric:'Revenue',value:18420,budget:17840,prior:17010,vsBudget:'+3.2%',vsPrior:'+8.3%'},
    {metric:'Orders',value:142,budget:140,prior:127,vsBudget:'+1.4%',vsPrior:'+11.8%'},
    {metric:'AOV',value:129.7,budget:127.4,prior:134.0,vsBudget:'+1.8%',vsPrior:'-3.2%'},
    {metric:'Returns',value:11,budget:14,prior:10,vsBudget:'-21.4%',vsPrior:'+10%'},
  ],
}}));
router.post('/revenue/dashboard',(req,res)=>ok(res,{data:{
  mtd:248430, mtdBudget:240000, mtdPrior:221800,
  weekly:Array.from({length:12},(_,i)=>({week:'W'+(i+1),revenue:Math.floor(rnd(40000,80000)),budget:Math.floor(rnd(42000,75000))})),
  channels:[{name:'Shopify D2C',revenue:168000,pct:67.6,trend:'+12%'},{name:'Amazon',revenue:52000,pct:20.9,trend:'+4%'},{name:'Wholesale',revenue:28430,pct:11.5,trend:'+28%'}],
}}));
router.post('/margins/gp',(req,res)=>ok(res,{data:{
  current:49.8, target:51.0, priorMonth:50.9, priorYear:48.2,
  trend:Array.from({length:12},(_,i)=>({month:new Date(2025,i,1).toLocaleString('default',{month:'short'}),margin:(48+rnd(0,4)).toFixed(1)})),
  byCategory:[{category:'Electronics',margin:42.1},{category:'Apparel',margin:58.4},{category:'Home',margin:52.0},{category:'Beauty',margin:64.2}],
  erosionAlerts:[{sku:'SKU-004281',margin:21.4,vs30d:24.8,alert:'Margin compressed 3.4pp — COGS up 12%'}],
}}));
router.post('/cashflow/position',(req,res)=>ok(res,{data:{
  cash:186400,runway:8.2,burnRate:22800,
  accounts:[{name:'Main Operating',balance:142800},{name:'Tax Reserve',balance:28400},{name:'Payroll',balance:15200}],
  upcoming:[{type:'Payroll',amount:18400,due:'2026-06-20'},{type:'Supplier Payment',amount:24800,due:'2026-06-25'},{type:'VAT Payment',amount:4200,due:'2026-06-30'}],
}}));
router.post('/kpis/board',(req,res)=>ok(res,{data:{kpis:[
  {name:'Revenue',value:248430,target:240000,unit:'$',vsPct:+3.5,status:'on-track'},
  {name:'Gross Margin',value:49.8,target:51,unit:'%',vsPct:-2.4,status:'at-risk'},
  {name:'CAC',value:28.4,target:30,unit:'$',vsPct:+5.5,status:'on-track'},
  {name:'LTV',value:284,target:280,unit:'$',vsPct:+1.4,status:'on-track'},
  {name:'Churn Rate',value:4.2,target:5,unit:'%',vsPct:+16,status:'on-track'},
  {name:'NPS',value:62,target:60,unit:'',vsPct:+3.3,status:'on-track'},
]}}));
router.post('/intel/ai-query',(req,res)=>{
  const {query,model='gpt-4o'}=req.body;
  ok(res,{data:{query,answer:query?'Based on the last 7 days of data, '+query.toLowerCase().replace('?','').replace('what','the reason')+' was primarily driven by a 12% increase in orders from the Shopify channel, partially offset by a 3.4% decrease in AOV due to promotional discounting.':'Ask a question about your financial data.',model,creditsUsed:3}});
});
router.post('/intel/board-pack',(req,res)=>ok(res,{data:{sections:['Executive Summary','P&L vs Budget','Cash Flow Analysis','Key Metrics Scorecard','Forward Look'],generated:true,pages:12,aiNarrative:true}}));
router.post('/intel/waterfall',(req,res)=>ok(res,{data:{bridges:[
  {category:'Prior Month Revenue',value:221800,type:'base'},
  {category:'Volume Growth',value:+18200,type:'positive'},
  {category:'Price/Mix',value:-4200,type:'negative'},
  {category:'New Channels',value:+12630,type:'positive'},
  {category:'Current Month Revenue',value:248430,type:'total'},
]}}));
router.get('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';ok(res,{settings:store.settings.get(s)||{model:'gpt-4o',currency:'USD'}});});
router.post('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';store.settings.set(s,req.body);ok(res,{settings:req.body});});

module.exports = router;