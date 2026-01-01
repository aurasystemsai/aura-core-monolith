

import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProductSeoEngine() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ product_id: '', title: '', meta_description: '', slug: '', keywords: '' });
  const [aiInput, setAiInput] = useState({ productName: '', productDescription: '' });
  const [aiResult, setAiResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken || ''));
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await axios.get('/api/product-seo');
      setProducts(res.data.data || []);
    } catch (err) {
      setError('Failed to load products');
    }
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
          The Product SEO Engine uses AI to generate SEO-optimized titles, meta descriptions, slugs, and keyword sets for your products. You can generate suggestions with AI, then save and manage SEO records for your catalog.
        </p>
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
      {error && <div className="error">{error}</div>}
    </div>
  );
}
