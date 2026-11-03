//frontend/src/components/admin/feedback/AdminEmptyState.tsx

import React from "react";
import { Inbox } from "lucide-react";

interface AdminEmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function AdminEmptyState({
  title,
  description,
  action,
}: AdminEmptyStateProps) {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-theme-border-strong bg-theme-surface px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-card)] bg-theme-inset">
        <Inbox className="h-8 w-8 text-theme-muted" />
      </div>

      <h2 className="mt-6 text-xl font-semibold text-theme-text">{title}</h2>

      {description && (
        <p className="mt-3 max-w-md text-sm leading-6 text-theme-muted">
          {description}
        </p>
      )}

      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
