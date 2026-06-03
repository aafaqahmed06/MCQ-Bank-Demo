import Link from "next/link";
import { notFound } from "next/navigation";
import LayoutWrapper from "@/components/LayoutWrapper";
import PracticeSession from "@/components/PracticeSession";
import { getModuleById } from "@/lib/data/modules";
import { getMcqsByModuleId } from "@/lib/data/mcqs";

type PageProps = {
  params: Promise<{ moduleId: string }>;
};

export default async function PracticePage({ params }: PageProps) {
  const { moduleId } = await params;
  const mod = getModuleById(moduleId);

  if (!mod) {
    notFound();
  }

  const moduleMcqs = getMcqsByModuleId(moduleId);

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        <div className="space-y-3">
          <Link
            href={`/modules/${mod.blockId}`}
            className="text-sm text-cyan-300 hover:underline"
          >
            ← Back to modules
          </Link>
          <h1 className="text-3xl font-bold text-[#f2f8ff]">{mod.name}</h1>
        </div>

        {moduleMcqs.length === 0 ? (
          <p className="hud-card rounded-xl border-dashed p-6 text-center text-[#8ca3c5]">
            No MCQs added for this module yet
          </p>
        ) : (
          <PracticeSession
            questions={moduleMcqs}
            backHref={`/modules/${mod.blockId}`}
          />
        )}
      </div>
    </LayoutWrapper>
  );
}
