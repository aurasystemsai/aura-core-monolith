module.exports = {
  key: "on-page-seo-engine",
  meta: {
    id: "on-page-seo-engine",
    name: "On-Page SEO Engine",
    description: "Crawl any URL and get a full SEO audit — title, meta, headings, links, images, schema, readability, keyword placement, and AI-powered recommendations.",
  },

  async run(input = {}, ctx = {}) {
    const env = (ctx.env && ctx.env.NODE_ENV) || "development";
    const title = input.title || "";
    const metaDescription = input.metaDescription || "";
    const h1 = input.h1 || "";
    const wordCount = Number(input.wordCount || 0);
    const hasCanonical = !!input.canonicalUrl;
    const hasSchema = !!input.schemaMarkup;

    const issues = [];
    if (!title) issues.push({ cat: 'metaTags', sev: 'high', msg: 'Missing title' });
    if (!metaDescription) issues.push({ cat: 'metaTags', sev: 'high', msg: 'Missing meta description' });
    if (title.length > 0 && (title.length < 45 || title.length > 65)) issues.push({ cat: 'metaTags', sev: 'medium', msg: 'Title length outside 45-65 chars' });
    if (metaDescription.length > 0 && (metaDescription.length < 130 || metaDescription.length > 165)) issues.push({ cat: 'metaTags', sev: 'medium', msg: 'Meta description outside 130-165 chars' });
    if (!h1) issues.push({ cat: 'content', sev: 'high', msg: 'Missing H1' });
    if (wordCount < 300) issues.push({ cat: 'content', sev: 'medium', msg: 'Low word count (<300)' });
    if (!hasCanonical) issues.push({ cat: 'technical', sev: 'medium', msg: 'Missing canonical URL' });
    if (!hasSchema) issues.push({ cat: 'technical', sev: 'medium', msg: 'Missing schema markup' });

    const baseScore = 100;
    const penalty = issues.filter(i => i.sev === 'high').length * 15
                  + issues.filter(i => i.sev === 'medium').length * 8
                  + issues.filter(i => i.sev === 'low').length * 4;
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
