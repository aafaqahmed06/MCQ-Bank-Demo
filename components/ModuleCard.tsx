import Link from "next/link";
import type { Module } from "@/types";
import CompletionStatus from "@/components/CompletionStatus";

export default function ModuleCard({ module: mod }: { module: Module }) {
  const hasProgress =
    typeof mod.topicsTotal === "number" && mod.topicsTotal > 0;

  return (
    <Link
      href={`/topics/${mod.id}`}
      className="hud-card hud-card-hover group block rounded-xl p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-[var(--text-heading)]">
            {mod.name}
          </h3>
          {hasProgress ? (
            <p className="text-sm text-[var(--text-muted)]">
              {mod.topicsCompleted} of {mod.topicsTotal} topics done
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <CompletionStatus
            completed={mod.topicsCompleted ?? 0}
            total={mod.topicsTotal ?? 0}
          />
          <span className="text-[var(--text-muted-light)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--accent-cyan)]">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}