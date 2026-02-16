const request = require('supertest');
const express = require('express');
const router = require('../tools/blog-seo/router');

const app = express();
app.use(express.json());
app.use('/api/blog-seo', router);

let researchId;
let clusterId;
let briefId;
let outlineId;
let sprintId;
let perfId;
let runId;

describe('Blog SEO Engine - Enterprise Suite', () => {
  // ---------------------------------------------------------------------------
  // SYSTEM
  // ---------------------------------------------------------------------------
  test('health returns ok', async () => {
    const res = await request(app).get('/api/blog-seo/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('stats returns all engines', async () => {
    const res = await request(app).get('/api/blog-seo/stats');
    expect(res.status).toBe(200);
    expect(res.body.stats).toHaveProperty('research');
    expect(res.body.stats).toHaveProperty('keywords');
    expect(res.body.stats).toHaveProperty('briefs');
    expect(res.body.stats).toHaveProperty('ai');
  });

  // ---------------------------------------------------------------------------
  // RESEARCH
  // ---------------------------------------------------------------------------
  test('create and fetch research', async () => {
    const create = await request(app).post('/api/blog-seo/research/create').send({ topic: 'Blog SEO strategy' });
    expect(create.status).toBe(201);
    expect(create.body.data).toHaveProperty('id');
    researchId = create.body.data.id;

    const get = await request(app).get(`/api/blog-seo/research/${researchId}`);
    expect(get.status).toBe(200);
    expect(get.body.data.topic).toContain('Blog SEO');
  });

  test('score intent and list notes', async () => {
    const score = await request(app).post('/api/blog-seo/research/score').send({ topic: 'Blog SEO strategy' });
    expect(score.status).toBe(200);
    expect(score.body.data).toHaveProperty('score');

    const note = await request(app).post('/api/blog-seo/research/notes').send({ researchId, note: 'Add SERP proof' });
    expect(note.status).toBe(201);

    const notes = await request(app).get(`/api/blog-seo/research/${researchId}/notes`);
    expect(notes.status).toBe(200);
    expect(Array.isArray(notes.body.data)).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // KEYWORDS
  // ---------------------------------------------------------------------------
  test('create, refresh, and import keyword cluster', async () => {
    const create = await request(app).post('/api/blog-seo/keywords/cluster').send({ primaryKeyword: 'blog seo' });
    expect(create.status).toBe(201);
    clusterId = create.body.data.id;

    const refresh = await request(app).post('/api/blog-seo/keywords/refresh').send({ clusterId });
    expect(refresh.status).toBe(200);
    expect(refresh.body.data).toHaveProperty('updatedAt');

    const imported = await request(app).post('/api/blog-seo/keywords/import').send({ keywords: ['blog seo tips', 'blog seo checklist'] });
    expect(imported.status).toBe(200);
    expect(imported.body.data.total).toBeGreaterThan(0);
  });

  test('evaluate keyword and list clusters', async () => {
    const evalRes = await request(app).post('/api/blog-seo/keywords/evaluate').send({ keyword: 'blog seo checklist' });
    expect(evalRes.status).toBe(200);
    expect(evalRes.body.data).toHaveProperty('difficulty');

    const list = await request(app).get('/api/blog-seo/keywords/clusters');
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.data)).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // BRIEFS
  // ---------------------------------------------------------------------------
  test('create brief, score, and version', async () => {
    const create = await request(app).post('/api/blog-seo/briefs').send({ title: 'Enterprise Blog SEO' });
    expect(create.status).toBe(201);
    briefId = create.body.data.id;

    const score = await request(app).post(`/api/blog-seo/briefs/${briefId}/score`).send({ suggestions: ['Add FAQ'] });
    expect(score.status).toBe(200);
    expect(score.body.data).toHaveProperty('grade');

    const version = await request(app).post(`/api/blog-seo/briefs/${briefId}/version`).send({ name: 'v2' });
    expect(version.status).toBe(201);
  });

  test('get brief compliance and versions', async () => {
    const compliance = await request(app).get(`/api/blog-seo/briefs/${briefId}/compliance`);
    expect(compliance.status).toBe(200);
    expect(compliance.body.data).toHaveProperty('checks');

    const versions = await request(app).get(`/api/blog-seo/briefs/${briefId}/versions`);
    expect(versions.status).toBe(200);
    expect(Array.isArray(versions.body.data)).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // OUTLINES
  // ---------------------------------------------------------------------------
  test('generate, update, and grade outline', async () => {
    const create = await request(app).post('/api/blog-seo/outline/generate').send({ briefId });
    expect(create.status).toBe(201);
    outlineId = create.body.data.outlineId;

    const update = await request(app).put(`/api/blog-seo/outline/${outlineId}`).send({
      sections: [
        { heading: 'Intro', wordCount: 120 },
        { heading: 'Keyword strategy', wordCount: 240 },
      ],
    });
    expect(update.status).toBe(200);

    const grade = await request(app).get(`/api/blog-seo/outline/${outlineId}/grade`);
    expect(grade.status).toBe(200);
    expect(grade.body.data).toHaveProperty('score');
  });

  test('list outlines and versions', async () => {
    const version = await request(app).post(`/api/blog-seo/outline/${outlineId}/version`).send({ label: 'v2' });
    expect(version.status).toBe(201);

    const list = await request(app).get('/api/blog-seo/outline');
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.data)).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // ON-PAGE
  // ---------------------------------------------------------------------------
  test('analyze metadata and schema', async () => {
    const meta = await request(app).post('/api/blog-seo/onpage/metadata').send({
      title: 'Blog SEO Guide',
      description: 'Long-form blog SEO guide with schema and internal links.',
      keywords: ['blog seo', 'schema'],
    });
    expect(meta.status).toBe(200);
    expect(meta.body.data).toHaveProperty('score');

    const schema = await request(app).post('/api/blog-seo/onpage/schema').send({ contentType: 'Article' });
    expect(schema.status).toBe(200);
    expect(schema.body.data.required).toContain('headline');
  });

  test('audit and link validation', async () => {
    const audit = await request(app).post('/api/blog-seo/onpage/audit').send({ url: 'https://example.com/blog-seo' });
    expect(audit.status).toBe(200);

    const links = await request(app).post('/api/blog-seo/onpage/links').send({
      links: [
        { url: '/blog/seo', type: 'internal', status: 200 },
        { url: 'https://example.com', type: 'external', status: 200 },
      ],
    });
    expect(links.status).toBe(200);
  });

  // ---------------------------------------------------------------------------
  // INTERNAL LINKS
  // ---------------------------------------------------------------------------
  test('suggest links and approve sprint', async () => {
    const suggest = await request(app).post('/api/blog-seo/links/suggest').send({ contentId: briefId });
    expect(suggest.status).toBe(201);
    const suggestionId = suggest.body.data.id;

    const approve = await request(app).post('/api/blog-seo/links/approve').send({ suggestionId });
    expect(approve.status).toBe(200);

    const sprint = await request(app).post('/api/blog-seo/links/sprint').send({ name: 'Sprint 1' });
    expect(sprint.status).toBe(201);
    sprintId = sprint.body.data.id;

    const map = await request(app).get(`/api/blog-seo/links/map/${sprintId}`);
    expect(map.status).toBe(200);
  });

  // ---------------------------------------------------------------------------
  // PERFORMANCE
  // ---------------------------------------------------------------------------
  test('record performance and forecast', async () => {
    const record = await request(app).post('/api/blog-seo/performance/record').send({ contentId: briefId, views: 1200 });
    expect(record.status).toBe(201);
    perfId = record.body.data.contentId;

    const get = await request(app).get(`/api/blog-seo/performance/${perfId}`);
    expect(get.status).toBe(200);

    const forecast = await request(app).post('/api/blog-seo/performance/forecast').send({ contentId: perfId });
    expect(forecast.status).toBe(200);
  });

  test('compare performance periods', async () => {
    const compare = await request(app).post('/api/blog-seo/performance/compare').send({
      current: { views: 1200, conversions: 90 },
      previous: { views: 950, conversions: 70 },
    });
    expect(compare.status).toBe(200);
    expect(compare.body.data.lift).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // AI ORCHESTRATION
  // ---------------------------------------------------------------------------
  test('orchestrate, ensemble, and feedback', async () => {
    const run = await request(app).post('/api/blog-seo/ai/orchestrate').send({ primaryKeyword: 'blog seo' });
    expect(run.status).toBe(201);
    runId = run.body.data.id;

    const ensemble = await request(app).post('/api/blog-seo/ai/ensemble').send({ primaryKeyword: 'blog seo' });
    expect(ensemble.status).toBe(201);

    const providers = await request(app).get('/api/blog-seo/ai/providers');
    expect(providers.status).toBe(200);
    expect(Array.isArray(providers.body.data)).toBe(true);

    const feedback = await request(app).post('/api/blog-seo/ai/feedback').send({ runId, feedback: 'Great quality' });
    expect(feedback.status).toBe(200);
  });

  test('get run and stats', async () => {
    const run = await request(app).get(`/api/blog-seo/ai/run/${runId}`);
    expect(run.status).toBe(200);
    expect(run.body.data).toHaveProperty('strategy');

    const stats = await request(app).get('/api/blog-seo/ai/stats');
    expect(stats.status).toBe(200);
  });

  // ---------------------------------------------------------------------------
  // E2E JOURNEY
  // ---------------------------------------------------------------------------
  test('end-to-end flow returns healthy readiness', async () => {
    // research -> cluster -> brief -> outline -> on-page -> performance -> ai
    const research = await request(app).post('/api/blog-seo/research/create').send({ topic: 'E2E blog seo' });
    expect(research.status).toBe(201);

    const cluster = await request(app).post('/api/blog-seo/keywords/cluster').send({ primaryKeyword: 'e2e seo' });
    expect(cluster.status).toBe(201);

    const brief = await request(app).post('/api/blog-seo/briefs').send({ title: 'E2E SEO Brief', primaryKeyword: 'e2e seo' });
    expect(brief.status).toBe(201);

    const outline = await request(app).post('/api/blog-seo/outline/generate').send({ briefId: brief.body.data.id });
    expect(outline.status).toBe(201);

    const meta = await request(app).post('/api/blog-seo/onpage/metadata').send({ title: 'E2E SEO', description: 'Meta for e2e', keywords: ['e2e seo'] });
    expect(meta.status).toBe(200);
    expect(meta.body.data.score).toBeGreaterThan(50);

    const perf = await request(app).post('/api/blog-seo/performance/record').send({ contentId: brief.body.data.id });
    expect(perf.status).toBe(201);

    const ai = await request(app).post('/api/blog-seo/ai/orchestrate').send({ primaryKeyword: 'e2e seo' });
    expect(ai.status).toBe(201);
  });
});
