// src/tools/rank-visibility-tracker/index.js
// -----------------------------------------
// Simple visibility % calculator
// -----------------------------------------

module.exports = {
  key: "rank-visibility-tracker",
  name: "Rank Visibility Tracker",

  async run(input = {}, ctx = {}) {
    const keywords = Array.isArray(input.keywords) ? input.keywords : [];

    const scored = keywords.map((k) => {
      const position = Number(k.position || 100);
      const visibility = position <= 10 ? (11 - position) * 10 : 0;
      return { ...k, position, visibility };
    });

    const totalVisibility = scored.reduce(
      (sum, k) => sum + (k.visibility || 0),
      0
    );

    return {
      ok: true,
      tool: "rank-visibility-tracker",
      keywords: scored,
      total_visibility: totalVisibility,
    };
  },
};
