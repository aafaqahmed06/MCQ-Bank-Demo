import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { cn } from "./cn";

type EmptyStateProps = {
  icon?: LucideIcon;
  /** Opt-in slot for a D.K. illustration or other custom art — overrides
   * `icon` when set. Per §9, D.K. shows up here only when it genuinely
   * improves the moment, not as the default treatment. */
  illustration?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

/** What happened, why is it empty, what should I do — every empty state
 * answers those three things (§9). */
export function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 py-12 text-center", className)}>
      {illustration}
      {!illustration && icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-secondary text-text-tertiary">
          <Icon icon={icon} size="lg" />
        </div>
      )}
      <div className="max-w-sm space-y-1">
        <p className="text-h3 font-semibold text-text-primary">{title}</p>
        {description && <p className="text-sm text-text-secondary">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
