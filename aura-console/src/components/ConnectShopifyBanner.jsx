import React from "react";

const ConnectShopifyBanner = ({ shopDomain }) => {
  const handleConnect = () => {
    const shop = shopDomain || prompt('Enter your Shopify store domain (e.g., yourstore.myshopify.com):');
    
    if (!shop) {
      return;
    }

    if (!shop.includes('.myshopify.com')) {
      alert('Please enter a valid Shopify domain (e.g., yourstore.myshopify.com)');
      return;
    }

    const url = `/shopify/auth?shop=${encodeURIComponent(shop)}`;
    
    // Handle both embedded and non-embedded contexts
    if (window.top && window.top !== window) {
      window.top.location.href = url;
    } else {
      window.location.href = url;
    }
  };

  return (
    <div className="card connect-shopify-banner" role="region" aria-label="Connect Shopify Store">
      <h2 style={{ margin: 0, fontWeight: 700 }}>Connect your Shopify store</h2>
      <p style={{ margin: "12px 0 20px 0", fontSize: 16 }}>
        To use all features, connect your Shopify store to AURA.
      </p>
      <button
        className="button connect-shopify-action"
        onClick={handleConnect}
      >
        Connect to Shopify
      </button>
    </div>
  );
};

export default ConnectShopifyBanner;
