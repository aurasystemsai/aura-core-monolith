// aura-console/src/App.jsx

import React, { useEffect, useMemo, useState } from "react";
import { toolsMetadata } from "./core/tools-metadata";
import "./index.css";

const DEFAULT_BASE_URL = "https://aura-core-monolith.onrender.com";

function groupToolsByCategory(tools) {
  const byCat = new Map();
  for (const tool of tools) {
    const category = tool.category || "Other";
    if (!byCat.has(category)) {
      byCat.set(category, []);
    }
    byCat.get(category).push(tool);
  }
  return Array.from(byCat.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([category, list]) => ({
      category,
      tools: list.sort((a, b) => a.name.localeCompare(b.name)),
    }));
}

function App() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [coreOnline, setCoreOnline] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Checking status…");
  const [selectedTool, setSelectedTool] = useState(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [inputJson, setInputJson] = useState("{\n  \n}");
  const [outputJson, setOutputJson] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState("");

  // Load / persist base URL
  useEffect(() => {
    try {
      const stored = localStorage.getItem("aura-core-base-url");
      if (stored) setBaseUrl(stored);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("aura-core-base-url", baseUrl);
    } catch {
      // ignore
    }
  }, [baseUrl]);

  // Ping the core API to show status
  async function checkCoreStatus(urlToCheck) {
    const cleanBase = (urlToCheck || baseUrl || "").trim();
    if (!cleanBase) {
      setCoreOnline(false);
      setStatusMessage("Base URL is empty.");
      return;
    }

    setStatusMessage("Checking…");
    setCoreOnline(false);

    try {
      const healthUrl = cleanBase.replace(/\/+$/, "") + "/health";
      const res = await fetch(healthUrl, { method: "GET" });
      if (!res.ok) {
        setCoreOnline(false);
        setStatusMessage(`Health check failed (${res.status})`);
        return;
      }
      setCoreOnline(true);
      setStatusMessage("Core API online");
    } catch (err) {
      setCoreOnline(false);
      setStatusMessage("Could not reach Core API");
      console.error(err);
    }
  }

  // Initial status check
  useEffect(() => {
    checkCoreStatus(baseUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groupedTools = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    const tools = toolsMetadata || [];

    const visible =
      q.length === 0
        ? tools
        : tools.filter((t) => {
            const haystack = `${t.name} ${t.id} ${t.category} ${t.tag || ""}`.toLowerCase();
            return haystack.includes(q);
          });

    return groupToolsByCategory(visible);
  }, [filterQuery]);

  function handleSelectTool(tool) {
    setSelectedTool(tool);
    setRunError("");
    setOutputJson("");
    if (tool && tool.examplePayload) {
      try {
        const pretty = JSON.stringify(tool.examplePayload, null, 2);
        setInputJson(pretty);
      } catch {
        setInputJson("{\n  \n}");
      }
    } else {
      setInputJson("{\n  \n}");
    }
  }

  async function handleRunTool() {
    if (!selectedTool) return;

    setRunError("");
    setIsRunning(true);
    setOutputJson("");

    let parsedBody;
    try {
      const trimmed = inputJson.trim();
      parsedBody = trimmed ? JSON.parse(trimmed) : {};
    } catch {
      setRunError("Input JSON is invalid. Please fix and try again.");
      setIsRunning(false);
      return;
    }

    const cleanBase = (baseUrl || "").trim().replace(/\/+$/, "");
    const url = `${cleanBase}/run/${selectedTool.id}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedBody),
      });

      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        json = { raw: text };
      }

      const pretty = JSON.stringify(json, null, 2);
      setOutputJson(pretty);

      if (!res.ok) {
        setRunError(`Request failed with status ${res.status}`);
      }
    } catch (err) {
      console.error(err);
      setRunError("Error calling Core API. Check the URL and try again.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="branding">
          <div className="logo">AURA SYSTEMS</div>
          <div className="title">Automation Console</div>
          <div className="subtitle">
            Run and test AURA tools locally from a single interface.
          </div>
        </div>

        <div className="core-status">
          <div className="label">Core API Base URL</div>
          <div className="base-row">
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://aura-core-monolith.onrender.com"
            />
            <button type="button" onClick={() => checkCoreStatus()}>
              Refresh
            </button>
          </div>
          <div className="status-row">
            <span className={"status-dot" + (coreOnline ? " online" : "")} />
            <span>{statusMessage}</span>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="layout">
        {/* Tools panel */}
        <section className="tools-panel">
          <div className="tools-toolbar">
            <div className="toolbar-title">Tools</div>
            <input
              type="text"
              placeholder="Search by name, id or category"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>

          {!toolsMetadata || toolsMetadata.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">No tools configured</div>
              <div className="empty-text">
                Add tool metadata to <code>core/tools-metadata.js</code> to see
                them here.
              </div>
            </div>
          ) : groupedTools.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">No tools match your search</div>
              <div className="empty-text">
                Try changing your search term or clearing the filter.
              </div>
            </div>
          ) : (
            groupedTools.map((group) => (
              <div className="category-block" key={group.category}>
                <div className="category-title">{group.category} tools</div>
                <div className="tool-grid">
                  {group.tools.map((tool) => {
                    const selected =
                      selectedTool && selectedTool.id === tool.id;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        className={
                          "tool-card" + (selected ? " selected" : "")
                        }
                        onClick={() => handleSelectTool(tool)}
                      >
                        <div className="tool-name">{tool.name}</div>
                        <div className="tool-meta">
                          <span className="pill">
                            {tool.tag || tool.category || "Tool"}
                          </span>
                          {tool.category && (
                            <span className="pill">{tool.category}</span>
                          )}
                        </div>
                        <div className="tool-desc">{tool.description}</div>
                        <div className="tool-id">id: {tool.id}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>

        {/* Runner panel */}
        <section className="runner-panel">
          {!selectedTool ? (
            <div className="empty-state">
              <div className="empty-title">Select a tool to begin</div>
              <div className="empty-text">
                Choose a tool from the left panel to view its description, edit
                input JSON and run it against the Core API.
              </div>
            </div>
          ) : (
            <>
              <div className="runner-header">
                <div>
                  <div className="runner-tool-name">
                    {selectedTool.name}
                  </div>
                  <div className="runner-tool-id">
                    id: {selectedTool.id}
                  </div>
                </div>
                <button
                  type="button"
                  className="run-button"
                  onClick={handleRunTool}
                  disabled={isRunning}
                >
                  {isRunning ? "Running…" : "Run tool"}
                </button>
              </div>

              {runError && <div className="error">{runError}</div>}

              <div className="split">
                <div className="pane">
                  <div className="pane-title">Input JSON</div>
                  <textarea
                    value={inputJson}
                    onChange={(e) => setInputJson(e.target.value)}
                    spellCheck={false}
                  />
                </div>
                <div className="pane">
                  <div className="pane-title">Core API response</div>
                  {outputJson ? (
                    <pre className="json-output">{outputJson}</pre>
                  ) : (
                    <div className="placeholder">
                      Run a tool to see the Core API response here.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
