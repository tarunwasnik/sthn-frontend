// frontend/src/pages/EntryLoader.tsx

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const EntryLoader = () => {
  const navigate = useNavigate();
  const resolvedRef = useRef(false);

  useEffect(() => {
    const resolveEntry = async () => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;

      try {
        const res = await api.get("/auth/entry");

        const { entryRoute } = res.data;

        if (!entryRoute) {
          navigate("/login", { replace: true });
          return;
        }

        navigate(entryRoute, { replace: true });

      } catch (err) {
        navigate("/login", { replace: true });
      }
    };

    resolveEntry();
  }, [navigate]);

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