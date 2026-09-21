import type { LucideIcon } from "lucide-react";
import { cn } from "./cn";

export type IconSize = "xs" | "sm" | "md" | "lg";

const SIZE_MAP: Record<IconSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
};

type IconProps = {
  icon: LucideIcon;
  size?: IconSize;
  strokeWidth?: number;
  className?: string;
  /** Only set this when the icon carries meaning on its own (no adjacent
   * text label) — otherwise it stays aria-hidden so screen readers don't
   * announce decorative glyphs. */
  "aria-label"?: string;
};

/** Single entry point for every icon in the app — standardizes size and
 * stroke width so icons never look mismatched across components. */
export function Icon({
  icon: LucideIcon,
  size = "md",
  strokeWidth = 1.75,
  className,
  "aria-label": ariaLabel,
}: IconProps) {
  return (
    <LucideIcon
      size={SIZE_MAP[size]}
      strokeWidth={strokeWidth}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      className={cn("shrink-0", className)}
    />
  );
}
