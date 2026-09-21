"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
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
import { Button, Icon, cn } from "@/components/ui";

type Phase = "select" | "exam" | "result";

// Copy communicates commitment, not just length (§ Exam mode "Exam selection").
const EXAM_OPTIONS: {
  count: number;
  label: string;
  description: string;
  timeLimitSeconds: number;
}[] = [
  {
    count: 20,
    label: "Quick Check",
    description: "Rapid revision",
    timeLimitSeconds: 20 * 60,
  },
  {
    count: 50,
    label: "Standard Exam",
    description: "Balanced simulation",
    timeLimitSeconds: 50 * 60,
  },
  {
    count: 100,
    label: "Full Simulation",
    description: "Exam endurance",
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
    // handleStart only clears `starting` on failure (transitioning to phase
    // "exam" on success left it permanently true) -- without this, quitting
    // or starting a new exam re-shows the "select" screen with the Start
    // button stuck disabled on "Starting exam…".
    setStarting(false);
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
                <h1 className="text-h1 font-bold tracking-tight text-text-primary">
                  Exam Simulation
                </h1>
                <p className="text-text-tertiary">
                  {availableCount === null
                    ? "Loading question bank…"
                    : `${availableCount} questions available. Select the length of your exam.`}
                </p>
              </header>

              {error && (
                <p className="alert-error rounded-control px-4 py-3 text-sm" role="alert">
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
                      className={cn(
                        "flex items-center justify-between gap-4 rounded-card border bg-surface p-5 text-left transition-colors duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        isSelected
                          ? "border-primary ring-1 ring-primary/40"
                          : "border-border-default hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={cn(
                            "flex size-12 items-center justify-center rounded-card text-xl font-bold tabular-nums",
                            isSelected
                              ? "bg-primary text-white"
                              : "bg-surface-secondary text-text-primary"
                          )}
                        >
                          {opt.count}
                        </span>
                        <div>
                          <p
                            className={cn(
                              "text-base font-semibold",
                              isSelected ? "text-primary" : "text-text-primary"
                            )}
                          >
                            {opt.label}
                          </p>
                          <p className="text-sm text-text-tertiary">
                            {opt.count} questions · ~{Math.round(opt.timeLimitSeconds / 60)} min ·{" "}
                            {opt.description}
                          </p>
                        </div>
                      </div>
                      <Icon
                        icon={Clock}
                        size="sm"
                        className={isSelected ? "text-primary" : "text-text-tertiary"}
                      />
                    </button>
                  );
                })}
              </div>

              <Button onClick={() => handleStart(selectedCount)} loading={starting} fullWidth size="lg">
                {starting ? "Starting exam…" : `Start ${selectedCount} Question Exam`}
              </Button>
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