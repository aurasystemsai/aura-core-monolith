  // Returns an array of SEO issues for a product's fields
  function getSeoIssues({ title, metaDescription, keywords, slug }) {
            // Accessibility: check for missing alt text (if product.images exists)
            if (typeof window !== 'undefined' && window.products && Array.isArray(window.products)) {
              // This is a fallback for global products, but we should check the product object directly below
            }
        // Highlight missing primary keyword in title/meta
        if (Array.isArray(keywords) && keywords[0]) {
          const primary = keywords[0].toLowerCase();
          if (!title || !title.toLowerCase().includes(primary)) {
            issues.push({
              field: 'Title',
              msg: 'Primary keyword missing',
              type: 'warn',
              tip: 'Include your main keyword in the product title for better SEO.'
            });
          }
          if (!metaDescription || !metaDescription.toLowerCase().includes(primary)) {
            issues.push({
              field: 'Meta Description',
              msg: 'Primary keyword missing',
              type: 'warn',
              tip: 'Include your main keyword in the meta description to improve relevance.'
            });
          }
        }
    const issues = [];
    // Helper for actionable tips
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
    // Title
    if (!title || !title.trim()) {
      issues.push({ field: 'Title', msg: 'Missing', type: 'error', tip: tips['Title:Missing'] });
    } else {
      if (title.length < 45) issues.push({ field: 'Title', msg: 'Too short (<45)', type: 'warn', tip: tips['Title:Too short (<45)'] });
      if (title.length > 60) issues.push({ field: 'Title', msg: 'Too long (>60)', type: 'warn', tip: tips['Title:Too long (>60)'] });
    }
    // Meta description
    if (!metaDescription || !metaDescription.trim()) {
      issues.push({ field: 'Meta Description', msg: 'Missing', type: 'error', tip: tips['Meta Description:Missing'] });
    } else {
      if (metaDescription.length < 130) issues.push({ field: 'Meta Description', msg: 'Too short (<130)', type: 'warn', tip: tips['Meta Description:Too short (<130)'] });
      if (metaDescription.length > 155) issues.push({ field: 'Meta Description', msg: 'Too long (>155)', type: 'warn', tip: tips['Meta Description:Too long (>155)'] });
    }
    // Keywords
    if (!Array.isArray(keywords) || keywords.length === 0 || !keywords[0]) {
      issues.push({ field: 'Keywords', msg: 'Missing', type: 'warn', tip: tips['Keywords:Missing'] });
    }
    // Slug
    if (!slug || !slug.trim()) {
      issues.push({ field: 'Slug', msg: 'Missing', type: 'warn', tip: tips['Slug:Missing'] });
    } else {
      if (!/^[a-z0-9\-]+$/.test(slug) || slug.includes(' ')) {
        issues.push({ field: 'Slug', msg: 'Bad format (lowercase, hyphens only, no spaces)', type: 'warn', tip: tips['Slug:Bad format (lowercase, hyphens only, no spaces)'] });
      }
    }
    return issues;
  }
  // Advanced SEO scoring utility
  function computeSeoScore({ title, metaDescription, keywords, slug }) {
    let score = 0;
    // Title length (ideal: 50-60 chars)
    if (title) {
      if (title.length >= 50 && title.length <= 60) score += 20;
      else if (title.length >= 40 && title.length <= 70) score += 10;
    }
    // Meta description length (ideal: 120-160 chars)
    if (metaDescription) {
      if (metaDescription.length >= 120 && metaDescription.length <= 160) score += 20;
      else if (metaDescription.length >= 100 && metaDescription.length <= 180) score += 10;
    }
    // Keyword density (ideal: 1-2% for primary keyword)
    if (keywords && keywords.length > 0 && metaDescription) {
      const primary = keywords[0];
      const descWords = metaDescription.split(/\s+/g);
      const count = descWords.filter(w => w.toLowerCase() === primary.toLowerCase()).length;
      const density = count / descWords.length;
      if (density >= 0.01 && density <= 0.02) score += 15;
      else if (density > 0) score += 5;
    }
    // Uniqueness (no duplicate words in title)
    if (title) {
      const words = title.toLowerCase().split(/\s+/g);
      const unique = new Set(words);
      if (unique.size / words.length > 0.8) score += 10;
    }
    // Primary keyword in title
    if (keywords && keywords.length > 0 && title && title.toLowerCase().includes(keywords[0].toLowerCase())) {
      score += 15;
    }
    // Slug quality (no spaces, all lowercase, hyphenated)
    if (slug && /^[a-z0-9\-]+$/.test(slug) && !slug.includes(' ')) score += 10;
    // Cap at 100
    return Math.min(score, 100);
  }
  // Export SEO suggestions to CSV
  const exportSeoToCsv = () => {
    const rows = [
      ['Product Title', 'SEO Title', 'Meta Description', 'Slug', 'Keywords', 'SEO Score', 'Issues', 'Recommendations'],
      ...products.filter(p => selectedIds.includes(p.id)).map(product => {
        const seo = editableSeo[product.id] || {};
        const score = computeSeoScore({
          title: seo.title,
          metaDescription: seo.metaDescription,
          keywords: seo.keywords,
          slug: seo.slug,
        });
        const issues = getSeoIssues(seo);
        return [
          product.title,
          seo.title || '',
          seo.metaDescription || '',
          seo.slug || '',
          Array.isArray(seo.keywords) ? seo.keywords.join(', ') : '',
          score,
          issues.map(i => `${i.field}: ${i.msg}`).join('; '),
          issues.map(i => i.tip || '').filter(Boolean).join('; ')
        ];
      })
    ];
    const csv = rows.map(r => r.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'seo-audit.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


import React, { useState, useEffect, useCallback } from 'react';


const ProductsList = ({ shopDomain, shopToken }) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Store SEO suggestions per product ID
  const [seoSuggestions, setSeoSuggestions] = useState({});
  // SEO history: { [productId]: [{ date, score, issues }] }
  const [seoHistory, setSeoHistory] = useState({});
  // Custom AI prompt
  const [aiPrompt, setAiPrompt] = useState('');
  // Multi-language support
  const [language, setLanguage] = useState('en');
  const [selectedProductId, setSelectedProductId] = useState(null);
  // Multi-select state
  const [selectedIds, setSelectedIds] = useState([]);
  // Bulk preview modal state
  const [showBulkPreview, setShowBulkPreview] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  // Editable SEO fields for bulk modal
  const [editableSeo, setEditableSeo] = useState({});
  // Status indicators for updates
  const [updateStatus, setUpdateStatus] = useState({}); // { [productId]: 'pending' | 'success' | 'error' }
  // Store previous SEO fields for undo
  const [previousSeo, setPreviousSeo] = useState({});
  // Fetch SEO suggestions for all selected products (for preview)
  const fetchBulkSeoSuggestions = async () => {
    setBulkLoading(true);
    setError(null);
    try {
      const newSuggestions = {};
      for (const product of products.filter(p => selectedIds.includes(p.id))) {
        const res = await fetch('/api/run/product-seo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productTitle: product.title,
            productDescription: product.description,
            brand: '',
            tone: '',
            useCases: [],
            prompt: aiPrompt,
            language,
          }),
        });
        if (!res.ok) throw new Error('Failed to run Product SEO');
        const data = await res.json();
        newSuggestions[product.id] = data.output;
      }
      setSeoSuggestions((prev) => ({ ...prev, ...newSuggestions }));
      // Initialize editableSeo with suggestions
      setEditableSeo(newSuggestions);
      setShowBulkPreview(true);
    } catch (err) {
      setError(err.message || 'Error running bulk Product SEO');
    }
    setBulkLoading(false);
  };
      <button
        onClick={fetchBulkSeoSuggestions}
        disabled={loading || selectedIds.length === 0 || bulkLoading}
        style={{ marginLeft: 8, marginBottom: 16 }}
      >Preview SEO for Selected</button>
      {/* Bulk Preview Modal */}
      {showBulkPreview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.7)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ background: '#222', color: '#fff', padding: 24, borderRadius: 12, maxWidth: 800, width: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>Bulk SEO Preview</h2>
            <div style={{ marginBottom: 16 }}>
              Review the SEO suggestions for all selected products. You can approve and apply all at once, or close to cancel.
            </div>
            <div>
              {products.filter(p => selectedIds.includes(p.id)).map(product => {
                const seo = editableSeo[product.id] || {};
                const status = updateStatus[product.id];
                const score = computeSeoScore({
                  title: seo.title,
                  metaDescription: seo.metaDescription,
                  keywords: seo.keywords,
                  slug: seo.slug,
                });
                return (
                  <div key={product.id} style={{ borderBottom: '1px solid #444', marginBottom: 12, paddingBottom: 12, background: status === 'success' ? '#234d23' : status === 'error' ? '#4d2323' : 'transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong>{product.title}</strong>
                      <span style={{ background: '#333', color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: 13, marginLeft: 8 }}>
                        SEO Score: <b style={{ color: score >= 80 ? '#7fff7f' : score >= 60 ? '#ffe97f' : '#ff7f7f' }}>{score}</b>/100
                      </span>
                    </div>
                    <div>
                      <strong>Title:</strong>
                      <input
                        type="text"
                        value={seo.title || ''}
                        onChange={e => setEditableSeo(s => ({ ...s, [product.id]: { ...s[product.id], title: e.target.value } }))}
                        style={{ width: '90%', marginLeft: 8 }}
                      />
                    </div>
                    <div>
                      <strong>Meta Description:</strong>
                      <input
                        type="text"
                        value={seo.metaDescription || ''}
                        onChange={e => setEditableSeo(s => ({ ...s, [product.id]: { ...s[product.id], metaDescription: e.target.value } }))}
                        style={{ width: '90%', marginLeft: 8 }}
                      />
                    </div>
                    <div>
                      <strong>Slug:</strong>
                      <input
                        type="text"
                        value={seo.slug || ''}
                        onChange={e => setEditableSeo(s => ({ ...s, [product.id]: { ...s[product.id], slug: e.target.value } }))}
                        style={{ width: '90%', marginLeft: 8 }}
                      />
                    </div>
                    <div>
                      <strong>Keywords:</strong>
                      <input
                        type="text"
                        value={Array.isArray(seo.keywords) ? seo.keywords.join(', ') : ''}
                        onChange={e => setEditableSeo(s => ({ ...s, [product.id]: { ...s[product.id], keywords: e.target.value.split(',').map(k => k.trim()) } }))}
                        style={{ width: '90%', marginLeft: 8 }}
                      />
                    </div>
                    {/* Status indicator */}
                    {status === 'success' && <div style={{ color: '#7fff7f' }}>✔ Updated</div>}
                    {status === 'error' && <div style={{ color: '#ff7f7f' }}>✖ Error</div>}
                    {/* Undo button if previous SEO exists */}
                    {previousSeo[product.id] && (
                      <button
                        style={{ marginTop: 6, marginRight: 8 }}
                        onClick={async () => {
                          setBulkLoading(true);
                          setError(null);
                          try {
                            const prev = previousSeo[product.id];
                            await fetch(`/api/shopify/update-product?shop=${encodeURIComponent(shopDomain)}&token=${encodeURIComponent(shopToken)}&id=${encodeURIComponent(product.id)}`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                title: prev.title,
                                body_html: product.body_html || '',
                                metafields: [
                                  { namespace: 'global', key: 'description_tag', value: prev.metaDescription, value_type: 'string' },
                                  { namespace: 'global', key: 'keywords', value: (prev.keywords || []).join(','), value_type: 'string' },
                                ],
                                handle: prev.slug,
                              }),
                            });
                            setUpdateStatus(s => ({ ...s, [product.id]: 'success' }));
                          } catch (err) {
                            setUpdateStatus(s => ({ ...s, [product.id]: 'error' }));
                          }
                          setBulkLoading(false);
                        }}
                        disabled={bulkLoading}
                      >Undo</button>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Progress bar for bulk actions */}
            {bulkLoading && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ background: '#444', borderRadius: 6, height: 16, width: '100%', marginBottom: 4 }}>
                  <div style={{ background: '#5c6ac4', height: 16, borderRadius: 6, width: `${progress}%`, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: 12 }}>{progress}% complete</div>
              </div>
            )}
            <button
              style={{ marginTop: 10 }}
              onClick={async () => {
                setBulkLoading(true);
                setError(null);
                setProgress(0);
                const newStatus = {};
                const newPrev = { ...previousSeo };
                const selected = products.filter(p => selectedIds.includes(p.id));
                for (let i = 0; i < selected.length; i++) {
                  const product = selected[i];
                  // Save previous SEO fields for undo
                  if (!newPrev[product.id]) {
                    newPrev[product.id] = {
                      title: product.title,
                      metaDescription: product.body_html || '',
                      slug: product.handle || '',
                      keywords: [],
                    };
                  }
                  const data = editableSeo[product.id];
                  try {
                    await fetch(`/api/shopify/update-product?shop=${encodeURIComponent(shopDomain)}&token=${encodeURIComponent(shopToken)}&id=${encodeURIComponent(product.id)}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: data.title,
                        body_html: product.body_html || '',
                        metafields: [
                          { namespace: 'global', key: 'description_tag', value: data.metaDescription, value_type: 'string' },
                          { namespace: 'global', key: 'keywords', value: (data.keywords || []).join(','), value_type: 'string' },
                        ],
                        handle: data.slug,
                      }),
                    });
                    newStatus[product.id] = 'success';
                  } catch (err) {
                    newStatus[product.id] = 'error';
                  }
                  setProgress(Math.round(((i + 1) / selected.length) * 100));
                }
                setUpdateStatus(s => ({ ...s, ...newStatus }));
                setPreviousSeo(newPrev);
                fetchProducts();
                setBulkLoading(false);
              }}
              disabled={bulkLoading}
            >Approve & Apply All</button>
            <button
              style={{ marginLeft: 10, marginTop: 10 }}
              onClick={exportSeoToCsv}
              disabled={bulkLoading}
            >Export to CSV</button>
            <button
              style={{ marginLeft: 10, marginTop: 10 }}
              onClick={() => setShowBulkPreview(false)}
              disabled={bulkLoading}
            >Close</button>
          </div>
        </div>
      )}

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelectedIds(products.map(p => p.id));
  };
  const deselectAll = () => {
    setSelectedIds([]);
  };

  const fetchProducts = useCallback(() => {
    if (!shopDomain || !shopToken) {
      setProducts([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/shopify/products?shop=${encodeURIComponent(shopDomain)}&token=${encodeURIComponent(shopToken)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
      })
      .then((data) => {
        setProducts(Array.isArray(data.products) ? data.products : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Error loading products');
        setLoading(false);
      });
  }, [shopDomain, shopToken]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);


  // Show connect button if no token
  if (!shopToken) {
    return (
      <div>
        <h1>Shopify Products</h1>
        <div style={{ margin: '24px 0' }}>
          <button
            onClick={() => {
              const url = `https://${window.location.host}/shopify/auth?shop=${encodeURIComponent(shopDomain || '')}`;
              if (window.top) {
                window.top.location.href = url;
              } else {
                window.location.href = url;
              }
            }}
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#5c6ac4',
              color: '#fff',
              borderRadius: 6,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 16,
              border: 0,
              cursor: 'pointer',
            }}
          >
            Connect to Shopify
          </button>
        </div>
        <div style={{ color: '#aaa', fontSize: 13 }}>
          Connect your Shopify store to fetch products.
        </div>
      </div>
    );
  }

  // Filtered products based on search and status
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const status = updateStatus[p.id];
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <h1>Shopify Products</h1>
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', minWidth: 120 }}
        >
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
        <input
          type="text"
          placeholder="Custom AI prompt (optional)"
          value={aiPrompt}
          onChange={e => setAiPrompt(e.target.value)}
          style={{ width: '60%', marginRight: 8, padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ marginRight: 8, padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: 4, borderRadius: 4 }}>
          <option value="all">All</option>
          <option value="success">Updated</option>
          <option value="error">Error</option>
          <option value="pending">Pending</option>
        </select>
      </div>
      <button onClick={fetchProducts} disabled={loading} style={{ marginBottom: 16 }}>
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
      <button onClick={selectAll} disabled={loading || filteredProducts.length === 0} style={{ marginLeft: 8, marginBottom: 16 }}>Select All</button>
      <button onClick={deselectAll} disabled={loading || selectedIds.length === 0} style={{ marginLeft: 8, marginBottom: 16 }}>Deselect All</button>
      <button
        onClick={async () => {
          setLoading(true);
          setError(null);
          try {
            for (const product of filteredProducts.filter(p => selectedIds.includes(p.id))) {
              const res = await fetch('/api/run/product-seo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  productTitle: product.title,
                  productDescription: product.description,
                  brand: '',
                  tone: '',
                  useCases: [],
                  prompt: aiPrompt,
                  language,
                }),
              });
              if (!res.ok) throw new Error('Failed to run Product SEO');
              const data = await res.json();
              await fetch(`/api/shopify/update-product?shop=${encodeURIComponent(shopDomain)}&token=${encodeURIComponent(shopToken)}&id=${encodeURIComponent(product.id)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: data.output.title,
                  body_html: product.body_html || '',
                  metafields: [
                    { namespace: 'global', key: 'description_tag', value: data.output.metaDescription, value_type: 'string' },
                    { namespace: 'global', key: 'keywords', value: data.output.keywords.join(','), value_type: 'string' },
                  ],
                  handle: data.output.slug,
                }),
              });
            }
            alert('SEO updated for selected products!');
            fetchProducts();
          } catch (err) {
            setError(err.message || 'Error running Product SEO');
          }
          setLoading(false);
        }}
        disabled={loading || selectedIds.length === 0}
        style={{ marginLeft: 8, marginBottom: 16 }}
      >Run SEO for Selected</button>
      <button
        onClick={async () => {
          setLoading(true);
          setError(null);
          try {
            for (const product of filteredProducts) {
              const res = await fetch('/api/run/product-seo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  productTitle: product.title,
                  productDescription: product.description,
                  brand: '',
                  tone: '',
                  useCases: [],
                  prompt: aiPrompt,
                  language,
                }),
              });
              if (!res.ok) throw new Error('Failed to run Product SEO');
              const data = await res.json();
              // Update Shopify product with new SEO fields
              await fetch(`/api/shopify/update-product?shop=${encodeURIComponent(shopDomain)}&token=${encodeURIComponent(shopToken)}&id=${encodeURIComponent(product.id)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: data.output.title,
                  body_html: product.body_html || '',
                  metafields: [
                    { namespace: 'global', key: 'description_tag', value: data.output.metaDescription, value_type: 'string' },
                    { namespace: 'global', key: 'keywords', value: data.output.keywords.join(','), value_type: 'string' },
                  ],
                  handle: data.output.slug,
                }),
              });
            }
            alert('Bulk SEO automation complete!');
            fetchProducts();
          } catch (err) {
            setError(err.message || 'Error running bulk Product SEO');
          }
          setLoading(false);
        }}
        disabled={loading || filteredProducts.length === 0}
        style={{ marginLeft: 12, marginBottom: 16 }}
      >Bulk SEO All</button>
      {loading && <div>Loading products...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && !error && (
        filteredProducts.length === 0 ? (
          <div>No products found.</div>
        ) : (
          <ul>
            {filteredProducts.map((product) => {
              // Prefer AI suggestion if available, else use product fields
              let seo = seoSuggestions[product.id] || {
                title: product.title,
                metaDescription: product.metaDescription || product.description || product.body_html || '',
                keywords: product.keywords || [],
                slug: product.slug || product.handle || '',
              };
              // Suggest keywords if missing
              let keywordSuggestions = [];
              if (!seo.keywords || !Array.isArray(seo.keywords) || !seo.keywords[0]) {
                // Simple heuristic: extract top 3-5 unique, non-trivial words from title/description
                const text = ((seo.title || '') + ' ' + (seo.metaDescription || '')).toLowerCase();
                const words = text.match(/\b[a-z0-9]{4,}\b/g) || [];
                const freq = {};
                words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
                keywordSuggestions = Object.entries(freq)
                  .sort((a, b) => b[1] - a[1])
                  .map(([w]) => w)
                  .slice(0, 5);
              }
              const s = computeSeoScore({
                title: seo.title,
                metaDescription: seo.metaDescription,
                keywords: seo.keywords,
                slug: seo.slug,
              });
              let issues = getSeoIssues(seo);
              // Accessibility: check for missing alt text on images
              if (Array.isArray(product.images)) {
                const missingAlt = product.images.filter(img => !img.alt || !img.alt.trim()).length;
                if (missingAlt > 0) {
                  issues = [
                    ...issues,
                    {
                      field: 'Image',
                      msg: `Missing alt text for ${missingAlt} image${missingAlt > 1 ? 's' : ''}`,
                      type: 'warn',
                      tip: 'Add descriptive alt text to all product images for accessibility and SEO.'
                    }
                  ];
                }
              }
              // Track SEO history
              React.useEffect(() => {
                if (!product.id) return;
                setSeoHistory(prev => {
                  const hist = prev[product.id] || [];
                  const last = hist[hist.length - 1];
                  if (!last || last.score !== s || JSON.stringify(last.issues) !== JSON.stringify(issues)) {
                    return {
                      ...prev,
                      [product.id]: [...hist, { date: new Date().toISOString(), score: s, issues }].slice(-10)
                    };
                  }
                  return prev;
                });
              }, [product.id, s, JSON.stringify(issues)]);
              return (
                <li key={product.id} style={{ marginBottom: 12 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(product.id)}
                    onChange={() => toggleSelect(product.id)}
                    style={{ marginRight: 8 }}
                    disabled={loading}
                  />
                  <div style={{
                    background: '#fff',
                    color: '#222',
                    borderRadius: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                    padding: 18,
                    marginBottom: 8,
                    maxWidth: 700,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 600, fontSize: 18 }}>{product.title}</div>
                      <div style={{ fontSize: 15, color: '#888' }}>
                        ${product.variants && product.variants[0] ? product.variants[0].price : 'N/A'}
                      </div>
                      <span style={{ background: '#333', color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: 13, marginLeft: 8 }}>
                        SEO Score: <b style={{ color: s >= 80 ? '#7fff7f' : s >= 60 ? '#ffe97f' : '#ff7f7f' }}>{s}</b>/100
                      </span>
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
                              <span key={kw} style={{
                                background: '#e0e7ff',
                                color: '#222',
                                borderRadius: 4,
                                padding: '2px 6px',
                                marginRight: 4,
                                fontSize: 13,
                                cursor: 'pointer',
                                border: '1px solid #b3bcf5'
                              }}
                                onClick={() => {
                                  // Add suggestion to keywords
                                  seo.keywords = [...(seo.keywords || []), kw];
                                }}
                              >{kw}</span>
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
                    {(() => {
                      const [device, setDevice] = React.useState('desktop');
                      return (
                        <div style={{ margin: '16px 0 0 0' }}>
                          <div style={{ marginBottom: 6 }}>
                            <button onClick={() => setDevice('desktop')} style={{
                              background: device === 'desktop' ? '#5c6ac4' : '#e0e0e0',
                              color: device === 'desktop' ? '#fff' : '#333',
                              border: 'none',
                              borderRadius: 4,
                              padding: '2px 10px',
                              marginRight: 4,
                              cursor: 'pointer',
                              fontSize: 13
                            }}>Desktop</button>
                            <button onClick={() => setDevice('mobile')} style={{
                              background: device === 'mobile' ? '#5c6ac4' : '#e0e0e0',
                              color: device === 'mobile' ? '#fff' : '#333',
                              border: 'none',
                              borderRadius: 4,
                              padding: '2px 10px',
                              cursor: 'pointer',
                              fontSize: 13
                            }}>Mobile</button>
                          </div>
                          <div style={{
                            background: '#f8f9fa',
                            border: '1px solid #e0e0e0',
                            borderRadius: 8,
                            padding: device === 'mobile' ? 10 : 16,
                            maxWidth: device === 'mobile' ? 340 : 600,
                            minHeight: device === 'mobile' ? 120 : 100,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                            fontSize: device === 'mobile' ? 15 : 20,
                            margin: '0 auto',
                            position: 'relative',
                            overflow: 'hidden',
                            borderTop: device === 'mobile' ? '24px solid #e0e0e0' : undefined
                          }}>
                            <div style={{ color: '#1a0dab', fontSize: device === 'mobile' ? 16 : 20, lineHeight: 1.2, fontWeight: 500, marginBottom: 4, wordBreak: 'break-word' }}>
                              {seo.title || <span style={{ color: '#aaa' }}>Title preview</span>}
                            </div>
                            <div style={{ color: '#006621', fontSize: device === 'mobile' ? 12 : 14, marginBottom: 4 }}>
                              https://{shopDomain}/products/{seo.slug || <span style={{ color: '#aaa' }}>slug</span>}
                            </div>
                            <div style={{ color: '#545454', fontSize: device === 'mobile' ? 13 : 15, lineHeight: 1.4 }}>
                              {seo.metaDescription || <span style={{ color: '#aaa' }}>Meta description preview</span>}
                            </div>
                            {device === 'mobile' && (
                              <div style={{ position: 'absolute', top: 2, left: 0, width: '100%', textAlign: 'center', color: '#888', fontSize: 11 }}>
                                Mobile Preview
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                    {issues.length > 0 && (
                      <ul style={{ margin: '10px 0 0 0', padding: 0, listStyle: 'none', fontSize: 13 }}>
                        {issues.map((issue, idx) => (
                          <li key={idx} style={{ color: issue.type === 'error' ? '#ff7f7f' : '#ffe97f', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              {issue.type === 'error' ? '⛔' : '⚠️'} <b>{issue.field}:</b> {issue.msg}
                            </span>
                            {issue.tip && (
                              <span style={{ color: '#888', fontSize: 12, marginLeft: 24 }}>💡 {issue.tip}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {/* SEO history chart */}
                    {seoHistory[product.id] && seoHistory[product.id].length > 1 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>SEO Score History (last 10 changes):</div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 40 }}>
                          {seoHistory[product.id].map((h, i) => (
                            <div key={i} title={h.date + '\nScore: ' + h.score}
                              style={{
                                width: 16,
                                height: (h.score / 100) * 36 + 4,
                                background: h.score >= 80 ? '#7fff7f' : h.score >= 60 ? '#ffe97f' : '#ff7f7f',
                                borderRadius: 3,
                                marginRight: 1
                              }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                <button
                  style={{ marginLeft: 12 }}
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    setSelectedProductId(product.id);
                    try {
                      const res = await fetch('/api/run/product-seo', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          productTitle: product.title,
                          productDescription: product.description,
                          brand: '',
                          tone: '',
                          useCases: [],
                          prompt: aiPrompt,
                          language,
                        }),
                      });
                      if (!res.ok) throw new Error('Failed to run Product SEO');
                      const data = await res.json();
                      setSeoSuggestions((prev) => ({ ...prev, [product.id]: data.output }));
                    } catch (err) {
                      setError(err.message || 'Error running Product SEO');
                    }
                    setLoading(false);
                  }}
                  disabled={loading}
                >Preview SEO</button>
                {/* Show preview panel if this product is selected and has suggestions */}
                {selectedProductId === product.id && seoSuggestions[product.id] && (
                  <div style={{
                    background: '#222',
                    color: '#fff',
                    padding: 16,
                    borderRadius: 8,
                    marginTop: 12,
                    marginBottom: 12,
                    maxWidth: 500,
                  }}>
                    <h4>SEO Suggestions</h4>
                    <div><strong>Title:</strong> {seoSuggestions[product.id].title}</div>
                    <div><strong>Meta Description:</strong> {seoSuggestions[product.id].metaDescription}</div>
                    <div><strong>Slug:</strong> {seoSuggestions[product.id].slug}</div>
                    <div><strong>Keywords:</strong> {Array.isArray(seoSuggestions[product.id].keywords) ? seoSuggestions[product.id].keywords.join(', ') : ''}</div>
                    <button
                      style={{ marginTop: 10 }}
                      onClick={async () => {
                        setLoading(true);
                        setError(null);
                        try {
                          const data = seoSuggestions[product.id];
                          await fetch(`/api/shopify/update-product?shop=${encodeURIComponent(shopDomain)}&token=${encodeURIComponent(shopToken)}&id=${encodeURIComponent(product.id)}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              title: data.title,
                              body_html: product.body_html || '',
                              metafields: [
                                { namespace: 'global', key: 'description_tag', value: data.metaDescription, value_type: 'string' },
                                { namespace: 'global', key: 'keywords', value: (data.keywords || []).join(','), value_type: 'string' },
                              ],
                              handle: data.slug,
                            }),
                          });
                          alert('SEO updated for ' + product.title);
                          setSelectedProductId(null);
                        } catch (err) {
                          setError(err.message || 'Error updating Shopify product');
                        }
                        setLoading(false);
                      }}
                      disabled={loading}
                    >Apply to Shopify</button>
                    <button
                      style={{ marginLeft: 10, marginTop: 10 }}
                      onClick={() => setSelectedProductId(null)}
                      disabled={loading}
                    >Close</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
};

export default ProductsList;
