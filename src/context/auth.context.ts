import { createContext } from "react";

export type Role = "user" | "creator" | "admin" | null;

export type CreatorStatus =
  | "none"
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | null;

export interface AuthEntry {
  entryType: "ADMIN" | "CREATOR" | "USER" | "ONBOARDING" | "CREATOR_PENDING";
  entryRoute: string;
  userId: string;
  creatorStatus?: CreatorStatus;
}

export interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  role: Role;
  creatorStatus: CreatorStatus;
  loading: boolean;
  entryRoute: string | null;
  entryType: string | null;
}

export interface AuthContextType extends AuthState {
  login: (token: string) => Promise<void>;
  logout: () => void;
  bootstrap: () => Promise<AuthEntry | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
