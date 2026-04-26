// frontend/src/components/common/SkeletonCard.tsx

export default function SkeletonCard({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/5 ${className}`}
    />
  );
}