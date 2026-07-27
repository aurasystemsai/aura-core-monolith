const express = require('express');
const router = express.Router();
const store = { settings: new Map() };
function ok(res,d){res.json({ok:true,...d});}
function rnd(a,b){return Math.random()*(b-a)+a;}

router.get('/health',(req,res)=>ok(res,{service:'tiktok-ads-integration',status:'healthy',ts:new Date().toISOString()}));
router.get('/stats',(req,res)=>ok(res,{stats:{campaigns:6,spend:18400,followers:24800}}));

router.post('/campaigns/list',(req,res)=>ok(res,{data:{campaigns:Array.from({length:6},(_,i)=>({
  id:'tik-c-'+i, name:['Prospecting - TOF','Product Demo - MOF','Retargeting - BOF','Spark Ads Amplification','TikTok Shop','Brand Awareness'][i],
  objective:['TRAFFIC','CONVERSIONS','CONVERSIONS','REACH','CATALOG_SALES','REACH'][i],
  status:i<5?'ACTIVE':'PAUSED', spend:(rnd(800,6000)).toFixed(0),
  impressions:Math.floor(rnd(50000,500000)), clicks:Math.floor(rnd(500,8000)),
  ctr:(rnd(0.8,4.2)).toFixed(2), cpm:(rnd(4,18)).toFixed(2),
  conversions:Math.floor(rnd(10,200)), roas:(rnd(1.2,5.4)).toFixed(2),
}))}}));
router.post('/creative/spark-ads',(req,res)=>ok(res,{data:{candidates:Array.from({length:8},(_,i)=>({
  id:'org-'+i, type:'Organic Post', author:'@yourbrand',
  views:Math.floor(rnd(5000,200000)), likes:Math.floor(rnd(200,8000)),
  engagementRate:(rnd(2,12)).toFixed(1)+'%',
  shares:Math.floor(rnd(50,2000)), comments:Math.floor(rnd(20,500)),
  sparkScore:Math.floor(rnd(60,98)),
  recommendation:i<3?'Top Spark Ad candidate -- high engagement rate and view completion':'Monitor performance before promoting',
}))}}));
router.post('/creative/hook-analyzer',(req,res)=>ok(res,{data:{videos:Array.from({length:5},(_,i)=>({
  id:'vid-'+i, title:'Video '+String.fromCharCode(65+i),
  avgWatchTime:(rnd(4,14)).toFixed(1)+'s', completionRate:(rnd(15,55)).toFixed(0)+'%',
  dropOffSecond:Math.floor(rnd(2,8)),
  hookScore:Math.floor(rnd(40,95)),
  hookType:['Question hook','Shock/surprise open','Trending sound start','Direct address','Visual hook'][i],
  recommendation:i<2?'Strong hook -- repurpose as Spark Ad':'A/B test alternative hook style to improve 3s retention',
}))}}));
router.post('/creative/trending-audio',(req,res)=>ok(res,{data:{trends:[
  {sound:'Trending Sound 1',usageCount:2840000,trend:'+284%',genre:'Pop',brandFit:'high',engagement_lift:'+18%'},
  {sound:'Trending Sound 2',usageCount:1240000,trend:'+142%',genre:'Hip-Hop',brandFit:'medium',engagement_lift:'+12%'},
  {sound:'Trending Sound 3',usageCount:840000,trend:'+94%',genre:'Electronic',brandFit:'high',engagement_lift:'+22%'},
  {sound:'Trending Sound 4',usageCount:480000,trend:'+48%',genre:'Viral Original',brandFit:'low',engagement_lift:'+8%'},
]}}));
router.post('/tiktokseo/caption-opt',(req,res)=>{
  const {caption='',model='gpt-4o-mini'}=req.body;
  ok(res,{data:{optimized:{
    original:caption||'Check out our new running shoes!',
    optimized:'These running shoes changed my training routine #RunningShoes #FitTok #RunningMotivation #AthleticWear #MarathonTraining',
    keywords:['RunningShoes','FitTok','RunningMotivation','AthleticWear','MarathonTraining'],
    searchVolume:{RunningShoes:'2.4B views',FitTok:'18.4B views',RunningMotivation:'4.2B views'},
    predictedReach:'+34% vs non-optimized caption',
    creditsUsed:1,model,
  }}});
});
router.post('/audiences/genz-intel',(req,res)=>ok(res,{data:{insights:{
  topInterests:['FitTok','CleanTok','StudyTok','CottageCore','TechTok'],
  contentPreferences:{videoLength:'7-15 seconds',tone:'Authentic/raw over polished',format:'Tutorial/how-to converts 3x better'},
  trendsOverlap:[{trend:'5am club',overlap:34,brandFit:'Running shoes -- morning run content'},
    {trend:'12-3-30 workout',overlap:28,brandFit:'Treadmill/gym footwear angles'},
    {trend:'Hot girl walk',overlap:42,brandFit:'Casual athletic footwear for walking'}],
  avoidList:['Overly promotional','Celebrity endorsement without authenticity','Long pre-roll ads'],
}}}));
router.post('/shop/attribution',(req,res)=>ok(res,{data:{attribution:{
  totalRevenue:28400, fromTikTokShop:12400, fromAds:9800, fromOrganic:6200,
  conversionPath:'50% direct from TikTok Shop tab, 30% from Spark Ads, 20% from organic content',
  topProducts:Array.from({length:5},(_,i)=>({name:'Product '+(i+1),units:Math.floor(rnd(20,200)),revenue:Math.floor(rnd(800,8000)),source:'TikTok Shop'})),
}}}));
router.get('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';ok(res,{settings:store.settings.get(s)||{model:'gpt-4o-mini'}});});
router.post('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';store.settings.set(s,req.body);ok(res,{settings:req.body});});

module.exports = router;