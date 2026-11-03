// frontend/src/components/common/ActionButton.tsx

import type { ReactNode } from "react";

export default function ActionButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-control)] border border-theme-border bg-theme-inset p-4 text-theme-text transition-colors hover:border-theme-border-strong hover:bg-theme-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
    >
      {icon && <div className="text-theme-muted">{icon}</div>}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
