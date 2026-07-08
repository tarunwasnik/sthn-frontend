// frontend/src/pages/admin/operations/OperationsDashboard.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../../api/axios";
import AdminLayout from "../../../components/admin/layout/AdminLayout";

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
      <AdminLayout workspace="operations">
        <div className="flex h-[70vh] items-center justify-center">
          <p className="text-neutral-400">
            Initializing Operations Workspace...
          </p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout workspace="operations">
        <div className="flex h-[70vh] items-center justify-center">
          <p className="text-red-400">{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout workspace="operations">
      {/* ======================================================
          OPERATIONS OVERVIEW (PLACEHOLDER)
      ====================================================== */}

      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Operations Dashboard</h1>

        <p className="text-neutral-400">
          Welcome to the STHN Operations Workspace.
        </p>
      </div>
    </AdminLayout>
  );
}
