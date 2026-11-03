//frontend/src/components/admin/layout/AdminMetricCard.tsx

import React from "react";

interface AdminMetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: React.ReactNode;
}

export default function AdminMetricCard({
  label,
  value,
  subtitle,
  icon,
  trend,
}: AdminMetricCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-5 transition-colors hover:border-theme-border-strong">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-theme-muted">
            {label}
          </p>

          <h3 className="mt-2 text-3xl font-bold tracking-tight text-theme-text">
            {value}
          </h3>

          {subtitle && (
            <p className="mt-2 text-sm text-theme-muted">{subtitle}</p>
          )}
        </div>

        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-card)] border border-theme-border bg-theme-inset text-theme-muted">
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-5 border-t border-theme-border pt-3">{trend}</div>
      )}
    </div>
  );
}
