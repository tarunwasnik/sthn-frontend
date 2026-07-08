// frontend/src/components/admin/layout/AdminLayout.tsx

import type { ReactNode } from "react";

import AdminTopbar from "./AdminTopbar";
import AdminSidebar from "./AdminSidebar";

type Workspace = "operations" | "system";

interface AdminLayoutProps {
  workspace: Workspace;
  children: ReactNode;
}

export default function AdminLayout({ workspace, children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* ======================================================
          TOP BAR
      ====================================================== */}

      <AdminTopbar workspace={workspace} />

      {/* ======================================================
          BODY
      ====================================================== */}

      <div className="flex h-[calc(100vh-4rem)]">
        {/* ======================================================
            SIDEBAR
        ====================================================== */}

        <AdminSidebar workspace={workspace} />

        {/* ======================================================
            MAIN CONTENT
        ====================================================== */}

        <main className="flex-1 overflow-y-auto bg-neutral-950">
          <div className="mx-auto max-w-7xl p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
