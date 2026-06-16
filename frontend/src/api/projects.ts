import type { Project } from '../types';
import { apiFetch } from './client';

export async function listProjects(): Promise<Project[]> {
  const res = await apiFetch('/projects');
  if (!res.ok) throw new Error('Failed to load projects.');
  return res.json();
}

export async function getProject(id: string): Promise<Project> {
  const res = await apiFetch(`/projects/${id}`);
  if (!res.ok) throw new Error('Failed to load project.');
  return res.json();
}

export async function createProject(data: { name: string; description?: string | null }): Promise<Project> {
  const res = await apiFetch('/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create project.');
  return res.json();
}

export async function deleteProject(id: string): Promise<void> {
  const res = await apiFetch(`/projects/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete project.');
}
