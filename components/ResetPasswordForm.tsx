"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    "w-full rounded-xl border border-cyan-300/25 bg-[var(--bg-card-solid)]/70 px-4 py-3.5 text-base text-[var(--text-body)] focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/25";

  return (
    <form onSubmit={run} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="newPassword"
          className="block text-sm font-medium text-[var(--text-label)]"
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
          className="block text-sm font-medium text-[var(--text-label)]"
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
          className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300"
          role="alert"
        >
          {error}
        </p>
      )}
      {info && (
        <p
          className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm text-[var(--accent-cyan)]"
          role="status"
        >
          {info}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (!loading) void run(e);
        }}
        className="hud-primary-btn w-full rounded-xl px-5 py-3.5 font-medium disabled:opacity-60"
      >
        {loading ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}