import { useNavigate, useParams } from 'react-router-dom';

export default function ClaimsView() {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline mb-6 inline-block">
          ← Back
        </button>
        <p className="text-gray-400 text-sm">Paper ID: {paperId}</p>
        <p className="text-gray-500 mt-4 text-sm">Claims — coming in Phase 3.</p>
      </div>
    </div>
  );
}
