/**
 * CART & CHECKOUT OPTIMIZATION ENGINE
 * Handles cart upsells, checkout cross-sells, abandoned cart recovery,
 * cart analytics, and conversion optimization
 */

// In-memory stores
const carts = new Map();
const abandonedCarts = new Map();
const checkoutUpsells = new Map();
const cartPerformance = new Map();
const recoverySequences = new Map();

// ================================================================
// CART MANAGEMENT
// ================================================================

function createCart({ customerId, sessionId }) {
  const id = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const cart = {
    id,
    customerId,
    sessionId,
    items: [],
    subtotal: 0,
    totalDiscount: 0,
    total: 0,
    appliedPromotions: [],
    recommendedProducts: [],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString()
  };
  
  carts.set(id, cart);
  return cart;
}

function getCart(id) {
  return carts.get(id) || null;
}

function addItemToCart(cartId, { productId, quantity, price }) {
  const cart = carts.get(cartId);
  if (!cart) return null;
  
  // Check if item already exists
  const existingItem = cart.items.find(item => item.productId === productId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ productId, quantity, price, addedAt: new Date().toISOString() });
  }
  
  recalculateCart(cart);
  cart.lastActivityAt = new Date().toISOString();
  carts.set(cartId, cart);
  
  // Trigger upsell recommendations
  updateCartRecommendations(cartId);
  
  return cart;
}

function removeItemFromCart(cartId, productId) {
  const cart = carts.get(cartId);
  if (!cart) return null;
  
  cart.items = cart.items.filter(item => item.productId !== productId);
  recalculateCart(cart);
  cart.lastActivityAt = new Date().toISOString();
  carts.set(cartId, cart);
  
  updateCartRecommendations(cartId);
  return cart;
}

function updateCartItemQuantity(cartId, productId, quantity) {
  const cart = carts.get(cartId);
  if (!cart) return null;
  
  const item = cart.items.find(i => i.productId === productId);
  if (item) {
    if (quantity <= 0) {
      return removeItemFromCart(cartId, productId);
    }
    item.quantity = quantity;
    recalculateCart(cart);
    cart.lastActivityAt = new Date().toISOString();
    carts.set(cartId, cart);
  }
  
  return cart;
}

function recalculateCart(cart) {
  cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Apply promotions/discounts
  let totalDiscount = 0;
  cart.appliedPromotions.forEach(promo => {
    if (promo.type === 'percentage') {
      totalDiscount += cart.subtotal * (promo.value / 100);
    } else if (promo.type === 'fixed') {
      totalDiscount += promo.value;
    }
  });
  
  cart.totalDiscount = totalDiscount;
  cart.total = Math.max(0, cart.subtotal - totalDiscount);
  cart.updatedAt = new Date().toISOString();
}

// ================================================================
// CART RECOMMENDATIONS & UPSELLS
// ================================================================

function updateCartRecommendations(cartId) {
  const cart = carts.get(cartId);
  if (!cart) return null;
  
  // Generate recommendations based on cart contents
  const recommendations = generateCartBasedRecommendations(cart);
  
  cart.recommendedProducts = recommendations;
  carts.set(cartId, cart);
  
  return recommendations;
}

function generateCartBasedRecommendations(cart) {
  const recommendations = [];
  
  // Strategy 1: Frequently bought together
  cart.items.forEach(item => {
    const together = getFrequentlyBoughtWith(item.productId);
    recommendations.push(...together);
  });
  
  // Strategy 2: Complete the set
  const completeSet = suggestCompleteTheSet(cart);
  recommendations.push(...completeSet);
  
  // Strategy 3: Premium alternatives (upsells)
  const premiumAlts = suggestPremiumAlternatives(cart);
  recommendations.push(...premiumAlts);
  
  // Deduplicate and score
  const unique = deduplicateRecommendations(recommendations);
  
  return unique.slice(0, 6); // Top 6 recommendations
}

function getFrequentlyBoughtWith(productId) {
  // Placeholder: In production, query purchase data
  return [
    { productId: `accessory_${productId}`, reason: 'Frequently bought together', score: 0.9 },
    { productId: `complement_${productId}`, reason: 'Customers also bought', score: 0.8 }
  ];
}

function suggestCompleteTheSet(cart) {
  // Find missing items from common product sets
  return [
    { productId: 'set_complete_1', reason: 'Complete the set', score: 0.85 }
  ];
}

function suggestPremiumAlternatives(cart) {
  // Suggest higher-priced alternatives for upselling
  return cart.items.map(item => ({
    productId: `premium_${item.productId}`,
    reason: 'Upgrade to premium',
    score: 0.75,
    priceDelta: 50
  }));
}

function deduplicateRecommendations(recs) {
  const seen = new Set();
  return recs
    .filter(r => {
      if (seen.has(r.productId)) return false;
      seen.add(r.productId);
      return true;
    })
    .sort((a, b) => b.score - a.score);
}

// ================================================================
// CHECKOUT OPTIMIZATION
// ================================================================

function createCheckoutUpsell({ trigger, products, position = 'checkout_page', priority = 1 }) {
  const id = `upsell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const upsell = {
    id,
    trigger, // 'cart_value', 'product_category', 'customer_segment'
    products,
    position, // 'checkout_page', 'payment_page', 'confirmation_page'
    priority,
    status: 'active',
    performance: {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0
    },
    createdAt: new Date().toISOString()
  };
  
  checkoutUpsells.set(id, upsell);
  return upsell;
}

function getCheckoutUpsells({ cartId, position }) {
  const cart = carts.get(cartId);
  if (!cart) return [];
  
  // Find applicable upsells
  const applicable = Array.from(checkoutUpsells.values())
    .filter(u => u.status === 'active')
    .filter(u => !position || u.position === position)
    .filter(u => evaluateUpsellTrigger(u, cart))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);
  
  return applicable;
}

function evaluateUpsellTrigger(upsell, cart) {
  const { trigger } = upsell;
  
  if (trigger.type === 'cart_value') {
    return cart.total >= (trigger.minValue || 0) && cart.total <= (trigger.maxValue || Infinity);
  }
  
  if (trigger.type === 'product_category') {
    return cart.items.some(item => trigger.categories.includes(item.category));
  }
  
  if (trigger.type === 'customer_segment') {
    const customer = getCustomer(cart.customerId);
    return customer && customer.segments.some(s => trigger.segments.includes(s));
  }
  
  return true;
}

function trackUpsellImpression(upsellId) {
  const upsell = checkoutUpsells.get(upsellId);
  if (upsell) {
    upsell.performance.impressions += 1;
    checkoutUpsells.set(upsellId, upsell);
  }
}

function trackUpsellClick(upsellId) {
  const upsell = checkoutUpsells.get(upsellId);
  if (upsell) {
    upsell.performance.clicks += 1;
    checkoutUpsells.set(upsellId, upsell);
  }
}

function trackUpsellConversion(upsellId, revenue) {
  const upsell = checkoutUpsells.get(upsellId);
  if (upsell) {
    upsell.performance.conversions += 1;
    upsell.performance.revenue += revenue;
    checkoutUpsells.set(upsellId, upsell);
  }
}

// ================================================================
// ABANDONED CART RECOVERY
// ================================================================

function markCartAsAbandoned(cartId) {
  const cart = carts.get(cartId);
  if (!cart) return null;
  
  cart.status = 'abandoned';
  const abandonedAt = new Date().toISOString();
  
  const abandoned = {
    ...cart,
    abandonedAt,
    recoveryAttempts: 0,
    recovered: false
  };
  
  abandondCarts.set(cartId, abandoned);
  carts.set(cartId, cart);
  
  // Schedule recovery sequence
  scheduleRecoverySequence(cartId);
  
  return abandoned;
}

function scheduleRecoverySequence(cartId) {
  const cart = abandonedCarts.get(cartId);
  if (!cart) return;
  
  const sequence = {
    cartId,
    steps: [
      { delay: 1, channel: 'email', template: 'abandoned_cart_1h', status: 'pending' },
      { delay: 24, channel: 'email', template: 'abandoned_cart_24h', status: 'pending' },
      { delay: 72, channel: 'sms', template: 'abandoned_cart_3d', status: 'pending' }
    ],
    createdAt: new Date().toISOString()
  };
  
  recoverySequences.set(cartId, sequence);
}

function executeRecoveryStep(cartId, stepIndex) {
  const sequence = recoverySequences.get(cartId);
  const cart = abandonedCarts.get(cartId);
  
  if (!sequence || !cart || stepIndex >= sequence.steps.length) {
    return null;
  }
  
  const step = sequence.steps[stepIndex];
  
  // Send recovery message
  const message = composeRecoveryMessage(cart, step.template);
  
  step.status = 'sent';
  step.sentAt = new Date().toISOString();
  
  recoverySequences.set(cartId, sequence);
  
  cart.recoveryAttempts += 1;
  abandonedCarts.set(cartId, cart);
  
  return { message, step };
}

function composeRecoveryMessage(cart, template) {
  const messages = {
    'abandoned_cart_1h': {
      subject: 'You left something behind!',
      body: `Complete your purchase and save ${cart.totalDiscount > 0 ? `$${cart.totalDiscount}` : '10%'}`
    },
    'abandoned_cart_24h': {
      subject: 'Still interested? Extra 10% off!',
      body: `Your cart is waiting with an extra discount`
    },
    'abandoned_cart_3d': {
      subject: 'Last chance - Your cart expires soon',
      body: `Don't miss out! Complete your order now`
    }
  };
  
  return messages[template] || messages['abandoned_cart_1h'];
}

function markCartAsRecovered(cartId) {
  const cart = abandonedCarts.get(cartId);
  if (cart) {
    cart.recovered = true;
    cart.recoveredAt = new Date().toISOString();
    abandonedCarts.set(cartId, cart);
  }
  
  return cart;
}

function getAbandonedCarts({ limit = 100, daysAgo = 7 }) {
  const cutoff = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  
  return Array.from(abandonedCarts.values())
    .filter(cart => new Date(cart.abandonedAt) > cutoff)
    .sort((a, b) => new Date(b.abandonedAt) - new Date(a.abandonedAt))
    .slice(0, limit);
}

function getRecoveryPerformance() {
  const abandoned = Array.from(abandonedCarts.values());
  const total = abandoned.length;
  const recovered = abandoned.filter(c => c.recovered).length;
  const recoveryRate = total > 0 ? (recovered / total) * 100 : 0;
  
  const totalValue = abandoned.reduce((sum, c) => sum + c.total, 0);
  const recoveredValue = abandoned.filter(c => c.recovered).reduce((sum, c) => sum + c.total, 0);
  
  return {
    totalAbandoned: total,
    recovered,
    recoveryRate,
    totalValue,
    recoveredValue,
    lostValue: totalValue - recoveredValue
  };
}

// ================================================================
// CART ANALYTICS
// ================================================================

function trackCartMetrics(cartId, event) {
  const cart = carts.get(cartId);
  if (!cart) return;
  
  let metrics = cartPerformance.get(cartId) || {
    cartId,
    events: [],
    timeToCheckout: 0,
    recommendationsShown: 0,
    recommendationsClicked: 0,
    upsellsAccepted: 0
  };
  
  metrics.events.push({
    type: event.type,
    timestamp: new Date().toISOString(),
    data: event.data
  });
  
  cartPerformance.set(cartId, metrics);
}

function getCartAnalytics({ period = '7d' }) {
  const periodCarts = Array.from(carts.values())
    .filter(c => isWithinPeriod(c.createdAt, period));
  
  const totalCarts = periodCarts.length;
  const completedCarts = periodCarts.filter(c => c.status === 'completed').length;
  const abandonedCartsCount = periodCarts.filter(c => c.status === 'abandoned').length;
  
  const avgCartValue = periodCarts.reduce((sum, c) => sum + c.total, 0) / totalCarts || 0;
  const conversionRate = totalCarts > 0 ? (completedCarts / totalCarts) * 100 : 0;
  const abandonmentRate = totalCarts > 0 ? (abandonedCartsCount / totalCarts) * 100 : 0;
  
  return {
    period,
    totalCarts,
    completedCarts,
    abandonedCarts: abandonedCartsCount,
    avgCartValue,
    conversionRate,
    abandonmentRate
  };
}

function getTopCartProducts({ period = '30d', limit = 10 }) {
  const periodCarts = Array.from(carts.values())
    .filter(c => isWithinPeriod(c.createdAt, period));
  
  const productCounts = new Map();
  
  periodCarts.forEach(cart => {
    cart.items.forEach(item => {
      const count = productCounts.get(item.productId) || { count: 0, revenue: 0 };
      count.count += item.quantity;
      count.revenue += item.price * item.quantity;
      productCounts.set(item.productId, count);
    });
  });
  
  return Array.from(productCounts.entries())
    .map(([productId, data]) => ({ productId, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function isWithinPeriod(dateString, period) {
  const date = new Date(dateString);
  const now = new Date();
  const match = period.match(/^(\d+)([dwmy])$/);
  
  if (!match) return true;
  
  const [, amount, unit] = match;
  const units = { d: 1, w: 7, m: 30, y: 365 };
  const days = parseInt(amount) * (units[unit] || 1);
  const cutoff = new Date(now - days * 24 * 60 * 60 * 1000);
  
  return date > cutoff;
}

function getCustomer(customerId) {
  // Placeholder
  return { id: customerId, segments: [] };
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Cart Management
  createCart,
  getCart,
  addItemToCart,
  removeItemFromCart,
  updateCartItemQuantity,
  
  // Recommendations
  updateCartRecommendations,
  generateCartBasedRecommendations,
  
  // Checkout Upsells
  createCheckoutUpsell,
  getCheckoutUpsells,
  trackUpsellImpression,
  trackUpsellClick,
  trackUpsellConversion,
  
  // Abandoned Cart Recovery
  markCartAsAbandoned,
  executeRecoveryStep,
  markCartAsRecovered,
  getAbandonedCarts,
  getRecoveryPerformance,
  
  // Analytics
  trackCartMetrics,
  getCartAnalytics,
  getTopCartProducts,
  
  // Data stores
  carts,
  abandonedCarts,
  checkoutUpsells,
  recoverySequences
};
