"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import CaptchaWidget, { type CaptchaWidgetHandle } from "@/components/CaptchaWidget";
import { useCaptchaToken } from "@/components/CaptchaProvider";
import { Button } from "@/components/ui";

export default function ForgotPasswordForm() {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // See components/CaptchaProvider.tsx -- usually already solved by the
  // time this form is reached.
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

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const captchaToken = getCaptchaToken();

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
    }
  }

  const inputClass =
    "w-full rounded-control border border-border-default bg-surface px-4 py-3.5 text-base text-text-primary transition-colors duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

  return (
    <form onSubmit={run} className="space-y-5">
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

      <Button
        type="submit"
        disabled={!captchaReady}
        loading={loading}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (!loading && captchaReady) void run(e);
        }}
        fullWidth
        size="lg"
      >
        {loading ? "Please wait…" : "Send reset link"}
      </Button>

      <p className="text-center">
        <Link
          href="/auth"
          className="text-sm text-text-tertiary hover:text-primary active:text-primary"
        >
          &larr; Back to sign in
        </Link>
      </p>
    </form>
  );
}