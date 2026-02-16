function analyzeMetadata(title = '', description = '', keywords = []) {
  const titleLength = title.length;
  const descriptionLength = description.length;
  const keywordCoverage = Math.min(100, keywords.length * 10 + 40);
  const titleScore = titleLength >= 45 && titleLength <= 60 ? 100 : Math.max(50, 100 - Math.abs(52 - titleLength));
  const descriptionScore = descriptionLength >= 130 && descriptionLength <= 160 ? 100 : Math.max(50, 100 - Math.abs(145 - descriptionLength));
  const score = Math.round(titleScore * 0.45 + descriptionScore * 0.35 + keywordCoverage * 0.2);
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : 'C';
  return { titleLength, descriptionLength, keywordCoverage, score, grade };
}

function suggestSchema(payload = {}) {
  const type = payload.contentType || 'Article';
  const base = {
    type,
    required: ['headline', 'description', 'author', 'datePublished'],
    recommended: ['image', 'publisher', 'mainEntityOfPage'],
  };
  if (type === 'HowTo') {
    base.required.push('step');
  }
  return base;
}

function auditPageSpeed(payload = {}) {
  const performance = 85;
  const accessibility = 90;
  const bestPractices = 88;
  const seo = 92;
  const score = Math.round(performance * 0.35 + accessibility * 0.25 + bestPractices * 0.2 + seo * 0.2);
  return {
    url: payload.url || 'https://example.com/blog-seo',
    performance,
    accessibility,
    bestPractices,
    seo,
    score,
    opportunities: ['Lazy-load images', 'Preload hero font', 'Reduce CLS via fixed dimensions'],
  };
}

function validateLinks(payload = {}) {
  const links = payload.links || [];
  const broken = links.filter((l) => l.status && l.status >= 400).length;
  return {
    total: links.length,
    broken,
    internal: links.filter((l) => l.type === 'internal').length,
    external: links.filter((l) => l.type === 'external').length,
    recommendations: broken ? ['Fix or remove broken links'] : ['Link health is strong'],
  };
}

function getStats() {
  return {
    lastAuditScore: 92,
    schemaCoverage: 88,
    metaHealth: 90,
  };
}

module.exports = {
  analyzeMetadata,
  suggestSchema,
  auditPageSpeed,
  validateLinks,
  getStats,
};
