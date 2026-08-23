import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatLastActive } from "@/lib/activity";
import DeleteAccountSection from "./DeleteAccountSection";

// Service-role client: RLS on user_topic_progress, exams, and
// practice_attempts is locked to `user_id = auth.uid()` with no is_admin()
// bypass (20260708000009_rls.sql, 20260708000029_practice_attempts.sql), so
// an admin's own session cannot read another student's rows here regardless
// of role -- same reasoning as app/admin/users/page.tsx for the profile/email
// lookup. The explicit .eq("user_id", ...) filters below are mandatory here
// (not just for security): service-role bypasses RLS entirely, so they are
// the only thing scoping these queries to one student.
interface ProgressRow {
  topic_id: string;
  questions_attempted: number;
  questions_correct: number;
  practice_questions_attempted: number;
  practice_questions_correct: number;
  completed: boolean;
  last_attempted_at: string | null;
  topics: { name: string } | null;
}

interface ExamRow {
  score: number | null;
  correct_count: number;
  total_questions: number;
  submitted_at: string | null;
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const admin = createAdminClient();

  // Session-scoped client, used only to identify the caller for the delete
  // section below -- everything else on this page still reads via the
  // service-role client as before.
  const session = await createClient();
  const {
    data: { user: caller },
  } = await session.auth.getUser();
  const { data: callerProfile } = caller
    ? await session.from("profiles").select("role").eq("id", caller.id).single()
    : { data: null };

  const [{ data: profile, error: profileError }, { data: progressData }, { data: examData }] =
    await Promise.all([
      admin
        .from("profiles")
        .select(
          "id, full_name, role, last_active_at, created_at, colleges ( name ), programs ( name ), academic_years ( name )"
        )
        .eq("id", id)
        .single(),
      admin
        .from("user_topic_progress")
        .select(
          "topic_id, questions_attempted, questions_correct, practice_questions_attempted, practice_questions_correct, completed, last_attempted_at, topics ( name )"
        )
        .eq("user_id", id),
      admin
        .from("exams")
        .select("score, correct_count, total_questions, submitted_at")
        .eq("user_id", id)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false }),
    ]);

  if (profileError || !profile) {
    notFound();
  }

  const { data: authUser } = await admin.auth.admin.getUserById(id);

  // Many-to-one embeds (topics, colleges, programs, academic_years) come
  // back as single objects from PostgREST but the untyped SupabaseClient
  // infers them as arrays -- same cardinality mismatch as
  // app/admin/users/page.tsx and lib/coverage.ts.
  const p = profile as unknown as {
    id: string;
    full_name: string | null;
    role: "student" | "reviewer" | "admin" | "super_admin";
    last_active_at: string | null;
    created_at: string;
    colleges: { name: string } | null;
    programs: { name: string } | null;
    academic_years: { name: string } | null;
  };
  const progress = (progressData as unknown as ProgressRow[] | null) ?? [];
  const exams = (examData as ExamRow[] | null) ?? [];

  // Same reduction HomeDashboard.tsx does client-side for the current user,
  // just parameterized by target user id instead of relying on auth.uid().
  const practiceAttempted = progress.reduce(
    (sum, r) => sum + r.practice_questions_attempted,
    0
  );
  const practiceCorrect = progress.reduce(
    (sum, r) => sum + r.practice_questions_correct,
    0
  );
  const practiceAccuracy =
    practiceAttempted > 0
      ? Math.round((practiceCorrect / practiceAttempted) * 100)
      : null;

  const examsCompleted = exams.length;
  const avgScore =
    examsCompleted > 0
      ? Math.round(
          (exams.reduce((sum, e) => sum + Number(e.score ?? 0), 0) /
            examsCompleted) *
            10
        ) / 10
      : null;

  const display = [p.colleges?.name, p.programs?.name, p.academic_years?.name]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="text-sm font-medium text-[var(--text-muted-light)] hover:text-[var(--text-heading)]"
      >
        ← All users
      </Link>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-heading)]">
          {p.full_name ?? "(no name)"}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          {authUser?.user?.email ?? "—"}
          {display ? ` · ${display}` : ""} · {p.role} · last active{" "}
          {formatLastActive(p.last_active_at)}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="hud-card rounded-xl p-5">
          <p className="text-3xl font-semibold tabular-nums text-[var(--text-heading)]">
            {practiceAttempted}
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Questions practiced</p>
        </div>
        <div className="hud-card rounded-xl p-5">
          <p className="text-3xl font-semibold tabular-nums text-[var(--text-heading)]">
            {practiceAccuracy === null ? "—" : `${practiceAccuracy}%`}
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Practice accuracy</p>
        </div>
        <div className="hud-card rounded-xl p-5">
          <p className="text-3xl font-semibold tabular-nums text-[var(--text-heading)]">
            {examsCompleted}
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Exams completed</p>
        </div>
        <div className="hud-card rounded-xl p-5">
          <p className="text-3xl font-semibold tabular-nums text-[var(--text-heading)]">
            {avgScore === null ? "—" : `${avgScore}%`}
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Avg exam score</p>
        </div>
      </div>

      <div className="hud-card overflow-x-auto rounded-xl p-4 sm:p-6">
        <h2 className="mb-3 text-base font-semibold text-[var(--text-heading)]">
          Per-topic progress
        </h2>
        {progress.length === 0 ? (
          <p className="hud-muted text-sm">No practice or exam activity yet.</p>
        ) : (
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-xs uppercase tracking-wide text-[var(--text-muted-light)]">
                <th className="px-3 py-3 font-medium">Topic</th>
                <th className="px-3 py-3 text-right font-medium">Exam attempted/correct</th>
                <th className="px-3 py-3 text-right font-medium">Practice attempted/correct</th>
                <th className="px-3 py-3 font-medium">Completed</th>
              </tr>
            </thead>
            <tbody>
              {progress
                .slice()
                .sort((a, b) => (a.topics?.name ?? "").localeCompare(b.topics?.name ?? ""))
                .map((row) => (
                  <tr
                    key={row.topic_id}
                    className="border-b border-[var(--border-color)] text-[var(--text-body)] last:border-0"
                  >
                    <td className="px-3 py-3 font-medium text-[var(--text-heading)]">
                      {row.topics?.name ?? row.topic_id}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.questions_attempted}/{row.questions_correct}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.practice_questions_attempted}/{row.practice_questions_correct}
                    </td>
                    <td className="px-3 py-3">{row.completed ? "Yes" : "No"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {caller && (
        <DeleteAccountSection
          targetId={p.id}
          targetName={p.full_name}
          targetEmail={authUser?.user?.email ?? ""}
          targetRole={p.role}
          callerId={caller.id}
          callerRole={
            (callerProfile?.role as "student" | "reviewer" | "admin" | "super_admin" | undefined) ??
            "student"
          }
          stats={{ practiceAttempted, practiceAccuracy, examsCompleted, avgScore }}
        />
      )}
    </div>
  );
}
