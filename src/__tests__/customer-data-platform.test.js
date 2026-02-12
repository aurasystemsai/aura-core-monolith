/**
 * Customer Data Platform - Comprehensive Test Suite
 * Tests for profiles, events, segments, enrichment, and privacy
 */

const request = require('supertest');
const express = require('express');
const cdpRouter = require('../tools/customer-data-platform/router');
const profiles = require('../tools/customer-data-platform/profiles');
const events = require('../tools/customer-data-platform/events');
const segments = require('../tools/customer-data-platform/segments');
const privacy = require('../tools/customer-data-platform/privacy');

// Setup test app
function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/cdp', cdpRouter);
  return app;
}

describe('Customer Data Platform', () => {
  let app;
  
  beforeEach(() => {
    app = createApp();
    // Clear all data before each test
    profiles.clearAllProfiles();
    events.clearAllEvents();
    segments.clearAllSegments();
    privacy.clearAllPrivacyData();
  });
  
  // ==========================================================================
  // PROFILE TESTS
  // ==========================================================================
  
  describe('Profile Management', () => {
    test('should create a customer profile', async () => {
      const profileData = {
        externalIds: {
          email: 'test@example.com',
          shopifyId: 'shop_123',
        },
        attributes: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          country: 'US',
        },
      };
      
      const res = await request(app)
        .post('/api/cdp/profiles')
        .send(profileData);
      
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.attributes.firstName).toBe('John');
      expect(res.body.externalIds.email).toBe('test@example.com');
    });
    
    test('should get profile by ID', async () => {
      const profile = profiles.createProfile({
        externalIds: { email: 'test@example.com' },
        attributes: { firstName: 'Jane' },
      });
      
      const res = await request(app).get(`/api/cdp/profiles/${profile.id}`);
      
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(profile.id);
      expect(res.body.attributes.firstName).toBe('Jane');
    });
    
    test('should update profile', async () => {
      const profile = profiles.createProfile({
        externalIds: { email: 'test@example.com' },
        attributes: { firstName: 'John' },
      });
      
      const res = await request(app)
        .put(`/api/cdp/profiles/${profile.id}`)
        .send({
          attributes: {
            lastName: 'Smith',
            phone: '+1234567890',
          },
        });
      
      expect(res.status).toBe(200);
      expect(res.body.attributes.firstName).toBe('John');
      expect(res.body.attributes.lastName).toBe('Smith');
      expect(res.body.attributes.phone).toBe('+1234567890');
    });
    
    test('should delete profile', async () => {
      const profile = profiles.createProfile({
        externalIds: { email: 'test@example.com' },
        attributes: { firstName: 'John' },
      });
      
      const res = await request(app).delete(`/api/cdp/profiles/${profile.id}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      const getRes = await request(app).get(`/api/cdp/profiles/${profile.id}`);
      expect(getRes.status).toBe(404);
    });
    
    test('should search profiles', async () => {
      profiles.createProfile({
        externalIds: { email: 'john@example.com' },
        attributes: { firstName: 'John', country: 'US' },
      });
      
      profiles.createProfile({
        externalIds: { email: 'jane@example.com' },
        attributes: { firstName: 'Jane', country: 'CA' },
      });
      
      const res = await request(app)
        .post('/api/cdp/profiles/search')
        .send({
          filters: { country: 'US' },
        });
      
      expect(res.status).toBe(200);
      expect(res.body.profiles.length).toBe(1);
      expect(res.body.profiles[0].attributes.firstName).toBe('John');
    });
    
    test('should merge two profiles', async () => {
      const profile1 = profiles.createProfile({
        externalIds: { email: 'john@example.com' },
        attributes: { firstName: 'John', phone: '+1111111111' },
      });
      
      const profile2 = profiles.createProfile({
        externalIds: { shopifyId: 'shop_456' },
        attributes: { lastName: 'Doe', country: 'US' },
      });
      
      const res = await request(app)
        .post('/api/cdp/profiles/merge')
        .send({
          primaryId: profile1.id,
          secondaryId: profile2.id,
        });
      
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(profile1.id);
      expect(res.body.attributes.firstName).toBe('John');
      expect(res.body.attributes.lastName).toBe('Doe');
      expect(res.body.externalIds.email).toBe('john@example.com');
      expect(res.body.externalIds.shopifyId).toBe('shop_456');
      
      // Secondary should be deleted
      const getRes = await request(app).get(`/api/cdp/profiles/${profile2.id}`);
      expect(getRes.status).toBe(404);
    });
  });
  
  // ==========================================================================
  // EVENT TESTS
  // ==========================================================================
  
  describe('Event Tracking', () => {
    test('should track a single event', async () => {
      const profile = profiles.createProfile({
        externalIds: { email: 'test@example.com' },
        attributes: { firstName: 'John' },
      });
      
      const eventData = {
        profileId: profile.id,
        type: 'page_view',
        properties: {
          url: '/products/widget',
          title: 'Widget Product Page',
        },
      };
      
      const res = await request(app)
        .post('/api/cdp/events')
        .send(eventData);
      
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.type).toBe('page_view');
      expect(res.body.profileId).toBe(profile.id);
    });
    
    test('should track events in batch', async () => {
      const profile = profiles.createProfile({
        externalIds: { email: 'test@example.com' },
      });
      
      const eventData = [
        {
          profileId: profile.id,
          type: 'page_view',
          properties: { url: '/home' },
        },
        {
          profileId: profile.id,
          type: 'product_view',
          properties: { productId: 'prod_123' },
        },
        {
          profileId: profile.id,
          type: 'add_to_cart',
          properties: { productId: 'prod_123', quantity: 1 },
        },
      ];
      
      const res = await request(app)
        .post('/api/cdp/events/batch')
        .send({ events: eventData });
      
      expect(res.status).toBe(201);
      expect(res.body.successful).toBe(3);
      expect(res.body.failed).toBe(0);
    });
    
    test('should query events', async () => {
      const profile = profiles.createProfile({
        externalIds: { email: 'test@example.com' },
      });
      
      events.trackEvent({
        profileId: profile.id,
        type: 'page_view',
        properties: { url: '/home' },
      });
      
      events.trackEvent({
        profileId: profile.id,
        type: 'purchase',
        properties: { revenue: 100 },
      });
      
      const res = await request(app)
        .post('/api/cdp/events/query')
        .send({
          filters: { type: 'purchase' },
        });
      
      expect(res.status).toBe(200);
      expect(res.body.events.length).toBe(1);
      expect(res.body.events[0].type).toBe('purchase');
    });
    
    test('should get event statistics', async () => {
      const profile = profiles.createProfile({
        externalIds: { email: 'test@example.com' },
      });
      
      events.trackEvent({ profileId: profile.id, type: 'page_view' });
      events.trackEvent({ profileId: profile.id, type: 'page_view' });
      events.trackEvent({ profileId: profile.id, type: 'purchase' });
      
      const res = await request(app).get('/api/cdp/events/stats');
      
      expect(res.status).toBe(200);
      expect(res.body.totalEvents).toBe(3);
      expect(res.body.byType.page_view).toBe(2);
      expect(res.body.byType.purchase).toBe(1);
    });
    
    test('should calculate funnel conversion', async () => {
      const profile1 = profiles.createProfile({ externalIds: { email: 'user1@example.com' } });
      const profile2 = profiles.createProfile({ externalIds: { email: 'user2@example.com' } });
      
      // Profile 1: completes full funnel
      events.trackEvent({ profileId: profile1.id, type: 'page_view' });
      events.trackEvent({ profileId: profile1.id, type: 'product_view' });
      events.trackEvent({ profileId: profile1.id, type: 'add_to_cart' });
      events.trackEvent({ profileId: profile1.id, type: 'purchase' });
      
      // Profile 2: drops off at cart
      events.trackEvent({ profileId: profile2.id, type: 'page_view' });
      events.trackEvent({ profileId: profile2.id, type: 'product_view' });
      events.trackEvent({ profileId: profile2.id, type: 'add_to_cart' });
      
      const res = await request(app)
        .post('/api/cdp/events/funnel')
        .send({
          steps: [
            { name: 'View', type: 'page_view' },
            { name: 'Product', type: 'product_view' },
            { name: 'Cart', type: 'add_to_cart' },
            { name: 'Purchase', type: 'purchase' },
          ],
        });
      
      expect(res.status).toBe(200);
      expect(res.body.funnel.length).toBe(4);
      expect(res.body.funnel[0].count).toBe(2);
      expect(res.body.funnel[3].count).toBe(1);
      expect(res.body.overallConversion).toBe(50);
    });
    
    test('should get profile timeline', async () => {
      const profile = profiles.createProfile({
        externalIds: { email: 'test@example.com' },
      });
      
      events.trackEvent({
        profileId: profile.id,
        type: 'page_view',
        timestamp: '2024-01-01T00:00:00Z',
      });
      
      events.trackEvent({
        profileId: profile.id,
        type: 'purchase',
        timestamp: '2024-01-02T00:00:00Z',
      });
      
      const res = await request(app).get(`/api/cdp/profiles/${profile.id}/timeline`);
      
      expect(res.status).toBe(200);
      expect(res.body.events.length).toBe(2);
      // Most recent first
      expect(res.body.events[0].type).toBe('purchase');
      expect(res.body.events[1].type).toBe('page_view');
    });
  });
  
  // ==========================================================================
  // SEGMENT TESTS
  // ==========================================================================
  
  describe('Segmentation', () => {
    test('should create a segment', async () => {
      const segmentData = {
        name: 'High Value Customers',
        description: 'Customers with LTV > $500',
        type: 'rule-based',
        rules: {
          operator: 'AND',
          conditions: [
            { field: 'computed.ltv', operator: '>', value: 500 },
          ],
        },
      };
      
      const res = await request(app)
        .post('/api/cdp/segments')
        .send(segmentData);
      
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('High Value Customers');
    });
    
    test('should evaluate segment rules and compute membership', async () => {
      // Create profiles with different LTVs
      const highValueProfile = profiles.createProfile({
        externalIds: { email: 'whale@example.com' },
        attributes: { firstName: 'High' },
      });
      
      events.trackEvent({
        profileId: highValueProfile.id,
        type: 'purchase',
        properties: { revenue: 1000 },
      });
      
      const lowValueProfile = profiles.createProfile({
        externalIds: { email: 'minnow@example.com' },
        attributes: { firstName: 'Low' },
      });
      
      events.trackEvent({
        profileId: lowValueProfile.id,
        type: 'purchase',
        properties: { revenue: 50 },
      });
      
      // Create segment
      const res = await request(app)
        .post('/api/cdp/segments')
        .send({
          name: 'High Value',
          type: 'rule-based',
          rules: {
            operator: 'AND',
            conditions: [
              { field: 'computed.ltv', operator: '>=', value: 500 },
            ],
          },
        });
      
      expect(res.status).toBe(201);
      expect(res.body.size).toBe(1);
      
      // Check membership
      const membersRes = await request(app).get(`/api/cdp/segments/${res.body.id}/members`);
      expect(membersRes.body.members.length).toBe(1);
      expect(membersRes.body.members[0].id).toBe(highValueProfile.id);
    });
    
    test('should get all segments', async () => {
      segments.createSegment({ name: 'Segment 1', type: 'rule-based' });
      segments.createSegment({ name: 'Segment 2', type: 'rule-based' });
      
      const res = await request(app).get('/api/cdp/segments');
      
      expect(res.status).toBe(200);
      expect(res.body.segments.length).toBe(2);
    });
    
    test('should update segment and recompute', async () => {
      const profile = profiles.createProfile({
        externalIds: { email: 'test@example.com' },
        attributes: { country: 'US' },
      });
      
      const segment = segments.createSegment({
        name: 'US Customers',
        type: 'rule-based',
        rules: {
          operator: 'AND',
          conditions: [
            { field: 'attributes.country', operator: '=', value: 'US' },
          ],
        },
      });
      
      expect(segment.size).toBe(1);
      
      // Update segment rules
      const res = await request(app)
        .put(`/api/cdp/segments/${segment.id}`)
        .send({
          rules: {
            operator: 'AND',
            conditions: [
              { field: 'attributes.country', operator: '=', value: 'CA' },
            ],
          },
        });
      
      expect(res.status).toBe(200);
      expect(res.body.size).toBe(0);
    });
    
    test('should delete segment', async () => {
      const segment = segments.createSegment({
        name: 'Test Segment',
        type: 'rule-based',
      });
      
      const res = await request(app).delete(`/api/cdp/segments/${segment.id}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    
    test('should calculate segment overlap', async () => {
     const profile1 = profiles.createProfile({
        externalIds: { email: 'user1@example.com' },
        attributes: { country: 'US', tags: ['vip'] },
      });
      
      const profile2 = profiles.createProfile({
        externalIds: { email: 'user2@example.com' },
        attributes: { country: 'US', tags: [] },
      });
      
const profile3 = profiles.createProfile({
        externalIds: { email: 'user3@example.com' },
        attributes: { country: 'CA', tags: ['vip'] },
      });
      
      const segment1 = segments.createSegment({
        name: 'US Customers',
        type: 'rule-based',
        rules: {
          operator: 'AND',
          conditions: [
            { field: 'attributes.country', operator: '=', value: 'US' },
          ],
        },
      });
      
      const segment2 = segments.createSegment({
        name: 'VIP Customers',
        type: 'rule-based',
        rules: {
          operator: 'AND',
          conditions: [
            { field: 'attributes.tags', operator: 'contains', value: 'vip' },
          ],
        },
      });
      
      const res = await request(app).get(
        `/api/cdp/segments/${segment1.id}/overlap/${segment2.id}`
      );
      
      expect(res.status).toBe(200);
      expect(res.body.segment1.size).toBe(2); // US customers: profile1, profile2
      expect(res.body.segment2.size).toBe(2); // VIP customers: profile1, profile3
      expect(res.body.overlap).toBe(1); // US + VIP: profile1 only
    });
  });
  
  // ==========================================================================
  // ENRICHMENT TESTS
  // ==========================================================================
  
  describe('Data Enrichment', () => {
    test('should get enrichment providers', async () => {
      const res = await request(app).get('/api/cdp/enrichment/providers');
      
      expect(res.status).toBe(200);
      expect(res.body.providers).toBeDefined();
      expect(Array.isArray(res.body.providers)).toBe(true);
    });
    
    test('should enrich a single profile', async () => {
      const profile = profiles.createProfile({
        externalIds: { email: 'john@techcorp.com' },
        attributes: { firstName: 'John', email: 'john@techcorp.com' },
      });
      
      const res = await request(app)
        .post(`/api/cdp/enrichment/profiles/${profile.id}`)
        .send({ provider: 'clearbit' });
      
      expect(res.status).toBe(200);
      expect(res.body.profileId).toBe(profile.id);
      expect(res.body.enrichedFields).toBeDefined();
    });
    
    test('should enrich profiles in batch', async () => {
      const profile1 = profiles.createProfile({
        externalIds: { email: 'user1@example.com' },
      });
      
      const profile2 = profiles.createProfile({
        externalIds: { email: 'user2@example.com' },
      });
      
      const res = await request(app)
        .post('/api/cdp/enrichment/batch')
        .send({
          profileIds: [profile1.id, profile2.id],
          provider: 'fullcontact',
        });
      
      expect(res.status).toBe(200);
      expect(res.body.enriched).toBe(2);
      expect(res.body.failed).toBe(0);
    });
  });
  
  // ==========================================================================
  // PRIVACY & CONSENT TESTS
  // ==========================================================================
  
  describe('Privacy & Consent', () => {
    test('should update consent preferences', async () => {
      const profile = profiles.createProfile({
        externalIds: { email: 'test@example.com' },
      });
      
      const res = await request(app)
        .post(`/api/cdp/consent/${profile.id}`)
        .send({
          email: false,
          sms: true,
          tracking: true,
        });
      
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(false);
      expect(res.body.sms).toBe(true);
    });
    
    test('should get consent status', async () => {
      const profile = profiles.createProfile({
        externalIds: { email: 'test@example.com' },
      });
      
      privacy.updateConsent(profile.id, { email: false });
      
      const res = await request(app).get(`/api/cdp/consent/${profile.id}`);
      
      expect(res.status).toBe(200);
      expect(res.body.current.email).toBe(false);
      expect(res.body.history).toBeDefined();
      expect(res.body.history.length).toBe(1);
    });
    
    test('should export customer data (GDPR)', async () => {
      const profile = profiles.createProfile({
        externalIds: { email: 'test@example.com' },
        attributes: { firstName: 'John' },
      });
      
      events.trackEvent({
        profileId: profile.id,
        type: 'purchase',
        properties: { revenue: 100 },
      });
      
      const res = await request(app).post(`/api/cdp/gdpr/export/${profile.id}`);
      
      expect(res.status).toBe(200);
      expect(res.body.requestId).toBeDefined();
      expect(res.body.data.profile.id).toBe(profile.id);
      expect(res.body.data.events.length).toBe(1);
    });
    
    test('should delete customer data (GDPR)', async () => {
      const profile = profiles.createProfile({
        externalIds: { email: 'test@example.com' },
      });
      
      const res = await request(app)
        .post(`/api/cdp/gdpr/delete/${profile.id}`)
        .send({ requireApproval: false });
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('completed');
      
      // Profile should be deleted
      const getRes = await request(app).get(`/api/cdp/profiles/${profile.id}`);
      expect(getRes.status).toBe(404);
    });
    
    test('should list GDPR requests', async () => {
      const profile = profiles.createProfile({
        externalIds: { email: 'test@example.com' },
      });
      
      await request(app).post(`/api/cdp/gdpr/export/${profile.id}`);
      await request(app).post(`/api/cdp/gdpr/delete/${profile.id}`);
      
      const res = await request(app).get('/api/cdp/gdpr/requests');
      
      expect(res.status).toBe(200);
      expect(res.body.requests.length).toBe(2);
    });
    
    test('should get compliance report', async () => {
      profiles.createProfile({
        externalIds: { email: 'user1@example.com' },
      });
      
      profiles.createProfile({
        externalIds: { email: 'user2@example.com' },
        consent: { email: false, sms: false, tracking: false },
      });
      
      const res = await request(app).get('/api/cdp/privacy/compliance');
      
      expect(res.status).toBe(200);
      expect(res.body.totalProfiles).toBe(2);
      expect(res.body.consent).toBeDefined();
    });
  });
  
  // ==========================================================================
  // ANALYTICS TESTS
  // ==========================================================================
  
  describe('Analytics', () => {
    test('should get analytics overview', async () => {
      const profile = profiles.createProfile({
        externalIds: { email: 'test@example.com' },
        attributes: { email: 'test@example.com', phone: '+1234567890' },
      });
      
      events.trackEvent({ profileId: profile.id, type: 'page_view' });
      events.trackEvent({ profileId: profile.id, type: 'purchase', properties: { revenue: 100 } });
      
      segments.createSegment({ name: 'Test Segment', type: 'rule-based' });
      
      const res = await request(app).get('/api/cdp/analytics/overview');
      
      expect(res.status).toBe(200);
      expect(res.body.profiles.total).toBe(1);
      expect(res.body.profiles.withEmail).toBe(1);
      expect(res.body.profiles.withPhone).toBe(1);
      expect(res.body.segments.total).toBe(1);
      expect(res.body.events.totalEvents).toBe(2);
    });
    
    test('should calculate RFM score for profile', async () => {
      const profile = profiles.createProfile({
        externalIds: { email: 'test@example.com' },
      });
      
      // Create multiple purchases
      events.trackEvent({
        profileId: profile.id,
        type: 'purchase',
        properties: { revenue: 100 },
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      });
      
      events.trackEvent({
        profileId: profile.id,
        type: 'purchase',
        properties: { revenue: 150 },
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      });
      
      const res = await request(app).get(`/api/cdp/analytics/rfm/${profile.id}`);
      
      expect(res.status).toBe(200);
      expect(res.body.rfm.recency).toBeDefined();
      expect(res.body.rfm.frequency).toBeDefined();
      expect(res.body.rfm.monetary).toBeDefined();
      expect(res.body.rfm.score).toBeDefined();
      expect(res.body.rfm.rawFrequency).toBe(2);
      expect(res.body.rfm.rawMonetary).toBe(250);
    });
  });
  
  // ==========================================================================
  // HEALTH CHECK
  // ==========================================================================
  
  describe('Health Check', () => {
    test('should return health status', async () => {
      const res = await request(app).get('/api/cdp/health');
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('customer-data-platform');
    });
  });
});
