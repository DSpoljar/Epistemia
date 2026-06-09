import { randomUUID } from 'node:crypto';
import { getDb } from '../../db/database';
import type {
  Claim,
  CreateClaimInput,
  UpdateClaimInput,
} from '../../types/domain';

export interface IClaimRepository {
  findByPaper(paperId: string): Claim[];
  findById(id: string): Claim | null;
  create(input: CreateClaimInput): Claim;
  update(id: string, input: UpdateClaimInput): Claim | null;
  delete(id: string): boolean;
}

// Raw SQLite row shape (snake_case columns)
interface ClaimRow {
  id: string;
  paper_id: string;
  text: string;
  notes: string | null;
}

function toClaim(row: ClaimRow): Claim {
  return {
    id: row.id,
    paperId: row.paper_id,
    text: row.text,
    notes: row.notes,
  };
}

export const claimRepository: IClaimRepository = {
  findByPaper(paperId) {
    const stmt = getDb().prepare('SELECT * FROM claims WHERE paper_id = ?');
    return (stmt.all(paperId) as unknown as ClaimRow[]).map(toClaim);
  },

  findById(id) {
    const stmt = getDb().prepare('SELECT * FROM claims WHERE id = ?');
    const row = stmt.get(id) as ClaimRow | undefined;
    return row ? toClaim(row) : null;
  },

  create(input) {
    const id = randomUUID();
    getDb()
      .prepare('INSERT INTO claims (id, paper_id, text, notes) VALUES (?, ?, ?, ?)')
      .run(id, input.paperId, input.text, input.notes ?? null);
    return {
      id,
      paperId: input.paperId,
      text: input.text,
      notes: input.notes ?? null,
    };
  },

  update(id, input) {
    const existing = claimRepository.findById(id);
    if (!existing) return null;
    const updated: Claim = { ...existing, ...input };
    getDb()
      .prepare('UPDATE claims SET text = ?, notes = ? WHERE id = ?')
      .run(updated.text, updated.notes, id);
    return updated;
  },

  delete(id) {
    const info = getDb()
      .prepare('DELETE FROM claims WHERE id = ?')
      .run(id) as { changes: number };
    return info.changes > 0;
  },
};
