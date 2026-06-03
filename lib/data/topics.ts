import type { MCQ, TopicGroup } from "@/types";
import { mcqs } from "./mcqs";

export const topicGroups: TopicGroup[] = [
  // ── Physiology ──
  {
    id: "sub-physiology-coagulation",
    moduleId: "sub-physiology",
    name: "Coagulation Cascade",
    topics: [
      "Coagulation Cascade",
      "Coagulation Cascade - Extrinsic Pathway",
      "Coagulation Cascade - Intrinsic Pathway",
      "Coagulation Cascade - Common Pathway",
      "Thrombin - Actions",
      "Fibrin Clot Formation",
      "Clot Retraction",
      "Fate of a Thrombus",
      "Fibrinolysis",
      "Positive Feedback in Coagulation",
      "Coagulation Factors",
      "Vitamin K and Coagulation",
      "Coagulation Disorders - Hemophilia",
      "Coagulation Disorders - Hemophilia B",
      "Von Willebrand Disease",
    ],
  },
  {
    id: "sub-physiology-wbc",
    moduleId: "sub-physiology",
    name: "WBCs & Granulocytes",
    topics: [
      "Leukocytes - Overview",
      "WBC Differential Count",
      "Neutrophils - Structure",
      "Neutrophil Migration - Diapedesis",
      "Neutrophil Killing Mechanisms",
      "NETosis",
      "Neutrophilia",
      "Basophils - Structure",
      "Basophils - Allergic Reaction",
      "Eosinophils - Structure",
      "Eosinophils - Anti-Parasitic Function",
      "Eosinophils - Moderating Allergic Reactions",
      "Eosinophilia",
      "Lymphocytes",
    ],
  },
  {
    id: "sub-physiology-blood",
    moduleId: "sub-physiology",
    name: "Blood & Erythropoiesis",
    topics: [
      "Blood Composition",
      "Plasma vs Serum",
      "Plasma Proteins",
      "RBC Structure",
      "Haematocrit and RBC Indices",
      "Haematopoiesis",
      "Haematopoiesis - Fetal",
      "Erythropoietin (EPO)",
      "EPO in Renal Failure",
      "Nutritional Factors - Vitamin B12 and Folate",
      "Polycythaemia",
    ],
  },

  // ── Anatomy ──
  {
    id: "sub-anatomy-gametogenesis",
    moduleId: "sub-anatomy",
    name: "Gametogenesis & Chromosomal Aberrations",
    topics: ["Embryology - Gametogenesis & Chromosomal Aberrations"],
  },
  {
    id: "sub-anatomy-spermatogenesis",
    moduleId: "sub-anatomy",
    name: "Spermatogenesis & Oogenesis",
    topics: ["Embryology - Spermatogenesis & Oogenesis"],
  },
  {
    id: "sub-anatomy-fertilization",
    moduleId: "sub-anatomy",
    name: "Fertilization & Implantation",
    topics: ["Embryology - Fertilization & Implantation"],
  },
  {
    id: "sub-anatomy-placentation",
    moduleId: "sub-anatomy",
    name: "Second Week & Placentation",
    topics: ["Embryology - Second Week & Placentation"],
  },
  {
    id: "sub-anatomy-cord",
    moduleId: "sub-anatomy",
    name: "Umbilical Cord, Allantois & Yolk Sac",
    topics: ["Embryology - Umbilical Cord, Allantois, Yolk Sac"],
  },
  {
    id: "sub-anatomy-hematopoiesis",
    moduleId: "sub-anatomy",
    name: "Thymus, Spleen & Hematopoiesis",
    topics: ["Embryology - Thymus, Spleen, Hematopoiesis"],
  },
  {
    id: "sub-anatomy-clinical-embryo",
    moduleId: "sub-anatomy",
    name: "Clinical Embryology",
    topics: ["Embryology - Clinical Embryology"],
  },
  {
    id: "sub-anatomy-spleen",
    moduleId: "sub-anatomy",
    name: "Spleen",
    topics: ["Gross Anatomy - Spleen"],
  },
  {
    id: "sub-anatomy-tonsils",
    moduleId: "sub-anatomy",
    name: "Palatine Tonsils & Waldeyer's Ring",
    topics: ["Gross Anatomy - Palatine Tonsils & Waldeyer's Ring"],
  },
  {
    id: "sub-anatomy-general",
    moduleId: "sub-anatomy",
    name: "General Anatomy",
    topics: ["General Anatomy - Terms, Bones, Joints, Muscles"],
  },
  {
    id: "sub-anatomy-histology-epithelium",
    moduleId: "sub-anatomy",
    name: "Histology — Basic Tissues & Epithelium",
    topics: ["Histology - Basic Tissues & Epithelium"],
  },
  {
    id: "sub-anatomy-histology-junctions",
    moduleId: "sub-anatomy",
    name: "Histology — Cell Junctions & Glands",
    topics: ["Histology - Cell Junctions & Glands"],
  },
  {
    id: "sub-anatomy-histology-lymphoid",
    moduleId: "sub-anatomy",
    name: "Histology — Lymphoid Organs",
    topics: ["Histology - Lymphoid Organs"],
  },
];

export function getTopicGroupsByModuleId(moduleId: string): TopicGroup[] {
  return topicGroups.filter((tg) => tg.moduleId === moduleId);
}

export function getMcqsByModuleIdAndTopic(
  moduleId: string,
  topic: string,
): MCQ[] {
  return mcqs.filter(
    (mcq) => mcq.moduleId === moduleId && mcq.topic === topic,
  );
}

export function getMcqsByModuleId(moduleId: string): MCQ[] {
  return mcqs.filter((mcq) => mcq.moduleId === moduleId);
}

export function getMcqsByTopicGroup(group: TopicGroup): MCQ[] {
  return mcqs.filter(
    (mcq) =>
      mcq.moduleId === group.moduleId && group.topics.includes(mcq.topic),
  );
}
