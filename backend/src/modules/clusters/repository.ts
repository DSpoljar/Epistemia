import { randomUUID } from 'node:crypto';
import { getDb } from '../../db/database';
import type {
  Cluster,
  ClaimCluster,
  CreateClusterInput,
  UpdateClusterInput,
} from '../../types/domain';

export interface IClusterRepository {
  findByProject(projectId: string): Cluster[];
  findById(id: string): Cluster | null;
  create(input: CreateClusterInput): Cluster;
  update(id: string, input: UpdateClusterInput): Cluster | null;
  delete(id: string): boolean;
  addClaim(clusterId: string, claimId: string): ClaimCluster;
  removeClaim(clusterId: string, claimId: string): boolean;
  findClaims(clusterId: string): ClaimCluster[];
}

// Raw SQLite row shapes (snake_case columns)
interface ClusterRow {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
}

interface ClaimClusterRow {
  claim_id: string;
  cluster_id: string;
}

function toCluster(row: ClusterRow): Cluster {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    description: row.description,
  };
}

function toClaimCluster(row: ClaimClusterRow): ClaimCluster {
  return {
    claimId: row.claim_id,
    clusterId: row.cluster_id,
  };
}

export const clusterRepository: IClusterRepository = {
  findByProject(projectId) {
    const stmt = getDb().prepare('SELECT * FROM clusters WHERE project_id = ?');
    return (stmt.all(projectId) as unknown as ClusterRow[]).map(toCluster);
  },

  findById(id) {
    const stmt = getDb().prepare('SELECT * FROM clusters WHERE id = ?');
    const row = stmt.get(id) as ClusterRow | undefined;
    return row ? toCluster(row) : null;
  },

  create(input) {
    const id = randomUUID();
    getDb()
      .prepare(
        'INSERT INTO clusters (id, project_id, name, description) VALUES (?, ?, ?, ?)',
      )
      .run(id, input.projectId, input.name, input.description ?? null);
    return {
      id,
      projectId: input.projectId,
      name: input.name,
      description: input.description ?? null,
    };
  },

  update(id, input) {
    const existing = clusterRepository.findById(id);
    if (!existing) return null;
    const updated: Cluster = { ...existing, ...input };
    getDb()
      .prepare('UPDATE clusters SET name = ?, description = ? WHERE id = ?')
      .run(updated.name, updated.description, id);
    return updated;
  },

  delete(id) {
    const info = getDb()
      .prepare('DELETE FROM clusters WHERE id = ?')
      .run(id) as { changes: number };
    return info.changes > 0;
  },

  addClaim(clusterId, claimId) {
    getDb()
      .prepare(
        'INSERT INTO claim_clusters (claim_id, cluster_id) VALUES (?, ?)',
      )
      .run(claimId, clusterId);
    return { claimId, clusterId };
  },

  removeClaim(clusterId, claimId) {
    const info = getDb()
      .prepare(
        'DELETE FROM claim_clusters WHERE claim_id = ? AND cluster_id = ?',
      )
      .run(claimId, clusterId) as { changes: number };
    return info.changes > 0;
  },

  findClaims(clusterId) {
    const stmt = getDb().prepare(
      'SELECT * FROM claim_clusters WHERE cluster_id = ?',
    );
    return (stmt.all(clusterId) as unknown as ClaimClusterRow[]).map(toClaimCluster);
  },
};
