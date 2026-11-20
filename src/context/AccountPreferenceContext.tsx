import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { getAccountPreferences, updateAccountPreferences, type AccountPreferences } from "../api/accountPreferences";
import { useAuth } from "../hooks/useAuth";
import { setActiveDisplayTimeZone } from "../utils/displayTimeZone";
import { AccountPreferenceContext } from "./accountPreference.context";

export function AccountPreferenceProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [preferences, setPreferences] = useState<AccountPreferences | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setActiveDisplayTimeZone(null);
    // The account identity changed; never expose the previous identity's preference while loading.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreferences(null);
    if (!userId) return () => { cancelled = true; };
    setLoading(true);
    void getAccountPreferences().then((next) => {
      if (cancelled) return;
      setPreferences(next); setActiveDisplayTimeZone(next.displayTimeZone);
    }).catch(() => undefined).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  const updatePreferences = useCallback(async (update: Partial<AccountPreferences>) => {
    const next = await updateAccountPreferences(update);
    setPreferences(next); setActiveDisplayTimeZone(next.displayTimeZone);
    return next;
  }, []);
  const value = useMemo(() => ({ preferences, loading, updatePreferences }), [loading, preferences, updatePreferences]);
  return <AccountPreferenceContext.Provider value={value}>{children}</AccountPreferenceContext.Provider>;
}
