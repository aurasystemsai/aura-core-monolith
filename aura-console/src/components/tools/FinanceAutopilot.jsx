import { useState } from 'react';

const ACC = '#8b5cf6';

const S = {
  page: { background: '#09090b', minHeight: '100vh', color: '#fafafa', fontFamily: 'Inter,sans-serif', padding: '32px' },
  title: { fontSize: 26, fontWeight: 700, margin: 0 },
  subtitle: { color: '#a1a1aa', fontSize: 14, marginTop: 6, marginBottom: 24 },
  card: { background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 24, marginBottom: 20 },
  cardSm: { background: '#09090b', border: '1px solid #27272a', borderRadius: 10, padding: 14, marginBottom: 10 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },
  grid4: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 },
  label: { display: 'block', color: '#a1a1aa', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 },
  input: { width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 8, padding: '10px 12px', color: '#fafafa', fontSize: 14, boxSizing: 'border-box' },
  select: { width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 8, padding: '10px 12px', color: '#fafafa', fontSize: 14, boxSizing: 'border-box' },
  btn: (c) => ({ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, background: c || ACC, color: '#fff' }),
  btnSm: (c) => ({ padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12, background: c || ACC, color: '#fff' }),
  badge: (c) => ({ display: 'inline-block', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: (c||ACC)+'22', color: c||ACC }),
  row: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  metric: { background: '#09090b', border: '1px solid #27272a', borderRadius: 10, padding: 16, textAlign: 'center' },
  metricNum: (c) => ({ fontSize: 26, fontWeight: 800, color: c || ACC }),
  metricLabel: { fontSize: 12, color: '#71717a', marginTop: 4 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', color: '#71717a', fontSize: 12, fontWeight: 600, padding: '8px 10px', borderBottom: '1px solid #27272a' },
  td: { padding: '9px 10px', borderBottom: '1px solid #18181b', fontSize: 13, color: '#e4e4e7' },
  divider: { borderTop: '1px solid #27272a', margin: '20px 0' },
  tab: (a, c) => ({ padding: '9px 14px', cursor: 'pointer', border: 'none', background: a ? (c||ACC)+'22' : 'transparent', color: a ? (c||ACC) : '#71717a', fontWeight: a ? 700 : 400, fontSize: 12, borderRadius: 6, whiteSpace: 'nowrap' }),
  tabBar: { display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' },
};


const TABS = ['AP Dashboard','Invoice Management','Bank Reconciliation','GL Mapping','Shopify Payout Sync','Fraud Detection'];
const INVOICES = [
  { id: 'inv001', vendor: 'EcoFabrics Ltd', amount: 14800, dueDate: '2026-08-10', status: 'pending', autoApprove: true, discount: 296 },
  { id: 'inv002', vendor: 'GlobalTextile Co', amount: 8240, dueDate: '2026-08-02', status: 'overdue', autoApprove: false, exception: 'No matching PO' },
  { id: 'inv003', vendor: 'OrganicSource GmbH', amount: 3100, dueDate: '2026-08-18', status: 'approved', autoApprove: true, discount: 62 },
  { id: 'inv004', vendor: 'FastMake Inc', amount: 22600, dueDate: '2026-07-28', status: 'exception', autoApprove: false, exception: 'Amount exceeds PO by 12%' },
];
const statusColor = s => ({ pending: '#f59e0b', approved: '#22c55e', overdue: '#ef4444', exception: '#ef4444' })[s] || '#71717a';

export default function FinanceAutopilot() {
  const [tab, setTab] = useState(0);
  const [desc, setDesc] = useState('');
  const [glResult, setGlResult] = useState(null);
  const [payoutId, setPayoutId] = useState('');
  const [recon, setRecon] = useState(null);

  const mapGl = () => {
    const rules = [{ kw: 'SHOPIFY', account: '4000 - Sales Revenue' }, { kw: 'STRIPE', account: '6120 - Payment Processing' }, { kw: 'GOOGLE', account: '6200 - Digital Advertising' }, { kw: 'FABRICS', account: '5000 - COGS' }];
    const match = rules.find(r => desc.toUpperCase().includes(r.kw));
    setGlResult(match ? { account: match.account, confidence: 0.97 } : { account: '9999 - Unclassified', confidence: 0, needsReview: true });
  };

  return (
    <div style={S.page}>
      <h1 style={S.title}>Finance Autopilot</h1>
      <p style={S.subtitle}>Autonomous AP/AR, bank reconciliation, GL account mapping, and Shopify payout sync</p>
      <div style={S.grid4}>
        {[['Payables','£48,740'],['Overdue','£8,240'],['Early Pay Savings','£358'],['Auto-Approved','2']].map(([l,v])=>(
          <div key={l} style={S.metric}><div style={S.metricNum(ACC)}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>
      <div style={{...S.tabBar,marginTop:20}}>{TABS.map((t,i)=><button key={t} style={S.tab(tab===i,ACC)} onClick={()=>setTab(i)}>{t}</button>)}</div>

      {tab === 0 && (
        <div style={S.grid2}>
          <div style={S.card}><div style={{fontWeight:700,marginBottom:12}}>AP Summary</div>{[['Total Payables','£48,740'],['Overdue (>30d)','£8,240'],['Exceptions','2'],['Early Pay Opportunity','£358'],['Auto-Approved Today','2']].map(([l,v])=>(<div key={l} style={{...S.row,padding:'8px 0',borderBottom:'1px solid #27272a'}}><span style={{flex:1,color:'#a1a1aa'}}>{l}</span><span style={{fontWeight:700}}>{v}</span></div>))}</div>
          <div style={S.card}><div style={{fontWeight:700,marginBottom:12}}>Bank Reconciliation</div>{[['Matched Transactions','4 / 5'],['Reconciliation Rate','80%'],['Unmatched Amount','£1,640'],['Auto-matched via ML','3']].map(([l,v])=>(<div key={l} style={{...S.row,padding:'8px 0',borderBottom:'1px solid #27272a'}}><span style={{flex:1,color:'#a1a1aa'}}>{l}</span><span style={{fontWeight:700}}>{v}</span></div>))}</div>
        </div>
      )}

      {tab === 1 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Invoice Management</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Invoice</th><th style={S.th}>Vendor</th><th style={S.th}>Amount</th><th style={S.th}>Due</th><th style={S.th}>Status</th><th style={S.th}>Action</th></tr></thead>
            <tbody>{INVOICES.map(inv=>(
              <tr key={inv.id}>
                <td style={S.td}><code style={{fontSize:12}}>{inv.id}</code></td>
                <td style={S.td}><strong>{inv.vendor}</strong></td>
                <td style={S.td}>£{inv.amount.toLocaleString()}{inv.discount?<span style={{color:'#22c55e',fontSize:11,marginLeft:6}}>Save £{inv.discount}</span>:null}</td>
                <td style={S.td}>{inv.dueDate}</td>
                <td style={S.td}><span style={S.badge(statusColor(inv.status))}>{inv.status}{inv.exception?' — '+inv.exception:''}</span></td>
                <td style={S.td}>{inv.autoApprove?<button style={S.btnSm(ACC)}>Auto-Pay</button>:<button style={S.btnSm('#ef4444')}>Review</button>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 2 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>ML Bank Reconciliation</div>
          {[{date:'2026-07-18',desc:'SHOPIFY PAYOUT 23847',amount:18420,matched:true,conf:0.99,matchedTo:'Shopify Payout #23847'},{date:'2026-07-19',desc:'ECOFABRICS LTD INV-4812',amount:-14800,matched:true,conf:0.97,matchedTo:'inv001'},{date:'2026-07-21',desc:'UNKNOWN PMT REF88821',amount:-1640,matched:false,conf:0,matchedTo:null},{date:'2026-07-22',desc:'SHOPIFY PAYOUT 23901',amount:21840,matched:true,conf:0.99,matchedTo:'Shopify Payout #23901'}].map((t,i)=>(
            <div key={i} style={{...S.row,padding:'10px 0',borderBottom:'1px solid #27272a'}}>
              <span style={S.badge(t.matched?'#22c55e':'#ef4444')}>{t.matched?(t.conf*100).toFixed(0)+'%':'UNMATCHED'}</span>
              <span style={{fontSize:12,color:'#71717a'}}>{t.date}</span>
              <span style={{flex:1,fontFamily:'monospace',fontSize:13}}>{t.desc}</span>
              <span style={{fontWeight:700,color:t.amount>0?'#22c55e':'#e4e4e7'}}>£{Math.abs(t.amount).toLocaleString()}</span>
              {!t.matched&&<button style={S.btnSm('#f59e0b')}>Match</button>}
            </div>
          ))}
        </div>
      )}

      {tab === 3 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>GL Account Auto-Mapper</div>
          <div style={S.grid2}>
            <div>
              <label style={S.label}>Bank Transaction Description</label>
              <input style={S.input} placeholder="e.g. GOOGLE ADS SEPTEMBER INVOICE" value={desc} onChange={e=>setDesc(e.target.value)} />
              <button style={{...S.btn(ACC),marginTop:12,width:'100%'}} onClick={mapGl}>Map to GL Account</button>
            </div>
            {glResult&&<div style={S.cardSm}>
              <div style={S.label}>Mapped Account</div>
              <div style={{fontWeight:700,fontSize:16,color:ACC}}>{glResult.account}</div>
              {glResult.confidence>0&&<div style={{color:'#22c55e',fontSize:13,marginTop:6}}>Confidence: {(glResult.confidence*100).toFixed(0)}%</div>}
              {glResult.needsReview&&<div style={{color:'#f59e0b',fontSize:13,marginTop:6}}>⚠ Needs manual review</div>}
            </div>}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Shopify Payout Reconciliation</div>
          <div style={S.row}>
            <input style={{...S.input,flex:1}} placeholder="Payout ID (e.g. 23901)" value={payoutId} onChange={e=>setPayoutId(e.target.value)} />
            <button style={S.btn(ACC)} onClick={()=>setRecon({gross:21840,fees:654,net:21186,orders:41,refunds:3})}>Reconcile (1 credit)</button>
          </div>
          {recon&&<div style={{...S.grid3,marginTop:20}}>{[['Gross Amount','£'+recon.gross.toLocaleString()],['Shopify Fees','£'+recon.fees.toLocaleString()],['Net Payout','£'+recon.net.toLocaleString()],['Orders',''+recon.orders],['Refunds',''+recon.refunds],['Status','Reconciled ✓']].map(([l,v])=>(
            <div key={l} style={S.metric}><div style={S.metricNum(ACC)}>{v}</div><div style={S.metricLabel}>{l}</div></div>
          ))}</div>}
        </div>
      )}

      {tab === 5 && (
        <div style={S.card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Duplicate Invoice Detection</div>
          <div style={{...S.cardSm,borderColor:'#f59e0b'}}>
            <div style={S.row}><span style={S.badge('#f59e0b')}>SUSPECTED DUPLICATE</span><strong>inv002 + inv_old_8240</strong></div>
            <div style={{color:'#a1a1aa',fontSize:13,marginTop:8}}>Same vendor (GlobalTextile Co), same amount (£8,240), within 30 days. Potential saving: <strong style={{color:'#22c55e'}}>£8,240</strong>.</div>
            <div style={{...S.row,marginTop:12}}><button style={S.btnSm('#22c55e')}>Mark as Duplicate</button><button style={S.btnSm('#71717a')}>Dismiss</button></div>
          </div>
          <div style={{color:'#a1a1aa',fontSize:13,marginTop:16}}>No other suspicious invoices detected in the last 90 days.</div>
        </div>
      )}
    </div>
  );
}
