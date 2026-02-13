/**
 * EMAIL PERSONALIZATION ENGINE
 * Personalize email content, send times, frequency, and recommendations
 */

// Storage
const emailProfiles = new Map(); // userId -> email preferences/behavior
const emailCampaigns = new Map();
const personalizedEmails = new Map();
const sendTimeOptimization = new Map();
const emailPerformance = new Map();
const unsubscribeReasons = new Map();

// Generate unique ID
function generateId(prefix = 'email') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create email profile for user
 */
function createEmailProfile({ userId, email, preferences = {} }) {
  const profileId = generateId('eprof');
  
  const profile = {
    id: profileId,
    userId,
    email,
    preferences: {
      frequency: preferences.frequency || 'weekly', // daily, weekly, monthly
      categories: preferences.categories || [],
      unsubscribed: false,
      ...preferences
    },
    behavior: {
      totalSent: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalConverted: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      lastOpened: null,
      lastClicked: null,
      avgOpenDelay: 0 // minutes after send
    },
    optimalSendTime: {
      dayOfWeek: null, // 0-6 (Sunday-Saturday)
      hour: null, // 0-23
      confidence: 0
    },
    engagement: {
      level: 'new', // new, engaged, passive, inactive
      score: 0,
      lastActive: new Date().toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  emailProfiles.set(profileId, profile);
  emailProfiles.set(`user:${userId}`, profileId); // Index by userId
  
  return profile;
}

/**
 * Get email profile
 */
function getEmailProfile(profileId) {
  if (profileId.startsWith('user:')) {
    const actualId = emailProfiles.get(profileId);
    return actualId ? emailProfiles.get(actualId) : null;
  }
  return emailProfiles.get(profileId);
}

/**
 * Personalize email content
 */
function personalizeEmailContent({ userId, emailTemplate, userProfile = {}, context = {} }) {
  const emailId = generateId('peml');
  
  let personalizedContent = emailTemplate.content;
  let personalizedSubject = emailTemplate.subject;
  
  // Replace dynamic placeholders
  const placeholders = {
    '{{firstName}}': userProfile.demographics?.firstName || 'there',
    '{{lastName}}': userProfile.demographics?.lastName || '',
    '{{location}}': userProfile.demographics?.location?.city || '',
    '{{tier}}': userProfile.tier || 'valued customer'
  };
  
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    personalizedSubject = personalizedSubject.replace(new RegExp(placeholder, 'g'), value);
    personalizedContent = personalizedContent.replace(new RegExp(placeholder, 'g'), value);
  });
  
  // Add personalized product recommendations
  if (emailTemplate.includeRecommendations) {
    const recommendations = getEmailRecommendations(userProfile);
    personalizedContent = personalizedContent.replace(
      '{{recommendations}}',
      renderRecommendations(recommendations)
    );
  }
  
  // Add personalized content based on interests
  if (emailTemplate.personalizedSections) {
    const interests = userProfile.interests || [];
    interests.slice(0, 3).forEach((interest, index) => {
      personalizedContent = personalizedContent.replace(
        `{{interest${index + 1}}}`,
        interest.interest
      );
    });
  }
  
  // Personalize CTA
  const cta = personalizeCTA(userProfile);
  personalizedContent = personalizedContent.replace('{{cta}}', cta);
  
  // Store personalized email
  personalizedEmails.set(emailId, {
    id: emailId,
    userId,
    templateId: emailTemplate.id,
    subject: personalizedSubject,
    content: personalizedContent,
    personalizations: Object.keys(placeholders).length,
    createdAt: new Date().toISOString()
  });
  
  return {
    emailId,
    subject: personalizedSubject,
    content: personalizedContent
  };
}

/**
 * Get personalized recommendations for email
 */
function getEmailRecommendations(userProfile) {
  // This would integrate with recommendation engine
  // Simplified for demonstration
  
  const recommendations = [];
  
  // Based on affinities
  const topAffinities = Object.entries(userProfile.affinities || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  
  topAffinities.forEach(([category, score]) => {
    recommendations.push({
      type: 'affinity',
      category,
      score,
      title: `Top picks in ${category}`,
      products: [] // Would be populated from product catalog
    });
  });
  
  // Based on recent behavior
  if (userProfile.behavioral?.purchases > 0) {
    recommendations.push({
      type: 'replenishment',
      title: 'Buy again',
      products: []
    });
  }
  
  return recommendations.slice(0, 3);
}

/**
 * Render recommendations HTML
 */
function renderRecommendations(recommendations) {
  if (recommendations.length === 0) {
    return '<p>Check out our latest products</p>';
  }
  
  return recommendations.map(rec => 
    `<div class="recommendation">
      <h3>${rec.title}</h3>
      <!-- Product cards would be rendered here -->
    </div>`
  ).join('');
}

/**
 * Personalize CTA based on lifecycle
 */
function personalizeCTA(userProfile) {
  const lifecycle = userProfile.lifecycle || 'visitor';
  
  const ctas = {
    visitor: 'Start Shopping',
    engaged: 'View Recommendations',
    customer: 'Shop New Arrivals',
    advocate: 'Get VIP Access'
  };
  
  return ctas[lifecycle] || 'Shop Now';
}

/**
 * Calculate optimal send time for user
 */
function calculateOptimalSendTime(userId) {
  const profile = getEmailProfile(`user:${userId}`);
  if (!profile) {
    throw new Error('Email profile not found');
  }
  
  // Analyze historical opens
  const opens = Array.from(emailPerformance.values())
    .filter(p => p.userId === userId && p.openedAt);
  
  if (opens.length < 3) {
    // Not enough data, use general best practices
    return {
      dayOfWeek: 2, // Tuesday
      hour: 10, // 10 AM
      confidence: 0.3
    };
  }
  
  // Count opens by day of week and hour
  const dayCount = new Array(7).fill(0);
  const hourCount = new Array(24).fill(0);
  
  opens.forEach(open => {
    const openDate = new Date(open.openedAt);
    dayCount[openDate.getDay()]++;
    hourCount[openDate.getHours()]++;
  });
  
  // Find most common day and hour
  const bestDay = dayCount.indexOf(Math.max(...dayCount));
  const bestHour = hourCount.indexOf(Math.max(...hourCount));
  
  const optimal = {
    dayOfWeek: bestDay,
    hour: bestHour,
    confidence: Math.min(opens.length / 10, 1.0)
  };
  
  profile.optimalSendTime = optimal;
  sendTimeOptimization.set(userId, optimal);
  
  return optimal;
}

/**
 * Determine send frequency for user
 */
function determineSendFrequency(userId) {
  const profile = getEmailProfile(`user:${userId}`);
  if (!profile) {
    throw new Error('Email profile not found');
  }
  
  const engagement = profile.engagement.level;
  const openRate = profile.behavior.openRate;
  
  // Adjust frequency based on engagement
  if (engagement === 'inactive' || openRate < 10) {
    return 'monthly';
  } else if (engagement === 'passive' || openRate < 30) {
    return 'weekly';
  } else if (engagement === 'engaged' && openRate > 50) {
    return 'twice_weekly';
  }
  
  return profile.preferences.frequency || 'weekly';
}

/**
 * Track email send
 */
function trackEmailSend({ emailId, userId, sentAt = new Date().toISOString() }) {
  const perfId = generateId('perf');
  
  const performance = {
    id: perfId,
    emailId,
    userId,
    sentAt,
    openedAt: null,
    clickedAt: null,
    convertedAt: null,
    opened: false,
    clicked: false,
    converted: false
  };
  
  emailPerformance.set(perfId, performance);
  
  // Update profile
  const profile = getEmailProfile(`user:${userId}`);
  if (profile) {
    profile.behavior.totalSent++;
    profile.updatedAt = new Date().toISOString();
  }
  
  return performance;
}

/**
 * Track email open
 */
function trackEmailOpen({ emailId, userId }) {
  // Find performance record
  const perf = Array.from(emailPerformance.values())
    .find(p => p.emailId === emailId && p.userId === userId);
  
  if (!perf) {
    throw new Error('Email performance record not found');
  }
  
  perf.openedAt = new Date().toISOString();
  perf.opened = true;
  
  // Calculate open delay
  const sentTime = new Date(perf.sentAt).getTime();
  const openTime = new Date(perf.openedAt).getTime();
  const delayMinutes = (openTime - sentTime) / (1000 * 60);
  
  // Update profile
  const profile = getEmailProfile(`user:${userId}`);
  if (profile) {
    profile.behavior.totalOpened++;
    profile.behavior.lastOpened = perf.openedAt;
    profile.behavior.openRate = (profile.behavior.totalOpened / profile.behavior.totalSent) * 100;
    
    // Update average open delay
    const totalDelay = profile.behavior.avgOpenDelay * (profile.behavior.totalOpened - 1);
    profile.behavior.avgOpenDelay = (totalDelay + delayMinutes) / profile.behavior.totalOpened;
    
    profile.engagement.lastActive = new Date().toISOString();
    profile.updatedAt = new Date().toISOString();
    
    updateEngagementLevel(profile);
  }
  
  return perf;
}

/**
 * Track email click
 */
function trackEmailClick({ emailId, userId, linkUrl = '' }) {
  const perf = Array.from(emailPerformance.values())
    .find(p => p.emailId === emailId && p.userId === userId);
  
  if (!perf) {
    throw new Error('Email performance record not found');
  }
  
  if (!perf.clickedAt) {
    perf.clickedAt = new Date().toISOString();
    perf.clicked = true;
  }
  
  if (!perf.links) {
    perf.links = [];
  }
  perf.links.push({ url: linkUrl, clickedAt: new Date().toISOString() });
  
  // Update profile
  const profile = getEmailProfile(`user:${userId}`);
  if (profile) {
    profile.behavior.totalClicked++;
    profile.behavior.lastClicked = perf.clickedAt;
    profile.behavior.clickRate = (profile.behavior.totalClicked / profile.behavior.totalSent) * 100;
    profile.engagement.lastActive = new Date().toISOString();
    profile.updatedAt = new Date().toISOString();
    
    updateEngagementLevel(profile);
  }
  
  return perf;
}

/**
 * Track email conversion
 */
function trackEmailConversion({ emailId, userId, conversionValue = 0 }) {
  const perf = Array.from(emailPerformance.values())
    .find(p => p.emailId === emailId && p.userId === userId);
  
  if (!perf) {
    throw new Error('Email performance record not found');
  }
  
  perf.convertedAt = new Date().toISOString();
  perf.converted = true;
  perf.conversionValue = conversionValue;
  
  // Update profile
  const profile = getEmailProfile(`user:${userId}`);
  if (profile) {
    profile.behavior.totalConverted++;
    profile.behavior.conversionRate = (profile.behavior.totalConverted / profile.behavior.totalSent) * 100;
    profile.engagement.lastActive = new Date().toISOString();
    profile.updatedAt = new Date().toISOString();
    
    updateEngagementLevel(profile);
  }
  
  return perf;
}

/**
 * Update engagement level based on behavior
 */
function updateEngagementLevel(profile) {
  const { openRate, clickRate, conversionRate } = profile.behavior;
  
  // Calculate engagement score
  let score = 0;
  score += openRate * 0.4;
  score += clickRate * 0.4;
  score += conversionRate * 0.2;
  
  profile.engagement.score = Math.round(score);
  
  // Determine level
  if (score >= 60) {
    profile.engagement.level = 'engaged';
  } else if (score >= 30) {
    profile.engagement.level = 'passive';
  } else if (score >= 10) {
    profile.engagement.level = 'low';
  } else {
    profile.engagement.level = 'inactive';
  }
  
  // Check for inactivity
  const daysSinceActive = (Date.now() - new Date(profile.engagement.lastActive).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceActive > 90) {
    profile.engagement.level = 'inactive';
  }
}

/**
 * Handle unsubscribe
 */
function processUnsubscribe({ userId, reason = '', categories = [] }) {
  const profile = getEmailProfile(`user:${userId}`);
  if (!profile) {
    throw new Error('Email profile not found');
  }
  
  if (categories.length > 0) {
    // Partial unsubscribe
    profile.preferences.categories = profile.preferences.categories.filter(
      cat => !categories.includes(cat)
    );
  } else {
    // Full unsubscribe
    profile.preferences.unsubscribed = true;
  }
  
  profile.updatedAt = new Date().toISOString();
  
  // Track reason
  if (reason) {
    unsubscribeReasons.set(userId, {
      reason,
      categories,
      timestamp: new Date().toISOString()
    });
  }
  
  return profile;
}

/**
 * Get email analytics
 */
function getEmailAnalytics() {
  const profiles = Array.from(emailProfiles.values())
    .filter(p => typeof p === 'object' && p.id);
  
  const totalProfiles = profiles.length;
  const activeProfiles = profiles.filter(p => !p.preferences.unsubscribed).length;
  
  const totalSent = profiles.reduce((sum, p) => sum + p.behavior.totalSent, 0);
  const totalOpened = profiles.reduce((sum, p) => sum + p.behavior.totalOpened, 0);
  const totalClicked = profiles.reduce((sum, p) => sum + p.behavior.totalClicked, 0);
  const totalConverted = profiles.reduce((sum, p) => sum + p.behavior.totalConverted, 0);
  
  const engagementDistribution = {
    engaged: profiles.filter(p => p.engagement.level === 'engaged').length,
    passive: profiles.filter(p => p.engagement.level === 'passive').length,
    low: profiles.filter(p => p.engagement.level === 'low').length,
    inactive: profiles.filter(p => p.engagement.level === 'inactive').length
  };
  
  return {
    totalProfiles,
    activeProfiles,
    unsubscribeRate: totalProfiles > 0 
      ? ((totalProfiles - activeProfiles) / totalProfiles) * 100 : 0,
    totalSent,
    avgOpenRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
    avgClickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
    avgConversionRate: totalSent > 0 ? (totalConverted / totalSent) * 100 : 0,
    engagementDistribution,
    totalPersonalizedEmails: personalizedEmails.size,
    topUnsubscribeReasons: getTopUnsubscribeReasons()
  };
}

/**
 * Get top unsubscribe reasons
 */
function getTopUnsubscribeReasons() {
  const reasonCounts = new Map();
  
  unsubscribeReasons.forEach(data => {
    if (data.reason) {
      reasonCounts.set(data.reason, (reasonCounts.get(data.reason) || 0) + 1);
    }
  });
  
  return Array.from(reasonCounts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

module.exports = {
  createEmailProfile,
  getEmailProfile,
  personalizeEmailContent,
  calculateOptimalSendTime,
  determineSendFrequency,
  trackEmailSend,
  trackEmailOpen,
  trackEmailClick,
  trackEmailConversion,
  processUnsubscribe,
  getEmailAnalytics
};
