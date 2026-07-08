//frontend/src/components/admin/common/AdminFilterBar.tsx

import React from "react";

interface AdminFilterBarProps {
  children: React.ReactNode;
}

export default function AdminFilterBar({ children }: AdminFilterBarProps) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}
