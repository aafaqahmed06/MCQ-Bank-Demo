"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

type ReportQuestionButtonProps = {
  mcqId: string;
};

// Exported so the admin reports queue (app/admin/reports) can render the
// same reason labels instead of duplicating this taxonomy.
export const REPORT_REASONS: { value: string; label: string }[] = [
  { value: "incorrect_answer", label: "Incorrect answer" },
  { value: "incorrect_explanation", label: "Incorrect explanation" },
  { value: "ambiguous", label: "Ambiguous / multiple answers" },
  { value: "typo", label: "Typo or formatting issue" },
  { value: "outdated", label: "Outdated content" },
  { value: "duplicate", label: "Duplicate question" },
  { value: "other", label: "Other" },
];

export default function ReportQuestionButton({ mcqId }: ReportQuestionButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("incorrect_answer");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = useCallback(async () => {
    if (!user || submitting) return;
    setSubmitting(true);
    setError(null);
    const { error: err } = await createClient()
      .from("question_reports")
      .insert({
        user_id: user.id,
        mcq_id: mcqId,
        reason,
        description: description.trim() || null,
      });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
  }, [user, submitting, mcqId, reason, description]);

  const close = () => {
    setOpen(false);
    setDone(false);
    setReason("incorrect_answer");
    setDescription("");
    setError(null);
  };

  const selectClass =
    "w-full rounded-xl border border-cyan-300/25 bg-[var(--bg-card-solid)]/70 px-4 py-3 text-base text-[var(--text-body)] focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/25";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!user}
        aria-label="Report a problem with this question"
        className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300/25 bg-[var(--bg-card-dim)]/60 px-3 py-1.5 text-xs font-medium text-[var(--text-btn-secondary)] transition-colors hover:border-red-400/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span aria-hidden>⚑</span> Report
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={close}
        >
          <div
            className="hud-card fade-in w-full max-w-md rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Report a problem"
          >
            {done ? (
              <div className="text-center">
                <p className="text-3xl text-success">✓</p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--text-heading)]">
                  Thanks for the report
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Our reviewers will look into this question.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="hud-primary-btn mt-4 rounded-xl px-5 py-2.5 text-sm font-medium"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-[var(--text-heading)]">
                  Report a problem
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Tell us what&apos;s wrong with this question.
                </p>

                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="reportReason"
                      className="block text-sm font-medium text-[var(--text-label)]"
                    >
                      Reason
                    </label>
                    <select
                      id="reportReason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className={selectClass}
                    >
                      {REPORT_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="reportDescription"
                      className="block text-sm font-medium text-[var(--text-label)]"
                    >
                      Details (optional)
                    </label>
                    <textarea
                      id="reportDescription"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Anything that helps us fix it…"
                      className={selectClass}
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

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={close}
                      className="rounded-xl border border-cyan-300/30 bg-[var(--bg-card-dim)]/60 px-5 py-2.5 text-sm font-medium text-[var(--text-btn-secondary)] transition-colors hover:border-cyan-300/40 hover:text-[var(--accent-cyan-strong)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={submitting}
                      className="hud-primary-btn rounded-xl px-5 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? "Submitting…" : "Submit Report"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}