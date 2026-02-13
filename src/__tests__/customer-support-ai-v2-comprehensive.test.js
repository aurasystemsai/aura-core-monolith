const request = require('supertest');
const express = require('express');
const customerSupportRouter = require('../routes/customer-support-ai');

const app = express();
app.use(express.json());
app.use('/api/customer-support-ai', customerSupportRouter);

describe('Customer Support AI V2 - Comprehensive Tests', () => {
  
  // Support Operations Tests
  describe('Support Operations', () => {
    test('should create ticket with auto-routing', async () => {
      const response = await request(app)
        .post('/api/customer-support-ai/operations/tickets')
        .send({
          subject: 'Product not working',
          description: 'My product stopped working after update',
          customerId: 'customer-123',
          priority: 'high',
          category: 'technical'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.ticket).toHaveProperty('id');
      expect(response.body.ticket.priority).toBe('high');
    });
    
    test('should route ticket by rule', async () => {
      const response = await request(app)
        .post('/api/customer-support-ai/operations/tickets/ticket-123/route')
        .send({
          ticketId: 'ticket-123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.routing).toHaveProperty('assignedTo');
    });
    
    test('should assign ticket round-robin', async () => {
      const response = await request(app)
        .post('/api/customer-support-ai/operations/tickets/ticket-123/assign')
        .send({
          ticketId: 'ticket-123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.assignment).toHaveProperty('agentId');
    });
    
    test('should calculate SLA breach', async () => {
      const response = await request(app)
        .get('/api/customer-support-ai/operations/tickets/ticket-123/sla-breach');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.breach).toHaveProperty('firstResponse');
      expect(response.body.breach).toHaveProperty('resolution');
    });
    
    test('should check escalations', async () => {
      const response = await request(app)
        .get('/api/customer-support-ai/operations/escalations/check');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.escalations)).toBe(true);
    });
    
    test('should get operations statistics', async () => {
      const response = await request(app)
        .get('/api/customer-support-ai/operations/statistics');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.statistics).toHaveProperty('totalTickets');
      expect(response.body.statistics).toHaveProperty('slaComplianceRate');
    });
  });
  
  // Quality Assurance Tests
  describe('Quality Assurance', () => {
    test('should create QA template', async () => {
      const response = await request(app)
        .post('/api/customer-support-ai/qa/templates')
        .send({
          name: 'Chat Support Template',
          categories: [
            {
              name: 'Communication',
              criteria: [
                { name: 'Greeting', maxPoints: 10 },
                { name: 'Clarity', maxPoints: 15 }
              ]
            }
          ]
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.template).toHaveProperty('totalPoints');
    });
    
    test('should complete QA review with rating', async () => {
      const response = await request(app)
        .post('/api/customer-support-ai/qa/reviews/review-123/complete')
        .send({
          reviewId: 'review-123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.review).toHaveProperty('rating');
      expect(response.body.review).toHaveProperty('percentage');
    });
    
    test('should create coaching session', async () => {
      const response = await request(app)
        .post('/api/customer-support-ai/qa/coaching-sessions')
        .send({
          agentId: 'agent-123',
          type: 'one_on_one',
          topic: 'Improve empathy in responses',
          focusAreas: ['Communication', 'Customer empathy']
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.session).toHaveProperty('id');
    });
    
    test('should submit calibration score with variance', async () => {
      const response = await request(app)
        .post('/api/customer-support-ai/qa/calibration-sessions/cal-123/scores')
        .send({
          sessionId: 'cal-123',
          participantId: 'reviewer-123',
          scores: [
            { criteriaId: 'criteria-1', score: 8 },
            { criteriaId: 'criteria-2', score: 9 }
          ]
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.submission).toHaveProperty('variance');
    });
    
    test('should get agent QA summary', async () => {
      const response = await request(app)
        .get('/api/customer-support-ai/qa/agents/agent-123/summary');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.summary).toHaveProperty('averageScore');
      expect(response.body.summary).toHaveProperty('trend');
    });
    
    test('should get quality metrics', async () => {
      const response = await request(app)
        .get('/api/customer-support-ai/qa/metrics');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toHaveProperty('complianceRate');
    });
  });
  
  // Team Performance Tests
  describe('Team Performance', () => {
    test('should track agent metrics', async () => {
      const response = await request(app)
        .post('/api/customer-support-ai/performance/metrics')
        .send({
          agentId: 'agent-123',
          date: '2025-01-19',
          ticketsResolved: 15,
          averageResponseTime: 120
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toHaveProperty('id');
    });
    
    test('should get agent performance with productivity score', async () => {
      const response = await request(app)
        .get('/api/customer-support-ai/performance/agents/agent-123?period=week');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.performance).toHaveProperty('productivityScore');
      expect(response.body.performance.productivityScore).toBeGreaterThanOrEqual(0);
      expect(response.body.performance.productivityScore).toBeLessThanOrEqual(100);
    });
    
    test('should create and update goal with achievement', async () => {
      const createResponse = await request(app)
        .post('/api/customer-support-ai/performance/goals')
        .send({
          agentId: 'agent-123',
          type: 'individual',
          metric: 'tickets_resolved',
          target: 100,
          period: 'month'
        });
      
      expect(createResponse.status).toBe(200);
      expect(createResponse.body.success).toBe(true);
      
      const updateResponse = await request(app)
        .put('/api/customer-support-ai/performance/goals/goal-123/progress')
        .send({
          goalId: 'goal-123',
          currentValue: 100
        });
      
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.goal.status).toBe('achieved');
    });
    
    test('should generate leaderboard', async () => {
      const response = await request(app)
        .post('/api/customer-support-ai/performance/leaderboards')
        .send({
          metric: 'tickets_resolved',
          period: 'month'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.leaderboard)).toBe(true);
    });
    
    test('should get team summary', async () => {
      const response = await request(app)
        .get('/api/customer-support-ai/performance/teams/team-123/summary');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.summary).toHaveProperty('totalTicketsResolved');
    });
    
    test('should get performance statistics', async () => {
      const response = await request(app)
        .get('/api/customer-support-ai/performance/statistics');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.statistics).toHaveProperty('totalAgents');
    });
  });
  
  // Satisfaction Tracking Tests
  describe('Satisfaction Tracking', () => {
    test('should create survey', async () => {
      const response = await request(app)
        .post('/api/customer-support-ai/satisfaction/surveys')
        .send({
          type: 'csat',
          trigger: 'ticket_resolved',
          channels: ['email']
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.survey).toHaveProperty('id');
    });
    
    test('should submit response with sentiment', async () => {
      const response = await request(app)
        .post('/api/customer-support-ai/satisfaction/responses')
        .send({
          surveyId: 'survey-123',
          customerId: 'customer-123',
          score: 5,
          comment: 'Great service, very helpful agent!'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.response).toHaveProperty('sentiment');
    });
    
    test('should calculate CSAT and NPS', async () => {
      const csatResponse = await request(app)
        .get('/api/customer-support-ai/satisfaction/csat?surveyId=survey-123');
      
      expect(csatResponse.status).toBe(200);
      expect(csatResponse.body.success).toBe(true);
      expect(csatResponse.body.csat).toHaveProperty('satisfactionRate');
      
      const npsResponse = await request(app)
        .get('/api/customer-support-ai/satisfaction/nps?surveyId=survey-123');
      
      expect(npsResponse.status).toBe(200);
      expect(npsResponse.body.success).toBe(true);
      expect(npsResponse.body.nps).toHaveProperty('score');
    });
    
    test('should get sentiment breakdown', async () => {
      const response = await request(app)
        .get('/api/customer-support-ai/satisfaction/sentiment/breakdown');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.breakdown).toHaveProperty('positivePercentage');
    });
    
    test('should get agent satisfaction scores', async () => {
      const response = await request(app)
        .get('/api/customer-support-ai/satisfaction/agents/agent-123/scores?period=month');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.scores).toHaveProperty('averageCSAT');
    });
    
    test('should get satisfaction statistics', async () => {
      const response = await request(app)
        .get('/api/customer-support-ai/satisfaction/statistics');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.statistics).toHaveProperty('totalResponses');
    });
  });
  
  // Workflow Automation Tests
  describe('Workflow Automation', () => {
    test('should create and execute macro', async () => {
      const createResponse = await request(app)
        .post('/api/customer-support-ai/automation/macros')
        .send({
          name: 'Close with satisfaction survey',
          category: 'ticket_resolution',
          actions: [
            { type: 'set_status', value: 'resolved' },
            { type: 'add_reply', value: 'Thank you for contacting us!' }
          ]
        });
      
      expect(createResponse.status).toBe(200);
      expect(createResponse.body.success).toBe(true);
      
      const executeResponse = await request(app)
        .post('/api/customer-support-ai/automation/macros/macro-123/execute')
        .send({
          macroId: 'macro-123',
          ticketId: 'ticket-123'
        });
      
      expect(executeResponse.status).toBe(200);
      expect(executeResponse.body.success).toBe(true);
    });
    
    test('should create and fire trigger', async () => {
      const createResponse = await request(app)
        .post('/api/customer-support-ai/automation/triggers')
        .send({
          name: 'Auto-escalate urgent tickets',
          event: 'ticket_created',
          conditions: [
            { field: 'priority', operator: 'equals', value: 'urgent' }
          ],
          actions: [
            { type: 'assign_agent', value: 'senior-agent-123' }
          ]
        });
      
      expect(createResponse.status).toBe(200);
      expect(createResponse.body.success).toBe(true);
      
      const fireResponse = await request(app)
        .post('/api/customer-support-ai/automation/triggers/fire')
        .send({
          event: 'ticket_created',
          data: { priority: 'urgent' }
        });
      
      expect(fireResponse.status).toBe(200);
      expect(fireResponse.body.success).toBe(true);
    });
    
    test('should send auto-response', async () => {
      const response = await request(app)
        .post('/api/customer-support-ai/automation/auto-responses/auto-123/send')
        .send({
          autoResponseId: 'auto-123',
          ticketId: 'ticket-123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should get workflow executions', async () => {
      const response = await request(app)
        .get('/api/customer-support-ai/automation/executions');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.executions)).toBe(true);
    });
    
    test('should get automation statistics', async () => {
      const response = await request(app)
        .get('/api/customer-support-ai/automation/statistics');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.statistics).toHaveProperty('totalMacros');
    });
  });
  
  // Knowledge Management Tests
  describe('Knowledge Management', () => {
    test('should create article', async () => {
      const response = await request(app)
        .post('/api/customer-support-ai/knowledge/articles')
        .send({
          title: 'How to reset your password',
          summary: 'Step-by-step guide to password reset',
          content: 'Full article content here...',
          categoryId: 'cat-123',
          tags: ['password', 'security', 'account']
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.article).toHaveProperty('id');
    });
    
    test('should search with relevance', async () => {
      const response = await request(app)
        .get('/api/customer-support-ai/knowledge/search?q=password reset');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.results)).toBe(true);
    });
    
    test('should track view', async () => {
      const response = await request(app)
        .post('/api/customer-support-ai/knowledge/articles/article-123/views')
        .send({
          articleId: 'article-123',
          source: 'search'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should submit feedback', async () => {
      const response = await request(app)
        .post('/api/customer-support-ai/knowledge/articles/article-123/feedback')
        .send({
          articleId: 'article-123',
          helpful: true,
          comment: 'Very clear instructions'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should get recommendations', async () => {
      const response = await request(app)
        .get('/api/customer-support-ai/knowledge/articles/recommended?tags=password,security');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.articles)).toBe(true);
    });
    
    test('should get analytics', async () => {
      const response = await request(app)
        .get('/api/customer-support-ai/knowledge/articles/article-123/analytics');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toHaveProperty('totalViews');
    });
  });
  
  // Omnichannel Tests
  describe('Omnichannel', () => {
    test('should configure channel', async () => {
      const response = await request(app)
        .post('/api/customer-support-ai/omnichannel/channels')
        .send({
          type: 'email',
          name: 'Support Email',
          settings: {
            businessHours: { enabled: true },
            autoResponse: true
          }
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.channel).toHaveProperty('id');
    });
    
    test('should send and receive message', async () => {
      const sendResponse = await request(app)
        .post('/api/customer-support-ai/omnichannel/messages/send')
        .send({
          conversationId: 'conv-123',
          sender: 'agent',
          senderId: 'agent-123',
          content: 'How can I help you?',
          contentType: 'text'
        });
      
      expect(sendResponse.status).toBe(200);
      expect(sendResponse.body.success).toBe(true);
      
      const receiveResponse = await request(app)
        .post('/api/customer-support-ai/omnichannel/messages/receive')
        .send({
          channelId: 'channel-123',
          customerId: 'customer-123',
          content: 'I need help with my order',
          contentType: 'text'
        });
      
      expect(receiveResponse.status).toBe(200);
      expect(receiveResponse.body.success).toBe(true);
    });
    
    test('should get unified inbox', async () => {
      const response = await request(app)
        .get('/api/customer-support-ai/omnichannel/inbox');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.conversations)).toBe(true);
    });
    
    test('should use template', async () => {
      const response = await request(app)
        .post('/api/customer-support-ai/omnichannel/templates/template-123/use')
        .send({
          templateId: 'template-123',
          variables: { customerName: 'John', orderId: '12345' }
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toHaveProperty('content');
    });
    
    test('should get channel analytics', async () => {
      const response = await request(app)
        .get('/api/customer-support-ai/omnichannel/channels/channel-123/analytics');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toHaveProperty('averageResponseTime');
    });
    
    test('should get omnichannel statistics', async () => {
      const response = await request(app)
        .get('/api/customer-support-ai/omnichannel/statistics');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.statistics).toHaveProperty('totalConversations');
    });
  });
  
  // AI Insights Tests
  describe('AI Insights', () => {
    test('should analyze intent', async () => {
      const response = await request(app)
        .post('/api/customer-support-ai/ai/intent/analyze')
        .send({
          text: 'I want to cancel my subscription',
          ticketId: 'ticket-123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.analysis).toHaveProperty('intent');
      expect(response.body.analysis).toHaveProperty('confidence');
    });
    
    test('should get agent assist', async () => {
      const response = await request(app)
        .post('/api/customer-support-ai/ai/agent-assist')
        .send({
          ticketId: 'ticket-123',
          customerMessage: 'How do I reset my password?'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.assist).toHaveProperty('suggestedResponses');
    });
    
    test('should predict resolution time', async () => {
      const response = await request(app)
        .post('/api/customer-support-ai/ai/predict/resolution-time')
        .send({
          priority: 'high',
          category: 'technical'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.prediction).toHaveProperty('estimatedMinutes');
    });
    
    test('should detect trends', async () => {
      const response = await request(app)
        .post('/api/customer-support-ai/ai/trends/detect')
        .send({
          metric: 'ticket_volume',
          period: 'week'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.trends).toHaveProperty('direction');
    });
    
    test('should predict churn risk', async () => {
      const response = await request(app)
        .post('/api/customer-support-ai/ai/predict/churn-risk')
        .send({
          customerId: 'customer-123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.prediction).toHaveProperty('riskScore');
      expect(response.body.prediction).toHaveProperty('riskLevel');
    });
    
    test('should get AI insights', async () => {
      const response = await request(app)
        .get('/api/customer-support-ai/ai/insights?type=performance');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.insights)).toBe(true);
    });
  });
  
  // System Tests
  describe('System', () => {
    test('should return health check', async () => {
      const response = await request(app)
        .get('/api/customer-support-ai/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.services).toHaveProperty('operations');
      expect(response.body.services).toHaveProperty('quality');
      expect(response.body.services).toHaveProperty('performance');
    });
    
    test('should return aggregated statistics', async () => {
      const response = await request(app)
        .get('/api/customer-support-ai/statistics');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.statistics).toHaveProperty('operations');
      expect(response.body.statistics).toHaveProperty('quality');
      expect(response.body.statistics).toHaveProperty('performance');
    });
  });
  
  // E2E Support Journey Test
  describe('E2E Support Journey', () => {
    test('should complete full customer support workflow', async () => {
      // 1. Customer submits ticket
      const ticketResponse = await request(app)
        .post('/api/customer-support-ai/operations/tickets')
        .send({
          subject: 'Billing issue',
          description: 'I was charged twice',
          customerId: 'customer-456',
          priority: 'high',
          category: 'billing'
        });
      
      expect(ticketResponse.status).toBe(200);
      const ticketId = ticketResponse.body.ticket.id;
      
      // 2. AI analyzes intent
      const intentResponse = await request(app)
        .post('/api/customer-support-ai/ai/intent/analyze')
        .send({
          text: 'I was charged twice',
          ticketId: ticketId
        });
      
      expect(intentResponse.status).toBe(200);
      expect(intentResponse.body.analysis.intent).toBe('billing');
      
      // 3. Ticket routes to agent
      const routeResponse = await request(app)
        .post(`/api/customer-support-ai/operations/tickets/${ticketId}/route`)
        .send({ ticketId });
      
      expect(routeResponse.status).toBe(200);
      
      // 4. Agent uses macro to respond
      const macroResponse = await request(app)
        .post('/api/customer-support-ai/automation/macros/billing-macro/execute')
        .send({
          macroId: 'billing-macro',
          ticketId: ticketId
        });
      
      expect(macroResponse.status).toBe(200);
      
      // 5. QA review is conducted
      const qaResponse = await request(app)
        .post('/api/customer-support-ai/qa/reviews')
        .send({
          ticketId: ticketId,
          agentId: 'agent-456',
          templateId: 'template-123',
          scores: [{ criteriaId: 'criteria-1', score: 9 }]
        });
      
      expect(qaResponse.status).toBe(200);
      
      // 6. Coaching session scheduled if needed
      const coachingResponse = await request(app)
        .post('/api/customer-support-ai/qa/coaching-sessions')
        .send({
          agentId: 'agent-456',
          type: 'one_on_one',
          topic: 'Billing procedures'
        });
      
      expect(coachingResponse.status).toBe(200);
      
      // 7. Customer receives survey
      const surveyResponse = await request(app)
        .post('/api/customer-support-ai/satisfaction/surveys')
        .send({
          type: 'csat',
          trigger: 'ticket_resolved',
          ticketId: ticketId
        });
      
      expect(surveyResponse.status).toBe(200);
      
      // 8. Customer submits feedback
      const feedbackResponse = await request(app)
        .post('/api/customer-support-ai/satisfaction/responses')
        .send({
          surveyId: surveyResponse.body.survey.id,
          customerId: 'customer-456',
          score: 5,
          comment: 'Quick resolution, very satisfied'
        });
      
      expect(feedbackResponse.status).toBe(200);
      expect(feedbackResponse.body.response.sentiment).toBe('positive');
      
      // 9. Verify statistics updated
      const statsResponse = await request(app)
        .get('/api/customer-support-ai/statistics');
      
      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.success).toBe(true);
    });
  });
});
