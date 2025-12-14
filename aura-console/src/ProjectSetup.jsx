// aura-console/src/ProjectSetup.jsx
// -----------------------------------------
// "Connect store" onboarding screen
// Talks directly to Core /projects API
// -----------------------------------------

import React, { useState } from "react";

function ProjectSetup({ coreUrl, onConnected }) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [platform, setPlatform] = useState("shopify");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !domain.trim()) {
      setError("Store name and domain are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${coreUrl}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          domain: domain.trim(),
          platform: platform || "other",
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          text || `Core API returned ${res.status} creating project`
        );
      }

      const data = await res.json();
      if (!data.ok || !data.project) {
        throw new Error("Core API did not return a project object.");
      }

      const project = data.project;

      // Persist to localStorage so App.jsx can rehydrate on reload
      localStorage.setItem("auraProjectId", project.id);
      localStorage.setItem("auraProjectName", project.name || "");
      localStorage.setItem("auraProjectDomain", project.domain || "");
      localStorage.setItem("auraPlatform", project.platform || "other");

      // Hand back to App so it can show the main console
      if (onConnected) {
        onConnected(project);
      }
    } catch (err) {
      console.error("[Console] Failed to create project", err);
      setError(
        err.message ||
          "Failed to connect your store. Check Core API URL and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-setup-screen">
      <div className="project-setup-card">
        <h1>Connect your first project</h1>
        <p className="subtitle">
          A project is usually a single store or domain (for example your
          Shopify brand). You can add more later and switch between them in the
          sidebar.
        </p>

        <form className="project-setup-form" onSubmit={handleSubmit}>
          <label>
            Store / brand name
            <input
              type="text"
              placeholder="DTP Jewellery"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label>
            Main domain
            <input
              type="text"
              placeholder="dtpjewellry.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
          </label>

          <label>
            Platform
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="shopify">Shopify</option>
              <option value="woocommerce">WooCommerce</option>
              <option value="framer">Framer</option>
              <option value="custom">Custom stack</option>
              <option value="other">Other</option>
            </select>
          </label>

          {error && (
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                color: "#fecaca",
                padding: "6px 8px",
                borderRadius: 8,
                border: "1px solid rgba(248,113,113,0.7)",
                background: "rgba(127,29,29,0.9)",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="button button--primary"
            disabled={loading}
          >
            {loading ? "Connecting…" : "Connect store"}
          </button>

          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              color: "#9ca3af",
              lineHeight: 1.4,
            }}
          >
            We store projects in AURA’s Core database, not just your browser.
            Once connected, the SEO Command Centre will run Product SEO against
            this project.
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectSetup;
