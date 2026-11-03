// frontend/src/components/common/EmptyState.tsx

export default function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-theme-border bg-theme-inset px-4 py-8 text-center text-sm text-theme-muted">
      {text}
    </div>
  );
}
