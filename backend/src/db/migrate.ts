import { getDb } from './database';

export function runMigrations(): void {
  const db = getDb();

  try { db.exec('ALTER TABLE papers ADD COLUMN pdf_path TEXT'); } catch { /* already exists */ }
  try { db.exec('ALTER TABLE claims ADD COLUMN type TEXT'); } catch { /* already exists */ }
  try { db.exec('ALTER TABLE claims ADD COLUMN page_ref TEXT'); } catch { /* already exists */ }

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS papers (
      id         TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title      TEXT NOT NULL,
      authors    TEXT,
      year       INTEGER,
      summary    TEXT,
      pdf_path   TEXT
    );

    CREATE TABLE IF NOT EXISTS claims (
      id       TEXT PRIMARY KEY,
      paper_id TEXT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
      text     TEXT NOT NULL,
      notes    TEXT,
      type     TEXT,
      page_ref TEXT
    );

    CREATE TABLE IF NOT EXISTS clusters (
      id          TEXT PRIMARY KEY,
      project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS claim_clusters (
      claim_id   TEXT NOT NULL REFERENCES claims(id)   ON DELETE CASCADE,
      cluster_id TEXT NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
      PRIMARY KEY (claim_id, cluster_id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );
  `);
}
