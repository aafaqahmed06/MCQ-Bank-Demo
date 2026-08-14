"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-xl border border-cyan-300/25 bg-[var(--bg-card-solid)]/70 px-4 py-3.5 text-base text-[var(--text-body)] focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/25";

export default function AccountSecurityForm() {
  const { user } = useAuth();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailInfo, setEmailInfo] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwInfo, setPwInfo] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  if (supabaseRef.current == null) {
    supabaseRef.current = createClient();
  }

  const signedInWithPassword = (user?.identities ?? []).some(
    (ident) => ident.provider === "email",
  );

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailSaving(true);
    setEmailError(null);
    setEmailInfo(null);
    try {
      const { error } = await supabaseRef.current!.auth.updateUser({
        email: newEmail,
      });
      if (error) {
        setEmailError(error.message);
        return;
      }
      setNewEmail("");
      setEmailInfo(
        "A confirmation link has been sent to your new email. " +
          "Click it to finish changing your address.",
      );
    } finally {
      setEmailSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwSaving(true);
    setPwError(null);
    setPwInfo(null);

    if (newPassword.length < 8) {
      setPwError("Password must be at least 8 characters.");
      setPwSaving(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      setPwSaving(false);
      return;
    }

    try {
      const supabase = supabaseRef.current!;
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: user!.email ?? "",
        password: currentPassword,
      });
      if (verifyErr) {
        setPwError("Current password is incorrect.");
        return;
      }
      const { error: upErr } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (upErr) {
        setPwError(upErr.message);
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwInfo("Password updated.");
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--text-heading)]">
          Change email
        </h2>
        <p className="hud-muted text-sm">
          Your current sign-in email is{" "}
          <span className="font-medium text-[var(--text-body)]">{user?.email}</span>.
        </p>
        <form onSubmit={handleEmailChange} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="newEmail"
              className="block text-sm font-medium text-[var(--text-label)]"
            >
              New email
            </label>
            <input
              id="newEmail"
              type="email"
              autoComplete="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@example.com"
              className={inputClass}
            />
          </div>
          {emailError && (
            <p
              className="alert-error rounded-lg px-3 py-2 text-sm"
              role="alert"
            >
              {emailError}
            </p>
          )}
          {emailInfo && (
            <p
              className="alert-info rounded-lg px-3 py-2 text-sm"
              role="status"
            >
              {emailInfo}
            </p>
          )}
          <button
            type="submit"
            disabled={emailSaving}
            className="hud-primary-btn w-full rounded-xl px-5 py-3 font-medium disabled:opacity-60"
          >
            {emailSaving ? "Sending…" : "Change email"}
          </button>
        </form>
      </section>

      <hr className="border-cyan-300/10" />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--text-heading)]">
          Change password
        </h2>
        {!signedInWithPassword ? (
          <p className="hud-muted text-sm">
            You signed in with Google, so no password is set for this account.
          </p>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-[var(--text-label)]"
              >
                Current password
              </label>
              <input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
              />
            </div>
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
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat the new password"
                className={inputClass}
              />
            </div>
            {pwError && (
              <p
                className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300"
                role="alert"
              >
                {pwError}
              </p>
            )}
            {pwInfo && (
              <p
                className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm text-[var(--accent-cyan)]"
                role="status"
              >
                {pwInfo}
              </p>
            )}
            <button
              type="submit"
              disabled={pwSaving}
              className="hud-primary-btn w-full rounded-xl px-5 py-3 font-medium disabled:opacity-60"
            >
              {pwSaving ? "Updating…" : "Change password"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}