import type { Block } from "@/types";

export const blocks: Block[] = [
  { id: "block-one", name: "Block One", year: 1 },
];

export function getBlockById(blockId: string) {
  return blocks.find((b) => b.id === blockId);
}
