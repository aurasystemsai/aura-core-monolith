/**
 * Stripe Setup Script
 * 
 * Creates products and prices in Stripe for all subscription tiers.
 * Run this once when setting up a new Stripe account.
 * 
 * Usage:
 *   node scripts/setup-stripe.js
 */

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Tier configurations
const TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for growing brands just getting started with customer data',
    monthlyPrice: 99,
    annualPrice: 950, // ~20% discount
    features: [
      '10,000 profiles',
      '100,000 events/month',
      '25 segments',
      'Email & SMS activation',
      'Basic analytics',
      'Community support',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'For scaling brands ready to unlock advanced customer insights',
    monthlyPrice: 299,
    annualPrice: 2870, // ~20% discount
    features: [
      '50,000 profiles',
      '1M events/month',
      'Unlimited segments',
      'Platform activations (15+)',
      'Predictive analytics',
      'Real-time sync',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced features for brands optimizing every customer interaction',
    monthlyPrice: 799,
    annualPrice: 7670, // ~20% discount
    features: [
      '250,000 profiles',
      '10M events/month',
      'ML predictions',
      'Custom integrations',
      'API access',
      'Advanced analytics',
      'Priority support',
      'Dedicated CSM',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Enterprise-grade platform with unlimited scale and white-glove support',
    monthlyPrice: 2499,
    annualPrice: 23990, // ~20% discount
    features: [
      'Unlimited profiles',
      'Unlimited events',
      'White-label branding',
      'Multi-tenant architecture',
      'Custom SLAs',
      '24/7 support',
      'Dedicated infrastructure',
      'Custom training',
    ],
  },
];

async function createStripeProducts() {
  console.log('🔧 Setting up Stripe products and prices...\n');
  
  const priceIds = {};
  
  for (const tier of TIERS) {
    console.log(`📦 Creating product: ${tier.name}`);
    
    try {
      // Create product
      const product = await stripe.products.create({
        name: `Aura CDP ${tier.name}`,
        description: tier.description,
        metadata: {
          tier: tier.id,
          features: JSON.stringify(tier.features),
        },
      });
      
      console.log(`   ✅ Product created: ${product.id}`);
      
      // Create monthly price
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: tier.monthlyPrice * 100, // Convert to cents
        currency: 'usd',
        recurring: {
          interval: 'month',
          usage_type: 'licensed',
        },
        metadata: {
          tier: tier.id,
          billing_cycle: 'monthly',
        },
      });
      
      console.log(`   ✅ Monthly price created: ${monthlyPrice.id} ($${tier.monthlyPrice}/mo)`);
      priceIds[`STRIPE_PRICE_${tier.id.toUpperCase()}_MONTHLY`] = monthlyPrice.id;
      
      // Create annual price
      const annualPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: tier.annualPrice * 100, // Convert to cents
        currency: 'usd',
        recurring: {
          interval: 'year',
          usage_type: 'licensed',
        },
        metadata: {
          tier: tier.id,
          billing_cycle: 'annual',
        },
      });
      
      const monthlyEquivalent = (tier.annualPrice / 12).toFixed(2);
      const savings = ((1 - (tier.annualPrice / (tier.monthlyPrice * 12))) * 100).toFixed(0);
      console.log(`   ✅ Annual price created: ${annualPrice.id} ($${tier.annualPrice}/yr = $${monthlyEquivalent}/mo, ${savings}% savings)`);
      priceIds[`STRIPE_PRICE_${tier.id.toUpperCase()}_ANNUAL`] = annualPrice.id;
      
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ Error creating ${tier.name}:`, error.message);
    }
  }
  
  // Print environment variables
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Stripe setup complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 Add these to your .env file:\n');
  
  Object.entries(priceIds).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

async function setupBillingMeters() {
  console.log('📊 Setting up usage-based billing meters...\n');
  
  const meters = [
    {
      event_name: 'profile_enrichment',
      display_name: 'Profile Enrichments',
      default_aggregation: { formula: 'sum' },
    },
    {
      event_name: 'event_tracked',
      display_name: 'Events Tracked',
      default_aggregation: { formula: 'sum' },
    },
    {
      event_name: 'segment_computation',
      display_name: 'Segment Computations',
      default_aggregation: { formula: 'sum' },
    },
    {
      event_name: 'audience_activation',
      display_name: 'Audience Activations',
      default_aggregation: { formula: 'sum' },
    },
    {
      event_name: 'email_sent',
      display_name: 'Emails Sent',
      default_aggregation: { formula: 'sum' },
    },
    {
      event_name: 'sms_sent',
      display_name: 'SMS Messages Sent',
      default_aggregation: { formula: 'sum' },
    },
    {
      event_name: 'data_export',
      display_name: 'Data Exports',
      default_aggregation: { formula: 'sum' },
    },
    {
      event_name: 'api_call',
      display_name: 'API Calls',
      default_aggregation: { formula: 'sum' },
    },
  ];
  
  for (const meter of meters) {
    try {
      const billingMeter = await stripe.billing.meters.create(meter);
      console.log(`   ✅ Created billing meter: ${meter.display_name} (${billingMeter.id})`);
    } catch (error) {
      // Meters might already exist
      if (error.code === 'resource_already_exists') {
        console.log(`   ⚠️  Billing meter already exists: ${meter.display_name}`);
      } else {
        console.error(`   ❌ Error creating ${meter.display_name}:`, error.message);
      }
    }
  }
  
  console.log('');
}

async function createWebhookEndpoint() {
  console.log('🔗 Creating webhook endpoint...\n');
  
  const webhookUrl = process.env.API_BASE_URL 
    ? `${process.env.API_BASE_URL}/webhooks/stripe`
    : 'https://your-domain.com/webhooks/stripe';
  
  try {
    const endpoint = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        'checkout.session.completed',
        'invoice.paid',
        'invoice.payment_failed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'customer.deleted',
      ],
    });
    
    console.log(`   ✅ Webhook endpoint created: ${endpoint.id}`);
    console.log(`   📍 URL: ${webhookUrl}`);
    console.log(`   🔐 Signing secret: ${endpoint.secret}`);
    console.log('\n   Add this to your .env file:');
    console.log(`   STRIPE_WEBHOOK_SECRET=${endpoint.secret}\n`);
    
  } catch (error) {
    if (error.code === 'url_invalid') {
      console.log(`   ⚠️  Cannot create webhook - invalid URL: ${webhookUrl}`);
      console.log('   Manual setup required:');
      console.log('   1. Go to https://dashboard.stripe.com/webhooks');
      console.log('   2. Click "Add endpoint"');
      console.log('   3. Enter your production URL');
      console.log('   4. Select the events listed above');
      console.log('   5. Copy the signing secret to STRIPE_WEBHOOK_SECRET\n');
    } else {
      console.error('   ❌ Error creating webhook:', error.message);
    }
  }
}

async function main() {
  console.log('\n🚀 Aura CDP - Stripe Setup\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Check for Stripe API key
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ Error: STRIPE_SECRET_KEY not found in environment variables');
    console.error('   Add your Stripe secret key to .env file and try again\n');
    process.exit(1);
  }
  
  // Determine if using test or live mode
  const isLiveMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_live_');
  const mode = isLiveMode ? 'LIVE' : 'TEST';
  const modeColor = isLiveMode ? '\x1b[31m' : '\x1b[33m'; // Red for live, yellow for test
  const resetColor = '\x1b[0m';
  
  console.log(`${modeColor}⚡ Running in ${mode} mode${resetColor}\n`);
  
  if (isLiveMode) {
    console.log('⚠️  WARNING: You are using a LIVE Stripe key!');
    console.log('   This will create real products and prices in your live account.\n');
    
    // Require confirmation for live mode
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    const answer = await new Promise(resolve => {
      readline.question('   Type "CONFIRM" to proceed: ', resolve);
    });
    readline.close();
    
    if (answer !== 'CONFIRM') {
      console.log('\n❌ Setup cancelled\n');
      process.exit(0);
    }
    
    console.log('');
  }
  
  try {
    await createStripeProducts();
    await setupBillingMeters();
    await createWebhookEndpoint();
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All done! Your Stripe account is configured.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
main();
