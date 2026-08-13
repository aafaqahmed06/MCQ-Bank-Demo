"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function AuthForm() {
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (supabaseRef.current == null) {
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
            data: { full_name: fullName.trim() || null },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/home`,
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

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = supabaseRef.current!;

    try {
      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/home`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (err) {
        setError(err.message);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError("Could not start Google sign-in.");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-cyan-300/25 bg-[var(--bg-card-solid)]/70 px-4 py-3.5 text-base text-[var(--text-body)] focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/25";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleGoogle()}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (!loading) void handleGoogle();
        }}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-cyan-300/25 bg-[var(--bg-card-solid)]/70 px-5 py-3.5 font-medium text-[var(--text-body)] transition-colors hover:border-cyan-300/40 hover:text-[var(--accent-cyan-strong)] active:border-cyan-300/40 active:text-[var(--accent-cyan-strong)] disabled:opacity-60"
      >
        <svg className="size-5" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
          <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-cyan-300/20" />
        <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
          or
        </span>
        <span className="h-px flex-1 bg-cyan-300/20" />
      </div>

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
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
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
