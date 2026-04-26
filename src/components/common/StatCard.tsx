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
    <DashboardCard className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-white/70">{icon}</span>
      </div>

      <p className="text-lg font-semibold text-white mt-2">
        {value}
      </p>
    </DashboardCard>
  );
}