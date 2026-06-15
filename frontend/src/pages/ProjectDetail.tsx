import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Project, Paper } from '../types';
import { getProject } from '../api/projects';
import { listPapers, createPaper, deletePaper, uploadPdf, extractFromPdf } from '../api/papers';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState('');
  const [summary, setSummary] = useState('');
  const [formErrors, setFormErrors] = useState<{ title?: string; summary?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [tempId, setTempId] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractNote, setExtractNote] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([getProject(id), listPapers(id)])
      .then(([proj, paps]) => { setProject(proj); setPapers(paps); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function validate() {
    const errors: { title?: string; summary?: string } = {};
    if (!title.trim()) errors.title = 'Title is required.';
    if (!summary.trim()) errors.summary = 'Summary is required.';
    return errors;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setSubmitting(true);
    try {
      const paper = await createPaper({
        projectId: id!,
        title: title.trim(),
        authors: authors.trim() || null,
        year: year ? parseInt(year, 10) : null,
        summary: summary.trim(),
        ...(tempId ? { tempId } : {}),
      });
      setPapers(prev => [...prev, paper]);
      setTitle(''); setAuthors(''); setYear(''); setSummary('');
      setTempId(null); setExtractNote(null);
      setShowForm(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create paper.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(paperId: string) {
    try {
      await deletePaper(paperId);
      setPapers(prev => prev.filter(p => p.id !== paperId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete paper.');
    }
  }

  async function handleExtract(file: File) {
    setExtracting(true);
    setExtractNote(null);
    try {
      const meta = await extractFromPdf(file);
      setTempId(meta.tempId);
      if (meta.title) setTitle(meta.title);
      if (meta.authors) setAuthors(meta.authors);
      if (meta.year) setYear(String(meta.year));
      const filled = [meta.title, meta.authors, meta.year].filter(Boolean).length;
      setExtractNote(filled > 0 ? 'Fields pre-filled from PDF — verify before saving.' : 'PDF attached — no metadata found, fill in the fields manually.');
    } catch (e: unknown) {
      setExtractNote(e instanceof Error ? e.message : 'Failed to read PDF.');
    } finally {
      setExtracting(false);
    }
  }

  async function handlePdfUpload(paperId: string, file: File) {
    try {
      const updated = await uploadPdf(paperId, file);
      setPapers(prev => prev.map(p => p.id === paperId ? updated : p));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to upload PDF.');
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500 text-sm">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <button onClick={() => navigate('/projects')} className="text-sm text-blue-600 hover:underline mb-6 inline-block">
          ← Back to Projects
        </button>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">{project?.name}</h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/projects/${id}/clusters`)}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-100 transition-colors text-sm"
            >
              View Clusters
            </button>
            <button
              onClick={() => { setShowForm(f => !f); setFormErrors({}); setTempId(null); setExtractNote(null); }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
            >
              {showForm ? 'Cancel' : 'Add Paper'}
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded p-5 mb-6">
            <h2 className="text-base font-medium text-gray-800 mb-4">Add Paper</h2>

            <div className="mb-4 border border-dashed border-gray-300 rounded px-4 py-3 bg-gray-50">
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-gray-600">
                  {extracting ? 'Reading PDF…' : tempId ? 'PDF attached ✓' : 'Attach PDF (optional)'}
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  disabled={extracting}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleExtract(f); e.target.value = ''; }}
                />
                {!extracting && (
                  <span className="text-xs bg-white border border-gray-300 rounded px-2 py-1 hover:bg-gray-100 transition-colors">
                    {tempId ? 'Replace' : 'Choose PDF'}
                  </span>
                )}
              </label>
              {extractNote && (
                <p className="text-xs mt-2 text-gray-500">{extractNote}</p>
              )}
              {!extractNote && !tempId && (
                <p className="text-xs mt-1 text-gray-400">Auto-fills fields if metadata is found.</p>
              )}
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. Sleep and declarative memory consolidation"
              />
              {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Authors</label>
              <input
                type="text"
                value={authors}
                onChange={e => setAuthors(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. Rasch, Born"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Year</label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. 2013"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-1">Summary *</label>
              <textarea
                value={summary}
                onChange={e => setSummary(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Brief summary of the paper's findings"
              />
              {formErrors.summary && <p className="text-red-500 text-xs mt-1">{formErrors.summary}</p>}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Adding...' : 'Add Paper'}
            </button>
          </form>
        )}

        {papers.length === 0 ? (
          <p className="text-gray-500 text-sm">No papers yet. Add one to get started.</p>
        ) : (
          <ul className="space-y-3">
            {papers.map(paper => (
              <li key={paper.id} className="bg-white border border-gray-200 rounded p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{paper.title}</p>
                    {(paper.authors || paper.year) && (
                      <p className="text-gray-500 text-xs mt-0.5">
                        {[paper.authors, paper.year].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {paper.summary && (
                      <p className="text-gray-600 text-xs mt-2 leading-relaxed">{paper.summary}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4 shrink-0 items-start">
                    <button
                      onClick={() => navigate(`/papers/${paper.id}/claims`)}
                      className="text-blue-600 text-xs hover:underline"
                    >
                      View Claims
                    </button>
                    {paper.pdfPath ? (
                      <a
                        href={`/api/papers/${paper.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 text-xs hover:underline"
                      >
                        Open PDF
                      </a>
                    ) : (
                      <label className="text-gray-500 text-xs hover:underline cursor-pointer">
                        Attach PDF
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handlePdfUpload(paper.id, file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                    <button
                      onClick={() => handleDelete(paper.id)}
                      className="text-red-500 text-xs hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
