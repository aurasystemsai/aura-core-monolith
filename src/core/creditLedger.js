// Credit Ledger - Postgres-backed credit tracking per shop
// Falls back to file-based storage when DATABASE_URL is not set (local dev).
//
// Tables (auto-created on first use):
//   credit_accounts      - one row per shop: plan, credits, usage
//   credit_transactions  - append-only audit log

'use strict';

const fs   = require('fs');
const path = require('path');

// Postgres pool (only when DATABASE_URL is configured)
let pgPool = null;

function getPool() {
  if (pgPool) return pgPool;
  const connStr = process.env.DATABASE_URL || process.env.AURA_PG_URL;
  if (!connStr) return null;
  try {
    const { Pool } = require('pg');
    pgPool = new Pool({
      connectionString: connStr,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    pgPool.on('error', err => console.error('[CreditLedger] Pool error:', err.message));
    return pgPool;
  } catch (e) {
    console.error('[CreditLedger] Could not create pg pool:', e.message);
    return null;
  }
}

// Schema bootstrap
let _schemaReady = false;

async function ensureSchema() {
  if (_schemaReady) return;
  const pool = getPool();
  if (!pool) { _schemaReady = true; return; }
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS credit_accounts (
        shop              TEXT PRIMARY KEY,
        plan              TEXT    NOT NULL DEFAULT 'free',
        plan_credits      INTEGER NOT NULL DEFAULT 10,
        used_this_period  INTEGER NOT NULL DEFAULT 0,
        topup_credits     INTEGER NOT NULL DEFAULT 0,
        lifetime_used     INTEGER NOT NULL DEFAULT 0,
        period_start      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS credit_transactions (
        id          BIGSERIAL PRIMARY KEY,
        shop        TEXT        NOT NULL,
        type        TEXT        NOT NULL,
        action      TEXT,
        cost        INTEGER,
        credits     INTEGER,
        model       TEXT,
        tool        TEXT,
        description TEXT,
        ts          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_credit_tx_shop ON credit_transactions(shop)`);
    _schemaReady = true;
    console.log('[CreditLedger] Postgres schema ready');
  } catch (e) {
    console.error('[CreditLedger] Schema bootstrap failed:', e.message);
  } finally {
    client.release();
  }
}

ensureSchema().catch(() => {});

// File-based fallback
const DATA_DIR    = path.join(__dirname, '..', '..', 'data');
const LEDGER_FILE = path.join(DATA_DIR, 'credit-ledger.json');

function loadLedgerFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(LEDGER_FILE)) return JSON.parse(fs.readFileSync(LEDGER_FILE, 'utf8'));
  } catch (e) { console.error('[CreditLedger] File load error:', e.message); }
  return {};
}
function saveLedgerFile(ledger) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(LEDGER_FILE, JSON.stringify(ledger, null, 2), 'utf8');
  } catch (e) { console.error('[CreditLedger] File save error:', e.message); }
}

// Credit constants
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
  'fix-queue-item':      1,
  'generic-ai':          1,
};

const MODEL_MULTIPLIERS = {
  'gpt-4o-mini': 1, 'gpt-4.1-mini': 1, 'gpt-4.1-nano': 1, 'gpt-5-mini': 1,
  'gpt-4o': 2, 'gpt-4.1': 2, 'gpt-4-turbo': 2, 'gpt-4-turbo-preview': 2,
  'gpt-4': 3, 'gpt-5': 3,
  'gpt-5.2': 5, 'o1': 5, 'o1-mini': 3, 'o3': 5, 'o3-mini': 3, 'o4-mini': 3,
};

const PLAN_CREDITS = {
  free:       10,      // 10 lifetime credits on dashboard-only tier
  growth:     5000,    // 5,000/mo
  pro:        25000,   // 25,000/mo
  enterprise: -1,      // unlimited
};

function getEffectiveCost(actionType, model) {
  actionType = actionType || 'generic-ai';
  const baseCost = ACTION_COSTS[actionType] || 1;
  if (!model) return baseCost;
  let mult = MODEL_MULTIPLIERS[model];
  if (mult === undefined) {
    const prefix = Object.keys(MODEL_MULTIPLIERS).find(k => model.startsWith(k));
    mult = prefix ? MODEL_MULTIPLIERS[prefix] : 1;
  }
  return Math.max(1, Math.ceil(baseCost * mult));
}

// Postgres helpers
async function pgGetAccount(shop) {
  await ensureSchema();
  const pool = getPool();
  const res = await pool.query('SELECT * FROM credit_accounts WHERE shop = $1', [shop]);
  if (res.rows.length) return res.rows[0];
  const ins = await pool.query(
    `INSERT INTO credit_accounts (shop, plan, plan_credits, used_this_period, topup_credits, lifetime_used, period_start)
     VALUES ($1, 'free', $2, 0, 0, 0, NOW())
     ON CONFLICT (shop) DO UPDATE SET updated_at = NOW()
     RETURNING *`,
    [shop, PLAN_CREDITS.free]
  );
  return ins.rows[0];
}

async function pgSave(pool, shop, fields) {
  const cols = Object.keys(fields);
  const vals = Object.values(fields);
  const set  = cols.map((c, i) => `${c} = $${i + 2}`).join(', ');
  await pool.query(`UPDATE credit_accounts SET ${set}, updated_at = NOW() WHERE shop = $1`, [shop, ...vals]);
}

async function pgLog(pool, shop, tx) {
  await pool.query(
    `INSERT INTO credit_transactions (shop, type, action, cost, credits, model, tool, description)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [shop, tx.type, tx.action||null, tx.cost||null, tx.credits||null, tx.model||null, tx.tool||null, tx.description||null]
  );
}

function needsReset(account) {
  if (!account.period_start) return true;
  return (Date.now() - new Date(account.period_start).getTime()) / 86400000 >= 30;
}

// File helpers
function fileGetAccount(shop) {
  const ledger = loadLedgerFile();
  if (!ledger[shop]) {
    ledger[shop] = { plan:'free', plan_credits:PLAN_CREDITS.free, topup_credits:0,
      used_this_period:0, period_start:new Date().toISOString(), lifetime_used:0, transactions:[] };
    saveLedgerFile(ledger);
  }
  return ledger[shop];
}
function fileSave(shop, account) {
  const ledger = loadLedgerFile();
  ledger[shop] = account;
  saveLedgerFile(ledger);
}
function fileLog(account, tx) {
  account.transactions = [...(account.transactions||[]).slice(-499), { ...tx, timestamp: new Date().toISOString() }];
}

// Public API

async function checkCredits(shop, actionType, model) {
  const cost = getEffectiveCost(actionType, model);
  const pool = getPool();

  if (pool) {
    const acc = await pgGetAccount(shop);
    if (acc.plan === 'enterprise' || PLAN_CREDITS[acc.plan] === -1)
      return { allowed:true, cost, balance:999999, unlimited:true };
    if (needsReset(acc)) {
      await pool.query(`UPDATE credit_accounts SET used_this_period=0, period_start=NOW(), updated_at=NOW() WHERE shop=$1`, [shop]);
      acc.used_this_period = 0;
    }
    const planRem = Math.max(0, acc.plan_credits - acc.used_this_period);
    const total   = planRem + Number(acc.topup_credits);
    return { allowed: total >= cost, cost, balance: total, unlimited:false,
             plan_remaining: planRem, topup_remaining: acc.topup_credits };
  }

  const acc = fileGetAccount(shop);
  if (needsReset(acc)) { acc.used_this_period=0; acc.period_start=new Date().toISOString(); fileSave(shop, acc); }
  if (acc.plan === 'enterprise' || PLAN_CREDITS[acc.plan] === -1)
    return { allowed:true, cost, balance:999999, unlimited:true };
  const planRem = Math.max(0, acc.plan_credits - acc.used_this_period);
  const total   = planRem + (acc.topup_credits||0);
  return { allowed: total >= cost, cost, balance: total, unlimited:false };
}

async function deductCredits(shop, actionType, meta) {
  meta = meta || {};
  const cost = getEffectiveCost(actionType, meta.model || null);
  const pool = getPool();

  if (pool) {
    const acc = await pgGetAccount(shop);
    if (needsReset(acc)) {
      await pool.query(`UPDATE credit_accounts SET used_this_period=0, period_start=NOW(), updated_at=NOW() WHERE shop=$1`, [shop]);
      acc.used_this_period = 0;
    }
    if (acc.plan === 'enterprise' || PLAN_CREDITS[acc.plan] === -1) {
      await pgSave(pool, shop, { used_this_period: Number(acc.used_this_period)+cost, lifetime_used: Number(acc.lifetime_used)+cost });
      await pgLog(pool, shop, { type:'deduct', action:actionType, cost, ...meta });
      return { ok:true, cost, balance:999999, unlimited:true };
    }
    const planRem = Math.max(0, acc.plan_credits - acc.used_this_period);
    const total   = planRem + Number(acc.topup_credits);
    if (total < cost) return { ok:false, cost, balance:total, error:`Insufficient credits. Need ${cost}, have ${total}.` };

    let newUsed  = Number(acc.used_this_period);
    let newTopup = Number(acc.topup_credits);
    let rem = cost;
    if (planRem >= rem) { newUsed += rem; }
    else { rem -= planRem; newUsed = Number(acc.plan_credits); newTopup = Math.max(0, newTopup - rem); }

    await pgSave(pool, shop, { used_this_period: newUsed, topup_credits: newTopup, lifetime_used: Number(acc.lifetime_used)+cost });
    await pgLog(pool, shop, { type:'deduct', action:actionType, cost, ...meta });
    return { ok:true, cost, balance: Math.max(0, acc.plan_credits - newUsed) + newTopup, unlimited:false };
  }

  const acc = fileGetAccount(shop);
  if (needsReset(acc)) { acc.used_this_period=0; acc.period_start=new Date().toISOString(); }
  if (acc.plan === 'enterprise' || PLAN_CREDITS[acc.plan] === -1) {
    acc.used_this_period += cost; acc.lifetime_used = (acc.lifetime_used||0)+cost;
    fileLog(acc, { type:'deduct', action:actionType, cost, ...meta });
    fileSave(shop, acc);
    return { ok:true, cost, balance:999999, unlimited:true };
  }
  const planRem = Math.max(0, acc.plan_credits - acc.used_this_period);
  const total   = planRem + (acc.topup_credits||0);
  if (total < cost) return { ok:false, cost, balance:total, error:`Insufficient credits. Need ${cost}, have ${total}.` };
  let rem = cost;
  if (planRem >= rem) { acc.used_this_period += rem; }
  else { rem -= planRem; acc.used_this_period = acc.plan_credits; acc.topup_credits = Math.max(0, (acc.topup_credits||0) - rem); }
  acc.lifetime_used = (acc.lifetime_used||0)+cost;
  fileLog(acc, { type:'deduct', action:actionType, cost, ...meta });
  fileSave(shop, acc);
  return { ok:true, cost, balance: Math.max(0, acc.plan_credits - acc.used_this_period) + (acc.topup_credits||0), unlimited:false };
}

async function addTopupCredits(shop, credits, meta) {
  meta = meta || {};
  const pool = getPool();
  if (pool) {
    const acc = await pgGetAccount(shop);
    const newTopup = Number(acc.topup_credits) + credits;
    await pgSave(pool, shop, { topup_credits: newTopup });
    await pgLog(pool, shop, { type:'topup', credits, ...meta });
    const planRem = Math.max(0, acc.plan_credits - acc.used_this_period);
    return { ok:true, topup_credits: newTopup, balance: planRem + newTopup };
  }
  const acc = fileGetAccount(shop);
  acc.topup_credits = (acc.topup_credits||0) + credits;
  fileLog(acc, { type:'topup', credits, ...meta });
  fileSave(shop, acc);
  return { ok:true, topup_credits: acc.topup_credits, balance: Math.max(0, acc.plan_credits - acc.used_this_period) + acc.topup_credits };
}

async function updatePlan(shop, planId) {
  const newCredits = PLAN_CREDITS[planId] != null ? PLAN_CREDITS[planId] : PLAN_CREDITS.free;
  const pool = getPool();
  if (pool) {
    const acc    = await pgGetAccount(shop);
    const oldPlan = acc.plan;
    const isUp   = (PLAN_CREDITS[planId]||0) > (PLAN_CREDITS[oldPlan]||0);
    const fields = { plan: planId, plan_credits: newCredits < 0 ? 999999 : newCredits };
    if (isUp) { fields.used_this_period = 0; fields.period_start = new Date().toISOString(); }
    await pgSave(pool, shop, fields);
    await pgLog(pool, shop, { type:'plan_change', description:`${oldPlan} -> ${planId}` });
    return;
  }
  const acc = fileGetAccount(shop);
  const oldPlan = acc.plan;
  acc.plan = planId; acc.plan_credits = newCredits;
  if ((PLAN_CREDITS[planId]||0) > (PLAN_CREDITS[oldPlan]||0)) { acc.used_this_period=0; acc.period_start=new Date().toISOString(); }
  fileLog(acc, { type:'plan_change', description:`${oldPlan} -> ${planId}` });
  fileSave(shop, acc);
}

async function getCreditStatus(shop) {
  const pool = getPool();
  if (pool) {
    const acc = await pgGetAccount(shop);
    if (needsReset(acc)) {
      await pool.query(`UPDATE credit_accounts SET used_this_period=0, period_start=NOW(), updated_at=NOW() WHERE shop=$1`, [shop]);
      acc.used_this_period = 0;
    }
    const isUnlimited = acc.plan === 'enterprise' || PLAN_CREDITS[acc.plan] === -1;
    const planRem = isUnlimited ? 999999 : Math.max(0, acc.plan_credits - acc.used_this_period);
    const balance = isUnlimited ? 999999 : planRem + Number(acc.topup_credits);
    const txRes   = await pool.query(
      `SELECT type, action, cost, credits, model, tool, description, ts FROM credit_transactions WHERE shop=$1 ORDER BY ts DESC LIMIT 20`,
      [shop]
    );
    return { ok:true, plan:acc.plan, balance, used:acc.used_this_period,
             plan_credits: isUnlimited ? 999999 : acc.plan_credits,
             topup_credits: acc.topup_credits, unlimited:isUnlimited,
             lifetime_used:acc.lifetime_used, period_start:acc.period_start,
             recent_transactions: txRes.rows };
  }
  const acc = fileGetAccount(shop);
  if (needsReset(acc)) { acc.used_this_period=0; acc.period_start=new Date().toISOString(); fileSave(shop, acc); }
  const isUnlimited = acc.plan === 'enterprise' || PLAN_CREDITS[acc.plan] === -1;
  const planRem = isUnlimited ? 999999 : Math.max(0, acc.plan_credits - acc.used_this_period);
  const balance = isUnlimited ? 999999 : planRem + (acc.topup_credits||0);
  return { ok:true, plan:acc.plan, balance, used:acc.used_this_period,
           plan_credits: isUnlimited ? 999999 : acc.plan_credits,
           topup_credits: acc.topup_credits||0, unlimited:isUnlimited,
           lifetime_used:acc.lifetime_used||0, period_start:acc.period_start,
           recent_transactions:(acc.transactions||[]).slice(-20) };
}

function getShopAccount(shop) {
  const pool = getPool();
  if (pool) return pgGetAccount(shop);
  return Promise.resolve(fileGetAccount(shop));
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