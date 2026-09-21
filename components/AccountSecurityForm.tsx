"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { validatePassword } from "@/lib/auth/password";
import { Button } from "@/components/ui";

const inputClass =
  "w-full rounded-control border border-border-default bg-surface px-4 py-3.5 text-base text-text-primary transition-colors duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

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

  const [guestEmail, setGuestEmail] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  const [guestSaving, setGuestSaving] = useState(false);
  const [guestInfo, setGuestInfo] = useState<string | null>(null);
  const [guestError, setGuestError] = useState<string | null>(null);

  if (supabaseRef.current == null) {
    supabaseRef.current = createClient();
  }

  const signedInWithPassword = (user?.identities ?? []).some(
    (ident) => ident.provider === "email",
  );

  async function handleGuestUpgrade(e: React.FormEvent) {
    e.preventDefault();
    setGuestSaving(true);
    setGuestError(null);
    setGuestInfo(null);

    const pwError = validatePassword(guestPassword);
    if (pwError) {
      setGuestError(pwError);
      setGuestSaving(false);
      return;
    }

    try {
      const { error } = await supabaseRef.current!.auth.updateUser({
        email: guestEmail,
        password: guestPassword,
      });
      if (error) {
        setGuestError(error.message);
        return;
      }
      setGuestInfo(
        "Check your inbox for a confirmation link to finish saving your account. Your progress stays on this guest session until you confirm.",
      );
      setGuestEmail("");
      setGuestPassword("");
    } finally {
      setGuestSaving(false);
    }
  }

  if (user?.is_anonymous) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-tertiary">
          You&apos;re using a guest account. Your progress is saved, but only
          on this device/browser -- signing out or clearing your browser data
          will lose it. Add an email and password to keep your progress
          permanently.
        </p>
        <form onSubmit={handleGuestUpgrade} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="guestEmail"
              className="block text-sm font-medium text-text-secondary"
            >
              Email
            </label>
            <input
              id="guestEmail"
              type="email"
              autoComplete="email"
              required
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="guestPassword"
              className="block text-sm font-medium text-text-secondary"
            >
              Password
            </label>
            <input
              id="guestPassword"
              type="password"
              autoComplete="new-password"
              required
              value={guestPassword}
              onChange={(e) => setGuestPassword(e.target.value)}
              placeholder="At least 10 characters, letters + numbers"
              className={inputClass}
            />
          </div>
          {guestError && (
            <p className="alert-error rounded-lg px-3 py-2 text-sm" role="alert">
              {guestError}
            </p>
          )}
          {guestInfo && (
            <p className="alert-info rounded-lg px-3 py-2 text-sm" role="status">
              {guestInfo}
            </p>
          )}
          <Button type="submit" loading={guestSaving} fullWidth>
            {guestSaving ? "Saving…" : "Save my account"}
          </Button>
        </form>
      </div>
    );
  }

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
        <h2 className="text-lg font-semibold text-text-primary">
          Change email
        </h2>
        <p className="text-sm text-text-tertiary">
          Your current sign-in email is{" "}
          <span className="font-medium text-text-secondary">{user?.email}</span>.
        </p>
        <form onSubmit={handleEmailChange} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="newEmail"
              className="block text-sm font-medium text-text-secondary"
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
          <Button type="submit" loading={emailSaving} fullWidth>
            {emailSaving ? "Sending…" : "Change email"}
          </Button>
        </form>
      </section>

      <hr className="border-border-subtle" />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">
          Change password
        </h2>
        {!signedInWithPassword ? (
          <p className="text-sm text-text-tertiary">
            You signed in with Google, so no password is set for this account.
          </p>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-text-secondary"
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
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat the new password"
                className={inputClass}
              />
            </div>
            {pwError && (
              <p className="alert-error rounded-control px-3 py-2 text-sm" role="alert">
                {pwError}
              </p>
            )}
            {pwInfo && (
              <p className="alert-info rounded-control px-3 py-2 text-sm" role="status">
                {pwInfo}
              </p>
            )}
            <Button type="submit" loading={pwSaving} fullWidth>
              {pwSaving ? "Updating…" : "Change password"}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}