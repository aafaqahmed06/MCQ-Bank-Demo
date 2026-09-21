import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import LayoutWrapper from "@/components/LayoutWrapper";
import ModuleCard from "@/components/ModuleCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import RequireProfile from "@/components/RequireProfile";
import { EmptyState } from "@/components/ui";
import { getBlockById } from "@/lib/curriculum";
import { getModulesByBlockId } from "@/lib/curriculum";

type PageProps = {
  params: Promise<{ blockId: string }>;
};

export default async function ModulesPage({ params }: PageProps) {
  const { blockId } = await params;
  const block = await getBlockById(blockId);

  if (!block) {
    notFound();
  }

  const blockModules = await getModulesByBlockId(blockId);

  return (
    <LayoutWrapper>
      <RequireProfile>
        <div className="space-y-6">
          <header className="space-y-2">
            <Breadcrumbs items={[{ label: "Blocks", href: "/blocks" }, { label: block.name }]} />
            <h1 className="text-h1 font-bold tracking-tight text-text-primary">{block.name}</h1>
            <p className="text-text-tertiary">Year {block.year} · Select a subject</p>
          </header>
          {blockModules.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No subjects available yet"
              description="This block doesn't have any subjects set up yet."
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {blockModules.map((mod) => (
                <li key={mod.id}>
                  <ModuleCard module={mod} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </RequireProfile>
    </LayoutWrapper>
  );
}
