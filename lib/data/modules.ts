import type { Module } from "@/types";

export const modules: Module[] = [
  { id: "mod-heart-anatomy", blockId: "block-cv", name: "Heart Anatomy" },
  { id: "mod-heart-physiology", blockId: "block-cv", name: "Heart Physiology" },
  { id: "mod-ecg-basics", blockId: "block-cv", name: "ECG Basics" },
  { id: "mod-lung-anatomy", blockId: "block-resp", name: "Lung Anatomy" },
  { id: "mod-ventilation", blockId: "block-resp", name: "Ventilation & Gas Exchange" },
  { id: "mod-upper-git", blockId: "block-git", name: "Upper GI Tract" },
  { id: "mod-liver", blockId: "block-git", name: "Liver & Biliary System" },
  { id: "mod-nephron", blockId: "block-renal", name: "Nephron Structure" },
  { id: "mod-fluid-balance", blockId: "block-renal", name: "Fluid & Electrolyte Balance" },
  { id: "mod-brain-anatomy", blockId: "block-neuro", name: "Brain Anatomy" },
  { id: "mod-cranial-nerves", blockId: "block-neuro", name: "Cranial Nerves" },
  {
    id: "mod-coagulation-cascade",
    blockId: "block-heme",
    name: "Coagulation Cascade",
  },
  {
    id: "mod-wbc-granulocytes",
    blockId: "block-heme",
    name: "WBCs & Granulocytes",
  },
  {
    id: "mod-blood-composition-erythropoiesis",
    blockId: "block-heme",
    name: "Blood Composition & Erythropoiesis",
  },
];

export function getModulesByBlockId(blockId: string): Module[] {
  return modules.filter((m) => m.blockId === blockId);
}

export function getModuleById(moduleId: string): Module | undefined {
  return modules.find((m) => m.id === moduleId);
}
