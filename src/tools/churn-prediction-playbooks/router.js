const express = require('express');
const router = express.Router();
const store = { playbooks: new Map(), settings: new Map() };
function ok(res,d){res.json({ok:true,...d});}
function rnd(a,b){return Math.random()*(b-a)+a;}

router.get('/health',(req,res)=>ok(res,{service:'churn-prediction-playbooks',status:'healthy',ts:new Date().toISOString()}));
router.get('/stats',(req,res)=>ok(res,{stats:{playbooks:store.playbooks.size}}));

router.post('/risk/dashboard',(req,res)=>ok(res,{data:{
  totalCustomers:8420, highRisk:342, mediumRisk:1204, lowRisk:6874,
  churnRate:4.2, churnRateChange:-0.3, avgHealthScore:72, predLoss30d:28400,
  segments:[{name:'Champions',count:1240,churnProb:0.03},{name:'Loyal',count:2100,churnProb:0.08},{name:'At Risk',count:890,churnProb:0.42},{name:'Dormant',count:560,churnProb:0.68}],
}}));
router.post('/risk/high-risk',(req,res)=>ok(res,{data:{customers:Array.from({length:20},(_,i)=>({
  id:'CUST-'+i, name:'Customer '+i,
  churnScore:(0.65+rnd(0,0.34)).toFixed(2),
  rfmScore:Math.floor(rnd(100,300)),
  healthScore:Math.floor(rnd(20,45)),
  daysSinceOrder:Math.floor(rnd(60,180)),
  ltv:(rnd(200,2000)).toFixed(0),
  segment:'At Risk',
  topSignal:['Login frequency drop','No purchase 90+ days','Support tickets spiked','NPS detractor'][i%4],
}))}));
router.post('/risk/rfm',(req,res)=>ok(res,{data:{distribution:{
  '5-5-5':{count:124,pct:1.5,label:'Champions'},
  '4-4-4':{count:890,pct:10.6,label:'Loyal Customers'},
  '3-3-3':{count:2140,pct:25.4,label:'Potential Loyalists'},
  '2-2-2':{count:2840,pct:33.7,label:'At Risk'},
  '1-1-1':{count:2426,pct:28.8,label:'Lost'},
},customers:Array.from({length:15},(_,i)=>({id:'CUST-'+i,r:Math.floor(rnd(1,6)),f:Math.floor(rnd(1,6)),m:Math.floor(rnd(1,6)),segment:['Champions','Loyal','At Risk','Lost'][i%4]}))}}));
router.post('/survival/cox-ph',(req,res)=>ok(res,{data:{model:{
  concordance:0.74,
  hazardRatios:[{covariate:'Days since last order',hr:1.082,pValue:0.001},{covariate:'Purchase frequency',hr:0.891,pValue:0.003},{covariate:'Support tickets (last 30d)',hr:1.241,pValue:0.018},{covariate:'NPS score',hr:0.943,pValue:0.024},{covariate:'AOV',hr:0.978,pValue:0.089}],
  survivalCurves:{segments:['High LTV','Mid LTV','Low LTV'],day30:[0.98,0.94,0.88],day90:[0.91,0.82,0.68],day180:[0.81,0.67,0.51],day365:[0.68,0.49,0.33]},
  interpretation:'Each additional 10-day gap since last order increases churn hazard by 8.2%. Support ticket volume is a strong leading indicator — 1 additional ticket increases hazard by 24.1%.',
}}}));
router.post('/survival/cohort-curves',(req,res)=>ok(res,{data:{cohorts:Array.from({length:6},(_,i)=>({
  cohort:'Q'+(i%4+1)+' '+(2024+Math.floor(i/4)),
  retention:{m1:1,m2:+(0.65+rnd(0,0.1)).toFixed(2),m3:+(0.48+rnd(0,0.1)).toFixed(2),m6:+(0.35+rnd(0,0.1)).toFixed(2),m12:+(0.22+rnd(0,0.1)).toFixed(2)},
  size:Math.floor(rnd(200,800)),
}))}));
router.post('/survival/early-warnings',(req,res)=>ok(res,{data:{indicators:[
  {signal:'Login frequency drop >50%',lead:45,accuracy:0.82,count:234,description:'Customers who log in 50% less than their 90-day average are 3.2× more likely to churn within 45 days'},
  {signal:'No order in 60 days (was buying monthly)',lead:30,accuracy:0.78,count:187,description:'Previously monthly buyers with 60+ day gap have 78% churn probability within 30 days'},
  {signal:'Support tickets: 3+ in 14 days',lead:21,accuracy:0.74,count:56,description:'High support ticket volume precedes churn — resolve issues proactively within 21 days'},
  {signal:'NPS score drop of 3+ points',lead:60,accuracy:0.71,count:89,description:'NPS detractors and score drops are strong leading churn indicators 60 days before actual churn'},
]}}));
router.post('/playbooks/list',(req,res)=>ok(res,{data:{playbooks:[...store.playbooks.values(),...[
  {id:'pb-1',name:'High-Value At-Risk',trigger:'churnScore > 0.6 AND ltv > 500',actions:['Assign CSM','Send personalized discount','Schedule call'],status:'active',customers:124},
  {id:'pb-2',name:'90-Day Win-Back',trigger:'daysSinceOrder > 90 AND wasBuyer',actions:['Win-back email seq.','Social retargeting','SMS offer'],status:'active',customers:342},
  {id:'pb-3',name:'Dormant Reactivation',trigger:'daysSinceOrder > 180',actions:['Reintro email','Flash sale offer','Remove from paid ads'],status:'active',customers:198},
]]}}));
router.post('/playbooks/create',(req,res)=>{const id='pb-'+Date.now();const pb={...req.body,id,createdAt:new Date().toISOString()};store.playbooks.set(id,pb);ok(res,{data:{playbook:pb}});});
router.post('/campaigns/winback',(req,res)=>ok(res,{data:{campaigns:[{name:'90-day lapsed',customers:342,sent:342,opened:187,clicked:89,converted:34,revenue:4820,roi:2.8},{name:'180-day dormant',customers:198,sent:198,opened:82,clicked:28,converted:9,revenue:1240,roi:1.4}]}}));
router.post('/nps/tracker',(req,res)=>ok(res,{data:{current:62,target:65,trend:Array.from({length:12},(_,i)=>({month:new Date(2025,i,1).toLocaleString('default',{month:'short'}),nps:Math.floor(55+rnd(0,15)),responses:Math.floor(rnd(50,200))})),distribution:{promoters:52,passives:28,detractors:20}}}));
router.post('/nps/predictive',(req,res)=>ok(res,{data:{predictions:Array.from({length:10},(_,i)=>({customerId:'CUST-'+i,predictedNps:Math.floor(rnd(20,90)),confidence:(0.7+rnd(0,0.25)).toFixed(2),signals:['Low engagement','Price sensitivity','Multiple support tickets'][i%3]}))}}));
router.post('/ai/models',(req,res)=>{
  const {model='gpt-4o-mini'}=req.body;
  ok(res,{data:{models:[{name:'Cox PH Survival',accuracy:0.74,trained:'2026-06-01'},{name:'BG/NBD Churn Probability',accuracy:0.81,trained:'2026-06-01'},{name:'RFM Clustering',accuracy:'N/A',trained:'2026-06-01'}],recommendation:'BG/NBD model shows best discrimination for high-value segment. Consider retraining Cox PH with updated NPS signal weight.',model,creditsUsed:2}});
});
router.get('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';ok(res,{settings:store.settings.get(s)||{model:'gpt-4o-mini'}});});
router.post('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';store.settings.set(s,req.body);ok(res,{settings:req.body});});

module.exports = router;