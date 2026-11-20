import api from "./axios";

export interface AccountPreferences {
  displayTimeZone: string | null;
}

export async function getAccountPreferences(): Promise<AccountPreferences> {
  return (await api.get<{ preferences: AccountPreferences }>("/v1/account-preferences/me")).data.preferences;
}

export async function updateAccountPreferences(update: Partial<AccountPreferences>): Promise<AccountPreferences> {
  return (await api.patch<{ preferences: AccountPreferences }>("/v1/account-preferences/me", update)).data.preferences;
}
