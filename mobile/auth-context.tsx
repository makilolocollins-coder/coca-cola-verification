
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type UserRole =
  | "consumer"
  | "manufacturer"
  | "driver";

export type VerityProfile = {
  id: string;
  full_name: string | null;
  role: UserRole;
};

type AuthContextValue = {
  session: Session | null;
  profile: VerityProfile | null;
  loadingProfile: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext =
  createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  session,
  children,
}: {
  session: Session | null;
  children: ReactNode;
}) {
  const [profile, setProfile] =
    useState<VerityProfile | null>(null);

  const [loadingProfile, setLoadingProfile] =
    useState(true);

  const refreshProfile = async () => {
    if (!session?.user?.id) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);

    try {
      const { data, error } = await supabase
        .from("verity_profiles")
        .select("id, full_name, role")
        .eq("id", session.user.id)
        .single();

      if (error) {
        throw error;
      }

      setProfile(data as VerityProfile);
    } catch (error) {
      console.error("Profile loading failed:", error);
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, [session?.user?.id]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loadingProfile,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}
