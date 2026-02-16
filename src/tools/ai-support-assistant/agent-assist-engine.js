/**
 * AI SUPPORT ASSISTANT - AGENT ASSIST ENGINE
 * Provides real-time assistance to human agents with AI suggestions and tools
 */

const crypto = require('crypto');

// In-memory storage
const agentSessions = new Map();
const suggestions = new Map();
const snippets = new Map();
const macros = new Map();

/**
 * Start agent session
 */
function startAgentSession(agentId) {
  const session = {
    id: `session_${crypto.randomBytes(8).toString('hex')}`,
    agentId,
    startedAt: new Date().toISOString(),
    endedAt: null,
    conversationsHandled: 0,
    ticketsHandled: 0,
    suggestionsUsed: 0,
    avgHandleTime: 0,
  };

  agentSessions.set(session.id, session);
  return session;
}

/**
 * End agent session
 */
function endAgentSession(sessionId) {
  const session = agentSessions.get(sessionId);
  if (!session) return null;

  session.endedAt = new Date().toISOString();
  return session;
}

/**
 * Get real-time suggestions for agent
 */
function getSuggestionsForAgent(conversationId, { context, message } = {}) {
  const suggestions = [];

  // Knowledge base suggestions
  if (message) {
    suggestions.push({
      type: 'knowledge_article',
      title: 'Related Help Article',
      content: 'How to process returns and refunds',
      confidence: 0.92,
      action: 'insert',
    });
  }

  // Canned response suggestions
  suggestions.push({
    type: 'canned_response',
    title: 'Greeting',
    content: "Hello! I'm here to help you today. What can I assist you with?",
    confidence: 0.95,
    action: 'use',
  });

  // Similar conversation suggestions
  if (context?.similarConversations) {
    suggestions.push({
      type: 'similar_conversation',
      title: 'Similar Past Resolution',
      content: 'This issue was resolved by processing a refund',
      confidence: 0.88,
      action: 'reference',
    });
  }

  // Next best action
  suggestions.push({
    type: 'next_action',
    title: 'Recommended Next Step',
    content: 'Ask for order number to verify purchase',
    confidence: 0.85,
    action: 'suggest',
  });

  return suggestions;
}

/**
 * Get AI-powered response draft
 */
async function getDraftResponse({ conversationId, messages, context }) {
  // Simulate AI drafting a response
  const lastMessage = messages[messages.length - 1];
  const userQuery = lastMessage.content.toLowerCase();

  let draft = '';

  if (userQuery.includes('order') || userQuery.includes('shipping')) {
    draft = "I'd be happy to help you track your order. Could you please provide your order number? You can find it in your confirmation email or on your account page.";
  } else if (userQuery.includes('return')) {
    draft = "I understand you'd like to return an item. Our return policy allows returns within 30 days of purchase. To get started, please provide me with:\n1. Your order number\n2. The item you'd like to return\n3. Reason for return (optional)";
  } else {
    draft = "Thank you for reaching out. I'm here to help with your question. Let me look into this for you right away.";
  }

  return {
    draft,
    confidence: 0.87,
    tone: 'professional',
    alternatives: [
      { text: draft.replace('happy', 'glad'), tone: 'friendly' },
      { text: draft.replace('help you', 'assist you with'), tone: 'formal' },
    ],
  };
}

/**
 * Create snippet (quick text)
 */
function createSnippet({ name, shortcut, content, category }) {
  const snippet = {
    id: `snippet_${crypto.randomBytes(6).toString('hex')}`,
    name,
    shortcut, // e.g., "/greeting"
    content,
    category,
    usageCount: 0,
    createdAt: new Date().toISOString(),
  };

  snippets.set(snippet.id, snippet);
  return snippet;
}

/**
 * Get snippet by shortcut
 */
function getSnippetByShortcut(shortcut) {
  return Array.from(snippets.values())
    .find(s => s.shortcut === shortcut);
}

/**
 * List snippets
 */
function listSnippets({ category } = {}) {
  let filtered = Array.from(snippets.values());

  if (category) {
    filtered = filtered.filter(s => s.category === category);
  }

  return filtered.sort((a, b) => b.usageCount - a.usageCount);
}

/**
 * Use snippet
 */
function useSnippet(snippetId) {
  const snippet = snippets.get(snippetId);
  if (!snippet) return null;

  snippet.usageCount++;
  return snippet;
}

/**
 * Create macro (multi-step automation)
 */
function createMacro({ name, description, steps }) {
  const macro = {
    id: `macro_${crypto.randomBytes(6).toString('hex')}`,
    name,
    description,
    steps, // array of actions like snippet, tag, status_change, etc.
    usageCount: 0,
    createdAt: new Date().toISOString(),
  };

  macros.set(macro.id, macro);
  return macro;
}

/**
 * Execute macro
 */
async function executeMacro(macroId, context) {
  const macro = macros.get(macroId);
  if (!macro) return null;

  const results = [];

  for (const step of macro.steps) {
    const result = await executeStep(step, context);
    results.push(result);
  }

  macro.usageCount++;

  return {
    macroId: macro.id,
    name: macro.name,
    results,
    executedAt: new Date().toISOString(),
  };
}

/**
 * Execute macro step
 */
async function executeStep(step, context) {
  switch (step.type) {
    case 'send_message':
      return { type: 'send_message', content: step.content };
    case 'add_tag':
      return { type: 'add_tag', tag: step.tag };
    case 'change_status':
      return { type: 'change_status', status: step.status };
    case 'assign':
      return { type: 'assign', assignedTo: step.assignedTo };
    case 'set_priority':
      return { type: 'set_priority', priority: step.priority };
    default:
      return { type: 'unknown', error: 'Unknown step type' };
  }
}

/**
 * Get similar conversations for reference
 */
function getSimilarConversations(currentConversation, { limit = 5 } = {}) {
  // Simulate finding similar conversations
  return [
    {
      id: 'conv_123',
      subject: 'Order tracking issue',
      resolution: 'Provided tracking link and confirmed delivery',
      resolutionTime: 12, // minutes
      satisfaction: 5,
    },
    {
      id: 'conv_456',
      subject: 'Shipping delay concern',
      resolution: 'Explained carrier delay and offered discount',
      resolutionTime: 18,
      satisfaction: 4,
    },
  ].slice(0, limit);
}

/**
 * Get customer context for agent
 */
function getCustomerContext(userId) {
  return {
    userId,
    totalPurchases: Math.floor(Math.random() * 20) + 1,
    totalSpent: (Math.random() * 5000 + 500).toFixed(2),
    averageOrderValue: (Math.random() * 200 + 50).toFixed(2),
    lastPurchase: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    pastTickets: Math.floor(Math.random() * 5),
    satisfactionHistory: [5, 4, 5, 5, 4],
    vipStatus: Math.random() > 0.7,
    tags: ['frequent_buyer', 'loyal_customer'],
  };
}

/**
 * Sentiment analysis and coaching
 */
function analyzeAgentResponse(response) {
  const analysis = {
    sentiment: 'positive',
    tone: 'professional',
    readabilityScore: 85,
    suggestions: [],
  };

  // Check for negative words
  const negativeWords = ['unfortunately', 'can\'t', 'unable', 'problem'];
  if (negativeWords.some(word => response.toLowerCase().includes(word))) {
    analysis.suggestions.push({
      type: 'tone',
      message: 'Consider using more positive phrasing',
      before: 'Unfortunately, we can\'t help with that',
      after: 'Let me explore alternative solutions for you',
    });
  }

  // Check for jargon
  const jargon = ['utilize', 'implement', 'facilitate'];
  if (jargon.some(word => response.toLowerCase().includes(word))) {
    analysis.suggestions.push({
      type: 'clarity',
      message: 'Consider using simpler language',
    });
  }

  // Check for length
  if (response.length > 500) {
    analysis.suggestions.push({
      type: 'brevity',
      message: 'Response may be too long - consider breaking into steps',
    });
  }

  return analysis;
}

/**
 * Get recommended tags for conversation
 */
function getRecommendedTags(conversation) {
  const tags = [];

  if (conversation.subject?.toLowerCase().includes('order')) tags.push('order');
  if (conversation.subject?.toLowerCase().includes('return')) tags.push('return');
  if (conversation.sentiment === 'negative') tags.push('urgent');
  if (conversation.priority === 'high') tags.push('priority');

  return tags;
}

/**
 * Translation assistance
 */
async function translateMessage(message, { targetLanguage = 'en' }) {
  // Simulate translation
  return {
    original: message,
    translated: message, // In production, use real translation API
    detectedLanguage: 'en',
    targetLanguage,
    confidence: 0.95,
  };
}

/**
 * Get agent performance insights
 */
function getAgentInsights(agentId, sessionId) {
  return {
    agentId,
    sessionId,
    currentWorkload: Math.floor(Math.random() * 10) + 1,
    avgResponseTime: (Math.random() * 5 + 1).toFixed(1) + ' minutes',
    resolutionRate: (Math.random() * 20 + 75).toFixed(1) + '%',
    suggestionsAccepted: Math.floor(Math.random() * 20) + 5,
    customerSatisfaction: (Math.random() * 1 + 4).toFixed(1),
    recommendations: [
      'Your response time is below average - consider using more snippets',
      'Great job maintaining high satisfaction scores!',
      'You have 3 tickets approaching SLA - prioritize these first',
    ].slice(0, Math.floor(Math.random() * 3) + 1),
  };
}

/**
 * Collaboration - transfer conversation with context
 */
function prepareTransfer(conversationId, { targetAgent, reason, summary }) {
  return {
    conversationId,
    targetAgent,
    reason,
    summary,
    context: {
      customerMood: 'neutral',
      issueType: 'order_tracking',
      attemptedSolutions: ['checked order status', 'reviewed shipping details'],
      nextSteps: ['contact shipping carrier', 'process refund if not delivered'],
    },
    preparedAt: new Date().toISOString(),
  };
}

/**
 * Get quality scorecard for response
 */
function scoreResponse(response) {
  return {
    overallScore: Math.floor(Math.random() * 20) + 80,
    criteria: {
      empathy: Math.floor(Math.random() * 20) + 80,
      clarity: Math.floor(Math.random() * 20) + 80,
      completeness: Math.floor(Math.random() * 20) + 80,
      professionalism: Math.floor(Math.random() * 20) + 80,
      efficiency: Math.floor(Math.random() * 20) + 80,
    },
    feedback: 'Response shows good empathy and provides clear next steps',
  };
}

module.exports = {
  startAgentSession,
  endAgentSession,
  getSuggestionsForAgent,
  getDraftResponse,
  createSnippet,
  getSnippetByShortcut,
  listSnippets,
  useSnippet,
  createMacro,
  executeMacro,
  getSimilarConversations,
  getCustomerContext,
  analyzeAgentResponse,
  getRecommendedTags,
  translateMessage,
  getAgentInsights,
  prepareTransfer,
  scoreResponse,
};
