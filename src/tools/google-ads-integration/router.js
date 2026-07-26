const express = require('express');
const router = express.Router();
const store = { settings: new Map(), negatives: new Map() };
function ok(res,d){res.json({ok:true,...d});}
function rnd(a,b){return Math.random()*(b-a)+a;}

router.get('/health',(req,res)=>ok(res,{service:'google-ads-integration',status:'healthy',ts:new Date().toISOString()}));
router.get('/stats',(req,res)=>ok(res,{stats:{campaigns:12,keywords:2840,spend:48200}}));

router.post('/campaigns/list',(req,res)=>ok(res,{data:{campaigns:Array.from({length:12},(_,i)=>({
  id:'camp-'+i, name:['Brand','Non-Brand ROAS','Competitor','Shopping','Performance Max','Discovery','Display Remarketing','YouTube','Smart','RLSA','Dynamic Search','DSA'][i],
  status:i<9?'enabled':'paused', type:['SEARCH','SEARCH','SEARCH','SHOPPING','PERFORMANCE_MAX','DISCOVERY','DISPLAY','VIDEO','SMART','SEARCH','DSA','DSA'][i],
  budget:(rnd(50,2000)).toFixed(0), spend:(rnd(40,1900)).toFixed(0),
  impressions:Math.floor(rnd(1000,50000)), clicks:Math.floor(rnd(50,2000)),
  ctr:(rnd(1,8)).toFixed(2), cpc:(rnd(0.5,8)).toFixed(2),
  conversions:Math.floor(rnd(5,200)), convValue:(rnd(200,8000)).toFixed(0),
  roas:(rnd(1.5,8)).toFixed(2), qualityScore:Math.floor(rnd(5,10)),
}))}});
});
router.post('/keywords/list',(req,res)=>ok(res,{data:{keywords:Array.from({length:20},(_,i)=>({
  id:'kw-'+i, keyword:['running shoes','buy running shoes online','best trail running shoes','nike running shoes','adidas ultraboost','marathon training shoes','waterproof running shoes','minimalist running shoes','wide width running shoes','running shoes for overpronation'][i%10]+' '+(i>9?'v2':''),
  matchType:['EXACT','PHRASE','BROAD'][i%3], status:'enabled',
  impressions:Math.floor(rnd(100,10000)), clicks:Math.floor(rnd(10,500)),
  ctr:(rnd(1,12)).toFixed(2), avgCpc:(rnd(0.5,6)).toFixed(2),
  conversions:Math.floor(rnd(1,50)), convRate:(rnd(1,8)).toFixed(2),
  qualityScore:Math.floor(rnd(4,10)), adRelevance:['Below average','Average','Above average'][i%3],
  expectedCtr:['Below average','Average','Above average'][(i+1)%3],
  landingPageExp:['Below average','Average','Above average'][(i+2)%3],
}))}});
});
router.post('/keywords/search-terms',(req,res)=>ok(res,{data:{searchTerms:Array.from({length:25},(_,i)=>({
  term:'search term example '+i, matchedKeyword:'running shoes', matchType:'BROAD',
  impressions:Math.floor(rnd(10,500)), clicks:Math.floor(rnd(1,50)),
  conversions:Math.floor(rnd(0,5)), spend:(rnd(1,80)).toFixed(2),
  recommendation:i%3===0?'Add as EXACT keyword':i%3===1?'Add as negative keyword':'Monitor',
}))}});
});
router.post('/keywords/ai-mining',(req,res)=>{
  const {model='gpt-4o-mini'}=req.body;
  ok(res,{data:{clusters:[
    {theme:'Brand Intent',keywords:['nike air zoom pegasus 40','nike running shoes sale','nike zoom buy'],volume:8400,intent:'transactional',opportunity:'high',action:'Create dedicated brand ad group'},
    {theme:'Problem Aware',keywords:['best shoes for knee pain','running shoes plantar fasciitis','cushioned running shoes'],volume:12800,intent:'informational',opportunity:'medium',action:'Add informational ad with landing page'},
    {theme:'Competitor Conquest',keywords:['adidas vs nike running','alternatives to on cloud','hoka shoes review'],volume:6200,intent:'commercial',opportunity:'high',action:'Create competitor conquest campaign with price comparison'},
    {theme:'Long Tail Transactional',keywords:['waterproof trail running shoes mens size 11','wide toe box zero drop shoes','minimalist road running shoe'],volume:2400,intent:'transactional',opportunity:'very high',action:'Create tightly themed EXACT match ad groups per cluster'},
  ],negativesSuggested:['free','diy','how to make','running shoe repair','job'],model,creditsUsed:2}});
});
router.post('/keywords/quality-score',(req,res)=>ok(res,{data:{improvements:[
  {keyword:'running shoes',qs:6,adRelevance:'Average',expectedCtr:'Below average',landingPageExp:'Average',action:'Rewrite ad headline to include exact keyword match'},
  {keyword:'trail running shoes',qs:5,adRelevance:'Below average',expectedCtr:'Below average',landingPageExp:'Average',action:'Create dedicated ad group with highly relevant ads'},
  {keyword:'waterproof running shoes',qs:8,adRelevance:'Above average',expectedCtr:'Above average',landingPageExp:'Above average',action:'Bid more aggressively -- high QS reduces CPC'},
]}}));
router.post('/bidding/markowitz',(req,res)=>ok(res,{data:{allocation:{
  method:'Markowitz Mean-Variance Optimization',
  totalBudget:5000,
  campaigns:[
    {name:'Brand',currentBudget:400,recommendedBudget:350,roas:8.4,risk:0.12,allocation:7.0},
    {name:'Non-Brand ROAS',currentBudget:1500,recommendedBudget:1800,roas:4.2,risk:0.28,allocation:36.0},
    {name:'Shopping',currentBudget:1200,recommendedBudget:1400,roas:5.1,risk:0.22,allocation:28.0},
    {name:'Performance Max',currentBudget:800,recommendedBudget:1000,roas:3.8,risk:0.35,allocation:20.0},
    {name:'Competitor',currentBudget:600,recommendedBudget:450,roas:2.1,risk:0.48,allocation:9.0},
  ],
  projectedRoasLift:'+0.8x at same spend',
}}}));
router.post('/intelligence/auction-insights',(req,res)=>ok(res,{data:{competitors:[
  {name:'Competitor A',impressionShare:34.2,overlapRate:28.4,outrankedShare:18.2,posAbove:12.1,topImprShare:42.1},
  {name:'Competitor B',impressionShare:28.7,overlapRate:22.1,outrankedShare:14.8,posAbove:9.4,topImprShare:35.8},
  {name:'Competitor C',impressionShare:18.4,overlapRate:15.2,outrankedShare:8.4,posAbove:6.8,topImprShare:22.4},
  {name:'You',impressionShare:42.1,overlapRate:null,outrankedShare:null,posAbove:null,topImprShare:51.2},
]}}));
router.post('/intelligence/incrementality',(req,res)=>ok(res,{data:{test:{
  design:'Ghost Ad Holdout Test',
  testGroup:8420,controlGroup:8420,
  duration:'14 days',
  measuredIncrementalConversions:284,
  measuredIncrementalRevenue:28400,
  incrementalROAS:4.2,
  confidenceLevel:0.94,
  recommendation:'Paid search is incrementally effective. Do not reduce budget.',
}}}));
router.post('/intelligence/wasted-spend',(req,res)=>ok(res,{data:{wastedSpend:[
  {type:'Irrelevant search terms',amount:840,action:'Add 23 negative keywords'},
  {type:'Low-QS keywords (QS < 5)',amount:420,action:'Pause or restructure 8 keywords into tighter ad groups'},
  {type:'Underperforming display placements',amount:280,action:'Exclude 12 placements with 0 conversions'},
  {type:'Overlap with organic (brand terms)',amount:180,action:'Reduce brand bid for queries where organic ranks #1'},
],totalWasted:1720,potentialSaving:1720}}));
router.post('/creative/rsa-builder',(req,res)=>{
  const {keywords='running shoes',model='gpt-4o-mini'}=req.body;
  ok(res,{data:{rsa:{headlines:['Free Shipping on All Orders','Shop Running Shoes Today','Top-Rated Running Gear',keywords+' -- Up to 40% Off','Expert-Picked '+keywords,'Find Your Perfect Fit','30-Day Free Returns','Official Store -- '+keywords,'Best Sellers in '+keywords,'New Arrivals -- '+keywords,'Trusted by 50,000+ Runners','Same Day Dispatch Available','Award-Winning Running Shoes','Compare Styles & Sizes','Buy 2 Get 15% Off'],descriptions:['Browse our full range of '+keywords+'. Free next-day delivery on orders over $50. 30-day hassle-free returns.','Expert-picked '+keywords+' from top brands. Filter by gait type, terrain, and cushioning to find your perfect match.'],pinning:['Headline 1: Brand name','Headline 2: USP (Free Shipping)'],score:'Excellent',creditsUsed:2,model},}});
});
router.post('/creative/copy-gen',(req,res)=>{
  const {product='running shoes',model='gpt-4o-mini'}=req.body;
  ok(res,{data:{variations:Array.from({length:4},(_,i)=>({
    angle:['Price','Social Proof','Urgency','Feature'][i],
    headline1:['Prices From $59.99','50,000+ Happy Runners','Last Chance -- Sale Ends Today','Engineered for Performance'][i],
    headline2:['Free Shipping & Returns','Rated 4.9/5 Stars','Shop '+product+' Now','Advanced Cushioning Tech'][i],
    description:['Shop our full range of '+product+' with free next-day delivery and easy 30-day returns. Find your perfect pair today.','Join over 50,000 satisfied runners. Our '+product+' are trusted by marathoners, trail runners, and casual joggers alike.','Sale ends midnight. Up to 40% off selected '+product+'. Limited sizes remaining -- order now for same-day dispatch.','Engineered with advanced cushioning and responsive foam. Our '+product+' deliver the performance you need, mile after mile.'][i],
    predictedCtr:(rnd(3,9)).toFixed(1)+'%',
  })),model,creditsUsed:2}});
});
router.get('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';ok(res,{settings:store.settings.get(s)||{model:'gpt-4o-mini',currency:'USD'}});});
router.post('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';store.settings.set(s,req.body);ok(res,{settings:req.body});});

module.exports = router;