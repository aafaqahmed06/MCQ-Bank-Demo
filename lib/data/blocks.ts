import type { Block } from "@/types";

export const blocks: Block[] = [
  { id: "block-heme", name: "Haematology", year: 2 },
];

export function getBlockById(blockId: string) {
  return blocks.find((b) => b.id === blockId);
}
