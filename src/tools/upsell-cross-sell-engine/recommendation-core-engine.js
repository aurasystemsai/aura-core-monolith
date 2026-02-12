/**
 * RECOMMENDATION CORE ENGINE
 * Handles core recommendation algorithms: collaborative filtering, content-based,
 * hybrid approaches, deep learning models, and real-time recommendations
 */

// In-memory stores (replace with database in production)
const recommendations = new Map();
const userInteractions = new Map();
const productVectors = new Map();
const collaborativeModels = new Map();
const contentModels = new Map();

// ================================================================
// RECOMMENDATION GENERATION
// ================================================================

function generateRecommendations({ userId, productId, context = {}, strategy = 'hybrid', limit = 10 }) {
  const id = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();
  
  // Select algorithm based on strategy
  let items = [];
  let scores = [];
  
  switch (strategy) {
    case 'collaborative':
      ({ items, scores } = collaborativeFiltering({ userId, limit: limit * 2 }));
      break;
    case 'content':
      ({ items, scores } = contentBasedFiltering({ productId, limit: limit * 2 }));
      break;
    case 'hybrid':
      ({ items, scores } = hybridRecommendation({ userId, productId, limit: limit * 2 }));
      break;
    case 'deep_learning':
      ({ items, scores } = deepLearningRecommendation({ userId, productId, context, limit: limit * 2 }));
      break;
    default:
      ({ items, scores } = hybridRecommendation({ userId, productId, limit: limit * 2 }));
  }
  
  // Apply business rules and filters
  const filteredItems = applyBusinessRules({ items, scores, context, limit });
  
  const recommendation = {
    id,
    userId,
    productId,
    strategy,
    items: filteredItems,
    context,
    generatedAt: timestamp,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    performance: {
      clicks: 0,
      conversions: 0,
      revenue: 0
    }
  };
  
  recommendations.set(id, recommendation);
  return recommendation;
}

function getRecommendation(id) {
  return recommendations.get(id) || null;
}

function listRecommendations({ userId, limit = 100 }) {
  const userRecs = Array.from(recommendations.values())
    .filter(r => !userId || r.userId === userId)
    .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
    .slice(0, limit);
  
  return userRecs;
}

function deleteRecommendation(id) {
  return recommendations.delete(id);
}

// ================================================================
// COLLABORATIVE FILTERING
// ================================================================

function collaborativeFiltering({ userId, limit = 10 }) {
  // User-based collaborative filtering
  const userHistory = getUserInteractionHistory(userId);
  
  // Find similar users
  const similarUsers = findSimilarUsers(userId, userHistory);
  
  // Aggregate products from similar users
  const productScores = new Map();
  
  similarUsers.forEach(({ userId: simUserId, similarity }) => {
    const simUserHistory = getUserInteractionHistory(simUserId);
    simUserHistory.forEach(interaction => {
      // Skip products user already interacted with
      if (!userHistory.find(h => h.productId === interaction.productId)) {
        const currentScore = productScores.get(interaction.productId) || 0;
        productScores.set(
          interaction.productId,
          currentScore + (similarity * interaction.weight)
        );
      }
    });
  });
  
  // Sort by score
  const items = Array.from(productScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([productId, score]) => ({
      productId,
      score,
      reason: 'Customers like you also viewed'
    }));
  
  return {
    items: items.map(i => i.productId),
    scores: items.map(i => i.score)
  };
}

function itemBasedCollaborativeFiltering({ productId, limit = 10 }) {
  // Find products frequently viewed/purchased together
  const interactions = Array.from(userInteractions.values());
  const coOccurrence = new Map();
  
  interactions.forEach(userHist => {
    const hasProduct = userHist.find(i => i.productId === productId);
    if (hasProduct) {
      userHist.forEach(interaction => {
        if (interaction.productId !== productId) {
          const count = coOccurrence.get(interaction.productId) || 0;
          coOccurrence.set(interaction.productId, count + 1);
        }
      });
    }
  });
  
  const items = Array.from(coOccurrence.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([pid, count]) => ({
      productId: pid,
      score: count,
      reason: 'Frequently bought together'
    }));
  
  return {
    items: items.map(i => i.productId),
    scores: items.map(i => i.score)
  };
}

// ================================================================
// CONTENT-BASED FILTERING
// ================================================================

function contentBasedFiltering({ userId, productId, limit = 10 }) {
  const targetVector = productVectors.get(productId);
  if (!targetVector) {
    return { items: [], scores: [] };
  }
  
  // Calculate similarity with all other products
  const similarities = [];
  
  productVectors.forEach((vector, pid) => {
    if (pid !== productId) {
      const similarity = cosineSimilarity(targetVector, vector);
      similarities.push({ productId: pid, score: similarity });
    }
  });
  
  // Sort by similarity
  const items = similarities
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return {
    items: items.map(i => i.productId),
    scores: items.map(i => i.score)
  };
}

function buildProductVector(product) {
  // Create feature vector from product attributes
  const vector = {
    category: product.category || '',
    price: product.price || 0,
    brand: product.brand || '',
    tags: product.tags || [],
    attributes: product.attributes || {}
  };
  
  productVectors.set(product.id, vector);
  return vector;
}

// ================================================================
// HYBRID RECOMMENDATION
// ================================================================

function hybridRecommendation({ userId, productId, limit = 10 }) {
  // Combine collaborative and content-based
  const collabResults = userId
    ? collaborativeFiltering({ userId, limit: limit * 2 })
    : { items: [], scores: [] };
  
  const contentResults = productId
    ? contentBasedFiltering({ productId, limit: limit * 2 })
    : { items: [], scores: [] };
  
  // Merge and re-rank
  const combined = new Map();
  
  // Weight: 60% collaborative, 40% content
  collabResults.items.forEach((item, idx) => {
    combined.set(item, (collabResults.scores[idx] || 0) * 0.6);
  });
  
  contentResults.items.forEach((item, idx) => {
    const existing = combined.get(item) || 0;
    combined.set(item, existing + (contentResults.scores[idx] || 0) * 0.4);
  });
  
  // Sort by combined score
  const sorted = Array.from(combined.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  
  return {
    items: sorted.map(([productId]) => productId),
    scores: sorted.map(([, score]) => score)
  };
}

// ================================================================
// DEEP LEARNING RECOMMENDATIONS
// ================================================================

function deepLearningRecommendation({ userId, productId, context, limit = 10 }) {
  // Simulate neural network recommendation
  // In production, this would call a TensorFlow/PyTorch model
  
  const features = extractFeatures({ userId, productId, context });
  const predictions = predictWithDNN(features, limit);
  
  return {
    items: predictions.map(p => p.productId),
    scores: predictions.map(p => p.score)
  };
}

function extractFeatures({ userId, productId, context }) {
  return {
    userFeatures: getUserFeatures(userId),
    productFeatures: getProductFeatures(productId),
    contextFeatures: {
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      season: getSeason(),
      ...context
    }
  };
}

function predictWithDNN(features, limit) {
  // Placeholder for deep learning inference
  // In production: model.predict(features)
  return Array.from({ length: limit }, (_, i) => ({
    productId: `prod_${i + 1}`,
    score: Math.random()
  })).sort((a, b) => b.score - a.score);
}

// ================================================================
// REAL-TIME RECOMMENDATIONS
// ================================================================

function realTimeRecommendation({ userId, sessionData, limit = 10 }) {
  const browsedProducts = sessionData.browsedProducts || [];
  const cartItems = sessionData.cartItems || [];
  
  // Combine multiple signals
  const signals = [];
  
  // 1. Similar to browsed products
  browsed Products.forEach(productId => {
    const similar = contentBasedFiltering({ productId, limit: 5 });
    signals.push({ items: similar.items, weight: 0.3 });
  });
  
  // 2. Frequently bought with cart items
  cartItems.forEach(productId => {
    const together = itemBasedCollaborativeFiltering({ productId, limit: 5 });
    signals.push({ items: together.items, weight: 0.5 });
  });
  
  // 3. User's personalized recommendations
  if (userId) {
    const personal = collaborativeFiltering({ userId, limit: 10 });
    signals.push({ items: personal.items, weight: 0.2 });
  }
  
  // Aggregate signals
  const aggregated = new Map();
  signals.forEach(({ items, weight }) => {
    items.forEach((item, idx) => {
      const score = (items.length - idx) * weight;
      const existing = aggregated.get(item) || 0;
      aggregated.set(item, existing + score);
    });
  });
  
  const sorted = Array.from(aggregated.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  
  return {
    items: sorted.map(([productId]) => productId),
    scores: sorted.map(([, score]) => score)
  };
}

// ================================================================
// TRENDING & POPULAR
// ================================================================

function getTrendingProducts({ timeWindow = '7d', category, limit = 10 }) {
  const cutoffDate = getTimeWindowCutoff(timeWindow);
  
  // Count interactions within time window
  const productCounts = new Map();
  
  userInteractions.forEach(history => {
    history.forEach(interaction => {
      if (new Date(interaction.timestamp) > cutoffDate) {
        const count = productCounts.get(interaction.productId) || 0;
        productCounts.set(interaction.productId, count + interaction.weight);
      }
    });
  });
  
  let sorted = Array.from(productCounts.entries())
    .sort((a, b) => b[1] - a[1]);
  
  // Filter by category if specified
  if (category) {
    sorted = sorted.filter(([productId]) => {
      const vector = productVectors.get(productId);
      return vector && vector.category === category;
    });
  }
  
  return sorted.slice(0, limit).map(([productId, score]) => ({
    productId,
    score,
    reason: `Trending in ${timeWindow}`
  }));
}

function getNewArrivals({ category, limit = 10 }) {
  // Get newest products
  const products = Array.from(productVectors.entries())
    .map(([productId, vector]) => ({
      productId,
      createdAt: vector.createdAt || new Date()
    }))
    .filter(p => !category || productVectors.get(p.productId).category === category)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
  
  return products.map(p => ({
    productId: p.productId,
    reason: 'New arrival'
  }));
}

// ================================================================
// PERSONALIZATION
// ================================================================

function getPersonalizedRecommendations({ userId, page = 'homepage', limit = 10 }) {
  const userProfile = getUserProfile(userId);
  const preferences = userProfile.preferences || {};
  
  // Adjust recommendations based on user preferences
  let strategy = 'hybrid';
  
  if (preferences.preferenceType === 'similar') {
    strategy = 'content';
  } else if (preferences.preferenceType === 'discovery') {
    strategy = 'collaborative';
  }
  
  const recs = generateRecommendations({
    userId,
    strategy,
    limit: limit * 2,
    context: { page }
  });
  
  // Apply personalization filters
  const filtered = recs.items
    .filter(productId => matchesPreferences(productId, preferences))
    .slice(0, limit);
  
  return {
    items: filtered,
    strategy,
    personalized: true
  };
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function getUserInteractionHistory(userId) {
  return userInteractions.get(userId) || [];
}

function findSimilarUsers(userId, userHistory) {
  // Calculate user similarity using Jaccard or cosine similarity
  const allUsers = Array.from(userInteractions.keys());
  const similarities = [];
  
  allUsers.forEach(otherUserId => {
    if (otherUserId !== userId) {
      const otherHistory = getUserInteractionHistory(otherUserId);
      const similarity = calculateUserSimilarity(userHistory, otherHistory);
      if (similarity > 0.1) { // Threshold
        similarities.push({ userId: otherUserId, similarity });
      }
    }
  });
  
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 20); // Top 20 similar users
}

function calculateUserSimilarity(hist1, hist2) {
  const products1 = new Set(hist1.map(h => h.productId));
  const products2 = new Set(hist2.map(h => h.productId));
  
  const intersection = new Set([...products1].filter(x => products2.has(x)));
  const union = new Set([...products1, ...products2]);
  
  return intersection.size / union.size; // Jaccard similarity
}

function cosineSimilarity(vec1, vec2) {
  // Simple cosine similarity for numeric features
  const keys = Object.keys(vec1).filter(k => typeof vec1[k] === 'number');
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  keys.forEach(key => {
    const v1 = vec1[key] || 0;
    const v2 = vec2[key] || 0;
    dotProduct += v1 * v2;
    mag1 += v1 * v1;
    mag2 += v2 * v2;
  });
  
  const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
  return magnitude > 0 ? dotProduct / magnitude : 0;
}

function applyBusinessRules({ items, scores, context, limit }) {
  // Apply inventory, margin, and business logic filters
  return items
    .map((productId, idx) => ({
      productId,
      score: scores[idx],
      inStock: checkInventory(productId),
      margin: getProductMargin(productId)
    }))
    .filter(item => item.inStock && item.margin > 0.2) // Min 20% margin
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.productId);
}

function getUserFeatures(userId) {
  const history = getUserInteractionHistory(userId);
  return {
    totalInteractions: history.length,
    avgOrderValue: calculateAvgOrderValue(userId),
    lifetimeValue: calculateLTV(userId),
    recency: calculateRecency(userId)
  };
}

function getProductFeatures(productId) {
  const vector = productVectors.get(productId);
  return vector || {};
}

function getUserProfile(userId) {
  // Placeholder for user profile
  return {
    id: userId,
    preferences: {
      categories: [],
      brands: [],
      priceRange: { min: 0, max: 1000 },
      preferenceType: 'hybrid'
    }
  };
}

function matchesPreferences(productId, preferences) {
  // Check if product matches user preferences
  const vector = productVectors.get(productId);
  if (!vector) return true;
  
  // Category filter
  if (preferences.categories && preferences.categories.length > 0) {
    if (!preferences.categories.includes(vector.category)) return false;
  }
  
  // Price filter
  if (preferences.priceRange) {
    if (vector.price < preferences.priceRange.min || vector.price > preferences.priceRange.max) {
      return false;
    }
  }
  
  return true;
}

function getTimeWindowCutoff(timeWindow) {
  const now = new Date();
  const units = { d: 1, w: 7, m: 30, y: 365 };
  const match = timeWindow.match(/^(\d+)([dwmy])$/);
  
  if (match) {
    const [, amount, unit] = match;
    const days = parseInt(amount) * (units[unit] || 1);
    return new Date(now - days * 24 * 60 * 60 * 1000);
  }
  
  return new Date(now - 7 * 24 * 60 * 60 * 1000); // Default 7 days
}

function getSeason() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

function checkInventory(productId) {
  // Placeholder: check if product is in stock
  return true;
}

function getProductMargin(productId) {
  // Placeholder: return product margin
  return 0.3;
}

function calculateAvgOrderValue(userId) {
  return 150;
}

function calculateLTV(userId) {
  return 1200;
}

function calculateRecency(userId) {
  return 7; // Days since last purchase
}

// ================================================================
// TRACKING & ANALYTICS
// ================================================================

function trackRecommendationClick(recommendationId, productId) {
  const rec = recommendations.get(recommendationId);
  if (rec) {
    rec.performance.clicks += 1;
    recommendations.set(recommendationId, rec);
  }
}

function trackRecommendationConversion(recommendationId, productId, revenue) {
  const rec = recommendations.get(recommendationId);
  if (rec) {
    rec.performance.conversions += 1;
    rec.performance.revenue += revenue;
    recommendations.set(recommendationId, rec);
  }
}

function getRecommendationMetrics(recommendationId) {
  const rec = recommendations.get(recommendationId);
  if (!rec) return null;
  
  const ctr = rec.items.length > 0
    ? rec.performance.clicks / rec.items.length
    : 0;
  const conversionRate = rec.performance.clicks > 0
    ? rec.performance.conversions / rec.performance.clicks
    : 0;
  
  return {
    ...rec.performance,
    ctr,
    conversionRate,
    avgRevenue: rec.performance.conversions > 0
      ? rec.performance.revenue / rec.performance.conversions
      : 0
  };
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Core
  generateRecommendations,
  getRecommendation,
  listRecommendations,
  deleteRecommendation,
  
  // Algorithms
  collaborativeFiltering,
  itemBasedCollaborativeFiltering,
  contentBasedFiltering,
  hybridRecommendation,
  deepLearningRecommendation,
  realTimeRecommendation,
  
  // Discovery
  getTrendingProducts,
  getNewArrivals,
  getPersonalizedRecommendations,
  
  // Utilities
  buildProductVector,
  trackRecommendationClick,
  trackRecommendationConversion,
  getRecommendationMetrics,
  
  // Data stores (for testing)
  recommendations,
  userInteractions,
  productVectors
};
