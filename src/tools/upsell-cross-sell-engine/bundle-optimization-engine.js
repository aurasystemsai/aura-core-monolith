/**
 * BUNDLE OPTIMIZATION ENGINE
 * Handles bundle creation, pricing optimization, margin analysis,
 * discount strategies, and bundle performance tracking
 */

// In-memory stores
const bundles = new Map();
const bundleTemplates = new Map();
const bundlePerformance = new Map();
const pricingRules = new Map();

// ================================================================
// BUNDLE MANAGEMENT
// ================================================================

function createBundle({ name, products, pricingStrategy, discountType, discountValue, conditions = {} }) {
  const id = `bundle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();
  
  // Calculate bundle pricing
  const pricing = calculateBundlePricing({
    products,
    pricingStrategy,
    discountType,
    discountValue
  });
  
  const bundle = {
    id,
    name,
    products, // Array of { productId, quantity, price }
    pricingStrategy, // 'fixed', 'percentage_off', 'tiered', 'dynamic'
    discountType, // 'absolute', 'percentage'
    discountValue,
    pricing,
    conditions, // Minimum quantity, cart value, etc.
    status: 'active',
    performance: {
      views: 0,
      adds: 0,
      purchases: 0,
      revenue: 0
    },
    createdAt: timestamp,
    updatedAt: timestamp
  };
  
  bundles.set(id, bundle);
  return bundle;
}

function getBundle(id) {
  return bundles.get(id) || null;
}

function listBundles({ status, category, limit = 100 }) {
  return Array.from(bundles.values())
    .filter(b => !status || b.status === status)
    .filter(b => !category || b.products.some(p => p.category === category))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

function updateBundle(id, updates) {
  const bundle = bundles.get(id);
  if (!bundle) return null;
  
  const updated = {
    ...bundle,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  // Recalculate pricing if products or discount changed
  if (updates.products || updates.discountType || updates.discountValue) {
    updated.pricing = calculateBundlePricing({
      products: updated.products,
      pricingStrategy: updated.pricingStrategy,
      discountType: updated.discountType,
      discountValue: updated.discountValue
    });
  }
  
  bundles.set(id, updated);
  return updated;
}

function deleteBundle(id) {
  return bundles.delete(id);
}

function activateBundle(id) {
  const bundle = bundles.get(id);
  if (!bundle) return null;
  
  bundle.status = 'active';
  bundle.updatedAt = new Date().toISOString();
  bundles.set(id, bundle);
  return bundle;
}

function deactivateBundle(id) {
  const bundle = bundles.get(id);
  if (!bundle) return null;
  
  bundle.status = 'inactive';
  bundle.updatedAt = new Date().toISOString();
  bundles.set(id, bundle);
  return bundle;
}

// ================================================================
// BUNDLE PRICING OPTIMIZATION
// ================================================================

function calculateBundlePricing({ products, pricingStrategy, discountType, discountValue }) {
  // Calculate total retail price
  const totalRetail = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  
  let bundlePrice = totalRetail;
  let savings = 0;
  let margin = 0;
  
  switch (pricingStrategy) {
    case 'fixed':
      bundlePrice = discountValue;
      break;
    
    case 'percentage_off':
      if (discountType === 'percentage') {
        bundlePrice = totalRetail * (1 - discountValue / 100);
      } else {
        bundlePrice = totalRetail - discountValue;
      }
      break;
    
    case 'tiered':
      bundlePrice = calculateTieredPricing(products, discountValue);
      break;
    
    case 'dynamic':
      bundlePrice = calculateDynamicPricing(products);
      break;
    
    default:
      bundlePrice = totalRetail;
  }
  
  savings = totalRetail - bundlePrice;
  const savingsPercentage = (savings / totalRetail) * 100;
  
  // Calculate margin
  const totalCost = products.reduce((sum, p) => sum + (p.cost || p.price * 0.6) * p.quantity, 0);
  margin = ((bundlePrice - totalCost) / bundlePrice) * 100;
  
  return {
    totalRetail,
    bundlePrice,
    savings,
    savingsPercentage,
    margin,
    totalCost,
    profit: bundlePrice - totalCost
  };
}

function calculateTieredPricing(products, tiers) {
  // Tiers: [{ quantity: 2, discount: 10 }, { quantity: 3, discount: 15 }]
  const totalQty = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalRetail = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  
  let applicableTier = tiers.find(t => totalQty >= t.quantity);
  if (!applicableTier) {
    applicableTier = tiers[0];
  }
  
  return totalRetail * (1 - applicableTier.discount / 100);
}

function calculateDynamicPricing(products) {
  // Dynamic pricing based on demand, inventory, competition
  const totalRetail = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  
  // Factors: inventory level, demand, time of day, seasonality
  let priceMultiplier = 1.0;
  
  products.forEach(p => {
    if (p.inventoryLevel < 10) {
      priceMultiplier -= 0.05; // Clearance pricing
    }
    if (p.demand === 'high') {
      priceMultiplier += 0.02; // High demand = less discount
    }
  });
  
  return totalRetail * priceMultiplier;
}

function optimizeBundlePrice({ bundleId, targetMargin, competitorPrices }) {
  const bundle = bundles.get(bundleId);
  if (!bundle) return null;
  
  const currentPricing = bundle.pricing;
  
  // Optimize to achieve target margin while remaining competitive
  let optimalPrice = currentPricing.totalRetail;
  
  // Constraint 1: Maintain minimum margin
  const minPrice = currentPricing.totalCost / (1 - targetMargin / 100);
  
  // Constraint 2: Stay competitive
  let maxPrice = currentPricing.totalRetail;
  if (competitorPrices && competitorPrices.length > 0) {
    const avgCompetitorPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
    maxPrice = Math.min(maxPrice, avgCompetitorPrice * 1.05); // Up to 5% above avg
  }
  
  optimalPrice = Math.max(minPrice, Math.min(currentPricing.bundlePrice, maxPrice));
  
  return {
    currentPrice: currentPricing.bundlePrice,
    optimalPrice,
    minPrice,
    maxPrice,
    expectedMargin: ((optimalPrice - currentPricing.totalCost) / optimalPrice) * 100,
    priceChange: optimalPrice - currentPricing.bundlePrice,
    priceChangePercentage: ((optimalPrice - currentPricing.bundlePrice) / currentPricing.bundlePrice) * 100
  };
}

// ================================================================
// BUNDLE GENERATION & RECOMMENDATIONS
// ================================================================

function generateBundleRecommendations({ productId, strategy = 'frequently_bought', limit = 5 }) {
  let recommendations = [];
  
  switch (strategy) {
    case 'frequently_bought':
      recommendations = generateFrequentlyBoughtBundles(productId, limit);
      break;
    
    case 'complementary':
      recommendations = generateComplementaryBundles(productId, limit);
      break;
    
    case 'category_based':
      recommendations = generateCategoryBundles(productId, limit);
      break;
    
    case 'margin_optimized':
      recommendations = generateMarginOptimizedBundles(productId, limit);
      break;
    
    default:
      recommendations = generateFrequentlyBoughtBundles(productId, limit);
  }
  
  return recommendations;
}

function generateFrequentlyBoughtBundles(productId, limit) {
  // Find products frequently purchased together
  // Placeholder logic
  return Array.from({ length: Math.min(limit, 3) }, (_, i) => ({
    name: `Bundle ${i + 1} with Product ${productId}`,
    products: [
      { productId, quantity: 1, price: 100 },
      { productId: `prod_${i + 1}`, quantity: 1, price: 80 }
    ],
    estimatedLift: 15 + i * 5,
    confidence: 0.8 - i * 0.1
  }));
}

function generateComplementaryBundles(productId, limit) {
  // Find complementary products (e.g., camera + lens + bag)
  return Array.from({ length: Math.min(limit, 3) }, (_, i) => ({
    name: `Complementary Bundle ${i + 1}`,
    products: [
      { productId, quantity: 1, price: 100 },
      { productId: `comp_${i + 1}`, quantity: 1, price: 50 }
    ],
    estimatedLift: 20 + i * 3,
    confidence: 0.75
  }));
}

function generateCategoryBundles(productId, limit) {
  // Create bundles from same category
  return Array.from({ length: Math.min(limit, 3) }, (_, i) => ({
    name: `Category Bundle ${i + 1}`,
    products: [
      { productId, quantity: 1, price: 100 },
      { productId: `cat_${i + 1}`, quantity: 1, price: 90 }
    ],
    estimatedLift: 12 + i * 2,
    confidence: 0.7
  }));
}

function generateMarginOptimizedBundles(productId, limit) {
  // Create bundles optimized for maximum margin
  return Array.from({ length: Math.min(limit, 3) }, (_, i) => ({
    name: `High-Margin Bundle ${i + 1}`,
    products: [
      { productId, quantity: 1, price: 100, cost: 40 },
      { productId: `margin_${i + 1}`, quantity: 1, price: 120, cost: 45 }
    ],
    estimatedMargin: 48 + i,
    estimatedLift: 10 + i * 3,
    confidence: 0.65
  }));
}

// ================================================================
// BUNDLE TEMPLATES
// ================================================================

function createBundleTemplate({ name, description, rules, pricingStrategy }) {
  const id = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const template = {
    id,
    name,
    description,
    rules, // Conditions for products to include
    pricingStrategy,
    createdAt: new Date().toISOString()
  };
  
  bundleTemplates.set(id, template);
  return template;
}

function getBundleTemplate(id) {
  return bundleTemplates.get(id) || null;
}

function listBundleTemplates({ limit = 100 }) {
  return Array.from(bundleTemplates.values()).slice(0, limit);
}

function applyBundleTemplate({ templateId, products }) {
  const template = bundleTemplates.get(templateId);
  if (!template) return null;
  
  return createBundle({
    name: `${template.name} - Auto-generated`,
    products,
    pricingStrategy: template.pricingStrategy,
    discountType: 'percentage',
    discountValue: 15 // Default 15% off
  });
}

// ================================================================
// MARGIN ANALYSIS
// ================================================================

function analyzeBundleMargins(bundleId) {
  const bundle = bundles.get(bundleId);
  if (!bundle) return null;
  
  const productMargins = bundle.products.map(p => {
    const cost = p.cost || p.price * 0.6;
    const margin = ((p.price - cost) / p.price) * 100;
    return {
      productId: p.productId,
      price: p.price,
      cost,
      margin,
      contribution: (p.price - cost) * p.quantity
    };
  });
  
  const totalMargin = bundle.pricing.margin;
  const weightedMargin = productMargins.reduce((sum, pm) => {
    return sum + (pm.margin * (pm.price / bundle.pricing.totalRetail));
  }, 0);
  
  return {
    bundleMargin: totalMargin,
    productMargins,
    weightedAvgMargin: weightedMargin,
    totalProfit: bundle.pricing.profit,
    marginImprovement: totalMargin - weightedMargin // Bundle effect on margin
  };
}

function optimizeBundleForMargin({ products, minMargin = 30, maxDiscount = 25 }) {
  const totalRetail = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const totalCost = products.reduce((sum, p) => sum + (p.cost || p.price * 0.6) * p.quantity, 0);
  
  // Calculate minimum price to achieve target margin
  const minPrice = totalCost / (1 - minMargin / 100);
  
  // Calculate maximum discount we can offer
  const maxDiscountPrice = totalRetail * (1 - maxDiscount / 100);
  
  // Optimal price is the higher of the two (more conservative)
  const optimalPrice = Math.max(minPrice, maxDiscountPrice);
  
  const achievedMargin = ((optimalPrice - totalCost) / optimalPrice) * 100;
  const discountOffered = ((totalRetail - optimalPrice) / totalRetail) * 100;
  
  return {
    optimalPrice,
    achievedMargin,
    discountOffered,
    totalRetail,
    totalCost,
    profit: optimalPrice - totalCost,
    meetsMarginTarget: achievedMargin >= minMargin
  };
}

// ================================================================
// DISCOUNT STRATEGIES
// ================================================================

function createDiscountRule({ name, type, value, conditions, validUntil }) {
  const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const rule = {
    id,
    name,
    type, // 'percentage', 'fixed_amount', 'buy_x_get_y'
    value,
    conditions, // { minQuantity, minValue, productCategories, etc. }
    validUntil,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  
  pricingRules.set(id, rule);
  return rule;
}

function getDiscountRule(id) {
  return pricingRules.get(id) || null;
}

function listDiscountRules({ status, limit = 100 }) {
  return Array.from(pricingRules.values())
    .filter(r => !status || r.status === status)
    .slice(0, limit);
}

function applyDiscountRule({ bundleId, ruleId }) {
  const bundle = bundles.get(bundleId);
  const rule = pricingRules.get(ruleId);
  
  if (!bundle || !rule) return null;
  
  // Check if bundle meets conditions
  const meetsConditions = checkRuleConditions(bundle, rule.conditions);
  if (!meetsConditions) {
    return { applied: false, reason: 'Conditions not met' };
  }
  
  // Apply discount
  let discountedPrice = bundle.pricing.bundlePrice;
  
  if (rule.type === 'percentage') {
    discountedPrice = bundle.pricing.bundlePrice * (1 - rule.value / 100);
  } else if (rule.type === 'fixed_amount') {
    discountedPrice = bundle.pricing.bundlePrice - rule.value;
  }
  
  return {
    applied: true,
    originalPrice: bundle.pricing.bundlePrice,
    discountedPrice,
    savings: bundle.pricing.bundlePrice - discountedPrice,
    ruleName: rule.name
  };
}

function checkRuleConditions(bundle, conditions) {
  if (conditions.minQuantity) {
    const totalQty = bundle.products.reduce((sum, p) => sum + p.quantity, 0);
    if (totalQty < conditions.minQuantity) return false;
  }
  
  if (conditions.minValue) {
    if (bundle.pricing.bundlePrice < conditions.minValue) return false;
  }
  
  if (conditions.productCategories && conditions.productCategories.length > 0) {
    const hasCategory = bundle.products.some(p => 
      conditions.productCategories.includes(p.category)
    );
    if (!hasCategory) return false;
  }
  
  return true;
}

// ================================================================
// BUNDLE PERFORMANCE TRACKING
// ================================================================

function trackBundleView(bundleId) {
  const bundle = bundles.get(bundleId);
  if (bundle) {
    bundle.performance.views += 1;
    bundles.set(bundleId, bundle);
  }
}

function trackBundleAddToCart(bundleId) {
  const bundle = bundles.get(bundleId);
  if (bundle) {
    bundle.performance.adds += 1;
    bundles.set(bundleId, bundle);
  }
}

function trackBundlePurchase(bundleId, revenue) {
  const bundle = bundles.get(bundleId);
  if (bundle) {
    bundle.performance.purchases += 1;
    bundle.performance.revenue += revenue;
    bundles.set(bundleId, bundle);
  }
}

function getBundlePerformance(bundleId) {
  const bundle = bundles.get(bundleId);
  if (!bundle) return null;
  
  const perf = bundle.performance;
  
  return {
    ...perf,
    conversionRate: perf.views > 0 ? (perf.purchases / perf.views) * 100 : 0,
    addToCartRate: perf.views > 0 ? (perf.adds / perf.views) * 100 : 0,
    purchaseRate: perf.adds > 0 ? (perf.purchases / perf.adds) * 100 : 0,
    avgRevenue: perf.purchases > 0 ? perf.revenue / perf.purchases : 0
  };
}

function compareBundle Performance({ bundleIds }) {
  const comparisons = bundleIds.map(id => {
    const perf = getBundlePerformance(id);
    const bundle = bundles.get(id);
    return {
      id,
      name: bundle ? bundle.name : 'Unknown',
      ...perf
    };
  });
  
  return comparisons.sort((a, b) => b.revenue - a.revenue);
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Bundle Management
  createBundle,
  getBundle,
  listBundles,
  updateBundle,
  deleteBundle,
  activateBundle,
  deactivateBundle,
  
  // Pricing
  calculateBundlePricing,
  optimizeBundlePrice,
  
  // Generation
  generateBundleRecommendations,
  
  // Templates
  createBundleTemplate,
  getBundleTemplate,
  listBundleTemplates,
  applyBundleTemplate,
  
  // Margin Analysis
  analyzeBundleMargins,
  optimizeBundleForMargin,
  
  // Discount Rules
  createDiscountRule,
  getDiscountRule,
  listDiscountRules,
  applyDiscountRule,
  
  // Performance
  trackBundleView,
  trackBundleAddToCart,
  trackBundlePurchase,
  getBundlePerformance,
  compareBundlePerformance,
  
  // Data stores
  bundles,
  bundleTemplates,
  pricingRules
};
