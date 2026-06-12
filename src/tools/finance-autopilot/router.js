const express = require('express');
const router = express.Router();
const store = { invoices: new Map(), settings: new Map(), alerts: new Map() };
function ok(res,d){res.json({ok:true,...d});}
const CATS = ['Advertising','Software','Shipping','Inventory','Payroll','Rent','Utilities','Professional Services','Travel','Other'];

function mockInvoice(i, type='ap') {
  return {
    id:(type==='ap'?'INV-AP-':'INV-AR-')+String(i).padStart(5,'0'),
    vendor:type==='ap'?'Vendor '+i:'Customer '+i,
    amount:(Math.random()*5000+100).toFixed(2),
    due:new Date(Date.now()+(Math.random()*60-10)*86400000).toISOString().slice(0,10),
    status:['pending','approved','paid','overdue'][i%4],
    category:CATS[i%CATS.length],
    matchConfidence:(0.7+Math.random()*0.29).toFixed(2),
    poId:Math.random()>0.3?'PO-'+Math.floor(Math.random()*10000):null,
  };
}

router.get('/health',(req,res)=>ok(res,{service:'finance-autopilot',status:'healthy',ts:new Date().toISOString()}));
router.get('/stats',(req,res)=>ok(res,{stats:{invoices:store.invoices.size}}));

router.post('/ap/invoices',(req,res)=>ok(res,{data:{invoices:Array.from({length:25},(_,i)=>mockInvoice(i+1,'ap')),total:25,pending:8,overdue:3}}));
router.post('/ap/approve',(req,res)=>{
  const {invoiceId,action='approve'}=req.body;
  ok(res,{data:{invoiceId,action,approvedAt:new Date().toISOString(),approvedBy:'Auto-approve (below $500 threshold)'}});
});
router.post('/ap/po-match',(req,res)=>ok(res,{data:{matches:Array.from({length:15},(_,i)=>({invoice:mockInvoice(i,'ap'),matchedPO:'PO-'+i,matchScore:(0.75+Math.random()*0.24).toFixed(2),discrepancy:Math.random()>0.8?{field:'amount',expected:420,received:430,diff:10}:null}))}}));
router.post('/ar/list',(req,res)=>ok(res,{data:{receivables:Array.from({length:20},(_,i)=>mockInvoice(i+1,'ar')),total:20,outstanding:85400}}));
router.post('/ar/aging',(req,res)=>ok(res,{data:{aging:[
  {bucket:'Current',amount:45200,count:34,pct:53},
  {bucket:'1-30 days',amount:18400,count:12,pct:22},
  {bucket:'31-60 days',amount:12800,count:8,pct:15},
  {bucket:'61-90 days',amount:6200,count:4,pct:7},
  {bucket:'>90 days',amount:2800,count:2,pct:3},
]}}));
router.post('/recon/bank-feed',(req,res)=>ok(res,{data:{transactions:Array.from({length:20},(_,i)=>({id:'TXN-'+i,date:new Date(Date.now()-i*86400000).toISOString().slice(0,10),description:'Transaction '+i,amount:(Math.random()*2000-500).toFixed(2),matched:Math.random()>0.2,confidence:(0.7+Math.random()*0.29).toFixed(2)}))}}));
router.post('/recon/matching',(req,res)=>ok(res,{data:{matched:87,unmatched:13,matchRate:87,suggestions:Array.from({length:5},(_,i)=>({txnId:'TXN-'+i,suggestion:'Likely: '+CATS[i%CATS.length]+' invoice INV-AP-0000'+i,confidence:(0.7+Math.random()*0.28).toFixed(2)}))}}));
router.post('/expenses/categorize',(req,res)=>{
  const {description='',model='gpt-4o-mini'}=req.body;
  const cat=CATS[Math.floor(Math.random()*CATS.length)];
  ok(res,{data:{category:cat,confidence:0.89,alternatives:[CATS[(CATS.indexOf(cat)+1)%CATS.length]],model,creditsUsed:1}});
});
router.post('/tax/payout-recon',(req,res)=>ok(res,{data:{payouts:[{date:new Date().toISOString().slice(0,10),gross:18240,fees:547.2,net:17692.8,status:'matched'},{date:new Date(Date.now()-7*86400000).toISOString().slice(0,10),gross:21340,fees:640.2,net:20699.8,status:'matched'}]}}));
router.post('/tax/filings',(req,res)=>ok(res,{data:{upcoming:[{jurisdiction:'California',type:'Sales Tax',due:'2026-07-31',estimated:2840,status:'pending'},{jurisdiction:'UK VAT',type:'VAT Return',due:'2026-07-31',estimated:4120,status:'pending'}]}}));
router.post('/auto/rules',(req,res)=>ok(res,{data:{rules:[{id:1,name:'Auto-approve AP < $500',trigger:'amount < 500 AND matchScore > 0.9',action:'approve',active:true},{id:2,name:'Flag overdue AR > 60 days',trigger:'ageDays > 60',action:'create_alert',active:true},{id:3,name:'Categorize Shopify fees',trigger:'description CONTAINS "Shopify"',action:'category=Software',active:true}]}}));
router.post('/ai/bookkeeping',(req,res)=>{
  const {model='gpt-4o-mini'}=req.body;
  ok(res,{data:{actions:[{type:'AP Matching','pending':13,suggested:11,action:'Auto-match 11 invoices with >90% confidence'},{type:'Expense Categorization',pending:47,suggested:44,action:'Auto-categorize 44 expenses using NLP'},{type:'AR Follow-up',overdue:3,action:'Send payment reminders to 3 overdue customers'},{type:'Month-End Close',items:8,completed:5,action:'3 remaining items require human review'}],model,creditsUsed:2}});
});
router.get('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';ok(res,{settings:store.settings.get(s)||{model:'gpt-4o-mini'}});});
router.post('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';store.settings.set(s,req.body);ok(res,{settings:req.body});});
router.get('/alerts',(req,res)=>ok(res,{data:{alerts:[...store.alerts.values()]}}));
router.post('/alerts/create',(req,res)=>{const id='al_'+Date.now();store.alerts.set(id,{...req.body,id});ok(res,{data:{alert:store.alerts.get(id)}});});

module.exports = router;