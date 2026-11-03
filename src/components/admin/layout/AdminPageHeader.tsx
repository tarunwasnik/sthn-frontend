//frontend/src/components/admin/layout/AdminPageHeader.tsx
import React from "react";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function AdminPageHeader({
  title,
  description,
  children,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-5 border-b border-theme-border pb-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight text-theme-text">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-theme-muted">
            {description}
          </p>
        )}
      </div>

      {children && (
        <div className="flex flex-wrap items-center justify-end gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
