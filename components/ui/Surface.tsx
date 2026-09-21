import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type SurfaceLevel = 1 | 2 | 3;
export type SurfaceTag = "div" | "section" | "article" | "aside";

type SurfaceProps = {
  as?: SurfaceTag;
  /** Visual level per the design-system's 4-level hierarchy (§1) — Level 0
   * (canvas) has no component, this covers Levels 1-3. */
  level?: SurfaceLevel;
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">;

const LEVEL_STYLES: Record<SurfaceLevel, string> = {
  1: "bg-surface border border-border-subtle shadow-subtle",
  2: "bg-surface border border-border-default shadow-subtle",
  3: "bg-surface-elevated border border-border-default shadow-elevated",
};

/** Low-level box primitive behind Card — reach for this when content needs
 * a level of elevation but isn't a "card" in the content sense (e.g. a
 * grouped control panel, a sidebar section). */
export function Surface({
  as: Component = "div",
  level = 2,
  className,
  children,
  ...props
}: SurfaceProps) {
  return (
    <Component
      className={cn("rounded-card", LEVEL_STYLES[level], className)}
      {...props}
    >
      {children}
    </Component>
  );
}
