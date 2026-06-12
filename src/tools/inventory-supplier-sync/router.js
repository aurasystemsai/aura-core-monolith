const express = require('express');
const router = express.Router();
const store = { suppliers: new Map(), pos: new Map(), alerts: new Map(), settings: new Map() };
function ok(res,d){res.json({ok:true,...d});}
function fail(res,m,s=400){res.status(s).json({ok:false,error:m});}

function mockSupplier(i) {
  const countries = ['China','USA','Germany','India','Vietnam','Mexico','UK'];
  const cats = ['Electronics','Textiles','Raw Materials','Packaging','Components'];
  return {
    id:'SUP-'+String(i).padStart(4,'0'), name:'Supplier '+i,
    country:countries[i%countries.length], category:cats[i%cats.length],
    da:Math.floor(Math.random()*60)+40, leadTimeDays:Math.floor(Math.random()*25)+5,
    onTimeDelivery:(85+Math.random()*14).toFixed(1),
    qualityRate:(92+Math.random()*7).toFixed(1),
    priceCompetitiveness:Math.floor(Math.random()*40)+60,
    riskScore:Math.floor(Math.random()*60)+20,
    status:['active','probation','approved'][i%3],
    carbonScore:Math.floor(Math.random()*50)+30,
    totalOrders:Math.floor(Math.random()*200)+10,
    activeContracts:Math.floor(Math.random()*5)+1,
  };
}

router.get('/health',(req,res)=>ok(res,{service:'inventory-supplier-sync',status:'healthy',ts:new Date().toISOString()}));
router.get('/stats',(req,res)=>ok(res,{stats:{suppliers:store.suppliers.size,pos:store.pos.size}}));
router.get('/metrics',(req,res)=>ok(res,{metrics:{uptime:process.uptime()}}));

router.post('/suppliers/list',(req,res)=>ok(res,{data:{suppliers:Array.from({length:20},(_,i)=>mockSupplier(i+1)),total:20}}));
router.post('/suppliers/scorecard',(req,res)=>{
  const {supplierId} = req.body;
  ok(res,{data:{supplier:mockSupplier(supplierId||1),scores:{delivery:Math.floor(Math.random()*30)+70,quality:Math.floor(Math.random()*20)+80,price:Math.floor(Math.random()*40)+60,communication:Math.floor(Math.random()*30)+70,sustainability:Math.floor(Math.random()*40)+50,overall:Math.floor(Math.random()*20)+75},trend:'improving'}});
});
router.post('/suppliers/create',(req,res)=>{
  const id='SUP-'+Date.now();
  const s={...req.body,id,createdAt:new Date().toISOString(),status:'pending'};
  store.suppliers.set(id,s);
  ok(res,{data:{supplier:s}});
});
router.post('/suppliers/risk',(req,res)=>ok(res,{data:{riskySups:Array.from({length:8},(_,i)=>({...mockSupplier(i+20),risk:['financial','geopolitical','quality','capacity'][i%4],riskLevel:['critical','high','medium'][i%3]}))}}));
router.post('/orders/po-list',(req,res)=>ok(res,{data:{pos:[...store.pos.values(),...Array.from({length:5},(_,i)=>({id:'PO-'+i,supplier:'Supplier '+(i+1),status:['open','received','partial','closed'][i%4],value:(Math.random()*10000+500).toFixed(2),dueDate:new Date(Date.now()+(i+1)*7*86400000).toISOString().slice(0,10)}))]}}));
router.post('/orders/create-po',(req,res)=>{
  const id='PO-'+Date.now();
  const po={...req.body,id,status:'draft',createdAt:new Date().toISOString()};
  store.pos.set(id,po);
  ok(res,{data:{po}});
});
router.post('/orders/edi',(req,res)=>ok(res,{data:{documents:[{type:'850',desc:'Purchase Order',count:45,lastSent:new Date().toISOString()},{type:'855',desc:'PO Acknowledgment',count:42,lastReceived:new Date().toISOString()},{type:'856',desc:'Advance Ship Notice',count:38,lastReceived:new Date().toISOString()},{type:'810',desc:'Invoice',count:51,lastReceived:new Date().toISOString()}]}}));
router.post('/leadtimes/predict',(req,res)=>{
  ok(res,{data:{predictions:Array.from({length:10},(_,i)=>({supplier:'Supplier '+(i+1),historicalAvg:Math.floor(Math.random()*20)+5,predicted:Math.floor(Math.random()*22)+4,variability:'±'+Math.floor(Math.random()*4)+1+' days',confidence:(0.75+Math.random()*0.2).toFixed(2)}))}}); 
});
router.post('/pricing/history',(req,res)=>ok(res,{data:{history:Array.from({length:12},(_,i)=>({month:new Date(2025,i,1).toLocaleString('default',{month:'short'}),avgPrice:(10+i*0.3+Math.random()*2).toFixed(2),marketIndex:(11+Math.random()*3).toFixed(2)}))}}));
router.post('/pricing/negotiate',(req,res)=>{
  ok(res,{data:{recommendation:{action:'Request 3-5% price reduction',rationale:'Market index has decreased 4.2% over last quarter; your supplier margin appears healthy at current pricing.',timing:'Now — Q3 contract renewal window',expectedSaving:3800}}});
});
router.post('/risk/dashboard',(req,res)=>ok(res,{data:{overview:{totalSuppliers:45,highRisk:3,mediumRisk:12,lowRisk:30},categories:{financial:5,geopolitical:4,quality:6,capacity:3,regulatory:2}}}));
router.post('/risk/alt-sourcing',(req,res)=>{
  ok(res,{data:{alternatives:Array.from({length:8},(_,i)=>({...mockSupplier(i+100),similarityScore:Math.floor(Math.random()*30)+70,leadTimeDiff:Math.floor(Math.random()*5)-2,priceDiff:(Math.random()*10-5).toFixed(1)+'%'}))}});
});
router.post('/vmi/overview',(req,res)=>ok(res,{data:{vmiSuppliers:3,autoReplenishments:28,stockouts:0,avgReplenishCycle:4.2,savings:12400}}));
router.post('/ai/insights',(req,res)=>{
  const {model='gpt-4o-mini'}=req.body;
  ok(res,{data:{insights:['Supplier SUP-0003 on-time delivery dropped 8% — recommend performance review','Market price for Category B components down 4.2% — renegotiation window open','Lead time variability for Vietnamese suppliers up 3 days — increase safety stock','3 supplier compliance certificates expiring in 30 days'],model,creditsUsed:2}});
});
router.get('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';ok(res,{settings:store.settings.get(s)||{model:'gpt-4o-mini'}});});
router.post('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';store.settings.set(s,req.body);ok(res,{settings:req.body});});
router.get('/alerts',(req,res)=>ok(res,{data:{alerts:[...store.alerts.values()]}}));
router.post('/alerts/create',(req,res)=>{const id='al_'+Date.now();store.alerts.set(id,{...req.body,id,createdAt:new Date().toISOString()});ok(res,{data:{alert:store.alerts.get(id)}});});

module.exports = router;