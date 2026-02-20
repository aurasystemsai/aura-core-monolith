import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import './ProductsList.css';
import './ProductsList.modern.css'; // Add a new CSS module for world-class polish

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
  }
  // ...rest of getSeoIssues logic...
  return issues;
}

// ...existing code for computeSeoScore, exportSeoToCsv, and other helpers if present...

// ...existing code for computeSeoScore, exportSeoToCsv, and other helpers if present...


// Context for plugin/extension support
export const ProductsListContext = createContext();

const ProductsList = ({ shopDomain, shopToken, plugins = [] }) => {
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
  // FIX: editState must be at top level, not inside map
  const [editState, setEditState] = useState({});
  // Debug: only show when AURA_DEBUG is set in localStorage
  const showDebug = (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('AURA_DEBUG'));
  function DebugPanel() {
    return (
      <div className="pl-debug-panel">
        <b>DEBUG PANEL</b><br/>
        <div>shopToken: <span className="pl-debug-accent">{String(shopToken)}</span></div>
        <div>shopDomain: <span className="pl-debug-accent">{String(shopDomain)}</span></div>
        <div>products: <span className="pl-debug-accent">{Array.isArray(products) ? products.length : 'n/a'}</span></div>
        <div>loading: <span className="pl-debug-accent">{String(loading)}</span></div>
        <div>error: <span className="pl-debug-error">{String(error)}</span></div>
        <div>fatal: <span className="pl-debug-error">{String(fatal)}</span></div>
        <div>init: <span className="pl-debug-accent">{String(init)}</span></div>
        <div>selectedIds: <span className="pl-debug-accent">{JSON.stringify(selectedIds)}</span></div>
        <div>statusFilter: <span className="pl-debug-accent">{String(statusFilter)}</span></div>
        <div>aiPrompt: <span className="pl-debug-accent">{String(aiPrompt)}</span></div>
        <div>language: <span className="pl-debug-accent">{String(language)}</span></div>
        <div>seoSuggestions: <span className="pl-debug-accent">{Object.keys(seoSuggestions).length}</span></div>
        <div>seoHistory: <span className="pl-debug-accent">{Object.keys(seoHistory).length}</span></div>
        <div>updateStatus: <span className="pl-debug-accent">{JSON.stringify(updateStatus)}</span></div>
        <div>Timestamp: {new Date().toISOString()}</div>
      </div>
    );
  }

  // Advanced analytics panel for enterprise insights
  function AnalyticsPanel() {
    // Aggregate SEO scores and issues
    const total = products.length;
    const scores = products.map(p => {
      const seo = seoSuggestions[p.id] || {
        title: p.title,
        metaDescription: p.metaDescription || p.description || p.body_html || '',
        keywords: p.keywords || [],
        slug: p.slug || p.handle || '',
      };
      return computeSeoScore(seo);
    });
    const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 'N/A';
    const highScore = scores.length ? Math.max(...scores) : 'N/A';
    const lowScore = scores.length ? Math.min(...scores) : 'N/A';
    const issuesCount = products.reduce((sum, p) => {
      const seo = seoSuggestions[p.id] || {
        title: p.title,
        metaDescription: p.metaDescription || p.description || p.body_html || '',
        keywords: p.keywords || [],
        slug: p.slug || p.handle || '',
      };
      return sum + getSeoIssues(seo).length;
    }, 0);
    return (
      <div className="pl-analytics-panel">
        <b>Enterprise Analytics</b><br/>
        <div>Total Products: <span className="pl-analytics-accent">{total}</span></div>
        <div>Average SEO Score: <span className="pl-analytics-accent">{avgScore}</span></div>
        <div>Highest SEO Score: <span className="pl-analytics-accent">{highScore}</span></div>
        <div>Lowest SEO Score: <span className="pl-analytics-accent">{lowScore}</span></div>
        <div>Total SEO Issues: <span className="pl-analytics-accent">{issuesCount}</span></div>
        <div>Last Updated: {new Date().toLocaleString()}</div>
      </div>
    );
  }

  // Expanded rows state (fixes invalid hook usage)
  const [expandedRows, setExpandedRows] = useState({});
  const setExpandedRow = (id, value) => {
    setExpandedRows(prev => ({ ...prev, [id]: value }));
  };
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
    if (!shopDomain) {
      debugLog('Missing shopDomain', { shopDomain, shopToken });
      setProducts([]);
      setError('Missing Shopify shop domain. Please connect your store.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    // Do not send a potentially stale client token; let the backend resolve the persisted/session token.
    fetch(`/api/shopify/products?shop=${encodeURIComponent(shopDomain)}`)
      .then(async (res) => {
        debugLog('Fetch response', res);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data?.error || `Failed to fetch products (${res.status})`;
          throw new Error(msg);
        }
        return data;
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

  const reconnectShopify = useCallback(() => {
    const url = typeof window !== 'undefined' ? new URL(window.location.href) : null;
    const shopParam = shopDomain || (url ? url.searchParams.get('shop') : '') || '';
    const target = shopParam ? `/shopify/auth?shop=${encodeURIComponent(shopParam)}` : '/connect-shopify';
    if (typeof window !== 'undefined') {
      if (window.top) window.top.location.href = target;
      else window.location.href = target;
    }
  }, [shopDomain]);
  useEffect(() => {
      try {
        fetchProducts();
      } catch (e) {
        setFatal(e.message || 'Fatal render error');
      }
        }, [fetchProducts]);
    
  // Selection helpers
  const toggleSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelectedIds(products.map(p => p.id));
  const deselectAll = () => setSelectedIds([]);

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title && p.title.toLowerCase().includes(searchTerm.toLowerCase());
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

  // SEO history tracking (must be before any return)
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
  }, [products, seoSuggestions]);

  // Show connect button if no token
  if (fatal) {
    if (typeof window !== 'undefined') {
      window.PRODUCTS_LIST_FATAL = fatal;
    }
    return (
      <div className="pl-fatal">
        Fatal error: {fatal}
        {showDebug && <DebugPanel />}
      </div>
    );
  }
  if (!init) {
    return (
      <div className="pl-init">
        <div>Initializing Products screen...</div>
        {showDebug && <DebugPanel />}
      </div>
    );
  }
  if (!shopDomain) {
    debugLog('No shopDomain', { shopToken, shopDomain });
    return (
      <div className="pl-connect">
        <h1 className="pl-title">Shopify Products</h1>
        <div className="pl-connect-btn-wrap">
          <button
            onClick={() => {
              const url = `https://${window.location.host}/shopify/auth?shop=${encodeURIComponent(shopDomain || '')}`;
              if (window.top) window.top.location.href = url;
              else window.location.href = url;
            }}
            className="pl-btn pl-btn--accent pl-btn--connect"
          >Connect to Shopify</button>
        </div>
        {showDebug && <DebugPanel />}
      </div>
    );
  }

  // Main UI with plugin extension points
  try {
    return (
      <ProductsListContext.Provider value={{
        products, setProducts, loading, setLoading, error, setError, init, setInit,
        seoSuggestions, setSeoSuggestions, selectedIds, setSelectedIds, selectedProductId, setSelectedProductId,
        aiPrompt, setAiPrompt, language, setLanguage, searchTerm, setSearchTerm, statusFilter, setStatusFilter,
        updateStatus, setUpdateStatus, seoHistory, setSeoHistory, fatal, setFatal, editState, setEditState,
        expandedRows, setExpandedRows, setExpandedRow, fetchProducts, selectAll, deselectAll, toggleSelect, filteredProducts, computeSeoScore, getSeoIssues, exportSeoToCsv
      }}>
        <div className="products-card" role="main" aria-label="Shopify Products SEO Manager">
          {/* Accessibility live region for announcements */}
          <div aria-live="polite" aria-atomic="true" className="pl-sr" id="pl-live-region">
            {loading ? 'Loading products…' : error ? `Error: ${error}` : fatal ? `Fatal: ${fatal}` : ''}
          </div>
          <h1 className="pl-title" tabIndex={0}>Shopify Products SEO Manager</h1>
          {/* Sticky header for filters/actions */}
          <div className="pl-toolbar" role="region" aria-label="Product Filters and Actions">
            <label htmlFor="pl-lang-select" className="pl-sr">Language</label>
            <select id="pl-lang-select" value={language} onChange={e => setLanguage(e.target.value)} className="pl-select" aria-label="Language">
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
            <label htmlFor="pl-ai-prompt" className="pl-sr">Custom AI prompt</label>
            <input id="pl-ai-prompt" type="text" placeholder="Custom AI prompt" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className="pl-input pl-input--wide" aria-label="Custom AI prompt" />
            <label htmlFor="pl-search" className="pl-sr">Search products</label>
            <input id="pl-search" type="text" placeholder="Search products" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-input" aria-label="Search products" />
            <label htmlFor="pl-status-filter" className="pl-sr">Status filter</label>
            <select id="pl-status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="pl-select" aria-label="Status filter">
              <option value="all">All</option>
              <option value="success">Updated</option>
              <option value="error">Error</option>
              <option value="pending">Pending</option>
            </select>
            <button onClick={fetchProducts} disabled={loading} className="pl-btn pl-btn--accent" aria-label="Refresh products">{loading ? 'Refreshing...' : 'Refresh'}</button>
            <button onClick={selectAll} disabled={loading || filteredProducts.length === 0} className="pl-btn" aria-label="Select all products">Select All</button>
            <button onClick={deselectAll} disabled={loading || selectedIds.length === 0} className="pl-btn" aria-label="Deselect all products">Deselect All</button>
            <button onClick={exportSeoToCsv} disabled={loading || products.length === 0} className="pl-btn" aria-label="Export SEO to CSV">Export to CSV</button>
          </div>
          {loading && <div className="pl-loading">Loading products...</div>}
          {error && (
            <div className="pl-error">
              {error}
              <div className="pl-error-actions">
                <button className="pl-btn pl-btn--accent" onClick={reconnectShopify}>Reconnect Shopify</button>
              </div>
              {showDebug && <DebugPanel />}
            </div>
          )}
          {!loading && !error && (
            filteredProducts.length === 0 ? (
              <div className="pl-empty">
                No products found.<br/>
                {showDebug && <DebugPanel />}
              </div>
            ) : (
              <div className="pl-table-wrap" role="region" aria-label="Products Table">
                <table className="pl-table" aria-label="Products SEO Table">
                  <thead>
                    <tr>
                      <th scope="col"></th>
                      <th scope="col">Image</th>
                      <th scope="col">Product</th>
                      <th scope="col">SEO Score</th>
                      <th scope="col">Title</th>
                      <th scope="col">Meta Description</th>
                      <th scope="col">Keywords</th>
                      <th scope="col">Slug</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const isEditing = editState[product.id]?.editing || false;
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
                      const expanded = !!expandedRows[product.id];
                      // Editable fields
                      const editable = isEditing ? (editState[product.id] || seo) : seo;
                      // Product image thumbnail (first image)
                      const firstImage = Array.isArray(product.images) && product.images[0] ? product.images[0] : null;
                      return (
                        <tr key={product.id} className={expanded ? 'pl-row pl-row--expanded' : 'pl-row'}>
                          <td>
                            <input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => toggleSelect(product.id)} disabled={loading} />
                          </td>
                          <td className="pl-image-cell">
                            {firstImage ? (
                              <img
                                src={firstImage.src || firstImage.url || ''}
                                alt={firstImage.alt || product.title || 'Product image'}
                                className="pl-thumb"
                                style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--background-tertiary)' }}
                              />
                            ) : (
                              <span className="pl-thumb-placeholder" aria-label="No image"></span>
                            )}
                          </td>
                          <td className="pl-product-cell">
                            {product.title}
                            <div className="pl-product-price">{product.variants && product.variants[0] ? `$${product.variants[0].price}` : 'N/A'}</div>
                          </td>
                          <td>
                            <span className="pl-score-badge"> <b className={s >= 80 ? 'pl-score--good' : s >= 60 ? 'pl-score--warn' : 'pl-score--bad'}>{s}</b>/100</span>
                          </td>
                          <td>
                            {isEditing ? (
                              <input value={editable.title} onChange={e => setEditState(state => ({ ...state, [product.id]: { ...editable, editing: true, title: e.target.value } }))} className="pl-input" />
                            ) : (
                              <>
                                {seo.title || <span className="pl-muted">None</span>}
                                <div className="pl-guide">SEO Title (45–60 chars, include main keyword, no clickbait): This is the main headline for search engines and should be clear, descriptive, and unique for each product.</div>
                              </>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <textarea value={editable.metaDescription} onChange={e => setEditState(state => ({ ...state, [product.id]: { ...editable, editing: true, metaDescription: e.target.value } }))} className="pl-input" />
                            ) : (
                              <>
                                {seo.metaDescription || <span className="pl-muted">None</span>}
                                <div className="pl-guide">Meta Description (130–155 chars, include main keyword): This summary appears in search results and should entice clicks while accurately describing the product.</div>
                              </>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input value={editable.keywords.join(', ')} onChange={e => setEditState(state => ({ ...state, [product.id]: { ...editable, editing: true, keywords: e.target.value.split(',').map(x => x.trim()).filter(Boolean) } }))} className="pl-input" />
                            ) : (
                              <>
                                {Array.isArray(seo.keywords) && seo.keywords[0] ? seo.keywords.join(', ') : <span className="pl-muted">None</span>}
                                <div className="pl-guide">Keywords: List of target search terms for this product. The first keyword should be the most important and appear in the title, meta, and H1.</div>
                              </>
                            )}
                            {keywordSuggestions.length > 0 && (
                              <div className="pl-keyword-suggestions">
                                <span className="pl-keyword-label">Suggestions: </span>
                                {keywordSuggestions.map((kw, i) => (
                                  <span key={kw} className="pl-keyword-pill" onClick={() => isEditing && setEditState(state => ({ ...state, [product.id]: { ...editable, editing: true, keywords: [...(editable.keywords || []), kw].filter((v, i, a) => a.indexOf(v) === i) } }))}>{kw}</span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input value={editable.slug} onChange={e => setEditState(state => ({ ...state, [product.id]: { ...editable, editing: true, slug: e.target.value } }))} className="pl-input" />
                            ) : (
                              <>
                                {seo.slug || <span className="pl-muted">None</span>}
                                <div className="pl-guide">Slug: The URL-friendly version of your product name (lowercase, hyphens only, no spaces or special characters).</div>
                              </>
                            )}
                          </td>
                          {/* New SEO fields with guides */}
                          <td>
                            {seo.h1 ? <><b>{seo.h1}</b><div className="pl-guide">H1: The main heading on your product page. Should match or closely resemble the title and include the main keyword.</div></> : <span className="pl-muted">None</span>}
                          </td>
                          <td>
                            {Array.isArray(seo.bullets) && seo.bullets.length ? <ul className="pl-guide-list">{seo.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul> : <span className="pl-muted">None</span>}
                            <div className="pl-guide">Bullets: Key features or benefits. Use 3–5 concise points to help customers scan quickly.</div>
                          </td>
                          <td>
                            {seo.canonicalUrl ? <a href={seo.canonicalUrl} target="_blank" rel="noopener noreferrer">{seo.canonicalUrl}</a> : <span className="pl-muted">None</span>}
                            <div className="pl-guide">Canonical URL: The preferred URL for this product. Helps avoid duplicate content issues.</div>
                          </td>
                          <td>
                            {Array.isArray(seo.tags) && seo.tags.length ? seo.tags.join(', ') : <span className="pl-muted">None</span>}
                            <div className="pl-guide">Tags: Extra labels to help organize and filter products. Use relevant, specific tags.</div>
                          </td>
                          <td className="pl-actions-cell">
                            {isEditing ? (
                              <>
                                <button className="pl-btn pl-btn--save" onClick={() => {
                                  setSeoSuggestions(s => ({ ...s, [product.id]: { ...editable } }));
                                  setEditState(state => ({ ...state, [product.id]: { ...editable, editing: false } }));
                                }}>Save</button>
                                <button className="pl-btn pl-btn--cancel" onClick={() => setEditState(state => ({ ...state, [product.id]: { ...seo, editing: false } }))}>Cancel</button>
                                <button className="pl-btn pl-btn--ai" onClick={() => {
                                  setEditState(state => ({ ...state, [product.id]: { ...editable, editing: true, title: seo.title + ' (AI)', metaDescription: seo.metaDescription + ' (AI)', keywords: [...(seo.keywords || []), 'ai'], slug: seo.slug } }));
                                }}>AI Suggest</button>
                              </>
                            ) : (
                              <>
                                <button className="pl-btn pl-btn--edit" onClick={() => setEditState(state => ({ ...state, [product.id]: { ...seo, editing: true } }))}>Edit</button>
                                {/* Fix All SEO Issues button */}
                                {issues.length > 0 && (
                                  <button className="pl-btn pl-btn--fixall" onClick={() => {
                                    // For now, just auto-fill with best guesses (AI-ready)
                                    const fixed = { ...seo };
                                    issues.forEach(issue => {
                                      if (issue.field === 'Title' && (!fixed.title || fixed.title === '')) fixed.title = 'New Product Title';
                                      if (issue.field === 'Meta Description' && (!fixed.metaDescription || fixed.metaDescription === '')) fixed.metaDescription = 'New meta description for this product.';
                                      if (issue.field === 'Keywords' && (!fixed.keywords || !fixed.keywords.length)) fixed.keywords = ['keyword1', 'keyword2'];
                                      if (issue.field === 'Slug' && (!fixed.slug || fixed.slug === '')) fixed.slug = 'new-product-slug';
                                    });
                                    setSeoSuggestions(s => ({ ...s, [product.id]: { ...fixed } }));
                                  }}>Fix All SEO Issues</button>
                                )}
                                {/* Individual Fix buttons for each issue */}
                                {expanded && issues.length > 0 && (
                                  <div className="pl-fix-buttons">
                                    {issues.map((issue, i) => (
                                      <button key={i} className="pl-btn pl-btn--fix" onClick={() => {
                                        // TODO: Implement live fix logic only. No placeholder fixes.
                                      }}>Fix {issue.field}</button>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                            {expanded && issues.length > 0 && (
                              <div className="pl-seo-tips">
                                <b>SEO Tips:</b>
                                <ul className="pl-tips-list">
                                  {issues.map((issue, i) => (
                                    <li key={i} className={issue.type === 'error' ? 'pl-tip--error' : 'pl-tip--warn'}>{issue.field}: {issue.msg} <span className="pl-tip-detail">{issue.tip}</span></li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
          {/* Enterprise analytics and debug panels always visible at bottom */}
          <AnalyticsPanel />
          <DebugPanel />
          {/* Plugin extension point: render plugins if any */}
          {plugins.map((PluginComponent, idx) =>PluginComponent ? <PluginComponent key={idx} /> : null)}
        </div>
      </ProductsListContext.Provider>
    );
  } catch (e) {
    debugLog('Fatal render error', e);
    return (
      <div className="pl-fatal">
        Fatal render error: {e.message}
        <div className="pl-fatal-debug">
          Debug info: shopToken={String(shopToken)}, shopDomain={String(shopDomain)}
        </div>
      </div>
    );
  }
};

export default ProductsList;

