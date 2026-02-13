/**
 * Gamification & Challenges Engine
 * Manages challenges, achievements, badges, streaks, and gamification mechanics
 */

// Storage
const challenges = new Map(); // challengeId -> challenge
const achievements = new Map(); // achievementId -> achievement
const badges = new Map(); // badgeId -> badge
const customerProgress = new Map(); // customerId -> progress data
const customerAchievements = new Map(); // customerId -> Set of achievementIds
const customerBadges = new Map(); // customerId -> Set of badgeIds

let challengeCounter = 1;
let achievementCounter = 1;
let badgeCounter = 1;

/**
 * Create challenge
 */
function createChallenge(data) {
  const challenge = {
    id: `challenge_${challengeCounter++}`,
    name: data.name,
    description: data.description || '',
    type: data.type, // daily, weekly, monthly, milestone, custom
    goal: {
      action: data.goal.action, // purchase, review, referral, login, social_share
      target: data.goal.target, // Number required to complete
      period: data.goal.period || null, // Time period for completion
    },
    rewards: {
      points: data.rewards.points || 0,
      badge: data.rewards.badge || null,
      multiplier: data.rewards.multiplier || 1,
      custom: data.rewards.custom || null,
    },
    difficulty: data.difficulty || 'medium', // easy, medium, hard, expert
    startDate: data.startDate || new Date().toISOString(),
    endDate: data.endDate || null,
    recurring: data.recurring || false,
    maxParticipants: data.maxParticipants || null,
    status: 'active', // active, completed, expired
    createdAt: new Date().toISOString(),
    participants: new Set(),
    completions: new Set(),
    statistics: {
      totalParticipants: 0,
      totalCompletions: 0,
      completionRate: 0,
      averageProgress: 0,
    },
  };
  
  challenges.set(challenge.id, challenge);
  return challenge;
}

/**
 * Get active challenges
 */
function getActiveChallenges(options = {}) {
  const { type, difficulty, customerId } = options;
  
  const now = new Date();
  
  let activeChallenges = Array.from(challenges.values())
    .filter(c => c.status === 'active')
    .filter(c => !c.endDate || new Date(c.endDate) > now)
    .filter(c => !type || c.type === type)
    .filter(c => !difficulty || c.difficulty === difficulty)
    .filter(c => !c.maxParticipants || c.participants.size < c.maxParticipants);
  
  // Add customer progress if customerId provided
  if (customerId) {
    const progress = customerProgress.get(customerId) || {};
    
    activeChallenges = activeChallenges.map(challenge => ({
      ...challenge,
      customerProgress: progress[challenge.id] || {
        current: 0,
        target: challenge.goal.target,
        percentage: 0,
        completed: false,
      },
    }));
  }
  
  return {
    challenges: activeChallenges,
    total: activeChallenges.length,
  };
}

/**
 * Join challenge
 */
function joinChallenge(customerId, challengeId) {
  const challenge = challenges.get(challengeId);
  
  if (!challenge) {
    throw new Error('Challenge not found');
  }
  
  if (challenge.status !== 'active') {
    throw new Error('Challenge is not active');
  }
  
  if (challenge.maxParticipants && challenge.participants.size >= challenge.maxParticipants) {
    throw new Error('Challenge is full');
  }
  
  challenge.participants.add(customerId);
  challenge.statistics.totalParticipants++;
  
  // Initialize progress
  if (!customerProgress.has(customerId)) {
    customerProgress.set(customerId, {});
  }
  
  const progress = customerProgress.get(customerId);
  progress[challengeId] = {
    challengeId,
    current: 0,
    target: challenge.goal.target,
    percentage: 0,
    completed: false,
    joinedAt: new Date().toISOString(),
  };
  
  return {
    customerId,
    challengeId,
    challenge: challenge.name,
    joined: true,
  };
}

/**
 * Update challenge progress
 */
function updateChallengeProgress(customerId, challengeId, increment = 1) {
  const challenge = challenges.get(challengeId);
  
  if (!challenge) {
    throw new Error('Challenge not found');
  }
  
  if (!customerProgress.has(customerId)) {
    customerProgress.set(customerId, {});
  }
  
  const progress = customerProgress.get(customerId);
  
  if (!progress[challengeId]) {
    // Auto-join if not already participating
    joinChallenge(customerId, challengeId);
  }
  
  const challengeProgress = progress[challengeId];
  challengeProgress.current = Math.min(challengeProgress.current + increment, challengeProgress.target);
  challengeProgress.percentage = Math.round((challengeProgress.current / challengeProgress.target) * 100);
  challengeProgress.lastUpdated = new Date().toISOString();
  
  // Check completion
  if (!challengeProgress.completed && challengeProgress.current >= challengeProgress.target) {
    return completeChallenge(customerId, challengeId);
  }
  
  return challengeProgress;
}

/**
 * Complete challenge
 */
function completeChallenge(customerId, challengeId) {
  const challenge = challenges.get(challengeId);
  const progress = customerProgress.get(customerId)?.[challengeId];
  
  if (!challenge || !progress) {
    throw new Error('Challenge or progress not found');
  }
  
  if (progress.completed) {
    return progress; // Already completed
  }
  
  progress.completed = true;
  progress.completedAt = new Date().toISOString();
  
  challenge.completions.add(customerId);
  challenge.statistics.totalCompletions++;
  challenge.statistics.completionRate = challenge.participants.size > 0
    ? ((challenge.completions.size / challenge.participants.size) * 100).toFixed(2)
    : 0;
  
  // Award rewards
  const rewards = {
    points: challenge.rewards.points,
    badge: challenge.rewards.badge,
    multiplier: challenge.rewards.multiplier,
    custom: challenge.rewards.custom,
  };
  
  return {
    ...progress,
    rewards,
  };
}

/**
 * Create achievement
 */
function createAchievement(data) {
  const achievement = {
    id: `achievement_${achievementCounter++}`,
    name: data.name,
    description: data.description || '',
    category: data.category || 'general', // purchase, engagement, referral, milestone
    criteria: data.criteria, // { type, threshold }
    icon: data.icon || null,
    rarity: data.rarity || 'common', // common, rare, epic, legendary
    points: data.points || 0,
    badge: data.badge || null,
    hidden: data.hidden || false, // Secret achievements
    enabled: data.enabled !== false,
    createdAt: new Date().toISOString(),
    statistics: {
      totalUnlocked: 0,
      unlockRate: 0,
    },
  };
  
  achievements.set(achievement.id, achievement);
  return achievement;
}

/**
 * Unlock achievement
 */
function unlockAchievement(customerId, achievementId) {
  const achievement = achievements.get(achievementId);
  
  if (!achievement) {
    throw new Error('Achievement not found');
  }
  
  if (!customerAchievements.has(customerId)) {
    customerAchievements.set(customerId, new Set());
  }
  
  const unlockedAchievements = customerAchievements.get(customerId);
  
  if (unlockedAchievements.has(achievementId)) {
    return { alreadyUnlocked: true }; // Already unlocked
  }
  
  unlockedAchievements.add(achievementId);
  achievement.statistics.totalUnlocked++;
  
  return {
    customerId,
    achievementId,
    achievement: {
      name: achievement.name,
      description: achievement.description,
      rarity: achievement.rarity,
      points: achievement.points,
    },
    unlockedAt: new Date().toISOString(),
  };
}

/**
 * Get customer achievements
 */
function getCustomerAchievements(customerId) {
  const unlockedIds = customerAchievements.get(customerId) || new Set();
  
  const unlocked = Array.from(unlockedIds)
    .map(id => achievements.get(id))
    .filter(a => a);
  
  const locked = Array.from(achievements.values())
    .filter(a => !a.hidden && !unlockedIds.has(a.id));
  
  return {
    customerId,
    unlocked,
    locked,
    totalUnlocked: unlocked.length,
    totalAvailable: achievements.size - Array.from(achievements.values()).filter(a => a.hidden).length,
    completionPercentage: Math.round((unlocked.length / achievements.size) * 100),
  };
}

/**
 * Create badge
 */
function createBadge(data) {
  const badge = {
    id: `badge_${badgeCounter++}`,
    name: data.name,
    description: data.description || '',
    imageUrl: data.imageUrl || null,
    category: data.category || 'general',
    tier: data.tier || 1, // Badge level/tier
    criteria: data.criteria || {},
    displayOnProfile: data.displayOnProfile !== false,
    enabled: data.enabled !== false,
    createdAt: new Date().toISOString(),
    holders: new Set(),
  };
  
  badges.set(badge.id, badge);
  return badge;
}

/**
 * Award badge
 */
function awardBadge(customerId, badgeId) {
  const badge = badges.get(badgeId);
  
  if (!badge) {
    throw new Error('Badge not found');
  }
  
  if (!customerBadges.has(customerId)) {
    customerBadges.set(customerId, new Set());
  }
  
  const earnedBadges = customerBadges.get(customerId);
  
  if (earnedBadges.has(badgeId)) {
    return { alreadyEarned: true };
  }
  
  earnedBadges.add(badgeId);
  badge.holders.add(customerId);
  
  return {
    customerId,
    badgeId,
    badge: {
      name: badge.name,
      description: badge.description,
      tier: badge.tier,
    },
    awardedAt: new Date().toISOString(),
  };
}

/**
 * Get customer badges
 */
function getCustomerBadges(customerId) {
  const earnedIds = customerBadges.get(customerId) || new Set();
  
  const earned = Array.from(earnedIds)
    .map(id => badges.get(id))
    .filter(b => b);
  
  return {
    customerId,
    badges: earned,
    total: earned.length,
  };
}

/**
 * Track streak
 */
function trackStreak(customerId, action = 'login') {
  if (!customerProgress.has(customerId)) {
    customerProgress.set(customerId, {});
  }
  
  const progress = customerProgress.get(customerId);
  
  if (!progress.streaks) {
    progress.streaks = {};
  }
  
  const today = new Date().toISOString().split('T')[0];
  const streak = progress.streaks[action] || {
    current: 0,
    longest: 0,
    lastActivity: null,
  };
  
  const lastActivity = streak.lastActivity;
  
  if (!lastActivity || lastActivity !== today) {
    // Check if consecutive day
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (lastActivity === yesterdayStr) {
      // Consecutive day - increment
      streak.current++;
    } else if (!lastActivity || lastActivity < yesterdayStr) {
      // Streak broken - reset
      streak.current = 1;
    }
    
    streak.lastActivity = today;
    
    // Update longest
    if (streak.current > streak.longest) {
      streak.longest = streak.current;
    }
    
    progress.streaks[action] = streak;
  }
  
  return streak;
}

/**
 * Get customer streaks
 */
function getCustomerStreaks(customerId) {
  const progress = customerProgress.get(customerId);
  
  return progress?.streaks || {};
}

/**
 * Calculate level from points
 */
function calculateLevel(totalPoints) {
  // Simple level calculation: every 1000 points = 1 level
  const pointsPerLevel = 1000;
  const level = Math.floor(totalPoints / pointsPerLevel) + 1;
  const currentLevelPoints = totalPoints % pointsPerLevel;
  const nextLevelPoints = pointsPerLevel;
  const progress = (currentLevelPoints / nextLevelPoints) * 100;
  
  return {
    level,
    totalPoints,
    currentLevelPoints,
    nextLevelPoints,
    progress: Math.round(progress),
  };
}

/**
 * Get leaderboard
 */
function getLeaderboard(options = {}) {
  const { metric = 'points', period = 'all', limit = 10 } = options;
  
  // In a real implementation, this would query customer data
  // For now, returning structure
  return {
    metric,
    period,
    leaders: [],
    total: 0,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get gamification statistics
 */
function getGamificationStatistics() {
  return {
    challenges: {
      total: challenges.size,
      active: Array.from(challenges.values()).filter(c => c.status === 'active').length,
      totalParticipants: Array.from(challenges.values())
        .reduce((sum, c) => sum + c.participants.size, 0),
      totalCompletions: Array.from(challenges.values())
        .reduce((sum, c) => sum + c.completions.size, 0),
    },
    achievements: {
      total: achievements.size,
      totalUnlocked: Array.from(achievements.values())
        .reduce((sum, a) => sum + a.statistics.totalUnlocked, 0),
    },
    badges: {
      total: badges.size,
      totalAwarded: Array.from(badges.values())
        .reduce((sum, b) => sum + b.holders.size, 0),
    },
  };
}

module.exports = {
  createChallenge,
  getActiveChallenges,
  joinChallenge,
  updateChallengeProgress,
  completeChallenge,
  createAchievement,
  unlockAchievement,
  getCustomerAchievements,
  createBadge,
  awardBadge,
  getCustomerBadges,
  trackStreak,
  getCustomerStreaks,
  calculateLevel,
  getLeaderboard,
  getGamificationStatistics,
};
