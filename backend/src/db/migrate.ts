import { getDb } from './database';

export function runMigrations(): void {
  const db = getDb();

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
      summary    TEXT
    );

    CREATE TABLE IF NOT EXISTS claims (
      id       TEXT PRIMARY KEY,
      paper_id TEXT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
      text     TEXT NOT NULL,
      notes    TEXT
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
  `);
}
