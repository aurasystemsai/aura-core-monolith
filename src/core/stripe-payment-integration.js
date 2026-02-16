/**
 * Stripe Payment Integration
 * 
 * Handles payment processing for all revenue streams:
 * - Subscription billing (recurring)
 * - Usage-based metering (monthly arrears)
 * - One-time charges (data products, marketplace apps)
 * - Partner payouts (white-label, marketplace developers)
 * 
 * Stripe Products:
 * - Stripe Billing for subscriptions
 * - Stripe Billing Meters for usage
 * - Stripe Connect for marketplace payouts
 * - Stripe Invoicing
 */

// Would use actual Stripe SDK in production
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const revenueOrchestrator = require('./revenue-integration-orchestrator');
const tierManagementEngine = require('./tier-management-engine');
const usageMeteringEngine = require('./usage-metering-engine');

// In-memory storage (would use Stripe customer IDs in production)
const stripeCustomers = new Map();
const stripeSubscriptions = new Map();
const stripeInvoices = new Map();
const stripePaymentMethods = new Map();

/**
 * Create Stripe customer
 * 
 * Called during customer signup
 */
async function createStripeCustomer(customerId, customerData) {
  // In production:
  // const stripeCustomer = await stripe.customers.create({
  //   email: customerData.email,
  //   name: customerData.companyName,
  //   metadata: { auraCustomerId: customerId },
  // });
  
  const stripeCustomerId = `cus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const stripeCustomer = {
    id: stripeCustomerId,
    auraCustomerId: customerId,
    email: customerData.email,
    name: customerData.companyName,
    created: Math.floor(Date.now() / 1000),
  };
  
  stripeCustomers.set(customerId, stripeCustomer);
  return stripeCustomer;
}

/**
 * Create subscription in Stripe
 * 
 * @param {string} customerId - Aura customer ID
 * @param {string} tier - Pricing tier (free, starter, growth, pro, enterprise)
 * @param {object} options - Billing cycle, trial, etc.
 */
async function createStripeSubscription(customerId, tier, options = {}) {
  const stripeCustomer = stripeCustomers.get(customerId);
  if (!stripeCustomer) {
    throw new Error('Stripe customer not found. Call createStripeCustomer first.');
  }
  
  const tierConfig = tierManagementEngine.PRICING_TIERS[tier];
  if (!tierConfig) {
    throw new Error(`Invalid tier: ${tier}`);
  }
  
  // In production, would create Stripe Price IDs for each tier
  const stripePriceId = getStripePriceId(tier, options.billingCycle || 'monthly');
  
  // In production:
  // const subscription = await stripe.subscriptions.create({
  //   customer: stripeCustomer.id,
  //   items: [{ price: stripePriceId }],
  //   trial_period_days: options.trialDays || 14,
  //   billing_cycle_anchor_reset: 'now',
  //   metadata: {
  //     auraCustomerId: customerId,
  //     tier,
  //   },
  // });
  
  const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const subscription = {
    id: subscriptionId,
    customer: stripeCustomer.id,
    auraCustomerId: customerId,
    tier,
    status: options.trialDays ? 'trialing' : 'active',
    current_period_start: Math.floor(Date.now() / 1000),
    current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
    trial_end: options.trialDays ? Math.floor(Date.now() / 1000) + (options.trialDays * 24 * 60 * 60) : null,
    items: [{
      price: stripePriceId,
      quantity: 1,
    }],
    billingCycle: options.billingCycle || 'monthly',
  };
  
  stripeSubscriptions.set(subscriptionId, subscription);
  return subscription;
}

/**
 * Add usage-based metering to subscription
 * 
 * Uses Stripe Billing Meters to track consumption
 */
async function setupUsageMetering(customerId, subscriptionId) {
  // In production, would create Stripe meter for each usage type
  // Stripe automatically aggregates meter events and bills monthly
  
  // Example meter setup:
  // const meter = await stripe.billing.meters.create({
  //   display_name: 'Events Tracked',
  //   event_name: 'event_tracked',
  //   value_settings: {
  //     event_payload_key: 'count',
  //   },
  // });
  
  // Then create subscription item with meter:
  // await stripe.subscriptionItems.create({
  //   subscription: subscriptionId,
  //   price: 'price_events_tracked_metered',
  //   billing_thresholds: {
  //     usage_gte: 100000, // Alert at 100K events
  //   },
  // });
  
  return {
    meterSetup: 'complete',
    meters: [
      'event_tracked',
      'profile_enrichment',
      'audience_activation',
      'ai_brief_generated',
      'segment_computation',
      'data_export',
      'api_call',
      'email_sent',
      'sms_sent',
      'webhook_delivery',
    ],
  };
}

/**
 * Report usage to Stripe for metered billing
 * 
 * Called when CDP events occur
 */
async function reportUsageToStripe(customerId, eventType, quantity = 1) {
  const stripeCustomer = stripeCustomers.get(customerId);
  if (!stripeCustomer) return;
  
  // In production:
  // await stripe.billing.meterEvents.create({
  //   event_name: eventType,
  //   payload: {
  //     stripe_customer_id: stripeCustomer.id,
  //     value: quantity,
  //   },
  //   timestamp: Math.floor(Date.now() / 1000),
  // });
  
  console.log(`[Stripe] Reported ${quantity} ${eventType} events for customer ${customerId}`);
  
  return { reported: true };
}

/**
 * Generate monthly invoice
 * 
 * Combines subscription charges + usage metering
 */
async function generateStripeInvoice(customerId, period = null) {
  const stripeCustomer = stripeCustomers.get(customerId);
  if (!stripeCustomer) {
    throw new Error('Stripe customer not found');
  }
  
  // Get comprehensive invoice from orchestrator
  const invoice = await revenueOrchestrator.generateMonthlyInvoice(customerId, period);
  
  // In production, Stripe auto-generates invoices at billing cycle
  // But we can create custom invoice items for add-ons
  
  // Create invoice in Stripe
  // const stripeInvoice = await stripe.invoices.create({
  //   customer: stripeCustomer.id,
  //   auto_advance: true, // Auto-finalize and attempt payment
  //   collection_method: 'charge_automatically',
  //   metadata: {
  //     auraCustomerId: customerId,
  //     period: invoice.period,
  //   },
  // });
  
  // Add line items for non-subscription charges
  // for (const item of invoice.lineItems) {
  //   if (item.type !== 'subscription') {
  //     await stripe.invoiceItems.create({
  //       customer: stripeCustomer.id,
  //       invoice: stripeInvoice.id,
  //       amount: Math.round(item.amount * 100), // Convert to cents
  //       currency: 'usd',
  //       description: item.description,
  //     });
  //   }
  // }
  
  const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const stripeInvoice = {
    id: invoiceId,
    customer: stripeCustomer.id,
    auraCustomerId: customerId,
    period: invoice.period,
    lineItems: invoice.lineItems,
    subtotal: Math.round(invoice.subtotal * 100), // cents
    tax: Math.round(invoice.tax * 100),
    total: Math.round(invoice.total * 100),
    due_date: new Date(invoice.dueDate).getTime() / 1000,
    status: 'draft',
  };
  
  stripeInvoices.set(invoiceId, stripeInvoice);
  return stripeInvoice;
}

/**
 * Handle subscription upgrade/downgrade
 */
async function changeStripeSubscription(customerId, newTier, options = {}) {
  const subscription = Array.from(stripeSubscriptions.values())
    .find(s => s.auraCustomerId === customerId && s.status === 'active');
  
  if (!subscription) {
    throw new Error('No active subscription found');
  }
  
  const newPriceId = getStripePriceId(newTier, subscription.billingCycle);
  
  // In production:
  // const updated = await stripe.subscriptions.update(subscription.id, {
  //   items: [{
  //     id: subscription.items[0].id,
  //     price: newPriceId,
  //   }],
  //   proration_behavior: options.prorated ? 'create_prorations' : 'none',
  //   billing_cycle_anchor: options.prorated ? 'unchanged' : 'now',
  // });
  
  subscription.tier = newTier;
  subscription.items[0].price = newPriceId;
  subscription.updated = Math.floor(Date.now() / 1000);
  
  return subscription;
}

/**
 * Cancel subscription
 */
async function cancelStripeSubscription(customerId, options = {}) {
  const subscription = Array.from(stripeSubscriptions.values())
    .find(s => s.auraCustomerId === customerId && s.status === 'active');
  
  if (!subscription) {
    throw new Error('No active subscription found');
  }
  
  // In production:
  // const canceled = await stripe.subscriptions.cancel(subscription.id, {
  //   prorate: options.immediate ? false : true,
  //   invoice_now: options.immediate,
  // });
  
  subscription.status = options.immediate ? 'canceled' : 'scheduled_for_cancellation';
  subscription.cancel_at = options.immediate 
    ? Math.floor(Date.now() / 1000) 
    : subscription.current_period_end;
  
  return subscription;
}

/**
 * Add payment method
 */
async function addPaymentMethod(customerId, paymentMethodData) {
  const stripeCustomer = stripeCustomers.get(customerId);
  if (!stripeCustomer) {
    throw new Error('Stripe customer not found');
  }
  
  // In production:
  // const paymentMethod = await stripe.paymentMethods.attach(
  //   paymentMethodData.paymentMethodId,
  //   { customer: stripeCustomer.id }
  // );
  
  // Set as default
  // await stripe.customers.update(stripeCustomer.id, {
  //   invoice_settings: {
  //     default_payment_method: paymentMethod.id,
  //   },
  // });
  
  const paymentMethodId = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const paymentMethod = {
    id: paymentMethodId,
    customer: stripeCustomer.id,
    type: paymentMethodData.type || 'card',
    card: {
      brand: paymentMethodData.brand || 'visa',
      last4: paymentMethodData.last4 || '4242',
      exp_month: paymentMethodData.expMonth || 12,
      exp_year: paymentMethodData.expYear || 2028,
    },
  };
  
  stripePaymentMethods.set(paymentMethodId, paymentMethod);
  return paymentMethod;
}

/**
 * Setup Stripe Connect for marketplace developers
 * 
 * Allows developers to receive payouts directly
 */
async function createConnectedAccount(developerId, accountData) {
  // In production:
  // const account = await stripe.accounts.create({
  //   type: 'express', // Express onboarding
  //   country: accountData.country || 'US',
  //   email: accountData.email,
  //   capabilities: {
  //     transfers: { requested: true },
  //   },
  //   metadata: {
  //     auraDeveloperId: developerId,
  //   },
  // });
  
  // Create account link for onboarding
  // const accountLink = await stripe.accountLinks.create({
  //   account: account.id,
  //   refresh_url: 'https://aura.app/connect/refresh',
  //   return_url: 'https://aura.app/connect/success',
  //   type: 'account_onboarding',
  // });
  
  const accountId = `acct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    accountId,
    developerId,
    onboardingUrl: `https://connect.stripe.com/setup/${accountId}`,
    status: 'pending_verification',
  };
}

/**
 * Transfer funds to connected account (marketplace developer payout)
 */
async function transferToConnectedAccount(developerId, amount, description) {
  // In production:
  // const transfer = await stripe.transfers.create({
  //   amount: Math.round(amount * 100), // cents
  //   currency: 'usd',
  //   destination: connectedAccountId,
  //   transfer_group: `marketplace_payout_${Date.now()}`,
  //   metadata: {
  //     developerId,
  //     description,
  //   },
  // });
  
  return {
    transferId: `tr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    developerId,
    amount,
    description,
    status: 'pending',
    estimatedArrival: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
  };
}

/**
 * Handle webhook from Stripe
 * 
 * Webhooks notify us of payment events
 */
async function handleStripeWebhook(event) {
  switch (event.type) {
    case 'invoice.paid':
      // Subscription payment successful
      const invoice = event.data.object;
      console.log(`[Stripe] Invoice paid: ${invoice.id}`);
      // Would update internal billing records
      break;
    
    case 'invoice.payment_failed':
      // Payment failed
      const failedInvoice = event.data.object;
      console.log(`[Stripe] Payment failed: ${failedInvoice.id}`);
      // Would send dunning emails, retry payment
      break;
    
    case 'customer.subscription.updated':
      // Subscription changed
      const subscription = event.data.object;
      console.log(`[Stripe] Subscription updated: ${subscription.id}`);
      break;
    
    case 'customer.subscription.deleted':
      // Subscription canceled
      const deleted = event.data.object;
      console.log(`[Stripe] Subscription canceled: ${deleted.id}`);
      // Would downgrade customer to free tier
      break;
    
    case 'billing.meter.capture':
      // Usage meter event captured
      const meter = event.data.object;
      console.log(`[Stripe] Usage meter captured: ${meter.name}`);
      break;
    
    default:
      console.log(`[Stripe] Unhandled event type: ${event.type}`);
  }
  
  return { received: true };
}

/**
 * Get billing portal URL for customer self-service
 * 
 * Allows customers to update payment methods, view invoices, etc.
 */
async function createBillingPortalSession(customerId) {
  const stripeCustomer = stripeCustomers.get(customerId);
  if (!stripeCustomer) {
    throw new Error('Stripe customer not found');
  }
  
  // In production:
  // const session = await stripe.billingPortal.sessions.create({
  //   customer: stripeCustomer.id,
  //   return_url: 'https://app.aura.app/settings/billing',
  // });
  
  return {
    url: `https://billing.stripe.com/session/${stripeCustomer.id}`,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
  };
}

// Helper functions
function getStripePriceId(tier, billingCycle) {
  // In production, would return actual Stripe Price IDs
  // These are created once in Stripe Dashboard or via API
  
  const priceIds = {
    starter_monthly: 'price_starter_monthly_99',
    starter_annual: 'price_starter_annual_950',
    growth_monthly: 'price_growth_monthly_299',
    growth_annual: 'price_growth_annual_2870',
    pro_monthly: 'price_pro_monthly_799',
    pro_annual: 'price_pro_annual_7670',
    enterprise_monthly: 'price_enterprise_monthly_2999',
    enterprise_annual: 'price_enterprise_annual_28790',
  };
  
  return priceIds[`${tier}_${billingCycle}`] || priceIds[`${tier}_monthly`];
}

// Export
module.exports = {
  // Customer setup
  createStripeCustomer,
  addPaymentMethod,
  
  // Subscriptions
  createStripeSubscription,
  changeStripeSubscription,
  cancelStripeSubscription,
  
  // Usage metering
  setupUsageMetering,
  reportUsageToStripe,
  
  // Invoicing
  generateStripeInvoice,
  
  // Stripe Connect (marketplace)
  createConnectedAccount,
  transferToConnectedAccount,
  
  // Customer portal
  createBillingPortalSession,
  
  // Webhooks
  handleStripeWebhook,
};
