/**
 * Cart Optimization Engine - Smart upsells, cross-sells, and value maximization
 * Optimizes cart value, conversion rate, and customer satisfaction
 */

const recommendationEngine = require('./recommendation-engine');
const affinityAnalyzer = require('./affinity-analyzer');

// In-memory stores
const activeCarts = new Map(); // cartId -> cart data
const abandonedCarts = new Map(); // cartId -> abandoned cart data
const optimizationRules = new Map(); // ruleId -> rule config
const performanceMetrics = new Map(); // metric tracking

/**
 * Optimize cart with intelligent suggestions
 */
async function optimizeCart(cart, context = {}) {
  const suggestions = {
    upsells: [],
    crossSells: [],
    bundleOffers: [],
    freeShipping: null,
    quantityDiscounts: [],
    timeLimitedOffers: [],
    estimatedValueIncrease: 0
  };
  
  // Calculate current cart value
  const currentValue = calculateCartValue(cart);
  cart.currentValue = currentValue;
  
  // Store active cart
  activeCarts.set(cart.id, {
    ...cart,
    lastUpdated: new Date().toISOString(),
    optimizationAttempts: (activeCarts.get(cart.id)?.optimizationAttempts || 0) + 1
  });
  
  // Generate upsell suggestions
  suggestions.upsells = await generateUpsells(cart, context);
  
  // Generate cross-sell suggestions
  suggestions.crossSells = await generateCrossSells(cart, context);
  
  // Generate bundle offers
  suggestions.bundleOffers = await generateBundleOffers(cart, context);
  
  // Check for free shipping opportunities
  suggestions.freeShipping = calculateFreeShippingNudge(cart);
  
  // Calculate quantity discounts
  suggestions.quantityDiscounts = calculateQuantityDiscounts(cart);
  
  // Generate time-limited offers
  suggestions.timeLimitedOffers = generateTimeLimitedOffers(cart, context);
  
  // Estimate total value increase if all suggestions accepted
  suggestions.estimatedValueIncrease = estimateValueIncrease(suggestions);
  
  // Predict final cart value
  suggestions.predictedFinalValue = predictFinalCartValue(cart, suggestions, context);
  
  // Apply optimization rules
  suggestions.appliedRules = applyOptimizationRules(cart, suggestions);
  
  return suggestions;
}

/**
 * Generate intelligent upsell suggestions
 */
async function generateUpsells(cart, context) {
  const upsells = [];
  
  for (const item of cart.items) {
    // Find higher-value alternatives
    const higherValueProducts = findHigherValueAlternatives(item.productId, item.price);
    
    for (const product of higherValueProducts.slice(0, 2)) {
      const valueIncrease = product.price - item.price;
      const percentIncrease = (valueIncrease / item.price) * 100;
      
      // Only suggest if increase is reasonable (10-40%)
      if (percentIncrease >= 10 && percentIncrease <= 40) {
        upsells.push({
          type: 'upgrade',
          currentProduct: item.productId,
          suggestedProduct: product.id,
          currentPrice: item.price,
          suggestedPrice: product.price,
          valueIncrease,
          percentIncrease,
          reasoning: `Upgrade to ${product.name} for ${percentIncrease.toFixed(0)}% more`,
          benefits: product.upgradeBenefits || [`Premium quality`, `Enhanced features`],
          urgency: product.stock < 10 ? 'low_stock' : null
        });
      }
    }
    
    // Suggest larger quantities
    if (item.quantity === 1) {
      const quantityUpsell = calculateQuantityUpsell(item);
      if (quantityUpsell) {
        upsells.push(quantityUpsell);
      }
    }
  }
  
  // Add category upsells (premium products in same category)
  const categoryUpsells = await findCategoryUpsells(cart);
  upsells.push(...categoryUpsells);
  
  // Score and rank upsells
  return upsells
    .map(upsell => ({
      ...upsell,
      score: calculateUpsellScore(upsell, cart, context)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

/**
 * Generate cross-sell suggestions based on cart contents
 */
async function generateCrossSells(cart, context) {
  const crossSells = [];
  const cartProductIds = cart.items.map(item => item.productId);
  
  // Find complementary products using affinity analysis
  for (const item of cart.items) {
    const complementary = affinityAnalyzer.getComplementaryProducts(item.productId, 5);
    
    for (const product of complementary) {
      // Don't suggest products already in cart
      if (cartProductIds.includes(product.productId)) continue;
      
      crossSells.push({
        type: 'complementary',
        triggerProduct: item.productId,
        suggestedProduct: product.productId,
        affinityScore: product.affinityScore,
        confidence: product.confidence,
        reasoning: product.reasoning,
        bundleDiscount: calculateBundleDiscount(item.productId, product.productId)
      });
    }
  }
  
  // Get AI-powered recommendations
  if (context.customerId) {
    try {
      const aiRecs = await recommendationEngine.generateRecommendations({
        customerId: context.customerId,
        context: { cartProducts: cartProductIds },
        strategy: 'hybrid',
        maxRecommendations: 10,
        filters: { exclude: cartProductIds }
      });
      
      for (const rec of aiRecs.recommendations) {
        crossSells.push({
          type: 'ai_recommended',
          suggestedProduct: rec.productId,
          score: rec.score,
          confidence: rec.confidence,
          reasoning: rec.reasoning,
          model: rec.model
        });
      }
    } catch (error) {
      console.error('AI recommendations failed:', error);
    }
  }
  
  // Deduplicate and score
  const uniqueCrossSells = deduplicateSuggestions(crossSells);
  
  return uniqueCrossSells
    .map(cs => ({
      ...cs,
      score: calculateCrossSellScore(cs, cart, context)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

/**
 * Generate smart bundle offers
 */
async function generateBundleOffers(cart, context) {
  const bundles = [];
  const cartProductIds = cart.items.map(item => item.productId);
  
  // Find bundles that include cart products
  const relevantBundles = findRelevantBundles(cartProductIds);
  
  for (const bundle of relevantBundles) {
    const missingProducts = bundle.products.filter(p => !cartProductIds.includes(p.productId));
    
    if (missingProducts.length > 0 && missingProducts.length <= 3) {
      const bundleValue = calculateBundleValue(bundle);
      const currentProductsValue = bundle.products
        .filter(p => cartProductIds.includes(p.productId))
        .reduce((sum, p) => sum + p.price, 0);
      const missingProductsValue = missingProducts.reduce((sum, p) => sum + p.price, 0);
      const savings = (currentProductsValue + missingProductsValue) - bundleValue;
      
      bundles.push({
        bundleId: bundle.id,
        bundleName: bundle.name,
        missingProducts,
        currentProductsInBundle: bundle.products.filter(p => cartProductIds.includes(p.productId)),
        regularPrice: currentProductsValue + missingProductsValue,
        bundlePrice: bundleValue,
        savings,
        savingsPercent: (savings / (currentProductsValue + missingProductsValue)) * 100,
        reasoning: `Complete the ${bundle.name} and save ${formatCurrency(savings)}`
      });
    }
  }
  
  // Generate dynamic bundles based on affinity
  const dynamicBundles = generateDynamicBundles(cart);
  bundles.push(...dynamicBundles);
  
  return bundles
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 3);
}

/**
 * Calculate free shipping nudge
 */
function calculateFreeShippingNudge(cart) {
  const freeShippingThreshold = 75; // $75 free shipping threshold
  const currentValue = cart.currentValue || calculateCartValue(cart);
  
  if (currentValue >= freeShippingThreshold) {
    return {
      qualified: true,
      message: 'You qualify for free shipping!',
      saved: 8.99
    };
  }
  
  const remaining = freeShippingThreshold - currentValue;
  
  if (remaining <= 25) {
    // Find products that would get them to free shipping
    const suggestions = findProductsForFreeShipping(remaining, cart);
    
    return {
      qualified: false,
      remaining,
      shippingCost: 8.99,
      message: `Add ${formatCurrency(remaining)} more for free shipping`,
      suggestions,
      urgency: remaining <= 10 ? 'high' : 'medium'
    };
  }
  
  return null;
}

/**
 * Calculate quantity discount opportunities
 */
function calculateQuantityDiscounts(cart) {
  const discounts = [];
  
  for (const item of cart.items) {
    const quantityTiers = getQuantityTiers(item.productId);
    
    for (const tier of quantityTiers) {
      if (item.quantity < tier.minQuantity) {
        const additionalQuantity = tier.minQuantity - item.quantity;
        const currentCost = item.price * item.quantity;
        const newCost = item.price * tier.minQuantity * (1 - tier.discount);
        const savings = (item.price * tier.minQuantity) - newCost;
        
        discounts.push({
          productId: item.productId,
          currentQuantity: item.quantity,
          suggestedQuantity: tier.minQuantity,
          additionalQuantity,
          discountPercent: tier.discount * 100,
          currentCost,
          newCost,
          savings,
          reasoning: `Buy ${additionalQuantity} more and save ${tier.discount * 100}%`
        });
        
        break; // Only suggest the next tier
      }
    }
  }
  
  return discounts;
}

/**
 * Generate time-limited offers
 */
function generateTimeLimitedOffers(cart, context) {
  const offers = [];
  const now = new Date();
  
  // Flash sale offers (limited time)
  const flashSaleProducts = getFlashSaleProducts();
  
  for (const product of flashSaleProducts) {
    if (!cart.items.find(item => item.productId === product.id)) {
      const timeRemaining = new Date(product.saleEnds) - now;
      const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
      
      if (hoursRemaining > 0 && hoursRemaining <= 24) {
        offers.push({
          type: 'flash_sale',
          productId: product.id,
          regularPrice: product.regularPrice,
          salePrice: product.salePrice,
          savings: product.regularPrice - product.salePrice,
          endsAt: product.saleEnds,
          hoursRemaining,
          urgency: hoursRemaining <= 6 ? 'high' : 'medium',
          reasoning: `Flash sale ends in ${hoursRemaining} hours!`
        });
      }
    }
  }
  
  // Cart-value based offers
  const cartValue = cart.currentValue || calculateCartValue(cart);
  
  if (cartValue >= 50 && cartValue < 100) {
    offers.push({
      type: 'value_bonus',
      threshold: 100,
      remaining: 100 - cartValue,
      reward: 'Free premium gift',
      urgency: 'medium',
      expiresIn: '2 hours',
      reasoning: `Spend ${formatCurrency(100 - cartValue)} more to get a free premium gift!`
    });
  }
  
  return offers;
}

/**
 * Predict final cart value using ML
 */
function predictFinalCartValue(cart, suggestions, context) {
  const currentValue = cart.currentValue || calculateCartValue(cart);
  
  // Historical conversion data
  const historicalData = getHistoricalConversionData(context.customerId);
  
  // Calculate probability of accepting each suggestion type
  const acceptanceProbabilities = {
    upsells: 0.15,
    crossSells: 0.25,
    bundleOffers: 0.30,
    freeShipping: 0.40,
    quantityDiscounts: 0.20,
    timeLimitedOffers: 0.35
  };
  
  // Adjust based on customer history
  if (historicalData) {
    acceptanceProbabilities.upsells *= historicalData.upsellAcceptanceRate || 1;
    acceptanceProbabilities.crossSells *= historicalData.crossSellAcceptanceRate || 1;
  }
  
  // Calculate expected value increase
  let expectedIncrease = 0;
  
  expectedIncrease += suggestions.upsells.reduce((sum, u) => 
    sum + (u.valueIncrease * acceptanceProbabilities.upsells), 0
  );
  
  expectedIncrease += suggestions.crossSells.reduce((sum, cs) => {
    const productValue = getProductPrice(cs.suggestedProduct);
    return sum + (productValue * acceptanceProbabilities.crossSells);
  }, 0);
  
  expectedIncrease += suggestions.bundleOffers.reduce((sum, b) => 
    sum + (b.savings * acceptanceProbabilities.bundleOffers), 0
  );
  
  return {
    predicted: currentValue + expectedIncrease,
    confidence: 0.75,
    upliftProbability: expectedIncrease > 0 ? 0.68 : 0,
    expectedIncrease
  };
}

/**
 * Abandoned cart recovery
 */
async function recoverAbandonedCart(cartId, strategy = 'standard') {
  const cart = abandonedCarts.get(cartId) || activeCarts.get(cartId);
  
  if (!cart) {
    throw new Error('Cart not found');
  }
  
  const timeSinceAbandonment = Date.now() - new Date(cart.lastUpdated).getTime();
  const hoursSinceAbandonment = timeSinceAbandonment / (1000 * 60 * 60);
  
  const recovery = {
    cartId,
    hoursSinceAbandonment,
    strategy,
    incentives: [],
    messaging: null,
    estimatedRecoveryProbability: 0
  };
  
  // Calculate recovery probability based on time
  const baseRecoveryRate = calculateBaseRecoveryRate(hoursSinceAbandonment);
  recovery.estimatedRecoveryProbability = baseRecoveryRate;
  
  // Generate recovery incentives
  if (strategy === 'aggressive') {
    // Offer discount
    const discountPercent = hoursSinceAbandonment < 24 ? 10 : 15;
    recovery.incentives.push({
      type: 'discount',
      value: discountPercent,
      code: generateDiscountCode(),
      expiresIn: '24 hours'
    });
    recovery.estimatedRecoveryProbability += 0.15;
  } else if (strategy === 'standard') {
    // Free shipping
    recovery.incentives.push({
      type: 'free_shipping',
      value: 8.99,
      expiresIn: '48 hours'
    });
    recovery.estimatedRecoveryProbability += 0.08;
  }
  
  // Add scarcity messaging if products are low stock
  const lowStockItems = cart.items.filter(item => {
    const stock = getProductStock(item.productId);
    return stock < 10;
  });
  
  if (lowStockItems.length > 0) {
    recovery.messaging = {
      type: 'scarcity',
      message: `${lowStockItems.length} item(s) in your cart are running low on stock!`,
      urgency: 'high'
    };
    recovery.estimatedRecoveryProbability += 0.10;
  }
  
  // Social proof
  recovery.messaging = recovery.messaging || {
    type: 'social_proof',
    message: `${Math.floor(Math.random() * 50 + 20)} people bought items from your cart in the last 24 hours`,
    urgency: 'medium'
  };
  
  // Cap probability at 95%
  recovery.estimatedRecoveryProbability = Math.min(0.95, recovery.estimatedRecoveryProbability);
  
  // Mark cart as in recovery
  if (!abandonedCarts.has(cartId)) {
    abandonedCarts.set(cartId, { ...cart, recoveryAttempts: [] });
  }
  
  abandonedCarts.get(cartId).recoveryAttempts.push({
    timestamp: new Date().toISOString(),
    strategy,
    incentives: recovery.incentives
  });
  
  return recovery;
}

/**
 * Get abandoned carts
 */
function getAbandonedCarts(filters = {}) {
  const abandoned = [];
  const now = new Date();
  const abandonmentThreshold = 30 * 60 * 1000; // 30 minutes
  
  for (const [cartId, cart] of activeCarts) {
    const timeSinceUpdate = now - new Date(cart.lastUpdated);
    
    if (timeSinceUpdate >= abandonmentThreshold) {
      const shouldInclude = (
        (!filters.minValue || cart.currentValue >= filters.minValue) &&
        (!filters.maxHoursSince || (timeSinceUpdate / (1000 * 60 * 60)) <= filters.maxHoursSince)
      );
      
      if (shouldInclude) {
        abandoned.push({
          ...cart,
          hoursSinceAbandonment: timeSinceUpdate / (1000 * 60 * 60),
          estimatedRecoveryProbability: calculateBaseRecoveryRate(timeSinceUpdate / (1000 * 60 * 60))
        });
      }
    }
  }
  
  return abandoned.sort((a, b) => b.currentValue - a.currentValue);
}

/**
 * Apply optimization rules
 */
function applyOptimizationRules(cart, suggestions) {
  const appliedRules = [];
  
  for (const [ruleId, rule] of optimizationRules) {
    if (!rule.active) continue;
    
    const matches = evaluateRuleCondition(rule.condition, cart);
    
    if (matches) {
      const action = executeRuleAction(rule.action, suggestions);
      appliedRules.push({
        ruleId,
        ruleName: rule.name,
        action: rule.action.type,
        result: action
      });
    }
  }
  
  return appliedRules;
}

/**
 * Helper Functions
 */

function calculateCartValue(cart) {
  return cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function findHigherValueAlternatives(productId, currentPrice) {
  // Placeholder: find similar products with higher price
  return [];
}

function calculateQuantityUpsell(item) {
  const quantityTiers = getQuantityTiers(item.productId);
  
  if (quantityTiers.length > 0 && item.quantity < quantityTiers[0].minQuantity) {
    const tier = quantityTiers[0];
    const additionalQuantity = tier.minQuantity - item.quantity;
    
    return {
      type: 'quantity',
      productId: item.productId,
      currentQuantity: 1,
      suggestedQuantity: tier.minQuantity,
      discountPercent: tier.discount * 100,
      savings: item.price * tier.minQuantity * tier.discount,
      reasoning: `Buy ${tier.minQuantity} and save ${tier.discount * 100}%`
    };
  }
  return null;
}

async function findCategoryUpsells(cart) {
  // Placeholder
  return [];
}

function calculateUpsellScore(upsell, cart, context) {
  let score = upsell.valueIncrease || 0;
  
  if (upsell.urgency === 'low_stock') score *= 1.3;
  if (upsell.percentIncrease && upsell.percentIncrease <= 30) score *= 1.2;
  
  return score;
}

function calculateCrossSellScore(cs, cart, context) {
  let score = cs.affinityScore || cs.score || 0.5;
  
  if (cs.confidence) score *= (1 + cs.confidence);
  if (cs.bundleDiscount) score *= 1.4;
  
  return score;
}

function calculateBundleDiscount(productA, productB) {
  // Placeholder
  return null;
}

function deduplicateSuggestions(suggestions) {
  const seen = new Set();
  return suggestions.filter(s => {
    const key = s.suggestedProduct;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function findRelevantBundles(cartProductIds) {
  // Placeholder
  return [];
}

function calculateBundleValue(bundle) {
  return bundle.products.reduce((sum, p) => sum + p.price, 0) * (1 - (bundle.discount?.value || 0) / 100);
}

function generateDynamicBundles(cart) {
  // Placeholder
  return [];
}

function findProductsForFreeShipping(remaining, cart) {
  // Placeholder: find products under $remaining
  return [];
}

function getQuantityTiers(productId) {
  // Placeholder
  return [
    { minQuantity: 3, discount: 0.10 },
    { minQuantity: 5, discount: 0.15 },
    { minQuantity: 10, discount: 0.20 }
  ];
}

function getFlashSaleProducts() {
  // Placeholder
  return [];
}

function getHistoricalConversionData(customerId) {
  // Placeholder
  return null;
}

function getProductPrice(productId) {
  // Placeholder
  return 29.99;
}

function calculateBaseRecoveryRate(hoursSince) {
  // Recovery probability decreases over time
  if (hoursSince < 1) return 0.65;
  if (hoursSince < 6) return 0.45;
  if (hoursSince < 24) return 0.30;
  if (hoursSince < 72) return 0.15;
  return 0.05;
}

function generateDiscountCode() {
  return `SAVE${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
}

function getProductStock(productId) {
  // Placeholder
  return 50;
}

function evaluateRuleCondition(condition, cart) {
  // Placeholder rule evaluation
  return false;
}

function executeRuleAction(action, suggestions) {
  // Placeholder action execution
  return { executed: true };
}

function estimateValueIncrease(suggestions) {
  let total = 0;
  
  total += suggestions.upsells.reduce((sum, u) => sum + (u.valueIncrease || 0), 0);
  // Simplified estimation
  
  return total;
}

function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

module.exports = {
  optimizeCart,
  generateUpsells,
  generateCrossSells,
  generateBundleOffers,
  calculateFreeShippingNudge,
  calculateQuantityDiscounts,
  generateTimeLimitedOffers,
  predictFinalCartValue,
  recoverAbandonedCart,
  getAbandonedCarts
};
