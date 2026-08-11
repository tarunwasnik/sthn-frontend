// frontend/src/components/AdminRoute.tsx

import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface AdminRouteProps {
  children: ReactNode;
}

export default function AdminRoute({
  children,
}: AdminRouteProps) {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  // Auth still bootstrapping
  if (loading) {
    return <div>Checking access...</div>;
  }

  // Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  // Logged in but not admin
  if (role !== "admin") {
    return <Navigate to="/entry" replace />;
  }

  // Authorized admin
  return <>{children}</>;
}
