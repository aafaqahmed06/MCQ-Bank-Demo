"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X, type LucideIcon } from "lucide-react";
import { cn } from "./cn";
import { Icon } from "./Icon";

export type ToastVariant = "success" | "warning" | "error" | "info";

type ToastOptions = {
  title: string;
  description?: string;
  duration?: number;
};

type ToastItem = ToastOptions & { id: number; variant: ToastVariant };

type ToastContextValue = {
  show: (variant: ToastVariant, options: ToastOptions | string) => void;
  success: (options: ToastOptions | string) => void;
  warning: (options: ToastOptions | string) => void;
  error: (options: ToastOptions | string) => void;
  info: (options: ToastOptions | string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;

const VARIANT_ICON: Record<ToastVariant, LucideIcon> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-success/30 bg-success-soft text-success-text",
  warning: "border-warning/30 bg-warning-soft text-warning-text",
  error: "border-error/30 bg-error-soft text-error-text",
  info: "border-info/30 bg-info-soft text-info-text",
};

function normalize(options: ToastOptions | string): ToastOptions {
  return typeof options === "string" ? { title: options } : options;
}

let idCounter = 0;

/** Centralized toast system (§9) — mount once at the app root (see
 * app/layout.tsx). Desktop: top-right. Mobile: bottom, above any nav. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (variant: ToastVariant, options: ToastOptions | string) => {
      const { title, description, duration } = normalize(options);
      const id = ++idCounter;
      setToasts((current) => [...current, { id, variant, title, description }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration ?? DEFAULT_DURATION)
      );
    },
    [dismiss]
  );

  const value: ToastContextValue = {
    show,
    success: (options) => show("success", options),
    warning: (options) => show("warning", options),
    error: (options) => show("error", options),
    info: (options) => show("info", options),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="toast-viewport pointer-events-none fixed inset-x-0 bottom-4 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:top-4 sm:right-4 sm:bottom-auto sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "fade-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border p-4 shadow-elevated sm:w-96",
              VARIANT_STYLES[toast.variant]
            )}
          >
            <Icon
              icon={VARIANT_ICON[toast.variant]}
              size="md"
              className="mt-0.5"
              aria-label={toast.variant}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-sm opacity-90">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded-control p-1 opacity-70 transition-opacity duration-150 hover:opacity-100"
            >
              <Icon icon={X} size="sm" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
