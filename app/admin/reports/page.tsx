import { createAdminClient } from "@/lib/supabase/admin";
import ReportsTable, { type ReportRow } from "./ReportsTable";

// Service-role client, not the cookie-based server client: mcqs.correct_answer
// and mcqs.explanation are revoked from anon/authenticated entirely
// (20260708000016_lock_mcq_keys.sql), so an admin's own session can never
// read them over PostgREST regardless of role. This route is already gated
// admin-only by app/admin/layout.tsx, so reading the answer key here (to let
// the admin judge an "incorrect answer" report, for example) is in scope.
interface RawReportRow {
  id: string;
  reason: string;
  description: string | null;
  created_at: string;
  mcq_id: string;
  mcqs: {
    question: string;
    options: string[];
    correct_answer: number;
    explanation: string;
  } | null;
}

export default async function AdminReportsPage() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("question_reports")
    .select(
      "id, reason, description, created_at, mcq_id, mcqs ( question, options, correct_answer, explanation )"
    )
    .eq("status", "open")
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <p className="alert-error rounded-lg px-4 py-3 text-sm" role="alert">
        Could not load reports: {error.message}
      </p>
    );
  }

  // mcqs is a many-to-one embed (question_reports.mcq_id -> mcqs.id), so
  // PostgREST returns a single object, but the untyped SupabaseClient (no
  // generated Database schema) infers embeds as arrays -- same cardinality
  // mismatch as lib/coverage.ts. Assert through `unknown` past that.
  const reports: ReportRow[] = ((data as unknown as RawReportRow[] | null) ?? []).map(
    (r) => ({
      id: r.id,
      reason: r.reason,
      description: r.description,
      createdAt: r.created_at,
      mcqId: r.mcq_id,
      mcq: r.mcqs,
    })
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-heading)]">
          Open Reports
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Student-submitted content reports awaiting review ({reports.length}).
        </p>
      </header>
      <ReportsTable reports={reports} />
    </div>
  );
}
