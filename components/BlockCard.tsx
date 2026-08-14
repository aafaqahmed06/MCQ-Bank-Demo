import Link from "next/link";
import type { Block } from "@/types";
import CompletionStatus from "@/components/CompletionStatus";

export default function BlockCard({ block }: { block: Block }) {
  const hasProgress =
    typeof block.topicsTotal === "number" && block.topicsTotal > 0;

  return (
    <Link
      href={`/modules/${block.id}`}
      className="hud-card hud-card-hover group block rounded-xl p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <span className="inline-flex rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--accent-cyan-strong)]">
            Year {block.year}
          </span>
          <h3 className="text-lg font-semibold text-[var(--text-heading)]">
            {block.name}
          </h3>
          <div className="text-sm text-[var(--text-muted)]">
            {typeof block.subjectCount === "number" && block.subjectCount > 0 ? (
              <p>
                {block.subjectCount} subject{block.subjectCount !== 1 ? "s" : ""}
              </p>
            ) : null}
            {hasProgress ? (
              <p>
                {block.topicsCompleted} of {block.topicsTotal} topics done
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <CompletionStatus
            completed={block.topicsCompleted ?? 0}
            total={block.topicsTotal ?? 0}
          />
          <span className="text-[var(--text-muted-light)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--accent-cyan)]">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}