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
      ['Product Title', 'SEO Title', 'Meta Description', 'Slug', 'Keywords'],
      ...products.filter(p => selectedIds.includes(p.id)).map(product => {
        const seo = editableSeo[product.id] || {};
        return [
          product.title,
          seo.title || '',
          seo.metaDescription || '',
          seo.slug || '',
          Array.isArray(seo.keywords) ? seo.keywords.join(', ') : '',
        ];
      })
    ];
    const csv = rows.map(r => r.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'seo-suggestions.csv';
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
            productDescription: product.description || '',
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
                  productDescription: product.description || '',
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
                  productDescription: product.description || '',
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
            {filteredProducts.map((product) => (
              <li key={product.id}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(product.id)}
                  onChange={() => toggleSelect(product.id)}
                  style={{ marginRight: 8 }}
                  disabled={loading}
                />
                <strong>{product.title}</strong> - $
                {product.variants && product.variants[0] ? product.variants[0].price : 'N/A'}
                {/* SEO Score badge */}
                {seoSuggestions[product.id] && (
                  (() => {
                    const s = computeSeoScore({
                      title: seoSuggestions[product.id].title,
                      metaDescription: seoSuggestions[product.id].metaDescription,
                      keywords: seoSuggestions[product.id].keywords,
                      slug: seoSuggestions[product.id].slug,
                    });
                    return (
                      <span style={{ background: '#333', color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: 13, marginLeft: 8 }}>
                        SEO Score: <b style={{ color: s >= 80 ? '#7fff7f' : s >= 60 ? '#ffe97f' : '#ff7f7f' }}>{s}</b>/100
                      </span>
                    );
                  })()
                )}
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
                          productDescription: product.description || '',
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
