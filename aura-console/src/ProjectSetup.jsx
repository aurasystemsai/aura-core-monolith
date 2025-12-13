import React, { useState } from "react";
import "./App.css";

export default function ProjectSetup({ onConnected }) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [platform, setPlatform] = useState("Other / Manual (default)");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("https://aura-core-monolith.onrender.com/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, domain, platform })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Connection failed");

      setSuccess(true);
      setTimeout(() => {
        onConnected(data.project);
      }, 1000);
    } catch (err) {
      console.error("❌ Connect failed:", err);
      setError("Failed to connect to AURA Core API. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-wrapper">
      <div className="setup-card">
        <h2>Connect your store</h2>
        <p>
          AURA works with Shopify and all other ecommerce platforms. For non-Shopify stores,
          you’ll paste product details manually into the SEO tools.
        </p>

        <label>Project / Brand name</label>
        <input
          type="text"
          value={name}
          placeholder="e.g. DTP Jewellery"
          onChange={(e) => setName(e.target.value)}
        />

        <label>Storefront domain</label>
        <input
          type="text"
          value={domain}
          placeholder="e.g. dtpjewellry.com"
          onChange={(e) => setDomain(e.target.value)}
        />

        <label>Platform</label>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option>Other / Manual (default)</option>
          <option>Shopify</option>
          <option>WooCommerce</option>
          <option>Wix</option>
          <option>Squarespace</option>
          <option>BigCommerce</option>
        </select>

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">✅ Connected successfully!</div>}

        <button
          className="connect-btn"
          onClick={handleConnect}
          disabled={loading}
        >
          {loading ? "Connecting..." : "Connect Store"}
        </button>
      </div>
    </div>
  );
}
