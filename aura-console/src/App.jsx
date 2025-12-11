// aura-console/src/App.jsx
// =============================================================
// AURA Systems • Automation Console (Glass UI)
// - Run and test AURA tools directly on the Core API
// - Neon glass / dark theme, responsive layout
// =============================================================

import React, { useEffect, useMemo, useState } from "react";
import { TOOLS_METADATA } from "./core/tools-metadata";
import "./App.css";

const DEFAULT_CORE_API_BASE_URL =
  import.meta.env.VITE_CORE_API_BASE_URL ||
  "https://aura-core-monolith.onrender.com";

function App() {
  // ---------- Core API base URL ----------
  const [coreApiBaseUrl, setCoreApiBaseUrl] = useState(
    DEFAULT_CORE_API_BASE_URL
  );

  // ---------- Health / status ----------
  const [healthStatus, setHealthStatus] = useState({
    loading: false,
    ok: false,
    env: null,
    tools: null,
    error: null,
    lastChecked: null,
  });

  // ---------- Tools & selection ----------
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTagFilter, setActiveTagFilter] = useState("All tools");
  const [selectedToolId, setSelectedToolId] = useState(
    TOOLS_METADATA[0]?.id || null
  );

  // ---------- Request / response JSON ----------
  const [requestJson, setRequestJson] = useState("");
  const [responseJson, setResponseJson] = useState("// Run the tool to see the response here.");
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState(null);

  const selectedTool = useMemo(
    () => TOOLS_METADATA.find((t) => t.id === selectedToolId) || null,
    [selectedToolId]
  );

  // Precompute unique tag filters
  const tagFilters = useMemo(() => {
    const tags = new Set(["All tools"]);
    TOOLS_METADATA.forEach((t) => {
      if (t.tag) tags.add(t.tag);
      if (t.category) tags.add(t.category);
    });
    return Array.from(tags);
  }, []);

  // Filtered tools for left column
  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return TOOLS_METADATA.filter((tool) => {
      const matchesSearch =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.id.toLowerCase().includes(q) ||
        (tool.description || "").toLowerCase().includes(q) ||
        (tool.category || "").toLowerCase().includes(q) ||
        (tool.tag || "").toLowerCase().includes(q);

      const matchesTag =
        activeTagFilter === "All tools" ||
        tool.tag === activeTagFilter ||
        tool.category === activeTagFilter;

      return matchesSearch && matchesTag;
    });
  }, [searchQuery, activeTagFilter]);

  // ---------- Health check ----------
  const normalizedBaseUrl = useMemo(
    () => coreApiBaseUrl.replace(/\/+$/, ""),
    [coreApiBaseUrl]
  );

  async function checkHealth() {
    setHealthStatus((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const res = await fetch(`${normalizedBaseUrl}/health`, {
        method: "GET",
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} while calling /health`);
      }

      const json = await res.json();

      setHealthStatus({
        loading: false,
        ok: !!json.ok,
        env: json.env || json.environment || null,
        tools: json.tools || json.count || null,
        error: null,
        lastChecked: new Date(),
      });
    } catch (err) {
      console.error("Core API health error:", err);
      setHealthStatus({
        loading: false,
        ok: false,
        env: null,
        tools: null,
        error: err.message || "Failed to reach Core API.",
        lastChecked: new Date(),
      });
    }
  }

  useEffect(() => {
    checkHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedBaseUrl]);

  // ---------- Tool run ----------
  function loadExamplePayload() {
    if (!selectedTool) return;

    const example = selectedTool.examplePayload || {};
    setRequestJson(JSON.stringify(example, null, 2));
    setRunError(null);
  }

  async function runTool() {
    if (!selectedTool) return;
    setIsRunning(true);
    setRunError(null);

    let parsedInput = {};
    const trimmed = requestJson.trim();

    try {
      parsedInput = trimmed ? JSON.parse(trimmed) : {};
    } catch (err) {
      setRunError("Request JSON is not valid JSON. Please fix and try again.");
      setIsRunning(false);
      return;
    }

    try {
      const res = await fetch(
        `${normalizedBaseUrl}/run/${encodeURIComponent(selectedTool.id)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(parsedInput),
        }
      );

      const text = await res.text();
      let json;

      try {
        json = JSON.parse(text);
      } catch {
        json = { raw: text };
      }

      if (!res.ok || json.ok === false) {
        setRunError(
          json.error ||
            `Core API responded with HTTP ${res.status}. See response JSON.`
        );
      } else {
        setRunError(null);
      }

      setResponseJson(JSON.stringify(json, null, 2));
    } catch (err) {
      console.error("Run tool error:", err);
      setRunError(err.message || "Failed to call Core API.");
      setResponseJson(
        JSON.stringify(
          {
            ok: false,
            error: err.message || "Failed to call Core API.",
          },
          null,
          2
        )
      );
    } finally {
      setIsRunning(false);
    }
  }

  // ---------- Render ----------
  const apiStatusLabel = healthStatus.loading
    ? "Checking..."
    : healthStatus.ok
    ? "Core API online"
    : "Core API offline";

  const apiStatusDotClass = healthStatus.loading
    ? "status-dot status-dot--pending"
    : healthStatus.ok
    ? "status-dot status-dot--ok"
    : "status-dot status-dot--error";

  return (
    <div className="app-root">
      {/* Glow background */}
      <div className="app-glow app-glow--left" />
      <div className="app-glow app-glow--right" />

      {/* Shell */}
      <div className="app-shell">
        {/* Header */}
        <header className="app-header">
          <div className="brand-block">
            <div className="brand-mark">A</div>
            <div className="brand-text">
              <div className="brand-title">AURA SYSTEMS</div>
              <div className="brand-subtitle">
                Automation Console · Live Core API
              </div>
            </div>
          </div>

          <div className="core-panel">
            <div className="core-panel-row">
              <span className={apiStatusDotClass} />
              <span className="core-panel-status">{apiStatusLabel}</span>
              {healthStatus.env && (
                <span className="core-panel-pill">
                  env=<strong>{healthStatus.env}</strong>
                </span>
              )}
              {typeof healthStatus.tools === "number" && (
                <span className="core-panel-pill">
                  tools=<strong>{healthStatus.tools}</strong>
                </span>
              )}
            </div>

            <div className="core-panel-row core-panel-row--input">
              <input
                className="core-url-input"
                value={coreApiBaseUrl}
                onChange={(e) => setCoreApiBaseUrl(e.target.value)}
                spellCheck={false}
              />
              <button
                type="button"
                className="btn btn--ghost"
                onClick={checkHealth}
                disabled={healthStatus.loading}
              >
                Refresh
              </button>
            </div>

            {healthStatus.error && (
              <div className="core-panel-error">
                {healthStatus.error}
              </div>
            )}
          </div>
        </header>

        {/* Main layout */}
        <main className="app-main">
          {/* Tools column */}
          <aside className="tools-column">
            <div className="tools-column-inner glass-card">
              <div className="tools-header">
                <div className="tools-header-title">Tools</div>
                <div className="tools-header-subtitle">
                  Search by name, id, tag or category.
                </div>
              </div>

              <div className="tools-search-row">
                <input
                  className="tools-search-input"
                  placeholder="Search by name, id or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="tools-filter-row">
                {tagFilters.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={
                      "chip" +
                      (activeTagFilter === tag ? " chip--active" : "")
                    }
                    onClick={() => setActiveTagFilter(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="tools-list">
                {filteredTools.map((tool) => {
                  const isActive = tool.id === selectedToolId;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      className={
                        "tool-card" + (isActive ? " tool-card--active" : "")
                      }
                      onClick={() => {
                        setSelectedToolId(tool.id);
                        setRunError(null);
                        setResponseJson(
                          "// Run the tool to see the response here."
                        );
                        // Do not auto overwrite requestJson; user may be editing
                      }}
                    >
                      <div className="tool-card-top">
                        <div className="tool-card-title">{tool.name}</div>
                        <span className="tool-card-pill">
                          {tool.category || "Tool"}
                        </span>
                      </div>
                      <div className="tool-card-description">
                        {tool.description}
                      </div>
                      <div className="tool-card-meta">
                        <span className="tool-card-meta-id">
                          id: {tool.id}
                        </span>
                        {tool.tag && (
                          <span className="tool-card-meta-tag">
                            {tool.tag}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}

                {filteredTools.length === 0 && (
                  <div className="tools-empty">
                    No tools match that search.  
                    Try clearing filters or changing your query.
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Workbench */}
          <section className="workbench">
            <div className="workbench-inner glass-card">
              {!selectedTool ? (
                <div className="workbench-empty">
                  <div className="workbench-empty-title">
                    Select a tool to begin
                  </div>
                  <div className="workbench-empty-subtitle">
                    Choose a tool from the left sidebar to view its description,
                    load an example payload and run it against the Core API.
                  </div>
                </div>
              ) : (
                <>
                  {/* Tool header */}
                  <div className="workbench-header">
                    <div className="workbench-title-block">
                      <div className="workbench-eyebrow">
                        {selectedTool.category || "Tool"}
                      </div>
                      <h1 className="workbench-title">
                        {selectedTool.name}
                      </h1>
                      <p className="workbench-subtitle">
                        {selectedTool.description}
                      </p>
                    </div>
                    <div className="workbench-meta">
                      <div className="workbench-meta-row">
                        <span className="meta-label">Tool id</span>
                        <span className="meta-value">{selectedTool.id}</span>
                      </div>
                      {selectedTool.tag && (
                        <div className="workbench-meta-row">
                          <span className="meta-label">Tag</span>
                          <span className="meta-value">{selectedTool.tag}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Editors */}
                  <div className="workbench-grid">
                    <div className="panel">
                      <div className="panel-header">
                        <div className="panel-title">Request JSON</div>
                        <div className="panel-caption">
                          Must be valid JSON. We send this as the tool input.
                        </div>
                      </div>
                      <textarea
                        className="panel-editor"
                        value={requestJson}
                        onChange={(e) => setRequestJson(e.target.value)}
                        spellCheck={false}
                        placeholder={`// Paste or write JSON payload for "${selectedTool.name}" here.\n// Or click "Load example payload" below to start from a template.`}
                      />
                    </div>

                    <div className="panel">
                      <div className="panel-header">
                        <div className="panel-title">Core API response</div>
                        <div className="panel-caption">
                          Raw response from{" "}
                          <code>/run/{selectedTool.id}</code>
                        </div>
                      </div>
                      <pre className="panel-output">
                        {responseJson}
                      </pre>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="workbench-actions">
                    <div className="workbench-actions-left">
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={loadExamplePayload}
                      >
                        Load example payload
                      </button>
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={runTool}
                        disabled={isRunning || !healthStatus.ok}
                      >
                        {isRunning ? "Running…" : "Run tool"}
                      </button>
                    </div>
                    <div className="workbench-actions-right">
                      {runError && (
                        <div className="run-status run-status--error">
                          {runError}
                        </div>
                      )}
                      {!runError && isRunning && (
                        <div className="run-status run-status--pending">
                          Calling Core API…
                        </div>
                      )}
                      {!runError && !isRunning && healthStatus.ok && (
                        <div className="run-status run-status--ok">
                          Ready. Results will appear on the right.
                        </div>
                      )}
                      {!runError && !isRunning && !healthStatus.ok && (
                        <div className="run-status run-status--error">
                          Core API is offline or unreachable.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
