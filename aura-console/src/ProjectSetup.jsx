// src/ProjectSetup.jsx
import React, { useState } from "react";

const PLATFORMS = [
  { value: "other", label: "Other / Manual (default)" },
  { value: "shopify", label: "Shopify" },
  { value: "woocommerce", label: "WooCommerce" },
];

function ProjectSetup({ coreUrl, onConnected }) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [platform, setPlatform] = useState("other");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const body = {
        name: name.trim() || "aura",
        domain: domain.trim(),
        platform,
      };

      const res = await fetch(`${coreUrl}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          text || `Failed to create project (status ${res.status})`
        );
      }

      const data = await res.json();

      const project = {
        id: data.id,
        name: data.name || body.name,
        domain: data.domain || body.domain,
        platform: data.platform || body.platform,
      };

      // Persist for auto-reconnect in the console
      localStorage.setItem("auraProjectId", project.id);
      localStorage.setItem("auraProjectName", project.name);
      localStorage.setItem("auraProjectDomain", project.domain);
      localStorage.setItem("auraPlatform", project.platform);

      onConnected(project);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="project-setup-screen">
      <div className="project-setup-card">
        <div className="side-nav-eyebrow">AURA SYSTEMS AI</div>
        <h1>Connect your store</h1>
        <p className="subtitle">
          AURA works with Shopify and all other ecommerce platforms. For
          non-Shopify stores, you’ll paste product details manually into the SEO
          tools.
        </p>

        <form className="project-setup-form" onSubmit={handleSubmit}>
          <label>
            <span>Project / Brand name</span>
            <input
              type="text"
              placeholder="e.g. DTP Jewellery"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label>
            <span>Storefront domain</span>
            <input
              type="text"
              placeholder="e.g. dtpjewellry.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
          </label>

          <label>
            <span>Platform</span>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          {error && (
            <div className="error-banner">
              <span className="error-dot" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="button button--primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Connecting…" : "Connect Store"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProjectSetup;
