// frontend/src/components/common/ActionButton.tsx

import type { ReactNode } from "react";

export default function ActionButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-[0.97] transition"
    >
      {icon && <div className="text-white/70">{icon}</div>}
      <span className="text-sm text-white">{label}</span>
    </button>
  );
}