import { notFound } from "next/navigation";
import LayoutWrapper from "@/components/LayoutWrapper";
import ModuleCard from "@/components/ModuleCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import RequireProfile from "@/components/RequireProfile";
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
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-heading)]">
              {block.name}
            </h1>
            <p className="text-[var(--text-muted)]">
              Year {block.year} · Select a subject
            </p>
          </header>
          {blockModules.length === 0 ? (
            <p className="hud-card rounded-xl border-dashed p-6 text-center text-[var(--text-muted)]">
              No subjects available for this block yet.
            </p>
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