const express = require('express');
const router = express.Router();
const store = { settings: new Map() };
function ok(res,d){res.json({ok:true,...d});}
function rnd(a,b){return Math.random()*(b-a)+a;}

router.get('/health',(req,res)=>ok(res,{service:'ltv-churn-predictor',status:'healthy',ts:new Date().toISOString()}));
router.get('/stats',(req,res)=>ok(res,{stats:{customersScored:8420,modelsActive:3}}));

router.post('/ltv/dashboard',(req,res)=>ok(res,{data:{
  avgLtv:284, medianLtv:142, topDecileLtv:1840, totalCustomerValue:2394480,
  ltvGrowth:+8.4, repeatRate:34.2, avgOrders:2.8,
  distribution:[{range:'$0-50',count:2140,pct:25.4},{range:'$50-200',count:3360,pct:39.9},{range:'$200-500',count:1684,pct:20.0},{range:'$500-1000',count:840,pct:9.9},{range:'$1000+',count:396,pct:4.8}],
}}));
router.post('/models/pareto-nbd',(req,res)=>ok(res,{data:{model:{
  name:'Pareto/NBD (BG/NBD variant)',
  description:'Probabilistic model for non-contractual repeat purchase behavior. Estimates individual p(alive) and expected future transactions.',
  params:{r:0.243,alpha:4.414,a:0.793,b:2.426},
  performance:{mae:0.42,rmse:0.61,mape:18.3},
  predictions:Array.from({length:10},(_,i)=>({customerId:'CUST-'+i,pAlive:(0.4+rnd(0,0.59)).toFixed(2),expectedPurchases90d:(rnd(0.1,3.5)).toFixed(1),predictedLtv:(rnd(50,2000)).toFixed(0)})),
}}}));
router.post('/models/gamma-gamma',(req,res)=>ok(res,{data:{model:{
  name:'Gamma-Gamma Spend Model',
  description:'Estimates expected average transaction value conditional on being alive. Pairs with Pareto/NBD for complete LTV prediction.',
  params:{p:6.25,q:3.74,v:15.45},
  performance:{mae:8.40,rmse:12.20,mape:14.8},
  predictions:Array.from({length:10},(_,i)=>({customerId:'CUST-'+i,expectedAvgSpend:(rnd(30,300)).toFixed(2),predictedLtv1y:(rnd(80,1800)).toFixed(0),predictedLtv3y:(rnd(200,4500)).toFixed(0)})),
}}}));
router.post('/segments/quintiles',(req,res)=>ok(res,{data:{quintiles:[
  {quintile:5,label:'Top 20%',minLtv:580,avgLtv:1240,customers:1684,revenue:2088960,revenueShare:43.6,action:'Retain at all cost — personalize experience'},
  {quintile:4,label:'Next 20%',minLtv:280,avgLtv:420,customers:1684,revenue:707280,revenueShare:14.8,action:'Upgrade to loyalty program tier'},
  {quintile:3,label:'Middle 20%',minLtv:150,avgLtv:215,customers:1684,revenue:361960,revenueShare:7.6,action:'Cross-sell to increase purchase frequency'},
  {quintile:2,label:'Lower 20%',minLtv:65,avgLtv:105,customers:1684,revenue:176820,revenueShare:3.7,action:'Email nurture to second purchase'},
  {quintile:1,label:'Bottom 20%',minLtv:0,avgLtv:28,customers:1684,revenue:47152,revenueShare:1.0,action:'Low-cost retention or accept churn'},
]}}));
router.post('/attribution/channel-ltv',(req,res)=>ok(res,{data:{channels:[
  {channel:'Organic Search',customers:2840,avgLtv:342,ltvMultiple:1.21,cac:18,paybackDays:19,returnOnCAC:18.0},
  {channel:'Email',customers:1920,avgLtv:412,ltvMultiple:1.45,cac:8,paybackDays:7,returnOnCAC:50.5},
  {channel:'Paid Social',customers:1640,avgLtv:228,ltvMultiple:0.80,cac:42,paybackDays:67,returnOnCAC:4.4},
  {channel:'Direct',customers:1280,avgLtv:398,ltvMultiple:1.40,cac:0,paybackDays:0,returnOnCAC:null},
  {channel:'Paid Search',customers:740,avgLtv:284,ltvMultiple:1.00,cac:38,paybackDays:49,returnOnCAC:6.5},
]}}));
router.post('/scenarios/builder',(req,res)=>{
  const {lever='repeat-rate',change=10}=req.body;
  const impact=lever==='repeat-rate'?change*2.8:lever==='aov'?change*1.4:change*1.2;
  ok(res,{data:{scenario:{lever,change:'+'+change+'%',impactOnLtv:'+'+impact.toFixed(1)+'%',additionalRevenue:Math.floor(2394480*impact/100),affectedCustomers:Math.floor(8420*0.6)}}});
});
router.post('/acquisition/cac-payback',(req,res)=>ok(res,{data:{payback:{
  overall:{cac:28.4,paybackDays:36,ltv:284,ltvCacRatio:10.0},
  byChannel:[{channel:'Google',cac:38,paybackDays:49,ltv:284},{channel:'Meta',cac:42,paybackDays:67,ltv:228},{channel:'Email',cac:8,paybackDays:7,ltv:412},{channel:'Organic',cac:0,paybackDays:0,ltv:342}],
}}}));
router.post('/acquisition/bidding-export',(req,res)=>ok(res,{data:{export:{segments:[{segment:'Top Quintile',customers:1684,avgLtv:1240,biddingMultiplier:4.4},{segment:'Q4',customers:1684,avgLtv:420,biddingMultiplier:1.5},{segment:'Q3',customers:1684,avgLtv:215,biddingMultiplier:0.76}],formats:['Google Customer Match','Meta Custom Audience','CSV'],generated:true}}}));
router.post('/advanced/cross-sell',(req,res)=>ok(res,{data:{recommendations:Array.from({length:10},(_,i)=>({
  customerId:'CUST-'+i,currentProducts:['Product A'],
  recommendation:'Product '+(String.fromCharCode(66+i)),
  ltvUplift:'+$'+Math.floor(rnd(20,200)),
  confidence:(0.7+rnd(0,0.28)).toFixed(2),
}))}}));
router.get('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';ok(res,{settings:store.settings.get(s)||{model:'gpt-4o-mini'}});});
router.post('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';store.settings.set(s,req.body);ok(res,{settings:req.body});});

module.exports = router;