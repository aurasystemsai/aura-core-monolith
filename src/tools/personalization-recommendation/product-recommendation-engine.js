/**
 * PRODUCT RECOMMENDATION ENGINE
 * Product-specific recommendations: similar, trending, bundles, cross-sell
 */

// Storage
const products = new Map();
const productRelations = new Map();
const categoryTrends = new Map();
const bundles = new Map();
const crossSellRules = new Map();
const productPerformance = new Map();

// Generate unique ID
function generateId(prefix = 'prod') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Index product for recommendations
 */
function indexProduct(productData) {
  const {
    productId,
    name,
    category,
    subcategory,
    price,
    brand,
    tags = [],
    attributes = {},
    inventory = 0
  } = productData;
  
  const product = {
    productId,
    name,
    category,
    subcategory,
    price,
    brand,
    tags,
    attributes,
    inventory,
    performance: {
      views: 0,
      clicks: 0,
      addToCarts: 0,
      purchases: 0,
      revenue: 0,
      conversionRate: 0
    },
    indexedAt: new Date().toISOString()
  };
  
  products.set(productId, product);
  
  return product;
}

/**
 * Get similar products based on attributes
 */
function getSimilarProducts(productId, options = {}) {
  const { limit = 10, method = 'attributes' } = options;
  
  const product = products.get(productId);
  if (!product) {
    throw new Error('Product not found');
  }
  
  const similarities = [];
  
  products.forEach((otherProduct, otherProductId) => {
    if (otherProductId === productId) return;
    if (otherProduct.inventory <= 0) return; // Skip out of stock
    
    let score = 0;
    
    // Category match (highest weight)
    if (product.category === otherProduct.category) score += 50;
    if (product.subcategory === otherProduct.subcategory) score += 30;
    
    // Brand match
    if (product.brand === otherProduct.brand) score += 20;
    
    // Price similarity (within 30%)
    const priceDiff = Math.abs(product.price - otherProduct.price) / product.price;
    if (priceDiff < 0.3) score += 20 * (1 - priceDiff / 0.3);
    
    // Tag overlap
    const tagOverlap = product.tags.filter(tag => 
      otherProduct.tags.includes(tag)
    ).length;
    score += tagOverlap * 5;
    
    // Attribute similarity
    const attributeKeys = new Set([
      ...Object.keys(product.attributes),
      ...Object.keys(otherProduct.attributes)
    ]);
    
    let attributeMatches = 0;
    attributeKeys.forEach(key => {
      if (product.attributes[key] === otherProduct.attributes[key]) {
        attributeMatches++;
      }
    });
    
    score += (attributeMatches / attributeKeys.size) * 30;
    
    if (score > 0) {
      similarities.push({
        productId: otherProductId,
        product: otherProduct,
        score,
        similarity: score / 150 // Normalize to 0-1
      });
    }
  });
  
  return similarities
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get trending products
 */
function getTrendingProducts(options = {}) {
  const {
    category = null,
    timeWindow = 7,
    limit = 10,
    minViews = 10
  } = options;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeWindow);
  
  let productList = Array.from(products.values());
  
  // Filter by category if specified
  if (category) {
    productList = productList.filter(p => p.category === category);
  }
  
  // Calculate trending score
  const trending = productList.map(product => {
    const recentPerf = productPerformance.get(product.productId) || {};
    const views = recentPerf.recentViews || product.performance.views;
    const purchases = recentPerf.recentPurchases || product.performance.purchases;
    
    // Trending score = weighted combination of views and purchases
    const score = (views * 1) + (purchases * 10);
    
    // Velocity (rate of growth)
    const velocity = recentPerf.growth || 1.0;
    
    return {
      productId: product.productId,
      product,
      score: score * velocity,
      views,
      purchases
    };
  })
  .filter(p => p.views >= minViews)
  .sort((a, b) => b.score - a.score)
  .slice(0, limit);
  
  return trending;
}

/**
 * Get new arrivals
 */
function getNewArrivals(options = {}) {
  const { category = null, limit = 10, daysNew = 30 } = options;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysNew);
  
  let productList = Array.from(products.values());
  
  if (category) {
    productList = productList.filter(p => p.category === category);
  }
  
  return productList
    .filter(p => new Date(p.indexedAt) > cutoffDate)
    .filter(p => p.inventory > 0)
    .sort((a, b) => new Date(b.indexedAt) - new Date(a.indexedAt))
    .slice(0, limit)
    .map(product => ({
      productId: product.productId,
      product,
      daysOld: Math.floor((Date.now() - new Date(product.indexedAt)) / (1000 * 60 * 60 * 24))
    }));
}

/**
 * Create product bundle
 */
function createBundle({ name, productIds, discount = 0, description = '' }) {
  const bundleId = generateId('bundle');
  
  // Calculate bundle price
  const productPrices = productIds.map(pid => {
    const product = products.get(pid);
    return product ? product.price : 0;
  });
  
  const totalPrice = productPrices.reduce((sum, price) => sum + price, 0);
  const bundlePrice = totalPrice * (1 - discount / 100);
  
  const bundle = {
    id: bundleId,
    name,
    productIds,
    description,
    totalPrice,
    bundlePrice,
    discount,
    savings: totalPrice - bundlePrice,
    performance: {
      views: 0,
      purchases: 0,
      revenue: 0
    },
    createdAt: new Date().toISOString()
  };
  
  bundles.set(bundleId, bundle);
  
  return bundle;
}

/**
 * Get recommended bundles for product
 */
function getBundlesForProduct(productId, options = {}) {
  const { limit = 5 } = options;
  
  return Array.from(bundles.values())
    .filter(bundle => bundle.productIds.includes(productId))
    .sort((a, b) => b.discount - a.discount)
    .slice(0, limit);
}

/**
 * Create cross-sell rule
 */
function createCrossSellRule({ triggerProductIds, recommendProductIds, priority = 0, conditions = {} }) {
  const ruleId = generateId('xsell');
  
  const rule = {
    id: ruleId,
    triggerProductIds, // Products that trigger this rule
    recommendProductIds, // Products to recommend
    priority,
    conditions: {
      minCartValue: conditions.minCartValue || 0,
      categories: conditions.categories || [],
      excludeCategories: conditions.excludeCategories || [],
      ...conditions
    },
    enabled: true,
    timesTriggered: 0,
    conversionRate: 0,
    createdAt: new Date().toISOString()
  };
  
  crossSellRules.set(ruleId, rule);
  
  return rule;
}

/**
 * Get cross-sell recommendations for cart
 */
function getCrossSellRecommendations(cartProductIds, cartValue = 0, options = {}) {
  const { limit = 5 } = options;
  
  const recommendations = new Map(); // productId -> score
  
  // Find matching rules
  const matchingRules = Array.from(crossSellRules.values())
    .filter(rule => {
      if (!rule.enabled) return false;
      
      // Check if any cart product triggers this rule
      const hasTriggeredProduct = rule.triggerProductIds.some(pid =>
        cartProductIds.includes(pid)
      );
      
      if (!hasTriggeredProduct) return false;
      
      // Check conditions
      if (cartValue < rule.conditions.minCartValue) return false;
      
      return true;
    })
    .sort((a, b) => b.priority - a.priority);
  
  // Collect recommended products
  matchingRules.forEach(rule => {
    rule.recommendProductIds.forEach(productId => {
      // Skip if already in cart
      if (cartProductIds.includes(productId)) return;
      
      const product = products.get(productId);
      if (!product || product.inventory <= 0) return;
      
      // Score based on rule priority and product performance
      const score = rule.priority + (product.performance.conversionRate || 0) * 10;
      
      recommendations.set(productId, Math.max(recommendations.get(productId) || 0, score));
    });
    
    rule.timesTriggered++;
  });
  
  return Array.from(recommendations.entries())
    .map(([productId, score]) => ({
      productId,
      product: products.get(productId),
      score,
      reason: 'cross_sell'
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get upsell recommendations (higher-tier alternatives)
 */
function getUpsellRecommendations(productId, options = {}) {
  const { limit = 5, maxPriceMultiplier = 1.5 } = options;
  
  const product = products.get(productId);
  if (!product) {
    throw new Error('Product not found');
  }
  
  const maxPrice = product.price * maxPriceMultiplier;
  
  return Array.from(products.values())
    .filter(p => {
      if (p.productId === productId) return false;
      if (p.inventory <= 0) return false;
      if (p.price <= product.price) return false;
      if (p.price > maxPrice) return false;
      
      // Same category/subcategory
      return p.category === product.category;
    })
    .map(p => {
      // Calculate upsell score
      let score = 0;
      
      // Prefer similar price point
      const priceDiff = (p.price - product.price) / product.price;
      score += (1 - priceDiff) * 50;
      
      // Same subcategory bonus
      if (p.subcategory === product.subcategory) score += 30;
      
      // Same brand bonus
      if (p.brand === product.brand) score += 20;
      
      // Performance bonus
      score += (p.performance.conversionRate || 0) * 10;
      
      return {
        productId: p.productId,
        product: p,
        score,
        priceDifference: p.price - product.price,
        percentIncrease: Math.round(priceDiff * 100)
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get complementary products (frequently bought together)
 */
function getComplementaryProducts(productId, options = {}) {
  const { limit = 5, minSupport = 0.05 } = options;
  
  // Get from product relations
  const relations = productRelations.get(productId) || new Map();
  
  return Array.from(relations.entries())
    .filter(([_, data]) => data.support >= minSupport)
    .map(([complementProductId, data]) => ({
      productId: complementProductId,
      product: products.get(complementProductId),
      support: data.support,
      confidence: data.confidence,
      lift: data.lift
    }))
    .sort((a, b) => b.lift - a.lift)
    .slice(0, limit);
}

/**
 * Calculate product affinity matrix
 */
function calculateProductAffinities(purchaseHistory) {
  // purchaseHistory: array of { orderId, productIds }
  
  const coOccurrences = new Map(); // productId1:productId2 -> count
  const productCounts = new Map(); // productId -> count
  const totalOrders = purchaseHistory.length;
  
  // Count occurrences
  purchaseHistory.forEach(order => {
    order.productIds.forEach(productId => {
      productCounts.set(productId, (productCounts.get(productId) || 0) + 1);
    });
    
    // Count co-occurrences
    for (let i = 0; i < order.productIds.length; i++) {
      for (let j = i + 1; j < order.productIds.length; j++) {
        const pid1 = order.productIds[i];
        const pid2 = order.productIds[j];
        
        const key = `${pid1}:${pid2}`;
        coOccurrences.set(key, (coOccurrences.get(key) || 0) + 1);
      }
    }
  });
  
  // Calculate metrics
  coOccurrences.forEach((count, key) => {
    const [pid1, pid2] = key.split(':');
    
    const support = count / totalOrders;
    const confidence = count / (productCounts.get(pid1) || 1);
    const lift = confidence / ((productCounts.get(pid2) || 1) / totalOrders);
    
    // Store relations
    if (!productRelations.has(pid1)) {
      productRelations.set(pid1, new Map());
    }
    
    productRelations.get(pid1).set(pid2, {
      support,
      confidence,
      lift,
      count
    });
  });
  
  return {
    totalProducts: productCounts.size,
    totalRelations: coOccurrences.size,
    avgRelationsPerProduct: coOccurrences.size / productCounts.size
  };
}

/**
 * Track product performance
 */
function trackProductPerformance({ productId, event, value = 1, metadata = {} }) {
  const product = products.get(productId);
  if (!product) return;
  
  // Update product performance
  if (event === 'view') {
    product.performance.views++;
  } else if (event === 'click') {
    product.performance.clicks++;
  } else if (event === 'add_to_cart') {
    product.performance.addToCarts++;
  } else if (event === 'purchase') {
    product.performance.purchases++;
    product.performance.revenue += value;
  }
  
  // Calculate conversion rate
  if (product.performance.views > 0) {
    product.performance.conversionRate = 
      (product.performance.purchases / product.performance.views) * 100;
  }
  
  return product.performance;
}

/**
 * Get product analytics
 */
function getProductAnalytics() {
  const productList = Array.from(products.values());
  
  return {
    totalProducts: productList.length,
    inStock: productList.filter(p => p.inventory > 0).length,
    outOfStock: productList.filter(p => p.inventory === 0).length,
    totalBundles: bundles.size,
    totalCrossSellRules: crossSellRules.size,
    avgConversionRate: productList.length > 0
      ? productList.reduce((sum, p) => sum + p.performance.conversionRate, 0) / productList.length
      : 0,
    totalRevenue: productList.reduce((sum, p) => sum + p.performance.revenue, 0),
    topProducts: productList
      .sort((a, b) => b.performance.revenue - a.performance.revenue)
      .slice(0, 10)
      .map(p => ({
        productId: p.productId,
        name: p.name,
        revenue: p.performance.revenue,
        purchases: p.performance.purchases,
        conversionRate: p.performance.conversionRate
      }))
  };
}

module.exports = {
  indexProduct,
  getSimilarProducts,
  getTrendingProducts,
  getNewArrivals,
  createBundle,
  getBundlesForProduct,
  createCrossSellRule,
  getCrossSellRecommendations,
  getUpsellRecommendations,
  getComplementaryProducts,
  calculateProductAffinities,
  trackProductPerformance,
  getProductAnalytics
};
