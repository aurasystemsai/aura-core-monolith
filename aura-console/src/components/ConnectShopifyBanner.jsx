import React from "react";
import { getShopifyAppBridge } from "../shopifyAppBridge";


const ConnectShopifyBanner = ({ shopDomain }) => (
  <div style={{
    background: "#5c6ac4",
    color: "#fff",
    padding: 32,
    borderRadius: 12,
    margin: "32px 0",
    textAlign: "center",
    boxShadow: "0 4px 24px rgba(92,106,196,0.10)",
    position: "relative"
  }}>
    {/* Logo */}
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
      <img src="/aura-logo.svg" alt="AURA Systems AI" style={{ height: 48, width: 48, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
    </div>
    <h2 style={{ margin: 0, fontWeight: 700, fontSize: 28 }}>Connect your Shopify store</h2>
    <p style={{ margin: "16px 0 20px 0", fontSize: 18, fontWeight: 500 }}>
      Unlock AI-powered SEO, content, and automation for your Shopify brand.
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
      className="button button--primary"
      style={{
        display: "inline-block",
        padding: "14px 40px",
        background: "#fff",
        color: "#5c6ac4",
        borderRadius: 8,
        textDecoration: "none",
        fontWeight: 700,
        fontSize: 20,
        boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
        border: 0,
        cursor: "pointer",
        marginTop: 12,
        transition: 'background 0.2s, color 0.2s',
      }}
    >
      Connect to Shopify
    </button>
    <div style={{ marginTop: 18, color: '#e0e7ff', fontSize: 15 }}>
      No credit card required. Cancel anytime.
    </div>
  </div>
);

export default ConnectShopifyBanner;
