/**
 * AI SUPPORT ASSISTANT V2 - COMPREHENSIVE TESTS
 * Tests for all 8 engines and integrated workflows
 */

const request = require('supertest');
const express = require('express');
const aiSupportRouter = require('../routes/ai-support-assistant');

const app = express();
app.use(express.json());
app.use('/api/ai-support-assistant', aiSupportRouter);

describe('AI Support Assistant V2 - Comprehensive Tests', () => {
  
  // ===== CONVERSATION ENGINE TESTS (5) =====
  describe('Conversation Engine', () => {
    let conversationId;

    test('should create a new conversation', async () => {
      const response = await request(app)
        .post('/api/ai-support-assistant/conversations')
        .send({
          userId: 'user_123',
          channel: 'web',
          metadata: { source: 'website' },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe('user_123');
      expect(response.body.channel).toBe('web');
      expect(response.body.status).toBe('active');
      
      conversationId = response.body.id;
    });

    test('should add message to conversation', async () => {
      const response = await request(app)
        .post(`/api/ai-support-assistant/conversations/${conversationId}/messages`)
        .send({
          content: 'Hello, I need help with my order',
          role: 'user',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toContain('order');
      expect(response.body.role).toBe('user');
      expect(response.body).toHaveProperty('sentiment');
    });

    test('should retrieve conversation messages', async () => {
      const response = await request(app)
        .get(`/api/ai-support-assistant/conversations/${conversationId}/messages`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('messages');
      expect(Array.isArray(response.body.messages)).toBe(true);
    });

    test('should update conversation status', async () => {
      const response = await request(app)
        .put(`/api/ai-support-assistant/conversations/${conversationId}/status`)
        .send({ status: 'resolved' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('resolved');
      expect(response.body).toHaveProperty('resolvedAt');
    });

    test('should get conversation statistics', async () => {
      const response = await request(app)
        .get('/api/ai-support-assistant/conversations/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalConversations');
      expect(response.body).toHaveProperty('activeConversations');
      expect(response.body).toHaveProperty('sentimentDistribution');
    });
  });

  // ===== AI MODEL ENGINE TESTS (5) =====
  describe('AI Model Engine', () => {
    test('should generate AI response', async () => {
      const response = await request(app)
        .post('/api/ai-support-assistant/ai/generate')
        .send({
          conversationId: 'conv_123',
          messages: [{ role: 'user', content: 'Where is my order?' }],
          modelId: 'gpt-3.5-turbo',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('tokensUsed');
      expect(response.body).toHaveProperty('latency');
    });

    test('should list available AI models', async () => {
      const response = await request(app)
        .get('/api/ai-support-assistant/ai/models');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('provider');
    });

    test('should detect intent from message', async () => {
      const response = await request(app)
        .post('/api/ai-support-assistant/ai/intent')
        .send({ message: 'Can you help me track my order?' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('confidence');
    });

    test('should improve response', async () => {
      const response = await request(app)
        .post('/api/ai-support-assistant/ai/improve')
        .send({
          response: 'Your order will arrive soon',
          tone: 'professional',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('original');
      expect(response.body).toHaveProperty('improved');
    });

    test('should get model metrics', async () => {
      const response = await request(app)
        .get('/api/ai-support-assistant/ai/metrics');

      expect(response.status).toBe(200);
      expect(typeof response.body).toBe('object');
    });
  });

  // ===== KNOWLEDGE BASE ENGINE TESTS (6) =====
  describe('Knowledge Base Engine', () => {
    let articleId;

    test('should create knowledge article', async () => {
      const response = await request(app)
        .post('/api/ai-support-assistant/knowledge/articles')
        .send({
          title: 'How to Track Your Order',
          content: 'You can track your order using the tracking number provided in your confirmation email...',
          category: 'orders',
          tags: ['tracking', 'shipping', 'orders'],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toContain('Track');
      expect(response.body.status).toBe('published');
      
      articleId = response.body.id;
    });

    test('should search knowledge base articles', async () => {
      const response = await  request(app)
        .post('/api/ai-support-assistant/knowledge/search')
        .send({ query: 'track order' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('relevanceScore');
      }
    });

    test('should retrieve context for RAG', async () => {
      const response = await request(app)
        .post('/api/ai-support-assistant/knowledge/context')
        .send({ query: 'order tracking', limit: 3 });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('relevanceScore');
      }
    });

    test('should get augmented prompt', async () => {
      const response = await request(app)
        .post('/api/ai-support-assistant/knowledge/augment')
        .send({ query: 'How do I return an item?' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('prompt');
      expect(response.body).toHaveProperty('context');
      expect(Array.isArray(response.body.context)).toBe(true);
    });

    test('should submit article feedback', async () => {
      const response = await request(app)
        .post(`/api/ai-support-assistant/knowledge/articles/${articleId}/feedback`)
        .send({ helpful: true, comment: 'Very helpful!' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('helpful');
    });

    test('should get knowledge base statistics', async () => {
      const response = await request(app)
        .get('/api/ai-support-assistant/knowledge/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalArticles');
      expect(response.body).toHaveProperty('publishedArticles');
      expect(response.body).toHaveProperty('totalViews');
    });
  });

  // ===== TICKET MANAGEMENT ENGINE TESTS (6) =====
  describe('Ticket Management Engine', () => {
    let ticketId;

    test('should create support ticket', async () => {
      const response = await request(app)
        .post('/api/ai-support-assistant/tickets')
        .send({
          subject: 'Order not received',
          description: 'I ordered a product 2 weeks ago but have not received it yet',
          userId: 'user_123',
          priority: 'high',
          category: 'shipping',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('ticketNumber');
      expect(response.body.priority).toBe('high');
      expect(response.body.status).toBe('open');
      
      ticketId = response.body.id;
    });

    test('should assign ticket to agent', async () => {
      const response = await request(app)
        .post(`/api/ai-support-assistant/tickets/${ticketId}/assign`)
        .send({ agentId: 'agent_456' });

      expect(response.status).toBe(200);
      expect(response.body.assignedTo).toBe('agent_456');
      expect(response.body.status).toBe('in_progress');
    });

    test('should add comment to ticket', async () => {
      const response = await request(app)
        .post(`/api/ai-support-assistant/tickets/${ticketId}/comments`)
        .send({
          userId: 'agent_456',
          content: 'Looking into your order now',
          internal: false,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toContain('order');
    });

    test('should calculate SLA status', async () => {
      const response = await request(app)
        .post(`/api/ai-support-assistant/tickets/${ticketId}/sla`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('slaStatus');
      expect(['on_track', 'at_risk', 'breached', 'met']).toContain(response.body.slaStatus);
    });

    test('should get SLA breached tickets', async () => {
      const response = await request(app)
        .get('/api/ai-support-assistant/tickets/sla/breached');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should get ticket statistics', async () => {
      const response = await request(app)
        .get('/api/ai-support-assistant/tickets/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalTickets');
      expect(response.body).toHaveProperty('openTickets');
      expect(response.body).toHaveProperty('avgResolutionTimeHours');
      expect(response.body).toHaveProperty('byPriority');
    });
  });

  // ===== AUTOMATION ENGINE TESTS (5) =====
  describe('Automation Engine', () => {
    let automationId;

    test('should create automation workflow', async () => {
      const response = await request(app)
        .post('/api/ai-support-assistant/automations')
        .send({
          name: 'Auto-assign urgent tickets',
          description: 'Automatically assign urgent tickets to senior agents',
          trigger: 'ticket_created',
          conditions: [{ field: 'priority', operator: 'equals', value: 'urgent' }],
          actions: [{ type: 'assign_agent', params: { agentType: 'senior' } }],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.trigger).toBe('ticket_created');
      expect(response.body.enabled).toBe(true);
      
      automationId = response.body.id;
    });

    test('should execute automation', async () => {
      const response = await request(app)
        .post(`/api/ai-support-assistant/automations/${automationId}/execute`)
        .send({
          context: {
            priority: 'urgent',
            subject: 'Critical issue',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('results');
    });

    test('should create routing rule', async () => {
      const response = await request(app)
        .post('/api/ai-support-assistant/routing/rules')
        .send({
          name: 'Route technical issues',
          conditions: [{ field: 'category', operator: 'equals', value: 'technical' }],
          destination: 'technical_team',
          priority: 10,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.destination).toBe('technical_team');
    });

    test('should auto-tag conversation', async () => {
      const response = await request(app)
        .post('/api/ai-support-assistant/automations/auto-tag')
        .send({
          lastMessage: 'I need to return my order',
          sentiment: 'negative',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tags');
      expect(Array.isArray(response.body.tags)).toBe(true);
    });

    test('should get automation statistics', async () => {
      const response = await request(app)
        .get('/api/ai-support-assistant/automations/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalAutomations');
      expect(response.body).toHaveProperty('enabledAutomations');
      expect(response.body).toHaveProperty('totalRuns');
    });
  });

  // ===== ANALYTICS ENGINE TESTS (5) =====
  describe('Analytics Engine', () => {
    test('should track analytics event', async () => {
      const response = await request(app)
        .post('/api/ai-support-assistant/analytics/events')
        .send({
          type: 'conversation_created',
          entityId: 'conv_123',
          entityType: 'conversation',
          userId: 'user_123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe('conversation_created');
    });

    test('should get conversation analytics', async () => {
      const response = await request(app)
        .get('/api/ai-support-assistant/analytics/conversations');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalConversations');
      expect(response.body).toHaveProperty('resolutionRate');
      expect(response.body).toHaveProperty('sentimentDistribution');
    });

    test('should get ticket analytics', async () => {
      const response = await request(app)
        .get('/api/ai-support-assistant/analytics/tickets');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalTickets');
      expect(response.body).toHaveProperty('slaCompliance');
      expect(response.body).toHaveProperty('ticketsByPriority');
    });

    test('should get real-time metrics', async () => {
      const response = await request(app)
        .get('/api/ai-support-assistant/analytics/realtime');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('activeConversations');
      expect(response.body).toHaveProperty('waitingTickets');
      expect(response.body).toHaveProperty('onlineAgents');
    });

    test('should generate insights', async () => {
      const response = await request(app)
        .post('/api/ai-support-assistant/analytics/insights')
        .send({});

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // ===== AGENT ASSIST ENGINE TESTS (5) =====
  describe('Agent Assist Engine', () => {
    let sessionId;
    let snippetId;

    test('should start agent session', async () => {
      const response = await request(app)
        .post('/api/ai-support-assistant/agents/sessions')
        .send({ agentId: 'agent_123' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.agentId).toBe('agent_123');
      
      sessionId = response.body.id;
    });

    test('should get draft response', async () => {
      const response = await request(app)
        .post('/api/ai-support-assistant/agents/draft')
        .send({
          conversationId: 'conv_123',
          messages: [{ role: 'user', content: 'Where is my order?' }],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('draft');
      expect(response.body).toHaveProperty('confidence');
    });

    test('should create snippet', async () => {
      const response = await request(app)
        .post('/api/ai-support-assistant/agents/snippets')
        .send({
          name: 'Greeting',
          shortcut: '/hello',
          content: 'Hello! How can I help you today?',
          category: 'greetings',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.shortcut).toBe('/hello');
      
      snippetId = response.body.id;
    });

    test('should get customer context', async () => {
      const response = await request(app)
        .get('/api/ai-support-assistant/agents/customers/user_123/context');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('totalPurchases');
      expect(response.body).toHaveProperty('satisfactionHistory');
    });

    test('should analyze agent response', async () => {
      const response = await request(app)
        .post('/api/ai-support-assistant/agents/analyze')
        .send({ response: 'I can help you with that issue' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sentiment');
      expect(response.body).toHaveProperty('tone');
      expect(response.body).toHaveProperty('suggestions');
    });
  });

  // ===== INTEGRATION ENGINE TESTS (5) =====
  describe('Integration Engine', () => {
    let integrationId = 'shopify';

    test('should list integrations', async () => {
      const response = await request(app)
        .get('/api/ai-support-assistant/integrations');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('should test integration connection', async () => {
      const response = await request(app)
        .post(`/api/ai-support-assistant/integrations/${integrationId}/test`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('message');
    });

    test('should register webhook', async () => {
      const response = await request(app)
        .post('/api/ai-support-assistant/integrations/webhooks')
        .send({
          url: 'https://example.com/webhook',
          events: ['conversation_created', 'ticket_created'],
          secret: 'webhook_secret_123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.events).toContain('conversation_created');
    });

    test('should sync order data', async () => {
      const response = await request(app)
        .post(`/api/ai-support-assistant/integrations/${integrationId}/sync/order`)
        .send({ orderId: 'order_456' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('orderNumber');
      expect(response.body).toHaveProperty('trackingNumber');
    });

    test('should get integration statistics', async () => {
      const response = await request(app)
        .get('/api/ai-support-assistant/integrations/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalIntegrations');
      expect(response.body).toHaveProperty('connectedIntegrations');
      expect(response.body).toHaveProperty('integrationsByType');
    });
  });

  // ===== SYSTEM TESTS (2) =====
  describe('System Health & Statistics', () => {
    test('should return system health status', async () => {
      const response = await request(app)
        .get('/api/ai-support-assistant/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services.conversation).toBe('operational');
    });

    test('should return system statistics', async () => {
      const response = await request(app)
        .get('/api/ai-support-assistant/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('conversations');
      expect(response.body).toHaveProperty('knowledgeBase');
      expect(response.body).toHaveProperty('tickets');
    });
  });

  // ===== INTEGRATION TEST - COMPLETE SUPPORT FLOW (1) =====
  describe('End-to-End Support Flow', () => {
    test('should complete full support workflow', async () => {
      // 1. Create conversation
      const convResponse = await request(app)
        .post('/api/ai-support-assistant/conversations')
        .send({ userId: 'user_e2e', channel: 'web' });
      
      expect(convResponse.status).toBe(201);
      const conversationId = convResponse.body.id;

      // 2. Add user message
      const msgResponse = await request(app)
        .post(`/api/ai-support-assistant/conversations/${conversationId}/messages`)
        .send({ content: 'I have an issue with my order', role: 'user' });
      
      expect(msgResponse.status).toBe(201);

      // 3. Generate AI response
      const aiResponse = await request(app)
        .post('/api/ai-support-assistant/ai/generate')
        .send({
          conversationId,
          messages: [{ role: 'user', content: 'I have an issue with my order' }],
        });
      
      expect(aiResponse.status).toBe(200);
      expect(aiResponse.body).toHaveProperty('content');

      // 4. Search knowledge base
      const kbResponse = await request(app)
        .post('/api/ai-support-assistant/knowledge/search')
        .send({ query: 'order issue' });
      
      expect(kbResponse.status).toBe(200);

      // 5. Create ticket if needed
      const ticketResponse = await request(app)
        .post('/api/ai-support-assistant/tickets')
        .send({
          subject: 'Order issue',
          description: 'Customer needs help with order',
          userId: 'user_e2e',
          conversationId,
          priority: 'normal',
        });
      
      expect(ticketResponse.status).toBe(201);
      const ticketId = ticketResponse.body.id;

      // 6. Auto-assign ticket
      const assignResponse = await request(app)
        .post(`/api/ai-support-assistant/tickets/${ticketId}/auto-assign`);
      
      expect(assignResponse.status).toBe(200);
      expect(assignResponse.body.assignedTo).toBeTruthy();

      // 7. Track analytics event
      const analyticsResponse = await request(app)
        .post('/api/ai-support-assistant/analytics/events')
        .send({
          type: 'ticket_created',
          entityId: ticketId,
          entityType: 'ticket',
          userId: 'user_e2e',
        });
      
      expect(analyticsResponse.status).toBe(201);

      // 8. Resolve conversation
      const resolveResponse = await request(app)
        .put(`/api/ai-support-assistant/conversations/${conversationId}/status`)
        .send({ status: 'resolved' });
      
      expect(resolveResponse.status).toBe(200);
      expect(resolveResponse.body.status).toBe('resolved');
    });
  });
});
