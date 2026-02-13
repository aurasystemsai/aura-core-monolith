/**
 * Brand Mention Tracker V2 - Mention Monitoring Engine
 * Handles multi-source mention capture, deduplication, and source credibility scoring
 */

const mentions = new Map();
const sources = new Map();
const searchQueries = new Map();
const monitoringSessions = new Map();

/**
 * Track mention from any source
 */
async function captureMention(mentionData) {
  const mentionId = `mention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Check for duplicates
  const duplicate = await findDuplicateMention(mentionData);
  if (duplicate) {
    return { isDuplicate: true, originalMentionId: duplicate.id };
  }
  
  const mention = {
    id: mentionId,
    content: mentionData.content,
    title: mentionData.title || null,
    url: mentionData.url,
    sourceType: mentionData.sourceType, // web, twitter, facebook, instagram, linkedin, news, forum, blog, podcast, youtube
    sourceName: mentionData.sourceName,
    author: mentionData.author || 'Unknown',
    authorProfile: mentionData.authorProfile || null,
    publishedAt: mentionData.publishedAt || new Date().toISOString(),
    capturedAt: new Date().toISOString(),
    language: mentionData.language || detectLanguage(mentionData.content),
    country: mentionData.country || null,
    city: mentionData.city || null,
    reach: mentionData.reach || 0, // estimated audience size
    engagement: {
      likes: mentionData.engagement?.likes || 0,
      shares: mentionData.engagement?.shares || 0,
      comments: mentionData.engagement?.comments || 0,
      views: mentionData.engagement?.views || 0
    },
    keywords: extractKeywords(mentionData.content),
    brands: mentionData.brands || [],
    competitors: mentionData.competitors || [],
    sentiment: null, // to be filled by sentiment engine
    credibilityScore: calculateSourceCredibility(mentionData),
    isVerified: mentionData.isVerified || false,
    tags: mentionData.tags || [],
    metadata: mentionData.metadata || {}
  };
  
  mentions.set(mentionId, mention);
  
  // Update source statistics
  updateSourceStats(mention.sourceType, mention.sourceName);
  
  return {
    isDuplicate: false,
    mention
  };
}

/**
 * Find duplicate mentions based on content similarity
 */
async function findDuplicateMention(mentionData) {
  const threshold = 0.85; // 85% similarity
  
  for (const [id, existing] of mentions.entries()) {
    if (existing.url === mentionData.url) {
      return existing;
    }
    
    // Check content similarity
    const similarity = calculateSimilarity(existing.content, mentionData.content);
    if (similarity > threshold) {
      return existing;
    }
  }
  
  return null;
}

/**
 * Calculate text similarity (simple Jaccard similarity)
 */
function calculateSimilarity(text1, text2) {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Detect language from content
 */
function detectLanguage(content) {
  // Simple heuristic - could be enhanced with real language detection library
  const commonWords = {
    en: ['the', 'is', 'and', 'to', 'a', 'of', 'in', 'that'],
    es: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un'],
    fr: ['le', 'de', 'un', 'être', 'et', 'à', 'il', 'avoir'],
    de: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das']
  };
  
  const words = content.toLowerCase().split(/\s+/).slice(0, 50);
  const scores = {};
  
  for (const [lang, common] of Object.entries(commonWords)) {
    scores[lang] = words.filter(w => common.includes(w)).length;
  }
  
  const detectedLang = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  return scores[detectedLang] > 0 ? detectedLang : 'unknown';
}

/**
 * Extract keywords from content
 */
function extractKeywords(content) {
  const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by', 'from']);
  
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));
  
  const frequency = {};
  words.forEach(w => frequency[w] = (frequency[w] || 0) + 1);
  
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Calculate source credibility score
 */
function calculateSourceCredibility(mentionData) {
  let score = 50; // base score
  
  // Verified source bonus
  if (mentionData.isVerified) score += 20;
  
  // High reach bonus
  if (mentionData.reach > 100000) score += 15;
  else if (mentionData.reach > 10000) score += 10;
  else if (mentionData.reach > 1000) score += 5;
  
  // News sources are generally more credible
  if (mentionData.sourceType === 'news') score += 15;
  
  // High engagement indicates quality
  const totalEngagement = (mentionData.engagement?.likes || 0) + 
                         (mentionData.engagement?.shares || 0) + 
                         (mentionData.engagement?.comments || 0);
  if (totalEngagement > 1000) score += 10;
  else if (totalEngagement > 100) score += 5;
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Update source statistics
 */
function updateSourceStats(sourceType, sourceName) {
  const key = `${sourceType}:${sourceName}`;
  const stats = sources.get(key) || {
    sourceType,
    sourceName,
    mentionCount: 0,
    firstSeenAt: new Date().toISOString(),
    lastSeenAt: null
  };
  
  stats.mentionCount++;
  stats.lastSeenAt = new Date().toISOString();
  
  sources.set(key, stats);
}

/**
 * Get mentions with filters
 */
async function getMentions(filters = {}) {
  let results = Array.from(mentions.values());
  
  // Filter by source type
  if (filters.sourceType) {
    results = results.filter(m => m.sourceType === filters.sourceType);
  }
  
  // Filter by brand
  if (filters.brand) {
    results = results.filter(m => m.brands.includes(filters.brand));
  }
  
  // Filter by date range
  if (filters.startDate) {
    results = results.filter(m => new Date(m.publishedAt) >= new Date(filters.startDate));
  }
  if (filters.endDate) {
    results = results.filter(m => new Date(m.publishedAt) <= new Date(filters.endDate));
  }
  
  // Filter by language
  if (filters.language) {
    results = results.filter(m => m.language === filters.language);
  }
  
  // Filter by country
  if (filters.country) {
    results = results.filter(m => m.country === filters.country);
  }
  
  // Filter by credibility
  if (filters.minCredibility) {
    results = results.filter(m => m.credibilityScore >= filters.minCredibility);
  }
  
  // Search in content
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    results = results.filter(m => 
      m.content.toLowerCase().includes(searchLower) ||
      (m.title && m.title.toLowerCase().includes(searchLower))
    );
  }
  
  // Sort
  const sortBy = filters.sortBy || 'publishedAt';
  const sortOrder = filters.sortOrder || 'desc';
  
  results.sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    if (sortBy === 'publishedAt' || sortBy === 'capturedAt') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });
  
  // Pagination
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  
  return {
    mentions: results.slice(offset, offset + limit),
    total: results.length,
    offset,
    limit
  };
}

/**
 * Create saved search query
 */
async function createSearchQuery(queryData) {
  const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const query = {
    id: queryId,
    name: queryData.name,
    description: queryData.description || '',
    keywords: queryData.keywords || [],
    excludeKeywords: queryData.excludeKeywords || [],
    sourceTypes: queryData.sourceTypes || [],
    languages: queryData.languages || [],
    countries: queryData.countries || [],
    minCredibility: queryData.minCredibility || 0,
    isActive: queryData.isActive !== false,
    createdAt: new Date().toISOString(),
    lastRunAt: null,
    matchCount: 0
  };
  
  searchQueries.set(queryId, query);
  return query;
}

/**
 * Execute search query
 */
async function executeSearchQuery(queryId) {
  const query = searchQueries.get(queryId);
  if (!query) {
    throw new Error('Query not found');
  }
  
  const filters = {
    sourceType: query.sourceTypes.length === 1 ? query.sourceTypes[0] : null,
    language: query.languages.length === 1 ? query.languages[0] : null,
    country: query.countries.length === 1 ? query.countries[0] : null,
    minCredibility: query.minCredibility
  };
  
  let results = Array.from(mentions.values());
  
  // Apply filters
  if (filters.sourceType) {
    results = results.filter(m => m.sourceType === filters.sourceType);
  }
  if (filters.language) {
    results = results.filter(m => m.language === filters.language);
  }
  if (filters.country) {
    results = results.filter(m => m.country === filters.country);
  }
  if (filters.minCredibility) {
    results = results.filter(m => m.credibilityScore >= filters.minCredibility);
  }
  
  // Keyword matching
  if (query.keywords.length > 0) {
    results = results.filter(m => {
      const content = `${m.content} ${m.title || ''}`.toLowerCase();
      return query.keywords.some(kw => content.includes(kw.toLowerCase()));
    });
  }
  
  // Exclude keywords
  if (query.excludeKeywords.length > 0) {
    results = results.filter(m => {
      const content = `${m.content} ${m.title || ''}`.toLowerCase();
      return !query.excludeKeywords.some(kw => content.includes(kw.toLowerCase()));
    });
  }
  
  // Update query stats
  query.lastRunAt = new Date().toISOString();
  query.matchCount = results.length;
  searchQueries.set(queryId, query);
  
  return results;
}

/**
 * Start monitoring session
 */
async function startMonitoringSession(sessionData) {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const session = {
    id: sessionId,
    name: sessionData.name,
    brands: sessionData.brands || [],
    competitors: sessionData.competitors || [],
    keywords: sessionData.keywords || [],
    sourceTypes: sessionData.sourceTypes || ['web', 'twitter', 'facebook', 'news'],
    pollInterval: sessionData.pollInterval || 300000, // 5 minutes default
    isActive: true,
    startedAt: new Date().toISOString(),
    stoppedAt: null,
    mentionsCaptured: 0,
    lastPollAt: null
  };
  
  monitoringSessions.set(sessionId, session);
  return session;
}

/**
 * Stop monitoring session
 */
async function stopMonitoringSession(sessionId) {
  const session = monitoringSessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  session.isActive = false;
  session.stoppedAt = new Date().toISOString();
  
  monitoringSessions.set(sessionId, session);
  return session;
}

/**
 * Get source statistics
 */
async function getSourceStatistics() {
  const stats = Array.from(sources.values());
  
  const byType = {};
  stats.forEach(s => {
    if (!byType[s.sourceType]) {
      byType[s.sourceType] = {
        count: 0,
        mentions: 0
      };
    }
    byType[s.sourceType].count++;
    byType[s.sourceType].mentions += s.mentionCount;
  });
  
  return {
    totalSources: stats.length,
    totalMentions: Array.from(mentions.values()).length,
    sourcesByType: byType,
    topSources: stats
      .sort((a, b) => b.mentionCount - a.mentionCount)
      .slice(0, 10)
  };
}

/**
 * Get monitoring statistics
 */
async function getMonitoringStatistics() {
  const allMentions = Array.from(mentions.values());
  const activeSessions = Array.from(monitoringSessions.values()).filter(s => s.isActive);
  
  // Mentions by source type
  const bySourceType = {};
  allMentions.forEach(m => {
    bySourceType[m.sourceType] = (bySourceType[m.sourceType] || 0) + 1;
  });
  
  // Mentions by language
  const byLanguage = {};
  allMentions.forEach(m => {
    byLanguage[m.language] = (byLanguage[m.language] || 0) + 1;
  });
  
  // Mentions by country
  const byCountry = {};
  allMentions.forEach(m => {
    if (m.country) {
      byCountry[m.country] = (byCountry[m.country] || 0) + 1;
    }
  });
  
  return {
    totalMentions: allMentions.length,
    activeSessions: activeSessions.length,
    savedQueries: searchQueries.size,
    mentionsBySourceType: bySourceType,
    mentionsByLanguage: byLanguage,
    mentionsByCountry: byCountry,
    averageCredibility: allMentions.reduce((sum, m) => sum + m.credibilityScore, 0) / allMentions.length || 0,
    totalReach: allMentions.reduce((sum, m) => sum + m.reach, 0),
    totalEngagement: allMentions.reduce((sum, m) => 
      sum + m.engagement.likes + m.engagement.shares + m.engagement.comments, 0
    )
  };
}

module.exports = {
  captureMention,
  findDuplicateMention,
  getMentions,
  createSearchQuery,
  executeSearchQuery,
  startMonitoringSession,
  stopMonitoringSession,
  getSourceStatistics,
  getMonitoringStatistics
};
