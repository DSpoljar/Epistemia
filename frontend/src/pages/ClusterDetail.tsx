import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Cluster, Claim, Paper } from '../types';
import { getCluster, listClusterClaims, assignClaim, unassignClaim } from '../api/clusters';
import { listPapers } from '../api/papers';
import { listClaims } from '../api/claims';

export default function ClusterDetail() {
  const { id, clusterId } = useParams<{ id: string; clusterId: string }>();
  const navigate = useNavigate();

  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [assignedClaims, setAssignedClaims] = useState<Claim[]>([]);
  const [allClaims, setAllClaims] = useState<Claim[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!id || !clusterId) return;

    async function load() {
      try {
        const [clusterData, assigned, papersData] = await Promise.all([
          getCluster(clusterId!),
          listClusterClaims(clusterId!),
          listPapers(id!),
        ]);
        setCluster(clusterData);
        setAssignedClaims(assigned);
        setPapers(papersData);

        const claimsArrays = await Promise.all(papersData.map(p => listClaims(p.id)));
        setAllClaims(claimsArrays.flat());
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, clusterId]);

  const assignedIds = new Set(assignedClaims.map(c => c.id));
  const unassignedClaims = allClaims.filter(c => !assignedIds.has(c.id));
  const paperMap = new Map(papers.map(p => [p.id, p]));

  async function handleAssign() {
    if (!selectedClaimId || !clusterId) return;
    setAssigning(true);
    try {
      const claim = await assignClaim(clusterId, selectedClaimId);
      setAssignedClaims(prev => [...prev, claim]);
      setSelectedClaimId('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to assign claim.');
    } finally {
      setAssigning(false);
    }
  }

  async function handleUnassign(claimId: string) {
    if (!clusterId) return;
    try {
      await unassignClaim(clusterId, claimId);
      setAssignedClaims(prev => prev.filter(c => c.id !== claimId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to unassign claim.');
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500 text-sm">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <button onClick={() => navigate(`/projects/${id}/clusters`)} className="text-sm text-blue-600 hover:underline mb-6 inline-block">
          ← Back to Clusters
        </button>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">{cluster?.name}</h1>
          {cluster?.description && (
            <p className="text-gray-500 text-sm mt-1">{cluster.description}</p>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-base font-medium text-gray-800 mb-3">Assigned Claims</h2>
          {assignedClaims.length === 0 ? (
            <p className="text-gray-500 text-sm">No claims assigned yet.</p>
          ) : (
            <ul className="space-y-3">
              {assignedClaims.map(claim => (
                <li key={claim.id} className="bg-white border border-gray-200 rounded p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{claim.text}</p>
                      {paperMap.get(claim.paperId) && (
                        <p className="text-xs text-gray-400 mt-1">{paperMap.get(claim.paperId)!.title}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleUnassign(claim.id)}
                      className="text-red-500 text-xs hover:underline ml-4 shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {unassignedClaims.length > 0 && (
          <div className="bg-white border border-gray-200 rounded p-5">
            <h2 className="text-base font-medium text-gray-800 mb-4">Add Claim</h2>
            <div className="flex gap-3">
              <select
                value={selectedClaimId}
                onChange={e => setSelectedClaimId(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Select a claim...</option>
                {unassignedClaims.map(claim => {
                  const paper = paperMap.get(claim.paperId);
                  const label = claim.text.length > 70 ? claim.text.slice(0, 70) + '…' : claim.text;
                  return (
                    <option key={claim.id} value={claim.id}>
                      {label}{paper ? ` — ${paper.title}` : ''}
                    </option>
                  );
                })}
              </select>
              <button
                onClick={handleAssign}
                disabled={!selectedClaimId || assigning}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {assigning ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        )}

        {unassignedClaims.length === 0 && allClaims.length > 0 && (
          <p className="text-gray-500 text-sm">All project claims are already assigned to this cluster.</p>
        )}

        {allClaims.length === 0 && (
          <p className="text-gray-500 text-sm">No claims in this project yet. Add papers and claims first.</p>
        )}
      </div>
    </div>
  );
}
