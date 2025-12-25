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
  }
  // ...rest of getSeoIssues logic...
  return issues;
}

// ...existing code for computeSeoScore, exportSeoToCsv, and other helpers if present...

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
      }
        }, [fetchProducts]);
    
      // You can add your component's return statement here
      return (
        <div>
          {/* Your ProductsList UI goes here */}
          <DebugPanel />
        </div>
      );
    };
    
    export default ProductsList;

