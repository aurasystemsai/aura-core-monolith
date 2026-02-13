/**
 * RECOMMENDATION ENGINE
 * Core recommendation algorithms: collaborative filtering, content-based, hybrid
 */

// Storage
const userItemMatrix = new Map(); // userId -> itemId -> rating/interaction
const itemFeatures = new Map();
const userSimilarities = new Map();
const itemSimilarities = new Map();
const recommendations = new Map();
const models = new Map();

// Generate unique ID
function generateId(prefix = 'rec') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Record user-item interaction
 */
function recordInteraction({ userId, itemId, interactionType, value = 1.0, metadata = {} }) {
  const interactionId = generateId('int');
  
  // Initialize user matrix if needed
  if (!userItemMatrix.has(userId)) {
    userItemMatrix.set(userId, new Map());
  }
  
  const userMatrix = userItemMatrix.get(userId);
  
  // Get or create item entry
  const existing = userMatrix.get(itemId) || { interactions: [], totalValue: 0 };
  
  // Add interaction
  existing.interactions.push({
    id: interactionId,
    type: interactionType, // view, click, add_to_cart, purchase, rating
    value,
    metadata,
    timestamp: new Date().toISOString()
  });
  
  // Update total value with type weights
  const typeWeights = {
    view: 1,
    click: 2,
    add_to_cart: 5,
    purchase: 10,
    rating: value * 2
  };
  
  existing.totalValue += (typeWeights[interactionType] || 1) * value;
  
  userMatrix.set(itemId, existing);
  
  return { interactionId, totalValue: existing.totalValue };
}

/**
 * Set item features for content-based filtering
 */
function setItemFeatures(itemId, features) {
  itemFeatures.set(itemId, {
    itemId,
    ...features,
    updatedAt: new Date().toISOString()
  });
  
  return itemFeatures.get(itemId);
}

/**
 * Collaborative Filtering - User-based
 */
function collaborativeFilteringUserBased({ userId, limit = 10, minSimilarity = 0.3 }) {
  // Find similar users
  const similarUsers = findSimilarUsers(userId, { limit: 20, minSimilarity });
  
  if (similarUsers.length === 0) {
    return [];
  }
  
  // Get items from similar users
  const candidateItems = new Map(); // itemId -> weighted score
  const userMatrix = userItemMatrix.get(userId) || new Map();
  
  similarUsers.forEach(({ userId: simUserId, similarity }) => {
    const simUserMatrix = userItemMatrix.get(simUserId);
    if (!simUserMatrix) return;
    
    simUserMatrix.forEach((itemData, itemId) => {
      // Skip items user has already interacted with
      if (userMatrix.has(itemId)) return;
      
      // Weight by similarity and interaction value
      const score = similarity * itemData.totalValue;
      candidateItems.set(itemId, (candidateItems.get(itemId) || 0) + score);
    });
  });
  
  // Sort and return top items
  return Array.from(candidateItems.entries())
    .map(([itemId, score]) => ({
      itemId,
      score,
      algorithm: 'collaborative_user_based',
      confidence: Math.min(score / 100, 1.0)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Find similar users using Jaccard similarity
 */
function findSimilarUsers(userId, options = {}) {
  const { limit = 10, minSimilarity = 0.3 } = options;
  
  const userMatrix = userItemMatrix.get(userId);
  if (!userMatrix) return [];
  
  const userItems = new Set(userMatrix.keys());
  const similarities = [];
  
  // Compare with all other users
  userItemMatrix.forEach((otherMatrix, otherUserId) => {
    if (otherUserId === userId) return;
    
    const otherItems = new Set(otherMatrix.keys());
    
    // Jaccard similarity
    const intersection = new Set(
      [...userItems].filter(item => otherItems.has(item))
    );
    const union = new Set([...userItems, ...otherItems]);
    
    const similarity = intersection.size / union.size;
    
    if (similarity >= minSimilarity) {
      similarities.push({ userId: otherUserId, similarity });
    }
  });
  
  // Cache for future use
  userSimilarities.set(userId, similarities);
  
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Collaborative Filtering - Item-based
 */
function collaborativeFilteringItemBased({ userId, limit = 10 }) {
  const userMatrix = userItemMatrix.get(userId);
  if (!userMatrix) return [];
  
  const candidateItems = new Map();
  
  // For each item user interacted with, find similar items
  userMatrix.forEach((itemData, itemId) => {
    const similarItems = findSimilarItems(itemId, { limit: 10 });
    
    similarItems.forEach(({ itemId: simItemId, similarity }) => {
      // Skip items user already has
      if (userMatrix.has(simItemId)) return;
      
      // Weight by user's interaction value and item similarity
      const score = itemData.totalValue * similarity;
      candidateItems.set(simItemId, (candidateItems.get(simItemId) || 0) + score);
    });
  });
  
  return Array.from(candidateItems.entries())
    .map(([itemId, score]) => ({
      itemId,
      score,
      algorithm: 'collaborative_item_based',
      confidence: Math.min(score / 100, 1.0)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Find similar items using cosine similarity
 */
function findSimilarItems(itemId, options = {}) {
  const { limit = 10, minSimilarity = 0.3 } = options;
  
  // Build user vectors for this item
  const itemUsers = new Map();
  userItemMatrix.forEach((userMatrix, userId) => {
    if (userMatrix.has(itemId)) {
      itemUsers.set(userId, userMatrix.get(itemId).totalValue);
    }
  });
  
  if (itemUsers.size === 0) return [];
  
  const similarities = [];
  
  // Compare with all other items
  const allItems = new Set();
  userItemMatrix.forEach(userMatrix => {
    userMatrix.forEach((_, iid) => allItems.add(iid));
  });
  
  allItems.forEach(otherItemId => {
    if (otherItemId === itemId) return;
    
    // Build user vector for other item
    const otherItemUsers = new Map();
    userItemMatrix.forEach((userMatrix, userId) => {
      if (userMatrix.has(otherItemId)) {
        otherItemUsers.set(userId, userMatrix.get(otherItemId).totalValue);
      }
    });
    
    // Cosine similarity
    const similarity = cosineSimilarity(itemUsers, otherItemUsers);
    
    if (similarity >= minSimilarity) {
      similarities.push({ itemId: otherItemId, similarity });
    }
  });
  
  // Cache for future use
  itemSimilarities.set(itemId, similarities);
  
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Cosine similarity between two sparse vectors
 */
function cosineSimilarity(vector1, vector2) {
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  const allKeys = new Set([...vector1.keys(), ...vector2.keys()]);
  
  allKeys.forEach(key => {
    const val1 = vector1.get(key) || 0;
    const val2 = vector2.get(key) || 0;
    
    dotProduct += val1 * val2;
    magnitude1 += val1 * val1;
    magnitude2 += val2 * val2;
  });
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
}

/**
 * Content-Based Filtering
 */
function contentBasedFiltering({ userId, limit = 10 }) {
  const userMatrix = userItemMatrix.get(userId);
  if (!userMatrix) return [];
  
  // Build user profile from items they've interacted with
  const userProfile = new Map(); // feature -> weighted value
  
  userMatrix.forEach((itemData, itemId) => {
    const features = itemFeatures.get(itemId);
    if (!features) return;
    
    // Aggregate features weighted by interaction value
    Object.entries(features).forEach(([feature, value]) => {
      if (feature === 'itemId' || feature === 'updatedAt') return;
      
      if (typeof value === 'number') {
        userProfile.set(feature, (userProfile.get(feature) || 0) + value * itemData.totalValue);
      } else if (Array.isArray(value)) {
        value.forEach(v => {
          userProfile.set(v, (userProfile.get(v) || 0) + itemData.totalValue);
        });
      }
    });
  });
  
  // Normalize user profile
  const totalWeight = Array.from(userProfile.values()).reduce((sum, val) => sum + val, 0);
  if (totalWeight > 0) {
    userProfile.forEach((value, key) => {
      userProfile.set(key, value / totalWeight);
    });
  }
  
  // Score all items based on profile match
  const candidateItems = [];
  
  itemFeatures.forEach((features, itemId) => {
    // Skip items user already has
    if (userMatrix.has(itemId)) return;
    
    let score = 0;
    let matchCount = 0;
    
    Object.entries(features).forEach(([feature, value]) => {
      if (feature === 'itemId' || feature === 'updatedAt') return;
      
      if (typeof value === 'number' && userProfile.has(feature)) {
        score += value * userProfile.get(feature);
        matchCount++;
      } else if (Array.isArray(value)) {
        value.forEach(v => {
          if (userProfile.has(v)) {
            score += userProfile.get(v);
            matchCount++;
          }
        });
      }
    });
    
    if (matchCount > 0) {
      candidateItems.push({
        itemId,
        score,
        algorithm: 'content_based',
        confidence: Math.min(matchCount / 10, 1.0)
      });
    }
  });
  
  return candidateItems
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Hybrid Recommendation (combines multiple algorithms)
 */
function hybridRecommendation({ userId, limit = 10, weights = {} }) {
  const defaultWeights = {
    collaborative_user: 0.3,
    collaborative_item: 0.3,
    content_based: 0.4
  };
  
  const finalWeights = { ...defaultWeights, ...weights };
  
  // Get recommendations from each algorithm
  const userBased = collaborativeFilteringUserBased({ userId, limit: limit * 2 });
  const itemBased = collaborativeFilteringItemBased({ userId, limit: limit * 2 });
  const contentBased = contentBasedFiltering({ userId, limit: limit * 2 });
  
  // Combine scores
  const combinedScores = new Map();
  
  userBased.forEach(rec => {
    const score = rec.score * finalWeights.collaborative_user;
    combinedScores.set(rec.itemId, (combinedScores.get(rec.itemId) || 0) + score);
  });
  
  itemBased.forEach(rec => {
    const score = rec.score * finalWeights.collaborative_item;
    combinedScores.set(rec.itemId, (combinedScores.get(rec.itemId) || 0) + score);
  });
  
  contentBased.forEach(rec => {
    const score = rec.score * finalWeights.content_based;
    combinedScores.set(rec.itemId, (combinedScores.get(rec.itemId) || 0) + score);
  });
  
  return Array.from(combinedScores.entries())
    .map(([itemId, score]) => ({
      itemId,
      score,
      algorithm: 'hybrid',
      confidence: Math.min(score / 50, 1.0)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Trending items (popularity-based)
 */
function getTrendingItems({ timeWindow = 7, limit = 10 }) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeWindow);
  
  const itemScores = new Map();
  
  userItemMatrix.forEach(userMatrix => {
    userMatrix.forEach((itemData, itemId) => {
      // Count recent interactions
      const recentInteractions = itemData.interactions.filter(
        int => new Date(int.timestamp) > cutoffDate
      );
      
      const score = recentInteractions.reduce((sum, int) => {
        const typeWeights = { view: 1, click: 2, add_to_cart: 5, purchase: 10 };
        return sum + (typeWeights[int.type] || 1) * int.value;
      }, 0);
      
      itemScores.set(itemId, (itemScores.get(itemId) || 0) + score);
    });
  });
  
  return Array.from(itemScores.entries())
    .map(([itemId, score]) => ({
      itemId,
      score,
      algorithm: 'trending',
      confidence: 1.0
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Frequently bought together
 */
function getFrequentlyBoughtTogether(itemId, options = {}) {
  const { limit = 5, minSupport = 2 } = options;
  
  // Find all users who purchased this item
  const usersPurchased = [];
  userItemMatrix.forEach((userMatrix, userId) => {
    const itemData = userMatrix.get(itemId);
    if (itemData && itemData.interactions.some(int => int.type === 'purchase')) {
      usersPurchased.push(userId);
    }
  });
  
  if (usersPurchased.length === 0) return [];
  
  // Count co-purchased items
  const coOccurrences = new Map();
  
  usersPurchased.forEach(userId => {
    const userMatrix = userItemMatrix.get(userId);
    userMatrix.forEach((itemData, otherItemId) => {
      if (otherItemId === itemId) return;
      if (!itemData.interactions.some(int => int.type === 'purchase')) return;
      
      coOccurrences.set(otherItemId, (coOccurrences.get(otherItemId) || 0) + 1);
    });
  });
  
  return Array.from(coOccurrences.entries())
    .filter(([_, count]) => count >= minSupport)
    .map(([itemId, count]) => ({
      itemId,
      score: count,
      support: count / usersPurchased.length,
      algorithm: 'frequently_bought_together'
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Similar item recommendations
 */
function getSimilarItems(itemId, options = {}) {
  const { limit = 10, method = 'collaborative' } = options;
  
  if (method === 'collaborative') {
    return findSimilarItems(itemId, { limit });
  } else if (method === 'content') {
    // Content-based similarity
    const features = itemFeatures.get(itemId);
    if (!features) return [];
    
    const similarities = [];
    
    itemFeatures.forEach((otherFeatures, otherItemId) => {
      if (otherItemId === itemId) return;
      
      // Simple feature overlap similarity
      let overlap = 0;
      let total = 0;
      
      Object.keys(features).forEach(key => {
        if (key === 'itemId' || key === 'updatedAt') return;
        total++;
        
        if (otherFeatures[key]) {
          if (typeof features[key] === typeof otherFeatures[key]) {
            if (Array.isArray(features[key])) {
              const intersection = features[key].filter(v => 
                otherFeatures[key].includes(v)
              );
              overlap += intersection.length / features[key].length;
            } else if (features[key] === otherFeatures[key]) {
              overlap++;
            }
          }
        }
      });
      
      const similarity = total > 0 ? overlap / total : 0;
      
      if (similarity > 0) {
        similarities.push({ itemId: otherItemId, similarity });
      }
    });
    
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }
  
  return [];
}

/**
 * Personalized ranking of item list
 */
function rankItems({ userId, itemIds, algorithm = 'hybrid' }) {
  const userMatrix = userItemMatrix.get(userId);
  
  const rankings = itemIds.map(itemId => {
    // Skip if user already interacted
    if (userMatrix && userMatrix.has(itemId)) {
      return { itemId, score: 0, rank: itemIds.length };
    }
    
    let score = 0;
    
    if (algorithm === 'popularity') {
      // Use global popularity
      let totalInteractions = 0;
      userItemMatrix.forEach(matrix => {
        const itemData = matrix.get(itemId);
        if (itemData) totalInteractions += itemData.totalValue;
      });
      score = totalInteractions;
    } else {
      // Get recommendation score
      const recs = hybridRecommendation({ userId, limit: 100 });
      const rec = recs.find(r => r.itemId === itemId);
      score = rec ? rec.score : 0;
    }
    
    return { itemId, score };
  });
  
  // Sort and assign ranks
  rankings.sort((a, b) => b.score - a.score);
  rankings.forEach((item, index) => {
    item.rank = index + 1;
  });
  
  return rankings;
}

/**
 * Get recommendation analytics
 */
function getRecommendationAnalytics() {
  return {
    totalUsers: userItemMatrix.size,
    totalItems: itemFeatures.size,
    totalInteractions: Array.from(userItemMatrix.values()).reduce(
      (sum, matrix) => sum + matrix.size,
      0
    ),
    avgInteractionsPerUser: userItemMatrix.size > 0
      ? Array.from(userItemMatrix.values()).reduce((sum, matrix) => sum + matrix.size, 0) / userItemMatrix.size
      : 0,
    coverageRate: itemFeatures.size > 0
      ? (new Set(Array.from(userItemMatrix.values()).flatMap(m => Array.from(m.keys()))).size / itemFeatures.size) * 100
      : 0
  };
}

module.exports = {
  recordInteraction,
  setItemFeatures,
  collaborativeFilteringUserBased,
  collaborativeFilteringItemBased,
  contentBasedFiltering,
  hybridRecommendation,
  getTrendingItems,
  getFrequentlyBoughtTogether,
  getSimilarItems,
  rankItems,
  findSimilarUsers,
  findSimilarItems,
  getRecommendationAnalytics
};
