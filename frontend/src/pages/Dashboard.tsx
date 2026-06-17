import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../types';
import { listProjects, createProject, updateProject, deleteProject } from '../api/projects';
import { createPaper, extractFromPdf } from '../api/papers';
import { logout } from '../api/auth';

interface PaperDraft {
  key: string;
  title: string;
  authors: string;
  year: string;
  tempId: string | null;
  extracting: boolean;
  extractNote: string | null;
}

function emptyDraft(): PaperDraft {
  return { key: Math.random().toString(36).slice(2), title: '', authors: '', year: '', tempId: null, extracting: false, extractNote: null };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingProjectId, setEditingProjectId]   = useState<string | null>(null);
  const [editProjectName, setEditProjectName]     = useState('');
  const [editProjectDesc, setEditProjectDesc]     = useState('');
  const [editProjectSaving, setEditProjectSaving] = useState(false);
  const [editProjectError, setEditProjectError]   = useState('');

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paperDrafts, setPaperDrafts] = useState<PaperDraft[]>([]);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function resetForm() {
    setName(''); setDescription(''); setNameError(''); setPaperDrafts([]);
  }

  function updateDraft(key: string, updates: Partial<PaperDraft>) {
    setPaperDrafts(prev => prev.map(d => d.key === key ? { ...d, ...updates } : d));
  }

  async function handleDraftExtract(key: string, file: File) {
    updateDraft(key, { extracting: true, extractNote: null });
    try {
      const meta = await extractFromPdf(file);
      const filled = [meta.title, meta.authors, meta.year].filter(Boolean).length;
      updateDraft(key, {
        tempId: meta.tempId,
        ...(meta.title   ? { title:   meta.title }        : {}),
        ...(meta.authors ? { authors: meta.authors }      : {}),
        ...(meta.year    ? { year:    String(meta.year) } : {}),
        extractNote: filled > 0 ? 'Fields pre-filled — verify before saving.' : 'PDF attached — no metadata found.',
        extracting: false,
      });
    } catch (e: unknown) {
      updateDraft(key, { extracting: false, extractNote: e instanceof Error ? e.message : 'Failed to read PDF.' });
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setNameError('Project name is required.'); return; }
    setNameError('');
    setSubmitting(true);
    try {
      const project = await createProject({ name: name.trim(), description: description.trim() || null });
      for (const draft of paperDrafts) {
        if (!draft.title.trim()) continue;
        await createPaper({
          projectId: project.id,
          title:     draft.title.trim(),
          authors:   draft.authors.trim() || null,
          year:      draft.year ? parseInt(draft.year, 10) : null,
          summary:   null,
          ...(draft.tempId ? { tempId: draft.tempId } : {}),
        });
      }
      setProjects(prev => [...prev, project]);
      resetForm();
      setShowForm(false);
      navigate(`/projects/${project.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  }

  function openEditProject(project: Project) {
    setEditingProjectId(project.id);
    setEditProjectName(project.name);
    setEditProjectDesc(project.description ?? '');
    setEditProjectError('');
  }

  async function handleSaveEditProject(e: React.FormEvent) {
    e.preventDefault();
    if (!editProjectName.trim()) { setEditProjectError('Name is required.'); return; }
    setEditProjectSaving(true);
    try {
      const updated = await updateProject(editingProjectId!, {
        name:        editProjectName.trim(),
        description: editProjectDesc.trim() || null,
      });
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditingProjectId(null);
    } catch (e: unknown) {
      setEditProjectError(e instanceof Error ? e.message : 'Failed to update project.');
    } finally {
      setEditProjectSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this project and all its papers and claims?')) return;
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
          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(f => !f); if (showForm) resetForm(); }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
            >
              {showForm ? 'Cancel' : 'New Project'}
            </button>
            <button
              onClick={logout}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded hover:bg-gray-50 transition-colors text-sm"
            >
              Sign out
            </button>
          </div>
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

            <div className="mb-5">
              <label className="block text-sm text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Optional"
              />
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Papers</h3>

              {paperDrafts.length > 0 && (
                <div className="space-y-3 mb-3">
                  {paperDrafts.map(draft => (
                    <div key={draft.key} className="border border-gray-200 rounded p-4 bg-gray-50">
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={draft.title}
                          onChange={e => updateDraft(draft.key, { title: e.target.value })}
                          placeholder="Title *"
                          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setPaperDrafts(prev => prev.filter(d => d.key !== draft.key))}
                          className="text-red-500 text-xs hover:underline shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={draft.authors}
                          onChange={e => updateDraft(draft.key, { authors: e.target.value })}
                          placeholder="Authors"
                          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                        />
                        <input
                          type="number"
                          value={draft.year}
                          onChange={e => updateDraft(draft.key, { year: e.target.value })}
                          placeholder="Year"
                          className="w-24 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                        />
                      </div>
                      <div className="border border-dashed border-gray-300 rounded px-3 py-2 bg-white">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-xs text-gray-600">
                            {draft.extracting ? 'Reading PDF…' : draft.tempId ? 'PDF attached ✓' : 'Attach PDF (optional)'}
                          </span>
                          <input
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            disabled={draft.extracting}
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleDraftExtract(draft.key, f); e.target.value = ''; }}
                          />
                          {!draft.extracting && (
                            <span className="text-xs bg-gray-50 border border-gray-300 rounded px-2 py-0.5 hover:bg-gray-100 transition-colors">
                              {draft.tempId ? 'Replace' : 'Choose PDF'}
                            </span>
                          )}
                        </label>
                        {draft.extractNote && <p className="text-xs mt-1 text-gray-500">{draft.extractNote}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setPaperDrafts(prev => [...prev, emptyDraft()])}
                className="text-blue-600 text-sm hover:underline"
              >
                + Add Paper
              </button>
            </div>

            <div className="mt-5">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded px-4 py-2 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4 text-lg leading-none">×</button>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-500 text-sm">No projects yet. Create one to get started.</p>
        ) : (
          <ul className="space-y-3">
            {projects.map(project => {
              const isEditing = editingProjectId === project.id;
              return (
                <li key={project.id} className="bg-white border border-gray-200 rounded p-4">
                  {isEditing ? (
                    <form onSubmit={handleSaveEditProject}>
                      <div className="mb-3">
                        <label className="block text-sm text-gray-700 mb-1">Name *</label>
                        <input type="text" value={editProjectName} onChange={e => setEditProjectName(e.target.value)} autoFocus
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                        {editProjectError && <p className="text-red-500 text-xs mt-1">{editProjectError}</p>}
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm text-gray-700 mb-1">Description</label>
                        <textarea value={editProjectDesc} onChange={e => setEditProjectDesc(e.target.value)} rows={2}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
                      </div>
                      <div className="flex gap-3">
                        <button type="submit" disabled={editProjectSaving}
                          className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
                          {editProjectSaving ? 'Saving…' : 'Save'}
                        </button>
                        <button type="button" onClick={() => setEditingProjectId(null)}
                          className="text-gray-500 text-sm hover:underline">
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                        <p className="font-medium text-gray-900 text-sm hover:text-blue-600 transition-colors">{project.name}</p>
                        {project.description && (
                          <p className="text-gray-500 text-xs mt-1">{project.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4 shrink-0">
                        <button onClick={() => navigate(`/projects/${project.id}`)}
                          className="text-blue-600 text-xs hover:underline">Open</button>
                        <button onClick={() => openEditProject(project)}
                          className="text-blue-600 text-xs hover:underline">Edit</button>
                        <button onClick={() => handleDelete(project.id)}
                          className="text-red-500 text-xs hover:underline">Delete</button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
