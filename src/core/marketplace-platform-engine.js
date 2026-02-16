/**
 * Marketplace Platform Engine
 * 
 * App marketplace infrastructure for third-party developers
 * Foundation for $600M+ app ecosystem revenue stream
 * 
 * Features:
 * - App registry and discovery
 * - OAuth integration flow
 * - Webhook management
 * - Revenue share calculation (25-30%)
 * - App analytics and ratings
 * - Developer portal
 * - Certification workflow
 */

// In-memory storage (Replace with PostgreSQL in production)
const apps = new Map();
const installations = new Map();
const developers = new Map();
const appRevenue = new Map();
const webhookEvents = new Map();
const ratings = new Map();

/**
 * App Categories
 */
const APP_CATEGORIES = [
  'email_marketing',
  'sms_marketing',
  'review_management',
  'influencer_marketing',
  'social_commerce',
  'loyalty_rewards',
  'subscription_management',
  'affiliate_marketing',
  'print_on_demand',
  'inventory_management',
  'shipping_fulfillment',
  'returns_management',
  'photography_creative',
  'analytics_reporting',
  'customer_support',
  'content_generation',
  'upsell_crosssell',
  'abandoned_cart',
  'personalization',
  'ab_testing',
];

/**
 * Marketplace Commission Rates
 */
const COMMISSION_RATES = {
  standard: 0.25,      // 25% for most apps
  featured: 0.30,      // 30% for featured placement
  enterprise: 0.20,    // 20% for enterprise apps
};

/**
 * App Listing Fees
 */
const LISTING_FEES = {
  basic: 299,          // One-time listing fee
  featured: 5000,      // Monthly featured placement (minimum)
  certification: 10000, // Annual certification
};

/**
 * Register a new developer account
 */
function registerDeveloper(data) {
  const devId = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const developer = {
    id: devId,
    companyName: data.companyName,
    contactName: data.contactName,
    contactEmail: data.contactEmail,
    website: data.website,
    
    // API credentials
    api: {
      clientId: generateClientId(),
      clientSecret: generateClientSecret(),
      webhookSecret: generateWebhookSecret(),
    },
    
    // Status
    status: 'active',
    verified: false,
    certified: false,
    
    // Apps published
    apps: [],
    
    // Revenue tracking
    revenue: {
      lifetime: 0,
      thisMonth: 0,
    },
    
    // Metadata
    metadata: data.metadata || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  developers.set(devId, developer);
  return developer;
}

/**
 * Create a new app listing
 * 
 * @param {string} developerId
 * @param {object} appData
 * @returns {object} Created app
 */
function createApp(developerId, appData) {
  const developer = getDeveloper(developerId);
  const appId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const app = {
    id: appId,
    developerId,
    
    // Basic info
    name: appData.name,
    tagline: appData.tagline,
    description: appData.description,
    category: appData.category,
    
    // Media
    icon: appData.icon,
    screenshots: appData.screenshots || [],
    videoUrl: appData.videoUrl,
    
    // Pricing
    pricing: {
      type: appData.pricingType || 'subscription', // subscription, one_time, usage_based, free
      tiers: appData.pricingTiers || [],
      freeTrialDays: appData.freeTrialDays || 0,
    },
    
    // Technical configuration
    oauth: {
      redirectUrls: appData.redirectUrls || [],
      scopes: appData.scopes || [],
    },
    
    webhooks: {
      url: appData.webhookUrl,
      events: appData.webhookEvents || [],
      secret: developer.api.webhookSecret,
    },
    
    // API access
    api: {
      baseUrl: appData.apiBaseUrl,
      version: appData.apiVersion || '1.0',
    },
    
    // Marketplace settings
    marketplace: {
      listed: false,
      featured: false,
      certified: false,
      commissionRate: COMMISSION_RATES.standard,
    },
    
    // Stats
    stats: {
      installations: 0,
      activeInstallations: 0,
      totalRevenue: 0,
      averageRating: 0,
      totalRatings: 0,
    },
    
    // Status
    status: 'draft', // draft, review, approved, rejected, published
    reviewNotes: null,
    
    // Metadata
    metadata: appData.metadata || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: null,
  };
  
  apps.set(appId, app);
  
  // Update developer
  developer.apps.push(appId);
  developer.updatedAt = new Date().toISOString();
  developers.set(developerId, developer);
  
  return app;
}

/**
 * Submit app for review
 */
function submitAppForReview(appId) {
  const app = getApp(appId);
  
  if (app.status !== 'draft') {
    throw new Error('App must be in draft status to submit for review');
  }
  
  app.status = 'review';
  app.updatedAt = new Date().toISOString();
  apps.set(appId, app);
  
  // Trigger review workflow (would send to admin team)
  return app;
}

/**
 * Approve app (admin function)
 */
function approveApp(appId, reviewNotes = null) {
  const app = getApp(appId);
  
  app.status = 'approved';
  app.reviewNotes = reviewNotes;
  app.updatedAt = new Date().toISOString();
  apps.set(appId, app);
  
  return app;
}

/**
 * Publish app to marketplace
 */
function publishApp(appId) {
  const app = getApp(appId);
  
  if (app.status !== 'approved') {
    throw new Error('App must be approved before publishing');
  }
  
  app.status = 'published';
  app.marketplace.listed = true;
  app.publishedAt = new Date().toISOString();
  app.updatedAt = new Date().toISOString();
  apps.set(appId, app);
  
  return app;
}

/**
 * Install app for a customer
 * 
 * @param {string} customerId
 * @param {string} appId
 * @param {string} tier - Pricing tier selected
 * @returns {object} Installation record
 */
function installApp(customerId, appId, tier = null) {
  const app = getApp(appId);
  
  if (app.status !== 'published') {
    throw new Error('App must be published to install');
  }
  
  const installationId = `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Determine pricing
  const pricingTier = tier 
    ? app.pricing.tiers.find(t => t.name === tier)
    : app.pricing.tiers[0];
  
  if (app.pricing.type === 'subscription' && !pricingTier) {
    throw new Error('Pricing tier required for subscription apps');
  }
  
  const installation = {
    id: installationId,
    customerId,
    appId,
    
    // Pricing
    pricingTier: pricingTier ? pricingTier.name : null,
    monthlyPrice: pricingTier ? pricingTier.price : 0,
    
    // OAuth tokens (would be populated during OAuth flow)
    oauth: {
      accessToken: null,
      refreshToken: null,
      scope: app.oauth.scopes.join(' '),
      expiresAt: null,
    },
    
    // Usage tracking (for usage-based pricing)
    usage: {
      currentPeriod: getCurrentBillingPeriod(),
      events: {},
      totalCost: 0,
    },
    
    // Status
    status: 'active',
    trialEndsAt: app.pricing.freeTrialDays > 0
      ? new Date(Date.now() + app.pricing.freeTrialDays * 24 * 60 * 60 * 1000).toISOString()
      : null,
    
    // Metadata
    installedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  installations.set(installationId, installation);
  
  // Update app stats
  app.stats.installations++;
  app.stats.activeInstallations++;
  app.updatedAt = new Date().toISOString();
  apps.set(appId, app);
  
  // Trigger webhook to app developer
  triggerWebhook(appId, 'app.installed', {
    customerId,
    installationId,
    tier: pricingTier ? pricingTier.name : null,
  });
  
  return installation;
}

/**
 * Uninstall app
 */
function uninstallApp(installationId) {
  const installation = getInstallation(installationId);
  const app = getApp(installation.appId);
  
  installation.status = 'uninstalled';
  installation.uninstalledAt = new Date().toISOString();
  installation.updatedAt = new Date().toISOString();
  installations.set(installationId, installation);
  
  // Update app stats
  app.stats.activeInstallations--;
  app.updatedAt = new Date().toISOString();
  apps.set(app.id, app);
  
  // Trigger webhook
  triggerWebhook(app.id, 'app.uninstalled', {
    customerId: installation.customerId,
    installationId,
  });
  
  return installation;
}

/**
 * Track app usage and calculate revenue share
 * 
 * @param {string} installationId
 * @param {number} revenue - Revenue generated this period
 */
function trackAppRevenue(installationId, revenue) {
  const installation = getInstallation(installationId);
  const app = getApp(installation.appId);
  const developer = getDeveloper(app.developerId);
  
  const period = getCurrentBillingPeriod();
  const key = `${app.id}_${period}`;
  
  // Calculate marketplace commission
  const commission = revenue * app.marketplace.commissionRate;
  const developerEarnings = revenue - commission;
  
  // Create or update revenue record
  if (!appRevenue.has(key)) {
    appRevenue.set(key, {
      appId: app.id,
      developerId: app.developerId,
      period,
      installations: [],
      totalRevenue: 0,
      marketplaceCommission: 0,
      developerEarnings: 0,
      transactions: [],
    });
  }
  
  const revenueRecord = appRevenue.get(key);
  
  revenueRecord.transactions.push({
    installationId,
    customerId: installation.customerId,
    revenue,
    commission,
    developerEarnings,
    timestamp: new Date().toISOString(),
  });
  
  revenueRecord.totalRevenue += revenue;
  revenueRecord.marketplaceCommission += commission;
  revenueRecord.developerEarnings += developerEarnings;
  
  if (!revenueRecord.installations.includes(installationId)) {
    revenueRecord.installations.push(installationId);
  }
  
  appRevenue.set(key, revenueRecord);
  
  // Update app stats
  app.stats.totalRevenue += revenue;
  app.updatedAt = new Date().toISOString();
  apps.set(app.id, app);
  
  // Update developer revenue
  developer.revenue.lifetime += developerEarnings;
  developer.revenue.thisMonth += developerEarnings;
  developer.updatedAt = new Date().toISOString();
  developers.set(app.developerId, developer);
  
  return revenueRecord;
}

/**
 * Get app revenue report
 */
function getAppRevenueReport(appId, period = null) {
  period = period || getCurrentBillingPeriod();
  const key = `${appId}_${period}`;
  const app = getApp(appId);
  
  const revenueData = appRevenue.get(key) || {
    appId,
    developerId: app.developerId,
    period,
    installations: [],
    totalRevenue: 0,
    marketplaceCommission: 0,
    developerEarnings: 0,
    transactions: [],
  };
  
  return {
    app: {
      id: app.id,
      name: app.name,
    },
    period,
    revenue: {
      gross: revenueData.totalRevenue,
      marketplaceCommission: revenueData.marketplaceCommission,
      developerNet: revenueData.developerEarnings,
      commissionRate: app.marketplace.commissionRate * 100,
    },
    installations: {
      paying: revenueData.installations.length,
      active: app.stats.activeInstallations,
      total: app.stats.installations,
    },
    transactions: revenueData.transactions,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get developer dashboard analytics
 */
function getDeveloperAnalytics(developerId) {
  const developer = getDeveloper(developerId);
  const developerApps = developer.apps.map(appId => getApp(appId));
  
  const currentPeriod = getCurrentBillingPeriod();
  let totalInstallations = 0;
  let totalActiveInstallations = 0;
  let totalRevenue = 0;
  let totalEarnings = 0;
  
  for (const app of developerApps) {
    totalInstallations += app.stats.installations;
    totalActiveInstallations += app.stats.activeInstallations;
    
    const appRev = getAppRevenueReport(app.id, currentPeriod);
    totalRevenue += appRev.revenue.gross;
    totalEarnings += appRev.revenue.developerNet;
  }
  
  return {
    developer: {
      id: developer.id,
      company: developer.companyName,
      verified: developer.verified,
      certified: developer.certified,
    },
    currentPeriod: {
      period: currentPeriod,
      revenue: totalRevenue,
      earnings: totalEarnings,
      activeInstallations: totalActiveInstallations,
    },
    lifetime: {
      apps: developer.apps.length,
      totalInstallations,
      totalRevenue: developer.revenue.lifetime,
    },
    apps: developerApps.map(app => ({
      id: app.id,
      name: app.name,
      status: app.status,
      installations: app.stats.activeInstallations,
      rating: app.stats.averageRating,
      monthlyRevenue: getAppRevenueReport(app.id, currentPeriod).revenue.gross,
    })),
  };
}

/**
 * Search/browse apps in marketplace
 */
function searchApps(filters = {}) {
  let results = Array.from(apps.values()).filter(app => app.marketplace.listed);
  
  // Filter by category
  if (filters.category) {
    results = results.filter(app => app.category === filters.category);
  }
  
  // Filter by pricing type
  if (filters.pricingType) {
    results = results.filter(app => app.pricing.type === filters.pricingType);
  }
  
  // Filter by certification
  if (filters.certified) {
    results = results.filter(app => app.marketplace.certified);
  }
  
  // Filter by featured
  if (filters.featured) {
    results = results.filter(app => app.marketplace.featured);
  }
  
  // Search query
  if (filters.query) {
    const query = filters.query.toLowerCase();
    results = results.filter(app => 
      app.name.toLowerCase().includes(query) ||
      app.tagline.toLowerCase().includes(query) ||
      app.description.toLowerCase().includes(query)
    );
  }
  
  // Sort
  const sortBy = filters.sortBy || 'popular';
  if (sortBy === 'popular') {
    results.sort((a, b) => b.stats.activeInstallations - a.stats.activeInstallations);
  } else if (sortBy === 'rating') {
    results.sort((a, b) => b.stats.averageRating - a.stats.averageRating);
  } else if (sortBy === 'newest') {
    results.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }
  
  // Pagination
  const limit = filters.limit || 20;
  const offset = filters.offset || 0;
  const paginatedResults = results.slice(offset, offset + limit);
  
  return {
    apps: paginatedResults.map(formatAppForListing),
    total: results.length,
    offset,
    limit,
  };
}

/**
 * Rate an app
 */
function rateApp(customerId, appId, rating, review = null) {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
  
  const ratingId = `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const app = getApp(appId);
  
  const ratingData = {
    id: ratingId,
    customerId,
    appId,
    rating,
    review,
    createdAt: new Date().toISOString(),
  };
  
  ratings.set(ratingId, ratingData);
  
  // Update app average rating
  app.stats.totalRatings++;
  app.stats.averageRating = calculateAverageRating(appId);
  app.updatedAt = new Date().toISOString();
  apps.set(appId, app);
  
  return ratingData;
}

/**
 * Calculate average rating for app
 */
function calculateAverageRating(appId) {
  const appRatings = Array.from(ratings.values()).filter(r => r.appId === appId);
  if (appRatings.length === 0) return 0;
  
  const sum = appRatings.reduce((total, r) => total + r.rating, 0);
  return Math.round((sum / appRatings.length) * 10) / 10;
}

/**
 * Trigger webhook to app
 */
function triggerWebhook(appId, event, payload) {
  const app = getApp(appId);
  
  if (!app.webhooks.url || !app.webhooks.events.includes(event)) {
    return;
  }
  
  const webhookId = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const webhookEvent = {
    id: webhookId,
    appId,
    event,
    payload,
    url: app.webhooks.url,
    status: 'pending',
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
  
  webhookEvents.set(webhookId, webhookEvent);
  
  // In production, this would trigger async delivery
  // For now, just mark as delivered
  webhookEvent.status = 'delivered';
  webhookEvent.deliveredAt = new Date().toISOString();
  webhookEvents.set(webhookId, webhookEvent);
  
  return webhookEvent;
}

/**
 * Get marketplace analytics (admin)
 */
function getMarketplaceAnalytics() {
  const allApps = Array.from(apps.values());
  const publishedApps = allApps.filter(app => app.status === 'published');
  const currentPeriod = getCurrentBillingPeriod();
  
  let totalRevenue = 0;
  let totalCommission = 0;
  let totalInstallations = 0;
  
  for (const app of publishedApps) {
    const appRev = getAppRevenueReport(app.id, currentPeriod);
    totalRevenue += appRev.revenue.gross;
    totalCommission += appRev.revenue.marketplaceCommission;
    totalInstallations += app.stats.activeInstallations;
  }
  
  // Category distribution
  const categoryDistribution = {};
  for (const app of publishedApps) {
    categoryDistribution[app.category] = (categoryDistribution[app.category] || 0) + 1;
  }
  
  return {
    period: currentPeriod,
    apps: {
      total: allApps.length,
      published: publishedApps.length,
      inReview: allApps.filter(a => a.status === 'review').length,
      featured: publishedApps.filter(a => a.marketplace.featured).length,
      certified: publishedApps.filter(a => a.marketplace.certified).length,
    },
    developers: {
      total: developers.size,
      verified: Array.from(developers.values()).filter(d => d.verified).length,
      certified: Array.from(developers.values()).filter(d => d.certified).length,
    },
    installations: {
      total: totalInstallations,
      averagePerApp: publishedApps.length > 0 ? Math.round(totalInstallations / publishedApps.length) : 0,
    },
    revenue: {
      gross: totalRevenue,
      marketplaceCommission: totalCommission,
      developerEarnings: totalRevenue - totalCommission,
      commissionRate: totalRevenue > 0 ? (totalCommission / totalRevenue * 100).toFixed(1) : 0,
    },
    categories: categoryDistribution,
  };
}

// Helper functions
function getApp(appId) {
  const app = apps.get(appId);
  if (!app) throw new Error(`App not found: ${appId}`);
  return app;
}

function getDeveloper(devId) {
  const dev = developers.get(devId);
  if (!dev) throw new Error(`Developer not found: ${devId}`);
  return dev;
}

function getInstallation(installationId) {
  const inst = installations.get(installationId);
  if (!inst) throw new Error(`Installation not found: ${installationId}`);
  return inst;
}

function formatAppForListing(app) {
  return {
    id: app.id,
    name: app.name,
    tagline: app.tagline,
    category: app.category,
    icon: app.icon,
    screenshots: app.screenshots.slice(0, 3),
    pricing: {
      type: app.pricing.type,
      startingPrice: app.pricing.tiers[0]?.price || 0,
    },
    stats: {
      installations: app.stats.activeInstallations,
      rating: app.stats.averageRating,
      totalRatings: app.stats.totalRatings,
    },
    featured: app.marketplace.featured,
    certified: app.marketplace.certified,
  };
}

function getCurrentBillingPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function generateClientId() {
  return `client_${Math.random().toString(36).substr(2)}${Math.random().toString(36).substr(2)}`;
}

function generateClientSecret() {
  return `secret_${Math.random().toString(36).substr(2)}${Math.random().toString(36).substr(2)}${Math.random().toString(36).substr(2)}`;
}

function generateWebhookSecret() {
  return `whsec_${Math.random().toString(36).substr(2)}${Math.random().toString(36).substr(2)}`;
}

// Export functions
module.exports = {
  // Developer management
  registerDeveloper,
  getDeveloper,
  getDeveloperAnalytics,
  
  // App management
  createApp,
  getApp,
  submitAppForReview,
  approveApp,
  publishApp,
  
  // Installation management
  installApp,
  uninstallApp,
  getInstallation,
  
  // Revenue tracking
  trackAppRevenue,
  getAppRevenueReport,
  
  // Discovery
  searchApps,
  
  // Ratings
  rateApp,
  
  // Analytics
  getMarketplaceAnalytics,
  
  // Constants
  APP_CATEGORIES,
  COMMISSION_RATES,
  LISTING_FEES,
};
