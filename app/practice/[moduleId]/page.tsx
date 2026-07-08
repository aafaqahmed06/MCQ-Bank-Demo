import Link from "next/link";
import { notFound } from "next/navigation";
import LayoutWrapper from "@/components/LayoutWrapper";
import PracticeSession from "@/components/PracticeSession";
import RequireProfile from "@/components/RequireProfile";
import { getModuleById } from "@/lib/data/modules";
import {
  getMcqsByModuleId,
  getMcqsByTopicGroup,
  topicGroups,
} from "@/lib/data/topics";

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
  const mod = getModuleById(moduleId);

  if (!mod) {
    notFound();
  }

  const group = topic
    ? topicGroups.find((g) => g.moduleId === moduleId && g.name === topic) ?? null
    : null;

  const moduleMcqs = group
    ? getMcqsByTopicGroup(group)
    : getMcqsByModuleId(moduleId);

  const backHref = group
    ? `/topics/${moduleId}`
    : `/modules/${mod.blockId}`;

  const heading = group ? `${mod.name} — ${group.name}` : mod.name;

  return (
    <LayoutWrapper>
      <RequireProfile>
        <div className="space-y-6">
          <div className="space-y-3">
            <Link
              href={backHref}
              className="text-sm text-[var(--accent-cyan)] hover:underline"
            >
              ← Back to {group ? "topics" : "subjects"}
            </Link>
            <h1 className="text-3xl font-bold text-[var(--text-heading)]">{heading}</h1>
          </div>

          {moduleMcqs.length === 0 ? (
            <p className="hud-card rounded-xl border-dashed p-6 text-center text-[var(--text-muted)]">
              No MCQs added for this topic yet
            </p>
          ) : (
            <PracticeSession
              questions={moduleMcqs}
              backHref={backHref}
            />
          )}
        </div>
      </RequireProfile>
    </LayoutWrapper>
  );
}
