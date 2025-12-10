import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

// ---- Tool metadata (names, categories, default payloads) ----

const TOOL_DEFS = [
  {
    id: "product-seo",
    name: "Product SEO Engine",
    category: "SEO",
    description: "Optimise product titles, descriptions and tags for search.",
    defaultPayload: {
      path: "/run",
      payload: {
        storeUrl: "https://example-shop.myshopify.com",
        productHandle: "example-product",
        language: "en",
        depth: "full"
      }
    }
  },
  {
    id: "review-ugc-engine",
    name: "Review & UGC Engine",
    category: "Retention",
    description: "Turn reviews and UGC into conversion-focused assets.",
    defaultPayload: {
      path: "/run",
      payload: {
        storeUrl: "https://example-shop.myshopify.com",
        productHandle: "example-product",
        reviewText: "Customer review text goes here"
      }
    }
  },
  {
    id: "image-alt-media-seo",
    name: "Image Alt & Media SEO",
    category: "SEO",
    description: "Generate SEO-friendly alt text and media descriptions.",
    defaultPayload: {
      path: "/run",
      payload: {
        imageUrl: "https://example.com/image.jpg",
        context: "Gold waterproof bracelet on model"
      }
    }
  },
  {
    id: "internal-link-optimizer",
    name: "Internal Link Optimiser",
    category: "SEO",
    description: "Recommend internal links between products, blogs and collections.",
    defaultPayload: {
      path: "/run",
      payload: {
        storeUrl: "https://example-shop.myshopify.com",
        targetUrl: "/products/example-product",
        maxSuggestions: 10
      }
    }
  },
  {
    id: "technical-seo-auditor",
    name: "Technical SEO Auditor",
    category: "Technical",
    description: "Lightweight crawl of a URL to highlight technical SEO issues.",
    defaultPayload: {
      path: "/run",
      payload: {
        url: "https://example-shop.myshopify.com",
        depth: 1
      }
    }
  },
  {
    id: "schema-rich-results-engine",
    name: "Schema & Rich Results Engine",
    category: "Technical",
    description: "Generate JSON-LD for products, FAQ, articles and more.",
    defaultPayload: {
      path: "/run",
      payload: {
        type: "product",
        url: "https://example-shop.myshopify.com/products/example-product"
      }
    }
  },
  {
    id: "email-automation-builder",
    name: "Email Automation Builder",
    category: "Retention",
    description: "Draft automated Klaviyo / email journeys from store events.",
    defaultPayload: {
      path: "/run",
      payload: {
        flowType: "post_purchase",
        brandName: "Example Brand",
        tone: "friendly"
      }
    }
  },
  {
    id: "ai-alt-text-engine",
    name: "AI Alt-Text Engine",
    category: "SEO",
    description: "Generate alt text for product imagery at scale.",
    defaultPayload: {
      path: "/run",
      payload: {
        imageUrl: "https://example.com/image.jpg",
        brand: "Example Brand"
      }
    }
  }
  // Any remaining tools from /tools will still show,
  // they’ll just fall back to generic descriptions.
];

// ---- Helpers ----

const storageKey = "aura-console-base-url";

function getInitialBaseUrl() {
  const envDefault = import.meta.env.VITE_CORE_API_BASE_URL || "";
  if (typeof window === "undefined") return envDefault;
  const stored = window.localStorage.getItem(storageKey);
  return stored || envDefault;
}

function prettyJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

// ---- Main Component ----

export default function App() {
  const [baseUrl, setBaseUrl] = useState(getInitialBaseUrl);
  const [tools, setTools] = useState([]);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [toolsError, setToolsError] = useState("");
  const [coreStatus, setCoreStatus] = useState("idle"); // idle | online | offline

  const [selectedToolId, setSelectedToolId] = useState(null);
  const [inputJson, setInputJson] = useState("{\n  \"path\": \"/run\",\n  \"payload\": {}\n}");
  const [outputJson, setOutputJson] = useState("");
  const [runnerError, setRunnerError] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const [search, setSearch] = useState("");

  // Persist base URL
  useEffect(() => {
    if (typeof window !== "undefined" && baseUrl) {
      window.localStorage.setItem(storageKey, baseUrl);
    }
  }, [baseUrl]);

  // Fetch tools from Core API
  async function refreshTools() {
    if (!baseUrl) {
      setToolsError("Enter a Core API base URL first.");
      setCoreStatus("offline");
      return;
    }

    setIsLoadingTools(true);
    setToolsError("");
    setCoreStatus("idle");

    try {
      const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/tools`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const list = Array.isArray(data.tools) ? data.tools : [];
      setTools(list);
      setCoreStatus("online");
    } catch (err) {
      setTools([]);
      setToolsError(`Failed to fetch tools: ${err.message || String(err)}`);
      setCoreStatus("offline");
    } finally {
      setIsLoadingTools(false);
    }
  }

  // Auto-refresh on first load if baseUrl exists
  useEffect(() => {
    if (baseUrl) {
      refreshTools();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Map API tools → with local metadata
  const mergedTools = useMemo(() => {
    return tools.map((t) => {
      const local = TOOL_DEFS.find((d) => d.id === t.id);
      return {
        ...t,
        displayName: local?.name || t.id,
        category: local?.category || "Uncategorised",
        description: local?.description || "No description yet.",
        defaultPayload: local?.defaultPayload || {
          path: "/run",
          payload: { example: "value" }
        }
      };
    });
  }, [tools]);

  const groupedTools = useMemo(() => {
    const filtered = mergedTools.filter((t) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.displayName.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });

    const map = new Map();
    for (const tool of filtered) {
      const cat = tool.category || "Uncategorised";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(tool);
    }
    return Array.from(map.entries());
  }, [mergedTools, search]);

  const selectedTool = useMemo(
    () => mergedTools.find((t) => t.id === selectedToolId) || null,
    [mergedTools, selectedToolId]
  );

  function handleSelectTool(tool) {
    setSelectedToolId(tool.id);
    setRunnerError("");
    setOutputJson("");
    setInputJson(prettyJson(tool.defaultPayload));
  }

  async function handleRunTool() {
    if (!baseUrl) {
      setRunnerError("Enter a Core API base URL first.");
      return;
    }
    if (!selectedTool) {
      setRunnerError("Select a tool from the left first.");
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(inputJson);
    } catch (err) {
      setRunnerError(`Invalid JSON input: ${err.message}`);
      return;
    }

    setIsRunning(true);
    setRunnerError("");
    setOutputJson("");

    try {
      const res = await fetch(
        `${baseUrl.replace(/\/+$/, "")}/tools/${encodeURIComponent(selectedTool.id)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed)
        }
      );

      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        json = { raw: text };
      }

      if (!res.ok) {
        setRunnerError(
          `Tool returned ${res.status}. See response payload for details.`
        );
      }

      setOutputJson(prettyJson(json));
    } catch (err) {
      setRunnerError(`Request failed: ${err.message || String(err)}`);
    } finally {
      setIsRunning(false);
    }
  }

  const coreStatusLabel =
    coreStatus === "online"
      ? "Core API online"
      : coreStatus === "offline"
      ? "Core API offline"
      : "Status unknown";

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="branding">
          <div className="logo">AURA SYSTEMS</div>
          <div className="title">Automation Console</div>
          <div className="subtitle">
            Run and test AURA tools from a single interface.
          </div>
        </div>

        <div className="core-status">
          <div className="label">Core API Base URL</div>

          <div className="base-row">
            <input
              type="text"
              placeholder="https://aura-core-monolith.onrender.com"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
            <button type="button" onClick={refreshTools} disabled={isLoadingTools}>
              {isLoadingTools ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          <div className="status-row">
            <span
              className={clsx("status-dot", {
                online: coreStatus === "online"
              })}
            />
            <span>
              {coreStatusLabel}
              {mergedTools.length > 0
                ? ` • ${mergedTools.length} tools available`
                : ""}
            </span>
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {toolsError && <div className="error">{toolsError}</div>}
          {!toolsError && coreStatus !== "online" && (
            <div className="notice">
              Enter your Core API URL, hit Refresh and select a tool to begin.
            </div>
          )}

          {groupedTools.length === 0 && coreStatus === "online" && !toolsError && (
            <div className="empty-state">
              <div className="empty-title">No tools found</div>
              <div className="empty-text">
                Your Core API responded but didn&apos;t return any tools from
                <code> /tools</code>.
              </div>
            </div>
          )}

          {groupedTools.map(([category, list]) => (
            <div key={category} className="category-block">
              <div className="category-title">{category}</div>
              <div className="tool-grid">
                {list.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    className={clsx("tool-card", {
                      selected: selectedToolId === tool.id
                    })}
                    onClick={() => handleSelectTool(tool)}
                  >
                    <div className="tool-meta">
                      <div className="tool-name">{tool.displayName}</div>
                      <div className="pill">{tool.category}</div>
                    </div>
                    <div className="tool-desc">{tool.description}</div>
                    <div className="tool-id">id: {tool.id}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Runner panel */}
        <section className="runner-panel">
          {selectedTool ? (
            <>
              <div className="runner-header">
                <div>
                  <div className="runner-tool-name">
                    {selectedTool.displayName}
                  </div>
                  <div className="runner-tool-id">id: {selectedTool.id}</div>
                </div>
                <button
                  type="button"
                  className="run-button"
                  onClick={handleRunTool}
                  disabled={isRunning}
                >
                  {isRunning ? "Running…" : "Run Tool"}
                </button>
              </div>

              <div className="split">
                <div className="pane">
                  <div className="pane-title">Request JSON</div>
                  <textarea
                    value={inputJson}
                    onChange={(e) => setInputJson(e.target.value)}
                    spellCheck={false}
                  />
                </div>
                <div className="pane">
                  <div className="pane-title">Response</div>
                  {outputJson ? (
                    <pre className="json-output">{outputJson}</pre>
                  ) : (
                    <div className="placeholder">
                      Run the tool to see the response JSON here.
                    </div>
                  )}
                </div>
              </div>

              {runnerError && <div className="error" style={{ marginTop: 10 }}>{runnerError}</div>}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-title">Select a tool to get started</div>
              <div className="empty-text">
                Pick any tool from the left, customise the JSON input, then hit{" "}
                <strong>Run Tool</strong>.
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
