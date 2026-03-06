const express = require("express");
const { crawlSite } = require("./seoSiteCrawlerService");
const shopTokens = require("../../core/shopTokens");
const { applyProductFields } = require("../../core/shopifyApply");
const { getOpenAIClient } = require("../../core/openaiClient");
const axios = require("axios");
const router = express.Router();

const SHOPIFY_API_VERSION = "2024-01";
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

// ── Bulk AI fix — generates SEO fixes for all products with issues ────────────
router.post("/bulk-fix", async (req, res) => {
  try {
    const { shop, token } = getShopAndToken(req);
    if (!shop) return res.json({ ok: false, error: "No shop domain" });
    if (!token) return res.json({ ok: false, error: "No access token for " + shop });

    // Get the last crawl result or use what was passed
    const crawlResult = req.body.crawlResult || (crawlHistory[0] && crawlHistory[0].result);
    if (!crawlResult) return res.json({ ok: false, error: "No scan data — run a Site Audit first" });

    const openai = getOpenAIClient();
    if (!openai) return res.json({ ok: false, error: "OpenAI not configured" });

    // Get product pages from crawl results
    const productPages = (crawlResult.pages || []).filter(p => p.url && p.url.includes("/products/"));
    if (productPages.length === 0) return res.json({ ok: false, fixes: [], message: "No product issues to fix" });

    // Fetch full product list from Shopify to get IDs
    const { data: shopData } = await axios.get(
      `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=100&fields=id,title,handle,body_html`,
      { headers: { "X-Shopify-Access-Token": token }, timeout: 15000 }
    );
    const allProducts = shopData.products || [];
    const byHandle = {};
    for (const p of allProducts) byHandle[p.handle] = p;

    const fixes = [];
    for (const page of productPages) {
      const handle = page.url.split("/products/")[1]?.split("?")[0]?.split("/")[0];
      const product = handle && byHandle[handle];
      if (!product) continue;

      // Only fix pages that actually have issues
      const hasIssues = (page.issues || []).length > 0;
      if (!hasIssues) continue;

      const bodyText = (product.body_html || "").replace(/<[^>]+>/g, "").trim().slice(0, 400);

      const prompt = `You are an expert Shopify SEO copywriter. Write optimised SEO fields for this product.

Product Name: ${product.title}
Product Description: ${bodyText || "(none provided)"}

Return ONLY this JSON (no markdown, no extra text):
{
  "seoTitle": "50-60 char compelling title with primary keyword naturally included",
  "metaDescription": "150-160 char meta description — benefit-first, specific, ends with CTA",
  "altText": "12-15 word vivid image alt text including primary keyword"
}`;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 300,
          temperature: 0.7,
        });
        const raw = completion.choices[0]?.message?.content?.trim() || "{}";
        let parsed = {};
        try { parsed = JSON.parse(raw); } catch (_) {
          const m = raw.match(/\{[\s\S]*\}/);
          if (m) try { parsed = JSON.parse(m[0]); } catch (_) {}
        }
        fixes.push({
          productId: String(product.id),
          handle: product.handle,
          productName: product.title,
          url: page.url,
          issues: page.issues || [],
          seoTitle: parsed.seoTitle || "",
          metaDescription: parsed.metaDescription || "",
          altText: parsed.altText || "",
          applied: false,
        });
      } catch (e) {
        console.error("[bulk-fix] AI error for " + product.title, e.message);
      }
    }

    res.json({ ok: true, fixes, total: fixes.length });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// ── Apply fixes — pushes AI-generated SEO to Shopify ─────────────────────────
router.post("/apply-fixes", async (req, res) => {
  try {
    const { shop, token } = getShopAndToken(req);
    if (!shop) return res.json({ ok: false, error: "No shop domain" });
    if (!token) return res.json({ ok: false, error: "No access token" });

    const { fixes } = req.body;
    if (!Array.isArray(fixes) || !fixes.length) return res.json({ ok: false, error: "No fixes to apply" });

    const results = [];
    for (const fix of fixes) {
      if (!fix.productId) continue;
      try {
        await applyProductFields(shop, fix.productId, {
          seoTitle: fix.seoTitle,
          metaDescription: fix.metaDescription,
        });

        // Apply alt text to product images if provided
        if (fix.altText && fix.imageId) {
          await axios.put(
            `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/products/${fix.productId}/images/${fix.imageId}.json`,
            { image: { id: fix.imageId, alt: fix.altText } },
            { headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" }, timeout: 10000 }
          );
        }
        results.push({ productId: fix.productId, ok: true });
      } catch (e) {
        results.push({ productId: fix.productId, ok: false, error: e.message });
      }
    }
    const success = results.filter(r => r.ok).length;
    res.json({ ok: true, results, success, failed: results.length - success });
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
