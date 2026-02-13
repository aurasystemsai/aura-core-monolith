/**
 * AI SUPPORT ASSISTANT - CONVERSATION ENGINE
 * Manages conversations, context, threading, and dialogue flow
 */

const crypto = require('crypto');

// In-memory storage
const conversations = new Map();
const messages = new Map();
const contexts = new Map();
const threads = new Map();

/**
 * Create a new conversation
 */
function createConversation({ userId, channel, metadata = {} }) {
  const conversation = {
    id: `conv_${crypto.randomBytes(8).toString('hex')}`,
    userId,
    channel, // web, email, sms, chat, whatsapp
    status: 'active', // active, resolved, escalated, closed
    priority: 'normal', // low, normal, high, urgent
    sentiment: 'neutral', // positive, neutral, negative
    metadata,
    messageCount: 0,
    startedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    resolvedAt: null,
    assignedTo: null,
    tags: [],
  };

  conversations.set(conversation.id, conversation);
  return conversation;
}

/**
 * Get conversation by ID
 */
function getConversation(conversationId) {
  return conversations.get(conversationId);
}

/**
 * List conversations with filters
 */
function listConversations({ status, userId, channel, limit = 50, offset = 0 } = {}) {
  let filtered = Array.from(conversations.values());

  if (status) filtered = filtered.filter(c => c.status === status);
  if (userId) filtered = filtered.filter(c => c.userId === userId);
  if (channel) filtered = filtered.filter(c => c.channel === channel);

  filtered.sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));

  return {
    conversations: filtered.slice(offset, offset + limit),
    total: filtered.length,
    hasMore: offset + limit < filtered.length,
  };
}

/**
 * Add message to conversation
 */
function addMessage(conversationId, { content, role, metadata = {} }) {
  const conversation = conversations.get(conversationId);
  if (!conversation) return null;

  const message = {
    id: `msg_${crypto.randomBytes(8).toString('hex')}`,
    conversationId,
    content,
    role, // user, assistant, system
    sentiment: analyzeSentiment(content),
    metadata,
    createdAt: new Date().toISOString(),
  };

  messages.set(message.id, message);
  conversation.messageCount++;
  conversation.lastActivityAt = new Date().toISOString();
  
  // Update conversation sentiment
  updateConversationSentiment(conversationId);

  return message;
}

/**
 * Get conversation messages
 */
function getConversationMessages(conversationId, { limit = 100, offset = 0 } = {}) {
  const conversationMessages = Array.from(messages.values())
    .filter(m => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return {
    messages: conversationMessages.slice(offset, offset + limit),
    total: conversationMessages.length,
  };
}

/**
 * Update conversation status
 */
function updateConversationStatus(conversationId, status, { reason, metadata = {} } = {}) {
  const conversation = conversations.get(conversationId);
  if (!conversation) return null;

  conversation.status = status;
  conversation.lastActivityAt = new Date().toISOString();

  if (status === 'resolved' || status === 'closed') {
    conversation.resolvedAt = new Date().toISOString();
  }

  if (metadata) {
    conversation.metadata = { ...conversation.metadata, ...metadata };
  }

  return conversation;
}

/**
 * Manage conversation context
 */
function setContext(conversationId, context) {
  const existing = contexts.get(conversationId) || {};
  contexts.set(conversationId, { ...existing, ...context });
  return contexts.get(conversationId);
}

function getContext(conversationId) {
  return contexts.get(conversationId) || {};
}

/**
 * Thread management for multi-turn conversations
 */
function createThread(conversationId, { topic, parentMessageId } = {}) {
  const thread = {
    id: `thread_${crypto.randomBytes(8).toString('hex')}`,
    conversationId,
    topic,
    parentMessageId,
    messageIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  threads.set(thread.id, thread);
  return thread;
}

function addMessageToThread(threadId, messageId) {
  const thread = threads.get(threadId);
  if (!thread) return null;

  thread.messageIds.push(messageId);
  thread.updatedAt = new Date().toISOString();
  return thread;
}

function getThread(threadId) {
  return threads.get(threadId);
}

/**
 * Assign conversation to agent
 */
function assignConversation(conversationId, agentId) {
  const conversation = conversations.get(conversationId);
  if (!conversation) return null;

  conversation.assignedTo = agentId;
  conversation.lastActivityAt = new Date().toISOString();
  return conversation;
}

/**
 * Add tags to conversation
 */
function tagConversation(conversationId, tags) {
  const conversation = conversations.get(conversationId);
  if (!conversation) return null;

  conversation.tags = [...new Set([...conversation.tags, ...tags])];
  return conversation;
}

/**
 * Set conversation priority
 */
function setPriority(conversationId, priority) {
  const conversation = conversations.get(conversationId);
  if (!conversation) return null;

  conversation.priority = priority;
  return conversation;
}

/**
 * Analyze sentiment (simple implementation)
 */
function analyzeSentiment(text) {
  const positive = ['thank', 'great', 'excellent', 'happy', 'love', 'perfect', 'awesome'];
  const negative = ['bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'disappointed'];

  const lowerText = text.toLowerCase();
  
  const positiveCount = positive.filter(word => lowerText.includes(word)).length;
  const negativeCount = negative.filter(word => lowerText.includes(word)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

/**
 * Update conversation sentiment based on messages
 */
function updateConversationSentiment(conversationId) {
  const { messages: convMessages } = getConversationMessages(conversationId);
  if (!convMessages.length) return;

  const sentiments = convMessages.map(m => m.sentiment);
  const positiveCount = sentiments.filter(s => s === 'positive').length;
  const negativeCount = sentiments.filter(s => s === 'negative').length;

  const conversation = conversations.get(conversationId);
  if (positiveCount > negativeCount) {
    conversation.sentiment = 'positive';
  } else if (negativeCount > positiveCount) {
    conversation.sentiment = 'negative';
  } else {
    conversation.sentiment = 'neutral';
  }
}

/**
 * Search conversations
 */
function searchConversations(query, { limit = 20 } = {}) {
  const lowerQuery = query.toLowerCase();
  
  const results = Array.from(conversations.values())
    .filter(conv => {
      const convMessages = getConversationMessages(conv.id).messages;
      return convMessages.some(m => m.content.toLowerCase().includes(lowerQuery));
    })
    .slice(0, limit);

  return results;
}

/**
 * Get conversation statistics
 */
function getConversationStats() {
  const allConversations = Array.from(conversations.values());
  const allMessages = Array.from(messages.values());

  return {
    totalConversations: allConversations.length,
    activeConversations: allConversations.filter(c => c.status === 'active').length,
    resolvedConversations: allConversations.filter(c => c.status === 'resolved').length,
    escalatedConversations: allConversations.filter(c => c.status === 'escalated').length,
    totalMessages: allMessages.length,
    avgMessagesPerConversation: allConversations.length > 0 
      ? (allMessages.length / allConversations.length).toFixed(2) 
      : 0,
    sentimentDistribution: {
      positive: allConversations.filter(c => c.sentiment === 'positive').length,
      neutral: allConversations.filter(c => c.sentiment === 'neutral').length,
      negative: allConversations.filter(c => c.sentiment === 'negative').length,
    },
  };
}

/**
 * Get conversation history for a user
 */
function getUserConversationHistory(userId, { limit = 10 } = {}) {
  return Array.from(conversations.values())
    .filter(c => c.userId === userId)
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
    .slice(0, limit);
}

/**
 * Delete conversation
 */
function deleteConversation(conversationId) {
  // Delete associated messages
  Array.from(messages.keys())
    .filter(msgId => messages.get(msgId).conversationId === conversationId)
    .forEach(msgId => messages.delete(msgId));

  // Delete context
  contexts.delete(conversationId);

  // Delete threads
  Array.from(threads.keys())
    .filter(threadId => threads.get(threadId).conversationId === conversationId)
    .forEach(threadId => threads.delete(threadId));

  return conversations.delete(conversationId);
}

module.exports = {
  createConversation,
  getConversation,
  listConversations,
  addMessage,
  getConversationMessages,
  updateConversationStatus,
  setContext,
  getContext,
  createThread,
  addMessageToThread,
  getThread,
  assignConversation,
  tagConversation,
  setPriority,
  searchConversations,
  getConversationStats,
  getUserConversationHistory,
  deleteConversation,
};
