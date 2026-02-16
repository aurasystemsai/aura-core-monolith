/**
 * White-Label Configuration Engine
 * 
 * Enables agencies to rebrand the platform as their own
 * Foundation for $40M+ white-label revenue stream
 * 
 * Features:
 * - Custom branding (logo, colors, fonts, domain)
 * - Sub-account management (agency → client hierarchy)
 * - Revenue share tracking
 * - Partner analytics and reporting
 * - Email template customization
 * - API key management per partner
 */

// In-memory storage (Replace with PostgreSQL in production)
const partners = new Map();
const clients = new Map();
const revenueShares = new Map();

/**
 * Partner License Tiers
 */
const PARTNER_TIERS = {
  basic: {
    name: 'Basic Agency',
    monthlyFee: 2999,
    maxClients: 10,
    features: {
      customBranding: true,
      customDomain: false,
      whiteLabel: true,
      apiAccess: true,
      revenueShare: 0.15, // Agency keeps 15% of client overages
      coMarketing: false,
      prioritySupport: false,
    },
  },
  professional: {
    name: 'Professional Agency',
    monthlyFee: 5999,
    maxClients: 50,
    features: {
      customBranding: true,
      customDomain: true,
      whiteLabel: true,
      apiAccess: true,
      revenueShare: 0.20, // Agency keeps 20% of client overages
      coMarketing: true,
      prioritySupport: true,
      dedicatedCSM: false,
    },
  },
  enterprise: {
    name: 'Enterprise Agency',
    monthlyFee: 9999,
    maxClients: 999999, // Unlimited
    features: {
      customBranding: true,
      customDomain: true,
      whiteLabel: true,
      apiAccess: true,
      revenueShare: 0.25, // Agency keeps 25% of client overages
      coMarketing: true,
      prioritySupport: true,
      dedicatedCSM: true,
      customIntegrations: true,
      sla: true,
    },
  },
};

/**
 * Create a new partner (agency)
 * 
 * @param {object} data - Partner configuration
 * @returns {object} Created partner
 */
function createPartner(data) {
  const partnerId = `partner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const partner = {
    id: partnerId,
    type: 'white_label_agency',
    tier: data.tier || 'basic',
    status: 'active',
    
    // Company info
    companyName: data.companyName,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    
    // Branding configuration
    branding: {
      platformName: data.platformName || data.companyName,
      logo: data.logo || null,
      favicon: data.favicon || null,
      primaryColor: data.primaryColor || '#0066CC',
      secondaryColor: data.secondaryColor || '#00CC66',
      accentColor: data.accentColor || '#FF6600',
      fontFamily: data.fontFamily || 'Inter, sans-serif',
      customCSS: data.customCSS || null,
    },
    
    // Domain configuration
    domains: {
      custom: data.customDomain || null,
      subdomain: data.subdomain || slugify(data.companyName),
      ssl: data.sslEnabled !== false,
    },
    
    // Features based on tier
    features: PARTNER_TIERS[data.tier || 'basic'].features,
    
    // API credentials
    api: {
      publicKey: generateApiKey('pk'),
      secretKey: generateApiKey('sk'),
      webhookSecret: generateWebhookSecret(),
    },
    
    // Revenue tracking
    billing: {
      monthlyFee: PARTNER_TIERS[data.tier || 'basic'].monthlyFee,
      revenueSharePercent: PARTNER_TIERS[data.tier || 'basic'].features.revenueShare,
      invoiceEmail: data.invoiceEmail || data.contactEmail,
      paymentMethod: data.paymentMethod || null,
    },
    
    // Client management
    clients: [],
    stats: {
      totalClients: 0,
      activeClients: 0,
      totalRevenue: 0,
      partnerEarnings: 0,
    },
    
    // Metadata
    metadata: data.metadata || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  partners.set(partnerId, partner);
  return partner;
}

/**
 * Get partner by ID
 */
function getPartner(partnerId) {
  const partner = partners.get(partnerId);
  if (!partner) {
    throw new Error(`Partner not found: ${partnerId}`);
  }
  return partner;
}

/**
 * Update partner configuration
 */
function updatePartner(partnerId, updates) {
  const partner = getPartner(partnerId);
  
  // Update branding
  if (updates.branding) {
    partner.branding = { ...partner.branding, ...updates.branding };
  }
  
  // Update domains
  if (updates.domains) {
    partner.domains = { ...partner.domains, ...updates.domains };
  }
  
  // Update tier (recomputes features and pricing)
  if (updates.tier && updates.tier !== partner.tier) {
    partner.tier = updates.tier;
    partner.features = PARTNER_TIERS[updates.tier].features;
    partner.billing.monthlyFee = PARTNER_TIERS[updates.tier].monthlyFee;
    partner.billing.revenueSharePercent = PARTNER_TIERS[updates.tier].features.revenueShare;
  }
  
  // Update other fields
  const allowedUpdates = ['companyName', 'contactEmail', 'contactPhone', 'metadata'];
  for (const field of allowedUpdates) {
    if (updates[field] !== undefined) {
      partner[field] = updates[field];
    }
  }
  
  partner.updatedAt = new Date().toISOString();
  partners.set(partnerId, partner);
  
  return partner;
}

/**
 * Create a client under a partner
 * 
 * @param {string} partnerId - Parent partner
 * @param {object} clientData - Client configuration
 * @returns {object} Created client
 */
function createClient(partnerId, clientData) {
  const partner = getPartner(partnerId);
  
  // Check client limit
  if (partner.stats.totalClients >= PARTNER_TIERS[partner.tier].maxClients) {
    throw new Error(`Partner has reached maximum client limit for ${partner.tier} tier`);
  }
  
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const client = {
    id: clientId,
    partnerId,
    
    // Client info
    businessName: clientData.businessName,
    contactEmail: clientData.contactEmail,
    contactName: clientData.contactName,
    
    // Subscription tier
    tier: clientData.tier || 'growth',
    
    // Inherited branding from partner
    inheritBranding: clientData.inheritBranding !== false,
    branding: clientData.inheritBranding !== false 
      ? { ...partner.branding }
      : clientData.branding || {},
    
    // Usage tracking
    usage: {
      currentPeriod: getCurrentBillingPeriod(),
      baseCharges: 0,
      overageCharges: 0,
      totalCharges: 0,
    },
    
    // Revenue share to partner
    revenueShare: {
      enabled: true,
      percent: partner.billing.revenueSharePercent,
      totalEarned: 0,
    },
    
    // Status
    status: 'active',
    
    // Metadata
    metadata: clientData.metadata || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  clients.set(clientId, client);
  
  // Update partner stats
  partner.clients.push(clientId);
  partner.stats.totalClients++;
  partner.stats.activeClients++;
  partner.updatedAt = new Date().toISOString();
  partners.set(partnerId, partner);
  
  return client;
}

/**
 * Get client by ID
 */
function getClient(clientId) {
  const client = clients.get(clientId);
  if (!client) {
    throw new Error(`Client not found: ${clientId}`);
  }
  return client;
}

/**
 * List all clients for a partner
 */
function listPartnerClients(partnerId) {
  const partner = getPartner(partnerId);
  return partner.clients.map(clientId => clients.get(clientId));
}

/**
 * Track client usage and calculate revenue share
 * 
 * @param {string} clientId
 * @param {number} baseCharges - Base subscription amount
 * @param {number} overageCharges - Usage-based charges
 */
function trackClientUsage(clientId, baseCharges, overageCharges) {
  const client = getClient(clientId);
  const partner = getPartner(client.partnerId);
  
  const period = getCurrentBillingPeriod();
  
  // Update client usage
  client.usage = {
    currentPeriod: period,
    baseCharges,
    overageCharges,
    totalCharges: baseCharges + overageCharges,
  };
  
  // Calculate partner revenue share (only on overages)
  if (client.revenueShare.enabled && overageCharges > 0) {
    const partnerEarnings = overageCharges * client.revenueShare.percent;
    client.revenueShare.totalEarned += partnerEarnings;
    
    // Update partner stats
    partner.stats.totalRevenue += overageCharges;
    partner.stats.partnerEarnings += partnerEarnings;
    partners.set(partner.id, partner);
    
    // Record revenue share transaction
    recordRevenueShare(partner.id, clientId, period, overageCharges, partnerEarnings);
  }
  
  client.updatedAt = new Date().toISOString();
  clients.set(clientId, client);
  
  return client;
}

/**
 * Record revenue share transaction
 */
function recordRevenueShare(partnerId, clientId, period, revenue, partnerShare) {
  const key = `${partnerId}_${period}`;
  
  if (!revenueShares.has(key)) {
    revenueShares.set(key, {
      partnerId,
      period,
      clients: [],
      totalRevenue: 0,
      totalPartnerEarnings: 0,
      transactions: [],
    });
  }
  
  const record = revenueShares.get(key);
  
  record.transactions.push({
    clientId,
    revenue,
    partnerShare,
    timestamp: new Date().toISOString(),
  });
  
  record.totalRevenue += revenue;
  record.totalPartnerEarnings += partnerShare;
  
  if (!record.clients.includes(clientId)) {
    record.clients.push(clientId);
  }
  
  revenueShares.set(key, record);
}

/**
 * Get revenue share report for partner
 * 
 * @param {string} partnerId
 * @param {string} period - Optional billing period
 * @returns {object} Revenue share report
 */
function getPartnerRevenueReport(partnerId, period = null) {
  period = period || getCurrentBillingPeriod();
  const key = `${partnerId}_${period}`;
  const partner = getPartner(partnerId);
  
  const revenueData = revenueShares.get(key) || {
    partnerId,
    period,
    clients: [],
    totalRevenue: 0,
    totalPartnerEarnings: 0,
    transactions: [],
  };
  
  const report = {
    partner: {
      id: partner.id,
      name: partner.companyName,
      tier: partner.tier,
    },
    period,
    fees: {
      monthlyLicense: partner.billing.monthlyFee,
      revenueSharePercent: partner.billing.revenueSharePercent * 100,
    },
    clients: {
      total: partner.stats.totalClients,
      active: partner.stats.activeClients,
      generating_revenue: revenueData.clients.length,
    },
    revenue: {
      clientOverages: revenueData.totalRevenue,
      partnerEarnings: revenueData.totalPartnerEarnings,
      totalInvoice: partner.billing.monthlyFee + revenueData.totalPartnerEarnings,
    },
    transactions: revenueData.transactions,
    generatedAt: new Date().toISOString(),
  };
  
  return report;
}

/**
 * Get analytics dashboard for partner
 */
function getPartnerAnalytics(partnerId) {
  const partner = getPartner(partnerId);
  const clients = listPartnerClients(partnerId);
  
  // Calculate client distribution by tier
  const tierDistribution = {};
  let totalMRR = 0;
  
  for (const client of clients) {
    tierDistribution[client.tier] = (tierDistribution[client.tier] || 0) + 1;
    totalMRR += client.usage.baseCharges;
  }
  
  // Recent growth
  const currentPeriod = getCurrentBillingPeriod();
  const lastPeriod = getPreviousPeriod(currentPeriod);
  const currentRevenue = getPartnerRevenueReport(partnerId, currentPeriod);
  const lastRevenue = getPartnerRevenueReport(partnerId, lastPeriod);
  
  const growth = lastRevenue.revenue.totalInvoice > 0
    ? ((currentRevenue.revenue.totalInvoice - lastRevenue.revenue.totalInvoice) / lastRevenue.revenue.totalInvoice * 100).toFixed(1)
    : 100;
  
  return {
    partner: {
      id: partner.id,
      name: partner.companyName,
      tier: partner.tier,
      createdAt: partner.createdAt,
    },
    summary: {
      totalClients: partner.stats.totalClients,
      activeClients: partner.stats.activeClients,
      lifetimeRevenue: partner.stats.totalRevenue,
      lifetimeEarnings: partner.stats.partnerEarnings,
    },
    currentPeriod: {
      period: currentPeriod,
      clientRevenue: currentRevenue.revenue.clientOverages,
      partnerEarnings: currentRevenue.revenue.partnerEarnings,
      totalMRR,
    },
    growth: {
      revenueChangePercent: parseFloat(growth),
      direction: growth > 0 ? 'up' : growth < 0 ? 'down' : 'flat',
    },
    clients: {
      byTier: tierDistribution,
      topClients: clients
        .sort((a, b) => b.usage.totalCharges - a.usage.totalCharges)
        .slice(0, 10)
        .map(c => ({
          id: c.id,
          name: c.businessName,
          tier: c.tier,
          monthlyRevenue: c.usage.totalCharges,
        })),
    },
  };
}

/**
 * Generate branded assets for partner
 */
function generateBrandedAssets(partnerId) {
  const partner = getPartner(partnerId);
  
  return {
    // CSS variables for theming
    cssVariables: `
      :root {
        --primary-color: ${partner.branding.primaryColor};
        --secondary-color: ${partner.branding.secondaryColor};
        --accent-color: ${partner.branding.accentColor};
        --font-family: ${partner.branding.fontFamily};
      }
    `,
    
    // Logo URLs
    logo: {
      main: partner.branding.logo,
      favicon: partner.branding.favicon,
    },
    
    // Platform name
    platformName: partner.branding.platformName,
    
    // Custom CSS
    customCSS: partner.branding.customCSS,
    
    // Domain info
    domain: partner.domains.custom || `${partner.domains.subdomain}.auraplatform.io`,
    
    // Email branding
    emailTemplates: {
      fromName: partner.branding.platformName,
      fromEmail: `noreply@${partner.domains.custom || 'auraplatform.io'}`,
      footerText: `Powered by ${partner.branding.platformName}`,
    },
  };
}

/**
 * Helper: Get current billing period
 */
function getCurrentBillingPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Helper: Get previous billing period
 */
function getPreviousPeriod(period) {
  const [year, month] = period.split('-').map(Number);
  const prevDate = new Date(year, month - 2, 1);
  return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Helper: Slugify company name for subdomain
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Helper: Generate API key
 */
function generateApiKey(prefix = 'pk') {
  const random = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
  return `${prefix}_${random}`;
}

/**
 * Helper: Generate webhook secret
 */
function generateWebhookSecret() {
  return `whsec_${Math.random().toString(36).substr(2)}${Math.random().toString(36).substr(2)}`;
}

// Export functions
module.exports = {
  // Partner management
  createPartner,
  getPartner,
  updatePartner,
  
  // Client management
  createClient,
  getClient,
  listPartnerClients,
  
  // Usage & revenue tracking
  trackClientUsage,
  getPartnerRevenueReport,
  getPartnerAnalytics,
  
  // Branding
  generateBrandedAssets,
  
  // Constants
  PARTNER_TIERS,
};
