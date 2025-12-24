

import React, { useState, useEffect, useCallback } from 'react';


const ProductsList = ({ shopDomain, shopToken }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <div>
      <h1>Shopify Products</h1>
      <button onClick={fetchProducts} disabled={loading} style={{ marginBottom: 16 }}>
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
      <button
        onClick={async () => {
          setLoading(true);
          setError(null);
          try {
            for (const product of products) {
              const res = await fetch('/api/run/product-seo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  productTitle: product.title,
                  productDescription: product.description || '',
                  brand: '',
                  tone: '',
                  useCases: [],
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
        disabled={loading || products.length === 0}
        style={{ marginLeft: 12, marginBottom: 16 }}
      >Bulk SEO All</button>
      {loading && <div>Loading products...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && !error && (
        products.length === 0 ? (
          <div>No products found.</div>
        ) : (
          <ul>
            {products.map((product) => (
              <li key={product.id}>
                <strong>{product.title}</strong> - $
                {product.variants && product.variants[0] ? product.variants[0].price : 'N/A'}
                <button
                  style={{ marginLeft: 12 }}
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
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
                      alert(
                        `SEO updated for ${product.title}:\n\n` +
                        `Title: ${data.output.title}\n` +
                        `Meta Description: ${data.output.metaDescription}\n` +
                        `Slug: ${data.output.slug}\n` +
                        `Keywords: ${data.output.keywords.join(', ')}`
                      );
                    } catch (err) {
                      setError(err.message || 'Error running Product SEO');
                    }
                    setLoading(false);
                  }}
                  disabled={loading}
                >Run Product SEO</button>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
};

export default ProductsList;
