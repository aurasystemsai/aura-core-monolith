



import React, { useState, useEffect } from 'react';
import axios from 'axios';


export default function ProductSeoEngine() {
  const [products, setProducts] = useState([]);
  const [shopifyProducts, setShopifyProducts] = useState([]);
  const [form, setForm] = useState({ product_id: '', title: '', meta_description: '', slug: '', keywords: '' });
  const [aiInput, setAiInput] = useState({ productName: '', productDescription: '' });
  const [aiResult, setAiResult] = useState('');
  const [bulkAIInput, setBulkAIInput] = useState('');
  const [bulkAIResults, setBulkAIResults] = useState([]);
  const [importData, setImportData] = useState('');
  const [importFormat, setImportFormat] = useState('csv');
  const [exportFormat, setExportFormat] = useState('csv');
  const [analytics, setAnalytics] = useState([]);
  const [shopifyShop, setShopifyShop] = useState('');
  const [shopifyToken, setShopifyToken] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [rbacUser, setRbacUser] = useState('');
  const [rbacAction, setRbacAction] = useState('');
  const [rbacAllowed, setRbacAllowed] = useState(null);
  const [docs, setDocs] = useState('');
  const [i18n, setI18n] = useState({});
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState('');



  useEffect(() => {
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken || ''));
    fetchProducts();
    fetchShopifyProducts();
    fetchAnalytics();
    fetchDocs();
    fetchI18n();
  }, []);

  async function fetchShopifyProducts() {
    try {
      const res = await axios.get('/api/product-seo/shopify-products');
      setShopifyProducts(res.data.products || []);
    } catch (err) {
      // Don't block UI, but log error
      console.error('Failed to load Shopify products', err);
    }
  }
      <section>
        <h3>Shopify Products</h3>
        {shopifyProducts.length === 0 ? <div>No Shopify products found.</div> : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Handle</th>
                <th>Status</th>
                <th>Vendor</th>
                <th>Tags</th>
                <th>Image</th>
                <th>Created</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {shopifyProducts.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.title}</td>
                  <td>{p.handle}</td>
                  <td>{p.status}</td>
                  <td>{p.vendor}</td>
                  <td>{p.tags}</td>
                  <td>{p.image ? <img src={p.image} alt={p.title} style={{ width: 40, height: 40, objectFit: 'cover' }} /> : ''}</td>
                  <td>{p.created_at}</td>
                  <td>{p.updated_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>


  async function fetchProducts() {
    try {
      const res = await axios.get('/api/product-seo');
      setProducts(res.data.data || []);
    } catch (err) {
      setError('Failed to load products');
    }
  }

  async function fetchAnalytics() {
    try {
      const res = await axios.get('/api/product-seo/analytics');
      setAnalytics(res.data.events || []);
    } catch (err) {}
  }

  async function fetchDocs() {
    try {
      const res = await axios.get('/api/product-seo/docs');
      setDocs(res.data.docs || '');
    } catch (err) {}
  }

  async function fetchI18n() {
    try {
      const res = await axios.get('/api/product-seo/i18n');
      setI18n(res.data.i18n || {});
    } catch (err) {}
  }


  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/product-seo', form, { headers: { 'csrf-token': csrfToken } });
      setForm({ product_id: '', title: '', meta_description: '', slug: '', keywords: '' });
      fetchProducts();
    } catch (err) {
      setError('Failed to save');
    }
    setLoading(false);
  }

  async function handleBulkAIGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setBulkAIResults([]);
    try {
      // Expecting bulkAIInput as JSON array of { productName, productDescription }
      const products = JSON.parse(bulkAIInput);
      const res = await axios.post('/api/product-seo/bulk-generate', { products }, { headers: { 'csrf-token': csrfToken } });
      setBulkAIResults(res.data.results || []);
    } catch (err) {
      setError('Bulk AI generation failed');
    }
    setLoading(false);
  }

  async function handleImport(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/product-seo/import', { data: importData, format: importFormat }, { headers: { 'csrf-token': csrfToken } });
      setImportData('');
      fetchProducts();
    } catch (err) {
      setError('Import failed');
    }
    setLoading(false);
  }

  async function handleExport() {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/product-seo/export?format=${exportFormat}`);
      if (exportFormat === 'csv') {
        const blob = new Blob([res.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'product-seo.csv';
        a.click();
      } else {
        const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'product-seo.json';
        a.click();
      }
    } catch (err) {
      setError('Export failed');
    }
    setLoading(false);
  }

  async function handleShopifyImport(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/product-seo/shopify/import', { shop: shopifyShop, token: shopifyToken }, { headers: { 'csrf-token': csrfToken } });
      fetchProducts();
    } catch (err) {
      setError('Shopify import failed');
    }
    setLoading(false);
  }

  async function handleShopifyExport(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/product-seo/shopify/export', { shop: shopifyShop, token: shopifyToken, products }, { headers: { 'csrf-token': csrfToken } });
    } catch (err) {
      setError('Shopify export failed');
    }
    setLoading(false);
  }

  async function handleNotify() {
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/product-seo/notify', { message: 'SEO update', time: new Date().toISOString() }, { headers: { 'csrf-token': csrfToken } });
      setNotifications([...notifications, { message: 'SEO update', time: new Date().toISOString() }]);
    } catch (err) {
      setError('Notification failed');
    }
    setLoading(false);
  }

  async function handleRBACCheck() {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/product-seo/rbac/check?user=${rbacUser}&action=${rbacAction}`);
      setRbacAllowed(res.data.allowed);
    } catch (err) {
      setError('RBAC check failed');
    }
    setLoading(false);
  }

  async function handleAIGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAiResult('');
    try {
      const res = await axios.post('/api/product-seo/generate', aiInput, { headers: { 'csrf-token': csrfToken } });
      setAiResult(res.data.result || 'No result');
    } catch (err) {
      setError('AI generation failed');
    }
    setLoading(false);
  }


  return (
    <div className="product-seo-engine">
      <h2>Product SEO Engine</h2>
      <section style={{ marginBottom: 32 }}>
        <h3>What is this?</h3>
        <p>
          {i18n[lang]?.description || 'The Product SEO Engine uses AI to generate SEO-optimized titles, meta descriptions, slugs, and keyword sets for your products. You can generate suggestions with AI, then save and manage SEO records for your catalog.'}
        </p>
        <div>
          <label>Language: </label>
          <select value={lang} onChange={e => setLang(e.target.value)}>
            {Object.keys(i18n).map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </section>
      <section>
        <h3>Generate SEO with AI</h3>
        <form onSubmit={handleAIGenerate} style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Product Name"
            value={aiInput.productName}
            onChange={e => setAiInput({ ...aiInput, productName: e.target.value })}
            required
          />
          <textarea
            placeholder="Product Description"
            value={aiInput.productDescription}
            onChange={e => setAiInput({ ...aiInput, productDescription: e.target.value })}
            required
          />
          <button type="submit" disabled={loading}>Generate</button>
        </form>
        {aiResult && <pre className="ai-result">{aiResult}</pre>}
      </section>
      <section>
        <h3>Bulk AI Generation</h3>
        <form onSubmit={handleBulkAIGenerate} style={{ marginBottom: 16 }}>
          <textarea
            placeholder='Paste JSON array: [{ "productName": "...", "productDescription": "..." }, ...]'
            value={bulkAIInput}
            onChange={e => setBulkAIInput(e.target.value)}
            rows={4}
            style={{ width: '100%' }}
          />
          <button type="submit" disabled={loading}>Bulk Generate</button>
        </form>
        {bulkAIResults.length > 0 && (
          <div>
            <h4>Results</h4>
            <ul>
              {bulkAIResults.map((r, i) => <li key={i}><pre>{JSON.stringify(r, null, 2)}</pre></li>)}
            </ul>
          </div>
        )}
      </section>
      <section>
        <h3>Import/Export</h3>
        <form onSubmit={handleImport} style={{ marginBottom: 8 }}>
          <textarea
            placeholder="Paste CSV or JSON data"
            value={importData}
            onChange={e => setImportData(e.target.value)}
            rows={3}
            style={{ width: '100%' }}
          />
          <select value={importFormat} onChange={e => setImportFormat(e.target.value)}>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
          <button type="submit" disabled={loading}>Import</button>
        </form>
        <div>
          <select value={exportFormat} onChange={e => setExportFormat(e.target.value)}>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
          <button onClick={handleExport} disabled={loading}>Export</button>
        </div>
      </section>
      <section>
        <h3>Shopify Sync</h3>
        <form onSubmit={handleShopifyImport} style={{ marginBottom: 8 }}>
          <input type="text" placeholder="Shop Domain" value={shopifyShop} onChange={e => setShopifyShop(e.target.value)} />
          <input type="text" placeholder="Admin Token" value={shopifyToken} onChange={e => setShopifyToken(e.target.value)} />
          <button type="submit" disabled={loading}>Import from Shopify</button>
        </form>
        <form onSubmit={handleShopifyExport}>
          <button type="submit" disabled={loading}>Export to Shopify</button>
        </form>
      </section>
      <section>
        <h3>Add Product SEO Record</h3>
        <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Product ID"
            value={form.product_id}
            onChange={e => setForm({ ...form, product_id: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Meta Description"
            value={form.meta_description}
            onChange={e => setForm({ ...form, meta_description: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Slug"
            value={form.slug}
            onChange={e => setForm({ ...form, slug: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Keywords"
            value={form.keywords}
            onChange={e => setForm({ ...form, keywords: e.target.value })}
            required
          />
          <button type="submit" disabled={loading}>Save</button>
        </form>
      </section>
      <section>
        <h3>SEO Records</h3>
        {products.length === 0 ? <div>No records yet.</div> : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Product ID</th>
                <th>Title</th>
                <th>Meta Description</th>
                <th>Slug</th>
                <th>Keywords</th>
                <th>Created</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.product_id}</td>
                  <td>{p.title}</td>
                  <td>{p.meta_description}</td>
                  <td>{p.slug}</td>
                  <td>{p.keywords}</td>
                  <td>{p.created_at}</td>
                  <td>{p.updated_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section>
        <h3>Analytics</h3>
        {analytics.length === 0 ? <div>No analytics yet.</div> : (
          <ul>
            {analytics.map((a, i) => <li key={i}>{JSON.stringify(a)}</li>)}
          </ul>
        )}
      </section>
      <section>
        <h3>Notifications</h3>
        <button onClick={handleNotify} disabled={loading}>Send Notification</button>
        <ul>
          {notifications.map((n, i) => <li key={i}>{n.message} ({n.time})</li>)}
        </ul>
      </section>
      <section>
        <h3>RBAC</h3>
        <input type="text" placeholder="User" value={rbacUser} onChange={e => setRbacUser(e.target.value)} />
        <input type="text" placeholder="Action" value={rbacAction} onChange={e => setRbacAction(e.target.value)} />
        <button onClick={handleRBACCheck} disabled={loading}>Check Permission</button>
        {rbacAllowed !== null && <span>Allowed: {String(rbacAllowed)}</span>}
      </section>
      <section>
        <h3>Docs</h3>
        <pre>{docs}</pre>
      </section>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
