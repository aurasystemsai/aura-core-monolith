const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }), { virtual: true });
jest.mock('../core/seoStoreData', () => ({ gql: async () => ({ pages: { nodes: [{ id: 'p1', title: 'Returns', body: '<p>Returns accepted within 30 days.</p>' }, { id: 'p2', title: 'Empty', body: '' }] } }) }));
const mockCreate = jest.fn(async () => ({ choices: [{ message: { content: JSON.stringify({ category: 'returns', urgency: 'normal', answerable: true, reply: 'You can return within 30 days.' }) } }] }));
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }) }));

function makeApp(shop) {
  const router = require('../tools/ai-support-assistant/router');
  const app = express(); app.use(express.json());
  app.use((req, res, next) => { req.session = { shop, shopifyToken: 'tok' }; req.deductCredits = async () => {}; next(); });
  app.use('/api/ai-support-assistant', router);
  return app;
}
const RUN = Date.now();
const B = '/api/ai-support-assistant';

describe('ai-support-assistant', () => {
  it('imports store pages once and matches knowledge to a message', async () => {
    const app = makeApp(`sup-a-${RUN}.myshopify.com`);
    expect((await request(app).post(B + '/kb/import-pages')).body).toMatchObject({ added: 1, skipped: 1 });
    expect((await request(app).post(B + '/kb/import-pages')).body.added).toBe(0);
    const t = (await request(app).post(B + '/tickets').send({ message: 'How do I return my order?' })).body.ticket;
    const d = await request(app).post(B + '/tickets/' + t.id + '/draft');
    expect(d.body.usedKnowledge).toEqual(['Returns']);
    expect(d.body.ticket).toMatchObject({ category: 'returns', needsHuman: false, reply: 'You can return within 30 days.' });
  });

  it('flags a ticket for a human when no knowledge matches', async () => {
    const app = makeApp(`sup-b-${RUN}.myshopify.com`);
    const t = (await request(app).post(B + '/tickets').send({ message: 'Where is my parcel?' })).body.ticket;
    const d = await request(app).post(B + '/tickets/' + t.id + '/draft');
    expect(d.body.usedKnowledge).toEqual([]);
    expect(d.body.ticket.needsHuman).toBe(true);
  });

  it('validates input, updates status and isolates shops', async () => {
    const app = makeApp(`sup-c-${RUN}.myshopify.com`);
    expect((await request(app).post(B + '/tickets').send({})).status).toBe(400);
    expect((await request(app).post(B + '/kb').send({ title: 'x' })).status).toBe(400);
    const t = (await request(app).post(B + '/tickets').send({ message: 'hi' })).body.ticket;
    expect((await request(app).patch(B + '/tickets/' + t.id).send({ status: 'bogus' })).status).toBe(400);
    expect((await request(app).patch(B + '/tickets/' + t.id).send({ status: 'resolved' })).body.ticket.status).toBe('resolved');
    expect((await request(makeApp(`sup-d-${RUN}.myshopify.com`)).get(B + '/state')).body.tickets).toHaveLength(0);
  });
});

