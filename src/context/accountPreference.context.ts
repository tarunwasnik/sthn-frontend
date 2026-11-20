import { createContext } from "react";
import type { AccountPreferences } from "../api/accountPreferences";

export type AccountPreferenceContextValue = {
  preferences: AccountPreferences | null;
  loading: boolean;
  updatePreferences: (update: Partial<AccountPreferences>) => Promise<AccountPreferences>;
};

export const AccountPreferenceContext = createContext<AccountPreferenceContextValue | undefined>(undefined);
