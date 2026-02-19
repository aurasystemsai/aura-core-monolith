const express = require("express");
const { crawlSite } = require("./seoSiteCrawlerService");
const router = express.Router();

// In-memory history store (persists for server session)
const crawlHistory = [];
let nextId = 1;
const analyticsEvents = [];

// ── AI Crawl endpoint (called by the frontend) ──────────────────────────────
router.post("/ai/crawl", async (req, res) => {
  try {
    const { site, keywords } = req.body;
    if (!site || typeof site !== "string") {
      return res.json({ ok: false, error: "Missing or invalid site URL" });
    }

    const result = await crawlSite(site.trim());

    // Keyword presence check per page
    const kws = Array.isArray(keywords) ? keywords.map(k => k.toLowerCase().trim()).filter(Boolean) : [];
    if (kws.length > 0) {
      result.pages = (result.pages || []).map(page => {
        const titleLower = (page.title || "").toLowerCase();
        const bodyText = (page.bodyText || page.title || "").toLowerCase();
        const keywordPresence = kws.map(kw => ({
          keyword: kw,
          inTitle: titleLower.includes(kw),
          inDesc: bodyText.includes(kw),
        }));
        return { ...page, keywordPresence };
      });
    }

    // Save to history
    const entry = {
      id: nextId++,
      site,
      keywords: kws,
      result,
      createdAt: new Date().toISOString(),
    };
    crawlHistory.unshift(entry);
    if (crawlHistory.length > 100) crawlHistory.pop();
    analyticsEvents.push({ event: "crawl", site, at: entry.createdAt });

    res.json({ ok: true, result, id: entry.id });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// ── Per-issue AI fix suggestion ──────────────────────────────────────────────
router.post("/ai/fix", async (req, res) => {
  try {
    const { issue, page } = req.body;
    if (!issue) return res.json({ ok: false, error: "Missing issue" });

    // Build a human-readable suggestion from the issue data
    const suggestion = [
      `Issue: ${issue.type}`,
      `Page: ${page || "Unknown"}`,
      `Detail: ${issue.detail}`,
      `Recommended fix: Use the ${issue.fix ? issue.fix.replace(/-/g, " ") : "SEO tools"} to address this.`,
    ].join("\n");

    res.json({ ok: true, suggestion });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// ── Original crawl endpoint (backward compat) ────────────────────────────────
router.post("/crawl", async (req, res) => {
  try {
    const { url, site } = req.body;
    const target = url || site;
    if (!target || typeof target !== "string") {
      return res.json({ ok: false, error: "Missing or invalid URL" });
    }
    const result = await crawlSite(target);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// ── History ──────────────────────────────────────────────────────────────────
router.get("/history", (req, res) => {
  res.json({ ok: true, history: crawlHistory.map(h => ({ id: h.id, site: h.site, createdAt: h.createdAt, result: h.result })) });
});

router.post("/history", (req, res) => {
  // Frontend may POST history separately — accept and ignore (we save on /ai/crawl)
  res.json({ ok: true });
});

// ── Analytics ────────────────────────────────────────────────────────────────
router.get("/analytics", (req, res) => {
  res.json({ ok: true, analytics: analyticsEvents });
});

// ── Feedback ─────────────────────────────────────────────────────────────────
router.post("/feedback", (req, res) => {
  res.json({ ok: true });
});

// ── Import ───────────────────────────────────────────────────────────────────
router.post("/import", (req, res) => {
  try {
    const { data } = req.body;
    if (Array.isArray(data)) {
      data.forEach(item => {
        crawlHistory.unshift({ ...item, id: nextId++ });
      });
    }
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// ── Health check ─────────────────────────────────────────────────────────────
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "SEO Site Crawler API running" });
});

module.exports = router;
