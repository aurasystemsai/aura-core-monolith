import React, { useState, useEffect } from 'react';

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch products from the backend API
    fetch('/debug/shopify/products?shop=your-shop-name.myshopify.com&token=your-api-token') // Make sure to replace with correct parameters
      .then((response) => response.json())
      .then((data) => {
        setProducts(data.products); // Store the products in state
        setLoading(false); // Done loading
      })
      .catch((err) => {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
        setLoading(false); // Done loading even if there's an error
      });
  }, []);

  if (loading) {
    return <div>Loading products...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h1>Shopify Products</h1>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <strong>{product.title}</strong> - ${product.variants[0].price}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductsList;
