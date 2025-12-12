// aura-console/src/App.jsx

import React, { useEffect, useState } from "react";
import "./App.css";
import toolsMeta from "./toolMeta";


const DEFAULT_CORE_API =
  import.meta.env.VITE_CORE_API_BASE_URL ||
  "https://aura-core-monolith.onrender.com";

function App() {
  const [coreApiBaseUrl, setCoreApiBaseUrl] = useState(DEFAULT_CORE_API);
  const [isCoreOnline, setIsCoreOnline] = useState(false);
  const [envLabel, setEnvLabel] = useState("production");
  const [toolsCount, setToolsCount] = useState(toolsMeta.length);

  const [activeToolId, setActiveToolId] = useState(toolsMeta[0]?.id || "");
  const [requestJson, setRequestJson] = useState(
    toolsMeta[0]?.exampleInputJson || "{\n  \n}"
  );
  const [responseJson, setResponseJson] = useState(
    "// Run the tool to see the response here."
  );

  const [isRunning, setIsRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const activeTool = toolsMeta.find((t) => t.id === activeToolId) || null;

  // Ping Core /health when the base URL changes
  useEffect(() => {
    let cancelled = false;

    const pingCore = async () => {
      try {
        setStatusMessage("Checking Core API...");
        const res = await fetch(`${coreApiBaseUrl}/health`, {
          method: "GET",
        });

        if (!res.ok) {
          if (!cancelled) {
            setIsCoreOnline(false);
            setStatusMessage("Core API health check failed.");
          }
          return;
        }

        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          setIsCoreOnline(true);
          setEnvLabel(data.env || "unknown");
          setToolsCount(data.tools || toolsMeta.length);
          setStatusMessage("Core API online.");
        }
      } catch (err) {
        if (!cancelled) {
          setIsCoreOnline(false);
          setStatusMessage("Unable to reach Core API.");
        }
      }
    };

    pingCore();
    return () => {
      cancelled = true;
    };
  }, [coreApiBaseUrl]);

  const handleCoreUrlChange = (e) => {
    setCoreApiBaseUrl(e.target.value);
  };

  const handleSelectTool = (toolId) => {
    const tool = toolsMeta.find((t) => t.id === toolId);
    setActiveToolId(toolId);
    setResponseJson("// Run the tool to see the response here.");
    if (tool?.exampleInputJson) {
      setRequestJson(tool.exampleInputJson);
    }
  };

  const handleLoadExamplePayload = () => {
    if (activeTool?.exampleInputJson) {
      setRequestJson(activeTool.exampleInputJson);
    }
  };

  const handleRunTool = async () => {
    if (!activeTool) return;

    let parsed;
    try {
      parsed = JSON.parse(requestJson);
    } catch (err) {
      setResponseJson(
        JSON.stringify(
          {
            ok: false,
            error:
              "Request JSON is invalid. Please fix the JSON syntax and try again.",
          },
          null,
          2
        )
      );
      return;
    }

    setIsRunning(true);
    setStatusMessage(`Calling /run/${activeTool.id} on Core API...`);

    try {
      const res = await fetch(`${coreApiBaseUrl}/run/${activeTool.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed),
      });

      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        json = {
          ok: false,
          status: res.status,
          statusText: res.statusText,
          raw: text,
        };
      }

      setResponseJson(JSON.stringify(json, null, 2));
      setStatusMessage(`Core API responded with status ${res.status}.`);
    } catch (err) {
      setResponseJson(
        JSON.stringify(
          {
            ok: false,
            error: "Failed to reach Core API.",
            details: err?.message || String(err),
          },
          null,
          2
        )
      );
      setStatusMessage("Error calling Core API.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="console-root">
      {/* Header */}
      <header className="console-header">
        <div className="header-left">
          <div className="brand-mark">
            <span className="brand-logo">A</span>
            <div className="brand-text">
              <span className="brand-title">AURA Systems</span>
              <span className="brand-subtitle">
                Automation Console · Live Core API
              </span>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="core-status-card">
            <div className="core-status-top">
              <span className="core-label">Core API</span>
              <span
                className={`core-pill ${
                  isCoreOnline ? "core-pill-online" : "core-pill-offline"
                }`}
              >
                <span className="core-dot" />
                {isCoreOnline ? "online" : "offline"}
              </span>
            </div>

            <div className="core-url-row">
              <input
                className="core-url-input"
                value={coreApiBaseUrl}
                onChange={handleCoreUrlChange}
              />
              <button
                type="button"
                className="core-refresh-btn"
                onClick={() => {
                  // Trigger the effect by just touching the state
                  setCoreApiBaseUrl((prev) => prev.trim());
                }}
              >
                Refresh
              </button>
            </div>

            <div className="core-meta-row">
              <span className="core-meta-pill">
                env={envLabel || "unknown"}
              </span>
              <span className="core-meta-pill">
                tools={toolsCount ?? toolsMeta.length}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="console-main">
        {/* Tools list */}
        <aside className="tools-pane">
          <div className="tools-search-block">
            <label className="field-label">Tools</label>
            <input
              type="text"
              className="tools-search-input"
              placeholder="Search by name, id or tag..."
              // future: implement search
              readOnly
            />
          </div>

          <div className="tools-chips-row">
            <button className="chip chip-active">All tools</button>
            <button className="chip">SEO</button>
            <button className="chip">CRO / Social Proof</button>
            <button className="chip">Ops / Finance</button>
          </div>

          <div className="tools-list">
            {toolsMeta.map((tool) => {
              const isActive = tool.id === activeToolId;
              return (
                <button
                  key={tool.id}
                  type="button"
                  className={`tool-card ${isActive ? "tool-card-active" : ""}`}
                  onClick={() => handleSelectTool(tool.id)}
                >
                  <div className="tool-card-top">
                    <span className="tool-name">{tool.name}</span>
                    <span className="tool-tag">{tool.tag}</span>
                  </div>
                  <p className="tool-description">{tool.description}</p>
                  <div className="tool-meta">
                    <span className="tool-id">id: {tool.id}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Request / response columns */}
        <section className="work-pane">
          {/* Left: Request JSON */}
          <div className="column column-request">
            <div className="column-header">
              <div>
                <div className="column-title">Request JSON</div>
                <div className="column-subtitle">
                  Must be valid JSON. We send this as the tool input.
                </div>
              </div>
              <div className="column-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleLoadExamplePayload}
                >
                  Load example payload
                </button>
              </div>
            </div>

            <textarea
              className="json-editor"
              spellCheck={false}
              value={requestJson}
              onChange={(e) => setRequestJson(e.target.value)}
            />
          </div>

          {/* Right: Response */}
          <div className="column column-response">
            <div className="column-header">
              <div>
                <div className="column-title">Core API response</div>
                <div className="column-subtitle">
                  Raw response from{" "}
                  {activeTool ? `/run/${activeTool.id}` : "/run/<tool-id>"}.
                </div>
              </div>
            </div>

            <pre className="json-viewer">{responseJson}</pre>

            <div className="run-bar">
              <div className="run-status">
                <span className="run-status-chip">
                  {isRunning ? "Running…" : "Ready. Results will appear here."}
                </span>
                {statusMessage && (
                  <span className="run-status-text">{statusMessage}</span>
                )}
              </div>
              <button
                type="button"
                className="primary-btn"
                onClick={handleRunTool}
                disabled={isRunning || !activeTool}
              >
                {isRunning ? "Running…" : "Run tool"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
