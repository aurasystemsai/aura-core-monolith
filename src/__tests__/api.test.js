const request = require('supertest');
const express = require('express');
const app = require('../../src/server');

describe('API /api/automation', () => {
  it('GET /api/automation returns schedules (smoke test)', async () => {
    const res = await request(app).get('/api/automation');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('schedules');
    expect(Array.isArray(res.body.schedules)).toBe(true);
  });
});
