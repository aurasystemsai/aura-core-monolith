// Shopify Billing Service
// Native Shopify billing using App Subscriptions API

const shopTokens = require('./shopTokens');

class ShopifyBillingService {
  constructor() {
    this.plans = {
      free: {
        id: 'free',
        name: 'Free',
        price: 0,
        features: ['100 AI runs/month', '50 products', '1 team member', 'Basic support']
      },
      professional: {
        id: 'professional',
        name: 'Professional',
        price: 99,
        features: ['Unlimited AI runs', 'Unlimited products', '5 team members', 'Priority support', 'Advanced analytics']
      },
      enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: 299,
        features: ['Unlimited everything', 'Unlimited team members', '24/7 dedicated support', 'Custom integrations', 'White-label options']
      }
    };
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
      mutation CreateAppSubscription($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!) {
        appSubscriptionCreate(
          name: $name
          lineItems: $lineItems
          returnUrl: $returnUrl
          test: true
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
    const returnUrl = `${backendBase}/api/billing/confirm?shop=${encodeURIComponent(shop)}`;

    const variables = {
      name: plan.name,
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
      const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
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
      const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
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
      if (amount === 99) planId = 'professional';
      if (amount === 299) planId = 'enterprise';

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
      const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
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
   * Get usage stats (mock for now - can be enhanced with real data)
   */
  async getUsageStats(shop) {
    // In production, query your database for actual usage
    return {
      ai_runs: Math.floor(Math.random() * 500),
      ai_runs_limit: 10000,
      products: Math.floor(Math.random() * 200),
      products_limit: 10000,
      team_members: 1,
      team_members_limit: 5
    };
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
}

module.exports = new ShopifyBillingService();
