"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { startExam, getPublishedCount, submitExam } from "@/lib/exam";
import type {
  ExamAnswerSubmission,
  ExamQuestionPayload,
  SubmitExamResponse,
} from "@/types";
import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";
import ExamSession from "@/components/ExamSession";
import ExamResult from "@/components/ExamResult";
import ConfirmModal from "@/components/ConfirmModal";

type Phase = "select" | "exam" | "result";

const EXAM_OPTIONS: {
  count: number;
  label: string;
  description: string;
  timeLimitSeconds: number;
}[] = [
  {
    count: 20,
    label: "Concise",
    description: "A short, focused check",
    timeLimitSeconds: 20 * 60,
  },
  {
    count: 50,
    label: "Standard",
    description: "A full practice paper",
    timeLimitSeconds: 50 * 60,
  },
  {
    count: 100,
    label: "Extended",
    description: "An intensive session",
    timeLimitSeconds: 100 * 60,
  },
];

type ConfirmTarget =
  | { kind: "nav"; href: string }
  | { kind: "back" }
  | { kind: "quit" }
  | null;

export default function ExamPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("select");
  const [starting, setStarting] = useState(false);
  const [selectedCount, setSelectedCount] = useState<number>(20);
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [examId, setExamId] = useState<string | null>(null);
  const [examQuestions, setExamQuestions] = useState<
    ExamQuestionPayload[] | null
  >(null);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number | null>(null);
  const [result, setResult] = useState<SubmitExamResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget>(null);

  // Guard state: while an exam is active, any attempt to leave (in-app link,
  // browser back, or refresh/close) must be confirmed first.
  const armedRef = useRef(false);
  const sentinelArmedRef = useRef(false);
  // Set true once the user confirms a "back" navigation so popstate can pass.
  const allowBackRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getPublishedCount()
      .then((count) => {
        if (!cancelled) setAvailableCount(count);
      })
      .catch(() => {
        if (!cancelled) setAvailableCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStart = async (count: number) => {
    if (starting) return;
    setError(null);
    setStarting(true);
    try {
      const option = EXAM_OPTIONS.find((opt) => opt.count === count);
      const exam = await startExam({
        questionCount: count,
        timeLimitSeconds: option?.timeLimitSeconds,
      });
      setExamId(exam.exam_id);
      setExamQuestions(exam.questions);
      setTimeLimitSeconds(option?.timeLimitSeconds ?? null);
      setPhase("exam");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start exam");
      setStarting(false);
    }
  };

  const handleSubmit = async (
    answers: (number | null)[],
  ): Promise<SubmitExamResponse> => {
    if (!examId) throw new Error("No exam in progress");
    const submissions: ExamAnswerSubmission[] = (examQuestions ?? []).map(
      (q, index) => ({
        mcq_id: q.mcq_id,
        selected_answer: answers[index],
      }),
    );
    const res = await submitExam(examId, submissions);
    setResult(res);
    setPhase("result");
    return res;
  };

  const handleStartNew = () => {
    setExamId(null);
    setExamQuestions(null);
    setResult(null);
    setTimeLimitSeconds(null);
    setPhase("select");
    setConfirmTarget(null);
  };

  const doQuit = () => {
    handleStartNew();
  };

  const handleConfirm = () => {
    if (!confirmTarget) return;
    if (confirmTarget.kind === "nav") {
      setTimeout(() => router.push(confirmTarget.href), 0);
    } else if (confirmTarget.kind === "back") {
      allowBackRef.current = true;
      // We re-pushed a sentinel after trapping the first popstate, so the
      // stack is [...prevPage, /exam, sentinel]. go(-2) walks past both the
      // sentinel and the /exam entry to actually leave the exam page.
      setTimeout(() => window.history.go(-2), 0);
    } else {
      doQuit();
    }
    setConfirmTarget(null);
  };

  // ── Exit guard ─────────────────────────────────────────────────────
  // Only armed while an exam is actually in progress (phase === "exam").
  useEffect(() => {
    if (phase !== "exam") {
      armedRef.current = false;
      sentinelArmedRef.current = false;
      allowBackRef.current = false;
      return;
    }
    armedRef.current = true;

    // In-app <a> navigation (navbar, footer, etc.): intercept at the window
    // capture phase so it wins over PageTransition's document-level handler.
    const handleClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      const target = e.target as Element | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      e.preventDefault();
      e.stopPropagation();
      setConfirmTarget({ kind: "nav", href: url.pathname + url.search + url.hash });
    };

    // Browser back/forward: keep a sentinel history entry so popstate can be
    // caught and gated instead of silently leaving.
    const handlePopState = () => {
      if (allowBackRef.current) {
        // Confirmed earlier — let this pop through.
        allowBackRef.current = false;
        return;
      }
      if (!armedRef.current) return;
      // Re-arm the sentinel so we stay on the exam unless confirmed. This is a
      // no-op visually because the sentinel shares /exam's URL.
      window.history.pushState(
        { dk_exam_guard: true },
        "",
        window.location.href
      );
      setConfirmTarget({ kind: "back" });
    };

    // Refresh/close: native browser prompt as a last-line guard.
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    // Push one sentinel entry when arming so the first Back is trappable.
    if (!sentinelArmedRef.current) {
      sentinelArmedRef.current = true;
      window.history.pushState(
        { dk_exam_guard: true },
        "",
        window.location.href
      );
    }
    window.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [phase]);

  return (
    <LayoutWrapper>
      <RequireProfile>
        <div className="space-y-6">
          {phase === "select" && (
            <div className="mx-auto w-full max-w-lg space-y-6">
              <header className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-[var(--text-heading)]">
                  Exam Simulation
                </h1>
                <p className="text-[var(--text-muted)]">
                  {availableCount === null
                    ? "Loading question bank…"
                    : `${availableCount} questions available. Select the length of your exam.`}
                </p>
              </header>

              {error && (
                <p
                  className="rounded-xl border border-[var(--error)]/40 bg-[var(--error-soft)] px-4 py-3 text-sm text-[var(--error-text)]"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-3">
                {EXAM_OPTIONS.map((opt) => {
                  const isSelected = selectedCount === opt.count;
                  return (
                    <button
                      key={opt.count}
                      type="button"
                      onClick={() => setSelectedCount(opt.count)}
                      aria-pressed={isSelected}
                      className={`flex items-center justify-between gap-4 rounded-xl border bg-[var(--bg-card)] p-5 text-left transition-colors ${
                        isSelected
                          ? "border-[var(--accent-cyan)] ring-1 ring-[var(--accent-cyan)]/40"
                          : "border-[var(--border-color)] hover:border-[var(--accent-cyan)]/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={`flex size-12 items-center justify-center rounded-lg text-xl font-bold tabular-nums ${
                            isSelected
                              ? "bg-[var(--primary-btn-bg)] text-[var(--primary-btn-text)]"
                              : "bg-[var(--bg-card-alt)] text-[var(--text-heading)]"
                          }`}
                        >
                          {opt.count}
                        </span>
                        <div>
                          <p
                            className={`text-base font-semibold ${
                              isSelected
                                ? "text-[var(--accent-cyan-strong)]"
                                : "text-[var(--text-heading)]"
                            }`}
                          >
                            {opt.label}
                          </p>
                          <p className="text-sm text-[var(--text-muted)]">
                            {opt.description}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium tabular-nums ${
                          isSelected
                            ? "bg-cyan-500/10 text-[var(--accent-cyan-strong)]"
                            : "text-[var(--text-muted)]"
                        }`}
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="size-3.5"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                        {Math.round(opt.timeLimitSeconds / 60)} min
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => handleStart(selectedCount)}
                disabled={starting}
                className="hud-primary-btn w-full rounded-xl px-6 py-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {starting
                  ? "Starting exam…"
                  : `Start ${selectedCount} Question Exam`}
              </button>
            </div>
          )}

          {phase === "exam" && examQuestions && examId && (
            <ExamSession
              questions={examQuestions}
              timeLimitSeconds={timeLimitSeconds ?? undefined}
              onQuit={() => setConfirmTarget({ kind: "quit" })}
              onSubmit={handleSubmit}
            />
          )}

          {phase === "result" && result && examId && (
            <ExamResult
              examId={examId}
              result={result}
              onStartNew={handleStartNew}
            />
          )}

          <ConfirmModal
            open={confirmTarget !== null}
            title="Quit exam?"
            message="Are you sure you want to quit? This will erase your progress and your result won't come up in the leaderboard."
            confirmLabel="Yes"
            cancelLabel="No"
            danger
            onConfirm={handleConfirm}
            onCancel={() => setConfirmTarget(null)}
          />
        </div>
      </RequireProfile>
    </LayoutWrapper>
  );
}