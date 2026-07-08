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
    <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-slate-800 bg-slate-900">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

        <h2 className="mt-6 text-xl font-semibold text-white">{title}</h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      </div>
    </div>
  );
}
