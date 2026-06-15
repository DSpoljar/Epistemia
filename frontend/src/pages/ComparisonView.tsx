import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Cluster, Claim, Paper } from '../types';
import { getComparison } from '../api/clusters';

export default function ComparisonView() {
  const { id, clusterId } = useParams<{ id: string; clusterId: string }>();
  const navigate = useNavigate();

  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clusterId) return;
    getComparison(clusterId)
      .then(({ cluster, claims, papers }) => {
        setCluster(cluster);
        setClaims(claims);
        setPapers(papers);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load comparison.'))
      .finally(() => setLoading(false));
  }, [clusterId]);

  const claimsByPaper = new Map<string, Claim[]>();
  for (const claim of claims) {
    const existing = claimsByPaper.get(claim.paperId) ?? [];
    claimsByPaper.set(claim.paperId, [...existing, claim]);
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500 text-sm">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate(`/projects/${id}/clusters/${clusterId}`)}
          className="text-sm text-blue-600 hover:underline mb-6 inline-block"
        >
          ← Back to Cluster
        </button>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">{cluster?.name}</h1>
          {cluster?.description && (
            <p className="text-gray-500 text-sm mt-1">{cluster.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">{papers.length} paper{papers.length !== 1 ? 's' : ''} · {claims.length} claim{claims.length !== 1 ? 's' : ''}</p>
        </div>

        {papers.length === 0 ? (
          <p className="text-gray-500 text-sm">No claims assigned to this cluster yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {papers.map(paper => (
              <div key={paper.id} className="bg-white border border-gray-200 rounded p-5 flex flex-col">
                <div className="mb-4">
                  <h2 className="font-medium text-gray-900 text-sm leading-snug">{paper.title}</h2>
                  {paper.authors && <p className="text-xs text-gray-400 mt-1">{paper.authors}</p>}
                  {paper.year && <p className="text-xs text-gray-400">{paper.year}</p>}
                </div>
                <ul className="space-y-3 flex-1">
                  {(claimsByPaper.get(paper.id) ?? []).map(claim => (
                    <li key={claim.id} className="border-l-2 border-blue-200 pl-3">
                      <p className="text-sm text-gray-800">{claim.text}</p>
                      {claim.notes && (
                        <p className="text-xs text-gray-400 mt-1 italic">{claim.notes}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
