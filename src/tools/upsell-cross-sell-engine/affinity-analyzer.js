/**
 * Product Affinity Analyzer - Market basket analysis and product relationships
 * Implements Apriori algorithm, association rules, and co-occurrence patterns
 */

// In-memory stores
const affinityRules = new Map(); // productA -> { productB: { support, confidence, lift } }
const coOccurrenceMatrix = new Map(); // productA -> { productB: count }
const productStats = new Map(); // productId -> { totalOrders, revenue, avgBasketSize }
const sequentialPatterns = new Map(); // productA -> { productB: { count, avgTimeDelta } }
const categoryAffinity = new Map(); // categoryA -> { categoryB: score }

/**
 * Analyze frequently bought together patterns
 */
function analyzeFrequentlyBoughtTogether(orders, minSupport = 0.01, minConfidence = 0.3) {
  // Build co-occurrence matrix
  buildCoOccurrenceMatrix(orders);
  
  // Calculate product statistics
  calculateProductStats(orders);
  
  // Generate association rules
  const rules = generateAssociationRules(orders.length, minSupport, minConfidence);
  
  // Store rules
  for (const rule of rules) {
    const key = `${rule.productA}_${rule.productB}`;
    affinityRules.set(key, {
      productA: rule.productA,
      productB: rule.productB,
      support: rule.support,
      confidence: rule.confidence,
      lift: rule.lift,
      type: 'frequently_bought_together',
      computedAt: new Date().toISOString()
    });
  }
  
  return {
    totalRules: rules.length,
    avgSupport: rules.reduce((sum, r) => sum + r.support, 0) / rules.length,
    avgConfidence: rules.reduce((sum, r) => sum + r.confidence, 0) / rules.length,
    avgLift: rules.reduce((sum, r) => sum + r.lift, 0) / rules.length
  };
}

/**
 * Build co-occurrence matrix from order data
 */
function buildCoOccurrenceMatrix(orders) {
  coOccurrenceMatrix.clear();
  
  for (const order of orders) {
    const products = order.items.map(item => item.productId);
    
    // For each pair of products in the order
    for (let i = 0; i < products.length; i++) {
      const productA = products[i];
      
      if (!coOccurrenceMatrix.has(productA)) {
        coOccurrenceMatrix.set(productA, new Map());
      }
      
      for (let j = 0; j < products.length; j++) {
        if (i === j) continue;
        
        const productB = products[j];
        const matrix = coOccurrenceMatrix.get(productA);
        const currentCount = matrix.get(productB) || 0;
        matrix.set(productB, currentCount + 1);
      }
    }
  }
  
  return coOccurrenceMatrix;
}

/**
 * Calculate product-level statistics
 */
function calculateProductStats(orders) {
  productStats.clear();
  
  const productOrders = new Map(); // productId -> order count
  const productRevenue = new Map();
  const productBasketSizes = new Map();
  
  for (const order of orders) {
    const products = new Set(order.items.map(item => item.productId));
    const basketSize = order.items.length;
    
    for (const item of order.items) {
      const productId = item.productId;
      
      // Order count
      const orderCount = productOrders.get(productId) || 0;
      productOrders.set(productId, orderCount + 1);
      
      // Revenue
      const revenue = productRevenue.get(productId) || 0;
      productRevenue.set(productId, revenue + (item.price * item.quantity));
      
      // Basket sizes
      if (!productBasketSizes.has(productId)) {
        productBasketSizes.set(productId, []);
      }
      productBasketSizes.get(productId).push(basketSize);
    }
  }
  
  // Aggregate stats
  for (const [productId, orderCount] of productOrders) {
    productStats.set(productId, {
      totalOrders: orderCount,
      support: orderCount / orders.length,
      revenue: productRevenue.get(productId) || 0,
      avgBasketSize: average(productBasketSizes.get(productId) || [])
    });
  }
}

/**
 * Generate association rules using Apriori algorithm
 */
function generateAssociationRules(totalOrders, minSupport, minConfidence) {
  const rules = [];
  
  for (const [productA, coOccurrences] of coOccurrenceMatrix) {
    const statsA = productStats.get(productA);
    if (!statsA) continue;
    
    for (const [productB, coOccurrenceCount] of coOccurrences) {
      const statsB = productStats.get(productB);
      if (!statsB) continue;
      
      // Calculate support: P(A ∩ B)
      const support = coOccurrenceCount / totalOrders;
      
      if (support < minSupport) continue;
      
      // Calculate confidence: P(B|A) = P(A ∩ B) / P(A)
      const confidence = coOccurrenceCount / statsA.totalOrders;
      
      if (confidence < minConfidence) continue;
      
      // Calculate lift: P(B|A) / P(B)
      const lift = confidence / statsB.support;
      
      // Only keep rules with lift > 1 (positive correlation)
      if (lift > 1.0) {
        rules.push({
          productA,
          productB,
          support,
          confidence,
          lift,
          coOccurrences: coOccurrenceCount
        });
      }
    }
  }
  
  return rules.sort((a, b) => b.lift - a.lift);
}

/**
 * Get complementary products for a given product
 */
function getComplementaryProducts(productId, maxResults = 10) {
  const complementary = [];
  
  // Get all rules where this product is the antecedent
  for (const [key, rule] of affinityRules) {
    if (rule.productA === productId) {
      complementary.push({
        productId: rule.productB,
        affinityScore: rule.lift,
        confidence: rule.confidence,
        support: rule.support,
        reasoning: `${(rule.confidence * 100).toFixed(1)}% of customers who bought this also bought that`
      });
    }
  }
  
  return complementary
    .sort((a, b) => b.affinityScore - a.affinityScore)
    .slice(0, maxResults);
}

/**
 * Analyze sequential purchase patterns
 */
function analyzeSequentialPatterns(orders) {
  sequentialPatterns.clear();
  
  // Group orders by customer
  const customerOrders = new Map();
  
  for (const order of orders) {
    const customerId = order.customerId;
    if (!customerOrders.has(customerId)) {
      customerOrders.set(customerId, []);
    }
    customerOrders.get(customerId).push(order);
  }
  
  // Analyze sequences for each customer
  for (const [customerId, orders] of customerOrders) {
    // Sort orders by date
    const sortedOrders = orders.sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );
    
    // Look for product sequences
    for (let i = 0; i < sortedOrders.length - 1; i++) {
      const currentOrder = sortedOrders[i];
      const nextOrder = sortedOrders[i + 1];
      
      const currentProducts = currentOrder.items.map(item => item.productId);
      const nextProducts = nextOrder.items.map(item => item.productId);
      
      const timeDelta = new Date(nextOrder.createdAt) - new Date(currentOrder.createdAt);
      const daysDelta = timeDelta / (1000 * 60 * 60 * 24);
      
      // Record sequences
      for (const productA of currentProducts) {
        if (!sequentialPatterns.has(productA)) {
          sequentialPatterns.set(productA, new Map());
        }
        
        for (const productB of nextProducts) {
          if (productA === productB) continue;
          
          const patterns = sequentialPatterns.get(productA);
          
          if (!patterns.has(productB)) {
            patterns.set(productB, { count: 0, totalDays: 0, occurrences: [] });
          }
          
          const pattern = patterns.get(productB);
          pattern.count++;
          pattern.totalDays += daysDelta;
          pattern.occurrences.push(daysDelta);
        }
      }
    }
  }
  
  // Calculate average time deltas
  for (const [productA, patterns] of sequentialPatterns) {
    for (const [productB, data] of patterns) {
      data.avgTimeDelta = data.totalDays / data.count;
      data.medianTimeDelta = median(data.occurrences);
    }
  }
  
  return {
    totalPatterns: Array.from(sequentialPatterns.values())
      .reduce((sum, patterns) => sum + patterns.size, 0)
  };
}

/**
 * Get next likely purchase based on sequential patterns
 */
function predictNextPurchase(productId, maxResults = 10) {
  const patterns = sequentialPatterns.get(productId);
  if (!patterns) return [];
  
  return Array.from(patterns.entries())
    .map(([nextProductId, data]) => ({
      productId: nextProductId,
      probability: data.count / 100, // Simplified probability
      avgDaysUntilPurchase: data.avgTimeDelta,
      medianDaysUntilPurchase: data.medianTimeDelta,
      occurrences: data.count
    }))
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, maxResults);
}

/**
 * Analyze category-level affinity
 */
function analyzeCategoryAffinity(orders, productCatalog) {
  categoryAffinity.clear();
  
  // Build category co-occurrence matrix
  const categoryCoOccurrence = new Map();
  const categoryStats = new Map();
  
  for (const order of orders) {
    const categories = new Set();
    
    // Get all categories in this order
    for (const item of order.items) {
      const product = productCatalog.find(p => p.id === item.productId);
      if (product && product.category) {
        categories.add(product.category);
      }
    }
    
    const categoryArray = Array.from(categories);
    
    // Count category occurrences
    for (const category of categoryArray) {
      const count = categoryStats.get(category) || 0;
      categoryStats.set(category, count + 1);
    }
    
    // Build co-occurrence matrix
    for (let i = 0; i < categoryArray.length; i++) {
      const categoryA = categoryArray[i];
      
      if (!categoryCoOccurrence.has(categoryA)) {
        categoryCoOccurrence.set(categoryA, new Map());
      }
      
      for (let j = 0; j < categoryArray.length; j++) {
        if (i === j) continue;
        
        const categoryB = categoryArray[j];
        const matrix = categoryCoOccurrence.get(categoryA);
        const count = matrix.get(categoryB) || 0;
        matrix.set(categoryB, count + 1);
      }
    }
  }
  
  // Calculate affinity scores
  for (const [categoryA, coOccurrences] of categoryCoOccurrence) {
    const statsA = categoryStats.get(categoryA) || 0;
    
    if (!categoryAffinity.has(categoryA)) {
      categoryAffinity.set(categoryA, new Map());
    }
    
    for (const [categoryB, count] of coOccurrences) {
      const statsB = categoryStats.get(categoryB) || 0;
      
      // PMI (Pointwise Mutual Information) score
      const pAB = count / orders.length;
      const pA = statsA / orders.length;
      const pB = statsB / orders.length;
      
      const pmi = Math.log2(pAB / (pA * pB));
      
      categoryAffinity.get(categoryA).set(categoryB, {
        score: pmi,
        coOccurrences: count,
        support: pAB
      });
    }
  }
  
  return {
    totalCategories: categoryStats.size,
    totalAffinities: Array.from(categoryAffinity.values())
      .reduce((sum, affinities) => sum + affinities.size, 0)
  };
}

/**
 * Get cross-category recommendations
 */
function getCrossCategoryRecommendations(categoryId, maxResults = 5) {
  const affinities = categoryAffinity.get(categoryId);
  if (!affinities) return [];
  
  return Array.from(affinities.entries())
    .map(([category, data]) => ({
      category,
      affinityScore: data.score,
      support: data.support,
      coOccurrences: data.coOccurrences
    }))
    .sort((a, b) => b.affinityScore - a.affinityScore)
    .slice(0, maxResults);
}

/**
 * Calculate affinity score between two products
 */
function calculateAffinityScore(productA, productB) {
  const key = `${productA}_${productB}`;
  const rule = affinityRules.get(key);
  
  if (rule) {
    return {
      score: rule.lift,
      confidence: rule.confidence,
      support: rule.support,
      type: rule.type
    };
  }
  
  // Check reverse direction
  const reverseKey = `${productB}_${productA}`;
  const reverseRule = affinityRules.get(reverseKey);
  
  if (reverseRule) {
    return {
      score: reverseRule.lift,
      confidence: reverseRule.confidence,
      support: reverseRule.support,
      type: reverseRule.type
    };
  }
  
  return null;
}

/**
 * Get affinity matrix for visualization
 */
function getAffinityMatrix(productIds) {
  const matrix = [];
  
  for (const productA of productIds) {
    const row = [];
    
    for (const productB of productIds) {
      if (productA === productB) {
        row.push({ score: 1.0, self: true });
      } else {
        const affinity = calculateAffinityScore(productA, productB);
        row.push(affinity || { score: 0, confidence: 0, support: 0 });
      }
    }
    
    matrix.push(row);
  }
  
  return {
    productIds,
    matrix
  };
}

/**
 * Find product bundles using maximal frequent itemsets
 */
function findProductBundles(minSupport = 0.02, minProducts = 2, maxProducts = 4) {
  const bundles = [];
  
  // Start with 2-itemsets (pairs) that meet minimum support
  const frequentPairs = [];
  
  for (const [productA, coOccurrences] of coOccurrenceMatrix) {
    for (const [productB, count] of coOccurrences) {
      const support = count / productStats.get(productA).totalOrders;
      
      if (support >= minSupport) {
        frequentPairs.push({
          products: [productA, productB].sort(),
          support,
          frequency: count
        });
      }
    }
  }
  
  // Extend to larger itemsets
  let currentItemsets = frequentPairs;
  
  for (let k = 2; k < maxProducts; k++) {
    const nextItemsets = [];
    
    // Join itemsets
    for (let i = 0; i < currentItemsets.length; i++) {
      for (let j = i + 1; j < currentItemsets.length; j++) {
        const itemsetA = currentItemsets[i].products;
        const itemsetB = currentItemsets[j].products;
        
        // Check if they differ by only one element
        const union = [...new Set([...itemsetA, ...itemsetB])];
        
        if (union.length === k + 1) {
          // Check support for this larger itemset
          const support = calculateItemsetSupport(union);
          
          if (support >= minSupport) {
            nextItemsets.push({
              products: union.sort(),
              support,
              size: union.length
            });
          }
        }
      }
    }
    
    if (nextItemsets.length === 0) break;
    
    currentItemsets = nextItemsets;
    bundles.push(...nextItemsets);
  }
  
  return bundles
    .filter(b => b.size >= minProducts && b.size <= maxProducts)
    .sort((a, b) => b.support - a.support);
}

function calculateItemsetSupport(products) {
  // Simplified support calculation
  // In production, scan transaction database
  return 0.1; // Placeholder
}

/**
 * Utility functions
 */

function average(numbers) {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function median(numbers) {
  if (numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

/**
 * Get all affinity rules
 */
function getAllAffinityRules(filters = {}) {
  let rules = Array.from(affinityRules.values());
  
  if (filters.minLift) {
    rules = rules.filter(r => r.lift >= filters.minLift);
  }
  
  if (filters.minConfidence) {
    rules = rules.filter(r => r.confidence >= filters.minConfidence);
  }
  
  if (filters.minSupport) {
    rules = rules.filter(r => r.support >= filters.minSupport);
  }
  
  if (filters.productId) {
    rules = rules.filter(r => r.productA === filters.productId || r.productB === filters.productId);
  }
  
  return rules;
}

/**
 * Update affinity data with new order
 */
function updateAffinityWithOrder(order) {
  // Incremental update (simplified)
  // In production, would trigger scheduled recomputation
  
  const products = order.items.map(item => item.productId);
  
  // Update co-occurrence matrix
  for (let i = 0; i < products.length; i++) {
    const productA = products[i];
    
    if (!coOccurrenceMatrix.has(productA)) {
      coOccurrenceMatrix.set(productA, new Map());
    }
    
    for (let j = 0; j < products.length; j++) {
      if (i === j) continue;
      
      const productB = products[j];
      const matrix = coOccurrenceMatrix.get(productA);
      const count = matrix.get(productB) || 0;
      matrix.set(productB, count + 1);
    }
  }
}

module.exports = {
  analyzeFrequentlyBoughtTogether,
  buildCoOccurrenceMatrix,
  calculateProductStats,
  getComplementaryProducts,
  analyzeSequentialPatterns,
  predictNextPurchase,
  analyzeCategoryAffinity,
  getCrossCategoryRecommendations,
  calculateAffinityScore,
  getAffinityMatrix,
  findProductBundles,
  getAllAffinityRules,
  updateAffinityWithOrder
};
