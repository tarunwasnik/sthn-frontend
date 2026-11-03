//frontend/src/components/admin/feedback/AdminLoadingState.tsx

interface AdminLoadingStateProps {
  title?: string;
  description?: string;
}

export default function AdminLoadingState({
  title = "Loading...",
  description = "Please wait while we fetch the latest data.",
}: AdminLoadingStateProps) {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-[var(--radius-card)] border border-theme-border bg-theme-surface">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-theme-border-strong border-t-theme-accent" />

        <h2 className="mt-6 text-xl font-semibold text-theme-text">{title}</h2>

        <p className="mt-2 text-sm leading-6 text-theme-muted">{description}</p>
      </div>
    </div>
  );
}
