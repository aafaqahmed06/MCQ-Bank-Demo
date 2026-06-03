import Link from "next/link";
import { notFound } from "next/navigation";
import LayoutWrapper from "@/components/LayoutWrapper";
import PracticeSession from "@/components/PracticeSession";
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
      <div className="space-y-6">
        <div className="space-y-3">
          <Link
            href={backHref}
            className="text-sm text-cyan-300 hover:underline"
          >
            ← Back to {group ? "topics" : "subjects"}
          </Link>
          <h1 className="text-3xl font-bold text-[#f2f8ff]">{heading}</h1>
        </div>

        {moduleMcqs.length === 0 ? (
          <p className="hud-card rounded-xl border-dashed p-6 text-center text-[#8ca3c5]">
            No MCQs added for this topic yet
          </p>
        ) : (
          <PracticeSession
            questions={moduleMcqs}
            backHref={backHref}
          />
        )}
      </div>
    </LayoutWrapper>
  );
}
