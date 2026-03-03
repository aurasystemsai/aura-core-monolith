// Billing & Subscription API Routes
// Shopify native billing for Shopify merchants

const express = require('express');
const router = express.Router();
const shopifyBillingService = require('../core/shopifyBillingService');
const shopTokens = require('../core/shopTokens');
const creditLedger = require('../core/creditLedger');

// Helper: resolve shop from request, falling back to single stored token
function resolveShop(req) {
  const explicit = req.session?.shop || req.body?.shop || req.query?.shop || req.headers['x-shopify-shop-domain'];
  if (explicit) return explicit;
  // Last resort: if only one shop is installed, use it
  try {
    const all = shopTokens.loadAll && shopTokens.loadAll();
    if (all && typeof all === 'object') {
      const shops = Object.keys(all);
      if (shops.length === 1) return shops[0];
    }
  } catch (_) {}
  return process.env.SHOPIFY_STORE_URL || null;
}

/**
 * Get current subscription
 * GET /api/billing/subscription
 */
router.get('/subscription', async (req, res) => {
  try {
    const shop = resolveShop(req);
    if (!shop) {
      return res.json({ plan_id: 'free', status: 'active' });
    }
    const subscription = await shopifyBillingService.getSubscription(shop);

    // The credit ledger is the authoritative plan source (updated on billing confirm + sync-plan).
    // Always prefer the ledger plan over what Shopify's GraphQL returns (Shopify may show an
    // old active subscription even after a downgrade or a failed cancellation).
    try {
      const ledgerStatus = creditLedger.getCreditStatus(shop);
      if (ledgerStatus && ledgerStatus.plan) {
        subscription.plan_id = ledgerStatus.plan;
      }
    } catch (_) {}

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
    const shop = req.session?.shop || req.query.shop || req.headers['x-shopify-shop-domain'];
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
    const shop = resolveShop(req);
    const { planId } = req.body;

    if (!shop) {
      return res.status(400).json({ error: 'Shop required. Please reconnect your Shopify store.' });
    }

    if (!planId) {
      return res.status(400).json({ error: 'Plan ID required' });
    }

    const result = await shopifyBillingService.createSubscription(shop, planId);

    // If the plan activated immediately (free plan / no Shopify redirect needed),
    // update the credit ledger right away so balance & plan display are correct.
    if (!result.confirmationUrl) {
      try { creditLedger.updatePlan(shop, planId); } catch(e) { console.error('[Billing] updatePlan on subscribe failed:', e.message); }
    }

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
    const shop = req.session?.shop || req.body.shop || req.headers['x-shopify-shop-domain'];
    const { subscriptionId } = req.body;
    
    if (!shop) {
      return res.status(400).json({ error: 'Shop required' });
    }

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID required' });
    }

    const result = await shopifyBillingService.cancelSubscription(shop, subscriptionId);
    // Downgrade ledger to free on cancellation
    try { creditLedger.updatePlan(shop, 'free'); } catch(e) { console.error('[Billing] updatePlan on cancel failed:', e.message); }
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
router.get('/confirm', (req, res) => {
  const { charge_id, shop: queryShop, plan, credits } = req.query;
  const shop = queryShop || req.session?.shop || req.headers['x-shopify-shop-domain'];

  if (shop) {
    // Activate plan credits in the ledger when a subscription is confirmed
    if (plan) {
      try { creditLedger.updatePlan(shop, plan); } catch(e) { console.error('[Billing] updatePlan failed:', e.message); }
    }
    // Activate top-up credits in the ledger when a one-time pack is confirmed
    if (credits) {
      const creditsNum = parseInt(credits, 10);
      if (!isNaN(creditsNum) && creditsNum > 0) {
        try { creditLedger.addTopupCredits(shop, creditsNum, { source: 'shopify_confirm', charge_id }); } catch(e) { console.error('[Billing] addTopupCredits failed:', e.message); }
      }
    }
  }

  if (charge_id && shop) {
    // Redirect back into the embedded app in Shopify Admin
    const storeHandle = shop.replace('.myshopify.com', '');
    const clientId = process.env.SHOPIFY_API_KEY || '98db68ecd4abcd07721d14949514de8a';
    const planParam = plan ? `&plan=${encodeURIComponent(plan)}` : '';
    return res.redirect(`https://admin.shopify.com/store/${storeHandle}/apps/${clientId}?billing=success${planParam}`);
  }

  if (charge_id) {
    return res.redirect('https://admin.shopify.com');
  }

  res.redirect('/');
});

/**
 * Manually sync / activate a plan for the current shop.
 * Called by the frontend after ?billing=success redirect, or by admin to fix broken accounts.
 * POST /api/billing/sync-plan
 */
router.post('/sync-plan', async (req, res) => {
  try {
    const shop = resolveShop(req);
    if (!shop) return res.status(400).json({ ok: false, error: 'Shop required' });
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ ok: false, error: 'planId required' });
    creditLedger.updatePlan(shop, planId);
    const status = creditLedger.getCreditStatus(shop);
    res.json({ ok: true, ...status });
  } catch (error) {
    console.error('sync-plan error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * Get available plans
 * GET /api/billing/plans
 */
router.get('/plans', async (req, res) => {
  const plans = shopifyBillingService.listPlans();
  res.json(plans);
});

/**
 * Get available credit top-up packs
 * GET /api/billing/credit-packs
 */
router.get('/credit-packs', (req, res) => {
  res.json({ ok: true, packs: shopifyBillingService.listCreditPacks() });
});

/**
 * Purchase a credit top-up pack (one-time Shopify charge)
 * POST /api/billing/purchase-credits
 */
router.post('/purchase-credits', async (req, res) => {
  try {
    const shop = resolveShop(req);
    const { packId } = req.body;

    if (!shop) {
      return res.status(400).json({ ok: false, error: 'Shop required. Please reconnect your Shopify store.' });
    }
    if (!packId) {
      return res.status(400).json({ ok: false, error: 'Credit pack ID required' });
    }

    const result = await shopifyBillingService.purchaseCreditPack(shop, packId);
    res.json({ ok: true, ...result });
  } catch (error) {
    console.error('Purchase credits error:', error);
    res.status(500).json({ ok: false, error: error.message || 'Failed to purchase credits' });
  }
});

/**
 * Get current credit balance
 * GET /api/billing/credits
 */
router.get('/credits', async (req, res) => {
  try {
    const shop = resolveShop(req);
    if (!shop) {
      return res.json({ ok: true, balance: 10, used: 0, plan_credits: 10, topup_credits: 0 });
    }
    const status = creditLedger.getCreditStatus(shop);
    res.json(status);
  } catch (error) {
    console.error('Get credits error:', error);
    res.json({ ok: true, balance: 10, used: 0, plan_credits: 10, topup_credits: 0 });
  }
});

/**
 * Get credit action costs (so the UI can show cost before confirming)
 * GET /api/billing/credit-costs
 * Optionally pass ?model=gpt-4 to see effective costs with model multiplier
 */
router.get('/credit-costs', (req, res) => {
  const model = req.query.model || null;
  if (model) {
    // Return effective costs (base × model multiplier)
    const effective = {};
    for (const [action, baseCost] of Object.entries(creditLedger.ACTION_COSTS)) {
      effective[action] = creditLedger.getEffectiveCost(action, model);
    }
    res.json({ ok: true, costs: effective, model, multiplier: creditLedger.MODEL_MULTIPLIERS[model] || 1, baseCosts: creditLedger.ACTION_COSTS });
  } else {
    res.json({ ok: true, costs: creditLedger.ACTION_COSTS, modelMultipliers: creditLedger.MODEL_MULTIPLIERS });
  }
});

/**
 * Get transaction history for a shop
 * GET /api/billing/credit-history
 */
router.get('/credit-history', (req, res) => {
  try {
    const shop = resolveShop(req);
    if (!shop) return res.json({ ok: true, transactions: [] });
    const account = creditLedger.getShopAccount(shop);
    res.json({ ok: true, transactions: (account.transactions || []).slice(-100).reverse() });
  } catch (error) {
    console.error('Credit history error:', error);
    res.json({ ok: true, transactions: [] });
  }
});

module.exports = router;
