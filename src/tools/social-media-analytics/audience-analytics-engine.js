/**
 * Audience Analytics Engine
 * Manages audience demographics, interests, behavior patterns, and growth analysis
 */

// In-memory storage
const audienceProfiles = new Map();
const demographics = new Map();
const interestAnalysis = new Map();
const behaviorPatterns = new Map();
const growthSegments = new Map();

let profileIdCounter = 1;
let demographicIdCounter = 1;
let interestIdCounter = 1;
let behaviorIdCounter = 1;
let segmentIdCounter = 1;

/**
 * Create audience profile
 */
function createAudienceProfile(accountId, { totalFollowers, activeFollowers, verifiedFollowers }) {
  const profile = {
    id: profileIdCounter++,
    accountId,
    totalFollowers,
    activeFollowers, // engaged in last 30 days
    verifiedFollowers,
    activityRate: (activeFollowers / totalFollowers) * 100,
    verifiedRate: (verifiedFollowers / totalFollowers) * 100,
    qualityScore: 0,
    createdAt: new Date(),
    lastUpdatedAt: new Date()
  };

  // Calculate quality score
  let qualityScore = 0;
  if (profile.activityRate > 20) qualityScore += 40;
  else if (profile.activityRate > 10) qualityScore += 25;
  else if (profile.activityRate > 5) qualityScore += 15;

  if (profile.verifiedRate > 5) qualityScore += 30;
  else if (profile.verifiedRate > 2) qualityScore += 20;
  else if (profile.verifiedRate > 1) qualityScore += 10;

  if (totalFollowers > 100000) qualityScore += 30;
  else if (totalFollowers > 50000) qualityScore += 20;
  else if (totalFollowers > 10000) qualityScore += 10;

  profile.qualityScore = Math.min(qualityScore, 100);

  audienceProfiles.set(profile.id, profile);
  return profile;
}

/**
 * Analyze demographics
 */
function analyzeDemographics(accountId, { ageGroups, genderSplit, topCountries, topCities, languages, devices }) {
  const demographic = {
    id: demographicIdCounter++,
    accountId,
    ageGroups: ageGroups || {
      '13-17': 5,
      '18-24': 25,
      '25-34': 35,
      '35-44': 20,
      '45-54': 10,
      '55-64': 3,
      '65+': 2
    },
    genderSplit: genderSplit || {
      male: 45,
      female: 52,
      other: 3
    },
    geography: {
      topCountries: topCountries || [
        { country: 'US', code: 'US', percentage: 40 },
        { country: 'UK', code: 'GB', percentage: 15 },
        { country: 'Canada', code: 'CA', percentage: 10 },
        { country: 'Australia', code: 'AU', percentage: 8 },
        { country: 'India', code: 'IN', percentage: 7 }
      ],
      topCities: topCities || [
        { city: 'New York', country: 'US', percentage: 12 },
        { city: 'London', country: 'UK', percentage: 8 },
        { city: 'Los Angeles', country: 'US', percentage: 6 },
        { city: 'Toronto', country: 'CA', percentage: 5 },
        { city: 'Sydney', country: 'AU', percentage: 4 }
      ]
    },
    languages: languages || [
      { language: 'English', code: 'en', percentage: 75 },
      { language: 'Spanish', code: 'es', percentage: 12 },
      { language: 'French', code: 'fr', percentage: 5 },
      { language: 'German', code: 'de', percentage: 4 },
      { language: 'Other', code: 'other', percentage: 4 }
    ],
    devices: devices || {
      mobile: 75,
      desktop: 20,
      tablet: 5
    },
    insights: generateDemographicInsights({ ageGroups: ageGroups || {}, genderSplit: genderSplit || {} }),
    analyzedAt: new Date()
  };

  demographics.set(demographic.id, demographic);
  return demographic;
}

/**
 * Generate demographic insights
 */
function generateDemographicInsights({ ageGroups, genderSplit }) {
  const insights = [];

  // Age insights
  const ageData = Object.entries(ageGroups);
  if (ageData.length > 0) {
    const dominantAge = ageData.reduce((max, [group, percentage]) =>
      percentage > (max[1] || 0) ? [group, percentage] : max, ['', 0]);

    if (dominantAge[1] > 30) {
      insights.push({
        type: 'demographic',
        category: 'age',
        message: `Primary audience is ${dominantAge[0]} years old (${dominantAge[1]}%)`,
        recommendation: `Tailor content to ${dominantAge[0]} age group preferences`
      });
    }
  }

  // Gender insights
  if (genderSplit.male > 60 || genderSplit.female > 60) {
    const dominant = genderSplit.male > genderSplit.female ? 'male' : 'female';
    insights.push({
      type: 'demographic',
      category: 'gender',
      message: `Audience skews ${dominant} (${genderSplit[dominant]}%)`,
      recommendation: `Consider content that appeals to ${dominant} audience`
    });
  } else {
    insights.push({
      type: 'demographic',
      category: 'gender',
      message: 'Balanced gender distribution',
      recommendation: 'Maintain gender-neutral content strategy'
    });
  }

  return insights;
}

/**
 * Analyze audience interests
 */
function analyzeAudienceInterests(accountId, { interests, affinities, topBrands, contentPreferences }) {
  const analysis = {
    id: interestIdCounter++,
    accountId,
    interests: interests || [
      { category: 'Technology', percentage: 35, engagement: 'high' },
      { category: 'Fashion', percentage: 28, engagement: 'medium' },
      { category: 'Travel', percentage: 22, engagement: 'high' },
      { category: 'Food', percentage: 18, engagement: 'medium' },
      { category: 'Fitness', percentage: 15, engagement: 'low' }
    ],
    affinities: affinities || [
      { topic: 'Entrepreneurs', score: 85, engagement: 'very_high' },
      { topic: 'Digital Marketing', score: 78, engagement: 'high' },
      { topic: 'Sustainability', score: 65, engagement: 'medium' }
    ],
    topBrands: topBrands || [
      { brand: 'Apple', affinity: 72 },
      { brand: 'Nike', affinity: 65 },
      { brand: 'Starbucks', affinity: 58 }
    ],
    contentPreferences: contentPreferences || {
      video: 45,
      image: 30,
      carousel: 15,
      text: 10
    },
    recommendations: generateInterestRecommendations(interests || []),
    analyzedAt: new Date()
  };

  interestAnalysis.set(analysis.id, analysis);
  return analysis;
}

/**
 * Generate interest recommendations
 */
function generateInterestRecommendations(interests) {
  const recommendations = [];

  const sortedInterests = [...interests].sort((a, b) => b.percentage - a.percentage);

  if (sortedInterests.length > 0) {
    const top = sortedInterests[0];
    recommendations.push({
      priority: 'high',
      category: 'content',
      suggestion: `Focus on ${top.category} content - top interest at ${top.percentage}%`,
      exampleTopics: [`${top.category} news`, `${top.category} tips`, `${top.category} trends`]
    });
  }

  const highEngagement = interests.filter(i => i.engagement === 'high');
  if (highEngagement.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'engagement',
      suggestion: `High engagement interests: ${highEngagement.map(i => i.category).join(', ')}`,
      exampleTopics: highEngagement.map(i => `Create more ${i.category} content`)
    });
  }

  return recommendations;
}

/**
 * Track audience behavior patterns
 */
function trackBehaviorPatterns(accountId, { activeHours, activeDays, peakEngagementTimes, sessionDuration }) {
  const pattern = {
    id: behaviorIdCounter++,
    accountId,
    activeHours: activeHours || {
      '0-6': 5,
      '6-9': 15,
      '9-12': 20,
      '12-15': 18,
      '15-18': 22,
      '18-21': 30,
      '21-24': 12
    },
    activeDays: activeDays || {
      'Monday': 85,
      'Tuesday': 90,
      'Wednesday': 88,
      'Thursday': 92,
      'Friday': 78,
      'Saturday': 65,
      'Sunday': 72
    },
    peakEngagementTimes: peakEngagementTimes || [
      { day: 'Thursday', hour: 18, engagement: 95 },
      { day: 'Wednesday', hour: 19, engagement: 92 },
      { day: 'Tuesday', hour: 17, engagement: 88 }
    ],
    sessionDuration: sessionDuration || {
      avg: 245, // seconds
      median: 180,
      distribution: {
        '0-60s': 35,
        '60-120s': 25,
        '120-300s': 20,
        '300-600s': 12,
        '600s+': 8
      }
    },
    insights: generateBehaviorInsights(activeHours || {}, activeDays || {}),
    trackedAt: new Date()
  };

  behaviorPatterns.set(pattern.id, pattern);
  return pattern;
}

/**
 * Generate behavior insights
 */
function generateBehaviorInsights(activeHours, activeDays) {
  const insights = [];

  // Find peak hour range
  const peakHourRange = Object.entries(activeHours)
    .reduce((max, [range, value]) => value > (max[1] || 0) ? [range, value] : max, ['', 0]);

  if (peakHourRange[0]) {
    insights.push({
      type: 'behavior',
      category: 'timing',
      message: `Peak activity during ${peakHourRange[0]} hours (${peakHourRange[1]}% of engagement)`,
      recommendation: `Schedule posts during ${peakHourRange[0]} time range`
    });
  }

  // Find peak day
  const peakDay = Object.entries(activeDays)
    .reduce((max, [day, value]) => value > (max[1] || 0) ? [day, value] : max, ['', 0]);

  if (peakDay[0]) {
    insights.push({
      type: 'behavior',
      category: 'timing',
      message: `Highest engagement on ${peakDay[0]}s (${peakDay[1]} index)`,
      recommendation: `Prioritize important content for ${peakDay[0]}s`
    });
  }

  return insights;
}

/**
 * Segment audience by growth
 */
function segmentAudienceByGrowth(accountId, { newFollowers, churned Followers, consistentEngagers, reactivatedFollowers }) {
  const segment = {
    id: segmentIdCounter++,
    accountId,
    segments: {
      newFollowers: {
        count: newFollowers || Math.floor(Math.random() * 500),
        characteristics: {
          avgAge: 28,
          primaryInterests: ['Technology', 'Innovation'],
          topSources: ['hashtags', 'explore', 'shares']
        }
      },
      churnedFollowers: {
        count: churnedFollowers || Math.floor(Math.random() * 100),
        reasons: [
          { reason: 'inactive_content', percentage: 35 },
          { reason: 'irrelevant_content', percentage: 25 },
          { reason: 'too_frequent_posting', percentage: 20 },
          { reason: 'other', percentage: 20 }
        ]
      },
      consistentEngagers: {
        count: consistentEngagers || Math.floor(Math.random() * 1000),
        characteristics: {
          avgEngagementRate: 12.5,
          preferredContentTypes: ['video', 'carousel'],
          loyaltyScore: 85
        }
      },
      reactivatedFollowers: {
        count: reactivatedFollowers || Math.floor(Math.random() * 200),
        reactivationTriggers: [
          { trigger: 'new_content_format', percentage: 40 },
          { trigger: 'trending_topic', percentage: 30 },
          { trigger: 'collaboration', percentage: 20 },
          { trigger: 'contest', percentage: 10 }
        ]
      }
    },
    insights: generateSegmentInsights(newFollowers || 0, churnedFollowers || 0),
    segmentedAt: new Date()
  };

  growthSegments.set(segment.id, segment);
  return segment;
}

/**
 * Generate segment insights
 */
function generateSegmentInsights(newFollowers, churnedFollowers) {
  const netGrowth = newFollowers - churnedFollowers;
  const insights = [];

  if (netGrowth > 0) {
    insights.push({
      type: 'growth',
      category: 'acquisition',
      message: `Positive net growth of ${netGrowth} followers`,
      recommendation: 'Maintain current acquisition strategy'
    });
  } else if (netGrowth < 0) {
    insights.push({
      type: 'growth',
      category: 'retention',
      message: `Negative net growth - losing ${Math.abs(netGrowth)} followers`,
      recommendation: 'Focus on retention and content quality'
    });
  }

  const churnRate = newFollowers > 0 ? (churnedFollowers / newFollowers) * 100 : 0;
  if (churnRate > 20) {
    insights.push({
      type: 'warning',
      category: 'retention',
      message: `High churn rate of ${churnRate.toFixed(1)}%`,
      recommendation: 'Analyze churned follower reasons and address content issues'
    });
  }

  return insights;
}

/**
 * Compare audience segments
 */
function compareAudienceSegments(accountId1, accountId2) {
  const profile1 = Array.from(audienceProfiles.values())
    .filter(p => p.accountId === accountId1)
    .sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt)[0];

  const profile2 = Array.from(audienceProfiles.values())
    .filter(p => p.accountId === accountId2)
    .sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt)[0];

  if (!profile1 || !profile2) {
    return { available: false, message: 'Both accounts need audience profiles' };
  }

  const demographic1 = Array.from(demographics.values())
    .filter(d => d.accountId === accountId1)
    .sort((a, b) => b.analyzedAt - a.analyzedAt)[0];

  const demographic2 = Array.from(demographics.values())
    .filter(d => d.accountId === accountId2)
    .sort((a, b) => b.analyzedAt - a.analyzedAt)[0];

  return {
    account1: {
      totalFollowers: profile1.totalFollowers,
      qualityScore: profile1.qualityScore,
      primaryAge: demographic1 ? Object.entries(demographic1.ageGroups)[0][0] : 'unknown',
      primaryGender: demographic1 ? (demographic1.genderSplit.male > demographic1.genderSplit.female ? 'male' : 'female') : 'unknown'
    },
    account2: {
      totalFollowers: profile2.totalFollowers,
      qualityScore: profile2.qualityScore,
      primaryAge: demographic2 ? Object.entries(demographic2.ageGroups)[0][0] : 'unknown',
      primaryGender: demographic2 ? (demographic2.genderSplit.male > demographic2.genderSplit.female ? 'male' : 'female') : 'unknown'
    },
    comparison: {
      followerDifference: profile2.totalFollowers - profile1.totalFollowers,
      qualityScoreDifference: profile2.qualityScore - profile1.qualityScore,
      audienceOverlap: Math.floor(Math.random() * 30) + 10 // Simulated overlap percentage
    }
  };
}

/**
 * Get audience statistics
 */
function getAudienceStatistics(accountId) {
  const profiles = Array.from(audienceProfiles.values()).filter(p => p.accountId === accountId);
  const demographicData = Array.from(demographics.values()).filter(d => d.accountId === accountId);
  const interests = Array.from(interestAnalysis.values()).filter(i => i.accountId === accountId);
  const behaviors = Array.from(behaviorPatterns.values()).filter(b => b.accountId === accountId);
  const segments = Array.from(growthSegments.values()).filter(s => s.accountId === accountId);

  if (profiles.length === 0) {
    return { available: false, message: 'No audience data available' };
  }

  const latestProfile = profiles.sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt)[0];

  return {
    accountId,
    totalFollowers: latestProfile.totalFollowers,
    activeFollowers: latestProfile.activeFollowers,
    qualityScore: latestProfile.qualityScore,
    totalDemographicAnalyses: demographicData.length,
    totalInterestAnalyses: interests.length,
    totalBehaviorAnalyses: behaviors.length,
    totalSegmentations: segments.length,
    lastUpdated: latestProfile.lastUpdatedAt
  };
}

module.exports = {
  createAudienceProfile,
  analyzeDemographics,
  analyzeAudienceInterests,
  trackBehaviorPatterns,
  segmentAudienceByGrowth,
  compareAudienceSegments,
  getAudienceStatistics
};
