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
      className={`rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-4 ${className}`}
    >
      {children}
    </div>
  );
}