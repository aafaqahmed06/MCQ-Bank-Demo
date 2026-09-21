"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CaptchaWidget, { type CaptchaWidgetHandle } from "@/components/CaptchaWidget";
import { useCaptchaToken } from "@/components/CaptchaProvider";
import { MIN_PASSWORD_LENGTH, validatePassword } from "@/lib/auth/password";
import { Button, Icon } from "@/components/ui";

type Mode = "signin" | "signup";

export default function AuthForm() {
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Usually already solved by the time this form is reached -- see
  // CaptchaProvider, mounted at the app root, which pre-warms a hidden
  // Turnstile widget as soon as an anonymous visitor lands on any page.
  const { status: captchaStatus, consumeToken } = useCaptchaToken();
  const fallbackWidgetRef = useRef<CaptchaWidgetHandle | null>(null);
  const [fallbackToken, setFallbackToken] = useState<string | undefined>();
  const captchaReady =
    captchaStatus === "disabled" ||
    captchaStatus === "ready" ||
    (captchaStatus === "unavailable" && !!fallbackToken);

  function getCaptchaToken(): string | undefined {
    if (captchaStatus === "unavailable") {
      const token = fallbackToken;
      setFallbackToken(undefined);
      fallbackWidgetRef.current?.reset();
      return token;
    }
    return consumeToken();
  }

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
    const captchaToken = getCaptchaToken();

    try {
      if (mode === "signup") {
        const pwError = validatePassword(password);
        if (pwError) {
          setError(pwError);
          return;
        }
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim() || null },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/home`,
            captchaToken,
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
          options: { captchaToken },
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

  async function handleGuest() {
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = supabaseRef.current!;
    const captchaToken = getCaptchaToken();

    try {
      const { error: err } = await supabase.auth.signInAnonymously({
        options: { captchaToken },
      });
      if (err) {
        setError(err.message);
        return;
      }
      router.replace("/onboarding");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-control border border-border-default bg-surface px-4 py-3.5 text-base text-text-primary transition-colors duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Button
        type="button"
        variant="secondary"
        disabled={loading}
        onClick={() => void handleGoogle()}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (!loading) void handleGoogle();
        }}
        fullWidth
        size="lg"
      >
        <svg className="size-5" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
          <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
        </svg>
        Continue with Google
      </Button>

      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border-default" />
        <span className="text-xs uppercase tracking-wide text-text-tertiary">
          or
        </span>
        <span className="h-px flex-1 bg-border-default" />
      </div>

      {mode === "signup" && (
        <div className="space-y-2">
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-text-secondary"
          >
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            className={inputClass}
          />
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-text-secondary"
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
          className="block text-sm font-medium text-text-secondary"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters, letters + numbers`}
            className={`${inputClass} pr-12`}
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            disabled={loading}
            onClick={() => setShowPassword((v) => !v)}
            onTouchEnd={(e) => {
              e.preventDefault();
              if (!loading) setShowPassword((v) => !v);
            }}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-text-tertiary transition-colors duration-150 hover:text-primary active:text-primary disabled:opacity-60"
          >
            <Icon icon={showPassword ? EyeOff : Eye} size="sm" />
          </button>
        </div>
        {mode === "signin" && (
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs text-text-tertiary hover:text-primary active:text-primary"
            >
              Forgot password?
            </Link>
          </div>
        )}
      </div>

      {captchaStatus === "pending" && !loading && (
        <p className="text-sm text-text-tertiary" role="status">
          Verifying your browser…
        </p>
      )}
      {captchaStatus === "unavailable" && (
        <>
          <CaptchaWidget ref={fallbackWidgetRef} onToken={setFallbackToken} />
          {!fallbackToken && !loading && (
            <p className="text-sm text-text-tertiary" role="status">
              Complete the verification above to continue.
            </p>
          )}
        </>
      )}

      {error && (
        <p className="alert-error rounded-lg px-3 py-2 text-sm" role="alert">
          {error}
        </p>
      )}
      {info && (
        <p className="alert-info rounded-lg px-3 py-2 text-sm" role="status">
          {info}
        </p>
      )}

      <Button
        type="submit"
        disabled={!captchaReady}
        loading={loading}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (!loading && captchaReady) handleSubmit(e);
        }}
        fullWidth
        size="lg"
      >
        {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-text-tertiary">
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
              className="font-medium text-primary hover:underline active:underline"
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
              className="font-medium text-primary hover:underline active:underline"
            >
              Create an account
            </button>
          </>
        )}
      </p>

      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border-default" />
        <span className="text-xs uppercase tracking-wide text-text-tertiary">
          or
        </span>
        <span className="h-px flex-1 bg-border-default" />
      </div>

      <Button
        type="button"
        variant="ghost"
        disabled={loading || !captchaReady}
        onClick={() => void handleGuest()}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (!loading && captchaReady) void handleGuest();
        }}
        fullWidth
      >
        Continue as guest
      </Button>
      <p className="text-center text-xs text-text-tertiary">
        Try DiagKnow without an account. You can save your progress to a real
        account any time from Account settings.
      </p>

      <p className="text-center">
        <Link href="/" className="text-sm text-text-tertiary hover:text-primary active:text-primary">
          &larr; Back to home
        </Link>
      </p>
    </form>
  );
}
