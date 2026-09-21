"use client";

import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { Flag, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Icon, Modal, Button } from "@/components/ui";

export type ReportQuestionButtonHandle = {
  open: () => void;
};

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

const FIELD_CLASS =
  "w-full rounded-control border border-border-default bg-surface px-4 py-2.5 text-sm text-text-primary transition-colors duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

const ReportQuestionButton = forwardRef<ReportQuestionButtonHandle, ReportQuestionButtonProps>(
  function ReportQuestionButton({ mcqId }, ref) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("incorrect_answer");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    useImperativeHandle(ref, () => ({ open: () => setOpen(true) }), []);

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

    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={!user}
          aria-label="Report a problem with this question"
          title="Report (R)"
          className="inline-flex items-center gap-1.5 rounded-control border border-border-default bg-surface px-3 py-1.5 text-caption font-medium text-text-secondary transition-colors duration-150 hover:border-error/40 hover:text-error disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon icon={Flag} size="xs" />
          Report
        </button>

        <Modal
          open={open}
          onClose={close}
          title={done ? "Thanks for the report" : "Report a problem"}
          description={done ? undefined : "Tell us what's wrong with this question."}
          size="sm"
        >
          {done ? (
            <div className="text-center">
              <Icon icon={CheckCircle2} size="lg" className="mx-auto text-success" />
              <p className="mt-2 text-sm text-text-secondary">
                Our reviewers will look into this question.
              </p>
              <Button onClick={close} className="mt-4" fullWidth>
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="reportReason" className="block text-sm font-medium text-text-secondary">
                  Reason
                </label>
                <select
                  id="reportReason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={FIELD_CLASS}
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
                  className="block text-sm font-medium text-text-secondary"
                >
                  Details (optional)
                </label>
                <textarea
                  id="reportDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Anything that helps us fix it…"
                  className={FIELD_CLASS}
                />
              </div>

              {error && (
                <p className="alert-error rounded-control px-3 py-2 text-sm" role="alert">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={close}>
                  Cancel
                </Button>
                <Button onClick={submit} loading={submitting}>
                  Submit Report
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </>
    );
  }
);

export default ReportQuestionButton;
