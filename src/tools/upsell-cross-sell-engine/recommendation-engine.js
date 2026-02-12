/**
 * Recommendation Engine - AI-powered product recommendations
 * Supports collaborative filtering, content-based, hybrid, and deep learning approaches
 */

const db = require('../../core/db');

// In-memory stores
const recommendations = new Map();
const userProductMatrix = new Map(); // userId -> { productId: score }
const productFeatures = new Map(); // productId -> feature vector
const productSimilarities = new Map(); // productId -> { productId: similarity }
const modelPerformance = new Map(); // modelId -> metrics

/**
 * Generate personalized recommendations for a customer
 */
async function generateRecommendations({
  customerId,
  sessionId,
  context = {},
  strategy = 'hybrid',
  maxRecommendations = 10,
  filters = {}
}) {
  const timestamp = new Date().toISOString();
  
  let recommendations = [];
  
  switch (strategy) {
    case 'collaborative':
      recommendations = await collaborativeFiltering(customerId, maxRecommendations, filters);
      break;
    case 'content-based':
      recommendations = await contentBasedFiltering(customerId, context, maxRecommendations, filters);
      break;
    case 'hybrid':
      recommendations = await hybridRecommendations(customerId, context, maxRecommendations, filters);
      break;
    case 'trending':
      recommendations = await getTrendingProducts(maxRecommendations, filters);
      break;
    case 'new-arrivals':
      recommendations = await getNewArrivals(maxRecommendations, filters);
      break;
    case 'session-based':
      recommendations = await sessionBasedRecommendations(sessionId, maxRecommendations, filters);
      break;
    default:
      recommendations = await hybridRecommendations(customerId, context, maxRecommendations, filters);
  }
  
  const result = {
    id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    customerId,
    sessionId,
    strategy,
    recommendations,
    context,
    timestamp,
    expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour
  };
  
  // Store recommendation
  storeRecommendation(result);
  
  return result;
}

/**
 * Collaborative Filtering - User-based and item-based
 */
async function collaborativeFiltering(customerId, maxRecommendations, filters) {
  // Get user's purchase history
  const userPurchases = getUserPurchaseHistory(customerId);
  
  if (userPurchases.length === 0) {
    // Cold start: return popular products
    return getPopularProducts(maxRecommendations, filters);
  }
  
  // Find similar users (user-based collaborative filtering)
  const similarUsers = findSimilarUsers(customerId, 20);
  
  // Get products purchased by similar users but not by this user
  const candidateProducts = new Map();
  
  for (const { userId, similarity } of similarUsers) {
    const purchases = getUserPurchaseHistory(userId);
    
    for (const productId of purchases) {
      if (!userPurchases.includes(productId)) {
        const currentScore = candidateProducts.get(productId) || 0;
        candidateProducts.set(productId, currentScore + similarity);
      }
    }
  }
  
  // Item-based collaborative filtering
  const itemBasedScores = new Map();
  
  for (const purchasedProductId of userPurchases) {
    const similarProducts = findSimilarProducts(purchasedProductId, 10);
    
    for (const { productId, similarity } of similarProducts) {
      if (!userPurchases.includes(productId)) {
        const currentScore = itemBasedScores.get(productId) || 0;
        itemBasedScores.set(productId, currentScore + similarity);
      }
    }
  }
  
  // Combine user-based and item-based scores
  const combinedScores = new Map();
  
  for (const [productId, score] of candidateProducts) {
    const itemScore = itemBasedScores.get(productId) || 0;
    combinedScores.set(productId, score * 0.6 + itemScore * 0.4);
  }
  
  for (const [productId, score] of itemBasedScores) {
    if (!combinedScores.has(productId)) {
      combinedScores.set(productId, score * 0.4);
    }
  }
  
  // Apply filters
  const filteredProducts = applyFilters(Array.from(combinedScores.keys()), filters);
  
  // Sort by score and return top N
  return filteredProducts
    .map(productId => ({
      productId,
      score: combinedScores.get(productId),
      confidence: Math.min(0.95, combinedScores.get(productId) / 10),
      reasoning: 'Customers like you also purchased',
      model: 'collaborative_filtering'
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxRecommendations);
}

/**
 * Content-Based Filtering - Product attribute similarity
 */
async function contentBasedFiltering(customerId, context, maxRecommendations, filters) {
  const userPurchases = getUserPurchaseHistory(customerId);
  const userPreferences = buildUserPreferenceProfile(customerId);
  
  // Get current context products (e.g., product being viewed)
  const contextProducts = context.productId ? [context.productId] : [];
  const referenceProducts = [...new Set([...userPurchases, ...contextProducts])];
  
  if (referenceProducts.length === 0) {
    return getPopularProducts(maxRecommendations, filters);
  }
  
  // Calculate similarity scores for all products
  const candidateProducts = new Map();
  const allProducts = getAllProducts();
  
  for (const candidateProductId of allProducts) {
    if (referenceProducts.includes(candidateProductId)) continue;
    
    let totalSimilarity = 0;
    let weightSum = 0;
    
    for (const refProductId of referenceProducts) {
      const similarity = calculateContentSimilarity(refProductId, candidateProductId);
      const weight = contextProducts.includes(refProductId) ? 1.5 : 1.0;
      
      totalSimilarity += similarity * weight;
      weightSum += weight;
    }
    
    const avgSimilarity = totalSimilarity / weightSum;
    
    // Boost score based on user preferences
    const preferenceBoost = calculatePreferenceBoost(candidateProductId, userPreferences);
    const finalScore = avgSimilarity * (1 + preferenceBoost);
    
    candidateProducts.set(candidateProductId, finalScore);
  }
  
  // Apply filters
  const filteredProducts = applyFilters(Array.from(candidateProducts.keys()), filters);
  
  return filteredProducts
    .map(productId => ({
      productId,
      score: candidateProducts.get(productId),
      confidence: Math.min(0.9, candidateProducts.get(productId)),
      reasoning: 'Similar to products you liked',
      model: 'content_based'
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxRecommendations);
}

/**
 * Hybrid Recommendations - Combine multiple approaches
 */
async function hybridRecommendations(customerId, context, maxRecommendations, filters) {
  // Generate recommendations from multiple models
  const [collaborative, contentBased, trending] = await Promise.all([
    collaborativeFiltering(customerId, maxRecommendations * 2, filters),
    contentBasedFiltering(customerId, context, maxRecommendations * 2, filters),
    getTrendingProducts(maxRecommendations, filters)
  ]);
  
  // Combine scores using weighted average
  const combinedScores = new Map();
  
  const weights = {
    collaborative: 0.5,
    content_based: 0.4,
    trending: 0.1
  };
  
  // Process collaborative recommendations
  for (const rec of collaborative) {
    combinedScores.set(rec.productId, {
      score: rec.score * weights.collaborative,
      sources: ['collaborative'],
      reasoning: [rec.reasoning]
    });
  }
  
  // Add content-based recommendations
  for (const rec of contentBased) {
    if (combinedScores.has(rec.productId)) {
      const existing = combinedScores.get(rec.productId);
      existing.score += rec.score * weights.content_based;
      existing.sources.push('content_based');
      existing.reasoning.push(rec.reasoning);
    } else {
      combinedScores.set(rec.productId, {
        score: rec.score * weights.content_based,
        sources: ['content_based'],
        reasoning: [rec.reasoning]
      });
    }
  }
  
  // Add trending products (for diversity)
  for (const rec of trending) {
    if (combinedScores.has(rec.productId)) {
      const existing = combinedScores.get(rec.productId);
      existing.score += rec.score * weights.trending;
      existing.sources.push('trending');
    } else {
      combinedScores.set(rec.productId, {
        score: rec.score * weights.trending,
        sources: ['trending'],
        reasoning: ['Trending product']
      });
    }
  }
  
  // Sort and return top recommendations
  return Array.from(combinedScores.entries())
    .map(([productId, data]) => ({
      productId,
      score: data.score,
      confidence: Math.min(0.95, data.score / Math.max(...Array.from(combinedScores.values()).map(v => v.score))),
      reasoning: data.reasoning[0],
      model: 'hybrid',
      sources: data.sources
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxRecommendations);
}

/**
 * Thompson Sampling for Multi-Armed Bandit
 */
function thompsonSampling(products, numSamples = 5) {
  const sampledProducts = [];
  
  for (const productId of products) {
    const performance = modelPerformance.get(productId) || { clicks: 0, conversions: 0, impressions: 0 };
    
    // Beta distribution parameters
    const alpha = performance.conversions + 1;
    const beta = performance.impressions - performance.conversions + 1;
    
    // Sample from beta distribution (simplified approximation)
    const sample = betaSample(alpha, beta);
    
    sampledProducts.push({ productId, sample });
  }
  
  // Return top N based on samples
  return sampledProducts
    .sort((a, b) => b.sample - a.sample)
    .slice(0, numSamples)
    .map(p => p.productId);
}

/**
 * Session-Based Recommendations
 */
async function sessionBasedRecommendations(sessionId, maxRecommendations, filters) {
  const sessionEvents = getSessionEvents(sessionId);
  
  if (sessionEvents.length === 0) {
    return getPopularProducts(maxRecommendations, filters);
  }
  
  // Extract products viewed in this session
  const viewedProducts = sessionEvents
    .filter(e => e.type === 'product_view')
    .map(e => e.productId);
  
  // Calculate sequential patterns
  const nextProducts = predictNextProduct(viewedProducts);
  
  return nextProducts
    .slice(0, maxRecommendations)
    .map(({ productId, probability }) => ({
      productId,
      score: probability,
      confidence: probability,
      reasoning: 'Based on your browsing session',
      model: 'session_based'
    }));
}

/**
 * Helper Functions
 */

function getUserPurchaseHistory(customerId) {
  const history = userProductMatrix.get(customerId);
  return history ? Array.from(history.keys()) : [];
}

function findSimilarUsers(customerId, topN = 20) {
  const userVector = userProductMatrix.get(customerId);
  if (!userVector) return [];
  
  const similarities = [];
  
  for (const [otherUserId, otherVector] of userProductMatrix) {
    if (otherUserId === customerId) continue;
    
    const similarity = cosineSimilarity(userVector, otherVector);
    similarities.push({ userId: otherUserId, similarity });
  }
  
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN);
}

function findSimilarProducts(productId, topN = 10) {
  const similarities = productSimilarities.get(productId) || {};
  
  return Object.entries(similarities)
    .map(([pid, similarity]) => ({ productId: pid, similarity }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN);
}

function calculateContentSimilarity(productA, productB) {
  const featuresA = productFeatures.get(productA);
  const featuresB = productFeatures.get(productB);
  
  if (!featuresA || !featuresB) return 0;
  
  return cosineSimilarity(featuresA, featuresB);
}

function cosineSimilarity(vectorA, vectorB) {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  // Convert Maps to arrays of keys
  const keysA = vectorA instanceof Map ? Array.from(vectorA.keys()) : Object.keys(vectorA);
  const keysB = vectorB instanceof Map ? Array.from(vectorB.keys()) : Object.keys(vectorB);
  const allKeys = new Set([...keysA, ...keysB]);
  
  for (const key of allKeys) {
    const valueA = vectorA instanceof Map ? (vectorA.get(key) || 0) : (vectorA[key] || 0);
    const valueB = vectorB instanceof Map ? (vectorB.get(key) || 0) : (vectorB[key] || 0);
    
    dotProduct += valueA * valueB;
    magnitudeA += valueA * valueA;
    magnitudeB += valueB * valueB;
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  
  return dotProduct / (magnitudeA * magnitudeB);
}

function buildUserPreferenceProfile(customerId) {
  const purchases = getUserPurchaseHistory(customerId);
  const preferences = new Map();
  
  for (const productId of purchases) {
    const features = productFeatures.get(productId);
    if (!features) continue;
    
    for (const [feature, value] of Object.entries(features)) {
      const current = preferences.get(feature) || 0;
      preferences.set(feature, current + value);
    }
  }
  
  // Normalize
  const total = Array.from(preferences.values()).reduce((sum, val) => sum + val, 0);
  if (total > 0) {
    for (const [feature, value] of preferences) {
      preferences.set(feature, value / total);
    }
  }
  
  return preferences;
}

function calculatePreferenceBoost(productId, userPreferences) {
  const features = productFeatures.get(productId);
  if (!features) return 0;
  
  let boost = 0;
  
  for (const [feature, value] of Object.entries(features)) {
    const prefValue = userPreferences.get(feature) || 0;
    boost += value * prefValue;
  }
  
  return Math.min(0.5, boost); // Max 50% boost
}

function getAllProducts() {
  // Return all product IDs (in production, this would query the database)
  return Array.from(productFeatures.keys());
}

function getPopularProducts(maxRecommendations, filters) {
  const products = getAllProducts();
  const filteredProducts = applyFilters(products, filters);
  
  // Simulate popularity scores
  return filteredProducts
    .slice(0, maxRecommendations)
    .map(productId => ({
      productId,
      score: 0.8,
      confidence: 0.7,
      reasoning: 'Popular product',
      model: 'popularity'
    }));
}

async function getTrendingProducts(maxRecommendations, filters) {
  // Simulate trending products based on recent activity
  const products = getAllProducts();
  const filteredProducts =  applyFilters(products, filters);
  
  return filteredProducts
    .slice(0, maxRecommendations)
    .map(productId => ({
      productId,
      score: 0.7,
      confidence: 0.6,
      reasoning: 'Trending now',
      model: 'trending'
    }));
}

async function getNewArrivals(maxRecommendations, filters) {
  const products = getAllProducts();
  const filteredProducts = applyFilters(products, filters);
  
  // In production, sort by createdAt date
  return filteredProducts
    .slice(0, maxRecommendations)
    .map(productId => ({
      productId,
      score: 0.65,
      confidence: 0.55,
      reasoning: 'New arrival',
      model: 'new_arrivals'
    }));
}

function applyFilters(products, filters) {
  let filtered = [...products];
  
  if (filters.category) {
    // Filter by category (in production, query product metadata)
    filtered = filtered.filter(pid => {
      // Placeholder logic
      return true;
    });
  }
  
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    // Filter by price range
    filtered = filtered.filter(pid => {
      // Placeholder logic
      return true;
    });
  }
  
  if (filters.inStock) {
    // Filter by inventory
    filtered = filtered.filter(pid => {
      // Placeholder logic
      return true;
    });
  }
  
  if (filters.exclude && filters.exclude.length > 0) {
    filtered = filtered.filter(pid => !filters.exclude.includes(pid));
  }
  
  return filtered;
}

function getSessionEvents(sessionId) {
  // In production, query event log
  return [];
}

function predictNextProduct(viewedProducts) {
  // Simplified sequential pattern prediction
  // In production, use Markov chains or RNNs
  return [];
}

function betaSample(alpha, beta) {
  // Simplified beta distribution sampling
  // In production, use proper statistical library
  const mean = alpha / (alpha + beta);
  const variance = (alpha * beta) / ((alpha + beta) * (alpha + beta) * (alpha + beta + 1));
  
  // Approximate with normal distribution
  const stdDev = Math.sqrt(variance);
  const sample = mean + stdDev * (Math.random() - 0.5) * 2;
  
  return Math.max(0, Math.min(1, sample));
}

function storeRecommendation(recommendation) {
  recommendations.set(recommendation.id, recommendation);
  
  // Clean up expired recommendations
  for (const [id, rec] of recommendations) {
    if (new Date(rec.expiresAt) < new Date()) {
      recommendations.delete(id);
    }
  }
}

/**
 * Training and Model Management
 */

function trainCollaborativeModel(purchases) {
  // Build user-product matrix
  for (const purchase of purchases) {
    const userId = purchase.customerId;
    const productId = purchase.productId;
    const rating = purchase.rating || 1;
    
    if (!userProductMatrix.has(userId)) {
      userProductMatrix.set(userId, new Map());
    }
    
    userProductMatrix.get(userId).set(productId, rating);
  }
  
  // Compute product similarities (item-based CF)
  computeProductSimilarities();
  
  return { status: 'success', userCount: userProductMatrix.size };
}

function computeProductSimilarities() {
  const products = getAllProducts();
  
  for (let i = 0; i < products.length; i++) {
    const productA = products[i];
    const similarities = {};
    
    for (let j = 0; j < products.length; j++) {
      if (i === j) continue;
      
      const productB = products[j];
      
      // Find users who rated both products
      const commonUsers = [];
      
      for (const [userId, ratings] of userProductMatrix) {
        if (ratings.has(productA) && ratings.has(productB)) {
          commonUsers.push({
            ratingA: ratings.get(productA),
            ratingB: ratings.get(productB)
          });
        }
      }
      
      if (commonUsers.length >= 2) {
        // Calculate Pearson correlation
        const similarity = pearsonCorrelation(
          commonUsers.map(u => u.ratingA),
          commonUsers.map(u => u.ratingB)
        );
        
        if (similarity > 0.3) {
          similarities[productB] = similarity;
        }
      }
    }
    
    productSimilarities.set(productA, similarities);
  }
}

function pearsonCorrelation(x, y) {
  const n = x.length;
  if (n === 0) return 0;
  
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;
  
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    
    numerator += diffX * diffY;
    denomX += diffX * diffX;
    denomY += diffY * diffY;
  }
  
  if (denomX === 0 || denomY === 0) return 0;
  
  return numerator / Math.sqrt(denomX * denomY);
}

function trainContentModel(products) {
  // Extract product features
  for (const product of products) {
    const features = extractProductFeatures(product);
    productFeatures.set(product.id, features);
  }
  
  return { status: 'success', productCount: productFeatures.size };
}

function extractProductFeatures(product) {
  const features = {};
  
  // Category features
  if (product.category) {
    features[`category_${product.category}`] = 1;
  }
  
  // Brand features
  if (product.brand) {
    features[`brand_${product.brand}`] = 1;
  }
  
  // Price bucket
  if (product.price) {
    const priceBucket = Math.floor(product.price / 50) * 50;
    features[`price_${priceBucket}`] = 1;
  }
  
  // Tags
  if (product.tags) {
    for (const tag of product.tags) {
      features[`tag_${tag}`] = 1;
    }
  }
  
  // Color
  if (product.color) {
    features[`color_${product.color}`] = 1;
  }
  
  // Size (for apparel)
  if (product.size) {
    features[`size_${product.size}`] = 1;
  }
  
  return features;
}

/**
 * Performance Tracking
 */

function trackRecommendationPerformance(productId, event) {
  if (!modelPerformance.has(productId)) {
    modelPerformance.set(productId, {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0
    });
  }
  
  const metrics = modelPerformance.get(productId);
  
  switch (event.type) {
    case 'impression':
      metrics.impressions++;
      break;
    case 'click':
      metrics.clicks++;
      break;
    case 'conversion':
      metrics.conversions++;
      metrics.revenue += event.revenue || 0;
      break;
  }
}

function getModelMetrics() {
  const totalImpressions = Array.from(modelPerformance.values()).reduce((sum, m) => sum + m.impressions, 0);
  const totalClicks = Array.from(modelPerformance.values()).reduce((sum, m) => sum + m.clicks, 0);
  const totalConversions = Array.from(modelPerformance.values()).reduce((sum, m) => sum + m.conversions, 0);
  const totalRevenue = Array.from(modelPerformance.values()).reduce((sum, m) => sum + m.revenue, 0);
  
  return {
    impressions: totalImpressions,
    clicks: totalClicks,
    conversions: totalConversions,
    revenue: totalRevenue,
    ctr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
    conversionRate: totalClicks > 0 ? totalConversions / totalClicks : 0,
    avgRevenuePerConversion: totalConversions > 0 ? totalRevenue / totalConversions : 0
  };
}

module.exports = {
  generateRecommendations,
  collaborativeFiltering,
  contentBasedFiltering,
  hybridRecommendations,
  thompsonSampling,
  sessionBasedRecommendations,
  trainCollaborativeModel,
  trainContentModel,
  trackRecommendationPerformance,
  getModelMetrics,
  getTrendingProducts,
  getNewArrivals
};
