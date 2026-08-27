import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side admin gate. Call as the first statement in every app/admin
 * server component and admin server action -- not as a substitute for the
 * Postgres RLS / SECURITY DEFINER RPC checks (set_mcq_status,
 * set_question_report_status, assert_can_delete_user), but as an in-app
 * layer on top of them. Admin pages read via the service-role client, which
 * bypasses RLS, so the layout check alone is not enough (layouts don't
 * re-render on client navigation between admin tabs).
 */
export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) redirect("/");

  return user;
}
