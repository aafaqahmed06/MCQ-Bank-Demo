import Link from "next/link";
import { ChevronRight, AlertTriangle } from "lucide-react";
import type { TopicGroup } from "@/types";
import { formatLastActive } from "@/lib/activity";
import CompletionStatus from "@/components/CompletionStatus";
import { Card, Badge, Icon } from "@/components/ui";

export default function TopicGroupCard({
  topicGroup,
  mcqCount,
  completedTopics = 0,
  totalTopics = 0,
  weakTopicCount = 0,
  lastActivityAt = null,
}: {
  topicGroup: TopicGroup;
  mcqCount: number;
  completedTopics?: number;
  totalTopics?: number;
  weakTopicCount?: number;
  lastActivityAt?: string | null;
}) {
  const href = `/practice/${topicGroup.moduleId}?topic=${encodeURIComponent(topicGroup.name)}`;

  return (
    <Link href={href} className="block h-full">
      <Card variant="interactive" padding="md" className="h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-text-primary">{topicGroup.name}</h3>
            <p className="text-sm text-text-tertiary">
              {mcqCount} question{mcqCount !== 1 ? "s" : ""}
            </p>
            {lastActivityAt && (
              <p className="text-caption text-text-tertiary">
                Last practiced {formatLastActive(lastActivityAt)}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <CompletionStatus completed={completedTopics} total={totalTopics} />
            <Icon icon={ChevronRight} size="sm" className="text-text-tertiary" />
          </div>
        </div>
        {weakTopicCount > 0 && (
          <div className="mt-3 border-t border-border-subtle pt-3">
            <Badge variant="warning" size="sm">
              <Icon icon={AlertTriangle} size="xs" />
              Needs review
            </Badge>
          </div>
        )}
      </Card>
    </Link>
  );
}
