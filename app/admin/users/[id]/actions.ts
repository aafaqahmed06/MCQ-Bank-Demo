"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/requireAdmin";

// Error-only: redirect() throws internally on success, so no `ok: true`
// value is ever actually returned to a caller on the happy path.
export type DeleteAccountResult = { ok: false; error: string };

export async function deleteUserAccount(
  targetId: string,
  confirmedEmail: string
): Promise<DeleteAccountResult> {
  // Blanket in-app admin gate; the assert_can_delete_user RPC below is the
  // authoritative check (self-deletion + admin/super_admin tier rule).
  await requireAdmin();

  const session = await createClient();
  const {
    data: { user: caller },
  } = await session.auth.getUser();

  if (!caller) {
    return { ok: false, error: "Not authenticated." };
  }

  // Re-verify via the CALLER'S OWN session client (auth.uid() resolves from
  // the request JWT even inside a SECURITY DEFINER function) -- never trust
  // that app/admin/layout.tsx already gated this. Covers is_admin(),
  // self-deletion, and the admin/super_admin role-tier rule in one call.
  const { error: guardError } = await session.rpc("assert_can_delete_user", {
    p_target: targetId,
  });
  if (guardError) {
    return { ok: false, error: guardError.message };
  }

  const admin = createAdminClient();

  // Independently fetch the target's REAL email -- never trust a
  // client-supplied value for the confirmation comparison below.
  const { data: authUser, error: fetchErr } = await admin.auth.admin.getUserById(targetId);
  if (fetchErr || !authUser?.user?.email) {
    return { ok: false, error: "Could not verify target account." };
  }
  const realEmail = authUser.user.email;

  if (confirmedEmail !== realEmail) {
    return { ok: false, error: "Typed email does not match the account's email." };
  }

  // Insert the audit row BEFORE calling deleteUser(). True cross-system
  // transactionality isn't possible (HTTP call to Auth, not a SQL
  // statement) -- if deleteUser() then fails, compensate by removing the
  // row so the log never claims a deletion that didn't happen.
  const { data: logRow, error: logError } = await admin
    .from("admin_actions")
    .insert({
      admin_id: caller.id,
      action: "delete_user",
      target_user_id: targetId,
      target_email: realEmail,
    })
    .select("id")
    .single();

  if (logError || !logRow) {
    return { ok: false, error: "Failed to write audit log; deletion aborted." };
  }

  // Cascade handles all dependent rows (profiles, exams, exam_questions,
  // exam_answers, bookmarks, question_reports, user_topic_progress,
  // practice_attempts) via ON DELETE CASCADE on every FK to auth.users --
  // no manual cleanup needed here.
  const { error: deleteError } = await admin.auth.admin.deleteUser(targetId);

  if (deleteError) {
    const { error: compensateError } = await admin
      .from("admin_actions")
      .delete()
      .eq("id", logRow.id);

    if (compensateError) {
      return {
        ok: false,
        error: `Deletion failed AND audit log cleanup failed (log id ${logRow.id}). Manual review required.`,
      };
    }
    return { ok: false, error: `Deletion failed: ${deleteError.message}` };
  }

  redirect("/admin/users");
}
