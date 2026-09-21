import { Map } from "lucide-react";
import BlockCard from "@/components/BlockCard";
import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";
import { TopicHealthOverview } from "@/components/TopicHealthOverview";
import { EmptyState } from "@/components/ui";
import { getBlocks, getAllModulesWithProgress } from "@/lib/curriculum";

export default async function BlocksPage() {
  const [blocks, subjects] = await Promise.all([getBlocks(), getAllModulesWithProgress()]);

  return (
    <LayoutWrapper>
      <RequireProfile>
        <div className="space-y-8">
          <header className="space-y-1.5">
            <h1 className="text-h1 font-bold tracking-tight text-text-primary">Blocks</h1>
            <p className="text-text-tertiary">Choose a block to view its subjects.</p>
          </header>

          <TopicHealthOverview subjects={subjects} />

          {blocks.length === 0 ? (
            <EmptyState
              icon={Map}
              title="No curriculum available yet"
              description="Check back once your curriculum has been set up."
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {blocks.map((block) => (
                <li key={block.id}>
                  <BlockCard block={block} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </RequireProfile>
    </LayoutWrapper>
  );
}
