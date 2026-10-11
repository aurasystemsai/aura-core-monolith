'use strict';
const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
router.use(verifyShopifySession);
const store = { settings: new Map() };
function ok(res,d){res.json({ok:true,...d});}
function rnd(a,b){return Math.random()*(b-a)+a;}
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/health',ah(async (req,res)=>ok(res,{service:'multi-channel-optimizer',status:'healthy',ts:new Date().toISOString()})));
router.get('/stats',ah(async (req,res)=>ok(res,{stats:{channelsTracked:5,totalSpend:124800,blendedRoas:3.84}})));

router.post('/overview/dashboard',ah(async (req,res)=>ok(res,{data:{
  totalSpend:124800,blendedRoas:3.84,totalConversions:2840,blendedCpa:43.9,
  channels:[
    {name:'Google Search',spend:48200,roas:4.84,conversions:1124,pct:38.6,trend:'+8%'},
    {name:'Google Shopping',spend:18400,roas:5.24,conversions:428,pct:14.7,trend:'+12%'},
    {name:'Meta',spend:38420,roas:3.14,conversions:842,pct:30.8,trend:'-4%'},
    {name:'TikTok',spend:12400,roas:2.84,conversions:284,pct:9.9,trend:'+28%'},
    {name:'Email',spend:7380,roas:18.4,conversions:162,pct:5.9,trend:'+2%'},
  ],
}})));

router.post('/mmm/model',ah(async (req,res)=>ok(res,{data:{model:{
  name:'Bayesian Media Mix Model',
  description:'Adstock and saturation curves per channel.',
  channels:[
    {channel:'Google Search',contribution:0.34,adstockHalfLife:2.1,saturationAlpha:0.62,incrementalRoas:5.2},
    {channel:'Google Shopping',contribution:0.18,adstockHalfLife:1.4,saturationAlpha:0.71,incrementalRoas:5.8},
    {channel:'Meta',contribution:0.22,adstockHalfLife:4.2,saturationAlpha:0.44,incrementalRoas:2.8},
    {channel:'TikTok',contribution:0.08,adstockHalfLife:6.4,saturationAlpha:0.28,incrementalRoas:2.1},
    {channel:'Email',contribution:0.12,adstockHalfLife:1.2,saturationAlpha:0.82,incrementalRoas:18.4},
    {channel:'Baseline (organic)',contribution:0.06,adstockHalfLife:null,saturationAlpha:null,incrementalRoas:null},
  ],
  fit:{rSquared:0.91,mape:8.4},
}}})));

router.post('/attribution/shapley',ah(async (req,res)=>ok(res,{data:{shapley:{
  description:'Game-theory Shapley value attribution: each channel gets credit proportional to marginal contribution.',
  channels:[
    {channel:'Google Search',lastClick:42.1,shapley:28.4,diff:-13.7,insight:'Last click overcredits search'},
    {channel:'Meta',lastClick:18.4,shapley:24.2,diff:5.8,insight:'Under-credited -- Meta plays strong assist role'},
    {channel:'Email',lastClick:12.4,shapley:18.8,diff:6.4,insight:'Significantly under-credited -- key conversion driver'},
    {channel:'TikTok',lastClick:8.2,shapley:14.4,diff:6.2,insight:'Under-credited -- TikTok drives discovery'},
    {channel:'Google Shopping',lastClick:18.9,shapley:14.2,diff:-4.7,insight:'Slightly over-credited'},
  ],
}}})));

router.post('/mmm/diminishing',ah(async (req,res)=>ok(res,{data:{curves:[
  {channel:'Google Search',currentSpend:48200,marginalRoas:3.2,optimalSpend:58000,potentialUplift:'+$8.4K revenue at optimal spend'},
  {channel:'Meta',currentSpend:38420,marginalRoas:1.4,optimalSpend:28000,potentialUplift:'+$6.2K revenue by reallocating overspend'},
  {channel:'TikTok',currentSpend:12400,marginalRoas:3.8,optimalSpend:18000,potentialUplift:'+$4.8K revenue at optimal spend'},
  {channel:'Email',currentSpend:7380,marginalRoas:12.4,optimalSpend:12000,potentialUplift:'+$9.2K revenue -- most underspent channel'},
]}})));

router.post('/budgets/scenarios',ah(async (req,res)=>{
  const {totalBudget=124800}=req.body;
  ok(res,{data:{scenarios:[
    {name:'Current Allocation',totalBudget,blendedRoas:3.84,totalConversions:2840,note:'Baseline'},
    {name:'ROAS-Optimized',totalBudget,blendedRoas:4.42,totalConversions:2980,note:'Shift $10K from Meta to Google Search + Email'},
    {name:'Volume-Maximized',totalBudget,blendedRoas:3.44,totalConversions:3240,note:'Increase TikTok + Meta at lower ROAS'},
    {name:'Efficiency-Focused',totalBudget:100000,blendedRoas:4.84,totalConversions:2480,note:'Cut 20% budget, eliminate low-ROAS placements'},
  ]}});
}));

router.post('/attribution/incr-roas',ah(async (req,res)=>ok(res,{data:{incrementalRoas:[
  {channel:'Google Search',lastClickRoas:4.84,incrementalRoas:3.2,incrementality:0.66,interpretation:'$0.66 of every $1 is truly incremental'},
  {channel:'Meta',lastClickRoas:3.14,incrementalRoas:2.1,incrementality:0.67,interpretation:'Meta drives mostly incremental sales'},
  {channel:'Brand Search',lastClickRoas:12.4,incrementalRoas:1.8,incrementality:0.15,interpretation:'Brand search is highly cannibalistic -- reduce brand bids where organic ranks #1'},
]}})));

router.post('/synergy/channel-synergy',ah(async (req,res)=>ok(res,{data:{synergies:[
  {combo:'Google Search + Email',synergyMultiplier:1.28,interpretation:'Customers exposed to both convert at 28% higher rate'},
  {combo:'TikTok + Meta',synergyMultiplier:1.18,interpretation:'Sequential TikTok discovery + Meta retargeting produces 18% lift'},
  {combo:'Meta + Email',synergyMultiplier:1.42,interpretation:'Strongest synergy pair -- email personalizes Meta retargeting'},
  {combo:'Google Shopping + Google Search',synergyMultiplier:1.14,interpretation:'Cross-format coverage improves click capture by 14%'},
]}})));

router.post('/advanced/scenario-planner',ah(async (req,res)=>{
  const {reallocation='',model='gpt-4o-mini'}=req.body;
  ok(res,{data:{scenario:{
    description:reallocation||'Reallocate $10K from Meta to Google Search + Email',
    projectedRoasChange:'+0.6x',projectedConversionChange:'+8.4%',projectedRevChange:'+$12,400',
    confidence:0.78,model,creditsUsed:3,
    breakdown:[
      {channel:'Meta',change:'-$10K',roasImpact:'+0.2x (less diminishing returns)'},
      {channel:'Google Search',change:'+$6K',roasImpact:'-0.1x (still above breakeven)'},
      {channel:'Email',change:'+$4K',roasImpact:'+0.5x (most underspent channel)'},
    ],
  }}});
}));

router.get('/settings',ah(async (req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';ok(res,{settings:store.settings.get(s)||{model:'gpt-4o-mini'}});}));
router.post('/settings',ah(async (req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';store.settings.set(s,req.body);ok(res,{settings:req.body});}));

module.exports = router;

