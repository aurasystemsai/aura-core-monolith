

import React, { useState, useEffect, useCallback } from 'react';

// Simple spinner SVG
const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
    <svg width="32" height="32" viewBox="0 0 50 50">
      <circle cx="25" cy="25" r="20" fill="none" stroke="#5c6ac4" strokeWidth="5" strokeDasharray="31.4 31.4" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
      </circle>
    </svg>
  </div>
);

// Skeleton loader for product list
const ProductSkeleton = () => (
  <ul>
    {[1,2,3,4,5].map((i) => (
      <li key={i} style={{ background: '#f3f4f6', borderRadius: 6, height: 28, margin: '8px 0', width: '60%', animation: 'pulse 1.5s infinite' }} />
    ))}
    <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style>
  </ul>
);


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
    // Sanitize shop domain: remove protocol and trailing slash
    let cleanShop = shopDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    setLoading(true);
    setError(null);
    fetch(`/api/shopify/products?shop=${encodeURIComponent(cleanShop)}`, {
      headers: {
        Authorization: `Bearer ${shopToken}`,
      },
    })
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


  // Show connect button if no token and no products loaded
  if (!shopToken && (!products || products.length === 0)) {
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
            className="button button--primary"
            style={{ minWidth: 180, fontSize: 16 }}
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
      <button
        onClick={fetchProducts}
        disabled={loading}
        className="button button--primary"
        style={{ marginBottom: 16, minWidth: 120 }}
      >
        {loading ? <Spinner /> : 'Refresh'}
      </button>
      {loading && <ProductSkeleton />}
      {error && (
        <div style={{
          background: '#fee2e2',
          color: '#991b1b',
          border: '1px solid #fecaca',
          borderRadius: 8,
          padding: '10px 16px',
          margin: '16px 0',
          fontWeight: 500,
        }}>{error}</div>
      )}
      {!loading && !error && (
        products.length === 0 ? (
          <div>No products found.</div>
        ) : (
          <ul>
            {products.map((product) => (
              <li key={product.id}>
                <strong>{product.title}</strong> - $
                {product.price || 'N/A'}
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
};

export default ProductsList;
