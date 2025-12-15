// aura-console/src/App.jsx
// ------------------------------------------------------------------
// AURA Systems • SEO Command Centre
// Product SEO, Blog SEO, Weekly Blog Content Engine + Blog Draft Engine
// ------------------------------------------------------------------

import React, { useState } from "react";

const CORE_API_BASE =
  import.meta.env.VITE_CORE_API_BASE ||
  "https://aura-core-monolith.onrender.com";

// Generic helper to call any AURA Core tool
async function runTool(toolId, input) {
  const res = await fetch(`${CORE_API_BASE}/api/tools/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ toolId, input }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Core API error (${res.status}): ${text || "No error body returned"}`
    );
  }

  const data = await res.json();
  return data;
}

// Simple stat card component
function StatCard({ label, value, sub }) {
  return (
    <div className="flex flex-col rounded-2xl bg-slate-900/70 border border-slate-800 px-4 py-3 min-w-[150px]">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-2xl font-semibold text-slate-50 mt-1">
        {value ?? "—"}
      </span>
      {sub && (
        <span className="text-[11px] text-slate-500 mt-0.5 whitespace-nowrap">
          {sub}
        </span>
      )}
    </div>
  );
}

function App() {
  const [activeTool, setActiveTool] = useState("product-seo");

  // Shared state bits
  const [isRunning, setIsRunning] = useState(false);
  const [lastError, setLastError] = useState("");

  // Product SEO
  const [productInput, setProductInput] = useState({
    title: "",
    description: "",
    brand: "DTP Jewellery",
    tone: "Elevated, modern, UK English",
    useCases: "gym, everyday wear, gifting",
  });
  const [productResult, setProductResult] = useState(null);

  // Blog SEO (single article)
  const [blogSeoInput, setBlogSeoInput] = useState({
    title: "",
    intro: "",
    brand: "DTP Jewellery",
    tone: "Elevated, modern, UK English",
    mainTopics: "gym, everyday wear, gifting",
  });
  const [blogSeoResult, setBlogSeoResult] = useState(null);

  // Weekly blog content engine
  const [weeklyInput, setWeeklyInput] = useState({
    brand: "DTP Jewellery",
    niche: "Waterproof everyday jewellery and gifting",
    audience: "UK women 18–34 who want affordable waterproof jewellery",
    cadence: "2 posts per week",
    tone: "Elevated, warm, UK English",
    themes: "product education, styling tips, gifting ideas, lifestyle stories",
  });
  const [weeklyResult, setWeeklyResult] = useState(null);

  // Blog draft engine
  const [draftInput, setDraftInput] = useState({
    title: "",
    primaryKeyword: "",
    summary: "",
    brand: "DTP Jewellery",
    tone: "Elevated, warm, UK English",
  });
  const [draftResult, setDraftResult] = useState(null);

  // Simple score helpers (so UI doesn’t explode if API shape changes)
  const productScore =
    productResult?.output?.score ?? productResult?._score ?? "—";
  const productTitleChars =
    productResult?.output?._debug?.titleChars ??
    productResult?.output?.title?.length ??
    "—";
  const productMetaChars =
    productResult?.output?._debug?.metaChars ??
    productResult?.output?.metaDescription?.length ??
    "—";

  const blogSeoScore =
    blogSeoResult?.output?.score ?? blogSeoResult?._score ?? "—";
  const blogSeoTitleChars =
    blogSeoResult?.output?._debug?.titleChars ??
    blogSeoResult?.output?.title?.length ??
    "—";
  const blogSeoMetaChars =
    blogSeoResult?.output?._debug?.metaChars ??
    blogSeoResult?.output?.metaDescription?.length ??
    "—";

  const weeklyScore =
    weeklyResult?.output?.score ?? weeklyResult?._score ?? "—";

  const draftWordCount =
    draftResult?.output?.estimatedWordCount ??
    draftResult?.output?.wordCount ??
    "—";

  // ------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------

  async function handleRunProductSeo() {
    setIsRunning(true);
    setLastError("");
    setProductResult(null);

    try {
      const payload = {
        productTitle: productInput.title,
        productDescription: productInput.description,
        brand: productInput.brand,
        tone: productInput.tone,
        useCases: productInput.useCases
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const data = await runTool("product-seo", payload);
      setProductResult(data);
    } catch (err) {
      console.error(err);
      setLastError(err.message || "Failed to run Product SEO");
    } finally {
      setIsRunning(false);
    }
  }

  async function handleRunBlogSeo() {
    setIsRunning(true);
    setLastError("");
    setBlogSeoResult(null);

    try {
      const payload = {
        blogTitle: blogSeoInput.title,
        blogIntro: blogSeoInput.intro,
        brand: blogSeoInput.brand,
        tone: blogSeoInput.tone,
        topics: blogSeoInput.mainTopics
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const data = await runTool("blog-seo", payload);
      setBlogSeoResult(data);
    } catch (err) {
      console.error(err);
      setLastError(err.message || "Failed to run Blog SEO");
    } finally {
      setIsRunning(false);
    }
  }

  async function handleRunWeeklyPlan() {
    setIsRunning(true);
    setLastError("");
    setWeeklyResult(null);

    try {
      const payload = {
        brand: weeklyInput.brand,
        niche: weeklyInput.niche,
        targetAudience: weeklyInput.audience,
        cadence: weeklyInput.cadence,
        tone: weeklyInput.tone,
        mainThemes: weeklyInput.themes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const data = await runTool("weekly-blog-content-engine", payload);
      setWeeklyResult(data);
    } catch (err) {
      console.error(err);
      setLastError(err.message || "Failed to run Weekly Blog Content Engine");
    } finally {
      setIsRunning(false);
    }
  }

  async function handleRunBlogDraft() {
    setIsRunning(true);
    setLastError("");
    setDraftResult(null);

    try {
      const payload = {
        title: draftInput.title,
        primaryKeyword: draftInput.primaryKeyword,
        summary: draftInput.summary,
        brand: draftInput.brand,
        tone: draftInput.tone,
      };

      const data = await runTool("blog-draft-engine", payload);
      setDraftResult(data);
    } catch (err) {
      console.error(err);
      setLastError(err.message || "Failed to run Blog Draft Engine");
    } finally {
      setIsRunning(false);
    }
  }

  // ------------------------------------------------------------------
  // Render helpers for tools
  // ------------------------------------------------------------------

  function renderHeaderTitle() {
    switch (activeTool) {
      case "product-seo":
        return "Product SEO Engine · aura";
      case "blog-seo":
        return "Blog SEO Engine · aura";
      case "weekly-blog":
        return "Weekly Blog Content Engine · aura";
      case "blog-draft":
        return "Blog Draft Engine · aura";
      default:
        return "SEO Command Centre · aura";
    }
  }

  function renderToolTabs() {
    const tabs = [
      { id: "product-seo", label: "Product SEO" },
      { id: "blog-seo", label: "Blog SEO" },
      { id: "weekly-blog", label: "Weekly blog plan" },
      { id: "blog-draft", label: "Blog draft" },
    ];

    return (
      <div className="inline-flex rounded-full bg-slate-900/70 border border-slate-800 p-1 text-sm">
        {tabs.map((tab) => {
          const isActive = activeTool === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTool(tab.id)}
              className={`px-4 py-1.5 rounded-full font-medium transition ${
                isActive
                  ? "bg-cyan-400 text-slate-900 shadow"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  }

  function renderProductSeoPanel() {
    const out = productResult?.output || {};

    return (
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: inspector */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-50 mb-2">
            Product inspector
          </h2>

          <label className="block text-sm text-slate-300">
            Product title
            <textarea
              className="mt-1 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50 resize-none"
              rows={2}
              value={productInput.title}
              onChange={(e) =>
                setProductInput({ ...productInput, title: e.target.value })
              }
            />
          </label>

          <label className="block text-sm text-slate-300">
            Product description
            <textarea
              className="mt-1 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50 resize-y min-h-[96px]"
              rows={4}
              value={productInput.description}
              onChange={(e) =>
                setProductInput({
                  ...productInput,
                  description: e.target.value,
                })
              }
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block text-xs text-slate-300">
              Brand / site
              <input
                className="mt-1 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50"
                value={productInput.brand}
                onChange={(e) =>
                  setProductInput({ ...productInput, brand: e.target.value })
                }
              />
            </label>
            <label className="block text-xs text-slate-300 md:col-span-2">
              Tone &amp; voice
              <input
                className="mt-1 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50"
                value={productInput.tone}
                onChange={(e) =>
                  setProductInput({ ...productInput, tone: e.target.value })
                }
              />
            </label>
          </div>

          <label className="block text-xs text-slate-300">
            Main use cases / angles
            <input
              className="mt-1 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50"
              placeholder="gym, everyday wear, gifting"
              value={productInput.useCases}
              onChange={(e) =>
                setProductInput({ ...productInput, useCases: e.target.value })
              }
            />
            <span className="text-[11px] text-slate-500">
              Comma separated. We convert these to keyword clusters.
            </span>
          </label>

          <button
            onClick={handleRunProductSeo}
            disabled={isRunning}
            className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-900 font-semibold text-sm hover:opacity-90 disabled:opacity-60"
          >
            {isRunning ? "Running Product SEO…" : "Run Product SEO"}
          </button>
        </div>

        {/* Right: results */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-50 mb-1">
            Generated SEO fields
          </h2>
          <div className="flex flex-wrap gap-3 mb-2">
            <StatCard
              label="Overall SEO score"
              value={productScore}
              sub="/100"
            />
            <StatCard
              label="Title length"
              value={productTitleChars}
              sub="Target: 45–60"
            />
            <StatCard
              label="Meta description"
              value={productMetaChars}
              sub="Target: 130–155"
            />
          </div>

          <div className="text-sm text-slate-200 space-y-3">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase">
                Title
              </div>
              <div className="mt-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2">
                {out.title || "Run Product SEO to generate."}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase">
                Meta description
              </div>
              <div className="mt-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2">
                {out.metaDescription || "We’ll generate this once you run."}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase">
                  Slug / handle
                </div>
                <div className="mt-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2">
                  {out.slug || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase">
                  Keywords
                </div>
                <div className="mt-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-xs">
                  {Array.isArray(out.keywords) && out.keywords.length
                    ? out.keywords.join(", ")
                    : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderBlogSeoPanel() {
    const out = blogSeoResult?.output || {};

    return (
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: inspector */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-50 mb-2">
            Blog article inspector
          </h2>

          <label className="block text-sm text-slate-300">
            Blog post title
            <textarea
              className="mt-1 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50 resize-none"
              rows={2}
              value={blogSeoInput.title}
              onChange={(e) =>
                setBlogSeoInput({ ...blogSeoInput, title: e.target.value })
              }
            />
          </label>

          <label className="block text-sm text-slate-300">
            Blog summary / intro
            <textarea
              className="mt-1 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50 resize-y min-h-[96px]"
              rows={4}
              value={blogSeoInput.intro}
              onChange={(e) =>
                setBlogSeoInput({ ...blogSeoInput, intro: e.target.value })
              }
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block text-xs text-slate-300">
              Brand / site
              <input
                className="mt-1 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50"
                value={blogSeoInput.brand}
                onChange={(e) =>
                  setBlogSeoInput({ ...blogSeoInput, brand: e.target.value })
                }
              />
            </label>
            <label className="block text-xs text-slate-300 md:col-span-2">
              Tone &amp; voice
              <input
                className="mt-1 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50"
                value={blogSeoInput.tone}
                onChange={(e) =>
                  setBlogSeoInput({ ...blogSeoInput, tone: e.target.value })
                }
              />
            </label>
          </div>

          <label className="block text-xs text-slate-300">
            Main topics / angles
            <input
              className="mt-1 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50"
              placeholder="gym, everyday wear, gifting"
              value={blogSeoInput.mainTopics}
              onChange={(e) =>
                setBlogSeoInput({
                  ...blogSeoInput,
                  mainTopics: e.target.value,
                })
              }
            />
          </label>

          <button
            onClick={handleRunBlogSeo}
            disabled={isRunning}
            className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-900 font-semibold text-sm hover:opacity-90 disabled:opacity-60"
          >
            {isRunning ? "Running Blog SEO…" : "Run Blog SEO"}
          </button>
        </div>

        {/* Right: results */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-50 mb-1">
            Generated SEO fields
          </h2>
          <div className="flex flex-wrap gap-3 mb-2">
            <StatCard label="Overall SEO score" value={blogSeoScore} sub="/100" />
            <StatCard
              label="Title length"
              value={blogSeoTitleChars}
              sub="Target: 45–60"
            />
            <StatCard
              label="Meta description"
              value={blogSeoMetaChars}
              sub="Target: 130–155"
            />
          </div>

          <div className="text-sm text-slate-200 space-y-3">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase">
                Title
              </div>
              <div className="mt-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2">
                {out.title || "Run Blog SEO to generate."}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase">
                Meta description
              </div>
              <div className="mt-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2">
                {out.metaDescription || "We’ll generate this once you run."}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase">
                  Slug
                </div>
                <div className="mt-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2">
                  {out.slug || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase">
                  Keywords
                </div>
                <div className="mt-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-xs">
                  {Array.isArray(out.keywords) && out.keywords.length
                    ? out.keywords.join(", ")
                    : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderWeeklyPanel() {
    const out = weeklyResult?.output || {};
    const plan =
      out.plan || out.rows || out.posts || []; // try a few field names
    const summary = out.summary || out.overview || "";

    return (
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: planner */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-50 mb-2">
            Weekly blog planner
          </h2>

          <label className="block text-xs text-slate-300">
            Brand / site
            <input
              className="mt-1 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50"
              value={weeklyInput.brand}
              onChange={(e) =>
                setWeeklyInput({ ...weeklyInput, brand: e.target.value })
              }
            />
          </label>

          <label className="block text-xs text-slate-300">
            Niche / topic
            <input
              className="mt-1 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50"
              value={weeklyInput.niche}
              onChange={(e) =>
                setWeeklyInput({ ...weeklyInput, niche: e.target.value })
              }
            />
          </label>

          <label className="block text-xs text-slate-300">
            Target audience
            <input
              className="mt-1 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50"
              value={weeklyInput.audience}
              onChange={(e) =>
                setWeeklyInput({ ...weeklyInput, audience: e.target.value })
              }
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-xs text-slate-300">
              Cadence
              <input
                className="mt-1 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50"
                value={weeklyInput.cadence}
                onChange={(e) =>
                  setWeeklyInput({ ...weeklyInput, cadence: e.target.value })
                }
              />
            </label>
            <label className="block text-xs text-slate-300">
              Tone &amp; voice
              <input
                className="mt-1 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50"
                value={weeklyInput.tone}
                onChange={(e) =>
                  setWeeklyInput({ ...weeklyInput, tone: e.target.value })
                }
              />
            </label>
          </div>

          <label className="block text-xs text-slate-300">
            Main themes / angles
            <input
              className="mt-1 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50"
              value={weeklyInput.themes}
              onChange={(e) =>
                setWeeklyInput({ ...weeklyInput, themes: e.target.value })
              }
            />
            <span className="text-[11px] text-slate-500">
              Comma separated. We’ll mix these into the weekly schedule.
            </span>
          </label>

          <button
            onClick={handleRunWeeklyPlan}
            disabled={isRunning}
            className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-900 font-semibold text-sm hover:opacity-90 disabled:opacity-60"
          >
            {isRunning ? "Running Weekly plan…" : "Run Weekly plan"}
          </button>
        </div>

        {/* Right: results */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-50 mb-1">
            Weekly blog plan (generated)
          </h2>

          <div className="flex flex-wrap gap-3">
            <StatCard
              label="Overall SEO score"
              value={weeklyScore}
              sub="/100"
            />
          </div>

          {summary && (
            <p className="mt-2 text-sm text-slate-300">{summary}</p>
          )}

          <div className="mt-3 overflow-x-auto border border-slate-800 rounded-xl">
            <table className="min-w-full text-sm text-left text-slate-200">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-3 py-2 w-8">#</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Main angle / summary</th>
                  <th className="px-3 py-2">Primary keyword</th>
                  <th className="px-3 py-2">Slug</th>
                  <th className="px-3 py-2">Suggested date</th>
                </tr>
              </thead>
              <tbody>
                {plan.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-4 text-center text-slate-500"
                    >
                      Run the Weekly plan to generate your next batch of posts.
                    </td>
                  </tr>
                )}
                {plan.map((row, idx) => (
                  <tr
                    key={idx}
                    className={
                      idx % 2 === 0 ? "bg-slate-900/60" : "bg-slate-900/30"
                    }
                  >
                    <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium text-slate-50">
                      {row.title}
                    </td>
                    <td className="px-3 py-2 text-slate-200">
                      {row.summary || row.mainAngle || row.angle}
                    </td>
                    <td className="px-3 py-2 text-slate-200">
                      {row.primaryKeyword || row.keyword}
                    </td>
                    <td className="px-3 py-2 text-slate-200">{row.slug}</td>
                    <td className="px-3 py-2 text-slate-200">
                      {row.suggestedDate || row.suggested_day || row.day}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function renderDraftPanel() {
    const out = draftResult?.output || {};

    return (
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: draft request */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-50 mb-2">
            Blog draft inspector
          </h2>

          <label className="block text-sm text-slate-300">
            Blog title / topic
            <textarea
              className="mt-1 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50 resize-none"
              rows={2}
              value={draftInput.title}
              onChange={(e) =>
                setDraftInput({ ...draftInput, title: e.target.value })
              }
            />
          </label>

          <label className="block text-xs text-slate-300">
            Primary keyword
            <input
              className="mt-1 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50"
              value={draftInput.primaryKeyword}
              onChange={(e) =>
                setDraftInput({
                  ...draftInput,
                  primaryKeyword: e.target.value,
                })
              }
            />
          </label>

          <label className="block text-sm text-slate-300">
            Angle / summary you want
            <textarea
              className="mt-1 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50 resize-y min-h-[80px]"
              value={draftInput.summary}
              onChange={(e) =>
                setDraftInput({ ...draftInput, summary: e.target.value })
              }
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block text-xs text-slate-300">
              Brand / site
              <input
                className="mt-1 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50"
                value={draftInput.brand}
                onChange={(e) =>
                  setDraftInput({ ...draftInput, brand: e.target.value })
                }
              />
            </label>
            <label className="block text-xs text-slate-300 md:col-span-2">
              Tone &amp; voice
              <input
                className="mt-1 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50"
                value={draftInput.tone}
                onChange={(e) =>
                  setDraftInput({ ...draftInput, tone: e.target.value })
                }
              />
            </label>
          </div>

          <button
            onClick={handleRunBlogDraft}
            disabled={isRunning}
            className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-900 font-semibold text-sm hover:opacity-90 disabled:opacity-60"
          >
            {isRunning ? "Generating draft…" : "Generate blog draft"}
          </button>
        </div>

        {/* Right: draft output */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-50 mb-1">
            Generated blog draft
          </h2>

          <div className="flex flex-wrap gap-3">
            <StatCard
              label="Estimated word count"
              value={draftWordCount}
              sub="Approx."
            />
          </div>

          <div className="mt-3 text-sm text-slate-200 space-y-3">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase">
                SEO title
              </div>
              <div className="mt-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2">
                {out.title || "Run the draft engine to generate."}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase">
                Meta description
              </div>
              <div className="mt-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2">
                {out.metaDescription || out.description || "—"}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase mb-1">
                Article HTML
              </div>
              <div className="bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 max-h-[420px] overflow-y-auto text-sm prose prose-invert prose-slate">
                {out.articleHtml ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: out.articleHtml }}
                  />
                ) : (
                  <span className="text-slate-500">
                    When you run the Blog Draft Engine, the full article HTML
                    will appear here. Paste directly into your CMS, or export
                    via API later.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderActiveTool() {
    switch (activeTool) {
      case "product-seo":
        return renderProductSeoPanel();
      case "blog-seo":
        return renderBlogSeoPanel();
      case "weekly-blog":
        return renderWeeklyPanel();
      case "blog-draft":
        return renderDraftPanel();
      default:
        return renderProductSeoPanel();
    }
  }

  // ------------------------------------------------------------------
  // Root layout
  // ------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex">
      {/* Left sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-slate-950 border-r border-slate-900 px-5 py-6 gap-8">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-slate-950 font-bold text-lg">
            A
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
              AURA Systems AI
            </div>
            <div className="text-sm font-semibold text-slate-100">
              SEO Command Centre
            </div>
          </div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-2">
            Suites
          </div>
          <nav className="space-y-1 text-sm">
            <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 text-cyan-400 font-medium">
              <span>SEO Suite</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </button>
            <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-900/60">
              <span>CRO / Social</span>
              <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
            </button>
            <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-900/60">
              <span>Flows &amp; Email</span>
              <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
            </button>
            <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-900/60">
              <span>Developers</span>
              <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
            </button>
          </nav>
        </div>

        <div className="mt-auto text-[11px] text-slate-500">
          Connected project
          <div className="mt-1 text-xs text-slate-300">aura</div>
          <div className="text-[11px] text-slate-500">
            aurasystemsai.com (production)
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        <header className="border-b border-slate-900 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Content · SEO / Planning
            </div>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-50">
              {renderHeaderTitle()}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Generate SEO titles, descriptions, slugs and content plans so
              beginners never touch JSON.
            </p>
          </div>

          <div className="flex flex-col md:items-end gap-2">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Core API online · env=production</span>
              </div>
              {renderToolTabs()}
            </div>
            {lastError && (
              <div className="text-[11px] text-rose-300 bg-rose-950/40 border border-rose-900 rounded-md px-2 py-1 max-w-md">
                {lastError}
              </div>
            )}
          </div>
        </header>

        <div className="px-6 pb-10 pt-6 overflow-y-auto">
          {renderActiveTool()}
        </div>
      </main>
    </div>
  );
}

export default App;
