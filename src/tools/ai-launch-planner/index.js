// src/tools/ai-launch-planner/index.js
// -------------------------------------
// Lightweight launch checklist generator
// -------------------------------------

function safe(val) {
  if (val === undefined || val === null) return "";
  return String(val).trim();
}

module.exports = {
  key: "ai-launch-planner",
  name: "AURA Launch Planner",

  async run(input = {}, ctx = {}) {
    const name = safe(input.launch_name || input.campaign_name || "New Launch");
    const date = safe(input.launch_date || input.date || "");
    const budget = Number(input.budget || 0) || null;
    const channel = safe(input.primary_channel || "multi-channel");
    const product = safe(input.product_name || "");

    const phases = [
      {
        id: "prep",
        label: "Pre-launch prep (7–14 days before)",
        tasks: [
          "Finalise offer, bonuses and guarantees.",
          "Prepare product pages and ensure all links, add-to-cart and checkout flows work.",
          "Set up tracking pixels (Meta, Google, TikTok, etc.).",
          "Create email sequences: launch announcement, open cart, last chance.",
          "Write ad copy and creative briefs for paid channels.",
        ],
      },
      {
        id: "launch",
        label: "Launch window (3–7 days)",
        tasks: [
          "Send launch day email and SMS to existing list.",
          `Announce ${name} across social channels (${channel}).`,
          "Turn on launch ads with conservative budgets for first 24h.",
          "Monitor product page performance (CTR, ATC, checkout rate).",
        ],
      },
      {
        id: "scale",
        label: "Scale & optimisation (after day 3)",
        tasks: [
          "Increase budgets on winning audiences and creatives.",
          "Add social proof to the product page as reviews come in.",
          "Create retargeting campaigns for ATC and page viewers.",
        ],
      },
      {
        id: "post",
        label: "Post-launch",
        tasks: [
          "Send post-purchase survey to launch buyers.",
          "Tag high-value customers for future VIP offers.",
          "Review ROAS, AOV and refund rate vs expectations.",
        ],
      },
    ];

    return {
      ok: true,
      tool: "ai-launch-planner",
      launch_name: name,
      launch_date: date || null,
      budget,
      primary_channel: channel,
      product_name: product || null,
      phases,
    };
  },
};
