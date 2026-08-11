import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

type GuardProps = {
  children: ReactNode;
};

function GuardLoading() {
  return <div role="status">Checking access...</div>;
}

function LoginRedirect() {
  const location = useLocation();
  return (
    <Navigate
      to="/login"
      replace
      state={{ from: `${location.pathname}${location.search}` }}
    />
  );
}

export function AuthenticatedRoute({ children }: GuardProps) {
  const { loading, isAuthenticated } = useAuth();
  if (loading) return <GuardLoading />;
  if (!isAuthenticated) return <LoginRedirect />;
  return <>{children}</>;
}

export function UserRoute({ children }: GuardProps) {
  const { loading, isAuthenticated, role } = useAuth();
  if (loading) return <GuardLoading />;
  if (!isAuthenticated) return <LoginRedirect />;
  if (role !== "user" && role !== "creator") return <Navigate to="/entry" replace />;
  return <>{children}</>;
}

export function CreatorRoute({ children }: GuardProps) {
  const { loading, isAuthenticated, role } = useAuth();
  if (loading) return <GuardLoading />;
  if (!isAuthenticated) return <LoginRedirect />;
  if (role !== "creator") return <Navigate to="/entry" replace />;
  return <>{children}</>;
}
