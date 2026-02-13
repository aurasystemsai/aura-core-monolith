/**
 * Member Portal Engine
 * Manages customer dashboard, activity feeds, preferences, and self-service features
 */

// Storage
const customerPreferences = new Map(); // customerId -> preferences
const activityFeeds = new Map(); // customerId -> activity array
const notifications = new Map(); // customerId -> notification array
const savedRewards = new Map(); // customerId -> Set of rewardIds

/**
 * Get customer dashboard
 */
function getCustomerDashboard(customerId, options = {}) {
  // In a real implementation, this would aggregate data from all engines
  // For now, returning structure
  const dashboard = {
    customerId,
    overview: {
      pointsBalance: 0,
      lifetimePoints: 0,
      tier: {
        name: 'Bronze',
        level: 1,
        progress: 0,
      },
      activeStreaks: 0,
      unlockedBadges: 0,
      activeReferrals: 0,
    },
    quickActions: [
      { id: 'earn_points', label: 'Earn Points', icon: 'star' },
      { id: 'browse_rewards', label: 'Browse Rewards', icon: 'gift' },
      { id: 'refer_friend', label: 'Refer a Friend', icon: 'users' },
      { id: 'view_challenges', label: 'View Challenges', icon: 'target' },
    ],
    recentActivity: [],
    upcomingRewards: [],
    recommendations: [],
    generatedAt: new Date().toISOString(),
  };
  
  return dashboard;
}

/**
 * Get activity feed
 */
function getActivityFeed(customerId, options = {}) {
  const { limit = 20, offset = 0, type } = options;
  
  let activities = activityFeeds.get(customerId) || [];
  
  if (type) {
    activities = activities.filter(a => a.type === type);
  }
  
  const paginated = activities.slice(offset, offset + limit);
  
  return {
    customerId,
    activities: paginated,
    total: activities.length,
    hasMore: offset + limit < activities.length,
  };
}

/**
 * Add activity
 */
function addActivity(customerId, activity) {
  if (!activityFeeds.has(customerId)) {
    activityFeeds.set(customerId, []);
  }
  
  const feed = activityFeeds.get(customerId);
  
  const newActivity = {
    id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: activity.type, // points_earned, reward_redeemed, tier_upgraded, badge_unlocked, etc.
    title: activity.title,
    description: activity.description || '',
    metadata: activity.metadata || {},
    timestamp: new Date().toISOString(),
    read: false,
  };
  
  feed.unshift(newActivity); // Add to beginning
  
  // Limit feed size
  if (feed.length > 200) {
    feed.length = 200;
  }
  
  return newActivity;
}

/**
 * Mark activity as read
 */
function markActivityRead(customerId, activityId) {
  const feed = activityFeeds.get(customerId);
  
  if (!feed) {
    return { success: false };
  }
  
  const activity = feed.find(a => a.id === activityId);
  
  if (activity) {
    activity.read = true;
    return { success: true, activity };
  }
  
  return { success: false };
}

/**
 * Get customer preferences
 */
function getCustomerPreferences(customerId) {
  const prefs = customerPreferences.get(customerId) || createDefaultPreferences(customerId);
  
  return {
    customerId,
    preferences: prefs,
  };
}

/**
 * Create default preferences
 */
function createDefaultPreferences(customerId) {
  const defaultPrefs = {
    notifications: {
      email: {
        pointsEarned: true,
        tierUpgrade: true,
        rewardAvailable: true,
        challengeCompleted: true,
        referralQualified: true,
        promotions: false,
      },
      push: {
        pointsEarned: false,
        tierUpgrade: true,
        rewardAvailable: false,
        challengeCompleted: true,
        referralQualified: true,
        promotions: false,
      },
      sms: {
        pointsEarned: false,
        tierUpgrade: true,
        rewardAvailable: false,
        challengeCompleted: false,
        referralQualified: false,
        promotions: false,
      },
    },
    privacy: {
      showOnLeaderboard: true,
      shareBadges: true,
      shareAchievements: true,
      allowMarketing: false,
    },
    display: {
      language: 'en',
      currency: 'USD',
      theme: 'light', // light, dark, auto
      compactView: false,
    },
    communication: {
      preferredChannel: 'email',
      frequency: 'weekly', // daily, weekly, monthly
      digestEnabled: true,
    },
    updatedAt: new Date().toISOString(),
  };
  
  customerPreferences.set(customerId, defaultPrefs);
  return defaultPrefs;
}

/**
 * Update customer preferences
 */
function updateCustomerPreferences(customerId, updates) {
  let prefs = customerPreferences.get(customerId);
  
  if (!prefs) {
    prefs = createDefaultPreferences(customerId);
  }
  
  // Deep merge updates
  if (updates.notifications) {
    prefs.notifications = { ...prefs.notifications, ...updates.notifications };
  }
  
  if (updates.privacy) {
    prefs.privacy = { ...prefs.privacy, ...updates.privacy };
  }
  
  if (updates.display) {
    prefs.display = { ...prefs.display, ...updates.display };
  }
  
  if (updates.communication) {
    prefs.communication = { ...prefs.communication, ...updates.communication };
  }
  
  prefs.updatedAt = new Date().toISOString();
  
  customerPreferences.set(customerId, prefs);
  
  return {
    customerId,
    preferences: prefs,
  };
}

/**
 * Save reward
 */
function saveReward(customerId, rewardId) {
  if (!savedRewards.has(customerId)) {
    savedRewards.set(customerId, new Set());
  }
  
  const saved = savedRewards.get(customerId);
  saved.add(rewardId);
  
  return {
    customerId,
    rewardId,
    saved: true,
  };
}

/**
 * Unsave reward
 */
function unsaveReward(customerId, rewardId) {
  const saved = savedRewards.get(customerId);
  
  if (!saved) {
    return { success: false };
  }
  
  saved.delete(rewardId);
  
  return {
    customerId,
    rewardId,
    removed: true,
  };
}

/**
 * Get saved rewards
 */
function getSavedRewards(customerId) {
  const saved = savedRewards.get(customerId) || new Set();
  
  return {
    customerId,
    rewardIds: Array.from(saved),
    total: saved.length,
  };
}

/**
 * Get notifications
 */
function getNotifications(customerId, options = {}) {
  const { limit = 20, unreadOnly = false } = options;
  
  let userNotifications = notifications.get(customerId) || [];
  
  if (unreadOnly) {
    userNotifications = userNotifications.filter(n => !n.read);
  }
  
  const limited = userNotifications.slice(0, limit);
  
  return {
    customerId,
    notifications: limited,
    total: userNotifications.length,
    unreadCount: userNotifications.filter(n => !n.read).length,
  };
}

/**
 * Create notification
 */
function createNotification(customerId, data) {
  if (!notifications.has(customerId)) {
    notifications.set(customerId, []);
  }
  
  const userNotifications = notifications.get(customerId);
  
  const notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: data.type,
    title: data.title,
    message: data.message,
    actionUrl: data.actionUrl || null,
    priority: data.priority || 'normal', // low, normal, high
    read: false,
    createdAt: new Date().toISOString(),
  };
  
  userNotifications.unshift(notification);
  
  // Limit notifications
  if (userNotifications.length > 100) {
    userNotifications.length = 100;
  }
  
  return notification;
}

/**
 * Mark notification as read
 */
function markNotificationRead(customerId, notificationId) {
  const userNotifications = notifications.get(customerId);
  
  if (!userNotifications) {
    return { success: false };
  }
  
  const notification = userNotifications.find(n => n.id === notificationId);
  
  if (notification) {
    notification.read = true;
    notification.readAt = new Date().toISOString();
    return { success: true, notification };
  }
  
  return { success: false };
}

/**
 * Get member portal statistics
 */
function getPortalStatistics() {
  return {
    totalCustomers: customerPreferences.size,
    totalActivities: Array.from(activityFeeds.values())
      .reduce((sum, activities) => sum + activities.length, 0),
    totalNotifications: Array.from(notifications.values())
      .reduce((sum, notifs) => sum + notifs.length, 0),
    savedRewards: Array.from(savedRewards.values())
      .reduce((sum, saved) => sum + saved.size, 0),
  };
}

module.exports = {
  getCustomerDashboard,
  getActivityFeed,
  addActivity,
  markActivityRead,
  getCustomerPreferences,
  updateCustomerPreferences,
  saveReward,
  unsaveReward,
  getSavedRewards,
  getNotifications,
  createNotification,
  markNotificationRead,
  getPortalStatistics,
};
