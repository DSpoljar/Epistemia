import { randomUUID } from 'node:crypto';
import { getDb } from '../../db/database';
import type { Claim, CreateClaimInput, UpdateClaimInput } from '../../types/domain';

interface ClaimRow {
  id: string;
  paper_id: string;
  text: string;
  notes: string | null;
}

function toClaim(row: ClaimRow): Claim {
  return { id: row.id, paperId: row.paper_id, text: row.text, notes: row.notes };
}

export const claimRepository = {
  findByPaper(paperId: string): Claim[] {
    return (getDb().prepare('SELECT * FROM claims WHERE paper_id = ?').all(paperId) as unknown as ClaimRow[]).map(toClaim);
  },

  findById(id: string): Claim | null {
    const row = getDb().prepare('SELECT * FROM claims WHERE id = ?').get(id) as ClaimRow | undefined;
    return row ? toClaim(row) : null;
  },

  create(input: CreateClaimInput): Claim {
    const id = randomUUID();
    getDb()
      .prepare('INSERT INTO claims (id, paper_id, text, notes) VALUES (?, ?, ?, ?)')
      .run(id, input.paperId, input.text, input.notes ?? null);
    return { id, paperId: input.paperId, text: input.text, notes: input.notes ?? null };
  },

  update(id: string, input: UpdateClaimInput): Claim | null {
    const existing = claimRepository.findById(id);
    if (!existing) return null;
    const updated: Claim = { ...existing, ...input };
    getDb()
      .prepare('UPDATE claims SET text = ?, notes = ? WHERE id = ?')
      .run(updated.text, updated.notes, id);
    return updated;
  },

  delete(id: string): boolean {
    const { changes } = getDb().prepare('DELETE FROM claims WHERE id = ?').run(id) as { changes: number };
    return changes > 0;
  },
};
