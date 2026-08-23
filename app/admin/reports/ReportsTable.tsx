"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ConfirmModal from "@/components/ConfirmModal";
import { REPORT_REASONS } from "@/components/ReportQuestionButton";

export interface ReportRow {
  id: string;
  reason: string;
  description: string | null;
  createdAt: string;
  mcqId: string;
  mcq: {
    question: string;
    options: string[];
    correct_answer: number;
    explanation: string;
  } | null;
}

const REASON_LABELS = Object.fromEntries(
  REPORT_REASONS.map((r) => [r.value, r.label])
);

type PendingAction = {
  reportId: string;
  status: "resolved" | "dismissed";
} | null;

export default function ReportsTable({
  reports: initialReports,
}: {
  reports: ReportRow[];
}) {
  const [reports, setReports] = useState(initialReports);
  const [pending, setPending] = useState<PendingAction>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const confirmAction = async () => {
    if (!pending) return;
    const { reportId, status } = pending;
    setPending(null);
    setBusyId(reportId);
    setError(null);

    const { error: err } = await createClient().rpc(
      "set_question_report_status",
      { p_report_id: reportId, p_status: status }
    );

    setBusyId(null);
    if (err) {
      setError(err.message);
      return;
    }
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  };

  if (reports.length === 0) {
    return (
      <p className="hud-muted rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-8 text-center text-sm">
        No open reports. The queue is empty.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="alert-error rounded-lg px-4 py-3 text-sm" role="alert">
          {error}
        </p>
      )}

      {reports.map((report) => (
        <article key={report.id} className="hud-card rounded-xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-[var(--accent-cyan-strong)]">
              {REASON_LABELS[report.reason] ?? report.reason}
            </span>
            <span className="text-xs text-[var(--text-muted-light)]">
              {new Date(report.createdAt).toLocaleString()}
            </span>
          </div>

          {report.description && (
            <p className="mt-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-alt)] p-3 text-sm text-[var(--text-body-alt)]">
              {report.description}
            </p>
          )}

          {report.mcq ? (
            <>
              <h3 className="mt-4 text-base font-semibold leading-relaxed text-[var(--text-heading)]">
                {report.mcq.question}
              </h3>
              <div className="mt-3 space-y-2">
                {report.mcq.options.map((option, index) => (
                  <div
                    key={index}
                    className={`opt-base p-3 text-sm ${
                      index === report.mcq!.correct_answer
                        ? "opt-correct"
                        : "opt-neutral"
                    }`}
                  >
                    <span className="font-semibold">
                      {String.fromCharCode(65 + index)}.
                    </span>{" "}
                    {option}
                    {index === report.mcq!.correct_answer && (
                      <span className="ml-2 text-xs text-success">
                        ✓ Current answer
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-violet)]">
                  Explanation
                </p>
                <p className="mt-1 text-sm text-[var(--text-body-alt)]">
                  {report.mcq.explanation}
                </p>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              MCQ {report.mcqId} could not be loaded.
            </p>
          )}

          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() =>
                setPending({ reportId: report.id, status: "dismissed" })
              }
              disabled={busyId === report.id}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] px-5 py-2.5 text-sm font-medium text-[var(--text-btn-secondary)] transition-colors hover:border-cyan-300/40 hover:text-[var(--accent-cyan-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={() =>
                setPending({ reportId: report.id, status: "resolved" })
              }
              disabled={busyId === report.id}
              className="hud-primary-btn rounded-xl px-5 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyId === report.id ? "Saving…" : "Resolve"}
            </button>
          </div>
        </article>
      ))}

      <ConfirmModal
        open={pending !== null}
        title={pending?.status === "resolved" ? "Resolve report" : "Dismiss report"}
        message={
          pending?.status === "resolved"
            ? "Mark this report as resolved? This does not change the question's content."
            : "Dismiss this report as not actionable?"
        }
        confirmLabel={pending?.status === "resolved" ? "Resolve" : "Dismiss"}
        danger={pending?.status === "dismissed"}
        onConfirm={confirmAction}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
