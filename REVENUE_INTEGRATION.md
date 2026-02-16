# 💰 AURA Platform - Revenue Integration Guide

**Stripe Integration + Revenue Tracking**  
**Time to Implement:** 2-3 days  
**Revenue Impact:** $100K MRR target in 90 days

---

## 🏗️ Architecture Overview

```
User Signup
    ↓
Stripe Customer Created
    ↓
Free Trial (7 days)
    ↓
Subscription Activated → Stripe Webhook
    ↓
Usage Tracking (API calls, storage)
    ↓
Monthly Invoice Generated
    ↓
Payment Processed → Revenue Analytics
```

---

## 📦 Installation

```bash
npm install stripe @stripe/stripe-js dotenv
```

---

## 🔑 Stripe Setup (15 minutes)

### Step 1: Create Stripe Account
1. Go to https://stripe.com
2. Sign up for account
3. Verify email and business details

### Step 2: Get API Keys
```
Dashboard → Developers → API Keys

Test Keys (for development):
- Publishable: pk_test_XXXXX
- Secret: sk_test_XXXXX

Live Keys (for production):
- Publishable: pk_live_XXXXX
- Secret: sk_live_XXXXX
```

### Step 3: Configure Webhooks
```
Dashboard → Developers → Webhooks → Add endpoint

Endpoint URL: https://your-domain.com/api/webhooks/stripe

Events to listen for:
✓ customer.subscription.created
✓ customer.subscription.updated
✓ customer.subscription.deleted
✓ invoice.payment_succeeded
✓ invoice.payment_failed
✓ customer.created
✓ customer.updated
✓ charge.succeeded
✓ charge.failed
```

---

## 💻 Code Implementation

### 1. Stripe Client Setup
**File:** `src/core/stripeClient.js`

```javascript
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: false,
});

module.exports = stripe;
```

### 2. Revenue Service
**File:** `src/core/revenueService.js`

```javascript
const stripe = require('./stripeClient');
const db = require('./db');

class RevenueService {
  // Create Stripe customer
  async createCustomer(user) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        user_id: user.id,
        signup_date: new Date().toISOString()
      }
    });

    // Save to database
    await db.query(
      'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
      [customer.id, user.id]
    );

    return customer;
  }

  // Create subscription
  async createSubscription(userId, planSlug) {
    const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    const plan = await db.query('SELECT * FROM subscription_plans WHERE slug = $1', [planSlug]);

    if (!user.rows[0].stripe_customer_id) {
      await this.createCustomer(user.rows[0]);
    }

    // Create Stripe subscription
    const subscription = await stripe.subscriptions.create({
      customer: user.rows[0].stripe_customer_id,
      items: [{
        price: plan.rows[0].stripe_price_id,
      }],
      trial_period_days: 7,
      metadata: {
        user_id: userId,
        plan_slug: planSlug
      }
    });

    // Save to database
    await db.query(`
      INSERT INTO subscriptions 
      (user_id, plan_id, status, stripe_subscription_id, current_period_start, current_period_end, trial_ends_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      userId,
      plan.rows[0].id,
      subscription.status,
      subscription.id,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000),
      subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
    ]);

    return subscription;
  }

  // Track usage
  async trackUsage(userId, meterSlug, quantity = 1) {
    const result = await db.query(`
      SELECT ut.*, bm.price_per_unit, sp.limits
      FROM usage_tracking ut
      JOIN billing_meters bm ON ut.meter_id = bm.id
      JOIN subscriptions s ON ut.user_id = s.user_id
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE ut.user_id = $1 
        AND bm.slug = $2
        AND ut.period_start = DATE_TRUNC('month', CURRENT_DATE)
    `, [userId, meterSlug]);

    const planLimit = result.rows[0]?.limits[meterSlug] || 0;
    const currentUsage = result.rows[0]?.quantity || 0;
    const newUsage = currentUsage + quantity;
    const overage = planLimit === -1 ? 0 : Math.max(0, newUsage - planLimit);

    if (result.rows.length === 0) {
      // Create new usage record
      await db.query(`
        INSERT INTO usage_tracking 
        (user_id, meter_id, quantity, period_start, period_end, overage_quantity)
        SELECT $1, id, $2, DATE_TRUNC('month', CURRENT_DATE), 
               DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month', $3
        FROM billing_meters WHERE slug = $4
      `, [userId, quantity, overage, meterSlug]);
    } else {
      // Update existing
      await db.query(`
        UPDATE usage_tracking 
        SET quantity = quantity + $1,
            overage_quantity = $2,
            overage_cost = $2 * $3,
            updated_at = NOW()
        WHERE user_id = $4 
          AND meter_id = (SELECT id FROM billing_meters WHERE slug = $5)
          AND period_start = DATE_TRUNC('month', CURRENT_DATE)
      `, [quantity, overage, result.rows[0].price_per_unit, userId, meterSlug]);
    }

    // Report to Stripe if metered billing enabled
    if (overage > 0) {
      await this.reportToStripe(userId, meterSlug, overage);
    }

    return { usage: newUsage, overage, limit: planLimit };
  }

  // Generate invoice
  async generateInvoice(userId) {
    const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    const subscription = await db.query('SELECT * FROM subscriptions WHERE user_id = $1 AND status = $2', [userId, 'active']);
    
    if (!subscription.rows[0]) return null;

    // Get base subscription cost
    const plan = await db.query('SELECT * FROM subscription_plans WHERE id = $1', [subscription.rows[0].plan_id]);
    let subtotal = plan.rows[0].price_monthly;

    // Add usage overages
    const overages = await db.query(`
      SELECT ut.*, bm.name, bm.price_per_unit
      FROM usage_tracking ut
      JOIN billing_meters bm ON ut.meter_id = bm.id
      WHERE ut.user_id = $1 
        AND ut.period_start = DATE_TRUNC('month', CURRENT_DATE)
        AND ut.overage_quantity > 0
    `, [userId]);

    const lineItems = [{
      description: `${plan.rows[0].name} Plan`,
      quantity: 1,
      amount: plan.rows[0].price_monthly
    }];

    for (const overage of overages.rows) {
      const amount = overage.overage_quantity * overage.price_per_unit;
      subtotal += amount;
      lineItems.push({
        description: `${overage.name} Overage`,
        quantity: overage.overage_quantity,
        amount
      });
    }

    const tax = subtotal * 0.08; // 8% tax (adjust based on location)
    const total = subtotal + tax;

    // Create invoice
    const invoiceNumber = `INV-${Date.now()}-${userId}`;
    
    await db.query(`
      INSERT INTO invoices 
      (user_id, subscription_id, invoice_number, status, subtotal, tax, total, amount_due, line_items, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE + INTERVAL '7 days')
      RETURNING *
    `, [
      userId,
      subscription.rows[0].id,
      invoiceNumber,
      'open',
      subtotal,
      tax,
      total,
      total,
      JSON.stringify(lineItems)
    ]);

    // Create Stripe invoice
    const stripeInvoice = await stripe.invoices.create({
      customer: user.rows[0].stripe_customer_id,
      auto_advance: true,
      collection_method: 'charge_automatically',
      metadata: {
        user_id: userId,
        invoice_number: invoiceNumber
      }
    });

    // Add line items to Stripe
    for (const item of lineItems) {
      await stripe.invoiceItems.create({
        customer: user.rows[0].stripe_customer_id,
        invoice: stripeInvoice.id,
        amount: Math.round(item.amount * 100), // cents
        currency: 'usd',
        description: item.description
      });
    }

    // Finalize and send
    await stripe.invoices.finalizeInvoice(stripeInvoice.id);

    return { invoiceNumber, total, stripeInvoiceId: stripeInvoice.id };
  }

  // Analytics
  async getRevenueDashboard() {
    // MRR
    const mrr = await db.query(`
      SELECT SUM(sp.price_monthly) as mrr
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.status = 'active'
    `);

    // ARR
    const arr = mrr.rows[0].mrr * 12;

    // Customer counts
    const customers = await db.query(`
      SELECT 
        sp.slug,
        COUNT(*) as count
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.status = 'active'
      GROUP BY sp.slug
    `);

    // Revenue by stream
    const streams = await db.query(`
      SELECT rs.name, COALESCE(SUM(sa.revenue), 0) as revenue
      FROM revenue_streams rs
      LEFT JOIN stream_analytics sa ON rs.id = sa.stream_id
      WHERE sa.period_start >= DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY rs.name
      ORDER BY revenue DESC
    `);

    // Churn rate
    const churn = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'cancelled') * 100.0 / COUNT(*) as churn_rate
      FROM subscriptions
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `);

    return {
      mrr: mrr.rows[0].mrr || 0,
      arr,
      customers: customers.rows,
      streams: streams.rows,
      churn_rate: churn.rows[0].churn_rate || 0
    };
  }
}

module.exports = new RevenueService();
```

### 3. Webhook Handler
**File:** `src/routes/webhooks.js`

```javascript
const express = require('express');
const router = express.Router();
const stripe = require('../core/stripeClient');
const db = require('../core/db');

router.post('/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle event
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionChange(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionCancellation(event.data.object);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSuccess(event.data.object);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({received: true});
});

async function handleSubscriptionChange(subscription) {
  const userId = subscription.metadata.user_id;

  await db.query(`
    UPDATE subscriptions 
    SET status = $1,
        current_period_start = $2,
        current_period_end = $3,
        updated_at = NOW()
    WHERE stripe_subscription_id = $4
  `, [
    subscription.status,
    new Date(subscription.current_period_start * 1000),
    new Date(subscription.current_period_end * 1000),
    subscription.id
  ]);

  // Log billing event
  await db.query(`
    INSERT INTO billing_history (user_id, event_type, description, metadata)
    VALUES ($1, $2, $3, $4)
  `, [
    userId,
    'subscription_updated',
    'Subscription status changed to ' + subscription.status,
    JSON.stringify(subscription)
  ]);
}

async function handleSubscriptionCancellation(subscription) {
  const userId = subscription.metadata.user_id;

  await db.query(`
    UPDATE subscriptions 
    SET status = 'cancelled',
        cancelled_at = NOW()
    WHERE stripe_subscription_id = $1
  `, [subscription.id]);

  // Track churn
  await db.query(`
    INSERT INTO churn_analytics (user_id, churn_date, churn_type)
    VALUES ($1, NOW(), 'voluntary')
  `, [userId]);
}

async function handlePaymentSuccess(invoice) {
  await db.query(`
    INSERT INTO payments (invoice_id, user_id, amount, status, stripe_payment_intent_id)
    SELECT id, user_id, total, 'succeeded', $1
    FROM invoices WHERE stripe_invoice_id = $2
  `, [invoice.payment_intent, invoice.id]);

  await db.query(`
    UPDATE invoices 
    SET status = 'paid', 
        amount_paid = total,
        paid_at = NOW()
    WHERE stripe_invoice_id = $1
  `, [invoice.id]);
}

async function handlePaymentFailure(invoice) {
  await db.query(`
    UPDATE invoices 
    SET status = 'past_due'
    WHERE stripe_invoice_id = $1
  `, [invoice.id]);

  // Update subscription status
  await db.query(`
    UPDATE subscriptions 
    SET status = 'past_due'
    WHERE stripe_subscription_id = $1
  `, [invoice.subscription]);
}

module.exports = router;
```

---

## 🎯 Usage in Your Code

### Track API Call
```javascript
const revenueService = require('./core/revenueService');

app.use(async (req, res, next) => {
  if (req.user) {
    await revenueService.trackUsage(req.user.id, 'api_calls', 1);
  }
  next();
});
```

### Create Subscription on Signup
```javascript
router.post('/signup', async (req, res) => {
  // Create user
  const user = await createUser(req.body);

  // Create free trial subscription
  const subscription = await revenueService.createSubscription(user.id, 'pro');

  res.json({ user, subscription });
});
```

### Upgrade/Downgrade
```javascript
router.post('/subscription/change', async (req, res) => {
  const { userId, newPlan } = req.body;

  const subscription = await stripe.subscriptions.update(
    user.stripe_subscription_id,
    { items: [{ price: newPlanPriceId }] }
  );

  res.json({ success: true });
});
```

---

## 📊 Revenue Dashboard API

```javascript
router.get('/api/revenue/dashboard', async (req, res) => {
  const dashboard = await revenue Service.getRevenueDashboard();
  res.json(dashboard);
});
```

**Returns:**
```json
{
  "mrr": 45000,
  "arr": 540000,
  "customers": [
    { "slug": "free", "count": 100 },
    { "slug": "pro", "count": 150 },
    { "slug": "enterprise", "count": 3 }
  ],
  "streams": [
    { "name": "Subscriptions", "revenue": 45000 },
    { "name": "White Label", "revenue": 18000 },
    { "name": "Marketplace", "revenue": 8000 }
  ],
  "churn_rate": 3.5
}
```

---

## 🚀 Quick Deploy

```bash
# 1. Run database migrations
psql $DATABASE_URL < migrations/001_revenue_infrastructure.sql

# 2. Set environment variables
export STRIPE_SECRET_KEY=sk_live_XXXXX
export STRIPE_WEBHOOK_SECRET=whsec_XXXXX

# 3. Start server
npm start

# 4. Test webhook (use Stripe CLI)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

**Integration complete! Revenue tracking LIVE. 💰**
