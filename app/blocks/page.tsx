import BlockCard from "@/components/BlockCard";
import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";
import DkBot from "@/components/DkBot";
import { getBlocks } from "@/lib/curriculum";

export default async function BlocksPage() {
  const blocks = await getBlocks();

  return (
    <LayoutWrapper>
      <RequireProfile>
        <div className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-heading)]">
              Blocks
            </h1>
            <p className="text-[var(--text-muted)]">
              Choose a block to view its subjects.
            </p>
          </header>
          {blocks.length === 0 ? (
            <div className="hud-card rounded-xl border-dashed p-6 text-center">
              <div className="flex justify-center">
                <DkBot state="neutral" size="small" alt={null} />
              </div>
              <p className="mt-3 text-[var(--text-muted)]">
                No curriculum available yet.
              </p>
            </div>
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