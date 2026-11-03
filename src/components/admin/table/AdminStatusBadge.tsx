//frontend/src/components/admin/table/AdminStatusBadge.tsx

interface AdminStatusBadgeProps {
  status: string;
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
}

const toneStyles = {
  success: "border-theme-success bg-theme-success-tint text-theme-success",
  warning: "border-theme-warning bg-theme-warning-tint text-theme-warning",
  danger: "border-theme-danger bg-theme-danger-tint text-theme-danger",
  info: "border-theme-info bg-theme-info-tint text-theme-info",
  neutral: "border-theme-border-strong bg-theme-inset text-theme-muted",
};

export default function AdminStatusBadge({ status, tone = "neutral" }: AdminStatusBadgeProps) {
  const classes = toneStyles[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium capitalize ${classes}`}
    >
      <span className="mr-2 h-2 w-2 rounded-full bg-current opacity-80" />

      {status.replace(/_/g, " ")}
    </span>
  );
}
