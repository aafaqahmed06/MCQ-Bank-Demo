import Link from "next/link";
import { notFound } from "next/navigation";
import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";
import TopicGroupCard from "@/components/TopicGroupCard";
import {
  getTopicGroupsByModuleId,
} from "@/lib/topicGroups";
import { getModuleById } from "@/lib/curriculum";
import { getTopicGroupCounts } from "@/lib/curriculum";

type PageProps = {
  params: Promise<{ moduleId: string }>;
};

export default async function TopicsPage({ params }: PageProps) {
  const { moduleId } = await params;
  const mod = await getModuleById(moduleId);

  if (!mod) {
    notFound();
  }

  const groups = getTopicGroupsByModuleId(moduleId);
  const counts = await getTopicGroupCounts(moduleId, groups);

  if (groups.length === 0) {
    return (
      <LayoutWrapper>
        <RequireProfile>
          <div className="space-y-6">
            <div className="space-y-3">
              <Link
                href={`/modules/${mod.blockId}`}
                className="text-sm text-[var(--accent-cyan)] hover:underline"
              >
                ← Back to subjects
              </Link>
              <h1 className="text-3xl font-bold text-[var(--text-heading)]">{mod.name}</h1>
              <p className="text-[var(--text-muted)]">Select a topic</p>
            </div>
            <p className="hud-card rounded-xl border-dashed p-6 text-center text-[var(--text-muted)]">
              No topics available for this subject yet.
            </p>
          </div>
        </RequireProfile>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <RequireProfile>
        <div className="space-y-6">
          <div className="space-y-3">
            <Link
              href={`/modules/${mod.blockId}`}
              className="text-sm text-[var(--accent-cyan)] hover:underline"
            >
              ← Back to subjects
            </Link>
            <h1 className="text-3xl font-bold text-[var(--text-heading)]">{mod.name}</h1>
            <p className="text-[var(--text-muted)]">Select a topic</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {groups.map((group) => (
              <li key={group.id}>
                <TopicGroupCard
                  topicGroup={group}
                  mcqCount={counts[group.id] ?? 0}
                />
              </li>
            ))}
          </ul>
        </div>
      </RequireProfile>
    </LayoutWrapper>
  );
}
