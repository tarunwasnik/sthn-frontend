//frontend/src/components/admin/table/AdminStatusBadge.tsx

interface AdminStatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border border-amber-500/30",

  approved: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",

  rejected: "bg-red-500/15 text-red-400 border border-red-500/30",

  active: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",

  inactive: "bg-slate-700/40 text-slate-300 border border-slate-600",

  suspended: "bg-orange-500/15 text-orange-400 border border-orange-500/30",

  verified: "bg-blue-500/15 text-blue-400 border border-blue-500/30",

  unverified: "bg-slate-700/40 text-slate-300 border border-slate-600",

  completed: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",

  cancelled: "bg-red-500/15 text-red-400 border border-red-500/30",

  disputed: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
};

export default function AdminStatusBadge({ status }: AdminStatusBadgeProps) {
  const key = status.toLowerCase();

  const classes =
    statusStyles[key] ??
    "bg-slate-700/40 text-slate-300 border border-slate-600";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${classes}`}
    >
      <span className="mr-2 h-2 w-2 rounded-full bg-current opacity-80" />

      {status.replace(/_/g, " ")}
    </span>
  );
}
