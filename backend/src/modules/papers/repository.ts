import { randomUUID } from 'node:crypto';
import { getDb } from '../../db/database';
import type {
  Paper,
  CreatePaperInput,
  UpdatePaperInput,
} from '../../types/domain';

export interface IPaperRepository {
  findByProject(projectId: string): Paper[];
  findById(id: string): Paper | null;
  create(input: CreatePaperInput): Paper;
  update(id: string, input: UpdatePaperInput): Paper | null;
  delete(id: string): boolean;
}

// Raw SQLite row shape (snake_case columns)
interface PaperRow {
  id: string;
  project_id: string;
  title: string;
  authors: string | null;
  year: number | null;
  summary: string | null;
}

function toPaper(row: PaperRow): Paper {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    authors: row.authors,
    year: row.year,
    summary: row.summary,
  };
}

export const paperRepository: IPaperRepository = {
  findByProject(projectId) {
    const stmt = getDb().prepare('SELECT * FROM papers WHERE project_id = ?');
    return (stmt.all(projectId) as unknown as PaperRow[]).map(toPaper);
  },

  findById(id) {
    const stmt = getDb().prepare('SELECT * FROM papers WHERE id = ?');
    const row = stmt.get(id) as PaperRow | undefined;
    return row ? toPaper(row) : null;
  },

  create(input) {
    const id = randomUUID();
    getDb()
      .prepare(
        'INSERT INTO papers (id, project_id, title, authors, year, summary) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(
        id,
        input.projectId,
        input.title,
        input.authors ?? null,
        input.year ?? null,
        input.summary ?? null,
      );
    return {
      id,
      projectId: input.projectId,
      title: input.title,
      authors: input.authors ?? null,
      year: input.year ?? null,
      summary: input.summary ?? null,
    };
  },

  update(id, input) {
    const existing = paperRepository.findById(id);
    if (!existing) return null;
    const updated: Paper = { ...existing, ...input };
    getDb()
      .prepare(
        'UPDATE papers SET title = ?, authors = ?, year = ?, summary = ? WHERE id = ?',
      )
      .run(updated.title, updated.authors, updated.year, updated.summary, id);
    return updated;
  },

  delete(id) {
    const info = getDb()
      .prepare('DELETE FROM papers WHERE id = ?')
      .run(id) as { changes: number };
    return info.changes > 0;
  },
};
