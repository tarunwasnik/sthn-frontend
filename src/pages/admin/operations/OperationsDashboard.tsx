// frontend/src/pages/admin/operations/OperationsDashboard.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";

export default function OperationsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await api.get("/admin/operations/bootstrap");
        setLoading(false);
      } catch (err: any) {
        setError("Access denied");
        setTimeout(() => {
          navigate("/admin/entry", { replace: true });
        }, 300);
      }
    };

    bootstrap();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ padding: 32 }}>
        <p>Initializing operations dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32 }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 32 }}>
      <h2>Operations Dashboard</h2>
      <p>Operations dashboard initialized.</p>
    </div>
  );
}