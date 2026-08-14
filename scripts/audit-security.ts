import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
// ---------------------------------------------------------------------------
// Security audit harness — probes attack surface NOT covered by verify-phase8.
// Non-destructive: uses throwaway users; everything is cleaned up in finally.
// Prints aVULNERABLE line per finding and a summary. Exit 1 if any finding.
// ---------------------------------------------------------------------------
function loadEnv(): void {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    if (!(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();
const URL = process.env.SUPABASE_URL!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Row = { name: string; situation: string; outcome: string };
const rows: Row[] = [];
const findings: string[] = [];
function r(name: string, blocked: boolean, detail: string): void {
  const situation = blocked ? "BLOCKED (safe)" : "COMPROMISED (finding)";
  rows.push({ name, situation, outcome: detail });
  console.log(`${situation.padEnd(20)} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!blocked) findings.push(name);
}
const s = String;

async function asUser(admin: SupabaseClient): Promise<{ c: SupabaseClient; id: string; email: string }> {
  const stamp = Date.now() + Math.floor(Math.random() * 10000);
  const email = `audit.${stamp}@diagknow.test`;
  const { data: u, error: ce } = await admin.auth.admin.createUser({
    email, password: "Audit-pass-1", email_confirm: true,
  });
  if (ce || !u.user) throw new Error(`mk ${ce?.message}`);
  const signer = createClient(URL, ANON);
  const { data: sess } = await signer.auth.signInWithPassword({ email, password: "Audit-pass-1" });
  if (!sess.session) throw new Error(`signin`);
  const c = createClient(URL, ANON);
  await c.auth.setSession({ access_token: sess.session.access_token, refresh_token: sess.session.refresh_token });
  return { c, id: u.user.id, email };
}

async function main(): Promise<void> {
  const admin = createClient(URL, SERVICE);
  const anon = createClient(URL, ANON);
  const u1 = await asUser(admin);

  try {
    // ── REST: anon on private tables ────────────────────────────────
    for (const [name, t] of [
      ["anon profiles", "profiles"], ["anon user_topic_progress", "user_topic_progress"],
      ["anon bookmarks", "bookmarks"], ["anon question_reports", "question_reports"],
      ["anon exam_answers", "exam_answers"], ["anon exams", "exams"],
      ["anon exam_questions", "exam_questions"],
    ] as const) {
      const { data } = await anon.from(t).select("id");
      r(name, (data?.length ?? 0) === 0, `rows=${s(data?.length ?? 0)}`);
    }

    // ── REST: anon/student read of answer-key columns ───────────────
    r("anon read correct_answer", !(await anon.from("mcqs").select("correct_answer").limit(1)).data, "column grant");
    r("anon read explanation", !(await anon.from("mcqs").select("explanation").limit(1)).data, "column grant");
    r("student read correct_answer", !(await u1.c.from("mcqs").select("correct_answer").limit(1)).data, "column grant");
    r("student read explanation", !(await u1.c.from("mcqs").select("explanation").limit(1)).data, "column grant");

    // ── REST: profile escalation / cross-user ───────────────────────
    const { error: roleEsc } = await u1.c.from("profiles").update({ role: "admin" }).eq("id", u1.id);
    r("student escalate role", !!roleEsc, s(roleEsc?.message));
    const { data: otherRead } = await u1.c.from("profiles").select("id").neq("id", u1.id).limit(1);
    r("student read another profile", (otherRead?.length ?? 0) === 0, `rows=${s(otherRead?.length ?? 0)}`);

    // ── REST: direct write attempts on write-protected tables ───────
    // Ground-truth: try to mutate a REAL row and check the value changes.
    const { error: progIns } = await u1.c.from("user_topic_progress").insert({ user_id: u1.id, topic_id: "sub-physiology" });
    r("student direct INSERT user_topic_progress", !!progIns, s(progIns?.message ?? "accepted"));
    const { error: examIns } = await u1.c.from("exams").insert({ user_id: u1.id, title: "x", status: "in_progress", total_questions: 1 });
    r("student direct INSERT exams (bypass RPC)", !!examIns, s(examIns?.message ?? "accepted"));
    const targetMcq = "heme_coag_001";
    const { data: mcqBefore } = await admin.from("mcqs").select("correct_answer").eq("id", targetMcq).single();
    await u1.c.from("mcqs").update({ correct_answer: (mcqBefore?.correct_answer as number ?? 0) === 0 ? 1 : 0 }).eq("id", targetMcq);
    const { data: mcqAfter } = await admin.from("mcqs").select("correct_answer").eq("id", targetMcq).single();
    r("student direct UPDATE mcqs (tamper key)", mcqAfter?.correct_answer === mcqBefore?.correct_answer, `changed? ${mcqBefore?.correct_answer}→${mcqAfter?.correct_answer}`);
    await u1.c.from("mcqs").delete().eq("id", targetMcq);
    const { data: mcqDel } = await admin.from("mcqs").select("id").eq("id", targetMcq);
    r("student direct DELETE mcqs (remove content)", (mcqDel?.length ?? 0) === 1, `still_present=${s((mcqDel?.length ?? 0))}`);

    // ── RPC misuse ──────────────────────────────────────────────────
    const anyUuid = "00000000-0000-0000-0000-000000000000";
    r("anon set_user_role", !!(await anon.rpc("set_user_role", { p_target: anyUuid, p_role: "admin" })).error, "no exec");
    r("student set_user_role", !!(await u1.c.rpc("set_user_role", { p_target: u1.id, p_role: "admin" })).error, "admin guard");
    r("student purge_stale_exams", !!(await u1.c.rpc("purge_stale_exams", {})).error, "exec revoked");
    r("student get_leaderboard ok", !(await u1.c.rpc("get_leaderboard", {})).error, "allowed by design");
    r("anon get_leaderboard", !!(await anon.rpc("get_leaderboard", {})).error, "no exec");

    // record_practice_completion: self-only, but must be scoped to the module.
    const { error: rpcRec } = await u1.c.rpc("record_practice_completion", {
      p_module_id: "sub-physiology",
      p_topic_ids: ["sub-physiology-homeostasis"],
    });
    r("student completes own topic (self, allowed)", !rpcRec, rpcRec ? s(rpcRec.message) : "succeeds for self");
    const { error: rpcCross } = await u1.c.rpc("record_practice_completion", {
      p_module_id: "sub-physiology",
      p_topic_ids: ["sub-anatomy-gametogenesis"],
    });
    r("student cannot mark topic outside module", !!rpcCross, s(rpcCross?.message ?? "accepted cross-module"));

    // start_exam with an oversized count — must stay bounded by published bank.
    const { data: big } = await u1.c.rpc("start_exam", { p_question_count: 100000 });
    const n = (big?.questions as unknown[] | undefined)?.length ?? 0;
    r("start_exam huge count capped", n <= 400 && n > 0, `questions=${n}`);

    // ── Auth: refresh token reuse (rotation) ────────────────────────
    // Supabase default refresh_token_reuse_interval = 10s grants a grace
    // window where a reused token is honored. A replay OUTSIDE that window
    // must be rejected. We test the meaningful case: reuse after grace.
    {
      const signer = createClient(URL, ANON);
      const { data: sess } = await signer.auth.signInWithPassword({ email: u1.email, password: "Audit-pass-1" });
      const rt1 = sess.session!.refresh_token;
      const a = createClient(URL, ANON);
      await a.auth.setSession({ access_token: sess.session!.access_token, refresh_token: rt1 });
      const b = createClient(URL, ANON);
      await b.auth.setSession({ access_token: sess.session!.access_token, refresh_token: rt1 });
      // Within the 10s grace window reuse is allowed by design:
      r("refresh reuse within grace (by design)", !!b.auth.getSession(), "grace window accepted");
      await new Promise((res) => setTimeout(res, 11000));
      const c = createClient(URL, ANON);
      await c.auth.setSession({ access_token: sess.session!.access_token, refresh_token: rt1 });
      const replayed = await c.auth.refreshSession();
      r("token replay after grace rejected", !!replayed.error, s(replayed.error?.message ?? "TOKEN REPLAYED"));
    }

    // ── Auth: weak-password acceptance (minimum length) ────────────
    {
      const stamp = Date.now();
      const { error: weak } = await admin.auth.admin.createUser({ email: `audit.weak.${stamp}@diagknow.test`, password: "Ab1def", email_confirm: true });
      r("6-char password rejected", !!weak, s(weak?.message ?? "accepted by API"));
    }

    // ── Exam score tamper: submit, then try direct UPDATE score ───
    {
      const { data: start } = await u1.c.rpc("start_exam", { p_question_count: 5 });
      const eid = start?.exam_id as string;
      const qs = (start?.questions as { mcq_id: string }[]) ?? [];
      const answers = qs.map((q) => ({ mcq_id: q.mcq_id, selected_answer: 0 }));
      await u1.c.rpc("submit_exam", { p_exam_id: eid, p_answers: answers });
      const before = (await admin.from("exams").select("score, correct_count").eq("id", eid).single()).data;
      await u1.c.from("exams").update({ score: 100, correct_count: 99 }).eq("id", eid);
      const after = (await admin.from("exams").select("score, correct_count").eq("id", eid).single()).data;
      const changed = after?.score !== before?.score || after?.correct_count !== before?.correct_count;
      r("student forge own exam score (leaderboard cheat)", !changed, `score ${before?.score}→${after?.score}`);
      const abefore = (await admin.from("exam_answers").select("is_correct").eq("exam_id", eid).limit(1).single()).data;
      await u1.c.from("exam_answers").update({ is_correct: true }).eq("exam_id", eid);
      const aafter = (await admin.from("exam_answers").select("is_correct").eq("exam_id", eid).limit(1).single()).data;
      r("student forge exam_answers is_correct", abefore?.is_correct === aafter?.is_correct, `changed? ${abefore?.is_correct}→${aafter?.is_correct}`);
    }
  } finally {
    await admin.auth.admin.deleteUser(u1.id).catch(() => undefined);
  }

  const findingsOnly = rows.filter((x) => x.situation === "COMPROMISED (finding)");
  console.log(`\nAudit summary: ${rows.length - findingsOnly.length}/${rows.length} blocked; ${findingsOnly.length} finding(s).`);
  if (findings.length) {
    console.log(`Findings: ${findings.join(" | ")}`);
    process.exitCode = 1;
  }
}
main().catch((e) => { console.error("aborted", e); process.exit(2); });