// frontend/src/components/common/SectionCard.tsx

import type { ReactNode } from "react";
import DashboardCard from "./DashboardCard";

export default function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <DashboardCard>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm text-gray-300">{title}</h2>
        {action}
      </div>

      {children}
    </DashboardCard>
  );
}