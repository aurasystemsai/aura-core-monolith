import React, { useState, useEffect } from 'react';


const ProductsList = ({ shopDomain, shopToken }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shopDomain || !shopToken) {
      setProducts([]);
      setError("Missing shop domain or token.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    // Example fetch, replace with your actual endpoint
    fetch(`/api/shopify/products?shop=${encodeURIComponent(shopDomain)}`, {
      headers: {
        Authorization: `Bearer ${shopToken}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch products");
        return res.json();
      })
      .then((data) => {
        setProducts(Array.isArray(data.products) ? data.products : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Error loading products");
        setLoading(false);
      });
  }, [shopDomain, shopToken]);

  if (loading) {
    return <div>Loading products...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div>
      <h1>Shopify Products</h1>
      {products.length === 0 ? (
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
      )}
    </div>
  );
};

export default ProductsList;
