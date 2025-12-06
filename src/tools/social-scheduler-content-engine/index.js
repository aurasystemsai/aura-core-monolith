// src/tools/social-scheduler-content-engine/index.js
// --------------------------------------------------
// Very small content calendar generator
// --------------------------------------------------

function safe(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

module.exports = {
  key: "social-scheduler-content-engine",
  name: "Social Scheduler Content Engine",

  async run(input = {}, ctx = {}) {
    const platform = safe(input.platform || "instagram");
    const days = Number(input.days || 7);

    const posts = [];
    for (let i = 1; i <= days; i += 1) {
      posts.push({
        day: i,
        platform,
        theme:
          i === 1
            ? "Hero product highlight"
            : i % 3 === 0
            ? "UGC / testimonial"
            : "Education / tips",
      });
    }

    return {
      ok: true,
      tool: "social-scheduler-content-engine",
      platform,
      days,
      posts,
    };
  },
};
