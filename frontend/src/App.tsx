import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import ClaimsView from './pages/ClaimsView';
import ClustersView from './pages/ClustersView';
import ClusterDetail from './pages/ClusterDetail';
import ComparisonView from './pages/ComparisonView';
import LoginPage from './pages/LoginPage';
import { getToken } from './api/client';
import ChatWidget from './components/ChatWidget';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return (
    <>
      {children}
      <ChatWidget />
    </>
  );
}

const router = createBrowserRouter([
  { path: '/login',                                              element: <LoginPage /> },
  { path: '/',                                                   element: <LandingPage /> },
  { path: '/projects',                                           element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
  { path: '/projects/:id',                                       element: <ProtectedRoute><ProjectDetail /></ProtectedRoute> },
  { path: '/projects/:id/clusters',                              element: <ProtectedRoute><ClustersView /></ProtectedRoute> },
  { path: '/projects/:id/clusters/:clusterId',                   element: <ProtectedRoute><ClusterDetail /></ProtectedRoute> },
  { path: '/projects/:id/clusters/:clusterId/comparison',        element: <ProtectedRoute><ComparisonView /></ProtectedRoute> },
  { path: '/papers/:paperId/claims',                             element: <ProtectedRoute><ClaimsView /></ProtectedRoute> },
  { path: '*',                                                   element: <Navigate to="/" replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
