// aura-console/src/ProjectSetup.jsx
// -----------------------------------------
// "Connect store" onboarding screen
// Talks directly to Core /projects API
// -----------------------------------------

import React, { useState } from "react";

// Helper to get query param from URL
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function ProjectSetup({ coreUrl, onConnected }) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [platform, setPlatform] = useState("shopify");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shopifyDomain, setShopifyDomain] = useState("");
  const [shopifyLoading, setShopifyLoading] = useState(false);
  // Handle Shopify OAuth redirect
  React.useEffect(() => {
    const shop = getQueryParam("shop");
    const projectId = getQueryParam("projectId");
    const projectName = getQueryParam("projectName");
    const projectDomain = getQueryParam("projectDomain");
    const platform = getQueryParam("platform");
    if (shop && projectId) {
      // Persist to localStorage
      localStorage.setItem("auraProjectId", projectId);
      localStorage.setItem("auraProjectName", projectName || shop);
      localStorage.setItem("auraProjectDomain", projectDomain || shop);
      localStorage.setItem("auraPlatform", platform || "shopify");
      if (onConnected) {
        onConnected({
          id: projectId,
          name: projectName || shop,
          domain: projectDomain || shop,
          platform: platform || "shopify",
        });
      }
    }
  }, [onConnected]);
  // Start Shopify OAuth flow
  const handleShopifyConnect = async (e) => {
    e.preventDefault();
    setError(null);
    if (!shopifyDomain.trim()) {
      setError("Enter your Shopify store domain (e.g. mystore.myshopify.com)");
      return;
    }
    setShopifyLoading(true);
    // Redirect to backend OAuth endpoint
    const url = `${coreUrl.replace(/\/$/, "")}/api/auth?shop=${encodeURIComponent(shopifyDomain.trim())}`;
    window.location.href = url;
  };

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
                    <div style={{ marginBottom: 16, marginTop: 8 }}>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>Or connect with Shopify:</div>
                      <form onSubmit={handleShopifyConnect} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          type="text"
                          placeholder="yourstore.myshopify.com"
                          value={shopifyDomain}
                          onChange={e => setShopifyDomain(e.target.value)}
                          style={{ flex: 1 }}
                          disabled={shopifyLoading}
                        />
                        <button
                          type="submit"
                          className="button button--primary"
                          disabled={shopifyLoading}
                        >
                          {shopifyLoading ? "Redirecting…" : "Connect with Shopify"}
                        </button>
                      </form>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                        You’ll be redirected to Shopify to approve the app.
                      </div>
                    </div>
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
            style={{ marginTop: 8 }}
          >
            {loading ? "Connecting…" : "Connect store manually"}
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
