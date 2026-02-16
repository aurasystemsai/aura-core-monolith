const request = require('supertest');
const express = require('express');
const router = require('./router');

// Create a test app with the router
const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/blog-draft-engine', router);
  return app;
};

describe('Blog Draft Engine - Health & Stats', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('GET /api/blog-draft-engine/health returns status ok', async () => {
    const res = await request(app).get('/api/blog-draft-engine/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/blog-draft-engine/stats returns stats object', async () => {
    const res = await request(app).get('/api/blog-draft-engine/stats');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.stats).toBeDefined();
    expect(res.body.stats).toHaveProperty('ideas');
    expect(res.body.stats).toHaveProperty('briefs');
    expect(res.body.stats).toHaveProperty('drafts');
  });
});

describe('Blog Draft Engine - Ideation & Research', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('POST /api/blog-draft-engine/ideation/ideas creates a new idea', async () => {
    const payload = {
      title: 'Test Content Idea',
      keyword: 'content marketing',
      audience: 'marketers',
      intent: 'informational',
    };
    const res = await request(app)
      .post('/api/blog-draft-engine/ideation/ideas')
      .send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.title).toBe('Test Content Idea');
    expect(res.body.data.keyword).toBe('content marketing');
  });

  it('GET /api/blog-draft-engine/ideation/ideas returns all ideas', async () => {
    // Create an idea first
    await request(app)
      .post('/api/blog-draft-engine/ideation/ideas')
      .send({ title: 'Idea 1', keyword: 'seo' });
    
    const res = await request(app).get('/api/blog-draft-engine/ideation/ideas');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/blog-draft-engine/ideation/ideas/:id returns specific idea', async () => {
    const createRes = await request(app)
      .post('/api/blog-draft-engine/ideation/ideas')
      .send({ title: 'Specific Idea', keyword: 'testing' });
    
    const id = createRes.body.data.id;
    const res = await request(app).get(`/api/blog-draft-engine/ideation/ideas/${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(id);
    expect(res.body.data.title).toBe('Specific Idea');
  });

  it('PUT /api/blog-draft-engine/ideation/ideas/:id updates an idea', async () => {
    const createRes = await request(app)
      .post('/api/blog-draft-engine/ideation/ideas')
      .send({ title: 'Original Title', keyword: 'original' });
    
    const id = createRes.body.data.id;
    const res = await request(app)
      .put(`/api/blog-draft-engine/ideation/ideas/${id}`)
      .send({ title: 'Updated Title', keyword: 'updated' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated Title');
    expect(res.body.data.keyword).toBe('updated');
  });

  it('DELETE /api/blog-draft-engine/ideation/ideas/:id deletes an idea', async () => {
    const createRes = await request(app)
      .post('/api/blog-draft-engine/ideation/ideas')
      .send({ title: 'To Delete', keyword: 'delete' });
    
    const id = createRes.body.data.id;
    const res = await request(app).delete(`/api/blog-draft-engine/ideation/ideas/${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it's deleted
    const getRes = await request(app).get(`/api/blog-draft-engine/ideation/ideas/${id}`);
    expect(getRes.statusCode).toBe(404);
  });

  it('POST /api/blog-draft-engine/ideation/ideas/:id/score scores an idea', async () => {
    const createRes = await request(app)
      .post('/api/blog-draft-engine/ideation/ideas')
      .send({ title: 'Score Me', keyword: 'scoring' });
    
    const id = createRes.body.data.id;
    const res = await request(app).post(`/api/blog-draft-engine/ideation/ideas/${id}/score`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('intentScore');
    expect(res.body.data).toHaveProperty('competitiveGap');
  });
});

describe('Blog Draft Engine - Briefs & Outlines', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('POST /api/blog-draft-engine/briefs creates a new brief', async () => {
    const payload = {
      title: 'Test Brief',
      primaryKeyword: 'testing',
      targetWords: 1500,
      audience: 'developers',
    };
    const res = await request(app)
      .post('/api/blog-draft-engine/briefs')
      .send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.title).toBe('Test Brief');
  });

  it('GET /api/blog-draft-engine/briefs returns all briefs', async () => {
    const res = await request(app).get('/api/blog-draft-engine/briefs');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/blog-draft-engine/briefs/:id/grade grades a brief', async () => {
    const createRes = await request(app)
      .post('/api/blog-draft-engine/briefs')
      .send({ title: 'Grade Me', primaryKeyword: 'grading' });
    
    const id = createRes.body.data.id;
    const res = await request(app).post(`/api/blog-draft-engine/briefs/${id}/grade`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('score');
    expect(res.body.data).toHaveProperty('grade');
  });

  it('POST /api/blog-draft-engine/briefs/:id/outlines creates an outline', async () => {
    const createRes = await request(app)
      .post('/api/blog-draft-engine/briefs')
      .send({ title: 'With Outline', primaryKeyword: 'outline' });
    
    const id = createRes.body.data.id;
    const outlinePayload = {
      sections: [
        { heading: 'Introduction', notes: 'Hook the reader', targetWords: 150 },
        { heading: 'Main Content', notes: 'Core value', targetWords: 800 },
      ],
    };
    const res = await request(app)
      .post(`/api/blog-draft-engine/briefs/${id}/outlines`)
      .send(outlinePayload);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.sections).toHaveLength(2);
  });

  it('GET /api/blog-draft-engine/briefs/:briefId/outlines returns outlines for brief', async () => {
    const createRes = await request(app)
      .post('/api/blog-draft-engine/briefs')
      .send({ title: 'Brief with Outlines', primaryKeyword: 'outlines' });
    
    const briefId = createRes.body.data.id;
    const res = await request(app).get(`/api/blog-draft-engine/briefs/${briefId}/outlines`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('Blog Draft Engine - Drafting', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('POST /api/blog-draft-engine/drafts creates a new draft', async () => {
    const payload = {
      title: 'Test Draft',
      primaryKeyword: 'drafting',
      content: 'This is the draft content.',
      status: 'draft',
    };
    const res = await request(app)
      .post('/api/blog-draft-engine/drafts')
      .send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.title).toBe('Test Draft');
  });

  it('GET /api/blog-draft-engine/drafts returns all drafts', async () => {
    const res = await request(app).get('/api/blog-draft-engine/drafts');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/blog-draft-engine/drafts/:id/versions creates a version', async () => {
    const createRes = await request(app)
      .post('/api/blog-draft-engine/drafts')
      .send({ title: 'Versioned Draft', content: 'Version 1 content' });
    
    const id = createRes.body.data.id;
    const res = await request(app)
      .post(`/api/blog-draft-engine/drafts/${id}/versions`)
      .send({ content: 'Version 2 content', notes: 'Updated intro' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('versionNumber');
  });

  it('GET /api/blog-draft-engine/drafts/:id/versions returns all versions', async () => {
    const createRes = await request(app)
      .post('/api/blog-draft-engine/drafts')
      .send({ title: 'Draft with Versions', content: 'Original' });
    
    const id = createRes.body.data.id;
    const res = await request(app).get(`/api/blog-draft-engine/drafts/${id}/versions`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/blog-draft-engine/drafts/:id/editorial-check runs editorial checks', async () => {
    const createRes = await request(app)
      .post('/api/blog-draft-engine/drafts')
      .send({ title: 'Check Me', content: 'Content to check for quality.' });
    
    const id = createRes.body.data.id;
    const res = await request(app).post(`/api/blog-draft-engine/drafts/${id}/editorial-check`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('grammarIssues');
    expect(res.body.data).toHaveProperty('passiveVoiceCount');
  });

  it('POST /api/blog-draft-engine/drafts/:id/readability analyzes readability', async () => {
    const createRes = await request(app)
      .post('/api/blog-draft-engine/drafts')
      .send({ title: 'Readability Test', content: 'Simple content for reading.' });
    
    const id = createRes.body.data.id;
    const res = await request(app).post(`/api/blog-draft-engine/drafts/${id}/readability`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('fleschScore');
    expect(res.body.data).toHaveProperty('gradeLevel');
  });
});

describe('Blog Draft Engine - SEO Optimizer', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('POST /api/blog-draft-engine/seo/analyze analyzes SEO', async () => {
    const payload = {
      title: 'SEO Test Article',
      metaDescription: 'Description for SEO testing purposes.',
      content: 'Content with keywords for SEO analysis.',
      primaryKeyword: 'seo testing',
    };
    const res = await request(app)
      .post('/api/blog-draft-engine/seo/analyze')
      .send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('score');
    expect(res.body.data).toHaveProperty('grade');
    expect(res.body.data).toHaveProperty('metadata');
    expect(res.body.data).toHaveProperty('content');
  });

  it('POST /api/blog-draft-engine/seo/optimize-metadata optimizes metadata', async () => {
    const payload = {
      title: 'Original Title',
      metaDescription: 'Original description',
      primaryKeyword: 'optimization',
    };
    const res = await request(app)
      .post('/api/blog-draft-engine/seo/optimize-metadata')
      .send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('optimizedTitle');
    expect(res.body.data).toHaveProperty('optimizedDescription');
    expect(res.body.data).toHaveProperty('slug');
  });

  it('POST /api/blog-draft-engine/seo/schema generates schema markup', async () => {
    const payload = {
      type: 'Article',
      title: 'Schema Test',
      author: 'Test Author',
      datePublished: '2026-02-14',
    };
    const res = await request(app)
      .post('/api/blog-draft-engine/seo/schema')
      .send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('schema');
    expect(res.body.data.schema).toHaveProperty('@type');
  });

  it('POST /api/blog-draft-engine/seo/audit-images audits images', async () => {
    const payload = {
      images: [
        { src: 'image1.jpg', alt: 'Test image' },
        { src: 'image2.jpg', alt: '' },
      ],
    };
    const res = await request(app)
      .post('/api/blog-draft-engine/seo/audit-images')
      .send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalImages');
    expect(res.body.data).toHaveProperty('missingAlt');
  });
});

describe('Blog Draft Engine - Distribution Channels', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('POST /api/blog-draft-engine/distribution/channels creates a channel', async () => {
    const payload = {
      name: 'LinkedIn',
      platform: 'linkedin',
      enabled: true,
    };
    const res = await request(app)
      .post('/api/blog-draft-engine/distribution/channels')
      .send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.name).toBe('LinkedIn');
  });

  it('GET /api/blog-draft-engine/distribution/channels returns all channels', async () => {
    const res = await request(app).get('/api/blog-draft-engine/distribution/channels');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/blog-draft-engine/distribution/plans creates a distribution plan', async () => {
    const payload = {
      name: 'Launch Plan',
      channels: ['linkedin', 'twitter'],
      schedule: 'immediate',
    };
    const res = await request(app)
      .post('/api/blog-draft-engine/distribution/plans')
      .send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
  });

  it('POST /api/blog-draft-engine/distribution/optimize optimizes content for platform', async () => {
    const payload = {
      platform: 'linkedin',
      content: 'Original blog post content to optimize for LinkedIn.',
    };
    const res = await request(app)
      .post('/api/blog-draft-engine/distribution/optimize')
      .send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('optimizedContent');
    expect(res.body.data).toHaveProperty('platform');
  });
});

describe('Blog Draft Engine - Collaboration & Workflow', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('POST /api/blog-draft-engine/collaboration/tasks creates a task', async () => {
    const payload = {
      title: 'Review draft',
      assignee: 'editor@example.com',
      priority: 'high',
      dueDate: '2026-03-01',
    };
    const res = await request(app)
      .post('/api/blog-draft-engine/collaboration/tasks')
      .send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.title).toBe('Review draft');
  });

  it('GET /api/blog-draft-engine/collaboration/tasks returns all tasks', async () => {
    const res = await request(app).get('/api/blog-draft-engine/collaboration/tasks');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/blog-draft-engine/collaboration/comments creates a comment', async () => {
    const payload = {
      entityType: 'draft',
      entityId: 'draft-123',
      userId: 'user-456',
      content: 'This needs revision in the intro.',
    };
    const res = await request(app)
      .post('/api/blog-draft-engine/collaboration/comments')
      .send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.content).toBe('This needs revision in the intro.');
  });

  it('POST /api/blog-draft-engine/collaboration/comments/:id/reactions adds a reaction', async () => {
    const createRes = await request(app)
      .post('/api/blog-draft-engine/collaboration/comments')
      .send({ entityType: 'draft', entityId: 'draft-123', content: 'Great work!' });
    
    const id = createRes.body.data.id;
    const res = await request(app)
      .post(`/api/blog-draft-engine/collaboration/comments/${id}/reactions`)
      .send({ userId: 'user-789', reaction: '👍' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Blog Draft Engine - Performance Analytics', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('POST /api/blog-draft-engine/performance/track tracks metrics', async () => {
    const payload = {
      contentId: 'draft-123',
      metrics: {
        views: 1500,
        engagement: 0.35,
        conversions: 12,
      },
    };
    const res = await request(app)
      .post('/api/blog-draft-engine/performance/track')
      .send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
  });

  it('GET /api/blog-draft-engine/performance/:contentId returns metrics', async () => {
    const contentId = 'draft-456';
    await request(app)
      .post('/api/blog-draft-engine/performance/track')
      .send({ contentId, metrics: { views: 2000 } });
    
    const res = await request(app).get(`/api/blog-draft-engine/performance/${contentId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('contentId', contentId);
  });

  it('POST /api/blog-draft-engine/performance/forecast forecasts performance', async () => {
    const payload = {
      contentId: 'draft-789',
      historicalData: [
        { date: '2026-01-01', views: 1000 },
        { date: '2026-01-15', views: 1200 },
      ],
    };
    const res = await request(app)
      .post('/api/blog-draft-engine/performance/forecast')
      .send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('forecast');
  });
});

describe('Blog Draft Engine - AI Orchestration', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('POST /api/blog-draft-engine/ai/providers creates an AI provider', async () => {
    const payload = {
      name: 'GPT-4',
      type: 'openai',
      enabled: true,
    };
    const res = await request(app)
      .post('/api/blog-draft-engine/ai/providers')
      .send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.name).toBe('GPT-4');
  });

  it('GET /api/blog-draft-engine/ai/providers returns all providers', async () => {
    const res = await request(app).get('/api/blog-draft-engine/ai/providers');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/blog-draft-engine/ai/route routes AI request', async () => {
    const payload = {
      task: 'Generate blog outline',
      strategy: 'best-of-n',
      n: 3,
    };
    const res = await request(app)
      .post('/api/blog-draft-engine/ai/route')
      .send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('selectedProvider');
  });

  it('POST /api/blog-draft-engine/ai/ensemble runs ensemble method', async () => {
    const payload = {
      task: 'Content generation',
      providers: ['gpt-4', 'claude-3'],
    };
    const res = await request(app)
      .post('/api/blog-draft-engine/ai/ensemble')
      .send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('combinedResult');
  });
});

describe('Blog Draft Engine - Cross-Engine Workflows', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('POST /api/blog-draft-engine/workflows/content-pipeline runs full pipeline', async () => {
    const payload = {
      title: 'Pipeline Test',
      keyword: 'testing',
      audience: 'developers',
    };
    const res = await request(app)
      .post('/api/blog-draft-engine/workflows/content-pipeline')
      .send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('ideaId');
    expect(res.body.data).toHaveProperty('briefId');
    expect(res.body.data).toHaveProperty('draftId');
  });

  it('POST /api/blog-draft-engine/workflows/bulk-create creates multiple items', async () => {
    const payload = {
      type: 'ideas',
      items: [
        { title: 'Idea 1', keyword: 'keyword1' },
        { title: 'Idea 2', keyword: 'keyword2' },
      ],
    };
    const res = await request(app)
      .post('/api/blog-draft-engine/workflows/bulk-create')
      .send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('created');
    expect(res.body.data.created).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/blog-draft-engine/workflows/search searches across all entities', async () => {
    const res = await request(app)
      .get('/api/blog-draft-engine/workflows/search')
      .query({ q: 'test', type: 'all' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('results');
  });

  it('GET /api/blog-draft-engine/workflows/analytics/dashboard returns dashboard data', async () => {
    const res = await request(app).get('/api/blog-draft-engine/workflows/analytics/dashboard');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalIdeas');
    expect(res.body.data).toHaveProperty('totalBriefs');
    expect(res.body.data).toHaveProperty('totalDrafts');
  });
});
