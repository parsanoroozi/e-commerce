import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

export default function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();

  return (
    <ProtectedRoute>
      {loading ? (
        <div className="page-center">Loading...</div>
      ) : isAdmin ? (
        children
      ) : (
        <Navigate to="/" replace />
      )}
    </ProtectedRoute>
  );
}
