import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LayoutWrapper from "@/components/LayoutWrapper";
import AuthShell from "@/components/AuthShell";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set New Password | DiagKnow",
  description: "Create a new password for your DiagKnow account.",
};

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only reachable via the recovery link → callback exchange establishes a
  // session. A signed-out visitor has nothing to reset.
  if (!user) redirect("/auth");

  return (
    <LayoutWrapper>
      <AuthShell title="Set a new password" subtitle="Choose a strong password to secure your account.">
        <ResetPasswordForm />
      </AuthShell>
    </LayoutWrapper>
  );
}
