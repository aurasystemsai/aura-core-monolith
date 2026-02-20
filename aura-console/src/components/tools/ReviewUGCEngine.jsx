import React, { useState, useEffect, useCallback } from 'react';

const API = '/api/review-ugc-engine';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

const BASE = '';

const S = {
  page: { background: '#09090b', minHeight: '100vh', padding: '24px', color: '#fafafa' },
  card: { background: '#18181b', border: '1px solid #3f3f46', borderRadius: '10px', padding: '20px', marginBottom: '16px' },
  elevated: { background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', padding: '12px' },
  input: { background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', padding: '8px 12px', color: '#fafafa', width: '100%', outline: 'none', fontSize: '14px', boxSizing: 'border-box' },
  textarea: { background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', padding: '8px 12px', color: '#fafafa', width: '100%', outline: 'none', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' },
  select: { background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', padding: '8px 12px', color: '#fafafa', width: '100%', outline: 'none', fontSize: '14px', boxSizing: 'border-box' },
  btn: { background: '#4f46e5', color: '#fafafa', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 },
  btnSm: { background: '#4f46e5', color: '#fafafa', border: 'none', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 },
  btnGhost: { background: 'transparent', color: '#a1a1aa', border: '1px solid #3f3f46', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '13px' },
  btnDanger: { background: '#ef4444', color: '#fafafa', border: 'none', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 },
  btnSuccess: { background: '#22c55e', color: '#fafafa', border: 'none', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 },
  label: { display: 'block', color: '#a1a1aa', fontSize: '13px', marginBottom: '6px', fontWeight: 500 },
  title: { fontSize: '20px', fontWeight: 700, color: '#fafafa', margin: 0 },
  subtitle: { fontSize: '14px', color: '#a1a1aa', margin: '4px 0 0' },
  h2: { fontSize: '16px', fontWeight: 600, color: '#fafafa', marginBottom: '14px' },
  muted: { color: '#71717a', fontSize: '13px' },
  badge: (color) => ({ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: '4px', padding: '2px 8px', fontSize: '12px', fontWeight: 600, display: 'inline-block' }),
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' },
  grid4: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' },
  row: { display: 'flex', gap: '8px', alignItems: 'center' },
  stat: { background: '#18181b', border: '1px solid #3f3f46', borderRadius: '10px', padding: '16px', textAlign: 'center' },
  statNum: { fontSize: '28px', fontWeight: 700, color: '#fafafa' },
  statLabel: { fontSize: '13px', color: '#a1a1aa', marginTop: '4px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', color: '#71717a', fontSize: '12px', fontWeight: 600, padding: '8px 12px', borderBottom: '1px solid #3f3f46', textTransform: 'uppercase', letterSpacing: '0.04em' },
  td: { padding: '10px 12px', borderBottom: '1px solid #27272a', fontSize: '14px', color: '#fafafa' },
  divider: { borderColor: '#3f3f46', margin: '16px 0' },
  formGroup: { marginBottom: '14px' },
};

const CATEGORIES = [
  { id: 'reviews', label: 'Review Management', tabs: ['Reviews List', 'Create / Edit', 'Moderation Queue', 'Responses', 'Rating Summary', 'Statistics'] },
  { id: 'ugc-collection', label: 'UGC Collection', tabs: ['Campaigns', 'Review Requests', 'Collection Widgets', 'Email Templates', 'Statistics'] },
  { id: 'moderation', label: 'Moderation', tabs: ['Rules', 'Content Moderation', 'Queue', 'Blocked Words', 'Blocked Emails', 'Statistics'] },
  { id: 'sentiment', label: 'Sentiment & AI', tabs: ['Analyze', 'Batch Analysis', 'Insights', 'Trends', 'Summary', 'Statistics'] },
  { id: 'social-proof', label: 'Social Proof', tabs: ['Display Rules', 'Trust Badges', 'Elements', 'A/B Tests', 'Conversion Insights', 'Statistics'] },
  { id: 'widgets', label: 'Display & Widgets', tabs: ['Widgets', 'Carousels', 'Embeds', 'Themes', 'Preview', 'Statistics'] },
  { id: 'analytics', label: 'Analytics & Insights', tabs: ['Events', 'Review Metrics', 'Collection Performance', 'Reports', 'Dashboards', 'Alerts', 'Statistics'] },
  { id: 'integrations', label: 'Integrations', tabs: ['Services', 'Import / Export', 'Shopify Sync', 'Google Shopping', 'Webhooks', 'CSV', 'Sync Logs', 'Statistics'] },
];

function StarRating({ value = 0, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} onClick={onChange ? () => onChange(n) : undefined}
          style={{ fontSize: '20px', cursor: onChange ? 'pointer' : 'default', color: n <= value ? '#eab308' : '#3f3f46' }}>
          {n <= value ? '?' : '?'}
        </span>
      ))}
    </div>
  );
}

function StatCard({ label, value, color = '#4f46e5' }) {
  return (
    <div style={S.stat}>
      <div style={{ ...S.statNum, color }}>{value ?? '�'}</div>
      <div style={S.statLabel}>{label}</div>
    </div>
  );
}

function Placeholder({ name }) {
  return (
    <div style={{ ...S.card, textAlign: 'center', padding: '48px' }}>
      <div style={{ fontSize: '16px', color: '#71717a' }}>{name} � coming shortly...</div>
    </div>
  );
}

// ----------------------------------------------------------
// REVIEW MANAGEMENT
// ----------------------------------------------------------
function ReviewManagement({ tab }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ productId: '', productName: '', rating: 5, title: '', body: '', authorName: '', authorEmail: '' });
  const [responseText, setResponseText] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [ratingSummary, setRatingSummary] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await apiFetch(`${BASE}/reviews/search`, { method: 'POST', body: JSON.stringify({}) }); setReviews(Array.isArray(d) ? d : (d.reviews || [])); } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const loadQueue = useCallback(async () => {
    try { const d = await apiFetch(`${BASE}/moderation/queue`); setQueue(Array.isArray(d) ? d : (d.queue || [])); } catch (e) { console.error(e); }
  }, []);

  const loadStats = useCallback(async () => {
    try { const d = await apiFetch(`${BASE}/reviews/statistics`); setStats(d); } catch (e) { console.error(e); }
  }, []);

  const loadRating = useCallback(async () => {
    try { const d = await apiFetch(`${BASE}/reviews/search`, { method: 'POST', body: JSON.stringify({ productId: '' }) }); setRatingSummary(d); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (tab === 0) load();
    else if (tab === 2) loadQueue();
    else if (tab === 4) loadRating();
    else if (tab === 5) loadStats();
  }, [tab]);

  const handleCreate = async () => {
    await apiFetch(`${BASE}/reviews`, { method: 'POST', body: JSON.stringify(form) });
    setForm({ productId: '', productName: '', rating: 5, title: '', body: '', authorName: '', authorEmail: '' });
    load();
  };

  const handleApprove = async (id) => { await apiFetch(`${BASE}/reviews/${id}/moderate`, { method: 'POST', body: JSON.stringify({ action: 'approve' }) }); loadQueue(); };
  const handleReject = async (id) => { await apiFetch(`${BASE}/reviews/${id}/moderate`, { method: 'POST', body: JSON.stringify({ action: 'reject' }) }); loadQueue(); };
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; await apiFetch(`${BASE}/reviews/${id}`, { method: 'DELETE' }); load(); };
  const handleRespond = async () => {
    if (!selectedId || !responseText.trim()) return;
    await apiFetch(`${BASE}/reviews/${selectedId}/responses`, { method: 'POST', body: JSON.stringify({ response: responseText }) });
    setResponseText(''); setSelectedId('');
  };

  const statusBadge = (s) => {
    const c = { approved: '#22c55e', pending: '#eab308', rejected: '#ef4444', flagged: '#f97316' };
    return <span style={S.badge(c[s] || '#71717a')}>{s || 'unknown'}</span>;
  };

  if (tab === 0) return (
    <div style={S.card}>
      <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={S.h2}>All Reviews</div>
        <button style={S.btn} onClick={load}>Refresh</button>
      </div>
      {loading ? <div style={S.muted}>Loading...</div> : (
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Author</th><th style={S.th}>Product</th><th style={S.th}>Rating</th>
            <th style={S.th}>Title</th><th style={S.th}>Status</th><th style={S.th}>Actions</th>
          </tr></thead>
          <tbody>
            {reviews.length === 0 && <tr><td style={S.td} colSpan={6}><span style={S.muted}>No reviews found.</span></td></tr>}
            {reviews.map(r => (
              <tr key={r.id || r._id}>
                <td style={S.td}>{r.authorName || '�'}</td>
                <td style={S.td}>{r.productName || r.productId || '�'}</td>
                <td style={S.td}><StarRating value={r.rating} /></td>
                <td style={S.td}>{r.title || '�'}</td>
                <td style={S.td}>{statusBadge(r.status)}</td>
                <td style={S.td}><div style={S.row}>
                  <button style={S.btnGhost} onClick={() => setSelectedId(r.id || r._id)}>Reply</button>
                  <button style={S.btnDanger} onClick={() => handleDelete(r.id || r._id)}>Delete</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  if (tab === 1) return (
    <div style={S.card}>
      <div style={S.h2}>Create Review</div>
      <div style={S.grid2}>
        <div style={S.formGroup}><label style={S.label}>Product ID</label><input style={S.input} value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))} placeholder="gid://shopify/Product/..." /></div>
        <div style={S.formGroup}><label style={S.label}>Product Name</label><input style={S.input} value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} /></div>
        <div style={S.formGroup}><label style={S.label}>Author Name</label><input style={S.input} value={form.authorName} onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))} /></div>
        <div style={S.formGroup}><label style={S.label}>Author Email</label><input style={S.input} value={form.authorEmail} onChange={e => setForm(f => ({ ...f, authorEmail: e.target.value }))} /></div>
      </div>
      <div style={S.formGroup}><label style={S.label}>Rating</label><StarRating value={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} /></div>
      <div style={S.formGroup}><label style={S.label}>Title</label><input style={S.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
      <div style={S.formGroup}><label style={S.label}>Body</label><textarea style={{ ...S.textarea, minHeight: '100px' }} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} /></div>
      <button style={S.btn} onClick={handleCreate}>Create Review</button>
    </div>
  );

  if (tab === 2) return (
    <div style={S.card}>
      <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={S.h2}>Moderation Queue</div>
        <button style={S.btn} onClick={loadQueue}>Refresh</button>
      </div>
      {queue.length === 0 ? <div style={S.muted}>Queue is empty.</div> : (
        <table style={S.table}>
          <thead><tr><th style={S.th}>Author</th><th style={S.th}>Rating</th><th style={S.th}>Title</th><th style={S.th}>Actions</th></tr></thead>
          <tbody>{queue.map(r => (
            <tr key={r.id || r._id}>
              <td style={S.td}>{r.authorName || '�'}</td>
              <td style={S.td}><StarRating value={r.rating} /></td>
              <td style={S.td}>{r.title || '�'}</td>
              <td style={S.td}><div style={S.row}>
                <button style={S.btnSuccess} onClick={() => handleApprove(r.id || r._id)}>Approve</button>
                <button style={S.btnDanger} onClick={() => handleReject(r.id || r._id)}>Reject</button>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );

  if (tab === 3) return (
    <div style={S.card}>
      <div style={S.h2}>Send Response</div>
      <div style={S.formGroup}><label style={S.label}>Review ID</label><input style={S.input} value={selectedId} onChange={e => setSelectedId(e.target.value)} placeholder="Paste from Reviews List" /></div>
      <div style={S.formGroup}><label style={S.label}>Response</label><textarea style={{ ...S.textarea, minHeight: '100px' }} value={responseText} onChange={e => setResponseText(e.target.value)} placeholder="Thank you for your feedback..." /></div>
      <button style={S.btn} onClick={handleRespond}>Send Response</button>
    </div>
  );

  if (tab === 4) return (
    <div style={S.card}>
      <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={S.h2}>Rating Summary</div>
        <button style={S.btn} onClick={loadRating}>Refresh</button>
      </div>
      {ratingSummary ? (<>
        <div style={S.grid4}>
          <StatCard label="Avg Rating" value={ratingSummary.average?.toFixed(1)} color="#eab308" />
          <StatCard label="Total Reviews" value={ratingSummary.total} color="#4f46e5" />
          <StatCard label="5 Star %" value={ratingSummary.fiveStarPercent ? ratingSummary.fiveStarPercent + '%' : null} color="#22c55e" />
          <StatCard label="1 Star %" value={ratingSummary.oneStarPercent ? ratingSummary.oneStarPercent + '%' : null} color="#ef4444" />
        </div>
        <div style={{ ...S.card, marginTop: '16px' }}>
          {[5, 4, 3, 2, 1].map(n => {
            const count = (ratingSummary.distribution?.[n]) || 0;
            const pct = ratingSummary.total > 0 ? Math.round((count / ratingSummary.total) * 100) : 0;
            return (
              <div key={n} style={{ ...S.row, marginBottom: '10px' }}>
                <span style={{ width: '60px', color: '#a1a1aa', fontSize: '13px' }}>{n} stars</span>
                <div style={{ flex: 1, background: '#27272a', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, background: n >= 4 ? '#22c55e' : n === 3 ? '#eab308' : '#ef4444', height: '100%' }} />
                </div>
                <span style={{ width: '40px', textAlign: 'right', color: '#a1a1aa', fontSize: '13px' }}>{pct}%</span>
                <span style={{ width: '40px', textAlign: 'right', color: '#71717a', fontSize: '13px' }}>{count}</span>
              </div>
            );
          })}
        </div>
      </>) : <div style={S.muted}>Click Refresh to load rating summary.</div>}
    </div>
  );

  if (tab === 5) return (
    <div style={S.card}>
      <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={S.h2}>Statistics</div>
        <button style={S.btn} onClick={loadStats}>Refresh</button>
      </div>
      {stats ? (
        <div style={S.grid4}>
          <StatCard label="Total" value={stats.total || stats.totalReviews} color="#4f46e5" />
          <StatCard label="Approved" value={stats.approved} color="#22c55e" />
          <StatCard label="Pending" value={stats.pending} color="#eab308" />
          <StatCard label="Avg Rating" value={stats.averageRating?.toFixed(1)} color="#eab308" />
        </div>
      ) : <div style={S.muted}>Click Refresh to load stats.</div>}
    </div>
  );

  return null;
}

// ----------------------------------------------------------
// PLACEHOLDERS � replaced in phases
// ----------------------------------------------------------
// ----------------------------------------------------------
// UGC COLLECTION
// ----------------------------------------------------------
function UGCCollection({ tab }) {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [widgets, setWidgets] = useState([]);
  const [stats, setStats] = useState(null);
  const [campForm, setCampForm] = useState({ name: '', description: '', type: 'email', startDate: '', endDate: '' });
  const [reqForm, setReqForm] = useState({ customerEmail: '', customerName: '', productId: '', orderId: '' });
  const [bulkEmails, setBulkEmails] = useState('');
  const [tplForm, setTplForm] = useState({ name: '', subject: '', body: '', type: 'request' });
  const [wgtForm, setWgtForm] = useState({ name: '', type: 'popup', position: 'bottom-right', trigger: 'time' });
  const [msg, setMsg] = useState('');

  const loadCampaigns = useCallback(async () => { try { const d = await apiFetch(`${BASE}/campaigns`); setCampaigns(Array.isArray(d) ? d : (d.campaigns || [])); } catch(e){} }, []);
  const loadTemplates = useCallback(async () => { try { const d = await apiFetch(`${BASE}/email-templates`); setTemplates(Array.isArray(d) ? d : (d.templates || [])); } catch(e){} }, []);
  const loadWidgets = useCallback(async () => { try { const d = await apiFetch(`${BASE}/collection-widgets`); setWidgets(Array.isArray(d) ? d : (d.widgets || [])); } catch(e){} }, []);
  const loadStats = useCallback(async () => { try { const d = await apiFetch(`${BASE}/collection/statistics`); setStats(d); } catch(e){} }, []);

  useEffect(() => {
    if (tab === 0) loadCampaigns();
    else if (tab === 2) loadWidgets();
    else if (tab === 3) loadTemplates();
    else if (tab === 4) loadStats();
  }, [tab]);

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const createCampaign = async () => {
    await apiFetch(`${BASE}/campaigns`, { method: 'POST', body: JSON.stringify(campForm) });
    setCampForm({ name: '', description: '', type: 'email', startDate: '', endDate: '' });
    loadCampaigns(); flash('Campaign created');
  };
  const deleteCampaign = async (id) => { if(!window.confirm('Delete?')) return; await apiFetch(`${BASE}/campaigns/${id}`, { method: 'DELETE' }); loadCampaigns(); };
  const sendRequest = async () => {
    await apiFetch(`${BASE}/campaigns/send-request`, { method: 'POST', body: JSON.stringify(reqForm) });
    setReqForm({ customerEmail: '', customerName: '', productId: '', orderId: '' }); flash('Request sent');
  };
  const sendBulk = async () => {
    const emails = bulkEmails.split('\n').map(e => e.trim()).filter(Boolean);
    await apiFetch(`${BASE}/campaigns/send-request`, { method: 'POST', body: JSON.stringify({ bulk: true, emails }) });
    setBulkEmails(''); flash(`Sent ${emails.length} requests`);
  };
  const createTemplate = async () => {
    await apiFetch(`${BASE}/email-templates`, { method: 'POST', body: JSON.stringify(tplForm) });
    setTplForm({ name: '', subject: '', body: '', type: 'request' }); loadTemplates(); flash('Template saved');
  };
  const deleteTemplate = async (id) => { await apiFetch(`${BASE}/email-templates/${id}`, { method: 'DELETE' }); loadTemplates(); };
  const createWidget = async () => {
    await apiFetch(`${BASE}/collection-widgets`, { method: 'POST', body: JSON.stringify(wgtForm) });
    setWgtForm({ name: '', type: 'popup', position: 'bottom-right', trigger: 'time' }); loadWidgets(); flash('Widget created');
  };

  if (tab === 0) return (
    <div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      <div style={S.h2}>Campaigns</div>
      <div style={S.card}>
        <div style={S.h2}>New Campaign</div>
        <div style={S.grid2}>
          <div style={S.formGroup}><label style={S.label}>Name</label><input style={S.input} value={campForm.name} onChange={e => setCampForm(f=>({...f,name:e.target.value}))} /></div>
          <div style={S.formGroup}><label style={S.label}>Type</label>
            <select style={S.select} value={campForm.type} onChange={e => setCampForm(f=>({...f,type:e.target.value}))}>
              <option value="email">Email</option><option value="sms">SMS</option><option value="popup">Popup</option>
            </select>
          </div>
          <div style={S.formGroup}><label style={S.label}>Start Date</label><input type="date" style={S.input} value={campForm.startDate} onChange={e => setCampForm(f=>({...f,startDate:e.target.value}))} /></div>
          <div style={S.formGroup}><label style={S.label}>End Date</label><input type="date" style={S.input} value={campForm.endDate} onChange={e => setCampForm(f=>({...f,endDate:e.target.value}))} /></div>
        </div>
        <div style={S.formGroup}><label style={S.label}>Description</label><textarea style={S.textarea} value={campForm.description} onChange={e => setCampForm(f=>({...f,description:e.target.value}))} /></div>
        <button style={S.btn} onClick={createCampaign}>Create Campaign</button>
      </div>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Name</th><th style={S.th}>Type</th><th style={S.th}>Start</th><th style={S.th}>End</th><th style={S.th}>Actions</th></tr></thead>
        <tbody>
          {campaigns.length === 0 && <tr><td style={S.td} colSpan={5}><span style={S.muted}>No campaigns yet.</span></td></tr>}
          {campaigns.map(c => (
            <tr key={c.id||c._id}>
              <td style={S.td}>{c.name}</td><td style={S.td}>{c.type}</td>
              <td style={S.td}>{c.startDate || '�'}</td><td style={S.td}>{c.endDate || '�'}</td>
              <td style={S.td}><button style={S.btnDanger} onClick={() => deleteCampaign(c.id||c._id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (tab === 1) return (
    <div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      <div style={S.card}>
        <div style={S.h2}>Send Single Request</div>
        <div style={S.grid2}>
          <div style={S.formGroup}><label style={S.label}>Customer Email</label><input style={S.input} value={reqForm.customerEmail} onChange={e => setReqForm(f=>({...f,customerEmail:e.target.value}))} /></div>
          <div style={S.formGroup}><label style={S.label}>Customer Name</label><input style={S.input} value={reqForm.customerName} onChange={e => setReqForm(f=>({...f,customerName:e.target.value}))} /></div>
          <div style={S.formGroup}><label style={S.label}>Product ID</label><input style={S.input} value={reqForm.productId} onChange={e => setReqForm(f=>({...f,productId:e.target.value}))} /></div>
          <div style={S.formGroup}><label style={S.label}>Order ID</label><input style={S.input} value={reqForm.orderId} onChange={e => setReqForm(f=>({...f,orderId:e.target.value}))} /></div>
        </div>
        <button style={S.btn} onClick={sendRequest}>Send Request</button>
      </div>
      <div style={S.card}>
        <div style={S.h2}>Bulk Send (one email per line)</div>
        <div style={S.formGroup}><textarea style={{ ...S.textarea, minHeight: '120px' }} value={bulkEmails} onChange={e => setBulkEmails(e.target.value)} placeholder="customer1@example.com\ncustomer2@example.com" /></div>
        <button style={S.btn} onClick={sendBulk}>Send Bulk Requests</button>
      </div>
    </div>
  );

  if (tab === 2) return (
    <div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      <div style={S.card}>
        <div style={S.h2}>New Collection Widget</div>
        <div style={S.grid2}>
          <div style={S.formGroup}><label style={S.label}>Widget Name</label><input style={S.input} value={wgtForm.name} onChange={e => setWgtForm(f=>({...f,name:e.target.value}))} /></div>
          <div style={S.formGroup}><label style={S.label}>Type</label>
            <select style={S.select} value={wgtForm.type} onChange={e => setWgtForm(f=>({...f,type:e.target.value}))}>
              <option value="popup">Popup</option><option value="inline">Inline</option><option value="tab">Tab</option>
            </select>
          </div>
          <div style={S.formGroup}><label style={S.label}>Position</label>
            <select style={S.select} value={wgtForm.position} onChange={e => setWgtForm(f=>({...f,position:e.target.value}))}>
              <option value="bottom-right">Bottom Right</option><option value="bottom-left">Bottom Left</option><option value="center">Center</option>
            </select>
          </div>
          <div style={S.formGroup}><label style={S.label}>Trigger</label>
            <select style={S.select} value={wgtForm.trigger} onChange={e => setWgtForm(f=>({...f,trigger:e.target.value}))}>
              <option value="time">Time Delay</option><option value="scroll">Scroll</option><option value="exit">Exit Intent</option>
            </select>
          </div>
        </div>
        <button style={S.btn} onClick={createWidget}>Create Widget</button>
      </div>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Name</th><th style={S.th}>Type</th><th style={S.th}>Position</th><th style={S.th}>Trigger</th></tr></thead>
        <tbody>
          {widgets.length === 0 && <tr><td style={S.td} colSpan={4}><span style={S.muted}>No widgets yet.</span></td></tr>}
          {widgets.map(w => <tr key={w.id||w._id}><td style={S.td}>{w.name}</td><td style={S.td}>{w.type}</td><td style={S.td}>{w.position}</td><td style={S.td}>{w.trigger}</td></tr>)}
        </tbody>
      </table>
    </div>
  );

  if (tab === 3) return (
    <div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      <div style={S.card}>
        <div style={S.h2}>New Email Template</div>
        <div style={S.grid2}>
          <div style={S.formGroup}><label style={S.label}>Template Name</label><input style={S.input} value={tplForm.name} onChange={e => setTplForm(f=>({...f,name:e.target.value}))} /></div>
          <div style={S.formGroup}><label style={S.label}>Type</label>
            <select style={S.select} value={tplForm.type} onChange={e => setTplForm(f=>({...f,type:e.target.value}))}>
              <option value="request">Review Request</option><option value="reminder">Reminder</option><option value="thank-you">Thank You</option>
            </select>
          </div>
        </div>
        <div style={S.formGroup}><label style={S.label}>Subject</label><input style={S.input} value={tplForm.subject} onChange={e => setTplForm(f=>({...f,subject:e.target.value}))} /></div>
        <div style={S.formGroup}><label style={S.label}>Body</label><textarea style={{ ...S.textarea, minHeight: '120px' }} value={tplForm.body} onChange={e => setTplForm(f=>({...f,body:e.target.value}))} /></div>
        <button style={S.btn} onClick={createTemplate}>Save Template</button>
      </div>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Name</th><th style={S.th}>Type</th><th style={S.th}>Subject</th><th style={S.th}>Actions</th></tr></thead>
        <tbody>
          {templates.length === 0 && <tr><td style={S.td} colSpan={4}><span style={S.muted}>No templates yet.</span></td></tr>}
          {templates.map(t => <tr key={t.id||t._id}><td style={S.td}>{t.name}</td><td style={S.td}>{t.type}</td><td style={S.td}>{t.subject}</td><td style={S.td}><button style={S.btnDanger} onClick={()=>deleteTemplate(t.id||t._id)}>Delete</button></td></tr>)}
        </tbody>
      </table>
    </div>
  );

  if (tab === 4) return (
    <div style={S.card}>
      <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={S.h2}>UGC Statistics</div>
        <button style={S.btn} onClick={loadStats}>Refresh</button>
      </div>
      {stats ? (
        <div style={S.grid4}>
          <StatCard label="Campaigns" value={stats.campaigns || stats.totalCampaigns} color="#4f46e5" />
          <StatCard label="Requests Sent" value={stats.requestsSent} color="#22c55e" />
          <StatCard label="Response Rate" value={stats.responseRate ? stats.responseRate + '%' : null} color="#eab308" />
          <StatCard label="Widgets" value={stats.widgets} color="#a78bfa" />
        </div>
      ) : <div style={S.muted}>Click Refresh to load stats.</div>}
    </div>
  );

  return null;
}
// ----------------------------------------------------------
// MODERATION
// ----------------------------------------------------------
function ModerationCenter({ tab }) {
  const [rules, setRules] = useState([]);
  const [queue, setQueue] = useState([]);
  const [blockedWords, setBlockedWords] = useState([]);
  const [blockedEmails, setBlockedEmails] = useState([]);
  const [stats, setStats] = useState(null);
  const [ruleForm, setRuleForm] = useState({ name: '', type: 'spam', action: 'flag', pattern: '' });
  const [checkContent, setCheckContent] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [newWord, setNewWord] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [msg, setMsg] = useState('');

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3000); };
  const loadRules = useCallback(async () => { try { const d = await apiFetch(`${BASE}/moderation/rules`); setRules(Array.isArray(d) ? d : (d.rules || [])); } catch(e){} }, []);
  const loadQueue = useCallback(async () => { try { const d = await apiFetch(`${BASE}/moderation/queue`); setQueue(Array.isArray(d) ? d : (d.queue || [])); } catch(e){} }, []);
  const loadBlockedWords = useCallback(async () => { try { const d = await apiFetch(`${BASE}/moderation/blocked-words`); setBlockedWords(Array.isArray(d) ? d : (d.words || [])); } catch(e){} }, []);
  const loadBlockedEmails = useCallback(async () => { try { const d = await apiFetch(`${BASE}/moderation/blocked-emails`); setBlockedEmails(Array.isArray(d) ? d : (d.emails || [])); } catch(e){} }, []);
  const loadStats = useCallback(async () => { try { const d = await apiFetch(`${BASE}/moderation/statistics`); setStats(d); } catch(e){} }, []);

  useEffect(() => {
    if (tab === 0) loadRules();
    else if (tab === 2) loadQueue();
    else if (tab === 3) loadBlockedWords();
    else if (tab === 4) loadBlockedEmails();
    else if (tab === 5) loadStats();
  }, [tab]);

  const createRule = async () => { await apiFetch(`${BASE}/moderation/rules`, { method: 'POST', body: JSON.stringify(ruleForm) }); setRuleForm({ name: '', type: 'spam', action: 'flag', pattern: '' }); loadRules(); flash('Rule created'); };
  const deleteRule = async (id) => { await apiFetch(`${BASE}/moderation/rules/${id}`, { method: 'DELETE' }); loadRules(); };
  const handleCheck = async () => { const d = await apiFetch(`${BASE}/moderation/moderate`, { method: 'POST', body: JSON.stringify({ content: checkContent }) }); setCheckResult(d); };
  const approveItem = async (id) => { await apiFetch(`${BASE}/moderation/queue/${id}/review`, { method: 'POST', body: JSON.stringify({ action: 'approve' }) }); loadQueue(); };
  const rejectItem = async (id) => { await apiFetch(`${BASE}/moderation/queue/${id}/review`, { method: 'POST', body: JSON.stringify({ action: 'reject' }) }); loadQueue(); };
  const addWord = async () => { if (!newWord.trim()) return; await apiFetch(`${BASE}/moderation/blocked-words`, { method: 'POST', body: JSON.stringify({ word: newWord }) }); setNewWord(''); loadBlockedWords(); };
  const removeWord = async (word) => { await apiFetch(`${BASE}/moderation/blocked-words/${encodeURIComponent(word)}`, { method: 'DELETE' }); loadBlockedWords(); };
  const addEmail = async () => { if (!newEmail.trim()) return; await apiFetch(`${BASE}/moderation/blocked-emails`, { method: 'POST', body: JSON.stringify({ email: newEmail }) }); setNewEmail(''); loadBlockedEmails(); };

  if (tab === 0) return (
    <div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      <div style={S.card}>
        <div style={S.h2}>New Rule</div>
        <div style={S.grid2}>
          <div style={S.formGroup}><label style={S.label}>Rule Name</label><input style={S.input} value={ruleForm.name} onChange={e=>setRuleForm(f=>({...f,name:e.target.value}))} /></div>
          <div style={S.formGroup}><label style={S.label}>Type</label>
            <select style={S.select} value={ruleForm.type} onChange={e=>setRuleForm(f=>({...f,type:e.target.value}))}>
              <option value="spam">Spam</option><option value="profanity">Profanity</option><option value="competitor">Competitor</option><option value="custom">Custom</option>
            </select>
          </div>
          <div style={S.formGroup}><label style={S.label}>Action</label>
            <select style={S.select} value={ruleForm.action} onChange={e=>setRuleForm(f=>({...f,action:e.target.value}))}>
              <option value="flag">Flag</option><option value="reject">Auto Reject</option><option value="hold">Hold for Review</option>
            </select>
          </div>
          <div style={S.formGroup}><label style={S.label}>Pattern (regex)</label><input style={S.input} value={ruleForm.pattern} onChange={e=>setRuleForm(f=>({...f,pattern:e.target.value}))} placeholder="e.g. spam|buy now|click here" /></div>
        </div>
        <button style={S.btn} onClick={createRule}>Create Rule</button>
      </div>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Name</th><th style={S.th}>Type</th><th style={S.th}>Action</th><th style={S.th}>Pattern</th><th style={S.th}>Actions</th></tr></thead>
        <tbody>
          {rules.length === 0 && <tr><td style={S.td} colSpan={5}><span style={S.muted}>No rules yet.</span></td></tr>}
          {rules.map(r => <tr key={r.id||r._id}><td style={S.td}>{r.name}</td><td style={S.td}>{r.type}</td><td style={S.td}>{r.action}</td><td style={S.td}><code style={{ color: '#a78bfa', fontSize: '12px' }}>{r.pattern}</code></td><td style={S.td}><button style={S.btnDanger} onClick={()=>deleteRule(r.id||r._id)}>Delete</button></td></tr>)}
        </tbody>
      </table>
    </div>
  );

  if (tab === 1) return (
    <div style={S.card}>
      <div style={S.h2}>Content Check</div>
      <div style={S.formGroup}><label style={S.label}>Content to Check</label><textarea style={{ ...S.textarea, minHeight: '120px' }} value={checkContent} onChange={e=>setCheckContent(e.target.value)} placeholder="Paste review content here..." /></div>
      <button style={S.btn} onClick={handleCheck}>Check Content</button>
      {checkResult && (
        <div style={{ ...S.elevated, marginTop: '16px' }}>
          <div style={{ ...S.row, marginBottom: '8px' }}>
            <span style={S.label}>Result:</span>
            <span style={S.badge(checkResult.passed ? '#22c55e' : '#ef4444')}>{checkResult.passed ? 'PASSED' : 'FAILED'}</span>
          </div>
          {checkResult.violations && checkResult.violations.length > 0 && (
            <div><div style={{ ...S.label, marginBottom: '8px' }}>Violations:</div>
              {checkResult.violations.map((v, i) => <div key={i} style={{ color: '#ef4444', fontSize: '13px', marginBottom: '4px' }}>{v.rule}: {v.detail}</div>)}
            </div>
          )}
          {checkResult.score !== undefined && <div style={S.muted}>Score: {checkResult.score}</div>}
        </div>
      )}
    </div>
  );

  if (tab === 2) return (
    <div>
      <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={S.h2}>Moderation Queue</div>
        <button style={S.btn} onClick={loadQueue}>Refresh</button>
      </div>
      {queue.length === 0 ? <div style={S.muted}>Queue is empty.</div> : (
        <table style={S.table}>
          <thead><tr><th style={S.th}>Author</th><th style={S.th}>Content</th><th style={S.th}>Reason</th><th style={S.th}>Actions</th></tr></thead>
          <tbody>{queue.map(r => (
            <tr key={r.id||r._id}>
              <td style={S.td}>{r.authorName||'�'}</td>
              <td style={{ ...S.td, maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.body||r.content||'�'}</td>
              <td style={S.td}><span style={S.badge('#f97316')}>{r.reason||'flagged'}</span></td>
              <td style={S.td}><div style={S.row}>
                <button style={S.btnSuccess} onClick={()=>approveItem(r.id||r._id)}>Approve</button>
                <button style={S.btnDanger} onClick={()=>rejectItem(r.id||r._id)}>Reject</button>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );

  if (tab === 3) return (
    <div style={S.card}>
      <div style={S.h2}>Blocked Words</div>
      <div style={{ ...S.row, marginBottom: '16px' }}>
        <input style={{ ...S.input, maxWidth: '320px' }} value={newWord} onChange={e=>setNewWord(e.target.value)} placeholder="Add a word or phrase..." onKeyDown={e=>e.key==='Enter'&&addWord()} />
        <button style={S.btn} onClick={addWord}>Add</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {blockedWords.length === 0 && <span style={S.muted}>No blocked words.</span>}
        {blockedWords.map((w, i) => (
          <span key={i} style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '20px', padding: '4px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {typeof w === 'string' ? w : w.word}
            <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }} onClick={()=>removeWord(typeof w === 'string' ? w : w.word)}>�</button>
          </span>
        ))}
      </div>
    </div>
  );

  if (tab === 4) return (
    <div style={S.card}>
      <div style={S.h2}>Blocked Emails</div>
      <div style={{ ...S.row, marginBottom: '16px' }}>
        <input style={{ ...S.input, maxWidth: '320px' }} value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="email@example.com" onKeyDown={e=>e.key==='Enter'&&addEmail()} />
        <button style={S.btn} onClick={addEmail}>Add</button>
      </div>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Email</th></tr></thead>
        <tbody>
          {blockedEmails.length === 0 && <tr><td style={S.td}><span style={S.muted}>No blocked emails.</span></td></tr>}
          {blockedEmails.map((e, i) => <tr key={i}><td style={S.td}>{typeof e === 'string' ? e : e.email}</td></tr>)}
        </tbody>
      </table>
    </div>
  );

  if (tab === 5) return (
    <div style={S.card}>
      <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={S.h2}>Moderation Statistics</div>
        <button style={S.btn} onClick={loadStats}>Refresh</button>
      </div>
      {stats ? (
        <div style={S.grid4}>
          <StatCard label="Total Checked" value={stats.totalChecked} color="#4f46e5" />
          <StatCard label="Flagged" value={stats.flagged} color="#f97316" />
          <StatCard label="Auto Rejected" value={stats.autoRejected} color="#ef4444" />
          <StatCard label="Rules Active" value={stats.activeRules} color="#22c55e" />
        </div>
      ) : <div style={S.muted}>Click Refresh to load stats.</div>}
    </div>
  );

  return null;
}
// ----------------------------------------------------------
// SENTIMENT & AI
// ----------------------------------------------------------
function SentimentAI({ tab }) {
  const [analyzeText, setAnalyzeText] = useState('');
  const [analyzeResult, setAnalyzeResult] = useState(null);
  const [batchTexts, setBatchTexts] = useState('');
  const [batchResults, setBatchResults] = useState([]);
  const [insights, setInsights] = useState(null);
  const [trends, setTrends] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summaryForm, setSummaryForm] = useState({ period: 'last30days' });
  const [summaryData, setSummaryData] = useState(null);
  const [sumLoading, setSumLoading] = useState(false);

  const loadInsights = useCallback(async () => { try { const d = await apiFetch(`${BASE}/sentiment/insights`, { method: 'POST', body: JSON.stringify({}) }); setInsights(d); } catch(e){} }, []);
  const loadTrends = useCallback(async () => { try { const d = await apiFetch(`${BASE}/sentiment/trends`, { method: 'POST', body: JSON.stringify({}) }); setTrends(d); } catch(e){} }, []);
  const loadStats = useCallback(async () => { try { const d = await apiFetch(`${BASE}/sentiment/statistics`); setStats(d); } catch(e){} }, []);

  useEffect(() => {
    if (tab === 2) loadInsights();
    else if (tab === 3) loadTrends();
    else if (tab === 5) loadStats();
  }, [tab]);

  const handleAnalyze = async () => {
    if (!analyzeText.trim()) return;
    setLoading(true);
    const d = await apiFetch(`${BASE}/sentiment/analyze`, { method: 'POST', body: JSON.stringify({ content: analyzeText }) });
    setAnalyzeResult(d); setLoading(false);
  };

  const handleBatch = async () => {
    const items = batchTexts.split('\n---\n').map(t => t.trim()).filter(Boolean);
    if (!items.length) return;
    setLoading(true);
    const d = await apiFetch(`${BASE}/sentiment/batch-analyze`, { method: 'POST', body: JSON.stringify({ items }) });
    setBatchResults(Array.isArray(d) ? d : (d.results || [])); setLoading(false);
  };

  const sentimentColor = (label) => {
    if (!label) return '#71717a';
    const l = label.toLowerCase();
    if (l.includes('positive')) return '#22c55e';
    if (l.includes('negative')) return '#ef4444';
    return '#eab308';
  };

  if (tab === 0) return (
    <div style={S.card}>
      <div style={S.h2}>Sentiment Analysis</div>
      <div style={S.formGroup}><label style={S.label}>Text to Analyze</label><textarea style={{ ...S.textarea, minHeight: '120px' }} value={analyzeText} onChange={e=>setAnalyzeText(e.target.value)} placeholder="Paste review or content here..." /></div>
      <button style={S.btn} onClick={handleAnalyze} disabled={loading}>{loading ? 'Analyzing...' : 'Analyze Sentiment'}</button>
      {analyzeResult && (
        <div style={{ ...S.elevated, marginTop: '16px' }}>
          <div style={{ ...S.row, marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
            <span style={S.badge(sentimentColor(analyzeResult.sentiment))}>{analyzeResult.sentiment || 'N/A'}</span>
            {analyzeResult.score !== undefined && <span style={S.muted}>Score: {analyzeResult.score?.toFixed?.(2) ?? analyzeResult.score}</span>}
            {analyzeResult.confidence !== undefined && <span style={S.muted}>Confidence: {(analyzeResult.confidence * 100).toFixed(0)}%</span>}
          </div>
          {analyzeResult.keywords && analyzeResult.keywords.length > 0 && (
            <div><div style={{ ...S.label, marginBottom: '6px' }}>Keywords:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {analyzeResult.keywords.map((k, i) => <span key={i} style={{ ...S.badge('#a78bfa'), padding: '2px 8px' }}>{typeof k === 'string' ? k : k.word}</span>)}
              </div>
            </div>
          )}
          {analyzeResult.themes && analyzeResult.themes.length > 0 && (
            <div style={{ marginTop: '12px' }}><div style={{ ...S.label, marginBottom: '6px' }}>Themes:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {analyzeResult.themes.map((t, i) => <span key={i} style={{ ...S.badge('#4f46e5'), padding: '2px 8px' }}>{t}</span>)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (tab === 1) return (
    <div style={S.card}>
      <div style={S.h2}>Batch Analysis</div>
      <div style={S.formGroup}><label style={S.label}>Texts (separate items with a line containing ---)</label><textarea style={{ ...S.textarea, minHeight: '160px' }} value={batchTexts} onChange={e=>setBatchTexts(e.target.value)} placeholder={"Review text 1\n---\nReview text 2\n---\nReview text 3"} /></div>
      <button style={S.btn} onClick={handleBatch} disabled={loading}>{loading ? 'Analyzing...' : 'Run Batch Analysis'}</button>
      {batchResults.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <table style={S.table}>
            <thead><tr><th style={S.th}>#</th><th style={S.th}>Excerpt</th><th style={S.th}>Sentiment</th><th style={S.th}>Score</th></tr></thead>
            <tbody>{batchResults.map((r, i) => (
              <tr key={i}>
                <td style={S.td}>{i + 1}</td>
                <td style={{ ...S.td, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.text || r.content || '�'}</td>
                <td style={S.td}><span style={S.badge(sentimentColor(r.sentiment))}>{r.sentiment || 'N/A'}</span></td>
                <td style={S.td}>{r.score?.toFixed?.(2) ?? '�'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (tab === 2) return (
    <div style={S.card}>
      <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={S.h2}>Sentiment Insights</div>
        <button style={S.btn} onClick={loadInsights}>Refresh</button>
      </div>
      {insights ? (
        <div>
          <div style={S.grid3}>
            <StatCard label="Overall Sentiment" value={insights.overall || insights.averageSentiment} color="#22c55e" />
            <StatCard label="Positive %" value={insights.positivePercent ? insights.positivePercent + '%' : null} color="#22c55e" />
            <StatCard label="Negative %" value={insights.negativePercent ? insights.negativePercent + '%' : null} color="#ef4444" />
          </div>
          {insights.topThemes && (
            <div style={{ ...S.elevated, marginTop: '16px' }}>
              <div style={{ ...S.label, marginBottom: '8px' }}>Top Themes</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {insights.topThemes.map((t, i) => <span key={i} style={{ ...S.badge('#4f46e5'), padding: '4px 12px' }}>{typeof t === 'string' ? t : `${t.theme} (${t.count})`}</span>)}
              </div>
            </div>
          )}
        </div>
      ) : <div style={S.muted}>Click Refresh to load insights.</div>}
    </div>
  );

  if (tab === 3) return (
    <div style={S.card}>
      <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={S.h2}>Sentiment Trends</div>
        <button style={S.btn} onClick={loadTrends}>Refresh</button>
      </div>
      {trends ? (
        <div>
          {Array.isArray(trends.data || trends) && (
            <table style={S.table}>
              <thead><tr><th style={S.th}>Period</th><th style={S.th}>Positive</th><th style={S.th}>Neutral</th><th style={S.th}>Negative</th></tr></thead>
              <tbody>{(trends.data || trends).map((row, i) => (
                <tr key={i}>
                  <td style={S.td}>{row.period || row.date || row.label}</td>
                  <td style={S.td}><span style={{ color: '#22c55e' }}>{row.positive ?? '�'}</span></td>
                  <td style={S.td}><span style={{ color: '#eab308' }}>{row.neutral ?? '�'}</span></td>
                  <td style={S.td}><span style={{ color: '#ef4444' }}>{row.negative ?? '�'}</span></td>
                </tr>
              ))}
              </tbody>
            </table>
          )}
        </div>
      ) : <div style={S.muted}>Click Refresh to load trends.</div>}
    </div>
  );

  if (tab === 4) {
    const handleSummary = async () => {
      setSumLoading(true);
      try { const d = await apiFetch(`${BASE}/sentiment/summary`, { method: 'POST', body: JSON.stringify(summaryForm) }); setSummaryData(d); } catch(e){}
      setSumLoading(false);
    };
    return (
      <div style={S.card}>
        <div style={S.h2}>Sentiment Summary</div>
        <div style={S.formGroup}><label style={S.label}>Period</label>
          <select style={S.select} value={summaryForm.period} onChange={e=>setSummaryForm(f=>({...f,period:e.target.value}))}>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="last90days">Last 90 Days</option>
            <option value="alltime">All Time</option>
          </select>
        </div>
        <button style={S.btn} onClick={handleSummary} disabled={sumLoading}>{sumLoading ? 'Generating...' : 'Generate Summary'}</button>
        {summaryData && (
          <div style={{ ...S.elevated, marginTop: '16px' }}>
            <div style={S.grid4}>
              <StatCard label="Total Analyzed" value={summaryData.totalAnalyzed} color="#4f46e5" />
              <StatCard label="Positive %" value={summaryData.positivePercent ? summaryData.positivePercent + '%' : null} color="#22c55e" />
              <StatCard label="Neutral %" value={summaryData.neutralPercent ? summaryData.neutralPercent + '%' : null} color="#eab308" />
              <StatCard label="Negative %" value={summaryData.negativePercent ? summaryData.negativePercent + '%' : null} color="#ef4444" />
            </div>
            {summaryData.topKeywords && summaryData.topKeywords.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ ...S.label, marginBottom: '8px' }}>Top Keywords</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {summaryData.topKeywords.map((k, i) => <span key={i} style={{ ...S.badge('#a78bfa'), padding: '2px 10px' }}>{typeof k === 'string' ? k : `${k.word} (${k.count})`}</span>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (tab === 5) return (
    <div style={S.card}>
      <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={S.h2}>Sentiment Statistics</div>
        <button style={S.btn} onClick={loadStats}>Refresh</button>
      </div>
      {stats ? (
        <div style={S.grid4}>
          <StatCard label="Analyzed" value={stats.totalAnalyzed} color="#4f46e5" />
          <StatCard label="Positive" value={stats.positive} color="#22c55e" />
          <StatCard label="Neutral" value={stats.neutral} color="#eab308" />
          <StatCard label="Negative" value={stats.negative} color="#ef4444" />
        </div>
      ) : <div style={S.muted}>Click Refresh to load stats.</div>}
    </div>
  );

  return null;
}
// ----------------------------------------------------------
// SOCIAL PROOF
// ----------------------------------------------------------
function SocialProof({ tab }) {
  const [rules, setRules] = useState([]);
  const [badges, setBadges] = useState([]);
  const [elements, setElements] = useState([]);
  const [abTests, setAbTests] = useState([]);
  const [insights, setInsights] = useState(null);
  const [stats, setStats] = useState(null);
  const [ruleForm, setRuleForm] = useState({ name: '', trigger: 'purchase', displayType: 'popup', minRating: 4 });
  const [badgeForm, setBadgeForm] = useState({ name: '', type: 'verified', label: '' });
  const [elemForm, setElemForm] = useState({ type: 'recent-purchase', position: 'bottom-left', delay: 5 });
  const [abForm, setAbForm] = useState({ name: '', variantA: '', variantB: '' });
  const [msg, setMsg] = useState('');

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3000); };
  const loadRules = useCallback(async () => { try { const d = await apiFetch(`${BASE}/social-proof/display-rules`); setRules(Array.isArray(d) ? d : (d.rules || [])); } catch(e){} }, []);
  const loadBadges = useCallback(async () => { try { const d = await apiFetch(`${BASE}/social-proof/trust-badges`); setBadges(Array.isArray(d) ? d : (d.badges || [])); } catch(e){} }, []);
  const loadElements = useCallback(async () => { try { const d = await apiFetch(`${BASE}/social-proof/elements/get`, { method: 'POST', body: JSON.stringify({}) }); setElements(Array.isArray(d) ? d : (d.elements || [])); } catch(e){} }, []);
  const loadAbTests = useCallback(async () => { try { const d = await apiFetch(`${BASE}/social-proof/ab-tests`); setAbTests(Array.isArray(d) ? d : (d.tests || [])); } catch(e){} }, []);
  const loadInsights = useCallback(async () => { try { const d = await apiFetch(`${BASE}/social-proof/conversion-insights`, { method: 'POST', body: JSON.stringify({}) }); setInsights(d); } catch(e){} }, []);
  const loadStats = useCallback(async () => { try { const d = await apiFetch(`${BASE}/social-proof/statistics`); setStats(d); } catch(e){} }, []);

  useEffect(() => {
    if (tab === 0) loadRules();
    else if (tab === 1) loadBadges();
    else if (tab === 2) loadElements();
    else if (tab === 3) loadAbTests();
    else if (tab === 4) loadInsights();
    else if (tab === 5) loadStats();
  }, [tab]);

  const createRule = async () => { await apiFetch(`${BASE}/social-proof/display-rules`, { method: 'POST', body: JSON.stringify(ruleForm) }); setRuleForm({ name: '', trigger: 'purchase', displayType: 'popup', minRating: 4 }); loadRules(); flash('Rule created'); };
  const deleteRule = async (id) => { await apiFetch(`${BASE}/social-proof/display-rules/${id}`, { method: 'DELETE' }); loadRules(); };
  const createBadge = async () => { await apiFetch(`${BASE}/social-proof/trust-badges`, { method: 'POST', body: JSON.stringify(badgeForm) }); setBadgeForm({ name: '', type: 'verified', label: '' }); loadBadges(); flash('Badge created'); };
  const deleteBadge = async (id) => { await apiFetch(`${BASE}/social-proof/trust-badges/${id}`, { method: 'DELETE' }); loadBadges(); };
  const createElement = async () => { await apiFetch(`${BASE}/social-proof/elements`, { method: 'POST', body: JSON.stringify(elemForm) }); setElemForm({ type: 'recent-purchase', position: 'bottom-left', delay: 5 }); loadElements(); flash('Element created'); };
  const createAbTest = async () => { await apiFetch(`${BASE}/social-proof/ab-tests`, { method: 'POST', body: JSON.stringify(abForm) }); setAbForm({ name: '', variantA: '', variantB: '' }); loadAbTests(); flash('Test created'); };

  if (tab === 0) return (
    <div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      <div style={S.card}>
        <div style={S.h2}>New Display Rule</div>
        <div style={S.grid2}>
          <div style={S.formGroup}><label style={S.label}>Rule Name</label><input style={S.input} value={ruleForm.name} onChange={e=>setRuleForm(f=>({...f,name:e.target.value}))} /></div>
          <div style={S.formGroup}><label style={S.label}>Trigger</label>
            <select style={S.select} value={ruleForm.trigger} onChange={e=>setRuleForm(f=>({...f,trigger:e.target.value}))}>
              <option value="purchase">Recent Purchase</option><option value="view">Product View</option><option value="add_to_cart">Add to Cart</option>
            </select>
          </div>
          <div style={S.formGroup}><label style={S.label}>Display Type</label>
            <select style={S.select} value={ruleForm.displayType} onChange={e=>setRuleForm(f=>({...f,displayType:e.target.value}))}>
              <option value="popup">Popup</option><option value="banner">Banner</option><option value="inline">Inline</option>
            </select>
          </div>
          <div style={S.formGroup}><label style={S.label}>Min Rating</label>
            <select style={S.select} value={ruleForm.minRating} onChange={e=>setRuleForm(f=>({...f,minRating:+e.target.value}))}>
              {[1,2,3,4,5].map(n=><option key={n} value={n}>{n} star+</option>)}
            </select>
          </div>
        </div>
        <button style={S.btn} onClick={createRule}>Create Rule</button>
      </div>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Name</th><th style={S.th}>Trigger</th><th style={S.th}>Display</th><th style={S.th}>Min Rating</th><th style={S.th}>Actions</th></tr></thead>
        <tbody>
          {rules.length === 0 && <tr><td style={S.td} colSpan={5}><span style={S.muted}>No rules yet.</span></td></tr>}
          {rules.map(r => <tr key={r.id||r._id}><td style={S.td}>{r.name}</td><td style={S.td}>{r.trigger}</td><td style={S.td}>{r.displayType}</td><td style={S.td}><StarRating value={r.minRating} /></td><td style={S.td}><button style={S.btnDanger} onClick={()=>deleteRule(r.id||r._id)}>Delete</button></td></tr>)}
        </tbody>
      </table>
    </div>
  );

  if (tab === 1) return (
    <div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      <div style={S.card}>
        <div style={S.h2}>New Trust Badge</div>
        <div style={S.grid3}>
          <div style={S.formGroup}><label style={S.label}>Badge Name</label><input style={S.input} value={badgeForm.name} onChange={e=>setBadgeForm(f=>({...f,name:e.target.value}))} /></div>
          <div style={S.formGroup}><label style={S.label}>Type</label>
            <select style={S.select} value={badgeForm.type} onChange={e=>setBadgeForm(f=>({...f,type:e.target.value}))}>
              <option value="verified">Verified Purchase</option><option value="top_reviewer">Top Reviewer</option><option value="authentic">Authentic</option>
            </select>
          </div>
          <div style={S.formGroup}><label style={S.label}>Label</label><input style={S.input} value={badgeForm.label} onChange={e=>setBadgeForm(f=>({...f,label:e.target.value}))} placeholder="e.g. Verified Buyer" /></div>
        </div>
        <button style={S.btn} onClick={createBadge}>Create Badge</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        {badges.length === 0 && <span style={S.muted}>No badges yet.</span>}
        {badges.map(b => (
          <div key={b.id||b._id} style={{ ...S.elevated, minWidth: '160px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>?</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{b.name}</div>
            <div style={{ ...S.muted, marginBottom: '8px' }}>{b.label}</div>
            <button style={S.btnDanger} onClick={()=>deleteBadge(b.id||b._id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );

  if (tab === 2) return (
    <div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      <div style={S.card}>
        <div style={S.h2}>New Social Element</div>
        <div style={S.grid3}>
          <div style={S.formGroup}><label style={S.label}>Type</label>
            <select style={S.select} value={elemForm.type} onChange={e=>setElemForm(f=>({...f,type:e.target.value}))}>
              <option value="recent-purchase">Recent Purchase</option><option value="low-stock">Low Stock</option><option value="visitor-count">Visitor Count</option><option value="review-count">Review Count</option>
            </select>
          </div>
          <div style={S.formGroup}><label style={S.label}>Position</label>
            <select style={S.select} value={elemForm.position} onChange={e=>setElemForm(f=>({...f,position:e.target.value}))}>
              <option value="bottom-left">Bottom Left</option><option value="bottom-right">Bottom Right</option><option value="top-right">Top Right</option>
            </select>
          </div>
          <div style={S.formGroup}><label style={S.label}>Delay (sec)</label><input type="number" style={S.input} value={elemForm.delay} onChange={e=>setElemForm(f=>({...f,delay:+e.target.value}))} /></div>
        </div>
        <button style={S.btn} onClick={createElement}>Create Element</button>
      </div>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Type</th><th style={S.th}>Position</th><th style={S.th}>Delay</th></tr></thead>
        <tbody>
          {elements.length === 0 && <tr><td style={S.td} colSpan={3}><span style={S.muted}>No elements yet.</span></td></tr>}
          {elements.map(el => <tr key={el.id||el._id}><td style={S.td}>{el.type}</td><td style={S.td}>{el.position}</td><td style={S.td}>{el.delay}s</td></tr>)}
        </tbody>
      </table>
    </div>
  );

  if (tab === 3) return (
    <div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      <div style={S.card}>
        <div style={S.h2}>New A/B Test</div>
        <div style={S.formGroup}><label style={S.label}>Test Name</label><input style={S.input} value={abForm.name} onChange={e=>setAbForm(f=>({...f,name:e.target.value}))} /></div>
        <div style={S.grid2}>
          <div style={S.formGroup}><label style={S.label}>Variant A</label><textarea style={S.textarea} value={abForm.variantA} onChange={e=>setAbForm(f=>({...f,variantA:e.target.value}))} placeholder="Social proof config A" /></div>
          <div style={S.formGroup}><label style={S.label}>Variant B</label><textarea style={S.textarea} value={abForm.variantB} onChange={e=>setAbForm(f=>({...f,variantB:e.target.value}))} placeholder="Social proof config B" /></div>
        </div>
        <button style={S.btn} onClick={createAbTest}>Create Test</button>
      </div>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Name</th><th style={S.th}>Status</th><th style={S.th}>Conversion A</th><th style={S.th}>Conversion B</th></tr></thead>
        <tbody>
          {abTests.length === 0 && <tr><td style={S.td} colSpan={4}><span style={S.muted}>No A/B tests yet.</span></td></tr>}
          {abTests.map(t => <tr key={t.id||t._id}><td style={S.td}>{t.name}</td><td style={S.td}><span style={S.badge(t.status==='running'?'#22c55e':'#71717a')}>{t.status||'draft'}</span></td><td style={S.td}>{t.conversionA ?? '�'}</td><td style={S.td}>{t.conversionB ?? '�'}</td></tr>)}
        </tbody>
      </table>
    </div>
  );

  if (tab === 4) return (
    <div style={S.card}>
      <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={S.h2}>Conversion Insights</div>
        <button style={S.btn} onClick={loadInsights}>Refresh</button>
      </div>
      {insights ? (
        <div>
          <div style={S.grid3}>
            <StatCard label="Conversion Rate" value={insights.conversionRate ? insights.conversionRate + '%' : null} color="#22c55e" />
            <StatCard label="Lift from Social Proof" value={insights.lift ? '+' + insights.lift + '%' : null} color="#4f46e5" />
            <StatCard label="Impressions" value={insights.impressions} color="#a78bfa" />
          </div>
          {insights.topPerforming && (
            <div style={{ ...S.elevated, marginTop: '16px' }}>
              <div style={{ ...S.label, marginBottom: '8px' }}>Top Performing Elements</div>
              {insights.topPerforming.map((e, i) => (
                <div key={i} style={{ ...S.muted, marginBottom: '6px' }}>{e.name || e.type}: <span style={{ color: '#22c55e' }}>{e.conversion}%</span></div>
              ))}
            </div>
          )}
        </div>
      ) : <div style={S.muted}>Click Refresh to load conversion insights.</div>}
    </div>
  );

  if (tab === 5) return (
    <div style={S.card}>
      <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={S.h2}>Social Proof Statistics</div>
        <button style={S.btn} onClick={loadStats}>Refresh</button>
      </div>
      {stats ? (
        <div style={S.grid4}>
          <StatCard label="Active Rules" value={stats.activeRules} color="#4f46e5" />
          <StatCard label="Badges" value={stats.badges} color="#a78bfa" />
          <StatCard label="A/B Tests" value={stats.abTests} color="#eab308" />
          <StatCard label="Impressions" value={stats.impressions} color="#22c55e" />
        </div>
      ) : <div style={S.muted}>Click Refresh to load stats.</div>}
    </div>
  );

  return null;
}
// ----------------------------------------------------------
// DISPLAY & WIDGETS
// ----------------------------------------------------------
function DisplayWidgets({ tab }) {
  const [widgets, setWidgets] = useState([]);
  const [carousels, setCarousels] = useState([]);
  const [embeds, setEmbeds] = useState([]);
  const [themes, setThemes] = useState([]);
  const [stats, setStats] = useState(null);
  const [wForm, setWForm] = useState({ name: '', type: 'star-rating', layout: 'grid', maxReviews: 10 });
  const [cForm, setCForm] = useState({ name: '', autoplay: true, speed: 4000, showRating: true });
  const [eForm, setEForm] = useState({ name: '', productId: '', showCount: 5 });
  const [tForm, setTForm] = useState({ name: '', primaryColor: '#4f46e5', backgroundColor: '#18181b', textColor: '#fafafa' });
  const [msg, setMsg] = useState('');
  const [previewWidgetId, setPreviewWidgetId] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [prevLoading, setPrevLoading] = useState(false);

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3000); };
  const loadWidgets = useCallback(async () => { try { const d = await apiFetch(`${BASE}/widgets`); setWidgets(Array.isArray(d) ? d : (d.widgets || [])); } catch(e){} }, []);
  const loadCarousels = useCallback(async () => { try { const d = await apiFetch(`${BASE}/carousels`); setCarousels(Array.isArray(d) ? d : (d.carousels || [])); } catch(e){} }, []);
  const loadEmbeds = useCallback(async () => { try { const d = await apiFetch(`${BASE}/widgets/embeds`); setEmbeds(Array.isArray(d) ? d : (d.embeds || [])); } catch(e){} }, []);
  const loadThemes = useCallback(async () => { try { const d = await apiFetch(`${BASE}/themes`); setThemes(Array.isArray(d) ? d : (d.themes || [])); } catch(e){} }, []);
  const loadStats = useCallback(async () => { try { const d = await apiFetch(`${BASE}/display/statistics`); setStats(d); } catch(e){} }, []);

  useEffect(() => {
    if (tab === 0) loadWidgets();
    else if (tab === 1) loadCarousels();
    else if (tab === 2) loadEmbeds();
    else if (tab === 3) loadThemes();
    else if (tab === 5) loadStats();
  }, [tab]);

  const createWidget = async () => { await apiFetch(`${BASE}/widgets`, { method: 'POST', body: JSON.stringify(wForm) }); setWForm({ name: '', type: 'star-rating', layout: 'grid', maxReviews: 10 }); loadWidgets(); flash('Widget created'); };
  const deleteWidget = async (id) => { await apiFetch(`${BASE}/widgets/${id}`, { method: 'DELETE' }); loadWidgets(); };
  const createCarousel = async () => { await apiFetch(`${BASE}/carousels`, { method: 'POST', body: JSON.stringify(cForm) }); setCForm({ name: '', autoplay: true, speed: 4000, showRating: true }); loadCarousels(); flash('Carousel created'); };
  const createEmbed = async () => { await apiFetch(`${BASE}/embeds`, { method: 'POST', body: JSON.stringify(eForm) }); setEForm({ name: '', productId: '', showCount: 5 }); loadEmbeds(); flash('Embed created'); };
  const createTheme = async () => { await apiFetch(`${BASE}/themes`, { method: 'POST', body: JSON.stringify(tForm) }); setTForm({ name: '', primaryColor: '#4f46e5', backgroundColor: '#18181b', textColor: '#fafafa' }); loadThemes(); flash('Theme saved'); };

  if (tab === 0) return (
    <div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      <div style={S.card}>
        <div style={S.h2}>New Review Widget</div>
        <div style={S.grid2}>
          <div style={S.formGroup}><label style={S.label}>Name</label><input style={S.input} value={wForm.name} onChange={e=>setWForm(f=>({...f,name:e.target.value}))} /></div>
          <div style={S.formGroup}><label style={S.label}>Widget Type</label>
            <select style={S.select} value={wForm.type} onChange={e=>setWForm(f=>({...f,type:e.target.value}))}>
              <option value="star-rating">Star Rating</option><option value="review-list">Review List</option><option value="summary">Summary Box</option><option value="badge">Badge</option>
            </select>
          </div>
          <div style={S.formGroup}><label style={S.label}>Layout</label>
            <select style={S.select} value={wForm.layout} onChange={e=>setWForm(f=>({...f,layout:e.target.value}))}>
              <option value="grid">Grid</option><option value="list">List</option><option value="masonry">Masonry</option>
            </select>
          </div>
          <div style={S.formGroup}><label style={S.label}>Max Reviews</label><input type="number" style={S.input} value={wForm.maxReviews} onChange={e=>setWForm(f=>({...f,maxReviews:+e.target.value}))} /></div>
        </div>
        <button style={S.btn} onClick={createWidget}>Create Widget</button>
      </div>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Name</th><th style={S.th}>Type</th><th style={S.th}>Layout</th><th style={S.th}>Max Reviews</th><th style={S.th}>Actions</th></tr></thead>
        <tbody>
          {widgets.length === 0 && <tr><td style={S.td} colSpan={5}><span style={S.muted}>No widgets yet.</span></td></tr>}
          {widgets.map(w => <tr key={w.id||w._id}><td style={S.td}>{w.name}</td><td style={S.td}>{w.type}</td><td style={S.td}>{w.layout}</td><td style={S.td}>{w.maxReviews}</td><td style={S.td}><button style={S.btnDanger} onClick={()=>deleteWidget(w.id||w._id)}>Delete</button></td></tr>)}
        </tbody>
      </table>
    </div>
  );

  if (tab === 1) return (
    <div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      <div style={S.card}>
        <div style={S.h2}>New Carousel</div>
        <div style={S.grid2}>
          <div style={S.formGroup}><label style={S.label}>Name</label><input style={S.input} value={cForm.name} onChange={e=>setCForm(f=>({...f,name:e.target.value}))} /></div>
          <div style={S.formGroup}><label style={S.label}>Speed (ms)</label><input type="number" style={S.input} value={cForm.speed} onChange={e=>setCForm(f=>({...f,speed:+e.target.value}))} /></div>
        </div>
        <div style={{ ...S.row, gap: '16px', marginBottom: '14px' }}>
          <label style={{ ...S.row, cursor: 'pointer', fontSize: '14px' }}><input type="checkbox" checked={cForm.autoplay} onChange={e=>setCForm(f=>({...f,autoplay:e.target.checked}))} style={{ marginRight: '6px' }} /> Autoplay</label>
          <label style={{ ...S.row, cursor: 'pointer', fontSize: '14px' }}><input type="checkbox" checked={cForm.showRating} onChange={e=>setCForm(f=>({...f,showRating:e.target.checked}))} style={{ marginRight: '6px' }} /> Show Rating</label>
        </div>
        <button style={S.btn} onClick={createCarousel}>Create Carousel</button>
      </div>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Name</th><th style={S.th}>Autoplay</th><th style={S.th}>Speed</th><th style={S.th}>Show Rating</th></tr></thead>
        <tbody>
          {carousels.length === 0 && <tr><td style={S.td} colSpan={4}><span style={S.muted}>No carousels yet.</span></td></tr>}
          {carousels.map(c => <tr key={c.id||c._id}><td style={S.td}>{c.name}</td><td style={S.td}>{c.autoplay ? 'Yes' : 'No'}</td><td style={S.td}>{c.speed}ms</td><td style={S.td}>{c.showRating ? 'Yes' : 'No'}</td></tr>)}
        </tbody>
      </table>
    </div>
  );

  if (tab === 2) return (
    <div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      <div style={S.card}>
        <div style={S.h2}>New Embed</div>
        <div style={S.grid3}>
          <div style={S.formGroup}><label style={S.label}>Name</label><input style={S.input} value={eForm.name} onChange={e=>setEForm(f=>({...f,name:e.target.value}))} /></div>
          <div style={S.formGroup}><label style={S.label}>Product ID</label><input style={S.input} value={eForm.productId} onChange={e=>setEForm(f=>({...f,productId:e.target.value}))} /></div>
          <div style={S.formGroup}><label style={S.label}>Show Count</label><input type="number" style={S.input} value={eForm.showCount} onChange={e=>setEForm(f=>({...f,showCount:+e.target.value}))} /></div>
        </div>
        <button style={S.btn} onClick={createEmbed}>Create Embed</button>
      </div>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Name</th><th style={S.th}>Product ID</th><th style={S.th}>Count</th><th style={S.th}>Embed Code</th></tr></thead>
        <tbody>
          {embeds.length === 0 && <tr><td style={S.td} colSpan={4}><span style={S.muted}>No embeds yet.</span></td></tr>}
          {embeds.map(em => <tr key={em.id||em._id}><td style={S.td}>{em.name}</td><td style={S.td}>{em.productId || '�'}</td><td style={S.td}>{em.showCount}</td><td style={S.td}><code style={{ color: '#a78bfa', fontSize: '12px' }}>{`<div data-aura-reviews="${em.id||em._id}"></div>`}</code></td></tr>)}
        </tbody>
      </table>
    </div>
  );

  if (tab === 3) return (
    <div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      <div style={S.card}>
        <div style={S.h2}>New Theme</div>
        <div style={S.grid2}>
          <div style={S.formGroup}><label style={S.label}>Theme Name</label><input style={S.input} value={tForm.name} onChange={e=>setTForm(f=>({...f,name:e.target.value}))} /></div>
          <div style={S.formGroup}><label style={S.label}>Primary Color</label>
            <div style={S.row}><input type="color" value={tForm.primaryColor} onChange={e=>setTForm(f=>({...f,primaryColor:e.target.value}))} style={{ width: '40px', height: '36px', cursor: 'pointer', borderRadius: '4px', border: 'none' }} /><input style={{ ...S.input, flex: 1 }} value={tForm.primaryColor} onChange={e=>setTForm(f=>({...f,primaryColor:e.target.value}))} /></div>
          </div>
          <div style={S.formGroup}><label style={S.label}>Background Color</label>
            <div style={S.row}><input type="color" value={tForm.backgroundColor} onChange={e=>setTForm(f=>({...f,backgroundColor:e.target.value}))} style={{ width: '40px', height: '36px', cursor: 'pointer', borderRadius: '4px', border: 'none' }} /><input style={{ ...S.input, flex: 1 }} value={tForm.backgroundColor} onChange={e=>setTForm(f=>({...f,backgroundColor:e.target.value}))} /></div>
          </div>
          <div style={S.formGroup}><label style={S.label}>Text Color</label>
            <div style={S.row}><input type="color" value={tForm.textColor} onChange={e=>setTForm(f=>({...f,textColor:e.target.value}))} style={{ width: '40px', height: '36px', cursor: 'pointer', borderRadius: '4px', border: 'none' }} /><input style={{ ...S.input, flex: 1 }} value={tForm.textColor} onChange={e=>setTForm(f=>({...f,textColor:e.target.value}))} /></div>
          </div>
        </div>
        <button style={S.btn} onClick={createTheme}>Save Theme</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        {themes.length === 0 && <span style={S.muted}>No themes yet.</span>}
        {themes.map(t => (
          <div key={t.id||t._id} style={{ background: t.backgroundColor || '#18181b', border: '1px solid #3f3f46', borderRadius: '10px', padding: '16px', minWidth: '160px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: t.textColor || '#fafafa', marginBottom: '4px' }}>{t.name}</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: t.primaryColor }} title="Primary" />
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: t.backgroundColor, border: '1px solid #3f3f46' }} title="Background" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (tab === 4) {
    const handlePreview = async () => {
      if (!previewWidgetId.trim()) return;
      setPrevLoading(true);
      try { const d = await apiFetch(`${BASE}/widgets/${previewWidgetId}/preview`, { method: 'POST', body: JSON.stringify({}) }); setPreviewData(d); } catch(e){}
      setPrevLoading(false);
    };
    return (
      <div style={S.card}>
        <div style={S.h2}>Widget Preview</div>
        <div style={S.formGroup}><label style={S.label}>Widget ID</label>
          <div style={S.row}>
            <input style={{ ...S.input, flex: 1 }} value={previewWidgetId} onChange={e=>setPreviewWidgetId(e.target.value)} placeholder="Enter widget ID to preview" />
            <button style={S.btn} onClick={handlePreview} disabled={prevLoading}>{prevLoading ? 'Loading...' : 'Preview'}</button>
          </div>
        </div>
        {previewData && (
          <div style={{ ...S.elevated, marginTop: '16px' }}>
            <div style={{ ...S.label, marginBottom: '12px' }}>Preview</div>
            <div style={{ background: previewData.backgroundColor || '#18181b', border: '1px solid #3f3f46', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>{previewData.name || 'Widget Preview'}</div>
              <div style={{ ...S.muted }}>{previewData.type} — {previewData.layout} layout</div>
              {previewData.sampleReviews && previewData.sampleReviews.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  {previewData.sampleReviews.slice(0, 3).map((r, i) => (
                    <div key={i} style={{ background: '#27272a', borderRadius: '6px', padding: '10px', marginBottom: '8px' }}>
                      <div style={{ ...S.row, marginBottom: '4px' }}>
                        <StarRating value={r.rating} />
                        <span style={{ ...S.muted, fontSize: '12px', marginLeft: '8px' }}>{r.authorName}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#d4d4d8' }}>{r.body || r.title}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (tab === 5) return (
    <div style={S.card}>
      <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={S.h2}>Widget Statistics</div>
        <button style={S.btn} onClick={loadStats}>Refresh</button>
      </div>
      {stats ? (
        <div style={S.grid4}>
          <StatCard label="Widgets" value={stats.widgets || stats.totalWidgets} color="#4f46e5" />
          <StatCard label="Carousels" value={stats.carousels} color="#a78bfa" />
          <StatCard label="Embeds" value={stats.embeds} color="#22c55e" />
          <StatCard label="Themes" value={stats.themes} color="#eab308" />
        </div>
      ) : <div style={S.muted}>Click Refresh to load stats.</div>}
    </div>
  );

  return null;
}
// ----------------------------------------------------------
// ANALYTICS & INSIGHTS
// ----------------------------------------------------------
function AnalyticsInsights({ tab }) {
  const [events, setEvents] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [collPerf, setCollPerf] = useState(null);
  const [reports, setReports] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [eventForm, setEventForm] = useState({ type: 'review_viewed', productId: '', reviewId: '', metadata: '' });
  const [repForm, setRepForm] = useState({ name: '', type: 'weekly', metrics: '' });
  const [dashForm, setDashForm] = useState({ name: '', widgets: '' });
  const [alertForm, setAlertForm] = useState({ name: '', metric: 'rating', condition: 'below', threshold: 4 });
  const [msg, setMsg] = useState('');

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3000); };
  const loadMetrics = useCallback(async () => { try { const d = await apiFetch(`${BASE}/analytics/reviews`); setMetrics(d); } catch(e){} }, []);
  const loadCollPerf = useCallback(async () => { try { const d = await apiFetch(`${BASE}/analytics/collection`); setCollPerf(d); } catch(e){} }, []);
  const loadReports = useCallback(async () => { try { const d = await apiFetch(`${BASE}/analytics/reports`); setReports(Array.isArray(d) ? d : (d.reports || [])); } catch(e){} }, []);
  const loadDashboards = useCallback(async () => { try { const d = await apiFetch(`${BASE}/analytics/dashboards`); setDashboards(Array.isArray(d) ? d : (d.dashboards || [])); } catch(e){} }, []);
  const loadAlerts = useCallback(async () => { try { const d = await apiFetch(`${BASE}/analytics/alerts`); setAlerts(Array.isArray(d) ? d : (d.alerts || [])); } catch(e){} }, []);
  const loadStats = useCallback(async () => { try { const d = await apiFetch(`${BASE}/analytics/statistics`); setStats(d); } catch(e){} }, []);

  useEffect(() => {
    if (tab === 1) loadMetrics();
    else if (tab === 2) loadCollPerf();
    else if (tab === 3) loadReports();
    else if (tab === 4) loadDashboards();
    else if (tab === 5) loadAlerts();
    else if (tab === 6) loadStats();
  }, [tab]);

  const trackEvent = async () => {
    const payload = { type: eventForm.type, productId: eventForm.productId, reviewId: eventForm.reviewId };
    if (eventForm.metadata.trim()) { try { payload.metadata = JSON.parse(eventForm.metadata); } catch(e) { payload.metadata = eventForm.metadata; } }
    await apiFetch(`${BASE}/analytics/events`, { method: 'POST', body: JSON.stringify(payload) });
    flash('Event tracked');
  };
  const createReport = async () => { await apiFetch(`${BASE}/analytics/reports`, { method: 'POST', body: JSON.stringify(repForm) }); setRepForm({ name: '', type: 'weekly', metrics: '' }); loadReports(); flash('Report created'); };
  const createDashboard = async () => { await apiFetch(`${BASE}/analytics/dashboards`, { method: 'POST', body: JSON.stringify(dashForm) }); setDashForm({ name: '', widgets: '' }); loadDashboards(); flash('Dashboard created'); };
  const createAlert = async () => { await apiFetch(`${BASE}/analytics/alerts`, { method: 'POST', body: JSON.stringify(alertForm) }); setAlertForm({ name: '', metric: 'rating', condition: 'below', threshold: 4 }); loadAlerts(); flash('Alert created'); };
  const deleteAlert = async (id) => { await apiFetch(`${BASE}/analytics/alerts/${id}`, { method: 'DELETE' }); loadAlerts(); };
  const checkAlerts = async () => { const d = await apiFetch(`${BASE}/analytics/alerts/check`, { method: 'POST' }); flash(`Checked alerts: ${d.triggered ?? 0} triggered`); };

  const refreshBtn = (fn) => <button style={S.btn} onClick={fn}>Refresh</button>;

  // tab 0: Events
  if (tab === 0) return (
    <div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      <div style={S.card}>
        <div style={S.h2}>Track Analytics Event</div>
        <div style={S.grid2}>
          <div style={S.formGroup}><label style={S.label}>Event Type</label>
            <select style={S.select} value={eventForm.type} onChange={e=>setEventForm(f=>({...f,type:e.target.value}))}>
              <option value="review_viewed">Review Viewed</option>
              <option value="review_helpful">Review Helpful</option>
              <option value="review_shared">Review Shared</option>
              <option value="widget_impression">Widget Impression</option>
              <option value="widget_click">Widget Click</option>
              <option value="collection_started">Collection Started</option>
              <option value="collection_completed">Collection Completed</option>
            </select>
          </div>
          <div style={S.formGroup}><label style={S.label}>Product ID (optional)</label><input style={S.input} value={eventForm.productId} onChange={e=>setEventForm(f=>({...f,productId:e.target.value}))} placeholder="gid://shopify/Product/..." /></div>
          <div style={S.formGroup}><label style={S.label}>Review ID (optional)</label><input style={S.input} value={eventForm.reviewId} onChange={e=>setEventForm(f=>({...f,reviewId:e.target.value}))} /></div>
          <div style={S.formGroup}><label style={S.label}>Metadata (JSON, optional)</label><input style={S.input} value={eventForm.metadata} onChange={e=>setEventForm(f=>({...f,metadata:e.target.value}))} placeholder='{"source":"email"}' /></div>
        </div>
        <button style={S.btn} onClick={trackEvent}>Track Event</button>
      </div>
    </div>
  );

  // tab 1: Review Metrics
  if (tab === 1) return (
    <div style={S.card}>
      <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={S.h2}>Review Metrics</div>{refreshBtn(loadMetrics)}
      </div>
      {metrics ? (
        <div>
          <div style={S.grid4}>
            <StatCard label="Total Reviews" value={metrics.totalReviews || metrics.total} color="#4f46e5" />
            <StatCard label="Avg Rating" value={metrics.averageRating?.toFixed(1)} color="#eab308" />
            <StatCard label="This Month" value={metrics.thisMonth} color="#22c55e" />
            <StatCard label="Response Rate" value={metrics.responseRate ? metrics.responseRate + '%' : null} color="#a78bfa" />
          </div>
          {metrics.byProduct && (
            <div style={{ marginTop: '16px' }}>
              <div style={S.h2}>By Product</div>
              <table style={S.table}>
                <thead><tr><th style={S.th}>Product</th><th style={S.th}>Reviews</th><th style={S.th}>Avg Rating</th></tr></thead>
                <tbody>{metrics.byProduct.map((p, i) => <tr key={i}><td style={S.td}>{p.productName || p.productId}</td><td style={S.td}>{p.count}</td><td style={S.td}><StarRating value={Math.round(p.avgRating)} /></td></tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      ) : <div style={S.muted}>Click Refresh to load metrics.</div>}
    </div>
  );

  // tab 2: Collection Performance
  if (tab === 2) return (
    <div style={S.card}>
      <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={S.h2}>Collection Performance</div>{refreshBtn(loadCollPerf)}
      </div>
      {collPerf ? (
        <div style={S.grid4}>
          <StatCard label="Requests Sent" value={collPerf.requestsSent} color="#4f46e5" />
          <StatCard label="Opened" value={collPerf.opened} color="#a78bfa" />
          <StatCard label="Clicked" value={collPerf.clicked} color="#22c55e" />
          <StatCard label="Converted" value={collPerf.converted} color="#eab308" />
        </div>
      ) : <div style={S.muted}>Click Refresh to load collection performance.</div>}
    </div>
  );

  // tab 3: Reports
  if (tab === 3) return (
    <div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      <div style={S.card}>
        <div style={S.h2}>New Report</div>
        <div style={S.grid3}>
          <div style={S.formGroup}><label style={S.label}>Report Name</label><input style={S.input} value={repForm.name} onChange={e=>setRepForm(f=>({...f,name:e.target.value}))} /></div>
          <div style={S.formGroup}><label style={S.label}>Type</label>
            <select style={S.select} value={repForm.type} onChange={e=>setRepForm(f=>({...f,type:e.target.value}))}>
              <option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="custom">Custom</option>
            </select>
          </div>
          <div style={S.formGroup}><label style={S.label}>Metrics (comma separated)</label><input style={S.input} value={repForm.metrics} onChange={e=>setRepForm(f=>({...f,metrics:e.target.value}))} placeholder="reviews,ratings,sentiment" /></div>
        </div>
        <button style={S.btn} onClick={createReport}>Create Report</button>
      </div>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Name</th><th style={S.th}>Type</th><th style={S.th}>Created</th></tr></thead>
        <tbody>
          {reports.length === 0 && <tr><td style={S.td} colSpan={3}><span style={S.muted}>No reports yet.</span></td></tr>}
          {reports.map(r => <tr key={r.id||r._id}><td style={S.td}>{r.name}</td><td style={S.td}>{r.type}</td><td style={S.td}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td></tr>)}
        </tbody>
      </table>
    </div>
  );

  // tab 4: Dashboards
  if (tab === 4) return (
    <div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      <div style={S.card}>
        <div style={S.h2}>New Dashboard</div>
        <div style={S.grid2}>
          <div style={S.formGroup}><label style={S.label}>Dashboard Name</label><input style={S.input} value={dashForm.name} onChange={e=>setDashForm(f=>({...f,name:e.target.value}))} /></div>
          <div style={S.formGroup}><label style={S.label}>Widgets (comma separated IDs)</label><input style={S.input} value={dashForm.widgets} onChange={e=>setDashForm(f=>({...f,widgets:e.target.value}))} /></div>
        </div>
        <button style={S.btn} onClick={createDashboard}>Create Dashboard</button>
      </div>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Name</th><th style={S.th}>Created</th></tr></thead>
        <tbody>
          {dashboards.length === 0 && <tr><td style={S.td} colSpan={2}><span style={S.muted}>No dashboards yet.</span></td></tr>}
          {dashboards.map(d => <tr key={d.id||d._id}><td style={S.td}>{d.name}</td><td style={S.td}>{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}</td></tr>)}
        </tbody>
      </table>
    </div>
  );

  // tab 5: Alerts
  if (tab === 5) return (
    <div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      <div style={S.card}>
        <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={S.h2}>New Alert</div>
          <button style={S.btnGhost} onClick={checkAlerts}>Check Alerts</button>
        </div>
        <div style={S.grid2}>
          <div style={S.formGroup}><label style={S.label}>Alert Name</label><input style={S.input} value={alertForm.name} onChange={e=>setAlertForm(f=>({...f,name:e.target.value}))} /></div>
          <div style={S.formGroup}><label style={S.label}>Metric</label>
            <select style={S.select} value={alertForm.metric} onChange={e=>setAlertForm(f=>({...f,metric:e.target.value}))}>
              <option value="rating">Average Rating</option><option value="reviews">Review Count</option><option value="sentiment">Sentiment Score</option>
            </select>
          </div>
          <div style={S.formGroup}><label style={S.label}>Condition</label>
            <select style={S.select} value={alertForm.condition} onChange={e=>setAlertForm(f=>({...f,condition:e.target.value}))}>
              <option value="below">Falls Below</option><option value="above">Rises Above</option>
            </select>
          </div>
          <div style={S.formGroup}><label style={S.label}>Threshold</label><input type="number" style={S.input} value={alertForm.threshold} onChange={e=>setAlertForm(f=>({...f,threshold:+e.target.value}))} /></div>
        </div>
        <button style={S.btn} onClick={createAlert}>Create Alert</button>
      </div>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Alert</th><th style={S.th}>Metric</th><th style={S.th}>Condition</th><th style={S.th}>Threshold</th><th style={S.th}>Actions</th></tr></thead>
        <tbody>
          {alerts.length === 0 && <tr><td style={S.td} colSpan={5}><span style={S.muted}>No alerts yet.</span></td></tr>}
          {alerts.map(a => <tr key={a.id||a._id}><td style={S.td}>{a.name}</td><td style={S.td}>{a.metric}</td><td style={S.td}>{a.condition}</td><td style={S.td}>{a.threshold}</td><td style={S.td}><button style={S.btnDanger} onClick={()=>deleteAlert(a.id||a._id)}>Delete</button></td></tr>)}
        </tbody>
      </table>
    </div>
  );

  // tab 6: Statistics
  if (tab === 6) return (
    <div style={S.card}>
      <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={S.h2}>Analytics Statistics</div>{refreshBtn(loadStats)}
      </div>
      {stats ? (
        <div style={S.grid4}>
          <StatCard label="Total Events" value={stats.totalEvents} color="#4f46e5" />
          <StatCard label="Reports" value={stats.reports} color="#a78bfa" />
          <StatCard label="Dashboards" value={stats.dashboards} color="#22c55e" />
          <StatCard label="Active Alerts" value={stats.activeAlerts} color="#eab308" />
        </div>
      ) : <div style={S.muted}>Click Refresh to load stats.</div>}
    </div>
  );

  return null;
}
// ----------------------------------------------------------
// INTEGRATIONS
// ----------------------------------------------------------
function IntegrationsHub({ tab }) {
  const [services, setServices] = useState([]);
  const [shopifyStatus, setShopifyStatus] = useState(null);
  const [googleConfig, setGoogleConfig] = useState(null);
  const [webhooks, setWebhooks] = useState([]);
  const [syncLogs, setSyncLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [svcForm, setSvcForm] = useState({ name: '', apiKey: '', type: 'custom' });
  const [importUrl, setImportUrl] = useState('');
  const [googleForm, setGoogleForm] = useState({ merchantId: '', feedUrl: '', enabled: false });
  const [wbkForm, setWbkForm] = useState({ url: '', events: 'review.created', secret: '' });
  const [csvFile, setCsvFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3000); };
  const loadServices = useCallback(async () => { try { const d = await apiFetch(`${BASE}/integrations`); setServices(Array.isArray(d) ? d : (d.services || d.integrations || [])); } catch(e){} }, []);
  const loadShopify = useCallback(async () => { try { const d = await apiFetch(`${BASE}/integrations/shopify`); setShopifyStatus(d); } catch(e){} }, []);
  const loadGoogle = useCallback(async () => { try { const d = await apiFetch(`${BASE}/integrations/google-shopping`); setGoogleConfig(d); if (d) setGoogleForm({ merchantId: d.merchantId || '', feedUrl: d.feedUrl || '', enabled: d.enabled || false }); } catch(e){} }, []);
  const loadWebhooks = useCallback(async () => { try { const d = await apiFetch(`${BASE}/integrations/webhooks`); setWebhooks(Array.isArray(d) ? d : (d.webhooks || [])); } catch(e){} }, []);
  const loadSyncLogs = useCallback(async () => { try { const d = await apiFetch(`${BASE}/integrations/sync-logs`); setSyncLogs(Array.isArray(d) ? d : (d.logs || [])); } catch(e){} }, []);
  const loadStats = useCallback(async () => { try { const d = await apiFetch(`${BASE}/integrations/statistics`); setStats(d); } catch(e){} }, []);

  useEffect(() => {
    if (tab === 0) loadServices();
    else if (tab === 2) loadShopify();
    else if (tab === 3) loadGoogle();
    else if (tab === 4) loadWebhooks();
    else if (tab === 6) loadSyncLogs();
    else if (tab === 7) loadStats();
  }, [tab]);

  const connectService = async () => { await apiFetch(`${BASE}/integrations/${svcForm.type}/connect`, { method: 'POST', body: JSON.stringify({ apiKey: svcForm.apiKey, name: svcForm.name }) }); setSvcForm({ name: '', apiKey: '', type: 'custom' }); loadServices(); flash('Service connected'); };
  const disconnectService = async (id) => { await apiFetch(`${BASE}/integrations/${id}/disconnect`, { method: 'POST' }); loadServices(); };
  const handleImport = async () => { setLoading(true); const d = await apiFetch(`${BASE}/integrations/import-reviews`, { method: 'POST', body: JSON.stringify({ url: importUrl }) }); setLoading(false); flash(`Imported ${d.count || 'N/A'} reviews`); };
  const handleExport = async () => { setLoading(true); const d = await apiFetch(`${BASE}/integrations/export-reviews`, { method: 'POST' }); setLoading(false); if (d.downloadUrl) { window.open(d.downloadUrl, '_blank'); } else { flash('Export complete'); } };
  const triggerShopifySync = async () => { setLoading(true); const d = await apiFetch(`${BASE}/integrations/shopify/sync-products`, { method: 'POST' }); setLoading(false); setShopifyStatus(d); flash('Shopify sync triggered'); };
  const saveGoogleConfig = async () => { await apiFetch(`${BASE}/integrations/google-shopping/submit`, { method: 'POST', body: JSON.stringify(googleForm) }); flash('Google Shopping config saved'); loadGoogle(); };
  const createWebhook = async () => { await apiFetch(`${BASE}/integrations/webhooks`, { method: 'POST', body: JSON.stringify(wbkForm) }); setWbkForm({ url: '', events: 'review.created', secret: '' }); loadWebhooks(); flash('Webhook created'); };
  const deleteWebhook = async (id) => { await apiFetch(`${BASE}/integrations/webhooks/${id}`, { method: 'DELETE' }); loadWebhooks(); };
  const handleCsvImport = async () => {
    if (!csvFile) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      setLoading(true);
      const d = await apiFetch(`${BASE}/integrations/import-csv`, { method: 'POST', body: JSON.stringify({ csv: e.target.result }) });
      setLoading(false); flash(`CSV import: ${d.count || 'N/A'} reviews`);
    };
    reader.readAsText(csvFile);
  };
  const handleCsvExport = async () => {
    setLoading(true);
    const d = await apiFetch(`${BASE}/integrations/export-csv`, { method: 'POST' });
    setLoading(false);
    if (d.csv) {
      const blob = new Blob([d.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'reviews.csv'; a.click();
      URL.revokeObjectURL(url);
    } else { flash('CSV export complete'); }
  };

  if (tab === 0) return (
    <div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      <div style={S.card}>
        <div style={S.h2}>Connect Service</div>
        <div style={S.grid3}>
          <div style={S.formGroup}><label style={S.label}>Service Name</label><input style={S.input} value={svcForm.name} onChange={e=>setSvcForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Yotpo, Okendo..." /></div>
          <div style={S.formGroup}><label style={S.label}>Type</label>
            <select style={S.select} value={svcForm.type} onChange={e=>setSvcForm(f=>({...f,type:e.target.value}))}>
              <option value="yotpo">Yotpo</option><option value="okendo">Okendo</option><option value="stamped">Stamped.io</option><option value="judge_me">Judge.me</option><option value="custom">Custom</option>
            </select>
          </div>
          <div style={S.formGroup}><label style={S.label}>API Key</label><input style={S.input} value={svcForm.apiKey} onChange={e=>setSvcForm(f=>({...f,apiKey:e.target.value}))} type="password" /></div>
        </div>
        <button style={S.btn} onClick={connectService}>Connect</button>
      </div>
      <div style={S.grid3}>
        {services.length === 0 && <span style={S.muted}>No services connected.</span>}
        {services.map(s => (
          <div key={s.id||s._id} style={S.elevated}>
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{s.name}</div>
            <div style={{ ...S.muted, marginBottom: '12px' }}>{s.type}</div>
            <span style={S.badge(s.status === 'connected' ? '#22c55e' : '#71717a')}>{s.status || 'connected'}</span>
            <div style={{ marginTop: '12px' }}><button style={S.btnDanger} onClick={()=>disconnectService(s.id||s._id)}>Disconnect</button></div>
          </div>
        ))}
      </div>
    </div>
  );

  if (tab === 1) return (
    <div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      <div style={S.card}>
        <div style={S.h2}>Import Reviews</div>
        <div style={S.formGroup}><label style={S.label}>Import URL (JSON endpoint)</label><input style={S.input} value={importUrl} onChange={e=>setImportUrl(e.target.value)} placeholder="https://example.com/reviews.json" /></div>
        <button style={S.btn} onClick={handleImport} disabled={loading}>{loading ? 'Importing...' : 'Import from URL'}</button>
      </div>
      <div style={S.card}>
        <div style={S.h2}>Export Reviews</div>
        <div style={{ ...S.muted, marginBottom: '12px' }}>Export all reviews as a JSON file.</div>
        <button style={S.btn} onClick={handleExport} disabled={loading}>{loading ? 'Exporting...' : 'Export as JSON'}</button>
      </div>
    </div>
  );

  if (tab === 2) return (
    <div style={S.card}>
      <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={S.h2}>Shopify Sync</div>
        <div style={S.row}>
          <button style={S.btnGhost} onClick={loadShopify}>Refresh</button>
          <button style={S.btn} onClick={triggerShopifySync} disabled={loading}>{loading ? 'Syncing...' : 'Sync Now'}</button>
        </div>
      </div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      {shopifyStatus ? (
        <div>
          <div style={S.grid3}>
            <StatCard label="Status" value={shopifyStatus.status || 'idle'} color={shopifyStatus.status === 'running' ? '#22c55e' : '#71717a'} />
            <StatCard label="Last Sync" value={shopifyStatus.lastSync ? new Date(shopifyStatus.lastSync).toLocaleDateString() : 'Never'} color="#4f46e5" />
            <StatCard label="Reviews Synced" value={shopifyStatus.reviewsSynced} color="#a78bfa" />
          </div>
          {shopifyStatus.errors?.length > 0 && (
            <div style={{ ...S.elevated, marginTop: '16px' }}>
              <div style={{ ...S.label, color: '#ef4444', marginBottom: '8px' }}>Sync Errors</div>
              {shopifyStatus.errors.map((e, i) => <div key={i} style={{ color: '#ef4444', fontSize: '13px', marginBottom: '4px' }}>{e}</div>)}
            </div>
          )}
        </div>
      ) : <div style={S.muted}>Click Refresh to check sync status.</div>}
    </div>
  );

  if (tab === 3) return (
    <div style={S.card}>
      <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={S.h2}>Google Shopping Feed</div>
        <button style={S.btn} onClick={saveGoogleConfig}>Save Config</button>
      </div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      <div style={S.formGroup}><label style={S.label}>Merchant ID</label><input style={S.input} value={googleForm.merchantId} onChange={e=>setGoogleForm(f=>({...f,merchantId:e.target.value}))} placeholder="123456789" /></div>
      <div style={S.formGroup}><label style={S.label}>Feed URL</label><input style={S.input} value={googleForm.feedUrl} onChange={e=>setGoogleForm(f=>({...f,feedUrl:e.target.value}))} placeholder="https://yourdomain.com/reviews.xml" /></div>
      <label style={{ ...S.row, cursor: 'pointer', fontSize: '14px', marginBottom: '16px' }}>
        <input type="checkbox" checked={googleForm.enabled} onChange={e=>setGoogleForm(f=>({...f,enabled:e.target.checked}))} style={{ marginRight: '8px' }} /> Enable Google Shopping integration
      </label>
      <button style={S.btn} onClick={loadGoogle}>Load Current Config</button>
    </div>
  );

  if (tab === 4) return (
    <div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      <div style={S.card}>
        <div style={S.h2}>New Webhook</div>
        <div style={S.grid3}>
          <div style={S.formGroup}><label style={S.label}>Endpoint URL</label><input style={S.input} value={wbkForm.url} onChange={e=>setWbkForm(f=>({...f,url:e.target.value}))} placeholder="https://your-server.com/webhook" /></div>
          <div style={S.formGroup}><label style={S.label}>Events</label>
            <select style={S.select} value={wbkForm.events} onChange={e=>setWbkForm(f=>({...f,events:e.target.value}))}>
              <option value="review.created">review.created</option>
              <option value="review.approved">review.approved</option>
              <option value="review.rejected">review.rejected</option>
              <option value="review.all">All events</option>
            </select>
          </div>
          <div style={S.formGroup}><label style={S.label}>Secret</label><input style={S.input} value={wbkForm.secret} onChange={e=>setWbkForm(f=>({...f,secret:e.target.value}))} type="password" placeholder="signing secret" /></div>
        </div>
        <button style={S.btn} onClick={createWebhook}>Create Webhook</button>
      </div>
      <table style={S.table}>
        <thead><tr><th style={S.th}>URL</th><th style={S.th}>Events</th><th style={S.th}>Status</th><th style={S.th}>Actions</th></tr></thead>
        <tbody>
          {webhooks.length === 0 && <tr><td style={S.td} colSpan={4}><span style={S.muted}>No webhooks yet.</span></td></tr>}
          {webhooks.map(w => (
            <tr key={w.id||w._id}>
              <td style={{ ...S.td, maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.url}</td>
              <td style={S.td}>{w.events}</td>
              <td style={S.td}><span style={S.badge(w.active ? '#22c55e' : '#71717a')}>{w.active ? 'active' : 'inactive'}</span></td>
              <td style={S.td}><button style={S.btnDanger} onClick={()=>deleteWebhook(w.id||w._id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (tab === 5) return (
    <div>
      {msg && <div style={{ ...S.badge('#22c55e'), marginBottom: '12px', padding: '8px 16px' }}>{msg}</div>}
      <div style={S.card}>
        <div style={S.h2}>CSV Import</div>
        <div style={S.formGroup}><label style={S.label}>CSV File (columns: productId, authorName, authorEmail, rating, title, body)</label>
          <input type="file" accept=".csv" onChange={e=>setCsvFile(e.target.files[0])} style={{ ...S.input, padding: '6px' }} />
        </div>
        <button style={S.btn} onClick={handleCsvImport} disabled={!csvFile || loading}>{loading ? 'Importing...' : 'Import CSV'}</button>
      </div>
      <div style={S.card}>
        <div style={S.h2}>CSV Export</div>
        <div style={{ ...S.muted, marginBottom: '12px' }}>Download all reviews as a CSV file.</div>
        <button style={S.btn} onClick={handleCsvExport} disabled={loading}>{loading ? 'Exporting...' : 'Export CSV'}</button>
      </div>
    </div>
  );

  if (tab === 6) return (
    <div style={S.card}>
      <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={S.h2}>Sync Logs</div>
        <button style={S.btn} onClick={loadSyncLogs}>Refresh</button>
      </div>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Time</th><th style={S.th}>Source</th><th style={S.th}>Records</th><th style={S.th}>Status</th><th style={S.th}>Message</th></tr></thead>
        <tbody>
          {syncLogs.length === 0 && <tr><td style={S.td} colSpan={5}><span style={S.muted}>No sync logs.</span></td></tr>}
          {syncLogs.map((log, i) => (
            <tr key={log.id||i}>
              <td style={S.td}>{log.createdAt ? new Date(log.createdAt).toLocaleString() : '�'}</td>
              <td style={S.td}>{log.source || '�'}</td>
              <td style={S.td}>{log.records ?? '�'}</td>
              <td style={S.td}><span style={S.badge(log.status === 'success' ? '#22c55e' : '#ef4444')}>{log.status}</span></td>
              <td style={{ ...S.td, color: '#a1a1aa', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.message || '�'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (tab === 7) return (
    <div style={S.card}>
      <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={S.h2}>Integration Statistics</div>
        <button style={S.btn} onClick={loadStats}>Refresh</button>
      </div>
      {stats ? (
        <div style={S.grid4}>
          <StatCard label="Connected Services" value={stats.connectedServices} color="#4f46e5" />
          <StatCard label="Webhooks" value={stats.webhooks} color="#a78bfa" />
          <StatCard label="Reviews Synced" value={stats.reviewsSynced} color="#22c55e" />
          <StatCard label="Sync Errors" value={stats.syncErrors} color="#ef4444" />
        </div>
      ) : <div style={S.muted}>Click Refresh to load stats.</div>}
    </div>
  );

  return null;
}

// ----------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------
export default function ReviewUGCEngine() {
  const [activeCategory, setActiveCategory] = useState('reviews');
  const [activeTab, setActiveTab] = useState(0);

  const handleCategory = (id) => { setActiveCategory(id); setActiveTab(0); };
  const activeCat = CATEGORIES.find(c => c.id === activeCategory);
  const tabs = activeCat?.tabs || [];

  return (
    <div style={S.page}>
      <div style={{ marginBottom: '20px' }}>
        <div style={S.title}>Reviews & UGC Engine</div>
        <div style={S.subtitle}>Reviews, UGC campaigns, moderation, sentiment AI, social proof, display widgets, analytics, and integrations.</div>
      </div>

      {/* Category bar */}
      <div style={{ display: 'flex', gap: '2px', overflowX: 'auto', borderBottom: '2px solid #27272a', marginBottom: '0' }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => handleCategory(c.id)} style={{
            background: 'transparent', border: 'none',
            borderBottom: activeCategory === c.id ? '2px solid #4f46e5' : '2px solid transparent',
            marginBottom: '-2px',
            color: activeCategory === c.id ? '#4f46e5' : '#a1a1aa',
            padding: '10px 16px', cursor: 'pointer', fontSize: '14px',
            fontWeight: activeCategory === c.id ? 600 : 400, whiteSpace: 'nowrap',
          }}>{c.label}</button>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '2px', overflowX: 'auto', background: '#18181b', padding: '4px 12px 0', borderBottom: '1px solid #27272a', marginBottom: '20px' }}>
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)} style={{
            background: 'transparent', border: 'none',
            borderBottom: activeTab === i ? '2px solid #4f46e5' : '2px solid transparent',
            color: activeTab === i ? '#fafafa' : '#71717a',
            padding: '8px 14px', cursor: 'pointer', fontSize: '13px',
            fontWeight: activeTab === i ? 600 : 400, whiteSpace: 'nowrap',
          }}>{t}</button>
        ))}
      </div>

      {/* Content */}
      {activeCategory === 'reviews' && <ReviewManagement tab={activeTab} />}
      {activeCategory === 'ugc-collection' && <UGCCollection tab={activeTab} />}
      {activeCategory === 'moderation' && <ModerationCenter tab={activeTab} />}
      {activeCategory === 'sentiment' && <SentimentAI tab={activeTab} />}
      {activeCategory === 'social-proof' && <SocialProof tab={activeTab} />}
      {activeCategory === 'widgets' && <DisplayWidgets tab={activeTab} />}
      {activeCategory === 'analytics' && <AnalyticsInsights tab={activeTab} />}
      {activeCategory === 'integrations' && <IntegrationsHub tab={activeTab} />}
    </div>
  );
}
