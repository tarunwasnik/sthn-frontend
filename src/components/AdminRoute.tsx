// frontend/src/components/AdminRoute.tsx

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface AdminRouteProps {
  children: ReactNode;
}

export default function AdminRoute({
  children,
}: AdminRouteProps) {
  const { isAuthenticated, role, loading } = useAuth();

  // Auth still bootstrapping
  if (loading) {
    return <div>Checking access...</div>;
  }

  // Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not admin
  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Authorized admin
  return <>{children}</>;
}