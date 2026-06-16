import type { Cluster, Claim, Paper } from '../types';
import { apiFetch } from './client';

export async function listClusters(projectId: string): Promise<Cluster[]> {
  const res = await apiFetch(`/clusters?projectId=${projectId}`);
  if (!res.ok) throw new Error('Failed to load clusters.');
  return res.json();
}

export async function createCluster(data: {
  projectId: string;
  name: string;
  description?: string | null;
}): Promise<Cluster> {
  const res = await apiFetch('/clusters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create cluster.');
  return res.json();
}

export async function getCluster(id: string): Promise<Cluster> {
  const res = await apiFetch(`/clusters/${id}`);
  if (!res.ok) throw new Error('Failed to load cluster.');
  return res.json();
}

export async function deleteCluster(id: string): Promise<void> {
  const res = await apiFetch(`/clusters/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete cluster.');
}

export async function listClusterClaims(clusterId: string): Promise<Claim[]> {
  const res = await apiFetch(`/clusters/${clusterId}/claims`);
  if (!res.ok) throw new Error('Failed to load cluster claims.');
  return res.json();
}

export async function assignClaim(clusterId: string, claimId: string): Promise<Claim> {
  const res = await apiFetch(`/clusters/${clusterId}/claims`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claimId }),
  });
  if (!res.ok) throw new Error('Failed to assign claim.');
  return res.json();
}

export async function unassignClaim(clusterId: string, claimId: string): Promise<void> {
  const res = await apiFetch(`/clusters/${clusterId}/claims/${claimId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to unassign claim.');
}

export async function getComparison(clusterId: string): Promise<{ cluster: Cluster; claims: Claim[]; papers: Paper[] }> {
  const res = await apiFetch(`/clusters/${clusterId}/comparison`);
  if (!res.ok) throw new Error('Failed to load comparison.');
  return res.json();
}
