const crypto = require('crypto');

//============================================================================
// DATA STORES
// ============================================================================

const seoScores = new Map();
const keywordHistory = [];
const metadataStore = new Map();
const schemaMarkup = new Map();
const seoAudits = new Map();
const competitorSEO = new Map();
const backlinks = new Map();
const contentOptimization = new Map();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

function calculateSEOScore(components) {
  const weights = {
    keywords: 0.25,
    metadata: 0.20,
    headings: 0.15,
    links: 0.15,
    schema: 0.10,
    readability: 0.10,
    mobile: 0.05
  };
  
  let score = 0;
  Object.keys(weights).forEach(key => {
    score += (components[key] || 50) * weights[key];
  });
  
  return Math.round(score);
}

// ============================================================================
// SEO SCORING & ANALYSIS
// ============================================================================

function scoreBrief(data = {}) {
  const contentId = data.contentId || generateId('brief');
  
  const keywordsScore = Math.min(30, (data.keywords || []).length * 5 + 10);
  const metaScore = data.metaDescription && data.metaDescription.length >= 120 && data.metaDescription.length <= 170 ? 20 : 12;
  const headingsScore = data.headings?.h1?.length ? 15 : 10;
  const linksScore = Math.min(15, (data.internalLinks || 0) * 0.5 + (data.externalLinks || 0) * 0.3);
  const schemaScore = data.hasSchema ? 10 : 5;
  const readabilityScore = data.readabilityScore || 70;
  const mobileScore = data.mobileFriendly ? 5 : 2;
  
  const total = calculateSEOScore({
    keywords: keywordsScore * (100/30),
    metadata: metaScore * (100/20),
    headings:  headingsScore * (100/15),
    links: linksScore * (100/15),
    schema: schemaScore * (100/10),
    readability: readabilityScore,
    mobile: mobileScore * (100/5)
  });
  
  const grade = total >= 90 ? 'A' : total >= 80 ? 'B' : total >= 70 ? 'C' : 'D';
  
  const recommendations = [];
  if (keywordsScore < 20) recommendations.push('Add more targeted keywords');
  if (metaScore < 15) recommendations.push('Optimize meta description (120-170 chars)');
  if (headingsScore < 12) recommendations.push('Improve heading structure (H1-H6)');
  if (linksScore < 10) recommendations.push('Balance internal/external links');
  if (!data.hasSchema) recommendations.push('Add structured data (Schema.org)');
  if (readabilityScore < 60) recommendations.push('Improve content readability');
  if (!data.mobileFriendly) recommendations.push('Ensure mobile-friendly design');
  
  const payload = {
    contentId,
    score: total,
    grade,
    breakdown: {
      keywords: { score: keywordsScore, max: 30, percentage: Math.round((keywordsScore/30)*100) },
      meta: { score: metaScore, max: 20, percentage: Math.round((metaScore/20)*100) },
      headings: { score: headingsScore, max: 15, percentage: Math.round((headingsScore/15)*100) },
      links: { score: linksScore, max: 15, percentage: Math.round((linksScore/15)*100) },
      schema: { score: schemaScore, max: 10, percentage: Math.round((schemaScore/10)*100) },
      readability: { score: Math.round(readabilityScore/10), max: 10, percentage: Math.round(readabilityScore) },
      mobile: { score: mobileScore, max: 5, percentage: Math.round((mobileScore/5)*100) }
    },
    recommendations,
    opportunityScore: 100 - total, // Room for improvement
    createdAt: new Date().toISOString(),
  };

  seoScores.set(contentId, payload);
  return payload;
}

function getSEOScore(contentId) {
  if (!seoScores.has(contentId)) {
    throw new Error('SEO score not found');
  }
  return seoScores.get(contentId);
}

function updateSEOScore(contentId, updates) {
  const existing = getSEOScore(contentId);
  
  const updated = scoreBrief({
    ...existing,
    ...updates,
    contentId
  });
  
  return updated;
}

function deleteSEOScore(contentId) {
  if (!seoScores.has(contentId)) {
    throw new Error('SEO score not found');
  }
  
  seoScores.delete(contentId);
  return { success: true, message: 'SEO score deleted' };
}

// ============================================================================
// KEYWORD ANALYSIS
// ============================================================================

function analyzeKeywords(primaryKeyword, content, targetDensity = 2.0) {
  const words = (content || '').trim().split(/\s+/).filter(Boolean).length || 1;
  const count = (content || '').toLowerCase().split(primaryKeyword?.toLowerCase() || ' ').length - 1;
  const density = +(count / words * 100).toFixed(2);
  const status = density >= targetDensity * 0.5 && density <= targetDensity * 1.5 ? 'healthy' : density < targetDensity * 0.5 ? 'too_low' : 'too_high';
  
  const result = { 
    primaryKeyword, 
    density, 
    count,
    totalWords: words, 
    status, 
    targetDensity,
    recommendation: status === 'too_low' ? `Add ${Math.ceil(targetDensity * words / 100) - count} more instances` : status === 'too_high' ? `Remove ${count - Math.floor(targetDensity * words / 100)} instances` : 'Keyword density is optimal',
    analyzedAt: new Date().toISOString()
  };
  
  keywordHistory.push(result);
  return result;
}

function suggestKeywords(topic, options = {}) {
  const keywordSuggestionId = generateId('kw-sug');
  
  // Simulate keyword suggestions based on topic
  const primarySuggestions = [
    { keyword: topic, volume: 12000, difficulty: 58, cpc: 15.50 },
    { keyword: `${topic} software`, volume: 8500, difficulty: 62, cpc: 18.30 },
    { keyword: `best ${topic}`, volume: 15000, difficulty: 75, cpc: 22.00 }
  ];
  
  const longTailSuggestions = [
    { keyword: `how to use ${topic}`, volume: 3200, difficulty: 35, cpc: 8.20 },
    { keyword: `${topic} for ${options.industry || 'business'}`, volume: 2800, difficulty: 38, cpc: 10.50 },
    { keyword: `${topic} vs alternatives`, volume: 1900, difficulty: 42, cpc: 12.80 }
  ];
  
  const lsiKeywords = [
    `${topic} solution`,
    `${topic} platform`,
    `${topic} tool`,
    `${topic} automation`,
    `${topic} guide`
  ];
  
  return {
    id: keywordSuggestionId,
    topic,
    primarySuggestions,
    longTailSuggestions,
    lsiKeywords,
    totalSuggestions: primarySuggestions.length + longTailSuggestions.length + lsiKeywords.length,
    generatedAt: new Date().toISOString()
  };
}

function keywordDifficultyAnalysis(keyword) {
  // Simulate keyword difficulty analysis
  const difficulty = 40 + Math.round(Math.random() * 40); // 40-80
  const competition = difficulty > 70 ? 'high' : difficulty > 50 ? 'medium' : 'low';
  
  return {
    keyword,
    difficulty,
    competition,
    estimatedCPC: +(5 + (difficulty / 10)).toFixed(2),
    estimatedMonthlySearches: Math.round(5000 + Math.random() * 15000),
    recommendedAction: difficulty < 50 ? 'Target immediately' : difficulty < 70 ? 'Consider with strong content' : 'Requires significant authority',
    analyzedAt: new Date().toISOString()
  };
}

// ============================================================================
// METADATA OPTIMIZATION
// ============================================================================

function analyzeMetadata(title, description, keywords = []) {
  const metadataId = generateId('meta');
  
  const titleAnalysis = {
    status: title && title.length >= 30 && title.length <= 65 ? 'good' : title && title.length < 30 ? 'too_short' : 'too_long',
    length: title ? title.length : 0,
    recommendation: !title ? 'Add title' : title.length < 30 ? 'Expand title (30-65 chars)' : title.length > 65 ? 'Shorten title to under 65 chars' : 'Title length is optimal'
  };
  
  const descriptionAnalysis = {
    status: description && description.length >= 120 && description.length <= 170 ? 'good' : description && description.length < 120 ? 'too_short' : 'too_long',
    length: description ? description.length : 0,
    recommendation: !description ? 'Add meta description' : description.length < 120 ? 'Expand description (120-170 chars)' : description.length > 170 ? 'Shorten description to under 170 chars' : 'Description length is optimal'
  };
  
  const score = calculateSEOScore({
    keywords: Math.min(100, keywords.length * 20 + 20),
    metadata: titleAnalysis.status === 'good' && descriptionAnalysis.status === 'good' ? 100 : 50,
    headings: 70,
    links: 70,
    schema: 60,
    readability: 70,
    mobile: 80
  });
  
  const analysis = {
    id: metadataId,
    title: titleAnalysis,
    description: descriptionAnalysis,
    keywords,
    keywordCount: keywords.length,
    score,
    grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D',
    analyzedAt: new Date().toISOString()
  };
  
  metadataStore.set(metadataId, analysis);
  
  return analysis;
}

function optimizeMetadata(title, description, keywords = []) {
  // Generate optimized metadata
  let optimizedTitle = title;
  let optimizedDescription = description;
  
  // Optimize title
  if (!title || title.length < 30) {
    optimizedTitle = `${title || 'Content'} | Complete Guide ${new Date().getFullYear()}`;
  } else if (title.length > 65) {
    optimizedTitle = title.substring(0, 62) + '...';
  }
  
  // Optimize description
  if (!description || description.length < 120) {
    optimizedDescription = `${description || 'Learn about this topic.'} Comprehensive guide with expert insights, best practices, and actionable strategies. Updated ${new Date().getFullYear()}.`;
  } else if (description.length > 170) {
    optimizedDescription = description.substring(0, 167) + '...';
  }
  
  return {
    original: { title, description, keywords },
    optimized: {
      title: optimizedTitle,
      description: optimizedDescription,
      keywords: keywords.length < 3 ? [...keywords, 'guide', 'best practices', 'tutorial'] : keywords
    },
    improvements: {
      titleLengthFixed: title?.length !== optimizedTitle.length,
      descriptionLengthFixed: description?.length !== optimizedDescription.length,
      keywordsEnhanced: keywords.length < 3
    }
  };
}

// ============================================================================
// SCHEMA MARKUP
// ============================================================================

function suggestSchema(data = {}) {
  const schemaId = generateId('schema');
  const type = data.contentType || 'Article';
  
  const schemas = {
    'Article': {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: data.title || 'Content Brief',
      description: data.description || 'Structured content brief with SEO and governance.',
      keywords: data.keywords || ['content brief', 'seo outline'],
      author: {
        '@type': 'Person',
        name: data.author || 'Content Team'
      },
      datePublished: data.publishDate || new Date().toISOString(),
      dateModified: new Date().toISOString(),
      image: data.image || 'https://example.com/image.jpg'
    },
    'HowTo': {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: data.title || 'How-To Guide',
      description: data.description || 'Step-by-step guide',
      step: data.steps || []
    },
    'FAQPage': {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: data.faqs || []
    }
  };
  
  const schema = schemas[type] || schemas['Article'];
  
  const suggestion = {
    id: schemaId,
    type,
    schema,
    required: ['headline', 'description', 'image', 'author', 'datePublished'],
    recommended: ['about', 'mentions', 'audience', 'publisher'],
    benefits: [
      'Enhanced search visibility',
      'Rich snippets in search results',
      'Improved click-through rates',
      'Better content understanding by search engines'
    ],
    generatedAt: new Date().toISOString()
  };
  
  schemaMarkup.set(schemaId, suggestion);
  
  return suggestion;
}

function validateSchema(schemaData) {
  const required = ['@context', '@type', 'headline', 'description'];
  
  const missingFields = required.filter(field => !schemaData[field]);
  const hasRequired = missingFields.length === 0;
  
  return {
    valid: hasRequired,
    missingFields,
    warnings: [],
    score: hasRequired ? 100 : Math.round(((required.length - missingFields.length) / required.length) * 100),
    recommendations: missingFields.map(field => `Add required field: ${field}`)
  };
}

// ============================================================================
// CONTENT OPTIMIZATION
// ============================================================================

function analyzeContent(content, options = {}) {
  const analysisId = generateId('content-analysis');
  
  const words = content.split(/\s+/).filter(Boolean);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const paragraphCount = paragraphs.length;
  
  const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;
  const avgSentencesPerParagraph = paragraphCount > 0 ? Math.round(sentenceCount / paragraphCount) : 0;
  
  // Readability scoring (simplified Flesch reading ease)
  const readabilityScore = Math.max(0, Math.min(100, 206.835 - 1.015 * avgWordsPerSentence));
  const readabilityGrade = readabilityScore >= 80 ? 'Easy' : readabilityScore >= 60 ? 'Standard' : readabilityScore >= 40 ? 'Difficult' : 'Very Difficult';
  
  const analysis = {
    id: analysisId,
    wordCount,
    sentenceCount,
    paragraphCount,
    avgWordsPerSentence,
    avgSentencesPerParagraph,
    readabilityScore: Math.round(readabilityScore),
    readabilityGrade,
    targetWordCount: options.targetWordCount || 1500,
    wordCountStatus: wordCount >= (options.targetWordCount || 1500) * 0.9 ? 'good' : 'too_short',
    recommendations: [],
    analyzedAt: new Date().toISOString()
  };
  
  if (wordCount < (options.targetWordCount || 1500) * 0.9) {
    analysis.recommendations.push(`Add ${Math.round((options.targetWordCount || 1500) - wordCount)} more words`);
  }
  
  if (avgWordsPerSentence > 25) {
    analysis.recommendations.push('Shorten sentences for better readability');
  }
  
  if (paragraphCount < wordCount / 150) {
    analysis.recommendations.push('Break content into more paragraphs');
  }
  
  contentOptimization.set(analysisId, analysis);
  
  return analysis;
}

function suggestContentImprovements(contentAnalysisId) {
  const analysis = contentOptimization.get(contentAnalysisId);
  
  if (!analysis) {
    throw new Error('Content analysis not found');
  }
  
  const improvements = [];
  
  if (analysis.readabilityScore < 60) {
    improvements.push({
      type: 'readability',
      priority: 'high',
      suggestion: 'Simplify sentence structure and use shorter words',
      impact: 'Significantly improves user engagement'
    });
  }
  
  if (analysis.avgWordsPerSentence > 20) {
    improvements.push({
      type: 'sentence_length',
      priority: 'medium',
      suggestion: 'Break long sentences into shorter ones (target: 15-20 words)',
      impact: 'Improves readability and comprehension'
    });
  }
  
  if (analysis.wordCountStatus === 'too_short') {
    improvements.push({
      type: 'word_count',
      priority: 'high',
      suggestion: `Expand content to reach target word count (${analysis.targetWordCount} words)`,
      impact: 'Improves SEO and provides more value to readers'
    });
  }
  
  if (analysis.paragraphCount < 5) {
    improvements.push({
      type: 'structure',
      priority: 'medium',
      suggestion: 'Add more paragraphs to improve content structure',
      impact: 'Better visual appeal and scanability'
    });
  }
  
  return {
    contentAnalysisId,
    improvements,
    totalImprovements: improvements.length,
    highPriority: improvements.filter(i => i.priority === 'high').length
  };
}

// ============================================================================
// COMPETITOR SEO ANALYSIS
// ============================================================================

function analyzeCompetitorSEO(competitorData) {
  const competitorId = generateId('comp-seo');
  
  const analysis = {
    id: competitorId,
    name: competitorData.name || 'Competitor',
    url: competitorData.url,
    seoScore: competitorData.seoScore || (60 + Math.round(Math.random() * 30)),
    domainAuthority: competitorData.domainAuthority || (40 + Math.round(Math.random() * 40)),
    backlinks: competitorData.backlinks || Math.round(5000 + Math.random() * 45000),
    topKeywords: competitorData.topKeywords || [],
    contentGaps: competitorData.contentGaps || [],
    strengths: [],
    weaknesses: [],
    opportunities: [],
    analyzedAt: new Date().toISOString()
  };
  
  // Identify strengths and weaknesses
  if (analysis.domainAuthority > 70) {
    analysis.strengths.push('High domain authority');
  } else if (analysis.domainAuthority < 40) {
    analysis.weaknesses.push('Low domain authority');
    analysis.opportunities.push('Opportunity to outrank with quality content');
  }
  
  if (analysis.backlinks > 20000) {
    analysis.strengths.push('Strong backlink profile');
  } else if (analysis.backlinks < 5000) {
    analysis.weaknesses.push('Limited backlinks');
    analysis.opportunities.push('Build more backlinks than competitor');
  }
  
  competitorSEO.set(competitorId, analysis);
  
  return analysis;
}

// ============================================================================
// SEO AUDIT
// ============================================================================

function performSEOAudit(contentId, contentData = {}) {
  const auditId = generateId('audit');
  
  const checks = {
    hasTitle: !!contentData.title,
    titleLength: contentData.title && contentData.title.length >= 30 && contentData.title.length <= 65,
    hasMetaDescription: !!contentData.metaDescription,
    metaDescriptionLength: contentData.metaDescription && contentData.metaDescription.length >= 120 && contentData.metaDescription.length <= 170,
    hasKeywords: contentData.keywords && contentData.keywords.length > 0,
    hasH1: !!contentData.h1,
    hasSchema: !!contentData.schema,
    hasInternalLinks: (contentData.internalLinks || 0) > 0,
    hasExternalLinks: (contentData.externalLinks || 0) > 0,
    mobileFriendly: !!contentData.mobileFriendly,
    hasAltText: !!contentData.hasAltText,
    fastPageSpeed: contentData.pageSpeed ? contentData.pageSpeed > 80 : false
  };
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  const score = Math.round((passedChecks / totalChecks) * 100);
  
  const issues = Object.entries(checks)
    .filter(([key, passed]) => !passed)
    .map(([key]) => ({
      issue: key.replace(/([A-Z])/g, ' $1').toLowerCase(),
      severity: ['hasTitle', 'hasMetaDescription', 'hasKeywords'].includes(key) ? 'high' : 'medium',
      recommendation: `Fix: ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`
    }));
  
  const audit = {
    id: auditId,
    contentId,
    score,
    grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D',
    checks,
    passedChecks,
    totalChecks,
    issues,
    criticalIssues: issues.filter(i => i.severity === 'high').length,
    auditedAt: new Date().toISOString()
  };
  
  seoAudits.set(auditId, audit);
  
  return audit;
}

// ============================================================================
// STATISTICS & REPORTING
// ============================================================================

function getStatistics() {
  const all = Array.from(seoScores.values());
  const totalScores = all.length;
  const averageScore = totalScores ? Math.round(all.reduce((acc, s) => acc + s.score, 0) / totalScores) : 0;
  const byGrade = all.reduce((acc, s) => {
    acc[s.grade] = (acc[s.grade] || 0) + 1;
    return acc;
  }, {});
  
  return { 
    totalScores, 
    averageScore, 
    byGrade, 
    keywordHistory: keywordHistory.slice(-20),
    totalMetadataAnalyses: metadataStore.size,
    totalSchemas: schemaMarkup.size,
    totalAudits: seoAudits.size,
    totalCompetitorAnalyses: competitorSEO.size,
    highScores: all.filter(s => s.score >= 80).length,
    lowScores: all.filter(s => s.score < 60).length
  };
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================

module.exports = {
  // SEO Scoring
  scoreBrief,
  getSEOScore,
  updateSEOScore,
  deleteSEOScore,
  
  // Keyword Analysis
  analyzeKeywords,
  suggestKeywords,
  keywordDifficultyAnalysis,
  
  // Metadata
  analyzeMetadata,
  optimizeMetadata,
  
  // Schema
  suggestSchema,
  validateSchema,
  
  // Content Optimization
  analyzeContent,
  suggestContentImprovements,
  
  // Competitor Analysis
  analyzeCompetitorSEO,
  
  // SEO Audit
  performSEOAudit,
  
  // Statistics
  getStatistics,
};
