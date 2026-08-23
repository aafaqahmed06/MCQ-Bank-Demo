// Shared topic-coverage query/aggregation logic (docs/MASTER_KB.md "MCQ
// Pipeline/topic-checklist.md" describes a full canonical YAML coverage
// registry -- this is NOT that. It's a quick snapshot over data we already
// have, useful for spotting thin/unverified topics today).
//
// Used by both scripts/topic-coverage-report.ts (CLI, service-role client)
// and app/admin/coverage/page.tsx (admin-gated route, service-role client
// via lib/supabase/admin.ts) so the query logic isn't duplicated between the
// two.
//
// Question ownership follows mcq_topics with relationship_type = 'primary'
// (docs/MASTER_KB.md "Architecture/database-schema.md" -> ## mcq_topics),
// consistent with how the rest of the app treats primary topic ownership
// (see 20260708000026_mcq_topics.sql) rather than reading mcqs.topic_id
// directly.

import type { SupabaseClient } from "@supabase/supabase-js";

// Severity tiers by published question count. Adjust freely -- these are not
// derived from any spec, just sane starting bars.
//   CRITICAL: 0..CRITICAL_MAX_QUESTIONS
//   LOW:      CRITICAL_MAX_QUESTIONS+1..LOW_MAX_QUESTIONS
//   OK:       LOW_MAX_QUESTIONS+1 and up
export const CRITICAL_MAX_QUESTIONS = 2;
export const LOW_MAX_QUESTIONS = 9;

export type Tier = "CRITICAL" | "LOW" | "OK";

export function tierFor(publishedCount: number): Tier {
  if (publishedCount <= CRITICAL_MAX_QUESTIONS) return "CRITICAL";
  if (publishedCount <= LOW_MAX_QUESTIONS) return "LOW";
  return "OK";
}

type Difficulty = 1 | 2 | 3;
type QuestionStatus = "draft" | "review" | "published" | "archived" | "rejected";
type VerificationStatus = "unverified" | "verified" | "needs_review" | "rejected" | null;

// topics->modules and mcq_topics->mcqs are both many-to-one FKs, so
// PostgREST embeds them as a single object at runtime. The untyped
// SupabaseClient (no generated Database schema) can't see that cardinality
// and infers embeds as arrays -- fetchAll() takes `any` from the query
// builder and we assert the (correct) runtime shape here instead of fighting
// the inferred type.
interface TopicRow {
  id: string;
  name: string;
  modules: { name: string; blocks: { name: string } | null } | null;
}

interface McqTopicRow {
  topic_id: string;
  mcqs: { difficulty: Difficulty; status: QuestionStatus; verification_status: VerificationStatus } | null;
}

export interface TopicStats {
  id: string;
  name: string;
  block: string;
  module: string;
  publishedCount: number;
  linkedCount: number;
  difficulty: Record<Difficulty, number>;
  verification: Record<"verified" | "unverified" | "needs_review" | "rejected", number>;
}

/** Paginates through a Supabase select, since PostgREST caps rows per request. */
async function fetchAll<T>(
  db: SupabaseClient,
  build: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<T[]> {
  const pageSize = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const page = (data as T[] | null) ?? [];
    if (page.length === 0) break;
    out.push(...page);
    if (page.length < pageSize) break;
  }
  return out;
}

function emptyStats(id: string, name: string, block: string, mod: string): TopicStats {
  return {
    id,
    name,
    block,
    module: mod,
    publishedCount: 0,
    linkedCount: 0,
    difficulty: { 1: 0, 2: 0, 3: 0 },
    verification: { verified: 0, unverified: 0, needs_review: 0, rejected: 0 },
  };
}

/**
 * Per-topic coverage stats, sorted by published question count ascending
 * then topic name. Requires a client that can read mcqs.status/difficulty/
 * verification_status across all topics regardless of RLS (service-role).
 */
export async function getTopicCoverage(db: SupabaseClient): Promise<TopicStats[]> {
  const topics = await fetchAll<TopicRow>(db, (from, to) =>
    db
      .from("topics")
      .select("id, name, modules ( name, blocks ( name ) )")
      .order("id")
      .range(from, to),
  );

  const links = await fetchAll<McqTopicRow>(db, (from, to) =>
    db
      .from("mcq_topics")
      .select("topic_id, mcqs ( difficulty, status, verification_status )")
      .eq("relationship_type", "primary")
      .range(from, to),
  );

  const statsByTopic = new Map<string, TopicStats>();
  for (const t of topics) {
    statsByTopic.set(t.id, emptyStats(t.id, t.name, t.modules?.blocks?.name ?? "?", t.modules?.name ?? "?"));
  }

  for (const link of links) {
    const stats = statsByTopic.get(link.topic_id);
    const mcq = link.mcqs;
    if (!stats || !mcq) continue;

    stats.linkedCount += 1;
    if (mcq.status === "published") stats.publishedCount += 1;
    stats.difficulty[mcq.difficulty] += 1;

    const v = mcq.verification_status ?? "unverified";
    stats.verification[v] += 1;
  }

  return [...statsByTopic.values()].sort(
    (a, b) => a.publishedCount - b.publishedCount || a.name.localeCompare(b.name),
  );
}
