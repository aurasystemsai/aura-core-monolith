// src/App.jsx
// ===============================================
// AURA Systems • Automation Console
// Run and test AURA Core tools from a single UI.
// ===============================================

import React, { useEffect, useMemo, useState } from "react";
import { TOOLS_METADATA } from "./core/tools-metadata";
import "./App.css";

// -------- helpers --------

function normaliseBaseUrl(raw) {
  if (!raw) return "";
  return String(raw).trim().replace(/\/+$/, "");
}

function buildRunUrl(baseUrl, toolId) {
  const clean = normaliseBaseUrl(baseUrl || "http://localhost:4999");
  return `${clean}/run/${toolId}`;
}

// pretty-print JSON safely
function formatJson(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function parseJsonOrThrow(text) {
  if (!text || !text.trim()) return {};
  return JSON.parse(text);
}

export default function App() {
  // -------- state --------

  const [coreBaseUrl, setCoreBaseUrl] = useState("http://localhost:4999");
  const [coreStatus, setCoreStatus] = useState({
    online: true,
    toolsAvailable: TOOLS_METADATA.length,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTool, setSelectedTool] = useState(null);
  const [requestJson, setRequestJson] = useState("{\n  \"example\": \"value\"\n}");
  const [responseJson, setResponseJson] = useState(
    "// Run a tool to see the response here."
  );
  const [isRunning, setIsRunning] = useState(false);

  const [favourites, setFavourites] = useState([]);

  // -------- favourites (persist to localStorage) --------

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("aura_console_favourites");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setFavourites(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "aura_console_favourites",
        JSON.stringify(favourites)
      );
    } catch {
      // ignore
    }
  }, [favourites]);

  function toggleFavourite(key) {
    setFavourites((prev) =>
      prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key]
    );
  }

  // -------- tool grouping + filtering --------

  const groupedTools = useMemo(() => {
    const groups = {};

    TOOLS_METADATA.forEach((tool) => {
      const cat = tool.category || "General";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(tool);
    });

    Object.keys(groups).forEach((cat) => {
      groups[cat].sort((a, b) => a.name.localeCompare(b.name));
    });

    return groups;
  }, []);

  const allTools = TOOLS_METADATA;

  const filteredTools = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return allTools;

    return allTools.filter((tool) => {
      const haystack = [
        tool.name,
        tool.id,
        tool.category,
        tool.tag,
        tool.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [allTools, searchTerm]);

  const filteredToolsByCategory = useMemo(() => {
    const groups = {};

    filteredTools.forEach((tool) => {
      const cat = tool.category || "General";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(tool);
    });

    Object.keys(groups).forEach((cat) => {
      groups[cat].sort((a, b) => a.name.localeCompare(b.name));
    });

    return groups;
  }, [filteredTools]);

  const visibleCount = filteredTools.length;
  const totalCount = allTools.length;

  // -------- selection + run --------

  function handleSelectTool(tool) {
    setSelectedTool(tool);

    const payload =
      tool.examplePayload && Object.keys(tool.examplePayload).length
        ? tool.examplePayload
        : { example: "value" };

    setRequestJson(formatJson(payload));
    setResponseJson("// Run this tool to see the response here.");
  }

  async function handleRunTool() {
    if (!selectedTool) return;

    setIsRunning(true);

    try {
      const url = buildRunUrl(coreBaseUrl, selectedTool.id);
      const body = parseJsonOrThrow(requestJson);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let json;

      try {
        json = JSON.parse(text);
      } catch {
        json = { ok: false, error: "Response was not valid JSON", raw: text };
      }

      setResponseJson(formatJson(json));

      setCoreStatus((prev) => ({
        ...prev,
        online: res.ok,
      }));
    } catch (err) {
      setResponseJson(
        formatJson({
          ok: false,
          error: err?.message || String(err),
        })
      );
      setCoreStatus((prev) => ({ ...prev, online: false }));
    } finally {
      setIsRunning(false);
    }
  }

  // -------- UI --------

  return (
    <div className="app-shell">
      <main className="app-inner">
        {/* left: tools + categories */}
        <section className="tools-panel">
          <header className="app-header">
            <div className="app-header-main">
              <h1 className="app-kicker">AURA SYSTEMS</h1>
              <h2 className="app-title">Automation Console</h2>
              <p className="app-subtitle">
                Run and test AURA tools locally from a single interface.
              </p>
            </div>

            <div className="app-header-side">
              <label className="base-url-label">
                <span className="base-url-caption">Core API Base URL</span>
                <div className="base-url-row">
                  <input
                    className="base-url-input"
                    value={coreBaseUrl}
                    onChange={(e) => setCoreBaseUrl(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() =>
                      setCoreStatus((prev) => ({
                        ...prev,
                        online: true,
                        toolsAvailable: TOOLS_METADATA.length,
                      }))
                    }
                  >
                    Refresh
                  </button>
                </div>
              </label>

              <div className="core-status-row">
                <span
                  className={`status-dot ${
                    coreStatus.online ? "status-dot--ok" : "status-dot--down"
                  }`}
                />
                <span className="status-text">
                  {coreStatus.online ? "Core API online" : "Core API offline"} •{" "}
                  {coreStatus.toolsAvailable} tools available
                </span>
              </div>
            </div>
          </header>

          <div className="tools-header-row">
            <div>
              <h3 className="section-title">Tools</h3>
              <p className="section-subtitle">
                Grouped by category. Use search or favourites to jump quickly.
              </p>
            </div>

            <div className="tools-search-meta">
              <div className="search-field">
                <span className="search-icon">🔍</span>
                <input
                  className="search-input"
                  placeholder="Search by name, id or category…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="tools-count">
                {visibleCount} of {totalCount} tools visible
              </div>
            </div>
          </div>

          <div className="tools-category-list">
            {Object.keys(filteredToolsByCategory).length === 0 && (
              <p className="empty-state">
                No tools match that search. Clear the search to see everything.
              </p>
            )}

            {Object.entries(filteredToolsByCategory).map(
              ([category, tools]) => (
                <section key={category} className="tools-category-block">
                  <h4 className="tools-category-title">{category} tools</h4>
                  <p className="tools-category-subtitle">
                    {category} related automations and utilities.
                  </p>

                  <div className="tools-grid">
                    {tools.map((tool) => {
                      const isSelected =
                        selectedTool && selectedTool.id === tool.id;
                      const isFav = favourites.includes(tool.key);

                      return (
                        <div
                          key={tool.key}
                          className={`tool-card ${
                            isSelected ? "tool-card--selected" : ""
                          }`}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleSelectTool(tool)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleSelectTool(tool);
                            }
                          }}
                        >
                          <div className="tool-head">
                            <div className="tool-head-main">
                              <div className="tool-name">{tool.name}</div>
                              {tool.category && (
                                <span className="tool-badge">
                                  {tool.category.toUpperCase()}
                                </span>
                              )}
                            </div>

                            {/* star: span, not button, to avoid nested button issue */}
                            <span
                              className={`fav-toggle ${
                                isFav ? "is-favourite" : ""
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavourite(tool.key);
                              }}
                              role="button"
                              aria-label="Toggle favourite"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleFavourite(tool.key);
                                }
                              }}
                            >
                              ★
                            </span>
                          </div>

                          <p className="tool-desc tool-desc--clamp">
                            {tool.description || "No description yet."}
                          </p>

                          <div className="tool-meta">
                            <span className="tool-meta-id">
                              id: <span>{tool.id}</span>
                            </span>
                            <span className="tool-meta-category">
                              • category:{" "}
                              <span>{tool.category || "General"}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )
            )}
          </div>
        </section>

        {/* right: request + response */}
        <section className="request-panel">
          <header className="panel-header">
            <div>
              <h3 className="panel-title">Request</h3>
              <p className="panel-subtitle">
                Configure the JSON payload for the selected tool.
              </p>
            </div>
            <div className="selected-tool-label">
              {selectedTool ? selectedTool.name : "No tool selected"}
            </div>
          </header>

          <div className="request-meta">
            <span className="http-verb">POST</span>
            <span className="request-url">
              {selectedTool
                ? buildRunUrl(coreBaseUrl, selectedTool.id)
                : `${normaliseBaseUrl(coreBaseUrl)}/run/<tool-id>`}
            </span>
          </div>

          <textarea
            className="request-editor"
            spellCheck={false}
            value={requestJson}
            onChange={(e) => setRequestJson(e.target.value)}
          />

          <div className="request-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRunTool}
              disabled={!selectedTool || isRunning}
            >
              {isRunning ? "Running…" : "Run Tool"}
            </button>
          </div>

          <header className="panel-header response-header">
            <div>
              <h3 className="panel-title">Response</h3>
              <p className="panel-subtitle">
                Output from the last tool run.
              </p>
            </div>
          </header>

          <pre className="response-view">{responseJson}</pre>
        </section>
      </main>
    </div>
  );
}
