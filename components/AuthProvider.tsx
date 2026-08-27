"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<DBProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Latest session id, readable from event handlers without a stale closure.
  const sessionUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    sessionUserIdRef.current = session?.user?.id ?? null;
  }, [session]);

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

  // Secondary net for the back/forward cache: neither getSession() nor
  // onAuthStateChange re-runs when a page is restored from bfcache, so a
  // stale React tree (e.g. a previous account's dashboard) can reappear
  // after logout + login as someone else. On a persisted restore, force a
  // fresh check against the current cookies and refresh the RSC payload.
  useEffect(() => {
    const supabase = supabaseRef.current!;

    const onPageShow = async (event: PageTransitionEvent) => {
      if (!event.persisted) return;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setSession(null);
          setProfile(null);
        } else if (user.id !== sessionUserIdRef.current) {
          const {
            data: { session: s },
          } = await supabase.auth.getSession();
          setSession(s);
          await fetchProfile(user.id);
        }
      } catch {
        // Network hiccup on restore -- fall through to router.refresh(), which
        // re-runs the server with current cookies anyway.
      }

      router.refresh();
    };

    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [fetchProfile, router]);

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