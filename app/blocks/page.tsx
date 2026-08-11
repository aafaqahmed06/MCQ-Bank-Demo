import BlockCard from "@/components/BlockCard";
import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";
import { getBlocks } from "@/lib/curriculum";

export default async function BlocksPage() {
  const blocks = await getBlocks();

  return (
    <LayoutWrapper>
      <RequireProfile>
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-[var(--text-heading)]">Blocks</h1>
            <p className="text-[var(--text-muted)]">
              Choose a block to view its subjects.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {blocks.map((block) => (
              <li key={block.id}>
                <BlockCard block={block} />
              </li>
            ))}
          </ul>
        </div>
      </RequireProfile>
    </LayoutWrapper>
  );
}