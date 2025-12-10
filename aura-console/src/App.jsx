import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import clsx from "clsx";

const DEFAULT_BASE_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}`
    : "http://localhost:4999";

export default function App() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [tools, setTools] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [metaError, setMetaError] = useState("");
  const [selectedTool, setSelectedTool] = useState(null);
  const [inputJson, setInputJson] = useState("{\n  \n}");
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [runError, setRunError] = useState("");
  const [search, setSearch] = useState("");

  // ---- load tools ----
  async function fetchTools() {
    setLoadingMeta(true);
    setMetaError("");
    try {
      const url = `${baseUrl.replace(/\/+$/, "")}/meta/tools`;
      const res = await axios.get(url);
      if (!res.data.ok) {
        throw new Error(res.data.error || "Unknown meta/tools error");
      }
      setTools(res.data.tools || []);
    } catch (err) {
      console.error("meta/tools error", err);
      setMetaError(err.message || "Failed to load tools");
    } finally {
      setLoadingMeta(false);
    }
  }

  useEffect(() => {
    fetchTools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- filtered tools ----
  const filteredTools = useMemo(() => {
    if (!search.trim()) return tools;
    const q = search.toLowerCase();
    return tools.filter((t) => {
      return (
        (t.name || "").toLowerCase().includes(q) ||
        (t.id || "").toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q)
      );
    });
  }, [tools, search]);

  const groupedByCategory = useMemo(() => {
    const map = new Map();
    for (const t of filteredTools) {
      const cat = t.category || "Other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(t);
    }
    return Array.from(map.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
  }, [filteredTools]);

  // ---- run a tool ----
  async function runTool(toolId) {
    setRunning(true);
    setRunResult(null);
    setRunError("");

    let parsed;
    try {
      parsed = inputJson.trim() ? JSON.parse(inputJson) : {};
    } catch (err) {
      setRunError("Input JSON is invalid. Please fix and try again.");
      setRunning(false);
      return;
    }

    try {
      const url = `${baseUrl.replace(/\/+$/, "")}/run/${toolId}`;
      const res = await axios.post(url, parsed);
      setRunResult(res.data);
      if (!res.data.ok) {
        setRunError(res.data.error || "Tool returned ok:false");
      }
    } catch (err) {
      console.error("run error", err);
      setRunError(err.message || "Failed to run tool");
    } finally {
      setRunning(false);
    }
  }

  function handleSelectTool(t) {
    setSelectedTool(t);
    setRunResult(null);
    setRunError("");
  }

  // ---- render ----
  return (
    <div className="app">
      <header className="app-header">
        <div className="branding">
          <div className="logo">AURA SYSTEMS</div>
          <div className="title">Automation Console</div>
          <div className="subtitle">
            Run and test AURA tools from a single interface.
          </div>
        </div>

        <div className="core-status">
          <label className="label">Core API Base URL</label>
          <div className="base-row">
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
            <button onClick={fetchTools}>Refresh</button>
          </div>
          <div className="status-row">
            <span
              className={clsx("status-dot", {
                online: tools.length > 0 && !metaError
              })}
            />
            <span>
              Core API {metaError ? "offline" : "online"} •{" "}
              {tools.length ? `${tools.length} tools available` : "no tools"}
            </span>
          </div>
        </div>
      </header>

      <main className="layout">
        <section className="tools-panel">
          <div className="tools-toolbar">
            <div className="toolbar-title">Tools</div>
            <input
              type="text"
              placeholder="Search by name, id or category"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loadingMeta && <div className="notice">Loading tools…</div>}
          {metaError && <div className="error">{metaError}</div>}

          {!loadingMeta &&
            !metaError &&
            groupedByCategory.map(([cat, list]) => (
              <div key={cat} className="category-block">
                <div className="category-title">{cat}</div>
                <div className="tool-grid">
                  {list.map((t) => (
                    <button
                      key={t.id}
                      className={clsx("tool-card", {
                        selected: selectedTool && selectedTool.id === t.id
                      })}
                      onClick={() => handleSelectTool(t)}
                    >
                      <div className="tool-name">{t.name}</div>
                      <div className="tool-meta">
                        <span className="pill">{t.category || "Tool"}</span>
                      </div>
                      <div className="tool-desc">
                        {t.description || "No description yet."}
                      </div>
                      <div className="tool-id">id: {t.id}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </section>

        <section className="runner-panel">
          {!selectedTool ? (
            <div className="empty-state">
              <div className="empty-title">Select a tool to get started</div>
              <div className="empty-text">
                Pick any tool from the left, customise the JSON input, then hit
                <strong> Run Tool</strong>.
              </div>
            </div>
          ) : (
            <>
              <div className="runner-header">
                <div>
                  <div className="runner-tool-name">
                    {selectedTool.name || selectedTool.id}
                  </div>
                  <div className="runner-tool-id">
                    id: {selectedTool.id} • category:{" "}
                    {selectedTool.category || "Tool"}
                  </div>
                </div>
                <button
                  className="run-button"
                  disabled={running}
                  onClick={() => runTool(selectedTool.id)}
                >
                  {running ? "Running…" : "Run Tool"}
                </button>
              </div>

              <div className="split">
                <div className="pane">
                  <div className="pane-title">Input JSON</div>
                  <textarea
                    value={inputJson}
                    onChange={(e) => setInputJson(e.target.value)}
                    spellCheck="false"
                  />
                </div>
                <div className="pane">
                  <div className="pane-title">Response</div>
                  {runError && <div className="error mb-8">{runError}</div>}
                  {runResult ? (
                    <pre className="json-output">
{JSON.stringify(runResult, null, 2)}
                    </pre>
                  ) : (
                    <div className="placeholder">
                      No response yet. Run the tool to see output here.
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
