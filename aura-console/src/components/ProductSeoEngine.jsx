import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ─── tiny helpers ───────────────────────────────────────────────
const apiFetch = (url, opts = {}) =>
  axios({ url, withCredentials: true, ...opts }).then(r => r.data);

function seoScore(fields) {
  let s = 0;
  if (fields.seoTitle && fields.seoTitle.length >= 30 && fields.seoTitle.length <= 60) s += 30;
  else if (fields.seoTitle) s += 15;
  if (fields.seoDescription && fields.seoDescription.length >= 120 && fields.seoDescription.length <= 160) s += 30;
  else if (fields.seoDescription) s += 15;
  if (fields.keywords && fields.keywords.split(',').filter(Boolean).length >= 3) s += 20;
  else if (fields.keywords) s += 10;
  if (fields.handle) s += 10;
  if (fields.altText) s += 10;
  return s;
}

function ScoreRing({ score }) {
  const colour = score >= 80 ? '#4ade80' : score >= 50 ? '#fbbf24' : '#f87171';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: `conic-gradient(${colour} ${score * 3.6}deg, #1e2a3a ${score * 3.6}deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: colour, fontWeight: 800, fontSize: 18 }}>{score}</span>
        </div>
      </div>
      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>SEO Score</span>
    </div>
  );
}

function CharBar({ value = '', min, max, label }) {
  const len = value.length;
  const ok = len >= min && len <= max;
  const over = len > max;
  const pct = Math.min(100, (len / (max + 20)) * 100);
  const colour = ok ? '#4ade80' : over ? '#f87171' : '#fbbf24';
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: '#64748b' }}>{label}</span>
        <span style={{ fontSize: 11, color: colour, fontWeight: 600 }}>{len} / {max} chars</span>
      </div>
      <div style={{ height: 4, background: '#1e2a3a', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: colour, borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

function GooglePreview({ title, description, handle, shop }) {
  const url = shop ? `https://${shop}/products/${handle || 'product-slug'}` : `yourstore.myshopify.com/products/${handle || 'product-slug'}`;
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', fontFamily: 'Arial, sans-serif', border: '1px solid #e5e7eb' }}>
      <div style={{ fontSize: 12, color: '#006621', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</div>
      <div style={{ fontSize: 17, color: '#1a0dab', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title || 'Your SEO Title'}</div>
      <div style={{ fontSize: 13, color: '#545454', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {description || 'Your meta description will appear here. Make it compelling and 120–160 characters.'}
      </div>
    </div>
  );
}

const TABS = ['Products', 'Editor', 'Bulk Generate', 'Analytics'];

export default function ProductSeoEngine() {
  const [tab, setTab] = useState('Products');
  const [shopifyProducts, setShopifyProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Editor state
  const [editor, setEditor] = useState({ seoTitle: '', seoDescription: '', handle: '', keywords: '', altText: '' });
  const [generating, setGenerating] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [toast, setToast] = useState(null);
  const [shopDomain, setShopDomain] = useState('');

  // Bulk state
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkResults, setBulkResults] = useState([]);
  const [bulkPushing, setBulkPushing] = useState(false);

  // Per-field generate
  const [kwInput, setKwInput] = useState('');
  const [fieldGenerating, setFieldGenerating] = useState({});

  // Analytics
  const [analytics, setAnalytics] = useState({ generated: 0, pushed: 0, avgScore: 0, topIssues: [] });

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    loadProducts();
    // Get shop domain for SERP preview
    axios.get('/api/session', { withCredentials: true }).then(r => {
      const s = r.data?.projectDetails?.domain || r.data?.shop || '';
      setShopDomain(s.replace('https://', '').replace('http://', '').replace(/\/$/, ''));
    }).catch(() => {});
  }, []);

  async function loadProducts() {
    setLoadingProducts(true);
    try {
      const data = await apiFetch('/api/product-seo/shopify-products');
      setShopifyProducts(data.products || []);
      if (data.products?.length) {
        // compute analytics
        const stored = JSON.parse(localStorage.getItem('aura_seo_records') || '{}');
        const scores = data.products.map(p => seoScore(stored[p.id] || {}));
        setAnalytics(a => ({
          ...a,
          avgScore: scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0,
          generated: Object.keys(stored).length,
        }));
      }
    } catch (e) {
      showToast('Could not load Shopify products — check your connection', 'error');
    }
    setLoadingProducts(false);
  }

  function selectProduct(p) {
    setSelectedProduct(p);
    // Load previously saved fields from localStorage
    const stored = JSON.parse(localStorage.getItem('aura_seo_records') || '{}');
    const saved = stored[p.id] || {};
    setEditor({
      seoTitle: saved.seoTitle || p.title || '',
      seoDescription: saved.seoDescription || '',
      handle: saved.handle || p.handle || '',
      keywords: saved.keywords || '',
      altText: saved.altText || '',
    });
    setTab('Editor');
  }

  async function generateSeo() {
    if (!selectedProduct) return;
    setGenerating(true);
    try {
      const res = await apiFetch('/api/product-seo/generate', {
        method: 'POST',
        data: { productName: selectedProduct.title, productDescription: selectedProduct.title + (selectedProduct.tags ? '. Tags: ' + selectedProduct.tags : '') },
      });
      // Parse the raw AI text into structured fields
      const raw = res.result || '';
      const extract = (label, text) => {
        const re = new RegExp(label + '[:\\s]+(.+)', 'i');
        const m = text.match(re);
        return m ? m[1].replace(/^["']|["']$/g, '').trim() : '';
      };
      const seoTitle = extract('(seo )?title', raw) || selectedProduct.title;
      const seoDescription = extract('meta description', raw) || extract('description', raw) || '';
      const keywords = extract('keywords', raw) || extract('keyword', raw) || '';
      const handle = (seoTitle || selectedProduct.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setEditor(e => ({ ...e, seoTitle, seoDescription, keywords, handle }));
      showToast('AI SEO generated! Review and push to Shopify.');
      // Auto-save to localStorage
      saveLocal(selectedProduct.id, { seoTitle, seoDescription, keywords, handle });
    } catch (err) {
      showToast('AI generation failed: ' + (err.response?.data?.error || err.message), 'error');
    }
    setGenerating(false);
  }

  function saveLocal(productId, fields) {
    const stored = JSON.parse(localStorage.getItem('aura_seo_records') || '{}');
    stored[productId] = { ...(stored[productId] || {}), ...fields };
    localStorage.setItem('aura_seo_records', JSON.stringify(stored));
  }

  async function generateField(field) {
    if (!selectedProduct) return;
    setFieldGenerating(f => ({ ...f, [field]: true }));
    try {
      const res = await apiFetch('/api/product-seo/generate', {
        method: 'POST',
        data: { productName: selectedProduct.title, productDescription: selectedProduct.title + (selectedProduct.tags ? '. Tags: ' + selectedProduct.tags : '') },
      });
      const raw = res.result || '';
      const extract = (label, text) => {
        const re = new RegExp(label + '[:\\s]+(.+)', 'i');
        const m = text.match(re);
        return m ? m[1].replace(/^["']|["']$/g, '').trim() : '';
      };
      if (field === 'seoTitle') {
        const val = extract('(seo )?title', raw) || selectedProduct.title;
        setEditor(e => ({ ...e, seoTitle: val }));
        saveLocal(selectedProduct.id, { seoTitle: val });
      } else if (field === 'seoDescription') {
        const val = extract('meta description', raw) || extract('description', raw) || '';
        setEditor(e => ({ ...e, seoDescription: val }));
        saveLocal(selectedProduct.id, { seoDescription: val });
      } else if (field === 'keywords') {
        const val = extract('keywords', raw) || extract('keyword', raw) || '';
        setEditor(e => ({ ...e, keywords: val }));
        saveLocal(selectedProduct.id, { keywords: val });
      } else if (field === 'handle') {
        const title = extract('(seo )?title', raw) || selectedProduct.title;
        const val = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        setEditor(e => ({ ...e, handle: val }));
        saveLocal(selectedProduct.id, { handle: val });
      } else if (field === 'altText') {
        const val = extract('alt text', raw) || extract('alt', raw) || `${selectedProduct.title} product image`;
        setEditor(e => ({ ...e, altText: val }));
        saveLocal(selectedProduct.id, { altText: val });
      }
      showToast(`✨ ${field} generated!`);
    } catch (err) {
      showToast('Generation failed: ' + (err.response?.data?.error || err.message), 'error');
    }
    setFieldGenerating(f => ({ ...f, [field]: false }));
  }

  function addKeywordChip() {
    const trimmed = kwInput.trim().replace(/,$/, '');
    if (!trimmed) return;
    const existing = editor.keywords.split(',').map(k => k.trim()).filter(Boolean);
    const newKws = trimmed.split(/[,\n]+/).map(k => k.trim()).filter(k => k && !existing.includes(k));
    if (newKws.length) setEditor(e => ({ ...e, keywords: [...existing, ...newKws].join(', ') }));
    setKwInput('');
  }

  function removeKeywordChip(kw) {
    const updated = editor.keywords.split(',').map(k => k.trim()).filter(k => k && k !== kw);
    setEditor(e => ({ ...e, keywords: updated.join(', ') }));
  }

  async function pushToShopify() {
    if (!selectedProduct) return;
    setPushing(true);
    try {
      await apiFetch('/api/product-seo/push-to-shopify', {
        method: 'POST',
        data: {
          productId: selectedProduct.id,
          title: editor.seoTitle !== selectedProduct.title ? editor.seoTitle : undefined,
          metaTitle: editor.seoTitle,
          metaDescription: editor.seoDescription,
          handle: editor.handle !== selectedProduct.handle ? editor.handle : undefined,
        },
      });
      saveLocal(selectedProduct.id, editor);
      setAnalytics(a => ({ ...a, pushed: a.pushed + 1 }));
      showToast('✅ SEO pushed to Shopify successfully!');
    } catch (err) {
      showToast('Push failed: ' + (err.response?.data?.error || err.message), 'error');
    }
    setPushing(false);
  }

  async function runBulkGenerate() {
    if (!bulkSelected.size) return;
    setBulkGenerating(true);
    setBulkResults([]);
    const products = shopifyProducts.filter(p => bulkSelected.has(p.id));
    const results = [];
    for (const p of products) {
      try {
        const res = await apiFetch('/api/product-seo/generate', {
          method: 'POST',
          data: { productName: p.title, productDescription: p.title + (p.tags ? '. Tags: ' + p.tags : '') },
        });
        const raw = res.result || '';
        const extract = (label, text) => {
          const re = new RegExp(label + '[:\\s]+(.+)', 'i');
          const m = text.match(re);
          return m ? m[1].replace(/^["']|["']$/g, '').trim() : '';
        };
        const seoTitle = extract('(seo )?title', raw) || p.title;
        const seoDescription = extract('meta description', raw) || extract('description', raw) || '';
        const keywords = extract('keywords', raw) || '';
        const handle = seoTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const fields = { seoTitle, seoDescription, keywords, handle };
        saveLocal(p.id, fields);
        results.push({ product: p, fields, score: seoScore(fields), status: 'ok' });
      } catch (e) {
        results.push({ product: p, fields: {}, score: 0, status: 'error', error: e.message });
      }
      setBulkResults([...results]);
    }
    setBulkGenerating(false);
    setAnalytics(a => ({ ...a, generated: a.generated + results.filter(r => r.status === 'ok').length }));
    showToast(`Bulk generation complete — ${results.filter(r => r.status === 'ok').length} products done`);
  }

  async function bulkPushAll() {
    const tooPush = bulkResults.filter(r => r.status === 'ok');
    if (!tooPush.length) return;
    setBulkPushing(true);
    let pushed = 0;
    for (const r of tooPush) {
      try {
        await apiFetch('/api/product-seo/push-to-shopify', {
          method: 'POST',
          data: { productId: r.product.id, metaTitle: r.fields.seoTitle, metaDescription: r.fields.seoDescription },
        });
        pushed++;
      } catch (_) {}
    }
    setBulkPushing(false);
    setAnalytics(a => ({ ...a, pushed: a.pushed + pushed }));
    showToast(`✅ Pushed ${pushed} products to Shopify!`);
  }

  const filteredProducts = shopifyProducts.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.handle.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const score = seoScore(editor);

  const stored = JSON.parse(localStorage.getItem('aura_seo_records') || '{}');

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#e5e7eb', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: toast.type === 'error' ? '#2d1515' : '#0f2d24', border: `1px solid ${toast.type === 'error' ? '#f87171' : '#4ade80'}`, borderRadius: 12, padding: '14px 20px', color: toast.type === 'error' ? '#f87171' : '#4ade80', fontSize: 14, fontWeight: 500, maxWidth: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e2a3a 100%)', borderBottom: '1px solid #1e2a3a', padding: '28px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#7fffd4', margin: 0 }}>Product SEO Engine</h1>
            <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>AI-powered SEO generation, scoring & direct Shopify publishing</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#7fffd4' }}>{shopifyProducts.length}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Products</div>
            </div>
            <div style={{ background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#a78bfa' }}>{analytics.generated}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Generated</div>
            </div>
            <div style={{ background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#4ade80' }}>{analytics.pushed}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Pushed Live</div>
            </div>
            <div style={{ background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: analytics.avgScore >= 80 ? '#4ade80' : analytics.avgScore >= 50 ? '#fbbf24' : '#f87171' }}>{analytics.avgScore}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Avg Score</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderTop: '1px solid #1e2a3a' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', padding: '12px 24px', cursor: 'pointer',
              color: tab === t ? '#7fffd4' : '#64748b', fontWeight: tab === t ? 700 : 500, fontSize: 14,
              borderBottom: tab === t ? '2px solid #7fffd4' : '2px solid transparent',
              transition: 'all 0.15s',
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '28px 32px' }}>

        {/* ── PRODUCTS TAB ── */}
        {tab === 'Products' && (
          <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <input
                placeholder="🔍  Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 10, padding: '10px 16px', color: '#e5e7eb', fontSize: 14, outline: 'none' }}
              />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                style={{ background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 10, padding: '10px 16px', color: '#e5e7eb', fontSize: 14, cursor: 'pointer' }}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
              <button onClick={loadProducts} style={{ background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 10, padding: '10px 16px', color: '#7fffd4', cursor: 'pointer', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>
                ↻ Refresh
              </button>
              <button onClick={() => { setBulkSelected(new Set(filteredProducts.map(p => p.id))); setTab('Bulk Generate'); }}
                style={{ background: '#7fffd4', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#0f172a', cursor: 'pointer', fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap' }}>
                ⚡ Bulk Generate All
              </button>
            </div>

            {loadingProducts ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} style={{ background: '#1e2a3a', borderRadius: 14, padding: 20, height: 120, animation: 'pulse 1.5s ease infinite' }} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 0', color: '#64748b' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🛍️</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#94a3b8' }}>No products found</div>
                <div style={{ fontSize: 14, marginTop: 8 }}>Connect your Shopify store or adjust your search filters</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {filteredProducts.map(p => {
                  const savedFields = stored[p.id] || {};
                  const ps = seoScore(savedFields);
                  const hasData = Object.keys(savedFields).length > 0;
                  const scoreColor = ps >= 80 ? '#4ade80' : ps >= 50 ? '#fbbf24' : '#f87171';
                  return (
                    <div key={p.id} onClick={() => selectProduct(p)}
                      style={{ background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 14, padding: 18, cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#7fffd4'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#2f3650'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        {p.image ? (
                          <img src={p.image} alt={p.title} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 56, height: 56, borderRadius: 10, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>📦</div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: '#e5e7eb', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.handle} • {p.vendor}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: p.status === 'active' ? '#0f2d24' : '#231f15', color: p.status === 'active' ? '#4ade80' : '#fbbf24', border: `1px solid ${p.status === 'active' ? '#4ade80' : '#fbbf24'}`, fontWeight: 600 }}>
                              {p.status}
                            </span>
                            {p.variants && <span style={{ fontSize: 11, color: '#64748b' }}>{p.variants.length} variant{p.variants.length !== 1 ? 's' : ''}</span>}
                          </div>
                        </div>
                        <div style={{ flexShrink: 0, textAlign: 'center' }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: hasData ? scoreColor : '#374151' }}>{hasData ? ps : '—'}</div>
                          <div style={{ fontSize: 10, color: '#475569', fontWeight: 600 }}>SEO</div>
                        </div>
                      </div>
                      {hasData && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #2f3650', display: 'flex', gap: 6 }}>
                          {savedFields.seoTitle && <span style={{ fontSize: 11, color: '#7fffd4', background: 'rgba(127,255,212,0.08)', padding: '2px 8px', borderRadius: 4 }}>✓ Title</span>}
                          {savedFields.seoDescription && <span style={{ fontSize: 11, color: '#7fffd4', background: 'rgba(127,255,212,0.08)', padding: '2px 8px', borderRadius: 4 }}>✓ Description</span>}
                          {savedFields.keywords && <span style={{ fontSize: 11, color: '#7fffd4', background: 'rgba(127,255,212,0.08)', padding: '2px 8px', borderRadius: 4 }}>✓ Keywords</span>}
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: 14, right: 14, fontSize: 12, color: '#7fffd4', fontWeight: 700, opacity: 0 }} className="edit-label">Edit →</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── EDITOR TAB ── */}
        {tab === 'Editor' && (
          <div>
            {!selectedProduct ? (
              <div style={{ textAlign: 'center', padding: '64px 0', color: '#64748b' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>👈</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#94a3b8' }}>Select a product first</div>
                <button onClick={() => setTab('Products')} style={{ marginTop: 16, background: '#7fffd4', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#0f172a', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Browse Products</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
                {/* Left: Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Product info bar */}
                  <div style={{ background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    {selectedProduct.image && <img src={selectedProduct.image} alt={selectedProduct.title} style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover' }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedProduct.title}</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>{selectedProduct.vendor} • {selectedProduct.handle}</div>
                    </div>
                    <button onClick={generateSeo} disabled={generating}
                      style={{ background: generating ? '#374151' : 'linear-gradient(135deg, #7fffd4, #22d3ee)', border: 'none', borderRadius: 10, padding: '10px 22px', color: '#0f172a', fontWeight: 800, cursor: generating ? 'wait' : 'pointer', fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {generating ? '⏳ Generating…' : '✨ AI Generate'}
                    </button>
                  </div>

                  {/* SEO Title */}
                  <div style={{ background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 14, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label style={{ fontWeight: 700, color: '#94a3b8', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>SEO Title (Page Title)</label>
                      <button onClick={() => generateField('seoTitle')} disabled={fieldGenerating.seoTitle || generating}
                        style={{ background: 'linear-gradient(135deg, #7fffd4, #22d3ee)', border: 'none', borderRadius: 8, padding: '5px 14px', color: '#0f172a', fontWeight: 700, fontSize: 12, cursor: 'pointer', opacity: fieldGenerating.seoTitle ? 0.6 : 1 }}>
                        {fieldGenerating.seoTitle ? '…' : '✨ Generate'}
                      </button>
                    </div>
                    <input value={editor.seoTitle} onChange={e => setEditor(ed => ({ ...ed, seoTitle: e.target.value }))}
                      placeholder="e.g. Premium Ski Wax — Fast & Long-Lasting | Brand Name"
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #2f3650', borderRadius: 8, padding: '10px 14px', color: '#e5e7eb', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                    />
                    <CharBar value={editor.seoTitle} min={30} max={60} label="Recommended: 30–60 chars" />
                    {editor.seoTitle.length > 60 && <div style={{ marginTop: 6, fontSize: 12, color: '#f87171' }}>⚠️ Too long — Google will truncate this in search results</div>}
                  </div>

                  {/* Meta Description */}
                  <div style={{ background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 14, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label style={{ fontWeight: 700, color: '#94a3b8', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Meta Description</label>
                      <button onClick={() => generateField('seoDescription')} disabled={fieldGenerating.seoDescription || generating}
                        style={{ background: 'linear-gradient(135deg, #7fffd4, #22d3ee)', border: 'none', borderRadius: 8, padding: '5px 14px', color: '#0f172a', fontWeight: 700, fontSize: 12, cursor: 'pointer', opacity: fieldGenerating.seoDescription ? 0.6 : 1 }}>
                        {fieldGenerating.seoDescription ? '…' : '✨ Generate'}
                      </button>
                    </div>
                    <textarea value={editor.seoDescription} onChange={e => setEditor(ed => ({ ...ed, seoDescription: e.target.value }))}
                      placeholder="Compelling description that appears in Google results. Include your main keyword and a call-to-action."
                      rows={4}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #2f3650', borderRadius: 8, padding: '10px 14px', color: '#e5e7eb', fontSize: 14, outline: 'none', resize: 'vertical', lineHeight: 1.5, boxSizing: 'border-box' }}
                    />
                    <CharBar value={editor.seoDescription} min={120} max={160} label="Recommended: 120–160 chars" />
                  </div>

                  {/* URL Handle */}
                  <div style={{ background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 14, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label style={{ fontWeight: 700, color: '#94a3b8', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>URL Handle / Slug</label>
                      <button onClick={() => generateField('handle')} disabled={fieldGenerating.handle || generating}
                        style={{ background: 'linear-gradient(135deg, #7fffd4, #22d3ee)', border: 'none', borderRadius: 8, padding: '5px 14px', color: '#0f172a', fontWeight: 700, fontSize: 12, cursor: 'pointer', opacity: fieldGenerating.handle ? 0.6 : 1 }}>
                        {fieldGenerating.handle ? '…' : '✨ Generate'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #2f3650', borderRadius: 8, overflow: 'hidden' }}>
                      <span style={{ padding: '10px 12px', color: '#475569', fontSize: 13, borderRight: '1px solid #2f3650', whiteSpace: 'nowrap' }}>/products/</span>
                      <input value={editor.handle} onChange={e => setEditor(ed => ({ ...ed, handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                        style={{ flex: 1, background: 'none', border: 'none', padding: '10px 14px', color: '#e5e7eb', fontSize: 14, outline: 'none' }}
                      />
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Use lowercase letters, numbers, and hyphens only</div>
                  </div>

                  {/* Keywords */}
                  <div style={{ background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 14, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label style={{ fontWeight: 700, color: '#94a3b8', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Focus Keywords <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 12 }}>(Enter or comma to add)</span></label>
                      <button onClick={() => generateField('keywords')} disabled={fieldGenerating.keywords || generating}
                        style={{ background: 'linear-gradient(135deg, #7fffd4, #22d3ee)', border: 'none', borderRadius: 8, padding: '5px 14px', color: '#0f172a', fontWeight: 700, fontSize: 12, cursor: 'pointer', opacity: fieldGenerating.keywords ? 0.6 : 1 }}>
                        {fieldGenerating.keywords ? '…' : '✨ Generate'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, background: '#0f172a', border: '1px solid #2f3650', borderRadius: 8, padding: '8px 10px', minHeight: 44, alignItems: 'center' }}>
                      {editor.keywords.split(',').filter(k => k.trim()).map((kw, i) => (
                        <span key={i} style={{ background: 'rgba(127,255,212,0.12)', border: '1px solid rgba(127,255,212,0.35)', borderRadius: 20, padding: '3px 10px 3px 12px', fontSize: 12, color: '#7fffd4', display: 'flex', alignItems: 'center', gap: 5 }}>
                          {kw.trim()}
                          <button onClick={() => removeKeywordChip(kw.trim())} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                        </span>
                      ))}
                      <input
                        value={kwInput}
                        onChange={e => setKwInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addKeywordChip(); } }}
                        onBlur={addKeywordChip}
                        placeholder={editor.keywords ? 'Add another…' : 'e.g. snowboard, winter sports…'}
                        style={{ flex: 1, minWidth: 120, background: 'none', border: 'none', color: '#e5e7eb', fontSize: 13, outline: 'none', padding: '2px 4px' }}
                      />
                    </div>
                  </div>

                  {/* Alt Text */}
                  <div style={{ background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 14, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label style={{ fontWeight: 700, color: '#94a3b8', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Image Alt Text</label>
                      <button onClick={() => generateField('altText')} disabled={fieldGenerating.altText || generating}
                        style={{ background: 'linear-gradient(135deg, #7fffd4, #22d3ee)', border: 'none', borderRadius: 8, padding: '5px 14px', color: '#0f172a', fontWeight: 700, fontSize: 12, cursor: 'pointer', opacity: fieldGenerating.altText ? 0.6 : 1 }}>
                        {fieldGenerating.altText ? '…' : '✨ Generate'}
                      </button>
                    </div>
                    <input value={editor.altText} onChange={e => setEditor(ed => ({ ...ed, altText: e.target.value }))}
                      placeholder="Descriptive alt text for the main product image"
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #2f3650', borderRadius: 8, padding: '10px 14px', color: '#e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => { saveLocal(selectedProduct.id, editor); showToast('Draft saved locally'); }}
                      style={{ flex: 1, background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 10, padding: '12px', color: '#94a3b8', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                      💾 Save Draft
                    </button>
                    <button onClick={pushToShopify} disabled={pushing || !editor.seoTitle}
                      style={{ flex: 2, background: pushing ? '#374151' : 'linear-gradient(135deg, #7fffd4, #22d3ee)', border: 'none', borderRadius: 10, padding: '12px', color: '#0f172a', fontWeight: 800, cursor: pushing ? 'wait' : 'pointer', fontSize: 15 }}>
                      {pushing ? '⏳ Pushing to Shopify…' : '🚀 Push to Shopify'}
                    </button>
                  </div>
                </div>

                {/* Right: Score + Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Score card */}
                  <div style={{ background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 14, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
                      <ScoreRing score={score} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: '#e5e7eb' }}>
                          {score >= 80 ? '🏆 Excellent' : score >= 60 ? '👍 Good' : score >= 40 ? '⚠️ Needs Work' : '❌ Poor'}
                        </div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>SEO Health Score</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { label: 'SEO Title', ok: editor.seoTitle.length >= 30 && editor.seoTitle.length <= 60, msg: editor.seoTitle.length === 0 ? 'Missing' : editor.seoTitle.length < 30 ? 'Too short' : editor.seoTitle.length > 60 ? 'Too long' : 'Perfect' },
                        { label: 'Meta Description', ok: editor.seoDescription.length >= 120 && editor.seoDescription.length <= 160, msg: editor.seoDescription.length === 0 ? 'Missing' : editor.seoDescription.length < 120 ? 'Too short' : editor.seoDescription.length > 160 ? 'Too long' : 'Perfect' },
                        { label: 'Keywords', ok: editor.keywords.split(',').filter(Boolean).length >= 3, msg: editor.keywords ? `${editor.keywords.split(',').filter(Boolean).length} keywords` : 'Missing' },
                        { label: 'URL Handle', ok: !!editor.handle, msg: editor.handle || 'Missing' },
                        { label: 'Alt Text', ok: !!editor.altText, msg: editor.altText ? 'Set' : 'Missing' },
                      ].map(item => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#0f172a', borderRadius: 8 }}>
                          <span style={{ fontSize: 13, color: '#94a3b8' }}>{item.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: item.ok ? '#4ade80' : '#f87171' }}>
                            {item.ok ? '✓' : '✗'} {item.msg}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SERP Preview */}
                  <div style={{ background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 14, padding: 20 }}>
                    <div style={{ fontWeight: 700, color: '#94a3b8', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Google SERP Preview</div>
                    <GooglePreview title={editor.seoTitle} description={editor.seoDescription} handle={editor.handle} shop={shopDomain} />
                  </div>

                  {/* Keyword density check */}
                  {editor.keywords && editor.seoDescription && (
                    <div style={{ background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 14, padding: 20 }}>
                      <div style={{ fontWeight: 700, color: '#94a3b8', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Keyword Presence Check</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {editor.keywords.split(',').filter(k => k.trim()).slice(0, 5).map((kw, i) => {
                          const kwClean = kw.trim().toLowerCase();
                          const inTitle = editor.seoTitle.toLowerCase().includes(kwClean);
                          const inDesc = editor.seoDescription.toLowerCase().includes(kwClean);
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#0f172a', borderRadius: 6 }}>
                              <span style={{ fontSize: 13, color: '#94a3b8' }}>"{kwClean}"</span>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: inTitle ? '#0f2d24' : '#1a0f0f', color: inTitle ? '#4ade80' : '#f87171', border: `1px solid ${inTitle ? '#4ade80' : '#ef444420'}` }}>Title {inTitle ? '✓' : '✗'}</span>
                                <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: inDesc ? '#0f2d24' : '#1a0f0f', color: inDesc ? '#4ade80' : '#f87171', border: `1px solid ${inDesc ? '#4ade80' : '#ef444420'}` }}>Desc {inDesc ? '✓' : '✗'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── BULK GENERATE TAB ── */}
        {tab === 'Bulk Generate' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#e5e7eb' }}>Bulk SEO Generation</h2>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>Select products and generate SEO for all of them at once, then push in bulk to Shopify</p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setBulkSelected(new Set(shopifyProducts.map(p => p.id)))}
                  style={{ background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 10, padding: '10px 16px', color: '#94a3b8', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Select All ({shopifyProducts.length})
                </button>
                <button onClick={() => setBulkSelected(new Set())}
                  style={{ background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 10, padding: '10px 16px', color: '#94a3b8', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Clear
                </button>
                <button onClick={runBulkGenerate} disabled={bulkGenerating || !bulkSelected.size}
                  style={{ background: bulkGenerating || !bulkSelected.size ? '#374151' : 'linear-gradient(135deg, #7fffd4, #22d3ee)', border: 'none', borderRadius: 10, padding: '10px 22px', color: '#0f172a', fontWeight: 800, cursor: bulkGenerating ? 'wait' : 'pointer', fontSize: 14, opacity: !bulkSelected.size ? 0.5 : 1 }}>
                  {bulkGenerating ? `⏳ Generating... (${bulkResults.length}/${bulkSelected.size})` : `✨ Generate ${bulkSelected.size} Products`}
                </button>
                {bulkResults.filter(r => r.status === 'ok').length > 0 && (
                  <button onClick={bulkPushAll} disabled={bulkPushing}
                    style={{ background: bulkPushing ? '#374151' : '#7c3aed', border: 'none', borderRadius: 10, padding: '10px 22px', color: '#fff', fontWeight: 800, cursor: bulkPushing ? 'wait' : 'pointer', fontSize: 14 }}>
                    {bulkPushing ? '⏳ Pushing…' : `🚀 Push All to Shopify (${bulkResults.filter(r => r.status === 'ok').length})`}
                  </button>
                )}
              </div>
            </div>

            {/* Product selector + results */}
            {bulkResults.length > 0 ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                  {bulkResults.map((r, i) => (
                    <div key={i} style={{ background: '#1e2a3a', border: `1px solid ${r.status === 'ok' ? '#4ade8040' : '#f8717140'}`, borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        {r.product.image && <img src={r.product.image} alt={r.product.title} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.product.title}</div>
                          {r.status === 'ok' && <div style={{ fontSize: 12, color: '#64748b' }}>Score: <span style={{ color: r.score >= 80 ? '#4ade80' : r.score >= 50 ? '#fbbf24' : '#f87171', fontWeight: 600 }}>{r.score}/100</span></div>}
                          {r.status === 'error' && <div style={{ fontSize: 12, color: '#f87171' }}>{r.error}</div>}
                        </div>
                        <span style={{ fontSize: 20 }}>{r.status === 'ok' ? '✅' : '❌'}</span>
                      </div>
                      {r.status === 'ok' && (
                        <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                          <div><span style={{ color: '#64748b' }}>Title: </span>{r.fields.seoTitle}</div>
                          <div style={{ marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}><span style={{ color: '#64748b' }}>Desc: </span>{r.fields.seoDescription}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {shopifyProducts.map(p => (
                  <div key={p.id} onClick={() => {
                    const next = new Set(bulkSelected);
                    if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                    setBulkSelected(next);
                  }}
                    style={{ background: '#1e2a3a', border: `2px solid ${bulkSelected.has(p.id) ? '#7fffd4' : '#2f3650'}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s' }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${bulkSelected.has(p.id) ? '#7fffd4' : '#374151'}`, background: bulkSelected.has(p.id) ? '#7fffd4' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {bulkSelected.has(p.id) && <span style={{ color: '#0f172a', fontSize: 13, fontWeight: 800 }}>✓</span>}
                    </div>
                    {p.image && <img src={p.image} alt={p.title} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{p.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {tab === 'Analytics' && (
          <div>
            <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 800, color: '#e5e7eb' }}>SEO Analytics Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
              {[
                { label: 'Total Products', value: shopifyProducts.length, color: '#7fffd4', icon: '🛍️' },
                { label: 'SEO Generated', value: Object.keys(stored).length, color: '#a78bfa', icon: '✨' },
                { label: 'Missing Meta Desc', value: shopifyProducts.filter(p => !(stored[p.id]?.seoDescription)).length, color: '#f87171', icon: '⚠️' },
                { label: 'Missing Title', value: shopifyProducts.filter(p => !(stored[p.id]?.seoTitle)).length, color: '#fbbf24', icon: '📝' },
                { label: 'Score ≥ 80 (Good)', value: shopifyProducts.filter(p => seoScore(stored[p.id] || {}) >= 80).length, color: '#4ade80', icon: '🏆' },
                { label: 'Score < 40 (Poor)', value: shopifyProducts.filter(p => seoScore(stored[p.id] || {}) < 40).length, color: '#f87171', icon: '❌' },
              ].map(stat => (
                <div key={stat.label} style={{ background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 14, padding: '20px 22px' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Score distribution */}
            <div style={{ background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 14, padding: 24, marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#e5e7eb' }}>SEO Score Distribution</h3>
              {[{ label: 'Excellent (80–100)', min: 80, max: 100, color: '#4ade80' }, { label: 'Good (60–79)', min: 60, max: 79, color: '#a3e635' }, { label: 'Needs Work (40–59)', min: 40, max: 59, color: '#fbbf24' }, { label: 'Poor (0–39)', min: 0, max: 39, color: '#f87171' }].map(band => {
                const count = shopifyProducts.filter(p => { const s = seoScore(stored[p.id] || {}); return s >= band.min && s <= band.max; }).length;
                const pct = shopifyProducts.length ? Math.round(count / shopifyProducts.length * 100) : 0;
                return (
                  <div key={band.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>{band.label}</span>
                      <span style={{ fontSize: 13, color: band.color, fontWeight: 600 }}>{count} products ({pct}%)</span>
                    </div>
                    <div style={{ height: 8, background: '#0f172a', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: band.color, borderRadius: 4, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Products needing attention */}
            <div style={{ background: '#1e2a3a', border: '1px solid #2f3650', borderRadius: 14, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#e5e7eb' }}>🔴 Products Needing Attention</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {shopifyProducts
                  .filter(p => seoScore(stored[p.id] || {}) < 50)
                  .slice(0, 8)
                  .map(p => {
                    const ps = seoScore(stored[p.id] || {});
                    const issues = [];
                    const f = stored[p.id] || {};
                    if (!f.seoTitle) issues.push('No SEO title');
                    else if (f.seoTitle.length < 30) issues.push('Title too short');
                    else if (f.seoTitle.length > 60) issues.push('Title too long');
                    if (!f.seoDescription) issues.push('No meta description');
                    if (!f.keywords) issues.push('No keywords');
                    return (
                      <div key={p.id} onClick={() => selectProduct(p)}
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: '#0f172a', borderRadius: 10, cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#162032'}
                        onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}>
                        {p.image && <img src={p.image} alt={p.title} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                          <div style={{ fontSize: 12, color: '#f87171', marginTop: 2 }}>{issues.join(' • ')}</div>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#f87171', minWidth: 36, textAlign: 'right' }}>{ps}</div>
                        <span style={{ fontSize: 12, color: '#7fffd4', fontWeight: 600 }}>Fix →</span>
                      </div>
                    );
                  })}
                {shopifyProducts.filter(p => seoScore(stored[p.id] || {}) < 50).length === 0 && (
                  <div style={{ textAlign: 'center', color: '#4ade80', padding: '24px 0', fontSize: 15, fontWeight: 600 }}>🏆 All products have good SEO scores!</div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
        input:focus, textarea:focus { border-color: #7fffd4 !important; box-shadow: 0 0 0 3px rgba(127,255,212,0.1); }
        button:active { transform: scale(0.97); }
      `}</style>
    </div>
  );
}
