process.env.IMAGE_ALT_MEDIA_SEO_INMEMORY = 'true';

jest.mock('better-sqlite3', () => {
  return function MockedDB() {
    return {
      pragma: () => {},
      prepare: () => ({ run: () => {}, all: () => [], get: () => null }),
      exec: () => {},
      close: () => {},
    };
  };
});

jest.mock('../core/analyticsScheduler', () => ({ start: jest.fn() }));
jest.mock('../core/db', () => {
  const noop = () => {};
  const asyncNoop = async () => ({});
  return {
    type: 'mock',
    query: asyncNoop,
    queryAll: async () => [],
    queryOne: async () => null,
    exec: asyncNoop,
    prepare: () => ({ run: noop, get: noop, all: noop }),
    close: noop,
  };
});

const request = require('supertest');
const app = require('../server');

describe('Image Alt Media SEO', () => {
  test('lint clamps alt text to 400 chars', async () => {
    const longAlt = 'a'.repeat(500);
    const res = await request(app)
      .post('/api/image-alt-media-seo/lint')
      .send({ altText: longAlt });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('lint');
    expect(res.body.lint).toHaveProperty('length', 400);
  });

  test('import rejects payloads over 200 items', async () => {
    const items = Array.from({ length: 201 }).map((_, i) => ({
      altText: `item ${i}`,
      url: `https://example.com/${i}.jpg`,
    }));

    const res = await request(app)
      .post('/api/image-alt-media-seo/import')
      .send({ items, dryRun: true });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/Max 200 items/);
  });

  test('import dry-run can export validation errors as JSON', async () => {
    const items = [{ altText: '', url: 'https://example.com/img.jpg' }];

    const res = await request(app)
      .post('/api/image-alt-media-seo/import')
      .send({ items, dryRun: true, errorExport: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
    expect(res.headers['content-disposition'] || '').toMatch(/import-errors\.json/);
  });

  test('batch-generate records run summary and surfaces metrics', async () => {
    const batch = [
      { imageDescription: 'red running shoes on white background', url: 'https://example.com/running-shoes.jpg' },
      { imageDescription: 'navy backpack front view', url: 'https://example.com/backpack.png' },
    ];

    const runRes = await request(app)
      .post('/api/image-alt-media-seo/ai/batch-generate')
      .send({ items: batch, chunkSize: 1, paceMs: 0, tone: 'balanced', verbosity: 'terse' });

    expect(runRes.statusCode).toBe(200);
    expect(runRes.body.ok).toBe(true);
    expect(runRes.body.summary).toBeDefined();
    expect(runRes.body.summary.total).toBe(batch.length);
    expect(runRes.body.results).toHaveLength(batch.length);
    expect(runRes.body.results.every(r => r.ok)).toBe(true);

    const runsRes = await request(app).get('/api/image-alt-media-seo/runs');
    expect(runsRes.statusCode).toBe(200);
    expect(runsRes.body.ok).toBe(true);
    expect(Array.isArray(runsRes.body.runs)).toBe(true);
    expect(runsRes.body.runs.length).toBeGreaterThan(0);
    const latestRun = runsRes.body.runs[0];
    expect(latestRun.total).toBe(batch.length);

    const metricsRes = await request(app).get('/api/image-alt-media-seo/metrics');
    expect(metricsRes.statusCode).toBe(200);
    expect(metricsRes.body.ok).toBe(true);
    expect(metricsRes.body.metrics.totalRuns).toBeGreaterThan(0);
    expect(metricsRes.body.metrics.totalItems).toBeGreaterThanOrEqual(batch.length);
    expect(metricsRes.body.metrics.lastRun.total).toBe(batch.length);
    expect(metricsRes.body.metrics.lastRun.runId || metricsRes.body.metrics.lastRun.id).toBe(runRes.body.summary.id);
  });

  test('single generate can return multiple variants', async () => {
    const res = await request(app)
      .post('/api/image-alt-media-seo/ai/generate')
      .send({ input: 'modern lamp on desk', url: 'https://example.com/lamp.jpg', variantCount: 3, safeMode: false });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.variants)).toBe(true);
    expect(res.body.variants.length).toBe(3);
    expect(res.body.result).toBeTruthy();
    // primary result should come from first variant
    expect(res.body.variants[0].altText).toBe(res.body.raw || res.body.variants[0].altText);
  });

  test('batch generate returns per-item variants', async () => {
    const batch = [
      { imageDescription: 'blue notebook on table', url: 'https://example.com/notebook.jpg', variantCount: 2 },
      { imageDescription: 'green water bottle closeup', url: 'https://example.com/bottle.png', variantCount: 2 },
    ];

    const res = await request(app)
      .post('/api/image-alt-media-seo/ai/batch-generate')
      .send({ items: batch, chunkSize: 2, variantCount: 2, safeMode: false });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.results).toHaveLength(batch.length);
    res.body.results.forEach(r => {
      expect(r.ok).toBe(true);
      expect(Array.isArray(r.variants)).toBe(true);
      expect(r.variants.length).toBe(2);
      expect(r.result).toBeTruthy();
    });
  });

  test('caption endpoint returns single-sentence caption', async () => {
    const res = await request(app)
      .post('/api/image-alt-media-seo/ai/caption')
      .send({ input: 'red ceramic mug on wooden table', url: 'https://example.com/mug.jpg', keywords: 'mug, ceramic', safeMode: false });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.caption).toBe('string');
    expect(res.body.caption.length).toBeGreaterThan(0);
    expect(res.body.lint).toBeDefined();
  });

  test('bulk update alts works and clears cache', async () => {
    const createRes = await request(app).post('/api/image-alt-media-seo/images').send({ url: 'https://example.com/bulk.jpg', altText: 'old alt' });
    const id = createRes.body.image.id;
    await request(app).post('/api/image-alt-media-seo/analytics/cache/clear');
    await request(app).get('/api/image-alt-media-seo/analytics'); // prime cache
    const res = await request(app)
      .post('/api/image-alt-media-seo/images/bulk-update')
      .send({ items: [{ id, altText: 'new alt text' }] });
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.updated[0].ok).toBe(true);
    const analyticsRes = await request(app).get('/api/image-alt-media-seo/analytics');
    expect(analyticsRes.body.cached).toBe(false);
  });

  test('openai health endpoint reports configured flag', async () => {
    const res = await request(app).get('/api/image-alt-media-seo/health/openai');
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body).toHaveProperty('configured');
  });

  test('analytics cache flags cached responses and clears on mutation', async () => {
    await request(app).post('/api/image-alt-media-seo/analytics/cache/clear');

    const first = await request(app).get('/api/image-alt-media-seo/analytics');
    expect(first.statusCode).toBe(200);
    expect(first.body.ok).toBe(true);
    expect(first.body.cached).toBe(false);

    const second = await request(app).get('/api/image-alt-media-seo/analytics');
    expect(second.statusCode).toBe(200);
    expect(second.body.cached).toBe(true);

    // mutate data and expect cache invalidated
    await request(app).post('/api/image-alt-media-seo/images').send({ url: 'https://example.com/cache-test.jpg', altText: 'cache test alt' });
    const third = await request(app).get('/api/image-alt-media-seo/analytics');
    expect(third.statusCode).toBe(200);
    expect(third.body.cached).toBe(false);
    expect(third.body.analytics.totalImages).toBeGreaterThanOrEqual(1);
  });

  test('images listing supports pagination and search', async () => {
    const items = [
      { url: 'https://example.com/red-shirt.jpg', altText: 'red shirt front view' },
      { url: 'https://example.com/blue-shirt.jpg', altText: 'blue shirt side view' },
      { url: 'https://example.com/green-hat.jpg', altText: 'green hat closeup' },
    ];
    // seed
    for (const item of items) {
      await request(app).post('/api/image-alt-media-seo/images').send(item);
    }

    const pageRes = await request(app)
      .get('/api/image-alt-media-seo/images')
      .query({ limit: 2, offset: 0 });

    expect(pageRes.statusCode).toBe(200);
    expect(pageRes.body.ok).toBe(true);
    expect(pageRes.body.limit).toBe(2);
    expect(pageRes.body.offset).toBe(0);
    expect(pageRes.body.total).toBeGreaterThanOrEqual(items.length);
    expect(pageRes.body.images.length).toBeLessThanOrEqual(2);

    const searchRes = await request(app)
      .get('/api/image-alt-media-seo/images')
      .query({ search: 'blue', limit: 5, offset: 0 });

    expect(searchRes.statusCode).toBe(200);
    expect(searchRes.body.ok).toBe(true);
    expect(searchRes.body.total).toBeGreaterThanOrEqual(1);
    const urls = searchRes.body.images.map(i => i.url || '');
    expect(urls.some(u => u.includes('blue-shirt'))).toBe(true);
  });

  test('similarity search surfaces closest matches', async () => {
    const top = await request(app).post('/api/image-alt-media-seo/images').send({ url: 'https://example.com/red-tee.jpg', altText: 'red cotton shirt front view' });
    await request(app).post('/api/image-alt-media-seo/images').send({ url: 'https://example.com/navy-tee.jpg', altText: 'navy shirt front view' });
    await request(app).post('/api/image-alt-media-seo/images').send({ url: 'https://example.com/boots.jpg', altText: 'leather boots side profile' });

    const res = await request(app)
      .get('/api/image-alt-media-seo/images/similar')
      .query({ q: 'red shirt front view', limit: 2 });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0].id).toBe(top.body.image.id);
    expect(res.body.items[0].score).toBeGreaterThan(0);
    expect(res.body.items[0].score).toBeGreaterThanOrEqual((res.body.items[1] && res.body.items[1].score) || 0);
  });

  test('similarity search can export CSV with scores', async () => {
    await request(app).post('/api/image-alt-media-seo/images').send({ url: 'https://example.com/red-tee.csv', altText: 'red cotton tee' });

    const res = await request(app)
      .get('/api/image-alt-media-seo/images/similar')
      .query({ q: 'red cotton tee', limit: 1, format: 'csv' });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toMatch(/score/);
    expect(res.text).toMatch(/red-tee\.csv/);
  });

  test('export csv can include similarity scores when q provided', async () => {
    await request(app).post('/api/image-alt-media-seo/images').send({ url: 'https://example.com/red-export.csv', altText: 'red cotton hoodie' });
    const res = await request(app)
      .get('/api/image-alt-media-seo/export/csv')
      .query({ q: 'red cotton', limit: 1 });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text.split('\n')[0]).toMatch(/score/);
    expect(res.text).toMatch(/red-export\.csv/);
  });
});
