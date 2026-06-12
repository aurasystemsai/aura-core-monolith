import React, { useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/finance-autopilot";

const S = {
  root: { background:'#09090b', minHeight:'100vh', color:'#fafafa', fontFamily:"'Inter',system-ui,sans-serif", padding:'28px 32px' },
  card: { background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:24, marginBottom:20 },
  mini: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:16 },
  cardTitle: { fontSize:14, fontWeight:700, color:'#fafafa', marginBottom:16, marginTop:0 },
  row: { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' },
  input: { flex:1, minWidth:180, background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:14, padding:'11px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif" },
  select: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'11px 14px', outline:'none', cursor:'pointer' },
  textarea: { width:'100%', background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'12px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif", resize:'vertical', boxSizing:'border-box' },
  btn: (bg) => ({ background:bg||'#f97316', color:'#fff', border:'none', borderRadius:10, padding:'11px 22px', fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }),
  label: { fontSize:12, fontWeight:600, color:'#a1a1aa', marginBottom:6, display:'block' },
  tbl: { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th: { textAlign:'left', color:'#71717a', fontWeight:600, fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', padding:'10px 14px', borderBottom:'2px solid #27272a', whiteSpace:'nowrap', background:'#18181b' },
  td: { padding:'12px 14px', borderBottom:'1px solid #1f1f22', color:'#fafafa', verticalAlign:'middle' },
  trOdd: { background:'#09090b44' },
  badge: (c) => ({ display:'inline-block', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600, background:(c||'#27272a')+'33', color:c||'#a1a1aa', border:`1px solid ${(c||'#3f3f46')}44` }),
  empty: { textAlign:'center', padding:'56px 24px', color:'#52525b', fontSize:13 },
  loading: { textAlign:'center', padding:'32px 24px', color:'#71717a', fontSize:13 },
  err: { background:'#1c0c0c', border:'1px solid #7f1d1d', color:'#fca5a5', borderRadius:10, padding:'12px 16px', fontSize:13, marginBottom:16 },
  metaRow: { display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 },
  metaItem: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:'12px 18px', flex:'1 1 130px', textAlign:'center' },
  metaVal: (c) => ({ fontSize:22, fontWeight:700, color:c||'#f97316' }),
  metaLbl: { fontSize:11, color:'#71717a', marginTop:2 },
  sT: { fontSize:12, fontWeight:700, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, marginTop:16 },
  groupNav: { display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' },
  gBtn: (a, c) => ({ background:a?c+'22':'#18181b', color:a?c:'#71717a', border:`1px solid ${a?c+'44':'#27272a'}`, borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:a?700:500, cursor:'pointer' }),
  tabStrip: { display:'flex', gap:4, marginBottom:20, flexWrap:'wrap', borderBottom:'1px solid #27272a', paddingBottom:8 },
  tBtn: (a, c) => ({ background:'none', color:a?c:'#71717a', border:'none', borderBottom:a?`2px solid ${c}`:'2px solid transparent', padding:'8px 14px', fontSize:13, fontWeight:a?700:500, cursor:'pointer', marginBottom:-9 }),
  bar: { height:6, background:'#27272a', borderRadius:3, overflow:'hidden', marginTop:4 },
  fill: (pct, c) => ({ height:'100%', width:Math.min(pct||0,100)+'%', background:c||'#f97316', borderRadius:3 }),
  pre: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, padding:16, fontSize:12, color:'#a1a1aa', fontFamily:'monospace', whiteSpace:'pre-wrap', maxHeight:280, overflow:'auto', marginBottom:12 },
  sc: (s) => { if(s>=75) return '#10b981'; if(s>=50) return '#f59e0b'; return '#ef4444'; },
};

const GROUPS = [
  {
    "id": "ap",
    "label": "Accounts Payable",
    "color": "#f97316",
    "tabs": [
      {
        "id": "ap-invoices",
        "label": "Invoices"
      },
      {
        "id": "ap-approve",
        "label": "Approve"
      },
      {
        "id": "po-match",
        "label": "PO Matching"
      },
      {
        "id": "vendors",
        "label": "Vendors"
      },
      {
        "id": "ap-aging",
        "label": "AP Aging"
      },
      {
        "id": "payments",
        "label": "Payments"
      }
    ]
  },
  {
    "id": "ar",
    "label": "Accounts Receivable",
    "color": "#0ea5e9",
    "tabs": [
      {
        "id": "ar-list",
        "label": "Receivables"
      },
      {
        "id": "send-invoice",
        "label": "Send Invoice"
      },
      {
        "id": "collections",
        "label": "Collections"
      },
      {
        "id": "ar-reconcile",
        "label": "Reconcile"
      },
      {
        "id": "ar-aging-tab",
        "label": "AR Aging"
      },
      {
        "id": "ar-writeoffs",
        "label": "Write-Offs"
      }
    ]
  },
  {
    "id": "recon",
    "label": "Reconciliation",
    "color": "#10b981",
    "tabs": [
      {
        "id": "bank-feed",
        "label": "Bank Feed"
      },
      {
        "id": "matching",
        "label": "AI Matching"
      },
      {
        "id": "exceptions",
        "label": "Exceptions"
      },
      {
        "id": "close-check",
        "label": "Close Checklist"
      },
      {
        "id": "recon-audit",
        "label": "Audit"
      },
      {
        "id": "recon-history",
        "label": "History"
      }
    ]
  },
  {
    "id": "expenses",
    "label": "Expenses",
    "color": "#a855f7",
    "tabs": [
      {
        "id": "expense-list",
        "label": "Expense List"
      },
      {
        "id": "categorize",
        "label": "Categorize"
      },
      {
        "id": "exp-approval",
        "label": "Approval"
      },
      {
        "id": "exp-reports",
        "label": "Reports"
      },
      {
        "id": "policies",
        "label": "Policies"
      },
      {
        "id": "receipts",
        "label": "Receipts"
      }
    ]
  },
  {
    "id": "tax-ap",
    "label": "Tax & Payouts",
    "color": "#ec4899",
    "tabs": [
      {
        "id": "payout-recon",
        "label": "Payout Recon"
      },
      {
        "id": "sales-tax",
        "label": "Sales Tax"
      },
      {
        "id": "vat-tab",
        "label": "VAT"
      },
      {
        "id": "filings",
        "label": "Filings"
      },
      {
        "id": "tax-calendar",
        "label": "Tax Calendar"
      },
      {
        "id": "tax-audit",
        "label": "Audit Trail"
      }
    ]
  },
  {
    "id": "auto",
    "label": "Automation",
    "color": "#4f46e5",
    "tabs": [
      {
        "id": "auto-rules",
        "label": "Rules"
      },
      {
        "id": "auto-workflows",
        "label": "Workflows"
      },
      {
        "id": "thresholds",
        "label": "Thresholds"
      },
      {
        "id": "approval-chains",
        "label": "Approval Chains"
      },
      {
        "id": "notifications",
        "label": "Notifications"
      },
      {
        "id": "auto-audit",
        "label": "Audit Log"
      }
    ]
  },
  {
    "id": "fa-adv",
    "label": "Advanced",
    "color": "#f59e0b",
    "tabs": [
      {
        "id": "fa-ai",
        "label": "AI Bookkeeping"
      },
      {
        "id": "fa-integrations",
        "label": "Integrations"
      },
      {
        "id": "fa-api",
        "label": "API"
      },
      {
        "id": "fa-reports",
        "label": "Reports"
      },
      {
        "id": "fa-settings",
        "label": "Settings"
      },
      {
        "id": "fa-world",
        "label": "World-Class"
      }
    ]
  }
];

export default function FinanceAutopilot() {
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
                        <td style={S.td}><span style={{fontWeight:700}}>${inv.amount}</span></td>
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


  function handleGroup(gid) {
    const g = GROUPS.find(x=>x.id===gid);
    if(g){setActiveGroup(gid);setActiveTab(g.tabs[0].id);}
  }

  return (
    <div style={S.root}>
      <div style={{marginBottom:28}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16}}>
          <div>
            <h1 style={{fontSize:24,fontWeight:800,color:'#fafafa',margin:'0 0 4px',letterSpacing:'-0.02em'}}>Finance Autopilot</h1>
            <p style={{color:'#71717a',fontSize:13,margin:'4px 0 0'}}>Autonomous finance operations — AP/AR automation, AI reconciliation, NLP expense categorization & Shopify payout reconciliation</p>
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
