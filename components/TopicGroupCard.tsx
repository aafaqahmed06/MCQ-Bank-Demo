import Link from "next/link";
import type { TopicGroup } from "@/types";
import CompletionStatus from "@/components/CompletionStatus";

export default function TopicGroupCard({
  topicGroup,
  mcqCount,
  completedTopics = 0,
  totalTopics = 0,
}: {
  topicGroup: TopicGroup;
  mcqCount: number;
  completedTopics?: number;
  totalTopics?: number;
}) {
  const href = `/practice/${topicGroup.moduleId}?topic=${encodeURIComponent(topicGroup.name)}`;

  return (
    <Link href={href} className="hud-card hud-card-hover group block rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-[var(--text-heading)]">
            {topicGroup.name}
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            {mcqCount} question{mcqCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <CompletionStatus completed={completedTopics} total={totalTopics} />
          <span className="text-[var(--text-muted-light)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--accent-cyan)]">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}