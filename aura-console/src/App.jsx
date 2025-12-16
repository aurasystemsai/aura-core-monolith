// aura-console/src/App.jsx
import React, { useState, useEffect } from "react";
import "./App.css";
import ProjectSetup from "./ProjectSetup";
import ProjectSwitcher from "./ProjectSwitcher";
import SystemHealthPanel from "./components/SystemHealthPanel";
import DraftLibrary from "./components/DraftLibrary";

const DEFAULT_CORE_API = "https://aura-core-monolith.onrender.com";

// Single place to define engines used by the console
const ENGINES = {
  product: {
    key: "product",
    toolId: "product-seo",
    name: "Product SEO Engine",
    suitePrefix: "Product catalogue · SEO",
    runButtonLabel: "Run Product SEO",
    chipLabel: "Product SEO",
    inspectorTitle: "Product inspector",
    inspectorSubtitle:
      "Step 1: describe the product in plain English. Step 2: run the engine. Step 3: copy the SEO fields from the left-hand table.",
    lengthTitleLabel: "Title length",
    lengthTitleHelper: "Your current product title is",
  },
  blog: {
    key: "blog",
    toolId: "blog-seo",
    name: "Blog SEO Engine",
    suitePrefix: "Content · SEO",
    runButtonLabel: "Run Blog SEO",
    chipLabel: "Blog SEO",
    inspectorTitle: "Blog article inspector",
    inspectorSubtitle:
      "Step 1: describe the blog post in plain English. Step 2: run the engine. Step 3: copy the SEO fields from the left-hand table into your CMS.",
    lengthTitleLabel: "Title length",
    lengthTitleHelper: "Your current blog post title is",
  },
  draft: {
    key: "draft",
    toolId: "blog-draft-engine",
    name: "Blog Draft Engine",
    suitePrefix: "Content · Planning",
    runButtonLabel: "Run Blog draft",
    chipLabel: "Blog draft",
    inspectorTitle: "Blog draft brief",
    inspectorSubtitle:
      "Describe who the post is for and what it should cover. We’ll generate a ready-to-paste blog draft with sections and a CTA.",
    lengthTitleLabel: "Title length",
    lengthTitleHelper: "Your current blog draft title is",
  },
  weekly: {
    key: "weekly",
    toolId: "weekly-blog-content-engine",
    name: "Weekly Blog Content Engine",
    suitePrefix: "Content · Planning",
    runButtonLabel: "Run Weekly plan",
    chipLabel: "Weekly blog plan",
    inspectorTitle: "Weekly blog planner",
    inspectorSubtitle:
      "Describe your niche, audience and cadence. We’ll generate a simple weekly content plan you can plug straight into your CMS.",
    lengthTitleLabel: "Avg. title length",
    lengthTitleHelper: "Average planned post title length is",
  },
};

function App() {
  // Core API + health
  const [coreUrl, setCoreUrl] = useState(DEFAULT_CORE_API);
  const [coreStatus, setCoreStatus] = useState("idle"); // idle | checking | ok | error
  const [coreStatusLabel, setCoreStatusLabel] = useState("Not checked yet");

  // Connected project / store
  const [project, setProject] = useState(null);

  // Which engine is active in the UI
  const [activeEngine, setActiveEngine] = useState("product");
  const currentEngine = ENGINES[activeEngine];

  // Product / blog single-piece inputs
  const [productTitle, setProductTitle] = useState(
    "Paperclip waterproof bracelet"
  );
  const [productDescription, setProductDescription] = useState(
    "Bold paperclip chain bracelet with a sweat-proof, waterproof coating. Adjustable fit for any wrist, perfect for everyday wear."
  );
  const [brand, setBrand] = useState("DTP Jewellery");
  const [tone, setTone] = useState("Elevated, modern, UK English");
  const [useCases, setUseCases] = useState("gym, everyday wear, gifting");

  // Weekly planner inputs
  const [weeklyBrand, setWeeklyBrand] = useState("DTP Jewellery");
  const [weeklyNiche, setWeeklyNiche] = useState(
    "Waterproof everyday jewellery and gifting"
  );
  const [weeklyAudience, setWeeklyAudience] = useState(
    "UK women 18–34 who want affordable waterproof jewellery"
  );
  const [weeklyCadence, setWeeklyCadence] = useState("2 posts per week");
  const [weeklyThemes, setWeeklyThemes] = useState(
    "product education, styling tips, gifting ideas, lifestyle stories"
  );
  const [weeklyTone, setWeeklyTone] = useState("Elevated, warm, UK English");

  // Output fields (single-piece engines)
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoSlug, setSeoSlug] = useState("");
  const [seoKeywords, setSeoKeywords] = useState([]);
  const [rawJson, setRawJson] = useState("");
  const [lastRunAt, setLastRunAt] = useState(null);

  // Weekly plan output
  const [weeklySummary, setWeeklySummary] = useState("");
  const [weeklyPosts, setWeeklyPosts] = useState([]);

  // Blog draft specific output
  const [draftSections, setDraftSections] = useState([]);
  const [draftCta, setDraftCta] = useState("");
  const [draftWordCount, setDraftWordCount] = useState(null);
  const [draftHtml, setDraftHtml] = useState("");
  const [draftText, setDraftText] = useState("");
  const [draftFormat, setDraftFormat] = useState("text"); // "text" | "html"

  // AI advice (from tool output.advice for product/blog)
  const [titleAdvice, setTitleAdvice] = useState("");
  const [metaAdvice, setMetaAdvice] = useState("");
  const [generalAdvice, setGeneralAdvice] = useState("");

  // Run status
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState(null);

  // Dashboard chrome
  const [activeMarket, setActiveMarket] = useState("Worldwide");
  const [activeDevice, setActiveDevice] = useState("Desktop");
  const [timeRange, setTimeRange] = useState("30d"); // 30d / 180d / all
  const [pageTab, setPageTab] = useState("Overview");

  // Simple run history (shared across engines, filtered later)
  const [runHistory, setRunHistory] = useState([]);
  const [historyView, setHistoryView] = useState("score"); // "score" | "meta"

  // Ideal bands
  const TITLE_MIN = 45;
  const TITLE_MAX = 60;
  const META_MIN = 130;
  const META_MAX = 155;

  const isProduct = activeEngine === "product";
  const isBlogSeo = activeEngine === "blog";
  const isDraft = activeEngine === "draft";
  const isWeekly = activeEngine === "weekly";
  const isBlogLike = isBlogSeo || isDraft;
  const pieceLabel = isProduct
    ? "product"
    : isWeekly
    ? "content plan"
    : "blog post";

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
        if (!res.ok) return;
        const data = await res.json();
        if (!data.ok || !Array.isArray(data.runs)) return;

        const mapped = data.runs
          .slice()
          .reverse()
          .map((run, idx) => ({
            id: idx + 1,
            time: new Date(run.createdAt).toLocaleString(),
            score: run.score ?? null,
            titleLength: run.titleLength ?? null,
            metaLength: run.metaLength ?? null,
            market: run.market || "Worldwide",
            device: run.device || "Desktop",
            toolId: run.toolId || "product-seo",
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
    if (len >= min && len <= max) return 100;
    const distance = len < min ? min - len : len - max;
    if (distance <= 10) return 80;
    if (distance <= 20) return 65;
    return 40;
  };

  // Current lengths depend on engine
  let currentTitleLength = 0;
  let currentMetaLength = 0;

  if (isWeekly && weeklyPosts.length) {
    const titleLens = weeklyPosts.map((p) => (p.title || "").length);
    const metaLens = weeklyPosts.map(
      (p) => (p.metaDescription || p.description || "").length
    );
    const avg = (arr) =>
      arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    currentTitleLength = avg(titleLens);
    currentMetaLength = avg(metaLens);
  } else {
    currentTitleLength = (seoTitle || productTitle).length;
    currentMetaLength = (seoDescription || productDescription).length;
  }

  const currentTitleScore = scoreLength(
    currentTitleLength,
    TITLE_MIN,
    TITLE_MAX
  );
  const currentMetaScore = scoreLength(currentMetaLength, META_MIN, META_MAX);

  const overallScore =
    currentTitleScore !== null && currentMetaScore !== null
      ? Math.round((currentTitleScore + currentMetaScore) / 2)
      : null;

  // -------------------------------------------------
  // Helpers: formatting + auto-save drafts
  // -------------------------------------------------
  const slugify = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  };

  const buildWeeklyText = (summary, posts) => {
    const lines = [];
    lines.push(`# Weekly plan`);
    if (summary) lines.push(`\n${summary}\n`);
    lines.push(`\n## Posts\n`);
    (posts || []).forEach((p, idx) => {
      lines.push(
        `\n${idx + 1}. ${p.title || "Untitled"}`
      );
      if (p.primaryKeyword || p.keyword) {
        lines.push(`   - Keyword: ${p.primaryKeyword || p.keyword}`);
      }
      if (p.slug || p.handle) {
        lines.push(`   - Slug: ${p.slug || p.handle}`);
      }
      if (p.metaDescription || p.description) {
        lines.push(
          `   - Meta: ${p.metaDescription || p.description}`
        );
      }
      if (p.angle || p.summary) {
        lines.push(`   - Angle: ${p.angle || p.summary}`);
      }
      if (p.suggestedDate || p.date) {
        lines.push(`   - Date: ${p.suggestedDate || p.date}`);
      }
    });
    return lines.join("\n");
  };

  const buildWeeklyHtml = (summary, posts) => {
    const esc = (s) =>
      String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const rows = (posts || [])
      .map((p, idx) => {
        return `<tr>
<td>${idx + 1}</td>
<td>${esc(p.title || "Untitled")}</td>
<td>${esc(p.primaryKeyword || p.keyword || "")}</td>
<td>${esc(p.slug || p.handle || "")}</td>
<td>${esc(p.metaDescription || p.description || "")}</td>
<td>${esc(p.angle || p.summary || "")}</td>
<td>${esc(p.suggestedDate || p.date || "")}</td>
</tr>`;
      })
      .join("\n");

    return `<h1>Weekly plan</h1>
${summary ? `<p>${esc(summary)}</p>` : ""}
<table>
<thead>
<tr>
<th>#</th><th>Title</th><th>Keyword</th><th>Slug</th><th>Meta</th><th>Angle</th><th>Date</th>
</tr>
</thead>
<tbody>
${rows || `<tr><td colspan="7">No posts generated.</td></tr>`}
</tbody>
</table>`;
  };

  const autoSaveDraftToCore = async ({
    toolId,
    createdAtIso,
    title,
    slug,
    metaDescription,
    primaryKeyword,
    input,
    output,
    articleText,
    articleHtml,
  }) => {
    if (!project?.id) return;

    const body = {
      toolId: toolId || "unknown",
      createdAt: createdAtIso || new Date().toISOString(),
      title: title || null,
      slug: slug || null,
      metaDescription: metaDescription || null,
      primaryKeyword: primaryKeyword || null,
      input: input || null,
      output: output || null,
      articleText: articleText || null,
      articleHtml: articleHtml || null,
    };

    // Fire-and-forget, but we still want errors in console
    try {
      const res = await fetch(`${coreUrl}/projects/${project.id}/drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `Draft save failed (${res.status}): ${text || res.statusText}`
        );
      }
    } catch (err) {
      console.error("[Console] Auto-save draft failed", err);
    }
  };

  // -------------------------------------------------
  // Run engine
  // -------------------------------------------------
  const handleRun = async () => {
    if (!project) return;

    setIsRunning(true);
    setRunError(null);

    const toolId = currentEngine.toolId;

    let payload;
    if (isWeekly) {
      // Weekly Blog Content Engine payload
      payload = {
        brand: weeklyBrand,
        niche: weeklyNiche,
        audience: weeklyAudience,
        cadence: weeklyCadence,
        themes: weeklyThemes,
        tone: weeklyTone,
        market: activeMarket,
      };
    } else if (isDraft) {
      // Blog Draft Engine payload – MUST include blogTitle
      const topics = useCases
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      payload = {
        blogTitle: productTitle,
        blogSummary: productDescription,
        brand,
        tone,
        topics,
        market: activeMarket,
      };
    } else {
      // Product SEO / Blog SEO payload
      payload = {
        productTitle,
        productDescription,
        brand,
        tone,
        useCases: useCases
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        market: activeMarket,
      };
    }

    try {
      const res = await fetch(`${coreUrl}/run/${toolId}`, {
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

      const now = new Date();
      const nowIso = now.toISOString();
      const nowLabel = now.toLocaleString();
      setLastRunAt(nowLabel);

      let tLen = 0;
      let mLen = 0;
      let oScore = null;

      // -------------------------------------------------
      // Weekly
      // -------------------------------------------------
      if (isWeekly) {
        const posts = Array.isArray(output.posts) ? output.posts : [];
        setWeeklySummary(output.summary || "");
        setWeeklyPosts(posts);

        // Clear draft-specific fields when running weekly
        setDraftSections([]);
        setDraftCta("");
        setDraftWordCount(null);
        setDraftHtml("");
        setDraftText("");
        setDraftFormat("text");

        if (posts.length) {
          const titleLens = posts.map((p) => (p.title || "").length);
          const metaLens = posts.map(
            (p) => (p.metaDescription || p.description || "").length
          );
          const avg = (arr) =>
            arr.length
              ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
              : 0;
          tLen = avg(titleLens);
          mLen = avg(metaLens);
        }

        const tScore = scoreLength(tLen, TITLE_MIN, TITLE_MAX);
        const mScore = scoreLength(mLen, META_MIN, META_MAX);
        oScore =
          tScore !== null && mScore !== null
            ? Math.round((tScore + mScore) / 2)
            : null;

        // AUTO-SAVE (weekly plan as a draft record)
        const weeklyTitle = `Weekly plan · ${weeklyBrand || "Brand"} · ${now
          .toISOString()
          .slice(0, 10)}`;
        const weeklySlug = slugify(weeklyTitle);
        const weeklyText = buildWeeklyText(output.summary || "", posts);
        const weeklyHtml = buildWeeklyHtml(output.summary || "", posts);

        await autoSaveDraftToCore({
          toolId,
          createdAtIso: nowIso,
          title: weeklyTitle,
          slug: weeklySlug,
          metaDescription:
            (output.summary || "").slice(0, 240) || "Weekly content plan",
          primaryKeyword: (posts?.[0]?.primaryKeyword ||
            posts?.[0]?.keyword ||
            "")?.toString(),
          input: payload,
          output,
          articleText: weeklyText,
          articleHtml: weeklyHtml,
        });
      } else {
        // -------------------------------------------------
        // Product SEO / Blog SEO / Draft
        // -------------------------------------------------
        const nextTitle = output.title || output.seoTitle || "";
        const nextDescription =
          output.description ||
          output.metaDescription ||
          output.metaDescription ||
          "";
        const nextSlug = output.slug || output.handle || "";
        const nextKeywords =
          output.keywords ||
          output.keywordSet ||
          (output.primaryKeyword ? [output.primaryKeyword] : []);

        setSeoTitle(nextTitle);
        setSeoDescription(nextDescription);
        setSeoSlug(nextSlug);
        setSeoKeywords(Array.isArray(nextKeywords) ? nextKeywords : []);

        const advice = output.advice || {};
        setTitleAdvice(advice.titleTips || "");
        setMetaAdvice(advice.metaTips || "");
        setGeneralAdvice(advice.generalTips || "");

        // Blog draft specific mapping
        let saveArticleText = null;
        let saveArticleHtml = null;

        if (toolId === "blog-draft-engine") {
          setDraftSections(
            Array.isArray(output.sections) ? output.sections : []
          );
          setDraftCta(output.cta || "");
          setDraftWordCount(
            typeof output.estimatedWordCount === "number"
              ? output.estimatedWordCount
              : null
          );
          setDraftHtml(output.articleHtml || "");
          setDraftText(output.articleText || "");
          setDraftFormat("text");

          saveArticleText = output.articleText || "";
          saveArticleHtml = output.articleHtml || "";
        } else {
          setDraftSections([]);
          setDraftCta("");
          setDraftWordCount(null);
          setDraftHtml("");
          setDraftText("");
          setDraftFormat("text");

          // For non-draft engines: save a clean summary as articleText/Html
          const summaryTitle =
            nextTitle || productTitle || `${toolId} run · ${nowIso.slice(0, 10)}`;
          const summarySlug = nextSlug || slugify(summaryTitle);
          const summaryMeta =
            nextDescription ||
            `Generated SEO fields for ${summaryTitle}`.slice(0, 155);

          saveArticleText = [
            `# ${summaryTitle}`,
            ``,
            `Tool: ${toolId}`,
            `Market: ${activeMarket}`,
            `Device: ${activeDevice}`,
            ``,
            `## SEO Fields`,
            `- Title: ${nextTitle || ""}`,
            `- Meta: ${nextDescription || ""}`,
            `- Slug: ${summarySlug || ""}`,
            `- Primary keyword: ${output.primaryKeyword || (Array.isArray(nextKeywords) ? nextKeywords[0] : "") || ""}`,
            `- Keywords: ${
              Array.isArray(nextKeywords) ? nextKeywords.join(", ") : ""
            }`,
          ].join("\n");

          const esc = (s) =>
            String(s || "")
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");

          saveArticleHtml = `<h1>${esc(summaryTitle)}</h1>
<p><strong>Tool:</strong> ${esc(toolId)}<br/>
<strong>Market:</strong> ${esc(activeMarket)}<br/>
<strong>Device:</strong> ${esc(activeDevice)}</p>
<h2>SEO Fields</h2>
<ul>
<li><strong>Title:</strong> ${esc(nextTitle)}</li>
<li><strong>Meta:</strong> ${esc(nextDescription)}</li>
<li><strong>Slug:</strong> ${esc(summarySlug)}</li>
<li><strong>Primary keyword:</strong> ${esc(
            output.primaryKeyword ||
              (Array.isArray(nextKeywords) ? nextKeywords[0] : "") ||
              ""
          )}</li>
<li><strong>Keywords:</strong> ${esc(
            Array.isArray(nextKeywords) ? nextKeywords.join(", ") : ""
          )}</li>
</ul>`;
        }

        tLen = (nextTitle || productTitle).length;
        mLen = (nextDescription || productDescription).length;

        const tScore = scoreLength(tLen, TITLE_MIN, TITLE_MAX);
        const mScore = scoreLength(mLen, META_MIN, META_MAX);

        oScore =
          tScore !== null && mScore !== null
            ? Math.round((tScore + mScore) / 2)
            : null;

        // AUTO-SAVE (every engine)
        const safeTitle =
          (toolId === "blog-draft-engine" ? (output.blogTitle || nextTitle) : nextTitle) ||
          productTitle ||
          `${toolId} run · ${nowIso.slice(0, 10)}`;

        const safeSlug =
          nextSlug || slugify(safeTitle) || `run-${nowIso.slice(0, 10)}`;

        const primaryKeyword =
          output.primaryKeyword ||
          (Array.isArray(nextKeywords) ? nextKeywords[0] : "") ||
          "";

        await autoSaveDraftToCore({
          toolId,
          createdAtIso: nowIso,
          title: safeTitle,
          slug: safeSlug,
          metaDescription:
            nextDescription ||
            output.metaDescription ||
            output.description ||
            "",
          primaryKeyword: String(primaryKeyword || ""),
          input: payload,
          output,
          articleText: saveArticleText,
          articleHtml: saveArticleHtml,
        });
      }

      // Record in in-memory history
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
            toolId,
          },
        ];
        return next.slice(-50);
      });

      // Persist run to Core API (SQLite) – fire-and-forget
      try {
        await fetch(`${coreUrl}/projects/${project.id}/runs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            toolId,
            createdAt: nowIso,
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
      }
    } catch (err) {
      console.error(err);
      setRunError(err.message || "Failed to run engine");
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
    seoKeywords && Array.isArray(seoKeywords) ? seoKeywords.join(", ") : "";

  // Filter history by engine + market + device
  const historyForFilters = runHistory.filter((run) => {
    const runMarket = run.market || "Worldwide";
    const runDevice = run.device || "Desktop";
    const runToolId = run.toolId || "product-seo";
    return (
      runMarket === activeMarket &&
      runDevice === activeDevice &&
      runToolId === currentEngine.toolId
    );
  });

  let rangedHistory;
  if (timeRange === "30d") {
    rangedHistory = historyForFilters.slice(-5);
  } else if (timeRange === "180d") {
    rangedHistory = historyForFilters.slice(-8);
  } else {
    rangedHistory = historyForFilters;
  }

  const latestRun = historyForFilters[historyForFilters.length - 1];

  const buildTitleAdvice = () => {
    const label = isProduct ? "product" : isWeekly ? "content plan" : "blog post";
    if (!currentTitleLength) {
      return `Add a clear ${label} title first, then run the engine. Aim for 45–60 characters.`;
    }
    if (currentTitleLength < TITLE_MIN) {
      const minExtra = TITLE_MIN - currentTitleLength;
      const maxExtra = TITLE_MAX - currentTitleLength;
      return `Your current ${label} title is ${currentTitleLength} characters. Try adding roughly ${minExtra}–${maxExtra} characters with materials, finish or a key benefit.`;
    }
    if (currentTitleLength > TITLE_MAX) {
      const extra = currentTitleLength - TITLE_MAX;
      return `Your current ${label} title is ${currentTitleLength} characters. It is a bit long – consider trimming around ${extra} characters so it stays punchy in search results.`;
    }
    return `Your current ${label} title is ${currentTitleLength} characters, which is right in the sweet spot. Only tweak it if it feels clunky or hard to read.`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (!project) {
    return (
      <ProjectSetup coreUrl={coreUrl} onConnected={(proj) => setProject(proj)} />
    );
  }

  return (
    <div className="app-shell">
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

      <main className="app-main">
        <div className="page-frame">
          <header className="top-strip">
            <div className="top-strip-left">
              <div className="top-strip-eyebrow">{currentEngine.suitePrefix}</div>
              <h1 className="top-strip-title">
                {currentEngine.name} · {project.name}
              </h1>
              <div className="top-strip-subtitle">
                {isWeekly
                  ? "Generate a simple weekly content plan with SEO-ready titles, descriptions and angles. Designed so beginners never touch JSON."
                  : "Generate SEO titles, descriptions, slugs and keyword sets so beginners never touch JSON."}
              </div>

              <div className="engine-toggle-row">
                {Object.values(ENGINES).map((engine) => (
                  <button
                    key={engine.key}
                    className={
                      "engine-toggle" +
                      (activeEngine === engine.key ? " engine-toggle--active" : "")
                    }
                    onClick={() => setActiveEngine(engine.key)}
                  >
                    {engine.chipLabel}
                  </button>
                ))}
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
                <div className="top-strip-meta-value">{lastRunAt || "Not run yet"}</div>
              </div>

              <button
                className="button button--primary top-strip-run"
                onClick={handleRun}
                disabled={isRunning || coreStatus !== "ok"}
              >
                {isRunning ? "Running…" : currentEngine.runButtonLabel}
              </button>
            </div>
          </header>

          <section style={{ marginTop: 10, marginBottom: 6 }}>
            <SystemHealthPanel />
          </section>

          <section className="page-tabs">
            {[
              "Overview",
              "Draft Library",
              "Compare domains",
              "Growth report",
              "Compare by countries",
            ].map((tab) => (
              <button
                key={tab}
                className={"page-tab" + (pageTab === tab ? " page-tab--active" : "")}
                onClick={() => setPageTab(tab)}
              >
                {tab}
              </button>
            ))}
          </section>

          <section className="filters-strip">
            <div className="filters-left">
              <div className="filters-label">Market</div>
              <div className="pill-row">
                {["Worldwide", "US", "UK", "EU"].map((market) => (
                  <button
                    key={market}
                    className={"pill" + (activeMarket === market ? " pill--active" : "")}
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
                      className={"pill" + (activeDevice === device ? " pill--active" : "")}
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
                    className={"pill" + (timeRange === "30d" ? " pill--active" : "")}
                    onClick={() => setTimeRange("30d")}
                  >
                    Last 5 runs
                  </button>
                  <button
                    className={"pill" + (timeRange === "180d" ? " pill--active" : "")}
                    onClick={() => setTimeRange("180d")}
                  >
                    Last 8 runs
                  </button>
                  <button
                    className={"pill" + (timeRange === "all" ? " pill--active" : "")}
                    onClick={() => setTimeRange("all")}
                  >
                    All runs
                  </button>
                </div>
              </div>
            </div>
          </section>

          {pageTab === "Draft Library" ? (
            <section style={{ marginTop: 10 }}>
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Draft Library</h2>
                  <p className="card-subtitle">
                    Saved runs and drafts for this project (stored in Core SQLite).
                    Export as plain text or HTML.
                  </p>
                </div>

                <DraftLibrary coreUrl={coreUrl} projectId={project.id} />
              </div>
            </section>
          ) : pageTab === "Overview" ? (
            <>
              <section className="kpi-row">
                <div className="kpi-card">
                  <div className="kpi-label">Overall SEO score</div>
                  <div className="kpi-main">
                    <span className="kpi-value">{overallScore !== null ? `${overallScore}` : "—"}</span>
                    <span className="kpi-unit">{overallScore !== null ? "/100" : ""}</span>
                  </div>
                  <div className="kpi-footnote">Based on current title and meta description length.</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-label">{currentEngine.lengthTitleLabel}</div>
                  <div className="kpi-main">
                    <span className="kpi-value">{currentTitleLength || "—"}</span>
                    <span className="kpi-unit">characters</span>
                  </div>
                  <div className="kpi-target">
                    Target: {TITLE_MIN}–{TITLE_MAX}
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-label">Meta description</div>
                  <div className="kpi-main">
                    <span className="kpi-value">{currentMetaLength || "—"}</span>
                    <span className="kpi-unit">characters</span>
                  </div>
                  <div className="kpi-target">
                    Target: {META_MIN}–{META_MAX}
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-label">Runs recorded</div>
                  <div className="kpi-main">
                    <span className="kpi-value">{historyForFilters.length || "—"}</span>
                    <span className="kpi-unit">runs</span>
                  </div>
                  <div className="kpi-target">
                    Latest score: {latestRun?.score ?? "—"}/100
                  </div>
                </div>
              </section>

              <section className="card" style={{ marginTop: 10 }}>
                <div className="card-header">
                  <h2 className="card-title">How to reach 100/100</h2>
                  <p className="card-subtitle">
                    You do not need to be an SEO expert. Follow these steps, change the text on the right, then click{" "}
                    <strong>{currentEngine.runButtonLabel}</strong> again. Guidance is tuned for{" "}
                    <strong>{activeMarket}</strong> · <strong>{activeDevice}</strong>.
                  </p>
                </div>

                <ol style={{ paddingLeft: 18, fontSize: 12, margin: 0 }}>
                  <li style={{ marginBottom: 8 }}>
                    <strong>Make your title clear.</strong>
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
                      <code>[What it is] + [1–2 big benefits] + [when / who it is for]</code>.
                      <br />
                      Example: “Waterproof paperclip bracelet with sweat-proof coating. Adjustable fit for gym, everyday wear and gifting.”
                    </span>
                  </li>
                </ol>
              </section>

              <section className="card" style={{ marginTop: 10 }}>
                <div className="card-header">
                  <h2 className="card-title">AI suggestions for this {pieceLabel}</h2>
                  <p className="card-subtitle">
                    Generated from your last run. Use this as a second opinion on how to tweak the copy before you publish.
                  </p>
                </div>
                <ul style={{ fontSize: 12, paddingLeft: 18, margin: 0 }}>
                  <li>
                    <strong>Title:</strong>{" "}
                    {titleAdvice || "Run the engine to get specific tips for your title."}
                  </li>
                  <li>
                    <strong>Meta:</strong>{" "}
                    {metaAdvice ||
                      "We will suggest how to strengthen your meta description once you have run the tool at least once."}
                  </li>
                  <li>
                    <strong>Overall:</strong>{" "}
                    {generalAdvice || "General optimisation tips for this piece will appear here after the first run."}
                  </li>
                </ul>
              </section>

              <section className="main-grid">
                <div className="left-column">
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title-row">
                        <h2 className="card-title">SEO run history</h2>
                        <div className="card-toggle-tabs">
                          <button
                            className={"tab" + (historyView === "score" ? " tab--active" : "")}
                            onClick={() => setHistoryView("score")}
                          >
                            Score trend
                          </button>
                          <button
                            className={"tab" + (historyView === "meta" ? " tab--active" : "")}
                            onClick={() => setHistoryView("meta")}
                          >
                            Meta length
                          </button>
                        </div>
                      </div>
                      <p className="card-subtitle">
                        Every time you re-run the engine, we plot a new point here. You are currently viewing{" "}
                        <strong>{activeMarket}</strong> · <strong>{activeDevice}</strong> runs for{" "}
                        <strong>{currentEngine.chipLabel}</strong> only.
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
                              const length = run.metaLength || 0;
                              const clamped = Math.min(length, 220);
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
                          No runs recorded yet for this engine / market / device. Click “{currentEngine.runButtonLabel}”
                          to start tracking.
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
                        <span className="run-history-table-title">Last runs</span>
                        <span className="run-history-table-subtitle">
                          Shows how your lengths and score changed per run for this engine / market / device.
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
                                No runs yet. Click "{currentEngine.runButtonLabel}" to start tracking.
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

                  {isWeekly ? (
                    <div className="card seo-table-card">
                      <div className="card-header">
                        <h2 className="card-title">Weekly blog plan (generated)</h2>
                        <p className="card-subtitle">
                          Paste this straight into your CMS or Notion. Titles and meta descriptions are already tuned for search.
                        </p>
                      </div>

                      {weeklySummary && <p style={{ fontSize: 12, marginBottom: 12 }}>{weeklySummary}</p>}

                      <table className="seo-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Title</th>
                            <th>Main angle / summary</th>
                            <th>Primary keyword</th>
                            <th>Slug</th>
                            <th>Suggested date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {weeklyPosts.length === 0 ? (
                            <tr>
                              <td colSpan={6}>Run the Weekly blog planner to generate your next batch of posts.</td>
                            </tr>
                          ) : (
                            weeklyPosts.map((post, idx) => (
                              <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{post.title || "—"}</td>
                                <td>{post.angle || post.summary || post.metaDescription || "—"}</td>
                                <td>{post.primaryKeyword || post.keyword || "—"}</td>
                                <td>{post.slug || post.handle || "—"}</td>
                                <td>{post.suggestedDate || post.date || "—"}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <>
                      <div className="card seo-table-card">
                        <div className="card-header">
                          <h2 className="card-title">Generated SEO fields</h2>
                          <p className="card-subtitle">
                            Paste straight into Shopify or your platform. Use the copy buttons so beginners never touch JSON.
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
                              <td>{seoDescription || "Meta description will appear here after the first run."}</td>
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
                              <td>{seoSlug || "Suggested slug will appear here."}</td>
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
                              <td>{keywordsDisplay || "Keyword set will appear here after the first run."}</td>
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

                      {isDraft && (
                        <div className="card seo-table-card" style={{ marginTop: 10 }}>
                          <div className="card-header">
                            <h2 className="card-title">Draft article (generated)</h2>
                            <p className="card-subtitle">
                              Copy this into your CMS editor. Default is plain text. HTML is optional if your editor supports it.
                            </p>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: 24,
                              fontSize: 12,
                              marginBottom: 12,
                              flexWrap: "wrap",
                            }}
                          >
                            <div>
                              <div style={{ opacity: 0.7 }}>Estimated word count</div>
                              <div style={{ fontWeight: 600 }}>
                                {draftWordCount != null ? draftWordCount : "—"}
                              </div>
                            </div>
                            <div style={{ flex: 1, minWidth: 200 }}>
                              <div style={{ opacity: 0.7 }}>CTA</div>
                              <div style={{ fontWeight: 500 }}>
                                {draftCta || "CTA will appear here after the first run."}
                              </div>
                            </div>
                          </div>

                          <div style={{ marginBottom: 12 }}>
                            <h3 className="card-title" style={{ fontSize: 13, marginBottom: 4, marginTop: 0 }}>
                              Outline
                            </h3>
                            {draftSections.length === 0 ? (
                              <p style={{ fontSize: 12 }}>
                                Run the Blog Draft Engine to generate section headings and summaries.
                              </p>
                            ) : (
                              <table className="seo-table">
                                <thead>
                                  <tr>
                                    <th>#</th>
                                    <th>Section heading</th>
                                    <th>Summary</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {draftSections.map((section, idx) => {
                                    const heading =
                                      typeof section === "string"
                                        ? section
                                        : section.heading || section.title || "Section";
                                    const summary =
                                      typeof section === "string"
                                        ? "—"
                                        : section.summary ||
                                          section.description ||
                                          (Array.isArray(section.bullets)
                                            ? section.bullets.join(" · ")
                                            : "—");
                                    return (
                                      <tr key={idx}>
                                        <td>{idx + 1}</td>
                                        <td>{heading}</td>
                                        <td>{summary}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>

                          <div>
                            <h3 className="card-title" style={{ fontSize: 13, marginBottom: 4, marginTop: 0 }}>
                              Full article
                            </h3>

                            <div className="field-help" style={{ marginBottom: 6 }}>
                              Choose the format you want to copy. Plain text is best for most editors. HTML is there if you need it.
                            </div>

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                              <button
                                className={"pill" + (draftFormat === "text" ? " pill--active" : "")}
                                onClick={() => setDraftFormat("text")}
                                type="button"
                              >
                                Plain text
                              </button>
                              <button
                                className={"pill" + (draftFormat === "html" ? " pill--active" : "")}
                                onClick={() => setDraftFormat("html")}
                                type="button"
                              >
                                HTML
                              </button>

                              <button
                                className="button button--ghost button--tiny"
                                onClick={() => copyToClipboard(draftFormat === "html" ? draftHtml : draftText)}
                                disabled={draftFormat === "html" ? !draftHtml : !draftText}
                                type="button"
                              >
                                Copy {draftFormat === "html" ? "HTML" : "text"}
                              </button>
                            </div>

                            <pre className="raw-json-pre" style={{ marginTop: 6 }}>
                              {draftFormat === "html"
                                ? draftHtml || "// Run the Blog Draft Engine to generate the article HTML here."
                                : draftText || "// Run the Blog Draft Engine to generate the article text here."}
                            </pre>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="right-column">
                  <div className="card inspector-card">
                    <div className="card-header">
                      <h2 className="card-title">{currentEngine.inspectorTitle}</h2>
                      <p className="card-subtitle">{currentEngine.inspectorSubtitle}</p>
                    </div>

                    {isWeekly ? (
                      <>
                        <div className="inspector-field-group">
                          <label className="inspector-label" htmlFor="wBrand">
                            Brand / site
                          </label>
                          <input
                            id="wBrand"
                            className="inspector-input"
                            value={weeklyBrand}
                            onChange={(e) => setWeeklyBrand(e.target.value)}
                          />
                        </div>

                        <div className="inspector-field-group">
                          <label className="inspector-label" htmlFor="wNiche">
                            Niche / topic
                          </label>
                          <input
                            id="wNiche"
                            className="inspector-input"
                            value={weeklyNiche}
                            onChange={(e) => setWeeklyNiche(e.target.value)}
                          />
                        </div>

                        <div className="inspector-field-group">
                          <label className="inspector-label" htmlFor="wAudience">
                            Target audience
                          </label>
                          <input
                            id="wAudience"
                            className="inspector-input"
                            value={weeklyAudience}
                            onChange={(e) => setWeeklyAudience(e.target.value)}
                          />
                        </div>

                        <div className="inspector-columns">
                          <div className="inspector-field-group">
                            <label className="inspector-label" htmlFor="wCadence">
                              Cadence
                            </label>
                            <input
                              id="wCadence"
                              className="inspector-input"
                              value={weeklyCadence}
                              onChange={(e) => setWeeklyCadence(e.target.value)}
                            />
                          </div>

                          <div className="inspector-field-group">
                            <label className="inspector-label" htmlFor="wTone">
                              Tone &amp; voice
                            </label>
                            <input
                              id="wTone"
                              className="inspector-input"
                              value={weeklyTone}
                              onChange={(e) => setWeeklyTone(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="inspector-field-group">
                          <label className="inspector-label" htmlFor="wThemes">
                            Main themes / angles
                          </label>
                          <input
                            id="wThemes"
                            className="inspector-input"
                            value={weeklyThemes}
                            onChange={(e) => setWeeklyThemes(e.target.value)}
                          />
                          <div className="field-help">
                            Comma separated. We will mix these into the weekly schedule (e.g. product education, styling tips, gifting).
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="inspector-field-group presets-row">
                          <div className="inspector-label">Presets</div>
                          <div className="preset-chips">
                            <button
                              className="preset-chip"
                              onClick={() =>
                                setProductTitle(
                                  isBlogLike
                                    ? "How to style waterproof gold huggie earrings"
                                    : "Waterproof gold huggie earrings"
                                )
                              }
                            >
                              Waterproof earrings
                            </button>
                            <button
                              className="preset-chip"
                              onClick={() =>
                                setProductTitle(
                                  isBlogLike
                                    ? "Layered waterproof necklace looks for everyday wear"
                                    : "Layered waterproof necklace set"
                                )
                              }
                            >
                              Layered necklace
                            </button>
                            <button
                              className="preset-chip"
                              onClick={() =>
                                setProductTitle(
                                  isBlogLike
                                    ? "Why paperclip bracelets are the perfect everyday stack"
                                    : "Minimal paperclip bracelet"
                                )
                              }
                            >
                              Bracelet
                            </button>
                          </div>
                        </div>

                        <div className="inspector-field-group">
                          <label className="inspector-label" htmlFor="title">
                            {isBlogLike ? "Blog post title" : "Product title"}
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
                            {isBlogLike ? "Blog summary / intro" : "Product description"}
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
                            {isBlogLike ? "Main topics / angles" : "Use cases / occasions"}
                          </label>
                          <input
                            id="useCases"
                            className="inspector-input"
                            value={useCases}
                            onChange={(e) => setUseCases(e.target.value)}
                          />
                          <div className="field-help">
                            Comma separated. We convert this into structured context for the engine.
                          </div>
                        </div>
                      </>
                    )}

                    <div className="inspector-footer">
                      <button
                        className="button button--primary inspector-run"
                        onClick={handleRun}
                        disabled={isRunning || coreStatus !== "ok"}
                      >
                        {isRunning ? "Running…" : currentEngine.runButtonLabel}
                      </button>
                      <div className="inspector-footnote">
                        {isWeekly
                          ? "Plan generated and saved. Open Draft Library to export."
                          : "Output generated and saved. Open Draft Library to export."}
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
            <section style={{ marginTop: 10 }}>
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">{pageTab}</h2>
                  <p className="card-subtitle">
                    This view is part of the AURA roadmap. You can show this to clients as an upcoming feature while we focus on the SEO engines.
                  </p>
                </div>
                <ul style={{ fontSize: 12, paddingLeft: 18 }}>
                  {pageTab === "Compare domains" && (
                    <>
                      <li>Compare your project domain against competitors on title &amp; meta quality.</li>
                      <li>
                        See who wins on click-through potential in {activeMarket} for {activeDevice.toLowerCase()}.
                      </li>
                      <li>Export a simple action list you can plug straight into Shopify.</li>
                    </>
                  )}
                  {pageTab === "Growth report" && (
                    <>
                      <li>Track how your average SEO score moves over time across products and content.</li>
                      <li>Spot weeks where titles/meta dropped below target so you can fix them quickly.</li>
                      <li>Perfect for monthly reports you send to brands.</li>
                    </>
                  )}
                  {pageTab === "Compare by countries" && (
                    <>
                      <li>See which markets (US / UK / EU / Worldwide) are best optimised for your catalogue.</li>
                      <li>Plan localisation work – which regions need better copy, currency cues or spelling.</li>
                      <li>Future versions will auto-translate SEO for each region.</li>
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
