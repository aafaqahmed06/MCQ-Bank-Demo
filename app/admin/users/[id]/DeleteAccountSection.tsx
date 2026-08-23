"use client";

import { useEffect, useState, useTransition } from "react";
import { deleteUserAccount } from "./actions";

type Role = "student" | "reviewer" | "admin" | "super_admin";
type Step = "closed" | "fields" | "final";

interface DeleteAccountSectionProps {
  targetId: string;
  targetName: string | null;
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
  targetName,
  targetEmail,
  targetRole,
  callerId,
  callerRole,
  stats,
}: DeleteAccountSectionProps) {
  const [step, setStep] = useState<Step>("closed");
  const [typedName, setTypedName] = useState("");
  const [typedEmail, setTypedEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSelf = targetId === callerId;
  const blockedByRoleTier =
    (targetRole === "admin" || targetRole === "super_admin") && callerRole !== "super_admin";
  const noVerifiableEmail = !targetEmail;
  const blocked = isSelf || blockedByRoleTier || noVerifiableEmail;

  // These client-side flags are UX hints only (disable the button, show a
  // reason) -- the server independently re-derives caller id/role and
  // target id/role via assert_can_delete_user() and never trusts these
  // props for the actual authorization decision.

  // The typed full-name match is a UI-only gate to slow the admin down --
  // it is never sent to or verified by the server, unlike the email, which
  // deleteUserAccount (actions.ts) independently re-verifies against the
  // account's real value before deleting anything.
  const nameMatches = targetName === null || typedName === targetName;
  const emailMatches = typedEmail === targetEmail;
  const fieldsConfirmed = nameMatches && emailMatches;

  function closeAndReset() {
    if (isPending) return;
    setStep("closed");
    setTypedName("");
    setTypedEmail("");
    setError(null);
  }

  useEffect(() => {
    if (step === "closed") return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeAndReset();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, isPending]);

  function handleConfirmDelete() {
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
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Permanently remove this account and everything tied to it: practice
          history, exams, bookmarks, reports, and progress. This cannot be
          undone.
        </p>
      )}

      <button
        type="button"
        onClick={() => setStep("fields")}
        disabled={blocked}
        className="mt-4 rounded-xl bg-[var(--error)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--error)]/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Delete Account
      </button>

      {step === "fields" && (
        <ConfirmFieldsModal
          targetName={targetName}
          targetEmail={targetEmail}
          stats={stats}
          typedName={typedName}
          typedEmail={typedEmail}
          onTypedNameChange={setTypedName}
          onTypedEmailChange={setTypedEmail}
          canProceed={fieldsConfirmed}
          onCancel={closeAndReset}
          onProceed={() => setStep("final")}
        />
      )}

      {step === "final" && (
        <FinalConfirmModal
          isPending={isPending}
          error={error}
          onCancel={() => {
            if (isPending) return;
            setStep("fields");
            setError(null);
          }}
          onConfirm={handleConfirmDelete}
          onBackdropClose={closeAndReset}
        />
      )}
    </div>
  );
}

function ConfirmFieldsModal({
  targetName,
  targetEmail,
  stats,
  typedName,
  typedEmail,
  onTypedNameChange,
  onTypedEmailChange,
  canProceed,
  onCancel,
  onProceed,
}: {
  targetName: string | null;
  targetEmail: string;
  stats: DeleteAccountSectionProps["stats"];
  typedName: string;
  typedEmail: string;
  onTypedNameChange: (v: string) => void;
  onTypedEmailChange: (v: string) => void;
  canProceed: boolean;
  onCancel: () => void;
  onProceed: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      onClick={onCancel}
    >
      <div
        className="hud-card fade-in w-full max-w-md rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Confirm account deletion"
      >
        <h3 className="text-lg font-semibold text-[var(--error)]">Delete account</h3>

        <dl className="mt-3 space-y-1 rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--text-muted)]">Name</dt>
            <dd className="text-right font-medium text-[var(--text-heading)]">
              {targetName ?? "(no name)"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--text-muted)]">Email</dt>
            <dd className="text-right font-mono font-medium text-[var(--text-heading)]">
              {targetEmail}
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
          This permanently removes {stats.practiceAttempted} practice question
          {stats.practiceAttempted === 1 ? "" : "s"} answered
          {stats.practiceAccuracy !== null ? ` (${stats.practiceAccuracy}% accuracy)` : ""},{" "}
          {stats.examsCompleted} completed exam{stats.examsCompleted === 1 ? "" : "s"}
          {stats.avgScore !== null ? ` (avg score ${stats.avgScore}%)` : ""}, and all
          bookmarks, reports, and progress history.
        </p>

        {targetName !== null && (
          <>
            <label className="mt-4 block text-sm font-medium text-[var(--text-heading)]">
              Type the full name to confirm
            </label>
            <input
              type="text"
              value={typedName}
              onChange={(e) => onTypedNameChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border-color)] bg-transparent px-3 py-2 text-sm"
              autoComplete="off"
              spellCheck={false}
            />
          </>
        )}

        <label className="mt-4 block text-sm font-medium text-[var(--text-heading)]">
          Type the email to confirm
        </label>
        <input
          type="text"
          value={typedEmail}
          onChange={(e) => onTypedEmailChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--border-color)] bg-transparent px-3 py-2 text-sm"
          autoComplete="off"
          spellCheck={false}
        />

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-[var(--text-muted-light)] transition-colors hover:bg-cyan-500/8 hover:text-[var(--text-heading)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onProceed}
            disabled={!canProceed}
            className="rounded-xl bg-[var(--error)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--error)]/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function FinalConfirmModal({
  isPending,
  error,
  onCancel,
  onConfirm,
  onBackdropClose,
}: {
  isPending: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  onBackdropClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      onClick={onBackdropClose}
    >
      <div
        className="hud-card fade-in w-full max-w-md rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Final confirmation"
      >
        <h3 className="text-lg font-semibold text-[var(--error)]">Are you sure?</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
          Are you sure you want to delete this account? This action is
          irreversible.
        </p>

        {error && (
          <p className="mt-3 text-sm text-[var(--error)]" role="alert">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-[var(--text-muted-light)] transition-colors hover:bg-cyan-500/8 hover:text-[var(--text-heading)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-xl bg-[var(--error)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--error)]/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? "Deleting…" : "Confirm Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
