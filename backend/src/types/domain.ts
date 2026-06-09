// ---------------------------------------------------------------------------
// Domain entities
// All ids are UUIDs (string). Nullable fields use `| null`.
// Column names in SQLite are snake_case; these interfaces use camelCase.
// Repositories are responsible for mapping between the two.
// ---------------------------------------------------------------------------

export interface Project {
  id: string;
  name: string;
  description: string | null;
}

export interface Paper {
  id: string;
  projectId: string;
  title: string;
  authors: string | null;
  year: number | null;
  summary: string | null;
}

export interface Claim {
  id: string;
  paperId: string;
  text: string;
  notes: string | null;
}

export interface Cluster {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
}

export interface ClaimCluster {
  claimId: string;
  clusterId: string;
}

// ---------------------------------------------------------------------------
// Input types (id is generated server-side; foreign keys are required)
// ---------------------------------------------------------------------------

export type CreateProjectInput = Omit<Project, 'id'>;
export type UpdateProjectInput = Partial<Omit<Project, 'id'>>;

export type CreatePaperInput = Omit<Paper, 'id'>;
export type UpdatePaperInput = Partial<Omit<Paper, 'id' | 'projectId'>>;

export type CreateClaimInput = Omit<Claim, 'id'>;
export type UpdateClaimInput = Partial<Omit<Claim, 'id' | 'paperId'>>;

export type CreateClusterInput = Omit<Cluster, 'id'>;
export type UpdateClusterInput = Partial<Omit<Cluster, 'id' | 'projectId'>>;
