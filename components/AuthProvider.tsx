"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { DBProfile } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { touchLastActiveIfStale } from "@/lib/activity";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: DBProfile | null;
  loading: boolean;
  isProfileComplete: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<DBProfile | null>(null);
  const [loading, setLoading] = useState(true);

  if (supabaseRef.current == null) {
    supabaseRef.current = createClient();
  }

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabaseRef.current!
      .from("profiles")
      .select(
        "id, full_name, college_id, program_id, academic_year_id, role, avatar_url"
      )
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfile(data as DBProfile);
    } else {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const supabase = supabaseRef.current!;
    let active = true;

    supabase.auth
      .getSession()
      .then(async ({ data: { session: s } }) => {
        if (!active) return;
        setSession(s);
        if (s?.user) {
          await fetchProfile(s.user.id);
          touchLastActiveIfStale(supabase, s.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        fetchProfile(s.user.id);
        touchLastActiveIfStale(supabase, s.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    const supabase = supabaseRef.current!;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) await fetchProfile(user.id);
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabaseRef.current!.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const isProfileComplete =
    !!profile &&
    !!profile.college_id &&
    !!profile.program_id &&
    !!profile.academic_year_id &&
    !!profile.full_name?.trim();

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        isProfileComplete,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}