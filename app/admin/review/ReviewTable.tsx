"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ConfirmModal from "@/components/ConfirmModal";

export interface ReviewMcqRow {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: number;
  source: string | null;
  createdAt: string;
  topicName: string | null;
}

const DIFFICULTY_LABEL: Record<number, string> = {
  1: "Easy",
  2: "Medium",
  3: "Hard",
};

type PendingAction = {
  mcqId: string;
  status: "published" | "rejected";
} | null;

export default function ReviewTable({
  mcqs: initialMcqs,
}: {
  mcqs: ReviewMcqRow[];
}) {
  const [mcqs, setMcqs] = useState(initialMcqs);
  const [pending, setPending] = useState<PendingAction>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const confirmAction = async () => {
    if (!pending) return;
    const { mcqId, status } = pending;
    setPending(null);
    setBusyId(mcqId);
    setError(null);

    const { error: err } = await createClient().rpc("set_mcq_status", {
      p_mcq_id: mcqId,
      p_status: status,
    });

    setBusyId(null);
    if (err) {
      setError(err.message);
      return;
    }
    setMcqs((prev) => prev.filter((m) => m.id !== mcqId));
  };

  if (mcqs.length === 0) {
    return (
      <p className="hud-muted rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-8 text-center text-sm">
        No MCQs waiting for review.
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

      {mcqs.map((mcq) => (
        <article key={mcq.id} className="hud-card rounded-xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted-light)]">
            <div className="flex flex-wrap items-center gap-2">
              {mcq.topicName && (
                <span className="inline-flex rounded-full bg-cyan-500/10 px-3 py-1 font-medium text-[var(--accent-cyan-strong)]">
                  {mcq.topicName}
                </span>
              )}
              <span>{DIFFICULTY_LABEL[mcq.difficulty] ?? mcq.difficulty}</span>
              {mcq.source && <span>Source: {mcq.source}</span>}
            </div>
            <span>{new Date(mcq.createdAt).toLocaleString()}</span>
          </div>

          <h3 className="mt-4 text-base font-semibold leading-relaxed text-[var(--text-heading)]">
            {mcq.question}
          </h3>
          <div className="mt-3 space-y-2">
            {mcq.options.map((option, index) => (
              <div
                key={index}
                className={`opt-base p-3 text-sm ${
                  index === mcq.correctAnswer ? "opt-correct" : "opt-neutral"
                }`}
              >
                <span className="font-semibold">
                  {String.fromCharCode(65 + index)}.
                </span>{" "}
                {option}
                {index === mcq.correctAnswer && (
                  <span className="ml-2 text-xs text-success">
                    ✓ Marked correct
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
              {mcq.explanation}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setPending({ mcqId: mcq.id, status: "rejected" })}
              disabled={busyId === mcq.id}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] px-5 py-2.5 text-sm font-medium text-[var(--text-btn-secondary)] transition-colors hover:border-red-400/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() =>
                setPending({ mcqId: mcq.id, status: "published" })
              }
              disabled={busyId === mcq.id}
              className="hud-primary-btn rounded-xl px-5 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyId === mcq.id ? "Saving…" : "Publish"}
            </button>
          </div>
        </article>
      ))}

      <ConfirmModal
        open={pending !== null}
        title={pending?.status === "published" ? "Publish MCQ" : "Reject MCQ"}
        message={
          pending?.status === "published"
            ? "Publish this question? It will become visible to students immediately."
            : "Reject this question? It stays unpublished and leaves the review queue."
        }
        confirmLabel={pending?.status === "published" ? "Publish" : "Reject"}
        danger={pending?.status === "rejected"}
        onConfirm={confirmAction}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
