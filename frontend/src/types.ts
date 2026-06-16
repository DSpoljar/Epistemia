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
  pdfPath: string | null;
}

export type ClaimType = 'hypothesis' | 'limitation' | 'methodology' | 'implication';

export interface Claim {
  id: string;
  paperId: string;
  text: string;
  notes: string | null;
  type: ClaimType | null;
  pageRef: string | null;
}

export interface Cluster {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
}
