import { Navigate, useLocation } from 'react-router-dom';
import { PropsWithChildren } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function RequireAuth({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-slate-300">
        加载中...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return children;
}

