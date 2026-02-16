/**
 * Usage Metering Engine
 * 
 * Tracks all billable events and calculates usage-based charges
 * Foundation for $150M+ usage-based revenue stream
 * 
 * Features:
 * - Real-time event tracking
 * - Aggregation by customer/period
 * - Tiered pricing calculations
 * - Overage alerts
 * - Integration with billing systems (Stripe metered billing)
 */

// In-memory storage (Replace with Redis/PostgreSQL in production)
const usageEvents = new Map(); // All events
const usageAggregates = new Map(); // Aggregated by customer/period
const usageAlerts = new Map(); // Alert thresholds

/**
 * Billable Event Types and Pricing
 */
const PRICING = {
  event_tracked: 0.001,              // $0.001 per event
  profile_enrichment: 0.10,          // $0.10 per enrichment call
  audience_activation: 50.00,        // $50 per activation
  ai_brief_generated: 0.05,          // $0.05 per AI brief
  segment_computation: 0.01,         // $0.01 per profile evaluated
  data_export: 0.0001,               // $0.0001 per record
  api_call: 0.00001,                 // $0.00001 per API call
  email_sent: 0.001,                 // $0.001 per email
  sms_sent: 0.01,                    // $0.01 per SMS
  webhook_delivery: 0.0001,          // $0.0001 per webhook
};

/**
 * Free Tier Limits
 */
const FREE_TIER_LIMITS = {
  event_tracked: 10000,              // 10K events/month free
  profile_enrichment: 100,           // 100 enrichments/month free
  audience_activation: 1,            // 1 activation/month free
  ai_brief_generated: 10,            // 10 briefs/month free
  segment_computation: 5000,         // 5K evals/month free
  data_export: 1000,                 // 1K records/month free
  api_call: 10000,                   // 10K API calls/month free
  email_sent: 1000,                  // 1K emails/month free
  sms_sent: 100,                     // 100 SMS/month free
  webhook_delivery: 1000,            // 1K webhooks/month free
};

/**
 * Track a billable event
 * 
 * @param {string} customerId - Customer identifier
 * @param {string} eventType - Type of billable event
 * @param {number} quantity - Quantity (default: 1)
 * @param {object} metadata - Additional context
 * @returns {object} Event record
 */
function trackUsageEvent(customerId, eventType, quantity = 1, metadata = {}) {
  if (!PRICING[eventType]) {
    throw new Error(`Unknown billable event type: ${eventType}`);
  }

  const event = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    customerId,
    eventType,
    quantity,
    unitPrice: PRICING[eventType],
    totalCost: PRICING[eventType] * quantity,
    timestamp: new Date().toISOString(),
    metadata,
  };

  // Store event
  if (!usageEvents.has(customerId)) {
    usageEvents.set(customerId, []);
  }
  usageEvents.get(customerId).push(event);

  // Update aggregates
  updateAggregates(customerId, eventType, quantity, event.totalCost);

  // Check alerts
  checkUsageAlerts(customerId, eventType);

  return event;
}

/**
 * Update usage aggregates for billing
 */
function updateAggregates(customerId, eventType, quantity, cost) {
  const period = getCurrentBillingPeriod();
  const key = `${customerId}_${period}`;

  if (!usageAggregates.has(key)) {
    usageAggregates.set(key, {
      customerId,
      period,
      usage: {},
      costs: {},
      totalCost: 0,
      updatedAt: new Date().toISOString(),
    });
  }

  const aggregate = usageAggregates.get(key);
  aggregate.usage[eventType] = (aggregate.usage[eventType] || 0) + quantity;
  aggregate.costs[eventType] = (aggregate.costs[eventType] || 0) + cost;
  aggregate.totalCost += cost;
  aggregate.updatedAt = new Date().toISOString();

  usageAggregates.set(key, aggregate);
}

/**
 * Get current billing period (YYYY-MM format)
 */
function getCurrentBillingPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get usage for a customer in a specific period
 * 
 * @param {string} customerId
 * @param {string} period - Optional, defaults to current period
 * @returns {object} Usage aggregate
 */
function getUsage(customerId, period = null) {
  period = period || getCurrentBillingPeriod();
  const key = `${customerId}_${period}`;
  
  return usageAggregates.get(key) || {
    customerId,
    period,
    usage: {},
    costs: {},
    totalCost: 0,
    updatedAt: null,
  };
}

/**
 * Calculate billable usage (after free tier)
 * 
 * @param {string} customerId
 * @param {string} tier - Customer's plan tier
 * @param {string} period - Billing period
 * @returns {object} Billable usage and cost
 */
function calculateBillableUsage(customerId, tier = 'free', period = null) {
  const usage = getUsage(customerId, period);
  const limits = tier === 'free' ? FREE_TIER_LIMITS : {};
  
  const billable = {
    customerId,
    period: usage.period,
    usage: {},
    billableQuantity: {},
    costs: {},
    totalCost: 0,
    freeTierSavings: 0,
  };

  // Calculate billable amounts after free tier
  for (const eventType in usage.usage) {
    const totalUsed = usage.usage[eventType];
    const freeLimit = limits[eventType] || 0;
    const billableQty = Math.max(0, totalUsed - freeLimit);
    const cost = billableQty * PRICING[eventType];
    const savings = Math.min(totalUsed, freeLimit) * PRICING[eventType];

    billable.usage[eventType] = totalUsed;
    billable.billableQuantity[eventType] = billableQty;
    billable.costs[eventType] = cost;
    billable.totalCost += cost;
    billable.freeTierSavings += savings;
  }

  return billable;
}

/**
 * Set usage alert threshold
 * 
 * @param {string} customerId
 * @param {string} eventType
 * @param {number} threshold - Alert when usage exceeds this
 * @param {function} callback - Function to call when threshold exceeded
 */
function setUsageAlert(customerId, eventType, threshold, callback) {
  const key = `${customerId}_${eventType}`;
  usageAlerts.set(key, { threshold, callback, triggered: false });
}

/**
 * Check if usage alert should be triggered
 */
function checkUsageAlerts(customerId, eventType) {
  const key = `${customerId}_${eventType}`;
  const alert = usageAlerts.get(key);
  
  if (!alert || alert.triggered) return;

  const usage = getUsage(customerId);
  const currentUsage = usage.usage[eventType] || 0;
  
  if (currentUsage >= alert.threshold) {
    alert.triggered = true;
    alert.callback({
      customerId,
      eventType,
      threshold: alert.threshold,
      currentUsage,
      cost: usage.costs[eventType],
    });
  }
}

/**
 * Generate usage invoice for Stripe
 * 
 * @param {string} customerId
 * @param {string} tier
 * @param {string} period
 * @returns {object} Invoice data for Stripe metered billing
 */
function generateUsageInvoice(customerId, tier, period = null) {
  const billable = calculateBillableUsage(customerId, tier, period);
  
  return {
    customerId,
    period: billable.period,
    lineItems: Object.keys(billable.costs)
      .filter(eventType => billable.costs[eventType] > 0)
      .map(eventType => ({
        description: formatEventTypeDescription(eventType),
        quantity: billable.billableQuantity[eventType],
        unitPrice: PRICING[eventType],
        amount: billable.costs[eventType],
        metadata: {
          eventType,
          totalUsage: billable.usage[eventType],
          billableUsage: billable.billableQuantity[eventType],
        },
      })),
    subtotal: billable.totalCost,
    tax: billable.totalCost * 0.0, // Add tax calculation if needed
    total: billable.totalCost,
    freeTierDiscount: billable.freeTierSavings,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Format event type for invoice display
 */
function formatEventTypeDescription(eventType) {
  const descriptions = {
    event_tracked: 'Event Tracking',
    profile_enrichment: 'Profile Enrichment',
    audience_activation: 'Audience Activation',
    ai_brief_generated: 'AI Content Briefs',
    segment_computation: 'Segment Computation',
    data_export: 'Data Export',
    api_call: 'API Calls',
    email_sent: 'Email Delivery',
    sms_sent: 'SMS Messages',
    webhook_delivery: 'Webhook Delivery',
  };
  return descriptions[eventType] || eventType;
}

/**
 * Get usage analytics for customer dashboard
 * 
 * @param {string} customerId
 * @returns {object} Usage analytics and trends
 */
function getUsageAnalytics(customerId) {
  const currentPeriod = getCurrentBillingPeriod();
  const lastPeriod = getPreviousPeriod(currentPeriod);
  
  const current = calculateBillableUsage(customerId, 'paid', currentPeriod);
  const previous = calculateBillableUsage(customerId, 'paid', lastPeriod);
  
  const analytics = {
    currentPeriod: {
      period: current.period,
      totalCost: current.totalCost,
      usage: current.usage,
    },
    previousPeriod: {
      period: previous.period,
      totalCost: previous.totalCost,
      usage: previous.usage,
    },
    trends: {},
    projectedMonthlySpend: projectMonthlySpend(customerId, current),
  };

  // Calculate trends
  for (const eventType in current.usage) {
    const currentUsage = current.usage[eventType] || 0;
    const previousUsage = previous.usage[eventType] || 0;
    const change = previousUsage > 0 
      ? ((currentUsage - previousUsage) / previousUsage * 100).toFixed(1)
      : 100;
    
    analytics.trends[eventType] = {
      current: currentUsage,
      previous: previousUsage,
      changePercent: parseFloat(change),
      direction: currentUsage > previousUsage ? 'up' : currentUsage < previousUsage ? 'down' : 'flat',
    };
  }

  return analytics;
}

/**
 * Project monthly spend based on current usage trajectory
 */
function projectMonthlySpend(customerId, currentUsage) {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const percentOfMonthElapsed = dayOfMonth / daysInMonth;
  
  const projectedCost = percentOfMonthElapsed > 0 
    ? currentUsage.totalCost / percentOfMonthElapsed
    : currentUsage.totalCost;

  return {
    current: currentUsage.totalCost,
    projected: Math.round(projectedCost * 100) / 100,
    daysRemaining: daysInMonth - dayOfMonth,
    onTrackFor: Math.round(projectedCost * 100) / 100,
  };
}

/**
 * Get previous billing period
 */
function getPreviousPeriod(period) {
  const [year, month] = period.split('-').map(Number);
  const prevDate = new Date(year, month - 2, 1); // month - 2 because months are 0-indexed
  return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Batch track usage events (for high-volume scenarios)
 * 
 * @param {Array} events - Array of {customerId, eventType, quantity, metadata}
 * @returns {Array} Created event records
 */
function trackUsageEventsBatch(events) {
  return events.map(({ customerId, eventType, quantity, metadata }) => 
    trackUsageEvent(customerId, eventType, quantity, metadata)
  );
}

/**
 * Get all usage for admin/analytics
 * 
 * @param {string} period
 * @returns {object} Aggregated usage across all customers
 */
function getAllUsage(period = null) {
  period = period || getCurrentBillingPeriod();
  
  const allCustomers = [];
  for (const [key, aggregate] of usageAggregates.entries()) {
    if (aggregate.period === period) {
      allCustomers.push(aggregate);
    }
  }

  const totals = {
    period,
    totalCustomers: allCustomers.length,
    totalRevenue: allCustomers.reduce((sum, a) => sum + a.totalCost, 0),
    usage: {},
    costs: {},
  };

  // Aggregate across all customers
  for (const customer of allCustomers) {
    for (const eventType in customer.usage) {
      totals.usage[eventType] = (totals.usage[eventType] || 0) + customer.usage[eventType];
      totals.costs[eventType] = (totals.costs[eventType] || 0) + customer.costs[eventType];
    }
  }

  return totals;
}

// Export functions
module.exports = {
  // Core tracking
  trackUsageEvent,
  trackUsageEventsBatch,
  
  // Retrieval
  getUsage,
  calculateBillableUsage,
  getUsageAnalytics,
  getAllUsage,
  
  // Billing
  generateUsageInvoice,
  
  // Alerts
  setUsageAlert,
  
  // Constants
  PRICING,
  FREE_TIER_LIMITS,
};
