/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events for payment processing:
 * - invoice.paid → activate subscription
 * - invoice.payment_failed → suspend account
 * - customer.subscription.updated → sync tier changes
 * - customer.subscription.deleted → cancel subscription
 * - checkout.session.completed → provision new customer
 */

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const tierManagement = require('../core/tier-management-engine');
const revenueOrchestrator = require('../core/revenue-integration-orchestrator');
const usageMetering = require('../core/usage-metering-engine');

// Stripe webhook signature verification
const verifyStripeWebhook = (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      endpointSecret
    );
    
    req.stripeEvent = event;
    next();
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

/**
 * POST /webhooks/stripe
 * Handle Stripe webhook events
 */
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), verifyStripeWebhook, async (req, res) => {
  const event = req.stripeEvent;
  
  console.log(`Received Stripe webhook: ${event.type}`);
  
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
        
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'customer.deleted':
        await handleCustomerDeleted(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle checkout.session.completed
 * Provision new customer after successful checkout
 */
async function handleCheckoutCompleted(session) {
  console.log('Checkout completed:', session.id);
  
  const customerId = session.client_reference_id;
  const stripeCustomerId = session.customer;
  const subscriptionId = session.subscription;
  
  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0].price.id;
  
  // Map Stripe price ID to tier
  const tier = mapPriceIdToTier(priceId);
  
  // Initialize customer revenue infrastructure
  await revenueOrchestrator.initializeCustomerRevenue(customerId, {
    tier,
    billingCycle: subscription.items.data[0].price.recurring.interval === 'year' ? 'annual' : 'monthly',
    stripeCustomerId,
    stripeSubscriptionId: subscriptionId,
    email: session.customer_email,
  });
  
  console.log(`Provisioned customer ${customerId} with tier ${tier}`);
}

/**
 * Handle invoice.paid
 * Activate/renew subscription on successful payment
 */
async function handleInvoicePaid(invoice) {
  console.log('Invoice paid:', invoice.id);
  
  const customerId = getCustomerIdFromStripeCustomer(invoice.customer);
  if (!customerId) {
    console.error('No customer ID found for Stripe customer:', invoice.customer);
    return;
  }
  
  // Ensure subscription is active
  const subscription = tierManagement.getSubscription(customerId);
  if (subscription && subscription.status !== 'active') {
    subscription.status = 'active';
    subscription.nextBillingDate = new Date(invoice.period_end * 1000);
    subscription.lastPaymentDate = new Date();
    
    console.log(`Activated subscription for customer ${customerId}`);
  }
  
  // Track usage that was billed
  if (invoice.lines && invoice.lines.data) {
    for (const line of invoice.lines.data) {
      if (line.type === 'subscription') {
        // Record subscription payment
        console.log(`Subscription payment: ${line.amount / 100} ${line.currency}`);
      } else if (line.metadata && line.metadata.usage_event_type) {
        // Record usage payment
        console.log(`Usage payment: ${line.metadata.usage_event_type} - ${line.amount / 100} ${line.currency}`);
      }
    }
  }
}

/**
 * Handle invoice.payment_failed
 * Suspend account after failed payment
 */
async function handlePaymentFailed(invoice) {
  console.log('Payment failed:', invoice.id);
  
  const customerId = getCustomerIdFromStripeCustomer(invoice.customer);
  if (!customerId) {
    console.error('No customer ID found for Stripe customer:', invoice.customer);
    return;
  }
  
  const subscription = tierManagement.getSubscription(customerId);
  if (!subscription) return;
  
  // Increment failure count
  subscription.paymentFailures = (subscription.paymentFailures || 0) + 1;
  
  // Suspend after 3 failed payments
  if (subscription.paymentFailures >= 3) {
    subscription.status = 'suspended';
    console.log(`Suspended subscription for customer ${customerId} after 3 payment failures`);
    
    // TODO: Send suspension email
    // TODO: Disable feature access
  } else {
    console.log(`Payment failure ${subscription.paymentFailures}/3 for customer ${customerId}`);
    // TODO: Send dunning email
  }
}

/**
 * Handle customer.subscription.created
 * Initialize subscription in our system
 */
async function handleSubscriptionCreated(subscription) {
  console.log('Subscription created:', subscription.id);
  
  const customerId = getCustomerIdFromStripeCustomer(subscription.customer);
  if (!customerId) {
    console.error('No customer ID found for Stripe customer:', subscription.customer);
    return;
  }
  
  const priceId = subscription.items.data[0].price.id;
  const tier = mapPriceIdToTier(priceId);
  const billingCycle = subscription.items.data[0].price.recurring.interval === 'year' ? 'annual' : 'monthly';
  
  // Create subscription if it doesn't exist
  let existingSubscription = tierManagement.getSubscription(customerId);
  if (!existingSubscription) {
    tierManagement.createSubscription(customerId, tier, billingCycle);
    console.log(`Created subscription for customer ${customerId}: ${tier} ${billingCycle}`);
  }
}

/**
 * Handle customer.subscription.updated
 * Sync tier changes from Stripe
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('Subscription updated:', subscription.id);
  
  const customerId = getCustomerIdFromStripeCustomer(subscription.customer);
  if (!customerId) return;
  
  const priceId = subscription.items.data[0].price.id;
  const newTier = mapPriceIdToTier(priceId);
  
  const existingSubscription = tierManagement.getSubscription(customerId);
  if (!existingSubscription) return;
  
  // Update tier if changed
  if (existingSubscription.tier !== newTier) {
    await revenueOrchestrator.handleCustomerUpgrade(customerId, newTier);
    console.log(`Updated customer ${customerId} tier: ${existingSubscription.tier} → ${newTier}`);
  }
  
  // Update status
  const statusMap = {
    'active': 'active',
    'past_due': 'past_due',
    'unpaid': 'suspended',
    'canceled': 'canceled',
    'incomplete': 'trial',
    'incomplete_expired': 'canceled',
    'trialing': 'trial',
  };
  
  existingSubscription.status = statusMap[subscription.status] || 'active';
}

/**
 * Handle customer.subscription.deleted
 * Cancel subscription in our system
 */
async function handleSubscriptionDeleted(subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  const customerId = getCustomerIdFromStripeCustomer(subscription.customer);
  if (!customerId) return;
  
  tierManagement.cancelSubscription(customerId, 'stripe_cancellation');
  console.log(`Canceled subscription for customer ${customerId}`);
  
  // TODO: Send cancellation confirmation email
  // TODO: Schedule data export
  // TODO: Disable feature access
}

/**
 * Handle customer.deleted
 * Archive customer data
 */
async function handleCustomerDeleted(customer) {
  console.log('Customer deleted:', customer.id);
  
  const customerId = getCustomerIdFromStripeCustomer(customer.id);
  if (!customerId) return;
  
  // Archive subscription
  const subscription = tierManagement.getSubscription(customerId);
  if (subscription) {
    subscription.status = 'deleted';
    subscription.deletedAt = new Date();
  }
  
  // Archive usage data
  usageMetering.archiveUsage(customerId);
  
  console.log(`Archived data for deleted customer ${customerId}`);
}

/**
 * Map Stripe price ID to tier
 */
function mapPriceIdToTier(priceId) {
  const priceMap = {
    // Monthly
    'price_starter_monthly': 'starter',
    'price_growth_monthly': 'growth',
    'price_pro_monthly': 'pro',
    'price_enterprise_monthly': 'enterprise',
    
    // Annual
    'price_starter_annual': 'starter',
    'price_growth_annual': 'growth',
    'price_pro_annual': 'pro',
    'price_enterprise_annual': 'enterprise',
  };
  
  return priceMap[priceId] || 'starter';
}

/**
 * Get our customer ID from Stripe customer ID
 * (In production, this would query a database)
 */
function getCustomerIdFromStripeCustomer(stripeCustomerId) {
  // TODO: Implement database lookup
  // For now, return a placeholder
  return `customer_from_stripe_${stripeCustomerId}`;
}

module.exports = router;
