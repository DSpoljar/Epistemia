import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import jwt from 'jsonwebtoken';
import { buildApp } from '../app';
import { runMigrations } from '../db/migrate';
import { getDb } from '../db/database';

const TOKEN = jwt.sign({ sub: 'test-user' }, 'dev-secret-change-in-production');
const H = { authorization: `Bearer ${TOKEN}` };
const PROJECT_ID = 'test-proj-boundary';
const PAPER_ID   = 'test-paper-boundary';
const CLAIM_ID   = 'test-claim-boundary';

function clearDb() {
  const db = getDb();
  db.exec('DELETE FROM claim_clusters');
  db.exec('DELETE FROM claims');
  db.exec('DELETE FROM papers');
  db.exec('DELETE FROM clusters');
  db.exec('DELETE FROM projects');
}

describe('Boundary contract — write endpoints reject invalid inputs', () => {
  const app = buildApp();

  beforeAll(async () => {
    runMigrations();
    await app.ready();
  });

  afterAll(() => app.close());

  beforeEach(() => {
    clearDb();
    const db = getDb();
    db.prepare('INSERT INTO projects (id, name) VALUES (?, ?)').run(PROJECT_ID, 'Proj');
    db.prepare('INSERT INTO papers (id, project_id, title) VALUES (?, ?, ?)').run(PAPER_ID, PROJECT_ID, 'Paper');
    db.prepare('INSERT INTO claims (id, paper_id, text) VALUES (?, ?, ?)').run(CLAIM_ID, PAPER_ID, 'Claim');
  });

  // claims.type enum — these tests prove the enum constraint is enforced
  it('POST /api/claims rejects invalid type with 400', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/claims', headers: H,
      payload: { paperId: PAPER_ID, text: 'Claim text', type: 'garbage' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('PATCH /api/claims/:id rejects invalid type with 400', async () => {
    const res = await app.inject({
      method: 'PATCH', url: `/api/claims/${CLAIM_ID}`, headers: H,
      payload: { type: 'not-a-real-type' },
    });
    expect(res.statusCode).toBe(400);
  });

  // minLength enforcement
  it('POST /api/projects rejects empty name with 400', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/projects', headers: H,
      payload: { name: '' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/claims rejects empty text with 400', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/claims', headers: H,
      payload: { paperId: PAPER_ID, text: '' },
    });
    expect(res.statusCode).toBe(400);
  });

  // additionalProperties: false — Fastify strips extra props silently, they must not reach the response
  it('POST /api/projects strips extra properties (not reflected in response)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/projects', headers: H,
      payload: { name: 'Valid', injected: true },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).not.toHaveProperty('injected');
  });

  it('POST /api/claims strips extra properties (not reflected in response)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/claims', headers: H,
      payload: { paperId: PAPER_ID, text: 'Valid claim', injected: true },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).not.toHaveProperty('injected');
  });

  // minProperties: 1 enforcement on PATCH
  it('PATCH /api/projects/:id rejects empty body with 400', async () => {
    const res = await app.inject({
      method: 'PATCH', url: `/api/projects/${PROJECT_ID}`, headers: H,
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('PATCH /api/claims/:id rejects empty body with 400', async () => {
    const res = await app.inject({
      method: 'PATCH', url: `/api/claims/${CLAIM_ID}`, headers: H,
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  // type enforcement
  it('POST /api/papers rejects non-integer year with 400', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/papers', headers: H,
      payload: { projectId: PROJECT_ID, title: 'Paper', year: 'not-a-number' },
    });
    expect(res.statusCode).toBe(400);
  });
});
