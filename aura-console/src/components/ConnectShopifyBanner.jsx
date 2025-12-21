import React from "react";

const ConnectShopifyBanner = ({ shopDomain }) => (
  <div style={{
    background: "#5c6ac4",
    color: "#fff",
    padding: 24,
    borderRadius: 8,
    margin: "24px 0",
    textAlign: "center",
  }}>
    <h2 style={{ margin: 0, fontWeight: 700 }}>Connect your Shopify store</h2>
    <p style={{ margin: "12px 0 20px 0", fontSize: 16 }}>
      To use all features, connect your Shopify store to AURA.
    </p>
    <a
      href={`https://${window.location.host}/shopify/auth?shop=${encodeURIComponent(shopDomain || "")}`}
      style={{
        display: "inline-block",
        padding: "12px 32px",
        background: "#fff",
        color: "#5c6ac4",
        borderRadius: 6,
        textDecoration: "none",
        fontWeight: 600,
        fontSize: 18,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      Connect to Shopify
    </a>
  </div>
);

export default ConnectShopifyBanner;
