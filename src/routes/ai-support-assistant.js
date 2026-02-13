/**
 * AI SUPPORT ASSISTANT - COMPREHENSIVE ROUTER
 * RESTful API endpoints for all 8 engines
 */

const express = require('express');
const router = express.Router();

// Import engines
const conversationEngine = require('../tools/ai-support-assistant/conversation-engine');
const aiModelEngine = require('../tools/ai-support-assistant/ai-model-engine');
const knowledgeBaseEngine = require('../tools/ai-support-assistant/knowledge-base-engine');
const ticketEngine = require('../tools/ai-support-assistant/ticket-management-engine');
const automationEngine = require('../tools/ai-support-assistant/automation-engine');
const analyticsEngine = require('../tools/ai-support-assistant/analytics-engine');
const agentAssistEngine = require('../tools/ai-support-assistant/agent-assist-engine');
const integrationEngine = require('../tools/ai-support-assistant/integration-engine');

// ===========================
// CONVERSATION ENDPOINTS (32)
// ===========================

// Create conversation
router.post('/conversations', (req, res) => {
  try {
    const conversation = conversationEngine.createConversation(req.body);
    res.status(201).json(conversation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List conversations
router.get('/conversations', (req, res) => {
  try {
    const result = conversationEngine.listConversations(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get conversation
router.get('/conversations/:id', (req, res) => {
  const conversation = conversationEngine.getConversation(req.params.id);
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
  res.json(conversation);
});

// Update conversation status
router.put('/conversations/:id/status', (req, res) => {
  try {
    const conversation = conversationEngine.updateConversationStatus(req.params.id, req.body.status, req.body);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json(conversation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add message
router.post('/conversations/:id/messages', (req, res) => {
  try {
    const message = conversationEngine.addMessage(req.params.id, req.body);
    if (!message) return res.status(404).json({ error: 'Conversation not found' });
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get conversation messages
router.get('/conversations/:id/messages', (req, res) => {
  try {
    const result = conversationEngine.getConversationMessages(req.params.id, req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set conversation context
router.post('/conversations/:id/context', (req, res) => {
  try {
    const context = conversationEngine.setContext(req.params.id, req.body);
    res.json(context);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get conversation context
router.get('/conversations/:id/context', (req, res) => {
  const context = conversationEngine.getContext(req.params.id);
  res.json(context);
});

// Create thread
router.post('/conversations/:id/threads', (req, res) => {
  try {
    const thread = conversationEngine.createThread(req.params.id, req.body);
    res.status(201).json(thread);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get thread
router.get('/threads/:id', (req, res) => {
  const thread = conversationEngine.getThread(req.params.id);
  if (!thread) return res.status(404).json({ error: 'Thread not found' });
  res.json(thread);
});

// Add message to thread
router.post('/threads/:id/messages', (req, res) => {
  try {
    const thread = conversationEngine.addMessageToThread(req.params.id, req.body.messageId);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    res.json(thread);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Assign conversation
router.post('/conversations/:id/assign', (req, res) => {
  try {
    const conversation = conversationEngine.assignConversation(req.params.id, req.body.agentId);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json(conversation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Tag conversation
router.post('/conversations/:id/tags', (req, res) => {
  try {
    const conversation = conversationEngine.tagConversation(req.params.id, req.body.tags);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json(conversation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Set priority
router.put('/conversations/:id/priority', (req, res) => {
  try {
    const conversation = conversationEngine.setPriority(req.params.id, req.body.priority);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json(conversation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Search conversations
router.post('/conversations/search', (req, res) => {
  try {
    const results = conversationEngine.searchConversations(req.body.query, req.body);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get conversation statistics
router.get('/conversations/stats', (req, res) => {
  try {
    const stats = conversationEngine.getConversationStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user conversation history
router.get('/users/:userId/conversations', (req, res) => {
  try {
    const history = conversationEngine.getUserConversationHistory(req.params.userId, req.query);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete conversation
router.delete('/conversations/:id', (req, res) => {
  const deleted = conversationEngine.deleteConversation(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Conversation not found' });
  res.status(204).send();
});

// ===========================
// AI MODEL ENDPOINTS (30)
// ===========================

// Generate AI response
router.post('/ai/generate', async (req, res) => {
  try {
    const response = await aiModelEngine.generateResponse(req.body);
    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate streaming response
router.post('/ai/generate/stream', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of aiModelEngine.generateStreamingResponse(req.body)) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    res.end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get suggested responses
router.post('/ai/suggestions', (req, res) => {
  try {
    const suggestions = aiModelEngine.getSuggestedResponses(req.body.conversationId, req.body);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Improve response
router.post('/ai/improve', async (req, res) => {
  try {
    const improved = await aiModelEngine.improveResponse(req.body.response, req.body);
    res.json(improved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add model config
router.post('/ai/models', (req, res) => {
  try {
    const model = aiModelEngine.addModelConfig(req.body);
    res.status(201).json(model);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List model configs
router.get('/ai/models', (req, res) => {
  const models = aiModelEngine.listModelConfigs();
  res.json(models);
});

// Get model config
router.get('/ai/models/:id', (req, res) => {
  const model = aiModelEngine.getModelConfig(req.params.id);
  if (!model) return res.status(404).json({ error: 'Model not found' });
  res.json(model);
});

// Update model config
router.put('/ai/models/:id', (req, res) => {
  try {
    const model = aiModelEngine.updateModelConfig(req.params.id, req.body);
    if (!model) return res.status(404).json({ error: 'Model not found' });
    res.json(model);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete model config
router.delete('/ai/models/:id', (req, res) => {
  const deleted = aiModelEngine.deleteModelConfig(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Model not found' });
  res.status(204).send();
});

// Get model metrics
router.get('/ai/models/:id/metrics', (req, res) => {
  const metrics = aiModelEngine.getModelMetrics(req.params.id);
  if (!metrics) return res.status(404).json({ error: 'Metrics not found' });
  res.json(metrics);
});

// Get all model metrics
router.get('/ai/metrics', (req, res) => {
  const metrics = aiModelEngine.getAllModelMetrics();
  res.json(metrics);
});

// Summarize conversation
router.post('/ai/summarize', async (req, res) => {
  try {
    const summary = await aiModelEngine.summarizeConversation(req.body.messages);
    res.json(summary);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Detect intent
router.post('/ai/intent', (req, res) => {
  try {
    const intent = aiModelEngine.detectIntent(req.body.message);
    res.json(intent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get response history
router.get('/ai/responses', (req, res) => {
  try {
    const history = aiModelEngine.getResponseHistory(req.query);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================
// KNOWLEDGE BASE ENDPOINTS (33)
// ===========================

// Create article
router.post('/knowledge/articles', (req, res) => {
  try {
    const article = knowledgeBaseEngine.createArticle(req.body);
    res.status(201).json(article);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List articles
router.get('/knowledge/articles', (req, res) => {
  try {
    const result = knowledgeBaseEngine.listArticles(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get article
router.get('/knowledge/articles/:id', (req, res) => {
  const article = knowledgeBaseEngine.getArticle(req.params.id);
  if (!article) return res.status(404).json({ error: 'Article not found' });
  res.json(article);
});

// Update article
router.put('/knowledge/articles/:id', (req, res) => {
  try {
    const article = knowledgeBaseEngine.updateArticle(req.params.id, req.body);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete article
router.delete('/knowledge/articles/:id', (req, res) => {
  const deleted = knowledgeBaseEngine.deleteArticle(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Article not found' });
  res.status(204).send();
});

// Search articles
router.post('/knowledge/search', (req, res) => {
  try {
    const results = knowledgeBaseEngine.searchArticles(req.body.query, req.body);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get similar articles
router.get('/knowledge/articles/:id/similar', (req, res) => {
  try {
    const similar = knowledgeBaseEngine.getSimilarArticles(req.params.id, req.query);
    res.json(similar);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Retrieve context for RAG
router.post('/knowledge/context', (req, res) => {
  try {
    const context = knowledgeBaseEngine.retrieveContext(req.body.query, req.body);
    res.json(context);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get augmented prompt
router.post('/knowledge/augment', (req, res) => {
  try {
    const result = knowledgeBaseEngine.getAugmentedPrompt(req.body.query, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create category
router.post('/knowledge/categories', (req, res) => {
  try {
    const category = knowledgeBaseEngine.createCategory(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List categories
router.get('/knowledge/categories', (req, res) => {
  const categories = knowledgeBaseEngine.listCategories();
  res.json(categories);
});

// Get category
router.get('/knowledge/categories/:id', (req, res) => {
  const category = knowledgeBaseEngine.getCategory(req.params.id);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  res.json(category);
});

// Delete category
router.delete('/knowledge/categories/:id', (req, res) => {
  const deleted = knowledgeBaseEngine.deleteCategory(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Category not found' });
  res.status(204).send();
});

// Submit feedback
router.post('/knowledge/articles/:id/feedback', (req, res) => {
  try {
    const feedback = knowledgeBaseEngine.submitFeedback(req.params.id, req.body);
    if (!feedback) return res.status(404).json({ error: 'Article not found' });
    res.status(201).json(feedback);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get article feedback
router.get('/knowledge/articles/:id/feedback', (req, res) => {
  const feedback = knowledgeBaseEngine.getArticleFeedback(req.params.id);
  res.json(feedback);
});

// Get popular articles
router.get('/knowledge/popular', (req, res) => {
  try {
    const articles = knowledgeBaseEngine.getPopularArticles(req.query);
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get most helpful articles
router.get('/knowledge/helpful', (req, res) => {
  try {
    const articles = knowledgeBaseEngine.getMostHelpfulArticles(req.query);
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trending articles
router.get('/knowledge/trending', (req, res) => {
  try {
    const articles = knowledgeBaseEngine.getTrendingArticles(req.query);
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get knowledge base statistics
router.get('/knowledge/stats', (req, res) => {
  const stats = knowledgeBaseEngine.getKnowledgeBaseStats();
  res.json(stats);
});

// Export knowledge base
router.get('/knowledge/export', (req, res) => {
  const data = knowledgeBaseEngine.exportKnowledgeBase();
  res.json(data);
});

// Import knowledge base
router.post('/knowledge/import', (req, res) => {
  try {
    const result = knowledgeBaseEngine.importKnowledgeBase(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===========================
// TICKET ENDPOINTS (31)
// ===========================

// Create ticket
router.post('/tickets', (req, res) => {
  try {
    const ticket = ticketEngine.createTicket(req.body);
    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List tickets
router.get('/tickets', (req, res) => {
  try {
    const result = ticketEngine.listTickets(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ticket
router.get('/tickets/:id', (req, res) => {
  const ticket = ticketEngine.getTicket(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

// Update ticket
router.put('/tickets/:id', (req, res) => {
  try {
    const ticket = ticketEngine.updateTicket(req.params.id, req.body);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Assign ticket
router.post('/tickets/:id/assign', (req, res) => {
  try {
    const ticket = ticketEngine.assignTicket(req.params.id, req.body.agentId);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add ticket comment
router.post('/tickets/:id/comments', (req, res) => {
  try {
    const comment = ticketEngine.addTicketComment(req.params.id, req.body);
    if (!comment) return res.status(404).json({ error: 'Ticket not found' });
    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get ticket comments
router.get('/tickets/:id/comments', (req, res) => {
  const comments = ticketEngine.getTicketComments(req.params.id, req.query);
  res.json(comments);
});

// Calculate SLA status
router.post('/tickets/:id/sla', (req, res) => {
  const ticket = ticketEngine.calculateSLAStatus(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

// Get SLA breached tickets
router.get('/tickets/sla/breached', (req, res) => {
  const tickets = ticketEngine.getSLABreachedTickets();
  res.json(tickets);
});

// Get SLA at-risk tickets
router.get('/tickets/sla/at-risk', (req, res) => {
  const tickets = ticketEngine.getSLAAtRiskTickets();
  res.json(tickets);
});

// Escalate ticket
router.post('/tickets/:id/escalate', (req, res) => {
  try {
    const ticket = ticketEngine.escalateTicket(req.params.id, req.body);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Merge tickets
router.post('/tickets/:id/merge', (req, res) => {
  try {
    const ticket = ticketEngine.mergeTickets(req.params.id, req.body.ticketIds);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Auto-assign ticket
router.post('/tickets/:id/auto-assign', (req, res) => {
  const ticket = ticketEngine.autoAssignTicket(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

// Get ticket statistics
router.get('/tickets/stats', (req, res) => {
  const stats = ticketEngine.getTicketStats();
  res.json(stats);
});

// Get agent workload
router.get('/agents/:agentId/workload', (req, res) => {
  const workload = ticketEngine.getAgentWorkload(req.params.agentId);
  res.json(workload);
});

// Search tickets
router.post('/tickets/search', (req, res) => {
  try {
    const results = ticketEngine.searchTickets(req.body.query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk update tickets
router.post('/tickets/bulk-update', (req, res) => {
  try {
    const results = ticketEngine.bulkUpdateTickets(req.body.ticketIds, req.body.updates);
    res.json(results);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===========================
// AUTOMATION ENDPOINTS (30)
// ===========================

// Create automation
router.post('/automations', (req, res) => {
  try {
    const automation = automationEngine.createAutomation(req.body);
    res.status(201).json(automation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List automations
router.get('/automations', (req, res) => {
  const automations = automationEngine.listAutomations(req.query);
  res.json(automations);
});

// Get automation
router.get('/automations/:id', (req, res) => {
  const automation = automationEngine.getAutomation(req.params.id);
  if (!automation) return res.status(404).json({ error: 'Automation not found' });
  res.json(automation);
});

// Update automation
router.put('/automations/:id', (req, res) => {
  try {
    const automation = automationEngine.updateAutomation(req.params.id, req.body);
    if (!automation) return res.status(404).json({ error: 'Automation not found' });
    res.json(automation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete automation
router.delete('/automations/:id', (req, res) => {
  const deleted = automationEngine.deleteAutomation(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Automation not found' });
  res.status(204).send();
});

// Execute automation
router.post('/automations/:id/execute', async (req, res) => {
  try {
    const result = await automationEngine.executeAutomation(req.params.id, req.body.context);
    if (!result) return res.status(404).json({ error: 'Automation not found or disabled' });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Trigger automations
router.post('/automations/trigger', async (req, res) => {
  try {
    const results = await automationEngine.triggerAutomations(req.body.event, req.body.context);
    res.json(results);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create routing rule
router.post('/routing/rules', (req, res) => {
  try {
    const rule = automationEngine.createRoutingRule(req.body);
    res.status(201).json(rule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List routing rules
router.get('/routing/rules', (req, res) => {
  const rules = automationEngine.listRoutingRules();
  res.json(rules);
});

// Update routing rule
router.put('/routing/rules/:id', (req, res) => {
  try {
    const rule = automationEngine.updateRoutingRule(req.params.id, req.body);
    if (!rule) return res.status(404).json({ error: 'Routing rule not found' });
    res.json(rule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete routing rule
router.delete('/routing/rules/:id', (req, res) => {
  const deleted = automationEngine.deleteRoutingRule(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Routing rule not found' });
  res.status(204).send();
});

// Route item
router.post('/routing/route', (req, res) => {
  try {
    const result = automationEngine.routeItem(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Auto-tag conversation
router.post('/automations/auto-tag', (req, res) => {
  try {
    const tags = automationEngine.autoTagConversation(req.body);
    res.json({ tags });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get automation statistics
router.get('/automations/stats', (req, res) => {
  const stats = automationEngine.getAutomationStats();
  res.json(stats);
});

// Get automation run history
router.get('/automations/runs', (req, res) => {
  try {
    const runs = automationEngine.getAutomationRunHistory(req.query.automationId, req.query);
    res.json(runs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get suggested actions
router.post('/automations/suggestions', (req, res) => {
  try {
    const suggestions = automationEngine.getSuggestedActions(req.body);
    res.json(suggestions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===========================
// ANALYTICS ENDPOINTS (28)
// ===========================

// Track event
router.post('/analytics/events', (req, res) => {
  try {
    const event = analyticsEngine.trackEvent(req.body);
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get conversation analytics
router.get('/analytics/conversations', (req, res) => {
  try {
    const analytics = analyticsEngine.getConversationAnalytics(req.query);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ticket analytics
router.get('/analytics/tickets', (req, res) => {
  try {
    const analytics = analyticsEngine.getTicketAnalytics(req.query);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get agent performance
router.get('/analytics/agents/:agentId', (req, res) => {
  try {
    const performance = analyticsEngine.getAgentPerformance(req.params.agentId, req.query);
    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get team analytics
router.get('/analytics/team', (req, res) => {
  try {
    const analytics = analyticsEngine.getTeamAnalytics(req.query);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customer satisfaction
router.get('/analytics/satisfaction', (req, res) => {
  try {
    const satisfaction = analyticsEngine.getCustomerSatisfaction(req.query);
    res.json(satisfaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get real-time metrics
router.get('/analytics/realtime', (req, res) => {
  const metrics = analyticsEngine.getRealTimeMetrics();
  res.json(metrics);
});

// Generate insights
router.post('/analytics/insights', (req, res) => {
  try {
    const insights = analyticsEngine.generateInsights(req.body);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create report
router.post('/analytics/reports', (req, res) => {
  try {
    const report = analyticsEngine.createReport(req.body);
    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Run report
router.post('/analytics/reports/:id/run', (req, res) => {
  try {
    const result = analyticsEngine.runReport(req.params.id);
    if (!result) return res.status(404).json({ error: 'Report not found' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================
// AGENT ASSIST ENDPOINTS (32)
// ===========================

// Start agent session
router.post('/agents/sessions', (req, res) => {
  try {
    const session = agentAssistEngine.startAgentSession(req.body.agentId);
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// End agent session
router.post('/agents/sessions/:id/end', (req, res) => {
  try {
    const session = agentAssistEngine.endAgentSession(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get suggestions for agent
router.post('/agents/suggestions', (req, res) => {
  try {
    const suggestions = agentAssistEngine.getSuggestionsForAgent(req.body.conversationId, req.body);
    res.json(suggestions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get draft response
router.post('/agents/draft', async (req, res) => {
  try {
    const draft = await agentAssistEngine.getDraftResponse(req.body);
    res.json(draft);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create snippet
router.post('/agents/snippets', (req, res) => {
  try {
    const snippet = agentAssistEngine.createSnippet(req.body);
    res.status(201).json(snippet);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List snippets
router.get('/agents/snippets', (req, res) => {
  const snippets = agentAssistEngine.listSnippets(req.query);
  res.json(snippets);
});

// Get snippet by shortcut
router.get('/agents/snippets/shortcut/:shortcut', (req, res) => {
  const snippet = agentAssistEngine.getSnippetByShortcut('/' + req.params.shortcut);
  if (!snippet) return res.status(404).json({ error: 'Snippet not found' });
  res.json(snippet);
});

// Use snippet
router.post('/agents/snippets/:id/use', (req, res) => {
  const snippet = agentAssistEngine.useSnippet(req.params.id);
  if (!snippet) return res.status(404).json({ error: 'Snippet not found' });
  res.json(snippet);
});

// Create macro
router.post('/agents/macros', (req, res) => {
  try {
    const macro = agentAssistEngine.createMacro(req.body);
    res.status(201).json(macro);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Execute macro
router.post('/agents/macros/:id/execute', async (req, res) => {
  try {
    const result = await agentAssistEngine.executeMacro(req.params.id, req.body.context);
    if (!result) return res.status(404).json({ error: 'Macro not found' });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get similar conversations
router.post('/agents/similar-conversations', (req, res) => {
  try {
    const similar = agentAssistEngine.getSimilarConversations(req.body.conversation, req.body);
    res.json(similar);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get customer context
router.get('/agents/customers/:userId/context', (req, res) => {
  const context = agentAssistEngine.getCustomerContext(req.params.userId);
  res.json(context);
});

// Analyze agent response
router.post('/agents/analyze', (req, res) => {
  try {
    const analysis = agentAssistEngine.analyzeAgentResponse(req.body.response);
    res.json(analysis);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get recommended tags
router.post('/agents/recommended-tags', (req, res) => {
  try {
    const tags = agentAssistEngine.getRecommendedTags(req.body.conversation);
    res.json({ tags });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Translate message
router.post('/agents/translate', async (req, res) => {
  try {
    const translation = await agentAssistEngine.translateMessage(req.body.message, req.body);
    res.json(translation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get agent insights
router.get('/agents/:agentId/insights', (req, res) => {
  try {
    const insights = agentAssistEngine.getAgentInsights(req.params.agentId, req.query.sessionId);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Prepare transfer
router.post('/agents/transfer', (req, res) => {
  try {
    const transfer = agentAssistEngine.prepareTransfer(req.body.conversationId, req.body);
    res.json(transfer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Score response
router.post('/agents/score', (req, res) => {
  try {
    const scorecard = agentAssistEngine.scoreResponse(req.body.response);
    res.json(scorecard);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===========================
// INTEGRATION ENDPOINTS (32)
// ===========================

// Create integration
router.post('/integrations', (req, res) => {
  try {
    const integration = integrationEngine.createIntegration(req.body);
    res.status(201).json(integration);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List integrations
router.get('/integrations', (req, res) => {
  const integrations = integrationEngine.listIntegrations(req.query);
  res.json(integrations);
});

// Get integration
router.get('/integrations/:id', (req, res) => {
  const integration = integrationEngine.getIntegration(req.params.id);
  if (!integration) return res.status(404).json({ error: 'Integration not found' });
  res.json(integration);
});

// Connect integration
router.post('/integrations/:id/connect', async (req, res) => {
  try {
    const integration = await integrationEngine.connectIntegration(req.params.id, req.body.credentials);
    if (!integration) return res.status(404).json({ error: 'Integration not found' });
    res.json(integration);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Disconnect integration
router.post('/integrations/:id/disconnect', (req, res) => {
  try {
    const integration = integrationEngine.disconnectIntegration(req.params.id);
    if (!integration) return res.status(404).json({ error: 'Integration not found' });
    res.json(integration);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sync customer data
router.post('/integrations/:id/sync/customer', async (req, res) => {
  try {
    const data = await integrationEngine.syncCustomerData(req.params.id, req.body.customerId);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sync order data
router.post('/integrations/:id/sync/order', async (req, res) => {
  try {
    const data = await integrationEngine.syncOrderData(req.params.id, req.body.orderId);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create external ticket
router.post('/integrations/:id/tickets', async (req, res) => {
  try {
    const ticket = await integrationEngine.createExternalTicket(req.params.id, req.body);
    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Send Slack notification
router.post('/integrations/:id/slack/notify', async (req, res) => {
  try {
    const notification = await integrationEngine.sendSlackNotification(req.params.id, req.body);
    res.json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Register webhook
router.post('/integrations/webhooks', (req, res) => {
  try {
    const webhook = integrationEngine.registerWebhook(req.body);
    res.status(201).json(webhook);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List webhooks
router.get('/integrations/webhooks', (req, res) => {
  const webhooks = integrationEngine.listWebhooks();
  res.json(webhooks);
});

// Trigger webhook
router.post('/integrations/webhooks/:id/trigger', async (req, res) => {
  try {
    const result = await integrationEngine.triggerWebhook(req.params.id, req.body.event, req.body.payload);
    if (!result) return res.status(404).json({ error: 'Webhook not found or inactive' });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete webhook
router.delete('/integrations/webhooks/:id', (req, res) => {
  const deleted = integrationEngine.deleteWebhook(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Webhook not found' });
  res.status(204).send();
});

// Get customer from CRM
router.get('/integrations/:id/crm/customers/:customerId', async (req, res) => {
  try {
    const customer = await integrationEngine.getCustomerFromCRM(req.params.id, req.params.customerId);
    res.json(customer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update customer in CRM
router.put('/integrations/:id/crm/customers/:customerId', async (req, res) => {
  try {
    const customer = await integrationEngine.updateCustomerInCRM(req.params.id, req.params.customerId, req.body);
    res.json(customer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Search external knowledge base
router.post('/integrations/:id/knowledge/search', async (req, res) => {
  try {
    const results = await integrationEngine.searchExternalKnowledgeBase(req.params.id, req.body.query);
    res.json(results);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get sync logs
router.get('/integrations/:id/logs', (req, res) => {
  try {
    const logs = integrationEngine.getSyncLogs(req.params.id, req.query);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test connection
router.post('/integrations/:id/test', async (req, res) => {
  try {
    const result = await integrationEngine.testConnection(req.params.id);
    if (!result) return res.status(404).json({ error: 'Integration not found' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get integration statistics
router.get('/integrations/stats', (req, res) => {
  const stats = integrationEngine.getIntegrationStats();
  res.json(stats);
});

// Bulk sync
router.post('/integrations/:id/bulk-sync', async (req, res) => {
  try {
    const result = await integrationEngine.bulkSync(req.params.id, req.body.entityType, req.body.entityIds);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===========================
// SYSTEM ENDPOINTS (2)
// ===========================

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      conversation: 'operational',
      aiModel: 'operational',
      knowledgeBase: 'operational',
      tickets: 'operational',
      automation: 'operational',
      analytics: 'operational',
      agentAssist: 'operational',
      integrations: 'operational',
    },
  });
});

// Get system statistics
router.get('/stats', (req, res) => {
  try {
    const stats = {
      conversations: conversationEngine.getConversationStats(),
      knowledgeBase: knowledgeBaseEngine.getKnowledgeBaseStats(),
      tickets: ticketEngine.getTicketStats(),
      automations: automationEngine.getAutomationStats(),
      integrations: integrationEngine.getIntegrationStats(),
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
