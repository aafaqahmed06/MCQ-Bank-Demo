import { notFound } from "next/navigation";
import LayoutWrapper from "@/components/LayoutWrapper";
import PracticeSession from "@/components/PracticeSession";
import RequireProfile from "@/components/RequireProfile";
import DkBot from "@/components/DkBot";
import { getModuleById, getBlockById } from "@/lib/curriculum";
import { getWeightedPracticeQuestions } from "@/lib/practiceRanking";
import { getCompletionTopicIds } from "@/lib/curriculum";
import {
  topicGroups,
} from "@/lib/topicGroups";
import Breadcrumbs from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/ui";

type PageProps = {
  params: Promise<{ moduleId: string }>;
  searchParams: Promise<{ topic?: string }>;
};

export default async function PracticePage({
  params,
  searchParams,
}: PageProps) {
  const { moduleId } = await params;
  const { topic } = await searchParams;
  const mod = await getModuleById(moduleId);

  if (!mod) {
    notFound();
  }

  const block = await getBlockById(mod.blockId);

  const group = topic
    ? topicGroups.find((g) => g.moduleId === moduleId && g.name === topic) ?? null
    : null;

  const { questions: moduleMcqs } = await getWeightedPracticeQuestions(moduleId, group?.topics);
  const completionTopicIds = await getCompletionTopicIds(moduleId, group?.topics);

  const backHref = group
    ? `/topics/${moduleId}`
    : `/modules/${mod.blockId}`;

  const crumbs = [
    { label: "Blocks", href: "/blocks" },
    ...(block ? [{ label: block.name, href: `/modules/${block.id}` }] : []),
    { label: mod.name, href: `/topics/${mod.id}` },
    ...(group ? [{ label: group.name }] : [{ label: "Practice" }]),
  ];

  return (
    <LayoutWrapper>
      <RequireProfile>
        <div className="space-y-6">
          <header className="space-y-2">
            <Breadcrumbs items={crumbs} />
            <p className="text-h3 font-semibold tracking-wide text-text-secondary uppercase">
              {mod.name}
              {group ? ` · ${group.name}` : ""}
            </p>
          </header>

          {moduleMcqs.length === 0 ? (
            <EmptyState
              illustration={<DkBot state="neutral" size="small" alt={null} />}
              title="No questions yet"
              description="This topic doesn't have any MCQs added yet."
            />
          ) : (
            <PracticeSession
              questions={moduleMcqs}
              backHref={backHref}
              completionModuleId={moduleId}
              completionTopicIds={completionTopicIds}
            />
          )}
        </div>
      </RequireProfile>
    </LayoutWrapper>
  );
}
