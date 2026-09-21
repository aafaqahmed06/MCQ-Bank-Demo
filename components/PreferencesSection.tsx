"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useMotion } from "@/components/MotionProvider";
import { Icon, cn } from "@/components/ui";

/** Appearance + motion controls (Account → Preferences). */
export default function PreferencesSection() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { motion, setMotion } = useMotion();
  const reducedMotion = motion === "reduced";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-medium text-text-primary">Appearance</p>
          <p className="text-sm text-text-tertiary">Choose how DiagKnow looks on this device.</p>
        </div>
        <div className="inline-flex rounded-control border border-border-default bg-surface-secondary p-1">
          <button
            type="button"
            onClick={() => theme !== "light" && toggleTheme()}
            aria-pressed={theme === "light"}
            className={cn(
              "flex items-center gap-1.5 rounded-control px-3 py-1.5 text-sm font-medium transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              theme === "light" ? "bg-primary text-white" : "text-text-tertiary hover:text-text-primary"
            )}
          >
            <Icon icon={Sun} size="xs" />
            Light
          </button>
          <button
            type="button"
            onClick={() => theme !== "dark" && toggleTheme()}
            aria-pressed={theme === "dark"}
            className={cn(
              "flex items-center gap-1.5 rounded-control px-3 py-1.5 text-sm font-medium transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              theme === "dark" ? "bg-primary text-white" : "text-text-tertiary hover:text-text-primary"
            )}
          >
            <Icon icon={Moon} size="xs" />
            Dark
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-medium text-text-primary">Reduce motion</p>
          <p className="text-sm text-text-tertiary">
            Turns off decorative animation across the app, on top of your device&apos;s own
            reduced-motion setting.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={reducedMotion}
          aria-label="Reduce motion"
          onClick={() => setMotion(reducedMotion ? "full" : "reduced")}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            reducedMotion ? "bg-primary" : "border border-border-default bg-surface-secondary"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-elevated transition-transform duration-150",
              reducedMotion && "translate-x-5"
            )}
          />
        </button>
      </div>
    </div>
  );
}
