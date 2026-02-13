/**
 * Quality Assurance Engine
 * Handles QA scoring, coaching feedback, quality metrics, call/chat reviews
 */

// In-memory storage (replace with database in production)
const qaScores = new Map();
const qaTemplates = new Map();
const coachingSessions = new Map();
const qaReviews = new Map();
const qualityMetrics = new Map();
const calibrationSessions = new Map();

/**
 * Create QA template
 */
async function createQATemplate(templateData) {
  const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const template = {
    id: templateId,
    name: templateData.name,
    description: templateData.description,
    type: templateData.type || 'chat', // chat, call, email
    categories: templateData.categories || [],
    totalPoints: 0,
    enabled: templateData.enabled !== false,
    createdAt: new Date().toISOString()
  };
  
  // Calculate total points
  template.totalPoints = template.categories.reduce((sum, cat) => {
    return sum + cat.criteria.reduce((s, c) => s + c.maxPoints, 0);
  }, 0);
  
  qaTemplates.set(templateId, template);
  return template;
}

/**
 * Create QA review
 */
async function createQAReview(reviewData) {
  const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const review = {
    id: reviewId,
    templateId: reviewData.templateId,
    ticketId: reviewData.ticketId,
    agentId: reviewData.agentId,
    reviewerId: reviewData.reviewerId,
    scores: reviewData.scores || [],
    totalScore: 0,
    percentage: 0,
    rating: 'pending',
    strengths: reviewData.strengths || [],
    improvements: reviewData.improvements || [],
    comments: reviewData.comments || '',
    isCriticalFail: false,
    status: 'draft',
    createdAt: new Date().toISOString(),
    completedAt: null
  };
  
  // Calculate total score
  const template = qaTemplates.get(reviewData.templateId);
  if (template) {
    review.totalScore = review.scores.reduce((sum, s) => sum + s.points, 0);
    review.percentage = (review.totalScore / template.totalPoints) * 100;
    
    // Determine rating
    if (review.percentage >= 95) review.rating = 'excellent';
    else if (review.percentage >= 85) review.rating = 'good';
    else if (review.percentage >= 75) review.rating = 'satisfactory';
    else if (review.percentage >= 60) review.rating = 'needs_improvement';
    else review.rating = 'poor';
    
    // Check for critical fails
    review.isCriticalFail = review.scores.some(s => s.isCritical && s.points === 0);
    if (review.isCriticalFail) review.rating = 'critical_fail';
  }
  
  qaReviews.set(reviewId, review);
  return review;
}

/**
 * Complete QA review
 */
async function completeQAReview(reviewId) {
  const review = qaReviews.get(reviewId);
  if (!review) throw new Error('QA review not found');
  
  review.status = 'completed';
  review.completedAt = new Date().toISOString();
  qaReviews.set(reviewId, review);
  
  // Create QA score record
  const score = {
    id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    reviewId,
    agentId: review.agentId,
    templateId: review.templateId,
    score: review.totalScore,
    percentage: review.percentage,
    rating: review.rating,
    isCriticalFail: review.isCriticalFail,
    createdAt: review.completedAt
  };
  
  qaScores.set(score.id, score);
  
  // Check if coaching needed
  if (review.rating === 'needs_improvement' || review.rating === 'poor' || review.isCriticalFail) {
    await createCoachingRecommendation(review);
  }
  
  return review;
}

/**
 * Create coaching recommendation
 */
async function createCoachingRecommendation(review) {
  const recommendation = {
    id: `coaching_rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    agentId: review.agentId,
    reviewId: review.id,
    reason: review.isCriticalFail ? 'Critical failure detected' : 'Low QA score',
    focusAreas: review.improvements,
    priority: review.isCriticalFail ? 'urgent' : 'high',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  return recommendation;
}

/**
 * Create coaching session
 */
async function createCoachingSession(sessionData) {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const session = {
    id: sessionId,
    agentId: sessionData.agentId,
    coachId: sessionData.coachId,
    type: sessionData.type || 'one_on_one', // one_on_one, group, shadowing, online
    topic: sessionData.topic,
    focusAreas: sessionData.focusAreas || [],
    goals: sessionData.goals || [],
    duration: sessionData.duration || 60, // minutes
    scheduledAt: sessionData.scheduledAt,
    status: 'scheduled',
    notes: '',
    actionItems: [],
    followUpDate: null,
    createdAt: new Date().toISOString(),
    completedAt: null
  };
  
  coachingSessions.set(sessionId, session);
  return session;
}

/**
 * Complete coaching session
 */
async function completeCoachingSession(sessionId, completionData) {
  const session = coachingSessions.get(sessionId);
  if (!session) throw new Error('Coaching session not found');
  
  session.status = 'completed';
  session.notes = completionData.notes || '';
  session.actionItems = completionData.actionItems || [];
  session.followUpDate = completionData.followUpDate;
  session.completedAt = new Date().toISOString();
  
  coachingSessions.set(sessionId, session);
  return session;
}

/**
 * Get QA reviews
 */
async function getQAReviews(filters = {}) {
  let reviews = Array.from(qaReviews.values());
  
  if (filters.agentId) {
    reviews = reviews.filter(r => r.agentId === filters.agentId);
  }
  if (filters.reviewerId) {
    reviews = reviews.filter(r => r.reviewerId === filters.reviewerId);
  }
  if (filters.status) {
    reviews = reviews.filter(r => r.status === filters.status);
  }
  if (filters.rating) {
    reviews = reviews.filter(r => r.rating === filters.rating);
  }
  if (filters.startDate) {
    reviews = reviews.filter(r => new Date(r.createdAt) >= new Date(filters.startDate));
  }
  if (filters.endDate) {
    reviews = reviews.filter(r => new Date(r.createdAt) <= new Date(filters.endDate));
  }
  
  return reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Get agent QA summary
 */
async function getAgentQASummary(agentId, period = 'month') {
  const reviews = Array.from(qaReviews.values())
    .filter(r => r.agentId === agentId && r.status === 'completed');
  
  if (reviews.length === 0) {
    return {
      agentId,
      totalReviews: 0,
      averageScore: 0,
      trend: 'stable'
    };
  }
  
  const averageScore = reviews.reduce((sum, r) => sum + r.percentage, 0) / reviews.length;
  
  // Rating distribution
  const ratingDistribution = {};
  reviews.forEach(r => {
    ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
  });
  
  // Trend analysis (compare first half vs second half)
  const midPoint = Math.floor(reviews.length / 2);
  const firstHalf = reviews.slice(0, midPoint);
  const secondHalf = reviews.slice(midPoint);
  
  const firstAvg = firstHalf.reduce((sum, r) => sum + r.percentage, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, r) => sum + r.percentage, 0) / secondHalf.length;
  
  let trend = 'stable';
  if (secondAvg > firstAvg + 5) trend = 'improving';
  else if (secondAvg < firstAvg - 5) trend = 'declining';
  
  // Critical fails
  const criticalFails = reviews.filter(r => r.isCriticalFail).length;
  
  // Common improvement areas
  const improvements = {};
  reviews.forEach(r => {
    r.improvements.forEach(area => {
      improvements[area] = (improvements[area] || 0) + 1;
    });
  });
  
  const topImprovements = Object.entries(improvements)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([area, count]) => ({ area, count }));
  
  return {
    agentId,
    period,
    totalReviews: reviews.length,
    averageScore: Math.round(averageScore * 10) / 10,
    ratingDistribution,
    trend,
    criticalFails,
    topImprovements,
    recentReviews: reviews.slice(0, 5)
  };
}

/**
 * Create calibration session
 */
async function createCalibrationSession(calibrationData) {
  const sessionId = `cal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const session = {
    id: sessionId,
    name: calibrationData.name,
    templateId: calibrationData.templateId,
    ticketId: calibrationData.ticketId,
    participants: calibrationData.participants || [],
    scores: [],
    consensus: null,
    variance: 0,
    status: 'in_progress',
    scheduledAt: calibrationData.scheduledAt,
    createdAt: new Date().toISOString(),
    completedAt: null
  };
  
  calibrationSessions.set(sessionId, session);
  return session;
}

/**
 * Submit calibration score
 */
async function submitCalibrationScore(sessionId, scoreData) {
  const session = calibrationSessions.get(sessionId);
  if (!session) throw new Error('Calibration session not found');
  
  session.scores.push({
    participantId: scoreData.participantId,
    score: scoreData.score,
    rating: scoreData.rating,
    submittedAt: new Date().toISOString()
  });
  
  // Calculate variance
  const scores = session.scores.map(s => s.score);
  const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const variance = Math.sqrt(
    scores.reduce((sum, s) => sum + Math.pow(s - average, 2), 0) / scores.length
  );
  
  session.variance = Math.round(variance * 100) / 100;
  
  calibrationSessions.set(sessionId, session);
  return session;
}

/**
 * Get quality metrics
 */
async function getQualityMetrics(filters = {}) {
  const reviews = await getQAReviews({ status: 'completed', ...filters });
  
  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      averageScore: 0,
      complianceRate: 0,
      criticalFailRate: 0
    };
  }
  
  const averageScore = reviews.reduce((sum, r) => sum + r.percentage, 0) / reviews.length;
  const compliant = reviews.filter(r => r.percentage >= 80).length;
  const criticalFails = reviews.filter(r => r.isCriticalFail).length;
  
  // Rating breakdown
  const ratingBreakdown = {};
  reviews.forEach(r => {
    ratingBreakdown[r.rating] = (ratingBreakdown[r.rating] || 0) + 1;
  });
  
  // Top reviewers
  const reviewerStats = {};
  reviews.forEach(r => {
    if (!reviewerStats[r.reviewerId]) {
      reviewerStats[r.reviewerId] = { count: 0, totalScore: 0 };
    }
    reviewerStats[r.reviewerId].count++;
    reviewerStats[r.reviewerId].totalScore += r.percentage;
  });
  
  const topReviewers = Object.entries(reviewerStats)
    .map(([id, stats]) => ({
      reviewerId: id,
      reviewCount: stats.count,
      averageScore: stats.totalScore / stats.count
    }))
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 10);
  
  return {
    totalReviews: reviews.length,
    averageScore: Math.round(averageScore * 10) / 10,
    complianceRate: (compliant / reviews.length) * 100,
    criticalFailRate: (criticalFails / reviews.length) * 100,
    ratingBreakdown,
    topReviewers
  };
}

/**
 * Get QA statistics
 */
async function getQAStatistics() {
  const reviews = Array.from(qaReviews.values());
  const sessions = Array.from(coachingSessions.values());
  const calibrations = Array.from(calibrationSessions.values());
  
  return {
    totalReviews: reviews.length,
    completedReviews: reviews.filter(r => r.status === 'completed').length,
    pendingReviews: reviews.filter(r => r.status === 'draft').length,
    totalTemplates: qaTemplates.size,
    totalCoachingSessions: sessions.length,
    scheduledSessions: sessions.filter(s => s.status === 'scheduled').length,
    completedSessions: sessions.filter(s => s.status === 'completed').length,
    totalCalibrations: calibrations.length,
    activeCalibrations: calibrations.filter(c => c.status === 'in_progress').length
  };
}

module.exports = {
  createQATemplate,
  createQAReview,
  completeQAReview,
  createCoachingRecommendation,
  createCoachingSession,
  completeCoachingSession,
  getQAReviews,
  getAgentQASummary,
  createCalibrationSession,
  submitCalibrationScore,
  getQualityMetrics,
  getQAStatistics
};
