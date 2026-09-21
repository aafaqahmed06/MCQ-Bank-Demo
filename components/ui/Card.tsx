import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type CardVariant = "default" | "interactive" | "elevated" | "highlight" | "danger";
export type CardPadding = "none" | "sm" | "md" | "lg";

type CardProps = {
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "className" | "children">;

const VARIANT_STYLES: Record<CardVariant, string> = {
  default: "bg-surface border border-border-default shadow-subtle",
  interactive:
    "bg-surface border border-border-default shadow-subtle cursor-pointer transition-[transform,box-shadow,border-color] duration-200 hover:border-primary/40 hover:-translate-y-px hover:shadow-default",
  elevated: "bg-surface-elevated border border-border-default shadow-elevated",
  // Tinted backgrounds (card-highlight / card-danger) are defined in
  // globals.css via color-mix — see "Card variant surfaces" there.
  highlight: "card-highlight border border-primary/30 shadow-subtle",
  danger: "card-danger border border-error/35 shadow-subtle",
};

const PADDING_STYLES: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

/** Level 2/3 content container per the design system (§1, §3). Don't reach
 * for this by default — most content should be a Level 0/1 section (plain
 * typography + spacing), not a card. Use `variant="highlight"` sparingly,
 * only for genuinely important information (§1 Level 3 guidance). */
export function Card({
  variant = "default",
  padding = "md",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card",
        VARIANT_STYLES[variant],
        PADDING_STYLES[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
