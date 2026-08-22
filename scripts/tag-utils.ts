// Helper functions for the generalized tagging layer (docs/MASTER_KB.md
// "Architecture/database-schema.md" -> ## Tagging system, and
// "MCQ Pipeline/tagging-spec.md"). Import the functions you need from
// another script/process.
//
// `question_style` is explicitly out of scope ("Do not enable a style until
// the product actually supports it") -- every entry point here rejects that
// namespace up front, in addition to the DB-level CHECK constraint in
// 20260708000025_mcq_tagging.sql. This is defense in depth, not the primary
// enforcement mechanism.

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

let cachedClient: SupabaseClient | null = null;

/** Lazily creates (and caches) a service-role Supabase client. */
export function getServiceClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  loadEnv();
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }
  cachedClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}

export type AssignedBy = "rule" | "model" | "human";

const ASSIGNED_BY_VALUES: readonly AssignedBy[] = ["rule", "model", "human"];

// Product gate: docs/MASTER_KB.md tagging-spec.md "Do not enable a style
// until the product actually supports it." The DB also blocks this via a
// CHECK constraint on tags.namespace; this guard fails fast client-side.
const FORBIDDEN_NAMESPACE = "question_style";

export type TagRef = { tagId: string } | { namespace: string; slug: string };

export interface TagRow {
  id: string;
  namespace: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
}

export interface UpsertTagInput {
  namespace: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface AddTagToMcqOptions {
  assignedBy: AssignedBy;
  confidence?: number | null;
}

function assertAllowedNamespace(namespace: string): void {
  if (namespace === FORBIDDEN_NAMESPACE) {
    throw new Error(
      `Namespace "${FORBIDDEN_NAMESPACE}" is not enabled yet -- the product ` +
        "doesn't support question-style tagging in the UI. See " +
        "docs/MASTER_KB.md tagging-spec.md (\"Do not enable a style until " +
        "the product actually supports it.\").",
    );
  }
}

function assertAssignedBy(assignedBy: string): asserts assignedBy is AssignedBy {
  if (!ASSIGNED_BY_VALUES.includes(assignedBy as AssignedBy)) {
    throw new Error(
      `Invalid assigned_by "${assignedBy}" -- must be one of: ${ASSIGNED_BY_VALUES.join(", ")}`,
    );
  }
}

/**
 * Create a tag if it doesn't exist (matched on namespace+slug), or update its
 * name/description if it does. Refuses to create tags in the `question_style`
 * namespace -- that dimension isn't enabled yet.
 */
export async function upsertTag(
  input: UpsertTagInput,
  db: SupabaseClient = getServiceClient(),
): Promise<TagRow> {
  assertAllowedNamespace(input.namespace);

  const { data, error } = await db
    .from("tags")
    .upsert(
      {
        namespace: input.namespace,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
      },
      { onConflict: "namespace,slug" },
    )
    .select("id, namespace, name, slug, description, active")
    .single();

  if (error) throw new Error(`upsertTag(${input.namespace}/${input.slug}): ${error.message}`);
  return data as TagRow;
}

/** Resolves a TagRef to a tag id, looking it up by namespace+slug if needed. */
async function resolveTagId(ref: TagRef, db: SupabaseClient): Promise<string> {
  if ("tagId" in ref) return ref.tagId;

  assertAllowedNamespace(ref.namespace);

  const { data, error } = await db
    .from("tags")
    .select("id")
    .eq("namespace", ref.namespace)
    .eq("slug", ref.slug)
    .maybeSingle();

  if (error) throw new Error(`resolveTagId(${ref.namespace}/${ref.slug}): ${error.message}`);
  if (!data) throw new Error(`Tag not found: ${ref.namespace}/${ref.slug}`);
  return data.id as string;
}

/**
 * Attach a tag to an MCQ (idempotent -- upserts on the (mcq_id, tag_id)
 * primary key, so re-tagging updates confidence/assigned_by in place).
 */
export async function addTagToMcq(
  mcqId: string,
  tagRef: TagRef,
  options: AddTagToMcqOptions,
  db: SupabaseClient = getServiceClient(),
): Promise<void> {
  assertAssignedBy(options.assignedBy);
  const tagId = await resolveTagId(tagRef, db);

  const { error } = await db.from("mcq_tags").upsert(
    {
      mcq_id: mcqId,
      tag_id: tagId,
      assigned_by: options.assignedBy,
      confidence: options.confidence ?? null,
    },
    { onConflict: "mcq_id,tag_id" },
  );

  if (error) throw new Error(`addTagToMcq(${mcqId}, ${tagId}): ${error.message}`);
}

/** Detach a tag from an MCQ. No-op (does not throw) if the pairing doesn't exist. */
export async function removeTagFromMcq(
  mcqId: string,
  tagRef: TagRef,
  db: SupabaseClient = getServiceClient(),
): Promise<void> {
  const tagId = await resolveTagId(tagRef, db);

  const { error } = await db
    .from("mcq_tags")
    .delete()
    .eq("mcq_id", mcqId)
    .eq("tag_id", tagId);

  if (error) throw new Error(`removeTagFromMcq(${mcqId}, ${tagId}): ${error.message}`);
}
