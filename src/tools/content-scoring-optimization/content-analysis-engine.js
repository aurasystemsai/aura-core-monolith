/**
 * Content Analysis Engine
 * Core content parsing, structure analysis, and quality metrics
 */

// In-memory storage
const contentAnalyses = new Map();
let analysisIdCounter = 1;

/**
 * Analyze content structure and quality
 */
function analyzeContent(data) {
  const {
    contentId,
    title = '',
    body = '',
    metaDescription = '',
    url = '',
    contentType = 'article', // article, blog_post, product_page, landing_page
    targetKeyword = '',
    language = 'en'
  } = data;

  const analysis = {
    id: analysisIdCounter++,
    contentId,
    title,
    body,
    url,
    contentType,
    targetKeyword,
    language,
    analyzedAt: new Date().toISOString(),
    
    // Word count metrics
    wordCount: {
      total: countWords(body),
      title: countWords(title),
      metaDescription: countWords(metaDescription),
      uniqueWords: countUniqueWords(body),
      averageWordLength: calculateAverageWordLength(body)
    },
    
    // Structure analysis
    structure: {
      paragraphs: countParagraphs(body),
      sentences: countSentences(body),
      averageParagraphLength: calculateAverageParagraphLength(body),
      averageSentenceLength: calculateAverageSentenceLength(body),
      headers: extractHeaders(body),
      lists: countLists(body),
      images: countImages(body),
      links: extractLinks(body)
    },
    
    // Content quality metrics
    quality: {
      titleScore: scoreTitleQuality(title, targetKeyword),
      metaDescriptionScore: scoreMetaDescription(metaDescription, targetKeyword),
      contentDepth: calculateContentDepth(body),
      contentFreshness: 100, // Placeholder for freshness score
      grammarScore: 85, // Placeholder for grammar checking
      spellingScore: 90 // Placeholder for spell checking
    },
    
    // Keyword analysis
    keywords: {
      target: targetKeyword,
      density: calculateKeywordDensity(body, targetKeyword),
      inTitle: title.toLowerCase().includes(targetKeyword.toLowerCase()),
      inMetaDescription: metaDescription.toLowerCase().includes(targetKeyword.toLowerCase()),
      inFirstParagraph: isKeywordInFirstParagraph(body, targetKeyword),
      inHeaders: countKeywordInHeaders(body, targetKeyword),
      prominence: calculateKeywordProminence(body, targetKeyword)
    },
    
    // Overall score (0-100)
    overallScore: 0
  };

  // Calculate overall score
  analysis.overallScore = calculateOverallScore(analysis);

  contentAnalyses.set(analysis.id, analysis);
  return analysis;
}

/**
 * Get content analysis by ID
 */
function getContentAnalysis(analysisId) {
  const analysis = contentAnalyses.get(analysisId);
  if (!analysis) {
    throw new Error('Content analysis not found');
  }
  return analysis;
}

/**
 * Update content and re-analyze
 */
function updateContent(analysisId, updates) {
  const analysis = contentAnalyses.get(analysisId);
  if (!analysis) {
    throw new Error('Content analysis not found');
  }

  // Update fields
  Object.assign(analysis, updates);
  
  // Re-analyze
  const newAnalysis = analyzeContent({
    contentId: analysis.contentId,
    title: analysis.title,
    body: analysis.body,
    metaDescription: updates.metaDescription || '',
    url: analysis.url,
    contentType: analysis.contentType,
    targetKeyword: analysis.targetKeyword,
    language: analysis.language
  });

  return newAnalysis;
}

/**
 * Compare two content versions
 */
function compareContentVersions(analysisId1, analysisId2) {
  const analysis1 = contentAnalyses.get(analysisId1);
  const analysis2 = contentAnalyses.get(analysisId2);

  if (!analysis1 || !analysis2) {
    throw new Error('One or both analyses not found');
  }

  return {
    wordCountDiff: analysis2.wordCount.total - analysis1.wordCount.total,
    scoreDiff: analysis2.overallScore - analysis1.overallScore,
    improvements: [],
    regressions: [],
    metrics: {
      before: {
        score: analysis1.overallScore,
        wordCount: analysis1.wordCount.total,
        readability: analysis1.quality.contentDepth
      },
      after: {
        score: analysis2.overallScore,
        wordCount: analysis2.wordCount.total,
        readability: analysis2.quality.contentDepth
      }
    }
  };
}

/**
 * Extract content issues
 */
function extractContentIssues(analysisId) {
  const analysis = contentAnalyses.get(analysisId);
  if (!analysis) {
    throw new Error('Content analysis not found');
  }

  const issues = [];

  // Check word count
  if (analysis.wordCount.total < 300) {
    issues.push({
      type: 'word_count',
      severity: 'critical',
      message: 'Content is too short. Aim for at least 300 words.',
      current: analysis.wordCount.total,
      target: 300
    });
  } else if (analysis.wordCount.total < 600) {
    issues.push({
      type: 'word_count',
      severity: 'warning',
      message: 'Content could be longer. Aim for 600-1000 words for better SEO.',
      current: analysis.wordCount.total,
      target: 800
    });
  }

  // Check title
  if (analysis.wordCount.title < 5) {
    issues.push({
      type: 'title_length',
      severity: 'warning',
      message: 'Title is too short. Aim for 5-10 words.',
      current: analysis.wordCount.title,
      target: 7
    });
  } else if (analysis.wordCount.title > 12) {
    issues.push({
      type: 'title_length',
      severity: 'warning',
      message: 'Title is too long. Keep it under 12 words.',
      current: analysis.wordCount.title,
      target: 10
    });
  }

  // Check meta description
  if (analysis.wordCount.metaDescription === 0) {
    issues.push({
      type: 'meta_description',
      severity: 'critical',
      message: 'Missing meta description.',
      current: 0,
      target: 155
    });
  } else if (analysis.wordCount.metaDescription > 160) {
    issues.push({
      type: 'meta_description',
      severity: 'warning',
      message: 'Meta description is too long. Keep it under 160 characters.',
      current: analysis.wordCount.metaDescription,
      target: 155
    });
  }

  // Check keyword usage
  if (!analysis.keywords.inTitle) {
    issues.push({
      type: 'keyword_placement',
      severity: 'critical',
      message: `Target keyword "${analysis.targetKeyword}" not found in title.`,
      suggestion: `Include "${analysis.targetKeyword}" in the title`
    });
  }

  if (!analysis.keywords.inFirstParagraph) {
    issues.push({
      type: 'keyword_placement',
      severity: 'warning',
      message: `Target keyword "${analysis.targetKeyword}" not in first paragraph.`,
      suggestion: 'Include target keyword in the opening paragraph'
    });
  }

  if (analysis.keywords.density < 0.5) {
    issues.push({
      type: 'keyword_density',
      severity: 'warning',
      message: 'Keyword density is too low.',
      current: analysis.keywords.density,
      target: 1.5
    });
  } else if (analysis.keywords.density > 3) {
    issues.push({
      type: 'keyword_density',
      severity: 'warning',
      message: 'Keyword density is too high. Risk of keyword stuffing.',
      current: analysis.keywords.density,
      target: 2
    });
  }

  // Check structure
  if (analysis.structure.headers.h1 === 0) {
    issues.push({
      type: 'structure',
      severity: 'critical',
      message: 'Missing H1 header tag.',
      suggestion: 'Add exactly one H1 tag (usually the title)'
    });
  } else if (analysis.structure.headers.h1 > 1) {
    issues.push({
      type: 'structure',
      severity: 'warning',
      message: 'Multiple H1 tags found. Use only one H1 per page.',
      current: analysis.structure.headers.h1,
      target: 1
    });
  }

  if (analysis.structure.headers.h2 === 0) {
    issues.push({
      type: 'structure',
      severity: 'warning',
      message: 'No H2 headers found. Use headers to structure your content.',
      suggestion: 'Add H2 headers to break up content into sections'
    });
  }

  if (analysis.structure.paragraphs > 0 && analysis.structure.averageParagraphLength > 150) {
    issues.push({
      type: 'readability',
      severity: 'warning',
      message: 'Paragraphs are too long. Break them into smaller chunks.',
      current: analysis.structure.averageParagraphLength,
      target: 100
    });
  }

  return {
    total: issues.length,
    critical: issues.filter(i => i.severity === 'critical').length,
    warnings: issues.filter(i => i.severity === 'warning').length,
    issues
  };
}

/**
 * Get content statistics
 */
function getContentStatistics() {
  const analyses = Array.from(contentAnalyses.values());

  return {
    totalAnalyses: analyses.length,
    averageScore: analyses.reduce((sum, a) => sum + a.overallScore, 0) / analyses.length || 0,
    averageWordCount: analyses.reduce((sum, a) => sum + a.wordCount.total, 0) / analyses.length || 0,
    byContentType: analyses.reduce((acc, a) => {
      acc[a.contentType] = (acc[a.contentType] || 0) + 1;
      return acc;
    }, {}),
    scoreDistribution: {
      excellent: analyses.filter(a => a.overallScore >= 90).length,
      good: analyses.filter(a => a.overallScore >= 70 && a.overallScore < 90).length,
      fair: analyses.filter(a => a.overallScore >= 50 && a.overallScore < 70).length,
      poor: analyses.filter(a => a.overallScore < 50).length
    }
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

function calculateAverageWordLength(text) {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  if (words.length === 0) return 0;
  return words.reduce((sum, word) => sum + word.length, 0) / words.length;
}

function countParagraphs(text) {
  if (!text) return 0;
  return text.split(/\n\n+/).filter(p => p.trim().length > 0).length;
}

function countSentences(text) {
  if (!text) return 0;
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
}

function calculateAverageParagraphLength(text) {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  if (paragraphs.length === 0) return 0;
  return paragraphs.reduce((sum, p) => sum + countWords(p), 0) / paragraphs.length;
}

function calculateAverageSentenceLength(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 0;
  return sentences.reduce((sum, s) => sum + countWords(s), 0) / sentences.length;
}

function extractHeaders(text) {
  return {
    h1: (text.match(/<h1[^>]*>.*?<\/h1>/gi) || []).length,
    h2: (text.match(/<h2[^>]*>.*?<\/h2>/gi) || []).length,
    h3: (text.match(/<h3[^>]*>.*?<\/h3>/gi) || []).length,
    h4: (text.match(/<h4[^>]*>.*?<\/h4>/gi) || []).length,
    total: (text.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || []).length
  };
}

function countLists(text) {
  const ulCount = (text.match(/<ul[^>]*>.*?<\/ul>/gi) || []).length;
  const olCount = (text.match(/<ol[^>]*>.*?<\/ol>/gi) || []).length;
  return { unordered: ulCount, ordered: olCount, total: ulCount + olCount };
}

function countImages(text) {
  return (text.match(/<img[^>]*>/gi) || []).length;
}

function extractLinks(text) {
  const allLinks = text.match(/<a[^>]*href=["']([^"']*)["'][^>]*>/gi) || [];
  const internal = allLinks.filter(link => !link.includes('http://') && !link.includes('https://')).length;
  const external = allLinks.length - internal;
  return { total: allLinks.length, internal, external };
}

function scoreTitleQuality(title, targetKeyword) {
  let score = 0;
  const wordCount = countWords(title);
  
  // Length score (0-30 points)
  if (wordCount >= 5 && wordCount <= 10) score += 30;
  else if (wordCount >= 3 && wordCount <= 12) score += 20;
  else score += 10;
  
  // Keyword presence (0-40 points)
  if (title.toLowerCase().includes(targetKeyword.toLowerCase())) {
    score += 40;
    // Bonus if keyword is at the beginning
    if (title.toLowerCase().startsWith(targetKeyword.toLowerCase())) {
      score += 10;
    }
  }
  
  // Character count (0-20 points)
  const charCount = title.length;
  if (charCount >= 30 && charCount <= 60) score += 20;
  else if (charCount >= 20 && charCount <= 70) score += 10;
  
  return Math.min(100, score);
}

function scoreMetaDescription(metaDescription, targetKeyword) {
  let score = 0;
  const charCount = metaDescription.length;
  
  // Length score (0-40 points)
  if (charCount >= 120 && charCount <= 160) score += 40;
  else if (charCount >= 100 && charCount <= 170) score += 25;
  else if (charCount > 0) score += 10;
  
  // Keyword presence (0-40 points)
  if (metaDescription.toLowerCase().includes(targetKeyword.toLowerCase())) {
    score += 40;
  }
  
  // Call to action detection (0-20 points)
  const ctaWords = ['learn', 'discover', 'find out', 'get', 'try', 'buy', 'shop', 'read'];
  if (ctaWords.some(cta => metaDescription.toLowerCase().includes(cta))) {
    score += 20;
  }
  
  return Math.min(100, score);
}

function calculateContentDepth(text) {
  const wordCount = countWords(text);
  
  if (wordCount >= 2000) return 100;
  if (wordCount >= 1500) return 90;
  if (wordCount >= 1000) return 75;
  if (wordCount >= 600) return 60;
  if (wordCount >= 300) return 40;
  return 20;
}

function calculateKeywordDensity(text, keyword) {
  if (!text || !keyword) return 0;
  const totalWords = countWords(text);
  const keywordOccurrences = (text.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
  return totalWords > 0 ? (keywordOccurrences / totalWords) * 100 : 0;
}

function isKeywordInFirstParagraph(text, keyword) {
  const firstParagraph = text.split(/\n\n+/)[0] || '';
  return firstParagraph.toLowerCase().includes(keyword.toLowerCase());
}

function countKeywordInHeaders(text, keyword) {
  const headers = text.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
  return headers.filter(h => h.toLowerCase().includes(keyword.toLowerCase())).length;
}

function calculateKeywordProminence(text, keyword) {
  const words = text.toLowerCase().split(/\s+/);
  const firstOccurrence = words.findIndex(w => w.includes(keyword.toLowerCase()));
  
  if (firstOccurrence === -1) return 0;
  
  // Score based on position (earlier = higher score)
  const positionPercent = (firstOccurrence / words.length) * 100;
  if (positionPercent < 10) return 100;
  if (positionPercent < 25) return 80;
  if (positionPercent < 50) return 60;
  return 40;
}

function calculateOverallScore(analysis) {
  let score = 0;
  
  // Title quality (0-20 points)
  score += (analysis.quality.titleScore / 100) * 20;
  
  // Meta description (0-15 points)
  score += (analysis.quality.metaDescriptionScore / 100) * 15;
  
  // Content depth (0-20 points)
  score += (analysis.quality.contentDepth / 100) * 20;
  
  // Keyword optimization (0-25 points)
  let keywordScore = 0;
  if (analysis.keywords.inTitle) keywordScore += 8;
  if (analysis.keywords.inMetaDescription) keywordScore += 5;
  if (analysis.keywords.inFirstParagraph) keywordScore += 5;
  if (analysis.keywords.density >= 0.5 && analysis.keywords.density <= 2.5) keywordScore += 7;
  score += keywordScore;
  
  // Structure (0-20 points)
  let structureScore = 0;
  if (analysis.structure.headers.h1 === 1) structureScore += 5;
  if (analysis.structure.headers.h2 >= 2) structureScore += 5;
  if (analysis.structure.paragraphs >= 3) structureScore += 5;
  if (analysis.structure.links.total >= 2) structureScore += 5;
  score += structureScore;
  
  return Math.round(Math.min(100, score));
}

module.exports = {
  analyzeContent,
  getContentAnalysis,
  updateContent,
  compareContentVersions,
  extractContentIssues,
  getContentStatistics
};
