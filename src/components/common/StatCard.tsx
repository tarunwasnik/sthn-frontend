// frontend/src/components/common/StatCard.tsx

import type { ReactNode } from "react";
import DashboardCard from "./DashboardCard";

export default function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <DashboardCard className="p-5 transition-colors hover:bg-theme-surface-raised">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-theme-muted">{label}</span>
        <span className="text-theme-muted">{icon}</span>
      </div>

      <p className="mt-2 text-lg font-semibold text-theme-text">
        {value}
      </p>
    </DashboardCard>
  );
}
