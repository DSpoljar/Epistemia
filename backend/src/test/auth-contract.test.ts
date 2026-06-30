import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app';
import { runMigrations } from '../db/migrate';

describe('Auth contract — protected routes require a token, public routes do not', () => {
  const app = buildApp();

  beforeAll(async () => {
    runMigrations();
    await app.ready();
  });

  afterAll(() => app.close());

  it('GET /api/projects returns 401 without a token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/projects' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/stats returns 401 without a token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/stats' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/papers?projectId=x returns 401 without a token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/papers?projectId=x' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/claims?paperId=x returns 401 without a token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/claims?paperId=x' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/clusters?projectId=x returns 401 without a token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/clusters?projectId=x' });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/auth/login is publicly accessible (missing body reaches schema validation, not auth gate)', async () => {
    // No body → schema validation returns 400, proving the auth preHandler was skipped
    const res = await app.inject({ method: 'POST', url: '/api/auth/login' });
    expect(res.statusCode).toBe(400);
  });

  it('GET /health is publicly accessible (not 401)', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).not.toBe(401);
  });
});
