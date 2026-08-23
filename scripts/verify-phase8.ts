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
        const attemptedSum = (prog ?? []).reduce((sum, r) => sum + Number(r.questions_attempted), 0);
        record(
          "progress counts equal exam size",
          attemptedSum === 20,
          `attempted=${attemptedSum}/20 rows=${prog?.length ?? 0}`,
        );
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
    // ── I. Practice attempts + Smart Practice ──────────────────────────
    {
      const { data: anonRows, error: anonReadErr } = await anon.from("practice_attempts").select("id");
      record(
        "anon cannot read practice_attempts",
        !anonReadErr ? (anonRows?.length ?? 0) === 0 : true,
        anonReadErr ? notSensitive(anonReadErr.message) : `rows=${anonRows?.length ?? 0}`,
      );
      const { error: anonRecordErr } = await anon.rpc("record_practice_attempt", {
        p_mcq_id: ARCHIVE_MCQ,
        p_selected_option_index: 0,
      });
      record("anon RPC record_practice_attempt rejected", !!anonRecordErr, notSensitive(anonRecordErr?.message));
      const { error: anonSmartErr } = await anon.rpc("get_smart_practice_questions", {});
      record("anon RPC get_smart_practice_questions rejected", !!anonSmartErr, notSensitive(anonSmartErr?.message));

      const { data: mcqRow } = await admin
        .from("mcqs")
        .select("topic_id, correct_answer")
        .eq("id", ARCHIVE_MCQ)
        .single();
      const correctIdx = mcqRow?.correct_answer as number;
      const topicId = mcqRow?.topic_id as string;
      const wrongIdx = correctIdx === 0 ? 1 : 0;

      const { data: correctRes, error: correctErr } = await u1c.rpc("record_practice_attempt", {
        p_mcq_id: ARCHIVE_MCQ,
        p_selected_option_index: correctIdx,
      });
      record(
        "record_practice_attempt derives is_correct=true server-side",
        !correctErr && correctRes?.is_correct === true,
        notSensitive(correctErr?.message),
      );
      const { data: wrongRes, error: wrongErr } = await u1c.rpc("record_practice_attempt", {
        p_mcq_id: ARCHIVE_MCQ,
        p_selected_option_index: wrongIdx,
      });
      record(
        "record_practice_attempt derives is_correct=false server-side",
        !wrongErr && wrongRes?.is_correct === false,
        notSensitive(wrongErr?.message),
      );

      const { data: ownAttempts } = await u1c
        .from("practice_attempts")
        .select("id, is_correct")
        .eq("mcq_id", ARCHIVE_MCQ);
      record("u1 reads own practice attempts", (ownAttempts?.length ?? 0) === 2, `rows=${ownAttempts?.length ?? 0}`);

      const { data: u2Attempts } = await u2c.from("practice_attempts").select("id").eq("mcq_id", ARCHIVE_MCQ);
      record("u2 cannot see u1 practice attempts", (u2Attempts?.length ?? 0) === 0, `rows=${u2Attempts?.length ?? 0}`);

      const { error: directInsertErr } = await u1c.from("practice_attempts").insert({
        user_id: u1.id,
        mcq_id: ARCHIVE_MCQ,
        topic_id: topicId,
        selected_option_index: correctIdx,
        is_correct: true,
      });
      record("student cannot insert practice_attempts directly (RPC-only)", !!directInsertErr, notSensitive(directInsertErr?.message));

      const { data: progRow } = await u1c
        .from("user_topic_progress")
        .select("practice_questions_attempted, practice_questions_correct, practice_accuracy, practice_last_attempted_at")
        .eq("topic_id", topicId)
        .single();
      record(
        "practice_* progress cache updated (exam-sourced columns untouched)",
        (progRow?.practice_questions_attempted ?? 0) >= 2 && progRow?.practice_last_attempted_at != null,
        `attempted=${progRow?.practice_questions_attempted} correct=${progRow?.practice_questions_correct} accuracy=${progRow?.practice_accuracy}`,
      );

      // u1 already has exam history from Section D -- Smart Practice's
      // topic weighting must pick that up even though it never reads
      // user_topic_progress's exam-sourced columns directly. u1 has ~22
      // combined attempts at this point (20 exam answers + 2 practice
      // attempts above) -- below the real default of 25, so this call
      // overrides p_min_attempts down to keep the suite fast without
      // needing 25 real attempts; the eligibility gate itself is exercised
      // separately below.
      const smartCount = 20;
      const { data: smart, error: smartErr } = await u1c.rpc("get_smart_practice_questions", {
        p_question_count: smartCount,
        p_min_attempts: 3,
        p_debug: true,
      });
      const smartQuestions: { topic_id: string; question_weight?: number; correct_answer: number }[] =
        smart?.questions ?? [];
      record(
        "u1 get_smart_practice_questions succeeds",
        !smartErr && smart?.eligible === true && smartQuestions.length > 0 && "correct_answer" in (smartQuestions[0] ?? {}),
        `n=${smartQuestions.length} eligible=${smart?.eligible} ${notSensitive(smartErr?.message)}`,
      );
      record(
        "smart practice debug weights present",
        smartQuestions.length > 0 && typeof smartQuestions[0]?.question_weight === "number",
        `sample=${JSON.stringify(smartQuestions[0] ?? {})}`,
      );
      const perTopicCount = new Map<string, number>();
      for (const q of smartQuestions) {
        perTopicCount.set(q.topic_id, (perTopicCount.get(q.topic_id) ?? 0) + 1);
      }
      const maxShare = smartQuestions.length > 0
        ? Math.max(...perTopicCount.values()) / smartQuestions.length
        : 0;
      record(
        "no topic exceeds 30% share of smart practice set",
        maxShare <= 0.3 + 1e-9,
        `maxShare=${maxShare.toFixed(2)} topics=${perTopicCount.size}`,
      );
      // Seed data has 88 topics across the bank -- comfortably more than
      // the min-topics floor, so this asserts the floor itself, not a
      // tautology derived from the same result set.
      record(
        "smart practice represents >= 5 distinct topics",
        (smart?.topics_included ?? 0) >= 5,
        `topics_included=${smart?.topics_included}`,
      );

      // ── Guaranteed-slot reservation for missed questions ────────────
      // Backdate a miss (30 days ago) on a topic u1 has NEVER touched by
      // any other attempt -- weight's recency term uses max(attempted_at)
      // across ALL of a topic's/mcq's attempts, so backdating a miss on
      // ARCHIVE_MCQ (which already has two same-day attempts from earlier
      // in this section) would be masked by those more recent timestamps.
      // A clean, untouched topic makes max(ts) unambiguously the backdated
      // value, pushing recency_weight near the R_MAX ceiling (~2.2 total),
      // far above the ~1.2 baseline every unseen candidate has.
      const { data: examMcqRows } = await admin
        .from("exam_answers")
        .select("mcq_id")
        .eq("exam_id", u1ExamId);
      const examMcqIds = (examMcqRows ?? []).map((r) => r.mcq_id as string);
      const { data: examMcqTopicRows } = await admin
        .from("mcqs")
        .select("id, topic_id")
        .in("id", examMcqIds.length ? examMcqIds : [""]);
      const excludedTopics = new Set<string>([
        topicId,
        ...(examMcqTopicRows ?? []).map((m) => m.topic_id as string),
      ]);
      const { data: candidatePool } = await admin
        .from("mcqs")
        .select("id, topic_id, correct_answer")
        .eq("status", "published");
      const freshCandidate = (candidatePool ?? []).find(
        (m) => !excludedTopics.has(m.topic_id as string),
      );
      record("found an untouched-topic candidate for the backdated-miss fixture", !!freshCandidate, `id=${freshCandidate?.id}`);

      const freshMcqId = freshCandidate?.id as string;
      const freshTopicId = freshCandidate?.topic_id as string;
      const freshCorrectIdx = freshCandidate?.correct_answer as number;
      const freshWrongIdx = freshCorrectIdx === 0 ? 1 : 0;

      const backdated = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { error: backdateErr } = await admin.from("practice_attempts").insert({
        user_id: u1.id,
        mcq_id: freshMcqId,
        topic_id: freshTopicId,
        selected_option_index: freshWrongIdx,
        is_correct: false,
        attempted_at: backdated,
      });
      record("backdated miss fixture inserted", !backdateErr, notSensitive(backdateErr?.message));

      const { data: backdatedRows } = await admin
        .from("practice_attempts")
        .select("attempted_at")
        .eq("user_id", u1.id)
        .eq("mcq_id", freshMcqId)
        .lt("attempted_at", new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString());
      record(
        "backdated timestamp actually persisted (admin bypasses no trigger that would reset it)",
        (backdatedRows?.length ?? 0) === 1,
        `rows=${backdatedRows?.length ?? 0}`,
      );

      const { data: guaranteed, error: guaranteedErr } = await u1c.rpc("get_smart_practice_questions", {
        p_question_count: 40,
        p_min_attempts: 3,
        p_debug: true,
      });
      const guaranteedQuestions: { mcq_id: string; topic_id: string; reserved?: boolean; topic_weight?: number }[] =
        guaranteed?.questions ?? [];
      const archiveRow = guaranteedQuestions.find((q) => q.mcq_id === freshMcqId);
      const otherTopicWeights = [...new Set(guaranteedQuestions.map((q) => q.topic_weight))].sort(
        (a, b) => (b ?? 0) - (a ?? 0),
      );
      record(
        "long-overdue miss is guaranteed a reserved slot, not just weighted",
        !guaranteedErr && archiveRow?.reserved === true,
        archiveRow
          ? JSON.stringify(archiveRow)
          : `not present among ${guaranteedQuestions.length} questions; top topic_weights=${JSON.stringify(otherTopicWeights.slice(0, 5))} err=${notSensitive(guaranteedErr?.message)}`,
      );
      // Ground truth: freshMcqId is the only mcq with misses > 0 in this
      // topic. reserved_count = min(floor(slot_count*0.5), 1) can only ever
      // be 0 or 1 -- but topicRows.length (returned row count) isn't a
      // reliable proxy for the topic's true slot_count when the topic has
      // fewer total published mcqs than its allocation (fine-grained
      // subtopics here often have just 1-2 mcqs total), so this only
      // asserts the invariant that IS knowable from the client-visible
      // response, not a precise slot_count-derived prediction.
      const topicRows = guaranteedQuestions.filter((q) => q.topic_id === freshTopicId);
      const reservedInTopic = topicRows.filter((q) => q.reserved === true).length;
      record(
        "reserved count in that topic never exceeds the real missed-mcq count (1)",
        reservedInTopic <= 1,
        `topicRows=${topicRows.length} reserved=${reservedInTopic}`,
      );

      // ── Eligibility gate: u2 has 0 combined attempts (their exam from
      // Section D was started but never submitted, so it has no
      // exam_answers with is_correct set) -- a clean below/at/above-
      // threshold fixture without touching u1's already-mixed history.
      const { error: anonEligErr } = await anon.rpc("get_smart_practice_eligibility", {});
      record("anon RPC get_smart_practice_eligibility rejected", !!anonEligErr, notSensitive(anonEligErr?.message));

      const { data: eligDefault, error: eligDefaultErr } = await u2c.rpc("get_smart_practice_eligibility", {});
      record(
        "u2 below default threshold (25) reports correctly",
        !eligDefaultErr && eligDefault?.eligible === false && eligDefault?.attempts === 0 && eligDefault?.min_attempts === 25,
        `${JSON.stringify(eligDefault)} ${notSensitive(eligDefaultErr?.message)}`,
      );

      const { data: eligBelow } = await u2c.rpc("get_smart_practice_eligibility", { p_min_attempts: 3 });
      record(
        "u2 below overridden threshold (3)",
        eligBelow?.eligible === false && eligBelow?.attempts === 0 && eligBelow?.min_attempts === 3,
        JSON.stringify(eligBelow),
      );

      const { data: eligAtZero } = await u2c.rpc("get_smart_practice_eligibility", { p_min_attempts: 0 });
      record(
        "u2 eligible once threshold is 0 (edge: attempts >= min_attempts)",
        eligAtZero?.eligible === true && eligAtZero?.attempts === 0 && eligAtZero?.min_attempts === 0,
        JSON.stringify(eligAtZero),
      );

      // get_smart_practice_questions must enforce the SAME gate itself --
      // not just report it -- with a structured response, never a raw
      // error and never a silent fallback to (uninformative) questions.
      const { data: gatedDefault, error: gatedDefaultErr } = await u2c.rpc("get_smart_practice_questions", {});
      record(
        "u2 get_smart_practice_questions enforces default gate (no raw error, no fallback questions)",
        !gatedDefaultErr &&
          gatedDefault?.eligible === false &&
          gatedDefault?.attempts === 0 &&
          gatedDefault?.min_attempts === 25 &&
          Array.isArray(gatedDefault?.questions) &&
          gatedDefault.questions.length === 0 &&
          gatedDefault?.topics_included === 0,
        `${JSON.stringify(gatedDefault)} ${notSensitive(gatedDefaultErr?.message)}`,
      );

      const { data: gatedOverride, error: gatedOverrideErr } = await u2c.rpc("get_smart_practice_questions", {
        p_min_attempts: 0,
      });
      record(
        "u2 get_smart_practice_questions serves questions once threshold override is met",
        !gatedOverrideErr && gatedOverride?.eligible === true && (gatedOverride?.questions?.length ?? 0) > 0,
        `n=${gatedOverride?.questions?.length ?? 0} ${notSensitive(gatedOverrideErr?.message)}`,
      );
    }

    // ── Summary ────────────────────────────────────────────────────────
    const passCount = results.filter((r) => r.pass).length;
    console.log(
      `\nPhase 8 summary: ${passCount}/${results.length} passed; ${failures.length} failed.`,
    );
    if (failures.length) {
      console.log(`Failed: ${failures.join(" | ")}`);
      process.exitCode = 1;
    }
  } finally {
    // process.exit() terminates before pending awaits run, so a failed check
    // above must set process.exitCode (not call process.exit) or this cleanup
    // never fires and the throwaway users leak into the database permanently.
    const leftover: string[] = [];
    for (const u of [u1, u2]) {
      if (!u) continue;
      const { error } = await admin.auth.admin.deleteUser(u.id);
      if (error) leftover.push(`${u.email} (${u.id}): ${error.message}`);
    }
    if (leftover.length) {
      console.error(`CLEANUP FAILED — leftover test user(s), delete manually:\n  ${leftover.join("\n  ")}`);
      process.exitCode = 1;
    }
  }
}
main().catch((err) => {
  console.error("Phase 8 aborted:", err);
  process.exit(2);
});
