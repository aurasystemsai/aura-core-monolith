/**
 * AI Insights Engine
 * Handles predictive analytics, agent assist, customer intent, trend detection
 */

// In-memory storage (replace with database in production)
const predictions = new Map();
const intentAnalysis = new Map();
const trends = new Map();
const recommendations = new Map();
const agentAssists = new Map();
const insights = new Map();

/**
 * Analyze customer intent
 */
async function analyzeCustomerIntent(intentData) {
  const intentId = `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const text = intentData.message || intentData.query;
  
  // Simple intent classification (in production, use ML model)
  const intents = {
    'question': ['how', 'what', 'when', 'where', 'why', 'can i', 'is it', '?'],
    'complaint': ['issue', 'problem', 'not working', 'broken', 'error', 'failed', 'complaint'],
    'request': ['need', 'want', 'would like', 'please', 'can you', 'could you'],
    'feedback': ['great', 'terrible', 'love', 'hate', 'suggestion', 'feedback'],
    'cancel': ['cancel', 'refund', 'return', 'unsubscribe', 'stop'],
    'billing': ['charge', 'payment', 'bill', 'invoice', 'subscription', 'price']
  };
  
  const lowerText = text.toLowerCase();
  let detectedIntent = 'general';
  let confidence = 0.3;
  
  for (const [intent, keywords] of Object.entries(intents)) {
    const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
    if (matches > 0) {
      const intentConfidence = Math.min(0.95, 0.5 + (matches * 0.15));
      if (intentConfidence > confidence) {
        detectedIntent = intent;
        confidence = intentConfidence;
      }
    }
  }
  
  // Extract entities
  const entities = extractEntities(text);
  
  // Determine urgency
  const urgencyKeywords = ['urgent', 'asap', 'immediately', 'emergency', 'critical'];
  const isUrgent = urgencyKeywords.some(keyword => lowerText.includes(keyword));
  const urgency = isUrgent ? 'high' : 'normal';
  
  const analysis = {
    id: intentId,
    text,
    intent: detectedIntent,
    confidence,
    entities,
    urgency,
    suggestedActions: generateIntentActions(detectedIntent),
    analyzedAt: new Date().toISOString()
  };
  
  intentAnalysis.set(intentId, analysis);
  return analysis;
}

/**
 * Extract entities from text
 */
function extractEntities(text) {
  const entities = {
    email: [],
    phone: [],
    orderNumber: [],
    productName: []
  };
  
  // Email regex
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  const emails = text.match(emailRegex);
  if (emails) entities.email = emails;
  
  // Phone regex (simple)
  const phoneRegex = /\d{3}[-.]?\d{3}[-.]?\d{4}/g;
  const phones = text.match(phoneRegex);
  if (phones) entities.phone = phones;
  
  // Order number regex
  const orderRegex = /#?\d{6,10}/g;
  const orders = text.match(orderRegex);
  if (orders) entities.orderNumber = orders;
  
  return entities;
}

/**
 * Generate suggested actions based on intent
 */
function generateIntentActions(intent) {
  const actions = {
    'question': ['search_knowledge_base', 'suggest_articles'],
    'complaint': ['escalate', 'offer_compensation', 'create_ticket'],
    'request': ['check_eligibility', 'process_request', 'send_confirmation'],
    'feedback': ['thank_customer', 'log_feedback', 'share_with_team'],
    'cancel': ['verify_account', 'process_cancellation', 'offer_retention'],
    'billing': ['check_invoice', 'explain_charges', 'adjust_billing']
  };
  
  return actions[intent] || ['create_ticket', 'route_to_agent'];
}

/**
 * Get agent assist suggestions
 */
async function getAgentAssist(assistData) {
  const assistId = `assist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const context = assistData.context || '';
  const intent = await analyzeCustomerIntent({ message: context });
  
  // Generate response suggestions (in production, use AI model)
  const suggestions = [
    {
      type: 'response',
      content: generateResponseSuggestion(intent.intent),
      confidence: 0.8
    },
    {
      type: 'article',
      title: 'Related knowledge base article',
      link: '/kb/article-123',
      confidence: 0.7
    },
    {
      type: 'macro',
      name: 'Standard response for ' + intent.intent,
      macroId: 'macro_123',
      confidence: 0.75
    }
  ];
  
  const assist = {
    id: assistId,
    ticketId: assistData.ticketId,
    agentId: assistData.agentId,
    intent,
    suggestions,
    generatedAt: new Date().toISOString()
  };
  
  agentAssists.set(assistId, assist);
  return assist;
}

/**
 * Generate response suggestion
 */
function generateResponseSuggestion(intent) {
  const responses = {
    'question': 'Thank you for reaching out. I\'d be happy to help answer your question about...',
    'complaint': 'I sincerely apologize for the inconvenience. Let me look into this issue for you right away...',
    'request': 'I understand you need assistance with... I\'ll be happy to help you with that.',
    'feedback': 'Thank you for taking the time to share your feedback. We really appreciate it...',
    'cancel': 'I\'m sorry to hear you want to cancel. Before we proceed, may I ask if there\'s anything we can do to...',
    'billing': 'Thank you for contacting us about your billing. Let me review your account...'
  };
  
  return responses[intent] || 'Thank you for contacting us. How can I assist you today?';
}

/**
 * Predict ticket resolution time
 */
async function predictResolutionTime(ticketData) {
  const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Simple prediction based on priority and complexity (in production, use ML model)
  const baseTime = {
    'urgent': 120,
    'high': 240,
    'medium': 480,
    'low': 960
  };
  
  let estimatedMinutes = baseTime[ticketData.priority] || 480;
  
  // Adjust based on category complexity
  const complexityMultipliers = {
    'billing': 1.2,
    'technical': 1.5,
    'account': 1.1,
    'general': 1.0
  };
  
  const multiplier = complexityMultipliers[ticketData.category] || 1.0;
  estimatedMinutes *= multiplier;
  
  const prediction = {
    id: predictionId,
    ticketId: ticketData.ticketId,
    estimatedMinutes: Math.round(estimatedMinutes),
    confidence: 0.75,
    factors: {
      priority: ticketData.priority,
      category: ticketData.category,
      complexity: multiplier
    },
    predictedAt: new Date().toISOString()
  };
  
  predictions.set(predictionId, prediction);
  return prediction;
}

/**
 * Detect trends
 */
async function detectTrends(trendData) {
  const trendId = `trend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const period = trendData.period || 'week';
  const metric = trendData.metric || 'ticket_volume';
  
  // Simulate trend detection (in production, analyze historical data)
  const trend = {
    id: trendId,
    metric,
    period,
    direction: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)],
    change: Math.floor(Math.random() * 30) - 10, // -10% to +20%
    patterns: [
      {
        type: 'day_of_week',
        insight: 'Higher volume on Mondays and Fridays'
      },
      {
        type: 'time_of_day',
        insight: 'Peak hours between 10 AM - 2 PM'
      }
    ],
    anomalies: [],
    detectedAt: new Date().toISOString()
  };
  
  trends.set(trendId, trend);
  return trend;
}

/**
 * Generate AI recommendations
 */
async function generateRecommendations(recommendationData) {
  const recommendationId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const context = recommendationData.context || 'general';
  
  // Generate context-aware recommendations
  const recommendations = [];
  
  if (context === 'performance') {
    recommendations.push(
      {
        type: 'training',
        title: 'Schedule QA coaching session',
        description: 'Agent QA scores below 80% threshold',
        priority: 'high',
        impact: 'medium'
      },
      {
        type: 'workflow',
        title: 'Enable auto-assignment for simple tickets',
        description: 'Reduce manual routing overhead',
        priority: 'medium',
        impact: 'high'
      }
    );
  } else if (context === 'customer_satisfaction') {
    recommendations.push(
      {
        type: 'response_improvement',
        title: 'Update response templates',
        description: 'CSAT scores indicate customer dissatisfaction with response quality',
        priority: 'high',
        impact: 'high'
      }
    );
  } else {
    recommendations.push(
      {
        type: 'knowledge_base',
        title: 'Create article for common question',
        description: 'Detected repeated customer queries about billing',
        priority: 'medium',
        impact: 'medium'
      }
    );
  }
  
  const recommendation = {
    id: recommendationId,
    context,
    recommendations,
    generatedAt: new Date().toISOString()
  };
  
  recommendations.set(recommendationId, recommendation);
  return recommendation;
}

/**
 * Predict customer churn risk
 */
async function predictChurnRisk(customerData) {
  const predictionId = `churn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Simple churn risk calculation (in production, use ML model)
  let riskScore = 0;
  
  // Recent support interactions
  if (customerData.recentTickets > 3) riskScore += 20;
  
  // Negative sentiment
  if (customerData.sentimentScore < -0.3) riskScore += 30;
  
  // Low satisfaction scores
  if (customerData.csatScore < 3) riskScore += 25;
  
  // Multiple cancel queries
  if (customerData.cancelQueries > 0) riskScore += 25;
  
  const risk = riskScore > 60 ? 'high' : riskScore > 30 ? 'medium' : 'low';
  
  const prediction = {
    id: predictionId,
    customerId: customerData.customerId,
    riskScore,
    risk,
    factors: {
      recentTickets: customerData.recentTickets || 0,
      sentimentScore: customerData.sentimentScore || 0,
      csatScore: customerData.csatScore || 5,
      cancelQueries: customerData.cancelQueries || 0
    },
    suggestedActions: risk === 'high' ? 
      ['offer_retention_incentive', 'personal_outreach', 'escalate_to_csm'] :
      risk === 'medium' ?
      ['send_satisfaction_survey', 'follow_up_email'] :
      ['monitor'],
    predictedAt: new Date().toISOString()
  };
  
  predictions.set(predictionId, prediction);
  return prediction;
}

/**
 * Generate insight
 */
async function generateInsight(insightData) {
  const insightId = `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const insight = {
    id: insightId,
    type: insightData.type || 'performance',
    title: insightData.title,
    description: insightData.description,
    metric: insightData.metric,
    value: insightData.value,
    change: insightData.change,
    trend: insightData.trend || 'stable',
    severity: insightData.severity || 'info', // info, warning, critical
    actionable: insightData.actionable !== false,
    recommendations: insightData.recommendations || [],
    generatedAt: new Date().toISOString()
  };
  
  insights.set(insightId, insight);
  return insight;
}

/**
 * Get AI insights
 */
async function getAIInsights(filters = {}) {
  let insightList = Array.from(insights.values());
  
  if (filters.type) {
    insightList = insightList.filter(i => i.type === filters.type);
  }
  if (filters.severity) {
    insightList = insightList.filter(i => i.severity === filters.severity);
  }
  if (filters.actionable !== undefined) {
    insightList = insightList.filter(i => i.actionable === filters.actionable);
  }
  
  return insightList.sort((a, b) => 
    new Date(b.generatedAt) - new Date(a.generatedAt)
  );
}

/**
 * Get AI insights statistics
 */
async function getAIInsightsStatistics() {
  return {
    totalPredictions: predictions.size,
    totalIntentAnalysis: intentAnalysis.size,
    totalTrends: trends.size,
    totalRecommendations: recommendations.size,
    totalAgentAssists: agentAssists.size,
    totalInsights: insights.size
  };
}

module.exports = {
  analyzeCustomerIntent,
  getAgentAssist,
  predictResolutionTime,
  detectTrends,
  generateRecommendations,
  predictChurnRisk,
  generateInsight,
  getAIInsights,
  getAIInsightsStatistics
};
