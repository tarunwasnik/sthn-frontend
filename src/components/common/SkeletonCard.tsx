// frontend/src/components/common/SkeletonCard.tsx

export default function SkeletonCard({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-[var(--radius-card)] border border-theme-border bg-theme-inset ${className}`}
    />
  );
}
