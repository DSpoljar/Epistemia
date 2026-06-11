import type { Claim } from '../types';

const BASE = '/api';

export async function listClaims(paperId: string): Promise<Claim[]> {
  const res = await fetch(`${BASE}/claims?paperId=${paperId}`);
  if (!res.ok) throw new Error('Failed to load claims.');
  return res.json();
}

export async function createClaim(data: {
  paperId: string;
  text: string;
  notes?: string | null;
}): Promise<Claim> {
  const res = await fetch(`${BASE}/claims`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create claim.');
  return res.json();
}

export async function deleteClaim(id: string): Promise<void> {
  const res = await fetch(`${BASE}/claims/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete claim.');
}
