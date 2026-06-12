const express = require('express');
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

module.exports = router;