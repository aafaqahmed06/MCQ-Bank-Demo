"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "./cn";
import { IconButton } from "./IconButton";

export type ModalSize = "sm" | "md" | "lg";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: ModalSize;
  children?: ReactNode;
  className?: string;
  /** Hide the header close button — use when the body already has explicit
   * cancel/confirm actions and a stray X would be redundant. */
  hideCloseButton?: boolean;
};

const SIZE_STYLES: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
};

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Focus-trapping, Escape-to-close, scroll-locking modal (§9 accessibility).
 * Renders nothing while closed, matching the existing ConfirmModal pattern. */
export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  className,
  hideCloseButton = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable?.[0] ?? dialog)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "fade-in w-full rounded-card border border-border-default bg-surface-elevated p-6 shadow-elevated outline-none",
          SIZE_STYLES[size],
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-h3 font-semibold text-text-primary">
            {title}
          </h2>
          {!hideCloseButton && (
            <IconButton
              icon={X}
              label="Close"
              size="sm"
              onClick={onClose}
              className="-mt-1 -mr-1"
            />
          )}
        </div>
        {description && (
          <p id={descriptionId} className="mt-2 text-sm text-text-secondary">
            {description}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
}
