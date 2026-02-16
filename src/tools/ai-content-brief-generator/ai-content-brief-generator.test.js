// ================================================================
// AI CONTENT BRIEF GENERATOR - COMPREHENSIVE TEST SUITE
// ================================================================
// Coverage Target: 95%+
// Test Count: 80+ test cases
// Line Target: ~500 lines
// Framework: Jest + Supertest
// ================================================================

const request = require('supertest');
const express = require('express');
const router = require('./router');

// Create a test app with the router
const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/ai-content-brief-generator', router);
  return app;
};

// ================================================================
// HEALTH & STATS TESTS
// ================================================================

describe('AI Content Brief Generator - Health & Stats', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('GET /health returns status ok', async () => {
    const res = await request(app).get('/api/ai-content-brief-generator/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /stats returns comprehensive stats', async () => {
    const res = await request(app).get('/api/ai-content-brief-generator/stats');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('briefs');
    expect(res.body.data).toHaveProperty('outlines');
    expect(res.body.data).toHaveProperty('distributionPlans');
  });
});

//  ================================================================
// RESEARCH & STRATEGY ENGINE TESTS (~18 endpoints)
// ================================================================

describe('AI Content Brief Generator - Research & Strategy', () => {
  let app;
  let briefId;

  beforeEach(() => {
    app = createApp();
  });

  it('POST /research/brief creates a new brief', async () => {
    const payload = {
      topic: 'AI-powered content marketing',
      audience: 'Marketing Directors',
      primaryKeyword: 'content AI tools',
      secondaryKeywords: ['AI content', 'marketing automation'],
    };
    const res = await request(app)
      .post('/api/ai-content-brief-generator/research/brief')
      .send(payload);
    
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.topic).toBe('AI-powered content marketing');
    briefId = res.body.data.id;
  });

  it('GET /research/brief/:id returns specific brief', async () => {
    const createRes = await request(app)
      .post('/api/ai-content-brief-generator/research/brief')
      .send({ topic: 'Test Brief', audience: 'Testers' });
    
    const id = createRes.body.data.id;
    const res = await request(app).get(`/api/ai-content-brief-generator/research/brief/${id}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(id);
  });

  it('GET /research/briefs returns all briefs', async () => {
    await request(app)
      .post('/api/ai-content-brief-generator/research/brief')
      .send({ topic: 'Brief 1', audience: 'Audience 1' });
    
    const res = await request(app).get('/api/ai-content-brief-generator/research/briefs');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('PUT /research/brief/:id updates brief', async () => {
    const createRes = await request(app)
      .post('/api/ai-content-brief-generator/research/brief')
      .send({ topic: 'Original Topic' });
    
    const id = createRes.body.data.id;
    const res = await request(app)
      .put(`/api/ai-content-brief-generator/research/brief/${id}`)
      .send({ topic: 'Updated Topic', audience: 'New Audience' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.topic).toBe('Updated Topic');
  });

  it('DELETE /research/brief/:id deletes brief', async () => {
    const createRes = await request(app)
      .post('/api/ai-content-brief-generator/research/brief')
      .send({ topic: 'To Delete' });
    
    const id = createRes.body.data.id;
    const res = await request(app).delete(`/api/ai-content-brief-generator/research/brief/${id}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /research/competitor/analyze analyzes competitors', async () => {
    const createRes = await request(app)
      .post('/api/ai-content-brief-generator/research/brief')
      .send({ topic: 'Competitor Analysis Test' });
    
    const briefId = createRes.body.data.id;
    const res = await request(app)
      .post('/api/ai-content-brief-generator/research/competitor/analyze')
      .send({ briefId, competitors: ['competitor1.com', 'competitor2.com'] });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
  });

  it('POST /research/trend/identify identifies trends', async () => {
    const createRes = await request(app)
      .post('/api/ai-content-brief-generator/research/brief')
      .send({ topic: 'Trend Test' });
    
    const briefId = createRes.body.data.id;
    const res = await request(app)
      .post('/api/ai-content-brief-generator/research/trend/identify')
      .send({ briefId, timeframe: 'last_30_days' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /research/keyword/research researches keywords', async () => {
    const createRes = await request(app)
      .post('/api/ai-content-brief-generator/research/brief')
      .send({ topic: 'Keyword Test' });
    
    const briefId = createRes.body.data.id;
    const res = await request(app)
      .post('/api/ai-content-brief-generator/research/keyword/research')
      .send({ briefId, seedKeywords: ['AI', 'content', 'marketing'] });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /research/audience/profile profiles audience', async () => {
    const createRes = await request(app)
      .post('/api/ai-content-brief-generator/research/brief')
      .send({ topic: 'Audience Test' });
    
    const briefId = createRes.body.data.id;
    const res = await request(app)
      .post('/api/ai-content-brief-generator/research/audience/profile')
      .send({ briefId, demographics: {} });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /research/content-gap/analyze analyzes content gaps', async () => {
    const createRes = await request(app)
      .post('/api/ai-content-brief-generator/research/brief')
      .send({ topic: 'Gap Analysis Test' });
    
    const briefId = createRes.body.data.id;
    const res = await request(app)
      .post('/api/ai-content-brief-generator/research/content-gap/analyze')
      .send({ briefId });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /research/framework/apply applies strategic framework', async () => {
    const createRes = await request(app)
      .post('/api/ai-content-brief-generator/research/brief')
      .send({ topic: 'Framework Test' });
    
    const briefId = createRes.body.data.id;
    const res = await request(app)
      .post('/api/ai-content-brief-generator/research/framework/apply')
      .send({ briefId, framework: 'pain-agitate-solve' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ================================================================
// OUTLINE ENGINE TESTS (~22 endpoints)
// ================================================================

describe('AI Content Brief Generator - Outline', () => {
  let app;
  let briefId;
  let outlineId;

  beforeEach(async () => {
    app = createApp();
    
    // Create a brief first
    const briefRes = await request(app)
      .post('/api/ai-content-brief-generator/research/brief')
      .send({ topic: 'Test Brief for Outline' });
    briefId = briefRes.body.data.id;
  });

  it('POST /outline/generate generates an outline', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/outline/generate')
      .send({ 
        briefId,
        title: 'Test Outline',
        targetWordCount: 1500
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    outlineId = res.body.data.id;
  });

  it('GET /outline/:id returns specific outline', async () => {
    const createRes = await request(app)
      .post('/api/ai-content-brief-generator/outline/generate')
      .send({ briefId, title: 'Get Test' });
    
    const id = createRes.body.data.id;
    const res = await request(app).get(`/api/ai-content-brief-generator/outline/${id}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(id);
  });

  it('PUT /outline/:id updates outline', async () => {
    const createRes = await request(app)
      .post('/api/ai-content-brief-generator/outline/generate')
      .send({ briefId, title: 'Original Outline' });
    
    const id = createRes.body.data.id;
    const res = await request(app)
      .put(`/api/ai-content-brief-generator/outline/${id}`)
      .send({ title: 'Updated Outline' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated Outline');
  });

  it('DELETE /outline/:id deletes outline', async () => {
    const createRes = await request(app)
      .post('/api/ai-content-brief-generator/outline/generate')
      .send({ briefId, title: 'To Delete' });
    
    const id = createRes.body.data.id;
    const res = await request(app).delete(`/api/ai-content-brief-generator/outline/${id}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /outline/:id/section adds a section', async () => {
    const createRes = await request(app)
      .post('/api/ai-content-brief-generator/outline/generate')
      .send({ briefId, title: 'Section Test' });
    
    const id = createRes.body.data.id;
    const res = await request(app)
      .post(`/api/ai-content-brief-generator/outline/${id}/section`)
      .send({ 
        heading: 'New Section',
        notes: 'Section notes',
        estimatedWords: 250
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /outline/:id/versions returns version history', async () => {
    const createRes = await request(app)
      .post('/api/ai-content-brief-generator/outline/generate')
      .send({ briefId, title: 'Versioned Outline' });
    
    const id = createRes.body.data.id;
    const res = await request(app).get(`/api/ai-content-brief-generator/outline/${id}/versions`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /outline/:id/analyze analyzes outline structure', async () => {
    const createRes = await request(app)
      .post('/api/ai-content-brief-generator/outline/generate')
      .send({ briefId, title: 'Analysis Test' });
    
    const id = createRes.body.data.id;
    const res = await request(app).get(`/api/ai-content-brief-generator/outline/${id}/analyze`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /outline/:id/suggest-improvements suggests improvements', async () => {
    const createRes = await request(app)
      .post('/api/ai-content-brief-generator/outline/generate')
      .send({ briefId, title: 'Improvement Test' });
    
    const id = createRes.body.data.id;
    const res = await request(app).get(`/api/ai-content-brief-generator/outline/${id}/suggest-improvements`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ================================================================
// SEO ENGINE TESTS (~18 endpoints)
// ================================================================

describe('AI Content Brief Generator - SEO', () => {
  let app;
  let briefId;

  beforeEach(async () => {
    app = createApp();
    
    const briefRes = await request(app)
      .post('/api/ai-content-brief-generator/research/brief')
      .send({ topic: 'SEO Test Brief' });
    briefId = briefRes.body.data.id;
  });

  it('POST /seo-brief/score scores content for SEO', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/seo-brief/score')
      .send({ 
        briefId,
        targetKeyword: 'content marketing',
        content: 'Test content for SEO scoring'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('overallScore');
  });

  it('POST /seo-brief/keyword/suggest suggests keywords', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/seo-brief/keyword/suggest')
      .send({ briefId, seedKeyword: 'AI content' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /seo-brief/keyword/difficulty analyzes keyword difficulty', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/seo-brief/keyword/difficulty')
      .send({ briefId, keyword: 'content marketing' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /seo-brief/metadata/optimize optimizes metadata', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/seo-brief/metadata/optimize')
      .send({ 
        briefId,
        currentMeta: {
          title: 'Old Title',
          description: 'Old description'
        }
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /seo-brief/schema/validate validates schema markup', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/seo-brief/schema/validate')
      .send({ 
        briefId,
        schema: {
          '@type': 'Article',
          headline: 'Test'
        }
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /seo-brief/content/analyze analyzes content quality', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/seo-brief/content/analyze')
      .send({ 
        briefId,
        content: 'Test content to analyze'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /seo-brief/competitor/analyze-seo analyzes competitor SEO', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/seo-brief/competitor/analyze-seo')
      .send({ 
        briefId,
        competitorUrls: ['https://competitor.com']
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /seo-brief/audit runs SEO audit', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/seo-brief/audit')
      .send({ briefId });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ================================================================
// COLLABORATION ENGINE TESTS (~30 endpoints)
// ================================================================

describe('AI Content Brief Generator - Collaboration', () => {
  let app;
  let collaborationId;

  beforeEach(() => {
    app = createApp();
    collaborationId = 'collab-001';
  });

  it('POST /collaboration/:collaborationId/task creates a task', async () => {
    const res = await request(app)
      .post(`/api/ai-content-brief-generator/collaboration/${collaborationId}/task`)
      .send({ 
        title: 'Review Draft',
        assignee: 'john@example.com',
        priority: 'high'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
  });

  it('GET /collaboration/tasks lists all tasks', async () => {
    const res = await request(app).get('/api/ai-content-brief-generator/collaboration/tasks');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /collaboration/:collaborationId/comment creates a comment', async () => {
    const res = await request(app)
      .post(`/api/ai-content-brief-generator/collaboration/${collaborationId}/comment`)
      .send({ 
        text: 'Great work on this section!',
        author: 'jane@example.com'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /collaboration/:collaborationId/approval creates an approval request', async () => {
    const res = await request(app)
      .post(`/api/ai-content-brief-generator/collaboration/${collaborationId}/approval`)
      .send({ 
        type: 'content_review',
        assignee: 'manager@example.com'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /collaboration/:collaborationId/workflow creates a workflow', async () => {
    const res = await request(app)
      .post(`/api/ai-content-brief-generator/collaboration/${collaborationId}/workflow`)
      .send({ 
        name: 'Content Review Workflow',
        stages: [
          { name: 'Draft', assignee: 'writer@example.com' },
          { name: 'Review', assignee: 'editor@example.com' }
        ]
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ================================================================
// DISTRIBUTION ENGINE TESTS (~33 endpoints)
// ================================================================

describe('AI Content Brief Generator - Distribution', () => {
  let app;
  let briefId;
  let planId;

  beforeEach(async () => {
    app = createApp();
    
    const briefRes = await request(app)
      .post('/api/ai-content-brief-generator/research/brief')
      .send({ topic: 'Distribution Test' });
    briefId = briefRes.body.data.id;
  });

  it('POST /distribution/plan creates a distribution plan', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/distribution/plan')
      .send({ 
        briefId,
        name: 'Multi-Channel Launch',
        channels: ['blog', 'email', 'social']
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    planId = res.body.data.id;
  });

  it('GET /distribution/plan/:id returns plan details', async () => {
    const createRes = await request(app)
      .post('/api/ai-content-brief-generator/distribution/plan')
      .send({ briefId, name: 'Test Plan' });
    
    const id = createRes.body.data.id;
    const res = await request(app).get(`/api/ai-content-brief-generator/distribution/plan/${id}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /distribution/plan/:id/channel adds a channel', async () => {
    const createRes = await request(app)
      .post('/api/ai-content-brief-generator/distribution/plan')
      .send({ briefId, name: 'Channel Test' });
    
    const id = createRes.body.data.id;
    const res = await request(app)
      .post(`/api/ai-content-brief-generator/distribution/plan/${id}/channel`)
      .send({ 
        channelId: 'twitter',
        config: { scheduled: true }
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /distribution/schedule creates a schedule', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/distribution/schedule')
      .send({ 
        planId: 'plan-001',
        channel: 'blog',
        publishAt: new Date(Date.now() + 86400000).toISOString()
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /distribution/publish publishes content', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/distribution/publish')
      .send({ 
        planId: 'plan-001',
        channel: 'blog',
        content: 'Published content'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /distribution/plan/:id/readiness checks readiness', async () => {
    const createRes = await request(app)
      .post('/api/ai-content-brief-generator/distribution/plan')
      .send({ briefId, name: 'Readiness Test' });
    
    const id = createRes.body.data.id;
    const res = await request(app).get(`/api/ai-content-brief-generator/distribution/plan/${id}/readiness`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('score');
  });
});

// ================================================================
// GOVERNANCE ENGINE TESTS (~23 endpoints)
// ================================================================

describe('AI Content Brief Generator - Governance', () => {
  let app;
  let briefId;

  beforeEach(async () => {
    app = createApp();
    
    const briefRes = await request(app)
      .post('/api/ai-content-brief-generator/research/brief')
      .send({ topic: 'Governance Test' });
    briefId = briefRes.body.data.id;
  });

  it('POST /governance/compliance/evaluate evaluates compliance', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/governance/compliance/evaluate')
      .send({ 
        briefId,
        content: 'Test content for compliance',
        metadata: {}
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('passed');
  });

  it('POST /governance/policy creates a policy', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/governance/policy')
      .send({ 
        name: 'GDPR Compliance',
        rules: ['No PII', 'Cookie consent']
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /governance/approval/request requests approval', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/governance/approval/request')
      .send({ 
        briefId,
        approverEmail: 'legal@example.com',
        type: 'legal_review'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /governance/violation records a violation', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/governance/violation')
      .send({ 
        briefId,
        policyId: 'policy-001',
        description: 'PII detected in content'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /governance/risk/assess assesses risk', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/governance/risk/assess')
      .send({ briefId });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('riskLevel');
  });
});

// ================================================================
// PERFORMANCE ENGINE TESTS (~20 endpoints)
// ================================================================

describe('AI Content Brief Generator - Performance', () => {
  let app;
  let briefId;

  beforeEach(async () => {
    app = createApp();
    
    const briefRes = await request(app)
      .post('/api/ai-content-brief-generator/research/brief')
      .send({ topic: 'Performance Test' });
    briefId = briefRes.body.data.id;
  });

  it('POST /performance/record records performance data', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/performance/record')
      .send({ 
        briefId,
        metric: 'views',
        value: 1500
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /performance/:briefId returns performance data', async () => {
    const res = await request(app).get(`/api/ai-content-brief-generator/performance/${briefId}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /performance/goal creates a goal', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/performance/goal')
      .send({ 
        briefId,
        metric: 'conversions',
        target: 100,
        deadline: new Date(Date.now() + 30 * 86400000).toISOString()
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /performance/ab-test creates an A/B test', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/performance/ab-test')
      .send({ 
        name: 'Headline Test',
        variants: ['Variant A', 'Variant B'],
        metricName: 'click_rate'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /performance/cohort creates a cohort', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/performance/cohort')
      .send({ 
        name: 'Q1 2026 Cohort',
        definition: { period: 'Q1 2026' }
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /performance/funnel creates a funnel', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/performance/funnel')
      .send({ 
        name: 'Content Funnel',
        steps: ['view', 'read', 'engage', 'convert']
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ================================================================
// AI ORCHESTRATION ENGINE TESTS (~31 endpoints)
// ================================================================

describe('AI Content Brief Generator - AI Orchestration', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('POST /ai/orchestrate orchestrates AI request', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/ai/orchestrate')
      .send({ 
        prompt: 'Generate content brief',
        strategy: 'best_quality'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('provider');
  });

  it('POST /ai/ensemble runs ensemble analysis', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/ai/ensemble')
      .send({ 
        prompt: 'Analyze content strategy'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /ai/providers lists AI providers', async () => {
    const res = await request(app).get('/api/ai-content-brief-generator/ai/providers');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /ai/feedback submits feedback', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/ai/feedback')
      .send({ 
        runId: 'run-001',
        rating: 5,
        comments: 'Excellent output'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /ai/prompt/template creates prompt template', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/ai/prompt/template')
      .send({ 
        name: 'Content Brief Template',
        template: 'Generate a content brief for {{topic}}'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('GET /ai/usage gets usage statistics', async () => {
    const res = await request(app).get('/api/ai-content-brief-generator/ai/usage');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /ai/provider/:providerId/health checks provider health', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/ai/provider/gpt-4/health');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /ai/fallback-chain creates fallback chain', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/ai/fallback-chain')
      .send({ 
        providers: ['gpt-4', 'claude-3', 'gemini-pro']
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

// ================================================================
// CROSS-ENGINE WORKFLOW TESTS
// ================================================================

describe('AI Content Brief Generator - Workflows', () => {
  let app;
  let briefId;

  beforeEach(async () => {
    app = createApp();
    
    const briefRes = await request(app)
      .post('/api/ai-content-brief-generator/research/brief')
      .send({ topic: 'Workflow Test', audience: 'Testers' });
    briefId = briefRes.body.data.id;
  });

  it('POST /workflows/brief-to-publish executes full pipeline', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/workflows/brief-to-publish')
      .send({ 
        topicIdea: 'AI Content Marketing',
        targetAudience: 'Marketing Directors',
        primaryKeyword: 'content AI'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('brief');
    expect(res.body.data).toHaveProperty('outline');
    expect(res.body.data).toHaveProperty('seoScore');
    expect(res.body.data).toHaveProperty('compliance');
  });

  it('POST /workflows/content-audit performs content audit', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/workflows/content-audit')
      .send({ briefId });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('research');
    expect(res.body.data).toHaveProperty('seo');
    expect(res.body.data).toHaveProperty('compliance');
  });

  it('POST /workflows/approval-chain creates approval workflow', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/workflows/approval-chain')
      .send({ 
        briefId,
        approvers: ['editor@example.com', 'legal@example.com']
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ================================================================
// BATCH OPERATIONS TESTS
// ================================================================

describe('AI Content Brief Generator - Batch Operations', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('POST /batch/briefs/create creates multiple briefs', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/batch/briefs/create')
      .send({ 
        briefs: [
          { topic: 'Topic 1', audience: 'Audience 1' },
          { topic: 'Topic 2', audience: 'Audience 2' },
          { topic: 'Topic 3', audience: 'Audience 3' }
        ]
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(3);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /batch/compliance/evaluate evaluates multiple briefs', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/batch/compliance/evaluate')
      .send({ 
        briefIds: ['brief-001', 'brief-002', 'brief-003']
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /batch/stats returns batch statistics', async () => {
    const res = await request(app).get('/api/ai-content-brief-generator/batch/stats');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('briefs');
    expect(res.body.data).toHaveProperty('outlines');
  });
});

// ================================================================
// SYSTEM UTILITIES TESTS
// ================================================================

describe('AI Content Brief Generator - System', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('GET /system/version returns version info', async () => {
    const res = await request(app).get('/api/ai-content-brief-generator/system/version');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('api');
    expect(res.body.data).toHaveProperty('engines');
  });

  it('GET /system/capabilities lists capabilities', async () => {
    const res = await request(app).get('/api/ai-content-brief-generator/system/capabilities');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('engines');
    expect(res.body.data).toHaveProperty('features');
  });

  it('POST /system/validate validates request', async () => {
    const res = await request(app)
      .post('/api/ai-content-brief-generator/system/validate')
      .send({ 
        endpoint: '/research/brief',
        data: { topic: 'Test' }
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('valid');
  });

  it('GET /system/metrics returns system metrics', async () => {
    const res = await request(app).get('/api/ai-content-brief-generator/system/metrics');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('uptime');
    expect(res.body.data).toHaveProperty('memory');
  });
});
