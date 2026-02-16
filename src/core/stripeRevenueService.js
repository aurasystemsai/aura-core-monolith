// Stripe Revenue Integration
// Complete billing, subscriptions, and revenue tracking

const Stripe = require('stripe');
const db = require('./db');

class StripeRevenueService {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });
  }

  // ============================================
  // CUSTOMER MANAGEMENT
  // ============================================

  async createCustomer(user) {
    try {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name || user.email,
        metadata: {
          user_id: user.id,
          signup_date: new Date().toISOString(),
          platform: 'aura-core'
        }
      });

      // Save Stripe customer ID to database
      await db.query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [customer.id, user.id]
      );

      console.log(`✓ Stripe customer created: ${customer.id} for user ${user.id}`);
      return customer;
    } catch (error) {
      console.error('Failed to create Stripe customer:', error);
      throw error;
    }
  }

  async getOrCreateCustomer(user) {
    if (user.stripe_customer_id) {
      try {
        return await this.stripe.customers.retrieve(user.stripe_customer_id);
      } catch (error) {
        console.warn('Stripe customer not found, creating new one');
      }
    }
    return await this.createCustomer(user);
  }

  // ============================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================

  async createSubscription(userId, planSlug, trialDays = 7) {
    try {
      // Get user and plan details
      const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      const planResult = await db.query('SELECT * FROM subscription_plans WHERE slug = $1', [planSlug]);

      if (userResult.rows.length === 0) throw new Error('User not found');
      if (planResult.rows.length === 0) throw new Error('Plan not found');

      const user = userResult.rows[0];
      const plan = planResult.rows[0];

      // Ensure Stripe customer exists
      const customer = await this.getOrCreateCustomer(user);

      // Create or get Stripe price
      const price = await this.getOrCreatePrice(plan);

      // Create Stripe subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }],
        trial_period_days: trialDays,
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          user_id: userId,
          plan_slug: planSlug,
          plan_name: plan.name
        }
      });

      // Save to database
      await db.query(`
        INSERT INTO subscriptions 
        (user_id, plan_id, status, stripe_subscription_id, current_period_start, current_period_end, trial_ends_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        userId,
        plan.id,
        subscription.status,
        subscription.id,
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000),
        subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
      ]);

      // Log billing event
      await this.logBillingEvent(userId, 'subscription_created', `Subscribed to ${plan.name} plan`, {
        subscription_id: subscription.id,
        plan: planSlug,
        trial_days: trialDays
      });

      console.log(`✓ Subscription created: ${subscription.id} for user ${userId}`);
      return subscription;
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(userId, immediate = false) {
    try {
      const result = await db.query(
        'SELECT * FROM subscriptions WHERE user_id = $1 AND status = $2',
        [userId, 'active']
      );

      if (result.rows.length === 0) {
        throw new Error('No active subscription found');
      }

      const subscription = result.rows[0];

      // Cancel in Stripe
      const canceledSubscription = immediate
        ? await this.stripe.subscriptions.cancel(subscription.stripe_subscription_id)
        : await this.stripe.subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: true
          });

      // Update database
      await db.query(`
        UPDATE subscriptions 
        SET cancel_at_period_end = $1,
            cancelled_at = $2
        WHERE id = $3
      `, [!immediate, immediate ? new Date() : null, subscription.id]);

      // Track churn
      if (immediate) {
        await this.trackChurn(userId, 'voluntary');
      }

      await this.logBillingEvent(userId, 'subscription_cancelled', 
        immediate ? 'Subscription cancelled immediately' : 'Subscription will cancel at period end');

      return canceledSubscription;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  async changeSubscription(userId, newPlanSlug) {
    try {
      const userSub = await db.query(
        'SELECT s.*, sp.slug as current_plan FROM subscriptions s JOIN subscription_plans sp ON s.plan_id = sp.id WHERE s.user_id = $1 AND s.status = $2',
        [userId, 'active']
      );

      if (userSub.rows.length === 0) {
        throw new Error('No active subscription found');
      }

      const newPlan = await db.query('SELECT * FROM subscription_plans WHERE slug = $1', [newPlanSlug]);
      if (newPlan.rows.length === 0) throw new Error('Plan not found');

      const price = await this.getOrCreatePrice(newPlan.rows[0]);

      // Update Stripe subscription
      const subscription = await this.stripe.subscriptions.retrieve(userSub.rows[0].stripe_subscription_id);
      const updatedSubscription = await this.stripe.subscriptions.update(subscription.id, {
        items: [{
          id: subscription.items.data[0].id,
          price: price.id
        }],
        proration_behavior: 'always_invoice'
      });

      // Update database
      await db.query(
        'UPDATE subscriptions SET plan_id = $1 WHERE id = $2',
        [newPlan.rows[0].id, userSub.rows[0].id]
      );

      await this.logBillingEvent(userId, 'subscription_changed', 
        `Changed from ${userSub.rows[0].current_plan} to ${newPlanSlug}`);

      return updatedSubscription;
    } catch (error) {
      console.error('Failed to change subscription:', error);
      throw error;
    }
  }

  // ============================================
  // USAGE TRACKING & METERING
  // ============================================

  async trackUsage(userId, meterSlug, quantity = 1) {
    try {
      // Get current usage and plan limits
      const result = await db.query(`
        SELECT 
          ut.id as usage_id,
          ut.quantity as current_quantity,
          ut.overage_quantity,
          bm.id as meter_id,
          bm.price_per_unit,
          bm.included_in_plan,
          sp.slug as plan_slug,
          sp.limits
        FROM billing_meters bm
        CROSS JOIN subscriptions s
        JOIN subscription_plans sp ON s.plan_id = sp.id
        LEFT JOIN usage_tracking ut ON ut.user_id = s.user_id 
          AND ut.meter_id = bm.id 
          AND ut.period_start = DATE_TRUNC('month', CURRENT_DATE)
        WHERE s.user_id = $1 
          AND s.status = 'active'
          AND bm.slug = $2
      `, [userId, meterSlug]);

      if (result.rows.length === 0) {
        console.warn(`No active subscription or meter found for user ${userId}, meter ${meterSlug}`);
        return null;
      }

      const row = result.rows[0];
      const planLimits = row.limits || {};
      const limit = planLimits[meterSlug] || 0;
      const currentUsage = row.current_quantity || 0;
      const newUsage = currentUsage + quantity;
      const overage = limit === -1 ? 0 : Math.max(0, newUsage - limit);
      const overageCost = overage * row.price_per_unit;

      if (row.usage_id) {
        // Update existing usage record
        await db.query(`
          UPDATE usage_tracking 
          SET quantity = $1,
              overage_quantity = $2,
              overage_cost = $3,
              updated_at = NOW()
          WHERE id = $4
        `, [newUsage, overage, overageCost, row.usage_id]);
      } else {
        // Create new usage record for this month
        await db.query(`
          INSERT INTO usage_tracking 
          (user_id, meter_id, quantity, period_start, period_end, overage_quantity, overage_cost)
          VALUES ($1, $2, $3, DATE_TRUNC('month', CURRENT_DATE), 
                  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month', $4, $5)
        `, [userId, row.meter_id, newUsage, overage, overageCost]);
      }

      // Log warning if approaching limit
      if (limit > 0 && newUsage > limit * 0.9) {
        console.warn(`⚠️ User ${userId} approaching ${meterSlug} limit: ${newUsage}/${limit}`);
      }

      return {
        usage: newUsage,
        limit: limit,
        overage: overage,
        overage_cost: overageCost,
        percentage: limit > 0 ? (newUsage / limit) * 100 : 0
      };
    } catch (error) {
      console.error('Failed to track usage:', error);
      throw error;
    }
  }

  async getUsageStats(userId) {
    const result = await db.query(`
      SELECT 
        bm.name,
        bm.slug,
        bm.unit,
        ut.quantity,
        ut.overage_quantity,
        ut.overage_cost,
        sp.limits
      FROM usage_tracking ut
      JOIN billing_meters bm ON ut.meter_id = bm.id
      JOIN subscriptions s ON ut.user_id = s.user_id
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE ut.user_id = $1 
        AND ut.period_start = DATE_TRUNC('month', CURRENT_DATE)
    `, [userId]);

    return result.rows.map(row => ({
      name: row.name,
      slug: row.slug,
      unit: row.unit,
      usage: row.quantity,
      limit: row.limits[row.slug] || 0,
      overage: row.overage_quantity,
      overage_cost: row.overage_cost
    }));
  }

  // ============================================
  // INVOICING
  // ============================================

  async generateMonthlyInvoice(userId) {
    try {
      // Get active subscription
      const subResult = await db.query(`
        SELECT s.*, sp.name as plan_name, sp.price_monthly, u.stripe_customer_id
        FROM subscriptions s
        JOIN subscription_plans sp ON s.plan_id = sp.id
        JOIN users u ON s.user_id = u.id
        WHERE s.user_id = $1 AND s.status = 'active'
      `, [userId]);

      if (subResult.rows.length === 0) return null;

      const subscription = subResult.rows[0];
      let subtotal = subscription.price_monthly;
      const lineItems = [{
        description: `${subscription.plan_name} Plan - Monthly`,
        quantity: 1,
        unit_amount: subscription.price_monthly,
        amount: subscription.price_monthly
      }];

      // Add usage overages
      const overages = await db.query(`
        SELECT ut.*, bm.name, bm.unit, bm.price_per_unit
        FROM usage_tracking ut
        JOIN billing_meters bm ON ut.meter_id = bm.id
        WHERE ut.user_id = $1 
          AND ut.period_start = DATE_TRUNC('month', CURRENT_DATE)
          AND ut.overage_quantity > 0
      `, [userId]);

      for (const overage of overages.rows) {
        const amount = overage.overage_cost;
        subtotal += amount;
        lineItems.push({
          description: `${overage.name} - Overage (${overage.overage_quantity} ${overage.unit})`,
          quantity: overage.overage_quantity,
          unit_amount: overage.price_per_unit,
          amount: amount
        });
      }

      const tax = subtotal * 0.08; // 8% sales tax (adjust based on location)
      const total = subtotal + tax;
      const invoiceNumber = `INV-${Date.now()}-${userId}`;

      // Create invoice in database
      const invoiceResult = await db.query(`
        INSERT INTO invoices 
        (user_id, subscription_id, invoice_number, status, subtotal, tax, total, amount_due, line_items, due_date)
        VALUES ($1, $2, $3, 'draft', $4, $5, $6, $7, $8, CURRENT_DATE + INTERVAL '7 days')
        RETURNING *
      `, [
        userId,
        subscription.id,
        invoiceNumber,
        subtotal,
        tax,
        total,
        total,
        JSON.stringify(lineItems)
      ]);

      // Create Stripe invoice
      const stripeInvoice = await this.stripe.invoices.create({
        customer: subscription.stripe_customer_id,
        auto_advance: true,
        collection_method: 'charge_automatically',
        description: `AURA Platform - ${subscription.plan_name}`,
        metadata: {
          user_id: userId,
          invoice_number: invoiceNumber,
          subscription_id: subscription.stripe_subscription_id
        }
      });

      // Add line items to Stripe invoice
      for (const item of lineItems) {
        await this.stripe.invoiceItems.create({
          customer: subscription.stripe_customer_id,
          invoice: stripeInvoice.id,
          amount: Math.round(item.amount * 100), // Convert to cents
          currency: 'usd',
          description: item.description
        });
      }

      // Finalize invoice
      await this.stripe.invoices.finalizeInvoice(stripeInvoice.id);

      // Update database with Stripe invoice ID
      await db.query(
        'UPDATE invoices SET stripe_invoice_id = $1, status = $2 WHERE invoice_number = $3',
        [stripeInvoice.id, 'open', invoiceNumber]
      );

      await this.logBillingEvent(userId, 'invoice_generated', 
        `Invoice ${invoiceNumber} generated for $${total.toFixed(2)}`);

      return {
        invoice_number: invoiceNumber,
        subtotal,
        tax,
        total,
        line_items: lineItems,
        stripe_invoice_id: stripeInvoice.id
      };
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      throw error;
    }
  }

  // ============================================
  // ANALYTICS & REPORTING
  // ============================================

  async getRevenueDashboard() {
    // MRR (Monthly Recurring Revenue)
    const mrrResult = await db.query(`
      SELECT 
        COUNT(DISTINCT s.user_id) as total_customers,
        SUM(CASE WHEN sp.slug = 'free' THEN 1 ELSE 0 END) as free_customers,
        SUM(CASE WHEN sp.slug = 'pro' THEN 1 ELSE 0 END) as pro_customers,
        SUM(CASE WHEN sp.slug = 'enterprise' THEN 1 ELSE 0 END) as enterprise_customers,
        SUM(sp.price_monthly) as mrr
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.status = 'active'
    `);

    const mrr = mrrResult.rows[0].mrr || 0;
    const arr = mrr * 12;

    // Revenue by stream
    const streamsResult = await db.query(`
      SELECT rs.name, rs.slug, COALESCE(SUM(sa.revenue), 0) as revenue
      FROM revenue_streams rs
      LEFT JOIN stream_analytics sa ON rs.id = sa.stream_id
      WHERE sa.period_start >= DATE_TRUNC('month', CURRENT_DATE) OR sa.period_start IS NULL
      GROUP BY rs.id, rs.name, rs.slug
      ORDER BY revenue DESC
      LIMIT 10
    `);

    // Churn rate
    const churnResult = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'cancelled' AND cancelled_at >= CURRENT_DATE - INTERVAL '30 days') as churned,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_customers
      FROM subscriptions
    `);

    const churnRate = churnResult.rows[0].new_customers > 0
      ? (churnResult.rows[0].churned / churnResult.rows[0].new_customers) * 100
      : 0;

    return {
      mrr,
      arr,
      total_customers: mrrResult.rows[0].total_customers || 0,
      customers_by_plan: {
        free: mrrResult.rows[0].free_customers || 0,
        pro: mrrResult.rows[0].pro_customers || 0,
        enterprise: mrrResult.rows[0].enterprise_customers || 0
      },
      revenue_streams: streamsResult.rows,
      churn_rate: churnRate
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  async getOrCreatePrice(plan) {
    // Check if price already exists in Stripe
    if (plan.stripe_price_id) {
      try {
        return await this.stripe.prices.retrieve(plan.stripe_price_id);
      } catch (error) {
        console.warn('Stripe price not found, creating new one');
      }
    }

    // Create product if doesn't exist
    let product;
    if (plan.stripe_product_id) {
      product = await this.stripe.products.retrieve(plan.stripe_product_id);
    } else {
      product = await this.stripe.products.create({
        name: plan.name,
        description: plan.description
      });
      await db.query('UPDATE subscription_plans SET stripe_product_id = $1 WHERE id = $2', 
        [product.id, plan.id]);
    }

    // Create price
    const price = await this.stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(plan.price_monthly * 100), // Convert to cents
      currency: 'usd',
      recurring: { interval: 'month' }
    });

    // Save price ID
    await db.query('UPDATE subscription_plans SET stripe_price_id = $1 WHERE id = $2', 
      [price.id, plan.id]);

    return price;
  }

  async trackChurn(userId, churn_type = 'voluntary', reason = null) {
    const subResult = await db.query(`
      SELECT s.*, sp.price_monthly,
        EXTRACT(EPOCH FROM (NOW() - s.created_at))/2592000 as tenure_months
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [userId]);

    if (subResult.rows.length > 0) {
      const sub = subResult.rows[0];
      await db.query(`
        INSERT INTO churn_analytics 
        (user_id, churn_date, churn_reason, churn_type, lost_mrr, customer_tenure_months)
        VALUES ($1, NOW(), $2, $3, $4, $5)
      `, [userId, reason, churn_type, sub.price_monthly, Math.round(sub.tenure_months)]);
    }
  }

  async logBillingEvent(userId, event_type, description, metadata = {}) {
    await db.query(`
      INSERT INTO billing_history (user_id, event_type, description, metadata)
      VALUES ($1, $2, $3, $4)
    `, [userId, event_type, description, JSON.stringify(metadata)]);
  }
}

module.exports = new StripeRevenueService();
