import { cn } from "./cn";

type SkeletonProps = {
  /** No intrinsic size — shape it to the content it stands in for, e.g.
   * className="h-4 w-32" for a text line, "h-10 w-10 rounded-full" for an avatar. */
  className?: string;
};

/** Base loading primitive (§9). Page-specific skeletons (dashboard,
 * curriculum, question, results…) compose this to match real content
 * geometry — built per-page in later phases, not here. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton-pulse rounded-control bg-surface-secondary", className)}
    />
  );
}
