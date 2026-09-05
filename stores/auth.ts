import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/types/database";

// ============================================================
// Auth Store
// ============================================================

interface AuthState {
  /** Supabase user (null if not authenticated) */
  user: User | null;
  /** User profile (null if not authenticated or not loaded) */
  profile: UserProfile | null;
  /** Whether auth state has been initialized */
  isInitialized: boolean;
  /** Loading state for auth operations */
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setInitialized: (initialized: boolean) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;

  // Derived
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  getFullName: () => string;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  profile: null,
  isInitialized: false,
  isLoading: false,

  setUser: (user) => set({ user }),

  setProfile: (profile) => set({ profile }),

  setInitialized: (initialized) => set({ isInitialized: initialized }),

  setLoading: (loading) => set({ isLoading: loading }),

  reset: () =>
    set({
      user: null,
      profile: null,
      isInitialized: true,
      isLoading: false,
    }),

  isAuthenticated: () => !!get().user,

  isAdmin: () => {
    const { profile } = get();
    return profile?.role === "admin" || profile?.role === "super_admin";
  },

  getFullName: () => {
    const { profile, user } = get();
    if (profile?.full_name) return profile.full_name;
    if (user?.user_metadata?.full_name)
      return user.user_metadata.full_name as string;
    if (user?.email) return user.email.split("@")[0];
    return "Guest";
  },
}));
