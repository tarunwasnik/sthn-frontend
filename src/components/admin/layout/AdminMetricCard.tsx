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
    <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-slate-700">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <h3 className="mt-2 text-3xl font-bold tracking-tight text-white">
            {value}
          </h3>

          {subtitle && (
            <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
          )}
        </div>

        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300">
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-5 border-t border-slate-800 pt-3">{trend}</div>
      )}
    </div>
  );
}
