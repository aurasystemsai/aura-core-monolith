import React, { useState, useEffect } from "react";
import "./App.css";
import ProjectSetup from "./ProjectSetup";
import ProjectSwitcher from "./ProjectSwitcher";
import SystemHealthPanel from "./components/SystemHealthPanel";

const PRODUCT_SEO_TOOL = {
  id: "product-seo",
  name: "Product SEO Engine",
  category: "SEO",
  description:
    "Generate SEO titles, descriptions, slugs and keyword sets for products.",
};

// For production we always talk to the Core API on Render
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

  // AI advice (from tool output.advice)
  const [titleAdvice, setTitleAdvice] = useState("");
  const [metaAdvice, setMetaAdvice] = useState("");
  const [generalAdvice, setGeneralAdvice] = useState("");

  // Run status
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState(null);

  // Dashboard chrome (filters etc.)
  const [activeMarket, setActiveMarket] = useState("Worldwide");
  const [activeDevice, setActiveDevice] = useState("Desktop");
  const [timeRange, setTimeRange] = useState("30d"); // 30d / 180d / all
  const [pageTab, setPageTab] = useState("Overview");

  // Simple run history for the chart + table
  // Each run stores the market + device that were active at the time
  const [runHistory, setRunHistory] = useState([]);

  // Which metric to show in the chart (Score trend / Meta length)
  const [historyView, setHistoryView] = useState("score"); // "score" | "meta"

  // Ideal bands for lengths
  const TITLE_MIN = 45;
  const TITLE_MAX = 60;
  const META_MIN = 130;
  const META_MAX = 155;

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
        setCoreStatusLabel("Core API online • env=production");
      } catch (err) {
        console.error(err);
        setCoreStatus("error");
        setCoreStatusLabel("Core API offline — check Core server");
      }
    };

    check();
  }, [coreUrl]);

  // -------------------------------------------------
  // Load persisted run history from Core API (SQLite)
  // -------------------------------------------------
  useEffect(() => {
    if (!project) return;

    const fetchRuns = async () => {
      try {
        const res = await fetch(`${coreUrl}/projects/${project.id}/runs`);
        if (!res.ok) return; // fail silently

        const data = await res.json();
        if (!data.ok || !Array.isArray(data.runs)) return;

        // Map API -> local shape
        const mapped = data.runs
          .slice()
          .reverse() // oldest first for your existing ordering
          .map((run, idx) => ({
            id: idx + 1,
            time: new Date(run.createdAt).toLocaleString(),
            score: run.score ?? null,
            titleLength: run.titleLength ?? null,
            metaLength: run.metaLength ?? null,
            market: run.market || "Worldwide",
            device: run.device || "Desktop",
          }));

        setRunHistory(mapped);
      } catch (err) {
        console.error("Failed to load run history", err);
      }
    };

    fetchRuns();
  }, [project, coreUrl]);

  // -------------------------------------------------
  // Scoring helpers
  // -------------------------------------------------
  const scoreLength = (len, min, max) => {
    if (!len) return null;

    // Perfect band → 100
    if (len >= min && len <= max) return 100;

    // Distance outside the band
    const distance = len < min ? min - len : len - max;

    // Within ~10 chars either side → still pretty good
    if (distance <= 10) return 80;
    if (distance <= 20) return 65;

    // Way off
    return 40;
  };

  const currentTitleLength = (seoTitle || productTitle).length;
  const currentMetaLength = (seoDescription || productDescription).length;

  const currentTitleScore = scoreLength(
    currentTitleLength,
    TITLE_MIN,
    TITLE_MAX
  );
  const currentMetaScore = scoreLength(
    currentMetaLength,
    META_MIN,
    META_MAX
  );

  const overallScore =
    currentTitleScore !== null && currentMetaScore !== null
      ? Math.round((currentTitleScore + currentMetaScore) / 2)
      : null;

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

      // Advice from the tool
      const advice = output.advice || {};
      setTitleAdvice(advice.titleTips || "");
      setMetaAdvice(advice.metaTips || "");
      setGeneralAdvice(advice.generalTips || "");

      const now = new Date();
      const nowLabel = now.toLocaleString();
      setLastRunAt(nowLabel);

      const tLen = (nextTitle || productTitle).length;
      const mLen = (nextDescription || productDescription).length;

      const tScore = scoreLength(tLen, TITLE_MIN, TITLE_MAX);
      const mScore = scoreLength(mLen, META_MIN, META_MAX);

      const oScore =
        tScore !== null && mScore !== null
          ? Math.round((tScore + mScore) / 2)
          : null;

      // Store run with market + device so the pills actually filter something
      setRunHistory((prev) => {
        const next = [
          ...prev,
          {
            id: prev.length + 1,
            time: nowLabel,
            score: oScore,
            titleLength: tLen,
            metaLength: mLen,
            market: activeMarket,
            device: activeDevice,
          },
        ];
        // Keep only last 50 runs to avoid silly growth
        return next.slice(-50);
      });

      // Persist run to Core API (SQLite). Fire-and-forget – UI already updated.
      try {
        await fetch(`${coreUrl}/projects/${project.id}/runs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            toolId: PRODUCT_SEO_TOOL.id,
            createdAt: now.toISOString(),
            market: activeMarket,
            device: activeDevice,
            score: oScore,
            titleLength: tLen,
            metaLength: mLen,
            input: payload,
            output,
          }),
        });
      } catch (persistErr) {
        console.error("Failed to persist run", persistErr);
        // No UI error – this is just analytics
      }
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

  // Filter history by market + device first
  const historyForFilters = runHistory.filter((run) => {
    // If we ever have old runs without market/device, treat as "all"
    const runMarket = run.market || "Worldwide";
    const runDevice = run.device || "Desktop";
    return runMarket === activeMarket && runDevice === activeDevice;
  });

  // Then slice by timeRange for spark + table
  let rangedHistory;
  if (timeRange === "30d") {
    rangedHistory = historyForFilters.slice(-5);
  } else if (timeRange === "180d") {
    rangedHistory = historyForFilters.slice(-8);
  } else {
    rangedHistory = historyForFilters;
  }

  const latestRun = runHistory[runHistory.length - 1];

  // -------------------------------------------------
  // Copy for the "How to reach 100/100" helper card
  // -------------------------------------------------
  const buildTitleAdvice = () => {
    if (!currentTitleLength) {
      return "Add a clear product title first, then run the engine. Aim for 45–60 characters.";
    }
    if (currentTitleLength < TITLE_MIN) {
      const minExtra = TITLE_MIN - currentTitleLength;
      const maxExtra = TITLE_MAX - currentTitleLength;
      return `Your current title is ${currentTitleLength} characters. Try adding roughly ${minExtra}–${maxExtra} characters with materials, finish or a key benefit.`;
    }
    if (currentTitleLength > TITLE_MAX) {
      const extra = currentTitleLength - TITLE_MAX;
      return `Your current title is ${currentTitleLength} characters. It is a bit long – consider trimming around ${extra} characters so it stays punchy in search results.`;
    }
    return `Your current title is ${currentTitleLength} characters, which is right in the sweet spot. Only tweak it if it feels clunky or hard to read.`;
  };

  const buildMetaAdvice = () => {
    if (!currentMetaLength) {
      return "Write 2–3 short sentences describing benefits, materials and use cases. Aim for 130–155 characters.";
    }
    if (currentMetaLength < META_MIN) {
      const minExtra = META_MIN - currentMetaLength;
      const maxExtra = META_MAX - currentMetaLength;
      return `Your meta description is ${currentMetaLength} characters. Add around ${minExtra}–${maxExtra} characters with clear benefits, materials or occasions (e.g. gym, gifting, everyday wear).`;
    }
    if (currentMetaLength > META_MAX) {
      const extra = currentMetaLength - META_MAX;
      return `Your meta description is ${currentMetaLength} characters. It may get cut off in Google. Try removing roughly ${extra} characters or a whole extra sentence.`;
    }
    return `Your meta description is ${currentMetaLength} characters, which is on target. Focus on clarity and benefits rather than adding more words.`;
  };

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

        {/* Project picker right under the brand */}
        <div className="side-nav-project-switcher">
          <ProjectSwitcher
            coreUrl={coreUrl}
            currentProject={project}
            onSelectProject={(p) => setProject(p)}
            onDisconnect={() => setProject(null)}
          />
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

          {/* SYSTEM HEALTH PANEL */}
          <section style={{ marginTop: 10, marginBottom: 6 }}>
            <SystemHealthPanel
              coreStatus={coreStatus}
              coreStatusLabel={coreStatusLabel}
              lastRunAt={lastRunAt}
            />
          </section>

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
                      "pill" + (activeMarket === market ? " pill--active" : "")
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

          {pageTab === "Overview" ? (
            <>
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
                  <div className="kpi-target">
                    Target: {TITLE_MIN}–{TITLE_MAX}
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-label">Meta description</div>
                  <div className="kpi-main">
                    <span className="kpi-value">
                      {currentMetaLength || "—"}
                    </span>
                    <span className="kpi-unit">characters</span>
                  </div>
                  <div className="kpi-target">
                    Target: {META_MIN}–{META_MAX}
                  </div>
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

              {/* HOW TO REACH 100/100 CARD */}
              <section className="card" style={{ marginTop: 10 }}>
                <div className="card-header">
                  <h2 className="card-title">How to reach 100/100</h2>
                  <p className="card-subtitle">
                    You do not need to be an SEO expert. Follow these steps,
                    change the text on the right, then click{" "}
                    <strong>Run Product SEO</strong> again. Guidance is tuned
                    for <strong>{activeMarket}</strong> ·{" "}
                    <strong>{activeDevice}</strong>.
                  </p>
                </div>

                <ol style={{ paddingLeft: 18, fontSize: 12, margin: 0 }}>
                  <li style={{ marginBottom: 8 }}>
                    <strong>Make your product title clear.</strong>
                    <br />
                    {buildTitleAdvice()}
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    <strong>Use your meta description to sell the click.</strong>
                    <br />
                    {buildMetaAdvice()}
                  </li>
                  <li>
                    <strong>Quick beginner formula you can follow:</strong>
                    <br />
                    <span style={{ fontSize: 11 }}>
                      <code>
                        [What it is] + [1–2 big benefits] + [when to use it]
                      </code>
                      .
                      <br />
                      Example: “Waterproof paperclip bracelet with sweat-proof
                      coating. Adjustable fit for gym, everyday wear and
                      gifting.”
                    </span>
                  </li>
                </ol>
              </section>

              {/* AI SUGGESTIONS CARD */}
              <section className="card" style={{ marginTop: 10 }}>
                <div className="card-header">
                  <h2 className="card-title">AI suggestions for this product</h2>
                  <p className="card-subtitle">
                    Generated from your last run. Use this as a second opinion
                    on how to tweak the copy before you publish.
                  </p>
                </div>
                <ul style={{ fontSize: 12, paddingLeft: 18, margin: 0 }}>
                  <li>
                    <strong>Title:</strong>{" "}
                    {titleAdvice ||
                      "Run the engine to get specific tips for your title."}
                  </li>
                  <li>
                    <strong>Meta:</strong>{" "}
                    {metaAdvice ||
                      "We will suggest how to strengthen your meta description once you have run the tool at least once."}
                  </li>
                  <li>
                    <strong>Overall:</strong>{" "}
                    {generalAdvice ||
                      "General optimisation tips for this product will appear here after the first run."}
                  </li>
                </ul>
              </section>

              {/* MAIN GRID */}
              <section className="main-grid">
                {/* LEFT COLUMN: history + generated fields */}
                <div className="left-column">
                  {/* Run history card */}
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title-row">
                        <h2 className="card-title">SEO run history</h2>
                        <div className="card-toggle-tabs">
                          <button
                            className={
                              "tab" +
                              (historyView === "score" ? " tab--active" : "")
                            }
                            onClick={() => setHistoryView("score")}
                          >
                            Score trend
                          </button>
                          <button
                            className={
                              "tab" +
                              (historyView === "meta" ? " tab--active" : "")
                            }
                            onClick={() => setHistoryView("meta")}
                          >
                            Meta length
                          </button>
                        </div>
                      </div>
                      <p className="card-subtitle">
                        Every time you re-run the engine, we plot a new point
                        here. You are currently viewing{" "}
                        <strong>{activeMarket}</strong> ·{" "}
                        <strong>{activeDevice}</strong> runs only.
                      </p>
                    </div>

                    <div className="run-history-chart">
                      {rangedHistory.length ? (
                        <div className="run-history-spark">
                          {rangedHistory.map((run) => {
                            let metric;
                            if (historyView === "score") {
                              metric = run.score ?? 0;
                            } else {
                              // normalise meta length to 0–100 band for the chart
                              const length = run.metaLength || 0;
                              const clamped = Math.min(length, 220); // hard cap
                              metric = (clamped / 220) * 100;
                            }

                            const height = 20 + (metric / 100) * 60;

                            return (
                              <div
                                key={run.id}
                                className="run-history-bar"
                                style={{ height: `${height}%` }}
                                title={
                                  historyView === "score"
                                    ? `Run ${run.id} • ${run.score || "n/a"}/100`
                                    : `Run ${run.id} • meta ${run.metaLength} chars`
                                }
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className="run-history-empty">
                          No runs recorded yet for this market + device. Click
                          “Run Product SEO” to start tracking.
                        </div>
                      )}

                      <div className="chart-x-axis">
                        {rangedHistory.map((run) => (
                          <span key={run.id}>Run {run.id}</span>
                        ))}
                      </div>
                    </div>

                    <div className="run-history-table-wrapper">
                      <div className="run-history-table-header">
                        <span className="run-history-table-title">
                          Last runs
                        </span>
                        <span className="run-history-table-subtitle">
                          Shows how your lengths and score changed per run for
                          this market + device.
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
                          {rangedHistory.length === 0 ? (
                            <tr>
                              <td colSpan={5}>
                                No runs yet. Click “Run Product SEO” to start
                                tracking.
                              </td>
                            </tr>
                          ) : (
                            [...rangedHistory]
                              .slice()
                              .reverse()
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
                        Paste straight into Shopify or your platform. Use the
                        copy buttons so beginners never touch JSON.
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
                          <td>
                            {seoTitle || "Run the engine to get a title."}
                          </td>
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
                              onClick={() =>
                                copyToClipboard(keywordsDisplay)
                              }
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
                        {rawJson ||
                          "// Run the engine to see the raw JSON here."}
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
                        Step 1: describe the product in plain English. Step 2:
                        run the engine. Step 3: copy the SEO fields from the
                        left-hand table.
                      </p>
                    </div>

                    <div className="inspector-field-group presets-row">
                      <div className="inspector-label">Presets</div>
                      <div className="preset-chips">
                        <button
                          className="preset-chip"
                          onClick={() =>
                            setProductTitle(
                              "Waterproof gold huggie earrings"
                            )
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
                      <label
                        className="inspector-label"
                        htmlFor="description"
                      >
                        Product description
                      </label>
                      <textarea
                        id="description"
                        className="inspector-textarea"
                        rows={5}
                        value={productDescription}
                        onChange={(e) =>
                          setProductDescription(e.target.value)
                        }
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
                      <label
                        className="inspector-label"
                        htmlFor="useCases"
                      >
                        Use cases / occasions
                      </label>
                      <input
                        id="useCases"
                        className="inspector-input"
                        value={useCases}
                        onChange={(e) => setUseCases(e.target.value)}
                      />
                      <div className="field-help">
                        Comma separated. We convert this into structured
                        context for the engine.
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
                        SEO fields generated. Copy them from the left-hand
                        table.
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
            </>
          ) : (
            // Non-Overview tabs – simple explainer
            <section style={{ marginTop: 10 }}>
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">{pageTab}</h2>
                  <p className="card-subtitle">
                    This view is part of the AURA roadmap. You can show this to
                    clients as an upcoming feature while we focus on the Product
                    SEO Engine.
                  </p>
                </div>
                <ul style={{ fontSize: 12, paddingLeft: 18 }}>
                  {pageTab === "Compare domains" && (
                    <>
                      <li>
                        Compare your project domain against competitors on title
                        &amp; meta quality.
                      </li>
                      <li>
                        See who wins on click-through potential in{" "}
                        {activeMarket} for {activeDevice.toLowerCase()}.
                      </li>
                      <li>
                        Export a simple action list you can plug straight into
                        Shopify.
                      </li>
                    </>
                  )}
                  {pageTab === "Growth report" && (
                    <>
                      <li>
                        Track how your average product SEO score moves over
                        time.
                      </li>
                      <li>
                        Spot weeks where titles/meta dropped below target so you
                        can fix them quickly.
                      </li>
                      <li>
                        Perfect for monthly reports you send to brands.
                      </li>
                    </>
                  )}
                  {pageTab === "Compare by countries" && (
                    <>
                      <li>
                        See which markets (US / UK / EU / Worldwide) are best
                        optimised for your catalogue.
                      </li>
                      <li>
                        Plan localisation work – which regions need better copy,
                        currency cues or spelling.
                      </li>
                      <li>
                        Future versions will auto-translate product SEO for each
                        region.
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
