// frontend/src/context/AuthContext.tsx

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import api from "../api/axios";

type Role = "user" | "creator" | "admin" | null;

type CreatorStatus =
  | "none"
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | null;

interface AuthState {
  isAuthenticated: boolean;
  role: Role;
  creatorStatus: CreatorStatus;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string) => Promise<void>;
  logout: () => void;
  bootstrap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [isAuthenticated, setIsAuthenticated] =
    useState(false);

  const [role, setRole] = useState<Role>(null);

  const [creatorStatus, setCreatorStatus] =
    useState<CreatorStatus>(null);

  const [loading, setLoading] = useState(true);

  const bootstrap = async () => {
    try {
      setLoading(true);

      const res = await api.get("/auth/entry");

      const { entryType, creatorStatus } = res.data;

      const normalizedRole: Role =
        entryType === "ADMIN"
          ? "admin"
          : entryType === "CREATOR"
          ? "creator"
          : entryType === "USER"
          ? "user"
          : null;

      setIsAuthenticated(true);
      setRole(normalizedRole);
      setCreatorStatus(creatorStatus ?? "none");
    } catch {
      setIsAuthenticated(false);
      setRole(null);
      setCreatorStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (token: string) => {
    localStorage.setItem("accessToken", token);

    api.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${token}`;

    await bootstrap();
  };

  const logout = () => {
    localStorage.removeItem("accessToken");

    delete api.defaults.headers.common["Authorization"];

    setIsAuthenticated(false);
    setRole(null);
    setCreatorStatus(null);
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      api.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      bootstrap();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        role,
        creatorStatus,
        loading,
        login,
        logout,
        bootstrap,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return context;
};