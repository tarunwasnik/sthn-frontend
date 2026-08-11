// frontend/src/pages/EntryLoader.tsx

import { Navigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

const EntryLoader = () => {
  const { loading, isAuthenticated, entryRoute } = useAuth();

  if (!loading && !isAuthenticated) return <Navigate to="/login" replace />;
  if (!loading && entryRoute) return <Navigate to={entryRoute} replace />;

  return (
    <div
      style={{
        height: "100vh",
        display: "grid",
        placeItems: "center",
      }}
    >
      <p>Verifying access…</p>
    </div>
  );
};

export default EntryLoader;
