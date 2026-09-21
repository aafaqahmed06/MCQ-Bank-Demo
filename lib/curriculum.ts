import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTopicGroupsByModuleId } from "@/lib/topicGroups";
import { isWeakTopic } from "@/lib/weakness";
import type {
  Block,
  MCQ,
  Module,
  SampleQuestion,
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
  const progressByBlock = new Map<string, BlockAggregate>();
  for (const m of moduleRows ?? []) {
    const p = progress[m.id as string];
    if (!p) continue;
    const bid = m.block_id as string;
    const cur = progressByBlock.get(bid) ?? {
      completed: 0,
      total: 0,
      questionCount: 0,
      weakTopicCount: 0,
      lastActivityAt: null,
    };
    cur.completed += p.completed;
    cur.total += p.total;
    cur.questionCount += p.questionCount;
    cur.weakTopicCount += p.weakTopicCount;
    if (p.lastActivityAt && (!cur.lastActivityAt || p.lastActivityAt > cur.lastActivityAt)) {
      cur.lastActivityAt = p.lastActivityAt;
    }
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
      questionCount: p?.questionCount ?? 0,
      weakTopicCount: p?.weakTopicCount ?? 0,
      lastActivityAt: p?.lastActivityAt ?? null,
    };
  });
}

type BlockAggregate = {
  completed: number;
  total: number;
  questionCount: number;
  weakTopicCount: number;
  lastActivityAt: string | null;
};

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

  return (data ?? []).map((m) => moduleFromProgress(m, progress[m.id as string]));
}

function moduleFromProgress(
  row: { id: string; name: string; block_id: string },
  p: ModuleProgress | undefined
): Module {
  return {
    id: row.id,
    blockId: row.block_id,
    name: row.name,
    topicsCompleted: p?.completed ?? 0,
    topicsTotal: p?.total ?? 0,
    questionCount: p?.questionCount ?? 0,
    weakTopicCount: p?.weakTopicCount ?? 0,
    lastActivityAt: p?.lastActivityAt ?? null,
    accuracy:
      p && p.questionsAttempted > 0
        ? Math.round((p.questionsCorrect / p.questionsAttempted) * 100)
        : null,
    questionsAttempted: p?.questionsAttempted ?? 0,
  };
}

/**
 * Flat, ordered list of every subject (module) name, for public display
 * (landing page subject pills). Unlike getModulesByBlockId this isn't
 * scoped to a block or a user -- it skips the per-user topic-progress join,
 * which an anonymous visitor's request has no use for.
 */
export async function getSubjectNames(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("modules")
    .select("name")
    .order("order_index", { ascending: true });
  if (error) throw new Error(`modules: ${error.message}`);
  return (data ?? []).map((m) => m.name as string);
}

const SAMPLE_QUESTION_ID = "heme_coag_001";

/**
 * One real, published question for the landing page. Selects only columns
 * anon is granted (correct_answer/explanation are revoked at the Postgres
 * grant level for anon/authenticated -- see migration
 * 20260708000016_lock_mcq_keys.sql -- this list is explicit for clarity of
 * intent, not a workaround). Prefers a known-good, well-formed question by
 * id; falls back to any published question if that row is ever
 * removed/unpublished. Supabase-js has no way to ORDER BY random() without
 * a new RPC, so this isn't randomized.
 */
export async function getSampleQuestion(): Promise<SampleQuestion | null> {
  const supabase = await createClient();

  const preferred = await supabase
    .from("mcqs")
    .select("id, topic_id, question, options")
    .eq("id", SAMPLE_QUESTION_ID)
    .eq("status", "published")
    .maybeSingle();

  const row =
    preferred.data ??
    (
      await supabase
        .from("mcqs")
        .select("id, topic_id, question, options")
        .eq("status", "published")
        .limit(1)
        .maybeSingle()
    ).data;
  if (!row) return null;

  let topicName: string | null = null;
  if (row.topic_id) {
    const { data: topic } = await supabase
      .from("topics")
      .select("name")
      .eq("id", row.topic_id as string)
      .maybeSingle();
    topicName = (topic?.name as string) ?? null;
  }

  return {
    id: row.id as string,
    topic: topicName,
    question: row.question as string,
    options: (row.options as string[]) ?? [],
  };
}

/**
 * Every module (subject) across all blocks, with per-user topic-group
 * progress — the "Your Curriculum" breakdown on the dashboard (Anatomy,
 * Physiology, Biochemistry, Minor Subjects, ...). Unscoped by block: this
 * app currently has one block, and a subject-level view shouldn't need to
 * change if a second one is added later.
 */
export async function getAllModulesWithProgress(): Promise<Module[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("modules")
    .select("id, name, block_id")
    .order("order_index", { ascending: true });
  if (error) throw new Error(`modules: ${error.message}`);

  const ids = (data ?? []).map((m) => m.id as string);
  const progress = await getTopicProgressByModule(ids);

  return (data ?? []).map((m) => moduleFromProgress(m, progress[m.id as string]));
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

export type ModuleProgress = {
  completed: number;
  total: number;
  /** Published question count across every topic in the module. */
  questionCount: number;
  questionsAttempted: number;
  questionsCorrect: number;
  /** Topics meeting the isWeakTopic reliability + accuracy gate (lib/weakness.ts). */
  weakTopicCount: number;
  lastActivityAt: string | null;
};

/** Per-topic practice signal (attempts/accuracy/recency), keyed by topic_id. */
async function getTopicHealthMap(): Promise<
  Map<string, { attempted: number; correct: number; accuracy: number | null; lastAttemptedAt: string | null }>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_topic_progress")
    .select(
      "topic_id, practice_questions_attempted, practice_questions_correct, practice_accuracy, practice_last_attempted_at"
    );
  if (error) throw new Error(`topic health: ${error.message}`);

  const map = new Map<
    string,
    { attempted: number; correct: number; accuracy: number | null; lastAttemptedAt: string | null }
  >();
  for (const row of data ?? []) {
    map.set(row.topic_id as string, {
      attempted: (row.practice_questions_attempted as number) ?? 0,
      correct: (row.practice_questions_correct as number) ?? 0,
      accuracy: row.practice_accuracy != null ? (row.practice_accuracy as number) : null,
      lastAttemptedAt: (row.practice_last_attempted_at as string | null) ?? null,
    });
  }
  return map;
}

/** Published MCQ count per topic_id, across the whole bank. */
async function getPublishedMcqCountsByTopic(): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("mcqs").select("topic_id").eq("status", "published");
  if (error) throw new Error(`mcqs: ${error.message}`);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const id = row.topic_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

/**
 * Per-module curriculum health, optionally scoped to a set of modules.
 * Keyed by module_id.
 *
 * `total` is the number of topic GROUPS defined for the module (e.g. the
 * 11 physiology groups), not the number of granular topic rows in the topics
 * table — that is what the blocks/modules cards present to the user. A group
 * counts toward `total` only when at least one of its topics exists in the
 * bank, and toward `completed` only when every one of its topics is done
 * (same semantics as getTopicGroupCompletion). `questionCount`/
 * `weakTopicCount`/`lastActivityAt` are raw per-topic aggregates instead,
 * independent of the topic-group curation.
 */
export async function getTopicProgressByModule(
  moduleIds?: string[],
): Promise<Record<string, ModuleProgress>> {
  const supabase = await createClient();

  let q = supabase.from("topics").select("id, name, module_id");
  if (moduleIds && moduleIds.length > 0) {
    q = q.in("module_id", moduleIds);
  }
  const { data: topicRows } = await q;

  const nameToIdByModule = new Map<string, Map<string, string>>();
  const topicIdsByModule = new Map<string, string[]>();
  for (const t of topicRows ?? []) {
    const mid = t.module_id as string;
    if (!nameToIdByModule.has(mid)) nameToIdByModule.set(mid, new Map());
    nameToIdByModule.get(mid)!.set(t.name as string, t.id as string);
    if (!topicIdsByModule.has(mid)) topicIdsByModule.set(mid, []);
    topicIdsByModule.get(mid)!.push(t.id as string);
  }

  const [completed, health, mcqCounts] = await Promise.all([
    getCompletedTopicIds(),
    getTopicHealthMap(),
    getPublishedMcqCountsByTopic(),
  ]);

  const targetModules =
    moduleIds && moduleIds.length > 0
      ? moduleIds
      : [...nameToIdByModule.keys()];

  const byModule: Record<string, ModuleProgress> = {};
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

    let questionCount = 0;
    let questionsAttempted = 0;
    let questionsCorrect = 0;
    let weakTopicCount = 0;
    let lastActivityAt: string | null = null;
    for (const tid of topicIdsByModule.get(mid) ?? []) {
      questionCount += mcqCounts.get(tid) ?? 0;
      const h = health.get(tid);
      if (!h) continue;
      questionsAttempted += h.attempted;
      questionsCorrect += h.correct;
      if (isWeakTopic(h.accuracy, h.attempted)) weakTopicCount += 1;
      if (h.lastAttemptedAt && (!lastActivityAt || h.lastAttemptedAt > lastActivityAt)) {
        lastActivityAt = h.lastAttemptedAt;
      }
    }

    byModule[mid] = {
      completed: done,
      total,
      questionCount,
      questionsAttempted,
      questionsCorrect,
      weakTopicCount,
      lastActivityAt,
    };
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
 * Per-topic-group weakness signal + recency for a module (mirrors
 * getTopicGroupCompletion's shape/scoping, but sourced from practice health
 * instead of the completed flag).
 */
export async function getTopicGroupHealth(
  moduleId: string,
  groups: TopicGroup[],
): Promise<Record<string, { weakTopicCount: number; lastActivityAt: string | null }>> {
  const supabase = await createClient();
  const { data: topicRows, error: tErr } = await supabase
    .from("topics")
    .select("id, name")
    .eq("module_id", moduleId);
  if (tErr) throw new Error(`topics: ${tErr.message}`);

  const nameToId = new Map((topicRows ?? []).map((t) => [t.name as string, t.id as string]));
  const health = await getTopicHealthMap();

  const result: Record<string, { weakTopicCount: number; lastActivityAt: string | null }> = {};
  for (const group of groups) {
    const ids = group.topics
      .map((name) => nameToId.get(name))
      .filter((id): id is string => typeof id === "string");

    let weakTopicCount = 0;
    let lastActivityAt: string | null = null;
    for (const id of ids) {
      const h = health.get(id);
      if (!h) continue;
      if (isWeakTopic(h.accuracy, h.attempted)) weakTopicCount += 1;
      if (h.lastAttemptedAt && (!lastActivityAt || h.lastAttemptedAt > lastActivityAt)) {
        lastActivityAt = h.lastAttemptedAt;
      }
    }
    result[group.id] = { weakTopicCount, lastActivityAt };
  }
  return result;
}

export type MissedTopic = {
  topicId: string;
  topicName: string;
  moduleId: string;
  moduleName: string;
  accuracy: number;
  attempted: number;
};

/**
 * Cross-subject "Mistakes" ranking (.claude/rules/ui-upgrade-plan.md
 * "Mistakes" -- "most-missed topics ranked"). Reuses the same weak-topic
 * gate as the dashboard's Focus Next / Curriculum's Topic Health
 * (lib/weakness.ts isWeakTopic), just without scoping to one module.
 */
export async function getMostMissedTopics(limit = 10): Promise<MissedTopic[]> {
  const supabase = await createClient();
  const health = await getTopicHealthMap();

  const weakEntries = [...health.entries()]
    .filter(([, h]) => isWeakTopic(h.accuracy, h.attempted))
    .sort((a, b) => (a[1].accuracy ?? 0) - (b[1].accuracy ?? 0))
    .slice(0, limit);
  if (weakEntries.length === 0) return [];

  const topicIds = weakEntries.map(([id]) => id);
  const { data: topicRows, error: tErr } = await supabase
    .from("topics")
    .select("id, name, module_id")
    .in("id", topicIds);
  if (tErr) throw new Error(`topics: ${tErr.message}`);

  const moduleIds = [...new Set((topicRows ?? []).map((t) => t.module_id as string))];
  const { data: moduleRows, error: mErr } = await supabase
    .from("modules")
    .select("id, name")
    .in("id", moduleIds.length ? moduleIds : [""]);
  if (mErr) throw new Error(`modules: ${mErr.message}`);

  const moduleNameById = new Map((moduleRows ?? []).map((m) => [m.id as string, m.name as string]));
  const topicById = new Map((topicRows ?? []).map((t) => [t.id as string, t]));

  return weakEntries
    .map(([topicId, h]): MissedTopic | null => {
      const topic = topicById.get(topicId);
      if (!topic) return null;
      const moduleId = topic.module_id as string;
      return {
        topicId,
        topicName: topic.name as string,
        moduleId,
        moduleName: moduleNameById.get(moduleId) ?? "",
        accuracy: Math.round(h.accuracy ?? 0),
        attempted: h.attempted,
      };
    })
    .filter((t): t is MissedTopic => t !== null);
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