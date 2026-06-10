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
