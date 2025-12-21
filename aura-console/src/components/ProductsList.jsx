

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
    fetch(`/api/shopify/products?shop=${encodeURIComponent(shopDomain)}`, {
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


  // Show connect button if no token
  if (!shopToken) {
    return (
      <div>
        <h1>Shopify Products</h1>
        <div style={{ margin: '24px 0' }}>
          <a
            href={`https://${window.location.host}/shopify/auth?shop=${encodeURIComponent(shopDomain || '')}`}
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#5c6ac4',
              color: '#fff',
              borderRadius: 6,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            Connect to Shopify
          </a>
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
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
};

export default ProductsList;
