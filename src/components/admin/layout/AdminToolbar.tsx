//frontend/src/components/admin/layout/AdminToolbar.tsx

import React from "react";

interface AdminToolbarProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
}

export default function AdminToolbar({ left, right }: AdminToolbarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3">{left}</div>

      {right && (
        <div className="flex flex-wrap items-center justify-end gap-3">
          {right}
        </div>
      )}
    </div>
  );
}
