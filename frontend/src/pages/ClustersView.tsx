import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import type { Project, Cluster } from '../types';
import { getProject } from '../api/projects';
import { listClusters, createCluster, deleteCluster } from '../api/clusters';

export default function ClustersView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getProject(id), listClusters(id)])
      .then(([proj, cls]) => { setProject(proj); setClusters(cls); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setFormError('Name is required.'); return; }
    setFormError(null);
    setSubmitting(true);
    try {
      const cluster = await createCluster({
        projectId: id!,
        name: name.trim(),
        description: description.trim() || null,
      });
      setClusters(prev => [...prev, cluster]);
      setName(''); setDescription('');
      setShowForm(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create cluster.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(clusterId: string) {
    try {
      await deleteCluster(clusterId);
      setClusters(prev => prev.filter(c => c.id !== clusterId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete cluster.');
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500 text-sm">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <button onClick={() => navigate(`/projects/${id}`)} className="text-sm text-blue-600 hover:underline mb-6 inline-block">
          ← Back to Project
        </button>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Clusters</h1>
            {project && <p className="text-gray-500 text-sm mt-1">{project.name}</p>}
          </div>
          <button
            onClick={() => { setShowForm(f => !f); setFormError(null); }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
          >
            {showForm ? 'Cancel' : 'Add Cluster'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded p-5 mb-6">
            <h2 className="text-base font-medium text-gray-800 mb-4">Add Cluster</h2>
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. NREM Sleep Effects"
              />
              {formError && <p className="text-red-500 text-xs mt-1">{formError}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Optional description of this cluster"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Adding...' : 'Add Cluster'}
            </button>
          </form>
        )}

        {clusters.length === 0 ? (
          <p className="text-gray-500 text-sm">No clusters yet. Add one to get started.</p>
        ) : (
          <ul className="space-y-3">
            {clusters.map(cluster => (
              <li key={cluster.id} className="bg-white border border-gray-200 rounded p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/projects/${id}/clusters/${cluster.id}`}
                      className="font-medium text-gray-900 text-sm hover:text-blue-600 hover:underline"
                    >
                      {cluster.name}
                    </Link>
                    {cluster.description && (
                      <p className="text-gray-500 text-xs mt-1 leading-relaxed">{cluster.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(cluster.id)}
                    className="text-red-500 text-xs hover:underline ml-4 shrink-0"
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
