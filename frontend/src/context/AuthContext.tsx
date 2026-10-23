"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { SafeUser, LoginUserInput, RegisterUserInput } from "@insight-ignite/shared";
import { apiFetch } from "@/lib/api-client";

interface AuthContextType {
  user: SafeUser | null;
  loading: boolean;
  login: (credentials: LoginUserInput) => Promise<SafeUser>;
  register: (data: RegisterUserInput) => Promise<{ user: SafeUser; emailDelivered: boolean; emailSimulated?: boolean; verificationToken?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_CHANNEL = "insight-ignite-auth";

function announceSessionChange() {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(AUTH_CHANNEL);
  channel.postMessage("session-changed");
  channel.close();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiFetch<{ user: SafeUser }>("/auth/me");
      if (res && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadCurrentSession() {
      try {
        const res = await apiFetch<{ user: SafeUser }>("/auth/me");
        if (!isCancelled && res && res.user) {
          setUser(res.user);
        } else if (!isCancelled) {
          setUser(null);
        }
      } catch {
        if (!isCancelled) {
          setUser(null);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadCurrentSession();

    return () => {
      isCancelled = true;
    };
  }, []);

  // The session cookie is shared by every tab, so signing in or out in one tab
  // changes who the others are acting as. Re-check the session when another tab
  // announces a change, and whenever this tab regains focus.
  useEffect(() => {
    const channel =
      typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(AUTH_CHANNEL) : null;
    if (channel) {
      channel.onmessage = () => {
        refreshUser();
      };
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshUser();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      channel?.close();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [refreshUser]);

  const login = async (credentials: LoginUserInput): Promise<SafeUser> => {
    const res = await apiFetch<{ user: SafeUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    setUser(res.user);
    announceSessionChange();
    return res.user;
  };

  const register = async (
    data: RegisterUserInput
  ): Promise<{ user: SafeUser; emailDelivered: boolean; emailSimulated?: boolean; verificationToken?: string }> => {
    const res = await apiFetch<{ user: SafeUser; emailDelivered: boolean; emailSimulated?: boolean; verificationToken?: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res;
  };

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Clear client state even if backend network call failed
    }
    setUser(null);
    announceSessionChange();
  };

  const isAuthenticated = Boolean(user && user.isActive);
  const isAdmin = Boolean(
    user && (user.role === "PLATFORM_ADMIN" || user.role === "SCHOOL_ADMIN")
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
