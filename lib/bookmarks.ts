import { createClient } from "@/lib/supabase/client";

export type BookmarkedQuestion = {
  mcqId: string;
  question: string;
  topicId: string;
  topicName: string;
  moduleId: string;
  moduleName: string;
  bookmarkedAt: string;
};

/**
 * Client-side (RLS-scoped to the signed-in user) fetch of every bookmarked
 * question, joined with topic/subject names for the Bookmarks page's
 * subject filter. `mcqs` grants authenticated `id, topic_id, question,
 * options, ...` but not `correct_answer`/`explanation` (migration
 * 20260708000016) -- fine here, this listing never needs the answer key.
 */
export async function getBookmarkedQuestions(): Promise<BookmarkedQuestion[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: bookmarkRows, error } = await supabase
    .from("bookmarks")
    .select("mcq_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`bookmarks: ${error.message}`);
  if (!bookmarkRows || bookmarkRows.length === 0) return [];

  const mcqIds = bookmarkRows.map((r) => r.mcq_id as string);
  const { data: mcqRows, error: mErr } = await supabase
    .from("mcqs")
    .select("id, question, topic_id")
    .in("id", mcqIds);
  if (mErr) throw new Error(`mcqs: ${mErr.message}`);

  const topicIds = [...new Set((mcqRows ?? []).map((m) => m.topic_id as string))];
  const { data: topicRows } = await supabase
    .from("topics")
    .select("id, name, module_id")
    .in("id", topicIds.length ? topicIds : [""]);

  const moduleIds = [...new Set((topicRows ?? []).map((t) => t.module_id as string))];
  const { data: moduleRows } = await supabase
    .from("modules")
    .select("id, name")
    .in("id", moduleIds.length ? moduleIds : [""]);

  const topicById = new Map((topicRows ?? []).map((t) => [t.id as string, t]));
  const moduleNameById = new Map((moduleRows ?? []).map((m) => [m.id as string, m.name as string]));
  const mcqById = new Map((mcqRows ?? []).map((m) => [m.id as string, m]));
  const createdAtByMcq = new Map(bookmarkRows.map((r) => [r.mcq_id as string, r.created_at as string]));

  // Iterate mcqIds (already created_at-desc from the bookmarks query) rather
  // than mcqRows, whose .in() order isn't guaranteed.
  return mcqIds
    .map((mcqId): BookmarkedQuestion | null => {
      const mcq = mcqById.get(mcqId);
      if (!mcq) return null;
      const topic = topicById.get(mcq.topic_id as string);
      const moduleId = (topic?.module_id as string) ?? "";
      return {
        mcqId,
        question: mcq.question as string,
        topicId: (mcq.topic_id as string) ?? "",
        topicName: (topic?.name as string) ?? "Unknown topic",
        moduleId,
        moduleName: moduleNameById.get(moduleId) ?? "",
        bookmarkedAt: createdAtByMcq.get(mcqId) ?? "",
      };
    })
    .filter((b): b is BookmarkedQuestion => b !== null);
}
