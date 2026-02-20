﻿import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const apiFetch = (url, opts = {}) =>
  axios({ url, withCredentials: true, ...opts }).then(r => r.data);

// Match a keyword against text: exact phrase OR all individual words present anywhere (word-level)
function kwMatch(text, kw) {
  const t = text.toLowerCase();
  const k = kw.toLowerCase().trim();
  if (t.includes(k)) return true;
  const words = k.split(/\s+/).filter(Boolean);
  return words.length > 1 && words.every(w => t.includes(w));
}

function seoScore(fields) {
  let s = 0;
  const title = (fields.seoTitle || '').toLowerCase();
  const desc = (fields.seoDescription || '').toLowerCase();
  const kws = (fields.keywords || '').split(',').map(k => k.trim()).filter(Boolean);
  const kwInTitle = kws.some(k => kwMatch(title, k));
  const kwInDesc = kws.some(k => kwMatch(desc, k));
  // Title: sweet spot 50-60 (Google truncates at ~60). Tiered.
  const titleLen = (fields.seoTitle || '').length;
  if (titleLen >= 50 && titleLen <= 60) s += 25;
  else if (titleLen >= 40) s += 20;
  else if (titleLen >= 30) s += 14;
  else if (fields.seoTitle) s += 6;
  // Desc: sweet spot 150-160 (fills Google snippet). Tiered.
  const descLen = (fields.seoDescription || '').length;
  if (descLen >= 150 && descLen <= 160) s += 25;
  else if (descLen >= 130) s += 18;
  else if (descLen >= 120) s += 12;
  else if (fields.seoDescription) s += 6;
  if (kws.length >= 1) s += 5;
  if (kwInTitle) s += 15;
  if (kwInDesc) s += 15;
  if (fields.handle) s += 5;
  if (fields.altText) s += 10;
  return Math.min(100, s);
}

function seoGrade(score) {
  if (score >= 90) return { label: 'Excellent', colour: '#4ade80', bg: '#0d2f1a' };
  if (score >= 70) return { label: 'Good', colour: '#a3e635', bg: '#1a2b0a' };
  if (score >= 50) return { label: 'Needs Work', colour: '#fbbf24', bg: '#2b1f0a' };
  return { label: 'Poor', colour: '#f87171', bg: '#2b0f0f' };
}

function ScoreRing({ score, size = 88 }) {
  const { colour, label } = seoGrade(score);
  const inner = size * 0.72;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: `conic-gradient(${colour} ${score * 3.6}deg, #222535 ${score * 3.6}deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${colour}33` }}>
        <div style={{ width: inner, height: inner, borderRadius: '50%', background: '#0d0d11', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: colour, fontWeight: 900, fontSize: size * 0.23, lineHeight: 1 }}>{score}</span>
          <span style={{ color: colour + 'aa', fontSize: size * 0.1, fontWeight: 700 }}>/100</span>
        </div>
      </div>
      <span style={{ fontSize: 12, color: colour, fontWeight: 700 }}>{label}</span>
    </div>
  );
}

function CharBar({ value = '', min, max, sweetMin, sweetMax, label }) {
  const len = value.length;
  const over = len > max;
  const inRange = len >= min && len <= max;
  const perfect = len >= (sweetMin || min) && len <= (sweetMax || max);
  const pct = Math.min(100, (len / max) * 100);
  const colour = len === 0 ? '#454860' : over ? '#f87171' : perfect ? '#4ade80' : inRange ? '#a3e635' : '#fbbf24';
  const statusText = len === 0 ? 'Empty'
    : over ? 'Too long'
    : len < min ? 'Too short'
    : perfect ? 'Perfect'
    : `Good - aim for ${sweetMin || min}+`;
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#8b8fa8' }}>{label}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 11, color: colour, fontWeight: 700 }}>{statusText}</span>
          <span style={{ fontSize: 11, color: colour, fontWeight: 600, background: colour + '18', border: `1px solid ${colour}33`, borderRadius: 4, padding: '1px 6px' }}>{len}/{max}</span>
        </div>
      </div>
      <div style={{ height: 5, background: '#222535', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${colour}88, ${colour})`, borderRadius: 3, transition: 'width 0.3s ease' }} />
      </div>
    </div>
  );
}

function SerpPreview({ title, description, handle, shop, device }) {
  const url = `${shop || 'yourstore.myshopify.com'}/products/${handle || 'product-slug'}`;
  const isMobile = device === 'mobile';
  return (
    <div style={{ background: '#6366f1', borderRadius: 12, padding: isMobile ? '12px 14px' : '16px 20px', fontFamily: 'Arial, sans-serif', boxShadow: '0 2px 12px #0001' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#1a73e8', fontWeight: 900 }}>G</div>
        <div>
          <div style={{ fontSize: 13, color: '#222535', fontWeight: 500 }}>{shop || 'yourstore.myshopify.com'}</div>
          <div style={{ fontSize: 11, color: '#4d5156', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isMobile ? 260 : 500 }}>https://{url}</div>
        </div>
      </div>
      <div style={{ fontSize: isMobile ? 16 : 20, color: '#454860', marginBottom: 6, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {title || 'Your SEO Title Will Appear Here'}
      </div>
      <div style={{ fontSize: 13, color: '#4d5156', lineHeight: 1.58, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {description || 'Your meta description will appear here. Make it compelling and between 120-160 characters.'}
      </div>
    </div>
  );
}

function GenBtn({ onClick, loading, small }) {
  return (
    <button onClick={onClick} disabled={loading} style={{ background: loading ? '#353848' : '#ffffff', border: 'none', borderRadius: small ? 6 : 8, padding: small ? '5px 12px' : '7px 16px', color: '#000000', fontWeight: 700, fontSize: small ? 12 : 13, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, opacity: loading ? 0.5 : 1 }}>
      {loading ? <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid #666', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : null}
      {loading ? 'Generating...' : 'Generate'}
    </button>
  );
}

function FieldBlock({ label, hint, badge, children }) {
  return (
    <div style={{ background: '#1a1c25', border: '1px solid #222535', borderRadius: 12, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 600, color: '#a8adc4', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
          {hint && <div style={{ fontSize: 11, color: '#8b8fa8', marginTop: 2 }}>{hint}</div>}
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

const TABS = [
  { id: 'products',  label: 'Products' },
  { id: 'editor',    label: 'Editor' },
  { id: 'bulk',      label: 'Bulk Generate' },
  { id: 'analytics', label: 'Analytics' },
];

export default function ProductSeoEngine() {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [editor, setEditor] = useState({ seoTitle: '', seoDescription: '', handle: '', keywords: '', altText: '' });
  const [kwInput, setKwInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [fieldGenerating, setFieldGenerating] = useState({});
  const [pushing, setPushing] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [toast, setToast] = useState(null);
  const [shopDomain, setShopDomain] = useState('');
  const [serpDevice, setSerpDevice] = useState('desktop');
  const [editorTab, setEditorTab] = useState('fields');
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkResults, setBulkResults] = useState([]);
  const [bulkPushing, setBulkPushing] = useState(false);
  const autoSaveTimer = useRef();

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    loadProducts();
    axios.get('/api/session', { withCredentials: true }).then(r => {
      const s = r.data?.projectDetails?.domain || r.data?.shop || '';
      setShopDomain(s.replace(/https?:\/\//, '').replace(/\/$/, ''));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveLocal(selectedProduct.id, editor);
      setSavedAt(new Date());
    }, 1500);
    return () => clearTimeout(autoSaveTimer.current);
  }, [editor, selectedProduct]);

  async function loadProducts() {
    setLoadingProducts(true);
    try {
      const data = await apiFetch('/api/product-seo/shopify-products');
      setProducts(data.products || []);
    } catch {
      showToast('Could not load products - check connection', 'error');
    }
    setLoadingProducts(false);
  }

  function selectProduct(p) {
    setSelectedProduct(p);
    const stored = JSON.parse(localStorage.getItem('aura_seo_records') || '{}');
    const saved = stored[p.id] || {};
    setEditor({ seoTitle: saved.seoTitle || p.title || '', seoDescription: saved.seoDescription || '', handle: saved.handle || p.handle || '', keywords: saved.keywords || '', altText: saved.altText || '' });
    setKwInput('');
    setTab('editor');
  }

  function saveLocal(id, fields) {
    const s = JSON.parse(localStorage.getItem('aura_seo_records') || '{}');
    s[id] = { ...(s[id] || {}), ...fields };
    localStorage.setItem('aura_seo_records', JSON.stringify(s));
  }

  const stored = JSON.parse(localStorage.getItem('aura_seo_records') || '{}');

  async function generateAll() {
    if (!selectedProduct) return;
    setGenerating(true);
    try {
      const res = await apiFetch('/api/product-seo/generate', { method: 'POST', data: { productName: selectedProduct.title, productDescription: selectedProduct.title + (selectedProduct.tags ? '. Tags: ' + selectedProduct.tags : ''), focusKeywords: editor.keywords || undefined } });
      const p = res.parsed || {};
      const next = { seoTitle: p.seoTitle || selectedProduct.title, seoDescription: p.metaDescription || '', handle: (p.slug || p.seoTitle || selectedProduct.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), keywords: p.keywords || '', altText: p.altText || '', ogTitle: p.ogTitle || p.seoTitle || '', ogDescription: p.ogDescription || p.metaDescription || '' };
      setEditor(next);
      saveLocal(selectedProduct.id, next);
      showToast('All SEO fields generated!');
    } catch (err) {
      showToast('Generation failed: ' + (err.response?.data?.error || err.message), 'error');
    }
    setGenerating(false);
  }

  async function generateField(field) {
    if (!selectedProduct) return;
    setFieldGenerating(f => ({ ...f, [field]: true }));
    try {
      const res = await apiFetch('/api/product-seo/generate', { method: 'POST', data: { productName: selectedProduct.title, productDescription: selectedProduct.title + (selectedProduct.tags ? '. Tags: ' + selectedProduct.tags : ''), focusKeywords: editor.keywords || undefined } });
      const p = res.parsed || {};
      const map = { seoTitle: p.seoTitle || selectedProduct.title, seoDescription: p.metaDescription || '', keywords: p.keywords || '', handle: (p.slug || p.seoTitle || selectedProduct.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), altText: p.altText || (selectedProduct.title + ' product image') };
      const val = map[field] || '';
      setEditor(e => ({ ...e, [field]: val }));
      saveLocal(selectedProduct.id, { [field]: val });
      showToast(field + ' generated!');
    } catch (err) { showToast('Failed: ' + (err.response?.data?.error || err.message), 'error'); }
    setFieldGenerating(f => ({ ...f, [field]: false }));
  }

  function addKeywordChip() {
    const t = kwInput.trim().replace(/,$/, '');
    if (!t) return;
    const existing = editor.keywords.split(',').map(k => k.trim()).filter(Boolean);
    const newKws = t.split(/[,\n]+/).map(k => k.trim()).filter(k => k && !existing.map(e => e.toLowerCase()).includes(k.toLowerCase()));
    if (newKws.length) setEditor(e => ({ ...e, keywords: [...existing, ...newKws].join(', ') }));
    setKwInput('');
  }

  function removeKeywordChip(kw) {
    const updated = editor.keywords.split(',').map(k => k.trim()).filter(k => k.toLowerCase() !== kw.toLowerCase());
    setEditor(e => ({ ...e, keywords: updated.join(', ') }));
  }

  async function pushToShopify() {
    if (!selectedProduct) return;
    setPushing(true);
    try {
      await apiFetch('/api/product-seo/push-to-shopify', { method: 'POST', data: { productId: selectedProduct.id, metaTitle: editor.seoTitle, metaDescription: editor.seoDescription, handle: editor.handle !== selectedProduct.handle ? editor.handle : undefined, ogTitle: editor.ogTitle || editor.seoTitle || undefined, ogDescription: editor.ogDescription || editor.seoDescription || undefined } });
      saveLocal(selectedProduct.id, editor);
      showToast('SEO pushed to Shopify!');
    } catch (err) { showToast('Push failed: ' + (err.response?.data?.error || err.message), 'error'); }
    setPushing(false);
  }

  async function runBulkGenerate() {
    if (!bulkSelected.size) return;
    setBulkGenerating(true);
    setBulkResults([]);
    const results = [];
    for (const p of products.filter(p => bulkSelected.has(p.id))) {
      try {
        const res = await apiFetch('/api/product-seo/generate', { method: 'POST', data: { productName: p.title, productDescription: p.title + (p.tags ? '. Tags: ' + p.tags : ''), focusKeywords: (JSON.parse(localStorage.getItem('aura_seo_records') || '{}')[p.id] || {}).keywords || undefined } });
        const parsed = res.parsed || {};
        const fields = { seoTitle: parsed.seoTitle || p.title, seoDescription: parsed.metaDescription || '', keywords: parsed.keywords || '', handle: (parsed.slug || parsed.seoTitle || p.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), altText: parsed.altText || '' };
        saveLocal(p.id, fields);
        results.push({ product: p, fields, score: seoScore(fields), status: 'ok' });
      } catch (e) { results.push({ product: p, fields: {}, score: 0, status: 'error', error: e.message }); }
      setBulkResults([...results]);
    }
    setBulkGenerating(false);
    showToast(results.filter(r => r.status === 'ok').length + '/' + results.length + ' products generated');
  }

  async function bulkPushAll() {
    const ok = bulkResults.filter(r => r.status === 'ok');
    if (!ok.length) return;
    setBulkPushing(true);
    let n = 0;
    for (const r of ok) {
      try { await apiFetch('/api/product-seo/push-to-shopify', { method: 'POST', data: { productId: r.product.id, metaTitle: r.fields.seoTitle, metaDescription: r.fields.seoDescription } }); n++; } catch (_) {}
    }
    setBulkPushing(false);
    showToast('Pushed ' + n + ' products to Shopify!');
  }

  const filteredProducts = products
    .filter(p => {
      const s = search.toLowerCase();
      return (p.title.toLowerCase().includes(s) || (p.handle || '').includes(s)) && (statusFilter === 'all' || p.status === statusFilter);
    })
    .sort((a, b) => {
      if (sortBy === 'score') return seoScore(stored[b.id] || {}) - seoScore(stored[a.id] || {});
      if (sortBy === 'score_asc') return seoScore(stored[a.id] || {}) - seoScore(stored[b.id] || {});
      return (a.title || '').localeCompare(b.title || '');
    });

  const score = seoScore(editor);
  const { colour: scoreColour, bg: scoreBg } = seoGrade(score);
  const chips = editor.keywords.split(',').map(k => k.trim()).filter(Boolean);
  const titleLower = editor.seoTitle.toLowerCase();
  const descLower = editor.seoDescription.toLowerCase();
  const kwInTitleMatch = (kw) => kwMatch(titleLower, kw);
  const kwInDescMatch = (kw) => kwMatch(descLower, kw);

  const checklist = [
    { ok: editor.seoTitle.length >= 50 && editor.seoTitle.length <= 60, label: 'SEO title is 50-60 characters (Google sweet spot)', tip: 'Currently ' + editor.seoTitle.length + ' chars - aim for 50-60' },
    { ok: editor.seoDescription.length >= 150 && editor.seoDescription.length <= 160, label: 'Meta description is 150-160 characters (fills Google snippet)', tip: 'Currently ' + editor.seoDescription.length + ' chars - Google truncates at ~155 on desktop, aim for 150-160' },
    { ok: chips.length >= 1, label: 'Focus keywords set (used for AI copy, not a Google ranking signal)', tip: 'Add at least 1 keyword - these guide the AI only. Note: Google ignores the meta keywords tag.' },
    { ok: chips.some(k => kwInTitleMatch(k)), label: 'Primary keyword appears naturally in SEO title', tip: 'Weave your primary keyword into the title - no stuffing' },
    { ok: chips.some(k => kwInDescMatch(k)), label: 'Primary keyword appears naturally in meta description', tip: 'Include your keyword naturally in the description' },
    { ok: !!editor.handle, label: 'URL handle / slug is set', tip: 'Set a clean URL slug (note: URL keywords have minimal ranking impact per Google)' },
    { ok: !!editor.altText, label: 'Image alt text is set (helps Google Images ranking)', tip: 'Describe the main product image - important for Google Images discovery' },
    { ok: !!editor.seoDescription && (editor.seoDescription.includes('!') || editor.seoDescription.toLowerCase().includes('buy') || editor.seoDescription.toLowerCase().includes('shop') || editor.seoDescription.toLowerCase().includes('get')), label: 'Meta description has a call-to-action (improves click-through rate)', tip: 'Include buy, shop, get or use punctuation for urgency' },
    { ok: !!editor.seoTitle && !editor.seoTitle.match(/(.{3,})\s+\1/i), label: 'No keyword stuffing in title (against Google spam policy)', tip: 'Each keyword should appear once - no repetition' },
  ];
  const checkPassed = checklist.filter(c => c.ok).length;

  return (
    <div style={{ background: '#0d0d11', minHeight: '100vh', color: '#f9fafb', fontFamily: '"Inter", system-ui, sans-serif' }}>

      {toast && (
        <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, background: toast.type === 'error' ? '#1a0808' : '#0a1a0a', border: '1px solid ' + (toast.type === 'error' ? '#f8717140' : '#4ade8040'), borderRadius: 10, padding: '13px 18px', color: toast.type === 'error' ? '#f87171' : '#4ade80', fontSize: 14, fontWeight: 500, maxWidth: 400, boxShadow: '0 8px 32px #000a', display: 'flex', alignItems: 'center', gap: 12 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ background: '#0f0f0f', borderBottom: '1px solid #222535', padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 22, paddingBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000000', fontWeight: 800, fontSize: 12, letterSpacing: '0.05em' }}>SEO</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>Product SEO Engine</h1>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#8b8fa8' }}>AI-powered SEO optimisation and direct Shopify publishing</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {[
              { label: 'Products', value: products.length, colour: '#ffffff' },
              { label: 'Optimised', value: Object.keys(stored).length, colour: '#a8adc4' },
              { label: 'Avg Score', value: products.length ? Math.round(products.reduce((s, p) => s + seoScore(stored[p.id] || {}), 0) / products.length) : 0, colour: '#fbbf24' },
            ].map(st => (
              <div key={st.label} style={{ background: '#1a1c25', border: '1px solid #222535', borderRadius: 10, padding: '9px 16px', textAlign: 'center', minWidth: 76 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: st.colour }}>{st.value}</div>
                <div style={{ fontSize: 11, color: '#8b8fa8', marginTop: 1 }}>{st.label}</div>
              </div>
            ))}
            <button onClick={loadProducts} style={{ background: '#1a1c25', border: '1px solid #222535', borderRadius: 10, padding: '9px 16px', color: '#a8adc4', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Refresh</button>
          </div>
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid #222535' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid #ffffff' : '2px solid transparent', padding: '13px 22px', cursor: 'pointer', color: tab === t.id ? '#ffffff' : '#8b8fa8', fontWeight: tab === t.id ? 600 : 400, fontSize: 13, transition: 'color 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>

        {tab === 'products' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, minWidth: 200, background: '#1a1c25', border: '1px solid #353848', borderRadius: 10, padding: '11px 14px', color: '#f9fafb', fontSize: 14, outline: 'none' }} />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ background: '#1a1c25', border: '1px solid #353848', borderRadius: 10, padding: '11px 14px', color: '#f9fafb', fontSize: 14, cursor: 'pointer' }}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: '#1a1c25', border: '1px solid #353848', borderRadius: 10, padding: '11px 14px', color: '#f9fafb', fontSize: 14, cursor: 'pointer' }}>
                <option value="title">Sort: A-Z</option>
                <option value="score">Score: High to Low</option>
                <option value="score_asc">Score: Low to High</option>
              </select>
              <button onClick={() => { setBulkSelected(new Set(filteredProducts.map(p => p.id))); setTab('bulk'); }}
                style={{ background: '#ffffff', border: 'none', borderRadius: 10, padding: '11px 22px', color: '#000000', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Bulk Generate All
              </button>
            </div>

            {products.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {[
                  { label: 'No SEO data', count: products.filter(p => !stored[p.id]?.seoTitle).length, colour: '#f87171', bg: '#1f0a0a' },
                  { label: 'Score under 50', count: products.filter(p => { const s = seoScore(stored[p.id] || {}); return stored[p.id] && s < 50; }).length, colour: '#fbbf24', bg: '#1f180a' },
                  { label: 'Score 50-79', count: products.filter(p => { const s = seoScore(stored[p.id] || {}); return s >= 50 && s < 80; }).length, colour: '#a3e635', bg: '#131f0a' },
                  { label: 'Score 80+', count: products.filter(p => seoScore(stored[p.id] || {}) >= 80).length, colour: '#4ade80', bg: '#0a1f10' },
                ].map(b => (
                  <div key={b.label} style={{ background: b.bg, border: '1px solid ' + b.colour + '30', borderRadius: 8, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: b.colour }}>{b.count}</span>
                    <span style={{ fontSize: 12, color: b.colour + 'cc' }}>{b.label}</span>
                  </div>
                ))}
              </div>
            )}

            {loadingProducts ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {[...Array(8)].map((_, i) => <div key={i} style={{ background: '#0d0d11', borderRadius: 16, height: 130, animation: 'pulse 1.5s ease infinite' }} />)}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#8b8fa8' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#8b8fa8', marginBottom: 8 }}>No products found</div>
                <div style={{ fontSize: 14 }}>Connect your Shopify store or try a different search</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 16 }}>
                {filteredProducts.map(p => {
                  const pFields = stored[p.id] || {};
                  const ps = seoScore(pFields);
                  const { colour: pc, bg: pb } = seoGrade(ps);
                  const hasData = !!pFields.seoTitle;
                  return (
                    <div key={p.id} onClick={() => selectProduct(p)}
                      style={{ background: '#1a1c25', border: '1px solid ' + (hasData ? '#222535' : '#2a1515'), borderRadius: 16, padding: 18, cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px #000a'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = hasData ? '#222535' : '#2a1515'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                    >
                        <div style={{ position: 'absolute', top: 14, right: 14, background: hasData ? pb : '#1a1c25', border: '1px solid ' + (hasData ? pc : '#222535') + '40', borderRadius: 8, padding: '4px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: hasData ? pc : '#454860' }}>{hasData ? ps : '-'}</div>
                        <div style={{ fontSize: 9, color: (hasData ? pc : '#454860') + 'aa', fontWeight: 600 }}>SEO</div>
                      </div>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', paddingRight: 56 }}>
                        {p.image
                          ? <img src={p.image} alt={p.title} style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0, border: '1px solid #222535' }} />
                          : <div style={{ width: 56, height: 56, borderRadius: 12, background: '#1a1c25', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#8b8fa8', flexShrink: 0 }}>IMG</div>}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: '#f9fafb', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                          <div style={{ fontSize: 12, color: '#8b8fa8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.vendor} - {p.handle}</div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, background: p.status === 'active' ? '#0a1f10' : '#1a1a0a', color: p.status === 'active' ? '#4ade80' : '#fbbf24', border: '1px solid ' + (p.status === 'active' ? '#4ade8030' : '#fbbf2430'), fontWeight: 600 }}>{p.status}</span>
                            {hasData && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, background: '#071a10', color: '#6366f1', border: '1px solid #6366f120', fontWeight: 600 }}>SEO ready</span>}
                            {!hasData && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, background: '#1f0a0a', color: '#f87171', border: '1px solid #f8717120', fontWeight: 600 }}>Needs SEO</span>}
                          </div>
                        </div>
                      </div>
                      {hasData && (
                        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #222535' }}>
                          <div style={{ height: 3, background: '#222535', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: ps + '%', background: 'linear-gradient(90deg, ' + pc + '80, ' + pc + ')', borderRadius: 2 }} />
                          </div>
                          <div style={{ display: 'flex', gap: 5, marginTop: 7, flexWrap: 'wrap' }}>
                            {pFields.seoTitle && <span style={{ fontSize: 10, color: '#6366f1', background: '#6366f109', border: '1px solid #6366f115', padding: '1px 6px', borderRadius: 4 }}>Title</span>}
                            {pFields.seoDescription && <span style={{ fontSize: 10, color: '#6366f1', background: '#6366f109', border: '1px solid #6366f115', padding: '1px 6px', borderRadius: 4 }}>Desc</span>}
                            {pFields.keywords && <span style={{ fontSize: 10, color: '#6366f1', background: '#6366f109', border: '1px solid #6366f115', padding: '1px 6px', borderRadius: 4 }}>Keywords</span>}
                            {pFields.altText && <span style={{ fontSize: 10, color: '#6366f1', background: '#6366f109', border: '1px solid #6366f115', padding: '1px 6px', borderRadius: 4 }}>Alt text</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'editor' && (
          <div>
            {!selectedProduct ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#8b8fa8', marginBottom: 20 }}>Select a product first</div>
                <button onClick={() => setTab('products')} style={{ background: '#ffffff', border: 'none', borderRadius: 12, padding: '12px 28px', color: '#000000', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>Browse Products</button>
              </div>
            ) : (
              <div>
                <div style={{ background: '#1a1c25', border: '1px solid #222535', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                  {selectedProduct.image && <img src={selectedProduct.image} alt={selectedProduct.title} style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', border: '1px solid #222535' }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 17, color: '#f9fafb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedProduct.title}</div>
                    <div style={{ fontSize: 12, color: '#8b8fa8', marginTop: 2 }}>{selectedProduct.vendor} - /products/{selectedProduct.handle}</div>
                  </div>
                  {savedAt && <div style={{ fontSize: 11, color: '#8b8fa8', whiteSpace: 'nowrap' }}>Auto-saved {savedAt.toLocaleTimeString()}</div>}
                  <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
                    <button onClick={generateAll} disabled={generating}
                      style={{ background: generating ? '#353848' : '#ffffff', border: 'none', borderRadius: 12, padding: '10px 22px', color: generating ? '#8b8fa8' : '#000000', fontWeight: 700, cursor: generating ? 'wait' : 'pointer', fontSize: 14 }}>
                      {generating ? 'Generating...' : 'AI Generate All'}
                    </button>
                    <button onClick={() => { saveLocal(selectedProduct.id, editor); setSavedAt(new Date()); showToast('Draft saved'); }}
                      style={{ background: '#0d0d11', border: '1px solid #222535', borderRadius: 12, padding: '10px 18px', color: '#a8adc4', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Save Draft</button>
                    <button onClick={pushToShopify} disabled={pushing || !editor.seoTitle}
                      style={{ background: pushing || !editor.seoTitle ? '#353848' : 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none', borderRadius: 12, padding: '10px 22px', color: '#fff', fontWeight: 700, cursor: pushing ? 'wait' : 'pointer', fontSize: 14 }}>
                      {pushing ? 'Pushing...' : 'Push to Shopify'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#1a1c25', border: '1px solid #222535', borderRadius: 12, padding: 4, width: 'fit-content' }}>
                  {[['fields', 'Fields'], ['preview', 'SERP Preview'], ['checklist', 'SEO Checklist']].map(([id, lbl]) => (
                    <button key={id} onClick={() => setEditorTab(id)} style={{ background: editorTab === id ? 'rgba(255,255,255,0.08)' : 'none', border: editorTab === id ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent', borderRadius: 8, padding: '7px 16px', color: editorTab === id ? '#ffffff' : '#8b8fa8', fontWeight: editorTab === id ? 600 : 400, fontSize: 13, cursor: 'pointer' }}>
                      {lbl}
                    </button>
                  ))}
                </div>

                {editorTab === 'fields' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                      <FieldBlock label="SEO Title" hint="Shown in browser tab and Google search results" badge={<GenBtn onClick={() => generateField('seoTitle')} loading={!!fieldGenerating.seoTitle} />}>
                        <input value={editor.seoTitle} onChange={e => setEditor(ed => ({ ...ed, seoTitle: e.target.value }))}
                          placeholder="e.g. Premium Snowboard - Fast and Responsive"
                          style={{ width: '100%', background: '#0d0d11', border: '1px solid ' + (editor.seoTitle.length > 60 ? '#f87171' : '#222535'), borderRadius: 10, padding: '11px 14px', color: '#f9fafb', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
                        <CharBar value={editor.seoTitle} min={30} max={60} sweetMin={50} sweetMax={58} label="50-60 chars ideal (30-60 accepted by Google)" />
                      </FieldBlock>

                      <FieldBlock label="Meta Description" hint="Shown below title in search results - Google truncates at ~155 chars on desktop, no hard limit" badge={<GenBtn onClick={() => generateField('seoDescription')} loading={!!fieldGenerating.seoDescription} />}>
                        <textarea value={editor.seoDescription} onChange={e => setEditor(ed => ({ ...ed, seoDescription: e.target.value }))}
                          placeholder="Compelling description with your main keyword and a call-to-action."
                          rows={4}
                          style={{ width: '100%', background: '#0d0d11', border: '1px solid ' + (editor.seoDescription.length > 160 ? '#f87171' : '#222535'), borderRadius: 10, padding: '11px 14px', color: '#f9fafb', fontSize: 14, outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }} />
                        <CharBar value={editor.seoDescription} min={120} max={160} sweetMin={150} sweetMax={158} label="150-160 chars ideal (fills Google snippet)" />
                      </FieldBlock>

                      <FieldBlock label="URL Handle / Slug" hint="Use lowercase letters, numbers and hyphens only" badge={<GenBtn onClick={() => generateField('handle')} loading={!!fieldGenerating.handle} small />}>
                        <div style={{ display: 'flex', background: '#0d0d11', border: '1px solid #222535', borderRadius: 10, overflow: 'hidden' }}>
                          <span style={{ padding: '11px 12px', color: '#454860', fontSize: 13, borderRight: '1px solid #222535', whiteSpace: 'nowrap' }}>/products/</span>
                          <input value={editor.handle} onChange={e => setEditor(ed => ({ ...ed, handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                            style={{ flex: 1, background: 'none', border: 'none', padding: '11px 14px', color: '#f9fafb', fontSize: 14, outline: 'none' }} />
                        </div>
                      </FieldBlock>

                      <FieldBlock label="Focus Keywords" hint="Guide the AI copy - not a meta tag ranking signal (Google ignores meta keywords since 2009)" badge={<GenBtn onClick={() => generateField('keywords')} loading={!!fieldGenerating.keywords} small />}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, background: '#0d0d11', border: '1px solid #222535', borderRadius: 10, padding: '8px 10px', minHeight: 50, alignItems: 'center' }}>
                          {chips.map(kw => {
                            const inT = kwInTitleMatch(kw);
                            const inD = kwInDescMatch(kw);
                            const colour = inT && inD ? '#4ade80' : inT || inD ? '#fbbf24' : '#f87171';
                            return (
                              <span key={kw} title={'Title: ' + (inT ? 'yes' : 'no') + ' / Desc: ' + (inD ? 'yes' : 'no')} style={{ background: colour + '18', border: '1px solid ' + colour + '40', borderRadius: 20, padding: '4px 10px 4px 12px', fontSize: 12, color: colour, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                                {kw}
                                <button onClick={() => removeKeywordChip(kw)} style={{ background: 'none', border: 'none', color: colour + '88', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>x</button>
                              </span>
                            );
                          })}
                          <input value={kwInput} onChange={e => setKwInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addKeywordChip(); } }}
                            onBlur={addKeywordChip}
                            placeholder={chips.length === 0 ? 'e.g. snowboard, winter sports...' : 'Add another...'}
                            style={{ flex: 1, minWidth: 120, background: 'none', border: 'none', color: '#f9fafb', fontSize: 13, outline: 'none', padding: '3px 4px' }} />
                        </div>
                        {chips.length > 0 && <div style={{ marginTop: 8, fontSize: 11, color: '#8b8fa8' }}>Green = in title and desc / Yellow = in one / Red = in neither</div>}
                      </FieldBlock>

                      <FieldBlock label="Image Alt Text" hint="Describe the main product image for accessibility and SEO" badge={<GenBtn onClick={() => generateField('altText')} loading={!!fieldGenerating.altText} small />}>
                        <input value={editor.altText} onChange={e => setEditor(ed => ({ ...ed, altText: e.target.value }))}
                          placeholder="e.g. Red premium freestyle snowboard with carbon fibre base"
                          style={{ width: '100%', background: '#0d0d11', border: '1px solid #222535', borderRadius: 10, padding: '11px 14px', color: '#f9fafb', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                      </FieldBlock>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ background: '#1a1c25', border: '1px solid ' + scoreColour + '30', borderRadius: 16, padding: 22 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 18 }}>
                          <ScoreRing score={score} />
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 18, color: '#f9fafb' }}>SEO Health Score</div>
                            <div style={{ fontSize: 13, color: '#8b8fa8', marginTop: 3 }}>Updates as you type</div>
                            <div style={{ marginTop: 8, background: scoreBg, border: '1px solid ' + scoreColour + '30', borderRadius: 8, padding: '5px 12px', display: 'inline-block', fontSize: 13, color: scoreColour, fontWeight: 700 }}>
                              {score < 50 ? 'Needs improvement' : score < 70 ? 'Getting there' : score < 90 ? 'Almost perfect' : 'Excellent!'}
                            </div>
                          </div>
                        </div>
                        {(() => {
                          const kwInT = chips.some(k => kwInTitleMatch(k));
                          const kwInD = chips.some(k => kwInDescMatch(k));
                          return [
                            { label: 'SEO Title', pts: 25, earned: editor.seoTitle.length >= 50 && editor.seoTitle.length <= 60 ? 25 : editor.seoTitle.length >= 40 ? 20 : editor.seoTitle.length >= 30 ? 14 : editor.seoTitle ? 6 : 0, ok: editor.seoTitle.length >= 50 && editor.seoTitle.length <= 60, msg: !editor.seoTitle ? 'Missing' : editor.seoTitle.length > 60 ? 'Too long' : editor.seoTitle.length < 30 ? 'Too short' : editor.seoTitle.length < 50 ? 'Good (' + editor.seoTitle.length + ' chars)' : 'Perfect' },
                            { label: 'Meta Desc', pts: 25, earned: editor.seoDescription.length >= 150 && editor.seoDescription.length <= 160 ? 25 : editor.seoDescription.length >= 130 ? 18 : editor.seoDescription.length >= 120 ? 12 : editor.seoDescription ? 6 : 0, ok: editor.seoDescription.length >= 150 && editor.seoDescription.length <= 160, msg: !editor.seoDescription ? 'Missing' : editor.seoDescription.length > 160 ? 'Too long' : editor.seoDescription.length < 120 ? 'Too short' : editor.seoDescription.length < 150 ? 'Good (' + editor.seoDescription.length + ' chars)' : 'Perfect' },
                            { label: 'KW Set', pts: 5, earned: chips.length >= 1 ? 5 : 0, ok: chips.length >= 1, msg: chips.length ? chips.length + ' kw(s)' : 'None set' },
                            { label: 'KW in Title', pts: 15, earned: kwInT ? 15 : 0, ok: kwInT, msg: kwInT ? 'Found' : chips.length ? 'Not found' : 'No keywords' },
                            { label: 'KW in Desc', pts: 15, earned: kwInD ? 15 : 0, ok: kwInD, msg: kwInD ? 'Found' : chips.length ? 'Not found' : 'No keywords' },
                            { label: 'URL Handle', pts: 5, earned: editor.handle ? 5 : 0, ok: !!editor.handle, msg: editor.handle || 'Missing' },
                            { label: 'Alt Text', pts: 10, earned: editor.altText ? 10 : 0, ok: !!editor.altText, msg: editor.altText ? 'Set' : 'Missing' },
                          ].map(item => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: '#0d0d11', borderRadius: 8, marginBottom: 5 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 11, color: item.ok ? '#4ade80' : '#f87171', fontWeight: 900 }}>{item.ok ? 'Y' : 'N'}</span>
                                <span style={{ fontSize: 12, color: '#a8adc4' }}>{item.label}</span>
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <span style={{ fontSize: 11, color: item.ok ? '#4ade80' : '#8b8fa8' }}>{item.msg}</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: item.earned > 0 ? '#6366f1' : '#454860', background: item.earned > 0 ? '#6366f110' : 'none', border: '1px solid ' + (item.earned > 0 ? '#6366f120' : '#222535'), borderRadius: 4, padding: '1px 6px' }}>{item.earned}/{item.pts}</span>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>

                      {chips.length > 0 && (
                        <div style={{ background: '#1a1c25', border: '1px solid #222535', borderRadius: 16, padding: 18 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#a8adc4', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Keyword Presence</div>
                          {chips.slice(0, 8).map(kw => {
                            const inT = kwInTitleMatch(kw);
                            const inD = kwInDescMatch(kw);
                            return (
                              <div key={kw} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#0d0d11', borderRadius: 8, marginBottom: 5 }}>
                                <span style={{ fontSize: 12, color: '#a8adc4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>"{kw}"</span>
                                <div style={{ display: 'flex', gap: 5 }}>
                                  {[['Title', inT], ['Desc', inD]].map(([lbl, found]) => (
                                    <span key={lbl} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, fontWeight: 700, background: found ? '#0a1f10' : '#1f0a0a', color: found ? '#4ade80' : '#f87171', border: '1px solid ' + (found ? '#4ade8025' : '#f8717125') }}>
                                      {lbl} {found ? 'Y' : 'N'}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {editorTab === 'preview' && (
                  <div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                      {[['desktop', 'Desktop'], ['mobile', 'Mobile']].map(([d, lbl]) => (
                        <button key={d} onClick={() => setSerpDevice(d)} style={{ background: serpDevice === d ? 'rgba(255,255,255,0.08)' : '#1a1c25', border: '1px solid ' + (serpDevice === d ? 'rgba(255,255,255,0.2)' : '#222535'), borderRadius: 10, padding: '8px 18px', color: serpDevice === d ? '#ffffff' : '#8b8fa8', fontWeight: serpDevice === d ? 600 : 400, fontSize: 13, cursor: 'pointer' }}>{lbl}</button>
                      ))}
                    </div>
                    <div style={{ maxWidth: serpDevice === 'mobile' ? 400 : 680, margin: '0 auto' }}>
                      <div style={{ background: '#1a1c25', border: '1px solid #222535', borderRadius: 14, padding: 20, marginBottom: 16 }}>
                        <div style={{ fontSize: 12, color: '#8b8fa8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Google Search Result Preview</div>
                        <SerpPreview title={editor.seoTitle} description={editor.seoDescription} handle={editor.handle} shop={shopDomain} device={serpDevice} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div style={{ background: '#1a1c25', border: '1px solid #222535', borderRadius: 12, padding: 14 }}>
                          <div style={{ fontSize: 11, color: '#8b8fa8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Title</div>
                          <div style={{ fontSize: 12, color: editor.seoTitle.length > 60 ? '#f87171' : editor.seoTitle.length >= 30 ? '#4ade80' : '#fbbf24', fontWeight: 700 }}>{editor.seoTitle.length} chars {editor.seoTitle.length > 60 ? '- truncated' : editor.seoTitle.length < 30 ? '- too short' : '- good'}</div>
                        </div>
                        <div style={{ background: '#1a1c25', border: '1px solid #222535', borderRadius: 12, padding: 14 }}>
                          <div style={{ fontSize: 11, color: '#8b8fa8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Description</div>
                          <div style={{ fontSize: 12, color: editor.seoDescription.length > 160 ? '#f87171' : editor.seoDescription.length >= 120 ? '#4ade80' : '#fbbf24', fontWeight: 700 }}>{editor.seoDescription.length} chars {editor.seoDescription.length > 160 ? '- truncated' : editor.seoDescription.length < 120 ? '- too short' : '- good'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {editorTab === 'checklist' && (
                  <div style={{ maxWidth: 680 }}>
                    <div style={{ background: '#1a1c25', border: '1px solid #222535', borderRadius: 16, padding: 22 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ fontWeight: 800, fontSize: 17, color: '#f9fafb' }}>SEO Checklist</div>
                        <div style={{ background: checkPassed === checklist.length ? '#0a1f10' : '#1f180a', border: '1px solid ' + (checkPassed === checklist.length ? '#4ade8040' : '#fbbf2440'), borderRadius: 10, padding: '6px 14px', fontSize: 14, fontWeight: 800, color: checkPassed === checklist.length ? '#4ade80' : '#fbbf24' }}>
                          {checkPassed} / {checklist.length} passed
                        </div>
                      </div>
                      <div style={{ height: 6, background: '#222535', borderRadius: 3, overflow: 'hidden', marginBottom: 18 }}>
                        <div style={{ height: '100%', width: ((checkPassed / checklist.length) * 100) + '%', background: 'linear-gradient(90deg, #6366f1, #4ade80)', borderRadius: 3, transition: 'width 0.4s ease' }} />
                      </div>
                      {checklist.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', background: item.ok ? '#071a10' : '#0d0d11', border: '1px solid ' + (item.ok ? '#4ade8020' : '#222535'), borderRadius: 10, marginBottom: 6 }}>
                          <div style={{ width: 22, height: 22, borderRadius: 6, background: item.ok ? '#4ade8020' : '#f8717120', border: '1px solid ' + (item.ok ? '#4ade8040' : '#f8717130'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: item.ok ? '#4ade80' : '#f87171', flexShrink: 0 }}>
                            {item.ok ? 'Y' : 'N'}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: item.ok ? '#f9fafb' : '#a8adc4' }}>{item.label}</div>
                            {!item.ok && <div style={{ fontSize: 12, color: '#f87171', marginTop: 3 }}>{item.tip}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'bulk' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f9fafb' }}>Bulk SEO Generation</h2>
                <p style={{ margin: '6px 0 0', fontSize: 14, color: '#8b8fa8' }}>Select products and generate SEO for all at once then publish</p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => setBulkSelected(new Set(products.map(p => p.id)))} style={{ background: '#0d0d11', border: '1px solid #222535', borderRadius: 10, padding: '10px 16px', color: '#a8adc4', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Select All ({products.length})</button>
                <button onClick={() => setBulkSelected(new Set())} style={{ background: '#0d0d11', border: '1px solid #222535', borderRadius: 10, padding: '10px 16px', color: '#a8adc4', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Clear</button>
                <button onClick={runBulkGenerate} disabled={bulkGenerating || !bulkSelected.size}
                  style={{ background: bulkGenerating || !bulkSelected.size ? '#353848' : '#ffffff', border: 'none', borderRadius: 10, padding: '10px 22px', color: bulkGenerating || !bulkSelected.size ? '#8b8fa8' : '#000000', fontWeight: 700, cursor: bulkGenerating ? 'wait' : 'pointer', fontSize: 14, opacity: !bulkSelected.size ? 0.5 : 1 }}>
                  {bulkGenerating ? 'Generating ' + bulkResults.length + '/' + bulkSelected.size + '...' : 'Generate ' + bulkSelected.size + ' product(s)'}
                </button>
                {bulkResults.filter(r => r.status === 'ok').length > 0 && (
                  <button onClick={bulkPushAll} disabled={bulkPushing} style={{ background: bulkPushing ? '#353848' : 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none', borderRadius: 10, padding: '10px 22px', color: '#fff', fontWeight: 700, cursor: bulkPushing ? 'wait' : 'pointer', fontSize: 14 }}>
                    {bulkPushing ? 'Pushing...' : 'Push All (' + bulkResults.filter(r => r.status === 'ok').length + ')'}
                  </button>
                )}
              </div>
            </div>

            {bulkGenerating && (
              <div style={{ background: '#1a1c25', border: '1px solid #222535', borderRadius: 14, padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: '#a8adc4', fontWeight: 600 }}>Generating SEO...</span>
                  <span style={{ fontSize: 14, color: '#6366f1', fontWeight: 700 }}>{bulkResults.length} / {bulkSelected.size}</span>
                </div>
                <div style={{ height: 8, background: '#222535', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: (bulkSelected.size ? (bulkResults.length / bulkSelected.size) * 100 : 0) + '%', background: 'linear-gradient(90deg, #6366f1, #22d3ee)', borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
              </div>
            )}

            {bulkResults.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {bulkResults.map((r, i) => {
                  const { colour: rc } = seoGrade(r.score);
                  return (
                    <div key={i} style={{ background: '#1a1c25', border: '1px solid ' + (r.status === 'ok' ? '#4ade8025' : '#f8717125'), borderRadius: 14, padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        {r.product.image && <img src={r.product.image} alt={r.product.title} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#f9fafb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.product.title}</div>
                          {r.status === 'ok'
                            ? <div style={{ fontSize: 12, color: '#8b8fa8', marginTop: 2 }}>Score: <span style={{ color: rc, fontWeight: 700 }}>{r.score}/100</span></div>
                            : <div style={{ fontSize: 12, color: '#f87171', marginTop: 2 }}>{r.error}</div>}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: r.status === 'ok' ? '#4ade80' : '#f87171' }}>{r.status === 'ok' ? 'OK' : 'ERR'}</span>
                      </div>
                      {r.status === 'ok' && (
                        <div style={{ fontSize: 12, lineHeight: 1.7, borderTop: '1px solid #222535', paddingTop: 10 }}>
                          <div><span style={{ color: '#8b8fa8' }}>Title: </span><span style={{ color: '#a8adc4' }}>{r.fields.seoTitle}</span></div>
                          <div style={{ marginTop: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}><span style={{ color: '#8b8fa8' }}>Desc: </span><span style={{ color: '#a8adc4' }}>{r.fields.seoDescription}</span></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {products.map(p => {
                  const sel = bulkSelected.has(p.id);
                  return (
                    <div key={p.id} onClick={() => { const n = new Set(bulkSelected); sel ? n.delete(p.id) : n.add(p.id); setBulkSelected(n); }}
                      style={{ background: '#1a1c25', border: '2px solid ' + (sel ? '#ffffff' : '#222535'), borderRadius: 12, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s' }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, border: '2px solid ' + (sel ? '#ffffff' : '#454860'), background: sel ? '#ffffff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {sel && <span style={{ color: '#000000', fontSize: 12, fontWeight: 900 }}>Y</span>}
                      </div>
                      {p.image && <img src={p.image} alt={p.title} style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#f9fafb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                        <div style={{ fontSize: 11, color: '#8b8fa8' }}>{p.status} - Score: {seoScore(stored[p.id] || {})}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'analytics' && (
          <div>
            <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 800, color: '#f9fafb' }}>SEO Analytics Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
              {[
                { label: 'Total Products', value: products.length, colour: '#6366f1' },
                { label: 'SEO Generated', value: Object.keys(stored).length, colour: '#a78bfa' },
                { label: 'Score 80+', value: products.filter(p => seoScore(stored[p.id] || {}) >= 80).length, colour: '#4ade80' },
                { label: 'Score under 50', value: products.filter(p => stored[p.id] && seoScore(stored[p.id] || {}) < 50).length, colour: '#fbbf24' },
                { label: 'No SEO Data', value: products.filter(p => !stored[p.id]?.seoTitle).length, colour: '#f87171' },
                { label: 'Have Keywords', value: products.filter(p => stored[p.id]?.keywords).length, colour: '#22d3ee' },
              ].map(st => (
                <div key={st.label} style={{ background: '#1a1c25', border: '1px solid #222535', borderRadius: 16, padding: '18px 20px' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: st.colour, lineHeight: 1 }}>{st.value}</div>
                  <div style={{ fontSize: 12, color: '#8b8fa8', marginTop: 8, fontWeight: 400 }}>{st.label}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#1a1c25', border: '1px solid #222535', borderRadius: 16, padding: 24, marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700, color: '#f9fafb' }}>Score Distribution</h3>
              {[
                { label: 'Excellent (80-100)', min: 80, max: 100, colour: '#4ade80' },
                { label: 'Good (60-79)', min: 60, max: 79, colour: '#a3e635' },
                { label: 'Needs Work (40-59)', min: 40, max: 59, colour: '#fbbf24' },
                { label: 'Poor (0-39)', min: 0, max: 39, colour: '#f87171' },
              ].map(band => {
                const count = products.filter(p => { const s = seoScore(stored[p.id] || {}); return s >= band.min && s <= band.max; }).length;
                const pct = products.length ? Math.round((count / products.length) * 100) : 0;
                return (
                  <div key={band.label} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: '#a8adc4' }}>{band.label}</span>
                      <span style={{ fontSize: 13, color: band.colour, fontWeight: 700 }}>{count} products - {pct}%</span>
                    </div>
                    <div style={{ height: 10, background: '#1a1c25', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg, ' + band.colour + '80, ' + band.colour + ')', borderRadius: 5, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ background: '#1a1c25', border: '1px solid #222535', borderRadius: 16, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#f9fafb' }}>Needs Attention</h3>
              {products.filter(p => seoScore(stored[p.id] || {}) < 50).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#4ade80', fontSize: 15, fontWeight: 700 }}>All products have good SEO scores!</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {products.filter(p => seoScore(stored[p.id] || {}) < 50).slice(0, 10).map(p => {
                    const ps = seoScore(stored[p.id] || {});
                    const { colour: pc } = seoGrade(ps);
                    const f = stored[p.id] || {};
                    const issues = [];
                    if (!f.seoTitle) issues.push('No SEO title');
                    else if (f.seoTitle.length < 30) issues.push('Title too short');
                    else if (f.seoTitle.length > 60) issues.push('Title too long');
                    if (!f.seoDescription) issues.push('No meta description');
                    if (!f.keywords) issues.push('No keywords');
                    const kws = (f.keywords || '').split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
                    if (f.seoTitle && kws.length && !kws.some(k => f.seoTitle.toLowerCase().includes(k))) issues.push('Keyword not in title');
                    return (
                      <div key={p.id} onClick={() => selectProduct(p)}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: '#0d0d11', borderRadius: 10, cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1a1c25'}
                      onMouseLeave={e => e.currentTarget.style.background = '#0d0d11'}>
                        {p.image && <img src={p.image} alt={p.title} style={{ width: 34, height: 34, borderRadius: 7, objectFit: 'cover' }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#f9fafb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                          <div style={{ fontSize: 11, color: '#f87171', marginTop: 2 }}>{issues.join(' / ')}</div>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: pc, minWidth: 34, textAlign: 'right' }}>{ps}</div>
                        <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 700, whiteSpace: 'nowrap' }}>Fix it</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
        input:focus, textarea:focus { border-color: #ffffff !important; box-shadow: 0 0 0 3px rgba(255,255,255,0.06) !important; }
        button:not(:disabled):active { transform: scale(0.96); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0d0d11; }
        ::-webkit-scrollbar-thumb { background: #353848; border-radius: 3px; }
      `}</style>
    </div>
  );
}



