const request = require('supertest');
const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const app = require('../server');

describe('API /api/automation', () => {
  const dataFile = path.join(__dirname, '../../data/automation-schedules.json');

  beforeEach(async () => {
    // Clean up schedules before each test
    await fs.writeFile(dataFile, '[]', 'utf8');
  });

  it('GET /api/automation returns empty schedules', async () => {
    const res = await request(app).get('/api/automation');
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.schedules)).toBe(true);
    expect(res.body.schedules.length).toBe(0);
  });

  it('POST /api/automation creates a schedule', async () => {
    const payload = { name: 'Test', type: 'one-time', date: '2025-12-30', time: '10:00' };
    const res = await request(app).post('/api/automation').send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.schedule).toMatchObject({ name: 'Test', type: 'one-time', date: '2025-12-30', time: '10:00' });
  });

  it('DELETE /api/automation/:id deletes a schedule', async () => {
    // Create a schedule first
    const payload = { name: 'DeleteMe', type: 'one-time', date: '2025-12-30', time: '11:00' };
    const postRes = await request(app).post('/api/automation').send(payload);
    const id = postRes.body.schedule.id;
    const delRes = await request(app).delete(`/api/automation/${id}`);
    expect(delRes.statusCode).toBe(200);
    expect(delRes.body.ok).toBe(true);
    // Confirm it's deleted
    const getRes = await request(app).get('/api/automation');
    expect(getRes.body.schedules.find(s => s.id === id)).toBeUndefined();
  });
});
