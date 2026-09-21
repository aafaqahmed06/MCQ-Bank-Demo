"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type MotionPref = "full" | "reduced";

type MotionContextValue = {
  motion: MotionPref;
  setMotion: (m: MotionPref) => void;
};

const MotionContext = createContext<MotionContextValue | null>(null);

const STORAGE_KEY = "diagnknow-motion";

function getInitialMotion(): MotionPref {
  if (typeof window === "undefined") return "full";
  return localStorage.getItem(STORAGE_KEY) === "reduced" ? "reduced" : "full";
}

/** In-app "Reduce motion" preference (Account → Preferences), independent
 * of (and additive to) the OS-level `prefers-reduced-motion` media query
 * the app already respects for a few animations. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [motion, setMotion] = useState<MotionPref>(getInitialMotion);

  useEffect(() => {
    document.documentElement.setAttribute("data-motion", motion);
    try {
      localStorage.setItem(STORAGE_KEY, motion);
    } catch {
      // ignore
    }
  }, [motion]);

  return (
    <MotionContext.Provider value={{ motion, setMotion }}>{children}</MotionContext.Provider>
  );
}

export function useMotion() {
  const ctx = useContext(MotionContext);
  if (!ctx) throw new Error("useMotion must be used within MotionProvider");
  return ctx;
}
