"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

export default function ResetPasswordForm() {
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (supabaseRef.current == null) {
    supabaseRef.current = createClient();
  }

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const { error: err } = await supabaseRef.current!.auth.updateUser({
        password,
      });
      if (err) {
        setError(err.message);
        return;
      }
      await supabaseRef.current!.auth.signOut();
      setInfo("Your password has been updated. Sign in with your new password.");
      setTimeout(() => {
        router.replace("/auth");
        router.refresh();
      }, 1200);
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
          htmlFor="newPassword"
          className="block text-sm font-medium text-text-secondary"
        >
          New password
        </label>
        <input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-text-secondary"
        >
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat the new password"
          className={inputClass}
        />
      </div>

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
        loading={loading}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (!loading) void run(e);
        }}
        fullWidth
        size="lg"
      >
        {loading ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}