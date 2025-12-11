// aura-console/src/App.jsx
// --------------------------------------------------
// AURA SYSTEMS • Automation Console (Production Only)
// Always uses the live Core API at aura-core-monolith.onrender.com
// --------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import { TOOLS_METADATA } from "./core/tools-metadata";
import "./App.css";

// Hard-coded production endpoint
const CORE_API_BASE_URL = "https://aura-core-monolith.onrender.com";

function safeParseJson(value) {
  if (!value || !value.trim()) return {};
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function prettyJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

export default function App() {
  const [coreHealth, setCoreHealth] = useState({
    status: "checking",
    message: "",
  });
  const [selectedToolId, setSelectedToolId] = useState(null);
  const [inputJsonText, setInputJsonText] = useState("{\n  \n}");
  const [outputJson, setOutputJson] = useState(null);
  const [runError, setRunError] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const selectedTool = useMemo(
    () => TOOLS_METADATA.find((t) => t.id === selectedToolId) || null,
    [selectedToolId]
  );

  // ---------- Core Health ----------
  async function checkCoreHealth() {
    try {
      const res = await fetch(`${CORE_API_BASE_URL}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.ok) {
        setCoreHealth({
          status: "ok",
          message: `env=${data.env} | tools=${data.tools}`,
        });
      } else throw new Error("Bad health response");
    } catch (err) {
      setCoreHealth({
        status: "error",
        message: err.message || "Network error",
      });
    }
  }

  useEffect(() => {
    checkCoreHealth();
  }, []);

  // ---------- Run Tool ----------
  async function runTool() {
    if (!selectedTool) return;
    setIsRunning(true);
    setRunError("");
    setOutputJson(null);

    const payload = safeParseJson(inputJsonText);
    if (payload === null) {
      setRunError("Invalid JSON input.");
      setIsRunning(false);
      return;
    }

    try {
      const res = await fetch(
        `${CORE_API_BASE_URL}/run/${encodeURIComponent(selectedTool.id)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setOutputJson(data.result);
    } catch (err) {
      setRunError(err.message);
    } finally {
      setIsRunning(false);
    }
  }

  // ---------- Render ----------
  function renderStatus() {
    if (coreHealth.status === "ok")
      return <span className="status-pill ok">Core API online</span>;
    if (coreHealth.status === "error")
      return <span className="status-pill error">Offline</span>;
    return <span className="status-pill checking">Checking…</span>;
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="brand">
          <span className="brand-kicker">AURA SYSTEMS</span>
          <h1 className="brand-title">Automation Console</h1>
          <p className="brand-subtitle">
            Run and test AURA tools directly on the live Core API.
          </p>
        </div>

        <div className="core-panel">
          <label className="core-label">CORE API</label>
          <div className="core-url-row">
            <input
              value={CORE_API_BASE_URL}
              readOnly
              className="core-url-input"
            />
            <button type="button" className="core-refresh-btn" onClick={checkCoreHealth}>
              Refresh
            </button>
          </div>
          <div className="core-status-row">
            {renderStatus()}
            {coreHealth.message && (
              <span className="core-status-msg">{coreHealth.message}</span>
            )}
          </div>
        </div>
      </header>

      <main className="console-layout">
        <aside className="tools-pane">
          <div className="tools-header">
            <h2>Tools</h2>
          </div>

          <div className="tools-list">
            {TOOLS_METADATA.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className={
                  "tool-card" +
                  (tool.id === selectedToolId ? " tool-card--active" : "")
                }
                onClick={() => {
                  setSelectedToolId(tool.id);
                  setRunError("");
                  setOutputJson(null);
                  setInputJsonText(
                    prettyJson(tool.examplePayload || { example: true })
                  );
                }}
              >
                <div className="tool-card-main">
                  <div className="tool-name">{tool.name}</div>
                  <div className="tool-id">id: {tool.id}</div>
                </div>
                <div className="tool-meta">
                  <span className="tool-tag">{tool.category}</span>
                </div>
                <p className="tool-description">{tool.description}</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="workbench">
          {!selectedTool ? (
            <div className="empty-state">
              <h2>Select a tool to begin</h2>
              <p>Choose a tool from the left to view its description and run it.</p>
            </div>
          ) : (
            <div className="tool-workspace">
              <header className="workspace-header">
                <h2>{selectedTool.name}</h2>
                <p className="workspace-subtitle">{selectedTool.description}</p>
              </header>

              <div className="json-columns">
                <div className="json-column">
                  <div className="json-column-header">
                    <h3>Input JSON</h3>
                    <button
                      className="run-btn"
                      onClick={runTool}
                      disabled={isRunning}
                    >
                      {isRunning ? "Running…" : "Run Tool"}
                    </button>
                  </div>
                  <textarea
                    className="json-editor"
                    value={inputJsonText}
                    onChange={(e) => setInputJsonText(e.target.value)}
                    spellCheck={false}
                  />
                  {runError && (
                    <div className="error-box">
                      <strong>Error:</strong> {runError}
                    </div>
                  )}
                </div>

                <div className="json-column">
                  <div className="json-column-header">
                    <h3>Response</h3>
                  </div>
                  {outputJson ? (
                    <pre className="json-output">
                      {prettyJson(outputJson)}
                    </pre>
                  ) : (
                    <div className="placeholder">
                      Run a tool to see the Core API response here.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
