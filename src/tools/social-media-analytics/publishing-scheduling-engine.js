/**
 * Publishing & Scheduling Engine
 * Manages content calendar, auto-posting, queue management, and scheduling optimization
 */

// In-memory storage
const scheduledPosts = new Map();
const contentQueues = new Map();
const publishingRules = new Map();
const calendarEvents = new Map();
const autoPostLogs = new Map();

let postIdCounter = 1;
let queueIdCounter = 1;
let ruleIdCounter = 1;
let eventIdCounter = 1;
let logIdCounter = 1;

/**
 * Schedule post
 */
function schedulePost({ accountId, platform, content, mediaUrls, scheduledFor, postType, hashtags, mentions, location, settings }) {
  const post = {
    id: postIdCounter++,
    accountId,
    platform, // facebook, instagram, twitter, linkedin, tiktok, youtube, pinterest
    content: {
      text: content.text || '',
      mediaUrls: mediaUrls || [],
      mediaType: content.mediaType || 'text', // text, image, video, carousel, story, reel
      altText: content.altText || [],
      firstComment: content.firstComment || ''
    },
    scheduledFor: new Date(scheduledFor),
    postType: postType || 'feed', // feed, story, reel, video, carousel
    hashtags: hashtags || [],
    mentions: mentions || [],
    location: location || null,
    settings: {
      notifyFollowers: settings?.notifyFollowers || false,
      disableComments: settings?.disableComments || false,
      crossPost: settings?.crossPost || [],
      trackConversions: settings?.trackConversions || false,
      utmParameters: settings?.utmParameters || null
    },
    status: 'scheduled', // scheduled, publishing, published, failed, cancelled
    publishedAt: null,
    publishedPostId: null,
    error: null,
    createdAt: new Date(),
    createdBy: 'user'
  };

  scheduledPosts.set(post.id, post);

  // Add to calendar
  addToCalendar(accountId, post);

  return post;
}

/**
 * Cancel scheduled post
 */
function cancelScheduledPost(postId) {
  const post = scheduledPosts.get(postId);
  if (!post) {
    throw new Error('Scheduled post not found');
  }

  if (post.status === 'published') {
    throw new Error('Cannot cancel already published post');
  }

  if (post.status === 'publishing') {
    throw new Error('Cannot cancel post currently being published');
  }

  post.status = 'cancelled';
  return post;
}

/**
 * Publish scheduled post (simulated)
 */
function publishScheduledPost(postId) {
  const post = scheduledPosts.get(postId);
  if (!post) {
    throw new Error('Scheduled post not found');
  }

  if (post.status !== 'scheduled') {
    throw new Error(`Cannot publish post with status: ${post.status}`);
  }

  post.status = 'publishing';

  // Simulate publishing process
  const success = Math.random() > 0.05; // 95% success rate

  if (success) {
    post.status = 'published';
    post.publishedAt = new Date();
    post.publishedPostId = `${post.platform}_${Date.now()}`;

    // Log auto-post
    logAutoPost(postId, 'success');

    // Handle cross-posting
    if (post.settings.crossPost && post.settings.crossPost.length > 0) {
      post.settings.crossPost.forEach(platform => {
        schedulePost({
          ...post,
          platform,
          scheduledFor: new Date(),
          createdBy: 'auto_crosspost'
        });
      });
    }
  } else {
    post.status = 'failed';
    post.error = 'Platform API error - authentication failed';
    logAutoPost(postId, 'failed', post.error);
  }

  return post;
}

/**
 * Create content queue
 */
function createContentQueue({ accountId, name, platforms, autoPost, schedule, filters }) {
  const queue = {
    id: queueIdCounter++,
    accountId,
    name,
    platforms: platforms || [],
    autoPost: autoPost || false,
    schedule: schedule || {
      frequency: 'daily', // daily, bidaily, weekly
      times: ['09:00', '15:00', '20:00'],
      timezone: 'UTC',
      skipWeekends: false
    },
    filters: filters || {
      postTypes: ['feed', 'story'],
      minQualityScore: 50,
      requireMedia: false
    },
    posts: [],
    stats: {
      totalPosts: 0,
      publishedPosts: 0,
      failedPosts: 0,
      avgPublishTime: 0
    },
    isActive: true,
    createdAt: new Date()
  };

  contentQueues.set(queue.id, queue);
  return queue;
}

/**
 * Add post to queue
 */
function addToQueue(queueId, { content, mediaUrls, hashtags, postType, priority }) {
  const queue = contentQueues.get(queueId);
  if (!queue) {
    throw new Error('Queue not found');
  }

  const queuedPost = {
    id: `q_${postIdCounter++}`,
    content,
    mediaUrls: mediaUrls || [],
    hashtags: hashtags || [],
    postType: postType || 'feed',
    priority: priority || 'normal', // urgent, high, normal, low
    addedAt: new Date(),
    scheduledSlot: null,
    status: 'queued'
  };

  queue.posts.push(queuedPost);
  queue.stats.totalPosts++;

  // Auto-schedule if queue has auto-post enabled
  if (queue.autoPost) {
    assignNextSlot(queueId, queuedPost.id);
  }

  return queuedPost;
}

/**
 * Assign next available slot to queued post
 */
function assignNextSlot(queueId, postId) {
  const queue = contentQueues.get(queueId);
  if (!queue) return;

  const post = queue.posts.find(p => p.id === postId);
  if (!post) return;

  // Find next available slot based on queue schedule
  const now = new Date();
  const schedule = queue.schedule;

  let nextSlot = new Date(now);

  // Simple slot assignment - find next scheduled time
  const todayTimes = schedule.times.map(time => {
    const [hours, minutes] = time.split(':');
    const slotTime = new Date(now);
    slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return slotTime;
  });

  const futureSlots = todayTimes.filter(t => t > now);
  if (futureSlots.length > 0) {
    nextSlot = futureSlots[0];
  } else {
    // Use first slot of next day
    nextSlot = new Date(now);
    nextSlot.setDate(nextSlot.getDate() + 1);
    const [hours, minutes] = schedule.times[0].split(':');
    nextSlot.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }

  // Skip weekends if configured
  if (schedule.skipWeekends) {
    while (nextSlot.getDay() === 0 || nextSlot.getDay() === 6) {
      nextSlot.setDate(nextSlot.getDate() + 1);
    }
  }

  post.scheduledSlot = nextSlot;
  post.status = 'scheduled';

  // Create actual scheduled post
  const actualPost = schedulePost({
    accountId: queue.accountId,
    platform: queue.platforms[0], // Use first platform
    content: { text: post.content, mediaType: 'image' },
    mediaUrls: post.mediaUrls,
    scheduledFor: nextSlot,
    postType: post.postType,
    hashtags: post.hashtags,
    settings: {
      crossPost: queue.platforms.slice(1) // Cross-post to other platforms
    }
  });

  post.scheduledPostId = actualPost.id;

  return post;
}

/**
 * Create publishing rule
 */
function createPublishingRule({ accountId, name, condition, action, priority, isActive }) {
  const rule = {
    id: ruleIdCounter++,
    accountId,
    name,
    condition: condition || {
      type: 'time_based', // time_based, content_based, performance_based
      timeRange: { start: '09:00', end: '21:00' },
      days: [1, 2, 3, 4, 5], // Monday-Friday
      postTypes: ['feed', 'story'],
      minQualityScore: 60
    },
    action: action || {
      type: 'auto_schedule', // auto_schedule, notify, hold_for_review
      targetSlot: 'next_available',
      platforms: ['instagram', 'facebook']
    },
    priority: priority || 'medium', // urgent, high, medium, low
    isActive: isActive !== undefined ? isActive : true,
    timesTriggered: 0,
    lastTriggered: null,
    createdAt: new Date()
  };

  publishingRules.set(rule.id, rule);
  return rule;
}

/**
 * Add to calendar
 */
function addToCalendar(accountId, post) {
  const event = {
    id: eventIdCounter++,
    accountId,
    postId: post.id,
    title: post.content.text.substring(0, 50) || 'Scheduled Post',
    description: `${post.platform} ${post.postType}`,
    startTime: post.scheduledFor,
    endTime: new Date(post.scheduledFor.getTime() + 30 * 60000), // 30 min duration
    platform: post.platform,
    postType: post.postType,
    status: post.status,
    color: getPlatformColor(post.platform),
    createdAt: new Date()
  };

  calendarEvents.set(event.id, event);
  return event;
}

/**
 * Get platform color
 */
function getPlatformColor(platform) {
  const colors = {
    facebook: '#1877f2',
    instagram: '#e4405f',
    twitter: '#1da1f2',
    linkedin: '#0077b5',
    tiktok: '#000000',
    youtube: '#ff0000',
    pinterest: '#e60023'
  };
  return colors[platform] || '#666666';
}

/**
 * Log auto-post
 */
function logAutoPost(postId, status, error = null) {
  const log = {
    id: logIdCounter++,
    postId,
    status, // success, failed
    error,
    timestamp: new Date()
  };

  autoPostLogs.set(log.id, log);
  return log;
}

/**
 * Get calendar view
 */
function getCalendarView(accountId, { startDate, endDate, platforms, postTypes }) {
  let events = Array.from(calendarEvents.values())
    .filter(e => e.accountId === accountId &&
      e.startTime >= new Date(startDate) &&
      e.startTime <= new Date(endDate));

  if (platforms && platforms.length > 0) {
    events = events.filter(e => platforms.includes(e.platform));
  }

  if (postTypes && postTypes.length > 0) {
    events = events.filter(e => postTypes.includes(e.postType));
  }

  // Group by date
  const eventsByDate = {};
  events.forEach(event => {
    const dateKey = event.startTime.toISOString().split('T')[0];
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);
  });

  return {
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    totalEvents: events.length,
    eventsByDate,
    platformBreakdown: getPlatformBreakdown(events),
    postTypeBreakdown: getPostTypeBreakdown(events)
  };
}

function getPlatformBreakdown(events) {
  const breakdown = {};
  events.forEach(e => {
    breakdown[e.platform] = (breakdown[e.platform] || 0) + 1;
  });
  return breakdown;
}

function getPostTypeBreakdown(events) {
  const breakdown = {};
  events.forEach(e => {
    breakdown[e.postType] = (breakdown[e.postType] || 0) + 1;
  });
  return breakdown;
}

/**
 * Get best posting times
 */
function getBestPostingTimes(accountId, { platform, lookbackDays = 30 }) {
  // Analyze historical performance to suggest best times
  const recommendations = {
    accountId,
    platform: platform || 'all',
    lookbackDays,
    bestHours: [
      { hour: 9, dayOfWeek: 2, avgEngagement: 850, confidence: 'high' },
      { hour: 15, dayOfWeek: 4, avgEngagement: 820, confidence: 'high' },
      { hour: 20, dayOfWeek: 1, avgEngagement: 780, confidence: 'medium' }
    ],
    worstHours: [
      { hour: 3, dayOfWeek: 0, avgEngagement: 120, confidence: 'high' },
      { hour: 11, dayOfWeek: 6, avgEngagement: 180, confidence: 'medium' }
    ],
    recommendations: [
      'Post on Tuesdays and Thursdays at 9 AM or 3 PM for best engagement',
      'Avoid posting on Sunday mornings (low engagement)',
      'Evening posts (8-9 PM) perform well on weekdays'
    ],
    analyzedAt: new Date()
  };

  return recommendations;
}

/**
 * Bulk schedule posts
 */
function bulkSchedulePosts(accountId, posts) {
  const scheduled = [];
  const failed = [];

  posts.forEach((postData, index) => {
    try {
      const post = schedulePost({
        accountId,
        ...postData
      });
      scheduled.push(post);
    } catch (error) {
      failed.push({
        index,
        postData,
        error: error.message
      });
    }
  });

  return {
    success: scheduled.length,
    failed: failed.length,
    scheduledPosts: scheduled,
    failedPosts: failed
  };
}

/**
 * Get publishing statistics
 */
function getPublishingStatistics(accountId) {
  const posts = Array.from(scheduledPosts.values()).filter(p => p.accountId === accountId);
  const queues = Array.from(contentQueues.values()).filter(q => q.accountId === accountId);
  const rules = Array.from(publishingRules.values()).filter(r => r.accountId === accountId);
  const events = Array.from(calendarEvents.values()).filter(e => e.accountId === accountId);
  const logs = Array.from(autoPostLogs.values());

  return {
    accountId,
    totalScheduledPosts: posts.length,
    scheduledPosts: posts.filter(p => p.status === 'scheduled').length,
    publishedPosts: posts.filter(p => p.status === 'published').length,
    failedPosts: posts.filter(p => p.status === 'failed').length,
    cancelledPosts: posts.filter(p => p.status === 'cancelled').length,
    totalQueues: queues.length,
    activeQueues: queues.filter(q => q.isActive).length,
    totalRules: rules.length,
    activeRules: rules.filter(r => r.isActive).length,
    totalCalendarEvents: events.length,
    successRate: logs.length > 0 ?
      ((logs.filter(l => l.status === 'success').length / logs.length) * 100).toFixed(2) : 0
  };
}

module.exports = {
  schedulePost,
  cancelScheduledPost,
  publishScheduledPost,
  createContentQueue,
  addToQueue,
  createPublishingRule,
  getCalendarView,
  getBestPostingTimes,
  bulkSchedulePosts,
  getPublishingStatistics
};
