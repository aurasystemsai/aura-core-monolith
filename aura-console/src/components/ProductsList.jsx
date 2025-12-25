import React, { useState, useEffect, useCallback } from 'react';

// Debug utility for logging
function debugLog(...args) {
  if (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('AURA_DEBUG')) {
    // Only log if debug flag is set in localStorage
    // eslint-disable-next-line no-console
    console.log('[ProductsList]', ...args);
  }
}

// Returns an array of SEO issues for a product's fields
function getSeoIssues({ title, metaDescription, keywords, slug }) {
  const issues = [];
  const tips = {
    'Title:Missing': 'Add a descriptive product title (50-60 characters).',
    'Title:Too short (<45)': 'Expand the title to at least 50 characters for better SEO.',
    'Title:Too long (>60)': 'Shorten the title to 60 characters or less.',
    'Meta Description:Missing': 'Add a meta description summarizing the product (120-160 characters).',
    'Meta Description:Too short (<130)': 'Expand the meta description to at least 120 characters.',
    'Meta Description:Too long (>155)': 'Shorten the meta description to 160 characters or less.',
    'Keywords:Missing': 'Add relevant keywords that describe your product.',
    'Slug:Missing': 'Add a URL slug (e.g., product-name).',
    'Slug:Bad format (lowercase, hyphens only, no spaces)': 'Use only lowercase letters, numbers, and hyphens in the slug.',
  };
  if (Array.isArray(keywords) && keywords[0]) {
    const primary = keywords[0].toLowerCase();
    if (!title || !title.toLowerCase().includes(primary)) {
      issues.push({ field: 'Title', msg: 'Primary keyword missing', type: 'warn', tip: 'Include your main keyword in the product title for better SEO.' });
    }
    if (!metaDescription || !metaDescription.toLowerCase().includes(primary)) {
      issues.push({ field: 'Meta Description', msg: 'Primary keyword missing', type: 'warn', tip: 'Include your main keyword in the meta description to improve relevance.' });
    }
  }
  if (!title || !title.trim()) {
    issues.push({ field: 'Title', msg: 'Missing', type: 'error', tip: tips['Title:Missing'] });
  } else {
    if (title.length < 45) issues.push({ field: 'Title', msg: 'Too short (<45)', type: 'warn', tip: tips['Title:Too short (<45)'] });
    if (title.length > 60) issues.push({ field: 'Title', msg: 'Too long (>60)', type: 'warn', tip: tips['Title:Too long (>60)'] });
  }
  if (!metaDescription || !metaDescription.trim()) {
    issues.push({ field: 'Meta Description', msg: 'Missing', type: 'error', tip: tips['Meta Description:Missing'] });
  } else {
    if (metaDescription.length < 130) issues.push({ field: 'Meta Description', msg: 'Too short (<130)', type: 'warn', tip: tips['Meta Description:Too short (<130)'] });
    if (metaDescription.length > 155) issues.push({ field: 'Meta Description', msg: 'Too long (>155)', type: 'warn', tip: tips['Meta Description:Too long (>155)'] });
  }
  if (!Array.isArray(keywords) || keywords.length === 0 || !keywords[0]) {
    issues.push({ field: 'Keywords', msg: 'Missing', type: 'warn', tip: tips['Keywords:Missing'] });
  }
  if (!slug || !slug.trim()) {
    issues.push({ field: 'Slug', msg: 'Missing', type: 'warn', tip: tips['Slug:Missing'] });
  } else {
    if (!/^[a-z0-9\-]+$/.test(slug) || slug.includes(' ')) {
      issues.push({ field: 'Slug', msg: 'Bad format (lowercase, hyphens only, no spaces)', type: 'warn', tip: tips['Slug:Bad format (lowercase, hyphens only, no spaces)'] });
    }
  }
  return issues;
}

// ...existing code for computeSeoScore, exportSeoToCsv, and other helpers if present...


const ProductsList = ({ shopDomain, shopToken }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [init, setInit] = useState(false);
  const [seoSuggestions, setSeoSuggestions] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [language, setLanguage] = useState("en");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updateStatus, setUpdateStatus] = useState({});
  const [seoHistory, setSeoHistory] = useState({});
  const [fatal, setFatal] = useState(null);
  // Aggressive debug: always show debug info panel
  function DebugPanel() {
    return (
      <div style={{
        background: '#181c2a', color: '#fff', fontSize: 13, padding: 16, borderRadius: 8, margin: '32px auto', maxWidth: 600, boxShadow: '0 2px 8px #0002', wordBreak: 'break-all', zIndex: 9999
      }}>
        <b>DEBUG PANEL</b><br/>
        <div>shopToken: <span style={{ color: '#7ff' }}>{String(shopToken)}</span></div>
        <div>shopDomain: <span style={{ color: '#7ff' }}>{String(shopDomain)}</span></div>
        <div>products: <span style={{ color: '#7ff' }}>{Array.isArray(products) ? products.length : 'n/a'}</span></div>
        <div>loading: <span style={{ color: '#7ff' }}>{String(loading)}</span></div>
        <div>error: <span style={{ color: '#f77' }}>{String(error)}</span></div>
        <div>fatal: <span style={{ color: '#f77' }}>{String(fatal)}</span></div>
        <div>init: <span style={{ color: '#7ff' }}>{String(init)}</span></div>
        <div>selectedIds: <span style={{ color: '#7ff' }}>{JSON.stringify(selectedIds)}</span></div>
        <div>statusFilter: <span style={{ color: '#7ff' }}>{String(statusFilter)}</span></div>
        <div>aiPrompt: <span style={{ color: '#7ff' }}>{String(aiPrompt)}</span></div>
        <div>language: <span style={{ color: '#7ff' }}>{String(language)}</span></div>
        <div>seoSuggestions: <span style={{ color: '#7ff' }}>{Object.keys(seoSuggestions).length}</span></div>
        <div>seoHistory: <span style={{ color: '#7ff' }}>{Object.keys(seoHistory).length}</span></div>
        <div>updateStatus: <span style={{ color: '#7ff' }}>{JSON.stringify(updateStatus)}</span></div>
        <div>Timestamp: {new Date().toISOString()}</div>
      </div>
    );
  }
  // Helper: Compute SEO score
  function computeSeoScore({ title, metaDescription, keywords, slug }) {
    let score = 100;
    if (!title || title.length < 45 || title.length > 60) score -= 10;
    if (!metaDescription || metaDescription.length < 130 || metaDescription.length > 155) score -= 10;
    if (!Array.isArray(keywords) || keywords.length === 0) score -= 10;
    if (!slug || !/^[a-z0-9\-]+$/.test(slug)) score -= 10;
    return Math.max(0, score);
  }
  // Fetch products from Shopify
  const fetchProducts = useCallback(() => {
    debugLog('fetchProducts called', { shopDomain, shopToken });
    setInit(true);
    if (!shopDomain || !shopToken) {
      debugLog('Missing shopDomain or shopToken', { shopDomain, shopToken });
      setProducts([]);
      setError('Missing Shopify connection. Please connect your store.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/shopify/products?shop=${encodeURIComponent(shopDomain)}&token=${encodeURIComponent(shopToken)}`)
      .then((res) => {
        debugLog('Fetch response', res);
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
      })
      .then((data) => {
        debugLog('Fetched products data', data);
        setProducts(Array.isArray(data.products) ? data.products : []);
        setLoading(false);
      })
      .catch((err) => {
        debugLog('Fetch error', err);
        setError(err.message || 'Error loading products');
        setLoading(false);
      });
  }, [shopDomain, shopToken]);
  useEffect(() => {
    try {
      fetchProducts();
    } catch (e) {
      setFatal(e.message || 'Fatal render error');
      debugLog('Fatal error in useEffect', e);
      if (typeof window !== 'undefined') {
        window.PRODUCTS_LIST_FATAL = e;
      }
    }
  }, [fetchProducts]);
  // Selection helpers
  const toggleSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelectedIds(products.map(p => p.id));
  const deselectAll = () => setSelectedIds([]);
  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const status = updateStatus[p.id];
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  // Export SEO to CSV
  function exportSeoToCsv() {
    const rows = [
      ['ID', 'Title', 'Meta Description', 'Keywords', 'Slug'],
      ...products.map(p => {
        const seo = seoSuggestions[p.id] || {};
        return [p.id, seo.title || '', seo.metaDescription || '', Array.isArray(seo.keywords) ? seo.keywords.join(', ') : '', seo.slug || ''];
      })
    ];
    const csv = rows.map(r => r.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shopify-seo-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
  // Show connect button if no token
  if (fatal) {
    if (typeof window !== 'undefined') {
      window.PRODUCTS_LIST_FATAL = fatal;
    }
    return (
      <div style={{ color: 'red', padding: 32, textAlign: 'center', fontWeight: 600 }}>
        Fatal error: {fatal}
        <DebugPanel />
      </div>
    );
  }
  if (!init) {
    return (
      <div style={{ color: '#888', padding: 32, textAlign: 'center' }}>
        <div>Initializing Products screen...</div>
        <DebugPanel />
      </div>
    );
  }
  if (!shopToken || !shopDomain) {
    debugLog('No shopToken or shopDomain', { shopToken, shopDomain });
    return (
      <div>
        <h1>Shopify Products</h1>
        <div style={{ margin: '24px 0' }}>
          <button
            onClick={() => {
              const url = `https://${window.location.host}/shopify/auth?shop=${encodeURIComponent(shopDomain || '')}`;
              if (window.top) window.top.location.href = url;
              else window.location.href = url;
            }}
            style={{ display: 'inline-block', padding: '12px 24px', background: '#5c6ac4', color: '#fff', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: 16, border: 0, cursor: 'pointer' }}
          >Connect to Shopify</button>
        </div>
        <DebugPanel />
      </div>
    );
  }
  // Main UI
  try {
    return (
      <div>
        <h1>Shopify Products</h1>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <select value={language} onChange={e => setLanguage(e.target.value)} style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', minWidth: 120 }}>
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
            <option value="ja">Japanese</option>
            <option value="zh">Chinese</option>
            <option value="ko">Korean</option>
          </select>
          <input type="text" placeholder="Custom AI prompt (optional)" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} style={{ width: '60%', marginRight: 8, padding: 4, borderRadius: 4, border: '1px solid #ccc' }} />
          <input type="text" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ marginRight: 8, padding: 4, borderRadius: 4, border: '1px solid #ccc' }} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: 4, borderRadius: 4 }}>
            <option value="all">All</option>
            <option value="success">Updated</option>
            <option value="error">Error</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <button onClick={fetchProducts} disabled={loading} style={{ marginBottom: 16 }}>{loading ? 'Refreshing...' : 'Refresh'}</button>
        <button onClick={selectAll} disabled={loading || filteredProducts.length === 0} style={{ marginLeft: 8, marginBottom: 16 }}>Select All</button>
        <button onClick={deselectAll} disabled={loading || selectedIds.length === 0} style={{ marginLeft: 8, marginBottom: 16 }}>Deselect All</button>
        <button onClick={exportSeoToCsv} disabled={loading || products.length === 0} style={{ marginLeft: 8, marginBottom: 16 }}>Export to CSV</button>
        {loading && <div>Loading products...</div>}
        {error && (
          <div style={{ color: 'red', margin: '16px 0', fontWeight: 500 }}>
            {error}
            <DebugPanel />
          </div>
        )}
        {!loading && !error && (
          filteredProducts.length === 0 ? (
            <div style={{ color: '#888', margin: '24px 0', textAlign: 'center' }}>
              No products found.<br/>
              <DebugPanel />
            </div>
          ) : (
            <ul>
              {filteredProducts.map((product) => {
                let seo = seoSuggestions[product.id] || {
                  title: product.title,
                  metaDescription: product.metaDescription || product.description || product.body_html || '',
                  keywords: product.keywords || [],
                  slug: product.slug || product.handle || '',
                };
                let keywordSuggestions = [];
                if (!seo.keywords || !Array.isArray(seo.keywords) || !seo.keywords[0]) {
                  const text = ((seo.title || '') + ' ' + (seo.metaDescription || '')).toLowerCase();
                  const words = text.match(/\b[a-z0-9]{4,}\b/g) || [];
                  const freq = {};
                  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
                  keywordSuggestions = Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([w]) => w).slice(0, 5);
                }
                const s = computeSeoScore({ title: seo.title, metaDescription: seo.metaDescription, keywords: seo.keywords, slug: seo.slug });
                let issues = getSeoIssues(seo);
                if (Array.isArray(product.images)) {
                  const missingAlt = product.images.filter(img => !img.alt || !img.alt.trim()).length;
                  if (missingAlt > 0) {
                    issues = [...issues, { field: 'Image', msg: `Missing alt text for ${missingAlt} image${missingAlt > 1 ? 's' : ''}`, type: 'warn', tip: 'Add descriptive alt text to all product images for accessibility and SEO.' }];
                  }
                }
                // ...existing code...
                return (
                  <li key={product.id} style={{ marginBottom: 12 }}>
                    <input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => toggleSelect(product.id)} style={{ marginRight: 8 }} disabled={loading} />
                    <div style={{ background: '#fff', color: '#222', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 18, marginBottom: 8, maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 600, fontSize: 18 }}>{product.title}</div>
                        <div style={{ fontSize: 15, color: '#888' }}>${product.variants && product.variants[0] ? product.variants[0].price : 'N/A'}</div>
                        <span style={{ background: '#333', color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: 13, marginLeft: 8 }}>SEO Score: <b style={{ color: s >= 80 ? '#7fff7f' : s >= 60 ? '#ffe97f' : '#ff7f7f' }}>{s}</b>/100</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr', gap: 8, fontSize: 14, marginTop: 8 }}>
                        <div style={{ fontWeight: 500 }}>Field</div>
                        <div style={{ fontWeight: 500 }}>Current Value</div>
                        <div style={{ fontWeight: 500 }}>Target/Ideal</div>
                        <div>Title</div>
                        <div>{seo.title || <span style={{ color: '#aaa' }}>None</span>}</div>
                        <div>50-60 characters, includes main keyword</div>
                        <div>Meta Description</div>
                        <div>{seo.metaDescription || <span style={{ color: '#aaa' }}>None</span>}</div>
                        <div>120-160 characters, includes main keyword</div>
                        <div>Keywords</div>
                        <div>
                          {Array.isArray(seo.keywords) && seo.keywords[0] ? seo.keywords.join(', ') : <span style={{ color: '#aaa' }}>None</span>}
                          {keywordSuggestions.length > 0 && (
                            <div style={{ marginTop: 4 }}>
                              <span style={{ color: '#5c6ac4', fontSize: 13 }}>Suggestions: </span>
                              {keywordSuggestions.map((kw, i) => (
                                <span key={kw} style={{ background: '#e0e7ff', color: '#222', borderRadius: 4, padding: '2px 6px', marginRight: 4, fontSize: 13, cursor: 'pointer', border: '1px solid #b3bcf5' }} onClick={() => { seo.keywords = [...(seo.keywords || []), kw]; }}>{kw}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>Relevant, 1-5, separated by commas</div>
                        <div>Slug</div>
                        <div>{seo.slug || <span style={{ color: '#aaa' }}>None</span>}</div>
                        <div>Lowercase, hyphens, no spaces</div>
                      </div>
                      {/* Google-style SEO preview snippet with device toggle */}
                      {/* ...Device preview and other advanced features can be added here... */}
                      {issues.length > 0 && (
                        <ul style={{ margin: '10px 0 0 0', padding: 0, listStyle: 'none', fontSize: 13 }}>
                          {issues.map((issue, idx) => (
                            <li key={idx} style={{ color: issue.type === 'error' ? '#ff7f7f' : '#ffe97f', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                {issue.type === 'error' ? '⛔' : '⚠️'} <b>{issue.field}:</b> {issue.msg}
                              </span>
                              {issue.tip && (<span style={{ color: '#888', fontSize: 12, marginLeft: 24 }}>💡 {issue.tip}</span>)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                );
              })}
// Move SEO history tracking to the top level, above return
useEffect(() => {
  if (!Array.isArray(products) || products.length === 0) return;
  setSeoHistory(prev => {
    const next = { ...prev };
    products.forEach(product => {
      const seo = seoSuggestions[product.id] || {
        title: product.title,
        metaDescription: product.metaDescription || product.description || product.body_html || '',
        keywords: product.keywords || [],
        slug: product.slug || product.handle || '',
      };
      const s = computeSeoScore({ title: seo.title, metaDescription: seo.metaDescription, keywords: seo.keywords, slug: seo.slug });
      let issues = getSeoIssues(seo);
      if (Array.isArray(product.images)) {
        const missingAlt = product.images.filter(img => !img.alt || !img.alt.trim()).length;
        if (missingAlt > 0) {
          issues = [...issues, { field: 'Image', msg: `Missing alt text for ${missingAlt} image${missingAlt > 1 ? 's' : ''}`, type: 'warn', tip: 'Add descriptive alt text to all product images for accessibility and SEO.' }];
        }
      }
      const hist = next[product.id] || [];
      const last = hist[hist.length - 1];
      if (!last || last.score !== s || JSON.stringify(last.issues) !== JSON.stringify(issues)) {
        next[product.id] = [...hist, { date: new Date().toISOString(), score: s, issues }].slice(-10);
      }
    });
    return next;
  });
}, [products, seoSuggestions, computeSeoScore, getSeoIssues]);
            </ul>
          )
        )}
        {/* Aggressive debug panel always visible at bottom */}
        <DebugPanel />
      </div>
    );
  } catch (e) {
    debugLog('Fatal render error', e);
    return (
      <div style={{ color: 'red', padding: 32, textAlign: 'center', fontWeight: 600 }}>
        Fatal render error: {e.message}
        <div style={{ color: '#888', fontSize: 13, marginTop: 8 }}>
          Debug info: shopToken={String(shopToken)}, shopDomain={String(shopDomain)}
        </div>
      </div>
    );
  }
};

export default ProductsList;

