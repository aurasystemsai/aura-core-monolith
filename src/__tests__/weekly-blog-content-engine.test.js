const request = require('supertest');
const app = require('../server');

describe('Weekly Blog Content Engine (enterprise)', () => {
  it('responds to health', async () => {
    const res = await request(app).get('/api/weekly-blog-content-engine/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('status');
  });

  it('returns stats snapshot', async () => {
    const res = await request(app).get('/api/weekly-blog-content-engine/stats');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('stats');
    expect(res.body.stats).toHaveProperty('research');
    expect(res.body.stats).toHaveProperty('ai');
  });

  it('creates research and scores intent', async () => {
    const createRes = await request(app)
      .post('/api/weekly-blog-content-engine/research')
      .send({ topic: 'Weekly cadence for SaaS', primaryKeyword: 'weekly blog content' });
    expect(createRes.statusCode).toBe(201);
    expect(createRes.body).toHaveProperty('success', true);
    expect(createRes.body.data).toHaveProperty('researchId');

    const scoreRes = await request(app)
      .post('/api/weekly-blog-content-engine/research/score')
      .send({ topic: 'Weekly cadence for SaaS' });
    expect(scoreRes.statusCode).toBe(200);
    expect(scoreRes.body).toHaveProperty('success', true);
    expect(scoreRes.body.data).toHaveProperty('score');
  });

  it('runs AI orchestrator deterministically', async () => {
    const res = await request(app)
      .post('/api/weekly-blog-content-engine/ai/orchestrate')
      .send({ strategy: 'best-of-n', posts: 4, primaryKeyword: 'blog content plan' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('qualityScore');
  });

  it('returns SEO metadata analysis', async () => {
    const res = await request(app)
      .post('/api/weekly-blog-content-engine/seo/metadata')
      .send({ title: 'Weekly Blog Plan', description: 'A concise plan for weekly SEO content', keywords: ['blog plan'] });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('score');
    expect(res.body.data).toHaveProperty('grade');
  });
});
