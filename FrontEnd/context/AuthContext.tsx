"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      setLoading(true);
      const data = await api.get<{ success: boolean; user: User }>("/api/auth/me");
      if (data.success) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: any) => {
    const data = await api.post<{ success: boolean; user: User; token: string }>("/api/auth/login", credentials);
    if (data.success) {
      localStorage.setItem("auth_token", data.token);
      setUser(data.user);
    }
  };

  const register = async (userData: any) => {
    const data = await api.post<{ success: boolean; user: User; token: string }>("/api/auth/register", userData);
    if (data.success) {
      localStorage.setItem("auth_token", data.token);
      setUser(data.user);
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
      localStorage.removeItem("auth_token");
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      // Still clear local state even if server logout fails
      localStorage.removeItem("auth_token");
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
