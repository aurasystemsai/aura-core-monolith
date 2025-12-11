// aura-console/src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import toolsMeta from "./toolMeta";

const DEFAULT_BASE_URL =
  import.meta.env.VITE_CORE_API_BASE_URL ||
  "https://aura-core-monolith.onrender.com";

function safePrettyJson(value) {
  try {
    if (typeof value === "string") {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    }
    return JSON.stringify(value, null, 2);
  } catch {
    return value;
  }
}

function App() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [baseUrlInput, setBaseUrlInput] = useState(DEFAULT_BASE_URL);

  const [coreStatus, setCoreStatus] = useState({
    loading: false,
    online: false,
    env: null,
    toolsCount: null,
    error: null,
  });

  const [selectedToolId, setSelectedToolId] = useState(
    toolsMeta[0]?.id || null
  );

  const [requestJson, setRequestJson] = useState("// Request JSON here");
  const [responseJson, setResponseJson] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState(null);

  // ------------------------------------------------
  // Derived values
  // ------------------------------------------------
  const selectedTool = useMemo(
    () => toolsMeta.find((t) => t.id === selectedToolId) || null,
    [selectedToolId]
  );

  const normalisedBaseUrl = useMemo(
    () => baseUrl.replace(/\/$/, ""),
    [baseUrl]
  );

  // ------------------------------------------------
  // Core health check
  // ------------------------------------------------
  async function fetchCoreHealth(activeBaseUrl) {
    const url = activeBaseUrl.replace(/\/$/, "");

    setCoreStatus((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(`${url}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Core API responded with ${res.status}`);
      }

      const data = await res.json();

      setCoreStatus({
        loading: false,
        online: Boolean(data.ok),
        env: data.env || data.environment || "unknown",
        toolsCount: data.tools ?? null,
        error: null,
      });
    } catch (err) {
      setCoreStatus({
        loading: false,
        online: false,
        env: null,
        toolsCount: null,
        error: err.message || "Unable to reach Core API",
      });
    }
  }

  useEffect(() => {
    // persist base URL so it sticks if user edits it
    window.localStorage.setItem("AURA_CORE_BASE_URL", baseUrl);
    fetchCoreHealth(baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    const stored = window.localStorage.getItem("AURA_CORE_BASE_URL");
    if (stored && stored !== baseUrl) {
      setBaseUrl(stored);
      setBaseUrlInput(stored);
    }
  }, []); // run once on mount

  // ------------------------------------------------
  // Event handlers
  // ------------------------------------------------
  function handleBaseUrlBlur() {
    if (!baseUrlInput.trim()) return;
    setBaseUrl(baseUrlInput.trim());
  }

  function handleBaseUrlKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBaseUrlBlur();
    }
  }

  function handleRefreshCore() {
    fetchCoreHealth(baseUrl);
  }

  function setExampleForTool(tool) {
    if (!tool) return;

    // try example payloads from metadata if present
    const example =
      tool.exampleInput ||
      tool.example ||
      tool.examples?.[0] ||
      {
        productTitle: "Waterproof layered necklace",
        brand: "DTP Jewellry",
      };

    setRequestJson(safePrettyJson(example));
    setResponseJson("");
    setRunError(null);
  }

  function handleSelectTool(toolId) {
    setSelectedToolId(toolId);
    const tool = toolsMeta.find((t) => t.id === toolId);
    setExampleForTool(tool);
  }

  function handleLoadExample() {
    if (!selectedTool) return;
    setExampleForTool(selectedTool);
  }

  async function handleRunTool() {
    if (!selectedTool || !requestJson) return;

    setIsRunning(true);
    setRunError(null);
    setResponseJson("");

    try {
      let parsedInput;
      try {
        parsedInput = JSON.parse(requestJson);
      } catch (err) {
        throw new Error("Request JSON is not valid JSON.");
      }

      const res = await fetch(
        `${normalisedBaseUrl}/run/${encodeURIComponent(selectedTool.id)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(parsedInput),
        }
      );

      const text = await res.text();
      let parsed;

      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { raw: text };
      }

      if (!res.ok || parsed.ok === false) {
        const msg =
          parsed.error ||
          parsed.message ||
          `Core API returned status ${res.status}`;
        setRunError(msg);
      }

      setResponseJson(safePrettyJson(parsed));
    } catch (err) {
      setRunError(err.message || "Unexpected error while running the tool.");
    } finally {
      setIsRunning(false);
    }
  }

  // ------------------------------------------------
  // Render helpers
  // ------------------------------------------------
  function renderCoreStatusPill() {
    if (coreStatus.loading) {
      return (
        <span className="core-pill core-pill-loading">
          <span className="core-dot core-dot-loading" />
          Checking Core API…
        </span>
      );
    }

    if (!coreStatus.online) {
      return (
        <span className="core-pill core-pill-offline">
          <span className="core-dot core-dot-offline" />
          Core API offline
        </span>
      );
    }

    return (
      <span className="core-pill core-pill-online">
        <span className="core-dot core-dot-online" />
        Core API online
        {coreStatus.env && (
          <>
            <span className="core-pill-divider">•</span>
            <span className="core-pill-tag">env={coreStatus.env}</span>
          </>
        )}
        {coreStatus.toolsCount != null && (
          <>
            <span className="core-pill-divider">•</span>
            <span className="core-pill-tag">
              tools={coreStatus.toolsCount}
            </span>
          </>
        )}
      </span>
    );
  }

  return (
    <div className="app-root">
      {/* Top nav */}
      <header className="app-header">
        <div className="brand-block">
          <div className="brand-avatar">A</div>
          <div className="brand-meta">
            <div className="brand-name">AURA SYSTEMS</div>
            <div className="brand-subtitle">
              Automation Console · Live Core API
            </div>
          </div>
        </div>

        <div className="core-controls">
          <div className="core-base-url">
            <label className="core-base-url-label">Core API</label>
            <input
              className="core-base-url-input"
              value={baseUrlInput}
              onChange={(e) => setBaseUrlInput(e.target.value)}
              onBlur={handleBaseUrlBlur}
              onKeyDown={handleBaseUrlKeyDown}
              spellCheck="false"
            />
            <button
              type="button"
              className="btn btn-soft core-refresh"
              onClick={handleRefreshCore}
            >
              Refresh
            </button>
          </div>

          {renderCoreStatusPill()}
        </div>
      </header>

      {/* Main content */}
      <main className="app-main">
        {/* Sidebar with tools */}
        <aside className="tools-sidebar">
          <div className="tools-sidebar-header">
            <h2 className="tools-title">Tools</h2>
            <p className="tools-subtitle">
              Search by name, id, tag or category.
            </p>
          </div>

          <div className="tools-list">
            {toolsMeta.map((tool) => {
              const active = tool.id === selectedToolId;
              return (
                <button
                  key={tool.id}
                  type="button"
                  className={
                    "tool-card" + (active ? " tool-card-active" : "")
                  }
                  onClick={() => handleSelectTool(tool.id)}
                >
                  <div className="tool-card-top">
                    <div className="tool-card-name">{tool.name}</div>
                    {tool.tag && (
                      <span className="pill pill-soft pill-small">
                        {tool.tag}
                      </span>
                    )}
                  </div>
                  <div className="tool-card-description">
                    {tool.description}
                  </div>
                  <div className="tool-card-meta">
                    <span className="pill pill-outline pill-small">
                      id: {tool.id}
                    </span>
                    {tool.category && (
                      <span className="pill pill-outline pill-small">
                        {tool.category}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Tool workbench */}
        <section className="tool-main">
          {/* Header row with title + actions */}
          <div className="tool-layout-header">
            <div className="tool-layout-header-left">
              <h2 className="tool-title">
                {selectedTool
                  ? selectedTool.name
                  : "Select a tool to begin"}
              </h2>
              {selectedTool && (
                <div className="tool-meta-inline">
                  <span className="pill pill-soft pill-small">
                    id: {selectedTool.id}
                  </span>
                  {selectedTool.category && (
                    <span className="pill pill-soft pill-small">
                      {selectedTool.category}
                    </span>
                  )}
                  {selectedTool.tag && (
                    <span className="pill pill-soft pill-small">
                      {selectedTool.tag}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="tool-layout-header-right">
              <button
                type="button"
                className="btn btn-soft"
                onClick={handleLoadExample}
                disabled={!selectedTool}
              >
                Load example payload
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRunTool}
                disabled={!selectedTool || isRunning}
              >
                {isRunning ? "Running…" : "Run tool"}
              </button>
            </div>
          </div>

          {/* Two JSON panels */}
          <div className="tool-layout-columns">
            {/* Request JSON */}
            <div className="json-card">
              <div className="json-card-header">
                <span className="pill pill-soft">Request JSON</span>
                <span className="json-note">
                  Must be valid JSON. We send this as the tool input.
                </span>
              </div>
              <textarea
                className="json-editor"
                value={requestJson}
                onChange={(e) => setRequestJson(e.target.value)}
                spellCheck="false"
              />
            </div>

            {/* Response JSON */}
            <div className="json-card">
              <div className="json-card-header">
                <span className="pill pill-soft">Core API response</span>
                {selectedTool && (
                  <span className="json-note">
                    Raw response from /run/{selectedTool.id}
                  </span>
                )}
              </div>
              <pre className="json-output">
                {responseJson ||
                  "// Run the tool to see the response here."}
              </pre>
              {runError && (
                <div className="run-error">
                  <span className="run-error-label">Error:</span>{" "}
                  {runError}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
