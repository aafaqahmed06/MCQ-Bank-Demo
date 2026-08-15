"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import DkBot from "@/components/DkBot";
import type { DkBotState } from "@/lib/dkBotAssets";

/**
 * Dex Tutorial — floating character that guides new users through
 * the app after onboarding.
 *
 * - Larger Dex floats bottom-left with a speech bubble.
 * - On steps that reference a dashboard section, a spotlight dims the
 *   whole dashboard and forms a glowing window over the target.
 * - Uses framer-motion for cross-fades and smooth spotlight movement.
 * - Renders nothing if the user has completed/skipped the tutorial
 *   (stored in localStorage under "dk-tutorial-completed").
 */

const STORAGE_KEY = "dk-tutorial-completed";

const SPOTLIGHT_PAD = 6; // px of breathing room around the target

type Step = {
  state: DkBotState;
  title: string;
  message: string;
  highlight?: string;   // CSS selector for [data-tutorial] target
  cta?: string;         // override CTA label (default: "Next")
  href?: string;        // navigation target on final step
};

const STEPS: Step[] = [
  {
    state: "waving",
    title: "Welcome!",
    message:
      "Hi! I'm Dex, your study buddy. Let me show you around DiagKnow.",
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

type Rect = { top: number; left: number; width: number; height: number };

/* ── Spotlight ────────────────────────────────────────────────────
   A fixed overlay that dims the dashboard and forms a glowing window
   over the currently highlighted element. Moves smoothly between
   targets and fades in/out on mount/unmount via AnimatePresence.
   ───────────────────────────────────────────────────────────────── */

function Spotlight({ selector }: { selector?: string }) {
  const [rect, setRect] = useState<Rect | null>(null);
  const lastSelector = useRef<string | null>(null);

  useEffect(() => {
    if (!selector) return;

    const measure = () => {
      const el = document.querySelector(selector);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top - SPOTLIGHT_PAD,
        left: r.left - SPOTLIGHT_PAD,
        width: r.width + SPOTLIGHT_PAD * 2,
        height: r.height + SPOTLIGHT_PAD * 2,
      });
    };

    // Scroll the target into view when a new highlight step begins.
    if (lastSelector.current !== selector) {
      lastSelector.current = selector;
      const el = document.querySelector(selector);
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      el?.scrollIntoView({
        block: "center",
        behavior: reduce ? "auto" : "smooth",
      });
    }

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    const raf = requestAnimationFrame(measure);

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      cancelAnimationFrame(raf);
    };
  }, [selector]);

  return (
    <AnimatePresence>
      {rect && (
        <motion.div
          className="tutorial-spotlight"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, ...rect }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />
      )}
    </AnimatePresence>
  );
}

/* ── Tutorial ───────────────────────────────────────────────────── */

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

  function dismiss() {
    setCompleted(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
  }

  /** Replay the tutorial from step zero, e.g. via the dev shortcuts. */
  function replay() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setCompleted(false);
    setStep(0);
  }

  // Dev shortcuts — registered before the early return so they stay live
  // even after the tutorial is dismissed (only mounted on /home).
  // Desktop: Ctrl+Shift+Alt+R. Mobile: 5 quick taps anywhere within 2s.
  useEffect(() => {
    let taps = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.altKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        replay();
      }
    }

    function onTap() {
      taps += 1;
      if (timer) clearTimeout(timer);
      if (taps >= 5) {
        taps = 0;
        replay();
      } else {
        timer = setTimeout(() => {
          taps = 0;
        }, 2000);
      }
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onTap);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onTap);
      if (timer) clearTimeout(timer);
    };
  }, []);

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
    <MotionConfig reducedMotion="user">
      {children}

      {/* Spotlight over the highlighted dashboard section */}
      {current.highlight && <Spotlight selector={current.highlight} />}

      {/* Floating bot + bubble */}
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
              className="tutorial-bubble max-w-[280px] text-sm sm:max-w-lg sm:text-base"
              role="region"
              aria-label="Dex tutorial"
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

            {/* Bot — large on desktop, small on mobile */}
            <div className="tutorial-bot">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.state}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                >
                  <span className="hidden sm:block">
                    <DkBot state={current.state} size="large" alt={null} />
                  </span>
                  <span className="sm:hidden">
                    <DkBot state={current.state} size="small" alt={null} />
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}