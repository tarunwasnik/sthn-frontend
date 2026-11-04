// frontend/src/pages/admin/system/SystemDashboard.tsx

import AdminLayout from "../../../components/admin/layout/AdminLayout";

export default function SystemDashboard() {
  return (
    <AdminLayout workspace="system">
      {/* ======================================================
          SYSTEM OVERVIEW (PLACEHOLDER)
      ====================================================== */}

      <div className="space-y-3">
        <h1 className="text-3xl font-bold">System Dashboard</h1>

        <p className="text-neutral-400">
          Welcome to the STHN System Workspace.
        </p>
      </div>
    </AdminLayout>
  );
}
