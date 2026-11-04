// frontend/src/pages/admin/AdminEntry.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useToast } from "../../hooks/useToast";

type AdminMode = "SYSTEM" | "OPERATIONS";

export default function AdminEntry() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState<AdminMode | null>(null);

  const selectMode = async (mode: AdminMode) => {
    try {
      setLoading(mode);
      const res = await api.post("/admin/mode", {
        mode,
      });

      const { redirectTo } = res.data;

      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error("Failed to set admin mode", err);
      showToast("Failed to enter admin mode. Please try again.", "error");
      setLoading(null);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-theme-bg px-4 py-8 font-sans text-theme-text sm:px-6 lg:px-8">
      <section className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Choose Admin Workspace</h1>
        <p className="mt-2 text-sm text-theme-muted">
          Select the workspace that matches the work you need to complete.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {/* SYSTEM MODE */}
          <button
            type="button"
            onClick={() => selectMode("SYSTEM")}
            aria-busy={loading === "SYSTEM"}
            className={`min-h-40 rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-6 text-left shadow-sm transition-colors hover:border-theme-border-strong hover:bg-theme-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent ${loading && loading !== "SYSTEM" ? "opacity-50" : ""}`}
          >
            <h2 className="text-lg font-semibold">System</h2>
            <p className="mt-2 text-sm leading-6 text-theme-muted">Rules, automation, metrics, platform health</p>
            {loading === "SYSTEM" && <p className="mt-4 text-sm font-medium text-theme-accent">Entering…</p>}
          </button>

          {/* OPERATIONS MODE */}
          <button
            type="button"
            onClick={() => selectMode("OPERATIONS")}
            aria-busy={loading === "OPERATIONS"}
            className={`min-h-40 rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-6 text-left shadow-sm transition-colors hover:border-theme-border-strong hover:bg-theme-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent ${loading && loading !== "OPERATIONS" ? "opacity-50" : ""}`}
          >
            <h2 className="text-lg font-semibold">Operations</h2>
            <p className="mt-2 text-sm leading-6 text-theme-muted">Bookings, disputes, manual interventions</p>
            {loading === "OPERATIONS" && <p className="mt-4 text-sm font-medium text-theme-accent">Entering…</p>}
          </button>
        </div>
      </section>
    </main>
  );
}
