/**
 * Moderation & Filtering Engine
 * Handles content moderation, spam detection, profanity filtering, and automated rules
 */

// In-memory storage
const moderationRules = new Map();
const blockedWords = new Set();
const blockedEmails = new Set();
const blockedIPs = new Set();
const moderationQueue = new Map();
const moderationHistory = new Map();

let ruleIdCounter = 1;
let queueIdCounter = 1;

// Initialize default blocked words
initializeDefaultBlockedWords();

/**
 * Initialize default profanity and spam words
 */
function initializeDefaultBlockedWords() {
  const defaultBlocked = [
    'spam', 'scam', 'fake', 'counterfeit', 'knock-off',
    // Add more as needed - keeping minimal for demo
  ];
  defaultBlocked.forEach(word => blockedWords.add(word.toLowerCase()));
}

/**
 * Create moderation rule
 */
function createModerationRule(ruleData) {
  const rule = {
    id: `rule_${ruleIdCounter++}`,
    name: ruleData.name,
    type: ruleData.type, // auto_approve, auto_reject, flag_for_review
    conditions: ruleData.conditions, // rating, length, keywords, verified
    action: ruleData.action, // approve, reject, flag, hold
    priority: ruleData.priority || 0,
    enabled: ruleData.enabled !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    statistics: {
      applied: 0,
      approved: 0,
      rejected: 0,
      flagged: 0,
    },
  };

  moderationRules.set(rule.id, rule);
  return rule;
}

/**
 * Update moderation rule
 */
function updateModerationRule(ruleId, updates) {
  const rule = moderationRules.get(ruleId);
  if (!rule) {
    throw new Error('Moderation rule not found');
  }

  Object.assign(rule, updates, {
    updatedAt: new Date().toISOString(),
  });

  return rule;
}

/**
 * Get moderation rule
 */
function getModerationRule(ruleId) {
  return moderationRules.get(ruleId);
}

/**
 * List moderation rules
 */
function listModerationRules(options = {}) {
  const { enabled = null } = options;

  let rules = Array.from(moderationRules.values());

  if (enabled !== null) {
    rules = rules.filter(r => r.enabled === enabled);
  }

  // Sort by priority (higher priority first)
  rules.sort((a, b) => b.priority - a.priority);

  return rules;
}

/**
 * Delete moderation rule
 */
function deleteModerationRule(ruleId) {
  const deleted = moderationRules.delete(ruleId);
  if (!deleted) {
    throw new Error('Moderation rule not found');
  }
  return { success: true, deletedRuleId: ruleId };
}

/**
 * Apply moderation rules to content
 */
function moderateContent(content) {
  const results = {
    status: 'approved', // approved, rejected, flagged, pending
    appliedRules: [],
    flags: [],
    score: 100, // 0-100, lower is worse
    recommendations: [],
  };

  // Check profanity
  const profanityCheck = checkProfanity(content.content);
  if (profanityCheck.found) {
    results.flags.push({
      type: 'profanity',
      severity: 'high',
      details: profanityCheck.words,
    });
    results.score -= 30;
    results.status = 'rejected';
    results.recommendations.push('Remove profanity and resubmit');
  }

  // Check spam indicators
  const spamCheck = checkSpam(content.content);
  if (spamCheck.isSpam) {
    results.flags.push({
      type: 'spam',
      severity: 'high',
      details: spamCheck.indicators,
    });
    results.score -= 40;
    results.status = 'rejected';
    results.recommendations.push('Content appears to be spam');
  }

  // Check blocked email/IP
  if (content.customerEmail && blockedEmails.has(content.customerEmail)) {
    results.flags.push({
      type: 'blocked_email',
      severity: 'critical',
      details: 'Email address is blocked',
    });
    results.score = 0;
    results.status = 'rejected';
  }

  // Check content length
  if (content.content.length < 10) {
    results.flags.push({
      type: 'too_short',
      severity: 'medium',
      details: 'Review is too short',
    });
    results.score -= 10;
    if (results.status === 'approved') {
      results.status = 'flagged';
    }
  }

  // Check for excessive caps
  const capsRatio = (content.content.match(/[A-Z]/g) || []).length / content.content.length;
  if (capsRatio > 0.5 && content.content.length > 20) {
    results.flags.push({
      type: 'excessive_caps',
      severity: 'low',
      details: 'Excessive use of capital letters',
    });
    results.score -= 5;
  }

  // Apply custom rules
  const rules = Array.from(moderationRules.values())
    .filter(r => r.enabled)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of rules) {
    const ruleApplies = evaluateRule(rule, content);
    if (ruleApplies) {
      results.appliedRules.push({
        ruleId: rule.id,
        ruleName: rule.name,
        action: rule.action,
      });

      rule.statistics.applied += 1;

      if (rule.action === 'reject') {
        results.status = 'rejected';
        rule.statistics.rejected += 1;
      } else if (rule.action === 'flag') {
        if (results.status === 'approved') {
          results.status = 'flagged';
        }
        rule.statistics.flagged += 1;
      } else if (rule.action === 'approve') {
        results.status = 'approved';
        rule.statistics.approved += 1;
      }
    }
  }

  // Add to moderation queue if flagged or pending
  if (results.status === 'flagged' || results.status === 'pending') {
    addToModerationQueue({
      contentId: content.id,
      contentType: 'review',
      content: content,
      moderationResults: results,
    });
  }

  return results;
}

/**
 * Check for profanity
 */
function checkProfanity(text) {
  const lowerText = text.toLowerCase();
  const foundWords = [];

  for (const word of blockedWords) {
    if (lowerText.includes(word)) {
      foundWords.push(word);
    }
  }

  return {
    found: foundWords.length > 0,
    words: foundWords,
  };
}

/**
 * Check for spam indicators
 */
function checkSpam(text) {
  const indicators = [];

  // Check for URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  if (urlRegex.test(text)) {
    indicators.push('Contains URLs');
  }

  // Check for email addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  if (emailRegex.test(text)) {
    indicators.push('Contains email addresses');
  }

  // Check for phone numbers
  const phoneRegex = /(\d{3}[-.]?\d{3}[-.]?\d{4})/g;
  if (phoneRegex.test(text)) {
    indicators.push('Contains phone numbers');
  }

  // Check for repetitive characters
  const repetitiveRegex = /(.)\1{4,}/g;
  if (repetitiveRegex.test(text)) {
    indicators.push('Contains repetitive characters');
  }

  // Check for excessive punctuation
  const punctuationCount = (text.match(/[!?]{3,}/g) || []).length;
  if (punctuationCount > 0) {
    indicators.push('Excessive punctuation');
  }

  return {
    isSpam: indicators.length >= 2,
    indicators,
  };
}

/**
 * Evaluate moderation rule
 */
function evaluateRule(rule, content) {
  const { conditions } = rule;

  // Check rating condition
  if (conditions.rating && content.rating !== conditions.rating) {
    return false;
  }

  // Check minimum length
  if (conditions.minLength && content.content.length < conditions.minLength) {
    return false;
  }

  // Check verified purchase
  if (conditions.verified !== undefined && content.verified !== conditions.verified) {
    return false;
  }

  // Check keywords
  if (conditions.keywords && conditions.keywords.length > 0) {
    const lowerContent = content.content.toLowerCase();
    const hasKeyword = conditions.keywords.some(keyword =>
      lowerContent.includes(keyword.toLowerCase())
    );
    if (!hasKeyword) {
      return false;
    }
  }

  return true;
}

/**
 * Add item to moderation queue
 */
function addToModerationQueue(queueData) {
  const queueItem = {
    id: `queue_${queueIdCounter++}`,
    contentId: queueData.contentId,
    contentType: queueData.contentType,
    content: queueData.content,
    moderationResults: queueData.moderationResults,
    status: 'pending', // pending, reviewed
    priority: calculatePriority(queueData.moderationResults),
    addedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    decision: null,
  };

  moderationQueue.set(queueItem.id, queueItem);
  return queueItem;
}

/**
 * Calculate priority based on moderation results
 */
function calculatePriority(results) {
  if (results.score < 50) return 'high';
  if (results.score < 70) return 'medium';
  return 'low';
}

/**
 * Get moderation queue
 */
function getModerationQueue(options = {}) {
  const { status = 'pending', priority = null, limit = 50, offset = 0 } = options;

  let queue = Array.from(moderationQueue.values());

  if (status) {
    queue = queue.filter(item => item.status === status);
  }

  if (priority) {
    queue = queue.filter(item => item.priority === priority);
  }

  // Sort by priority and date
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  queue.sort((a, b) => {
    const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.addedAt) - new Date(b.addedAt);
  });

  return {
    items: queue.slice(offset, offset + limit),
    total: queue.length,
  };
}

/**
 * Review moderation queue item
 */
function reviewQueueItem(queueItemId, decision) {
  const item = moderationQueue.get(queueItemId);
  if (!item) {
    throw new Error('Queue item not found');
  }

  item.status = 'reviewed';
  item.reviewedAt = new Date().toISOString();
  item.reviewedBy = decision.reviewedBy;
  item.decision = decision.action; // approve, reject

  // Add to history
  moderationHistory.set(queueItemId, {
    queueItemId,
    contentId: item.contentId,
    decision: decision.action,
    reviewedBy: decision.reviewedBy,
    notes: decision.notes || '',
    reviewedAt: item.reviewedAt,
  });

  return item;
}

/**
 * Add blocked word
 */
function addBlockedWord(word) {
  blockedWords.add(word.toLowerCase());
  return { success: true, word };
}

/**
 * Remove blocked word
 */
function removeBlockedWord(word) {
  const deleted = blockedWords.delete(word.toLowerCase());
  return { success: deleted, word };
}

/**
 * List blocked words
 */
function listBlockedWords() {
  return Array.from(blockedWords);
}

/**
 * Block email
 */
function blockEmail(email) {
  blockedEmails.add(email.toLowerCase());
  return { success: true, email };
}

/**
 * Unblock email
 */
function unblockEmail(email) {
  const deleted = blockedEmails.delete(email.toLowerCase());
  return { success: deleted, email };
}

/**
 * Get moderation statistics
 */
function getModerationStatistics() {
  const queueItems = Array.from(moderationQueue.values());
  const pending = queueItems.filter(item => item.status === 'pending').length;
  const reviewed = queueItems.filter(item => item.status === 'reviewed').length;
  const highPriority = queueItems.filter(item => item.priority === 'high' && item.status === 'pending').length;

  const historyItems = Array.from(moderationHistory.values());
  const approved = historyItems.filter(item => item.decision === 'approve').length;
  const rejected = historyItems.filter(item => item.decision === 'reject').length;

  const totalRules = moderationRules.size;
  const activeRules = Array.from(moderationRules.values()).filter(r => r.enabled).length;

  return {
    queue: {
      pending,
      reviewed,
      highPriority,
      total: queueItems.length,
    },
    decisions: {
      approved,
      rejected,
      total: historyItems.length,
      approvalRate: historyItems.length > 0 ? Math.round((approved / historyItems.length) * 100) : 0,
    },
    rules: {
      total: totalRules,
      active: activeRules,
    },
    blocklists: {
      blockedWords: blockedWords.size,
      blockedEmails: blockedEmails.size,
    },
  };
}

module.exports = {
  createModerationRule,
  updateModerationRule,
  getModerationRule,
  listModerationRules,
  deleteModerationRule,
  moderateContent,
  getModerationQueue,
  reviewQueueItem,
  addBlockedWord,
  removeBlockedWord,
  listBlockedWords,
  blockEmail,
  unblockEmail,
  getModerationStatistics,
};
