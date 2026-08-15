import { notFound } from "next/navigation";
import LayoutWrapper from "@/components/LayoutWrapper";
import PracticeSession from "@/components/PracticeSession";
import RequireProfile from "@/components/RequireProfile";
import DkBot from "@/components/DkBot";
import { getModuleById, getBlockById } from "@/lib/curriculum";
import { getPracticeQuestions } from "@/lib/curriculum";
import { getCompletionTopicIds } from "@/lib/curriculum";
import {
  topicGroups,
} from "@/lib/topicGroups";
import Breadcrumbs from "@/components/Breadcrumbs";

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

  const moduleMcqs = await getPracticeQuestions(moduleId, group?.topics);
  const completionTopicIds = await getCompletionTopicIds(moduleId, group?.topics);

  const backHref = group
    ? `/topics/${moduleId}`
    : `/modules/${mod.blockId}`;

  const heading = group ? `${mod.name} — ${group.name}` : mod.name;

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
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-heading)]">{heading}</h1>
          </header>

          {moduleMcqs.length === 0 ? (
            <div className="hud-card rounded-xl border-dashed p-6 text-center">
              <div className="flex justify-center">
                <DkBot state="neutral" size="small" alt={null} />
              </div>
              <p className="mt-3 text-[var(--text-muted)]">
                No MCQs added for this topic yet
              </p>
            </div>
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
