const express = require('express');
const router = express.Router();
const store = { rules: new Map(), settings: new Map(), alerts: [] };
function ok(res,d){res.json({ok:true,...d});}
function rnd(a,b){return Math.random()*(b-a)+a;}

router.get('/health',(req,res)=>ok(res,{service:'ads-anomaly-guard',status:'healthy',ts:new Date().toISOString()}));
router.get('/stats',(req,res)=>ok(res,{stats:{rules:store.rules.size,alertsToday:store.alerts.length,protectedBudget:48200}}));

router.post('/live/dashboard',(req,res)=>ok(res,{data:{
  status:'monitoring', lastCheck:new Date().toISOString(),
  spend:{today:2840,budget:3500,pacing:81.1,onTrack:true},
  roas:{current:3.84,target:3.5,status:'on-track'},
  conversions:{today:84,yesterday:78,change:'+7.7%'},
  anomalies:{active:2,warnings:3,critical:0},
  recentEvents:[
    {time:'14:32',type:'warning',message:'CPC spike detected on Brand campaign -- +42% vs 7-day avg'},
    {time:'13:15',type:'info',message:'Budget pacing on track -- 81% spent at 81% of day'},
    {time:'11:48',type:'alert',message:'Click fraud risk: 2.4% invalid click rate on Display (threshold: 3%)'},
  ],
}}));
router.post('/live/spend-velocity',(req,res)=>ok(res,{data:{
  velocity:{hourly:118,daily:2840,weeklyAvg:18400},
  burnProjection:{eomSpend:86200,budget:90000,onTrack:true,overrunRisk:false},
  hourlyPattern:Array.from({length:24},(_,h)=>({hour:h+'h',spend:Math.floor(rnd(40,200)),budget:Math.floor(rnd(60,180)),pacing:Math.floor(rnd(50,130))})),
}}));
router.post('/anomalies/all',(req,res)=>ok(res,{data:{anomalies:[
  {id:'an-1',severity:'critical',type:'ROAS Cliff',campaign:'Non-Brand ROAS',metric:'ROAS',value:1.2,threshold:2.0,detectedAt:new Date(Date.now()-1800000).toISOString(),status:'active',action:'Auto-paused by rule ROAS-GUARD'},
  {id:'an-2',severity:'warning',type:'CPC Spike',campaign:'Brand',metric:'CPC',value:4.84,threshold:3.50,detectedAt:new Date(Date.now()-3600000).toISOString(),status:'active',action:'Alert sent to Slack'},
  {id:'an-3',severity:'warning',type:'Click Fraud',campaign:'Display Remarketing',metric:'Invalid Click Rate',value:2.4,threshold:3.0,detectedAt:new Date(Date.now()-7200000).toISOString(),status:'monitoring',action:'IP clustering analysis running'},
  {id:'an-4',severity:'info',type:'Conversion Drop',campaign:'Shopping',metric:'Conv. Rate',value:1.2,threshold:2.0,detectedAt:new Date(Date.now()-14400000).toISOString(),status:'resolved',action:'Resolved -- checkout issue fixed'},
]}}));
router.post('/anomalies/click-fraud',(req,res)=>ok(res,{data:{analysis:{
  invalidClickRate:2.4, threshold:3.0, status:'monitoring',
  suspiciousClusters:[{ip:'185.x.x.x',clicks:48,bounce:0.98,timeOnSite:'<2s',pattern:'Rapid sequential clicks'},
    {ip:'92.x.x.x',clicks:32,bounce:0.96,timeOnSite:'<3s',pattern:'Same UA, multiple IPs'}],
  recommendations:['Add IP exclusion list for identified clusters','Enable enhanced CPC to reduce exposure to low-quality clicks','Set up IP rate-limiting in campaign settings'],
}}}));
router.post('/rules/list',(req,res)=>ok(res,{data:{rules:[...store.rules.values(),...[
  {id:'r-1',name:'ROAS Guard',condition:'ROAS < 1.5 for 2 consecutive hours',action:'Pause campaign + alert',campaigns:'All',status:'active',triggeredCount:3},
  {id:'r-2',name:'Budget Pacing Guard',condition:'Daily spend > 110% of daily budget by 6pm',action:'Reduce budget to 90%',campaigns:'All',status:'active',triggeredCount:1},
  {id:'r-3',name:'CPC Spike Alert',condition:'CPC > 150% of 7-day average',action:'Send Slack alert',campaigns:'Non-Brand',status:'active',triggeredCount:8},
  {id:'r-4',name:'Click Fraud Guard',condition:'Invalid click rate > 3%',action:'Pause + alert + IP report',campaigns:'Display',status:'active',triggeredCount:0},
]]}}));
router.post('/rules/create',(req,res)=>{const id='rule-'+Date.now();const rule={...req.body,id,createdAt:new Date().toISOString()};store.rules.set(id,rule);ok(res,{data:{rule}});});
router.post('/cannibalization/paid-organic',(req,res)=>ok(res,{data:{keywords:[
  {keyword:'brand name',paidIS:42,organicRank:1,incrementalValue:0.18,recommendation:'Reduce brand bid -- organic #1 captures most value'},
  {keyword:'running shoes',paidIS:68,organicRank:4,incrementalValue:0.72,recommendation:'Maintain -- paid captures users who skip organic'},
  {keyword:'best running shoes 2024',paidIS:84,organicRank:2,incrementalValue:0.42,recommendation:'Reduce bid -- strong organic visibility reduces paid incrementality'},
]}}));
router.post('/protection/fraud-detect',(req,res)=>ok(res,{data:{summary:{totalClicks:48200,validClicks:47048,suspiciousClicks:1152,fraudRate:2.4,estimatedWaste:840,ipsClustered:8,actionTaken:'Monitoring -- below auto-block threshold of 3%'}}}));
router.post('/advanced/burn-rate',(req,res)=>ok(res,{data:{projection:{
  currentDailyBurn:2840, budgetRemaining:48200, daysRemaining:17,
  eomProjection:{low:82400,base:86200,high:91800},
  overrunProbability:0.12,
  scenarios:[{name:'Current pace',eom:86200,vs:'$90K budget'},{name:'+20% spend increase',eom:103440,vs:'12% over budget'},{name:'-15% spend reduction',eom:73270,vs:'18% under budget'}],
}}}));
router.get('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';ok(res,{settings:store.settings.get(s)||{model:'gpt-4o-mini'}});});
router.post('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';store.settings.set(s,req.body);ok(res,{settings:req.body});});

module.exports = router;