import type { Paper } from '../types';
import { apiFetch } from './client';

export async function listPapers(projectId: string): Promise<Paper[]> {
  const res = await apiFetch(`/papers?projectId=${projectId}`);
  if (!res.ok) throw new Error('Failed to load papers.');
  return res.json();
}

export async function createPaper(data: {
  projectId: string;
  title: string;
  authors?: string | null;
  year?: number | null;
  summary?: string | null;
  tempId?: string;
}): Promise<Paper> {
  const res = await apiFetch('/papers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create paper.');
  return res.json();
}

export async function extractFromPdf(file: File): Promise<{ tempId: string; title: string | null; authors: string | null; year: number | null }> {
  const form = new FormData();
  form.append('file', file);
  const res = await apiFetch('/papers/extract', { method: 'POST', body: form });
  if (!res.ok) throw new Error('Failed to extract PDF metadata.');
  return res.json();
}

export async function getPaper(id: string): Promise<Paper> {
  const res = await apiFetch(`/papers/${id}`);
  if (!res.ok) throw new Error('Failed to load paper.');
  return res.json();
}

export async function updatePaper(id: string, data: { summary?: string | null; title?: string; authors?: string | null; year?: number | null }): Promise<Paper> {
  const res = await apiFetch(`/papers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update paper.');
  return res.json();
}

export async function deletePaper(id: string): Promise<void> {
  const res = await apiFetch(`/papers/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete paper.');
}

export async function uploadPdf(id: string, file: File): Promise<Paper> {
  const form = new FormData();
  form.append('file', file);
  const res = await apiFetch(`/papers/${id}/pdf`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Failed to upload PDF.');
  return res.json();
}
