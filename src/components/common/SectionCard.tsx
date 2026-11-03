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
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-theme-text">{title}</h2>
        {action}
      </div>

      {children}
    </DashboardCard>
  );
}
