"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import DkBot from "@/components/DkBot";
import type { DkBotState } from "@/lib/dkBotAssets";

/**
 * D.K. Bot Tutorial — floating character that guides new users through
 * the app after onboarding. Uses framer-motion for step transitions and
 * CSS for highlight glow on dashboard sections.
 *
 * Renders nothing if the user has completed or skipped the tutorial
 * (stored in localStorage under "dk-tutorial-completed").
 */

const STORAGE_KEY = "dk-tutorial-completed";

type Step = {
  state: DkBotState;
  title: string;
  message: string;
  highlight?: string; // CSS selector for [data-tutorial] target
  cta?: string;       // override CTA label (default: "Next")
  href?: string;      // navigation target on final step
};

const STEPS: Step[] = [
  {
    state: "waving",
    title: "Welcome!",
    message:
      "Hi! I'm D.K., your study buddy. Let me show you around DiagKnow.",
  },
  {
    state: "presenting",
    title: "Your Dashboard",
    message:
      "This is your home. Track questions practiced, accuracy, exams completed, and average score — all in one place.",
    highlight: '[data-tutorial="stats"]',
  },
  {
    state: "pointingRight",
    title: "Start Practice",
    message:
      "Tap Start Practice to revise by block, module, and topic. Build clinical knowledge one question at a time.",
    highlight: '[data-tutorial="practice"]',
  },
  {
    state: "pointingRight",
    title: "Exam Simulation",
    message:
      "Exam Simulation tests you under timed, real-exam conditions. Great for self-assessment.",
    highlight: '[data-tutorial="exam"]',
  },
  {
    state: "pointingRight",
    title: "Leaderboard",
    message:
      "See how you compare with your cohort. Exams completed and accuracy determine your rank.",
    highlight: '[data-tutorial="leaderboard"]',
  },
  {
    state: "excited",
    title: "Let's Go!",
    message:
      "Ready to begin? Let's try your first practice session!",
    cta: "Start Practice",
    href: "/blocks",
  },
];

/* ── Highlight manager ─────────────────────────────────────────── */

let currentHighlight: Element | null = null;

function setHighlight(selector: string | undefined) {
  if (currentHighlight) {
    currentHighlight.classList.remove("tutorial-highlight");
    currentHighlight = null;
  }
  if (selector) {
    const el = document.querySelector(selector);
    if (el) {
      el.classList.add("tutorial-highlight");
      currentHighlight = el;
    }
  }
}

function clearHighlight() {
  if (currentHighlight) {
    currentHighlight.classList.remove("tutorial-highlight");
    currentHighlight = null;
  }
}

/* ── Component ─────────────────────────────────────────────────── */

export default function TutorialOverlay({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return true;
    }
  });

  // Update highlight when step changes
  useEffect(() => {
    if (!completed) {
      setHighlight(STEPS[step]?.highlight);
    }
    return () => clearHighlight();
  }, [step, completed]);

  function dismiss() {
    clearHighlight();
    setCompleted(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
  }

  function advance() {
    const next = step + 1;
    if (next >= STEPS.length) {
      // Final step — navigate and dismiss
      dismiss();
      router.push("/blocks");
      return;
    }
    setStep(next);
  }

  // Don't render if tutorial is completed
  if (completed) return <>{children}</>;

  const current = STEPS[step];

  return (
    <>
      {children}

      <div className="fixed bottom-4 left-4 z-50 sm:bottom-6 sm:left-6">
        <AnimatePresence>
          <motion.div
            key="tutorial"
            className="flex flex-col items-start gap-3"
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25 }}
          >
            {/* Speech bubble */}
            <motion.div
              className="tutorial-bubble max-w-[280px] text-sm sm:max-w-sm sm:text-base"
              role="region"
              aria-label="D.K. Bot tutorial"
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {/* Step content with cross-fade */}
              <div className="min-h-[80px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <h3 className="font-semibold text-[var(--text-heading)]">
                      {current.title}
                    </h3>
                    <p className="mt-1 text-[var(--text-muted)]">
                      {current.message}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Progress dots */}
              <div className="mt-3 flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`tutorial-dot ${i === step ? "tutorial-dot-active" : ""}`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={dismiss}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-heading)]"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={advance}
                  className="hud-primary-btn rounded-lg px-4 py-1.5 text-xs font-medium sm:text-sm"
                >
                  {current.cta ?? "Next"}
                </button>
              </div>
            </motion.div>

            {/* Bot */}
            <div className="tutorial-bot">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.state}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                >
                  <DkBot state={current.state} size="small" alt={null} />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
