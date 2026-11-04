import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

import api from "../api/axios";

type Workspace = "operations" | "system";
type State = "checking" | "allowed" | "redirect" | "error";

export default function AdminWorkspaceRoute({
  workspace,
  children,
}: {
  workspace: Workspace;
  children: ReactNode;
}) {
  const [state, setState] = useState<State>("checking");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let disposed = false;
    const verifyWorkspace = async () => {
      setState("checking");
      setError(null);
      try {
        await api.get(`/admin/${workspace}/bootstrap`);
        if (!disposed) setState("allowed");
      } catch (caught) {
        if (disposed) return;
        const redirectTo = axios.isAxiosError(caught) && typeof caught.response?.data?.redirectTo === "string"
          ? caught.response.data.redirectTo
          : null;
        if (redirectTo === "/admin/entry") setState("redirect");
        else {
          setError(axios.isAxiosError(caught) && typeof caught.response?.data?.message === "string"
            ? caught.response.data.message
            : "Unable to verify the selected Admin workspace.");
          setState("error");
        }
      }
    };
    void verifyWorkspace();
    return () => { disposed = true; };
  }, [workspace, attempt]);

  if (state === "allowed") return <>{children}</>;
  if (state === "redirect") return <Navigate to="/admin/entry" replace />;
  if (state === "error") {
    return <div className="flex min-h-screen items-center justify-center bg-theme-bg p-6 text-theme-text"><div className="w-full max-w-md rounded-[var(--radius-card)] border border-theme-danger bg-theme-surface p-6 text-center"><h1 className="text-lg font-semibold">Admin workspace unavailable</h1><p role="alert" className="mt-2 text-sm text-theme-danger">{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-5 rounded-[var(--radius-control)] border border-theme-border px-4 py-2 text-sm font-semibold text-theme-text">Retry</button></div></div>;
  }
  return <div className="flex min-h-screen items-center justify-center bg-theme-bg text-theme-muted">Checking workspace access…</div>;
}
