import { useContext } from "react";
import { AccountPreferenceContext } from "../context/accountPreference.context";

export function useAccountPreferences() {
  const context = useContext(AccountPreferenceContext);
  if (!context) throw new Error("useAccountPreferences must be used within AccountPreferenceProvider");
  return context;
}
