/**
 * Frontend Authentication Service
 * Manages authentication tokens, session, and user state
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: Date;
}

class AuthServiceClient {
  private session: AuthSession | null = null;
  private listeners: Set<(session: AuthSession | null) => void> = new Set();

  /**
   * Initialize auth (check for existing token)
   */
  async initialize(): Promise<void> {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("auth_token");
    if (token) {
      try {
        const response = await apiClient.get<AuthUser>("/api/v1/user/profile");
        if (response.success && response.data) {
          this.setSession({
            user: response.data,
            token,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          });
        } else {
          this.clearSession();
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        this.clearSession();
      }
    }
  }

  /**
   * Login with email and password
   */
  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.post<{
        user: AuthUser;
        token: string;
      }>("/api/v1/auth/login", { email, password });

      if (response.success && response.data) {
        const { user, token } = response.data;
        localStorage.setItem("auth_token", token);

        this.setSession({
          user,
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        return { success: true };
      }

      return { success: false, error: response.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    }
  }

  /**
   * Sign up new user
   */
  async signup(
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.post("/api/v1/auth/signup", {
        email,
        password,
        name,
      });

      if (response.success) {
        return { success: true };
      }

      return { success: false, error: response.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sign up failed",
      };
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      // Notify backend about logout if needed
      await apiClient.post("/api/v1/auth/logout", {});
    } catch (error) {
      console.error("Logout error:", error);
    }

    this.clearSession();
  }

  /**
   * Get current session
   */
  getSession(): AuthSession | null {
    return this.session;
  }

  /**
   * Set session
   */
  private setSession(session: AuthSession | null): void {
    this.session = session;
    this.notifyListeners();
  }

  /**
   * Clear session
   */
  private clearSession(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
    this.setSession(null);
  }

  /**
   * Subscribe to session changes
   */
  subscribe(listener: (session: AuthSession | null) => void): () => void {
    this.listeners.add(listener);
    // Call immediately with current state
    listener(this.session);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      listener(this.session);
    });
  }
}

export const authServiceClient = new AuthServiceClient();

/**
 * React Hook for using auth service
 */
export function useAuthClient() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth on mount
    authServiceClient.initialize().finally(() => setLoading(false));

    // Subscribe to session changes
    const unsubscribe = authServiceClient.subscribe((newSession) => {
      setSession(newSession);
    });

    return unsubscribe;
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      return authServiceClient.login(email, password);
    },
    []
  );

  const signup = useCallback(
    async (email: string, password: string, name: string) => {
      return authServiceClient.signup(email, password, name);
    },
    []
  );

  const logout = useCallback(async () => {
    return authServiceClient.logout();
  }, []);

  return {
    session,
    user: session?.user || null,
    isAuthenticated: !!session,
    loading,
    login,
    signup,
    logout,
  };
}
