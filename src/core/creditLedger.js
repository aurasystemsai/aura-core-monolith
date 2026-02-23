// Credit Ledger — persistent, file-based credit tracking per shop
// Each shop has: plan_credits (reset monthly), topup_credits (never expire), used_this_period
//
// Architecture:
//   1 AURA credit ≈ 1 lightweight AI action (SEO scan, alt-text, single generation)
//   Heavy actions (blog draft, full analysis) cost 2-5 credits
//   OpenAI token cost is abstracted — we eat the difference on margin
//
// Credit cost mapping (per action type) — BASE costs assume cheapest model (gpt-4o-mini):
//   seo-scan:          1 credit   (~500 tokens, cost ~$0.002)
//   alt-text:          1 credit   (~200 tokens, cost ~$0.001)
//   blog-draft:        3 credits  (~2000 tokens, cost ~$0.008)
//   email-gen:         2 credits  (~800 tokens, cost ~$0.004)
//   social-post:       1 credit   (~400 tokens, cost ~$0.002)
//   competitive-report:5 credits  (~3000 tokens, cost ~$0.015)
//   support-reply:     1 credit   (~600 tokens, cost ~$0.003)
//   link-suggestion:   1 credit   (~300 tokens, cost ~$0.001)
//   generic-ai:        1 credit   (default for unlisted actions)
//
// Model multipliers:
//   gpt-4o-mini / gpt-4.1-mini / gpt-5-mini  → 1x  (base, cheapest)
//   gpt-4o / gpt-4.1                         → 2x
//   gpt-4 / gpt-4-turbo                      → 3x
//   gpt-5.2 / o1 / o3                        → 5x  (reasoning models)
//
//   Example: blog-draft (3 base) × gpt-4 (3x) = 9 credits
//
// Pricing margin:
//   500 credits = $9  → $0.018/credit → ~9x markup on GPT-4.1-mini cost
//   This covers: compute, bandwidth, storage, support, and profit margin.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const LEDGER_FILE = path.join(DATA_DIR, 'credit-ledger.json');

// Credit costs per action type
const ACTION_COSTS = {
  'seo-scan':            1,
  'seo-analysis':        1,
  'alt-text':            1,
  'image-alt':           1,
  'blog-draft':          3,
  'blog-outline':        2,
  'content-brief':       2,
  'email-gen':           2,
  'email-template':      2,
  'social-post':         1,
  'social-schedule':     1,
  'link-suggestion':     1,
  'internal-link':       1,
  'competitive-report':  5,
  'competitive-analysis':5,
  'support-reply':       1,
  'ai-support':          1,
  'product-description': 2,
  'schema-gen':          1,
  'keyword-research':    2,
  'rank-check':          1,
  'churn-predict':       2,
  'pricing-optimize':    2,
  'ad-copy':             2,
  'campaign-gen':        3,
  'analytics-insight':   2,
  'segmentation':        2,
  'personalization':     2,
  'fix-queue-item':      1,   // single SEO fix
  'generic-ai':          1,   // catch-all
};

// Model-based credit multipliers.
// Different OpenAI models have vastly different costs — a gpt-4 call
// costs ~15x more than gpt-4o-mini. The multiplier adjusts the base
// ACTION_COSTS to reflect actual API spend.
const MODEL_MULTIPLIERS = {
  // Tier 1 — cheapest (1x base)
  'gpt-4o-mini':      1,
  'gpt-4.1-mini':     1,
  'gpt-4.1-nano':     1,
  'gpt-5-mini':       1,
  // Tier 2 — mid-range (2x base)
  'gpt-4o':           2,
  'gpt-4.1':          2,
  'gpt-4-turbo':      2,
  'gpt-4-turbo-preview': 2,
  // Tier 3 — premium (3x base)
  'gpt-4':            3,
  'gpt-5':            3,
  // Tier 4 — reasoning / frontier (5x base)
  'gpt-5.2':          5,
  'o1':               5,
  'o1-mini':          3,
  'o3':               5,
  'o3-mini':          3,
  'o4-mini':          3,
};

/**
 * Get the effective credit cost for an action + model combination.
 * @param {string} actionType - Key from ACTION_COSTS
 * @param {string} [model] - OpenAI model name (e.g., 'gpt-4', 'gpt-4o-mini')
 * @returns {number} Effective credit cost (base × multiplier)
 */
function getEffectiveCost(actionType = 'generic-ai', model = null) {
  const baseCost = ACTION_COSTS[actionType] || ACTION_COSTS['generic-ai'];
  if (!model) return baseCost;

  // Exact match first, then prefix match for versioned models (e.g., gpt-4o-mini-2025-01)
  let mult = MODEL_MULTIPLIERS[model];
  if (mult === undefined) {
    // Try prefix matching: 'gpt-4o-mini-2024-07-18' → 'gpt-4o-mini'
    const prefix = Object.keys(MODEL_MULTIPLIERS).find(k => model.startsWith(k));
    mult = prefix ? MODEL_MULTIPLIERS[prefix] : 1;
  }

  return Math.max(1, Math.ceil(baseCost * mult));
}

// Plan monthly credit allocations
const PLAN_CREDITS = {
  free:       10,      // Starter — 10 lifetime, not monthly
  growth:     5000,
  pro:        25000,
  enterprise: -1,      // unlimited
};

// ---------- Ledger persistence ----------

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadLedger() {
  ensureDataDir();
  try {
    if (fs.existsSync(LEDGER_FILE)) {
      return JSON.parse(fs.readFileSync(LEDGER_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[CreditLedger] Failed to load ledger:', e.message);
  }
  return {};
}

function saveLedger(ledger) {
  ensureDataDir();
  try {
    fs.writeFileSync(LEDGER_FILE, JSON.stringify(ledger, null, 2), 'utf8');
  } catch (e) {
    console.error('[CreditLedger] Failed to save ledger:', e.message);
  }
}

// ---------- Shop account helpers ----------

function getShopAccount(shop) {
  const ledger = loadLedger();
  if (!ledger[shop]) {
    ledger[shop] = {
      plan: 'free',
      plan_credits: PLAN_CREDITS.free,
      topup_credits: 0,
      used_this_period: 0,
      period_start: new Date().toISOString(),
      lifetime_used: 0,
      transactions: [],
    };
    saveLedger(ledger);
  }
  return ledger[shop];
}

function saveShopAccount(shop, account) {
  const ledger = loadLedger();
  ledger[shop] = account;
  saveLedger(ledger);
}

// ---------- Core credit operations ----------

/**
 * Check if a shop has enough credits for an action.
 * @param {string} shop - Shop domain
 * @param {string} actionType - Action key from ACTION_COSTS
 * @param {string} [model] - OpenAI model name for cost multiplier
 * @returns {{ allowed: boolean, cost: number, balance: number, unlimited: boolean }}
 */
function checkCredits(shop, actionType = 'generic-ai', model = null) {
  const account = getShopAccount(shop);
  const cost = getEffectiveCost(actionType, model);

  // Check if period needs reset (monthly)
  maybeResetPeriod(shop, account);

  // Enterprise = unlimited
  if (account.plan === 'enterprise' || PLAN_CREDITS[account.plan] === -1) {
    return { allowed: true, cost, balance: 999999, unlimited: true };
  }

  const availablePlan = Math.max(0, account.plan_credits - account.used_this_period);
  const totalAvailable = availablePlan + account.topup_credits;

  return {
    allowed: totalAvailable >= cost,
    cost,
    balance: totalAvailable,
    unlimited: false,
    plan_remaining: availablePlan,
    topup_remaining: account.topup_credits,
  };
}

/**
 * Deduct credits for a completed action.
 * Deducts from plan credits first, then top-up credits.
 * @param {string} shop - Shop domain
 * @param {string} actionType - Action key from ACTION_COSTS
 * @param {object} [meta] - Optional metadata (tool, description, model)
 * @returns {{ ok: boolean, cost: number, balance: number, error?: string }}
 */
function deductCredits(shop, actionType = 'generic-ai', meta = {}) {
  const account = getShopAccount(shop);
  const cost = getEffectiveCost(actionType, meta.model || null);

  maybeResetPeriod(shop, account);

  // Enterprise = unlimited, still log
  if (account.plan === 'enterprise' || PLAN_CREDITS[account.plan] === -1) {
    account.used_this_period += cost;
    account.lifetime_used += cost;
    account.transactions.push({
      type: 'deduct',
      action: actionType,
      cost,
      timestamp: new Date().toISOString(),
      ...meta,
    });
    // Keep last 500 transactions
    if (account.transactions.length > 500) {
      account.transactions = account.transactions.slice(-500);
    }
    saveShopAccount(shop, account);
    return { ok: true, cost, balance: 999999, unlimited: true };
  }

  const availablePlan = Math.max(0, account.plan_credits - account.used_this_period);
  const totalAvailable = availablePlan + account.topup_credits;

  if (totalAvailable < cost) {
    return {
      ok: false,
      cost,
      balance: totalAvailable,
      error: `Insufficient credits. Need ${cost}, have ${totalAvailable}. Purchase a credit top-up pack to continue.`,
    };
  }

  // Deduct from plan credits first, then top-up
  let remaining = cost;
  if (availablePlan >= remaining) {
    account.used_this_period += remaining;
  } else {
    remaining -= availablePlan;
    account.used_this_period = account.plan_credits; // exhausted plan credits
    account.topup_credits = Math.max(0, account.topup_credits - remaining);
  }

  account.lifetime_used += cost;
  account.transactions.push({
    type: 'deduct',
    action: actionType,
    cost,
    timestamp: new Date().toISOString(),
    ...meta,
  });

  if (account.transactions.length > 500) {
    account.transactions = account.transactions.slice(-500);
  }

  saveShopAccount(shop, account);

  const newAvailablePlan = Math.max(0, account.plan_credits - account.used_this_period);
  const newBalance = newAvailablePlan + account.topup_credits;

  return { ok: true, cost, balance: newBalance, unlimited: false };
}

/**
 * Add top-up credits to a shop account (from credit pack purchase).
 * @param {string} shop - Shop domain
 * @param {number} credits - Number of credits to add
 * @param {object} [meta] - Purchase metadata (packId, chargeId, amount)
 * @returns {{ ok: boolean, topup_credits: number, balance: number }}
 */
function addTopupCredits(shop, credits, meta = {}) {
  const account = getShopAccount(shop);
  account.topup_credits += credits;

  account.transactions.push({
    type: 'topup',
    credits,
    timestamp: new Date().toISOString(),
    ...meta,
  });

  if (account.transactions.length > 500) {
    account.transactions = account.transactions.slice(-500);
  }

  saveShopAccount(shop, account);

  const availablePlan = Math.max(0, account.plan_credits - account.used_this_period);
  return {
    ok: true,
    topup_credits: account.topup_credits,
    balance: availablePlan + account.topup_credits,
  };
}

/**
 * Update a shop's plan (called when subscription changes).
 * @param {string} shop - Shop domain
 * @param {string} planId - Plan ID (free/growth/pro/enterprise)
 */
function updatePlan(shop, planId) {
  const account = getShopAccount(shop);
  const oldPlan = account.plan;
  account.plan = planId;
  account.plan_credits = PLAN_CREDITS[planId] ?? PLAN_CREDITS.free;

  // If upgrading, reset period usage so they get full new credits immediately
  if ((PLAN_CREDITS[planId] || 0) > (PLAN_CREDITS[oldPlan] || 0)) {
    account.used_this_period = 0;
    account.period_start = new Date().toISOString();
  }

  account.transactions.push({
    type: 'plan_change',
    from: oldPlan,
    to: planId,
    timestamp: new Date().toISOString(),
  });

  saveShopAccount(shop, account);
}

/**
 * Get full credit status for a shop.
 * @param {string} shop - Shop domain
 * @returns {object} Credit status
 */
function getCreditStatus(shop) {
  const account = getShopAccount(shop);
  maybeResetPeriod(shop, account);

  const isUnlimited = account.plan === 'enterprise' || PLAN_CREDITS[account.plan] === -1;
  const availablePlan = isUnlimited ? 999999 : Math.max(0, account.plan_credits - account.used_this_period);
  const balance = isUnlimited ? 999999 : availablePlan + account.topup_credits;

  return {
    ok: true,
    plan: account.plan,
    balance,
    used: account.used_this_period,
    plan_credits: isUnlimited ? 999999 : account.plan_credits,
    topup_credits: account.topup_credits,
    unlimited: isUnlimited,
    lifetime_used: account.lifetime_used,
    period_start: account.period_start,
    recent_transactions: (account.transactions || []).slice(-20),
  };
}

// ---------- Period reset ----------

function maybeResetPeriod(shop, account) {
  if (!account.period_start) {
    account.period_start = new Date().toISOString();
    return;
  }

  const periodStart = new Date(account.period_start);
  const now = new Date();
  const daysSince = (now - periodStart) / (1000 * 60 * 60 * 24);

  // Reset every 30 days (monthly billing period)
  if (daysSince >= 30) {
    account.used_this_period = 0;
    account.period_start = now.toISOString();

    account.transactions.push({
      type: 'period_reset',
      timestamp: now.toISOString(),
    });

    saveShopAccount(shop, account);
  }
}

module.exports = {
  ACTION_COSTS,
  MODEL_MULTIPLIERS,
  PLAN_CREDITS,
  getEffectiveCost,
  checkCredits,
  deductCredits,
  addTopupCredits,
  updatePlan,
  getCreditStatus,
  getShopAccount,
};
