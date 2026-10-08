const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }), { virtual: true });
jest.mock('../core/seoStoreData', () => ({ gql: async () => ({ products: { nodes: [{ title: 'Mug', description: 'Handmade mug' }, { title: 'Tote', description: 'Organic tote' }] }, pages: { nodes: [{ title: 'About', body: '<p>We are a small team.</p>' }] }, articles: { nodes: [] } }) }));
const mockCreate = jest.fn(async (args) => {
  const sys = args.messages[0].content;
  let content = 'Thanks so much!';
  if (sys.startsWith('Label')) { const items = JSON.parse(args.messages[1].content); content = JSON.stringify({ labels: items.map((m, i) => ({ id: m.id, sentiment: i === 0 ? 'negative' : 'positive', topic: 'Shipping' })).concat([{ id: 'bogus', sentiment: 'positive', topic: 'x' }]) }); }
  if (sys.startsWith('Describe')) content = JSON.stringify({ summary: 'Warm and plain-spoken.', traits: ['warm'], doList: [], avoidList: [] });
  return { choices: [{ message: { content } }] };
});
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }) }));

const RUN = Date.now();
function makeApp(shop) {
  const router = require('../tools/brand-mention-tracker/router');
  const app = express(); app.use(express.json());
  app.use((req, res, next) => { req.session = { shop: `${shop}-${RUN}.myshopify.com`, shopifyToken: 'tok' }; req.deductCredits = async () => {}; next(); });
  app.use('/api/brand-mention-tracker', router);
  return app;
}
const B = '/api/brand-mention-tracker';

describe('brand-mention-tracker', () => {
  it('adds, labels and summarises mentions, ignoring invented ids', async () => {
    const app = makeApp('bm-a');
    await request(app).post(B + '/mentions').send({ mentions: [{ text: 'Late delivery' }, { text: 'Love it', source: 'social', url: 'javascript:alert(1)' }, { text: '' }] });
    const an = await request(app).post(B + '/analyse');
    expect(an.body).toMatchObject({ labelled: 2, remaining: 0 });
    const st = (await request(app).get(B + '/state')).body;
    expect(st.summary).toMatchObject({ total: 2, positiveShare: 50, needAttention: 1 });
    expect(st.summary.topTopics[0]).toEqual({ topic: 'shipping', n: 2 });
    expect(st.mentions.every((m) => m.url === '')).toBe(true);
    expect((await request(app).post(B + '/analyse')).status).toBe(400);
  });

  it('drafts a reply, requires 3 mentions for insights, and learns a voice', async () => {
    const app = makeApp('bm-b');
    const m = (await request(app).post(B + '/mentions').send({ text: 'Great mug' })).body;
    const id = (await request(app).get(B + '/state')).body.mentions[0].id;
    expect((await request(app).post(B + '/mentions/' + id + '/reply')).body.mention.reply).toBe('Thanks so much!');
    expect(m.added).toBe(1);
    expect((await request(app).post(B + '/insights')).status).toBe(400);
    expect((await request(app).post(B + '/voice')).body.voice).toMatchObject({ summary: 'Warm and plain-spoken.', basedOn: 3 });
    expect((await request(app).get(B + '/state')).body.voice.traits).toEqual(['warm']);
  });

  it('isolates shops and deletes mentions', async () => {
    const a = makeApp('bm-c');
    await request(a).post(B + '/mentions').send({ text: 'hello' });
    const id = (await request(a).get(B + '/state')).body.mentions[0].id;
    expect((await request(makeApp('bm-d')).get(B + '/state')).body.mentions).toHaveLength(0);
    await request(a).delete(B + '/mentions/' + id);
    expect((await request(a).get(B + '/state')).body.summary.total).toBe(0);
  });
});
