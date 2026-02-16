// Billing & Subscription API Routes
// Shopify native billing for Shopify merchants

const express = require('express');
const router = express.Router();
const shopifyBillingService = require('../core/shopifyBillingService');

/**
 * Get current subscription
 * GET /api/billing/subscription
 */
router.get('/subscription', async (req, res) => {
  try {
    const shop = req.session?.shop || req.query.shop;
    
    if (!shop) {
      return res.json({ plan_id: 'free', status: 'active' });
    }

    const subscription = await shopifyBillingService.getSubscription(shop);
    res.json(subscription);
  } catch (error) {
    console.error('Get subscription error:', error);
    res.json({ plan_id: 'free', status: 'active' });
  }
});

/**
 * Get payment method (Shopify handles payments)
 * GET /api/billing/payment-method
 */
router.get('/payment-method', async (req, res) => {
  // Shopify manages payment methods - return Shopify billing info
  res.json({ provider: 'shopify', message: 'Billing managed through Shopify' });
});

/**
 * Get invoices (Shopify handles invoices)
 * GET /api/billing/invoices
 */
router.get('/invoices', async (req, res) => {
  // Shopify manages invoices - they appear on merchant's Shopify bill
  res.json([]);
});

/**
 * Get usage statistics
 * GET /api/billing/usage
 */
router.get('/usage', async (req, res) => {
  try {
    const shop = req.session?.shop || req.query.shop;
    const usage = await shopifyBillingService.getUsageStats(shop);
    res.json(usage);
  } catch (error) {
    console.error('Get usage error:', error);
    res.json({ ai_runs: 0, products: 0, team_members: 1 });
  }
});

/**
 * Subscribe to a plan
 * POST /api/billing/subscribe
 */
router.post('/subscribe', async (req, res) => {
  try {
    const shop = req.session?.shop || req.body.shop;
    const { planId } = req.body;
    
    if (!shop) {
      return res.status(400).json({ error: 'Shop required. Please reconnect your Shopify store.' });
    }

    if (!planId) {
      return res.status(400).json({ error: 'Plan ID required' });
    }

    const result = await shopifyBillingService.createSubscription(shop, planId);
    res.json(result);
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: error.message || 'Failed to create subscription' });
  }
});

/**
 * Cancel subscription
 * POST /api/billing/cancel
 */
router.post('/cancel', async (req, res) => {
  try {
    const shop = req.session?.shop || req.body.shop;
    const { subscriptionId } = req.body;
    
    if (!shop) {
      return res.status(400).json({ error: 'Shop required' });
    }

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID required' });
    }

    const result = await shopifyBillingService.cancelSubscription(shop, subscriptionId);
    res.json(result);
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
  }
});

/**
 * Download invoice PDF (Shopify manages invoices)
 * GET /api/billing/invoices/:invoiceId/pdf
 */
router.get('/invoices/:invoiceId/pdf', async (req, res) => {
  // Shopify manages invoices - redirect to Shopify admin
  const shop = req.session?.shop;
  if (shop) {
    return res.redirect(`https://${shop}/admin/settings/billing`);
  }
  res.status(404).json({ error: 'Invoices managed through Shopify admin' });
});

/**
 * Billing confirmation callback from Shopify
 * GET /api/billing/confirm
 */
router.get('/confirm', async (req, res) => {
  const { charge_id } = req.query;
  const shop = req.session?.shop;
  
  if (charge_id) {
    // Redirect back to console with success message
    const consoleUrl = process.env.CONSOLE_URL || process.env.HOST_URL || 'http://localhost:5173';
    return res.redirect(`${consoleUrl}/?billing=success`);
  }
  
  res.redirect('/');
});

/**
 * Get available plans
 * GET /api/billing/plans
 */
router.get('/plans', async (req, res) => {
  const plans = shopifyBillingService.listPlans();
  res.json(plans);
});

module.exports = router;
