const express = require("express");
const { crawlSite } = require("./seoSiteCrawlerService");
const router = express.Router();

// Crawl endpoint - used by Dashboard
router.post("/crawl", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.json({ ok: false, error: "Missing or invalid URL" });
    }
    const result = await crawlSite(url);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "SEO Site Crawler API running" });
});

module.exports = router;
