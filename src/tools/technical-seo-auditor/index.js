// src/tools/technical-seo-auditor/index.js
// ----------------------------------------
// Simple technical SEO checklist
// ----------------------------------------

module.exports = {
  key: "technical-seo-auditor",
  name: "Technical SEO Auditor",

  async run(input = {}, ctx = {}) {
    const domain = input.domain || input.site || null;

    const checks = [
      "Check that only one primary domain is used (no mixed www / non-www).",
      "Verify that HTTP redirects to HTTPS.",
      "Ensure a single clean sitemap.xml is submitted to Search Console.",
      "Confirm robots.txt is not blocking important pages.",
      "Check core pages for 4xx / 5xx errors.",
    ];

    return {
      ok: true,
      tool: "technical-seo-auditor",
      domain,
      checks,
    };
  },
};
