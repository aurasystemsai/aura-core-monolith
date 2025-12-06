// src/tools/on-page-seo-engine/index.js
// -------------------------------------
// Very small on-page checklist
// -------------------------------------

function safe(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

module.exports = {
  key: "on-page-seo-engine",
  name: "On-Page SEO Engine",

  async run(input = {}, ctx = {}) {
    const url = safe(input.url || "");
    const keyword = safe(input.keyword || "");
    const title = safe(input.title || "");
    const metaDescription = safe(input.meta_description || "");

    const checks = [];

    if (keyword && title && !title.toLowerCase().includes(keyword.toLowerCase())) {
      checks.push("Add the primary keyword to the page title.");
    }
    if (
      keyword &&
      metaDescription &&
      !metaDescription.toLowerCase().includes(keyword.toLowerCase())
    ) {
      checks.push("Include the primary keyword in the meta description.");
    }
    if (!metaDescription) {
      checks.push("Add a compelling meta description (120–155 characters).");
    }

    if (!checks.length) {
      checks.push("Basic on-page checks passed for the supplied fields.");
    }

    return {
      ok: true,
      tool: "on-page-seo-engine",
      url: url || null,
      keyword: keyword || null,
      checks,
    };
  },
};
