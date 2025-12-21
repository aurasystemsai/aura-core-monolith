import React, { useState, useEffect } from 'react';

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // This component should receive shopDomain and shopToken as props, or get them from context or parent state
  // For now, do not fetch with a hardcoded placeholder. Only fetch if valid shopDomain and token are provided.
  // Example usage: <ProductsList shopDomain={shopDomain} shopToken={shopToken} />

  // Remove the useEffect with the hardcoded fetch. The parent should control when/how to fetch.
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
            <strong>{product.title}</strong> - ${product.variants && product.variants[0] ? product.variants[0].price : 'N/A'}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProductsList;
