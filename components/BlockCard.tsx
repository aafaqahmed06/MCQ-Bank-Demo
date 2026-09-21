import Link from "next/link";
import { ChevronRight, AlertTriangle } from "lucide-react";
import type { Block } from "@/types";
import { formatLastActive } from "@/lib/activity";
import CompletionStatus from "@/components/CompletionStatus";
import { Card, Badge, Icon } from "@/components/ui";

export default function BlockCard({ block }: { block: Block }) {
  const hasProgress = typeof block.topicsTotal === "number" && block.topicsTotal > 0;

  const metadata: string[] = [];
  if (typeof block.subjectCount === "number" && block.subjectCount > 0) {
    metadata.push(`${block.subjectCount} subject${block.subjectCount !== 1 ? "s" : ""}`);
  }
  if (hasProgress) metadata.push(`${block.topicsTotal} topics`);
  if (typeof block.questionCount === "number" && block.questionCount > 0) {
    metadata.push(`${block.questionCount} question${block.questionCount !== 1 ? "s" : ""}`);
  }

  return (
    <Link href={`/modules/${block.id}`} className="block h-full">
      <Card variant="interactive" padding="md" className="h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Badge variant="primary" size="sm">
              Year {block.year}
            </Badge>
            <h3 className="text-lg font-semibold text-text-primary">{block.name}</h3>
            {metadata.length > 0 && (
              <p className="text-sm text-text-tertiary">{metadata.join(" · ")}</p>
            )}
            {block.lastActivityAt && (
              <p className="text-caption text-text-tertiary">
                Last practiced {formatLastActive(block.lastActivityAt)}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <CompletionStatus
              completed={block.topicsCompleted ?? 0}
              total={block.topicsTotal ?? 0}
            />
            <Icon icon={ChevronRight} size="sm" className="text-text-tertiary" />
          </div>
        </div>
        {typeof block.weakTopicCount === "number" && block.weakTopicCount > 0 && (
          <div className="mt-3 border-t border-border-subtle pt-3">
            <Badge variant="warning" size="sm">
              <Icon icon={AlertTriangle} size="xs" />
              {block.weakTopicCount} need{block.weakTopicCount === 1 ? "s" : ""} review
            </Badge>
          </div>
        )}
      </Card>
    </Link>
  );
}
