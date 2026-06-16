import { useNavigate } from 'react-router-dom';
import { getToken } from '../api/client';

export default function LandingPage() {
  const navigate = useNavigate();

  function handleEnter() {
    if (getToken()) {
      navigate('/projects');
    } else {
      navigate('/login');
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <span className="text-lg font-semibold text-gray-900">Epistemia</span>
        <button
          onClick={handleEnter}
          className="bg-blue-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {getToken() ? 'Go to app' : 'Sign in'}
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Understanding complex research questions without working through every single line in papers.
          </h1>
          <p className="text-lg text-gray-500 mb-10">
            Collect claims from papers, group them into clusters, and compare evidence side by side.
          </p>
          <button
            onClick={handleEnter}
            className="bg-blue-600 text-white px-8 py-3 rounded text-base font-medium hover:bg-blue-700 transition-colors"
          >
            {getToken() ? 'Go to app' : 'Get started'}
          </button>
        </div>
      </main>
    </div>
  );
}
