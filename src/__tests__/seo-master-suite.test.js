process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../server');

describe('SEO Master Suite (smoke)', () => {
  it('GET /api/seo-master-suite/ai/models/available returns models', async () => {
    const res = await request(app).get('/api/seo-master-suite/ai/models/available');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.models)).toBe(true);
    expect(res.body.models.length).toBeGreaterThan(0);
  });

  it('POST /api/seo-master-suite/keywords/research returns results', async () => {
    const res = await request(app)
      .post('/api/seo-master-suite/keywords/research')
      .send({ seedKeywords: ['test'], platform: 'shopify', location: 'us', language: 'en' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.keywords)).toBe(true);
  });

  it('POST /api/seo-master-suite/bi/anomaly-detection returns anomalies array', async () => {
    const res = await request(app)
      .post('/api/seo-master-suite/bi/anomaly-detection')
      .send({ metrics: [{ timestamp: Date.now(), value: 10 }], sensitivity: 'medium' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.anomalies)).toBe(true);
  });
});
