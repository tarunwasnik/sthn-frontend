//frontend/src/components/admin/common/AdminSearch.tsx

import { Search, X } from "lucide-react";

interface AdminSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function AdminSearch({
  value,
  onChange,
  placeholder = "Search...",
}: AdminSearchProps) {
  return (
    <div className="relative w-full max-w-md">
      <Search
        size={18}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted"
      />

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-10 text-sm text-theme-text outline-none transition-colors placeholder:text-theme-muted focus:border-theme-accent"
      />

      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-[var(--radius-control)] p-1 text-theme-muted transition-colors hover:bg-theme-inset hover:text-theme-text"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
