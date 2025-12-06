// src/tools/internal-link-optimizer/index.js
// ------------------------------------------
// Suggests basic internal linking opportunities
// ------------------------------------------

module.exports = {
  key: "internal-link-optimizer",
  name: "Internal Link Optimizer",

  async run(input = {}, ctx = {}) {
    const pages = Array.isArray(input.pages) ? input.pages : [];

    const suggestions = pages.map((p) => {
      const slug = p.slug || p.url || "";
      const targetKeyword = p.keyword || p.topic || "";
      return {
        from: "blog posts about the same collection",
        to: slug,
        anchor_hint: targetKeyword || "view collection",
      };
    });

    return {
      ok: true,
      tool: "internal-link-optimizer",
      suggestions,
    };
  },
};
