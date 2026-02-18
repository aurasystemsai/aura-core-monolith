const axios = require("axios");
const cheerio = require("cheerio");

async function analysePage(u) {
  const issues = [];
  const info = { url: u, title: null, issues: [] };

  try {
    const { data } = await axios.get(u, {
      timeout: 15000,
      headers: { "User-Agent": "AuraSEOBot/1.0" },
      maxRedirects: 5,
    });
    const $ = cheerio.load(data);

    // --- Title ---
    const title = $("title").text().trim();
    info.title = title || "(no title)";
    if (!title) issues.push({ severity: "high", type: "Missing Title Tag", fix: "product-seo", detail: "Page has no <title> tag — critical for search rankings" });
    else if (title.length < 30) issues.push({ severity: "medium", type: "Title Too Short", fix: "product-seo", detail: `Title is only ${title.length} chars (aim for 50–60): "${title}"` });
    else if (title.length > 60) issues.push({ severity: "medium", type: "Title Too Long", fix: "product-seo", detail: `Title is ${title.length} chars (over 60, may be truncated in search): "${title.slice(0, 60)}..."` });
    if (title && /untitled|coming soon|shopify/i.test(title)) issues.push({ severity: "medium", type: "Generic Title", fix: "product-seo", detail: `Title appears generic: "${title}"` });

    // --- Meta description ---
    const desc = $('meta[name="description"]').attr("content") || "";
    if (!desc) issues.push({ severity: "high", type: "Missing Meta Description", fix: "product-seo", detail: "No meta description — this appears in search result snippets" });
    else if (desc.length < 80) issues.push({ severity: "medium", type: "Meta Description Too Short", fix: "product-seo", detail: `Description is only ${desc.length} chars (aim for 120–160)` });
    else if (desc.length > 160) issues.push({ severity: "low", type: "Meta Description Too Long", fix: "product-seo", detail: `Description is ${desc.length} chars (will be cut off in search results)` });

    // --- H1 ---
    const h1s = $("h1");
    if (h1s.length === 0) issues.push({ severity: "high", type: "Missing H1", fix: "on-page-seo-engine", detail: "No H1 heading found — every page should have exactly one H1" });
    else if (h1s.length > 1) issues.push({ severity: "medium", type: "Multiple H1 Tags", fix: "on-page-seo-engine", detail: `Found ${h1s.length} H1 tags — use only one per page for clarity` });

    // --- Heading hierarchy ---
    const h2s = $("h2").length;
    const h3s = $("h3").length;
    if (h3s > 0 && h2s === 0) issues.push({ severity: "low", type: "Broken Heading Hierarchy", fix: "on-page-seo-engine", detail: "H3 tags used before any H2 — headings should be nested logically" });

    // --- Images ---
    const imgsWithoutAlt = $("img").filter((_, el) => !$(el).attr("alt") || $(el).attr("alt").trim() === "").length;
    const totalImgs = $("img").length;
    if (imgsWithoutAlt > 0) issues.push({ severity: "medium", type: "Images Missing Alt Text", fix: "image-alt-media-seo", detail: `${imgsWithoutAlt} of ${totalImgs} image${imgsWithoutAlt > 1 ? "s" : ""} missing alt text — hurts accessibility and image SEO` });

    // Large images (no src size check possible, but flag images with no width/height attributes)
    const imgsNoSize = $("img").filter((_, el) => !$(el).attr("width") && !$(el).attr("height")).length;
    if (imgsNoSize > 3) issues.push({ severity: "low", type: "Images Without Explicit Dimensions", fix: "image-alt-media-seo", detail: `${imgsNoSize} images have no width/height attributes, causing layout shift (bad for Core Web Vitals)` });

    // --- Canonical ---
    const canonical = $('link[rel="canonical"]').attr("href");
    if (!canonical) issues.push({ severity: "low", type: "Missing Canonical Tag", fix: "technical-seo-auditor", detail: "No canonical URL — can cause duplicate content issues" });

    // --- Robots ---
    const robotsMeta = $('meta[name="robots"]').attr("content") || "";
    if (robotsMeta.includes("noindex")) issues.push({ severity: "high", type: "Page Set to Noindex", fix: "technical-seo-auditor", detail: "noindex is set — search engines won't index this page" });
    if (robotsMeta.includes("nofollow")) issues.push({ severity: "medium", type: "Page Set to Nofollow", fix: "technical-seo-auditor", detail: "nofollow is set — link equity won't pass through this page" });

    // --- Open Graph / Social ---
    const ogTitle = $('meta[property="og:title"]').attr("content");
    const ogDesc = $('meta[property="og:description"]').attr("content");
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (!ogTitle) issues.push({ severity: "low", type: "Missing OG Title", fix: "on-page-seo-engine", detail: "No og:title tag — affects how page appears when shared on social media" });
    if (!ogDesc) issues.push({ severity: "low", type: "Missing OG Description", fix: "on-page-seo-engine", detail: "No og:description — affects social media link previews" });
    if (!ogImage) issues.push({ severity: "low", type: "Missing OG Image", fix: "image-alt-media-seo", detail: "No og:image — pages shared on social media will have no image" });

    // --- Schema markup ---
    const schemaScripts = $('script[type="application/ld+json"]').length;
    if (schemaScripts === 0) issues.push({ severity: "medium", type: "No Schema Markup", fix: "schema-rich-results-engine", detail: "No structured data (JSON-LD) found — schema markup can unlock rich results in Google" });

    // --- Word count / content thickness ---
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
    const wordCount = bodyText.split(" ").filter(Boolean).length;
    if (wordCount < 200) issues.push({ severity: "medium", type: "Thin Content", fix: "blog-seo", detail: `Only ~${wordCount} words on page — thin content ranks poorly. Aim for 300+ words` });

    // --- Internal links ---
    const internalLinks = $("a[href]").filter((_, el) => {
      const href = $(el).attr("href") || "";
      return href.startsWith("/") || href.includes(new URL(u).hostname);
    }).length;
    if (internalLinks < 2) issues.push({ severity: "low", type: "Few Internal Links", fix: "on-page-seo-engine", detail: `Only ${internalLinks} internal link${internalLinks !== 1 ? "s" : ""} found — internal linking helps SEO and navigation` });

    // --- Page speed hint: render-blocking scripts ---
    const renderBlockingScripts = $('script:not([async]):not([defer]):not([type="application/ld+json"])').length;
    if (renderBlockingScripts > 3) issues.push({ severity: "low", type: "Render-Blocking Scripts", fix: "technical-seo-auditor", detail: `${renderBlockingScripts} scripts without async/defer — may slow page load and hurt Core Web Vitals` });

    // --- Lang attribute ---
    const htmlLang = $("html").attr("lang");
    if (!htmlLang) issues.push({ severity: "low", type: "Missing Lang Attribute", fix: "technical-seo-auditor", detail: 'No lang attribute on <html> — add lang="en" for accessibility and SEO' });

  } catch (err) {
    info.title = "(error)";
    issues.push({ severity: "high", type: "Page Unreachable", fix: "technical-seo-auditor", detail: err.message });
  }

  info.issues = issues;
  return info;
}

async function crawlSite(url) {
  const baseUrl = url.replace(/\/$/, "");
  const toVisit = [baseUrl];
  const visited = new Set();

  // Collect internal links from homepage
  try {
    const { data } = await axios.get(baseUrl, { timeout: 15000, headers: { "User-Agent": "AuraSEOBot/1.0" } });
    const $ = cheerio.load(data);
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      let full = href.startsWith("/") ? baseUrl + href : href;
      if (full.startsWith(baseUrl) && !full.includes("#") && !full.match(/\.(jpg|jpeg|png|gif|pdf|zip|svg|webp|css|js)$/i)) {
        toVisit.push(full);
      }
    });
  } catch (_) {}

  // Analyse up to 15 pages
  const pagesToAnalyse = [...new Set(toVisit)].slice(0, 15);
  const pageResults = [];

  for (const u of pagesToAnalyse) {
    if (visited.has(u)) continue;
    visited.add(u);
    const result = await analysePage(u);
    pageResults.push(result);
  }

  const allIssues = pageResults.flatMap(p => p.issues.map(i => ({ ...i, page: p.url })));
  return {
    pagesScanned: pageResults.length,
    totalIssues: allIssues.length,
    high: allIssues.filter(i => i.severity === "high").length,
    medium: allIssues.filter(i => i.severity === "medium").length,
    low: allIssues.filter(i => i.severity === "low").length,
    issues: allIssues,
    pages: pageResults,
  };
}

module.exports = { crawlSite };

async function analysePage(u) {
  const issues = [];
  const info = { url: u, title: null, issues: [] };

  try {
    const { data, headers } = await axios.get(u, {
      timeout: 15000,
      headers: { "User-Agent": "AuraSEOBot/1.0" },
      maxRedirects: 5,
    });
    const $ = cheerio.load(data);

    // Title checks
    const title = $("title").text().trim();
    info.title = title || "(no title)";
    if (!title) issues.push({ severity: "high", type: "Missing Title", detail: "Page has no <title> tag" });
    else if (title.length < 30) issues.push({ severity: "medium", type: "Title Too Short", detail: `Title is only ${title.length} chars (aim for 50–60)` });
    else if (title.length > 60) issues.push({ severity: "medium", type: "Title Too Long", detail: `Title is ${title.length} chars (aim for 50–60)` });

    // Meta description
    const desc = $('meta[name="description"]').attr("content") || "";
    if (!desc) issues.push({ severity: "high", type: "Missing Meta Description", detail: "No meta description found" });
    else if (desc.length < 80) issues.push({ severity: "medium", type: "Meta Description Too Short", detail: `Description is only ${desc.length} chars (aim for 120–160)` });
    else if (desc.length > 160) issues.push({ severity: "low", type: "Meta Description Too Long", detail: `Description is ${desc.length} chars (over 160)` });

    // H1 checks
    const h1s = $("h1");
    if (h1s.length === 0) issues.push({ severity: "high", type: "Missing H1", detail: "No H1 heading found on page" });
    else if (h1s.length > 1) issues.push({ severity: "medium", type: "Multiple H1s", detail: `Found ${h1s.length} H1 tags — should only have 1` });

    // Images without alt text
    const imgsWithoutAlt = $("img").filter((_, el) => !$(el).attr("alt")).length;
    if (imgsWithoutAlt > 0) issues.push({ severity: "medium", type: "Images Missing Alt Text", detail: `${imgsWithoutAlt} image${imgsWithoutAlt > 1 ? "s" : ""} missing alt text` });

    // Canonical tag
    const canonical = $('link[rel="canonical"]').attr("href");
    if (!canonical) issues.push({ severity: "low", type: "Missing Canonical Tag", detail: "No canonical URL specified" });

    // noindex check
    const robots = $('meta[name="robots"]').attr("content") || "";
    if (robots.includes("noindex")) issues.push({ severity: "high", type: "Page Noindexed", detail: "This page has noindex set — search engines won't crawl it" });

  } catch (err) {
    info.title = "(error)";
    issues.push({ severity: "high", type: "Page Unreachable", detail: err.message });
  }

  info.issues = issues;
  return info;
}

async function crawlSite(url) {
  const baseUrl = url.replace(/\/$/, "");
  const toVisit = [baseUrl];
  const visited = new Set();
  const pageResults = [];

  // Collect internal links from homepage first
  try {
    const { data } = await axios.get(baseUrl, { timeout: 15000, headers: { "User-Agent": "AuraSEOBot/1.0" } });
    const $ = cheerio.load(data);
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      let full = href;
      if (href.startsWith("/")) full = baseUrl + href;
      if (full.startsWith(baseUrl) && !visited.has(full) && !full.includes("#") && !full.includes("?")) {
        toVisit.push(full);
      }
    });
  } catch (_) {}

  // Analyse up to 10 pages
  const pagesToAnalyse = [...new Set(toVisit)].slice(0, 10);
  for (const u of pagesToAnalyse) {
    if (visited.has(u)) continue;
    visited.add(u);
    const result = await analysePage(u);
    pageResults.push(result);
  }

  // Aggregate summary
  const allIssues = pageResults.flatMap(p => p.issues.map(i => ({ ...i, page: p.url })));
  const summary = {
    pagesScanned: pageResults.length,
    totalIssues: allIssues.length,
    high: allIssues.filter(i => i.severity === "high").length,
    medium: allIssues.filter(i => i.severity === "medium").length,
    low: allIssues.filter(i => i.severity === "low").length,
    issues: allIssues,
    pages: pageResults,
  };

  return summary;
}

module.exports = { crawlSite };
