import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Paper, Claim } from '../types';
import { getPaper } from '../api/papers';
import { listClaims, createClaim, deleteClaim } from '../api/claims';

export default function ClaimsView() {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();

  const [paper, setPaper] = useState<Paper | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!paperId) return;
    Promise.all([getPaper(paperId), listClaims(paperId)])
      .then(([p, c]) => { setPaper(p); setClaims(c); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [paperId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) { setFormError('Claim text is required.'); return; }
    setFormError(null);
    setSubmitting(true);
    try {
      const claim = await createClaim({
        paperId: paperId!,
        text: text.trim(),
        notes: notes.trim() || null,
      });
      setClaims(prev => [...prev, claim]);
      setText(''); setNotes('');
      setShowForm(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create claim.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(claimId: string) {
    try {
      await deleteClaim(claimId);
      setClaims(prev => prev.filter(c => c.id !== claimId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete claim.');
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500 text-sm">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline mb-6 inline-block">
          ← Back
        </button>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Claims</h1>
            {paper && <p className="text-gray-500 text-sm mt-1">{paper.title}</p>}
          </div>
          <button
            onClick={() => { setShowForm(f => !f); setFormError(null); }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
          >
            {showForm ? 'Cancel' : 'Add Claim'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded p-5 mb-6">
            <h2 className="text-base font-medium text-gray-800 mb-4">Add Claim</h2>
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Claim text *</label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                placeholder="e.g. Sleep improves declarative memory consolidation by 20%"
              />
              {formError && <p className="text-red-500 text-xs mt-1">{formError}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Optional context or caveats"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Adding...' : 'Add Claim'}
            </button>
          </form>
        )}

        {claims.length === 0 ? (
          <p className="text-gray-500 text-sm">No claims yet. Add one to get started.</p>
        ) : (
          <ul className="space-y-3">
            {claims.map(claim => (
              <li key={claim.id} className="bg-white border border-gray-200 rounded p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-sm leading-relaxed">{claim.text}</p>
                    {claim.notes && (
                      <p className="text-gray-500 text-xs mt-2 leading-relaxed">{claim.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(claim.id)}
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
