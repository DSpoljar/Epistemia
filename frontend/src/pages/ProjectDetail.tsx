import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Project, Paper, Claim, ClaimType } from '../types';
import { getProject } from '../api/projects';
import { listPapers, createPaper, updatePaper, deletePaper, uploadPdf, extractFromPdf } from '../api/papers';
import { listClaims, createClaim, deleteClaim } from '../api/claims';

type Tab = 'papers' | 'summaries' | 'claims' | 'comparison';

const CLAIM_TYPES: ClaimType[] = ['hypothesis', 'methodology', 'limitation', 'implication'];

const CLAIM_META: Record<ClaimType, { label: string; border: string; bg: string; badge: string }> = {
  hypothesis:  { label: 'Hypothesis',  border: 'border-blue-400',  bg: 'bg-blue-50',  badge: 'bg-blue-100 text-blue-700' },
  methodology: { label: 'Methodology', border: 'border-amber-400', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
  limitation:  { label: 'Limitation',  border: 'border-red-400',   bg: 'bg-red-50',   badge: 'bg-red-100 text-red-700' },
  implication: { label: 'Implication', border: 'border-green-400', bg: 'bg-green-50', badge: 'bg-green-100 text-green-700' },
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject]         = useState<Project | null>(null);
  const [papers, setPapers]           = useState<Paper[]>([]);
  const [claimsByPaper, setClaimsByPaper] = useState<Map<string, Claim[]>>(new Map());
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState<Tab>('papers');

  // Papers tab
  const [showAddPaper, setShowAddPaper]   = useState(false);
  const [paperTitle, setPaperTitle]       = useState('');
  const [paperAuthors, setPaperAuthors]   = useState('');
  const [paperYear, setPaperYear]         = useState('');
  const [paperTitleError, setPaperTitleError] = useState('');
  const [paperSubmitting, setPaperSubmitting] = useState(false);
  const [tempId, setTempId]               = useState<string | null>(null);
  const [extracting, setExtracting]       = useState(false);
  const [extractNote, setExtractNote]     = useState<string | null>(null);

  // Summaries tab
  const [summaryDrafts, setSummaryDrafts]   = useState<Map<string, string>>(new Map());
  const [savingPaperId, setSavingPaperId]   = useState<string | null>(null);

  // Edit paper
  const [editingPaperId, setEditingPaperId] = useState<string | null>(null);
  const [editTitle, setEditTitle]           = useState('');
  const [editAuthors, setEditAuthors]       = useState('');
  const [editYear, setEditYear]             = useState('');
  const [editSaving, setEditSaving]         = useState(false);
  const [editError, setEditError]           = useState('');

  // Drag & drop
  const [addFormDragging, setAddFormDragging] = useState(false);
  const [cardDraggingId, setCardDraggingId]   = useState<string | null>(null);

  // Claims tab
  const [claimFormPaperId, setClaimFormPaperId] = useState<string | null>(null);
  const [claimType, setClaimType]   = useState<ClaimType>('hypothesis');
  const [claimText, setClaimText]   = useState('');
  const [claimPageRef, setClaimPageRef] = useState('');
  const [claimFormError, setClaimFormError] = useState('');
  const [claimSubmitting, setClaimSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getProject(id), listPapers(id)])
      .then(async ([proj, paps]) => {
        setProject(proj);
        setPapers(paps);
        const drafts = new Map<string, string>();
        paps.forEach(p => drafts.set(p.id, p.summary ?? ''));
        setSummaryDrafts(drafts);
        const claimsArrays = await Promise.all(paps.map(p => listClaims(p.id)));
        const map = new Map<string, Claim[]>();
        paps.forEach((p, i) => map.set(p.id, claimsArrays[i]));
        setClaimsByPaper(map);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function addClaimToState(claim: Claim) {
    setClaimsByPaper(prev => new Map(prev).set(claim.paperId, [...(prev.get(claim.paperId) ?? []), claim]));
  }

  function removeClaimFromState(claimId: string, paperId: string) {
    setClaimsByPaper(prev => new Map(prev).set(paperId, (prev.get(paperId) ?? []).filter(c => c.id !== claimId)));
  }

  // --- Papers tab handlers ---

  function resetPaperForm() {
    setPaperTitle(''); setPaperAuthors(''); setPaperYear('');
    setPaperTitleError(''); setTempId(null); setExtractNote(null);
  }

  async function handleAddPaper(e: React.FormEvent) {
    e.preventDefault();
    if (!paperTitle.trim()) { setPaperTitleError('Title is required.'); return; }
    setPaperTitleError('');
    setPaperSubmitting(true);
    try {
      const paper = await createPaper({
        projectId: id!,
        title:   paperTitle.trim(),
        authors: paperAuthors.trim() || null,
        year:    paperYear ? parseInt(paperYear, 10) : null,
        summary: null,
        ...(tempId ? { tempId } : {}),
      });
      setPapers(prev => [...prev, paper]);
      setClaimsByPaper(prev => new Map(prev).set(paper.id, []));
      setSummaryDrafts(prev => new Map(prev).set(paper.id, ''));
      resetPaperForm();
      setShowAddPaper(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add paper.');
    } finally {
      setPaperSubmitting(false);
    }
  }

  async function handleDeletePaper(paperId: string) {
    try {
      await deletePaper(paperId);
      setPapers(prev => prev.filter(p => p.id !== paperId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete paper.');
    }
  }

  async function handleExtract(file: File) {
    setExtracting(true); setExtractNote(null);
    try {
      const meta = await extractFromPdf(file);
      setTempId(meta.tempId);
      if (meta.title)   setPaperTitle(meta.title);
      if (meta.authors) setPaperAuthors(meta.authors);
      if (meta.year)    setPaperYear(String(meta.year));
      const filled = [meta.title, meta.authors, meta.year].filter(Boolean).length;
      setExtractNote(filled > 0 ? 'Fields pre-filled — verify before saving.' : 'PDF attached — no metadata found.');
    } catch (e: unknown) {
      setExtractNote(e instanceof Error ? e.message : 'Failed to read PDF.');
    } finally {
      setExtracting(false);
    }
  }

  function openEdit(paper: Paper) {
    setEditingPaperId(paper.id);
    setEditTitle(paper.title);
    setEditAuthors(paper.authors ?? '');
    setEditYear(paper.year ? String(paper.year) : '');
    setEditError('');
  }

  async function handleSaveEdit(e: React.FormEvent, paperId: string) {
    e.preventDefault();
    if (!editTitle.trim()) { setEditError('Title is required.'); return; }
    setEditSaving(true);
    try {
      const updated = await updatePaper(paperId, {
        title:   editTitle.trim(),
        authors: editAuthors.trim() || null,
        year:    editYear ? parseInt(editYear, 10) : null,
      });
      setPapers(prev => prev.map(p => p.id === paperId ? updated : p));
      setEditingPaperId(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update paper.');
    } finally {
      setEditSaving(false);
    }
  }

  function handleAddFormDrop(e: React.DragEvent) {
    e.preventDefault();
    setAddFormDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') handleExtract(file);
  }

  function handleCardDrop(e: React.DragEvent, paperId: string) {
    e.preventDefault();
    setCardDraggingId(null);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') handlePdfUpload(paperId, file);
  }

  async function handlePdfUpload(paperId: string, file: File) {
    try {
      const updated = await uploadPdf(paperId, file);
      setPapers(prev => prev.map(p => p.id === paperId ? updated : p));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to upload PDF.');
    }
  }

  // --- Summaries tab handlers ---

  async function handleSaveSummary(paperId: string) {
    setSavingPaperId(paperId);
    try {
      const summary = summaryDrafts.get(paperId) ?? '';
      const updated = await updatePaper(paperId, { summary: summary.trim() || null });
      setPapers(prev => prev.map(p => p.id === paperId ? updated : p));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save summary.');
    } finally {
      setSavingPaperId(null);
    }
  }

  // --- Claims tab handlers ---

  function openClaimForm(paperId: string) {
    setClaimFormPaperId(paperId);
    setClaimType('hypothesis'); setClaimText(''); setClaimPageRef(''); setClaimFormError('');
  }

  async function handleAddClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!claimText.trim()) { setClaimFormError('Claim text is required.'); return; }
    setClaimFormError('');
    setClaimSubmitting(true);
    try {
      const claim = await createClaim({
        paperId: claimFormPaperId!,
        text:    claimText.trim(),
        notes:   null,
        type:    claimType,
        pageRef: claimPageRef.trim() || null,
      });
      addClaimToState(claim);
      setClaimText(''); setClaimPageRef(''); setClaimFormPaperId(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add claim.');
    } finally {
      setClaimSubmitting(false);
    }
  }

  async function handleDeleteClaim(claimId: string, paperId: string) {
    try {
      await deleteClaim(claimId);
      removeClaimFromState(claimId, paperId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete claim.');
    }
  }

  // --- Tab renderers ---

  function renderPapersTab() {
    return (
      <div>
        <div className="flex justify-end mb-4">
          <button
            onClick={() => { setShowAddPaper(f => !f); if (showAddPaper) resetPaperForm(); }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
          >
            {showAddPaper ? 'Cancel' : 'Add Paper'}
          </button>
        </div>

        {showAddPaper && (
          <form onSubmit={handleAddPaper} className="bg-white border border-gray-200 rounded p-5 mb-6">
            <h2 className="text-base font-medium text-gray-800 mb-4">Add Paper</h2>
            <div
              className={`mb-4 border-2 border-dashed rounded px-4 py-3 transition-colors ${addFormDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
              onDragOver={e => { e.preventDefault(); setAddFormDragging(true); }}
              onDragLeave={() => setAddFormDragging(false)}
              onDrop={handleAddFormDrop}
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-gray-600">
                  {extracting ? 'Reading PDF…' : tempId ? 'PDF attached ✓' : addFormDragging ? 'Drop PDF here…' : 'Attach PDF (optional)'}
                </span>
                <input type="file" accept="application/pdf" className="hidden" disabled={extracting}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleExtract(f); e.target.value = ''; }} />
                {!extracting && (
                  <span className="text-xs bg-white border border-gray-300 rounded px-2 py-1 hover:bg-gray-100 transition-colors">
                    {tempId ? 'Replace' : 'Choose PDF'}
                  </span>
                )}
              </label>
              {extractNote && <p className="text-xs mt-2 text-gray-500">{extractNote}</p>}
              {!extractNote && !tempId && <p className="text-xs mt-1 text-gray-400">Drop a PDF here or click Choose — auto-fills fields if metadata found.</p>}
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Title *</label>
              <input type="text" value={paperTitle} onChange={e => setPaperTitle(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. Sleep-dependent memory consolidation" />
              {paperTitleError && <p className="text-red-500 text-xs mt-1">{paperTitleError}</p>}
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Authors</label>
              <input type="text" value={paperAuthors} onChange={e => setPaperAuthors(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. Rasch, Born" />
            </div>
            <div className="mb-5">
              <label className="block text-sm text-gray-700 mb-1">Year</label>
              <input type="number" value={paperYear} onChange={e => setPaperYear(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. 2013" />
            </div>
            <button type="submit" disabled={paperSubmitting}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {paperSubmitting ? 'Adding…' : 'Add Paper'}
            </button>
          </form>
        )}

        {papers.length === 0 ? (
          <p className="text-gray-500 text-sm">No papers yet. Add one to get started.</p>
        ) : (
          <ul className="space-y-3">
            {papers.map(paper => {
              const isEditing = editingPaperId === paper.id;
              return (
                <li key={paper.id} className="bg-white border border-gray-200 rounded p-4">
                  {isEditing ? (
                    <form onSubmit={e => handleSaveEdit(e, paper.id)}>
                      <div className="mb-3">
                        <label className="block text-sm text-gray-700 mb-1">Title *</label>
                        <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} autoFocus
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                        {editError && <p className="text-red-500 text-xs mt-1">{editError}</p>}
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm text-gray-700 mb-1">Authors</label>
                        <input type="text" value={editAuthors} onChange={e => setEditAuthors(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm text-gray-700 mb-1">Year</label>
                        <input type="number" value={editYear} onChange={e => setEditYear(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                      </div>
                      <div className="flex gap-3">
                        <button type="submit" disabled={editSaving}
                          className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
                          {editSaving ? 'Saving…' : 'Save'}
                        </button>
                        <button type="button" onClick={() => setEditingPaperId(null)}
                          className="text-gray-500 text-sm hover:underline">
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{paper.title}</p>
                        {(paper.authors || paper.year) && (
                          <p className="text-gray-500 text-xs mt-0.5">{[paper.authors, paper.year].filter(Boolean).join(' · ')}</p>
                        )}
                      </div>
                      <div className="flex gap-3 ml-4 shrink-0 items-start">
                        {paper.pdfPath ? (
                          <a href={`/api/papers/${paper.id}/pdf`} target="_blank" rel="noreferrer"
                            className="text-blue-600 text-xs hover:underline">Open PDF</a>
                        ) : (
                          <div
                            className={`border border-dashed rounded px-2 py-1 transition-colors ${cardDraggingId === paper.id ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}`}
                            onDragOver={e => { e.preventDefault(); setCardDraggingId(paper.id); }}
                            onDragLeave={() => setCardDraggingId(null)}
                            onDrop={e => handleCardDrop(e, paper.id)}
                          >
                            <label className="text-gray-500 text-xs hover:underline cursor-pointer">
                              {cardDraggingId === paper.id ? 'Drop PDF…' : 'Attach PDF'}
                              <input type="file" accept="application/pdf" className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfUpload(paper.id, f); e.target.value = ''; }} />
                            </label>
                          </div>
                        )}
                        <button onClick={() => openEdit(paper)} className="text-blue-600 text-xs hover:underline">Edit</button>
                        <button onClick={() => handleDeletePaper(paper.id)} className="text-red-500 text-xs hover:underline">Delete</button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  function renderSummariesTab() {
    if (papers.length === 0) return <p className="text-gray-500 text-sm">No papers yet. Add papers in the Papers tab first.</p>;
    return (
      <div className="space-y-5">
        {papers.map(paper => (
          <div key={paper.id} className="bg-white border border-gray-200 rounded p-5">
            <p className="font-medium text-gray-900 text-sm mb-1">{paper.title}</p>
            {(paper.authors || paper.year) && (
              <p className="text-gray-400 text-xs mb-3">{[paper.authors, paper.year].filter(Boolean).join(' · ')}</p>
            )}
            <textarea
              value={summaryDrafts.get(paper.id) ?? ''}
              onChange={e => setSummaryDrafts(prev => new Map(prev).set(paper.id, e.target.value))}
              rows={4}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Add your notes and summary for this paper…"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => handleSaveSummary(paper.id)}
                disabled={savingPaperId === paper.id}
                className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {savingPaperId === paper.id ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderClaimsTab() {
    if (papers.length === 0) return <p className="text-gray-500 text-sm">No papers yet. Add papers in the Papers tab first.</p>;
    return (
      <div className="space-y-8">
        {papers.map(paper => {
          const claims = claimsByPaper.get(paper.id) ?? [];
          const isFormOpen = claimFormPaperId === paper.id;
          return (
            <div key={paper.id}>
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{paper.title}</p>
                  {(paper.authors || paper.year) && (
                    <p className="text-gray-400 text-xs mt-0.5">{[paper.authors, paper.year].filter(Boolean).join(' · ')}</p>
                  )}
                </div>
                <button
                  onClick={() => isFormOpen ? setClaimFormPaperId(null) : openClaimForm(paper.id)}
                  className="text-blue-600 text-xs hover:underline shrink-0 ml-4"
                >
                  {isFormOpen ? 'Cancel' : '+ Add claim'}
                </button>
              </div>

              {claims.length === 0 && !isFormOpen && (
                <p className="text-gray-400 text-xs pl-1">No claims yet.</p>
              )}

              {claims.length > 0 && (
                <ul className="space-y-2 mb-3">
                  {claims.map(claim => {
                    const meta = claim.type ? CLAIM_META[claim.type] : null;
                    return (
                      <li key={claim.id}
                        className={`flex items-start gap-3 px-3 py-2.5 rounded border-l-4 ${meta ? `${meta.border} ${meta.bg}` : 'border-gray-300 bg-gray-50'}`}>
                        <div className="flex-1 min-w-0">
                          {meta && (
                            <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded mb-1 ${meta.badge}`}>
                              {meta.label}
                            </span>
                          )}
                          <p className="text-sm text-gray-800 leading-relaxed">{claim.text}</p>
                          {claim.pageRef && <p className="text-xs text-gray-400 mt-0.5">{claim.pageRef}</p>}
                        </div>
                        <button onClick={() => handleDeleteClaim(claim.id, paper.id)}
                          className="text-red-400 text-xs hover:underline shrink-0 mt-0.5">Delete</button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {isFormOpen && (
                <form onSubmit={handleAddClaim} className="bg-white border border-gray-200 rounded p-4 mt-2">
                  <div className="mb-3">
                    <label className="block text-sm text-gray-700 mb-1">Type</label>
                    <select value={claimType} onChange={e => setClaimType(e.target.value as ClaimType)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white">
                      {CLAIM_TYPES.map(t => (
                        <option key={t} value={t}>{CLAIM_META[t].label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm text-gray-700 mb-1">Claim text *</label>
                    <textarea value={claimText} onChange={e => setClaimText(e.target.value)} rows={3}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                      placeholder="e.g. Sleep improves declarative memory consolidation" />
                    {claimFormError && <p className="text-red-500 text-xs mt-1">{claimFormError}</p>}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm text-gray-700 mb-1">Page / line reference</label>
                    <input type="text" value={claimPageRef} onChange={e => setClaimPageRef(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      placeholder="e.g. p. 42, line 3" />
                  </div>
                  <button type="submit" disabled={claimSubmitting}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {claimSubmitting ? 'Adding…' : 'Add Claim'}
                  </button>
                </form>
              )}

              <hr className="mt-6 border-gray-100" />
            </div>
          );
        })}
      </div>
    );
  }

  function renderComparisonTab() {
    if (papers.length === 0) return <p className="text-gray-500 text-sm">No papers yet. Add papers in the Papers tab first.</p>;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 pr-6 font-medium text-gray-700 w-44">Paper</th>
              {CLAIM_TYPES.map(type => (
                <th key={type} className="text-left py-3 px-3 font-medium">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${CLAIM_META[type].badge}`}>
                    {CLAIM_META[type].label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {papers.map(paper => {
              const claims = claimsByPaper.get(paper.id) ?? [];
              return (
                <tr key={paper.id} className="border-b border-gray-100 align-top">
                  <td className="py-4 pr-6">
                    <p className="font-medium text-gray-900 leading-snug">{paper.title}</p>
                    {paper.authors && <p className="text-xs text-gray-400 mt-0.5">{paper.authors}</p>}
                    {paper.year && <p className="text-xs text-gray-400">{paper.year}</p>}
                  </td>
                  {CLAIM_TYPES.map(type => {
                    const typeClaims = claims.filter(c => c.type === type);
                    return (
                      <td key={type} className="py-4 px-3 align-top">
                        {typeClaims.length === 0 ? (
                          <span className="text-gray-300 text-xs">—</span>
                        ) : (
                          <ul className="space-y-2">
                            {typeClaims.map(claim => (
                              <li key={claim.id} className={`text-xs leading-relaxed pl-2 border-l-2 ${CLAIM_META[type].border} text-gray-700`}>
                                {claim.text}
                                {claim.pageRef && <span className="block text-gray-400 mt-0.5">{claim.pageRef}</span>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500 text-sm">Loading…</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <button onClick={() => navigate('/projects')} className="text-sm text-blue-600 hover:underline mb-6 inline-block">
          ← Back to Projects
        </button>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <h1 className="text-2xl font-semibold text-gray-900 mb-1">{project?.name}</h1>
        {project?.description && <p className="text-gray-500 text-sm mb-6">{project.description}</p>}

        <div className="flex border-b border-gray-200 mb-6 mt-4">
          {(['papers', 'summaries', 'claims', 'comparison'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'papers'     && renderPapersTab()}
        {activeTab === 'summaries'  && renderSummariesTab()}
        {activeTab === 'claims'     && renderClaimsTab()}
        {activeTab === 'comparison' && renderComparisonTab()}
      </div>
    </div>
  );
}
