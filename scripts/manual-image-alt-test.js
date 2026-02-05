/*
 * Manual test runner for image-alt-media-seo endpoints.
 * Use when Jest is blocked (e.g., Node 24 export resolution). Runs a few key assertions and exits non-zero on failure.
 */

process.env.NODE_ENV = 'test';
process.env.IMAGE_ALT_MEDIA_SEO_INMEMORY = 'true';
process.env.SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-10';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';

const assert = require('assert');
const request = require('supertest');
const app = require('../src/server');

async function run() {
  const expect = (cond, msg, extra) => {
    if (!cond) {
      const err = new Error(msg + (extra ? `: ${extra}` : ''));
      throw err;
    }
  };

  // 1) Lint clamps alt to 400 chars
  {
    const longAlt = 'a'.repeat(500);
    const res = await request(app)
      .post('/api/image-alt-media-seo/lint')
      .send({ altText: longAlt });
    expect(res.statusCode === 200, 'lint status', JSON.stringify(res.body));
    expect(res.body?.lint?.length === 400, 'lint length clamp');
  }

  // 2) Import rejects over 200 items
  {
    const items = Array.from({ length: 201 }).map((_, i) => ({ altText: `item ${i}`, url: `https://example.com/${i}.jpg` }));
    const res = await request(app)
      .post('/api/image-alt-media-seo/import')
      .send({ items, dryRun: true });
    expect(res.statusCode === 400, 'import status', JSON.stringify(res.body));
    expect(res.body.ok === false, 'import ok flag');
  }

  // 3) Import dry-run error export
  {
    const res = await request(app)
      .post('/api/image-alt-media-seo/import')
      .send({ items: [{ altText: '', url: 'https://example.com/img.jpg' }], dryRun: true, errorExport: true });
    expect(res.statusCode === 200, 'import dry-run status', JSON.stringify(res.body));
    expect(res.body.ok === false, 'import dry-run ok flag');
    expect(Array.isArray(res.body.errors) && res.body.errors.length > 0, 'import dry-run errors');
  }

  // 4) Batch generate records runs + metrics (uses fallback generation if OpenAI missing)
  {
    const batch = [
      { imageDescription: 'red running shoes on white background', url: 'https://example.com/running-shoes.jpg' },
      { imageDescription: 'navy backpack front view', url: 'https://example.com/backpack.png' },
    ];
    const runRes = await request(app)
      .post('/api/image-alt-media-seo/ai/batch-generate')
      .send({ items: batch, chunkSize: 1, paceMs: 0, tone: 'balanced', verbosity: 'terse' });
    expect(runRes.statusCode === 200, 'batch status', JSON.stringify(runRes.body));
    expect(runRes.body.ok === true, 'batch ok');
    expect(runRes.body.summary?.total === batch.length, 'batch total', JSON.stringify(runRes.body.summary));
    expect(runRes.body.results?.length === batch.length, 'batch results len');
    expect(runRes.body.results?.every(r => r.ok), 'batch results ok');

    const runsRes = await request(app).get('/api/image-alt-media-seo/runs');
    expect(runsRes.statusCode === 200, 'runs status', JSON.stringify(runsRes.body));
    expect(runsRes.body.ok === true, 'runs ok');
    expect(Array.isArray(runsRes.body.runs) && runsRes.body.runs.length > 0, 'runs list');

    const metricsRes = await request(app).get('/api/image-alt-media-seo/metrics');
    expect(metricsRes.statusCode === 200, 'metrics status', JSON.stringify(metricsRes.body));
    expect(metricsRes.body.ok === true, 'metrics ok');
    expect(metricsRes.body.metrics?.totalRuns >= 1, 'metrics totalRuns');
    expect(metricsRes.body.metrics?.totalItems >= batch.length, 'metrics totalItems');
  }
}

run()
  .then(() => {
    console.log('Manual image-alt-media-seo checks passed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Manual image-alt-media-seo checks failed:', err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  });
