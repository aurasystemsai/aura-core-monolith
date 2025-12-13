import React, { useState } from "react";
import "./App.css"; // keep using your main console styling

// This component:
// - Shows the big "Connect your store" card
// - Saves project to localStorage
// - Calls onConnected(project) so App.jsx can show the dashboard
export default function ProjectSetup({ onConnected }) {
  const [projectName, setProjectName] = useState("");
  const [storefrontDomain, setStorefrontDomain] = useState("");
  const [platform, setPlatform] = useState("Other / Manual (default)");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    setError("");

    const name = projectName.trim();
    const domain = storefrontDomain.trim();

    if (!name || !domain) {
      setError("Please enter both a project name and storefront domain.");
      return;
    }

    setLoading(true);

    // Build the project object we’ll use everywhere
    const project = {
      name,
      domain,
      platform,
    };

    // Persist for future visits (same as your previous behaviour)
    try {
      localStorage.setItem("auraProjectName", project.name);
      localStorage.setItem("auraProjectDomain", project.domain);
      localStorage.setItem("auraPlatform", project.platform);
      localStorage.setItem("auraProjectId", project.domain); // simple id for now
    } catch (e) {
      console.error("Failed to write project to localStorage", e);
    }

    setSuccess(true);

    // Tiny delay so the green success state can flash, then hand off to App
    setTimeout(() => {
      setLoading(false);
      if (typeof onConnected === "function") {
        onConnected(project);
      }
    }, 600);
  };

  return (
    <div className="connect-container">
      <div className="connect-card">
        <h2 className="connect-heading">Connect your store</h2>
        <p className="connect-description">
          AURA works with Shopify and all other ecommerce platforms. For
          non-Shopify stores, you’ll paste product details manually into the SEO tools.
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
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option>Other / Manual (default)</option>
            <option>Shopify</option>
            <option>WooCommerce</option>
            <option>Wix</option>
            <option>Squarespace</option>
            <option>BigCommerce</option>
          </select>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {success && (
          <div className="success-banner">✅ Connected successfully!</div>
        )}

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
