/**
 * SEARCH PERSONALIZATION ENGINE
 * Personalize search results, autocomplete, and query understanding
 */

// Storage
const searchHistory = new Map(); // userId -> searches
const searchIndex = new Map(); // term -> results
const queryRewrites = new Map();
const searchPersonalization = new Map();
const searchPerformance = new Map();
const savedSearches = new Map();

// Generate unique ID
function generateId(prefix = 'srch') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Personalized search
 */
function personalizedSearch({ query, userId, userProfile = {}, filters = {}, limit = 20 }) {
  const searchId = generateId('search');
  
  // Record search
  if (userId) {
    if (!searchHistory.has(userId)) {
      searchHistory.set(userId, []);
    }
    searchHistory.get(userId).push({
      searchId,
      query,
      timestamp: new Date().toISOString()
    });
  }
  
  // Boost based on user affinities
  const affinityBoosts = userProfile.affinities || {};
  const interestBoosts = (userProfile.interests || []).reduce((acc, interest) => {
    acc[interest.interest] = interest.score;
    return acc;
  }, {});
  
  // Simulate search results with personalization
  const results = performSearch(query, filters);
  
  // Apply personalization boosts
  const personalizedResults = results.map(result => {
    let personalizedScore = result.baseScore || 0;
    
    // Boost by category affinity
    if (result.category && affinityBoosts[result.category]) {
      personalizedScore += affinityBoosts[result.category] * 0.3;
    }
    
    // Boost by interest match
    if (result.tags) {
      result.tags.forEach(tag => {
        if (interestBoosts[tag]) {
          personalizedScore += interestBoosts[tag] * 0.2;
        }
      });
    }
    
    // Boost previously purchased/viewed
    const hasInteracted = userProfile.behavioral?.pageViews > 0;
    if (hasInteracted && result.previouslyViewed) {
      personalizedScore += 10;
    }
    
    return {
      ...result,
      personalizedScore,
      boosts: {
        affinity: affinityBoosts[result.category] || 0,
        interest: result.tags?.reduce((sum, tag) => sum + (interestBoosts[tag] || 0), 0) || 0
      }
    };
  });
  
  // Re-rank by personalized score
  personalizedResults.sort((a, b) => b.personalizedScore - a.personalizedScore);
  
  // Track search performance
  searchPerformance.set(searchId, {
    query,
    resultCount: personalizedResults.length,
    personalized: !!userId,
    timestamp: new Date().toISOString()
  });
  
  return {
    searchId,
    query,
    results: personalizedResults.slice(0, limit),
    totalResults: personalizedResults.length,
    personalized: true
  };
}

/**
 * Base search function (simplified)
 */
function performSearch(query, filters = {}) {
  // This would connect to actual search engine (Elasticsearch, Algolia, etc.)
  // Simplified mock for demonstration
  
  const lowerQuery = query.toLowerCase();
  const results = [];
  
  // Simulate search results
  for (let i = 0; i < 50; i++) {
    results.push({
      id: `result_${i}`,
      title: `Product ${i} matching ${query}`,
      category: i % 3 === 0 ? 'electronics' : i % 3 === 1 ? 'clothing' : 'home',
      tags: [`tag_${i % 5}`, `cat_${i % 3}`],
      baseScore: 100 - i,
      price: 10 + i * 5,
      inStock: i % 7 !== 0
    });
  }
  
  return results;
}

/**
 * Get personalized autocomplete suggestions
 */
function getAutocompleteSuggestions({ prefix, userId, userProfile = {}, limit = 10 }) {
  const suggestions = [];
  
  // Get user's search history
  const history = searchHistory.get(userId) || [];
  const recentSearches = history
    .slice(-20)
    .map(s => s.query)
    .filter(q => q.toLowerCase().startsWith(prefix.toLowerCase()));
  
  // Add recent searches
  recentSearches.forEach(query => {
    suggestions.push({
      query,
      type: 'recent',
      score: 100
    });
  });
  
  // Add trending searches in user's interests
  const userInterests = userProfile.interests || [];
  userInterests.forEach(interest => {
    if (interest.interest.toLowerCase().includes(prefix.toLowerCase())) {
      suggestions.push({
        query: interest.interest,
        type: 'interest',
        score: interest.score || 50
      });
    }
  });
  
  // Add popular searches
  const popularTerms = getPopularSearches({ prefix, limit: 5 });
  popularTerms.forEach(term => {
    suggestions.push({
      query: term.query,
      type: 'popular',
      score: term.count
    });
  });
  
  // Deduplicate and sort
  const unique = new Map();
  suggestions.forEach(sug => {
    if (!unique.has(sug.query) || unique.get(sug.query).score < sug.score) {
      unique.set(sug.query, sug);
    }
  });
  
  return Array.from(unique.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get popular search terms
 */
function getPopularSearches(options = {}) {
  const { prefix = '', limit = 10, timeWindow = 7 } = options;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeWindow);
  
  const queryCounts = new Map();
  
  searchHistory.forEach(userSearches => {
    userSearches
      .filter(s => new Date(s.timestamp) > cutoffDate)
      .forEach(search => {
        if (!prefix || search.query.toLowerCase().startsWith(prefix.toLowerCase())) {
          queryCounts.set(search.query, (queryCounts.get(search.query) || 0) + 1);
        }
      });
  });
  
  return Array.from(queryCounts.entries())
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Create query rewrite rule
 */
function createQueryRewrite({ from, to, Type = 'synonym', enabled = true }) {
  const ruleId = generateId('rewrite');
  
  const rule = {
    id: ruleId,
    from,
    to,
    type, // synonym, correction, expansion
    enabled,
    timesApplied: 0,
    createdAt: new Date().toISOString()
  };
  
  queryRewrites.set(ruleId, rule);
  
  return rule;
}

/**
 * Apply query rewrites
 */
function applyQueryRewrites(query) {
  let rewrittenQuery = query;
  const appliedRules = [];
  
  queryRewrites.forEach(rule => {
    if (!rule.enabled) return;
    
    const regex = new RegExp(`\\b${rule.from}\\b`, 'gi');
    if (regex.test(rewrittenQuery)) {
      rewrittenQuery = rewrittenQuery.replace(regex, rule.to);
      rule.timesApplied++;
      appliedRules.push({
        ruleId: rule.id,
        from: rule.from,
        to: rule.to,
        type: rule.type
      });
    }
  });
  
  return {
    original: query,
    rewritten: rewrittenQuery,
    appliedRules,
    changed: query !== rewrittenQuery
  };
}

/**
 * Save search for user
 */
function saveSearch({ userId, query, filters = {}, name = '' }) {
  const savedSearchId = generateId('saved');
  
  const saved = {
    id: savedSearchId,
    userId,
    query,
    filters,
    name: name || query,
    resultCount: 0,
    lastRun: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  
  savedSearches.set(savedSearchId, saved);
  
  return saved;
}

/**
 * Get saved searches for user
 */
function getUserSavedSearches(userId) {
  return Array.from(savedSearches.values())
    .filter(s => s.userId === userId)
    .sort((a, b) => new Date(b.lastRun) - new Date(a.lastRun));
}

/**
 * Get search intent
 */
function getSearchIntent(query) {
  const lowerQuery = query.toLowerCase();
  
  // Informational intent
  const informationalKeywords = ['how', 'what', 'why', 'when', 'where', 'guide', 'tutorial'];
  if (informationalKeywords.some(kw => lowerQuery.includes(kw))) {
    return {
      intent: 'informational',
      confidence: 0.8,
      suggestedContent: ['blog', 'guide', 'faq']
    };
  }
  
  // Transactional intent
  const transactionalKeywords = ['buy', 'purchase', 'order', 'price', 'cheap', 'deal', 'sale'];
  if (transactionalKeywords.some(kw => lowerQuery.includes(kw))) {
    return {
      intent: 'transactional',
      confidence: 0.9,
      suggestedContent: ['products', 'deals', 'checkout']
    };
  }
  
  // Navigational intent
  const navigationalKeywords = ['login', 'account', 'cart', 'checkout', 'contact'];
  if (navigationalKeywords.some(kw => lowerQuery.includes(kw))) {
    return {
      intent: 'navigational',
      confidence: 0.85,
      suggestedContent: ['pages', 'navigation']
    };
  }
  
  // Default: commercial investigation
  return {
    intent: 'commercial',
    confidence: 0.6,
    suggestedContent: ['products', 'comparisons', 'reviews']
  };
}

/**
 * Get search insights for user
 */
function getUserSearchInsights(userId) {
  const userSearches = searchHistory.get(userId) || [];
  
  if (userSearches.length === 0) {
    return {
      totalSearches: 0,
      topQueries: [],
      searchFrequency: 0,
      avgResultsClicked: 0
    };
  }
  
  // Count queries
  const queryCounts = new Map();
  userSearches.forEach(search => {
    queryCounts.set(search.query, (queryCounts.get(search.query) || 0) + 1);
  });
  
  const topQueries = Array.from(queryCounts.entries())
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Calculate search frequency (searches per day)
  const firstSearch = new Date(userSearches[0].timestamp);
  const lastSearch = new Date(userSearches[userSearches.length - 1].timestamp);
  const daysDiff = (lastSearch - firstSearch) / (1000 * 60 * 60 * 24) || 1;
  const searchFrequency = userSearches.length / daysDiff;
  
  return {
    totalSearches: userSearches.length,
    uniqueQueries: queryCounts.size,
    topQueries,
    searchFrequency,
    firstSearchDate: firstSearch.toISOString(),
    lastSearchDate: lastSearch.toISOString()
  };
}

/**
 * Track search result click
 */
function trackSearchClick({ searchId, resultId, position }) {
  const search = searchPerformance.get(searchId);
  if (!search) return;
  
  if (!search.clicks) {
    search.clicks = [];
  }
  
  search.clicks.push({
    resultId,
    position,
    timestamp: new Date().toISOString()
  });
  
  // Calculate CTR
  search.ctr = (search.clicks.length / search.resultCount) * 100;
  
  return search;
}

/**
 * Get search analytics
 */
function getSearchAnalytics() {
  const allSearches = Array.from(searchPerformance.values());
  
  const totalSearches = allSearches.length;
  const personalizedSearches = allSearches.filter(s => s.personalized).length;
  
  // Calculate average CTR
  const searchesWithClicks = allSearches.filter(s => s.ctr > 0);
  const avgCTR = searchesWithClicks.length > 0
    ? searchesWithClicks.reduce((sum, s) => sum + s.ctr, 0) / searchesWithClicks.length
    : 0;
  
  // Get top queries
  const allQueries = new Map();
  searchHistory.forEach(userSearches => {
    userSearches.forEach(search => {
      allQueries.set(search.query, (allQueries.get(search.query) || 0) + 1);
    });
  });
  
  const topQueries = Array.from(allQueries.entries())
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
  
  return {
    totalSearches,
    personalizedSearches,
    personalizationRate: totalSearches > 0 
      ? (personalizedSearches / totalSearches) * 100 : 0,
    avgCTR,
    totalUsers: searchHistory.size,
    topQueries,
    totalSavedSearches: savedSearches.size,
    totalQueryRewrites: queryRewrites.size,
    activeRewrites: Array.from(queryRewrites.values()).filter(r => r.enabled).length
  };
}

module.exports = {
  personalizedSearch,
  getAutocompleteSuggestions,
  getPopularSearches,
  createQueryRewrite,
  applyQueryRewrites,
  saveSearch,
  getUserSavedSearches,
  getSearchIntent,
  getUserSearchInsights,
  trackSearchClick,
  getSearchAnalytics
};
