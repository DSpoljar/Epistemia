import type { Cluster } from '../types';

const BASE = '/api';

export async function listClusters(projectId: string): Promise<Cluster[]> {
  const res = await fetch(`${BASE}/clusters?projectId=${projectId}`);
  if (!res.ok) throw new Error('Failed to load clusters.');
  return res.json();
}

export async function createCluster(data: {
  projectId: string;
  name: string;
  description?: string | null;
}): Promise<Cluster> {
  const res = await fetch(`${BASE}/clusters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create cluster.');
  return res.json();
}

export async function deleteCluster(id: string): Promise<void> {
  const res = await fetch(`${BASE}/clusters/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete cluster.');
}
