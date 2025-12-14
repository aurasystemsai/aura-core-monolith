// src/ProjectSetup.jsx
import React, { useState } from "react";
import "./App.css";

/**
 * Props:
 *  - coreUrl: string (Core API base URL)
 *  - onConnected: (project) => void
 */
function ProjectSetup({ coreUrl, onConnected }) {
  const [projectName, setProjectName] = useState("aura");
  const [domain, setDomain] = useState("https://aurasystemsai.com");
  const [platform, setPlatform] = useState("other");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const validate = () => {
    if (!projectName.trim()) {
      return "Project / Brand name is required.";
    }
    if (!domain.trim()) {
      return "Storefront domain is required.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${coreUrl}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectName.trim(),
          domain: domain.trim(),
          platform,
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        // Render often returns HTML "Cannot POST /projects" for wrong routes
        throw new Error(text || `Failed to create project (${res.status})`);
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        // If Core returns plain text, fallback to minimal object
        data = {};
      }

      const project = {
        id: data.id || data.projectId || projectName.trim(),
        name: data.name || projectName.trim(),
        domain: data.domain || domain.trim(),
        platform: data.platform || platform,
      };

      // Persist locally so the console can auto-restore
      localStorage.setItem("auraProjectId", project.id);
      localStorage.setItem("auraProjectName", project.name);
      localStorage.setItem("auraProjectDomain", project.domain);
      localStorage.setItem("auraPlatform", project.platform);

      onConnected(project);
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
          "Failed to connect your store. Check the Core API URL and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="project-setup-screen">
      <div className="project-setup-card">
        <div className="side-nav-eyebrow" style={{ marginBottom: 4 }}>
          AURA SYSTEMS AI
        </div>
        <h1>Connect your store</h1>
        <p className="subtitle">
          AURA works with Shopify and all other ecommerce platforms. For
          non-Shopify stores, you&apos;ll paste product details manually into
          the SEO tools.
        </p>

        <form className="project-setup-form" onSubmit={handleSubmit}>
          <label>
            Project / Brand name
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. DTP Jewellery"
            />
          </label>

          <label>
            Storefront domain
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. https://dtpjewellry.com"
            />
          </label>

          <label>
            Platform
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="other">Other / Manual (default)</option>
              <option value="shopify">Shopify</option>
              <option value="woocommerce">WooCommerce</option>
              <option value="bigcommerce">BigCommerce</option>
            </select>
          </label>

          {error && (
            <div className="error-banner" style={{ marginTop: 2 }}>
              <span className="error-dot" />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="button button--primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Connecting…" : "Connect Store"}
          </button>

          <div
            style={{
              fontSize: 11,
              color: "#9ca3af",
              marginTop: 6,
              lineHeight: 1.45,
            }}
          >
            We store your project ID, domain and platform in your browser so you
            do not have to reconnect every time. No passwords are stored here.
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectSetup;
