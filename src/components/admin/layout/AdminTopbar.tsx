//frontend/src/components/admin/layout/AdminTopbar.tsx
import { Link } from "react-router-dom";

type Workspace = "operations" | "system";

interface AdminTopbarProps {
  workspace: Workspace;
}

export default function AdminTopbar({ workspace }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur">
      <div className="flex h-full items-center justify-between px-8">
        {/* ======================================================
            BRAND + WORKSPACE SWITCHER
        ====================================================== */}

        <div className="flex items-center gap-10">
          <h1 className="text-xl font-bold tracking-wide text-white">
            STHN Admin
          </h1>

          <div className="flex overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900">
            <Link
              to="/admin/operations"
              className={`px-5 py-2 text-sm font-medium transition ${
                workspace === "operations"
                  ? "bg-blue-600 text-white"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              Operations
            </Link>

            <Link
              to="/admin/system"
              className={`px-5 py-2 text-sm font-medium transition ${
                workspace === "system"
                  ? "bg-blue-600 text-white"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              System
            </Link>
          </div>
        </div>

        {/* ======================================================
            RIGHT SIDE
        ====================================================== */}

        <div className="flex items-center gap-4">
          {/* Notifications */}

          <button className="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-300 transition hover:border-neutral-500 hover:text-white">
            Notifications
          </button>

          {/* Admin */}

          <button className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:border-neutral-500">
            Admin ▼
          </button>
        </div>
      </div>
    </header>
  );
}
