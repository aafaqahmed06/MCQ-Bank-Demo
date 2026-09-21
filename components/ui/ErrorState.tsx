import { AlertCircle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { cn } from "./cn";

type ErrorStateProps = {
  icon?: LucideIcon;
  title: string;
  /** ReactNode so callers can compose a reassurance line, e.g. "Your
   * previous progress is safe" (§9 example), not just a single sentence. */
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/** Understandable, actionable, calm, reassuring (§9) — never a bare
 * "Failed to X" message. */
export function ErrorState({
  icon = AlertCircle,
  title,
  description,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 py-12 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-soft text-error">
        <Icon icon={icon} size="lg" />
      </div>
      <div className="max-w-sm space-y-1">
        <p className="text-h3 font-semibold text-text-primary">{title}</p>
        {description && <div className="text-sm text-text-secondary">{description}</div>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
