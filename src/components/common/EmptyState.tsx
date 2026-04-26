// frontend/src/components/common/EmptyState.tsx

export default function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="text-center py-8 text-gray-400 text-sm">
      {text}
    </div>
  );
}