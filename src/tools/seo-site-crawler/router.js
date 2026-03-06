const express = require("express");
const { crawlSite } = require("./seoSiteCrawlerService");
const shopTokens = require("../../core/shopTokens");
const router = express.Router();

// In-memory history store (persists for server session)
const crawlHistory = [];
let nextId = 1;
const analyticsEvents = [];

function getShopAndToken(req) {
  const shop = req.session?.shop || req.headers["x-shopify-shop-domain"] || req.body?.shopDomain || req.query?.shop;
  const token = (shop && shopTokens.getToken(shop)) || req.session?.shopifyToken || null;
  return { shop, token };
}

// ── AI Crawl endpoint (called by the frontend) ──────────────────────────────
router.post("/ai/crawl", async (req, res) => {
  try {
    const { keywords } = req.body;
    const { shop, token } = getShopAndToken(req);

    if (!shop) return res.json({ ok: false, error: "No shop domain — please reconnect your store" });
    if (!token) return res.json({ ok: false, error: "No access token for shop " + shop + " — please re-install the app" });

    const result = await crawlSite(shop, token);

    const kws = Array.isArray(keywords) ? keywords.map(k => k.toLowerCase().trim()).filter(Boolean) : [];
    if (kws.length > 0) {
      result.pages = (result.pages || []).map(page => ({
        ...page,
        keywordPresence: kws.map(kw => ({
          keyword: kw,
          inTitle: (page.title || "").toLowerCase().includes(kw),
        })),
      }));
    }

    const entry = { id: nextId++, shop, keywords: kws, result, createdAt: new Date().toISOString() };
    crawlHistory.unshift(entry);
    if (crawlHistory.length > 100) crawlHistory.pop();
    analyticsEvents.push({ event: "crawl", shop, at: entry.createdAt });

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
    const { shop, token } = getShopAndToken(req);
    if (!shop) return res.json({ ok: false, error: "No shop domain" });
    if (!token) return res.json({ ok: false, error: "No access token for " + shop });
    const result = await crawlSite(shop, token);
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

// ── Last results (most recent crawl) ────────────────────────────────────────
router.get("/last-results", (req, res) => {
  const last = crawlHistory[0];
  if (!last) return res.json({ ok: false, error: "No crawl history yet" });
  res.json({ ok: true, ...last.result, scannedAt: last.createdAt, site: last.site });
});

// ── Health check ─────────────────────────────────────────────────────────────
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "SEO Site Crawler API running" });
});

module.exports = router;
