// Billing & Subscription API Routes
// Shopify native billing for Shopify merchants

const express = require('express');
const router = express.Router();
const shopifyBillingService = require('../core/shopifyBillingService');
const shopTokens = require('../core/shopTokens');
const creditLedger = require('../core/creditLedger');
const shopStore = require('../core/shopStore');

const SHOP_RE = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i;

// The shop comes from the verified session token or the OAuth cookie session. Anything the
// client sends (header, query, body) is only accepted in non-production, and never overrides
// an authenticated identity. No "only installed shop" or env fallbacks.
function resolveShop(req) {
  let verified = req.shopify && req.shopify.dest;
  if (verified) { try { verified = new URL(verified).hostname; } catch { /* bare domain */ } }
  const authed = verified || (req.session && req.session.shop) || null;
  const requested = req.body?.shop || req.query?.shop || req.headers['x-shopify-shop-domain'] || null;
  if (authed) {
    if (requested && String(requested).toLowerCase() !== String(authed).toLowerCase()) return null;
    return SHOP_RE.test(authed) ? String(authed).toLowerCase() : null;
  }
  if (process.env.NODE_ENV === 'production') return null;
  return requested && SHOP_RE.test(requested) ? String(requested).toLowerCase() : null;
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

    // Shopify's active subscription is the source of truth for the plan.
    // If Shopify shows a paid active plan, always honour it and sync the ledger
    // (the ledger file is ephemeral on Render and resets to 'free' on every deploy).
    const shopifyPlan = subscription.plan_id || 'free';
    try {
      const ledgerStatus = await creditLedger.getCreditStatus(shop);
      const ledgerPlan = ledgerStatus?.plan || 'free';
      if (shopifyPlan !== 'free' && subscription.status === 'active' && ledgerPlan !== shopifyPlan) {
        console.log(`[Billing] Resyncing plan for ${shop}: ledger=${ledgerPlan} → shopify=${shopifyPlan}`);
        await creditLedger.updatePlan(shop, shopifyPlan);
      } else if (shopifyPlan === 'free' && ledgerPlan !== 'free') {
        subscription.plan_id = ledgerPlan;
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
    const shop = resolveShop(req);
    if (!shop) return res.status(400).json({ ok: false, error: 'Shop required' });
    const s = await creditLedger.getCreditStatus(shop);
    res.json({
      ok: true,
      creditsUsed: Number(s.used) || 0,
      planCredits: Number(s.plan_credits) || 0,
      topupCredits: Number(s.topup_credits) || 0,
      lifetimeUsed: Number(s.lifetime_used) || 0,
      unlimited: !!s.unlimited,
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ ok: false, error: 'Could not load usage' });
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
      try { await creditLedger.updatePlan(shop, planId); } catch(e) { console.error('[Billing] updatePlan on subscribe failed:', e.message); }
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
    const shop = resolveShop(req);
    const { subscriptionId } = req.body;
    
    if (!shop) {
      return res.status(400).json({ error: 'Shop required' });
    }

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID required' });
    }

    const result = await shopifyBillingService.cancelSubscription(shop, subscriptionId);
    try { await creditLedger.updatePlan(shop, 'free'); } catch(e) { console.error('[Billing] updatePlan on cancel failed:', e.message); }
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
  // Public by necessity (Shopify redirects the browser here), so nothing in the query string is
  // trusted. Plans and credits are granted only from what Shopify itself reports for this shop.
  const { charge_id } = req.query;
  const shop = SHOP_RE.test(String(req.query.shop || '')) ? String(req.query.shop).toLowerCase() : null;
  let planGranted = null;

  if (shop && charge_id) {
    try {
      const sub = await shopifyBillingService.getSubscription(shop);
      if (sub.status === 'active' && sub.plan_id && sub.plan_id !== 'free') {
        await creditLedger.updatePlan(shop, sub.plan_id);
        planGranted = sub.plan_id;
      }
    } catch (e) { console.error('[Billing] plan sync failed:', e.message); }

    try {
      const paid = await shopifyBillingService.verifyCreditPackCharge(shop, charge_id);
      const done = shopStore.read('billing-charges', shop, []);
      if (paid && !done.includes(paid.chargeId)) {
        shopStore.write('billing-charges', shop, [paid.chargeId, ...done].slice(0, 500));
        await creditLedger.addTopupCredits(shop, paid.pack.credits, { source: 'shopify_confirm', charge_id: paid.chargeId });
      }
    } catch (e) { console.error('[Billing] credit grant failed:', e.message); }
  }

  if (charge_id && shop) {
    // Redirect back into the embedded app in Shopify Admin
    const storeHandle = shop.replace('.myshopify.com', '');
    const clientId = process.env.SHOPIFY_API_KEY || '98db68ecd4abcd07721d14949514de8a';
    const planParam = planGranted ? `&plan=${encodeURIComponent(planGranted)}` : '';
    return res.redirect(`https://admin.shopify.com/store/${storeHandle}/apps/${clientId}?billing=success${planParam}`);
  }

  if (charge_id) {
    return res.redirect('https://admin.shopify.com');
  }

  res.redirect('/');
});

/**
 * Re-sync the plan for the current shop from what Shopify reports (never from the client).
 * Called by the frontend after ?billing=success redirect.
 * POST /api/billing/sync-plan
 */
router.post('/sync-plan', async (req, res) => {
  try {
    const shop = resolveShop(req);
    if (!shop) return res.status(400).json({ ok: false, error: 'Shop required' });
    const sub = await shopifyBillingService.getSubscription(shop);
    // A failed lookup reports "free", so only an active paid subscription ever changes the plan.
    if (sub.status === 'active' && sub.plan_id && sub.plan_id !== 'free') {
      await creditLedger.updatePlan(shop, sub.plan_id);
    }
    const status = await creditLedger.getCreditStatus(shop);
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
    let status = await creditLedger.getCreditStatus(shop);

    // Self-heal: if ledger shows 'free' (wiped by a Render deploy), re-check Shopify
    if (status.plan === 'free') {
      try {
        const subscription = await shopifyBillingService.getSubscription(shop);
        if (subscription.plan_id && subscription.plan_id !== 'free' && subscription.status === 'active') {
          console.log(`[Billing] Auto-restoring plan for ${shop} from Shopify: ${subscription.plan_id}`);
          await creditLedger.updatePlan(shop, subscription.plan_id);
          status = await creditLedger.getCreditStatus(shop);
        }
      } catch (_) { /* non-fatal — return ledger status as-is */ }
    }

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
router.get('/credit-history', async (req, res) => {
  try {
    const shop = resolveShop(req);
    if (!shop) return res.json({ ok: true, transactions: [] });
    const account = await creditLedger.getShopAccount(shop);
    res.json({ ok: true, transactions: (account.transactions || account.recent_transactions || []).slice(-100).reverse() });
  } catch (error) {
    console.error('Credit history error:', error);
    res.json({ ok: true, transactions: [] });
  }
});

module.exports = router;
