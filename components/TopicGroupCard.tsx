import Link from "next/link";
import type { TopicGroup } from "@/types";

export default function TopicGroupCard({
  topicGroup,
  mcqCount,
}: {
  topicGroup: TopicGroup;
  mcqCount: number;
}) {
  const href = `/practice/${topicGroup.moduleId}?topic=${encodeURIComponent(topicGroup.name)}`;

  return (
    <Link
      href={href}
      className="hud-card hud-card-hover block rounded-xl p-5"
    >
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[#f2f8ff]">
          {topicGroup.name}
        </h3>
        <p className="text-sm text-[#8ca3c5]">{mcqCount} question{mcqCount !== 1 ? "s" : ""}</p>
      </div>
    </Link>
  );
}
