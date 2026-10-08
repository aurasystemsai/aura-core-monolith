const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }), { virtual: true });
jest.mock('../core/mailer', () => ({ sendEmail: jest.fn(async ({ to }) => ({ sent: true, id: 'm1', to })), isConfigured: () => true, isEmail: (v) => /@/.test(v || ''), esc: (s) => s }));
jest.mock('../core/seoStoreData', () => ({ loadStoreEntities: async () => ({ entities: [{ id: 'p1', title: 'Blue Mug', url: 'https://x.com/products/blue-mug' }] }), gql: async () => ({}) }));
jest.mock('../core/openaiClient', () => ({
  getOpenAIClient: () => ({ chat: { completions: { create: async ({ messages }) => {
    const sys = messages[0].content;
    if (sys.includes('Analyse')) return { choices: [{ message: { content: JSON.stringify({ summary: 'Mostly happy', praise: ['Quality'], complaints: [], actions: ['Keep it up'] }) } }] };
    if (sys.includes('asking a customer')) return { choices: [{ message: { content: JSON.stringify({ subject: 'How was it?', bodyHtml: '<p>Hi</p><script>x</script>' }) } }] };
    return { choices: [{ message: { content: 'Thank you so much!' } }] };
  } } } }),
}));

let n = 0;
function makeApp() {
  const router = require('../tools/review-ugc-engine/router');
  const app = express();
  app.use(express.json());
  const shop = `rev-${Date.now()}-${n++}.myshopify.com`;
  app.use((req, res, next) => { req.session = { shop, shopifyToken: 'tok' }; req.deductCredits = async () => {}; next(); });
  app.use('/api/review-ugc-engine', router);
  return app;
}
const B = '/api/review-ugc-engine';

describe('review-ugc-engine', () => {
  it('adds, validates, approves and replies to reviews', async () => {
    const app = makeApp();
    expect((await request(app).post(B + '/reviews').send({ rating: 9, text: 'x' })).status).toBe(400);
    const a = await request(app).post(B + '/reviews').send({ rating: 5, author: 'Sam', text: 'Great mug' });
    const id = a.body.review.id;
    await request(app).post(`${B}/reviews/${id}/status`).send({ status: 'approved' });
    const d = await request(app).post(`${B}/reviews/${id}/reply`).send({});
    expect(d.body.draft).toBe('Thank you so much!');
    await request(app).post(`${B}/reviews/${id}/reply`).send({ reply: d.body.draft });
    const l = await request(app).get(B + '/reviews');
    expect(l.body.summary).toMatchObject({ total: 1, average: 5, unanswered: 0 });
    expect(l.body.reviews[0].reply).toBe('Thank you so much!');
  });

  it('imports in bulk, needs 3 reviews for insights, then returns them', async () => {
    const app = makeApp();
    await request(app).post(B + '/reviews').send({ rating: 4, text: 'ok' });
    expect((await request(app).post(B + '/insights').send({})).status).toBe(400);
    const imp = await request(app).post(B + '/reviews/import').send({ reviews: [{ rating: 5, text: 'a' }, { rating: 2, text: 'b' }, { rating: 0, text: 'bad' }] });
    expect(imp.body).toMatchObject({ added: 2, skipped: 1 });
    const ins = await request(app).post(B + '/insights').send({});
    expect(ins.body.insights).toMatchObject({ summary: 'Mostly happy', basedOn: 3 });
  });

  it('writes a request email with scripts stripped and sends a test', async () => {
    const app = makeApp();
    const p = await request(app).post(B + '/request/preview').send({});
    expect(p.body.bodyHtml).toBe('<p>Hi</p>x');
    const t = await request(app).post(B + '/request/send-test').send({ to: 'a@b.com', subject: p.body.subject, bodyHtml: p.body.bodyHtml, url: p.body.product.url });
    expect(t.body).toMatchObject({ ok: true, sent: true });
  });
});
