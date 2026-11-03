import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  applyTheme,
  getStoredThemePreference,
  getSystemPrefersDark,
  resolveTheme,
  storeThemePreference,
  type ThemePreference,
} from "./theme";
import { ThemeContext } from "./ThemeContext";

function subscribeToSystemTheme(notify: () => void): () => void {
  const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (!mediaQuery) return () => {};

  mediaQuery.addEventListener("change", notify);
  return () => mediaQuery.removeEventListener("change", notify);
}

function getServerSystemThemePreference(): boolean {
  return false;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(getStoredThemePreference);
  const prefersDark = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemPrefersDark,
    getServerSystemThemePreference,
  );
  const resolvedTheme = resolveTheme(preference, prefersDark);

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    storeThemePreference(nextPreference);
    setPreferenceState(nextPreference);
  }, []);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
