module.exports = {
  key: "on-page-seo-engine",

  async run(input = {}, ctx = {}) {
    const env = (ctx.env && ctx.env.NODE_ENV) || "development";
    const title = input.title || "";
    const metaDescription = input.metaDescription || "";
    const h1 = input.h1 || "";
    const wordCount = Number(input.wordCount || 0);
    const hasCanonical = !!input.canonicalUrl;
    const hasSchema = !!input.schemaMarkup;

    const issues = [];
    if (!title) issues.push("Missing title");
    if (!metaDescription) issues.push("Missing meta description");
    if (title.length < 45 || title.length > 65) issues.push("Title length outside 45-65 chars");
    if (metaDescription.length < 130 || metaDescription.length > 165) issues.push("Meta description outside 130-165 chars");
    if (!h1) issues.push("Missing H1");
    if (wordCount < 300) issues.push("Low word count (<300)");
    if (!hasCanonical) issues.push("Missing canonical URL");
    if (!hasSchema) issues.push("Missing schema markup");

    const baseScore = 100;
    const penalty = Math.min(issues.length * 8, 60);
    const score = Math.max(baseScore - penalty, 0);

    return {
      ok: true,
      tool: "on-page-seo-engine",
      message: "On-page SEO assessment completed.",
      environment: env,
      input,
      output: {
        score,
        issues,
        checks: {
          titleLength: title.length,
          metaLength: metaDescription.length,
          hasH1: !!h1,
          wordCount,
          hasCanonical,
          hasSchema,
        },
      },
    };
  },
};
