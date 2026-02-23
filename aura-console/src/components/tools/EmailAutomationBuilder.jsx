import React, { useState, useEffect, useCallback } from 'react';

const API = '/api/email-automation-builder';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

const S = {
  page:     { background: '#09090b', minHeight: '100vh', padding: '24px', color: '#fafafa' },
  card:     { background: '#18181b', border: '1px solid #3f3f46', borderRadius: '10px', padding: '20px', marginBottom: '16px' },
  elevated: { background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', padding: '12px' },
  input:    { background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', padding: '8px 12px', color: '#fafafa', width: '100%', outline: 'none', fontSize: '14px', boxSizing: 'border-box' },
  textarea: { background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', padding: '8px 12px', color: '#fafafa', width: '100%', outline: 'none', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' },
  select:   { background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', padding: '8px 12px', color: '#fafafa', width: '100%', outline: 'none', fontSize: '14px', boxSizing: 'border-box' },
  btn:      { background: '#3f3f46', color: '#fafafa', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 },
  btnSm:    { background: '#3f3f46', color: '#fafafa', border: 'none', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 },
  btnPrimary: { background: '#22c55e', color: '#09090b', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 },
  btnGhost: { background: 'transparent', color: '#a1a1aa', border: '1px solid #3f3f46', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '13px' },
  btnDanger:{ background: '#ef4444', color: '#fafafa', border: 'none', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 },
  btnGreen: { background: '#22c55e', color: '#09090b', border: 'none', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 },
  btnAmber: { background: '#f59e0b', color: '#09090b', border: 'none', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 },
  label:    { display: 'block', color: '#a1a1aa', fontSize: '13px', marginBottom: '6px', fontWeight: 500 },
  title:    { fontSize: '20px', fontWeight: 700, color: '#fafafa', margin: 0 },
  subtitle: { fontSize: '14px', color: '#a1a1aa', margin: '4px 0 0' },
  h2:       { fontSize: '16px', fontWeight: 600, color: '#fafafa', marginBottom: '14px' },
  muted:    { color: '#71717a', fontSize: '13px' },
  badge: (c) => ({ background: c+'22', color: c, border: `1px solid ${c}44`, borderRadius: '4px', padding: '2px 8px', fontSize: '12px', fontWeight: 600, display: 'inline-block' }),
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' },
  grid4: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' },
  row:  { display: 'flex', gap: '8px', alignItems: 'center' },
  stat: { background: '#18181b', border: '1px solid #3f3f46', borderRadius: '10px', padding: '16px', textAlign: 'center' },
  statNum:   { fontSize: '28px', fontWeight: 700, color: '#fafafa' },
  statLabel: { fontSize: '13px', color: '#a1a1aa', marginTop: '4px' },
  table:{ width: '100%', borderCollapse: 'collapse' },
  th:   { textAlign: 'left', color: '#71717a', fontSize: '12px', fontWeight: 600, padding: '8px 12px', borderBottom: '1px solid #3f3f46', textTransform: 'uppercase', letterSpacing: '0.04em' },
  td:   { padding: '10px 12px', borderBottom: '1px solid #27272a', fontSize: '14px', color: '#fafafa' },
  fg:   { marginBottom: '14px' },
};

const CATS = [
  { id: 'campaigns',    label: 'Campaigns',             tabs: ['overview','create','templates','sequences','segments','personalization','transactional','timeline','forms','profiles','landing-pages','lifecycle','dynamic-content','stock-alerts','coupon-engine','surveys','amp-emails','rss-to-email','smart-translations','campaign-calendar','countdown-timers','referral-program'] },
  { id: 'ai',          label: 'AI Orchestration',       tabs: ['smart-send','content-gen','subject-opt','predictive','auto-optimize','recommendations','flow-gen','send-time','product-recs','ai-segments','ai-campaign','ai-images'] },
  { id: 'workflows',   label: 'Workflows',              tabs: ['builder','triggers','conditions','actions','monitoring','history','flow-templates','visual-builder','splits','flow-metrics','reviews','cart-recovery','content-approvals'] },
  { id: 'multichannel',label: 'Multi-Channel',          tabs: ['sms','push','webhooks','orchestration','preferences','retargeting','whatsapp'] },
  { id: 'analytics',   label: 'Analytics',              tabs: ['dashboard','reports','revenue','engagement','deliverability','export','benchmarks','smart-alerts','lead-scoring','product-catalog','rfm-analysis','email-heatmaps','funnel-analysis','cohort-analysis','conversion-goals'] },
  { id: 'testing',     label: 'Testing',                tabs: ['abtests','multivariate','experiments','frequency','content-testing','results','inbox-preview','accessibility','spam-testing'] },
  { id: 'settings',    label: 'Settings',               tabs: ['general','team','compliance','integrations','list-hygiene','frequency-capping','design-system'] },
  { id: 'advanced',    label: 'Advanced',               tabs: ['api','custom-fields','automation-rules'] },
];

/* Sub-groups within each category for organized navigation */
const TAB_GROUPS = {
  campaigns: [
    { label: 'Core', tabs: ['overview','create','templates','sequences','campaign-calendar'] },
    { label: 'Audience', tabs: ['segments','personalization','profiles','lifecycle','dynamic-content'] },
    { label: 'Acquisition', tabs: ['forms','landing-pages','referral-program','surveys'] },
    { label: 'Commerce', tabs: ['transactional','stock-alerts','coupon-engine','countdown-timers'] },
    { label: 'Content', tabs: ['amp-emails','rss-to-email','smart-translations','timeline'] },
  ],
  ai: [
    { label: 'Optimization', tabs: ['smart-send','send-time','auto-optimize','predictive'] },
    { label: 'Generation', tabs: ['content-gen','subject-opt','ai-images','ai-campaign'] },
    { label: 'Intelligence', tabs: ['recommendations','product-recs','ai-segments','flow-gen'] },
  ],
  workflows: [
    { label: 'Build', tabs: ['builder','visual-builder','flow-templates','splits'] },
    { label: 'Configure', tabs: ['triggers','conditions','actions','content-approvals'] },
    { label: 'Monitor', tabs: ['monitoring','history','flow-metrics','reviews','cart-recovery'] },
  ],
  multichannel: [
    { label: 'Channels', tabs: ['sms','push','whatsapp','webhooks'] },
    { label: 'Strategy', tabs: ['orchestration','preferences','retargeting'] },
  ],
  analytics: [
    { label: 'Overview', tabs: ['dashboard','reports','export'] },
    { label: 'Performance', tabs: ['revenue','engagement','deliverability','benchmarks'] },
    { label: 'Deep Dive', tabs: ['funnel-analysis','cohort-analysis','rfm-analysis','email-heatmaps'] },
    { label: 'Tools', tabs: ['smart-alerts','lead-scoring','product-catalog','conversion-goals'] },
  ],
  testing: [
    { label: 'Experiments', tabs: ['abtests','multivariate','experiments','content-testing'] },
    { label: 'Quality', tabs: ['inbox-preview','spam-testing','accessibility'] },
    { label: 'Results', tabs: ['results','frequency'] },
  ],
  settings: [
    { label: 'Account', tabs: ['general','team','compliance'] },
    { label: 'Tools', tabs: ['integrations','list-hygiene','frequency-capping','design-system'] },
  ],
  advanced: [
    { label: 'Developer', tabs: ['api','custom-fields','automation-rules'] },
  ],
};

const TAB_LABELS = {
  overview:'Campaign Overview', create:'Create Campaign', templates:'Email Templates',
  sequences:'Email Sequences', segments:'Audience Segments', personalization:'Personalization',
  'smart-send':'Smart Send Time', 'content-gen':'Content Generation', 'subject-opt':'Subject Line Optimizer',
  predictive:'Predictive Analytics', 'auto-optimize':'Auto-Optimization', recommendations:'AI Recommendations',
  builder:'Workflow Builder', triggers:'Triggers & Events', conditions:'Conditional Logic',
  actions:'Actions Library', monitoring:'Workflow Monitoring', history:'Execution History',
  sms:'SMS Campaigns', push:'Push Notifications', webhooks:'Webhooks',
  orchestration:'Channel Orchestration', preferences:'Channel Preferences',
  dashboard:'Analytics Dashboard', reports:'Campaign Reports', revenue:'Revenue Attribution',
  engagement:'Engagement Metrics', deliverability:'Deliverability', export:'Data Export',
  abtests:'A/B Testing', multivariate:'Multivariate Testing', experiments:'Experiments',
  frequency:'Frequency Optimization', 'content-testing':'Content Testing', results:'Test Results',
  general:'General Settings', team:'Team & Permissions', compliance:'Compliance & GDPR', integrations:'Integrations',
  api:'API & Developer', 'custom-fields':'Custom Fields', 'automation-rules':'Custom Automation',
  // ── new competitor-parity tabs ──
  transactional:'Transactional Emails', timeline:'Contact Timeline', forms:'Forms & Popups',
  'flow-gen':'AI Flow Generator', 'send-time':'Send Time Optimizer',
  'flow-templates':'Flow Templates', 'visual-builder':'Visual Builder', splits:'Conditional Splits', 'flow-metrics':'Flow Metrics',
  retargeting:'Retargeting Ads',
  // ── round 2: competitor-parity tabs ──
  'product-recs':'Product Recommendations', profiles:'Customer Profiles', 'landing-pages':'Landing Pages',
  benchmarks:'Industry Benchmarks', whatsapp:'WhatsApp',
  // ── round 3: final competitor-parity tabs ──
  lifecycle:'Lifecycle Stages', 'dynamic-content':'Dynamic Content',
  'ai-segments':'AI Segments Builder', 'ai-campaign':'AI Campaign Builder',
  reviews:'Review Collection', 'smart-alerts':'Smart Alerts',
  // ── round 4: ecommerce-critical competitor-parity tabs ──
  'cart-recovery':'Cart & Browse Recovery', 'stock-alerts':'Stock & Price Alerts',
  'lead-scoring':'Lead Scoring', 'list-hygiene':'List Hygiene & Sunset',
  'product-catalog':'Product Catalog',
  // ── round 5: final competitive-parity tabs ──
  'rfm-analysis':'RFM Analysis', 'email-heatmaps':'Email Click Heatmaps',
  'coupon-engine':'Coupon & Discount Engine', 'ai-images':'AI Image Generator',
  // ── round 6: competitive-parity tabs ──
  surveys:'Surveys & Polls', 'funnel-analysis':'Funnel Analysis',
  'cohort-analysis':'Cohort Analysis', 'inbox-preview':'Inbox Preview Testing',
  // ── round 7: final competitive-parity tabs ──
  'amp-emails':'AMP & Interactive Emails', 'rss-to-email':'RSS-to-Email',
  'conversion-goals':'Conversion Goals', accessibility:'Email Accessibility',
  // ── round 8: final competitive-parity tabs ──
  'smart-translations':'Smart Translations', 'campaign-calendar':'Campaign Calendar',
  'countdown-timers':'Countdown Timers', 'frequency-capping':'Frequency Capping',
  // ── round 9: final competitive-parity tabs ──
  'referral-program':'Referral Program', 'content-approvals':'Content Approvals',
  'spam-testing':'Spam & Pre-Send Testing', 'design-system':'Design System',
};

function StatCard({ label, value, sub, color = '#fafafa' }) {
  return (
    <div style={S.stat}>
      <div style={{ ...S.statNum, color }}>{value}</div>
      <div style={S.statLabel}>{label}</div>
      {sub && <div style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

function Msg({ text, type = 'error' }) {
  if (!text) return null;
  const bg = type === 'error' ? '#ef444422' : '#22c55e22';
  const col = type === 'error' ? '#ef4444' : '#22c55e';
  return <div style={{ background: bg, color: col, border: `1px solid ${col}44`, borderRadius: '6px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px' }}>{text}</div>;
}

const aiBtn = {
  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fafafa', border: 'none',
  borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
  display: 'inline-flex', alignItems: 'center', gap: '6px',
};
const aiBtnLoading = { ...aiBtn, background: '#3f3f46', cursor: 'wait' };
const aiBtnDisabled = { ...aiBtn, opacity: 0.5, cursor: 'not-allowed' };
const aiCreditBadge = { background: '#ffffff22', borderRadius: '4px', padding: '1px 6px', fontSize: '11px', marginLeft: '2px' };

function AIGenButton({ onClick, loading, label = 'AI Generate', credits = 2, disabled, style: sx }) {
  return (
    <button
      style={{ ...(loading ? aiBtnLoading : disabled ? aiBtnDisabled : aiBtn), ...sx }}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? '\u23F3' : '\u2728'} {loading ? 'Generating...' : label}
      <span style={aiCreditBadge}>{credits} cr</span>
    </button>
  );
}

function AIResultCard({ result, onClose, title = 'AI Result' }) {
  if (!result) return null;
  return (
    <div style={{ ...S.card, marginTop: '12px', border: '1px solid #8b5cf644' }}>
      <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ color: '#8b5cf6', fontWeight: 600, fontSize: '14px' }}>\u2728 {title}</div>
        {onClose && <button style={{ ...S.btnGhost, padding: '2px 8px', fontSize: '12px' }} onClick={onClose}>\u2715</button>}
      </div>
      <pre style={{ color: '#e4e4e7', fontSize: '13px', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.5 }}>{typeof result === 'string' ? result : JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}

// ─── CAMPAIGNS ───────────────────────────────────────────────────────────────
function CampaignsMgmt({ tab }) {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name: '', subject: '', fromEmail: '', fromName: '', segmentId: '', templateId: '' });
  const [segments, setSegments] = useState([]);
  const [personalPrompt, setPersonalPrompt] = useState('');
  const [personalResult, setPersonalResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiField, setAiField] = useState('');

  async function aiGenerate(type, prompt, field) {
    setAiLoading(true); setAiResult(null); setAiField(field || type);
    try {
      let d;
      if (type === 'subject') {
        d = await apiFetch('/ai/subject-lines/generate', { method: 'POST', body: JSON.stringify({ topic: prompt || form.name || 'promotional email', count: 3 }) });
        setAiResult(d.subjectLines || d.variants || d.suggestions || JSON.stringify(d));
      } else {
        d = await apiFetch('/ai/content/generate', { method: 'POST', body: JSON.stringify({ type, prompt: prompt || 'Generate professional email marketing content', tone: 'professional' }) });
        setAiResult(d.content || d.html || d.text || JSON.stringify(d));
      }
    } catch (e) { setAiResult('Error: ' + e.message); }
    setAiLoading(false);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'overview') {
        const d = await apiFetch('/campaigns'); setCampaigns(d.campaigns || d || []);
      } else if (tab === 'templates') {
        const d = await apiFetch('/templates'); setTemplates(d.templates || d || []);
      } else if (tab === 'segments') {
        const d = await apiFetch('/segments'); setSegments(d.segments || d || []);
      }
    } catch(e) { setMsg(e.message); }
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function createCampaign(e) {
    e.preventDefault(); setMsg('');
    try {
      await apiFetch('/campaigns', { method:'POST', body: JSON.stringify(form) });
      setMsg('Campaign created!'); setForm({ name:'', subject:'', fromEmail:'', fromName:'', segmentId:'', templateId:'' });
      load();
    } catch(e) { setMsg(e.message); }
  }

  async function deleteCampaign(id) {
    if (!window.confirm('Delete campaign?')) return;
    try { await apiFetch(`/campaigns/${id}`, { method:'DELETE' }); load(); }
    catch(e) { setMsg(e.message); }
  }

  async function sendCampaign(id) {
    try { await apiFetch(`/campaigns/${id}/send`, { method:'POST' }); setMsg('Send initiated.'); }
    catch(e) { setMsg(e.message); }
  }

  async function cloneCampaign(id) {
    try { await apiFetch(`/campaigns/${id}/clone`, { method:'POST' }); load(); setMsg('Cloned.'); }
    catch(e) { setMsg(e.message); }
  }

  async function personalize() {
    setPersonalResult('');
    try {
      const d = await apiFetch('/ai/content/personalize', { method:'POST', body: JSON.stringify({ content: personalPrompt }) });
      setPersonalResult(d.personalized || d.content || JSON.stringify(d));
    } catch(e) { setPersonalResult('Error: ' + e.message); }
  }

  if (tab === 'overview') return (
    <div>
      <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'16px' }}>
        <div style={S.title}>Campaigns</div>
      </div>
      <Msg text={msg} type={msg.includes('rror') ? 'error' : 'ok'} />
      {loading ? <div style={S.muted}>Loading...</div> : (
        <table style={S.table}>
          <thead><tr>{['Name','Status','Subject','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {(campaigns.length ? campaigns : []).map(c => (
              <tr key={c.id || c._id}>
                <td style={S.td}>{c.name}</td>
                <td style={S.td}><span style={S.badge(c.status==='active'?'#22c55e':c.status==='sent'?'#a1a1aa':'#f59e0b')}>{c.status||'draft'}</span></td>
                <td style={S.td}>{c.subject || '—'}</td>
                <td style={S.td}>
                  <div style={S.row}>
                    <button style={S.btnGreen} onClick={() => sendCampaign(c.id||c._id)}>Send</button>
                    <button style={S.btnSm} onClick={() => cloneCampaign(c.id||c._id)}>Clone</button>
                    <button style={S.btnDanger} onClick={() => deleteCampaign(c.id||c._id)}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
            {!campaigns.length && <tr><td style={{ ...S.td, color:'#71717a' }} colSpan={4}>No campaigns yet.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );

  if (tab === 'create') return (
    <div>
      <div style={S.title}>Create Campaign</div>
      <Msg text={msg} type={msg.includes('rror') ? 'error' : 'ok'} />
      <form onSubmit={createCampaign} style={{ maxWidth:'560px', marginTop:'16px' }}>
        <div style={S.fg}>
          <label style={S.label}>Campaign Name</label>
          <div style={S.row}>
            <input style={{ ...S.input, flex: 1 }} value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} required />
            <AIGenButton label="AI Name" credits={2} loading={aiLoading && aiField==='name'} onClick={() => aiGenerate('campaign-name', `Suggest 3 creative campaign names for: ${form.subject || 'email marketing campaign'}`, 'name')} />
          </div>
        </div>
        <div style={S.fg}>
          <label style={S.label}>Subject Line</label>
          <div style={S.row}>
            <input style={{ ...S.input, flex: 1 }} value={form.subject} onChange={e => setForm(p=>({...p,subject:e.target.value}))} required />
            <AIGenButton label="AI Subject" credits={2} loading={aiLoading && aiField==='subject'} onClick={() => aiGenerate('subject', form.name || 'promotional email', 'subject')} />
          </div>
        </div>
        {[['fromEmail','From Email'],['fromName','From Name']].map(([k,l]) => (
          <div key={k} style={S.fg}>
            <label style={S.label}>{l}</label>
            <input style={S.input} value={form[k]} onChange={e => setForm(p=>({...p,[k]:e.target.value}))} required />
          </div>
        ))}
        <div style={S.row}>
          <button type="submit" style={S.btnPrimary}>Create Campaign</button>
          <AIGenButton label="AI Full Campaign" credits={3} loading={aiLoading && aiField==='full-campaign'} onClick={() => aiGenerate('campaign', `Create a complete email campaign about: ${form.name || form.subject || 'product promotion'}`, 'full-campaign')} />
        </div>
      </form>
      {aiResult && aiField && ['name','subject','full-campaign'].includes(aiField) && (
        <AIResultCard result={aiResult} title={aiField === 'subject' ? 'AI Subject Lines' : aiField === 'name' ? 'AI Campaign Names' : 'AI Campaign Draft'} onClose={() => setAiResult(null)} />
      )}
    </div>
  );

  if (tab === 'templates') return (
    <div>
      <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'16px' }}>
        <div style={S.title}>Email Templates</div>
        <AIGenButton label="AI Generate Template" credits={2} loading={aiLoading && aiField==='template'} onClick={() => aiGenerate('template', 'Generate a professional email template for e-commerce promotions', 'template')} />
      </div>
      <Msg text={msg} type="error" />
      {loading ? <div style={S.muted}>Loading...</div> : (
        <div style={{ ...S.grid3, marginTop:'16px' }}>
          {(templates.length ? templates : []).map(t => (
            <div key={t.id||t._id} style={S.card}>
              <div style={{ fontWeight:600, color:'#fafafa', marginBottom:'6px' }}>{t.name}</div>
              <div style={S.muted}>{t.category || t.type || 'Template'}</div>
            </div>
          ))}
          {!templates.length && <div style={S.muted}>No templates found.</div>}
        </div>
      )}
      {aiResult && aiField==='template' && <AIResultCard result={aiResult} title="AI Generated Template" onClose={() => setAiResult(null)} />}
    </div>
  );

  if (tab === 'sequences') return (
    <div>
      <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'16px' }}>
        <div style={S.title}>Email Sequences</div>
        <AIGenButton label="AI Generate Sequence" credits={3} loading={aiLoading && aiField==='sequence'} onClick={() => aiGenerate('sequence', 'Create a 5-email welcome sequence for a new e-commerce subscriber with optimal timing', 'sequence')} />
      </div>
      <p style={S.muted}>Multi-email sequences with automated timing.</p>
      <div style={{ ...S.card, marginTop:'16px' }}>
        <div style={S.h2}>Active Sequences</div>
        {[
          { name:'Welcome Series', emails:5, delay:'1d', status:'active' },
          { name:'Abandoned Cart', emails:3, delay:'2h', status:'active' },
          { name:'Win-Back', emails:4, delay:'7d', status:'paused' },
        ].map(s => (
          <div key={s.name} style={{ ...S.elevated, marginBottom:'8px', ...S.row, justifyContent:'space-between' }}>
            <div>
              <div style={{ fontWeight:600, color:'#fafafa' }}>{s.name}</div>
              <div style={S.muted}>{s.emails} emails · {s.delay} delay</div>
            </div>
            <span style={S.badge(s.status==='active'?'#22c55e':'#f59e0b')}>{s.status}</span>
          </div>
        ))}
      </div>
      {aiResult && aiField==='sequence' && <AIResultCard result={aiResult} title="AI Generated Sequence" onClose={() => setAiResult(null)} />}
    </div>
  );

  if (tab === 'segments') return (
    <div>
      <div style={S.title}>Audience Segments</div>
      <Msg text={msg} type="error" />
      {loading ? <div style={S.muted}>Loading...</div> : (
        <table style={{ ...S.table, marginTop:'16px' }}>
          <thead><tr>{['Name','Type','Contacts','Actions'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {(segments.length ? segments : []).map(s => (
              <tr key={s.id||s._id}>
                <td style={S.td}>{s.name}</td>
                <td style={S.td}>{s.type||'dynamic'}</td>
                <td style={S.td}>{(s.contactCount||s.count||0).toLocaleString()}</td>
                <td style={S.td}><button style={S.btnSm}>View</button></td>
              </tr>
            ))}
            {!segments.length && <tr><td style={{ ...S.td, color:'#71717a' }} colSpan={4}>No segments.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );

  if (tab === 'personalization') return (
    <div>
      <div style={S.title}>Personalization Engine</div>
      <p style={S.muted}>AI-powered dynamic content personalization.</p>
      <div style={{ ...S.fg, marginTop:'16px' }}>
        <label style={S.label}>Content to Personalize</label>
        <textarea style={{ ...S.textarea, minHeight:'100px' }} value={personalPrompt} onChange={e=>setPersonalPrompt(e.target.value)} placeholder="Enter email content..." />
      </div>
      <button style={S.btnPrimary} onClick={personalize}>Personalize with AI</button>
      {personalResult && (
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Personalized Result</div>
          <pre style={{ color:'#a1a1aa', fontSize:'13px', whiteSpace:'pre-wrap' }}>{personalResult}</pre>
        </div>
      )}
    </div>
  );

  // ── Transactional Emails ──
  if (tab === 'transactional') {
    const TRANSACTIONAL = [
      { name:'Order Confirmation', status:'active', volume:'2,340/day', icon:'✅' },
      { name:'Shipping Notification', status:'active', volume:'1,890/day', icon:'📦' },
      { name:'Password Reset', status:'active', volume:'120/day', icon:'🔑' },
      { name:'Account Welcome', status:'active', volume:'340/day', icon:'👋' },
      { name:'Payment Failed', status:'active', volume:'45/day', icon:'❌' },
      { name:'Refund Confirmation', status:'active', volume:'80/day', icon:'💸' },
      { name:'Subscription Renewal', status:'draft', volume:'—', icon:'🔄' },
      { name:'Inventory Back in Stock', status:'draft', volume:'—', icon:'🔔' },
    ];
    return (
      <div>
        <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'16px' }}>
          <div><div style={S.title}>Transactional Emails</div><p style={S.muted}>System-triggered emails with guaranteed delivery — separate from marketing sends.</p></div>
          <div style={S.row}>
            <AIGenButton label="AI Write Template" credits={2} loading={aiLoading && aiField==='transactional'} onClick={() => aiGenerate('transactional', 'Write a professional transactional email template for an e-commerce order confirmation with dynamic placeholders', 'transactional')} />
            <button style={S.btnPrimary}>+ New Template</button>
          </div>
        </div>
        <div style={{ ...S.grid4, marginTop:'8px', marginBottom:'16px' }}>
          <StatCard label="Active Templates" value={TRANSACTIONAL.filter(t=>t.status==='active').length} color="#22c55e" />
          <StatCard label="Sent Today" value="4,815" />
          <StatCard label="Delivery Rate" value="99.7%" color="#22c55e" />
          <StatCard label="Avg Latency" value="1.2s" color="#3b82f6" />
        </div>
        <table style={S.table}>
          <thead><tr>{['','Template','Status','Volume','Actions'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {TRANSACTIONAL.map(t=>(
              <tr key={t.name}>
                <td style={S.td}>{t.icon}</td>
                <td style={S.td}>{t.name}</td>
                <td style={S.td}><span style={S.badge(t.status==='active'?'#22c55e':'#f59e0b')}>{t.status}</span></td>
                <td style={S.td}>{t.volume}</td>
                <td style={S.td}><div style={S.row}><button style={S.btnSm}>Edit</button><button style={S.btnGhost}>Preview</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {aiResult && aiField==='transactional' && <AIResultCard result={aiResult} title="AI Transactional Template" onClose={() => setAiResult(null)} />}
      </div>
    );
  }

  // ── Contact Activity Timeline ──
  if (tab === 'timeline') {
    const [search, setSearch] = useState('');
    const EVENTS = [
      { time:'2 min ago', icon:'📧', type:'Email Opened', detail:'Summer Sale Campaign — Subject: "☀️ 30% Off Everything"', contact:'alice@example.com' },
      { time:'15 min ago', icon:'🖱️', type:'Link Clicked', detail:'Clicked "Shop Now" button in abandoned cart email', contact:'bob@example.com' },
      { time:'32 min ago', icon:'🛒', type:'Cart Abandoned', detail:'$142.00 — 3 items (Blue Jacket, Sneakers, Hat)', contact:'carol@example.com' },
      { time:'1 hr ago', icon:'💰', type:'Purchase', detail:'Order #1042 — $89.99 — via Welcome Series flow', contact:'alice@example.com' },
      { time:'2 hrs ago', icon:'👋', type:'Subscribed', detail:'Joined via homepage popup — Segment: New Subscribers', contact:'dave@example.com' },
      { time:'3 hrs ago', icon:'📱', type:'SMS Delivered', detail:'Cart reminder SMS sent successfully', contact:'bob@example.com' },
      { time:'4 hrs ago', icon:'⭐', type:'Review Submitted', detail:'5-star review for "Wireless Headphones"', contact:'alice@example.com' },
      { time:'5 hrs ago', icon:'🚫', type:'Unsubscribed', detail:'Opted out of marketing emails', contact:'eve@example.com' },
    ];
    const filtered = search ? EVENTS.filter(e=>e.contact.includes(search)||e.type.toLowerCase().includes(search.toLowerCase())) : EVENTS;
    return (
      <div>
        <div style={S.title}>Contact Activity Timeline</div>
        <p style={S.muted}>Unified activity feed across all channels — track every touchpoint per contact.</p>
        <div style={{ ...S.fg, marginTop:'16px' }}>
          <input style={S.input} value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search by email or event type..." />
        </div>
        <div style={{ marginTop:'8px' }}>
          {filtered.map((ev, i)=>(
            <div key={i} style={{ display:'flex', gap:'12px', padding:'12px 0', borderBottom:'1px solid #27272a' }}>
              <div style={{ fontSize:'20px', marginTop:'2px' }}>{ev.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ ...S.row, justifyContent:'space-between' }}>
                  <div style={{ fontWeight:600, color:'#fafafa', fontSize:'14px' }}>{ev.type}</div>
                  <div style={{ fontSize:'12px', color:'#71717a' }}>{ev.time}</div>
                </div>
                <div style={{ fontSize:'13px', color:'#a1a1aa', margin:'4px 0' }}>{ev.detail}</div>
                <div style={{ fontSize:'12px', color:'#3b82f6' }}>{ev.contact}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Forms & Popups Builder ──
  if (tab === 'forms') {
    const FORMS = [
      { name:'Newsletter Popup', type:'popup', status:'active', conversions:1240, rate:'3.2%', icon:'📋' },
      { name:'Exit Intent Offer', type:'popup', status:'active', conversions:890, rate:'5.1%', icon:'🚪' },
      { name:'Spin-to-Win Wheel', type:'gamified', status:'active', conversions:2100, rate:'8.4%', icon:'🎡' },
      { name:'Footer Signup', type:'embedded', status:'active', conversions:560, rate:'1.8%', icon:'📝' },
      { name:'Product Quiz', type:'quiz', status:'draft', conversions:0, rate:'—', icon:'❓' },
      { name:'VIP Early Access', type:'flyout', status:'paused', conversions:320, rate:'4.6%', icon:'⭐' },
    ];
    return (
      <div>
        <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'16px' }}>
          <div><div style={S.title}>Forms & Popups</div><p style={S.muted}>Build opt-in forms, popups, and interactive widgets to grow your list.</p></div>
          <div style={S.row}>
            <AIGenButton label="AI Generate Form" credits={2} loading={aiLoading && aiField==='form'} onClick={() => aiGenerate('form', 'Generate compelling copy for a newsletter signup popup with headline, subtext, and CTA button text for an e-commerce store', 'form')} />
            <button style={S.btnPrimary}>+ New Form</button>
          </div>
        </div>
        <div style={{ ...S.grid4, marginTop:'8px', marginBottom:'16px' }}>
          <StatCard label="Active Forms" value={FORMS.filter(f=>f.status==='active').length} color="#22c55e" />
          <StatCard label="Total Signups" value={FORMS.reduce((s,f)=>s+f.conversions,0).toLocaleString()} color="#3b82f6" />
          <StatCard label="Avg Conv. Rate" value="4.6%" color="#8b5cf6" />
          <StatCard label="Revenue Attr." value="$8,200" color="#f59e0b" />
        </div>
        <div style={S.grid3}>
          {FORMS.map(f=>(
            <div key={f.name} style={S.card}>
              <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'8px' }}>
                <span style={{ fontSize:'20px' }}>{f.icon}</span>
                <span style={S.badge(f.status==='active'?'#22c55e':f.status==='paused'?'#f59e0b':'#71717a')}>{f.status}</span>
              </div>
              <div style={{ fontWeight:600, color:'#fafafa', marginBottom:'4px' }}>{f.name}</div>
              <span style={{ ...S.badge('#a1a1aa'), marginBottom:'8px' }}>{f.type}</span>
              <div style={{ ...S.grid2, marginTop:'8px' }}>
                <div><div style={{ fontSize:'16px', fontWeight:700, color:'#fafafa' }}>{f.conversions.toLocaleString()}</div><div style={S.muted}>Signups</div></div>
                <div><div style={{ fontSize:'16px', fontWeight:700, color:'#22c55e' }}>{f.rate}</div><div style={S.muted}>Conv. Rate</div></div>
              </div>
              <div style={{ ...S.row, marginTop:'10px' }}>
                <button style={S.btnSm}>Edit</button>
                <button style={S.btnGhost}>Preview</button>
                <button style={S.btnGhost}>Stats</button>
              </div>
            </div>
          ))}
        </div>
        {aiResult && aiField==='form' && <AIResultCard result={aiResult} title="AI Generated Form Copy" onClose={() => setAiResult(null)} />}
      </div>
    );
  }

  // ── 360° Customer Profiles ──
  if (tab === 'profiles') {
    const PROFILE = {
      name:'Alice Johnson', email:'alice@example.com', phone:'+1 555-0142',
      avatar:'👩', ltv:'$2,340', orders:18, avgOrder:'$130', churnRisk:'Low',
      predictedNextOrder:'Mar 8, 2026', segment:'VIP', loyaltyTier:'Gold',
      channels:{ email:'subscribed', sms:'subscribed', push:'opted-out' },
    };
    const ACTIVITY = [
      { time:'Today 2:14 PM', icon:'📧', event:'Opened "Spring Sale" email' },
      { time:'Today 11:30 AM', icon:'🖱️', event:'Clicked "Shop Now" in cart reminder' },
      { time:'Yesterday', icon:'💰', event:'Purchased Order #1042 — $89.99' },
      { time:'Feb 18', icon:'⭐', event:'Left 5-star review on Wireless Headphones' },
      { time:'Feb 15', icon:'📱', event:'Received SMS: Loyalty reward unlocked' },
      { time:'Feb 12', icon:'👁️', event:'Viewed product: Blue Denim Jacket' },
      { time:'Feb 10', icon:'👋', event:'Entered VIP segment via automation' },
    ];
    return (
      <div>
        <div style={S.title}>Customer Profiles</div>
        <p style={S.muted}>360° unified view of each contact — identity resolution, predictive analytics, and full activity history.</p>
        <div style={{ ...S.card, marginTop:'16px', display:'flex', gap:'20px', alignItems:'flex-start' }}>
          <div style={{ fontSize:'48px' }}>{PROFILE.avatar}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'18px', fontWeight:700, color:'#fafafa' }}>{PROFILE.name}</div>
            <div style={S.muted}>{PROFILE.email} · {PROFILE.phone}</div>
            <div style={{ ...S.row, marginTop:'8px', flexWrap:'wrap' }}>
              <span style={S.badge('#8b5cf6')}>{PROFILE.segment}</span>
              <span style={S.badge('#f59e0b')}>{PROFILE.loyaltyTier}</span>
              <span style={S.badge(PROFILE.churnRisk==='Low'?'#22c55e':'#ef4444')}>Churn: {PROFILE.churnRisk}</span>
            </div>
          </div>
        </div>
        <div style={{ ...S.grid4, marginTop:'16px' }}>
          <StatCard label="Lifetime Value" value={PROFILE.ltv} color="#8b5cf6" />
          <StatCard label="Total Orders" value={PROFILE.orders} color="#22c55e" />
          <StatCard label="Avg Order Value" value={PROFILE.avgOrder} />
          <StatCard label="Next Order (AI)" value={PROFILE.predictedNextOrder} color="#3b82f6" />
        </div>
        {/* Channel consent */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Channel Consent</div>
          <div style={S.row}>
            {Object.entries(PROFILE.channels).map(([ch,st])=>(
              <div key={ch} style={{ ...S.elevated, display:'flex', gap:'8px', alignItems:'center' }}>
                <span style={{ color:'#fafafa', fontWeight:600, textTransform:'capitalize' }}>{ch}</span>
                <span style={S.badge(st==='subscribed'?'#22c55e':'#71717a')}>{st}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Activity feed */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Activity Timeline</div>
          {ACTIVITY.map((a,i)=>(
            <div key={i} style={{ display:'flex', gap:'10px', padding:'8px 0', borderBottom:'1px solid #27272a' }}>
              <span style={{ fontSize:'16px' }}>{a.icon}</span>
              <div style={{ flex:1, color:'#fafafa', fontSize:'13px' }}>{a.event}</div>
              <div style={{ fontSize:'12px', color:'#71717a', whiteSpace:'nowrap' }}>{a.time}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Landing Pages ──
  if (tab === 'landing-pages') {
    const PAGES = [
      { name:'Spring Sale 2026', status:'published', visits:4200, conversions:340, rate:'8.1%', url:'/spring-sale' },
      { name:'Product Launch — Wireless Pro', status:'published', visits:2800, conversions:210, rate:'7.5%', url:'/wireless-pro' },
      { name:'VIP Early Access', status:'published', visits:1600, conversions:320, rate:'20.0%', url:'/vip-access' },
      { name:'Holiday Gift Guide', status:'draft', visits:0, conversions:0, rate:'—', url:'/gift-guide' },
      { name:'Referral Program', status:'published', visits:980, conversions:145, rate:'14.8%', url:'/refer' },
    ];
    return (
      <div>
        <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'16px' }}>
          <div><div style={S.title}>Landing Pages</div><p style={S.muted}>Build high-converting campaign landing pages — no code required.</p></div>
          <div style={S.row}>
            <AIGenButton label="AI Generate Page" credits={3} loading={aiLoading && aiField==='landing'} onClick={() => aiGenerate('landing-page', 'Generate high-converting landing page copy with headline, subheadline, key benefits, CTA text, and social proof section', 'landing')} />
            <button style={S.btnPrimary}>+ New Landing Page</button>
          </div>
        </div>
        <div style={{ ...S.grid4, marginTop:'8px', marginBottom:'16px' }}>
          <StatCard label="Active Pages" value={PAGES.filter(p=>p.status==='published').length} color="#22c55e" />
          <StatCard label="Total Visits" value={PAGES.reduce((s,p)=>s+p.visits,0).toLocaleString()} />
          <StatCard label="Total Conversions" value={PAGES.reduce((s,p)=>s+p.conversions,0).toLocaleString()} color="#3b82f6" />
          <StatCard label="Avg Conv. Rate" value="12.1%" color="#8b5cf6" />
        </div>
        <table style={S.table}>
          <thead><tr>{['Page Name','URL','Status','Visits','Conversions','Rate','Actions'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {PAGES.map(p=>(
              <tr key={p.name}>
                <td style={S.td}>{p.name}</td>
                <td style={S.td}><code style={{ color:'#3b82f6', fontSize:'12px' }}>{p.url}</code></td>
                <td style={S.td}><span style={S.badge(p.status==='published'?'#22c55e':'#f59e0b')}>{p.status}</span></td>
                <td style={S.td}>{p.visits.toLocaleString()}</td>
                <td style={S.td}>{p.conversions.toLocaleString()}</td>
                <td style={S.td}>{p.rate}</td>
                <td style={S.td}><div style={S.row}><button style={S.btnSm}>Edit</button><button style={S.btnGhost}>Preview</button><button style={S.btnGhost}>Clone</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Page builder preview */}
        <div style={{ ...S.card, marginTop:'20px' }}>
          <div style={S.h2}>Drag-and-Drop Page Builder</div>
          <div style={{ background:'#09090b', border:'1px dashed #3f3f46', borderRadius:'8px', padding:'40px', textAlign:'center' }}>
            <div style={{ fontSize:'32px', marginBottom:'8px' }}>🖼️</div>
            <div style={{ color:'#a1a1aa', fontSize:'14px' }}>Drag blocks here: Hero, Text, Image, Product Grid, CTA Button, Countdown, Video, Testimonial, Footer</div>
            <div style={{ ...S.row, justifyContent:'center', marginTop:'16px', flexWrap:'wrap' }}>
              {['Hero Banner','Text Block','Image','Product Grid','CTA Button','Countdown Timer','Video','Testimonials','Footer'].map(b=>(
                <div key={b} style={{ ...S.elevated, padding:'6px 12px', cursor:'grab', fontSize:'12px', color:'#fafafa' }}>+ {b}</div>
              ))}
            </div>
          </div>
        </div>
        {aiResult && aiField==='landing' && <AIResultCard result={aiResult} title="AI Landing Page Copy" onClose={() => setAiResult(null)} />}
      </div>
    );
  }

  /* ── Lifecycle Stages ─────────────────────────────────────────────── */
  if (tab === 'lifecycle') {
    const stages = [
      { id:'new', label:'New', icon:'🌱', color:'#22c55e', count:842, pct:18, desc:'Signed up within last 30 days' },
      { id:'active', label:'Active', icon:'🔥', color:'#3b82f6', count:3210, pct:45, desc:'Purchased or engaged in last 60 days' },
      { id:'at-risk', label:'At-Risk', icon:'⚠️', color:'#f59e0b', count:1105, pct:15, desc:'No engagement for 60–120 days' },
      { id:'lapsed', label:'Lapsed', icon:'💤', color:'#ef4444', count:780, pct:11, desc:'No activity for 120+ days' },
      { id:'champion', label:'Champion', icon:'🏆', color:'#8b5cf6', count:522, pct:7, desc:'Top 10% by lifetime value' },
      { id:'vip', label:'VIP', icon:'⭐', color:'#ec4899', count:301, pct:4, desc:'5+ orders & high AOV' },
    ];
    return (
      <div>
        <div style={S.h1}>Customer Lifecycle Stages</div>
        <p style={S.muted}>Automatically classify customers by engagement & purchase behavior. Trigger stage-based automations.</p>
        {/* Stage funnel */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Lifecycle Funnel</div>
          <div style={{ display:'flex', gap:'8px', marginTop:'12px' }}>
            {stages.map(s=>(
              <div key={s.id} style={{ flex:1, textAlign:'center', background:'#09090b', borderRadius:'8px', padding:'14px 8px', border:`1px solid ${s.color}33` }}>
                <div style={{ fontSize:'28px' }}>{s.icon}</div>
                <div style={{ color:s.color, fontWeight:700, fontSize:'15px', marginTop:'6px' }}>{s.label}</div>
                <div style={{ color:'#fafafa', fontSize:'22px', fontWeight:700, marginTop:'4px' }}>{s.count.toLocaleString()}</div>
                <div style={{ color:'#71717a', fontSize:'12px' }}>{s.pct}% of audience</div>
                <div style={{ color:'#a1a1aa', fontSize:'11px', marginTop:'6px' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Stage-based automation triggers */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Stage Transition Automations</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Transition</th><th style={S.th}>Automation</th><th style={S.th}>Contacts/mo</th><th style={S.th}>Status</th></tr></thead>
            <tbody>
              {[
                { from:'New', to:'Active', auto:'Welcome → First Purchase Series', count:320, on:true },
                { from:'Active', to:'At-Risk', auto:'Re-engagement Win-Back Campaign', count:185, on:true },
                { from:'At-Risk', to:'Lapsed', auto:'Last Chance Offer + Sunset Flow', count:92, on:false },
                { from:'Any', to:'Champion', auto:'VIP Upgrade & Exclusive Access', count:45, on:true },
                { from:'Lapsed', to:'Active', auto:'Win-Back with Dynamic Discount', count:67, on:true },
              ].map((t,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #27272a' }}>
                  <td style={S.td}><span style={{ color:'#ef4444' }}>{t.from}</span> → <span style={{ color:'#22c55e' }}>{t.to}</span></td>
                  <td style={S.td}>{t.auto}</td>
                  <td style={S.td}>{t.count}</td>
                  <td style={S.td}><span style={{ ...S.badge(t.on?'green':'yellow'), fontSize:'11px' }}>{t.on?'Active':'Paused'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* RFM scores */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>RFM Scoring Engine</div>
          <p style={{ color:'#a1a1aa', fontSize:'13px', marginBottom:'12px' }}>Recency, Frequency, Monetary scores auto-classify customers into lifecycle stages.</p>
          <div style={S.grid3}>
            {[
              { label:'Recency', desc:'Days since last purchase', weight:'40%', icon:'📅' },
              { label:'Frequency', desc:'Total order count (12 mo)', weight:'30%', icon:'🔄' },
              { label:'Monetary', desc:'Total spend (12 mo)', weight:'30%', icon:'💰' },
            ].map(r=>(
              <div key={r.label} style={S.elevated}>
                <div style={{ fontSize:'24px', marginBottom:'6px' }}>{r.icon}</div>
                <div style={{ color:'#fafafa', fontWeight:600, fontSize:'14px' }}>{r.label}</div>
                <div style={{ color:'#a1a1aa', fontSize:'12px', marginTop:'4px' }}>{r.desc}</div>
                <div style={{ color:'#8b5cf6', fontSize:'13px', marginTop:'8px' }}>Weight: {r.weight}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Dynamic Content ──────────────────────────────────────────────── */
  if (tab === 'dynamic-content') {
    const [dcType, setDcType] = useState('product-blocks');
    return (
      <div>
        <div style={S.h1}>Dynamic Content</div>
        <p style={S.muted}>Insert personalized product blocks, coupon codes, and conditional content into emails automatically.</p>
        <div style={{ ...S.row, marginBottom:'16px' }}>
          {['product-blocks','coupon-codes','conditional','countdown'].map(t=>(
            <button key={t} onClick={()=>setDcType(t)} style={{ ...S.btnSm, background:dcType===t?'#8b5cf6':'#27272a', color:dcType===t?'#fff':'#a1a1aa' }}>
              {t==='product-blocks'?'Product Blocks':t==='coupon-codes'?'Coupon Codes':t==='conditional'?'Conditional':t==='countdown'?'Countdown':''}
            </button>
          ))}
        </div>

        {dcType==='product-blocks' && (
          <div style={S.card}>
            <div style={S.h2}>Dynamic Product Blocks</div>
            <p style={{ color:'#a1a1aa', fontSize:'13px', marginBottom:'12px' }}>Auto-insert best-selling, recently viewed, or related products per recipient.</p>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Block Name</th><th style={S.th}>Source</th><th style={S.th}>Products</th><th style={S.th}>Used In</th><th style={S.th}>CTR</th></tr></thead>
              <tbody>
                {[
                  { name:'Top Sellers', src:'Best sellers (30 day)', n:4, used:12, ctr:'8.2%' },
                  { name:'Recently Viewed', src:'Browsing history', n:3, used:8, ctr:'12.4%' },
                  { name:'Cart Cross-Sell', src:'Related to cart items', n:2, used:5, ctr:'9.7%' },
                  { name:'New Arrivals', src:'Added last 7 days', n:6, used:3, ctr:'6.1%' },
                  { name:'Personalized Picks', src:'AI recommendation engine', n:4, used:7, ctr:'14.8%' },
                ].map((b,i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid #27272a' }}>
                    <td style={S.td}><span style={{ fontWeight:600, color:'#fafafa' }}>{b.name}</span></td>
                    <td style={S.td}>{b.src}</td>
                    <td style={S.td}>{b.n} items</td>
                    <td style={S.td}>{b.used} campaigns</td>
                    <td style={S.td}><span style={{ color:'#22c55e' }}>{b.ctr}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Preview */}
            <div style={{ marginTop:'16px', background:'#09090b', border:'1px solid #3f3f46', borderRadius:'8px', padding:'16px' }}>
              <div style={{ color:'#71717a', fontSize:'11px', textTransform:'uppercase', marginBottom:'8px' }}>LIVE PREVIEW — Top Sellers Block</div>
              <div style={S.grid4}>
                {['Silk Scarf','Leather Bag','Gold Watch','Sunglasses'].map(p=>(
                  <div key={p} style={{ background:'#18181b', borderRadius:'6px', padding:'10px', textAlign:'center' }}>
                    <div style={{ fontSize:'24px', marginBottom:'4px' }}>🛍️</div>
                    <div style={{ color:'#fafafa', fontSize:'13px', fontWeight:500 }}>{p}</div>
                    <div style={{ color:'#22c55e', fontSize:'12px' }}>$79.00</div>
                    <button style={{ ...S.btnPrimary, marginTop:'6px', padding:'3px 8px', fontSize:'10px' }}>Add to Cart</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {dcType==='coupon-codes' && (
          <div style={S.card}>
            <div style={S.h2}>Dynamic Coupon Codes</div>
            <p style={{ color:'#a1a1aa', fontSize:'13px', marginBottom:'12px' }}>Generate unique, single-use discount codes per recipient to prevent sharing.</p>
            <div style={S.grid3}>
              <StatCard label="Active Codes" value="2,847" sub="Generated this month" color="#8b5cf6" />
              <StatCard label="Redeemed" value="412" sub="14.5% redemption rate" color="#22c55e" />
              <StatCard label="Revenue" value="$18,340" sub="From coupon orders" color="#3b82f6" />
            </div>
            <table style={{ ...S.table, marginTop:'16px' }}>
              <thead><tr><th style={S.th}>Code Pattern</th><th style={S.th}>Discount</th><th style={S.th}>Expires</th><th style={S.th}>Used</th><th style={S.th}>Revenue</th></tr></thead>
              <tbody>
                {[
                  { pattern:'WELCOME-{UNIQUE}', disc:'15% off first order', exp:'7 days', used:198, rev:'$6,210' },
                  { pattern:'WINBACK-{UNIQUE}', disc:'$10 off $50+', exp:'48 hours', used:87, rev:'$4,870' },
                  { pattern:'VIP-{UNIQUE}', disc:'20% off everything', exp:'30 days', used:45, rev:'$5,120' },
                  { pattern:'BDAY-{UNIQUE}', disc:'Free shipping + 10%', exp:'14 days', used:82, rev:'$2,140' },
                ].map((c,i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid #27272a' }}>
                    <td style={S.td}><code style={{ color:'#8b5cf6', background:'#27272a', padding:'2px 6px', borderRadius:'3px', fontSize:'12px' }}>{c.pattern}</code></td>
                    <td style={S.td}>{c.disc}</td>
                    <td style={S.td}>{c.exp}</td>
                    <td style={S.td}>{c.used}</td>
                    <td style={S.td}><span style={{ color:'#22c55e' }}>{c.rev}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {dcType==='conditional' && (
          <div style={S.card}>
            <div style={S.h2}>Conditional Content Blocks</div>
            <p style={{ color:'#a1a1aa', fontSize:'13px', marginBottom:'12px' }}>Show different content to different segments within the same email.</p>
            {[
              { condition:'If customer.orders > 3', show:'Loyalty tier badge + exclusive collection', fallback:'New customer intro + bestsellers' },
              { condition:'If cart.value > $100', show:'Free shipping banner + upgrade offer', fallback:'Standard shipping rates' },
              { condition:'If location = "US"', show:'US pricing + domestic delivery estimate', fallback:'International shipping info + customs note' },
            ].map((r,i)=>(
              <div key={i} style={{ ...S.elevated, marginBottom:'12px' }}>
                <div style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ color:'#8b5cf6', fontSize:'13px', fontWeight:600, fontFamily:'monospace' }}>{r.condition}</div>
                    <div style={{ marginTop:'8px' }}><span style={{ color:'#22c55e', fontSize:'12px' }}>✓ Show:</span> <span style={{ color:'#a1a1aa', fontSize:'12px' }}>{r.show}</span></div>
                    <div style={{ marginTop:'4px' }}><span style={{ color:'#f59e0b', fontSize:'12px' }}>↳ Else:</span> <span style={{ color:'#a1a1aa', fontSize:'12px' }}>{r.fallback}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {dcType==='countdown' && (
          <div style={S.card}>
            <div style={S.h2}>Countdown Timers</div>
            <p style={{ color:'#a1a1aa', fontSize:'13px', marginBottom:'12px' }}>Live countdown timers that update on email open, creating urgency.</p>
            <div style={S.grid3}>
              {[
                { name:'Flash Sale', ends:'24h from send', used:14, convRate:'18.3%' },
                { name:'Cart Expiry', ends:'2h from abandon', used:8, convRate:'22.7%' },
                { name:'Launch Timer', ends:'Fixed date', used:3, convRate:'12.1%' },
              ].map(t=>(
                <div key={t.name} style={S.elevated}>
                  <div style={{ color:'#fafafa', fontWeight:600, fontSize:'14px' }}>{t.name}</div>
                  <div style={{ color:'#a1a1aa', fontSize:'12px', marginTop:'4px' }}>Expires: {t.ends}</div>
                  <div style={{ display:'flex', justifyContent:'center', gap:'6px', margin:'12px 0', color:'#ef4444', fontWeight:700, fontSize:'18px', fontFamily:'monospace' }}>
                    <span style={{ background:'#27272a', padding:'4px 8px', borderRadius:'4px' }}>02</span>:
                    <span style={{ background:'#27272a', padding:'4px 8px', borderRadius:'4px' }}>14</span>:
                    <span style={{ background:'#27272a', padding:'4px 8px', borderRadius:'4px' }}>37</span>
                  </div>
                  <div style={{ color:'#71717a', fontSize:'11px' }}>Used in {t.used} campaigns · {t.convRate} conv.</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Stock & Price Alerts ──────────────────────────────────────────── */
  if (tab === 'stock-alerts') {
    return (
      <div>
        <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'8px' }}>
          <div>
            <div style={S.h1}>Back-in-Stock & Price Drop Alerts</div>
            <p style={S.muted}>Automatically notify customers when out-of-stock products return or when items they viewed drop in price.</p>
          </div>
          <AIGenButton label="AI Write Alert Copy" credits={2} loading={aiLoading && aiField==='stock-alert'} onClick={() => aiGenerate('stock-alert', 'Write compelling back-in-stock and price drop email notification copy with urgency elements, product placeholders, and CTA buttons', 'stock-alert')} />
        </div>
        <div style={S.grid4}>
          <StatCard label="Waitlist Signups" value="3,842" sub="Across 128 products" color="#8b5cf6" />
          <StatCard label="Alerts Sent" value="1,247" sub="Last 30 days" color="#3b82f6" />
          <StatCard label="Conversion Rate" value="24.6%" sub="From alert → purchase" color="#22c55e" />
          <StatCard label="Revenue Recovered" value="$42,180" sub="From alert purchases" color="#f59e0b" />
        </div>
        {/* Back-in-Stock */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Back-in-Stock Alerts</div>
          <p style={{ color:'#a1a1aa', fontSize:'13px', marginBottom:'12px' }}>Customers subscribe to out-of-stock products. When inventory is replenished, automated alerts drive immediate purchases.</p>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Product</th><th style={S.th}>Waitlist</th><th style={S.th}>Alerts Sent</th><th style={S.th}>Purchased</th><th style={S.th}>Conv.</th><th style={S.th}>Status</th></tr></thead>
            <tbody>
              {[
                { name:'Limited Edition Sneakers', wait:342, sent:342, bought:98, conv:'28.7%', status:'Restocked' },
                { name:'Organic Face Serum', wait:218, sent:218, bought:64, conv:'29.4%', status:'Restocked' },
                { name:'Wireless Earbuds Pro', wait:156, sent:0, bought:0, conv:'—', status:'Out of Stock' },
                { name:'Cashmere Sweater', wait:89, sent:89, bought:23, conv:'25.8%', status:'Restocked' },
                { name:'Chef\'s Knife Set', wait:67, sent:0, bought:0, conv:'—', status:'Awaiting Restock' },
              ].map((p,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #27272a' }}>
                  <td style={S.td}><span style={{ fontWeight:600, color:'#fafafa' }}>{p.name}</span></td>
                  <td style={S.td}>{p.wait}</td>
                  <td style={S.td}>{p.sent}</td>
                  <td style={S.td}>{p.bought}</td>
                  <td style={S.td}><span style={{ color:'#22c55e' }}>{p.conv}</span></td>
                  <td style={S.td}><span style={{ ...S.badge(p.status==='Restocked'?'green':p.status==='Out of Stock'?'red':'yellow'), fontSize:'11px' }}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Price Drop Alerts */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Price Drop Alerts</div>
          <p style={{ color:'#a1a1aa', fontSize:'13px', marginBottom:'12px' }}>Notify customers when products they've viewed or wishlisted drop in price.</p>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Product</th><th style={S.th}>Original</th><th style={S.th}>New Price</th><th style={S.th}>Drop</th><th style={S.th}>Notified</th><th style={S.th}>Purchased</th></tr></thead>
            <tbody>
              {[
                { name:'Running Shoes', orig:'$129.99', now:'$89.99', drop:'31%', notified:420, bought:67 },
                { name:'Smart Watch', orig:'$299.00', now:'$249.00', drop:'17%', notified:310, bought:52 },
                { name:'Yoga Mat Premium', orig:'$79.00', now:'$59.99', drop:'24%', notified:185, bought:41 },
                { name:'Bluetooth Speaker', orig:'$149.99', now:'$119.99', drop:'20%', notified:278, bought:38 },
              ].map((p,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #27272a' }}>
                  <td style={S.td}><span style={{ fontWeight:600, color:'#fafafa' }}>{p.name}</span></td>
                  <td style={S.td}><span style={{ textDecoration:'line-through', color:'#71717a' }}>{p.orig}</span></td>
                  <td style={S.td}><span style={{ color:'#22c55e', fontWeight:600 }}>{p.now}</span></td>
                  <td style={S.td}><span style={{ color:'#ef4444' }}>-{p.drop}</span></td>
                  <td style={S.td}>{p.notified}</td>
                  <td style={S.td}>{p.bought}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Alert settings */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Alert Configuration</div>
          <div style={S.grid3}>
            {[
              { label:'Back-in-Stock Channels', value:'Email + SMS + Push', icon:'📦' },
              { label:'Price Drop Threshold', value:'≥ 10% reduction', icon:'📉' },
              { label:'Alert Window', value:'Send within 1 hour', icon:'⏰' },
              { label:'Signup Widget', value:'Embedded on PDP', icon:'🔔' },
              { label:'Frequency Cap', value:'Max 1 alert/product/week', icon:'🛑' },
              { label:'Expiry', value:'Auto-remove after 90 days', icon:'📅' },
            ].map(s=>(
              <div key={s.label} style={S.elevated}>
                <div style={{ fontSize:'20px', marginBottom:'6px' }}>{s.icon}</div>
                <div style={{ color:'#fafafa', fontWeight:600, fontSize:'13px' }}>{s.label}</div>
                <div style={{ color:'#8b5cf6', fontSize:'12px', marginTop:'4px' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
        {aiResult && aiField==='stock-alert' && <AIResultCard result={aiResult} title="AI Alert Copy" onClose={() => setAiResult(null)} />}
      </div>
    );
  }

  /* ── Coupon & Discount Engine ─────────────────────────────────────── */
  if (tab === 'coupon-engine') {
    return (
      <div>
        <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'8px' }}>
          <div>
            <div style={S.h1}>Coupon & Discount Code Engine</div>
            <p style={S.muted}>Auto-generate unique, single-use discount codes for each email recipient to drive conversions and prevent code sharing.</p>
          </div>
          <AIGenButton label="AI Suggest Strategy" credits={2} loading={aiLoading && aiField==='coupon'} onClick={() => aiGenerate('coupon-strategy', 'Suggest 3 optimal discount strategies for an e-commerce store including discount type, amount, targeting criteria, and expected ROI based on industry best practices', 'coupon')} />
        </div>
        <div style={S.grid4}>
          <StatCard label="Active Codes" value="12,480" sub="Unique codes generated" color="#8b5cf6" />
          <StatCard label="Redeemed" value="3,240" sub="25.9% redemption rate" color="#22c55e" />
          <StatCard label="Revenue Generated" value="$48.2K" sub="From coupon emails" color="#f59e0b" />
          <StatCard label="Avg Order Uplift" value="+18%" sub="vs non-coupon orders" color="#3b82f6" />
        </div>
        {/* Active coupon sets */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Coupon Sets</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Set Name</th><th style={S.th}>Code Format</th><th style={S.th}>Discount</th><th style={S.th}>Generated</th><th style={S.th}>Redeemed</th><th style={S.th}>Expires</th><th style={S.th}>Status</th></tr></thead>
            <tbody>
              {[
                { name:'Welcome 15%', format:'AURA-XXXX', disc:'15% off', gen:3200, used:1840, exp:'Rolling 7d', on:true },
                { name:'Cart Recovery 10%', format:'SAVE10-XXXX', disc:'10% off', gen:4100, used:820, exp:'48 hours', on:true },
                { name:'VIP $20 Off', format:'VIP20-XXXX', disc:'$20 off $100+', gen:1200, used:380, exp:'14 days', on:true },
                { name:'Win-Back 25%', format:'COMEBACK-XXXX', disc:'25% off', gen:2400, used:140, exp:'72 hours', on:false },
                { name:'Birthday Treat', format:'BDAY-XXXX', disc:'Free shipping', gen:1580, used:60, exp:'30 days', on:true },
              ].map((c,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #27272a' }}>
                  <td style={S.td}><span style={{ fontWeight:600, color:'#fafafa' }}>{c.name}</span></td>
                  <td style={S.td}><code style={{ color:'#a1a1aa', fontSize:'12px' }}>{c.format}</code></td>
                  <td style={S.td}><span style={{ color:'#22c55e', fontWeight:600 }}>{c.disc}</span></td>
                  <td style={S.td}>{c.gen.toLocaleString()}</td>
                  <td style={S.td}>{c.used.toLocaleString()}</td>
                  <td style={S.td}><span style={{ color:'#71717a' }}>{c.exp}</span></td>
                  <td style={S.td}><span style={S.badge(c.on?'green':'yellow')}>{c.on?'Active':'Paused'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button style={{ ...S.btnPrimary, marginTop:'12px' }}>+ Create Coupon Set</button>
        </div>
        {/* Code generation settings */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Code Generation Settings</div>
          <div style={S.grid3}>
            {[
              { label:'Code Length', value:'8 characters', desc:'Alphanumeric, uppercase', icon:'🔢' },
              { label:'Prefix Support', value:'Custom prefix', desc:'AURA-, SAVE-, VIP- etc.', icon:'🏷️' },
              { label:'Single-Use', value:'Enforced', desc:'Each code valid for one use only', icon:'🔒' },
              { label:'Shopify Sync', value:'Auto-synced', desc:'Codes pushed to Shopify discounts', icon:'🔗' },
              { label:'Expiration', value:'Per-set rules', desc:'Rolling or fixed date expiry', icon:'⏰' },
              { label:'Min Purchase', value:'Configurable', desc:'Set min order value per coupon set', icon:'💰' },
            ].map(s=>(
              <div key={s.label} style={S.elevated}>
                <div style={{ fontSize:'18px', marginBottom:'6px' }}>{s.icon}</div>
                <div style={{ color:'#fafafa', fontWeight:600, fontSize:'13px' }}>{s.label}</div>
                <div style={{ color:'#8b5cf6', fontSize:'12px', marginTop:'4px' }}>{s.value}</div>
                <div style={{ color:'#a1a1aa', fontSize:'11px', marginTop:'4px' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
        {aiResult && aiField==='coupon' && <AIResultCard result={aiResult} title="AI Discount Strategy" onClose={() => setAiResult(null)} />}
      </div>
    );
  }

  if (tab === 'surveys') {
    const demoSurveys = [
      { id:'srv-1', name:'Post-Purchase Feedback', type:'NPS', responses:1248, avgScore:8.4, status:'active' },
      { id:'srv-2', name:'Product Preference Quiz', type:'Multiple Choice', responses:876, avgScore:null, status:'active' },
      { id:'srv-3', name:'Brand Satisfaction Survey', type:'Rating Scale', responses:2031, avgScore:4.2, status:'completed' },
      { id:'srv-4', name:'Content Preference Poll', type:'Poll', responses:3104, avgScore:null, status:'active' },
    ];
    const demoTypes = [
      { type:'NPS Survey', desc:'Net Promoter Score (0-10) gauge customer loyalty', icon:'\u{1F4CA}', use:'Post-purchase, quarterly check-in' },
      { type:'Multiple Choice', desc:'Let subscribers pick from predefined options', icon:'\u2705', use:'Product preferences, content topics' },
      { type:'Rating Scale', desc:'Star or numeric rating (1-5) for satisfaction', icon:'\u2B50', use:'Service feedback, product reviews' },
      { type:'Open Text', desc:'Free-form text input for detailed feedback', icon:'\u{1F4DD}', use:'Feature requests, testimonials' },
      { type:'Poll', desc:'Single-question vote embedded in email', icon:'\u{1F5F3}\uFE0F', use:'Quick opinions, A/B preference' },
      { type:'Emoji Scale', desc:'Reaction-based (😡😐😊) micro-survey', icon:'\u{1F60A}', use:'Sentiment gauge, CSAT' },
    ];
    return (
      <div>
        <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'8px' }}>
          <div>
            <div style={S.title}>Surveys & Polls</div>
            <p style={S.subtitle}>Collect feedback and preferences directly inside emails with interactive surveys, NPS scores, and quick polls.</p>
          </div>
          <AIGenButton label="AI Generate Survey" credits={2} loading={aiLoading && aiField==='survey'} onClick={() => aiGenerate('survey', 'Generate 5 effective survey questions for an e-commerce post-purchase feedback form including NPS, product satisfaction, and improvement suggestions', 'survey')} />
        </div>
        <div style={S.grid4}>
          <StatCard label="Total Responses" value="7,259" color="#8b5cf6" />
          <StatCard label="Active Surveys" value="3" color="#22c55e" />
          <StatCard label="Avg NPS Score" value="8.4" color="#3b82f6" />
          <StatCard label="Response Rate" value="14.2%" color="#f59e0b" />
        </div>
        {/* Survey Types */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Survey Types</div>
          <div style={S.grid3}>
            {demoTypes.map(t=>(
              <div key={t.type} style={S.elevated}>
                <div style={{ fontSize:'22px', marginBottom:'6px' }}>{t.icon}</div>
                <div style={{ color:'#fafafa', fontWeight:600, fontSize:'14px' }}>{t.type}</div>
                <div style={{ color:'#a1a1aa', fontSize:'12px', marginTop:'4px' }}>{t.desc}</div>
                <div style={{ color:'#71717a', fontSize:'11px', marginTop:'6px' }}>Use: {t.use}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Active Surveys */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>All Surveys</div>
          <table style={S.table}>
            <thead><tr>{['Survey','Type','Responses','Score','Status','Actions'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {demoSurveys.map(s=>(
                <tr key={s.id}>
                  <td style={S.td}>{s.name}</td>
                  <td style={S.td}><span style={S.badge('#8b5cf6')}>{s.type}</span></td>
                  <td style={S.td}>{s.responses.toLocaleString()}</td>
                  <td style={S.td}>{s.avgScore ? s.avgScore+'/10' : '\u2014'}</td>
                  <td style={S.td}><span style={S.badge(s.status==='active'?'#22c55e':'#3b82f6')}>{s.status}</span></td>
                  <td style={S.td}><button style={S.btnSm}>View Results</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* NPS Breakdown */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>NPS Distribution</div>
          <div style={S.grid3}>
            {[
              { label:'Promoters (9-10)', pct:'62%', count:774, color:'#22c55e' },
              { label:'Passives (7-8)', pct:'24%', count:300, color:'#f59e0b' },
              { label:'Detractors (0-6)', pct:'14%', count:174, color:'#ef4444' },
            ].map(g=>(
              <div key={g.label} style={S.elevated}>
                <div style={{ color:g.color, fontWeight:700, fontSize:'24px' }}>{g.pct}</div>
                <div style={{ color:'#fafafa', fontSize:'13px', marginTop:'4px' }}>{g.label}</div>
                <div style={{ color:'#71717a', fontSize:'11px', marginTop:'2px' }}>{g.count} responses</div>
                <div style={{ background:'#3f3f46', borderRadius:'4px', height:'6px', marginTop:'8px' }}>
                  <div style={{ background:g.color, borderRadius:'4px', height:'6px', width:g.pct }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        {aiResult && aiField==='survey' && <AIResultCard result={aiResult} title="AI Generated Survey Questions" onClose={() => setAiResult(null)} />}
      </div>
    );
  }

  /* ── AMP & Interactive Emails ────────────────────────────────────── */
  if (tab === 'amp-emails') {
    return (
      <div>
        <SectionTitle>AMP & Interactive Emails</SectionTitle>
        <p style={S.desc}>Create interactive email experiences with AMP-powered components — in-email forms, carousels, accordions, and live content that update at open time.</p>
        <div style={S.grid3}>
          <StatCard label="AMP-Enabled Campaigns" value="12" sub="Last 30 days" color="#8b5cf6" />
          <StatCard label="In-Email Conversions" value="847" sub="+34% vs static" color="#22c55e" />
          <StatCard label="Avg. Interaction Rate" value="23.4%" sub="vs 2.1% click rate" color="#3b82f6" />
        </div>
        <h4 style={S.h4}>Interactive Components Library</h4>
        <div style={S.grid3}>
          {[
            { name:'In-Email Forms', desc:'Collect feedback, RSVPs, and preferences directly inside the email without redirecting to a landing page', icon:'\u{1F4DD}', status:'Active' },
            { name:'Image Carousel', desc:'Showcase multiple products or images in a swipeable carousel within the email body', icon:'\u{1F3A0}', status:'Active' },
            { name:'Accordion / FAQ', desc:'Expandable content sections that let readers explore details without leaving the inbox', icon:'\u{1F4C2}', status:'Active' },
            { name:'Live Polling', desc:'Real-time polls with instant result display — boost engagement and collect zero-party data', icon:'\u{1F4CA}', status:'Beta' },
            { name:'Add-to-Cart', desc:'Let subscribers add items to their Shopify cart directly from the email with one tap', icon:'\u{1F6D2}', status:'Beta' },
            { name:'Appointment Booking', desc:'Embed calendar scheduling widgets so recipients book meetings without leaving email', icon:'\u{1F4C5}', status:'Coming Soon' },
          ].map(c=>(  
            <div key={c.name} style={S.elevated}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'22px' }}>{c.icon}</span>
                <span style={S.badge(c.status==='Active'?'#22c55e':c.status==='Beta'?'#f59e0b':'#6b7280')}>{c.status}</span>
              </div>
              <div style={{ color:'#fafafa', fontWeight:600, fontSize:'14px', marginTop:'8px' }}>{c.name}</div>
              <div style={{ color:'#a1a1aa', fontSize:'12px', marginTop:'4px' }}>{c.desc}</div>
            </div>
          ))}
        </div>
        <h4 style={S.h4}>AMP Email Fallback Strategy</h4>
        <div style={{ ...S.card, padding:'16px' }}>
          <p style={{ color:'#a1a1aa', fontSize:'13px', margin:'0 0 12px 0' }}>AMP emails automatically fall back to rich HTML for clients that don\u2019t support AMP (Outlook, Yahoo). Configure your fallback behavior:</p>
          <div style={S.grid3}>
            {[
              { setting:'Fallback Mode', value:'Rich HTML Mirror', desc:'Auto-generate static HTML equivalent of all interactive elements' },
              { setting:'Gmail AMP', value:'Enabled', desc:'Supports forms, carousels, and live content in Gmail' },
              { setting:'Yahoo AMP', value:'Enabled', desc:'Full AMP support with interactive widgets' },
              { setting:'Outlook Fallback', value:'Static HTML', desc:'Renders beautiful static version for Outlook clients' },
              { setting:'Apple Mail', value:'Static + CSS', desc:'Progressive enhancement with CSS animations' },
              { setting:'AMP Cache TTL', value:'30 min', desc:'How often live content refreshes in supported clients' },
            ].map(s=>(  
              <div key={s.setting} style={S.elevated}>
                <div style={{ color:'#fafafa', fontWeight:600, fontSize:'13px' }}>{s.setting}</div>
                <div style={{ color:'#8b5cf6', fontSize:'15px', fontWeight:700, marginTop:'4px' }}>{s.value}</div>
                <div style={{ color:'#71717a', fontSize:'11px', marginTop:'4px' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <h4 style={S.h4}>Recent AMP Campaign Performance</h4>
        <table style={S.table}>
          <thead><tr>{['Campaign','Type','Interactions','Conv. Rate','Fallback Opens'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {[
              ['Flash Sale Carousel','Carousel','2,341','6.8%','12,450'],
              ['NPS Survey Q1','In-Email Form','1,893','45.2%','8,120'],
              ['Product Quiz','Accordion + Poll','956','18.7%','5,320'],
              ['Booking Promo','Add-to-Cart','1,204','9.1%','7,890'],
            ].map(r=><tr key={r[0]}>{r.map((c,i)=><td key={i} style={S.td}>{c}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    );
  }

  /* ── RSS-to-Email ────────────────────────────────────────────────── */
  if (tab === 'rss-to-email') {
    return (
      <div>
        <SectionTitle>RSS-to-Email Auto Newsletters</SectionTitle>
        <p style={S.desc}>Automatically generate and send email newsletters from RSS feeds — blog posts, product updates, and news curated into branded email digests on your schedule.</p>
        <div style={S.grid3}>
          <StatCard label="Active Feeds" value="4" sub="Connected sources" color="#3b82f6" />
          <StatCard label="Auto-Sent This Month" value="16" sub="Newsletters generated" color="#22c55e" />
          <StatCard label="Avg. Open Rate" value="38.2%" sub="+5% vs manual" color="#f59e0b" />
        </div>
        <h4 style={S.h4}>Connected RSS Feeds</h4>
        <table style={S.table}>
          <thead><tr>{['Feed Name','URL','Frequency','Last Sent','Items/Issue','Status'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {[
              ['Blog Digest','blog.store.com/rss','Weekly (Mon 9am)','Feb 17, 2026','5 latest','Active'],
              ['Product Updates','store.com/products.rss','Bi-weekly','Feb 10, 2026','New arrivals','Active'],
              ['Industry News','feedly.com/curated.xml','Daily Digest','Feb 20, 2026','Top 3 stories','Active'],
              ['Press Releases','store.com/press.rss','On new item','Feb 14, 2026','1 per email','Paused'],
            ].map(r=><tr key={r[0]}>{r.map((c,i)=><td key={i} style={S.td}>{c}</td>)}</tr>)}
          </tbody>
        </table>
        <h4 style={S.h4}>RSS Digest Configuration</h4>
        <div style={S.grid3}>
          {[
            { setting:'Template Style', value:'Magazine Layout', desc:'Choose from card grid, magazine, minimal, or full-article layouts for your digest' },
            { setting:'Content Limit', value:'5 items', desc:'Maximum number of feed items per newsletter issue' },
            { setting:'Image Handling', value:'Auto-Extract', desc:'Automatically pull featured images from RSS content for visual emails' },
            { setting:'AI Summary', value:'Enabled', desc:'Use AI to generate concise summaries of each article for the digest' },
            { setting:'Conditional Send', value:'Min 2 Items', desc:'Only send when the feed has at least N new items since last digest' },
            { setting:'UTM Tagging', value:'Auto-Append', desc:'Automatically add UTM parameters to all RSS links for tracking' },
          ].map(s=>(  
            <div key={s.setting} style={S.elevated}>
              <div style={{ color:'#fafafa', fontWeight:600, fontSize:'13px' }}>{s.setting}</div>
              <div style={{ color:'#3b82f6', fontSize:'15px', fontWeight:700, marginTop:'4px' }}>{s.value}</div>
              <div style={{ color:'#71717a', fontSize:'11px', marginTop:'4px' }}>{s.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ ...S.card, padding:'16px', marginTop:'16px' }}>
          <h4 style={{ ...S.h4, marginTop:0 }}>Add New RSS Feed</h4>
          <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
            <input placeholder="Feed URL (https://...)" style={{ ...S.input, flex:2, minWidth:'200px' }} />
            <input placeholder="Feed name" style={{ ...S.input, flex:1, minWidth:'120px' }} />
            <select style={S.input}>
              <option>Daily</option><option>Weekly</option><option>Bi-weekly</option><option>On new item</option>
            </select>
            <button style={S.btn}>\u2795 Add Feed</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Smart Translations (auto-translate emails to 68+ languages) ───── */
  if (tab === 'smart-translations') {
    return (
      <div>
        <div style={S.row}><h3 style={S.title}>\uD83C\uDF10 Smart Translations</h3><span style={S.badge('#3b82f6')}>68 Languages</span></div>
        <p style={S.subtitle}>Auto-translate emails, SMS, and push into subscribers\u2019 preferred language from a single template.</p>
        <div style={{ ...S.grid4, marginTop:'16px' }}>
          {[{l:'Translated Campaigns',v:'142',c:'#22c55e'},{l:'Languages Active',v:'12',c:'#3b82f6'},{l:'Auto-Detected Locale',v:'94%',c:'#8b5cf6'},{l:'Translation Accuracy',v:'97.3%',c:'#f59e0b'}].map(s=>(
            <StatCard key={s.l} label={s.l} value={s.v} color={s.c} />
          ))}
        </div>
        <div style={{ ...S.card, marginTop:'16px' }}>
          <h4 style={S.h2}>Language Configuration</h4>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Language</th><th style={S.th}>Code</th><th style={S.th}>Subscribers</th><th style={S.th}>Status</th><th style={S.th}>Auto-Detect</th></tr></thead>
            <tbody>
              {[
                {lang:'English',code:'en',subs:'45,230',status:'Primary',detect:'\u2014'},
                {lang:'French',code:'fr',subs:'8,412',status:'Active',detect:'\u2705'},
                {lang:'German',code:'de',subs:'6,891',status:'Active',detect:'\u2705'},
                {lang:'Spanish',code:'es',subs:'5,204',status:'Active',detect:'\u2705'},
                {lang:'Portuguese (BR)',code:'pt-BR',subs:'3,780',status:'Active',detect:'\u2705'},
                {lang:'Japanese',code:'ja',subs:'2,156',status:'Active',detect:'\u2705'},
                {lang:'Italian',code:'it',subs:'1,930',status:'Active',detect:'\u2705'},
                {lang:'Dutch',code:'nl',subs:'1,445',status:'Pending',detect:'\u2705'},
              ].map(r=>(
                <tr key={r.code}><td style={S.td}>{r.lang}</td><td style={S.td}><code>{r.code}</code></td><td style={S.td}>{r.subs}</td><td style={S.td}><span style={S.badge(r.status==='Primary'?'#22c55e':r.status==='Active'?'#3b82f6':'#f59e0b')}>{r.status}</span></td><td style={S.td}>{r.detect}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ ...S.grid2, marginTop:'16px' }}>
          <div style={S.card}>
            <h4 style={S.h2}>Translation Settings</h4>
            {['Auto-detect subscriber locale from browser','Preserve brand terms (no translation)','Use AI-enhanced translations','Fallback to English if no translation'].map(s=>(
              <div key={s} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                <div style={{ width:36, height:20, borderRadius:10, background:'#22c55e', position:'relative' }}><div style={{ width:16, height:16, borderRadius:8, background:'#fff', position:'absolute', top:2, right:2 }}/></div>
                <span style={{ color:'#fafafa', fontSize:'13px' }}>{s}</span>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <h4 style={S.h2}>Brand Terms (Excluded)</h4>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
              {['AURA','Shopify','VIP','BOGO','CTA','ROI','SMS','API'].map(t=>(
                <span key={t} style={{ ...S.badge('#8b5cf6'), fontSize:'12px' }}>{t}</span>
              ))}
            </div>
            <div style={{ marginTop:'12px', display:'flex', gap:'8px' }}>
              <input placeholder="Add brand term..." style={{ ...S.input, flex:1 }} />
              <button style={S.btn}>Add</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Campaign Calendar (visual planning view) ───── */
  if (tab === 'campaign-calendar') {
    const months = ['Jan','Feb','Mar','Apr','May','Jun'];
    const calData = [
      {day:'Feb 3',type:'Email',name:'Valentine\u2019s Pre-Sale',status:'Sent',color:'#22c55e'},
      {day:'Feb 10',type:'SMS',name:'Flash Sale Alert',status:'Sent',color:'#22c55e'},
      {day:'Feb 14',type:'Email',name:'Valentine\u2019s Day Drop',status:'Sent',color:'#22c55e'},
      {day:'Feb 21',type:'Email + SMS',name:'Weekend Promo',status:'Scheduled',color:'#3b82f6'},
      {day:'Feb 28',type:'Email',name:'Month-End Clearance',status:'Draft',color:'#f59e0b'},
      {day:'Mar 8',type:'Email',name:'Women\u2019s Day Special',status:'Planned',color:'#8b5cf6'},
      {day:'Mar 14',type:'Push',name:'Pi Day Deal',status:'Planned',color:'#8b5cf6'},
    ];
    return (
      <div>
        <div style={S.row}><h3 style={S.title}>\uD83D\uDCC5 Campaign Calendar</h3><button style={S.btnPrimary}>+ Plan Campaign</button></div>
        <p style={S.subtitle}>Visual calendar to plan, schedule, and track all campaigns across channels.</p>
        <div style={{ ...S.grid4, marginTop:'16px' }}>
          {[{l:'This Month',v:'8',c:'#3b82f6'},{l:'Scheduled',v:'3',c:'#22c55e'},{l:'Drafts',v:'2',c:'#f59e0b'},{l:'Planned (Future)',v:'5',c:'#8b5cf6'}].map(s=>(
            <StatCard key={s.l} label={s.l} value={s.v} color={s.c} />
          ))}
        </div>
        <div style={{ ...S.card, marginTop:'16px' }}>
          <h4 style={S.h2}>Month Selector</h4>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            {months.map(m=>(
              <button key={m} style={m==='Feb'?S.btnPrimary:S.btn}>{m} 2026</button>
            ))}
          </div>
        </div>
        <div style={{ ...S.card, marginTop:'16px' }}>
          <h4 style={S.h2}>Scheduled Campaigns</h4>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Date</th><th style={S.th}>Channel</th><th style={S.th}>Campaign</th><th style={S.th}>Status</th></tr></thead>
            <tbody>
              {calData.map(c=>(
                <tr key={c.name}><td style={S.td}>{c.day}</td><td style={S.td}>{c.type}</td><td style={S.td}>{c.name}</td><td style={S.td}><span style={S.badge(c.color)}>{c.status}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ ...S.grid2, marginTop:'16px' }}>
          <div style={S.card}>
            <h4 style={S.h2}>Channel Mix (This Month)</h4>
            {[{ch:'Email',pct:'60%',w:'60%',c:'#3b82f6'},{ch:'SMS',pct:'20%',w:'20%',c:'#22c55e'},{ch:'Push',pct:'12%',w:'12%',c:'#f59e0b'},{ch:'WhatsApp',pct:'8%',w:'8%',c:'#8b5cf6'}].map(c=>(
              <div key={c.ch} style={{ marginBottom:'8px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'3px' }}><span style={{ color:'#fafafa', fontSize:'13px' }}>{c.ch}</span><span style={{ color:'#a1a1aa', fontSize:'12px' }}>{c.pct}</span></div>
                <div style={{ background:'#27272a', borderRadius:'4px', height:'6px' }}><div style={{ background:c.c, borderRadius:'4px', height:'6px', width:c.w }} /></div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <h4 style={S.h2}>Holiday & Event Alerts</h4>
            {[{ev:'Women\u2019s Day',dt:'Mar 8',tip:'Plan 5 days before'},{ev:'St. Patrick\u2019s Day',dt:'Mar 17',tip:'Plan 7 days before'},{ev:'Easter',dt:'Apr 20',tip:'Plan 10 days before'},{ev:'Mother\u2019s Day',dt:'May 11',tip:'Plan 14 days before'}].map(e=>(
              <div key={e.ev} style={{ ...S.elevated, marginBottom:'8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div><div style={{ color:'#fafafa', fontSize:'13px', fontWeight:600 }}>{e.ev}</div><div style={{ color:'#71717a', fontSize:'11px' }}>{e.tip}</div></div>
                <span style={S.badge('#f59e0b')}>{e.dt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Countdown Timers (urgency elements in emails) ───── */
  if (tab === 'countdown-timers') {
    return (
      <div>
        <div style={S.row}><h3 style={S.title}>\u23F3 Countdown Timers</h3><button style={S.btnPrimary}>+ Create Timer</button></div>
        <p style={S.subtitle}>Add live countdown timers to emails for flash sales, launches, and limited-time offers.</p>
        <div style={{ ...S.grid4, marginTop:'16px' }}>
          {[{l:'Active Timers',v:'6',c:'#ef4444'},{l:'Avg CTR Lift',v:'+34%',c:'#22c55e'},{l:'Avg Conv Lift',v:'+19%',c:'#3b82f6'},{l:'Campaigns Using',v:'28',c:'#8b5cf6'}].map(s=>(
            <StatCard key={s.l} label={s.l} value={s.v} color={s.c} />
          ))}
        </div>
        <div style={{ ...S.card, marginTop:'16px' }}>
          <h4 style={S.h2}>Active Countdown Timers</h4>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Timer Name</th><th style={S.th}>End Date</th><th style={S.th}>Style</th><th style={S.th}>Campaigns</th><th style={S.th}>Status</th></tr></thead>
            <tbody>
              {[
                {name:'Spring Sale Ends',end:'Mar 15, 2026',style:'Flip Clock',camps:4,status:'Active'},
                {name:'Early Bird Pricing',end:'Mar 1, 2026',style:'Minimal Bar',camps:2,status:'Active'},
                {name:'VIP Access Window',end:'Feb 28, 2026',style:'Circular',camps:1,status:'Active'},
                {name:'Free Shipping Ends',end:'Mar 10, 2026',style:'Bold Banner',camps:3,status:'Active'},
                {name:'Product Launch',end:'Apr 1, 2026',style:'Flip Clock',camps:0,status:'Pending'},
              ].map(t=>(
                <tr key={t.name}><td style={S.td}>{t.name}</td><td style={S.td}>{t.end}</td><td style={S.td}>{t.style}</td><td style={S.td}>{t.camps}</td><td style={S.td}><span style={S.badge(t.status==='Active'?'#22c55e':'#f59e0b')}>{t.status}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ ...S.grid2, marginTop:'16px' }}>
          <div style={S.card}>
            <h4 style={S.h2}>Timer Styles</h4>
            {['Flip Clock (animated digits)','Minimal Bar (progress bar)','Circular (radial countdown)','Bold Banner (full-width strip)','Inline Text (e.g. "2d 14h left")'].map(s=>(
              <div key={s} style={{ ...S.elevated, marginBottom:'8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:'#fafafa', fontSize:'13px' }}>{s}</span>
                <button style={S.btnSm}>Preview</button>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <h4 style={S.h2}>Post-Expiry Behavior</h4>
            {['Show "Sale Ended" message','Hide timer block entirely','Replace with evergreen CTA','Redirect to new offer'].map(s=>(
              <div key={s} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                <input type="radio" name="expiry" style={{ accentColor:'#22c55e' }} />
                <span style={{ color:'#fafafa', fontSize:'13px' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Referral Program ── */
  if (tab === 'referral-program') {
    return (
      <div>
        <div style={{ ...S.row, justifyContent:'space-between' }}>
          <div style={S.card}>
            <h3 style={S.title}>Referral Program</h3>
            <p style={S.subtitle}>Grow your list faster with subscriber referral rewards (Beehiiv / Kit / Drip style)</p>
          </div>
          <AIGenButton label="AI Referral Copy" credits={2} loading={aiLoading && aiField==='referral'} onClick={() => aiGenerate('referral', 'Write referral program email copy with share invite template, reward notification, and milestone celebration emails for an e-commerce referral program', 'referral')} style={{ alignSelf:'flex-start', marginTop:'12px' }} />
        </div>
        <div style={S.grid4}>
          <StatCard label="Active Referrers" value="1,248" color="#22c55e" />
          <StatCard label="Total Referrals" value="3,671" color="#3b82f6" />
          <StatCard label="Conversion Rate" value="34.2%" color="#f59e0b" />
          <StatCard label="Revenue from Referrals" value="$18,940" color="#a855f7" />
        </div>
        <div style={S.card}>
          <h4 style={S.h2}>Milestone Rewards</h4>
          <p style={{ ...S.muted, marginBottom:'12px' }}>Configure rewards subscribers unlock when they refer friends</p>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Milestone</th><th style={S.th}>Referrals</th><th style={S.th}>Reward</th><th style={S.th}>Claimed</th><th style={S.th}>Status</th></tr></thead>
            <tbody>
              {[
                { name:'Bronze', refs:3, reward:'10% Discount Code', claimed:892, active:true },
                { name:'Silver', refs:10, reward:'Free Shipping for Life', claimed:341, active:true },
                { name:'Gold', refs:25, reward:'Exclusive Product Bundle', claimed:87, active:true },
                { name:'Platinum', refs:50, reward:'$50 Store Credit + VIP Access', claimed:23, active:true },
                { name:'Diamond', refs:100, reward:'Free Annual Subscription', claimed:5, active:false },
              ].map(m=>(
                <tr key={m.name}>
                  <td style={S.td}><span style={S.badge(m.name==='Bronze'?'#cd7f32':m.name==='Silver'?'#c0c0c0':m.name==='Gold'?'#ffd700':m.name==='Platinum'?'#a855f7':'#3b82f6')}>{m.name}</span></td>
                  <td style={S.td}>{m.refs} referrals</td>
                  <td style={S.td}>{m.reward}</td>
                  <td style={S.td}>{m.claimed}</td>
                  <td style={S.td}><span style={S.badge(m.active?'#22c55e':'#71717a')}>{m.active?'Active':'Draft'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button style={{ ...S.btnPrimary, marginTop:'12px' }}>+ Add Milestone</button>
        </div>
        <div style={S.grid2}>
          <div style={S.card}>
            <h4 style={S.h2}>Referral Widget Settings</h4>
            <div style={S.fg}><label style={S.label}>Referral Link Format</label><select style={S.select}><option>yourstore.com/ref/CODE</option><option>Custom domain</option><option>Short link (aura.link/CODE)</option></select></div>
            <div style={S.fg}><label style={S.label}>Widget Placement</label><select style={S.select}><option>Post-purchase confirmation page</option><option>Email footer</option><option>Dedicated referral page</option><option>All of the above</option></select></div>
            <div style={S.fg}><label style={S.label}>Sharing Channels</label>
              {['Email','Facebook','Twitter/X','WhatsApp','Copy Link','QR Code'].map(ch=>(
                <div key={ch} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                  <input type="checkbox" defaultChecked style={{ accentColor:'#22c55e' }} />
                  <span style={{ color:'#fafafa', fontSize:'13px' }}>{ch}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={S.card}>
            <h4 style={S.h2}>Top Referrers Leaderboard</h4>
            {[
              { name:'Sarah M.', refs:47, revenue:'$2,340' },
              { name:'James K.', refs:38, revenue:'$1,890' },
              { name:'Emily R.', refs:31, revenue:'$1,550' },
              { name:'David L.', refs:28, revenue:'$1,400' },
              { name:'Maria S.', refs:24, revenue:'$1,200' },
            ].map((r,i)=>(
              <div key={r.name} style={{ ...S.elevated, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                <div style={S.row}>
                  <span style={{ color:i===0?'#ffd700':i===1?'#c0c0c0':i===2?'#cd7f32':'#71717a', fontWeight:700, fontSize:'16px', width:'24px' }}>#{i+1}</span>
                  <span style={{ color:'#fafafa', fontSize:'13px' }}>{r.name}</span>
                </div>
                <div style={S.row}>
                  <span style={S.badge('#3b82f6')}>{r.refs} refs</span>
                  <span style={S.badge('#22c55e')}>{r.revenue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <h4 style={S.h2}>Referral Email Automations</h4>
          <div style={S.grid3}>
            {[
              { name:'Referral Invite', desc:'Sent when subscriber shares referral link', status:'Active', sent:4210 },
              { name:'Milestone Unlocked', desc:'Congratulate on reaching a reward tier', status:'Active', sent:1340 },
              { name:'Referral Converted', desc:'Notify referrer when friend subscribes', status:'Active', sent:3671 },
              { name:'Reward Reminder', desc:'Remind unclaimed rewards after 7 days', status:'Active', sent:456 },
              { name:'Leaderboard Update', desc:'Weekly top referrer standings', status:'Draft', sent:0 },
              { name:'Double Referral Event', desc:'Limited-time 2x referral credit promo', status:'Draft', sent:0 },
            ].map(a=>(
              <div key={a.name} style={S.elevated}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                  <span style={{ color:'#fafafa', fontWeight:600, fontSize:'13px' }}>{a.name}</span>
                  <span style={S.badge(a.status==='Active'?'#22c55e':'#71717a')}>{a.status}</span>
                </div>
                <div style={{ color:'#a1a1aa', fontSize:'12px', marginBottom:'6px' }}>{a.desc}</div>
                <div style={{ color:'#71717a', fontSize:'11px' }}>{a.sent.toLocaleString()} sent</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── AI ORCHESTRATION ─────────────────────────────────────────────────────────
function AIMgmt({ tab }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [contentPrompt, setContentPrompt] = useState('');
  const [contentResult, setContentResult] = useState('');
  const [subjectInput, setSubjectInput] = useState('');
  const [subjectResult, setSubjectResult] = useState(null);
  const [spamText, setSpamText] = useState('');
  const [spamResult, setSpamResult] = useState(null);
  const [sendTimeResult, setSendTimeResult] = useState(null);
  const [recs, setRecs] = useState([]);

  async function generateContent() {
    setContentResult(''); setMsg('');
    try {
      const d = await apiFetch('/ai/content/generate', { method:'POST', body: JSON.stringify({ prompt: contentPrompt, type:'email' }) });
      setContentResult(d.content || d.generated || JSON.stringify(d));
    } catch(e) { setMsg(e.message); }
  }

  async function analyzeSubject() {
    setSubjectResult(null); setMsg('');
    try {
      const d = await apiFetch('/ai/subject-lines/analyze', { method:'POST', body: JSON.stringify({ subjectLine: subjectInput }) });
      setSubjectResult(d);
    } catch(e) { setMsg(e.message); }
  }

  async function checkSpam() {
    setSpamResult(null); setMsg('');
    try {
      const d = await apiFetch('/ai/spam-score', { method:'POST', body: JSON.stringify({ content: spamText }) });
      setSpamResult(d);
    } catch(e) { setMsg(e.message); }
  }

  async function getSendTime() {
    setSendTimeResult(null); setMsg('');
    try {
      const d = await apiFetch('/optimization/send-time/recommend', { method:'POST', body: JSON.stringify({ audienceId:'all' }) });
      setSendTimeResult(d);
    } catch(e) { setMsg(e.message); }
  }

  useEffect(() => {
    if (tab === 'recommendations') {
      apiFetch('/ai/usage/stats').then(d => setRecs(d.recommendations || [])).catch(()=>{});
    }
  }, [tab]);

  if (tab === 'smart-send') return (
    <div>
      <div style={S.title}>Smart Send Time</div>
      <p style={S.muted}>AI predicts the best time for each subscriber.</p>
      <Msg text={msg} type="error" />
      <div style={{ ...S.grid4, marginTop:'16px' }}>
        <StatCard label="Predicted Open Lift" value="+12%" color="#22c55e" />
        <StatCard label="Optimal Window" value="2–4 PM" />
        <StatCard label="Timezone" value="EST" />
        <StatCard label="Confidence" value="94%" color="#22c55e" />
      </div>
      <button style={{ ...S.btnPrimary, marginTop:'16px' }} onClick={getSendTime}>Get AI Recommendation</button>
      {sendTimeResult && (
        <div style={{ ...S.card, marginTop:'16px' }}>
          <pre style={{ color:'#a1a1aa', fontSize:'13px', whiteSpace:'pre-wrap' }}>{JSON.stringify(sendTimeResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );

  if (tab === 'content-gen') return (
    <div>
      <div style={S.title}>AI Content Generation</div>
      <Msg text={msg} type="error" />
      <div style={{ ...S.fg, marginTop:'16px' }}>
        <label style={S.label}>Describe your email</label>
        <textarea style={{ ...S.textarea, minHeight:'90px' }} value={contentPrompt} onChange={e=>setContentPrompt(e.target.value)} placeholder="E.g., Welcome email for a Shopify store with a 10% discount..." />
      </div>
      <div style={S.row}>
        <button style={S.btnPrimary} onClick={generateContent}>Generate</button>
        <button style={S.btnSm} onClick={() => apiFetch('/ai/content/rewrite',{method:'POST',body:JSON.stringify({content:contentPrompt})}).then(d=>setContentResult(d.content||JSON.stringify(d))).catch(e=>setMsg(e.message))}>Rewrite</button>
        <button style={S.btnSm} onClick={() => checkSpam()}>Spam Check</button>
      </div>
      {contentResult && <div style={{ ...S.card, marginTop:'12px' }}><pre style={{ color:'#a1a1aa', fontSize:'13px', whiteSpace:'pre-wrap' }}>{contentResult}</pre></div>}
      <div style={{ ...S.fg, marginTop:'20px' }}>
        <label style={S.label}>Spam Check Content</label>
        <textarea style={{ ...S.textarea, minHeight:'70px' }} value={spamText} onChange={e=>setSpamText(e.target.value)} placeholder="Paste email content..." />
      </div>
      {spamResult && <div style={S.card}><div style={S.h2}>Spam Score</div><pre style={{ color:'#a1a1aa', fontSize:'13px' }}>{JSON.stringify(spamResult,null,2)}</pre></div>}
    </div>
  );

  if (tab === 'subject-opt') return (
    <div>
      <div style={S.title}>Subject Line Optimizer</div>
      <Msg text={msg} type="error" />
      <div style={{ ...S.fg, marginTop:'16px' }}>
        <label style={S.label}>Subject Line</label>
        <input style={S.input} value={subjectInput} onChange={e=>setSubjectInput(e.target.value)} placeholder="Your subject line..." />
      </div>
      <div style={S.row}>
        <button style={S.btnPrimary} onClick={analyzeSubject}>Analyze</button>
        <button style={S.btnSm} onClick={() => apiFetch('/ai/subject-lines/generate',{method:'POST',body:JSON.stringify({topic:subjectInput})}).then(d=>setSubjectResult(d)).catch(e=>setMsg(e.message))}>Generate Variants</button>
      </div>
      {subjectResult && <div style={{ ...S.card, marginTop:'12px' }}><pre style={{ color:'#a1a1aa', fontSize:'13px', whiteSpace:'pre-wrap' }}>{JSON.stringify(subjectResult,null,2)}</pre></div>}
    </div>
  );

  if (tab === 'predictive') return (
    <div>
      <div style={S.title}>Predictive Analytics</div>
      <p style={S.muted}>Predict engagement, churn, and conversion probability per subscriber.</p>
      <div style={{ ...S.grid4, marginTop:'16px' }}>
        <StatCard label="Avg Churn Risk" value="12%" color="#f59e0b" />
        <StatCard label="Predicted Opens" value="41%" color="#22c55e" />
        <StatCard label="Conversion Prob." value="3.8%" color="#22c55e" />
        <StatCard label="LTV Prediction" value="$312" />
      </div>
      <div style={{ ...S.card, marginTop:'16px' }}>
        <div style={S.h2}>Top At-Risk Segments</div>
        {[
          { name:'Inactive 60d', risk:'High', count:4521 },
          { name:'Single-Purchase', risk:'Medium', count:8903 },
          { name:'Unengaged New', risk:'Medium', count:2341 },
        ].map(r => (
          <div key={r.name} style={{ ...S.elevated, ...S.row, justifyContent:'space-between', marginBottom:'8px' }}>
            <div style={{ color:'#fafafa' }}>{r.name} · <span style={S.muted}>{r.count.toLocaleString()} contacts</span></div>
            <span style={S.badge(r.risk==='High'?'#ef4444':'#f59e0b')}>{r.risk}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (tab === 'auto-optimize') return (
    <div>
      <div style={S.title}>Auto-Optimization</div>
      <p style={S.muted}>Self-tuning campaigns that continuously improve performance.</p>
      <div style={{ ...S.grid3, marginTop:'16px' }}>
        {[
          { name:'Subject Line Rotation', status:'active', lift:'+8% opens' },
          { name:'Send Time Personalization', status:'active', lift:'+5% opens' },
          { name:'Content Variant Selection', status:'paused', lift:'+3% clicks' },
        ].map(o => (
          <div key={o.name} style={S.card}>
            <div style={{ fontWeight:600, color:'#fafafa', marginBottom:'6px' }}>{o.name}</div>
            <div style={{ ...S.muted, marginBottom:'8px' }}>Lift: {o.lift}</div>
            <span style={S.badge(o.status==='active'?'#22c55e':'#f59e0b')}>{o.status}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (tab === 'recommendations') return (
    <div>
      <div style={S.title}>AI Recommendations</div>
      <p style={S.muted}>Actionable insights generated by the AI engine.</p>
      <div style={{ marginTop:'16px' }}>
        {[
          { type:'Send Time', text:'Shift sends to 2–4 PM local time. Predicted +12% open rate.', impact:'+12%' },
          { type:'Subject Lines', text:'Add personalization tokens. Similar campaigns saw +8% opens.', impact:'+8%' },
          { type:'Frequency', text:'Reduce to 2x/week for inactive segment. Expected -15% unsubscribes.', impact:'-15% unsubs' },
          { type:'Segmentation', text:'Split VIP segment by purchase recency for higher relevance.', impact:'+6% CTR' },
        ].map(r => (
          <div key={r.type} style={{ ...S.card, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <span style={{ ...S.badge('#a1a1aa'), marginBottom:'8px', display:'block' }}>{r.type}</span>
              <div style={{ color:'#fafafa', fontSize:'14px' }}>{r.text}</div>
            </div>
            <span style={{ ...S.badge('#22c55e'), whiteSpace:'nowrap', marginLeft:'12px' }}>{r.impact}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ── AI Flow Generator ──
  if (tab === 'flow-gen') {
    const [prompt, setPrompt] = useState('');
    const [genResult, setGenResult] = useState(null);
    const [generating, setGenerating] = useState(false);
    const examples = [
      'Welcome new subscribers with 3 emails over 7 days, include a 10% discount in email 2',
      'Win back customers who haven\'t purchased in 90 days with escalating urgency',
      'Post-purchase follow-up: thank you → review request → cross-sell recommendations',
      'Cart abandonment with SMS fallback if email not opened after 4 hours',
    ];
    async function generateFlow() {
      if (!prompt.trim()) return;
      setGenerating(true);
      try {
        const d = await apiFetch('/ai/content/generate', { method:'POST', body:JSON.stringify({ prompt:`Generate an email automation flow: ${prompt}`, type:'flow' }) });
        setGenResult(d);
      } catch(e) { setGenResult({ error: e.message }); }
      setGenerating(false);
    }
    return (
      <div>
        <div style={S.title}>AI Flow Generator</div>
        <p style={S.muted}>Describe your automation goal in plain English and AI will generate the complete flow.</p>
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.fg}>
            <label style={S.label}>Describe your flow</label>
            <textarea style={{ ...S.textarea, minHeight:'80px' }} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="E.g., Create a 5-email welcome series for new Shopify customers..." />
          </div>
          <button style={S.btnPrimary} onClick={generateFlow} disabled={generating}>{generating ? '🤖 Generating…' : '✨ Generate Flow with AI'}</button>
        </div>
        {/* Example prompts */}
        <div style={{ marginTop:'16px' }}>
          <div style={{ fontSize:'13px', color:'#71717a', marginBottom:'8px' }}>EXAMPLE PROMPTS — click to use:</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            {examples.map(ex=>(
              <div key={ex} onClick={()=>setPrompt(ex)} style={{ ...S.elevated, cursor:'pointer', color:'#a1a1aa', fontSize:'13px' }}>💡 {ex}</div>
            ))}
          </div>
        </div>
        {/* Generated result */}
        {genResult && (
          <div style={{ ...S.card, marginTop:'16px' }}>
            <div style={S.h2}>{genResult.error ? '❌ Error' : '✅ Generated Flow'}</div>
            {genResult.error ? (
              <div style={{ color:'#ef4444', fontSize:'14px' }}>{genResult.error}</div>
            ) : (
              <>
                <pre style={{ color:'#a1a1aa', fontSize:'13px', whiteSpace:'pre-wrap', marginBottom:'12px' }}>{JSON.stringify(genResult.content||genResult, null, 2)}</pre>
                <div style={S.row}>
                  <button style={S.btnPrimary} onClick={()=>apiFetch('/workflows',{method:'POST',body:JSON.stringify({name:'AI Generated Flow',steps:genResult.steps||[]})}).then(()=>setMsg('Flow saved!')).catch(e=>setMsg(e.message))}>Save as Workflow</button>
                  <button style={S.btnSm} onClick={()=>{setGenResult(null);setPrompt('');}}>Clear</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Send Time Optimizer (per-contact) ──
  if (tab === 'send-time') {
    const [optimizing, setOptimizing] = useState(false);
    const [result, setResult] = useState(null);
    async function runOptimization() {
      setOptimizing(true);
      try { const d = await apiFetch('/send-time-optimization'); setResult(d); }
      catch(e) { setResult({ error:e.message }); }
      setOptimizing(false);
    }
    const sampleData = [
      { segment:'VIP Customers', bestTime:'2:00 PM', bestDay:'Tuesday', confidence:'94%' },
      { segment:'New Subscribers', bestTime:'10:00 AM', bestDay:'Monday', confidence:'87%' },
      { segment:'Inactive 30d', bestTime:'6:00 PM', bestDay:'Thursday', confidence:'72%' },
      { segment:'Weekend Shoppers', bestTime:'11:00 AM', bestDay:'Saturday', confidence:'89%' },
    ];
    return (
      <div>
        <div style={S.title}>Send Time Optimizer</div>
        <p style={S.muted}>AI analyzes each contact's engagement history to predict their optimal send time and day.</p>
        <div style={{ ...S.grid4, marginTop:'16px', marginBottom:'16px' }}>
          <StatCard label="Avg Optimal Hour" value="2 PM" color="#3b82f6" />
          <StatCard label="Best Day" value="Tuesday" color="#22c55e" />
          <StatCard label="Predicted Lift" value="+18%" color="#8b5cf6" />
          <StatCard label="Contacts Analyzed" value="12,450" />
        </div>
        <button style={S.btnPrimary} onClick={runOptimization} disabled={optimizing}>{optimizing ? 'Analyzing…' : '🕐 Run Send Time Analysis'}</button>
        {result && !result.error && <div style={{ ...S.card, marginTop:'12px' }}><pre style={{ color:'#a1a1aa', fontSize:'13px', whiteSpace:'pre-wrap' }}>{JSON.stringify(result, null, 2)}</pre></div>}
        {result?.error && <Msg text={result.error} type="error" />}
        {/* Per-segment recommendations */}
        <div style={{ marginTop:'20px' }}>
          <div style={S.h2}>Per-Segment Recommendations</div>
          <table style={S.table}>
            <thead><tr>{['Segment','Best Time','Best Day','Confidence'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {sampleData.map(s=>(
                <tr key={s.segment}>
                  <td style={S.td}>{s.segment}</td>
                  <td style={S.td}><span style={S.badge('#3b82f6')}>{s.bestTime}</span></td>
                  <td style={S.td}>{s.bestDay}</td>
                  <td style={S.td}><span style={S.badge(parseInt(s.confidence)>85?'#22c55e':'#f59e0b')}>{s.confidence}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Heatmap */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Engagement Heatmap (Hour × Day)</div>
          <div style={{ display:'grid', gridTemplateColumns:'auto repeat(7,1fr)', gap:'2px', fontSize:'11px' }}>
            <div></div>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><div key={d} style={{ textAlign:'center', color:'#71717a', padding:'4px' }}>{d}</div>)}
            {['6AM','9AM','12PM','3PM','6PM','9PM'].map(h=>(
              <React.Fragment key={h}>
                <div style={{ color:'#71717a', padding:'4px' }}>{h}</div>
                {[0.2,0.7,0.5,0.4,0.3,0.6,0.4].map((v,i)=>(
                  <div key={i} style={{ background:`rgba(34,197,94,${v})`, borderRadius:'3px', padding:'6px', textAlign:'center', color:'#fafafa', fontSize:'10px' }}>{Math.round(v*100)}%</div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── AI Product Recommendations ──
  if (tab === 'product-recs') {
    const STRATEGIES = [
      { name:'Frequently Bought Together', desc:'Cross-sell products commonly purchased together', impact:'+14% AOV', status:'active', icon:'🛒' },
      { name:'Personalized For You', desc:'ML-based picks from browsing & purchase history', impact:'+22% CTR', status:'active', icon:'🎯' },
      { name:'Trending Now', desc:'Bestsellers by category updated in real-time', impact:'+11% clicks', status:'active', icon:'🔥' },
      { name:'Recently Viewed', desc:'Remind customers of products they browsed', impact:'+9% return visits', status:'active', icon:'👁️' },
      { name:'Post-Purchase Upsell', desc:'Complementary items after order confirmation', impact:'+18% repeat purchase', status:'active', icon:'📦' },
      { name:'Back in Stock Picks', desc:'Recommend alternatives when items are restocked', impact:'+7% conversions', status:'draft', icon:'🔔' },
    ];
    return (
      <div>
        <div style={S.title}>AI Product Recommendations</div>
        <p style={S.muted}>Machine-learning powered product blocks for emails — dynamically personalized per recipient.</p>
        <div style={{ ...S.grid4, marginTop:'16px', marginBottom:'16px' }}>
          <StatCard label="Active Strategies" value={STRATEGIES.filter(s=>s.status==='active').length} color="#22c55e" />
          <StatCard label="Products Recommended" value="24,800" color="#3b82f6" />
          <StatCard label="Click-Through Rate" value="18.4%" color="#8b5cf6" />
          <StatCard label="Revenue Attributed" value="$42,300" color="#f59e0b" />
        </div>
        <div style={S.grid3}>
          {STRATEGIES.map(s=>(
            <div key={s.name} style={S.card}>
              <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'8px' }}>
                <span style={{ fontSize:'20px' }}>{s.icon}</span>
                <span style={S.badge(s.status==='active'?'#22c55e':'#71717a')}>{s.status}</span>
              </div>
              <div style={{ fontWeight:600, color:'#fafafa', marginBottom:'4px' }}>{s.name}</div>
              <div style={{ ...S.muted, marginBottom:'8px' }}>{s.desc}</div>
              <span style={S.badge('#8b5cf6')}>{s.impact}</span>
              <div style={{ ...S.row, marginTop:'10px' }}>
                <button style={S.btnSm}>Configure</button>
                <button style={S.btnGhost}>Preview</button>
              </div>
            </div>
          ))}
        </div>
        {/* Email block preview */}
        <div style={{ ...S.card, marginTop:'20px' }}>
          <div style={S.h2}>Product Block Preview</div>
          <div style={{ background:'#09090b', borderRadius:'8px', padding:'16px' }}>
            <div style={{ color:'#71717a', fontSize:'12px', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Recommended For You</div>
            <div style={S.grid4}>
              {['Wireless Headphones','Running Shoes','Smart Watch','Laptop Stand'].map(p=>(
                <div key={p} style={{ ...S.elevated, textAlign:'center', padding:'12px' }}>
                  <div style={{ fontSize:'24px', marginBottom:'6px' }}>📦</div>
                  <div style={{ color:'#fafafa', fontSize:'13px', fontWeight:500 }}>{p}</div>
                  <div style={{ color:'#22c55e', fontSize:'12px', marginTop:'4px' }}>$49.99</div>
                  <button style={{ ...S.btnPrimary, marginTop:'6px', padding:'4px 10px', fontSize:'11px' }}>Shop Now</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── AI Segments Builder ──────────────────────────────────────────── */
  if (tab === 'ai-segments') {
    const [nlQuery, setNlQuery] = useState('');
    const [aiResult, setAiResult] = useState(null);
    const exampleQueries = [
      'Customers who bought more than 3 times but haven\'t ordered in 60 days',
      'VIP customers in New York with lifetime value over $500',
      'Subscribers who opened last 3 emails but never purchased',
      'Cart abandoners from the past week who viewed products over $100',
      'New customers from Instagram ads who made their first purchase this month',
    ];
    return (
      <div>
        <div style={S.h1}>AI Segments Builder</div>
        <p style={S.muted}>Describe your target audience in plain English. AI builds the segment rules automatically.</p>
        <div style={S.card}>
          <div style={S.h2}>Natural Language → Segment</div>
          <textarea
            style={{ ...S.textarea, minHeight:'80px' }}
            placeholder="Describe your audience... e.g. 'Customers who spent over $200 in the last 90 days and are located in California'"
            value={nlQuery}
            onChange={e=>setNlQuery(e.target.value)}
          />
          <div style={{ ...S.row, marginTop:'10px' }}>
            <button
              style={S.btnPrimary}
              onClick={()=>setAiResult({ name:'AI-Generated Segment', rules:[
                { field:'total_spent', op:'greater_than', value:'$200' },
                { field:'last_order_date', op:'within', value:'90 days' },
                { field:'state', op:'equals', value:'California' }
              ], estimatedSize:1284 })}
            >✨ Generate Segment</button>
            <button style={S.btnSm} onClick={()=>setNlQuery('')}>Clear</button>
          </div>
          {/* Example queries */}
          <div style={{ marginTop:'16px' }}>
            <div style={{ color:'#71717a', fontSize:'12px', marginBottom:'8px' }}>TRY AN EXAMPLE:</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
              {exampleQueries.map((q,i)=>(
                <button key={i} onClick={()=>setNlQuery(q)} style={{ ...S.btnSm, fontSize:'11px', background:'#18181b', color:'#a1a1aa', border:'1px solid #27272a', textAlign:'left' }}>"{q.slice(0,60)}…"</button>
              ))}
            </div>
          </div>
        </div>

        {aiResult && (
          <div style={{ ...S.card, marginTop:'16px', border:'1px solid #8b5cf644' }}>
            <div style={{ ...S.row, justifyContent:'space-between' }}>
              <div style={S.h2}>Generated Segment: {aiResult.name}</div>
              <span style={S.badge('purple')}>AI-Generated</span>
            </div>
            <div style={{ marginTop:'12px' }}>
              <div style={{ color:'#71717a', fontSize:'12px', marginBottom:'8px' }}>SEGMENT RULES:</div>
              {aiResult.rules.map((r,i)=>(
                <div key={i} style={{ ...S.elevated, marginBottom:'6px', display:'flex', alignItems:'center', gap:'8px' }}>
                  {i>0 && <span style={{ color:'#8b5cf6', fontWeight:600, fontSize:'12px' }}>AND</span>}
                  <code style={{ color:'#3b82f6', fontSize:'12px' }}>{r.field}</code>
                  <span style={{ color:'#f59e0b', fontSize:'12px' }}>{r.op}</span>
                  <span style={{ color:'#22c55e', fontSize:'12px', fontWeight:600 }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div style={{ ...S.row, marginTop:'16px', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ color:'#a1a1aa', fontSize:'13px' }}>Estimated audience: <span style={{ color:'#fafafa', fontWeight:700 }}>{aiResult.estimatedSize.toLocaleString()}</span> contacts</div>
              <div style={S.row}>
                <button style={S.btnPrimary}>💾 Save Segment</button>
                <button style={S.btnSm}>Edit Rules</button>
              </div>
            </div>
          </div>
        )}

        {/* Recent AI segments */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Recent AI Segments</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Segment</th><th style={S.th}>Query</th><th style={S.th}>Size</th><th style={S.th}>Created</th></tr></thead>
            <tbody>
              {[
                { name:'High-Value Lapsed', query:'Customers with LTV > $300 who haven\'t purchased in 90 days', size:892, date:'2h ago' },
                { name:'Engaged Non-Buyers', query:'Opened 5+ emails but zero purchases', size:2340, date:'1d ago' },
                { name:'Instagram Converters', query:'Came from Instagram and purchased within 7 days', size:456, date:'3d ago' },
              ].map((s,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #27272a' }}>
                  <td style={S.td}><span style={{ fontWeight:600, color:'#fafafa' }}>{s.name}</span></td>
                  <td style={{ ...S.td, maxWidth:'300px', overflow:'hidden', textOverflow:'ellipsis' }}><span style={{ color:'#a1a1aa', fontSize:'12px' }}>{s.query}</span></td>
                  <td style={S.td}>{s.size.toLocaleString()}</td>
                  <td style={S.td}><span style={{ color:'#71717a' }}>{s.date}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* ── AI Campaign Builder ──────────────────────────────────────────── */
  if (tab === 'ai-campaign') {
    const [prompt, setPrompt] = useState('');
    const [generated, setGenerated] = useState(null);
    return (
      <div>
        <div style={S.h1}>AI Campaign Builder</div>
        <p style={S.muted}>Describe your campaign goal in one sentence. AI generates the complete campaign — content, subject line, audience, and schedule.</p>
        <div style={S.card}>
          <div style={S.h2}>One-Prompt Campaign Creation</div>
          <textarea
            style={{ ...S.textarea, minHeight:'80px' }}
            placeholder="e.g. 'Send a flash sale email to customers who haven't bought in 30 days, offer 20% off with urgency'"
            value={prompt}
            onChange={e=>setPrompt(e.target.value)}
          />
          <div style={{ ...S.row, marginTop:'10px' }}>
            <button
              style={S.btnPrimary}
              onClick={()=>setGenerated({
                name:'Flash Sale: Win-Back Campaign',
                subject:'⚡ 20% Off — Just For You (Ends Tonight!)',
                preheader:'We miss you! Here\'s an exclusive deal to welcome you back.',
                audience:'Customers with no purchase in 30+ days (est. 1,450)',
                sendTime:'Tomorrow at 10:00 AM (optimized by AI)',
                content:['Hero banner with countdown timer','Personalized product grid (4 items)','20% discount code block','Urgency CTA: "Shop Now Before Midnight"','Social proof: "2,300+ happy customers this week"'],
              })}
            >🚀 Generate Campaign</button>
          </div>
          <div style={{ marginTop:'14px' }}>
            <div style={{ color:'#71717a', fontSize:'12px', marginBottom:'6px' }}>QUICK PROMPTS:</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
              {[
                'Welcome new subscribers with a 10% discount',
                'Re-engage customers who abandoned their cart yesterday',
                'Promote new summer collection to VIP customers',
                'Thank first-time buyers and upsell accessories',
                'Birthday celebration email with free shipping',
              ].map((q,i)=>(
                <button key={i} onClick={()=>setPrompt(q)} style={{ ...S.btnSm, fontSize:'11px', background:'#18181b', color:'#a1a1aa' }}>{q}</button>
              ))}
            </div>
          </div>
        </div>

        {generated && (
          <div style={{ ...S.card, marginTop:'16px', border:'1px solid #22c55e44' }}>
            <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'12px' }}>
              <div style={S.h2}>Generated Campaign</div>
              <span style={S.badge('green')}>Ready to Review</span>
            </div>
            <div style={S.grid2}>
              <div style={S.elevated}>
                <div style={{ color:'#71717a', fontSize:'11px', textTransform:'uppercase' }}>Campaign Name</div>
                <div style={{ color:'#fafafa', fontWeight:600, marginTop:'4px' }}>{generated.name}</div>
              </div>
              <div style={S.elevated}>
                <div style={{ color:'#71717a', fontSize:'11px', textTransform:'uppercase' }}>Subject Line</div>
                <div style={{ color:'#fafafa', fontWeight:600, marginTop:'4px' }}>{generated.subject}</div>
              </div>
              <div style={S.elevated}>
                <div style={{ color:'#71717a', fontSize:'11px', textTransform:'uppercase' }}>Audience</div>
                <div style={{ color:'#3b82f6', fontWeight:500, marginTop:'4px' }}>{generated.audience}</div>
              </div>
              <div style={S.elevated}>
                <div style={{ color:'#71717a', fontSize:'11px', textTransform:'uppercase' }}>Send Time</div>
                <div style={{ color:'#22c55e', fontWeight:500, marginTop:'4px' }}>{generated.sendTime}</div>
              </div>
            </div>
            <div style={{ ...S.elevated, marginTop:'12px' }}>
              <div style={{ color:'#71717a', fontSize:'11px', textTransform:'uppercase', marginBottom:'6px' }}>Preheader</div>
              <div style={{ color:'#a1a1aa', fontSize:'13px', fontStyle:'italic' }}>{generated.preheader}</div>
            </div>
            <div style={{ ...S.elevated, marginTop:'12px' }}>
              <div style={{ color:'#71717a', fontSize:'11px', textTransform:'uppercase', marginBottom:'8px' }}>Email Content Blocks</div>
              {generated.content.map((c,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                  <span style={{ color:'#8b5cf6', fontSize:'12px', fontWeight:700, minWidth:'18px' }}>{i+1}.</span>
                  <span style={{ color:'#fafafa', fontSize:'13px' }}>{c}</span>
                </div>
              ))}
            </div>
            <div style={{ ...S.row, marginTop:'16px', justifyContent:'flex-end' }}>
              <button style={S.btnSm}>✏️ Edit</button>
              <button style={S.btnSm}>👁️ Preview</button>
              <button style={S.btnPrimary}>📤 Schedule & Send</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── AI Image Generator / Remix ───────────────────────────────────── */
  if (tab === 'ai-images') {
    return (
      <div>
        <div style={S.h1}>AI Image Generator & Remix</div>
        <p style={S.muted}>Create and edit product images, banners, and email visuals with AI prompts — no design tools required.</p>
        <div style={S.grid4}>
          <StatCard label="Images Generated" value="482" sub="This month" color="#8b5cf6" />
          <StatCard label="Avg Generation Time" value="8s" sub="Per image" color="#22c55e" />
          <StatCard label="Templates Used" value="24" sub="AI-enhanced templates" color="#3b82f6" />
          <StatCard label="CTR Improvement" value="+34%" sub="AI images vs stock" color="#f59e0b" />
        </div>
        {/* Image generation tools */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Generate New Image</div>
          <p style={{ color:'#a1a1aa', fontSize:'13px', marginBottom:'12px' }}>Describe what you want and AI will create it. Use for product shots, banners, lifestyle imagery, and more.</p>
          <div style={{ display:'flex', gap:'12px', flexDirection:'column' }}>
            <textarea style={{ ...S.textarea, minHeight:'80px' }} placeholder='e.g. "A flat-lay of organic skincare products on a marble surface with soft morning light and eucalyptus leaves"' />
            <div style={{ display:'flex', gap:'8px' }}>
              <select style={S.select}>
                <option>1024 × 1024 (Square)</option>
                <option>1200 × 628 (Email Banner)</option>
                <option>600 × 600 (Product)</option>
                <option>1200 × 400 (Header)</option>
              </select>
              <select style={S.select}>
                <option>Photorealistic</option>
                <option>Illustration</option>
                <option>Minimal / Clean</option>
                <option>Lifestyle</option>
                <option>Flat Design</option>
              </select>
              <button style={S.btnPrimary}>🎨 Generate Image</button>
            </div>
          </div>
        </div>
        {/* Remix / Edit existing */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Image Remix</div>
          <p style={{ color:'#a1a1aa', fontSize:'13px', marginBottom:'12px' }}>Upload an existing image and describe changes — AI will remix it while keeping your brand style.</p>
          <div style={S.grid3}>
            {[
              { action:'Change Background', desc:'Swap product backgrounds to match seasonal campaigns', icon:'🖼️', example:'"Change to a winter holiday scene"' },
              { action:'Color Adjustment', desc:'Modify colors to match your brand palette or campaign theme', icon:'🎨', example:'"Make the background blush pink"' },
              { action:'Add Text Overlay', desc:'Add promotional text, badges, or sale tags to product images', icon:'✍️', example:'"Add a 20% OFF badge in the corner"' },
              { action:'Remove Objects', desc:'Clean up images by removing unwanted elements', icon:'✂️', example:'"Remove the shadow and background items"' },
              { action:'Style Transfer', desc:'Apply artistic styles while keeping product recognizable', icon:'🖌️', example:'"Make it look like a watercolor painting"' },
              { action:'Resize & Crop', desc:'AI-smart resize that keeps subject centered and composed', icon:'📐', example:'"Crop to email banner, keep product centered"' },
            ].map(r=>(
              <div key={r.action} style={S.elevated}>
                <div style={{ fontSize:'20px', marginBottom:'6px' }}>{r.icon}</div>
                <div style={{ color:'#fafafa', fontWeight:600, fontSize:'13px' }}>{r.action}</div>
                <div style={{ color:'#a1a1aa', fontSize:'11px', marginTop:'4px' }}>{r.desc}</div>
                <div style={{ color:'#71717a', fontSize:'10px', marginTop:'6px', fontStyle:'italic' }}>{r.example}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Recent generated images */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Recently Generated Images</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Prompt</th><th style={S.th}>Style</th><th style={S.th}>Size</th><th style={S.th}>Created</th><th style={S.th}>Used In</th></tr></thead>
            <tbody>
              {[
                { prompt:'Summer collection flat-lay with tropical leaves', style:'Photorealistic', size:'1200×628', created:'2h ago', used:'Summer Sale Campaign' },
                { prompt:'Cozy winter sweater on wooden backdrop', style:'Lifestyle', size:'600×600', used:'Product Feature #12', created:'5h ago' },
                { prompt:'Minimalist skincare bottle on white background', style:'Minimal', size:'1024×1024', used:'Welcome Series', created:'1d ago' },
                { prompt:'Holiday gift box arrangement with ribbon', style:'Photorealistic', size:'1200×400', used:'Holiday Header', created:'2d ago' },
              ].map((img,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #27272a' }}>
                  <td style={S.td}><span style={{ color:'#fafafa' }}>{img.prompt}</span></td>
                  <td style={S.td}><span style={S.badge('blue')}>{img.style}</span></td>
                  <td style={S.td}><span style={{ color:'#71717a' }}>{img.size}</span></td>
                  <td style={S.td}>{img.created}</td>
                  <td style={S.td}><span style={{ color:'#8b5cf6' }}>{img.used}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}

// ─── WORKFLOWS ────────────────────────────────────────────────────────────────
function WorkflowsMgmt({ tab }) {
  const [workflows, setWorkflows] = useState([]);
  const [stepTypes, setStepTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  async function aiGenWorkflow(prompt) {
    setAiLoading(true); setAiResult(null);
    try {
      const d = await apiFetch('/ai/content/generate', { method:'POST', body: JSON.stringify({ type:'workflow', prompt, tone:'professional' }) });
      setAiResult(d.content || d.text || d.workflow || JSON.stringify(d));
    } catch(e) { setAiResult('Error: ' + e.message); }
    setAiLoading(false);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'builder' || tab === 'monitoring' || tab === 'history') {
        const d = await apiFetch('/workflows'); setWorkflows(d.workflows || d || []);
      } else if (tab === 'triggers') {
        const d = await apiFetch('/steps/types'); setStepTypes(d.types || d || []);
      }
    } catch(e) { setMsg(e.message); }
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function toggleWorkflow(id, status) {
    try {
      const ep = status === 'active' ? 'deactivate' : 'activate';
      await apiFetch(`/workflows/${id}/${ep}`, { method:'POST' });
      load();
    } catch(e) { setMsg(e.message); }
  }

  async function cloneWorkflow(id) {
    try { await apiFetch(`/workflows/${id}/clone`, { method:'POST' }); load(); }
    catch(e) { setMsg(e.message); }
  }

  if (tab === 'builder') return (
    <div>
      <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'16px' }}>
        <div style={S.title}>Workflow Builder</div>
        <AIGenButton label="AI Generate Workflow" credits={3} loading={aiLoading} onClick={() => aiGenWorkflow('Create a complete e-commerce automation workflow with triggers, conditions, and actions for cart abandonment recovery')} />
      </div>
      <Msg text={msg} type="error" />
      {aiResult && <AIResultCard result={aiResult} title="AI Generated Workflow" onClose={() => setAiResult(null)} />}
      {loading ? <div style={S.muted}>Loading...</div> : (
        <table style={S.table}>
          <thead><tr>{['Name','Trigger','Status','Runs','Actions'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {(workflows.length ? workflows : []).map(w => (
              <tr key={w.id||w._id}>
                <td style={S.td}>{w.name}</td>
                <td style={S.td}>{w.trigger?.type || w.triggerType || '—'}</td>
                <td style={S.td}><span style={S.badge(w.status==='active'?'#22c55e':'#f59e0b')}>{w.status||'draft'}</span></td>
                <td style={S.td}>{(w.totalRuns||w.runs||0).toLocaleString()}</td>
                <td style={S.td}>
                  <div style={S.row}>
                    <button style={S.btnGreen} onClick={() => toggleWorkflow(w.id||w._id, w.status)}>{w.status==='active'?'Pause':'Activate'}</button>
                    <button style={S.btnSm} onClick={() => cloneWorkflow(w.id||w._id)}>Clone</button>
                  </div>
                </td>
              </tr>
            ))}
            {!workflows.length && <tr><td style={{ ...S.td, color:'#71717a' }} colSpan={5}>No workflows.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );

  if (tab === 'triggers') return (
    <div>
      <div style={S.title}>Triggers & Events</div>
      <p style={S.muted}>Available automation triggers.</p>
      <Msg text={msg} type="error" />
      <div style={{ ...S.grid3, marginTop:'16px' }}>
        {(stepTypes.length ? stepTypes : [
          { type:'order.placed', label:'Order Placed' },
          { type:'customer.signup', label:'Customer Signup' },
          { type:'cart.abandoned', label:'Cart Abandoned' },
          { type:'email.opened', label:'Email Opened' },
          { type:'email.clicked', label:'Link Clicked' },
          { type:'segment.entered', label:'Entered Segment' },
        ]).map(t => (
          <div key={t.type||t.id} style={S.card}>
            <div style={{ fontWeight:600, color:'#fafafa', marginBottom:'4px' }}>{t.label||t.name||t.type}</div>
            <div style={S.muted}>{t.type||t.description||''}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (tab === 'conditions') return (
    <div>
      <div style={S.title}>Conditional Logic</div>
      <p style={S.muted}>Add smart branching to your workflows.</p>
      <div style={{ ...S.card, marginTop:'16px' }}>
        <div style={S.h2}>Available Conditions</div>
        {['Has opened email', 'Has clicked link', 'Segment membership', 'Purchase count', 'Lifetime value', 'Days since last order', 'Custom event property'].map(c => (
          <div key={c} style={{ ...S.elevated, marginBottom:'6px', color:'#fafafa' }}>{c}</div>
        ))}
      </div>
    </div>
  );

  if (tab === 'actions') return (
    <div>
      <div style={S.title}>Actions Library</div>
      <p style={S.muted}>Actions available within automation workflows.</p>
      <div style={{ ...S.grid3, marginTop:'16px' }}>
        {['Send Email','Send SMS','Add to Segment','Remove from Segment','Add Tag','Remove Tag','Update Contact Field','Create Task','Webhook Call','Wait / Delay'].map(a => (
          <div key={a} style={S.card}><div style={{ color:'#fafafa', fontWeight:500 }}>{a}</div></div>
        ))}
      </div>
    </div>
  );

  if (tab === 'monitoring') return (
    <div>
      <div style={S.title}>Workflow Monitoring</div>
      <Msg text={msg} type="error" />
      <div style={{ ...S.grid4, marginTop:'16px', marginBottom:'16px' }}>
        <StatCard label="Active Workflows" value={workflows.filter(w=>w.status==='active').length} color="#22c55e" />
        <StatCard label="Total Runs Today" value={workflows.reduce((s,w)=>s+(w.runsToday||0),0).toLocaleString()} />
        <StatCard label="Error Rate" value="0.3%" color="#f59e0b" />
        <StatCard label="Avg Duration" value="1.2s" />
      </div>
      <table style={S.table}>
        <thead><tr>{['Workflow','Status','Runs','Last Run'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>
          {(workflows.length ? workflows : []).map(w => (
            <tr key={w.id||w._id}>
              <td style={S.td}>{w.name}</td>
              <td style={S.td}><span style={S.badge(w.status==='active'?'#22c55e':'#f59e0b')}>{w.status||'draft'}</span></td>
              <td style={S.td}>{(w.totalRuns||0).toLocaleString()}</td>
              <td style={S.td}>{w.lastRunAt ? new Date(w.lastRunAt).toLocaleDateString() : '—'}</td>
            </tr>
          ))}
          {!workflows.length && <tr><td style={{ ...S.td, color:'#71717a' }} colSpan={4}>No data.</td></tr>}
        </tbody>
      </table>
    </div>
  );

  if (tab === 'history') return (
    <div>
      <div style={S.title}>Execution History</div>
      <p style={S.muted}>Recent workflow execution runs and results.</p>
      <table style={{ ...S.table, marginTop:'16px' }}>
        <thead><tr>{['Workflow','Contact','Status','Started','Duration'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>
          {[
            { w:'Welcome Series', c:'alice@example.com', s:'completed', t:'2026-02-20 14:32', d:'0.8s' },
            { w:'Abandoned Cart', c:'bob@example.com', s:'completed', t:'2026-02-20 14:15', d:'1.2s' },
            { w:'Win-Back', c:'carol@example.com', s:'failed', t:'2026-02-20 13:55', d:'0.3s' },
          ].map((r, i) => (
            <tr key={i}>
              <td style={S.td}>{r.w}</td>
              <td style={S.td}>{r.c}</td>
              <td style={S.td}><span style={S.badge(r.s==='completed'?'#22c55e':'#ef4444')}>{r.s}</span></td>
              <td style={S.td}>{r.t}</td>
              <td style={S.td}>{r.d}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // ── Flow Templates Gallery ──
  if (tab === 'flow-templates') {
    const TEMPLATES = [
      { name:'Welcome Series', desc:'3-step onboarding for new subscribers', steps:3, icon:'👋', cat:'Onboarding' },
      { name:'Abandoned Cart', desc:'Recover lost sales with 3 timed reminders', steps:3, icon:'🛒', cat:'Revenue' },
      { name:'Post-Purchase', desc:'Order confirmation → review request → cross-sell', steps:4, icon:'📦', cat:'Revenue' },
      { name:'Win-Back', desc:'Re-engage inactive customers with escalating offers', steps:4, icon:'💌', cat:'Retention' },
      { name:'Browse Abandon', desc:'Trigger when user views products but doesn\'t buy', steps:2, icon:'👁️', cat:'Revenue' },
      { name:'Birthday / Anniversary', desc:'Automated celebration messages with coupon', steps:2, icon:'🎂', cat:'Engagement' },
      { name:'VIP Loyalty Upgrade', desc:'Reward customers who hit spend thresholds', steps:3, icon:'⭐', cat:'Retention' },
      { name:'Re-Engagement Sunset', desc:'Gradually remove unengaged contacts', steps:5, icon:'🌅', cat:'List Health' },
      { name:'Review Request', desc:'Ask for product reviews after delivery', steps:2, icon:'⭐', cat:'UGC' },
    ];
    const [filter, setFilter] = useState('All');
    const cats = ['All', ...new Set(TEMPLATES.map(t=>t.cat))];
    const filtered = filter === 'All' ? TEMPLATES : TEMPLATES.filter(t=>t.cat===filter);
    return (
      <div>
        <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'16px' }}>
          <div><div style={S.title}>Flow Templates Gallery</div><p style={S.muted}>Pre-built automation flows — click Use to clone into your workflows.</p></div>
        </div>
        <div style={{ ...S.row, marginBottom:'16px', flexWrap:'wrap' }}>
          {cats.map(c=><button key={c} onClick={()=>setFilter(c)} style={{ ...S.btnSm, background:filter===c?'#8b5cf6':'#3f3f46', color:filter===c?'#fff':'#a1a1aa' }}>{c}</button>)}
        </div>
        <div style={S.grid3}>
          {filtered.map(t=>(
            <div key={t.name} style={{ ...S.card, display:'flex', flexDirection:'column', gap:'8px' }}>
              <div style={{ fontSize:'24px' }}>{t.icon}</div>
              <div style={{ fontWeight:600, color:'#fafafa' }}>{t.name}</div>
              <div style={S.muted}>{t.desc}</div>
              <div style={S.row}><span style={S.badge('#a1a1aa')}>{t.steps} steps</span><span style={S.badge('#8b5cf6')}>{t.cat}</span></div>
              <button style={S.btnPrimary} onClick={()=>apiFetch('/workflows',{method:'POST',body:JSON.stringify({name:t.name,template:t.name,steps:t.steps})}).then(()=>setMsg(`"${t.name}" flow created!`)).catch(e=>setMsg(e.message))}>Use Template</button>
            </div>
          ))}
        </div>
        <Msg text={msg} type={msg.includes('rror')?'error':'ok'} />
      </div>
    );
  }

  // ── Visual Flow Builder (canvas) ──
  if (tab === 'visual-builder') {
    const [nodes, setNodes] = useState([
      { id:'trigger', type:'trigger', label:'Cart Abandoned', x:0, y:0 },
      { id:'wait1', type:'delay', label:'Wait 1 hour', x:0, y:1 },
      { id:'email1', type:'email', label:'Reminder Email', x:0, y:2 },
      { id:'check', type:'condition', label:'Opened?', x:0, y:3 },
      { id:'email2', type:'email', label:'Discount Email', x:-1, y:4 },
      { id:'end', type:'end', label:'End', x:1, y:4 },
    ]);
    const [selected, setSelected] = useState(null);
    const nodeColor = { trigger:'#8b5cf6', delay:'#f59e0b', email:'#3b82f6', condition:'#ec4899', sms:'#22c55e', end:'#71717a' };
    const nodeIcon  = { trigger:'⚡', delay:'⏳', email:'📧', condition:'🔀', sms:'📱', end:'🏁' };
    return (
      <div>
        <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'16px' }}>
          <div><div style={S.title}>Visual Flow Builder</div><p style={S.muted}>Drag-and-drop canvas to design automation flows visually.</p></div>
          <div style={S.row}>
            <button style={S.btnPrimary} onClick={()=>setNodes(n=>[...n,{id:`node-${Date.now()}`,type:'email',label:'New Email',x:0,y:n.length}])}>+ Add Step</button>
            <button style={S.btnSm} onClick={()=>setMsg('Flow saved!')}>💾 Save</button>
          </div>
        </div>
        <Msg text={msg} type={msg.includes('rror')?'error':'ok'} />
        {/* Node palette */}
        <div style={{ ...S.row, gap:'6px', marginBottom:'16px', flexWrap:'wrap' }}>
          {Object.entries(nodeIcon).map(([t,ic])=>(
            <button key={t} style={{ ...S.btnGhost, fontSize:'12px' }} onClick={()=>setNodes(n=>[...n,{id:`${t}-${Date.now()}`,type:t,label:t.charAt(0).toUpperCase()+t.slice(1),x:0,y:n.length}])}>{ic} {t}</button>
          ))}
        </div>
        {/* Canvas */}
        <div style={{ background:'#09090b', border:'1px solid #3f3f46', borderRadius:'10px', padding:'24px', minHeight:'400px', position:'relative', overflow:'auto' }}>
          {nodes.map((node, i) => {
            const isSelected = selected === node.id;
            return (
              <div key={node.id}>
                {/* Connector line */}
                {i > 0 && (
                  <div style={{ width:'2px', height:'20px', background:'#3f3f46', margin:'0 auto' }} />
                )}
                <div onClick={()=>setSelected(isSelected?null:node.id)} style={{
                  background: isSelected ? '#27272a' : '#18181b',
                  border: `2px solid ${isSelected ? nodeColor[node.type]||'#3f3f46' : '#3f3f46'}`,
                  borderRadius: node.type==='condition'?'12px':'8px',
                  padding:'12px 20px',
                  display:'flex', alignItems:'center', gap:'10px',
                  cursor:'pointer', maxWidth:'320px', margin:'0 auto',
                  transition:'all 0.15s',
                  boxShadow: isSelected ? `0 0 12px ${nodeColor[node.type]||'#3f3f46'}44` : 'none',
                }}>
                  <span style={{ fontSize:'18px' }}>{nodeIcon[node.type]||'⬛'}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'13px', fontWeight:600, color:'#fafafa' }}>{node.label}</div>
                    <div style={{ fontSize:'11px', color:nodeColor[node.type]||'#71717a', textTransform:'uppercase', letterSpacing:'0.05em' }}>{node.type}</div>
                  </div>
                  {isSelected && <button style={S.btnDanger} onClick={e=>{e.stopPropagation();setNodes(n=>n.filter(x=>x.id!==node.id));setSelected(null);}}>✕</button>}
                </div>
                {/* Branch labels for condition */}
                {node.type==='condition' && (
                  <div style={{ display:'flex', justifyContent:'center', gap:'40px', marginTop:'4px' }}>
                    <span style={{ fontSize:'11px', color:'#22c55e' }}>✓ Yes</span>
                    <span style={{ fontSize:'11px', color:'#ef4444' }}>✕ No</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Conditional Splits (visual branching) ──
  if (tab === 'splits') {
    const SPLIT_TYPES = [
      { name:'Email Engagement', desc:'Split by open/click behavior', icon:'📧', conditions:['Opened last email','Clicked any link','No opens in 30 days'] },
      { name:'Purchase History', desc:'Split by buying patterns', icon:'🛍️', conditions:['Has purchased','Order count > 3','AOV > $100'] },
      { name:'Segment Membership', desc:'Route by audience segment', icon:'👥', conditions:['VIP segment','New customer','At-risk churn'] },
      { name:'Profile Property', desc:'Split on contact attributes', icon:'👤', conditions:['Location = US','Language = EN','Age > 25'] },
      { name:'Random Split', desc:'A/B/n testing within flows', icon:'🎲', conditions:['50/50 split','33/33/34 split','80/20 split'] },
      { name:'Date & Time', desc:'Route by calendar or day-of-week', icon:'📅', conditions:['Weekday only','Business hours','Holiday season'] },
    ];
    const [activeSplit, setActiveSplit] = useState(null);
    return (
      <div>
        <div style={S.title}>Conditional Splits</div>
        <p style={S.muted}>Visual branching nodes to personalize flow paths based on behavior, data, or randomization.</p>
        <div style={{ ...S.grid3, marginTop:'16px' }}>
          {SPLIT_TYPES.map(s=>(
            <div key={s.name} style={{ ...S.card, cursor:'pointer', borderColor:activeSplit===s.name?'#ec4899':'#3f3f46' }} onClick={()=>setActiveSplit(activeSplit===s.name?null:s.name)}>
              <div style={{ fontSize:'20px', marginBottom:'6px' }}>{s.icon}</div>
              <div style={{ fontWeight:600, color:'#fafafa', marginBottom:'4px' }}>{s.name}</div>
              <div style={S.muted}>{s.desc}</div>
              {activeSplit===s.name && (
                <div style={{ marginTop:'10px', borderTop:'1px solid #3f3f46', paddingTop:'10px' }}>
                  <div style={{ fontSize:'12px', color:'#a1a1aa', marginBottom:'6px' }}>Branch conditions:</div>
                  {s.conditions.map(c=><div key={c} style={{ ...S.elevated, marginBottom:'4px', color:'#fafafa', fontSize:'13px' }}>🔀 {c}</div>)}
                  <button style={{ ...S.btnPrimary, marginTop:'8px', width:'100%' }}>Add to Flow</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Live Flow Metrics ──
  if (tab === 'flow-metrics') return (
    <div>
      <div style={S.title}>Live Flow Metrics</div>
      <p style={S.muted}>Real-time performance for each active workflow — inline metrics per step.</p>
      <div style={{ ...S.grid4, marginTop:'16px', marginBottom:'16px' }}>
        <StatCard label="Active Flows" value={workflows.filter(w=>w.status==='active').length} color="#22c55e" />
        <StatCard label="Contacts In-Flight" value="1,247" color="#3b82f6" />
        <StatCard label="Emails Sent Today" value="8,431" />
        <StatCard label="Flow Revenue" value="$12,850" color="#8b5cf6" />
      </div>
      {(workflows.length ? workflows.filter(w=>w.status==='active') : [
        { id:'1', name:'Welcome Series', status:'active', totalRuns:4200, openRate:62, clickRate:18, revenue:3200 },
        { id:'2', name:'Abandoned Cart', status:'active', totalRuns:1800, openRate:55, clickRate:22, revenue:8100 },
        { id:'3', name:'Post-Purchase', status:'active', totalRuns:960, openRate:48, clickRate:12, revenue:1550 },
      ]).map(w=>(
        <div key={w.id||w._id} style={{ ...S.card, marginBottom:'12px' }}>
          <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'10px' }}>
            <div style={{ fontWeight:600, color:'#fafafa', fontSize:'15px' }}>{w.name}</div>
            <span style={S.badge('#22c55e')}>Live</span>
          </div>
          <div style={S.grid4}>
            <div style={S.elevated}><div style={{ fontSize:'18px', fontWeight:700, color:'#fafafa' }}>{(w.totalRuns||0).toLocaleString()}</div><div style={S.muted}>Total Runs</div></div>
            <div style={S.elevated}><div style={{ fontSize:'18px', fontWeight:700, color:'#22c55e' }}>{w.openRate||'—'}%</div><div style={S.muted}>Open Rate</div></div>
            <div style={S.elevated}><div style={{ fontSize:'18px', fontWeight:700, color:'#3b82f6' }}>{w.clickRate||'—'}%</div><div style={S.muted}>Click Rate</div></div>
            <div style={S.elevated}><div style={{ fontSize:'18px', fontWeight:700, color:'#8b5cf6' }}>${(w.revenue||0).toLocaleString()}</div><div style={S.muted}>Revenue</div></div>
          </div>
          {/* Step-level inline metrics */}
          <div style={{ marginTop:'12px', paddingTop:'10px', borderTop:'1px solid #27272a' }}>
            <div style={{ fontSize:'12px', color:'#71717a', marginBottom:'6px' }}>STEP PERFORMANCE</div>
            {['Trigger → ','Email 1 → ','Wait → ','Email 2'].map((step,i)=>(
              <span key={i} style={{ fontSize:'12px', color:i%2===0?'#a1a1aa':'#3b82f6', marginRight:'4px' }}>{step}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  /* ── Review Collection ────────────────────────────────────────────── */
  if (tab === 'reviews') {
    return (
      <div>
        <div style={S.h1}>Review & Feedback Collection</div>
        <p style={S.muted}>Automate post-purchase review requests, NPS surveys, and feedback collection flows.</p>
        <div style={S.grid4}>
          <StatCard label="Reviews Collected" value="1,247" sub="Last 30 days" color="#8b5cf6" />
          <StatCard label="Avg Rating" value="4.6★" sub="From 8,320 total" color="#f59e0b" />
          <StatCard label="Response Rate" value="18.3%" sub="+2.1% vs last month" color="#22c55e" />
          <StatCard label="NPS Score" value="72" sub="Promoters: 78%" color="#3b82f6" />
        </div>
        {/* Review request flows */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Review Request Flows</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Flow</th><th style={S.th}>Trigger</th><th style={S.th}>Delay</th><th style={S.th}>Sent</th><th style={S.th}>Response</th><th style={S.th}>Status</th></tr></thead>
            <tbody>
              {[
                { name:'Post-Purchase Review', trigger:'Order delivered', delay:'3 days', sent:2840, resp:'19.2%', on:true },
                { name:'Photo Review Request', trigger:'5★ review submitted', delay:'1 day', resp:'32.4%', sent:540, on:true },
                { name:'NPS Survey', trigger:'3rd order completed', delay:'2 days', sent:890, resp:'24.1%', on:true },
                { name:'Product Feedback', trigger:'Item tagged "new"', delay:'7 days', sent:420, resp:'15.8%', on:false },
                { name:'Customer Satisfaction', trigger:'Support ticket closed', delay:'1 day', sent:310, resp:'28.7%', on:true },
              ].map((f,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #27272a' }}>
                  <td style={S.td}><span style={{ fontWeight:600, color:'#fafafa' }}>{f.name}</span></td>
                  <td style={S.td}>{f.trigger}</td>
                  <td style={S.td}>{f.delay}</td>
                  <td style={S.td}>{f.sent.toLocaleString()}</td>
                  <td style={S.td}><span style={{ color:'#22c55e' }}>{f.resp}</span></td>
                  <td style={S.td}><span style={{ ...S.badge(f.on?'green':'yellow'), fontSize:'11px' }}>{f.on?'Active':'Paused'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Review email template preview */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Review Request Template</div>
          <div style={{ background:'#09090b', border:'1px solid #3f3f46', borderRadius:'8px', padding:'20px', textAlign:'center' }}>
            <div style={{ fontSize:'24px', marginBottom:'8px' }}>📦 → ⭐</div>
            <div style={{ color:'#fafafa', fontSize:'16px', fontWeight:600 }}>How was your order?</div>
            <div style={{ color:'#a1a1aa', fontSize:'13px', marginTop:'6px' }}>We'd love to hear about your experience with <strong style={{ color:'#8b5cf6' }}>[Product Name]</strong></div>
            <div style={{ display:'flex', justifyContent:'center', gap:'8px', marginTop:'16px' }}>
              {[1,2,3,4,5].map(s=>(
                <span key={s} style={{ fontSize:'28px', cursor:'pointer', filter:s<=4?'none':'grayscale(60%)' }}>⭐</span>
              ))}
            </div>
            <button style={{ ...S.btnPrimary, marginTop:'16px' }}>Write a Review</button>
            <div style={{ color:'#71717a', fontSize:'11px', marginTop:'12px' }}>Incentive: 10% off next order for photo reviews</div>
          </div>
        </div>
        {/* Feedback channels */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Feedback Channels</div>
          <div style={S.grid3}>
            {[
              { ch:'Email Review Request', icon:'📧', active:true, rate:'18%' },
              { ch:'In-App Rating Prompt', icon:'📱', active:true, rate:'22%' },
              { ch:'SMS Follow-Up', icon:'💬', active:false, rate:'14%' },
              { ch:'Post-Purchase Page', icon:'🌐', active:true, rate:'31%' },
              { ch:'QR Code on Packaging', icon:'📦', active:true, rate:'8%' },
              { ch:'Social Media Prompt', icon:'📣', active:false, rate:'6%' },
            ].map(c=>(
              <div key={c.ch} style={S.elevated}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'20px' }}>{c.icon}</span>
                  <span style={{ ...S.badge(c.active?'green':'yellow'), fontSize:'10px' }}>{c.active?'ON':'OFF'}</span>
                </div>
                <div style={{ color:'#fafafa', fontWeight:600, fontSize:'13px', marginTop:'6px' }}>{c.ch}</div>
                <div style={{ color:'#22c55e', fontSize:'12px', marginTop:'4px' }}>Response rate: {c.rate}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Cart & Browse Recovery ───────────────────────────────────────── */
  if (tab === 'cart-recovery') {
    return (
      <div>
        <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'8px' }}>
          <div>
            <div style={S.h1}>Abandoned Cart & Browse Recovery</div>
            <p style={S.muted}>Recover lost revenue with automated cart abandonment and browse abandonment flows.</p>
          </div>
          <AIGenButton label="AI Write Recovery Email" credits={2} loading={aiLoading} onClick={() => aiGenWorkflow('Write a compelling cart recovery email sequence with 3 emails: first a friendly reminder (1hr), then urgency with scarcity (24hr), then a discount offer (72hr)')} />
        </div>
        <div style={S.grid4}>
          <StatCard label="Carts Abandoned" value="4,218" sub="Last 30 days" color="#ef4444" />
          <StatCard label="Carts Recovered" value="842" sub="20.0% recovery rate" color="#22c55e" />
          <StatCard label="Revenue Recovered" value="$67,340" sub="$79.98 avg cart" color="#8b5cf6" />
          <StatCard label="Browse Sessions" value="12,450" sub="2,180 abandoned" color="#3b82f6" />
        </div>
        {/* Cart Abandonment Flows */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Cart Abandonment Flows</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Flow</th><th style={S.th}>Trigger Delay</th><th style={S.th}>Emails</th><th style={S.th}>Sent</th><th style={S.th}>Recovered</th><th style={S.th}>Revenue</th><th style={S.th}>Status</th></tr></thead>
            <tbody>
              {[
                { name:'Quick Reminder', delay:'1 hour', emails:1, sent:3840, recovered:612, rev:'$48,900', on:true },
                { name:'Incentive Follow-Up', delay:'24 hours', emails:2, sent:2180, recovered:175, rev:'$14,200', on:true },
                { name:'Last Chance', delay:'72 hours', emails:1, sent:1420, recovered:55, rev:'$4,240', on:true },
                { name:'High-Value Cart ($100+)', delay:'30 min', emails:3, sent:890, recovered:210, rev:'$29,400', on:true },
                { name:'Guest Checkout Recovery', delay:'2 hours', emails:2, sent:620, recovered:78, rev:'$5,100', on:false },
              ].map((f,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #27272a' }}>
                  <td style={S.td}><span style={{ fontWeight:600, color:'#fafafa' }}>{f.name}</span></td>
                  <td style={S.td}>{f.delay}</td>
                  <td style={S.td}>{f.emails}</td>
                  <td style={S.td}>{f.sent.toLocaleString()}</td>
                  <td style={S.td}><span style={{ color:'#22c55e' }}>{f.recovered}</span></td>
                  <td style={S.td}><span style={{ color:'#8b5cf6' }}>{f.rev}</span></td>
                  <td style={S.td}><span style={{ ...S.badge(f.on?'green':'yellow'), fontSize:'11px' }}>{f.on?'Active':'Paused'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Browse Abandonment Flows */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Browse Abandonment Flows</div>
          <p style={{ color:'#a1a1aa', fontSize:'13px', marginBottom:'12px' }}>Nudge visitors who viewed products but didn't add to cart.</p>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Flow</th><th style={S.th}>Trigger</th><th style={S.th}>Sent</th><th style={S.th}>CTR</th><th style={S.th}>Converted</th><th style={S.th}>Status</th></tr></thead>
            <tbody>
              {[
                { name:'Product View Reminder', trigger:'Viewed product, no cart (2h)', sent:4210, ctr:'8.4%', conv:218, on:true },
                { name:'Category Browse', trigger:'Viewed 3+ products in category (4h)', sent:1850, ctr:'11.2%', conv:142, on:true },
                { name:'Repeat Viewer', trigger:'Viewed same product 2+ times (1d)', sent:920, ctr:'14.8%', conv:98, on:true },
                { name:'Wishlist Reminder', trigger:'Added to wishlist, no purchase (3d)', sent:670, ctr:'18.1%', conv:87, on:false },
              ].map((f,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #27272a' }}>
                  <td style={S.td}><span style={{ fontWeight:600, color:'#fafafa' }}>{f.name}</span></td>
                  <td style={S.td}><span style={{ fontSize:'12px', color:'#a1a1aa' }}>{f.trigger}</span></td>
                  <td style={S.td}>{f.sent.toLocaleString()}</td>
                  <td style={S.td}><span style={{ color:'#3b82f6' }}>{f.ctr}</span></td>
                  <td style={S.td}><span style={{ color:'#22c55e' }}>{f.conv}</span></td>
                  <td style={S.td}><span style={{ ...S.badge(f.on?'green':'yellow'), fontSize:'11px' }}>{f.on?'Active':'Paused'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Cart recovery email preview */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Recovery Email Preview</div>
          <div style={{ background:'#09090b', border:'1px solid #3f3f46', borderRadius:'8px', padding:'20px', textAlign:'center' }}>
            <div style={{ fontSize:'28px', marginBottom:'8px' }}>🛒</div>
            <div style={{ color:'#fafafa', fontSize:'18px', fontWeight:700 }}>You left something behind!</div>
            <div style={{ color:'#a1a1aa', fontSize:'13px', marginTop:'6px' }}>Complete your order before your cart expires</div>
            <div style={{ ...S.row, justifyContent:'center', marginTop:'16px', flexWrap:'wrap' }}>
              {['Silk Scarf — $49.99','Leather Wallet — $79.99'].map(item=>(
                <div key={item} style={{ background:'#18181b', borderRadius:'6px', padding:'10px 16px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontSize:'16px' }}>📦</span>
                  <span style={{ color:'#fafafa', fontSize:'13px' }}>{item}</span>
                </div>
              ))}
            </div>
            <button style={{ ...S.btnPrimary, marginTop:'16px', fontSize:'14px', padding:'10px 24px' }}>Complete Your Order →</button>
            <div style={{ color:'#ef4444', fontSize:'12px', marginTop:'10px', fontFamily:'monospace' }}>⏰ Items reserved for 24 more hours</div>
          </div>
        </div>
        {aiResult && <AIResultCard result={aiResult} title="AI Recovery Email Copy" onClose={() => setAiResult(null)} />}
      </div>
    );
  }

  /* ── Content Approvals ── */
  if (tab === 'content-approvals') {
    return (
      <div>
        <div style={S.card}>
          <h3 style={S.title}>Content Approvals</h3>
          <p style={S.subtitle}>Multi-step content review and sign-off workflow (Customer.io style)</p>
        </div>
        <div style={S.grid4}>
          <StatCard label="Pending Review" value="6" color="#f59e0b" />
          <StatCard label="Approved Today" value="4" color="#22c55e" />
          <StatCard label="Rejected" value="1" color="#ef4444" />
          <StatCard label="Avg Review Time" value="2.4h" color="#3b82f6" />
        </div>
        <div style={S.card}>
          <h4 style={S.h2}>Approval Queue</h4>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Campaign</th><th style={S.th}>Author</th><th style={S.th}>Stage</th><th style={S.th}>Reviewers</th><th style={S.th}>Submitted</th><th style={S.th}>Actions</th></tr></thead>
            <tbody>
              {[
                { name:'Summer Sale Blast', author:'Sarah', stage:'Legal Review', reviewers:'2/3', submitted:'2h ago', status:'pending' },
                { name:'Product Launch Series', author:'Mike', stage:'Design Review', reviewers:'1/2', submitted:'4h ago', status:'pending' },
                { name:'VIP Exclusive Offer', author:'Emily', stage:'Final Approval', reviewers:'0/1', submitted:'5h ago', status:'pending' },
                { name:'Re-engagement Flow', author:'James', stage:'Content Review', reviewers:'2/2', submitted:'1d ago', status:'approved' },
                { name:'Holiday Campaign', author:'Lisa', stage:'Compliance', reviewers:'1/1', submitted:'1d ago', status:'approved' },
                { name:'Flash Sale Alert', author:'David', stage:'Content Review', reviewers:'1/2', submitted:'6h ago', status:'changes' },
              ].map(c=>(
                <tr key={c.name}>
                  <td style={S.td}><span style={{ color:'#fafafa', fontWeight:600 }}>{c.name}</span></td>
                  <td style={S.td}>{c.author}</td>
                  <td style={S.td}><span style={S.badge('#a855f7')}>{c.stage}</span></td>
                  <td style={S.td}>{c.reviewers}</td>
                  <td style={S.td}><span style={S.muted}>{c.submitted}</span></td>
                  <td style={S.td}>
                    <div style={S.row}>
                      {c.status==='pending' && <><button style={S.btnGreen}>Approve</button><button style={S.btnDanger}>Reject</button></>}
                      {c.status==='approved' && <span style={S.badge('#22c55e')}>Approved</span>}
                      {c.status==='changes' && <span style={S.badge('#f59e0b')}>Changes Requested</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={S.grid2}>
          <div style={S.card}>
            <h4 style={S.h2}>Approval Pipeline Stages</h4>
            {[
              { stage:'Content Review', desc:'Copy accuracy, brand voice, personalization tokens', reviewers:['Content Lead','Copywriter'] },
              { stage:'Design Review', desc:'Visual layout, mobile responsiveness, brand guidelines', reviewers:['Design Lead'] },
              { stage:'Legal / Compliance', desc:'CAN-SPAM, GDPR, disclaimers, opt-out links', reviewers:['Legal Team'] },
              { stage:'Final Approval', desc:'Executive sign-off before scheduling', reviewers:['Marketing Director'] },
            ].map((s,i)=>(
              <div key={s.stage} style={{ ...S.elevated, marginBottom:'8px', display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'#3b82f622', display:'flex', alignItems:'center', justifyContent:'center', color:'#3b82f6', fontWeight:700, fontSize:'14px', flexShrink:0 }}>{i+1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ color:'#fafafa', fontWeight:600, fontSize:'13px' }}>{s.stage}</div>
                  <div style={{ color:'#a1a1aa', fontSize:'12px' }}>{s.desc}</div>
                  <div style={{ color:'#71717a', fontSize:'11px', marginTop:'2px' }}>Reviewers: {s.reviewers.join(', ')}</div>
                </div>
              </div>
            ))}
            <button style={{ ...S.btnPrimary, marginTop:'8px' }}>+ Add Stage</button>
          </div>
          <div style={S.card}>
            <h4 style={S.h2}>Review Comments & Annotations</h4>
            {[
              { user:'Sarah', comment:'Subject line needs to be shorter \u2014 currently 62 chars, aim for under 50', time:'2h ago', resolved:false },
              { user:'Mike', comment:'CTA button contrast ratio fails WCAG AA \u2014 darken the background', time:'3h ago', resolved:true },
              { user:'Legal', comment:'Add unsubscribe link to footer \u2014 required for CAN-SPAM', time:'4h ago', resolved:true },
              { user:'Emily', comment:'Product image alt text missing on hero banner', time:'5h ago', resolved:false },
              { user:'Design', comment:'Mobile preview shows broken layout at 375px width', time:'6h ago', resolved:false },
            ].map(c=>(
              <div key={c.comment} style={{ ...S.elevated, marginBottom:'8px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
                  <span style={{ color:'#3b82f6', fontWeight:600, fontSize:'13px' }}>{c.user}</span>
                  <div style={S.row}>
                    <span style={S.muted}>{c.time}</span>
                    <span style={S.badge(c.resolved?'#22c55e':'#f59e0b')}>{c.resolved?'Resolved':'Open'}</span>
                  </div>
                </div>
                <div style={{ color:'#fafafa', fontSize:'13px' }}>{c.comment}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── MULTI-CHANNEL ────────────────────────────────────────────────────────────
function MultiChannelMgmt({ tab }) {
  const [msg, setMsg] = useState('');
  const [webhooks, setWebhooks] = useState([]);
  const [smsForm, setSmsForm] = useState({ to:'', message:'' });
  const [pushForm, setPushForm] = useState({ title:'', body:'', segment:'all' });
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [deliverability, setDeliverability] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  async function aiGenContent(type, prompt) {
    setAiLoading(true); setAiResult(null);
    try {
      const d = await apiFetch('/ai/content/generate', { method:'POST', body: JSON.stringify({ type, prompt, tone:'concise' }) });
      const text = d.content || d.text || d.html || JSON.stringify(d);
      if (type === 'sms') setSmsForm(p => ({ ...p, message: (typeof text === 'string' ? text : '').slice(0, 160) }));
      else if (type === 'push-title') setPushForm(p => ({ ...p, title: typeof text === 'string' ? text : '' }));
      else if (type === 'push-body') setPushForm(p => ({ ...p, body: typeof text === 'string' ? text : '' }));
      else setAiResult(text);
    } catch (e) { setAiResult('Error: ' + e.message); }
    setAiLoading(false);
  }

  useEffect(() => {
    if (tab === 'webhooks') apiFetch('/settings/webhooks').then(d=>setWebhooks(d.webhooks||d||[])).catch(()=>{});
    if (tab === 'orchestration') {
      apiFetch('/channels/available').then(d=>setChannels(d.channels||d||[])).catch(()=>{});
      apiFetch('/messages').then(d=>setMessages(d.messages||d||[])).catch(()=>{});
    }
    if (tab === 'preferences') apiFetch('/channels/email/deliverability').then(d=>setDeliverability(d)).catch(()=>{});
  }, [tab]);

  async function sendSMS() {
    try { await apiFetch('/channels/sms/send',{method:'POST',body:JSON.stringify(smsForm)}); setMsg('SMS sent!'); }
    catch(e) { setMsg(e.message); }
  }

  async function sendPush() {
    try { await apiFetch('/channels/push/send',{method:'POST',body:JSON.stringify(pushForm)}); setMsg('Push sent!'); }
    catch(e) { setMsg(e.message); }
  }

  async function deleteWebhook(id) {
    try { await apiFetch(`/settings/webhooks/${id}`,{method:'DELETE'}); setWebhooks(wh=>wh.filter(w=>(w.id||w._id)!==id)); }
    catch(e) { setMsg(e.message); }
  }

  if (tab === 'sms') return (
    <div>
      <div style={S.title}>SMS Campaigns</div>
      <Msg text={msg} type={msg.includes('rror')?'error':'ok'} />
      <div style={{ maxWidth:'500px', marginTop:'16px' }}>
        <div style={S.fg}><label style={S.label}>Recipient (phone / segment)</label><input style={S.input} value={smsForm.to} onChange={e=>setSmsForm(p=>({...p,to:e.target.value}))} placeholder="+1555..." /></div>
        <div style={S.fg}>
          <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'6px' }}>
            <label style={{ ...S.label, margin:0 }}>Message (160 chars)</label>
            <AIGenButton label="AI Write SMS" credits={2} loading={aiLoading} onClick={() => aiGenContent('sms', 'Write a compelling 160-character SMS marketing message for an e-commerce promotion')} />
          </div>
          <textarea style={{ ...S.textarea, minHeight:'80px' }} maxLength={160} value={smsForm.message} onChange={e=>setSmsForm(p=>({...p,message:e.target.value}))} />
        </div>
        <div style={S.muted}>{160-smsForm.message.length} chars remaining</div>
        <button style={{ ...S.btnPrimary, marginTop:'12px' }} onClick={sendSMS}>Send SMS</button>
      </div>
    </div>
  );

  if (tab === 'push') return (
    <div>
      <div style={S.title}>Push Notifications</div>
      <Msg text={msg} type={msg.includes('rror')?'error':'ok'} />
      <div style={{ maxWidth:'500px', marginTop:'16px' }}>
        <div style={S.fg}>
          <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'6px' }}>
            <label style={{ ...S.label, margin:0 }}>Title</label>
            <AIGenButton label="AI Write Title" credits={2} loading={aiLoading} onClick={() => aiGenContent('push-title', 'Write a short, attention-grabbing push notification title for an e-commerce sale')} />
          </div>
          <input style={S.input} value={pushForm.title} onChange={e=>setPushForm(p=>({...p,title:e.target.value}))} />
        </div>
        <div style={S.fg}>
          <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'6px' }}>
            <label style={{ ...S.label, margin:0 }}>Body</label>
            <AIGenButton label="AI Write Body" credits={2} loading={aiLoading} onClick={() => aiGenContent('push-body', `Write a concise push notification body for: ${pushForm.title || 'e-commerce promotion'}`)} />
          </div>
          <textarea style={{ ...S.textarea, minHeight:'80px' }} value={pushForm.body} onChange={e=>setPushForm(p=>({...p,body:e.target.value}))} />
        </div>
        <div style={S.fg}><label style={S.label}>Segment</label>
          <select style={S.select} value={pushForm.segment} onChange={e=>setPushForm(p=>({...p,segment:e.target.value}))}>
            <option value="all">All Subscribers</option>
            <option value="mobile">Mobile Only</option>
            <option value="engaged">Engaged Users</option>
          </select>
        </div>
        <button style={S.btnPrimary} onClick={sendPush}>Send Push</button>
      </div>
      {aiResult && <AIResultCard result={aiResult} title="AI Push Content" onClose={() => setAiResult(null)} />}
    </div>
  );

  if (tab === 'webhooks') return (
    <div>
      <div style={S.title}>Webhooks</div>
      <Msg text={msg} type="error" />
      <table style={{ ...S.table, marginTop:'16px' }}>
        <thead><tr>{['URL','Events','Status','Actions'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>
          {(webhooks.length ? webhooks : []).map(w => (
            <tr key={w.id||w._id}>
              <td style={S.td}>{w.url}</td>
              <td style={S.td}>{(w.events||[]).join(', ') || '—'}</td>
              <td style={S.td}><span style={S.badge(w.active?'#22c55e':'#71717a')}>{w.active?'active':'inactive'}</span></td>
              <td style={S.td}>
                <div style={S.row}>
                  <button style={S.btnSm} onClick={()=>apiFetch(`/settings/webhooks/${w.id||w._id}/test`,{method:'POST'}).then(()=>setMsg('Test sent.')).catch(e=>setMsg(e.message))}>Test</button>
                  <button style={S.btnDanger} onClick={()=>deleteWebhook(w.id||w._id)}>Del</button>
                </div>
              </td>
            </tr>
          ))}
          {!webhooks.length && <tr><td style={{ ...S.td, color:'#71717a' }} colSpan={4}>No webhooks.</td></tr>}
        </tbody>
      </table>
    </div>
  );

  if (tab === 'orchestration') return (
    <div>
      <div style={S.title}>Channel Orchestration</div>
      <div style={{ ...S.grid3, marginTop:'16px' }}>
        {(channels.length ? channels : ['email','sms','push','whatsapp','in-app']).map(c => (
          <div key={c.id||c} style={S.card}><div style={{ color:'#fafafa', fontWeight:600, textTransform:'capitalize' }}>{c.name||c}</div><div style={S.muted}>{c.status||'available'}</div></div>
        ))}
      </div>
      <div style={{ ...S.card, marginTop:'16px' }}>
        <div style={S.h2}>Recent Messages</div>
        <table style={S.table}>
          <thead><tr>{['Channel','To','Status','Sent'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {(messages.length ? messages.slice(0,10) : []).map(m => (
              <tr key={m.id||m._id}>
                <td style={S.td}>{m.channel||'—'}</td>
                <td style={S.td}>{m.to||'—'}</td>
                <td style={S.td}><span style={S.badge(m.status==='delivered'?'#22c55e':'#f59e0b')}>{m.status||'sent'}</span></td>
                <td style={S.td}>{m.sentAt ? new Date(m.sentAt).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
            {!messages.length && <tr><td style={{ ...S.td, color:'#71717a' }} colSpan={4}>No recent messages.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (tab === 'preferences') return (
    <div>
      <div style={S.title}>Channel Preferences & Deliverability</div>
      {deliverability ? (
        <div style={{ ...S.grid4, marginTop:'16px' }}>
          <StatCard label="Inbox Rate" value={`${deliverability.inboxRate||deliverability.inbox_rate||'—'}%`} color="#22c55e" />
          <StatCard label="Spam Rate" value={`${deliverability.spamRate||deliverability.spam_rate||'—'}%`} color="#ef4444" />
          <StatCard label="Bounce Rate" value={`${deliverability.bounceRate||deliverability.bounce_rate||'—'}%`} />
          <StatCard label="Unsubscribe Rate" value={`${deliverability.unsubRate||'—'}%`} />
        </div>
      ) : (
        <div style={{ ...S.grid4, marginTop:'16px' }}>
          <StatCard label="Inbox Rate" value="96.4%" color="#22c55e" />
          <StatCard label="Spam Rate" value="0.9%" color="#f59e0b" />
          <StatCard label="Bounce Rate" value="1.2%" />
          <StatCard label="Unsubscribe Rate" value="0.3%" />
        </div>
      )}
    </div>
  );

  // ── Retargeting Ads Integration ──
  if (tab === 'retargeting') {
    const PLATFORMS = [
      { name:'Meta (Facebook/Instagram)', icon:'📘', status:'connected', audiences:3, synced:'12,450 contacts', lastSync:'2 hrs ago' },
      { name:'Google Ads', icon:'🔍', status:'connected', audiences:2, synced:'8,200 contacts', lastSync:'4 hrs ago' },
      { name:'TikTok Ads', icon:'🎵', status:'not connected', audiences:0, synced:'—', lastSync:'—' },
      { name:'Pinterest Ads', icon:'📌', status:'not connected', audiences:0, synced:'—', lastSync:'—' },
    ];
    const AUDIENCES = [
      { name:'Cart Abandoners (7d)', platform:'Meta', size:'1,240', status:'syncing' },
      { name:'VIP Customers', platform:'Meta', size:'3,800', status:'synced' },
      { name:'Email Non-Openers (30d)', platform:'Google', size:'5,600', status:'synced' },
      { name:'Recent Purchasers', platform:'Meta', size:'2,100', status:'synced' },
      { name:'Browse Abandoners', platform:'Google', size:'4,300', status:'synced' },
    ];
    return (
      <div>
        <div style={S.title}>Retargeting Ads Integration</div>
        <p style={S.muted}>Sync your email segments to ad platforms for coordinated cross-channel retargeting.</p>
        <div style={{ ...S.grid4, marginTop:'16px', marginBottom:'16px' }}>
          <StatCard label="Connected Platforms" value={PLATFORMS.filter(p=>p.status==='connected').length} color="#22c55e" />
          <StatCard label="Synced Audiences" value={AUDIENCES.length} color="#3b82f6" />
          <StatCard label="Total Reach" value="25,340" color="#8b5cf6" />
          <StatCard label="Ad Spend Saved" value="$1,240" color="#f59e0b" />
        </div>
        {/* Platforms */}
        <div style={S.h2}>Ad Platforms</div>
        <div style={{ ...S.grid2, marginBottom:'20px' }}>
          {PLATFORMS.map(p=>(
            <div key={p.name} style={{ ...S.card, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={S.row}>
                <span style={{ fontSize:'24px' }}>{p.icon}</span>
                <div>
                  <div style={{ fontWeight:600, color:'#fafafa' }}>{p.name}</div>
                  <div style={S.muted}>{p.synced}{p.lastSync!=='—'?` · Last sync: ${p.lastSync}`:''}</div>
                </div>
              </div>
              <button style={p.status==='connected'?S.btnGreen:S.btnPrimary}>{p.status==='connected'?'✓ Connected':'Connect'}</button>
            </div>
          ))}
        </div>
        {/* Audiences */}
        <div style={S.h2}>Synced Audiences</div>
        <table style={S.table}>
          <thead><tr>{['Audience','Platform','Size','Status','Actions'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {AUDIENCES.map(a=>(
              <tr key={a.name}>
                <td style={S.td}>{a.name}</td>
                <td style={S.td}>{a.platform}</td>
                <td style={S.td}>{a.size}</td>
                <td style={S.td}><span style={S.badge(a.status==='synced'?'#22c55e':'#3b82f6')}>{a.status}</span></td>
                <td style={S.td}><div style={S.row}><button style={S.btnSm}>Sync Now</button><button style={S.btnGhost}>Edit</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── WhatsApp Channel ──
  if (tab === 'whatsapp') {
    const TEMPLATES = [
      { name:'Order Confirmation', status:'approved', category:'Transactional', sent:3200, delivered:'99.1%' },
      { name:'Shipping Update', status:'approved', category:'Transactional', sent:2800, delivered:'99.3%' },
      { name:'Cart Reminder', status:'approved', category:'Marketing', sent:1400, delivered:'97.8%' },
      { name:'Welcome Message', status:'approved', category:'Marketing', sent:960, delivered:'98.2%' },
      { name:'Flash Sale Alert', status:'pending', category:'Marketing', sent:0, delivered:'—' },
      { name:'Review Request', status:'approved', category:'Utility', sent:680, delivered:'98.9%' },
    ];
    return (
      <div>
        <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'16px' }}>
          <div><div style={S.title}>WhatsApp Business</div><p style={S.muted}>Send transactional and marketing messages via WhatsApp with template approval workflow.</p></div>
          <div style={S.row}>
            <AIGenButton label="AI Write Template" credits={2} loading={aiLoading} onClick={() => aiGenContent('whatsapp', 'Write a WhatsApp Business message template for order confirmation with dynamic variables like customer name, order number, and delivery date')} />
            <button style={S.btnPrimary}>+ New Template</button>
          </div>
        </div>
        <div style={{ ...S.grid4, marginTop:'8px', marginBottom:'16px' }}>
          <StatCard label="Approved Templates" value={TEMPLATES.filter(t=>t.status==='approved').length} color="#22c55e" />
          <StatCard label="Messages Sent" value={TEMPLATES.reduce((s,t)=>s+t.sent,0).toLocaleString()} color="#3b82f6" />
          <StatCard label="Delivery Rate" value="98.7%" color="#22c55e" />
          <StatCard label="Read Rate" value="82.4%" color="#8b5cf6" />
        </div>
        {/* Connection status */}
        <div style={{ ...S.card, marginBottom:'16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={S.row}>
            <span style={{ fontSize:'24px' }}>💬</span>
            <div>
              <div style={{ fontWeight:600, color:'#fafafa' }}>WhatsApp Business API</div>
              <div style={S.muted}>Connected via Meta Business Suite · Phone: +1 555-0100</div>
            </div>
          </div>
          <span style={S.badge('#22c55e')}>✓ Connected</span>
        </div>
        <table style={S.table}>
          <thead><tr>{['Template','Category','Status','Sent','Delivery Rate','Actions'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {TEMPLATES.map(t=>(
              <tr key={t.name}>
                <td style={S.td}>{t.name}</td>
                <td style={S.td}><span style={S.badge('#a1a1aa')}>{t.category}</span></td>
                <td style={S.td}><span style={S.badge(t.status==='approved'?'#22c55e':t.status==='pending'?'#f59e0b':'#ef4444')}>{t.status}</span></td>
                <td style={S.td}>{t.sent.toLocaleString()}</td>
                <td style={S.td}>{t.delivered}</td>
                <td style={S.td}><div style={S.row}><button style={S.btnSm}>Edit</button><button style={S.btnGhost}>Test</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {aiResult && <AIResultCard result={aiResult} title="AI WhatsApp Template" onClose={() => setAiResult(null)} />}
      </div>
    );
  }

  return null;
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function AnalyticsMgmt({ tab }) {
  const [overview, setOverview] = useState(null);
  const [reports, setReports] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [deliverability, setDeliverability] = useState(null);
  const [msg, setMsg] = useState('');
  const [exportFmt, setExportFmt] = useState('csv');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  async function aiInsights(context) {
    setAiLoading(true); setAiResult(null);
    try {
      const d = await apiFetch('/ai/content/generate', { method:'POST', body: JSON.stringify({ type:'analytics-insights', prompt: context, tone:'analytical' }) });
      setAiResult(d.content || d.text || JSON.stringify(d));
    } catch(e) { setAiResult('Error: ' + e.message); }
    setAiLoading(false);
  }

  useEffect(() => {
    if (tab === 'dashboard') apiFetch('/analytics/overview').then(d=>setOverview(d)).catch(()=>{});
    if (tab === 'reports') apiFetch('/reports').then(d=>setReports(d.reports||d||[])).catch(()=>{});
    if (tab === 'revenue') apiFetch('/analytics/revenue/overview').then(d=>setRevenue(d)).catch(()=>{});
    if (tab === 'engagement') apiFetch('/analytics/engagement/overview').then(d=>setEngagement(d)).catch(()=>{});
    if (tab === 'deliverability') apiFetch('/channels/email/deliverability').then(d=>setDeliverability(d)).catch(()=>{});
  }, [tab]);

  if (tab === 'dashboard') return (
    <div>
      <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'8px' }}>
        <div style={S.title}>Analytics Dashboard</div>
        <AIGenButton label="AI Insights" credits={1} loading={aiLoading} onClick={() => aiInsights(`Analyze email marketing performance: open rate ${overview?.openRate || 42.3}%, click rate ${overview?.clickRate || 8.7}%, conversion ${overview?.conversionRate || 3.2}%, revenue $${overview?.revenue || 57681}. Provide 5 actionable recommendations to improve performance.`)} />
      </div>
      <div style={{ ...S.grid4, marginTop:'16px' }}>
        <StatCard label="Open Rate" value={overview ? `${overview.openRate||overview.avgOpenRate||'—'}%` : '42.3%'} color="#22c55e" sub="↑ 5.2% vs last month" />
        <StatCard label="Click Rate" value={overview ? `${overview.clickRate||overview.avgClickRate||'—'}%` : '8.7%'} sub="↑ 2.1% vs last month" />
        <StatCard label="Conversion Rate" value={overview ? `${overview.conversionRate||'—'}%` : '3.2%'} />
        <StatCard label="Revenue" value={overview ? `$${(overview.revenue||0).toLocaleString()}` : '$57,681'} color="#22c55e" sub="↑ 12.3% vs last month" />
      </div>
      <div style={{ ...S.grid2, marginTop:'16px' }}>
        <div style={S.card}>
          <div style={S.h2}>Emails Sent</div>
          <div style={{ ...S.statNum }}>{overview ? (overview.emailsSent||overview.totalSent||0).toLocaleString() : '21,508'}</div>
        </div>
        <div style={S.card}>
          <div style={S.h2}>Unsubscribes</div>
          <div style={{ ...S.statNum, color:'#ef4444' }}>{overview ? (overview.unsubscribes||0).toLocaleString() : '142'}</div>
        </div>
      </div>
      {aiResult && <AIResultCard result={aiResult} title="AI Performance Insights" onClose={() => setAiResult(null)} />}
    </div>
  );

  if (tab === 'reports') return (
    <div>
      <div style={S.title}>Campaign Reports</div>
      <table style={{ ...S.table, marginTop:'16px' }}>
        <thead><tr>{['Name','Type','Created','Actions'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>
          {(reports.length ? reports : []).map(r => (
            <tr key={r.id||r._id}>
              <td style={S.td}>{r.name}</td>
              <td style={S.td}>{r.type||'campaign'}</td>
              <td style={S.td}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
              <td style={S.td}><button style={S.btnSm}>View</button></td>
            </tr>
          ))}
          {!reports.length && <tr><td style={{ ...S.td, color:'#71717a' }} colSpan={4}>No reports yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );

  if (tab === 'revenue') return (
    <div>
      <div style={S.title}>Revenue Attribution</div>
      <div style={{ ...S.grid4, marginTop:'16px' }}>
        <StatCard label="Total Revenue" value={revenue ? `$${(revenue.total||0).toLocaleString()}` : '$57,681'} color="#22c55e" />
        <StatCard label="Avg Order Value" value={revenue ? `$${revenue.avgOrderValue||'—'}` : '$87'} />
        <StatCard label="Orders from Email" value={revenue ? (revenue.orders||0).toLocaleString() : '662'} />
        <StatCard label="ROI" value={revenue ? `${revenue.roi||'—'}x` : '38x'} color="#22c55e" />
      </div>
    </div>
  );

  if (tab === 'engagement') return (
    <div>
      <div style={S.title}>Engagement Metrics</div>
      <div style={{ ...S.grid4, marginTop:'16px' }}>
        <StatCard label="Opens" value={engagement ? (engagement.opens||0).toLocaleString() : '9,096'} color="#22c55e" />
        <StatCard label="Clicks" value={engagement ? (engagement.clicks||0).toLocaleString() : '1,871'} />
        <StatCard label="CTOR" value={engagement ? `${engagement.ctor||'—'}%` : '20.6%'} />
        <StatCard label="Forwards" value={engagement ? (engagement.forwards||0).toLocaleString() : '143'} />
      </div>
    </div>
  );

  if (tab === 'deliverability') return (
    <div>
      <div style={S.title}>Deliverability</div>
      <div style={{ ...S.grid4, marginTop:'16px' }}>
        <StatCard label="Inbox Rate" value={deliverability ? `${deliverability.inboxRate||'—'}%` : '96.4%'} color="#22c55e" />
        <StatCard label="Spam Rate" value={deliverability ? `${deliverability.spamRate||'—'}%` : '0.9%'} color="#f59e0b" />
        <StatCard label="Bounce Rate" value={deliverability ? `${deliverability.bounceRate||'—'}%` : '1.2%'} />
        <StatCard label="Sender Score" value={deliverability ? (deliverability.senderScore||'—') : '96'} color="#22c55e" />
      </div>
    </div>
  );

  if (tab === 'export') return (
    <div>
      <div style={S.title}>Data Export</div>
      <div style={{ maxWidth:'400px', marginTop:'16px' }}>
        <div style={S.fg}><label style={S.label}>Format</label>
          <select style={S.select} value={exportFmt} onChange={e=>setExportFmt(e.target.value)}>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="xlsx">Excel</option>
          </select>
        </div>
        <Msg text={msg} type={msg.includes('rror')?'error':'ok'} />
        <button style={S.btnPrimary} onClick={() => apiFetch('/campaigns/export',{method:'POST',body:JSON.stringify({format:exportFmt})}).then(()=>setMsg('Export started! Check your email.')).catch(e=>setMsg(e.message))}>Export Campaign Data</button>
      </div>
    </div>
  );

  // ── Industry Benchmarks ──
  if (tab === 'benchmarks') {
    const BENCHMARKS = [
      { metric:'Open Rate', yours:'24.8%', industry:'21.3%', delta:'+3.5%', status:'above' },
      { metric:'Click Rate', yours:'3.6%', industry:'2.6%', delta:'+1.0%', status:'above' },
      { metric:'Unsubscribe Rate', yours:'0.18%', industry:'0.26%', delta:'-0.08%', status:'above' },
      { metric:'Bounce Rate', yours:'1.4%', industry:'0.7%', delta:'+0.7%', status:'below' },
      { metric:'Spam Complaint', yours:'0.02%', industry:'0.03%', delta:'-0.01%', status:'above' },
      { metric:'Revenue/Email', yours:'$0.18', industry:'$0.12', delta:'+$0.06', status:'above' },
      { metric:'List Growth Rate', yours:'4.2%', industry:'3.5%', delta:'+0.7%', status:'above' },
      { metric:'Automation Revenue %', yours:'38%', industry:'29%', delta:'+9%', status:'above' },
    ];
    return (
      <div>
        <div style={S.title}>Industry Benchmarks</div>
        <p style={S.muted}>Compare your email performance against industry peers — updated monthly from aggregated platform data.</p>
        <div style={{ ...S.grid4, marginTop:'16px', marginBottom:'16px' }}>
          <StatCard label="Above Benchmark" value={`${BENCHMARKS.filter(b=>b.status==='above').length}/${BENCHMARKS.length}`} color="#22c55e" />
          <StatCard label="Overall Score" value="87/100" color="#8b5cf6" />
          <StatCard label="Industry" value="E-Commerce" />
          <StatCard label="Peer Group" value="126 brands" color="#3b82f6" />
        </div>
        <table style={S.table}>
          <thead><tr>{['Metric','Your Performance','Industry Average','Delta','Status'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {BENCHMARKS.map(b=>(
              <tr key={b.metric}>
                <td style={S.td}>{b.metric}</td>
                <td style={{ ...S.td, fontWeight:600 }}>{b.yours}</td>
                <td style={S.td}>{b.industry}</td>
                <td style={{ ...S.td, color:b.status==='above'?'#22c55e':'#ef4444', fontWeight:600 }}>{b.delta}</td>
                <td style={S.td}><span style={S.badge(b.status==='above'?'#22c55e':'#ef4444')}>{b.status==='above'?'✓ Above':'✕ Below'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Trend chart placeholder */}
        <div style={{ ...S.card, marginTop:'20px' }}>
          <div style={S.h2}>Performance vs Industry — 6 Month Trend</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:'12px', height:'160px', padding:'16px 0' }}>
            {['Sep','Oct','Nov','Dec','Jan','Feb'].map((m,i)=>{
              const yours = [20,22,21,24,23,25][i];
              const ind = [20,21,21,21,21,21][i];
              return (
                <div key={m} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                  <div style={{ display:'flex', gap:'2px', alignItems:'flex-end', height:'120px' }}>
                    <div style={{ width:'14px', background:'#8b5cf6', borderRadius:'3px 3px 0 0', height:`${yours*4.5}px` }} title={`You: ${yours}%`} />
                    <div style={{ width:'14px', background:'#3f3f46', borderRadius:'3px 3px 0 0', height:`${ind*4.5}px` }} title={`Industry: ${ind}%`} />
                  </div>
                  <div style={{ fontSize:'11px', color:'#71717a' }}>{m}</div>
                </div>
              );
            })}
          </div>
          <div style={{ ...S.row, justifyContent:'center', gap:'16px', marginTop:'8px' }}>
            <div style={S.row}><div style={{ width:'12px', height:'12px', background:'#8b5cf6', borderRadius:'2px' }} /><span style={{ fontSize:'12px', color:'#a1a1aa' }}>Your Store</span></div>
            <div style={S.row}><div style={{ width:'12px', height:'12px', background:'#3f3f46', borderRadius:'2px' }} /><span style={{ fontSize:'12px', color:'#a1a1aa' }}>Industry Avg</span></div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Smart Alerts / Auto-Monitors ─────────────────────────────────── */
  if (tab === 'smart-alerts') {
    return (
      <div>
        <div style={S.h1}>Smart Alerts & Auto-Monitors</div>
        <p style={S.muted}>AI-powered monitoring that detects anomalies and sends real-time alerts when metrics deviate from normal.</p>
        <div style={S.grid4}>
          <StatCard label="Active Monitors" value="12" sub="Across all channels" color="#8b5cf6" />
          <StatCard label="Alerts This Week" value="3" sub="1 critical, 2 info" color="#f59e0b" />
          <StatCard label="Avg Response Time" value="4m" sub="To alert acknowledgment" color="#22c55e" />
          <StatCard label="Issues Prevented" value="18" sub="This month" color="#3b82f6" />
        </div>
        {/* Active alerts */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Recent Alerts</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {[
              { sev:'critical', msg:'Open rate dropped 40% on "Summer Sale" campaign vs 7-day average', time:'2h ago', metric:'Open Rate: 8.2% (avg 14.1%)', ack:false },
              { sev:'warning', msg:'Bounce rate exceeded 3% threshold on domain mail.store.com', time:'5h ago', metric:'Bounce Rate: 3.4% (threshold 3%)', ack:true },
              { sev:'info', msg:'SMS delivery rate improved 12% week-over-week', time:'1d ago', metric:'SMS Delivery: 97.8% (+12%)', ack:true },
              { sev:'warning', msg:'Unsubscribe rate trending upward for "Weekly Newsletter" flow', time:'2d ago', metric:'Unsub Rate: 0.8% (avg 0.4%)', ack:true },
              { sev:'info', msg:'Revenue per email reached new monthly high', time:'3d ago', metric:'RPE: $0.42 (prev best $0.38)', ack:true },
            ].map((a,i)=>(
              <div key={i} style={{ ...S.elevated, borderLeft:`3px solid ${a.sev==='critical'?'#ef4444':a.sev==='warning'?'#f59e0b':'#3b82f6'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ ...S.badge(a.sev==='critical'?'red':a.sev==='warning'?'yellow':'blue'), fontSize:'10px', textTransform:'uppercase' }}>{a.sev}</span>
                      <span style={{ color:'#71717a', fontSize:'11px' }}>{a.time}</span>
                    </div>
                    <div style={{ color:'#fafafa', fontSize:'13px', fontWeight:500, marginTop:'6px' }}>{a.msg}</div>
                    <div style={{ color:'#a1a1aa', fontSize:'12px', marginTop:'4px', fontFamily:'monospace' }}>{a.metric}</div>
                  </div>
                  <span style={{ color:a.ack?'#22c55e':'#ef4444', fontSize:'11px' }}>{a.ack?'✓ Acked':'⚠ Pending'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Monitor configuration */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Monitor Rules</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Monitor</th><th style={S.th}>Metric</th><th style={S.th}>Condition</th><th style={S.th}>Channel</th><th style={S.th}>Status</th></tr></thead>
            <tbody>
              {[
                { name:'Open Rate Drop', metric:'Open Rate', cond:'Drops >25% vs 7-day avg', ch:'Email + Slack', on:true },
                { name:'Bounce Spike', metric:'Bounce Rate', cond:'Exceeds 3%', ch:'Email + SMS', on:true },
                { name:'Revenue Anomaly', metric:'Revenue/Email', cond:'Drops >30% vs baseline', ch:'Email', on:true },
                { name:'List Growth', metric:'New Subscribers', cond:'< 50% daily average', ch:'Slack', on:false },
                { name:'Spam Complaints', metric:'Complaint Rate', cond:'Exceeds 0.1%', ch:'Email + Slack + SMS', on:true },
                { name:'Flow Drop-Off', metric:'Flow Completion', cond:'Drops >20% at any step', ch:'Email', on:true },
                { name:'Deliverability', metric:'Inbox Placement', cond:'< 90% placement rate', ch:'Email + Slack', on:true },
                { name:'Engagement Score', metric:'Engagement Trend', cond:'3+ consecutive declines', ch:'Email', on:false },
              ].map((m,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #27272a' }}>
                  <td style={S.td}><span style={{ fontWeight:600, color:'#fafafa' }}>{m.name}</span></td>
                  <td style={S.td}>{m.metric}</td>
                  <td style={{ ...S.td, fontFamily:'monospace', fontSize:'12px', color:'#f59e0b' }}>{m.cond}</td>
                  <td style={S.td}>{m.ch}</td>
                  <td style={S.td}><span style={{ ...S.badge(m.on?'green':'yellow'), fontSize:'11px' }}>{m.on?'Active':'Paused'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Alert delivery settings */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Alert Delivery Channels</div>
          <div style={S.grid3}>
            {[
              { ch:'Email Digest', icon:'📧', desc:'Daily summary at 9am or instant for critical', on:true },
              { ch:'Slack Integration', icon:'💬', desc:'Real-time alerts to #marketing channel', on:true },
              { ch:'SMS Alerts', icon:'📱', desc:'Critical alerts only, max 3/day', on:false },
              { ch:'In-App Notifications', icon:'🔔', desc:'Badge + toast for all severity levels', on:true },
              { ch:'Webhook', icon:'🔗', desc:'POST to custom endpoint for integrations', on:false },
              { ch:'Weekly Report', icon:'📊', desc:'Comprehensive weekly health summary', on:true },
            ].map(c=>(
              <div key={c.ch} style={S.elevated}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'20px' }}>{c.icon}</span>
                  <span style={{ ...S.badge(c.on?'green':'yellow'), fontSize:'10px' }}>{c.on?'ON':'OFF'}</span>
                </div>
                <div style={{ color:'#fafafa', fontWeight:600, fontSize:'13px', marginTop:'6px' }}>{c.ch}</div>
                <div style={{ color:'#a1a1aa', fontSize:'11px', marginTop:'4px' }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Lead Scoring ─────────────────────────────────────────────────── */
  if (tab === 'lead-scoring') {
    return (
      <div>
        <div style={S.h1}>Contact & Lead Scoring</div>
        <p style={S.muted}>Automatically score contacts based on engagement signals, purchase behavior, and profile completeness to prioritize outreach.</p>
        <div style={S.grid4}>
          <StatCard label="Avg Score" value="64" sub="Out of 100" color="#8b5cf6" />
          <StatCard label="Hot Leads (80+)" value="892" sub="Ready to convert" color="#ef4444" />
          <StatCard label="Warm Leads (50–79)" value="3,120" sub="Nurture sequence" color="#f59e0b" />
          <StatCard label="Cold Leads (<50)" value="5,430" sub="Re-engage or sunset" color="#3b82f6" />
        </div>
        {/* Scoring rules */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Scoring Rules</div>
          <p style={{ color:'#a1a1aa', fontSize:'13px', marginBottom:'12px' }}>Points are added or deducted based on real-time customer actions.</p>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Action</th><th style={S.th}>Points</th><th style={S.th}>Category</th><th style={S.th}>Decay</th></tr></thead>
            <tbody>
              {[
                { action:'Opens email', pts:'+2', cat:'Engagement', decay:'7 days' },
                { action:'Clicks email link', pts:'+5', cat:'Engagement', decay:'14 days' },
                { action:'Visits product page', pts:'+3', cat:'Browsing', decay:'7 days' },
                { action:'Adds to cart', pts:'+10', cat:'Purchase Intent', decay:'3 days' },
                { action:'Completes purchase', pts:'+25', cat:'Revenue', decay:'90 days' },
                { action:'Submits form', pts:'+8', cat:'Engagement', decay:'30 days' },
                { action:'Unsubscribes', pts:'-50', cat:'Negative', decay:'Never' },
                { action:'Marks as spam', pts:'-100', cat:'Negative', decay:'Never' },
                { action:'No activity 30d', pts:'-10', cat:'Decay', decay:'Monthly' },
                { action:'Refers a friend', pts:'+15', cat:'Advocacy', decay:'60 days' },
              ].map((r,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #27272a' }}>
                  <td style={S.td}>{r.action}</td>
                  <td style={S.td}><span style={{ color:r.pts.startsWith('+')?'#22c55e':'#ef4444', fontWeight:700 }}>{r.pts}</span></td>
                  <td style={S.td}><span style={S.badge(r.cat==='Negative'?'red':r.cat==='Revenue'?'green':'blue')}>{r.cat}</span></td>
                  <td style={S.td}><span style={{ color:'#71717a' }}>{r.decay}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Score distribution */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Score Distribution</div>
          <div style={{ display:'flex', gap:'4px', alignItems:'flex-end', height:'120px', marginTop:'8px' }}>
            {[
              { range:'0–10', pct:8, color:'#3f3f46' },
              { range:'11–20', pct:12, color:'#3f3f46' },
              { range:'21–30', pct:15, color:'#3b82f6' },
              { range:'31–40', pct:18, color:'#3b82f6' },
              { range:'41–50', pct:14, color:'#f59e0b' },
              { range:'51–60', pct:11, color:'#f59e0b' },
              { range:'61–70', pct:9, color:'#f59e0b' },
              { range:'71–80', pct:6, color:'#22c55e' },
              { range:'81–90', pct:4, color:'#ef4444' },
              { range:'91–100', pct:3, color:'#ef4444' },
            ].map(b=>(
              <div key={b.range} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                <div style={{ width:'100%', background:b.color, borderRadius:'3px 3px 0 0', height:`${b.pct*5}px` }} title={`${b.pct}%`} />
                <div style={{ fontSize:'10px', color:'#71717a' }}>{b.range}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Score-based automations */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Score-Triggered Automations</div>
          <div style={S.grid3}>
            {[
              { threshold:'Score reaches 80+', action:'Move to "Hot Lead" segment → Sales alert email', icon:'🔥', on:true },
              { threshold:'Score drops below 30', action:'Enter sunset re-engagement flow', icon:'💤', on:true },
              { threshold:'Score increases 20+ in 7d', action:'Send personalized offer email', icon:'📈', on:false },
              { threshold:'Score = 100 (max)', action:'VIP upgrade + exclusive access', icon:'🏆', on:true },
              { threshold:'Negative score event', action:'Suppress from campaigns immediately', icon:'🛑', on:true },
              { threshold:'First score above 50', action:'Welcome to loyalty program invite', icon:'⭐', on:false },
            ].map(a=>(
              <div key={a.threshold} style={S.elevated}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'20px' }}>{a.icon}</span>
                  <span style={{ ...S.badge(a.on?'green':'yellow'), fontSize:'10px' }}>{a.on?'Active':'Off'}</span>
                </div>
                <div style={{ color:'#fafafa', fontWeight:600, fontSize:'13px', marginTop:'6px' }}>{a.threshold}</div>
                <div style={{ color:'#a1a1aa', fontSize:'11px', marginTop:'4px' }}>{a.action}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Product Catalog / Analysis ───────────────────────────────────── */
  if (tab === 'product-catalog') {
    return (
      <div>
        <div style={S.h1}>Product Catalog & Analysis</div>
        <p style={S.muted}>Track which products drive email revenue, when to upsell, and catalog performance across campaigns.</p>
        <div style={S.grid4}>
          <StatCard label="Synced Products" value="1,248" sub="From Shopify catalog" color="#8b5cf6" />
          <StatCard label="Featured in Emails" value="342" sub="27.4% of catalog" color="#3b82f6" />
          <StatCard label="Email-Attributed Sales" value="$182K" sub="Last 30 days" color="#22c55e" />
          <StatCard label="Top Product Rev" value="$14.2K" sub="Organic Face Serum" color="#f59e0b" />
        </div>
        {/* Top products by email revenue */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Top Products by Email Revenue</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Product</th><th style={S.th}>Email Revenue</th><th style={S.th}>Units Sold</th><th style={S.th}>Emails Featuring</th><th style={S.th}>Conv. Rate</th><th style={S.th}>Repeat Purchase</th></tr></thead>
            <tbody>
              {[
                { name:'Organic Face Serum', rev:'$14,200', units:284, emails:18, conv:'12.4%', repeat:'34%' },
                { name:'Limited Sneakers', rev:'$12,800', units:128, emails:12, conv:'8.7%', repeat:'18%' },
                { name:'Cashmere Sweater', rev:'$9,450', units:63, emails:8, conv:'15.2%', repeat:'22%' },
                { name:'Chef Knife Set', rev:'$8,200', units:41, emails:6, conv:'18.9%', repeat:'8%' },
                { name:'Wireless Earbuds', rev:'$7,340', units:122, emails:14, conv:'6.2%', repeat:'42%' },
                { name:'Yoga Mat Premium', rev:'$5,990', units:100, emails:9, conv:'9.1%', repeat:'15%' },
              ].map((p,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #27272a' }}>
                  <td style={S.td}><span style={{ fontWeight:600, color:'#fafafa' }}>{p.name}</span></td>
                  <td style={S.td}><span style={{ color:'#22c55e', fontWeight:600 }}>{p.rev}</span></td>
                  <td style={S.td}>{p.units}</td>
                  <td style={S.td}>{p.emails}</td>
                  <td style={S.td}><span style={{ color:'#3b82f6' }}>{p.conv}</span></td>
                  <td style={S.td}>{p.repeat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Product performance insights */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Catalog Insights</div>
          <div style={S.grid3}>
            {[
              { label:'Best Cross-Sell Pair', value:'Face Serum + Moisturizer', stat:'32% bought together', icon:'🔗' },
              { label:'Highest Email CTR', value:'Limited Sneakers', stat:'18.4% click rate', icon:'👆' },
              { label:'Best Upsell Window', value:'Day 7 post-purchase', stat:'3.2x more likely to buy', icon:'📅' },
              { label:'Fastest Growing', value:'Yoga Mat Premium', stat:'+142% email revenue MoM', icon:'📈' },
              { label:'Needs Promotion', value:'Bluetooth Speaker', stat:'Low email exposure (2 campaigns)', icon:'📣' },
              { label:'Seasonal Peak', value:'Cashmere Sweater', stat:'Best in Oct–Dec (4x revenue)', icon:'🗓️' },
            ].map(i=>(
              <div key={i.label} style={S.elevated}>
                <div style={{ fontSize:'20px', marginBottom:'6px' }}>{i.icon}</div>
                <div style={{ color:'#fafafa', fontWeight:600, fontSize:'13px' }}>{i.label}</div>
                <div style={{ color:'#8b5cf6', fontSize:'12px', marginTop:'4px' }}>{i.value}</div>
                <div style={{ color:'#a1a1aa', fontSize:'11px', marginTop:'4px' }}>{i.stat}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Catalog sync status */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Catalog Sync</div>
          <div style={S.grid4}>
            <div style={S.elevated}>
              <div style={{ color:'#22c55e', fontSize:'20px' }}>✓</div>
              <div style={{ color:'#fafafa', fontWeight:600, fontSize:'13px', marginTop:'4px' }}>Shopify Connected</div>
              <div style={{ color:'#a1a1aa', fontSize:'11px', marginTop:'4px' }}>Last sync: 12 min ago</div>
            </div>
            <div style={S.elevated}>
              <div style={{ color:'#fafafa', fontSize:'18px', fontWeight:700 }}>1,248</div>
              <div style={{ color:'#a1a1aa', fontSize:'12px', marginTop:'2px' }}>Products synced</div>
            </div>
            <div style={S.elevated}>
              <div style={{ color:'#fafafa', fontSize:'18px', fontWeight:700 }}>42</div>
              <div style={{ color:'#a1a1aa', fontSize:'12px', marginTop:'2px' }}>Collections</div>
            </div>
            <div style={S.elevated}>
              <div style={{ color:'#f59e0b', fontSize:'18px', fontWeight:700 }}>8</div>
              <div style={{ color:'#a1a1aa', fontSize:'12px', marginTop:'2px' }}>Out of stock</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── RFM Analysis ─────────────────────────────────────────────────── */
  if (tab === 'rfm-analysis') {
    return (
      <div>
        <div style={S.h1}>RFM Analysis</div>
        <p style={S.muted}>Group customers by Recency, Frequency, and Monetary value to identify Champions, At-Risk buyers, and reactivation targets.</p>
        <div style={S.grid4}>
          <StatCard label="Champions" value="1,240" sub="Recent, frequent, high spend" color="#22c55e" />
          <StatCard label="Loyal Customers" value="2,680" sub="Frequent buyers" color="#3b82f6" />
          <StatCard label="At Risk" value="890" sub="Haven't bought recently" color="#f59e0b" />
          <StatCard label="Hibernating" value="1,560" sub="Inactive 90d+" color="#ef4444" />
        </div>
        {/* RFM segment grid */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>RFM Segments</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Segment</th><th style={S.th}>Recency</th><th style={S.th}>Frequency</th><th style={S.th}>Monetary</th><th style={S.th}>Customers</th><th style={S.th}>% of Total</th><th style={S.th}>Recommended Action</th></tr></thead>
            <tbody>
              {[
                { seg:'Champions', r:'5', f:'5', m:'5', cust:1240, pct:'13.2%', action:'Reward with exclusive access', color:'#22c55e' },
                { seg:'Loyal Customers', r:'4', f:'4-5', m:'4-5', cust:2680, pct:'28.5%', action:'Upsell premium products', color:'#3b82f6' },
                { seg:'Potential Loyalists', r:'4-5', f:'2-3', m:'2-3', cust:1420, pct:'15.1%', action:'Loyalty program invite', color:'#8b5cf6' },
                { seg:'New Customers', r:'5', f:'1', m:'1-2', cust:680, pct:'7.2%', action:'Onboarding + welcome series', color:'#06b6d4' },
                { seg:'Promising', r:'3-4', f:'1-2', m:'1-2', cust:520, pct:'5.5%', action:'Engage with value content', color:'#14b8a6' },
                { seg:'Need Attention', r:'3', f:'3', m:'3', cust:740, pct:'7.9%', action:'Re-engagement campaign', color:'#f59e0b' },
                { seg:'About to Sleep', r:'2-3', f:'1-2', m:'1-2', cust:410, pct:'4.4%', action:'Win-back with incentive', color:'#f97316' },
                { seg:'At Risk', r:'2', f:'3-4', m:'3-4', cust:890, pct:'9.5%', action:'Urgent win-back + discount', color:'#ef4444' },
                { seg:'Can\u2019t Lose Them', r:'1-2', f:'4-5', m:'4-5', cust:320, pct:'3.4%', action:'Personal outreach', color:'#dc2626' },
                { seg:'Hibernating', r:'1', f:'1-2', m:'1-2', cust:1560, pct:'5.3%', action:'Sunset or reactivation flow', color:'#71717a' },
              ].map((r,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #27272a' }}>
                  <td style={S.td}><span style={{ color:r.color, fontWeight:700 }}>{r.seg}</span></td>
                  <td style={S.td}>{r.r}</td>
                  <td style={S.td}>{r.f}</td>
                  <td style={S.td}>{r.m}</td>
                  <td style={S.td}><span style={{ fontWeight:600 }}>{r.cust.toLocaleString()}</span></td>
                  <td style={S.td}>{r.pct}</td>
                  <td style={S.td}><span style={{ color:'#a1a1aa', fontSize:'12px' }}>{r.action}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* RFM score breakdown */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Score Distribution</div>
          <div style={S.grid3}>
            {[
              { dim:'Recency', desc:'Days since last purchase', scores:['1-2: 60+ days ago','3: 30-60 days','4: 14-30 days','5: Last 14 days'], icon:'📅' },
              { dim:'Frequency', desc:'Number of orders total', scores:['1: 1 order','2: 2 orders','3: 3-5 orders','4-5: 6+ orders'], icon:'🔄' },
              { dim:'Monetary', desc:'Total lifetime spend', scores:['1: Under $50','2: $50-150','3: $150-500','4-5: $500+'], icon:'💰' },
            ].map(d=>(
              <div key={d.dim} style={S.elevated}>
                <div style={{ fontSize:'20px', marginBottom:'6px' }}>{d.icon}</div>
                <div style={{ color:'#fafafa', fontWeight:600, fontSize:'14px' }}>{d.dim}</div>
                <div style={{ color:'#a1a1aa', fontSize:'12px', marginTop:'4px' }}>{d.desc}</div>
                <div style={{ marginTop:'8px' }}>
                  {d.scores.map(s=><div key={s} style={{ color:'#71717a', fontSize:'11px', marginTop:'2px' }}>{s}</div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Email Click Heatmaps ───────────────────────────────────────── */
  if (tab === 'email-heatmaps') {
    return (
      <div>
        <div style={S.h1}>Email Click Heatmaps</div>
        <p style={S.muted}>Visualize where recipients click inside your emails to optimize layout, CTAs, and content placement.</p>
        <div style={S.grid4}>
          <StatCard label="Emails Analyzed" value="156" sub="With click data" color="#8b5cf6" />
          <StatCard label="Total Clicks Tracked" value="84.2K" sub="Last 30 days" color="#3b82f6" />
          <StatCard label="Avg Click Depth" value="42%" sub="Clicks below the fold" color="#f59e0b" />
          <StatCard label="Top CTA Position" value="Hero" sub="38% of all clicks" color="#22c55e" />
        </div>
        {/* Click zone breakdown */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Click Zone Analysis</div>
          <p style={{ color:'#a1a1aa', fontSize:'13px', marginBottom:'12px' }}>Aggregated click patterns across your recent campaigns showing where subscribers engage most.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {[
              { zone:'Header / Logo', pct:8, clicks:'6.7K', color:'#3f3f46' },
              { zone:'Hero Image / Banner', pct:38, clicks:'32K', color:'#22c55e' },
              { zone:'Primary CTA Button', pct:24, clicks:'20.2K', color:'#3b82f6' },
              { zone:'Product Grid / Cards', pct:15, clicks:'12.6K', color:'#8b5cf6' },
              { zone:'Secondary Links', pct:9, clicks:'7.6K', color:'#f59e0b' },
              { zone:'Footer / Unsubscribe', pct:4, clicks:'3.4K', color:'#ef4444' },
              { zone:'Social Media Icons', pct:2, clicks:'1.7K', color:'#71717a' },
            ].map(z=>(
              <div key={z.zone} style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'140px', fontSize:'13px', color:'#fafafa', flexShrink:0 }}>{z.zone}</div>
                <div style={{ flex:1, height:'24px', background:'#27272a', borderRadius:'4px', overflow:'hidden', position:'relative' }}>
                  <div style={{ width:`${z.pct}%`, height:'100%', background:z.color, borderRadius:'4px', transition:'width 0.3s' }} />
                  <span style={{ position:'absolute', right:'8px', top:'3px', fontSize:'11px', color:'#a1a1aa' }}>{z.pct}%</span>
                </div>
                <div style={{ width:'60px', fontSize:'12px', color:'#71717a', textAlign:'right' }}>{z.clicks}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Per-campaign heatmap data */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Campaign Click Data</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Campaign</th><th style={S.th}>Total Clicks</th><th style={S.th}>Unique Clicks</th><th style={S.th}>Top Clicked Element</th><th style={S.th}>Click-to-Open</th><th style={S.th}>Scroll Depth</th></tr></thead>
            <tbody>
              {[
                { name:'Summer Flash Sale', total:'12,480', unique:'8,320', top:'Hero CTA Button', cto:'18.4%', scroll:'62%' },
                { name:'New Arrivals Weekly', total:'8,640', unique:'5,920', top:'Product Image #1', cto:'14.2%', scroll:'55%' },
                { name:'VIP Exclusive Access', total:'6,200', unique:'4,100', top:'Unlock Access Button', cto:'22.1%', scroll:'71%' },
                { name:'Cart Recovery #3', total:'4,800', unique:'3,600', top:'Complete Purchase CTA', cto:'28.6%', scroll:'45%' },
                { name:'Monthly Newsletter', total:'3,200', unique:'2,100', top:'Read More Link', cto:'8.9%', scroll:'38%' },
              ].map((c,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #27272a' }}>
                  <td style={S.td}><span style={{ fontWeight:600, color:'#fafafa' }}>{c.name}</span></td>
                  <td style={S.td}>{c.total}</td>
                  <td style={S.td}>{c.unique}</td>
                  <td style={S.td}><span style={{ color:'#8b5cf6' }}>{c.top}</span></td>
                  <td style={S.td}><span style={{ color:'#22c55e', fontWeight:600 }}>{c.cto}</span></td>
                  <td style={S.td}>{c.scroll}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Optimization insights */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Heatmap Insights</div>
          <div style={S.grid3}>
            {[
              { insight:'Move Primary CTA Higher', detail:'38% of clicks happen in the hero zone — keep your main CTA above the fold', icon:'⬆️', priority:'High' },
              { insight:'Reduce Footer Links', detail:'Only 4% of clicks reach the footer — simplify to unsubscribe + essential links', icon:'✂️', priority:'Medium' },
              { insight:'Larger Product Images', detail:'Product cards get 15% of clicks — larger images with click zones boost engagement', icon:'🖼️', priority:'Medium' },
              { insight:'Add Anchor Links', detail:'Scroll depth averages 52% — add anchor navigation for longer emails', icon:'🔗', priority:'Low' },
              { insight:'Social Icons Underperform', detail:'Only 2% click social icons — consider removing or repositioning', icon:'📊', priority:'Low' },
              { insight:'A/B Test CTA Color', detail:'Primary CTA accounts for 24% of clicks — test contrasting colors for lift', icon:'🎨', priority:'High' },
            ].map(i=>(
              <div key={i.insight} style={S.elevated}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'18px' }}>{i.icon}</span>
                  <span style={S.badge(i.priority==='High'?'red':i.priority==='Medium'?'yellow':'blue')}>{i.priority}</span>
                </div>
                <div style={{ color:'#fafafa', fontWeight:600, fontSize:'13px', marginTop:'6px' }}>{i.insight}</div>
                <div style={{ color:'#a1a1aa', fontSize:'11px', marginTop:'4px' }}>{i.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tab === 'funnel-analysis') {
    const funnelSteps = [
      { step:'Email Delivered', count:50000, pct:'100%', drop:null, color:'#3b82f6' },
      { step:'Email Opened', count:21500, pct:'43.0%', drop:'57.0%', color:'#8b5cf6' },
      { step:'Link Clicked', count:6450, pct:'12.9%', drop:'70.0%', color:'#f59e0b' },
      { step:'Product Viewed', count:3870, pct:'7.7%', drop:'40.0%', color:'#22c55e' },
      { step:'Added to Cart', count:1548, pct:'3.1%', drop:'60.0%', color:'#ef4444' },
      { step:'Purchase Completed', count:697, pct:'1.4%', drop:'55.0%', color:'#ec4899' },
    ];
    const funnelComparisons = [
      { funnel:'Welcome Series', convRate:'2.8%', totalRevenue:'$12,400', avgTime:'3.2 days' },
      { funnel:'Abandoned Cart', convRate:'5.1%', totalRevenue:'$28,900', avgTime:'1.8 days' },
      { funnel:'Re-engagement', convRate:'1.2%', totalRevenue:'$4,200', avgTime:'7.4 days' },
      { funnel:'Product Launch', convRate:'3.6%', totalRevenue:'$18,700', avgTime:'2.1 days' },
    ];
    return (
      <div>
        <div style={S.title}>Funnel Analysis</div>
        <p style={S.subtitle}>Visualize subscriber journeys from delivery to conversion and identify drop-off points to optimize at every stage.</p>
        <div style={S.grid4}>
          <StatCard label="Emails Delivered" value="50K" color="#3b82f6" />
          <StatCard label="Total Conversions" value="697" color="#22c55e" />
          <StatCard label="Conversion Rate" value="1.4%" color="#f59e0b" />
          <StatCard label="Revenue per Email" value="$0.57" color="#8b5cf6" />
        </div>
        {/* Funnel Visualization */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Conversion Funnel</div>
          {funnelSteps.map((s,i)=>(
            <div key={s.step} style={{ display:'flex', alignItems:'center', marginBottom:'8px' }}>
              <div style={{ width:'160px', color:'#a1a1aa', fontSize:'13px' }}>{s.step}</div>
              <div style={{ flex:1, position:'relative', height:'32px', background:'#27272a', borderRadius:'6px', overflow:'hidden' }}>
                <div style={{ width:s.pct, height:'100%', background:s.color+'88', borderRadius:'6px', transition:'width 0.3s' }} />
                <span style={{ position:'absolute', left:'8px', top:'6px', color:'#fafafa', fontSize:'13px', fontWeight:600 }}>{s.count.toLocaleString()}</span>
              </div>
              <div style={{ width:'80px', textAlign:'right', color:'#fafafa', fontSize:'13px', fontWeight:600 }}>{s.pct}</div>
              <div style={{ width:'80px', textAlign:'right', color:s.drop?'#ef4444':'#71717a', fontSize:'12px' }}>{s.drop ? `\u2193${s.drop}` : '\u2014'}</div>
            </div>
          ))}
        </div>
        {/* Funnel Comparisons */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Funnel Comparisons</div>
          <table style={S.table}>
            <thead><tr>{['Funnel','Conv. Rate','Total Revenue','Avg Time to Convert'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {funnelComparisons.map(f=>(
                <tr key={f.funnel}>
                  <td style={S.td}>{f.funnel}</td>
                  <td style={S.td}><span style={S.badge('#22c55e')}>{f.convRate}</span></td>
                  <td style={S.td}>{f.totalRevenue}</td>
                  <td style={S.td}>{f.avgTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Drop-off Insights */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Drop-off Insights</div>
          <div style={S.grid3}>
            {[
              { insight:'Biggest Drop: Open \u2192 Click', detail:'70% of openers don\u2019t click \u2014 improve CTA placement and copy', icon:'\u{1F6A8}', priority:'High' },
              { insight:'Cart \u2192 Purchase Bottleneck', detail:'55% abandon at checkout \u2014 add urgency & free shipping threshold', icon:'\u{1F6D2}', priority:'High' },
              { insight:'Improve Open Rate', detail:'57% never open \u2014 A/B test subject lines and send times', icon:'\u{1F4E7}', priority:'Medium' },
              { insight:'Product View to Cart', detail:'60% view but don\u2019t add to cart \u2014 try social proof elements', icon:'\u{1F50D}', priority:'Medium' },
              { insight:'Mobile vs Desktop', detail:'Mobile users convert 40% less \u2014 optimize mobile email layout', icon:'\u{1F4F1}', priority:'Medium' },
              { insight:'Segment by Engagement', detail:'Create funnel segments for targeted re-engagement flows', icon:'\u{1F3AF}', priority:'Low' },
            ].map(i=>(
              <div key={i.insight} style={S.elevated}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'18px' }}>{i.icon}</span>
                  <span style={S.badge(i.priority==='High'?'red':i.priority==='Medium'?'yellow':'blue')}>{i.priority}</span>
                </div>
                <div style={{ color:'#fafafa', fontWeight:600, fontSize:'13px', marginTop:'6px' }}>{i.insight}</div>
                <div style={{ color:'#a1a1aa', fontSize:'11px', marginTop:'4px' }}>{i.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tab === 'cohort-analysis') {
    const cohortMonths = ['Jan','Feb','Mar','Apr','May','Jun'];
    const cohortData = [
      { cohort:'Jan 2025', size:2400, retention:[100,68,52,41,35,30] },
      { cohort:'Feb 2025', size:2850, retention:[100,72,55,44,38,null] },
      { cohort:'Mar 2025', size:3100, retention:[100,70,54,43,null,null] },
      { cohort:'Apr 2025', size:2900, retention:[100,74,58,null,null,null] },
      { cohort:'May 2025', size:3400, retention:[100,71,null,null,null,null] },
      { cohort:'Jun 2025', size:3200, retention:[100,null,null,null,null,null] },
    ];
    const retColor = (v) => {
      if (v===null) return '#18181b';
      if (v>=70) return '#22c55e33';
      if (v>=50) return '#3b82f633';
      if (v>=30) return '#f59e0b33';
      return '#ef444433';
    };
    return (
      <div>
        <div style={S.title}>Cohort Analysis</div>
        <p style={S.subtitle}>Analyze engagement and retention trends by subscriber acquisition cohort over time.</p>
        <div style={S.grid4}>
          <StatCard label="Avg 30-Day Retention" value="71%" color="#22c55e" />
          <StatCard label="Avg 90-Day Retention" value="53%" color="#3b82f6" />
          <StatCard label="Best Cohort" value="Feb 2025" color="#8b5cf6" />
          <StatCard label="Avg Cohort Size" value="2,975" color="#f59e0b" />
        </div>
        {/* Cohort Retention Table */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Retention by Cohort (% still engaged)</div>
          <div style={{ overflowX:'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Cohort</th>
                  <th style={S.th}>Size</th>
                  {cohortMonths.map((m,i)=><th key={m} style={S.th}>Month {i}</th>)}
                </tr>
              </thead>
              <tbody>
                {cohortData.map(c=>(
                  <tr key={c.cohort}>
                    <td style={S.td}>{c.cohort}</td>
                    <td style={S.td}>{c.size.toLocaleString()}</td>
                    {c.retention.map((r,i)=>(
                      <td key={i} style={{ ...S.td, background:retColor(r), fontWeight:r!==null?600:400, color:r!==null?'#fafafa':'#3f3f46', textAlign:'center' }}>
                        {r !== null ? r+'%' : '\u2014'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Cohort Metrics */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Cohort Performance Metrics</div>
          <table style={S.table}>
            <thead><tr>{['Cohort','Avg CLV','Purchase Rate','Avg Orders','Churn Rate'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {[
                { cohort:'Jan 2025', clv:'$84.20', purchaseRate:'12.4%', orders:'1.8', churn:'8.2%' },
                { cohort:'Feb 2025', clv:'$91.50', purchaseRate:'14.1%', orders:'2.1', churn:'6.8%' },
                { cohort:'Mar 2025', clv:'$78.30', purchaseRate:'11.8%', orders:'1.6', churn:'9.1%' },
                { cohort:'Apr 2025', clv:'$95.10', purchaseRate:'15.2%', orders:'2.3', churn:'5.9%' },
                { cohort:'May 2025', clv:'$88.70', purchaseRate:'13.5%', orders:'1.9', churn:'7.4%' },
                { cohort:'Jun 2025', clv:'$82.40', purchaseRate:'12.0%', orders:'1.5', churn:'8.8%' },
              ].map(c=>(
                <tr key={c.cohort}>
                  <td style={S.td}>{c.cohort}</td>
                  <td style={S.td}>{c.clv}</td>
                  <td style={S.td}><span style={S.badge('#22c55e')}>{c.purchaseRate}</span></td>
                  <td style={S.td}>{c.orders}</td>
                  <td style={S.td}><span style={S.badge('#ef4444')}>{c.churn}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Trend Insights */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Cohort Trends</div>
          <div style={S.grid3}>
            {[
              { trend:'Retention Improving', detail:'Month-1 retention up 6% over last 3 cohorts', icon:'\u{1F4C8}', signal:'positive' },
              { trend:'CLV Growing', detail:'Average CLV increased 13% since Jan cohort', icon:'\u{1F4B0}', signal:'positive' },
              { trend:'Churn Decreasing', detail:'Churn rate dropped from 8.2% to 5.9% in 4 months', icon:'\u{1F4C9}', signal:'positive' },
              { trend:'Feb Best Cohort', detail:'Highest retention, CLV and purchase rate across all metrics', icon:'\u{1F3C6}', signal:'highlight' },
              { trend:'Larger Cohorts Convert More', detail:'Cohorts over 3K subscribers show 8% higher engagement', icon:'\u{1F465}', signal:'neutral' },
              { trend:'Seasonality Effect', detail:'Q1 cohorts show 15% higher 90-day retention than Q2', icon:'\u{1F324}\uFE0F', signal:'neutral' },
            ].map(t=>(
              <div key={t.trend} style={S.elevated}>
                <div style={{ fontSize:'18px', marginBottom:'6px' }}>{t.icon}</div>
                <div style={{ color:'#fafafa', fontWeight:600, fontSize:'13px' }}>{t.trend}</div>
                <div style={{ color:'#a1a1aa', fontSize:'11px', marginTop:'4px' }}>{t.detail}</div>
                <div style={{ marginTop:'6px' }}><span style={S.badge(t.signal==='positive'?'#22c55e':t.signal==='highlight'?'#8b5cf6':'#3b82f6')}>{t.signal}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Conversion Goals ────────────────────────────────────────────── */
  if (tab === 'conversion-goals') {
    return (
      <div>
        <SectionTitle>Conversion Goals</SectionTitle>
        <p style={S.desc}>Define target actions for each campaign and measure success against specific conversion goals — purchases, signups, page views, or custom events.</p>
        <div style={S.grid3}>
          <StatCard label="Active Goals" value="8" sub="Across all campaigns" color="#8b5cf6" />
          <StatCard label="Goal Completion Rate" value="12.4%" sub="+2.1% this month" color="#22c55e" />
          <StatCard label="Attributed Revenue" value="$48,290" sub="From goal conversions" color="#f59e0b" />
        </div>
        <h4 style={S.h4}>Campaign Goals</h4>
        <table style={S.table}>
          <thead><tr>{['Goal Name','Type','Campaign','Target','Actual','Completion','Status'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {[
              ['First Purchase','Purchase','Welcome Series','500','487','97.4%','\u{1F7E2} On Track'],
              ['Newsletter Signup','Form Submit','Blog Digest','1,000','1,247','124.7%','\u2705 Exceeded'],
              ['Product Page View','Page Visit','Flash Sale','5,000','3,890','77.8%','\u{1F7E1} Behind'],
              ['App Download','Custom Event','Loyalty Promo','300','312','104.0%','\u2705 Exceeded'],
              ['Review Submit','Custom Event','Post-Purchase','200','156','78.0%','\u{1F7E1} Behind'],
              ['Repeat Purchase','Purchase','Win-back Flow','150','89','59.3%','\u{1F534} At Risk'],
            ].map(r=><tr key={r[0]}>{r.map((c,i)=><td key={i} style={S.td}>{c}</td>)}</tr>)}
          </tbody>
        </table>
        <h4 style={S.h4}>Goal Attribution Window</h4>
        <div style={S.grid3}>
          {[
            { window:'Click-Through', value:'7 days', desc:'Conversion attributed if subscriber clicked email link within this window' },
            { window:'View-Through', value:'24 hours', desc:'Conversion attributed if subscriber opened email but didn\u2019t click' },
            { window:'Multi-Touch', value:'Linear', desc:'Credit distributed equally across all email touchpoints in the journey' },
          ].map(w=>(
            <div key={w.window} style={S.elevated}>
              <div style={{ color:'#fafafa', fontWeight:600, fontSize:'13px' }}>{w.window}</div>
              <div style={{ color:'#8b5cf6', fontSize:'18px', fontWeight:700, marginTop:'6px' }}>{w.value}</div>
              <div style={{ color:'#71717a', fontSize:'11px', marginTop:'4px' }}>{w.desc}</div>
            </div>
          ))}
        </div>
        <h4 style={S.h4}>Goal Funnel Visualization</h4>
        <div style={{ ...S.card, padding:'16px' }}>
          {[
            { step:'Email Sent', count:'45,200', pct:'100%', width:'100%' },
            { step:'Email Opened', count:'19,836', pct:'43.9%', width:'44%' },
            { step:'Link Clicked', count:'4,462', pct:'9.9%', width:'10%' },
            { step:'Goal Page Visited', count:'2,891', pct:'6.4%', width:'6.4%' },
            { step:'Goal Completed', count:'1,247', pct:'2.8%', width:'2.8%' },
          ].map(s=>(
            <div key={s.step} style={{ marginBottom:'10px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                <span style={{ color:'#fafafa', fontSize:'13px' }}>{s.step}</span>
                <span style={{ color:'#a1a1aa', fontSize:'12px' }}>{s.count} ({s.pct})</span>
              </div>
              <div style={{ background:'#27272a', borderRadius:'4px', height:'8px' }}>
                <div style={{ background:'linear-gradient(90deg,#8b5cf6,#6d28d9)', borderRadius:'4px', height:'8px', width:s.width, transition:'width 0.5s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// ─── TESTING ──────────────────────────────────────────────────────────────────
function TestingMgmt({ tab }) {
  const [tests, setTests] = useState([]);
  const [msg, setMsg] = useState('');
  const [freqResult, setFreqResult] = useState(null);
  const [contentVariants, setContentVariants] = useState([]);
  const [contentTopic, setContentTopic] = useState('');
  const [newTest, setNewTest] = useState({ name:'', variants:[] });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  async function aiGenTest(type) {
    setAiLoading(true); setAiResult(null);
    try {
      const d = await apiFetch('/ai/content/generate', { method:'POST', body: JSON.stringify({ type: 'ab-test', prompt: `Suggest an A/B test configuration for email marketing: ${type}`, tone:'analytical' }) });
      setAiResult(d.content || d.text || JSON.stringify(d));
    } catch(e) { setAiResult('Error: ' + e.message); }
    setAiLoading(false);
  }

  const load = useCallback(async () => {
    try {
      const d = await apiFetch('/ab-tests'); setTests(d.tests || d || []);
    } catch(e) { setMsg(e.message); }
  }, []);

  useEffect(() => {
    if (['abtests','experiments','results'].includes(tab)) load();
  }, [tab, load]);

  async function startTest(id) {
    try { await apiFetch(`/ab-tests/${id}/start`,{method:'POST'}); load(); }
    catch(e) { setMsg(e.message); }
  }

  async function stopTest(id) {
    try { await apiFetch(`/ab-tests/${id}/stop`,{method:'POST'}); load(); }
    catch(e) { setMsg(e.message); }
  }

  async function getFreqRec() {
    try { const d = await apiFetch('/optimization/frequency/recommend',{method:'POST',body:JSON.stringify({segmentId:'all'})}); setFreqResult(d); }
    catch(e) { setMsg(e.message); }
  }

  async function generateVariants() {
    try {
      const d = await apiFetch('/ai/subject-lines/generate',{method:'POST',body:JSON.stringify({topic:contentTopic, count:3})});
      setContentVariants(d.subjectLines || d.variants || []);
    } catch(e) { setMsg(e.message); }
  }

  if (tab === 'abtests') return (
    <div>
      <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'16px' }}>
        <div style={S.title}>A/B Tests</div>
        <AIGenButton label="AI Suggest Test" credits={2} loading={aiLoading} onClick={() => aiGenTest('subject line and send time optimization')} />
      </div>
      <Msg text={msg} type={msg.includes('rror')?'error':'ok'} />
      {aiResult && <AIResultCard result={aiResult} title="AI Test Suggestion" onClose={() => setAiResult(null)} />}
      <table style={S.table}>
        <thead><tr>{['Name','Status','Winner Metric','Actions'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>
          {(tests.length ? tests : []).map(t => (
            <tr key={t.id||t._id}>
              <td style={S.td}>{t.name}</td>
              <td style={S.td}><span style={S.badge(t.status==='running'?'#22c55e':t.status==='completed'?'#a1a1aa':'#f59e0b')}>{t.status||'draft'}</span></td>
              <td style={S.td}>{t.winnerMetric||t.metric||'open_rate'}</td>
              <td style={S.td}>
                <div style={S.row}>
                  {t.status!=='running' && <button style={S.btnGreen} onClick={()=>startTest(t.id||t._id)}>Start</button>}
                  {t.status==='running' && <button style={S.btnAmber} onClick={()=>stopTest(t.id||t._id)}>Stop</button>}
                </div>
              </td>
            </tr>
          ))}
          {!tests.length && <tr><td style={{ ...S.td, color:'#71717a' }} colSpan={4}>No A/B tests.</td></tr>}
        </tbody>
      </table>
    </div>
  );

  if (tab === 'multivariate') return (
    <div>
      <div style={{ ...S.row, justifyContent:'space-between', marginBottom:'16px' }}>
        <div style={S.title}>Multivariate Testing</div>
        <AIGenButton label="AI Suggest Variables" credits={2} loading={aiLoading} onClick={() => aiGenTest('multivariate test variables and combinations for maximum impact')} />
      </div>
      <p style={S.muted}>Test multiple variables simultaneously to find the best combination.</p>
      <Msg text={msg} type="error" />
      {aiResult && <AIResultCard result={aiResult} title="AI Variable Suggestions" onClose={() => setAiResult(null)} />}
      <div style={{ ...S.card, marginTop:'16px' }}>
        <div style={S.h2}>Create Multivariate Test</div>
        <div style={S.fg}><label style={S.label}>Test Name</label><input style={S.input} placeholder="Q1 Launch Optimization" /></div>
        <div style={S.fg}><label style={S.label}>Variables</label>
          <div style={{ ...S.row, flexWrap:'wrap', gap:'8px' }}>
            {['Subject Line','From Name','Send Time','CTA Button','Hero Image'].map(v => (
              <label key={v} style={{ ...S.elevated, cursor:'pointer', display:'flex', gap:'6px', alignItems:'center' }}>
                <input type="checkbox" style={{ accentColor:'#22c55e' }} /> <span style={{ color:'#fafafa', fontSize:'13px' }}>{v}</span>
              </label>
            ))}
          </div>
        </div>
        <button style={S.btnPrimary} onClick={() => apiFetch('/multivariate-tests',{method:'POST',body:JSON.stringify({name:'Test',variables:[]})}).then(()=>setMsg('Multivariate test created.')).catch(e=>setMsg(e.message))}>Create Test</button>
      </div>
    </div>
  );

  if (tab === 'experiments') return (
    <div>
      <div style={S.title}>Experiments</div>
      <table style={{ ...S.table, marginTop:'16px' }}>
        <thead><tr>{['Name','Type','Status','Confidence','Actions'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>
          {(tests.length ? tests : []).map(t => (
            <tr key={t.id||t._id}>
              <td style={S.td}>{t.name}</td>
              <td style={S.td}>{t.type||'ab'}</td>
              <td style={S.td}><span style={S.badge(t.status==='running'?'#22c55e':t.status==='completed'?'#a1a1aa':'#f59e0b')}>{t.status||'draft'}</span></td>
              <td style={S.td}>{t.confidence ? `${t.confidence}%` : '—'}</td>
              <td style={S.td}><button style={S.btnSm}>View Results</button></td>
            </tr>
          ))}
          {!tests.length && <tr><td style={{ ...S.td, color:'#71717a' }} colSpan={5}>No experiments.</td></tr>}
        </tbody>
      </table>
    </div>
  );

  if (tab === 'frequency') return (
    <div>
      <div style={S.title}>Frequency Optimization</div>
      <p style={S.muted}>Find the ideal send frequency to maximize engagement while minimizing unsubscribes.</p>
      <Msg text={msg} type="error" />
      <div style={{ ...S.grid4, marginTop:'16px', marginBottom:'16px' }}>
        <StatCard label="Current Frequency" value="3.2/wk" />
        <StatCard label="Optimal Frequency" value="2/wk" color="#22c55e" />
        <StatCard label="Fatigue Score" value="62/100" color="#f59e0b" />
        <StatCard label="Unsub Risk" value="Medium" color="#f59e0b" />
      </div>
      <button style={S.btnPrimary} onClick={getFreqRec}>Get AI Frequency Recommendation</button>
      {freqResult && <div style={{ ...S.card, marginTop:'12px' }}><pre style={{ color:'#a1a1aa', fontSize:'13px', whiteSpace:'pre-wrap' }}>{JSON.stringify(freqResult,null,2)}</pre></div>}
    </div>
  );

  if (tab === 'content-testing') return (
    <div>
      <div style={S.title}>Content Testing</div>
      <p style={S.muted}>Generate and compare content variants.</p>
      <Msg text={msg} type="error" />
      <div style={S.fg}><label style={S.label}>Topic / Campaign Goal</label><input style={S.input} value={contentTopic} onChange={e=>setContentTopic(e.target.value)} placeholder="Black Friday sale with 30% off" /></div>
      <button style={S.btnPrimary} onClick={generateVariants}>Generate 3 Variants</button>
      {contentVariants.length > 0 && (
        <div style={{ marginTop:'16px' }}>
          <div style={S.h2}>Generated Variants</div>
          {contentVariants.map((v, i) => (
            <div key={i} style={{ ...S.card, marginBottom:'8px' }}>
              <div style={{ ...S.muted, marginBottom:'4px' }}>Variant {i+1}</div>
              <div style={{ color:'#fafafa' }}>{typeof v === 'string' ? v : JSON.stringify(v)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (tab === 'results') return (
    <div>
      <div style={S.title}>Test Results</div>
      <table style={{ ...S.table, marginTop:'16px' }}>
        <thead><tr>{['Test','Winner','Open Rate Lift','Click Lift','Confidence'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>
          {tests.filter(t=>t.status==='completed').map(t => (
            <tr key={t.id||t._id}>
              <td style={S.td}>{t.name}</td>
              <td style={S.td}>{t.winner||'—'}</td>
              <td style={S.td}>{t.openRateLift ? `+${t.openRateLift}%` : '—'}</td>
              <td style={S.td}>{t.clickLift ? `+${t.clickLift}%` : '—'}</td>
              <td style={S.td}>{t.confidence ? `${t.confidence}%` : '—'}</td>
            </tr>
          ))}
          {!tests.filter(t=>t.status==='completed').length && <tr><td style={{ ...S.td, color:'#71717a' }} colSpan={5}>No completed tests.</td></tr>}
        </tbody>
      </table>
    </div>
  );

  if (tab === 'inbox-preview') {
    const clients = [
      { client:'Gmail (Web)', platform:'Web', status:'pass', issues:0, renderScore:98 },
      { client:'Apple Mail (macOS)', platform:'Desktop', status:'pass', issues:0, renderScore:100 },
      { client:'Outlook 365', platform:'Desktop', status:'warn', issues:2, renderScore:84 },
      { client:'Outlook 2019', platform:'Desktop', status:'warn', issues:3, renderScore:78 },
      { client:'Yahoo Mail', platform:'Web', status:'pass', issues:1, renderScore:92 },
      { client:'Gmail (iOS)', platform:'Mobile', status:'pass', issues:0, renderScore:97 },
      { client:'Apple Mail (iOS)', platform:'Mobile', status:'pass', issues:0, renderScore:100 },
      { client:'Samsung Mail', platform:'Mobile', status:'warn', issues:2, renderScore:85 },
      { client:'Outlook (iOS)', platform:'Mobile', status:'pass', issues:1, renderScore:90 },
      { client:'Thunderbird', platform:'Desktop', status:'pass', issues:0, renderScore:95 },
      { client:'AOL Mail', platform:'Web', status:'pass', issues:0, renderScore:93 },
      { client:'Dark Mode (All)', platform:'Dark Mode', status:'warn', issues:4, renderScore:76 },
    ];
    const commonIssues = [
      { issue:'Outlook Conditional Comments', desc:'Outlook ignores CSS max-width \u2014 use MSO conditionals for table widths', severity:'Medium', clients:'Outlook 365, 2019' },
      { issue:'Dark Mode Color Inversion', desc:'Background and text colors get inverted \u2014 use [data-ogsc] overrides', severity:'High', clients:'Gmail, Apple Mail Dark Mode' },
      { issue:'Image Blocking', desc:'Some clients block images by default \u2014 always add descriptive alt text', severity:'Low', clients:'Outlook, Gmail' },
      { issue:'Samsung Font Rendering', desc:'Custom web fonts fall back to system fonts on Samsung Mail', severity:'Low', clients:'Samsung Mail' },
    ];
    return (
      <div>
        <div style={S.title}>Inbox Preview Testing</div>
        <p style={S.subtitle}>Preview how your emails render across 40+ email clients, devices, and dark mode \u2014 catch issues before you send.</p>
        <div style={S.grid4}>
          <StatCard label="Clients Tested" value="12" color="#3b82f6" />
          <StatCard label="Passing" value="8" color="#22c55e" />
          <StatCard label="Warnings" value="4" color="#f59e0b" />
          <StatCard label="Avg Render Score" value="90.7" color="#8b5cf6" />
        </div>
        {/* Client Grid */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Email Client Results</div>
          <table style={S.table}>
            <thead><tr>{['Client','Platform','Status','Issues','Render Score'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {clients.map(c=>(
                <tr key={c.client}>
                  <td style={S.td}>{c.client}</td>
                  <td style={S.td}><span style={S.badge('#3b82f6')}>{c.platform}</span></td>
                  <td style={S.td}><span style={S.badge(c.status==='pass'?'#22c55e':'#f59e0b')}>{c.status==='pass'?'\u2705 Pass':'\u26A0\uFE0F Warning'}</span></td>
                  <td style={S.td}>{c.issues}</td>
                  <td style={S.td}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <div style={{ flex:1, background:'#3f3f46', borderRadius:'4px', height:'6px' }}>
                        <div style={{ width:`${c.renderScore}%`, background:c.renderScore>=90?'#22c55e':c.renderScore>=80?'#f59e0b':'#ef4444', borderRadius:'4px', height:'6px' }} />
                      </div>
                      <span style={{ fontSize:'13px', fontWeight:600, color:c.renderScore>=90?'#22c55e':c.renderScore>=80?'#f59e0b':'#ef4444' }}>{c.renderScore}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Known Issues */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Common Rendering Issues</div>
          <div style={S.grid2}>
            {commonIssues.map(i=>(
              <div key={i.issue} style={S.elevated}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ color:'#fafafa', fontWeight:600, fontSize:'13px' }}>{i.issue}</span>
                  <span style={S.badge(i.severity==='High'?'#ef4444':i.severity==='Medium'?'#f59e0b':'#3b82f6')}>{i.severity}</span>
                </div>
                <div style={{ color:'#a1a1aa', fontSize:'12px', marginTop:'6px' }}>{i.desc}</div>
                <div style={{ color:'#71717a', fontSize:'11px', marginTop:'6px' }}>Affected: {i.clients}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Preview Features */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Preview Capabilities</div>
          <div style={S.grid3}>
            {[
              { name:'Light & Dark Mode', desc:'See how your email renders in both light and dark modes side-by-side', icon:'\u{1F319}' },
              { name:'Mobile Responsive', desc:'Test responsive breakpoints on iPhone, Android, and tablet viewports', icon:'\u{1F4F1}' },
              { name:'Image Blocking', desc:'Preview with images disabled to verify alt text and fallback backgrounds', icon:'\u{1F5BC}\uFE0F' },
              { name:'Link Validation', desc:'Check all links resolve correctly and track UTM parameter integrity', icon:'\u{1F517}' },
              { name:'Accessibility Check', desc:'Verify color contrast ratios, font sizes, and screen reader compatibility', icon:'\u267F' },
              { name:'Spam Score', desc:'Run pre-send spam checks against SpamAssassin and provider heuristics', icon:'\u{1F6E1}\uFE0F' },
            ].map(f=>(
              <div key={f.name} style={S.elevated}>
                <div style={{ fontSize:'22px', marginBottom:'6px' }}>{f.icon}</div>
                <div style={{ color:'#fafafa', fontWeight:600, fontSize:'14px' }}>{f.name}</div>
                <div style={{ color:'#a1a1aa', fontSize:'12px', marginTop:'4px' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Email Accessibility ─────────────────────────────────────────── */
  if (tab === 'accessibility') {
    return (
      <div>
        <SectionTitle>Email Accessibility Checker</SectionTitle>
        <p style={S.desc}>Ensure your emails are accessible to all subscribers including those using screen readers, assistive technology, or with visual impairments. WCAG 2.1 compliance checking built in.</p>
        <div style={S.grid3}>
          <StatCard label="Accessibility Score" value="87/100" sub="Above industry avg (62)" color="#22c55e" />
          <StatCard label="Issues Found" value="4" sub="2 critical, 2 minor" color="#f59e0b" />
          <StatCard label="Emails Scanned" value="156" sub="Last 30 days" color="#3b82f6" />
        </div>
        <h4 style={S.h4}>Current Campaign Audit</h4>
        <table style={S.table}>
          <thead><tr>{['Issue','Severity','Element','WCAG Rule','Recommendation'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {[
              ['Low contrast text','Critical','\u{1F534}','1.4.3 AA','Body text #71717a on #18181b has 3.8:1 ratio — needs 4.5:1 minimum'],
              ['Missing alt text','Critical','\u{1F534}','1.1.1 A','Hero image banner lacks descriptive alt text for screen readers'],
              ['Small tap target','Minor','\u{1F7E1}','2.5.5 AAA','CTA button is 36x28px — recommend 44x44px minimum for mobile'],
              ['No lang attribute','Minor','\u{1F7E1}','3.1.1 A','HTML tag missing lang="en" attribute for screen reader language'],
            ].map(r=><tr key={r[0]}>{r.map((c,i)=><td key={i} style={S.td}>{c}</td>)}</tr>)}
          </tbody>
        </table>
        <h4 style={S.h4}>Accessibility Checklist</h4>
        <div style={S.grid3}>
          {[
            { check:'Color Contrast', status:'\u26A0\uFE0F Warning', desc:'2 of 8 text/background combinations below 4.5:1 ratio threshold', color:'#f59e0b' },
            { check:'Alt Text Coverage', status:'\u274C Fail', desc:'1 of 6 images missing alt text — critical for screen readers', color:'#ef4444' },
            { check:'Semantic HTML', status:'\u2705 Pass', desc:'Proper heading hierarchy (h1→h2→h3), lists, and table structure', color:'#22c55e' },
            { check:'Font Sizes', status:'\u2705 Pass', desc:'All body text ≥14px, headings ≥18px — readable across devices', color:'#22c55e' },
            { check:'Link Descriptions', status:'\u2705 Pass', desc:'All links have descriptive text (no "click here" or bare URLs)', color:'#22c55e' },
            { check:'Keyboard Navigation', status:'\u2705 Pass', desc:'All interactive elements are focusable and have visible focus indicators', color:'#22c55e' },
            { check:'Dark Mode Support', status:'\u2705 Pass', desc:'Email renders correctly in dark mode with proper color scheme media queries', color:'#22c55e' },
            { check:'Plain Text Version', status:'\u2705 Pass', desc:'Multipart MIME includes well-formatted plain text alternative', color:'#22c55e' },
            { check:'Reading Order', status:'\u2705 Pass', desc:'Content flows logically when CSS is disabled or in linear view', color:'#22c55e' },
          ].map(c=>(
            <div key={c.check} style={S.elevated}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:'#fafafa', fontWeight:600, fontSize:'13px' }}>{c.check}</span>
                <span style={{ color:c.color, fontSize:'12px' }}>{c.status}</span>
              </div>
              <div style={{ color:'#71717a', fontSize:'11px', marginTop:'6px' }}>{c.desc}</div>
            </div>
          ))}
        </div>
        <h4 style={S.h4}>Accessibility Trend</h4>
        <div style={{ ...S.card, padding:'16px' }}>
          <div style={{ display:'flex', gap:'24px', flexWrap:'wrap' }}>
            {[
              { month:'Oct 2025', score:72, issues:11 },
              { month:'Nov 2025', score:78, issues:8 },
              { month:'Dec 2025', score:81, issues:6 },
              { month:'Jan 2026', score:84, issues:5 },
              { month:'Feb 2026', score:87, issues:4 },
            ].map(m=>(
              <div key={m.month} style={{ textAlign:'center', flex:1, minWidth:'80px' }}>
                <div style={{ color:'#22c55e', fontSize:'20px', fontWeight:700 }}>{m.score}</div>
                <div style={{ color:'#fafafa', fontSize:'12px', marginTop:'2px' }}>{m.month}</div>
                <div style={{ color:'#71717a', fontSize:'11px' }}>{m.issues} issues</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Spam & Pre-Send Testing ── */
  if (tab === 'spam-testing') {
    return (
      <div>
        <div style={S.card}>
          <h3 style={S.title}>Spam & Pre-Send Testing</h3>
          <p style={S.subtitle}>Pre-send spam score analysis, link validation, and image checks (SendPulse / Customer.io style)</p>
        </div>
        <div style={S.grid4}>
          <StatCard label="Spam Score" value="2.1/10" color="#22c55e" sub="Low risk" />
          <StatCard label="Link Check" value="12/12" color="#22c55e" sub="All valid" />
          <StatCard label="Image Check" value="8/9" color="#f59e0b" sub="1 missing alt" />
          <StatCard label="Overall Grade" value="A" color="#22c55e" sub="Ready to send" />
        </div>
        <div style={S.card}>
          <h4 style={S.h2}>Spam Content Analysis</h4>
          <div style={{ marginBottom:'12px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
              <span style={{ color:'#fafafa', fontSize:'14px', fontWeight:600 }}>Spam Score: 2.1 / 10</span>
              <span style={S.badge('#22c55e')}>Pass</span>
            </div>
            <div style={{ background:'#27272a', borderRadius:'6px', height:'12px', overflow:'hidden' }}>
              <div style={{ background:'#22c55e', width:'21%', height:'100%', borderRadius:'6px' }} />
            </div>
          </div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Check</th><th style={S.th}>Score</th><th style={S.th}>Status</th><th style={S.th}>Details</th></tr></thead>
            <tbody>
              {[
                { check:'SpamAssassin Score', score:'1.2', status:'pass', detail:'Well below 5.0 threshold' },
                { check:'Subject Line Spam Words', score:'0.0', status:'pass', detail:'No trigger words detected' },
                { check:'Text-to-Image Ratio', score:'0.3', status:'pass', detail:'Good balance (70% text / 30% images)' },
                { check:'Authentication (SPF/DKIM/DMARC)', score:'0.0', status:'pass', detail:'All records properly configured' },
                { check:'Unsubscribe Header', score:'0.0', status:'pass', detail:'List-Unsubscribe header present' },
                { check:'HTML Validation', score:'0.2', status:'warn', detail:'Minor: 2 unclosed tags found' },
                { check:'Blacklist Check', score:'0.0', status:'pass', detail:'IP not listed on any major RBL' },
                { check:'URL Reputation', score:'0.4', status:'pass', detail:'All domains have good reputation' },
              ].map(c=>(
                <tr key={c.check}>
                  <td style={S.td}>{c.check}</td>
                  <td style={S.td}>{c.score}</td>
                  <td style={S.td}><span style={S.badge(c.status==='pass'?'#22c55e':c.status==='warn'?'#f59e0b':'#ef4444')}>{c.status==='pass'?'Pass':c.status==='warn'?'Warning':'Fail'}</span></td>
                  <td style={S.td}><span style={S.muted}>{c.detail}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={S.grid2}>
          <div style={S.card}>
            <h4 style={S.h2}>Link Validation</h4>
            {[
              { url:'https://store.example.com/sale', status:'valid', code:200 },
              { url:'https://store.example.com/products/summer', status:'valid', code:200 },
              { url:'https://store.example.com/unsubscribe?id=...', status:'valid', code:200 },
              { url:'https://store.example.com/track/click/abc', status:'valid', code:301 },
              { url:'https://cdn.example.com/images/hero.jpg', status:'valid', code:200 },
              { url:'https://store.example.com/privacy', status:'valid', code:200 },
            ].map(l=>(
              <div key={l.url} style={{ ...S.elevated, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                <span style={{ color:'#fafafa', fontSize:'12px', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'70%' }}>{l.url}</span>
                <div style={S.row}>
                  <span style={S.muted}>{l.code}</span>
                  <span style={S.badge(l.status==='valid'?'#22c55e':'#ef4444')}>{l.status==='valid'?'\u2713':'\u2717'}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <h4 style={S.h2}>Image Validation</h4>
            {[
              { name:'hero-banner.jpg', size:'124 KB', alt:true, dims:'600x300', status:'ok' },
              { name:'product-1.png', size:'45 KB', alt:true, dims:'200x200', status:'ok' },
              { name:'product-2.png', size:'52 KB', alt:true, dims:'200x200', status:'ok' },
              { name:'logo.svg', size:'8 KB', alt:true, dims:'150x40', status:'ok' },
              { name:'cta-button.png', size:'12 KB', alt:false, dims:'300x60', status:'warn' },
              { name:'social-icons.png', size:'6 KB', alt:true, dims:'200x32', status:'ok' },
            ].map(img=>(
              <div key={img.name} style={{ ...S.elevated, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                <div>
                  <span style={{ color:'#fafafa', fontSize:'12px', fontFamily:'monospace' }}>{img.name}</span>
                  <span style={{ ...S.muted, marginLeft:'8px' }}>{img.size} \u2022 {img.dims}</span>
                </div>
                <div style={S.row}>
                  {!img.alt && <span style={S.badge('#f59e0b')}>No alt text</span>}
                  <span style={S.badge(img.status==='ok'?'#22c55e':'#f59e0b')}>{img.status==='ok'?'\u2713':'!'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <h4 style={S.h2}>Client & Provider Preview</h4>
          <p style={{ ...S.muted, marginBottom:'12px' }}>How your email appears across spam filters at major providers</p>
          <div style={S.grid3}>
            {[
              { provider:'Gmail', verdict:'Inbox', confidence:'98%' },
              { provider:'Outlook', verdict:'Inbox', confidence:'96%' },
              { provider:'Yahoo Mail', verdict:'Inbox', confidence:'94%' },
              { provider:'Apple Mail', verdict:'Inbox', confidence:'99%' },
              { provider:'AOL', verdict:'Inbox', confidence:'92%' },
              { provider:'ProtonMail', verdict:'Inbox', confidence:'91%' },
            ].map(p=>(
              <div key={p.provider} style={S.elevated}>
                <div style={{ color:'#fafafa', fontWeight:600, fontSize:'14px' }}>{p.provider}</div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px' }}>
                  <span style={S.badge('#22c55e')}>{p.verdict}</span>
                  <span style={{ color:'#a1a1aa', fontSize:'12px' }}>{p.confidence} confidence</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function SettingsMgmt({ tab }) {
  const [msg, setMsg] = useState('');
  const [compliance, setCompliance] = useState(null);
  const [domains, setDomains] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    if (tab === 'general') {
      apiFetch('/settings/domains').then(d=>setDomains(d.domains||d||[])).catch(()=>{});
    }
    if (tab === 'compliance') {
      apiFetch('/settings/compliance').then(d=>setCompliance(d)).catch(()=>{});
    }
    if (tab === 'team') {
      apiFetch('/settings/audit-logs').then(d=>setAuditLogs(d.logs||d||[])).catch(()=>{});
    }
    if (tab === 'integrations') {
      apiFetch('/settings/api-keys').then(d=>setApiKeys(d.keys||d||[])).catch(()=>{});
    }
  }, [tab]);

  if (tab === 'general') return (
    <div>
      <div style={S.title}>General Settings</div>
      <Msg text={msg} type={msg.includes('rror')?'error':'ok'} />
      <div style={{ ...S.card, marginTop:'16px' }}>
        <div style={S.h2}>Sending Domains</div>
        <table style={S.table}>
          <thead><tr>{['Domain','Status','Actions'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {(domains.length ? domains : []).map(d => (
              <tr key={d.id||d._id}>
                <td style={S.td}>{d.domain||d.name}</td>
                <td style={S.td}><span style={S.badge(d.verified||d.status==='verified'?'#22c55e':'#f59e0b')}>{d.verified||d.status==='verified'?'verified':'pending'}</span></td>
                <td style={S.td}><button style={S.btnSm} onClick={()=>apiFetch(`/settings/domains/${d.id||d._id}/verify`,{method:'POST'}).then(()=>setMsg('Verification initiated.')).catch(e=>setMsg(e.message))}>Verify</button></td>
              </tr>
            ))}
            {!domains.length && <tr><td style={{ ...S.td, color:'#71717a' }} colSpan={3}>No domains configured.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (tab === 'team') return (
    <div>
      <div style={S.title}>Team & Audit Log</div>
      <table style={{ ...S.table, marginTop:'16px' }}>
        <thead><tr>{['Action','User','Resource','Time'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>
          {(auditLogs.length ? auditLogs.slice(0,20) : []).map((l, i) => (
            <tr key={i}>
              <td style={S.td}>{l.action||l.event}</td>
              <td style={S.td}>{l.userId||l.user||'—'}</td>
              <td style={S.td}>{l.resource||l.target||'—'}</td>
              <td style={S.td}>{l.createdAt ? new Date(l.createdAt).toLocaleString() : '—'}</td>
            </tr>
          ))}
          {!auditLogs.length && <tr><td style={{ ...S.td, color:'#71717a' }} colSpan={4}>No audit logs.</td></tr>}
        </tbody>
      </table>
    </div>
  );

  if (tab === 'compliance') return (
    <div>
      <div style={S.title}>Compliance & GDPR</div>
      <Msg text={msg} type={msg.includes('rror')?'error':'ok'} />
      {compliance ? (
        <div style={{ ...S.grid2, marginTop:'16px' }}>
          <div style={S.card}>
            <div style={S.h2}>GDPR Settings</div>
            <div style={{ color:'#fafafa', marginBottom:'8px' }}>Double Opt-in: <span style={S.badge(compliance.doubleOptIn?'#22c55e':'#ef4444')}>{compliance.doubleOptIn?'Enabled':'Disabled'}</span></div>
            <div style={{ color:'#fafafa' }}>Consent Required: <span style={S.badge(compliance.consentRequired?'#22c55e':'#f59e0b')}>{compliance.consentRequired?'Yes':'No'}</span></div>
          </div>
          <div style={S.card}>
            <div style={S.h2}>CAN-SPAM</div>
            <div style={{ color:'#fafafa', marginBottom:'8px' }}>Unsubscribe Link: <span style={S.badge('#22c55e')}>Required</span></div>
            <div style={{ color:'#fafafa' }}>Physical Address: <span style={S.badge(compliance.physicalAddress?'#22c55e':'#ef4444')}>{compliance.physicalAddress?'Set':'Missing'}</span></div>
          </div>
        </div>
      ) : (
        <div style={{ ...S.grid2, marginTop:'16px' }}>
          <div style={S.card}><div style={S.h2}>GDPR</div><div style={S.muted}>Compliance settings loading...</div></div>
        </div>
      )}
    </div>
  );

  if (tab === 'integrations') return (
    <div>
      <div style={S.title}>Integrations & API Keys</div>
      <Msg text={msg} type={msg.includes('rror')?'error':'ok'} />
      <table style={{ ...S.table, marginTop:'16px' }}>
        <thead><tr>{['Name','Key (partial)','Created','Actions'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>
          {(apiKeys.length ? apiKeys : []).map(k => (
            <tr key={k.id||k._id}>
              <td style={S.td}>{k.name}</td>
              <td style={S.td}><code style={{ color:'#a1a1aa', fontSize:'12px' }}>{k.key ? k.key.slice(0,8)+'...' : '—'}</code></td>
              <td style={S.td}>{k.createdAt ? new Date(k.createdAt).toLocaleDateString() : '—'}</td>
              <td style={S.td}><button style={S.btnDanger} onClick={()=>apiFetch(`/settings/api-keys/${k.id||k._id}/revoke`,{method:'POST'}).then(()=>setMsg('Key revoked.')).catch(e=>setMsg(e.message))}>Revoke</button></td>
            </tr>
          ))}
          {!apiKeys.length && <tr><td style={{ ...S.td, color:'#71717a' }} colSpan={4}>No API keys.</td></tr>}
        </tbody>
      </table>
      <button style={{ ...S.btnPrimary, marginTop:'12px' }} onClick={()=>apiFetch('/settings/api-keys',{method:'POST',body:JSON.stringify({name:'New Key'})}).then(d=>{setApiKeys(k=>[...k,d.key||d]);setMsg('Key created.');}).catch(e=>setMsg(e.message))}>Generate New API Key</button>
    </div>
  );

  /* ── List Hygiene & Sunset ───────────────────────────────────────── */
  if (tab === 'list-hygiene') {
    return (
      <div>
        <div style={S.h1}>List Hygiene & Sunset Management</div>
        <p style={S.muted}>Keep your list healthy by sunsetting disengaged contacts, managing bounces, and maintaining sender reputation.</p>
        <div style={S.grid4}>
          <StatCard label="List Health Score" value="87%" sub="Good standing" color="#22c55e" />
          <StatCard label="Sunset Candidates" value="1,240" sub="No engagement 90d+" color="#f59e0b" />
          <StatCard label="Hard Bounces" value="38" sub="Auto-suppressed" color="#ef4444" />
          <StatCard label="Cleaned This Month" value="412" sub="Removed or re-engaged" color="#3b82f6" />
        </div>
        {/* Sunset flow config */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Sunset Flow</div>
          <p style={{ color:'#a1a1aa', fontSize:'13px', marginBottom:'12px' }}>Automatically re-engage or suppress contacts who stop interacting with your emails.</p>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Stage</th><th style={S.th}>Trigger</th><th style={S.th}>Action</th><th style={S.th}>Contacts</th><th style={S.th}>Status</th></tr></thead>
            <tbody>
              {[
                { stage:'Warning', trigger:'60 days no open/click', action:'Send "We miss you" email', contacts:820, on:true },
                { stage:'Last Chance', trigger:'75 days no engagement', action:'Send "Stay or go" with incentive', contacts:340, on:true },
                { stage:'Soft Sunset', trigger:'90 days no engagement', action:'Move to suppression list', contacts:180, on:true },
                { stage:'Hard Sunset', trigger:'120 days + no purchase ever', action:'Permanently unsubscribe', contacts:80, on:false },
              ].map((s,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #27272a' }}>
                  <td style={S.td}><span style={{ fontWeight:600, color:'#fafafa' }}>{s.stage}</span></td>
                  <td style={S.td}>{s.trigger}</td>
                  <td style={S.td}>{s.action}</td>
                  <td style={S.td}><span style={{ color:'#f59e0b', fontWeight:600 }}>{s.contacts}</span></td>
                  <td style={S.td}><span style={S.badge(s.on?'green':'yellow')}>{s.on?'Active':'Draft'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Suppression management */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Suppression Lists</div>
          <div style={S.grid3}>
            {[
              { list:'Hard Bounces', count:38, desc:'Invalid email addresses auto-suppressed by mail server', icon:'🚫', color:'red' },
              { list:'Spam Complaints', count:12, desc:'Contacts who marked emails as spam', icon:'⚠️', color:'red' },
              { list:'Unsubscribed', count:1420, desc:'Manually unsubscribed via email links', icon:'📩', color:'yellow' },
              { list:'Sunset Suppressed', count:680, desc:'Suppressed by sunset flow (90d+ inactive)', icon:'🌅', color:'yellow' },
              { list:'Role-based Emails', count:24, desc:'info@, admin@, support@ addresses removed', icon:'🏢', color:'blue' },
              { list:'Manual Suppression', count:56, desc:'Manually added by admin', icon:'✋', color:'blue' },
            ].map(l=>(
              <div key={l.list} style={S.elevated}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'18px' }}>{l.icon}</span>
                  <span style={S.badge(l.color)}>{l.count}</span>
                </div>
                <div style={{ color:'#fafafa', fontWeight:600, fontSize:'13px', marginTop:'6px' }}>{l.list}</div>
                <div style={{ color:'#a1a1aa', fontSize:'11px', marginTop:'4px' }}>{l.desc}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Bounce handling */}
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.h2}>Bounce Handling Settings</div>
          <div style={S.grid2}>
            <div style={S.elevated}>
              <div style={{ color:'#fafafa', fontWeight:600, fontSize:'13px' }}>Hard Bounce Threshold</div>
              <div style={{ color:'#a1a1aa', fontSize:'12px', marginTop:'4px' }}>Suppress after <span style={{ color:'#ef4444', fontWeight:700 }}>1</span> hard bounce</div>
            </div>
            <div style={S.elevated}>
              <div style={{ color:'#fafafa', fontWeight:600, fontSize:'13px' }}>Soft Bounce Threshold</div>
              <div style={{ color:'#a1a1aa', fontSize:'12px', marginTop:'4px' }}>Suppress after <span style={{ color:'#f59e0b', fontWeight:700 }}>5</span> consecutive soft bounces</div>
            </div>
            <div style={S.elevated}>
              <div style={{ color:'#fafafa', fontWeight:600, fontSize:'13px' }}>Auto Re-validation</div>
              <div style={{ color:'#a1a1aa', fontSize:'12px', marginTop:'4px' }}>Re-check suppressed emails every <span style={{ color:'#3b82f6', fontWeight:700 }}>90 days</span></div>
            </div>
            <div style={S.elevated}>
              <div style={{ color:'#fafafa', fontWeight:600, fontSize:'13px' }}>Import Hygiene</div>
              <div style={{ color:'#a1a1aa', fontSize:'12px', marginTop:'4px' }}>Auto-clean new imports: <span style={{ color:'#22c55e', fontWeight:700 }}>Enabled</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Frequency Capping & Quiet Hours ───── */
  if (tab === 'frequency-capping') {
    return (
      <div>
        <div style={S.row}><h3 style={S.title}>\uD83D\uDD14 Frequency Capping & Quiet Hours</h3><span style={S.badge('#f59e0b')}>Compliance Ready</span></div>
        <p style={S.subtitle}>Prevent over-messaging by setting channel-specific limits and quiet hours per region.</p>
        <div style={{ ...S.grid4, marginTop:'16px' }}>
          {[{l:'Msgs Capped Today',v:'1,204',c:'#ef4444'},{l:'Quiet Hours Active',v:'14 regions',c:'#3b82f6'},{l:'Avg Msgs/Sub/Week',v:'3.2',c:'#22c55e'},{l:'Unsub Rate Change',v:'-42%',c:'#8b5cf6'}].map(s=>(
            <StatCard key={s.l} label={s.l} value={s.v} color={s.c} />
          ))}
        </div>
        <div style={{ ...S.card, marginTop:'16px' }}>
          <h4 style={S.h2}>Channel Frequency Limits</h4>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Channel</th><th style={S.th}>Daily Limit</th><th style={S.th}>Weekly Limit</th><th style={S.th}>Monthly Limit</th><th style={S.th}>Priority Override</th></tr></thead>
            <tbody>
              {[
                {ch:'Email',d:'2',w:'7',m:'20',pri:'Transactional only'},
                {ch:'SMS',d:'1',w:'3',m:'10',pri:'Urgent alerts'},
                {ch:'Push',d:'3',w:'10',m:'30',pri:'Time-sensitive'},
                {ch:'WhatsApp',d:'1',w:'3',m:'8',pri:'Transactional only'},
              ].map(r=>(
                <tr key={r.ch}><td style={S.td}>{r.ch}</td><td style={S.td}>{r.d}</td><td style={S.td}>{r.w}</td><td style={S.td}>{r.m}</td><td style={S.td}><span style={S.badge('#3b82f6')}>{r.pri}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ ...S.grid2, marginTop:'16px' }}>
          <div style={S.card}>
            <h4 style={S.h2}>Regional Quiet Hours</h4>
            {[
              {region:'US — Florida',hours:'8 PM\u20138 AM',law:'FL State Law',limit:'3/day'},
              {region:'US — Texas',hours:'9 PM\u20139 AM (Sun: all day)',law:'TX TCPA',limit:'3/day'},
              {region:'US — Oregon',hours:'9 PM\u20138 AM',law:'OR State Law',limit:'3/day'},
              {region:'EU — GDPR',hours:'9 PM\u20138 AM',law:'GDPR Art.13',limit:'Consent-based'},
              {region:'UK',hours:'9 PM\u20138 AM',law:'PECR',limit:'Consent-based'},
              {region:'Australia',hours:'9 PM\u20138 AM',law:'Spam Act 2003',limit:'Consent-based'},
            ].map(r=>(
              <div key={r.region} style={{ ...S.elevated, marginBottom:'8px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div><div style={{ color:'#fafafa', fontSize:'13px', fontWeight:600 }}>{r.region}</div><div style={{ color:'#71717a', fontSize:'11px' }}>{r.law} \u2022 Max {r.limit}</div></div>
                  <span style={S.badge('#f59e0b')}>{r.hours}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <h4 style={S.h2}>Smart Throttling Rules</h4>
            {['Respect subscriber timezone for quiet hours','Defer low-priority msgs when daily cap reached','Auto-prioritize transactional over promotional','Combine caps across coordinated campaigns','Exclude re-engagement flows from caps'].map(s=>(
              <div key={s} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                <div style={{ width:36, height:20, borderRadius:10, background:'#22c55e', position:'relative' }}><div style={{ width:16, height:16, borderRadius:8, background:'#fff', position:'absolute', top:2, right:2 }}/></div>
                <span style={{ color:'#fafafa', fontSize:'13px' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Design System ── */
  if (tab === 'design-system') {
    return (
      <div>
        <div style={S.card}>
          <h3 style={S.title}>Design System</h3>
          <p style={S.subtitle}>Reusable email content blocks, design tokens, and brand components (Customer.io style)</p>
        </div>
        <div style={S.grid4}>
          <StatCard label="Saved Blocks" value="24" color="#3b82f6" />
          <StatCard label="Design Tokens" value="18" color="#a855f7" />
          <StatCard label="Brand Templates" value="8" color="#22c55e" />
          <StatCard label="Team Snippets" value="12" color="#f59e0b" />
        </div>
        <div style={S.card}>
          <h4 style={S.h2}>Saved Content Blocks</h4>
          <p style={{ ...S.muted, marginBottom:'12px' }}>Reusable components shared across all campaigns</p>
          <div style={S.grid3}>
            {[
              { name:'Hero Banner', type:'Layout', uses:142, updated:'2d ago' },
              { name:'Product Card Grid', type:'Commerce', uses:98, updated:'1w ago' },
              { name:'CTA Button Row', type:'Action', uses:210, updated:'3d ago' },
              { name:'Social Links Footer', type:'Footer', uses:186, updated:'2w ago' },
              { name:'Testimonial Block', type:'Social Proof', uses:67, updated:'5d ago' },
              { name:'Countdown Timer', type:'Urgency', uses:45, updated:'1d ago' },
              { name:'Unsubscribe Footer', type:'Compliance', uses:210, updated:'1m ago' },
              { name:'Product Recommendations', type:'AI', uses:89, updated:'4d ago' },
              { name:'Navigation Header', type:'Layout', uses:156, updated:'1w ago' },
            ].map(b=>(
              <div key={b.name} style={S.elevated}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                  <span style={{ color:'#fafafa', fontWeight:600, fontSize:'13px' }}>{b.name}</span>
                  <span style={S.badge('#3b82f6')}>{b.type}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:'8px' }}>
                  <span style={S.muted}>Used {b.uses}x</span>
                  <span style={S.muted}>Updated {b.updated}</span>
                </div>
                <div style={{ ...S.row, marginTop:'8px' }}>
                  <button style={S.btnSm}>Edit</button>
                  <button style={S.btnGhost}>Duplicate</button>
                </div>
              </div>
            ))}
          </div>
          <button style={{ ...S.btnPrimary, marginTop:'12px' }}>+ Create Block</button>
        </div>
        <div style={S.grid2}>
          <div style={S.card}>
            <h4 style={S.h2}>Design Tokens</h4>
            <p style={{ ...S.muted, marginBottom:'12px' }}>Central brand values inherited by all templates</p>
            {[
              { token:'--brand-primary', value:'#22c55e', type:'Color' },
              { token:'--brand-secondary', value:'#3b82f6', type:'Color' },
              { token:'--brand-bg', value:'#09090b', type:'Color' },
              { token:'--text-primary', value:'#fafafa', type:'Color' },
              { token:'--font-heading', value:'Inter, sans-serif', type:'Typography' },
              { token:'--font-body', value:'System UI, sans-serif', type:'Typography' },
              { token:'--border-radius', value:'8px', type:'Spacing' },
              { token:'--spacing-unit', value:'16px', type:'Spacing' },
              { token:'--max-width', value:'600px', type:'Layout' },
            ].map(t=>(
              <div key={t.token} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid #27272a' }}>
                <div style={S.row}>
                  {t.type==='Color' && <div style={{ width:16, height:16, borderRadius:4, background:t.value, border:'1px solid #3f3f46' }} />}
                  <span style={{ color:'#fafafa', fontSize:'13px', fontFamily:'monospace' }}>{t.token}</span>
                </div>
                <div style={S.row}>
                  <span style={{ color:'#a1a1aa', fontSize:'12px', fontFamily:'monospace' }}>{t.value}</span>
                  <span style={S.badge('#a855f7')}>{t.type}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <h4 style={S.h2}>Quick Snippets</h4>
            <p style={{ ...S.muted, marginBottom:'12px' }}>Text snippets and merge tags available across campaigns</p>
            {[
              { name:'Company Address', snippet:'123 Commerce St, Suite 100, NY 10001' },
              { name:'Support Email', snippet:'support@yourstore.com' },
              { name:'Refund Policy Link', snippet:'<a href="/refund-policy">30-Day Refund Policy</a>' },
              { name:'Social Proof Line', snippet:'\u2B50 Trusted by 50,000+ customers worldwide' },
              { name:'Urgency CTA', snippet:'\u23F0 Offer expires in {{countdown}} hours!' },
              { name:'Personalized Greeting', snippet:'Hey {{first_name}}, great to see you!' },
            ].map(s=>(
              <div key={s.name} style={{ ...S.elevated, marginBottom:'8px' }}>
                <div style={{ color:'#fafafa', fontWeight:600, fontSize:'13px', marginBottom:'4px' }}>{s.name}</div>
                <div style={{ color:'#a1a1aa', fontSize:'12px', fontFamily:'monospace', background:'#18181b', padding:'6px 8px', borderRadius:'4px' }}>{s.snippet}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <h4 style={S.h2}>Version History & Syncing</h4>
          <p style={{ ...S.muted, marginBottom:'12px' }}>Track changes to shared design assets</p>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Asset</th><th style={S.th}>Changed By</th><th style={S.th}>Change</th><th style={S.th}>Time</th><th style={S.th}>Status</th></tr></thead>
            <tbody>
              {[
                { asset:'CTA Button Row', user:'Sarah', change:'Updated button color to match new brand', time:'2h ago', synced:true },
                { asset:'Design Token --brand-primary', user:'Mike', change:'Changed from #16a34a to #22c55e', time:'1d ago', synced:true },
                { asset:'Hero Banner', user:'Emily', change:'Added mobile-responsive breakpoint', time:'2d ago', synced:true },
                { asset:'Product Card Grid', user:'James', change:'Added price badge overlay option', time:'3d ago', synced:false },
                { asset:'Social Links Footer', user:'Lisa', change:'Added Threads and Bluesky icons', time:'1w ago', synced:true },
              ].map(v=>(
                <tr key={v.asset+v.time}>
                  <td style={S.td}><span style={{ color:'#fafafa', fontWeight:600 }}>{v.asset}</span></td>
                  <td style={S.td}>{v.user}</td>
                  <td style={S.td}><span style={S.muted}>{v.change}</span></td>
                  <td style={S.td}><span style={S.muted}>{v.time}</span></td>
                  <td style={S.td}><span style={S.badge(v.synced?'#22c55e':'#f59e0b')}>{v.synced?'Synced':'Pending'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}

// ─── ADVANCED ─────────────────────────────────────────────────────────────────
function AdvancedMgmt({ tab }) {
  const [apiKeys, setApiKeys] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (tab === 'api') apiFetch('/settings/api-keys').then(d=>setApiKeys(d.keys||d||[])).catch(()=>{});
    if (tab === 'automation-rules') apiFetch('/workflows').then(d=>setWorkflows((d.workflows||d||[]).filter(w=>w.isAdvanced||w.advanced))).catch(()=>{});
  }, [tab]);

  if (tab === 'api') return (
    <div>
      <div style={S.title}>API & Developer</div>
      <div style={{ ...S.grid2, marginTop:'16px' }}>
        <div style={S.card}>
          <div style={S.h2}>API Keys</div>
          <Msg text={msg} type={msg.includes('rror')?'error':'ok'} />
          <table style={S.table}>
            <thead><tr>{['Name','Prefix','Actions'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {(apiKeys.length ? apiKeys : []).map(k => (
                <tr key={k.id||k._id}>
                  <td style={S.td}>{k.name}</td>
                  <td style={S.td}><code style={{ color:'#a1a1aa', fontSize:'12px' }}>{k.key ? k.key.slice(0,10)+'...' : '—'}</code></td>
                  <td style={S.td}><button style={S.btnDanger} onClick={()=>apiFetch(`/settings/api-keys/${k.id||k._id}/revoke`,{method:'POST'}).then(()=>{setApiKeys(ks=>ks.filter(x=>(x.id||x._id)!==(k.id||k._id)));setMsg('Revoked.');}).catch(e=>setMsg(e.message))}>Revoke</button></td>
                </tr>
              ))}
              {!apiKeys.length && <tr><td style={{ ...S.td, color:'#71717a' }} colSpan={3}>No API keys.</td></tr>}
            </tbody>
          </table>
          <button style={{ ...S.btnPrimary, marginTop:'10px' }} onClick={()=>apiFetch('/settings/api-keys',{method:'POST',body:JSON.stringify({name:'Dev Key'})}).then(d=>{setApiKeys(ks=>[...ks,d.key||d]);setMsg('Created.');}).catch(e=>setMsg(e.message))}>New Key</button>
        </div>
        <div style={S.card}>
          <div style={S.h2}>Quick Reference</div>
          {[
            ['Base URL', API],
            ['Auth', 'Bearer token in Authorization header'],
            ['Rate Limit', '1000 req/min'],
            ['Pagination', 'limit & offset query params'],
          ].map(([k,v]) => (
            <div key={k} style={{ marginBottom:'10px' }}>
              <div style={{ color:'#a1a1aa', fontSize:'12px', marginBottom:'2px' }}>{k}</div>
              <code style={{ color:'#fafafa', fontSize:'13px' }}>{v}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (tab === 'custom-fields') return (
    <div>
      <div style={S.title}>Custom Fields</div>
      <p style={S.muted}>Custom subscriber data fields for personalization and segmentation.</p>
      <div style={{ ...S.grid3, marginTop:'16px' }}>
        {[
          { name:'Birthday', type:'date', uses:'Personalization' },
          { name:'Loyalty Tier', type:'string', uses:'Segmentation' },
          { name:'Product Category', type:'array', uses:'Recommendations' },
          { name:'CLV Score', type:'number', uses:'Segmentation' },
          { name:'Preferred Channel', type:'string', uses:'Routing' },
          { name:'Survey Response', type:'boolean', uses:'Filtering' },
        ].map(f => (
          <div key={f.name} style={S.card}>
            <div style={{ fontWeight:600, color:'#fafafa', marginBottom:'4px' }}>{f.name}</div>
            <div style={S.muted}><span style={S.badge('#a1a1aa')}>{f.type}</span></div>
            <div style={{ ...S.muted, marginTop:'6px' }}>{f.uses}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (tab === 'automation-rules') return (
    <div>
      <div style={S.title}>Custom Automation</div>
      <p style={S.muted}>Advanced automation rules beyond standard workflows.</p>
      {workflows.length > 0 ? (
        <table style={{ ...S.table, marginTop:'16px' }}>
          <thead><tr>{['Name','Status','Runs'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {workflows.map(w => (
              <tr key={w.id||w._id}>
                <td style={S.td}>{w.name}</td>
                <td style={S.td}><span style={S.badge(w.status==='active'?'#22c55e':'#f59e0b')}>{w.status||'draft'}</span></td>
                <td style={S.td}>{(w.totalRuns||0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.muted}>No advanced automation rules configured. Use the Workflow Builder to create rules and mark them as advanced.</div>
        </div>
      )}
    </div>
  );

  return null;
}

export default function EmailAutomationBuilder() {
  const [activeCat, setActiveCat] = useState('campaigns');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedCats, setExpandedCats] = useState({ campaigns: true });

  const catMeta = {
    campaigns:    { icon: '\u{1F4E7}', color: '#8b5cf6' },
    ai:           { icon: '\u{1F916}', color: '#06b6d4' },
    workflows:    { icon: '\u26A1',    color: '#f59e0b' },
    multichannel: { icon: '\u{1F4F1}', color: '#ec4899' },
    analytics:    { icon: '\u{1F4CA}', color: '#22c55e' },
    testing:      { icon: '\u{1F9EA}', color: '#3b82f6' },
    settings:     { icon: '\u2699\uFE0F', color: '#a1a1aa' },
    advanced:     { icon: '\u{1F527}', color: '#ef4444' },
  };

  /* Per-tab icons for richer sidebar (Klaviyo / Omnisend style) */
  const tabIcons = {
    overview:'\u{1F4CB}', create:'\u270F\uFE0F', templates:'\u{1F4C4}', sequences:'\u{1F501}',
    'campaign-calendar':'\u{1F4C5}', segments:'\u{1F465}', personalization:'\u{1F3AF}',
    profiles:'\u{1F464}', lifecycle:'\u{1F504}', 'dynamic-content':'\u{1F9E9}',
    forms:'\u{1F4DD}', 'landing-pages':'\u{1F310}', 'referral-program':'\u{1F91D}', surveys:'\u{1F4CA}',
    transactional:'\u{1F4E8}', 'stock-alerts':'\u{1F514}', 'coupon-engine':'\u{1F3AB}', 'countdown-timers':'\u23F3',
    'amp-emails':'\u26A1', 'rss-to-email':'\u{1F4E1}', 'smart-translations':'\u{1F30D}', timeline:'\u{1F552}',
    'smart-send':'\u{1F680}', 'send-time':'\u23F0', 'auto-optimize':'\u2728', predictive:'\u{1F52E}',
    'content-gen':'\u{1F4AC}', 'subject-opt':'\u{1F4A1}', 'ai-images':'\u{1F5BC}\uFE0F', 'ai-campaign':'\u{1F916}',
    recommendations:'\u{1F4A1}', 'product-recs':'\u{1F6CD}\uFE0F', 'ai-segments':'\u{1F9E0}', 'flow-gen':'\u{1F9F1}',
    builder:'\u{1F3D7}\uFE0F', 'visual-builder':'\u{1F58C}\uFE0F', 'flow-templates':'\u{1F4CB}', splits:'\u{1F500}',
    triggers:'\u{1F3AF}', conditions:'\u{1F6A6}', actions:'\u{1F3AC}', 'content-approvals':'\u2705',
    monitoring:'\u{1F4DF}', history:'\u{1F4DC}', 'flow-metrics':'\u{1F4CF}', reviews:'\u2B50', 'cart-recovery':'\u{1F6D2}',
    sms:'\u{1F4F1}', push:'\u{1F514}', whatsapp:'\u{1F4AC}', webhooks:'\u{1F517}',
    orchestration:'\u{1F3BC}', preferences:'\u2699\uFE0F', retargeting:'\u{1F3AF}',
    dashboard:'\u{1F4CA}', reports:'\u{1F4C8}', export:'\u{1F4E5}',
    revenue:'\u{1F4B0}', engagement:'\u{1F4AC}', deliverability:'\u{1F4EC}', benchmarks:'\u{1F3C6}',
    'funnel-analysis':'\u{1F4C9}', 'cohort-analysis':'\u{1F465}', 'rfm-analysis':'\u{1F4CA}', 'email-heatmaps':'\u{1F525}',
    'smart-alerts':'\u{1F6A8}', 'lead-scoring':'\u{1F3AF}', 'product-catalog':'\u{1F4E6}', 'conversion-goals':'\u{1F3C1}',
    abtests:'\u{1F500}', multivariate:'\u{1F9EA}', experiments:'\u{1F52C}', 'content-testing':'\u{1F4DD}',
    'inbox-preview':'\u{1F4E9}', 'spam-testing':'\u{1F6E1}\uFE0F', accessibility:'\u267F',
    results:'\u{1F4CA}', frequency:'\u{1F4C6}',
    general:'\u2699\uFE0F', team:'\u{1F465}', compliance:'\u{1F6E1}\uFE0F',
    integrations:'\u{1F50C}', 'list-hygiene':'\u{1F9F9}', 'frequency-capping':'\u23F1\uFE0F', 'design-system':'\u{1F3A8}',
    api:'\u{1F4BB}', 'custom-fields':'\u{1F4CB}', 'automation-rules':'\u{1F4DC}',
  };

  const currentCat = CATS.find(c => c.id === activeCat) || CATS[0];

  function toggleCatExpand(id) {
    setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function switchCat(id) {
    setActiveCat(id);
    const cat = CATS.find(c => c.id === id);
    setActiveTab(cat ? cat.tabs[0] : 'overview');
    setSearchQuery('');
    /* auto-expand target, collapse others (Klaviyo-style) */
    setExpandedCats({ [id]: true });
  }

  function navigateToTab(catId, tabId) {
    setActiveCat(catId);
    setActiveTab(tabId);
    setSearchQuery('');
    setExpandedCats(prev => ({ ...prev, [catId]: true }));
  }

  /* Compute search results across all categories */
  const searchResults = searchQuery.trim().length > 0
    ? CATS.flatMap(cat =>
        cat.tabs
          .filter(t => (TAB_LABELS[t] || t).toLowerCase().includes(searchQuery.toLowerCase()))
          .map(t => ({ catId: cat.id, catLabel: cat.label, tabId: t, label: TAB_LABELS[t] || t }))
      )
    : [];

  /* Find which sub-group the active tab belongs to */
  const groups = TAB_GROUPS[activeCat] || [];
  const activeGroup = groups.find(g => g.tabs.includes(activeTab));

  function renderContent() {
    switch (activeCat) {
      case 'campaigns':    return <CampaignsMgmt tab={activeTab} />;
      case 'ai':           return <AIMgmt tab={activeTab} />;
      case 'workflows':    return <WorkflowsMgmt tab={activeTab} />;
      case 'multichannel': return <MultiChannelMgmt tab={activeTab} />;
      case 'analytics':    return <AnalyticsMgmt tab={activeTab} />;
      case 'testing':      return <TestingMgmt tab={activeTab} />;
      case 'settings':     return <SettingsMgmt tab={activeTab} />;
      case 'advanced':     return <AdvancedMgmt tab={activeTab} />;
      default:             return <CampaignsMgmt tab={activeTab} />;
    }
  }

  const catColor = catMeta[activeCat]?.color || '#22c55e';

  return (
    <div style={{ ...S.page, padding: '0', display: 'flex', minHeight: '100vh' }}>

      {/* ══════════ Unified Sidebar (Klaviyo-style) ══════════ */}
      <aside style={{
        width: sidebarCollapsed ? '56px' : '260px',
        flexShrink: 0,
        background: '#111113',
        borderRight: '1px solid #27272a',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 40,
      }}>

        {/* ── Brand / Title ── */}
        <div style={{
          padding: sidebarCollapsed ? '16px 8px' : '20px 18px 12px',
          borderBottom: '1px solid #27272a',
          textAlign: sidebarCollapsed ? 'center' : 'left',
        }}>
          {sidebarCollapsed
            ? <span style={{ fontSize: '20px' }}>{'\u{1F4E7}'}</span>
            : <>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#fafafa', letterSpacing: '-0.01em' }}>
                  Email Automation
                </div>
                <div style={{ fontSize: '11px', color: '#52525b', marginTop: '2px' }}>
                  88 tools \u00B7 8 categories
                </div>
              </>
          }
        </div>

        {/* ── Search ── */}
        {!sidebarCollapsed && (
          <div style={{ padding: '12px 14px 8px', position: 'relative' }}>
            <input
              type="text"
              placeholder="\u{1F50D} Search tools\u2026"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                ...S.input,
                background: '#1a1a1e',
                border: '1px solid #27272a',
                fontSize: '12px',
                padding: '7px 10px',
                borderRadius: '8px',
              }}
            />
            {searchResults.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 14, right: 14, zIndex: 60,
                background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px',
                maxHeight: '320px', overflowY: 'auto', marginTop: '2px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              }}>
                {searchResults.map(r => (
                  <button
                    key={r.catId + r.tabId}
                    onClick={() => navigateToTab(r.catId, r.tabId)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      width: '100%', padding: '8px 12px', border: 'none',
                      background: 'transparent', color: '#fafafa', cursor: 'pointer',
                      fontSize: '12px', textAlign: 'left',
                      borderBottom: '1px solid #27272a',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#27272a'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: '13px' }}>{tabIcons[r.tabId] || catMeta[r.catId]?.icon}</span>
                    <span style={{ flex: 1 }}>{r.label}</span>
                    <span style={{ color: '#52525b', fontSize: '10px' }}>{r.catLabel}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Navigation Categories (accordion) ── */}
        <nav style={{ flex: 1, padding: '4px 0', overflowY: 'auto' }}>
          {CATS.map(cat => {
            const meta = catMeta[cat.id] || {};
            const isActive = activeCat === cat.id;
            const isExpanded = !!expandedCats[cat.id];
            const catGroups = TAB_GROUPS[cat.id] || [];

            return (
              <div key={cat.id}>
                {/* Category header (accordion toggle) */}
                <button
                  onClick={() => {
                    if (sidebarCollapsed) { switchCat(cat.id); setSidebarCollapsed(false); }
                    else if (!isActive) switchCat(cat.id);
                    else toggleCatExpand(cat.id);
                  }}
                  title={sidebarCollapsed ? cat.label : undefined}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    width: '100%', padding: sidebarCollapsed ? '10px 0' : '9px 14px',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: isActive ? (meta.color || '#3f3f46') + '14' : 'transparent',
                    borderLeft: isActive ? `3px solid ${meta.color || '#3f3f46'}` : '3px solid transparent',
                    transition: 'all 0.12s',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#1a1a1e'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? (meta.color || '#3f3f46') + '14' : 'transparent'; }}
                >
                  <span style={{ fontSize: sidebarCollapsed ? '18px' : '15px', lineHeight: 1 }}>{meta.icon}</span>
                  {!sidebarCollapsed && <>
                    <span style={{
                      flex: 1, fontSize: '13px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#fafafa' : '#a1a1aa',
                    }}>
                      {cat.label}
                    </span>
                    <span style={{
                      fontSize: '10px', fontWeight: 600, color: '#52525b',
                      background: '#27272a', borderRadius: '8px', padding: '1px 6px',
                      minWidth: '20px', textAlign: 'center',
                    }}>
                      {cat.tabs.length}
                    </span>
                    <span style={{
                      fontSize: '10px', color: '#52525b',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s',
                    }}>
                      {'\u25B6'}
                    </span>
                  </>}
                </button>

                {/* Expanded sub-groups + tabs */}
                {!sidebarCollapsed && isExpanded && catGroups.map(group => (
                  <div key={group.label}>
                    <div style={{
                      padding: '6px 14px 3px 28px',
                      fontSize: '9px', fontWeight: 700, color: '#52525b',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>
                      {group.label}
                    </div>
                    {group.tabs.map(tabId => {
                      const tabActive = activeCat === cat.id && activeTab === tabId;
                      return (
                        <button
                          key={tabId}
                          onClick={() => navigateToTab(cat.id, tabId)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            width: '100%', padding: '5px 14px 5px 32px',
                            border: 'none', cursor: 'pointer', textAlign: 'left',
                            background: tabActive ? (meta.color || '#3f3f46') + '22' : 'transparent',
                            borderLeft: tabActive ? `3px solid ${meta.color}` : '3px solid transparent',
                            transition: 'all 0.1s',
                          }}
                          onMouseEnter={e => { if (!tabActive) e.currentTarget.style.background = '#1a1a1e'; }}
                          onMouseLeave={e => { if (!tabActive) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <span style={{ fontSize: '12px', opacity: 0.7, width: '16px', textAlign: 'center' }}>
                            {tabIcons[tabId] || '\u2022'}
                          </span>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: tabActive ? 600 : 400,
                            color: tabActive ? '#fafafa' : '#a1a1aa',
                          }}>
                            {TAB_LABELS[tabId] || tabId}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </nav>

        {/* ── Collapse toggle (bottom) ── */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            width: '100%', padding: '10px', border: 'none',
            borderTop: '1px solid #27272a', background: 'transparent',
            color: '#52525b', cursor: 'pointer', fontSize: '11px',
            textAlign: 'center', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '6px',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#a1a1aa'}
          onMouseLeave={e => e.currentTarget.style.color = '#52525b'}
        >
          {sidebarCollapsed ? '\u{25B6}' : <><span>{'\u{25C0}'}</span><span>Collapse</span></>}
        </button>
      </aside>

      {/* ══════════ Main Content Area ══════════ */}
      <main style={{ flex: 1, minWidth: 0, padding: '24px 28px', overflowY: 'auto' }}>

        {/* ── Breadcrumb ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          marginBottom: '20px', fontSize: '13px',
        }}>
          <span
            style={{ color: catColor, fontWeight: 600, cursor: 'pointer' }}
            onClick={() => switchCat(activeCat)}
          >
            {catMeta[activeCat]?.icon} {currentCat.label}
          </span>
          {activeGroup && (
            <>
              <span style={{ color: '#3f3f46' }}>/</span>
              <span style={{ color: '#71717a' }}>{activeGroup.label}</span>
            </>
          )}
          <span style={{ color: '#3f3f46' }}>/</span>
          <span style={{ color: '#fafafa', fontWeight: 600 }}>{TAB_LABELS[activeTab] || activeTab}</span>
        </div>

        {/* ── Content ── */}
        {renderContent()}
      </main>
    </div>
  );
}

