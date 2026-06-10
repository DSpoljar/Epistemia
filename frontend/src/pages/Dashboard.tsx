import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../types';
import { listProjects, createProject, deleteProject } from '../api/projects';

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Project name is required.');
      return;
    }
    setNameError('');
    setSubmitting(true);
    try {
      const project = await createProject({ name: name.trim(), description: description.trim() || null });
      setProjects(prev => [...prev, project]);
      setName('');
      setDescription('');
      setShowForm(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete project.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
          <button
            onClick={() => { setShowForm(f => !f); setNameError(''); }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
          >
            {showForm ? 'Cancel' : 'New Project'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded p-5 mb-6">
            <h2 className="text-base font-medium text-gray-800 mb-4">Create Project</h2>
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. Sleep and Memory"
              />
              {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Optional"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </form>
        )}

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-500 text-sm">No projects yet. Create one to get started.</p>
        ) : (
          <ul className="space-y-3">
            {projects.map(project => (
              <li key={project.id} className="bg-white border border-gray-200 rounded p-4 flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{project.name}</p>
                  {project.description && (
                    <p className="text-gray-500 text-xs mt-1">{project.description}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4 shrink-0">
                  <button
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="text-blue-600 text-xs hover:underline"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="text-red-500 text-xs hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
