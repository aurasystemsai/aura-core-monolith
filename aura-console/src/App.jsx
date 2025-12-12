import React, { useEffect, useState } from "react";
import "./App.css";
import toolsMeta from "./toolMeta";

const DEFAULT_CORE_API =
  import.meta.env.VITE_CORE_API_BASE_URL ||
  "https://aura-core-monolith.onrender.com";

function App() {
  const [coreApiBaseUrl, setCoreApiBaseUrl] = useState(DEFAULT_CORE_API);

  const [coreStatus, setCoreStatus] = useState({
    online: false,
    env: "unknown",
    tools: 0,
    checking: false,
  });

  const [selectedToolId, setSelectedToolId] = useState(
    toolsMeta[0]?.id || null
  );

  const selectedTool =
    toolsMeta.find((tool) => tool.id === selectedToolId) || toolsMeta[0];

  const [requestJson, setRequestJson] = useState("");
  const [responseText, setResponseText] = useState(
    "// Run the tool to see the response here."
  );
  const [isRunning, setIsRunning] = useState(false);
  const [runStatus, setRunStatus] = useState({
    state: "idle", // idle | running | success | error
    durationMs: 0,
    errorMessage: "",
  });

  // Load example JSON whenever tool changes
  useEffect(() => {
    if (selectedTool?.exampleInputJson) {
      setRequestJson(selectedTool.exampleInputJson);
    } else {
      setRequestJson("{\n  \n}");
    }
    setResponseText("// Run the tool to see the response here.");
    setRunStatus({ state: "idle", durationMs: 0, errorMessage: "" });
  }, [selectedTool]);

  // Health check for Core API
  async function checkCoreHealth() {
    try {
      setCoreStatus((s) => ({ ...s, checking: true }));
      const res = await fetch(`${coreApiBaseUrl}/health`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      setCoreStatus({
        online: !!json.ok,
        env: json.env || "unknown",
        tools: json.tools || 0,
        checking: false,
      });
    } catch (err) {
      setCoreStatus({
        online: false,
        env: "unknown",
        tools: 0,
        checking: false,
      });
    }
  }

  useEffect(() => {
    checkCoreHealth();
  }, [coreApiBaseUrl]);

  // Run selected tool
  async function handleRunTool() {
    if (!selectedTool) return;

    let parsed;
    try {
      parsed = requestJson.trim() ? JSON.parse(requestJson) : {};
    } catch (err) {
      setRunStatus({
        state: "error",
        durationMs: 0,
        errorMessage: "Request JSON is not valid JSON.",
      });
      setResponseText("// Error: Request JSON is not valid JSON.");
      return;
    }

    setIsRunning(true);
    setRunStatus({ state: "running", durationMs: 0, errorMessage: "" });
    const startedAt = performance.now();

    try {
      const res = await fetch(
        `${coreApiBaseUrl}/run/${selectedTool.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(parsed),
        }
      );

      const elapsed = performance.now() - startedAt;

      const text = await res.text();
      setResponseText(text || "// (No response body)");

      if (!res.ok) {
        setRunStatus({
          state: "error",
          durationMs: Math.round(elapsed),
          errorMessage: `HTTP ${res.status}`,
        });
      } else {
        setRunStatus({
          state: "success",
          durationMs: Math.round(elapsed),
          errorMessage: "",
        });
      }
    } catch (err) {
      const elapsed = performance.now() - startedAt;
      setResponseText(
        `// Error talking to Core API:\n// ${String(err.message || err)}`
      );
      setRunStatus({
        state: "error",
        durationMs: Math.round(elapsed),
        errorMessage: "Network error",
      });
    } finally {
      setIsRunning(false);
    }
  }

  // Status label for tiny chip
  function getRunStatusLabel() {
    if (runStatus.state === "running") return "Running…";
    if (runStatus.state === "success") {
      return `Done • ${runStatus.durationMs} ms`;
    }
    if (runStatus.state === "error") {
      return runStatus.errorMessage || "Error";
    }
    return "Ready";
  }

  return (
    <div className="app-root">
      <div className="app-shell">
        {/* Left rail: tools list */}
        <aside className="tools-rail">
          <div className="brand-lockup">
            <div className="brand-avatar">A</div>
            <div className="brand-text">
              <div className="brand-title">AURA Systems</div>
              <div className="brand-subtitle">
                Automation Console · Live Core API
              </div>
            </div>
          </div>

          <div className="tools-search">
            <input
              type="text"
              placeholder="Search by name, id or tag…"
              className="tools-search-input"
              // search behaviour can be added later
              disabled
            />
          </div>

          <div className="tools-section-label">Tools</div>

          <div className="tools-list">
            {toolsMeta.map((tool) => {
              const isActive = tool.id === selectedToolId;
              return (
                <button
                  key={tool.id}
                  type="button"
                  className={
                    "tool-pill" + (isActive ? " tool-pill--active" : "")
                  }
                  onClick={() => setSelectedToolId(tool.id)}
                >
                  <div className="tool-pill-main">
                    <div className="tool-pill-name">{tool.name}</div>
                    <div className="tool-pill-tag">{tool.tag}</div>
                  </div>
                  <div className="tool-pill-meta">
                    <span className="tool-pill-id">{tool.id}</span>
                    <span className="tool-pill-category">{tool.category}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main content */}
        <main className="console-main">
          {/* Top bar with tool info and Run button */}
          <header className="console-header">
            <div className="console-header-left">
              <div className="tool-title-row">
                <h1 className="tool-title">{selectedTool.name}</h1>
                <span className="tool-id-chip">{selectedTool.id}</span>
                {selectedTool.tag && (
                  <span className="tool-tag-chip">{selectedTool.tag}</span>
                )}
              </div>
              {selectedTool.description && (
                <p className="tool-description">{selectedTool.description}</p>
              )}
            </div>

            <div className="console-header-right">
              <div className="core-status-chip">
                <span
                  className={
                    "core-status-dot" +
                    (coreStatus.online ? " core-status-dot--ok" : "")
                  }
                />
                <span className="core-status-label">
                  {coreStatus.online ? "Core API online" : "Core API offline"}
                </span>
                <span className="core-status-meta">
                  env={coreStatus.env} · tools={coreStatus.tools}
                </span>
              </div>

              <button
                type="button"
                className="run-button"
                onClick={handleRunTool}
                disabled={isRunning || !coreStatus.online}
              >
                {isRunning ? "Running…" : "Run tool"}
              </button>
            </div>
          </header>

          {/* Editors row */}
          <section className="console-panels">
            {/* Request JSON */}
            <div className="panel panel--request">
              <div className="panel-header">
                <span className="panel-title">Request JSON</span>
                <span className="panel-subtitle">
                  Must be valid JSON. Sent as tool input.
                </span>
              </div>
              <textarea
                className="panel-editor"
                value={requestJson}
                onChange={(e) => setRequestJson(e.target.value)}
                spellCheck={false}
              />
            </div>

            {/* Response */}
            <div className="panel panel--response">
              <div className="panel-header">
                <span className="panel-title">Core API response</span>
                <span className="panel-subtitle">
                  Raw response from <code>/run/{selectedTool.id}</code>
                </span>
              </div>
              <textarea
                className="panel-editor panel-editor--readonly"
                value={responseText}
                readOnly
                spellCheck={false}
              />
            </div>
          </section>

          {/* Footer strip */}
          <footer className="console-footer">
            <div className="core-url">
              <span className="core-url-label">Core API URL</span>
              <input
                className="core-url-input"
                type="text"
                value={coreApiBaseUrl}
                onChange={(e) => setCoreApiBaseUrl(e.target.value)}
                onBlur={checkCoreHealth}
              />
              <button
                type="button"
                className="core-url-refresh"
                onClick={checkCoreHealth}
              >
                Refresh
              </button>
            </div>

            <div
              className={
                "run-status-chip run-status-chip--" + runStatus.state
              }
            >
              {getRunStatusLabel()}
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
