//frontend/src/components/admin/common/AdminButton.tsx

import React from "react";

type Variant = "primary" | "secondary" | "success" | "danger" | "ghost";

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-blue-600 hover:bg-blue-500 text-white border border-blue-500",

  secondary:
    "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",

  success:
    "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500",

  danger: "bg-red-600 hover:bg-red-500 text-white border border-red-500",

  ghost:
    "bg-transparent hover:bg-slate-800 text-slate-300 border border-slate-700",
};

export default function AdminButton({
  variant = "primary",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: AdminButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        inline-flex
        h-10
        items-center
        justify-center
        rounded-lg
        px-4
        text-sm
        font-medium
        transition-colors
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${variants[variant]}
        ${className}
      `}
    >
      {loading ? "Processing..." : children}
    </button>
  );
}
