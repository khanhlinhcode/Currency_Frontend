/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const TOKEN_KEY = "token";
const USER_KEY = "auth_user";

function readStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(readStoredUser());
  const [sessionReady, setSessionReady] = useState(false);

  const login = useCallback((payload) => {
    const nextToken =
      typeof payload === "string" ? payload : payload?.access_token || payload?.token;

    if (!nextToken) {
      throw new Error("Token not found in login payload");
    }

    const nextUser =
      typeof payload === "string"
        ? user
        : {
            username: payload?.username || "",
            role: payload?.role || (payload?.is_admin ? "admin" : "analyst"),
            is_admin: Boolean(payload?.is_admin),
          };

    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);

    if (nextUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
    }
  }, [user]);

  const logout = useCallback(() => {
    clearAuthStorage();
    setToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setSessionReady(true);
      return;
    }

    try {
      const res = await api.get("/me");
      const profile = {
        username: res.data?.username || "",
        role: res.data?.role || (res.data?.is_admin ? "admin" : "analyst"),
        is_admin: Boolean(res.data?.is_admin),
      };

      localStorage.setItem(USER_KEY, JSON.stringify(profile));
      setUser(profile);
    } catch {
      clearAuthStorage();
      setToken(null);
      setUser(null);
    } finally {
      setSessionReady(true);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const value = useMemo(() => {
    const role = user?.role || (user?.is_admin ? "admin" : null);
    const isAuthenticated = Boolean(token);

    return {
      token,
      user,
      role,
      isAdmin: role === "admin",
      isAuthenticated,
      sessionReady,
      login,
      logout,
      refreshProfile,
    };
  }, [login, logout, refreshProfile, sessionReady, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
