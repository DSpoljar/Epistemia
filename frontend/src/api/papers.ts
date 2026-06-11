import type { Paper } from '../types';

const BASE = '/api';

export async function listPapers(projectId: string): Promise<Paper[]> {
  const res = await fetch(`${BASE}/papers?projectId=${projectId}`);
  if (!res.ok) throw new Error('Failed to load papers.');
  return res.json();
}

export async function createPaper(data: {
  projectId: string;
  title: string;
  authors?: string | null;
  year?: number | null;
  summary?: string | null;
}): Promise<Paper> {
  const res = await fetch(`${BASE}/papers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create paper.');
  return res.json();
}

export async function getPaper(id: string): Promise<Paper> {
  const res = await fetch(`${BASE}/papers/${id}`);
  if (!res.ok) throw new Error('Failed to load paper.');
  return res.json();
}

export async function deletePaper(id: string): Promise<void> {
  const res = await fetch(`${BASE}/papers/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete paper.');
}
