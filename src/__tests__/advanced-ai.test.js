process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../server');
const aiCopilot = require('../core/aiCopilot');
const crossChannel = require('../core/crossChannelAttribution');
const humanLoop = require('../core/humanLoop');
const programmableApi = require('../core/programmableApi');
const db = require('../core/db');

describe('Advanced AI Routes', () => {
  const userId = 'test-user';

  beforeEach(async () => {
    await aiCopilot.reset();
    await crossChannel.reset();
    await humanLoop.reset();
    await programmableApi.reset();
    await db.exec(`
      DELETE FROM ai_copilot_profiles;
      DELETE FROM ai_copilot_signals;
      DELETE FROM ai_copilot_actions;
      DELETE FROM ai_copilot_chats;
      DELETE FROM cross_channel_events;
      DELETE FROM human_loop_tasks;
      DELETE FROM human_loop_feedback;
      DELETE FROM human_loop_ideas;
      DELETE FROM programmable_webhooks;
      DELETE FROM programmable_queue;
    `);
  });

  it('updates copilot profile and responds to chat', async () => {
    const profileRes = await request(app).post('/api/advanced-ai/copilot/profile').send({ userId, profile: { role: 'ops' } });
    expect(profileRes.statusCode).toBe(200);
    expect(profileRes.body.ok).toBe(true);
    const chatRes = await request(app).post('/api/advanced-ai/copilot/chat').send({ userId, message: 'Hello' });
    expect(chatRes.statusCode).toBe(200);
    expect(chatRes.body.ok).toBe(true);
    expect(typeof chatRes.body.reply).toBe('string');
  });

  it('ingests realtime metric and returns stats', async () => {
    const ingestRes = await request(app).post('/api/advanced-ai/realtime/ingest').send({ metric: 'visits', value: 10 });
    expect(ingestRes.statusCode).toBe(200);
    const statsRes = await request(app).get('/api/advanced-ai/realtime/stats').query({ metric: 'visits' });
    expect(statsRes.statusCode).toBe(200);
    expect(statsRes.body.ok).toBe(true);
    expect(statsRes.body.stats).toHaveProperty('count');
  });

  it('ingests attribution events and computes last-touch model', async () => {
    await request(app).post('/api/advanced-ai/attribution/ingest').send({ channel: 'email', userId, type: 'view' });
    await request(app).post('/api/advanced-ai/attribution/ingest').send({ channel: 'ads', userId, type: 'click' });
    await request(app).post('/api/advanced-ai/attribution/ingest').send({ channel: 'ads', userId, type: 'purchase' });
    const res = await request(app).get('/api/advanced-ai/attribution/compute').query({ userId, conversionType: 'purchase', model: 'last-touch' });
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.attribution).toHaveProperty('ads', 1);
  });

  it('logs compliance and returns report', async () => {
    const logRes = await request(app).post('/api/advanced-ai/compliance/log').send({ model: 'demo', input: 'in', output: 'out' });
    expect(logRes.statusCode).toBe(200);
    const reportRes = await request(app).get('/api/advanced-ai/compliance/report').query({ limit: 5 });
    expect(reportRes.statusCode).toBe(200);
    expect(reportRes.body.ok).toBe(true);
    expect(reportRes.body.report).toHaveProperty('recent');
  });

  it('creates HITL task and records feedback', async () => {
    const taskRes = await request(app).post('/api/advanced-ai/hitl/task').send({ type: 'review', payload: { doc: 'x' } });
    expect(taskRes.statusCode).toBe(200);
    const taskId = taskRes.body.task.id;
    const fbRes = await request(app).post('/api/advanced-ai/hitl/feedback').send({ taskId, reviewer: 'r1', decision: 'approve', notes: 'ok' });
    expect(fbRes.statusCode).toBe(200);
    const finalizeRes = await request(app).post('/api/advanced-ai/hitl/finalize').send({ taskId });
    expect(finalizeRes.statusCode).toBe(200);
    expect(finalizeRes.body.ok).toBe(true);
  });
});
