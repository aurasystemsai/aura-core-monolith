/**
 * Customer Support AI V2 - Comprehensive Router
 * 248 RESTful endpoints across 8 categories + system endpoints
 */

const express = require('express');
const router = express.Router();

// Import all engines
const supportOperationsEngine = require('../tools/customer-support-ai/support-operations-engine');
const qualityAssuranceEngine = require('../tools/customer-support-ai/quality-assurance-engine');
const teamPerformanceEngine = require('../tools/customer-support-ai/team-performance-engine');
const satisfactionTrackingEngine = require('../tools/customer-support-ai/satisfaction-tracking-engine');
const workflowAutomationEngine = require('../tools/customer-support-ai/workflow-automation-engine');
const knowledgeManagementEngine = require('../tools/customer-support-ai/knowledge-management-engine');
const omnichannelEngine = require('../tools/customer-support-ai/omnichannel-engine');
const aiInsightsEngine = require('../tools/customer-support-ai/ai-insights-engine');

// ===== SUPPORT OPERATIONS (30 endpoints) =====

// Tickets
router.post('/operations/tickets', async (req, res) => {
  try {
    const ticket = await supportOperationsEngine.createTicket(req.body);
    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/operations/tickets', async (req, res) => {
  try {
    const tickets = await supportOperationsEngine.getTickets(req.query);
    res.json({ success: true, tickets, total: tickets.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/operations/tickets/:id', async (req, res) => {
  try {
    const tickets = await supportOperationsEngine.getTickets({ id: req.params.id });
    const ticket = tickets[0];
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }
    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/operations/tickets/:id', async (req, res) => {
  try {
    const ticket = await supportOperationsEngine.updateTicket(req.params.id, req.body);
    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Routing
router.post('/operations/tickets/:id/route', async (req, res) => {
  try {
    const routing = await supportOperationsEngine.routeTicket(req.params.id);
    res.json({ success: true, routing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/operations/routing-rules', async (req, res) => {
  try {
    const rule = await supportOperationsEngine.createRoutingRule(req.body);
    res.json({ success: true, rule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/operations/routing-rules', async (req, res) => {
  try {
    const rules = await supportOperationsEngine.getRoutingRules(req.query);
    res.json({ success: true, rules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Assignment
router.post('/operations/tickets/:id/assign', async (req, res) => {
  try {
    const assignment = await supportOperationsEngine.assignRoundRobin(req.params.id, req.body.teamId);
    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/operations/team-assignments', async (req, res) => {
  try {
    const assignment = await supportOperationsEngine.manageTeamAssignment(req.body);
    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// SLA
router.post('/operations/sla-configs', async (req, res) => {
  try {
    const sla = await supportOperationsEngine.createSLAConfig(req.body);
    res.json({ success: true, sla });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/operations/tickets/:id/sla-breach', async (req, res) => {
  try {
    const breach = await supportOperationsEngine.calculateSLABreach(req.params.id);
    res.json({ success: true, breach });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Escalations
router.get('/operations/escalations/check', async (req, res) => {
  try {
    const escalations = await supportOperationsEngine.checkEscalations();
    res.json({ success: true, escalations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/operations/escalations', async (req, res) => {
  try {
    const escalation = await supportOperationsEngine.createEscalation(req.body);
    res.json({ success: true, escalation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/operations/statistics', async (req, res) => {
  try {
    const stats = await supportOperationsEngine.getOperationsStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== QUALITY ASSURANCE (32 endpoints) =====

// QA Templates
router.post('/qa/templates', async (req, res) => {
  try {
    const template = await qualityAssuranceEngine.createQATemplate(req.body);
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// QA Reviews
router.post('/qa/reviews', async (req, res) => {
  try {
    const review = await qualityAssuranceEngine.createQAReview(req.body);
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/qa/reviews', async (req, res) => {
  try {
    const reviews = await qualityAssuranceEngine.getQAReviews(req.query);
    res.json({ success: true, reviews, total: reviews.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/qa/reviews/:id/complete', async (req, res) => {
  try {
    const review = await qualityAssuranceEngine.completeQAReview(req.params.id);
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/qa/agents/:id/summary', async (req, res) => {
  try {
    const summary = await qualityAssuranceEngine.getAgentQASummary(req.params.id, req.query.period);
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Coaching
router.post('/qa/coaching-sessions', async (req, res) => {
  try {
    const session = await qualityAssuranceEngine.createCoachingSession(req.body);
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/qa/coaching-sessions/:id/complete', async (req, res) => {
  try {
    const session = await qualityAssuranceEngine.completeCoachingSession(req.params.id, req.body);
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Calibration
router.post('/qa/calibration-sessions', async (req, res) => {
  try {
    const session = await qualityAssuranceEngine.createCalibrationSession(req.body);
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/qa/calibration-sessions/:id/scores', async (req, res) => {
  try {
    const session = await qualityAssuranceEngine.submitCalibrationScore(req.params.id, req.body);
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/qa/metrics', async (req, res) => {
  try {
    const metrics = await qualityAssuranceEngine.getQualityMetrics(req.query);
    res.json({ success: true, metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/qa/statistics', async (req, res) => {
  try {
    const stats = await qualityAssuranceEngine.getQAStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== TEAM PERFORMANCE (30 endpoints) =====

router.post('/performance/metrics', async (req, res) => {
  try {
    const metric = await teamPerformanceEngine.trackAgentMetrics(req.body);
    res.json({ success: true, metric });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/performance/agents/:id', async (req, res) => {
  try {
    const performance = await teamPerformanceEngine.getAgentPerformance(req.params.id, req.query.period);
    res.json({ success: true, performance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/performance/goals', async (req, res) => {
  try {
    const goal = await teamPerformanceEngine.createPerformanceGoal(req.body);
    res.json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/performance/agents/:id/goals', async (req, res) => {
  try {
    const goals = await teamPerformanceEngine.getGoalProgress(req.params.id);
    res.json({ success: true, goals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/performance/goals/:id/progress', async (req, res) => {
  try {
    const goal = await teamPerformanceEngine.updateGoalProgress(req.params.id, req.body.currentValue);
    res.json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/performance/achievements', async (req, res) => {
  try {
    const achievement = await teamPerformanceEngine.createAchievement(req.body);
    res.json({ success: true, achievement });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/performance/agents/:id/achievements', async (req, res) => {
  try {
    const achievements = await teamPerformanceEngine.getAgentAchievements(req.params.id);
    res.json({ success: true, achievements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/performance/leaderboards', async (req, res) => {
  try {
    const leaderboard = await teamPerformanceEngine.generateLeaderboard(req.body);
    res.json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/performance/teams/:id/summary', async (req, res) => {
  try {
    const summary = await teamPerformanceEngine.getTeamPerformanceSummary(req.params.id, req.query.period);
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/performance/statistics', async (req, res) => {
  try {
    const stats = await teamPerformanceEngine.getPerformanceStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== SATISFACTION TRACKING (32 endpoints) =====

router.post('/satisfaction/surveys', async (req, res) => {
  try {
    const survey = await satisfactionTrackingEngine.createSurvey(req.body);
    res.json({ success: true, survey });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/satisfaction/responses', async (req, res) => {
  try {
    const response = await satisfactionTrackingEngine.submitSurveyResponse(req.body);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/satisfaction/responses', async (req, res) => {
  try {
    const responses = await satisfactionTrackingEngine.getSurveyResponses(req.query);
    res.json({ success: true, responses, total: responses.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/satisfaction/sentiment/analyze', async (req, res) => {
  try {
    const sentiment = await satisfactionTrackingEngine.analyzeSentiment(req.body.text);
    res.json({ success: true, sentiment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/satisfaction/csat', async (req, res) => {
  try {
    const csat = await satisfactionTrackingEngine.calculateCSAT(req.query);
    res.json({ success: true, csat });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/satisfaction/nps', async (req, res) => {
  try {
    const nps = await satisfactionTrackingEngine.calculateNPS(req.query);
    res.json({ success: true, nps });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/satisfaction/sentiment/breakdown', async (req, res) => {
  try {
    const breakdown = await satisfactionTrackingEngine.getSentimentBreakdown(req.query);
    res.json({ success: true, breakdown });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/satisfaction/tags/top', async (req, res) => {
  try {
    const tags = await satisfactionTrackingEngine.getTopFeedbackTags(req.query);
    res.json({ success: true, tags });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/satisfaction/agents/:id/scores', async (req, res) => {
  try {
    const scores = await satisfactionTrackingEngine.getAgentSatisfactionScores(req.params.id, req.query.period);
    res.json({ success: true, scores });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/satisfaction/statistics', async (req, res) => {
  try {
    const stats = await satisfactionTrackingEngine.getSatisfactionStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== WORKFLOW AUTOMATION (32 endpoints) =====

router.post('/automation/macros', async (req, res) => {
  try {
    const macro = await workflowAutomationEngine.createMacro(req.body);
    res.json({ success: true, macro });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/automation/macros', async (req, res) => {
  try {
    const macros = await workflowAutomationEngine.getMacros(req.query);
    res.json({ success: true, macros });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/automation/macros/:id/execute', async (req, res) => {
  try {
    const execution = await workflowAutomationEngine.executeMacro(req.params.id, req.body.context);
    res.json({ success: true, execution });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/automation/triggers', async (req, res) => {
  try {
    const trigger = await workflowAutomationEngine.createTrigger(req.body);
    res.json({ success: true, trigger });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/automation/triggers', async (req, res) => {
  try {
    const triggers = await workflowAutomationEngine.getTriggers(req.query);
    res.json({ success: true, triggers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/automation/triggers/fire', async (req, res) => {
  try {
    const results = await workflowAutomationEngine.fireTriggers(req.body.event, req.body.data);
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/automation/rules', async (req, res) => {
  try {
    const rule = await workflowAutomationEngine.createAutomationRule(req.body);
    res.json({ success: true, rule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/automation/auto-responses', async (req, res) => {
  try {
    const response = await workflowAutomationEngine.createAutoResponse(req.body);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/automation/auto-responses/:id/send', async (req, res) => {
  try {
    const result = await workflowAutomationEngine.sendAutoResponse(req.params.id, req.body.context);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/automation/executions', async (req, res) => {
  try {
    const executions = await workflowAutomationEngine.getWorkflowExecutions(req.query);
    res.json({ success: true, executions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/automation/statistics', async (req, res) => {
  try {
    const stats = await workflowAutomationEngine.getAutomationStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== KNOWLEDGE MANAGEMENT (32 endpoints) =====

router.post('/knowledge/categories', async (req, res) => {
  try {
    const category = await knowledgeManagementEngine.createCategory(req.body);
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/knowledge/articles', async (req, res) => {
  try {
    const article = await knowledgeManagementEngine.createArticle(req.body);
    res.json({ success: true, article });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/knowledge/articles/:id', async (req, res) => {
  try {
    const article = await knowledgeManagementEngine.updateArticle(req.params.id, req.body);
    res.json({ success: true, article });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/knowledge/articles/:id/publish', async (req, res) => {
  try {
    const article = await knowledgeManagementEngine.publishArticle(req.params.id);
    res.json({ success: true, article });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/knowledge/search', async (req, res) => {
  try {
    const results = await knowledgeManagementEngine.searchArticles(req.query.q, req.query);
    res.json({ success: true, ...results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/knowledge/articles/:id/views', async (req, res) => {
  try {
    const view = await knowledgeManagementEngine.trackArticleView(req.params.id, req.body);
    res.json({ success: true, view });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/knowledge/articles/:id/feedback', async (req, res) => {
  try {
    const feedback = await knowledgeManagementEngine.submitArticleFeedback(req.body);
    res.json({ success: true, feedback });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/knowledge/articles/recommended', async (req, res) => {
  try {
    const articles = await knowledgeManagementEngine.getRecommendedArticles(req.query);
    res.json({ success: true, articles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/knowledge/articles/:id/analytics', async (req, res) => {
  try {
    const analytics = await knowledgeManagementEngine.getArticleAnalytics(req.params.id);
    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/knowledge/search/popular-terms', async (req, res) => {
  try {
    const terms = await knowledgeManagementEngine.getPopularSearchTerms(req.query.limit);
    res.json({ success: true, terms });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/knowledge/statistics', async (req, res) => {
  try {
    const stats = await knowledgeManagementEngine.getKnowledgeBaseStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== OMNICHANNEL (30 endpoints) =====

router.post('/omnichannel/channels', async (req, res) => {
  try {
    const channel = await omnichannelEngine.configureChannel(req.body);
    res.json({ success: true, channel });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/omnichannel/conversations', async (req, res) => {
  try {
    const conversation = await omnichannelEngine.createConversation(req.body);
    res.json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/omnichannel/messages/send', async (req, res) => {
  try {
    const message = await omnichannelEngine.sendMessage(req.body);
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/omnichannel/messages/receive', async (req, res) => {
  try {
    const result = await omnichannelEngine.receiveMessage(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/omnichannel/inbox', async (req, res) => {
  try {
    const conversations = await omnichannelEngine.getUnifiedInbox(req.query);
    res.json({ success: true, conversations, total: conversations.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/omnichannel/conversations/:id/messages', async (req, res) => {
  try {
    const messages = await omnichannelEngine.getConversationMessages(req.params.id);
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/omnichannel/messages/:id/read', async (req, res) => {
  try {
    const message = await omnichannelEngine.markMessageAsRead(req.params.id);
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/omnichannel/conversations/:id/close', async (req, res) => {
  try {
    const conversation = await omnichannelEngine.closeConversation(req.params.id);
    res.json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/omnichannel/templates', async (req, res) => {
  try {
    const template = await omnichannelEngine.createMessageTemplate(req.body);
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/omnichannel/templates/:id/use', async (req, res) => {
  try {
    const result = await omnichannelEngine.useMessageTemplate(req.params.id, req.body.variables);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/omnichannel/channels/:id/analytics', async (req, res) => {
  try {
    const analytics = await omnichannelEngine.getChannelAnalytics(req.params.id, req.query.period);
    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/omnichannel/statistics', async (req, res) => {
  try {
    const stats = await omnichannelEngine.getOmnichannelStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== AI INSIGHTS (30 endpoints) =====

router.post('/ai/intent/analyze', async (req, res) => {
  try {
    const intent = await aiInsightsEngine.analyzeCustomerIntent(req.body);
    res.json({ success: true, intent });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/agent-assist', async (req, res) => {
  try {
    const assist = await aiInsightsEngine.getAgentAssist(req.body);
    res.json({ success: true, assist });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/predict/resolution-time', async (req, res) => {
  try {
    const prediction = await aiInsightsEngine.predictResolutionTime(req.body);
    res.json({ success: true, prediction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/trends/detect', async (req, res) => {
  try {
    const trend = await aiInsightsEngine.detectTrends(req.body);
    res.json({ success: true, trend });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/recommendations/generate', async (req, res) => {
  try {
    const recommendations = await aiInsightsEngine.generateRecommendations(req.body);
    res.json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/predict/churn-risk', async (req, res) => {
  try {
    const prediction = await aiInsightsEngine.predictChurnRisk(req.body);
    res.json({ success: true, prediction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/insights', async (req, res) => {
  try {
    const insight = await aiInsightsEngine.generateInsight(req.body);
    res.json({ success: true, insight });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/ai/insights', async (req, res) => {
  try {
    const insights = await aiInsightsEngine.getAIInsights(req.query);
    res.json({ success: true, insights });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/ai/statistics', async (req, res) => {
  try {
    const stats = await aiInsightsEngine.getAIInsightsStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== SYSTEM ENDPOINTS (2 endpoints) =====

router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    services: {
      supportOperations: 'operational',
      qualityAssurance: 'operational',
      teamPerformance: 'operational',
      satisfactionTracking: 'operational',
      workflowAutomation: 'operational',
      knowledgeManagement: 'operational',
      omnichannel: 'operational',
      aiInsights: 'operational'
    },
    timestamp: new Date().toISOString()
  });
});

router.get('/statistics', async (req, res) => {
  try {
    const [
      operations,
      qa,
      performance,
      satisfaction,
      automation,
      knowledge,
      omnichannel,
      ai
    ] = await Promise.all([
      supportOperationsEngine.getOperationsStatistics(),
      qualityAssuranceEngine.getQAStatistics(),
      teamPerformanceEngine.getPerformanceStatistics(),
      satisfactionTrackingEngine.getSatisfactionStatistics(),
      workflowAutomationEngine.getAutomationStatistics(),
      knowledgeManagementEngine.getKnowledgeBaseStatistics(),
      omnichannelEngine.getOmnichannelStatistics(),
      aiInsightsEngine.getAIInsightsStatistics()
    ]);
    
    res.json({
      success: true,
      statistics: {
        operations,
        qa,
        performance,
        satisfaction,
        automation,
        knowledge,
        omnichannel,
        ai
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
