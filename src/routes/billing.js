// Billing & Subscription API Routes
// Stripe integration for subscription management

const express = require('express');
const router = express.Router();
const stripeRevenueService = require('../core/stripeRevenueService');

/**
 * Get current subscription
 * GET /api/billing/subscription
 */
router.get('/subscription', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // If Stripe not configured, return free plan
    if (!stripeRevenueService.enabled) {
      return res.json({ plan_id: 'free', status: 'active' });
    }

    const subscription = await stripeRevenueService.getCustomerSubscription(userId);
    res.json(subscription || { plan_id: 'free', status: 'active' });
  } catch (error) {
    console.error('Get subscription error:', error);
    // Fallback to free plan on error
    res.json({ plan_id: 'free', status: 'active' });
  }
});

/**
 * Get payment method
 * GET /api/billing/payment-method
 */
router.get('/payment-method', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!stripeRevenueService.enabled) {
      return res.json(null);
    }

    const paymentMethod = await stripeRevenueService.getCustomerPaymentMethod(userId);
    res.json(paymentMethod);
  } catch (error) {
    console.error('Get payment method error:', error);
    res.json(null);
  }
});

/**
 * Get invoices
 * GET /api/billing/invoices
 */
router.get('/invoices', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!stripeRevenueService.enabled) {
      return res.json([]);
    }

    const invoices = await stripeRevenueService.getCustomerInvoices(userId);
    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.json([]);
  }
});

/**
 * Get usage statistics
 * GET /api/billing/usage
 */
router.get('/usage', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!stripeRevenueService.enabled) {
      return res.json({ ai_runs: 0, products: 0, team_members: 1 });
    }

    const usage = await stripeRevenueService.getUsageStats(userId);
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
    const userId = req.user?.id || req.session?.userId;
    const { planId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!planId) {
      return res.status(400).json({ error: 'Plan ID required' });
    }

    if (!stripeRevenueService.enabled) {
      return res.status(503).json({ error: 'Billing not configured. Contact support.' });
    }

    const result = await stripeRevenueService.createOrUpdateSubscription(userId, planId);
    res.json(result);
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

/**
 * Cancel subscription
 * POST /api/billing/cancel
 */
router.post('/cancel', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!stripeRevenueService.enabled) {
      return res.json({ success: true, message: 'No active subscription' });
    }

    await stripeRevenueService.cancelSubscription(userId);
    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

/**
 * Download invoice PDF
 * GET /api/billing/invoices/:invoiceId/pdf
 */
router.get('/invoices/:invoiceId/pdf', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    const { invoiceId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!stripeRevenueService.enabled) {
      return res.status(503).json({ error: 'Billing not configured' });
    }

    const pdfBuffer = await stripeRevenueService.generateInvoicePDF(invoiceId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceId}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({ error: 'Failed to download invoice' });
  }
});

module.exports = router;
