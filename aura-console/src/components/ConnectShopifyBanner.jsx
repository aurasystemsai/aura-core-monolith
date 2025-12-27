import React from "react";

const ConnectShopifyBanner = ({ shopDomain }) => (
  <div className="card connect-shopify-banner" role="region" aria-label="Connect Shopify Store">
    <h2 style={{ margin: 0, fontWeight: 700 }}>Connect your Shopify store</h2>
    <p style={{ margin: "12px 0 20px 0", fontSize: 16 }}>
      To use all features, connect your Shopify store to AURA.
    </p>
    <button
      className="button connect-shopify-action"
      onClick={() => {
        const url = `https://${window.location.host}/shopify/auth?shop=${encodeURIComponent(shopDomain || "")}`;
        if (window.top) {
          window.top.location.href = url;
        } else {
          window.location.href = url;
        }
      }}
    >
      Connect to Shopify
    </button>
  </div>
);

export default ConnectShopifyBanner;
