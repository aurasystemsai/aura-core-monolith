import React from "react";
import { getShopifyAppBridge } from "../shopifyAppBridge";

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
    <button
      onClick={() => {
        const url = `https://${window.location.host}/shopify/auth?shop=${encodeURIComponent(shopDomain || "")}`;
        // Try App Bridge redirect if embedded
        try {
          const app = getShopifyAppBridge(shopDomain);
          if (app) {
            import('@shopify/app-bridge/actions').then(({ Redirect }) => {
              const redirect = Redirect.create(app);
              redirect.dispatch(Redirect.Action.REMOTE, url);
            });
            return;
          }
        } catch (e) { /* fallback below */ }
        if (window.top) {
          window.top.location.href = url;
        } else {
          window.location.href = url;
        }
      }}
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
        border: 0,
        cursor: "pointer",
      }}
    >
      Connect to Shopify
    </button>
  </div>
);

export default ConnectShopifyBanner;
