import type { MCQ } from "@/types";

export const mcqs: MCQ[] = [
  {
    id: "heme_coag_001",
    blockId: "block-heme",
    moduleId: "mod-coagulation-cascade",
    topic: "Coagulation Cascade",
    question: "Which sequence correctly describes hemostasis?",
    options: [
      "Blood clot formation -> platelet plug -> vascular constriction -> fibrous dissolution",
      "Vascular constriction -> platelet plug formation -> blood clot formation -> fibrous organization",
      "Platelet plug -> vascular constriction -> fibrous organization -> blood clot formation",
      "Blood clot formation -> vascular constriction -> platelet plug -> fibrous organization",
      "Fibrous organization -> blood clot -> platelet plug -> vascular constriction",
    ],
    correctAnswer: 1,
    explanation:
      "Hemostasis proceeds in order: vascular constriction, platelet plug formation, blood clot formation, then fibrous organization or dissolution.",
    difficulty: 1,
  },
  {
    id: "heme_coag_002",
    blockId: "block-heme",
    moduleId: "mod-coagulation-cascade",
    topic: "Coagulation Cascade - Extrinsic Pathway",
    question:
      "Tissue factor (Factor III) combines with which factor to initiate the extrinsic pathway?",
    options: ["Factor IX", "Factor XII", "Factor VII", "Factor X", "Factor V"],
    correctAnswer: 2,
    explanation:
      "Tissue factor forms a complex with Factor VII (and Ca2+) to activate Factor X and initiate the extrinsic pathway.",
    difficulty: 2,
  },
  {
    id: "heme_coag_003",
    blockId: "block-heme",
    moduleId: "mod-coagulation-cascade",
    topic: "Coagulation Cascade - Intrinsic Pathway",
    question:
      "Blood clots in a glass tube after several minutes. Which factor initiates this intrinsic pathway process?",
    options: [
      "Factor VII (Stable Factor)",
      "Factor III (Tissue Factor)",
      "Factor II (Prothrombin)",
      "Factor XII (Hageman Factor)",
      "Factor XIII (Fibrin Stabilizing Factor)",
    ],
    correctAnswer: 3,
    explanation:
      "Contact with a foreign surface activates Factor XII, initiating the intrinsic pathway.",
    difficulty: 2,
  },
  {
    id: "heme_coag_004",
    blockId: "block-heme",
    moduleId: "mod-coagulation-cascade",
    topic: "Coagulation Cascade - Common Pathway",
    question:
      "Extrinsic and intrinsic pathways converge at activation of which factor?",
    options: ["Factor VIII", "Factor IX", "Factor X", "Factor XI", "Factor XII"],
    correctAnswer: 2,
    explanation:
      "Both pathways converge on Factor X, whose active form contributes to prothrombin activator formation.",
    difficulty: 2,
  },
  {
    id: "heme_coag_005",
    blockId: "block-heme",
    moduleId: "mod-coagulation-cascade",
    topic: "Thrombin - Actions",
    question: "Which is NOT a direct action of thrombin?",
    options: [
      "Converting fibrinogen to fibrin monomers",
      "Activating Factor XIII",
      "Activating Factor V",
      "Initiating intrinsic pathway by activating Factor XII",
      "Enhancing platelet aggregation",
    ],
    correctAnswer: 3,
    explanation:
      "Factor XII is classically activated by contact activation, not initiated by thrombin.",
    difficulty: 3,
  },
  {
    id: "heme_coag_006",
    blockId: "block-heme",
    moduleId: "mod-coagulation-cascade",
    topic: "Fibrin Clot Formation",
    question:
      "What fragments are removed from fibrinogen to produce fibrin monomers?",
    options: [
      "Fibrin A and Fibrin B",
      "Fibrinopeptides A and B",
      "Fibrinogen Fragments X and Y",
      "D-dimers and E-fragments",
      "HMW Kininogen and Prekallikrein",
    ],
    correctAnswer: 1,
    explanation:
      "Thrombin cleaves off fibrinopeptides A and B from fibrinogen, creating fibrin monomers.",
    difficulty: 2,
  },
  {
    id: "heme_coag_007",
    blockId: "block-heme",
    moduleId: "mod-coagulation-cascade",
    topic: "Clot Retraction",
    question: "Which platelet proteins are responsible for clot retraction?",
    options: [
      "Peroxidases, hydrolytic enzymes, and defensins",
      "Actin, myosin, and thrombosthenin",
      "Histamine, bradykinin, and serotonin",
      "Factor V, Factor X, and calcium ions",
      "Albumin, globulins, and fibrinogen",
    ],
    correctAnswer: 1,
    explanation:
      "Platelet contractile proteins (actin, myosin, thrombosthenin) pull fibrin threads and retract the clot.",
    difficulty: 2,
  },
  {
    id: "heme_coag_008",
    blockId: "block-heme",
    moduleId: "mod-coagulation-cascade",
    topic: "Fate of a Thrombus",
    question:
      "A fragment of DVT breaks off and travels to lungs. This process is called:",
    options: [
      "Propagation",
      "Fibrinolysis",
      "Embolization",
      "Organization and recanalization",
      "Dissolution",
    ],
    correctAnswer: 2,
    explanation:
      "When a thrombus fragment detaches and travels in blood, it is embolization.",
    difficulty: 1,
  },
  {
    id: "heme_coag_009",
    blockId: "block-heme",
    moduleId: "mod-coagulation-cascade",
    topic: "Coagulation Factors",
    question:
      "In the mnemonic 'From Pakistan The Cat...', what factor does 'Pakistan' represent?",
    options: [
      "Factor I - Fibrinogen",
      "Factor II - Prothrombin",
      "Factor III - Tissue Factor",
      "Factor IV - Calcium ions",
      "Factor V - Labile Factor",
    ],
    correctAnswer: 1,
    explanation:
      "'Pakistan' corresponds to Factor II, which is Prothrombin.",
    difficulty: 2,
  },
  {
    id: "heme_coag_010",
    blockId: "block-heme",
    moduleId: "mod-coagulation-cascade",
    topic: "Coagulation Disorders - Hemophilia",
    question:
      "Boy with recurrent hemarthroses has high PTT and normal PT. Most likely deficient factor?",
    options: [
      "Factor VII - Stable Factor",
      "Factor VIII - Anti-hemophilic Factor",
      "Factor XIII - Fibrin Stabilizing Factor",
      "Factor III - Tissue Factor",
      "Factor II - Prothrombin",
    ],
    correctAnswer: 1,
    explanation:
      "This pattern is classic Hemophilia A due to Factor VIII deficiency (intrinsic pathway).",
    difficulty: 2,
  },
  {
    id: "heme_coag_011",
    blockId: "block-heme",
    moduleId: "mod-coagulation-cascade",
    topic: "Coagulation Disorders - Hemophilia B",
    question: "A defect in Christmas Factor indicates deficiency of:",
    options: ["Factor VIII", "Factor IX", "Factor X", "Factor XI", "Factor XII"],
    correctAnswer: 1,
    explanation: "Hemophilia B is due to Factor IX deficiency.",
    difficulty: 2,
  },
  {
    id: "heme_coag_012",
    blockId: "block-heme",
    moduleId: "mod-coagulation-cascade",
    topic: "Vitamin K and Coagulation",
    question: "Vitamin K deficiency mainly reduces which coagulation factors?",
    options: [
      "Factors I, VIII, IX, X",
      "Factors II, VII, IX, X",
      "Factors V, VIII, XI, XII",
      "Factors I, III, IV, VIII",
      "Factors VII, VIII, XI, XII",
    ],
    correctAnswer: 1,
    explanation:
      "Vitamin K is required for synthesis of Factors II, VII, IX, and X.",
    difficulty: 2,
  },
  {
    id: "heme_coag_013",
    blockId: "block-heme",
    moduleId: "mod-coagulation-cascade",
    topic: "Von Willebrand Disease",
    question:
      "Heavy menstrual bleeding with prolonged bleeding time, normal PT, borderline PTT, mild low factor VIII suggests:",
    options: [
      "Hemophilia A",
      "Hemophilia B",
      "Von Willebrand Disease",
      "Vitamin K Deficiency",
      "Hemophilia C",
    ],
    correctAnswer: 2,
    explanation:
      "vWD causes platelet adhesion defects and reduced stabilization of Factor VIII, giving this lab pattern.",
    difficulty: 3,
  },
  {
    id: "heme_coag_014",
    blockId: "block-heme",
    moduleId: "mod-coagulation-cascade",
    topic: "Positive Feedback in Coagulation",
    question:
      "How does thrombin positively feedback to accelerate its own production?",
    options: [
      "Activates plasmin",
      "Activates Factor V needed for prothrombin activator",
      "Inhibits Factor XII",
      "Converts prothrombin to tissue factor",
      "Activates Protein C to destroy Factor V",
    ],
    correctAnswer: 1,
    explanation:
      "Thrombin activates Factor V, enhancing prothrombin activator formation and amplifying thrombin generation.",
    difficulty: 3,
  },
  {
    id: "heme_coag_015",
    blockId: "block-heme",
    moduleId: "mod-coagulation-cascade",
    topic: "Fibrinolysis",
    question: "Which enzyme primarily breaks down the fibrin mesh?",
    options: ["Thrombin", "Plasmin", "Factor XIIIa", "Prekallikrein", "Tissue Factor"],
    correctAnswer: 1,
    explanation: "Plasmin is the key fibrinolytic enzyme that degrades fibrin.",
    difficulty: 1,
  },
  {
    id: "heme_wbc_016",
    blockId: "block-heme",
    moduleId: "mod-wbc-granulocytes",
    topic: "Leukocytes - Overview",
    question:
      "Which shared feature distinguishes all leukocytes from mature RBCs?",
    options: [
      "They are anucleate",
      "They are nucleated",
      "They are produced exclusively in spleen",
      "They carry oxygen via hemoglobin",
      "They have a 120-day lifespan",
    ],
    correctAnswer: 1,
    explanation:
      "All leukocytes are nucleated, unlike mature RBCs which are anucleate.",
    difficulty: 1,
  },
  {
    id: "heme_wbc_017",
    blockId: "block-heme",
    moduleId: "mod-wbc-granulocytes",
    topic: "WBC Differential Count",
    question:
      "Descending order of WBC percentage by mnemonic 'Never Let Monkeys Eat Bananas' is:",
    options: [
      "Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils",
      "Lymphocytes, Neutrophils, Monocytes, Basophils, Eosinophils",
      "Neutrophils, Eosinophils, Monocytes, Lymphocytes, Basophils",
      "Monocytes, Neutrophils, Lymphocytes, Eosinophils, Basophils",
      "Neutrophils, Lymphocytes, Basophils, Eosinophils, Monocytes",
    ],
    correctAnswer: 0,
    explanation:
      "Normal descending differential is Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils.",
    difficulty: 2,
  },
  {
    id: "heme_wbc_018",
    blockId: "block-heme",
    moduleId: "mod-wbc-granulocytes",
    topic: "Haematopoiesis",
    question: "The common precursor for all blood cells is:",
    options: [
      "Myeloid stem cell",
      "Lymphoid stem cell",
      "Reticuloendothelial cell",
      "Undifferentiated pluripotent stem cell",
      "CFU-E",
    ],
    correctAnswer: 3,
    explanation:
      "All blood lineages originate from undifferentiated pluripotent hematopoietic stem cells.",
    difficulty: 2,
  },
  {
    id: "heme_wbc_019",
    blockId: "block-heme",
    moduleId: "mod-wbc-granulocytes",
    topic: "Neutrophils - Structure",
    question:
      "Cell with 2-5 lobed nucleus and fine neutral-staining granules is:",
    options: ["Eosinophil", "Basophil", "Lymphocyte", "Neutrophil", "Monocyte"],
    correctAnswer: 3,
    explanation:
      "Neutrophils have multilobed nuclei and granules staining with both acidic and basic dyes.",
    difficulty: 1,
  },
  {
    id: "heme_wbc_020",
    blockId: "block-heme",
    moduleId: "mod-wbc-granulocytes",
    topic: "Neutrophil Migration - Diapedesis",
    question:
      "After margination and firm adhesion to endothelium, the next step is:",
    options: ["Chemotaxis", "Phagocytosis", "Diapedesis", "Amoeboid movement", "Degranulation"],
    correctAnswer: 2,
    explanation:
      "Diapedesis is the step where neutrophils pass between endothelial cells into tissues.",
    difficulty: 2,
  },
  {
    id: "heme_wbc_021",
    blockId: "block-heme",
    moduleId: "mod-wbc-granulocytes",
    topic: "Neutrophil Killing Mechanisms",
    question:
      "In phagolysosomes, bacteria are mainly destroyed by:",
    options: [
      "Histamine, bradykinin, serotonin",
      "Major Basic Protein and peroxidases",
      "Lysosomal enzymes and reactive oxygen species",
      "IgE and complement",
      "Fibrinogen and thrombin",
    ],
    correctAnswer: 2,
    explanation:
      "Neutrophils kill engulfed bacteria using lysosomal enzymes plus reactive oxygen species.",
    difficulty: 2,
  },
  {
    id: "heme_wbc_022",
    blockId: "block-heme",
    moduleId: "mod-wbc-granulocytes",
    topic: "NETosis",
    question: "Release of DNA nets from dying neutrophils is called:",
    options: ["Phagocytosis", "Degranulation", "Chemotaxis", "NETosis", "Opsonization"],
    correctAnswer: 3,
    explanation:
      "NETosis forms neutrophil extracellular traps that trap and kill microbes.",
    difficulty: 1,
  },
  {
    id: "heme_wbc_023",
    blockId: "block-heme",
    moduleId: "mod-wbc-granulocytes",
    topic: "Neutrophilia",
    question: "Most likely cause of marked neutrophilia in infected abscess:",
    options: [
      "Allergic reaction",
      "Acute bacterial infection",
      "Parasitic infestation",
      "Bone marrow aplasia",
      "Steroid therapy",
    ],
    correctAnswer: 1,
    explanation:
      "Acute bacterial infections classically cause neutrophilia.",
    difficulty: 1,
  },
  {
    id: "heme_wbc_024",
    blockId: "block-heme",
    moduleId: "mod-wbc-granulocytes",
    topic: "Basophils - Structure",
    question:
      "Cell with deep blue-purple granules obscuring nucleus, 0.5-1% of WBCs is:",
    options: ["Eosinophil", "Neutrophil", "Lymphocyte", "Basophil", "Monocyte"],
    correctAnswer: 3,
    explanation:
      "Basophils are rare granulocytes with coarse deep basophilic granules.",
    difficulty: 1,
  },
  {
    id: "heme_wbc_025",
    blockId: "block-heme",
    moduleId: "mod-wbc-granulocytes",
    topic: "Basophils - Allergic Reaction",
    question:
      "Basophil mediator causing prolonged bronchoconstriction and key in asthma is:",
    options: [
      "Histamine",
      "Bradykinin",
      "Serotonin",
      "Slow Reacting Substance of Anaphylaxis (leukotrienes)",
      "Heparin",
    ],
    correctAnswer: 3,
    explanation:
      "Leukotrienes (SRS-A) cause sustained bronchoconstriction and are central in asthma pathophysiology.",
    difficulty: 2,
  },
  {
    id: "heme_wbc_026",
    blockId: "block-heme",
    moduleId: "mod-wbc-granulocytes",
    topic: "Eosinophils - Structure",
    question: "Correct eosinophil description is:",
    options: [
      "60-70% WBCs, 2-5 lobed nucleus, neutral granules",
      "1-4% WBCs, 2-3 lobed nucleus, bright red/orange granules",
      "0.5-1% WBCs, obscured nucleus, deep blue-purple granules",
      "25-33% WBCs, large spherical nucleus, thin cytoplasmic rim",
      "2-6% WBCs, kidney-shaped nucleus, no visible granules",
    ],
    correctAnswer: 1,
    explanation:
      "Eosinophils are 1-4% of WBCs and have bilobed nuclei with prominent eosinophilic granules.",
    difficulty: 2,
  },
  {
    id: "heme_wbc_027",
    blockId: "block-heme",
    moduleId: "mod-wbc-granulocytes",
    topic: "Eosinophils - Anti-Parasitic Function",
    question: "How do eosinophils kill parasites too large to phagocytose?",
    options: [
      "Release IgE antibodies",
      "Engulf using diapedesis",
      "Attach to parasite and release granules extracellularly",
      "Activate complement to lyse parasite",
      "Release histamine",
    ],
    correctAnswer: 2,
    explanation:
      "Eosinophils bind helminths and release cytotoxic granules (including MBP) extracellularly.",
    difficulty: 2,
  },
  {
    id: "heme_wbc_028",
    blockId: "block-heme",
    moduleId: "mod-wbc-granulocytes",
    topic: "Eosinophils - Moderating Allergic Reactions",
    question:
      "Why are eosinophils recruited to allergic sites by eosinophilic chemotactic factor?",
    options: [
      "Amplify reaction by releasing histamine",
      "Produce more IgE antibodies",
      "Detoxify inflammatory mediators and phagocytize immune complexes",
      "Initiate coagulation",
      "Release heparin",
    ],
    correctAnswer: 2,
    explanation:
      "Eosinophils help limit allergic inflammation by detoxifying mediators and clearing antigen-antibody complexes.",
    difficulty: 3,
  },
  {
    id: "heme_wbc_029",
    blockId: "block-heme",
    moduleId: "mod-wbc-granulocytes",
    topic: "Eosinophilia",
    question:
      "Child with wheeze and eosinophils 8% most likely has:",
    options: [
      "Acute bacterial pneumonia",
      "Viral encephalitis",
      "Asthma or allergic disease",
      "Neutropenic fever",
      "Aplastic anaemia",
    ],
    correctAnswer: 2,
    explanation:
      "Eosinophilia with recurrent wheeze strongly suggests allergy/asthma.",
    difficulty: 1,
  },
  {
    id: "heme_wbc_030",
    blockId: "block-heme",
    moduleId: "mod-wbc-granulocytes",
    topic: "Lymphocytes",
    question:
      "Primary roles of B and T lymphocytes are:",
    options: [
      "B kill parasites; T produce histamine",
      "B make antibodies; T kill infected cells and coordinate immunity",
      "B phagocytize bacteria; T release lysosomal enzymes",
      "B release heparin; T activate basophils",
      "B start coagulation; T produce erythropoietin",
    ],
    correctAnswer: 1,
    explanation:
      "B cells mediate humoral immunity via antibodies; T cells mediate cell-mediated immunity and coordination.",
    difficulty: 1,
  },
  {
    id: "heme_blood_031",
    blockId: "block-heme",
    moduleId: "mod-blood-composition-erythropoiesis",
    topic: "Blood Composition",
    question:
      "On centrifugation, the upper 55% clear/straw layer represents:",
    options: [
      "Formed elements",
      "Plasma",
      "Serum",
      "Haematocrit",
      "Buffy coat",
    ],
    correctAnswer: 1,
    explanation:
      "The top layer after centrifugation is plasma (about 55% of whole blood).",
    difficulty: 1,
  },
  {
    id: "heme_blood_032",
    blockId: "block-heme",
    moduleId: "mod-blood-composition-erythropoiesis",
    topic: "Plasma vs Serum",
    question: "Key plasma-serum difference is:",
    options: [
      "Plasma contains hemoglobin; serum does not",
      "Serum contains fibrinogen; plasma does not",
      "Plasma contains fibrinogen/clotting factors; serum does not",
      "Serum contains RBCs",
      "Plasma is obtained after clotting",
    ],
    correctAnswer: 2,
    explanation:
      "Plasma contains fibrinogen and clotting factors; serum is plasma after clotting factor consumption.",
    difficulty: 1,
  },
  {
    id: "heme_blood_033",
    blockId: "block-heme",
    moduleId: "mod-blood-composition-erythropoiesis",
    topic: "Plasma Proteins",
    question:
      "Main plasma protein maintaining colloid osmotic pressure is:",
    options: ["Fibrinogen", "Globulins", "Albumin", "Hemoglobin", "Heparin"],
    correctAnswer: 2,
    explanation:
      "Albumin is the major oncotic pressure-maintaining plasma protein synthesized by liver.",
    difficulty: 1,
  },
  {
    id: "heme_blood_034",
    blockId: "block-heme",
    moduleId: "mod-blood-composition-erythropoiesis",
    topic: "RBC Structure",
    question: "Main advantage of biconcave RBC shape is:",
    options: [
      "Allows nucleus for protein synthesis",
      "Increases surface area and flexibility through capillaries",
      "Improves phagocytosis",
      "Increases volume for more hemoglobin",
      "Prevents splenic destruction",
    ],
    correctAnswer: 1,
    explanation:
      "Biconcavity increases surface-area-to-volume ratio and deformability for capillary transit.",
    difficulty: 1,
  },
  {
    id: "heme_blood_035",
    blockId: "block-heme",
    moduleId: "mod-blood-composition-erythropoiesis",
    topic: "Haematocrit and RBC Indices",
    question:
      "Hb 8 g/dL, MCV 110 fL, MCHC 34% suggests:",
    options: [
      "Microcytic hypochromic anaemia",
      "Normocytic normochromic anaemia",
      "Macrocytic normochromic anaemia",
      "Microcytic normochromic anaemia",
      "Polycythaemia vera",
    ],
    correctAnswer: 2,
    explanation:
      "High MCV with normal MCHC indicates macrocytic normochromic (megaloblastic pattern).",
    difficulty: 2,
  },
  {
    id: "heme_blood_036",
    blockId: "block-heme",
    moduleId: "mod-blood-composition-erythropoiesis",
    topic: "Haematopoiesis - Fetal",
    question: "Primitive fetal haematopoiesis first begins in:",
    options: ["Liver", "Spleen", "Bone marrow", "Yolk sac", "Thymus"],
    correctAnswer: 3,
    explanation:
      "Primitive hematopoiesis starts in the yolk sac around the 3rd gestational week.",
    difficulty: 2,
  },
  {
    id: "heme_blood_037",
    blockId: "block-heme",
    moduleId: "mod-blood-composition-erythropoiesis",
    topic: "Erythropoietin (EPO)",
    question:
      "At high altitude, increased hemoglobin occurs primarily because:",
    options: [
      "Thrombopoietin rises",
      "Hypoxia stimulates renal EPO release, increasing erythropoiesis",
      "Spleen releases stored RBCs long-term",
      "Exercise directly drives marrow RBC production",
      "Testosterone directly synthesizes hemoglobin",
    ],
    correctAnswer: 1,
    explanation:
      "Hypoxia triggers kidney peritubular cells to release EPO, which stimulates marrow erythropoiesis.",
    difficulty: 2,
  },
  {
    id: "heme_blood_038",
    blockId: "block-heme",
    moduleId: "mod-blood-composition-erythropoiesis",
    topic: "EPO in Renal Failure",
    question: "In CKD with anaemia and low EPO, the main reason is:",
    options: [
      "Kidneys retain too much iron",
      "Damage to EPO-producing peritubular cells",
      "Increased splenic RBC destruction",
      "Liver overproduces hepcidin as primary cause",
      "Bone marrow fibrosis",
    ],
    correctAnswer: 1,
    explanation:
      "CKD damages peritubular renal cells, reducing EPO production despite anemia.",
    difficulty: 2,
  },
  {
    id: "heme_blood_039",
    blockId: "block-heme",
    moduleId: "mod-blood-composition-erythropoiesis",
    topic: "Nutritional Factors - Vitamin B12 and Folate",
    question:
      "Vegan with macrocytosis and hypersegmented neutrophils has defect of:",
    options: [
      "Insufficient iron for heme synthesis",
      "Failure of nuclear maturation from impaired DNA synthesis",
      "Excess EPO",
      "Vitamin K deficiency affecting RBC membrane",
      "Autoimmune stem cell destruction",
    ],
    correctAnswer: 1,
    explanation:
      "Vitamin B12/folate pathway impairment reduces DNA synthesis, causing megaloblastic nuclear maturation failure.",
    difficulty: 3,
  },
  {
    id: "heme_blood_040",
    blockId: "block-heme",
    moduleId: "mod-blood-composition-erythropoiesis",
    topic: "Polycythaemia",
    question:
      "Renal cell carcinoma with high Hb, high RBC count, high EPO, normal oxygen saturation indicates:",
    options: [
      "Primary polycythaemia",
      "Relative polycythaemia",
      "Secondary inappropriate polycythaemia (tumor EPO secretion)",
      "Secondary appropriate polycythaemia (hypoxia-driven)",
      "Physiological athlete polycythaemia",
    ],
    correctAnswer: 2,
    explanation:
      "Tumor EPO secretion with normal O2 saturation is secondary inappropriate (hypoxia-independent) polycythemia.",
    difficulty: 3,
  },
];

export function getMcqsByModuleId(moduleId: string): MCQ[] {
  return mcqs.filter((mcq) => mcq.moduleId === moduleId);
}
