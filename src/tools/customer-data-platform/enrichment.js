/**
 * Customer Data Platform - Data Enrichment
 * Enrich customer profiles with third-party data, calculated fields, and scoring
 */

const { getProfile, updateProfile } = require('./profiles');
const { getProfileEvents } = require('./events');

/**
 * Available enrichment providers
 */
const providers = {
  clearbit: { name: 'Clearbit', types: ['company', 'person'], enabled: false },
  fullcontact: { name: 'FullContact', types: ['person', 'social'], enabled: false },
  peopledatalabs: { name: 'People Data Labs', types: ['person', 'company'], enabled: false },
  hunter: { name: 'Hunter', types: ['email'], enabled: false },
};

/**
 * Get list of enrichment providers
 */
function getProviders() {
  return Object.entries(providers).map(([id, info]) => ({
    id,
    ...info,
  }));
}

/**
 * Mock enrichment data (would call real APIs in production)
 */
function mockEnrichmentData(profile, provider) {
  const data = {};
  
  // Mock company data
  if (provider === 'clearbit' && profile.attributes.email) {
    const domain = profile.attributes.email.split('@')[1];
    data.company = {
      name: `${domain.split('.')[0].toUpperCase()}  Corp`,
      domain,
      industry: 'Technology',
      size: '50-200',
      location: 'San Francisco, CA',
      founded: 2015,
    };
  }
  
  // Mock person data
  if (provider === 'fullcontact' && profile.attributes.email) {
    data.demographics = {
      age: 35,
      gender: 'unknown',
      locationGeneral: profile.attributes.city || 'Unknown',
    };
    data.social = {
      linkedin: `https://linkedin.com/in/${profile.attributes.firstName?.toLowerCase() || 'user'}`,
      twitter: `@${profile.attributes.firstName?.toLowerCase() || 'user'}`,
    };
  }
  
  return data;
}

/**
 * Enrich a single profile
 */
async function enrichProfile(profileId, options = {}) {
  const profile = getProfile(profileId);
  if (!profile) throw new Error('Profile not found');
  
  const enrichedData = {};
  const provider = options.provider || 'clearbit';
  
  // In production, would call real enrichment APIs
  // For now, return mock data
  const mockData = mockEnrichmentData(profile, provider);
  Object.assign(enrichedData, mockData);
  
  // Calculate lead score
  enrichedData.leadScore = calculateLeadScore(profile);
  
  // Calculate engagement score (already in computed, but can override)
  const events = getProfileEvents(profileId);
  enrichedData.engagementScore = calculateEngagementScore(profile, events);
  
  // Calculate LTV prediction
  enrichedData.predictedLTV = calculatePredictedLTV(profile, events);
  
  // Update profile with enriched data
  updateProfile(profileId, {
    attributes: {
      customFields: {
        ...profile.attributes.customFields,
        ...enrichedData,
      },
    },
  });
  
  return {
    profileId,
    provider,
    enrichedFields: Object.keys(enrichedData),
    data: enrichedData,
  };
}

/**
 * Batch enrich multiple profiles
 */
async function enrichProfilesBatch(profileIds, options = {}) {
  const results = [];
  const errors = [];
  
  for (const profileId of profileIds) {
    try {
      const result = await enrichProfile(profileId, options);
      results.push(result);
    } catch (err) {
      errors.push({
        profileId,
        error: err.message,
      });
    }
  }
  
  return {
    success: results,
    errors,
    total: profileIds.length,
    enriched: results.length,
    failed: errors.length,
  };
}

/**
 * Calculate lead score (0-100)
 */
function calculateLeadScore(profile) {
  let score = 0;
  
  // Has email
  if (profile.attributes.email) score += 20;
  
  // Has phone
  if (profile.attributes.phone) score += 15;
  
  // Has complete name
  if (profile.attributes.firstName && profile.attributes.lastName) score += 10;
  
  // Has location
  if (profile.attributes.country) score += 10;
  if (profile.attributes.city) score += 5;
  
  // Has made purchases
  if (profile.computed.purchaseCount > 0) score += 20;
  if (profile.computed.purchaseCount >= 3) score += 10;
  
  // High LTV
  if (profile.computed.ltv >= 500) score += 10;
  
  return Math.min(100, score);
}

/**
 * Calculate engagement score (0-100)
 */
function calculateEngagementScore(profile, events = []) {
  const now = new Date();
  
  // Events in last 30 days
  const recentEvents = events.filter(e => {
    const eventDate = new Date(e.timestamp);
    const daysAgo = (now - eventDate) / (1000 * 60 * 60 * 24);
    return daysAgo <= 30;
  });
  
  let score = 0;
  
  // Base score from event count
  score += Math.min(50, recentEvents.length * 2);
  
  // Bonus for diversity of event types
  const eventTypes = new Set(recentEvents.map(e => e.type));
  score += eventTypes.size * 5;
  
  // Bonus for recent purchases
  const recentPurchases = recentEvents.filter(e => e.type === 'purchase');
  score+= recentPurchases.length * 10;
  
  // Email engagement
  const emailOpens = recentEvents.filter(e => e.type === 'email_open');
  score += Math.min(15, emailOpens.length * 3);
  
  return Math.min(100, score);
}

/**
 * Calculate predicted LTV
 */
function calculatePredictedLTV(profile, events = []) {
  const currentLTV = profile.computed.ltv || 0;
  const purchaseCount = profile.computed.purchaseCount || 0;
  
  if (purchaseCount === 0) return 0;
  
  // Simple prediction: current LTV * growth factor based on recency
  const lastPurchaseDate = profile.computed.lastPurchaseDate 
    ? new Date(profile.computed.lastPurchaseDate) 
    : null;
  
  if (!lastPurchaseDate) return currentLTV;
  
  const daysSinceLastPurchase = (new Date() - lastPurchaseDate) / (1000 * 60 * 60 * 24);
  
  let growthFactor;
  if (daysSinceLastPurchase <= 30) growthFactor = 2.5; // Very active
  else if (daysSinceLastPurchase <= 60) growthFactor = 2.0; // Active
  else if (daysSinceLastPurchase <= 90) growthFactor = 1.5; // Moderately active
  else if (daysSinceLastPurchase <= 180) growthFactor = 1.2; // Becoming inactive
  else growthFactor = 1.0; // Likely churned
  
  return parseFloat((currentLTV * growthFactor).toFixed(2));
}

module.exports = {
  getProviders,
  enrichProfile,
  enrichProfilesBatch,
  calculateLeadScore,
  calculateEngagementScore,
  calculatePredictedLTV,
};
