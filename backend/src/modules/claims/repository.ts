import { randomUUID } from 'node:crypto';
import { getDb } from '../../db/database';
import type { Claim, ClaimType, CreateClaimInput, UpdateClaimInput } from '../../types/domain';

interface ClaimRow {
  id: string;
  paper_id: string;
  text: string;
  notes: string | null;
  type: string | null;
  page_ref: string | null;
}

function toClaim(row: ClaimRow): Claim {
  return {
    id: row.id,
    paperId: row.paper_id,
    text: row.text,
    notes: row.notes,
    type: row.type as ClaimType | null,
    pageRef: row.page_ref,
  };
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
      .prepare('INSERT INTO claims (id, paper_id, text, notes, type, page_ref) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, input.paperId, input.text, input.notes ?? null, input.type ?? null, input.pageRef ?? null);
    return { id, paperId: input.paperId, text: input.text, notes: input.notes ?? null, type: input.type ?? null, pageRef: input.pageRef ?? null };
  },

  update(id: string, input: UpdateClaimInput): Claim | null {
    const existing = claimRepository.findById(id);
    if (!existing) return null;
    const updated: Claim = { ...existing, ...input };
    getDb()
      .prepare('UPDATE claims SET text = ?, notes = ?, type = ?, page_ref = ? WHERE id = ?')
      .run(updated.text, updated.notes, updated.type, updated.pageRef, id);
    return updated;
  },

  delete(id: string): boolean {
    const { changes } = getDb().prepare('DELETE FROM claims WHERE id = ?').run(id) as { changes: number };
    return changes > 0;
  },
};
