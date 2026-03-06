const axios = require("axios");
const shopTokens = require("../../core/shopTokens");

const SHOPIFY_API_VERSION = "2024-01";

async function shopifyGet(shop, token, endpoint) {
  const { data } = await axios.get(
    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/${endpoint}`,
    {
      headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
      timeout: 20000,
    }
  );
  return data;
}

function analyseProduct(product, shop) {
  const issues = [];
  const seoTitle = product.metafields_global_title_tag || product.title || "";
  const seoDesc  = product.metafields_global_description_tag || "";
  const url = `https://${shop}/products/${product.handle}`;

  if (!seoTitle) issues.push({ severity: "high", type: "Missing SEO Title", fix: "product-seo", detail: `Product "${product.title}" has no SEO title tag` });
  else if (seoTitle.length < 30) issues.push({ severity: "medium", type: "SEO Title Too Short", fix: "product-seo", detail: `SEO title is only ${seoTitle.length} chars (aim for 50–60): "${seoTitle}"` });
  else if (seoTitle.length > 60) issues.push({ severity: "medium", type: "SEO Title Too Long", fix: "product-seo", detail: `SEO title is ${seoTitle.length} chars (over 60, truncated in Google): "${seoTitle.slice(0, 60)}..."` });

  if (!seoDesc) issues.push({ severity: "high", type: "Missing Meta Description", fix: "product-seo", detail: `Product "${product.title}" has no meta description — critical for click-through rates` });
  else if (seoDesc.length < 80) issues.push({ severity: "medium", type: "Meta Description Too Short", fix: "product-seo", detail: `Meta description is only ${seoDesc.length} chars (aim for 120–160)` });
  else if (seoDesc.length > 160) issues.push({ severity: "low", type: "Meta Description Too Long", fix: "product-seo", detail: `Meta description is ${seoDesc.length} chars — will be cut off in search results` });

  const bodyText = (product.body_html || "").replace(/<[^>]+>/g, "").trim();
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
  if (wordCount < 50) issues.push({ severity: "medium", type: "Thin Product Description", fix: "product-seo", detail: `Product "${product.title}" has ~${wordCount} words — aim for 150+` });

  const imgs = product.images || [];
  if (imgs.length === 0) {
    issues.push({ severity: "medium", type: "No Product Images", fix: "image-alt-media-seo", detail: `Product "${product.title}" has no images` });
  } else {
    const missingAlt = imgs.filter(img => !img.alt || img.alt.trim() === "").length;
    if (missingAlt > 0) issues.push({ severity: "medium", type: "Images Missing Alt Text", fix: "image-alt-media-seo", detail: `${missingAlt} of ${imgs.length} image${missingAlt > 1 ? "s" : ""} on "${product.title}" have no alt text` });
  }

  return { url, title: seoTitle || product.title, issues };
}

function analyseCmsPage(page, shop) {
  const issues = [];
  const seoTitle = page.metafields_global_title_tag || page.title || "";
  const seoDesc  = page.metafields_global_description_tag || "";
  const url = `https://${shop}/pages/${page.handle}`;

  if (!seoTitle) issues.push({ severity: "high", type: "Missing SEO Title", fix: "on-page-seo-engine", detail: `Page "${page.title}" has no SEO title tag` });
  else if (seoTitle.length > 60) issues.push({ severity: "medium", type: "SEO Title Too Long", fix: "on-page-seo-engine", detail: `Page title is ${seoTitle.length} chars (over 60): "${seoTitle.slice(0, 60)}..."` });

  if (!seoDesc) issues.push({ severity: "high", type: "Missing Meta Description", fix: "on-page-seo-engine", detail: `Page "${page.title}" has no meta description` });
  else if (seoDesc.length < 80) issues.push({ severity: "medium", type: "Meta Description Too Short", fix: "on-page-seo-engine", detail: `Meta description is ${seoDesc.length} chars (aim for 120–160)` });

  const bodyText = (page.body_html || "").replace(/<[^>]+>/g, "").trim();
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
  if (wordCount < 100) issues.push({ severity: "medium", type: "Thin Page Content", fix: "on-page-seo-engine", detail: `Page "${page.title}" only has ~${wordCount} words` });

  return { url, title: seoTitle || page.title, issues };
}

function analyseCollection(col, shop) {
  const issues = [];
  const seoTitle = col.metafields_global_title_tag || col.title || "";
  const seoDesc  = col.metafields_global_description_tag || "";
  const url = `https://${shop}/collections/${col.handle}`;

  if (!seoTitle) issues.push({ severity: "medium", type: "Missing Collection SEO Title", fix: "on-page-seo-engine", detail: `Collection "${col.title}" has no SEO title` });
  else if (seoTitle.length > 60) issues.push({ severity: "low", type: "Collection SEO Title Too Long", fix: "on-page-seo-engine", detail: `Collection title is ${seoTitle.length} chars (over 60)` });
  if (!seoDesc) issues.push({ severity: "medium", type: "Missing Collection Meta Description", fix: "on-page-seo-engine", detail: `Collection "${col.title}" has no meta description` });

  return { url, title: seoTitle || col.title, issues };
}


async function crawlSite(shop, token) {
  const pageResults = [];
  const errors = [];

  if (!shop || !token) {
    throw new Error("No shop domain or access token — make sure you are authenticated");
  }

  // ── Products ───────────────────────────────────────────────────────────────
  try {
    const { products = [] } = await shopifyGet(shop, token,
      "products.json?limit=50&fields=id,title,handle,body_html,metafields_global_title_tag,metafields_global_description_tag,images");
    for (const p of products) pageResults.push(analyseProduct(p, shop));
  } catch (e) {
    errors.push("Products: " + e.message);
    console.error("[crawler] products fetch failed:", e.message);
  }

  // ── CMS Pages ──────────────────────────────────────────────────────────────
  try {
    const { pages = [] } = await shopifyGet(shop, token,
      "pages.json?limit=50&fields=id,title,handle,body_html,metafields_global_title_tag,metafields_global_description_tag");
    for (const p of pages) pageResults.push(analyseCmsPage(p, shop));
  } catch (e) {
    errors.push("Pages: " + e.message);
    console.error("[crawler] pages fetch failed:", e.message);
  }

  // ── Collections ────────────────────────────────────────────────────────────
  try {
    const { custom_collections = [] } = await shopifyGet(shop, token,
      "custom_collections.json?limit=50&fields=id,title,handle,metafields_global_title_tag,metafields_global_description_tag");
    for (const c of custom_collections) pageResults.push(analyseCollection(c, shop));
  } catch (e) { /* collections optional */ }

  try {
    const { smart_collections = [] } = await shopifyGet(shop, token,
      "smart_collections.json?limit=50&fields=id,title,handle,metafields_global_title_tag,metafields_global_description_tag");
    for (const c of smart_collections) pageResults.push(analyseCollection(c, shop));
  } catch (e) { /* collections optional */ }

  if (pageResults.length === 0 && errors.length > 0) {
    throw new Error("Could not access Shopify store data: " + errors.join("; "));
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

