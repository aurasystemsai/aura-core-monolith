function analyzeMetadata(title = '', description = '', keywords = []) {
  const titleLength = title.length;
  const descriptionLength = description.length;
  const keywordCoverage = Math.min(100, keywords.length * 10 + 40);
  const titleScore = titleLength >= 45 && titleLength <= 60 ? 100 : Math.max(50, 100 - Math.abs(52 - titleLength));
  const descriptionScore = descriptionLength >= 130 && descriptionLength <= 155 ? 100 : Math.max(50, 100 - Math.abs(145 - descriptionLength));
  const score = Math.round(titleScore * 0.45 + descriptionScore * 0.35 + keywordCoverage * 0.2);
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : 'C';
  return { titleLength, descriptionLength, keywordCoverage, score, grade };
}

function suggestSchema(payload = {}) {
  const type = payload.contentType || 'Article';
  return {
    type,
    required: ['headline', 'description', 'author', 'datePublished'],
    recommended: ['image', 'publisher', 'mainEntityOfPage'],
  };
}

function keywordDensity(primaryKeyword = 'blog content plan', content = '') {
  const words = content.split(/\s+/).filter(Boolean).length || 1;
  const occurrences = (content.toLowerCase().match(new RegExp(primaryKeyword.toLowerCase(), 'g')) || []).length;
  const density = Math.min(15, Number(((occurrences / words) * 100).toFixed(2)));
  return { primaryKeyword, occurrences, words, density, status: density >= 1 && density <= 3 ? 'optimal' : 'review' };
}

function getStats() {
  return {
    metaHealth: 90,
    schemaCoverage: 88,
    keywordQuality: 84,
  };
}

module.exports = {
  analyzeMetadata,
  suggestSchema,
  keywordDensity,
  getStats,
};
