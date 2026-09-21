import { notFound } from "next/navigation";
import { ListChecks } from "lucide-react";
import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";
import TopicGroupCard from "@/components/TopicGroupCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/ui";
import {
  getTopicGroupsByModuleId,
} from "@/lib/topicGroups";
import { getModuleById, getBlockById } from "@/lib/curriculum";
import { getTopicGroupCounts } from "@/lib/curriculum";
import { getTopicGroupCompletion } from "@/lib/curriculum";
import { getTopicGroupHealth } from "@/lib/curriculum";

type PageProps = {
  params: Promise<{ moduleId: string }>;
};

export default async function TopicsPage({ params }: PageProps) {
  const { moduleId } = await params;
  const mod = await getModuleById(moduleId);

  if (!mod) {
    notFound();
  }

  const block = await getBlockById(mod.blockId);

  const groups = getTopicGroupsByModuleId(moduleId);
  const [counts, completion, health] = await Promise.all([
    getTopicGroupCounts(moduleId, groups),
    getTopicGroupCompletion(moduleId, groups),
    getTopicGroupHealth(moduleId, groups),
  ]);

  const crumbs = [
    { label: "Blocks", href: "/blocks" },
    ...(block ? [{ label: block.name, href: `/modules/${block.id}` }] : []),
    { label: mod.name },
  ];

  const header = (
    <header className="space-y-2">
      <Breadcrumbs items={crumbs} />
      <h1 className="text-h1 font-bold tracking-tight text-text-primary">{mod.name}</h1>
      <p className="text-text-tertiary">Select a topic</p>
    </header>
  );

  if (groups.length === 0) {
    return (
      <LayoutWrapper>
        <RequireProfile>
          <div className="space-y-6">
            {header}
            <EmptyState
              icon={ListChecks}
              title="No topics available yet"
              description="This subject doesn't have any topics set up yet."
            />
          </div>
        </RequireProfile>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <RequireProfile>
        <div className="space-y-6">
          {header}
          <ul className="grid gap-4 sm:grid-cols-2">
            {groups.map((group) => (
              <li key={group.id}>
                <TopicGroupCard
                  topicGroup={group}
                  mcqCount={counts[group.id] ?? 0}
                  completedTopics={completion[group.id]?.completedTopics ?? 0}
                  totalTopics={completion[group.id]?.totalTopics ?? 0}
                  weakTopicCount={health[group.id]?.weakTopicCount ?? 0}
                  lastActivityAt={health[group.id]?.lastActivityAt ?? null}
                />
              </li>
            ))}
          </ul>
        </div>
      </RequireProfile>
    </LayoutWrapper>
  );
}
