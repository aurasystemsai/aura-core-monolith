const express = require('express');
const router = express.Router();
const store = { settings: new Map(), library: new Map() };
function ok(res,d){res.json({ok:true,...d});}
function rnd(a,b){return Math.random()*(b-a)+a;}

router.get('/health',(req,res)=>ok(res,{service:'ad-creative-optimizer',status:'healthy',ts:new Date().toISOString()}));
router.get('/stats',(req,res)=>ok(res,{stats:{creatives:284,tests:42,avgScore:72}}));

router.post('/library/all',(req,res)=>ok(res,{data:{creatives:Array.from({length:20},(_,i)=>({
  id:'cr-'+i, name:'Creative '+i, type:['Static Image','Video','Carousel','Story'][i%4],
  platform:['Google','Meta','TikTok','All'][i%4], score:Math.floor(rnd(40,98)),
  ctr:(rnd(1,6)).toFixed(2)+'%', conversions:Math.floor(rnd(5,200)),
  status:i<16?'active':'paused', fatigueRisk:i>14?'high':i>10?'medium':'low',
}))}});
});
router.post('/analyze/creative-dna',(req,res)=>ok(res,{data:{patterns:{
  topPerformers:{
    visualFeatures:['People in action (not static)','Natural lighting over studio','Product in context (not white background)','UGC-style rawness'],
    copyPatterns:['Number in headline (e.g. "40% off")','Question-based hooks','Social proof mentions','Urgency without fake countdown'],
    colorPalette:['High contrast dark/light','Brand color as accent','Avoid >3 colors in single creative'],
    videoLength:['7-12 seconds for prospecting','20-30 seconds for retargeting'],
  },
  bottomPerformers:{
    commonMistakes:['Stock photo backgrounds','Generic CTAs ("Click Here")','No price anchor','Too much text overlay'],
  },
  insight:'Your top 20% of creatives share 3 key traits: action shot of product in use, price/offer in first 3 words of headline, and social proof within 5 words.',
}}}));
router.post('/analyze/emotion-analysis',(req,res)=>ok(res,{data:{creatives:Array.from({length:8},(_,i)=>({
  id:'cr-'+i, name:'Creative '+String.fromCharCode(65+i),
  emotions:{joy:Math.floor(rnd(20,80)),trust:Math.floor(rnd(30,90)),surprise:Math.floor(rnd(10,60)),fear:Math.floor(rnd(5,30)),anticipation:Math.floor(rnd(20,70))},
  dominantEmotion:['Joy','Trust','Surprise','Anticipation'][i%4],
  predictedEngagement:['High','Medium','High','Low','Medium','High','Low','Medium'][i],
}))}});
});
router.post('/analyze/brand-safety',(req,res)=>ok(res,{data:{scan:{
  scanned:20, passed:18, flagged:2,
  flags:[{creative:'Creative 4',issue:'Price claim without substantiation -- "Best price guaranteed"',severity:'medium',action:'Add asterisk and terms, or reword'},
    {creative:'Creative 11',issue:'Before/after weight comparison imagery -- restricted on Meta','severity':'high',action:'Replace with product-only creative for Meta campaigns'}],
}}}));
router.post('/generate/copy',(req,res)=>{
  const {product='',audience='',goal='conversions',model='gpt-4o-mini'}=req.body;
  ok(res,{data:{copies:[
    {format:'Short (25 chars)','headline':'Save 40% Today Only','cta':'Shop Now','predictedCtr':'4.2%'},
    {format:'Medium (40 chars)','headline':'Free Shipping on '+( product||'All Orders'),'cta':'View Collection','predictedCtr':'3.8%'},
    {format:'Long (90 chars)','headline':'Join 50,000+ Happy Customers -- '+( product||'Premium Quality')+ ' with Free Returns','cta':'Explore Now','predictedCtr':'3.1%'},
    {format:'Question hook','headline':'Tired of '+(product||'Products')+' that disappoint?','cta':'See the Difference','predictedCtr':'5.1%'},
  ],model,creditsUsed:2}});
});
router.post('/generate/brief',(req,res)=>{
  const {campaignGoal='',targetAudience='',model='gpt-4o-mini'}=req.body;
  ok(res,{data:{brief:{
    objective:campaignGoal||'Drive purchase conversions from cold audiences',
    targetAudience:targetAudience||'Adults 25-44 interested in fitness and running',
    keyMessage:'Premium running gear engineered for performance, available at an accessible price with free next-day delivery',
    mandatoryInclusions:['Product in use','Price anchor or offer','Social proof element','Clear CTA'],
    avoid:['Generic stock photos','Jargon','Too many features -- focus on one benefit'],
    formats:['15-second vertical video','1:1 static image','Carousel (3-5 slides)'],
    kpis:['CTR > 2.5%','CPA < $40','ROAS > 3.5x'],
    creditsUsed:2,model,
  }}});
});
router.post('/predict/ctr',(req,res)=>{
  const {headline='',description='',format='static'}=req.body;
  const score=Math.floor(rnd(50,95));
  ok(res,{data:{prediction:{score,predictedCtr:(rnd(1.5,6.5)).toFixed(1)+'%',confidence:0.72,factors:[{factor:'Headline includes number or offer',impact:'+0.8% CTR'},{factor:'CTA is action-oriented',impact:'+0.4% CTR'},{factor:'Format is '+format,impact:format==='video'?'+1.2% CTR':'+0%'}]}}});
});
router.post('/testing/matrix',(req,res)=>ok(res,{data:{matrix:{
  dimensions:['Offer (Price/Free Ship/Percent/BOGOF)','Audience (Prospecting/Retarget/Lookalike/RLSA)','Creative (UGC/Studio/Video/Carousel)','CTA (Shop Now/Learn More/Buy Now/View Collection)'],
  activeTests:8,completed:24,winner:'UGC creative + Percent offer + Prospecting audience = best CPA at $34',
}}}));
router.get('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';ok(res,{settings:store.settings.get(s)||{model:'gpt-4o-mini'}});});
router.post('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';store.settings.set(s,req.body);ok(res,{settings:req.body});});

module.exports = router;