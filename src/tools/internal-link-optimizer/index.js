// src/tools/internal-link-optimizer/index.js
// ===============================================
// AURA • Internal Link Optimiser (rule-based)
// ===============================================

const key = "internal-link-optimizer";

async function run(input = {}, ctx = {}) {
  const env = ctx.environment || process.env.NODE_ENV || "development";
  const now = new Date().toISOString();

  const pageUrl = input.url || input.pageUrl || "https://example.com/page";
  const related = Array.isArray(input.relatedUrls)
    ? input.relatedUrls
    : [];

  const links = related.slice(0, 10).map((url) => ({
    url,
    anchor: input.topic
      ? `${input.topic} – learn more`
      : "Related product",
    position: "body",
  }));

  return {
    ok: true,
    tool: key,
    environment: env,
    message: "Internal link suggestions generated.",
    input,
    output: {
      pageUrl,
      suggestedLinks: links,
      summary: `Suggest linking to ${links.length} related pages from this page.`,
    },
    meta: {
      engine: "internal-rule-engine-v1",
      generatedAt: now,
    },
  };
}

const meta = { id: key, name: "Internal Link Optimizer", description: "Suggests internal links for SEO and navigation." };
module.exports = { key, run, meta };
