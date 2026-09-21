"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import DkBot from "@/components/DkBot";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui";
import type { DkBotState } from "@/lib/dkBotAssets";

/**
 * Dex Tutorial — floating character that guides new users through
 * the app after onboarding.
 *
 * - Larger Dex floats bottom-left with a speech bubble.
 * - The dashboard behind the tutorial is darkened and blocked from clicks
 *   at all times. On steps that reference a dashboard section, a spotlight
 *   punches a real (clickable, undimmed) hole over the target.
 * - Uses framer-motion for cross-fades and smooth spotlight movement.
 * - Mandatory: there is no skip. Renders nothing only once the user has
 *   completed every step (stored in localStorage per user under
 *   "dk-tutorial-completed-<userId>"). A brand-new account always starts
 *   the tutorial because that flag has not been written yet for the new
 *   user id.
 */

const STORAGE_KEY_PREFIX = "dk-tutorial-completed";

function storageKeyFor(userId: string) {
  return `${STORAGE_KEY_PREFIX}-${userId}`;
}

function readCompleted(userId: string): boolean {
  try {
    return localStorage.getItem(storageKeyFor(userId)) === "true";
  } catch {
    return true;
  }
}

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

/* ── Target measurement ───────────────────────────────────────────
   Tracks the bounding rect of the currently highlighted element (if
   any), keeping it in sync across resize/scroll so both the spotlight
   ring and the click-blocking overlay stay aligned with it.
   ───────────────────────────────────────────────────────────────── */

function useTargetRect(selector?: string): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);
  const lastSelector = useRef<string | null>(null);

  useEffect(() => {
    if (!selector) {
      lastSelector.current = null;
      return;
    }

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

  // No selector → no target, regardless of any stale measurement left
  // over from a previous highlighted step.
  return selector ? rect : null;
}

/* ── Dashboard blocker ────────────────────────────────────────────
   Four fixed panels that tile the viewport around the spotlight hole
   (or a single full-viewport panel when nothing is highlighted). Each
   panel is a real, pointer-events:auto element, so the dashboard
   underneath is genuinely unclickable — not just visually dimmed —
   everywhere except the punched-out target rect.
   ───────────────────────────────────────────────────────────────── */

function DashboardBlocker({ rect }: { rect: Rect | null }) {
  if (!rect) {
    return (
      <div
        className="tutorial-block-overlay"
        aria-hidden="true"
        style={{ top: 0, left: 0, right: 0, bottom: 0 }}
      />
    );
  }

  const top = Math.max(rect.top, 0);
  const bottom = rect.top + rect.height;
  const left = Math.max(rect.left, 0);
  const right = rect.left + rect.width;

  return (
    <>
      <div
        className="tutorial-block-overlay"
        aria-hidden="true"
        style={{ top: 0, left: 0, right: 0, height: top }}
      />
      <div
        className="tutorial-block-overlay"
        aria-hidden="true"
        style={{ top: bottom, left: 0, right: 0, bottom: 0 }}
      />
      <div
        className="tutorial-block-overlay"
        aria-hidden="true"
        style={{ top, left: 0, width: left, height: rect.height }}
      />
      <div
        className="tutorial-block-overlay"
        aria-hidden="true"
        style={{ top, left: right, right: 0, height: rect.height }}
      />
    </>
  );
}

/* ── Spotlight ring ───────────────────────────────────────────────
   Purely visual glowing border around the highlighted element. The
   actual dimming/blocking is handled by DashboardBlocker.
   ───────────────────────────────────────────────────────────────── */

function SpotlightRing({ rect }: { rect: Rect | null }) {
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
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [step, setStep] = useState(0);
  // Only mounted once RequireProfile has resolved a signed-in user, so the
  // lazy initializer can safely read the per-user completion flag. A new
  // account has no flag yet → tutorial starts mandatorily.
  const [completed, setCompleted] = useState<boolean>(() => {
    if (typeof window === "undefined" || !userId) return true;
    return readCompleted(userId);
  });

  function complete() {
    setCompleted(true);
    if (!userId) return;
    try {
      localStorage.setItem(storageKeyFor(userId), "true");
    } catch {
      // ignore
    }
  }

  function advance() {
    const next = step + 1;
    if (next >= STEPS.length) {
      // Final step — navigate and mark complete
      complete();
      router.push("/blocks");
      return;
    }
    setStep(next);
  }

  const current = completed ? undefined : STEPS[step];
  const rect = useTargetRect(current?.highlight);

  // Don't render if tutorial is completed
  if (completed || !current) return <>{children}</>;

  return (
    <MotionConfig reducedMotion="user">
      {children}

      {/* Darken + block the entire dashboard, punching a clickable hole
          over the highlighted element (if any). */}
      <DashboardBlocker rect={current.highlight ? rect : null} />
      <SpotlightRing rect={current.highlight ? rect : null} />

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
                    <h3 className="font-semibold text-text-primary">
                      {current.title}
                    </h3>
                    <p className="mt-1 text-text-secondary">
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

              {/* Actions — no skip; the tutorial is mandatory */}
              <div className="mt-3 flex items-center gap-2">
                <Button type="button" size="sm" onClick={advance}>
                  {current.cta ?? "Next"}
                </Button>
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
