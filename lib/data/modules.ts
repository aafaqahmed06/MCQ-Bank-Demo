import type { Module } from "@/types";

export const modules: Module[] = [
  { id: "sub-anatomy", blockId: "block-one", name: "Anatomy" },
  { id: "sub-physiology", blockId: "block-one", name: "Physiology" },
  { id: "sub-biochemistry", blockId: "block-one", name: "Biochemistry" },
  { id: "sub-minor", blockId: "block-one", name: "Minor Subjects" },
];

export function getModulesByBlockId(blockId: string): Module[] {
  return modules.filter((m) => m.blockId === blockId);
}

export function getModuleById(moduleId: string): Module | undefined {
  return modules.find((m) => m.id === moduleId);
}
