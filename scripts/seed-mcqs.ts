import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { mcqs as rawMcqs } from "@/lib/data/mcqs";
import { blocks } from "@/lib/data/blocks";
import { modules } from "@/lib/data/modules";
import { MOCK_COLLEGES, YEAR_OPTIONS } from "@/lib/data/user";

// ---------------------------------------------------------------------------
// Expected content shape (drift guard — fail loudly if the bank changes shape).
// ---------------------------------------------------------------------------
const EXPECTED_MODULE_COUNTS: Record<string, number> = {
  "sub-anatomy": 74,
  "sub-physiology": 95,
  "sub-biochemistry": 79,
  "sub-minor": 54,
};
const EXPECTED_TOTAL = Object.values(EXPECTED_MODULE_COUNTS).reduce(
  (sum, n) => sum + n,
  0,
);

// Canonical (hidden) institution that owns the shared question bank.
const CANONICAL_COLLEGE = {
  id: "diagnknow-qb",
  name: "DiagnKnow Question Bank",
  short_name: "DKQB",
};
const CANONICAL_PROGRAM = { id: "qbank-mbbs", name: "MBBS" };
const CANONICAL_YEAR = { id: "qbank-year-1", year_number: 1, name: "Year 1" };

// ---------------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------------
type McqRow = {
  id: string;
  blockId: string;
  moduleId: string;
  topic: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: number;
};

function loadEnv(): void {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, value] = match;
    if (!(key in process.env)) {
      process.env[key] = value.replace(/^["']|["']$/g, "");
    }
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function upsertBatched<T>(
  db: SupabaseClient,
  table: string,
  rows: T[],
  chunk = 50,
): Promise<void> {
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- supabase-js rejects a bare generic T; rows are validated upstream
    const { error } = await db.from(table).upsert(slice as any, {
      onConflict: "id",
    });
    if (error) {
      throw new Error(
        `upsert ${table} failed (batch ${i / chunk + 1}): ${error.message}`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Validation (runs BEFORE any write; failures exit non-zero).
// ---------------------------------------------------------------------------
function validateMcqs(mcqs: McqRow[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const knownModules = new Set(modules.map((m) => m.id));

  if (mcqs.length !== EXPECTED_TOTAL) {
    errors.push(
      `expected ${EXPECTED_TOTAL} mcqs, found ${mcqs.length} — refusing to seed`,
    );
  }

  const actualModuleCounts: Record<string, number> = {};
  for (const mcq of mcqs) {
    if (ids.has(mcq.id)) {
      errors.push(`duplicate mcq id: ${mcq.id}`);
    }
    ids.add(mcq.id);

    if (!knownModules.has(mcq.moduleId)) {
      errors.push(`mcq ${mcq.id}: unknown moduleId "${mcq.moduleId}"`);
      continue;
    }
    actualModuleCounts[mcq.moduleId] = (actualModuleCounts[mcq.moduleId] ?? 0) + 1;

    if (!blocks.some((b) => b.id === mcq.blockId)) {
      errors.push(`mcq ${mcq.id}: unknown blockId "${mcq.blockId}"`);
    }
    if (!mcq.topic?.trim()) errors.push(`mcq ${mcq.id}: missing topic`);
    if (!mcq.question?.trim()) errors.push(`mcq ${mcq.id}: missing question`);
    if (!Array.isArray(mcq.options) || mcq.options.length !== 5) {
      errors.push(`mcq ${mcq.id}: must have exactly 5 options`);
    } else if (mcq.options.some((o) => !o?.trim())) {
      errors.push(`mcq ${mcq.id}: contains an empty option`);
    }
    if (
      !Number.isInteger(mcq.correctAnswer) ||
      mcq.correctAnswer < 0 ||
      mcq.correctAnswer > 4
    ) {
      errors.push(`mcq ${mcq.id}: correctAnswer must be an integer 0-4`);
    }
    if (!mcq.explanation?.trim()) {
      errors.push(`mcq ${mcq.id}: missing explanation`);
    }
    if (!Number.isInteger(mcq.difficulty) || mcq.difficulty < 1 || mcq.difficulty > 3) {
      errors.push(`mcq ${mcq.id}: difficulty must be an integer 1-3`);
    }
  }

  const slugByTopic = new Map<string, string>();
  for (const mcq of mcqs) {
    if (!knownModules.has(mcq.moduleId)) continue;
    const key = `${mcq.moduleId}\u0000${mcq.topic}`;
    const slug = `${mcq.moduleId}-${slugify(mcq.topic)}`;
    const existing = slugByTopic.get(slug);
    if (existing && existing !== key) {
      errors.push(
        `topic_id slug collision: "${existing}" vs "${mcq.topic}" -> ${slug}`,
      );
    }
    slugByTopic.set(slug, key);
  }

  for (const [moduleId, expected] of Object.entries(EXPECTED_MODULE_COUNTS)) {
    const actual = actualModuleCounts[moduleId] ?? 0;
    if (actual !== expected) {
      errors.push(
        `module ${moduleId}: expected ${expected} mcqs, found ${actual}`,
      );
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  loadEnv();

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    process.exit(1);
  }

  const errors = validateMcqs(rawMcqs as McqRow[]);
  if (errors.length > 0) {
    console.error(`\nValidation FAILED (${errors.length} issue(s)):`);
    for (const err of errors) console.error(`  - ${err}`);
    console.error("\nNo data was written. Fix the data and re-run.");
    process.exit(1);
  }
  console.log(`Validation passed: ${rawMcqs.length} mcqs`);

  const db = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // --- Colleges -------------------------------------------------------------
  const colleges = [
    CANONICAL_COLLEGE,
    ...MOCK_COLLEGES.map((name) => ({
      id: slugify(name),
      name,
      short_name: shortName(name),
    })),
  ];
  await upsertBatched(db, "colleges", colleges);
  console.log(`colleges: ${colleges.length}`);

  // --- Programs -------------------------------------------------------------
  const programs = [
    { ...CANONICAL_PROGRAM, college_id: CANONICAL_COLLEGE.id },
    ...MOCK_COLLEGES.map((name) => ({
      id: `${slugify(name)}-mbbs`,
      college_id: slugify(name),
      name: "MBBS",
    })),
  ];
  await upsertBatched(db, "programs", programs);
  console.log(`programs: ${programs.length}`);

  // --- Academic years -------------------------------------------------------
  const academicYears = [
    { ...CANONICAL_YEAR, program_id: CANONICAL_PROGRAM.id },
    ...MOCK_COLLEGES.flatMap((name) =>
      YEAR_OPTIONS.map((yearNumber) => ({
        id: `${slugify(name)}-mbbs-year-${yearNumber}`,
        program_id: `${slugify(name)}-mbbs`,
        year_number: yearNumber,
        name: `Year ${yearNumber}`,
      })),
    ),
  ];
  await upsertBatched(db, "academic_years", academicYears);
  console.log(`academic_years: ${academicYears.length}`);

  // --- Blocks ---------------------------------------------------------------
  const dbBlocks = blocks.map((block) => ({
    id: block.id,
    academic_year_id: CANONICAL_YEAR.id,
    name: block.name,
    order_index: 0,
  }));
  await upsertBatched(db, "blocks", dbBlocks);
  console.log(`blocks: ${dbBlocks.length}`);

  // --- Modules --------------------------------------------------------------
  const dbModules = modules.map((moduleRow, index) => ({
    id: moduleRow.id,
    block_id: "block-one",
    name: moduleRow.name,
    order_index: index + 1,
  }));
  await upsertBatched(db, "modules", dbModules);
  console.log(`modules: ${dbModules.length}`);

  // --- Topics (one row per unique moduleId+topic string) ---------------------
  const topicOrder = new Map<string, number>();
  const topicsByKey = new Map<string, { id: string; name: string; moduleId: string }>();
  for (const mcq of rawMcqs as McqRow[]) {
    const key = `${mcq.moduleId}\u0000${mcq.topic}`;
    if (!topicsByKey.has(key)) {
      topicsByKey.set(key, {
        id: `${mcq.moduleId}-${slugify(mcq.topic)}`,
        name: mcq.topic,
        moduleId: mcq.moduleId,
      });
      const counter = topicOrder.get(mcq.moduleId) ?? 0;
      topicOrder.set(mcq.moduleId, counter + 1);
    }
  }
  const dbTopics = Array.from(topicsByKey.values()).map((topic) => ({
    id: topic.id,
    module_id: topic.moduleId,
    name: topic.name,
    order_index: topicOrder.get(topic.moduleId) ?? 0,
  }));
  await upsertBatched(db, "topics", dbTopics);
  console.log(`topics: ${dbTopics.length}`);

  // --- MCQs -----------------------------------------------------------------
  const dbMcqs = (rawMcqs as McqRow[]).map((mcq) => {
    const key = `${mcq.moduleId}\u0000${mcq.topic}`;
    const topicId = topicsByKey.get(key)!.id;
    return {
      id: mcq.id,
      topic_id: topicId,
      question: mcq.question,
      options: mcq.options,
      correct_answer: mcq.correctAnswer,
      explanation: mcq.explanation,
      difficulty: mcq.difficulty,
      status: "published" as const,
    };
  });
  await upsertBatched(db, "mcqs", dbMcqs, 50);
  console.log(`mcqs upserted: ${dbMcqs.length}`);

  // --- Archive any mcqs that no longer exist in the bank ----------------------
  const seedIds = new Set(dbMcqs.map((m) => m.id));
  const { data: fetchedRows, error: fetchError } = await db.from("mcqs").select("id");
  if (fetchError) throw new Error(`fetch mcqs ids: ${fetchError.message}`);
  const removed = (fetchedRows ?? [])
    .map((row) => row.id as string)
    .filter((id) => !seedIds.has(id));
  if (removed.length > 0) {
    for (let i = 0; i < removed.length; i += 200) {
      const slice = removed.slice(i, i + 200);
      const { error } = await db
        .from("mcqs")
        .update({ status: "archived" })
        .in("id", slice);
      if (error) throw new Error(`archive removed mcqs: ${error.message}`);
    }
    console.log(`mcqs archived (removed from seed): ${removed.length}`);
  } else {
    console.log("mcqs archived: 0 (none removed)");
  }

  // --- Report ---------------------------------------------------------------
  const moduleCounts = (rawMcqs as McqRow[]).reduce<Record<string, number>>(
    (acc, m) => {
      acc[m.moduleId] = (acc[m.moduleId] ?? 0) + 1;
      return acc;
    },
    {},
  );
  console.log("\nSeed complete. Totals:");
  console.log(`  colleges: ${colleges.length}`);
  console.log(`  programs: ${programs.length}`);
  console.log(`  academic_years: ${academicYears.length}`);
  console.log(`  blocks: ${dbBlocks.length}`);
  console.log(`  modules: ${dbModules.length}`);
  console.log(`  topics: ${dbTopics.length}`);
  console.log(`  mcqs: ${dbMcqs.length} (${JSON.stringify(moduleCounts)})`);
}

function shortName(name: string): string {
  if (name === CANONICAL_COLLEGE.name) return CANONICAL_COLLEGE.short_name;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
  return (initials || name.slice(0, 4)).toUpperCase();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});