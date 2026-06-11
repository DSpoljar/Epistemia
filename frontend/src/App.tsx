import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import ClaimsView from './pages/ClaimsView';
import ClustersView from './pages/ClustersView';

const router = createBrowserRouter([
  { path: '/',                        element: <LandingPage /> },
  { path: '/projects',                element: <Dashboard /> },
  { path: '/projects/:id',            element: <ProjectDetail /> },
  { path: '/projects/:id/clusters',   element: <ClustersView /> },
  { path: '/papers/:paperId/claims',  element: <ClaimsView /> },
  { path: '*',                        element: <Navigate to="/" replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
