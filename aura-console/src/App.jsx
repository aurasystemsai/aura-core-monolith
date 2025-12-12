import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import toolsMeta from "./toolMeta";


const DEFAULT_CORE_API = "https://aura-core-monolith.onrender.com";

function App() {
  const [coreApiBaseUrl, setCoreApiBaseUrl] = useState(DEFAULT_CORE_API);
  const [coreHealth, setCoreHealth] = useState({
    loading: true,
    ok: false,
    env: null,
    tools: null,
    error: null,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const [selectedToolId, setSelectedToolId] = useState(
    toolsMeta[0]?.id || null
  );
  const [requestJson, setRequestJson] = useState("");
  const [responseJson, setResponseJson] = useState(
    "// Run the tool to see the response here."
  );

  const [isRunning, setIsRunning] = useState(false);
  const [runStatus, setRunStatus] = useState("idle"); // idle | running | ok | error

  // ---- Derive current tool ----
  const selectedTool = useMemo(
    () => toolsMeta.find((t) => t.id === selectedToolId) || null,
    [selectedToolId]
  );

  // ---- Category filters shown as chips ----
  const CATEGORY_FILTERS = [
    { id: "all", label: "All tools" },
    { id: "SEO", label: "SEO" },
    { id: "CRO / Social Proof", label: "CRO / Social Proof" },
    { id: "Ops / Finance", label: "Ops / Finance" },
    { id: "Email / Flows", label: "Email / Flows" },
    { id: "Support", label: "Support" },
    { id: "Developers", label: "Developers" },
  ];

  // ---- Filter tools from meta ----
  const filteredTools = useMemo(() => {
    return toolsMeta.filter((tool) => {
      const matchesSearch =
        !searchQuery.trim() ||
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tool.category &&
          tool.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        activeCategory === "all" ||
        (tool.tags && tool.tags.includes(activeCategory));

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  // ---- Load example payload whenever tool changes ----
  useEffect(() => {
    if (!selectedTool) return;

    const example =
      selectedTool.exampleInput ||
      selectedTool.sampleInput ||
      selectedTool.example ||
      null;

    if (!example) {
      setRequestJson("{\n  \n}");
      return;
    }

    if (typeof example === "string") {
      setRequestJson(example);
    } else {
      setRequestJson(JSON.stringify(example, null, 2));
    }

    setResponseJson("// Run the tool to see the response here.");
    setRunStatus("idle");
  }, [selectedTool]);

  // ---- Ping /health whenever base URL changes ----
  useEffect(() => {
    const controller = new AbortController();

    async function checkHealth() {
      setCoreHealth((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const res = await fetch(
          `${coreApiBaseUrl.replace(/\/$/, "")}/health`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `HTTP ${res.status} while calling /health: ${text || "no body"}`
          );
        }
        const data = await res.json();
        setCoreHealth({
          loading: false,
          ok: Boolean(data.ok),
          env: data.env || "unknown",
          tools: data.tools ?? null,
          error: null,
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        setCoreHealth({
          loading: false,
          ok: false,
          env: null,
          tools: null,
          error: err.message || "Unable to reach Core API",
        });
      }
    }

    checkHealth();
    return () => controller.abort();
  }, [coreApiBaseUrl]);

  // ---- Handlers ----

  const handleCoreUrlChange = (e) => {
    setCoreApiBaseUrl(e.target.value);
  };

  const handleRefreshHealth = () => {
    // Force re-run of useEffect by tweaking the URL to trimmed version
    setCoreApiBaseUrl((prev) => prev.trim());
  };

  const handleSelectTool = (toolId) => {
    setSelectedToolId(toolId);
  };

  const handleLoadExample = () => {
    if (!selectedTool) return;

    const example =
      selectedTool.exampleInput ||
      selectedTool.sampleInput ||
      selectedTool.example ||
      null;

    if (!example) {
      setRequestJson("{\n  \n}");
      return;
    }

    if (typeof example === "string") {
      setRequestJson(example);
    } else {
      setRequestJson(JSON.stringify(example, null, 2));
    }

    setResponseJson("// Run the tool to see the response here.");
    setRunStatus("idle");
  };

  const handleRunTool = async () => {
    if (!selectedTool || !coreApiBaseUrl) return;

    let parsedBody;
    try {
      parsedBody = requestJson.trim()
        ? JSON.parse(requestJson)
        : {};
    } catch (err) {
      setRunStatus("error");
      setResponseJson(
        JSON.stringify(
          { ok: false, error: `Invalid JSON: ${err.message}` },
          null,
          2
        )
      );
      return;
    }

    setIsRunning(true);
    setRunStatus("running");

    try {
      const res = await fetch(
        `${coreApiBaseUrl.replace(/\/$/, "")}/run/${selectedTool.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedBody),
        }
      );

      const text = await res.text();
      let data = text;
      try {
        data = JSON.parse(text);
      } catch {
        // keep raw text if it isn't JSON
      }

      const ok =
        res.ok &&
        typeof data === "object" &&
        data !== null
          ? data.ok !== false
          : res.ok;

      setRunStatus(ok ? "ok" : "error");
      setResponseJson(
        typeof data === "string"
          ? data
          : JSON.stringify(data, null, 2)
      );
    } catch (err) {
      setRunStatus("error");
      setResponseJson(
        JSON.stringify(
          { ok: false, error: err.message || "Request failed" },
          null,
          2
        )
      );
    } finally {
      setIsRunning(false);
    }
  };

  // ---- Helpers for UI bits ----

  const renderCoreStatusLabel = () => {
    if (coreHealth.loading) return "Checking Core API…";
    if (!coreHealth.ok) return "Core API offline";
    const env =
      coreHealth.env === "production" ? "production" : coreHealth.env || "env";
    const toolCount =
      typeof coreHealth.tools === "number"
        ? `tools=${coreHealth.tools}`
        : "";
    return `Core API online · ${env}${toolCount ? ` · ${toolCount}` : ""}`;
  };

  return (
    <div className="app-shell">
      {/* HEADER */}
      <header className="app-header">
        <div className="app-header-left">
          <div className="brand-mark">A</div>
          <div className="brand-copy">
            <div className="brand-name">AURA SYSTEMS</div>
            <div className="brand-subtitle">
              Automation Console · Live Core API
            </div>
          </div>
        </div>

        <div className="app-header-right">
          <div className="core-url-input">
            <label className="label">Core API</label>
            <div className="core-url-row">
              <input
                type="text"
                value={coreApiBaseUrl}
                onChange={handleCoreUrlChange}
                className="core-url-field"
                spellCheck="false"
              />
              <button
                type="button"
                className="button button--ghost"
                onClick={handleRefreshHealth}
              >
                Refresh
              </button>
            </div>
          </div>

          <div
            className={`core-status-chip ${
              coreHealth.loading
                ? "core-status-chip--loading"
                : coreHealth.ok
                ? "core-status-chip--ok"
                : "core-status-chip--error"
            }`}
          >
            <span className="core-status-indicator" />
            <span className="core-status-label">
              {renderCoreStatusLabel()}
            </span>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="console-layout">
        {/* LEFT: TOOL LIST */}
        <aside className="tools-pane">
          <div className="tools-pane-header">
            <div className="tools-title-row">
              <h2 className="section-title">Tools</h2>
            </div>
            <input
              type="text"
              placeholder="Search by name, id or tag…"
              className="tools-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="filter-chips">
              {CATEGORY_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`chip ${
                    activeCategory === filter.id ? "chip--active" : ""
                  }`}
                  onClick={() => setActiveCategory(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="tools-list">
            {filteredTools.map((tool) => {
              const isActive = tool.id === selectedToolId;
              return (
                <button
                  key={tool.id}
                  type="button"
                  className={`tool-card ${
                    isActive ? "tool-card--active" : ""
                  }`}
                  onClick={() => handleSelectTool(tool.id)}
                >
                  <div className="tool-card-header">
                    <div className="tool-name">{tool.name}</div>
                    {tool.primaryTag && (
                      <span className="tool-tag">{tool.primaryTag}</span>
                    )}
                  </div>
                  {tool.description && (
                    <p className="tool-description">{tool.description}</p>
                  )}
                  <div className="tool-meta-row">
                    <span className="tool-id">id: {tool.id}</span>
                    {tool.category && (
                      <span className="tool-category">{tool.category}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* RIGHT: RUN TOOL */}
        <section className="tool-runner">
          {/* Tool overview + toolbar */}
          <div className="tool-runner-header">
            <div className="tool-summary">
              <div className="tool-summary-eyebrow">
                {selectedTool?.category || "Selected tool"}
              </div>
              <h1 className="tool-summary-title">
                {selectedTool?.name || "Choose a tool to begin"}
              </h1>
              {selectedTool?.description && (
                <p className="tool-summary-description">
                  {selectedTool.description}
                </p>
              )}
            </div>

            <div className="run-toolbar">
              <button
                type="button"
                className="button button--ghost"
                onClick={handleLoadExample}
                disabled={!selectedTool}
              >
                Load example payload
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={handleRunTool}
                disabled={!selectedTool || isRunning}
              >
                {isRunning ? "Running…" : "Run tool"}
              </button>
            </div>
          </div>

          {/* JSON panels */}
          <div className="json-columns">
            <div className="json-panel">
              <div className="json-panel-header">
                <h3 className="json-panel-title">Request JSON</h3>
                <span className="json-panel-subtitle">
                  Must be valid JSON. Sent as tool input.
                </span>
              </div>
              <textarea
                className="json-editor"
                value={requestJson}
                onChange={(e) => setRequestJson(e.target.value)}
                spellCheck="false"
              />
            </div>

            <div className="json-panel">
              <div className="json-panel-header">
                <h3 className="json-panel-title">Core API response</h3>
                <span className="json-panel-subtitle">
                  Raw response from{" "}
                  {selectedTool
                    ? `/run/${selectedTool.id}`
                    : "/run/<tool-id>"}
                </span>
                <div
                  className={`run-status-chip ${
                    runStatus === "ok"
                      ? "run-status-chip--ok"
                      : runStatus === "error"
                      ? "run-status-chip--error"
                      : runStatus === "running"
                      ? "run-status-chip--running"
                      : ""
                  }`}
                >
                  {runStatus === "idle" && "Ready"}
                  {runStatus === "running" && "Running…"}
                  {runStatus === "ok" && "Success"}
                  {runStatus === "error" && "Error"}
                </div>
              </div>
              <pre className="json-output">{responseJson}</pre>
            </div>
          </div>

          <div className="footer-note">
            Ready. Results will appear on the right.
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
