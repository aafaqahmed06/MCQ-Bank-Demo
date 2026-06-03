import BlockCard from "@/components/BlockCard";
import LayoutWrapper from "@/components/LayoutWrapper";
import { blocks } from "@/lib/data/blocks";

export default function BlocksPage() {
  return (
    <LayoutWrapper>
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-[#f2f8ff]">Blocks</h1>
          <p className="text-[#8ca3c5]">
            Choose a block to view its modules.
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
    </LayoutWrapper>
  );
}
