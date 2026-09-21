import { cn } from "./cn";

export type ProgressVariant = "default" | "success" | "warning" | "danger" | "info";
export type ProgressSize = "sm" | "md";

type ProgressProps = {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  className?: string;
  /** Accessible label — required since the bar has no visible text of its own. */
  label: string;
};

const VARIANT_FILL: Record<ProgressVariant, string> = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-error",
  info: "bg-info",
};

const SIZE_STYLES: Record<ProgressSize, string> = {
  sm: "h-1.5",
  md: "h-2",
};

export function Progress({
  value,
  max = 100,
  variant = "default",
  size = "md",
  className,
  label,
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        "w-full overflow-hidden rounded-full bg-surface-secondary",
        SIZE_STYLES[size],
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-300 ease-out",
          VARIANT_FILL[variant]
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
