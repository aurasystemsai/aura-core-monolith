// Shopify Billing Service
// Native Shopify billing using App Subscriptions API

const shopTokens = require('./shopTokens');

class ShopifyBillingService {
  constructor() {
    this.plans = {
      free: {
        id: 'free',
        name: 'Starter',
        price: 0,
        credits: 10,
        features: ['Dashboard only', '10 lifetime AI credits', '1 team member', 'Community support']
      },
      growth: {
        id: 'growth',
        name: 'Growth',
        price: 49,
        credits: 5000,
        features: ['5,000 AI credits/month', 'All core SEO tools', 'Email & social tools', 'Unlimited products', 'Priority email support']
      },
      pro: {
        id: 'pro',
        name: 'Pro',
        price: 149,
        credits: 25000,
        features: ['25,000 AI credits/month', 'All Growth tools', 'Ads & analytics suite', 'Personalization engine', 'Priority support']
      },
      enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: 349,
        credits: -1,
        features: ['Unlimited AI credits', 'All Pro tools', 'Custom dashboards & exports', 'API & SDK access', 'Dedicated account manager', '24/7 SLA']
      }
    };

    // Credit top-up packs — one-time purchases
    this.creditPacks = [
      { id: 'credits-500',   credits: 500,   price: 9,   label: '500 credits' },
      { id: 'credits-2000',  credits: 2000,  price: 29,  label: '2,000 credits', save: '28%' },
      { id: 'credits-5000',  credits: 5000,  price: 59,  label: '5,000 credits', save: '34%' },
      { id: 'credits-15000', credits: 15000, price: 149, label: '15,000 credits', save: '45%' },
    ];
  }

  /**
   * Test charges are never billed; only allowed outside production or when explicitly enabled.
   */
  useTestCharges() {
    return process.env.NODE_ENV !== 'production' || process.env.SHOPIFY_TEST_CHARGES === 'true';
  }

  /**
   * Create app subscription (recurring charge)
   */
  async createSubscription(shop, planId) {
    const plan = this.plans[planId];
    if (!plan) {
      throw new Error('Invalid plan ID');
    }

    if (planId === 'free') {
      return { plan_id: 'free', status: 'active', message: 'Free plan activated' };
    }

    const token = shopTokens.getToken(shop);
    if (!token) {
      throw new Error('Shop not connected. Please reconnect your Shopify store.');
    }

    // GraphQL mutation to create app subscription
    const mutation = `
      mutation CreateAppSubscription($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!, $test: Boolean!) {
        appSubscriptionCreate(
          name: $name
          lineItems: $lineItems
          returnUrl: $returnUrl
          test: $test
        ) {
          appSubscription {
            id
            status
          }
          confirmationUrl
          userErrors {
            field
            message
          }
        }
      }
    `;

    const backendBase = process.env.APP_URL || process.env.HOST_URL || 'https://aura-core-monolith.onrender.com';
    const returnUrl = `${backendBase}/api/billing/confirm?shop=${encodeURIComponent(shop)}&plan=${encodeURIComponent(planId)}`;

    const variables = {
      name: plan.name,
      test: this.useTestCharges(),
      returnUrl,
      lineItems: [{
        plan: {
          appRecurringPricingDetails: {
            price: { amount: plan.price, currencyCode: 'USD' }
          }
        }
      }]
    };

    try {
      const response = await fetch(`https://${shop}/admin/api/2025-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token
        },
        body: JSON.stringify({ query: mutation, variables })
      });

      const result = await response.json();

      // Top-level GraphQL errors (auth failure, bad scope, etc.)
      if (result.errors && result.errors.length > 0) {
        const msg = result.errors.map(e => e.message).join('; ');
        console.error('[Billing] GraphQL top-level errors:', msg);
        throw new Error(`Shopify API error: ${msg}`);
      }

      if (!result.data || !result.data.appSubscriptionCreate) {
        console.error('[Billing] Unexpected response:', JSON.stringify(result));
        throw new Error('Unexpected response from Shopify billing API. Check app scopes include write_own_subscription_contracts.');
      }

      if (result.data.appSubscriptionCreate.userErrors?.length > 0) {
        throw new Error(result.data.appSubscriptionCreate.userErrors[0].message);
      }

      return {
        success: true,
        confirmationUrl: result.data.appSubscriptionCreate.confirmationUrl,
        subscriptionId: result.data.appSubscriptionCreate.appSubscription?.id,
        message: 'Please approve the charge in Shopify'
      };
    } catch (error) {
      console.error('Shopify billing error:', error);
      throw error;
    }
  }

  /**
   * Get active subscription for shop
   */
  async getSubscription(shop) {
    const token = shopTokens.getToken(shop);
    if (!token) {
      return { plan_id: 'free', status: 'active' };
    }

    // GraphQL query to get current subscriptions
    const query = `
      {
        currentAppInstallation {
          activeSubscriptions {
            id
            name
            status
            lineItems {
              plan {
                pricingDetails {
                  ... on AppRecurringPricing {
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
            createdAt
            currentPeriodEnd
          }
        }
      }
    `;

    try {
      const response = await fetch(`https://${shop}/admin/api/2025-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token
        },
        body: JSON.stringify({ query })
      });

      const result = await response.json();
      const subscriptions = result.data?.currentAppInstallation?.activeSubscriptions || [];

      if (subscriptions.length === 0) {
        return { plan_id: 'free', status: 'active' };
      }

      const subscription = subscriptions[0];
      const amount = parseFloat(subscription.lineItems[0]?.plan?.pricingDetails?.price?.amount || 0);

      // Map price to plan ID
      let planId = 'free';
      if (amount >= 349) planId = 'enterprise';
      else if (amount >= 149) planId = 'pro';
      else if (amount >= 49) planId = 'growth';

      return {
        plan_id: planId,
        status: subscription.status.toLowerCase(),
        name: this.plans[planId]?.name || 'Unknown',
        price: amount,
        current_period_end: subscription.currentPeriodEnd,
        subscription_id: subscription.id
      };
    } catch (error) {
      console.error('Get subscription error:', error);
      return { plan_id: 'free', status: 'active' };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(shop, subscriptionId) {
    const token = shopTokens.getToken(shop);
    if (!token) {
      throw new Error('Shop not connected');
    }

    const mutation = `
      mutation CancelAppSubscription($id: ID!) {
        appSubscriptionCancel(id: $id) {
          appSubscription {
            id
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = { id: subscriptionId };

    try {
      const response = await fetch(`https://${shop}/admin/api/2025-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token
        },
        body: JSON.stringify({ query: mutation, variables })
      });

      const result = await response.json();

      if (result.data?.appSubscriptionCancel?.userErrors?.length > 0) {
        throw new Error(result.data.appSubscriptionCancel.userErrors[0].message);
      }

      return { success: true, message: 'Subscription cancelled' };
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  }

  /**
   * Get plan details
   */
  getPlan(planId) {
    return this.plans[planId] || this.plans.free;
  }

  /**
   * List all available plans
   */
  listPlans() {
    return Object.values(this.plans);
  }

  /**
   * List credit top-up packs
   */
  listCreditPacks() {
    return this.creditPacks;
  }

  /**
   * Confirms with Shopify that a one-time credit-pack charge was really approved.
   * Returns the pack it paid for (from our own catalogue), or null.
   */
  async verifyCreditPackCharge(shop, chargeId) {
    const token = shopTokens.getToken(shop);
    if (!token || !/^\d+$/.test(String(chargeId || ''))) return null;
    const query = 'query($id: ID!) { node(id: $id) { ... on AppPurchaseOneTime { id name status test price { amount } } } }';
    try {
      const response = await fetch(`https://${shop}/admin/api/2025-10/graphql.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
        body: JSON.stringify({ query, variables: { id: `gid://shopify/AppPurchaseOneTime/${chargeId}` } }),
      });
      const charge = (await response.json()).data?.node;
      if (!charge || charge.status !== 'ACTIVE') return null;
      if (charge.test && !this.useTestCharges()) return null;
      const amount = Number(charge.price?.amount);
      const pack = this.creditPacks.find(p => charge.name === `AURA Credit Top-Up: ${p.label}` && amount === p.price);
      return pack ? { pack, chargeId: charge.id } : null;
    } catch (error) {
      console.error('Verify credit charge error:', error.message);
      return null;
    }
  }

  /**
   * Purchase a credit pack (one-time app charge via Shopify)
   */
  async purchaseCreditPack(shop, packId) {
    const pack = this.creditPacks.find(p => p.id === packId);
    if (!pack) throw new Error('Invalid credit pack ID');

    const token = shopTokens.getToken(shop);
    if (!token) throw new Error('Shop not connected. Please reconnect your Shopify store.');

    const mutation = `
      mutation CreateOneTimeCharge($name: String!, $price: MoneyInput!, $returnUrl: URL!, $test: Boolean!) {
        appPurchaseOneTimeCreate(
          name: $name
          price: $price
          returnUrl: $returnUrl
          test: $test
        ) {
          appPurchaseOneTime {
            id
            status
          }
          confirmationUrl
          userErrors {
            field
            message
          }
        }
      }
    `;

    const backendBase = process.env.APP_URL || process.env.HOST_URL || 'https://aura-core-monolith.onrender.com';
    const returnUrl = `${backendBase}/api/billing/confirm?shop=${encodeURIComponent(shop)}&pack=${encodeURIComponent(pack.id)}`;

    const variables = {
      name: `AURA Credit Top-Up: ${pack.label}`,
      returnUrl,
      price: { amount: pack.price, currencyCode: 'USD' },
      test: this.useTestCharges(),
    };

    try {
      const response = await fetch(`https://${shop}/admin/api/2025-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token
        },
        body: JSON.stringify({ query: mutation, variables })
      });

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors.map(e => e.message).join('; '));
      }

      const data = result.data?.appPurchaseOneTimeCreate;
      if (data?.userErrors?.length > 0) {
        throw new Error(data.userErrors[0].message);
      }

      return {
        success: true,
        confirmationUrl: data.confirmationUrl,
        chargeId: data.appPurchaseOneTime?.id,
        credits: pack.credits,
        message: 'Approve the charge in Shopify to receive your credits'
      };
    } catch (error) {
      console.error('Credit pack purchase error:', error);
      throw error;
    }
  }
}

module.exports = new ShopifyBillingService();
