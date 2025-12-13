import React, { useState, useEffect } from "react";
import "./App.css";
import ProjectSetup from "./ProjectSetup";
import ProjectSwitcher from "./ProjectSwitcher";

const PRODUCT_SEO_TOOL = {
  id: "product-seo",
  name: "Product SEO Engine",
  category: "SEO",
  description:
    "Generate SEO titles, descriptions, slugs and keyword sets for products.",
};

// For Render we talk to the Core API on the service URL
const DEFAULT_CORE_API = "https://aura-core-monolith.onrender.com";

function App() {
  const [coreUrl, setCoreUrl] = useState(DEFAULT_CORE_API);
  const [coreStatus, setCoreStatus] = useState("idle"); // idle | checking | ok | error
  const [coreStatusLabel, setCoreStatusLabel] = useState("Not checked yet");

  // Connected project / store
  const [project, setProject] = useState(null);

  // Product inputs
  const [productTitle, setProductTitle] = useState(
    "Paperclip waterproof bracelet"
  );
  const [productDescription, setProductDescription] = useState(
    "Bold paperclip chain bracelet with a sweat-proof, waterproof coating. Adjustable fit for any wrist, perfect for everyday wear."
  );
  const [brand, setBrand] = useState("DTP Jewellery");
  const [tone, setTone] = useState("Elevated, modern, UK English");
  const [useCases, setUseCases] = useState("gym, everyday wear, gifting");

  // Output fields
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoSlug, setSeoSlug] = useState("");
  const [seoKeywords, setSeoKeywords] = useState([]);
  const [rawJson, setRawJson] = useState("");
  const [lastRunAt, setLastRunAt] = useState(null);

  // Run status
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState(null);

  // Dashboard chrome (filters etc.)
  const [activeMarket, setActiveMarket] = useState("Worldwide");
  const [activeDevice, setActiveDevice] = useState("Desktop");
  const [timeRange, setTimeRange] = useState("30d"); // 30d / 180d / all
  const [pageTab, setPageTab] = useState("Overview");

  // Simple run history for the chart + table
  const [runHistory, setRunHistory] = useState([]);

  // Suggestions for “How to reach 100/100”
  const [seoSuggestions, setSeoSuggestions] = useState([]);

  // -------------------------------------------------
  // Load project from localStorage (if already connected)
  // -------------------------------------------------
  useEffect(() => {
    const id = localStorage.getItem("auraProjectId");
    if (id) {
      setProject({
        id,
        name: localStorage.getItem("auraProjectName") || "Untitled project",
        domain: localStorage.getItem("auraProjectDomain") || "—",
        platform: localStorage.getItem("auraPlatform") || "other",
      });
    }
  }, []);

  // -------------------------------------------------
  // Health check Core API
  // -------------------------------------------------
  useEffect(() => {
    const check = async () => {
      setCoreStatus("checking");
      setCoreStatusLabel("Checking Core API …");

      try {
        const res = await fetch(`${coreUrl}/health`);
        if (!res.ok) throw new Error("Health check failed");
        setCoreStatus("ok");
        setCoreStatusLabel("Core API online • env=development");
      } catch (err) {
        console.error(err);
        setCoreStatus("error");
        setCoreStatusLabel("Core API offline — check Core server");
      }
    };

    check();
  }, [coreUrl]);

  // -------------------------------------------------
  // Score calculations (with real 100/100 band)
  // -------------------------------------------------
  const currentTitleLength = (seoTitle || productTitle).length;
  const currentMetaLength = (seoDescription || productDescription).length;

  // Title: 50–57 chars = 100, “ok band” around that = 90
  const currentTitleScore =
    currentTitleLength === 0
      ? null
      : currentTitleLength < 40
      ? 40
      : currentTitleLength > 65
      ? 60
      : currentTitleLength >= 50 && currentTitleLength <= 57
      ? 100
      : 90;

  // Meta: 135–155 chars = 100, “ok band” around that = 90
  const currentMetaScore =
    currentMetaLength === 0
      ? null
      : currentMetaLength < 120
      ? 40
      : currentMetaLength > 165
      ? 60
      : currentMetaLength >= 135 && currentMetaLength <= 155
      ? 100
      : 90;

  const overallScore =
    currentTitleScore !== null && currentMetaScore !== null
      ? Math.round((currentTitleScore + currentMetaScore) / 2)
      : null;

  // -------------------------------------------------
  // Helper: build suggestions for “How to reach 100/100”
  // -------------------------------------------------
  const buildSeoSuggestions = (titleLen, metaLen, slug) => {
    const tips = [];

    if (!titleLen || !metaLen) {
      tips.push(
        "Add a clear product title and description, then re-run the engine."
      );
      return tips;
    }

    // Title length suggestions
    if (titleLen < 50) {
      const needed = 50 - titleLen;
      tips.push(
        `Your title is a bit short. Add roughly ${needed}–${
          needed + 5
        } characters (e.g. a benefit or material) to get closer to 100/100.`
      );
    } else if (titleLen > 57) {
      const extra = titleLen - 57;
      tips.push(
        `Your title is slightly long. Trim about ${extra} characters (remove weak adjectives or duplicate words) to tighten it up.`
      );
    } else {
      tips.push(
        "Title length is in the sweet spot. Only tweak wording if you want a different angle."
      );
    }

    // Meta length suggestions
    if (metaLen < 135) {
      const needed = 135 - metaLen;
      tips.push(
        `Meta description is short. Add around ${needed}–${
          needed + 15
        } characters with clear benefits, materials or use cases.`
      );
    } else if (metaLen > 155) {
      const extra = metaLen - 155;
      tips.push(
        `Meta description is a little long. Trim about ${extra} characters so the key message fits comfortably in search results.`
      );
    } else {
      tips.push(
        "Meta description length is spot on. Focus on clarity, benefits and one strong call to action."
      );
    }

    // Slug suggestions
    if (!slug) {
      tips.push(
        "Generate a short, hyphenated slug (e.g. `waterproof-paperclip-bracelet`) so URLs are clean and readable."
      );
    } else {
      if (!/^[a-z0-9-]+$/.test(slug)) {
        tips.push(
          "Update the slug to use lowercase letters, numbers and hyphens only (no spaces or special characters)."
        );
      }
      if (slug.length > 60) {
        tips.push(
          "Your slug is quite long. Remove stop words so the URL focuses on the main keywords."
        );
      }
    }

    if (tips.length === 0) {
      tips.push(
        "Nice work — this run is already very strong. Use A/B tests on titles and descriptions if you want to chase incremental gains."
      );
    }

    return tips;
  };

  // -------------------------------------------------
  // Run Product SEO Engine
  // -------------------------------------------------
  const handleRun = async () => {
    if (!project) return;

    setIsRunning(true);
    setRunError(null);

    const payload = {
      productTitle,
      productDescription,
      brand,
      tone,
      useCases: useCases
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      const res = await fetch(`${coreUrl}/run/${PRODUCT_SEO_TOOL.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-aura-project-id": project.id,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Core API error (${res.status}): ${text || res.statusText}`
        );
      }

      const data = await res.json();
      setRawJson(JSON.stringify(data, null, 2));

      const output = data?.result?.output || data?.output || {};
      if (!output) throw new Error("No output returned from tool");

      const nextTitle = output.title || output.seoTitle || "";
      const nextDescription =
        output.description || output.metaDescription || "";
      const nextSlug = output.slug || output.handle || "";
      const nextKeywords = output.keywords || output.keywordSet || [];

      setSeoTitle(nextTitle);
      setSeoDescription(nextDescription);
      setSeoSlug(nextSlug);
      setSeoKeywords(nextKeywords);

      const now = new Date();
      setLastRunAt(now.toLocaleString());

      const tLen = (nextTitle || productTitle).length;
      const mLen = (nextDescription || productDescription).length;

      // Re-use same scoring rules for history / trend
      const tScore =
        tLen === 0
          ? null
          : tLen < 40
          ? 40
          : tLen > 65
          ? 60
          : tLen >= 50 && tLen <= 57
          ? 100
          : 90;

      const mScore =
        mLen === 0
          ? null
          : mLen < 120
          ? 40
          : mLen > 165
          ? 60
          : mLen >= 135 && mLen <= 155
          ? 100
          : 90;

      const oScore =
        tScore !== null && mScore !== null
          ? Math.round((tScore + mScore) / 2)
          : null;

      setRunHistory((prev) => {
        const next = [
          ...prev,
          {
            id: prev.length + 1,
            time: now.toLocaleString(),
            score: oScore,
            titleLength: tLen,
            metaLength: mLen,
          },
        ];
        return next.slice(-12);
      });

      // Build suggestions for the “How to reach 100/100” card
      setSeoSuggestions(buildSeoSuggestions(tLen, mLen, nextSlug));
    } catch (err) {
      console.error(err);
      setRunError(err.message || "Failed to run Product SEO Engine");
    } finally {
      setIsRunning(false);
    }
  };

  // -------------------------------------------------
  // Helpers
  // -------------------------------------------------
  const copyToClipboard = (value) => {
    if (!value) return;
    navigator.clipboard.writeText(value).catch((err) => {
      console.error("Clipboard copy failed", err);
    });
  };

  const keywordsDisplay =
    seoKeywords && Array.isArray(seoKeywords)
      ? seoKeywords.join(", ")
      : "";

  const sparkRuns =
    timeRange === "30d"
      ? runHistory.slice(-5)
      : timeRange === "180d"
      ? runHistory.slice(-8)
      : runHistory;

  const latestRun = runHistory[runHistory.length - 1];

  // -------------------------------------------------
  // Onboarding screen: no project yet
  // -------------------------------------------------
  if (!project) {
    return (
      <ProjectSetup
        coreUrl={coreUrl}
        onConnected={(proj) => setProject(proj)}
      />
    );
  }

  // -------------------------------------------------
  // Main console UI
  // -------------------------------------------------
  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className="side-nav">
        <div className="side-nav-brand">
          <div className="side-nav-avatar">A</div>
          <div className="side-nav-brand-copy">
            <span className="side-nav-eyebrow">AURA SYSTEMS AI</span>
            <span className="side-nav-title">SEO Command Centre</span>
          </div>
        </div>

        <nav className="side-nav-menu">
          <div className="side-nav-section-label">Suites</div>
          <button className="side-nav-item side-nav-item--active">
            <span className="side-nav-dot seo" />
            SEO Suite
          </button>
          <button className="side-nav-item" disabled>
            <span className="side-nav-dot cro" />
            CRO / Social
          </button>
          <button className="side-nav-item" disabled>
            <span className="side-nav-dot flows" />
            Flows &amp; Email
          </button>
          <button className="side-nav-item" disabled>
            <span className="side-nav-dot dev" />
            Developers
          </button>
        </nav>

        <ProjectSwitcher
          coreUrl={coreUrl}
          currentProject={project}
          onSelectProject={(p) => setProject(p)}
          onDisconnect={() => setProject(null)}
        />
      </aside>

      {/* MAIN AREA */}
      <main className="app-main">
        <div className="page-frame">
          {/* HEADER STRIP */}
          <header className="top-strip">
            <div className="top-strip-left">
              <div className="top-strip-eyebrow">
                Product catalogue · {PRODUCT_SEO_TOOL.category}
              </div>
              <h1 className="top-strip-title">
                {PRODUCT_SEO_TOOL.name} · {project.name}
              </h1>
              <div className="top-strip-subtitle">
                Generate SEO titles, descriptions, slugs and keyword sets for
                products. Designed so beginners never touch JSON.
              </div>
            </div>

            <div className="top-strip-right">
              <div className="core-api-block">
                <div className="core-api-label">Core API</div>
                <div className="core-api-row">
                  <input
                    className="core-api-input"
                    value={coreUrl}
                    onChange={(e) => setCoreUrl(e.target.value)}
                    spellCheck={false}
                  />
                  <button
                    className="button button--ghost core-api-refresh"
                    onClick={() => setCoreUrl((u) => u.trim())}
                  >
                    Refresh
                  </button>
                </div>

                <div
                  className={[
                    "core-status-chip",
                    coreStatus === "checking"
                      ? "core-status-chip--loading"
                      : coreStatus === "ok"
                      ? "core-status-chip--ok"
                      : coreStatus === "error"
                      ? "core-status-chip--error"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className="core-status-indicator" />
                  <span className="core-status-text">{coreStatusLabel}</span>
                </div>
              </div>

              <div className="top-strip-meta">
                <div className="top-strip-meta-label">Last run</div>
                <div className="top-strip-meta-value">
                  {lastRunAt || "Not run yet"}
                </div>
              </div>

              <button
                className="button button--primary top-strip-run"
                onClick={handleRun}
                disabled={isRunning || coreStatus !== "ok"}
              >
                {isRunning ? "Running…" : "Run Product SEO"}
              </button>
            </div>
          </header>

          {/* PAGE TABS */}
          <section className="page-tabs">
            {[
              "Overview",
              "Compare domains",
              "Growth report",
              "Compare by countries",
            ].map((tab) => (
              <button
                key={tab}
                className={
                  "page-tab" + (pageTab === tab ? " page-tab--active" : "")
                }
                onClick={() => setPageTab(tab)}
              >
                {tab}
              </button>
            ))}
          </section>

          {/* FILTER STRIP (market / device / history) */}
          <section className="filters-strip">
            <div className="filters-left">
              <div className="filters-label">Market</div>
              <div className="pill-row">
                {["Worldwide", "US", "UK", "EU"].map((market) => (
                  <button
                    key={market}
                    className={
                      "pill" +
                      (activeMarket === market ? " pill--active" : "")
                    }
                    onClick={() => setActiveMarket(market)}
                  >
                    {market}
                  </button>
                ))}
              </div>
            </div>

            <div className="filters-right">
              <div className="filters-group">
                <div className="filters-label">Device</div>
                <div className="pill-row">
                  {["Desktop", "Mobile"].map((device) => (
                    <button
                      key={device}
                      className={
                        "pill" +
                        (activeDevice === device ? " pill--active" : "")
                      }
                      onClick={() => setActiveDevice(device)}
                    >
                      {device}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filters-group">
                <div className="filters-label">Run history</div>
                <div className="pill-row">
                  <button
                    className={
                      "pill" + (timeRange === "30d" ? " pill--active" : "")
                    }
                    onClick={() => setTimeRange("30d")}
                  >
                    Last 5 runs
                  </button>
                  <button
                    className={
                      "pill" + (timeRange === "180d" ? " pill--active" : "")
                    }
                    onClick={() => setTimeRange("180d")}
                  >
                    Last 8 runs
                  </button>
                  <button
                    className={
                      "pill" + (timeRange === "all" ? " pill--active" : "")
                    }
                    onClick={() => setTimeRange("all")}
                  >
                    All runs
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* KPI ROW */}
          <section className="kpi-row">
            <div className="kpi-card">
              <div className="kpi-label">Overall SEO score</div>
              <div className="kpi-main">
                <span className="kpi-value">
                  {overallScore !== null ? `${overallScore}` : "—"}
                </span>
                <span className="kpi-unit">
                  {overallScore !== null ? "/100" : ""}
                </span>
              </div>
              <div className="kpi-footnote">
                Based on current title and meta description length.
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">Title length</div>
              <div className="kpi-main">
                <span className="kpi-value">
                  {currentTitleLength || "—"}
                </span>
                <span className="kpi-unit">characters</span>
              </div>
              <div className="kpi-target">Target: 50–57 for 100/100</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">Meta description</div>
              <div className="kpi-main">
                <span className="kpi-value">
                  {currentMetaLength || "—"}
                </span>
                <span className="kpi-unit">characters</span>
              </div>
              <div className="kpi-target">Target: 135–155 for 100/100</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">Runs recorded</div>
              <div className="kpi-main">
                <span className="kpi-value">
                  {runHistory.length || "—"}
                </span>
                <span className="kpi-unit">runs</span>
              </div>
              <div className="kpi-target">
                Latest score: {latestRun?.score ?? "—"}/100
              </div>
            </div>
          </section>

          {/* MAIN GRID */}
          <section className="main-grid">
            {/* LEFT COLUMN: tips + history + generated fields */}
            <div className="left-column">
              {/* SEO coaching card */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title-row">
                    <h2 className="card-title">How to reach 100/100</h2>
                  </div>
                  <p className="card-subtitle">
                    Practical suggestions based on your latest run. Adjust the
                    product copy on the right, then re-run the engine.
                  </p>
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "18px",
                    fontSize: "11px",
                    color: "var(--text-soft)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  {seoSuggestions.length === 0 ? (
                    <li>
                      Run Product SEO once and we&apos;ll show concrete
                      suggestions here.
                    </li>
                  ) : (
                    seoSuggestions.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))
                  )}
                </ul>
              </div>

              {/* Run history card */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title-row">
                    <h2 className="card-title">SEO run history</h2>
                    <div className="card-toggle-tabs">
                      <button className="tab tab--active">Score trend</button>
                      <button className="tab">Meta length</button>
                    </div>
                  </div>
                  <p className="card-subtitle">
                    Every time you re-run the engine, we plot a new point here.
                    Works like SEMrush charts, but for your product SEO quality.
                  </p>
                </div>

                <div className="run-history-chart">
                  {sparkRuns.length ? (
                    <div className="run-history-spark">
                      {sparkRuns.map((run) => {
                        const score = run.score ?? 0;
                        const height = 20 + (score / 100) * 60;
                        return (
                          <div
                            key={run.id}
                            className="run-history-bar"
                            style={{ height: `${height}%` }}
                            title={`Run ${run.id} • ${score || "n/a"}/100`}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="run-history-empty">
                      Run the engine a few times to see the trend over time.
                    </div>
                  )}

                  <div className="chart-x-axis">
                    {sparkRuns.map((run) => (
                      <span key={run.id}>Run {run.id}</span>
                    ))}
                  </div>
                </div>

                <div className="run-history-table-wrapper">
                  <div className="run-history-table-header">
                    <span className="run-history-table-title">Last runs</span>
                    <span className="run-history-table-subtitle">
                      Shows how your lengths and score changed per run.
                    </span>
                  </div>

                  <table className="run-history-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>When</th>
                        <th>Score</th>
                        <th>Title chars</th>
                        <th>Meta chars</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runHistory.length === 0 ? (
                        <tr>
                          <td colSpan={5}>
                            No runs yet. Click “Run Product SEO” to start
                            tracking.
                          </td>
                        </tr>
                      ) : (
                        [...runHistory]
                          .reverse()
                          .slice(0, 6)
                          .map((run) => (
                            <tr key={run.id}>
                              <td>Run {run.id}</td>
                              <td>{run.time}</td>
                              <td>{run.score ?? "—"}</td>
                              <td>{run.titleLength}</td>
                              <td>{run.metaLength}</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Generated SEO fields card */}
              <div className="card seo-table-card">
                <div className="card-header">
                  <h2 className="card-title">Generated SEO fields</h2>
                  <p className="card-subtitle">
                    Paste straight into Shopify or your platform. Use the copy
                    buttons so beginners never touch JSON.
                  </p>
                </div>

                <table className="seo-table">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Value</th>
                      <th className="actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Title</td>
                      <td>{seoTitle || "Run the engine to get a title."}</td>
                      <td>
                        <button
                          className="button button--ghost button--tiny"
                          onClick={() => copyToClipboard(seoTitle)}
                          disabled={!seoTitle}
                        >
                          Copy
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>Meta description</td>
                      <td>
                        {seoDescription ||
                          "Meta description will appear here after the first run."}
                      </td>
                      <td>
                        <button
                          className="button button--ghost button--tiny"
                          onClick={() => copyToClipboard(seoDescription)}
                          disabled={!seoDescription}
                        >
                          Copy
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>Slug / handle</td>
                      <td>
                        {seoSlug || "Suggested slug will appear here."}
                      </td>
                      <td>
                        <button
                          className="button button--ghost button--tiny"
                          onClick={() => copyToClipboard(seoSlug)}
                          disabled={!seoSlug}
                        >
                          Copy
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>Keywords</td>
                      <td>
                        {keywordsDisplay ||
                          "Keyword set will appear here after the first run."}
                      </td>
                      <td>
                        <button
                          className="button button--ghost button--tiny"
                          onClick={() => copyToClipboard(keywordsDisplay)}
                          disabled={!keywordsDisplay}
                        >
                          Copy
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <details className="raw-json">
                  <summary>Raw JSON from Core API (advanced)</summary>
                  <pre className="raw-json-pre">
                    {rawJson || "// Run the engine to see the raw JSON here."}
                  </pre>
                </details>
              </div>
            </div>

            {/* RIGHT COLUMN – Product inspector */}
            <div className="right-column">
              <div className="card inspector-card">
                <div className="card-header">
                  <h2 className="card-title">Product inspector</h2>
                  <p className="card-subtitle">
                    Step 1: describe the product in plain English. Step 2: run
                    the engine. Step 3: copy the SEO fields from the left-hand
                    table.
                  </p>
                </div>

                <div className="inspector-field-group presets-row">
                  <div className="inspector-label">Presets</div>
                  <div className="preset-chips">
                    <button
                      className="preset-chip"
                      onClick={() =>
                        setProductTitle("Waterproof gold huggie earrings")
                      }
                    >
                      Waterproof earrings
                    </button>
                    <button
                      className="preset-chip"
                      onClick={() =>
                        setProductTitle("Layered waterproof necklace set")
                      }
                    >
                      Layered necklace
                    </button>
                    <button
                      className="preset-chip"
                      onClick={() =>
                        setProductTitle("Minimal paperclip bracelet")
                      }
                    >
                      Bracelet
                    </button>
                  </div>
                </div>

                <div className="inspector-field-group">
                  <label className="inspector-label" htmlFor="title">
                    Product title
                  </label>
                  <input
                    id="title"
                    className="inspector-input"
                    value={productTitle}
                    onChange={(e) => setProductTitle(e.target.value)}
                  />
                </div>

                <div className="inspector-field-group">
                  <label className="inspector-label" htmlFor="description">
                    Product description
                  </label>
                  <textarea
                    id="description"
                    className="inspector-textarea"
                    rows={5}
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                  />
                </div>

                <div className="inspector-columns">
                  <div className="inspector-field-group">
                    <label className="inspector-label" htmlFor="brand">
                      Brand
                    </label>
                    <input
                      id="brand"
                      className="inspector-input"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                    />
                  </div>

                  <div className="inspector-field-group">
                    <label className="inspector-label" htmlFor="tone">
                      Tone &amp; voice
                    </label>
                    <input
                      id="tone"
                      className="inspector-input"
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="inspector-field-group">
                  <label className="inspector-label" htmlFor="useCases">
                    Use cases / occasions
                  </label>
                  <input
                    id="useCases"
                    className="inspector-input"
                    value={useCases}
                    onChange={(e) => setUseCases(e.target.value)}
                  />
                  <div className="field-help">
                    Comma separated. We convert this into structured context for
                    the engine.
                  </div>
                </div>

                <div className="inspector-footer">
                  <button
                    className="button button--primary inspector-run"
                    onClick={handleRun}
                    disabled={isRunning || coreStatus !== "ok"}
                  >
                    {isRunning ? "Running…" : "Run Product SEO"}
                  </button>
                  <div className="inspector-footnote">
                    SEO fields generated. Copy them from the left-hand table.
                  </div>
                </div>

                {runError && (
                  <div className="error-banner">
                    <span className="error-dot" />
                    {runError}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
