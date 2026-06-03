import Link from "next/link";
import { notFound } from "next/navigation";
import LayoutWrapper from "@/components/LayoutWrapper";
import ModuleCard from "@/components/ModuleCard";
import { getBlockById } from "@/lib/data/blocks";
import { getModulesByBlockId } from "@/lib/data/modules";

type PageProps = {
  params: Promise<{ blockId: string }>;
};

export default async function ModulesPage({ params }: PageProps) {
  const { blockId } = await params;
  const block = getBlockById(blockId);

  if (!block) {
    notFound();
  }

  const blockModules = getModulesByBlockId(blockId);

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        <div className="space-y-3">
          <Link
            href="/blocks"
            className="text-sm text-cyan-300 hover:underline"
          >
            ← Back to blocks
          </Link>
          <h1 className="text-3xl font-bold text-[#f2f8ff]">{block.name}</h1>
          <p className="text-[#8ca3c5]">Year {block.year} · Select a module</p>
        </div>
        {blockModules.length === 0 ? (
          <p className="hud-card rounded-xl border-dashed p-6 text-center text-[#8ca3c5]">
            No modules available for this block yet.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {blockModules.map((mod) => (
              <li key={mod.id}>
                <ModuleCard module={mod} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </LayoutWrapper>
  );
}
