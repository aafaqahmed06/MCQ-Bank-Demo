import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTopicGroupsByModuleId } from "@/lib/topicGroups";
import type {
  Block,
  MCQ,
  Module,
  TopicGroup,
  TopicGroupStatus,
} from "@/types";

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

  const blockIds = (rows ?? []).map((r) => r.id as string);
  const { data: moduleRows, error: modErr } = await supabase
    .from("modules")
    .select("id, block_id")
    .in("block_id", blockIds.length ? blockIds : [""]);
  if (modErr) throw new Error(`modules count: ${modErr.message}`);
  const subjectCountByBlock = new Map<string, number>();
  const moduleIds: string[] = [];
  for (const m of moduleRows ?? []) {
    const bid = m.block_id as string;
    subjectCountByBlock.set(bid, (subjectCountByBlock.get(bid) ?? 0) + 1);
    moduleIds.push(m.id as string);
  }

  const progress = await getTopicProgressByModule(moduleIds);
  const progressByBlock = new Map<string, { completed: number; total: number }>();
  for (const m of moduleRows ?? []) {
    const p = progress[m.id as string];
    if (!p) continue;
    const bid = m.block_id as string;
    const cur = progressByBlock.get(bid) ?? { completed: 0, total: 0 };
    cur.completed += p.completed;
    cur.total += p.total;
    progressByBlock.set(bid, cur);
  }

  return (rows ?? []).map((row) => {
    const p = progressByBlock.get(row.id as string);
    return {
      id: row.id as string,
      name: row.name as string,
      year: yearByName.get(row.academic_year_id as string) ?? 1,
      subjectCount: subjectCountByBlock.get(row.id as string) ?? 0,
      topicsCompleted: p?.completed ?? 0,
      topicsTotal: p?.total ?? 0,
    };
  });
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

  const ids = (data ?? []).map((m) => m.id as string);
  const progress = await getTopicProgressByModule(ids);

  return (data ?? []).map((m) => {
    const p = progress[m.id as string];
    return {
      id: m.id as string,
      blockId: m.block_id as string,
      name: m.name as string,
      topicsCompleted: p?.completed ?? 0,
      topicsTotal: p?.total ?? 0,
    };
  });
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

/** IDs of topics the current user has fully completed (RLS-scoped). */
export async function getCompletedTopicIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_topic_progress")
    .select("topic_id")
    .eq("completed", true);
  if (error) throw new Error(`completion: ${error.message}`);
  return new Set((data ?? []).map((r) => r.topic_id as string));
}

/**
 * Per-module topic-group completion counts, optionally scoped to a set of
 * modules. Keyed by module_id -> { completed, total }.
 *
 * The `total` is the number of topic GROUPS defined for the module (e.g. the
 * 11 physiology groups), not the number of granular topic rows in the topics
 * table — that is what the blocks/modules cards present to the user. A group
 * counts toward `total` only when at least one of its topics exists in the
 * bank, and toward `completed` only when every one of its topics is done
 * (same semantics as getTopicGroupCompletion).
 */
export async function getTopicProgressByModule(
  moduleIds?: string[],
): Promise<Record<string, { completed: number; total: number }>> {
  const supabase = await createClient();

  let q = supabase.from("topics").select("id, name, module_id");
  if (moduleIds && moduleIds.length > 0) {
    q = q.in("module_id", moduleIds);
  }
  const { data: topicRows } = await q;

  const nameToIdByModule = new Map<string, Map<string, string>>();
  for (const t of topicRows ?? []) {
    const mid = t.module_id as string;
    if (!nameToIdByModule.has(mid)) nameToIdByModule.set(mid, new Map());
    nameToIdByModule.get(mid)!.set(t.name as string, t.id as string);
  }

  const completed = await getCompletedTopicIds();

  const targetModules =
    moduleIds && moduleIds.length > 0
      ? moduleIds
      : [...nameToIdByModule.keys()];

  const byModule: Record<string, { completed: number; total: number }> = {};
  for (const mid of targetModules) {
    const nameToId = nameToIdByModule.get(mid) ?? new Map<string, string>();
    let done = 0;
    let total = 0;
    for (const group of getTopicGroupsByModuleId(mid)) {
      const ids = group.topics
        .map((name) => nameToId.get(name))
        .filter((id): id is string => typeof id === "string");
      if (ids.length === 0) continue;
      total += 1;
      if (ids.every((id) => completed.has(id))) done += 1;
    }
    byModule[mid] = { completed: done, total };
  }
  return byModule;
}

/**
 * Completion status per topic group for a module. A group is "completed" only
 * when every topic belonging to it has been finished.
 */
export async function getTopicGroupCompletion(
  moduleId: string,
  groups: TopicGroup[],
): Promise<Record<string, TopicGroupStatus>> {
  const supabase = await createClient();
  const { data: topicRows, error: tErr } = await supabase
    .from("topics")
    .select("id, name")
    .eq("module_id", moduleId);
  if (tErr) throw new Error(`topics: ${tErr.message}`);

  const nameToId = new Map((topicRows ?? []).map((t) => [t.name as string, t.id as string]));
  const completed = await getCompletedTopicIds();

  const result: Record<string, TopicGroupStatus> = {};
  for (const group of groups) {
    const ids = group.topics
      .map((name) => nameToId.get(name))
      .filter((id): id is string => typeof id === "string");
    let done = 0;
    for (const id of ids) if (completed.has(id)) done += 1;
    result[group.id] = {
      completedTopics: done,
      totalTopics: ids.length,
      completed: ids.length > 0 && done === ids.length,
    };
  }
  return result;
}

/**
 * Resolved topic IDs for the topics a practice session covers (the full topic
 * group when `topicNames` is provided, otherwise all of the module). These are
 * the topics flagged as completed when the session is finished.
 */
export async function getCompletionTopicIds(
  moduleId: string,
  topicNames?: string[],
): Promise<string[]> {
  const supabase = await createClient();
  let q = supabase.from("topics").select("id, name").eq("module_id", moduleId);
  if (topicNames && topicNames.length > 0) {
    q = q.in("name", topicNames);
  }
  const { data, error } = await q;
  if (error) throw new Error(`completion topics: ${error.message}`);
  return (data ?? []).map((t) => t.id as string);
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
 *
 * Answer keys are NOT exposed over REST (see migration 016: column-level
 * grants remove correct_answer/explanation from anon + authenticated).
 * This function therefore reads through the service-role client on the
 * server, gated on an authenticated session, and always filters to
 * published MCQs so students can never see drafts.
 */
export async function getPracticeQuestions(
  moduleId: string,
  topicNames?: string[],
): Promise<MCQ[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const admin = createAdminClient();

  let query = admin
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

  const { data: mcqRows, error: mErr } = await admin
    .from("mcqs")
    .select(
      "id, topic_id, question, options, correct_answer, explanation, difficulty",
    )
    .in("topic_id", topicIds)
    .eq("status", "published");
  if (mErr) throw new Error(`mcqs: ${mErr.message}`);

  const moduleIds = [...new Set((topicRows ?? []).map((t) => t.module_id as string))];
  const { data: moduleRows } = await admin
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