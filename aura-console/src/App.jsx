// AURA Systems • Automation Console (Glass Console Pro)
// -----------------------------------------------------
// - Talks to the Core API on Render
// - Lets you browse tools, filter/search, edit JSON and run tools
// - Neon / glass UI, no local-only assumptions
// -----------------------------------------------------

import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import "./App.css";
import { TOOLS_METADATA } from "./core/tools-metadata";

const RENDER_DEFAULT_BASE_URL = "https://aura-core-monolith.onrender.com";
const ALL_CATEGORY = "All tools";

function safeStringify(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function App() {
  // ---- Core API / health state ----
  const [baseUrl, setBaseUrl] = useState(RENDER_DEFAULT_BASE_URL);
  const [healthStatus, setHealthStatus] = useState("checking"); // checking | ok | error
  const [healthInfo, setHealthInfo] = useState(null);

  // ---- Tool / UX state ----
  const [selectedToolId, setSelectedToolId] = useState(
    TOOLS_METADATA[0]?.id ?? null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);

  // ---- JSON I/O state ----
  const [inputJson, setInputJson] = useState("{\n  \n}");
  const [outputJson, setOutputJson] = useState("");
  const [runError, setRunError] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  // --------------------------------------------------
  // Derived data
  // --------------------------------------------------

  const categories = useMemo(() => {
    const set = new Set();
    TOOLS_METADATA.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return [ALL_CATEGORY, ...Array.from(set).sort()];
  }, []);

  const selectedTool = useMemo(
    () => TOOLS_METADATA.find((t) => t.id === selectedToolId) ?? null,
    [selectedToolId]
  );

  const filteredTools = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return TOOLS_METADATA.filter((tool) => {
      const inCategory =
        activeCategory === ALL_CATEGORY || tool.category === activeCategory;

      if (!inCategory) return false;
      if (!term) return true;

      return (
        tool.name.toLowerCase().includes(term) ||
        tool.id.toLowerCase().includes(term) ||
        (tool.tag || "").toLowerCase().includes(term)
      );
    });
  }, [searchTerm, activeCategory]);

  // Group by category for nicer sidebar sections
  const groupedTools = useMemo(() => {
    const groups = new Map();
    filteredTools.forEach((tool) => {
      const key = tool.category || "Other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(tool);
    });
    return Array.from(groups.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
  }, [filteredTools]);

  // --------------------------------------------------
  // Health check against Core API
  // --------------------------------------------------

  const checkHealth = useCallback(
    async (urlToCheck) => {
      const url = (urlToCheck || baseUrl || "").replace(/\/+$/, "");
      if (!url) return;

      setHealthStatus("checking");
      setHealthInfo(null);

      try {
        const res = await fetch(`${url}/health`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        setHealthStatus(json.ok ? "ok" : "error");
        setHealthInfo(json);
      } catch (err) {
        console.error("[Console] Health check failed", err);
        setHealthStatus("error");
        setHealthInfo(null);
      }
    },
    [baseUrl]
  );

  // Initial health check on mount
  useEffect(() => {
    checkHealth(RENDER_DEFAULT_BASE_URL);
  }, [checkHealth]);

  // --------------------------------------------------
  // Handlers
  // --------------------------------------------------

  const handleBaseUrlBlur = () => {
    // Re-check API when user edits the URL
    checkHealth(baseUrl);
  };

  const handleSelectTool = (toolId) => {
    setSelectedToolId(toolId);
    setRunError("");
    setOutputJson("");

    const tool = TOOLS_METADATA.find((t) => t.id === toolId);
    if (tool && tool.examplePayload) {
      setInputJson(safeStringify(tool.examplePayload));
    } else {
      setInputJson("{\n  \n}");
    }
  };

  const handleLoadExample = () => {
    if (selectedTool?.examplePayload) {
      setInputJson(safeStringify(selectedTool.examplePayload));
    }
  };

  const handleRun = async () => {
    if (!selectedTool) return;
    const url = (baseUrl || "").replace(/\/+$/, "");

    setRunError("");
    setOutputJson("");
    setIsRunning(true);

    let parsed;
    try {
      parsed = inputJson.trim() ? JSON.parse(inputJson) : {};
    } catch (err) {
      setIsRunning(false);
      setRunError("Input is not valid JSON. Please fix and try again.");
      return;
    }

    try {
      const res = await fetch(`${url}/run/${selectedTool.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed),
      });

      const json = await res.json();
      if (!res.ok || json.ok === false) {
        setRunError(
          json.error ||
            `Core API returned HTTP ${res.status}. Check server logs on Render.`
        );
      }

      setOutputJson(safeStringify(json));
    } catch (err) {
      console.error("[Console] Run error", err);
      setRunError(
        "Could not reach the Core API. Check the base URL and Render service."
      );
    } finally {
      setIsRunning(false);
    }
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  const healthLabel =
    healthStatus === "ok"
      ? "Core API online"
      : healthStatus === "checking"
      ? "Checking Core API…"
      : "Core API unreachable";

  const healthEnv =
    healthInfo && healthInfo.env
      ? `env=${healthInfo.env} | tools=${healthInfo.tools}`
      : null;

  return (
    <div className="app-root">
      {/* ----- Header ----- */}
      <header className="app-header">
        <div>
          <div className="brand-kicker">AURA SYSTEMS</div>
          <div className="brand-title">Automation Console</div>
          <div className="brand-subtitle">
            Run and test AURA tools directly on the live Core API.
          </div>
        </div>

        <div className="core-panel">
          <div className="core-panel-label">CORE API</div>
          <div className="core-panel-row">
            <input
              className="core-url-input"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              onBlur={handleBaseUrlBlur}
            />
            <button
              type="button"
              className="core-refresh-btn"
              onClick={() => checkHealth(baseUrl)}
            >
              Refresh
            </button>
          </div>
          <div
            className={`status-pill ${
              healthStatus === "ok"
                ? "ok"
                : healthStatus === "checking"
                ? "checking"
                : "error"
            }`}
          >
            {healthLabel}
            {healthEnv ? ` • ${healthEnv}` : ""}
          </div>
        </div>
      </header>

      {/* ----- Body layout ----- */}
      <div className="console-layout">
        {/* Sidebar: tools */}
        <aside className="tools-pane">
          <div className="tools-header">
            <h2>Tools</h2>
          </div>

          <div className="tools-controls">
            <input
              className="tools-search"
              type="text"
              placeholder="Search by name, tag or id…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="category-chips">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={
                    "chip" + (cat === activeCategory ? " chip--active" : "")
                  }
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="tools-list">
            {groupedTools.length === 0 && (
              <div className="placeholder">No tools match that search.</div>
            )}

            {groupedTools.map(([category, tools]) => (
              <div key={category} className="tools-category-block">
                <div className="tools-category-label">{category}</div>
                <div className="tools-category-list">
                  {tools.map((tool) => {
                    const isActive = tool.id === selectedToolId;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        className={
                          "tool-card" + (isActive ? " tool-card--active" : "")
                        }
                        onClick={() => handleSelectTool(tool.id)}
                      >
                        <div className="tool-name">{tool.name}</div>
                        <div className="tool-meta-row">
                          <span className="tool-tag">
                            {tool.tag || tool.category}
                          </span>
                          <span className="tool-id">id: {tool.id}</span>
                        </div>
                        {tool.description && (
                          <div className="tool-description">
                            {tool.description}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Workbench */}
        <main className="workbench">
          {!selectedTool && (
            <div className="placeholder">
              Select a tool on the left to get started.
            </div>
          )}

          {selectedTool && (
            <>
              <div className="workspace-header">
                <div>
                  <div className="workspace-tool-tag">
                    {selectedTool.tag || selectedTool.category}
                  </div>
                  <h2>{selectedTool.name}</h2>
                  <p className="workspace-description">
                    {selectedTool.description}
                  </p>
                </div>

                <div className="workspace-actions">
                  {selectedTool.examplePayload && (
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={handleLoadExample}
                    >
                      Load example payload
                    </button>
                  )}
                  <button
                    type="button"
                    className="run-btn"
                    onClick={handleRun}
                    disabled={isRunning || healthStatus !== "ok"}
                  >
                    {isRunning ? "Running…" : "Run tool"}
                  </button>
                </div>
              </div>

              <div className="json-columns">
                <section className="json-column">
                  <div className="json-column-header">
                    <span>Request JSON</span>
                    <span className="json-hint">
                      Must be valid JSON. We send this as the tool input.
                    </span>
                  </div>
                  <textarea
                    className="json-editor"
                    spellCheck={false}
                    value={inputJson}
                    onChange={(e) => setInputJson(e.target.value)}
                  />
                  {runError && (
                    <div className="error-box error-box--inline">
                      {runError}
                    </div>
                  )}
                </section>

                <section className="json-column">
                  <div className="json-column-header">
                    <span>Core API response</span>
                    <span className="json-hint">
                      Raw response from /run/{selectedTool.id}
                    </span>
                  </div>
                  <pre className="json-output">
                    {outputJson || "// Run the tool to see the response here."}
                  </pre>
                </section>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
