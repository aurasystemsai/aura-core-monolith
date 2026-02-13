/**
 * Satisfaction Tracking Engine
 * Handles CSAT/NPS surveys, sentiment analysis, feedback collection
 */

// In-memory storage (replace with database in production)
const surveys = new Map();
const responses = new Map();
const sentimentAnalysis = new Map();
const feedbackCategories = new Map();
const customerFeedback = new Map();

/**
 * Create survey
 */
async function createSurvey(surveyData) {
  const surveyId = `survey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const survey = {
    id: surveyId,
    type: surveyData.type, // csat, nps, ces, custom
    name: surveyData.name,
    questions: surveyData.questions || [],
    trigger: surveyData.trigger || 'ticket_resolved', // ticket_resolved, ticket_closed, manual
    channels: surveyData.channels || ['email'],
    delay: surveyData.delay || 0, // minutes after trigger
    enabled: surveyData.enabled !== false,
    responseRate: 0,
    averageScore: 0,
    totalResponses: 0,
    createdAt: new Date().toISOString()
  };
  
  surveys.set(surveyId, survey);
  return survey;
}

/**
 * Submit survey response
 */
async function submitSurveyResponse(responseData) {
  const responseId = `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const response = {
    id: responseId,
    surveyId: responseData.surveyId,
    ticketId: responseData.ticketId,
    customerId: responseData.customerId,
    agentId: responseData.agentId,
    answers: responseData.answers || [],
    score: responseData.score,
    rating: calculateRating(responseData.score, responseData.surveyType),
    comment: responseData.comment || '',
    sentiment: null,
    tags: [],
    submittedAt: new Date().toISOString()
  };
  
  // Analyze sentiment of comment
  if (response.comment) {
    response.sentiment = await analyzeSentiment(response.comment);
    response.tags = extractTags(response.comment);
  }
  
  responses.set(responseId, response);
  
  // Update survey stats
  const survey = surveys.get(responseData.surveyId);
  if (survey) {
    survey.totalResponses++;
    const allResponses = Array.from(responses.values())
      .filter(r => r.surveyId === responseData.surveyId);
    survey.averageScore = allResponses.reduce((sum, r) => sum + r.score, 0) / allResponses.length;
    surveys.set(responseData.surveyId, survey);
  }
  
  return response;
}

/**
 * Calculate rating from score
 */
function calculateRating(score, surveyType) {
  if (surveyType === 'csat') {
    // CSAT: 1-5 scale
    if (score >= 4) return 'satisfied';
    if (score >= 3) return 'neutral';
    return 'dissatisfied';
  } else if (surveyType === 'nps') {
    // NPS: 0-10 scale
    if (score >= 9) return 'promoter';
    if (score >= 7) return 'passive';
    return 'detractor';
  } else if (surveyType === 'ces') {
    // CES: 1-7 scale (lower is better)
    if (score <= 2) return 'very_easy';
    if (score <= 4) return 'easy';
    if (score <= 5) return 'neutral';
    return 'difficult';
  }
  
  return 'neutral';
}

/**
 * Analyze sentiment
 */
async function analyzeSentiment(text) {
  // Simple sentiment analysis (in production, use ML model)
  const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'helpful', 'quick', 'friendly', 'professional', 'satisfied'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'slow', 'rude', 'unhelpful', 'disappointed', 'frustrated', 'angry'];
  
  const lowerText = text.toLowerCase();
  let score = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score += 1;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score -= 1;
  });
  
  let sentiment = 'neutral';
  let confidence = 0.5;
  
  if (score > 0) {
    sentiment = 'positive';
    confidence = Math.min(0.9, 0.5 + (score * 0.1));
  } else if (score < 0) {
    sentiment = 'negative';
    confidence = Math.min(0.9, 0.5 + (Math.abs(score) * 0.1));
  }
  
  const analysis = {
    id: `sent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text,
    sentiment,
    score,
    confidence,
    analyzedAt: new Date().toISOString()
  };
  
  sentimentAnalysis.set(analysis.id, analysis);
  return analysis;
}

/**
 * Extract tags from text
 */
function extractTags(text) {
  const tags = [];
  const lowerText = text.toLowerCase();
  
  // Common feedback topics
  const topics = {
    'response_time': ['slow', 'quick', 'fast', 'wait', 'response time'],
    'knowledge': ['knowledgeable', 'helpful', 'knew', 'understand'],
    'attitude': ['rude', 'friendly', 'professional', 'polite'],
    'resolution': ['solved', 'resolved', 'fixed', 'issue', 'problem'],
    'communication': ['clear', 'confusing', 'explain', 'unclear']
  };
  
  Object.entries(topics).forEach(([tag, keywords]) => {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      tags.push(tag);
    }
  });
  
  return tags;
}

/**
 * Get survey responses
 */
async function getSurveyResponses(filters = {}) {
  let responseList = Array.from(responses.values());
  
  if (filters.surveyId) {
    responseList = responseList.filter(r => r.surveyId === filters.surveyId);
  }
  if (filters.agentId) {
    responseList = responseList.filter(r => r.agentId === filters.agentId);
  }
  if (filters.rating) {
    responseList = responseList.filter(r => r.rating === filters.rating);
  }
  if (filters.sentiment) {
    responseList = responseList.filter(r => r.sentiment && r.sentiment.sentiment === filters.sentiment);
  }
  if (filters.startDate) {
    responseList = responseList.filter(r => new Date(r.submittedAt) >= new Date(filters.startDate));
  }
  if (filters.endDate) {
    responseList = responseList.filter(r => new Date(r.submittedAt) <= new Date(filters.endDate));
  }
  
  return responseList.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

/**
 * Calculate CSAT score
 */
async function calculateCSAT(filters = {}) {
  const csatResponses = await getSurveyResponses({ ...filters, surveyType: 'csat' });
  
  if (csatResponses.length === 0) {
    return {
      totalResponses: 0,
      averageScore: 0,
      satisfaction: 0
    };
  }
  
  const satisfied = csatResponses.filter(r => r.score >= 4).length;
  const averageScore = csatResponses.reduce((sum, r) => sum + r.score, 0) / csatResponses.length;
  
  return {
    totalResponses: csatResponses.length,
    averageScore: Math.round(averageScore * 10) / 10,
    satisfactionRate: (satisfied / csatResponses.length) * 100,
    distribution: {
      very_satisfied: csatResponses.filter(r => r.score === 5).length,
      satisfied: csatResponses.filter(r => r.score === 4).length,
      neutral: csatResponses.filter(r => r.score === 3).length,
      dissatisfied: csatResponses.filter(r => r.score === 2).length,
      very_dissatisfied: csatResponses.filter(r => r.score === 1).length
    }
  };
}

/**
 * Calculate NPS score
 */
async function calculateNPS(filters = {}) {
  const npsResponses = await getSurveyResponses({ ...filters, surveyType: 'nps' });
  
  if (npsResponses.length === 0) {
    return {
      totalResponses: 0,
      npsScore: 0
    };
  }
  
  const promoters = npsResponses.filter(r => r.score >= 9).length;
  const detractors = npsResponses.filter(r => r.score <= 6).length;
  const passives = npsResponses.filter(r => r.score >= 7 && r.score <= 8).length;
  
  const npsScore = ((promoters - detractors) / npsResponses.length) * 100;
  
  return {
    totalResponses: npsResponses.length,
    npsScore: Math.round(npsScore),
    promoters,
    passives,
    detractors,
    promoterPercentage: (promoters / npsResponses.length) * 100,
    detractorPercentage: (detractors / npsResponses.length) * 100
  };
}

/**
 * Get sentiment breakdown
 */
async function getSentimentBreakdown(filters = {}) {
  const responseList = await getSurveyResponses(filters);
  const withSentiment = responseList.filter(r => r.sentiment);
  
  if (withSentiment.length === 0) {
    return {
      totalAnalyzed: 0,
      breakdown: {}
    };
  }
  
  const breakdown = {
    positive: withSentiment.filter(r => r.sentiment.sentiment === 'positive').length,
    neutral: withSentiment.filter(r => r.sentiment.sentiment === 'neutral').length,
    negative: withSentiment.filter(r => r.sentiment.sentiment === 'negative').length
  };
  
  return {
    totalAnalyzed: withSentiment.length,
    breakdown,
    percentages: {
      positive: (breakdown.positive / withSentiment.length) * 100,
      neutral: (breakdown.neutral / withSentiment.length) * 100,
      negative: (breakdown.negative / withSentiment.length) * 100
    }
  };
}

/**
 * Get top feedback tags
 */
async function getTopFeedbackTags(filters = {}) {
  const responseList = await getSurveyResponses(filters);
  
  const tagCounts = {};
  responseList.forEach(r => {
    r.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  return Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({
      tag,
      count,
      percentage: (count / responseList.length) * 100
    }));
}

/**
 * Get agent satisfaction scores
 */
async function getAgentSatisfactionScores(agentId, period = 'month') {
  const now = new Date();
  let startDate = new Date();
  
  if (period === 'week') startDate.setDate(now.getDate() - 7);
  else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
  else if (period === 'quarter') startDate.setMonth(now.getMonth() - 3);
  
  const agentResponses = await getSurveyResponses({
    agentId,
    startDate: startDate.toISOString()
  });
  
  const csat = await calculateCSAT({ agentId, startDate: startDate.toISOString() });
  const nps = await calculateNPS({ agentId, startDate: startDate.toISOString() });
  const sentiment = await getSentimentBreakdown({ agentId, startDate: startDate.toISOString() });
  
  return {
    agentId,
    period,
    totalResponses: agentResponses.length,
    csat,
    nps,
    sentiment
  };
}

/**
 * Get satisfaction statistics
 */
async function getSatisfactionStatistics() {
  const responseList = Array.from(responses.values());
  const surveyList = Array.from(surveys.values());
  
  return {
    totalSurveys: surveyList.length,
    totalResponses: responseList.length,
    activeSurveys: surveyList.filter(s => s.enabled).length,
    totalSentimentAnalysis: sentimentAnalysis.size
  };
}

module.exports = {
  createSurvey,
  submitSurveyResponse,
  analyzeSentiment,
  getSurveyResponses,
  calculateCSAT,
  calculateNPS,
  getSentimentBreakdown,
  getTopFeedbackTags,
  getAgentSatisfactionScores,
  getSatisfactionStatistics
};
