// Credit-gate middleware for Express routes
// Checks if the requesting shop has enough credits before allowing AI actions.
//
// Usage in a route:
//   const { requireCredits } = require('../../core/creditMiddleware');
//   router.post('/generate', requireCredits('blog-draft'), async (req, res) => { ... });
//
// After the AI action completes, call req.deductCredits() to actually charge:
//   const result = await generateBlogDraft(req.body);
//   req.deductCredits();  // only charge if the action succeeded
//   res.json({ ok: true, ...result });

const creditLedger = require('./creditLedger');

/**
 * Resolve shop domain from request (matches billing.js pattern).
 */
function resolveShop(req) {
  return (
    req.session?.shop ||
    req.body?.shop ||
    req.query?.shop ||
    req.headers['x-shopify-shop-domain'] ||
    null
  );
}

/**
 * Express middleware factory.
 * @param {string} actionType - Key from ACTION_COSTS (e.g., 'blog-draft', 'seo-scan')
 * @param {object} [opts] - Options
 * @param {boolean} [opts.deductImmediately=false] - If true, deduct credits before handler runs
 * @returns {Function} Express middleware
 */
function requireCredits(actionType = 'generic-ai', opts = {}) {
  const { deductImmediately = false } = opts;

  return (req, res, next) => {
    const shop = resolveShop(req);
    if (!shop) {
      // No shop context — fail open in dev, block in prod
      if (process.env.NODE_ENV === 'production') {
        return res.status(400).json({
          ok: false,
          error: 'Shop context required for credit tracking',
          credit_error: true,
        });
      }
      // Dev mode: attach no-op deductCredits and continue
      req.creditCheck = { allowed: true, cost: 0, balance: 999999, unlimited: true };
      req.deductCredits = () => ({ ok: true, cost: 0, balance: 999999 });
      return next();
    }

    // Resolve model from request body or query — used for model-aware pricing
    const model = req.body?.model || req.query?.model || null;
    const check = creditLedger.checkCredits(shop, actionType, model);
    req.creditCheck = check;

    if (!check.allowed) {
      return res.status(402).json({
        ok: false,
        error: `Insufficient credits. This action costs ${check.cost} credit${check.cost !== 1 ? 's' : ''}, but you only have ${check.balance}. Purchase a credit top-up pack to continue.`,
        credit_error: true,
        credits_needed: check.cost,
        credits_available: check.balance,
      });
    }

    if (deductImmediately) {
      const result = creditLedger.deductCredits(shop, actionType, {
        tool: req.baseUrl || req.path,
        ip: req.ip,
        model,
      });
      req.creditDeduction = result;
      req.deductCredits = () => result; // no-op since already deducted
    } else {
      // Lazy deduction — call req.deductCredits() after successful AI action
      let deducted = false;
      req.deductCredits = (meta = {}) => {
        if (deducted) return req.creditDeduction; // idempotent
        deducted = true;
        // Allow overriding model at deduction time (if handler selects model dynamically)
        const effectiveModel = meta.model || model;
        const result = creditLedger.deductCredits(shop, actionType, {
          tool: req.baseUrl || req.path,
          model: effectiveModel,
          ...meta,
        });
        req.creditDeduction = result;
        return result;
      };
    }

    next();
  };
}

/**
 * Standalone function to deduct credits outside of middleware context.
 * Useful for background jobs, cron tasks, webhook handlers.
 * @param {string} shop - Shop domain
 * @param {string} actionType - Action type key
 * @param {object} [meta] - Optional metadata
 * @returns {{ ok: boolean, cost: number, balance: number, error?: string }}
 */
function deductCreditsForShop(shop, actionType, meta = {}) {
  return creditLedger.deductCredits(shop, actionType, meta);
}

/**
 * Check credits without deducting (for UI display).
 */
function checkCreditsForShop(shop, actionType) {
  return creditLedger.checkCredits(shop, actionType);
}

/**
 * Middleware that only checks / deducts credits on POST, PUT, or PATCH requests.
 * GET and other read-only methods pass through without credit cost.
 * Designed to be applied at the server.js route-registration level so every
 * mutating request to a tool route is automatically metered.
 *
 * Usage:
 *   app.use('/api/blog-draft-engine', requireCreditsOnMutation('blog-draft'), router);
 *
 * @param {string} actionType - Key from ACTION_COSTS
 * @param {object} [opts] - Same opts as requireCredits
 * @returns {Function} Express middleware
 */
function requireCreditsOnMutation(actionType = 'generic-ai', opts = {}) {
  const inner = requireCredits(actionType, opts);
  return (req, res, next) => {
    const method = (req.method || '').toUpperCase();
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      return inner(req, res, next);
    }
    // Read-only requests are free — attach a no-op deductCredits
    req.creditCheck = { allowed: true, cost: 0, balance: 999999, unlimited: true };
    req.deductCredits = () => ({ ok: true, cost: 0, balance: 999999 });
    next();
  };
}

module.exports = {
  requireCredits,
  requireCreditsOnMutation,
  deductCreditsForShop,
  checkCreditsForShop,
};
