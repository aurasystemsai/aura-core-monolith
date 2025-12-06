// src/tools/weekly-blog-content-engine/index.js
// ---------------------------------------------
// Very lightweight blog topic planner
// ---------------------------------------------

function safe(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

module.exports = {
  key: "weekly-blog-content-engine",
  name: "Weekly Blog Content Engine",

  async run(input = {}, ctx = {}) {
    const niche = safe(input.niche || input.topic || "ecommerce");
    const keyword = safe(input.primary_keyword || input.keyword || "");

    const ideas = [
      `Beginner's guide to ${niche}`,
      `Top 5 mistakes people make with ${niche}`,
      `How to choose the right ${niche} product for you`,
      `Behind the scenes of our ${niche} brand`,
    ];

    if (keyword) {
      ideas.unshift(`Complete guide to ${keyword}`);
    }

    return {
      ok: true,
      tool: "weekly-blog-content-engine",
      niche,
      primary_keyword: keyword || null,
      ideas,
    };
  },
};
