"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function AuthForm() {
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void run();
  }

  async function run() {
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = supabaseRef.current!;

    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (err) {
          setError(err.message);
          return;
        }
        if (data.session) {
          router.replace("/onboarding");
          router.refresh();
        } else {
          setInfo(
            "Check your inbox for a confirmation link, then sign in."
          );
          setMode("signin");
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) {
          setError(err.message);
          return;
        }
        router.replace("/home");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-cyan-300/25 bg-[var(--bg-card-solid)]/70 px-4 py-3.5 text-base text-[var(--text-body)] focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/25";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {mode === "signup" && (
        <div className="space-y-2">
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-[var(--text-label)]"
          >
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Aafaq Ahmed"
            className={inputClass}
          />
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-[var(--text-label)]"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-[var(--text-label)]"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className={inputClass}
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
      {info && (
        <p className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm text-[var(--accent-cyan)]" role="status">
          {info}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (!loading) handleSubmit(e);
        }}
        className="hud-primary-btn w-full rounded-xl px-5 py-3.5 font-medium disabled:opacity-60"
      >
        {loading
          ? "Please wait…"
          : mode === "signup"
            ? "Create account"
            : "Sign in"}
      </button>

      <p className="text-center text-sm text-[var(--text-muted)]">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
                setInfo(null);
              }}
              className="font-medium text-[var(--accent-cyan)] hover:underline active:underline"
            >
              Sign in
            </button>
          </>
        ) : (
          <>
            New to DiagKnow?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
                setInfo(null);
              }}
              className="font-medium text-[var(--accent-cyan)] hover:underline active:underline"
            >
              Create an account
            </button>
          </>
        )}
      </p>

      <p className="text-center">
        <Link href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-cyan)] active:text-[var(--accent-cyan)]">
          &larr; Back to home
        </Link>
      </p>
    </form>
  );
}