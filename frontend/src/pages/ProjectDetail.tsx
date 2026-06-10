import { useNavigate, useParams } from 'react-router-dom';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate('/projects')}
          className="text-sm text-blue-600 hover:underline mb-6 inline-block"
        >
          ← Back to Projects
        </button>
        <p className="text-gray-400 text-sm">Project ID: {id}</p>
        <p className="text-gray-500 mt-4 text-sm">Papers — coming in Phase 2.</p>
      </div>
    </div>
  );
}
