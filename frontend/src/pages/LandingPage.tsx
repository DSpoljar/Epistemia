import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <h1 className="text-4xl font-semibold text-gray-900 mb-4">Epistemia</h1>
        <p className="text-gray-600 mb-8">
          Organize and compare evidence across scientific papers.
        </p>
        <button
          onClick={() => navigate('/projects')}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          View Projects
        </button>
      </div>
    </div>
  );
}
