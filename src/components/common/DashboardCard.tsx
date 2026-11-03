// frontend/src/components/common/DashboardCard.tsx

import type { ReactNode } from "react";

export default function DashboardCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-4 shadow-sm sm:p-5 ${className}`}
    >
      {children}
    </div>
  );
}
