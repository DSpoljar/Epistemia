import { randomUUID } from 'node:crypto';
import { getDb } from '../../db/database';
import type { Project, CreateProjectInput, UpdateProjectInput } from '../../types/domain';

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
}

function toProject(row: ProjectRow): Project {
  return { id: row.id, name: row.name, description: row.description };
}

export const projectRepository = {
  findAll(): Project[] {
    return (getDb().prepare('SELECT * FROM projects').all() as unknown as ProjectRow[]).map(toProject);
  },

  findById(id: string): Project | null {
    const row = getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow | undefined;
    return row ? toProject(row) : null;
  },

  create(input: CreateProjectInput): Project {
    const id = randomUUID();
    getDb()
      .prepare('INSERT INTO projects (id, name, description) VALUES (?, ?, ?)')
      .run(id, input.name, input.description ?? null);
    return { id, name: input.name, description: input.description ?? null };
  },

  update(id: string, input: UpdateProjectInput): Project | null {
    const existing = projectRepository.findById(id);
    if (!existing) return null;
    const updated: Project = { ...existing, ...input };
    getDb()
      .prepare('UPDATE projects SET name = ?, description = ? WHERE id = ?')
      .run(updated.name, updated.description, id);
    return updated;
  },

  delete(id: string): boolean {
    const { changes } = getDb().prepare('DELETE FROM projects WHERE id = ?').run(id) as { changes: number };
    return changes > 0;
  },
};
