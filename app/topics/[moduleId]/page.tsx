import Link from "next/link";
import { notFound } from "next/navigation";
import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";
import TopicGroupCard from "@/components/TopicGroupCard";
import { getModuleById } from "@/lib/data/modules";
import {
  getTopicGroupsByModuleId,
  getMcqsByTopicGroup,
} from "@/lib/data/topics";

type PageProps = {
  params: Promise<{ moduleId: string }>;
};

export default async function TopicsPage({ params }: PageProps) {
  const { moduleId } = await params;
  const mod = getModuleById(moduleId);

  if (!mod) {
    notFound();
  }

  const groups = getTopicGroupsByModuleId(moduleId);

  if (groups.length === 0) {
    return (
      <LayoutWrapper>
        <RequireProfile>
          <div className="space-y-6">
            <div className="space-y-3">
              <Link
                href={`/modules/${mod.blockId}`}
                className="text-sm text-cyan-300 hover:underline"
              >
                ← Back to subjects
              </Link>
              <h1 className="text-3xl font-bold text-[#f2f8ff]">{mod.name}</h1>
              <p className="text-[#8ca3c5]">Select a topic</p>
            </div>
            <p className="hud-card rounded-xl border-dashed p-6 text-center text-[#8ca3c5]">
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
              className="text-sm text-cyan-300 hover:underline"
            >
              ← Back to subjects
            </Link>
            <h1 className="text-3xl font-bold text-[#f2f8ff]">{mod.name}</h1>
            <p className="text-[#8ca3c5]">Select a topic</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {groups.map((group) => (
              <li key={group.id}>
                <TopicGroupCard
                  topicGroup={group}
                  mcqCount={getMcqsByTopicGroup(group).length}
                />
              </li>
            ))}
          </ul>
        </div>
      </RequireProfile>
    </LayoutWrapper>
  );
}
