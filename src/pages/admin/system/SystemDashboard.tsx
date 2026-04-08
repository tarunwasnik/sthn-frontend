// frontend/src/pages/admin/system/SystemDashboard.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";

export default function SystemDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await api.get("/admin/system/bootstrap");
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
        <p>Initializing system dashboard…</p>
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
      <h2>System Dashboard</h2>
      <p>System dashboard initialized.</p>
    </div>
  );
}