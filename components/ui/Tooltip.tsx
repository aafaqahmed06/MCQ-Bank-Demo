"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "./cn";

type TooltipPlacement = "top" | "bottom" | "left" | "right";

type TooltipProps = {
  content: string;
  children: ReactNode;
  placement?: TooltipPlacement;
  className?: string;
};

const PLACEMENT_STYLES: Record<TooltipPlacement, string> = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
};

/** Lightweight, non-portaled tooltip — fine for nav/toolbar triggers. A
 * trigger inside an overflow-hidden/scroll container can clip it; a
 * portaled version is a later-phase concern if that turns out to matter. */
export function Tooltip({ content, children, placement = "top", className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span aria-describedby={visible ? id : undefined}>{children}</span>
      <span
        role="tooltip"
        id={id}
        className={cn(
          "pointer-events-none absolute z-50 rounded-badge border border-border-default bg-surface-elevated px-2.5 py-1.5 text-caption whitespace-nowrap text-text-primary shadow-elevated transition-opacity duration-150",
          visible ? "opacity-100" : "opacity-0",
          PLACEMENT_STYLES[placement],
          className
        )}
      >
        {content}
      </span>
    </span>
  );
}
