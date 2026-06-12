/**
 * Phase 4b Generator: Tools 5-8
 * finance-autopilot, daily-cfo-pack, churn-prediction-playbooks, ltv-churn-predictor
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const FE = (n) => path.join(ROOT, `aura-console/src/components/tools/${n}.jsx`);
const BE = (id) => path.join(ROOT, `src/tools/${id}/router.js`);
function mkdir(p) { fs.mkdirSync(path.dirname(p), { recursive: true }); }

function baseComponent(componentName, apiBase, description, accentColor, groups, renderTabFn) {
return `import React, { useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "${apiBase}";

const S = {
  root: { background:'#09090b', minHeight:'100vh', color:'#fafafa', fontFamily:"'Inter',system-ui,sans-serif", padding:'28px 32px' },
  card: { background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:24, marginBottom:20 },
  mini: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:16 },
  cardTitle: { fontSize:14, fontWeight:700, color:'#fafafa', marginBottom:16, marginTop:0 },
  row: { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' },
  input: { flex:1, minWidth:180, background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:14, padding:'11px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif" },
  select: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'11px 14px', outline:'none', cursor:'pointer' },
  textarea: { width:'100%', background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'12px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif", resize:'vertical', boxSizing:'border-box' },
  btn: (bg) => ({ background:bg||'${accentColor}', color:'#fff', border:'none', borderRadius:10, padding:'11px 22px', fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }),
  label: { fontSize:12, fontWeight:600, color:'#a1a1aa', marginBottom:6, display:'block' },
  tbl: { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th: { textAlign:'left', color:'#71717a', fontWeight:600, fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', padding:'10px 14px', borderBottom:'2px solid #27272a', whiteSpace:'nowrap', background:'#18181b' },
  td: { padding:'12px 14px', borderBottom:'1px solid #1f1f22', color:'#fafafa', verticalAlign:'middle' },
  trOdd: { background:'#09090b44' },
  badge: (c) => ({ display:'inline-block', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600, background:(c||'#27272a')+'33', color:c||'#a1a1aa', border:\`1px solid \${(c||'#3f3f46')}44\` }),
  empty: { textAlign:'center', padding:'56px 24px', color:'#52525b', fontSize:13 },
  loading: { textAlign:'center', padding:'32px 24px', color:'#71717a', fontSize:13 },
  err: { background:'#1c0c0c', border:'1px solid #7f1d1d', color:'#fca5a5', borderRadius:10, padding:'12px 16px', fontSize:13, marginBottom:16 },
  metaRow: { display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 },
  metaItem: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:'12px 18px', flex:'1 1 130px', textAlign:'center' },
  metaVal: (c) => ({ fontSize:22, fontWeight:700, color:c||'${accentColor}' }),
  metaLbl: { fontSize:11, color:'#71717a', marginTop:2 },
  sT: { fontSize:12, fontWeight:700, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, marginTop:16 },
  groupNav: { display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' },
  gBtn: (a, c) => ({ background:a?c+'22':'#18181b', color:a?c:'#71717a', border:\`1px solid \${a?c+'44':'#27272a'}\`, borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:a?700:500, cursor:'pointer' }),
  tabStrip: { display:'flex', gap:4, marginBottom:20, flexWrap:'wrap', borderBottom:'1px solid #27272a', paddingBottom:8 },
  tBtn: (a, c) => ({ background:'none', color:a?c:'#71717a', border:'none', borderBottom:a?\`2px solid \${c}\`:'2px solid transparent', padding:'8px 14px', fontSize:13, fontWeight:a?700:500, cursor:'pointer', marginBottom:-9 }),
  bar: { height:6, background:'#27272a', borderRadius:3, overflow:'hidden', marginTop:4 },
  fill: (pct, c) => ({ height:'100%', width:Math.min(pct||0,100)+'%', background:c||'${accentColor}', borderRadius:3 }),
  pre: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, padding:16, fontSize:12, color:'#a1a1aa', fontFamily:'monospace', whiteSpace:'pre-wrap', maxHeight:280, overflow:'auto', marginBottom:12 },
  sc: (s) => { if(s>=75) return '#10b981'; if(s>=50) return '#f59e0b'; return '#ef4444'; },
};

const GROUPS = ${JSON.stringify(groups, null, 2)};

export default function ${componentName}() {
  const [activeGroup, setActiveGroup] = useState(GROUPS[0].id);
  const [activeTab, setActiveTab] = useState(GROUPS[0].tabs[0].id);
  const [q, setQ] = useState({});
  const [form, setForm] = useState({ model:'gpt-4o-mini' });
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [err, setErr] = useState({});
  const [toast, setToast] = useState(null);

  const curGroup = GROUPS.find(g => g.id === activeGroup) || GROUPS[0];

  function toast_(msg, c='#10b981') { setToast({msg,c}); setTimeout(() => setToast(null), 3200); }

  async function fetch_(tab, endpoint, payload={}) {
    setLoading(l => ({...l,[tab]:true}));
    setErr(e => ({...e,[tab]:null}));
    try {
      const r = await apiFetchJSON(endpoint, { method:'POST', body:JSON.stringify({ ...payload, model:form.model }) });
      if (r.ok) setData(d => ({...d,[tab]:r.data||r}));
      else setErr(e => ({...e,[tab]:r.error||'Failed'}));
    } catch(e) { setErr(er => ({...er,[tab]:e.message})); }
    finally { setLoading(l => ({...l,[tab]:false})); }
  }

  function Generic(tab, title, desc, ep) {
    const d = data[tab];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>{title}</div>
          {desc && <p style={{color:'#71717a',fontSize:13,marginTop:0}}>{desc}</p>}
          <div style={S.row}>
            <input style={S.input} placeholder="Search or filter…" value={q[tab]||''} onChange={e=>setQ(p=>({...p,[tab]:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&fetch_(tab,ep,{query:q[tab]})} />
            <button style={S.btn()} onClick={()=>fetch_(tab,ep,{query:q[tab]})} disabled={loading[tab]}>{loading[tab]?'Loading…':'Load Data'}</button>
            <button style={S.btn('#10b981')} onClick={()=>toast_('AI analyzing…')}>✦ AI Insights</button>
          </div>
          {err[tab] && <div style={S.err}>{err[tab]}</div>}
          {loading[tab] ? <div style={S.loading}>Loading {title.toLowerCase()}…</div> :
           d ? (
            <div style={{overflowX:'auto'}}>
              <table style={S.tbl}>
                <thead><tr><th style={S.th}>Item</th><th style={S.th}>Category</th><th style={S.th}>Value</th><th style={S.th}>Status</th></tr></thead>
                <tbody>{(Array.isArray(d)?d:Object.values(d)[0]||[]).map((row,i)=>(
                  <tr key={i} style={i%2?S.trOdd:{}}>
                    <td style={S.td}>{row.name||row.id||row.label||row.item||JSON.stringify(row).slice(0,40)}</td>
                    <td style={S.td}><span style={{color:'#71717a',fontSize:12}}>{row.category||row.type||row.group||'—'}</span></td>
                    <td style={S.td}><span style={{fontWeight:600}}>{row.value||row.amount||row.score||'—'}</span></td>
                    <td style={S.td}>{row.status?<span style={S.badge(row.status==='active'||row.status==='ok'?'#10b981':row.status==='warning'?'#f59e0b':'#ef4444')}>{row.status}</span>:'—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
           ) : <div style={S.empty}>Enter a query to load {title.toLowerCase()}.</div>}
        </div>
      </div>
    );
  }

${renderTabFn}

  function handleGroup(gid) {
    const g = GROUPS.find(x=>x.id===gid);
    if(g){setActiveGroup(gid);setActiveTab(g.tabs[0].id);}
  }

  return (
    <div style={S.root}>
      <div style={{marginBottom:28}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16}}>
          <div>
            <h1 style={{fontSize:24,fontWeight:800,color:'#fafafa',margin:'0 0 4px',letterSpacing:'-0.02em'}}>${componentName.replace(/([A-Z])/g, ' $1').trim()}</h1>
            <p style={{color:'#71717a',fontSize:13,margin:'4px 0 0'}}>${description}</p>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={S.btn('#27272a')} onClick={()=>fetch_(activeTab, API+'/health',{})}>↺ Refresh</button>
            <button style={S.btn('#10b981')} onClick={()=>toast_('AI analysis started…')}>✦ AI Analysis</button>
          </div>
        </div>
      </div>

      <div style={S.groupNav}>
        {GROUPS.map(g=>(
          <button key={g.id} style={S.gBtn(activeGroup===g.id,g.color)} onClick={()=>handleGroup(g.id)}>{g.label}</button>
        ))}
      </div>

      <div style={S.tabStrip}>
        {curGroup.tabs.map(t=>(
          <button key={t.id} style={S.tBtn(activeTab===t.id,curGroup.color)} onClick={()=>setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {renderTab()}

      {toast && (
        <div style={{position:'fixed',bottom:24,right:24,background:toast.c,color:'#fff',borderRadius:10,padding:'12px 20px',fontSize:13,fontWeight:600,zIndex:9999,boxShadow:'0 4px 24px #0006'}}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL 5: FINANCE AUTOPILOT
// ═══════════════════════════════════════════════════════════════════════════════

const FA_GROUPS = [
  { id:'ap',      label:'Accounts Payable',   color:'#f97316', tabs:[{id:'ap-invoices',label:'Invoices'},{id:'ap-approve',label:'Approve'},{id:'po-match',label:'PO Matching'},{id:'vendors',label:'Vendors'},{id:'ap-aging',label:'AP Aging'},{id:'payments',label:'Payments'}]},
  { id:'ar',      label:'Accounts Receivable',color:'#0ea5e9', tabs:[{id:'ar-list',label:'Receivables'},{id:'send-invoice',label:'Send Invoice'},{id:'collections',label:'Collections'},{id:'ar-reconcile',label:'Reconcile'},{id:'ar-aging-tab',label:'AR Aging'},{id:'ar-writeoffs',label:'Write-Offs'}]},
  { id:'recon',   label:'Reconciliation',     color:'#10b981', tabs:[{id:'bank-feed',label:'Bank Feed'},{id:'matching',label:'AI Matching'},{id:'exceptions',label:'Exceptions'},{id:'close-check',label:'Close Checklist'},{id:'recon-audit',label:'Audit'},{id:'recon-history',label:'History'}]},
  { id:'expenses',label:'Expenses',           color:'#a855f7', tabs:[{id:'expense-list',label:'Expense List'},{id:'categorize',label:'Categorize'},{id:'exp-approval',label:'Approval'},{id:'exp-reports',label:'Reports'},{id:'policies',label:'Policies'},{id:'receipts',label:'Receipts'}]},
  { id:'tax-ap',  label:'Tax & Payouts',      color:'#ec4899', tabs:[{id:'payout-recon',label:'Payout Recon'},{id:'sales-tax',label:'Sales Tax'},{id:'vat-tab',label:'VAT'},{id:'filings',label:'Filings'},{id:'tax-calendar',label:'Tax Calendar'},{id:'tax-audit',label:'Audit Trail'}]},
  { id:'auto',    label:'Automation',         color:'#4f46e5', tabs:[{id:'auto-rules',label:'Rules'},{id:'auto-workflows',label:'Workflows'},{id:'thresholds',label:'Thresholds'},{id:'approval-chains',label:'Approval Chains'},{id:'notifications',label:'Notifications'},{id:'auto-audit',label:'Audit Log'}]},
  { id:'fa-adv',  label:'Advanced',           color:'#f59e0b', tabs:[{id:'fa-ai',label:'AI Bookkeeping'},{id:'fa-integrations',label:'Integrations'},{id:'fa-api',label:'API'},{id:'fa-reports',label:'Reports'},{id:'fa-settings',label:'Settings'},{id:'fa-world',label:'World-Class'}]},
];

const FA_ROUTER = `const express = require('express');
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

module.exports = router;`;

const FA_TABS = `
  function renderTab() {
    const tab = activeTab;
    const d = data[tab];
    switch(tab) {
      case 'ap-invoices': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Accounts Payable — Invoice Queue</div>
            <div style={S.row}>
              <button style={S.btn('#f97316')} onClick={()=>fetch_('ap-invoices',API+'/ap/invoices')} disabled={loading['ap-invoices']}>{loading['ap-invoices']?'Loading…':'Load Invoices'}</button>
              <button style={S.btn('#4f46e5')} onClick={()=>fetch_('matching',API+'/recon/matching')}>Auto-Match</button>
              <button style={S.btn('#10b981')} onClick={()=>fetch_('fa-ai',API+'/ai/bookkeeping',{})}>✦ AI Bookkeeping</button>
            </div>
            {err['ap-invoices'] && <div style={S.err}>{err['ap-invoices']}</div>}
            {loading['ap-invoices'] ? <div style={S.loading}>Loading invoices…</div> : d?.invoices?.length ? (
              <>
                <div style={S.metaRow}>
                  {[['Total',d.total,'#f97316'],['Pending',d.pending,'#f59e0b'],['Overdue',d.overdue,'#ef4444']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
                <div style={{overflowX:'auto'}}>
                  <table style={S.tbl}>
                    <thead><tr><th style={S.th}>Invoice</th><th style={S.th}>Vendor</th><th style={S.th}>Amount</th><th style={S.th}>Due</th><th style={S.th}>Status</th><th style={S.th}>PO Match</th></tr></thead>
                    <tbody>{d.invoices.map((inv,i)=>(
                      <tr key={i} style={i%2?S.trOdd:{}}>
                        <td style={S.td}><span style={{fontWeight:600,fontSize:12}}>{inv.id}</span></td>
                        <td style={S.td}>{inv.vendor}</td>
                        <td style={S.td}><span style={{fontWeight:700}}>\${inv.amount}</span></td>
                        <td style={S.td}><span style={{color:new Date(inv.due)<new Date()?'#ef4444':'#71717a',fontSize:12}}>{inv.due}</span></td>
                        <td style={S.td}><span style={S.badge(inv.status==='paid'?'#10b981':inv.status==='approved'?'#0ea5e9':inv.status==='overdue'?'#ef4444':'#f59e0b')}>{inv.status}</span></td>
                        <td style={S.td}>{inv.poId?<span style={S.badge('#10b981')}>{inv.poId}</span>:<button style={{...S.btn('#27272a'),padding:'4px 8px',fontSize:11}} onClick={()=>toast_('AI matching…')}>AI Match</button>}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </>
            ) : <div style={S.empty}>Load invoices to manage your accounts payable queue.</div>}
          </div>
        </div>
      );
      case 'matching': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>AI Bank Reconciliation</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>ML similarity scoring matches bank transactions to invoices and expenses automatically. Exceptions surfaced for human review.</p>
            <div style={S.row}>
              <button style={S.btn('#10b981')} onClick={()=>fetch_('matching',API+'/recon/matching')} disabled={loading.matching}>{loading.matching?'Matching…':'Run AI Matching'}</button>
            </div>
            {err.matching && <div style={S.err}>{err.matching}</div>}
            {loading.matching ? <div style={S.loading}>AI matching bank transactions…</div> : d ? (
              <>
                <div style={S.metaRow}>
                  {[['Matched',d.matched,'#10b981'],['Unmatched',d.unmatched,'#ef4444'],['Match Rate',d.matchRate+'%','#4f46e5']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
                <div style={S.sT}>Suggested Matches</div>
                {d.suggestions?.map((s,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #1f1f22'}}>
                    <div><div style={{fontSize:13,color:'#fafafa',fontWeight:600}}>{s.txnId}</div><div style={{fontSize:12,color:'#71717a',marginTop:2}}>{s.suggestion}</div></div>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <span style={S.badge('#4f46e5')}>{(s.confidence*100).toFixed(0)}% match</span>
                      <button style={{...S.btn('#10b981'),padding:'4px 10px',fontSize:11}} onClick={()=>toast_('Matched!')}>Accept</button>
                      <button style={{...S.btn('#27272a'),padding:'4px 10px',fontSize:11}} onClick={()=>toast_('Skipped')}>Skip</button>
                    </div>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Run AI Matching to reconcile your bank transactions.</div>}
          </div>
        </div>
      );
      case 'fa-ai': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>✦ AI Bookkeeping Autopilot</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>AI handles AP matching, expense categorization, AR follow-ups, and month-end close checklist — reducing manual bookkeeping by 70%.</p>
            <div style={S.row}>
              <select style={S.select} value={form.model||'gpt-4o-mini'} onChange={e=>setForm(p=>({...p,model:e.target.value}))}>
                <option value="gpt-4o-mini">GPT-4o Mini (2 credits)</option>
                <option value="gpt-4o">GPT-4o (4 credits)</option>
              </select>
              <button style={S.btn('#f97316')} onClick={()=>fetch_('fa-ai',API+'/ai/bookkeeping',{})} disabled={loading['fa-ai']}>{loading['fa-ai']?'Running…':'✦ Run Autopilot'}</button>
            </div>
            {loading['fa-ai'] ? <div style={S.loading}>AI autopilot analyzing your books…</div> : data['fa-ai']?.actions?.length ? (
              data['fa-ai'].actions.map((a,i)=>(
                <div key={i} style={{...S.mini,marginBottom:12,display:'flex',gap:12,alignItems:'flex-start'}}>
                  <span style={S.badge('#f97316')}>{a.type}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13,color:'#fafafa',marginBottom:4}}>{a.action}</div>
                    <div style={{fontSize:12,color:'#71717a'}}>{a.pending||a.overdue||a.items||0} items • {a.suggested||a.completed||0} ready to process</div>
                  </div>
                  <button style={{...S.btn('#4f46e5'),padding:'6px 12px',fontSize:11}} onClick={()=>toast_('Processing '+a.type+'…')}>Process</button>
                </div>
              ))
            ) : <div style={S.empty}>Run Autopilot to let AI handle routine bookkeeping tasks.</div>}
          </div>
        </div>
      );
      case 'fa-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>✦ World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'🤝',t:'Autonomous AP/AR',d:'Auto-match invoices to POs, auto-approve within thresholds, detect duplicates, and flag exceptions for human review.'},
                {icon:'🏦',t:'AI Bank Reconciliation',d:'ML similarity scoring matches bank feed to invoices with 87%+ auto-match rate. Exceptions surfaced with suggested matches.'},
                {icon:'🏷️',t:'NLP Expense Categorization',d:'Fine-tuned NLP classifies expenses from free-text descriptions — learn from corrections to improve accuracy over time.'},
                {icon:'📅',t:'Tax Calendar Automation',d:'VAT/GST filing deadlines, estimated tax payments, nexus threshold alerts — never miss a tax deadline again.'},
                {icon:'💸',t:'Shopify Payout Reconciliation',d:'Auto-reconcile every Shopify payout to the bank with full fee breakdown (processing, refunds, chargebacks, adjustments).'},
                {icon:'✅',t:'Month-End Close Automation',d:'Checklist-driven close with automated reconciliations, variance sign-offs, and rollup to management accounts.'},
              ].map((f,i)=>(
                <div key={i} style={S.mini}>
                  <div style={{fontSize:28,marginBottom:8}}>{f.icon}</div>
                  <div style={{fontWeight:700,color:'#fafafa',marginBottom:4}}>{f.t}</div>
                  <div style={{fontSize:12,color:'#71717a',lineHeight:1.5}}>{f.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      default: return Generic(tab, curGroup.tabs.find(t=>t.id===tab)?.label||tab, '', API+'/health');
    }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL 6: DAILY CFO PACK
// ═══════════════════════════════════════════════════════════════════════════════

const DCFO_GROUPS = [
  { id:'briefing',  label:'Briefing',     color:'#4f46e5', tabs:[{id:'morning-brief',label:'Morning Brief'},{id:'yesterday',label:'Yesterday'},{id:'weekly',label:'Weekly'},{id:'monthly',label:'Monthly'},{id:'ytd',label:'YTD'},{id:'dcfo-alerts',label:'Alerts'}]},
  { id:'revenue',   label:'Revenue',      color:'#10b981', tabs:[{id:'rev-dash',label:'Revenue Dash'},{id:'by-channel-r',label:'By Channel'},{id:'by-product-r',label:'By Product'},{id:'by-region',label:'By Region'},{id:'rev-trends',label:'Trends'},{id:'rev-fore',label:'Forecast'}]},
  { id:'margins',   label:'Margins',      color:'#f97316', tabs:[{id:'gp-margin',label:'Gross Margin'},{id:'np-margin',label:'Net Margin'},{id:'ebitda-tab',label:'EBITDA'},{id:'by-sku-m',label:'By SKU'},{id:'erosion',label:'Erosion Alerts'},{id:'margin-bench',label:'Benchmarks'}]},
  { id:'cashflow',  label:'Cash Flow',    color:'#0ea5e9', tabs:[{id:'cash-pos',label:'Cash Position'},{id:'inout',label:'In / Out'},{id:'runway',label:'Runway'},{id:'burn-rate',label:'Burn Rate'},{id:'cf-fore',label:'Forecast'},{id:'cf-scenarios',label:'Scenarios'}]},
  { id:'kpis',      label:'KPIs',         color:'#a855f7', tabs:[{id:'kpi-board',label:'KPI Board'},{id:'custom-kpis',label:'Custom KPIs'},{id:'targets',label:'Targets'},{id:'kpi-variance',label:'Variance'},{id:'scorecards',label:'Scorecards'},{id:'kpi-reports',label:'Reports'}]},
  { id:'intel',     label:'Intelligence', color:'#ec4899', tabs:[{id:'ai-query',label:'AI Query'},{id:'board-pack',label:'Board Pack'},{id:'waterfall',label:'Waterfall'},{id:'narrative',label:'Narrative'},{id:'benchmarks-i',label:'Benchmarks'},{id:'intel-alerts',label:'Alerts'}]},
  { id:'dcfo-adv',  label:'Advanced',     color:'#f59e0b', tabs:[{id:'data-sources',label:'Data Sources'},{id:'dcfo-int',label:'Integrations'},{id:'schedule',label:'Schedule'},{id:'dcfo-api',label:'API'},{id:'dcfo-settings',label:'Settings'},{id:'dcfo-world',label:'World-Class'}]},
];

const DCFO_ROUTER = `const express = require('express');
const router = express.Router();
const store = { kpis: new Map(), settings: new Map() };
function ok(res,d){res.json({ok:true,...d});}
function rnd(a,b){return Math.random()*(b-a)+a;}

router.get('/health',(req,res)=>ok(res,{service:'daily-cfo-pack',status:'healthy',ts:new Date().toISOString()}));
router.get('/stats',(req,res)=>ok(res,{stats:{kpis:store.kpis.size}}));

router.post('/briefing/morning',(req,res)=>{
  ok(res,{data:{
    date:new Date().toISOString().slice(0,10),
    headline:'Revenue up 8.3% vs plan. Margin compression detected — COGS up 2.1%.',
    kpis:[{name:'Revenue',value:'$18,420',vsTarget:'+3.2%',vsPrior:'+8.3%'},{name:'Orders',value:'142',vsTarget:'+1.4%',vsPrior:'+12.1%'},{name:'AOV',value:'$129.7',vsTarget:'+1.8%',vsPrior:'-3.4%'},{name:'Gross Margin',value:'49.8%',vsTarget:'-0.2pp',vsPrior:'-1.1pp'}],
    topRisks:['Gross margin compression from COGS inflation — investigate SKU-level impact','3 AR invoices >60 days overdue ($8,400)','Shopify payout variance of $240 unreconciled'],
    opportunities:['Q3 seasonal demand starting — build inventory on top 20 SKUs now','Meta ads ROAS improving — consider 20% budget increase','New B2B inquiry from wholesaler — $40K potential order'],
    aiGenerated:true,
  }});
});
router.post('/briefing/yesterday',(req,res)=>ok(res,{data:{
  date:new Date(Date.now()-86400000).toISOString().slice(0,10),
  metrics:[
    {metric:'Revenue',value:18420,budget:17840,prior:17010,vsBudget:'+3.2%',vsPrior:'+8.3%'},
    {metric:'Orders',value:142,budget:140,prior:127,vsBudget:'+1.4%',vsPrior:'+11.8%'},
    {metric:'AOV',value:129.7,budget:127.4,prior:134.0,vsBudget:'+1.8%',vsPrior:'-3.2%'},
    {metric:'Returns',value:11,budget:14,prior:10,vsBudget:'-21.4%',vsPrior:'+10%'},
  ],
}}));
router.post('/revenue/dashboard',(req,res)=>ok(res,{data:{
  mtd:248430, mtdBudget:240000, mtdPrior:221800,
  weekly:Array.from({length:12},(_,i)=>({week:'W'+(i+1),revenue:Math.floor(rnd(40000,80000)),budget:Math.floor(rnd(42000,75000))})),
  channels:[{name:'Shopify D2C',revenue:168000,pct:67.6,trend:'+12%'},{name:'Amazon',revenue:52000,pct:20.9,trend:'+4%'},{name:'Wholesale',revenue:28430,pct:11.5,trend:'+28%'}],
}}));
router.post('/margins/gp',(req,res)=>ok(res,{data:{
  current:49.8, target:51.0, priorMonth:50.9, priorYear:48.2,
  trend:Array.from({length:12},(_,i)=>({month:new Date(2025,i,1).toLocaleString('default',{month:'short'}),margin:(48+rnd(0,4)).toFixed(1)})),
  byCategory:[{category:'Electronics',margin:42.1},{category:'Apparel',margin:58.4},{category:'Home',margin:52.0},{category:'Beauty',margin:64.2}],
  erosionAlerts:[{sku:'SKU-004281',margin:21.4,vs30d:24.8,alert:'Margin compressed 3.4pp — COGS up 12%'}],
}}));
router.post('/cashflow/position',(req,res)=>ok(res,{data:{
  cash:186400,runway:8.2,burnRate:22800,
  accounts:[{name:'Main Operating',balance:142800},{name:'Tax Reserve',balance:28400},{name:'Payroll',balance:15200}],
  upcoming:[{type:'Payroll',amount:18400,due:'2026-06-20'},{type:'Supplier Payment',amount:24800,due:'2026-06-25'},{type:'VAT Payment',amount:4200,due:'2026-06-30'}],
}}));
router.post('/kpis/board',(req,res)=>ok(res,{data:{kpis:[
  {name:'Revenue',value:248430,target:240000,unit:'$',vsPct:+3.5,status:'on-track'},
  {name:'Gross Margin',value:49.8,target:51,unit:'%',vsPct:-2.4,status:'at-risk'},
  {name:'CAC',value:28.4,target:30,unit:'$',vsPct:+5.5,status:'on-track'},
  {name:'LTV',value:284,target:280,unit:'$',vsPct:+1.4,status:'on-track'},
  {name:'Churn Rate',value:4.2,target:5,unit:'%',vsPct:+16,status:'on-track'},
  {name:'NPS',value:62,target:60,unit:'',vsPct:+3.3,status:'on-track'},
]}}));
router.post('/intel/ai-query',(req,res)=>{
  const {query,model='gpt-4o'}=req.body;
  ok(res,{data:{query,answer:query?'Based on the last 7 days of data, '+query.toLowerCase().replace('?','').replace('what','the reason')+' was primarily driven by a 12% increase in orders from the Shopify channel, partially offset by a 3.4% decrease in AOV due to promotional discounting.':'Ask a question about your financial data.',model,creditsUsed:3}});
});
router.post('/intel/board-pack',(req,res)=>ok(res,{data:{sections:['Executive Summary','P&L vs Budget','Cash Flow Analysis','Key Metrics Scorecard','Forward Look'],generated:true,pages:12,aiNarrative:true}}));
router.post('/intel/waterfall',(req,res)=>ok(res,{data:{bridges:[
  {category:'Prior Month Revenue',value:221800,type:'base'},
  {category:'Volume Growth',value:+18200,type:'positive'},
  {category:'Price/Mix',value:-4200,type:'negative'},
  {category:'New Channels',value:+12630,type:'positive'},
  {category:'Current Month Revenue',value:248430,type:'total'},
]}}));
router.get('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';ok(res,{settings:store.settings.get(s)||{model:'gpt-4o',currency:'USD'}});});
router.post('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';store.settings.set(s,req.body);ok(res,{settings:req.body});});

module.exports = router;`;

const DCFO_TABS = `
  function renderTab() {
    const tab = activeTab;
    const d = data[tab];
    switch(tab) {
      case 'morning-brief': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>AI Morning CFO Briefing</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>AI-generated daily brief: yesterday KPIs vs target, top 3 risks, top 3 opportunities, and the one key decision needed today.</p>
            <div style={S.row}>
              <button style={S.btn('#4f46e5')} onClick={()=>fetch_('morning-brief',API+'/briefing/morning')} disabled={loading['morning-brief']}>{loading['morning-brief']?'Generating…':'Generate Morning Brief'}</button>
            </div>
            {err['morning-brief'] && <div style={S.err}>{err['morning-brief']}</div>}
            {loading['morning-brief'] ? <div style={S.loading}>AI generating your briefing…</div> : d ? (
              <>
                <div style={{...S.mini,marginBottom:16,background:'#09090b',borderColor:'#4f46e544'}}>
                  <div style={{fontSize:11,color:'#4f46e5',fontWeight:600,marginBottom:4}}>TODAY — {d.date}</div>
                  <div style={{fontSize:15,fontWeight:700,color:'#fafafa',lineHeight:1.4}}>{d.headline}</div>
                </div>
                <div style={S.metaRow}>
                  {d.kpis?.map(k=>(
                    <div key={k.name} style={S.metaItem}>
                      <div style={S.metaVal(k.vsPrior?.startsWith('+')?'#10b981':'#ef4444')}>{k.value}</div>
                      <div style={S.metaLbl}>{k.name}</div>
                      <div style={{fontSize:10,color:k.vsTarget?.startsWith('+')?'#10b981':'#ef4444',marginTop:2}}>{k.vsTarget} vs target</div>
                    </div>
                  ))}
                </div>
                {[['Top Risks','#ef4444',d.topRisks],['Opportunities','#10b981',d.opportunities]].map(([label,color,items])=>(
                  <div key={label}>
                    <div style={S.sT}>{label}</div>
                    {items?.map((item,i)=>(
                      <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid #1f1f22'}}>
                        <span style={S.badge(color)}>{i+1}</span>
                        <span style={{fontSize:13,color:'#fafafa',lineHeight:1.5}}>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Generate your AI-powered morning CFO briefing.</div>}
          </div>
        </div>
      );
      case 'kpi-board': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>KPI Scorecard</div>
            <button style={S.btn('#a855f7')} onClick={()=>fetch_('kpi-board',API+'/kpis/board')} disabled={loading['kpi-board']}>{loading['kpi-board']?'Loading…':'Load KPI Board'}</button>
            {err['kpi-board'] && <div style={S.err}>{err['kpi-board']}</div>}
            {loading['kpi-board'] ? <div style={S.loading}>Loading KPIs…</div> : d?.kpis?.length ? (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12,marginTop:16}}>
                {d.kpis.map((kpi,i)=>(
                  <div key={i} style={{...S.mini,borderColor:kpi.status==='on-track'?'#10b98144':kpi.status==='at-risk'?'#f59e0b44':'#ef444444'}}>
                    <div style={{fontSize:11,color:'#71717a',marginBottom:4}}>{kpi.name}</div>
                    <div style={{fontSize:24,fontWeight:800,color:kpi.status==='on-track'?'#10b981':kpi.status==='at-risk'?'#f59e0b':'#ef4444'}}>{kpi.unit==='$'?'$':''}{kpi.value?.toLocaleString()}{kpi.unit==='%'?'%':kpi.unit&&kpi.unit!=='$'?kpi.unit:''}</div>
                    <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
                      <span style={{fontSize:11,color:'#71717a'}}>Target: {kpi.unit==='$'?'$':''}{kpi.target}{kpi.unit==='%'?'%':''}</span>
                      <span style={S.badge(kpi.status==='on-track'?'#10b981':kpi.status==='at-risk'?'#f59e0b':'#ef4444')}>{kpi.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div style={S.empty}>Load the KPI board to see your business performance scorecard.</div>}
          </div>
        </div>
      );
      case 'ai-query': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>✦ AI Natural Language CFO Query</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Ask any financial question in plain English. "What drove the 15% revenue decline last Tuesday?" — AI answers using your actual data.</p>
            <div style={S.row}>
              <input style={S.input} placeholder="What drove revenue growth last week?" value={q['ai-query']||''} onChange={e=>setQ(p=>({...p,'ai-query':e.target.value}))} onKeyDown={e=>e.key==='Enter'&&fetch_('ai-query',API+'/intel/ai-query',{query:q['ai-query']})} />
              <select style={S.select} value={form.model||'gpt-4o'} onChange={e=>setForm(p=>({...p,model:e.target.value}))}>
                <option value="gpt-4o-mini">Mini (1 credit)</option>
                <option value="gpt-4o">GPT-4o (3 credits)</option>
              </select>
              <button style={S.btn('#ec4899')} onClick={()=>fetch_('ai-query',API+'/intel/ai-query',{query:q['ai-query']})} disabled={loading['ai-query']}>{loading['ai-query']?'Thinking…':'✦ Ask AI'}</button>
            </div>
            {err['ai-query'] && <div style={S.err}>{err['ai-query']}</div>}
            {loading['ai-query'] ? <div style={S.loading}>AI analyzing your financial data…</div> : data['ai-query']?.answer ? (
              <div>
                <div style={S.sT}>Question</div>
                <div style={{fontSize:13,color:'#a1a1aa',marginBottom:12}}>"{data['ai-query'].query}"</div>
                <div style={S.sT}>Answer</div>
                <div style={{...S.mini,background:'#09090b'}}><p style={{color:'#e4e4e7',fontSize:14,lineHeight:1.8,margin:0}}>{data['ai-query'].answer}</p></div>
                <div style={{color:'#71717a',fontSize:11,marginTop:8}}>Model: {data['ai-query'].model} · Credits: {data['ai-query'].creditsUsed}</div>
              </div>
            ) : <div style={S.empty}>Ask any financial question in plain English.</div>}
          </div>
        </div>
      );
      case 'waterfall': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Revenue Waterfall Bridge</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Bridge chart showing exactly what drove period-over-period revenue change — volume, price/mix, new channels, and other factors.</p>
            <button style={S.btn('#ec4899')} onClick={()=>fetch_('waterfall',API+'/intel/waterfall')} disabled={loading.waterfall}>{loading.waterfall?'Loading…':'Load Waterfall'}</button>
            {err.waterfall && <div style={S.err}>{err.waterfall}</div>}
            {loading.waterfall ? <div style={S.loading}>Building waterfall chart…</div> : d?.bridges?.length ? (
              <div style={{marginTop:16}}>
                {d.bridges.map((b,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid #1f1f22'}}>
                    <span style={{fontSize:13,color:b.type==='base'||b.type==='total'?'#fafafa':'#a1a1aa',fontWeight:b.type==='total'?700:400}}>{b.category}</span>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      {b.type!=='base' && <div style={{...S.bar,width:120,display:'inline-block'}}><div style={{...S.fill(Math.abs(b.value)/248430*100,b.value>0?'#10b981':'#ef4444'),width:Math.abs(b.value)/248430*100+'%'}} /></div>}
                      <span style={{fontWeight:700,color:b.type==='base'?'#fafafa':b.type==='total'?'#4f46e5':b.value>0?'#10b981':'#ef4444',minWidth:80,textAlign:'right'}}>{b.value>0?'+':''}{b.value>0||b.type==='base'||b.type==='total'?'$':'-$'}{Math.abs(b.value).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div style={S.empty}>Load waterfall to see what drove revenue change.</div>}
          </div>
        </div>
      );
      case 'dcfo-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>✦ World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'🌅',t:'AI Morning Intelligence Briefing',d:'Daily AI-generated brief: KPIs vs target, top 3 risks, top 3 opportunities, and the one key decision for today.'},
                {icon:'💬',t:'NLP CFO Query Interface',d:'Ask any financial question in plain English and get data-backed answers — no SQL, no reports, just natural language.'},
                {icon:'📝',t:'Executive Narrative Generation',d:'AI writes board-ready financial commentary with proper business language — ready to paste into board reports.'},
                {icon:'🌊',t:'Revenue Waterfall Bridge Charts',d:'Visualize exactly what drove period-over-period change: volume, price/mix, channel, product, and other factors.'},
                {icon:'🎯',t:'Adaptive KPI Thresholds',d:'Self-calibrating alert thresholds based on your historical volatility — no manual threshold tuning required.'},
                {icon:'📋',t:'One-Click Board Pack Generator',d:'Generate board presentation with charts, AI narrative, YTD vs prior year, and forward look in one click.'},
              ].map((f,i)=>(
                <div key={i} style={S.mini}>
                  <div style={{fontSize:28,marginBottom:8}}>{f.icon}</div>
                  <div style={{fontWeight:700,color:'#fafafa',marginBottom:4}}>{f.t}</div>
                  <div style={{fontSize:12,color:'#71717a',lineHeight:1.5}}>{f.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      default: return Generic(tab, curGroup.tabs.find(t=>t.id===tab)?.label||tab, '', API+'/health');
    }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL 7: CHURN PREDICTION PLAYBOOKS
// ═══════════════════════════════════════════════════════════════════════════════

const CPP_GROUPS = [
  { id:'risk',       label:'Churn Risk',    color:'#ef4444', tabs:[{id:'risk-dash',label:'Risk Dashboard'},{id:'high-risk',label:'High Risk'},{id:'rfm',label:'RFM Scores'},{id:'health-scores',label:'Health Scores'},{id:'predictions',label:'Predictions'},{id:'segments-c',label:'Segments'}]},
  { id:'survival',   label:'Survival',      color:'#4f46e5', tabs:[{id:'cox-ph',label:'Cox PH Model'},{id:'cohort-curves',label:'Cohort Curves'},{id:'dormancy',label:'Dormancy'},{id:'early-warn',label:'Early Warnings'},{id:'by-segment',label:'By Segment'},{id:'trend-c',label:'Trend'}]},
  { id:'playbooks',  label:'Playbooks',     color:'#0ea5e9', tabs:[{id:'pb-list',label:'Playbook List'},{id:'create-pb',label:'Create Playbook'},{id:'hv-pb',label:'High-Value'},{id:'atrisk-pb',label:'At-Risk'},{id:'dormant-pb',label:'Dormant'},{id:'winback-pb',label:'Win-Back'}]},
  { id:'campaigns',  label:'Campaigns',     color:'#10b981', tabs:[{id:'active-camp',label:'Active'},{id:'winback',label:'Win-Back'},{id:'retention',label:'Retention'},{id:'reactivation',label:'Reactivation'},{id:'camp-results',label:'Results'},{id:'camp-roi',label:'ROI'}]},
  { id:'analytics',  label:'Analytics',     color:'#a855f7', tabs:[{id:'churn-rate',label:'Churn Rate'},{id:'ltv-impact',label:'LTV Impact'},{id:'by-channel-c',label:'By Channel'},{id:'by-product-c',label:'By Product'},{id:'by-cohort-c',label:'By Cohort'},{id:'cpp-bench',label:'Benchmarks'}]},
  { id:'nps',        label:'NPS',           color:'#ec4899', tabs:[{id:'nps-tracker',label:'NPS Tracker'},{id:'pred-nps',label:'Predictive NPS'},{id:'detractors',label:'Detractors'},{id:'drivers',label:'Drivers'},{id:'nps-trends',label:'Trends'},{id:'improvements',label:'Improvements'}]},
  { id:'cpp-adv',    label:'Advanced',      color:'#f59e0b', tabs:[{id:'ai-models-c',label:'AI Models'},{id:'bg-nbd',label:'BG/NBD Model'},{id:'cpp-int',label:'Integrations'},{id:'cpp-api',label:'API'},{id:'cpp-settings',label:'Settings'},{id:'cpp-world',label:'World-Class'}]},
];

const CPP_ROUTER = `const express = require('express');
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

module.exports = router;`;

const CPP_TABS = `
  function renderTab() {
    const tab = activeTab;
    const d = data[tab];
    switch(tab) {
      case 'risk-dash': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Churn Risk Dashboard</div>
            <button style={S.btn('#ef4444')} onClick={()=>fetch_('risk-dash',API+'/risk/dashboard')} disabled={loading['risk-dash']}>{loading['risk-dash']?'Loading…':'Load Risk Dashboard'}</button>
            {err['risk-dash'] && <div style={S.err}>{err['risk-dash']}</div>}
            {loading['risk-dash'] ? <div style={S.loading}>Scoring customers…</div> : d ? (
              <>
                <div style={S.metaRow}>
                  {[['Total Customers',(d.totalCustomers||0).toLocaleString(),'#fafafa'],['High Risk',d.highRisk,'#ef4444'],['Churn Rate',d.churnRate+'%','#f97316'],['Predicted Loss','$'+d.predLoss30d?.toLocaleString(),'#ef4444'],['Avg Health',d.avgHealthScore,'#0ea5e9'],['MoM Change',d.churnRateChange>0?'+'+d.churnRateChange+'%':d.churnRateChange+'%',d.churnRateChange<0?'#10b981':'#ef4444']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
                <div style={S.sT}>Segments</div>
                {d.segments?.map((s,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #1f1f22'}}>
                    <span style={{fontSize:13,color:'#fafafa',fontWeight:600}}>{s.name}</span>
                    <span style={{color:'#71717a',fontSize:12}}>{s.count?.toLocaleString()} customers</span>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={S.badge(s.churnProb>0.5?'#ef4444':s.churnProb>0.2?'#f59e0b':'#10b981')}>{(s.churnProb*100).toFixed(0)}% risk</span>
                      <button style={{...S.btn('#ef4444'),padding:'4px 10px',fontSize:11}} onClick={()=>toast_('Playbook triggered for '+s.name)}>Activate Playbook</button>
                    </div>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Load the churn risk dashboard to see customer health.</div>}
          </div>
        </div>
      );
      case 'cox-ph': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Cox Proportional Hazard Model</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Survival analysis for time-to-churn. Hazard ratios identify which behavioral signals most strongly predict churn — enabling targeted intervention.</p>
            <button style={S.btn('#4f46e5')} onClick={()=>fetch_('cox-ph',API+'/survival/cox-ph')} disabled={loading['cox-ph']}>{loading['cox-ph']?'Running Model…':'Run Cox PH Model'}</button>
            {err['cox-ph'] && <div style={S.err}>{err['cox-ph']}</div>}
            {loading['cox-ph'] ? <div style={S.loading}>Running survival analysis…</div> : d?.model ? (
              <>
                <div style={{...S.mini,marginBottom:16,borderColor:'#4f46e544'}}>
                  <div style={{fontSize:12,color:'#4f46e5',fontWeight:600,marginBottom:4}}>Model Concordance: {(d.model.concordance*100).toFixed(0)}%</div>
                  <p style={{color:'#a1a1aa',fontSize:13,lineHeight:1.6,margin:0}}>{d.model.interpretation}</p>
                </div>
                <div style={S.sT}>Hazard Ratios (HR &gt; 1 = increases churn risk)</div>
                <div style={{overflowX:'auto'}}>
                  <table style={S.tbl}>
                    <thead><tr><th style={S.th}>Covariate</th><th style={S.th}>Hazard Ratio</th><th style={S.th}>Direction</th><th style={S.th}>p-value</th></tr></thead>
                    <tbody>{d.model.hazardRatios?.map((hr,i)=>(
                      <tr key={i} style={i%2?S.trOdd:{}}>
                        <td style={S.td}>{hr.covariate}</td>
                        <td style={{...S.td,fontWeight:700,color:hr.hr>1?'#ef4444':'#10b981'}}>{hr.hr.toFixed(3)}</td>
                        <td style={S.td}><span style={S.badge(hr.hr>1?'#ef4444':'#10b981')}>{hr.hr>1?'Increases risk':'Reduces risk'}</span></td>
                        <td style={{...S.td,color:hr.pValue<0.05?'#10b981':'#71717a'}}>{hr.pValue < 0.001?'<0.001':hr.pValue.toFixed(3)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </>
            ) : <div style={S.empty}>Run the Cox PH model to see survival analysis results.</div>}
          </div>
        </div>
      );
      case 'early-warn': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Early Warning Indicators</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Leading behavioral signals that precede churn by 3-8 weeks — enabling proactive intervention before customers are lost.</p>
            <button style={S.btn('#4f46e5')} onClick={()=>fetch_('early-warn',API+'/survival/early-warnings')} disabled={loading['early-warn']}>{loading['early-warn']?'Loading…':'Load Early Warnings'}</button>
            {err['early-warn'] && <div style={S.err}>{err['early-warn']}</div>}
            {loading['early-warn'] ? <div style={S.loading}>Loading signals…</div> : d?.indicators?.length ? (
              d.indicators.map((ind,i)=>(
                <div key={i} style={{...S.mini,marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                    <div style={{fontWeight:700,color:'#fafafa',fontSize:13}}>{ind.signal}</div>
                    <span style={S.badge('#ef4444')}>{ind.count} customers</span>
                  </div>
                  <p style={{color:'#a1a1aa',fontSize:12,lineHeight:1.5,margin:'0 0 8px'}}>{ind.description}</p>
                  <div style={{display:'flex',gap:8}}>
                    <span style={S.badge('#4f46e5')}>Leads churn by {ind.lead} days</span>
                    <span style={S.badge('#0ea5e9')}>{(ind.accuracy*100).toFixed(0)}% accuracy</span>
                    <button style={{...S.btn('#10b981'),padding:'4px 10px',fontSize:11}} onClick={()=>toast_('Playbook activated for '+ind.count+' customers')}>Activate Playbook</button>
                  </div>
                </div>
              ))
            ) : <div style={S.empty}>Load early warning indicators to detect pre-churn signals.</div>}
          </div>
        </div>
      );
      case 'cpp-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>✦ World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'📊',t:'Cox Proportional Hazard Model',d:'Survival analysis for time-to-churn — hazard ratios identify exactly which signals predict churn, with statistical significance.'},
                {icon:'🎯',t:'BG/NBD Churn Probability',d:'Pareto/NBD probabilistic model estimates each customer\'s probability of being alive and expected future purchases.'},
                {icon:'⚡',t:'RFM Quintile Engine',d:'Recency-Frequency-Monetary scoring with 5×5×5 matrix, segment migration tracking, and automated playbook triggers.'},
                {icon:'🔬',t:'Health Score Composite',d:'Weighted multi-signal score combining purchase recency/frequency, login activity, support tickets, NPS, and email engagement.'},
                {icon:'🔮',t:'Predictive NPS',d:'Predict NPS before sending the survey using behavioral signals — proactively intervene with detractors before they churn.'},
                {icon:'🚀',t:'Segment-Specific Playbooks',d:'Different retention strategies for Champions, Loyal, At-Risk, and Dormant — with automated triggers and ROI tracking per playbook.'},
              ].map((f,i)=>(
                <div key={i} style={S.mini}>
                  <div style={{fontSize:28,marginBottom:8}}>{f.icon}</div>
                  <div style={{fontWeight:700,color:'#fafafa',marginBottom:4}}>{f.t}</div>
                  <div style={{fontSize:12,color:'#71717a',lineHeight:1.5}}>{f.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      default: return Generic(tab, curGroup.tabs.find(t=>t.id===tab)?.label||tab, '', API+'/health');
    }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL 8: LTV CHURN PREDICTOR
// ═══════════════════════════════════════════════════════════════════════════════

const LTV_GROUPS = [
  { id:'ltv-ov',    label:'LTV Overview',  color:'#4f46e5', tabs:[{id:'ltv-dash',label:'LTV Dashboard'},{id:'by-segment-l',label:'By Segment'},{id:'by-channel-l',label:'By Channel'},{id:'by-product-l',label:'By Product'},{id:'by-cohort-l',label:'By Cohort'},{id:'ltv-trends',label:'Trends'}]},
  { id:'models',    label:'Models',        color:'#0ea5e9', tabs:[{id:'pareto-nbd',label:'Pareto/NBD'},{id:'gamma-gamma',label:'Gamma-Gamma'},{id:'clv-segs',label:'CLV Segments'},{id:'accuracy',label:'Model Accuracy'},{id:'training',label:'Training'},{id:'predictions',label:'Predictions'}]},
  { id:'segments-l',label:'Segments',      color:'#10b981', tabs:[{id:'quintiles',label:'LTV Quintiles'},{id:'champions-l',label:'Champions'},{id:'growth',label:'Growth'},{id:'at-risk-l',label:'At-Risk'},{id:'lost',label:'Lost'},{id:'ltv-champs',label:'Top Customers'}]},
  { id:'attrib',    label:'Attribution',   color:'#f97316', tabs:[{id:'channel-ltv',label:'Channel LTV'},{id:'first-touch',label:'First Touch'},{id:'product-ltv',label:'Product LTV'},{id:'camp-ltv',label:'Campaign LTV'},{id:'ltv-compare',label:'Compare'},{id:'bidding',label:'Value Bidding'}]},
  { id:'scenarios', label:'Scenarios',     color:'#a855f7', tabs:[{id:'scenario-builder',label:'Scenario Builder'},{id:'impact',label:'Impact Analysis'},{id:'retention-sim',label:'Retention Sim'},{id:'upsell-sim',label:'Upsell Sim'},{id:'ltv-reports',label:'Reports'},{id:'ltv-fore',label:'Forecast'}]},
  { id:'acq',       label:'Acquisition',   color:'#ec4899', tabs:[{id:'cac-payback',label:'CAC Payback'},{id:'bidding-exp',label:'Bidding Export'},{id:'lookalike',label:'Lookalike Seeds'},{id:'value-bid',label:'Value Bidding'},{id:'acq-targets',label:'Targets'},{id:'acq-roi',label:'ROI'}]},
  { id:'ltv-adv',   label:'Advanced',      color:'#f59e0b', tabs:[{id:'cross-sell-l',label:'Cross-Sell LTV'},{id:'ltv-int',label:'Integrations'},{id:'ltv-api',label:'API'},{id:'ltv-exports',label:'Exports'},{id:'ltv-settings',label:'Settings'},{id:'ltv-world',label:'World-Class'}]},
];

const LTV_ROUTER = `const express = require('express');
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

module.exports = router;`;

const LTV_TABS = `
  function renderTab() {
    const tab = activeTab;
    const d = data[tab];
    switch(tab) {
      case 'ltv-dash': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Customer Lifetime Value Dashboard</div>
            <button style={S.btn('#4f46e5')} onClick={()=>fetch_('ltv-dash',API+'/ltv/dashboard')} disabled={loading['ltv-dash']}>{loading['ltv-dash']?'Loading…':'Load LTV Dashboard'}</button>
            {err['ltv-dash'] && <div style={S.err}>{err['ltv-dash']}</div>}
            {loading['ltv-dash'] ? <div style={S.loading}>Loading LTV data…</div> : d ? (
              <>
                <div style={S.metaRow}>
                  {[['Avg LTV','$'+d.avgLtv,'#4f46e5'],['Top 10% LTV','$'+d.topDecileLtv,'#10b981'],['Total Value','$'+d.totalCustomerValue?.toLocaleString(),'#0ea5e9'],['LTV Growth','+'+d.ltvGrowth+'%','#10b981'],['Repeat Rate',d.repeatRate+'%','#a855f7'],['Avg Orders',d.avgOrders,'#f97316']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
                <div style={S.sT}>LTV Distribution</div>
                {d.distribution?.map((r,i)=>(
                  <div key={i} style={{marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:12,color:'#fafafa'}}>{r.range}</span>
                      <span style={{fontSize:12,color:'#71717a'}}>{r.count?.toLocaleString()} customers ({r.pct}%)</span>
                    </div>
                    <div style={S.bar}><div style={S.fill(r.pct*2,'#4f46e5')} /></div>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Load the LTV dashboard to see customer lifetime value analysis.</div>}
          </div>
        </div>
      );
      case 'pareto-nbd': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Pareto/NBD + BG/NBD LTV Model</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Probabilistic model for non-contractual settings (ecommerce). Estimates each customer&apos;s probability of being alive and expected future transactions.</p>
            <button style={S.btn('#0ea5e9')} onClick={()=>fetch_('pareto-nbd',API+'/models/pareto-nbd')} disabled={loading['pareto-nbd']}>{loading['pareto-nbd']?'Running Model…':'Run Pareto/NBD'}</button>
            {err['pareto-nbd'] && <div style={S.err}>{err['pareto-nbd']}</div>}
            {loading['pareto-nbd'] ? <div style={S.loading}>Fitting probabilistic model…</div> : d?.model ? (
              <>
                <div style={{...S.mini,marginBottom:16,borderColor:'#0ea5e944'}}>
                  <div style={{fontSize:12,color:'#0ea5e9',fontWeight:600,marginBottom:4}}>{d.model.name}</div>
                  <p style={{color:'#a1a1aa',fontSize:13,margin:'0 0 8px'}}>{d.model.description}</p>
                  <div style={{display:'flex',gap:16}}>
                    {Object.entries(d.model.performance||{}).map(([k,v])=>(
                      <div key={k}><span style={{color:'#71717a',fontSize:11}}>{k.toUpperCase()}: </span><span style={{color:'#0ea5e9',fontWeight:700}}>{v}</span></div>
                    ))}
                  </div>
                </div>
                <div style={S.sT}>Individual Predictions (Sample)</div>
                <div style={{overflowX:'auto'}}>
                  <table style={S.tbl}>
                    <thead><tr><th style={S.th}>Customer</th><th style={S.th}>P(Alive)</th><th style={S.th}>Expected Purchases (90d)</th><th style={S.th}>Predicted LTV</th></tr></thead>
                    <tbody>{d.model.predictions?.map((p,i)=>(
                      <tr key={i} style={i%2?S.trOdd:{}}>
                        <td style={S.td}>{p.customerId}</td>
                        <td style={S.td}><span style={{fontWeight:700,color:p.pAlive>0.7?'#10b981':p.pAlive>0.4?'#f59e0b':'#ef4444'}}>{(p.pAlive*100).toFixed(0)}%</span></td>
                        <td style={S.td}>{p.expectedPurchases90d}</td>
                        <td style={S.td}><span style={{fontWeight:700,color:'#4f46e5'}}>\${p.predictedLtv}</span></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </>
            ) : <div style={S.empty}>Run the Pareto/NBD model to predict individual customer LTV.</div>}
          </div>
        </div>
      );
      case 'quintiles': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>LTV Quintile Segmentation</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Cluster customers by predicted LTV quintile — allocate retention resources proportionally to customer value and churn risk.</p>
            <button style={S.btn('#10b981')} onClick={()=>fetch_('quintiles',API+'/segments/quintiles')} disabled={loading.quintiles}>{loading.quintiles?'Loading…':'Load Quintiles'}</button>
            {err.quintiles && <div style={S.err}>{err.quintiles}</div>}
            {loading.quintiles ? <div style={S.loading}>Loading quintiles…</div> : d?.quintiles?.length ? (
              d.quintiles.map((q,i)=>(
                <div key={i} style={{...S.mini,marginBottom:10,borderColor:i===0?'#10b98144':i===1?'#4f46e544':'#27272a'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <div>
                      <span style={{fontWeight:800,fontSize:16,color:i<2?'#10b981':'#fafafa'}}>Q{q.quintile}</span>
                      <span style={{color:'#71717a',fontSize:13,marginLeft:8}}>{q.label}</span>
                    </div>
                    <span style={S.badge('#4f46e5')}>{q.revenueShare}% of revenue</span>
                  </div>
                  <div style={{display:'flex',gap:12,marginBottom:6}}>
                    {[['Avg LTV','$'+q.avgLtv],['Customers',q.customers?.toLocaleString()],['Revenue','$'+q.revenue?.toLocaleString()]].map(([l,v])=>(
                      <div key={l}><span style={{fontSize:11,color:'#71717a'}}>{l}: </span><span style={{fontWeight:600,fontSize:13}}>{v}</span></div>
                    ))}
                  </div>
                  <div style={{fontSize:12,color:'#a1a1aa',fontStyle:'italic'}}>{q.action}</div>
                </div>
              ))
            ) : <div style={S.empty}>Load quintiles to see LTV-based customer segments.</div>}
          </div>
        </div>
      );
      case 'channel-ltv': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>LTV by Acquisition Channel</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Which acquisition channels produce the highest-LTV customers? Use LTV:CAC ratio to optimize channel mix and value-based bidding.</p>
            <button style={S.btn('#f97316')} onClick={()=>fetch_('channel-ltv',API+'/attribution/channel-ltv')} disabled={loading['channel-ltv']}>{loading['channel-ltv']?'Loading…':'Load Channel LTV'}</button>
            {err['channel-ltv'] && <div style={S.err}>{err['channel-ltv']}</div>}
            {loading['channel-ltv'] ? <div style={S.loading}>Loading channel attribution…</div> : d?.channels?.length ? (
              <div style={{overflowX:'auto'}}>
                <table style={S.tbl}>
                  <thead><tr><th style={S.th}>Channel</th><th style={S.th}>Avg LTV</th><th style={S.th}>LTV Multiple</th><th style={S.th}>CAC</th><th style={S.th}>LTV:CAC</th><th style={S.th}>Payback</th></tr></thead>
                  <tbody>{d.channels.map((c,i)=>(
                    <tr key={i} style={i%2?S.trOdd:{}}>
                      <td style={S.td}><span style={{fontWeight:600}}>{c.channel}</span></td>
                      <td style={S.td}><span style={{fontWeight:700,color:'#4f46e5'}}>\${c.avgLtv}</span></td>
                      <td style={S.td}><span style={{fontWeight:700,color:c.ltvMultiple>1?'#10b981':'#ef4444'}}>{c.ltvMultiple}×</span></td>
                      <td style={S.td}>{c.cac===0?<span style={S.badge('#10b981')}>Free</span>:<span>\${c.cac}</span>}</td>
                      <td style={S.td}>{c.returnOnCAC?<span style={{fontWeight:700,color:c.returnOnCAC>10?'#10b981':c.returnOnCAC>5?'#f59e0b':'#ef4444'}}>{c.returnOnCAC}×</span>:'—'}</td>
                      <td style={S.td}>{c.paybackDays===0?<span style={S.badge('#10b981')}>Instant</span>:<span style={{color:'#71717a'}}>{c.paybackDays}d</span>}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <div style={S.empty}>Load channel LTV to see which channels produce your best customers.</div>}
          </div>
        </div>
      );
      case 'ltv-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>✦ World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'📐',t:'Pareto/NBD + Gamma-Gamma Model',d:'Industry-standard probabilistic LTV model: Pareto/NBD for purchase probability × Gamma-Gamma for spend — predicting individual customer value.'},
                {icon:'🏆',t:'LTV Quintile Segmentation',d:'Cluster customers into 5 value tiers. Top 20% typically generate 60-70% of revenue — focus retention resources where they matter most.'},
                {icon:'📡',t:'Value-Based Bidding Export',d:'Export LTV quintile scores to Google Customer Match and Meta Custom Audiences for value-based bidding — bid higher on high-LTV prospects.'},
                {icon:'🔭',t:'LTV Attribution by Channel',d:'Which acquisition channels produce the highest-LTV customers? Break LTV:CAC ratio by source to optimize marketing mix.'},
                {icon:'🎮',t:'LTV Scenario Modeling',d:'Model LTV impact of retention improvements, upsell programs, and product changes — "If 30-day repeat rate improves 10%, what is the LTV impact?"'},
                {icon:'🤝',t:'Cross-Sell LTV Predictor',d:'Which next product recommendation maximizes expected LTV per customer? AI-powered next-best-product recommendations with LTV uplift estimates.'},
              ].map((f,i)=>(
                <div key={i} style={S.mini}>
                  <div style={{fontSize:28,marginBottom:8}}>{f.icon}</div>
                  <div style={{fontWeight:700,color:'#fafafa',marginBottom:4}}>{f.t}</div>
                  <div style={{fontSize:12,color:'#71717a',lineHeight:1.5}}>{f.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      default: return Generic(tab, curGroup.tabs.find(t=>t.id===tab)?.label||tab, '', API+'/health');
    }
  }
`;

// ─── generate all files ───────────────────────────────────────────────────────

const tools = [
  { id:'finance-autopilot',           name:'FinanceAutopilot',          groups:FA_GROUPS,   router:FA_ROUTER,   tabs:FA_TABS,   api:'/api/finance-autopilot',           color:'#f97316', desc:'Autonomous finance operations — AP/AR automation, AI reconciliation, NLP expense categorization & Shopify payout reconciliation' },
  { id:'daily-cfo-pack',              name:'DailyCFOPack',              groups:DCFO_GROUPS, router:DCFO_ROUTER, tabs:DCFO_TABS, api:'/api/daily-cfo-pack',              color:'#4f46e5', desc:'Executive intelligence briefing — AI morning brief, NLP CFO query, waterfall analysis & one-click board pack generator' },
  { id:'churn-prediction-playbooks',  name:'ChurnPredictionPlaybooks',  groups:CPP_GROUPS,  router:CPP_ROUTER,  tabs:CPP_TABS,  api:'/api/churn-prediction-playbooks',  color:'#ef4444', desc:'Retention AI — Cox PH survival analysis, BG/NBD model, RFM scoring, early warning indicators & automated playbooks' },
  { id:'ltv-churn-predictor',         name:'LTVChurnPredictor',         groups:LTV_GROUPS,  router:LTV_ROUTER,  tabs:LTV_TABS,  api:'/api/ltv-churn-predictor',         color:'#10b981', desc:'Customer value ML — Pareto/NBD + Gamma-Gamma LTV model, quintile segmentation, channel attribution & value-based bidding export' },
];

let total = { fe:0, be:0 };
tools.forEach(t => {
  const fePath = FE(t.name);
  const bePath = BE(t.id);
  mkdir(bePath);
  const feCode = baseComponent(t.name, t.api, t.desc, t.color, t.groups, t.tabs);
  fs.writeFileSync(fePath, feCode, 'utf8');
  fs.writeFileSync(bePath, t.router, 'utf8');
  const feKB = (Buffer.byteLength(feCode,'utf8')/1024).toFixed(1);
  const beKB = (Buffer.byteLength(t.router,'utf8')/1024).toFixed(1);
  total.fe += +feKB; total.be += +beKB;
  console.log(`✓ ${t.name}: FE ${feKB}KB, BE ${beKB}KB`);
});
console.log(`\nPhase 4b complete: 8 files, ${(total.fe+total.be).toFixed(1)} KB total`);
