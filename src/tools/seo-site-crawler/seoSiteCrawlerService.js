const axios = require("axios");
const cheerio = require("cheerio");

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
