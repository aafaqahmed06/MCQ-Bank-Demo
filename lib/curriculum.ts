import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Block, MCQ, Module, TopicGroup } from "@/types";

/**
 * Server-side fetchers for curriculum + practice content.
 *
 * They use the cookie-based SSR client so RLS is evaluated for the actual
 * requester: anon/students see only published MCQs, reviewers/admins see all.
 */

export async function getBlocks(): Promise<Block[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("blocks")
    .select("id, name, academic_year_id")
    .order("order_index", { ascending: true });
  if (error) throw new Error(`blocks: ${error.message}`);

  const yearIds = [...new Set((rows ?? []).map((r) => r.academic_year_id as string))];
  const { data: years } = await supabase
    .from("academic_years")
    .select("id, year_number")
    .in("id", yearIds);
  const yearByName = new Map((years ?? []).map((y) => [y.id as string, y.year_number as number]));

  return (rows ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    year: yearByName.get(row.academic_year_id as string) ?? 1,
  }));
}

export async function getBlockById(blockId: string): Promise<Block | null> {
  const blocks = await getBlocks();
  return blocks.find((b) => b.id === blockId) ?? null;
}

export async function getModulesByBlockId(blockId: string): Promise<Module[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("modules")
    .select("id, name, block_id")
    .eq("block_id", blockId)
    .order("order_index", { ascending: true });
  if (error) throw new Error(`modules: ${error.message}`);
  return (data ?? []).map((m) => ({
    id: m.id as string,
    blockId: m.block_id as string,
    name: m.name as string,
  }));
}

export async function getModuleById(moduleId: string): Promise<Module | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("modules")
    .select("id, name, block_id")
    .eq("id", moduleId)
    .maybeSingle();
  if (error) throw new Error(`module: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id as string,
    blockId: data.block_id as string,
    name: data.name as string,
  };
}

/** Published-question count per topic group (keyed by group.id). */
export async function getTopicGroupCounts(
  moduleId: string,
  groups: TopicGroup[],
): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data: topicRows, error: tErr } = await supabase
    .from("topics")
    .select("id, name")
    .eq("module_id", moduleId);
  if (tErr) throw new Error(`topics: ${tErr.message}`);

  const nameToId = new Map((topicRows ?? []).map((t) => [t.name as string, t.id as string]));

  const { data: mcqRows, error: mErr } = await supabase
    .from("mcqs")
    .select("topic_id")
    .eq("status", "published");
  if (mErr) throw new Error(`mcqs: ${mErr.message}`);

  const counts = new Map<string, number>();
  for (const row of mcqRows ?? []) {
    const id = row.topic_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const result: Record<string, number> = {};
  for (const group of groups) {
    const total = group.topics.reduce((sum, name) => {
      const id = nameToId.get(name);
      return id ? sum + (counts.get(id) ?? 0) : sum;
    }, 0);
    result[group.id] = total;
  }
  return result;
}

/**
 * Published MCQs for practice. `topicNames` restricts to a topic group's
 * exact topic strings; otherwise all topics in the module are included.
 */
export async function getPracticeQuestions(
  moduleId: string,
  topicNames?: string[],
): Promise<MCQ[]> {
  const supabase = await createClient();

  let query = supabase
    .from("topics")
    .select("id, name, module_id")
    .eq("module_id", moduleId);
  if (topicNames && topicNames.length > 0) {
    query = query.in("name", topicNames);
  }
  const { data: topicRows, error: tErr } = await query;
  if (tErr) throw new Error(`topics: ${tErr.message}`);

  const topicIds = (topicRows ?? []).map((t) => t.id as string);
  if (topicIds.length === 0) return [];

  const { data: mcqRows, error: mErr } = await supabase
    .from("mcqs")
    .select(
      "id, topic_id, question, options, correct_answer, explanation, difficulty",
    )
    .in("topic_id", topicIds)
    .eq("status", "published");
  if (mErr) throw new Error(`mcqs: ${mErr.message}`);

  const moduleIds = [...new Set((topicRows ?? []).map((t) => t.module_id as string))];
  const { data: moduleRows } = await supabase
    .from("modules")
    .select("id, block_id")
    .in("id", moduleIds);
  const blockByModule = new Map(
    (moduleRows ?? []).map((m) => [m.id as string, m.block_id as string]),
  );
  const topicByMcq = new Map((topicRows ?? []).map((t) => [t.id as string, t]));

  return (mcqRows ?? []).map((row) => {
    const topic = topicByMcq.get(row.topic_id as string);
    const resolvedModuleId = (topic?.module_id as string) ?? moduleId;
    return {
      id: row.id as string,
      blockId: blockByModule.get(resolvedModuleId) ?? "block-one",
      moduleId: resolvedModuleId,
      topic: (topic?.name as string) ?? "",
      question: row.question as string,
      options: (row.options as string[]) ?? [],
      correctAnswer: row.correct_answer as number,
      explanation: row.explanation as string,
      difficulty: row.difficulty as number,
    };
  });
}