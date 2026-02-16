import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProductSeoEngine() {
  const [products, setProducts] = useState([]);
  const [shopifyProducts, setShopifyProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [aiInput, setAiInput] = useState({ productName: '', productDescription: '' });
  const [aiResult, setAiResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  useEffect(() => {
    fetchProducts();
    fetchShopifyProducts();
  }, []);

  async function fetchShopifyProducts() {
    try {
      const res = await axios.get('/api/product-seo/shopify-products', { withCredentials: true });
      if (res.data.warning) {
        setError(res.data.warning);
      }
      setShopifyProducts(res.data.products || []);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to load Shopify products.';
      setError(msg);
      setShopifyProducts([]);
    }
  }

  async function fetchProducts() {
    try {
      const res = await axios.get('/api/product-seo');
      setProducts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load SEO records', err);
    }
  }

  const reconnectShopify = () => {
    const url = new URL(window.location.href);
    const shop = url.searchParams.get('shop') || '';
    const target = shop ? `/shopify/auth?shop=${encodeURIComponent(shop)}` : '/shopify/auth';
    if (window.top) window.top.location.href = target; else window.location.href = target;
  };

  async function handleAIGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAiResult('');
    setSuccess('');
    try {
      const res = await axios.post('/api/product-seo/generate', aiInput);
      setAiResult(res.data.result || 'No result');
    } catch (err) {
      setError(err.response?.data?.error || 'AI generation failed');
    }
    setLoading(false);
  }

  function selectProductForGeneration(product) {
    setSelectedProduct(product);
    setAiInput({
      productName: product.title,
      productDescription: product.title // In a real app, fetch full description
    });
    setAiResult('');
    setError('');
    setSuccess('');
  }

  return (
    <div className="product-seo-engine" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ 
        background: 'linear-gradient(120deg, #232b3b 60%, #23284a 100%)', 
        borderRadius: 16, 
        padding: '32px 36px', 
        marginBottom: 32,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
      }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#7fffd4', marginBottom: 8 }}>
          Product SEO Engine
        </h2>
        <p style={{ color: '#b3c2e0', fontSize: 16, marginBottom: 0, lineHeight: 1.6 }}>
          Generate AI-powered SEO titles, meta descriptions, slugs, and keywords for your products.
        </p>
      </div>

      {error && (
        <div style={{ 
          background: '#ff4d4f15', 
          border: '1px solid #ff4d4f', 
          borderRadius: 12, 
          padding: 16, 
          marginBottom: 24,
          color: '#ff4d4f'
        }}>
          {error}
          {shopifyProducts.length === 0 && (
            <button 
              onClick={reconnectShopify}
              style={{
                marginTop: 12,
                background: '#ff4d4f',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Connect Shopify
            </button>
          )}
        </div>
      )}

      {success && (
        <div style={{ 
          background: '#22d37f15', 
          border: '1px solid #22d37f', 
          borderRadius: 12, 
          padding: 16, 
          marginBottom: 24,
          color: '#22d37f'
        }}>
          {success}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Shopify Products Panel */}
        <div style={{ 
          background: '#232b3b', 
          borderRadius: 16, 
          padding: 24,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#7fffd4', marginBottom: 16 }}>
            Your Shopify Products
          </h3>
          
          {shopifyProducts.length === 0 ? (
            <div style={{ color: '#9ca3c7', textAlign: 'center', padding: '32px 0' }}>
              No products found. Please connect your Shopify store.
            </div>
          ) : (
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {shopifyProducts.map(p => (
                <div 
                  key={p.id}
                  onClick={() => selectProductForGeneration(p)}
                  style={{
                    background: selectedProduct?.id === p.id ? '#7fffd415' : '#1f2436',
                    border: selectedProduct?.id === p.id ? '2px solid #7fffd4' : '1px solid #2f3650',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
                  {p.image && (
                    <img 
                      src={p.image} 
                      alt={p.title} 
                      style={{ 
                        width: 48, 
                        height: 48, 
                        objectFit: 'cover', 
                        borderRadius: 8 
                      }} 
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#e8f2ff', fontWeight: 700, marginBottom: 4 }}>
                      {p.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3c7' }}>
                      {p.handle} • {p.vendor} • {p.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Generation Panel */}
        <div style={{ 
          background: '#232b3b', 
          borderRadius: 16, 
          padding: 24,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#7fffd4', marginBottom: 16 }}>
            Generate SEO with AI
          </h3>
          
          <form onSubmit={handleAIGenerate}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#b3c2e0', marginBottom: 8, fontWeight: 600 }}>
                Product Name
              </label>
              <input
                type="text"
                placeholder="Enter product name"
                value={aiInput.productName}
                onChange={e => setAiInput({ ...aiInput, productName: e.target.value })}
                required
                style={{
                  width: '100%',
                  borderRadius: 8,
                  padding: '10px 12px',
                  border: '1px solid #2f3650',
                  background: '#0f1324',
                  color: '#e8f2ff',
                  fontSize: 14
                }}
              />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#b3c2e0', marginBottom: 8, fontWeight: 600 }}>
                Product Description
              </label>
              <textarea
                placeholder="Enter product description"
                value={aiInput.productDescription}
                onChange={e => setAiInput({ ...aiInput, productDescription: e.target.value })}
                required
                rows={4}
                style={{
                  width: '100%',
                  borderRadius: 8,
                  padding: '10px 12px',
                  border: '1px solid #2f3650',
                  background: '#0f1324',
                  color: '#e8f2ff',
                  fontSize: 14,
                  resize: 'vertical'
                }}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#3a3f55' : '#7fffd4',
                color: '#0f1324',
                border: 'none',
                borderRadius: 8,
                fontWeight: 800,
                padding: '12px 16px',
                cursor: loading ? 'wait' : 'pointer',
                fontSize: 15
              }}
            >
              {loading ? 'Generating...' : 'Generate SEO'}
            </button>
          </form>

          {aiResult && (
            <div style={{ 
              marginTop: 16, 
              background: '#0f1324', 
              border: '1px solid #2f3650',
              borderRadius: 12,
              padding: 16,
              color: '#e8f2ff',
              fontSize: 14,
              lineHeight: 1.6,
              maxHeight: 300,
              overflowY: 'auto'
            }}>
              <div style={{ fontWeight: 700, color: '#7fffd4', marginBottom: 8 }}>
                AI Generated SEO:
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
                {aiResult}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* SEO Records Table */}
      <div style={{ 
        background: '#232b3b', 
        borderRadius: 16, 
        padding: 24,
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#7fffd4', marginBottom: 16 }}>
          Saved SEO Records
        </h3>
        
        {products.length === 0 ? (
          <div style={{ color: '#9ca3c7', textAlign: 'center', padding: '32px 0' }}>
            No SEO records yet. Generate some SEO content above to get started.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 12, color: '#7fffd4', borderBottom: '2px solid #2f3650' }}>Product ID</th>
                  <th style={{ textAlign: 'left', padding: 12, color: '#7fffd4', borderBottom: '2px solid #2f3650' }}>Title</th>
                  <th style={{ textAlign: 'left', padding: 12, color: '#7fffd4', borderBottom: '2px solid #2f3650' }}>Meta Description</th>
                  <th style={{ textAlign: 'left', padding: 12, color: '#7fffd4', borderBottom: '2px solid #2f3650' }}>Slug</th>
                  <th style={{ textAlign: 'left', padding: 12, color: '#7fffd4', borderBottom: '2px solid #2f3650' }}>Keywords</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #2f3650' }}>
                    <td style={{ padding: 12, color: '#e8f2ff' }}>{p.product_id}</td>
                    <td style={{ padding: 12, color: '#e8f2ff' }}>{p.title}</td>
                    <td style={{ padding: 12, color: '#9ca3c7', fontSize: 13 }}>{p.meta_description}</td>
                    <td style={{ padding: 12, color: '#9ca3c7', fontSize: 13 }}>{p.slug}</td>
                    <td style={{ padding: 12, color: '#9ca3c7', fontSize: 13 }}>{p.keywords}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
