const express = require('express');
const router = express.Router();
const store = { settings: new Map() };
function ok(res,d){res.json({ok:true,...d});}
function rnd(a,b){return Math.random()*(b-a)+a;}

router.get('/health',(req,res)=>ok(res,{service:'facebook-ads-integration',status:'healthy',ts:new Date().toISOString()}));
router.get('/stats',(req,res)=>ok(res,{stats:{campaigns:8,adSets:24,ads:72,spend:38400}}));

router.post('/overview/dashboard',(req,res)=>ok(res,{data:{
  spend:38420, roas:3.84, conversions:842, cpa:45.6,
  ctr:2.14, cpm:18.4, reach:184200, frequency:2.84,
  trends:{spend:[32000,34000,36000,38420],roas:[3.2,3.4,3.6,3.84],days:['Week 1','Week 2','Week 3','Week 4']},
}}));
router.post('/overview/campaigns',(req,res)=>ok(res,{data:{campaigns:Array.from({length:8},(_,i)=>({
  id:'camp-f-'+i, name:['Prospecting - TOF','Retargeting - MOF','Retargeting - BOF','LTV Lookalike','Advantage+ Shopping','Interest Prospecting','Video Views','Brand Awareness'][i],
  objective:['CONVERSIONS','CONVERSIONS','CONVERSIONS','CONVERSIONS','SALES','CONVERSIONS','VIDEO_VIEWS','REACH'][i],
  status:i<6?'ACTIVE':'PAUSED', spend:(rnd(1000,12000)).toFixed(0),
  roas:(rnd(1.5,6.5)).toFixed(2), conversions:Math.floor(rnd(20,300)),
  cpa:(rnd(20,80)).toFixed(2), frequency:(rnd(1.2,4.8)).toFixed(1),
  reach:Math.floor(rnd(5000,80000)),
}))}});
});
router.post('/audiences/overlap',(req,res)=>ok(res,{data:{overlaps:[
  {setA:'LTV Top 20% Lookalike',setB:'Interest: Running',overlapPct:34.2,audienceSizeA:240000,audienceSizeB:180000,recommendation:'High overlap -- exclude LTV Lookalike from Interest campaigns to prevent auction competition'},
  {setA:'Retargeting: ATC','setB':'Retargeting: View Content',overlapPct:68.4,audienceSizeA:12000,audienceSizeB:28000,recommendation:'Very high overlap -- consolidate into single ad set with dynamic creative'},
  {setA:'Lookalike 1%',setB:'Lookalike 2%',overlapPct:41.2,audienceSizeA:280000,audienceSizeB:560000,recommendation:'Expected -- consider using only Lookalike 2% with exclusion of purchasers'},
]}}));
router.post('/audiences/ltv-lookalike',(req,res)=>ok(res,{data:{seeds:[
  {segment:'Top LTV Quintile (Q5)',customers:1684,avgLtv:1240,audienceSize:'2.4M',lookalikePct:1,estimated_roas:5.2,recommendation:'Primary prospecting -- highest expected LTV from lookalikes'},
  {segment:'30-Day Buyers',customers:2840,avgLtv:284,audienceSize:'4.1M',lookalikePct:2,estimated_roas:3.8,recommendation:'Scale prospecting -- good volume with solid LTV signal'},
  {segment:'High-Frequency Buyers (5+ orders)',customers:840,avgLtv:840,audienceSize:'1.2M',lookalikePct:1,estimated_roas:4.8,recommendation:'Premium lookalike -- strong loyalty signal'},
]}}));
router.post('/creative/fatigue',(req,res)=>ok(res,{data:{creatives:Array.from({length:8},(_,i)=>({
  id:'creative-'+i, name:'Creative '+String.fromCharCode(65+i),
  frequency:(1.2+i*0.4).toFixed(1), fatigueScore:Math.min(Math.floor(i*12+rnd(5,15)),100),
  ctrDrop:i>3?(rnd(15,45)).toFixed(0)+'%':'0%',
  daysRunning:7+i*4, recommendation:i>=4?'Pause and replace -- significant fatigue':'Healthy -- continue running',
  status:i>=5?'fatigued':i>=3?'warning':'healthy',
}))}});
});
router.post('/creative/dco',(req,res)=>ok(res,{data:{elements:{
  headlines:[{text:'Free Shipping on All Orders',impressions:48200,ctr:3.84,conversions:142},{text:'Shop Now -- Up to 40% Off',impressions:42000,ctr:2.94,conversions:98},{text:'Top-Rated Running Shoes',impressions:38400,ctr:3.24,conversions:118}],
  images:[{url:'hero-product.jpg',impressions:62000,ctr:3.94,conversions:184},{url:'lifestyle-running.jpg',impressions:42000,ctr:3.24,conversions:124},{url:'user-generated.jpg',impressions:24400,ctr:4.44,conversions:108}],
  ctas:[{text:'Shop Now',ctr:3.84,conversions:284},{text:'Learn More',ctr:2.14,conversions:84},{text:'Buy Now',ctr:4.24,conversions:184}],
  insight:'UGC imagery outperforms studio shots by 37% on CTR. "Buy Now" CTA converts best. Headline 1 drives highest absolute conversions.',
}}}));
router.post('/creative/ai',(req,res)=>{
  const {brief='',model='gpt-4o-mini'}=req.body;
  ok(res,{data:{concepts:[
    {format:'Static Image',headline:'Real runners. Real results.',body:'Join 50,000+ athletes who trust us for their training. Shop the full range -- free returns, next-day delivery.',hook:'Social proof + urgency',predicted_ctr:'3.8%'},
    {format:'Carousel',headline:'Find your perfect fit.',body:'Swipe to explore our top styles for road, trail, and track. Filter by gait type and get expert recommendations.',hook:'Interactive discovery',predicted_ctr:'4.2%'},
    {format:'Video (15s)',headline:'This is what 40% off looks like.',body:'Quick cut of 5 hero products with price overlays. Ends with countdown timer to sale end.',hook:'Price + urgency + visual',predicted_ctr:'5.1%'},
  ],model,creditsUsed:2}});
});
router.post('/pixel/ios14',(req,res)=>ok(res,{data:{recovery:{
  reportedConversions:842, modeledConversions:284, totalEstimated:1126,
  modelingCoverage:0.74, aggregatedEvents:['Purchase','AddToCart','ViewContent','InitiateCheckout'],
  recommendations:['Enable CAPI server-side events -- currently at 68% match rate, target 85%+','Prioritize Purchase event in AEM -- currently event 4, move to event 1','Set 7-day click, 1-day view attribution for cleaner signal','Enable Conversions API Gateway for cookieless measurement'],
}}}));
router.post('/shopping/advantage-plus',(req,res)=>ok(res,{data:{performance:{
  spend:12400, roas:5.84, conversions:248, cpa:50.0,
  vsManual:{spendDiff:'+12%',roasDiff:'+1.4x',conversionsDiff:'+38%'},
  breakdown:{newCustomers:{pct:42,roas:3.2},existingCustomers:{pct:58,roas:7.8}},
  recommendations:['Advantage+ is outperforming manual campaigns by 1.4x ROAS -- increase budget','New customer ROAS is below breakeven (3.2x vs 4.0x target) -- adjust new customer cap','Consider Advantage+ Creative for 20% estimated CTR improvement'],
}}}));
router.post('/analytics/attribution',(req,res)=>ok(res,{data:{models:[
  {model:'Last Click',conversions:842,revenue:84200,cpa:45.6},
  {model:'First Click',conversions:1124,revenue:112400,cpa:34.2},
  {model:'Linear',conversions:984,revenue:98400,cpa:39.0},
  {model:'Data-Driven',conversions:1042,revenue:104200,cpa:36.8},
  {model:'7d Click / 1d View',conversions:1084,revenue:108400,cpa:35.4},
]}}));
router.get('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';ok(res,{settings:store.settings.get(s)||{model:'gpt-4o-mini'}});});
router.post('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';store.settings.set(s,req.body);ok(res,{settings:req.body});});

module.exports = router;