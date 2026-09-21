import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger" | "info";
export type BadgeSize = "sm" | "md";

type BadgeProps = {
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children">;

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  neutral: "bg-surface-secondary text-text-secondary border border-border-default",
  primary: "bg-primary/10 text-primary border border-primary/25",
  success: "bg-success-soft text-success-text border border-success/30",
  warning: "bg-warning-soft text-warning-text border border-warning/30",
  danger: "bg-error-soft text-error-text border border-error/30",
  info: "bg-info-soft text-info-text border border-info/30",
};

const SIZE_STYLES: Record<BadgeSize, string> = {
  sm: "h-5 px-2 text-caption gap-1",
  md: "h-6 px-2.5 text-meta gap-1",
};

export function Badge({
  variant = "neutral",
  size = "md",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-badge font-medium",
        SIZE_STYLES[size],
        VARIANT_STYLES[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
