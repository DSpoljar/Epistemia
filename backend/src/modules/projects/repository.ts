import { randomUUID } from 'node:crypto';
import { getDb } from '../../db/database';
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
} from '../../types/domain';

export interface IProjectRepository {
  findAll(): Project[];
  findById(id: string): Project | null;
  create(input: CreateProjectInput): Project;
  update(id: string, input: UpdateProjectInput): Project | null;
  delete(id: string): boolean;
}

// Raw SQLite row shape (snake_case columns)
interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
  };
}

export const projectRepository: IProjectRepository = {
  findAll() {
    const stmt = getDb().prepare('SELECT * FROM projects');
    return (stmt.all() as unknown as ProjectRow[]).map(toProject);
  },

  findById(id) {
    const stmt = getDb().prepare('SELECT * FROM projects WHERE id = ?');
    const row = stmt.get(id) as ProjectRow | undefined;
    return row ? toProject(row) : null;
  },

  create(input) {
    const id = randomUUID();
    getDb()
      .prepare('INSERT INTO projects (id, name, description) VALUES (?, ?, ?)')
      .run(id, input.name, input.description ?? null);
    return { id, ...input, description: input.description ?? null };
  },

  update(id, input) {
    const existing = projectRepository.findById(id);
    if (!existing) return null;
    const updated: Project = {
      ...existing,
      ...input,
    };
    getDb()
      .prepare('UPDATE projects SET name = ?, description = ? WHERE id = ?')
      .run(updated.name, updated.description, id);
    return updated;
  },

  delete(id) {
    const info = getDb()
      .prepare('DELETE FROM projects WHERE id = ?')
      .run(id) as { changes: number };
    return info.changes > 0;
  },
};
