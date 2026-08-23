"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import CaptchaWidget, { isCaptchaConfigured } from "@/components/CaptchaWidget";

export default function ForgotPasswordForm() {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>();
  const captchaReady = !isCaptchaConfigured || !!captchaToken;

  if (supabaseRef.current == null) {
    supabaseRef.current = createClient();
  }

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const { error: err } = await supabaseRef.current!.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
          captchaToken,
        },
      );
      if (err) {
        setError(err.message);
        return;
      }
      setInfo(
        "If an account exists for that email, a password reset link has been sent. Check your inbox.",
      );
      setEmail("");
    } finally {
      setLoading(false);
      setCaptchaToken(undefined);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-cyan-300/25 bg-[var(--bg-card-solid)]/70 px-4 py-3.5 text-base text-[var(--text-body)] focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/25";

  return (
    <form onSubmit={run} className="space-y-5">
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

      <CaptchaWidget onToken={setCaptchaToken} />
      {!captchaReady && !loading && (
        <p className="text-sm text-[var(--text-muted)]" role="status">
          Complete the verification above to continue.
        </p>
      )}

      {error && (
        <p
          className="alert-error rounded-lg px-3 py-2 text-sm"
          role="alert"
        >
          {error}
        </p>
      )}
      {info && (
        <p
          className="alert-info rounded-lg px-3 py-2 text-sm"
          role="status"
        >
          {info}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !captchaReady}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (!loading && captchaReady) void run(e);
        }}
        className="hud-primary-btn w-full rounded-xl px-5 py-3.5 font-medium disabled:opacity-60"
      >
        {loading ? "Please wait…" : "Send reset link"}
      </button>

      <p className="text-center">
        <Link
          href="/auth"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-cyan)] active:text-[var(--accent-cyan)]"
        >
          &larr; Back to sign in
        </Link>
      </p>
    </form>
  );
}