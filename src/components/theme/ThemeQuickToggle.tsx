import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../theme/useTheme";

interface ThemeQuickToggleProps {
  className?: string;
}

export default function ThemeQuickToggle({ className = "" }: ThemeQuickToggleProps) {
  const { resolvedTheme, setPreference } = useTheme();
  const nextTheme = resolvedTheme === "light" ? "dark" : "light";
  const label = `Switch to ${nextTheme} mode`;

  return (
    <button
      type="button"
      onClick={() => setPreference(nextTheme)}
      aria-label={label}
      title={label}
      className={`h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-theme-border bg-theme-inset text-theme-muted transition-colors hover:border-theme-border-strong hover:bg-theme-surface-raised hover:text-theme-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent ${className}`}
    >
      {resolvedTheme === "light" ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
    </button>
  );
}
