// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import toolsMeta from "./toolMeta";

const CORE_API_BASE = "https://aura-core-monolith.onrender.com";

const DEFAULT_STATUS = {
  ok: false,
  environment: "unknown",
  tools: null
};

function App() {
  // Core status
  const [coreStatus, setCoreStatus] = useState(DEFAULT_STATUS);
  const [coreStatusLoading, setCoreStatusLoading] = useState(false);

  // Tools + filters
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("All tools");
  const [selectedToolId, setSelectedToolId] = useState(toolsMeta[0]?.id);

  // JSON + run state
  const [requestJson, setRequestJson] = useState(toolsMeta[0]?.exampleInput || "{\n\n}");
  const [outputJson, setOutputJson] = useState("// Run the tool to see the response here.");
  const [runStatus, setRunStatus] = useState("idle"); // idle | running | ok | error
  const [runMessage, setRunMessage] = useState("");

  const selectedTool =
    toolsMeta.find((t) => t.id === selectedToolId) || toolsMeta[0];

  // ---------------------------------------------------------------------------
  // Core API status
  // ---------------------------------------------------------------------------

  useEffect(() => {
    refreshCoreStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshCoreStatus() {
    try {
      setCoreStatusLoading(true);
      const res = await fetch(`${CORE_API_BASE}/status`);
      const data = await res.json();
      setCoreStatus({
        ok: Boolean(data.ok),
        environment: data.environment || "production",
        tools: Array.isArray(data.tools) ? data.tools.length : data.tools || null
      });
    } catch (err) {
      console.error("Error fetching Core status", err);
      setCoreStatus(DEFAULT_STATUS);
    } finally {
      setCoreStatusLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Tool filtering
  // ---------------------------------------------------------------------------

  const tags = useMemo(
    () => ["All tools", "SEO", "CRO / Social Proof", "Ops / Finance", "Email / Flows", "Support", "Developers"],
    []
  );

  const filteredTools = useMemo(() => {
    const q = search.trim().toLowerCase();

    return toolsMeta.filter((tool) => {
      const inTag =
        activeTag === "All tools" ||
        tool.category === activeTag ||
        tool.shortTag === activeTag;

      if (!inTag) return false;

      if (!q) return true;

      const haystack = (
        tool.name +
        " " +
        tool.description +
        " " +
        (tool.meta?.id || "")
      ).toLowerCase();

      return haystack.includes(q);
    });
  }, [activeTag, search]);

  // When the selected tool changes, reset request JSON to that tool’s example
  useEffect(() => {
    if (selectedTool) {
      setRequestJson(selectedTool.exampleInput || "{\n\n}");
      setOutputJson("// Run the tool to see the response here.");
      setRunStatus("idle");
      setRunMessage("");
    }
  }, [selectedToolId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Run tool
  // ---------------------------------------------------------------------------

  async function handleRunTool() {
    if (!selectedTool) return;

    setRunStatus("running");
    setRunMessage("Running…");

    let parsed;
    try {
      parsed = JSON.parse(requestJson);
    } catch (err) {
      console.error("Invalid JSON", err);
      setRunStatus("error");
      setRunMessage("Invalid JSON. Please check your request and try again.");
      setOutputJson(
        JSON.stringify(
          {
            ok: false,
            error: "Invalid JSON input",
            details: String(err.message || err)
          },
          null,
          2
        )
      );
      return;
    }

    try {
      const res = await fetch(`${CORE_API_BASE}/run/${selectedTool.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(parsed)
      });

      const data = await res.json();

      if (data.ok === false || data.error) {
        setRunStatus("error");
        setRunMessage(data.error || "Tool returned an error.");
      } else {
        setRunStatus("ok");
        setRunMessage("Success.");
      }

      setOutputJson(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("Error calling Core API", err);
      setRunStatus("error");
      setRunMessage("Network or server error. Please try again.");
      setOutputJson(
        JSON.stringify(
          {
            ok: false,
            error: "Network or server error when calling Core API.",
            details: String(err.message || err)
          },
          null,
          2
        )
      );
    }
  }

  function handleLoadExample() {
    if (selectedTool?.exampleInput) {
      setRequestJson(selectedTool.exampleInput);
      setRunStatus("idle");
      setRunMessage("");
      setOutputJson("// Run the tool to see the response here.");
    }
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  function statusChipClass() {
    if (coreStatusLoading) return "core-status-chip core-status-chip--loading";
    if (coreStatus.ok) return "core-status-chip core-status-chip--ok";
    return "core-status-chip core-status-chip--error";
  }

  function statusChipLabel() {
    if (coreStatusLoading) return "Checking Core API…";
    if (coreStatus.ok) {
      const env = coreStatus.environment || "production";
      const tools = coreStatus.tools != null ? ` · tools: ${coreStatus.tools}` : "";
      return `Core API online · ${env}${tools}`;
    }
    return "Core API offline";
  }

  function runChipClass() {
    if (runStatus === "running") return "run-status-chip run-status-chip--running";
    if (runStatus === "ok") return "run-status-chip run-status-chip--ok";
    if (runStatus === "error") return "run-status-chip run-status-chip--error";
    return "run-status-chip";
  }

  // ---------------------------------------------------------------------------

  return (
    <div className="app-shell">
      {/* HEADER */}
      <header className="app-header">
        <div className="app-header-left">
          <div className="brand-mark">A</div>
          <div className="brand-copy">
            <span className="brand-name">AURA Systems AI</span>
            <span className="brand-subtitle">Automation Console · Live Core API</span>
          </div>
        </div>

        <div className="app-header-right">
          <div className="core-url-input">
            <div className="label">Core API</div>
            <div className="core-url-row">
              <input
                className="core-url-field"
                type="text"
                value={CORE_API_BASE}
                readOnly
              />
              <button
                type="button"
                className="button button--ghost"
                onClick={refreshCoreStatus}
                disabled={coreStatusLoading}
              >
                Refresh
              </button>
            </div>
          </div>

          <div className={statusChipClass()}>
            <span className="core-status-indicator" />
            <span className="core-status-label">{statusChipLabel()}</span>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="console-layout">
        {/* LEFT: tools list */}
        <aside className="tools-pane">
          <div className="tools-pane-header">
            <div className="tools-title-row">
              <h2 className="section-title">Tools</h2>
            </div>

            <input
              className="tools-search"
              placeholder="Search by name, id or tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="filter-chips">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={
                    "chip" + (activeTag === tag ? " chip--active" : "")
                  }
                  onClick={() => setActiveTag(tag)}
                >
                  {tag}
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
                  className={
                    "tool-card" + (isActive ? " tool-card--active" : "")
                  }
                  onClick={() => setSelectedToolId(tool.id)}
                >
                  <div className="tool-card-header">
                    <div className="tool-name">{tool.name}</div>
                    <div className="tool-tag">{tool.shortTag}</div>
                  </div>
                  <p className="tool-description">{tool.description}</p>
                  <div className="tool-meta-row">
                    <span>id: {tool.meta?.id || tool.id}</span>
                    <span>{tool.category}</span>
                  </div>
                </button>
              );
            })}

            {filteredTools.length === 0 && (
              <div style={{ fontSize: 12, color: "#64748b" }}>
                No tools match that search yet.
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT: tool runner */}
        <main className="tool-runner">
          <div className="tool-runner-header">
            <div className="tool-summary">
              <div className="tool-summary-eyebrow">{selectedTool.category}</div>
              <h1 className="tool-summary-title">{selectedTool.name}</h1>
              <p className="tool-summary-description">
                {selectedTool.description}
              </p>
            </div>

            <div className="run-toolbar">
              <button
                type="button"
                className="button button--ghost"
                onClick={handleLoadExample}
              >
                Load example payload
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={handleRunTool}
                disabled={runStatus === "running"}
              >
                Run tool
              </button>
              <div className={runChipClass()}>
                {runStatus === "idle" ? "Ready" : runMessage}
              </div>
            </div>
          </div>

          <div className="json-columns">
            <section className="json-panel">
              <div className="json-panel-header">
                <div>
                  <div className="json-panel-title">Request JSON</div>
                  <div className="json-panel-subtitle">
                    Must be valid JSON. We send this as the tool input.
                  </div>
                </div>
              </div>
              <textarea
                className="json-editor"
                value={requestJson}
                onChange={(e) => setRequestJson(e.target.value)}
                spellCheck={false}
              />
            </section>

            <section className="json-panel">
              <div className="json-panel-header">
                <div>
                  <div className="json-panel-title">Core API response</div>
                  <div className="json-panel-subtitle">
                    Raw response from <code>/run/{selectedTool.id}</code>.
                  </div>
                </div>
              </div>
              <pre className="json-output">{outputJson}</pre>
            </section>
          </div>

          <div className="footer-note">
            These tools run directly against your live AURA Core API. Use test
            products and content first before wiring into production workflows.
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
