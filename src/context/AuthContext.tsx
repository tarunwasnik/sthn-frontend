// frontend/src/context/AuthContext.tsx

import { socket } from "../lib/socket";

import { useEffect, useState, useCallback } from "react";

import type { ReactNode } from "react";

import api from "../api/axios";
import {
  clearAccessToken,
  getAccessToken,
  SESSION_EXPIRED_EVENT,
  storeAccessToken,
} from "../auth/session";
import {
  AuthContext,
  type AuthEntry,
  type CreatorStatus,
  type Role,
} from "./auth.context";

interface AuthMe {
  id: string;
  role: Exclude<Role, null>;
  status: string;
  creatorStatus?: CreatorStatus;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  const [role, setRole] = useState<Role>(null);

  const [creatorStatus, setCreatorStatus] = useState<CreatorStatus>(null);

  const [loading, setLoading] = useState(true);
  const [entryRoute, setEntryRoute] = useState<string | null>(null);
  const [entryType, setEntryType] = useState<string | null>(null);

  const clearAuthState = useCallback(() => {
    setIsAuthenticated(false);
    setUserId(null);
    setRole(null);
    setCreatorStatus(null);
    setEntryRoute(null);
    setEntryType(null);
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      setLoading(true);

      const [entryResponse, meResponse] = await Promise.all([
        api.get<AuthEntry>("/auth/entry"),
        api.get<AuthMe>("/auth/me"),
      ]);
      const entry = entryResponse.data;
      const me = meResponse.data;

      const normalizedRole: Role =
        entry.entryType === "ADMIN"
          ? "admin"
          : entry.entryType === "CREATOR"
            ? "creator"
            : entry.entryType === "USER" || entry.entryType === "ONBOARDING" || entry.entryType === "CREATOR_PENDING"
              ? "user"
              : null;

      setIsAuthenticated(true);

      setRole(normalizedRole);

      setUserId(entry.userId ?? me.id ?? null);
      setCreatorStatus(me.creatorStatus ?? entry.creatorStatus ?? "none");
      setEntryRoute(entry.entryRoute ?? null);
      setEntryType(entry.entryType ?? null);
      return entry;
    } catch {
      clearAuthState();
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearAuthState]);

  const login = async (token: string) => {
    storeAccessToken(token);
    await bootstrap();
  };

  const logout = () => {
    clearAccessToken();
    clearAuthState();
  };

  useEffect(() => {
    const token = getAccessToken();

    if (token) {
      bootstrap();
    } else {
      setLoading(false);
    }
  }, [bootstrap]);

  useEffect(() => {
    const handleSessionExpired = () => clearAuthState();
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [clearAuthState]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    socket.emit("user-online", userId);
  }, [userId]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userId,
        role,
        creatorStatus,
        loading,
        entryRoute,
        entryType,
        login,
        logout,
        bootstrap,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

