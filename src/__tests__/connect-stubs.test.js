const express = require('express');
const request = require('supertest');

describe('connect-your-account tools', () => {
  const ids = ['tiktok-ads-integration', 'ads-anomaly-guard', 'ad-creative-optimizer', 'data-warehouse-connector', 'mobile-app-analytics'];
  it.each(ids)('%s reports it is not connected and returns no data', async (id) => {
    const app = express(); app.use('/api/' + id, require('../tools/' + id + '/router'));
    const s = (await request(app).get('/api/' + id + '/status')).body;
    expect(s).toMatchObject({ ok: true, connected: false });
    expect(s.needs.length).toBeGreaterThan(0);
    expect((await request(app).get('/api/' + id + '/campaigns')).status).toBe(501);
  });
});