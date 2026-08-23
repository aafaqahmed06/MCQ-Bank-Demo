"use client";

import { useState, useTransition } from "react";
import { deleteUserAccount } from "./actions";

type Role = "student" | "reviewer" | "admin" | "super_admin";

interface DeleteAccountSectionProps {
  targetId: string;
  targetEmail: string;
  targetRole: Role;
  callerId: string;
  callerRole: Role;
  stats: {
    practiceAttempted: number;
    practiceAccuracy: number | null;
    examsCompleted: number;
    avgScore: number | null;
  };
}

export default function DeleteAccountSection({
  targetId,
  targetEmail,
  targetRole,
  callerId,
  callerRole,
  stats,
}: DeleteAccountSectionProps) {
  const [typedEmail, setTypedEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSelf = targetId === callerId;
  const blockedByRoleTier =
    (targetRole === "admin" || targetRole === "super_admin") && callerRole !== "super_admin";
  const noVerifiableEmail = !targetEmail;
  const emailMatches = typedEmail === targetEmail;
  const canSubmit =
    !isSelf && !blockedByRoleTier && !noVerifiableEmail && emailMatches && !isPending;

  // These client-side flags are UX hints only (disable the button, show a
  // reason) -- the server independently re-derives caller id/role and
  // target id/role via assert_can_delete_user() and never trusts these
  // props for the actual authorization decision.

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteUserAccount(targetId, typedEmail);
      // Only reached on failure -- success redirects server-side and
      // throws internally, never returning here.
      if (result && !result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="hud-card rounded-xl border border-[var(--error)]/30 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-[var(--error)]">Danger zone</h2>

      {isSelf ? (
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          You cannot delete your own account.
        </p>
      ) : blockedByRoleTier ? (
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Only super admins may delete an admin or super_admin account.
        </p>
      ) : noVerifiableEmail ? (
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          This account has no verifiable email and cannot be deleted here.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Deleting this account permanently removes it and everything tied
            to it: {stats.practiceAttempted} practice question
            {stats.practiceAttempted === 1 ? "" : "s"} answered
            {stats.practiceAccuracy !== null ? ` (${stats.practiceAccuracy}% accuracy)` : ""},{" "}
            {stats.examsCompleted} completed exam{stats.examsCompleted === 1 ? "" : "s"}
            {stats.avgScore !== null ? ` (avg score ${stats.avgScore}%)` : ""}, and all
            bookmarks, reports, and progress history. This cannot be undone.
          </p>

          <label className="mt-4 block text-sm font-medium text-[var(--text-heading)]">
            Type <span className="font-mono">{targetEmail}</span> to confirm
          </label>
          <input
            type="text"
            value={typedEmail}
            onChange={(e) => setTypedEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border-color)] bg-transparent px-3 py-2 text-sm"
            autoComplete="off"
            spellCheck={false}
            disabled={isPending}
          />

          {error && (
            <p className="mt-2 text-sm text-[var(--error)]" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleDelete}
            disabled={!canSubmit}
            className="mt-4 rounded-xl bg-[var(--error)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--error)]/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? "Deleting…" : "Delete account"}
          </button>
        </>
      )}
    </div>
  );
}
