"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import CaptchaWidget, {
  isCaptchaConfigured,
  type CaptchaWidgetHandle,
} from "@/components/CaptchaWidget";
import { useAuth } from "@/components/AuthProvider";

type CaptchaStatus = "disabled" | "pending" | "ready" | "unavailable";

type CaptchaContextValue = {
  status: CaptchaStatus;
  /** Returns the current token (if any) and starts fetching the next one. */
  consumeToken: () => string | undefined;
};

const CaptchaContext = createContext<CaptchaContextValue | null>(null);

// Safety net for a pre-warm attempt that never resolves and never fires
// Turnstile's own error-callback either (e.g. a hung request) -- surface a
// visible fallback instead of leaving submit buttons disabled forever with
// no explanation. See the diagknow.app domain-mismatch incident this was
// added after.
const UNAVAILABLE_TIMEOUT_MS = 8000;

/**
 * Mounted once in app/layout.tsx, above PageTransition, so this survives
 * client-side navigation (PageTransition remounts everything below it on
 * every route change -- see its `key={pathname}`). Keeps one hidden
 * Turnstile widget solving in the background for the entire time a visitor
 * is anonymous, so components/AuthForm.tsx and ForgotPasswordForm.tsx
 * usually find a token already waiting instead of starting cold.
 */
export function CaptchaProvider({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  const widgetRef = useRef<CaptchaWidgetHandle | null>(null);
  const tokenRef = useRef<string | undefined>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<CaptchaStatus>(
    isCaptchaConfigured ? "pending" : "disabled",
  );

  // No point pre-warming for an already signed-in session browsing the app;
  // resumes automatically after logout since `user` becomes null again.
  const active = isCaptchaConfigured && !loading && !user;

  const armTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setStatus((s) => (s === "ready" ? s : "unavailable"));
    }, UNAVAILABLE_TIMEOUT_MS);
  }, []);

  // Arms the "unavailable" failsafe as soon as the hidden widget goes active.
  // Deliberately doesn't reset `status` here: the initial state already
  // covers the common case, and re-activating after a prior "unavailable"
  // (e.g. sign-out -> sign-in-again) self-corrects once the widget's own
  // callback/error fires below.
  useEffect(() => {
    if (!active) return;
    armTimeout();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [active, armTimeout]);

  const handleToken = useCallback(
    (token: string | undefined) => {
      tokenRef.current = token;
      if (!active) return;
      if (token) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setStatus("ready");
      } else {
        setStatus("pending");
        armTimeout();
      }
    },
    [active, armTimeout],
  );

  const handleError = useCallback(() => {
    tokenRef.current = undefined;
    setStatus("unavailable");
  }, []);

  const consumeToken = useCallback((): string | undefined => {
    const token = tokenRef.current;
    tokenRef.current = undefined;
    if (token) {
      setStatus("pending");
      armTimeout();
      // Fetch the next token in the background; callers don't wait on it.
      widgetRef.current?.reset();
    }
    return token;
  }, [armTimeout]);

  return (
    <CaptchaContext.Provider value={{ status, consumeToken }}>
      {active && (
        <div aria-hidden="true" style={{ position: "fixed", top: -9999, left: -9999 }}>
          <CaptchaWidget ref={widgetRef} onToken={handleToken} onError={handleError} />
        </div>
      )}
      {children}
    </CaptchaContext.Provider>
  );
}

export function useCaptchaToken() {
  const ctx = useContext(CaptchaContext);
  if (!ctx) {
    throw new Error("useCaptchaToken must be used within CaptchaProvider");
  }
  return ctx;
}
