import { randomUUID } from 'node:crypto';
import { getDb } from '../../db/database';
import type { Cluster, Claim, CreateClusterInput, UpdateClusterInput } from '../../types/domain';

interface ClusterRow {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
}

// Used for JOIN queries that return claim columns
interface ClaimRow {
  id: string;
  paper_id: string;
  text: string;
  notes: string | null;
}

function toCluster(row: ClusterRow): Cluster {
  return { id: row.id, projectId: row.project_id, name: row.name, description: row.description };
}

function toClaim(row: ClaimRow): Claim {
  return { id: row.id, paperId: row.paper_id, text: row.text, notes: row.notes };
}

export const clusterRepository = {
  findByProject(projectId: string): Cluster[] {
    return (getDb().prepare('SELECT * FROM clusters WHERE project_id = ?').all(projectId) as unknown as ClusterRow[]).map(toCluster);
  },

  findById(id: string): Cluster | null {
    const row = getDb().prepare('SELECT * FROM clusters WHERE id = ?').get(id) as ClusterRow | undefined;
    return row ? toCluster(row) : null;
  },

  create(input: CreateClusterInput): Cluster {
    const id = randomUUID();
    getDb()
      .prepare('INSERT INTO clusters (id, project_id, name, description) VALUES (?, ?, ?, ?)')
      .run(id, input.projectId, input.name, input.description ?? null);
    return { id, projectId: input.projectId, name: input.name, description: input.description ?? null };
  },

  update(id: string, input: UpdateClusterInput): Cluster | null {
    const existing = clusterRepository.findById(id);
    if (!existing) return null;
    const updated: Cluster = { ...existing, ...input };
    getDb()
      .prepare('UPDATE clusters SET name = ?, description = ? WHERE id = ?')
      .run(updated.name, updated.description, id);
    return updated;
  },

  delete(id: string): boolean {
    const { changes } = getDb().prepare('DELETE FROM clusters WHERE id = ?').run(id) as { changes: number };
    return changes > 0;
  },

  // --- claim assignment ---

  hasClaim(clusterId: string, claimId: string): boolean {
    const row = getDb()
      .prepare('SELECT 1 FROM claim_clusters WHERE cluster_id = ? AND claim_id = ?')
      .get(clusterId, claimId);
    return row !== undefined;
  },

  addClaim(clusterId: string, claimId: string): void {
    getDb()
      .prepare('INSERT INTO claim_clusters (claim_id, cluster_id) VALUES (?, ?)')
      .run(claimId, clusterId);
  },

  removeClaim(clusterId: string, claimId: string): boolean {
    const { changes } = getDb()
      .prepare('DELETE FROM claim_clusters WHERE claim_id = ? AND cluster_id = ?')
      .run(claimId, clusterId) as { changes: number };
    return changes > 0;
  },

  findClaims(clusterId: string): Claim[] {
    const rows = getDb().prepare(`
      SELECT c.* FROM claims c
      JOIN claim_clusters cc ON c.id = cc.claim_id
      WHERE cc.cluster_id = ?
    `).all(clusterId) as unknown as ClaimRow[];
    return rows.map(toClaim);
  },
};
