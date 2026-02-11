// ================================================================
// EMAIL AUTOMATION BUILDER - COMPREHENSIVE TEST SUITE
// ================================================================
// Coverage Target: 95%+
// Test Count: 100+ test cases
// Line Target: ~2,000 lines
// ================================================================

const request = require('supertest');
const express = require('express');
const emailAutomationRouter = require('../routes/email-automation');

// Mock dependencies
jest.mock('../core/openaiClient');
jest.mock('../core/anthropicChat');
jest.mock('../core/db');
jest.mock('../core/auditLog');

const { getOpenAIClient } = require('../core/openaiClient');
const { getDb } = require('../core/db');
const { logAudit } = require('../core/auditLog');
const anthropicChat = require('../core/anthropicChat');

// Test app setup
let app;
let mockDb;
let mockOpenAI;
let mockAnthropic;

beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/email-automation', emailAutomationRouter);
});

beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();
  
  // Mock database
  mockDb = {
    collection: jest.fn((name) => ({
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis()
      }),
      findOne: jest.fn().mockResolvedValue(null),
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'test-id' }),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      countDocuments: jest.fn().mockResolvedValue(0)
    }))
  };
  getDb.mockReturnValue(mockDb);
  
  // Mock OpenAI
  mockOpenAI = {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'AI generated content' } }]
        })
      }
    }
  };
  getOpenAIClient.mockReturnValue(mockOpenAI);
  
  // Mock Anthropic
  mockAnthropic.mockResolvedValue({
    content: [{ text: 'Claude generated content' }]
  });
  
  // Mock audit log
  logAudit.mockResolvedValue(true);
});

// ================================================================
// CATEGORY 1: CAMPAIGN MANAGEMENT (28 endpoints)
// ================================================================

describe('Campaign Management', () => {
  describe('GET /campaigns', () => {
    it('should return empty array when no campaigns exist', async () => {
      const res = await request(app)
        .get('/api/email-automation/campaigns')
        .expect(200);
      
      expect(res.body.ok).toBe(true);
      expect(res.body.campaigns).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('should return campaigns with pagination', async () => {
      const mockCampaigns = [
        { id: '1', name: 'Campaign 1', status: 'draft' },
        { id: '2', name: 'Campaign 2', status: 'sent' }
      ];
      
      mockDb.collection().find().toArray.mockResolvedValue(mockCampaigns);
      mockDb.collection().countDocuments.mockResolvedValue(2);
      
      const res = await request(app)
        .get('/api/email-automation/campaigns?page=1&limit=10')
        .expect(200);
      
      expect(res.body.campaigns).toHaveLength(2);
      expect(res.body.total).toBe(2);
      expect(res.body.page).toBe(1);
    });

    it('should filter campaigns by status', async () => {
      const res = await request(app)
        .get('/api/email-automation/campaigns?status=draft')
        .expect(200);
      
      expect(mockDb.collection().find).toHaveBeenCalledWith({ status: 'draft' });
    });

    it('should search campaigns by name', async () => {
      const res = await request(app)
        .get('/api/email-automation/campaigns?search=promo')
        .expect(200);
      
      expect(mockDb.collection().find).toHaveBeenCalledWith({
        name: { $regex: 'promo', $options: 'i' }
      });
    });
  });

  describe('POST /campaigns', () => {
    it('should create a new campaign', async () => {
      const campaignData = {
        name: 'Test Campaign',
        subject: 'Test Subject',
        fromName: 'Test Sender',
        fromEmail: 'sender@test.com',
        body: '<p>Test body</p>',
        type: 'regular'
      };
      
      const res = await request(app)
        .post('/api/email-automation/campaigns')
        .send(campaignData)
        .expect(201);
      
      expect(res.body.ok).toBe(true);
      expect(res.body.campaign).toMatchObject({
        name: campaignData.name,
        subject: campaignData.subject,
        status: 'draft'
      });
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'campaign_created' })
      );
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/email-automation/campaigns')
        .send({ name: 'No subject' })
        .expect(400);
      
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toContain('required');
    });

    it('should validate email format', async () => {
      const res = await request(app)
        .post('/api/email-automation/campaigns')
        .send({
          name: 'Test',
          subject: 'Test',
          fromEmail: 'invalid-email',
          fromName: 'Test',
          body: 'Test'
        })
        .expect(400);
      
      expect(res.body.error).toContain('email');
    });
  });

  describe('GET /campaigns/:id', () => {
    it('should return campaign by ID', async () => {
      const mockCampaign = {
        id: 'test-123',
        name: 'Test Campaign',
        status: 'draft'
      };
      
      mockDb.collection().findOne.mockResolvedValue(mockCampaign);
      
      const res = await request(app)
        .get('/api/email-automation/campaigns/test-123')
        .expect(200);
      
      expect(res.body.campaign).toMatchObject(mockCampaign);
    });

    it('should return 404 for non-existent campaign', async () => {
      const res = await request(app)
        .get('/api/email-automation/campaigns/nonexistent')
        .expect(404);
      
      expect(res.body.error).toContain('not found');
    });
  });

  describe('PUT /campaigns/:id', () => {
    it('should update campaign', async () => {
      mockDb.collection().findOne.mockResolvedValue({ id: 'test-123', name: 'Old Name' });
      
      const res = await request(app)
        .put('/api/email-automation/campaigns/test-123')
        .send({ name: 'New Name', subject: 'Updated Subject' })
        .expect(200);
      
      expect(res.body.ok).toBe(true);
      expect(mockDb.collection().updateOne).toHaveBeenCalled();
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'campaign_updated' })
      );
    });

    it('should not allow status changes from sent to draft', async () => {
      mockDb.collection().findOne.mockResolvedValue({ id: 'test-123', status: 'sent' });
      
      const res = await request(app)
        .put('/api/email-automation/campaigns/test-123')
        .send({ status: 'draft' })
        .expect(400);
      
      expect(res.body.error).toContain('cannot change');
    });
  });

  describe('DELETE /campaigns/:id', () => {
    it('should delete draft campaign', async () => {
      mockDb.collection().findOne.mockResolvedValue({ id: 'test-123', status: 'draft' });
      
      const res = await request(app)
        .delete('/api/email-automation/campaigns/test-123')
        .expect(200);
      
      expect(res.body.ok).toBe(true);
      expect(mockDb.collection().deleteOne).toHaveBeenCalled();
    });

    it('should not delete sent campaign', async () => {
      mockDb.collection().findOne.mockResolvedValue({ id: 'test-123', status: 'sent' });
      
      const res = await request(app)
        .delete('/api/email-automation/campaigns/test-123')
        .expect(400);
      
      expect(res.body.error).toContain('cannot delete');
    });
  });

  describe('POST /campaigns/:id/schedule', () => {
    it('should schedule campaign for future send', async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();
      mockDb.collection().findOne.mockResolvedValue({ id: 'test-123', status: 'draft' });
      
      const res = await request(app)
        .post('/api/email-automation/campaigns/test-123/schedule')
        .send({ scheduledAt: futureDate })
        .expect(200);
      
      expect(res.body.ok).toBe(true);
      expect(res.body.campaign.status).toBe('scheduled');
    });

    it('should not schedule for past date', async () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString();
      mockDb.collection().findOne.mockResolvedValue({ id: 'test-123', status: 'draft' });
      
      const res = await request(app)
        .post('/api/email-automation/campaigns/test-123/schedule')
        .send({ scheduledAt: pastDate })
        .expect(400);
      
      expect(res.body.error).toContain('future');
    });
  });

  describe('POST /campaigns/:id/send', () => {
    it('should send campaign immediately', async () => {
      mockDb.collection().findOne.mockResolvedValue({
        id: 'test-123',
        status: 'draft',
        name: 'Test',
        subject: 'Test Subject',
        fromEmail: 'sender@test.com',
        body: 'Test body'
      });
      
      const res = await request(app)
        .post('/api/email-automation/campaigns/test-123/send')
        .expect(200);
      
      expect(res.body.ok).toBe(true);
      expect(res.body.campaign.status).toBe('sent');
    });
  });

  describe('POST /campaigns/:id/test', () => {
    it('should send test email', async () => {
      mockDb.collection().findOne.mockResolvedValue({
        id: 'test-123',
        name: 'Test',
        subject: 'Test',
        fromEmail: 'sender@test.com',
        body: 'Test'
      });
      
      const res = await request(app)
        .post('/api/email-automation/campaigns/test-123/test')
        .send({ emails: ['test@example.com'] })
        .expect(200);
      
      expect(res.body.ok).toBe(true);
      expect(res.body.sent).toBe(1);
    });

    it('should validate test email addresses', async () => {
      mockDb.collection().findOne.mockResolvedValue({ id: 'test-123' });
      
      const res = await request(app)
        .post('/api/email-automation/campaigns/test-123/test')
        .send({ emails: ['invalid'] })
        .expect(400);
      
      expect(res.body.error).toContain('valid email');
    });
  });

  describe('POST /campaigns/bulk', () => {
    it('should bulk update campaigns', async () => {
      const res = await request(app)
        .post('/api/email-automation/campaigns/bulk')
        .send({
          action: 'archive',
          ids: ['id1', 'id2', 'id3']
        })
        .expect(200);
      
      expect(res.body.ok).toBe(true);
      expect(res.body.updated).toBe(3);
    });

    it('should validate bulk action', async () => {
      const res = await request(app)
        .post('/api/email-automation/campaigns/bulk')
        .send({
          action: 'invalid-action',
          ids: ['id1']
        })
        .expect(400);
      
      expect(res.body.error).toContain('Invalid action');
    });
  });
});

// ================================================================
// CATEGORY 2: AI CONTENT GENERATION (32 endpoints)
// ================================================================

describe('AI Content Generation', () => {
  describe('POST /ai/subject-lines/generate', () => {
    it('should generate subject lines using GPT-4', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify([
              { subject: 'Amazing Deal!', score: 0.85, predictedOpenRate: 0.28 },
              { subject: 'Limited Time Offer', score: 0.82, predictedOpenRate: 0.25 }
            ])
          }
        }]
      });
      
      const res = await request(app)
        .post('/api/email-automation/ai/subject-lines/generate')
        .send({
          campaignGoal: 'Promote summer sale',
          count: 2
        })
        .expect(200);
      
      expect(res.body.ok).toBe(true);
      expect(res.body.suggestions).toHaveLength(2);
      expect(res.body.suggestions[0]).toHaveProperty('subject');
      expect(res.body.suggestions[0]).toHaveProperty('score');
      expect(res.body.suggestions[0]).toHaveProperty('predictedOpenRate');
    });

    it('should allow model selection', async () => {
      const res = await request(app)
        .post('/api/email-automation/ai/subject-lines/generate')
        .send({
          campaignGoal: 'Test',
          model: 'claude-3-opus',
          count: 3
        })
        .expect(200);
      
      expect(anthropicChat).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ model: 'claude-3-opus' })
      );
    });

    it('should calculate spam scores for suggestions', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify([
              { subject: 'FREE MONEY!!!', score: 0.3, predictedOpenRate: 0.1, spamScore: 85 }
            ])
          }
        }]
      });
      
      const res = await request(app)
        .post('/api/email-automation/ai/subject-lines/generate')
        .send({ campaignGoal: 'Test', count: 1 })
        .expect(200);
      
      expect(res.body.suggestions[0].spamScore).toBeGreaterThan(50);
    });
  });

  describe('POST /ai/content/generate', () => {
    it('should generate email body content', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: '<p>Generated email content with personalization</p>'
          }
        }]
      });
      
      const res = await request(app)
        .post('/api/email-automation/ai/content/generate')
        .send({
          prompt: 'Create welcome email for new customers',
          tone: 'friendly',
          length: 'medium'
        })
        .expect(200);
      
      expect(res.body.ok).toBe(true);
      expect(res.body.content).toContain('<p>');
      expect(res.body.contentScore).toBeGreaterThan(0);
    });

    it('should support different content tones', async () => {
      const tones = ['professional', 'friendly', 'urgent', 'casual'];
      
      for (const tone of tones) {
        const res = await request(app)
          .post('/api/email-automation/ai/content/generate')
          .send({ prompt: 'Test', tone })
          .expect(200);
        
        expect(res.body.ok).toBe(true);
      }
    });
  });

  describe('POST /ai/spam-score', () => {
    it('should calculate spam score for email', async () => {
      const res = await request(app)
        .post('/api/email-automation/ai/spam-score')
        .send({
          subject: 'Special Offer',
          body: 'Get 20% off your next purchase'
        })
        .expect(200);
      
      expect(res.body.spamScore).toBeGreaterThanOrEqual(0);
      expect(res.body.spamScore).toBeLessThanOrEqual(100);
      expect(res.body.factors).toBeInstanceOf(Array);
    });

    it('should flag high spam content', async () => {
      const res = await request(app)
        .post('/api/email-automation/ai/spam-score')
        .send({
          subject: 'FREE MONEY CLICK NOW!!!',
          body: 'Act now! Limited time! FREE! WIN!'
        })
        .expect(200);
      
      expect(res.body.spamScore).toBeGreaterThan(70);
      expect(res.body.recommendation).toContain('reduce');
    });
  });

  describe('POST /ai/personalize', () => {
    it('should personalize email content', async () => {
      const res = await request(app)
        .post('/api/email-automation/ai/personalize')
        .send({
          content: 'Hello {{firstName}}, check out {{productName}}',
          contactData: { firstName: 'John', productName: 'Widget' }
        })
        .expect(200);
      
      expect(res.body.personalizedContent).toContain('John');
      expect(res.body.personalizedContent).toContain('Widget');
    });
  });

  describe('POST /ai/models/routing', () => {
    it('should route to best model using best-of-n strategy', async () => {
      const res = await request(app)
        .post('/api/email-automation/ai/models/routing')
        .send({
          strategy: 'best-of-n',
          models: ['gpt-4', 'claude-3-opus', 'gemini-pro'],
          prompt: 'Generate subject line',
          n: 3
        })
        .expect(200);
      
      expect(res.body.ok).toBe(true);
      expect(res.body.bestResult).toBeDefined();
      expect(res.body.allResults).toHaveLength(3);
    });

    it('should use ensemble strategy', async () => {
      const res = await request(app)
        .post('/api/email-automation/ai/models/routing')
        .send({
          strategy: 'ensemble',
          models: ['gpt-4', 'claude-3-opus'],
          prompt: 'Test prompt'
        })
        .expect(200);
      
      expect(res.body.ensembleResult).toBeDefined();
    });
  });

  describe('POST /ai/feedback', () => {
    it('should collect RLHF feedback', async () => {
      const res = await request(app)
        .post('/api/email-automation/ai/feedback')
        .send({
          generationId: 'gen-123',
          rating: 5,
          feedback: 'Excellent suggestion',
          used: true
        })
        .expect(200);
      
      expect(res.body.ok).toBe(true);
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ai_feedback_collected' })
      );
    });
  });
});

// ================================================================
// CATEGORY 3: AUDIENCE & SEGMENTATION (26 endpoints)
// ================================================================

describe('Audience & Segmentation', () => {
  describe('GET /contacts', () => {
    it('should return contacts with pagination', async () => {
      const mockContacts = [
        { email: 'user1@test.com', firstName: 'John', status: 'subscribed' },
        { email: 'user2@test.com', firstName: 'Jane', status: 'subscribed' }
      ];
      
      mockDb.collection().find().toArray.mockResolvedValue(mockContacts);
      mockDb.collection().countDocuments.mockResolvedValue(2);
      
      const res = await request(app)
        .get('/api/email-automation/contacts')
        .expect(200);
      
      expect(res.body.contacts).toHaveLength(2);
    });

    it('should filter contacts by status', async () => {
      const res = await request(app)
        .get('/api/email-automation/contacts?status=subscribed')
        .expect(200);
      
      expect(mockDb.collection().find).toHaveBeenCalledWith({ status: 'subscribed' });
    });
  });

  describe('POST /contacts', () => {
    it('should create new contact', async () => {
      const contactData = {
        email: 'newuser@test.com',
        firstName: 'New',
        lastName: 'User',
        customFields: { company: 'Acme Corp' }
      };
      
      const res = await request(app)
        .post('/api/email-automation/contacts')
        .send(contactData)
        .expect(201);
      
      expect(res.body.ok).toBe(true);
      expect(res.body.contact.email).toBe(contactData.email);
      expect(res.body.contact.status).toBe('subscribed');
    });

    it('should prevent duplicate email addresses', async () => {
      mockDb.collection().findOne.mockResolvedValue({ email: 'existing@test.com' });
      
      const res = await request(app)
        .post('/api/email-automation/contacts')
        .send({ email: 'existing@test.com', firstName: 'Test' })
        .expect(400);
      
      expect(res.body.error).toContain('already exists');
    });
  });

  describe('POST /contacts/bulk-import', () => {
    it('should import contacts from CSV data', async () => {
      const csvData = [
        { email: 'user1@test.com', firstName: 'John', lastName: 'Doe' },
        { email: 'user2@test.com', firstName: 'Jane', lastName: 'Smith' }
      ];
      
      const res = await request(app)
        .post('/api/email-automation/contacts/bulk-import')
        .send({ contacts: csvData })
        .expect(200);
      
      expect(res.body.ok).toBe(true);
      expect(res.body.imported).toBe(2);
      expect(res.body.failed).toBe(0);
    });

    it('should skip invalid emails during import', async () => {
      const csvData = [
        { email: 'valid@test.com', firstName: 'Valid' },
        { email: 'invalid-email', firstName: 'Invalid' }
      ];
      
      const res = await request(app)
        .post('/api/email-automation/contacts/bulk-import')
        .send({ contacts: csvData })
        .expect(200);
      
      expect(res.body.imported).toBe(1);
      expect(res.body.failed).toBe(1);
      expect(res.body.errors).toHaveLength(1);
    });
  });

  describe('GET /segments', () => {
    it('should return all segments', async () => {
      const mockSegments = [
        { id: 'seg-1', name: 'Active Users', type: 'behavioral' },
        { id: 'seg-2', name: 'High Value', type: 'predictive' }
      ];
      
      mockDb.collection().find().toArray.mockResolvedValue(mockSegments);
      
      const res = await request(app)
        .get('/api/email-automation/segments')
        .expect(200);
      
      expect(res.body.segments).toHaveLength(2);
    });
  });

  describe('POST /segments', () => {
    it('should create static segment', async () => {
      const res = await request(app)
        .post('/api/email-automation/segments')
        .send({
          name: 'VIP Customers',
          type: 'static',
          contactIds: ['contact-1', 'contact-2']
        })
        .expect(201);
      
      expect(res.body.ok).toBe(true);
      expect(res.body.segment.type).toBe('static');
    });

    it('should create dynamic segment with conditions', async () => {
      const res = await request(app)
        .post('/api/email-automation/segments')
        .send({
          name: 'Recent Buyers',
          type: 'dynamic',
          conditions: [
            { field: 'lastPurchaseDate', operator: 'within', value: '30d' }
          ]
        })
        .expect(201);
      
      expect(res.body.segment.type).toBe('dynamic');
      expect(res.body.segment.conditions).toHaveLength(1);
    });

    it('should create behavioral segment', async () => {
      const res = await request(app)
        .post('/api/email-automation/segments')
        .send({
          name: 'Engaged Users',
          type: 'behavioral',
          events: [
            { event: 'email_opened', count: 3, period: '7d' }
          ]
        })
        .expect(201);
      
      expect(res.body.segment.type).toBe('behavioral');
    });
  });

  describe('GET /segments/:id/contacts', () => {
    it('should return contacts in segment', async () => {
      mockDb.collection().findOne.mockResolvedValue({
        id: 'seg-1',
        type: 'static',
        contactIds: ['c1', 'c2']
      });
      
      mockDb.collection().find().toArray.mockResolvedValue([
        { id: 'c1', email: 'user1@test.com' },
        { id: 'c2', email: 'user2@test.com' }
      ]);
      
      const res = await request(app)
        .get('/api/email-automation/segments/seg-1/contacts')
        .expect(200);
      
      expect(res.body.contacts).toHaveLength(2);
    });
  });

  describe('POST /segments/predictive', () => {
    it('should create churn prediction segment', async () => {
      const res = await request(app)
        .post('/api/email-automation/segments/predictive')
        .send({
          name: 'Churn Risk',
          predictionType: 'churn',
          threshold: 0.7
        })
        .expect(201);
      
      expect(res.body.segment.predictionType).toBe('churn');
    });

    it('should create LTV prediction segment', async () => {
      const res = await request(app)
        .post('/api/email-automation/segments/predictive')
        .send({
          name: 'High LTV',
          predictionType: 'ltv',
          threshold: 500
        })
        .expect(201);
      
      expect(res.body.segment.predictionType).toBe('ltv');
    });
  });
});

// ================================================================
// CATEGORY 4: MULTI-CHANNEL ORCHESTRATION (24 endpoints)
// ================================================================

describe('Multi-Channel Orchestration', () => {
  describe('POST /send/email', () => {
    it('should send email via default ESP', async () => {
      const res = await request(app)
        .post('/api/email-automation/send/email')
        .send({
          to: 'user@test.com',
          subject: 'Test Email',
          body: '<p>Test content</p>',
          fromEmail: 'sender@test.com'
        })
        .expect(200);
      
      expect(res.body.ok).toBe(true);
      expect(res.body.messageId).toBeDefined();
      expect(res.body.provider).toBe('sendgrid');
    });

    it('should failover to backup ESP on error', async () => {
      // Mock SendGrid failure, SES success
      const res = await request(app)
        .post('/api/email-automation/send/email')
        .send({
          to: 'user@test.com',
          subject: 'Test',
          body: 'Test',
          fromEmail: 'sender@test.com',
          primaryProvider: 'sendgrid-fail'
        })
        .expect(200);
      
      expect(res.body.provider).not.toBe('sendgrid');
    });
  });

  describe('POST /send/sms', () => {
    it('should send SMS via Twilio', async () => {
      const res = await request(app)
        .post('/api/email-automation/send/sms')
        .send({
          to: '+1234567890',
          message: 'Test SMS',
          provider: 'twilio'
        })
        .expect(200);
      
      expect(res.body.ok).toBe(true);
      expect(res.body.sid).toBeDefined();
    });

    it('should validate phone number format', async () => {
      const res = await request(app)
        .post('/api/email-automation/send/sms')
        .send({
          to: 'invalid-phone',
          message: 'Test'
        })
        .expect(400);
      
      expect(res.body.error).toContain('phone number');
    });
  });

  describe('POST /journeys', () => {
    it('should create cross-channel journey', async () => {
      const res = await request(app)
        .post('/api/email-automation/journeys')
        .send({
          name: 'Onboarding Journey',
          channels: ['email', 'sms', 'push'],
          steps: [
            { channel: 'email', delay: 0, template: 'welcome-email' },
            { channel: 'sms', delay: 86400, template: 'day-1-sms' }
          ]
        })
        .expect(201);
      
      expect(res.body.journey.channels).toContain('email');
      expect(res.body.journey.channels).toContain('sms');
    });
  });

  describe('GET /esp/health', () => {
    it('should return health status of all ESPs', async () => {
      const res = await request(app)
        .get('/api/email-automation/esp/health')
        .expect(200);
      
      expect(res.body.providers).toBeInstanceOf(Array);
      expect(res.body.providers.length).toBeGreaterThan(0);
    });
  });
});

// ================================================================
// CATEGORY 5: AUTOMATION WORKFLOWS (28 endpoints)
// ================================================================

describe('Automation Workflows', () => {
  describe('GET /workflows', () => {
    it('should return all workflows', async () => {
      const mockWorkflows = [
        { id: 'wf-1', name: 'Welcome Series', status: 'active' },
        { id: 'wf-2', name: 'Abandoned Cart', status: 'paused' }
      ];
      
      mockDb.collection().find().toArray.mockResolvedValue(mockWorkflows);
      
      const res = await request(app)
        .get('/api/email-automation/workflows')
        .expect(200);
      
      expect(res.body.workflows).toHaveLength(2);
    });
  });

  describe('POST /workflows', () => {
    it('should create new workflow', async () => {
      const workflowData = {
        name: 'Welcome Series',
        trigger: { type: 'contact_created' },
        actions: [
          { type: 'send_email', delay: 0, templateId: 'welcome' },
          { type: 'wait', duration: 86400 },
          { type: 'send_email', delay: 0, templateId: 'day-1' }
        ]
      };
      
      const res = await request(app)
        .post('/api/email-automation/workflows')
        .send(workflowData)
        .expect(201);
      
      expect(res.body.workflow.name).toBe(workflowData.name);
      expect(res.body.workflow.status).toBe('draft');
    });

    it('should validate workflow structure', async () => {
      const res = await request(app)
        .post('/api/email-automation/workflows')
        .send({
          name: 'Invalid Workflow',
          trigger: { type: 'unknown_trigger' }
        })
        .expect(400);
      
      expect(res.body.error).toContain('invalid trigger');
    });
  });

  describe('POST /workflows/:id/activate', () => {
    it('should activate workflow', async () => {
      mockDb.collection().findOne.mockResolvedValue({
        id: 'wf-1',
        name: 'Test',
        status: 'draft',
        trigger: { type: 'contact_created' },
        actions: [{ type: 'send_email', templateId: 't1' }]
      });
      
      const res = await request(app)
        .post('/api/email-automation/workflows/wf-1/activate')
        .expect(200);
      
      expect(res.body.workflow.status).toBe('active');
    });

    it('should not activate incomplete workflow', async () => {
      mockDb.collection().findOne.mockResolvedValue({
        id: 'wf-1',
        name: 'Incomplete',
        status: 'draft',
        trigger: null
      });
      
      const res = await request(app)
        .post('/api/email-automation/workflows/wf-1/activate')
        .expect(400);
      
      expect(res.body.error).toContain('missing trigger');
    });
  });

  describe('GET /workflows/triggers/available', () => {
    it('should return available triggers', async () => {
      const res = await request(app)
        .get('/api/email-automation/workflows/triggers/available')
        .expect(200);
      
      expect(res.body.triggers).toBeInstanceOf(Array);
      expect(res.body.triggers.length).toBeGreaterThan(0);
      expect(res.body.triggers[0]).toHaveProperty('type');
      expect(res.body.triggers[0]).toHaveProperty('name');
    });
  });

  describe('GET /workflows/actions/available', () => {
    it('should return available actions', async () => {
      const res = await request(app)
        .get('/api/email-automation/workflows/actions/available')
        .expect(200);
      
      expect(res.body.actions).toBeInstanceOf(Array);
      expect(res.body.actions).toContainEqual(
        expect.objectContaining({ type: 'send_email' })
      );
    });
  });

  describe('POST /workflows/:id/execute', () => {
    it('should execute workflow for contact', async () => {
      mockDb.collection().findOne.mockResolvedValue({
        id: 'wf-1',
        status: 'active',
        trigger: { type: 'manual' },
        actions: [{ type: 'send_email', templateId: 't1' }]
      });
      
      const res = await request(app)
        .post('/api/email-automation/workflows/wf-1/execute')
        .send({ contactId: 'contact-123' })
        .expect(200);
      
      expect(res.body.ok).toBe(true);
      expect(res.body.executionId).toBeDefined();
    });
  });

  describe('GET /workflows/:id/executions', () => {
    it('should return workflow execution history', async () => {
      const mockExecutions = [
        { id: 'ex-1', contactId: 'c1', status: 'completed', startedAt: new Date() },
        { id: 'ex-2', contactId: 'c2', status: 'running', startedAt: new Date() }
      ];
      
      mockDb.collection().find().toArray.mockResolvedValue(mockExecutions);
      
      const res = await request(app)
        .get('/api/email-automation/workflows/wf-1/executions')
        .expect(200);
      
      expect(res.body.executions).toHaveLength(2);
    });
  });
});

// ================================================================
// CATEGORY 6: ANALYTICS & PERFORMANCE (30 endpoints)
// ================================================================

describe('Analytics & Performance', () => {
  describe('GET /analytics/campaigns/:id', () => {
    it('should return campaign performance metrics', async () => {
      mockDb.collection().findOne.mockResolvedValue({
        id: 'camp-1',
        stats: { sent: 10000, opens: 2500, clicks: 750, conversions: 150 }
      });
      
      const res = await request(app)
        .get('/api/email-automation/analytics/campaigns/camp-1')
        .expect(200);
      
      expect(res.body.stats).toHaveProperty('sent');
      expect(res.body.stats).toHaveProperty('opens');
      expect(res.body.stats).toHaveProperty('openRate');
      expect(res.body.stats).toHaveProperty('clickRate');
      expect(res.body.stats).toHaveProperty('conversionRate');
    });

    it('should calculate engagement rates', async () => {
      mockDb.collection().findOne.mockResolvedValue({
        id: 'camp-1',
        stats: { sent: 1000, opens: 250, clicks: 75 }
      });
      
      const res = await request(app)
        .get('/api/email-automation/analytics/campaigns/camp-1')
        .expect(200);
      
      expect(res.body.stats.openRate).toBeCloseTo(0.25, 2);
      expect(res.body.stats.clickRate).toBeCloseTo(0.075, 3);
    });
  });

  describe('GET /analytics/engagement', () => {
    it('should return engagement timeline', async () => {
      const res = await request(app)
        .get('/api/email-automation/analytics/engagement?period=30d')
        .expect(200);
      
      expect(res.body.timeline).toBeInstanceOf(Array);
      expect(res.body.summary).toHaveProperty('avgOpenRate');
      expect(res.body.summary).toHaveProperty('avgClickRate');
    });
  });

  describe('GET /analytics/revenue', () => {
    it('should return revenue attribution', async () => {
      const res = await request(app)
        .get('/api/email-automation/analytics/revenue')
        .expect(200);
      
      expect(res.body).toHaveProperty('totalRevenue');
      expect(res.body).toHaveProperty('orders');
      expect(res.body).toHaveProperty('avgOrderValue');
      expect(res.body).toHaveProperty('roi');
    });

    it('should support different attribution models', async () => {
      const models = ['first-click', 'last-click', 'linear', 'time-decay'];
      
      for (const model of models) {
        const res = await request(app)
          .get(`/api/email-automation/analytics/revenue?model=${model}`)
          .expect(200);
        
        expect(res.body.model).toBe(model);
      }
    });
  });

  describe('GET /analytics/predictive/churn', () => {
    it('should return churn predictions', async () => {
      const res = await request(app)
        .get('/api/email-automation/analytics/predictive/churn')
        .expect(200);
      
      expect(res.body.predictions).toBeInstanceOf(Array);
      expect(res.body.summary).toHaveProperty('highRisk');
      expect(res.body.summary).toHaveProperty('mediumRisk');
    });
  });

  describe('GET /analytics/predictive/ltv', () => {
    it('should return LTV predictions', async () => {
      const res = await request(app)
        .get('/api/email-automation/analytics/predictive/ltv')
        .expect(200);
      
      expect(res.body.predictions).toBeInstanceOf(Array);
      expect(res.body.summary).toHaveProperty('avgPredictedLtv');
    });
  });

  describe('GET /analytics/cohorts', () => {
    it('should return cohort analysis', async () => {
      const res = await request(app)
        .get('/api/email-automation/analytics/cohorts?period=monthly')
        .expect(200);
      
      expect(res.body.cohorts).toBeInstanceOf(Array);
      expect(res.body.cohorts[0]).toHaveProperty('cohortDate');
      expect(res.body.cohorts[0]).toHaveProperty('retention');
    });
  });

  describe('GET /analytics/realtime', () => {
    it('should return real-time activity stats', async () => {
      const res = await request(app)
        .get('/api/email-automation/analytics/realtime?window=60')
        .expect(200);
      
      expect(res.body).toHaveProperty('opens');
      expect(res.body).toHaveProperty('clicks');
      expect(res.body).toHaveProperty('bounces');
      expect(res.body.window).toBe(60);
    });
  });
});

// ================================================================
// CATEGORY 7: TESTING & OPTIMIZATION (16 endpoints)
// ================================================================

describe('Testing & Optimization', () => {
  describe('POST /ab-tests', () => {
    it('should create A/B test', async () => {
      const res = await request(app)
        .post('/api/email-automation/ab-tests')
        .send({
          name: 'Subject Line Test',
          testType: 'subject',
          variants: [
            { name: 'Control', subject: 'Original Subject' },
            { name: 'Variant A', subject: 'New Subject' }
          ],
          splitRatio: [50, 50],
          sampleSize: 1000
        })
        .expect(201);
      
      expect(res.body.test.variants).toHaveLength(2);
      expect(res.body.test.status).toBe('draft');
    });

    it('should validate split ratios sum to 100', async () => {
      const res = await request(app)
        .post('/api/email-automation/ab-tests')
        .send({
          name: 'Test',
          testType: 'subject',
          variants: [{ name: 'A' }, { name: 'B' }],
          splitRatio: [60, 60]
        })
        .expect(400);
      
      expect(res.body.error).toContain('split ratio');
    });
  });

  describe('POST /ab-tests/:id/start', () => {
    it('should start A/B test', async () => {
      mockDb.collection().findOne.mockResolvedValue({
        id: 'test-1',
        status: 'draft',
        variants: [{ name: 'A' }, { name: 'B' }]
      });
      
      const res = await request(app)
        .post('/api/email-automation/ab-tests/test-1/start')
        .expect(200);
      
      expect(res.body.test.status).toBe('running');
    });
  });

  describe('GET /ab-tests/:id/results', () => {
    it('should return test results with statistical significance', async () => {
      mockDb.collection().findOne.mockResolvedValue({
        id: 'test-1',
        status: 'completed',
        variants: [
          { name: 'Control', opens: 250, sent: 1000 },
          { name: 'Variant A', opens: 300, sent: 1000 }
        ]
      });
      
      const res = await request(app)
        .get('/api/email-automation/ab-tests/test-1/results')
        .expect(200);
      
      expect(res.body.results).toHaveProperty('winner');
      expect(res.body.results).toHaveProperty('confidence');
      expect(res.body.results).toHaveProperty('improvement');
    });
  });

  describe('POST /optimization/send-time/analyze', () => {
    it('should analyze optimal send times', async () => {
      const res = await request(app)
        .post('/api/email-automation/optimization/send-time/analyze')
        .send({
          segmentId: 'seg-1',
          lookback: 90
        })
        .expect(200);
      
      expect(res.body.recommendations).toBeInstanceOf(Array);
      expect(res.body.recommendations[0]).toHaveProperty('day');
      expect(res.body.recommendations[0]).toHaveProperty('hour');
      expect(res.body.recommendations[0]).toHaveProperty('predictedOpenRate');
    });
  });

  describe('POST /optimization/frequency-cap', () => {
    it('should set frequency cap', async () => {
      const res = await request(app)
        .post('/api/email-automation/optimization/frequency-cap')
        .send({
          segmentId: 'seg-1',
          maxEmails: 3,
          period: 'week'
        })
        .expect(200);
      
      expect(res.body.ok).toBe(true);
      expect(res.body.cap).toMatchObject({
        maxEmails: 3,
        period: 'week'
      });
    });
  });
});

// ================================================================
// CATEGORY 8: SETTINGS & ADMINISTRATION (16 endpoints)
// ================================================================

describe('Settings & Administration', () => {
  describe('GET /sender-profiles', () => {
    it('should return sender profiles', async () => {
      const mockProfiles = [
        { id: 'sp-1', name: 'Support', fromEmail: 'support@test.com', verified: true },
        { id: 'sp-2', name: 'Marketing', fromEmail: 'marketing@test.com', verified: false }
      ];
      
      mockDb.collection().find().toArray.mockResolvedValue(mockProfiles);
      
      const res = await request(app)
        .get('/api/email-automation/sender-profiles')
        .expect(200);
      
      expect(res.body.profiles).toHaveLength(2);
    });
  });

  describe('POST /sender-profiles', () => {
    it('should create sender profile', async () => {
      const res = await request(app)
        .post('/api/email-automation/sender-profiles')
        .send({
          name: 'Sales Team',
          fromName: 'Sales',
          fromEmail: 'sales@test.com',
          replyTo: 'sales@test.com'
        })
        .expect(201);
      
      expect(res.body.profile).toMatchObject({
        name: 'Sales Team',
        verified: false
      });
    });

    it('should validate email format', async () => {
      const res = await request(app)
        .post('/api/email-automation/sender-profiles')
        .send({
          name: 'Test',
          fromEmail: 'invalid-email'
        })
        .expect(400);
      
      expect(res.body.error).toContain('email');
    });
  });

  describe('POST /domains', () => {
    it('should add domain for authentication', async () => {
      const res = await request(app)
        .post('/api/email-automation/domains')
        .send({
          domain: 'example.com'
        })
        .expect(201);
      
      expect(res.body.domain).toMatchObject({
        domain: 'example.com',
        spf: { verified: false },
        dkim: { verified: false },
        dmarc: { verified: false }
      });
    });
  });

  describe('POST /domains/:id/verify-spf', () => {
    it('should verify SPF record', async () => {
      mockDb.collection().findOne.mockResolvedValue({
        id: 'dom-1',
        domain: 'example.com',
        spf: { record: 'v=spf1 include:sendgrid.net ~all', verified: false }
      });
      
      const res = await request(app)
        .post('/api/email-automation/domains/dom-1/verify-spf')
        .expect(200);
      
      expect(res.body.domain.spf.verified).toBe(true);
    });
  });

  describe('GET /webhooks', () => {
    it('should return configured webhooks', async () => {
      const mockWebhooks = [
        { id: 'wh-1', url: 'https://api.test.com/webhook', events: ['email.opened'] }
      ];
      
      mockDb.collection().find().toArray.mockResolvedValue(mockWebhooks);
      
      const res = await request(app)
        .get('/api/email-automation/webhooks')
        .expect(200);
      
      expect(res.body.webhooks).toHaveLength(1);
    });
  });

  describe('POST /webhooks', () => {
    it('should create webhook', async () => {
      const res = await request(app)
        .post('/api/email-automation/webhooks')
        .send({
          url: 'https://api.test.com/webhook',
          events: ['email.opened', 'email.clicked']
        })
        .expect(201);
      
      expect(res.body.webhook).toMatchObject({
        url: 'https://api.test.com/webhook',
        status: 'active'
      });
    });

    it('should validate webhook URL', async () => {
      const res = await request(app)
        .post('/api/email-automation/webhooks')
        .send({
          url: 'not-a-url',
          events: ['email.opened']
        })
        .expect(400);
      
      expect(res.body.error).toContain('valid URL');
    });
  });

  describe('GET /compliance/gdpr/export/:contactId', () => {
    it('should export contact data for GDPR compliance', async () => {
      mockDb.collection().findOne.mockResolvedValue({
        id: 'contact-1',
        email: 'user@test.com',
        firstName: 'John',
        customFields: { company: 'Acme' }
      });
      
      const res = await request(app)
        .get('/api/email-automation/compliance/gdpr/export/contact-1')
        .expect(200);
      
      expect(res.body.data).toHaveProperty('email');
      expect(res.body.exportedAt).toBeDefined();
    });
  });

  describe('DELETE /compliance/gdpr/delete/:contactId', () => {
    it('should delete contact data for GDPR compliance', async () => {
      mockDb.collection().findOne.mockResolvedValue({ id: 'contact-1' });
      
      const res = await request(app)
        .delete('/api/email-automation/compliance/gdpr/delete/contact-1')
        .expect(200);
      
      expect(res.body.ok).toBe(true);
      expect(mockDb.collection().deleteOne).toHaveBeenCalled();
    });
  });
});

// ================================================================
// INTEGRATION TESTS
// ================================================================

describe('Integration Tests', () => {
  describe('End-to-end campaign flow', () => {
    it('should create, schedule, and send campaign', async () => {
      // 1. Create campaign
      const createRes = await request(app)
        .post('/api/email-automation/campaigns')
        .send({
          name: 'Integration Test Campaign',
          subject: 'Test Subject',
          fromName: 'Test',
          fromEmail: 'test@example.com',
          body: '<p>Test</p>'
        })
        .expect(201);
      
      const campaignId = createRes.body.campaign.id;
      
      // 2. Schedule campaign
      const futureDate = new Date(Date.now() + 3600000).toISOString();
      await request(app)
        .post(`/api/email-automation/campaigns/${campaignId}/schedule`)
        .send({ scheduledAt: futureDate })
        .expect(200);
      
      // 3. Send test
      await request(app)
        .post(`/api/email-automation/campaigns/${campaignId}/test`)
        .send({ emails: ['test@example.com'] })
        .expect(200);
      
      // 4. Get analytics
      await request(app)
        .get(`/api/email-automation/analytics/campaigns/${campaignId}`)
        .expect(200);
    });
  });

  describe('AI-powered workflow', () => {
    it('should generate content and create automated workflow', async () => {
      // 1. Generate subject lines
      const subjectRes = await request(app)
        .post('/api/email-automation/ai/subject-lines/generate')
        .send({
          campaignGoal: 'Welcome new users',
          count: 3
        })
        .expect(200);
      
      const bestSubject = subjectRes.body.suggestions[0].subject;
      
      // 2. Generate email body
      const contentRes = await request(app)
        .post('/api/email-automation/ai/content/generate')
        .send({
          prompt: 'Create welcome email',
          tone: 'friendly'
        })
        .expect(200);
      
      // 3. Create workflow with generated content
      await request(app)
        .post('/api/email-automation/workflows')
        .send({
          name: 'AI Welcome Series',
          trigger: { type: 'contact_created' },
          actions: [
            {
              type: 'send_email',
              subject: bestSubject,
              body: contentRes.body.content
            }
          ]
        })
        .expect(201);
    });
  });
});

// ================================================================
// PERFORMANCE TESTS
// ================================================================

describe('Performance Tests', () => {
  describe('Bulk operations', () => {
    it('should handle bulk contact import efficiently', async () => {
      const contacts = Array.from({ length: 1000 }, (_, i) => ({
        email: `user${i}@test.com`,
        firstName: `User${i}`
      }));
      
      const startTime = Date.now();
      await request(app)
        .post('/api/email-automation/contacts/bulk-import')
        .send({ contacts })
        .expect(200);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });

  describe('Query optimization', () => {
    it('should paginate large contact lists efficiently', async () => {
      const startTime = Date.now();
      await request(app)
        .get('/api/email-automation/contacts?page=1&limit=100')
        .expect(200);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});

// ================================================================
// ERROR HANDLING TESTS
// ================================================================

describe('Error Handling', () => {
  it('should handle database connection errors', async () => {
    getDb.mockImplementation(() => {
      throw new Error('Database connection failed');
    });
    
    const res = await request(app)
      .get('/api/email-automation/campaigns')
      .expect(500);
    
    expect(res.body.error).toContain('error');
  });

  it('should handle malformed JSON', async () => {
    const res = await request(app)
      .post('/api/email-automation/campaigns')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }')
      .expect(400);
    
    expect(res.body.error).toBeDefined();
  });

  it('should handle rate limiting', async () => {
    // Make 100 requests rapidly
    const requests = Array.from({ length: 100 }, () =>
      request(app).get('/api/email-automation/campaigns')
    );
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status === 429);
    
    // At least some requests should be rate limited
    expect(rateLimited).toBe(true);
  });
});

// ================================================================
// SECURITY TESTS
// ================================================================

describe('Security Tests', () => {
  it('should prevent SQL injection in search', async () => {
    const res = await request(app)
      .get('/api/email-automation/campaigns?search=\'; DROP TABLE campaigns; --')
      .expect(200);
    
    // Should not throw error or execute malicious query
    expect(res.body.ok).toBe(true);
  });

  it('should sanitize HTML in email content', async () => {
    const res = await request(app)
      .post('/api/email-automation/campaigns')
      .send({
        name: 'Test',
        subject: 'Test',
        fromEmail: 'test@test.com',
        fromName: 'Test',
        body: '<script>alert("XSS")</script><p>Safe content</p>'
      })
      .expect(201);
    
    // Script tags should be removed
    expect(res.body.campaign.body).not.toContain('<script>');
  });
});

// Export for external use
module.exports = {
  app,
  mockDb,
  mockOpenAI,
  mockAnthropic
};
