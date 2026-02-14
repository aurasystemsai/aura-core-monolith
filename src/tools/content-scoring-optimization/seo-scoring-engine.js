/**
 * SEO Scoring Engine
 * Comprehensive SEO analysis and optimization scoring
 */

// In-memory storage
const seoScores = new Map();
let scoreIdCounter = 1;

/**
 * Analyze SEO factors for content
 */
function analyzeSEO(data) {
  const {
    contentId,
    url,
    title,
    metaDescription,
    body,
    targetKeyword,
    focusKeyphrases = [],
    images = [],
    canonicalUrl = '',
    robotsMeta = 'index,follow'
  } = data;

  const seoScore = {
    id: scoreIdCounter++,
    contentId,
    url,
    analyzedAt: new Date().toISOString(),
    
    // On-page SEO factors
    onPage: {
      titleTag: {
        present: !!title,
        length: title ? title.length : 0,
        hasKeyword: title ? title.toLowerCase().includes(targetKeyword.toLowerCase()) : false,
        score: scoreTitleTag(title, targetKeyword)
      },
      metaDescription: {
        present: !!metaDescription,
        length: metaDescription ? metaDescription.length : 0,
        hasKeyword: metaDescription ? metaDescription.toLowerCase().includes(targetKeyword.toLowerCase()) : false,
        score: scoreMetaDescription(metaDescription, targetKeyword)
      },
      url: {
        length: url.length,
        hasKeyword: url.toLowerCase().includes(targetKeyword.toLowerCase().replace(/\s+/g, '-')),
        hasStopWords: hasURLStopWords(url),
        score: scoreURL(url, targetKeyword)
      },
      headings: analyzeHeadingStructure(body, targetKeyword),
      keywordUsage: analyzeKeywordUsage(body, title, metaDescription, targetKeyword),
      contentQuality: {
        wordCount: countWords(body),
        uniqueWords: countUniqueWords(body),
        readingLevel: calculateReadingLevel(body),
        score: scoreContentQuality(body)
      }
    },
    
    // Technical SEO
    technical: {
      canonical: {
        present: !!canonicalUrl,
        url: canonicalUrl,
        score: canonicalUrl ? 100 : 0
      },
      robotsMeta: {
        value: robotsMeta,
        indexable: robotsMeta.includes('index'),
        followable: robotsMeta.includes('follow'),
        score: scoreRobotsMeta(robotsMeta)
      },
      images: analyzeImages(images, targetKeyword),
      internalLinks: extractInternalLinks(body),
      externalLinks: extractExternalLinks(body),
      mobileOptimized: true, // Placeholder
      pagespeed: 85 // Placeholder
    },
    
    // Keyword strategy
    keywords: {
      target: targetKeyword,
      focus: focusKeyphrases,
      density: calculateKeywordDensity(body, targetKeyword),
      prominence: calculateKeywordProminence(body, targetKeyword),
      distribution: analyzeKeywordDistribution(body, targetKeyword),
      relatedTerms: extractRelatedTerms(body, targetKeyword),
      score: scoreKeywordStrategy(body, title, metaDescription, targetKeyword, focusKeyphrases)
    },
    
    // Schema markup
    schema: {
      present: detectSchemaMarkup(body),
      types: extractSchemaTypes(body),
      score: detectSchemaMarkup(body) ? 100 : 0
    },
    
    // Overall SEO score (0-100)
    overallScore: 0,
    grade: '',
    recommendations: []
  };

  // Calculate overall score
  seoScore.overallScore = calculateSEOScore(seoScore);
  seoScore.grade = getScoreGrade(seoScore.overallScore);
  seoScore.recommendations = generateSEORecommendations(seoScore);

  seoScores.set(seoScore.id, seoScore);
  return seoScore;
}

/**
 * Get SEO score by ID
 */
function getSEOScore(scoreId) {
  const score = seoScores.get(scoreId);
  if (!score) {
    throw new Error('SEO score not found');
  }
  return score;
}

/**
 * Update SEO analysis
 */
function updateSEOAnalysis(scoreId, updates) {
  const score = seoScores.get(scoreId);
  if (!score) {
    throw new Error('SEO score not found');
  }

  // Re-analyze with updates
  const newScore = analyzeSEO({
    ...updates,
    contentId: score.contentId
  });

  return newScore;
}

/**
 * Get keyword suggestions based on content
 */
function suggestKeywords(data) {
  const { body, currentKeywords = [], count = 10 } = data;

  // Extract potential keywords from content
  const words = body.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);

  // Count word frequency
  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Sort by frequency and filter out current keywords
  const suggestions = Object.entries(frequency)
    .filter(([word]) => !currentKeywords.includes(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word, freq]) => ({
      keyword: word,
      frequency: freq,
      searchVolume: Math.floor(Math.random() * 10000) + 100, // Placeholder
      difficulty: Math.floor(Math.random() * 100), // Placeholder
      relevance: Math.min(100, (freq / words.length) * 1000)
    }));

  return {
    suggestions,
    count: suggestions.length,
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Analyze competitor SEO
 */
function analyzeCompetitorSEO(data) {
  const { targetKeyword, competitorUrls = [] } = data;

  // Simulate competitor analysis
  const competitors = competitorUrls.map((url, index) => ({
    url,
    ranking: index + 1,
    seoScore: Math.floor(Math.random() * 40) + 60, // 60-100
    wordCount: Math.floor(Math.random() * 2000) + 500,
    backlinks: Math.floor(Math.random() * 1000) + 10,
    domainAuthority: Math.floor(Math.random() * 50) + 50,
    keywordDensity: (Math.random() * 2 + 0.5).toFixed(2),
    hasSchema: Math.random() > 0.5,
    mobileOptimized: Math.random() > 0.3,
    pagespeed: Math.floor(Math.random() * 30) + 70
  }));

  const average = {
    seoScore: competitors.reduce((sum, c) => sum + c.seoScore, 0) / competitors.length,
    wordCount: Math.round(competitors.reduce((sum, c) => sum + c.wordCount, 0) / competitors.length),
    backlinks: Math.round(competitors.reduce((sum, c) => sum + c.backlinks, 0) / competitors.length),
    domainAuthority: Math.round(competitors.reduce((sum, c) => sum + c.domainAuthority, 0) / competitors.length)
  };

  return {
    targetKeyword,
    competitorCount: competitors.length,
    competitors,
    average,
    insights: [
      `Average competitor SEO score: ${average.seoScore.toFixed(1)}`,
      `Average content length: ${average.wordCount} words`,
      `Average backlinks: ${average.backlinks}`,
      `${competitors.filter(c => c.hasSchema).length} competitors use schema markup`
    ],
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Generate schema markup suggestions
 */
function suggestSchemaMarkup(data) {
  const { contentType, context = {} } = data;

  const schemas = {
    'article': {
      type: 'Article',
      required: ['headline', 'author', 'datePublished'],
      optional: ['image', 'publisher', 'description'],
      example: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': context.title || 'Article Title',
        'author': {
          '@type': 'Person',
          'name': context.author || 'Author Name'
        },
        'datePublished': new Date().toISOString(),
        'image': context.image || 'https://example.com/image.jpg'
      }
    },
    'product': {
      type: 'Product',
      required: ['name', 'description'],
      optional: ['image', 'brand', 'offers'],
      example: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': context.name || 'Product Name',
        'description': context.description || 'Product description',
        'image': context.image || 'https://example.com/product.jpg',
        'offers': {
          '@type': 'Offer',
          'price': context.price || '0.00',
          'priceCurrency': 'USD'
        }
      }
    },
    'faq': {
      type: 'FAQPage',
      required: ['mainEntity'],
      optional: [],
      example: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'Question 1',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Answer 1'
            }
          }
        ]
      }
    },
    'blog_post': {
      type: 'BlogPosting',
      required: ['headline', 'author', 'datePublished'],
      optional: ['image', 'publisher'],
      example: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        'headline': context.title || 'Blog Post Title',
        'author': {
          '@type': 'Person',
          'name': context.author || 'Author Name'
        },
        'datePublished': new Date().toISOString()
      }
    }
  };

  const suggestion = schemas[contentType] || schemas['article'];

  return {
    contentType,
    recommendedSchema: suggestion.type,
    requiredFields: suggestion.required,
    optionalFields: suggestion.optional,
    example: suggestion.example,
    implementation: `<script type="application/ld+json">\n${JSON.stringify(suggestion.example, null, 2)}\n</script>`
  };
}

/**
 * Get SEO statistics
 */
function getSEOStatistics() {
  const scores = Array.from(seoScores.values());

  return {
    totalAnalyses: scores.length,
    averageScore: scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length || 0,
    gradeDistribution: {
      A: scores.filter(s => s.overallScore >= 90).length,
      B: scores.filter(s => s.overallScore >= 80 && s.overallScore < 90).length,
      C: scores.filter(s => s.overallScore >= 70 && s.overallScore < 80).length,
      D: scores.filter(s => s.overallScore >= 60 && s.overallScore < 70).length,
      F: scores.filter(s => s.overallScore < 60).length
    },
    commonIssues: [
      { issue: 'Missing meta description', count: scores.filter(s => !s.onPage.metaDescription.present).length },
      { issue: 'Title too short/long', count: scores.filter(s => s.onPage.titleTag.length < 30 || s.onPage.titleTag.length > 60).length },
      { issue: 'No schema markup', count: scores.filter(s => !s.schema.present).length },
      { issue: 'Low keyword density', count: scores.filter(s => s.keywords.density < 0.5).length }
    ]
  };
}

// Helper functions

function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function countUniqueWords(text) {
  if (!text) return 0;
  const words = text.toLowerCase().trim().split(/\s+/).filter(word => word.length > 0);
  return new Set(words).size;
}

function scoreTitleTag(title, keyword) {
  if (!title) return 0;
  let score = 0;
  
  // Length (0-30 points)
  if (title.length >= 30 && title.length <= 60) score += 30;
  else if (title.length >= 20 && title.length <= 70) score += 20;
  else score += 10;
  
  // Keyword presence (0-50 points)
  if (title.toLowerCase().includes(keyword.toLowerCase())) {
    score += 50;
    // Bonus for keyword at start
    if (title.toLowerCase().startsWith(keyword.toLowerCase())) score += 10;
  }
  
  // Uniqueness (0-20 points)
  const uniqueRatio = countUniqueWords(title) / countWords(title);
  score += uniqueRatio * 20;
  
  return Math.min(100, score);
}

function scoreMetaDescription(description, keyword) {
  if (!description) return 0;
  let score = 0;
  
  // Length (0-40 points)
  if (description.length >= 120 && description.length <= 160) score += 40;
  else if (description.length >= 100 && description.length <= 170) score += 25;
  else if (description.length > 0) score += 10;
  
  // Keyword presence (0-40 points)
  if (description.toLowerCase().includes(keyword.toLowerCase())) score += 40;
  
  // Call to action (0-20 points)
  const ctaWords = ['learn', 'discover', 'find', 'get', 'try', 'shop', 'read', 'explore'];
  if (ctaWords.some(cta => description.toLowerCase().includes(cta))) score += 20;
  
  return Math.min(100, score);
}

function scoreURL(url, keyword) {
  let score = 50; // Base score
  
  // Length check
  if (url.length < 75) score += 20;
  else if (url.length < 100) score += 10;
  
  // Keyword in URL
  const urlSlug = keyword.toLowerCase().replace(/\s+/g, '-');
  if (url.toLowerCase().includes(urlSlug)) score += 30;
  
  // No stop words
  if (!hasURLStopWords(url)) score += 10;
  
  return Math.min(100, score);
}

function hasURLStopWords(url) {
  const stopWords = ['and', 'or', 'but', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for'];
  return stopWords.some(word => url.toLowerCase().includes(`-${word}-`));
}

function analyzeHeadingStructure(body, keyword) {
  const h1Count = (body.match(/<h1[^>]*>.*?<\/h1>/gi) || []).length;
  const h2Count = (body.match(/<h2[^>]*>.*?<\/h2>/gi) || []).length;
  const h3Count = (body.match(/<h3[^>]*>.*?<\/h3>/gi) || []).length;
  
  const h1WithKeyword = (body.match(new RegExp(`<h1[^>]*>.*?${keyword}.*?<\/h1>`, 'gi')) || []).length;
  const h2WithKeyword = (body.match(new RegExp(`<h2[^>]*>.*?${keyword}.*?<\/h2>`, 'gi')) || []).length;

  let score = 0;
  if (h1Count === 1) score += 30;
  if (h2Count >= 2) score += 30;
  if (h1WithKeyword > 0) score += 20;
  if (h2WithKeyword > 0) score += 20;

  return {
    h1: h1Count,
    h2: h2Count,
    h3: h3Count,
    h1WithKeyword,
    h2WithKeyword,
    score: Math.min(100, score)
  };
}

function analyzeKeywordUsage(body, title, description, keyword) {
  const density = calculateKeywordDensity(body, keyword);
  const inTitle = title.toLowerCase().includes(keyword.toLowerCase());
  const inDescription = description.toLowerCase().includes(keyword.toLowerCase());
  const inFirstParagraph = (body.split(/\n\n/)[0] || '').toLowerCase().includes(keyword.toLowerCase());

  let score = 0;
  if (inTitle) score += 25;
  if (inDescription) score += 25;
  if (inFirstParagraph) score += 25;
  if (density >= 0.5 && density <= 2.5) score += 25;

  return {
    density,
    inTitle,
    inDescription,
    inFirstParagraph,
    score
  };
}

function scoreContentQuality(body) {
  const wordCount = countWords(body);
  let score = 0;
  
  if (wordCount >= 2000) score += 40;
  else if (wordCount >= 1000) score += 30;
  else if (wordCount >= 500) score += 20;
  else score += 10;
  
  const uniqueRatio = countUniqueWords(body) / wordCount;
  score += uniqueRatio * 60;
  
  return Math.min(100, score);
}

function scoreRobotsMeta(robotsMeta) {
  if (robotsMeta.includes('index') && robotsMeta.includes('follow')) return 100;
  if (robotsMeta.includes('index')) return 60;
  if (robotsMeta.includes('follow')) return 40;
  return 0;
}

function analyzeImages(images, keyword) {
  const total = images.length;
  const withAlt = images.filter(img => img.alt && img.alt.trim().length > 0).length;
  const withKeyword = images.filter(img => img.alt && img.alt.toLowerCase().includes(keyword.toLowerCase())).length;

  let score = 0;
  if (total > 0) score += 30;
  if (withAlt === total && total > 0) score += 40;
  if (withKeyword > 0) score += 30;

  return {
    total,
    withAlt,
    withKeyword,
    altTextCoverage: total > 0 ? (withAlt / total) * 100 : 0,
    score
  };
}

function extractInternalLinks(body) {
  // Simplified - assume links without http:// or https:// are internal
  const allLinks = body.match(/<a[^>]*href=["']([^"']*)["'][^>]*>/gi) || [];
  const internal = allLinks.filter(link => !link.includes('http://') && !link.includes('https://')).length;
  
  return {
    count: internal,
    score: internal >= 2 ? 100 : internal * 50
  };
}

function extractExternalLinks(body) {
  const allLinks = body.match(/<a[^>]*href=["'](https?:\/\/[^"']*)["'][^>]*>/gi) || [];
  
  return {
    count: allLinks.length,
    score: allLinks.length >= 1 && allLinks.length <= 5 ? 100 : 50
  };
}

function calculateKeywordDensity(text, keyword) {
  if (!text || !keyword) return 0;
  const totalWords = countWords(text);
  const keywordOccurrences = (text.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
  return totalWords > 0 ? (keywordOccurrences / totalWords) * 100 : 0;
}

function calculateKeywordProminence(text, keyword) {
  const words = text.toLowerCase().split(/\s+/);
  const firstOccurrence = words.findIndex(w => w.includes(keyword.toLowerCase()));
  
  if (firstOccurrence === -1) return 0;
  
  const positionPercent = (firstOccurrence / words.length) * 100;
  if (positionPercent < 10) return 100;
  if (positionPercent < 25) return 80;
  if (positionPercent < 50) return 60;
  return 40;
}

function analyzeKeywordDistribution(body, keyword) {
  const paragraphs = body.split(/\n\n+/);
  const withKeyword = paragraphs.filter(p => p.toLowerCase().includes(keyword.toLowerCase())).length;
  const distribution = paragraphs.length > 0 ? (withKeyword / paragraphs.length) * 100 : 0;

  return {
    totalParagraphs: paragraphs.length,
    paragraphsWithKeyword: withKeyword,
    distribution,
    score: distribution >= 30 && distribution <= 70 ? 100 : 50
  };
}

function extractRelatedTerms(body, keyword) {
  // Simplified related terms extraction
  const words = body.toLowerCase().split(/\s+/).filter(w => w.length > 4);
  const frequency = {};
  words.forEach(word => {
    if (word !== keyword.toLowerCase()) {
      frequency[word] = (frequency[word] || 0) + 1;
    }
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([term, freq]) => ({ term, frequency: freq }));
}

function scoreKeywordStrategy(body, title, description, targetKeyword, focusKeyphrases) {
  let score = 0;
  
  // Target keyword optimization (0-60 points)
  const density = calculateKeywordDensity(body, targetKeyword);
  if (density >= 0.5 && density <= 2.5) score += 20;
  if (title.toLowerCase().includes(targetKeyword.toLowerCase())) score += 20;
  if (description.toLowerCase().includes(targetKeyword.toLowerCase())) score += 20;
  
  // Focus keyphrases (0-40 points)
  const phrasesInContent = focusKeyphrases.filter(phrase => 
    body.toLowerCase().includes(phrase.toLowerCase())
  ).length;
  score += (phrasesInContent / Math.max(focusKeyphrases.length, 1)) * 40;
  
  return Math.min(100, score);
}

function detectSchemaMarkup(body) {
  return body.includes('schema.org') || body.includes('application/ld+json');
}

function extractSchemaTypes(body) {
  const types = [];
  if (body.includes('"@type":"Article"') || body.includes("'@type':'Article'")) types.push('Article');
  if (body.includes('"@type":"Product"') || body.includes("'@type':'Product'")) types.push('Product');
  if (body.includes('"@type":"FAQPage"') || body.includes("'@type':'FAQPage'")) types.push('FAQPage');
  if (body.includes('"@type":"BlogPosting"') || body.includes("'@type':'BlogPosting'")) types.push('BlogPosting');
  return types;
}

function calculateReadingLevel(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const words = countWords(text);
  const avgSentenceLength = words / Math.max(sentences, 1);
  
  if (avgSentenceLength < 15) return 'Easy';
  if (avgSentenceLength < 20) return 'Medium';
  return 'Difficult';
}

function calculateSEOScore(seoScore) {
  let score = 0;
  
  // On-page factors (50 points)
  score += (seoScore.onPage.titleTag.score / 100) * 10;
  score += (seoScore.onPage.metaDescription.score / 100) * 10;
  score += (seoScore.onPage.url.score / 100) * 5;
  score += (seoScore.onPage.headings.score / 100) * 10;
  score += (seoScore.onPage.keywordUsage.score / 100) * 10;
  score += (seoScore.onPage.contentQuality.score / 100) * 5;
  
  // Technical SEO (30 points)
  score += (seoScore.technical.canonical.score / 100) * 5;
  score += (seoScore.technical.robotsMeta.score / 100) * 5;
  score += (seoScore.technical.images.score / 100) * 5;
  score += (seoScore.technical.internalLinks.score / 100) * 5;
  score += (seoScore.technical.externalLinks.score / 100) * 5;
  score += (seoScore.technical.mobileOptimized ? 5 : 0);
  
  // Keyword strategy (10 points)
  score += (seoScore.keywords.score / 100) * 10;
  
  // Schema markup (10 points)
  score += (seoScore.schema.score / 100) * 10;
  
  return Math.round(Math.min(100, score));
}

function getScoreGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function generateSEORecommendations(seoScore) {
  const recommendations = [];

  if (seoScore.onPage.titleTag.score < 80) {
    recommendations.push({
      priority: 'high',
      category: 'Title Tag',
      issue: 'Title tag needs optimization',
      suggestion: `Optimize title tag to include target keyword and keep length between 30-60 characters`
    });
  }

  if (!seoScore.onPage.metaDescription.present) {
    recommendations.push({
      priority: 'high',
      category: 'Meta Description',
      issue: 'Missing meta description',
      suggestion: 'Add a compelling meta description between 120-160 characters'
    });
  }

  if (seoScore.onPage.headings.h1 !== 1) {
    recommendations.push({
      priority: 'high',
      category: 'Headings',
      issue: seoScore.onPage.headings.h1 === 0 ? 'Missing H1 tag' : 'Multiple H1 tags',
      suggestion: 'Use exactly one H1 tag per page'
    });
  }

  if (seoScore.keywords.density < 0.5 || seoScore.keywords.density > 2.5) {
    recommendations.push({
      priority: 'medium',
      category: 'Keyword Density',
      issue: seoScore.keywords.density < 0.5 ? 'Keyword density too low' : 'Keyword density too high',
      suggestion: `Adjust keyword usage to achieve 0.5-2.5% density (current: ${seoScore.keywords.density.toFixed(2)}%)`
    });
  }

  if (!seoScore.schema.present) {
    recommendations.push({
      priority: 'medium',
      category: 'Schema Markup',
      issue: 'No schema markup detected',
      suggestion: 'Add appropriate schema markup (Article, Product, FAQPage, etc.)'
    });
  }

  if (seoScore.technical.images.altTextCoverage < 100) {
    recommendations.push({
      priority: 'medium',
      category: 'Image Optimization',
      issue: 'Some images missing alt text',
      suggestion: `Add alt text to all images (${seoScore.technical.images.withAlt}/${seoScore.technical.images.total} have alt text)`
    });
  }

  if (seoScore.technical.internalLinks.count < 2) {
    recommendations.push({
      priority: 'low',
      category: 'Internal Linking',
      issue: 'Few internal links',
      suggestion: 'Add 2-5 relevant internal links to improve site structure'
    });
  }

  return recommendations;
}

module.exports = {
  analyzeSEO,
  getSEOScore,
  updateSEOAnalysis,
  suggestKeywords,
  analyzeCompetitorSEO,
  suggestSchemaMarkup,
  getSEOStatistics
};
