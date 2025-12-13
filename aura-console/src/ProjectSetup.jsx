import React, { useState } from "react";
import "./App.css"; // keep your main CSS styling file consistent with AURA Console

export default function ProjectSetup({ onConnected }) {
  const [projectName, setProjectName] = useState("");
  const [storefrontDomain, setStorefrontDomain] = useState("");
  const [platform, setPlatform] = useState("Other / Manual (default)");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConnect = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("https://aura-core-monolith.onrender.com/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          domain: storefrontDomain,
          platform,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Connection failed");
      setSuccess(true);
      setTimeout(() => {
        onConnected(data.project);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Failed to connect. Please check your info or try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="connect-container">
      <div className="connect-card">
        <h2 className="connect-heading">Connect your store</h2>
        <p className="connect-description">
          AURA works with Shopify and all other ecommerce platforms. For non-Shopify stores, you'll paste
          product details manually into the SEO tools.
        </p>

        <div className="form-group">
          <label>Project / Brand name</label>
          <input
            type="text"
            value={projectName}
            placeholder="e.g. DTP Jewellery"
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Storefront domain</label>
          <input
            type="text"
            value={storefrontDomain}
            placeholder="e.g. dtpjewellry.com"
            onChange={(e) => setStorefrontDomain(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Platform</label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option>Other / Manual (default)</option>
            <option>Shopify</option>
            <option>WooCommerce</option>
            <option>Wix</option>
            <option>Squarespace</option>
            <option>BigCommerce</option>
          </select>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">✅ Connected successfully!</div>}

        <button
          className="connect-btn gradient-btn"
          onClick={handleConnect}
          disabled={loading}
        >
          {loading ? "Connecting..." : "Connect Store"}
        </button>
      </div>
    </div>
  );
}
