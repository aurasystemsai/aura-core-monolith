import React, { useState } from "react";

export default function ProjectSetup({ coreUrl, onConnected }) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [platform, setPlatform] = useState("other");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${coreUrl}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, domain, platform }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Failed to create project (${res.status}): ${
            text || res.statusText
          }`
        );
      }

      const data = await res.json();
      const project = data.project || data;

      localStorage.setItem("auraProjectId", project.id);
      localStorage.setItem("auraProjectName", project.name);
      localStorage.setItem("auraProjectDomain", project.domain);
      localStorage.setItem("auraPlatform", project.platform);

      onConnected(project);
    } catch (err) {
      setError(err.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-setup-screen">
      <div className="project-setup-card">
        <h1>Connect your store</h1>
        <p className="subtitle">
          AURA works with Shopify and all other ecommerce platforms.
          For non-Shopify stores, you’ll paste product details manually into
          the SEO tools.
        </p>

        <form onSubmit={handleSubmit} className="project-setup-form">
          <label>
            Project / Brand name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. DTP Jewellery"
            />
          </label>

          <label>
            Storefront domain
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              required
              placeholder="e.g. dtpjewellery.com"
            />
          </label>

          <label>
            Platform
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="other">Other / Manual (default)</option>
              <option value="shopify" disabled>
                Shopify (coming soon)
              </option>
              <option value="woocommerce" disabled>
                WooCommerce (coming soon)
              </option>
              <option value="etsy" disabled>
                Etsy (coming soon)
              </option>
            </select>
          </label>

          {error && (
            <div className="error-banner">
              <span className="error-dot" />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="button button--primary"
            disabled={loading}
          >
            {loading ? "Connecting…" : "Connect Store"}
          </button>
        </form>
      </div>
    </div>
  );
}
