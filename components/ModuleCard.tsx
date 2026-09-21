import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Module } from "@/types";
import { formatLastActive } from "@/lib/activity";
import CompletionStatus from "@/components/CompletionStatus";
import { TopicHealthBadge } from "@/components/TopicHealthBadge";
import { Card, Icon } from "@/components/ui";

export default function ModuleCard({ module: mod }: { module: Module }) {
  const hasProgress = typeof mod.topicsTotal === "number" && mod.topicsTotal > 0;
  const completePct =
    hasProgress && mod.topicsTotal
      ? Math.round(((mod.topicsCompleted ?? 0) / mod.topicsTotal) * 100)
      : null;

  const metadata: string[] = [];
  if (hasProgress) metadata.push(`${mod.topicsTotal} topics`);
  if (typeof mod.questionCount === "number" && mod.questionCount > 0) {
    metadata.push(`${mod.questionCount} question${mod.questionCount !== 1 ? "s" : ""}`);
  }
  if (completePct !== null) metadata.push(`${completePct}% complete`);

  return (
    <Link href={`/topics/${mod.id}`} className="block h-full">
      <Card variant="interactive" padding="md" className="h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-text-primary">{mod.name}</h3>
            {metadata.length > 0 && (
              <p className="text-sm text-text-tertiary">{metadata.join(" · ")}</p>
            )}
            {mod.lastActivityAt && (
              <p className="text-caption text-text-tertiary">
                Last practiced {formatLastActive(mod.lastActivityAt)}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <CompletionStatus
              completed={mod.topicsCompleted ?? 0}
              total={mod.topicsTotal ?? 0}
            />
            <Icon icon={ChevronRight} size="sm" className="text-text-tertiary" />
          </div>
        </div>
        {mod.accuracy != null && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3">
            <TopicHealthBadge
              accuracy={mod.accuracy}
              attempted={mod.questionsAttempted ?? 0}
              size="sm"
            />
            {typeof mod.weakTopicCount === "number" && mod.weakTopicCount > 0 && (
              <span className="text-caption text-text-tertiary">
                {mod.weakTopicCount} topic{mod.weakTopicCount === 1 ? "" : "s"} need review
              </span>
            )}
          </div>
        )}
      </Card>
    </Link>
  );
}
