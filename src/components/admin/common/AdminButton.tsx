//frontend/src/components/admin/common/AdminButton.tsx

import React from "react";

type Variant = "primary" | "secondary" | "success" | "danger" | "ghost";

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "border border-transparent bg-theme-primary text-theme-primary-text hover:opacity-90 active:opacity-80",

  secondary:
    "border border-theme-border-strong bg-transparent text-theme-text hover:bg-theme-inset",

  success:
    "border border-theme-success bg-theme-success-tint text-theme-success hover:opacity-90",

  danger: "border border-theme-danger bg-theme-danger-tint text-theme-danger hover:opacity-90",

  ghost:
    "border border-transparent bg-transparent text-theme-muted hover:bg-theme-inset hover:text-theme-text",
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
        rounded-[var(--radius-control)]
        px-4
        text-sm
        font-medium
        transition-colors
        focus-visible:outline-none
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
