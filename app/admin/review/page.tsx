import { createAdminClient } from "@/lib/supabase/admin";
import ReviewTable, { type ReviewMcqRow } from "./ReviewTable";

// Service-role client for the same reason as app/admin/reports/page.tsx:
// correct_answer/explanation are revoked from anon/authenticated entirely
// (20260708000016_lock_mcq_keys.sql), and the admin needs both to decide
// publish vs. reject. This route is already gated admin-only by
// app/admin/layout.tsx.
interface RawMcqRow {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty: number;
  source: string | null;
  created_at: string;
  topics: { name: string } | null;
}

export default async function AdminReviewPage() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("mcqs")
    .select(
      "id, question, options, correct_answer, explanation, difficulty, source, created_at, topics!mcqs_topic_id_fkey ( name )"
    )
    .eq("status", "review")
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <p className="alert-error rounded-lg px-4 py-3 text-sm" role="alert">
        Could not load the review queue: {error.message}
      </p>
    );
  }

  // topics is a many-to-one embed (mcqs.topic_id -> topics.id), so PostgREST
  // returns a single object, but the untyped SupabaseClient (no generated
  // Database schema) infers embeds as arrays -- same cardinality mismatch as
  // lib/coverage.ts. Assert through `unknown` past that.
  const mcqs: ReviewMcqRow[] = ((data as unknown as RawMcqRow[] | null) ?? []).map(
    (m) => ({
      id: m.id,
      question: m.question,
      options: m.options,
      correctAnswer: m.correct_answer,
      explanation: m.explanation,
      difficulty: m.difficulty,
      source: m.source,
      createdAt: m.created_at,
      topicName: m.topics?.name ?? null,
    })
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-heading)]">
          Review Queue
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          MCQs awaiting a publish/reject decision ({mcqs.length}).
        </p>
      </header>
      <ReviewTable mcqs={mcqs} />
    </div>
  );
}
