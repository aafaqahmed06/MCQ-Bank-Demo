import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
// ---------------------------------------------------------------------------
// Phase 8 — live security & functional verification against Supabase.
// Runs the §42 checklist; prints one line per check; exits non-zero on failure.
// ---------------------------------------------------------------------------
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
loadEnv();
const URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const ARCHIVE_MCQ = "heme_coag_001";
const EXPECTED_PUBLISHED = 302;
type Result = { name: string; pass: boolean; detail: string };
const results: Result[] = [];
const failures: string[] = [];
function record(name: string, pass: boolean, detail: string): void {
  results.push({ name, pass, detail });
  const mark = pass ? "PASS" : "FAIL";
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!pass) failures.push(name);
}
function notSensitive(value: unknown): string {
  const s = String(value ?? "");
  if (s.startsWith("eyJ")) return "[token-redacted]";
  return s;
}
async function main(): Promise<void> {
  const admin = createClient(URL, SERVICE_KEY);
  const anon = createClient(URL, ANON_KEY);
  const stamp = Date.now();
  const emailU1 = `pg8.u1.${stamp}@diagknow.test`;
  const emailU2 = `pg8.u2.${stamp}@diagknow.test`;
  const password = "Phase8-verify-pass-1";
  let u1: { id: string; email: string; token: string; refresh: string } | null = null;
  let u2: { id: string; email: string; token: string; refresh: string } | null = null;
  // A client acting as a given user: apikey=anon, Authorization=user JWT.
  const c = async (access: string, refresh: string) => {
    const client = createClient(URL, ANON_KEY);
    await client.auth.setSession({ access_token: access, refresh_token: refresh });
    return client;
  };
  try {
    // ── Provision two fresh users (autoconfirm enabled) ───────────────
    const mk = async (email: string) => {
      const {
        data: { user },
        error,
      } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error || !user) throw new Error(`createUser ${email}: ${error?.message}`);
      const signer = createClient(URL, ANON_KEY);
      const { data: s, error: signErr } = await signer.auth.signInWithPassword({
        email,
        password,
      });
      if (signErr || !s.session) throw new Error(`signIn ${email}: ${signErr?.message}`);
      return {
        id: user.id,
        email,
        token: s.session.access_token,
        refresh: s.session.refresh_token,
      };
    };
    u1 = await mk(emailU1);
    u2 = await mk(emailU2);
    const u1c = await c(u1.token, u1.refresh);
    const u2c = await c(u2.token, u2.refresh);
    // ── A. Anon is locked out of private data ─────────────────────────
    {
      const { data: profiles } = await anon.from("profiles").select("id");
      record("anon cannot read profiles", (profiles?.length ?? 0) === 0, `rows=${profiles?.length ?? 0}`);
      const { data: exams } = await anon.from("exams").select("id");
      record("anon cannot read exams", (exams?.length ?? 0) === 0, `rows=${exams?.length ?? 0}`);
      const { data: progress } = await anon.from("user_topic_progress").select("topic_id");
      record("anon cannot read progress", (progress?.length ?? 0) === 0, `rows=${progress?.length ?? 0}`);
      for (const rpc of ["start_exam", "submit_exam", "get_exam_review"] as const) {
        const { error } = await anon.rpc(rpc, {});
        record(`anon RPC ${rpc} rejected`, !!error, notSensitive(error?.message));
      }
      const { error: lbErr } = await anon.rpc("get_leaderboard", {});
      record("anon RPC get_leaderboard rejected", !!lbErr, notSensitive(lbErr?.message));
    }
    // ── B. Profile RLS + column restriction ────────────────────────────
    {
      const { data: own } = await u1c.from("profiles").select("id, role");
      record("u1 sees own profile", own?.length === 1 && own[0].id === u1.id, `rows=${own?.length ?? 0}`);
      const { data: nonOwn } = await u1c
        .from("profiles")
        .select("id")
        .eq("id", u1.id === u2!.id ? "x" : u2!.id);
      record("u1 cannot read u2 profile", (nonOwn?.length ?? 0) === 0, `rows=${nonOwn?.length ?? 0}`);
      const { error: updNameErr } = await u1c
        .from("profiles")
        .update({ full_name: "Phase8 Student One" })
        .eq("id", u1.id);
      record("u1 can update own full_name", !updNameErr, notSensitive(updNameErr?.message));
      const { error: updRoleErr } = await u1c
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", u1.id);
      record("u1 cannot escalate own role", !!updRoleErr, notSensitive(updRoleErr?.message));
    }
    // ── C. Curriculum + published visibility + archived exclusion ─────
    {
      const count = async (table: "blocks" | "modules" | "topics", cols = "id") =>
        (await anon.from(table).select(cols)).data?.length ?? -1;
      record("anon reads blocks (1)", (await count("blocks")) === 1, `blocks=${await count("blocks")}`);
      const { data: collegeRows } = await anon.from("colleges").select("name");
      const collegeNames = (collegeRows ?? []).map((r) => (r as { name: string }).name);
      record(
        "seed college names correct (no 'Colleg' typo)",
        collegeNames.length === 6 &&
          collegeNames.includes("Foundation University Medical College") &&
          !collegeNames.some((n) => n === "Foundation University Medical Colleg"),
        `count=${collegeNames.length}`,
      );
      record("anon reads modules (4)", (await count("modules")) === 4, `modules=${await count("modules")}`);
      record("anon reads topics (88)", (await count("topics")) === 88, `topics=${await count("topics")}`);
      const { count: published, error: pubErr } = await anon
        .from("mcqs")
        .select("id", { count: "exact", head: true })
        .eq("status", "published");
      record("anon published mcqs count", !pubErr && published === EXPECTED_PUBLISHED, `count=${published ?? -1}`);
      // Archive one mcq → must vanish from published scope.
      let topicId = "";
      try {
        const { data: mcqRow } = await anon.from("mcqs").select("topic_id").eq("id", ARCHIVE_MCQ).single();
        topicId = (mcqRow?.topic_id as string) ?? "";
        const { count: topicBefore } = await anon
          .from("mcqs")
          .select("id", { count: "exact", head: true })
          .eq("status", "published")
          .eq("topic_id", topicId);
        record("archive test topic baseline", topicId !== "" && (topicBefore ?? 0) > 0, `topic=${topicId} before=${topicBefore ?? -1}`);
        await admin.from("mcqs").update({ status: "archived" }).eq("id", ARCHIVE_MCQ);
        const { count: after } = await anon
          .from("mcqs")
          .select("id", { count: "exact", head: true })
          .eq("status", "published");
        record("archived mcq excluded from published", after === EXPECTED_PUBLISHED - 1, `count=${after ?? -1}`);
        const { count: topicAfter } = await anon
          .from("mcqs")
          .select("id", { count: "exact", head: true })
          .eq("status", "published")
          .eq("topic_id", topicId);
        record("practice topic scope honours archive", (topicAfter ?? -1) === (topicBefore ?? 0) - 1, `count=${topicAfter ?? -1}`);
      } finally {
        await admin.from("mcqs").update({ status: "published" }).eq("id", ARCHIVE_MCQ);
      }
      // Students cannot insert MCQs (reviewer/admin only).
      const { error: mInsert } = await u1c
        .from("mcqs")
        .insert({ id: "pg8.rogue", question: "x", options: ["a", "b"], correct_answer: 0, explanation: "e", difficulty: 1 });
      record("student cannot insert mcq", !!mInsert, notSensitive(mInsert?.message));
      // Answer key columns must NOT be readable via REST by anon or students.
      // Migration 016 uses column-level grants to strip correct_answer/explanation.
      const { error: anonKeyErr } = await anon
        .from("mcqs")
        .select("id, correct_answer")
        .limit(1);
      record("anon cannot read correct_answer via REST", !!anonKeyErr, notSensitive(anonKeyErr?.message));
      const { error: studentKeyErr } = await u1c
        .from("mcqs")
        .select("id, correct_answer")
        .limit(1);
      record("authenticated cannot read correct_answer via REST", !!studentKeyErr, notSensitive(studentKeyErr?.message));
      const { error: anonExplErr } = await anon
        .from("mcqs")
        .select("id, explanation")
        .limit(1);
      record("anon cannot read explanation via REST", !!anonExplErr, notSensitive(anonExplErr?.message));
      const { error: studentExplErr } = await u1c
        .from("mcqs")
        .select("id, explanation")
        .limit(1);
      record("authenticated cannot read explanation via REST", !!studentExplErr, notSensitive(studentExplErr?.message));
      // Non-key columns stay readable (question text + options).
      const { data: pubRows, error: pubReadErr } = await anon
        .from("mcqs")
        .select("id, question, options, difficulty")
        .eq("status", "published")
        .limit(5);
      record(
        "non-key mcq columns still readable",
        !pubReadErr && (pubRows?.length ?? 0) === 5,
        `rows=${pubRows?.length ?? 0} ${notSensitive(pubReadErr?.message)}`,
      );
    }
    // ── D. Exam engine ────────────────────────────────────────────────
    let u1ExamId = "";
    let u2ExamId = "";
    let payloadKeys: string[] = [];
    let submitted = false;
    {
      const { data: start, error: startErr } = await u1c.rpc("start_exam", {});
      record("u1 start_exam succeeds", !startErr && !!start?.exam_id, notSensitive(startErr?.message));
      u1ExamId = start?.exam_id as string;
      const qs: unknown[] = start?.questions ?? [];
      payloadKeys = qs.length ? Object.keys(qs[0] as Record<string, unknown>) : [];
      const hasKey = payloadKeys.some((k) => /correct|answer|explanation|^selected$/i.test(k));
      record(
        "start payload key-free",
        !hasKey && qs.length === 20 && payloadKeys.includes("topic"),
        `n=${qs.length} keys=[${payloadKeys.join(",")}]`,
      );
      // Mid-exam REST leak check: exam_questions must NOT expose the key.
      const { data: eq, error: eqErr } = await u1c
        .from("exam_questions")
        .select("mcq_id, correct_answer_in_order, options_order, question_order")
        .eq("exam_id", u1ExamId);
      record(
        "no key leak via REST exam_questions",
        !!eqErr,
        eqErr
          ? notSensitive(eqErr.message)
          : `rows=${(eq ?? []).length} correct_answer_in_order=[${((eq as Record<string, unknown>[])[0]?.["correct_answer_in_order"] ?? "n/a") as string}]`,
      );
      const { data: beforeAns } = await u1c.from("exam_answers").select("id").eq("exam_id", u1ExamId);
      record("no answers before submit", (beforeAns?.length ?? 0) === 0, `rows=${beforeAns?.length ?? 0}`);

      // While the exam is still in progress: review must be refused and a
      // submission containing a non-member MCQ must be rejected atomically
      // (no answers written, exam stays in_progress).
      const { error: preRevErr } = await u1c.rpc("get_exam_review", { p_exam_id: u1ExamId });
      record("review before submit blocked", !!preRevErr, notSensitive(preRevErr?.message));

      const answers = qs.map((q) => ({ mcq_id: (q as { mcq_id: string }).mcq_id, selected_answer: 0 }));
      const rogue = { mcq_id: "does-not-exist-000", selected_answer: 0 };
      const { error: rogueErr } = await u1c.rpc("submit_exam", {
        p_exam_id: u1ExamId,
        p_answers: [...answers.slice(0, 19), rogue],
      });
      record("non-member mcq rejected", !!rogueErr, notSensitive(rogueErr?.message));

      const { data: afterRogue } = await u1c.from("exam_answers").select("id").eq("exam_id", u1ExamId);
      record("rogue submit left no answers", (afterRogue?.length ?? 0) === 0, `rows=${afterRogue?.length ?? 0}`);

      const { data: sub, error: subErr } = await u1c.rpc("submit_exam", {
        p_exam_id: u1ExamId,
        p_answers: answers,
      });
      record(
        "u1 submit_exam succeeds",
        !subErr && sub?.total_questions === 20 && sub?.score === sub?.accuracy && Number.isFinite(Number(sub?.correct_count)),
        notSensitive(subErr?.message),
      );
      submitted = !subErr;
      if (submitted) {
        const correct = Number(sub.correct_count);
        record("score within bounds", correct >= 0 && correct <= 20, `correct=${correct}/20 score=${sub.score}`);
        const { data: ans } = await u1c.from("exam_answers").select("id").eq("exam_id", u1ExamId);
        record("answers persisted", (ans?.length ?? 0) === 20, `rows=${ans?.length ?? 0}`);
        const { data: prog } = await u1c.from("user_topic_progress").select("questions_attempted").eq("user_id", u1.id);
        record("progress upserted", (prog?.length ?? 0) > 0, `rows=${prog?.length ?? 0}`);
        const { data: rev, error: revErr } = await u1c.rpc("get_exam_review", { p_exam_id: u1ExamId });
        const revKeys = ((rev as unknown[])?.[0] ?? {}) as Record<string, unknown>;
        record(
          "review allowed post-submit with keys",
          !revErr && (rev as unknown[])?.length === 20 && "correct_answer" in revKeys && "explanation" in revKeys,
          `n=${(rev as unknown[])?.length ?? 0}`,
        );
        const { error: doubleErr } = await u1c.rpc("submit_exam", { p_exam_id: u1ExamId, p_answers: answers });
        record("double submit rejected", !!doubleErr, notSensitive(doubleErr?.message));
      }
      // Cross-user isolation.
      const { data: u2start } = await u2c.rpc("start_exam", {});
      u2ExamId = u2start?.exam_id as string;
      const { data: notMine } = await u1c.from("exams").select("id").eq("id", u2ExamId);
      record("u1 cannot read u2 exam", (notMine?.length ?? 0) === 0, `rows=${notMine?.length ?? 0}`);
      const { error: crossRev } = await u1c.rpc("get_exam_review", { p_exam_id: u2ExamId });
      record("cross-user review rejected", !!crossRev, notSensitive(crossRev?.message));
      const { error: crossSub } = await u1c.rpc("submit_exam", { p_exam_id: u2ExamId, p_answers: [] });
      record("cross-user submit rejected", !!crossSub, notSensitive(crossSub?.message));
    }
    // ── E. Bookmarks ───────────────────────────────────────────────────
    {
      const { error: bmErr } = await u1c.from("bookmarks").insert({ user_id: u1.id, mcq_id: ARCHIVE_MCQ });
      record("u1 bookmarks mcq", !bmErr, notSensitive(bmErr?.message));
      const { data: bm1 } = await u1c.from("bookmarks").select("mcq_id").eq("user_id", u1.id);
      record("u1 reads own bookmarks", (bm1?.length ?? 0) === 1, `rows=${bm1?.length ?? 0}`);
      const { data: bm2 } = await u2c.from("bookmarks").select("mcq_id").eq("user_id", u2.id);
      record("u2 bookmarks isolated from u1", (bm2?.length ?? 0) === 0, `rows=${bm2?.length ?? 0}`);
      const { error: dupErr } = await u1c.from("bookmarks").insert({ user_id: u1.id, mcq_id: ARCHIVE_MCQ });
      record("duplicate bookmark rejected (pk)", !!dupErr, notSensitive(dupErr?.message));
      const { error: spoofErr } = await u1c.from("bookmarks").insert({ user_id: u2!.id, mcq_id: "some-mcq" });
      record("bookmark spoof to other user rejected", !!spoofErr, notSensitive(spoofErr?.message));
    }
    // ── F. Question reports ────────────────────────────────────────────
    {
      const { data: rep, error: repErr } = await u1c
        .from("question_reports")
        .insert({ user_id: u1.id, mcq_id: ARCHIVE_MCQ, reason: "typo", description: "see" })
        .select("id");
      record("u1 creates report", !repErr && (rep?.length ?? 0) === 1, notSensitive(repErr?.message));
      const { data: repOwn } = await u1c.from("question_reports").select("id").eq("user_id", u1.id);
      record("u1 reads own reports", (repOwn?.length ?? 0) === 1, `rows=${repOwn?.length ?? 0}`);
      const { data: repU2 } = await u2c.from("question_reports").select("id").eq("user_id", u2.id);
      record("u2 reports isolated", (repU2?.length ?? 0) === 0, `rows=${repU2?.length ?? 0}`);
      const { error: dupReportErr } = await u1c
        .from("question_reports")
        .insert({ user_id: u1.id, mcq_id: ARCHIVE_MCQ, reason: "ambiguous" });
      record("duplicate open report rejected", !!dupReportErr, notSensitive(dupReportErr?.message));
      if (rep?.length) {
        const { error: resolveErr } = await u1c.from("question_reports").update({ status: "resolved" }).eq("id", rep[0].id);
        const { data: after } = await u1c.from("question_reports").select("status").eq("id", rep[0].id).single();
        record(
          "student cannot resolve report (reviewer-only)",
          !resolveErr && (after?.status as string) === "open",
          `unchanged=${(after?.status as string) ?? "n/a"} err=${notSensitive(resolveErr?.message)}`,
        );
      }
    }
    // ── G. Progress write protection ───────────────────────────────────
    {
      const { data: ownProg } = await u1c.from("user_topic_progress").select("topic_id").eq("user_id", u1.id);
      record("u1 reads own progress", (ownProg?.length ?? 0) > 0, `rows=${ownProg?.length ?? 0}`);
      const { data: u2Prog } = await u2c.from("user_topic_progress").select("topic_id").eq("user_id", u2.id);
      record("u2 progress empty (no exams)", (u2Prog?.length ?? 0) === 0, `rows=${u2Prog?.length ?? 0}`);
      const { error: progInsert } = await u1c.from("user_topic_progress").insert({
        user_id: u1.id,
        topic_id: "sub-physiology-coagulation-cascade",
        questions_attempted: 1,
      });
      record("student cannot forge progress", !!progInsert, notSensitive(progInsert?.message));
    }
    // ── H. Leaderboard — aggregates only, no PII ───────────────────────
    {
      const { data: lb, error: lbErr } = await u1c.rpc("get_leaderboard", {});
      const row = (lb as Record<string, unknown>[] | null)?.[0];
      record("leaderboard returns aggregates", !lbErr && Array.isArray(lb), notSensitive(lbErr?.message));
      if (row) {
        const cols = Object.keys(row);
        const leaked = cols.filter((k) => /user_id|email|refresh_token|correct_answer_in_order/i.test(k));
        record("leaderboard has no PII/key fields", leaked.length === 0, `cols=[${cols.join(",")}]`);
      }
      const { data: lbBig, error: lbBigErr } = await u1c.rpc("get_leaderboard", { p_limit: 1000 });
      record("leaderboard p_limit clamped", !lbBigErr && Array.isArray(lbBig) && (lbBig?.length ?? 0) <= 100, `rows=${String((lbBig as unknown[])?.length ?? "n/a")}`);
    }
    // ── Summary ────────────────────────────────────────────────────────
    const passCount = results.filter((r) => r.pass).length;
    console.log(
      `\nPhase 8 summary: ${passCount}/${results.length} passed; ${failures.length} failed.`,
    );
    if (failures.length) {
      console.log(`Failed: ${failures.join(" | ")}`);
      process.exit(1);
    }
  } finally {
    for (const u of [u1, u2]) {
      if (u) await admin.auth.admin.deleteUser(u.id).catch(() => undefined);
    }
  }
}
main().catch((err) => {
  console.error("Phase 8 aborted:", err);
  process.exit(2);
});
